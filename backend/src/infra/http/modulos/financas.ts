import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial, resolverContextoComercial } from "../contextoComercial.js";
import { classificarErroHttp } from "../errosHttp.js";
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
  observacao: z.string().trim().max(500).optional(),
  documentoFiscal: z.enum(["NENHUM", "FACTURA", "FACTURA_RECIBO", "RECIBO"]).default("NENHUM"),
  clienteNome: z.string().trim().min(2).max(200).optional(),
  clienteNif: z.string().trim().max(30).optional(),
  clienteEndereco: z.string().trim().max(300).optional(),
  pedidoId: z.string().uuid().optional(),
  facturaId: z.string().uuid().optional(),
  movimentoOrigemId: z.string().uuid().optional(),
  ivaPercentual: z.number().min(0).max(100).optional(),
  dataVencimento: z.coerce.date().optional(),
  metodoPagamento: z.string().trim().max(60).optional(),
  referenciaPagamento: z.string().trim().max(100).optional(),
  comprovativoUrl: z.string().url().max(500).optional(),
  itensDocumento: z.array(z.object({
    descricao: z.string().trim().min(1).max(200),
    quantidade: z.number().int().positive(),
    precoUnitario: z.number().int().positive()
  })).max(100).optional()
});
type DadosCriarMovimentoFinanceiro = z.infer<typeof CriarMovimentoSchema>;

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

const DadosPagamentoSchema = z.object({
  valorPago: z.number().int().positive().optional(),
  metodoPagamento: z.string().trim().max(60).optional(),
  referenciaPagamento: z.string().trim().max(100).optional(),
  comprovativoUrl: z.string().url().max(500).optional(),
  observacao: z.string().trim().max(500).optional()
});

const CriarContaReceberSchema = z.object({
  clienteId: z.string().uuid().optional(),
  pedidoId: z.string().uuid().optional(),
  facturaId: z.string().uuid().optional(),
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

const ImportarExtratoBancarioSchema = z.object({
  nomeArquivo: z.string().trim().min(1).max(200),
  formato: z.enum(["CSV", "OFX"]).default("CSV"),
  conteudo: z.string().min(1).max(2_000_000)
});

const FiltrosReconciliacaoSchema = z.object({
  estadoConciliacao: z.enum(["PENDENTE", "CONCILIADO", "IGNORADO"]).optional(),
  importacaoId: z.string().uuid().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const ConciliarMovimentoBancarioSchema = z.object({
  movimentoFinanceiroId: z.string().uuid()
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
  movimentoOrigemId: z.string().uuid().optional(),
  tipoDocumento: z.enum(["FACTURA", "FACTURA_RECIBO"]).optional(),
  serie: z.string().trim().max(10).optional(),
  ivaPercentual: z.number().min(0).max(100).optional(),
  dataVencimento: z.coerce.date().optional(),
  metodoPagamento: z.string().trim().max(60).optional(),
  referenciaPagamento: z.string().trim().max(100).optional(),
  comprovativoUrl: z.string().url().max(500).optional(),
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
  pedidoId: z.string().uuid().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const GerarReciboSchema = z.object({
  clienteNome: z.string().trim().min(2).max(200),
  clienteNif: z.string().trim().max(30).optional(),
  valorPago: z.number().int().positive(),
  metodoPagamento: z.string().trim().max(60).optional(),
  referencia: z.string().trim().max(100).optional(),
  comprovativoUrl: z.string().url().max(500).optional(),
  facturaId: z.string().uuid().optional(),
  observacao: z.string().trim().max(500).optional()
});

const ValidarDescontoSchema = z.object({
  percentualDesconto: z.number().min(0).max(100),
  aprovadorId: z.string().uuid().optional()
});

const RegistarReembolsoSchema = z.object({
  descricao: z.string().trim().min(2).max(200),
  valor: z.number().int().positive(),
  pedidoId: z.string().uuid().optional(),
  facturaId: z.string().uuid().optional(),
  notaCreditoId: z.string().uuid().optional(),
  observacao: z.string().trim().max(500).optional()
});

const MovimentoMultiMoedaSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  categoriaId: z.string().uuid().optional(),
  descricao: z.string().trim().min(2).max(200),
  valor: z.number().int().positive(),
  origemTipo: z.string().trim().max(40).optional(),
  origemId: z.string().uuid().optional(),
  dataMovimento: z.coerce.date().optional(),
  observacao: z.string().trim().max(500).optional(),
  moedaOriginal: z.string().trim().max(10).optional(),
  taxaCambio: z.number().positive().optional(),
  valorOriginal: z.number().positive().optional()
});

type EstadoSaudeFinanceira = "OK" | "DEGRADADO" | "INDISPONIVEL";

type EndpointApiFinanceira = {
  metodo: "get" | "post" | "put";
  path: string;
  permissao: "financas:leitura" | "financas:escrita" | "financas:aprovacao";
  resumo: string;
  query?: string[];
  body?: string[];
  resposta: string;
};

const ENDPOINTS_API_FINANCEIRA: EndpointApiFinanceira[] = [
  { metodo: "get", path: "/financas/categorias", permissao: "financas:leitura", resumo: "Lista categorias financeiras activas.", resposta: "{ categorias }" },
  { metodo: "post", path: "/financas/categorias", permissao: "financas:escrita", resumo: "Cria categoria de receita/despesa.", body: ["nome", "tipo", "icone?", "cor?"], resposta: "{ categoria }" },
  { metodo: "get", path: "/financas/movimentos", permissao: "financas:leitura", resumo: "Lista movimentos do ledger financeiro.", query: ["tipo?", "categoriaId?", "de?", "ate?", "limite?"], resposta: "{ movimentos }" },
  { metodo: "post", path: "/financas/movimentos", permissao: "financas:escrita", resumo: "Regista movimento ou aciona documento fiscal conforme a origem financeira.", body: ["tipo", "categoriaId?", "descricao", "valor", "origemTipo?", "origemId?", "documentoFiscal?", "clienteNome?", "facturaId?", "pedidoId?", "movimentoOrigemId?", "itensDocumento?", "metodoPagamento?", "referenciaPagamento?", "comprovativoUrl?", "dataMovimento?", "observacao?"], resposta: "{ tipoResultado, movimento? | factura? | pedido? | recibo? }" },
  { metodo: "post", path: "/financas/movimentos/multi-moeda", permissao: "financas:escrita", resumo: "Regista movimento com moeda original e taxa de câmbio.", body: ["tipo", "descricao", "valor", "moedaOriginal?", "taxaCambio?", "valorOriginal?"], resposta: "{ movimento }" },
  { metodo: "post", path: "/financas/reconciliacao/importar", permissao: "financas:escrita", resumo: "Importa extracto bancário CSV/OFX para reconciliação assistida.", body: ["nomeArquivo", "formato", "conteudo"], resposta: "{ importacao, movimentos, total, pendentes, comSugestoes }" },
  { metodo: "get", path: "/financas/reconciliacao/importacoes", permissao: "financas:leitura", resumo: "Lista lotes de extractos bancários importados.", query: ["limite?"], resposta: "{ importacoes }" },
  { metodo: "get", path: "/financas/reconciliacao/movimentos", permissao: "financas:leitura", resumo: "Lista movimentos bancários conciliáveis.", query: ["estadoConciliacao?", "importacaoId?", "limite?"], resposta: "{ movimentos }" },
  { metodo: "post", path: "/financas/reconciliacao/movimentos/{id}/conciliar", permissao: "financas:escrita", resumo: "Concilia movimento bancário com movimento financeiro interno.", body: ["movimentoFinanceiroId"], resposta: "{ movimentoBancario, movimentoFinanceiro }" },
  { metodo: "post", path: "/financas/reconciliacao/movimentos/{id}/ignorar", permissao: "financas:escrita", resumo: "Ignora movimento bancário sem correspondência.", resposta: "{ movimento }" },
  { metodo: "get", path: "/financas/fluxo-caixa", permissao: "financas:leitura", resumo: "Consulta fluxo de caixa por período.", query: ["de?", "ate?"], resposta: "{ saldoInicial, entradas, saidas, saldoFinal, movimentos }" },
  { metodo: "get", path: "/financas/dre", permissao: "financas:leitura", resumo: "Consulta DRE mensal.", query: ["mes", "ano"], resposta: "{ receitas, despesas, resultado }" },
  { metodo: "get", path: "/financas/despesas", permissao: "financas:leitura", resumo: "Lista despesas.", query: ["pago?", "categoriaId?", "limite?"], resposta: "{ despesas }" },
  { metodo: "post", path: "/financas/despesas", permissao: "financas:escrita", resumo: "Cria despesa operacional.", body: ["descricao", "valor", "categoriaId?", "tipoRecorrencia?", "fornecedor?", "dataVencimento?"], resposta: "{ despesa }" },
  { metodo: "get", path: "/financas/contas-receber", permissao: "financas:leitura", resumo: "Lista contas a receber.", query: ["estado?", "limite?"], resposta: "{ contas }" },
  { metodo: "post", path: "/financas/contas-receber", permissao: "financas:escrita", resumo: "Cria conta a receber.", body: ["descricao", "valor", "dataVencimento", "clienteId?", "pedidoId?", "facturaId?"], resposta: "{ conta }" },
  { metodo: "get", path: "/financas/contas-pagar", permissao: "financas:leitura", resumo: "Lista contas a pagar.", query: ["estado?", "limite?"], resposta: "{ contas }" },
  { metodo: "post", path: "/financas/contas-pagar", permissao: "financas:escrita", resumo: "Cria conta a pagar.", body: ["fornecedor", "descricao", "valor", "dataVencimento"], resposta: "{ conta }" },
  { metodo: "get", path: "/financas/facturas", permissao: "financas:leitura", resumo: "Lista facturas.", query: ["estado?", "de?", "ate?", "limite?"], resposta: "{ facturas }" },
  { metodo: "post", path: "/financas/facturas", permissao: "financas:escrita", resumo: "Emite factura ou factura-recibo com rasto de pagamento.", body: ["clienteNome", "itens", "tipoDocumento?", "clienteNif?", "clienteEndereco?", "pedidoId?", "movimentoOrigemId?", "serie?", "ivaPercentual?", "dataVencimento?", "metodoPagamento?", "referenciaPagamento?", "comprovativoUrl?"], resposta: "{ factura }" },
  { metodo: "get", path: "/financas/facturas/{id}", permissao: "financas:leitura", resumo: "Obtém detalhe de factura.", resposta: "{ factura }" },
  { metodo: "post", path: "/financas/facturas/{id}/anular", permissao: "financas:aprovacao", resumo: "Anula factura emitida com motivo.", body: ["motivo"], resposta: "{ factura }" },
  { metodo: "post", path: "/financas/notas-credito", permissao: "financas:escrita", resumo: "Emite nota de crédito vinculada a factura.", body: ["facturaId", "motivo", "valor"], resposta: "{ nota }" },
  { metodo: "post", path: "/financas/recibos", permissao: "financas:escrita", resumo: "Gera recibo de pagamento em PDF e associa comprovativo digital.", body: ["clienteNome", "valorPago", "metodoPagamento?", "referencia?", "comprovativoUrl?", "facturaId?"], resposta: "application/pdf" },
  { metodo: "get", path: "/financas/alertas-pagamentos", permissao: "financas:leitura", resumo: "Lista alertas de pagamentos pendentes.", resposta: "{ alertas }" },
  { metodo: "post", path: "/financas/fechar-periodo", permissao: "financas:aprovacao", resumo: "Fecha período financeiro mensal após validações.", body: ["mes", "ano"], resposta: "{ periodo, movimentosPendentes }" },
  { metodo: "post", path: "/financas/reembolsos", permissao: "financas:escrita", resumo: "Regista reembolso financeiro.", body: ["descricao", "valor", "pedidoId?", "facturaId?", "notaCreditoId?"], resposta: "{ movimento }" },
  { metodo: "put", path: "/financas/orcamento", permissao: "financas:escrita", resumo: "Define orçamento por categoria/mês.", body: ["categoriaId", "mes", "ano", "valorOrcado"], resposta: "{ orcamento }" },
  { metodo: "get", path: "/financas/orcamento/comparativo", permissao: "financas:leitura", resumo: "Compara orçamento versus realizado.", query: ["mes", "ano"], resposta: "{ comparativo }" }
];

/* ── Módulo HTTP ──────────────────────────────────────────────── */

export const moduloFinancas: ModuloHttp = {
  nome: "financas",
  descricao: "Gestão financeira — categorias, movimentos, despesas, contas a receber/pagar, fluxo de caixa, DRE e orçamento.",

  registrar(app, contexto) {
    // RNF-T019: healthcheck público para probes de disponibilidade financeira sem expor dados de negócio.
    app.get("/financas/saude", async (_request, reply) => {
      const resultado = await consultarSaudeFinanceira(contexto);
      return reply.code(resultado.statusCode).send(resultado.corpo);
    });

    app.get("/financas/openapi.json", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      return construirOpenApiFinanceiro();
    });

    /* ── Categorias ──────────────────────────────────────────── */

    app.get("/financas/categorias", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const categorias = await contexto.gestaoFinancas.listarCategorias(ctx.negocio.id);
      return { categorias };
    });

    app.post("/financas/categorias", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = CriarCategoriaSchema.parse(request.body ?? {});
      const categoria = await contexto.gestaoFinancas.criarCategoria(ctx.negocio.id, dados);
      return reply.code(201).send({ categoria });
    });

    app.post("/financas/categorias/inicializar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.inicializarCategoriasPadrao(ctx.negocio.id);
      return resultado;
    });

    /* ── Movimentos (Ledger) ─────────────────────────────────── */

    app.get("/financas/movimentos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosMovimentoSchema.parse(request.query ?? {});
      const movimentos = await contexto.gestaoFinancas.listarMovimentos(ctx.negocio.id, filtros);
      return { movimentos };
    });

    app.post("/financas/movimentos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = CriarMovimentoSchema.parse(request.body ?? {});
      const resultado = await processarMovimentoFinanceiro(contexto, ctx.negocio.id, ctx.usuario.id, dados);
      return reply.code(201).send(resultado);
    });

    /* ── Reconciliação Bancária ──────────────────────────────── */

    app.post("/financas/reconciliacao/importar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = ImportarExtratoBancarioSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoFinancas.importarExtratoBancario(ctx.negocio.id, {
        ...dados,
        criadoPorId: ctx.usuario.id
      });
      return reply.code(201).send(resultado);
    });

    app.get("/financas/reconciliacao/importacoes", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const { limite } = z.object({
        limite: z.coerce.number().int().min(1).max(200).optional()
      }).parse(request.query ?? {});
      const importacoes = await contexto.gestaoFinancas.listarImportacoesExtratoBancario(ctx.negocio.id, limite);
      return { importacoes };
    });

    app.get("/financas/reconciliacao/movimentos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosReconciliacaoSchema.parse(request.query ?? {});
      const movimentos = await contexto.gestaoFinancas.listarMovimentosBancarios(ctx.negocio.id, filtros);
      return { movimentos };
    });

    app.post("/financas/reconciliacao/movimentos/:id/conciliar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { movimentoFinanceiroId } = ConciliarMovimentoBancarioSchema.parse(request.body ?? {});
      return contexto.gestaoFinancas.conciliarMovimentoBancario(ctx.negocio.id, id, movimentoFinanceiroId);
    });

    app.post("/financas/reconciliacao/movimentos/:id/ignorar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const movimento = await contexto.gestaoFinancas.ignorarMovimentoBancario(ctx.negocio.id, id);
      return { movimento };
    });

    /* ── Fluxo de Caixa ──────────────────────────────────────── */

    app.get("/financas/fluxo-caixa", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosPeriodoSchema.parse(request.query ?? {});
      const de = filtros.de ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const ate = filtros.ate ?? new Date();
      const resultado = await contexto.gestaoFinancas.obterFluxoCaixa(ctx.negocio.id, de, ate);
      return resultado;
    });

    /* ── DRE ─────────────────────────────────────────────────── */

    app.get("/financas/dre", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const { mes, ano } = MesAnoSchema.parse(request.query ?? {});
      const resultado = await contexto.gestaoFinancas.obterDRE(ctx.negocio.id, mes, ano);
      return resultado;
    });

    /* ── Despesas ─────────────────────────────────────────────── */

    app.get("/financas/despesas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosDespesaSchema.parse(request.query ?? {});
      const despesas = await contexto.gestaoFinancas.listarDespesas(ctx.negocio.id, filtros);
      return { despesas };
    });

    app.post("/financas/despesas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = CriarDespesaSchema.parse(request.body ?? {});
      const despesa = await contexto.gestaoFinancas.criarDespesa(ctx.negocio.id, dados);
      return reply.code(201).send({ despesa });
    });

    app.post("/financas/despesas/:id/pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = DadosPagamentoSchema.omit({ valorPago: true }).parse(request.body ?? {});
      const despesa = await contexto.gestaoFinancas.marcarDespesaPaga(id, ctx.negocio.id, dados);
      return { despesa };
    });

    /* ── Contas a Receber ─────────────────────────────────────── */

    app.get("/financas/contas-receber", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosEstadoSchema.parse(request.query ?? {});
      const contas = await contexto.gestaoFinancas.listarContasReceber(ctx.negocio.id, filtros);
      return { contas };
    });

    app.post("/financas/contas-receber", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = CriarContaReceberSchema.parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.criarContaReceber(ctx.negocio.id, dados);
      return reply.code(201).send({ conta });
    });

    app.get("/financas/contas-receber/aging", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const aging = await contexto.gestaoFinancas.obterAgingReceber(ctx.negocio.id);
      return aging;
    });

    app.post("/financas/contas-receber/:id/receber", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = DadosPagamentoSchema.parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.receberPagamento(id, ctx.negocio.id, dados);
      return { conta };
    });

    /* ── Contas a Pagar ───────────────────────────────────────── */

    app.get("/financas/contas-pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosEstadoSchema.parse(request.query ?? {});
      const contas = await contexto.gestaoFinancas.listarContasPagar(ctx.negocio.id, filtros);
      return { contas };
    });

    app.post("/financas/contas-pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = CriarContaPagarSchema.parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.criarContaPagar(ctx.negocio.id, dados);
      return reply.code(201).send({ conta });
    });

    app.post("/financas/contas-pagar/:id/pagar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = DadosPagamentoSchema.omit({ valorPago: true }).parse(request.body ?? {});
      const conta = await contexto.gestaoFinancas.pagarConta(id, ctx.negocio.id, dados);
      return { conta };
    });

    /* ── Facturação ───────────────────────────────────────────── */

    app.get("/financas/facturas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const filtros = FiltrosFacturaSchema.parse(request.query ?? {});
      const facturas = await contexto.gestaoFinancas.listarFacturas(ctx.negocio.id, filtros);
      return { facturas };
    });

    app.post("/financas/facturas", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = EmitirFacturaSchema.parse(request.body ?? {});
      const factura = await contexto.gestaoFinancas.emitirFactura(ctx.negocio.id, dados);
      return reply.code(201).send({ factura });
    });

    app.get("/financas/facturas/:id", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const factura = await contexto.gestaoFinancas.obterFactura(id, ctx.negocio.id);
      if (!factura) return reply.code(404).send({ erro: "Factura não encontrada." });
      return { factura };
    });

    app.post("/financas/facturas/:id/anular", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:aprovacao");
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { motivo } = AnularFacturaSchema.parse(request.body ?? {});
      const factura = await contexto.gestaoFinancas.anularFactura(id, ctx.negocio.id, motivo);
      return { factura };
    });

    app.get("/financas/facturas/:id/pdf", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
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
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = EmitirNotaCreditoSchema.parse(request.body ?? {});
      const nota = await contexto.gestaoFinancas.emitirNotaCredito(ctx.negocio.id, dados);
      return reply.code(201).send({ nota });
    });

    /* ── Recibos de Pagamento ───────────────────────────────── */

    app.post("/financas/recibos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
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
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.obterAlertasPagamentos(ctx.negocio.id);
      return resultado;
    });

    /* ── Despesas Recorrentes ─────────────────────────────────── */

    app.post("/financas/despesas-recorrentes/processar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.processarDespesasRecorrentes(ctx.negocio.id);
      return resultado;
    });

    /* ── Cobrança Automática (RF-T029) ──────────────────────── */

    app.post("/financas/cobrancas/gerar", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.gerarCobrancasVencidas(ctx.negocio.id);
      return resultado;
    });

    /* ── Taxa de Inadimplência (RF-T030) ─────────────────────── */

    app.get("/financas/inadimplencia", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
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
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.calcularRiscoInadimplencia(ctx.negocio.id);
      return resultado;
    });

    /* ── Priorização de Pagamentos (RF-T033) ─────────────────── */

    app.get("/financas/pagamentos/priorizacao", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const resultado = await contexto.gestaoFinancas.priorizarPagamentos(ctx.negocio.id);
      return resultado;
    });

    /* ── Fecho de Período (RN-T004) ─────────────────────────── */

    app.post("/financas/fechar-periodo", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:aprovacao");
      if (!ctx) return;

      const { mes, ano } = MesAnoSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoFinancas.fecharPeriodo(ctx.negocio.id, mes, ano);
      return resultado;
    });

    /* ── Validar Desconto (RN-T005) ──────────────────────────── */

    app.post("/financas/validar-desconto", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:aprovacao");
      if (!ctx) return;

      const dados = ValidarDescontoSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoFinancas.validarLimiteDesconto(
        ctx.negocio.id,
        dados.percentualDesconto,
        dados.aprovadorId
      );
      return resultado;
    });

    /* ── Reembolso (RN-T006) ─────────────────────────────────── */

    app.post("/financas/reembolsos", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = RegistarReembolsoSchema.parse(request.body ?? {});
      const movimento = await contexto.gestaoFinancas.registarReembolso(ctx.negocio.id, {
        ...dados,
        responsavelId: ctx.usuario.id
      });
      return reply.code(201).send({ movimento });
    });

    /* ── Movimento Multi-Moeda (RN-T007) ─────────────────────── */

    app.post("/financas/movimentos/multi-moeda", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = MovimentoMultiMoedaSchema.parse(request.body ?? {});
      const movimento = await contexto.gestaoFinancas.registarMovimentoMultiMoeda(ctx.negocio.id, {
        ...dados,
        responsavelId: ctx.usuario.id
      });
      return reply.code(201).send({ movimento });
    });

    /* ── Orçamento ────────────────────────────────────────────── */

    app.put("/financas/orcamento", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:escrita");
      if (!ctx) return;

      const dados = OrcamentoSchema.parse(request.body ?? {});
      const orcamento = await contexto.gestaoFinancas.definirOrcamento(ctx.negocio.id, dados);
      return { orcamento };
    });

    app.get("/financas/orcamento/comparativo", async (request, reply) => {
      const ctx = await exigirFinancas(contexto, request, reply, "financas:leitura");
      if (!ctx) return;

      const { mes, ano } = MesAnoSchema.parse(request.query ?? {});
      const comparativo = await contexto.gestaoFinancas.obterOrcadoVsRealizado(ctx.negocio.id, mes, ano);
      return { comparativo };
    });
  }
};

function construirOpenApiFinanceiro() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const endpoint of ENDPOINTS_API_FINANCEIRA) {
    paths[endpoint.path] = {
      ...(paths[endpoint.path] ?? {}),
      [endpoint.metodo]: {
        tags: ["Finanças"],
        summary: endpoint.resumo,
        security: [{ bearerAuth: [] }],
        "x-bizy-permissao": endpoint.permissao,
        ...(endpoint.query ? {
          parameters: endpoint.query.map((nome) => ({
            name: nome.replace("?", ""),
            in: "query",
            required: !nome.endsWith("?"),
            schema: { type: "string" }
          }))
        } : {}),
        ...(endpoint.body ? {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: endpoint.body.filter((campo) => !campo.endsWith("?")),
                  "x-bizy-campos": endpoint.body
                }
              }
            }
          }
        } : {}),
        responses: {
          "200": {
            description: endpoint.resposta
          },
          "201": {
            description: endpoint.resposta
          },
          "401": { description: "Sessão ausente ou inválida." },
          "403": { description: "Permissão financeira insuficiente." }
        }
      }
    };
  }

  paths["/financas/saude"] = {
    get: {
      tags: ["Finanças"],
      summary: "Healthcheck público de disponibilidade do módulo financeiro.",
      responses: {
        "200": { description: "Módulo financeiro operacional ou degradado sem indisponibilidade crítica." },
        "503": { description: "Dependência crítica do módulo financeiro indisponível." }
      }
    }
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "BIZY Team Finance API",
      version: "1.0.0",
      description: "API REST financeira para integração com sistemas de contabilidade externos. Todos os recursos são isolados por negócio activo e exigem Bearer token."
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer"
        }
      }
    },
    paths
  };
}

async function processarMovimentoFinanceiro(
  contexto: ContextoAplicacao,
  negocioId: string,
  usuarioId: string,
  dados: DadosCriarMovimentoFinanceiro
) {
  const origemTipo = dados.origemTipo?.trim().toUpperCase();
  const documentoFiscal = dados.documentoFiscal ?? "NENHUM";

  if (dados.tipo === "ENTRADA" && documentoFiscal === "NENHUM" && origemTipo === "PEDIDO" && dados.origemId) {
    const pedido = await contexto.gestaoPedidos.confirmarPagamento(dados.origemId, negocioId, {
      metodoPagamento: dados.metodoPagamento ?? null,
      referenciaPagamento: dados.referenciaPagamento ?? null,
      comprovativoPagamentoUrl: dados.comprovativoUrl ?? null,
      observacao: dados.observacao ?? "Pagamento registado em Finanças."
    });
    return { tipoResultado: "PEDIDO_CONFIRMADO", pedido };
  }

  if (dados.tipo === "ENTRADA" && documentoFiscal === "NENHUM" && origemTipo === "CONTA_RECEBER" && dados.origemId) {
    const conta = await contexto.gestaoFinancas.receberPagamento(dados.origemId, negocioId, {
      valorPago: dados.valor,
      metodoPagamento: dados.metodoPagamento,
      referenciaPagamento: dados.referenciaPagamento,
      comprovativoUrl: dados.comprovativoUrl,
      observacao: dados.observacao
    });
    return { tipoResultado: "CONTA_RECEBIDA", conta };
  }

  const facturaIdRecibo =
    dados.facturaId ??
    (dados.tipo === "ENTRADA" && origemTipo === "FACTURA" ? dados.origemId : undefined);

  if (dados.tipo === "ENTRADA" && (documentoFiscal === "RECIBO" || (documentoFiscal === "NENHUM" && origemTipo === "FACTURA" && facturaIdRecibo))) {
    if (!facturaIdRecibo) throw new Error("Informe a factura para gerar o recibo.");
    const factura = await contexto.gestaoFinancas.obterFactura(facturaIdRecibo, negocioId);
    if (!factura) throw new Error("Factura não encontrada para gerar o recibo.");
    const recibo = await contexto.gestaoFinancas.gerarReciboPagamento(negocioId, {
      clienteNome: dados.clienteNome ?? factura.clienteNome,
      clienteNif: dados.clienteNif ?? factura.clienteNif ?? undefined,
      valorPago: dados.valor,
      metodoPagamento: dados.metodoPagamento,
      referencia: dados.referenciaPagamento,
      comprovativoUrl: dados.comprovativoUrl,
      facturaId: factura.id,
      observacao: dados.observacao ?? `Recibo gerado a partir do movimento financeiro ${dados.descricao}.`
    });
    return {
      tipoResultado: "RECIBO_GERADO",
      recibo: { numero: recibo.numero, anoFiscal: recibo.anoFiscal },
      facturaId: factura.id
    };
  }

  if (documentoFiscal === "FACTURA" || documentoFiscal === "FACTURA_RECIBO") {
    if (dados.tipo !== "ENTRADA") {
      throw new Error("Documento fiscal de venda só pode ser emitido a partir de movimento de entrada.");
    }
    if (!dados.clienteNome?.trim()) {
      throw new Error("Informe o cliente para emitir factura a partir do movimento.");
    }
    const itensInformados = dados.itensDocumento && dados.itensDocumento.length > 0;
    const factura = await contexto.gestaoFinancas.emitirFactura(negocioId, {
      clienteNome: dados.clienteNome,
      clienteNif: dados.clienteNif,
      clienteEndereco: dados.clienteEndereco,
      pedidoId: dados.pedidoId ?? (origemTipo === "PEDIDO" ? dados.origemId : undefined),
      movimentoOrigemId: dados.movimentoOrigemId,
      tipoDocumento: documentoFiscal,
      ivaPercentual: dados.ivaPercentual ?? (itensInformados ? 14 : 0),
      dataVencimento: dados.dataVencimento,
      metodoPagamento: dados.metodoPagamento,
      referenciaPagamento: dados.referenciaPagamento,
      comprovativoUrl: dados.comprovativoUrl,
      observacao: dados.observacao,
      itens: itensInformados
        ? dados.itensDocumento!
        : [{ descricao: dados.descricao, quantidade: 1, precoUnitario: dados.valor }]
    });
    return {
      tipoResultado: documentoFiscal === "FACTURA_RECIBO" ? "FACTURA_RECIBO_EMITIDA" : "FACTURA_EMITIDA",
      factura
    };
  }

  const movimento = await contexto.gestaoFinancas.registarMovimento(negocioId, {
    tipo: dados.tipo,
    categoriaId: dados.categoriaId,
    descricao: dados.descricao,
    valor: dados.valor,
    origemTipo: dados.origemTipo,
    origemId: dados.origemId,
    dataMovimento: dados.dataMovimento,
    metodoPagamento: dados.metodoPagamento,
    referenciaPagamento: dados.referenciaPagamento,
    comprovativoUrl: dados.comprovativoUrl,
    observacao: dados.observacao,
    responsavelId: usuarioId
  });
  return { tipoResultado: "MOVIMENTO_REGISTADO", movimento };
}

async function consultarSaudeFinanceira(contexto: ContextoAplicacao) {
  const inicio = Date.now();
  const limiteLatenciaMs = inteiroAmbiente("FINANCAS_SAUDE_LIMITE_MS", 750);
  const limitePendentesN8n = inteiroAmbiente("FINANCAS_OUTBOX_N8N_PENDENTES_MAX", 500);
  const limiteFalhadosN8n = inteiroAmbiente("FINANCAS_OUTBOX_N8N_FALHAS_MAX", 50);
  const base = {
    modulo: "financas",
    armazenamento: process.env.MODO_ARMAZENAMENTO ?? "prisma",
    alvoSlo: {
      disponibilidadeMinimaPercentual: 99.5,
      janela: process.env.FINANCAS_SLO_HORARIO_COMERCIAL ?? "dias uteis 08:00-18:00 Africa/Luanda",
      limiteLatenciaProbeMs: limiteLatenciaMs
    },
    agora: new Date().toISOString()
  };

  try {
    await contexto.repositorios.verificarConexao?.();
    await contexto.repositorios.prisma?.movimentoFinanceiro.findFirst({
      select: { id: true },
      orderBy: { criadoEm: "desc" }
    });
  } catch (erro) {
    const erroHttp = classificarErroHttp(erro);
    const tempoRespostaMs = Date.now() - inicio;

    return {
      statusCode: erroHttp.statusCode === 503 ? 503 : 500,
      corpo: {
        ok: false,
        estado: "INDISPONIVEL" satisfies EstadoSaudeFinanceira,
        ...base,
        tempoRespostaMs,
        dependencias: {
          banco: {
            estado: "INDISPONIVEL",
            mensagem: erroHttp.resposta.mensagem
          },
          ledgerFinanceiro: {
            estado: "INDISPONIVEL",
            mensagem: "Não foi possível validar a tabela de movimentos financeiros."
          }
        }
      }
    };
  }

  const dependencias: Record<string, unknown> = {
    banco: { estado: "OK" },
    ledgerFinanceiro: { estado: "OK" }
  };
  let estado: EstadoSaudeFinanceira = "OK";

  try {
    const outbox = await contexto.repositorios.auditoria.resumirEventosN8n();
    const outboxDegradada = outbox.pendentes > limitePendentesN8n || outbox.falhados > limiteFalhadosN8n;
    if (outboxDegradada) estado = "DEGRADADO";
    dependencias.outboxN8n = {
      estado: outboxDegradada ? "DEGRADADO" : "OK",
      pendentes: outbox.pendentes,
      falhados: outbox.falhados,
      limites: {
        pendentes: limitePendentesN8n,
        falhados: limiteFalhadosN8n
      },
      proximaTentativaEm: outbox.proximaTentativaEm?.toISOString() ?? null,
      atualizadoEm: outbox.atualizadoEm?.toISOString() ?? null
    };
  } catch (erro) {
    const erroHttp = classificarErroHttp(erro);
    estado = "DEGRADADO";
    dependencias.outboxN8n = {
      estado: "DEGRADADO",
      mensagem: erroHttp.resposta.mensagem
    };
  }

  const tempoRespostaMs = Date.now() - inicio;
  if (tempoRespostaMs > limiteLatenciaMs) {
    estado = "DEGRADADO";
  }
  dependencias.latenciaProbe = {
    estado: tempoRespostaMs > limiteLatenciaMs ? "DEGRADADO" : "OK",
    tempoRespostaMs,
    limiteMs: limiteLatenciaMs
  };

  return {
    statusCode: 200,
    corpo: {
      ok: estado === "OK",
      estado,
      ...base,
      tempoRespostaMs,
      dependencias
    }
  };
}

function inteiroAmbiente(nome: string, padrao: number): number {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : padrao;
}

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
