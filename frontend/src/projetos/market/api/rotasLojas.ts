import {
  montarUrlCategoriaMarketPublico,
  montarUrlLojasMarketPublico,
  montarUrlMarketPublico,
  montarUrlProdutoMarketPublico
} from "../dominio/marketDominio";

function segmento(valor: string): string {
  return encodeURIComponent(valor.trim());
}

export const ROTAS_LOJAS = {
  categoriaMarket: (categoria: string) => montarUrlCategoriaMarketPublico(categoria),
  checkout: "/checkout",
  compra: (id: string) => `/compras/${segmento(id)}`,
  formularioLead: (slug: string) => `/f/${segmento(slug)}/lead`,
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
  formularioLeadLoja: (slug: string) => `/publico/lojas/${segmento(slug)}/formularios/lead`,
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
  publicacaoMarketProduto: (codigo: string) => `/team/loja/produtos/${segmento(codigo)}/publicacao`,
  publicacaoMarketProdutosEmMassa: "/team/loja/produtos/publicacao-em-massa",
  resumoMarketLoja: "/team/loja/market/resumo",
  trackingPublico: "/publico/tracking/eventos",
  trackingRecomendacoes: "/publico/recomendacoes/eventos",
  trackingResumoLoja: "/loja-publica/tracking/resumo",
  categoriasMarket: "/publico/market/categorias",
  lojasMarketApi: "/publico/market/lojas",
  lojaMarketApi: (slug: string) => `/publico/market/lojas/${segmento(slug)}`,
  catalogosTeam: "/team/loja/catalogos",
  catalogoTeam: (id: string) => `/team/loja/catalogos/${segmento(id)}`,
  seguidoresTeam: "/team/loja/seguidores",
  metricasTeam: "/team/loja/metricas",
  // Aliases CRM legados apontam para Team para manter compatibilidade de imports antigos.
  catalogosCrm: "/team/loja/catalogos",
  catalogoCrm: (id: string) => `/team/loja/catalogos/${segmento(id)}`,
  seguidoresCrm: "/team/loja/seguidores",
  metricasCrm: "/team/loja/metricas",
  checkoutUnificado: "/publico/market/checkout",
  compraUnificada: (id: string) => `/publico/market/compras/${segmento(id)}`,
  pagamentoUnificado: (id: string) => `/publico/market/compras/${segmento(id)}/pagamento`,
  pedidosMarketTeam: "/team/loja/pedidos-market",
  repassesTeam: "/team/loja/repasses",
  // Mantido só para compatibilidade; novas chamadas devem usar os nomes Team.
  pedidosMarketCrm: "/team/loja/pedidos-market",
  repassesCrm: "/team/loja/repasses"
} as const;
