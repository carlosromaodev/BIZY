import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("API financeira documentada", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_EVENTOS_ATIVOS: "false"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("RNF-T023: expõe contrato OpenAPI REST para integrações contabilísticas", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      const resposta = await app.inject({
        method: "GET",
        url: "/financas/openapi.json",
        headers
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          openapi: "3.0.3",
          info: expect.objectContaining({
            title: "BIZY Team Finance API"
          }),
          components: expect.objectContaining({
            securitySchemes: expect.objectContaining({
              bearerAuth: expect.objectContaining({ type: "http", scheme: "bearer" })
            })
          }),
          paths: expect.objectContaining({
            "/financas/movimentos": expect.objectContaining({
              get: expect.objectContaining({ "x-bizy-permissao": "financas:leitura" }),
              post: expect.objectContaining({ "x-bizy-permissao": "financas:escrita" })
            }),
            "/financas/reconciliacao/importar": expect.objectContaining({
              post: expect.objectContaining({
                summary: expect.stringContaining("Importa extracto bancário")
              })
            }),
            "/financas/facturas": expect.objectContaining({
              post: expect.objectContaining({
                requestBody: expect.objectContaining({
                  content: expect.objectContaining({
                    "application/json": expect.objectContaining({
                      schema: expect.objectContaining({
                        "x-bizy-campos": expect.arrayContaining(["clienteNome", "itens"])
                      })
                    })
                  })
                })
              })
            }),
            "/financas/saude": expect.objectContaining({
              get: expect.objectContaining({
                summary: expect.stringContaining("Healthcheck público")
              })
            })
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("RNF-T019: expõe healthcheck público do módulo financeiro para monitoramento de disponibilidade", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "GET",
        url: "/financas/saude"
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          ok: true,
          estado: "OK",
          modulo: "financas",
          alvoSlo: expect.objectContaining({
            disponibilidadeMinimaPercentual: 99.5,
            limiteLatenciaProbeMs: expect.any(Number)
          }),
          dependencias: expect.objectContaining({
            banco: { estado: "OK" },
            ledgerFinanceiro: { estado: "OK" },
            outboxN8n: expect.objectContaining({ estado: "OK" }),
            latenciaProbe: expect.objectContaining({ estado: "OK" })
          })
        })
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const telefone = "923555023";
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome: "Financeiro API" }
  });
  expect(respostaCodigo.statusCode).toBe(202);

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });
  expect(respostaSessao.statusCode).toBe(200);

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
