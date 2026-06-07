import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Coins,
  Clock,
  MessageSquare,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCcw,
  ShoppingBag,
  Truck,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { criarFonteEventosAutenticada, requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
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
  TarefaOperacional,
} from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  TabsBizy,
  ToolbarBizy,
  TableCard,
  Table,
  TableHead,
  Th,
  Td,
  StatusBadge,
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  IconButton,
  BotaoBizy,
  PillBizy,
  PanelCard,
  Money,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";

/* ── Constants ──────────────────────────────────────────────────── */

const estadosPedido: Array<{ id: string; rotulo: string }> = [
  { id: "todos", rotulo: "Todos os estados" },
  { id: "NOVO", rotulo: "Novo" },
  { id: "AGUARDANDO_PAGAMENTO", rotulo: "Aguardando pagamento" },
  { id: "PAGO", rotulo: "Pago" },
  { id: "EM_PREPARACAO", rotulo: "Em preparação" },
  { id: "PRONTO_ENTREGA", rotulo: "Pronto para entrega" },
  { id: "ENVIADO", rotulo: "Enviado" },
  { id: "ENTREGUE", rotulo: "Entregue" },
  { id: "CANCELADO", rotulo: "Cancelado" },
  { id: "TROCADO", rotulo: "Trocado" },
  { id: "DEVOLVIDO", rotulo: "Devolvido" },
];

function criarUrlConversaCliente(cliente: Cliente360 | undefined, pedido: Pedido): string {
  const params = new URLSearchParams();
  params.set("clienteId", pedido.clienteNegocioId);
  params.set("pedidoId", pedido.id);
  if (cliente?.telefone) params.set("telefone", cliente.telefone);
  return `/app/conversas?${params.toString()}`;
}

/* ── Component ──────────────────────────────────────────────────── */

export function PaginaReservas() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente360[]>([]);
  const [preparacao, setPreparacao] = useState<RespostaPreparacaoPedidos>({ pedidos: [], produtos: [] });
  const [entregas, setEntregas] = useState<RespostaEntregasPedidos>({ pedidos: [] });
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [limitePedidos, setLimitePedidos] = useState(12);
  const [aba, setAba] = useState("pipeline");

  /* ── Data fetching ─────────────────────────────────────────── */

  async function carregar() {
    try {
      const [respostaPedidos, respostaClientes, respostaPreparacao, respostaEntregas, respostaTarefas] =
        await Promise.allSettled([
          requisitarApi<RespostaPedidos>("/pedidos?limite=200"),
          requisitarApi<RespostaClientes360>("/clientes?limite=500"),
          requisitarApi<RespostaPreparacaoPedidos>("/pedidos/preparacao"),
          requisitarApi<RespostaEntregasPedidos>("/pedidos/entregas?limite=100"),
          requisitarApi<RespostaTarefasOperacionais>("/tarefas?limite=30"),
        ]);

      if (respostaPedidos.status === "fulfilled") setPedidos(respostaPedidos.value.pedidos ?? []);
      if (respostaClientes.status === "fulfilled") setClientes(respostaClientes.value.clientes ?? []);
      if (respostaPreparacao.status === "fulfilled") setPreparacao(respostaPreparacao.value);
      if (respostaEntregas.status === "fulfilled") setEntregas(respostaEntregas.value);
      if (respostaTarefas.status === "fulfilled") setTarefas(respostaTarefas.value.tarefas ?? []);

      const falhas = [respostaPedidos, respostaClientes, respostaPreparacao, respostaEntregas, respostaTarefas].filter(
        (r) => r.status === "rejected",
      );
      setMensagem(falhas.length ? "Alguns módulos do backend ainda não responderam." : "");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar pedidos.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
    const eventos = criarFonteEventosAutenticada();
    const atualizar = () => void carregar();
    [
      "ORDER_CREATED", "ORDER_PAYMENT_CONFIRMED", "ORDER_READY_TO_SHIP",
      "ORDER_DELIVERED", "ORDER_CANCELLED", "PAYMENT_CONFIRMED", "RESERVATION_CREATED",
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

  /* ── Derived data ──────────────────────────────────────────── */

  const clientesPorId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  const aguardandoPagamento = pedidos.filter(
    (p) => p.estadoPagamento === "PENDENTE" || p.estado === "AGUARDANDO_PAGAMENTO",
  );
  const pagos = pedidos.filter(
    (p) =>
      p.estadoPagamento === "CONFIRMADO" ||
      ["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(p.estado),
  );
  const receitaConfirmada = pagos.reduce((t, p) => t + p.totalEmKwanza, 0);
  const tarefasPedidos = tarefas.filter(
    (t) => t.pedidoId || t.tipo.includes("PEDIDO") || t.tipo === "COBRANCA",
  );
  const pedidosComProblema = pedidos.filter(
    (p) =>
      ["CANCELADO", "DEVOLVIDO", "TROCADO"].includes(p.estado) ||
      ["FALHOU", "DEVOLVIDO"].includes(p.estadoEntrega) ||
      p.estadoPagamento === "REJEITADO",
  );
  const valorEmAberto = aguardandoPagamento.reduce((t, p) => t + p.totalEmKwanza, 0);
  const totalPipeline = pedidos.reduce((t, p) => t + p.totalEmKwanza, 0);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtro !== "todos" && pedido.estado !== filtro) return false;
    const cliente = clientesPorId.get(pedido.clienteNegocioId);
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      String(pedido.numero).includes(termo) ||
      pedido.itens.some(
        (item) =>
          item.codigoPeca.toLowerCase().includes(termo) ||
          item.nomeProduto.toLowerCase().includes(termo),
      ) ||
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

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      {/* ── Header ─────────────────────────────────────────────── */}
      <PageHead eyebrow="Pipeline comercial" titulo="Pedidos" tamanhoTitulo="sm">
        {aguardandoPagamento.length > 0 && (
          <PillBizy className="bz-pill-amber">
            <Clock size={15} />
            {formatarKwanza(valorEmAberto)} por cobrar
          </PillBizy>
        )}
        <BotaoBizy variante="ghost" icone={RefreshCcw} onClick={() => void carregar()}>
          Atualizar
        </BotaoBizy>
        <BotaoBizy icone={Plus}>Novo</BotaoBizy>
      </PageHead>

      {/* ── KPIs ───────────────────────────────────────────────── */}
      <KpiGrid>
        <KpiCard
          icone={Coins}
          hero
          rotulo="Receita confirmada"
          valor={formatarKwanza(receitaConfirmada)}
          deltaPositivo={pagos.length > 0}
          delta={`${pagos.length} pedidos pagos`}
          rodape={`de um pipeline de ${formatarKwanza(totalPipeline)}`}
        />
        <KpiCard
          icone={ShoppingBag}
          cor="blue"
          rotulo="No pipeline"
          valor={pedidos.length}
          delta="pedidos ativos"
        />
        <KpiCard
          icone={Clock}
          cor="amber"
          rotulo="A cobrar"
          valor={aguardandoPagamento.length}
          delta="comprovativo pendente"
          deltaPositivo={aguardandoPagamento.length > 0 ? false : undefined}
        />
        <KpiCard
          icone={CheckCircle2}
          cor={pedidosComProblema.length === 0 ? "green" : "rose"}
          rotulo="Problemas"
          valor={pedidosComProblema.length}
          delta={pedidosComProblema.length === 0 ? "tudo em ordem" : `${pedidosComProblema.length} com problema`}
          deltaPositivo={pedidosComProblema.length === 0 ? true : false}
        />
      </KpiGrid>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <TabsBizy
        tabs={[
          { id: "pipeline", rotulo: "Pipeline", contagem: pedidos.length },
          { id: "preparacao", rotulo: "Preparação", contagem: preparacao.produtos.length },
          { id: "entregas", rotulo: "Entregas", contagem: entregas.pedidos.length },
          { id: "tarefas", rotulo: "Tarefas", contagem: tarefasPedidos.length },
        ]}
        activo={aba}
        onChange={setAba}
      />

      {/* ── Pipeline Tab ─────────────────────────────────────── */}
      {aba === "pipeline" && (
        <>
          <ToolbarBizy
            placeholder="Buscar por cliente, telefone ou produto…"
            valorBusca={busca}
            onBuscaChange={setBusca}
            selectOpcoes={estadosPedido}
            selectValor={filtro}
            onSelectChange={setFiltro}
          />
          {reservasVisiveis.length ? (
            <TableCard>
              <Table>
                <thead>
                  <tr>
                    <Th>Pedido</Th>
                    <Th>Cliente</Th>
                    <Th right>Total</Th>
                    <Th>Pagamento</Th>
                    <Th>Entrega</Th>
                    <Th>Estado</Th>
                    <Th right>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {reservasVisiveis.map((pedido) => {
                    const cliente = clientesPorId.get(pedido.clienteNegocioId);
                    const nome = cliente?.nome ?? cliente?.telefone ?? "Cliente";
                    const primeiroItem = pedido.itens[0];
                    return (
                      <tr key={pedido.id}>
                        <Td className="bz-mono">#{pedido.numero}</Td>
                        <Td>
                          <div className="bz-cli">
                            <AvatarBizy
                              iniciais={obterIniciais(nome)}
                              cor={obterCorAvatar(nome)}
                              tamanho={32}
                              src={cliente?.avatarUrl}
                              alt={nome}
                            />
                            <div>
                              <div className="bz-cli-name">{nome}</div>
                              <div className="bz-cli-desc">
                                {primeiroItem?.nomeProduto ?? "sem itens"}
                                {pedido.itens.length > 1 && ` · +${pedido.itens.length - 1} item`}
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td right className="bz-money">
                          <Money valor={pedido.totalEmKwanza} />
                        </Td>
                        <Td>
                          <StatusBadge cor={corPagamento(pedido.estadoPagamento)}>
                            {traduzirPagamentoPedido(pedido.estadoPagamento)}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <StatusBadge cor={corEntrega(pedido.estadoEntrega)}>
                            {traduzirEntregaPedido(pedido.estadoEntrega)}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <StatusBadge cor={corEstado(pedido.estado)}>
                            {traduzirEstadoPedido(pedido.estado)}
                          </StatusBadge>
                        </Td>
                        <Td right>
                          <div className="bz-acts">
                            <IconButton
                              icone={CheckCircle2}
                              solid
                              titulo="Confirmar pagamento"
                              onClick={() =>
                                void executar(
                                  () =>
                                    requisitarApi(`/pedidos/${pedido.id}/confirmar-pagamento`, {
                                      method: "POST",
                                      body: { observacao: "Confirmado no CRM Bizy." },
                                    }),
                                  "Pagamento confirmado.",
                                )
                              }
                            />
                            <Link
                              to={criarUrlConversaCliente(cliente, pedido)}
                              className="bz-iconbtn"
                              title="Abrir conversa"
                              aria-label={`Abrir conversa do pedido #${pedido.numero}`}
                            >
                              <MessageSquare size={16} />
                            </Link>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableCard>
          ) : (
            <EstadoVazio
              icone={<ReceiptText />}
              titulo="Sem pedidos"
              detalhe="Crie pedidos pela conversa, loja pública ou checkout."
            />
          )}
          {existemMaisReservas && (
            <BotaoBizy variante="ghost" className="bz-btn-full" onClick={() => setLimitePedidos((l) => l + 12)}>
              Ver mais pedidos
            </BotaoBizy>
          )}
        </>
      )}

      {/* ── Preparação Tab ───────────────────────────────────── */}
      {aba === "preparacao" && (
        <PanelCard titulo="Lista de separação">
          {preparacao.produtos.length ? (
            <div className="bz-prep-list">
              {preparacao.produtos.map((produto) => (
                <div key={produto.codigoPeca} className="bz-att-row">
                  <span className="bz-att-icon chip-green">
                    <PackageCheck size={18} />
                  </span>
                  <div className="bz-att-body">
                    <div className="bz-att-title">
                      #{produto.codigoPeca} {produto.nomeProduto}
                    </div>
                    <div className="bz-att-detail">
                      Pedidos: {produto.pedidos.join(", ")}
                    </div>
                  </div>
                  <span className="bz-att-value">{produto.quantidade} un.</span>
                </div>
              ))}
            </div>
          ) : (
            <EstadoVazio
              icone={<ClipboardList />}
              titulo="Nada para separar"
              detalhe="Pedidos pagos aparecem aqui para preparar a entrega."
            />
          )}
        </PanelCard>
      )}

      {/* ── Entregas Tab ─────────────────────────────────────── */}
      {aba === "entregas" && (
        <PanelCard titulo="Entregas pendentes">
          {entregas.pedidos.length ? (
            <div className="bz-prep-list">
              {entregas.pedidos.map((pedido) => (
                <div key={pedido.id} className="bz-att-row">
                  <span
                    className={`bz-att-icon ${pedido.estadoEntrega === "FALHOU" ? "chip-rose" : "chip-amber"}`}
                  >
                    <Truck size={18} />
                  </span>
                  <div className="bz-att-body">
                    <div className="bz-att-title">Entrega #{pedido.numero}</div>
                    <div className="bz-att-detail">
                      {pedido.enderecoEntrega ?? "Endereço não informado"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <StatusBadge cor={corEntrega(pedido.estadoEntrega)}>
                      {traduzirEntregaPedido(pedido.estadoEntrega)}
                    </StatusBadge>
                    <Money valor={pedido.totalEmKwanza} />
                    <BotaoBizy
                      variante="ghost"
                      icone={Truck}
                      onClick={() =>
                        void executar(
                          () =>
                            requisitarApi(`/pedidos/${pedido.id}/entrega`, {
                              method: "PATCH",
                              body: { estadoEntrega: "ENVIADO", observacao: "Saiu para entrega." },
                            }),
                          "Entrega atualizada.",
                        )
                      }
                    >
                      Enviado
                    </BotaoBizy>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EstadoVazio
              icone={<Truck />}
              titulo="Sem entregas abertas"
              detalhe="Quando o pedido for pago, a operação de entrega aparece aqui."
            />
          )}
        </PanelCard>
      )}

      {/* ── Tarefas Tab ──────────────────────────────────────── */}
      {aba === "tarefas" && (
        <PanelCard titulo="Tarefas de recuperação">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <BotaoBizy
              variante="ghost"
              icone={Wrench}
              onClick={() =>
                void executar(
                  () =>
                    requisitarApi("/pedidos/recuperar-parados", {
                      method: "POST",
                      body: {
                        idadeMinutos: 30,
                        prioridade: "ALTA",
                        estadoPagamento: "PENDENTE",
                        limite: 100,
                      },
                    }),
                  "Recuperação criada para pedidos parados.",
                )
              }
            >
              Recuperar parados
            </BotaoBizy>
          </div>
          {tarefasPedidos.length ? (
            <div className="bz-prep-list">
              {tarefasPedidos.map((tarefa) => (
                <div key={tarefa.id} className="bz-att-row">
                  <span
                    className={`bz-att-icon ${
                      tarefa.prioridade === "URGENTE" || tarefa.prioridade === "ALTA"
                        ? "chip-amber"
                        : "chip-mute"
                    }`}
                  >
                    <AlertCircle size={18} />
                  </span>
                  <div className="bz-att-body">
                    <div className="bz-att-title">{tarefa.titulo}</div>
                    <div className="bz-att-detail">{tarefa.descricao}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <StatusBadge cor={tarefa.estado === "ABERTA" ? "amber" : "mute"}>
                      {tarefa.estado}
                    </StatusBadge>
                    <span className="bz-mono">
                      {tarefa.prazoEm ? formatarDataHoraCurta(tarefa.prazoEm) : "Sem prazo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EstadoVazio
              icone={<AlertCircle />}
              titulo="Sem tarefas"
              detalhe="Use 'Recuperar parados' para criar ações humanas de cobrança e entrega."
            />
          )}
        </PanelCard>
      )}

      {mensagem && (
        <footer className="bz-footer-msg" aria-live="polite">
          {mensagem}
        </footer>
      )}
    </CrmPageMotion>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

function traduzirEstadoPedido(estado: EstadoPedido): string {
  const t: Record<EstadoPedido, string> = {
    NOVO: "Novo",
    AGUARDANDO_PAGAMENTO: "Aguarda pagamento",
    PAGO: "Pago",
    EM_PREPARACAO: "Em preparação",
    PRONTO_ENTREGA: "Pronto",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
    TROCADO: "Trocado",
    DEVOLVIDO: "Devolvido",
  };
  return t[estado];
}

function traduzirPagamentoPedido(estado: EstadoPagamentoPedido): string {
  const t: Record<EstadoPagamentoPedido, string> = {
    PENDENTE: "Pendente",
    COMPROVATIVO_RECEBIDO: "Comprovativo",
    CONFIRMADO: "Confirmado",
    REJEITADO: "Rejeitado",
    REEMBOLSADO: "Reembolsado",
  };
  return t[estado];
}

function traduzirEntregaPedido(estado: EstadoEntregaPedido): string {
  const t: Record<EstadoEntregaPedido, string> = {
    PENDENTE: "Pendente",
    RETIRADA_LOJA: "Retirada",
    EM_PREPARACAO: "A preparar",
    PRONTO: "Pronto",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    FALHOU: "Falhou",
    DEVOLVIDO: "Devolvido",
  };
  return t[estado];
}

function corEstado(estado: EstadoPedido): CorSemantica {
  if (["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(estado)) return "green";
  if (estado === "AGUARDANDO_PAGAMENTO" || estado === "NOVO") return "amber";
  if (estado === "TROCADO") return "blue";
  if (estado === "CANCELADO" || estado === "DEVOLVIDO") return "rose";
  return "mute";
}

function corPagamento(estado: EstadoPagamentoPedido): CorSemantica {
  if (estado === "CONFIRMADO") return "green";
  if (estado === "PENDENTE" || estado === "COMPROVATIVO_RECEBIDO") return "amber";
  if (estado === "REEMBOLSADO") return "blue";
  if (estado === "REJEITADO") return "rose";
  return "mute";
}

function corEntrega(estado: EstadoEntregaPedido): CorSemantica {
  if (estado === "ENTREGUE") return "green";
  if (estado === "ENVIADO") return "blue";
  if (estado === "FALHOU" || estado === "DEVOLVIDO") return "rose";
  if (["PENDENTE", "EM_PREPARACAO", "PRONTO", "RETIRADA_LOJA"].includes(estado)) return "amber";
  return "mute";
}
