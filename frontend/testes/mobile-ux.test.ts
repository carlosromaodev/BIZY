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
    expect(shell).toContain("Atalhos principais");
    expect(shell).toContain("app-mobile-dock");
    expect(shell).toContain("grid-cols-5");
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
    expect(css).toContain("Bizy Mobile Density");
    expect(css).toContain("body .app-conteudo");
    expect(css).toContain('[data-slot="card"] > [data-slot="card-content"]');
    expect(css).toContain('[data-slot="button"][data-size="lg"]');
    expect(css).toContain("min-height: 44px");
  });

  it("mantém Conversas em fluxo lista-detalhe no mobile", () => {
    const conversas = source("src/paginas/Conversas.tsx");
    const css = source("src/estilos.css");

    expect(conversas).toContain('detalheMobileAtivo ? "hidden lg:block" : "block"');
    expect(conversas).toContain('detalheMobileAtivo ? "block" : "hidden lg:block"');
    expect(conversas).toContain("Voltar às conversas");
    expect(conversas).toContain("mobile-chat-imersivo");
    expect(conversas).toContain("chat-social-panel");
    expect(conversas).toContain("chat-social-shell");
    expect(conversas).toContain("chat-social-header");
    expect(conversas).toContain("chat-social-management");
    expect(conversas).not.toContain("fixed inset-x-3 bottom-3");
    expect(conversas).not.toContain("lg:sticky");
    expect(conversas).toContain("lg:grid-cols-[360px_minmax(0,1fr)]");
    expect(conversas).toContain("contextoAberto");
    expect(conversas).toContain("Consultar produtos e pedidos");
    expect(conversas).toContain("PainelContextoComercial");
    expect(conversas).toContain("RotuloComIcone");
    expect(conversas).toContain("chat-commerce-row");
    expect(conversas).toContain("chat-commerce-context-button");
    expect(conversas).toContain("CampoBusca");
    expect(conversas).toContain("Buscar produto, pedido ou cliente");
    expect(conversas).toContain('aria-label="Buscar conversas"');
    expect(conversas).toContain('aria-label="Filtrar conversas por responsável"');
    expect(conversas).toContain("aria-pressed={ativa}");
    expect(conversas).toContain("Abrir conversa com ${conversa.nomeCliente}");
    expect(conversas).toContain('aria-label="Nota interna"');
    expect(conversas).toContain('aria-label="Responder pelo WhatsApp"');
    expect(css).toContain('body[data-mobile-chat-imersivo="true"] .app-mobile-dock');
    expect(css).toContain("translateY(calc(100% + 24px))");
  });

  it("corrige contraste e alvos de toque para navegação e controles mobile", () => {
    const shell = source("src/componentes/Shell.tsx");
    const css = source("src/estilos.css");
    const button = source("src/components/ui/button.tsx");
    const select = source("src/components/ui/select.tsx");

    expect(shell).toContain("[&_span]:text-primary-foreground");
    expect(css).toContain("body .app-mobile-dock :is(a, [data-slot=\"button\"]).bg-primary");
    expect(css).toContain("body .app-mobile-dock :is(a, [data-slot=\"button\"]).bg-primary :is(svg, span)");
    expect(css).toContain("body [data-slot=\"button\"]");
    expect(css).toContain("body [data-slot=\"select-trigger\"]");
    expect(css).toContain("min-height: 44px");
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

    expect(catalogo).toContain("sm:grid-cols-[64px_1fr_auto]");
    expect(catalogo).not.toContain("tabela-catalogo");
    expect(reservas).toContain('rotulo="Resumo dos pedidos"');
    expect(reservas).toContain("ResumoIndicadores");
    expect(reservas).not.toContain("CartaoIndicador");
    expect(reservas).toContain("lg:grid-cols-[1fr_1fr_1fr_1fr_auto]");
    expect(reservas).toContain("reservasVisiveis");
    expect(reservas).toContain("Ver mais pedidos");
    expect(reservas).toContain('aria-label="Buscar pedidos"');
    expect(reservas).toContain('aria-label="Filtrar pedidos por estado"');
    expect(reservas).not.toContain("tabela-reservas");
  });

  it("usa bloco único de indicadores nas páginas operacionais com métricas", () => {
    [
      "src/paginas/Painel.tsx",
      "src/paginas/Reservas.tsx",
      "src/paginas/Comentarios.tsx",
      "src/paginas/Clientes.tsx",
      "src/paginas/Campanhas.tsx",
      "src/paginas/Relatorios.tsx",
      "src/paginas/Agentes.tsx",
      "src/paginas/Configuracoes.tsx",
      "src/paginas/IntegracaoN8n.tsx",
      "src/paginas/ConexaoWhatsApp.tsx"
    ].forEach((arquivo) => {
      const conteudo = source(arquivo);
      expect(conteudo, arquivo).toContain("ResumoIndicadores");
      expect(conteudo, arquivo).not.toContain("CartaoIndicador");
    });
  });
});
