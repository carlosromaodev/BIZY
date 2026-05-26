import {
  Activity,
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  MessageCircle,
  MessageSquareText,
  PackageSearch,
  Radio,
  Send,
  Signal,
  Square,
  Truck,
  UserRoundCheck,
  WalletCards,
  Zap
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { requisitarApi, obterUrlEventos } from "../api";
import { CabecalhoPagina, ResumoIndicadores } from "../componentes/Shell";
import {
  CrmCommandMetric,
  CrmCommandPanel,
  CrmList,
  CrmListItem,
  CrmMetricMini,
  CrmPageMotion,
  CrmSection,
  CrmStatusBadge
} from "../componentes/CrmInterno21st";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { type RespostaConversas, type ResumoPainel, resumoInicial, estadosReservaAtiva } from "../tipos";
import { formatarDataCurta, formatarKwanza, formatarTempoRestante, obterPrecoDaPeca } from "../utilidades";

function obterUsernameTikTokPadrao() {
  const configurado = import.meta.env.VITE_TIKTOK_LIVE_USERNAME_PADRAO?.trim();
  const username = configurado && configurado.length > 0 ? configurado : "@loja_teste";
  return username.startsWith("@") ? username : `@${username}`;
}

interface TarefaPainel {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
  estado: "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  prazoEm: string | null;
}

interface RespostaTarefasPainel {
  tarefas: TarefaPainel[];
}

interface PrioridadePainel {
  acao: string;
  detalhe: string;
  descricao: string;
  icone: ReactNode;
  id: string;
  rota: string;
  titulo: string;
  tom: "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info";
  valor: ReactNode;
}

function dataEhHoje(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const data = new Date(valor);
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

function tarefaEstaAtrasada(tarefa: TarefaPainel): boolean {
  if (!tarefa.prazoEm || !["ABERTA", "EM_ANDAMENTO"].includes(tarefa.estado)) return false;
  return Number(new Date(tarefa.prazoEm)) < Date.now();
}

export function PaginaPainel() {
  const [resumo, setResumo] = useState<ResumoPainel>(resumoInicial);
  const [mensagem, setMensagem] = useState("Painel pronto.");
  const [carregando, setCarregando] = useState(false);
  const [liveUsername, setLiveUsername] = useState(obterUsernameTikTokPadrao);
  const [providerLive, setProviderLive] = useState("manual");
  const [comentarioManual, setComentarioManual] = useState("eu quero 923456789 peça 4");
  const [conversas, setConversas] = useState<RespostaConversas["conversas"]>([]);
  const [tarefas, setTarefas] = useState<TarefaPainel[]>([]);

  const reservasAtivas = useMemo(
    () => resumo.reservas.filter((r) => estadosReservaAtiva.includes(r.estado)),
    [resumo.reservas]
  );

  const receitaReservada = useMemo(
    () =>
      resumo.reservas
        .filter((r) => [...estadosReservaAtiva, "PAID"].includes(r.estado))
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas]
  );

  const receitaPaga = useMemo(
    () =>
      resumo.reservas
        .filter((r) => r.estado === "PAID")
        .reduce((t, r) => t + obterPrecoDaPeca(resumo.pecas, r.codigoPeca), 0),
    [resumo.pecas, resumo.reservas]
  );

  const filaTotal = useMemo(
    () => Object.values(resumo.filaEspera).reduce((t, q) => t + q, 0),
    [resumo.filaEspera]
  );

  const taxaConversao = resumo.comentariosRecebidos
    ? Math.round((resumo.comentariosValidos / resumo.comentariosRecebidos) * 100)
    : 0;

  const taxaPagamento = resumo.reservasCriadas
    ? Math.round((resumo.reservasPagas / resumo.reservasCriadas) * 100)
    : 0;

  const proximaExpirar = useMemo(
    () =>
      reservasAtivas
        .filter((r) => r.expiraEm)
        .sort((a, b) => Number(new Date(a.expiraEm ?? 0)) - Number(new Date(b.expiraEm ?? 0)))[0] ?? null,
    [reservasAtivas]
  );

  const pecasDisponiveis = resumo.pecas.filter((p) => p.estado === "DISPONIVEL").length;
  const aguardandoPagamento = resumo.reservas.filter((r) => r.estado === "WAITING_PAYMENT").length;
  const pedidosNovosHoje = useMemo(
    () => resumo.reservas.filter((reserva) => dataEhHoje(reserva.criadaEm)).length,
    [resumo.reservas]
  );
  const conversasSemResposta = useMemo(
    () =>
      conversas.filter((conversa) =>
        conversa.mensagensNaoLidas > 0 ||
        ["NOVA", "ABERTA", "AGUARDANDO_HUMANO"].includes(conversa.estadoCrm)
      ).length,
    [conversas]
  );
  const produtosStockBaixo = useMemo(
    () => resumo.pecas.filter((peca) => peca.estado !== "VENDIDA" && peca.quantidade <= 2).length,
    [resumo.pecas]
  );
  const entregasPendentes = useMemo(
    () => resumo.reservas.filter((reserva) => reserva.estado === "PAID").length,
    [resumo.reservas]
  );
  const faturacaoDia = useMemo(
    () =>
      resumo.reservas
        .filter((reserva) => reserva.estado === "PAID" && dataEhHoje(reserva.criadaEm))
        .reduce((total, reserva) => total + obterPrecoDaPeca(resumo.pecas, reserva.codigoPeca), 0),
    [resumo.pecas, resumo.reservas]
  );
  const tarefasAtrasadas = useMemo(
    () => tarefas.filter(tarefaEstaAtrasada).length,
    [tarefas]
  );
  const liveAtual = useMemo(
    () => resumo.lives.find((live) => live.status !== "ENCERRADA") ?? null,
    [resumo.lives]
  );
  const rotuloEstadoLive = liveAtual
    ? liveAtual.status === "ERRO"
      ? "Com alerta"
      : liveAtual.status === "CONECTANDO"
        ? "A ligar"
        : "Ativa"
    : "Inativa";

  const prioridadesOperacionais: PrioridadePainel[] = [
    {
      acao: "Cobrar",
      detalhe: `${taxaPagamento}% liquidação`,
      descricao: aguardandoPagamento
        ? "Clientes com intenção real precisam receber cobrança, prova social ou alternativa de pagamento."
        : "Não há cobrança pendente agora. Mantém o acompanhamento para não perder pedidos novos.",
      icone: <WalletCards size={18} />,
      id: "pagamentos",
      rota: "/app/pedidos",
      titulo: "Pagamentos por fechar",
      tom: aguardandoPagamento ? "atencao" : "sucesso",
      valor: aguardandoPagamento
    },
    {
      acao: "Atender",
      detalhe: "WhatsApp e comentários",
      descricao: conversasSemResposta
        ? "Há conversas abertas que podem virar venda, suporte ou pedido de entrega."
        : "Caixa de entrada sem pressão. Bom momento para campanhas de recompra.",
      icone: <MessageCircle size={18} />,
      id: "conversas",
      rota: "/app/conversas",
      titulo: "Conversas sem resposta",
      tom: conversasSemResposta ? "principal" : "sucesso",
      valor: conversasSemResposta
    },
    {
      acao: "Repor",
      detalhe: "quantidade menor ou igual a 2",
      descricao: produtosStockBaixo
        ? "Produtos com baixa disponibilidade podem quebrar campanhas e lives em andamento."
        : "Stock saudável para continuar a vender nos canais digitais.",
      icone: <PackageSearch size={18} />,
      id: "stock",
      rota: "/app/produtos",
      titulo: "Stock em risco",
      tom: produtosStockBaixo ? "perigo" : "sucesso",
      valor: produtosStockBaixo
    },
    {
      acao: "Organizar",
      detalhe: "entrega e tarefas",
      descricao: tarefasAtrasadas || entregasPendentes
        ? "Existem ações pós-venda que precisam de dono, prazo e resolução."
        : "Operação pós-venda controlada. Mantém o SLA visível para a equipa.",
      icone: <Truck size={18} />,
      id: "pos-venda",
      rota: "/app/operacao",
      titulo: "Pós-venda em aberto",
      tom: tarefasAtrasadas ? "perigo" : entregasPendentes ? "atencao" : "sucesso",
      valor: tarefasAtrasadas + entregasPendentes
    }
  ];

  async function carregarResumo() {
    const [respostaResumo, respostaConversas, respostaTarefas] = await Promise.allSettled([
      requisitarApi<ResumoPainel>("/painel/resumo"),
      requisitarApi<RespostaConversas>("/atendimento/conversas"),
      requisitarApi<RespostaTarefasPainel>("/tarefas?estado=ABERTA&limite=8")
    ]);

    if (respostaResumo.status === "rejected") throw respostaResumo.reason;

    setResumo(respostaResumo.value);
    setConversas(respostaConversas.status === "fulfilled" ? respostaConversas.value.conversas : []);
    setTarefas(respostaTarefas.status === "fulfilled" ? respostaTarefas.value.tarefas : []);
  }

  useEffect(() => {
    void carregarResumo().catch(() => setMensagem("Backend ainda não respondeu."));

    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregarResumo().catch(() => undefined);

    [
      "LIVE_CONNECTED", "LIVE_DISCONNECTED", "COMMENT_RECEIVED", "COMMENT_PARSED",
      "RESERVATION_CREATED", "RESERVATION_EXPIRING", "RESERVATION_WAITLISTED",
      "PAYMENT_CONFIRMED", "RESERVATION_EXPIRED", "STOCK_UPDATED",
      "WHATSAPP_MESSAGE_SENT"
    ].forEach((e) => eventos.addEventListener(e, atualizar));

    const intervalo = window.setInterval(atualizar, 15_000);
    return () => { eventos.close(); window.clearInterval(intervalo); };
  }, []);

  async function enviar(evento: FormEvent, acao: () => Promise<unknown>, sucesso: string) {
    evento.preventDefault();
    await executarAcao(acao, sucesso);
  }

  async function executarAcao(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A processar...");
    try {
      await acao();
      await carregarResumo();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  async function encerrarLive() {
    if (!liveAtual) return;

    await executarAcao(
      () => requisitarApi(`/lives/${encodeURIComponent(liveAtual.id)}/parar`, { method: "POST" }),
      "Live encerrada."
    );
  }

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Operação comercial" titulo="Painel">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
            <Radio className={liveAtual && liveAtual.status !== "ERRO" ? "text-success" : "text-muted-foreground"} size={18} />
            <div>
              <span className="block text-muted-foreground">{liveAtual ? `${liveAtual.providerNome} · ${liveAtual.username}` : "Estado da live"}</span>
              <strong className="block leading-tight">{rotuloEstadoLive}</strong>
            </div>
          </div>
          {liveAtual && (
            <Button type="button" variant="destructive" size="sm" onClick={() => void encerrarLive()} disabled={carregando}>
              <Square size={15} />
              Encerrar
            </Button>
          )}
        </div>
      </CabecalhoPagina>

      <CrmCommandPanel
        eyebrow="Centro de comando"
        title="O que precisa de atenção agora"
        description="Um resumo operacional para decidir onde a equipa deve agir primeiro: cobrança, atendimento, stock, entrega e live."
        actions={(
          <>
            <Button asChild variant="outline" size="lg">
              <Link to="/app/pedidos">
                <ClipboardList size={18} />
                Abrir pedidos
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/app/conversas">
                <MessageCircle size={18} />
                Atender clientes
              </Link>
            </Button>
          </>
        )}
      >
        <div className="command-metrics-grid">
          <CrmCommandMetric
            detail={`${formatarKwanza(receitaPaga)} já pagos hoje e no histórico ativo`}
            icon={<CircleDollarSign size={18} />}
            label="Receita em movimento"
            tone="sucesso"
            value={formatarKwanza(receitaReservada)}
          />
          <CrmCommandMetric
            detail={`${resumo.comentariosValidos} comentários válidos de ${resumo.comentariosRecebidos}`}
            icon={<MessageSquareText size={18} />}
            label="Conversão da captação"
            tone={taxaConversao ? "principal" : "neutro"}
            value={`${taxaConversao}%`}
          />
          <CrmCommandMetric
            detail={proximaExpirar ? `Peça #${proximaExpirar.codigoPeca}` : "Sem reserva crítica"}
            icon={<Clock3 size={18} />}
            label="Próxima urgência"
            tone={proximaExpirar ? "atencao" : "sucesso"}
            value={proximaExpirar ? formatarTempoRestante(proximaExpirar.expiraEm) : "Controlado"}
          />
          <CrmCommandMetric
            detail={`${filaTotal} clientes em fila de espera`}
            icon={<Boxes size={18} />}
            label="Stock vendável"
            tone={pecasDisponiveis ? "sucesso" : "atencao"}
            value={pecasDisponiveis}
          />
        </div>
        <div className="command-progress" aria-label="Progresso de liquidação dos pedidos">
          <div className="command-progress-label">
            <span>Liquidação de pedidos</span>
            <strong>{taxaPagamento}%</strong>
          </div>
          <div className="command-progress-track">
            <span className="command-progress-bar" style={{ width: `${Math.min(taxaPagamento, 100)}%` }} />
          </div>
        </div>
      </CrmCommandPanel>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <CrmSection
          icon={<AlertTriangle size={20} />}
          title="Fila de decisão"
          description="Prioridades ordenadas para o dono da loja não perder venda por atraso operacional."
        >
          <CrmList columns="two">
            {prioridadesOperacionais.map((prioridade) => (
              <CrmListItem
                key={prioridade.id}
                media={prioridade.icone}
                title={prioridade.titulo}
                description={prioridade.descricao}
                tone={prioridade.tom}
                meta={prioridade.valor}
                badges={(
                  <>
                    <CrmStatusBadge tone={prioridade.tom}>{prioridade.detalhe}</CrmStatusBadge>
                  </>
                )}
                actions={(
                  <Button asChild variant="outline" size="sm">
                    <Link to={prioridade.rota}>{prioridade.acao}</Link>
                  </Button>
                )}
              />
            ))}
          </CrmList>
        </CrmSection>

        <CrmSection
          icon={<Activity size={20} />}
          title="Pulso comercial"
          description={`${formatarDataCurta(new Date())}: leitura rápida do negócio antes de abrir as telas profundas.`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <CrmMetricMini label="pedidos hoje" value={pedidosNovosHoje} tone={pedidosNovosHoje ? "principal" : "neutro"} />
            <CrmMetricMini label="pagamentos pendentes" value={aguardandoPagamento} tone={aguardandoPagamento ? "atencao" : "sucesso"} />
            <CrmMetricMini label="faturação do dia" value={formatarKwanza(faturacaoDia)} tone={faturacaoDia ? "sucesso" : "neutro"} />
            <CrmMetricMini label="tarefas atrasadas" value={tarefasAtrasadas} tone={tarefasAtrasadas ? "perigo" : "sucesso"} />
          </div>
        </CrmSection>
      </section>

      <ResumoIndicadores
        rotulo="Hoje na loja"
        itens={[
          {
            icone: <ClipboardList />,
            titulo: "Pedidos novos",
            valor: pedidosNovosHoje,
            detalhe: "criados hoje",
            tom: pedidosNovosHoje ? "principal" : "neutro"
          },
          {
            icone: <WalletCards />,
            titulo: "Pagamentos pendentes",
            valor: aguardandoPagamento,
            detalhe: "aguardam cobrança",
            tom: aguardandoPagamento ? "atencao" : "sucesso"
          },
          {
            icone: <MessageCircle />,
            titulo: "Conversas sem resposta",
            valor: conversasSemResposta,
            detalhe: "precisam de resposta",
            tom: conversasSemResposta ? "atencao" : "sucesso"
          },
          {
            icone: <PackageSearch />,
            titulo: "Stock baixo",
            valor: produtosStockBaixo,
            detalhe: "quantidade crítica",
            tom: produtosStockBaixo ? "perigo" : "sucesso"
          },
          {
            icone: <Truck />,
            titulo: "Entregas pendentes",
            valor: entregasPendentes,
            detalhe: "pagas e por acompanhar",
            tom: entregasPendentes ? "atencao" : "neutro"
          },
          {
            icone: <CircleDollarSign />,
            titulo: "Faturação do dia",
            valor: formatarKwanza(faturacaoDia),
            detalhe: "confirmada hoje",
            tom: faturacaoDia ? "sucesso" : "neutro"
          },
          {
            icone: <AlertTriangle />,
            titulo: "Tarefas atrasadas",
            valor: tarefasAtrasadas,
            detalhe: "com prazo vencido",
            tom: tarefasAtrasadas ? "perigo" : "sucesso"
          }
        ]}
      />

      <section className="grid painel-commerce-grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="grid gap-4 p-4">
          <form
            onSubmit={(e) => {
              const username = liveUsername.trim();
              if (!username) {
                e.preventDefault();
                setMensagem("Informe o username da live antes de iniciar.");
                return;
              }
              if (liveAtual) {
                e.preventDefault();
                setMensagem("Já existe uma live conectada. Encerre a sessão atual antes de iniciar outra.");
                return;
              }
              if (providerLive !== "manual" && !window.confirm(`Iniciar captação automática para ${username}?`)) {
                e.preventDefault();
                return;
              }
              void enviar(
                e,
                () => requisitarApi("/lives/iniciar", { method: "POST", body: { liveUsername: username, provider: providerLive } }),
                "Live conectada."
              );
            }}
            className="contents"
          >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Captação</p>
              <h2 className="text-lg font-semibold">Live de vendas</h2>
            </div>
            <Signal className="text-muted-foreground" size={20} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="liveUser">Username</label>
            <Input id="liveUser" value={liveUsername} onChange={(e) => setLiveUsername(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="provider">Método</label>
            <Select value={providerLive} onValueChange={setProviderLive}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="tiktok-live-connector">TikTok Live Connector</SelectItem>
                <SelectItem value="tiktok-live-python">TikTokLive Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" disabled={carregando || Boolean(liveAtual)}>
            <Radio size={18} />
            {liveAtual ? "Live em andamento" : "Iniciar captação"}
          </Button>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-4">
          <form
            onSubmit={(e) => {
              const endpoint = liveAtual
                ? `/lives/${encodeURIComponent(liveAtual.id)}/comentarios/manual`
                : "/comentarios/manual";
              const body = liveAtual
                ? {
                    username: "cliente_live",
                    displayName: "Cliente Live",
                    commentText: comentarioManual
                  }
                : {
                    liveId: "manual_local",
                    username: "cliente_live",
                    displayName: "Cliente Live",
                    commentText: comentarioManual
                  };

              void enviar(e, () => requisitarApi(endpoint, { method: "POST", body }), "Comentário enviado.");
            }}
            className="contents"
          >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Teste rápido</p>
              <h2 className="text-lg font-semibold">Comentário manual</h2>
            </div>
            <Zap className="text-muted-foreground" size={20} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="comManual">Texto do comentário</label>
            <Input id="comManual" value={comentarioManual} onChange={(e) => setComentarioManual(e.target.value)} />
          </div>
          <Button variant="outline" size="lg" disabled={carregando}>
            <Send size={18} />
            Enviar para parser
          </Button>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Resumo ao vivo</p>
              <h2 className="text-lg font-semibold">Atividade recente</h2>
            </div>
            <Activity className="text-muted-foreground" size={20} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Comentários</span>
              <strong className="block text-2xl">{resumo.comentariosRecebidos}</strong>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Reservas criadas</span>
              <strong className="block text-2xl">{resumo.reservasCriadas}</strong>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Reservas ativas</span>
              <strong className="block text-2xl">{reservasAtivas.length}</strong>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <span>Pagas</span>
              <strong className="block text-2xl">{resumo.reservasPagas}</strong>
            </div>
          </div>
          </CardContent>
        </Card>
      </section>

      <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>
    </CrmPageMotion>
  );
}
