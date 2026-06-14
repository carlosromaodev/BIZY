import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Upload
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  agruparItensCheckoutPorLoja,
  calcularEntregaLojaPublica,
  calcularTotaisCheckoutBizy,
  carregarCarrinhoCheckoutBizy,
  criarCheckoutLojaPublica,
  limparCarrinhoCheckoutBizy,
  removerItemCheckoutBizy,
  ROTAS_LOJAS
} from "../lojas";
import type { EntregaCheckoutPublico, ItemCarrinhoCheckoutBizy, RespostaCheckoutLojaPublica } from "../lojas";
import { LogoBizy } from "../marca/bizy";
import { formatarKwanza } from "../utilidades";

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

export function PaginaCheckoutBizy() {
  const navigate = useNavigate();
  const [itens, setItens] = useState<ItemCarrinhoCheckoutBizy[]>(() => carregarCarrinhoCheckoutBizy());
  const [cliente, setCliente] = useState<ClienteCheckoutBizy>(clienteInicial);
  const [entrega, setEntrega] = useState<EntregaCheckoutPublico>(entregaInicial);
  const [observacao, setObservacao] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamentoCheckout>("transferencia");
  const [mensagem, setMensagem] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState<RespostaCheckoutLojaPublica | null>(null);

  const grupos = useMemo(() => agruparItensCheckoutPorLoja(itens), [itens]);
  const totais = useMemo(() => calcularTotaisCheckoutBizy(itens), [itens]);
  const checkoutMultiLoja = grupos.length > 1;
  const grupoUnico = grupos[0] ?? null;

  function removerItem(id: string) {
    setItens(removerItemCheckoutBizy(id));
  }

  function limparCarrinho() {
    limparCarrinhoCheckoutBizy();
    setItens([]);
    setPedidoCriado(null);
  }

  async function finalizarCheckout() {
    setMensagem("");

    if (!itens.length || !grupoUnico) {
      setMensagem("Adiciona um produto antes de finalizar.");
      return;
    }

    if (checkoutMultiLoja) {
      setMensagem("Não cria pedidos multi-loja sem backend de pedidos filhos.");
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
      const itensPayload = grupoUnico.itens.map((item) => ({
        codigoPeca: item.codigoProduto,
        quantidade: item.quantidade
      }));

      await calcularEntregaLojaPublica(grupoUnico.slugLoja, {
        itens: itensPayload,
        entrega
      }).catch(() => null);

      const resposta = await criarCheckoutLojaPublica(grupoUnico.slugLoja, {
        itens: itensPayload,
        entrega,
        cliente: {
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email || null,
          consentimentoMarketing: cliente.consentimentoMarketing,
          consentimentoDados: cliente.consentimentoDados
        },
        origem: "checkout-bizy",
        canal: "site",
        observacao: montarObservacaoCheckoutBizy(grupoUnico.nomeFornecedor, observacao, grupoUnico.itens),
        metodoPagamento
      });

      setPedidoCriado(resposta);
      limparCarrinhoCheckoutBizy();
      setItens([]);
      setMensagem("Pedido criado no CRM da loja.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível finalizar o checkout.");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <main className="checkout-bizy-page min-h-[100dvh] bg-[#f5f3ed] text-neutral-950">
      <header className="checkout-bizy-topbar">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <Link to={ROTAS_LOJAS.market} className="checkout-bizy-brand">
          <LogoBizy variante="icone" style={{ width: 20, height: 20 }} />
          <span>Checkout Bizy</span>
        </Link>
        <Link to="/" aria-label="Início">
          <Home size={18} />
        </Link>
      </header>

      <section className="checkout-bizy-hero">
        <span><Lock size={14} /> Entrada unificada progressiva</span>
        <h1>Compra organizada, fornecedor sempre claro.</h1>
        <p>
          Nesta fase, o Bizy finaliza com segurança compras de uma loja usando o checkout real já ligado ao CRM. Carrinhos multi-loja ficam preparados e bloqueados até o backend de pedidos filhos entrar.
        </p>
      </section>

      <section className="checkout-bizy-infoband" aria-live="polite">
        <ShieldCheck size={17} />
        <span>
          {checkoutMultiLoja
            ? "Os teus produtos vêm de várias lojas. O Bizy separa fornecedor por fornecedor, mas a finalização multi-loja ainda fica bloqueada."
            : grupoUnico
              ? `Os teus produtos vêm de ${grupoUnico.nomeFornecedor}. O pedido será finalizado num só passo.`
              : "Adiciona produtos da loja ou do Market para começar um checkout protegido pelo Bizy."}
        </span>
      </section>

      {pedidoCriado ? (
        <section className="checkout-success-card">
          <CheckCircle2 size={40} />
          <h2>Pedido #{pedidoCriado.pedido.numero} criado</h2>
          <p>O pedido já entrou no CRM da loja responsável com estado {pedidoCriado.pedido.estadoPagamento.toLowerCase()}.</p>
          <div>
            <strong>{formatarKwanza(pedidoCriado.totalEmKwanza)}</strong>
            <span>Total do pedido</span>
          </div>
          <Button asChild>
            <Link to={ROTAS_LOJAS.market}>Continuar no Market</Link>
          </Button>
        </section>
      ) : (
        <section className="checkout-bizy-layout">
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
                        <small>{grupo.itens.length} item{grupo.itens.length === 1 ? "" : "s"} · {formatarKwanza(grupo.subtotalEmKwanza)}</small>
                      </div>
                      {grupo.urlLoja && <Link to={grupo.urlLoja}>Ver loja</Link>}
                    </header>
                    <div className="checkout-item-list">
                      {grupo.itens.map((item) => (
                        <div key={item.id} className="checkout-item-row">
                          <span className="checkout-item-media">
                            {item.fotoUrl ? <img src={item.fotoUrl} alt="" /> : <Package size={18} />}
                          </span>
                          <div>
                            <strong>{item.nomeProduto}</strong>
                            <small>{item.quantidade} x {formatarKwanza(item.precoUnitarioEmKwanza)}</small>
                          </div>
                          <button type="button" onClick={() => removerItem(item.id)} aria-label={`Remover ${item.nomeProduto}`}>
                            <Trash2 size={16} />
                          </button>
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
                  <strong>Compra multi-loja preparada, mas ainda não finalizada automaticamente.</strong>
                  <p>Não cria pedidos multi-loja sem backend de pedidos filhos. Por agora, finalize uma loja de cada vez para manter operação, entrega e dados isolados por fornecedor.</p>
                </div>
              </div>
            )}
          </div>

          <aside className="checkout-bizy-form">
            <div className="checkout-section-head">
              <span><Truck size={16} /> Dados e entrega</span>
              <em>{totais.totalLojas} loja{totais.totalLojas === 1 ? "" : "s"}</em>
            </div>

            <div className="checkout-form-grid">
              <Input value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} placeholder="Nome completo" />
              <Input value={cliente.telefone} onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} placeholder="WhatsApp" />
              <Input value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} placeholder="Email opcional" />
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
              <div><span>Entrega</span><strong>calculada pela loja</strong></div>
            </div>

            {mensagem && <p className="checkout-message" aria-live="polite">{mensagem}</p>}

            <Button
              type="button"
              className="checkout-submit"
              disabled={finalizando || !itens.length || checkoutMultiLoja}
              onClick={() => void finalizarCheckout()}
            >
              {finalizando ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              Finalizar checkout seguro
            </Button>
          </aside>
        </section>
      )}
    </main>
  );
}

function montarObservacaoCheckoutBizy(
  fornecedor: string,
  observacao: string,
  itens: ItemCarrinhoCheckoutBizy[]
): string {
  const resumo = itens.map((item) => `${item.quantidade}x #${item.codigoProduto} ${item.nomeProduto}`).join("; ");
  return [
    "Checkout Bizy unificado progressivo.",
    `Fornecedor: ${fornecedor}.`,
    `Itens: ${resumo}.`,
    observacao.trim() ? `Observação: ${observacao.trim()}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}
