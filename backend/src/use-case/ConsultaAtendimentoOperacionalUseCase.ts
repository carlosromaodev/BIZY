import type {
  RepositorioComentarios,
  RepositorioAtendimento,
  RepositorioPecas,
  RepositorioReservas
} from "../dominio/repositorios/contratos.js";
import type {
  ClienteAtendimento,
  ConversaAtendimento,
  MensagemAtendimento,
  Peca,
  PoliticaAutomacaoAtendimento,
  RegistroComentario,
  Reserva
} from "../dominio/tipos.js";

const estadosReservaAtiva = ["PENDING", "RESERVED", "WAITING_PAYMENT"] as const;
const estadosConversaSemResposta = ["NOVA", "AGUARDANDO_HUMANO"] as const;

type ConversaOperacional = Awaited<ReturnType<ConsultaAtendimentoOperacionalUseCase["listarConversas"]>>["conversas"][number];

export class ConsultaAtendimentoOperacionalUseCase {
  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly repositorioAtendimento: RepositorioAtendimento
  ) {}

  async listarConversas(negocioId?: string | null) {
    const [pecas, reservas, comentarios, conversasCrm] = await Promise.all([
      this.repositorioPecas.listar(negocioId),
      this.repositorioReservas.listar(negocioId),
      this.repositorioComentarios.listar(200, negocioId),
      this.repositorioAtendimento.listarConversasComMensagens(200, negocioId)
    ]);
    const pecasPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca]));
    const grupos = new Map<
      string,
      {
        telefone: string;
        reservas: Reserva[];
        comentarios: RegistroComentario[];
        mensagensCrm: MensagemAtendimento[];
        conversaCrm: ConversaAtendimento | null;
        clienteCrm: ClienteAtendimento | null;
      }
    >();

    for (const reserva of reservas) {
      const chave = reserva.telefoneCliente;
      const grupo = this.obterOuCriarGrupo(grupos, chave);
      grupo.reservas.push(reserva);
      grupos.set(chave, grupo);
    }

    for (const comentario of comentarios) {
      const telefone = comentario.interpretacao?.phone;
      if (!telefone) continue;

      const grupo = this.obterOuCriarGrupo(grupos, telefone);
      grupo.comentarios.push(comentario);
      grupos.set(telefone, grupo);
    }

    for (const conversa of conversasCrm) {
      const telefone = conversa.conversa.telefone;
      const grupo = this.obterOuCriarGrupo(grupos, telefone);
      grupo.conversaCrm = this.escolherConversaCrm(grupo.conversaCrm, conversa.conversa);
      grupo.clienteCrm = conversa.cliente;
      grupo.mensagensCrm.push(...conversa.mensagens);
      grupos.set(telefone, grupo);
    }

    return {
      conversas: [...grupos.values()]
        .map((grupo) => this.mapearConversa(grupo, pecasPorCodigo))
        .sort((a, b) => new Date(b.ultimaAtualizacao).getTime() - new Date(a.ultimaAtualizacao).getTime())
    };
  }

  async listarFiltrosConversas(negocioId: string | null | undefined, usuarioId: string) {
    const { conversas } = await this.listarConversas(negocioId);
    const filtros = [
      {
        id: "sem_resposta",
        rotulo: "Sem resposta",
        descricao: "Conversas novas, aguardando humano ou com a última mensagem do cliente.",
        conversas: conversas.filter((conversa) => this.ehSemResposta(conversa))
      },
      {
        id: "pagamento_pendente",
        rotulo: "Pagamento pendente",
        descricao: "Conversas com pedido ou reserva aguardando pagamento.",
        conversas: conversas.filter((conversa) => this.temPagamentoPendente(conversa))
      },
      {
        id: "entrega_pendente",
        rotulo: "Entrega pendente",
        descricao: "Conversas marcadas para entrega, expedição ou retirada pendente.",
        conversas: conversas.filter((conversa) =>
          this.temAlgumaTag(conversa, ["entrega_pendente", "pedido_pago_sem_entrega", "preparacao", "envio_pendente"])
        )
      },
      {
        id: "vip",
        rotulo: "VIP",
        descricao: "Clientes marcados como VIP ou conversas de prioridade alta.",
        conversas: conversas.filter(
          (conversa) => this.temAlgumaTag(conversa, ["vip", "cliente_vip"]) || ["ALTA", "URGENTE"].includes(conversa.prioridade)
        )
      },
      {
        id: "reclamacao",
        rotulo: "Reclamação",
        descricao: "Casos marcados ou detectados como reclamação, problema, troca ou devolução.",
        conversas: conversas.filter((conversa) => this.temReclamacao(conversa))
      },
      {
        id: "campanha_respondida",
        rotulo: "Campanha respondida",
        descricao: "Clientes que responderam a campanhas ou mensagens promocionais rastreadas.",
        conversas: conversas.filter((conversa) => this.temCampanhaRespondida(conversa))
      },
      {
        id: "meu_atendimento",
        rotulo: "Meu atendimento",
        descricao: "Conversas atribuídas ao usuário autenticado.",
        conversas: conversas.filter((conversa) => conversa.responsavelId === usuarioId)
      }
    ];

    return {
      filtros: filtros.map((filtro) => ({
        id: filtro.id,
        rotulo: filtro.rotulo,
        descricao: filtro.descricao,
        total: filtro.conversas.length,
        conversas: filtro.conversas
      }))
    };
  }

  private mapearConversa(
    grupo: {
      telefone: string;
      reservas: Reserva[];
      comentarios: RegistroComentario[];
      mensagensCrm: MensagemAtendimento[];
      conversaCrm: ConversaAtendimento | null;
      clienteCrm: ClienteAtendimento | null;
    },
    pecasPorCodigo: Map<string, Peca>
  ) {
    const reservasOrdenadas = [...grupo.reservas].sort(
      (a, b) => b.criadaEm.getTime() - a.criadaEm.getTime()
    );
    const reservaAtual =
      reservasOrdenadas.find((reserva) => estadosReservaAtiva.includes(reserva.estado as typeof estadosReservaAtiva[number])) ??
      reservasOrdenadas[0] ??
      null;
    const nomeCliente =
      reservaAtual?.nomeCliente ||
      this.obterNomeDeMensagemCrm(grupo.mensagensCrm) ||
      grupo.comentarios[0]?.comentario.displayName ||
      grupo.comentarios[0]?.comentario.username ||
      "Cliente";
    const mensagens = this.montarLinhaDoTempo(grupo, pecasPorCodigo);
    const ultimaMensagem = mensagens[mensagens.length - 1];
    const reservaComPerfil = reservasOrdenadas.find((reserva) => reserva.userIdCliente || reserva.avatarUrlCliente) ?? null;
    const comentarioComPerfil =
      grupo.comentarios.find((comentario) => comentario.comentario.userId || comentario.comentario.avatarUrl) ?? null;
    const revisaoManual = grupo.comentarios.filter(
      (comentario) => comentario.estado === "REVISAO_MANUAL" || comentario.interpretacao?.requiresManualReview
    ).length;
    const tagsCrm = grupo.conversaCrm?.tags ?? [];
    const origemPrincipal = this.resolverOrigemPrincipal(grupo.comentarios, grupo.mensagensCrm);

    return {
      id: grupo.telefone,
      conversaCrmId: grupo.conversaCrm?.id ?? null,
      telefone: grupo.telefone,
      nomeCliente,
      userIdCliente:
        reservaAtual?.userIdCliente ??
        reservaComPerfil?.userIdCliente ??
        grupo.clienteCrm?.userId ??
        comentarioComPerfil?.comentario.userId ??
        null,
      avatarUrlCliente:
        reservaAtual?.avatarUrlCliente ??
        reservaComPerfil?.avatarUrlCliente ??
        grupo.clienteCrm?.avatarUrl ??
        comentarioComPerfil?.comentario.avatarUrl ??
        null,
      origemPrincipal,
      ultimaMensagem: ultimaMensagem?.conteudo ?? "Sem atividade recente",
      ultimaAtualizacao: ultimaMensagem?.enviadaEm ?? reservaAtual?.criadaEm.toISOString() ?? new Date().toISOString(),
      mensagensNaoLidas: revisaoManual,
      estado: this.resolverEstadoConversa(reservaAtual),
      estadoCrm: grupo.conversaCrm?.estado ?? "NOVA",
      prioridade: grupo.conversaCrm?.prioridade ?? "NORMAL",
      responsavelId: grupo.conversaCrm?.responsavelId ?? null,
      tags: tagsCrm,
      politicaAutomacao: this.extrairPoliticaAutomacao(tagsCrm),
      pecaRelacionada: reservaAtual ? this.formatarPeca(reservaAtual, pecasPorCodigo.get(reservaAtual.codigoPeca)) : null,
      reservaAtual,
      mensagens
    };
  }

  private montarLinhaDoTempo(
    grupo: { reservas: Reserva[]; comentarios: RegistroComentario[]; mensagensCrm: MensagemAtendimento[] },
    pecasPorCodigo: Map<string, Peca>
  ) {
    const mensagensCrm = grupo.mensagensCrm.map((mensagem) => ({
      id: `crm-${mensagem.id}`,
      remetente: mensagem.remetente,
      conteudo: mensagem.conteudo,
      enviadaEm: mensagem.enviadaEm.toISOString(),
      origem: mensagem.origem,
      reservaId: mensagem.reservaId,
      tipo: mensagem.tipo,
      status: mensagem.status,
      provider: mensagem.provider,
      providerMessageId: mensagem.providerMessageId,
      erro: mensagem.erro,
      contexto: mensagem.contexto
    }));
    const temComentariosCrm = grupo.mensagensCrm.some((mensagem) => mensagem.origem === "comentario_live");

    const mensagens = [
      ...mensagensCrm,
      ...(temComentariosCrm
        ? []
        : grupo.comentarios.map((comentario) => ({
            id: `comentario-${comentario.id}`,
            remetente: "cliente" as const,
            conteudo: comentario.comentario.commentText,
            enviadaEm: comentario.comentario.timestamp.toISOString(),
            origem: "comentario_live",
            reservaId: null as string | null
          }))),
      ...grupo.reservas
        .filter(
          (reserva) =>
            !grupo.mensagensCrm.some(
              (mensagem) => mensagem.origem === "evento_reserva" && mensagem.reservaId === reserva.id
            )
        )
        .map((reserva) => ({
          id: `reserva-${reserva.id}`,
          remetente: "sistema" as const,
          conteudo: this.descreverReserva(reserva, pecasPorCodigo.get(reserva.codigoPeca)),
          enviadaEm: reserva.atualizadaEm.toISOString(),
          origem: "evento_reserva",
          reservaId: reserva.id
        }))
    ];

    return mensagens.sort((a, b) => new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime());
  }

  private resolverOrigemPrincipal(
    comentarios: RegistroComentario[],
    mensagensCrm: MensagemAtendimento[]
  ): string | null {
    if (comentarios.length > 0) return "tiktok";
    for (const msg of mensagensCrm) {
      if (msg.origem === "instagram" || msg.provider === "instagrapi") return "instagram";
      if (msg.origem === "whatsapp" || msg.provider === "evolution") return "whatsapp";
      if (msg.origem === "comentario_live") return "tiktok";
    }
    return null;
  }

  private resolverEstadoConversa(reserva: Reserva | null) {
    if (!reserva) return "historico";
    if (reserva.estado === "WAITLISTED") return "fila";
    if (estadosReservaAtiva.includes(reserva.estado as typeof estadosReservaAtiva[number])) return "ativo";
    if (reserva.estado === "PAID") return "automacao";
    return "encerrado";
  }

  private ehSemResposta(conversa: ConversaOperacional) {
    const ultimaMensagem = conversa.mensagens.at(-1);
    return (
      conversa.mensagensNaoLidas > 0 ||
      estadosConversaSemResposta.includes(conversa.estadoCrm as typeof estadosConversaSemResposta[number]) ||
      ultimaMensagem?.remetente === "cliente"
    );
  }

  private temPagamentoPendente(conversa: ConversaOperacional) {
    return (
      conversa.estadoCrm === "AGUARDANDO_PAGAMENTO" ||
      ["PENDING", "RESERVED", "WAITING_PAYMENT"].includes(conversa.reservaAtual?.estado ?? "") ||
      this.temAlgumaTag(conversa, ["pagamento", "pagamento_pendente", "pedido_aberto"])
    );
  }

  private temReclamacao(conversa: ConversaOperacional) {
    if (this.temAlgumaTag(conversa, ["reclamacao", "reclamação", "troca", "devolucao", "devolução"])) return true;

    return conversa.mensagens.some((mensagem) =>
      /\b(reclama[cç][aã]o|problema|troca|devolu[cç][aã]o|reembolso|atrasou|falhou)\b/i.test(mensagem.conteudo)
    );
  }

  private temCampanhaRespondida(conversa: ConversaOperacional) {
    if (this.temAlgumaTag(conversa, ["campanha_respondida", "campanha-respondida", "respondeu_campanha"])) return true;

    return conversa.mensagens.some((mensagem) => {
      if (!("contexto" in mensagem)) return false;
      const contexto = mensagem.contexto;
      return Boolean(contexto?.campanhaId || contexto?.campanha || contexto?.campaignId);
    });
  }

  private temAlgumaTag(conversa: ConversaOperacional, tagsEsperadas: string[]) {
    const tags = conversa.tags.map((tag) => tag.trim().toLowerCase());
    return tagsEsperadas.some((tagEsperada) => tags.includes(tagEsperada));
  }

  private obterOuCriarGrupo(
    grupos: Map<
      string,
      {
        telefone: string;
        reservas: Reserva[];
        comentarios: RegistroComentario[];
        mensagensCrm: MensagemAtendimento[];
        conversaCrm: ConversaAtendimento | null;
        clienteCrm: ClienteAtendimento | null;
      }
    >,
    telefone: string
  ) {
    return grupos.get(telefone) ?? { telefone, reservas: [], comentarios: [], mensagensCrm: [], conversaCrm: null, clienteCrm: null };
  }

  private escolherConversaCrm(atual: ConversaAtendimento | null, candidata: ConversaAtendimento): ConversaAtendimento {
    if (!atual) return candidata;
    const atualTemGestao =
      atual.responsavelId || atual.tags.length > 0 || atual.estado !== "ABERTA" || atual.prioridade !== "NORMAL";
    const candidataTemGestao =
      candidata.responsavelId ||
      candidata.tags.length > 0 ||
      candidata.estado !== "ABERTA" ||
      candidata.prioridade !== "NORMAL";

    if (candidataTemGestao && !atualTemGestao) return candidata;

    const dataAtual = atual.ultimaMensagemEm ?? atual.atualizadoEm;
    const dataCandidata = candidata.ultimaMensagemEm ?? candidata.atualizadoEm;
    return dataCandidata.getTime() > dataAtual.getTime() ? candidata : atual;
  }

  private extrairPoliticaAutomacao(tags: string[]): PoliticaAutomacaoAtendimento {
    const tag = tags.find((item) => item.startsWith("politica:"));
    const politica = tag?.replace("politica:", "") as PoliticaAutomacaoAtendimento | undefined;
    if (["AUTOMATICO", "SUGERIR_RESPOSTA", "EXIGIR_HUMANO", "BLOQUEAR_IA"].includes(politica ?? "")) {
      return politica as PoliticaAutomacaoAtendimento;
    }

    return "AUTOMATICO";
  }

  private formatarPeca(reserva: Reserva, peca?: Peca) {
    return `#${reserva.codigoPeca}${peca ? ` ${peca.nome}` : ""}`;
  }

  private descreverReserva(reserva: Reserva, peca?: Peca) {
    const produto = this.formatarPeca(reserva, peca);
    const preco = peca
      ? new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(
          peca.precoEmKwanza
        )
      : "preço não encontrado";

    if (reserva.estado === "WAITING_PAYMENT") {
      return `Reserva ativa para ${produto}. Pagamento pendente no valor de ${preco}.`;
    }
    if (reserva.estado === "WAITLISTED") {
      return `Cliente em fila de espera para ${produto}.`;
    }
    if (reserva.estado === "PAID") {
      return `Pagamento confirmado para ${produto}.`;
    }
    if (reserva.estado === "EXPIRED") {
      return `Reserva expirada para ${produto}.`;
    }
    if (reserva.estado === "CANCELLED") {
      return `Reserva cancelada para ${produto}.`;
    }
    return `Reserva ${reserva.estado.toLowerCase()} para ${produto}.`;
  }

  private obterNomeDeMensagemCrm(mensagens: MensagemAtendimento[]): string | null {
    for (const mensagem of mensagens) {
      const contexto = mensagem.contexto;
      if (!contexto || typeof contexto !== "object" || Array.isArray(contexto)) continue;

      const direto = this.obterStringDoContexto(contexto, "nomeCliente");
      if (direto) return direto;

      const data = contexto.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const pushName = this.obterStringDoContexto(data as Record<string, unknown>, "pushName");
        if (pushName) return pushName;
      }
    }

    return null;
  }

  private obterStringDoContexto(contexto: Record<string, unknown>, chave: string): string | null {
    const valor = contexto[chave];
    return typeof valor === "string" && valor.trim() ? valor : null;
  }
}
