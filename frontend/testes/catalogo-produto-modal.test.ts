import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("cadastro de produtos no catálogo", () => {
  it("usa modal completo, catálogo obrigatório e upload local de fotos", () => {
    const catalogo = source("src/paginas/Catalogo.tsx");

    expect(catalogo).toContain("@/components/ui/dialog");
    expect(catalogo).toContain("modalProdutoAberto");
    expect(catalogo).toContain("Catálogo obrigatório");
    expect(catalogo).toContain("Adicionar novo catálogo");
    expect(catalogo).toContain('type="file"');
    expect(catalogo).toContain("/media/upload");
    expect(catalogo).toContain('purpose: "catalogo"');
    expect(catalogo).not.toContain("@/components/ui/sheet");
    expect(catalogo).not.toContain("Fotos por URL");
    expect(catalogo).not.toContain("VPS");
  });

  it("mantém o formulário de produto usável no mobile com ação fixa de cadastro", () => {
    const catalogo = source("src/paginas/Catalogo.tsx");
    const css = source("src/estilos.css");

    expect(catalogo).toContain("max-h-[calc(100dvh-1rem)]");
    expect(catalogo).toContain("bz-product-form-scroll");
    expect(catalogo).toContain("bz-dialog-actions-sticky");
    expect(catalogo).toContain('type="submit"');
    expect(css).toContain(".bz-product-dialog");
    expect(css).toContain(".bz-product-form-scroll");
    expect(css).toContain(".bz-dialog-actions-sticky");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr);");
  });
});
