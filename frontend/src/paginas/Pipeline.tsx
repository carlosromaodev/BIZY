import {
  ArrowRight,
  CalendarClock,
  Kanban,
  List,
  MessageCircle,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldAlert,
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
import { Input } from "@/components/ui/input";
import {
  Component as AnimatedTabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/animated-tabs";
import type { EtapaPipeline, NegocioPipeline, RespostaPipeline } from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";

/* ── Spring configs ── */
const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springCartao = { type: "spring" as const, stiffness: 400, damping: 26 };

const etapasAbertas: EtapaPipeline[] = ["LEAD", "CONTACTO_FEITO", "PROPOSTA_ENVIADA", "NEGOCIACAO", "FECHADO_GANHO"];

const configEtapa: Record<EtapaPipeline, { nome: string; cor: string }> = {
  LEAD: { nome: "Lead", cor: "#A8A29E" },
  CONTACTO_FEITO: { nome: "Contacto feito", cor: "#6366F1" },
  PROPOSTA_ENVIADA: { nome: "Proposta enviada", cor: "#8B5CF6" },
  NEGOCIACAO: { nome: "Negociação", cor: "#F59E0B" },
  FECHADO_GANHO: { nome: "Ganho", cor: "#10B981" },
  FECHADO_PERDIDO: { nome: "Perdido", cor: "#EF4444" }
};

function varianteBadge(etapa: EtapaPipeline): "success" | "destructive" | "warning" | "info" | "secondary" {
  if (etapa === "FECHADO_GANHO") return "success";
  if (etapa === "FECHADO_PERDIDO") return "destructive";
  if (etapa === "NEGOCIACAO") return "warning";
  if (etapa === "PROPOSTA_ENVIADA" || etapa === "CONTACTO_FEITO") return "info";
  return "secondary";
}

export function PaginaPipeline() {
  const [negocios, setNegocios] = useState<NegocioPipeline[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("kanban");

  async function carregar() {
    try {
      const r = await requisitarApi<RespostaPipeline>("/pipeline?limite=200");
      setNegocios(r.negocios ?? []);
      setMensagem("");
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Erro ao carregar pipeline."); }
  }

  useEffect(() => { void carregar().finally(() => setCarregandoInicial(false)); }, []);

  async function moverEtapa(negocio: NegocioPipeline, novaEtapa: EtapaPipeline) {
    setCarregando(true);
    try {
      await requisitarApi(`/pipeline/${negocio.id}/etapa`, { method: "PATCH", body: { etapa: novaEtapa } });
      await carregar();
      setMensagem(`Movido para ${configEtapa[novaEtapa].nome}.`);
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Erro."); }
    finally { setCarregando(false); }
  }

  const porEtapa = useMemo(() => {
    const m: Record<EtapaPipeline, NegocioPipeline[]> = { LEAD: [], CONTACTO_FEITO: [], PROPOSTA_ENVIADA: [], NEGOCIACAO: [], FECHADO_GANHO: [], FECHADO_PERDIDO: [] };
    const t = busca.trim().toLowerCase();
    for (const n of negocios) {
      if (t && !(n.titulo.toLowerCase().includes(t) || n.clienteNome?.toLowerCase().includes(t) || n.clienteTelefone?.includes(t))) continue;
      m[n.etapa]?.push(n);
    }
    return m;
  }, [negocios, busca]);

  const abertos = negocios.filter(n => !n.etapa.startsWith("FECHADO_"));
  const ganhos = negocios.filter(n => n.etapa === "FECHADO_GANHO");
  const perdidos = negocios.filter(n => n.etapa === "FECHADO_PERDIDO");
  const pipelineTotal = abertos.reduce((t, n) => t + n.valorEstimadoEmKwanza, 0);
  const receitaGanha = ganhos.reduce((t, n) => t + n.valorEstimadoEmKwanza, 0);
  const taxa = negocios.length ? Math.round((ganhos.length / negocios.length) * 100) : 0;
  const semPrevisao = abertos.filter((n) => !n.dataPrevisaoFecho).length;
  const comProduto = abertos.filter((n) => n.produtoNome).length;
  const maiorNegocio = [...abertos].sort((a, b) => b.valorEstimadoEmKwanza - a.valorEstimadoEmKwanza)[0];
  const saudePipeline = abertos.length ? Math.max(22, Math.min(98, 100 - semPrevisao * 10 - perdidos.length * 8 + ganhos.length * 4)) : 0;
  const proximaAcao = maiorNegocio
    ? {
        titulo: `Desbloquear ${maiorNegocio.titulo}`,
        detalhe: `${maiorNegocio.clienteNome ?? "Cliente sem nome"} tem ${formatarKwanza(maiorNegocio.valorEstimadoEmKwanza)} em aberto. Registe o proximo contacto hoje.`,
        destino: maiorNegocio.clienteId ? `/app/clientes?clienteId=${encodeURIComponent(maiorNegocio.clienteId)}` : "/app/agenda",
        icone: <MessageCircle size={16} />,
        prioridade: semPrevisao > 0 ? "alta" : "media",
        rotuloAcao: maiorNegocio.clienteId ? "Ver cliente" : "Agendar"
      } as const
    : {
        titulo: "Criar negocio a partir de conversa",
        detalhe: "Use uma conversa, cotacao ou pedido recente como origem.",
        destino: "/app/conversas",
        icone: <Kanban size={16} />,
        prioridade: "media",
        rotuloAcao: "Abrir atendimento"
      } as const;
  const atalhoAtivo = maiorNegocio ? `follow-up ${maiorNegocio.clienteNome ?? maiorNegocio.titulo}` : "criar negocio por conversa";

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Hero Command Panel ── */}
        <motion.div
          className="crm-command-panel mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springEntrada}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="crm-command-panel-eyebrow">Pipeline de vendas</p>
              <h1 className="crm-command-panel-title">Negócios em aberto</h1>
              <p className="crm-subtitulo">{abertos.length} negócios · {taxa}% conversão</p>
            </div>
            <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
              <RefreshCcw size={16} className={carregando ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="crm-command-metric">
              <span className="crm-metric-label">Pipeline</span>
              <span className="crm-command-metric-value">{formatarKwanza(pipelineTotal)}</span>
            </div>
            <div className="crm-command-metric">
              <span className="crm-metric-label">Receita ganha</span>
              <span className="crm-command-metric-value" style={{ color: "var(--success)" }}>{formatarKwanza(receitaGanha)}</span>
            </div>
            <div className="crm-command-metric">
              <span className="crm-metric-label">Ganhos</span>
              <span className="crm-command-metric-value" style={{ color: "var(--success)" }}>{ganhos.length}</span>
            </div>
            <div className="crm-command-metric">
              <span className="crm-metric-label">Perdidos</span>
              <span className="crm-command-metric-value" style={{ color: perdidos.length ? "var(--destructive)" : undefined }}>{perdidos.length}</span>
            </div>
          </div>
        </motion.div>

        <CrmPainelOperacional
          modulo="Pipeline"
          titulo="Prioridade comercial"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Saude", valor: `${saudePipeline}%`, detalhe: "valor + previsao + conversao", tom: saudePipeline >= 70 ? "sucesso" : "atencao" },
            { rotulo: "Sem previsao", valor: String(semPrevisao), detalhe: "precisam de data de fecho", tom: semPrevisao ? "perigo" : "sucesso" },
            { rotulo: "Negociacao", valor: String(porEtapa.NEGOCIACAO.length), detalhe: "com valor em aberto", tom: porEtapa.NEGOCIACAO.length ? "info" : "neutro" },
            { rotulo: "Com produto", valor: String(comProduto), detalhe: "ligados ao catalogo", tom: "sucesso" }
          ]}
          atributos={[
            { rotulo: "Ticket prioritario", valor: maiorNegocio ? formatarKwanza(maiorNegocio.valorEstimadoEmKwanza) : "0 Kz", detalhe: maiorNegocio?.produtoNome ?? "sem produto ligado", tom: maiorNegocio ? "info" : "neutro" },
            { rotulo: "Perdas", valor: perdidos.length ? `${perdidos.length} alerta` : "limpo", detalhe: "motivo obrigatorio", tom: perdidos.length ? "atencao" : "sucesso" },
            { rotulo: "Produto", valor: `${comProduto}/${abertos.length || 0}`, detalhe: "negocios com item ligado", tom: comProduto ? "sucesso" : "atencao" }
          ]}
          acoes={[
            { titulo: "Agendar follow-up", detalhe: "Criar lembrete para negocio em aberto", destino: "/app/agenda", icone: <CalendarClock size={14} />, rotuloAcao: "Agendar" },
            { titulo: "Ver cotacoes", detalhe: "Propostas abertas alimentam o pipeline", destino: "/app/cotacoes", icone: <PackageCheck size={14} />, rotuloAcao: "Cotações" },
            { titulo: "Auditar perdas", detalhe: "Perdidos explicam objeções recorrentes", destino: "/app/actividades", icone: <ShieldAlert size={14} />, rotuloAcao: "Notas" }
          ]}
        />

        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input aria-label="Buscar negócios" className="pl-9" style={{ paddingLeft: "2.25rem" }} placeholder="Buscar por título, cliente ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {/* ── Tabs ── */}
        <AnimatedTabs value={aba} onValueChange={setAba}>
          <TabsList className="flex mb-4">
            <TabsTrigger value="kanban" className="flex-1 gap-1.5">
              <Kanban size={16} className="shrink-0" />
              <span className="hidden min-[480px]:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="lista" className="flex-1 gap-1.5">
              <List size={16} className="shrink-0" />
              <span className="hidden min-[480px]:inline">Lista</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Kanban ── */}
          <TabsContent value="kanban">
            {negocios.length === 0 ? (
              <EstadoVazio icone={<Kanban />} titulo="Pipeline vazio" detalhe="Crie o primeiro negócio para acompanhar as vendas no kanban." />
            ) : (
              <div className="pipeline-board">
                {etapasAbertas.map((etapa, ei) => {
                  const lista = porEtapa[etapa];
                  const valor = lista.reduce((t, n) => t + n.valorEstimadoEmKwanza, 0);
                  const cfg = configEtapa[etapa];
                  return (
                    <motion.div
                      key={etapa}
                      className="pipeline-lane"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springEntrada, delay: ei * 0.06 }}
                    >
                      <div className="pipeline-lane-head">
                        <span className="pipeline-lane-dot" style={{ background: cfg.cor }} />
                        <span className="pipeline-lane-name">{cfg.nome}</span>
                        <span className="pipeline-lane-count">{lista.length}</span>
                      </div>
                      {valor > 0 && <div className="pipeline-lane-value">{formatarKwanza(valor)}</div>}
                      <div className="pipeline-lane-body">
                        <AnimatePresence mode="popLayout">
                          {lista.map((n, i) => {
                            const idx = etapasAbertas.indexOf(n.etapa);
                            const proxima = etapasAbertas[idx + 1];
                            return (
                              <motion.div
                                key={n.id}
                                className="pipeline-deal"
                                style={{ "--deal-color": cfg.cor } as React.CSSProperties}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 40 }}
                                transition={{ ...springCartao, delay: i * 0.04 }}
                                whileHover={{ y: -2, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <p className="pipeline-deal-title">{n.titulo}</p>
                                <p className="pipeline-deal-client">{n.clienteNome ?? "Sem cliente"}</p>
                                <div className="crm-plus-mini-row">
                                  <span>{n.produtoNome ? `Produto: ${n.produtoNome}` : "Sem produto ligado"}</span>
                                  <span>{n.dataPrevisaoFecho ? "Com fecho previsto" : "Definir fecho"}</span>
                                </div>
                                <div className="pipeline-deal-footer">
                                  <span className="pipeline-deal-amount">{formatarKwanza(n.valorEstimadoEmKwanza)}</span>
                                  <div className="flex items-center gap-1.5">
                                    {n.dataPrevisaoFecho && <span className="pipeline-deal-date">{formatarDataHoraCurta(n.dataPrevisaoFecho)}</span>}
                                    {proxima && (
                                      <Button variant="outline" size="icon-sm" title={`Mover para ${configEtapa[proxima].nome}`} onClick={() => void moverEtapa(n, proxima)} disabled={carregando}>
                                        <ArrowRight size={12} />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        {lista.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Sem negócios</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── List ── */}
          <TabsContent value="lista">
            {negocios.length ? (
              <div className="ops-tabela">
                <div className="ops-tabela-cabecalho pipeline-lista-cols">
                  <span>Negócio</span>
                  <span className="hidden sm:block">Etapa</span>
                  <span className="text-right">Valor</span>
                  <span className="hidden lg:block">Previsão</span>
                  <span className="text-right">Acções</span>
                </div>
                {negocios.filter(n => { const t = busca.trim().toLowerCase(); if (!t) return true; return n.titulo.toLowerCase().includes(t) || n.clienteNome?.toLowerCase().includes(t); }).map((n, i) => {
                  const idx = etapasAbertas.indexOf(n.etapa);
                  const proxima = etapasAbertas[idx + 1];
                  return (
                    <motion.div
                      key={n.id}
                      className="ops-tabela-linha pipeline-lista-cols"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springCartao, delay: i * 0.02 }}
                      whileHover={{ backgroundColor: "var(--color-surface-muted)" }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">{n.clienteNome ?? "Sem cliente"}</p>
                      </div>
                      <span className="hidden sm:block"><Badge variant={varianteBadge(n.etapa)} className="text-[0.6rem]">{configEtapa[n.etapa].nome}</Badge></span>
                      <span className="text-right text-sm font-semibold tabular-nums">{formatarKwanza(n.valorEstimadoEmKwanza)}</span>
                      <span className="hidden lg:block text-xs text-muted-foreground">{n.dataPrevisaoFecho ? formatarDataHoraCurta(n.dataPrevisaoFecho) : "—"}</span>
                      <div className="flex items-center justify-end gap-1">
                        {proxima && <Button variant="outline" size="icon-sm" title={`Mover para ${configEtapa[proxima].nome}`} onClick={() => void moverEtapa(n, proxima)} disabled={carregando}><ArrowRight size={14} /></Button>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EstadoVazio icone={<Kanban />} titulo="Pipeline vazio" detalhe="Crie negócios para visualizar em lista." />
            )}
          </TabsContent>
        </AnimatedTabs>

        {/* ── Mensagem ── */}
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
