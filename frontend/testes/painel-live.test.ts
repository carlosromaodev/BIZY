import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const painelSource = () => readFileSync(resolve(process.cwd(), "src/paginas/Painel.tsx"), "utf8");

describe("dashboard de live", () => {
  it("mantém uma sessão ativa explícita para comentários manuais e encerramento", () => {
    const source = painelSource();

    expect(source).toContain("const liveAtual");
    expect(source).toContain("/comentarios/manual`");
    expect(source).toContain("/parar`");
    expect(source).toContain("LIVE_DISCONNECTED");
    expect(source).not.toContain('liveId: "manual_dashboard"');
  });

  it("transforma o painel em agenda operacional do dia", () => {
    const source = painelSource();

    expect(source).toContain("Hoje na loja");
    expect(source).toContain("Pedidos novos");
    expect(source).toContain("Pagamentos pendentes");
    expect(source).toContain("Conversas sem resposta");
    expect(source).toContain("Stock baixo");
    expect(source).toContain("Entregas pendentes");
    expect(source).toContain("Faturação do dia");
    expect(source).toContain("Tarefas atrasadas");
    expect(source).toContain("/atendimento/conversas");
    expect(source).toContain("/tarefas?estado=ABERTA&limite=8");
  });
});
