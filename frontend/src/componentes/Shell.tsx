import {
  BarChart3,
  Bell,
  Bolt,
  ChevronDown,
  Grid2X2,
  Home,
  Loader2,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Video,
} from "lucide-react";
import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { obterUsuario, removerToken, removerUsuario, requisitarApi } from "../api";
import { CORES_BIZY_PADRAO, CORES_LOGO_BIZY_ESCURA, LogoBizy, NOME_PRODUTO } from "../marca/bizy";
import {
  filtrarRotasPorModulos,
  rotasCrmV3Principais,
  rotasAdminSistema,
  rotasComerciais,
  secoesComerciais,
  usuarioPodeVerAdminSistema,
} from "../rotasApp";
import type { LiveResumo, Peca, Reserva, RespostaConversas, ResumoPainel } from "../tipos";
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
import { cn } from "@/lib/utils";

// CRM v3 mobile: primary tabs in the header, secondary pages accessed via sheet menu.

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = obterUsuario();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [modulosAtivos, setModulosAtivos] = useState<string[]>([]);
  const [liveAtiva, setLiveAtiva] = useState<LiveResumo | null>(null);
  const [tempoLiveShell, setTempoLiveShell] = useState(0);
  const podeVerAdminSistema = usuarioPodeVerAdminSistema(usuario?.papel);

  useEffect(() => {
    requisitarApi<{ modulosAtivos?: string[] }>("/negocio/modulos").then((r) => setModulosAtivos(r?.modulosAtivos ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    const verificarLive = () => {
      requisitarApi<ResumoPainel>("/painel/resumo")
        .then((r) => {
          const ativa = r.lives?.find((l) => l.status !== "ENCERRADA") ?? null;
          setLiveAtiva(ativa);
        })
        .catch(() => setLiveAtiva(null));
    };
    verificarLive();
    const intervalo = window.setInterval(verificarLive, 15_000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (liveAtiva?.iniciadaEm) {
      const calcular = () => Math.max(0, Math.floor((Date.now() - new Date(liveAtiva.iniciadaEm).getTime()) / 1000));
      setTempoLiveShell(calcular());
      const t = window.setInterval(() => setTempoLiveShell(calcular()), 1000);
      return () => window.clearInterval(t);
    }
    setTempoLiveShell(0);
  }, [liveAtiva]);

  const tempoLiveFormatado = useMemo(() => {
    const m = Math.floor(tempoLiveShell / 60);
    const s = tempoLiveShell % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [tempoLiveShell]);

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

  const rotasPrimariasCrmV3 = useMemo(() => {
    const caminhosVisiveis = new Set(rotasDesktopVisiveis.map((rota) => rota.caminho));
    return rotasCrmV3Principais.filter((rota) => caminhosVisiveis.has(rota.caminho));
  }, [rotasDesktopVisiveis]);

  // CRM v3 design uses specific icons per tab (different from sidebar)
  // CSS controls the rendered size (15px mobile, 15px desktop)
  const iconesCrmV3: Record<string, ReactNode> = {
    "/app": <Home size={15} />,
    "/app/reservas": <ShoppingBag size={15} />,
    "/app/conversas": <MessageSquare size={15} />,
    "/app/clientes": <Users size={15} />,
    "/app/live": <Video size={15} />,
    "/app/loja": <Store size={15} />,
    "/app/relatorios": <BarChart3 size={15} />,
  };

  // ── Módulos drawer (expands inside the tab bar — shows ALL routes) ──
  const [modulosAberto, setModulosAberto] = useState(false);
  const modulosTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const secoesModulos = useMemo(() => {
    const secoes = new Map<string, typeof rotasDesktopVisiveis>();
    for (const rota of rotasDesktopVisiveis) {
      const grupo = secoes.get(rota.secao) ?? [];
      grupo.push(rota);
      secoes.set(rota.secao, grupo);
    }
    return secoes;
  }, [rotasDesktopVisiveis]);

  const abrirModulos = useCallback(() => {
    if (modulosTimeoutRef.current) clearTimeout(modulosTimeoutRef.current);
    setModulosAberto(true);
  }, []);

  const fecharModulosComDelay = useCallback(() => {
    modulosTimeoutRef.current = setTimeout(() => setModulosAberto(false), 280);
  }, []);

  const fecharModulos = useCallback(() => {
    if (modulosTimeoutRef.current) clearTimeout(modulosTimeoutRef.current);
    setModulosAberto(false);
  }, []);

  useEffect(() => {
    setMenuMobileAberto(false);
    fecharModulos();
  }, [location.pathname, fecharModulos]);

  async function sair() {
    await requisitarApi("/auth/sessao", { method: "DELETE" }).catch(() => undefined);
    removerToken();
    removerUsuario();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-commerce-shell min-h-dvh bg-background text-foreground">
      {/* ── CRM v3 Mobile header — same visual identity as desktop ── */}
      <header className="crm-v3-mob-head sticky top-0 lg:hidden">
        <div className="crm-v3-mob-head-r1">
          <Link to="/app" aria-label={`Painel ${NOME_PRODUTO}`}>
            <LogoBizy className="crm-brand-wordmark" cores={CORES_BIZY_PADRAO} aria-hidden="true" />
          </Link>
          <span className="crm-v3-mob-tag">CRM</span>
          <div className="crm-v3-mob-head-actions">
            <button type="button" className="crm-v3-mob-head-icon" aria-label="Buscar" onClick={() => navigate("/app")}>
              <Search size={16} />
            </button>
            <button type="button" className="crm-v3-mob-head-icon" aria-label="Notificações" onClick={() => setNotificacoesAberto(true)}>
              <Bell size={16} />
              <span className="crm-v3-mob-badge">4</span>
            </button>
          </div>
        </div>
        {/* Tab bar — reuses desktop .crm-v3-tabs / .crm-v3-tab classes */}
        <nav className="crm-v3-tabs crm-v3-mob-tabbar" aria-label="Navegação principal">
          <button
            type="button"
            className="crm-v3-menu-trigger"
            onClick={() => setMenuMobileAberto(true)}
          >
            <Menu size={15} />
            Módulos
          </button>
          <div className="crm-v3-tabs-inner">
            {rotasPrimariasCrmV3.map((item) => {
              const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);
              return (
                <NavLink
                  key={item.caminho}
                  to={item.caminho}
                  end={item.fim}
                  aria-current={ativo ? "page" : undefined}
                  className="crm-v3-tab"
                >
                  <span aria-hidden="true">{iconesCrmV3[item.caminho] ?? item.icone}</span>
                  {item.rotulo}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ── Mobile modules sheet (replaces old sidebar) ── */}
      <Sheet open={menuMobileAberto} onOpenChange={setMenuMobileAberto}>
        <SheetContent side="bottom" className="crm-v3-mob-modulos-sheet rounded-t-2xl max-h-[80dvh]" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          <SheetHeader className="border-b px-4 py-3 text-left" style={{ borderColor: "var(--line-2)" }}>
            <SheetTitle className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)" }}>
              <Grid2X2 size={16} />
              Módulos
            </SheetTitle>
            <SheetDescription className="text-xs" style={{ color: "var(--ink-3)" }}>Todos os módulos do CRM</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(80dvh-72px)]">
            <nav className="crm-v3-mob-modulos-grid">
              {secoesVisiveis.map((secao) => {
                const rotasSecao = secao === "Admin/Sistema"
                  ? rotasAdminSistema
                  : rotasComerciaisFiltradas.filter((r) => r.secao === secao);
                if (!rotasSecao.length) return null;
                return (
                  <Fragment key={secao}>
                    <span className="crm-v3-mob-modulos-secao">{secao}</span>
                    {rotasSecao.map((item) => {
                      const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);
                      return (
                        <NavLink
                          key={item.caminho}
                          to={item.caminho}
                          end={item.fim}
                          aria-current={ativo ? "page" : undefined}
                          className="crm-v3-mob-modulos-item"
                        >
                          <span aria-hidden="true">{item.icone}</span>
                          {item.rotulo}
                        </NavLink>
                      );
                    })}
                  </Fragment>
                );
              })}
              <Separator className="my-2 col-span-2" style={{ background: "var(--line)" }} />
              <button
                type="button"
                className="crm-v3-mob-modulos-item col-span-2"
                style={{ color: "var(--ink-3)" }}
                onClick={() => void sair()}
              >
                <Settings size={18} />
                Sair
              </button>
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ── Mobile notifications sheet ── */}
      <Sheet open={notificacoesAberto} onOpenChange={setNotificacoesAberto}>
        <SheetContent side="bottom" className="crm-v3-mob-modulos-sheet rounded-t-2xl max-h-[70dvh]" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          <SheetHeader className="border-b px-4 py-3 text-left" style={{ borderColor: "var(--line-2)" }}>
            <SheetTitle className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)" }}>
              <Bell size={16} />
              Notificações
            </SheetTitle>
            <SheetDescription className="text-xs" style={{ color: "var(--ink-3)" }}>Avisos e alertas recentes</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(70dvh-72px)]">
            <div className="grid gap-1 p-2">
              {[
                { titulo: "Novo pedido recebido", detalhe: "Cliente solicitou reserva de produto", tempo: "Agora", icone: <ShoppingBag size={16} /> },
                { titulo: "Mensagem não lida", detalhe: "2 conversas aguardam resposta", tempo: "5 min", icone: <MessageSquare size={16} /> },
                { titulo: "Stock baixo", detalhe: "3 produtos abaixo do mínimo", tempo: "1h", icone: <Package size={16} /> },
                { titulo: "Live programada", detalhe: "Próxima live em 2 horas", tempo: "2h", icone: <Video size={16} /> },
              ].map((item) => (
                <button
                  key={item.titulo}
                  type="button"
                  className="flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.05]"
                  style={{ color: "var(--ink)" }}
                  onClick={() => {
                    setNotificacoesAberto(false);
                    navigate("/app/relatorios");
                  }}
                >
                  <span className="mt-0.5 flex-shrink-0 rounded-lg p-2" style={{ background: "var(--em-tint)", color: "var(--em-ink)" }}>
                    {item.icone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{item.titulo}</p>
                    <p className="text-xs" style={{ color: "var(--ink-3)" }}>{item.detalhe}</p>
                  </div>
                  <span className="flex-shrink-0 text-[11px] font-medium" style={{ color: "var(--ink-4)" }}>{item.tempo}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ── Desktop CRM v3 header (Market identity) ── */}
      <header className="crm-v3-shell hidden lg:block">
        <div className="crm-v3-util">
          <span className="crm-v3-util-live">
            <Bolt size={13} />
            Live pronta · pedidos, clientes e loja no mesmo comando
          </span>
          <span className="crm-v3-util-right">
            <Link to="/app/loja">Ver loja pública</Link>
            <span>Ajuda</span>
            <span>{usuario?.nome ?? "Vendedor"} · {NOME_PRODUTO}</span>
          </span>
        </div>

        <div className="crm-v3-head">
          <Link to="/app" className="crm-v3-brand" aria-label={`Painel ${NOME_PRODUTO}`}>
            <LogoBizy className="crm-brand-wordmark crm-v3-brand-wordmark" aria-hidden="true" />
            <span>CRM</span>
          </Link>

          <div className="crm-v3-search-wrap">
            <span className="crm-v3-search-scope">
              Em tudo
              <ChevronDown size={13} />
            </span>
            <BuscaGlobalComercial className="crm-v3-searchbar" placeholder="Buscar pedidos, clientes, produtos…" />
            <button type="button" className="crm-v3-search-go" aria-label="Buscar">
              <Search size={15} />
              Buscar
            </button>
          </div>

          <button type="button" className="crm-v3-action" onClick={() => navigate("/app/relatorios")}>
            <Bell size={20} />
            <span className="crm-v3-badge">4</span>
            Avisos
          </button>
          <button type="button" className="crm-v3-action" onClick={() => navigate("/app/reservas")}>
            <Plus size={20} />
            Criar
          </button>
          <button type="button" className="crm-v3-account" onClick={() => navigate("/app/administracao")}>
            <span>{(usuario?.nome ?? "V").slice(0, 2).toUpperCase()}</span>
            Conta
          </button>
        </div>

        <nav
          className="crm-v3-tabs"
          aria-label="Navegação principal do CRM"
          onMouseLeave={fecharModulosComDelay}
        >
          <button
            type="button"
            className="crm-v3-menu-trigger"
            onClick={() => setModulosAberto((v) => !v)}
            onMouseEnter={abrirModulos}
          >
            <Menu size={15} />
            Módulos
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {modulosAberto ? (
              <motion.div
                key="modulos"
                className="crm-v3-modulos-drawer"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
                onMouseEnter={abrirModulos}
              >
                {[...secoesModulos.entries()].map(([secao, rotas]) => (
                  <div key={secao} className="crm-v3-modulos-grupo">
                    <span className="crm-v3-modulos-secao">{secao}</span>
                    {rotas.map((rota) => {
                      const ativo = rota.fim ? location.pathname === rota.caminho : location.pathname.startsWith(rota.caminho);
                      return (
                        <NavLink
                          key={rota.caminho}
                          to={rota.caminho}
                          end={rota.fim}
                          aria-current={ativo ? "page" : undefined}
                          className="crm-v3-modulos-item"
                          onClick={fecharModulos}
                        >
                          <span aria-hidden="true">{rota.icone}</span>
                          {rota.rotulo}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="tabs"
                className="crm-v3-tabs-inner"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
              >
                {rotasPrimariasCrmV3.map((item) => {
                  const ativo = item.fim ? location.pathname === item.caminho : location.pathname.startsWith(item.caminho);
                  return (
                    <NavLink
                      key={item.caminho}
                      to={item.caminho}
                      end={item.fim}
                      aria-current={ativo ? "page" : undefined}
                      className="crm-v3-tab"
                    >
                      <span aria-hidden="true">{iconesCrmV3[item.caminho] ?? item.icone}</span>
                      {item.rotulo}
                    </NavLink>
                  );
                })}
                {liveAtiva && (
                  <NavLink to="/app/live" className="crm-v3-live-pill">
                    <i />
                    AO VIVO {tempoLiveFormatado}
                  </NavLink>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* ── Skip to content (WCAG 2.2 AA) ── */}
      <a href="#conteudo-principal" className="skip-to-content">Ir para o conteúdo</a>

      {/* ── Main content ── */}
      <main id="conteudo-principal" className="app-route-surface crm-v3-route-surface min-h-dvh">
        <div className="crm-v3-mob-search-wrap lg:hidden">
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

      {/* Bottom nav hidden inside chat/atendimento */}
      {!location.pathname.startsWith("/app/conversas") && (
        <CrmV3MobileBottomNav
          location={location}
          navigate={navigate}
          onAbrirMenu={() => setMenuMobileAberto(true)}
        />
      )}
    </div>
  );
}

/* CRM v3 mobile bottom nav: dark bar, lime active, emerald FAB */
const crmV3BottomNavItems: Array<{ id: string; label: string; icon: typeof Home; path: string }> = [
  { id: "inicio", label: "Início", icon: Home, path: "/app" },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag, path: "/app/reservas" },
];
const crmV3BottomNavItemsAfterFab: Array<{ id: string; label: string; icon: typeof Home; path: string }> = [
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/app/conversas" },
  { id: "clientes", label: "Clientes", icon: Users, path: "/app/clientes" },
];

function CrmV3MobileBottomNav({
  location,
  navigate,
  onAbrirMenu,
}: {
  location: { pathname: string };
  navigate: (path: string) => void;
  onAbrirMenu: () => void;
}) {
  const renderItem = (item: { id: string; label: string; icon: typeof Home; path: string }) => {
    const ativo = item.path === "/app"
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        className="crm-v3-mob-bottom-item"
        data-active={ativo || undefined}
        aria-current={ativo ? "page" : undefined}
        onClick={() => navigate(item.path)}
      >
        <Icon size={15} />
        {item.label}
      </button>
    );
  };

  return (
    <nav className="crm-v3-mob-bottom lg:hidden" aria-label="Navegação principal">
      {crmV3BottomNavItems.map(renderItem)}
      <button
        type="button"
        className="crm-v3-mob-fab"
        aria-label="Módulos"
        onClick={onAbrirMenu}
      >
        <Menu size={15} />
      </button>
      {crmV3BottomNavItemsAfterFab.map(renderItem)}
    </nav>
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

function BuscaGlobalComercial({ className, placeholder = "Buscar cliente, telefone, produto, pedido..." }: { className?: string; placeholder?: string } = {}) {
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
    <section className={cn("app-global-search grid gap-2", className)} aria-label="Pesquisa global comercial">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          aria-label="Buscar cliente, telefone, produto, pedido ou conversa"
          className="h-10 rounded-lg border-border/50 bg-card pl-9 pr-10 shadow-none text-sm"
          placeholder={placeholder}
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
