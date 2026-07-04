import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("frontend das lojas digitais", () => {
  it("suporta rota direta de produto e abre o detalhe sem depender só da grelha", () => {
    const rotas = source("src/rotasApp.tsx");
    const loja = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");

    expect(rotas).toContain('/lojas/:slug/produtos/:codigo');
    expect(loja).toContain("codigoRota");
    expect(loja).toContain("produtoUrlAplicadoRef");
    expect(loja).toContain("abrirProduto(produtoDaRota)");
  });

  it("mantém tabs acessíveis e bottom nav mobile com sobreposição nativa verde Bizy", () => {
    const loja = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");
    const css = source("src/estilos.css");

    expect(loja).toContain('role="tablist"');
    expect(loja).toContain('role="tab"');
    expect(loja).toContain("aria-selected={ativa}");
    expect(css).toContain("--stitch-success: var(--green)");
    expect(css).toContain(".loja-stitch .native-bottom-nav-shell.lp-nav");
    expect(css).toContain("bottom: calc(0.85rem + env(safe-area-inset-bottom, 0))");
    expect(css).toContain("border-radius: 999px");
    expect(css).toContain("background: linear-gradient(135deg, var(--green) 0%, var(--green-600) 100%)");
    expect(css).not.toContain(".loja-stitch .native-bottom-nav-shell.lp-nav {\n  bottom: 0;");
  });

  it("refatora o produto da loja como PDP premium com galeria, painel sticky e seleção acessível", () => {
    const loja = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");
    const css = source("src/estilos.css");

    expect(loja).toContain("loja-pdp-gallery");
    expect(loja).toContain("loja-pdp-buy-panel");
    expect(loja).toContain("loja-stitch loja-modal-responsivo loja-product-sheet");
    expect(loja).toContain("loja-pdp-service-grid");
    expect(loja).toContain("loja-pdp-primary-cta");
    expect(loja).toContain("aria-label={`Selecionar ${nome}: ${opcao}`}");
    expect(loja).toContain("aria-pressed={ativo}");
    expect(css).toContain("grid-template-columns: minmax(0, 1.36fr) minmax(340px, 0.78fr)");
    expect(css).toContain("position: sticky");
    expect(css).toContain('.loja-product-sheet[data-side="bottom"]');
    expect(css).toContain("z-index: 90 !important");
    expect(css).toContain(".loja-stitch .loja-pdp-variant-options.is-size-grid");
    expect(css).toContain(".loja-stitch .loja-pdp-primary-cta");
    expect(css).toContain(".loja-stitch .lp-foot-add span");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
