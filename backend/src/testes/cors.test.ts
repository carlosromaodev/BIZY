import { afterEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";
import { resolverOrigemPermitida } from "../infra/http/corsOrigens.js";

const ambienteOriginal = {
  NODE_ENV: process.env.NODE_ENV,
  MARKET_DOMAIN: process.env.MARKET_DOMAIN,
  ORIGEM_FRONTEND: process.env.ORIGEM_FRONTEND,
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL,
  PUBLIC_MARKET_DOMAIN: process.env.PUBLIC_MARKET_DOMAIN,
  PUBLIC_MARKET_URL: process.env.PUBLIC_MARKET_URL,
  PUBLIC_STORE_DOMAIN: process.env.PUBLIC_STORE_DOMAIN,
  INICIAR_AGENDADOR_EXPIRACAO: process.env.INICIAR_AGENDADOR_EXPIRACAO,
  RESTAURAR_LIVES_ATIVAS: process.env.RESTAURAR_LIVES_ATIVAS,
  AUTH_SECRET: process.env.AUTH_SECRET,
  N8N_EVENTOS_ATIVOS: process.env.N8N_EVENTOS_ATIVOS,
  EVOLUTION_WEBHOOK_TOKEN: process.env.EVOLUTION_WEBHOOK_TOKEN,
  LOGIN_SMS_DEV_MODE: process.env.LOGIN_SMS_DEV_MODE,
  LOGIN_SMS_EXPOR_CODIGO_DEV: process.env.LOGIN_SMS_EXPOR_CODIGO_DEV
};

afterEach(() => {
  for (const [chave, valor] of Object.entries(ambienteOriginal)) {
    if (valor === undefined) {
      delete process.env[chave];
    } else {
      process.env[chave] = valor;
    }
  }
});

describe("CORS em desenvolvimento", () => {
  it("aceita a porta alternativa do Vite quando a 5173 estiver ocupada", async () => {
    process.env.NODE_ENV = "development";
    process.env.ORIGEM_FRONTEND = "http://localhost:5173";
    process.env.INICIAR_AGENDADOR_EXPIRACAO = "false";
    process.env.RESTAURAR_LIVES_ATIVAS = "false";

    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "OPTIONS",
        url: "/auth/telefone/solicitar-codigo",
        headers: {
          origin: "http://localhost:5174",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type"
        }
      });

      expect(resposta.statusCode).toBe(204);
      expect(resposta.headers["access-control-allow-origin"]).toBe("http://localhost:5174");
    } finally {
      await app.close();
    }
  });

  it("aceita a origem pública sincronizada pelo ngrok mesmo quando ORIGEM_FRONTEND ficou no localhost", async () => {
    process.env.NODE_ENV = "production";
    process.env.ORIGEM_FRONTEND = "http://localhost:5173";
    process.env.APP_PUBLIC_URL = "https://noncommemorative-concertedly-bonita.ngrok-free.dev";
    process.env.INICIAR_AGENDADOR_EXPIRACAO = "false";
    process.env.RESTAURAR_LIVES_ATIVAS = "false";
    process.env.AUTH_SECRET = "segredo-producao-testes-com-mais-de-32-caracteres";
    process.env.N8N_EVENTOS_ATIVOS = "false";
    process.env.EVOLUTION_WEBHOOK_TOKEN = "token-evolution-testes";
    process.env.LOGIN_SMS_DEV_MODE = "false";
    process.env.LOGIN_SMS_EXPOR_CODIGO_DEV = "false";

    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "OPTIONS",
        url: "/auth/telefone/solicitar-codigo",
        headers: {
          origin: "https://noncommemorative-concertedly-bonita.ngrok-free.dev",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type"
        }
      });

      expect(resposta.statusCode).toBe(204);
      expect(resposta.headers["access-control-allow-origin"]).toBe(
        "https://noncommemorative-concertedly-bonita.ngrok-free.dev"
      );
    } finally {
      await app.close();
    }
  });

  it("aceita domínio próprio do Market e subdomínios públicos da loja em produção sem abrir outros domínios", async () => {
    process.env.NODE_ENV = "production";
    process.env.MARKET_DOMAIN = "market.usebizy.space";
    process.env.ORIGEM_FRONTEND = "https://usebizy.space,https://www.usebizy.space";
    process.env.PUBLIC_MARKET_DOMAIN = "market.usebizy.space";
    process.env.PUBLIC_MARKET_URL = "https://market.usebizy.space";
    process.env.PUBLIC_STORE_DOMAIN = "usebizy.space";
    process.env.INICIAR_AGENDADOR_EXPIRACAO = "false";
    process.env.RESTAURAR_LIVES_ATIVAS = "false";
    process.env.AUTH_SECRET = "segredo-producao-testes-com-mais-de-32-caracteres";
    process.env.N8N_EVENTOS_ATIVOS = "false";
    process.env.EVOLUTION_WEBHOOK_TOKEN = "token-evolution-testes";
    process.env.LOGIN_SMS_DEV_MODE = "false";
    process.env.LOGIN_SMS_EXPOR_CODIGO_DEV = "false";

    const app = await criarAplicacao();

    try {
      const respostaLoja = await app.inject({
        method: "OPTIONS",
        url: "/publico/lojas/uorconnect",
        headers: {
          origin: "https://uorconnect.usebizy.space",
          "access-control-request-method": "GET"
        }
      });

      const respostaEstranha = await app.inject({
        method: "OPTIONS",
        url: "/publico/lojas/uorconnect",
        headers: {
          origin: "https://uorconnect.exemplo.com",
          "access-control-request-method": "GET"
        }
      });
      const respostaAplicacao = await app.inject({
        method: "OPTIONS",
        url: "/loja-publica/configuracao",
        headers: {
          origin: "https://app.usebizy.space",
          "access-control-request-method": "PUT",
          "access-control-request-headers": "authorization,content-type"
        }
      });

      expect(respostaLoja.statusCode).toBe(204);
      expect(respostaLoja.headers["access-control-allow-origin"]).toBe("https://uorconnect.usebizy.space");
      expect(respostaAplicacao.statusCode).toBe(204);
      expect(respostaAplicacao.headers["access-control-allow-origin"]).toBe("https://app.usebizy.space");
      expect(respostaAplicacao.headers["access-control-allow-methods"]).toContain("PUT");
      expect(respostaAplicacao.headers["access-control-allow-methods"]).toContain("PATCH");
      expect(respostaAplicacao.headers["access-control-allow-methods"]).toContain("DELETE");
      expect(resolverOrigemPermitida("https://market.usebizy.space")).toBe("https://market.usebizy.space");
      expect(respostaEstranha.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});
