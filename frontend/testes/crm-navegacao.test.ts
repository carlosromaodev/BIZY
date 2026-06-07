import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("navegação CRM", () => {
  it("organiza a plataforma por fluxo comercial e separa páginas técnicas", () => {
    const rotas = source("src/rotasApp.tsx");
    const shell = source("src/componentes/Shell.tsx");

    expect(rotas).toContain('export type SecaoNavegacao = "Hoje" | "Vendas" | "CRM" | "Vitrine" | "Gestão" | "Admin/Sistema"');
    expect(rotas).toContain('rotulo: "Comando do dia", secao: "Hoje"');
    expect(rotas).toContain('rotulo: "Central de live", secao: "Hoje"');
    expect(rotas).toContain('rotulo: "Pedidos", secao: "Vendas"');
    expect(rotas).toContain('rotulo: "Atendimento", secao: "Vendas"');
    expect(rotas).toContain('rotulo: "Clientes", secao: "Vendas"');
    expect(rotas).toContain('rotulo: "Recuperação", secao: "Vendas"');
    expect(rotas).toContain('rotulo: "Produtos", secao: "Vitrine"');
    expect(rotas).toContain('{ caminho: "/lojas/:slug", elemento: <PaginaLojaDigitalPublica /> }');
    expect(rotas).toContain('rotulo: "Desempenho", secao: "Gestão"');
    expect(rotas).toContain('rotulo: "Administração", secao: "Gestão"');
    expect(rotas).toContain('rotulo: "Live monitor", secao: "Admin/Sistema"');
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
    expect(shell).toContain("rotasMaisMobile");
    expect(shell).toContain("Live, recuperação, produtos, relatórios e administração ficam em Mais no telemóvel.");
  });

  it("usa apenas o wordmark oficial no CRM, sem símbolo b. na navegação interna", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain('className="crm-brand-wordmark"');
    expect(shell).not.toContain('LogoBizy variante="icone"');
    expect(shell).not.toContain("side-brand-name");
    expect(css).toContain(".crm-brand-wordmark");
  });

  it("aplica a navegação desktop em rail escuro com painel secundário e animação", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain("desktop-nav-system");
    expect(shell).toContain("desktop-nav-rail");
    expect(shell).toContain("desktop-nav-panel");
    expect(shell).toContain('layoutId="desktop-nav-rail-active"');
    expect(shell).toContain('layoutId="desktop-nav-panel-active"');
    expect(css).toContain(".desktop-nav-rail-active");
    expect(css).toContain("background:");
    expect(css).toContain("#050607");
    expect(css).toContain("border-radius: 28px");
  });

  it("inclui pesquisa global comercial no shell sem expor dados técnicos", () => {
    const shell = source("src/componentes/Shell.tsx");

    expect(shell).toContain("BuscaGlobalComercial");
    expect(shell).toContain('placeholder="Buscar cliente, telefone, produto, pedido..."');
    expect(shell).toContain("/atendimento/conversas");
    expect(shell).toContain("/reservas");
    expect(shell).toContain("/pecas");
    expect(shell).toContain("Buscar cliente, telefone, produto, pedido ou conversa");
    expect(shell).not.toContain('placeholder="Buscar workflow"');
  });
});
