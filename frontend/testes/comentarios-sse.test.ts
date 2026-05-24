import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const comentariosSource = () => readFileSync(resolve(process.cwd(), "src/paginas/Comentarios.tsx"), "utf8");

describe("comentários em tempo real", () => {
  it("mantém fallback por polling quando a ligação SSE falha", () => {
    const source = comentariosSource();

    expect(source).toContain("eventos.onerror");
    expect(source).toContain("window.setInterval");
    expect(source).toContain("window.clearInterval");
  });
});
