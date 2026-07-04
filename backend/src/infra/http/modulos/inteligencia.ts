import { z } from "zod";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const IndicadorExternoSchema = z.object({
  fonte: z.string().trim().min(2).max(80).optional(),
  chave: z.string().trim().min(1).max(80),
  periodo: z.string().trim().min(4).max(40),
  valor: z.number(),
  unidade: z.string().trim().max(40).optional(),
  segmento: z.string().trim().max(80).optional(),
  metadados: z.record(z.string(), z.unknown()).optional()
});

const ImportarFontesExternasSchema = z.object({
  fonte: z.string().trim().min(2).max(80),
  indicadores: z.array(IndicadorExternoSchema).max(500).optional(),
  conteudoCsv: z.string().max(200_000).optional()
}).refine((dados) => (dados.indicadores?.length ?? 0) > 0 || Boolean(dados.conteudoCsv?.trim()), {
  message: "Informe indicadores JSON ou conteudoCsv."
});

const OpcoesRecalculoPreditivoSchema = z.object({
  semanasDemanda: z.number().int().min(1).max(12).optional(),
  semanasCaixa: z.number().int().min(4).max(26).optional(),
  mesesReceita: z.number().int().min(1).max(12).optional()
});

const RecalculoPreditivoLoteSchema = OpcoesRecalculoPreditivoSchema.extend({
  negocioIds: z.array(z.string().uuid()).min(1).max(100),
  concorrencia: z.number().int().min(1).max(20).optional()
});

export const moduloInteligencia: ModuloHttp = {
  nome: "inteligencia",
  descricao: "Motor de inteligência preditiva — RFM, segmentação, LTV, previsão fluxo caixa, anomalias, carga equipa, funil.",

  registrar(app, contexto) {

    /* ── Scoring RFM e Segmentação (RF-T005, RF-T006) ──────── */

    app.get("/inteligencia/rfm", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.calcularRFMClientes(ctx.negocio.id);
      return resultado;
    });

    /* ── Alertas Churn VIP (RF-T007) ────────────────────────── */

    app.get("/inteligencia/churn-vip", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.obterAlertasChurnVIP(ctx.negocio.id);
      return resultado;
    });

    /* ── LTV (RF-T008) ──────────────────────────────────────── */

    app.get("/inteligencia/ltv", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.calcularLTV(ctx.negocio.id);
      return resultado;
    });

    /* ── Previsão Fluxo de Caixa (RF-T010, RF-T011) ────────── */

    app.get("/inteligencia/previsao-caixa", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { semanas } = z.object({
        semanas: z.coerce.number().int().min(4).max(26).optional()
      }).parse(request.query ?? {});

      const resultado = await contexto.inteligenciaPreditiva.preverFluxoCaixa(ctx.negocio.id, semanas);
      return resultado;
    });

    /* ── Fontes Externas Preditivas (RNF-T024) ─────────────── */

    app.post("/inteligencia/fontes-externas", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      const dados = ImportarFontesExternasSchema.parse(request.body);
      const resultado = await contexto.inteligenciaPreditiva.importarFontesExternasPreditivas(ctx.negocio.id, {
        ...dados,
        criadoPorId: ctx.usuario.id
      });
      reply.code(201);
      return resultado;
    });

    app.get("/inteligencia/fontes-externas", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        fonte: z.string().trim().max(80).optional(),
        chave: z.string().trim().max(80).optional(),
        segmento: z.string().trim().max(80).optional(),
        limite: z.coerce.number().int().min(1).max(500).optional()
      }).parse(request.query ?? {});

      return contexto.inteligenciaPreditiva.listarFontesExternasPreditivas(ctx.negocio.id, filtros);
    });

    /* ── Detecção de Anomalias (RF-T013) ────────────────────── */

    app.get("/inteligencia/anomalias", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.detectarAnomalias(ctx.negocio.id);
      return resultado;
    });

    /* ── Carga da Equipa (RF-T015) ──────────────────────────── */

    app.get("/inteligencia/carga-equipa", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.analisarCargaEquipa(ctx.negocio.id);
      return resultado;
    });

    /* ── Funil Comercial (RF-T016) ──────────────────────────── */

    app.get("/inteligencia/funil", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.analisarFunilComercial(ctx.negocio.id);
      return resultado;
    });

    /* ── Previsão de Demanda por SKU (RF-T001, RF-T002) ────── */

    app.post("/inteligencia/previsao-demanda", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      const { semanas } = z.object({
        semanas: z.coerce.number().int().min(1).max(12).optional()
      }).parse(request.body ?? {});

      return contexto.inteligenciaPreditiva.preverDemandaPorSKU(ctx.negocio.id, semanas);
    });

    app.get("/inteligencia/alertas-stock", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      return contexto.inteligenciaPreditiva.obterAlertasReposicaoStock(ctx.negocio.id);
    });

    app.post("/inteligencia/recalcular", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      const opcoes = OpcoesRecalculoPreditivoSchema.parse(request.body ?? {});

      return contexto.inteligenciaPreditiva.recalcularPrevisoesComDegradacao(ctx.negocio.id, opcoes);
    });

    app.post("/inteligencia/recalcular/async", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      const opcoes = OpcoesRecalculoPreditivoSchema.parse(request.body ?? {});

      const resultado = await contexto.inteligenciaPreditiva.enfileirarRecalculoPreditivo(ctx.negocio.id, {
        ...opcoes,
        solicitadoPorId: ctx.usuario.id
      });
      return reply.code(202).send(resultado);
    });

    app.post("/inteligencia/recalcular/lote/async", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      const dados = RecalculoPreditivoLoteSchema.parse(request.body ?? {});
      const negocioIds = [...new Set(dados.negocioIds)];
      const acessos = await Promise.all(
        negocioIds.map(async (negocioId) => ({
          negocioId,
          negocio: await contexto.repositorios.autenticacao.buscarNegocioPorUsuario(ctx.usuario.id, negocioId)
        }))
      );
      const bloqueados = acessos.filter((acesso) => !acesso.negocio).map((acesso) => acesso.negocioId);
      if (bloqueados.length > 0) {
        return reply.code(403).send({
          erro: "NEGOCIOS_NAO_AUTORIZADOS",
          mensagem: "Existem negócios fora do teu acesso.",
          negocioIds: bloqueados
        });
      }

      const resultado = await contexto.inteligenciaPreditiva.enfileirarRecalculoPreditivoLote(negocioIds, {
        semanasDemanda: dados.semanasDemanda,
        semanasCaixa: dados.semanasCaixa,
        mesesReceita: dados.mesesReceita,
        concorrencia: dados.concorrencia,
        solicitadoPorId: ctx.usuario.id
      });
      return reply.code(202).send(resultado);
    });

    /* ── Scores Persistidos (ScoreCliente) ──────────────────── */

    app.post("/inteligencia/scores/persistir", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      return contexto.inteligenciaPreditiva.persistirScoresClientes(ctx.negocio.id);
    });

    app.get("/inteligencia/scores", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        tipoScore: z.string().trim().max(20).optional(),
        segmento: z.string().trim().max(20).optional(),
        limite: z.coerce.number().int().min(1).max(500).optional()
      }).parse(request.query ?? {});

      return contexto.inteligenciaPreditiva.obterScoresClientes(ctx.negocio.id, filtros);
    });

    /* ── Insights Preditivos (RF-T017 — Ambient Analytics) ─── */

    app.post("/inteligencia/insights", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;

      const dados = z.object({
        tipo: z.string().trim().min(2).max(40),
        titulo: z.string().trim().min(2).max(200),
        descricao: z.string().trim().min(2).max(1000),
        confianca: z.number().min(0).max(1),
        acaoSugerida: z.string().trim().max(500).optional(),
        entidadeTipo: z.string().trim().max(40).optional(),
        entidadeId: z.string().uuid().optional()
      }).parse(request.body);

      return contexto.inteligenciaPreditiva.gerarInsightPreditivo(ctx.negocio.id, dados);
    });

    app.get("/inteligencia/insights", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        tipo: z.string().trim().max(40).optional(),
        nivelConfianca: z.string().trim().max(10).optional(),
        limite: z.coerce.number().int().min(1).max(200).optional()
      }).parse(request.query ?? {});

      return contexto.inteligenciaPreditiva.listarInsights(ctx.negocio.id, filtros);
    });

    /* ── Produtos Encalhados (RF-T003) ────────────────────── */

    app.get("/inteligencia/produtos-encalhados", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { dias } = z.object({
        dias: z.coerce.number().int().min(7).max(365).optional()
      }).parse(request.query ?? {});

      return contexto.inteligenciaPreditiva.identificarProdutosEncalhados(ctx.negocio.id, dias);
    });

    /* ── Padrões Sazonais (RF-T004) ────────────────────────── */

    app.get("/inteligencia/sazonalidade", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      return contexto.inteligenciaPreditiva.detectarPadroesSazonais(ctx.negocio.id);
    });

    /* ── Lead Scoring (RF-T009) ────────────────────────────── */

    app.get("/inteligencia/lead-scoring", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      return contexto.inteligenciaPreditiva.calcularLeadScoring(ctx.negocio.id);
    });

    /* ── Previsão de Receita Mensal (RF-T012) ──────────────── */

    app.get("/inteligencia/previsao-receita", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { meses } = z.object({
        meses: z.coerce.number().int().min(1).max(12).optional()
      }).parse(request.query ?? {});

      return contexto.inteligenciaPreditiva.preverReceitaMensal(ctx.negocio.id, meses);
    });

    /* ── Previsão de Atrasos em Projectos (RF-T014) ────────── */

    app.get("/inteligencia/previsao-atrasos", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      return contexto.inteligenciaPreditiva.preverAtrasosProjectos(ctx.negocio.id);
    });

    /* ── Guarda Mínimo de Dados (RN-T015) ──────────────────── */

    app.get("/inteligencia/elegibilidade", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      return contexto.inteligenciaPreditiva.verificarMinimoParaPrevisao(ctx.negocio.id);
    });

    /* ── Feedback de Insights (RN-T018) ────────────────────── */

    app.post("/inteligencia/insights/:id/feedback", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const { accao, comentario } = z.object({
        accao: z.enum(["ACEITE", "REJEITADO", "IGNORADO"]),
        comentario: z.string().trim().max(500).optional()
      }).parse(request.body);

      return contexto.inteligenciaPreditiva.registarFeedbackInsight(id, ctx.usuario.id, accao, comentario);
    });
  }
};

/* ── Helper de permissão ──────────────────────────────────────── */

async function exigirInteligencia(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    modulo: "crm",
    mensagemPermissao: "Sem permissão para aceder à inteligência preditiva.",
    mensagemModulo: "Módulo de inteligência desativado para este negócio."
  });
}
