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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <>
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

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {agentes.length ? (
          agentes.map((agente) => <AgenteCard key={agente.id} agente={agente} />)
        ) : (
          <EstadoVazio icone={<SlidersHorizontal />} titulo="Sem leitura operacional" detalhe="O backend ainda não retornou os agentes." />
        )}
      </section>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function AgenteCard({ agente }: { agente: AgenteAutomacao }) {
  const ativo = agente.estado === "ATIVA";

  return (
    <Card className={ativo ? "border-success/20 bg-success/5" : undefined}>
      <CardContent className="grid gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-background text-primary">
          {iconesAgente[agente.id] ?? <SlidersHorizontal size={24} />}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block">{agente.nome}</strong>
          <Badge className="mt-1 w-fit" variant={ativo ? "success" : agente.estado === "PENDENTE" ? "warning" : "secondary"}>
            {agente.estado === "ATIVA" ? "Ativo" : agente.estado === "PENDENTE" ? "Pendente" : "Desativado"}
          </Badge>
        </div>
        {ativo ? <CheckCircle2 className="text-success" size={20} /> : null}
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{agente.descricao}</p>

      <div className="grid gap-2">
        <div className="rounded-lg border bg-background p-3">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">Gatilho</span>
          <span>{agente.gatilho}</span>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">Ação</span>
          <span>{agente.acaoPrincipal}</span>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">Canal</span>
          <span>{agente.canal}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
        <div className="flex items-center gap-2">
          <Zap size={14} />
          <strong>{agente.origem}</strong>
          <span className="text-muted-foreground">origem</span>
        </div>
        <span className="text-muted-foreground">{agente.evidencia}</span>
      </div>
      </CardContent>
    </Card>
  );
}
