import { ArrowLeft, CheckCircle2, Clock3, CreditCard, Home, PackageCheck, PackageX, ReceiptText, ShieldCheck, Store, Truck } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoBizy } from "../../../marca/bizy";
import { enviarComprovativoPagamentoUnificado, obterCompraUnificada, ROTAS_LOJAS } from "../api";
import type { PedidoFilhoAcompanhamento, RespostaCompraEstados } from "../api";
import { formatarDataHoraCurta, formatarKwanza } from "../../../utilidades";

function textoEstado(valor: string | null | undefined): string {
  if (!valor) return "Em análise";
  return valor
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\p{L}/u, (letra) => letra.toUpperCase());
}

function iconeEstado(estado: string) {
  if (/cancel/i.test(estado)) return PackageX;
  if (/entreg|pago|confirm/i.test(estado)) return CheckCircle2;
  if (/process|prepar|pagamento/i.test(estado)) return PackageCheck;
  return Clock3;
}

function corEstado(estado: string) {
  if (/cancel/i.test(estado)) return "border-red-200 bg-red-50 text-red-700";
  if (/entreg|pago|confirm/i.test(estado)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (/process|prepar|pagamento/i.test(estado)) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-neutral-200 bg-white text-neutral-700";
}

function resumoFornecedor(pedido: PedidoFilhoAcompanhamento, indice: number) {
  const Icone = iconeEstado(`${pedido.estado} ${pedido.estadoPagamento} ${pedido.estadoEntrega}`);
  return (
    <article key={pedido.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-700">
            <Store size={18} />
          </span>
          <div>
            <strong className="block text-sm text-neutral-950">Fornecedor {indice + 1}</strong>
            <span className="text-xs text-neutral-500">Pedido separado dentro da compra Bizy</span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${corEstado(pedido.estado)}`}>
          <Icone size={13} />
          {textoEstado(pedido.estado)}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-neutral-500">Pagamento</dt>
          <dd className="font-semibold text-neutral-900">{textoEstado(pedido.estadoPagamento)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Entrega</dt>
          <dd className="font-semibold text-neutral-900">{textoEstado(pedido.estadoEntrega)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Total</dt>
          <dd className="font-semibold text-neutral-900">{formatarKwanza(pedido.totalEmKwanza)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function PaginaCompraUnificada() {
  const { id = "" } = useParams();
  const [dados, setDados] = useState<RespostaCompraEstados | null>(null);
  const [erro, setErro] = useState("");
  const [comprovativoUrl, setComprovativoUrl] = useState("");
  const [mensagemPagamento, setMensagemPagamento] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviandoComprovativo, setEnviandoComprovativo] = useState(false);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const existia = Boolean(meta);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    document.title = "Acompanhar compra | Bizy";

    return () => {
      if (!existia) meta?.remove();
      else meta?.setAttribute("content", "index, follow");
      document.title = "Bizy";
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await obterCompraUnificada(id);
        if (!ativo) return;
        setDados(resposta);
      } catch {
        if (!ativo) return;
        setErro("Não encontrámos esta compra. Confirma se o link está completo.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (id.trim()) void carregar();
    else {
      setErro("Link de compra inválido.");
      setCarregando(false);
    }

    return () => {
      ativo = false;
    };
  }, [id]);

  const estadoPrincipal = dados?.compra.estado ?? "";
  const IconeEstado = useMemo(() => iconeEstado(estadoPrincipal), [estadoPrincipal]);
  const podeEnviarComprovativo = dados?.compra.estadoPagamento === "PENDENTE";

  async function enviarComprovativo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagemPagamento("");

    let url: URL;
    try {
      url = new URL(comprovativoUrl.trim());
    } catch {
      setMensagemPagamento("Informa um link completo do comprovativo.");
      return;
    }

    if (url.protocol !== "https:") {
      setMensagemPagamento("Usa um link HTTPS para proteger o comprovativo.");
      return;
    }

    setEnviandoComprovativo(true);
    try {
      const resposta = await enviarComprovativoPagamentoUnificado(id, url.toString());
      setDados(resposta);
      setComprovativoUrl("");
      setMensagemPagamento("Comprovativo recebido. A loja vai validar o pagamento.");
    } catch {
      setMensagemPagamento("Não foi possível enviar o comprovativo. Tenta novamente.");
    } finally {
      setEnviandoComprovativo(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5f3ed] text-neutral-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to={ROTAS_LOJAS.checkout} className="grid size-10 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-700" aria-label="Voltar ao checkout">
          <ArrowLeft size={18} />
        </Link>
        <Link to={ROTAS_LOJAS.market} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <LogoBizy variante="icone" style={{ width: 22, height: 22 }} />
          <span>Bizy Market</span>
        </Link>
        <Link to="/" className="grid size-10 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-700" aria-label="Início">
          <Home size={18} />
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-5 px-4 pb-10">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            <ShieldCheck size={14} />
            Acompanhamento seguro
          </span>

          {carregando ? (
            <div className="mt-6 grid place-items-center gap-3 py-12 text-center text-neutral-600">
              <Clock3 className="animate-spin" size={28} />
              <p>A carregar estado da compra...</p>
            </div>
          ) : erro ? (
            <div className="mt-6 grid gap-4 py-8">
              <h1 className="text-2xl font-bold text-neutral-950">Compra não encontrada</h1>
              <p className="max-w-xl text-sm text-neutral-600">{erro}</p>
              <Button asChild className="w-fit">
                <Link to={ROTAS_LOJAS.market}>Voltar ao Market</Link>
              </Button>
            </div>
          ) : dados ? (
            <div className="mt-6 grid gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-normal text-neutral-950">Compra #{dados.compra.numero}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                    Estado consolidado da compra e dos pedidos separados por fornecedor.
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${corEstado(dados.compra.estado)}`}>
                  <IconeEstado size={15} />
                  {textoEstado(dados.compra.estado)}
                </span>
              </div>

              <dl className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">Total</dt>
                  <dd className="mt-1 text-lg font-bold text-neutral-950">{formatarKwanza(dados.compra.totalEmKwanza)}</dd>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">Pagamento</dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-950">{textoEstado(dados.compra.estadoPagamento)}</dd>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">Fornecedores</dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-950">{dados.pedidosFilho.length}</dd>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">Criada em</dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-950">{formatarDataHoraCurta(dados.compra.criadoEm)}</dd>
                </div>
              </dl>

              {podeEnviarComprovativo && (
                <form onSubmit={(evento) => void enviarComprovativo(evento)} className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-neutral-700">
                      <CreditCard size={17} />
                    </span>
                    <div>
                      <strong className="block text-sm text-neutral-950">Enviar comprovativo</strong>
                      <span className="text-xs text-neutral-600">A loja valida o pagamento antes de preparar os pedidos.</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={comprovativoUrl}
                      onChange={(evento) => setComprovativoUrl(evento.target.value)}
                      placeholder="https://..."
                      inputMode="url"
                      aria-label="Link HTTPS do comprovativo"
                    />
                    <Button type="submit" disabled={enviandoComprovativo || !comprovativoUrl.trim()}>
                      {enviandoComprovativo ? "A enviar..." : "Enviar"}
                    </Button>
                  </div>
                  {mensagemPagamento && <p className="text-xs font-medium text-neutral-700" aria-live="polite">{mensagemPagamento}</p>}
                </form>
              )}
            </div>
          ) : null}
        </div>

        {dados && (
          <section className="grid gap-3" aria-label="Pedidos por fornecedor">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <ReceiptText size={16} />
              Pedidos da compra
            </div>
            {dados.pedidosFilho.map(resumoFornecedor)}

            <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 text-neutral-500" size={18} />
                <p>
                  A loja responsável por cada pedido confirma pagamento, preparação e entrega pelos canais combinados no checkout.
                </p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
