import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const ParamCompraIdSchema = z.object({ compraId: z.string().trim().min(1) });

const CriarCompraUnificadaSchema = z.object({
  compradorTelefone: z.string().min(9),
  compradorNome: z.string().nullish(),
  compradorEmail: z.string().email().nullish(),
  itens: z.array(z.object({
    slugLoja: z.string().min(1),
    codigoPeca: z.string(),
    varianteSelecionada: z.record(z.string()).nullish(),
    quantidade: z.number().int().min(1)
  })).min(1),
  metodoPagamento: z.string().nullish(),
  comprovativoPagamentoUrl: z.string().nullish(),
  enderecoEntrega: z.string().nullish(),
  observacao: z.string().nullish(),
  origem: z.string().optional()
});

const SolicitarReembolsoSchema = z.object({
  negocioId: z.string(),
  pedidoId: z.string(),
  compraUnificadaId: z.string().nullish(),
  tipo: z.enum(["TOTAL", "PARCIAL"]),
  valorEmKwanza: z.number().min(0),
  motivo: z.string().min(5),
  itensAfetados: z.array(z.object({
    codigoPeca: z.string(),
    quantidade: z.number().int().min(1),
    valorEmKwanza: z.number().min(0)
  })).optional()
});

/**
 * RF-053–RF-055, RF-064, RF-067, RF-070–RF-072
 * Checkout multi-loja e repasses financeiros
 */
export const moduloCheckoutUnificado: ModuloHttp = {
  nome: "checkout-unificado",
  descricao: "Checkout multi-loja, compra unificada, repasses financeiros e reembolsos.",
  registrar(app, contexto) {

    // --- Endpoints públicos (comprador Market) ---

    app.post("/publico/market/checkout", async (request, reply) => {
      const dados = CriarCompraUnificadaSchema.parse(request.body ?? {});

      // Resolver slugLoja → negocioId para cada item
      const slugsUnicos = [...new Set(dados.itens.map((i) => i.slugLoja))];
      const mapaSlugs = new Map<string, string>();
      for (const slug of slugsUnicos) {
        const negocio = await contexto.repositorios.autenticacao.buscarNegocioPorSlugPublico(slug);
        if (!negocio) return reply.code(404).send({ erro: `Loja "${slug}" não encontrada.` });
        mapaSlugs.set(slug, negocio.id);
      }

      const itensResolvidos = dados.itens.map((item) => ({
        negocioId: mapaSlugs.get(item.slugLoja)!,
        codigoPeca: item.codigoPeca,
        varianteSelecionada: item.varianteSelecionada,
        quantidade: item.quantidade
      }));

      const resultado = await contexto.checkoutUnificado.criarCompraUnificada({
        ...dados,
        itens: itensResolvidos
      });
      return reply.code(201).send(resultado);
    });

    app.get("/publico/market/compras/:id", async (request) => {
      const { id } = ParamIdSchema.parse(request.params);
      return contexto.checkoutUnificado.buscarCompraComEstados(id);
    });

    app.post("/publico/market/compras/:id/pagamento", async (request) => {
      const { id } = ParamIdSchema.parse(request.params);
      const { comprovativoUrl } = (request.body ?? {}) as { comprovativoUrl?: string };
      return contexto.checkoutUnificado.confirmarPagamentoUnificado(id, comprovativoUrl);
    });

    // --- Endpoints fornecedor (loja) ---

    app.get("/market/fornecedor/compras/:compraId", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver compras Market.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = request.params as { compraId: string };
      return contexto.checkoutUnificado.buscarVistaFornecedor(compraId, ctx.negocio.id);
    });

    app.post("/market/fornecedor/compras/:compraId/cancelar", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para cancelar pedidos Market.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = request.params as { compraId: string };
      const { motivo } = (request.body ?? {}) as { motivo: string };
      if (!motivo?.trim()) return reply.code(400).send({ erro: "Motivo obrigatório." });
      return contexto.checkoutUnificado.cancelarPedidoFilho(compraId, ctx.negocio.id, motivo);
    });

    // --- Repasses financeiros (loja) ---

    app.get("/market/fornecedor/repasses", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver repasses financeiros.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { estado, pedidoId, limite } = request.query as { estado?: string; pedidoId?: string; limite?: string };
      return contexto.repassesFinanceiros.listarRepasses(ctx.negocio.id, {
        estado: estado as any,
        pedidoId,
        limite: limite ? Number(limite) : undefined
      });
    });

    app.get("/market/fornecedor/resumo-financeiro", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver resumo financeiro.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      return contexto.repassesFinanceiros.resumoFinanceiroLoja(ctx.negocio.id);
    });

    // --- Reembolsos ---

    app.post("/market/reembolsos", async (request, reply) => {
      const dados = SolicitarReembolsoSchema.parse(request.body ?? {});
      const reembolso = await contexto.checkoutUnificado.solicitarReembolso(dados);
      return reply.code(201).send(reembolso);
    });

    app.get("/market/fornecedor/reembolsos", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver reembolsos.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { pedidoId, estado, limite } = request.query as { pedidoId?: string; estado?: string; limite?: string };
      return contexto.repassesFinanceiros.listarReembolsos(ctx.negocio.id, {
        pedidoId,
        estado: estado as any,
        limite: limite ? Number(limite) : undefined
      });
    });
  }
};
