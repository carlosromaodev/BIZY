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
    expect(shell).toContain('side="left"');
    expect(shell).toContain("rotasMobilePrincipais");
    expect(shell).toContain("InteractiveMenu");
    expect(shell).toContain("app-mobile-menu-dock");
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
    expect(shell).toContain("grid-cols-[2rem_minmax(0,1fr)]");
    expect(shell).toContain("export function ResumoIndicadores");
    expect(shell).toContain("grid-cols-2 sm:grid-cols-4");
    expect(shell).toContain("grid-cols-3");
    expect(shell).toContain("hidden text-xs leading-snug");
    expect(css).toContain(".app-conteudo");
    expect(css).toContain('[data-slot="card"]');
    expect(css).toContain(".app-mobile-dock");
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

    expect(css).toContain("--component-active-color-default: var(--emerald-ink);");
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
    expect(css).toContain(".app-desktop-sidebar .app-nav-link");
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
    expect(reservas).toContain("reservasVisiveis");
    expect(reservas).toContain("Ver mais pedidos");
    expect(reservas).toContain('aria-label="Buscar pedidos"');
    expect(reservas).not.toContain("tabela-reservas");
  });

  it("usa bloco único de indicadores nas páginas operacionais com métricas", () => {
    const comentarios = source("src/paginas/Comentarios.tsx");
    expect(comentarios).toContain("ResumoIndicadores");
    expect(comentarios).not.toContain("CartaoIndicador");
  });

  it("mantém Minha loja responsiva na admin com ações e assistente mobile-first", () => {
    const loja = source("src/paginas/LojaPublica.tsx");

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
