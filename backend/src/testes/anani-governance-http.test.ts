import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnaniPolicyEngine } from "../anani/policies/AnaniPolicyEngine.js";
import type { ContextoAplicacao } from "../infra/http/ContextoAplicacao.js";
import { moduloAnaniGovernance } from "../infra/http/modulos/ananiGovernance.js";

const ambienteOriginal = { ...process.env };

describe("Anani Governance HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      AUTH_ALLOW_LEGACY_TOKENS: "true"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("permite governante Bizy consultar health e avaliar politica com no-store", async () => {
    const app = await criarAppAnani("GOVERNANTE_BIZY");

    try {
      const health = await app.inject({
        method: "GET",
        url: "/governance/anani/health",
        headers: { authorization: "Bearer token-governante" }
      });
      expect(health.statusCode).toBe(200);
      expect(health.headers["cache-control"]).toBe("no-store");
      expect(health.json()).toEqual(
        expect.objectContaining({
          sistema: "ANANI",
          status: "OPERACIONAL",
          acesso: expect.objectContaining({ papel: "GOVERNANTE_BIZY" }),
          skills: expect.objectContaining({ total: expect.any(Number) })
        })
      );

      const avaliacao = await app.inject({
        method: "POST",
        url: "/governance/anani/policies/evaluate",
        headers: { authorization: "Bearer token-governante" },
        payload: {
          skill: "team.client.trigger_retention_flow",
          consentimentoConfirmado: false
        }
      });

      expect(avaliacao.statusCode).toBe(200);
      expect(avaliacao.json()).toEqual(
        expect.objectContaining({
          permitido: false,
          enforcement: "HARD_BLOCK",
          razoes: expect.arrayContaining(["MARKETING_CONSENT"])
        })
      );
    } finally {
      await app.close();
    }
  });

  it("bloqueia papel de tenant antes de expor payload da governanca Anani", async () => {
    const app = await criarAppAnani("DONO");

    try {
      const resposta = await app.inject({
        method: "GET",
        url: "/governance/anani/health",
        headers: { authorization: "Bearer token-tenant" }
      });

      expect(resposta.statusCode).toBe(403);
      expect(resposta.headers["cache-control"]).toBe("no-store");
      expect(resposta.json()).toEqual(expect.objectContaining({ erro: "ANANI_RESTRITO_GOVERNANCA" }));
    } finally {
      await app.close();
    }
  });
});

async function criarAppAnani(papel: string) {
  const app = Fastify({ logger: false });
  await moduloAnaniGovernance.registrar(app, criarContextoAnani(papel));
  return app;
}

function criarContextoAnani(papel: string): ContextoAplicacao {
  const policies = new AnaniPolicyEngine();

  return {
    autenticacaoTelefone: {
      obterSessao: vi.fn().mockResolvedValue({
        id: "usuario-governanca",
        nome: "Governanca Bizy",
        telefone: null,
        email: null,
        avatarUrl: null,
        papel,
        origemCadastro: "TELEFONE",
        perfilCompletoEm: null,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      })
    },
    anani: {
      policies,
      eventOutbox: {
        registrar: vi.fn().mockResolvedValue(undefined),
        processarPendentes: vi.fn().mockResolvedValue([])
      },
      incidents: {
        listarAbertos: vi.fn().mockResolvedValue([]),
        criar: vi.fn().mockResolvedValue("incident-1"),
        atualizar: vi.fn().mockResolvedValue(undefined)
      },
      quarantine: {
        listarAbertas: vi.fn().mockResolvedValue([]),
        criar: vi.fn().mockResolvedValue("quarantine-1"),
        resolver: vi.fn().mockResolvedValue(undefined)
      },
      riskSnapshots: {
        registar: vi.fn().mockResolvedValue(undefined),
        obterMaisRecente: vi.fn().mockResolvedValue(null)
      }
    }
  } as unknown as ContextoAplicacao;
}
