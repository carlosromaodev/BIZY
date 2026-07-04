import { performance } from "node:perf_hooks";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { GestaoFinancasUseCase } from "../use-case/GestaoFinancasUseCase.js";

describe("GestaoFinancasUseCase - Reconciliação bancária", () => {
  it("RF-T043/RF-T044: importa CSV e grava sugestões de correspondência", async () => {
    const importacaoExtratoBancario = {
      create: vi.fn().mockResolvedValue({
        id: "importacao-1",
        negocioId: "negocio-1",
        nomeArquivo: "extracto.csv",
        formato: "CSV",
        totalLinhas: 1
      })
    };
    const movimentoBancario = {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "banco-1",
          estadoConciliacao: "PENDENTE",
          sugestoesJson: JSON.stringify([{ movimentoFinanceiroId: "mov-1", pontuacao: 100 }])
        }
      ])
    };
    const movimentoFinanceiro = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "mov-1",
          descricao: "Factura FT0001",
          valor: 15000,
          tipo: "ENTRADA",
          dataMovimento: new Date("2026-07-01T00:00:00.000Z"),
          origemTipo: "FACTURA",
          origemId: "factura-1"
        }
      ])
    };
    const prisma = {
      importacaoExtratoBancario,
      movimentoBancario,
      movimentoFinanceiro,
      $transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => callback({ importacaoExtratoBancario, movimentoBancario }))
    } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const resultado = await useCase.importarExtratoBancario("negocio-1", {
      nomeArquivo: "extracto.csv",
      formato: "CSV",
      conteudo: "data,descricao,valor,tipo,referencia\n2026-07-01,Factura FT0001,15000,CREDITO,FT0001",
      criadoPorId: "usuario-1"
    });

    expect(resultado.total).toBe(1);
    expect(resultado.comSugestoes).toBe(1);
    expect(movimentoFinanceiro.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          negocioId: "negocio-1",
          tipo: "ENTRADA",
          valor: { in: [15000] },
          reconciliado: false
        })
      })
    );
    expect(movimentoBancario.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            negocioId: "negocio-1",
            importacaoId: "importacao-1",
            descricao: "Factura FT0001",
            valor: 15000,
            tipo: "CREDITO",
            referencia: "FT0001"
          })
        ]
      })
    );
  });

  it("RNF-T005: processa CSV de 10.000 linhas com sugestões em lote", async () => {
    const totalLinhas = 10_000;
    const linhasCsv = Array.from({ length: totalLinhas }, (_, indice) => {
      const dia = String((indice % 28) + 1).padStart(2, "0");
      return `2026-07-${dia},Movimento ${indice + 1},${indice + 1},CREDITO,REF-${indice + 1}`;
    });
    const movimentosCriados = linhasCsv.map((_, indice) => ({
      id: `banco-${indice + 1}`,
      estadoConciliacao: "PENDENTE",
      sugestoesJson: "[]"
    }));
    const importacaoExtratoBancario = {
      create: vi.fn().mockResolvedValue({
        id: "importacao-10k",
        negocioId: "negocio-1",
        nomeArquivo: "extracto-10k.csv",
        formato: "CSV",
        totalLinhas
      })
    };
    const movimentoBancario = {
      createMany: vi.fn().mockResolvedValue({ count: totalLinhas }),
      findMany: vi.fn().mockResolvedValue(movimentosCriados)
    };
    const movimentoFinanceiro = {
      findMany: vi.fn().mockResolvedValue([])
    };
    const prisma = {
      importacaoExtratoBancario,
      movimentoBancario,
      movimentoFinanceiro,
      $transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => callback({ importacaoExtratoBancario, movimentoBancario }))
    } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const inicio = performance.now();
    const resultado = await useCase.importarExtratoBancario("negocio-1", {
      nomeArquivo: "extracto-10k.csv",
      formato: "CSV",
      conteudo: ["data,descricao,valor,tipo,referencia", ...linhasCsv].join("\n")
    });
    const duracaoMs = performance.now() - inicio;

    expect(resultado.total).toBe(totalLinhas);
    expect(duracaoMs).toBeLessThan(30_000);
    expect(movimentoBancario.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ descricao: "Movimento 1", valor: 1, tipo: "CREDITO" }),
          expect.objectContaining({ descricao: "Movimento 10000", valor: 10000, tipo: "CREDITO" })
        ])
      })
    );
    expect(movimentoBancario.createMany.mock.calls[0][0].data).toHaveLength(totalLinhas);
    expect(movimentoFinanceiro.findMany).toHaveBeenCalledTimes(10);
    expect(movimentoFinanceiro.findMany.mock.calls[0][0].where.valor.in).toHaveLength(1000);
  });

  it("RF-T045: marca movimento bancário e movimento financeiro como reconciliados", async () => {
    const movimentoBancario = {
      findFirst: vi.fn().mockResolvedValue({
        id: "banco-1",
        negocioId: "negocio-1",
        estadoConciliacao: "PENDENTE",
        tipo: "DEBITO",
        valor: 5000
      }),
      update: vi.fn().mockResolvedValue({ id: "banco-1", estadoConciliacao: "CONCILIADO" })
    };
    const movimentoFinanceiro = {
      findFirst: vi.fn().mockResolvedValue({
        id: "mov-1",
        negocioId: "negocio-1",
        tipo: "SAIDA",
        valor: 5000,
        reconciliado: false
      }),
      update: vi.fn().mockResolvedValue({ id: "mov-1", reconciliado: true })
    };
    const prisma = {
      movimentoBancario,
      movimentoFinanceiro,
      $transaction: vi.fn((operacoes: Array<Promise<unknown>>) => Promise.all(operacoes))
    } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const resultado = await useCase.conciliarMovimentoBancario("negocio-1", "banco-1", "mov-1");

    expect(resultado.movimentoBancario).toEqual(expect.objectContaining({ estadoConciliacao: "CONCILIADO" }));
    expect(resultado.movimentoFinanceiro).toEqual(expect.objectContaining({ reconciliado: true }));
    expect(movimentoBancario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "banco-1" },
        data: expect.objectContaining({
          estadoConciliacao: "CONCILIADO",
          movimentoFinanceiroId: "mov-1"
        })
      })
    );
    expect(movimentoFinanceiro.update).toHaveBeenCalledWith({
      where: { id: "mov-1" },
      data: { reconciliado: true }
    });
  });

  it("RNF-T027/RN-T007: converte movimento multi-moeda com taxa de câmbio explícita", async () => {
    const negocio = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ moeda: "AOA" })
    };
    const movimentoFinanceiro = {
      create: vi.fn().mockResolvedValue({
        id: "mov-cambio",
        valor: 830_000,
        observacao: "Fornecedor externo | Câmbio: {}"
      })
    };
    const prisma = { negocio, movimentoFinanceiro } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const movimento = await useCase.registarMovimentoMultiMoeda("negocio-1", {
      tipo: "SAIDA",
      descricao: "Fornecedor externo",
      valor: 830_000,
      origemTipo: "FORNECEDOR",
      moedaOriginal: "USD",
      valorOriginal: 1_000,
      taxaCambio: 830,
      observacao: "Fornecedor externo"
    });

    expect(movimento).toEqual(expect.objectContaining({ id: "mov-cambio" }));
    expect(movimentoFinanceiro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valor: 830_000,
          observacao: expect.stringContaining('"moedaOriginal":"USD"')
        })
      })
    );
  });
});
