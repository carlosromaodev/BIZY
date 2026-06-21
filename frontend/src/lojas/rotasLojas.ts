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
  catalogoLoja: (slug: string, catalogo: string) => `/lojas/${segmento(slug)}/catalogos/${segmento(catalogo)}`,
  produtoLoja: (slug: string, codigo: string) => `/lojas/${segmento(slug)}/produtos/${segmento(codigo)}`,
  produtoMarket: (codigo: string) => montarUrlProdutoMarketPublico(codigo),
  studio: "/app/loja",
  studioLegado: "/app/loja-publica"
} as const;

export const ROTAS_API_LOJAS = {
  catalogoPublicoLoja: (slug: string, catalogo: string) =>
    `/publico/lojas/${segmento(slug)}/catalogos/${segmento(catalogo)}`,
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
  trackingRecomendacoes: "/publico/recomendacoes/eventos",
  trackingResumoLoja: "/loja-publica/tracking/resumo",
  categoriasMarket: "/publico/market/categorias",
  lojasMarketApi: "/publico/market/lojas",
  lojaMarketApi: (slug: string) => `/publico/market/lojas/${segmento(slug)}`,
  catalogosCrm: "/crm/loja/catalogos",
  catalogoCrm: (id: string) => `/crm/loja/catalogos/${segmento(id)}`,
  seguidoresCrm: "/crm/loja/seguidores",
  metricasCrm: "/crm/loja/metricas",
  checkoutUnificado: "/publico/market/checkout",
  compraUnificada: (id: string) => `/publico/market/compras/${segmento(id)}`,
  pagamentoUnificado: (id: string) => `/publico/market/compras/${segmento(id)}/pagamento`,
  pedidosMarketCrm: "/crm/loja/pedidos-market",
  repassesCrm: "/crm/loja/repasses"
} as const;
