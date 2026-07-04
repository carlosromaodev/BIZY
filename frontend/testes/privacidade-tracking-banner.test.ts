import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const fonteLojaPublica = () =>
  [
    source("src/projetos/market/paginas/LojaDigitalPublica.tsx"),
    source("src/projetos/market/loja-publica/helpers.ts")
  ].join("\n");

describe("privacidade e tracking publico", () => {
  it("mostra aviso de tracking anonimo e condiciona marketing a consentimento explicito", () => {
    const designSystem = source("src/componentes/BizyDesignSystem.tsx");
    const lojaPublica = fonteLojaPublica();
    const market = source("src/projetos/market/paginas/Market.tsx");

    expect(designSystem).toContain("tracking anonimo");
    expect(designSystem).toContain("eventos de marketing dependem de consentimento explicito");
    expect(designSystem).toContain("bizy_privacidade_aceite_");
    expect(lojaPublica).toContain("chaveMetadataTrackingEhSensivel");
    expect(lojaPublica).toContain("contemDadoPessoalTracking");
    expect(lojaPublica).toContain("/^(244)?9\\d{8}$/.test(digitos)");
    expect(lojaPublica).toContain("AvisoPrivacidade");
    expect(lojaPublica).toContain('escopo={`loja-${slug}`}');
    expect(market).toContain('AvisoPrivacidade escopo="market"');
    expect(market).toContain("mede buscas, origem e produtos vistos");
  });
});
