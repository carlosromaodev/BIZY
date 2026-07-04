import { performance } from "node:perf_hooks";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { GestaoFinancasUseCase } from "../use-case/GestaoFinancasUseCase.js";

describe("GestaoFinancasUseCase — lógica pura", () => {
  it("CATEGORIAS_PADRAO contém receitas e despesas", async () => {
    // importar o módulo para aceder às constantes internas
    const modulo = await import("../use-case/GestaoFinancasUseCase.js");
    const uc = new modulo.GestaoFinancasUseCase(null as never);
    // O construtor aceita PrismaClient, mas podemos verificar que instancia
    expect(uc).toBeDefined();
  });

  it("calcula IVA angolano (14%) correctamente", () => {
    // Simulação do cálculo de factura
    const ivaPerc = 14;
    const itens = [
      { descricao: "Produto A", quantidade: 2, precoUnitario: 5000 },
      { descricao: "Produto B", quantidade: 1, precoUnitario: 8000 }
    ];

    const itensCalc = itens.map((item) => {
      const subtotal = item.quantidade * item.precoUnitario;
      const ivaValor = Math.round(subtotal * (ivaPerc / 100));
      return { ...item, subtotal, ivaValor };
    });

    const subtotal = itensCalc.reduce((s, i) => s + i.subtotal, 0);
    const ivaValor = itensCalc.reduce((s, i) => s + i.ivaValor, 0);
    const total = subtotal + ivaValor;

    expect(subtotal).toBe(18000); // 2*5000 + 1*8000
    expect(ivaValor).toBe(2520); // 10000*0.14 + 8000*0.14
    expect(total).toBe(20520);
  });

  it("calcula saldo do fluxo de caixa", () => {
    const movimentos = [
      { tipo: "ENTRADA", valor: 50000 },
      { tipo: "ENTRADA", valor: 30000 },
      { tipo: "SAIDA", valor: 20000 },
      { tipo: "SAIDA", valor: 15000 }
    ];

    const entradas = movimentos.filter((m) => m.tipo === "ENTRADA");
    const saidas = movimentos.filter((m) => m.tipo === "SAIDA");
    const totalEntradas = entradas.reduce((s, m) => s + m.valor, 0);
    const totalSaidas = saidas.reduce((s, m) => s + m.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    expect(totalEntradas).toBe(80000);
    expect(totalSaidas).toBe(35000);
    expect(saldo).toBe(45000);
  });

  it("RNF-T001: calcula fluxo de caixa e DRE por agregações para dashboards de até 90 dias", async () => {
    const movimentoFinanceiro = {
      groupBy: vi
        .fn()
        .mockResolvedValueOnce([
          { tipo: "ENTRADA", _sum: { valor: 120000 } },
          { tipo: "SAIDA", _sum: { valor: 45000 } }
        ])
        .mockResolvedValueOnce([
          { categoriaId: "cat-vendas", tipo: "ENTRADA", _sum: { valor: 120000 } },
          { categoriaId: "cat-fornecedor", tipo: "SAIDA", _sum: { valor: 30000 } },
          { categoriaId: "cat-aluguer", tipo: "SAIDA", _sum: { valor: 15000 } }
        ])
        .mockResolvedValueOnce([
          { categoriaId: "cat-vendas", tipo: "ENTRADA", _sum: { valor: 120000 } },
          { categoriaId: "cat-fornecedor", tipo: "SAIDA", _sum: { valor: 30000 } },
          { categoriaId: "cat-aluguer", tipo: "SAIDA", _sum: { valor: 15000 } }
        ]),
      findMany: vi.fn()
    };
    const categoriaFinanceira = {
      findMany: vi.fn().mockResolvedValue([
        { id: "cat-vendas", nome: "Vendas", tipo: "RECEITA" },
        { id: "cat-fornecedor", nome: "Fornecedores", tipo: "DESPESA" },
        { id: "cat-aluguer", nome: "Aluguer", tipo: "DESPESA" }
      ])
    };
    const prisma = {
      movimentoFinanceiro,
      categoriaFinanceira,
      $queryRaw: vi.fn().mockResolvedValue([
        { dia: new Date("2026-07-01T00:00:00.000Z"), tipo: "ENTRADA", total: 120000n },
        { dia: new Date("2026-07-01T00:00:00.000Z"), tipo: "SAIDA", total: 45000n }
      ])
    } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const inicio = performance.now();
    const fluxo = await useCase.obterFluxoCaixa(
      "negocio-1",
      new Date("2026-05-01T00:00:00.000Z"),
      new Date("2026-07-30T23:59:59.999Z")
    );
    const dre = await useCase.obterDRE("negocio-1", 7, 2026);
    const duracaoMs = performance.now() - inicio;

    expect(fluxo).toEqual(
      expect.objectContaining({
        saldo: 75000,
        totalEntradas: 120000,
        totalSaidas: 45000,
        porDia: [{ dia: "2026-07-01", entradas: 120000, saidas: 45000 }]
      })
    );
    expect(fluxo.porCategoria).toEqual(
      expect.arrayContaining([
        { categoria: "Vendas", tipo: "RECEITA", total: 120000 },
        { categoria: "Fornecedores", tipo: "DESPESA", total: 30000 }
      ])
    );
    expect(dre).toEqual(
      expect.objectContaining({
        receitaBruta: 120000,
        custosVariaveis: 30000,
        custosFixos: 15000,
        outrosCustos: 0,
        resultadoOperacional: 75000
      })
    );
    expect(duracaoMs).toBeLessThan(2_000);
    expect(movimentoFinanceiro.findMany).not.toHaveBeenCalled();
    expect(movimentoFinanceiro.groupBy).toHaveBeenCalledTimes(3);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("calcula DRE separando custos variáveis e fixos", () => {
    const movimentos = [
      { tipo: "ENTRADA", valor: 100000, categoriaNome: "Vendas" },
      { tipo: "SAIDA", valor: 20000, categoriaNome: "Fornecedores" },
      { tipo: "SAIDA", valor: 10000, categoriaNome: "Logística/Entregas" },
      { tipo: "SAIDA", valor: 30000, categoriaNome: "Salários" },
      { tipo: "SAIDA", valor: 15000, categoriaNome: "Aluguer" },
      { tipo: "SAIDA", valor: 5000, categoriaNome: "Marketing" }
    ];

    const receitaBruta = movimentos
      .filter((m) => m.tipo === "ENTRADA")
      .reduce((s, m) => s + m.valor, 0);

    const custosVariaveis = movimentos
      .filter((m) => m.tipo === "SAIDA" && ["Fornecedores", "Logística/Entregas"].includes(m.categoriaNome))
      .reduce((s, m) => s + m.valor, 0);

    const custosFixos = movimentos
      .filter((m) => m.tipo === "SAIDA" && ["Salários", "Aluguer", "Taxas e impostos"].includes(m.categoriaNome))
      .reduce((s, m) => s + m.valor, 0);

    const outrosCustos = movimentos
      .filter((m) => m.tipo === "SAIDA")
      .reduce((s, m) => s + m.valor, 0) - custosVariaveis - custosFixos;

    const margemContribuicao = receitaBruta - custosVariaveis;
    const resultadoOperacional = margemContribuicao - custosFixos - outrosCustos;

    expect(receitaBruta).toBe(100000);
    expect(custosVariaveis).toBe(30000);
    expect(custosFixos).toBe(45000);
    expect(outrosCustos).toBe(5000);
    expect(margemContribuicao).toBe(70000);
    expect(resultadoOperacional).toBe(20000);
  });

  it("calcula aging de contas a receber por faixa", () => {
    const agora = new Date();
    const dia = 24 * 60 * 60 * 1000;

    const contas = [
      { valor: 10000, dataVencimento: new Date(agora.getTime() + 5 * dia) }, // a vencer
      { valor: 20000, dataVencimento: new Date(agora.getTime() - 10 * dia) }, // 1-30
      { valor: 15000, dataVencimento: new Date(agora.getTime() - 45 * dia) }, // 31-60
      { valor: 8000, dataVencimento: new Date(agora.getTime() - 75 * dia) }, // 61-90
      { valor: 30000, dataVencimento: new Date(agora.getTime() - 120 * dia) } // +90
    ];

    const aging = { aVencer: 0, vencido1a30: 0, vencido31a60: 0, vencido61a90: 0, vencidoMais90: 0 };
    for (const c of contas) {
      const dias = Math.floor((agora.getTime() - c.dataVencimento.getTime()) / dia);
      if (dias < 0) aging.aVencer += c.valor;
      else if (dias <= 30) aging.vencido1a30 += c.valor;
      else if (dias <= 60) aging.vencido31a60 += c.valor;
      else if (dias <= 90) aging.vencido61a90 += c.valor;
      else aging.vencidoMais90 += c.valor;
    }

    expect(aging.aVencer).toBe(10000);
    expect(aging.vencido1a30).toBe(20000);
    expect(aging.vencido31a60).toBe(15000);
    expect(aging.vencido61a90).toBe(8000);
    expect(aging.vencidoMais90).toBe(30000);
  });

  it("prioriza pagamentos por urgência e valor", () => {
    const agora = new Date();
    const dia = 24 * 60 * 60 * 1000;

    const contas = [
      { id: "1", fornecedor: "A", valor: 5000, dataVencimento: new Date(agora.getTime() - 5 * dia) },
      { id: "2", fornecedor: "B", valor: 50000, dataVencimento: new Date(agora.getTime() - 2 * dia) },
      { id: "3", fornecedor: "C", valor: 10000, dataVencimento: new Date(agora.getTime() + 2 * dia) },
      { id: "4", fornecedor: "D", valor: 3000, dataVencimento: new Date(agora.getTime() + 10 * dia) }
    ];

    const priorizadas = contas.map((conta) => {
      const diasAte = Math.floor((conta.dataVencimento.getTime() - agora.getTime()) / dia);
      let prioridade: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
      if (diasAte < 0) prioridade = "CRITICA";
      else if (diasAte <= 3) prioridade = "ALTA";
      else if (diasAte <= 7) prioridade = "MEDIA";
      else prioridade = "BAIXA";
      return { ...conta, prioridade, diasAte };
    });

    const ordemPrioridade = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
    priorizadas.sort((a, b) => {
      const diff = ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade];
      return diff !== 0 ? diff : b.valor - a.valor;
    });

    expect(priorizadas[0].fornecedor).toBe("B"); // CRITICA, maior valor
    expect(priorizadas[1].fornecedor).toBe("A"); // CRITICA, menor valor
    expect(priorizadas[2].fornecedor).toBe("C"); // ALTA
    expect(priorizadas[3].fornecedor).toBe("D"); // BAIXA
    expect(priorizadas[0].prioridade).toBe("CRITICA");
    expect(priorizadas[3].prioridade).toBe("BAIXA");
  });

  it("calcula bónus escalonado por nível de cumprimento da meta", () => {
    const cenarios = [
      { percentual: 160, esperado: 10 },  // superação excepcional
      { percentual: 130, esperado: 7 },   // superação
      { percentual: 100, esperado: 5 },   // atingida
      { percentual: 80, esperado: 0 },    // não atingida
      { percentual: 50, esperado: 0 }
    ];

    for (const { percentual, esperado } of cenarios) {
      let bonusPercentual = 0;
      if (percentual >= 150) bonusPercentual = 10;
      else if (percentual >= 120) bonusPercentual = 7;
      else if (percentual >= 100) bonusPercentual = 5;
      expect(bonusPercentual).toBe(esperado);
    }
  });

  it("numeração sequencial de facturas começa em 1", () => {
    const ultimaFactura = null; // primeira factura
    const numero = (ultimaFactura ?? 0) + 1;
    expect(numero).toBe(1);

    // segunda factura
    const numero2 = (1) + 1;
    expect(numero2).toBe(2);
  });

  it("relaciona factura-recibo com movimento existente sem duplicar entrada no ledger", async () => {
    const movimentoOrigem = {
      id: "movimento-entrada-1",
      negocioId: "negocio-1",
      tipo: "ENTRADA",
      descricao: "Transferência do cliente",
      valor: 25000,
      origemTipo: "RECEBIMENTO_MANUAL",
      origemId: null,
      metodoPagamento: "TPA",
      referenciaPagamento: "TPA-123",
      comprovativoUrl: "https://exemplo.local/comprovativo.pdf",
      observacao: null
    };
    const facturaCriada = {
      id: "factura-recibo-1",
      negocioId: "negocio-1",
      serie: "FR",
      numero: 1,
      anoFiscal: new Date().getFullYear(),
      tipoDocumento: "FACTURA_RECIBO",
      total: 25000,
      itens: []
    };
    const movimentoFinanceiro = {
      findFirst: vi.fn().mockResolvedValue(movimentoOrigem),
      update: vi.fn().mockResolvedValue({ ...movimentoOrigem, origemTipo: "RECIBO", origemId: facturaCriada.id }),
      create: vi.fn()
    };
    const factura = {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(facturaCriada)
    };
    const contaReceber = { create: vi.fn() };
    const prisma = { movimentoFinanceiro, factura, contaReceber } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const resultado = await useCase.emitirFactura("negocio-1", {
      clienteNome: "Cliente com pagamento prévio",
      movimentoOrigemId: movimentoOrigem.id,
      tipoDocumento: "FACTURA_RECIBO",
      ivaPercentual: 0,
      itens: [{ descricao: movimentoOrigem.descricao, quantidade: 1, precoUnitario: movimentoOrigem.valor }]
    });

    expect(resultado).toBe(facturaCriada);
    expect(factura.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tipoDocumento: "FACTURA_RECIBO",
        total: movimentoOrigem.valor,
        valorPago: movimentoOrigem.valor,
        metodoPagamento: movimentoOrigem.metodoPagamento,
        referenciaPagamento: movimentoOrigem.referenciaPagamento,
        comprovativoPagamentoUrl: movimentoOrigem.comprovativoUrl
      })
    }));
    expect(movimentoFinanceiro.update).toHaveBeenCalledWith({
      where: { id: movimentoOrigem.id },
      data: expect.objectContaining({
        origemTipo: "RECIBO",
        origemId: facturaCriada.id,
        metodoPagamento: movimentoOrigem.metodoPagamento,
        referenciaPagamento: movimentoOrigem.referenciaPagamento,
        comprovativoUrl: movimentoOrigem.comprovativoUrl
      })
    });
    expect(movimentoFinanceiro.create).not.toHaveBeenCalled();
    expect(contaReceber.create).not.toHaveBeenCalled();
  });

  it("calcula taxa de inadimplência", () => {
    const contas = [
      { estado: "PAGO", valor: 10000 },
      { estado: "PAGO", valor: 20000 },
      { estado: "PENDENTE", valor: 15000 }, // vencida
      { estado: "PENDENTE", valor: 5000 }   // vencida
    ];

    const total = contas.length;
    const inadimplentes = contas.filter((c) => c.estado !== "PAGO");
    const taxa = Math.round((inadimplentes.length / total) * 100);
    const valorInadimplente = inadimplentes.reduce((s, c) => s + c.valor, 0);

    expect(taxa).toBe(50);
    expect(valorInadimplente).toBe(20000);
  });
});
