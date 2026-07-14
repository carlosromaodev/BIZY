import { PackageSearch, ReceiptText, ShieldCheck, Store, Truck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guardarIdentificadorCompradorMarket, obterIdentificadorCompradorMarket, obterPortalCompradorMarket, ROTAS_LOJAS } from "../api";
import type { RespostaCompraEstados } from "../api";
import { formatarDataHoraCurta, formatarKwanza } from "../../../utilidades";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";

export function PaginaPortalComprador() {
  const [identificador, setIdentificador] = useState(() => obterIdentificadorCompradorMarket());
  const [compras, setCompras] = useState<RespostaCompraEstados[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function consultar(evento?: FormEvent<HTMLFormElement>) {
    evento?.preventDefault();
    if (identificador.trim().length < 5) return;
    setCarregando(true); setErro("");
    try {
      guardarIdentificadorCompradorMarket(identificador);
      const resposta = await obterPortalCompradorMarket(identificador.trim());
      setCompras(resposta.compras);
    } catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível consultar as compras."); }
    finally { setCarregando(false); }
  }

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-buyer-portal">
      <CabecalhoMarket />

      <section className="market-flow-heading">
        <span>Conta de comprador</span>
        <h1>Compras no Bizy Market</h1>
        <p>Consulte pedidos, pagamentos e entregas com o contacto usado no checkout.</p>
      </section>

      <section className="market-buyer-shell">
        <form onSubmit={(evento) => void consultar(evento)} className="market-buyer-search">
          <span className="flex items-center gap-2 text-xs font-semibold text-neutral-600"><ShieldCheck size={15} /> Acesso por relação de compra</span>
          <h2>Localizar as minhas compras</h2>
          <p>Use o telefone ou email informado no checkout.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={identificador} onChange={(evento) => setIdentificador(evento.target.value)} placeholder="Telefone ou email" aria-label="Telefone ou email" />
            <Button type="submit" disabled={carregando || identificador.trim().length < 5}>{carregando ? "A consultar..." : "Consultar"}</Button>
          </div>
          {erro && <p className="text-sm text-red-700" role="alert">{erro}</p>}
        </form>

        <div className="market-buyer-results">
          {!identificador.trim() && (
            <section className="market-buyer-guide">
              <span>Depois do checkout</span>
              <h2>Um número de compra, cada fornecedor acompanhado.</h2>
              <p>O portal consolida os pedidos sem esconder quem vende, recebe e entrega cada item.</p>
              <div>
                <span><ReceiptText size={17} /><strong>Compra</strong><small>total e pagamento num só lugar</small></span>
                <span><Store size={17} /><strong>Fornecedores</strong><small>pedidos separados por loja</small></span>
                <span><Truck size={17} /><strong>Entrega</strong><small>estado individual por fornecedor</small></span>
              </div>
            </section>
          )}
          {compras.map(({ compra, pedidosFilho }) => (
            <Link key={compra.id} to={`/compras/${compra.id}`} className="market-purchase-row">
              <div>
                <strong className="flex items-center gap-2"><ReceiptText size={16} /> Compra #{compra.numero}</strong>
                <span className="mt-1 block text-xs text-neutral-500">{formatarDataHoraCurta(compra.criadoEm)} · {pedidosFilho.length} fornecedor(es)</span>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-neutral-100 px-2 py-1">Pagamento {compra.estadoPagamento}</span>
                  <span className="rounded-md bg-neutral-100 px-2 py-1"><Truck size={12} className="inline" /> {pedidosFilho.filter((item) => item.estadoEntrega === "ENTREGUE").length}/{pedidosFilho.length} entregues</span>
                </div>
              </div>
              <div className="text-right">
                <strong>{formatarKwanza(compra.totalEmKwanza)}</strong>
                <span className="mt-1 block text-xs text-neutral-500">{compra.estado}</span>
              </div>
            </Link>
          ))}
          {!carregando && identificador && compras.length === 0 && (
            <div className="market-buyer-empty">
              <PackageSearch size={24} />
              <span>Nenhuma compra encontrada para este contacto.</span>
              <Link to={ROTAS_LOJAS.market} className="inline-flex items-center gap-1 font-semibold"><Store size={14} /> Continuar no Market</Link>
            </div>
          )}
        </div>
      </section>
      <RodapeMarket />
    </main>
  );
}
