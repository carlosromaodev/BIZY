import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  KeyRound,
  Play,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResumoAutomacoes, WorkflowN8n } from "../tipos";

const statusIcone: Record<WorkflowN8n["estado"], ReactNode> = {
  PRONTO_PARA_IMPORTAR: <CheckCircle2 size={16} />,
  PENDENTE_CONFIGURACAO: <AlertTriangle size={16} />
};

export function PaginaIntegracaoN8n() {
  const [resumo, setResumo] = useState<ResumoAutomacoes | null>(null);
  const [mensagem, setMensagem] = useState("");
  const workflows = resumo?.workflows ?? [];
  const prontos = workflows.filter((workflow) => workflow.estado === "PRONTO_PARA_IMPORTAR").length;
  const eventosCobertos = new Set(workflows.flatMap((workflow) => workflow.eventos)).size;
  const endpointsCobertos = new Set(workflows.flatMap((workflow) => workflow.endpointsBackend)).size;
  const n8nUrl = import.meta.env.VITE_N8N_URL ?? (import.meta.env.DEV ? "http://localhost:5678" : "");

  async function carregar() {
    try {
      setResumo(await requisitarApi<ResumoAutomacoes>("/automacoes/status"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível consultar o n8n.");
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Automação avançada" titulo="n8n">
        <Button variant="outline" size="lg" onClick={() => void carregar()}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
        {n8nUrl && (
          <Button asChild size="lg">
            <a href={n8nUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
              Abrir n8n
            </a>
          </Button>
        )}
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo do n8n"
        colunas={3}
        itens={[
          { icone: <GitBranch />, titulo: "Workflows prontos", valor: prontos, detalhe: `de ${workflows.length} modelos`, tom: prontos === workflows.length && workflows.length ? "sucesso" : "atencao" },
          { icone: <Play />, titulo: "Eventos cobertos", valor: eventosCobertos, detalhe: "eventos do backend", tom: "principal" },
          { icone: <ShieldCheck />, titulo: "Guardrails", valor: "Ativos", detalhe: "Automação não altera venda fora do backend", tom: "sucesso" }
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <CrmSection
          icon={<GitBranch size={20} />}
          title="Workflows importáveis"
          description="Modelos n8n prontos para ligar eventos do backend a automações controladas."
        >
          <CrmList>
            {workflows.length ? (
              workflows.map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} />)
            ) : (
              <EstadoVazio icone={<GitBranch />} titulo="Sem workflows" detalhe="O backend ainda não retornou o contrato n8n." />
            )}
          </CrmList>
        </CrmSection>

        <CrmSection
          icon={<KeyRound size={20} />}
          title="Contrato de automação"
          description="Limites e endpoints autorizados para automações externas."
        >
          <div className="grid gap-3">
            <CrmMetricMini label="Webhook backend -> n8n" value={resumo?.configuracoes.find((item) => item.nome === "Webhook de eventos")?.valor ?? "não carregado"} tone="principal" />
            <CrmMetricMini label="Endpoints backend chamados pelo n8n" value={endpointsCobertos} tone="sucesso" />
            <CrmMetricMini label="Arquivos" value="n8n/workflows" />
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(workflows.flatMap((workflow) => workflow.guardrails))).map((guardrail) => (
              <Badge key={guardrail} variant="secondary">
                <ShieldCheck size={14} />
                {guardrail}
              </Badge>
            ))}
          </div>
        </CrmSection>
      </section>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function WorkflowCard({ workflow }: { workflow: WorkflowN8n }) {
  return (
    <CrmListItem
      className={workflow.estado === "PRONTO_PARA_IMPORTAR" ? "border-success/25 bg-success/5" : "border-warning/25 bg-warning/5"}
      media={statusIcone[workflow.estado]}
      title={workflow.nome}
      description={workflow.arquivo}
      tone={workflow.estado === "PRONTO_PARA_IMPORTAR" ? "sucesso" : "atencao"}
      badges={(
        <>
          {workflow.eventos.slice(0, 4).map((evento) => (
            <Badge key={evento} variant="outline">{evento}</Badge>
          ))}
          {workflow.eventos.length > 4 && <Badge variant="outline">+{workflow.eventos.length - 4}</Badge>}
        </>
      )}
      actions={(
        <Badge variant={workflow.estado === "PRONTO_PARA_IMPORTAR" ? "success" : "warning"}>
          {workflow.estado === "PRONTO_PARA_IMPORTAR" ? "Pronto" : "Pendente"}
        </Badge>
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <CrmMetricMini label="endpoints" value={workflow.endpointsBackend.length} tone="principal" />
        <CrmMetricMini label="guardrails" value={workflow.guardrails.length} tone="sucesso" />
      </div>
    </CrmListItem>
  );
}
