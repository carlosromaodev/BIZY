import {
  BadgeDollarSign,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Images,
  LoaderCircle,
  Maximize2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Star,
  Tags,
  Truck,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  adicionarItemCheckoutBizy,
  adicionarFavoritoContaBizy,
  criarItemCheckoutDeProdutoMarket,
  listarProdutosSimilaresMarket,
  listarFavoritosContaBizy,
  normalizarProdutoMarket,
  obterConfiancaProdutoMarket,
  obterEstadoContaBizy,
  obterProdutoMarket,
  removerFavoritoContaBizy,
  ROTAS_LOJAS
} from "../api";
import type { ProdutoMarketNormalizado, ResumoConfiancaProdutoMarket } from "../api";
import type { RespostaProdutoMarket } from "../api";
import { aplicarSeoMetaTags, formatarKwanza, montarSeoPublico } from "../../../utilidades";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";
import { CartaoProdutoMarket } from "../componentes/CartaoProdutoMarket";

const CORES_VARIANTES: Record<string, string> = {
  amarelo: "#d9a441",
  azul: "#3d7bc0",
  bege: "#d8bd91",
  branco: "#f8f6ef",
  castanho: "#8a5a32",
  cinza: "#7f8782",
  dourado: "#d9a441",
  esmeralda: "#2f8763",
  laranja: "#d98e2b",
  preto: "#23232b",
  rosa: "#c97a8a",
  roxo: "#7a63c9",
  verde: "#2f8763",
  vermelho: "#c9564a",
  violeta: "#7a63c9"
};

function obterIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return (partes[0]?.[0] ?? "B").concat(partes[1]?.[0] ?? "").toUpperCase();
}

function normalizarTextoCor(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function resolverCorVisual(opcao: string, fallback: string) {
  const texto = normalizarTextoCor(opcao);
  const hex = opcao.match(/#(?:[0-9a-fA-F]{3}){1,2}/)?.[0];
  if (hex) return hex;
  return Object.entries(CORES_VARIANTES).find(([nome]) => texto.includes(nome))?.[1] ?? fallback;
}

function variantePareceCor(nome: string) {
  return /cor|color|tom/i.test(normalizarTextoCor(nome));
}

function formatarSeloPdpMarket(selo: string): string {
  return selo
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

export function PaginaProdutoMarket() {
  const { listingId = "" } = useParams();
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const [produto, setProduto] = useState<ProdutoMarketNormalizado | null>(null);
  const [similares, setSimilares] = useState<ProdutoMarketNormalizado[]>([]);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [buscaTopo, setBuscaTopo] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [favorito, setFavorito] = useState(false);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [galeriaAberta, setGaleriaAberta] = useState(false);
  const [fotosComErro, setFotosComErro] = useState<string[]>([]);
  const [variantesSelecionadas, setVariantesSelecionadas] = useState<Record<string, string>>({});
  const [afiliacao, setAfiliacao] = useState<RespostaProdutoMarket["afiliacao"]>(null);
  const [confianca, setConfianca] = useState<ResumoConfiancaProdutoMarket | null>(null);
  const dialogGaleriaRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};

    async function carregarProduto() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await obterProdutoMarket(listingId);
        const [respostaSimilares, resumoConfianca] = await Promise.all([
          listarProdutosSimilaresMarket(listingId, 8).catch(() => null),
          obterConfiancaProdutoMarket(listingId).catch(() => null)
        ]);
        if (!ativo) return;
        if (!resposta?.produto) {
          throw new Error("Produto fora do Market ou indisponível.");
        }
        const normalizado = normalizarProdutoMarket(resposta.produto);
        setProduto(normalizado);
        setAfiliacao(resposta.afiliacao ?? null);
        setConfianca(resumoConfianca);
        const combinacaoInicial = normalizado.combinacoesVariantes.find((item) => item.estado === "ATIVA" && item.quantidade > 0)
          ?? normalizado.combinacoesVariantes.find((item) => item.estado === "ATIVA");
        setVariantesSelecionadas(combinacaoInicial?.opcoes ?? {});
        const estadoConta = await obterEstadoContaBizy().catch(() => null);
        const favoritos = estadoConta?.autenticada ? await listarFavoritosContaBizy().catch(() => null) : null;
        if (ativo) setFavorito(Boolean(favoritos?.favoritos.some((item) => item.slugLoja === normalizado.fornecedor.slug && item.codigoProduto === normalizado.codigo)));
        setSimilares((respostaSimilares?.produtos ?? resposta.similares ?? []).map(normalizarProdutoMarket));
        setFotoAtiva(0);
        setFotosComErro([]);
        setQuantidade(1);
        limparSeo = aplicarSeoMetaTags(resposta.seo ?? montarSeoPublico({
          titulo: `${normalizado.nome} | Bizy Market`,
          descricao: normalizado.descricao || `${normalizado.nome} de ${normalizado.nomeFornecedor} no Bizy Market.`,
          canonicalPath: normalizado.urlMarket || ROTAS_LOJAS.produtoMarket(normalizado.listingId, normalizado.nome),
          imagem: normalizado.fotos[0] || undefined,
          tipo: "product"
        }));
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Produto fora do Market ou indisponível.");
        setProduto(null);
        setSimilares([]);
        setConfianca(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarProduto();
    return () => {
      ativo = false;
      limparSeo();
    };
  }, [listingId]);

  const fotos = useMemo(
    () => (produto?.fotos.length ? produto.fotos.filter((foto) => !fotosComErro.includes(foto)).slice(0, 6) : []),
    [fotosComErro, produto]
  );
  const thumbs = fotos.length ? fotos : ["", "", "", ""];
  const fotoPrincipal = fotos[fotoAtiva] || fotos[0] || "";

  function marcarFotoComErro(foto: string) {
    if (!foto) return;
    setFotosComErro((actuais) => actuais.includes(foto) ? actuais : [...actuais, foto]);
    setFotoAtiva(0);
  }

  useEffect(() => {
    const dialog = dialogGaleriaRef.current;
    if (!dialog) return;
    if (galeriaAberta && !dialog.open) dialog.showModal();
    if (!galeriaAberta && dialog.open) dialog.close();
  }, [galeriaAberta]);

  useEffect(() => {
    if (!galeriaAberta || fotos.length < 2) return;
    const navegarGaleria = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "ArrowLeft") setFotoAtiva((actual) => (actual - 1 + fotos.length) % fotos.length);
      if (evento.key === "ArrowRight") setFotoAtiva((actual) => (actual + 1) % fotos.length);
    };
    document.addEventListener("keydown", navegarGaleria);
    return () => document.removeEventListener("keydown", navegarGaleria);
  }, [fotos.length, galeriaAberta]);

  function submeterBusca(termoInformado = buscaTopo) {
    const termo = termoInformado.trim();
    navigate(termo ? `${ROTAS_LOJAS.market}?busca=${encodeURIComponent(termo)}` : ROTAS_LOJAS.market);
  }

  async function alternarFavorito() {
    if (!produto || guardandoFavorito) return;
    setGuardandoFavorito(true);
    setMensagemAcao("");
    try {
      if (favorito) await removerFavoritoContaBizy(produto.fornecedor.slug, produto.codigo);
      else await adicionarFavoritoContaBizy(produto.fornecedor.slug, produto.codigo);
      setFavorito((valor) => !valor);
      setMensagemAcao(favorito ? "Produto removido dos favoritos." : "Produto guardado nos favoritos.");
    } catch {
      navigate(`/conta/entrar?returnTo=${encodeURIComponent(window.location.pathname)}`);
    } finally {
      setGuardandoFavorito(false);
    }
  }

  function prepararItemCheckout() {
    if (!produto) return null;
    const combinacao = produto.combinacoesVariantes.find((item) =>
      item.estado === "ATIVA" && Object.entries(item.opcoes).every(([nome, valor]) => variantesSelecionadas[nome] === valor)
    );
    if (Object.keys(produto.variantes).length > 0 && (!combinacao || combinacao.quantidade < quantidade)) {
      setMensagemAcao("Selecciona uma combinação disponível antes de continuar.");
      return null;
    }
    return criarItemCheckoutDeProdutoMarket(
      produto,
      quantidade,
      "market-pdp",
      variantesSelecionadas,
      combinacao?.precoEmKwanza ?? produto.precoFinalEmKwanza
    );
  }

  function adicionarAoCheckoutBizy() {
    const item = prepararItemCheckout();
    if (!item) return;
    setAdicionando(true);
    setMensagemAcao("");
    try {
      adicionarItemCheckoutBizy(item);
      setMensagemAcao(`${quantidade} unidade${quantidade === 1 ? "" : "s"} adicionada${quantidade === 1 ? "" : "s"} à sacola.`);
    } finally {
      window.setTimeout(() => setAdicionando(false), 260);
    }
  }

  function comprarAgora() {
    const item = prepararItemCheckout();
    if (!item) return;
    adicionarItemCheckoutBizy(item);
    navigate(`${ROTAS_LOJAS.checkout}?origem=comprar-agora`);
  }

  function selecionarOpcaoVariante(nome: string, opcao: string) {
    if (!produto) return;
    setVariantesSelecionadas((actual) => {
      const tentativa = { ...actual, [nome]: opcao };
      const exacta = produto.combinacoesVariantes.find((item) =>
        item.estado === "ATIVA" && Object.entries(item.opcoes).every(([chave, valor]) => tentativa[chave] === valor)
      );
      if (exacta) return exacta.opcoes;
      const compativel = produto.combinacoesVariantes.find((item) =>
        item.estado === "ATIVA" && item.opcoes[nome] === opcao && item.quantidade > 0
      );
      return compativel?.opcoes ?? tentativa;
    });
    setQuantidade(1);
  }

  const cabecalhoBase = (
    <CabecalhoMarket
      busca={buscaTopo}
      onBusca={setBuscaTopo}
      onCategoria={(categoria) => navigate(ROTAS_LOJAS.categoriaMarket(categoria))}
      onLimpar={() => {
        setBuscaTopo("");
        navigate(ROTAS_LOJAS.market);
      }}
      onSubmitBusca={submeterBusca}
    />
  );

  if (carregando) {
    return (
      <main className="bizy-market-page market-commerce-page market-public-page market-pdp-page" aria-busy="true">
        {cabecalhoBase}
        <div className="market-pdp-loading"><span className="market-state-spinner" aria-hidden="true" />A carregar produto...</div>
        <RodapeMarket />
      </main>
    );
  }

  if (erro || !produto) {
    return (
      <main className="bizy-market-page market-commerce-page market-public-page market-pdp-page">
        {cabecalhoBase}
        <div className="market-pdp-error">
          <Package size={36} />
          <h1>Produto fora do Market</h1>
          <p>{erro || "Este produto não está disponível no shopping center Bizy."}</p>
          <Link to={ROTAS_LOJAS.market}>Voltar ao Market</Link>
        </div>
        <RodapeMarket />
      </main>
    );
  }

  const variantesVisiveis = Object.entries(produto.variantes ?? {})
    .filter(([, opcoes]) => opcoes.length > 0);
  const combinacaoSelecionada = produto.combinacoesVariantes.find((item) =>
    item.estado === "ATIVA" && Object.entries(item.opcoes).every(([nome, valor]) => variantesSelecionadas[nome] === valor)
  );
  const stockMaximo = variantesVisiveis.length > 0 ? combinacaoSelecionada?.quantidade ?? 0 : produto.quantidade;
  const precoSelecionado = combinacaoSelecionada?.precoEmKwanza ?? produto.precoFinalEmKwanza;
  const precoAntigoSelecionado = combinacaoSelecionada?.precoEmKwanza == null
    ? produto.precoAntigoEmKwanza
    : null;
  const disponivelSelecao = produto.disponivel && stockMaximo > 0;
  const desconto = produto.descontoPercentual ? `-${produto.descontoPercentual}%` : disponivelSelecao ? "Em stock" : "Indisponível";
  const economiaEmKwanza = precoAntigoSelecionado ? Math.max(0, precoAntigoSelecionado - precoSelecionado) : 0;
  const stockTexto = !disponivelSelecao
    ? "Combinação indisponível"
    : stockMaximo <= 3
      ? `Baixo stock: restam ${stockMaximo}`
      : `${stockMaximo} unidades disponíveis`;
  const seloPrincipal = produto.selos.find((selo) => selo !== "PATROCINADO" && selo !== "VERIFICADO");
  const lojaVerificada = produto.selos.includes("VERIFICADO");
  const selecaoResumo = variantesVisiveis
    .map(([nome]) => `${nome}: ${variantesSelecionadas[nome] ?? "-"}`)
    .join(" · ");

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-pdp-page market-pdp-design">
      <CabecalhoMarket
        busca={buscaTopo}
        categoriaSelecionada={produto.categoria}
        onBusca={setBuscaTopo}
        onCategoria={(categoria) => navigate(ROTAS_LOJAS.categoriaMarket(categoria))}
        onLimpar={() => {
          setBuscaTopo("");
          navigate(ROTAS_LOJAS.market);
        }}
        onSubmitBusca={submeterBusca}
      />

      <section className="market-pdp-crumbbar cat-head">
        <div className="market-pdp-breadcrumb crumb2">
          Market / {produto.categoria}{produto.colecao ? ` / ${produto.colecao}` : ""} / <b>{produto.nome}</b>
        </div>
      </section>

      <section className="market-pdp-shell pdp">
        <motion.div
          className="market-pdp-gallery market-pdp-visual-column"
          initial={reduzirMovimento ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={`market-pdp-photo market-pdp-main-visual pdp-main ${fotoPrincipal ? "has-image" : "is-placeholder"}`}>
            <span className="off">{desconto}</span>
            <button type="button" className={`fav ${favorito ? "is-active" : ""}`} aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={favorito} disabled={guardandoFavorito} onClick={() => void alternarFavorito()}>
              {guardandoFavorito ? <LoaderCircle className="market-spin" size={16} /> : <Heart size={16} fill={favorito ? "currentColor" : "none"} />}
            </button>
            {fotoPrincipal ? (
              <button type="button" className="market-pdp-zoom-trigger" onClick={() => setGaleriaAberta(true)} aria-label={`Ampliar imagem de ${produto.nome}`}>
                <img key={fotoPrincipal} src={fotoPrincipal} alt={produto.nome} onError={() => marcarFotoComErro(fotoPrincipal)} />
                <span><Maximize2 size={15} />Ampliar</span>
              </button>
            ) : <Package size={64} />}
            {fotos.length > 1 && <div className="market-pdp-gallery-nav"><button type="button" onClick={() => setFotoAtiva((actual) => (actual - 1 + fotos.length) % fotos.length)} aria-label="Imagem anterior"><ChevronLeft size={18} /></button><span>{fotoAtiva + 1} / {fotos.length}</span><button type="button" onClick={() => setFotoAtiva((actual) => (actual + 1) % fotos.length)} aria-label="Imagem seguinte"><ChevronRight size={18} /></button></div>}
          </div>
          <div className="market-pdp-thumbs pdp-thumbs" aria-label="Fotos do produto">
            {thumbs.map((foto, indice) => (
              foto ? (
                <button
                  key={`${foto}-${indice}`}
                  type="button"
                  className={`th ${fotoAtiva === indice ? "on" : ""}`}
                  onClick={() => setFotoAtiva(indice)}
                  aria-label={`Mostrar imagem ${indice + 1} de ${produto.nome}`}
                  aria-current={fotoAtiva === indice ? "true" : undefined}
                >
                  <img src={foto} alt={`${produto.nome}, imagem ${indice + 1}`} onError={() => marcarFotoComErro(foto)} />
                </button>
              ) : (
                <span key={`placeholder-${indice}`} className={`th is-placeholder ${indice === 0 ? "on" : ""}`} />
              )
            ))}
          </div>
          <dialog ref={dialogGaleriaRef} className="market-pdp-lightbox" onClose={() => setGaleriaAberta(false)} onCancel={() => setGaleriaAberta(false)} onClick={(evento) => { if (evento.target === evento.currentTarget) setGaleriaAberta(false); }}>
            <div>
              <header><span><Images size={17} />{produto.nome}</span><button type="button" onClick={() => setGaleriaAberta(false)} aria-label="Fechar galeria"><X size={20} /></button></header>
              <figure>{fotoPrincipal ? <img src={fotoPrincipal} alt={`${produto.nome}, imagem ampliada ${fotoAtiva + 1}`} onError={() => marcarFotoComErro(fotoPrincipal)} /> : <Package size={64} />}</figure>
              {fotos.length > 1 && <footer><button type="button" onClick={() => setFotoAtiva((actual) => (actual - 1 + fotos.length) % fotos.length)}><ChevronLeft size={18} />Anterior</button><span>{fotoAtiva + 1} de {fotos.length}</span><button type="button" onClick={() => setFotoAtiva((actual) => (actual + 1) % fotos.length)}>Seguinte<ChevronRight size={18} /></button></footer>}
            </div>
          </dialog>
        </motion.div>

        <motion.aside
          className="market-pdp-panel market-pdp-info"
          initial={reduzirMovimento ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="market-pdp-supplier-card market-pdp-seller-v2 seller">
            <span className="lg">
              {produto.fornecedor.logoUrl ? <img src={produto.fornecedor.logoUrl} alt="" /> : obterIniciais(produto.nomeFornecedor)}
            </span>
            <div>
              <div className="nm">
                Vendido por <b>{produto.nomeFornecedor}</b>
                {lojaVerificada && (
                  <span className="vf" aria-label="Loja verificada">
                    <CheckCircle2 size={10} />
                  </span>
                )}
              </div>
              <div className="loc">{produto.fornecedor.localizacao || "Loja Bizy"} · {confianca?.seller.total ? `${confianca.seller.media}/5 em ${confianca.seller.total} avaliação${confianca.seller.total === 1 ? "" : "ões"} verificada${confianca.seller.total === 1 ? "" : "s"}` : "sem avaliações verificadas"}</div>
            </div>
            <Link to={ROTAS_LOJAS.loja(produto.slugLoja)} className="go">Ver loja →</Link>
          </div>

          <span className="market-pdp-category">{produto.categoria}</span>
          <h1>{produto.nome}</h1>
          <div className="market-pdp-signal" aria-label="Sinais reais do produto">
            {seloPrincipal ? (
              <span><Tags size={13} />{formatarSeloPdpMarket(seloPrincipal)}</span>
            ) : (
              <span><ShieldCheck size={13} />Fornecedor identificado</span>
            )}
            {lojaVerificada && <span><CheckCircle2 size={13} />Loja verificada</span>}
            {produto.emPromocao && <span>Promoção</span>}
          </div>

          <div className="market-pdp-price prrow">
            <div><span className="pr">{formatarKwanza(precoSelecionado)}</span>{precoAntigoSelecionado && <span className="old">{formatarKwanza(precoAntigoSelecionado)}</span>}</div>
            {economiaEmKwanza > 0 && <small>Economiza {formatarKwanza(economiaEmKwanza)}</small>}
          </div>

          <div className={`market-pdp-stock-status${stockMaximo <= 3 ? " is-low" : ""}${!disponivelSelecao ? " is-out" : ""}`} role="status">
            <span><i />{stockTexto}</span>
            {combinacaoSelecionada?.sku && <small>SKU {combinacaoSelecionada.sku}</small>}
          </div>

          {variantesVisiveis.length > 0 && (
            <div className="market-pdp-options" aria-label="Variações disponíveis">
              {variantesVisiveis.map(([nome, opcoes]) => (
                <div key={nome} className="market-pdp-option-group">
                  <span className="lab2">{nome}{variantePareceCor(nome) && variantesSelecionadas[nome] ? ` · ${variantesSelecionadas[nome]}` : ""}</span>
                  <div className="pick-row">
                    {opcoes.slice(0, 5).map((opcao) => {
                      const disponivel = produto.combinacoesVariantes.some((item) => item.estado === "ATIVA" && item.quantidade > 0 && item.opcoes[nome] === opcao);
                      const seleccionada = variantesSelecionadas[nome] === opcao;
                      return (
                        <button
                          key={opcao}
                          type="button"
                          className={seleccionada ? "is-active" : ""}
                          aria-label={`${nome}: ${opcao}`}
                          aria-pressed={seleccionada}
                          title={`${nome}: ${opcao}`}
                          disabled={!disponivel}
                          onClick={() => selecionarOpcaoVariante(nome, opcao)}
                        >
                          {variantePareceCor(nome) ? (
                            <span
                              className="market-pdp-color-dot"
                              style={{ background: resolverCorVisual(opcao, produto.fornecedor.corPrimaria) }}
                            />
                          ) : (
                            opcao
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="market-pdp-quantity" aria-label="Quantidade para compra">
            <span className="lab2">Quantidade <small>máx. {stockMaximo}</small></span>
            <div className="qty2">
              <button type="button" className="b" disabled={quantidade <= 1} onClick={() => setQuantidade((valor) => Math.max(1, valor - 1))} aria-label="Diminuir quantidade">
                <Minus size={14} />
              </button>
              <strong className="v">{quantidade}</strong>
              <button type="button" className="b" disabled={stockMaximo <= 0 || quantidade >= stockMaximo} onClick={() => setQuantidade((valor) => Math.min(stockMaximo, valor + 1))} aria-label="Aumentar quantidade">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="market-pdp-actions pdp-cta">
            <button type="button" className="market-pdp-checkout" disabled={!disponivelSelecao || adicionando} onClick={adicionarAoCheckoutBizy}>
              {adicionando ? <LoaderCircle className="market-spin" size={18} /> : <ShoppingBag size={18} />}
              Adicionar à sacola
            </button>
            <button type="button" className="market-pdp-buy-now" disabled={!disponivelSelecao} onClick={comprarAgora}>Comprar agora</button>
          </div>

          {mensagemAcao && <div className="market-pdp-action-feedback" role="status" aria-live="polite"><CheckCircle2 size={15} /><span>{mensagemAcao}</span>{mensagemAcao.includes("sacola") && <Link to={ROTAS_LOJAS.checkout}>Ver sacola</Link>}</div>}

          {afiliacao && (
            <Link className="market-pdp-affiliate" to={`/creator/oportunidades?produto=${encodeURIComponent(produto.listingId)}&oferta=${encodeURIComponent(afiliacao.ofertaId)}`}>
              <BadgeDollarSign size={18} />
              <span><strong>Promover e ganhar comissão</strong><small>{afiliacao.comissaoTipo === "PERCENTUAL" ? `${afiliacao.comissaoValor / 100}% por venda atribuída` : `${formatarKwanza(afiliacao.comissaoValor)} por venda atribuída`}</small></span>
              <ChevronRight size={17} />
            </Link>
          )}

          <div className="market-pdp-service-grid market-pdp-delivery-lines">
            <div><Truck size={18} /><span><strong>Entrega calculada no checkout</strong><small>Prazo e custo separados por fornecedor.</small></span></div>
            <div><ShieldCheck size={18} /><span><strong>Compra acompanhada</strong><small>Pedido, pagamento e entrega ficam registados.</small></span></div>
            <div><Store size={18} /><span><strong>{produto.nomeFornecedor}</strong><small>{produto.fornecedor.localizacao || "Fornecedor Bizy identificado"}</small></span></div>
          </div>

          {selecaoResumo && <small className="market-pdp-selection">Selecção actual: {selecaoResumo}</small>}
        </motion.aside>
      </section>

      <section className="market-pdp-details" aria-label="Informação detalhada do produto">
        <article className="market-pdp-description"><span>Descrição</span><h2>Sobre este produto</h2><p>{produto.descricao || produto.colecao || "Produto publicado por uma loja Bizy com stock e preço validados no checkout."}</p></article>
        <article><span>Especificações</span><h2>Dados do catálogo</h2><dl><div><dt>Categoria</dt><dd>{produto.categoria}</dd></div><div><dt>Código</dt><dd>{produto.codigo}</dd></div>{produto.colecao && <div><dt>Colecção</dt><dd>{produto.colecao}</dd></div>}{Object.entries(variantesSelecionadas).map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor}</dd></div>)}</dl></article>
        <article><span>Garantia e devolução</span><h2>Condições transparentes</h2><p>As condições específicas são definidas por {produto.nomeFornecedor}. Confirma garantia, troca ou devolução na revisão antes do pagamento; o histórico da compra permanece no Bizy.</p></article>
      </section>

      <section className="market-pdp-trust-section" aria-labelledby="market-pdp-reviews-title">
        <div className="market-section-title">
          <span id="market-pdp-reviews-title">Avaliações de compras verificadas</span>
          <strong>{confianca?.produto.total ? `${confianca.produto.media}/5 · ${confianca.produto.total} avaliação${confianca.produto.total === 1 ? "" : "ões"}` : "Este produto ainda não recebeu avaliações verificadas."}</strong>
        </div>
        {confianca?.avaliacoes.length ? (
          <div className="market-pdp-review-grid">
            {confianca.avaliacoes.slice(0, 6).map((avaliacao) => (
              <article key={avaliacao.id}>
                <header><span><Star size={15} fill="currentColor" /> {avaliacao.notaProduto}/5</span><small><CheckCircle2 size={13} /> Compra verificada</small></header>
                {avaliacao.titulo && <strong>{avaliacao.titulo}</strong>}
                <p>{avaliacao.comentario || "O comprador avaliou este produto sem comentário."}</p>
                <time dateTime={avaliacao.criadoEm}>{new Intl.DateTimeFormat("pt-AO", { dateStyle: "medium" }).format(new Date(avaliacao.criadoEm))}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="market-pdp-no-reviews"><Star size={20} /><span>A reputação só aparece após avaliações de pedidos entregues. Nenhuma nota foi estimada.</span></div>
        )}
      </section>

      <section className="market-similar-section">
        <div className="market-section-title">
          <span>Mais desta loja & similares no Market</span>
          <strong>Outras lojas podem ter produtos parecidos.</strong>
        </div>
        {similares.length ? (
          <div className="market-product-grid">
            {similares.map((similar) => <CartaoProdutoMarket key={`${similar.slugLoja}-${similar.codigo}`} produto={similar} />)}
          </div>
        ) : (
          <div className="market-empty-state">
            <Package size={28} />
            <strong>Sem similares por agora</strong>
            <span>Este produto continua disponível no fornecedor original.</span>
          </div>
        )}
      </section>

      <RodapeMarket />
    </main>
  );
}
