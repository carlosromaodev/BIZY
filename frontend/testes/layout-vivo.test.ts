import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("layout vivo e pragmatico Bizy", () => {
  it("troca a shell antiga por uma navegacao mobile em ilha e sidebar desktop refinada", () => {
    const shell = source("src/componentes/Shell.tsx");

    [
      "app-mobile-chrome",
      "app-mobile-brand-pill",
      "app-desktop-sidebar",
      "app-desktop-nav",
      "app-nav-section",
      "app-nav-link",
      "app-nav-icon",
      "app-nav-label",
      "app-route-surface"
    ].forEach((classe) => expect(shell).toContain(classe));

    expect(shell).toContain("Atalho ativo");
    expect(shell).toContain("style={{ \"--nav-index\"");
    expect(shell).toContain("aria-current={ativo ? \"page\" : undefined}");
  });

  it("define CRM Operating System com shell e navegação", () => {
    const css = source("src/estilos.css");

    [
      "CRM OPERATING SYSTEM",
      ".app-commerce-shell",
      "--shell-ease:",
      ".app-mobile-chrome",
      ".app-mobile-nav-island",
      ".app-mobile-nav-item",
      ".app-desktop-sidebar",
      ".app-route-surface",
      "touch-action: manipulation",
      "@media (prefers-reduced-motion: reduce)"
    ].forEach((trecho) => expect(css).toContain(trecho));

    expect(css).toContain("var(--primary)");
    expect(css).toContain("var(--background)");
    expect(css).toContain("var(--foreground)");
  });

  it("desliga o dock quando Conversas entra em modo imersivo", () => {
    const css = source("src/estilos.css");

    expect(css).toContain("body.mobile-chat-imersivo .app-mobile-dock");
    expect(css).toContain("body.mobile-chat-imersivo .app-mobile-chrome");
    expect(css).toContain("display: none");
  });

  it("mantem os baloes de Conversas com altura de conteudo no mobile", () => {
    const conversas = source("src/paginas/Conversas.tsx");
    const css = source("src/estilos.css");

    expect(conversas).toContain("auto-rows-max content-start min-h-0");
    expect(conversas).toContain("chat-commerce-messages");
    expect(css).toContain(".chat-commerce-messages");
  });

  it("mantem composer de Conversas como rodape interno de chat social", () => {
    const conversas = source("src/paginas/Conversas.tsx");
    const css = source("src/estilos.css");

    expect(conversas).toContain("mensagensRef");
    expect(conversas).toContain("requestAnimationFrame");
    expect(conversas).toContain("scrollTo({ top: mensagensRef.current.scrollHeight");
    expect(conversas).toContain("ref={mensagensRef}");
    expect(conversas).toContain("chat-social-panel");
    expect(conversas).toContain("chat-social-header");
    expect(conversas).toContain("SheetContent");
    expect(conversas).toContain("chat-commerce-messages");
    expect(conversas).toContain("chat-commerce-row");
    expect(conversas).toContain("chat-commerce-textarea");
    expect(conversas).toContain("chat-message-status-on-primary");
    expect(conversas).not.toContain("fixed inset-x-3 bottom-3");
    expect(conversas).not.toContain("pb-32");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(css).toContain(".chat-commerce-composer");
  });

  it("usa cabecalho mobile transparente e estrutura visual limpa", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain("app-mobile-chrome-transparente");
    expect(css).toContain(".app-mobile-chrome-transparente");
    expect(css).toContain("backdrop-filter: blur");
    expect(css).toContain(".app-mobile-brand-pill");
  });
});
