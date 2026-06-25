import type { PrismaClient } from "@prisma/client";
import { buildFacturaHtml, type DadosFacturaPdf } from "../infra/pdf/FacturaPdfTemplate.js";
import { buildReciboHtml, type DadosReciboPdf } from "../infra/pdf/ReciboPdfTemplate.js";
import { renderPdfFromHtml } from "../infra/pdf/PdfRenderer.js";

const CATEGORIAS_PADRAO = [
  { nome: "Vendas", tipo: "RECEITA" },
  { nome: "Comissões recebidas", tipo: "RECEITA" },
  { nome: "Outros recebimentos", tipo: "RECEITA" },
  { nome: "Fornecedores", tipo: "DESPESA" },
  { nome: "Salários", tipo: "DESPESA" },
  { nome: "Aluguer", tipo: "DESPESA" },
  { nome: "Marketing", tipo: "DESPESA" },
  { nome: "Logística/Entregas", tipo: "DESPESA" },
  { nome: "Taxas e impostos", tipo: "DESPESA" },
  { nome: "Outros custos", tipo: "DESPESA" }
];

export class GestaoFinancasUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Categorias ────────────────────────────────────────────────────────────

  async listarCategorias(negocioId: string) {
    return this.prisma.categoriaFinanceira.findMany({
      where: { negocioId, ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }]
    });
  }

  async criarCategoria(
    negocioId: string,
    dados: { nome: string; tipo: string; icone?: string; cor?: string }
  ) {
    return this.prisma.categoriaFinanceira.create({
      data: { negocioId, nome: dados.nome, tipo: dados.tipo, icone: dados.icone, cor: dados.cor }
    });
  }

  async inicializarCategoriasPadrao(negocioId: string) {
    const existentes = await this.prisma.categoriaFinanceira.count({ where: { negocioId } });
    if (existentes > 0) return { criadas: 0 };

    await this.prisma.categoriaFinanceira.createMany({
      data: CATEGORIAS_PADRAO.map((c) => ({ negocioId, ...c }))
    });
    return { criadas: CATEGORIAS_PADRAO.length };
  }

  // ── Movimentos (Ledger) ───────────────────────────────────────────────────

  async registarMovimento(
    negocioId: string,
    dados: {
      tipo: string;
      categoriaId?: string;
      descricao: string;
      valor: number;
      origemTipo?: string;
      origemId?: string;
      responsavelId?: string;
      dataMovimento?: Date;
      observacao?: string;
    }
  ) {
    // RN-T001: todo movimento financeiro deve ter origem classificada
    if (!dados.origemTipo) {
      throw new Error(
        "RN-T001: Todo movimento financeiro deve ter origem classificada (origemTipo). Entradas: PEDIDO, RECEBIMENTO_MANUAL, COMISSAO. Saídas: FORNECEDOR, DESPESA, IMPOSTO, COMISSAO_PAGA."
      );
    }

    const origensEntrada = ["PEDIDO", "RECEBIMENTO_MANUAL", "COMISSAO", "FACTURA", "CONTA_RECEBER", "RECIBO"];
    const origensSaida = ["FORNECEDOR", "DESPESA", "IMPOSTO", "COMISSAO_PAGA", "NOTA_CREDITO", "CONTA_PAGAR", "REEMBOLSO"];

    if (dados.tipo === "ENTRADA" && !origensEntrada.includes(dados.origemTipo)) {
      throw new Error(
        "RN-T001: Todo movimento financeiro deve ter origem classificada (origemTipo). Entradas: PEDIDO, RECEBIMENTO_MANUAL, COMISSAO. Saídas: FORNECEDOR, DESPESA, IMPOSTO, COMISSAO_PAGA."
      );
    }
    if (dados.tipo === "SAIDA" && !origensSaida.includes(dados.origemTipo)) {
      throw new Error(
        "RN-T001: Todo movimento financeiro deve ter origem classificada (origemTipo). Entradas: PEDIDO, RECEBIMENTO_MANUAL, COMISSAO. Saídas: FORNECEDOR, DESPESA, IMPOSTO, COMISSAO_PAGA."
      );
    }

    return this.prisma.movimentoFinanceiro.create({
      data: {
        negocioId,
        tipo: dados.tipo,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        origemTipo: dados.origemTipo,
        origemId: dados.origemId,
        responsavelId: dados.responsavelId,
        dataMovimento: dados.dataMovimento ?? new Date(),
        observacao: dados.observacao
      }
    });
  }

  async listarMovimentos(
    negocioId: string,
    filtros?: { tipo?: string; categoriaId?: string; de?: Date; ate?: Date; limite?: number }
  ) {
    return this.prisma.movimentoFinanceiro.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
        ...(filtros?.de || filtros?.ate ? {
          dataMovimento: {
            ...(filtros?.de ? { gte: filtros.de } : {}),
            ...(filtros?.ate ? { lte: filtros.ate } : {})
          }
        } : {})
      },
      include: { categoria: { select: { id: true, nome: true, tipo: true, cor: true } } },
      orderBy: { dataMovimento: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  // ── Fluxo de Caixa e DRE ─────────────────────────────────────────────────

  async obterFluxoCaixa(negocioId: string, de: Date, ate: Date) {
    const movimentos = await this.prisma.movimentoFinanceiro.findMany({
      where: { negocioId, dataMovimento: { gte: de, lte: ate } },
      include: { categoria: { select: { nome: true, tipo: true } } },
      orderBy: { dataMovimento: "asc" }
    });

    let saldo = 0;
    const entradas = movimentos.filter((m) => m.tipo === "ENTRADA");
    const saidas = movimentos.filter((m) => m.tipo === "SAIDA");
    const totalEntradas = entradas.reduce((s, m) => s + m.valor, 0);
    const totalSaidas = saidas.reduce((s, m) => s + m.valor, 0);
    saldo = totalEntradas - totalSaidas;

    // agrupar por dia
    const porDia: Record<string, { entradas: number; saidas: number }> = {};
    for (const m of movimentos) {
      const dia = m.dataMovimento.toISOString().slice(0, 10);
      if (!porDia[dia]) porDia[dia] = { entradas: 0, saidas: 0 };
      if (m.tipo === "ENTRADA") porDia[dia].entradas += m.valor;
      else porDia[dia].saidas += m.valor;
    }

    // agrupar por categoria
    const porCategoria: Record<string, { tipo: string; total: number }> = {};
    for (const m of movimentos) {
      const cat = m.categoria?.nome ?? "Sem categoria";
      if (!porCategoria[cat]) porCategoria[cat] = { tipo: m.tipo, total: 0 };
      porCategoria[cat].total += m.valor;
    }

    return {
      saldo,
      totalEntradas,
      totalSaidas,
      periodo: { de, ate },
      porDia: Object.entries(porDia).map(([dia, v]) => ({ dia, ...v })),
      porCategoria: Object.entries(porCategoria).map(([categoria, v]) => ({ categoria, ...v }))
    };
  }

  async obterDRE(negocioId: string, mes: number, ano: number) {
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    const movimentos = await this.prisma.movimentoFinanceiro.findMany({
      where: { negocioId, dataMovimento: { gte: de, lte: ate } },
      include: { categoria: { select: { nome: true, tipo: true } } }
    });

    const receitaBruta = movimentos
      .filter((m) => m.tipo === "ENTRADA")
      .reduce((s, m) => s + m.valor, 0);

    const custosVariaveis = movimentos
      .filter((m) => m.tipo === "SAIDA" && ["Fornecedores", "Logística/Entregas", "Comissões pagas"].includes(m.categoria?.nome ?? ""))
      .reduce((s, m) => s + m.valor, 0);

    const custosFixos = movimentos
      .filter((m) => m.tipo === "SAIDA" && ["Salários", "Aluguer", "Taxas e impostos"].includes(m.categoria?.nome ?? ""))
      .reduce((s, m) => s + m.valor, 0);

    const outrosCustos = movimentos
      .filter((m) => m.tipo === "SAIDA")
      .reduce((s, m) => s + m.valor, 0) - custosVariaveis - custosFixos;

    const margemContribuicao = receitaBruta - custosVariaveis;
    const resultadoOperacional = margemContribuicao - custosFixos - outrosCustos;

    return {
      periodo: { mes, ano },
      receitaBruta,
      custosVariaveis,
      margemContribuicao,
      custosFixos,
      outrosCustos,
      resultadoOperacional
    };
  }

  // ── Despesas ──────────────────────────────────────────────────────────────

  async criarDespesa(
    negocioId: string,
    dados: {
      categoriaId?: string;
      descricao: string;
      valor: number;
      tipoRecorrencia?: string;
      fornecedor?: string;
      comprovativoUrl?: string;
      dataVencimento?: Date;
      observacao?: string;
    }
  ) {
    const despesa = await this.prisma.despesa.create({
      data: {
        negocioId,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        tipoRecorrencia: dados.tipoRecorrencia ?? "UNICA",
        fornecedor: dados.fornecedor,
        comprovativoUrl: dados.comprovativoUrl,
        dataVencimento: dados.dataVencimento,
        observacao: dados.observacao
      }
    });

    // registar movimento de saída
    await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      categoriaId: dados.categoriaId,
      descricao: dados.descricao,
      valor: dados.valor,
      origemTipo: "DESPESA",
      origemId: despesa.id
    });

    return despesa;
  }

  async listarDespesas(
    negocioId: string,
    filtros?: { pago?: boolean; categoriaId?: string; limite?: number }
  ) {
    return this.prisma.despesa.findMany({
      where: {
        negocioId,
        ...(filtros?.pago !== undefined ? { pago: filtros.pago } : {}),
        ...(filtros?.categoriaId ? { categoriaId: filtros.categoriaId } : {})
      },
      include: { categoria: { select: { id: true, nome: true, cor: true } } },
      orderBy: { dataVencimento: "asc" },
      take: filtros?.limite ?? 100
    });
  }

  async marcarDespesaPaga(id: string, negocioId: string) {
    return this.prisma.despesa.update({
      where: { id, negocioId },
      data: { pago: true, pagoEm: new Date() }
    });
  }

  // ── Contas a Receber ──────────────────────────────────────────────────────

  async criarContaReceber(
    negocioId: string,
    dados: {
      clienteId?: string;
      pedidoId?: string;
      descricao: string;
      valor: number;
      dataVencimento: Date;
      observacao?: string;
    }
  ) {
    return this.prisma.contaReceber.create({
      data: {
        negocioId,
        clienteId: dados.clienteId,
        pedidoId: dados.pedidoId,
        descricao: dados.descricao,
        valor: dados.valor,
        dataVencimento: dados.dataVencimento,
        observacao: dados.observacao
      }
    });
  }

  async listarContasReceber(
    negocioId: string,
    filtros?: { estado?: string; limite?: number }
  ) {
    return this.prisma.contaReceber.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {})
      },
      orderBy: { dataVencimento: "asc" },
      take: filtros?.limite ?? 100
    });
  }

  async obterAgingReceber(negocioId: string) {
    const agora = new Date();
    const contas = await this.prisma.contaReceber.findMany({
      where: { negocioId, estado: { not: "PAGO" } }
    });

    const aging = { aVencer: 0, vencido1a30: 0, vencido31a60: 0, vencido61a90: 0, vencidoMais90: 0 };
    for (const c of contas) {
      const dias = Math.floor((agora.getTime() - c.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
      if (dias < 0) aging.aVencer += c.valor;
      else if (dias <= 30) aging.vencido1a30 += c.valor;
      else if (dias <= 60) aging.vencido31a60 += c.valor;
      else if (dias <= 90) aging.vencido61a90 += c.valor;
      else aging.vencidoMais90 += c.valor;
    }

    return aging;
  }

  async receberPagamento(id: string, negocioId: string, valorPago: number) {
    const conta = await this.prisma.contaReceber.update({
      where: { id, negocioId },
      data: { estado: "PAGO", pagoEm: new Date(), valorPago }
    });

    await this.registarMovimento(negocioId, {
      tipo: "ENTRADA",
      descricao: `Recebimento: ${conta.descricao}`,
      valor: valorPago,
      origemTipo: "CONTA_RECEBER",
      origemId: id
    });

    return conta;
  }

  // ── Contas a Pagar ────────────────────────────────────────────────────────

  async criarContaPagar(
    negocioId: string,
    dados: {
      fornecedor: string;
      descricao: string;
      valor: number;
      dataVencimento: Date;
      observacao?: string;
    }
  ) {
    return this.prisma.contaPagar.create({
      data: { negocioId, ...dados }
    });
  }

  async listarContasPagar(
    negocioId: string,
    filtros?: { estado?: string; limite?: number }
  ) {
    return this.prisma.contaPagar.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {})
      },
      orderBy: { dataVencimento: "asc" },
      take: filtros?.limite ?? 100
    });
  }

  async pagarConta(id: string, negocioId: string) {
    const conta = await this.prisma.contaPagar.update({
      where: { id, negocioId },
      data: { estado: "PAGO", pagoEm: new Date() }
    });

    await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      descricao: `Pagamento: ${conta.descricao} — ${conta.fornecedor}`,
      valor: conta.valor,
      origemTipo: "CONTA_PAGAR",
      origemId: id
    });

    return conta;
  }

  // ── Facturação ────────────────────────────────────────────────────────────

  async emitirFactura(
    negocioId: string,
    dados: {
      clienteNome: string;
      clienteNif?: string;
      clienteEndereco?: string;
      pedidoId?: string;
      serie?: string;
      ivaPercentual?: number;
      observacao?: string;
      itens: { descricao: string; quantidade: number; precoUnitario: number }[];
    }
  ) {
    const serie = dados.serie ?? "FT";
    const anoFiscal = new Date().getFullYear();
    const ivaPerc = dados.ivaPercentual ?? 14;

    // próximo número na série
    const ultima = await this.prisma.factura.findFirst({
      where: { negocioId, serie, anoFiscal },
      orderBy: { numero: "desc" },
      select: { numero: true }
    });
    const numero = (ultima?.numero ?? 0) + 1;

    // calcular totais
    const itensCalc = dados.itens.map((item) => {
      const subtotal = item.quantidade * item.precoUnitario;
      const ivaValor = Math.round(subtotal * (ivaPerc / 100));
      return { ...item, subtotal, ivaPercentual: ivaPerc, ivaValor };
    });

    const subtotal = itensCalc.reduce((s, i) => s + i.subtotal, 0);
    const ivaValor = itensCalc.reduce((s, i) => s + i.ivaValor, 0);
    const total = subtotal + ivaValor;

    const factura = await this.prisma.factura.create({
      data: {
        negocioId,
        pedidoId: dados.pedidoId,
        clienteNome: dados.clienteNome,
        clienteNif: dados.clienteNif,
        clienteEndereco: dados.clienteEndereco,
        serie,
        numero,
        anoFiscal,
        subtotal,
        ivaPercentual: ivaPerc,
        ivaValor,
        total,
        observacao: dados.observacao,
        itens: { create: itensCalc.map((i) => ({
          descricao: i.descricao,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          subtotal: i.subtotal,
          ivaPercentual: i.ivaPercentual,
          ivaValor: i.ivaValor
        })) }
      },
      include: { itens: true }
    });

    // registar movimento de entrada
    await this.registarMovimento(negocioId, {
      tipo: "ENTRADA",
      descricao: `Factura ${serie} ${String(numero).padStart(4, "0")}/${anoFiscal}`,
      valor: total,
      origemTipo: "FACTURA",
      origemId: factura.id
    });

    return factura;
  }

  async listarFacturas(
    negocioId: string,
    filtros?: { estado?: string; de?: Date; ate?: Date; limite?: number }
  ) {
    return this.prisma.factura.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {}),
        ...(filtros?.de || filtros?.ate ? {
          emitidaEm: {
            ...(filtros?.de ? { gte: filtros.de } : {}),
            ...(filtros?.ate ? { lte: filtros.ate } : {})
          }
        } : {})
      },
      include: { itens: true, _count: { select: { notasCredito: true } } },
      orderBy: { emitidaEm: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  async obterFactura(id: string, negocioId: string) {
    return this.prisma.factura.findFirst({
      where: { id, negocioId },
      include: { itens: true, notasCredito: true }
    });
  }

  async anularFactura(id: string, negocioId: string, motivo: string) {
    return this.prisma.factura.update({
      where: { id, negocioId },
      data: { estado: "ANULADA", anuladaEm: new Date(), motivoAnulacao: motivo }
    });
  }

  async gerarPdfFactura(id: string, negocioId: string): Promise<Buffer> {
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id, negocioId },
      include: { itens: true, negocio: true }
    });

    const dados: DadosFacturaPdf = {
      serie: factura.serie,
      numero: factura.numero,
      anoFiscal: factura.anoFiscal,
      estado: factura.estado,
      emitidaEm: factura.emitidaEm,
      nomeComercial: factura.negocio.nomeComercial,
      nif: factura.negocio.nif,
      telefone: factura.negocio.telefone,
      email: factura.negocio.email,
      endereco: factura.negocio.endereco,
      moeda: factura.negocio.moeda,
      clienteNome: factura.clienteNome,
      clienteNif: factura.clienteNif,
      clienteEndereco: factura.clienteEndereco,
      subtotal: factura.subtotal,
      ivaPercentual: factura.ivaPercentual,
      ivaValor: factura.ivaValor,
      total: factura.total,
      observacao: factura.observacao,
      itens: factura.itens.map((i) => ({
        descricao: i.descricao,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
        subtotal: i.subtotal,
        ivaPercentual: i.ivaPercentual,
        ivaValor: i.ivaValor
      }))
    };

    const html = buildFacturaHtml(dados);
    return renderPdfFromHtml(html, { footerLabel: factura.negocio.nomeComercial });
  }

  // ── Nota de Crédito ──────────────────────────────────────────────────────

  async emitirNotaCredito(
    negocioId: string,
    dados: { facturaId: string; motivo: string; valor: number }
  ) {
    const anoFiscal = new Date().getFullYear();

    const ultima = await this.prisma.notaCredito.findFirst({
      where: { negocioId, anoFiscal },
      orderBy: { numero: "desc" },
      select: { numero: true }
    });
    const numero = (ultima?.numero ?? 0) + 1;

    const nota = await this.prisma.notaCredito.create({
      data: {
        negocioId,
        facturaId: dados.facturaId,
        numero,
        anoFiscal,
        motivo: dados.motivo,
        valor: dados.valor
      }
    });

    // registar movimento de saída (devolução)
    await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      descricao: `Nota crédito NC ${String(numero).padStart(4, "0")}/${anoFiscal}`,
      valor: dados.valor,
      origemTipo: "NOTA_CREDITO",
      origemId: nota.id
    });

    return nota;
  }

  // ── Orçamento ─────────────────────────────────────────────────────────────

  async definirOrcamento(
    negocioId: string,
    dados: { categoriaId: string; mes: number; ano: number; valorOrcado: number }
  ) {
    return this.prisma.orcamentoPeriodo.upsert({
      where: {
        negocioId_categoriaId_mes_ano: {
          negocioId,
          categoriaId: dados.categoriaId,
          mes: dados.mes,
          ano: dados.ano
        }
      },
      create: { negocioId, ...dados },
      update: { valorOrcado: dados.valorOrcado }
    });
  }

  async obterOrcadoVsRealizado(negocioId: string, mes: number, ano: number) {
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    const [orcamentos, movimentos] = await Promise.all([
      this.prisma.orcamentoPeriodo.findMany({
        where: { negocioId, mes, ano },
        include: { categoria: { select: { id: true, nome: true } } }
      }),
      this.prisma.movimentoFinanceiro.findMany({
        where: { negocioId, tipo: "SAIDA", dataMovimento: { gte: de, lte: ate }, categoriaId: { not: null } },
        select: { categoriaId: true, valor: true }
      })
    ]);

    const realizadoPorCategoria: Record<string, number> = {};
    for (const m of movimentos) {
      if (m.categoriaId) {
        realizadoPorCategoria[m.categoriaId] = (realizadoPorCategoria[m.categoriaId] ?? 0) + m.valor;
      }
    }

    return orcamentos.map((o) => {
      const realizado = realizadoPorCategoria[o.categoriaId] ?? 0;
      const variacao = o.valorOrcado > 0 ? Math.round((realizado / o.valorOrcado) * 100) : 0;
      return {
        categoriaId: o.categoriaId,
        categoria: o.categoria.nome,
        orcado: o.valorOrcado,
        realizado,
        variacao,
        alerta: variacao >= 100 ? "EXCEDIDO" : variacao >= 80 ? "ATENCAO" : "OK"
      };
    });
  }

  // ── Recibos de Pagamento (RF-T037) ───────────────────────────────────────

  async gerarReciboPagamento(
    negocioId: string,
    dados: {
      clienteNome: string;
      clienteNif?: string;
      valorPago: number;
      metodoPagamento?: string;
      referencia?: string;
      facturaId?: string;
      observacao?: string;
    }
  ) {
    const anoFiscal = new Date().getFullYear();

    // próximo número de recibo (baseado em movimentos de tipo RECIBO)
    const ultimoRecibo = await this.prisma.movimentoFinanceiro.findFirst({
      where: { negocioId, origemTipo: "RECIBO" },
      orderBy: { criadoEm: "desc" },
      select: { descricao: true }
    });
    const match = ultimoRecibo?.descricao.match(/RC (\d+)\//);
    const numero = match ? parseInt(match[1]) + 1 : 1;

    // buscar dados do negócio
    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: negocioId },
      select: { nomeComercial: true, nif: true, telefone: true, email: true, endereco: true, moeda: true }
    });

    // referência da factura se fornecida
    let facturaRef: string | undefined;
    if (dados.facturaId) {
      const factura = await this.prisma.factura.findFirst({
        where: { id: dados.facturaId, negocioId },
        select: { serie: true, numero: true, anoFiscal: true }
      });
      if (factura) {
        facturaRef = `${factura.serie} ${String(factura.numero).padStart(4, "0")}/${factura.anoFiscal}`;
      }
    }

    // registar movimento
    await this.registarMovimento(negocioId, {
      tipo: "ENTRADA",
      descricao: `RC ${String(numero).padStart(4, "0")}/${anoFiscal} — ${dados.clienteNome}`,
      valor: dados.valorPago,
      origemTipo: "RECIBO",
      origemId: dados.facturaId
    });

    // gerar PDF
    const dadosPdf: DadosReciboPdf = {
      numero,
      anoFiscal,
      emitidoEm: new Date(),
      nomeComercial: negocio.nomeComercial,
      nif: negocio.nif,
      telefone: negocio.telefone,
      email: negocio.email,
      endereco: negocio.endereco,
      moeda: negocio.moeda,
      clienteNome: dados.clienteNome,
      clienteNif: dados.clienteNif,
      valorPago: dados.valorPago,
      metodoPagamento: dados.metodoPagamento,
      referencia: dados.referencia,
      facturaRef,
      observacao: dados.observacao
    };

    const html = buildReciboHtml(dadosPdf);
    return {
      pdf: await renderPdfFromHtml(html, { footerLabel: negocio.nomeComercial }),
      numero,
      anoFiscal
    };
  }

  // ── Despesas Recorrentes (RF-T025) ───────────────────────────────────────

  async processarDespesasRecorrentes(negocioId: string) {
    const agora = new Date();
    const despesasRecorrentes = await this.prisma.despesa.findMany({
      where: {
        negocioId,
        tipoRecorrencia: { in: ["MENSAL", "SEMANAL"] },
        pago: true
      },
      include: { categoria: { select: { id: true, nome: true } } }
    });

    let criadas = 0;

    for (const despesa of despesasRecorrentes) {
      const pagoEm = despesa.pagoEm ?? despesa.criadoEm;
      const diasDesde = Math.floor((agora.getTime() - pagoEm.getTime()) / (1000 * 60 * 60 * 24));

      const intervalo = despesa.tipoRecorrencia === "SEMANAL" ? 7 : 30;

      if (diasDesde >= intervalo) {
        // verificar se já existe despesa recente com mesma descrição
        const existente = await this.prisma.despesa.findFirst({
          where: {
            negocioId,
            descricao: despesa.descricao,
            criadoEm: { gte: new Date(agora.getTime() - intervalo * 24 * 60 * 60 * 1000) }
          }
        });

        if (!existente) {
          await this.criarDespesa(negocioId, {
            categoriaId: despesa.categoriaId ?? undefined,
            descricao: despesa.descricao,
            valor: despesa.valor,
            tipoRecorrencia: despesa.tipoRecorrencia,
            fornecedor: despesa.fornecedor ?? undefined,
            dataVencimento: new Date(agora.getTime() + intervalo * 24 * 60 * 60 * 1000),
            observacao: `Recorrência automática de: ${despesa.descricao}`
          });
          criadas++;
        }
      }
    }

    return { criadas };
  }

  // ── Alertas de Pagamentos (RF-T034) ──────────────────────────────────────

  async obterAlertasPagamentos(negocioId: string) {
    const agora = new Date();
    const em3Dias = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);
    const em1Dia = new Date(agora.getTime() + 1 * 24 * 60 * 60 * 1000);

    const contasPagar = await this.prisma.contaPagar.findMany({
      where: { negocioId, estado: { not: "PAGO" } },
      orderBy: { dataVencimento: "asc" }
    });

    const alertas: Array<{
      id: string;
      tipo: "VENCIDO" | "VENCE_AMANHA" | "VENCE_3_DIAS";
      fornecedor: string;
      descricao: string;
      valor: number;
      dataVencimento: Date;
      diasAtraso?: number;
    }> = [];

    for (const conta of contasPagar) {
      if (conta.dataVencimento < agora) {
        const diasAtraso = Math.floor((agora.getTime() - conta.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
        alertas.push({
          id: conta.id, tipo: "VENCIDO", fornecedor: conta.fornecedor,
          descricao: conta.descricao, valor: conta.valor,
          dataVencimento: conta.dataVencimento, diasAtraso
        });
      } else if (conta.dataVencimento <= em1Dia) {
        alertas.push({
          id: conta.id, tipo: "VENCE_AMANHA", fornecedor: conta.fornecedor,
          descricao: conta.descricao, valor: conta.valor,
          dataVencimento: conta.dataVencimento
        });
      } else if (conta.dataVencimento <= em3Dias) {
        alertas.push({
          id: conta.id, tipo: "VENCE_3_DIAS", fornecedor: conta.fornecedor,
          descricao: conta.descricao, valor: conta.valor,
          dataVencimento: conta.dataVencimento
        });
      }
    }

    // alertas de despesas não pagas próximas do vencimento
    const despesasPendentes = await this.prisma.despesa.findMany({
      where: { negocioId, pago: false, dataVencimento: { not: null, lte: em3Dias } },
      orderBy: { dataVencimento: "asc" }
    });

    for (const d of despesasPendentes) {
      if (!d.dataVencimento) continue;
      if (d.dataVencimento < agora) {
        alertas.push({
          id: d.id, tipo: "VENCIDO", fornecedor: d.fornecedor ?? "—",
          descricao: d.descricao, valor: d.valor,
          dataVencimento: d.dataVencimento,
          diasAtraso: Math.floor((agora.getTime() - d.dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
        });
      } else if (d.dataVencimento <= em1Dia) {
        alertas.push({
          id: d.id, tipo: "VENCE_AMANHA", fornecedor: d.fornecedor ?? "—",
          descricao: d.descricao, valor: d.valor, dataVencimento: d.dataVencimento
        });
      } else {
        alertas.push({
          id: d.id, tipo: "VENCE_3_DIAS", fornecedor: d.fornecedor ?? "—",
          descricao: d.descricao, valor: d.valor, dataVencimento: d.dataVencimento
        });
      }
    }

    return { alertas, totalVencido: alertas.filter((a) => a.tipo === "VENCIDO").reduce((s, a) => s + a.valor, 0) };
  }

  // ── Cobrança Automática (RF-T029) ────────────────────────────────────────

  async gerarCobrancasVencidas(negocioId: string) {
    const agora = new Date();

    const contasVencidas = await this.prisma.contaReceber.findMany({
      where: { negocioId, estado: { not: "PAGO" }, dataVencimento: { lt: agora } },
      orderBy: { dataVencimento: "asc" }
    });

    const cobrancas: Array<{
      contaId: string;
      descricao: string;
      valor: number;
      diasAtraso: number;
      clienteId: string | null;
    }> = [];

    for (const conta of contasVencidas) {
      const diasAtraso = Math.floor((agora.getTime() - conta.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));

      cobrancas.push({
        contaId: conta.id,
        descricao: conta.descricao,
        valor: conta.valor,
        diasAtraso,
        clienteId: conta.clienteId
      });
    }

    // Criar tarefas operacionais para cada cobrança (se modelo TarefaOperacional existir)
    let tarefasCriadas = 0;
    for (const c of cobrancas) {
      const jaExiste = await this.prisma.tarefaOperacional.findFirst({
        where: {
          negocioId,
          tipo: "COBRANCA",
          entidadeId: c.contaId,
          estado: { not: "CONCLUIDA" }
        }
      });

      if (!jaExiste) {
        await this.prisma.tarefaOperacional.create({
          data: {
            negocioId,
            titulo: `Cobrança: ${c.descricao}`,
            descricao: `Pagamento vencido há ${c.diasAtraso} dia(s). Valor: ${c.valor}`,
            tipo: "COBRANCA",
            prioridade: c.diasAtraso > 30 ? "ALTA" : c.diasAtraso > 7 ? "MEDIA" : "BAIXA",
            entidadeTipo: "ContaReceber",
            entidadeId: c.contaId,
            estado: "PENDENTE"
          }
        });
        tarefasCriadas++;
      }
    }

    return { totalVencidas: cobrancas.length, tarefasCriadas, cobrancas };
  }

  // ── Taxa de Inadimplência (RF-T030) ────────────────────────────────────

  async calcularTaxaInadimplencia(
    negocioId: string,
    filtros?: { de?: Date; ate?: Date }
  ) {
    const agora = new Date();
    const de = filtros?.de ?? new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
    const ate = filtros?.ate ?? agora;

    const todasContas = await this.prisma.contaReceber.findMany({
      where: {
        negocioId,
        criadoEm: { gte: de, lte: ate }
      }
    });

    const total = todasContas.length;
    if (total === 0) return { total: 0, inadimplentes: 0, taxa: 0, valorTotal: 0, valorInadimplente: 0 };

    const inadimplentes = todasContas.filter(
      (c) => c.estado !== "PAGO" && c.dataVencimento < agora
    );

    const valorTotal = todasContas.reduce((s, c) => s + c.valor, 0);
    const valorInadimplente = inadimplentes.reduce((s, c) => s + c.valor, 0);

    // Agrupar por mês
    const porMes: Record<string, { total: number; inadimplentes: number }> = {};
    for (const c of todasContas) {
      const chave = `${String(c.criadoEm.getMonth() + 1).padStart(2, "0")}/${c.criadoEm.getFullYear()}`;
      if (!porMes[chave]) porMes[chave] = { total: 0, inadimplentes: 0 };
      porMes[chave].total++;
      if (c.estado !== "PAGO" && c.dataVencimento < agora) {
        porMes[chave].inadimplentes++;
      }
    }

    return {
      total,
      inadimplentes: inadimplentes.length,
      taxa: Math.round((inadimplentes.length / total) * 100),
      valorTotal,
      valorInadimplente,
      porMes: Object.entries(porMes).map(([periodo, v]) => ({
        periodo,
        ...v,
        taxa: v.total > 0 ? Math.round((v.inadimplentes / v.total) * 100) : 0
      }))
    };
  }

  // ── Priorização de Pagamentos (RF-T033) ─────────────────────────────────

  async priorizarPagamentos(negocioId: string) {
    const contasPendentes = await this.prisma.contaPagar.findMany({
      where: { negocioId, estado: { not: "PAGO" } },
      orderBy: { dataVencimento: "asc" }
    });

    const agora = new Date();

    const priorizadas = contasPendentes.map((conta) => {
      const diasAteVencimento = Math.floor(
        (conta.dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
      );

      let prioridade: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
      let motivo: string;

      if (diasAteVencimento < 0) {
        prioridade = "CRITICA";
        motivo = `Vencido há ${Math.abs(diasAteVencimento)} dia(s)`;
      } else if (diasAteVencimento <= 3) {
        prioridade = "ALTA";
        motivo = `Vence em ${diasAteVencimento} dia(s)`;
      } else if (diasAteVencimento <= 7) {
        prioridade = "MEDIA";
        motivo = `Vence em ${diasAteVencimento} dia(s)`;
      } else {
        prioridade = "BAIXA";
        motivo = `Vence em ${diasAteVencimento} dia(s)`;
      }

      return {
        id: conta.id,
        fornecedor: conta.fornecedor,
        descricao: conta.descricao,
        valor: conta.valor,
        dataVencimento: conta.dataVencimento,
        diasAteVencimento,
        prioridade,
        motivo
      };
    });

    // Ordenar: CRITICA > ALTA > MEDIA > BAIXA, depois por valor (maior primeiro dentro do mesmo nível)
    const ordemPrioridade = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
    priorizadas.sort((a, b) => {
      const diff = ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade];
      return diff !== 0 ? diff : b.valor - a.valor;
    });

    const totalPendente = priorizadas.reduce((s, p) => s + p.valor, 0);

    return {
      pagamentos: priorizadas,
      resumo: {
        total: priorizadas.length,
        totalPendente,
        criticas: priorizadas.filter((p) => p.prioridade === "CRITICA").length,
        altas: priorizadas.filter((p) => p.prioridade === "ALTA").length
      }
    };
  }

  // ── Risco de Inadimplência (RF-T031) ─────────────────────────────────────

  async calcularRiscoInadimplencia(negocioId: string) {
    const agora = new Date();

    // buscar todas as contas a receber
    const contas = await this.prisma.contaReceber.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });

    // agrupar por cliente
    const porCliente: Record<string, {
      clienteId: string;
      total: number;
      pagas: number;
      vencidas: number;
      valorTotal: number;
      valorVencido: number;
      diasAtrasoMedio: number;
    }> = {};

    for (const c of contas) {
      const chave = c.clienteId ?? "sem-cliente";
      if (!porCliente[chave]) {
        porCliente[chave] = {
          clienteId: chave,
          total: 0, pagas: 0, vencidas: 0,
          valorTotal: 0, valorVencido: 0, diasAtrasoMedio: 0
        };
      }
      const p = porCliente[chave];
      p.total++;
      p.valorTotal += c.valor;

      if (c.estado === "PAGO") {
        p.pagas++;
        // calcular dias de atraso no pagamento (pagoEm vs dataVencimento)
        if (c.pagoEm && c.pagoEm > c.dataVencimento) {
          const diasAtraso = Math.floor((c.pagoEm.getTime() - c.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
          p.diasAtrasoMedio = (p.diasAtrasoMedio * (p.pagas - 1) + diasAtraso) / p.pagas;
        }
      } else if (c.dataVencimento < agora) {
        p.vencidas++;
        p.valorVencido += c.valor;
      }
    }

    // calcular score de risco (0-100, 100 = maior risco)
    const riscos = Object.values(porCliente).map((p) => {
      const taxaInadimplencia = p.total > 0 ? (p.vencidas / p.total) * 100 : 0;
      const factorAtraso = Math.min(p.diasAtrasoMedio / 30, 1) * 30; // até 30 pontos
      const factorVencidas = Math.min(taxaInadimplencia, 50); // até 50 pontos
      const factorValor = p.valorVencido > 0 ? Math.min((p.valorVencido / p.valorTotal) * 20, 20) : 0; // até 20 pontos

      const score = Math.round(factorVencidas + factorAtraso + factorValor);
      const nivel = score >= 70 ? "ALTO" : score >= 40 ? "MEDIO" : "BAIXO";

      return {
        clienteId: p.clienteId === "sem-cliente" ? null : p.clienteId,
        totalContas: p.total,
        contasPagas: p.pagas,
        contasVencidas: p.vencidas,
        valorTotal: p.valorTotal,
        valorVencido: p.valorVencido,
        diasAtrasoMedio: Math.round(p.diasAtrasoMedio),
        score,
        nivel
      };
    });

    // ordenar por score desc
    riscos.sort((a, b) => b.score - a.score);

    return { clientes: riscos };
  }

  // ── Fecho de Período (RN-T004) ─────────────────────────────────────────

  async fecharPeriodo(negocioId: string, mes: number, ano: number) {
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    const semCategoria = await this.prisma.movimentoFinanceiro.count({
      where: { negocioId, dataMovimento: { gte: de, lte: ate }, categoriaId: null }
    });

    if (semCategoria > 0) {
      throw new Error(
        `RN-T004: Existem ${semCategoria} movimentos sem categoria no período ${mes}/${ano}. Reconcilie antes de fechar.`
      );
    }

    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: negocioId },
      select: { dadosOperacionaisJson: true }
    });

    const dadosOp = JSON.parse(negocio.dadosOperacionaisJson || "{}");
    if (!dadosOp.periodosFechados) dadosOp.periodosFechados = [];

    const chave = `${mes}/${ano}`;
    if (dadosOp.periodosFechados.includes(chave)) {
      throw new Error(`Período ${chave} já se encontra fechado.`);
    }

    dadosOp.periodosFechados.push(chave);

    await this.prisma.negocio.update({
      where: { id: negocioId },
      data: { dadosOperacionaisJson: JSON.stringify(dadosOp) }
    });

    return { periodo: chave, fechadoEm: new Date() };
  }

  // ── Limite de Desconto (RN-T005) ──────────────────────────────────────

  async validarLimiteDesconto(
    negocioId: string,
    percentualDesconto: number,
    aprovadorId?: string
  ) {
    const LIMITE_DESCONTO = 15;

    if (percentualDesconto <= LIMITE_DESCONTO) {
      return { aprovado: true, percentualDesconto };
    }

    if (!aprovadorId) {
      throw new Error(
        "RN-T005: Descontos acima de 15% exigem aprovação de perfil com permissão financas:aprovacao."
      );
    }

    const membro = await this.prisma.membroNegocio.findFirst({
      where: {
        negocioId,
        usuarioId: aprovadorId,
        status: "ATIVO",
        papel: { in: ["ADMIN", "DONO", "GESTOR_FINANCEIRO"] }
      }
    });

    if (!membro) {
      throw new Error(
        "RN-T005: Descontos acima de 15% exigem aprovação de perfil com permissão financas:aprovacao."
      );
    }

    return { aprovado: true, percentualDesconto, aprovadorId };
  }

  // ── Reembolso Vinculado (RN-T006) ─────────────────────────────────────

  async registarReembolso(
    negocioId: string,
    dados: {
      descricao: string;
      valor: number;
      pedidoId?: string;
      facturaId?: string;
      notaCreditoId?: string;
      responsavelId?: string;
      observacao?: string;
    }
  ) {
    if (!dados.pedidoId && !dados.facturaId && !dados.notaCreditoId) {
      throw new Error(
        "RN-T006: Todo reembolso deve estar vinculado a um pedido, factura ou nota de crédito. Reembolsos avulsos são bloqueados."
      );
    }

    const origemId = dados.pedidoId ?? dados.facturaId ?? dados.notaCreditoId;
    const origemDetalhe = dados.pedidoId
      ? `Pedido: ${dados.pedidoId}`
      : dados.facturaId
        ? `Factura: ${dados.facturaId}`
        : `Nota crédito: ${dados.notaCreditoId}`;

    return this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      descricao: dados.descricao || `Reembolso — ${origemDetalhe}`,
      valor: dados.valor,
      origemTipo: "REEMBOLSO",
      origemId,
      responsavelId: dados.responsavelId,
      observacao: dados.observacao
    });
  }

  // ── Movimento Multi-Moeda (RN-T007) ───────────────────────────────────

  async registarMovimentoMultiMoeda(
    negocioId: string,
    dados: {
      tipo: string;
      categoriaId?: string;
      descricao: string;
      valor: number;
      origemTipo?: string;
      origemId?: string;
      responsavelId?: string;
      dataMovimento?: Date;
      observacao?: string;
      moedaOriginal?: string;
      taxaCambio?: number;
      valorOriginal?: number;
    }
  ) {
    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: negocioId },
      select: { moeda: true }
    });

    const moedaPadrao = negocio.moeda || "AOA";

    if (dados.moedaOriginal && dados.moedaOriginal !== moedaPadrao) {
      if (!dados.taxaCambio || !dados.valorOriginal) {
        throw new Error(
          "RN-T007: Transacções em moeda estrangeira devem registar taxa de câmbio e valor original."
        );
      }

      const valorConvertido = Math.round(dados.valorOriginal * dados.taxaCambio);

      const detalheCambio = JSON.stringify({
        moedaOriginal: dados.moedaOriginal,
        valorOriginal: dados.valorOriginal,
        taxaCambio: dados.taxaCambio,
        moedaDestino: moedaPadrao
      });

      const observacaoFinal = dados.observacao
        ? `${dados.observacao} | Câmbio: ${detalheCambio}`
        : `Câmbio: ${detalheCambio}`;

      return this.registarMovimento(negocioId, {
        tipo: dados.tipo,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: valorConvertido,
        origemTipo: dados.origemTipo,
        origemId: dados.origemId,
        responsavelId: dados.responsavelId,
        dataMovimento: dados.dataMovimento,
        observacao: observacaoFinal
      });
    }

    return this.registarMovimento(negocioId, {
      tipo: dados.tipo,
      categoriaId: dados.categoriaId,
      descricao: dados.descricao,
      valor: dados.valor,
      origemTipo: dados.origemTipo,
      origemId: dados.origemId,
      responsavelId: dados.responsavelId,
      dataMovimento: dados.dataMovimento,
      observacao: dados.observacao
    });
  }

  // ── Regras Fiscais (RN-T002, RN-T003) ────────────────────────────────────

  async validarAnulacaoFactura(id: string, negocioId: string) {
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id, negocioId }
    });

    if (factura.estado === "ANULADA") {
      throw new Error("Factura já se encontra anulada.");
    }

    // RN-T002: factura emitida não pode ser editada, apenas anulada via nota de crédito ou anulação
    return factura;
  }
}
