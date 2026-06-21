import {
  AlertCircle,
  AlertTriangle,
  Check,
  ClipboardList,
  Clock,
  Eye,
  Kanban,
  List,
  MessageSquare,
  PackageCheck,
  Plus,
  ReceiptText,
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
  StatusBadge,
  BotaoBizy,
  PanelCard,
  Money,
  TabsBizy,
  IconButton,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";

/* ── Constants ──────────────────────────────────────────────────── */

type FiltroFunil = "todos" | "a-cobrar" | "pagos" | "enviados" | "em-atraso";
type VistaFunil = "lista" | "kanban";

function criarUrlConversaCliente(cliente: Cliente360 | undefined, pedido: Pedido): string {
  const params = new URLSearchParams();
  params.set("clienteId", pedido.clienteNegocioId);
  params.set("pedidoId", pedido.id);
  if (cliente?.telefone) params.set("telefone", cliente.telefone);
  return `/app/conversas?${params.toString()}`;
}

function obterIniciais(nome: string): string {
  return nome.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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
  const [filtroFunil, setFiltroFunil] = useState<FiltroFunil>("todos");
  const [vistaFunil, setVistaFunil] = useState<VistaFunil>("lista");
  const [aba, setAba] = useState("fluxo");
  const [limitePedidos, setLimitePedidos] = useState(12);

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
      ["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA"].includes(p.estado),
  );
  const enviados = pedidos.filter(
    (p) => p.estado === "ENVIADO" || p.estadoEntrega === "ENVIADO",
  );
  const emAtraso = pedidos.filter(
    (p) =>
      ["CANCELADO", "DEVOLVIDO", "TROCADO"].includes(p.estado) ||
      ["FALHOU", "DEVOLVIDO"].includes(p.estadoEntrega) ||
      p.estadoPagamento === "REJEITADO",
  );
  const totalFluxo = pedidos.reduce((t, p) => t + p.totalEmKwanza, 0);
  const tarefasPedidos = tarefas.filter(
    (t) => t.pedidoId || t.tipo.includes("PEDIDO") || t.tipo === "COBRANCA",
  );

  const pedidosFiltrados = useMemo(() => {
    switch (filtroFunil) {
      case "a-cobrar": return aguardandoPagamento;
      case "pagos": return pagos;
      case "enviados": return enviados;
      case "em-atraso": return emAtraso;
      default: return pedidos;
    }
  }, [filtroFunil, pedidos, aguardandoPagamento, pagos, enviados, emAtraso]);

  const pedidosVisiveis = pedidosFiltrados.slice(0, limitePedidos);
  const existemMais = pedidosVisiveis.length < pedidosFiltrados.length;

  useEffect(() => { setLimitePedidos(12); }, [filtroFunil]);

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  const colTemplate = "108px 1.5fr 1.6fr 110px 150px 120px 96px";

  return (
    <CrmPageMotion>
      <div className="crm-v3-pgwrap">
        {/* ── Page Head ─────────────────────────────────────── */}
        <div className="crm-v3-pghead">
          <div>
            <h1>Pedidos</h1>
            <div className="crm-v3-sub">
              {pedidos.length} abertos · {formatarKwanza(totalFluxo)} em fluxo
            </div>
          </div>
          <div className="crm-v3-pghead-right">
            <button type="button" className="crm-v3-btn crm-v3-btn-ghost" onClick={() => void carregar()}>
              Exportar
            </button>
            <Link to="/app/reservas" className="crm-v3-btn crm-v3-btn-primary">
              <Plus size={13} />
              Novo pedido
            </Link>
          </div>
        </div>

        {/* ── Tabs (Fluxo / Preparação / Entregas / Tarefas) */}
        <TabsBizy
          tabs={[
            { id: "fluxo", rotulo: "Fluxo de vendas", contagem: pedidos.length },
            { id: "preparacao", rotulo: "Preparação", contagem: preparacao.produtos.length },
            { id: "entregas", rotulo: "Entregas", contagem: entregas.pedidos.length },
            { id: "tarefas", rotulo: "Tarefas", contagem: tarefasPedidos.length },
          ]}
          activo={aba}
          onChange={setAba}
        />

        {/* ── Fluxo de vendas Tab ────────────────────────────── */}
        {aba === "fluxo" && (
          <>
            {/* Vista toggle + filter tiles */}
            <div className="bz-funil-toolbar">
              <div className="bz-funil-vista-toggle">
                <button type="button" className={`bz-funil-vista-btn ${vistaFunil === "lista" ? "bz-funil-vista-btn--on" : ""}`} onClick={() => setVistaFunil("lista")} title="Vista lista">
                  <List size={15} />
                </button>
                <button type="button" className={`bz-funil-vista-btn ${vistaFunil === "kanban" ? "bz-funil-vista-btn--on" : ""}`} onClick={() => setVistaFunil("kanban")} title="Quadro de etapas">
                  <Kanban size={15} />
                </button>
              </div>
            </div>

            {/* Funnel filter tiles */}
            {vistaFunil === "lista" && <div className="crm-v3-ftiles">
              <button
                type="button"
                className="crm-v3-ftile"
                data-active={filtroFunil === "todos" ? "true" : undefined}
                onClick={() => setFiltroFunil("todos")}
              >
                <span className="crm-v3-ftile-icon" style={{ background: "var(--em-tint)", color: "var(--em)" }}>
                  <ShoppingBag size={17} />
                </span>
                <div>
                  <div className="crm-v3-ftile-title">Todos</div>
                  <div className="crm-v3-ftile-desc">em aberto</div>
                </div>
                <span className="crm-v3-ftile-count">{pedidos.length}</span>
              </button>
              <button
                type="button"
                className="crm-v3-ftile"
                data-active={filtroFunil === "a-cobrar" ? "true" : undefined}
                onClick={() => setFiltroFunil("a-cobrar")}
              >
                <span className="crm-v3-ftile-icon" style={{ background: "var(--amber-tint)", color: "var(--amber)" }}>
                  <Clock size={17} />
                </span>
                <div>
                  <div className="crm-v3-ftile-title">A cobrar</div>
                  <div className="crm-v3-ftile-desc">aguardam pagamento</div>
                </div>
                <span className="crm-v3-ftile-count">{aguardandoPagamento.length}</span>
              </button>
              <button
                type="button"
                className="crm-v3-ftile"
                data-active={filtroFunil === "pagos" ? "true" : undefined}
                onClick={() => setFiltroFunil("pagos")}
              >
                <span className="crm-v3-ftile-icon" style={{ background: "var(--em-tint)", color: "var(--em)" }}>
                  <Check size={17} />
                </span>
                <div>
                  <div className="crm-v3-ftile-title">Pagos</div>
                  <div className="crm-v3-ftile-desc">prontos a preparar</div>
                </div>
                <span className="crm-v3-ftile-count">{pagos.length}</span>
              </button>
              <button
                type="button"
                className="crm-v3-ftile"
                data-active={filtroFunil === "enviados" ? "true" : undefined}
                onClick={() => setFiltroFunil("enviados")}
              >
                <span className="crm-v3-ftile-icon" style={{ background: "var(--blue-tint)", color: "var(--blue)" }}>
                  <Truck size={17} />
                </span>
                <div>
                  <div className="crm-v3-ftile-title">Enviados</div>
                  <div className="crm-v3-ftile-desc">em trânsito</div>
                </div>
                <span className="crm-v3-ftile-count">{enviados.length}</span>
              </button>
              <button
                type="button"
                className="crm-v3-ftile"
                data-active={filtroFunil === "em-atraso" ? "true" : undefined}
                onClick={() => setFiltroFunil("em-atraso")}
              >
                <span className="crm-v3-ftile-icon" style={{ background: "var(--rose-tint)", color: "var(--rose)" }}>
                  <AlertTriangle size={17} />
                </span>
                <div>
                  <div className="crm-v3-ftile-title">Em atraso</div>
                  <div className="crm-v3-ftile-desc">requerem ação</div>
                </div>
                <span className="crm-v3-ftile-count">{emAtraso.length}</span>
              </button>
            </div>}

            {/* Kanban view */}
            {vistaFunil === "kanban" && (
              <FunilKanban
                pedidos={pedidos}
                clientesPorId={clientesPorId}
                carregando={carregando}
                onExecutar={executar}
              />
            )}

            {/* Orders table */}
            {vistaFunil === "lista" && (<>
            {pedidosVisiveis.length > 0 ? (
              <div className="crm-v3-otbl">
                <div className="crm-v3-otbl-head" style={{ gridTemplateColumns: colTemplate }}>
                  <span>Pedido</span>
                  <span>Cliente</span>
                  <span>Itens</span>
                  <span>Total</span>
                  <span>Estado</span>
                  <span>Entrega</span>
                  <span style={{ textAlign: "right" }}>Ações</span>
                </div>
                {pedidosVisiveis.map((pedido) => {
                  const cliente = clientesPorId.get(pedido.clienteNegocioId);
                  const nome = cliente?.nome ?? cliente?.telefone ?? "Cliente";
                  const iniciais = obterIniciais(nome);
                  const primeiroItem = pedido.itens[0];
                  const hue = hueDoEstado(pedido.estado);
                  const canal = pedido.canal ?? "";

                  return (
                    <div key={pedido.id} className="crm-v3-otbl-row" style={{ gridTemplateColumns: colTemplate }}>
                      <span className="crm-v3-otbl-oid">
                        #{pedido.numero}
                        <small>{formatarDataHoraCurta(pedido.criadoEm)}</small>
                      </span>
                      <span className="crm-v3-otbl-cli">
                        <span className="crm-v3-av crm-v3-av-32" data-hue={hue}>{iniciais}</span>
                        <span>
                          <span className="crm-v3-otbl-cli-name">{nome}</span>
                          {canal && <div className="crm-v3-otbl-cli-channel">{canal}{pedido.origem && pedido.origem !== "manual" ? ` · ${pedido.origem}` : ""}</div>}
                        </span>
                      </span>
                      <span className="crm-v3-otbl-item">
                        <b>{primeiroItem?.nomeProduto ?? "sem itens"}</b>
                        {pedido.itens.length > 1 && ` +${pedido.itens.length - 1}`}
                      </span>
                      <span className="crm-v3-otbl-price">
                        {formatarKwanza(pedido.totalEmKwanza)}
                      </span>
                      <span>
                        <span className="crm-v3-bdg" data-tone={toneBadgeEstado(pedido.estado)}>
                          <span className="crm-v3-bdg-dot" />
                          {traduzirEstadoPedido(pedido.estado)}
                        </span>
                      </span>
                      <span className="crm-v3-otbl-item">
                        {pedido.enderecoEntrega ?? traduzirEntregaPedido(pedido.estadoEntrega)}
                      </span>
                      <span className="crm-v3-otbl-actions">
                        <Link
                          to={criarUrlConversaCliente(cliente, pedido)}
                          className="crm-v3-otbl-action-btn"
                          title="Abrir conversa"
                        >
                          <MessageSquare size={14} />
                        </Link>
                        {pedido.estado === "AGUARDANDO_PAGAMENTO" && (
                          <button
                            type="button"
                            className="crm-v3-otbl-action-btn"
                            data-hot="true"
                            title="Confirmar pagamento"
                            disabled={carregando}
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
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {(pedido.estado === "PAGO" || pedido.estado === "PRONTO_ENTREGA") && (
                          <button
                            type="button"
                            className="crm-v3-otbl-action-btn"
                            title="Marcar como enviado"
                            disabled={carregando}
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
                            <Truck size={14} />
                          </button>
                        )}
                        {pedido.estado === "ENVIADO" && (
                          <>
                            <button
                              type="button"
                              className="crm-v3-otbl-action-btn"
                              title="Confirmar entrega"
                              disabled={carregando}
                              onClick={() =>
                                void executar(
                                  () =>
                                    requisitarApi(`/pedidos/${pedido.id}/entrega`, {
                                      method: "PATCH",
                                      body: { estadoEntrega: "ENTREGUE", observacao: "Entrega confirmada." },
                                    }),
                                  "Entrega confirmada.",
                                )
                              }
                            >
                              <PackageCheck size={14} />
                            </button>
                            <Link
                              to={`/app/reservas/${pedido.id}`}
                              className="crm-v3-otbl-action-btn"
                              title="Ver detalhes"
                            >
                              <Eye size={14} />
                            </Link>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EstadoVazio
                icone={<ReceiptText />}
                titulo="Sem pedidos"
                detalhe="Crie pedidos pela conversa, loja pública ou checkout."
              />
            )}
            {existemMais && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button
                  type="button"
                  className="crm-v3-btn crm-v3-btn-ghost"
                  onClick={() => setLimitePedidos((l) => l + 12)}
                >
                  Ver mais pedidos
                </button>
              </div>
            )}
            </>)}
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
                      {pedido.estadoEntrega !== "ENVIADO" && pedido.estadoEntrega !== "ENTREGUE" && (
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
                      )}
                      {pedido.estadoEntrega === "ENVIADO" && (
                        <BotaoBizy
                          variante="ghost"
                          icone={PackageCheck}
                          onClick={() =>
                            void executar(
                              () =>
                                requisitarApi(`/pedidos/${pedido.id}/entrega`, {
                                  method: "PATCH",
                                  body: { estadoEntrega: "ENTREGUE", observacao: "Entrega confirmada." },
                                }),
                              "Entrega confirmada.",
                            )
                          }
                        >
                          Entregue
                        </BotaoBizy>
                      )}
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
      </div>
    </CrmPageMotion>
  );
}

/* ── Kanban ─────────────────────────────────────────────────────── */

const COLUNAS_KANBAN: Array<{ estado: EstadoPedido; rotulo: string; cor: string }> = [
  { estado: "NOVO", rotulo: "Novo", cor: "var(--ink-4)" },
  { estado: "AGUARDANDO_PAGAMENTO", rotulo: "Aguarda pagamento", cor: "var(--amber)" },
  { estado: "PAGO", rotulo: "Pago", cor: "var(--green)" },
  { estado: "EM_PREPARACAO", rotulo: "Em preparação", cor: "var(--blue)" },
  { estado: "PRONTO_ENTREGA", rotulo: "Pronto", cor: "var(--green)" },
  { estado: "ENVIADO", rotulo: "Enviado", cor: "var(--blue)" },
  { estado: "ENTREGUE", rotulo: "Entregue", cor: "var(--green)" },
];

function FunilKanban({
  pedidos,
  clientesPorId,
  carregando,
  onExecutar,
}: {
  pedidos: Pedido[];
  clientesPorId: Map<string, Cliente360>;
  carregando: boolean;
  onExecutar: (acao: () => Promise<unknown>, sucesso: string) => Promise<void>;
}) {
  const porEstado = useMemo(() => {
    const mapa = new Map<EstadoPedido, Pedido[]>();
    for (const col of COLUNAS_KANBAN) mapa.set(col.estado, []);
    for (const pedido of pedidos) {
      const lista = mapa.get(pedido.estado);
      if (lista) lista.push(pedido);
    }
    return mapa;
  }, [pedidos]);

  return (
    <div className="bz-kanban">
      {COLUNAS_KANBAN.map(({ estado, rotulo, cor }) => {
        const lista = porEstado.get(estado) ?? [];
        return (
          <div key={estado} className="bz-kanban-col">
            <div className="bz-kanban-col-head">
              <span className="bz-kanban-col-dot" style={{ background: cor }} />
              <span className="bz-kanban-col-title">{rotulo}</span>
              <span className="bz-kanban-col-count">{lista.length}</span>
            </div>
            <div className="bz-kanban-col-body">
              {lista.map((pedido) => {
                const cliente = clientesPorId.get(pedido.clienteNegocioId);
                const nome = cliente?.nome ?? cliente?.telefone ?? "Cliente";
                return (
                  <div key={pedido.id} className="bz-kanban-card">
                    <div className="bz-kanban-card-top">
                      <span className="bz-kanban-card-num">#{pedido.numero}</span>
                      <span className="bz-kanban-card-total">{formatarKwanza(pedido.totalEmKwanza)}</span>
                    </div>
                    <div className="bz-kanban-card-cli">{nome}</div>
                    {pedido.itens[0] && (
                      <div className="bz-kanban-card-item">{pedido.itens[0].nomeProduto}{pedido.itens.length > 1 ? ` +${pedido.itens.length - 1}` : ""}</div>
                    )}
                    <div className="bz-kanban-card-date">{formatarDataHoraCurta(pedido.criadoEm)}</div>
                    <div className="bz-kanban-card-actions">
                      <Link to={`/app/conversas?clienteId=${pedido.clienteNegocioId}&pedidoId=${pedido.id}`} className="bz-iconbtn" title="Conversa">
                        <MessageSquare size={12} />
                      </Link>
                      {pedido.estado === "AGUARDANDO_PAGAMENTO" && (
                        <button type="button" className="bz-iconbtn" title="Confirmar pagamento" disabled={carregando}
                          onClick={() => void onExecutar(() => requisitarApi(`/pedidos/${pedido.id}/confirmar-pagamento`, { method: "POST", body: { observacao: "Confirmado no CRM Bizy." } }), "Pagamento confirmado.")}>
                          <Check size={12} />
                        </button>
                      )}
                      {(pedido.estado === "PAGO" || pedido.estado === "PRONTO_ENTREGA") && (
                        <button type="button" className="bz-iconbtn" title="Marcar enviado" disabled={carregando}
                          onClick={() => void onExecutar(() => requisitarApi(`/pedidos/${pedido.id}/entrega`, { method: "PATCH", body: { estadoEntrega: "ENVIADO", observacao: "Saiu para entrega." } }), "Entrega atualizada.")}>
                          <Truck size={12} />
                        </button>
                      )}
                      {pedido.estado === "ENVIADO" && (
                        <button type="button" className="bz-iconbtn" title="Confirmar entrega" disabled={carregando}
                          onClick={() => void onExecutar(() => requisitarApi(`/pedidos/${pedido.id}/entrega`, { method: "PATCH", body: { estadoEntrega: "ENTREGUE", observacao: "Entrega confirmada." } }), "Entrega confirmada.")}>
                          <PackageCheck size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {lista.length === 0 && (
                <div className="bz-kanban-empty">Sem pedidos</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
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

function toneBadgeEstado(estado: EstadoPedido): string {
  if (["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENTREGUE"].includes(estado)) return "green";
  if (estado === "AGUARDANDO_PAGAMENTO" || estado === "NOVO") return "amber";
  if (estado === "ENVIADO") return "blue";
  if (estado === "CANCELADO" || estado === "DEVOLVIDO") return "rose";
  if (estado === "TROCADO") return "violet";
  return "mute";
}

function hueDoEstado(estado: EstadoPedido): string {
  if (["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENTREGUE"].includes(estado)) return "green";
  if (estado === "AGUARDANDO_PAGAMENTO" || estado === "NOVO") return "amber";
  if (estado === "ENVIADO") return "blue";
  if (estado === "CANCELADO" || estado === "DEVOLVIDO") return "rose";
  return "violet";
}

function corEntrega(estado: EstadoEntregaPedido): CorSemantica {
  if (estado === "ENTREGUE") return "green";
  if (estado === "ENVIADO") return "blue";
  if (estado === "FALHOU" || estado === "DEVOLVIDO") return "rose";
  if (["PENDENTE", "EM_PREPARACAO", "PRONTO", "RETIRADA_LOJA"].includes(estado)) return "amber";
  return "mute";
}
