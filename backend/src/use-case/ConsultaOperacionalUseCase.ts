import type {
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioComentarios,
  RepositorioPecas,
  RepositorioReservas
} from "../dominio/repositorios/contratos.js";
import type { ConversaAtendimentoComMensagens, MensagemAtendimento, Peca, RegistroComentario, Reserva } from "../dominio/tipos.js";
import { eventosEnviadosAoN8n } from "../dominio/tipos.js";
import type { StatusIntegracao } from "./ConsultaIntegracoesUseCase.js";

type EstadoOperacional = "ATIVA" | "PENDENTE" | "DESATIVADA";

export class ConsultaOperacionalUseCase {
  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly repositorioAuditoria: RepositorioAuditoria,
    private readonly repositorioAtendimento: RepositorioAtendimento
  ) {}

  async consultar(integracoes: StatusIntegracao[]) {
    const [pecas, reservas, comentarios] = await Promise.all([
      this.repositorioPecas.listar(),
      this.repositorioReservas.listar(),
      this.repositorioComentarios.listar(200)
    ]);

    const n8nConfigurado = process.env.N8N_EVENTOS_ATIVOS !== "false" && Boolean(process.env.N8N_WEBHOOK_EVENTOS_URL);
    const providerWhatsApp = this.providerWhatsAppSelecionado();
    const evolutionConfigurada = Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY);
    const cloudApiConfigurada = Boolean(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID && process.env.WHATSAPP_CLOUD_ACCESS_TOKEN);
    const whatsappDiretoConfigurado =
      this.providerCloudApiSelecionado(providerWhatsApp) ? cloudApiConfigurada : evolutionConfigurada;
    const whatsappDireto = process.env.N8N_ASSUME_WHATSAPP !== "true";
    const aguardandoPagamento = reservas.filter((reserva) => reserva.estado === "WAITING_PAYMENT").length;
    const revisaoManual = comentarios.filter(
      (comentario) => comentario.estado === "REVISAO_MANUAL" || comentario.interpretacao?.requiresManualReview
    ).length;

    return {
      geradoEm: new Date().toISOString(),
      agentes: [
        {
          id: "parser-reservas",
          nome: "Parser e reservas",
          descricao: "Interpreta comentários, valida telefone angolano, cria reservas e fila.",
          estado: "ATIVA" satisfies EstadoOperacional,
          origem: "backend",
          gatilho: "COMMENT_RECEIVED",
          acaoPrincipal: "ProcessadorComentarios -> MotorReservas",
          canal: "Backend",
          evidencia: `${comentarios.length} comentários analisados, ${reservas.length} reservas no histórico`
        },
        {
          id: "expiracao-fila",
          nome: "Expiração e fila",
          descricao: "Expira reservas vencidas e promove o próximo cliente da fila.",
          estado: process.env.INICIAR_AGENDADOR_EXPIRACAO === "false" ? "DESATIVADA" : "ATIVA",
          origem: "backend",
          gatilho: "Agendador a cada 30 segundos",
          acaoPrincipal: "MonitorReservasUseCase",
          canal: "Backend",
          evidencia: `${aguardandoPagamento} reservas aguardando pagamento`
        },
        {
          id: "whatsapp-reservas",
          nome: "Mensagens WhatsApp",
          descricao: "Envia reserva criada, fila, expiração, pagamento e cancelamento.",
          estado: whatsappDireto
            ? whatsappDiretoConfigurado
              ? "ATIVA"
              : "PENDENTE"
            : n8nConfigurado
              ? "ATIVA"
              : "PENDENTE",
          origem: whatsappDireto ? "backend" : "n8n",
          gatilho: "Eventos de reserva e pagamento",
          acaoPrincipal: whatsappDireto ? this.acaoPrincipalWhatsApp(providerWhatsApp) : "Workflow n8n",
          canal: whatsappDireto ? this.canalWhatsApp(providerWhatsApp) : "n8n + Evolution API",
          evidencia: whatsappDireto
            ? this.evidenciaWhatsApp(providerWhatsApp)
            : process.env.N8N_WEBHOOK_EVENTOS_URL ?? "Webhook n8n pendente"
        },
        {
          id: "atendimento-ia",
          nome: "Atendimento contextual",
          descricao: "Consulta contexto do cliente antes de qualquer resposta automática.",
          estado: n8nConfigurado ? "ATIVA" : "PENDENTE",
          origem: "n8n",
          gatilho: "WHATSAPP_MESSAGE_RECEIVED",
          acaoPrincipal: "GET /n8n/customers/by-phone/:phone",
          canal: "n8n + IA + aprovação humana",
          evidencia: `${revisaoManual} comentários pedem revisão humana`
        },
        {
          id: "comprovativos",
          nome: "Comprovativos",
          descricao: "Regista comprovativo, pede aprovação humana e só confirma pagamento pelo backend.",
          estado: n8nConfigurado ? "ATIVA" : "PENDENTE",
          origem: "n8n",
          gatilho: "Imagem/documento recebido no WhatsApp",
          acaoPrincipal: "POST /n8n/payments/:id/proof-received",
          canal: "n8n + vendedor",
          evidencia: `${reservas.filter((reserva) => reserva.estadoPagamento === "COMPROVATIVO_RECEBIDO").length} comprovativos recebidos`
        },
        {
          id: "pos-venda",
          nome: "Pós-venda",
          descricao: "Pede dados de entrega e acompanha encomenda depois do pagamento.",
          estado: n8nConfigurado ? "ATIVA" : "PENDENTE",
          origem: "n8n",
          gatilho: "PAYMENT_CONFIRMED",
          acaoPrincipal: "POST /n8n/orders/:id/delivery-address",
          canal: "n8n + WhatsApp",
          evidencia: `${reservas.filter((reserva) => reserva.estado === "PAID").length} pagamentos confirmados`
        }
      ],
      workflows: [
        this.workflowEventos(n8nConfigurado),
        {
          id: "atendimento-whatsapp-ia",
          nome: "Atendimento WhatsApp com IA",
          estado: n8nConfigurado ? "PRONTO_PARA_IMPORTAR" : "PENDENTE_CONFIGURACAO",
          arquivo: "n8n/workflows/emeu-atendimento-whatsapp.json",
          webhookPath: "emeu-whatsapp-inbound",
          eventos: ["WHATSAPP_MESSAGE_RECEIVED"],
          endpointsBackend: ["/n8n/customers/by-phone/:phone", "/n8n/reservations/active/:phone"],
          guardrails: ["baixa confiança -> humano", "desconto -> humano", "cancelamento ambíguo -> humano"]
        },
        {
          id: "comprovativo-pagamento",
          nome: "Comprovativo e aprovação humana",
          estado: n8nConfigurado ? "PRONTO_PARA_IMPORTAR" : "PENDENTE_CONFIGURACAO",
          arquivo: "n8n/workflows/emeu-comprovativo-pagamento.json",
          webhookPath: "emeu-comprovativo",
          eventos: ["PAYMENT_PROOF_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_REJECTED"],
          endpointsBackend: [
            "/n8n/reservations/active/:phone",
            "/n8n/payments/:id/proof-received",
            "/n8n/payments/:id/confirm",
            "/n8n/payments/:id/reject"
          ],
          guardrails: ["pagamento confirmado só após aprovação", "comprovativo ilegível -> humano"]
        }
      ],
      configuracoes: [
        {
          grupo: "Reservas",
          nome: "Tempo de reserva",
          valor: `${Number(process.env.MINUTOS_RESERVA ?? 10)} min`,
          estado: "ATIVA",
          detalhe: "Usado pelo MotorReservas e pelas mensagens automáticas."
        },
        {
          grupo: "Dados",
          nome: "Armazenamento",
          valor: process.env.MODO_ARMAZENAMENTO ?? "prisma",
          estado: "ATIVA",
          detalhe: "Modo atual do backend."
        },
        {
          grupo: "n8n",
          nome: "Webhook de eventos",
          valor: process.env.N8N_WEBHOOK_EVENTOS_URL ?? "não configurado",
          estado: n8nConfigurado ? "ATIVA" : "PENDENTE",
          detalhe: "Recebe eventos enviados pelo backend."
        },
        {
          grupo: "WhatsApp",
          nome: "Responsável pelo envio",
          valor: process.env.N8N_ASSUME_WHATSAPP === "true" ? "n8n" : "backend",
          estado: "ATIVA",
          detalhe: "Define se as mensagens automáticas saem via n8n ou backend."
        }
      ],
      integracoes,
      metricas: {
        pecas: pecas.length,
        comentarios: comentarios.length,
        reservas: reservas.length,
        aguardandoPagamento,
        revisaoManual
      }
    };
  }

  async listarEntregas() {
    const [reservas, pecas] = await Promise.all([this.repositorioReservas.listar(), this.repositorioPecas.listar()]);
    const pecasPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca]));

    return {
      geradoEm: new Date().toISOString(),
      total: reservas.filter((reserva) => reserva.estado === "PAID").length,
      entregas: reservas
        .filter((reserva) => reserva.estado === "PAID")
        .map((reserva) => this.mapearEntrega(reserva, pecasPorCodigo.get(reserva.codigoPeca) ?? null))
    };
  }

  async exportarEntregasCsv(): Promise<string> {
    const relatorio = await this.listarEntregas();
    const linhas = [
      ["reservaId", "codigoPeca", "nomePeca", "telefoneCliente", "nomeCliente", "precoEmKwanza", "enderecoEntrega"].join(","),
      ...relatorio.entregas.map((entrega) =>
        [
          entrega.reservaId,
          entrega.codigoPeca,
          entrega.nomePeca,
          entrega.telefoneCliente,
          entrega.nomeCliente,
          String(entrega.precoEmKwanza),
          entrega.enderecoEntrega
        ]
          .map((valor) => this.escaparCsv(valor))
          .join(",")
      )
    ];

    return `${linhas.join("\n")}\n`;
  }

  async gerarRelatorioLivePiloto(liveId?: string) {
    const [reservasTodas, comentariosTodos] = await Promise.all([
      this.repositorioReservas.listar(),
      this.repositorioComentarios.listar(1000)
    ]);
    const reservas = liveId ? reservasTodas.filter((reserva) => reserva.liveId === liveId) : reservasTodas;
    const comentarios = liveId
      ? comentariosTodos.filter((comentario) => comentario.comentario.liveId === liveId)
      : comentariosTodos;
    const comentariosComIntencao = comentarios.filter((comentario) => comentario.interpretacao?.intent === "BUY");
    const comentariosRevisao = comentarios.filter((comentario) => comentario.estado === "REVISAO_MANUAL");
    const reservasPagas = reservas.filter((reserva) => reserva.estado === "PAID");

    return {
      liveId: liveId ?? null,
      geradoEm: new Date().toISOString(),
      metricas: {
        comentariosCapturados: comentarios.length,
        comentariosComIntencao: comentariosComIntencao.length,
        comentariosRevisaoManual: comentariosRevisao.length,
        reservasCriadas: reservas.length,
        reservasPagas: reservasPagas.length,
        reservasExpiradas: reservas.filter((reserva) => reserva.estado === "EXPIRED").length,
        reservasCanceladas: reservas.filter((reserva) => reserva.estado === "CANCELLED").length,
        filaEspera: reservas.filter((reserva) => reserva.estado === "WAITLISTED").length,
        taxaConversaoComentarioReserva:
          comentariosComIntencao.length > 0 ? Number(((reservas.length / comentariosComIntencao.length) * 100).toFixed(2)) : 0,
        tempoMedioComentarioReservaSegundos: this.calcularTempoMedioComentarioReservaSegundos(comentarios, reservas)
      },
      feedback: {
        pendente: true,
        nps: null,
        observacoes: []
      }
    };
  }

  async gerarRelatorioCrmPosLive(liveId?: string) {
    const [reservasTodas, comentariosTodos, conversasTodas] = await Promise.all([
      this.repositorioReservas.listar(),
      this.repositorioComentarios.listar(1000),
      this.repositorioAtendimento.listarConversasComMensagens(1000)
    ]);
    const reservas = liveId ? reservasTodas.filter((reserva) => reserva.liveId === liveId) : reservasTodas;
    const comentarios = liveId
      ? comentariosTodos.filter((comentario) => comentario.comentario.liveId === liveId)
      : comentariosTodos;
    const telefonesDaLive = new Set([
      ...reservas.map((reserva) => reserva.telefoneCliente),
      ...comentarios.flatMap((comentario) => (comentario.interpretacao?.phone ? [comentario.interpretacao.phone] : []))
    ]);
    const conversas = conversasTodas
      .map((conversa) => ({
        ...conversa,
        mensagens: conversa.mensagens.filter((mensagem) =>
          this.mensagemPertenceAoRelatorioCrm(mensagem, reservas, telefonesDaLive, liveId)
        )
      }))
      .filter((conversa) => conversa.mensagens.length > 0 || telefonesDaLive.has(conversa.conversa.telefone));
    const clientes = this.agruparClientesCrmPosLive(conversas, reservas);
    const clientesAtendidos = clientes.length;
    const conversoes = clientes.filter((cliente) => cliente.reservasPagas > 0).length;
    const mensagens = conversas.flatMap((conversa) => conversa.mensagens);
    const comentariosComIntencao = comentarios.filter((comentario) => comentario.interpretacao?.intent === "BUY");
    const temposPrimeiraResposta = clientes
      .map((cliente) => cliente.tempoPrimeiraRespostaSegundos)
      .filter((valor): valor is number => typeof valor === "number");

    return {
      liveId: liveId ?? null,
      geradoEm: new Date().toISOString(),
      metricas: {
        clientesAtendidos,
        conversoes,
        taxaConversaoClientes: clientesAtendidos > 0 ? Number(((conversoes / clientesAtendidos) * 100).toFixed(2)) : 0,
        mensagensRecebidas: mensagens.filter((mensagem) => mensagem.direcao === "INBOUND").length,
        mensagensEnviadas: mensagens.filter((mensagem) => mensagem.direcao === "OUTBOUND").length,
        mensagensFalhadas: mensagens.filter((mensagem) => mensagem.status === "FAILED").length,
        tempoMedioPrimeiraRespostaSegundos: temposPrimeiraResposta.length
          ? Number((temposPrimeiraResposta.reduce((total, item) => total + item, 0) / temposPrimeiraResposta.length).toFixed(2))
          : null
      },
      oportunidadesPerdidas: {
        comentariosComIntencaoSemReserva: Math.max(0, comentariosComIntencao.length - reservas.length),
        comentariosRevisaoManual: comentarios.filter((comentario) => comentario.estado === "REVISAO_MANUAL").length,
        reservasExpiradas: reservas.filter((reserva) => reserva.estado === "EXPIRED").length,
        reservasCanceladas: reservas.filter((reserva) => reserva.estado === "CANCELLED").length,
        mensagensFalhadas: mensagens.filter((mensagem) => mensagem.status === "FAILED").length
      },
      clientes
    };
  }

  async exportarCrmPosLiveCsv(liveId?: string): Promise<string> {
    const relatorio = await this.gerarRelatorioCrmPosLive(liveId);
    const linhas = [
      [
        "telefone",
        "nomeCliente",
        "reservas",
        "reservasPagas",
        "mensagens",
        "mensagensFalhadas",
        "tempoPrimeiraRespostaSegundos",
        "statusOportunidade"
      ].join(","),
      ...relatorio.clientes.map((cliente) =>
        [
          cliente.telefone,
          cliente.nomeCliente,
          String(cliente.reservas),
          String(cliente.reservasPagas),
          String(cliente.mensagens),
          String(cliente.mensagensFalhadas),
          cliente.tempoPrimeiraRespostaSegundos ?? "",
          cliente.statusOportunidade
        ]
          .map((valor) => this.escaparCsv(valor))
          .join(",")
      )
    ];

    return `${linhas.join("\n")}\n`;
  }

  async listarOutboxN8n(limite = 100) {
    const eventos = await this.repositorioAuditoria.listarEventosN8n(limite);
    return {
      geradoEm: new Date().toISOString(),
      eventos
    };
  }

  async consultarSaudeOutboxN8n() {
    return this.repositorioAuditoria.resumirEventosN8n();
  }

  private mensagemPertenceAoRelatorioCrm(
    mensagem: MensagemAtendimento,
    reservas: Reserva[],
    telefonesDaLive: Set<string>,
    liveId?: string
  ): boolean {
    if (!liveId) return true;
    if (this.obterStringDoContexto(mensagem.contexto, "liveId") === liveId) return true;

    const reservaContexto = mensagem.contexto.reserva;
    if (
      reservaContexto &&
      typeof reservaContexto === "object" &&
      !Array.isArray(reservaContexto) &&
      this.obterStringDoContexto(reservaContexto as Record<string, unknown>, "liveId") === liveId
    ) {
      return true;
    }

    if (mensagem.reservaId && reservas.some((reserva) => reserva.id === mensagem.reservaId)) return true;
    return telefonesDaLive.has(mensagem.telefone);
  }

  private agruparClientesCrmPosLive(conversas: ConversaAtendimentoComMensagens[], reservas: Reserva[]) {
    const grupos = new Map<
      string,
      {
        conversas: ConversaAtendimentoComMensagens[];
        mensagens: MensagemAtendimento[];
      }
    >();

    for (const conversa of conversas) {
      const telefone = conversa.conversa.telefone;
      const grupo = grupos.get(telefone) ?? { conversas: [], mensagens: [] };
      grupo.conversas.push(conversa);
      grupo.mensagens.push(...conversa.mensagens);
      grupos.set(telefone, grupo);
    }

    return [...grupos.entries()].map(([telefone, grupo]) => {
      const conversasOrdenadas = [...grupo.conversas].sort(
        (a, b) =>
          (b.conversa.ultimaMensagemEm?.getTime() ?? b.conversa.atualizadoEm.getTime()) -
          (a.conversa.ultimaMensagemEm?.getTime() ?? a.conversa.atualizadoEm.getTime())
      );
      const conversaPrincipal = conversasOrdenadas[0];
      const mensagens = grupo.mensagens.sort((a, b) => a.enviadaEm.getTime() - b.enviadaEm.getTime());
      return this.mapearClienteCrmPosLive(telefone, conversaPrincipal, mensagens, reservas);
    });
  }

  private mapearClienteCrmPosLive(
    telefone: string,
    conversaPrincipal: ConversaAtendimentoComMensagens,
    mensagens: MensagemAtendimento[],
    reservas: Reserva[]
  ) {
    const reservasCliente = reservas.filter((reserva) => reserva.telefoneCliente === telefone);
    const mensagensFalhadas = mensagens.filter((mensagem) => mensagem.status === "FAILED").length;
    const tempoPrimeiraRespostaSegundos = this.calcularTempoPrimeiraRespostaSegundos(mensagens);
    const primeiraInteracao = mensagens[0]?.enviadaEm ?? conversaPrincipal.cliente.primeiraInteracaoEm;
    const ultimaInteracao = mensagens.at(-1)?.enviadaEm ?? conversaPrincipal.cliente.ultimaInteracaoEm;

    return {
      telefone,
      nomeCliente: conversaPrincipal.cliente.nome ?? this.obterNomeDeMensagemCrm(mensagens) ?? "Cliente",
      usernameCliente: conversaPrincipal.cliente.username,
      responsavelId: conversaPrincipal.conversa.responsavelId,
      estadoCrm: conversaPrincipal.conversa.estado,
      prioridade: conversaPrincipal.conversa.prioridade,
      reservas: reservasCliente.length,
      reservasPagas: reservasCliente.filter((reserva) => reserva.estado === "PAID").length,
      reservasExpiradas: reservasCliente.filter((reserva) => reserva.estado === "EXPIRED").length,
      reservasCanceladas: reservasCliente.filter((reserva) => reserva.estado === "CANCELLED").length,
      mensagens: mensagens.length,
      mensagensFalhadas,
      tempoPrimeiraRespostaSegundos,
      primeiraInteracaoEm: primeiraInteracao.toISOString(),
      ultimaInteracaoEm: ultimaInteracao.toISOString(),
      statusOportunidade: this.classificarStatusOportunidade(reservasCliente, mensagensFalhadas)
    };
  }

  private calcularTempoPrimeiraRespostaSegundos(mensagens: MensagemAtendimento[]): number | null {
    const primeiraInbound = mensagens.find((mensagem) => mensagem.direcao === "INBOUND");
    if (!primeiraInbound) return null;

    const primeiraResposta = mensagens.find(
      (mensagem) => mensagem.direcao === "OUTBOUND" && mensagem.enviadaEm.getTime() >= primeiraInbound.enviadaEm.getTime()
    );
    if (!primeiraResposta) return null;

    return Number(((primeiraResposta.enviadaEm.getTime() - primeiraInbound.enviadaEm.getTime()) / 1000).toFixed(2));
  }

  private classificarStatusOportunidade(reservas: Reserva[], mensagensFalhadas: number): string {
    if (reservas.some((reserva) => reserva.estado === "PAID")) return "convertida";
    if (mensagensFalhadas > 0) return "risco_mensagem_falhada";
    if (reservas.some((reserva) => reserva.estado === "EXPIRED" || reserva.estado === "CANCELLED")) return "perdida";
    if (reservas.length > 0) return "em_andamento";
    return "sem_reserva";
  }

  private obterNomeDeMensagemCrm(mensagens: MensagemAtendimento[]): string | null {
    for (const mensagem of mensagens) {
      const direto = this.obterStringDoContexto(mensagem.contexto, "nomeCliente");
      if (direto) return direto;

      const data = mensagem.contexto.data;
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

  private workflowEventos(n8nConfigurado: boolean) {
    return {
      id: "eventos-vendas",
      nome: "Eventos de venda -> WhatsApp",
      estado: n8nConfigurado ? "PRONTO_PARA_IMPORTAR" : "PENDENTE_CONFIGURACAO",
      arquivo: "n8n/workflows/emeu-eventos-vendas.json",
      webhookPath: "emeu-eventos",
      eventos: [...eventosEnviadosAoN8n],
      endpointsBackend: ["/n8n/reservations/active/:phone", "/n8n/products/:code"],
      guardrails: ["não altera stock", "não confirma pagamento", "não inventa preço"]
    };
  }

  private providerWhatsAppSelecionado() {
    return process.env.WHATSAPP_PROVIDER?.trim().toLowerCase() || "console";
  }

  private providerCloudApiSelecionado(provider: string) {
    return provider === "cloud-api" || provider === "whatsapp-cloud-api";
  }

  private acaoPrincipalWhatsApp(provider: string) {
    if (this.providerCloudApiSelecionado(provider)) return "ProvedorWhatsAppCloudApi";
    if (provider === "evolution") return "ProvedorWhatsAppEvolution";
    return "WhatsAppConsoleProvider";
  }

  private canalWhatsApp(provider: string) {
    if (this.providerCloudApiSelecionado(provider)) return "WhatsApp Cloud API oficial";
    if (provider === "evolution") return "Evolution API direta";
    return "Console local";
  }

  private evidenciaWhatsApp(provider: string) {
    if (this.providerCloudApiSelecionado(provider)) {
      return process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
        ? `Phone Number ID ${process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID}`
        : "WhatsApp Cloud API sem Phone Number ID";
    }

    if (provider === "evolution") return process.env.EVOLUTION_API_URL ?? "Evolution sem URL";
    return "Provider console ativo";
  }

  private mapearEntrega(reserva: Reserva, peca: Peca | null) {
    return {
      reservaId: reserva.id,
      codigoPeca: reserva.codigoPeca,
      nomePeca: peca?.nome ?? reserva.codigoPeca,
      telefoneCliente: reserva.telefoneCliente,
      nomeCliente: reserva.nomeCliente,
      usernameCliente: reserva.usernameCliente,
      precoEmKwanza: peca?.precoEmKwanza ?? null,
      enderecoEntrega: reserva.enderecoEntrega ?? "",
      pagaEm: reserva.atualizadaEm
    };
  }

  private calcularTempoMedioComentarioReservaSegundos(comentarios: RegistroComentario[], reservas: Reserva[]): number | null {
    const diferencas = reservas.flatMap((reserva) => {
      const comentario = comentarios.find(
        (item) =>
          item.comentario.liveId === reserva.liveId &&
          item.comentario.commentText === reserva.comentarioOriginal &&
          item.interpretacao?.phone === reserva.telefoneCliente
      );

      if (!comentario) return [];
      return [Math.max(0, (reserva.criadaEm.getTime() - comentario.criadoEm.getTime()) / 1000)];
    });

    if (!diferencas.length) return null;
    return Number((diferencas.reduce((total, item) => total + item, 0) / diferencas.length).toFixed(2));
  }

  private escaparCsv(valor: unknown): string {
    const texto = String(valor ?? "");
    if (!/[",\n]/.test(texto)) return texto;
    return `"${texto.replace(/"/g, '""')}"`;
  }
}
