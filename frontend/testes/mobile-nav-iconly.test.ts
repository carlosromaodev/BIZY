import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("navegação mobile nativa", () => {
  it("usa um componente compartilhado com Motion para CRM e loja", () => {
    const shell = source("src/componentes/Shell.tsx");
    const loja = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");

    expect(shell).toContain("NativeBottomNav");
    expect(loja).toContain("NativeBottomNav");
    expect(shell).not.toContain("InteractiveMenu");
  });

  it("aplica a barra flutuante com chip ativo e CTA no CRM", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    ["Home", "ListChecks", "Folder", "MessageCircle", "Plus"].forEach((icone) => {
      expect(shell).toContain(icone);
    });

    expect(css).toContain(".app-mobile-menu-dock .native-bottom-nav");
    expect(css).toContain(".native-bottom-nav__active-pill");
    expect(css).toContain(".app-mobile-menu-dock .native-bottom-nav__item[data-variant=\"cta\"]");
    expect(css).toContain("env(safe-area-inset-bottom, 0)");
    expect(css).toContain("linear-gradient(135deg, var(--green) 0%, var(--green-600) 100%)");
    expect(css).not.toContain("#ff4f64");
    expect(css).not.toContain("#ff7b7b");
  });

  it("aplica a mesma linguagem visual na loja digital pública", () => {
    const loja = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");
    const css = source("src/estilos.css");

    ["Home", "Compass", "ShoppingBag", "Heart", "User"].forEach((icone) => {
      expect(loja).toContain(icone);
    });

    expect(loja).toContain("Comprar");
    expect(css).toContain(".lp-nav .native-bottom-nav");
    expect(css).toContain(".lp-nav .native-bottom-nav__item[data-variant=\"primary\"]");
  });

  it("respeita acessibilidade e movimento reduzido", () => {
    const nav = source("src/components/ui/native-bottom-nav.tsx");
    const css = source("src/estilos.css");

    expect(nav).toContain('from "motion/react"');
    expect(nav).toContain("useReducedMotion");
    expect(nav).toContain("LayoutGroup");
    expect(nav).toContain("aria-current");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("mantém a barra escondida fora do mobile", () => {
    const css = source("src/estilos.css");

    expect(css).toContain(".native-bottom-nav-shell,\n.app-mobile-menu-dock.native-bottom-nav-shell,\n.lp-nav.native-bottom-nav-shell");
    expect(css).toContain("display: none;");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain(".native-bottom-nav-shell,\n  .app-mobile-menu-dock.native-bottom-nav-shell,\n  .lp-nav.native-bottom-nav-shell");
    expect(css).toContain("display: flex;");
  });
});
