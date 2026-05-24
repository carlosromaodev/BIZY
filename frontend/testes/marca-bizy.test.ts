import { describe, expect, it } from "vitest";
import {
  CORES_BIZY_PADRAO,
  criarFaviconBizyDataUrl,
  criarSvgIconeBizy,
  criarSvgLogoBizy,
  resolverCoresBizy,
} from "../src/marca/bizy";

describe("marca Bizy", () => {
  it("mantém a marca alinhada com a paleta profissional do produto", () => {
    expect(CORES_BIZY_PADRAO.principal).toBe("#166534");
    expect(CORES_BIZY_PADRAO.cinzaClaro).toBe("#86EFAC");
    expect(CORES_BIZY_PADRAO.cinzaMedio).toBe("#052E16");
    expect(CORES_BIZY_PADRAO.faviconBase).toBe("#166534");
    expect(CORES_BIZY_PADRAO.faviconLinhas).toBe("#D8FF72");
  });

  it("permite trocar as cores do logo horizontal por uma API simples", () => {
    const svg = criarSvgLogoBizy({
      principal: "#ffffff",
      cinzaClaro: "#cccccc",
      cinzaMedio: "#777777",
    });

    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#cccccc"');
    expect(svg).toContain('fill="#777777"');
    expect(svg).toContain('aria-label="Bizy"');
  });

  it("permite trocar as cores do favicon e gerar data URL para o browser", () => {
    const cores = resolverCoresBizy({
      faviconBase: "#000000",
      faviconCheck: "#ffffff",
      faviconLinhas: "#999999",
    });
    const svg = criarSvgIconeBizy(cores);
    const dataUrl = criarFaviconBizyDataUrl(cores);

    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#999999"');
    expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
    expect(decodeURIComponent(dataUrl)).toContain("<svg");
  });
});
