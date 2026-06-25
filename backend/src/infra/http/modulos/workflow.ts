import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial, resolverContextoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const CriarFluxoSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  gatilho: z.string().trim().min(2).max(60),
  descricao: z.string().trim().max(300).optional()
});

const PassoSchema = z.object({
  tipo: z.string().trim().min(2).max(40),
  configuracaoJson: z.string().max(5000).optional()
});

const ConfigNotificacaoSchema = z.object({
  canal: z.enum(["WHATSAPP", "EMAIL", "PUSH", "SMS"]),
  tipo: z.string().trim().min(2).max(40),
  ativo: z.boolean(),
  horarioInicio: z.string().trim().max(5).optional(),
  horarioFim: z.string().trim().max(5).optional()
});

async function exigirWorkflow(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    mensagemPermissao: "Sem permissão para gerir workflows."
  });
}

export const moduloWorkflow: ModuloHttp = {
  nome: "workflow",
  descricao: "Fluxos automáticos, widgets contextuais e notificações (Fase 4)",

  registrar(app, contexto) {

    app.post("/workflow/fluxos", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = CriarFluxoSchema.parse(request.body);
      return contexto.gestaoWorkflow.criarFluxo(ctx.negocio.id, dados);
    });

    app.get("/workflow/fluxos", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const filtros = z.object({
        ativo: z.coerce.boolean().optional(),
        gatilho: z.string().trim().max(60).optional()
      }).parse(request.query ?? {});
      return contexto.gestaoWorkflow.listarFluxos(ctx.negocio.id, filtros);
    });

    app.patch("/workflow/fluxos/:id/ativar", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body);
      return contexto.gestaoWorkflow.activarDesactivarFluxo(id, ctx.negocio.id, ativo);
    });

    app.post("/workflow/fluxos/:id/passos", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = PassoSchema.parse(request.body);
      return contexto.gestaoWorkflow.adicionarPasso(id, dados);
    });

    app.post("/workflow/fluxos/:id/executar", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      return contexto.gestaoWorkflow.executarFluxo(id);
    });

    app.get("/workflow/fluxos/:id/execucoes", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      return contexto.gestaoWorkflow.listarExecucoes(id);
    });

    /* ── Fluxos Condicionais (RF-T075) ────────────────────── */

    app.post("/workflow/fluxos/:id/passos-condicionais", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = z.object({
        tipo: z.string().trim().min(2).max(40),
        condicao: z.string().trim().min(2).max(500),
        acaoVerdadeira: z.string().trim().min(2).max(200),
        acaoFalsa: z.string().trim().max(200).optional(),
        ordem: z.number().int().min(1).optional()
      }).parse(request.body);
      return contexto.gestaoWorkflow.adicionarPassoCondicional(id, dados);
    });

    /* ── Sugestões de Próxima Acção (RF-T079) ──────────── */

    app.get("/workflow/sugestoes", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return contexto.gestaoWorkflow.sugerirProximaAccao(ctx.negocio.id, membro.id);
    });

    /* ── Widgets Contextuais ────────────────────────────── */

    app.get("/workflow/widgets/:contexto", async (request, reply) => {
      const ctx = await exigirWorkflow(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { contexto: ctxWidget } = z.object({
        contexto: z.enum(["PAINEL", "PEDIDOS", "CONVERSAS", "FINANCAS"])
      }).parse(request.params);
      return contexto.gestaoWorkflow.obterWidgetsContextuais(ctx.negocio.id, ctxWidget);
    });

    app.put("/workflow/notificacoes/configurar", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const dados = ConfigNotificacaoSchema.parse(request.body);
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return contexto.gestaoWorkflow.configurarNotificacao(ctx.negocio.id, membro.id, dados);
    });

    /* ── RF-T019 — Nível de Proactividade ─────────────── */

    app.put("/workflow/proactividade", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const { nivel } = z.object({
        nivel: z.enum(["MINIMO", "MODERADO", "COMPLETO"])
      }).parse(request.body);
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return contexto.gestaoWorkflow.configurarNivelProactividade(ctx.negocio.id, membro.id, nivel);
    });

    app.get("/workflow/proactividade", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return { nivel: await contexto.gestaoWorkflow.obterNivelProactividade(ctx.negocio.id, membro.id) };
    });

    app.get("/workflow/insights-filtrados", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return contexto.gestaoWorkflow.filtrarInsightsPorProactividade(ctx.negocio.id, membro.id);
    });

    app.get("/workflow/notificacoes", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return contexto.gestaoWorkflow.listarConfiguracoesNotificacao(ctx.negocio.id, membro.id);
    });
  }
};
