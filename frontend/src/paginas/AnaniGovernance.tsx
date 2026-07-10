import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  RefreshCcw,
  ShieldAlert,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  KpiCard,
  KpiGrid,
  PageHead,
  PanelCard,
  StatusBadge,
  BotaoBizy,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import { formatarKwanza } from "../utilidades";

interface NegocioRisco {
  negocioId: string;
  nomeComercial: string | null;
  riskScore: number;
  trustScore: number;
  criadoEm: string;
}

interface TeamHealthReadModel {
  negociosMonitorados: number;
  tarefasAbertas: number;
  tarefasCriticas: number;
  conversasAbertas: number;
  pedidosPendentes: number;
  riscoMedio: number;
  trustMedio: number;
  negociosEmAtencao: NegocioRisco[];
  sinais: string[];
}

interface MarketSnapshotReadModel {
  lojasPublicadas: number;
  produtosAtivos: number;
  produtosSemStock: number;
  pedidos30d: number;
  receita30dEmKwanza: number;
  negociosMonitorados: number;
  riscoMedio: number;
  trustMedio: number;
  negociosEmAtencao: NegocioRisco[];
  sinais: string[];
}

interface SecuritySnapshotReadModel {
  incidentesAbertos: number;
  incidentesCriticos: number;
  quarentenasAbertas: number;
  quarentenasCriticas: number;
  eventosPendentes: number;
  eventosFalhados: number;
  ultimoIncidenteEm: string | null;
  sinais: string[];
}

interface AnaniReadModels {
  atualizadoEm: string;
  teamHealth: TeamHealthReadModel;
  marketSnapshot: MarketSnapshotReadModel;
  securitySnapshot: SecuritySnapshotReadModel;
}

export function PaginaAnaniGovernance() {
  const [dados, setDados] = useState<AnaniReadModels | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [projetando, setProjetando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await requisitarApi<AnaniReadModels>("/governance/anani/read-models");
      setDados(resposta);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel carregar a governanca Anani.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function projectarReadModels() {
    setProjetando(true);
    setErro("");
    try {
      const resposta = await requisitarApi<AnaniReadModels>("/governance/anani/read-models/projectar", { method: "POST" });
      setDados(resposta);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel projectar os read models Anani.");
    } finally {
      setProjetando(false);
    }
  }

  const severidadeSeguranca = useMemo(() => {
    const snapshot = dados?.securitySnapshot;
    if (!snapshot) return "mute" as CorSemantica;
    if (snapshot.incidentesCriticos || snapshot.quarentenasCriticas || snapshot.eventosFalhados) return "rose" as CorSemantica;
    if (snapshot.incidentesAbertos || snapshot.quarentenasAbertas || snapshot.eventosPendentes) return "amber" as CorSemantica;
    return "green" as CorSemantica;
  }, [dados]);

  return (
    <CrmPageMotion>
      <div className="team-pgwrap">
        <PageHead
          eyebrow="Governanca interna"
          titulo="Anani Control Plane"
          tamanhoTitulo="sm"
        >
          <BotaoBizy icone={Brain} onClick={() => void projectarReadModels()} disabled={projetando}>
            {projetando ? "A projectar" : "Projectar"}
          </BotaoBizy>
          <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar read models">
            <RefreshCcw size={16} />
          </button>
        </PageHead>

        {erro && (
          <div className="cd-tudo-ok" style={{ borderColor: "var(--destructive)", marginBottom: 16 }}>
            <AlertTriangle size={18} />
            <span>{erro}</span>
          </div>
        )}

        {carregando && !dados ? (
          <div className="cd-vazio" style={{ marginTop: "2rem" }}>
            <Brain size={24} />
            <span>A calcular read models...</span>
          </div>
        ) : dados ? (
          <>
            <KpiGrid>
              <KpiCard
                hero
                icone={UsersRound}
                rotulo="Team health"
                valor={`${scorePercentual(dados.teamHealth.trustMedio)}%`}
                delta={`${dados.teamHealth.tarefasCriticas} tarefas criticas`}
                deltaPositivo={dados.teamHealth.tarefasCriticas === 0}
              />
              <KpiCard
                icone={ShoppingBag}
                cor={dados.marketSnapshot.produtosSemStock > 0 ? "amber" : "green"}
                rotulo="Market snapshot"
                valor={dados.marketSnapshot.lojasPublicadas}
                delta={`${dados.marketSnapshot.produtosSemStock} sem stock`}
                deltaPositivo={dados.marketSnapshot.produtosSemStock === 0}
              />
              <KpiCard
                icone={ShieldAlert}
                cor={severidadeSeguranca}
                rotulo="Security snapshot"
                valor={dados.securitySnapshot.incidentesAbertos}
                delta={`${dados.securitySnapshot.eventosFalhados} eventos falhados`}
                deltaPositivo={dados.securitySnapshot.eventosFalhados === 0}
              />
              <KpiCard
                icone={CheckCircle2}
                cor={dados.securitySnapshot.quarentenasAbertas > 0 ? "amber" : "green"}
                rotulo="Quarentenas"
                valor={dados.securitySnapshot.quarentenasAbertas}
                delta={`${dados.securitySnapshot.quarentenasCriticas} criticas`}
                deltaPositivo={dados.securitySnapshot.quarentenasCriticas === 0}
              />
            </KpiGrid>

            <div className="cd-grid-dupla" style={{ marginTop: 20 }}>
              <PanelCard titulo="TeamHealth" descricao="Operacao comercial, atendimento, tarefas e risco por negocio.">
                <ResumoScore risco={dados.teamHealth.riscoMedio} trust={dados.teamHealth.trustMedio} />
                <ListaSinais sinais={dados.teamHealth.sinais} />
                <ListaNegociosRisco negocios={dados.teamHealth.negociosEmAtencao} />
                <div className="cd-pedidos-lista">
                  <LinhaMetrica rotulo="Conversas abertas" valor={dados.teamHealth.conversasAbertas} />
                  <LinhaMetrica rotulo="Pedidos pendentes" valor={dados.teamHealth.pedidosPendentes} />
                  <LinhaMetrica rotulo="Tarefas abertas" valor={dados.teamHealth.tarefasAbertas} />
                </div>
              </PanelCard>

              <PanelCard titulo="MarketSnapshot" descricao="Lojas, catalogo, stock e receita dos ultimos 30 dias.">
                <ResumoScore risco={dados.marketSnapshot.riscoMedio} trust={dados.marketSnapshot.trustMedio} />
                <ListaSinais sinais={dados.marketSnapshot.sinais} />
                <ListaNegociosRisco negocios={dados.marketSnapshot.negociosEmAtencao} />
                <div className="cd-pedidos-lista">
                  <LinhaMetrica rotulo="Produtos ativos" valor={dados.marketSnapshot.produtosAtivos} />
                  <LinhaMetrica rotulo="Pedidos 30d" valor={dados.marketSnapshot.pedidos30d} />
                  <LinhaMetrica rotulo="Receita 30d" valor={formatarKwanza(dados.marketSnapshot.receita30dEmKwanza)} />
                </div>
              </PanelCard>
            </div>

            <PanelCard titulo="SecuritySnapshot" descricao="Incidentes, quarentenas e fila interna de eventos." className="mt-5">
              <div className="cd-pedidos-lista">
                <LinhaMetrica rotulo="Incidentes criticos" valor={dados.securitySnapshot.incidentesCriticos} tom={dados.securitySnapshot.incidentesCriticos > 0 ? "rose" : "green"} />
                <LinhaMetrica rotulo="Quarentenas criticas" valor={dados.securitySnapshot.quarentenasCriticas} tom={dados.securitySnapshot.quarentenasCriticas > 0 ? "rose" : "green"} />
                <LinhaMetrica rotulo="Eventos pendentes" valor={dados.securitySnapshot.eventosPendentes} tom={dados.securitySnapshot.eventosPendentes > 100 ? "amber" : "blue"} />
                <LinhaMetrica rotulo="Ultimo incidente" valor={formatarData(dados.securitySnapshot.ultimoIncidenteEm)} />
              </div>
              <ListaSinais sinais={dados.securitySnapshot.sinais} />
            </PanelCard>

            <p style={{ marginTop: 16, color: "var(--ink-3)", fontSize: 12 }}>
              Atualizado em {formatarData(dados.atualizadoEm)}. Esta console e interna e nao aparece na navegacao comercial de tenant.
            </p>
          </>
        ) : null}
      </div>
    </CrmPageMotion>
  );
}

function ResumoScore({ risco, trust }: { risco: number; trust: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      <StatusBadge cor={tomRisco(risco)}>Risco {scorePercentual(risco)}%</StatusBadge>
      <StatusBadge cor={tomTrust(trust)}>Trust {scorePercentual(trust)}%</StatusBadge>
    </div>
  );
}

function ListaSinais({ sinais }: { sinais: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {sinais.map((sinal) => (
        <StatusBadge key={sinal} cor={sinal.includes("estavel") ? "green" : sinal.includes("crit") || sinal.includes("falhad") ? "rose" : "amber"}>
          {sinal.replace(/_/g, " ")}
        </StatusBadge>
      ))}
    </div>
  );
}

function ListaNegociosRisco({ negocios }: { negocios: NegocioRisco[] }) {
  if (negocios.length === 0) {
    return (
      <div className="cd-vazio" style={{ padding: 16, marginBottom: 12 }}>
        <CheckCircle2 size={18} />
        <span>Sem negocios em atencao.</span>
      </div>
    );
  }

  return (
    <div className="cd-pedidos-lista" style={{ marginBottom: 12 }}>
      {negocios.map((negocio) => (
        <div key={negocio.negocioId} className="cd-pedido">
          <span className="team-av team-av-32" data-hue={negocio.riskScore >= 0.7 ? "red" : "amber"}>
            <AlertTriangle size={14} />
          </span>
          <div className="cd-pedido-info">
            <span className="cd-pedido-nome">{negocio.nomeComercial ?? negocio.negocioId.slice(0, 8)}</span>
            <span className="cd-pedido-produto">Risco {scorePercentual(negocio.riskScore)}% · Trust {scorePercentual(negocio.trustScore)}%</span>
          </div>
          <StatusBadge cor={tomRisco(negocio.riskScore)}>{formatarData(negocio.criadoEm)}</StatusBadge>
        </div>
      ))}
    </div>
  );
}

function LinhaMetrica({ rotulo, valor, tom = "mute" }: { rotulo: string; valor: string | number; tom?: CorSemantica }) {
  return (
    <div className="cd-pedido">
      <div className="cd-pedido-info">
        <span className="cd-pedido-nome">{rotulo}</span>
      </div>
      <StatusBadge cor={tom}>{valor}</StatusBadge>
    </div>
  );
}

function scorePercentual(valor: number) {
  return Math.round(valor * 100);
}

function tomRisco(valor: number): CorSemantica {
  if (valor >= 0.7) return "rose";
  if (valor >= 0.45) return "amber";
  return "green";
}

function tomTrust(valor: number): CorSemantica {
  if (valor >= 0.85) return "green";
  if (valor >= 0.65) return "amber";
  return "rose";
}

function formatarData(valor?: string | null) {
  if (!valor) return "Sem registo";
  return new Date(valor).toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
