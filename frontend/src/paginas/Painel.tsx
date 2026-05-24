import {
  Activity,
  Boxes,
  CircleDollarSign,
  Clock3,
  MessageSquareText,
  Radio,
  Send,
  Signal,
  Square,
  UserRoundCheck,
  Zap
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { requisitarApi, obterUrlEventos } from "../api";
import { CabecalhoPagina, ResumoIndicadores } from "../componentes/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { type ResumoPainel, resumoInicial, estadosReservaAtiva } from "../tipos";
import { formatarDataCurta, formatarKwanza, formatarTempoRestante, obterPrecoDaPeca } from "../utilidades";

function obterUsernameTikTokPadrao() {
  const configurado = import.meta.env.VITE_TIKTOK_LIVE_USERNAME_PADRAO?.trim();
  const username = configurado && configurado.length > 0 ? configurado : "@loja_teste";
  return username.startsWith("@") ? username : `@${username}`;
}

export function PaginaPainel() {
  const [resumo, setResumo] = useState<ResumoPainel>(resumoInicial);
  const [mensagem, setMensagem] = useState("Painel pronto.");
  const [carregando, setCarregando] = useState(false);
  const [liveUsername, setLiveUsername] = useState(obterUsernameTikTokPadrao);
  const [providerLive, setProviderLive] = useState("manual");
  const [comentarioManual, setComentarioManual] = useState("eu quero 923456789 peça 4");

  const reservasAtivas = useMemo(
    () => resumo.reservas.filter((r) => estadosReservaAtiva.includes(r.estado)),
    [resumo.reservas]
  );

  const receitaReservada = useMemo(
    () =>
      resumo.reservas
        .filter((r) => [...estadosReservaAtiva, "PAID"].includes(r.estado))
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas]
  );

  const receitaPaga = useMemo(
    () =>
      resumo.reservas
        .filter((r) => r.estado === "PAID")
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas]
  );

  const filaTotal = useMemo(
    () => Object.values(resumo.filaEspera).reduce((t, q) => t + q, 0),
    [resumo.filaEspera]
  );

  const taxaConversao = resumo.comentariosRecebidos
    ? Math.round((resumo.comentariosValidos / resumo.comentariosRecebidos) * 100)
    : 0;

  const taxaPagamento = resumo.reservasCriadas
    ? Math.round((resumo.reservasPagas / resumo.reservasCriadas) * 100)
    : 0;

  const proximaExpirar = useMemo(
    () =>
      reservasAtivas
        .filter((r) => r.expiraEm)
        .sort((a, b) => Number(new Date(a.expiraEm ?? 0)) - Number(new Date(b.expiraEm ?? 0)))[0] ?? null,
    [reservasAtivas]
  );

  const pecasDisponiveis = resumo.pecas.filter((p) => p.estado === "DISPONIVEL").length;
  const aguardandoPagamento = resumo.reservas.filter((r) => r.estado === "WAITING_PAYMENT").length;
  const liveAtual = useMemo(
    () => resumo.lives.find((live) => live.status !== "ENCERRADA") ?? null,
    [resumo.lives]
  );
  const rotuloEstadoLive = liveAtual
    ? liveAtual.status === "ERRO"
      ? "Com alerta"
      : liveAtual.status === "CONECTANDO"
        ? "A ligar"
        : "Ativa"
    : "Inativa";

  async function carregarResumo() {
    const resposta = await requisitarApi<ResumoPainel>("/painel/resumo");
    setResumo(resposta);
  }

  useEffect(() => {
    void carregarResumo().catch(() => setMensagem("Backend ainda não respondeu."));

    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregarResumo().catch(() => undefined);

    [
      "LIVE_CONNECTED", "LIVE_DISCONNECTED", "COMMENT_RECEIVED", "COMMENT_PARSED",
      "RESERVATION_CREATED", "RESERVATION_EXPIRING", "RESERVATION_WAITLISTED",
      "PAYMENT_CONFIRMED", "RESERVATION_EXPIRED", "STOCK_UPDATED",
      "WHATSAPP_MESSAGE_SENT"
    ].forEach((e) => eventos.addEventListener(e, atualizar));

    const intervalo = window.setInterval(atualizar, 15_000);
    return () => { eventos.close(); window.clearInterval(intervalo); };
  }, []);

  async function enviar(evento: FormEvent, acao: () => Promise<unknown>, sucesso: string) {
    evento.preventDefault();
    await executarAcao(acao, sucesso);
  }

  async function executarAcao(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A processar...");
    try {
      await acao();
      await carregarResumo();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  async function encerrarLive() {
    if (!liveAtual) return;

    await executarAcao(
      () => requisitarApi(`/lives/${encodeURIComponent(liveAtual.id)}/parar`, { method: "POST" }),
      "Live encerrada."
    );
  }

  return (
    <>
      <CabecalhoPagina rotulo="Operação comercial" titulo="Painel">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
            <Radio className={liveAtual && liveAtual.status !== "ERRO" ? "text-success" : "text-muted-foreground"} size={18} />
            <div>
              <span className="block text-muted-foreground">{liveAtual ? `${liveAtual.providerNome} · ${liveAtual.username}` : "Estado da live"}</span>
              <strong className="block leading-tight">{rotuloEstadoLive}</strong>
            </div>
          </div>
          {liveAtual && (
            <Button type="button" variant="destructive" size="sm" onClick={() => void encerrarLive()} disabled={carregando}>
              <Square size={15} />
              Encerrar
            </Button>
          )}
        </div>
      </CabecalhoPagina>

      <section className="grid painel-commerce-grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card>
          <CardContent className="grid gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <CircleDollarSign size={16} />
                Receita em reservas
              </span>
              <span className="text-sm text-muted-foreground">{formatarDataCurta(new Date())}</span>
            </div>
            <strong className="text-3xl font-bold tracking-tight">{formatarKwanza(receitaReservada)}</strong>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{formatarKwanza(receitaPaga)} pagos</span>
              <span>{taxaPagamento}% liquidação</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-success" style={{ width: `${Math.min(taxaPagamento, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <ResumoIndicadores
          rotulo="Resumo da operação"
          itens={[
            {
              icone: <MessageSquareText />,
              titulo: "Conversão",
              valor: `${taxaConversao}%`,
              detalhe: `${resumo.comentariosValidos} válidos de ${resumo.comentariosRecebidos}`,
              tom: "principal"
            },
            {
              icone: <Clock3 />,
              titulo: "A expirar",
              valor: proximaExpirar ? formatarTempoRestante(proximaExpirar.expiraEm) : "Sem fila",
              detalhe: proximaExpirar ? `Peça #${proximaExpirar.codigoPeca}` : "Nenhuma reserva crítica",
              tom: proximaExpirar ? "atencao" : "neutro"
            },
            {
              icone: <UserRoundCheck />,
              titulo: "Pagamento",
              valor: aguardandoPagamento,
              detalhe: `${resumo.reservasPagas} reservas pagas`,
              tom: aguardandoPagamento ? "atencao" : "sucesso"
            },
            {
              icone: <Boxes />,
              titulo: "Stock ativo",
              valor: pecasDisponiveis,
              detalhe: `${filaTotal} clientes em fila`
            }
          ]}
        />
      </section>

      <section className="grid painel-commerce-grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="grid gap-4 p-4">
          <form
            onSubmit={(e) => {
              const username = liveUsername.trim();
              if (!username) {
                e.preventDefault();
                setMensagem("Informe o username da live antes de iniciar.");
                return;
              }
              if (liveAtual) {
                e.preventDefault();
                setMensagem("Já existe uma live conectada. Encerre a sessão atual antes de iniciar outra.");
                return;
              }
              if (providerLive !== "manual" && !window.confirm(`Iniciar captação automática para ${username}?`)) {
                e.preventDefault();
                return;
              }
              void enviar(
                e,
                () => requisitarApi("/lives/iniciar", { method: "POST", body: { liveUsername: username, provider: providerLive } }),
                "Live conectada."
              );
            }}
            className="contents"
          >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Captação</p>
              <h2 className="text-lg font-semibold">Live de vendas</h2>
            </div>
            <Signal className="text-muted-foreground" size={20} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="liveUser">Username</label>
            <Input id="liveUser" value={liveUsername} onChange={(e) => setLiveUsername(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="provider">Método</label>
            <Select value={providerLive} onValueChange={setProviderLive}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="tiktok-live-connector">TikTok Live Connector</SelectItem>
                <SelectItem value="tiktok-live-python">TikTokLive Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" disabled={carregando || Boolean(liveAtual)}>
            <Radio size={18} />
            {liveAtual ? "Live em andamento" : "Iniciar captação"}
          </Button>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-4">
          <form
            onSubmit={(e) => {
              const endpoint = liveAtual
                ? `/lives/${encodeURIComponent(liveAtual.id)}/comentarios/manual`
                : "/comentarios/manual";
              const body = liveAtual
                ? {
                    username: "cliente_live",
                    displayName: "Cliente Live",
                    commentText: comentarioManual
                  }
                : {
                    liveId: "manual_local",
                    username: "cliente_live",
                    displayName: "Cliente Live",
                    commentText: comentarioManual
                  };

              void enviar(e, () => requisitarApi(endpoint, { method: "POST", body }), "Comentário enviado.");
            }}
            className="contents"
          >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Teste rápido</p>
              <h2 className="text-lg font-semibold">Comentário manual</h2>
            </div>
            <Zap className="text-muted-foreground" size={20} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="comManual">Texto do comentário</label>
            <Input id="comManual" value={comentarioManual} onChange={(e) => setComentarioManual(e.target.value)} />
          </div>
          <Button variant="outline" size="lg" disabled={carregando}>
            <Send size={18} />
            Enviar para parser
          </Button>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Resumo ao vivo</p>
              <h2 className="text-lg font-semibold">Atividade recente</h2>
            </div>
            <Activity className="text-muted-foreground" size={20} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Comentários</span>
              <strong className="block text-2xl">{resumo.comentariosRecebidos}</strong>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Reservas criadas</span>
              <strong className="block text-2xl">{resumo.reservasCriadas}</strong>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Reservas ativas</span>
              <strong className="block text-2xl">{reservasAtivas.length}</strong>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Pagas</span>
              <strong className="block text-2xl">{resumo.reservasPagas}</strong>
            </div>
          </div>
          </CardContent>
        </Card>
      </section>

      <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>
    </>
  );
}
