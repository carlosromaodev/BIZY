import { createHash } from "node:crypto";
import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioClientes
} from "../dominio/repositorios/contratos.js";
import type { Cliente360, ComentarioLive, DadosCliente360, EventoSistema, Reserva, StatusMensagemAtendimento } from "../dominio/tipos.js";
import { extrairInformacoesComprovativoPdf, type InformacoesComprovativoPdf } from "./ExtratorComprovativoPdf.js";

type Logger = Pick<Console, "error" | "warn">;

interface MediaAtendimentoRecebida {
  tipo?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  caption?: string | null;
  url?: string | null;
  dataUrl?: string | null;
  base64?: string | null;
  tamanhoBytes?: number | null;
  sha256?: string | null;
}

interface MediaPersistidaAtendimento {
  url: string;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  size?: number | null;
  metadataUrl?: string | null;
}

interface AtendimentoCrmOpcoes {
  persistirMedia?: (dataUrl: string, media: MediaAtendimentoRecebida) => Promise<MediaPersistidaAtendimento | null>;
  baixarMediaUrl?: (url: string, media: MediaAtendimentoRecebida) => Promise<string | null>;
}

export class AtendimentoCrmUseCase {
  constructor(
    eventos: DespachadorEventos,
    private readonly repositorioAtendimento: RepositorioAtendimento,
    private readonly repositorioAuditoria: RepositorioAuditoria,
    private readonly logger: Logger = console,
    private readonly repositorioClientes?: RepositorioClientes,
    private readonly opcoes: AtendimentoCrmOpcoes = {}
  ) {
    eventos.aoReceberQualquer((evento) => {
      void this.processarEvento(evento).catch((erro) => {
        this.logger.error("[crm] Falha ao sincronizar atendimento", erro);
      });
    });
  }

  private async processarEvento(evento: EventoSistema): Promise<void> {
    if (evento.tipo === "COMMENT_PARSED") {
      await this.registrarComentario(evento);
      return;
    }

    if (evento.tipo === "RESERVATION_CREATED" || evento.tipo === "RESERVATION_WAITLISTED") {
      await this.registrarEventoReserva(evento);
      return;
    }

    if (evento.tipo === "PAYMENT_CONFIRMED") {
      await this.registrarEventoReserva(evento, "Pagamento confirmado.");
      return;
    }

    if (evento.tipo === "WHATSAPP_MESSAGE_SENT") {
      await this.registrarWhatsappEnviado(evento);
      return;
    }

    if (evento.tipo === "WHATSAPP_MESSAGE_FAILED") {
      await this.registrarWhatsappFalhado(evento);
      return;
    }

    if (evento.tipo === "WHATSAPP_MESSAGE_RECEIVED") {
      await this.registrarWhatsappRecebido(evento);
      return;
    }

    if (evento.tipo === "WHATSAPP_MESSAGE_STATUS") {
      await this.registrarStatusWhatsapp(evento);
      return;
    }

    if (evento.tipo === "INSTAGRAM_DM_RECEIVED") {
      await this.registrarInstagramRecebido(evento);
      return;
    }

    if (evento.tipo === "INSTAGRAM_DM_SENT") {
      await this.registrarInstagramEnviado(evento);
    }
  }

  private async registrarComentario(evento: EventoSistema): Promise<void> {
    const comentario = this.obterObjeto(evento.dados.comentario) as unknown as ComentarioLive;
    const interpretacao = this.obterObjeto(evento.dados.interpretacao);
    const telefone = this.obterString(interpretacao.phone);
    const texto = this.obterString(comentario.commentText);
    const negocioId = this.obterString(evento.dados.negocioId);

    if (!telefone || !texto) return;

    const cliente = await this.sincronizarCliente({
      negocioId,
      telefone,
      nome: this.obterString(comentario.displayName),
      username: this.obterString(comentario.username),
      userId: this.obterString(comentario.userId),
      avatarUrl: this.obterString(comentario.avatarUrl),
      origem: "comentario_live",
      consentimentoDados: true,
      ultimaInteracaoEm: this.obterData(comentario.timestamp) ?? new Date()
    });

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: cliente?.id ?? null,
      telefone,
      nomeCliente: this.obterString(comentario.displayName),
      usernameCliente: this.obterString(comentario.username),
      userIdCliente: this.obterString(comentario.userId),
      avatarUrlCliente: this.obterString(comentario.avatarUrl),
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "live",
      tipo: "COMENTARIO_LIVE",
      conteudo: texto,
      status: "RECEIVED",
      origem: "comentario_live",
      provider: comentario.provider,
      providerMessageId: this.gerarIdempotenciaComentario(comentario),
      contexto: {
        liveId: comentario.liveId,
        provider: comentario.provider,
        source: comentario.source,
        userId: comentario.userId ?? null,
        avatarUrl: comentario.avatarUrl ?? null,
        timestamp: comentario.timestamp
      }
    });
  }

  private async registrarEventoReserva(evento: EventoSistema, descricaoOverride?: string): Promise<void> {
    const reserva = this.obterObjeto(evento.dados.reserva) as unknown as Reserva;
    const telefone = this.obterString(reserva.telefoneCliente);
    const reservaId = this.obterString(reserva.id);
    const negocioId = this.obterString(reserva.negocioId) ?? this.obterString(evento.dados.negocioId);

    if (!telefone || !reservaId) return;

    const cliente = await this.sincronizarCliente({
      negocioId,
      telefone,
      nome: this.obterString(reserva.nomeCliente),
      username: this.obterString(reserva.usernameCliente),
      userId: this.obterString(reserva.userIdCliente),
      avatarUrl: this.obterString(reserva.avatarUrlCliente),
      origem: "reserva",
      consentimentoDados: true,
      ultimaInteracaoEm: reserva.atualizadaEm ?? reserva.criadaEm ?? new Date()
    });

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: reserva.clienteNegocioId ?? cliente?.id ?? null,
      telefone,
      nomeCliente: this.obterString(reserva.nomeCliente),
      usernameCliente: this.obterString(reserva.usernameCliente),
      userIdCliente: this.obterString(reserva.userIdCliente),
      avatarUrlCliente: this.obterString(reserva.avatarUrlCliente),
      direcao: "OUTBOUND",
      remetente: "sistema",
      canal: "sistema",
      tipo: evento.tipo,
      conteudo: descricaoOverride ?? this.descreverEventoReserva(evento.tipo, reserva),
      status: "SENT",
      origem: "evento_reserva",
      reservaId,
      contexto: evento.dados
    });
  }

  private async registrarWhatsappEnviado(evento: EventoSistema): Promise<void> {
    const dados = evento.dados;
    const telefone = this.obterString(dados.telefone);
    const conteudo = this.obterString(dados.conteudo);
    const tipo = this.obterString(dados.tipo) ?? "WHATSAPP";
    const negocioId = this.obterNegocioIdDoContexto(dados.contexto) ?? this.obterString(dados.negocioId);

    if (!telefone || !conteudo) return;

    const cliente = await this.sincronizarCliente({
      negocioId,
      telefone,
      nome: this.obterNomeClienteDoContexto(dados.contexto),
      username: this.obterUsernameClienteDoContexto(dados.contexto),
      userId: this.obterUserIdClienteDoContexto(dados.contexto),
      avatarUrl: this.obterAvatarUrlClienteDoContexto(dados.contexto),
      origem: "whatsapp",
      consentimentoDados: true,
      ultimaInteracaoEm: this.obterData(dados.enviadoEm) ?? new Date()
    });

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: cliente?.id ?? null,
      telefone,
      nomeCliente: this.obterNomeClienteDoContexto(dados.contexto),
      usernameCliente: this.obterUsernameClienteDoContexto(dados.contexto),
      userIdCliente: this.obterUserIdClienteDoContexto(dados.contexto),
      avatarUrlCliente: this.obterAvatarUrlClienteDoContexto(dados.contexto),
      direcao: "OUTBOUND",
      remetente: tipo.startsWith("MANUAL") ? "agente" : "sistema",
      canal: "whatsapp",
      tipo,
      conteudo,
      provider: this.obterString(dados.provider),
      providerMessageId: this.obterString(dados.idExterno),
      status: "SENT",
      origem: "whatsapp",
      reservaId: this.obterReservaIdDoContexto(dados.contexto),
      contexto: this.obterObjeto(dados.contexto),
      enviadaEm: this.obterData(dados.enviadoEm)
    });
  }

  private async registrarWhatsappFalhado(evento: EventoSistema): Promise<void> {
    const dados = evento.dados;
    const telefone = this.obterString(dados.telefone);
    const conteudo = this.obterString(dados.conteudo);
    const tipo = this.obterString(dados.tipo) ?? "WHATSAPP";
    const negocioId = this.obterNegocioIdDoContexto(dados.contexto) ?? this.obterString(dados.negocioId);

    if (!telefone || !conteudo) return;

    const cliente = await this.sincronizarCliente({
      negocioId,
      telefone,
      nome: this.obterNomeClienteDoContexto(dados.contexto),
      username: this.obterUsernameClienteDoContexto(dados.contexto),
      userId: this.obterUserIdClienteDoContexto(dados.contexto),
      avatarUrl: this.obterAvatarUrlClienteDoContexto(dados.contexto),
      origem: "whatsapp",
      consentimentoDados: true,
      ultimaInteracaoEm: this.obterData(dados.ocorridoEm) ?? new Date()
    });

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: cliente?.id ?? null,
      telefone,
      nomeCliente: this.obterNomeClienteDoContexto(dados.contexto),
      usernameCliente: this.obterUsernameClienteDoContexto(dados.contexto),
      userIdCliente: this.obterUserIdClienteDoContexto(dados.contexto),
      avatarUrlCliente: this.obterAvatarUrlClienteDoContexto(dados.contexto),
      direcao: "OUTBOUND",
      remetente: tipo.startsWith("MANUAL") ? "agente" : "sistema",
      canal: "whatsapp",
      tipo,
      conteudo,
      provider: "whatsapp-falhou",
      status: "FAILED",
      origem: "whatsapp",
      reservaId: this.obterReservaIdDoContexto(dados.contexto),
      erro: this.obterString(dados.erro),
      contexto: this.obterObjeto(dados.contexto),
      enviadaEm: this.obterData(dados.ocorridoEm)
    });
  }

  private async registrarWhatsappRecebido(evento: EventoSistema): Promise<void> {
    const mensagem = this.obterObjeto(evento.dados.mensagem);
    const telefone = this.obterString(mensagem.telefone);
    const media = this.obterObjeto(mensagem.media) as MediaAtendimentoRecebida;
    const preparacaoMedia = await this.prepararMediaRecebida(media);
    const conteudo = this.montarConteudoWhatsappRecebido(mensagem, media, preparacaoMedia.comprovativo);
    const negocioId = this.obterNegocioIdDoContexto(mensagem.payloadOriginal) ?? this.obterString(mensagem.negocioId);

    if (!telefone || !conteudo) return;

    const cliente = await this.sincronizarCliente({
      negocioId,
      telefone,
      nome: this.obterString(mensagem.nomeCliente),
      username: this.obterString(mensagem.username ?? mensagem.usernameCliente),
      userId: this.obterString(mensagem.userId ?? mensagem.userIdCliente),
      avatarUrl: this.obterString(mensagem.avatarUrl ?? mensagem.avatarUrlCliente),
      origem: "whatsapp",
      consentimentoDados: true,
      ultimaInteracaoEm: this.obterData(mensagem.recebidaEm) ?? new Date()
    });

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: cliente?.id ?? null,
      telefone,
      nomeCliente: this.obterString(mensagem.nomeCliente),
      usernameCliente: this.obterString(mensagem.username ?? mensagem.usernameCliente),
      userIdCliente: this.obterString(mensagem.userId ?? mensagem.userIdCliente),
      avatarUrlCliente: this.obterString(mensagem.avatarUrl ?? mensagem.avatarUrlCliente),
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "whatsapp",
      tipo: preparacaoMedia.comprovativo ? "COMPROVATIVO_PAGAMENTO" : "RECEBIDA",
      conteudo,
      provider: this.obterString(mensagem.provider),
      providerMessageId: this.obterString(mensagem.idMensagem),
      status: "RECEIVED",
      origem: "whatsapp",
      contexto: {
        ...this.sanitizarPayloadWhatsapp(mensagem.payloadOriginal),
        ...(preparacaoMedia.media ? { media: preparacaoMedia.media } : {}),
        ...(preparacaoMedia.comprovativo ? { comprovativo: preparacaoMedia.comprovativo } : {})
      },
      enviadaEm: this.obterData(mensagem.recebidaEm)
    });
  }

  private async prepararMediaRecebida(media: MediaAtendimentoRecebida): Promise<{
    media: Record<string, unknown> | null;
    comprovativo: InformacoesComprovativoPdf | null;
  }> {
    const tipo = this.obterString(media.tipo);
    const mimeType = this.obterString(media.mimeType);
    const urlOriginal = this.obterString(media.url);
    const dataUrl = await this.resolverDataUrlMedia(media, mimeType, urlOriginal);
    const mediaNormalizada: Record<string, unknown> | null = tipo || mimeType
      ? {
          tipo,
          mimeType,
          fileName: this.obterString(media.fileName),
          caption: this.obterString(media.caption),
          url: urlOriginal,
          ...(urlOriginal ? { originalUrl: urlOriginal } : {}),
          tamanhoBytes: typeof media.tamanhoBytes === "number" ? media.tamanhoBytes : null,
          sha256: this.obterString(media.sha256)
        }
      : null;

    if (mimeType !== "application/pdf" || !dataUrl) {
      return { media: mediaNormalizada, comprovativo: null };
    }

    const [comprovativo, armazenamento] = await Promise.all([
      extrairInformacoesComprovativoPdf(dataUrl).catch((erro) => {
        this.logger.warn("[crm] Falha ao extrair comprovativo PDF", erro);
        return null;
      }),
      this.opcoes.persistirMedia?.(dataUrl, media).catch((erro) => {
        this.logger.warn("[crm] Falha ao persistir comprovativo PDF", erro);
        return null;
      }) ?? Promise.resolve(null)
    ]);

    return {
      media: {
        ...mediaNormalizada,
        ...(armazenamento
          ? {
              url: armazenamento.url,
              ...(mediaNormalizada?.originalUrl ? { originalUrl: mediaNormalizada.originalUrl } : {}),
              thumbnailUrl: armazenamento.thumbnailUrl ?? null,
              metadataUrl: armazenamento.metadataUrl ?? null,
              tamanhoBytes: armazenamento.size ?? mediaNormalizada?.tamanhoBytes ?? null
            }
          : {})
      },
      comprovativo
    };
  }

  private async resolverDataUrlMedia(
    media: MediaAtendimentoRecebida,
    mimeType: string | null,
    urlOriginal: string | null
  ): Promise<string | null> {
    const dataUrlLocal = this.obterString(media.dataUrl) ?? this.montarDataUrlMedia(media);
    if (dataUrlLocal) return dataUrlLocal;
    if (mimeType !== "application/pdf" || !urlOriginal || !this.opcoes.baixarMediaUrl) return null;

    return this.opcoes.baixarMediaUrl(urlOriginal, media).catch((erro) => {
      this.logger.warn("[crm] Falha ao baixar media recebida pelo WhatsApp", erro);
      return null;
    });
  }

  private montarConteudoWhatsappRecebido(
    mensagem: Record<string, unknown>,
    media: MediaAtendimentoRecebida,
    comprovativo: InformacoesComprovativoPdf | null
  ): string | null {
    const texto = this.obterString(mensagem.texto);
    if (texto) return texto;

    const caption = this.obterString(media.caption);
    if (caption) return caption;

    const fileName = this.obterString(media.fileName);
    if (comprovativo) {
      const partes = [
        `Comprovativo PDF recebido${fileName ? `: ${fileName}` : "."}`,
        comprovativo.valorEmKwanza ? `Valor: ${comprovativo.valorEmKwanza} Kz` : null,
        comprovativo.referencia ? `Referência: ${comprovativo.referencia}` : null
      ].filter(Boolean);
      return partes.join(" | ");
    }

    const tipo = this.obterString(media.tipo);
    if (tipo || fileName) return `${tipo === "document" ? "Documento" : "Media"} recebido${fileName ? `: ${fileName}` : "."}`;
    return null;
  }

  private montarDataUrlMedia(media: MediaAtendimentoRecebida): string | null {
    const base64 = this.obterString(media.base64);
    const mimeType = this.obterString(media.mimeType);
    if (!base64 || !mimeType || !/^[A-Za-z0-9+/=]+$/.test(base64)) return null;
    return `data:${mimeType};base64,${base64}`;
  }

  private sanitizarPayloadWhatsapp(payload: unknown): Record<string, unknown> {
    const copia = this.clonarSemMediaPesada(payload);
    return this.obterObjeto(copia);
  }

  private clonarSemMediaPesada(valor: unknown): unknown {
    if (Array.isArray(valor)) return valor.map((item) => this.clonarSemMediaPesada(item));
    if (!valor || typeof valor !== "object") return valor;

    const resultado: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
      if (["media", "base64", "file"].includes(chave) && typeof item === "string" && item.length > 256) {
        resultado[chave] = "[removido:conteudo-media]";
        continue;
      }
      resultado[chave] = this.clonarSemMediaPesada(item);
    }
    return resultado;
  }

  private async registrarStatusWhatsapp(evento: EventoSistema): Promise<void> {
    const status = this.obterObjeto(evento.dados.status);
    const providerMessageId = this.obterString(status.idMensagem);
    const statusProvider = this.obterString(status.statusProvider);
    const erroStatus = this.descreverErroStatusWhatsapp(statusProvider, this.obterString(status.erroProvider));

    if (!providerMessageId || !statusProvider) return;

    const mensagemAnterior = await this.repositorioAtendimento.buscarMensagemPorProviderMessageId(providerMessageId);
    const statusInterno = this.mapearStatusProvider(statusProvider);
    const mensagemAtualizada = await this.repositorioAtendimento.atualizarStatusMensagemPorProviderMessageId(
      providerMessageId,
      {
        status: statusInterno,
        erro: statusInterno === "FAILED" ? erroStatus : null
      }
    );

    if (
      statusInterno === "FAILED" &&
      mensagemAtualizada &&
      mensagemAnterior?.status !== "FAILED" &&
      !this.ehReprocessamentoDeStatusEvolution(mensagemAtualizada.contexto)
    ) {
      await this.repositorioAuditoria.criarMensagemWhatsAppPendente({
        negocioId: mensagemAtualizada.negocioId,
        telefone: mensagemAtualizada.telefone,
        tipo: mensagemAtualizada.tipo,
        conteudo: mensagemAtualizada.conteudo,
        contexto: {
          ...mensagemAtualizada.contexto,
          reprocessamento: "status_evolution",
          providerMessageId
        },
        ultimoErro: erroStatus
      });
      this.logger.warn(`[crm] WhatsApp ${providerMessageId} falhou de forma assíncrona e foi reenfileirado.`);
    }
  }

  private async registrarInstagramRecebido(evento: EventoSistema): Promise<void> {
    const mensagem = this.obterObjeto(evento.dados.mensagem);
    const username = this.obterString(mensagem.username);
    const texto = this.obterString(mensagem.texto);
    const negocioId = this.obterString(mensagem.negocioId);

    if (!username || !texto) return;

    const telefoneVirtual = `ig:${username}`;
    const nomeCliente = this.obterString(mensagem.nomeCompleto) ?? username;

    const cliente = await this.sincronizarCliente({
      negocioId,
      telefone: telefoneVirtual,
      nome: nomeCliente,
      username,
      userId: this.obterString(mensagem.userId),
      avatarUrl: this.obterString(mensagem.avatarUrl),
      origem: "instagram",
      consentimentoDados: true,
      ultimaInteracaoEm: this.obterData(mensagem.recebidaEm) ?? new Date()
    });

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: cliente?.id ?? null,
      telefone: telefoneVirtual,
      nomeCliente,
      usernameCliente: username,
      userIdCliente: this.obterString(mensagem.userId),
      avatarUrlCliente: this.obterString(mensagem.avatarUrl),
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "instagram",
      tipo: this.obterString(mensagem.tipoMensagem) ?? "RECEBIDA",
      conteudo: texto,
      provider: "instagrapi",
      providerMessageId: this.obterString(mensagem.idMensagem),
      status: "RECEIVED",
      origem: "instagram",
      contexto: {
        instancia: this.obterString(mensagem.instancia),
        threadId: this.obterString(mensagem.threadId),
        mediaUrl: this.obterString(mensagem.mediaUrl)
      },
      enviadaEm: this.obterData(mensagem.recebidaEm)
    });
  }

  private async registrarInstagramEnviado(evento: EventoSistema): Promise<void> {
    const mensagem = this.obterObjeto(evento.dados.mensagem);
    const username = this.obterString(mensagem.username);
    const texto = this.obterString(mensagem.texto);
    const negocioId = this.obterString(mensagem.negocioId);

    if (!username || !texto) return;

    const telefoneVirtual = `ig:${username}`;

    await this.repositorioAtendimento.registrarMensagem({
      negocioId,
      telefone: telefoneVirtual,
      nomeCliente: this.obterString(mensagem.nomeCompleto) ?? username,
      usernameCliente: username,
      userIdCliente: this.obterString(mensagem.userId),
      avatarUrlCliente: this.obterString(mensagem.avatarUrl),
      direcao: "OUTBOUND",
      remetente: "sistema",
      canal: "instagram",
      tipo: "INSTAGRAM_DM",
      conteudo: texto,
      provider: "instagrapi",
      providerMessageId: this.obterString(mensagem.idMensagem),
      status: "SENT",
      origem: "instagram",
      contexto: {
        instancia: this.obterString(mensagem.instancia),
        threadId: this.obterString(mensagem.threadId)
      },
      enviadaEm: this.obterData(mensagem.recebidaEm)
    });
  }

  private mapearStatusProvider(status: string): StatusMensagemAtendimento {
    const normalizado = status.trim().toUpperCase();
    if (["ERROR", "FAILED", "FAILURE"].includes(normalizado)) return "FAILED";
    if (["READ"].includes(normalizado)) return "READ";
    if (["DELIVERED", "SERVER_ACK", "DELIVERY_ACK"].includes(normalizado)) return "DELIVERED";
    return "SENT";
  }

  private descreverErroStatusWhatsapp(statusProvider: string | null, detalheProvider: string | null): string {
    const status = statusProvider?.trim() || "desconhecido";
    if (detalheProvider) return `Evolution marcou a mensagem como ${status}: ${detalheProvider}`;
    return `Evolution marcou a mensagem como ${status} sem detalhe do provider. A instância pode aparecer OPEN e ainda assim falhar para números externos; faça logout/conecte novamente por QR e, se persistir, trate como limitação do provider Baileys e migre o envio para WhatsApp Cloud API ou outro provider oficial.`;
  }

  private ehReprocessamentoDeStatusEvolution(contexto: Record<string, unknown>): boolean {
    return this.obterString(contexto.reprocessamento) === "status_evolution";
  }

  private descreverEventoReserva(tipo: string, reserva: Reserva): string {
    if (tipo === "RESERVATION_WAITLISTED") {
      return `Cliente entrou na fila de espera para a peça #${reserva.codigoPeca}.`;
    }

    return `Reserva criada para a peça #${reserva.codigoPeca}. Pagamento pendente.`;
  }

  private async sincronizarCliente(
    dados: Omit<DadosCliente360, "negocioId"> & { negocioId: string | null }
  ): Promise<Cliente360 | null> {
    if (!this.repositorioClientes || !dados.negocioId) return null;

    try {
      return await this.repositorioClientes.sincronizar({
        ...dados,
        negocioId: dados.negocioId
      });
    } catch (erro) {
      this.logger.warn("[crm] Falha ao sincronizar Cliente 360", erro);
      return null;
    }
  }

  private obterReservaIdDoContexto(contexto: unknown): string | null {
    const reserva = this.obterObjeto(this.obterObjeto(contexto).reserva);
    return this.obterString(reserva.id);
  }

  private obterNegocioIdDoContexto(contexto: unknown): string | null {
    const dados = this.obterObjeto(contexto);
    const reserva = this.obterObjeto(dados.reserva);
    return this.obterString(dados.negocioId) ?? this.obterString(reserva.negocioId);
  }

  private obterNomeClienteDoContexto(contexto: unknown): string | null {
    const reserva = this.obterObjeto(this.obterObjeto(contexto).reserva);
    return this.obterString(reserva.nomeCliente);
  }

  private obterUsernameClienteDoContexto(contexto: unknown): string | null {
    const reserva = this.obterObjeto(this.obterObjeto(contexto).reserva);
    return this.obterString(reserva.usernameCliente);
  }

  private obterUserIdClienteDoContexto(contexto: unknown): string | null {
    const reserva = this.obterObjeto(this.obterObjeto(contexto).reserva);
    return this.obterString(reserva.userIdCliente);
  }

  private obterAvatarUrlClienteDoContexto(contexto: unknown): string | null {
    const reserva = this.obterObjeto(this.obterObjeto(contexto).reserva);
    return this.obterString(reserva.avatarUrlCliente);
  }

  private obterObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }

  private obterString(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim().length > 0 ? valor : null;
  }

  private obterData(valor: unknown): Date | undefined {
    if (valor instanceof Date) return valor;
    if (typeof valor === "string") {
      const data = new Date(valor);
      return Number.isNaN(data.getTime()) ? undefined : data;
    }

    return undefined;
  }

  private gerarIdempotenciaComentario(comentario: ComentarioLive): string {
    const partes = [
      comentario.source,
      comentario.provider,
      comentario.liveId,
      comentario.username,
      comentario.commentText,
      comentario.timestamp instanceof Date ? comentario.timestamp.toISOString() : String(comentario.timestamp)
    ];
    const hash = createHash("sha256").update(partes.join("|")).digest("hex").slice(0, 24);
    return `comentario-live:${hash}`;
  }
}
