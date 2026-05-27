import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("sessão por cookie HttpOnly", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_EVENTOS_ATIVOS: "false",
      RATE_LIMIT_ATIVO: "false"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("emite cookie HttpOnly no login e autentica chamadas usando apenas esse cookie", async () => {
    const app = await criarAplicacao();

    try {
      const codigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "937624785", nome: "Carlos" }
      });
      expect(codigo.statusCode).toBe(202);

      const sessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "937624785", codigo: codigo.json().codigoDev }
      });
      expect(sessao.statusCode).toBe(200);

      const setCookie = String(sessao.headers["set-cookie"]);
      expect(setCookie).toContain("bizy_sessao=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");
      expect(setCookie).toContain("Path=/");

      const cookie = setCookie.split(";")[0];
      const autenticada = await app.inject({
        method: "GET",
        url: "/auth/sessao",
        headers: { cookie }
      });

      expect(autenticada.statusCode).toBe(200);
      expect(autenticada.json().usuario.nome).toBe("Carlos");
    } finally {
      await app.close();
    }
  });

  it("permite credenciais no CORS para sessão por cookie", async () => {
    process.env.ORIGEM_FRONTEND = "http://localhost:5173";
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "OPTIONS",
        url: "/auth/sessao",
        headers: {
          origin: "http://localhost:5173",
          "access-control-request-method": "GET"
        }
      });

      expect(resposta.statusCode).toBe(204);
      expect(resposta.headers["access-control-allow-credentials"]).toBe("true");
    } finally {
      await app.close();
    }
  });
});
