import { AtualizarPecaSchema, CriarPecaSchema } from "../../../dominio/esquemas.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloCatalogo: ModuloHttp = {
  nome: "catalogo",
  descricao: "Cadastro e listagem das peças vendidas em live.",
  registrar(app, contexto) {
    app.post("/pecas", async (request, reply) => {
      const dados = CriarPecaSchema.parse(request.body);
      const peca = await contexto.gestaoPecas.cadastrarPeca(dados);
      return reply.code(201).send(peca);
    });

    app.get("/pecas", async () => contexto.gestaoPecas.listarPecas());

    app.patch("/pecas/:codigo", async (request) => {
      const { codigo } = request.params as { codigo: string };
      const dados = AtualizarPecaSchema.parse(request.body ?? {});
      return contexto.gestaoPecas.atualizarPeca(codigo, dados);
    });

    app.delete("/pecas/:codigo", async (request) => {
      const { codigo } = request.params as { codigo: string };
      return contexto.gestaoPecas.desativarPeca(codigo);
    });
  }
};
