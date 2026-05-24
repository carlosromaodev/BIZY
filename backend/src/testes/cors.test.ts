import { afterEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = {
  NODE_ENV: process.env.NODE_ENV,
  ORIGEM_FRONTEND: process.env.ORIGEM_FRONTEND,
  INICIAR_AGENDADOR_EXPIRACAO: process.env.INICIAR_AGENDADOR_EXPIRACAO,
  RESTAURAR_LIVES_ATIVAS: process.env.RESTAURAR_LIVES_ATIVAS
};

afterEach(() => {
  process.env.NODE_ENV = ambienteOriginal.NODE_ENV;
  process.env.ORIGEM_FRONTEND = ambienteOriginal.ORIGEM_FRONTEND;
  process.env.INICIAR_AGENDADOR_EXPIRACAO = ambienteOriginal.INICIAR_AGENDADOR_EXPIRACAO;
  process.env.RESTAURAR_LIVES_ATIVAS = ambienteOriginal.RESTAURAR_LIVES_ATIVAS;
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
});
