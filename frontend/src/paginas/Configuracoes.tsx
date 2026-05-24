import {
  Clock,
  Database,
  MessageCircle,
  RefreshCcw,
  Settings,
  Shield,
  Store,
  Workflow
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConfiguracaoOperacional, ResumoAutomacoes } from "../tipos";
import { traduzirEstadoIntegracao } from "../utilidades";

const iconesConfiguracao: Record<string, ReactNode> = {
  Reservas: <Clock size={20} />,
  Dados: <Database size={20} />,
  n8n: <Workflow size={20} />,
  WhatsApp: <MessageCircle size={20} />
};

export function PaginaConfiguracoes() {
  const [resumo, setResumo] = useState<ResumoAutomacoes | null>(null);
  const [mensagem, setMensagem] = useState("");
  const configuracoes = resumo?.configuracoes ?? [];
  const porGrupo = useMemo(() => agruparPorGrupo(configuracoes), [configuracoes]);
  const integracoesConfiguradas = resumo?.integracoes.filter((integracao) => integracao.estado === "CONFIGURADA").length ?? 0;
  const pendencias = [
    ...(resumo?.configuracoes.filter((config) => config.estado === "PENDENTE") ?? []),
    ...(resumo?.integracoes.filter((integracao) => integracao.estado === "PENDENTE") ?? [])
  ].length;

  async function carregar() {
    try {
      setResumo(await requisitarApi<ResumoAutomacoes>("/automacoes/status"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar configurações.");
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <>
      <CabecalhoPagina rotulo="Administração" titulo="Configurações em execução">
        <Button variant="outline" size="lg" onClick={() => void carregar()}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo das configurações"
        colunas={3}
        itens={[
          { icone: <Settings />, titulo: "Parâmetros", valor: configuracoes.length, detalhe: "lidos do backend", tom: "principal" },
          { icone: <Store />, titulo: "Integrações", valor: integracoesConfiguradas, detalhe: `${resumo?.integracoes.length ?? 0} verificadas`, tom: "sucesso" },
          { icone: <Shield />, titulo: "Pendências", valor: pendencias, detalhe: "itens que exigem configuração", tom: pendencias ? "atencao" : "neutro" }
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {Object.entries(porGrupo).map(([grupo, itens]) => (
          <Card key={grupo}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                {iconesConfiguracao[grupo] ?? <Settings size={20} />}
              </div>
              <h2 className="text-lg font-semibold">{grupo}</h2>
            </CardHeader>
            <CardContent className="grid gap-3">
              {itens.map((item) => (
                <Card className="bg-muted/20" key={`${item.grupo}-${item.nome}`}>
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <strong className="block truncate">{item.nome}</strong>
                    <span className="block text-sm text-muted-foreground">{item.detalhe}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <code className="rounded bg-background px-2 py-1 text-xs">{item.valor}</code>
                    <Badge variant={item.estado === "ATIVA" ? "success" : item.estado === "PENDENTE" ? "warning" : "secondary"}>
                      {item.estado === "ATIVA" ? "Ativa" : item.estado === "PENDENTE" ? "Pendente" : "Desativada"}
                    </Badge>
                  </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Workflow size={20} />
            </div>
            <h2 className="text-lg font-semibold">Integrações</h2>
          </CardHeader>
          <CardContent className="grid gap-3">
            {resumo?.integracoes.length ? (
              resumo.integracoes.map((integracao) => (
                <Card className="bg-muted/20" key={integracao.nome}>
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <strong className="block truncate">{integracao.nome}</strong>
                    <span className="block text-sm text-muted-foreground">{integracao.detalhe}</span>
                  </div>
                  <Badge className="w-fit" variant={integracao.estado === "CONFIGURADA" ? "success" : integracao.estado === "PENDENTE" ? "warning" : "secondary"}>
                    {traduzirEstadoIntegracao(integracao.estado)}
                  </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EstadoVazio icone={<Workflow />} titulo="Sem integrações" detalhe="O backend ainda não retornou status." />
            )}
          </CardContent>
        </Card>
      </section>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function agruparPorGrupo(configuracoes: ConfiguracaoOperacional[]) {
  return configuracoes.reduce<Record<string, ConfiguracaoOperacional[]>>((grupos, item) => {
    grupos[item.grupo] = [...(grupos[item.grupo] ?? []), item];
    return grupos;
  }, {});
}
