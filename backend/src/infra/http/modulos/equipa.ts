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
  limite: z.coerce.number().int().min(1).max(200).optional(),
  autorId: z.string().uuid().optional()
});

const FiltrosDesempenhoSchema = z.object({
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional()
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

    /* ── Desempenho / KPIs ─────────────────────────────────── */

    app.get("/equipa/desempenho", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosDesempenhoSchema.parse(request.query ?? {});
      const periodo = filtros.de && filtros.ate ? { de: filtros.de, ate: filtros.ate } : undefined;
      const resultado = await contexto.gestaoEquipa.obterDesempenhoEquipa(ctx.negocio.id, periodo);
      return resultado;
    });

    /* ── Evolução Temporal (RF-T053) ───────────────────────── */

    app.get("/equipa/desempenho/:id/evolucao", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { periodos } = z.object({ periodos: z.coerce.number().int().min(1).max(12).optional() }).parse(request.query ?? {});
      const resultado = await contexto.gestaoEquipa.obterEvolucaoDesempenho(ctx.negocio.id, id, periodos);
      return resultado;
    });

    /* ── Gamificação (RN-T040 / RF-T120) ────────────────── */

    app.get("/equipa/gamificacao", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const config = await contexto.gestaoEquipa.obterConfiguracaoGamificacao(ctx.negocio.id);
      return { configuracao: config };
    });

    app.put("/equipa/gamificacao", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = z.object({
        ativo: z.boolean().optional(),
        kpiPrincipal: z.string().trim().max(40).optional(),
        periodo: z.enum(["SEMANAL", "MENSAL"]).optional(),
        recompensa: z.string().trim().max(200).optional()
      }).parse(request.body ?? {});

      const config = await contexto.gestaoEquipa.actualizarConfiguracaoGamificacao(ctx.negocio.id, dados);
      return { configuracao: config };
    });

    /* ── Inactividade (RN-T036) ─────────────────────────── */

    app.post("/equipa/inactividade/verificar", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const resultado = await contexto.gestaoEquipa.suspenderMembrosInactivos(ctx.negocio.id);
      return resultado;
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

      const { token, termosAceites } = z.object({
        token: z.string().uuid(),
        termosAceites: z.boolean().optional()
      }).parse(request.body ?? {});
      try {
        const resultado = await contexto.gestaoEquipa.aceitarConvite(token, ctx.usuario.id, termosAceites);
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

    /* ── Mascaramento de Dados ─────────────────────────────── */

    app.get("/equipa/mascaramento", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const regras = await contexto.gestaoEquipa.listarMascaramento(ctx.negocio.id);
      return { regras };
    });

    app.post("/equipa/mascaramento", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = z.object({
        papel: z.string().trim().min(2).max(40),
        campo: z.string().trim().min(2).max(60),
        tipo: z.enum(["PARCIAL", "OCULTO", "HASH"]).optional()
      }).parse(request.body ?? {});

      const regra = await contexto.gestaoEquipa.configurarMascaramento(ctx.negocio.id, dados);
      return reply.code(201).send({ regra });
    });

    app.delete("/equipa/mascaramento/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      await contexto.gestaoEquipa.removerMascaramento(id, ctx.negocio.id);
      return { ok: true };
    });

    /* ── Onboarding Checklist ────────────────────────────────── */

    app.get("/equipa/onboarding/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const checklist = await contexto.gestaoEquipa.listarChecklistOnboarding(id);
      return { checklist };
    });

    app.get("/equipa/onboarding", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const resumo = await contexto.gestaoEquipa.resumoOnboardingEquipa(ctx.negocio.id);
      return { membros: resumo };
    });

    app.post("/equipa/onboarding/:id/completar", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { item } = z.object({ item: z.string().trim().min(1).max(60) }).parse(request.body ?? {});
      await contexto.gestaoEquipa.marcarItemOnboarding(id, item);
      return { ok: true };
    });

    /* ── Metas de Vendas ─────────────────────────────────────── */

    app.get("/equipa/metas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        tipo: z.enum(["INDIVIDUAL", "EQUIPA"]).optional(),
        membroId: z.string().uuid().optional(),
        periodo: z.enum(["DIARIO", "SEMANAL", "MENSAL"]).optional(),
        limite: z.coerce.number().int().min(1).max(200).optional()
      }).parse(request.query ?? {});

      const metas = await contexto.gestaoEquipa.listarMetas(ctx.negocio.id, filtros);
      return { metas };
    });

    app.post("/equipa/metas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = z.object({
        membroId: z.string().uuid().optional(),
        tipo: z.enum(["INDIVIDUAL", "EQUIPA"]).optional(),
        kpi: z.enum(["VENDAS_VALOR", "VENDAS_QTD", "CONVERSAO"]).optional(),
        periodo: z.enum(["DIARIO", "SEMANAL", "MENSAL"]).optional(),
        valorMeta: z.number().int().positive(),
        mes: z.number().int().min(1).max(12).optional(),
        ano: z.number().int().min(2024).max(2030).optional()
      }).parse(request.body ?? {});

      const meta = await contexto.gestaoEquipa.criarMeta(ctx.negocio.id, dados);
      return reply.code(201).send({ meta });
    });

    /* ── Alertas de Metas (RF-T057) ──────────────────────────── */

    app.get("/equipa/metas/alertas", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.gestaoEquipa.obterAlertasMetas(ctx.negocio.id);
      return resultado;
    });

    /* ── Bónus/Comissão por Meta (RF-T058) ───────────────────── */

    app.get("/equipa/metas/bonus", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        mes: z.coerce.number().int().min(1).max(12).optional(),
        ano: z.coerce.number().int().min(2024).max(2030).optional(),
        membroId: z.string().uuid().optional()
      }).parse(request.query ?? {});

      const resultado = await contexto.gestaoEquipa.calcularBonusComissao(ctx.negocio.id, filtros);
      return resultado;
    });

    app.get("/equipa/metas/:id/progresso", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const progresso = await contexto.gestaoEquipa.obterProgressoMeta(id, ctx.negocio.id);
      return { progresso };
    });

    app.delete("/equipa/metas/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      await contexto.gestaoEquipa.eliminarMeta(id, ctx.negocio.id);
      return { ok: true };
    });

    /* ── Turnos e Presença ────────────────────────────────────── */

    app.get("/equipa/turnos", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { membroId } = z.object({ membroId: z.string().uuid().optional() }).parse(request.query ?? {});
      const turnos = await contexto.gestaoEquipa.listarTurnos(ctx.negocio.id, membroId);
      return { turnos };
    });

    app.post("/equipa/turnos", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = z.object({
        membroId: z.string().uuid(),
        diaSemana: z.number().int().min(0).max(6),
        horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
        horaFim: z.string().regex(/^\d{2}:\d{2}$/)
      }).parse(request.body ?? {});

      const turno = await contexto.gestaoEquipa.definirTurno(ctx.negocio.id, dados);
      return reply.code(201).send({ turno });
    });

    app.delete("/equipa/turnos/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      await contexto.gestaoEquipa.removerTurno(id, ctx.negocio.id);
      return { ok: true };
    });

    app.get("/equipa/disponibilidade", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const disponibilidade = await contexto.gestaoEquipa.obterDisponibilidadeActual(ctx.negocio.id);
      return { disponibilidade };
    });

    app.post("/equipa/presenca", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const dados = z.object({
        membroId: z.string().uuid(),
        tipo: z.enum(["CHECK_IN", "CHECK_OUT"]),
        metodo: z.enum(["MANUAL", "WHATSAPP", "AUTOMATICO"]).optional(),
        observacao: z.string().trim().max(200).optional()
      }).parse(request.body ?? {});

      const registo = await contexto.gestaoEquipa.registarPresenca(ctx.negocio.id, dados);
      return reply.code(201).send({ registo });
    });

    app.get("/equipa/presenca", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        membroId: z.string().uuid().optional(),
        de: z.coerce.date().optional(),
        ate: z.coerce.date().optional(),
        limite: z.coerce.number().int().min(1).max(500).optional()
      }).parse(request.query ?? {});

      const registos = await contexto.gestaoEquipa.listarPresencas(ctx.negocio.id, filtros);
      return { registos };
    });

    /* ── Passagem de Turno (RF-T116) ─────────────────────────── */

    app.get("/equipa/passagem-turno/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const relatorio = await contexto.gestaoEquipa.gerarRelatorioPassagemTurno(ctx.negocio.id, id);
      return relatorio;
    });

    /* ── Widget Comissão Estimada (RF-T118) ──────────────────── */

    app.get("/equipa/comissao-estimada", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.gestaoEquipa.obterComissaoEstimada(ctx.negocio.id, ctx.usuario.id);
      return resultado;
    });

    /* ── Horas Trabalhadas ─────────────────────────────────────── */

    app.get("/equipa/horas-trabalhadas/:id", async (request, reply) => {
      const ctx = await exigirEquipa(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { de, ate } = z.object({
        de: z.coerce.date(),
        ate: z.coerce.date()
      }).parse(request.query ?? {});

      const resultado = await contexto.gestaoEquipa.calcularHorasTrabalhadas(ctx.negocio.id, id, de, ate);
      return resultado;
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
