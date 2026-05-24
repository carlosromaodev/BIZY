import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("design interno Comercio suave", () => {
  it("define tokens globais de Comercio suave e motion acessivel", () => {
    const css = source("src/estilos.css");

    [
      "Bizy Commerce Soft System",
      "--commerce-bg:",
      "--commerce-surface:",
      "--commerce-surface-raised:",
      "--commerce-border:",
      "--commerce-shadow-card:",
      "--commerce-shadow-modal:",
      "--commerce-green:",
      "--commerce-green-soft:",
      "--commerce-wine:",
      "--commerce-warning-soft:",
      "--commerce-danger-soft:",
      "--motion-ui-fast:",
      "--motion-ui-medium:",
      "--motion-ui-spring:",
      "@media (prefers-reduced-motion: reduce)"
    ].forEach((token) => expect(css).toContain(token));
  });

  it("aplica shadcn premium em cards, botoes, campos, badges, dialogs e sheets", () => {
    const css = source("src/estilos.css");

    [
      "Bizy Shadcn Commerce Polish",
      '[data-slot="card"]',
      '[data-slot="button"]',
      '[data-slot="input"]',
      '[data-slot="textarea"]',
      '[data-slot="badge"]',
      '[data-slot="dialog-content"]',
      '[data-slot="alert-dialog-content"]',
      '[data-slot="sheet-content"]',
      "backdrop-filter: blur",
      "animation: bizy-modal-pop"
    ].forEach((trecho) => expect(css).toContain(trecho));
  });

  it("usa padroes internos de organizacao em shell e paginas criticas", () => {
    const shell = source("src/componentes/Shell.tsx");
    const conversas = source("src/paginas/Conversas.tsx");
    const clientes = source("src/paginas/Clientes.tsx");
    const reservas = source("src/paginas/Reservas.tsx");
    const painel = source("src/paginas/Painel.tsx");
    const catalogo = source("src/paginas/Catalogo.tsx");
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(shell).toContain("app-commerce-shell");
    expect(shell).toContain("app-commerce-nav");
    expect(shell).toContain("app-commerce-summary");
    expect(conversas).toContain("conversas-commerce-layout");
    expect(conversas).toContain("chat-commerce-composer");
    expect(clientes).toContain("crm-commerce-list");
    expect(reservas).toContain("reservas-commerce-list");
    expect(painel).toContain("painel-commerce-grid");
    expect(catalogo).toContain("catalogo-commerce-list");
    expect(comentarios).toContain("comentarios-commerce-list");
  });

  it("mantem modais destrutivos com copy clara e acao perigosa isolada", () => {
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(comentarios).toContain("AlertDialogContent");
    expect(comentarios).toContain("Esta ação remove");
    expect(comentarios).toContain('variant="destructive"');
  });
});
