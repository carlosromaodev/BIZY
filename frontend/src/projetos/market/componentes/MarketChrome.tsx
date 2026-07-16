import {
  ChevronDown,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  User,
  UsersRound,
  X
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy } from "../../../marca/bizy";
import type { CategoriaMarket, LojaMarket, ProdutoMarketNormalizado, ResumoContaBizy } from "../api";
import {
  carregarCarrinhoCheckoutBizy,
  encerrarSessaoContaBizy,
  EVENTO_CARRINHO_BIZY,
  listarCategoriasMarket,
  listarLojasMarket,
  listarProdutosMarket,
  normalizarFornecedorMarket,
  normalizarProdutoMarket,
  obterEstadoContaBizy,
  obterResumoContaBizy,
  ROTAS_LOJAS
} from "../api";

const DEPARTAMENTOS_PADRAO = ["Moda", "Beleza", "Casa", "Tecnologia", "Comida", "Serviços"];
const CATEGORIAS_VAZIAS: CategoriaMarket[] = [];

interface SugestoesPesquisaMarket {
  produtos: ProdutoMarketNormalizado[];
  lojas: LojaMarket[];
  categorias: CategoriaMarket[];
}

const SUGESTOES_VAZIAS: SugestoesPesquisaMarket = { produtos: [], lojas: [], categorias: [] };

export function MarcaMarket({ escura = false }: { escura?: boolean }) {
  return (
    <span className="market-brand-lockup-inner">
      <LogoBizy className="market-brand-logo" cores={escura ? CORES_LOGO_BIZY_ESCURA : undefined} titulo="Bizy" />
      <span className="market-tag mtag">Market</span>
    </span>
  );
}

export function CabecalhoMarket({
  busca: buscaControlada,
  categoriaSelecionada = "",
  categorias = CATEGORIAS_VAZIAS,
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
  const sugestoesId = useId();
  const pesquisaRef = useRef<HTMLDivElement>(null);
  const [buscaInterna, setBuscaInterna] = useState("");
  const [conta, setConta] = useState<ResumoContaBizy | null>(null);
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(() =>
    carregarCarrinhoCheckoutBizy().reduce((total, item) => total + item.quantidade, 0)
  );
  const [sugestoes, setSugestoes] = useState<SugestoesPesquisaMarket>(SUGESTOES_VAZIAS);
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const busca = buscaControlada ?? buscaInterna;
  const buscaAdiada = useDeferredValue(busca.trim());
  const departamentos = categorias.length
    ? categorias.slice(0, 6).map((categoria) => categoria.categoria)
    : DEPARTAMENTOS_PADRAO;

  useEffect(() => {
    let ativo = true;
    void obterEstadoContaBizy()
      .then((estado) => estado.autenticada ? obterResumoContaBizy() : null)
      .then((resumo) => { if (ativo) setConta(resumo); })
      .catch(() => { if (ativo) setConta(null); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const actualizar = (evento: Event) => {
      const detalhe = (evento as CustomEvent<{ quantidade?: number }>).detail;
      setQuantidadeCarrinho(detalhe?.quantidade ?? carregarCarrinhoCheckoutBizy().reduce((total, item) => total + item.quantidade, 0));
    };
    window.addEventListener(EVENTO_CARRINHO_BIZY, actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener(EVENTO_CARRINHO_BIZY, actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  useEffect(() => {
    function fecharFora(evento: PointerEvent) {
      if (!pesquisaRef.current?.contains(evento.target as Node)) setSugestoesAbertas(false);
    }
    document.addEventListener("pointerdown", fecharFora);
    return () => document.removeEventListener("pointerdown", fecharFora);
  }, []);

  useEffect(() => {
    if (buscaAdiada.length < 2) {
      setSugestoes({ produtos: [], lojas: [], categorias: categorias.slice(0, 6) });
      setCarregandoSugestoes(false);
      return;
    }

    let ativo = true;
    setCarregandoSugestoes(true);
    const temporizador = window.setTimeout(() => {
      void Promise.all([
        listarProdutosMarket({ busca: buscaAdiada, limite: 5 }),
        listarLojasMarket({ busca: buscaAdiada, limite: 4 }),
        categorias.length ? Promise.resolve({ categorias, total: categorias.length }) : listarCategoriasMarket()
      ])
        .then(([respostaProdutos, respostaLojas, respostaCategorias]) => {
          if (!ativo) return;
          const termo = buscaAdiada.toLocaleLowerCase("pt-AO");
          setSugestoes({
            produtos: (respostaProdutos.produtos ?? []).slice(0, 5).map(normalizarProdutoMarket),
            lojas: (respostaLojas.lojas ?? []).slice(0, 4),
            categorias: (respostaCategorias.categorias ?? []).filter((item) => item.categoria.toLocaleLowerCase("pt-AO").includes(termo)).slice(0, 4)
          });
        })
        .catch(() => { if (ativo) setSugestoes(SUGESTOES_VAZIAS); })
        .finally(() => { if (ativo) setCarregandoSugestoes(false); });
    }, 180);

    return () => {
      ativo = false;
      window.clearTimeout(temporizador);
    };
  }, [buscaAdiada, categorias]);

  function alterarBusca(valor: string) {
    if (buscaControlada === undefined) setBuscaInterna(valor);
    onBusca?.(valor);
    setSugestoesAbertas(true);
  }

  function limparBusca() {
    if (buscaControlada === undefined) setBuscaInterna("");
    onBusca?.("");
    setSugestoesAbertas(false);
  }

  function limparCabecalho() {
    if (buscaControlada === undefined) setBuscaInterna("");
    setSugestoesAbertas(false);
    if (onLimpar) onLimpar();
    else navigate(ROTAS_LOJAS.market);
  }

  function selecionarCategoria(categoria: string) {
    setSugestoesAbertas(false);
    if (onCategoria) onCategoria(categoria);
    else navigate(ROTAS_LOJAS.categoriaMarket(categoria));
  }

  function executarBusca(termo: string) {
    setSugestoesAbertas(false);
    if (onSubmitBusca) onSubmitBusca(termo);
    else navigate(termo ? `${ROTAS_LOJAS.market}?busca=${encodeURIComponent(termo)}` : ROTAS_LOJAS.market);
  }

  function submeterBusca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    executarBusca(busca.trim());
  }

  function tratarTeclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      setSugestoesAbertas(false);
      evento.currentTarget.blur();
    }
  }

  const totalSugestoes = sugestoes.produtos.length + sugestoes.lojas.length + sugestoes.categorias.length;

  return (
    <header className="market-ecom-shell" aria-label="Cabeçalho do Bizy Market">
      <div className="market-util util" aria-label="Benefícios do Bizy Market">
        <span className="l"><Truck size={14} />Lojas identificadas · compra acompanhada · preços em Kz</span>
        <span className="r"><Link to="/login?returnTo=/onboarding&surface=team">Vender no Bizy</Link><Link to="/conta/compras">Acompanhar compra</Link><span>PT · Kz</span></span>
      </div>

      <div className="market-ecom-header hd2">
        <Link to={ROTAS_LOJAS.market} className="market-brand-lockup" aria-label="Abrir Bizy Market">
          <MarcaMarket />
        </Link>

        <div className="market-search-wrap" ref={pesquisaRef}>
          <form className="market-ecom-search searchbar" role="search" onSubmit={submeterBusca}>
            <button type="button" className="market-ecom-search-dept catsel" onClick={limparCabecalho}>
              Todas as categorias<ChevronDown size={14} />
            </button>
            <Search className="market-ecom-search-icon" size={18} aria-hidden="true" />
            <input
              type="search"
              role="combobox"
              aria-label="Buscar no Bizy Market"
              aria-autocomplete="list"
              aria-controls={sugestoesId}
              aria-expanded={sugestoesAbertas}
              value={busca}
              onChange={(evento) => alterarBusca(evento.target.value)}
              onFocus={() => setSugestoesAbertas(true)}
              onKeyDown={tratarTeclado}
              placeholder={categoriaSelecionada ? `Buscar em ${categoriaSelecionada}` : placeholder}
              autoComplete="off"
            />
            {busca && (
              <button type="button" className="market-ecom-clear" onClick={limparBusca} aria-label="Limpar pesquisa"><X size={15} /></button>
            )}
            <button type="submit" className="market-ecom-submit go"><Search size={15} />Buscar</button>
          </form>

          {sugestoesAbertas && (
            <div className="market-search-suggestions" id={sugestoesId} role="listbox" aria-label="Sugestões de pesquisa">
              {carregandoSugestoes ? (
                <div className="market-search-loading" role="status"><LoaderCircle className="market-spin" size={18} />A procurar no Market</div>
              ) : totalSugestoes > 0 ? (
                <>
                  {sugestoes.categorias.length > 0 && <section><strong>Categorias</strong>{sugestoes.categorias.map((categoria) => <button type="button" role="option" aria-selected="false" key={categoria.categoria} onClick={() => selecionarCategoria(categoria.categoria)}><Tag size={15} /><span>{categoria.categoria}<small>{categoria.total} produto{categoria.total === 1 ? "" : "s"}</small></span></button>)}</section>}
                  {sugestoes.produtos.length > 0 && <section><strong>Produtos</strong>{sugestoes.produtos.map((produto) => <Link role="option" aria-selected="false" key={produto.id} to={produto.urlMarket} onClick={() => setSugestoesAbertas(false)}>{produto.fotoPrincipal ? <img src={produto.fotoPrincipal} alt="" /> : <Package size={17} />}<span>{produto.nome}<small>{produto.nomeFornecedor}</small></span></Link>)}</section>}
                  {sugestoes.lojas.length > 0 && <section><strong>Lojas</strong>{sugestoes.lojas.map((loja) => { const normalizada = normalizarFornecedorMarket(loja); return <Link role="option" aria-selected="false" key={loja.slug || loja.nomeComercial} to={normalizada.urlLoja} onClick={() => setSugestoesAbertas(false)}>{normalizada.logoUrl ? <img src={normalizada.logoUrl} alt="" /> : <Store size={17} />}<span>{normalizada.nomeComercial}<small>{normalizada.localizacao || normalizada.segmento || "Loja Bizy"}</small></span></Link>; })}</section>}
                  {busca.trim() && <button type="button" className="market-search-all" onClick={() => executarBusca(busca.trim())}><Search size={15} />Ver todos os resultados para “{busca.trim()}”</button>}
                </>
              ) : buscaAdiada.length >= 2 ? (
                <div className="market-search-empty"><Search size={18} /><span>Nenhuma sugestão directa.<small>Podes pesquisar o termo completo no catálogo.</small></span></div>
              ) : (
                <div className="market-search-empty"><Tag size={18} /><span>Procura por produto, loja ou categoria.<small>Escreve pelo menos dois caracteres.</small></span></div>
              )}
            </div>
          )}
        </div>

        <div className="market-ecom-actions" aria-label="Ações rápidas">
          <Link to={ROTAS_LOJAS.lojasMarket} className="market-action-icon act" aria-label="Abrir lojas"><Store size={20} /><span>Lojas</span></Link>
          <Link to={ROTAS_LOJAS.checkout} className="market-action-icon act" aria-label={`Abrir sacola com ${quantidadeCarrinho} item${quantidadeCarrinho === 1 ? "" : "s"}`}>
            <ShoppingBag size={20} />{quantidadeCarrinho > 0 && <b className="market-cart-count">{quantidadeCarrinho > 99 ? "99+" : quantidadeCarrinho}</b>}<span>Sacola</span>
          </Link>
          {conta ? (
            <details className="market-account-menu">
              <summary className="market-action-icon act" aria-label="Abrir menu da conta"><User size={20} /><span>{conta.conta.nome?.split(" ")[0] || "Conta"}</span></summary>
              <div>
                <header><strong>{conta.conta.nome || "Conta Bizy"}</strong><small>{conta.conta.telefone || conta.conta.email}</small></header>
                <Link to="/conta"><User size={16} /> Minha conta</Link>
                <Link to="/conta/compras"><ShoppingBag size={16} /> Minhas compras</Link>
                {conta.navegacao.creator ? <Link to="/creator"><UsersRound size={16} /> Abrir Bizy Creator</Link> : <Link to="/conta/afiliacao"><UsersRound size={16} /> Tornar-me afiliado</Link>}
                {conta.navegacao.team && <Link to="/app"><Store size={16} /> Abrir Bizy Team</Link>}
                <button type="button" onClick={async () => { await encerrarSessaoContaBizy(); setConta(null); navigate("/conta/entrar"); }}><LogOut size={16} /> Terminar sessão</button>
              </div>
            </details>
          ) : (
            <Link to="/conta" className="market-action-icon act" aria-label="Abrir conta"><User size={20} /><span>Conta</span></Link>
          )}
        </div>
      </div>

      <nav className="market-ecom-dept dept" aria-label="Departamentos do Market">
        <button type="button" className="market-ecom-menu all" onClick={limparCabecalho}><Menu size={16} />Todas as categorias</button>
        <button type="button" className={!categoriaSelecionada ? "is-active" : ""} onClick={limparCabecalho}>Início</button>
        {departamentos.map((departamento) => <button key={departamento} type="button" className={categoriaSelecionada === departamento ? "is-active" : ""} onClick={() => selecionarCategoria(departamento)}>{departamento}</button>)}
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
            <Link to={ROTAS_LOJAS.market} className="market-brand-lockup" aria-label="Abrir Bizy Market"><MarcaMarket escura /></Link>
            <p>Produtos de lojas angolanas, com fornecedor identificado e uma compra organizada do início ao fim.</p>
            <span className="market-footer-location">Luanda, Angola · Preços em Kz</span>
          </div>
          <div className="market-footer-cols">
            <div className="market-footer-col"><strong>Explorar</strong><Link to={ROTAS_LOJAS.market}>Produtos</Link><Link to={ROTAS_LOJAS.lojasMarket}>Lojas</Link><Link to={ROTAS_LOJAS.checkout}>Sacola</Link></div>
            <div className="market-footer-col"><strong>Compras</strong><Link to="/conta/compras">Acompanhar compra</Link><Link to="/conta/favoritos">Favoritos</Link><Link to={ROTAS_LOJAS.checkout}>Finalizar compra</Link></div>
            <div className="market-footer-col"><strong>Vender e promover</strong><Link to="/login?returnTo=/onboarding&surface=team">Criar loja</Link><Link to="/creator/oportunidades">Oportunidades</Link><Link to="/conta/afiliacao">Ser afiliado</Link></div>
          </div>
        </div>
        <div className="market-footer-bottom"><span>&copy; {ano} Bizy. Todos os direitos reservados.</span><span>Market · Compra clara entre lojas independentes</span></div>
      </div>
    </footer>
  );
}

export function MarketPublicPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`bizy-market-page market-commerce-page market-public-page ${className}`.trim()}>{children}</main>;
}
