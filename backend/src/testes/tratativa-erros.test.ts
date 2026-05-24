import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Tratativa de erros de infraestrutura", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      NODE_ENV: "development",
      MODO_ARMAZENAMENTO: "prisma",
      DATABASE_URL: "postgresql://emeu:emeu_senha_dev@127.0.0.1:1/emeu?schema=public&connect_timeout=1",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      RATE_LIMIT_ATIVO: "false"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("responde erro sanitizado quando o banco cai durante validação de sessão", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "GET",
        url: "/pecas",
        headers: { authorization: "Bearer token-invalido" }
      });

      expect(resposta.statusCode).toBe(503);
      expect(resposta.json()).toEqual({
        erro: "BANCO_INDISPONIVEL",
        mensagem: "Base de dados indisponível. Verifique se o Postgres está em execução e tente novamente.",
        recuperavel: true
      });
      expect(resposta.body).not.toContain("Invalid `this.prisma");
      expect(resposta.body).not.toContain("127.0.0.1:1");
    } finally {
      await app.close();
    }
  });

  it("não converte falha de banco no login em erro funcional de SMS", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000001", nome: "Vendedor" }
      });

      expect(resposta.statusCode).toBe(503);
      expect(resposta.json().erro).toBe("BANCO_INDISPONIVEL");
      expect(resposta.body).not.toContain("LOGIN_SMS");
      expect(resposta.body).not.toContain("Can't reach database server");
    } finally {
      await app.close();
    }
  });

  it("expõe saúde degradada quando a API está de pé mas o banco está indisponível", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({ method: "GET", url: "/saude" });

      expect(resposta.statusCode).toBe(503);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          ok: false,
          armazenamento: "prisma",
          dependencias: {
            banco: {
              estado: "INDISPONIVEL",
              mensagem: "Base de dados indisponível. Verifique se o Postgres está em execução e tente novamente."
            }
          }
        })
      );
    } finally {
      await app.close();
    }
  });

  it("mantém a raiz pública para validação rápida do túnel", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({ method: "GET", url: "/" });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual({
        ok: true,
        nome: "Bizy",
        servico: "backend",
        saude: "/saude",
        webhookEvolution: "/webhooks/evolution"
      });
    } finally {
      await app.close();
    }
  });
});
