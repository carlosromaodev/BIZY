import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { importarCarrinhoPartilhavel, obterCarrinhoPartilhavel, type CarrinhoPartilhavelPublico } from "../api/carrinhosPartilhaveis";
import { CabecalhoMarket, MarketPublicPage, RodapeMarket } from "../componentes/MarketChrome";

const kwanza = (valor = 0) => `${new Intl.NumberFormat("pt-AO").format(valor)} Kz`;
export function PaginaCarrinhoPartilhavel() {
  const { codigo = "" } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState<CarrinhoPartilhavelPublico | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    obterCarrinhoPartilhavel(codigo)
      .then(setDados)
      .catch(() => setErro("Este carrinho não está disponível."));
  }, [codigo]);

  async function importar() {
    setOcupado(true);
    try {
      await importarCarrinhoPartilhavel(codigo);
      navigate("/checkout");
    } catch {
      setErro("Não foi possível adicionar os produtos disponíveis.");
      setOcupado(false);
    }
  }

  return (
    <MarketPublicPage className="shared-cart-page">
      <CabecalhoMarket />
      {erro ? (
        <section className="shared-cart-empty">
          <h1>Carrinho indisponível</h1>
          <p>{erro}</p>
          <Link to="/market">Explorar Market</Link>
        </section>
      ) : !dados ? (
        <section className="shared-cart-empty"><p>A carregar...</p></section>
      ) : (
        <section className="shared-cart-main">
          <header>
            <span>{dados.liveId ? "Seleção da live" : "Seleção partilhada"}</span>
            <h1>{dados.titulo}</h1>
            {dados.descricao && <p>{dados.descricao}</p>}
          </header>
          <section className="shared-cart-list">
            {dados.itens.map((item) => (
              <article key={`${item.slugLoja}-${item.codigoPeca}`}>
                <div className="shared-cart-image">
                  {item.fotoUrl ? <img src={item.fotoUrl} alt={item.nomeProduto} /> : <ShoppingBag size={28} />}
                </div>
                <div>
                  <span>{item.nomeFornecedor}</span>
                  <h2>{item.nomeProduto ?? item.codigoPeca}</h2>
                  <p>{Object.values(item.varianteSelecionada ?? {}).join(" / ")}</p>
                </div>
                <strong>{item.quantidade} × {kwanza(item.precoUnitarioEmKwanza)}</strong>
              </article>
            ))}
          </section>
          <aside className="shared-cart-summary">
            <div>
              <span>{dados.itens.length} produto(s)</span>
              <strong>{kwanza(dados.itens.reduce((total, item) => total + item.quantidade * (item.precoUnitarioEmKwanza ?? 0), 0))}</strong>
            </div>
            {dados.parceiroId && <p>O criador pode receber comissão nesta compra.</p>}
            <button type="button" onClick={importar} disabled={ocupado}>
              {ocupado ? "A adicionar..." : "Adicionar e continuar"}
            </button>
          </aside>
        </section>
      )}
      <RodapeMarket />
    </MarketPublicPage>
  );
}
export default PaginaCarrinhoPartilhavel;
