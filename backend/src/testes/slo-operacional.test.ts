import { performance } from "node:perf_hooks";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("SLO operacional do piloto", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      OMBALA_API_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("publica comentário no painel em até 3s e cria reserva válida em até 10s", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      await criarPeca(app, headers, "91");

      const inicio = performance.now();
      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_slo",
          username: "cliente_slo",
          displayName: "Cliente SLO",
          commentText: "eu quero 923456789 peça 91"
        }
      });
      const duracaoReservaMs = performance.now() - inicio;

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().reserva).toEqual(expect.objectContaining({ codigoPeca: "91" }));
      expect(duracaoReservaMs).toBeLessThan(10_000);

      const inicioPainel = performance.now();
      const comentarios = await app.inject({ method: "GET", url: "/comentarios", headers });
      const duracaoPainelMs = performance.now() - inicioPainel;

      expect(comentarios.statusCode).toBe(200);
      expect(comentarios.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            comentario: expect.objectContaining({ liveId: "live_slo", username: "cliente_slo" })
          })
        ])
      );
      expect(duracaoPainelMs).toBeLessThan(3_000);
    } finally {
      await app.close();
    }
  });

  it("responde OTP em até 10s e conclui login em até 15s no modo dev", async () => {
    const app = await criarAplicacao();

    try {
      const inicio = performance.now();
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000099", nome: "Vendedor SLO" }
      });
      const duracaoOtpMs = performance.now() - inicio;

      expect(respostaCodigo.statusCode).toBe(202);
      expect(respostaCodigo.json().statusEnvio).toBe("DEV");
      expect(respostaCodigo.json()).toEqual(
        expect.objectContaining({
          latenciaEnvioMs: expect.any(Number),
          sloEnvioMs: 10_000,
          dentroSloEnvio: true
        })
      );
      expect(duracaoOtpMs).toBeLessThan(10_000);

      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000099", codigo: respostaCodigo.json().codigoDev }
      });
      const duracaoTotalMs = performance.now() - inicio;

      expect(respostaSessao.statusCode).toBe(200);
      expect(duracaoTotalMs).toBeLessThan(15_000);
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000098", nome: "Vendedor SLO" }
  });

  const codigo = respostaCodigo.json().codigoDev;
  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000098", codigo }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarPeca(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string
) {
  await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Artigo ${codigo}`,
      descricao: "Peça SLO",
      precoEmKwanza: 9500,
      quantidade: 1,
      fotos: []
    }
  });
}
