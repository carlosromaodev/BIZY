import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { InteligenciaPreditivaUseCase } from "../use-case/InteligenciaPreditivaUseCase.js";

describe("InteligenciaPreditivaUseCase", () => {
  it("RNF-T024: importa indicadores externos via JSON/CSV para o motor preditivo", async () => {
    const negocio = {
      findUnique: vi.fn().mockResolvedValue({
        fontesDadosJson: JSON.stringify({
          onboarding: { origem: "teste" },
          preditivo: {
            fontesExternas: [
              {
                id: "indicador-antigo",
                fonte: "MERCADO",
                chave: "crescimento_vestuário",
                periodo: "2026-05",
                valor: 1.2,
                recebidoEm: "2026-05-01T00:00:00.000Z"
              }
            ]
          }
        })
      }),
      update: vi.fn().mockResolvedValue({ id: "negocio-1" })
    };
    const prisma = { negocio } as unknown as PrismaClient;
    const useCase = new InteligenciaPreditivaUseCase(prisma);

    const resultado = await useCase.importarFontesExternasPreditivas("negocio-1", {
      fonte: "mercado",
      criadoPorId: "usuario-1",
      indicadores: [
        {
          chave: "inflacao",
          periodo: "2026-06",
          valor: 18.5,
          unidade: "%",
          segmento: "retalho"
        }
      ],
      conteudoCsv: "chave,periodo,valor,unidade,segmento\ncambio_usd,2026-06,912.4,AOA,importacao"
    });

    expect(resultado.importados).toBe(2);
    expect(negocio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "negocio-1" },
        data: { fontesDadosJson: expect.any(String) }
      })
    );

    const payload = JSON.parse(negocio.update.mock.calls[0][0].data.fontesDadosJson);
    expect(payload.onboarding).toEqual({ origem: "teste" });
    expect(payload.preditivo.fontesExternas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fonte: "MERCADO", chave: "inflacao", periodo: "2026-06", valor: 18.5, unidade: "%" }),
        expect.objectContaining({ fonte: "MERCADO", chave: "cambio_usd", periodo: "2026-06", valor: 912.4, unidade: "AOA" }),
        expect.objectContaining({ id: "indicador-antigo", chave: "crescimento_vestuário" })
      ])
    );
  });

  it("RNF-T020: recalcula previsões restantes quando uma fonte falha", async () => {
    const useCase = new InteligenciaPreditivaUseCase({} as PrismaClient);
    const demanda = vi.spyOn(useCase, "preverDemandaPorSKU").mockRejectedValue(new Error("histórico de vendas indisponível"));
    const fluxo = vi.spyOn(useCase, "preverFluxoCaixa").mockResolvedValue({
      saldoActual: 1000,
      previsao: [],
      alertasDefice: [],
      mediaSemanais: { entradas: 0, saidas: 0 }
    });
    const receita = vi.spyOn(useCase, "preverReceitaMensal").mockResolvedValue({
      previsoes: [],
      dadosInsuficientes: true,
      mensagem: "sem dados",
      mediaSimplesPorTransaccao: 0,
      factoresExternos: []
    });
    const scores = vi.spyOn(useCase, "persistirScoresClientes").mockResolvedValue({ persistidos: 0 });

    const resultado = await useCase.recalcularPrevisoesComDegradacao("negocio-1");

    expect(resultado.estado).toBe("PARCIAL");
    expect(resultado.concluidas).toEqual(
      expect.objectContaining({
        fluxoCaixa: expect.objectContaining({ saldoActual: 1000 }),
        receita: expect.objectContaining({ dadosInsuficientes: true }),
        scoresClientes: { persistidos: 0 }
      })
    );
    expect(resultado.falhas).toEqual([
      { chave: "demanda", erro: "histórico de vendas indisponível" }
    ]);
    expect(demanda).toHaveBeenCalledWith("negocio-1", 4);
    expect(fluxo).toHaveBeenCalledWith("negocio-1", 13);
    expect(receita).toHaveBeenCalledWith("negocio-1", 3);
    expect(scores).toHaveBeenCalledWith("negocio-1");
  });

  it("RNF-T002: enfileira recálculo preditivo em background sem bloquear a request", async () => {
    const outboxEventoN8n = {
      create: vi.fn().mockResolvedValue({ id: "outbox-1", eventoId: "evento-1", status: "PENDENTE" })
    };
    const prisma = { outboxEventoN8n } as unknown as PrismaClient;
    const useCase = new InteligenciaPreditivaUseCase(prisma);

    const resultado = await useCase.enfileirarRecalculoPreditivo("negocio-1", {
      semanasDemanda: 6,
      semanasCaixa: 14,
      mesesReceita: 4,
      solicitadoPorId: "usuario-1"
    });

    expect(resultado).toEqual({
      estado: "ENFILEIRADO",
      eventoN8n: { id: "outbox-1", eventoId: "evento-1", status: "PENDENTE" }
    });
    expect(outboxEventoN8n.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negocioId: "negocio-1",
          tipo: "PREDICTIVE_RECALCULO_SOLICITADO",
          status: "PENDENTE"
        })
      })
    );
    const payload = JSON.parse(outboxEventoN8n.create.mock.calls[0][0].data.payloadJson);
    expect(payload).toEqual(
      expect.objectContaining({
        negocioId: "negocio-1",
        semanasDemanda: 6,
        semanasCaixa: 14,
        mesesReceita: 4,
        solicitadoPorId: "usuario-1",
        endpointExecucao: "/inteligencia/recalcular"
      })
    );
  });

  it("RNF-T006: enfileira recálculo preditivo por negócio para processamento paralelo", async () => {
    const outboxEventoN8n = {
      create: vi
        .fn()
        .mockResolvedValueOnce({ id: "outbox-1", eventoId: "evento-1", status: "PENDENTE" })
        .mockResolvedValueOnce({ id: "outbox-2", eventoId: "evento-2", status: "PENDENTE" })
        .mockResolvedValueOnce({ id: "outbox-3", eventoId: "evento-3", status: "PENDENTE" })
    };
    const prisma = { outboxEventoN8n } as unknown as PrismaClient;
    const useCase = new InteligenciaPreditivaUseCase(prisma);

    const resultado = await useCase.enfileirarRecalculoPreditivoLote(
      ["negocio-1", "negocio-2", "negocio-1", "negocio-3"],
      {
        semanasDemanda: 5,
        semanasCaixa: 13,
        mesesReceita: 4,
        concorrencia: 2,
        solicitadoPorId: "usuario-1"
      }
    );

    expect(resultado).toEqual(
      expect.objectContaining({
        estado: "ENFILEIRADO",
        totalNegocios: 3,
        enfileirados: 3,
        concorrenciaSugerida: 2,
        falhas: []
      })
    );
    expect(outboxEventoN8n.create).toHaveBeenCalledTimes(3);

    const payloads = outboxEventoN8n.create.mock.calls.map((call) => JSON.parse(call[0].data.payloadJson));
    expect(payloads.map((payload) => payload.negocioId)).toEqual(["negocio-1", "negocio-2", "negocio-3"]);
    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          loteId: resultado.loteId,
          totalNegocios: 3,
          concorrenciaSugerida: 2,
          chaveParticao: "negocio-2",
          endpointExecucao: "/inteligencia/recalcular"
        })
      ])
    );
  });

  it("RF-T014: inclui estouro de orçamento na previsão de risco de projectos", async () => {
    const projecto = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "projecto-1",
          nome: "Campanha Agosto",
          orcamento: 100_000,
          dataFim: null,
          entregas: [{ id: "entrega-1", estado: "CONCLUIDA", dataLimite: null, criadoEm: new Date(), concluidaEm: new Date() }],
          membrosProjecto: [{ membroId: "membro-1" }]
        }
      ])
    };
    const movimentoFinanceiro = {
      groupBy: vi.fn().mockResolvedValue([{ origemId: "projecto-1", _sum: { valor: 130_000 } }])
    };
    const prisma = { projecto, movimentoFinanceiro } as unknown as PrismaClient;
    const useCase = new InteligenciaPreditivaUseCase(prisma);

    const resultado = await useCase.preverAtrasosProjectos("negocio-1");

    expect(resultado.emRisco).toBe(1);
    expect(resultado.projectos[0]).toEqual(
      expect.objectContaining({
        projectoId: "projecto-1",
        risco: "ALTO",
        orcamento: 100_000,
        despesaProjecto: 130_000,
        orcamentoExcedido: true
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
});
