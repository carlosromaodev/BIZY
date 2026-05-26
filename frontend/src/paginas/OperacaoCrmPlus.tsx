import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  GitBranch,
  Inbox,
  RefreshCcw,
  Repeat2,
  UserCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection, CrmStatusBadge } from "../componentes/CrmInterno21st";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  EtapaFunilComercial,
  MovimentoFunilComercial,
  OportunidadeRecuperacao,
  RespostaFunilMovimentos,
  RespostaOportunidadesRecuperacao,
  RespostaSocialInbox,
  RespostaTarefasOperacionais,
  SocialInboxItem,
  TarefaOperacional
} from "../tipos";
import { formatarConfianca, formatarDataHoraCurta, formatarKwanza } from "../utilidades";

interface RespostaEtapasFunil {
  etapas: EtapaFunilComercial[];
}

export function PaginaOperacaoCrmPlus() {
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [social, setSocial] = useState<SocialInboxItem[]>([]);
  const [etapas, setEtapas] = useState<EtapaFunilComercial[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoFunilComercial[]>([]);
  const [oportunidades, setOportunidades] = useState<OportunidadeRecuperacao[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaTarefas, respostaSocial, respostaEtapas, respostaMovimentos, respostaOportunidades] = await Promise.allSettled([
        requisitarApi<RespostaTarefasOperacionais>("/tarefas?limite=20"),
        requisitarApi<RespostaSocialInbox>("/social/inbox/itens?limite=20"),
        requisitarApi<RespostaEtapasFunil>("/funil/etapas"),
        requisitarApi<RespostaFunilMovimentos>("/funil/movimentos?limite=20"),
        requisitarApi<RespostaOportunidadesRecuperacao>("/recuperacao/oportunidades?limite=20")
      ]);

      setTarefas(respostaTarefas.status === "fulfilled" ? respostaTarefas.value.tarefas ?? [] : []);
      setSocial(respostaSocial.status === "fulfilled" ? respostaSocial.value.itens ?? [] : []);
      setEtapas(respostaEtapas.status === "fulfilled" ? respostaEtapas.value.etapas ?? [] : []);
      setMovimentos(respostaMovimentos.status === "fulfilled" ? respostaMovimentos.value.movimentos ?? [] : []);
      setOportunidades(respostaOportunidades.status === "fulfilled" ? respostaOportunidades.value.oportunidades ?? [] : []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar operação CRM+.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const tarefasAbertas = tarefas.filter((tarefa) => tarefa.estado === "ABERTA" || tarefa.estado === "EM_ANDAMENTO");
  const socialNovo = social.filter((item) => item.estado === "NOVO" || item.estado === "EM_ATENDIMENTO");
  const oportunidadesAbertas = oportunidades.filter((item) => item.estado === "ABERTA" || item.estado === "EM_ATENDIMENTO");
  const valorRecuperacao = oportunidadesAbertas.reduce((total, oportunidade) => total + (oportunidade.valorEstimadoEmKwanza ?? 0), 0);

  const etapasMaisRecentes = useMemo(() => {
    const contagem = new Map<EtapaFunilComercial, number>();
    movimentos.forEach((movimento) => contagem.set(movimento.etapaNova, (contagem.get(movimento.etapaNova) ?? 0) + 1));
    return Array.from(contagem.entries()).sort((a, b) => b[1] - a[1]);
  }, [movimentos]);

  async function concluirTarefa(tarefa: TarefaOperacional) {
    setMensagem("A concluir tarefa...");
    try {
      await requisitarApi(`/tarefas/${tarefa.id}`, {
        method: "PATCH",
        body: {
          estado: "CONCLUIDA",
          observacao: [tarefa.observacao, "Concluída no painel Operação CRM+."].filter(Boolean).join("\n")
        }
      });
      await carregar();
      setMensagem("Tarefa concluída.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível concluir a tarefa.");
    }
  }

  async function assumirOportunidade(oportunidade: OportunidadeRecuperacao) {
    setMensagem("A assumir oportunidade...");
    try {
      await requisitarApi(`/recuperacao/oportunidades/${oportunidade.id}`, {
        method: "PATCH",
        body: {
          estado: "EM_ATENDIMENTO",
          observacao: [oportunidade.observacao, "Assumida no painel Operação CRM+."].filter(Boolean).join("\n")
        }
      });
      await carregar();
      setMensagem("Oportunidade colocada em atendimento.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível assumir a oportunidade.");
    }
  }

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="CRM+" titulo="Operação">
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo da operação CRM+"
        itens={[
          { icone: <Clock3 />, titulo: "Tarefas", valor: tarefasAbertas.length, detalhe: "abertas ou em andamento", tom: tarefasAbertas.length ? "atencao" : "sucesso" },
          { icone: <Inbox />, titulo: "Social inbox", valor: socialNovo.length, detalhe: "comentários e mensagens novos", tom: socialNovo.length ? "principal" : "neutro" },
          { icone: <Repeat2 />, titulo: "Recuperação", valor: oportunidadesAbertas.length, detalhe: "oportunidades comerciais", tom: oportunidadesAbertas.length ? "atencao" : "neutro" },
          { icone: <Activity />, titulo: "Valor estimado", valor: formatarKwanza(valorRecuperacao), detalhe: "em recuperação", tom: valorRecuperacao ? "sucesso" : "neutro" }
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <CrmSection
          icon={<Clock3 size={20} />}
          title="Fila operacional"
          description="Tarefas geradas por pedidos parados, clientes, SLA, cobrança, social inbox e automações."
        >
          <CrmList aria-busy={carregando}>
            {tarefas.length ? tarefas.map((tarefa) => (
              <CrmListItem
                key={tarefa.id}
                media={<Clock3 size={18} />}
                title={tarefa.titulo}
                description={tarefa.descricao || tarefa.tipo}
                tone={tomPrioridade(tarefa.prioridade)}
                meta={tarefa.prazoEm ? formatarDataHoraCurta(tarefa.prazoEm) : tarefa.prioridade}
                badges={(
                  <>
                    <CrmStatusBadge tone={tomPrioridade(tarefa.prioridade)}>{traduzirPrioridade(tarefa.prioridade)}</CrmStatusBadge>
                    <CrmStatusBadge tone={tomEstadoTarefa(tarefa.estado)}>{traduzirEstadoTarefa(tarefa.estado)}</CrmStatusBadge>
                  </>
                )}
                actions={tarefa.estado !== "CONCLUIDA" ? (
                  <Button variant="outline" size="lg" onClick={() => void concluirTarefa(tarefa)}>
                    <CheckCircle2 size={16} />
                    Concluir
                  </Button>
                ) : null}
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <CrmMetricMini label="tipo" value={tarefa.tipo} />
                  <CrmMetricMini label="cliente" value={tarefa.clienteTelefone ?? "sem contacto"} />
                  <CrmMetricMini label="origem" value={tarefa.origem ?? "manual"} />
                </div>
              </CrmListItem>
            )) : (
              <EstadoVazio icone={<Clock3 />} titulo={carregando ? "A carregar tarefas" : "Sem tarefas"} detalhe="Quando pedidos, clientes ou conversas exigirem ação humana, tudo aparece nesta fila." />
            )}
          </CrmList>
        </CrmSection>

        <CrmSection
          icon={<Repeat2 size={20} />}
          title="Recuperação comercial"
          description="Oportunidades criadas por checkout abandonado, pagamento pendente, cliente inativo ou recompra."
        >
          <CrmList>
            {oportunidades.length ? oportunidades.map((oportunidade) => (
              <CrmListItem
                key={oportunidade.id}
                media={<Repeat2 size={18} />}
                title={oportunidade.gatilho}
                description={oportunidade.motivo}
                tone={oportunidade.estado === "RECUPERADA" ? "sucesso" : oportunidade.estado === "PERDIDA" ? "perigo" : "atencao"}
                meta={oportunidade.valorEstimadoEmKwanza ? formatarKwanza(oportunidade.valorEstimadoEmKwanza) : "Sem valor"}
                badges={<CrmStatusBadge tone={oportunidade.estado === "RECUPERADA" ? "sucesso" : "atencao"}>{oportunidade.estado}</CrmStatusBadge>}
                actions={oportunidade.estado === "ABERTA" ? (
                  <Button size="lg" onClick={() => void assumirOportunidade(oportunidade)}>
                    <UserCheck size={16} />
                    Assumir
                  </Button>
                ) : null}
              />
            )) : (
              <EstadoVazio icone={<Repeat2 />} titulo="Sem oportunidades" detalhe="Checkouts abandonados e pedidos parados vão alimentar esta área." />
            )}
          </CrmList>
        </CrmSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CrmSection
          icon={<Inbox size={20} />}
          title="Social inbox"
          description="Comentários e mensagens de redes sociais prontos para análise comercial e criação de clientes."
        >
          <CrmList>
            {social.length ? social.map((item) => (
              <CrmListItem
                key={item.id}
                media={(
                  <Avatar className="h-9 w-9 border-0">
                    {item.autorAvatarUrl && <AvatarImage src={item.autorAvatarUrl} alt={item.autorNome ?? item.autorUsername ?? "Perfil"} />}
                    <AvatarFallback>{(item.autorNome ?? item.autorUsername ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                title={item.autorNome || item.autorUsername || item.autorId || "Perfil social"}
                description={item.texto}
                tone={item.intencao === "COMPRA" ? "sucesso" : item.intencao === "RECLAMACAO" ? "perigo" : "info"}
                meta={formatarDataHoraCurta(item.criadoEm)}
                badges={(
                  <>
                    <CrmStatusBadge tone={item.intencao === "COMPRA" ? "sucesso" : "info"}>{item.intencao}</CrmStatusBadge>
                    <CrmStatusBadge tone="principal">{formatarConfianca(item.confianca)}</CrmStatusBadge>
                  </>
                )}
              />
            )) : (
              <EstadoVazio icone={<Inbox />} titulo="Sem itens sociais" detalhe="Comentários de fotos, vídeos e lives entram aqui para virar cliente, pedido ou tarefa." />
            )}
          </CrmList>
        </CrmSection>

        <CrmSection
          icon={<GitBranch size={20} />}
          title="Funil comercial"
          description="Movimentos entre visita, produto visto, WhatsApp, checkout, pedido, pagamento, entrega e recompra."
        >
          <CrmList columns="two">
            {etapasMaisRecentes.length ? etapasMaisRecentes.map(([etapa, total]) => (
              <CrmListItem
                key={etapa}
                media={<GitBranch size={18} />}
                title={traduzirEtapa(etapa)}
                description="Movimentos recentes nesta etapa."
                tone="principal"
                meta={total}
              />
            )) : etapas.length ? etapas.slice(0, 8).map((etapa) => (
              <CrmListItem
                key={etapa}
                media={<GitBranch size={18} />}
                title={traduzirEtapa(etapa)}
                description="Etapa disponível no funil do backend."
                tone="neutro"
              />
            )) : (
              <EstadoVazio icone={<GitBranch />} titulo="Funil sem movimentos" detalhe="Tracking, loja pública, WhatsApp e pedidos vão preencher este fluxo." />
            )}
          </CrmList>
        </CrmSection>
      </div>

      {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function traduzirPrioridade(prioridade: TarefaOperacional["prioridade"]) {
  const mapa = { BAIXA: "Baixa", NORMAL: "Normal", ALTA: "Alta", URGENTE: "Urgente" };
  return mapa[prioridade];
}

function tomPrioridade(prioridade: TarefaOperacional["prioridade"]): "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info" {
  if (prioridade === "URGENTE") return "perigo";
  if (prioridade === "ALTA") return "atencao";
  if (prioridade === "NORMAL") return "principal";
  return "neutro";
}

function traduzirEstadoTarefa(estado: TarefaOperacional["estado"]) {
  const mapa = { ABERTA: "Aberta", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada" };
  return mapa[estado];
}

function tomEstadoTarefa(estado: TarefaOperacional["estado"]): "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info" {
  if (estado === "CONCLUIDA") return "sucesso";
  if (estado === "EM_ANDAMENTO") return "principal";
  if (estado === "CANCELADA") return "perigo";
  return "atencao";
}

function traduzirEtapa(etapa: EtapaFunilComercial) {
  return etapa
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra: string) => letra.toUpperCase());
}
