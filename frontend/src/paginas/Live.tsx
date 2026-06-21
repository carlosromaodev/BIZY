import {
  Camera,
  Check,
  Clock,
  Eye,
  MessageSquare,
  Radio,
  Send,
  ShoppingBag,
  Signal,
  TrendingUp,
  Users,
  X,
  Zap
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { criarFonteEventosAutenticada, requisitarApi } from "../api";
import { notificarSite } from "../componentes/Notificacoes";
import { ConfirmarAcao } from "../componentes/ConfirmarAcao";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  BotaoBizy,
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  IconButton,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { type ResumoPainel, resumoInicial, estadosReservaAtiva } from "../tipos";
import { formatarKwanza, formatarTempoRestante, obterPrecoDaPeca, traduzirEstadoReserva } from "../utilidades";

function obterUsernameTikTokPadrao() {
  const configurado = import.meta.env.VITE_TIKTOK_LIVE_USERNAME_PADRAO?.trim();
  const username = configurado && configurado.length > 0 ? configurado : "@loja_teste";
  return username.startsWith("@") ? username : `@${username}`;
}

function formatarContagemLive(valor: number): string {
  return new Intl.NumberFormat("pt-AO").format(valor);
}

function formatarTempoRelativo(criadaEm: string): { texto: string; recente: boolean } {
  const diff = Date.now() - new Date(criadaEm).getTime();
  if (diff < 60_000) return { texto: "agora", recente: true };
  const min = Math.floor(diff / 60_000);
  if (min < 60) return { texto: `${min} min`, recente: min <= 2 };
  const h = Math.floor(min / 60);
  return { texto: `${h}h`, recente: false };
}

interface FeedEvento {
  id: number;
  tipo: "reserva" | "comentario" | "stock";
  texto: string;
  timestamp: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  produto?: string;
  preco?: number;
  variante?: string;
}

export function PaginaLive() {
  const [resumo, setResumo] = useState<ResumoPainel>(resumoInicial);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [liveUsername, setLiveUsername] = useState(obterUsernameTikTokPadrao);
  const [providerLive, setProviderLive] = useState("manual");
  const [comentarioManual, setComentarioManual] = useState("eu quero 923456789 peça 4");
  const [confirmarIniciar, setConfirmarIniciar] = useState<string | null>(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [feedEventos, setFeedEventos] = useState<FeedEvento[]>([]);
  const [tempoLive, setTempoLive] = useState(0);
  const contadorFeed = useRef(0);
  const tempoRef = useRef<number | null>(null);

  const liveAtual = useMemo(
    () => resumo.lives.find((live) => live.status !== "ENCERRADA") ?? null,
    [resumo.lives]
  );

  const reservasAtivas = useMemo(
    () => resumo.reservas.filter((r) => estadosReservaAtiva.includes(r.estado)),
    [resumo.reservas]
  );

  /* ── Timer da live (calcula duração real desde iniciadaEm) ── */
  useEffect(() => {
    if (liveAtual && liveAtual.status !== "ERRO" && liveAtual.iniciadaEm) {
      const calcularDuracao = () => Math.max(0, Math.floor((Date.now() - new Date(liveAtual.iniciadaEm!).getTime()) / 1000));
      setTempoLive(calcularDuracao());
      tempoRef.current = window.setInterval(() => setTempoLive(calcularDuracao()), 1000);
      return () => { if (tempoRef.current) window.clearInterval(tempoRef.current); };
    }
    setTempoLive(0);
  }, [liveAtual]);

  const tempoFormatado = useMemo(() => {
    const h = Math.floor(tempoLive / 3600);
    const m = Math.floor((tempoLive % 3600) / 60);
    const s = tempoLive % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [tempoLive]);

  async function carregar() {
    setCarregando(true);
    try {
      const resposta = await requisitarApi<ResumoPainel>("/painel/resumo");
      setResumo(resposta);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  const adicionarFeed = useCallback((tipo: FeedEvento["tipo"], texto: string, extra?: Partial<FeedEvento>) => {
    contadorFeed.current += 1;
    const entrada: FeedEvento = { id: contadorFeed.current, tipo, texto, timestamp: Date.now(), ...extra };
    setFeedEventos((anteriores) => [entrada, ...anteriores].slice(0, 12));
    setTimeout(() => setFeedEventos((f) => f.filter((e) => e.id !== entrada.id)), 15000);
  }, []);

  useEffect(() => {
    void carregar();

    const eventos = criarFonteEventosAutenticada();
    const atualizar = () => void carregar().catch(() => undefined);

    eventos.addEventListener("RESERVATION_CREATED", (e) => {
      void atualizar();
      try {
        const dados = JSON.parse((e as MessageEvent).data);
        const peca = dados?.peca?.codigo ?? dados?.peca?.nome ?? "";
        const nomePeca = dados?.peca?.nome ?? peca;
        const cliente = dados?.reserva?.nomeCliente || dados?.reserva?.usernameCliente || "";
        const username = dados?.reserva?.usernameCliente || cliente;
        const avatarUrl = dados?.reserva?.avatarUrlCliente ?? null;
        const variante = dados?.reserva?.varianteSelecionada;
        const detalheVariante = variante && typeof variante === "object"
          ? ` · ${Object.values(variante).join(", ")}`
          : "";
        const preco = dados?.peca?.precoEmKwanza ?? 0;
        adicionarFeed("reserva", `${username} reservou ${nomePeca}${detalheVariante}`, {
          username,
          displayName: cliente,
          avatarUrl,
          produto: nomePeca,
          preco,
          variante: detalheVariante,
        });
        notificarSite({
          titulo: "Reserva criada",
          descricao: `${cliente} reservou a peça #${peca}${detalheVariante}`,
          variante: "success",
          duracao: 4000
        });
      } catch { void 0; }
    });

    eventos.addEventListener("COMMENT_PARSED", (e) => {
      void atualizar();
      try {
        const dados = JSON.parse((e as MessageEvent).data);
        const username = dados?.comentario?.username ?? dados?.comentario?.displayName ?? "";
        const displayName = dados?.comentario?.displayName ?? username;
        const avatarUrl = dados?.comentario?.avatarUrl ?? null;
        const texto = dados?.comentario?.commentText ?? "";
        const intencao = dados?.interpretacao?.intent;
        if (intencao === "BUY") {
          adicionarFeed("comentario", `${username}: "${texto.slice(0, 50)}"`, { username, displayName, avatarUrl });
        }
      } catch { void 0; }
    });

    eventos.addEventListener("STOCK_UPDATED", (e) => {
      void atualizar();
      try {
        const dados = JSON.parse((e as MessageEvent).data);
        const codigo = dados?.codigoPeca ?? "";
        if (codigo) adicionarFeed("stock", `Stock atualizado: #${codigo}`);
      } catch { void 0; }
    });

    ["LIVE_CONNECTED", "LIVE_DISCONNECTED", "LIVE_METRICS_UPDATED", "COMMENT_RECEIVED",
     "RESERVATION_EXPIRING", "PAYMENT_CONFIRMED", "RESERVATION_EXPIRED"
    ].forEach((ev) => eventos.addEventListener(ev, atualizar));

    eventos.addEventListener("LIVE_CONNECTED", () => {
      notificarSite({ titulo: "Live conectada", descricao: "A captação de comentários está activa.", variante: "success" });
    });

    eventos.addEventListener("RESERVATION_EXPIRING", (e) => {
      try {
        const dados = JSON.parse((e as MessageEvent).data);
        const peca = dados?.reserva?.codigoPeca ?? "";
        notificarSite({ titulo: "Reserva a expirar", descricao: `A reserva da peça #${peca} está prestes a expirar.`, variante: "warning", duracao: 5000 });
      } catch { void 0; }
    });

    eventos.addEventListener("PAYMENT_CONFIRMED", (e) => {
      try {
        const dados = JSON.parse((e as MessageEvent).data);
        const peca = dados?.reserva?.codigoPeca ?? dados?.codigoPeca ?? "";
        notificarSite({ titulo: "Pagamento confirmado", descricao: `Pagamento da peça #${peca} foi confirmado.`, variante: "success" });
      } catch { void 0; }
    });

    const intervalo = window.setInterval(atualizar, 10_000);
    return () => { eventos.close(); window.clearInterval(intervalo); };
  }, [adicionarFeed]);

  async function enviar(evento: FormEvent, acao: () => Promise<unknown>, sucesso: string) {
    evento.preventDefault();
    setCarregando(true);
    setMensagem("A processar...");
    try {
      await acao();
      await carregar();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  async function encerrarLive() {
    if (!liveAtual) return;
    setCarregando(true);
    setMensagem("A encerrar...");
    try {
      await requisitarApi(`/lives/${encodeURIComponent(liveAtual.id)}/parar`, { method: "POST" });
      await carregar();
      setMensagem("Live encerrada.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao encerrar.");
    } finally {
      setCarregando(false);
    }
  }

  /* ── Métricas da live ── */
  const receitaReservada = reservasAtivas.reduce((acc, r) => acc + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0);
  const conversao = resumo.comentariosRecebidos > 0
    ? ((resumo.reservasCriadas / resumo.comentariosRecebidos) * 100).toFixed(1)
    : "0";
  const picoEspectadoresTexto = liveAtual?.picoEspectadores == null
    ? "—"
    : formatarContagemLive(liveAtual.picoEspectadores);
  const pagos = reservasAtivas.filter((r) => r.estado === "PAID").length;

  /* ── Produto em destaque ── */
  const produtoDestaque = useMemo(() => {
    if (!reservasAtivas.length || !resumo.pecas.length) return null;
    const ultimaReserva = reservasAtivas[0];
    return resumo.pecas.find((p) => p.codigo === ultimaReserva.codigoPeca) ?? null;
  }, [reservasAtivas, resumo.pecas]);

  return (
    <CrmPageMotion>
      {/* ── Header ── */}
      <div className="crm-v3-pghead">
        <div>
          <h1>Central de live</h1>
          <div className="crm-v3-sub">
            {liveAtual
              ? `${liveAtual.providerNome} · @${liveAtual.username} · começou às ${new Date(liveAtual.iniciadaEm ?? Date.now()).toLocaleTimeString("pt", { hour: "2-digit", minute: "2-digit" })}`
              : "Nenhuma live ativa"}
          </div>
        </div>
        <div className="crm-v3-pghead-right">
          {liveAtual && (
            <BotaoBizy variante="ghost" icone={X} onClick={() => void encerrarLive()} className="bz-btn-rose">
              Terminar live
            </BotaoBizy>
          )}
          <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
            <SheetTrigger asChild>
              <BotaoBizy variante="ghost" icone={Zap}>
                Teste rápido
              </BotaoBizy>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Comentário manual</SheetTitle>
                <SheetDescription>Simule um comentário de live para testar o parser de reservas.</SheetDescription>
              </SheetHeader>
              <form
                onSubmit={(e) => {
                  const endpoint = liveAtual
                    ? `/lives/${encodeURIComponent(liveAtual.id)}/comentarios/manual`
                    : "/comentarios/manual";
                  const body = liveAtual
                    ? { username: "cliente_live", displayName: "Cliente Live", commentText: comentarioManual }
                    : { liveId: "manual_local", username: "cliente_live", displayName: "Cliente Live", commentText: comentarioManual };
                  void enviar(e, () => requisitarApi(endpoint, { method: "POST", body }), "Comentário enviado.");
                  setSheetAberto(false);
                }}
                className="grid gap-4 px-1 pt-4"
              >
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="comManual">Texto do comentário</label>
                  <Input id="comManual" value={comentarioManual} onChange={(e) => setComentarioManual(e.target.value)} placeholder="eu quero 923456789 peça 4" />
                </div>
                <Button size="lg" disabled={carregando}>
                  <Send size={18} />
                  Enviar para parser
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="bz-live-kpis">
        <div className="bz-live-kpi">
          <div className="bz-live-kpi-icon"><Eye size={16} /></div>
          <div className="bz-live-kpi-body">
            <span className="bz-live-kpi-label">A assistir agora</span>
            <strong className="bz-live-kpi-value bz-live-kpi-big">
              {liveAtual?.espectadoresAtuais != null ? formatarContagemLive(liveAtual.espectadoresAtuais) : "—"}
            </strong>
            <span className="bz-live-kpi-sub">pico {picoEspectadoresTexto}</span>
          </div>
        </div>
        <div className="bz-live-kpi">
          <div className="bz-live-kpi-icon accent-green"><ShoppingBag size={16} /></div>
          <div className="bz-live-kpi-body">
            <span className="bz-live-kpi-label">Reservas na live</span>
            <strong className="bz-live-kpi-value">{reservasAtivas.length}</strong>
            <span className="bz-live-kpi-sub">conversão {conversao}%</span>
          </div>
        </div>
        <div className="bz-live-kpi">
          <div className="bz-live-kpi-icon accent-green"><TrendingUp size={16} /></div>
          <div className="bz-live-kpi-body">
            <span className="bz-live-kpi-label">Reservado</span>
            <strong className="bz-live-kpi-value">{receitaReservada >= 1000 ? `${Math.round(receitaReservada / 1000)}k` : receitaReservada}</strong>
            <span className="bz-live-kpi-sub">Kz nesta live</span>
          </div>
        </div>
        <div className="bz-live-kpi">
          <div className="bz-live-kpi-icon accent-amber"><Check size={16} /></div>
          <div className="bz-live-kpi-body">
            <span className="bz-live-kpi-label">Já pagos</span>
            <strong className="bz-live-kpi-value">{pagos}</strong>
            <span className="bz-live-kpi-sub">{pagos === 1 ? "1 a aguardar" : `${Math.max(0, reservasAtivas.length - pagos)} a aguardar`}</span>
          </div>
        </div>
      </div>

      {/* ── Live Grid (Stage + Feed) ── */}
      <div className="bz-live-grid">
        <div>
          {/* ── Stage ── */}
          {liveAtual ? (
            <div className="bz-live-stage">
              <div className="bz-live-top">
                <span className="bz-live-tag"><span className="pulse-dot" />AO VIVO · {tempoFormatado}</span>
                <span className="bz-live-eye"><Users size={14} />{liveAtual.espectadoresAtuais != null ? formatarContagemLive(liveAtual.espectadoresAtuais) : "—"}</span>
              </div>
              <div className="bz-live-cam"><Camera size={48} /></div>
              {produtoDestaque && (
                <motion.div
                  className="bz-now-show"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={produtoDestaque.codigo}
                >
                  <span className="bz-now-ph" />
                  <div>
                    <div className="bz-now-show-label">A mostrar agora</div>
                    <div className="bz-now-show-name">{produtoDestaque.nome}</div>
                  </div>
                  <span className="bz-now-show-price">{formatarKwanza(produtoDestaque.precoEmKwanza)}</span>
                </motion.div>
              )}
            </div>
          ) : (
            /* ── Start Live Form (colorido) ── */
            <div className="bz-live-start-card">
              <div className="bz-live-start-deco" />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const username = liveUsername.trim();
                  if (!username) { setMensagem("Informe o username."); return; }
                  if (liveAtual) { setMensagem("Encerre a live actual antes de iniciar outra."); return; }
                  if (providerLive !== "manual") { setConfirmarIniciar(username); return; }
                  void enviar(e, () => requisitarApi("/lives/iniciar", { method: "POST", body: { liveUsername: username, provider: providerLive } }), "Live conectada.");
                }}
                className="bz-live-start-form"
              >
                <div className="bz-live-start-head">
                  <div>
                    <div className="bz-live-start-badge"><Radio size={14} />Pronto para transmitir</div>
                    <h2 className="bz-live-start-title">Iniciar live de vendas</h2>
                    <p className="bz-live-start-desc">Conecte a sua live e comece a captar reservas em tempo real a partir dos comentários.</p>
                  </div>
                </div>
                <div className="bz-live-start-fields">
                  <div className="bz-live-start-field">
                    <label htmlFor="liveUser">Username da live</label>
                    <Input id="liveUser" value={liveUsername} onChange={(e) => setLiveUsername(e.target.value)} placeholder="@loja_exemplo" />
                  </div>
                  <div className="bz-live-start-field">
                    <label htmlFor="provider">Método de captação</label>
                    <Select value={providerLive} onValueChange={setProviderLive}>
                      <SelectTrigger id="provider"><SelectValue placeholder="Método" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="tiktok-live-connector">TikTok Live Connector</SelectItem>
                        <SelectItem value="tiktok-live-python">TikTokLive Python</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <BotaoBizy icone={Radio} tipo="submit" className="bz-live-start-btn">Iniciar live</BotaoBizy>
              </form>
            </div>
          )}
        </div>

        {/* ── Feed de reservas em tempo real ── */}
        <div className="bz-feed">
          <div className="bz-feed-head">
            <span className="bz-feed-title"><Zap size={16} className="bz-icon-green" />Reservas em tempo real</span>
            {liveAtual && (
              <span className="bz-feed-auto"><Clock size={12} />actualiza a cada 5 s</span>
            )}
          </div>
          <div className="bz-feed-scroll">
            <AnimatePresence mode="popLayout" initial={false}>
              {reservasAtivas.length > 0 ? reservasAtivas.slice(0, 10).map((reserva) => {
                const nome = reserva.nomeCliente || reserva.usernameCliente || "Cliente";
                const username = reserva.usernameCliente || reserva.telefoneCliente;
                const peca = resumo.pecas.find((p) => p.codigo === reserva.codigoPeca);
                const preco = peca?.precoEmKwanza ?? 0;
                const variante = reserva.varianteSelecionada
                  ? ` · ${Object.values(reserva.varianteSelecionada).join(", ")}`
                  : "";
                const tempo = formatarTempoRelativo(reserva.criadaEm);

                return (
                  <motion.div
                    key={reserva.id}
                    className={`bz-feed-row${tempo.recente ? " novo" : ""}`}
                    initial={{ opacity: 0, x: -20, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    layout
                  >
                    <AvatarBizy
                      iniciais={obterIniciais(nome)}
                      cor={obterCorAvatar(nome)}
                      tamanho={38}
                      src={reserva.avatarUrlCliente}
                      alt={nome}
                    />
                    <div className="bz-feed-body">
                      <div className="bz-feed-person">
                        <b>{nome}</b>
                        {username && <span>@{username}</span>}
                      </div>
                      <div className="bz-feed-line">
                        {peca?.nome ?? `#${reserva.codigoPeca}`}{variante}
                      </div>
                    </div>
                    {preco > 0 && <span className="bz-feed-price">{formatarKwanza(preco)}</span>}
                    <span className={`bz-feed-time${tempo.recente ? " recente" : ""}`}>{tempo.texto}</span>
                  </motion.div>
                );
              }) : (
                <motion.div
                  key="vazio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bz-feed-empty"
                >
                  <ShoppingBag size={28} className="bz-icon-muted" />
                  {carregando ? "A carregar reservas..." : "Sem reservas activas. Inicie uma live para captar comentários."}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Feed de eventos toast (comentários identificados) ── */}
            <AnimatePresence>
              {feedEventos.filter((e) => e.tipo === "comentario").slice(0, 3).map((evento) => (
                <motion.div
                  key={evento.id}
                  className="bz-feed-row bz-feed-row-comment"
                  initial={{ opacity: 0, scale: 0.92, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <AvatarBizy
                    iniciais={obterIniciais(evento.displayName || evento.username || "?")}
                    cor={obterCorAvatar(evento.displayName || evento.username || "?")}
                    tamanho={38}
                    src={evento.avatarUrl}
                    alt={evento.displayName || evento.username || "Cliente"}
                  />
                  <div className="bz-feed-body">
                    <div className="bz-feed-person">
                      <b>{evento.displayName || evento.username || "Cliente"}</b>
                      {evento.username && <span>@{evento.username}</span>}
                    </div>
                    <div className="bz-feed-line">
                      perguntou <b>{`"${evento.texto.split('"')[1] ?? evento.texto.slice(0, 40)}"`}</b>
                    </div>
                  </div>
                  <IconButton icone={MessageSquare} titulo="Responder" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {mensagem && <footer className="bz-live-msg" aria-live="polite">{mensagem}</footer>}

      <ConfirmarAcao
        aberto={confirmarIniciar !== null}
        titulo="Iniciar captação automática"
        descricao={`Iniciar captação automática para ${confirmarIniciar ?? ""}? Os comentários serão processados em tempo real.`}
        textoBotao="Iniciar"
        onConfirmar={() => {
          const username = confirmarIniciar;
          setConfirmarIniciar(null);
          if (!username) return;
          setCarregando(true);
          setMensagem("A processar...");
          requisitarApi("/lives/iniciar", { method: "POST", body: { liveUsername: username, provider: providerLive } })
            .then(() => carregar())
            .then(() => setMensagem("Live conectada."))
            .catch((e) => setMensagem(e instanceof Error ? e.message : "Erro inesperado."))
            .finally(() => setCarregando(false));
        }}
        onCancelar={() => setConfirmarIniciar(null)}
      />
    </CrmPageMotion>
  );
}
