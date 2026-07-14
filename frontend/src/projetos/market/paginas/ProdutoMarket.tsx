import {
  CheckCircle2,
  Heart,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  adicionarItemCheckoutBizy,
  adicionarFavoritoContaBizy,
  criarItemCheckoutDeProdutoMarket,
  listarProdutosSimilaresMarket,
  listarFavoritosContaBizy,
  normalizarProdutoMarket,
  obterProdutoMarket,
  removerFavoritoContaBizy,
  ROTAS_LOJAS
} from "../api";
import type { ProdutoMarketNormalizado } from "../api";
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
  const { codigo = "" } = useParams();
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
  const [variantesSelecionadas, setVariantesSelecionadas] = useState<Record<string, string>>({});

  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};

    async function carregarProduto() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await obterProdutoMarket(codigo);
        const respostaSimilares = await listarProdutosSimilaresMarket(codigo, 8).catch(() => null);
        if (!ativo) return;
        if (!resposta?.produto) {
          throw new Error("Produto fora do Market ou indisponível.");
        }
        const normalizado = normalizarProdutoMarket(resposta.produto);
        setProduto(normalizado);
        const combinacaoInicial = normalizado.combinacoesVariantes.find((item) => item.estado === "ATIVA" && item.quantidade > 0)
          ?? normalizado.combinacoesVariantes.find((item) => item.estado === "ATIVA");
        setVariantesSelecionadas(combinacaoInicial?.opcoes ?? {});
        const favoritos = await listarFavoritosContaBizy().catch(() => null);
        if (ativo) setFavorito(Boolean(favoritos?.favoritos.some((item) => item.slugLoja === normalizado.fornecedor.slug && item.codigoProduto === normalizado.codigo)));
        setSimilares((respostaSimilares?.produtos ?? resposta.similares ?? []).map(normalizarProdutoMarket));
        setFotoAtiva(0);
        setQuantidade(1);
        limparSeo = aplicarSeoMetaTags(resposta.seo ?? montarSeoPublico({
          titulo: `${normalizado.nome} | Bizy Market`,
          descricao: normalizado.descricao || `${normalizado.nome} de ${normalizado.nomeFornecedor} no Bizy Market.`,
          canonicalPath: normalizado.urlMarket || ROTAS_LOJAS.produtoMarket(normalizado.codigo),
          imagem: normalizado.fotos[0] || undefined,
          tipo: "product"
        }));
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Produto fora do Market ou indisponível.");
        setProduto(null);
        setSimilares([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarProduto();
    return () => {
      ativo = false;
      limparSeo();
    };
  }, [codigo]);

  const fotos = useMemo(() => (produto?.fotos.length ? produto.fotos.slice(0, 6) : []), [produto]);
  const thumbs = fotos.length ? fotos : ["", "", "", ""];
  const fotoPrincipal = fotos[fotoAtiva] || produto?.fotoPrincipal || "";

  function submeterBusca(termoInformado = buscaTopo) {
    const termo = termoInformado.trim();
    navigate(termo ? `${ROTAS_LOJAS.market}?busca=${encodeURIComponent(termo)}` : ROTAS_LOJAS.market);
  }

  async function alternarFavorito() {
    if (!produto) return;
    try {
      if (favorito) await removerFavoritoContaBizy(produto.fornecedor.slug, produto.codigo);
      else await adicionarFavoritoContaBizy(produto.fornecedor.slug, produto.codigo);
      setFavorito((valor) => !valor);
    } catch {
      navigate(ROTAS_LOJAS.compras);
    }
  }

  function adicionarAoCheckoutBizy() {
    if (!produto) return;
    const combinacao = produto.combinacoesVariantes.find((item) =>
      item.estado === "ATIVA" && Object.entries(item.opcoes).every(([nome, valor]) => variantesSelecionadas[nome] === valor)
    );
    if (Object.keys(produto.variantes).length > 0 && (!combinacao || combinacao.quantidade < quantidade)) return;
    adicionarItemCheckoutBizy(criarItemCheckoutDeProdutoMarket(
      produto,
      quantidade,
      "market-pdp",
      variantesSelecionadas,
      combinacao?.precoEmKwanza ?? produto.precoFinalEmKwanza
    ));
    navigate(ROTAS_LOJAS.checkout);
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
            <button type="button" className={`fav ${favorito ? "is-active" : ""}`} aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={favorito} onClick={() => void alternarFavorito()}>
              <Heart size={16} fill={favorito ? "currentColor" : "none"} />
            </button>
            {fotoPrincipal ? <img src={fotoPrincipal} alt={produto.nome} /> : <Package size={64} />}
          </div>
          <div className="market-pdp-thumbs pdp-thumbs" aria-label="Fotos do produto">
            {thumbs.map((foto, indice) => (
              foto ? (
                <button
                  key={`${foto}-${indice}`}
                  type="button"
                  className={`th ${fotoAtiva === indice ? "on" : ""}`}
                  onClick={() => setFotoAtiva(indice)}
                  aria-current={fotoAtiva === indice ? "true" : undefined}
                >
                  <img src={foto} alt="" />
                </button>
              ) : (
                <span key={`placeholder-${indice}`} className={`th is-placeholder ${indice === 0 ? "on" : ""}`} />
              )
            ))}
          </div>
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
              <div className="loc">{produto.fornecedor.localizacao || "Loja Bizy"} · fornecedor identificado</div>
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
            <span className="pr">{formatarKwanza(precoSelecionado)}</span>
            {precoAntigoSelecionado && <span className="old">{formatarKwanza(precoAntigoSelecionado)}</span>}
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
            <span className="lab2">Quantidade</span>
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
            <button type="button" className="market-pdp-checkout" disabled={!disponivelSelecao} onClick={adicionarAoCheckoutBizy}>
              <ShoppingBag size={18} />
              Adicionar ao checkout
            </button>
            <Link to={produto.urlProduto} className="market-pdp-contact market-pdp-wa wa" aria-label="Comprar ou falar com a loja">
              <MessageCircle size={18} />
            </Link>
          </div>

          <div className="market-pdp-description">
            {produto.descricao || produto.colecao || "Produto publicado por uma loja Bizy."}
          </div>

          <div className="market-pdp-delivery-lines dlines">
            <div className="dline"><Truck size={18} /><span>Entrega, retirada ou combinação direta conforme a política de {produto.nomeFornecedor}.</span></div>
            <div className="dline"><Store size={18} /><span>Fornecedor: <b>{produto.nomeFornecedor}</b>{produto.fornecedor.localizacao ? ` · ${produto.fornecedor.localizacao}` : ""}.</span></div>
            <div className="dline"><ShieldCheck size={18} /><span>Pagamento por transferência/comprovativo, dinheiro na entrega ou método combinado quando disponível.</span></div>
          </div>

          {selecaoResumo && <small className="market-pdp-selection">Seleção inicial: {selecaoResumo}</small>}
        </motion.aside>
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
