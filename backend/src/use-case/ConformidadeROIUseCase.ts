import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const RETENCAO_FISCAL_ANOS_PADRAO = 10;
const ADAPTADORES_EINVOICING = [
  {
    id: "UBL_21",
    nome: "UBL 2.1 XML",
    protocolo: "XML_UBL",
    estado: "ATIVO",
    formatos: ["UBL_21"],
    requerCredenciais: false,
    despachoAssincrono: true
  },
  {
    id: "PEPPOL_BIS_BILLING_3",
    nome: "Peppol BIS Billing 3",
    protocolo: "PEPPOL",
    estado: "PREPARADO",
    formatos: ["PEPPOL_BIS_BILLING_3"],
    requerCredenciais: true,
    despachoAssincrono: true
  },
  {
    id: "API_GOV_REGIONAL",
    nome: "API governamental regional",
    protocolo: "API_REST",
    estado: "PREPARADO",
    formatos: ["UBL_21"],
    requerCredenciais: true,
    despachoAssincrono: true
  }
] as const;

const TEMPLATES_FACTURA_JURISDICAO = [
  {
    jurisdicao: "AO",
    nome: "Factura fiscal Angola",
    idiomas: {
      pt_AO: {
        idioma: "pt-AO",
        locale: "pt-AO",
        titulo: "Factura",
        dataEmissao: "Data de emissão",
        subtotal: "Subtotal",
        imposto: "IVA",
        total: "Total a pagar",
        rodapeFiscal: "Documento fiscal emitido conforme regras fiscais de Angola."
      },
      en_US: {
        idioma: "en-US",
        locale: "en-US",
        titulo: "Invoice",
        dataEmissao: "Issue date",
        subtotal: "Subtotal",
        imposto: "VAT",
        total: "Total due",
        rodapeFiscal: "Tax document issued under Angola fiscal rules."
      },
      fr_FR: {
        idioma: "fr-FR",
        locale: "fr-FR",
        titulo: "Facture",
        dataEmissao: "Date d'emission",
        subtotal: "Sous-total",
        imposto: "TVA",
        total: "Total a payer",
        rodapeFiscal: "Document fiscal emis selon les regles fiscales de l'Angola."
      }
    }
  }
] as const;

type FormatoEInvoicing = "UBL_21" | "PEPPOL_BIS_BILLING_3";
type AdaptadorEInvoicingId = typeof ADAPTADORES_EINVOICING[number]["id"];
type OpcoesFacturaEletronica = { idioma?: string; jurisdicao?: string };
type TemplateFacturaLocalizado = typeof TEMPLATES_FACTURA_JURISDICAO[number]["idiomas"][keyof typeof TEMPLATES_FACTURA_JURISDICAO[number]["idiomas"]] & {
  jurisdicao: string;
  nome: string;
};

export class ConformidadeROIUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── RF-T046-T050 — Regras Fiscais ─────────────────────────────────────────

  async criarRegraFiscal(
    negocioId: string,
    dados: { jurisdicao?: string; tipoImposto?: string; taxa: number; descricao?: string; aplicavelA?: string }
  ) {
    return this.prisma.regraFiscal.create({
      data: {
        negocioId,
        jurisdicao: dados.jurisdicao ?? "AO",
        tipoImposto: dados.tipoImposto ?? "IVA",
        taxa: dados.taxa,
        descricao: dados.descricao,
        aplicavelA: dados.aplicavelA
      }
    });
  }

  async listarRegrasFiscais(negocioId: string, jurisdicao?: string) {
    return this.prisma.regraFiscal.findMany({
      where: { negocioId, ...(jurisdicao ? { jurisdicao } : {}) },
      orderBy: [{ jurisdicao: "asc" }, { tipoImposto: "asc" }]
    });
  }

  async obterTaxaAplicavel(
    negocioId: string,
    tipo?: string
  ): Promise<{ taxa: number; jurisdicao: string }> {
    const regra = await this.prisma.regraFiscal.findFirst({
      where: {
        negocioId,
        tipoImposto: "IVA",
        ...(tipo ? { OR: [{ aplicavelA: tipo }, { aplicavelA: "TODOS" }, { aplicavelA: null }] } : {})
      },
      orderBy: { criadoEm: "desc" }
    });

    return { taxa: regra?.taxa ?? 14, jurisdicao: regra?.jurisdicao ?? "AO" };
  }

  // ── RF-T046/RNF-T025 — E-invoicing estruturado ───────────────────────────

  listarAdaptadoresEInvoicing() {
    return {
      adaptadores: ADAPTADORES_EINVOICING,
      formatosSuportados: ["UBL_21", "PEPPOL_BIS_BILLING_3"],
      observacao: "Adaptadores externos usam despacho assíncrono por outbox n8n e referência a credenciais cifradas; o XML UBL local também pode ser gerado sem credenciais externas."
    };
  }

  listarTemplatesFactura() {
    return {
      templates: TEMPLATES_FACTURA_JURISDICAO.map((template) => ({
        jurisdicao: template.jurisdicao,
        nome: template.nome,
        idiomas: Object.values(template.idiomas).map((idioma) => ({
          idioma: idioma.idioma,
          locale: idioma.locale,
          titulo: idioma.titulo
        }))
      }))
    };
  }

  async gerarFacturaEletronica(
    negocioId: string,
    facturaId: string,
    formato: FormatoEInvoicing = "UBL_21",
    opcoes?: OpcoesFacturaEletronica
  ) {
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id: facturaId, negocioId },
      include: {
        itens: true,
        negocio: {
          select: {
            nomeComercial: true,
            nif: true,
            telefone: true,
            email: true,
            endereco: true,
            moeda: true
          }
        }
      }
    });

    const validacao = this.validarDadosFiscaisFactura({
      clienteNome: factura.clienteNome,
      clienteNif: factura.clienteNif ?? undefined,
      itens: factura.itens.map((item) => ({ descricao: item.descricao, quantidade: item.quantidade }))
    });

    const avisos: string[] = [];
    if (!factura.negocio.nif) avisos.push("Emitente sem NIF configurado no perfil do negócio.");
    if (!factura.clienteNif) avisos.push("Cliente sem NIF; XML emitido com identificador genérico.");

    const template = this.resolverTemplateFactura(opcoes);
    const xml = this.montarFacturaUbl(factura, formato, template);
    const adaptador = ADAPTADORES_EINVOICING.find((item) => item.id === formato) ?? ADAPTADORES_EINVOICING[0];

    return {
      facturaId: factura.id,
      formato,
      protocolo: adaptador.protocolo,
      nomeArquivo: `factura-${factura.serie}-${String(factura.numero).padStart(4, "0")}-${factura.anoFiscal}.xml`,
      mimeType: "application/xml",
      xml,
      validacoes: {
        valida: validacao.valido,
        seloTemporal: validacao.seloTemporal,
        avisos
      },
      template: {
        jurisdicao: template.jurisdicao,
        idioma: template.idioma,
        locale: template.locale,
        nome: template.nome
      },
      adaptador
    };
  }

  async prepararEnvioFacturaEletronica(
    negocioId: string,
    facturaId: string,
    dados: {
      adaptadorId?: AdaptadorEInvoicingId;
      formato?: FormatoEInvoicing;
      credencialRef?: string;
      endpointUrl?: string;
      idioma?: string;
      jurisdicao?: string;
    }
  ) {
    const adaptador = ADAPTADORES_EINVOICING.find((item) => item.id === (dados.adaptadorId ?? "UBL_21"));
    if (!adaptador) {
      throw new Error("RF-T048: Adaptador de e-invoicing não suportado.");
    }
    if (adaptador.requerCredenciais && !dados.credencialRef) {
      throw new Error("RF-T048: Este adaptador exige referência de credencial cifrada.");
    }

    const formato = dados.formato ?? adaptador.formatos[0];
    const documento = await this.gerarFacturaEletronica(negocioId, facturaId, formato as FormatoEInvoicing, {
      idioma: dados.idioma,
      jurisdicao: dados.jurisdicao
    });
    const evento = await this.prisma.outboxEventoN8n.create({
      data: {
        negocioId,
        eventoId: randomUUID(),
        tipo: "EINVOICING_ENVIO_SOLICITADO",
        payloadJson: JSON.stringify({
          negocioId,
          facturaId,
          adaptadorId: adaptador.id,
          protocolo: adaptador.protocolo,
          formato,
          credencialRef: dados.credencialRef ?? null,
          endpointUrl: dados.endpointUrl ?? null,
          nomeArquivo: documento.nomeArquivo,
          mimeType: documento.mimeType,
          template: documento.template,
          xml: documento.xml,
          validacoes: documento.validacoes,
          solicitadoEm: new Date().toISOString()
        }),
        status: "PENDENTE",
        proximaTentativaEm: new Date()
      },
      select: { id: true, eventoId: true, status: true }
    });

    return {
      facturaId,
      adaptador,
      formato,
      estado: "PENDENTE_ENVIO",
      eventoN8n: evento,
      validacoes: documento.validacoes
    };
  }

  // ── RN-T029 — Validação Fiscal Pré-Emissão ───────────────────────────────

  validarDadosFiscaisFactura(dados: {
    clienteNif?: string;
    clienteNome: string;
    itens: Array<{ descricao: string; quantidade: number }>;
  }) {
    const erros: string[] = [];

    if (!dados.clienteNome || dados.clienteNome.trim().length < 2) {
      erros.push("Nome do cliente é obrigatório (mínimo 2 caracteres).");
    }

    if (dados.clienteNif) {
      const nifLimpo = dados.clienteNif.replace(/\D/g, "");
      if (nifLimpo.length < 9 || nifLimpo.length > 14) {
        erros.push("NIF/NUIT/TIN inválido (deve ter 9-14 dígitos).");
      }
    }

    if (!dados.itens || dados.itens.length === 0) {
      erros.push("Factura deve ter pelo menos um item.");
    }

    for (const [i, item] of dados.itens.entries()) {
      if (!item.descricao || item.descricao.trim().length === 0) {
        erros.push(`Item ${i + 1}: descrição obrigatória.`);
      }
      if (!item.quantidade || item.quantidade <= 0) {
        erros.push(`Item ${i + 1}: quantidade deve ser positiva.`);
      }
    }

    if (erros.length > 0) {
      throw new Error(`RN-T029: Dados fiscais inválidos para emissão de factura. ${erros.join(" ")}`);
    }

    return { valido: true, seloTemporal: new Date() };
  }

  // ── RN-T028 — Retenção Fiscal ─────────────────────────────────────────────

  async verificarRetencaoFiscal(negocioId: string) {
    const facturaMaisAntiga = await this.prisma.factura.findFirst({
      where: { negocioId },
      orderBy: { emitidaEm: "asc" },
      select: { emitidaEm: true }
    });

    if (!facturaMaisAntiga) {
      return { anosRetidos: 0, minimoExigido: RETENCAO_FISCAL_ANOS_PADRAO, conforme: true, semFacturas: true };
    }

    const anosDesdeEmissao = Math.floor(
      (Date.now() - facturaMaisAntiga.emitidaEm.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

    return {
      anosRetidos: anosDesdeEmissao,
      minimoExigido: RETENCAO_FISCAL_ANOS_PADRAO,
      conforme: true, // facturas existem, logo estão retidas
      semFacturas: false,
      primeiraFacturaEm: facturaMaisAntiga.emitidaEm
    };
  }

  // ── RF-T092-T095 — Multi-Jurisdição ───────────────────────────────────────

  async obterRegrasPorJurisdicao(negocioId: string, jurisdicao: string) {
    return this.prisma.regraFiscal.findMany({
      where: { negocioId, jurisdicao },
      orderBy: { tipoImposto: "asc" }
    });
  }

  async calcularImpostoMultiJurisdicao(
    negocioId: string,
    itens: Array<{ valor: number; jurisdicao?: string }>
  ) {
    const regras = await this.prisma.regraFiscal.findMany({ where: { negocioId } });
    const regrasPorJurisdicao = new Map<string, number>();
    for (const r of regras) {
      regrasPorJurisdicao.set(`${r.jurisdicao}:${r.tipoImposto}`, r.taxa);
    }

    const resultados = itens.map((item) => {
      const jurisdicao = item.jurisdicao ?? "AO";
      const taxa = regrasPorJurisdicao.get(`${jurisdicao}:IVA`) ?? 14;
      const impostoValor = Math.round(item.valor * (taxa / 100));
      return { valor: item.valor, jurisdicao, taxa, impostoValor, total: item.valor + impostoValor };
    });

    const totalBase = resultados.reduce((s, r) => s + r.valor, 0);
    const totalImposto = resultados.reduce((s, r) => s + r.impostoValor, 0);

    return { itens: resultados, totalBase, totalImposto, totalGeral: totalBase + totalImposto };
  }

  // ── RF-T096-T107 — Métricas de ROI e Adopção ─────────────────────────────

  async registarBaselineKPI(negocioId: string, modulo: string, kpi: string, valor: number) {
    // RN-T031: registar baseline apenas se não existir
    const existente = await this.prisma.baselineKPI.findUnique({
      where: { negocioId_modulo_kpi: { negocioId, modulo, kpi } }
    });
    if (existente) {
      return existente; // não sobrescrever baseline existente
    }

    return this.prisma.baselineKPI.create({
      data: { negocioId, modulo, kpi, valorBaseline: valor }
    });
  }

  async obterBaselines(negocioId: string, modulo?: string) {
    return this.prisma.baselineKPI.findMany({
      where: { negocioId, ...(modulo ? { modulo } : {}) },
      orderBy: [{ modulo: "asc" }, { kpi: "asc" }]
    });
  }

  async registarMetricaAdopcao(
    negocioId: string,
    dados: { dau: number; mau: number; profundidadeJson?: string }
  ) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return this.prisma.metricaAdopcao.upsert({
      where: { negocioId_data: { negocioId, data: hoje } },
      create: {
        negocioId,
        data: hoje,
        dau: dados.dau,
        mau: dados.mau,
        profundidadeJson: dados.profundidadeJson ?? "{}"
      },
      update: {
        dau: dados.dau,
        mau: dados.mau,
        ...(dados.profundidadeJson ? { profundidadeJson: dados.profundidadeJson } : {})
      }
    });
  }

  async obterMetricasAdopcao(
    negocioId: string,
    filtros?: { de?: Date; ate?: Date }
  ) {
    return this.prisma.metricaAdopcao.findMany({
      where: {
        negocioId,
        ...(filtros?.de || filtros?.ate ? {
          data: {
            ...(filtros?.de ? { gte: filtros.de } : {}),
            ...(filtros?.ate ? { lte: filtros.ate } : {})
          }
        } : {})
      },
      orderBy: { data: "desc" },
      take: 90
    });
  }

  async calcularROIModulo(negocioId: string, modulo: string) {
    const baselines = await this.prisma.baselineKPI.findMany({
      where: { negocioId, modulo }
    });

    if (baselines.length === 0) {
      return { modulo, semBaseline: true, metricas: [] };
    }

    const metricas = await Promise.all(baselines.map(async (b) => {
      const actual = await this.calcularValorActualKPI(negocioId, b.kpi, b.valorBaseline);
      return {
        kpi: b.kpi,
        baseline: b.valorBaseline,
        actual,
        melhoriaPercentual: this.calcularVariacaoPercentual(b.valorBaseline, actual),
        registadoEm: b.registadoEm
      };
    }));

    return { modulo, semBaseline: false, metricas };
  }

  // ── RF-T094 — Relatórios Fiscais Periódicos ────────────────────────────────

  async gerarRelatorioFiscalPeriodico(
    negocioId: string,
    filtros?: { periodo?: "MENSAL" | "TRIMESTRAL"; de?: Date; ate?: Date }
  ) {
    const agora = new Date();
    const periodo = filtros?.periodo ?? "MENSAL";
    const de = filtros?.de ?? new Date(agora.getFullYear(), agora.getMonth() - (periodo === "TRIMESTRAL" ? 3 : 1), 1);
    const ate = filtros?.ate ?? new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);

    // Buscar facturas emitidas no período
    const facturas = await this.prisma.factura.findMany({
      where: { negocioId, emitidaEm: { gte: de, lte: ate }, estado: { not: "ANULADA" } },
      select: { id: true, subtotal: true, ivaValor: true, total: true, estado: true, emitidaEm: true }
    });

    // Buscar notas de crédito no período
    const notasCredito = await this.prisma.notaCredito.findMany({
      where: { negocioId, emitidaEm: { gte: de, lte: ate } },
      select: { valor: true }
    });

    // Buscar despesas com IVA dedutível (estimativa via movimentos de saída)
    const despesas = await this.prisma.movimentoFinanceiro.findMany({
      where: { negocioId, tipo: "SAIDA", dataMovimento: { gte: de, lte: ate } },
      select: { valor: true }
    });

    // Obter taxa IVA do negócio
    const { taxa: taxaIVA } = await this.obterTaxaAplicavel(negocioId);

    const totalFacturado = facturas.reduce((s, f) => s + f.subtotal, 0);
    const ivaCobrado = facturas.reduce((s, f) => s + f.ivaValor, 0);
    const totalNotasCredito = notasCredito.reduce((s, n) => s + n.valor, 0);
    // Estimar IVA das notas de crédito com base na taxa aplicável
    const ivaNotasCredito = Math.round(totalNotasCredito * (taxaIVA / (100 + taxaIVA)));
    const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
    const ivaDedutivel = Math.round(totalDespesas * (taxaIVA / (100 + taxaIVA)));
    const ivaAEntregar = Math.max(0, ivaCobrado - ivaNotasCredito - ivaDedutivel);

    return {
      periodo: { de: de.toISOString().slice(0, 10), ate: ate.toISOString().slice(0, 10), tipo: periodo },
      facturacao: {
        totalFacturas: facturas.length,
        totalFacturado,
        totalComImposto: facturas.reduce((s, f) => s + f.total, 0)
      },
      iva: {
        taxaAplicada: taxaIVA,
        ivaCobrado,
        ivaNotasCredito,
        ivaDedutivel,
        ivaAEntregar
      },
      notasCredito: {
        total: notasCredito.length,
        valorTotal: totalNotasCredito
      },
      despesas: {
        totalDespesas,
        ivaDedutivel
      }
    };
  }

  // ── RF-T095 — Arquivo Digital de Facturas ─────────────────────────────────

  async verificarArquivoDigitalFacturas(negocioId: string) {
    const regras = await this.prisma.regraFiscal.findFirst({
      where: { negocioId },
      select: { jurisdicao: true }
    });

    const jurisdicao = regras?.jurisdicao ?? "AO";
    const anosRetencao = RETENCAO_FISCAL_ANOS_PADRAO;

    // Contar facturas por ano fiscal
    const facturas = await this.prisma.factura.findMany({
      where: { negocioId },
      select: { emitidaEm: true, estado: true },
      orderBy: { emitidaEm: "asc" }
    });

    const porAno: Record<number, { total: number; emitidas: number; canceladas: number }> = {};
    for (const f of facturas) {
      const ano = f.emitidaEm.getFullYear();
      if (!porAno[ano]) porAno[ano] = { total: 0, emitidas: 0, canceladas: 0 };
      porAno[ano].total++;
      if (f.estado === "CANCELADA") porAno[ano].canceladas++;
      else porAno[ano].emitidas++;
    }

    const anoActual = new Date().getFullYear();
    const periodos = Object.entries(porAno).map(([ano, dados]) => ({
      anoFiscal: Number(ano),
      ...dados,
      retidoAte: Number(ano) + anosRetencao,
      completo: true // facturas estão no sistema = retidas
    }));

    return {
      jurisdicao,
      anosRetencaoMinimo: anosRetencao,
      totalFacturas: facturas.length,
      periodos,
      conforme: true,
      primeiroAno: periodos.length > 0 ? periodos[0].anoFiscal : anoActual,
      ultimoAno: periodos.length > 0 ? periodos[periodos.length - 1].anoFiscal : anoActual
    };
  }

  // ── RF-T096 — Economia de Tempo ───────────────────────────────────────────

  async calcularEconomiaTempo(negocioId: string) {
    // Estimar horas poupadas por automações
    const agora = new Date();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [facturasAutomatic, fluxosExecutados, tarefasAutomatic, cobrancasAutomatic] = await Promise.all([
      this.prisma.factura.count({
        where: { negocioId, emitidaEm: { gte: inicio30d } }
      }),
      this.prisma.execucaoFluxo.count({
        where: { fluxo: { negocioId }, iniciadoEm: { gte: inicio30d }, estado: "CONCLUIDO" }
      }),
      this.prisma.tarefaOperacional.count({
        where: { negocioId, criadaEm: { gte: inicio30d }, origem: "AUTOMATICA" }
      }),
      this.prisma.contaReceber.count({
        where: { negocioId, criadoEm: { gte: inicio30d } }
      })
    ]);

    // Estimativas de tempo por tarefa manual (em minutos)
    const minutosFactura = 15;
    const minutosFluxo = 10;
    const minutosTarefa = 5;
    const minutosCobranca = 8;

    const minutosTotal =
      facturasAutomatic * minutosFactura +
      fluxosExecutados * minutosFluxo +
      tarefasAutomatic * minutosTarefa +
      cobrancasAutomatic * minutosCobranca;

    const horasTotal = Math.round(minutosTotal / 60 * 10) / 10;

    return {
      periodo: "30_DIAS",
      detalhes: [
        { automacao: "Geração de facturas", quantidade: facturasAutomatic, minutosPoupados: facturasAutomatic * minutosFactura },
        { automacao: "Fluxos automáticos", quantidade: fluxosExecutados, minutosPoupados: fluxosExecutados * minutosFluxo },
        { automacao: "Tarefas automáticas", quantidade: tarefasAutomatic, minutosPoupados: tarefasAutomatic * minutosTarefa },
        { automacao: "Cobranças automáticas", quantidade: cobrancasAutomatic, minutosPoupados: cobrancasAutomatic * minutosCobranca }
      ],
      totalMinutosPoupados: minutosTotal,
      totalHorasPoupadas: horasTotal,
      equivalenteJornadasTrabalho: Math.round(horasTotal / 8 * 10) / 10
    };
  }

  // ── RF-T097 — Receita Atribuída ───────────────────────────────────────────

  async calcularReceitaAtribuida(negocioId: string) {
    const agora = new Date();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [pedidosPipeline, pedidosLoja, pedidosComAfiliado] = await Promise.all([
      // Vendas totais confirmadas
      this.prisma.pedido.aggregate({
        where: { negocioId, criadoEm: { gte: inicio30d }, estadoPagamento: "CONFIRMADO" },
        _sum: { totalEmKwanza: true },
        _count: true
      }),
      // Vendas via loja pública (campo origem)
      this.prisma.pedido.aggregate({
        where: { negocioId, criadoEm: { gte: inicio30d }, estadoPagamento: "CONFIRMADO", origem: "loja-publica" },
        _sum: { totalEmKwanza: true },
        _count: true
      }),
      // Vendas com comissão de afiliado
      this.prisma.pedido.aggregate({
        where: { negocioId, criadoEm: { gte: inicio30d }, estadoPagamento: "CONFIRMADO", comissoesParceiro: { some: {} } },
        _sum: { totalEmKwanza: true },
        _count: true
      })
    ]);

    return {
      periodo: "30_DIAS",
      fontes: [
        { fonte: "Pipeline comercial (total)", pedidos: pedidosPipeline._count, valor: pedidosPipeline._sum.totalEmKwanza ?? 0 },
        { fonte: "Loja pública", pedidos: pedidosLoja._count, valor: pedidosLoja._sum.totalEmKwanza ?? 0 },
        { fonte: "Afiliados/Revendedores", pedidos: pedidosComAfiliado._count, valor: pedidosComAfiliado._sum.totalEmKwanza ?? 0 }
      ],
      receitaTotal: pedidosPipeline._sum.totalEmKwanza ?? 0
    };
  }

  // ── RF-T098 — Comparação Antes/Depois ─────────────────────────────────────

  async compararAntesDepois(negocioId: string, modulo: string) {
    const baselines = await this.prisma.baselineKPI.findMany({
      where: { negocioId, modulo }
    });

    if (baselines.length === 0) {
      return { modulo, semBaseline: true, comparacoes: [] };
    }

    const comparacoes = await Promise.all(baselines.map(async (b) => {
      const valorActual = await this.calcularValorActualKPI(negocioId, b.kpi, b.valorBaseline);
      const variacao = this.calcularVariacaoPercentual(b.valorBaseline, valorActual);

      return {
        kpi: b.kpi,
        baseline: b.valorBaseline,
        actual: valorActual,
        variacao,
        melhorou: variacao > 0,
        registadoEm: b.registadoEm
      };
    }));

    return { modulo, semBaseline: false, comparacoes };
  }

  private async calcularValorActualKPI(negocioId: string, kpi: string, fallback: number) {
    const agora = new Date();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (kpi === "pedidos_mensais") {
      return this.prisma.pedido.count({ where: { negocioId, criadoEm: { gte: inicio30d } } });
    }

    if (kpi === "receita_mensal") {
      const agregado = await this.prisma.pedido.aggregate({
        where: { negocioId, estadoPagamento: "CONFIRMADO", criadoEm: { gte: inicio30d } },
        _sum: { totalEmKwanza: true }
      });
      return agregado._sum.totalEmKwanza ?? 0;
    }

    if (kpi === "clientes_activos") {
      return this.prisma.clienteNegocio.count({ where: { negocioId } });
    }

    if (kpi === "tarefas_concluidas") {
      return this.prisma.tarefaOperacional.count({
        where: { negocioId, estado: "CONCLUIDA", concluidaEm: { gte: inicio30d } }
      });
    }

    return fallback;
  }

  private calcularVariacaoPercentual(baseline: number, actual: number) {
    return baseline > 0 ? Math.round(((actual - baseline) / baseline) * 100) : 0;
  }

  // ── RF-T099 — Custo Evitado ───────────────────────────────────────────────

  async calcularCustoEvitado(negocioId: string) {
    const agora = new Date();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Inadimplência prevenida: cobranças automáticas que resultaram em pagamento
    const contasRecebidas = await this.prisma.contaReceber.count({
      where: { negocioId, estado: "PAGO", atualizadoEm: { gte: inicio30d } }
    });
    const valorMedioReceber = await this.prisma.contaReceber.aggregate({
      where: { negocioId, estado: "PAGO", atualizadoEm: { gte: inicio30d } },
      _avg: { valor: true }
    });
    const inadimplenciaPrevenida = Math.round((valorMedioReceber._avg?.valor ?? 0) * contasRecebidas * 0.3); // 30% seriam perdas

    // 2. Erros evitados: validações fiscais que bloquearam emissão incorrecta
    // (estimativa com base em facturas emitidas — 5% teriam erros sem validação)
    const facturasEmitidas = await this.prisma.factura.count({
      where: { negocioId, emitidaEm: { gte: inicio30d } }
    });
    const errosEvitados = Math.ceil(facturasEmitidas * 0.05);
    const custoErroFiscal = 5000; // Kz estimados por multa/correcção fiscal
    const multasEvitadas = errosEvitados * custoErroFiscal;

    // 3. Stock perdido evitado: alertas de reposição que preveniram ruptura
    const alertasStock = await this.prisma.previsaoDemanda.count({
      where: { negocioId, criadoEm: { gte: inicio30d } }
    });
    const vendasSalvas = Math.ceil(alertasStock * 0.1); // 10% teriam resultado em ruptura
    const custoRupturaEstimado = 15000; // Kz valor médio de venda perdida
    const rupturaPrevenida = vendasSalvas * custoRupturaEstimado;

    const custoTotalEvitado = inadimplenciaPrevenida + multasEvitadas + rupturaPrevenida;

    return {
      periodo: "30_DIAS",
      categorias: [
        { categoria: "Inadimplência prevenida", valor: inadimplenciaPrevenida, descricao: `${contasRecebidas} cobranças recuperadas` },
        { categoria: "Multas fiscais evitadas", valor: multasEvitadas, descricao: `${errosEvitados} erros de validação bloqueados` },
        { categoria: "Ruptura de stock prevenida", valor: rupturaPrevenida, descricao: `${vendasSalvas} vendas salvas por alertas` }
      ],
      custoTotalEvitado
    };
  }

  // ── NPS ────────────────────────────────────────────────────────────────────

  async criarPesquisaNPS(
    negocioId: string,
    dados: { usuarioId: string; pontuacao: number; comentario?: string; modulo?: string }
  ) {
    if (dados.pontuacao < 0 || dados.pontuacao > 10) {
      throw new Error("Pontuação NPS deve ser entre 0 e 10.");
    }

    return this.prisma.pesquisaNPS.create({
      data: {
        negocioId,
        usuarioId: dados.usuarioId,
        pontuacao: dados.pontuacao,
        comentario: dados.comentario,
        modulo: dados.modulo
      }
    });
  }

  async obterResumoNPS(negocioId: string, modulo?: string) {
    // RN-T032: dados anonimizados e agregados
    const respostas = await this.prisma.pesquisaNPS.findMany({
      where: { negocioId, ...(modulo ? { modulo } : {}) },
      select: { pontuacao: true },
      orderBy: { criadoEm: "desc" },
      take: 500
    });

    if (respostas.length === 0) {
      return { nps: 0, promotores: 0, passivos: 0, detractores: 0, total: 0 };
    }

    const total = respostas.length;
    const promotores = respostas.filter((r) => r.pontuacao >= 9).length;
    const passivos = respostas.filter((r) => r.pontuacao >= 7 && r.pontuacao <= 8).length;
    const detractores = respostas.filter((r) => r.pontuacao <= 6).length;
    const nps = Math.round(((promotores - detractores) / total) * 100);

    return { nps, promotores, passivos, detractores, total };
  }

  // ── RF-T100-T103 — Métricas de Adopção da IA ─────────────────────────────

  async medirAdopcaoIA(negocioId: string) {
    const agora = new Date();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // RF-T100: tarefas assistidas por IA vs manuais
    const tarefasTotal = await this.prisma.tarefaOperacional.count({
      where: { negocioId, criadaEm: { gte: inicio30d }, estado: "CONCLUIDA" }
    });
    const tarefasAutomaticas = await this.prisma.tarefaOperacional.count({
      where: { negocioId, criadaEm: { gte: inicio30d }, estado: "CONCLUIDA", origem: "AUTOMATICA" }
    });
    const taxaConclusaoIA = tarefasTotal > 0 ? Math.round((tarefasAutomaticas / tarefasTotal) * 100) : 0;

    // RF-T101: taxa de erro IA vs manual (proxy: fluxos que falharam vs concluídos)
    const [fluxosConcluidos, fluxosFalhados] = await Promise.all([
      this.prisma.execucaoFluxo.count({
        where: { fluxo: { negocioId }, iniciadoEm: { gte: inicio30d }, estado: "CONCLUIDO" }
      }),
      this.prisma.execucaoFluxo.count({
        where: { fluxo: { negocioId }, iniciadoEm: { gte: inicio30d }, estado: "FALHADO" }
      })
    ]);
    const totalFluxos = fluxosConcluidos + fluxosFalhados;
    const taxaErroIA = totalFluxos > 0 ? Math.round((fluxosFalhados / totalFluxos) * 100) : 0;

    // RF-T103: utilidade percebida (insights aceites vs rejeitados vs ignorados)
    const feedbacks = await this.prisma.feedbackInsight.findMany({
      where: { insight: { negocioId }, criadoEm: { gte: inicio30d } },
      select: { accao: true }
    });
    const aceites = feedbacks.filter((f) => f.accao === "ACEITE").length;
    const rejeitados = feedbacks.filter((f) => f.accao === "REJEITADO").length;
    const ignorados = feedbacks.filter((f) => f.accao === "IGNORADO").length;
    const taxaUtilidade = feedbacks.length > 0
      ? Math.round((aceites / feedbacks.length) * 100)
      : 0;

    // RF-T102: insights gerados (proxy de interacção com IA)
    const insightsGerados = await this.prisma.insightPreditivo.count({
      where: { negocioId, criadoEm: { gte: inicio30d } }
    });

    return {
      periodo: "30_DIAS",
      tarefas: {
        total: tarefasTotal,
        automaticas: tarefasAutomaticas,
        taxaConclusaoIA
      },
      fluxos: {
        concluidos: fluxosConcluidos,
        falhados: fluxosFalhados,
        taxaErroIA
      },
      insights: {
        gerados: insightsGerados,
        feedbacks: { aceites, rejeitados, ignorados, total: feedbacks.length },
        taxaUtilidade
      }
    };
  }

  // ── RF-T106 — Módulos Subutilizados ───────────────────────────────────────

  async identificarModulosSubutilizados(negocioId: string) {
    const agora = new Date();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Verificar actividade por módulo
    const modulos: Array<{
      modulo: string;
      actividade: number;
      descricao: string;
      sugestao: string;
    }> = [];

    // Finanças — movimentos criados
    const movimentos = await this.prisma.movimentoFinanceiro.count({
      where: { negocioId, dataMovimento: { gte: inicio30d } }
    });
    modulos.push({
      modulo: "financas",
      actividade: movimentos,
      descricao: `${movimentos} movimentos financeiros nos últimos 30 dias`,
      sugestao: movimentos === 0 ? "Registar despesas e receitas para visão de fluxo de caixa" : ""
    });

    // Projectos — projectos activos
    const projectos = await this.prisma.projecto.count({
      where: { negocioId, estado: { not: "FECHADO" } }
    });
    modulos.push({
      modulo: "projectos",
      actividade: projectos,
      descricao: `${projectos} projecto(s) activo(s)`,
      sugestao: projectos === 0 ? "Criar projectos para organizar entregas e equipa" : ""
    });

    // Workflows — fluxos activos
    const fluxos = await this.prisma.fluxoAutomatico.count({
      where: { negocioId, ativo: true }
    });
    modulos.push({
      modulo: "workflows",
      actividade: fluxos,
      descricao: `${fluxos} fluxo(s) automático(s) activo(s)`,
      sugestao: fluxos === 0 ? "Criar fluxos para automatizar tarefas repetitivas" : ""
    });

    // Campanhas — campanhas recentes
    const campanhas = await this.prisma.campanhaCrm.count({
      where: { negocioId, criadaEm: { gte: inicio30d } }
    });
    modulos.push({
      modulo: "campanhas",
      actividade: campanhas,
      descricao: `${campanhas} campanha(s) nos últimos 30 dias`,
      sugestao: campanhas === 0 ? "Criar campanhas segmentadas para reactivar clientes" : ""
    });

    // Afiliados — parcerias activas
    const afiliados = await this.prisma.parceiroComercial.count({
      where: { negocioId, estado: "ATIVO" }
    });
    modulos.push({
      modulo: "afiliados",
      actividade: afiliados,
      descricao: `${afiliados} parceiro(s) activo(s)`,
      sugestao: afiliados === 0 ? "Convidar afiliados para expandir canal de vendas" : ""
    });

    const subutilizados = modulos.filter((m) => m.actividade === 0);

    return {
      modulos,
      subutilizados,
      totalModulos: modulos.length,
      totalSubutilizados: subutilizados.length
    };
  }

  private montarFacturaUbl(
    factura: {
      serie: string;
      numero: number;
      anoFiscal: number;
      clienteNome: string;
      clienteNif: string | null;
      clienteEndereco: string | null;
      subtotal: number;
      ivaPercentual: number;
      ivaValor: number;
      total: number;
      emitidaEm: Date;
      negocio: {
        nomeComercial: string;
        nif: string | null;
        telefone: string | null;
        email: string | null;
        endereco: string | null;
        moeda: string;
      };
      itens: Array<{
        descricao: string;
        quantidade: number;
        precoUnitario: number;
        subtotal: number;
        ivaPercentual: number;
        ivaValor: number;
      }>;
    },
    formato: FormatoEInvoicing,
    template: TemplateFacturaLocalizado
  ) {
    const moeda = factura.negocio.moeda || "AOA";
    const profileId = formato === "PEPPOL_BIS_BILLING_3" ? "PEPPOL_BIS_BILLING_3" : "BIZY_UBL_21";
    const facturaId = `${factura.serie} ${String(factura.numero).padStart(4, "0")}/${factura.anoFiscal}`;
    const supplierNif = factura.negocio.nif ?? "NAO_CONFIGURADO";
    const customerNif = factura.clienteNif ?? "CONSUMIDOR_FINAL";
    const linhas = factura.itens.map((item, indice) => this.montarLinhaFacturaUbl(item, indice + 1, moeda)).join("\n");

    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\" xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\" xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\">",
      `  <cbc:CustomizationID>urn:bizy:e-invoicing:ubl:1</cbc:CustomizationID>`,
      `  <cbc:ProfileID>${this.escapeXml(profileId)}</cbc:ProfileID>`,
      `  <cbc:ID>${this.escapeXml(facturaId)}</cbc:ID>`,
      `  <cbc:IssueDate>${factura.emitidaEm.toISOString().slice(0, 10)}</cbc:IssueDate>`,
      "  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>",
      `  <cbc:Note languageID=\"${this.escapeXml(template.idioma)}\">${this.escapeXml(this.montarNotaFacturaLocalizada(factura, moeda, template))}</cbc:Note>`,
      `  <cbc:DocumentCurrencyCode>${this.escapeXml(moeda)}</cbc:DocumentCurrencyCode>`,
      "  <cac:AccountingSupplierParty>",
      "    <cac:Party>",
      `      <cbc:EndpointID schemeID=\"NIF\">${this.escapeXml(supplierNif)}</cbc:EndpointID>`,
      `      <cac:PartyName><cbc:Name>${this.escapeXml(factura.negocio.nomeComercial)}</cbc:Name></cac:PartyName>`,
      "      <cac:PartyTaxScheme>",
      `        <cbc:CompanyID>${this.escapeXml(supplierNif)}</cbc:CompanyID>`,
      "        <cac:TaxScheme><cbc:ID>IVA</cbc:ID></cac:TaxScheme>",
      "      </cac:PartyTaxScheme>",
      `      <cac:PostalAddress><cbc:StreetName>${this.escapeXml(factura.negocio.endereco ?? "")}</cbc:StreetName></cac:PostalAddress>`,
      "    </cac:Party>",
      "  </cac:AccountingSupplierParty>",
      "  <cac:AccountingCustomerParty>",
      "    <cac:Party>",
      `      <cbc:EndpointID schemeID=\"NIF\">${this.escapeXml(customerNif)}</cbc:EndpointID>`,
      `      <cac:PartyName><cbc:Name>${this.escapeXml(factura.clienteNome)}</cbc:Name></cac:PartyName>`,
      "      <cac:PartyTaxScheme>",
      `        <cbc:CompanyID>${this.escapeXml(customerNif)}</cbc:CompanyID>`,
      "        <cac:TaxScheme><cbc:ID>IVA</cbc:ID></cac:TaxScheme>",
      "      </cac:PartyTaxScheme>",
      `      <cac:PostalAddress><cbc:StreetName>${this.escapeXml(factura.clienteEndereco ?? "")}</cbc:StreetName></cac:PostalAddress>`,
      "    </cac:Party>",
      "  </cac:AccountingCustomerParty>",
      "  <cac:TaxTotal>",
      `    <cbc:TaxAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.ivaValor)}</cbc:TaxAmount>`,
      "    <cac:TaxSubtotal>",
      `      <cbc:TaxableAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.subtotal)}</cbc:TaxableAmount>`,
      `      <cbc:TaxAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.ivaValor)}</cbc:TaxAmount>`,
      "      <cac:TaxCategory>",
      `        <cbc:Percent>${factura.ivaPercentual.toFixed(2)}</cbc:Percent>`,
      "        <cac:TaxScheme><cbc:ID>IVA</cbc:ID></cac:TaxScheme>",
      "      </cac:TaxCategory>",
      "    </cac:TaxSubtotal>",
      "  </cac:TaxTotal>",
      "  <cac:LegalMonetaryTotal>",
      `    <cbc:LineExtensionAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.subtotal)}</cbc:LineExtensionAmount>`,
      `    <cbc:TaxExclusiveAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.subtotal)}</cbc:TaxExclusiveAmount>`,
      `    <cbc:TaxInclusiveAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.total)}</cbc:TaxInclusiveAmount>`,
      `    <cbc:PayableAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(factura.total)}</cbc:PayableAmount>`,
      "  </cac:LegalMonetaryTotal>",
      linhas,
      "</Invoice>"
    ].join("\n");
  }

  private montarLinhaFacturaUbl(
    item: {
      descricao: string;
      quantidade: number;
      precoUnitario: number;
      subtotal: number;
      ivaPercentual: number;
      ivaValor: number;
    },
    indice: number,
    moeda: string
  ) {
    return [
      "  <cac:InvoiceLine>",
      `    <cbc:ID>${indice}</cbc:ID>`,
      `    <cbc:InvoicedQuantity unitCode=\"EA\">${item.quantidade}</cbc:InvoicedQuantity>`,
      `    <cbc:LineExtensionAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(item.subtotal)}</cbc:LineExtensionAmount>`,
      "    <cac:TaxTotal>",
      `      <cbc:TaxAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(item.ivaValor)}</cbc:TaxAmount>`,
      "      <cac:TaxSubtotal>",
      `        <cbc:TaxableAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(item.subtotal)}</cbc:TaxableAmount>`,
      `        <cbc:TaxAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(item.ivaValor)}</cbc:TaxAmount>`,
      "        <cac:TaxCategory>",
      `          <cbc:Percent>${item.ivaPercentual.toFixed(2)}</cbc:Percent>`,
      "          <cac:TaxScheme><cbc:ID>IVA</cbc:ID></cac:TaxScheme>",
      "        </cac:TaxCategory>",
      "      </cac:TaxSubtotal>",
      "    </cac:TaxTotal>",
      "    <cac:Item>",
      `      <cbc:Description>${this.escapeXml(item.descricao)}</cbc:Description>`,
      `      <cbc:Name>${this.escapeXml(item.descricao.slice(0, 80))}</cbc:Name>`,
      "    </cac:Item>",
      "    <cac:Price>",
      `      <cbc:PriceAmount currencyID=\"${this.escapeXml(moeda)}\">${this.formatarValorFiscal(item.precoUnitario)}</cbc:PriceAmount>`,
      "    </cac:Price>",
      "  </cac:InvoiceLine>"
    ].join("\n");
  }

  private escapeXml(valor: string) {
    return valor
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private formatarValorFiscal(valor: number) {
    return valor.toFixed(2);
  }

  private resolverTemplateFactura(opcoes?: OpcoesFacturaEletronica): TemplateFacturaLocalizado {
    const jurisdicao = (opcoes?.jurisdicao ?? "AO").trim().toUpperCase();
    const idioma = this.normalizarIdiomaFactura(opcoes?.idioma);
    const template = TEMPLATES_FACTURA_JURISDICAO.find((item) => item.jurisdicao === jurisdicao) ?? TEMPLATES_FACTURA_JURISDICAO[0];
    const localizado = template.idiomas[idioma as keyof typeof template.idiomas] ?? template.idiomas.pt_AO;
    return { ...localizado, jurisdicao: template.jurisdicao, nome: template.nome };
  }

  private normalizarIdiomaFactura(idioma?: string) {
    return (idioma ?? "pt_AO").trim().replace("-", "_");
  }

  private montarNotaFacturaLocalizada(
    factura: {
      subtotal: number;
      ivaValor: number;
      total: number;
      emitidaEm: Date;
    },
    moeda: string,
    template: TemplateFacturaLocalizado
  ) {
    return [
      template.titulo,
      `${template.dataEmissao}: ${this.formatarDataLocalizada(factura.emitidaEm, template.locale)}`,
      `${template.subtotal}: ${this.formatarMoedaLocalizada(factura.subtotal, moeda, template.locale)}`,
      `${template.imposto}: ${this.formatarMoedaLocalizada(factura.ivaValor, moeda, template.locale)}`,
      `${template.total}: ${this.formatarMoedaLocalizada(factura.total, moeda, template.locale)}`,
      template.rodapeFiscal
    ].join(" | ");
  }

  private formatarDataLocalizada(data: Date, locale: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(data);
  }

  private formatarMoedaLocalizada(valor: number, moeda: string, locale: string) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: moeda,
      maximumFractionDigits: 2
    }).format(valor);
  }
}
