import { AtualizarPecaSchema, CriarPecaSchema } from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloCatalogo: ModuloHttp = {
  nome: "catalogo",
  descricao: "Cadastro e listagem das peças vendidas em live.",
  registrar(app, contexto) {
    app.post("/pecas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = CriarPecaSchema.parse(request.body);
      const peca = await contexto.gestaoPecas.cadastrarPeca({ ...dados, negocioId: contextoComercial.negocio.id });
      return reply.code(201).send(peca);
    });

    app.get("/pecas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:ler",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para consultar catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.gestaoPecas.listarPecas(contextoComercial.negocio.id);
    });

    app.patch("/pecas/:codigo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = request.params as { codigo: string };
      const dados = AtualizarPecaSchema.parse(request.body ?? {});
      return contexto.gestaoPecas.atualizarPeca(
        codigo,
        { ...dados, negocioId: contextoComercial.negocio.id },
        contextoComercial.negocio.id
      );
    });

    app.delete("/pecas/:codigo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = request.params as { codigo: string };
      return contexto.gestaoPecas.desativarPeca(codigo, contextoComercial.negocio.id);
    });
  }
};
