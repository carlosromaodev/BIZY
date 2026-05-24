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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <>
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
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
              <GitBranch size={20} />
            </div>
            <h2 className="text-lg font-semibold">Workflows importáveis</h2>
          </CardHeader>

          <CardContent className="grid gap-3">
            {workflows.length ? (
              workflows.map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} />)
            ) : (
              <EstadoVazio icone={<GitBranch />} titulo="Sem workflows" detalhe="O backend ainda não retornou o contrato n8n." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
              <KeyRound size={20} />
            </div>
            <h2 className="text-lg font-semibold">Contrato de automação</h2>
          </CardHeader>

          <CardContent className="grid gap-4">
          <div className="grid gap-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="block text-sm text-muted-foreground">Webhook backend → n8n</span>
              <strong>{resumo?.configuracoes.find((item) => item.nome === "Webhook de eventos")?.valor ?? "não carregado"}</strong>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="block text-sm text-muted-foreground">Endpoints backend chamados pelo n8n</span>
              <strong>{endpointsCobertos}</strong>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="block text-sm text-muted-foreground">Arquivos</span>
              <strong>n8n/workflows</strong>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(workflows.flatMap((workflow) => workflow.guardrails))).map((guardrail) => (
              <Badge key={guardrail} variant="secondary">
                <ShieldCheck size={14} />
                {guardrail}
              </Badge>
            ))}
          </div>
          </CardContent>
        </Card>
      </section>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function WorkflowCard({ workflow }: { workflow: WorkflowN8n }) {
  return (
    <Card className={workflow.estado === "PRONTO_PARA_IMPORTAR" ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"}>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-background text-primary">{statusIcone[workflow.estado]}</div>
      <div className="min-w-0">
        <strong className="block truncate">{workflow.nome}</strong>
        <span className="block truncate text-sm text-muted-foreground">{workflow.arquivo}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {workflow.eventos.slice(0, 4).map((evento) => (
            <Badge key={evento} variant="outline">{evento}</Badge>
          ))}
          {workflow.eventos.length > 4 && <Badge variant="outline">+{workflow.eventos.length - 4}</Badge>}
        </div>
      </div>
      <div className="flex gap-3 text-sm">
        <div>
          <strong>{workflow.endpointsBackend.length}</strong>
          <span className="ml-1 text-muted-foreground">endpoints</span>
        </div>
        <div>
          <strong>{workflow.guardrails.length}</strong>
          <span className="ml-1 text-muted-foreground">guardrails</span>
        </div>
      </div>
      <div className="lg:justify-self-end">
        <Badge variant={workflow.estado === "PRONTO_PARA_IMPORTAR" ? "success" : "warning"}>
          {workflow.estado === "PRONTO_PARA_IMPORTAR" ? "Pronto" : "Pendente"}
        </Badge>
      </div>
      </CardContent>
    </Card>
  );
}
