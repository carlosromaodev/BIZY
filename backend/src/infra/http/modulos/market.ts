import { z } from "zod";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const AtualizarPublicacaoMarketSchema = z.object({
  publicado: z.boolean()
});

const AtualizarPublicacaoMarketMassaSchema = AtualizarPublicacaoMarketSchema.extend({
  codigos: z.array(z.string().trim().min(1).max(32)).min(1).max(500)
});

export const moduloMarket: ModuloHttp = {
  nome: "bizy-market",
  descricao: "Shopping center público do Bizy para descoberta de produtos entre lojas.",
  registrar(app, contexto) {
    app.get("/publico/market/categorias", async (_request, reply) => {
      aplicarCacheMarketPublico(reply);
      return contexto.bizyMarket.listarCategorias();
    });

    app.get("/publico/market/produtos", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const query = request.query as Record<string, string | undefined>;
      return contexto.bizyMarket.listarProdutos({
        busca: query.busca,
        categoria: query.categoria,
        provincia: query.provincia,
        municipio: query.municipio,
        loja: query.loja,
        precoMinimo: normalizarLimiteQuery(query.precoMinimo),
        precoMaximo: normalizarLimiteQuery(query.precoMaximo),
        apenasDisponivel: query.apenasDisponivel === "true" || undefined,
        apenasPromocao: query.apenasPromocao === "true" || undefined,
        limite: normalizarLimiteQuery(query.limite)
      });
    });

    app.get("/publico/market/produtos/:codigo", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const { codigo } = request.params as { codigo: string };
      return contexto.bizyMarket.obterProduto(codigo);
    });

    app.get("/publico/market/produtos/:codigo/similares", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const { codigo } = request.params as { codigo: string };
      const query = request.query as Record<string, string | undefined>;
      return contexto.bizyMarket.listarProdutosSimilares(codigo, {
        limite: normalizarLimiteQuery(query.limite)
      });
    });

    app.get("/crm/loja/market/resumo", async (request, reply) => {
      aplicarNoStore(reply);
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "loja-publica:gerir",
          modulo: "loja-publica",
          mensagemPermissao: "Sem permissão para consultar publicação no Bizy Market.",
          mensagemModulo: "Loja pública desativada para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.bizyMarket.resumirLoja(contextoComercial.negocio);
    });

    app.put("/crm/loja/produtos/:codigo/publicacao", async (request, reply) => {
      aplicarNoStore(reply);
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para publicar produtos no Bizy Market.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = request.params as { codigo: string };
      const dados = AtualizarPublicacaoMarketSchema.parse(request.body ?? {});
      return contexto.bizyMarket.atualizarPublicacaoProduto(contextoComercial.negocio.id, codigo, dados.publicado);
    });

    app.put("/crm/loja/produtos/publicacao-em-massa", async (request, reply) => {
      aplicarNoStore(reply);
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para publicar produtos no Bizy Market.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = AtualizarPublicacaoMarketMassaSchema.parse(request.body ?? {});
      return contexto.bizyMarket.atualizarPublicacaoProdutosEmMassa(
        contextoComercial.negocio.id,
        dados.codigos,
        dados.publicado
      );
    });
  }
};

function normalizarLimiteQuery(valor?: string): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : undefined;
}

function aplicarCacheMarketPublico(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "public, max-age=60, s-maxage=300");
}

function aplicarNoStore(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "no-store");
}
