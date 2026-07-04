import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("experiência mobile-first", () => {
  it("usa navegação mobile com shadcn Sheet e atalhos principais", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain("@/components/ui/sheet");
    expect(shell).toContain("@/components/ui/button");
    expect(shell).toContain("@/components/ui/scroll-area");
    expect(shell).toContain("SheetContent");
    expect(shell).toContain('side="bottom"');
    expect(shell).toContain("rotasPrimariasCrmV3");
    expect(shell).toContain("team-mob-bottom");
    expect(shell).toContain("team-mob-modulos-grid");
    expect(shell).toContain("app-conteudo");
    expect(shell).toContain("app-cabecalho");
    expect(shell).toContain("app-cabecalho-acoes");
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain('@import "shadcn/tailwind.css";');
  });

  it("compacta cards e métricas reutilizadas no mobile sem perder toque", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(shell).toContain('Card size="sm"');
    expect(shell).toContain("export function ResumoIndicadores");
    expect(shell).toContain("grid-cols-2 sm:grid-cols-4");
    expect(shell).toContain("grid-cols-3");
    expect(shell).toContain("crm21-summary");
    expect(css).toContain(".app-conteudo");
    expect(css).toContain('[data-slot="card"]');
    expect(css).toContain(".team-mob-bottom");
  });

  it("RNF-T031 mantém rotas core do Team acessíveis no mobile e evita overflow do shell", () => {
    const shell = source("src/componentes/Shell.tsx");
    const rotas = source("src/rotasApp.tsx");
    const css = source("src/estilos.css");

    expect(rotas).toContain('"/app/tarefas"');
    expect(rotas).toContain('"/app/metas"');
    expect(rotas).toContain('"/app/equipa"');
    expect(rotas).toContain('"/app/projectos"');
    expect(rotas).toContain('"/app/financas"');
    expect(shell).toContain('path: "/app/tarefas"');
    expect(css).toContain(".team-tabs-inner::-webkit-scrollbar");
    expect(css).toContain("RNF-T031");
    expect(css).toContain("@media (max-width: 420px)");
    expect(css).toContain("flex-basis: 48px");
    expect(css).toContain("text-overflow: ellipsis");
  });

  it("mantém Conversas em fluxo lista-detalhe no mobile", () => {
    const conversas = source("src/paginas/Conversas.tsx");
    const css = source("src/estilos.css");

    expect(conversas).toContain("mobile-chat-imersivo");
    expect(conversas).toContain("chat-social-panel");
    expect(conversas).toContain("chat-social-header");
    expect(conversas).toContain("SheetContent");
    expect(conversas).not.toContain("fixed inset-x-3 bottom-3");
    expect(conversas).not.toContain("lg:sticky");
    expect(conversas).toContain("contextoAberto");
    expect(conversas).toContain("PainelContextoComercial");
    expect(conversas).toContain("RotuloComIcone");
    expect(conversas).toContain("chat-commerce-row");
    expect(conversas).toContain("CampoBusca");
    expect(conversas).toContain("Buscar produto, pedido ou cliente");
    expect(conversas).toContain('aria-label="Responder pelo WhatsApp"');
    expect(css).toContain("body.mobile-chat-imersivo .app-mobile-menu-dock");
    expect(css).toContain("display: none");
  });

  it("mantem a cor ativa do dock mobile controlada pelos tokens", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");

    expect(css).toContain(".team-mob-bottom-item[data-active=\"true\"]");
    expect(css).toContain("border-top-color: var(--em, #0e8c68);");
    expect(shell).not.toContain('accentColor="#ffffff"');
  });

  it("mantém atalhos mobile de atendimento com ações reais", () => {
    const conversas = source("src/paginas/Conversas.tsx");

    expect(conversas).toContain("gestaoMobileAberta");
    expect(conversas).toContain("notaMobileAberta");
    expect(conversas).toContain("onAbrirGestao={() => setGestaoMobileAberta(true)}");
    expect(conversas).toContain("onAbrirNota={() => setNotaMobileAberta(true)}");
    expect(conversas).toContain("Nota interna rápida");
  });

  it("corrige contraste e alvos de toque para navegação e controles mobile", () => {
    const css = source("src/estilos.css");
    const button = source("src/components/ui/button.tsx");
    const select = source("src/components/ui/select.tsx");

    expect(css).toContain(".app-mobile-dock");
    expect(css).toContain(".app-mobile-nav-item");
    expect(css).toContain(".app-desktop-sidebar");
    expect(css).toContain(".team-mob-bottom-item");
    expect(css).toContain(".team-mob-modulos-item");
    expect(css).toContain(".app-mobile-sheet-nav .app-nav-link");
    expect(css).toContain(".app-mobile-menu-dock .menu__text");
    expect(css).toContain("color: #ffffff !important;");
    expect(button).toContain("React.forwardRef");
    expect(select).toContain("min-h-11");
  });

  it("não expõe ícones ou rótulos de IA no atendimento", () => {
    const conversas = source("src/paginas/Conversas.tsx");

    expect(conversas).not.toContain("Bot");
    expect(conversas).not.toContain("Sugestão IA");
    expect(conversas).not.toContain("Bloquear IA");
  });

  it("agrupa métricas de Comentários para evitar cartões empilhados no mobile", () => {
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(comentarios).toContain('rotulo="Resumo dos comentários da live"');
    expect(comentarios).toContain("ResumoIndicadores");
    expect(comentarios).not.toContain("CartaoIndicador");
    expect(comentarios).not.toContain("painel-metricas metricas-4");
  });

  it("compacta listas operacionais de Catálogo e Reservas no mobile", () => {
    const catalogo = source("src/paginas/Catalogo.tsx");
    const reservas = source("src/paginas/Reservas.tsx");

    expect(catalogo).not.toContain("tabela-catalogo");
    expect(reservas).toContain("pedidosVisiveis");
    expect(reservas).toContain("Ver mais pedidos");
    expect(reservas).toContain("ped-filters");
    expect(reservas).not.toContain("tabela-reservas");
  });

  it("usa bloco único de indicadores nas páginas operacionais com métricas", () => {
    const comentarios = source("src/paginas/Comentarios.tsx");
    expect(comentarios).toContain("ResumoIndicadores");
    expect(comentarios).not.toContain("CartaoIndicador");
  });

  it("mantém Minha loja responsiva na admin com ações e assistente mobile-first", () => {
    const loja = source("src/projetos/market/paginas/StudioLoja.tsx");

    expect(loja).toContain("loja-admin-shell");
    expect(loja).toContain("loja-admin-command-grid");
    expect(loja).toContain("loja-admin-mobile-actions");
    expect(loja).toContain("loja-assistente-sheet");
    expect(loja).toContain("loja-assistente-layout");
    expect(loja).toContain("loja-assistente-nav");
    expect(loja).toContain("overflow-x-auto");
    expect(loja).toContain("grid-cols-1 xs:grid-cols-3");
    expect(loja).toContain("grid-cols-1 sm:grid-cols-2 xl:grid-cols-4");
    expect(loja).toContain("min-w-0");
  });
});
