import { ArrowUpRight, MapPin, Package, ShieldCheck, Store } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { FornecedorMarketNormalizado } from "../api";

export interface LojaCardMarket extends FornecedorMarketNormalizado {
  totalProdutos: number;
  categorias?: string[];
}

export function CartaoLojaMarket({ loja }: { loja: LojaCardMarket }) {
  const [falhaCapa, setFalhaCapa] = useState(false);
  const [falhaLogo, setFalhaLogo] = useState(false);
  const categorias = (loja.categorias ?? []).filter(Boolean).slice(0, 2);

  return (
    <article className="market-store-card">
      <Link
        to={loja.urlLoja}
        className={`market-store-cover${loja.capaUrl && !falhaCapa ? "" : " is-placeholder"}`}
        aria-label={`Abrir ${loja.nomeComercial}`}
      >
        {loja.capaUrl && !falhaCapa ? (
          <img src={loja.capaUrl} alt="" loading="lazy" onError={() => setFalhaCapa(true)} />
        ) : (
          <span aria-hidden="true"><Store size={30} /></span>
        )}
        <span className="market-store-count"><Package size={13} />{loja.totalProdutos} produto{loja.totalProdutos === 1 ? "" : "s"}</span>
      </Link>

      <div className="market-store-card-body">
        <span className="market-store-avatar">
          {loja.logoUrl && !falhaLogo ? (
            <img src={loja.logoUrl} alt="" loading="lazy" onError={() => setFalhaLogo(true)} />
          ) : (
            <Store size={21} />
          )}
        </span>
        <div className="market-store-identity">
          <Link to={loja.urlLoja}>{loja.nomeComercial}</Link>
          <span><MapPin size={12} />{loja.localizacao || "Angola"}</span>
        </div>
        <p>{loja.descricaoPublica || loja.segmento || "Loja independente com catálogo publicado no Bizy Market."}</p>
        <div className="market-store-badges">
          <em><ShieldCheck size={12} />Fornecedor identificado</em>
          {categorias.map((categoria) => <em key={categoria}>{categoria}</em>)}
        </div>
        <Link to={loja.urlLoja} className="market-store-enter">Entrar na loja<ArrowUpRight size={15} /></Link>
      </div>
    </article>
  );
}
