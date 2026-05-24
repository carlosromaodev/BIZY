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
      "app-mobile-nav-island",
      "app-mobile-nav-item",
      "app-mobile-nav-more",
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

  it("define microinteracoes e densidade sem depender de uma nova paleta de cores", () => {
    const css = source("src/estilos.css");

    [
      "Bizy Live Layout",
      "--motion-ui-fast:",
      "--motion-ui-medium:",
      "--motion-ui-spring:",
      "@keyframes bizy-route-rise",
      "@keyframes bizy-dock-enter",
      "body .app-mobile-chrome",
      "body .app-mobile-nav-island",
      "body .app-mobile-nav-item",
      "body .app-desktop-sidebar",
      "body .app-route-surface",
      "touch-action: manipulation",
      "@media (prefers-reduced-motion: reduce)"
    ].forEach((trecho) => expect(css).toContain(trecho));

    expect(css).toContain("var(--primary)");
    expect(css).toContain("var(--background)");
    expect(css).toContain("var(--foreground)");
  });

  it("desliga a animacao do dock quando Conversas entra em modo imersivo", () => {
    const css = source("src/estilos.css");
    const inicio = css.indexOf('body[data-mobile-chat-imersivo="true"] .app-mobile-dock');
    const trecho = css.slice(inicio, inicio + 260);

    expect(inicio).toBeGreaterThan(-1);
    expect(trecho).toContain("animation: none");
    expect(trecho).toContain("opacity: 0 !important");
    expect(trecho).toContain("transform: translateY(calc(100% + 24px)) !important");
  });

  it("mantem os baloes de Conversas com altura de conteudo no mobile", () => {
    const conversas = source("src/paginas/Conversas.tsx");
    const css = source("src/estilos.css");

    expect(conversas).toContain("auto-rows-max content-start");
    expect(conversas).toContain("chat-commerce-messages grid auto-rows-max content-start min-h-0");
    expect(css).toContain("body .chat-commerce-messages");
    expect(css).toContain("overflow-y: auto");
  });

  it("mantem composer de Conversas como rodape interno de chat social", () => {
    const conversas = source("src/paginas/Conversas.tsx");
    const css = source("src/estilos.css");

    expect(conversas).toContain("mensagensRef");
    expect(conversas).toContain("requestAnimationFrame");
    expect(conversas).toContain("scrollTo({ top: mensagensRef.current.scrollHeight");
    expect(conversas).toContain("ref={mensagensRef}");
    expect(conversas).toContain("chat-social-panel");
    expect(conversas).toContain("chat-social-shell");
    expect(conversas).toContain("chat-social-header");
    expect(conversas).toContain("chat-social-management");
    expect(conversas).toContain("chat-commerce-messages");
    expect(conversas).toContain("chat-commerce-row");
    expect(conversas).toContain("chat-commerce-textarea");
    expect(conversas).toContain("chat-commerce-context-button");
    expect(conversas.indexOf("chat-commerce-textarea")).toBeLessThan(conversas.indexOf("chat-commerce-context-button"));
    expect(conversas).toContain("chat-commerce-draft-button");
    expect(conversas).toContain("chat-commerce-send-button");
    expect(conversas).toContain("chat-message-status-on-primary");
    expect(conversas).not.toContain("fixed inset-x-3 bottom-3");
    expect(conversas).not.toContain("pb-32");
    expect(css).toContain("Bizy Chat Composer Dock");
    expect(css).toContain("body .chat-social-shell");
    expect(css).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 44px 44px 52px");
    expect(css).toContain("position: static");
  });

  it("usa cabecalho mobile transparente e detalhes visuais vivos sem nova paleta", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain("app-mobile-chrome-transparente");
    expect(css).toContain("Bizy Visual Life Details");
    expect(css).toContain("body .app-mobile-chrome-transparente");
    expect(css).toContain("background: color-mix(in srgb, var(--commerce-bg) 58%, transparent)");
    expect(css).toContain("saturate(1.35)");
    expect(css).toContain("body .app-mobile-brand-pill::after");
  });
});
