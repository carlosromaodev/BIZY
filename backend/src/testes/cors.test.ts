import { afterEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = {
  NODE_ENV: process.env.NODE_ENV,
  ORIGEM_FRONTEND: process.env.ORIGEM_FRONTEND,
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
  process.env.NODE_ENV = ambienteOriginal.NODE_ENV;
  process.env.ORIGEM_FRONTEND = ambienteOriginal.ORIGEM_FRONTEND;
  process.env.PUBLIC_STORE_DOMAIN = ambienteOriginal.PUBLIC_STORE_DOMAIN;
  process.env.INICIAR_AGENDADOR_EXPIRACAO = ambienteOriginal.INICIAR_AGENDADOR_EXPIRACAO;
  process.env.RESTAURAR_LIVES_ATIVAS = ambienteOriginal.RESTAURAR_LIVES_ATIVAS;
  process.env.AUTH_SECRET = ambienteOriginal.AUTH_SECRET;
  process.env.N8N_EVENTOS_ATIVOS = ambienteOriginal.N8N_EVENTOS_ATIVOS;
  process.env.EVOLUTION_WEBHOOK_TOKEN = ambienteOriginal.EVOLUTION_WEBHOOK_TOKEN;
  process.env.LOGIN_SMS_DEV_MODE = ambienteOriginal.LOGIN_SMS_DEV_MODE;
  process.env.LOGIN_SMS_EXPOR_CODIGO_DEV = ambienteOriginal.LOGIN_SMS_EXPOR_CODIGO_DEV;
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

  it("aceita subdomínios públicos da loja em produção sem abrir outros domínios", async () => {
    process.env.NODE_ENV = "production";
    process.env.ORIGEM_FRONTEND = "https://usebizy.space,https://www.usebizy.space";
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

      expect(respostaLoja.statusCode).toBe(204);
      expect(respostaLoja.headers["access-control-allow-origin"]).toBe("https://uorconnect.usebizy.space");
      expect(respostaEstranha.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});
