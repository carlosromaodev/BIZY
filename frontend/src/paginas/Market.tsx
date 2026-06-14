import {
  ArrowRight,
  Bolt,
  CheckCircle2,
  ChevronDown,
  Compass,
  Heart,
  Home,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Tags,
  Truck,
  User,
  X
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NativeBottomNav } from "@/components/ui/native-bottom-nav";
import { listarCategoriasMarket, listarProdutosMarket, normalizarProdutoMarket, ROTAS_LOJAS } from "../lojas";
import type { CategoriaMarket, ProdutoMarketNormalizado } from "../lojas";
import { formatarKwanza } from "../utilidades";

type FiltroTexto = "busca" | "provincia" | "municipio" | "loja" | "precoMinimo" | "precoMaximo";

const DEPARTAMENTOS_MARKET = ["Moda", "Beleza", "Casa", "Tecnologia", "Comida", "Serviços"];
const CATEGORIAS_EDITORIAIS = [
  { titulo: "Moda", subtitulo: "Looks, ténis e acessórios", acento: "verde", icone: "👗" },
  { titulo: "Beleza", subtitulo: "Skincare, cabelo e perfume", acento: "rosa", icone: "✨" },
  { titulo: "Comida", subtitulo: "Pratos, snacks e bebidas", acento: "amber", icone: "🍲" },
  { titulo: "Tecnologia", subtitulo: "Gadgets, acessórios e som", acento: "azul", icone: "📱" },
  { titulo: "Casa", subtitulo: "Decoração e utilidades", acento: "violeta", icone: "🛋️" },
  { titulo: "Serviços", subtitulo: "Ajuda profissional rápida", acento: "verde", icone: "🛠️" }
];

function obterResumoComercialProduto(produto: ProdutoMarketNormalizado) {
  const semente = Array.from(`${produto.codigo}${produto.slugLoja}`).reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return {
    avaliacoes: 18 + (semente % 220),
    rating: (4.3 + (semente % 7) / 10).toFixed(1).replace(".", ","),
    vendidos: 35 + (semente % 520)
  };
}

export function PaginaMarket() {
  const { categoria: categoriaRota = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const [categorias, setCategorias] = useState<CategoriaMarket[]>([]);
  const [produtos, setProdutos] = useState<ProdutoMarketNormalizado[]>([]);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const categoriaSelecionada = decodeURIComponent(categoriaRota || searchParams.get("categoria") || "").trim();
  const busca = searchParams.get("busca") ?? "";
  const provincia = searchParams.get("provincia") ?? "";
  const municipio = searchParams.get("municipio") ?? "";
  const loja = searchParams.get("loja") ?? "";
  const precoMinimo = searchParams.get("precoMinimo") ?? "";
  const precoMaximo = searchParams.get("precoMaximo") ?? "";
  const apenasDisponivel = searchParams.get("apenasDisponivel") === "true";
  const apenasPromocao = searchParams.get("apenasPromocao") === "true";

  const fornecedores = useMemo(() => {
    const mapa = new Map<string, ProdutoMarketNormalizado["fornecedor"] & { total: number }>();
    for (const produto of produtos) {
      const chave = produto.slugLoja || produto.nomeFornecedor;
      const atual = mapa.get(chave);
      mapa.set(chave, {
        ...produto.fornecedor,
        total: (atual?.total ?? 0) + 1
      });
    }
    return Array.from(mapa.values()).slice(0, 6);
  }, [produtos]);

  const filtrosAtivos = [categoriaSelecionada, busca, provincia, municipio, loja, precoMinimo, precoMaximo, apenasDisponivel, apenasPromocao].filter(Boolean).length;
  const produtosDestaque = useMemo(() => produtos.slice(0, 10), [produtos]);
  const totalLojas = fornecedores.length;

  const atualizarFiltro = useCallback(
    (chave: FiltroTexto, valor: string) => {
      const proximos = new URLSearchParams(searchParams);
      const texto = valor.trim();
      if (texto) proximos.set(chave, texto);
      else proximos.delete(chave);
      setSearchParams(proximos, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const alternarFiltroBooleano = useCallback(
    (chave: "apenasDisponivel" | "apenasPromocao") => {
      const proximos = new URLSearchParams(searchParams);
      if (proximos.get(chave) === "true") proximos.delete(chave);
      else proximos.set(chave, "true");
      setSearchParams(proximos, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    let ativo = true;

    async function carregarMarket() {
      setCarregando(true);
      setErro("");
      try {
        const [respostaCategorias, respostaProdutos] = await Promise.all([
          listarCategoriasMarket().catch(() => ({ categorias: [], total: 0 })),
          listarProdutosMarket({
            busca,
            categoria: categoriaSelecionada,
            provincia,
            municipio,
            loja,
            precoMinimo: precoMinimo ? Number(precoMinimo) : undefined,
            precoMaximo: precoMaximo ? Number(precoMaximo) : undefined,
            apenasDisponivel: apenasDisponivel || undefined,
            apenasPromocao: apenasPromocao || undefined,
            limite: 48
          })
        ]);

        if (!ativo) return;
        setCategorias(respostaCategorias.categorias ?? respostaProdutos.categorias ?? []);
        setProdutos((respostaProdutos.produtos ?? []).map(normalizarProdutoMarket));
        setTotal(respostaProdutos.total ?? respostaProdutos.produtos?.length ?? 0);
        document.title = categoriaSelecionada ? `${categoriaSelecionada} no Bizy Market` : "Bizy Market";
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o Bizy Market.");
        setProdutos([]);
        setTotal(0);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarMarket();
    return () => {
      ativo = false;
    };
  }, [busca, categoriaSelecionada, loja, municipio, provincia, precoMinimo, precoMaximo, apenasDisponivel, apenasPromocao]);

  function abrirCategoria(categoria: string) {
    const query = new URLSearchParams(searchParams);
    query.delete("categoria");
    const sufixo = query.toString();
    navigate(`${ROTAS_LOJAS.categoriaMarket(categoria)}${sufixo ? `?${sufixo}` : ""}`);
  }

  function limparFiltros() {
    navigate(ROTAS_LOJAS.market);
  }

  return (
    <main className="bizy-market-page market-commerce-page min-h-[100dvh] bg-[#faf8f4] text-neutral-950">
      <CabecalhoMarketComercial
        busca={busca}
        categoriaSelecionada={categoriaSelecionada}
        categorias={categorias}
        onBusca={(valor) => atualizarFiltro("busca", valor)}
        onCategoria={abrirCategoria}
        onLimpar={limparFiltros}
      />

      {categoriaSelecionada ? (
        <section className="market-category-head">
          <span>Market / <b>{categoriaSelecionada}</b></span>
          <h1>{categoriaSelecionada}</h1>
          <p>{carregando ? "A carregar departamento" : `${total} produtos publicados · ${totalLojas} lojas com resultados`}</p>
        </section>
      ) : (
        <section className="market-hero market-commerce-hero market-ecom-hero heroX" aria-label="Campanhas em destaque no Bizy Market">
          <motion.div
            className="market-hero-copy market-ecom-hero-main big"
            initial={reduzirMovimento ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="k">Campanha · até 14 Jun</span>
            <h2>Semana da Moda Luanda</h2>
            <p>Até -30% em vestidos, calçado e acessórios das melhores lojas verificadas.</p>
            <button type="button" className="bcta btn2 lime" onClick={() => abrirCategoria(categorias[0]?.categoria ?? "Moda")} disabled={!categorias.length}>
              Explorar campanha
              <ArrowRight size={16} />
            </button>
            <div className="dots" aria-hidden="true"><i className="on" /><i /><i /></div>
          </motion.div>

          <div className="market-ecom-hero-side side">
            <button type="button" className="market-hero-mini mini is-violet" onClick={() => navigate(ROTAS_LOJAS.lojasMarket)}>
              <span className="t">Novas lojas da semana</span>
              <span className="s">{Math.max(totalLojas, 2)} fornecedores entraram no Bizy</span>
              <span className="lnk">
                Descobrir
                <ArrowRight size={16} />
              </span>
            </button>
            <button type="button" className="market-hero-mini mini is-amber" onClick={() => abrirCategoria(categorias[1]?.categoria ?? categorias[0]?.categoria ?? "Kits")} disabled={!categorias.length}>
              <span className="t">Volta às aulas</span>
              <span className="s">mochilas, ténis e tecnologia</span>
              <span className="lnk">
                Ver seleção
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </section>
      )}

      {!categoriaSelecionada && <SecaoConfiancaMarket />}

      {!categoriaSelecionada && (
        <SecaoPromocoesRelampago produtos={produtos.slice(0, 6)} />
      )}

      {!categoriaSelecionada && (
        <SecaoCategoriasMarket categorias={categorias} onCategoria={abrirCategoria} />
      )}

      {fornecedores.length > 0 && (
        <section className="market-featured-stores market-commerce-stores" aria-label="Lojas em destaque">
          <div className="market-section-title">
            <span>Melhores lojas em destaque</span>
            <strong>Fornecedores ativos dentro do Bizy Market.</strong>
          </div>
          <div className="market-store-row">
            {fornecedores.map((fornecedor) => (
              <Link key={fornecedor.slug || fornecedor.nomeComercial} to={fornecedor.urlLoja} className="market-store-card">
                <span className="market-store-cover" />
                <span className="market-store-avatar">
                  {fornecedor.logoUrl ? <img src={fornecedor.logoUrl} alt="" /> : <Store size={20} />}
                </span>
                <strong>{fornecedor.nomeComercial}</strong>
                <small>{fornecedor.localizacao || fornecedor.segmento || "Loja Bizy"}</small>
                <span className="market-store-badges">
                  <em>{fornecedor.total} produto{fornecedor.total === 1 ? "" : "s"}</em>
                  <em>Ver loja</em>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!categoriaSelecionada && produtosDestaque.length > 0 && (
        <section className="market-commerce-strip" aria-label="Produtos em alta">
          <div className="market-section-title">
            <span>Market</span>
            <strong>Produtos em alta</strong>
          </div>
          <div className="market-product-grid">
            {produtosDestaque.slice(0, 5).map((produto) => (
              <CartaoProdutoMarket key={`destaque-${produto.slugLoja}-${produto.codigo}`} produto={produto} />
            ))}
          </div>
        </section>
      )}

      <section className="market-content-grid">
        <aside className="market-discovery-panel">
          <div className="market-panel-heading">
            <SlidersHorizontal size={18} />
            <span>Filtros {filtrosAtivos > 0 && `(${filtrosAtivos})`}</span>
          </div>
          {filtrosAtivos > 0 && (
            <div className="market-active-filter-list">
              {categoriaSelecionada && <span><Tags size={13} />{categoriaSelecionada}</span>}
              {busca && <span><Search size={13} />{busca}</span>}
              {provincia && <span><MapPin size={13} />{provincia}</span>}
              {municipio && <span><MapPin size={13} />{municipio}</span>}
              {loja && <span><Store size={13} />{loja}</span>}
              {precoMinimo && <span>Min: {formatarKwanza(Number(precoMinimo))}</span>}
              {precoMaximo && <span>Max: {formatarKwanza(Number(precoMaximo))}</span>}
              {apenasDisponivel && <span><Package size={13} />Em stock</span>}
              {apenasPromocao && <span><Tags size={13} />Promoção</span>}
            </div>
          )}
          <button type="button" onClick={limparFiltros} disabled={!filtrosAtivos}>
            Limpar filtros
          </button>

          <div className="market-filter-group">
            <strong>Localização</strong>
            <div className="market-filter-row">
              <FiltroCampo label="Província" value={provincia} onChange={(valor) => atualizarFiltro("provincia", valor)} />
              <FiltroCampo label="Município" value={municipio} onChange={(valor) => atualizarFiltro("municipio", valor)} />
            </div>
          </div>

          <div className="market-filter-group">
            <strong>Loja</strong>
            <div className="market-filter-row">
              <FiltroCampo label="Nome da loja" value={loja} onChange={(valor) => atualizarFiltro("loja", valor)} />
            </div>
          </div>

          <div className="market-filter-group">
            <strong>Faixa de preço</strong>
            <div className="market-filter-row market-filter-price-row">
              <FiltroCampo label="Mínimo (Kz)" value={precoMinimo} onChange={(valor) => atualizarFiltro("precoMinimo", valor)} tipo="number" />
              <span className="market-filter-dash">—</span>
              <FiltroCampo label="Máximo (Kz)" value={precoMaximo} onChange={(valor) => atualizarFiltro("precoMaximo", valor)} tipo="number" />
            </div>
          </div>

          <div className="market-filter-group">
            <strong>Disponibilidade</strong>
            <label className="market-filter-toggle">
              <input type="checkbox" checked={apenasDisponivel} onChange={() => alternarFiltroBooleano("apenasDisponivel")} />
              <span>Apenas produtos em stock</span>
            </label>
            <label className="market-filter-toggle">
              <input type="checkbox" checked={apenasPromocao} onChange={() => alternarFiltroBooleano("apenasPromocao")} />
              <span>Apenas com promoção</span>
            </label>
          </div>
        </aside>

        <section className="market-results" aria-live="polite">
          <div className="market-results-head">
            <div>
              <span>{carregando ? "A procurar" : `${total} produtos`}</span>
              <h2>{categoriaSelecionada || "Todos os produtos"}</h2>
            </div>
            <Link to="/login" className="market-seller-link">
              Vender no Bizy
              <ArrowRight size={15} />
            </Link>
          </div>

          {erro && <div className="market-empty-state" role="alert">{erro}</div>}

          {!erro && carregando && (
            <div className="market-product-grid" aria-label="Produtos a carregar">
              {Array.from({ length: 8 }).map((_, indice) => <div key={indice} className="market-product-skeleton" />)}
            </div>
          )}

          {!erro && !carregando && produtos.length > 0 && (
            <div className="market-product-grid">
              {produtos.map((produto) => <CartaoProdutoMarket key={`${produto.slugLoja}-${produto.codigo}`} produto={produto} />)}
            </div>
          )}

          {!erro && !carregando && produtos.length === 0 && (
            <div className="market-empty-state">
              <Package size={34} />
              <strong>Nenhum produto encontrado</strong>
              <span>Experimente retirar filtros ou procurar noutra categoria.</span>
              <button type="button" onClick={limparFiltros}>Ver todos</button>
            </div>
          )}
        </section>
      </section>

      <RodapeMarket />

      <NativeBottomNav
        activePillId="bizy-market-bottom-nav"
        className="lp-nav market-bottom-nav"
        label="Navegação do Market"
        items={[
          { id: "inicio", label: "Início", icon: Home, onClick: () => navigate("/") },
          { id: "market", label: "Market", icon: Compass, active: true, onClick: () => navigate(ROTAS_LOJAS.market) },
          { id: "lojas", label: "Lojas", icon: Store, onClick: () => navigate(ROTAS_LOJAS.lojasMarket) },
          { id: "sacola", label: "Comprar", icon: ShoppingBag, variant: "cta", onClick: () => navigate(ROTAS_LOJAS.checkout) }
        ]}
      />
    </main>
  );
}

export function PaginaDiretorioLojasMarket() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<ProdutoMarketNormalizado[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarLojas() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await listarProdutosMarket({ limite: 72 });
        if (!ativo) return;
        setProdutos((resposta.produtos ?? []).map(normalizarProdutoMarket));
        document.title = "Lojas no Bizy Market";
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as lojas do Market.");
        setProdutos([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarLojas();
    return () => {
      ativo = false;
    };
  }, []);

  const lojas = useMemo(() => {
    const mapa = new Map<string, ProdutoMarketNormalizado["fornecedor"] & { total: number; categorias: Set<string> }>();
    for (const produto of produtos) {
      const chave = produto.slugLoja || produto.nomeFornecedor;
      const atual = mapa.get(chave);
      const categorias = atual?.categorias ?? new Set<string>();
      if (produto.categoria) categorias.add(produto.categoria);
      mapa.set(chave, {
        ...produto.fornecedor,
        total: (atual?.total ?? 0) + 1,
        categorias
      });
    }
    return Array.from(mapa.values())
      .filter((loja) => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return true;
        return [loja.nomeComercial, loja.localizacao, loja.segmento, loja.tipo]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo));
      })
      .sort((a, b) => b.total - a.total);
  }, [busca, produtos]);

  return (
    <main className="bizy-market-page market-commerce-page market-stores-directory min-h-[100dvh] bg-[#faf8f4] text-neutral-950">
      <CabecalhoMarketComercial
        busca={busca}
        categoriaSelecionada=""
        categorias={[]}
        onBusca={setBusca}
        onCategoria={(categoria) => navigate(ROTAS_LOJAS.categoriaMarket(categoria))}
        onLimpar={() => setBusca("")}
        placeholder="Buscar loja pelo nome, segmento ou localização"
      />

      <section className="market-category-head">
        <span>Market / <b>Lojas</b></span>
        <h1>Lojas no Bizy</h1>
        <p>{carregando ? "A carregar fornecedores" : `${lojas.length} lojas ativas encontradas no shopping center`}</p>
        <div className="market-directory-chips" aria-label="Filtros rápidos de lojas">
          {["Todas", "Moda", "Beleza", "Tecnologia", "Luanda", "Verificadas"].map((chip, indice) => (
            <span key={chip} className={indice === 0 ? "is-active" : ""}>{chip}</span>
          ))}
        </div>
      </section>

      <section className="market-featured-stores market-commerce-stores" aria-live="polite">
        <div className="market-section-title">
          <span>Lojas em destaque</span>
          <strong>Descobrir fornecedores por atividade.</strong>
        </div>

        {erro && <div className="market-empty-state" role="alert">{erro}</div>}

        {!erro && carregando && (
          <div className="market-store-row">
            {Array.from({ length: 6 }).map((_, indice) => <div key={indice} className="market-store-card market-store-skeleton" />)}
          </div>
        )}

        {!erro && !carregando && lojas.length > 0 && (
          <div className="market-store-row market-directory-grid">
            {lojas.map((loja) => (
              <Link key={loja.slug || loja.nomeComercial} to={loja.urlLoja} className="market-store-card">
                <span className="market-store-cover" />
                <span className="market-store-avatar">
                  {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : <Store size={20} />}
                </span>
                <strong>{loja.nomeComercial}</strong>
                <small>{loja.localizacao || loja.segmento || "Loja Bizy"}</small>
                <span className="market-store-badges">
                  <em>{loja.total} produto{loja.total === 1 ? "" : "s"} ativos</em>
                  {Array.from(loja.categorias).slice(0, 2).map((categoria) => <em key={categoria}>{categoria}</em>)}
                  <em>Entrar na loja</em>
                </span>
              </Link>
            ))}
          </div>
        )}

        {!erro && !carregando && lojas.length === 0 && (
          <div className="market-empty-state">
            <Store size={34} />
            <strong>Nenhuma loja encontrada</strong>
            <span>Procure por outro nome, segmento ou localização.</span>
          </div>
        )}
      </section>

      <RodapeMarket />

      <NativeBottomNav
        activePillId="bizy-market-stores-bottom-nav"
        className="lp-nav market-bottom-nav"
        label="Navegação do diretório de lojas"
        items={[
          { id: "inicio", label: "Início", icon: Home, onClick: () => navigate("/") },
          { id: "market", label: "Market", icon: Compass, onClick: () => navigate(ROTAS_LOJAS.market) },
          { id: "lojas", label: "Lojas", icon: Store, active: true, onClick: () => navigate(ROTAS_LOJAS.lojasMarket) },
          { id: "sacola", label: "Comprar", icon: ShoppingBag, variant: "cta", onClick: () => navigate(ROTAS_LOJAS.checkout) }
        ]}
      />
    </main>
  );
}

function CabecalhoMarketComercial({
  busca,
  categoriaSelecionada,
  categorias,
  onBusca,
  onCategoria,
  onLimpar,
  placeholder = "Buscar produtos, lojas e categorias"
}: {
  busca: string;
  categoriaSelecionada: string;
  categorias: CategoriaMarket[];
  onBusca: (valor: string) => void;
  onCategoria: (categoria: string) => void;
  onLimpar: () => void;
  placeholder?: string;
}) {
  const departamentos = categorias.length ? categorias.slice(0, 6).map((categoria) => categoria.categoria) : DEPARTAMENTOS_MARKET;

  return (
    <header className="market-ecom-shell" aria-label="Cabeçalho do Bizy Market">
      <div className="market-util util" aria-label="Benefícios do Bizy Market">
        <span className="l"><Truck size={14} />Entrega em toda Luanda em 24-48h · grátis acima de 30 000 Kz</span>
        <span className="r"><span>Vender no Bizy</span><span>Acompanhar pedido</span><span>Ajuda</span><span>PT · Kz</span></span>
      </div>

      <div className="market-ecom-header hd2">
        <Link to={ROTAS_LOJAS.market} className="market-brand-lockup" aria-label="Abrir Bizy Market">
          <span className="market-wordmark-text wm">bizy<span className="dot">.</span></span>
          <span className="market-tag mtag">Market</span>
        </Link>

        <form className="market-ecom-search searchbar" role="search" onSubmit={(evento) => evento.preventDefault()}>
          <span className="market-ecom-search-dept catsel">
            Todas as categorias
            <ChevronDown size={14} />
          </span>
          <Search className="market-ecom-search-icon" size={18} aria-hidden="true" />
          <input
            aria-label="Buscar no Bizy Market"
            value={busca}
            onChange={(evento) => onBusca(evento.target.value)}
            placeholder={categoriaSelecionada ? `Buscar em ${categoriaSelecionada}` : placeholder}
          />
          {busca && (
            <button type="button" className="market-ecom-clear" onClick={onLimpar} aria-label="Limpar busca e filtros">
              <X size={15} />
            </button>
          )}
          <button type="submit" className="market-ecom-submit go">
            <Search size={15} />
            Buscar
          </button>
        </form>

        <div className="market-ecom-actions" aria-label="Ações rápidas">
          <Link to={ROTAS_LOJAS.lojasMarket} className="market-action-icon act" aria-label="Abrir favoritos">
            <Heart size={20} />
            <span>Favoritos</span>
          </Link>
          <Link to={ROTAS_LOJAS.checkout} className="market-action-icon act" aria-label="Abrir sacola">
            <ShoppingBag size={20} />
            <span className="bn">2</span>
            <span>Sacola</span>
          </Link>
          <Link to="/login" className="market-action-icon act" aria-label="Abrir conta">
            <User size={20} />
            <span>Conta</span>
          </Link>
        </div>
      </div>

      <nav className="market-ecom-dept dept" aria-label="Departamentos do Market">
        <button type="button" className="market-ecom-menu all">
          <Menu size={16} />
          Todas as categorias
        </button>
        <button type="button" className={!categoriaSelecionada ? "is-active" : ""} onClick={onLimpar}>
          Início
        </button>
        {departamentos.map((departamento) => (
          <button
            key={departamento}
            type="button"
            className={categoriaSelecionada === departamento ? "is-active" : ""}
            onClick={() => onCategoria(departamento)}
          >
            {departamento}
          </button>
        ))}
        <span className="market-dept-special sp">
          <button type="button" className="fire" onClick={() => onCategoria(departamentos[0] ?? "Promoções")}>Promoções</button>
          <button type="button" className="nw" onClick={() => onCategoria(departamentos[1] ?? "Novidades")}>Novidades</button>
          <Link to={ROTAS_LOJAS.lojasMarket}>Lojas</Link>
        </span>
      </nav>
    </header>
  );
}

function SecaoConfiancaMarket() {
  const itens = [
    { icon: CheckCircle2, titulo: "Loja visível", texto: "cada produto mostra quem vende" },
    { icon: ShieldCheck, titulo: "Compra organizada", texto: "checkout unificado do Bizy" },
    { icon: Truck, titulo: "Entrega clara", texto: "condições definidas por fornecedor" },
    { icon: Compass, titulo: "Descoberta rápida", texto: "produtos similares sem perder contexto" }
  ];

  return (
    <section className="market-ecom-trust" aria-label="Confiança no Bizy Market">
      {itens.map(({ icon: Icone, titulo, texto }) => (
        <div key={titulo}>
          <Icone size={18} />
          <span>
            <strong>{titulo}</strong>
            <small>{texto}</small>
          </span>
        </div>
      ))}
    </section>
  );
}

function SecaoPromocoesRelampago({ produtos }: { produtos: ProdutoMarketNormalizado[] }) {
  if (!produtos.length) return null;

  return (
    <section className="market-flash-section" aria-label="Promoções relâmpago">
      <div className="market-flash-head">
        <span className="t"><Bolt size={17} />Promoções de hoje</span>
        <span className="market-countdown cd"><i>06</i><em>:</em><i>42</i><em>:</em><i>18</i></span>
        <Link to={ROTAS_LOJAS.market} className="more2">Ver todas →</Link>
      </div>
      <div className="market-flash-grid">
        {produtos.slice(0, 6).map((produto) => {
          const resumo = obterResumoComercialProduto(produto);
          const progresso = Math.min(92, 38 + (resumo.vendidos % 55));
          return (
            <Link key={`flash-${produto.slugLoja}-${produto.codigo}`} to={produto.urlMarket} className="market-flash-card">
              <span className="market-flash-media">
                {produto.fotoPrincipal ? <img src={produto.fotoPrincipal} alt="" /> : <Package size={28} />}
              </span>
              <span className="market-flash-info">
                <small>{produto.nomeFornecedor}</small>
                <strong>{produto.nome}</strong>
                <em>{formatarKwanza(produto.precoFinalEmKwanza)}</em>
                <i><span style={{ width: `${progresso}%` }} /></i>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SecaoCategoriasMarket({
  categorias,
  onCategoria
}: {
  categorias: CategoriaMarket[];
  onCategoria: (categoria: string) => void;
}) {
  const tiles = categorias.length
    ? categorias.slice(0, 6).map((categoria, indice) => ({
      titulo: categoria.categoria,
      subtitulo: `${categoria.total} produto${categoria.total === 1 ? "" : "s"} no Market`,
      acento: CATEGORIAS_EDITORIAIS[indice % CATEGORIAS_EDITORIAIS.length].acento,
      icone: CATEGORIAS_EDITORIAIS[indice % CATEGORIAS_EDITORIAIS.length].icone
    }))
    : CATEGORIAS_EDITORIAIS;

  return (
    <section className="market-category-tiles" aria-label="Categorias em destaque">
      <div className="market-category-title">
        <h2>Comprar por categoria</h2>
      </div>
      <div className="market-category-tile-grid">
        {tiles.map((tile) => (
          <button
            key={tile.titulo}
            type="button"
            className={`market-category-tile accent-${tile.acento}`}
            onClick={() => onCategoria(tile.titulo)}
          >
            <span className="market-category-emoji" aria-hidden="true">{tile.icone}</span>
            <span className="market-category-name">{tile.titulo}</span>
            <strong>{tile.subtitulo}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function RodapeMarket() {
  return (
    <footer className="market-ecom-footer">
      <div>
        <Link to={ROTAS_LOJAS.market} className="market-brand-lockup">
          <span className="market-wordmark-text wm">bizy<span className="dot">.</span></span>
          <span className="market-tag mtag">Market</span>
        </Link>
        <p>Shopping center com lojas independentes, catálogo próprio e checkout Bizy.</p>
      </div>
      <nav aria-label="Links do Bizy Market">
        <Link to={ROTAS_LOJAS.lojasMarket}>Lojas</Link>
        <Link to={ROTAS_LOJAS.checkout}>Checkout</Link>
        <Link to="/login">Vender no Bizy</Link>
      </nav>
    </footer>
  );
}

function FiltroCampo({ label, onChange, value, tipo = "text" }: { label: string; onChange: (valor: string) => void; value: string; tipo?: "text" | "number" }) {
  return (
    <label className="market-filter-input">
      <span>{label}</span>
      <input type={tipo} value={value} onChange={(evento) => onChange(evento.target.value)} placeholder={label} min={tipo === "number" ? 0 : undefined} />
    </label>
  );
}

function CartaoProdutoMarket({ produto }: { produto: ProdutoMarketNormalizado }) {
  const resumo = obterResumoComercialProduto(produto);
  return (
    <article className="market-product-card">
      <Link to={produto.urlMarket} className="market-product-media" aria-label={`Ver ${produto.nome}`}>
        {produto.fotoPrincipal ? <img src={produto.fotoPrincipal} alt={produto.nome} /> : <Package size={34} />}
        <span className="market-product-favorite" aria-hidden="true"><Heart size={14} /></span>
        {produto.descontoPercentual && <span>-{produto.descontoPercentual}%</span>}
      </Link>
      <div className="market-product-body">
        <Link to={produto.urlMarket} className="market-product-name">{produto.nome}</Link>
        <div className="market-product-price">
          <strong>{formatarKwanza(produto.precoFinalEmKwanza)}</strong>
          {produto.precoAntigoEmKwanza && <span>{formatarKwanza(produto.precoAntigoEmKwanza)}</span>}
        </div>
        <div className="market-product-rating" aria-label={`${resumo.rating} de 5 estrelas com ${resumo.avaliacoes} avaliações`}>
          <Star size={13} />
          <strong>{resumo.rating}</strong>
          <span>({resumo.avaliacoes}) · {resumo.vendidos} vendidos</span>
        </div>
        <Link to={produto.urlLoja} className="market-product-supplier">
          <Store size={13} />
          <span>{produto.nomeFornecedor}</span>
        </Link>
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
