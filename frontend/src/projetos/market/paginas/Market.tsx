import {
  ArrowRight,
  Bolt,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Home,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tags,
  Truck,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AvisoPrivacidade } from "../../../componentes/BizyDesignSystem";
import { aplicarSeoMetaTags, formatarKwanza, montarSeoPublico } from "../../../utilidades";
import {
  listarCategoriasMarket,
  listarLojasMarket,
  listarProdutosMarket,
  normalizarFornecedorMarket,
  normalizarProdutoMarket,
  ROTAS_LOJAS
} from "../api";
import type { CategoriaMarket, LojaMarket, ProdutoMarketNormalizado } from "../api";
import { CartaoLojaMarket, type LojaCardMarket } from "../componentes/CartaoLojaMarket";
import { CartaoProdutoMarket } from "../componentes/CartaoProdutoMarket";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";

type FiltroTexto = "busca" | "provincia" | "municipio" | "loja" | "precoMinimo" | "precoMaximo";
type OrdenacaoMarket = "RELEVANCIA" | "PRECO_ASC" | "PRECO_DESC" | "MAIS_VENDIDOS" | "NOVIDADES" | "ENTREGA_RAPIDA" | "MAIOR_DESCONTO";

const IMAGEM_SEO_MARKET = "/bizy-live-commerce-hero.png";
const DESCRICAO_SEO_MARKET = "Descubra produtos de lojas angolanas no Bizy Market, com fornecedor visível e checkout unificado.";
const LIMITE_PRODUTOS = 24;
const LIMITE_LOJAS = 18;
const CATEGORIAS_EDITORIAIS: Array<{ titulo: string; subtitulo: string; acento: string; icone: LucideIcon }> = [
  { titulo: "Moda", subtitulo: "Looks, ténis e acessórios", acento: "verde", icone: ShoppingBag },
  { titulo: "Beleza", subtitulo: "Skincare, cabelo e perfume", acento: "rosa", icone: Heart },
  { titulo: "Comida", subtitulo: "Pratos, snacks e bebidas", acento: "amber", icone: Package },
  { titulo: "Tecnologia", subtitulo: "Gadgets, acessórios e som", acento: "azul", icone: Bolt },
  { titulo: "Casa", subtitulo: "Decoração e utilidades", acento: "verde", icone: Home },
  { titulo: "Serviços", subtitulo: "Ajuda profissional rápida", acento: "amber", icone: ShieldCheck }
];

function paginaUrl(searchParams: URLSearchParams, pagina: number): URLSearchParams {
  const proximos = new URLSearchParams(searchParams);
  if (pagina <= 1) proximos.delete("pagina");
  else proximos.set("pagina", String(pagina));
  return proximos;
}

function paginasVisiveis(actual: number, total: number): number[] {
  const inicio = Math.max(1, Math.min(actual - 2, total - 4));
  const fim = Math.min(total, Math.max(actual + 2, 5));
  return Array.from({ length: Math.max(0, fim - inicio + 1) }, (_, indice) => inicio + indice);
}

export function PaginaMarket() {
  const { categoria: categoriaRota = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const [categorias, setCategorias] = useState<CategoriaMarket[]>([]);
  const [produtos, setProdutos] = useState<ProdutoMarketNormalizado[]>([]);
  const [lojas, setLojas] = useState<LojaMarket[]>([]);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [recarregar, setRecarregar] = useState(0);

  const categoriaSelecionada = decodeURIComponent(categoriaRota || searchParams.get("categoria") || "").trim();
  const busca = searchParams.get("busca") ?? "";
  const provincia = searchParams.get("provincia") ?? "";
  const municipio = searchParams.get("municipio") ?? "";
  const loja = searchParams.get("loja") ?? "";
  const precoMinimo = searchParams.get("precoMinimo") ?? "";
  const precoMaximo = searchParams.get("precoMaximo") ?? "";
  const apenasDisponivel = searchParams.get("apenasDisponivel") === "true";
  const apenasPromocao = searchParams.get("apenasPromocao") === "true";
  const ordenarPor = (searchParams.get("ordenarPor") || "RELEVANCIA") as OrdenacaoMarket;
  const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);
  const [buscaRascunho, setBuscaRascunho] = useState(busca);

  useEffect(() => setBuscaRascunho(busca), [busca]);

  const fornecedoresProdutos = useMemo(() => {
    const mapa = new Map<string, LojaCardMarket>();
    for (const produto of produtos) {
      const chave = produto.slugLoja || produto.nomeFornecedor;
      const actual = mapa.get(chave);
      mapa.set(chave, {
        ...produto.fornecedor,
        totalProdutos: (actual?.totalProdutos ?? 0) + 1,
        categorias: Array.from(new Set([...(actual?.categorias ?? []), produto.categoria])).filter(Boolean)
      });
    }
    return Array.from(mapa.values());
  }, [produtos]);

  const lojasVisiveis = useMemo<LojaCardMarket[]>(() => {
    if (!lojas.length) return fornecedoresProdutos.slice(0, 8);
    return lojas.slice(0, 8).map((item) => ({
      ...normalizarFornecedorMarket(item),
      totalProdutos: item.totalProdutos,
      categorias: item.categorias
    }));
  }, [fornecedoresProdutos, lojas]);

  const filtrosAtivos = [categoriaSelecionada, busca, provincia, municipio, loja, precoMinimo, precoMaximo, apenasDisponivel, apenasPromocao].filter(Boolean).length;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_PRODUTOS));

  const atualizarFiltro = useCallback((chave: FiltroTexto, valor: string) => {
    const proximos = new URLSearchParams(searchParams);
    const texto = valor.trim();
    if (texto) proximos.set(chave, texto);
    else proximos.delete(chave);
    proximos.delete("pagina");
    setSearchParams(proximos, { replace: true });
  }, [searchParams, setSearchParams]);

  const alternarFiltroBooleano = useCallback((chave: "apenasDisponivel" | "apenasPromocao") => {
    const proximos = new URLSearchParams(searchParams);
    if (proximos.get(chave) === "true") proximos.delete(chave);
    else proximos.set(chave, "true");
    proximos.delete("pagina");
    setSearchParams(proximos, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};

    async function carregarMarket() {
      setCarregando(true);
      setErro("");
      try {
        const [respostaCategorias, respostaProdutos, respostaLojas] = await Promise.all([
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
            ordenarPor,
            limite: LIMITE_PRODUTOS,
            offset: (pagina - 1) * LIMITE_PRODUTOS
          }),
          listarLojasMarket({ busca: busca || undefined, categoria: categoriaSelecionada || undefined, provincia: provincia || undefined, limite: 8 }).catch(() => ({ lojas: [], total: 0 }))
        ]);

        if (!ativo) return;
        setCategorias(respostaCategorias.categorias ?? respostaProdutos.categorias ?? []);
        setProdutos((respostaProdutos.produtos ?? []).map(normalizarProdutoMarket));
        setLojas(respostaLojas.lojas ?? []);
        setTotal(respostaProdutos.total ?? respostaProdutos.produtos?.length ?? 0);
        const tituloMarket = categoriaSelecionada ? `${categoriaSelecionada} no Bizy Market` : "Bizy Market";
        limparSeo = aplicarSeoMetaTags(montarSeoPublico({
          titulo: tituloMarket,
          descricao: categoriaSelecionada ? `Compre ${categoriaSelecionada} em lojas angolanas no Bizy Market, com fornecedor visível e checkout unificado.` : DESCRICAO_SEO_MARKET,
          canonicalPath: categoriaSelecionada ? ROTAS_LOJAS.categoriaMarket(categoriaSelecionada) : ROTAS_LOJAS.market,
          imagem: IMAGEM_SEO_MARKET
        }));
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o Bizy Market.");
        setProdutos([]);
        setLojas([]);
        setTotal(0);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarMarket();
    return () => { ativo = false; limparSeo(); };
  }, [apenasDisponivel, apenasPromocao, busca, categoriaSelecionada, loja, municipio, ordenarPor, pagina, precoMaximo, precoMinimo, provincia, recarregar]);

  useEffect(() => {
    if (!filtrosAbertos) return;
    const fechar = (evento: globalThis.KeyboardEvent) => { if (evento.key === "Escape") setFiltrosAbertos(false); };
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [filtrosAbertos]);

  function abrirCategoria(categoria: string) {
    const query = new URLSearchParams(searchParams);
    query.delete("categoria");
    query.delete("pagina");
    const sufixo = query.toString();
    navigate(`${ROTAS_LOJAS.categoriaMarket(categoria)}${sufixo ? `?${sufixo}` : ""}`);
  }

  function removerCategoria() {
    const query = new URLSearchParams(searchParams);
    query.delete("categoria");
    query.delete("pagina");
    navigate(`${ROTAS_LOJAS.market}${query.toString() ? `?${query}` : ""}`);
  }

  function limparFiltros() {
    setBuscaRascunho("");
    navigate(ROTAS_LOJAS.market);
  }

  const chipsAtivos: Array<{ id: string; label: string; limpar: () => void }> = [
    ...(categoriaSelecionada ? [{ id: "categoria", label: categoriaSelecionada, limpar: removerCategoria }] : []),
    ...(busca ? [{ id: "busca", label: `Pesquisa: ${busca}`, limpar: () => atualizarFiltro("busca", "") }] : []),
    ...(provincia ? [{ id: "provincia", label: provincia, limpar: () => atualizarFiltro("provincia", "") }] : []),
    ...(municipio ? [{ id: "municipio", label: municipio, limpar: () => atualizarFiltro("municipio", "") }] : []),
    ...(loja ? [{ id: "loja", label: `Loja: ${loja}`, limpar: () => atualizarFiltro("loja", "") }] : []),
    ...(precoMinimo ? [{ id: "precoMinimo", label: `Desde ${formatarKwanza(Number(precoMinimo))}`, limpar: () => atualizarFiltro("precoMinimo", "") }] : []),
    ...(precoMaximo ? [{ id: "precoMaximo", label: `Até ${formatarKwanza(Number(precoMaximo))}`, limpar: () => atualizarFiltro("precoMaximo", "") }] : []),
    ...(apenasDisponivel ? [{ id: "disponivel", label: "Em stock", limpar: () => alternarFiltroBooleano("apenasDisponivel") }] : []),
    ...(apenasPromocao ? [{ id: "promocao", label: "Em promoção", limpar: () => alternarFiltroBooleano("apenasPromocao") }] : [])
  ];

  return (
    <main className="bizy-market-page market-commerce-page market-public-page">
      <CabecalhoMarket
        busca={buscaRascunho}
        categoriaSelecionada={categoriaSelecionada}
        categorias={categorias}
        onBusca={setBuscaRascunho}
        onSubmitBusca={(valor) => atualizarFiltro("busca", valor)}
        onCategoria={abrirCategoria}
        onLimpar={limparFiltros}
      />

      {categoriaSelecionada ? (
        <section className="market-category-head">
          <span>Market / <b>{categoriaSelecionada}</b></span>
          <h1>{categoriaSelecionada}</h1>
          <p>{carregando ? "A carregar departamento" : `${total} produtos publicados · ${lojasVisiveis.length} lojas nos resultados`}</p>
        </section>
      ) : (
        <section className="market-hero market-commerce-hero market-ecom-hero heroX" aria-label="Campanhas em destaque no Bizy Market">
          <motion.div className="market-hero-copy market-ecom-hero-main big" initial={reduzirMovimento ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <span className="k">Bizy Market</span>
            <h1>Produtos de lojas reais, fornecedor sempre visível.</h1>
            <p>Busca, categorias e checkout unificado sem apagar a identidade de cada loja.</p>
            <button type="button" className="bcta btn2 lime" onClick={() => abrirCategoria(categorias[0]?.categoria ?? "Moda")} disabled={!categorias.length}>Explorar Market<ArrowRight size={16} /></button>
          </motion.div>
          <div className="market-ecom-hero-side side">
            <button type="button" className="market-hero-mini mini is-green" onClick={() => navigate(ROTAS_LOJAS.lojasMarket)}><span className="t">Lojas ativas</span><span className="s">fornecedor identificado em cada produto</span><span className="lnk">Descobrir<ArrowRight size={16} /></span></button>
            <button type="button" className="market-hero-mini mini is-amber" onClick={() => abrirCategoria(categorias[1]?.categoria ?? categorias[0]?.categoria ?? "Moda")} disabled={!categorias.length}><span className="t">Categorias com stock</span><span className="s">catálogo publicado e pronto para comprar</span><span className="lnk">Ver selecção<ArrowRight size={16} /></span></button>
          </div>
        </section>
      )}

      {!categoriaSelecionada && <SecaoConfiancaMarket />}
      {!categoriaSelecionada && <SecaoCategoriasMarket categorias={categorias} produtos={produtos} onCategoria={abrirCategoria} />}
      {!categoriaSelecionada && <SecaoProdutosEmDestaque produtos={produtos.slice(0, 5)} />}

      {lojasVisiveis.length > 0 && (
        <section className="market-featured-stores market-commerce-stores" aria-label="Lojas em destaque">
          <div className="market-section-title"><div><span>Lojas no Market</span><strong>Compra directamente de negócios identificados.</strong></div><Link to={ROTAS_LOJAS.lojasMarket}>Ver todas<ArrowRight size={15} /></Link></div>
          <div className="market-store-row">{lojasVisiveis.slice(0, 4).map((fornecedor) => <CartaoLojaMarket key={fornecedor.slug || fornecedor.nomeComercial} loja={fornecedor} />)}</div>
        </section>
      )}

      <section className="market-catalog-intro">
        <div><span>Catálogo completo</span><h2>Encontra o produto certo</h2><p>Filtra por categoria, localização, loja, preço e disponibilidade.</p></div>
        <button type="button" className="market-mobile-filter-trigger" onClick={() => setFiltrosAbertos(true)} aria-controls="market-filters" aria-expanded={filtrosAbertos}><SlidersHorizontal size={17} />Filtros{filtrosAtivos > 0 && <b>{filtrosAtivos}</b>}</button>
      </section>

      {filtrosAbertos && <button type="button" className="market-filter-backdrop" aria-label="Fechar filtros" onClick={() => setFiltrosAbertos(false)} />}
      <section className="market-content-grid">
        <aside id="market-filters" className={`market-discovery-panel${filtrosAbertos ? " is-open" : ""}`} aria-label="Filtros de produtos">
          <div className="market-panel-heading"><SlidersHorizontal size={18} /><span>Filtrar produtos</span><button type="button" onClick={() => setFiltrosAbertos(false)} aria-label="Fechar filtros"><X size={18} /></button></div>
          <div className="market-filter-body">
            <div className="market-filter-summary"><span>{filtrosAtivos ? `${filtrosAtivos} filtro${filtrosAtivos === 1 ? "" : "s"} activo${filtrosAtivos === 1 ? "" : "s"}` : "Todo o catálogo"}</span><button type="button" className="market-filter-clear" onClick={limparFiltros} disabled={!filtrosAtivos}>Limpar tudo</button></div>

            <div className="market-filter-group">
              <strong>Categorias</strong>
              <div className="market-filter-categories">
                <button type="button" className={!categoriaSelecionada ? "is-active" : ""} onClick={removerCategoria}><span>Todas</span></button>
                {categorias.slice(0, 10).map((item) => <button type="button" key={item.categoria} className={categoriaSelecionada === item.categoria ? "is-active" : ""} onClick={() => abrirCategoria(item.categoria)}><span>{item.categoria}</span><small>{item.total}</small></button>)}
              </div>
            </div>

            <div className="market-filter-group"><strong>Localização</strong><div className="market-filter-row"><FiltroCampo label="Província" value={provincia} onChange={(valor) => atualizarFiltro("provincia", valor)} /><FiltroCampo label="Município" value={municipio} onChange={(valor) => atualizarFiltro("municipio", valor)} /></div></div>
            <div className="market-filter-group"><strong>Loja</strong><div className="market-filter-row"><FiltroCampo label="Nome da loja" value={loja} onChange={(valor) => atualizarFiltro("loja", valor)} /></div></div>
            <div className="market-filter-group"><strong>Faixa de preço</strong><div className="market-filter-row market-filter-price-row"><FiltroCampo label="Mínimo (Kz)" value={precoMinimo} onChange={(valor) => atualizarFiltro("precoMinimo", valor)} tipo="number" /><span className="market-filter-dash">a</span><FiltroCampo label="Máximo (Kz)" value={precoMaximo} onChange={(valor) => atualizarFiltro("precoMaximo", valor)} tipo="number" /></div></div>
            <div className="market-filter-group"><strong>Disponibilidade</strong><label className="market-filter-toggle"><input type="checkbox" aria-label="Apenas produtos em stock" checked={apenasDisponivel} onChange={() => alternarFiltroBooleano("apenasDisponivel")} /><span>Apenas produtos em stock</span></label><label className="market-filter-toggle"><input type="checkbox" aria-label="Apenas produtos com promoção" checked={apenasPromocao} onChange={() => alternarFiltroBooleano("apenasPromocao")} /><span>Apenas com promoção</span></label></div>
          </div>
          <div className="market-filter-mobile-actions"><button type="button" onClick={() => setFiltrosAbertos(false)}>Ver {carregando ? "resultados" : `${total} produto${total === 1 ? "" : "s"}`}</button></div>
        </aside>

        <section className="market-results" aria-live="polite" aria-busy={carregando}>
          <div className="market-results-head">
            <div><span>{carregando ? "A procurar" : `${total} produto${total === 1 ? "" : "s"}`}</span><h2>{categoriaSelecionada || (busca ? `Resultados para “${busca}”` : "Todos os produtos")}</h2></div>
            <div className="market-results-actions">
              <label><span>Ordenar por</span><select value={ordenarPor} onChange={(evento) => { const proximos = new URLSearchParams(searchParams); if (evento.target.value === "RELEVANCIA") proximos.delete("ordenarPor"); else proximos.set("ordenarPor", evento.target.value); proximos.delete("pagina"); setSearchParams(proximos); }}><option value="RELEVANCIA">Relevância</option><option value="PRECO_ASC">Menor preço</option><option value="PRECO_DESC">Maior preço</option><option value="MAIS_VENDIDOS">Mais vendidos</option><option value="NOVIDADES">Novidades</option><option value="ENTREGA_RAPIDA">Entrega mais rápida</option><option value="MAIOR_DESCONTO">Maior desconto</option></select><ChevronDown size={14} aria-hidden="true" /></label>
              <Link to="/login?returnTo=/onboarding&surface=team" className="market-seller-link">Vender no Bizy<ArrowRight size={15} /></Link>
            </div>
          </div>

          {chipsAtivos.length > 0 && <div className="market-active-filter-list" aria-label="Filtros activos">{chipsAtivos.map((chip) => <button type="button" key={chip.id} onClick={chip.limpar} aria-label={`Remover filtro ${chip.label}`}><span>{chip.label}</span><X size={13} /></button>)}<button type="button" className="market-active-clear" onClick={limparFiltros}>Limpar todos</button></div>}

          {erro && <div className="market-empty-state is-error" role="alert"><Package size={34} /><strong>Não foi possível carregar os produtos</strong><span>{erro}</span><button type="button" onClick={() => setRecarregar((valor) => valor + 1)}><RefreshCw size={15} />Tentar novamente</button></div>}
          {!erro && carregando && <GrelhaSkeleton quantidade={8} tipo="produto" />}
          {!erro && !carregando && produtos.length > 0 && <div className="market-product-grid">{produtos.map((produto) => <CartaoProdutoMarket key={`${produto.slugLoja}-${produto.codigo}`} produto={produto} />)}</div>}
          {!erro && !carregando && produtos.length === 0 && <div className="market-empty-state"><Search size={34} /><strong>Nenhum produto corresponde à pesquisa</strong><span>Retira alguns filtros ou explora outra categoria.</span><button type="button" onClick={limparFiltros}>Ver todo o catálogo</button></div>}
          {!erro && !carregando && totalPaginas > 1 && <PaginacaoMarket pagina={pagina} totalPaginas={totalPaginas} onPagina={(proxima) => { setSearchParams(paginaUrl(searchParams, proxima)); document.querySelector(".market-results")?.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" }); }} />}
        </section>
      </section>

      <AvisoPrivacidade escopo="market" texto="O Bizy Market mede buscas, origem e produtos vistos para melhorar descoberta entre lojas." />
      <RodapeMarket />
    </main>
  );
}

export function PaginaDiretorioLojasMarket() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const busca = searchParams.get("busca") ?? "";
  const categoria = searchParams.get("categoria") ?? "";
  const provincia = searchParams.get("provincia") ?? "";
  const ordenacao = searchParams.get("ordenar") ?? "PRODUTOS";
  const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);
  const [buscaRascunho, setBuscaRascunho] = useState(busca);
  const [lojas, setLojas] = useState<LojaMarket[]>([]);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [recarregar, setRecarregar] = useState(0);
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_LOJAS));

  useEffect(() => setBuscaRascunho(busca), [busca]);
  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};
    setCarregando(true);
    setErro("");
    void listarLojasMarket({ busca, categoria, provincia, limite: LIMITE_LOJAS, offset: (pagina - 1) * LIMITE_LOJAS })
      .then((resposta) => {
        if (!ativo) return;
        setLojas(resposta.lojas ?? []);
        setTotal(resposta.total ?? resposta.lojas?.length ?? 0);
        limparSeo = aplicarSeoMetaTags(montarSeoPublico({ titulo: "Lojas no Bizy Market", descricao: "Encontre lojas angolanas com produtos publicados, fornecedor identificado e compra organizada pelo Bizy Market.", canonicalPath: ROTAS_LOJAS.lojasMarket, imagem: IMAGEM_SEO_MARKET }));
      })
      .catch((falha) => { if (ativo) { setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as lojas do Market."); setLojas([]); setTotal(0); } })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; limparSeo(); };
  }, [busca, categoria, pagina, provincia, recarregar]);

  const lojasOrdenadas = useMemo(() => [...lojas].sort((a, b) => ordenacao === "NOME" ? a.nomeComercial.localeCompare(b.nomeComercial, "pt") : b.totalProdutos - a.totalProdutos), [lojas, ordenacao]);
  const actualizar = (chave: string, valor: string) => { const proximos = new URLSearchParams(searchParams); if (valor.trim()) proximos.set(chave, valor.trim()); else proximos.delete(chave); proximos.delete("pagina"); setSearchParams(proximos); };
  const categoriasRapidas = ["", "Moda", "Beleza", "Tecnologia", "Casa"];

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-stores-directory">
      <CabecalhoMarket busca={buscaRascunho} categoriaSelecionada={categoria} onBusca={setBuscaRascunho} onSubmitBusca={(valor) => actualizar("busca", valor)} onCategoria={(valor) => navigate(ROTAS_LOJAS.categoriaMarket(valor))} onLimpar={() => { setBuscaRascunho(""); setSearchParams({}); }} placeholder="Buscar loja pelo nome, segmento ou localização" />
      <section className="market-category-head market-directory-head">
        <span>Market / <b>Lojas</b></span><h1>Lojas no Bizy</h1><p>{carregando ? "A carregar fornecedores" : `${total} loja${total === 1 ? "" : "s"} com catálogo publicado`}</p>
        <div className="market-directory-toolbar">
          <div className="market-directory-chips" aria-label="Filtros rápidos de lojas">{categoriasRapidas.map((chip) => <button key={chip || "Todas"} type="button" className={categoria === chip ? "is-active" : ""} onClick={() => actualizar("categoria", chip)} aria-pressed={categoria === chip}>{chip || "Todas"}</button>)}</div>
          <label className="market-directory-location"><MapPin size={15} /><input value={provincia} onChange={(evento) => actualizar("provincia", evento.target.value)} placeholder="Filtrar por província" aria-label="Filtrar lojas por província" /></label>
          <label className="market-directory-order"><span>Ordenar</span><select value={ordenacao} onChange={(evento) => actualizar("ordenar", evento.target.value)}><option value="PRODUTOS">Mais produtos</option><option value="NOME">Nome A–Z</option></select><ChevronDown size={14} /></label>
        </div>
        {(busca || categoria || provincia) && <div className="market-active-filter-list"><span>Filtros activos</span>{busca && <button type="button" onClick={() => actualizar("busca", "")}>{busca}<X size={13} /></button>}{categoria && <button type="button" onClick={() => actualizar("categoria", "")}>{categoria}<X size={13} /></button>}{provincia && <button type="button" onClick={() => actualizar("provincia", "")}>{provincia}<X size={13} /></button>}</div>}
      </section>

      <section className="market-featured-stores market-commerce-stores" aria-live="polite" aria-busy={carregando}>
        <div className="market-section-title"><div><span>Directório comercial</span><strong>Descobre fornecedores por actividade.</strong></div><small>{carregando ? "A actualizar" : `Página ${pagina} de ${totalPaginas}`}</small></div>
        {erro && <div className="market-empty-state is-error" role="alert"><Store size={34} /><strong>Não foi possível carregar as lojas</strong><span>{erro}</span><button type="button" onClick={() => setRecarregar((valor) => valor + 1)}><RefreshCw size={15} />Tentar novamente</button></div>}
        {!erro && carregando && <GrelhaSkeleton quantidade={6} tipo="loja" />}
        {!erro && !carregando && lojasOrdenadas.length > 0 && <div className="market-store-row market-directory-grid">{lojasOrdenadas.map((loja) => <CartaoLojaMarket key={loja.slug || loja.nomeComercial} loja={{ ...normalizarFornecedorMarket(loja), totalProdutos: loja.totalProdutos, categorias: loja.categorias }} />)}</div>}
        {!erro && !carregando && lojasOrdenadas.length === 0 && <div className="market-empty-state"><Store size={34} /><strong>Nenhuma loja encontrada</strong><span>Retira um filtro ou procura por outro nome, segmento ou localização.</span><button type="button" onClick={() => setSearchParams({})}>Ver todas as lojas</button></div>}
        {!erro && !carregando && totalPaginas > 1 && <PaginacaoMarket pagina={pagina} totalPaginas={totalPaginas} onPagina={(proxima) => setSearchParams(paginaUrl(searchParams, proxima))} />}
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
    { icon: Compass, titulo: "Descoberta rápida", texto: "similares sem perder o contexto" }
  ];
  return <section className="market-ecom-trust" aria-label="Confiança no Bizy Market">{itens.map(({ icon: Icone, titulo, texto }) => <div key={titulo}><Icone size={18} /><span><strong>{titulo}</strong><small>{texto}</small></span></div>)}</section>;
}

function SecaoProdutosEmDestaque({ produtos }: { produtos: ProdutoMarketNormalizado[] }) {
  if (!produtos.length) return null;
  return (
    <section className="market-flash-section" aria-label="Produtos em destaque">
      <div className="market-section-title"><div><span><Bolt size={15} />Destaques disponíveis</span><strong>Produtos prontos para comprar agora.</strong></div><Link to={ROTAS_LOJAS.market}>Ver catálogo<ArrowRight size={15} /></Link></div>
      <div className="market-featured-product-grid">{produtos.map((produto) => <CartaoProdutoMarket key={`destaque-${produto.slugLoja}-${produto.codigo}`} produto={produto} />)}</div>
    </section>
  );
}

function SecaoCategoriasMarket({ categorias, produtos, onCategoria }: { categorias: CategoriaMarket[]; produtos: ProdutoMarketNormalizado[]; onCategoria: (categoria: string) => void }) {
  const categoriasPorNome = new Map(categorias.map((categoria) => [categoria.categoria.toLowerCase(), categoria]));
  const nomes = categorias.map((categoria) => categoria.categoria).slice(0, 8);
  const tiles = nomes.map((titulo, indice) => {
    const categoria = categoriasPorNome.get(titulo.toLowerCase());
    const editorial = CATEGORIAS_EDITORIAIS.find((item) => item.titulo.toLowerCase() === titulo.toLowerCase()) ?? CATEGORIAS_EDITORIAIS[indice % CATEGORIAS_EDITORIAIS.length];
    const produtoRepresentativo = produtos.find((produto) => produto.categoria.toLowerCase() === titulo.toLowerCase() && produto.fotoPrincipal);
    return { titulo, subtitulo: categoria ? `${categoria.total} produto${categoria.total === 1 ? "" : "s"}` : editorial.subtitulo, acento: editorial.acento, icone: editorial.icone, imagem: produtoRepresentativo?.fotoPrincipal ?? "" };
  });
  if (!tiles.length) return null;
  return (
    <section className="market-category-tiles" aria-label="Categorias em destaque">
      <div className="market-section-title"><div><span>Departamentos</span><strong>Comprar por categoria</strong></div><small>Explora o catálogo por interesse</small></div>
      <div className="market-category-tile-grid">{tiles.map((tile) => { const Icone = tile.icone; return <button key={tile.titulo} type="button" className={`market-category-tile accent-${tile.acento}`} onClick={() => onCategoria(tile.titulo)}><span className="market-category-media" aria-hidden="true">{tile.imagem ? <img src={tile.imagem} alt="" loading="lazy" /> : <Icone size={22} />}</span><span className="market-category-copy"><span className="market-category-name">{tile.titulo}</span><strong>{tile.subtitulo}</strong></span><ArrowRight size={15} aria-hidden="true" /></button>; })}</div>
    </section>
  );
}

function FiltroCampo({ label, onChange, value, tipo = "text" }: { label: string; onChange: (valor: string) => void; value: string; tipo?: "text" | "number" }) {
  return <label className="market-filter-input"><span>{label}</span><input type={tipo} value={value} onChange={(evento) => onChange(evento.target.value)} placeholder={label} min={tipo === "number" ? 0 : undefined} inputMode={tipo === "number" ? "numeric" : undefined} /></label>;
}

function GrelhaSkeleton({ quantidade, tipo }: { quantidade: number; tipo: "produto" | "loja" }) {
  return <div className={tipo === "produto" ? "market-product-grid" : "market-store-row market-directory-grid"} aria-label={`${tipo === "produto" ? "Produtos" : "Lojas"} a carregar`}>{Array.from({ length: quantidade }).map((_, indice) => <div key={indice} className={`market-${tipo}-skeleton`} aria-hidden="true"><span /><i /><i /><i /></div>)}</div>;
}

function PaginacaoMarket({ pagina, totalPaginas, onPagina }: { pagina: number; totalPaginas: number; onPagina: (pagina: number) => void }) {
  return (
    <nav className="market-pagination" aria-label="Paginação">
      <button type="button" disabled={pagina === 1} onClick={() => onPagina(pagina - 1)} aria-label="Página anterior"><ChevronLeft size={16} /><span>Anterior</span></button>
      <div>{paginasVisiveis(pagina, totalPaginas).map((numero) => <button type="button" key={numero} className={numero === pagina ? "is-active" : ""} aria-current={numero === pagina ? "page" : undefined} onClick={() => onPagina(numero)}>{numero}</button>)}</div>
      <button type="button" disabled={pagina === totalPaginas} onClick={() => onPagina(pagina + 1)} aria-label="Página seguinte"><span>Seguinte</span><ChevronRight size={16} /></button>
    </nav>
  );
}

export function PaginaLojaMarket() {
  const { slug = "" } = useParams<{ slug: string }>();
  return <Navigate replace to={slug ? ROTAS_LOJAS.loja(slug) : ROTAS_LOJAS.lojasMarket} />;
}
