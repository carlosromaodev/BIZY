import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("índices de performance financeira e projectos", () => {
  it("RNF-T007/RNF-T008: mantém índices por tenant/período/estado para ledger e projectos", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "prisma/migrations/20260701143000_indices_performance_financas_projectos/migration.sql"),
      "utf8"
    );

    expect(migration).toContain('"MovimentoFinanceiro_negocioId_dataMovimento_idx"');
    expect(migration).toContain('ON "MovimentoFinanceiro"("negocioId", "dataMovimento")');
    expect(migration).toContain('"MovimentoFinanceiro_negocioId_reconciliado_dataMovimento_idx"');
    expect(migration).toContain('"MovimentoFinanceiro_negocioId_origemTipo_origemId_idx"');
    expect(migration).toContain('"Projecto_negocioId_estado_criadoEm_idx"');
    expect(migration).toContain('ON "Projecto"("negocioId", "estado", "criadoEm")');
    expect(migration).toContain('"ProjetoComercial_negocioId_estado_criadoEm_idx"');
    expect(migration).toContain('"ProjetoComercial_negocioId_tipo_estado_criadoEm_idx"');
  });
});
