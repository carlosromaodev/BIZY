import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("navegação CRM", () => {
  it("organiza a plataforma por fluxo comercial e separa páginas técnicas", () => {
    const rotas = source("src/rotasApp.tsx");

    expect(rotas).toContain('export type SecaoNavegacao = "CRM" | "Loja" | "Sistema"');
    expect(rotas).toContain('rotulo: "Painel", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Pedidos", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Clientes", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Conversas", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Produtos", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Campanhas", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Relatórios", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Live", secao: "Sistema"');
    expect(rotas).not.toContain('rotulo: "Dashboard"');
    expect(rotas).not.toContain('secao: "Automação"');
  });

  it("usa atalhos mobile orientados para atendimento diário", () => {
    const shell = source("src/componentes/Shell.tsx");

    expect(shell).toContain('["/app", "/app/reservas", "/app/clientes", "/app/conversas"]');
    expect(shell).not.toContain('["/app", "/app/comentarios", "/app/reservas", "/app/conversas"]');
    expect(shell).toContain("Atalhos principais");
  });
});
