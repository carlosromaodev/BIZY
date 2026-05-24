import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Rotas HTTP de identidade e onboarding", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      NODE_ENV: "development",
      MODO_ARMAZENAMENTO: "memoria",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_EVENTOS_ATIVOS: "false",
      WHATSAPP_PROVIDER: "console",
      LOGIN_ESTUDANTIL_DEV_MODE: "true",
      RATE_LIMIT_ATIVO: "false"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("publica login estudantil e cadastro de negócio no app Fastify", async () => {
    const app = await criarAplicacao();

    try {
      const login = await app.inject({
        method: "POST",
        url: "/auth/estudantil/login",
        payload: {
          provider: "uor",
          identificador: "20243454",
          tipoIdentificador: "studentNumber",
          palavraPasse: "senha-dev"
        }
      });

      expect(login.statusCode).toBe(200);
      expect(login.body).not.toContain("Route POST:/auth/estudantil/login not found");

      const token = login.json().token as string;
      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          nomeComercial: "Loja Live Angola",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923000222",
          whatsapp: "923000222",
          email: "loja@example.com",
          provincia: "Luanda",
          municipio: "Talatona",
          canaisVenda: ["whatsapp", "tiktok"],
          metodosPagamento: ["transferencia"],
          minutosReservaPadrao: 10
        }
      });

      expect(negocio.statusCode).toBe(201);
      expect(negocio.body).not.toContain("Route POST:/onboarding/negocio not found");
      expect(negocio.json().negocio).toEqual(
        expect.objectContaining({
          nomeComercial: "Loja Live Angola",
          usuarioPapel: "DONO"
        })
      );
    } finally {
      await app.close();
    }
  });
});

describe("Script de arranque do backend", () => {
  it("reconstrói o dist antes de servir produção para evitar rotas antigas", () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.start).toMatch(/^npm run build && node dist\/main\.js$/);
  });
});
