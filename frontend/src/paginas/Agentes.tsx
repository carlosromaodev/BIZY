import {
  Bell,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MessageCircle,
  ReceiptText,
  RefreshCcw,
  SlidersHorizontal,
  Users,
  Zap
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { obterUrlEventos, requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgenteAutomacao, ResumoAutomacoes } from "../tipos";

const iconesAgente: Record<string, ReactNode> = {
  "parser-reservas": <ReceiptText size={24} />,
  "expiracao-fila": <Bell size={24} />,
  "whatsapp-reservas": <MessageCircle size={24} />,
  "atendimento-ia": <SlidersHorizontal size={24} />,
  comprovativos: <Users size={24} />,
  "pos-venda": <HeartHandshake size={24} />
};

export function PaginaAgentes() {
  const [resumo, setResumo] = useState<ResumoAutomacoes | null>(null);
  const [mensagem, setMensagem] = useState("");
  const agentes = resumo?.agentes ?? [];
  const ativos = agentes.filter((agente) => agente.estado === "ATIVA").length;
  const pendentes = agentes.filter((agente) => agente.estado === "PENDENTE").length;

  async function carregar() {
    try {
      setResumo(await requisitarApi<ResumoAutomacoes>("/automacoes/status"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar automações.");
    }
  }

  useEffect(() => {
    void carregar();
    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregar();
    ["COMMENT_PARSED", "RESERVATION_CREATED", "RESERVATION_EXPIRING", "PAYMENT_CONFIRMED"].forEach((evento) =>
      eventos.addEventListener(evento, atualizar)
    );
    return () => eventos.close();
  }, []);

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Automação operacional" titulo="Agentes reais do sistema">
        <Button variant="outline" size="lg" onClick={() => void carregar()}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo dos agentes"
        colunas={3}
        itens={[
          { icone: <SlidersHorizontal />, titulo: "Agentes ativos", valor: ativos, detalhe: `de ${agentes.length} fluxos`, tom: "sucesso" },
          { icone: <Clock />, titulo: "Pendências", valor: pendentes, detalhe: "dependem de configuração", tom: pendentes ? "atencao" : "neutro" },
          { icone: <Zap />, titulo: "Sinais reais", valor: resumo?.metricas.comentarios ?? 0, detalhe: `${resumo?.metricas.reservas ?? 0} reservas no backend`, tom: "principal" }
        ]}
      />

      <CrmList columns="three">
        {agentes.length ? (
          agentes.map((agente) => <AgenteCard key={agente.id} agente={agente} />)
        ) : (
          <EstadoVazio icone={<SlidersHorizontal />} titulo="Sem leitura operacional" detalhe="O backend ainda não retornou os agentes." />
        )}
      </CrmList>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function AgenteCard({ agente }: { agente: AgenteAutomacao }) {
  const ativo = agente.estado === "ATIVA";

  return (
    <CrmListItem
      className={ativo ? "border-success/25 bg-success/5" : undefined}
      media={iconesAgente[agente.id] ?? <SlidersHorizontal size={24} />}
      title={agente.nome}
      description={agente.descricao}
      tone={ativo ? "sucesso" : agente.estado === "PENDENTE" ? "atencao" : "neutro"}
      badges={(
        <>
          <Badge className="mt-1 w-fit" variant={ativo ? "success" : agente.estado === "PENDENTE" ? "warning" : "secondary"}>
            {agente.estado === "ATIVA" ? "Ativo" : agente.estado === "PENDENTE" ? "Pendente" : "Desativado"}
          </Badge>
          {ativo ? <Badge variant="success"><CheckCircle2 size={14} /> Operacional</Badge> : null}
        </>
      )}
    >
      <div className="grid gap-2">
        <CrmMetricMini label="gatilho" value={agente.gatilho} />
        <CrmMetricMini label="ação" value={agente.acaoPrincipal} tone={ativo ? "sucesso" : "neutro"} />
        <CrmMetricMini label="canal" value={agente.canal} tone="principal" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
        <div className="flex items-center gap-2">
          <Zap size={14} />
          <strong>{agente.origem}</strong>
          <span className="text-muted-foreground">origem</span>
        </div>
        <span className="text-muted-foreground">{agente.evidencia}</span>
      </div>
    </CrmListItem>
  );
}
