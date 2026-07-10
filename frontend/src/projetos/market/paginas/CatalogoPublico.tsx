import { ArrowLeft, Heart, Loader2, MapPin, Package, ShieldCheck, Store, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obterCatalogoPublico, normalizarProdutoLojaPublica, ROTAS_LOJAS } from "../api";
import type { RespostaCatalogoPublico } from "../api";
import type { ProdutoMarketNormalizado } from "../api";
import { formatarKwanza, aplicarSeoMetaTags, montarSeoPublico } from "../../../utilidades";
import { resolverUrlMedia } from "../../../api";

function formatarSeloCatalogo(selo: string): string {
  return selo
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

export function PaginaCatalogoPublico() {
  const { slug = "", catalogo: catalogoId = "" } = useParams<{ slug: string; catalogo: string }>();
  const navigate = useNavigate();
  const [dados, setDados] = useState<RespostaCatalogoPublico | null>(null);
  const [produtos, setProdutos] = useState<ProdutoMarketNormalizado[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await obterCatalogoPublico(slug, catalogoId);
        if (!ativo) return;
        setDados(resposta);
        setProdutos((resposta.produtos ?? []).map((p) => normalizarProdutoLojaPublica(p, resposta.loja?.slug)));
        limparSeo = aplicarSeoMetaTags(resposta.seo ?? montarSeoPublico({
          titulo: `${resposta.catalogo?.nome ?? catalogoId} | Bizy`,
          descricao: resposta.catalogo?.descricao ?? `Catálogo público de ${resposta.loja?.nomeComercial ?? slug} no Bizy.`,
          canonicalPath: ROTAS_LOJAS.catalogoLoja(slug, catalogoId),
          imagem: resposta.loja?.logoUrl ?? undefined
        }));
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o catálogo.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (slug && catalogoId) void carregar();
    return () => { ativo = false; limparSeo(); };
  }, [slug, catalogoId]);

  if (carregando) {
    return (
      <main className="bizy-market-page market-commerce-page min-h-dvh bg-[#faf8f4] text-neutral-950">
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="animate-spin text-neutral-400" size={28} />
        </div>
      </main>
    );
  }

  if (erro || !dados) {
    return (
      <main className="bizy-market-page market-commerce-page min-h-dvh bg-[#faf8f4] text-neutral-950">
        <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
          <Package className="text-neutral-300" size={40} />
          <p className="text-sm text-neutral-500">{erro || "Catálogo não encontrado."}</p>
          <button
            className="mt-2 text-sm font-medium text-neutral-700 underline underline-offset-4"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  const { catalogo, loja } = dados;
  const nomeLoja = loja?.nomeComercial ?? slug;
  const logoUrl = resolverUrlMedia(loja?.logoUrl);
  const localizacao = [loja?.municipio, loja?.provincia].filter(Boolean).join(", ");

  return (
    <main className="bizy-market-page market-commerce-page min-h-dvh bg-[#faf8f4] text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/60 bg-[#faf8f4]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
            onClick={() => navigate(ROTAS_LOJAS.loja(slug))}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{nomeLoja}</span>
          </button>
          <span className="text-neutral-300">/</span>
          <h1 className="truncate text-sm font-semibold text-neutral-900">{catalogo.nome}</h1>
          <span className="ml-auto text-xs text-neutral-400">{catalogo.totalProdutos} produto{catalogo.totalProdutos !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex items-start gap-3">
          {logoUrl ? (
            <Link to={ROTAS_LOJAS.loja(slug)}>
              <img src={logoUrl} alt={nomeLoja} className="size-10 rounded-full object-cover" />
            </Link>
          ) : (
            <Link to={ROTAS_LOJAS.loja(slug)} className="grid size-10 place-items-center rounded-full bg-neutral-200">
              <Store size={16} className="text-neutral-500" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <Link to={ROTAS_LOJAS.loja(slug)} className="text-sm font-medium text-neutral-700 hover:underline">{nomeLoja}</Link>
            {catalogo.descricao && <p className="mt-0.5 text-xs text-neutral-500">{catalogo.descricao}</p>}
            {localizacao && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                <MapPin size={11} />
                {localizacao}
              </p>
            )}
          </div>
        </div>

        {produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <Package className="text-neutral-300" size={32} />
            <p className="text-sm text-neutral-500">Este catálogo ainda não tem produtos disponíveis.</p>
          </div>
        ) : (
          <div className="market-product-grid">
            {produtos.map((produto) => (
              <CartaoProdutoCatalogo key={produto.codigo} produto={produto} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CartaoProdutoCatalogo({ produto }: { produto: ProdutoMarketNormalizado }) {
  const seloPrincipal = produto.selos.find((selo) => selo !== "PATROCINADO");
  return (
    <article className="market-product-card">
      <Link to={produto.urlProduto} className="market-product-media" aria-label={`Ver ${produto.nome}`}>
        {produto.fotoPrincipal ? <img src={produto.fotoPrincipal} alt={produto.nome} /> : <Package size={34} />}
        <span className="market-product-favorite" aria-hidden="true"><Heart size={14} /></span>
        {produto.descontoPercentual && <span>-{produto.descontoPercentual}%</span>}
      </Link>
      <div className="market-product-body">
        <Link to={produto.urlProduto} className="market-product-name">{produto.nome}</Link>
        <div className="market-product-price">
          <strong>{formatarKwanza(produto.precoFinalEmKwanza)}</strong>
          {produto.precoAntigoEmKwanza && <span>{formatarKwanza(produto.precoAntigoEmKwanza)}</span>}
        </div>
        <div className="market-product-signal" aria-label="Sinais reais do produto">
          {seloPrincipal ? (
            <span><Tags size={13} />{formatarSeloCatalogo(seloPrincipal)}</span>
          ) : (
            <span><ShieldCheck size={13} />Fornecedor identificado</span>
          )}
          {produto.emPromocao && <span>Promoção</span>}
        </div>
        <div className="market-product-meta">
          <span className={produto.quantidade > 3 ? "is-stocked" : "is-low"}>
            <i />
            {produto.quantidade > 3 ? "Em stock" : produto.quantidade > 0 ? `Restam ${produto.quantidade}` : "Sob consulta"}
          </span>
          {produto.fornecedor.localizacao && (
            <span>
              <MapPin size={11} />
              {produto.fornecedor.localizacao}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
