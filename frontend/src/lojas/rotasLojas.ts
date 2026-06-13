import {
  montarUrlCategoriaMarketPublico,
  montarUrlLojasMarketPublico,
  montarUrlMarketPublico,
  montarUrlProdutoMarketPublico
} from "../marketDominio";

function segmento(valor: string): string {
  return encodeURIComponent(valor.trim());
}

export const ROTAS_LOJAS = {
  categoriaMarket: (categoria: string) => montarUrlCategoriaMarketPublico(categoria),
  checkout: "/checkout",
  loja: (slug: string) => `/lojas/${segmento(slug)}`,
  lojasMarket: montarUrlLojasMarketPublico(),
  market: montarUrlMarketPublico(),
  produtoLoja: (slug: string, codigo: string) => `/lojas/${segmento(slug)}/produtos/${segmento(codigo)}`,
  produtoMarket: (codigo: string) => montarUrlProdutoMarketPublico(codigo),
  studio: "/app/loja",
  studioLegado: "/app/loja-publica"
} as const;

export const ROTAS_API_LOJAS = {
  checkoutLoja: (slug: string) => `/publico/lojas/${segmento(slug)}/checkout`,
  checkoutAbandonadoLoja: (slug: string) => `/publico/lojas/${segmento(slug)}/checkout/abandonado`,
  configuracaoLoja: "/loja-publica/configuracao",
  entregaLoja: (slug: string) => `/publico/lojas/${segmento(slug)}/entrega/calcular`,
  lojaPublica: (slug: string) => `/publico/lojas/${segmento(slug)}`,
  produtoLoja: (slug: string, codigo: string) => `/publico/lojas/${segmento(slug)}/produtos/${segmento(codigo)}`,
  produtosSimilaresLoja: (slug: string, codigo: string) =>
    `/publico/lojas/${segmento(slug)}/produtos/${segmento(codigo)}/similares`,
  produtoLojaWhatsApp: (slug: string, codigo: string) =>
    `/publico/lojas/${segmento(slug)}/produtos/${segmento(codigo)}/whatsapp`,
  produtosMarket: "/publico/market/produtos",
  produtoMarket: (codigo: string) => `/publico/market/produtos/${segmento(codigo)}`,
  produtosSimilaresMarket: (codigo: string) => `/publico/market/produtos/${segmento(codigo)}/similares`,
  publicacaoMarketProduto: (codigo: string) => `/crm/loja/produtos/${segmento(codigo)}/publicacao`,
  publicacaoMarketProdutosEmMassa: "/crm/loja/produtos/publicacao-em-massa",
  resumoMarketLoja: "/crm/loja/market/resumo",
  trackingPublico: "/publico/tracking/eventos",
  trackingResumoLoja: "/loja-publica/tracking/resumo",
  categoriasMarket: "/publico/market/categorias"
} as const;
