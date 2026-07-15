import { ArrowRight, BadgeDollarSign, Play, ShoppingBag, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obterConteudoCompravel, type ConteudoCompravelPublico } from "../api/conteudoCompravel";
import { CabecalhoMarket, MarketPublicPage, RodapeMarket } from "../componentes/MarketChrome";

const formatarKwanza = (valor: number) => `${new Intl.NumberFormat("pt-AO").format(valor)} Kz`;

export function PaginaConteudoCompravel() {
  const { slug = "" } = useParams();
  const [dados, setDados] = useState<ConteudoCompravelPublico | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => { obterConteudoCompravel(slug).then(setDados).catch(() => setErro(true)); }, [slug]);
  if (erro) return <MarketPublicPage><CabecalhoMarket /><section className="market-route-state"><h1>Conteúdo indisponível</h1><Link to="/market">Voltar ao Market</Link></section><RodapeMarket /></MarketPublicPage>;
  if (!dados) return <MarketPublicPage><CabecalhoMarket /><div className="creator-loading">A carregar conteúdo...</div><RodapeMarket /></MarketPublicPage>;
  const { conteudo, produtos } = dados;
  return <MarketPublicPage className="shoppable-content-page">
    <CabecalhoMarket />
    <article className="shoppable-story">
      <header className="shoppable-story-hero">
        <div className="shoppable-story-media">{conteudo.thumbnailUrl ? <img src={conteudo.thumbnailUrl} alt={conteudo.titulo} /> : <div><Play size={38} /><span>{conteudo.tipo}</span></div>}</div>
        <div className="shoppable-story-copy"><span>{conteudo.tipo} · {conteudo.parceiro.nomePublico}</span><h1>{conteudo.titulo}</h1>{conteudo.legenda && <p>{conteudo.legenda}</p>}{dados.divulgacao && <div className="shoppable-disclosure"><BadgeDollarSign size={18} /><span>{dados.divulgacao}</span></div>}<a href="#produtos">Ver {produtos.length} produto(s)<ArrowRight size={18} /></a></div>
      </header>
      <section id="produtos" className="shoppable-products"><div className="market-section-title"><div><span>Selecionados no conteúdo</span><strong>Comprar esta seleção</strong></div><small>{new Set(produtos.map((p) => p.loja.slug)).size} loja(s)</small></div><div className="shoppable-product-grid">{produtos.map((produto) => <article key={produto.id} className="shoppable-product-card"><Link to={produto.url} className="shoppable-product-media">{produto.fotoUrl ? <img src={produto.fotoUrl} alt={produto.nome} /> : <ShoppingBag size={30} />}</Link><div><span><Store size={13} />{produto.loja.nome}</span><Link to={produto.url}><h2>{produto.nome}</h2></Link><strong>{formatarKwanza(produto.precoEmKwanza)}</strong><Link to={produto.url} className="shoppable-buy">Ver produto<ArrowRight size={15} /></Link></div></article>)}</div></section>
    </article>
    <RodapeMarket />
  </MarketPublicPage>;
}
export default PaginaConteudoCompravel;
