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
import type { EventoTrackingComercial, FiltrosPedidos, Pedido, Peca, Reserva } from "../dominio/tipos.js";
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
      atendimento: {
        conversasAbertas: conversas.filter((item) => !["RESOLVIDA", "ENCERRADA"].includes(item.conversa.estado)).length,
        mensagensFalhadas: conversas.flatMap((item) => item.mensagens).filter((mensagem) => mensagem.status === "FAILED").length,
        tarefasAbertas: tarefas.filter((tarefa) => !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)).length,
        tarefasAtrasadas: tarefas.filter((tarefa) => tarefa.prazoEm && tarefa.prazoEm < new Date() && !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)).length
      },
      oportunidadesPerdidas: {
        pedidosAguardandoPagamento: pagamentosPendentes.length,
        reservasExpiradas: reservasDoRelatorio.filter((reserva) => reserva.estado === "EXPIRED").length,
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
        ${this.cardPdf("Tarefas atrasadas", String(relatorio.atendimento.tarefasAtrasadas))}
      </section>

      <h2>Produtos mais vendidos</h2>
      ${this.tabelaProdutosVendidosPdf(relatorio.rankings.produtosMaisVendidos)}

      <h2>Oportunidades perdidas</h2>
      <section class="grid">
        ${this.cardPdf("Pedidos aguardando pagamento", String(relatorio.oportunidadesPerdidas.pedidosAguardandoPagamento))}
        ${this.cardPdf("Reservas expiradas", String(relatorio.oportunidadesPerdidas.reservasExpiradas))}
        ${this.cardPdf("Conversas sem resposta", String(relatorio.oportunidadesPerdidas.conversasSemResposta))}
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
