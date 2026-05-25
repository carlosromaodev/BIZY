import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("navegação CRM", () => {
  it("organiza a plataforma por fluxo comercial e separa páginas técnicas", () => {
    const rotas = source("src/rotasApp.tsx");
    const shell = source("src/componentes/Shell.tsx");

    expect(rotas).toContain('export type SecaoNavegacao = "CRM" | "Loja" | "Admin/Sistema"');
    expect(rotas).toContain('rotulo: "Painel", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Pedidos", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Clientes", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Conversas", secao: "CRM"');
    expect(rotas).toContain('rotulo: "Produtos", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Campanhas", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Relatórios", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Config. Loja", secao: "Loja"');
    expect(rotas).toContain('rotulo: "Live", secao: "Admin/Sistema"');
    expect(rotas).toContain('rotulo: "n8n", secao: "Admin/Sistema"');
    expect(rotas).toContain("rotasComerciais");
    expect(rotas).toContain("rotasAdminSistema");
    expect(shell).toContain("usuarioPodeVerAdminSistema");
    expect(shell).toContain("Admin/Sistema");
    expect(rotas).not.toContain('rotulo: "Dashboard"');
    expect(rotas).not.toContain('secao: "Automação"');
  });

  it("usa atalhos mobile orientados para atendimento diário", () => {
    const shell = source("src/componentes/Shell.tsx");

    expect(shell).toContain('["/app", "/app/reservas", "/app/clientes", "/app/conversas"]');
    expect(shell).not.toContain('["/app", "/app/comentarios", "/app/reservas", "/app/conversas"]');
    expect(shell).toContain("Atalhos principais");
    expect(shell).toContain("rotasMaisMobile");
    expect(shell).toContain("Produtos, campanhas, relatórios e configurações ficam em Mais no telemóvel.");
  });

  it("inclui pesquisa global comercial no shell sem expor dados técnicos", () => {
    const shell = source("src/componentes/Shell.tsx");

    expect(shell).toContain("BuscaGlobalComercial");
    expect(shell).toContain('placeholder="Buscar cliente, telefone, produto, pedido..."');
    expect(shell).toContain("/atendimento/conversas");
    expect(shell).toContain("/reservas");
    expect(shell).toContain("/pecas");
    expect(shell).toContain("cliente, telefone, produto, código, pedido ou conversa");
    expect(shell).not.toContain('placeholder="Buscar workflow"');
  });
});
