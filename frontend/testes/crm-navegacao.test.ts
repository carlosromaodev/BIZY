import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("navegação CRM", () => {
  it("organiza a plataforma por fluxo comercial e separa páginas técnicas", () => {
    const rotas = source("src/rotasApp.tsx");
    const shell = source("src/componentes/Shell.tsx");

    expect(rotas).toContain('export type SecaoNavegacao = "Hoje" | "Vendas" | "Comercial" | "Vitrine" | "Gestão" | "Admin/Sistema"');
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

    expect(shell).toContain("crmV3BottomNavItems");
    expect(shell).toContain('{ id: "inicio", label: "Início", icon: Home, path: "/app" }');
    expect(shell).toContain('{ id: "pedidos", label: "Pedidos", icon: ShoppingBag, path: "/app/reservas" }');
    expect(shell).toContain('{ id: "chat", label: "Chat", icon: MessageSquare, path: "/app/conversas" }');
    expect(shell).toContain('{ id: "tarefas", label: "Tarefas", icon: CheckSquare, path: "/app/tarefas" }');
    expect(shell).toContain('aria-label="Módulos"');
  });

  it("usa apenas o wordmark oficial no CRM, sem símbolo b. na navegação interna", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain('className="crm-brand-wordmark"');
    expect(shell).not.toContain('LogoBizy variante="icone"');
    expect(shell).not.toContain("side-brand-name");
    expect(css).toContain(".crm-brand-wordmark");
  });

  it("aplica a navegação desktop unificada com módulos e abas primárias", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain('className="team-shell hidden lg:block"');
    expect(shell).toContain('className="team-head"');
    expect(shell).toContain('className="team-tabs"');
    expect(shell).toContain('key="modulos"');
    expect(shell).toContain('className="team-modulos-drawer"');
    expect(shell).toContain('key="tabs"');
    expect(css).toContain(".team-shell");
    expect(css).toContain(".team-modulos-drawer");
    expect(css).toContain(".team-tabs-inner");
  });

  it("inclui pesquisa global comercial no shell sem expor dados técnicos", () => {
    const shell = source("src/componentes/Shell.tsx");

    expect(shell).toContain("BuscaGlobalComercial");
    expect(shell).toContain('placeholder = "Buscar cliente, telefone, produto, pedido..."');
    expect(shell).toContain('placeholder="Buscar pedidos, clientes, produtos…"');
    expect(shell).toContain("/atendimento/conversas");
    expect(shell).toContain("/reservas");
    expect(shell).toContain("/pecas");
    expect(shell).toContain("Buscar cliente, telefone, produto, pedido ou conversa");
    expect(shell).not.toContain('placeholder="Buscar workflow"');
  });
});
