import { classificarErroHttp } from "../errosHttp.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloSaude: ModuloHttp = {
  nome: "saude",
  descricao: "Healthcheck e metadados básicos da API.",
  registrar(app, contexto) {
    app.get("/", async () => ({
      ok: true,
      nome: "Bizy",
      servico: "backend",
      saude: "/saude",
      webhookEvolution: "/webhooks/evolution"
    }));

    app.get("/saude", async (_request, reply) => {
      const base = {
        nome: "Bizy",
        armazenamento: process.env.MODO_ARMAZENAMENTO ?? "prisma",
        agora: new Date().toISOString()
      };

      try {
        await contexto.repositorios.verificarConexao?.();
        return {
          ok: true,
          ...base,
          dependencias: {
            banco: {
              estado: "OK"
            }
          }
        };
      } catch (erro) {
        const erroHttp = classificarErroHttp(erro);

        return reply.code(erroHttp.statusCode === 503 ? 503 : 500).send({
          ok: false,
          ...base,
          dependencias: {
            banco: {
              estado: "INDISPONIVEL",
              mensagem: erroHttp.resposta.mensagem
            }
          }
        });
      }
    });
  }
};
