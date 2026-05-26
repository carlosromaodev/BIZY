import type {
  RepositorioAtendimento,
  RepositorioClientes,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioReservas,
  RepositorioSocialInbox,
  RepositorioTarefasOperacionais,
  RepositorioTrackingComercial
} from "../dominio/repositorios/contratos.js";
import type { EventoTrackingComercial, FiltrosPedidos, Pedido, Peca } from "../dominio/tipos.js";

export interface FiltrosRelatorioComercial {
  dataInicio?: Date;
  dataFim?: Date;
  canal?: string;
  produto?: string;
  estado?: Pedido["estado"];
  responsavelId?: string;
}

export class RelatoriosComerciaisUseCase {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly clientes: RepositorioClientes,
    private readonly pecas: RepositorioPecas,
    private readonly reservas: RepositorioReservas,
    private readonly atendimento: RepositorioAtendimento,
    private readonly tarefas: RepositorioTarefasOperacionais,
    private readonly tracking?: RepositorioTrackingComercial,
    private readonly socialInbox?: RepositorioSocialInbox
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
    const pecasPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca]));
    const pedidosPagos = pedidos.filter((pedido) => pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO" || pedido.estado === "ENTREGUE");
    const pagamentosPendentes = pedidos.filter((pedido) => pedido.estadoPagamento === "PENDENTE" || pedido.estado === "AGUARDANDO_PAGAMENTO");
    const receitaBrutaEmKwanza = pedidos.reduce((total, pedido) => total + pedido.subtotalEmKwanza, 0);
    const descontosEmKwanza = pedidos.reduce((total, pedido) => total + pedido.descontoEmKwanza, 0);
    const entregaEmKwanza = pedidos.reduce((total, pedido) => total + pedido.taxaEntregaEmKwanza, 0);
    const receitaLiquidaEstimadaEmKwanza = receitaBrutaEmKwanza - descontosEmKwanza + entregaEmKwanza;
    const clientesComPedidosPagos = this.contarPedidosPagosPorCliente(pedidosPagos);
    const reservasComIntencao = reservas.filter((reserva) => !filtros.dataInicio || reserva.criadaEm >= filtros.dataInicio);
    const reservasPagas = reservasComIntencao.filter((reserva) => reserva.estado === "PAID");

    return {
      geradoEm: new Date().toISOString(),
      filtros,
      metricas: {
        pedidosCriados: pedidos.length,
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
        produtosEncalhados: this.listarProdutosEncalhados(pecas, pedidosPagos),
        produtosMaiorMargem: this.ranquearProdutosPorMargem(pecas),
        produtosReservaPerdida: this.ranquearReservasPerdidas(reservas, pecasPorCodigo)
      },
      atendimento: {
        conversasAbertas: conversas.filter((item) => !["RESOLVIDA", "ENCERRADA"].includes(item.conversa.estado)).length,
        mensagensFalhadas: conversas.flatMap((item) => item.mensagens).filter((mensagem) => mensagem.status === "FAILED").length,
        tarefasAbertas: tarefas.filter((tarefa) => !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)).length,
        tarefasAtrasadas: tarefas.filter((tarefa) => tarefa.prazoEm && tarefa.prazoEm < new Date() && !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)).length
      },
      oportunidadesPerdidas: {
        pedidosAguardandoPagamento: pagamentosPendentes.length,
        reservasExpiradas: reservas.filter((reserva) => reserva.estado === "EXPIRED").length,
        conversasSemResposta: conversas.filter((item) => item.conversa.estado === "NOVA" || item.conversa.estado === "AGUARDANDO_HUMANO").length
      },
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
        "ticketMedioEmKwanza"
      ],
      [
        String(relatorio.metricas.pedidosPagos),
        String(relatorio.metricas.pagamentosPendentes),
        String(relatorio.metricas.receitaBrutaEmKwanza),
        String(relatorio.metricas.descontosEmKwanza),
        String(relatorio.metricas.entregaEmKwanza),
        String(relatorio.metricas.receitaLiquidaEstimadaEmKwanza),
        String(relatorio.metricas.ticketMedioEmKwanza)
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
    return [...mapa.values()].sort((a, b) => b.reservasPerdidas - a.reservasPerdidas).slice(0, 20);
  }

  private contarPedidosPagosPorCliente(pedidos: Pedido[]) {
    const mapa = new Map<string, number>();
    for (const pedido of pedidos) {
      mapa.set(pedido.clienteNegocioId, (mapa.get(pedido.clienteNegocioId) ?? 0) + 1);
    }
    return mapa;
  }

  private dentroDoPeriodo(data: Date, filtros: FiltrosRelatorioComercial) {
    if (filtros.dataInicio && data < filtros.dataInicio) return false;
    if (filtros.dataFim && data > filtros.dataFim) return false;
    return true;
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
