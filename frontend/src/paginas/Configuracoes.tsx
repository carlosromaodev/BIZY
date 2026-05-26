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
import { CrmList, CrmListItem, CrmPageMotion, CrmSection } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <CrmPageMotion>
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
          <CrmSection
            key={grupo}
            icon={iconesConfiguracao[grupo] ?? <Settings size={20} />}
            title={grupo}
            description="Parâmetros lidos do backend para operação da loja."
          >
            <CrmList>
              {itens.map((item) => (
                <CrmListItem
                  key={`${item.grupo}-${item.nome}`}
                  media={iconesConfiguracao[grupo] ?? <Settings size={18} />}
                  title={item.nome}
                  description={item.detalhe}
                  tone={item.estado === "ATIVA" ? "sucesso" : item.estado === "PENDENTE" ? "atencao" : "neutro"}
                  actions={(
                    <>
                    <code className="rounded bg-background px-2 py-1 text-xs">{item.valor}</code>
                    <Badge variant={item.estado === "ATIVA" ? "success" : item.estado === "PENDENTE" ? "warning" : "secondary"}>
                      {item.estado === "ATIVA" ? "Ativa" : item.estado === "PENDENTE" ? "Pendente" : "Desativada"}
                    </Badge>
                    </>
                  )}
                />
              ))}
            </CrmList>
          </CrmSection>
        ))}

        <CrmSection
          icon={<Workflow size={20} />}
          title="Integrações"
          description="Serviços conectados que sustentam WhatsApp, automações e dados."
        >
          <CrmList>
            {resumo?.integracoes.length ? (
              resumo.integracoes.map((integracao) => (
                <CrmListItem
                  key={integracao.nome}
                  media={<Workflow size={18} />}
                  title={integracao.nome}
                  description={integracao.detalhe}
                  tone={integracao.estado === "CONFIGURADA" ? "sucesso" : integracao.estado === "PENDENTE" ? "atencao" : "neutro"}
                  actions={(
                    <Badge className="w-fit" variant={integracao.estado === "CONFIGURADA" ? "success" : integracao.estado === "PENDENTE" ? "warning" : "secondary"}>
                      {traduzirEstadoIntegracao(integracao.estado)}
                    </Badge>
                  )}
                />
              ))
            ) : (
              <EstadoVazio icone={<Workflow />} titulo="Sem integrações" detalhe="O backend ainda não retornou status." />
            )}
          </CrmList>
        </CrmSection>
      </section>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function agruparPorGrupo(configuracoes: ConfiguracaoOperacional[]) {
  return configuracoes.reduce<Record<string, ConfiguracaoOperacional[]>>((grupos, item) => {
    grupos[item.grupo] = [...(grupos[item.grupo] ?? []), item];
    return grupos;
  }, {});
}
