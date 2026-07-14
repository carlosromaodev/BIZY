import { KeyRound, LogOut, PackageSearch, ReceiptText, ShieldCheck, Store, Truck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmarOtpContaBizy,
  encerrarSessaoContaBizy,
  obterComprasContaBizy,
  obterSessaoContaBizy,
  ROTAS_LOJAS,
  solicitarOtpContaBizy
} from "../api";
import type { ContaBizyPublica, RespostaCompraEstados } from "../api";
import { formatarDataHoraCurta, formatarKwanza } from "../../../utilidades";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";

export function PaginaPortalComprador() {
  const [conta, setConta] = useState<ContaBizyPublica | null>(null);
  const [compras, setCompras] = useState<RespostaCompraEstados[]>([]);
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoSolicitado, setCodigoSolicitado] = useState(false);
  const [codigoDev, setCodigoDev] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      try {
        const sessao = await obterSessaoContaBizy();
        const resultado = await obterComprasContaBizy();
        if (!ativo) return;
        setConta(sessao.conta);
        setCompras(resultado.compras);
      } catch {
        if (ativo) setConta(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  async function solicitarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resposta = await solicitarOtpContaBizy({ telefone, finalidade: "LOGIN" });
      setCodigoSolicitado(true);
      setCodigoDev(resposta.codigoDev ?? "");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível enviar o código.");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const sessao = await confirmarOtpContaBizy({ telefone, codigo, finalidade: "LOGIN" });
      const resultado = await obterComprasContaBizy();
      setConta(sessao.conta);
      setCompras(resultado.compras);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Código inválido ou expirado.");
    } finally {
      setCarregando(false);
    }
  }

  async function sair() {
    await encerrarSessaoContaBizy();
    setConta(null);
    setCompras([]);
    setTelefone("");
    setCodigo("");
    setCodigoDev("");
    setCodigoSolicitado(false);
  }

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-buyer-portal">
      <CabecalhoMarket />
      <section className="market-flow-heading">
        <span>Conta de comprador</span>
        <h1>Compras no Bizy Market</h1>
        <p>Acesso passwordless protegido por código de uso único.</p>
      </section>

      <section className="market-buyer-shell">
        {!conta ? (
          <form onSubmit={codigoSolicitado ? confirmarCodigo : solicitarCodigo} className="market-buyer-search">
            <span className="flex items-center gap-2 text-xs font-semibold text-neutral-600"><ShieldCheck size={15} /> Sessão segura e revogável</span>
            <h2>{codigoSolicitado ? "Confirmar código" : "Entrar na conta Bizy"}</h2>
            <p>{codigoSolicitado ? "Insira o código de 6 dígitos enviado por SMS." : "Use o telefone das suas compras para receber um código."}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {codigoSolicitado ? (
                <Input value={codigo} onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" aria-label="Código de acesso" />
              ) : (
                <Input value={telefone} onChange={(evento) => setTelefone(evento.target.value)} placeholder="Telefone" inputMode="tel" autoComplete="tel" aria-label="Telefone" />
              )}
              <Button type="submit" disabled={carregando || (codigoSolicitado ? codigo.length !== 6 : telefone.trim().length < 9)}>
                <KeyRound size={15} /> {carregando ? "A processar..." : codigoSolicitado ? "Entrar" : "Receber código"}
              </Button>
            </div>
            {codigoDev && <p className="text-xs text-neutral-600">Código de desenvolvimento: <strong>{codigoDev}</strong></p>}
            {codigoSolicitado && <button type="button" className="w-fit text-xs font-semibold underline" onClick={() => { setCodigoSolicitado(false); setCodigo(""); setErro(""); }}>Alterar telefone</button>}
            {erro && <p className="text-sm text-red-700" role="alert">{erro}</p>}
          </form>
        ) : (
          <section className="market-buyer-search">
            <span className="text-xs font-semibold text-neutral-500">Sessão activa</span>
            <h2>{conta.nome || "Conta Bizy"}</h2>
            <p>{conta.telefone}</p>
            <Button type="button" variant="outline" className="w-fit" onClick={() => void sair()}><LogOut size={15} /> Terminar sessão</Button>
          </section>
        )}

        <div className="market-buyer-results">
          {!conta && !carregando && (
            <section className="market-buyer-guide">
              <span>Uma conta Bizy</span>
              <h2>Todos os pedidos, sem expor o teu contacto.</h2>
              <p>Depois da confirmação, as compras do telefone verificado ficam associadas à conta.</p>
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
              <div className="text-right"><strong>{formatarKwanza(compra.totalEmKwanza)}</strong><span className="mt-1 block text-xs text-neutral-500">{compra.estado}</span></div>
            </Link>
          ))}
          {conta && !carregando && compras.length === 0 && (
            <div className="market-buyer-empty"><PackageSearch size={24} /><span>Ainda não existem compras nesta conta.</span><Link to={ROTAS_LOJAS.market} className="inline-flex items-center gap-1 font-semibold"><Store size={14} /> Continuar no Market</Link></div>
          )}
        </div>
      </section>
      <RodapeMarket />
    </main>
  );
}
