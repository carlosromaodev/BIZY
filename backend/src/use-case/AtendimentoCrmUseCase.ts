import { createHash } from "node:crypto";
import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioAtendimento, RepositorioAuditoria } from "../dominio/repositorios/contratos.js";
import type { ComentarioLive, EventoSistema, Reserva, StatusMensagemAtendimento } from "../dominio/tipos.js";

type Logger = Pick<Console, "error" | "warn">;

export class AtendimentoCrmUseCase {
  constructor(
    eventos: DespachadorEventos,
    private readonly repositorioAtendimento: RepositorioAtendimento,
    private readonly repositorioAuditoria: RepositorioAuditoria,
    private readonly logger: Logger = console
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
    }
  }

  private async registrarComentario(evento: EventoSistema): Promise<void> {
    const comentario = this.obterObjeto(evento.dados.comentario) as unknown as ComentarioLive;
    const interpretacao = this.obterObjeto(evento.dados.interpretacao);
    const telefone = this.obterString(interpretacao.phone);
    const texto = this.obterString(comentario.commentText);

    if (!telefone || !texto) return;

    await this.repositorioAtendimento.registrarMensagem({
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

    if (!telefone || !reservaId) return;

    await this.repositorioAtendimento.registrarMensagem({
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

    if (!telefone || !conteudo) return;

    await this.repositorioAtendimento.registrarMensagem({
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

    if (!telefone || !conteudo) return;

    await this.repositorioAtendimento.registrarMensagem({
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
    const conteudo = this.obterString(mensagem.texto);

    if (!telefone || !conteudo) return;

    await this.repositorioAtendimento.registrarMensagem({
      telefone,
      nomeCliente: this.obterString(mensagem.nomeCliente),
      usernameCliente: this.obterString(mensagem.username ?? mensagem.usernameCliente),
      userIdCliente: this.obterString(mensagem.userId ?? mensagem.userIdCliente),
      avatarUrlCliente: this.obterString(mensagem.avatarUrl ?? mensagem.avatarUrlCliente),
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "whatsapp",
      tipo: "RECEBIDA",
      conteudo,
      provider: this.obterString(mensagem.provider),
      providerMessageId: this.obterString(mensagem.idMensagem),
      status: "RECEIVED",
      origem: "whatsapp",
      contexto: this.obterObjeto(mensagem.payloadOriginal),
      enviadaEm: this.obterData(mensagem.recebidaEm)
    });
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

  private obterReservaIdDoContexto(contexto: unknown): string | null {
    const reserva = this.obterObjeto(this.obterObjeto(contexto).reserva);
    return this.obterString(reserva.id);
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
