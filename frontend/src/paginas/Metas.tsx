import {
  AlertTriangle,
  RefreshCcw,
  Target,
  TrendingDown,
  TrendingUp,
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
import type { MetaVenda, RespostaMetasVendas } from "../tipos";
import { formatarKwanza } from "../utilidades";

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springGauge = { type: "spring" as const, stiffness: 120, damping: 20, mass: 1.2 };

function traduzirTipo(tipo: MetaVenda["tipo"]): string {
  return { RECEITA: "Receita", PEDIDOS: "Pedidos", CLIENTES_NOVOS: "Clientes novos" }[tipo];
}

function corMeta(progresso: number, risco: boolean): string {
  if (progresso >= 100) return "#10B981";
  if (risco) return "#EF4444";
  if (progresso >= 60) return "#6366F1";
  return "#F59E0B";
}

function formatarValorMeta(tipo: MetaVenda["tipo"], valor: number): string {
  if (tipo === "RECEITA") return formatarKwanza(valor);
  return String(valor);
}

const RAIO = 46;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

function GaugeRing({ progresso, cor }: { progresso: number; cor: string }) {
  const offset = CIRCUNFERENCIA - (Math.min(progresso, 100) / 100) * CIRCUNFERENCIA;
  return (
    <div className="meta-gauge">
      <svg viewBox="0 0 100 100">
        <circle className="meta-gauge-track" cx="50" cy="50" r={RAIO} />
        <motion.circle
          className="meta-gauge-fill"
          cx="50"
          cy="50"
          r={RAIO}
          stroke={cor}
          strokeDasharray={CIRCUNFERENCIA}
          initial={{ strokeDashoffset: CIRCUNFERENCIA }}
          animate={{ strokeDashoffset: offset }}
          transition={springGauge}
        />
      </svg>
      <div className="meta-gauge-center">
        <motion.span
          className="meta-gauge-percent"
          style={{ color: cor }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springEntrada, delay: 0.3 }}
        >
          {progresso}%
        </motion.span>
        <span className="meta-gauge-label">{progresso >= 100 ? "Atingida" : "Progresso"}</span>
      </div>
    </div>
  );
}

export function PaginaMetas() {
  const [metas, setMetas] = useState<MetaVenda[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      const resposta = await requisitarApi<RespostaMetasVendas>("/metas?limite=50");
      setMetas(resposta.metas ?? []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar metas.");
    }
  }

  useEffect(() => { void carregar().finally(() => setCarregandoInicial(false)); }, []);

  const metasAtivas = useMemo(() => metas.filter((m) => new Date(m.fimEm) >= new Date()), [metas]);
  const emRisco = useMemo(() => metasAtivas.filter((m) => {
    const progresso = m.valorAlvo ? m.valorAtual / m.valorAlvo : 0;
    const tempoDecorrido = (Date.now() - new Date(m.inicioEm).getTime()) /
      (new Date(m.fimEm).getTime() - new Date(m.inicioEm).getTime());
    return progresso < tempoDecorrido * 0.7 && progresso < 1;
  }), [metasAtivas]);
  const atingidas = useMemo(() => metasAtivas.filter((m) => m.valorAlvo > 0 && m.valorAtual >= m.valorAlvo), [metasAtivas]);
  const pendentes = metasAtivas.filter((m) => m.valorAlvo > m.valorAtual);
  const deficitTotal = pendentes.reduce((total, meta) => total + Math.max(0, meta.valorAlvo - meta.valorAtual), 0);
  const metaPrioritaria = emRisco[0] ?? [...pendentes].sort((a, b) => (b.valorAlvo - b.valorAtual) - (a.valorAlvo - a.valorAtual))[0];
  const progressoMedio = metasAtivas.length
    ? Math.round(metasAtivas.reduce((total, meta) => total + (meta.valorAlvo ? Math.min(meta.valorAtual / meta.valorAlvo, 1) : 0), 0) / metasAtivas.length * 100)
    : 0;
  const proximaAcao = metaPrioritaria
    ? {
        titulo: `Plano de resgate para ${traduzirTipo(metaPrioritaria.tipo)}`,
        detalhe: `Faltam ${formatarValorMeta(metaPrioritaria.tipo, Math.max(0, metaPrioritaria.valorAlvo - metaPrioritaria.valorAtual))}. Abrir cotacoes, pedidos pendentes ou leads.`,
        destino: metaPrioritaria.tipo === "CLIENTES_NOVOS" ? "/app/formularios" : "/app/cotacoes",
        icone: <Target size={16} />,
        prioridade: emRisco.includes(metaPrioritaria) ? "alta" : "media",
        rotuloAcao: metaPrioritaria.tipo === "CLIENTES_NOVOS" ? "Captar leads" : "Ver cotacoes"
      } as const
    : {
        titulo: "Manter cadencia",
        detalhe: "Agende pos-venda e recompra para preservar o ritmo.",
        destino: "/app/sequencias",
        icone: <TrendingUp size={16} />,
        prioridade: "media",
        rotuloAcao: "Sequencias"
      } as const;
  const atalhoAtivo = metaPrioritaria ? `meta ${traduzirTipo(metaPrioritaria.tipo)} -> resgate` : "criar sequencia pos-venda";

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="crm-titulo">Metas de vendas</h1>
            <p className="crm-subtitulo">{atingidas.length} de {metasAtivas.length} atingidas este período</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        <motion.div className="flex flex-wrap gap-3 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springEntrada}>
          {emRisco.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] border border-red-200/60 px-4 py-2.5 text-sm text-red-700">
              <AlertTriangle size={16} />
              <span className="font-medium">{emRisco.length} meta{emRisco.length > 1 ? "s" : ""} em risco</span>
            </div>
          )}
          {atingidas.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF5] border border-emerald-200/60 px-4 py-2.5 text-sm text-emerald-700">
              <Target size={16} />
              <span className="font-medium">{atingidas.length} atingida{atingidas.length > 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl bg-[#EEF2FF] border border-indigo-200/60 px-4 py-2.5 text-sm text-indigo-700">
            <span className="font-medium">{metasAtivas.length} activas</span>
          </div>
        </motion.div>

        <CrmPainelOperacional
          modulo="Metas"
          titulo="Ritmo das metas"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Progresso medio", valor: `${progressoMedio}%`, detalhe: "metas ativas", tom: progressoMedio >= 70 ? "sucesso" : "atencao" },
            { rotulo: "Em risco", valor: String(emRisco.length), detalhe: "abaixo do ritmo", tom: emRisco.length ? "perigo" : "sucesso" },
            { rotulo: "Deficit", valor: formatarKwanza(deficitTotal), detalhe: "falta consolidada", tom: deficitTotal ? "atencao" : "sucesso" },
            { rotulo: "Atingidas", valor: String(atingidas.length), detalhe: "manter cadencia", tom: atingidas.length ? "sucesso" : "neutro" }
          ]}
          atributos={[
            { rotulo: "Alavanca", valor: metaPrioritaria ? traduzirTipo(metaPrioritaria.tipo) : "pos-venda", detalhe: "melhor modulo para agir", tom: metaPrioritaria ? "info" : "sucesso" },
            { rotulo: "Onde agir", valor: metaPrioritaria?.tipo === "CLIENTES_NOVOS" ? "formulario" : "cotacao", detalhe: "atalho imediato", tom: "sucesso" },
            { rotulo: "Comparativo", valor: emRisco.length ? "corrigir" : "estavel", detalhe: "ritmo vs periodo", tom: emRisco.length ? "perigo" : "sucesso" }
          ]}
          acoes={[
            { titulo: "Cotacoes abertas", detalhe: "Converter propostas para bater receita", destino: "/app/cotacoes", icone: <TrendingUp size={14} />, rotuloAcao: "Cotações" },
            { titulo: "Captar leads", detalhe: "Gerar clientes novos", destino: "/app/formularios", icone: <Target size={14} />, rotuloAcao: "Formulários" },
            { titulo: "Recuperar perdas", detalhe: "Reativar oportunidades", destino: "/app/recuperacao", icone: <AlertTriangle size={14} />, rotuloAcao: "Recuperação" }
          ]}
        />

        {metasAtivas.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metasAtivas.map((meta, i) => {
              const progresso = meta.valorAlvo ? Math.min(Math.round((meta.valorAtual / meta.valorAlvo) * 100), 100) : 0;
              const risco = emRisco.includes(meta);
              const cor = corMeta(progresso, risco);
              const diff = meta.valorAnterior > 0 ? Math.round(((meta.valorAtual - meta.valorAnterior) / meta.valorAnterior) * 100) : 0;

              return (
                <motion.div
                  key={meta.id}
                  className="rounded-xl border bg-card p-5"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...springEntrada, delay: i * 0.06 }}
                  whileHover={{ y: -3, boxShadow: "0 12px 30px -8px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <GaugeRing progresso={progresso} cor={cor} />
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{traduzirTipo(meta.tipo)}</p>
                        {risco && <Badge variant="destructive" className="text-[0.6rem]"><AlertTriangle size={10} className="mr-0.5" />Risco</Badge>}
                        {progresso >= 100 && <Badge variant="success" className="text-[0.6rem]">Atingida</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {meta.periodo === "SEMANAL" ? "Semanal" : "Mensal"}
                        {meta.vendedorNome && <span> · {meta.vendedorNome}</span>}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", letterSpacing: 0 }}>{formatarValorMeta(meta.tipo, meta.valorAtual)}</span>
                          <span className="text-xs text-muted-foreground">de {formatarValorMeta(meta.tipo, meta.valorAlvo)}</span>
                        </div>
                        <div className="crm-plus-mini-row">
                          <span>{risco ? "Plano de resgate" : "Ritmo monitorado"}</span>
                          <span>{meta.tipo === "RECEITA" ? "acao: cotações" : meta.tipo === "PEDIDOS" ? "acao: pedidos" : "acao: leads"}</span>
                        </div>
                        {progresso < 100 && meta.valorAlvo > meta.valorAtual && (
                          <p className="text-[0.6875rem] text-muted-foreground">
                            Falta {formatarValorMeta(meta.tipo, meta.valorAlvo - meta.valorAtual)}
                          </p>
                        )}
                        {diff !== 0 && (
                          <motion.div
                            className="flex items-center gap-1 text-[0.6875rem]"
                            style={{ color: diff > 0 ? "var(--success)" : "var(--destructive)" }}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.06, duration: 0.25 }}
                          >
                            {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{diff > 0 ? "+" : ""}{diff}% vs anterior</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EstadoVazio icone={<Target />} titulo="Sem metas definidas" detalhe="Defina metas de receita, pedidos ou clientes novos para medir o progresso da loja." />
        )}

        <AnimatePresence>
          {mensagem && (
            <motion.footer className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {mensagem}
            </motion.footer>
          )}
        </AnimatePresence>
      </div>
    </CrmPageMotion>
  );
}
