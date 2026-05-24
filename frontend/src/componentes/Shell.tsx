import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  MoreHorizontal,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { obterUsuario, removerToken, removerUsuario, requisitarApi } from "../api";
import { LogoBizy, NOME_PRODUTO } from "../marca/bizy";
import { rotasPrivadas, secoesNavegacao } from "../rotasApp";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const rotasMobilePrincipais = rotasPrivadas.filter((rota) =>
  ["/app", "/app/reservas", "/app/clientes", "/app/conversas"].includes(rota.caminho)
);

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = obterUsuario();
  const [recolhida, setRecolhida] = useState(() => localStorage.getItem("emeu_sidebar_recolhida") === "1");
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  useEffect(() => {
    localStorage.setItem("emeu_sidebar_recolhida", recolhida ? "1" : "0");
  }, [recolhida]);

  useEffect(() => {
    setMenuMobileAberto(false);
  }, [location.pathname]);

  async function sair() {
    await requisitarApi("/auth/sessao", { method: "DELETE" }).catch(() => undefined);
    removerToken();
    removerUsuario();
    navigate("/login", { replace: true });
  }

  const rotaAtualEhPrincipal = rotasMobilePrincipais.some((rota) =>
    rota.fim ? location.pathname === rota.caminho : location.pathname.startsWith(rota.caminho)
  );

  return (
    <div className="app-commerce-shell min-h-dvh bg-background text-foreground">
      <header className="app-mobile-chrome app-mobile-chrome-transparente sticky top-0 z-40 flex items-center justify-between px-3 lg:hidden">
        <Link className="app-mobile-brand-pill flex items-center gap-2 font-semibold" to="/app" aria-label={`Painel ${NOME_PRODUTO}`}>
          <LogoBizy variante="icone" aria-hidden="true" />
          <span>{NOME_PRODUTO}</span>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="app-mobile-menu-button"
          onClick={() => setMenuMobileAberto(true)}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </Button>
      </header>

      <Sheet open={menuMobileAberto} onOpenChange={setMenuMobileAberto}>
        <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
          <SheetHeader className="app-sheet-header border-b p-4 text-left">
            <SheetTitle className="flex items-center gap-2">
              <LogoBizy variante="icone" aria-hidden="true" />
              {NOME_PRODUTO}
            </SheetTitle>
            <SheetDescription>Operação comercial da loja.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100dvh-88px)]">
            <nav className="app-desktop-nav grid gap-5 p-4">
              <NavegacaoPrincipal recolhida={false} />
              <Separator />
              <Button variant="outline" className="justify-start" onClick={() => void sair()}>
                <LogOut size={18} />
                Sair
              </Button>
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "app-desktop-sidebar fixed inset-y-0 left-0 z-30 hidden border-r bg-card lg:flex lg:flex-col",
          recolhida ? "w-20 app-desktop-sidebar-compacta" : "w-[17rem]"
        )}
      >
        <div className="app-desktop-sidebar-top flex h-16 items-center justify-between border-b px-4">
          <Link className="flex min-w-0 items-center gap-2 font-semibold" to="/app" aria-label={`Painel ${NOME_PRODUTO}`}>
            <LogoBizy variante="icone" aria-hidden="true" />
            {!recolhida && <span className="truncate">{NOME_PRODUTO}</span>}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setRecolhida((valor) => !valor)}
            aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
          >
            {recolhida ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="app-desktop-nav grid gap-5 p-3">
            <NavegacaoPrincipal recolhida={recolhida} />
          </nav>
        </ScrollArea>

        <div className="app-desktop-footer border-t p-3">
          {!recolhida && (
            <div className="app-desktop-usuario mb-3 flex min-w-0 items-center gap-3 rounded-lg bg-muted p-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{(usuario?.nome ?? "V")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm">
                <strong className="block truncate">{usuario?.nome ?? "Vendedor"}</strong>
                <span className="block truncate text-muted-foreground">{usuario?.telefone ?? "sem sessão"}</span>
              </div>
            </div>
          )}
          <Button variant="outline" className={cn("w-full", recolhida ? "px-0" : "justify-start")} onClick={() => void sair()}>
            <LogOut size={18} />
            {!recolhida && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      <main className={cn("app-route-surface min-h-dvh", recolhida ? "lg:ml-20" : "lg:ml-[17rem]")}>
        <div className="app-conteudo">
          {children}
        </div>
      </main>

      <nav className="app-commerce-nav app-mobile-dock app-mobile-nav-island fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border bg-background/95 p-1 shadow-lg backdrop-blur lg:hidden" aria-label="Atalhos principais">
        {rotasMobilePrincipais.map((item, index) => {
          const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);

          return (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              end={item.fim}
              aria-current={ativo ? "page" : undefined}
              style={{ "--nav-index": index } as CSSProperties}
              className={() =>
                cn(
                  "app-mobile-nav-item grid min-h-14 place-items-center rounded-xl px-1 text-[0.7rem] font-medium text-muted-foreground",
                  ativo && "bg-primary text-primary-foreground [&_span]:text-primary-foreground [&_svg]:text-primary-foreground"
                )
              }
            >
              <span className="app-nav-icon" aria-hidden="true">{item.icone}</span>
              <span className="app-nav-label">{item.rotulo}</span>
              {ativo && <span className="sr-only">Atalho ativo</span>}
            </NavLink>
          );
        })}
        <Button
          type="button"
          variant={menuMobileAberto || !rotaAtualEhPrincipal ? "default" : "ghost"}
          style={{ "--nav-index": rotasMobilePrincipais.length } as CSSProperties}
          className={cn(
            "app-mobile-nav-item app-mobile-nav-more grid h-14 place-items-center rounded-xl px-1 text-[0.7rem]",
            (menuMobileAberto || !rotaAtualEhPrincipal) && "text-primary-foreground [&_span]:text-primary-foreground [&_svg]:text-primary-foreground"
          )}
          onClick={() => setMenuMobileAberto(true)}
          aria-label="Abrir mais opções"
        >
          <span className="app-nav-icon" aria-hidden="true">
            <MoreHorizontal size={20} />
          </span>
          <span className="app-nav-label">Mais</span>
        </Button>
      </nav>
    </div>
  );
}

function NavegacaoPrincipal({ recolhida }: { recolhida: boolean }) {
  const location = useLocation();

  return (
    <>
      {secoesNavegacao.map((secao) => (
        <div className="app-nav-section grid gap-1" key={secao}>
          {!recolhida && <span className="app-nav-section-label px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{secao}</span>}
          {rotasPrivadas
            .filter((item) => item.secao === secao)
            .map((item, index) => {
              const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);

              return (
                <NavLink
                  key={item.caminho}
                  to={item.caminho}
                  end={item.fim}
                  aria-current={ativo ? "page" : undefined}
                  style={{ "--nav-index": index } as CSSProperties}
                  className={() =>
                    cn(
                      "app-nav-link flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                      ativo && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&_span]:text-primary-foreground [&_svg]:text-primary-foreground",
                      recolhida && "justify-center px-0"
                    )
                  }
                  title={recolhida ? item.rotulo : undefined}
                >
                  <span className="app-nav-icon" aria-hidden="true">{item.icone}</span>
                  {!recolhida && <span className="app-nav-label">{item.rotulo}</span>}
                  {ativo && <span className="sr-only">Atalho ativo</span>}
                </NavLink>
              );
            })}
        </div>
      ))}
    </>
  );
}

export function CabecalhoPagina({
  rotulo,
  titulo,
  children
}: {
  rotulo: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <header className="app-cabecalho">
      <div className="min-w-0">
        <p className="app-rotulo text-primary">{rotulo}</p>
        <h1 className="app-titulo">{titulo}</h1>
      </div>
      {children && <div className="app-cabecalho-acoes">{children}</div>}
    </header>
  );
}

export function CartaoIndicador({
  icone,
  titulo,
  valor,
  detalhe,
  tom = "neutro"
}: {
  icone: ReactNode;
  titulo: string;
  valor: ReactNode;
  detalhe: string;
  tom?: "neutro" | "atencao" | "sucesso" | "perigo";
}) {
  const estilos = {
    neutro: "bg-muted text-foreground",
    atencao: "bg-warning/10 text-warning",
    sucesso: "bg-success/10 text-success",
    perigo: "bg-destructive/10 text-destructive"
  } satisfies Record<typeof tom, string>;

  return (
    <Card size="sm" className="min-w-0">
      <CardContent className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 p-3 sm:grid-cols-1 sm:items-start sm:gap-2 sm:p-4">
        <div className={cn("row-span-2 grid h-8 w-8 place-items-center rounded-lg sm:h-10 sm:w-10", estilos[tom])}>{icone}</div>
        <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground sm:text-sm">{titulo}</span>
        <strong className="min-w-0 truncate text-xl font-bold leading-none tabular-nums text-foreground sm:text-2xl">{valor}</strong>
        <small className="col-span-2 line-clamp-2 text-xs leading-snug text-muted-foreground sm:col-span-1 sm:text-sm">{detalhe}</small>
      </CardContent>
    </Card>
  );
}

type TomIndicador = "neutro" | "principal" | "atencao" | "sucesso" | "perigo" | "info";

export interface ItemResumoIndicador {
  icone: ReactNode;
  titulo: string;
  valor: ReactNode;
  detalhe: string;
  tom?: TomIndicador;
  valorAcessivel?: string;
}

export function ResumoIndicadores({
  itens,
  rotulo,
  colunas = itens.length === 3 ? 3 : 4,
  className
}: {
  itens: ItemResumoIndicador[];
  rotulo: string;
  colunas?: 3 | 4;
  className?: string;
}) {
  const estilos = {
    neutro: "bg-muted text-foreground",
    principal: "bg-primary/10 text-primary",
    atencao: "bg-warning/10 text-warning",
    sucesso: "bg-success/10 text-success",
    perigo: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info"
  } satisfies Record<TomIndicador, string>;
  const grade = {
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4"
  } satisfies Record<3 | 4, string>;
  const bordaItem =
    colunas === 3
      ? "border-r last:border-r-0"
      : "odd:border-r [&:nth-child(-n+2)]:border-b sm:border-b-0 sm:border-r sm:last:border-r-0";

  return (
    <section aria-label={rotulo} className={cn("app-commerce-summary", className)}>
      <Card size="sm" className="py-0">
        <CardContent className={cn("grid gap-0 p-0", grade[colunas])}>
          {itens.map((item) => (
            <div
              key={item.titulo}
              aria-label={`${item.titulo}: ${item.valorAcessivel ?? String(item.valor)} ${item.detalhe}`}
              className={cn(
                "grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 border-border/70 p-2 sm:grid-cols-[1.875rem_minmax(0,1fr)] sm:p-3",
                bordaItem
              )}
            >
              <span className={cn("row-span-2 grid h-6 w-6 place-items-center rounded-md [&_svg]:h-4 [&_svg]:w-4 sm:h-7 sm:w-7", estilos[item.tom ?? "neutro"])}>
                {item.icone}
              </span>
              <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">{item.titulo}</span>
              <strong className="min-w-0 truncate text-lg font-bold leading-none tabular-nums text-foreground sm:text-xl">{item.valor}</strong>
              <small className="hidden text-xs leading-snug text-muted-foreground sm:col-start-2 sm:block sm:truncate">{item.detalhe}</small>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

export function EstadoVazio({
  icone,
  titulo,
  detalhe
}: {
  icone: ReactNode;
  titulo: string;
  detalhe: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="grid min-h-40 place-items-center gap-2 p-6 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">{icone}</div>
        <strong>{titulo}</strong>
        <span className="max-w-sm text-sm text-muted-foreground">{detalhe}</span>
      </CardContent>
    </Card>
  );
}
