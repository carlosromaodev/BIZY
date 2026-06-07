import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("design interno Comercio suave", () => {
  it("define sistema CRM operacional com tokens e acessibilidade", () => {
    const css = source("src/estilos.css");

    [
      "CRM OPERATING SYSTEM",
      "--shell-sidebar-w:",
      "--shell-sidebar-w-compact:",
      "--shell-chrome-h:",
      "--shell-dock-h:",
      "--shell-ease:",
      "@media (prefers-reduced-motion: reduce)"
    ].forEach((token) => expect(css).toContain(token));
  });

  it("aplica shadcn e design system nos elementos estruturais", () => {
    const css = source("src/estilos.css");

    [
      '[data-slot="card"]',
      '[data-slot="input"]',
      '[data-slot="badge"]',
      ".app-commerce-shell",
      ".app-desktop-sidebar",
      ".app-mobile-dock",
      ".app-conteudo",
      ".chat-commerce-composer",
      "color-mix(in srgb, var(--primary)"
    ].forEach((trecho) => expect(css).toContain(trecho));
  });

  it("usa padroes internos de organizacao em shell e paginas criticas", () => {
    const shell = source("src/componentes/Shell.tsx");
    const conversas = source("src/paginas/Conversas.tsx");
    const clientes = source("src/paginas/Clientes.tsx");
    const reservas = source("src/paginas/Reservas.tsx");
    const catalogo = source("src/paginas/Catalogo.tsx");
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(shell).toContain("app-commerce-shell");
    expect(conversas).toContain("chat-commerce-composer");
    expect(comentarios).toContain("comentarios-commerce-list");
  });

  it("mantem modais destrutivos com copy clara e acao perigosa isolada", () => {
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(comentarios).toContain("AlertDialogContent");
    expect(comentarios).toContain("Esta ação remove");
    expect(comentarios).toContain('variant="destructive"');
  });
});
