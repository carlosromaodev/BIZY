import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial, resolverContextoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

/* ── Schemas ─────────────────────────────────────────────────── */

const CriarCategoriaSchema = z.object({
  nome: z.string().trim().min(2).max(60),
  tipo: z.enum(["RECEITA", "DESPESA"]),
  icone: z.string().trim().max(30).optional(),
  cor: z.string().trim().max(20).optional()
});

const CriarMovimentoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  categoriaId: z.string().uuid().optional(),
  descricao: z.string().trim().min(2).max(200),
  valor: z.number().int().positive(),
  origemTipo: z.string().trim().max(40).optional(),
  origemId: z.string().uuid().optional(),
  dataMovimento: z.coerce.date().optional(),
  observacao: z.string().trim().max(500).optional()
});

const CriarDespesaSchema = z.object({
  categoriaId: z.string().uuid().optional(),
  descricao: z.string().trim().min(2).max(200),
  valor: z.number().int().positive(),
  tipoRecorrencia: z.enum(["UNICA", "SEMANAL", "MENSAL"]).optional(),
  fornecedor: z.string().trim().max(120).optional(),
  comprovativoUrl: z.string().url().max(500).optional(),
  dataVencimento: z.coerce.date().optional(),
  observacao: z.string().trim().max(500).optional()
});

const CriarContaReceberSchema = z.object({
  clienteId: z.string().uuid().optional(),
  pedidoId: z.string().uuid().optional(),
  descricao: z.string().trim().min(2).max(200),
  valor: z.number().int().positive(),
  dataVencimento: z.coerce.date(),
  observacao: z.string().trim().max(500).optional()
});

const CriarContaPagarSchema = z.object({
  fornecedor: z.string().trim().min(2).max(120),
  descricao: z.string().trim().min(2).max(200),
  valor: z.number().int().positive(),
  dataVencimento: z.coerce.date(),
  observacao: z.string().trim().max(500).optional()
});

const OrcamentoSchema = z.object({
  categoriaId: z.string().uuid(),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2024).max(2030),
  valorOrcado: z.number().int().positive()
});

const FiltrosPeriodoSchema = z.object({
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional()
});

const FiltrosMovimentoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]).optional(),
  categoriaId: z.string().uuid().optional(),
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const FiltrosDespesaSchema = z.object({
  pago: z.coerce.boolean().optional(),
  categoriaId: z.string().uuid().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const FiltrosEstadoSchema = z.object({
  estado: z.string().trim().max(30).optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const MesAnoSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2024).max(2030)
});

const EmitirFacturaSchema = z.object({
  clienteNome: z.string().trim().min(2).max(200),
  clienteNif: z.string().trim().max(30).optional(),
  clienteEndereco: z.string().trim().max(300).optional(),
  pedidoId: z.string().uuid().optional(),
  serie: z.string().trim().max(10).optional(),
  ivaPercentual: z.number().min(0).max(100).optional(),
  observacao: z.string().trim().max(500).optional(),
  itens: z.array(z.object({
    descricao: z.string().trim().min(1).max(200),
    quantidade: z.number().int().positive(),
    precoUnitario: z.number().int().positive()
  })).min(1)
});

const AnularFacturaSchema = z.object({
  motivo: z.string().trim().min(5).max(300)
});

const EmitirNotaCreditoSchema = z.object({
  facturaId: z.string().uuid(),
  motivo: z.string().trim().min(5).max(300),
  valor: z.number().int().positive()
});

const FiltrosFacturaSchema = z.object({
  estado: z.string().trim().max(20).optional(),
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const GerarReciboSchema = z.object({
  clienteNome: z.string().trim().min(2).max(200),
  clienteNif: z.string().trim().max(30).optional(),
  valorPago: z.number().int().positive(),
  metodoPagamento: z.string().trim().max(60).optional(),
  referencia: z.string().trim().max(100).optional(),
  facturaId: z.string().uuid().optional(),
  observacao: z.string().trim().max(500).optional()
});

/* ── Módulo HTTP ──────────────────────────────────────────────── */

export const moduloFinancas: ModuloHttp = {
  nome: "financas",
  descricao: "Gestão financeira — categorias, movimentos, despesas, contas a receber/pagar, fluxo de caixa, DRE e orçamento.",

  registrar(app, contexto) {

    /* ── Categorias ──────────────────────────────────────────── */

    app.get("/financas/categorias", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const categorias = await contexto.gestaoFinancas.listarCategorias(ctx.negocio.id);
      return { categorias };
    });

    app.post("/financas/categorias", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarCategoriaSchema.parse(request.body ?? {});
      const categoria = await contexto.gestaoFinancas.criarCategoria(ctx.negocio.id, dados);
      return reply.code(201).send({ categoria });
    });

    app.post("/financas/categorias/inicializar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.inicializarCategoriasPadrao(ctx.negocio.id);
      return resultado;
    });

    /* ── Movimentos (Ledger) ─────────────────────────────────── */

    app.get("/financas/movimentos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosMovimentoSchema.parse(request.query ?? {});
      const movimentos = await contexto.gestaoFinancas.listarMovimentos(ctx.negocio.id, filtros);
      return { movimentos };
    });

    app.post("/financas/movimentos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarMovimentoSchema.parse(request.body ?? {});
      const movimento = await contexto.gestaoFinancas.registarMovimento(ctx.negocio.id, {
        ...dados,
        responsavelId: ctx.usuario.id
      });
      return reply.code(201).send({ movimento });
    });

    /* ── Fluxo de Caixa ──────────────────────────────────────── */

    app.get("/financas/fluxo-caixa", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosPeriodoSchema.parse(request.query ?? {});
      const de = filtros.de ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const ate = filtros.ate ?? new Date();
      const resultado = await contexto.gestaoFinancas.obterFluxoCaixa(ctx.negocio.id, de, ate);
      return resultado;
    });

    /* ── DRE ─────────────────────────────────────────────────── */

    app.get("/financas/dre", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { mes, ano } = MesAnoSchema.parse(request.query ?? {});
      const resultado = await contexto.gestaoFinancas.obterDRE(ctx.negocio.id, mes, ano);
      return resultado;
    });

    /* ── Despesas ─────────────────────────────────────────────── */

    app.get("/financas/despesas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosDespesaSchema.parse(request.query ?? {});
      const despesas = await contexto.gestaoFinancas.listarDespesas(ctx.negocio.id, filtros);
      return { despesas };
    });

    app.post("/financas/despesas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarDespesaSchema.parse(request.body ?? {});
      const despesa = await contexto.gestaoFinancas.criarDespesa(ctx.negocio.id, dados);
      return reply.code(201).send({ despesa });
    });

    app.post("/financas/despesas/:id/pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const despesa = await contexto.gestaoFinancas.marcarDespesaPaga(id, ctx.negocio.id);
      return { despesa };
    });

    /* ── Contas a Receber ─────────────────────────────────────── */

    app.get("/financas/contas-receber", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosEstadoSchema.parse(request.query ?? {});
      const contas = await contexto.gestaoFinancas.listarContasReceber(ctx.negocio.id, filtros);
      return { contas };
    });

    app.post("/financas/contas-receber", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarContaReceberSchema.parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.criarContaReceber(ctx.negocio.id, dados);
      return reply.code(201).send({ conta });
    });

    app.get("/financas/contas-receber/aging", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const aging = await contexto.gestaoFinancas.obterAgingReceber(ctx.negocio.id);
      return aging;
    });

    app.post("/financas/contas-receber/:id/receber", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { valorPago } = z.object({ valorPago: z.number().int().positive() }).parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.receberPagamento(id, ctx.negocio.id, valorPago);
      return { conta };
    });

    /* ── Contas a Pagar ───────────────────────────────────────── */

    app.get("/financas/contas-pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosEstadoSchema.parse(request.query ?? {});
      const contas = await contexto.gestaoFinancas.listarContasPagar(ctx.negocio.id, filtros);
      return { contas };
    });

    app.post("/financas/contas-pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = CriarContaPagarSchema.parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.criarContaPagar(ctx.negocio.id, dados);
      return reply.code(201).send({ conta });
    });

    app.post("/financas/contas-pagar/:id/pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const conta = await contexto.gestaoFinancas.pagarConta(id, ctx.negocio.id);
      return { conta };
    });

    /* ── Facturação ───────────────────────────────────────────── */

    app.get("/financas/facturas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = FiltrosFacturaSchema.parse(request.query ?? {});
      const facturas = await contexto.gestaoFinancas.listarFacturas(ctx.negocio.id, filtros);
      return { facturas };
    });

    app.post("/financas/facturas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = EmitirFacturaSchema.parse(request.body ?? {});
      const factura = await contexto.gestaoFinancas.emitirFactura(ctx.negocio.id, dados);
      return reply.code(201).send({ factura });
    });

    app.get("/financas/facturas/:id", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const factura = await contexto.gestaoFinancas.obterFactura(id, ctx.negocio.id);
      if (!factura) return reply.code(404).send({ erro: "Factura não encontrada." });
      return { factura };
    });

    app.post("/financas/facturas/:id/anular", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { motivo } = AnularFacturaSchema.parse(request.body ?? {});
      const factura = await contexto.gestaoFinancas.anularFactura(id, ctx.negocio.id, motivo);
      return { factura };
    });

    app.get("/financas/facturas/:id/pdf", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const pdfBuffer = await contexto.gestaoFinancas.gerarPdfFactura(id, ctx.negocio.id);

      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `inline; filename="factura-${id}.pdf"`)
        .send(pdfBuffer);
    });

    /* ── Notas de Crédito ────────────────────────────────────── */

    app.post("/financas/notas-credito", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = EmitirNotaCreditoSchema.parse(request.body ?? {});
      const nota = await contexto.gestaoFinancas.emitirNotaCredito(ctx.negocio.id, dados);
      return reply.code(201).send({ nota });
    });

    /* ── Recibos de Pagamento ───────────────────────────────── */

    app.post("/financas/recibos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = GerarReciboSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoFinancas.gerarReciboPagamento(ctx.negocio.id, dados);

      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `inline; filename="recibo-${resultado.numero}-${resultado.anoFiscal}.pdf"`)
        .send(resultado.pdf);
    });

    /* ── Alertas de Pagamentos ───────────────────────────────── */

    app.get("/financas/alertas-pagamentos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.obterAlertasPagamentos(ctx.negocio.id);
      return resultado;
    });

    /* ── Despesas Recorrentes ─────────────────────────────────── */

    app.post("/financas/despesas-recorrentes/processar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.processarDespesasRecorrentes(ctx.negocio.id);
      return resultado;
    });

    /* ── Cobrança Automática (RF-T029) ──────────────────────── */

    app.post("/financas/cobrancas/gerar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.gerarCobrancasVencidas(ctx.negocio.id);
      return resultado;
    });

    /* ── Taxa de Inadimplência (RF-T030) ─────────────────────── */

    app.get("/financas/inadimplencia", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const filtros = z.object({
        de: z.coerce.date().optional(),
        ate: z.coerce.date().optional()
      }).parse(request.query ?? {});

      const resultado = await contexto.gestaoFinancas.calcularTaxaInadimplencia(ctx.negocio.id, filtros);
      return resultado;
    });

    /* ── Risco de Inadimplência (RF-T031) ───────────────────── */

    app.get("/financas/risco-inadimplencia", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.calcularRiscoInadimplencia(ctx.negocio.id);
      return resultado;
    });

    /* ── Priorização de Pagamentos (RF-T033) ─────────────────── */

    app.get("/financas/pagamentos/priorizacao", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.priorizarPagamentos(ctx.negocio.id);
      return resultado;
    });

    /* ── Orçamento ────────────────────────────────────────────── */

    app.put("/financas/orcamento", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:gestao");
      if (!ctx) return;

      const dados = OrcamentoSchema.parse(request.body ?? {});
      const orcamento = await contexto.gestaoFinancas.definirOrcamento(ctx.negocio.id, dados);
      return { orcamento };
    });

    app.get("/financas/orcamento/comparativo", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { mes, ano } = MesAnoSchema.parse(request.query ?? {});
      const comparativo = await contexto.gestaoFinancas.obterOrcadoVsRealizado(ctx.negocio.id, mes, ano);
      return { comparativo };
    });
  }
};

/* ── Helper de permissão ──────────────────────────────────────── */

async function exigirFinancas(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    modulo: "crm",
    mensagemPermissao: "Sem permissão para aceder às finanças.",
    mensagemModulo: "Módulo financeiro desativado para este negócio."
  });
}
