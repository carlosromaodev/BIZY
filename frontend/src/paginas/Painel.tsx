import {
  Radio,
  Coins,
  ShoppingBag,
  Clock,
  AlertTriangle,
  MessageSquare,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { criarFonteEventosAutenticada, requisitarApi, obterUsuario } from "../api";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  type RespostaConversas,
  type ResumoPainel,
  resumoInicial,
  estadosReservaAtiva,
} from "../tipos";
import {
  formatarDataCurta,
  formatarKwanza,
  formatarTempoRestante,
  obterPrecoDaPeca,
} from "../utilidades";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  TwoUp,
  PanelCard,
  GaugeBar,
  AttentionRow,
  BotaoBizy,
  PillBizy,
  StatusBadge,
  Money,
} from "../componentes/BizyDesignSystem";

/* ── Types ──────────────────────────────────────────────────────── */

interface TarefaPainel {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
  estado: "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  prazoEm: string | null;
}

interface RespostaTarefasPainel {
  tarefas: TarefaPainel[];
}

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

function tarefaEstaAtrasada(tarefa: TarefaPainel): boolean {
  if (!tarefa.prazoEm || !["ABERTA", "EM_ANDAMENTO"].includes(tarefa.estado)) return false;
  return Number(new Date(tarefa.prazoEm)) < Date.now();
}

function traduzirPrioridadeTarefa(prioridade: TarefaPainel["prioridade"]): string {
  const mapa = { BAIXA: "Baixa", NORMAL: "Normal", ALTA: "Alta", URGENTE: "Urgente" };
  return mapa[prioridade];
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
  const [tarefas, setTarefas] = useState<TarefaPainel[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const usuario = obterUsuario();

  /* ── Derived data ──────────────────────────────────────────── */

  const reservasAtivas = useMemo(
    () => resumo.reservas.filter((r) => estadosReservaAtiva.includes(r.estado)),
    [resumo.reservas],
  );

  const receitaReservada = useMemo(
    () =>
      resumo.reservas
        .filter((r) => [...estadosReservaAtiva, "PAID"].includes(r.estado))
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas],
  );

  const filaTotal = useMemo(
    () => Object.values(resumo.filaEspera).reduce((t, q) => t + q, 0),
    [resumo.filaEspera],
  );

  const pecasDisponiveis = resumo.pecas.filter((p) => p.estado === "DISPONIVEL").length;
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

  const faturacaoDia = useMemo(
    () =>
      resumo.reservas
        .filter((r) => r.estado === "PAID" && dataEhHoje(r.criadaEm))
        .reduce((total, r) => total + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas],
  );

  const tarefasAtrasadas = useMemo(() => tarefas.filter(tarefaEstaAtrasada).length, [tarefas]);

  const tarefasAbertas = useMemo(
    () => tarefas.filter((t) => t.estado === "ABERTA" || t.estado === "EM_ANDAMENTO").slice(0, 5),
    [tarefas],
  );

  const liveAtual = useMemo(
    () => resumo.lives.find((live) => live.status !== "ENCERRADA") ?? null,
    [resumo.lives],
  );

  const taxaPagamento = resumo.reservasCriadas
    ? Math.round((resumo.reservasPagas / resumo.reservasCriadas) * 100)
    : 0;

  const proximaExpirar = useMemo(
    () =>
      reservasAtivas
        .filter((r) => r.expiraEm)
        .sort((a, b) => Number(new Date(a.expiraEm ?? 0)) - Number(new Date(b.expiraEm ?? 0)))[0] ??
      null,
    [reservasAtivas],
  );

  // Weekly billing for the bar chart
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

  /* ── Data fetching ─────────────────────────────────────────── */

  async function carregarResumo() {
    const [respostaResumo, respostaConversas, respostaTarefas] = await Promise.allSettled([
      requisitarApi<ResumoPainel>("/painel/resumo"),
      requisitarApi<RespostaConversas>("/atendimento/conversas"),
      requisitarApi<RespostaTarefasPainel>("/tarefas?estado=ABERTA&limite=8"),
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

  return (
    <CrmPageMotion>
      {/* ── Page Header ────────────────────────────────────────── */}
      <PageHead
        eyebrow={`${formatarDataCurta(new Date())} · Visão geral`}
        titulo={`${obterSaudacao()}, ${usuario?.nome ?? "Vendedor"}`}
      >
        <Link to="/app/live">
          <PillBizy>
            {liveAtual ? (
              <>
                <span className="bz-live-dot" />
                Live ativa · <strong>{liveAtual.username}</strong>
              </>
            ) : (
              <>
                <Radio size={13} style={{ color: "var(--ink-4)" }} />
                Sem live
              </>
            )}
          </PillBizy>
        </Link>
        <Link to="/app/reservas">
          <BotaoBizy icone={Plus}>Novo pedido</BotaoBizy>
        </Link>
      </PageHead>

      {/* ── KPI Grid ───────────────────────────────────────────── */}
      <KpiGrid>
        <KpiCard
          icone={Coins}
          hero
          rotulo="Receita reservada"
          valor={formatarKwanza(receitaReservada)}
          deltaPositivo={true}
          delta={`${resumo.reservasPagas} de ${resumo.reservasCriadas || 0} reservas pagas`}
          rodape={`${resumo.reservasPagas} de ${resumo.reservasCriadas || 0} reservas já pagas`}
        />
        <KpiCard
          icone={ShoppingBag}
          cor="blue"
          rotulo="Pedidos hoje"
          valor={pedidosNovosHoje}
          delta={`${aguardandoPagamento} aguarda pagamento`}
        />
        <KpiCard
          icone={Clock}
          cor="amber"
          rotulo="A confirmar"
          valor={aguardandoPagamento}
          delta="comprovativo pendente"
          deltaPositivo={aguardandoPagamento > 0 ? false : undefined}
        />
        <KpiCard
          icone={AlertTriangle}
          cor="rose"
          rotulo="Stock em risco"
          valor={produtosStockBaixo}
          delta={`quantidade ≤ 2`}
        />
      </KpiGrid>

      {/* ── Row 1: Chart + Gauge ───────────────────────────────── */}
      <TwoUp ratio="1.4fr 1fr">
        {/* Bar chart — Faturação 7 dias */}
        <PanelCard titulo="Faturação · últimos 7 dias" linkTexto="Ver relatório" linkRota="/app/relatorios">
          <div className="bz-chart">
            {faturacaoSemanal.map((val, i) => (
              <div key={i} className={`bz-bar-col${i === 6 ? " today" : ""}`}>
                <motion.div
                  className={`bz-bar${i === 6 ? " active" : ""}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (val / maxFat) * 100)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                />
                <span className="bz-bar-label">{diasLabels[i]}</span>
              </div>
            ))}
          </div>
          <div className="bz-chart-foot">
            <div>
              <div className="bz-chart-big">{formatarKwanza(totalSemana)}</div>
              <div className="bz-chart-label">total da semana</div>
            </div>
          </div>
        </PanelCard>

        {/* Gauge — Taxa de pagamento */}
        <PanelCard titulo="Taxa de pagamento">
          <GaugeBar
            titulo="Reservas liquidadas"
            valor={<>{taxaPagamento}%</>}
            percentagem={taxaPagamento}
            rodapeEsq={`${resumo.reservasPagas} pagos`}
            rodapeDir={`${resumo.reservasCriadas} criados`}
          />
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
            <AttentionRow
              icone={Clock}
              cor="amber"
              titulo="Pagamentos pendentes"
              detalhe="a aguardar comprovativo"
              valor={aguardandoPagamento}
            />
            <AttentionRow
              icone={MessageSquare}
              cor="blue"
              titulo="Conversas abertas"
              detalhe="WhatsApp e comentários"
              valor={conversasSemResposta}
            />
          </div>
        </PanelCard>
      </TwoUp>

      {/* ── Row 2: Tasks + Pulse ───────────────────────────────── */}
      <TwoUp ratio="1fr 1.4fr">
        {/* Próximas acções */}
        <PanelCard titulo="Próximas acções" linkTexto="Todas" linkRota="/app/tarefas">
          <div className="bz-tasks">
            {tarefasAbertas.length ? (
              tarefasAbertas.map((tarefa) => (
                <div key={tarefa.id} className="bz-task">
                  <span
                    className={`bz-task-box${tarefaEstaAtrasada(tarefa) || tarefa.prioridade === "URGENTE" ? " urgent" : ""}`}
                  />
                  <div className="bz-task-body">
                    <div className="bz-task-h">{tarefa.titulo}</div>
                    <div className="bz-task-p">{tarefa.descricao}</div>
                  </div>
                  <span
                    className={`bz-task-tg${
                      tarefa.prioridade === "URGENTE" || tarefaEstaAtrasada(tarefa)
                        ? " urgent"
                        : tarefa.prioridade === "ALTA"
                          ? " soon"
                          : ""
                    }`}
                  >
                    {traduzirPrioridadeTarefa(tarefa.prioridade)}
                  </span>
                </div>
              ))
            ) : (
              <p className="bz-empty-msg">Sem tarefas abertas.</p>
            )}
          </div>
        </PanelCard>

        {/* Pulso comercial */}
        <PanelCard titulo="Pulso comercial">
          <div className="bz-pulse-grid">
            <PulseItem label="Pedidos hoje" value={pedidosNovosHoje} />
            <PulseItem label="Ticket médio" value={pedidosNovosHoje > 0 ? formatarKwanza(Math.round(faturacaoDia / Math.max(pedidosNovosHoje, 1))) : "—"} />
            <PulseItem label="Stock vendável" value={pecasDisponiveis} />
            <PulseItem label="Fila de espera" value={filaTotal} />
            <PulseItem label="Entregas pend." value={entregasPendentes} />
            <PulseItem
              label="Tarefas atrasadas"
              value={tarefasAtrasadas}
              accent={tarefasAtrasadas > 0}
            />
          </div>
        </PanelCard>
      </TwoUp>

      {/* ── Expiration alert ───────────────────────────────────── */}
      {proximaExpirar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bz-alert"
        >
          <StatusBadge cor="amber">
            Próxima reserva a expirar: <strong>#{proximaExpirar.codigoPeca}</strong> —{" "}
            {formatarTempoRestante(proximaExpirar.expiraEm)}
          </StatusBadge>
          <Link
            to="/app/reservas"
            style={{
              marginLeft: "auto",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            Ver pedidos →
          </Link>
        </motion.div>
      )}

      {mensagem && (
        <footer
          className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
          aria-live="polite"
        >
          {mensagem}
        </footer>
      )}
    </CrmPageMotion>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function PulseItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bz-pulse-item">
      <div className="bz-pulse-label">{label}</div>
      <div className={`bz-pulse-value${accent ? " accent" : ""}`}>{value}</div>
    </div>
  );
}
