import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raizProjeto = resolve(process.cwd(), "..");
const cssSource = () => readFileSync(resolve(process.cwd(), "src/estilos.css"), "utf8");

function contarSeletorBase(css: string, seletor: string) {
  const escapado = seletor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (css.match(new RegExp(`\\n${escapado}\\s*\\{`, "g")) ?? []).length;
}

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
  it("define tokens canónicos para evitar valores soltos e estilos divergentes", () => {
    const css = cssSource();

    [
      "--color-bg:",
      "--color-surface:",
      "--color-surface-muted:",
      "--color-text:",
      "--color-text-muted:",
      "--color-border:",
      "--color-accent:",
      "--space-1:",
      "--space-2:",
      "--space-3:",
      "--radius-control:",
      "--radius-panel:",
      "--shadow-panel:",
      "--z-drawer:",
      "--z-bottom-nav:",
      "--surface-panel:",
      "--surface-panel-muted:",
      "--border-ui:",
      "--border-ui-soft:",
      "--text-title:",
      "--text-body:",
      "--success:",
      "--warning:",
      "--info:",
      "--destructive:"
    ].forEach((token) => expect(css).toContain(token));
  });

  it("usa paleta semântica global para estados operacionais", () => {
    const css = cssSource();

    expect(css).toContain("--primary: #166534");
    expect(css).toContain("--success: #166534");
    expect(css).toContain("--warning: #92400e");
    expect(css).toContain("--destructive: #991b1b");
    expect(css).toContain("--info: #1e3a8a");
    expect(css).toContain('[data-slot="card"]');
    expect(css).toContain('[data-slot="input"]');
  });

  it("remove a paleta roxa antiga dos tokens e dos realces globais", () => {
    const css = cssSource().toLowerCase();

    [
      "#971a58",
      "#a21b60",
      "#a8206a",
      "#c92980",
      "#b3266e",
      "#c12875",
      "151 26 88"
    ].forEach((valorAntigo) => expect(css).not.toContain(valorAntigo));
  });

  it("mantém pares principais de texto e fundo com contraste AAA", () => {
    const css = cssSource();
    const branco = "#ffffff";

    [
      ["--primary", "--primary-foreground"],
      ["--success", "--success-foreground"],
      ["--warning", "--warning-foreground"],
      ["--destructive", "--destructive-foreground"],
      ["--info", "--info-foreground"],
      ["--background", "--foreground"],
      ["--background", "--muted-foreground"]
    ].forEach(([fundo, texto]) => {
      const corFundo = obterTokenHex(css, fundo);
      const corTexto = texto.endsWith("foreground") ? obterTokenHex(css, texto) : branco;
      expect(contraste(corFundo, corTexto), `${texto} sobre ${fundo}`).toBeGreaterThanOrEqual(7);
    });
  });

  it("mantém seletores estruturais com uma fonte base de verdade", () => {
    const css = cssSource();

    [".shell", ".sidebar", ".shell-conteudo", ".pagina-cabecalho", ".indicador", ".conversas-layout"].forEach((seletor) => {
      expect(contarSeletorBase(css, seletor), seletor).toBe(1);
    });
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

  it("aplica uma camada global de densidade, borda e hierarquia nas páginas internas", () => {
    const css = cssSource();

    expect(css).toContain("Bizy App Polish");
    expect(css).toContain("Bizy Mobile Density");
    expect(css).toContain("body .painel-metricas .indicador");
    expect(css).toContain("body .tabela-container");
    expect(css).toContain("body .cartao-toolbar");
    expect(css).toContain("body .conversas-layout");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("usa cards comerciais sem linha colorida no início", () => {
    const css = cssSource();
    const camadaComercial = css.slice(css.indexOf("Bizy Commercial Cards"));

    expect(camadaComercial).toContain("--shadow-card-commercial:");
    expect(camadaComercial).toContain("body .painel-metricas :is(.indicador-atencao, .indicador-sucesso, .indicador-perigo)");
    expect(camadaComercial).toContain("body .comentarios-metrica::before");
    expect(camadaComercial).toContain("display: none");
    expect(camadaComercial).toContain("body .conversa-item.ativo");
    expect(camadaComercial).toContain("border-left: 0");
    expect(camadaComercial).not.toContain("inset 3px");
  });
});
