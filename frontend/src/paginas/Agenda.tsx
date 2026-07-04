import {
  Bell,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  MessageCircle,
  ReceiptText,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { CrmPainelOperacional } from "../componentes/CrmPainelOperacional";
import { Button } from "@/components/ui/button";
import { GestorEventos, type Evento } from "@/components/ui/event-manager";
import type { Lembrete, RespostaLembretes, TipoLembrete } from "../tipos";
import { pluralizar } from "../utilidades";

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
type RespostaLembreteCriado = { lembrete: Lembrete };

/* ── Mapeamento tipo → cor do calendário ── */
const corPorTipo: Record<TipoLembrete, string> = {
  FOLLOW_UP: "followup",
  COBRANCA: "cobranca",
  ENTREGA: "entrega",
  CALLBACK: "callback",
  REUNIAO: "reuniao",
  OUTRO: "outro"
};

const nomeTipo: Record<TipoLembrete, string> = {
  FOLLOW_UP: "Follow-up",
  COBRANCA: "Cobrança",
  ENTREGA: "Entrega",
  CALLBACK: "Callback",
  REUNIAO: "Reunião",
  OUTRO: "Outro"
};

const tipoPorCor: Record<string, TipoLembrete> = Object.fromEntries(
  Object.entries(corPorTipo).map(([tipo, cor]) => [cor, tipo])
) as Record<string, TipoLembrete>;

const tipoPorNome = Object.fromEntries(
  Object.entries(nomeTipo).map(([tipo, nome]) => [nome, tipo])
) as Record<string, TipoLembrete>;

/** Converte Lembrete (API) → Evento (calendário) */
function lembreteParaEvento(l: Lembrete): Evento {
  const inicio = new Date(l.dataHora);
  const fim = new Date(inicio.getTime() + 30 * 60000); // +30min duração padrão
  const etiquetas: string[] = [];
  if (l.recorrente) etiquetas.push("Recorrente");
  if (l.estado === "VENCIDO") etiquetas.push("Vencido");
  if (l.conversaId) etiquetas.push("WhatsApp");
  if (l.pedidoId) etiquetas.push("Pedido");

  const descricao = [
    l.observacao,
    l.clienteNome ? `Cliente: ${l.clienteNome}` : null,
    l.pedidoId ? `Pedido: ${l.pedidoId}` : null
  ].filter(Boolean).join(" · ");

  return {
    id: l.id,
    titulo: l.titulo,
    descricao: descricao || undefined,
    inicio,
    fim,
    cor: corPorTipo[l.tipo],
    categoria: nomeTipo[l.tipo],
    estado: l.estado,
    clienteId: l.clienteId,
    clienteNome: l.clienteNome,
    conversaId: l.conversaId,
    pedidoId: l.pedidoId,
    responsavelId: l.responsavelId,
    etiquetas,
  };
}

function tipoDoEvento(evento: Partial<Evento>): TipoLembrete {
  if (evento.cor && tipoPorCor[evento.cor]) return tipoPorCor[evento.cor];
  if (evento.categoria && tipoPorNome[evento.categoria]) return tipoPorNome[evento.categoria];
  return "OUTRO";
}

function corpoLembrete(evento: Partial<Evento>) {
  const corpo: Record<string, unknown> = {};
  if (evento.titulo !== undefined) corpo.titulo = evento.titulo;
  if (evento.cor !== undefined || evento.categoria !== undefined) corpo.tipo = tipoDoEvento(evento);
  if (evento.inicio !== undefined) corpo.dataHora = evento.inicio.toISOString();
  if (evento.descricao !== undefined) corpo.observacao = evento.descricao;
  if (evento.clienteId !== undefined) corpo.clienteId = evento.clienteId;
  if (evento.clienteNome !== undefined) corpo.clienteNome = evento.clienteNome;
  if (evento.conversaId !== undefined) corpo.conversaId = evento.conversaId;
  if (evento.pedidoId !== undefined) corpo.pedidoId = evento.pedidoId;
  if (evento.responsavelId !== undefined) corpo.responsavelId = evento.responsavelId;
  return corpo;
}

function linkComParametro(base: string, chave: string, valor: string) {
  return `${base}?${chave}=${encodeURIComponent(valor)}`;
}

export function PaginaAgenda() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      const r = await requisitarApi<RespostaLembretes>("/lembretes?limite=100");
      setLembretes(r.lembretes ?? []);
      setMensagem("");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao carregar agenda.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
  }, []);

  async function criarLembrete(evento: Omit<Evento, "id">) {
    setCarregando(true);
    try {
      await requisitarApi<RespostaLembreteCriado>("/lembretes", {
        method: "POST",
        body: {
          titulo: evento.titulo,
          tipo: tipoDoEvento(evento),
          dataHora: evento.inicio.toISOString(),
          clienteId: evento.clienteId ?? null,
          clienteNome: evento.clienteNome ?? null,
          conversaId: evento.conversaId ?? null,
          pedidoId: evento.pedidoId ?? null,
          observacao: evento.descricao ?? null,
          responsavelId: evento.responsavelId ?? null
        }
      });
      await carregar();
      setMensagem("Lembrete criado na agenda Team.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao criar lembrete.");
      throw e;
    } finally {
      setCarregando(false);
    }
  }

  async function actualizarLembrete(id: string, evento: Partial<Evento>) {
    setCarregando(true);
    try {
      await requisitarApi<RespostaLembreteCriado>(`/lembretes/${id}`, {
        method: "PATCH",
        body: corpoLembrete(evento)
      });
      await carregar();
      setMensagem("Agenda atualizada.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao atualizar lembrete.");
      throw e;
    } finally {
      setCarregando(false);
    }
  }

  async function concluirLembrete(id: string) {
    setCarregando(true);
    try {
      await requisitarApi<RespostaLembreteCriado>(`/lembretes/${id}`, { method: "PATCH", body: { estado: "CONCLUIDO" } });
      await carregar();
      setMensagem("Lembrete concluído.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao concluir lembrete.");
      throw e;
    } finally {
      setCarregando(false);
    }
  }

  async function cancelarLembrete(id: string) {
    setCarregando(true);
    try {
      await requisitarApi<RespostaLembreteCriado>(`/lembretes/${id}`, { method: "PATCH", body: { estado: "CANCELADO" } });
      await carregar();
      setMensagem("Lembrete cancelado.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao cancelar lembrete.");
      throw e;
    } finally {
      setCarregando(false);
    }
  }

  function renderizarAcoesCrm(evento: Evento) {
    const acoes = [
      evento.conversaId
        ? { to: linkComParametro("/app/conversas", "conversaId", evento.conversaId), rotulo: "Atendimento", icone: <MessageCircle size={14} /> }
        : null,
      evento.pedidoId
        ? { to: linkComParametro("/app/reservas", "pedidoId", evento.pedidoId), rotulo: "Pedido", icone: <ReceiptText size={14} /> }
        : null,
      evento.clienteId
        ? { to: linkComParametro("/app/clientes", "clienteId", evento.clienteId), rotulo: "Cliente", icone: <UserRound size={14} /> }
        : null
    ].filter(Boolean) as Array<{ to: string; rotulo: string; icone: JSX.Element }>;

    if (!acoes.length) {
      return <p className="text-xs text-muted-foreground">Sem vínculo directo a cliente, pedido ou conversa.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {acoes.map((acao) => (
          <Button key={acao.to} asChild variant="outline" size="sm" className="h-8 gap-1.5">
            <Link to={acao.to}>
              {acao.icone}
              {acao.rotulo}
            </Link>
          </Button>
        ))}
      </div>
    );
  }

  /* ── Métricas ── */
  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const pendentes = useMemo(() => lembretes.filter(l => l.estado !== "CONCLUIDO" && l.estado !== "CANCELADO"), [lembretes]);
  const vencidos = useMemo(() => pendentes.filter(l => new Date(l.dataHora) < inicioHoje), [pendentes, inicioHoje]);
  const concluidos = useMemo(() => lembretes.filter(l => l.estado === "CONCLUIDO"), [lembretes]);
  const hojeFim = new Date(inicioHoje);
  hojeFim.setDate(hojeFim.getDate() + 1);
  const hojePendentes = useMemo(() => pendentes.filter((l) => {
    const data = new Date(l.dataHora);
    return data >= inicioHoje && data < hojeFim;
  }), [pendentes, inicioHoje, hojeFim]);
  const vinculados = pendentes.filter((l) => l.clienteId || l.conversaId || l.pedidoId).length;
  const proximoLembrete = [...pendentes].sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0];
  const lembretePrioritario = vencidos[0] ?? hojePendentes[0] ?? proximoLembrete;
  const proximaAcao = lembretePrioritario
    ? {
        titulo: `${vencidos.includes(lembretePrioritario) ? "Recuperar atraso" : "Preparar proximo contacto"}: ${lembretePrioritario.titulo}`,
        detalhe: `${lembretePrioritario.clienteNome ?? "Sem cliente associado"} · ${nomeTipo[lembretePrioritario.tipo]} marcado para ${new Date(lembretePrioritario.dataHora).toLocaleString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}.`,
        destino: lembretePrioritario.conversaId ? `/app/conversas?conversaId=${encodeURIComponent(lembretePrioritario.conversaId)}` : "/app/agenda",
        icone: <Bell size={16} />,
        prioridade: vencidos.includes(lembretePrioritario) ? "alta" : "media",
        rotuloAcao: lembretePrioritario.conversaId ? "Atender" : "Ver agenda"
      } as const
    : {
        titulo: "Criar bloco de prospeccao",
        detalhe: "Reserve follow-ups para clientes prioritarios, cobrancas e entregas.",
        destino: "/app/pipeline",
        icone: <CalendarPlus size={16} />,
        prioridade: "media",
        rotuloAcao: "Ver pipeline"
      } as const;
  const atalhoAtivo = lembretePrioritario ? `agenda ${lembretePrioritario.clienteNome ?? lembretePrioritario.titulo}` : "novo follow-up";

  /* ── Converter lembretes pendentes em eventos para o calendário ── */
  const eventos = useMemo(() => pendentes.map(lembreteParaEvento), [pendentes]);

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <h1 className="crm-titulo">Agenda</h1>
            <p className="crm-subtitulo">
              {pendentes.length} {pluralizar(pendentes.length, "pendente", "pendentes")}
              {vencidos.length > 0 && <span className="text-destructive"> · {vencidos.length} {pluralizar(vencidos.length, "vencido", "vencidos")}</span>}
              {concluidos.length > 0 && <span> · {concluidos.length} {pluralizar(concluidos.length, "concluído", "concluídos")}</span>}
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* ── Status Pills ── */}
        <motion.div className="flex flex-wrap gap-3 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springEntrada}>
          <div className="flex items-center gap-2 rounded-xl bg-accent border border-primary/10 px-4 py-2.5 text-sm text-accent-foreground">
            <Clock3 size={14} />
            <span className="font-medium">{pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}</span>
          </div>
          {vencidos.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] border border-red-200/60 px-4 py-2.5 text-sm text-red-700">
              <Bell size={14} />
              <span className="font-medium">{vencidos.length} vencido{vencidos.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {concluidos.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF5] border border-emerald-200/60 px-4 py-2.5 text-sm text-emerald-700">
              <CheckCircle2 size={14} />
              <span className="font-medium">{concluidos.length} concluído{concluidos.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </motion.div>

        <CrmPainelOperacional
          modulo="Agenda"
          titulo="Prioridade do dia"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Hoje", valor: String(hojePendentes.length), detalhe: "contactos para executar", tom: hojePendentes.length ? "info" : "neutro" },
            { rotulo: "Vencidos", valor: String(vencidos.length), detalhe: "viram tarefa urgente", tom: vencidos.length ? "perigo" : "sucesso" },
            { rotulo: "Com vinculo", valor: `${vinculados}/${pendentes.length || 0}`, detalhe: "cliente/pedido/conversa", tom: vinculados ? "sucesso" : "atencao" },
            { rotulo: "Concluidos", valor: String(concluidos.length), detalhe: "historico de execucao", tom: concluidos.length ? "sucesso" : "neutro" }
          ]}
          atributos={[
            { rotulo: "Roteiro do dia", valor: hojePendentes.length ? `${hojePendentes.length} paragens` : "livre", detalhe: "ordenado por urgencia", tom: hojePendentes.length ? "info" : "sucesso" },
            { rotulo: "Tarefa", valor: vencidos.length ? "criar" : "em dia", detalhe: "lembrete vencido", tom: vencidos.length ? "perigo" : "sucesso" },
            { rotulo: "Cliente 360", valor: vinculados ? "ligado" : "fraco", detalhe: "evita lembrete solto", tom: vinculados ? "sucesso" : "atencao" }
          ]}
          acoes={[
            { titulo: "Atendimento", detalhe: "Abrir conversas com follow-up", destino: "/app/conversas", icone: <MessageCircle size={14} />, rotuloAcao: "Conversas" },
            { titulo: "Pedidos", detalhe: "Ver entregas e cobrancas", destino: "/app/reservas", icone: <ReceiptText size={14} />, rotuloAcao: "Pedidos" },
            { titulo: "Clientes", detalhe: "Relacionar lembretes soltos", destino: "/app/clientes", icone: <UserRound size={14} />, rotuloAcao: "Clientes" }
          ]}
        />

        {/* ── Gestor de Eventos / Calendário ── */}
        <GestorEventos
          eventos={eventos}
          vistaInicial="mes"
          categorias={["Follow-up", "Cobrança", "Entrega", "Callback", "Reunião", "Outro"]}
          etiquetasDisponiveis={["Urgente", "VIP", "Recorrente", "Vencido", "WhatsApp", "Pedido", "Presencial"]}
          aoCriarEvento={criarLembrete}
          aoActualizarEvento={actualizarLembrete}
          aoConcluirEvento={concluirLembrete}
          aoEliminarEvento={cancelarLembrete}
          renderizarAcoesCrm={renderizarAcoesCrm}
        />

        {pendentes.length === 0 && (
          <EstadoVazio
            icone={<Bell />}
            titulo="Agenda limpa"
            detalhe="Sem lembretes pendentes. O botão Novo lembrete cria follow-ups, cobranças ou entregas ligados ao Team."
          />
        )}

        <AnimatePresence>
          {mensagem && (
            <motion.footer
              className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {mensagem}
            </motion.footer>
          )}
        </AnimatePresence>
      </div>
    </CrmPageMotion>
  );
}
