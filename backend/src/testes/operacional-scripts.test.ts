import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("scripts operacionais dos RNFs Bizy Team", () => {
  it("RNF-T019: probe financeiro usa /financas/saude, regista latencia e falha em indisponibilidade", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/probe-financas-saude.sh"), "utf8");

    expect(script).toContain("RNF-T019");
    expect(script).toContain("/financas/saude");
    expect(script).toContain("PROBE_LOG_FILE");
    expect(script).toContain("latenciaMs");
    expect(script).toContain("INDISPONIVEL");
    expect(script).toContain("DEGRADADO");
    expect(script).toContain("exit 2");
  });

  it("RNF-T009: verificador confirma TLS 1.3 publico e SSL PostgreSQL quando psql existe", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/verificar-seguranca-transporte.sh"), "utf8");

    expect(script).toContain("RNF-T009");
    expect(script).toContain("openssl s_client");
    expect(script).toContain("-tls1_3");
    expect(script).toContain("TLSv1.3");
    expect(script).toContain("pg_stat_ssl");
    expect(script).toContain("DATABASE_URL");
  });

  it("RNF-T001/RNF-T008: benchmark HTTP mede endpoints core contra SLO configuravel", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/benchmark-team-rnfs.sh"), "utf8");

    expect(script).toContain("RNF-T001/RNF-T007/RNF-T008");
    expect(script).toContain("BIZY_TOKEN");
    expect(script).toContain("SLO_DASHBOARD_MS");
    expect(script).toContain("SLO_PROJECTOS_MS");
    expect(script).toContain("/financas/fluxo-caixa");
    expect(script).toContain("/financas/dre");
    expect(script).toContain("/projectos?estado=ATIVO&limite=200");
    expect(script).toContain("BENCHMARK_LOG_FILE");
  });

  it("expõe comandos npm para operação e benchmark", () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "../package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["ops:probe-financas"]).toBe("bash scripts/probe-financas-saude.sh");
    expect(packageJson.scripts?.["ops:verificar-transporte"]).toBe("bash scripts/verificar-seguranca-transporte.sh");
    expect(packageJson.scripts?.["benchmark:team-rnfs"]).toBe("bash scripts/benchmark-team-rnfs.sh");
  });
});
