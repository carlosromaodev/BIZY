import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("seo publico e preview social", () => {
  it("renderiza canonical e normaliza URLs sociais das paginas publicas", () => {
    const utilidades = source("src/utilidades.ts");
    const lojaPublica = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");
    const market = source("src/projetos/market/paginas/Market.tsx");

    expect(utilidades).toContain('link[rel="canonical"]');
    expect(utilidades).toContain("new URL(valor, window.location.origin)");
    expect(utilidades).toContain('upsertMeta("property", "og:url"');
    expect(utilidades).toContain('upsertMeta("name", "twitter:url"');
    expect(lojaPublica).toContain("limparSeo = aplicarSeoMetaTags(corpo.seo)");
    expect(lojaPublica).toContain("limparSeo();");
    expect(market).toContain("limparSeo = aplicarSeoMetaTags");
  });
});
