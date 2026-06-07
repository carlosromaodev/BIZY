import {
  Camera,
  Check,
  Eye,
  MessageSquare,
  PackageCheck,
  Radio,
  RefreshCcw,
  Send,
  Signal,
  Square,
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
  PageHead,
  PillBizy,
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

  const rotuloEstadoLive = liveAtual
    ? liveAtual.status === "ERRO"
      ? "Com alerta"
      : liveAtual.status === "CONECTANDO"
        ? "A ligar"
        : "Ativa"
    : "Inativa";

  /* ── Timer da live ── */
  useEffect(() => {
    if (liveAtual && liveAtual.status !== "ERRO") {
      tempoRef.current = window.setInterval(() => setTempoLive((t) => t + 1), 1000);
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
  const espectadoresAtuaisTexto = liveAtual?.espectadoresAtuais == null
    ? "A aguardar dados"
    : `${formatarContagemLive(liveAtual.espectadoresAtuais)} a assistir`;
  const picoEspectadoresTexto = liveAtual?.picoEspectadores == null
    ? "Sem dados"
    : formatarContagemLive(liveAtual.picoEspectadores);

  /* ── Produto em destaque ── */
  const produtoDestaque = useMemo(() => {
    if (!reservasAtivas.length || !resumo.pecas.length) return null;
    const ultimaReserva = reservasAtivas[0];
    return resumo.pecas.find((p) => p.codigo === ultimaReserva.codigoPeca) ?? null;
  }, [reservasAtivas, resumo.pecas]);

  return (
    <CrmPageMotion>
      {/* ── Header ── */}
      <PageHead
        eyebrow={liveAtual ? `Ao vivo · ${tempoFormatado}` : "Vendas ao vivo · Captação e reservas em tempo real"}
        titulo="Central de live"
        tamanhoTitulo="sm"
      >
        {liveAtual && (
          <PillBizy>
            <span className="bz-live-dot" />
            {liveAtual.username} · {liveAtual.providerNome}
          </PillBizy>
        )}
        {liveAtual && (
          <BotaoBizy variante="ghost" icone={X} onClick={() => void encerrarLive()} className="bz-btn-rose">
            Terminar live
          </BotaoBizy>
        )}
        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetTrigger asChild>
            <button type="button" className="bz-btn bz-btn-ghost">
              <Zap size={16} />
              Teste rápido
            </button>
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
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      {/* ── Live Grid (Stage + Feed) ── */}
      <div className="bz-live-grid">
        <div>
          {/* ── Stage ── */}
          {liveAtual ? (
            <div className="bz-live-stage">
              <div className="bz-live-top">
                <span className="bz-live-tag"><span className="pulse-dot" />Ao vivo</span>
                <span className="bz-live-eye"><Eye size={14} />{espectadoresAtuaisTexto}</span>
              </div>
              <div className="bz-live-cam"><Camera size={48} /></div>
              {produtoDestaque && (
                <div className="bz-now-show">
                  <span className="bz-now-ph" style={{ background: "linear-gradient(150deg, oklch(0.62 0.12 159), oklch(0.45 0.09 162))" }} />
                  <div>
                    <div className="bz-now-show-label">A mostrar agora</div>
                    <div className="bz-now-show-name">{produtoDestaque.nome}</div>
                  </div>
                  <span className="bz-now-show-price">{formatarKwanza(produtoDestaque.precoEmKwanza)}</span>
                </div>
              )}
            </div>
          ) : (
            /* ── Start Live Form ── */
            <div className="bz-panel">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const username = liveUsername.trim();
                  if (!username) { setMensagem("Informe o username."); return; }
                  if (liveAtual) { setMensagem("Encerre a live actual antes de iniciar outra."); return; }
                  if (providerLive !== "manual") { setConfirmarIniciar(username); return; }
                  void enviar(e, () => requisitarApi("/lives/iniciar", { method: "POST", body: { liveUsername: username, provider: providerLive } }), "Live conectada.");
                }}
                className="grid gap-4 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="bz-eyebrow"><span className="bz-pip" />Captação</p>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Iniciar live de vendas</h2>
                  </div>
                  <Signal size={18} style={{ color: "var(--ink-3)" }} />
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="liveUser">Username da live</label>
                    <Input id="liveUser" value={liveUsername} onChange={(e) => setLiveUsername(e.target.value)} placeholder="@loja_exemplo" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="provider">Método de captação</label>
                    <Select value={providerLive} onValueChange={setProviderLive}>
                      <SelectTrigger id="provider"><SelectValue placeholder="Método" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="tiktok-live-connector">TikTok Live Connector</SelectItem>
                        <SelectItem value="tiktok-live-python">TikTokLive Python</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <BotaoBizy icone={Radio} tipo="submit">Iniciar</BotaoBizy>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── Mini Metrics ── */}
          <div className="bz-live-mini">
            <div className="bz-live-mini-card accent">
              <div className="bz-live-mini-label">Reservas na live</div>
              <div className="bz-live-mini-value">{reservasAtivas.length}</div>
            </div>
            <div className="bz-live-mini-card accent">
              <div className="bz-live-mini-label">Receita reservada</div>
              <div className="bz-live-mini-value">{receitaReservada >= 1000 ? `${Math.round(receitaReservada / 1000)}k` : receitaReservada}</div>
            </div>
            <div className="bz-live-mini-card">
              <div className="bz-live-mini-label">Pico de espectadores</div>
              <div className="bz-live-mini-value">{picoEspectadoresTexto}</div>
            </div>
            <div className="bz-live-mini-card">
              <div className="bz-live-mini-label">Conversão</div>
              <div className="bz-live-mini-value">{conversao}%</div>
            </div>
          </div>
        </div>

        {/* ── Feed de reservas em tempo real ── */}
        <div className="bz-feed">
          <div className="bz-feed-head">
            <span className="bz-feed-title"><Zap size={17} style={{ color: "var(--green)" }} />Reservas em tempo real</span>
            {liveAtual && (
              <span className="bz-feed-auto"><Zap size={13} />Auto-reserva activa</span>
            )}
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            {reservasAtivas.length > 0 ? reservasAtivas.slice(0, 8).map((reserva, i) => {
              const nome = reserva.nomeCliente || reserva.usernameCliente || "Cliente";
              const username = reserva.usernameCliente || reserva.telefoneCliente;
              const peca = resumo.pecas.find((p) => p.codigo === reserva.codigoPeca);
              const preco = peca?.precoEmKwanza ?? 0;
              const variante = reserva.varianteSelecionada
                ? ` · ${Object.values(reserva.varianteSelecionada).join(", ")}`
                : "";
              const isNew = i === 0 && Date.now() - new Date(reserva.criadaEm).getTime() < 60000;

              return (
                <motion.div
                  key={reserva.id}
                  className={`bz-feed-row${isNew ? " novo" : ""}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                  layout
                >
                  <AvatarBizy
                    iniciais={obterIniciais(nome)}
                    cor={obterCorAvatar(nome)}
                    tamanho={34}
                    src={reserva.avatarUrlCliente}
                    alt={nome}
                  />
                  <div className="bz-feed-body">
                    <div className="bz-feed-person">
                      <b>{nome}</b>
                      {username && <span>@{username}</span>}
                    </div>
                    <div className="bz-feed-line">
                      reservou <b>{peca?.nome ?? `#${reserva.codigoPeca}`}</b>{variante}
                    </div>
                    <div className="bz-feed-meta">
                      {isNew
                        ? <span style={{ color: "var(--green-ink)", fontWeight: 700 }}>agora mesmo</span>
                        : reserva.expiraEm ? formatarTempoRestante(reserva.expiraEm) : traduzirEstadoReserva(reserva.estado)
                      }
                    </div>
                  </div>
                  {preco > 0 && <span className="bz-feed-price">{formatarKwanza(preco)}</span>}
                  <IconButton icone={Check} solid titulo="Confirmar" />
                </motion.div>
              );
            }) : (
              <motion.div
                key="vazio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bz-feed-empty"
              >
                {carregando ? "A carregar reservas..." : "Sem reservas activas. Inicie uma live para captar comentários."}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Feed de eventos toast ── */}
          <AnimatePresence>
            {feedEventos.filter((e) => e.tipo === "comentario").slice(0, 3).map((evento) => (
              <motion.div
                key={evento.id}
                className="bz-feed-row"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <AvatarBizy
                  iniciais={obterIniciais(evento.displayName || evento.username || "?")}
                  cor={obterCorAvatar(evento.displayName || evento.username || "?")}
                  tamanho={34}
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
                  <div className="bz-feed-meta">agora · comentário</div>
                </div>
                <IconButton icone={MessageSquare} titulo="Responder" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {mensagem && <footer className="bz-panel" style={{ padding: "12px 18px", fontSize: 13.5, color: "var(--ink-2)" }} aria-live="polite">{mensagem}</footer>}

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
