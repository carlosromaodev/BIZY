import { z } from "zod";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";
import { exigirContaAutenticada } from "../../../commerce/infra/http/segurancaContaBizy.js";

const LinkSchema = z.object({
  parceiroId: z.string().uuid(),
  destinoTipo: z.enum(["LOJA", "PRODUTO", "CAMPANHA", "CONTEUDO", "CARRINHO", "MINI_LOJA", "LEARNING"]),
  destinoId: z.string().trim().max(200).nullable().optional(),
  slugLoja: z.string().trim().max(160).nullable().optional(),
  codigoProduto: z.string().trim().max(160).nullable().optional(),
  canal: z.string().trim().max(80).nullable().optional()
});

export const moduloCreatorPortal: ModuloHttp = {
  nome: "creator-portal",
  descricao: "Portal autenticado de criadores e afiliados.",
  registrar(app, contexto) {
    app.get("/creator/portal", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return contexto.creatorPortal.obterPortal(acesso.conta);
    });

    app.post("/creator/links", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      try {
        return reply.code(201).send(await contexto.creatorPortal.criarLink(acesso.conta, LinkSchema.parse(request.body ?? {})));
      } catch {
        return reply.code(404).send({ erro: "RECURSO_NAO_ENCONTRADO" });
      }
    });
  }
};
