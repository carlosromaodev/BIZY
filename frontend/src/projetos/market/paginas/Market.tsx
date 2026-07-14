import {
  ArrowRight,
  Bolt,
  CheckCircle2,
  ChevronDown,
  Compass,
  Heart,
  Home,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tags,
  Truck,
  Search
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  listarCategoriasMarket,
  listarLojasMarket,
  listarProdutosMarket,
  normalizarFornecedorMarket,
  normalizarProdutoMarket,
  ROTAS_LOJAS
} from "../api";
import type { CategoriaMarket, LojaMarket, ProdutoMarketNormalizado } from "../api";
import { formatarKwanza, aplicarSeoMetaTags, montarSeoPublico } from "../../../utilidades";
import { AvisoPrivacidade } from "../../../componentes/BizyDesignSystem";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";
import { CartaoProdutoMarket } from "../componentes/CartaoProdutoMarket";

type FiltroTexto = "busca" | "provincia" | "municipio" | "loja" | "precoMinimo" | "precoMaximo";

const IMAGEM_SEO_MARKET = "/bizy-live-commerce-hero.png";
const DESCRICAO_SEO_MARKET = "Descubra produtos de lojas angolanas no Bizy Market, com fornecedor visível e checkout unificado.";
const CATEGORIAS_EDITORIAIS: Array<{ titulo: string; subtitulo: string; acento: string; icone: LucideIcon }> = [
  { titulo: "Moda", subtitulo: "Looks, ténis e acessórios", acento: "verde", icone: ShoppingBag },
  { titulo: "Beleza", subtitulo: "Skincare, cabelo e perfume", acento: "rosa", icone: Heart },
  { titulo: "Comida", subtitulo: "Pratos, snacks e bebidas", acento: "amber", icone: Package },
  { titulo: "Tecnologia", subtitulo: "Gadgets, acessórios e som", acento: "azul", icone: Bolt },
  { titulo: "Casa", subtitulo: "Decoração e utilidades", acento: "verde", icone: Home },
  { titulo: "Serviços", subtitulo: "Ajuda profissional rápida", acento: "amber", icone: ShieldCheck }
];

function formatarSeloProdutoMarket(selo: string): string {
  return selo
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
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
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

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
    let limparSeo = () => {};

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
        const tituloMarket = categoriaSelecionada ? `${categoriaSelecionada} no Bizy Market` : "Bizy Market";
        limparSeo = aplicarSeoMetaTags(montarSeoPublico({
          titulo: tituloMarket,
          descricao: categoriaSelecionada
            ? `Compre ${categoriaSelecionada} em lojas angolanas no Bizy Market, com fornecedor visível e checkout unificado.`
            : DESCRICAO_SEO_MARKET,
          canonicalPath: categoriaSelecionada ? ROTAS_LOJAS.categoriaMarket(categoriaSelecionada) : ROTAS_LOJAS.market,
          imagem: IMAGEM_SEO_MARKET
        }));
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
      limparSeo();
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
    <main className="bizy-market-page market-commerce-page market-public-page">
      <CabecalhoMarket
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
            <span className="k">Bizy Market</span>
            <h2>Produtos de lojas reais, fornecedor sempre visível.</h2>
            <p>Busca, categorias e checkout unificado sem apagar a identidade de cada loja.</p>
            <button type="button" className="bcta btn2 lime" onClick={() => abrirCategoria(categorias[0]?.categoria ?? "Moda")} disabled={!categorias.length}>
              Explorar Market
              <ArrowRight size={16} />
            </button>
            <div className="dots" aria-hidden="true"><i className="on" /><i /><i /></div>
          </motion.div>

          <div className="market-ecom-hero-side side">
            <button type="button" className="market-hero-mini mini is-green" onClick={() => navigate(ROTAS_LOJAS.lojasMarket)}>
              <span className="t">Lojas ativas</span>
              <span className="s">{Math.max(totalLojas, 2)} fornecedores entraram no Bizy</span>
              <span className="lnk">
                Descobrir
                <ArrowRight size={16} />
              </span>
            </button>
            <button type="button" className="market-hero-mini mini is-amber" onClick={() => abrirCategoria(categorias[1]?.categoria ?? categorias[0]?.categoria ?? "Kits")} disabled={!categorias.length}>
              <span className="t">Categorias com stock</span>
              <span className="s">produtos publicados e elegíveis</span>
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
        <SecaoProdutosEmDestaque produtos={produtos.slice(0, 6)} />
      )}

      {!categoriaSelecionada && (
        <SecaoCategoriasMarket categorias={categorias} produtos={produtos} onCategoria={abrirCategoria} />
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
                <span
                  className="market-store-cover"
                  style={fornecedor.capaUrl ? { backgroundImage: `url(${fornecedor.capaUrl})` } : undefined}
                />
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

      <section className="market-content-grid">
        <aside className={`market-discovery-panel${filtrosAbertos ? " is-open" : ""}`}>
          <button
            type="button"
            className="market-panel-heading"
            onClick={() => setFiltrosAbertos((aberto) => !aberto)}
            aria-expanded={filtrosAbertos}
          >
            <SlidersHorizontal size={18} />
            <span>Filtros {filtrosAtivos > 0 && `(${filtrosAtivos})`}</span>
            <ChevronDown className="market-panel-chevron" size={16} />
          </button>
          <div className="market-filter-body">
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
          <button type="button" className="market-filter-clear" onClick={limparFiltros} disabled={!filtrosAtivos}>
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

      <AvisoPrivacidade escopo="market" texto="O Bizy Market mede buscas, origem e produtos vistos para melhorar descoberta entre lojas." />
      <RodapeMarket />
    </main>
  );
}

export function PaginaDiretorioLojasMarket() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroRapido, setFiltroRapido] = useState("Todas");
  const [lojas, setLojas] = useState<LojaMarket[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};

    async function carregarLojas() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await listarLojasMarket({ limite: 48 });
        if (!ativo) return;
        setLojas(resposta.lojas ?? []);
        limparSeo = aplicarSeoMetaTags(montarSeoPublico({
          titulo: "Lojas no Bizy Market",
          descricao: "Encontre lojas angolanas com produtos publicados, fornecedor identificado e compra organizada pelo Bizy Market.",
          canonicalPath: ROTAS_LOJAS.lojasMarket,
          imagem: IMAGEM_SEO_MARKET
        }));
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as lojas do Market.");
        setLojas([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarLojas();
    return () => {
      ativo = false;
      limparSeo();
    };
  }, []);

  const lojasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lojas.filter((loja) => {
      const valores = [loja.nomeComercial, loja.descricaoPublica, loja.segmento, loja.tipo, loja.provincia, loja.municipio, ...(loja.categorias ?? [])]
        .filter(Boolean)
        .map((valor) => String(valor).toLowerCase());
      const correspondeBusca = !termo || valores.some((valor) => valor.includes(termo));
      const correspondeFiltro = filtroRapido === "Todas" || valores.some((valor) => valor.includes(filtroRapido.toLowerCase()));
      return correspondeBusca && correspondeFiltro;
    });
  }, [busca, filtroRapido, lojas]);

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-stores-directory">
      <CabecalhoMarket
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
        <p>{carregando ? "A carregar fornecedores" : `${lojasFiltradas.length} lojas ativas encontradas no shopping center`}</p>
        <div className="market-directory-chips" aria-label="Filtros rápidos de lojas">
          {["Todas", "Moda", "Beleza", "Tecnologia", "Luanda"].map((chip) => (
            <button
              key={chip}
              type="button"
              className={filtroRapido === chip ? "is-active" : ""}
              onClick={() => setFiltroRapido(chip)}
              aria-pressed={filtroRapido === chip}
            >
              {chip}
            </button>
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

        {!erro && !carregando && lojasFiltradas.length > 0 && (
          <div className="market-store-row market-directory-grid">
            {lojasFiltradas.map((loja) => {
              const localizacao = [loja.municipio, loja.provincia].filter(Boolean).join(", ");
              return (
                <Link key={loja.slug || loja.nomeComercial} to={loja.slug ? `/lojas/${loja.slug}` : "#"} className="market-store-card">
                  <span className="market-store-cover" style={loja.capaUrl ? { backgroundImage: `url(${loja.capaUrl})` } : undefined} />
                  <span className="market-store-avatar">
                    {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : <Store size={20} />}
                  </span>
                  <strong>{loja.nomeComercial}</strong>
                  <small>{localizacao || loja.segmento || "Loja Bizy"}</small>
                  <span className="market-store-badges">
                    <em>{loja.totalProdutos} produto{loja.totalProdutos === 1 ? "" : "s"} ativos</em>
                    {(loja.categorias ?? []).slice(0, 2).map((categoria) => <em key={categoria}>{categoria}</em>)}
                    <em>Entrar na loja</em>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {!erro && !carregando && lojasFiltradas.length === 0 && (
          <div className="market-empty-state">
            <Store size={34} />
            <strong>Nenhuma loja encontrada</strong>
            <span>Procure por outro nome, segmento ou localização.</span>
          </div>
        )}
      </section>

      <RodapeMarket />
    </main>
  );
}

function SecaoConfiancaMarket() {
  const itens = [
    { icon: CheckCircle2, titulo: "Loja visível", texto: "cada produto mostra quem vende" },
    { icon: ShieldCheck, titulo: "Compra organizada", texto: "compra unificada pelo Bizy" },
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

function SecaoProdutosEmDestaque({ produtos }: { produtos: ProdutoMarketNormalizado[] }) {
  if (!produtos.length) return null;

  return (
    <section className="market-flash-section" aria-label="Produtos em destaque">
      <div className="market-flash-head">
        <span className="t"><Bolt size={17} />Destaques disponíveis</span>
        <Link to={ROTAS_LOJAS.market} className="more2">Ver todos</Link>
      </div>
      <div className="market-flash-grid">
        {produtos.slice(0, 6).map((produto) => {
          const seloPrincipal = produto.selos.find((selo) => selo !== "PATROCINADO");
          return (
            <Link key={`flash-${produto.slugLoja}-${produto.codigo}`} to={produto.urlMarket} className="market-flash-card">
              <span className="market-flash-media">
                {produto.fotoPrincipal ? <img src={produto.fotoPrincipal} alt="" /> : <Package size={28} />}
              </span>
              <span className="market-flash-info">
                <small>{produto.nomeFornecedor}</small>
                <strong>{produto.nome}</strong>
                <em>{formatarKwanza(produto.precoFinalEmKwanza)}</em>
                <i>{seloPrincipal ? formatarSeloProdutoMarket(seloPrincipal) : produto.quantidade > 0 ? `${produto.quantidade} em stock` : "Sob consulta"}</i>
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
  produtos,
  onCategoria
}: {
  categorias: CategoriaMarket[];
  produtos: ProdutoMarketNormalizado[];
  onCategoria: (categoria: string) => void;
}) {
  const categoriasPorNome = new Map(categorias.map((categoria) => [categoria.categoria.toLowerCase(), categoria]));
  const nomes = Array.from(new Set([
    ...categorias.map((categoria) => categoria.categoria),
    ...CATEGORIAS_EDITORIAIS.map((categoria) => categoria.titulo)
  ])).slice(0, 6);
  const tiles = nomes.map((titulo, indice) => {
    const categoria = categoriasPorNome.get(titulo.toLowerCase());
    const editorial = CATEGORIAS_EDITORIAIS.find((item) => item.titulo.toLowerCase() === titulo.toLowerCase())
      ?? CATEGORIAS_EDITORIAIS[indice % CATEGORIAS_EDITORIAIS.length];
    const produtoRepresentativo = produtos.find((produto) => produto.categoria.toLowerCase() === titulo.toLowerCase() && produto.fotoPrincipal);
    return {
      titulo,
      subtitulo: categoria
        ? `${categoria.total} produto${categoria.total === 1 ? "" : "s"} disponíveis`
        : editorial.subtitulo,
      acento: editorial.acento,
      icone: editorial.icone,
      imagem: produtoRepresentativo?.fotoPrincipal ?? ""
    };
  });

  return (
    <section className="market-category-tiles" aria-label="Categorias em destaque">
      <div className="market-category-title">
        <h2>Comprar por categoria</h2>
      </div>
      <div className="market-category-tile-grid">
        {tiles.map((tile) => {
          const Icone = tile.icone;
          return (
          <button
            key={tile.titulo}
            type="button"
            className={`market-category-tile accent-${tile.acento}`}
            onClick={() => onCategoria(tile.titulo)}
          >
            <span className="market-category-media" aria-hidden="true">
              {tile.imagem ? <img src={tile.imagem} alt="" /> : <Icone size={22} />}
            </span>
            <span className="market-category-copy">
              <span className="market-category-name">{tile.titulo}</span>
              <strong>{tile.subtitulo}</strong>
            </span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        );
        })}
      </div>
    </section>
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

export function PaginaLojaMarket() {
  const { slug = "" } = useParams<{ slug: string }>();
  return <Navigate replace to={slug ? ROTAS_LOJAS.loja(slug) : ROTAS_LOJAS.lojasMarket} />;
}
