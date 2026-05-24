import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Rocket,
  Store,
  UserRound
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obterUsuario, requisitarApi, type NegocioSessao } from "../api";
import { LogoBizy } from "../marca/bizy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const canaisDisponiveis = ["tiktok", "instagram", "whatsapp", "facebook"];
const pagamentosDisponiveis = ["transferencia", "multicaixa", "cash", "referencia"];
const imagemOnboarding = "/bizy-login-team.png";

interface EstadoOnboarding {
  negocio: NegocioSessao | null;
  pendencias: string[];
  completo: boolean;
}

export function PaginaOnboarding() {
  const navigate = useNavigate();
  const usuario = obterUsuario();
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null);
  const [passo, setPasso] = useState<"negocio" | "produto" | "pronto">("negocio");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("Completa os dados essenciais para o Bizy operar com contexto.");
  const [negocio, setNegocio] = useState({
    nomeComercial: "",
    segmento: "",
    tipo: "LOJA",
    telefone: usuario?.telefone ?? "",
    whatsapp: usuario?.telefone ?? "",
    email: usuario?.email ?? "",
    provincia: "Luanda",
    municipio: "",
    instagram: "",
    tiktok: "",
    canaisVenda: ["whatsapp"],
    metodosPagamento: ["transferencia"],
    minutosReservaPadrao: 10
  });
  const [produto, setProduto] = useState({
    codigo: "01",
    nome: "",
    categoria: "",
    descricao: "",
    precoEmKwanza: 0,
    quantidade: 1,
    fotos: [] as string[]
  });

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      try {
        const resposta = await requisitarApi<EstadoOnboarding>("/onboarding/estado");
        if (!ativo) return;
        setEstado(resposta);
        setPasso(resposta.negocio ? "produto" : "negocio");
        if (resposta.negocio) {
          setNegocio((atual) => ({
            ...atual,
            nomeComercial: resposta.negocio?.nomeComercial ?? atual.nomeComercial,
            segmento: resposta.negocio?.segmento ?? atual.segmento,
            tipo: resposta.negocio?.tipo ?? atual.tipo,
            telefone: resposta.negocio?.telefone ?? atual.telefone,
            whatsapp: resposta.negocio?.whatsapp ?? atual.whatsapp,
            email: resposta.negocio?.email ?? atual.email,
            provincia: resposta.negocio?.provincia ?? atual.provincia,
            municipio: resposta.negocio?.municipio ?? atual.municipio,
            canaisVenda: resposta.negocio?.canaisVenda?.length ? resposta.negocio.canaisVenda : atual.canaisVenda,
            metodosPagamento: resposta.negocio?.metodosPagamento?.length
              ? resposta.negocio.metodosPagamento
              : atual.metodosPagamento,
            minutosReservaPadrao: resposta.negocio?.minutosReservaPadrao ?? atual.minutosReservaPadrao
          }));
        }
      } catch (erro) {
        setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar o onboarding.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  async function salvarNegocio(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("A guardar dados do negócio...");

    try {
      const resposta = await requisitarApi<{ negocio: NegocioSessao }>("/onboarding/negocio", {
        method: "POST",
        body: negocio
      });
      setEstado((atual) => ({
        negocio: resposta.negocio,
        completo: true,
        pendencias: atual?.pendencias.filter((item) => item !== "CADASTRAR_NEGOCIO") ?? []
      }));
      setPasso("produto");
      setMensagem("Negócio guardado. Agora adiciona o primeiro produto para testar a live.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível guardar o negócio.");
    } finally {
      setSalvando(false);
    }
  }

  async function criarProduto(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("A criar produto inicial...");

    try {
      await requisitarApi("/onboarding/produto-inicial", {
        method: "POST",
        body: produto
      });
      setPasso("pronto");
      setMensagem("Base criada. O Bizy já tem negócio e produto inicial para operar.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  function alternarLista(campo: "canaisVenda" | "metodosPagamento", valor: string) {
    setNegocio((atual) => {
      const atualLista = atual[campo];
      const proxima = atualLista.includes(valor)
        ? atualLista.filter((item) => item !== valor)
        : [...atualLista, valor];
      return { ...atual, [campo]: proxima };
    });
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050706] text-white">
      <div aria-hidden className="absolute inset-0">
        <img
          alt=""
          className="h-full w-full object-cover opacity-20"
          src={imagemOnboarding}
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(216,255,114,0.07),transparent_28%),linear-gradient(180deg,rgba(5,7,6,0.46)_0%,rgba(5,7,6,0.94)_72%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid content-between gap-6 rounded-[1.75rem] border border-white/12 bg-[#050706]/76 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100dvh-2.5rem)]">
          <div className="grid gap-8">
            <LogoBizy />
            <div className="grid gap-3">
              <Badge className="w-fit gap-2 rounded-full border border-white/12 bg-[#d8ff72]/12 text-[#d8ff72] hover:bg-[#d8ff72]/12" variant="outline">
                <Rocket size={14} />
                Primeiro setup
              </Badge>
              <h1 className="font-heading text-4xl font-black leading-tight !text-white">Vamos montar a base da tua operação.</h1>
              <p className="text-sm leading-6 !text-white/68">
                Estes dados ajudam o CRM a relacionar clientes, produtos, mensagens, pagamentos e reservas desde o primeiro dia.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              ["negocio", "Negócio", Building2],
              ["produto", "Produto inicial", PackagePlus],
              ["pronto", "Operação pronta", CheckCircle2]
            ].map(([id, titulo, Icone], index) => (
              <div
                key={id as string}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-sm transition-all",
                  passo === id
                    ? "border-transparent bg-[#d8ff72] text-[#050706] shadow-[0_8px_22px_rgba(216,255,114,0.16)]"
                    : "border-white/12 bg-black/20 text-white/62"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full shadow-sm",
                    passo === id ? "bg-[#050706] text-[#d8ff72]" : "bg-white/8 text-white/70"
                  )}
                >
                  {index + 1}
                </span>
                <Icone size={18} />
                <strong>{titulo as string}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="grid content-center gap-4">
          <div className="rounded-[1.75rem] border border-white/12 bg-[#050706]/76 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            <div className="grid gap-5 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid gap-1">
                  <Badge variant="outline" className="w-fit border-white/12 bg-white/8 text-white/74">
                    {usuario?.origemCadastro ?? "Conta Bizy"}
                  </Badge>
                  <h2 className="font-heading text-2xl font-black !text-white">
                    {passo === "negocio" ? "Dados do negócio" : passo === "produto" ? "Primeiro produto" : "Tudo pronto"}
                  </h2>
                  <p className="text-sm leading-6 !text-white/68">{mensagem}</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-black/20 p-3">
                  <div className="grid size-10 place-items-center rounded-full bg-[#d8ff72] text-[#050706]">
                    <UserRound size={18} />
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm !text-white">{usuario?.nome ?? "Usuário Bizy"}</strong>
                    <span className="block truncate text-xs !text-white/58">
                      {usuario?.email ?? usuario?.telefone ?? "sessão ativa"}
                    </span>
                  </div>
                </div>
              </div>

              {carregando ? (
                <div className="grid min-h-80 place-items-center rounded-2xl border border-white/12 bg-black/20">
                  <Loader2 className="animate-spin text-[#d8ff72]" size={28} />
                </div>
              ) : passo === "negocio" ? (
                <form onSubmit={salvarNegocio} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Campo label="Nome comercial" id="nomeComercial">
                      <Input id="nomeComercial" value={negocio.nomeComercial} onChange={(e) => setNegocio({ ...negocio, nomeComercial: e.target.value })} required />
                    </Campo>
                    <Campo label="Segmento" id="segmento">
                      <Input id="segmento" value={negocio.segmento} onChange={(e) => setNegocio({ ...negocio, segmento: e.target.value })} placeholder="Moda, eletrônicos, cosméticos..." required />
                    </Campo>
                    <Campo label="WhatsApp oficial" id="whatsapp">
                      <Input id="whatsapp" value={negocio.whatsapp} onChange={(e) => setNegocio({ ...negocio, whatsapp: e.target.value })} inputMode="tel" />
                    </Campo>
                    <Campo label="Email" id="emailNegocio">
                      <Input id="emailNegocio" type="email" value={negocio.email} onChange={(e) => setNegocio({ ...negocio, email: e.target.value })} />
                    </Campo>
                    <Campo label="Província" id="provincia">
                      <Input id="provincia" value={negocio.provincia} onChange={(e) => setNegocio({ ...negocio, provincia: e.target.value })} />
                    </Campo>
                    <Campo label="Município" id="municipio">
                      <Input id="municipio" value={negocio.municipio} onChange={(e) => setNegocio({ ...negocio, municipio: e.target.value })} />
                    </Campo>
                  </div>

                  <SelecaoCompacta titulo="Canais de venda" itens={canaisDisponiveis} ativos={negocio.canaisVenda} onToggle={(valor) => alternarLista("canaisVenda", valor)} />
                  <SelecaoCompacta titulo="Métodos de pagamento" itens={pagamentosDisponiveis} ativos={negocio.metodosPagamento} onToggle={(valor) => alternarLista("metodosPagamento", valor)} />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Campo label="Reserva padrão em minutos" id="reservaMinutos">
                      <Input
                        id="reservaMinutos"
                        type="number"
                        min={1}
                        max={180}
                        value={negocio.minutosReservaPadrao}
                        onChange={(e) => setNegocio({ ...negocio, minutosReservaPadrao: Number(e.target.value) })}
                      />
                    </Campo>
                    <Button className="h-11 rounded-2xl bg-[#18733a] text-white hover:bg-[#219447] active:border-[#d8ff72] sm:self-end" disabled={salvando || !negocio.nomeComercial || !negocio.segmento}>
                      {salvando ? <Loader2 className="animate-spin" /> : <Store />}
                      Guardar negócio
                    </Button>
                  </div>
                </form>
              ) : passo === "produto" ? (
                <form onSubmit={criarProduto} className="grid gap-4">
                  <div className="rounded-2xl border border-white/12 bg-[#d8ff72]/10 p-4 text-sm text-[#d8ff72]">
                    Negócio ativo: <strong>{estado?.negocio?.nomeComercial ?? negocio.nomeComercial}</strong>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Campo label="Código da peça" id="codigoProduto">
                      <Input id="codigoProduto" value={produto.codigo} onChange={(e) => setProduto({ ...produto, codigo: e.target.value })} required />
                    </Campo>
                    <Campo label="Nome do produto" id="nomeProduto">
                      <Input id="nomeProduto" value={produto.nome} onChange={(e) => setProduto({ ...produto, nome: e.target.value })} required />
                    </Campo>
                    <Campo label="Categoria" id="categoriaProduto">
                      <Input id="categoriaProduto" value={produto.categoria} onChange={(e) => setProduto({ ...produto, categoria: e.target.value })} />
                    </Campo>
                    <Campo label="Preço em Kz" id="precoProduto">
                      <Input id="precoProduto" type="number" min={0} value={produto.precoEmKwanza} onChange={(e) => setProduto({ ...produto, precoEmKwanza: Number(e.target.value) })} required />
                    </Campo>
                    <Campo label="Stock" id="stockProduto">
                      <Input id="stockProduto" type="number" min={0} value={produto.quantidade} onChange={(e) => setProduto({ ...produto, quantidade: Number(e.target.value) })} required />
                    </Campo>
                  </div>
                  <Campo label="Descrição" id="descricaoProduto">
                    <Textarea id="descricaoProduto" value={produto.descricao} onChange={(e) => setProduto({ ...produto, descricao: e.target.value })} rows={4} />
                  </Campo>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" className="h-11 rounded-2xl border-white/16 bg-black/20 text-white hover:border-white/28 hover:bg-white/8 active:border-[#d8ff72]" onClick={() => navigate("/app")}>
                      Fazer depois
                    </Button>
                    <Button className="h-11 rounded-2xl bg-[#18733a] text-white hover:bg-[#219447] active:border-[#d8ff72]" disabled={salvando || !produto.codigo || !produto.nome}>
                      {salvando ? <Loader2 className="animate-spin" /> : <PackagePlus />}
                      Criar produto
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-5 rounded-[1.5rem] border border-white/12 bg-[#d8ff72]/10 p-6 text-[#d8ff72]">
                  <CheckCircle2 size={34} />
                  <div className="grid gap-2">
                    <h3 className="font-heading text-2xl font-black text-[#d8ff72]">A base do CRM está pronta.</h3>
                    <p className="max-w-xl text-sm leading-6 text-white/70">
                      Agora podes acompanhar painel, catálogo, comentários, pedidos e conversas com dados estruturados.
                    </p>
                  </div>
                  <Button className="h-11 w-fit rounded-2xl bg-[#18733a] text-white hover:bg-[#219447] active:border-[#d8ff72]" onClick={() => navigate("/app")}>
                    Entrar no painel
                    <ArrowRight />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Campo({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-white/82">{label}</Label>
      {children}
    </div>
  );
}

function SelecaoCompacta({
  titulo,
  itens,
  ativos,
  onToggle
}: {
  titulo: string;
  itens: string[];
  ativos: string[];
  onToggle: (valor: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-white/82">{titulo}</Label>
      <div className="flex flex-wrap gap-2">
        {itens.map((item) => (
          <button
            key={item}
            type="button"
            style={
              ativos.includes(item)
                ? { backgroundColor: "#d8ff72", border: "1px solid transparent", color: "#050706" }
                : { backgroundColor: "rgb(0 0 0 / 0.2)", border: "1px solid rgb(255 255 255 / 0.12)", color: "rgb(255 255 255 / 0.64)" }
            }
            className={cn(
              "h-9 rounded-full border px-4 text-sm font-semibold capitalize transition-all active:border-[#d8ff72]",
              ativos.includes(item)
                ? "border-transparent bg-[#d8ff72] text-[#050706]"
                : "border-white/12 bg-black/20 text-white/64 hover:border-white/24 hover:text-white"
            )}
            onClick={() => onToggle(item)}
            aria-pressed={ativos.includes(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
