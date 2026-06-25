import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { CabecalhoPagina } from "../componentes/Shell";
import { formatarKwanza } from "../utilidades";

/* ── Tipos ───────────────────────────────────────────────── */

interface InsightPreditivo {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  nivelConfianca: string;
  confianca: number;
  acaoSugerida?: string | null;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  criadoEm: string;
}

interface AnomaliaDetectada {
  tipo: string;
  descricao: string;
  desvio: number;
  gravidade: string;
}

interface PrevisaoCaixa {
  semana: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoPrevisto: number;
}

interface ChurnVIP {
  clienteId: string;
  nome?: string;
  scoreRisco: number;
  motivoAlerta: string;
  ultimaCompra?: string;
}

/* ── Componente ──────────────────────────────────────────── */

export function PaginaInteligencia() {
  const [insights, setInsights] = useState<InsightPreditivo[]>([]);
  const [anomalias, setAnomalias] = useState<AnomaliaDetectada[]>([]);
  const [previsaoCaixa, setPrevisaoCaixa] = useState<PrevisaoCaixa[]>([]);
  const [churnVip, setChurnVip] = useState<ChurnVIP[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      const [resInsights, resAnomalias, resCaixa, resChurn] = await Promise.allSettled([
        requisitarApi<{ insights: InsightPreditivo[] }>("/inteligencia/insights?limite=20"),
        requisitarApi<{ anomalias: AnomaliaDetectada[] }>("/inteligencia/anomalias"),
        requisitarApi<{ previsoes: PrevisaoCaixa[] }>("/inteligencia/previsao-caixa"),
        requisitarApi<{ alertas: ChurnVIP[] }>("/inteligencia/churn-vip"),
      ]);

      if (resInsights.status === "fulfilled") setInsights(resInsights.value.insights ?? []);
      if (resAnomalias.status === "fulfilled") setAnomalias(resAnomalias.value.anomalias ?? []);
      if (resCaixa.status === "fulfilled") setPrevisaoCaixa(resCaixa.value.previsoes ?? []);
      if (resChurn.status === "fulfilled") setChurnVip(resChurn.value.alertas ?? []);

      const todosFalharam = [resInsights, resAnomalias, resCaixa, resChurn].every((r) => r.status === "rejected");
      if (todosFalharam) setErro("Não foi possível carregar os dados de inteligência.");

      setCarregando(false);
    }

    void carregar();
  }, []);

  async function darFeedback(insightId: string, accao: "ACEITE" | "REJEITADO" | "IGNORADO") {
    await requisitarApi(`/inteligencia/insights/${insightId}/feedback`, {
      method: "POST",
      body: { accao },
    }).catch(() => undefined);

    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  }

  if (carregando) {
    return (
      <CrmPageMotion>
        <div className="team-pgwrap">
          <CabecalhoPagina rotulo="Inteligência" titulo="Insights preditivos" />
          <div className="cd-vazio" style={{ marginTop: "2rem" }}>
            <Brain size={24} />
            <span>A analisar dados...</span>
          </div>
        </div>
      </CrmPageMotion>
    );
  }

  return (
    <CrmPageMotion>
      <div className="team-pgwrap">
        <CabecalhoPagina rotulo="Inteligência" titulo="Insights preditivos" />

        {erro && (
          <div className="cd-tudo-ok" style={{ borderColor: "var(--destructive)" }}>
            <AlertTriangle size={18} />
            <span>{erro}</span>
          </div>
        )}

        {/* ── Insights activos ────────────────────────────── */}
        {insights.length > 0 && (
          <section>
            <div className="cd-accoes-titulo">
              <span>Recomendações para o teu negócio</span>
            </div>
            <div className="cd-tarefas-lista">
              {insights.map((insight) => {
                const iconConf =
                  insight.nivelConfianca === "ALTA" ? (
                    <TrendingUp size={14} style={{ color: "var(--em)" }} />
                  ) : insight.nivelConfianca === "MEDIA" ? (
                    <Lightbulb size={14} style={{ color: "var(--gold)" }} />
                  ) : (
                    <Brain size={14} style={{ color: "var(--ink-3)" }} />
                  );

                return (
                  <div key={insight.id} className="cd-tarefa" style={{ cursor: "default" }}>
                    <span className="cd-tarefa-prio" data-tone={insight.nivelConfianca === "ALTA" ? "green" : insight.nivelConfianca === "MEDIA" ? "amber" : "mute"} />
                    <div className="cd-tarefa-conteudo">
                      <span className="cd-tarefa-titulo">{insight.titulo}</span>
                      <span className="cd-tarefa-desc">{insight.descricao}</span>
                      {insight.acaoSugerida && (
                        <span className="cd-tarefa-desc" style={{ color: "var(--em-ink)", fontWeight: 500 }}>
                          <ChevronRight size={11} /> {insight.acaoSugerida}
                        </span>
                      )}
                    </div>
                    <div className="cd-tarefa-meta" style={{ gap: "0.375rem" }}>
                      <span className="team-bdg" data-tone={insight.nivelConfianca === "ALTA" ? "green" : insight.nivelConfianca === "MEDIA" ? "amber" : "blue"}>
                        {iconConf}
                        {Math.round(insight.confianca * 100)}%
                      </span>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          className="team-btn team-btn-ghost"
                          style={{ padding: "0.25rem", minHeight: 0 }}
                          title="Aceitar"
                          onClick={() => darFeedback(insight.id, "ACEITE")}
                        >
                          <CheckCircle2 size={14} style={{ color: "var(--em)" }} />
                        </button>
                        <button
                          type="button"
                          className="team-btn team-btn-ghost"
                          style={{ padding: "0.25rem", minHeight: 0 }}
                          title="Rejeitar"
                          onClick={() => darFeedback(insight.id, "REJEITADO")}
                        >
                          <XCircle size={14} style={{ color: "var(--destructive)" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Previsão fluxo de caixa ─────────────────────── */}
        {previsaoCaixa.length > 0 && (
          <section>
            <div className="cd-accoes-titulo" style={{ marginTop: "1.5rem" }}>
              <span>Previsão de fluxo de caixa</span>
            </div>
            <div className="team-kstrip" style={{ gridTemplateColumns: `repeat(${Math.min(previsaoCaixa.length, 4)}, 1fr)` }}>
              {previsaoCaixa.slice(0, 4).map((semana) => (
                <div key={semana.semana} className="team-kcard">
                  <div className="team-kcard-label">
                    {semana.saldoPrevisto >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    Semana {semana.semana}
                  </div>
                  <div className="team-kcard-value" style={{ color: semana.saldoPrevisto >= 0 ? "var(--em-ink)" : "var(--destructive)" }}>
                    {formatarKwanza(semana.saldoPrevisto)}
                  </div>
                  <div className="team-kcard-delta">
                    {formatarKwanza(semana.entradasPrevistas)} entrada · {formatarKwanza(semana.saidasPrevistas)} saída
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="cd-grid-dupla" style={{ marginTop: "1.5rem" }}>
          {/* ── Anomalias detectadas ─────────────────────── */}
          {anomalias.length > 0 && (
            <div className="cd-pedidos-recentes">
              <div className="cd-secao-head">
                <span className="cd-secao-titulo">Anomalias detectadas</span>
              </div>
              <div className="cd-pedidos-lista">
                {anomalias.slice(0, 5).map((anomalia, i) => (
                  <div key={i} className="cd-pedido">
                    <span
                      className="team-av team-av-32"
                      data-hue={anomalia.gravidade === "ALTA" ? "red" : anomalia.gravidade === "MEDIA" ? "amber" : "blue"}
                    >
                      <AlertTriangle size={14} />
                    </span>
                    <div className="cd-pedido-info">
                      <span className="cd-pedido-nome">{anomalia.tipo.replace(/_/g, " ")}</span>
                      <span className="cd-pedido-produto">{anomalia.descricao}</span>
                    </div>
                    <div className="cd-pedido-dir">
                      <span className="team-bdg" data-tone={anomalia.gravidade === "ALTA" ? "rose" : anomalia.gravidade === "MEDIA" ? "amber" : "blue"}>
                        <span className="team-bdg-dot" />
                        {anomalia.gravidade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Alertas de churn VIP ────────────────────── */}
          {churnVip.length > 0 && (
            <div className="cd-pedidos-recentes">
              <div className="cd-secao-head">
                <span className="cd-secao-titulo">Risco de perda — clientes VIP</span>
              </div>
              <div className="cd-pedidos-lista">
                {churnVip.slice(0, 5).map((cliente) => (
                  <div key={cliente.clienteId} className="cd-pedido">
                    <span className="team-av team-av-32" data-hue={cliente.scoreRisco >= 70 ? "red" : "amber"}>
                      <TrendingDown size={14} />
                    </span>
                    <div className="cd-pedido-info">
                      <span className="cd-pedido-nome">{cliente.nome ?? "Cliente"}</span>
                      <span className="cd-pedido-produto">{cliente.motivoAlerta}</span>
                    </div>
                    <div className="cd-pedido-dir">
                      <span className="team-bdg" data-tone={cliente.scoreRisco >= 70 ? "rose" : "amber"}>
                        <span className="team-bdg-dot" />
                        Risco {cliente.scoreRisco}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sem dados ──────────────────────────────────── */}
        {insights.length === 0 && anomalias.length === 0 && previsaoCaixa.length === 0 && churnVip.length === 0 && !erro && (
          <div className="cd-tudo-ok">
            <Brain size={22} />
            <div>
              <strong>Sem insights por agora</strong>
              <span>Quando houver dados suficientes, a inteligência preditiva vai sugerir acções aqui.</span>
            </div>
          </div>
        )}
      </div>
    </CrmPageMotion>
  );
}
