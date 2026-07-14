import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const exists = (path: string) => existsSync(resolve(process.cwd(), path));

describe("frontend do Bizy Market e Studio", () => {
  it("expõe rotas públicas do Market e rota CRM /app/loja", () => {
    const rotas = source("src/rotasApp.tsx");

    expect(rotas).toContain("PaginaMarket");
    expect(rotas).toContain("PaginaDiretorioLojasMarket");
    expect(rotas).toContain("PaginaProdutoMarket");
    expect(rotas).toContain('/market/lojas');
    expect(rotas).toContain('/market/categorias/:categoria');
    expect(rotas).toContain('/market/produtos/:codigo');
    expect(rotas).toContain('/market');
    expect(rotas).toContain('/app/loja');
    expect(rotas).toContain('rotulo: "Bizy Studio"');
  });

  it("implementa shopping center com busca, filtros sincronizados e fornecedor visível", () => {
    expect(exists("src/projetos/market/paginas/Market.tsx")).toBe(true);
    const market = source("src/projetos/market/paginas/Market.tsx");
    const chrome = source("src/projetos/market/componentes/MarketChrome.tsx");
    const cartaoProduto = source("src/projetos/market/componentes/CartaoProdutoMarket.tsx");

    expect(market).toContain("listarProdutosMarket");
    expect(market).toContain("listarCategoriasMarket");
    expect(market).toContain("useSearchParams");
    expect(market).toContain("categoriaRota");
    expect(market).toContain("provincia");
    expect(market).toContain("municipio");
    expect(market).toContain("loja");
    expect(market).toContain("normalizarProdutoMarket");
    expect(market).toContain("market-commerce-page");
    expect(market).toContain("CabecalhoMarket");
    expect(market).toContain("RodapeMarket");
    expect(chrome).toContain("market-ecom-shell");
    expect(chrome).toContain("market-ecom-search");
    expect(chrome).toContain("market-ecom-dept");
    expect(chrome).toContain("LogoBizy");
    expect(market).toContain("SecaoProdutosEmDestaque");
    expect(market).toContain("SecaoCategoriasMarket");
    expect(market).toContain("heroX");
    expect(market).toContain("Produtos de lojas reais, fornecedor sempre visível.");
    expect(chrome).not.toContain("market-wordmark-text");
    expect(market).toContain("market-commerce-stores");
    expect(market).toContain("PaginaDiretorioLojasMarket");
    expect(market).toContain("market-stores-directory");
    expect(market).toContain("market-directory-chips");
    expect(market).toContain("ROTAS_LOJAS.lojasMarket");
    expect(chrome).toContain("ROTAS_LOJAS.checkout");
    expect(cartaoProduto).toContain("market-product-supplier");
    expect(cartaoProduto).toContain("market-product-signal");
    expect(cartaoProduto).toContain("market-product-meta");
    expect(market).toContain("market-empty-state");
    expect(market).not.toContain("NativeBottomNav");
    expect(source("src/projetos/market/paginas/ProdutoMarket.tsx")).not.toContain("NativeBottomNav");
  });

  it("implementa detalhe do produto no Market com fornecedor e similares sem ambiguidade", () => {
    expect(exists("src/projetos/market/paginas/ProdutoMarket.tsx")).toBe(true);
    const produto = source("src/projetos/market/paginas/ProdutoMarket.tsx");

    expect(produto).toContain("obterProdutoMarket");
    expect(produto).toContain("listarProdutosSimilaresMarket");
    expect(produto).toContain("market-pdp-breadcrumb");
    expect(produto).toContain("market-pdp-supplier-card");
    expect(produto).toContain("market-pdp-signal");
    expect(produto).toContain("market-pdp-delivery-lines");
    expect(produto).toContain("Outras lojas podem ter produtos parecidos");
    expect(produto).toContain("normalizarProdutoMarket");
    expect(produto).toContain("ROTAS_LOJAS.loja");
  });

  it("oferece uma loja rica, orientada a comércio e integrada ao Market", () => {
    const loja = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");

    expect(loja).toContain("loja-pdp-store-badge");
    expect(loja).toContain("loja-pdp-accordions");
    expect(loja).toContain("loja-pdp-similar-link");
    expect(loja).toContain("loja-storefront-hero");
    expect(loja).toContain("loja-storefront-feature");
    expect(loja).toContain("loja-storefront-product-grid");
    expect(loja).toContain("loja-storefront-action is-market");
    expect(loja).toContain("CabecalhoMarket");
    expect(loja).toContain("RodapeMarket");
    expect(loja).toContain("ROTAS_LOJAS.produtoMarket");
    expect(loja).toContain("aria-expanded={aberto}");
  });

  it("mantém o chrome e a pesquisa funcional em todos os fluxos públicos do Market", () => {
    const catalogo = source("src/projetos/market/paginas/CatalogoPublico.tsx");
    const fluxos = [
      catalogo,
      source("src/projetos/market/paginas/CheckoutBizy.tsx"),
      source("src/projetos/market/paginas/PortalComprador.tsx"),
      source("src/projetos/market/paginas/CompraUnificada.tsx"),
      source("src/projetos/market/paginas/FormularioLeadPublico.tsx")
    ];

    for (const fluxo of fluxos) {
      expect(fluxo).toContain("CabecalhoMarket");
      expect(fluxo).toContain("RodapeMarket");
    }
    expect(catalogo).toContain("const cabecalhoBase = <CabecalhoMarket />");
    expect(catalogo).not.toContain('busca=""');
  });

  it("completa Studio com resumo do Market, publicação individual e publicação em massa", () => {
    const studio = source("src/projetos/market/paginas/StudioLoja.tsx");

    expect(studio).toContain("obterResumoMarketLoja");
    expect(studio).toContain("atualizarPublicacaoProdutoMarket");
    expect(studio).toContain("atualizarPublicacaoProdutosMarketEmMassa");
    expect(studio).toContain("marketStudio");
    expect(studio).toContain("Publicar elegíveis");
    expect(studio).toContain("bz-market-studio-panel");
    expect(studio).toContain("bz-market-studio-table");
    expect(studio).toContain("Não publica automaticamente produtos com pendências.");
  });

  it("mantém a identidade visual do handoff com responsividade desktop e mobile", () => {
    const estilosGlobais = source("src/estilos.css");
    const estilosMarket = source("src/projetos/market/market.css");
    const estilos = `${estilosGlobais}\n${estilosMarket}`;

    expect(estilos).toContain("Bizy Market + Lojas — final handoff alignment");
    expect(estilos).toContain("Bizy Market v2 — ecommerce shell handoff");
    expect(estilos).toContain(".market-ecom-shell");
    expect(estilos).toContain(".market-ecom-hero");
    expect(estilos).toContain(".market-flash-grid");
    expect(estilos).toContain(".market-category-tile-grid");
    expect(estilos).toContain(".market-directory-grid");
    expect(estilos).toContain(".loja-storefront-hero");
    expect(estilos).toContain(".loja-storefront-product-grid");
    expect(estilos).toContain(".loja-product-sheet[data-side=\"bottom\"]");
    expect(estilos).toContain(".bz-market-studio-panel");
    expect(estilos).toContain("@media (max-width: 767px)");
    expect(estilos).toContain("@media (min-width: 1100px)");
    expect(estilos).toContain("prefers-reduced-motion");
    expect(estilosMarket).toContain("Canonical Bizy Market surface");
    expect(estilosMarket).toContain("border-radius: 0 !important");
  });

  it("não usa mock data nas páginas conectadas do Market e Studio", () => {
    const fontes = [
      source("src/projetos/market/paginas/Market.tsx"),
      source("src/projetos/market/paginas/ProdutoMarket.tsx"),
      source("src/projetos/market/paginas/LojaDigitalPublica.tsx"),
      source("src/projetos/market/paginas/StudioLoja.tsx")
    ].join("\n");

    expect(fontes).not.toMatch(/mockData|dadosFalsos|produtosMock|lojasMock|const\s+\w*Mock/i);
    expect(fontes).toContain("listarProdutosMarket");
    expect(fontes).toContain("obterProdutoMarket");
    expect(fontes).toContain("obterResumoMarketLoja");
  });
});
