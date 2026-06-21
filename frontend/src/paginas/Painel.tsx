import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  MessageSquare,
  Plus,
  ShoppingBag,
  Tag,
  Truck,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { criarFonteEventosAutenticada, requisitarApi, obterUsuario } from "../api";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  type RespostaConversas,
  type RespostaTarefasOperacionais,
  type ResumoPainel,
  type TarefaOperacional,
  resumoInicial,
  estadosReservaAtiva,
} from "../tipos";
import {
  formatarKwanza,
  obterPrecoDaPeca,
} from "../utilidades";

/* ── Helpers ────────────────────────────────────────────────────── */

function obterSaudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function dataEhHoje(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const data = new Date(valor);
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

function formatarDataLocal(): string {
  const agora = new Date();
  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${diasSemana[agora.getDay()]}, ${String(agora.getDate()).padStart(2, "0")} ${meses[agora.getMonth()]}`;
}

function formatarTempoRelativo(iso: string): string {
  const ms = Date.now() - Number(new Date(iso));
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function obterDiasSemana(): string[] {
  const hoje = new Date().getDay();
  const dias: string[] = [];
  for (let i = 6; i >= 1; i--) {
    dias.push(DIAS_SEMANA[(hoje - i + 7) % 7]);
  }
  dias.push("Hoje");
  return dias;
}

/* ── Component ──────────────────────────────────────────────────── */

export function PaginaPainel() {
  const [resumo, setResumo] = useState<ResumoPainel>(resumoInicial);
  const [mensagem, setMensagem] = useState("");
  const [conversas, setConversas] = useState<RespostaConversas["conversas"]>([]);
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const usuario = obterUsuario();

  /* ── Derived data ──────────────────────────────────────────── */

  const receitaReservada = useMemo(
    () =>
      resumo.reservas
        .filter((r) => [...estadosReservaAtiva, "PAID"].includes(r.estado))
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas],
  );

  const aguardandoPagamento = resumo.reservas.filter((r) => r.estado === "WAITING_PAYMENT").length;

  const pedidosNovosHoje = useMemo(
    () => resumo.reservas.filter((reserva) => dataEhHoje(reserva.criadaEm)).length,
    [resumo.reservas],
  );

  const conversasSemResposta = useMemo(
    () =>
      conversas.filter(
        (c) =>
          c.mensagensNaoLidas > 0 ||
          ["NOVA", "ABERTA", "AGUARDANDO_HUMANO"].includes(c.estadoCrm),
      ).length,
    [conversas],
  );

  const produtosStockBaixo = useMemo(
    () => resumo.pecas.filter((p) => p.estado !== "VENDIDA" && p.quantidade <= 2).length,
    [resumo.pecas],
  );

  const entregasPendentes = useMemo(
    () => resumo.reservas.filter((r) => r.estado === "PAID").length,
    [resumo.reservas],
  );

  const liveAtual = useMemo(
    () => resumo.lives.find((live) => live.status !== "ENCERRADA") ?? null,
    [resumo.lives],
  );

  const reservasLive = useMemo(
    () => (liveAtual ? resumo.reservas.filter((r) => dataEhHoje(r.criadaEm)).length : 0),
    [liveAtual, resumo.reservas],
  );

  const faturacaoSemanal = useMemo(() => {
    const dias: number[] = [];
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() - i);
      const totalDia = resumo.reservas
        .filter((r) => {
          if (r.estado !== "PAID" || !r.criadaEm) return false;
          const d = new Date(r.criadaEm);
          return (
            d.getFullYear() === dia.getFullYear() &&
            d.getMonth() === dia.getMonth() &&
            d.getDate() === dia.getDate()
          );
        })
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0);
      dias.push(totalDia);
    }
    return dias;
  }, [resumo.pecas, resumo.reservas]);

  const totalSemana = faturacaoSemanal.reduce((a, b) => a + b, 0);
  const maxFat = Math.max(...faturacaoSemanal, 1);
  const diasLabels = obterDiasSemana();

  const tarefasAbertas = useMemo(() => {
    const abertas = tarefas.filter((t) => t.estado === "ABERTA" || t.estado === "EM_ANDAMENTO");
    const pesoPrio: Record<string, number> = { URGENTE: 0, ALTA: 1, NORMAL: 2, BAIXA: 3 };
    return abertas.sort((a, b) => {
      const aAtrasada = a.prazoEm && new Date(a.prazoEm) < new Date() ? 0 : 1;
      const bAtrasada = b.prazoEm && new Date(b.prazoEm) < new Date() ? 0 : 1;
      if (aAtrasada !== bAtrasada) return aAtrasada - bAtrasada;
      return (pesoPrio[a.prioridade] ?? 2) - (pesoPrio[b.prioridade] ?? 2);
    });
  }, [tarefas]);

  const pedidosRecentes = useMemo(
    () =>
      [...resumo.reservas]
        .sort((a, b) => Number(new Date(b.criadaEm ?? 0)) - Number(new Date(a.criadaEm ?? 0)))
        .slice(0, 3),
    [resumo.reservas],
  );

  /* ── Data fetching ─────────────────────────────────────────── */

  async function carregarResumo() {
    const [respostaResumo, respostaConversas, respostaTarefas] = await Promise.allSettled([
      requisitarApi<ResumoPainel>("/painel/resumo"),
      requisitarApi<RespostaConversas>("/atendimento/conversas"),
      requisitarApi<RespostaTarefasOperacionais>("/tarefas?limite=30"),
    ]);

    if (respostaResumo.status === "rejected") throw respostaResumo.reason;

    setResumo(respostaResumo.value);
    setConversas(respostaConversas.status === "fulfilled" ? respostaConversas.value.conversas : []);
    setTarefas(respostaTarefas.status === "fulfilled" ? respostaTarefas.value.tarefas : []);
  }

  useEffect(() => {
    void carregarResumo()
      .catch(() => setMensagem("Backend ainda não respondeu."))
      .finally(() => setCarregandoInicial(false));

    const eventos = criarFonteEventosAutenticada();
    const atualizar = () => void carregarResumo().catch(() => undefined);

    [
      "LIVE_CONNECTED", "LIVE_DISCONNECTED", "COMMENT_RECEIVED", "COMMENT_PARSED",
      "RESERVATION_CREATED", "RESERVATION_EXPIRING", "RESERVATION_WAITLISTED",
      "PAYMENT_CONFIRMED", "RESERVATION_EXPIRED", "STOCK_UPDATED",
      "WHATSAPP_MESSAGE_SENT",
    ].forEach((e) => eventos.addEventListener(e, atualizar));

    const intervalo = window.setInterval(atualizar, 15_000);
    return () => {
      eventos.close();
      window.clearInterval(intervalo);
    };
  }, []);

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  const colTemplate = "108px 1.5fr 1.6fr 110px 150px";

  return (
    <CrmPageMotion>
      <div className="crm-v3-pgwrap">
        {/* ── Page Head ─────────────────────────────────────── */}
        <div className="crm-v3-pghead">
          <div>
            <h1>{obterSaudacao()}, {usuario?.nome?.split(" ")[0] ?? "Vendedor"} 👋</h1>
            <div className="crm-v3-sub">
              {formatarDataLocal()}
              {liveAtual && " · a tua live está a converter bem"}
            </div>
          </div>
          <div className="crm-v3-pghead-right">
            <Link to="/app/loja" className="crm-v3-btn crm-v3-btn-ghost">
              <Eye size={13} />
              Ver loja
            </Link>
            <Link to="/app/reservas" className="crm-v3-btn crm-v3-btn-primary">
              <Plus size={13} />
              Novo pedido
            </Link>
          </div>
        </div>

        {/* ── KPI Strip ─────────────────────────────────────── */}
        <div className="crm-v3-kstrip">
          <div className="crm-v3-kbig">
            <div className="crm-v3-kbig-label">Receita reservada hoje</div>
            <div className="crm-v3-kbig-value">
              {formatarKwanza(receitaReservada).replace(" Kz", "")}
              <span className="crm-v3-kbig-unit">Kz</span>
            </div>
            <span className="crm-v3-kbig-delta">
              ↑ {resumo.reservasPagas}/{resumo.reservasCriadas || 0} pagas
            </span>
          </div>
          <div className="crm-v3-kcard">
            <div className="crm-v3-kcard-label">
              <ShoppingBag size={14} />
              Pedidos hoje
            </div>
            <div className="crm-v3-kcard-value">{pedidosNovosHoje}</div>
            <div className="crm-v3-kcard-delta">
              {pedidosNovosHoje > 0 ? `${pedidosNovosHoje} desde hoje` : "nenhum ainda"}
            </div>
          </div>
          <div className="crm-v3-kcard">
            <div className="crm-v3-kcard-label">
              <Clock size={14} />
              A confirmar
            </div>
            <div className="crm-v3-kcard-value">{aguardandoPagamento}</div>
            <div className="crm-v3-kcard-delta" data-warn="true">
              comprovativos pendentes
            </div>
          </div>
          <div className="crm-v3-kcard">
            <div className="crm-v3-kcard-label">
              <AlertTriangle size={14} />
              Stock em risco
            </div>
            <div className="crm-v3-kcard-value">{produtosStockBaixo}</div>
            <div className="crm-v3-kcard-delta" data-bad="true">
              ≤ 2 unidades
            </div>
          </div>
        </div>

        {/* ── Filter Tiles (quick actions) ──────────────────── */}
        <div className="crm-v3-ftiles">
          <Link to="/app/reservas?filtro=a-cobrar" className="crm-v3-ftile" data-active="true">
            <span className="crm-v3-ftile-icon" style={{ background: "var(--em-tint)", color: "var(--em)" }}>
              <Coins size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Cobranças</div>
              <div className="crm-v3-ftile-desc">a aguardar</div>
            </div>
            <span className="crm-v3-ftile-count">{aguardandoPagamento}</span>
          </Link>
          <Link to="/app/reservas?filtro=enviados" className="crm-v3-ftile">
            <span className="crm-v3-ftile-icon" style={{ background: "var(--blue-tint)", color: "var(--blue)" }}>
              <Truck size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Envios</div>
              <div className="crm-v3-ftile-desc">para preparar</div>
            </div>
            <span className="crm-v3-ftile-count">{entregasPendentes}</span>
          </Link>
          <Link to="/app/conversas" className="crm-v3-ftile">
            <span className="crm-v3-ftile-icon" style={{ background: "var(--violet-tint)", color: "var(--violet)" }}>
              <MessageSquare size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Mensagens</div>
              <div className="crm-v3-ftile-desc">sem resposta</div>
            </div>
            <span className="crm-v3-ftile-count">{conversasSemResposta}</span>
          </Link>
          <Link to="/app/catalogo" className="crm-v3-ftile">
            <span className="crm-v3-ftile-icon" style={{ background: "var(--amber-tint)", color: "var(--amber)" }}>
              <Tag size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Produtos</div>
              <div className="crm-v3-ftile-desc">stock baixo</div>
            </div>
            <span className="crm-v3-ftile-count">{produtosStockBaixo}</span>
          </Link>
          <Link to="/app/live" className="crm-v3-ftile">
            <span className="crm-v3-ftile-icon" style={{ background: "var(--rose-tint)", color: "var(--rose)" }}>
              <Video size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Live agora</div>
              <div className="crm-v3-ftile-desc">{liveAtual ? liveAtual.username : "sem live"}</div>
            </div>
            <span className="crm-v3-ftile-count">{reservasLive}</span>
          </Link>
        </div>

        {/* ── Minhas tarefas ─────────────────────────────────── */}
        {tarefasAbertas.length > 0 && (
          <div className="crm-v3-otbl" style={{ marginBottom: 0 }}>
            <div className="crm-v3-otbl-head" style={{ gridTemplateColumns: "1fr 100px 110px 80px" }}>
              <span>Tarefa</span>
              <span>Prioridade</span>
              <span>Prazo</span>
              <span />
            </div>
            {tarefasAbertas.slice(0, 5).map((t) => {
              const atrasada = t.prazoEm && new Date(t.prazoEm) < new Date();
              const corPrio = t.prioridade === "URGENTE" ? "rose" : t.prioridade === "ALTA" ? "amber" : t.prioridade === "NORMAL" ? "blue" : "mute";
              return (
                <div key={t.id} className="crm-v3-otbl-row" style={{ gridTemplateColumns: "1fr 100px 110px 80px" }}>
                  <span className="crm-v3-otbl-cli">
                    <span>
                      <span className="crm-v3-otbl-cli-name">{t.titulo}</span>
                      {t.descricao && <small style={{ display: "block", color: "var(--ink-3)", fontSize: 11, marginTop: 1 }}>{t.descricao.slice(0, 60)}{t.descricao.length > 60 ? "…" : ""}</small>}
                    </span>
                  </span>
                  <span>
                    <span className="crm-v3-bdg" data-tone={corPrio}>
                      <span className="crm-v3-bdg-dot" />
                      {t.prioridade === "URGENTE" ? "Urgente" : t.prioridade === "ALTA" ? "Alta" : t.prioridade === "NORMAL" ? "Normal" : "Baixa"}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: atrasada ? "var(--rose)" : "var(--ink-3)", fontWeight: atrasada ? 600 : 400 }}>
                    {t.prazoEm ? formatarTempoRelativo(t.prazoEm) : "—"}
                    {atrasada && " ⚠"}
                  </span>
                  <span>
                    <Link to={t.pedidoId ? `/app/reservas?pedidoId=${t.pedidoId}` : "/app/reservas"} className="crm-v3-btn crm-v3-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }}>
                      Ver
                    </Link>
                  </span>
                </div>
              );
            })}
            {tarefasAbertas.length > 5 && (
              <Link to="/app/reservas" style={{ display: "block", textAlign: "center", fontSize: 12, color: "var(--em)", padding: "8px 0", fontWeight: 500 }}>
                Ver todas ({tarefasAbertas.length})
              </Link>
            )}
          </div>
        )}

        {/* ── 2-column: Orders mini-table + Bar chart ───────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
          {/* Orders mini-table */}
          <div className="crm-v3-otbl">
            <div className="crm-v3-otbl-head" style={{ gridTemplateColumns: colTemplate }}>
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Itens</span>
              <span>Total</span>
              <span>Estado</span>
            </div>
            {pedidosRecentes.map((r) => {
              const peca = resumo.pecas.find((p) => p.codigo === r.codigoPeca);
              const preco = obterPrecoDaPeca(resumo.pecas, r.codigoPeca);
              const iniciais = (r.nomeCliente ?? "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const hue = r.estado === "PAID" ? "green" : r.estado === "WAITING_PAYMENT" ? "amber" : "violet";
              const estadoLabel = r.estado === "PAID" ? "Pago" : r.estado === "WAITING_PAYMENT" ? "Aguarda pagamento" : r.estado === "EXPIRED" ? "Expirado" : r.estado;
              const badgeTone = r.estado === "PAID" ? "green" : r.estado === "WAITING_PAYMENT" ? "amber" : r.estado === "EXPIRED" ? "rose" : "blue";

              return (
                <div key={r.id} className="crm-v3-otbl-row" style={{ gridTemplateColumns: colTemplate }}>
                  <span className="crm-v3-otbl-oid">
                    #{r.id.toString().slice(-4)}
                    <small>{r.criadaEm ? formatarTempoRelativo(r.criadaEm) : ""}</small>
                  </span>
                  <span className="crm-v3-otbl-cli">
                    <span className="crm-v3-av crm-v3-av-32" data-hue={hue}>{iniciais}</span>
                    <span>
                      <span className="crm-v3-otbl-cli-name">{r.nomeCliente ?? "—"}</span>
                    </span>
                  </span>
                  <span className="crm-v3-otbl-item">
                    <b>{peca?.nome ?? r.codigoPeca}</b>
                  </span>
                  <span className="crm-v3-otbl-price">{formatarKwanza(preco).replace(" Kz", "")}</span>
                  <span>
                    <span className="crm-v3-bdg" data-tone={badgeTone}>
                      <span className="crm-v3-bdg-dot" />
                      {estadoLabel}
                    </span>
                  </span>
                </div>
              );
            })}
            {pedidosRecentes.length === 0 && (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>
                Sem pedidos recentes
              </div>
            )}
          </div>

          {/* Bar chart — Reservas esta semana */}
          <div className="crm-v3-chartcard">
            <div className="crm-v3-chartcard-head">
              <span className="crm-v3-chartcard-title">Reservas · esta semana</span>
              <span className="crm-v3-chartcard-sub">total {formatarKwanza(totalSemana)}</span>
            </div>
            <div className="crm-v3-bars">
              {faturacaoSemanal.map((val, i) => (
                <div key={i} className="crm-v3-bar" data-hot={i === 6 ? "true" : undefined}>
                  <motion.i
                    style={{ height: `${Math.max(4, (val / maxFat) * 100)}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, (val / maxFat) * 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  />
                  <span className="crm-v3-bar-label">{diasLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mensagem && (
        <footer
          className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
          style={{ margin: "16px 26px" }}
          aria-live="polite"
        >
          {mensagem}
        </footer>
      )}
    </CrmPageMotion>
  );
}
