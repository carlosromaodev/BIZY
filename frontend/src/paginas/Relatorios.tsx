import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  LineChart,
  PackageCheck,
  RefreshCcw,
  TrendingUp,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarDataHoraCurta } from "../utilidades";

interface ClienteRelatorioCrm {
  telefone: string;
  nomeCliente: string;
  reservas: number;
  reservasPagas: number;
  mensagens: number;
  mensagensFalhadas: number;
  statusOportunidade?: string;
}

interface RelatorioCrm {
  liveId: string | null;
  metricas: {
    clientesAtendidos: number;
    conversoes: number;
    mensagensFalhadas: number;
    taxaConversaoClientes: number;
    tempoMedioPrimeiraRespostaSegundos: number | null;
  };
  oportunidadesPerdidas: {
    comentariosComIntencaoSemReserva: number;
    reservasExpiradas: number;
    reservasCanceladas: number;
    mensagensFalhadas: number;
  };
  clientes: ClienteRelatorioCrm[];
}

interface EntregaRelatorio {
  reservaId: string;
  codigoPeca: string;
  nomePeca: string;
  telefoneCliente: string;
  nomeCliente: string;
  estadoEntrega?: string;
  criadaEm?: string;
}

interface RelatorioEntregas {
  entregas: EntregaRelatorio[];
}

function formatarTempoResposta(segundos: number | null): string {
  if (segundos === null || Number.isNaN(segundos)) return "Sem base";
  if (segundos < 60) return `${Math.round(segundos)}s`;
  const minutos = Math.floor(segundos / 60);
  const restantes = Math.round(segundos % 60);
  return restantes ? `${minutos}m ${restantes}s` : `${minutos}m`;
}

export function PaginaRelatorios() {
  const [crm, setCrm] = useState<RelatorioCrm | null>(null);
  const [entregas, setEntregas] = useState<EntregaRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const [relatorioCrm, relatorioEntregas] = await Promise.all([
        requisitarApi<RelatorioCrm>("/relatorios/crm-pos-live"),
        requisitarApi<RelatorioEntregas>("/relatorios/entregas")
      ]);
      setCrm(relatorioCrm);
      setEntregas(relatorioEntregas.entregas);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar relatórios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const metricas = crm?.metricas;
  const oportunidades = crm?.oportunidadesPerdidas;
  const perdas =
    (oportunidades?.comentariosComIntencaoSemReserva ?? 0) +
    (oportunidades?.reservasExpiradas ?? 0) +
    (oportunidades?.reservasCanceladas ?? 0) +
    (oportunidades?.mensagensFalhadas ?? 0);
  const topClientes = [...(crm?.clientes ?? [])]
    .sort((a, b) => b.reservasPagas - a.reservasPagas || b.reservas - a.reservas)
    .slice(0, 6);

  if (carregando && !crm) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="dash-titulo">Relatórios</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Resultados comerciais e operacionais</p>
        </div>
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={16} />
          Atualizar
        </Button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="dash-kpi-grid">
        {([
          { rotulo: "Atendidos", valor: String(metricas?.clientesAtendidos ?? 0), icone: <Users size={18} />, cor: "var(--primary)" },
          { rotulo: "Conversões", valor: String(metricas?.conversoes ?? 0), icone: (metricas?.taxaConversaoClientes ?? 0) >= 50 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />, cor: (metricas?.taxaConversaoClientes ?? 0) >= 50 ? "var(--success)" : "var(--warning)" },
          { rotulo: "Perdas", valor: String(perdas), icone: perdas ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />, cor: perdas ? "var(--warning)" : "var(--success)" },
          { rotulo: "Resposta", valor: formatarTempoResposta(metricas?.tempoMedioPrimeiraRespostaSegundos ?? null), icone: <Clock3 size={18} />, cor: "var(--info)" },
        ] as const).map((kpi, i) => (
          <motion.div
            key={kpi.rotulo}
            className="dash-kpi-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * i }}
          >
            <div className="dash-kpi-icon" style={{ background: `color-mix(in srgb, ${kpi.cor} 10%, transparent)`, color: kpi.cor }}>
              {kpi.icone}
            </div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{kpi.rotulo}</span>
              <strong className="dash-kpi-value">{kpi.valor}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Conversion rate ── */}
      {(metricas?.clientesAtendidos ?? 0) > 0 && (
        <div className="dash-progress-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Taxa de conversão</span>
            <span className="text-sm font-bold tabular-nums">{metricas?.taxaConversaoClientes ?? 0}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${metricas?.taxaConversaoClientes ?? 0}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.65rem] text-muted-foreground">
            <span>{metricas?.conversoes ?? 0} conversões</span>
            <span>{metricas?.clientesAtendidos ?? 0} atendidos</span>
          </div>
        </div>
      )}

      {/* ── Two-column: Clients + Deliveries ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Clients */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <TrendingUp size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Melhores relações</span>
          </div>
          {topClientes.length ? (
            <div className="divide-y divide-border/50">
              {topClientes.map((cliente) => (
                <div key={cliente.telefone} className="flex items-center gap-4 px-4 py-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${cliente.mensagensFalhadas ? "bg-destructive" : "bg-primary"}`}>
                    {(cliente.nomeCliente || "C")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cliente.nomeCliente || "Cliente"}</p>
                    <p className="truncate text-xs text-muted-foreground">{cliente.telefone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cliente.mensagensFalhadas ? "destructive" : "success"} className="text-[0.6rem]">
                      {cliente.mensagensFalhadas ? `${cliente.mensagensFalhadas} falha(s)` : "Em dia"}
                    </Badge>
                    <span className="text-xs font-semibold tabular-nums">{cliente.reservasPagas}/{cliente.reservas}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EstadoVazio icone={<Users />} titulo="Sem clientes no relatório" detalhe="Os dados aparecem depois de atendimento e reservas." />
            </div>
          )}
        </div>

        {/* Recent Deliveries */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <PackageCheck size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Entregas recentes</span>
          </div>
          {entregas.slice(0, 6).length ? (
            <div className="divide-y divide-border/50">
              {entregas.slice(0, 6).map((entrega) => (
                <div key={entrega.reservaId} className="flex items-center gap-4 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <PackageCheck size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">#{entrega.codigoPeca} {entrega.nomePeca}</p>
                    <p className="truncate text-xs text-muted-foreground">{entrega.nomeCliente || entrega.telefoneCliente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[0.6rem]">{entrega.estadoEntrega ?? "Pendente"}</Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {entrega.criadaEm ? formatarDataHoraCurta(entrega.criadaEm) : "Sem data"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EstadoVazio icone={<PackageCheck />} titulo="Sem entregas recentes" detalhe="As entregas aparecem após pagamentos confirmados." />
            </div>
          )}
        </div>
      </div>

      {/* ── Funnel losses ── */}
      <div className="dash-section-card">
        <div className="dash-section-header">
          <LineChart size={16} className="text-muted-foreground" />
          <span className="dash-section-title">Onde a loja perdeu venda</span>
        </div>
        <div className="grid gap-4 p-4">
          {[
            { rotulo: "Intenção sem pedido", valor: oportunidades?.comentariosComIntencaoSemReserva ?? 0, tom: "warning" as const },
            { rotulo: "Reservas expiradas", valor: oportunidades?.reservasExpiradas ?? 0, tom: "destructive" as const },
            { rotulo: "Reservas canceladas", valor: oportunidades?.reservasCanceladas ?? 0, tom: "destructive" as const },
            { rotulo: "Mensagens falhadas", valor: oportunidades?.mensagensFalhadas ?? 0, tom: "warning" as const }
          ].map((item) => {
            const maximo = Math.max(perdas, 1);
            const percentual = Math.round((item.valor / maximo) * 100);
            return (
              <div key={item.rotulo} className="grid gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.rotulo}</span>
                  <span className="font-semibold tabular-nums">{item.valor}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.tom === "destructive" ? "bg-destructive/70" : "bg-warning/70"}`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}
