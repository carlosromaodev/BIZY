import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("script de desenvolvimento completo", () => {
  it("aplica migrations do Prisma antes de iniciar o backend local", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/dev-full.sh"), "utf8");
    const indiceMigracao = script.indexOf("npm run prisma:migrate:deploy");
    const indiceBackend = script.indexOf("npm run dev --workspace backend");

    expect(indiceMigracao).toBeGreaterThanOrEqual(0);
    expect(indiceMigracao).toBeLessThan(indiceBackend);
  });
});
