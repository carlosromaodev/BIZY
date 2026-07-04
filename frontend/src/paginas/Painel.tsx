import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Eye,
  MessageSquare,
  Package,
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
  type OnboardingGuiadoEquipa,
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
  const [onboardingGuiado, setOnboardingGuiado] = useState<OnboardingGuiadoEquipa | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const usuario = obterUsuario();
  const papel = (usuario?.papel ?? "DONO").toUpperCase();

  /* ── Visibilidade por papel ─────────────────────────────────── */
  const eGestor = ["DONO", "ADMIN"].includes(papel);
  const verReceita = eGestor || papel === "FINANCEIRO";
  const verConversas = eGestor || ["VENDEDOR", "ATENDENTE"].includes(papel);
  const verStock = eGestor || ["VENDEDOR", "FINANCEIRO"].includes(papel);
  const verLive = eGestor || papel === "VENDEDOR";
  const verTarefas = papel !== "ENTREGADOR";
  const verGrafico = verReceita;

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
        .slice(0, 4),
    [resumo.reservas],
  );

  /* ── Briefing line — smart summary ─────────────────────────── */

  const linhasBriefing = useMemo(() => {
    const pontos: string[] = [];
    if (aguardandoPagamento > 0) pontos.push(`${aguardandoPagamento} cobrança${aguardandoPagamento !== 1 ? "s" : ""} pendente${aguardandoPagamento !== 1 ? "s" : ""}`);
    if (conversasSemResposta > 0) pontos.push(`${conversasSemResposta} mensage${conversasSemResposta !== 1 ? "ns" : "m"} sem resposta`);
    if (entregasPendentes > 0) pontos.push(`${entregasPendentes} envio${entregasPendentes !== 1 ? "s" : ""} para preparar`);
    if (produtosStockBaixo > 0) pontos.push(`${produtosStockBaixo} produto${produtosStockBaixo !== 1 ? "s" : ""} com stock baixo`);
    if (tarefasAbertas.length > 0) pontos.push(`${tarefasAbertas.length} tarefa${tarefasAbertas.length !== 1 ? "s" : ""} aberta${tarefasAbertas.length !== 1 ? "s" : ""}`);
    return pontos;
  }, [aguardandoPagamento, conversasSemResposta, entregasPendentes, produtosStockBaixo, tarefasAbertas]);

  const temUrgencias = aguardandoPagamento > 0 || conversasSemResposta > 0 || entregasPendentes > 0;

  /* ── Data fetching ─────────────────────────────────────────── */

  async function carregarResumo() {
    const [respostaResumo, respostaConversas, respostaTarefas, respostaOnboarding] = await Promise.allSettled([
      requisitarApi<ResumoPainel>("/painel/resumo"),
      requisitarApi<RespostaConversas>("/atendimento/conversas"),
      requisitarApi<RespostaTarefasOperacionais>("/tarefas?limite=30"),
      requisitarApi<OnboardingGuiadoEquipa>("/equipa/onboarding-guiado"),
    ]);

    if (respostaResumo.status === "rejected") throw respostaResumo.reason;

    setResumo(respostaResumo.value);
    setConversas(respostaConversas.status === "fulfilled" ? respostaConversas.value.conversas : []);
    setTarefas(respostaTarefas.status === "fulfilled" ? respostaTarefas.value.tarefas : []);
    setOnboardingGuiado(
      respostaOnboarding.status === "fulfilled" && respostaOnboarding.value.progresso.percentagem < 100
        ? respostaOnboarding.value
        : null
    );
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
  const passosPendentesOnboarding = onboardingGuiado?.passos.filter((passo) => !passo.concluido) ?? [];
  const modulosTourOnboarding = onboardingGuiado?.tour.modulosPermitidos.slice(0, 6) ?? [];

  return (
    <CrmPageMotion>
      <div className="team-pgwrap">
        {/* ── Page Head — Comando do dia ────────────────────── */}
        <div className="team-pghead">
          <div>
            <h1>{obterSaudacao()}, {usuario?.nome?.split(" ")[0] ?? "Vendedor"}</h1>
            <div className="team-sub">{formatarDataLocal()}</div>
          </div>
          <div className="team-pghead-right">
            <Link to="/app/loja" className="team-btn team-btn-ghost">
              <Eye size={13} />
              Ver loja
            </Link>
            <Link to="/app/reservas" className="team-btn team-btn-primary">
              <Plus size={13} />
              Novo pedido
            </Link>
          </div>
        </div>

        {/* ── Briefing — resumo inteligente do dia ─────────── */}
        {linhasBriefing.length > 0 && (
          <div className="cd-briefing" data-urgente={temUrgencias || undefined}>
            <div className="cd-briefing-head">
              <Package size={15} />
              <span className="cd-briefing-titulo">Briefing do dia</span>
            </div>
            <ul className="cd-briefing-lista">
              {linhasBriefing.map((ponto) => (
                <li key={ponto}>
                  <Circle size={5} />
                  {ponto}
                </li>
              ))}
            </ul>
            {liveAtual && (
              <div className="cd-briefing-live">
                <Video size={13} />
                Live activa: <strong>{liveAtual.username}</strong> — {reservasLive} pedido{reservasLive !== 1 ? "s" : ""} hoje
              </div>
            )}
          </div>
        )}

        {onboardingGuiado && (
          <div className="cd-briefing">
            <div className="cd-briefing-head">
              <CheckCircle2 size={15} />
              <span className="cd-briefing-titulo">Primeiro dia · {onboardingGuiado.progresso.percentagem}%</span>
            </div>
            <ul className="cd-briefing-lista">
              {passosPendentesOnboarding.slice(0, 3).map((passo) => (
                <li key={passo.item}>
                  <Circle size={5} />
                  {passo.descricao}
                </li>
              ))}
            </ul>
            {modulosTourOnboarding.length > 0 && (
              <div className="cd-briefing-live">
                <Eye size={13} />
                {modulosTourOnboarding.map((modulo) => (
                  <span key={modulo} className="team-bdg" data-tone="blue">
                    <span className="team-bdg-dot" />
                    {modulo}
                  </span>
                ))}
              </div>
            )}
            {onboardingGuiado.primeiraTarefa && (
              <Link to="/app/tarefas" className="cd-tarefas-link">
                {onboardingGuiado.primeiraTarefa.titulo} <ArrowRight size={12} />
              </Link>
            )}
          </div>
        )}

        {/* ── KPI Strip ─────────────────────────────────────── */}
        <div className="team-kstrip">
          {verReceita && (
            <div className="team-kbig">
              <div className="team-kbig-label">Receita reservada hoje</div>
              <div className="team-kbig-value">
                {formatarKwanza(receitaReservada).replace(" Kz", "")}
                <span className="team-kbig-unit">Kz</span>
              </div>
              <span className="team-kbig-delta">
                {resumo.reservasPagas}/{resumo.reservasCriadas || 0} pagas
              </span>
            </div>
          )}
          <div className="team-kcard">
            <div className="team-kcard-label">
              <ShoppingBag size={14} />
              Pedidos hoje
            </div>
            <div className="team-kcard-value">{pedidosNovosHoje}</div>
            <div className="team-kcard-delta">
              {pedidosNovosHoje > 0 ? `${pedidosNovosHoje} desde hoje` : "nenhum ainda"}
            </div>
          </div>
          <div className="team-kcard">
            <div className="team-kcard-label">
              <Clock size={14} />
              A confirmar
            </div>
            <div className="team-kcard-value">{aguardandoPagamento}</div>
            <div className="team-kcard-delta" data-warn={aguardandoPagamento > 0 ? "true" : undefined}>
              {aguardandoPagamento > 0 ? "comprovativos pendentes" : "tudo confirmado"}
            </div>
          </div>
          {verStock && (
            <div className="team-kcard">
              <div className="team-kcard-label">
                <AlertTriangle size={14} />
                Stock em risco
              </div>
              <div className="team-kcard-value">{produtosStockBaixo}</div>
              <div className="team-kcard-delta" data-bad={produtosStockBaixo > 0 ? "true" : undefined}>
                {produtosStockBaixo > 0 ? `${produtosStockBaixo} com ≤ 2 un.` : "stock OK"}
              </div>
            </div>
          )}
          {verConversas && (
            <div className="team-kcard">
              <div className="team-kcard-label">
                <MessageSquare size={14} />
                Sem resposta
              </div>
              <div className="team-kcard-value">{conversasSemResposta}</div>
              <div className="team-kcard-delta" data-warn={conversasSemResposta > 0 ? "true" : undefined}>
                {conversasSemResposta > 0 ? "mensagens pendentes" : "tudo respondido"}
              </div>
            </div>
          )}
        </div>

        {/* ── Acções prioritárias ──────────────────────────── */}
        <div className="cd-accoes-titulo">
          <span>O que fazer agora</span>
        </div>
        <div className="team-ftiles">
          {verReceita && (
            <Link
              to="/app/reservas?filtro=a-cobrar"
              className="team-ftile"
              data-active={aguardandoPagamento > 0 ? "true" : undefined}
            >
              <span className="team-ftile-icon" style={{ background: "var(--em-tint)", color: "var(--em)" }}>
                <Coins size={17} />
              </span>
              <div>
                <div className="team-ftile-title">Cobranças</div>
                <div className="team-ftile-desc">a aguardar</div>
              </div>
              <span className="team-ftile-count">{aguardandoPagamento}</span>
            </Link>
          )}
          <Link to="/app/reservas?filtro=enviados" className="team-ftile" data-active={entregasPendentes > 0 ? "true" : undefined}>
            <span className="team-ftile-icon" style={{ background: "var(--blue-tint)", color: "var(--blue)" }}>
              <Truck size={17} />
            </span>
            <div>
              <div className="team-ftile-title">Envios</div>
              <div className="team-ftile-desc">para preparar</div>
            </div>
            <span className="team-ftile-count">{entregasPendentes}</span>
          </Link>
          {verConversas && (
            <Link to="/app/conversas" className="team-ftile" data-active={conversasSemResposta > 0 ? "true" : undefined}>
              <span className="team-ftile-icon" style={{ background: "var(--violet-tint)", color: "var(--violet)" }}>
                <MessageSquare size={17} />
              </span>
              <div>
                <div className="team-ftile-title">Mensagens</div>
                <div className="team-ftile-desc">sem resposta</div>
              </div>
              <span className="team-ftile-count">{conversasSemResposta}</span>
            </Link>
          )}
          {verStock && (
            <Link to="/app/catalogo" className="team-ftile" data-active={produtosStockBaixo > 0 ? "true" : undefined}>
              <span className="team-ftile-icon" style={{ background: "var(--amber-tint)", color: "var(--amber)" }}>
                <Tag size={17} />
              </span>
              <div>
                <div className="team-ftile-title">Produtos</div>
                <div className="team-ftile-desc">stock baixo</div>
              </div>
              <span className="team-ftile-count">{produtosStockBaixo}</span>
            </Link>
          )}
          {verLive && (
            <Link to="/app/live" className="team-ftile" data-active={liveAtual ? "true" : undefined}>
              <span className="team-ftile-icon" style={{ background: "var(--rose-tint)", color: "var(--rose)" }}>
                <Video size={17} />
              </span>
              <div>
                <div className="team-ftile-title">Live</div>
                <div className="team-ftile-desc">{liveAtual ? liveAtual.username : "sem live"}</div>
              </div>
              <span className="team-ftile-count">{reservasLive}</span>
            </Link>
          )}
        </div>

        {/* ── Tarefas do dia ─────────────────────────────────── */}
        {verTarefas && tarefasAbertas.length > 0 && (
          <div className="cd-tarefas">
            <div className="cd-tarefas-head">
              <span className="cd-tarefas-titulo">Tarefas abertas</span>
              <Link to="/app/tarefas" className="cd-tarefas-link">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            <div className="cd-tarefas-lista">
              {tarefasAbertas.slice(0, 5).map((t) => {
                const atrasada = t.prazoEm && new Date(t.prazoEm) < new Date();
                const corPrio = t.prioridade === "URGENTE" ? "rose" : t.prioridade === "ALTA" ? "amber" : t.prioridade === "NORMAL" ? "blue" : "mute";
                return (
                  <Link
                    key={t.id}
                    to={t.pedidoId ? `/app/reservas?pedidoId=${t.pedidoId}` : "/app/tarefas"}
                    className="cd-tarefa"
                    data-atrasada={atrasada || undefined}
                  >
                    <span className="cd-tarefa-prio" data-tone={corPrio} />
                    <div className="cd-tarefa-conteudo">
                      <span className="cd-tarefa-titulo">{t.titulo}</span>
                      {t.descricao && (
                        <span className="cd-tarefa-desc">
                          {t.descricao.slice(0, 70)}{t.descricao.length > 70 ? "…" : ""}
                        </span>
                      )}
                    </div>
                    <div className="cd-tarefa-meta">
                      <span className="team-bdg" data-tone={corPrio}>
                        <span className="team-bdg-dot" />
                        {t.prioridade === "URGENTE" ? "Urgente" : t.prioridade === "ALTA" ? "Alta" : t.prioridade === "NORMAL" ? "Normal" : "Baixa"}
                      </span>
                      {t.prazoEm && (
                        <span className="cd-tarefa-prazo" data-atrasada={atrasada || undefined}>
                          <Clock size={11} />
                          {formatarTempoRelativo(t.prazoEm)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 2-column: Pedidos recentes + Gráfico semanal ─── */}
        <div className="cd-grid-dupla">
          {/* Pedidos recentes */}
          <div className="cd-pedidos-recentes">
            <div className="cd-secao-head">
              <span className="cd-secao-titulo">Pedidos recentes</span>
              <Link to="/app/reservas" className="cd-tarefas-link">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            {pedidosRecentes.length > 0 ? (
              <div className="cd-pedidos-lista">
                {pedidosRecentes.map((r) => {
                  const peca = resumo.pecas.find((p) => p.codigo === r.codigoPeca);
                  const preco = obterPrecoDaPeca(resumo.pecas, r.codigoPeca);
                  const iniciais = (r.nomeCliente ?? "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const hue = r.estado === "PAID" ? "green" : r.estado === "WAITING_PAYMENT" ? "amber" : "violet";
                  const estadoLabel = r.estado === "PAID" ? "Pago" : r.estado === "WAITING_PAYMENT" ? "A confirmar" : r.estado === "EXPIRED" ? "Expirado" : r.estado;
                  const badgeTone = r.estado === "PAID" ? "green" : r.estado === "WAITING_PAYMENT" ? "amber" : r.estado === "EXPIRED" ? "rose" : "blue";

                  return (
                    <div key={r.id} className="cd-pedido">
                      <span className="team-av team-av-32" data-hue={hue}>{iniciais}</span>
                      <div className="cd-pedido-info">
                        <span className="cd-pedido-nome">{r.nomeCliente ?? "—"}</span>
                        <span className="cd-pedido-produto">{peca?.nome ?? r.codigoPeca}</span>
                      </div>
                      <div className="cd-pedido-dir">
                        <span className="cd-pedido-valor">{formatarKwanza(preco)}</span>
                        <span className="team-bdg" data-tone={badgeTone}>
                          <span className="team-bdg-dot" />
                          {estadoLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cd-vazio">
                <ShoppingBag size={20} />
                <span>Sem pedidos recentes</span>
              </div>
            )}
          </div>

          {/* Gráfico semanal */}
          {verGrafico && <div className="team-chartcard">
            <div className="team-chartcard-head">
              <span className="team-chartcard-title">Receita semanal</span>
              <span className="team-chartcard-sub">{formatarKwanza(totalSemana)}</span>
            </div>
            <div className="team-bars">
              {faturacaoSemanal.map((val, i) => (
                <div key={i} className="team-bar" data-hot={i === 6 ? "true" : undefined}>
                  <motion.i
                    style={{ height: `${Math.max(4, (val / maxFat) * 100)}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, (val / maxFat) * 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  />
                  <span className="team-bar-label">{diasLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>}
        </div>

        {/* ── Estado geral — quando tudo está calmo ─────────── */}
        {linhasBriefing.length === 0 && (
          <div className="cd-tudo-ok">
            <CheckCircle2 size={22} />
            <div>
              <strong>Tudo em dia</strong>
              <span>Sem cobranças pendentes, mensagens respondidas e stock OK. Bom trabalho.</span>
            </div>
          </div>
        )}
      </div>

      {mensagem && (
        <footer className="bz-footer-msg" aria-live="polite">
          {mensagem}
        </footer>
      )}
    </CrmPageMotion>
  );
}
