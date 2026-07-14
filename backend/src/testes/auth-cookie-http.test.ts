import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

function decodificarPayloadJwt(token: string): Record<string, unknown> {
  const partes = token.split(".");
  expect(partes).toHaveLength(3);
  return JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")) as Record<string, unknown>;
}

function extrairCookieSessao(setCookie: string): string {
  const cookie = setCookie.split(";")[0];
  expect(cookie).toMatch(/^bizy_sessao=/);
  return cookie;
}

describe("sessão por cookie HttpOnly", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      WHATSAPP_PROVIDER: "console",
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
      const corpoSessao = sessao.json();
      const token = corpoSessao.token as string;
      expect(token).toMatch(/^[^.]+\.[^.]+\.[^.]+$/);

      const payloadJwt = decodificarPayloadJwt(token);
      expect(payloadJwt).toEqual(
        expect.objectContaining({
          sub: corpoSessao.usuario.id,
          sid: expect.any(String),
          jti: expect.any(String),
          typ: "bizy-session",
          iss: "bizy-api",
          aud: "bizy-web"
        })
      );

      const setCookie = String(sessao.headers["set-cookie"]);
      expect(setCookie).toContain("bizy_sessao=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");
      expect(setCookie).toContain("Path=/");

      const cookie = extrairCookieSessao(setCookie);
      expect(decodeURIComponent(cookie.replace("bizy_sessao=", ""))).toBe(token);

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

  it("aceita Bearer JWT e rejeita token JWT adulterado", async () => {
    const app = await criarAplicacao();

    try {
      const codigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "937624786", nome: "Bearer JWT" }
      });
      expect(codigo.statusCode).toBe(202);

      const sessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "937624786", codigo: codigo.json().codigoDev }
      });
      expect(sessao.statusCode).toBe(200);
      const token = sessao.json().token as string;
      expect(token).toMatch(/^[^.]+\.[^.]+\.[^.]+$/);

      const autenticada = await app.inject({
        method: "GET",
        url: "/auth/sessao",
        headers: { authorization: `Bearer ${token}` }
      });
      expect(autenticada.statusCode).toBe(200);
      expect(autenticada.json().usuario.nome).toBe("Bearer JWT");

      const adulterado = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
      const rejeitada = await app.inject({
        method: "GET",
        url: "/auth/sessao",
        headers: { authorization: `Bearer ${adulterado}` }
      });
      expect(rejeitada.statusCode).toBe(401);
      expect(rejeitada.json()).toEqual(expect.objectContaining({ erro: "NAO_AUTENTICADO" }));
    } finally {
      await app.close();
    }
  });

  it("revoga a sessão JWT no logout e expira o cookie", async () => {
    const app = await criarAplicacao();

    try {
      const codigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "937624787", nome: "Logout JWT" }
      });
      expect(codigo.statusCode).toBe(202);

      const sessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "937624787", codigo: codigo.json().codigoDev }
      });
      expect(sessao.statusCode).toBe(200);
      const cookie = extrairCookieSessao(String(sessao.headers["set-cookie"]));

      const logout = await app.inject({
        method: "DELETE",
        url: "/auth/sessao",
        headers: { cookie }
      });
      expect(logout.statusCode).toBe(200);
      expect(String(logout.headers["set-cookie"])).toContain("Max-Age=0");

      const rejeitada = await app.inject({
        method: "GET",
        url: "/auth/sessao",
        headers: { cookie }
      });
      expect(rejeitada.statusCode).toBe(401);
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
