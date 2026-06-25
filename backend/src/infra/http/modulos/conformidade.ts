import { z } from "zod";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial, resolverContextoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const RegraFiscalSchema = z.object({
  jurisdicao: z.string().trim().max(5).optional(),
  tipoImposto: z.string().trim().max(20).optional(),
  taxa: z.number().min(0).max(100),
  descricao: z.string().trim().max(200).optional(),
  aplicavelA: z.string().trim().max(20).optional()
});

const NPSSchema = z.object({
  pontuacao: z.number().int().min(0).max(10),
  comentario: z.string().trim().max(500).optional(),
  modulo: z.string().trim().max(40).optional()
});

const MetricaAdopcaoSchema = z.object({
  dau: z.number().int().min(0),
  mau: z.number().int().min(0),
  profundidadeJson: z.string().max(2000).optional()
});

async function exigirConformidade(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    mensagemPermissao: "Sem permissão para aceder à conformidade."
  });
}

export const moduloConformidade: ModuloHttp = {
  nome: "conformidade",
  descricao: "Regras fiscais, multi-jurisdição, métricas ROI e NPS (Fase 6)",

  registrar(app, contexto) {

    // ── Regras Fiscais ─────────────────────────────────────────────

    app.post("/conformidade/regras-fiscais", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "pagamentos:gerir");
      if (!ctx) return;
      const dados = RegraFiscalSchema.parse(request.body);
      return contexto.conformidadeROI.criarRegraFiscal(ctx.negocio.id, dados);
    });

    app.get("/conformidade/regras-fiscais", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { jurisdicao } = z.object({ jurisdicao: z.string().trim().max(5).optional() }).parse(request.query ?? {});
      return contexto.conformidadeROI.listarRegrasFiscais(ctx.negocio.id, jurisdicao);
    });

    app.get("/conformidade/taxa-aplicavel", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { tipo } = z.object({ tipo: z.string().trim().max(20).optional() }).parse(request.query ?? {});
      return contexto.conformidadeROI.obterTaxaAplicavel(ctx.negocio.id, tipo);
    });

    app.get("/conformidade/retencao-fiscal", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      return contexto.conformidadeROI.verificarRetencaoFiscal(ctx.negocio.id);
    });

    // ── Multi-Jurisdição ───────────────────────────────────────────

    app.post("/conformidade/calcular-imposto", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { itens } = z.object({
        itens: z.array(z.object({
          valor: z.number().int().positive(),
          jurisdicao: z.string().trim().max(5).optional()
        })).min(1)
      }).parse(request.body);
      return contexto.conformidadeROI.calcularImpostoMultiJurisdicao(ctx.negocio.id, itens);
    });

    // ── Relatórios Fiscais Periódicos (RF-T094) ─────────────────────

    app.get("/conformidade/relatorio-fiscal", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "pagamentos:gerir");
      if (!ctx) return;
      const filtros = z.object({
        periodo: z.enum(["MENSAL", "TRIMESTRAL"]).optional(),
        de: z.coerce.date().optional(),
        ate: z.coerce.date().optional()
      }).parse(request.query ?? {});
      return contexto.conformidadeROI.gerarRelatorioFiscalPeriodico(ctx.negocio.id, filtros);
    });

    // ── Arquivo Digital de Facturas (RF-T095) ─────────────────────

    app.get("/conformidade/arquivo-facturas", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "pagamentos:gerir");
      if (!ctx) return;
      return contexto.conformidadeROI.verificarArquivoDigitalFacturas(ctx.negocio.id);
    });

    // ── Baselines e ROI ────────────────────────────────────────────

    app.post("/conformidade/baselines", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = z.object({
        modulo: z.string().trim().max(40),
        kpi: z.string().trim().max(40),
        valor: z.number()
      }).parse(request.body);
      return contexto.conformidadeROI.registarBaselineKPI(ctx.negocio.id, dados.modulo, dados.kpi, dados.valor);
    });

    app.get("/conformidade/baselines", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { modulo } = z.object({ modulo: z.string().trim().max(40).optional() }).parse(request.query ?? {});
      return contexto.conformidadeROI.obterBaselines(ctx.negocio.id, modulo);
    });

    app.get("/conformidade/roi/:modulo", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { modulo } = z.object({ modulo: z.string().trim().max(40) }).parse(request.params);
      return contexto.conformidadeROI.calcularROIModulo(ctx.negocio.id, modulo);
    });

    // ── Economia de Tempo (RF-T096) ──────────────────────────────────

    app.get("/conformidade/roi/economia-tempo", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      return contexto.conformidadeROI.calcularEconomiaTempo(ctx.negocio.id);
    });

    // ── Receita Atribuída (RF-T097) ────────────────────────────────

    app.get("/conformidade/roi/receita-atribuida", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      return contexto.conformidadeROI.calcularReceitaAtribuida(ctx.negocio.id);
    });

    // ── Comparação Antes/Depois (RF-T098) ──────────────────────────

    app.get("/conformidade/roi/antes-depois/:modulo", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { modulo } = z.object({ modulo: z.string().trim().max(40) }).parse(request.params);
      return contexto.conformidadeROI.compararAntesDepois(ctx.negocio.id, modulo);
    });

    // ── Custo Evitado (RF-T099) ────────────────────────────────────

    app.get("/conformidade/roi/custo-evitado", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      return contexto.conformidadeROI.calcularCustoEvitado(ctx.negocio.id);
    });

    // ── Métricas de Adopção ────────────────────────────────────────

    app.post("/conformidade/adopcao", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = MetricaAdopcaoSchema.parse(request.body);
      return contexto.conformidadeROI.registarMetricaAdopcao(ctx.negocio.id, dados);
    });

    app.get("/conformidade/adopcao", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const filtros = z.object({
        de: z.coerce.date().optional(),
        ate: z.coerce.date().optional()
      }).parse(request.query ?? {});
      return contexto.conformidadeROI.obterMetricasAdopcao(ctx.negocio.id, filtros);
    });

    // ── Métricas de Adopção IA (RF-T100-T103) ────────────────────

    app.get("/conformidade/adopcao-ia", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      return contexto.conformidadeROI.medirAdopcaoIA(ctx.negocio.id);
    });

    // ── Módulos Subutilizados (RF-T106) ───────────────────────

    app.get("/conformidade/modulos-subutilizados", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      return contexto.conformidadeROI.identificarModulosSubutilizados(ctx.negocio.id);
    });

    // ── NPS ────────────────────────────────────────────────────────

    app.post("/conformidade/nps", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const dados = NPSSchema.parse(request.body);
      return contexto.conformidadeROI.criarPesquisaNPS(ctx.negocio.id, { usuarioId: ctx.usuario.id, ...dados });
    });

    app.get("/conformidade/nps/resumo", async (request, reply) => {
      const ctx = await exigirConformidade(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { modulo } = z.object({ modulo: z.string().trim().max(40).optional() }).parse(request.query ?? {});
      return contexto.conformidadeROI.obterResumoNPS(ctx.negocio.id, modulo);
    });
  }
};
