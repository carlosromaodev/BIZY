import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("script de desenvolvimento completo", () => {
  it("aplica migrations do Prisma antes de iniciar o backend local", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/dev-full.sh"), "utf8");
    const indiceMigracao = script.indexOf("npm run prisma:migrate:deploy");
    const indiceBootstrap = script.indexOf("npm run bootstrap:ambiente --workspace backend");
    const indiceBackend = script.indexOf("npm run dev:api --workspace backend");

    expect(indiceMigracao).toBeGreaterThanOrEqual(0);
    expect(indiceBootstrap).toBeGreaterThan(indiceMigracao);
    expect(indiceBootstrap).toBeLessThan(indiceBackend);
    expect(indiceMigracao).toBeLessThan(indiceBackend);
  });

  it("verifica se a porta do backend está livre antes de iniciar o backend local", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/dev-full.sh"), "utf8");
    const trechoInicioBackend = script.slice(
      script.indexOf("else", script.indexOf("if backend_local_pronto; then")),
      script.indexOf('echo "A iniciar backend local')
    );

    expect(trechoInicioBackend).toContain("\n  parar_backend_local_desatualizado\n");
  });

  it("permite que npm run dev dentro do backend suba backend e frontend sem recursão", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/dev-full.sh"), "utf8");
    const backendPackage = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const rootPackage = JSON.parse(readFileSync(resolve(process.cwd(), "../package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(backendPackage.scripts.dev).toBe("bash ../scripts/dev-full.sh");
    expect(backendPackage.scripts["dev:api"]).toBe("tsx watch src/main.ts");
    expect(rootPackage.scripts["dev:backend"]).toBe("npm run dev:api --workspace backend");
    expect(script).toContain("npm run dev:api --workspace backend &");
    expect(script).not.toContain("npm run dev --workspace backend &");
  });
});
