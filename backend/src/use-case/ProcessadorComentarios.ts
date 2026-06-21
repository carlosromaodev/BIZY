import { ComentarioLiveSchema } from "../dominio/esquemas.js";
import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioClientes, RepositorioComentarios } from "../dominio/repositorios/contratos.js";
import type { AutomacaoWhatsApp } from "../dominio/servicos/AutomacaoWhatsApp.js";
import type { DicionarioParserComentario, InterpretadorComentario } from "../dominio/servicos/InterpretadorComentario.js";
import type { GestaoPedidosUseCase } from "./GestaoPedidosUseCase.js";
import type { MotorReservas } from "./MotorReservas.js";
import type {
  ComentarioLive,
  DadosCliente360,
  Pedido,
  RegistroComentario,
  Reserva,
  ResultadoInterpretacaoComentario
} from "../dominio/tipos.js";

export interface ResultadoProcessamentoComentario {
  registro: RegistroComentario;
  reserva: Reserva | null;
  reservas: Reserva[];
  pedido: Pedido | null;
  pedidos: Pedido[];
  estado: "PROCESSADO" | "REVISAO_MANUAL" | "IGNORADO";
  motivo: string | null;
}

interface OpcoesProcessamentoComentario {
  negocioId?: string | null;
  dicionarioParser?: DicionarioParserComentario | null;
}

export class ProcessadorComentarios {
  constructor(
    private readonly interpretadorComentario: InterpretadorComentario,
    private readonly motorReservas: MotorReservas,
    private readonly automacaoWhatsApp: AutomacaoWhatsApp,
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly eventos: DespachadorEventos,
    private readonly repositorioClientes?: RepositorioClientes,
    private readonly gestaoPedidos?: GestaoPedidosUseCase
  ) {}

  async processar(
    comentarioEntrada: ComentarioLive,
    opcoes: OpcoesProcessamentoComentario = {}
  ): Promise<ResultadoProcessamentoComentario> {
    const comentario = this.normalizarIdentidadeComentario(ComentarioLiveSchema.parse(comentarioEntrada));
    const negocioId = opcoes.negocioId ?? null;

    this.eventos.emitir("COMMENT_RECEIVED", { comentario, negocioId });

    let interpretacao = this.interpretadorComentario.interpretar(comentario.commentText, {
      dicionario: opcoes.dicionarioParser
    });

    // Cliente que regressa: se não temos telefone no comentário mas temos username,
    // procuramos o telefone do cliente em reservas/interações anteriores
    if (!interpretacao.phone && comentario.username && negocioId && this.repositorioClientes) {
      const clienteExistente = await this.repositorioClientes.buscarPorUsername(comentario.username, negocioId);
      if (clienteExistente?.telefone) {
        interpretacao = {
          ...interpretacao,
          phone: clienteExistente.telefone,
          confidence: Math.max(interpretacao.confidence, 0.8),
          requiresManualReview: interpretacao.intent !== "BUY" || !interpretacao.productCode,
          reasons: interpretacao.reasons.filter((r) => !r.includes("Telefone"))
        };
      }
    }

    this.eventos.emitir("COMMENT_PARSED", { comentario, interpretacao, negocioId });

    const registroInicial = await this.repositorioComentarios.criar({
      negocioId,
      comentario,
      interpretacao,
      estado: "RECEBIDO"
    });

    if (interpretacao.intent === "BUY") {
      this.eventos.emitir("INTENT_DETECTED", { comentario, interpretacao, negocioId });
    }

    if (interpretacao.intent !== "BUY") {
      const registro = await this.repositorioComentarios.atualizarEstado(
        registroInicial.id,
        "IGNORADO",
        "Comentário sem intenção de compra.",
        interpretacao
      );

      return {
        registro,
        reserva: null,
        reservas: [],
        pedido: null,
        pedidos: [],
        estado: "IGNORADO",
        motivo: "Comentário sem intenção de compra."
      };
    }

    if (interpretacao.requiresManualReview) {
      const motivo = interpretacao.reasons.join(" ") || "Comentário ambíguo.";
      const registro = await this.repositorioComentarios.atualizarEstado(
        registroInicial.id,
        "REVISAO_MANUAL",
        motivo,
        interpretacao
      );

      if (this.devePedirCodigoPecaNaRevisao(interpretacao)) {
        await this.pedirCodigoPecaAoCliente(comentario, interpretacao, motivo, negocioId);
      }

      return { registro, reserva: null, reservas: [], pedido: null, pedidos: [], estado: "REVISAO_MANUAL", motivo };
    }

    const codigosPeca = this.listarCodigosPecaInterpretados(interpretacao);
    const resultadosReserva = [];
    const pedidos: Pedido[] = [];
    const cliente = await this.sincronizarCliente(comentario, interpretacao, negocioId);

    for (const codigoPeca of codigosPeca) {
      const resultadoReserva = await this.motorReservas.criarReserva(
        comentario,
        {
          ...interpretacao,
          productCode: codigoPeca,
          productCodes: [codigoPeca]
        },
        { negocioId, clienteNegocioId: cliente?.id ?? null }
      );
      resultadosReserva.push(resultadoReserva);
      await this.notificarResultadoReserva(resultadoReserva, comentario, interpretacao, negocioId);
      const pedido = await this.converterReservaEmPedido(resultadoReserva, comentario);
      if (pedido) pedidos.push(pedido);
    }

    const reservas = resultadosReserva.flatMap((resultado) => (resultado.reserva ? [resultado.reserva] : []));
    const temReservaProcessada = reservas.length > 0;
    const deveRevisar =
      !temReservaProcessada ||
      resultadosReserva.some((resultado) => resultado.tipo === "REVISAO_MANUAL" || resultado.tipo === "PECA_INDISPONIVEL");
    const estado = deveRevisar ? "REVISAO_MANUAL" : "PROCESSADO";
    const motivo = this.juntarMotivos(resultadosReserva.map((resultado) => resultado.motivo));
    const registro = await this.repositorioComentarios.atualizarEstado(
      registroInicial.id,
      estado,
      motivo,
      interpretacao
    );

    return {
      registro,
      reserva: reservas[0] ?? null,
      reservas,
      pedido: pedidos[0] ?? null,
      pedidos,
      estado,
      motivo
    };
  }

  private listarCodigosPecaInterpretados(interpretacao: ResultadoInterpretacaoComentario): string[] {
    if (!interpretacao?.productCode) return [];
    const codigos = interpretacao.productCodes?.length ? interpretacao.productCodes : [interpretacao.productCode];
    return [...new Set(codigos.filter((codigo): codigo is string => Boolean(codigo)))];
  }

  private normalizarIdentidadeComentario(comentario: ComentarioLive): ComentarioLive {
    const perfilUsuario = this.objeto(comentario.perfilUsuario);
    const eventoBruto = this.objeto(comentario.eventoBruto);
    const fontes = this.fontesIdentidadeUsuario(perfilUsuario, eventoBruto);

    const userIdCapturado = this.extrairTextoDasFontes(fontes, [
      "userId",
      "user_id",
      "user_id_str",
      "id",
      "openId",
      "open_id"
    ]);
    const secUidCapturado = this.extrairTextoDasFontes(fontes, ["secUid", "sec_uid"]);
    const uniqueIdCapturado = this.extrairTextoDasFontes(fontes, [
      "uniqueId",
      "unique_id",
      "username",
      "userName",
      "shortId"
    ]);
    const displayNameCapturado = this.extrairTextoDasFontes(fontes, [
      "displayName",
      "display_name",
      "nickname",
      "profileName",
      "name",
      "nickName"
    ]);
    const avatarUrlCapturado = this.extrairAvatarUrl(comentario.avatarUrl, ...fontes);

    const username = this.devePreferirValorCapturado(comentario.username)
      ? uniqueIdCapturado ?? comentario.username
      : comentario.username;
    const displayName = this.devePreferirValorCapturado(comentario.displayName)
      ? displayNameCapturado ?? uniqueIdCapturado ?? username
      : comentario.displayName;
    const userId = comentario.userId ?? userIdCapturado ?? secUidCapturado ?? null;
    const avatarUrl = avatarUrlCapturado ?? comentario.avatarUrl ?? null;
    const identidadeOriginal = this.objeto(perfilUsuario.identidade);
    const identidade = this.removerVazios({
      ...identidadeOriginal,
      userId,
      secUid: secUidCapturado ?? identidadeOriginal.secUid ?? null,
      uniqueId: uniqueIdCapturado ?? identidadeOriginal.uniqueId ?? username,
      nickname: displayNameCapturado ?? identidadeOriginal.nickname ?? displayName,
      displayName,
      avatarUrl
    });
    const perfilUsuarioNormalizado = this.removerVazios({
      ...perfilUsuario,
      identidade
    });

    return {
      ...comentario,
      username,
      userId,
      displayName,
      avatarUrl,
      perfilUsuario: perfilUsuarioNormalizado
    };
  }

  private fontesIdentidadeUsuario(
    perfilUsuario: Record<string, unknown>,
    eventoBruto: Record<string, unknown>
  ): Array<Record<string, unknown>> {
    return [
      ...this.fontesTikTok(perfilUsuario),
      ...this.fontesTikTok(eventoBruto),
      this.objeto(perfilUsuario.identidade),
      this.objeto(perfilUsuario.identity),
      this.objeto(perfilUsuario.rawUser),
      this.objeto(perfilUsuario.user),
      this.objeto(perfilUsuario.author),
      this.objeto(eventoBruto.user),
      this.objeto(eventoBruto.author),
      this.objeto(eventoBruto.userInfo),
      this.objeto(eventoBruto.user_info),
      this.objeto(eventoBruto.identity),
      this.objeto(eventoBruto.userIdentity),
      this.objeto(eventoBruto.user_identity),
      perfilUsuario,
      eventoBruto
    ].filter((fonte) => Object.keys(fonte).length > 0);
  }

  private fontesTikTok(fonte: Record<string, unknown>): Array<Record<string, unknown>> {
    const tiktok = this.objeto(fonte.tiktok);
    if (!Object.keys(tiktok).length) return [];

    const identidade = this.objeto(tiktok.identidade);
    const identity = this.objeto(tiktok.identity);
    const usuario = this.objeto(tiktok.usuario);
    const user = this.objeto(tiktok.user);
    const author = this.objeto(tiktok.author);
    const userInfo = this.objeto(tiktok.userInfo);
    const userInfoSnake = this.objeto(tiktok.user_info);
    const perfil = this.objeto(tiktok.perfil);
    const profile = this.objeto(tiktok.profile);

    return [
      identidade,
      identity,
      usuario,
      ...this.fontesFotoPerfil(usuario),
      user,
      ...this.fontesFotoPerfil(user),
      author,
      ...this.fontesFotoPerfil(author),
      userInfo,
      userInfoSnake,
      perfil,
      profile,
      tiktok
    ].filter((fonteTikTok) => Object.keys(fonteTikTok).length > 0);
  }

  private fontesFotoPerfil(usuario: Record<string, unknown>): Array<Record<string, unknown>> {
    return [
      this.objeto(usuario.foto_perfil),
      this.objeto(usuario.fotoPerfil),
      this.objeto(usuario.avatarThumb),
      this.objeto(usuario.avatarMedium),
      this.objeto(usuario.avatarLarger),
      this.objeto(usuario.profilePicture),
      this.objeto(usuario.profilePhoto)
    ].filter((fonte) => Object.keys(fonte).length > 0);
  }

  private extrairTextoDasFontes(fontes: Array<Record<string, unknown>>, campos: string[]): string | null {
    for (const fonte of fontes) {
      for (const campo of campos) {
        const valor = this.obterTexto(fonte[campo]);
        if (valor) return valor;
      }
    }

    return null;
  }

  private obterTexto(...valores: unknown[]): string | null {
    for (const valor of valores) {
      if (typeof valor === "string" && valor.trim().length > 0) return valor.trim();
      if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
      if (typeof valor === "bigint") return valor.toString();
    }

    return null;
  }

  private devePreferirValorCapturado(valor?: string | null): boolean {
    const normalizado = valor?.trim().toLowerCase();
    if (!normalizado) return true;

    return [
      "cliente",
      "cliente manual",
      "cliente_manual",
      "desconhecido",
      "unknown",
      "anonymous",
      "fallback"
    ].includes(normalizado) || normalizado.startsWith("fallback_");
  }

  private extrairAvatarUrl(...valores: unknown[]): string | null {
    for (const valor of valores) {
      const url = this.extrairUrlDeValor(valor);
      if (url) return url;

      const objeto = this.objeto(valor);
      if (!Object.keys(objeto).length) continue;

      const camposAvatar = [
        "avatarUrl",
        "avatar_url",
        "profilePictureUrl",
        "profile_picture_url",
        "profilePicUrl",
        "profilePhotoUrl",
        "profile_photo_url",
        "photoUrl",
        "imageUrl",
        "fotoPerfil",
        "foto_perfil",
        "avatarThumb",
        "avatar_thumb",
        "avatarMedium",
        "avatar_medium",
        "avatarLarger",
        "avatar_larger",
        "profilePicture",
        "profilePhoto",
        "profile_photo",
        "avatar",
        "picture",
        "photo"
      ];

      for (const campo of camposAvatar) {
        const urlCampo = this.extrairUrlDeValor(objeto[campo]);
        if (urlCampo) return urlCampo;
      }
    }

    return null;
  }

  private extrairUrlDeValor(valor: unknown): string | null {
    const direto = this.normalizarUrlFoto(this.obterTexto(valor));
    if (direto) return direto;

    if (Array.isArray(valor)) {
      for (const item of valor) {
        const url = this.extrairUrlDeValor(item);
        if (url) return url;
      }

      return null;
    }

    const objeto = this.objeto(valor);
    if (!Object.keys(objeto).length) return null;

    for (const campo of ["urlList", "url_list", "urls", "url", "uri", "href", "displayUrl", "urlKey"]) {
      const url = this.extrairUrlDeValor(objeto[campo]);
      if (url) return url;
    }

    return null;
  }

  private normalizarUrlFoto(valor: string | null): string | null {
    if (!valor) return null;

    const texto = valor.trim();
    if (/^https?:\/\//i.test(texto)) return texto;
    if (texto.startsWith("/")) return texto;

    return null;
  }

  private async sincronizarCliente(
    comentario: ComentarioLive,
    interpretacao: ResultadoInterpretacaoComentario,
    negocioId?: string | null
  ) {
    if (!this.repositorioClientes || !negocioId || !interpretacao.phone) return null;

    return this.repositorioClientes.sincronizar({
      negocioId,
      telefone: interpretacao.phone,
      nome: comentario.displayName || comentario.username,
      username: comentario.username,
      userId: comentario.userId ?? null,
      avatarUrl: comentario.avatarUrl ?? null,
      origem: "comentario_live",
      consentimentoDados: true,
      ultimaInteracaoEm: comentario.timestamp,
      ...this.montarEnriquecimentoCliente(comentario, interpretacao)
    });
  }

  private async converterReservaEmPedido(
    resultadoReserva: Awaited<ReturnType<MotorReservas["criarReserva"]>>,
    comentario: ComentarioLive
  ): Promise<Pedido | null> {
    if (!this.gestaoPedidos || resultadoReserva.tipo !== "RESERVA_CRIADA" || !resultadoReserva.reserva) return null;

    const { pedido } = await this.gestaoPedidos.converterReservaEmPedido(resultadoReserva.reserva, {
      origem: "live",
      canal: this.canalPedidoDoComentario(comentario),
      observacao: `Pedido criado automaticamente a partir da live ${comentario.liveId}.`
    });

    return pedido;
  }

  private canalPedidoDoComentario(comentario: ComentarioLive): string {
    const marcador = `${comentario.source}:${comentario.provider}`.toLowerCase();
    if (marcador.includes("tiktok")) return "tiktok";
    if (marcador.includes("instagram")) return "instagram";
    if (marcador.includes("whatsapp")) return "whatsapp";
    return comentario.source || "live";
  }

  private montarEnriquecimentoCliente(
    comentario: ComentarioLive,
    interpretacao: ResultadoInterpretacaoComentario
  ): Pick<
    DadosCliente360,
    | "perfil360"
    | "identidadesDigitais"
    | "fontesDados"
    | "perfilComercial"
    | "sinaisRelacionamento"
    | "dadosCaptura"
    | "ultimoEnriquecimentoEm"
  > {
    const chave = this.chavePerfilSocial(comentario);
    const perfilUsuario = this.objeto(comentario.perfilUsuario);
    const eventoBruto = this.objeto(comentario.eventoBruto);
    const identidade = this.objeto(perfilUsuario.identidade);
    const relacaoComHost = this.objeto(perfilUsuario.relacaoComHost);
    const atualizadoEm = comentario.timestamp.toISOString();

    return {
      perfil360: {
        [chave]: this.removerVazios({
          ...perfilUsuario,
          ultimoComentario: {
            texto: comentario.commentText,
            liveId: comentario.liveId,
            produtoSolicitado: interpretacao.productCode,
            produtosSolicitados: interpretacao.productCodes,
            capturadoEm: atualizadoEm
          }
        })
      },
      identidadesDigitais: {
        [chave]: this.removerVazios({
          provider: comentario.provider,
          source: comentario.source,
          userId: comentario.userId ?? identidade.userId ?? null,
          secUid: identidade.secUid ?? null,
          username: comentario.username,
          uniqueId: identidade.uniqueId ?? comentario.username,
          displayName: comentario.displayName,
          avatarUrl: comentario.avatarUrl ?? identidade.avatarUrl ?? null,
          atualizadoEm
        })
      },
      fontesDados: {
        [chave]: this.removerVazios({
          provider: comentario.provider,
          liveId: comentario.liveId,
          origem: "comentario_live",
          ultimoEventoEm: atualizadoEm
        }),
        comentario_live: {
          provider: comentario.provider,
          liveId: comentario.liveId,
          ultimoEventoEm: atualizadoEm
        }
      },
      perfilComercial: {
        [chave]: this.removerVazios({
          origem: "comentario_live",
          ultimaIntencao: interpretacao.intent,
          ultimoProdutoSolicitado: interpretacao.productCode,
          produtosSolicitados: interpretacao.productCodes,
          liveId: comentario.liveId,
          atualizadoEm
        })
      },
      sinaisRelacionamento: {
        [chave]: relacaoComHost
      },
      dadosCaptura: {
        [chave]: {
          ultimoEvento: {
            perfilUsuario,
            rawEvent: eventoBruto,
            commentText: comentario.commentText,
            liveId: comentario.liveId,
            provider: comentario.provider,
            timestamp: atualizadoEm
          }
        }
      },
      ultimoEnriquecimentoEm: comentario.timestamp
    };
  }

  private chavePerfilSocial(comentario: ComentarioLive): string {
    const marcador = `${comentario.source}:${comentario.provider}`.toLowerCase();
    if (marcador.includes("tiktok")) return "tiktok";
    if (marcador.includes("instagram")) return "instagram";
    if (marcador.includes("whatsapp")) return "whatsapp";
    return comentario.source || "social";
  }

  private objeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
  }

  private removerVazios(objeto: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(objeto).filter(([, valor]) => valor !== undefined && valor !== null && valor !== "")
    );
  }

  private async notificarResultadoReserva(
    resultadoReserva: Awaited<ReturnType<MotorReservas["criarReserva"]>>,
    comentario: ComentarioLive,
    interpretacao: ReturnType<InterpretadorComentario["interpretar"]>,
    negocioId?: string | null
  ): Promise<void> {
    if (resultadoReserva.tipo === "RESERVA_CRIADA" && resultadoReserva.reserva && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarReservaCriada(resultadoReserva.reserva, resultadoReserva.peca);
    }

    if (resultadoReserva.tipo === "FILA_ESPERA" && resultadoReserva.reserva && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarFilaEspera(resultadoReserva.reserva, resultadoReserva.peca);
    }

    if (resultadoReserva.tipo === "PECA_INDISPONIVEL" && resultadoReserva.peca && interpretacao.phone) {
      await this.automacaoWhatsApp.notificarPecaVendida(
        interpretacao.phone,
        comentario.displayName || comentario.username,
        resultadoReserva.peca
      );
    }

    if (resultadoReserva.tipo === "PECA_INDISPONIVEL" && !resultadoReserva.peca && interpretacao.phone) {
      await this.pedirCodigoPecaAoCliente(
        comentario,
        interpretacao,
        resultadoReserva.motivo || "Peça não encontrada no catálogo.",
        resultadoReserva.reserva?.negocioId ?? negocioId ?? null
      );
    }

    if (this.devePedirCodigoPecaAposTentativaReserva(resultadoReserva, interpretacao)) {
      await this.pedirCodigoPecaAoCliente(
        comentario,
        interpretacao,
        resultadoReserva.motivo || "Peça não encontrada no catálogo.",
        resultadoReserva.reserva?.negocioId ?? negocioId ?? null
      );
    }
  }

  private devePedirCodigoPecaNaRevisao(interpretacao: ResultadoInterpretacaoComentario): boolean {
    return interpretacao.intent === "BUY" && Boolean(interpretacao.phone) && !interpretacao.productCode;
  }

  private devePedirCodigoPecaAposTentativaReserva(
    resultadoReserva: Awaited<ReturnType<MotorReservas["criarReserva"]>>,
    interpretacao: ResultadoInterpretacaoComentario
  ): boolean {
    const motivo = resultadoReserva.motivo?.toLowerCase() ?? "";

    return (
      resultadoReserva.tipo === "REVISAO_MANUAL" &&
      Boolean(interpretacao.phone) &&
      Boolean(interpretacao.productCode) &&
      motivo.includes("não encontrada")
    );
  }

  private async pedirCodigoPecaAoCliente(
    comentario: ComentarioLive,
    interpretacao: ResultadoInterpretacaoComentario,
    motivo: string,
    negocioId?: string | null
  ): Promise<void> {
    if (!interpretacao.phone) return;

    const nomeCliente = comentario.displayName || comentario.username || "Cliente";

    this.eventos.emitir("CUSTOMER_FOLLOWUP_REQUESTED", {
      telefone: interpretacao.phone,
      nomeCliente,
      comentario,
      interpretacao,
      motivo,
      negocioId: negocioId ?? null
    });

    await this.automacaoWhatsApp.solicitarCodigoPeca(
      interpretacao.phone,
      nomeCliente,
      comentario.commentText,
      motivo,
      negocioId
    );
  }

  private juntarMotivos(motivos: Array<string | undefined>): string | null {
    const unicos = [...new Set(motivos.filter((motivo): motivo is string => Boolean(motivo)))];
    return unicos.length ? unicos.join(" ") : null;
  }
}
