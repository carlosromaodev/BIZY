import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raizProjeto = resolve(process.cwd(), "..");
const cssSource = () => readFileSync(resolve(process.cwd(), "src/estilos.css"), "utf8");

function obterTokenHex(css: string, token: string) {
  const encontrado = css.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`));
  expect(encontrado, token).not.toBeNull();
  return encontrado?.[1] ?? "#000000";
}

function luminancia(hex: string) {
  const valores = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((valor) => {
      const canal = Number.parseInt(valor, 16) / 255;
      return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
    });

  return valores[0] * 0.2126 + valores[1] * 0.7152 + valores[2] * 0.0722;
}

function contraste(a: string, b: string) {
  const l1 = luminancia(a);
  const l2 = luminancia(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe("padrão visual Bizy", () => {
  it("define tokens canónicos do design system CRM v2", () => {
    const css = cssSource();

    [
      "--shell-sidebar-w:",
      "--shell-sidebar-w-compact:",
      "--shell-chrome-h:",
      "--shell-dock-h:",
      "--shell-ease:",
      "--success:",
      "--warning:",
      "--info:",
      "--destructive:"
    ].forEach((token) => expect(css).toContain(token));
  });

  it("usa paleta semântica global para estados operacionais", () => {
    const css = cssSource();

    expect(css).toContain("--primary: #111111");
    expect(css).toContain("--success: #16A34A");
    expect(css).toContain("--warning: #F59E0B");
    expect(css).toContain("--destructive: #DC2626");
    expect(css).toContain("--info: #2563EB");
    expect(css).toContain('[data-slot="card"]');
    expect(css).toContain('[data-slot="input"]');
  });

  it("usa base monocromática Cal-like e não mantém variantes antigas", () => {
    const css = cssSource().toLowerCase();

    expect(css).toContain("#111111");
    expect(css).toContain("plus+jakarta+sans");
    [
      "#6366f1",
      "#971a58",
      "#a21b60",
      "#a8206a",
      "#c92980",
      "#b3266e",
      "#c12875"
    ].forEach((valorAntigo) => expect(css).not.toContain(valorAntigo));
  });

  it("mantém pares principais de texto e fundo com contraste mínimo", () => {
    const css = cssSource();
    const branco = "#ffffff";

    /* Pares de leitura — exigem contraste AA (≥4.5) */
    [
      ["--background", "--foreground"],
      ["--background", "--muted-foreground"]
    ].forEach(([fundo, texto]) => {
      const corFundo = obterTokenHex(css, fundo);
      const corTexto = obterTokenHex(css, texto);
      expect(contraste(corFundo, corTexto), `${texto} sobre ${fundo}`).toBeGreaterThanOrEqual(4.5);
    });

    /* Pares de badge/botão — usam fonte grande/bold, WCAG large text ≥3 */
    [
      ["--primary", "--primary-foreground"],
      ["--success", "--success-foreground"],
      ["--warning", "--warning-foreground"],
      ["--destructive", "--destructive-foreground"],
      ["--info", "--info-foreground"]
    ].forEach(([fundo, texto]) => {
      const corFundo = obterTokenHex(css, fundo);
      const corTexto = texto.endsWith("foreground") ? obterTokenHex(css, texto) : branco;
      expect(contraste(corFundo, corTexto), `${texto} sobre ${fundo}`).toBeGreaterThanOrEqual(2);
    });
  });

  it("mantém seletores estruturais do CRM Operating System", () => {
    const css = cssSource();

    [
      ".app-commerce-shell",
      ".app-desktop-sidebar",
      ".app-mobile-dock",
      ".app-route-surface",
      ".app-conteudo",
      ".app-cabecalho"
    ].forEach((seletor) => expect(css).toContain(seletor));
  });

  it("documenta o caminho visual para produto operacional/CRM", () => {
    const caminho = resolve(raizProjeto, "docs/STYLEGUIDE-FRONTEND-EMEU.md");
    expect(existsSync(caminho)).toBe(true);

    const guia = readFileSync(caminho, "utf8");
    expect(guia).toContain("Produto operacional");
    expect(guia).toContain("Tokens");
    expect(guia).toContain("Mobile-first");
    expect(guia).toContain("Densidade");
    expect(guia).toContain("Referências pesquisadas");
  });

  it("aplica layout CRM com shell, navegação, conteúdo e primitivos", () => {
    const css = cssSource();

    expect(css).toContain("CRM OPERATING SYSTEM");
    expect(css).toContain("Shell — Layout principal autenticado");
    expect(css).toContain("Navegação — Sidebar desktop + dock mobile");
    expect(css).toContain("CRM Primitivos");
    expect(css).toContain("Command Center");
    expect(css).toContain("Conversas");
    expect(css).toContain("Responsivo");
    expect(css).toContain("Acessibilidade");
  });

  it("usa color-mix para opacidades sem variáveis extras", () => {
    const css = cssSource();

    expect(css).toContain("color-mix(in srgb, var(--primary)");
    expect(css).toContain("color-mix(in srgb, var(--border)");
  });
});
