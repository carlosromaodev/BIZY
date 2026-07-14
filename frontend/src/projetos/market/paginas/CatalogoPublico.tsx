import { ArrowLeft, Loader2, MapPin, Package, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obterCatalogoPublico, normalizarProdutoLojaPublica, ROTAS_LOJAS } from "../api";
import type { RespostaCatalogoPublico } from "../api";
import type { ProdutoMarketNormalizado } from "../api";
import { aplicarSeoMetaTags, montarSeoPublico } from "../../../utilidades";
import { resolverUrlMedia } from "../../../api";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";
import { CartaoProdutoMarket } from "../componentes/CartaoProdutoMarket";

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

  const cabecalhoBase = <CabecalhoMarket />;

  if (carregando) {
    return (
      <main className="bizy-market-page market-commerce-page market-public-page">
        {cabecalhoBase}
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="animate-spin text-neutral-400" size={28} />
        </div>
        <RodapeMarket />
      </main>
    );
  }

  if (erro || !dados) {
    return (
      <main className="bizy-market-page market-commerce-page market-public-page">
        {cabecalhoBase}
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
        <RodapeMarket />
      </main>
    );
  }

  const { catalogo, loja } = dados;
  const nomeLoja = loja?.nomeComercial ?? slug;
  const logoUrl = resolverUrlMedia(loja?.logoUrl);
  const localizacao = [loja?.municipio, loja?.provincia].filter(Boolean).join(", ");

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-catalog-page">
      {cabecalhoBase}
      <section className="market-catalog-heading">
        <div className="market-catalog-breadcrumb">
          <button
            type="button"
            onClick={() => navigate(ROTAS_LOJAS.loja(slug))}
          >
            <ArrowLeft size={16} />
            {nomeLoja}
          </button>
          <span>/</span>
          <span>{catalogo.nome}</span>
        </div>
        <div className="market-catalog-title-row">
          {logoUrl ? (
            <Link to={ROTAS_LOJAS.loja(slug)} className="market-catalog-logo">
              <img src={logoUrl} alt={nomeLoja} />
            </Link>
          ) : (
            <Link to={ROTAS_LOJAS.loja(slug)} className="market-catalog-logo">
              <Store size={18} />
            </Link>
          )}
          <div>
            <span>Catálogo de {nomeLoja}</span>
            <h1>{catalogo.nome}</h1>
            {catalogo.descricao && <p>{catalogo.descricao}</p>}
            {localizacao && (
              <small>
                <MapPin size={11} />
                {localizacao}
              </small>
            )}
          </div>
          <strong>{catalogo.totalProdutos} produto{catalogo.totalProdutos !== 1 ? "s" : ""}</strong>
        </div>
      </section>

      <section className="market-catalog-products">
        {produtos.length === 0 ? (
          <div className="market-empty-state">
            <Package size={32} />
            <strong>Catálogo sem produtos disponíveis</strong>
            <span>Volte à loja para explorar as outras coleções.</span>
          </div>
        ) : (
          <div className="market-product-grid">
            {produtos.map((produto) => (
              <CartaoProdutoMarket key={produto.codigo} produto={produto} href={produto.urlProduto} mostrarFornecedor={false} />
            ))}
          </div>
        )}
      </section>
      <RodapeMarket />
    </main>
  );
}
