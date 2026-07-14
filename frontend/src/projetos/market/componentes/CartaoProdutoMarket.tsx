import { MapPin, Package, ShieldCheck, Store, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { formatarKwanza } from "../../../utilidades";
import type { ProdutoMarketNormalizado } from "../api";

function formatarSelo(selo: string): string {
  return selo
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

export function CartaoProdutoMarket({
  produto,
  href = produto.urlMarket,
  mostrarFornecedor = true
}: {
  produto: ProdutoMarketNormalizado;
  href?: string;
  mostrarFornecedor?: boolean;
}) {
  const seloPrincipal = produto.selos.find((selo) => selo !== "PATROCINADO");

  return (
    <article className="market-product-card">
      <Link to={href} className="market-product-media" aria-label={`Ver ${produto.nome}`}>
        {produto.fotoPrincipal ? <img src={produto.fotoPrincipal} alt={produto.nome} /> : <Package size={34} />}
        <span className="market-product-labels">
          {produto.descontoPercentual && <em>-{produto.descontoPercentual}%</em>}
          {produto.selos.includes("PATROCINADO") && <em className="is-sponsored">Patrocinado</em>}
        </span>
      </Link>
      <div className="market-product-body">
        <span className="market-product-category">{produto.categoria || "Seleção Bizy"}</span>
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
          {produto.emPromocao && <span>Promoção</span>}
        </div>
        {mostrarFornecedor && (
          <Link to={produto.urlLoja} className="market-product-supplier">
            <Store size={13} />
            <span>{produto.nomeFornecedor}</span>
          </Link>
        )}
        <div className="market-product-meta">
          <span className={produto.quantidade > 3 ? "is-stocked" : "is-low"}>
            <i />
            {produto.quantidade > 3 ? "Em stock" : produto.quantidade > 0 ? `Restam ${produto.quantidade}` : "Sob consulta"}
          </span>
          <span>
            <MapPin size={11} />
            {produto.fornecedor.localizacao || "Angola"}
          </span>
        </div>
      </div>
    </article>
  );
}
