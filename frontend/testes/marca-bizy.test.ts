import { describe, expect, it } from "vitest";
import {
  CORES_BIZY_PADRAO,
  WORDMARK_BIZY,
  criarFaviconBizyDataUrl,
  criarSvgIconeBizy,
  criarSvgLogoBizy,
  resolverCoresBizy,
} from "../src/marca/bizy";

describe("marca Bizy", () => {
  it("mantém a marca alinhada ao logótipo final", () => {
    expect(WORDMARK_BIZY).toBe("bizy");
    expect(CORES_BIZY_PADRAO.principal).toBe("#0B1014");
    expect(CORES_BIZY_PADRAO.cinzaClaro).toBe("#6B7178");
    expect(CORES_BIZY_PADRAO.faviconBase).toBe("#0B1014");
    expect(CORES_BIZY_PADRAO.faviconCheck).toBe("#ffffff");
    expect(CORES_BIZY_PADRAO.faviconLinhas).toBe("#16A07A");
  });

  it("gera a wordmark final com ponto esmeralda por uma API simples", () => {
    const svg = criarSvgLogoBizy({
      principal: "#ffffff",
      faviconLinhas: "#16A07A",
    });

    expect(svg).toContain(">bizy");
    expect(svg).toContain("<tspan");
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#16A07A"');
    expect(svg).toContain("letter-spacing=\"0\"");
    expect(svg).toContain('aria-label="Bizy"');
  });

  it("gera o favicon b. e data URL para o browser", () => {
    const cores = resolverCoresBizy({
      faviconBase: "#000000",
      faviconCheck: "#ffffff",
      faviconLinhas: "#16A07A",
    });
    const svg = criarSvgIconeBizy(cores);
    const dataUrl = criarFaviconBizyDataUrl(cores);

    expect(svg).toContain("<rect");
    expect(svg).toContain(">b");
    expect(svg).toContain("<tspan");
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#16A07A"');
    expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
    expect(decodeURIComponent(dataUrl)).toContain("<svg");
  });
});
