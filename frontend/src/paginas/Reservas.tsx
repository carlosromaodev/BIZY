import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  Search,
  Truck,
  UserRoundCheck,
  WalletCards,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi, obterUrlEventos } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import {
  CrmCommandMetric,
  CrmCommandPanel,
  CrmFilterDock,
  CrmList,
  CrmListItem,
  CrmMetricMini,
  CrmPageMotion,
  CrmSection,
  CrmStatusBadge
} from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {
  Cliente360,
  EstadoEntregaPedido,
  EstadoPagamentoPedido,
  EstadoPedido,
  Pedido,
  RespostaClientes360,
  RespostaEntregasPedidos,
  RespostaPedidos,
  RespostaPreparacaoPedidos,
  RespostaTarefasOperacionais,
  TarefaOperacional
} from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";

const estadosPedido: Array<EstadoPedido | "todos"> = [
  "todos",
  "NOVO",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_PREPARACAO",
  "PRONTO_ENTREGA",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
  "TROCADO",
  "DEVOLVIDO"
];

export function PaginaReservas() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente360[]>([]);
  const [preparacao, setPreparacao] = useState<RespostaPreparacaoPedidos>({ pedidos: [], produtos: [] });
  const [entregas, setEntregas] = useState<RespostaEntregasPedidos>({ pedidos: [] });
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<EstadoPedido | "todos">("todos");
  const [limitePedidos, setLimitePedidos] = useState(12);

  async function carregar() {
    try {
      const [respostaPedidos, respostaClientes, respostaPreparacao, respostaEntregas, respostaTarefas] = await Promise.allSettled([
        requisitarApi<RespostaPedidos>("/pedidos?limite=200"),
        requisitarApi<RespostaClientes360>("/clientes?limite=500"),
        requisitarApi<RespostaPreparacaoPedidos>("/pedidos/preparacao"),
        requisitarApi<RespostaEntregasPedidos>("/pedidos/entregas?limite=100"),
        requisitarApi<RespostaTarefasOperacionais>("/tarefas?limite=30")
      ]);

      if (respostaPedidos.status === "fulfilled") setPedidos(respostaPedidos.value.pedidos ?? []);
      if (respostaClientes.status === "fulfilled") setClientes(respostaClientes.value.clientes ?? []);
      if (respostaPreparacao.status === "fulfilled") setPreparacao(respostaPreparacao.value);
      if (respostaEntregas.status === "fulfilled") setEntregas(respostaEntregas.value);
      if (respostaTarefas.status === "fulfilled") setTarefas(respostaTarefas.value.tarefas ?? []);

      const falhas = [respostaPedidos, respostaClientes, respostaPreparacao, respostaEntregas, respostaTarefas].filter((resultado) => resultado.status === "rejected");
      setMensagem(falhas.length ? "Alguns módulos do backend ainda não responderam; a tela mostra os dados disponíveis." : "");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar pedidos.");
    }
  }

  useEffect(() => {
    void carregar();
    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregar();
    [
      "ORDER_CREATED",
      "ORDER_PAYMENT_CONFIRMED",
      "ORDER_READY_TO_SHIP",
      "ORDER_DELIVERED",
      "ORDER_CANCELLED",
      "PAYMENT_CONFIRMED",
      "RESERVATION_CREATED"
    ].forEach((e) => eventos.addEventListener(e, atualizar));
    return () => eventos.close();
  }, []);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A processar...");
    try {
      await acao();
      await carregar();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro.");
    } finally {
      setCarregando(false);
    }
  }

  const clientesPorId = useMemo(() => new Map(clientes.map((cliente) => [cliente.id, cliente])), [clientes]);
  const aguardandoPagamento = pedidos.filter((pedido) => pedido.estadoPagamento === "PENDENTE" || pedido.estado === "AGUARDANDO_PAGAMENTO");
  const pagos = pedidos.filter((pedido) => pedido.estadoPagamento === "CONFIRMADO" || ["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(pedido.estado));
  const receitaConfirmada = pagos.reduce((total, pedido) => total + pedido.totalEmKwanza, 0);
  const tarefasPedidos = tarefas.filter((tarefa) => tarefa.pedidoId || tarefa.tipo.includes("PEDIDO") || tarefa.tipo === "COBRANCA");
  const pedidosNovos = pedidos.filter((pedido) => pedido.estado === "NOVO");
  const emPreparacao = pedidos.filter((pedido) => pedido.estado === "EM_PREPARACAO");
  const prontosEntrega = pedidos.filter((pedido) => pedido.estado === "PRONTO_ENTREGA" || pedido.estadoEntrega === "PRONTO");
  const entregues = pedidos.filter((pedido) => pedido.estado === "ENTREGUE" || pedido.estadoEntrega === "ENTREGUE");
  const pedidosComProblema = pedidos.filter((pedido) =>
    ["CANCELADO", "DEVOLVIDO", "TROCADO"].includes(pedido.estado) ||
    ["FALHOU", "DEVOLVIDO"].includes(pedido.estadoEntrega) ||
    pedido.estadoPagamento === "REJEITADO"
  );
  const valorEmAberto = aguardandoPagamento.reduce((total, pedido) => total + pedido.totalEmKwanza, 0);
  const taxaConclusao = pedidos.length ? Math.round((entregues.length / pedidos.length) * 100) : 0;
  const etapasPipeline: Array<{
    detalhe: string;
    estado: EstadoPedido | "todos";
    id: string;
    quantidade: number;
    titulo: string;
    tom: "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info";
  }> = [
    { detalhe: "acabaram de entrar", estado: "NOVO", id: "novo", quantidade: pedidosNovos.length, titulo: "Novo", tom: pedidosNovos.length ? "principal" : "neutro" },
    { detalhe: "precisam de cobrança", estado: "AGUARDANDO_PAGAMENTO", id: "cobranca", quantidade: aguardandoPagamento.length, titulo: "A cobrar", tom: aguardandoPagamento.length ? "atencao" : "sucesso" },
    { detalhe: "pagamento confirmado", estado: "PAGO", id: "pago", quantidade: pagos.filter((pedido) => pedido.estado === "PAGO").length, titulo: "Pago", tom: "sucesso" },
    { detalhe: "separação em curso", estado: "EM_PREPARACAO", id: "preparacao", quantidade: emPreparacao.length, titulo: "Preparação", tom: emPreparacao.length ? "principal" : "neutro" },
    { detalhe: "aguarda logística", estado: "PRONTO_ENTREGA", id: "entrega", quantidade: prontosEntrega.length, titulo: "Entrega", tom: prontosEntrega.length ? "atencao" : "neutro" },
    { detalhe: "cancelado, falha ou troca", estado: "todos", id: "risco", quantidade: pedidosComProblema.length, titulo: "Problema", tom: pedidosComProblema.length ? "perigo" : "sucesso" }
  ];

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtro !== "todos" && pedido.estado !== filtro) return false;
    const cliente = clientesPorId.get(pedido.clienteNegocioId);
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      String(pedido.numero).includes(termo) ||
      pedido.itens.some((item) => item.codigoPeca.toLowerCase().includes(termo) || item.nomeProduto.toLowerCase().includes(termo)) ||
      cliente?.nome?.toLowerCase().includes(termo) ||
      cliente?.telefone?.includes(termo) ||
      pedido.estado.toLowerCase().includes(termo)
    );
  });
  const reservasVisiveis = pedidosFiltrados.slice(0, limitePedidos);
  const existemMaisReservas = reservasVisiveis.length < pedidosFiltrados.length;

  useEffect(() => {
    setLimitePedidos(12);
  }, [busca, filtro]);

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Gestão de pedidos" titulo="Pedidos">
        <Button
          variant="outline"
          size="lg"
          onClick={() => void carregar()}
          disabled={carregando}
        >
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo dos pedidos"
        itens={[
          { icone: <ReceiptText />, titulo: "Pedidos", valor: pedidos.length, detalhe: "pedidos completos", tom: "principal" },
          { icone: <WalletCards />, titulo: "A cobrar", valor: aguardandoPagamento.length, detalhe: "pagamento pendente", tom: aguardandoPagamento.length ? "atencao" : "neutro" },
          { icone: <UserRoundCheck />, titulo: "Receita", valor: formatarKwanza(receitaConfirmada), detalhe: "pagamentos confirmados", tom: "sucesso" },
          { icone: <Truck />, titulo: "Entregas", valor: entregas.pedidos.length, detalhe: "em aberto" }
        ]}
      />

      <CrmCommandPanel
        eyebrow="Pipeline operacional"
        title="Cada pedido precisa ter dono, estado e próxima ação"
        description="A visão principal agora é de funil: novo pedido, cobrança, pagamento, preparação, entrega e problemas que bloqueiam receita."
        actions={(
          <>
            <CrmStatusBadge tone={aguardandoPagamento.length ? "atencao" : "sucesso"}>
              {formatarKwanza(valorEmAberto)} por cobrar
            </CrmStatusBadge>
            <Button
              variant="outline"
              size="lg"
              onClick={() => void executar(() => requisitarApi("/pedidos/recuperar-parados", {
                method: "POST",
                body: { idadeMinutos: 30, prioridade: "ALTA", estadoPagamento: "PENDENTE", limite: 100 }
              }), "Recuperação criada para pedidos parados.")}
              disabled={carregando}
            >
              <Wrench size={18} />
              Recuperar parados
            </Button>
          </>
        )}
      >
        <div className="command-metrics-grid">
          <CrmCommandMetric
            detail={`${pedidos.length} pedidos acompanhados no CRM`}
            icon={<ReceiptText size={18} />}
            label="Taxa de conclusão"
            tone={taxaConclusao >= 60 ? "sucesso" : pedidos.length ? "atencao" : "neutro"}
            value={`${taxaConclusao}%`}
          />
          <CrmCommandMetric
            detail={`${aguardandoPagamento.length} pedidos com pagamento pendente`}
            icon={<WalletCards size={18} />}
            label="Receita aberta"
            tone={aguardandoPagamento.length ? "atencao" : "sucesso"}
            value={formatarKwanza(valorEmAberto)}
          />
          <CrmCommandMetric
            detail={`${preparacao.produtos.length} produtos para separar`}
            icon={<PackageCheck size={18} />}
            label="Preparação"
            tone={preparacao.produtos.length ? "principal" : "neutro"}
            value={preparacao.pedidos.length}
          />
          <CrmCommandMetric
            detail={`${tarefasPedidos.length} tarefas de cobrança, entrega ou recuperação`}
            icon={<AlertCircle size={18} />}
            label="Risco operacional"
            tone={pedidosComProblema.length || tarefasPedidos.length ? "atencao" : "sucesso"}
            value={pedidosComProblema.length + tarefasPedidos.length}
          />
        </div>
        <div className="order-pipeline-board" aria-label="Etapas do pipeline de pedidos">
          {etapasPipeline.map((etapa) => (
            <Button
              key={etapa.id}
              type="button"
              variant="outline"
              className="order-stage-card flex-col items-start gap-2 px-3 py-3"
              data-active={filtro === etapa.estado ? "true" : "false"}
              onClick={() => setFiltro(etapa.estado)}
            >
              <span className="text-xs font-semibold uppercase">{etapa.titulo}</span>
              <strong>{etapa.quantidade}</strong>
              <small>{etapa.detalhe}</small>
            </Button>
          ))}
        </div>
      </CrmCommandPanel>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <CrmSection
          className="lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          icon={<ReceiptText size={20} />}
          title="Funil de pedidos"
          description="Pedidos completos do backend: carrinho, pagamento, preparação, entrega e recuperação."
          actions={(
            <Button variant="outline" size="icon-lg" onClick={() => void carregar()} title="Atualizar" aria-label="Atualizar pedidos">
              <RefreshCcw size={18} />
            </Button>
          )}
        >
          <CrmFilterDock className="lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input aria-label="Buscar pedidos" className="market-input pl-9" style={{ paddingLeft: "2.25rem" }} placeholder="Buscar por cliente, telefone ou produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <Select value={filtro} onValueChange={(estado) => setFiltro(estado as typeof filtro)}>
              <SelectTrigger aria-label="Filtrar pedidos por estado">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                {estadosPedido.map((estado) => (
                  <SelectItem key={estado} value={estado}>{estado === "todos" ? "Todos os estados" : traduzirEstadoPedido(estado)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon-lg" onClick={() => void carregar()} title="Atualizar" aria-label="Atualizar pedidos">
              <RefreshCcw size={18} />
            </Button>
          </CrmFilterDock>

          <CrmList className="reservas-commerce-list">
            {reservasVisiveis.length ? (
              reservasVisiveis.map((pedido) => {
                const cliente = clientesPorId.get(pedido.clienteNegocioId);
                const primeiroItem = pedido.itens[0];

                return (
                  <CrmListItem
                    key={pedido.id}
                    className={pedido.estado === "AGUARDANDO_PAGAMENTO" ? "border-warning/35 bg-warning/5" : undefined}
                    media={<ReceiptText className="size-5" />}
                    title={`Pedido #${pedido.numero}`}
                    description={`${cliente?.nome ?? cliente?.telefone ?? "Cliente"} · ${primeiroItem?.nomeProduto ?? "sem itens"}`}
                    tone={pedido.estadoPagamento === "CONFIRMADO" ? "sucesso" : pedido.estado === "AGUARDANDO_PAGAMENTO" ? "atencao" : "principal"}
                    meta={formatarKwanza(pedido.totalEmKwanza)}
                    badges={(
                      <>
                        <Badge variant={obterVariantePedido(pedido.estado)}>{traduzirEstadoPedido(pedido.estado)}</Badge>
                        <Badge variant={obterVariantePagamentoPedido(pedido.estadoPagamento)}>{traduzirPagamentoPedido(pedido.estadoPagamento)}</Badge>
                        <Badge variant="outline">{traduzirEntregaPedido(pedido.estadoEntrega)}</Badge>
                        {pedido.canal && <Badge variant="secondary">{pedido.canal}</Badge>}
                      </>
                    )}
                    actions={(
                      <>
                        <Button
                          variant="success"
                          size="icon-lg"
                          title="Confirmar pagamento"
                          onClick={() => void executar(
                            () => requisitarApi(`/pedidos/${pedido.id}/confirmar-pagamento`, { method: "POST", body: { observacao: "Confirmado no CRM Bizy." } }),
                            "Pagamento confirmado."
                          )}
                          disabled={carregando || pedido.estadoPagamento === "CONFIRMADO"}
                        >
                          <CheckCircle2 size={18} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-lg"
                          title="Mover para preparação"
                          onClick={() => void executar(
                            () => requisitarApi(`/pedidos/${pedido.id}/estado`, { method: "PATCH", body: { estado: "EM_PREPARACAO", observacao: "Separação iniciada no CRM." } }),
                            "Pedido movido para preparação."
                          )}
                          disabled={carregando || ["CANCELADO", "ENTREGUE", "DEVOLVIDO"].includes(pedido.estado)}
                        >
                          <PackageCheck size={18} />
                        </Button>
                      </>
                    )}
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      <CrmMetricMini label="itens" value={pedido.itens.reduce((total, item) => total + item.quantidade, 0)} />
                      <CrmMetricMini label="desconto" value={formatarKwanza(pedido.descontoEmKwanza)} tone={pedido.descontoEmKwanza ? "atencao" : "neutro"} />
                      <CrmMetricMini label="criado em" value={formatarDataHoraCurta(pedido.criadoEm)} />
                    </div>
                  </CrmListItem>
                );
              })
            ) : (
              <EstadoVazio icone={<ReceiptText />} titulo="Sem pedidos completos" detalhe="Crie pedidos pela conversa, loja pública ou checkout para acompanhar o funil real." />
            )}
          </CrmList>
          {existemMaisReservas && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setLimitePedidos((limiteAtual) => limiteAtual + 12)}
            >
              Ver mais pedidos
            </Button>
          )}
        </CrmSection>

        <div className="grid gap-4">
          <CrmSection
            icon={<ClipboardList size={20} />}
            title="Preparação"
            description="Lista de separação gerada por `/pedidos/preparacao`."
          >
            <CrmList>
              {preparacao.produtos.length ? (
                preparacao.produtos.slice(0, 5).map((produto) => (
                  <CrmListItem
                    key={produto.codigoPeca}
                    media={<PackageCheck size={18} />}
                    title={`#${produto.codigoPeca} ${produto.nomeProduto}`}
                    description={`Pedidos ${produto.pedidos.join(", ")}`}
                    tone="sucesso"
                    meta={`${produto.quantidade} un.`}
                  />
                ))
              ) : (
                <EstadoVazio icone={<ClipboardList />} titulo="Nada para separar" detalhe="Pedidos pagos aparecem aqui para preparar a entrega." />
              )}
            </CrmList>
          </CrmSection>

          <CrmSection
            icon={<Truck size={20} />}
            title="Entregas"
            description="Pedidos com entrega pendente, responsável e endereço."
          >
            <CrmList>
              {entregas.pedidos.length ? (
                entregas.pedidos.slice(0, 5).map((pedido) => (
                  <CrmListItem
                    key={pedido.id}
                    media={<Truck size={18} />}
                    title={`Entrega #${pedido.numero}`}
                    description={pedido.enderecoEntrega ?? "Endereço ainda não informado"}
                    tone={pedido.estadoEntrega === "FALHOU" ? "perigo" : "atencao"}
                    meta={formatarKwanza(pedido.totalEmKwanza)}
                    actions={(
                      <Button
                        variant="outline"
                        size="icon-lg"
                        title="Marcar como enviado"
                        onClick={() => void executar(
                          () => requisitarApi(`/pedidos/${pedido.id}/entrega`, { method: "PATCH", body: { estadoEntrega: "ENVIADO", observacao: "Saiu para entrega." } }),
                          "Entrega atualizada."
                        )}
                        disabled={carregando}
                      >
                        <Truck size={18} />
                      </Button>
                    )}
                  />
                ))
              ) : (
                <EstadoVazio icone={<Truck />} titulo="Sem entregas abertas" detalhe="Quando o pedido for pago, a operação de entrega aparece aqui." />
              )}
            </CrmList>
          </CrmSection>

          <CrmSection
            icon={<AlertCircle size={20} />}
            title="Recuperação"
            description="Tarefas criadas para cobrança, entrega e pedidos parados."
          >
            <CrmList>
              {tarefasPedidos.length ? (
                tarefasPedidos.slice(0, 5).map((tarefa) => (
                  <CrmListItem
                    key={tarefa.id}
                    media={<AlertCircle size={18} />}
                    title={tarefa.titulo}
                    description={tarefa.descricao}
                    tone={tarefa.prioridade === "URGENTE" || tarefa.prioridade === "ALTA" ? "atencao" : "principal"}
                    badges={<Badge variant={tarefa.estado === "ABERTA" ? "warning" : "secondary"}>{tarefa.estado}</Badge>}
                    meta={tarefa.prazoEm ? formatarDataHoraCurta(tarefa.prazoEm) : "Sem prazo"}
                  />
                ))
              ) : (
                <EstadoVazio icone={<AlertCircle />} titulo="Sem tarefas de recuperação" detalhe="Use Recuperar parados para criar ações humanas de cobrança e entrega." />
              )}
            </CrmList>
          </CrmSection>
        </div>
      </section>

      {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function traduzirEstadoPedido(estado: EstadoPedido): string {
  const traducoes: Record<EstadoPedido, string> = {
    NOVO: "Novo",
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    PAGO: "Pago",
    EM_PREPARACAO: "Em preparação",
    PRONTO_ENTREGA: "Pronto para entrega",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
    TROCADO: "Trocado",
    DEVOLVIDO: "Devolvido"
  };
  return traducoes[estado];
}

function traduzirPagamentoPedido(estado: EstadoPagamentoPedido): string {
  const traducoes: Record<EstadoPagamentoPedido, string> = {
    PENDENTE: "Pendente",
    COMPROVATIVO_RECEBIDO: "Comprovativo",
    CONFIRMADO: "Confirmado",
    REJEITADO: "Rejeitado",
    REEMBOLSADO: "Reembolsado"
  };
  return traducoes[estado];
}

function traduzirEntregaPedido(estado: EstadoEntregaPedido): string {
  const traducoes: Record<EstadoEntregaPedido, string> = {
    PENDENTE: "Entrega pendente",
    RETIRADA_LOJA: "Retirada",
    EM_PREPARACAO: "A preparar",
    PRONTO: "Pronto",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    FALHOU: "Falhou",
    DEVOLVIDO: "Devolvido"
  };
  return traducoes[estado];
}

function obterVariantePedido(estado: EstadoPedido): "success" | "warning" | "info" | "destructive" | "secondary" {
  if (["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(estado)) return "success";
  if (estado === "AGUARDANDO_PAGAMENTO" || estado === "NOVO") return "warning";
  if (estado === "TROCADO") return "info";
  if (estado === "CANCELADO" || estado === "DEVOLVIDO") return "destructive";
  return "secondary";
}

function obterVariantePagamentoPedido(estado: EstadoPagamentoPedido): "success" | "warning" | "info" | "destructive" | "secondary" {
  if (estado === "CONFIRMADO") return "success";
  if (estado === "PENDENTE" || estado === "COMPROVATIVO_RECEBIDO") return "warning";
  if (estado === "REEMBOLSADO") return "info";
  if (estado === "REJEITADO") return "destructive";
  return "secondary";
}
