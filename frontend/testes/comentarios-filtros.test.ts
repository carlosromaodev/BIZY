import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const comentariosSource = () => readFileSync(resolve(process.cwd(), "src/paginas/Comentarios.tsx"), "utf8");

describe("filtros da aba Comentários", () => {
  it("carrega ignorados para explicar a diferença entre total capturado e itens operacionais", () => {
    const source = comentariosSource();

    expect(source).toContain("/comentarios?incluirIgnorados=true");
    expect(source).toContain("comentariosOcultos");
    expect(source).toContain("operacionais");
    expect(source).toContain("IGNORADO");
    expect(source).toContain("ignorados ocultos");
  });

  it("mostra ação destrutiva protegida por confirmação para limpar comentários e SMS", () => {
    const source = comentariosSource();

    expect(source).toContain("@/components/ui/alert-dialog");
    expect(source).toContain("/comentarios/dados-operacionais");
    expect(source).toContain('confirmacao: "LIMPAR"');
    expect(source).toContain("Limpar dados");
    expect(source).toContain('variant="destructive"');
  });
});
