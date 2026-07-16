import {
  AlertCircle,
  Check,
  Heart,
  LoaderCircle,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatarKwanza } from "../../../utilidades";
import {
  adicionarFavoritoContaBizy,
  adicionarItemCheckoutBizy,
  criarItemCheckoutDeProdutoMarket,
  removerFavoritoContaBizy
} from "../api";
import type { ProdutoMarketNormalizado } from "../api";

type EstadoAcaoCard = "idle" | "loading" | "added" | "error";

function formatarSelo(selo: string): string {
  return selo
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

export function CartaoProdutoMarket({
  produto,
  href = produto.urlMarket,
  mostrarFornecedor = true,
  mostrarAcoes = true
}: {
  produto: ProdutoMarketNormalizado;
  href?: string;
  mostrarFornecedor?: boolean;
  mostrarAcoes?: boolean;
}) {
  const navigate = useNavigate();
  const [favorito, setFavorito] = useState(false);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);
  const [erroImagem, setErroImagem] = useState(false);
  const [estadoAcao, setEstadoAcao] = useState<EstadoAcaoCard>("idle");
  const seloPrincipal = produto.selos.find((selo) => selo !== "PATROCINADO" && selo !== "VERIFICADO");
  const temVariantes = Object.values(produto.variantes).some((opcoes) => opcoes.length > 0);
  const disponivel = produto.disponivel && produto.quantidade > 0;
  const baixoStock = disponivel && produto.quantidade <= 3;

  async function alternarFavorito() {
    if (guardandoFavorito) return;
    setGuardandoFavorito(true);
    try {
      if (favorito) await removerFavoritoContaBizy(produto.slugLoja, produto.codigo);
      else await adicionarFavoritoContaBizy(produto.slugLoja, produto.codigo);
      setFavorito((actual) => !actual);
    } catch {
      navigate(`/conta/entrar?returnTo=${encodeURIComponent(window.location.pathname)}`);
    } finally {
      setGuardandoFavorito(false);
    }
  }

  function adicionarAoCarrinho() {
    if (!disponivel || temVariantes || estadoAcao === "loading") return;
    setEstadoAcao("loading");
    try {
      adicionarItemCheckoutBizy(criarItemCheckoutDeProdutoMarket(produto, 1, "market-card"));
      setEstadoAcao("added");
      window.setTimeout(() => setEstadoAcao("idle"), 2200);
    } catch {
      setEstadoAcao("error");
    }
  }

  const textoAcao = temVariantes
    ? "Escolher opções"
    : estadoAcao === "added"
      ? "Adicionado"
      : estadoAcao === "error"
        ? "Tentar novamente"
        : disponivel
          ? "Adicionar"
          : "Indisponível";

  return (
    <article className={`market-product-card${disponivel ? "" : " is-unavailable"}${baixoStock ? " is-low-stock" : ""}`}>
      <div className="market-product-media-wrap">
        <Link to={href} className="market-product-media" aria-label={`Ver ${produto.nome}`}>
          {produto.fotoPrincipal && !erroImagem ? (
            <img src={produto.fotoPrincipal} alt={produto.nome} loading="lazy" onError={() => setErroImagem(true)} />
          ) : (
            <span className="market-product-image-fallback"><Package size={32} /><small>Imagem indisponível</small></span>
          )}
          <span className="market-product-labels">
            {produto.descontoPercentual && <em>-{produto.descontoPercentual}%</em>}
            {produto.selos.includes("PATROCINADO") && <em className="is-sponsored">Patrocinado</em>}
            {!disponivel && <em className="is-unavailable">Indisponível</em>}
          </span>
        </Link>
        <button
          type="button"
          className={`market-product-favorite${favorito ? " is-active" : ""}`}
          onClick={() => void alternarFavorito()}
          aria-label={favorito ? `Remover ${produto.nome} dos favoritos` : `Adicionar ${produto.nome} aos favoritos`}
          aria-pressed={favorito}
          disabled={guardandoFavorito}
        >
          {guardandoFavorito ? <LoaderCircle className="market-spin" size={17} /> : <Heart size={17} fill={favorito ? "currentColor" : "none"} />}
        </button>
      </div>

      <div className="market-product-body">
        <span className="market-product-category">{produto.categoria || "Selecção Bizy"}</span>
        <Link to={href} className="market-product-name">{produto.nome}</Link>
        <div className="market-product-price">
          <strong>{formatarKwanza(produto.precoFinalEmKwanza)}</strong>
          {produto.precoAntigoEmKwanza && <span>{formatarKwanza(produto.precoAntigoEmKwanza)}</span>}
        </div>
        <div className="market-product-signal" aria-label="Sinais reais do produto">
          {seloPrincipal ? (
            <span><Tags size={12} />{formatarSelo(seloPrincipal)}</span>
          ) : (
            <span><ShieldCheck size={12} />Fornecedor identificado</span>
          )}
          {baixoStock && <span className="is-warning">Baixo stock</span>}
        </div>
        {mostrarFornecedor && (
          <Link to={produto.urlLoja} className="market-product-supplier">
            <Store size={13} />
            <span>{produto.nomeFornecedor}</span>
          </Link>
        )}
        <div className="market-product-meta">
          <span className={disponivel ? (baixoStock ? "is-low" : "is-stocked") : "is-out"}>
            <i />
            {baixoStock ? `Restam ${produto.quantidade}` : disponivel ? "Em stock" : "Indisponível"}
          </span>
          <span><MapPin size={11} />{produto.fornecedor.localizacao || "Angola"}</span>
        </div>
      </div>

      {mostrarAcoes && (
        <footer className="market-product-actions">
          {temVariantes ? (
            <Link to={href} className="market-product-add"><ShoppingBag size={15} />{textoAcao}</Link>
          ) : (
            <button
              type="button"
              className={`market-product-add is-${estadoAcao}`}
              onClick={adicionarAoCarrinho}
              disabled={!disponivel || estadoAcao === "loading"}
            >
              {estadoAcao === "loading" ? <LoaderCircle className="market-spin" size={15} /> : estadoAcao === "added" ? <Check size={15} /> : estadoAcao === "error" ? <AlertCircle size={15} /> : <ShoppingBag size={15} />}
              {textoAcao}
            </button>
          )}
          <Link to={href} className="market-product-details">Ver detalhes</Link>
          <span className="market-sr-only" role="status" aria-live="polite">
            {estadoAcao === "added" ? `${produto.nome} adicionado ao carrinho.` : estadoAcao === "error" ? `Não foi possível adicionar ${produto.nome}.` : ""}
          </span>
        </footer>
      )}
    </article>
  );
}
