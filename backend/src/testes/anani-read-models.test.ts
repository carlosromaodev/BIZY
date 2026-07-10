import { describe, expect, it, vi } from "vitest";
import { bootstrapAnani } from "../app/bootstrap/bootstrapAnani.js";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";

describe("Anani read models", () => {
  it("consolida TeamHealth, MarketSnapshot e SecuritySnapshot a partir do Prisma", async () => {
    const prisma = criarPrismaFake();
    const anani = bootstrapAnani(prisma as never, new DespachadorEventos(), { info: vi.fn(), warn: vi.fn() } as never);

    const resumo = await anani.readModels.obter();

    expect(resumo.teamHealth).toEqual(
      expect.objectContaining({
        negociosMonitorados: 2,
        tarefasAbertas: 4,
        tarefasCriticas: 1,
        conversasAbertas: 8,
        pedidosPendentes: 3,
        riscoMedio: 0.5,
        trustMedio: 0.74,
        sinais: expect.arrayContaining(["tarefas_criticas_abertas", "pagamentos_pendentes"])
      })
    );
    expect(resumo.teamHealth.negociosEmAtencao[0]).toEqual(
      expect.objectContaining({ negocioId: "neg-1", nomeComercial: "Loja A", riskScore: 0.7 })
    );
    expect(resumo.marketSnapshot).toEqual(
      expect.objectContaining({
        lojasPublicadas: 2,
        produtosAtivos: 10,
        produtosSemStock: 3,
        pedidos30d: 6,
        receita30dEmKwanza: 15000,
        sinais: expect.arrayContaining(["produtos_sem_stock"])
      })
    );
    expect(resumo.securitySnapshot).toEqual(
      expect.objectContaining({
        incidentesAbertos: 2,
        incidentesCriticos: 1,
        quarentenasAbertas: 1,
        quarentenasCriticas: 1,
        eventosPendentes: 7,
        eventosFalhados: 2,
        sinais: expect.arrayContaining(["incidentes_criticos_abertos", "eventos_outbox_falhados"])
      })
    );
  });

  it("projecta read models e reutiliza a projeção durável mais recente", async () => {
    const prisma = criarPrismaFake();
    const anani = bootstrapAnani(prisma as never, new DespachadorEventos(), { info: vi.fn(), warn: vi.fn() } as never);

    const projetado = await anani.projectors.projectarReadModels();

    expect(projetado.teamHealth.tarefasAbertas).toBe(4);
    expect(prisma.eventOutbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "ANANI_READ_MODELS_PROJECTED",
          sistema: "ANANI",
          contexto: "anani-read-models",
          status: "PROCESSED",
          payload: expect.objectContaining({
            teamHealth: expect.objectContaining({ tarefasAbertas: 4 }),
            marketSnapshot: expect.objectContaining({ lojasPublicadas: 2 }),
            securitySnapshot: expect.objectContaining({ incidentesAbertos: 2 })
          })
        })
      })
    );

    prisma.eventOutbox.findFirst.mockResolvedValueOnce({
      payload: {
        atualizadoEm: "2026-07-10T14:00:00.000Z",
        teamHealth: {
          negociosMonitorados: 1,
          tarefasAbertas: 99,
          tarefasCriticas: 0,
          conversasAbertas: 1,
          pedidosPendentes: 0,
          riscoMedio: 0.1,
          trustMedio: 0.95,
          negociosEmAtencao: [
            { negocioId: "neg-projetado", nomeComercial: "Loja Projetada", riskScore: 0.1, trustScore: 0.95, criadoEm: "2026-07-10T13:59:00.000Z" }
          ],
          sinais: ["operacao_team_estavel"]
        },
        marketSnapshot: {
          lojasPublicadas: 3,
          produtosAtivos: 12,
          produtosSemStock: 0,
          pedidos30d: 7,
          receita30dEmKwanza: 20000,
          negociosMonitorados: 1,
          riscoMedio: 0.1,
          trustMedio: 0.95,
          negociosEmAtencao: [],
          sinais: ["market_estavel"]
        },
        securitySnapshot: {
          incidentesAbertos: 0,
          incidentesCriticos: 0,
          quarentenasAbertas: 0,
          quarentenasCriticas: 0,
          eventosPendentes: 0,
          eventosFalhados: 0,
          ultimoIncidenteEm: null,
          sinais: ["seguranca_estavel"]
        }
      }
    });

    const reutilizado = await anani.readModels.obter();

    expect(reutilizado.teamHealth.tarefasAbertas).toBe(99);
    expect(reutilizado.teamHealth.negociosEmAtencao[0].criadoEm).toBeInstanceOf(Date);
  });
});

function criarPrismaFake() {
  return {
    tarefaOperacional: {
      count: vi.fn(async (args?: { where?: { prioridade?: unknown } }) => args?.where?.prioridade ? 1 : 4)
    },
    conversaAtendimento: {
      count: vi.fn(async () => 8)
    },
    pedido: {
      count: vi.fn(async (args?: { where?: { criadoEm?: unknown } }) => args?.where?.criadoEm ? 6 : 3),
      aggregate: vi.fn(async () => ({ _sum: { totalEmKwanza: 15000 } }))
    },
    peca: {
      count: vi.fn(async (args?: { where?: { quantidade?: { lte?: number } } }) => args?.where?.quantidade?.lte === 0 ? 3 : 10)
    },
    negocio: {
      count: vi.fn(async () => 2),
      findMany: vi.fn(async () => [
        { id: "neg-1", nomeComercial: "Loja A" },
        { id: "neg-2", nomeComercial: "Loja B" }
      ])
    },
    ananiTenantRiskSnapshot: {
      findMany: vi.fn(async (args: { where: { sistema: string } }) => {
        if (args.where.sistema === "TEAM") {
          return [
            { negocioId: "neg-1", riskScore: 0.7, trustScore: 0.61, criadoEm: new Date("2026-07-10T12:00:00.000Z") },
            { negocioId: "neg-1", riskScore: 0.3, trustScore: 0.9, criadoEm: new Date("2026-07-09T12:00:00.000Z") },
            { negocioId: "neg-2", riskScore: 0.3, trustScore: 0.87, criadoEm: new Date("2026-07-10T10:00:00.000Z") }
          ];
        }
        return [
          { negocioId: "neg-1", riskScore: 0.2, trustScore: 0.92, criadoEm: new Date("2026-07-10T12:00:00.000Z") }
        ];
      }),
      create: vi.fn()
    },
    ananiIncident: {
      count: vi.fn(async (args?: { where?: { severidade?: unknown } }) => args?.where?.severidade ? 1 : 2),
      findFirst: vi.fn(async () => ({ criadoEm: new Date("2026-07-10T11:00:00.000Z") })),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    ananiQuarantine: {
      count: vi.fn(async (args?: { where?: { severidade?: unknown } }) => args?.where?.severidade ? 1 : 1),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    eventOutbox: {
      count: vi.fn(async (args?: { where?: { status?: string } }) => args?.where?.status === "FAILED" ? 2 : 7),
      create: vi.fn(),
      findFirst: vi.fn(async (): Promise<unknown> => null),
      findMany: vi.fn(),
      update: vi.fn()
    }
  };
}
