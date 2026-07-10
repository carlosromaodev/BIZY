import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("campanhas com resultados por status", () => {
  it("mostra resultados de campanha vindos do endpoint backend", () => {
    const pagina = source("src/paginas/Campanhas.tsx");
    const tipos = source("src/tipos.ts");

    expect(tipos).toContain("export interface RespostaResultadosCampanha");
    expect(tipos).toContain("receitaAtribuidaEmKwanza");
    expect(pagina).toContain("obterMetricasCampanha");
    expect(pagina).toContain('`/campanhas/${campanha.id}/resultados`');
    expect(pagina).toContain("Resultados ·");
    expect(pagina).toContain("pedidosGerados");
    expect(pagina).toContain("rotuloStatusItem");
  });
});
