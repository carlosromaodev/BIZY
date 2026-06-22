import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial, resolverContextoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

/* ── Schemas de validação ─────────────────────────────────────── */

const CriarConviteSchema = z.object({
  telefone: z.string().trim().min(5).max(30).optional(),
  email: z.string().trim().email().max(120).optional(),
  nomeConvidado: z.string().trim().min(2).max(120).optional(),
  papelSugerido: z.string().trim().max(40).optional(),
  personaId: z.string().uuid().optional()
}).refine(
  (d) => d.telefone || d.email,
  { message: "Forneça telefone ou email do convidado." }
);

const CriarNotaSchema = z.object({
  entidadeTipo: z.string().trim().min(1).max(60),
  entidadeId: z.string().trim().min(1).max(80),
  conteudo: z.string().trim().min(1).max(4000),
  mencoes: z.array(z.string().uuid()).max(20).optional()
});

const CriarPersonaSchema = z.object({
  nome: z.string().trim().min(2).max(60),
  descricao: z.string().trim().max(200).optional(),
  papelBase: z.string().trim().min(2).max(40),
  permissoes: z.record(z.unknown()).optional()
});

const FiltrosFeedSchema = z.object({
  tipo: z.string().trim().max(60).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional()
});

const NotasFiltroSchema = z.object({
  entidadeTipo: z.string().trim().min(1).max(60),
  entidadeId: z.string().trim().min(1).max(80)
});

/* ── Módulo HTTP ──────────────────────────────────────────────── */

export const moduloEquipa: ModuloHttp = {
  nome: "equipa",
  descricao: "Gestão de equipa — convites, membros, personas, notas internas, feed de actividade e onboarding.",

  registrar(app, contexto) {

    /* ── Membros ─────────────────────────────────────────────── */

    app.get("/equipa/membros", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const membros = await contexto.gestaoEquipa.listarMembros(ctx.negocio.id);
      return { membros };
    });

    app.patch("/equipa/membros/:id/desativar", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      try {
        const membro = await contexto.gestaoEquipa.desativarMembro(id, ctx.negocio.id);
        return { membro };
      } catch (erro: unknown) {
        const mensagem = erro instanceof Error ? erro.message : "Erro ao desativar membro.";
        return reply.code(400).send({ erro: "DESATIVACAO_FALHOU", mensagem });
      }
    });

    /* ── Convites ────────────────────────────────────────────── */

    app.get("/equipa/convites", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const convites = await contexto.gestaoEquipa.listarConvites(ctx.negocio.id);
      return { convites };
    });

    app.post("/equipa/convites", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarConviteSchema.parse(request.body ?? {});
      const convite = await contexto.gestaoEquipa.criarConvite(ctx.negocio.id, {
        ...dados,
        criadoPorId: ctx.usuario.id
      });
      return reply.code(201).send({ convite });
    });

    app.post("/equipa/convites/:id/reenviar", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const convite = await contexto.gestaoEquipa.reenviarConvite(id, ctx.negocio.id);
      return { convite };
    });

    app.post("/equipa/convites/:id/revogar", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const convite = await contexto.gestaoEquipa.revogarConvite(id, ctx.negocio.id);
      return { convite };
    });

    app.post("/equipa/convites/aceitar", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;

      const { token } = z.object({ token: z.string().uuid() }).parse(request.body ?? {});
      try {
        const resultado = await contexto.gestaoEquipa.aceitarConvite(token, ctx.usuario.id);
        return reply.code(201).send(resultado);
      } catch (erro: unknown) {
        const mensagem = erro instanceof Error ? erro.message : "Erro ao aceitar convite.";
        return reply.code(400).send({ erro: "CONVITE_INVALIDO", mensagem });
      }
    });

    /* ── Personas ────────────────────────────────────────────── */

    app.get("/equipa/personas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const personas = await contexto.gestaoEquipa.listarPersonas(ctx.negocio.id);
      return { personas };
    });

    app.post("/equipa/personas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarPersonaSchema.parse(request.body ?? {});
      const persona = await contexto.gestaoEquipa.criarPersona(ctx.negocio.id, dados);
      return reply.code(201).send({ persona });
    });

    /* ── Notas Internas ──────────────────────────────────────── */

    app.get("/equipa/notas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = NotasFiltroSchema.parse(request.query ?? {});
      const notas = await contexto.gestaoEquipa.listarNotas(
        ctx.negocio.id,
        filtros.entidadeTipo,
        filtros.entidadeId
      );
      return { notas };
    });

    app.post("/equipa/notas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const dados = CriarNotaSchema.parse(request.body ?? {});
      const nota = await contexto.gestaoEquipa.criarNota(ctx.negocio.id, {
        ...dados,
        autorId: ctx.usuario.id
      });
      return reply.code(201).send({ nota });
    });

    /* ── Feed de Actividade ──────────────────────────────────── */

    app.get("/equipa/feed", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosFeedSchema.parse(request.query ?? {});
      const actividades = await contexto.gestaoEquipa.listarFeed(ctx.negocio.id, filtros);
      return { actividades };
    });

    /* ── Onboarding Checklist ────────────────────────────────── */

    app.get("/equipa/onboarding/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const checklist = await contexto.gestaoEquipa.listarChecklistOnboarding(id);
      return { checklist };
    });

    app.post("/equipa/onboarding/:id/completar", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { item } = z.object({ item: z.string().trim().min(1).max(60) }).parse(request.body ?? {});
      await contexto.gestaoEquipa.marcarItemOnboarding(id, item);
      return { ok: true };
    });
  }
};

/* ── Helper de permissão ──────────────────────────────────────── */

async function exigirEquipa(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    modulo: "crm",
    mensagemPermissao: "Sem permissão para gerir a equipa.",
    mensagemModulo: "Módulo de equipa desativado para este negócio."
  });
}
