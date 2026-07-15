import {
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Package,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  agruparItensCheckoutPorLoja,
  calcularTotaisCheckoutBizy,
  carregarCarrinhoCheckoutBizy,
  criarCheckoutUnificado,
  guardarAcessoCompraMarket,
  limparChaveIdempotenciaCheckoutBizy,
  limparCarrinhoCheckoutBizy,
  importarCarrinhoServidorBizy,
  obterChaveIdempotenciaCheckoutBizy,
  removerItemCheckoutBizy,
  atualizarQuantidadeItemCheckoutBizy,
  sincronizarCarrinhoServidorBizy,
  ROTAS_LOJAS
} from "../api";
import type { EntregaCheckoutPublico, ItemCarrinhoCheckoutBizy, RespostaCheckoutUnificado } from "../api";
import { formatarKwanza } from "../../../utilidades";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";

interface ClienteCheckoutBizy {
  nome: string;
  telefone: string;
  email: string;
  consentimentoMarketing: boolean;
  consentimentoDados: boolean;
}

const clienteInicial: ClienteCheckoutBizy = {
  nome: "",
  telefone: "",
  email: "",
  consentimentoMarketing: false,
  consentimentoDados: true
};

const entregaInicial: EntregaCheckoutPublico = {
  tipo: "ENTREGA",
  provincia: "",
  municipio: "",
  bairro: "",
  endereco: ""
};

type MetodoPagamentoCheckout = "transferencia" | "cash" | "personalizado";

const METODOS_PAGAMENTO: Array<{ id: MetodoPagamentoCheckout; titulo: string; detalhe: string; icone: typeof Banknote }> = [
  { id: "transferencia", titulo: "Transferência bancária", detalhe: "Paga por transferência e envia o comprovativo", icone: CreditCard },
  { id: "cash", titulo: "Dinheiro na entrega", detalhe: "Paga em cash quando receber o produto", icone: Banknote },
  { id: "personalizado", titulo: "Combinar com a loja", detalhe: "A loja contacta-te para acordar o pagamento", icone: Store }
];

const ETAPAS_CHECKOUT = [
  { id: "carrinho", titulo: "Carrinho", icone: ShoppingBag },
  { id: "dados", titulo: "Dados", icone: ClipboardCheck },
  { id: "entrega", titulo: "Entrega", icone: Truck },
  { id: "pagamento", titulo: "Pagamento", icone: CreditCard },
  { id: "confirmacao", titulo: "Revisão", icone: ReceiptText }
] as const;

export function PaginaCheckoutBizy() {
  const [itens, setItens] = useState<ItemCarrinhoCheckoutBizy[]>(() => carregarCarrinhoCheckoutBizy());
  const [cliente, setCliente] = useState<ClienteCheckoutBizy>(clienteInicial);
  const [entrega, setEntrega] = useState<EntregaCheckoutPublico>(entregaInicial);
  const [observacao, setObservacao] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamentoCheckout>("transferencia");
  const [mensagem, setMensagem] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [compraUnificada, setCompraUnificada] = useState<RespostaCheckoutUnificado | null>(null);
  const [sincronizando, setSincronizando] = useState(true);

  const grupos = useMemo(() => agruparItensCheckoutPorLoja(itens), [itens]);
  const totais = useMemo(() => calcularTotaisCheckoutBizy(itens), [itens]);
  const checkoutMultiLoja = grupos.length > 1;
  const grupoUnico = grupos[0] ?? null;

  useEffect(() => {
    let activo = true;
    importarCarrinhoServidorBizy()
      .then((carrinho) => { if (activo) setItens(carrinho.itens); })
      .catch((erro) => { if (activo) setMensagem(erro instanceof Error ? erro.message : "Não foi possível sincronizar o carrinho."); })
      .finally(() => { if (activo) setSincronizando(false); });
    return () => { activo = false; };
  }, []);
  const camposPendentes = useMemo(() => {
    const pendentes: string[] = [];
    if (!itens.length) pendentes.push("Adicionar produtos");
    if (!cliente.nome.trim()) pendentes.push("Nome completo");
    if (!cliente.telefone.trim()) pendentes.push("WhatsApp");
    if (!cliente.consentimentoDados) pendentes.push("Consentimento de dados");
    if (entrega.tipo === "ENTREGA" && !entrega.endereco?.trim()) pendentes.push("Endereço ou referência");
    return pendentes;
  }, [cliente.consentimentoDados, cliente.nome, cliente.telefone, entrega.endereco, entrega.tipo, itens.length]);
  const etapaAtual = useMemo<(typeof ETAPAS_CHECKOUT)[number]["id"]>(() => {
    if (!itens.length) return "carrinho";
    if (!cliente.nome.trim() || !cliente.telefone.trim() || !cliente.consentimentoDados) return "dados";
    if (entrega.tipo === "ENTREGA" && !entrega.endereco?.trim()) return "entrega";
    if (!metodoPagamento) return "pagamento";
    return "confirmacao";
  }, [cliente.consentimentoDados, cliente.nome, cliente.telefone, entrega.endereco, entrega.tipo, itens.length, metodoPagamento]);
  const indiceEtapaAtual = ETAPAS_CHECKOUT.findIndex((etapa) => etapa.id === etapaAtual);

  function removerItem(id: string) {
    setItens(removerItemCheckoutBizy(id));
    limparChaveIdempotenciaCheckoutBizy();
  }

  function atualizarQuantidade(id: string, quantidade: number) {
    setItens(atualizarQuantidadeItemCheckoutBizy(id, quantidade));
    limparChaveIdempotenciaCheckoutBizy();
  }

  function limparCarrinho() {
    limparCarrinhoCheckoutBizy();
    limparChaveIdempotenciaCheckoutBizy();
    setItens([]);
    setCompraUnificada(null);
  }

  async function finalizarCheckout() {
    setMensagem("");

    if (!itens.length) {
      setMensagem("Adiciona um produto antes de finalizar.");
      return;
    }

    if (!cliente.nome.trim() || !cliente.telefone.trim()) {
      setMensagem("Nome e WhatsApp são obrigatórios para a loja cumprir o pedido.");
      return;
    }

    if (!cliente.consentimentoDados) {
      setMensagem("Confirma o consentimento mínimo de dados antes de criar o pedido.");
      return;
    }

    if (entrega.tipo === "ENTREGA" && !entrega.endereco?.trim()) {
      setMensagem("Informa o endereço ou referência para entrega.");
      return;
    }

    setFinalizando(true);
    try {
      const idempotencyKey = obterChaveIdempotenciaCheckoutBizy(
        itens,
        cliente.telefone,
        JSON.stringify({
          entrega,
          metodoPagamento,
          observacao: observacao.trim()
        })
      );

      const carrinho = await sincronizarCarrinhoServidorBizy(itens, "SUBSTITUIR");
      const enderecoCompleto = entrega.tipo === "ENTREGA"
        ? [entrega.endereco, entrega.bairro, entrega.municipio, entrega.provincia].filter(Boolean).join(", ")
        : undefined;
      const resposta = await criarCheckoutUnificado({
        idempotencyKey,
        carrinhoId: carrinho.id,
        compradorTelefone: cliente.telefone,
        compradorNome: cliente.nome,
        compradorEmail: cliente.email || null,
        itens: [],
        entrega,
        metodoPagamento,
        enderecoEntrega: enderecoCompleto,
        observacao: observacao.trim() || null,
        origem: "checkout-bizy"
      });

      setCompraUnificada(resposta);
      guardarAcessoCompraMarket(resposta.compra.id, resposta.acessoCompra.token);
      limparCarrinhoCheckoutBizy();
      limparChaveIdempotenciaCheckoutBizy();
      setItens([]);
      setMensagem("Compra criada com sucesso.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível finalizar o checkout.");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <main className="bizy-market-page market-commerce-page market-public-page checkout-bizy-page">
      <CabecalhoMarket />

      <section className="checkout-bizy-hero">
        <span><Lock size={14} /> Checkout unificado Bizy</span>
        <h1>Compra organizada, fornecedor sempre claro.</h1>
        <p>
          {checkoutMultiLoja
            ? `Produtos de ${grupos.length} lojas diferentes. O Bizy separa cada pedido por fornecedor e gere a compra como uma unidade.`
            : "Checkout seguro do Bizy ligado ao Team de cada loja."}
        </p>
      </section>

      <nav className="checkout-progress-steps" aria-label="Progresso do checkout">
        {ETAPAS_CHECKOUT.map(({ id, titulo, icone: Icone }, indice) => {
          const estado = indice < indiceEtapaAtual ? "done" : id === etapaAtual ? "active" : "todo";
          return (
            <span key={id} className={`checkout-progress-step is-${estado}`} aria-current={id === etapaAtual ? "step" : undefined}>
              <i><Icone size={14} /></i>
              <strong>{titulo}</strong>
            </span>
          );
        })}
      </nav>

      <section className="checkout-bizy-infoband" aria-live="polite">
        <ShieldCheck size={17} />
        <span>
          {checkoutMultiLoja
            ? `Os teus produtos vêm de ${grupos.length} lojas. O Bizy cria um pedido separado para cada fornecedor numa compra unificada.`
            : grupoUnico
              ? `Os teus produtos vêm de ${grupoUnico.nomeFornecedor}. O pedido será finalizado num só passo.`
              : "Adiciona produtos da loja ou do Market para começar um checkout protegido pelo Bizy."}
        </span>
      </section>

      {compraUnificada ? (
        <section className="checkout-success-card">
          <CheckCircle2 size={40} />
          {compraUnificada ? (
            <>
              <h2>Compra #{compraUnificada.compra.numero} criada</h2>
              <p>
                {compraUnificada.pedidosFilho.length} pedido{compraUnificada.pedidosFilho.length === 1 ? "" : "s"} separado{compraUnificada.pedidosFilho.length === 1 ? "" : "s"} por fornecedor.
                Estado: {compraUnificada.compra.estado.toLowerCase().replace(/_/g, " ")}.
              </p>
              <p>A factura correspondente é gerada automaticamente para cada fornecedor.</p>
              <div>
                <strong>{formatarKwanza(compraUnificada.compra.totalEmKwanza)}</strong>
                <span>Total da compra</span>
              </div>
              <Button asChild variant="outline">
                <Link to={ROTAS_LOJAS.compra(compraUnificada.compra.id)}>Acompanhar compra</Link>
              </Button>
            </>
          ) : null}
          <Button asChild>
            <Link to={ROTAS_LOJAS.market}>Continuar no Market</Link>
          </Button>
        </section>
      ) : (
        <section className={`checkout-bizy-layout${itens.length ? "" : " is-empty"}`}>
          <div className="checkout-bizy-cart">
            <div className="checkout-section-head">
              <span><ShoppingBag size={16} /> Carrinho</span>
              {itens.length > 0 && <button type="button" onClick={limparCarrinho}>Limpar</button>}
            </div>

            {!itens.length ? (
              <div className="checkout-empty-state">
                <Package size={34} />
                <strong>Carrinho vazio</strong>
                <span>Adiciona produtos a partir da loja ou do Bizy Market.</span>
                <Link to={ROTAS_LOJAS.market}>Explorar produtos</Link>
              </div>
            ) : (
              <div className="checkout-store-groups">
                {grupos.map((grupo) => (
                  <article key={grupo.slugLoja} className="checkout-store-group">
                    <header>
                      <span><Store size={16} /></span>
                      <div>
                        <strong>{grupo.nomeFornecedor}</strong>
                        <small>{grupo.itens.length} item{grupo.itens.length === 1 ? "" : "s"} · pedido separado · {formatarKwanza(grupo.subtotalEmKwanza)}</small>
                      </div>
                      {grupo.urlLoja && <Link to={grupo.urlLoja}>Ver loja</Link>}
                    </header>
                    <div className="checkout-item-list">
                      {grupo.itens.map((item) => (
                        <div key={item.id} className="checkout-item-row">
                          <span className="checkout-item-media">
                            {item.fotoUrl ? <img src={item.fotoUrl} alt="" /> : <Package size={18} />}
                          </span>
                          <div className="checkout-item-body">
                            <strong>{item.nomeProduto}</strong>
                            <small>{formatarKwanza(item.precoUnitarioEmKwanza)} por unidade</small>
                            {Object.keys(item.variantes ?? {}).length > 0 && (
                              <span className="checkout-item-variants">
                                {Object.entries(item.variantes ?? {}).map(([nome, valor]) => `${nome}: ${valor}`).join(" · ")}
                              </span>
                            )}
                            <span className="checkout-quantity-control" aria-label={`Quantidade de ${item.nomeProduto}`}>
                              <button type="button" onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)} disabled={item.quantidade <= 1} aria-label={`Diminuir ${item.nomeProduto}`}>
                                <Minus size={13} />
                              </button>
                              <em>{item.quantidade}</em>
                              <button type="button" onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)} aria-label={`Aumentar ${item.nomeProduto}`}>
                                <Plus size={13} />
                              </button>
                            </span>
                          </div>
                          <div className="checkout-item-actions">
                            <strong>{formatarKwanza(item.precoUnitarioEmKwanza * item.quantidade)}</strong>
                            <button type="button" onClick={() => removerItem(item.id)} aria-label={`Remover ${item.nomeProduto}`}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {checkoutMultiLoja && (
              <div className="checkout-multi-store-guard" role="status">
                <ShieldCheck size={20} />
                <div>
                  <strong>Compra multi-loja</strong>
                  <p>O Bizy cria um pedido separado para cada fornecedor. Entrega, pagamento e atendimento ficam isolados por loja.</p>
                </div>
              </div>
            )}
          </div>

          {itens.length > 0 && <aside className="checkout-bizy-form">
            <div className="checkout-section-head">
              <span><Truck size={16} /> Dados e entrega</span>
              <em>{totais.totalLojas} loja{totais.totalLojas === 1 ? "" : "s"}</em>
            </div>

            <div className="checkout-visual-panel">
              <span>{checkoutMultiLoja ? "Compra unificada" : "Checkout da loja"}</span>
              <strong>{formatarKwanza(totais.subtotalEmKwanza)}</strong>
              <small>{totais.quantidadeItens} item{totais.quantidadeItens === 1 ? "" : "s"} em {totais.totalLojas || 0} fornecedor{totais.totalLojas === 1 ? "" : "es"}</small>
            </div>

            <div className="checkout-form-grid">
              <Input value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} placeholder="Nome completo" aria-label="Nome completo" />
              <Input value={cliente.telefone} onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} placeholder="WhatsApp" aria-label="WhatsApp" />
              <Input value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} placeholder="Email opcional" aria-label="Email opcional" />
            </div>

            <div className="checkout-delivery-options" aria-label="Tipo de entrega">
              {(["ENTREGA", "RETIRADA", "ORCAMENTO"] as EntregaCheckoutPublico["tipo"][]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className={entrega.tipo === tipo ? "is-active" : ""}
                  onClick={() => setEntrega({ ...entrega, tipo })}
                >
                  {tipo === "ENTREGA" ? "Entrega" : tipo === "RETIRADA" ? "Retirada" : "A combinar"}
                </button>
              ))}
            </div>

            {entrega.tipo === "ENTREGA" && (
              <div className="checkout-form-grid">
                <Input value={entrega.provincia ?? ""} onChange={(e) => setEntrega({ ...entrega, provincia: e.target.value })} placeholder="Província" />
                <Input value={entrega.municipio ?? ""} onChange={(e) => setEntrega({ ...entrega, municipio: e.target.value })} placeholder="Município" />
                <Input value={entrega.bairro ?? ""} onChange={(e) => setEntrega({ ...entrega, bairro: e.target.value })} placeholder="Bairro/zona" />
                <label className="checkout-address-field">
                  <MapPin size={15} />
                  <Textarea
                    value={entrega.endereco ?? ""}
                    onChange={(e) => setEntrega({ ...entrega, endereco: e.target.value })}
                    placeholder="Endereço ou referência"
                  />
                </label>
              </div>
            )}

            <div className="checkout-section-head">
              <span><CreditCard size={16} /> Pagamento</span>
            </div>

            <div className="checkout-payment-options" aria-label="Método de pagamento">
              {METODOS_PAGAMENTO.map(({ id, titulo, detalhe, icone: Icone }) => (
                <label key={id} className={`checkout-payment-option${metodoPagamento === id ? " is-active" : ""}`}>
                  <input
                    type="radio"
                    name="metodoPagamento"
                    value={id}
                    checked={metodoPagamento === id}
                    onChange={() => setMetodoPagamento(id)}
                  />
                  <Icone size={18} />
                  <div>
                    <strong>{titulo}</strong>
                    <small>{detalhe}</small>
                  </div>
                </label>
              ))}
            </div>

            {metodoPagamento === "transferencia" && (
              <div className="checkout-comprovativo-notice">
                <Upload size={15} />
                <span>Após confirmar, a loja enviará os dados bancários. Envia o comprovativo por WhatsApp para validar o pagamento.</span>
              </div>
            )}

            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Observação para a loja" />

            <label className="checkout-consent-row">
              <input
                type="checkbox"
                checked={cliente.consentimentoDados}
                onChange={(e) => setCliente({ ...cliente, consentimentoDados: e.target.checked })}
              />
              <span>Autorizo o uso dos dados mínimos para criar pedido, entrega e atendimento.</span>
            </label>

            <label className="checkout-consent-row">
              <input
                type="checkbox"
                checked={cliente.consentimentoMarketing}
                onChange={(e) => setCliente({ ...cliente, consentimentoMarketing: e.target.checked })}
              />
              <span>Quero receber novidades da loja por canais permitidos.</span>
            </label>

            <div className="checkout-bizy-summary">
              <div><span>Itens</span><strong>{totais.quantidadeItens}</strong></div>
              <div><span>Subtotal</span><strong>{formatarKwanza(totais.subtotalEmKwanza)}</strong></div>
              <div><span>Fornecedores</span><strong>{totais.totalLojas}</strong></div>
              <div><span>Pagamento</span><strong>{METODOS_PAGAMENTO.find((metodo) => metodo.id === metodoPagamento)?.titulo ?? "A combinar"}</strong></div>
              <div><span>Entrega</span><strong>calculada pela loja</strong></div>
            </div>

            <div className="checkout-review-panel" aria-live="polite">
              <strong>Revisão antes de finalizar</strong>
              {camposPendentes.length ? (
                <ul>
                  {camposPendentes.map((campo) => <li key={campo}>{campo}</li>)}
                </ul>
              ) : (
                <span><CheckCircle2 size={15} /> Pronto para criar pedido operacional no Team.</span>
              )}
            </div>

            {mensagem && <p className="checkout-message" aria-live="polite">{mensagem}</p>}

            <Button
              type="button"
              className="checkout-submit"
              disabled={sincronizando || finalizando || !itens.length}
              onClick={() => void finalizarCheckout()}
            >
              {finalizando ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {checkoutMultiLoja ? "Finalizar compra multi-loja" : "Finalizar checkout seguro"}
            </Button>
          </aside>}
        </section>
      )}
      <RodapeMarket />
    </main>
  );
}
