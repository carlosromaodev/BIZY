import {
  CheckCircle2,
  ListChecks,
  Pause,
  Play,
  RefreshCcw,
  Repeat2,
  Users,
  Workflow
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { CrmPainelOperacional } from "../componentes/CrmPainelOperacional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pluralizar } from "../utilidades";
import type {
  EstadoSequencia,
  Sequencia,
  RespostaSequencias,
  TipoSequencia
} from "../tipos";

function traduzirTipo(tipo: TipoSequencia): string {
  const traducoes: Record<TipoSequencia, string> = {
    BOAS_VINDAS: "Boas-vindas",
    COBRANCA: "Cobrança",
    POS_VENDA: "Pós-venda",
    REACTIVACAO: "Reactivação",
    PERSONALIZADA: "Personalizada"
  };
  return traducoes[tipo];
}

function traduzirEstado(estado: EstadoSequencia): string {
  const traducoes: Record<EstadoSequencia, string> = {
    ATIVA: "Activa",
    PAUSADA: "Pausada",
    RASCUNHO: "Rascunho",
    ARQUIVADA: "Arquivada"
  };
  return traducoes[estado];
}

function varianteEstado(estado: EstadoSequencia): "success" | "warning" | "secondary" | "destructive" {
  if (estado === "ATIVA") return "success";
  if (estado === "PAUSADA") return "warning";
  if (estado === "ARQUIVADA") return "destructive";
  return "secondary";
}

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springCartao = { type: "spring" as const, stiffness: 400, damping: 26 };

const corTipo: Record<TipoSequencia, string> = {
  BOAS_VINDAS: "#6366F1",
  COBRANCA: "#F59E0B",
  POS_VENDA: "#10B981",
  REACTIVACAO: "#8B5CF6",
  PERSONALIZADA: "#78716C"
};

function traduzirTipoPasso(tipo: string): string {
  if (tipo === "WHATSAPP") return "WhatsApp";
  if (tipo === "EMAIL") return "Email";
  if (tipo === "ESPERA") return "Espera";
  return tipo;
}

export function PaginaSequencias() {
  const [sequencias, setSequencias] = useState<Sequencia[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      const resposta = await requisitarApi<RespostaSequencias>("/sequencias?limite=50");
      setSequencias(resposta.sequencias ?? []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar sequências.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
  }, []);

  async function alternarEstado(seq: Sequencia) {
    const novoEstado = seq.estado === "ATIVA" ? "PAUSADA" : "ATIVA";
    setCarregando(true);
    try {
      await requisitarApi(`/sequencias/${seq.id}`, {
        method: "PATCH",
        body: { estado: novoEstado }
      });
      await carregar();
      setMensagem(`Sequência ${novoEstado === "ATIVA" ? "activada" : "pausada"}.`);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro.");
    } finally {
      setCarregando(false);
    }
  }

  const activas = sequencias.filter((s) => s.estado === "ATIVA");
  const pausadas = sequencias.filter((s) => s.estado === "PAUSADA");
  const semPassos = sequencias.filter((s) => s.passos.length === 0);
  const comTravacaoResposta = sequencias.filter((s) => s.pausaSeResponder);
  const totalInscritos = sequencias.reduce((t, s) => t + s.totalInscritos, 0);
  const totalConvertidos = sequencias.reduce((t, s) => t + s.totalConvertidos, 0);
  const taxaConversao = totalInscritos ? Math.round((totalConvertidos / totalInscritos) * 100) : 0;
  const sequenciaPrioritaria = semPassos[0] ?? activas.find((s) => s.totalInscritos > 0 && s.totalConvertidos === 0) ?? pausadas[0] ?? sequencias[0];
  const proximaAcao = sequenciaPrioritaria
    ? {
        titulo: semPassos.includes(sequenciaPrioritaria) ? `Completar passos de ${sequenciaPrioritaria.nome}` : `Rever gatilho de ${sequenciaPrioritaria.nome}`,
        detalhe: semPassos.includes(sequenciaPrioritaria)
          ? "Adicione mensagem, espera e tarefa antes de activar."
          : `${sequenciaPrioritaria.totalInscritos} inscritos · ${sequenciaPrioritaria.totalConvertidos} convertidos. Ajuste canal, pausa por resposta e objetivo.`,
        destino: "/app/sequencias",
        icone: <Workflow size={16} />,
        prioridade: semPassos.includes(sequenciaPrioritaria) ? "alta" : "media",
        rotuloAcao: "Rever"
      } as const
    : {
        titulo: "Criar sequencia por evento comercial",
        detalhe: "Comece por boas-vindas, cobranca, pos-venda ou reactivacao.",
        destino: "/app/sequencias",
        icone: <Workflow size={16} />,
        prioridade: "alta",
        rotuloAcao: "Criar"
      } as const;
  const atalhoAtivo = sequenciaPrioritaria ? `sequencia ${sequenciaPrioritaria.nome} -> revisar` : "nova sequencia por evento";

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <h1 className="crm-titulo">Sequências</h1>
            <p className="crm-subtitulo">{sequencias.length} {pluralizar(sequencias.length, "sequência", "sequências")} · {activas.length} {pluralizar(activas.length, "activa", "activas")} · {totalInscritos} {pluralizar(totalInscritos, "inscrito", "inscritos")}</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* ── Conversion Highlight ── */}
        <motion.div className="flex gap-6 text-sm pb-4 mb-4 border-b border-border/40" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springEntrada}>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }}>{activas.length}</span>
            <span className="text-muted-foreground text-xs">{pluralizar(activas.length, "activa", "activas")}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}>{taxaConversao}%</span>
            <span className="text-muted-foreground text-xs">conversão</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>{totalConvertidos}</span>
            <span className="text-muted-foreground text-xs">{pluralizar(totalConvertidos, "convertido", "convertidos")}</span>
          </div>
        </motion.div>

        <CrmPainelOperacional
          modulo="Sequências"
          titulo="Sequências sob controle"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Conversao", valor: `${taxaConversao}%`, detalhe: "inscritos convertidos", tom: taxaConversao ? "sucesso" : "atencao" },
            { rotulo: "Sem passos", valor: String(semPassos.length), detalhe: "nao executam", tom: semPassos.length ? "perigo" : "sucesso" },
            { rotulo: "Pausam ao responder", valor: `${comTravacaoResposta.length}/${sequencias.length || 0}`, detalhe: "travao anti-spam", tom: comTravacaoResposta.length ? "sucesso" : "atencao" },
            { rotulo: "Pausadas", valor: String(pausadas.length), detalhe: "podem ser reativadas", tom: pausadas.length ? "info" : "neutro" }
          ]}
          atributos={[
            { rotulo: "Gatilho ideal", valor: sequenciaPrioritaria ? traduzirTipo(sequenciaPrioritaria.tipo) : "boas-vindas", detalhe: "baseado no objetivo", tom: "info" },
            { rotulo: "Limite anti-loop", valor: "obrigatorio", detalhe: "1 cliente nao deve repetir ciclo", tom: "sucesso" },
            { rotulo: "Evento forte", valor: "resposta", detalhe: "pausa automatica", tom: comTravacaoResposta.length ? "sucesso" : "atencao" }
          ]}
          acoes={[
            { titulo: "Ver leads", detalhe: "Inscrever novos contatos", destino: "/app/formularios", icone: <Users size={14} />, rotuloAcao: "Leads" },
            { titulo: "Criar resposta", detalhe: "Passos usam mensagens prontas", destino: "/app/respostas-rapidas", icone: <ListChecks size={14} />, rotuloAcao: "Respostas" },
            { titulo: "Recuperar", detalhe: "Reativar inativos", destino: "/app/recuperacao", icone: <Repeat2 size={14} />, rotuloAcao: "Recuperação" }
          ]}
        />

        {/* ── Sequence Cards ── */}
        {sequencias.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
            {sequencias.map((seq, i) => {
              const cor = corTipo[seq.tipo];
              const taxa = seq.totalInscritos ? Math.round((seq.totalConvertidos / seq.totalInscritos) * 100) : 0;
              return (
                <motion.div
                  key={seq.id}
                  className="rounded-xl border bg-card overflow-hidden"
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ...springCartao, delay: i * 0.05 }}
                  whileHover={{ y: -3, boxShadow: "0 12px 30px -8px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{seq.nome}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
                            style={{ background: `color-mix(in srgb, ${cor} 10%, transparent)`, color: cor }}
                          >
                            {traduzirTipo(seq.tipo)}
                          </span>
                          <Badge variant={varianteEstado(seq.estado)} className="text-[0.6rem]">
                            {traduzirEstado(seq.estado)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        title={seq.estado === "ATIVA" ? "Pausar" : "Activar"}
                        onClick={() => void alternarEstado(seq)}
                        disabled={carregando || seq.estado === "ARQUIVADA"}
                      >
                        {seq.estado === "ATIVA" ? <Pause size={14} /> : <Play size={14} />}
                      </Button>
                    </div>

                    {/* Sequence flow visualization */}
                    <div className="seq-flow mb-3">
                      {seq.passos.map((passo, pi) => (
                        <div key={pi} className="contents">
                          {pi > 0 && <div className="seq-connector" />}
                          <div className="seq-step">
                            <div className="seq-step-dot" style={{ background: cor }}>
                              {pi + 1}
                            </div>
                            <span className="seq-step-label">
                              {traduzirTipoPasso(passo.tipo)}
                              {passo.esperaMinutos > 0 && <br />}
                              {passo.esperaMinutos > 0 && `${passo.esperaMinutos >= 60 ? `${Math.round(passo.esperaMinutos / 60)}h` : `${passo.esperaMinutos}min`}`}
                            </span>
                          </div>
                        </div>
                      ))}
                      {seq.passos.length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem passos definidos</span>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="tabular-nums">{seq.totalInscritos} inscritos</span>
                      <span className="tabular-nums">{seq.totalConvertidos} convertidos</span>
                      <span className="tabular-nums font-semibold" style={{ color: taxa > 0 ? "var(--success)" : undefined }}>{taxa}%</span>
                    </div>

                    {seq.pausaSeResponder && (
                      <p className="mt-2 text-[0.6rem] text-muted-foreground flex items-center gap-1">
                        <Repeat2 size={10} /> Pausa se cliente responder
                      </p>
                    )}
                    <div className="crm-plus-mini-row mt-3">
                      <span>{seq.passos.length ? `${seq.passos.length} passos` : "adicionar passos"}</span>
                      <span>{seq.pausaSeResponder ? "anti-loop ativo" : "ativar pausa"}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        ) : (
          <EstadoVazio
            icone={<Workflow />}
            titulo="Sem sequências"
            detalhe="Crie sequências automáticas de boas-vindas, cobrança, pós-venda ou reactivação de clientes inactivos."
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
