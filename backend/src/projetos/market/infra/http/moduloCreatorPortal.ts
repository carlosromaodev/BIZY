import { z } from "zod";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";
import { exigirContaAutenticada } from "../../../commerce/infra/http/segurancaContaBizy.js";
import { exigirPermissaoComercial } from "../../../../infra/http/contextoComercial.js";
import { tiposConteudoCommerce } from "../../dominio/conteudoCommerce.js";

const LinkSchema = z.object({
  parceiroId: z.string().uuid(),
  destinoTipo: z.enum(["LOJA", "PRODUTO", "CAMPANHA", "CONTEUDO", "CARRINHO", "MINI_LOJA", "LEARNING"]),
  destinoId: z.string().trim().max(200).nullable().optional(),
  slugLoja: z.string().trim().max(160).nullable().optional(),
  codigoProduto: z.string().trim().max(160).nullable().optional(),
  canal: z.string().trim().max(80).nullable().optional()
});

const ConteudoSchema = z.object({
  parceiroId: z.string().uuid(), slug: z.string().trim().min(3).max(120),
  tipo: z.enum(tiposConteudoCommerce), titulo: z.string().trim().min(3).max(180),
  legenda: z.string().trim().max(4000).nullable().optional(), thumbnailUrl: z.string().url().nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(), divulgacaoComercial: z.boolean().default(true),
  produtos: z.array(z.object({ slugLoja: z.string().trim().min(1).max(160), codigoProduto: z.string().trim().min(1).max(160), variantePecaId: z.string().uuid().nullable().optional() })).min(1).max(50)
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

    app.get("/creator/conteudos/dados", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      return { conteudos: await contexto.conteudoCompravel.listarDaConta(acesso.conta) };
    });

    app.post("/creator/conteudos", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      try { return reply.code(201).send(await contexto.conteudoCompravel.criar(acesso.conta, ConteudoSchema.parse(request.body ?? {}))); }
      catch (erro) { const mensagem = erro instanceof Error ? erro.message : "CONTEUDO_INVALIDO"; return reply.code(mensagem === "SLUG_EM_USO" ? 409 : 400).send({ erro: mensagem }); }
    });

    app.patch("/creator/team/conteudos/:id/moderar", async (request, reply) => {
      const acesso = await exigirPermissaoComercial(contexto, request, reply, "afiliados:gerir", "Sem permissao para moderar conteudo."); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const dados = z.object({ aprovar: z.boolean(), motivo: z.string().trim().max(500).nullable().optional() }).parse(request.body ?? {});
      const resultado = await contexto.conteudoCompravel.moderar(id, acesso.negocio.id, dados);
      return resultado ?? reply.code(404).send({ erro: "CONTEUDO_NAO_ENCONTRADO" });
    });

    app.get("/publico/conteudos/:slug", async (request, reply) => {
      const { slug } = z.object({ slug: z.string().trim().min(1).max(160) }).parse(request.params);
      const resultado = await contexto.conteudoCompravel.obterPublico(slug);
      return resultado ?? reply.code(404).send({ erro: "CONTEUDO_NAO_ENCONTRADO" });
    });
  }
};
