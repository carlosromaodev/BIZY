import { ArrowLeft, PackageSearch, ReceiptText, ShieldCheck, Store, Truck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoBizy } from "../../../marca/bizy";
import { guardarIdentificadorCompradorMarket, obterIdentificadorCompradorMarket, obterPortalCompradorMarket, ROTAS_LOJAS } from "../api";
import type { RespostaCompraEstados } from "../api";
import { formatarDataHoraCurta, formatarKwanza } from "../../../utilidades";

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

  return <main className="min-h-[100dvh] bg-[#f5f3ed] text-neutral-950">
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4"><Link to={ROTAS_LOJAS.market} aria-label="Voltar ao Market" className="grid size-10 place-items-center rounded-lg border bg-white"><ArrowLeft size={18} /></Link><span className="inline-flex items-center gap-2 font-semibold"><LogoBizy variante="icone" style={{ width: 22, height: 22 }} /> Minhas compras</span><span className="size-10" /></header>
    <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-10">
      <form onSubmit={(evento) => void consultar(evento)} className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <span className="flex items-center gap-2 text-xs font-semibold text-neutral-600"><ShieldCheck size={15} /> Acesso por relação de compra</span>
        <h1 className="text-2xl font-bold">Compras no Bizy Market</h1><p className="text-sm text-neutral-600">Usa o telefone ou email informado no checkout.</p>
        <div className="flex flex-col gap-2 sm:flex-row"><Input value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder="Telefone ou email" aria-label="Telefone ou email" /><Button type="submit" disabled={carregando || identificador.trim().length < 5}>{carregando ? "A consultar..." : "Consultar"}</Button></div>{erro && <p className="text-sm text-red-700">{erro}</p>}
      </form>
      <div className="grid gap-3">{compras.map(({ compra, pedidosFilho }) => <Link key={compra.id} to={`/compras/${compra.id}`} className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <div><strong className="flex items-center gap-2"><ReceiptText size={16} /> Compra #{compra.numero}</strong><span className="mt-1 block text-xs text-neutral-500">{formatarDataHoraCurta(compra.criadoEm)} · {pedidosFilho.length} seller(s)</span><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-neutral-100 px-2 py-1">Pagamento {compra.estadoPagamento}</span><span className="rounded-md bg-neutral-100 px-2 py-1"><Truck size={12} className="inline" /> {pedidosFilho.filter((item) => item.estadoEntrega === "ENTREGUE").length}/{pedidosFilho.length} entregues</span></div></div>
        <div className="text-right"><strong>{formatarKwanza(compra.totalEmKwanza)}</strong><span className="mt-1 block text-xs text-neutral-500">{compra.estado}</span></div>
      </Link>)}{!carregando && identificador && compras.length === 0 && <div className="grid place-items-center gap-2 rounded-lg border border-neutral-200 bg-white py-10 text-sm text-neutral-600"><PackageSearch size={24} /><span>Consulta para veres as compras associadas.</span><Link to={ROTAS_LOJAS.market} className="inline-flex items-center gap-1 font-semibold"><Store size={14} /> Continuar no Market</Link></div>}</div>
    </section>
  </main>;
}
