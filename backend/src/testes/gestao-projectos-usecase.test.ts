import { performance } from "node:perf_hooks";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { GestaoFinancasUseCase } from "../use-case/GestaoFinancasUseCase.js";
import { GestaoProjectosUseCase } from "../use-case/GestaoProjectosUseCase.js";

describe("GestaoProjectosUseCase", () => {
  it("isola projectos, projectos comerciais e filas pelo negocio autenticado", async () => {
    const projecto = { findFirst: vi.fn().mockResolvedValue(null) };
    const projetoComercial = { findFirst: vi.fn().mockResolvedValue(null) };
    const filaProjeto = { findFirst: vi.fn().mockResolvedValue(null) };
    const useCase = new GestaoProjectosUseCase({ projecto, projetoComercial, filaProjeto } as unknown as PrismaClient);

    await expect(useCase.projectoPertenceAoNegocio("projecto-b", "negocio-a")).resolves.toBe(false);
    await expect(useCase.projetoComercialPertenceAoNegocio("comercial-b", "negocio-a")).resolves.toBe(false);
    await expect(useCase.itemFilaPertenceAoNegocio("fila-b", "negocio-a")).resolves.toBe(false);

    expect(projecto.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "projecto-b", negocioId: "negocio-a" } }));
    expect(projetoComercial.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "comercial-b", negocioId: "negocio-a" } }));
    expect(filaProjeto.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "fila-b", projetoComercial: { negocioId: "negocio-a" } } }));
  });

  it("RNF-T008: lista 200 projectos activos com filtro indexável e paginação explícita", async () => {
    const projetosActivos = Array.from({ length: 200 }, (_, indice) => ({
      id: `projecto-${indice + 1}`,
      negocioId: "negocio-1",
      estado: "ATIVO",
      entregas: [],
      membrosProjecto: []
    }));
    const projecto = {
      findMany: vi.fn().mockResolvedValue(projetosActivos)
    };
    const prisma = { projecto } as unknown as PrismaClient;
    const useCase = new GestaoProjectosUseCase(prisma);

    const inicio = performance.now();
    const resultado = await useCase.listarProjectos("negocio-1", { estado: "ATIVO", limite: 200 });
    const duracaoMs = performance.now() - inicio;

    expect(resultado).toHaveLength(200);
    expect(duracaoMs).toBeLessThan(2_000);
    expect(projecto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { negocioId: "negocio-1", estado: "ATIVO" },
        orderBy: { criadoEm: "desc" },
        take: 200
      })
    );
  });

  it("RF-T125/RF-T129: monta War Room com placar ao vivo de vendas, reservas e stock", async () => {
    const projetoComercial = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "projeto-live-1",
        negocioId: "negocio-1",
        nome: "Live de Lançamento",
        tipo: "LIVE",
        estado: "EM_ANDAMENTO",
        dataInicio: new Date(Date.now() - 60_000),
        dataFim: new Date(Date.now() + 60_000)
      })
    };
    const pedido = {
      aggregate: vi.fn()
        .mockResolvedValueOnce({ _count: 8, _sum: { totalEmKwanza: 240_000 } })
        .mockResolvedValueOnce({ _count: 5, _sum: { totalEmKwanza: 180_000 } })
    };
    const reserva = {
      count: vi.fn().mockResolvedValue(6)
    };
    const poolStockProjeto = {
      findMany: vi.fn().mockResolvedValue([
        { quantidadeReservada: 10, quantidadeVendida: 4, pausado: false },
        { quantidadeReservada: 5, quantidadeVendida: 1, pausado: true }
      ])
    };
    const filaProjeto = {
      findMany: vi.fn().mockResolvedValue([
        { estado: "PENDENTE", atribuidoAId: null },
        { estado: "ATRIBUIDO", atribuidoAId: "membro-1" },
        { estado: "CONCLUIDO", atribuidoAId: "membro-2" }
      ])
    };
    const equipaProjeto = {
      findMany: vi.fn().mockResolvedValue([
        { membroId: "membro-1", papelProjeto: "SUPORTE_VENDAS" },
        { membroId: "membro-2", papelProjeto: "LOGISTICA" }
      ])
    };
    const prisma = { projetoComercial, pedido, reserva, poolStockProjeto, filaProjeto, equipaProjeto } as unknown as PrismaClient;
    const useCase = new GestaoProjectosUseCase(prisma);

    const warRoom = await useCase.obterWarRoom("projeto-live-1");

    expect(warRoom).toEqual(
      expect.objectContaining({
        projetoComercialId: "projeto-live-1",
        nome: "Live de Lançamento",
        ativoAgora: true,
        placar: {
          vendasFechadas: 5,
          receitaFechada: 180_000,
          reservasConfirmadas: 6,
          stockConsumido: 5
        },
        stock: expect.objectContaining({
          reservado: 15,
          vendido: 5,
          disponivel: 10,
          pausados: 1,
          taxaConsumo: 33
        }),
        fila: { total: 3, pendentes: 1, atribuidos: 1, concluidos: 1 },
        equipa: { total: 2, porPapel: { SUPORTE_VENDAS: 1, LOGISTICA: 1 } }
      })
    );
  });

  it("RN-T042: etiqueta pedidos, reservas e movimentos sem alterar estado operacional da reserva", async () => {
    const projetoComercial = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "abcd1234-projeto",
        negocioId: "negocio-1",
        nome: "Live Julho",
        dataInicio: new Date("2026-07-01T08:00:00.000Z"),
        dataFim: new Date("2026-07-01T20:00:00.000Z")
      })
    };
    const pedido = {
      updateMany: vi.fn().mockResolvedValue({ count: 2 })
    };
    const reserva = {
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    };
    const movimentoFinanceiro = {
      findMany: vi.fn().mockResolvedValue([
        { id: "movimento-1", observacao: "Entrada conciliada" },
        { id: "movimento-2", observacao: null }
      ]),
      update: vi.fn((args) => Promise.resolve(args))
    };
    const prisma = {
      projetoComercial,
      pedido,
      reserva,
      movimentoFinanceiro,
      $transaction: vi.fn((operacoes: Array<Promise<unknown>>) => Promise.all(operacoes))
    } as unknown as PrismaClient;
    const useCase = new GestaoProjectosUseCase(prisma);

    const resultado = await useCase.etiquetarTransacoesProjeto("abcd1234-projeto");

    expect(resultado).toEqual({
      tag: "PROJETO_ABCD1234",
      projetoComercialId: "abcd1234-projeto",
      projetoNome: "Live Julho",
      pedidosEtiquetados: 2,
      reservasEtiquetadas: 1,
      movimentosEtiquetados: 2
    });
    expect(reserva.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          negocioId: "negocio-1",
          estado: { not: "CANCELADA" },
          NOT: { origem: { contains: "PROJETO_" } }
        }),
        data: { origem: "PROJETO_ABCD1234" }
      })
    );
    expect(reserva.updateMany.mock.calls[0][0].data).not.toHaveProperty("estado");
    expect(movimentoFinanceiro.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: "movimento-1" },
        data: { observacao: "Entrada conciliada | PROJETO_ABCD1234" }
      })
    );
    expect(movimentoFinanceiro.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "movimento-2" },
        data: { observacao: "PROJETO_ABCD1234" }
      })
    );
  });

  it("RF-T088: alerta quando despesas financeiras vinculadas excedem o orçamento do projecto", async () => {
    const projecto = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "projecto-1",
          nome: "Lançamento Julho",
          orcamento: 100_000,
          dataInicio: null,
          dataFim: null,
          entregas: [{ id: "entrega-1", estado: "CONCLUIDA", dataLimite: null }]
        }
      ])
    };
    const movimentoFinanceiro = {
      groupBy: vi.fn().mockResolvedValue([
        {
          origemId: "projecto-1",
          _sum: { valor: 125_000 }
        }
      ])
    };
    const prisma = { projecto, movimentoFinanceiro } as unknown as PrismaClient;
    const useCase = new GestaoProjectosUseCase(prisma);

    const resultado = await useCase.alertarProjectosEmRisco("negocio-1");

    expect(resultado.total).toBe(1);
    expect(resultado.atencao).toBe(1);
    expect(resultado.alertas[0]).toEqual(
      expect.objectContaining({
        projectoId: "projecto-1",
        nome: "Lançamento Julho",
        severidade: "ATENCAO",
        motivos: ["Orçamento excedido em 25% (125000/100000 Kz)"],
        progresso: 100
      })
    );
    expect(movimentoFinanceiro.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          negocioId: "negocio-1",
          tipo: "SAIDA",
          origemTipo: { in: ["PROJECTO", "PROJETO"] },
          origemId: { in: ["projecto-1"] }
        })
      })
    );
  });

  it("RF-T140-T145: consolida portfólio e regista mudança relevante com evento versionado", async () => {
    const base = {
      id: "projecto-1", negocioId: "negocio-1", nome: "Expansão Market", estado: "EM_ANDAMENTO",
      prioridade: "ALTA", nivelRisco: "ALTO", capacidadeConsumida: 40, roiEsperado: 180_000,
      stakeholdersJson: '["Dono","Operação"]', criteriosSucessoJson: '["Entregar no prazo"]', dependenciasJson: "[]",
      riscosJson: '[{"id":"risco-1","estado":"ABERTO"}]', mudancasJson: "[]", eventosJson: "[]",
      entregas: [{ id: "e-1", estado: "CONCLUIDA" }, { id: "e-2", estado: "PENDENTE" }], membrosProjecto: []
    };
    const projecto = {
      findMany: vi.fn().mockResolvedValue([base]),
      findFirst: vi.fn().mockResolvedValue(base),
      update: vi.fn()
        .mockImplementationOnce(({ data }) => Promise.resolve({ ...base, ...data }))
        .mockImplementationOnce(({ data }) => Promise.resolve({ ...base, ...data }))
    };
    const useCase = new GestaoProjectosUseCase({ projecto } as unknown as PrismaClient);

    const portfolio = await useCase.obterPortfolio("negocio-1", { limite: 200 });
    expect(portfolio.metricas).toEqual(expect.objectContaining({ total: 1, emRisco: 1, capacidadeConsumida: 40, roiEsperado: 180_000 }));
    expect(portfolio.itens[0]).toEqual(expect.objectContaining({ progressoPercentual: 50, bloqueios: 1, stakeholders: ["Dono", "Operação"] }));

    const mudanca = await useCase.registarMudancaProjecto("projecto-1", "negocio-1", "actor-1", {
      motivo: "Risco operacional confirmado", impacto: "Prazo revisto em uma semana", aprovadoPorId: "owner-1",
      alteracoes: { prioridade: "CRITICA", nivelRisco: "CRITICO" }
    });
    expect(mudanca.mudanca).toEqual(expect.objectContaining({ actorId: "actor-1", aprovadoPorId: "owner-1" }));
    expect(projecto.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventosJson: expect.stringContaining("TEAM_PROJECT_CHANGED") }) }));
  });
});

describe("GestaoFinancasUseCase", () => {
  it("RN-T001: permite classificar saída financeira como despesa de projecto", async () => {
    const movimentoFinanceiro = {
      create: vi.fn().mockResolvedValue({
        id: "movimento-1",
        negocioId: "negocio-1",
        tipo: "SAIDA",
        valor: 25_000,
        origemTipo: "PROJECTO",
        origemId: "projecto-1"
      })
    };
    const prisma = { movimentoFinanceiro } as unknown as PrismaClient;
    const useCase = new GestaoFinancasUseCase(prisma);

    const movimento = await useCase.registarMovimento("negocio-1", {
      tipo: "SAIDA",
      descricao: "Custo de activação do projecto",
      valor: 25_000,
      origemTipo: "PROJECTO",
      origemId: "projecto-1"
    });

    expect(movimento).toEqual(expect.objectContaining({ origemTipo: "PROJECTO", origemId: "projecto-1" }));
    expect(movimentoFinanceiro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negocioId: "negocio-1",
          tipo: "SAIDA",
          origemTipo: "PROJECTO",
          origemId: "projecto-1"
        })
      })
    );
  });
});
