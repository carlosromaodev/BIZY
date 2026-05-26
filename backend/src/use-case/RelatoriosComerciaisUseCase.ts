import type {
  RepositorioAtendimento,
  RepositorioCampanhas,
  RepositorioClientes,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioReservas,
  RepositorioSocialInbox,
  RepositorioTarefasOperacionais,
  RepositorioTrackingComercial
} from "../dominio/repositorios/contratos.js";
import type {
  CampanhaCrm,
  Cliente360,
  ConversaAtendimentoComMensagens,
  EventoTrackingComercial,
  FiltrosPedidos,
  ItemCampanhaCrm,
  Pedido,
  Peca,
  Reserva
} from "../dominio/tipos.js";
import { escapeHtml, formatDateLabel, renderPdfFromHtml, type OpcoesRenderPdf } from "../infra/pdf/PdfRenderer.js";

export interface FiltrosRelatorioComercial {
  dataInicio?: Date;
  dataFim?: Date;
  canal?: string;
  produto?: string;
  colecao?: string;
  estado?: Pedido["estado"];
  responsavelId?: string;
}

export type RenderizadorRelatorioPdf = (html: string, options?: OpcoesRenderPdf) => Promise<Buffer>;

export class RelatoriosComerciaisUseCase {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly clientes: RepositorioClientes,
    private readonly pecas: RepositorioPecas,
    private readonly reservas: RepositorioReservas,
    private readonly atendimento: RepositorioAtendimento,
    private readonly tarefas: RepositorioTarefasOperacionais,
    private readonly tracking?: RepositorioTrackingComercial,
    private readonly socialInbox?: RepositorioSocialInbox,
    private readonly campanhas?: RepositorioCampanhas,
    private readonly renderizadorPdf: RenderizadorRelatorioPdf = renderPdfFromHtml
  ) {}

  async gerarRelatorio(negocioId: string, filtros: FiltrosRelatorioComercial = {}) {
    const filtrosPedidos: FiltrosPedidos = {
      estado: filtros.estado,
      canal: filtros.canal,
      produto: filtros.produto,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      limite: 10_000
    };
    const [pedidos, clientes, pecas, reservas, conversas, tarefas] = await Promise.all([
      this.pedidos.listar(negocioId, filtrosPedidos),
      this.clientes.listar(negocioId, { limite: 100_000 }),
      this.pecas.listar(negocioId),
      this.reservas.listar(negocioId),
      this.atendimento.listarConversasComMensagens(10_000, negocioId),
      this.tarefas.listar(negocioId, { limite: 10_000 })
    ]);
    const pecasDoRelatorio = this.filtrarPecasPorColecao(pecas, filtros);
    const codigosDaColecao = this.obterCodigosDaColecao(pecasDoRelatorio, filtros);
    const pedidosDoRelatorio = this.filtrarPedidosPorColecao(pedidos, codigosDaColecao, filtros);
    const reservasDoRelatorio = this.filtrarReservasPorColecao(reservas, codigosDaColecao, filtros);
    const pecasPorCodigo = new Map(pecasDoRelatorio.map((peca) => [peca.codigo, peca]));
    const pedidosPagos = pedidosDoRelatorio.filter((pedido) => pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO" || pedido.estado === "ENTREGUE");
    const pagamentosPendentes = pedidosDoRelatorio.filter((pedido) => pedido.estadoPagamento === "PENDENTE" || pedido.estado === "AGUARDANDO_PAGAMENTO");
    const receitaBrutaEmKwanza = pedidosDoRelatorio.reduce((total, pedido) => total + pedido.subtotalEmKwanza, 0);
    const descontosEmKwanza = pedidosDoRelatorio.reduce((total, pedido) => total + pedido.descontoEmKwanza, 0);
    const entregaEmKwanza = pedidosDoRelatorio.reduce((total, pedido) => total + pedido.taxaEntregaEmKwanza, 0);
    const receitaLiquidaEstimadaEmKwanza = receitaBrutaEmKwanza - descontosEmKwanza + entregaEmKwanza;
    const clientesComPedidosPagos = this.contarPedidosPagosPorCliente(pedidosPagos);
    const reservasComIntencao = reservasDoRelatorio.filter((reserva) => !filtros.dataInicio || reserva.criadaEm >= filtros.dataInicio);
    const reservasPagas = reservasComIntencao.filter((reserva) => reserva.estado === "PAID");
    const desempenhoCampanhas = await this.calcularDesempenhoCampanhas(negocioId, pedidosDoRelatorio, clientes);
    const oportunidadesPerdidas = await this.calcularOportunidadesPerdidas(
      negocioId,
      pedidosDoRelatorio,
      reservasDoRelatorio,
      conversas
    );

    return {
      geradoEm: new Date().toISOString(),
      filtros,
      metricas: {
        pedidosCriados: pedidosDoRelatorio.length,
        pedidosPagos: pedidosPagos.length,
        pagamentosPendentes: pagamentosPendentes.length,
        ticketMedioEmKwanza: pedidosPagos.length
          ? Math.round(pedidosPagos.reduce((total, pedido) => total + pedido.totalEmKwanza, 0) / pedidosPagos.length)
          : 0,
        clientesNovos: clientes.filter((cliente) => this.dentroDoPeriodo(cliente.primeiraInteracaoEm, filtros)).length,
        clientesRecorrentes: [...clientesComPedidosPagos.values()].filter((total) => total >= 2).length,
        conversaoReservasPercentual: reservasComIntencao.length
          ? Number(((reservasPagas.length / reservasComIntencao.length) * 100).toFixed(2))
          : 0,
        receitaBrutaEmKwanza,
        descontosEmKwanza,
        entregaEmKwanza,
        receitaLiquidaEstimadaEmKwanza
      },
      rankings: {
        produtosMaisVendidos: this.ranquearProdutosVendidos(pedidosPagos, pecasPorCodigo),
        produtosEncalhados: this.listarProdutosEncalhados(pecasDoRelatorio, pedidosPagos),
        produtosMaiorMargem: this.ranquearProdutosPorMargem(pecasDoRelatorio),
        produtosReservaPerdida: this.ranquearReservasPerdidas(reservasDoRelatorio, pecasPorCodigo)
      },
      atendimento: this.calcularMetricasAtendimento(conversas, tarefas),
      campanhas: desempenhoCampanhas,
      oportunidadesPerdidas,
      retencao: {
        clientesRecorrentes: [...clientesComPedidosPagos.values()].filter((total) => total >= 2).length,
        clientesEmRisco: clientes.filter((cliente) => Date.now() - cliente.ultimaInteracaoEm.getTime() > 30 * 86_400_000).length
      }
    };
  }

  async gerarResumoDiario(negocioId: string, filtros: FiltrosRelatorioComercial = {}) {
    const relatorio = await this.gerarRelatorio(negocioId, filtros);
    return {
      geradoEm: relatorio.geradoEm,
      resumo: [
        `${relatorio.metricas.pedidosPagos} pedidos pagos`,
        `${relatorio.metricas.pagamentosPendentes} pagamentos pendentes`,
        `${relatorio.oportunidadesPerdidas.reservasExpiradas} reservas expiradas`
      ],
      metricas: relatorio.metricas,
      tarefasSugeridas: [
        {
          tipo: "COBRANCA",
          quantidade: relatorio.oportunidadesPerdidas.pedidosAguardandoPagamento,
          prioridade: relatorio.oportunidadesPerdidas.pedidosAguardandoPagamento > 0 ? "ALTA" : "NORMAL"
        },
        {
          tipo: "ENTREGA",
          quantidade: relatorio.metricas.pedidosPagos,
          prioridade: "NORMAL"
        }
      ].filter((item) => item.quantidade > 0),
      rankings: relatorio.rankings
    };
  }

  async exportarPdf(
    negocioId: string,
    filtros: FiltrosRelatorioComercial = {}
  ): Promise<{ pdf: Buffer; nomeArquivo: string; quantidade: number; filtros: FiltrosRelatorioComercial }> {
    const relatorio = await this.gerarRelatorio(negocioId, filtros);
    const html = this.renderizarHtmlRelatorioComercial(relatorio);
    const pdf = await this.renderizadorPdf(html, {
      footerLabel: "Bizy - Relatório comercial",
      displayHeaderFooter: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "16mm",
        left: "10mm"
      }
    });

    return {
      pdf,
      nomeArquivo: "relatorio-comercial-bizy.pdf",
      quantidade: 1,
      filtros
    };
  }

  async exportarCsv(
    negocioId: string,
    filtros: FiltrosRelatorioComercial = {}
  ): Promise<{ csv: string; quantidade: number; filtros: FiltrosRelatorioComercial }> {
    const relatorio = await this.gerarRelatorio(negocioId, filtros);
    const linhas = [
      [
        "pedidosPagos",
        "pagamentosPendentes",
        "receitaBrutaEmKwanza",
        "descontosEmKwanza",
        "entregaEmKwanza",
        "receitaLiquidaEstimadaEmKwanza",
        "ticketMedioEmKwanza",
        "conversasAbertas",
        "conversasResolvidas",
        "tempoMedioPrimeiraRespostaMinutos",
        "taxaResolucaoPercentual",
        "mensagensFalhadas",
        "campanhasReceitaGeradaEmKwanza",
        "campanhasRespostas",
        "campanhasOptOut",
        "campanhasFalhas",
        "campanhasPedidosGerados",
        "clientesQuePerguntaramENaoCompraram",
        "comprovativosNaoEnviados",
        "socialLeadsSemAtendimento",
        "whatsappClicksSemCompra"
      ],
      [
        String(relatorio.metricas.pedidosPagos),
        String(relatorio.metricas.pagamentosPendentes),
        String(relatorio.metricas.receitaBrutaEmKwanza),
        String(relatorio.metricas.descontosEmKwanza),
        String(relatorio.metricas.entregaEmKwanza),
        String(relatorio.metricas.receitaLiquidaEstimadaEmKwanza),
        String(relatorio.metricas.ticketMedioEmKwanza),
        String(relatorio.atendimento.conversasAbertas),
        String(relatorio.atendimento.conversasResolvidas),
        String(relatorio.atendimento.tempoMedioPrimeiraRespostaMinutos),
        String(relatorio.atendimento.taxaResolucaoPercentual),
        String(relatorio.atendimento.mensagensFalhadas),
        String(relatorio.campanhas.receitaGeradaEmKwanza),
        String(relatorio.campanhas.respostas),
        String(relatorio.campanhas.optOut),
        String(relatorio.campanhas.falhas),
        String(relatorio.campanhas.pedidosGerados),
        String(relatorio.oportunidadesPerdidas.clientesQuePerguntaramENaoCompraram),
        String(relatorio.oportunidadesPerdidas.comprovativosNaoEnviados),
        String(relatorio.oportunidadesPerdidas.socialLeadsSemAtendimento),
        String(relatorio.oportunidadesPerdidas.whatsappClicksSemCompra)
      ]
    ];
    return {
      csv: `${linhas.map((linha) => linha.map((valor) => this.csv(valor)).join(",")).join("\n")}\n`,
      quantidade: 1,
      filtros
    };
  }

  async gerarRelatorioSocialReceita(negocioId: string) {
    const [eventos, social, pedidos] = await Promise.all([
      this.tracking?.listarEventos(negocioId, { limite: 20_000 }) ?? Promise.resolve([]),
      this.socialInbox?.listar(negocioId, { limite: 20_000 }) ?? Promise.resolve([]),
      this.pedidos.listar(negocioId, { limite: 20_000 })
    ]);
    const pedidosPagosPorId = new Map(
      pedidos
        .filter((pedido) => pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO" || pedido.estado === "ENTREGUE")
        .map((pedido) => [pedido.id, pedido])
    );
    const mapa = new Map<string, {
      chave: string;
      origem: string | null;
      canal: string | null;
      postId: string | null;
      codigoProduto: string | null;
      comentarios: number;
      leads: number;
      pedidos: number;
      receitaEmKwanza: number;
      eventos: number;
    }>();

    for (const item of social) {
      const postId = typeof item.contexto.postId === "string" ? item.contexto.postId : item.postId;
      const chave = postId ?? item.autorUsername ?? item.canal;
      const atual = this.obterLinhaSocial(mapa, chave, {
        origem: item.provider,
        canal: item.canal,
        postId,
        codigoProduto: this.extrairProdutoContexto(item.entidades)
      });
      atual.comentarios += 1;
    }

    for (const evento of eventos) {
      const chave = this.chaveEventoSocial(evento);
      const atual = this.obterLinhaSocial(mapa, chave, {
        origem: evento.origem,
        canal: evento.canal,
        postId: this.valorTexto(evento.metadata.postId),
        codigoProduto: evento.codigoProduto
      });
      atual.eventos += 1;
      if (["WHATSAPP_CLICK", "CHECKOUT_INICIADO"].includes(evento.tipo)) atual.leads += 1;
      if (evento.tipo === "PEDIDO_CRIADO") {
        atual.pedidos += 1;
        const pedidoId = this.valorTexto(evento.metadata.pedidoId);
        const pedidoPago = pedidoId ? pedidosPagosPorId.get(pedidoId) : null;
        const total = pedidoPago?.totalEmKwanza ?? this.valorNumero(evento.metadata.totalEmKwanza);
        atual.receitaEmKwanza += total ?? 0;
      }
      if (evento.tipo === "PAGAMENTO_CONFIRMADO") {
        atual.receitaEmKwanza += this.valorNumero(evento.metadata.totalEmKwanza) ?? 0;
      }
    }

    return {
      itens: [...mapa.values()].sort((a, b) => {
        if (b.receitaEmKwanza !== a.receitaEmKwanza) return b.receitaEmKwanza - a.receitaEmKwanza;
        if (b.leads !== a.leads) return b.leads - a.leads;
        return b.comentarios - a.comentarios;
      })
    };
  }

  private ranquearProdutosVendidos(pedidos: Pedido[], pecasPorCodigo: Map<string, Peca>) {
    const mapa = new Map<string, {
      codigoPeca: string;
      nomeProduto: string;
      quantidadeVendida: number;
      receitaEmKwanza: number;
      margemEstimadaEmKwanza: number;
    }>();
    for (const pedido of pedidos) {
      for (const item of pedido.itens) {
        const peca = pecasPorCodigo.get(item.codigoPeca);
        const atual = mapa.get(item.codigoPeca) ?? {
          codigoPeca: item.codigoPeca,
          nomeProduto: item.nomeProduto,
          quantidadeVendida: 0,
          receitaEmKwanza: 0,
          margemEstimadaEmKwanza: 0
        };
        atual.quantidadeVendida += item.quantidade;
        atual.receitaEmKwanza += item.subtotalEmKwanza;
        atual.margemEstimadaEmKwanza += ((peca?.margemEstimadaEmKwanza ?? 0) * item.quantidade);
        mapa.set(item.codigoPeca, atual);
      }
    }
    return [...mapa.values()].sort((a, b) => b.quantidadeVendida - a.quantidadeVendida).slice(0, 20);
  }

  private listarProdutosEncalhados(pecas: Peca[], pedidosPagos: Pedido[]) {
    const vendidos = new Set(pedidosPagos.flatMap((pedido) => pedido.itens.map((item) => item.codigoPeca)));
    return pecas
      .filter((peca) => peca.quantidade > 0 && !vendidos.has(peca.codigo) && !peca.arquivadaEm)
      .map((peca) => ({
        codigoPeca: peca.codigo,
        nomeProduto: peca.nome,
        quantidade: peca.quantidade,
        valorParadoEmKwanza: peca.precoEmKwanza * peca.quantidade
      }))
      .sort((a, b) => b.valorParadoEmKwanza - a.valorParadoEmKwanza)
      .slice(0, 20);
  }

  private ranquearProdutosPorMargem(pecas: Peca[]) {
    return pecas
      .filter((peca) => peca.margemEstimadaEmKwanza !== null)
      .map((peca) => ({
        codigoPeca: peca.codigo,
        nomeProduto: peca.nome,
        margemUnitariaEmKwanza: peca.margemEstimadaEmKwanza ?? 0,
        margemPotencialEmKwanza: (peca.margemEstimadaEmKwanza ?? 0) * peca.quantidade
      }))
      .sort((a, b) => b.margemPotencialEmKwanza - a.margemPotencialEmKwanza)
      .slice(0, 20);
  }

  private ranquearReservasPerdidas(reservas: Awaited<ReturnType<RepositorioReservas["listar"]>>, pecasPorCodigo: Map<string, Peca>) {
    const mapa = new Map<string, { codigoPeca: string; nomeProduto: string; reservasPerdidas: number; valorPerdidoEmKwanza: number }>();
    for (const reserva of reservas.filter((item) => ["EXPIRED", "CANCELLED"].includes(item.estado))) {
      const peca = pecasPorCodigo.get(reserva.codigoPeca);
      const atual = mapa.get(reserva.codigoPeca) ?? {
        codigoPeca: reserva.codigoPeca,
        nomeProduto: peca?.nome ?? reserva.codigoPeca,
        reservasPerdidas: 0,
        valorPerdidoEmKwanza: 0
      };
      atual.reservasPerdidas += 1;
      atual.valorPerdidoEmKwanza += peca?.precoEmKwanza ?? 0;
      mapa.set(reserva.codigoPeca, atual);
    }
    return [...mapa.values()]
      .sort((a, b) => {
        if (b.reservasPerdidas !== a.reservasPerdidas) return b.reservasPerdidas - a.reservasPerdidas;
        if (b.valorPerdidoEmKwanza !== a.valorPerdidoEmKwanza) return b.valorPerdidoEmKwanza - a.valorPerdidoEmKwanza;
        return a.codigoPeca.localeCompare(b.codigoPeca, "pt-AO", { numeric: true });
      })
      .slice(0, 20);
  }

  private contarPedidosPagosPorCliente(pedidos: Pedido[]) {
    const mapa = new Map<string, number>();
    for (const pedido of pedidos) {
      mapa.set(pedido.clienteNegocioId, (mapa.get(pedido.clienteNegocioId) ?? 0) + 1);
    }
    return mapa;
  }

  private calcularMetricasAtendimento(
    conversas: ConversaAtendimentoComMensagens[],
    tarefas: Awaited<ReturnType<RepositorioTarefasOperacionais["listar"]>>
  ) {
    const estadosResolvidos = ["RESOLVIDA", "ENCERRADA"];
    const conversasResolvidas = conversas.filter((item) => estadosResolvidos.includes(item.conversa.estado)).length;
    const temposPrimeiraResposta = conversas
      .map((conversa) => this.calcularTempoPrimeiraRespostaMinutos(conversa))
      .filter((valor): valor is number => valor !== null);

    return {
      conversasAbertas: conversas.filter((item) => !estadosResolvidos.includes(item.conversa.estado)).length,
      conversasResolvidas,
      taxaResolucaoPercentual: conversas.length ? Number(((conversasResolvidas / conversas.length) * 100).toFixed(2)) : 0,
      tempoMedioPrimeiraRespostaMinutos: temposPrimeiraResposta.length
        ? Number((temposPrimeiraResposta.reduce((total, valor) => total + valor, 0) / temposPrimeiraResposta.length).toFixed(2))
        : 0,
      mensagensFalhadas: conversas.flatMap((item) => item.mensagens).filter((mensagem) => mensagem.status === "FAILED").length,
      tarefasAbertas: tarefas.filter((tarefa) => !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)).length,
      tarefasAtrasadas: tarefas.filter((tarefa) => tarefa.prazoEm && tarefa.prazoEm < new Date() && !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)).length
    };
  }

  private calcularTempoPrimeiraRespostaMinutos(conversa: ConversaAtendimentoComMensagens): number | null {
    const mensagens = [...conversa.mensagens].sort((a, b) => a.enviadaEm.getTime() - b.enviadaEm.getTime());
    const primeiraMensagemCliente = mensagens.find((mensagem) => mensagem.direcao === "INBOUND" || mensagem.remetente === "cliente");
    if (!primeiraMensagemCliente) return null;

    const primeiraResposta = mensagens.find(
      (mensagem) =>
        mensagem.enviadaEm > primeiraMensagemCliente.enviadaEm &&
        mensagem.direcao === "OUTBOUND" &&
        mensagem.status !== "FAILED" &&
        mensagem.canal !== "interno" &&
        ["agente", "sistema"].includes(mensagem.remetente)
    );
    if (!primeiraResposta) return null;

    return Number(((primeiraResposta.enviadaEm.getTime() - primeiraMensagemCliente.enviadaEm.getTime()) / 60_000).toFixed(2));
  }

  private async calcularDesempenhoCampanhas(negocioId: string, pedidos: Pedido[], clientes: Cliente360[]) {
    if (!this.campanhas) {
      return {
        total: 0,
        respostas: 0,
        optOut: 0,
        falhas: 0,
        pedidosGerados: 0,
        receitaGeradaEmKwanza: 0,
        segmentosConvertidos: [],
        itens: []
      };
    }

    const campanhas = await this.campanhas.listar(negocioId, { limite: 10_000 });
    const [itensPorCampanha, eventos] = await Promise.all([
      Promise.all(campanhas.map(async (campanha) => [campanha.id, await this.campanhas!.listarItens(campanha.id, negocioId)] as const)),
      this.tracking?.listarEventos(negocioId, { limite: 20_000 }) ?? Promise.resolve([])
    ]);
    const mapaItens = new Map(itensPorCampanha);
    const clientesPorId = new Map(clientes.map((cliente) => [cliente.id, cliente]));
    const pedidosPagosPorId = new Map(
      pedidos
        .filter((pedido) => pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO" || pedido.estado === "ENTREGUE")
        .map((pedido) => [pedido.id, pedido])
    );
    const eventosPorCampanha = this.agruparEventosPorCampanha(eventos);
    const segmentosConvertidos = new Map<string, { segmento: string; conversoes: number; receitaEmKwanza: number }>();

    const itens = campanhas.map((campanha) => {
      const itensCampanha = mapaItens.get(campanha.id) ?? [];
      const conversoes = this.calcularConversoesCampanha(
        campanha,
        itensCampanha,
        eventosPorCampanha.get(campanha.id) ?? [],
        pedidosPagosPorId,
        clientesPorId,
        segmentosConvertidos
      );

      return {
        campanhaId: campanha.id,
        nome: campanha.nome,
        estado: campanha.estado,
        canal: campanha.canal,
        segmento: campanha.segmento,
        respostas: itensCampanha.filter((item) => item.status === "RESPONDIDO").length,
        optOut: itensCampanha.filter((item) => this.itemCampanhaOptOut(item)).length,
        falhas: itensCampanha.filter((item) => item.status === "FALHOU").length,
        pedidosGerados: conversoes.pedidosGerados,
        receitaGeradaEmKwanza: conversoes.receitaGeradaEmKwanza
      };
    }).sort((a, b) => {
      if (b.receitaGeradaEmKwanza !== a.receitaGeradaEmKwanza) return b.receitaGeradaEmKwanza - a.receitaGeradaEmKwanza;
      return b.pedidosGerados - a.pedidosGerados;
    });

    const totalizar = (campo: "respostas" | "optOut" | "falhas" | "pedidosGerados" | "receitaGeradaEmKwanza") =>
      itens.reduce((total, item) => total + item[campo], 0);

    return {
      total: campanhas.length,
      respostas: totalizar("respostas"),
      optOut: totalizar("optOut"),
      falhas: totalizar("falhas"),
      pedidosGerados: totalizar("pedidosGerados"),
      receitaGeradaEmKwanza: totalizar("receitaGeradaEmKwanza"),
      segmentosConvertidos: [...segmentosConvertidos.values()].sort((a, b) => {
        if (b.receitaEmKwanza !== a.receitaEmKwanza) return b.receitaEmKwanza - a.receitaEmKwanza;
        return b.conversoes - a.conversoes;
      }),
      itens
    };
  }

  private calcularConversoesCampanha(
    campanha: CampanhaCrm,
    itens: ItemCampanhaCrm[],
    eventos: EventoTrackingComercial[],
    pedidosPagosPorId: Map<string, Pedido>,
    clientesPorId: Map<string, Cliente360>,
    segmentosConvertidos: Map<string, { segmento: string; conversoes: number; receitaEmKwanza: number }>
  ) {
    const conversoes = new Map<string, { pedidoId: string | null; clienteId: string | null; receitaEmKwanza: number }>();
    const adicionarConversao = (chave: string, dados: { pedidoId?: string | null; clienteId?: string | null; receitaEmKwanza?: number | null }) => {
      const existente = conversoes.get(chave);
      if (existente) {
        existente.receitaEmKwanza = Math.max(existente.receitaEmKwanza, dados.receitaEmKwanza ?? 0);
        existente.clienteId = existente.clienteId ?? dados.clienteId ?? null;
        existente.pedidoId = existente.pedidoId ?? dados.pedidoId ?? null;
        return;
      }
      conversoes.set(chave, {
        pedidoId: dados.pedidoId ?? null,
        clienteId: dados.clienteId ?? null,
        receitaEmKwanza: dados.receitaEmKwanza ?? 0
      });
    };

    for (const item of itens.filter((registro) => registro.status === "CONVERTIDO")) {
      const pedidoId = this.valorTexto(item.contexto.pedidoId);
      const pedidoPago = pedidoId ? pedidosPagosPorId.get(pedidoId) : null;
      adicionarConversao(pedidoId ? `pedido:${pedidoId}` : `item:${item.id}`, {
        pedidoId,
        clienteId: item.clienteId,
        receitaEmKwanza: pedidoPago?.totalEmKwanza ?? this.valorNumero(item.contexto.receitaEmKwanza) ?? this.valorNumero(item.contexto.totalEmKwanza)
      });
    }

    for (const evento of eventos.filter((registro) => registro.tipo === "PEDIDO_CRIADO" || registro.tipo === "PAGAMENTO_CONFIRMADO")) {
      const pedidoId = this.valorTexto(evento.metadata.pedidoId) ?? evento.entidadeId;
      const pedidoPago = pedidoId ? pedidosPagosPorId.get(pedidoId) : null;
      adicionarConversao(pedidoId ? `pedido:${pedidoId}` : `evento:${evento.id}`, {
        pedidoId,
        clienteId: pedidoPago?.clienteNegocioId ?? this.valorTexto(evento.metadata.clienteId),
        receitaEmKwanza: pedidoPago?.totalEmKwanza ?? this.valorNumero(evento.metadata.totalEmKwanza)
      });
    }

    let receitaGeradaEmKwanza = 0;
    for (const conversao of conversoes.values()) {
      receitaGeradaEmKwanza += conversao.receitaEmKwanza;
      const cliente = conversao.clienteId ? clientesPorId.get(conversao.clienteId) : null;
      for (const segmento of this.segmentosDaConversao(campanha, cliente)) {
        const atual = segmentosConvertidos.get(segmento) ?? { segmento, conversoes: 0, receitaEmKwanza: 0 };
        atual.conversoes += 1;
        atual.receitaEmKwanza += conversao.receitaEmKwanza;
        segmentosConvertidos.set(segmento, atual);
      }
    }

    return {
      pedidosGerados: conversoes.size,
      receitaGeradaEmKwanza
    };
  }

  private agruparEventosPorCampanha(eventos: EventoTrackingComercial[]) {
    const mapa = new Map<string, EventoTrackingComercial[]>();
    for (const evento of eventos) {
      const campanhaId = this.valorTexto(evento.metadata.campanhaId) ?? this.valorTexto(evento.metadata.campaignId) ?? evento.utm.campaign;
      if (!campanhaId) continue;
      mapa.set(campanhaId, [...(mapa.get(campanhaId) ?? []), evento]);
    }
    return mapa;
  }

  private itemCampanhaOptOut(item: ItemCampanhaCrm) {
    if (item.status !== "BLOQUEADO") return false;
    const motivo = (item.motivoBloqueio ?? "").toLocaleLowerCase("pt-AO");
    return ["consentimento", "opt-out", "opt out", "optout", "marketing"].some((termo) => motivo.includes(termo));
  }

  private segmentosDaConversao(campanha: CampanhaCrm, cliente: Cliente360 | null | undefined) {
    const segmentos = new Set<string>();
    for (const tag of cliente?.tags ?? []) segmentos.add(`tag:${tag}`);
    if (cliente?.origem) segmentos.add(`origem:${cliente.origem}`);
    if (cliente?.estadoRelacionamento) segmentos.add(`estado:${cliente.estadoRelacionamento}`);

    const tagsCampanha = campanha.segmento.tags;
    if (Array.isArray(tagsCampanha)) {
      for (const tag of tagsCampanha) {
        if (typeof tag === "string" && tag.trim()) segmentos.add(`tag:${tag.trim()}`);
      }
    }
    const origemCampanha = this.valorTexto(campanha.segmento.origem);
    if (origemCampanha) segmentos.add(`origem:${origemCampanha}`);
    const estadoCampanha = this.valorTexto(campanha.segmento.estadoRelacionamento);
    if (estadoCampanha) segmentos.add(`estado:${estadoCampanha}`);

    return [...segmentos];
  }

  private async calcularOportunidadesPerdidas(
    negocioId: string,
    pedidos: Pedido[],
    reservas: Reserva[],
    conversas: ConversaAtendimentoComMensagens[]
  ) {
    const pedidosPagos = pedidos.filter((pedido) => pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO" || pedido.estado === "ENTREGUE");
    const clientesComCompra = new Set(pedidosPagos.map((pedido) => pedido.clienteNegocioId));
    const clientesQuePerguntaram = new Set<string>();

    for (const conversa of conversas) {
      const temPerguntaCliente = conversa.mensagens.some((mensagem) => mensagem.direcao === "INBOUND" || mensagem.remetente === "cliente");
      if (!temPerguntaCliente) continue;
      const chaveCliente = conversa.conversa.clienteNegocioId ?? conversa.cliente.id ?? conversa.conversa.telefone;
      if (conversa.conversa.clienteNegocioId && clientesComCompra.has(conversa.conversa.clienteNegocioId)) continue;
      clientesQuePerguntaram.add(chaveCliente);
    }

    const eventos = await (this.tracking?.listarEventos(negocioId, { limite: 20_000 }) ?? Promise.resolve([]));
    const trackingComPedido = new Set(
      eventos
        .filter((evento) => evento.trackingId && (evento.tipo === "PEDIDO_CRIADO" || evento.tipo === "PAGAMENTO_CONFIRMADO"))
        .map((evento) => evento.trackingId!)
    );
    const whatsappClicksSemCompra = new Set(
      eventos
        .filter((evento) => evento.tipo === "WHATSAPP_CLICK")
        .filter((evento) => !evento.trackingId || !trackingComPedido.has(evento.trackingId))
        .map((evento) => evento.trackingId ?? evento.id)
    );

    const social = await (this.socialInbox?.listar(negocioId, { limite: 20_000 }) ?? Promise.resolve([]));

    return {
      pedidosAguardandoPagamento: pedidos.filter((pedido) => pedido.estadoPagamento === "PENDENTE" || pedido.estado === "AGUARDANDO_PAGAMENTO").length,
      reservasExpiradas: reservas.filter((reserva) => reserva.estado === "EXPIRED").length,
      conversasSemResposta: conversas.filter((item) => item.conversa.estado === "NOVA" || item.conversa.estado === "AGUARDANDO_HUMANO").length,
      clientesQuePerguntaramENaoCompraram: clientesQuePerguntaram.size,
      comprovativosNaoEnviados: pedidos.filter((pedido) => pedido.estadoPagamento === "PENDENTE" && !pedido.comprovativoPagamentoUrl).length,
      socialLeadsSemAtendimento: social.filter((item) => item.intencao === "COMPRA" && ["NOVO", "EM_ATENDIMENTO"].includes(item.estado)).length,
      whatsappClicksSemCompra: whatsappClicksSemCompra.size
    };
  }

  private filtrarPecasPorColecao(pecas: Peca[], filtros: FiltrosRelatorioComercial) {
    const colecao = this.normalizarTextoFiltro(filtros.colecao);
    if (!colecao) return pecas;
    return pecas.filter((peca) => this.normalizarTextoFiltro(peca.colecao) === colecao);
  }

  private obterCodigosDaColecao(pecas: Peca[], filtros: FiltrosRelatorioComercial) {
    if (!this.normalizarTextoFiltro(filtros.colecao)) return null;
    return new Set(pecas.map((peca) => peca.codigo));
  }

  private filtrarPedidosPorColecao(pedidos: Pedido[], codigosDaColecao: Set<string> | null, filtros: FiltrosRelatorioComercial) {
    if (!this.normalizarTextoFiltro(filtros.colecao)) return pedidos;
    if (!codigosDaColecao?.size) return [];
    return pedidos.filter((pedido) => pedido.itens.some((item) => codigosDaColecao.has(item.codigoPeca)));
  }

  private filtrarReservasPorColecao(reservas: Reserva[], codigosDaColecao: Set<string> | null, filtros: FiltrosRelatorioComercial) {
    if (!this.normalizarTextoFiltro(filtros.colecao)) return reservas;
    if (!codigosDaColecao?.size) return [];
    return reservas.filter((reserva) => codigosDaColecao.has(reserva.codigoPeca));
  }

  private dentroDoPeriodo(data: Date, filtros: FiltrosRelatorioComercial) {
    if (filtros.dataInicio && data < filtros.dataInicio) return false;
    if (filtros.dataFim && data > filtros.dataFim) return false;
    return true;
  }

  private normalizarTextoFiltro(valor?: string | null) {
    return valor?.trim().toLocaleLowerCase("pt-AO") || null;
  }

  private renderizarHtmlRelatorioComercial(relatorio: Awaited<ReturnType<RelatoriosComerciaisUseCase["gerarRelatorio"]>>) {
    const filtrosAtivos = Object.entries(relatorio.filtros)
      .filter(([, valor]) => valor !== undefined && valor !== null && valor !== "")
      .map(([chave, valor]) => `${chave}: ${valor instanceof Date ? formatDateLabel(valor) : String(valor)}`)
      .join(" · ");

    return `<!doctype html>
<html lang="pt-AO">
  <head>
    <meta charset="utf-8" />
    <title>Relatório comercial Bizy</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; color: #162019; background: #f4f6f1; font-family: Arial, sans-serif; }
      .page { min-height: 100vh; padding: 30px; background: #ffffff; }
      .topbar { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #172016; padding-bottom: 18px; margin-bottom: 20px; }
      .brand { font-size: 28px; font-weight: 800; color: #214119; }
      .subtitle { margin-top: 6px; color: #5c6758; font-size: 12px; text-transform: uppercase; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      h2 { margin: 24px 0 10px; font-size: 15px; text-transform: uppercase; color: #214119; }
      .muted { color: #5c6758; font-size: 12px; line-height: 1.5; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
      .metric { border: 1px solid #d7dfd0; padding: 12px; min-height: 72px; background: #fbfcfa; }
      .label { display: block; color: #5c6758; font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
      .value { font-size: 17px; font-weight: 800; color: #172016; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      th, td { border-bottom: 1px solid #d7dfd0; padding: 8px 6px; text-align: left; vertical-align: top; }
      th { color: #5c6758; text-transform: uppercase; font-size: 10px; }
      .footer { margin-top: 24px; border-top: 1px solid #d7dfd0; padding-top: 12px; }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="topbar">
        <div>
          <div class="brand">Bizy</div>
          <div class="subtitle">Relatório comercial operacional</div>
        </div>
        <div class="muted">
          Gerado em ${escapeHtml(formatDateLabel(new Date(relatorio.geradoEm)))}<br />
          ${escapeHtml(filtrosAtivos || "Sem filtros aplicados")}
        </div>
      </section>

      <h1>Resumo de vendas, cobrança e operação</h1>
      <p class="muted">Indicadores práticos para acompanhar dinheiro em caixa, pedidos parados, retenção e produtos que merecem ação.</p>

      <section class="grid">
        ${this.cardPdf("Pedidos pagos", String(relatorio.metricas.pedidosPagos))}
        ${this.cardPdf("Pagamentos pendentes", String(relatorio.metricas.pagamentosPendentes))}
        ${this.cardPdf("Receita líquida estimada", this.formatarKwanza(relatorio.metricas.receitaLiquidaEstimadaEmKwanza))}
        ${this.cardPdf("Ticket médio", this.formatarKwanza(relatorio.metricas.ticketMedioEmKwanza))}
        ${this.cardPdf("Clientes novos", String(relatorio.metricas.clientesNovos))}
        ${this.cardPdf("Clientes recorrentes", String(relatorio.metricas.clientesRecorrentes))}
        ${this.cardPdf("Conversas abertas", String(relatorio.atendimento.conversasAbertas))}
        ${this.cardPdf("Tempo médio de resposta", `${relatorio.atendimento.tempoMedioPrimeiraRespostaMinutos} min`)}
        ${this.cardPdf("Taxa de resolução", `${relatorio.atendimento.taxaResolucaoPercentual}%`)}
        ${this.cardPdf("Mensagens falhadas", String(relatorio.atendimento.mensagensFalhadas))}
        ${this.cardPdf("Receita de campanhas", this.formatarKwanza(relatorio.campanhas.receitaGeradaEmKwanza))}
        ${this.cardPdf("Respostas campanhas", String(relatorio.campanhas.respostas))}
        ${this.cardPdf("Falhas campanhas", String(relatorio.campanhas.falhas))}
      </section>

      <h2>Produtos mais vendidos</h2>
      ${this.tabelaProdutosVendidosPdf(relatorio.rankings.produtosMaisVendidos)}

      <h2>Oportunidades perdidas</h2>
      <section class="grid">
        ${this.cardPdf("Pedidos aguardando pagamento", String(relatorio.oportunidadesPerdidas.pedidosAguardandoPagamento))}
        ${this.cardPdf("Reservas expiradas", String(relatorio.oportunidadesPerdidas.reservasExpiradas))}
        ${this.cardPdf("Conversas sem resposta", String(relatorio.oportunidadesPerdidas.conversasSemResposta))}
        ${this.cardPdf("Perguntaram e não compraram", String(relatorio.oportunidadesPerdidas.clientesQuePerguntaramENaoCompraram))}
        ${this.cardPdf("Comprovativos não enviados", String(relatorio.oportunidadesPerdidas.comprovativosNaoEnviados))}
        ${this.cardPdf("Cliques WhatsApp sem compra", String(relatorio.oportunidadesPerdidas.whatsappClicksSemCompra))}
        ${this.cardPdf("Clientes em risco", String(relatorio.retencao.clientesEmRisco))}
      </section>

      <p class="footer muted">Use este PDF para alinhamento diário da equipa: cobrar pendências, preparar entregas, repor produtos e recuperar oportunidades.</p>
    </main>
  </body>
</html>`;
  }

  private cardPdf(label: string, valor: string) {
    return `<div class="metric"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(valor)}</span></div>`;
  }

  private tabelaProdutosVendidosPdf(
    produtos: Array<{ codigoPeca: string; nomeProduto: string; quantidadeVendida: number; receitaEmKwanza: number }>
  ) {
    if (!produtos.length) return `<p class="muted">Ainda não há produtos vendidos no período.</p>`;

    const linhas = produtos
      .slice(0, 8)
      .map(
        (produto) => `<tr>
          <td>${escapeHtml(produto.codigoPeca)}</td>
          <td>${escapeHtml(produto.nomeProduto)}</td>
          <td>${produto.quantidadeVendida}</td>
          <td>${escapeHtml(this.formatarKwanza(produto.receitaEmKwanza))}</td>
        </tr>`
      )
      .join("");

    return `<table>
      <thead><tr><th>Código</th><th>Produto</th><th>Qtd.</th><th>Receita</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
  }

  private formatarKwanza(valor: number) {
    return `${new Intl.NumberFormat("pt-AO").format(valor)} Kz`;
  }

  private csv(valor: string): string {
    if (!/[",\n]/.test(valor)) return valor;
    return `"${valor.replace(/"/g, "\"\"")}"`;
  }

  private obterLinhaSocial(
    mapa: Map<string, {
      chave: string;
      origem: string | null;
      canal: string | null;
      postId: string | null;
      codigoProduto: string | null;
      comentarios: number;
      leads: number;
      pedidos: number;
      receitaEmKwanza: number;
      eventos: number;
    }>,
    chave: string,
    dados: { origem?: string | null; canal?: string | null; postId?: string | null; codigoProduto?: string | null }
  ) {
    const atual = mapa.get(chave) ?? {
      chave,
      origem: dados.origem ?? null,
      canal: dados.canal ?? null,
      postId: dados.postId ?? null,
      codigoProduto: dados.codigoProduto ?? null,
      comentarios: 0,
      leads: 0,
      pedidos: 0,
      receitaEmKwanza: 0,
      eventos: 0
    };
    atual.origem = atual.origem ?? dados.origem ?? null;
    atual.canal = atual.canal ?? dados.canal ?? null;
    atual.postId = atual.postId ?? dados.postId ?? null;
    atual.codigoProduto = atual.codigoProduto ?? dados.codigoProduto ?? null;
    mapa.set(chave, atual);
    return atual;
  }

  private chaveEventoSocial(evento: EventoTrackingComercial): string {
    return (
      this.valorTexto(evento.metadata.postId) ??
      this.valorTexto(evento.metadata.origemConteudo) ??
      evento.codigoProduto ??
      evento.origem ??
      evento.canal ??
      "sem_origem"
    );
  }

  private extrairProdutoContexto(entidades: Record<string, unknown>): string | null {
    return this.valorTexto(entidades.codigoProduto) ?? this.valorTexto(entidades.produtoCodigo) ?? this.valorTexto(entidades.codigoPeca);
  }

  private valorTexto(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }

  private valorNumero(valor: unknown): number | null {
    return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
  }
}
