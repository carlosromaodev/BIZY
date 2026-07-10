import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("seo publico e preview social", () => {
  it("renderiza canonical e normaliza URLs sociais das paginas publicas", () => {
    const utilidades = source("src/utilidades.ts");
    const html = source("index.html");
    const lojaPublica = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");
    const market = source("src/projetos/market/paginas/Market.tsx");
    const produtoMarket = source("src/projetos/market/paginas/ProdutoMarket.tsx");
    const learning = source("src/projetos/learning/paginas/Learning.tsx");
    const produtoLearning = source("src/projetos/learning/paginas/ProdutoLearning.tsx");

    expect(utilidades).toContain('link[rel="canonical"]');
    expect(utilidades).toContain("export function montarSeoPublico");
    expect(utilidades).toContain("new URL(valor, window.location.origin)");
    expect(utilidades).toContain('upsertMeta("property", "og:site_name"');
    expect(utilidades).toContain('upsertMeta("property", "og:url"');
    expect(utilidades).toContain('upsertMeta("name", "twitter:url"');
    expect(html).toContain('meta name="description"');
    expect(html).toContain('meta property="og:image"');
    expect(lojaPublica).toContain("corpo.seo ?? montarSeoPublico");
    expect(lojaPublica).toContain("ROTAS_LOJAS.produtoLoja(slug, produtoAberto.codigo)");
    expect(lojaPublica).toContain("limparSeo();");
    expect(market).toContain("limparSeo = aplicarSeoMetaTags");
    expect(market).toContain("ROTAS_LOJAS.categoriaMarket(categoriaSelecionada)");
    expect(produtoMarket).toContain("tipo: \"product\"");
    expect(learning).toContain("Bizy Learning | Cursos, mentorias e produtos digitais");
    expect(produtoLearning).toContain("aplicarSeoMetaTags(montarSeoPublico");
  });
});
