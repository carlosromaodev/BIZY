import {
  Folder,
  Home,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Menu,
  MessageCircle,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { obterUsuario, removerToken, removerUsuario, requisitarApi } from "../api";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy, NOME_PRODUTO } from "../marca/bizy";
import {
  filtrarRotasPorModulos,
  rotasAdminSistema,
  rotasComerciais,
  secoesComerciais,
  usuarioPodeVerAdminSistema,
  type SecaoNavegacao,
} from "../rotasApp";
import type { Peca, Reserva, RespostaConversas } from "../tipos";
import { formatarKwanza } from "../utilidades";
import { CrmListItem } from "./CrmInterno21st";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NativeBottomNav, type NativeBottomNavItem } from "@/components/ui/native-bottom-nav";
import { cn } from "@/lib/utils";

const caminhosMobilePrincipais = ["/app", "/app/reservas", "/app/clientes", "/app/conversas"];

const rotasMobilePrincipais = rotasComerciais.filter((rota) =>
  ["/app", "/app/reservas", "/app/clientes", "/app/conversas"].includes(rota.caminho)
);

const rotasMaisMobile = rotasComerciais.filter((rota) =>
  !caminhosMobilePrincipais.includes(rota.caminho)
);
// Live, recuperação, produtos, relatórios e administração ficam em Mais no telemóvel.

const descricaoSecaoDesktop: Record<SecaoNavegacao, string> = {
  Hoje: "Comando, live e prioridades imediatas.",
  Vendas: "Pedidos, atendimento e clientes em movimento.",
  CRM: "Funil, agenda, respostas e cadências.",
  Vitrine: "Produtos, loja digital e crescimento por canais.",
  Gestão: "Relatórios, equipa, pagamentos e administração.",
  "Admin/Sistema": "Monitorização técnica e auditoria.",
};

function iconeSecaoDesktop(secao: SecaoNavegacao) {
  if (secao === "Hoje") return <LayoutDashboard size={22} />;
  if (secao === "Vendas") return <ReceiptText size={22} />;
  if (secao === "CRM") return <MessageCircle size={22} />;
  if (secao === "Vitrine") return <Package size={22} />;
  if (secao === "Gestão") return <Users size={22} />;
  return <Settings size={22} />;
}

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = obterUsuario();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [modulosAtivos, setModulosAtivos] = useState<string[]>([]);
  const [secaoDesktopFocada, setSecaoDesktopFocada] = useState<SecaoNavegacao | null>(null);
  const podeVerAdminSistema = usuarioPodeVerAdminSistema(usuario?.papel);

  useEffect(() => {
    requisitarApi<{ modulosAtivos?: string[] }>("/negocio/modulos").then((r) => setModulosAtivos(r?.modulosAtivos ?? [])).catch(() => {});
  }, []);

  const rotasComerciaisFiltradas = useMemo(() => filtrarRotasPorModulos(rotasComerciais, modulosAtivos), [modulosAtivos]);

  const secoesVisiveis = useMemo(() => {
    const secoesFiltradas = new Set(rotasComerciaisFiltradas.map((r) => r.secao));
    const secoes = secoesComerciais.filter((s) => secoesFiltradas.has(s));
    if (podeVerAdminSistema) secoes.push("Admin/Sistema" as const);
    return secoes;
  }, [podeVerAdminSistema, rotasComerciaisFiltradas]);

  const rotasDesktopVisiveis = useMemo(
    () => [...rotasComerciaisFiltradas, ...(podeVerAdminSistema ? rotasAdminSistema : [])],
    [podeVerAdminSistema, rotasComerciaisFiltradas]
  );

  const secaoAtual = useMemo<SecaoNavegacao>(() => {
    const rotaAtual = rotasDesktopVisiveis.find((rota) =>
      rota.fim ? location.pathname === rota.caminho : location.pathname.startsWith(rota.caminho)
    );
    return rotaAtual?.secao ?? "Hoje";
  }, [location.pathname, rotasDesktopVisiveis]);

  const secaoDesktopAtiva = secaoDesktopFocada && secoesVisiveis.includes(secaoDesktopFocada)
    ? secaoDesktopFocada
    : secoesVisiveis.includes(secaoAtual)
      ? secaoAtual
      : secoesVisiveis[0] ?? "Hoje";

  const rotasSecaoDesktop = secaoDesktopAtiva === "Admin/Sistema"
    ? rotasAdminSistema
    : rotasComerciaisFiltradas.filter((rota) => rota.secao === secaoDesktopAtiva);

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
      {/* ── Mobile header ── */}
      <header className="app-mobile-chrome app-mobile-chrome-transparente sticky top-0 z-40 flex items-center justify-between px-3 lg:hidden">
        <Link className="app-mobile-brand-pill flex items-center gap-2 font-semibold" to="/app" aria-label={`Painel ${NOME_PRODUTO}`}>
          <LogoBizy className="crm-brand-wordmark" aria-hidden="true" />
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

      {/* ── Mobile sheet menu ── */}
      <Sheet open={menuMobileAberto} onOpenChange={setMenuMobileAberto}>
        <SheetContent side="left" className="w-[86vw] max-w-sm border-r p-0" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <SheetHeader className="border-b p-4 text-left" style={{ borderColor: "var(--line)" }}>
            <SheetTitle className="flex items-center gap-2" style={{ color: "var(--ink)" }}>
              <LogoBizy className="crm-brand-wordmark" aria-hidden="true" />
            </SheetTitle>
            <SheetDescription style={{ color: "var(--ink-3)" }}>Operação comercial da loja.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100dvh-88px)]">
            <nav className="app-mobile-sheet-nav p-2">
              {secoesVisiveis.map((secao) => {
                const rotasSecao = secao === "Admin/Sistema"
                  ? rotasAdminSistema
                  : rotasComerciaisFiltradas.filter((r) => r.secao === secao);
                if (!rotasSecao.length) return null;
                return (
                  <div key={secao} className="side-nav-group">
                    <div className="side-nav-label">{secao}</div>
                    {rotasSecao.map((item) => {
                      const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);
                      return (
                        <NavLink
                          key={item.caminho}
                          to={item.caminho}
                          end={item.fim}
                          aria-current={ativo ? "page" : undefined}
                          className="side-nav-item"
                        >
                          <span aria-hidden="true">{item.icone}</span>
                          {item.rotulo}
                        </NavLink>
                      );
                    })}
                  </div>
                );
              })}
              <Separator className="my-2" style={{ background: "var(--line)" }} />
              <button
                type="button"
                className="side-nav-item w-full"
                style={{ color: "var(--ink-3)" }}
                onClick={() => void sair()}
              >
                <Settings size={17} />
                Sair
              </button>
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ── Desktop navigation inspired by the reference video ── */}
      <aside className="desktop-nav-system fixed inset-y-4 left-4 z-30 hidden lg:flex">
        <nav
          className="desktop-nav-rail"
          aria-label="Secções principais"
          onMouseLeave={() => setSecaoDesktopFocada(null)}
        >
          <Link to="/app" className="desktop-nav-brand-link" aria-label={`Painel ${NOME_PRODUTO}`}>
            <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} className="crm-brand-wordmark desktop-nav-brand" aria-hidden="true" />
          </Link>

          <div className="desktop-nav-rail-items">
            {secoesVisiveis.map((secao) => {
              const rotasSecao = secao === "Admin/Sistema"
                ? rotasAdminSistema
                : rotasComerciaisFiltradas.filter((rota) => rota.secao === secao);
              const primeiraRota = rotasSecao[0];
              const ativa = secaoDesktopAtiva === secao;
              const atual = secaoAtual === secao;

              return (
                <button
                  key={secao}
                  type="button"
                  className="desktop-nav-rail-item"
                  data-active={ativa || undefined}
                  data-current={atual || undefined}
                  aria-label={secao}
                  aria-current={atual ? "page" : undefined}
                  onMouseEnter={() => setSecaoDesktopFocada(secao)}
                  onFocus={() => setSecaoDesktopFocada(secao)}
                  onClick={() => primeiraRota && navigate(primeiraRota.caminho)}
                >
                  {ativa && (
                    <motion.span
                      layoutId="desktop-nav-rail-active"
                      className="desktop-nav-rail-active"
                      transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.75 }}
                    />
                  )}
                  <span className="desktop-nav-rail-icon" aria-hidden="true">
                    {iconeSecaoDesktop(secao)}
                  </span>
                  {atual && <span className="desktop-nav-current-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="desktop-nav-rail-item desktop-nav-rail-utility"
            aria-label="Definições"
            onClick={() => navigate("/app/administracao")}
          >
            <Settings size={22} />
          </button>
        </nav>

        <div className="desktop-nav-panel" onMouseEnter={() => setSecaoDesktopFocada(secaoDesktopAtiva)}>
          <div className="desktop-nav-panel-head">
            <div className="min-w-0">
              <p>{secaoDesktopAtiva}</p>
              <h2>{secaoDesktopAtiva === "Hoje" ? "Comando" : secaoDesktopAtiva}</h2>
            </div>
            <span>{rotasSecaoDesktop.length}</span>
          </div>
          <p className="desktop-nav-panel-desc">{descricaoSecaoDesktop[secaoDesktopAtiva]}</p>

          <div className="desktop-nav-search" role="button" tabIndex={0} aria-label="Buscar">
            <Search size={16} />
            <span>Buscar</span>
            <small>⌘K</small>
          </div>

          <ScrollArea className="desktop-nav-scroll">
            <nav className="desktop-nav-list" aria-label={`Páginas de ${secaoDesktopAtiva}`}>
              {rotasSecaoDesktop.map((item) => {
                const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);

                return (
                  <NavLink
                    key={item.caminho}
                    to={item.caminho}
                    end={item.fim}
                    aria-current={ativo ? "page" : undefined}
                    className="desktop-nav-panel-item"
                  >
                    {ativo && (
                      <motion.span
                        layoutId="desktop-nav-panel-active"
                        className="desktop-nav-panel-active"
                        transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
                      />
                    )}
                    <span className="desktop-nav-panel-icon" aria-hidden="true">{item.icone}</span>
                    <span className="desktop-nav-panel-label">{item.rotulo}</span>
                    {ativo && <span className="desktop-nav-panel-live" aria-hidden="true" />}
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="desktop-nav-user">
            <div className="side-who-avatar">
              {(usuario?.nome ?? "V")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="side-who-name">{usuario?.nome ?? "Vendedor"}</div>
              <div className="side-who-phone">{usuario?.telefone ?? "sem sessão"}</div>
            </div>
            <button type="button" onClick={() => void sair()} aria-label="Sair">
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="app-route-surface sidebar-v2-content min-h-dvh lg:ml-[404px]">
        <div className="lg:hidden">
          <BuscaGlobalComercial />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="app-conteudo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.7 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileMenuDock
        location={location}
        navigate={navigate}
        onAbrirMenu={() => setMenuMobileAberto(true)}
        menuAberto={menuMobileAberto}
        rotaAtualEhPrincipal={rotaAtualEhPrincipal}
      />
    </div>
  );
}

const mobileMenuItems: NativeBottomNavItem[] = [
  { id: "painel", label: "Painel", icon: Home, path: "/app" },
  { id: "pedidos", label: "Pedidos", icon: ListChecks, path: "/app/reservas" },
  { id: "clientes", label: "Clientes", icon: Folder, path: "/app/clientes" },
  { id: "chat", label: "Chat", icon: MessageCircle, path: "/app/conversas" },
  { id: "mais", label: "Mais", icon: Plus, ariaLabel: "Abrir mais opções", variant: "cta" },
];

function MobileMenuDock({
  location,
  navigate,
  onAbrirMenu,
  menuAberto,
  rotaAtualEhPrincipal
}: {
  location: { pathname: string };
  navigate: (path: string) => void;
  onAbrirMenu: () => void;
  menuAberto: boolean;
  rotaAtualEhPrincipal: boolean;
}) {
  const activeIndex = useMemo(() => {
    const path = location.pathname;
    if (path === "/app") return 0;
    if (path.startsWith("/app/reservas")) return 1;
    if (path.startsWith("/app/clientes")) return 2;
    if (path.startsWith("/app/conversas")) return 3;
    // If on a non-primary route, highlight "Mais"
    if (!rotaAtualEhPrincipal || menuAberto) return 4;
    return 0;
  }, [location.pathname, rotaAtualEhPrincipal, menuAberto]);

  const items = useMemo(
    () => mobileMenuItems.map((item, index) => (
      index === 4 ? { ...item, ariaExpanded: menuAberto } : item
    )),
    [menuAberto]
  );

  return (
    <NativeBottomNav
      activeIndex={activeIndex}
      activePillId="crm-mobile-nav"
      className="app-mobile-menu-dock lg:hidden"
      items={items}
      label="Navegação principal"
      onItemClick={(index, item) => {
        if (index === 4) {
          onAbrirMenu();
        } else if (item.path) {
          navigate(item.path);
        }
      }}
    />
  );
}

type TipoResultadoBusca = "cliente" | "conversa" | "pedido" | "produto";

interface ResultadoBuscaGlobal {
  detalhe: string;
  destino: string;
  id: string;
  tipo: TipoResultadoBusca;
  titulo: string;
}

function normalizarBusca(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function correspondeAoTermo(termo: string, valores: Array<string | number | null | undefined>): boolean {
  return valores.some((valor) => normalizarBusca(String(valor ?? "")).includes(termo));
}

function montarResultadosBuscaGlobal({
  conversas,
  pecas,
  reservas,
  termo
}: {
  conversas: RespostaConversas["conversas"];
  pecas: Peca[];
  reservas: Reserva[];
  termo: string;
}): ResultadoBuscaGlobal[] {
  const resultados: ResultadoBuscaGlobal[] = [];

  for (const conversa of conversas) {
    if (!correspondeAoTermo(termo, [conversa.nomeCliente, conversa.telefone, conversa.ultimaMensagem, conversa.pecaRelacionada, ...conversa.tags])) continue;
    resultados.push({
      detalhe: `${conversa.telefone} · ${conversa.estadoCrm.toLowerCase().replace(/_/g, " ")}`,
      destino: "/app/conversas",
      id: `conversa-${conversa.id}`,
      tipo: conversa.mensagensNaoLidas > 0 ? "conversa" : "cliente",
      titulo: conversa.nomeCliente || "Cliente sem nome"
    });
  }

  for (const reserva of reservas) {
    if (!correspondeAoTermo(termo, [reserva.codigoPeca, reserva.nomeCliente, reserva.telefoneCliente, reserva.usernameCliente, reserva.estado, reserva.estadoPagamento, reserva.comentarioOriginal])) continue;
    resultados.push({
      detalhe: `${reserva.nomeCliente || "Cliente"} · ${reserva.telefoneCliente} · ${reserva.estado.toLowerCase().replace(/_/g, " ")}`,
      destino: "/app/reservas",
      id: `pedido-${reserva.id}`,
      tipo: "pedido",
      titulo: `Pedido #${reserva.codigoPeca}`
    });
  }

  for (const peca of pecas) {
    if (!correspondeAoTermo(termo, [peca.codigo, peca.nome, peca.descricao, peca.estado])) continue;
    resultados.push({
      detalhe: `${formatarKwanza(peca.precoEmKwanza)} · stock ${peca.quantidade}`,
      destino: "/app/catalogo",
      id: `produto-${peca.id}`,
      tipo: "produto",
      titulo: `#${peca.codigo} ${peca.nome}`
    });
  }

  return resultados.slice(0, 8);
}

function IconeResultadoBusca({ tipo }: { tipo: TipoResultadoBusca }) {
  const className = "h-4 w-4";
  if (tipo === "produto") return <Package className={className} />;
  if (tipo === "pedido") return <ReceiptText className={className} />;
  if (tipo === "conversa") return <MessageCircle className={className} />;
  return <Users className={className} />;
}

function BuscaGlobalComercial() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ResultadoBuscaGlobal[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const termoNormalizado = normalizarBusca(termo);
    if (termoNormalizado.length < 2) {
      setResultados([]);
      setErro("");
      setCarregando(false);
      return undefined;
    }

    let cancelado = false;
    setCarregando(true);
    const temporizador = window.setTimeout(async () => {
      const [respostaConversas, reservas, pecas] = await Promise.allSettled([
        requisitarApi<RespostaConversas>("/atendimento/conversas"),
        requisitarApi<Reserva[]>("/reservas"),
        requisitarApi<Peca[]>("/pecas")
      ]);

      if (cancelado) return;

      if (respostaConversas.status === "rejected" || reservas.status === "rejected" || pecas.status === "rejected") {
        setErro("Não foi possível pesquisar agora. Verifique a API e tente novamente.");
        setResultados([]);
        setCarregando(false);
        return;
      }

      setResultados(montarResultadosBuscaGlobal({
        conversas: respostaConversas.value.conversas,
        pecas: pecas.value,
        reservas: reservas.value,
        termo: termoNormalizado
      }));
      setErro("");
      setCarregando(false);
    }, 250);

    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
    };
  }, [termo]);

  function abrirResultado(resultado: ResultadoBuscaGlobal) {
    setTermo("");
    setResultados([]);
    navigate(resultado.destino);
  }

  const mostrarPainel = termo.trim().length >= 2;

  return (
    <section className="app-global-search grid gap-2" aria-label="Pesquisa global comercial">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          aria-label="Buscar cliente, telefone, produto, pedido ou conversa"
          className="h-10 rounded-lg border-border/50 bg-card pl-9 pr-10 shadow-none text-sm"
          placeholder="Buscar cliente, telefone, produto, pedido..."
          style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
        />
        {carregando && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />}
      </div>
      {mostrarPainel && (
        <Card size="sm" className="border-border/80 shadow-sm">
          <CardContent className="grid gap-2 p-2">
            {erro ? (
              <p className="px-2 py-3 text-sm text-destructive" role="status">{erro}</p>
            ) : resultados.length ? (
              resultados.map((resultado) => (
                <Button
                  key={resultado.id}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start whitespace-normal p-0 text-left hover:bg-transparent"
                  onClick={() => abrirResultado(resultado)}
                >
                  <CrmListItem
                    media={<IconeResultadoBusca tipo={resultado.tipo} />}
                    title={resultado.titulo}
                    description={resultado.detalhe}
                    tone={resultado.tipo === "pedido" ? "atencao" : resultado.tipo === "produto" ? "sucesso" : "principal"}
                    className="p-2"
                  />
                </Button>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-muted-foreground" role="status">
                Nenhum resultado encontrado neste CRM.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </section>
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
        <p className="app-rotulo">{rotulo}</p>
        <h1 className="app-titulo">{titulo}</h1>
      </div>
      {children && <div className="app-cabecalho-acoes">{children}</div>}
    </header>
  );
}

export function CartaoIndicador({
  titulo,
  valor,
  detalhe,
  tom = "neutro"
}: {
  icone?: ReactNode;
  titulo: string;
  valor: ReactNode;
  detalhe: string;
  tom?: "neutro" | "atencao" | "sucesso" | "perigo";
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
      padding: "1.375rem 1.75rem 1.5rem",
      borderLeft: "1px solid var(--line-2)",
    }}>
      <span style={{ fontSize: "0.75rem", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: "0.4375rem" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink-4)", flexShrink: 0 }} />
        {titulo}
      </span>
      <strong style={{
        fontFamily: "var(--font-serif)",
        fontSize: "2.5rem",
        fontWeight: 300,
        lineHeight: 1,
        color: tom === "sucesso" ? "var(--emerald-ink)" : tom === "atencao" ? "var(--gold)" : tom === "perigo" ? "var(--destructive)" : "var(--ink)",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.01em",
        marginTop: "0.625rem",
      }}>{valor}</strong>
      <small style={{ fontSize: "0.75rem", color: "var(--ink-3)", marginTop: "0.375rem" }}>{detalhe}</small>
    </div>
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
  const grade = {
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4"
  } satisfies Record<3 | 4, string>;

  return (
    <section aria-label={rotulo} className={cn("app-commerce-summary", className)}>
      <div className={cn("crm21-summary grid gap-0", grade[colunas])} style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        {itens.map((item, i) => (
          <div
            key={item.titulo}
            aria-label={`${item.titulo}: ${item.valorAcessivel ?? String(item.valor)} ${item.detalhe}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              padding: "1.375rem 1.75rem 1.5rem",
              borderLeft: i > 0 ? "1px solid var(--line-2)" : "none",
              paddingLeft: i === 0 ? "0.125rem" : undefined,
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: "0.4375rem" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink-4)", flexShrink: 0 }} />
              {item.titulo}
            </span>
            <strong style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 300,
              lineHeight: 1,
              color: item.tom === "sucesso" || item.tom === "principal" ? "var(--emerald-ink)" : item.tom === "atencao" ? "var(--gold)" : item.tom === "perigo" ? "var(--destructive)" : "var(--ink)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
              marginTop: "0.625rem",
            }}>{item.valor}</strong>
            <small style={{ fontSize: "0.75rem", color: "var(--ink-3)", marginTop: "0.375rem" }}>{item.detalhe}</small>
          </div>
        ))}
      </div>
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
    <div className="crm21-empty grid min-h-32 place-items-center gap-2 rounded-lg border border-dashed border-border/50 bg-(--color-surface-warm) p-6 text-center">
      <span className="text-muted-foreground/60 [&_svg]:h-6 [&_svg]:w-6">{icone}</span>
      <strong className="text-sm font-medium text-foreground/80">{titulo}</strong>
      <span className="max-w-sm text-xs text-muted-foreground">{detalhe}</span>
    </div>
  );
}
