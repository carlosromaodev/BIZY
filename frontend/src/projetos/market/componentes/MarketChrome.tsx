import { ChevronDown, Menu, Search, ShoppingBag, Store, Truck, User, X } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy } from "../../../marca/bizy";
import type { CategoriaMarket } from "../api";
import { ROTAS_LOJAS } from "../api";

const DEPARTAMENTOS_PADRAO = ["Moda", "Beleza", "Casa", "Tecnologia", "Comida", "Serviços"];

export function MarcaMarket({ escura = false }: { escura?: boolean }) {
  return (
    <span className="market-brand-lockup-inner">
      <LogoBizy
        className="market-brand-logo"
        cores={escura ? CORES_LOGO_BIZY_ESCURA : undefined}
        titulo="Bizy"
      />
      <span className="market-tag mtag">Market</span>
    </span>
  );
}

export function CabecalhoMarket({
  busca: buscaControlada,
  categoriaSelecionada = "",
  categorias = [],
  onBusca,
  onCategoria,
  onLimpar,
  onSubmitBusca,
  placeholder = "Buscar produtos, lojas e categorias"
}: {
  busca?: string;
  categoriaSelecionada?: string;
  categorias?: CategoriaMarket[];
  onBusca?: (valor: string) => void;
  onCategoria?: (categoria: string) => void;
  onLimpar?: () => void;
  onSubmitBusca?: (valor: string) => void;
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const [buscaInterna, setBuscaInterna] = useState("");
  const busca = buscaControlada ?? buscaInterna;
  const departamentos = categorias.length
    ? categorias.slice(0, 6).map((categoria) => categoria.categoria)
    : DEPARTAMENTOS_PADRAO;

  function alterarBusca(valor: string) {
    if (buscaControlada === undefined) setBuscaInterna(valor);
    onBusca?.(valor);
  }

  function limparCabecalho() {
    if (buscaControlada === undefined) setBuscaInterna("");
    if (onLimpar) onLimpar();
    else navigate(ROTAS_LOJAS.market);
  }

  function selecionarCategoria(categoria: string) {
    if (onCategoria) onCategoria(categoria);
    else navigate(ROTAS_LOJAS.categoriaMarket(categoria));
  }

  function submeterBusca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const termo = busca.trim();
    if (onSubmitBusca) onSubmitBusca(termo);
    else navigate(termo ? `${ROTAS_LOJAS.market}?busca=${encodeURIComponent(termo)}` : ROTAS_LOJAS.market);
  }

  return (
    <header className="market-ecom-shell" aria-label="Cabeçalho do Bizy Market">
      <div className="market-util util" aria-label="Benefícios do Bizy Market">
        <span className="l"><Truck size={14} />Fornecedor visível · checkout unificado · preços em Kz</span>
        <span className="r"><Link to="/login">Vender no Bizy</Link><Link to={ROTAS_LOJAS.compras}>Acompanhar pedido</Link><span>PT · Kz</span></span>
      </div>

      <div className="market-ecom-header hd2">
        <Link to={ROTAS_LOJAS.market} className="market-brand-lockup" aria-label="Abrir Bizy Market">
          <MarcaMarket />
        </Link>

        <form className="market-ecom-search searchbar" role="search" onSubmit={submeterBusca}>
          <button type="button" className="market-ecom-search-dept catsel" onClick={limparCabecalho}>
            Todas as categorias
            <ChevronDown size={14} />
          </button>
          <Search className="market-ecom-search-icon" size={18} aria-hidden="true" />
          <input
            aria-label="Buscar no Bizy Market"
            value={busca}
            onChange={(evento) => alterarBusca(evento.target.value)}
            placeholder={categoriaSelecionada ? `Buscar em ${categoriaSelecionada}` : placeholder}
          />
          {busca && (
            <button type="button" className="market-ecom-clear" onClick={limparCabecalho} aria-label="Limpar busca e filtros">
              <X size={15} />
            </button>
          )}
          <button type="submit" className="market-ecom-submit go">
            <Search size={15} />
            Buscar
          </button>
        </form>

        <div className="market-ecom-actions" aria-label="Ações rápidas">
          <Link to={ROTAS_LOJAS.lojasMarket} className="market-action-icon act" aria-label="Abrir lojas">
            <Store size={20} />
            <span>Lojas</span>
          </Link>
          <Link to={ROTAS_LOJAS.checkout} className="market-action-icon act" aria-label="Abrir sacola">
            <ShoppingBag size={20} />
            <span>Sacola</span>
          </Link>
          <Link to="/login" className="market-action-icon act" aria-label="Abrir conta">
            <User size={20} />
            <span>Conta</span>
          </Link>
        </div>
      </div>

      <nav className="market-ecom-dept dept" aria-label="Departamentos do Market">
        <button type="button" className="market-ecom-menu all" onClick={limparCabecalho}>
          <Menu size={16} />
          Todas as categorias
        </button>
        <button type="button" className={!categoriaSelecionada ? "is-active" : ""} onClick={limparCabecalho}>
          Início
        </button>
        {departamentos.map((departamento) => (
          <button
            key={departamento}
            type="button"
            className={categoriaSelecionada === departamento ? "is-active" : ""}
            onClick={() => selecionarCategoria(departamento)}
          >
            {departamento}
          </button>
        ))}
        <span className="market-dept-special sp">
          <button type="button" className="fire" onClick={() => selecionarCategoria(departamentos[0] ?? "Promoções")}>Promoções</button>
          <button type="button" className="nw" onClick={() => selecionarCategoria(departamentos[1] ?? "Novidades")}>Novidades</button>
          <Link to={ROTAS_LOJAS.lojasMarket}>Lojas</Link>
        </span>
      </nav>
    </header>
  );
}

export function RodapeMarket() {
  const ano = new Date().getFullYear();
  return (
    <footer className="market-ecom-footer market-footer-v2">
      <div className="market-footer-inner">
        <div className="market-footer-top">
          <div className="market-footer-brand">
            <Link to={ROTAS_LOJAS.market} className="market-brand-lockup" aria-label="Abrir Bizy Market">
              <MarcaMarket escura />
            </Link>
            <p>Produtos de lojas angolanas, com fornecedor identificado e uma compra organizada do início ao fim.</p>
            <span className="market-footer-location">Luanda, Angola · Preços em Kz</span>
          </div>
          <div className="market-footer-cols">
            <div className="market-footer-col">
              <strong>Explorar</strong>
              <Link to={ROTAS_LOJAS.market}>Produtos</Link>
              <Link to={ROTAS_LOJAS.lojasMarket}>Lojas</Link>
              <Link to={ROTAS_LOJAS.checkout}>Sacola</Link>
            </div>
            <div className="market-footer-col">
              <strong>Compras</strong>
              <Link to={ROTAS_LOJAS.compras}>Acompanhar pedido</Link>
              <Link to={ROTAS_LOJAS.checkout}>Finalizar compra</Link>
            </div>
            <div className="market-footer-col">
              <strong>Vendedores</strong>
              <Link to="/login">Entrar no Team</Link>
              <Link to="/onboarding">Criar loja</Link>
            </div>
          </div>
        </div>
        <div className="market-footer-bottom">
          <span>&copy; {ano} Bizy. Todos os direitos reservados.</span>
          <span>Market · Compra clara entre lojas independentes</span>
        </div>
      </div>
    </footer>
  );
}

export function MarketPublicPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`bizy-market-page market-commerce-page market-public-page ${className}`.trim()}>{children}</main>;
}
