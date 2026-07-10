import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("console interna Anani", () => {
  it("mantem rota oculta, guarda por papel e read models fora da navegacao comercial", () => {
    const app = source("src/App.tsx");
    const rotas = source("src/rotasApp.tsx");
    const pagina = source("src/paginas/AnaniGovernance.tsx");

    expect(rotas).toContain('"/app/governance/anani"');
    expect(rotas).toContain("requerGovernancaAnani: true");
    expect(rotas).toContain("usuarioPodeGovernarAnani");
    expect(rotas).toContain('"GOVERNANTE_BIZY"');
    expect(app).toContain("requerGovernancaAnani && !usuarioPodeGovernarAnani");
    expect(app).toContain("rotasPrivadasOcultas.map");
    expect(pagina).toContain('"/governance/anani/read-models"');
    expect(pagina).toContain("teamHealth");
    expect(pagina).toContain("marketSnapshot");
    expect(pagina).toContain("securitySnapshot");
  });
});
