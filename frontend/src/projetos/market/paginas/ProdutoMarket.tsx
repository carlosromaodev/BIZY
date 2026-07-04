import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Heart,
  Home,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  User
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NativeBottomNav } from "@/components/ui/native-bottom-nav";
import {
  adicionarItemCheckoutBizy,
  criarItemCheckoutDeProdutoMarket,
  listarProdutosSimilaresMarket,
  normalizarProdutoMarket,
  obterProdutoMarket,
  ROTAS_LOJAS
} from "../api";
import type { ProdutoMarketNormalizado } from "../api";
import { aplicarSeoMetaTags, formatarKwanza } from "../../../utilidades";

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

function obterGradienteProduto(produto: ProdutoMarketNormalizado) {
  const cor = produto.fornecedor.corPrimaria || "#0e8c68";
  if (produto.categoria.toLowerCase().includes("beleza")) return "linear-gradient(150deg,#c97a8a,#92485c)";
  if (produto.categoria.toLowerCase().includes("tecnologia")) return "linear-gradient(150deg,#5a87c5,#2f5588)";
  if (produto.categoria.toLowerCase().includes("comida")) return "linear-gradient(150deg,#d9a441,#9c6b1c)";
  return `linear-gradient(150deg, ${cor}, #0a5740)`;
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
        setSimilares((respostaSimilares?.produtos ?? resposta.similares ?? []).map(normalizarProdutoMarket));
        setFotoAtiva(0);
        setQuantidade(1);
        limparSeo = aplicarSeoMetaTags(resposta.seo ?? {
          titulo: `${normalizado.nome} | Bizy Market`,
          descricao: normalizado.descricao || undefined,
          imagem: normalizado.fotos[0] || undefined
        });
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

  function submeterBusca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const termo = buscaTopo.trim();
    navigate(termo ? `${ROTAS_LOJAS.market}?busca=${encodeURIComponent(termo)}` : ROTAS_LOJAS.market);
  }

  function adicionarAoCheckoutBizy() {
    if (!produto) return;
    adicionarItemCheckoutBizy(criarItemCheckoutDeProdutoMarket(produto, quantidade, "market-pdp"));
    navigate(ROTAS_LOJAS.checkout);
  }

  if (carregando) {
    return (
      <main className="bizy-market-page market-pdp-page min-h-[100dvh] bg-[#f5f3ed]">
        <div className="market-pdp-loading">A carregar produto...</div>
      </main>
    );
  }

  if (erro || !produto) {
    return (
      <main className="bizy-market-page market-pdp-page min-h-[100dvh] bg-[#f5f3ed] text-neutral-950">
        <div className="market-pdp-error">
          <Package size={36} />
          <h1>Produto fora do Market</h1>
          <p>{erro || "Este produto não está disponível no shopping center Bizy."}</p>
          <Link to={ROTAS_LOJAS.market}>Voltar ao Market</Link>
        </div>
      </main>
    );
  }

  const variantesVisiveis = Object.entries(produto.variantes ?? {})
    .filter(([, opcoes]) => opcoes.length > 0)
    .slice(0, 2);
  const gradienteProduto = obterGradienteProduto(produto);
  const stockMaximo = Math.max(1, produto.quantidade || 1);
  const desconto = produto.descontoPercentual ? `-${produto.descontoPercentual}%` : produto.disponivel ? "Em stock" : "Indisponível";
  const seloPrincipal = produto.selos.find((selo) => selo !== "PATROCINADO" && selo !== "VERIFICADO");
  const lojaVerificada = produto.selos.includes("VERIFICADO");
  const selecaoResumo = variantesVisiveis
    .map(([nome, opcoes]) => `${nome}: ${opcoes[0]}`)
    .join(" · ");

  return (
    <main className="bizy-market-page market-commerce-page market-pdp-page market-pdp-design min-h-[100dvh] bg-[#faf8f4] text-neutral-950">
      <header className="market-pdp-design-top mkt-top market-pdp-commerce-top">
        <button type="button" className="market-pdp-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <Link to={ROTAS_LOJAS.market} className="market-wordmark-text wm" aria-label="Bizy Market">
          bizy<span className="dot">.</span>
        </Link>
        <Link to={ROTAS_LOJAS.market} className="market-tag mtag">Market</Link>
        <form className="market-pdp-search mkt-search" onSubmit={submeterBusca}>
          <Search size={17} />
          <input
            value={buscaTopo}
            onChange={(evento) => setBuscaTopo(evento.target.value)}
            placeholder="Buscar produtos, lojas e categorias..."
            aria-label="Buscar no Bizy Market"
          />
        </form>
        <button type="button" className="market-pdp-header-action mkt-ic" aria-label="Favoritos">
          <Heart size={18} />
        </button>
        <Link to={ROTAS_LOJAS.checkout} className="market-pdp-header-action mkt-ic" aria-label="Sacola">
          <ShoppingBag size={18} />
        </Link>
        <span className="market-pdp-avatar mkt-av" aria-hidden="true">
          <User size={16} />
        </span>
      </header>

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
          <div className="market-pdp-photo market-pdp-main-visual pdp-main" style={{ background: gradienteProduto }}>
            <span className="off">{desconto}</span>
            <button type="button" className="fav" aria-label="Adicionar aos favoritos">
              <Heart size={16} />
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
                <span key={`placeholder-${indice}`} className={`th ${indice === 0 ? "on" : ""}`} style={{ background: gradienteProduto }} />
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
            <span className="pr">{formatarKwanza(produto.precoFinalEmKwanza)}</span>
            {produto.precoAntigoEmKwanza && <span className="old">{formatarKwanza(produto.precoAntigoEmKwanza)}</span>}
          </div>

          {variantesVisiveis.length > 0 && (
            <div className="market-pdp-options" aria-label="Variações disponíveis">
              {variantesVisiveis.map(([nome, opcoes]) => (
                <div key={nome} className="market-pdp-option-group">
                  <span className="lab2">{nome}{variantePareceCor(nome) && opcoes[0] ? ` · ${opcoes[0]}` : ""}</span>
                  <div className="pick-row">
                    {opcoes.slice(0, 5).map((opcao, indice) => (
                      <button key={opcao} type="button" className={indice === 0 ? "is-active" : ""}>
                        {variantePareceCor(nome) ? (
                          <span
                            className="market-pdp-color-dot"
                            style={{ background: resolverCorVisual(opcao, produto.fornecedor.corPrimaria) }}
                          />
                        ) : (
                          opcao
                        )}
                      </button>
                    ))}
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
              <button type="button" className="b" disabled={quantidade >= stockMaximo} onClick={() => setQuantidade((valor) => Math.min(stockMaximo, valor + 1))} aria-label="Aumentar quantidade">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="market-pdp-actions pdp-cta">
            <button type="button" className="market-pdp-checkout" onClick={adicionarAoCheckoutBizy}>
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
            {similares.map((similar) => (
              <article key={`${similar.slugLoja}-${similar.codigo}`} className="market-product-card">
                <Link to={similar.urlMarket} className="market-product-media">
                  {similar.fotoPrincipal ? <img src={similar.fotoPrincipal} alt={similar.nome} /> : <Package size={34} />}
                </Link>
                <div className="market-product-body">
                  <Link to={similar.urlMarket} className="market-product-name">{similar.nome}</Link>
                  <div className="market-product-price"><strong>{formatarKwanza(similar.precoFinalEmKwanza)}</strong></div>
                  <Link to={similar.urlLoja} className="market-product-supplier">
                    <Store size={13} />
                    <span>{similar.nomeFornecedor}</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="market-empty-state">
            <Package size={28} />
            <strong>Sem similares por agora</strong>
            <span>Este produto continua disponível no fornecedor original.</span>
          </div>
        )}
      </section>

      <NativeBottomNav
        activePillId="bizy-market-product-bottom-nav"
        className="lp-nav market-bottom-nav"
        label="Navegação do produto"
        items={[
          { id: "inicio", label: "Início", icon: Home, onClick: () => navigate("/") },
          { id: "market", label: "Market", icon: Compass, active: true, onClick: () => navigate(ROTAS_LOJAS.market) },
          { id: "loja", label: "Loja", icon: Store, onClick: () => navigate(produto.urlLoja) },
          { id: "comprar", label: "Comprar", icon: ShoppingBag, variant: "cta", onClick: adicionarAoCheckoutBizy }
        ]}
      />
    </main>
  );
}
