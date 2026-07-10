import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Minus,
  Package,
  Phone,
  Plus,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Truck,
  User,
  Sparkles,
  ArrowUpDown,
  X
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { obterBaseApiUrl, resolverUrlMedia } from "../../../api";
import { resolverSlugLojaPublica } from "../dominio/lojaSubdominio";
import { adicionarItemCheckoutBizy, deixarDeSeguirLoja, obterLojaPublica, ROTAS_LOJAS, seguirLoja, verificarSeSegueLoja } from "../api";
import { LogoBizy } from "../../../marca/bizy";
import { AvisoPrivacidade } from "../../../componentes/BizyDesignSystem";
import { formatarKwanza, aplicarSeoMetaTags, montarSeoPublico } from "../../../utilidades";
import type {
  AbaDetalheProduto,
  AbaLojaPublica,
  CatalogoBloco,
  CatalogoFiltroAtivo,
  CatalogoPersonalizadoLoja,
  ColecaoPerfilLoja,
  EntregaCheckout,
  ExperienciaLojaPublica,
  LojaPublicaResposta,
  ModoNegocio,
  PassoCheckout,
  PaletaLojaPublica,
  PedidoHistoricoLoja,
  PerfilClienteLoja,
  ProdutoPublico,
  ResumoEntregaCheckout,
  ReviewLojaPublica,
  SecaoVitrine,
  TipoEntregaCheckout,
  TipoEventoTracking
} from "../loja-publica/tipos";
import {
  TITULOS_ABAS_LOJA,
  calcularTopProdutos,
  carregarFavoritos,
  carregarHistoricoPedidos,
  carregarPerfilCliente,
  carregarProdutosVistos,
  criarFiltroDeCatalogoBloco,
  criarFiltroDeColecaoPerfil,
  criarSelecoesIniciaisProduto,
  entregaInicial,
  extrairUtmAtual,
  filtrarProdutosPorCatalogo,
  formatarNumeroCurto,
  guardarFavoritos,
  guardarHistoricoPedido,
  guardarPerfilCliente,
  guardarProdutoVisto,
  montarCatalogosPorBlocos,
  montarEntregaPayload,
  montarResumoVariantes,
  montarVitrinesOrganizadas,
  normalizarCodigoProdutoRota,
  obterTrackingIdLoja,
  obterVisuaisProduto,
  precoProduto,
  registrarEventoLoja,
  resolverCorVisual,
  resolverModoNegocio,
  resolverPaletaLoja,
  temVariantesProduto
} from "../loja-publica/helpers";

export function PaginaLojaDigitalPublica() {
  const { slug: slugRota = "", codigo: codigoRota = "" } = useParams();
  const navigate = useNavigate();
  const slug = resolverSlugLojaPublica(slugRota);
  const codigoProdutoRota = useMemo(() => normalizarCodigoProdutoRota(codigoRota), [codigoRota]);
  const trackingId = useMemo(() => obterTrackingIdLoja(slug), [slug]);
  const reduzirMovimento = useReducedMotion();
  const [dados, setDados] = useState<LojaPublicaResposta | null>(null);
  const [busca, setBusca] = useState("");
  const [catalogoAtivo, setCatalogoAtivo] = useState<CatalogoFiltroAtivo | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [produtoAberto, setProdutoAberto] = useState<ProdutoPublico | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [selecoesVariantes, setSelecoesVariantes] = useState<Record<string, string>>({});
  const [perfilCliente, setPerfilCliente] = useState<PerfilClienteLoja>(() => carregarPerfilCliente(slug));
  const [leadModalAberto, setLeadModalAberto] = useState(false);
  const [leadMotivo, setLeadMotivo] = useState("Receba disponibilidade, preco e novidades pelo WhatsApp.");
  const [produtosVistos, setProdutosVistos] = useState(0);
  const [produtosVistosRecentemente, setProdutosVistosRecentemente] = useState<ProdutoPublico[]>([]);
  const [historicoEncomendas, setHistoricoEncomendas] = useState<PedidoHistoricoLoja[]>(() => carregarHistoricoPedidos(slug));
  const [favoritos, setFavoritos] = useState<Set<string>>(() => carregarFavoritos(slug));
  const [checkoutProduto, setCheckoutProduto] = useState<ProdutoPublico | null>(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [checkoutPasso, setCheckoutPasso] = useState<PassoCheckout>("variante");
  const [checkoutQuantidade, setCheckoutQuantidade] = useState(1);
  const [checkoutVariantes, setCheckoutVariantes] = useState<Record<string, string>>({});
  const [entregaCheckout, setEntregaCheckout] = useState<EntregaCheckout>(entregaInicial);
  const [resumoEntrega, setResumoEntrega] = useState<ResumoEntregaCheckout | null>(null);
  const [calculandoEntrega, setCalculandoEntrega] = useState(false);
  const [finalizandoCheckout, setFinalizandoCheckout] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<{ produto: ProdutoPublico; quantidade: number; variantes: Record<string, string>; total: number; entrega: EntregaCheckout; whatsappUrl: string } | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaLojaPublica>("home");
  const [direcaoAba, setDirecaoAba] = useState<"esquerda" | "direita">("direita");
  const touchAbaRef = useRef<{ x: number; t: number } | null>(null);
  const produtoUrlAplicadoRef = useRef<string | null>(null);

  const registrarEvento = useCallback(
    (tipo: TipoEventoTracking, dadosEvento: {
      produto?: ProdutoPublico | null;
      entidadeTipo?: string;
      entidadeId?: string;
      metadata?: Record<string, unknown>;
      canal?: string;
    } = {}) => {
      registrarEventoLoja({
        slug,
        trackingId,
        tipo,
        produto: dadosEvento.produto ?? null,
        entidadeTipo: dadosEvento.entidadeTipo,
        entidadeId: dadosEvento.entidadeId,
        metadata: dadosEvento.metadata,
        canal: dadosEvento.canal
      });
    },
    [slug, trackingId]
  );

  useEffect(() => {
    let ativo = true;
    let limparSeo = () => {};

    async function carregarLoja() {
      setCarregando(true);
      setErro("");
      try {
        const corpo = await obterLojaPublica(slug, {
          trackingId,
          origem: "loja-web",
          canal: "site",
          utm: extrairUtmAtual()
        }) as unknown as LojaPublicaResposta;
        if (!ativo) return;

        setDados(corpo);
        const imagemLoja = corpo.loja.logoUrl || corpo.loja.capaUrl ? resolverUrlMedia(corpo.loja.logoUrl ?? corpo.loja.capaUrl) : undefined;
        limparSeo = aplicarSeoMetaTags(corpo.seo ?? montarSeoPublico({
          titulo: `${corpo.loja.nomeComercial} | Bizy`,
          descricao: corpo.loja.descricaoPublica ?? `Loja pública de ${corpo.loja.nomeComercial} no Bizy, com catálogo, stock e checkout organizado.`,
          canonicalPath: ROTAS_LOJAS.loja(corpo.loja.slug || slug),
          imagem: imagemLoja
        }));
        registrarEvento("LOJA_VISITADA", {
          entidadeTipo: "LOJA",
          entidadeId: corpo.loja.slug,
          metadata: {
            totalProdutos: corpo.produtos.length,
            temVitrine: Boolean(corpo.vitrine)
          }
        });
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível abrir esta loja.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarLoja();
    return () => {
      ativo = false;
      limparSeo();
    };
  }, [registrarEvento, slug, trackingId]);

  useEffect(() => {
    guardarPerfilCliente(slug, perfilCliente);
  }, [perfilCliente, slug]);

  useEffect(() => {
    guardarFavoritos(slug, favoritos);
  }, [favoritos, slug]);

  useEffect(() => {
    setHistoricoEncomendas(carregarHistoricoPedidos(slug));
  }, [slug]);

  useEffect(() => {
    setProdutosVistosRecentemente(carregarProdutosVistos(slug, dados?.produtos ?? []));
  }, [dados?.produtos, slug]);

  useEffect(() => {
    if (!codigoProdutoRota || !dados?.produtos.length) return;

    const chave = `${slug}:${codigoProdutoRota}`;
    if (produtoUrlAplicadoRef.current === chave) return;

    const produtoDaRota = dados.produtos.find((produto) => normalizarCodigoProdutoRota(produto.codigo) === codigoProdutoRota);
    produtoUrlAplicadoRef.current = chave;

    if (produtoDaRota) {
      abrirProduto(produtoDaRota);
      return;
    }

    setErro("Produto não está disponível nesta loja.");
  }, [codigoProdutoRota, dados?.produtos, slug]);

  useEffect(() => {
    if (!dados || !produtoAberto) return;

    const imagemProduto = produtoAberto.fotos[0]
      ? resolverUrlMedia(produtoAberto.fotos[0])
      : resolverUrlMedia(dados.loja.logoUrl ?? dados.loja.capaUrl ?? "");

    return aplicarSeoMetaTags(montarSeoPublico({
      titulo: `${produtoAberto.nome} | ${dados.loja.nomeComercial}`,
      descricao: produtoAberto.descricao || `${produtoAberto.nome} disponível em ${dados.loja.nomeComercial} no Bizy.`,
      canonicalPath: ROTAS_LOJAS.produtoLoja(slug, produtoAberto.codigo),
      imagem: imagemProduto || undefined,
      tipo: "product"
    }));
  }, [dados, produtoAberto, slug]);

  useEffect(() => {
    if (!checkoutAberto || !checkoutProduto) return;
    const temporizador = window.setTimeout(() => {
      void calcularEntregaCheckout();
    }, 350);
    return () => window.clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    checkoutAberto,
    checkoutProduto?.codigo,
    checkoutQuantidade,
    entregaCheckout.tipo,
    entregaCheckout.provincia,
    entregaCheckout.municipio,
    entregaCheckout.bairro,
    entregaCheckout.endereco
  ]);

  const categorias = useMemo(() => {
    if (!dados?.produtos) return [];
    const cats = new Set<string>();
    for (const produto of dados.produtos) {
      if (produto.categoria) cats.add(produto.categoria);
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "pt-AO"));
  }, [dados?.produtos]);

  const produtosFiltrados = useMemo(() => {
    let lista = filtrarProdutosPorCatalogo(dados?.produtos ?? [], catalogoAtivo);

    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((produto) =>
        [produto.nome, produto.descricao, produto.categoria, produto.colecao, produto.codigo]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo))
      );
    }

    return lista;
  }, [busca, catalogoAtivo, dados?.produtos]);

  const secoesVitrine = useMemo(() => montarVitrinesOrganizadas(dados), [dados]);
  const catalogos = useMemo(() => montarCatalogosPorBlocos(dados?.produtos ?? [], dados?.loja.experiencia), [dados?.loja.experiencia, dados?.produtos]);
  const topProdutos = useMemo(() => calcularTopProdutos(dados?.produtos ?? []), [dados?.produtos]);
  const modoNegocio = useMemo(() => resolverModoNegocio(dados?.loja, dados?.produtos ?? []), [dados?.loja, dados?.produtos]);
  const produtosPromocao = secoesVitrine.find((secao) => secao.id === "promocoes")?.produtos ?? [];
  const corPrimaria = "#8b5cf6";
  const paletaLoja = useMemo(() => resolverPaletaLoja(corPrimaria), [corPrimaria]);
  const localizacao = dados?.perfil?.localizacao || [dados?.loja.municipio, dados?.loja.provincia].filter(Boolean).join(", ");
  const totalProdutos = dados?.produtos.length ?? 0;
  const colecoesPerfil = useMemo<ColecaoPerfilLoja[]>(
    () => (dados?.colecoes ?? []).map((colecao) => ({
      ...colecao,
      ativa: catalogoAtivo?.id === colecao.id
    })),
    [catalogoAtivo?.id, dados?.colecoes]
  );
  const reviewsReais = useMemo<ReviewLojaPublica[]>(() => [], []);
  const produtosNovos = useMemo(
    () => (dados ? [...(dados.vitrine?.novidades ?? []), ...dados.produtos].slice(0, 12) : []),
    [dados?.produtos, dados?.vitrine?.novidades]
  );
  const produtosPromoHome = useMemo(
    () => {
      if (!dados) return [];
      const base = dados.vitrine?.promocoes?.length
        ? dados.vitrine.promocoes
        : dados.produtos.filter((produto) => Boolean(produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza));
      return base.slice(0, 10);
    },
    [dados?.produtos, dados?.vitrine?.promocoes]
  );
  const indiceAbaAtiva = ABAS_LOJA.findIndex((aba) => aba.id === abaAtiva);
  const reviewsComProduto = reviewsReais.slice(0, 3);

  function rolarParaGrelhaProdutos() {
    window.requestAnimationFrame(() => {
      document.getElementById(`loja-tabpanel-${abaAtiva}`)?.scrollIntoView({
        behavior: reduzirMovimento ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  function limparCatalogoAtivo() {
    setCatalogoAtivo(null);
    setAbaAtiva("item");
    rolarParaGrelhaProdutos();
    registrarEvento("CATALOGO_VISTO", {
      metadata: { acao: "limpar_catalogo" }
    });
  }

  function selecionarCatalogoAtivo(filtro: CatalogoFiltroAtivo) {
    setBusca("");
    setCatalogoAtivo((atual) => atual?.id === filtro.id ? null : filtro);
    setAbaAtiva("item");
    rolarParaGrelhaProdutos();
    registrarEvento("CATALOGO_VISTO", {
      entidadeTipo: "CATALOGO",
      entidadeId: filtro.id,
      metadata: {
        acao: "abrir_catalogo",
        catalogo: filtro.nome,
        criterio: filtro.criterio,
        origem: filtro.origem,
        produtos: filtro.totalProdutos ?? null
      }
    });
  }

  function selecionarCatalogoPublico(colecao: ColecaoPerfilLoja) {
    selecionarCatalogoAtivo(criarFiltroDeColecaoPerfil(colecao));
  }

  function selecionarCatalogo(catalogo: CatalogoBloco) {
    selecionarCatalogoAtivo(criarFiltroDeCatalogoBloco(catalogo));
  }

  function abrirProduto(produto: ProdutoPublico) {
    setProdutoAberto(produto);
    setQuantidade(1);
    setFotoAtiva(0);
    setSelecoesVariantes(criarSelecoesIniciaisProduto(produto));
    guardarProdutoVisto(slug, produto.codigo);
    setProdutosVistosRecentemente(carregarProdutosVistos(slug, dados?.produtos ?? []));
    registrarEvento("PRODUTO_VISTO", {
      produto,
      entidadeTipo: "PRODUTO",
      entidadeId: produto.codigo,
      metadata: {
        categoria: produto.categoria ?? null,
        origemInteracao: "detalhe"
      }
    });
    setProdutosVistos((total) => {
      const novoTotal = total + 1;
      if (novoTotal >= 2 && dados?.loja.experiencia?.leadCaptureAtivo !== false && !perfilCliente.telefone && !leadModalAberto) {
        setLeadMotivo(dados?.loja.experiencia?.leadCaptureTitulo || "Quer receber disponibilidade, tamanho e novidades desta loja?");
        setLeadModalAberto(true);
      }
      return novoTotal;
    });
  }

  function alternarFavorito(produto: ProdutoPublico) {
    setFavoritos((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(produto.codigo)) {
        proximos.delete(produto.codigo);
      } else {
        proximos.add(produto.codigo);
      }
      return proximos;
    });
    registrarEvento("CATALOGO_VISTO", {
      produto,
      entidadeTipo: "PRODUTO",
      entidadeId: produto.codigo,
      metadata: { acao: favoritos.has(produto.codigo) ? "favorito_removido" : "favorito_adicionado" }
    });
  }

  function abrirCheckout(produto: ProdutoPublico, qtd = 1, variantes = selecoesVariantes) {
    const selecoes = Object.keys(variantes).length ? variantes : criarSelecoesIniciaisProduto(produto);
    setCheckoutProduto(produto);
    setCheckoutQuantidade(Math.max(1, Math.min(qtd, produto.quantidade || 1)));
    setCheckoutVariantes(selecoes);
    setEntregaCheckout((atual) => ({
      ...entregaInicial,
      provincia: atual.provincia,
      municipio: atual.municipio,
      bairro: atual.bairro,
      endereco: atual.endereco
    }));
    setResumoEntrega(null);
    setCheckoutPasso(temVariantesProduto(produto) ? "variante" : perfilCliente.telefone ? "entrega" : "dados");
    setCheckoutAberto(true);
    setProdutoAberto(null);
    registrarEvento("CHECKOUT_INICIADO", {
      produto,
      entidadeTipo: "PRODUTO",
      entidadeId: produto.codigo,
      metadata: {
        quantidade: qtd,
        variantes: selecoes,
        temPerfil: Boolean(perfilCliente.telefone)
      }
    });
  }

  function adicionarProdutoAoCheckoutBizy(produto: ProdutoPublico, qtd = 1, variantes = selecoesVariantes) {
    const selecoes = Object.keys(variantes).length ? variantes : criarSelecoesIniciaisProduto(produto);
    adicionarItemCheckoutBizy({
      slugLoja: slug,
      codigoProduto: produto.codigo,
      nomeProduto: produto.nome,
      nomeFornecedor: dados?.loja.nomeComercial ?? "Loja Bizy",
      quantidade: qtd,
      precoUnitarioEmKwanza: precoProduto(produto),
      fotoUrl: produto.fotos[0] ? resolverUrlMedia(produto.fotos[0]) : null,
      urlProduto: ROTAS_LOJAS.produtoLoja(slug, produto.codigo),
      urlLoja: ROTAS_LOJAS.loja(slug),
      variantes: selecoes,
      origem: "loja-produto"
    });
    registrarEvento("CHECKOUT_INICIADO", {
      produto,
      entidadeTipo: "PRODUTO",
      entidadeId: produto.codigo,
      metadata: {
        quantidade: qtd,
        variantes: selecoes,
        origem: "checkout_bizy_unificado"
      }
    });
    setProdutoAberto(null);
    navigate(ROTAS_LOJAS.checkout);
  }

  async function calcularEntregaCheckout(): Promise<ResumoEntregaCheckout | null> {
    if (!checkoutProduto) return null;
    setCalculandoEntrega(true);
    try {
      const resposta = await fetch(`${obterBaseApiUrl()}/publico/lojas/${encodeURIComponent(slug)}/entrega/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: [{ codigoPeca: checkoutProduto.codigo, quantidade: checkoutQuantidade }],
          entrega: montarEntregaPayload(entregaCheckout)
        })
      });
      const corpo = (await resposta.json()) as ResumoEntregaCheckout & { mensagem?: string };
      if (!resposta.ok) throw new Error(corpo.mensagem ?? "Não foi possível calcular a entrega.");
      setResumoEntrega(corpo);
      return corpo;
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível calcular a entrega.");
      return null;
    } finally {
      setCalculandoEntrega(false);
    }
  }

  async function confirmarCheckout() {
    if (!checkoutProduto) return;
    if (!perfilCliente.nome.trim() || !perfilCliente.telefone.trim()) {
      setCheckoutPasso("dados");
      setErro("Informe nome e WhatsApp para a loja conseguir finalizar a compra.");
      return;
    }
    if (entregaCheckout.tipo === "ENTREGA" && !entregaCheckout.endereco.trim()) {
      setCheckoutPasso("entrega");
      setErro("Informe o endereço ou referência para entrega.");
      return;
    }

    setFinalizandoCheckout(true);
    try {
      const entrega = montarEntregaPayload(entregaCheckout);
      const resumo = resumoEntrega ?? await calcularEntregaCheckout();

      await fetch(`${obterBaseApiUrl()}/publico/lojas/${encodeURIComponent(slug)}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: [{ codigoPeca: checkoutProduto.codigo, quantidade: checkoutQuantidade }],
          entrega,
          cliente: {
            nome: perfilCliente.nome,
            telefone: perfilCliente.telefone,
            email: perfilCliente.email || null,
            consentimentoMarketing: perfilCliente.consentimentoMarketing,
            consentimentoDados: true
          },
          trackingId,
          origem: "loja-web",
          canal: "site",
          observacao: montarResumoVariantes(checkoutVariantes)
        })
      }).catch(() => null);

      const respostaWhatsapp = await fetch(
        `${obterBaseApiUrl()}/publico/lojas/${encodeURIComponent(slug)}/produtos/${encodeURIComponent(checkoutProduto.codigo)}/whatsapp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantidade: checkoutQuantidade,
            variante: checkoutVariantes,
            trackingId,
            origem: "loja-web",
            entrega
          })
        }
      );
      const corpoWhatsapp = (await respostaWhatsapp.json()) as { whatsappUrl?: string; mensagem?: string };
      if (!respostaWhatsapp.ok || !corpoWhatsapp.whatsappUrl) {
        throw new Error(corpoWhatsapp.mensagem ?? "Não foi possível iniciar a compra no WhatsApp.");
      }

      const pedidoHistorico: PedidoHistoricoLoja = {
        codigo: checkoutProduto.codigo,
        nome: checkoutProduto.nome,
        totalEmKwanza: resumo?.totalEmKwanza ?? precoProduto(checkoutProduto) * checkoutQuantidade,
        criadoEm: new Date().toISOString(),
        quantidade: checkoutQuantidade,
        variantes: checkoutVariantes
      };
      guardarHistoricoPedido(slug, pedidoHistorico);
      setHistoricoEncomendas((atuais) => [pedidoHistorico, ...atuais].slice(0, 20));
      guardarPerfilCliente(slug, perfilCliente);
      setCheckoutAberto(false);
      setPedidoConfirmado({
        produto: checkoutProduto,
        quantidade: checkoutQuantidade,
        variantes: checkoutVariantes,
        total: resumo?.totalEmKwanza ?? precoProduto(checkoutProduto) * checkoutQuantidade,
        entrega: entregaCheckout,
        whatsappUrl: corpoWhatsapp.whatsappUrl
      });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível finalizar a compra.");
    } finally {
      setFinalizandoCheckout(false);
    }
  }

  if (carregando) {
    return (
      <main className="loja-publica-v2 grid min-h-[100dvh] place-items-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-16 animate-pulse">
            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: corPrimaria }} />
            <div className="grid size-full place-items-center">
              <ShoppingBag size={28} className="text-neutral-400" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-neutral-500">
            <Loader2 className="animate-spin" size={16} />
            A carregar a loja...
          </div>
        </div>
      </main>
    );
  }

  if (erro && !dados) {
    return (
      <main className="loja-publica-v2 grid min-h-[100dvh] place-items-center bg-[var(--bg)] px-4">
        <section className="w-full max-w-sm text-center">
          <div className="mx-auto grid size-20 place-items-center bg-neutral-100">
            <Store size={32} className="text-neutral-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-900">Loja indisponível</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">{erro || "Esta loja ainda não está publicada."}</p>
          <Button asChild className="mt-8 h-12 w-full text-sm font-medium">
            <Link to="/">
              <ArrowLeft size={16} />
              Voltar ao início
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  if (!dados) return null;

  const experienciaLoja = dados.loja.experiencia;
  const leadCaptureAtivo = experienciaLoja?.leadCaptureAtivo !== false;
  const catalogosEditaveis = experienciaLoja?.catalogosEditaveis !== false;

  function mudarAba(aba: AbaLojaPublica) {
    if (aba === abaAtiva) return;
    const indiceNovo = ABAS_LOJA.findIndex((item) => item.id === aba);
    const indiceAnterior = ABAS_LOJA.findIndex((item) => item.id === abaAtiva);
    if (indiceNovo < 0) return;
    setDirecaoAba(indiceNovo > indiceAnterior ? "direita" : "esquerda");
    setAbaAtiva(aba);
    registrarEvento("CATALOGO_VISTO", { metadata: { acao: "mudar_aba", aba } });
  }

  function onTouchStartAba(e: React.TouchEvent) {
    touchAbaRef.current = { x: e.touches[0].clientX, t: Date.now() };
  }

  function onTouchEndAba(e: React.TouchEvent) {
    if (!touchAbaRef.current) return;
    const dx = e.changedTouches[0].clientX - touchAbaRef.current.x;
    const dt = Date.now() - touchAbaRef.current.t;
    touchAbaRef.current = null;
    if (Math.abs(dx) < 50 || dt > 400) return;
    if (dx < 0 && indiceAbaAtiva < ABAS_LOJA.length - 1) mudarAba(ABAS_LOJA[indiceAbaAtiva + 1].id);
    if (dx > 0 && indiceAbaAtiva > 0) mudarAba(ABAS_LOJA[indiceAbaAtiva - 1].id);
  }

  return (
    <main
      className="loja-publica-v2 loja-stitch lp-body-pad min-h-[100dvh] bg-white text-foreground"
      style={{ "--loja-accent": corPrimaria } as React.CSSProperties}
    >
      <header className="loja-store-topbar sticky top-0 z-50 border-0 bg-transparent">
        <div className="mx-auto max-w-[1280px] px-4 pt-3 sm:px-10 sm:pt-5">
          <div className="loja-store-topbar-row flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
              }}
              className="grid size-10 shrink-0 place-items-center border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>

            <form className="loja-store-search-bar" role="search" onSubmit={(e) => e.preventDefault()}>
              <Search className="loja-store-search-bar-icon" size={18} aria-hidden="true" />
              <input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  registrarEvento("CATALOGO_VISTO", { metadata: { acao: "pesquisa_topbar" } });
                }}
                placeholder={`Pesquisar em ${dados.loja.nomeComercial}`}
                aria-label={`Pesquisar em ${dados.loja.nomeComercial}`}
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="loja-store-search-bar-clear"
                  aria-label="Limpar pesquisa"
                >
                  <X size={15} />
                </button>
              )}
              <button type="submit" className="loja-store-search-bar-submit">
                <Search size={15} />
                Pesquisar
              </button>
            </form>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (historicoEncomendas.length > 0) setAbaAtiva("item");
                }}
                className="relative grid size-10 place-items-center border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18"
                aria-label="Sacola"
              >
                <ShoppingBag size={18} />
                {historicoEncomendas.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-foreground text-[9px] font-bold text-white">
                    {Math.min(historicoEncomendas.length, 9)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  registrarEvento("CATALOGO_VISTO", { metadata: { acao: "partilhar_loja" } });
                  void navigator.share?.({ title: dados.loja.nomeComercial, url: window.location.href })
                    .catch(() => { void navigator.clipboard.writeText(window.location.href); });
                }}
                className="grid size-10 place-items-center border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18"
                aria-label="Partilhar"
              >
                <Share2 size={18} />
              </button>
              <button
                type="button"
                className="grid size-10 place-items-center border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18"
                aria-label="Mais opções"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 pt-3 sm:px-10 sm:pt-4">
        <PerfilLojaSocial
          colecoes={colecoesPerfil}
          corPrimaria={corPrimaria}
          localizacao={localizacao}
          loja={dados.loja}
          market={dados.market}
          perfil={dados.perfil}
          slug={slug}
          trackingId={trackingId}
          totalProdutos={totalProdutos}
          onContacto={() => {
            registrarEvento("CATALOGO_VISTO", { metadata: { acao: "contactar_loja" }, canal: "whatsapp" });
            const telefone = dados.loja.whatsapp?.replace(/\D/g, "");
            if (telefone) window.open(`https://wa.me/${telefone}`, "_blank", "noopener,noreferrer");
          }}
          onVerItens={() => mudarAba("item")}
          onSelecionarColecao={selecionarCatalogoPublico}
        />
      </div>

      <BarraAbas abaAtiva={abaAtiva} onChange={mudarAba} />

      <div
        className="mx-auto min-h-[60dvh] max-w-[1280px] px-4 pb-24 pt-4 sm:px-10 sm:pt-5"
        onTouchStart={onTouchStartAba}
        onTouchEnd={onTouchEndAba}
      >
        <div key={abaAtiva} className="animate-in fade-in duration-200">
          {abaAtiva === "home" && (
            <div id="loja-tabpanel-home" role="tabpanel" aria-labelledby="loja-tab-home" className="space-y-6">
              <section className="loja-home-hero">
                <div className="loja-home-hero-copy">
                  <span className="loja-home-hero-pill">SHOP NOW</span>
                  <h2>{dados.loja.nomeComercial}</h2>
                  <p>{dados.loja.descricaoPublica || "Escolhas prontas para comprar, com estilo de vitrine mobile e acesso rápido às novidades."}</p>
                  <div className="loja-home-hero-actions">
                    <button type="button" className="loja-home-hero-cta" onClick={() => mudarAba("item")}>Explorar coleção</button>
                    <button type="button" className="loja-home-hero-secondary" onClick={() => mudarAba("promo")}>Ver promoções</button>
                  </div>
                </div>
                <div className="loja-home-hero-collage" aria-hidden="true">
                  {produtosPromoHome.slice(0, 3).map((produto, indice) => (
                    <figure key={`hero-${produto.codigo}`} className={`loja-home-hero-card is-${indice + 1}`}>
                      {produto.fotos[0] ? <img src={resolverUrlMedia(produto.fotos[0])} alt="" /> : <Package size={32} />}
                    </figure>
                  ))}
                </div>
              </section>

              <section className="loja-home-showcase">
                <div className="loja-home-showcase-art">
                  {topProdutos[0]?.fotos[0] ? <img src={resolverUrlMedia(topProdutos[0].fotos[0])} alt={topProdutos[0].nome} /> : <Package size={36} />}
                </div>
                <div className="loja-home-showcase-grid">
                  {(colecoesPerfil.length > 0 ? colecoesPerfil : categorias.slice(0, 4).map((categoria) => ({ id: categoria, nome: categoria, tipo: "categoria" as const, totalProdutos: dados.produtos.filter((produto) => produto.categoria === categoria).length, imagem: dados.produtos.find((produto) => produto.categoria === categoria)?.fotos[0] ?? null, mensagem: null, url: "#", ativa: false }))).slice(0, 4).map((colecao) => (
                    <button
                      key={colecao.id}
                      type="button"
                      className="loja-home-category-card"
                      onClick={() => selecionarCatalogoPublico(colecao)}
                    >
                      <span className="loja-home-category-thumb">
                        {colecao.imagem ? <img src={resolverUrlMedia(colecao.imagem)} alt="" /> : <Package size={16} />}
                      </span>
                      <strong>{colecao.nome}</strong>
                    </button>
                  ))}
                </div>
              </section>

              <section className="loja-home-popular">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Os mais procurados</p>
                    <h3 className="mt-1 text-base font-semibold text-neutral-950">Atalhos para navegar mais rápido</h3>
                  </div>
                  <button type="button" className="text-xs font-semibold text-neutral-500" onClick={() => mudarAba("item")}>
                    Ver tudo
                  </button>
                </div>
                <div className="loja-home-popular-chips">
                  {[
                    ...categorias.slice(0, 3),
                    ...colecoesPerfil.slice(0, 3).map((colecao) => colecao.nome),
                    "Novelty Cases"
                  ]
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="loja-home-popular-chip"
                        onClick={() => {
                          const colecao = colecoesPerfil.find((item) => item.nome === chip);
                          if (colecao) {
                            selecionarCatalogoPublico(colecao);
                            return;
                          }
                          const categoria = categorias.find((item) => item === chip);
                          if (categoria) {
                            selecionarCatalogoAtivo({
                              id: `categoria-${categoria}`,
                              nome: categoria,
                              criterio: "categoria",
                              valor: categoria,
                              totalProdutos: dados.produtos.filter((produto) => produto.categoria === categoria).length,
                              origem: "categoria"
                            });
                          }
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                {topProdutos.slice(0, 4).map((produto) => (
                  <CartaoProduto
                    key={`home-${produto.codigo}`}
                    produto={produto}
                    corPrimaria={corPrimaria}
                    favorito={favoritos.has(produto.codigo)}
                    onFavorito={() => alternarFavorito(produto)}
                    onComprar={() => abrirCheckout(produto, 1, criarSelecoesIniciaisProduto(produto))}
                    onVerDetalhes={() => abrirProduto(produto)}
                  />
                ))}
              </div>

              <SinaisConfiancaLoja experiencia={experienciaLoja} loja={dados.loja} modoNegocio={modoNegocio} />
            </div>
          )}

          {abaAtiva === "item" && (
            <div id="loja-tabpanel-item" role="tabpanel" aria-labelledby="loja-tab-item" className="space-y-6">
              {catalogoAtivo && (
                <motion.div
                  className="loja-catalogo-ativo"
                  initial={{ opacity: 0, y: reduzirMovimento ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span>
                    <small>Catálogo ativo</small>
                    <strong>{catalogoAtivo.nome}</strong>
                    {colecoesPerfil.find((c) => c.id === catalogoAtivo.id)?.mensagem && (
                      <small className="mt-1 block text-xs font-normal text-neutral-500">{colecoesPerfil.find((c) => c.id === catalogoAtivo.id)?.mensagem}</small>
                    )}
                  </span>
                  <button type="button" className="loja-catalogo-limpar border" onClick={limparCatalogoAtivo}>
                    Limpar catálogo
                  </button>
                </motion.div>
              )}

              <section className="loja-item-rail">
                <div className="loja-item-rail-list">
                  {(colecoesPerfil.length > 0 ? colecoesPerfil : categorias.slice(0, 4).map((categoria) => ({ id: categoria, nome: categoria, tipo: "categoria" as const, totalProdutos: dados.produtos.filter((produto) => produto.categoria === categoria).length, imagem: dados.produtos.find((produto) => produto.categoria === categoria)?.fotos[0] ?? null, mensagem: null, url: "#", ativa: false }))).slice(0, 5).map((colecao) => (
                    <button
                      key={colecao.id}
                      type="button"
                      className={`loja-item-rail-chip ${catalogoAtivo?.id === colecao.id ? "is-active" : ""}`}
                      aria-pressed={catalogoAtivo?.id === colecao.id}
                      onClick={() => selecionarCatalogoPublico(colecao)}
                    >
                      <span>
                        {colecao.imagem ? <img src={resolverUrlMedia(colecao.imagem)} alt="" /> : <Package size={14} />}
                      </span>
                      <strong>{colecao.nome}</strong>
                    </button>
                  ))}
                </div>
              </section>

              <div className="loja-item-toolbar">
                <button type="button" className="is-active">
                  <Sparkles size={14} />
                  Recomendar
                </button>
                <button type="button">
                  <ArrowUpDown size={14} />
                  Mais Popular
                </button>
                <button type="button">
                  <ArrowUpDown size={14} />
                  Preço
                </button>
                <button type="button">
                  <Filter size={14} />
                  Filtro
                </button>
              </div>

              {categorias.length > 0 && (
                <div className="loja-item-filter-pills">
                  <button type="button" className={!catalogoAtivo ? "is-active" : ""} onClick={limparCatalogoAtivo} aria-pressed={!catalogoAtivo}>
                    Categoria <ChevronDown size={12} />
                  </button>
                  <button type="button">
                    Size <ChevronDown size={12} />
                  </button>
                  <button type="button">
                    Color <ChevronDown size={12} />
                  </button>
                  <button type="button">
                    Material <ChevronDown size={12} />
                  </button>
                  <button type="button">
                    Pattern Type <ChevronDown size={12} />
                  </button>
                </div>
              )}

              {produtosFiltrados.length > 0 ? (
                <div className="loja-product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {produtosFiltrados.map((produto) => (
                    <CartaoProduto
                      key={`item-${produto.codigo}`}
                      produto={produto}
                      corPrimaria={corPrimaria}
                      favorito={favoritos.has(produto.codigo)}
                      onFavorito={() => alternarFavorito(produto)}
                      onComprar={() => abrirCheckout(produto, 1, criarSelecoesIniciaisProduto(produto))}
                      onVerDetalhes={() => abrirProduto(produto)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-sm text-neutral-400">{busca ? `Sem resultados para "${busca}"` : "Nenhum produto disponível."}</p>
                  {(busca || catalogoAtivo) && (
                    <button type="button" className="mt-4 text-xs font-medium text-neutral-900 underline underline-offset-4" onClick={() => { setBusca(""); setCatalogoAtivo(null); }}>
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "new" && (
            <div id="loja-tabpanel-new" role="tabpanel" aria-labelledby="loja-tab-new" className="space-y-6">
              <div className="loja-new-date-strip">
                {Array.from({ length: 7 }).map((_, indice) => {
                  const data = new Date();
                  data.setDate(data.getDate() - (6 - indice));
                  const rotulo = data.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
                  const ativa = indice === 6;
                  return (
                    <button key={rotulo} type="button" className={ativa ? "is-active" : ""}>
                      <span>{data.toLocaleDateString("en-US", { month: "short" })}</span>
                      <strong>{data.getDate().toString().padStart(2, "0")}</strong>
                    </button>
                  );
                })}
              </div>

              <section className="space-y-5">
                {[0, 1, 2].map((grupo) => {
                  const fatia = produtosNovos.slice(grupo * 4, grupo * 4 + 4);
                  if (!fatia.length) return null;
                  const data = new Date();
                  data.setDate(data.getDate() - grupo);
                  const rotulo = data.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
                  return (
                    <div key={rotulo} className="space-y-3">
                      <h3 className="text-lg font-semibold text-neutral-950">{rotulo}</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {fatia.map((produto) => (
                          <CartaoProduto
                            key={`new-${produto.codigo}`}
                            produto={produto}
                            corPrimaria={corPrimaria}
                            favorito={favoritos.has(produto.codigo)}
                            onFavorito={() => alternarFavorito(produto)}
                            onComprar={() => abrirCheckout(produto, 1, criarSelecoesIniciaisProduto(produto))}
                            onVerDetalhes={() => abrirProduto(produto)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          )}

          {abaAtiva === "promo" && (
            <div id="loja-tabpanel-promo" role="tabpanel" aria-labelledby="loja-tab-promo" className="space-y-6">
              <section className="loja-promo-hero">
                <div className="loja-promo-hero-copy">
                  <span className="loja-promo-hero-pill">SHOP NOW</span>
                  <h2>Promoções em destaque</h2>
                  <p>Preços especiais, novas chegadas e peças que merecem atenção imediata.</p>
                </div>
                <div className="loja-promo-hero-art" aria-hidden="true">
                  {produtosPromoHome.slice(0, 3).map((produto, indice) => (
                    <figure key={`promo-${produto.codigo}`} className={`loja-home-hero-card is-${indice + 1}`}>
                      {produto.fotos[0] ? <img src={resolverUrlMedia(produto.fotos[0])} alt="" /> : <Package size={32} />}
                    </figure>
                  ))}
                </div>
              </section>

              {experienciaLoja?.cupomDestaque && <SeloCupomLoja cupom={experienciaLoja.cupomDestaque} corPrimaria={corPrimaria} />}

              {produtosPromoHome.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {produtosPromoHome.slice(0, 6).map((produto) => (
                    <CartaoProduto
                      key={`promo-${produto.codigo}`}
                      produto={produto}
                      corPrimaria={corPrimaria}
                      favorito={favoritos.has(produto.codigo)}
                      onFavorito={() => alternarFavorito(produto)}
                      onComprar={() => abrirCheckout(produto, 1, criarSelecoesIniciaisProduto(produto))}
                      onVerDetalhes={() => abrirProduto(produto)}
                    />
                  ))}
                </div>
              )}

              {produtosPromoHome.length === 0 && topProdutos.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-sm text-neutral-400">Sem promoções por agora.</p>
                </div>
              )}

              <SinaisConfiancaLoja experiencia={experienciaLoja} loja={dados.loja} modoNegocio={modoNegocio} />
            </div>
          )}

          {abaAtiva === "review" && (
            <div id="loja-tabpanel-review" role="tabpanel" aria-labelledby="loja-tab-review" className="space-y-6">
              {/* Filtros primários — sem contagens falsas */}
              <div className="loja-review-filter-row">
                <button type="button" className="is-active">Tudo</button>
                <button type="button">Com imagem</button>
                <button type="button">5 ⭐</button>
                <button type="button">4 ⭐</button>
              </div>
              {/* Filtros de atributos — reais se disponíveis, senão placeholder subtil */}
              {dados.produtos.length > 0 && (
                <div className="loja-review-filter-row is-secondary">
                  {[...new Set(dados.produtos.map((p) => p.categoria).filter(Boolean))].slice(0, 3).map((cat) => (
                    <button key={cat} type="button">{cat}</button>
                  ))}
                  <button type="button">Mais</button>
                </div>
              )}

              <div className="space-y-6">
                {reviewsReais.length > 0 ? reviewsReais.map((review, indice) => {
                  const estrelas = Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < 4 ? "fill-[#f5c518] text-[#f5c518]" : "text-neutral-300"} />
                  ));
                  return (
                    <article key={review.id} className="loja-review-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-neutral-950">{review.autor}</strong>
                            <span className="flex items-center gap-0.5 text-[#f5c518]">{estrelas}</span>
                          </div>
                          {review.variante && (
                            <p className="mt-1 text-xs text-neutral-500">Variante: {review.variante}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-neutral-400">{review.data}</span>
                      </div>
                      <p className="mt-4 text-base font-medium leading-7 text-neutral-950">{review.comentario}</p>
                      {review.produtoImagem && (
                        <div className="mt-4 overflow-hidden border border-neutral-200 bg-neutral-50">
                          <img src={review.produtoImagem} alt={review.produtoNome} className="h-64 w-full object-cover" />
                        </div>
                      )}
                      <div className="mt-4 border border-neutral-200 bg-neutral-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="size-14 overflow-hidden bg-white">
                            {review.produtoImagem
                              ? <img src={review.produtoImagem} alt="" className="size-full object-cover" />
                              : <Package className="m-auto mt-4 text-neutral-300" size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-950">{review.produtoNome}</p>
                            <p className="mt-1 text-xs text-neutral-500">{formatarKwanza(precoProduto(dados.produtos[indice] ?? dados.produtos[0]))}</p>
                          </div>
                          <button
                            type="button"
                            className="grid size-10 shrink-0 place-items-center border border-neutral-200 bg-white text-neutral-950"
                            onClick={() => {
                              const produto = dados.produtos[indice] ?? dados.produtos[0];
                              if (produto) abrirCheckout(produto, 1, criarSelecoesIniciaisProduto(produto));
                            }}
                          >
                            <ShoppingBag size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }) : (
                  <div className="loja-review-card text-center">
                    <MessageCircle className="mx-auto text-neutral-300" size={28} />
                    <strong className="mt-3 block text-sm text-neutral-950">Ainda sem avaliações públicas</strong>
                    <p className="mt-1 text-sm text-neutral-500">Quando houver avaliações reais, elas aparecem aqui sem dados simulados.</p>
                  </div>
                )}
              </div>

              {/* Banner seguir — dados reais da loja */}
              <section className="loja-review-follow-banner">
                <div className="loja-review-follow-brand">
                  <span className="loja-review-follow-avatar">
                    {dados.loja.logoUrl
                      ? <img src={resolverUrlMedia(dados.loja.logoUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "999px" }} />
                      : dados.loja.nomeComercial.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h3>Siga {dados.loja.nomeComercial} para novidades</h3>
                    {dados.loja.descricaoPublica
                      ? <p className="mt-1 text-sm text-neutral-500 line-clamp-1">{dados.loja.descricaoPublica}</p>
                      : <p className="mt-1 text-sm text-neutral-400 italic">Novidades e promoções em primeira mão</p>}
                  </div>
                </div>
                <button type="button" className="loja-review-follow-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  + Seguir
                </button>
              </section>

              {/* Recomendações — categorias reais da loja */}
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Também pode gostar</p>
                    <h3 className="mt-1 text-lg font-semibold text-neutral-950">Recomendações da loja</h3>
                  </div>
                  <button type="button" className="text-xs font-semibold text-neutral-500" onClick={() => mudarAba("item")}>
                    Ver mais
                  </button>
                </div>
                {dados.produtos.length > 0 && (
                  <div className="loja-review-category-tabs">
                    <button type="button" className="is-active">Recomendados</button>
                    {[...new Set(dados.produtos.map((p) => p.categoria).filter(Boolean))].slice(0, 3).map((cat) => (
                      <button key={cat} type="button">{cat}</button>
                    ))}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {topProdutos.slice(0, 4).map((produto) => (
                    <CartaoProduto
                      key={`review-${produto.codigo}`}
                      produto={produto}
                      corPrimaria={corPrimaria}
                      favorito={favoritos.has(produto.codigo)}
                      onFavorito={() => alternarFavorito(produto)}
                      onComprar={() => abrirCheckout(produto, 1, criarSelecoesIniciaisProduto(produto))}
                      onVerDetalhes={() => abrirProduto(produto)}
                    />
                  ))}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
                <ProdutosVistosRecentemente produtos={produtosVistosRecentemente} corPrimaria={corPrimaria} favoritos={favoritos} onComprar={(p) => abrirCheckout(p, 1, criarSelecoesIniciaisProduto(p))} onFavorito={alternarFavorito} onVerProduto={abrirProduto} />
                <HistoricoEncomendasCliente historico={historicoEncomendas} />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="loja-sf" aria-label="Rodapé da loja">
        <div className="loja-sf-beam" aria-hidden="true" />

        {/* ── HERO: identidade da loja + stats + contactos ── */}
        <motion.div
          className="loja-sf-hero"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Esquerda: avatar + info textual */}
          <div className="loja-sf-identity">
            <div className="loja-sf-avatar">
              {(dados.perfil?.avatarUrl ?? dados.loja.logoUrl)
                ? <img src={resolverUrlMedia(dados.perfil?.avatarUrl ?? dados.loja.logoUrl ?? "")} alt="" className="loja-sf-avatar-img" />
                : <span className="loja-sf-avatar-init">{dados.loja.nomeComercial.slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="loja-sf-info">
              <h2 className="loja-sf-nome">{dados.loja.nomeComercial}</h2>
              <div className="loja-sf-meta">
                {dados.loja.segmento && <span className="loja-sf-seg">{dados.loja.segmento}</span>}
                {localizacao && <span className="loja-sf-loc"><MapPin size={11} aria-hidden="true" />{localizacao}</span>}
              </div>
              {(dados.perfil?.bio ?? dados.loja.descricaoPublica) && (
                <p className="loja-sf-desc">{dados.perfil?.bio ?? dados.loja.descricaoPublica}</p>
              )}
            </div>
          </div>

          {/* Direita: contadores + botões de contacto */}
          <div className="loja-sf-side">
            <div className="loja-sf-stats">
              <div className="loja-sf-stat">
                <strong>{totalProdutos}</strong>
                <span>Produtos</span>
              </div>
              <div className="loja-sf-stat-div" aria-hidden="true" />
              <div className="loja-sf-stat">
                <strong>{dados.perfil?.contadores?.seguidores ?? 0}</strong>
                <span>Seguidores</span>
              </div>
            </div>
            <div className="loja-sf-contacts">
              {dados.loja.whatsapp && (
                <motion.a
                  href={`https://wa.me/${dados.loja.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loja-sf-contact loja-sf-contact--wa"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.14 }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </motion.a>
              )}
              {dados.loja.instagram && (
                <motion.a
                  href={`https://instagram.com/${dados.loja.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="loja-sf-contact loja-sf-contact--ig"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.14 }}
                >
                  <Share2 size={15} />
                  <span>Instagram</span>
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>

        <div className="loja-sf-sep" aria-hidden="true" />

        {/* ── GRID 3 colunas: Explorar / Políticas / Bizy ── */}
        <motion.div
          className="loja-sf-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Col 1 — Explorar */}
          <div className="loja-sf-col">
            <p className="loja-sf-col-title">Explorar</p>
            <nav aria-label="Secções da loja">
              {(["home", "item", "new", "promo", "review"] as AbaLojaPublica[]).map((aba) => (
                <motion.button
                  key={aba}
                  type="button"
                  className="loja-sf-nav-link"
                  onClick={() => { mudarAba(aba); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.14 }}
                >
                  {({ home: "Início", item: "Todos os produtos", new: "Novidades", promo: "Promoções", review: "Avaliações" } as Record<AbaLojaPublica, string>)[aba]}
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Col 2 — Políticas */}
          <div className="loja-sf-col">
            {experienciaLoja?.politicaEntrega ? (
              <>
                <p className="loja-sf-col-title">Entrega</p>
                <p className="loja-sf-policy">{experienciaLoja.politicaEntrega}</p>
              </>
            ) : null}
            {experienciaLoja?.politicaTroca ? (
              <>
                <p className="loja-sf-col-title" style={{ marginTop: experienciaLoja?.politicaEntrega ? "1.25rem" : undefined }}>Trocas</p>
                <p className="loja-sf-policy">{experienciaLoja.politicaTroca}</p>
              </>
            ) : null}
            {!experienciaLoja?.politicaEntrega && !experienciaLoja?.politicaTroca && (
              <>
                <p className="loja-sf-col-title">Políticas</p>
                <p className="loja-sf-policy loja-sf-policy--empty">As políticas da loja serão adicionadas em breve.</p>
              </>
            )}
          </div>

          {/* Col 3 — Bizy */}
          <div className="loja-sf-col">
            <p className="loja-sf-col-title">Plataforma</p>
            <motion.div
              className="loja-sf-bizy"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="loja-sf-bizy-header">
                <motion.div
                  className="loja-sf-bizy-icon"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.18 }}
                >
                  <LogoBizy variante="icone" style={{ width: 20, height: 20 }} />
                </motion.div>
                <div>
                  <p className="loja-sf-bizy-name">Bizy</p>
                  <p className="loja-sf-bizy-sub">Lojas digitais em Angola</p>
                </div>
              </div>
              <p className="loja-sf-bizy-desc">Cria e gere a tua loja online em minutos. Vende mais, cresce mais.</p>
              <Link to="/" className="loja-sf-bizy-cta">
                Criar a minha loja
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <div className="loja-sf-base">
          <span>© {new Date().getFullYear()} {dados.loja.nomeComercial} · Criado com Bizy</span>
          <span>Bizy · Todos os direitos reservados</span>
        </div>
      </footer>

      <Sheet open={!!produtoAberto} onOpenChange={(aberto) => { if (!aberto) setProdutoAberto(null); }}>
        <SheetContent
          side="bottom"
          className="loja-stitch loja-modal-responsivo loja-product-sheet h-[96dvh] overflow-hidden border-0 p-0 data-[side=bottom]:!border-0 sm:mx-auto sm:h-[92dvh] sm:max-w-[1180px] lg:h-[94dvh]"
          showCloseButton={false}
          onOpenAutoFocus={(evento) => evento.preventDefault()}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{produtoAberto?.nome ?? "Produto"}</SheetTitle>
            <SheetDescription>Detalhes do produto</SheetDescription>
          </SheetHeader>

          {produtoAberto && (
            <DetalheProduto
              produto={produtoAberto}
              corPrimaria={corPrimaria}
              favorito={favoritos.has(produtoAberto.codigo)}
              quantidade={quantidade}
              fotoAtiva={fotoAtiva}
              experiencia={dados.loja.experiencia}
              loja={dados.loja}
              modoNegocio={modoNegocio}
              selecoesVariantes={selecoesVariantes}
              setFotoAtiva={setFotoAtiva}
              setQuantidade={setQuantidade}
              onSelecionarVariante={(nome, valor) => setSelecoesVariantes((atual) => ({ ...atual, [nome]: valor }))}
              onFavorito={() => alternarFavorito(produtoAberto)}
              onComprar={() => abrirCheckout(produtoAberto, quantidade, selecoesVariantes)}
              onAdicionarCheckout={() => adicionarProdutoAoCheckoutBizy(produtoAberto, quantidade, selecoesVariantes)}
              onFechar={() => setProdutoAberto(null)}
              reviews={reviewsComProduto}
              recomendacoes={topProdutos.slice(0, 6)}
              favoritos={favoritos}
              onFavoritoProduto={alternarFavorito}
              onAbrirProduto={abrirProduto}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={checkoutAberto} onOpenChange={setCheckoutAberto}>
        <SheetContent
          side="right"
          className="loja-modal-responsivo flex h-[100dvh] w-full max-w-full flex-col overflow-hidden p-0 data-[side=right]:sm:max-w-xl"
          showCloseButton={false}
        >
          <SheetHeader className="border-b border-neutral-100 px-5 py-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SheetTitle>Compra assistida</SheetTitle>
                <SheetDescription>Produto, dados e entrega preparados antes de abrir o WhatsApp.</SheetDescription>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutAberto(false)}
                className="grid size-10 place-items-center text-neutral-500 hover:bg-neutral-100"
                aria-label="Fechar checkout"
              >
                <X size={18} />
              </button>
            </div>
          </SheetHeader>
          {checkoutProduto && (
            <CheckoutAssistido
              produto={checkoutProduto}
              corPrimaria={corPrimaria}
              passo={checkoutPasso}
              setPasso={setCheckoutPasso}
              quantidade={checkoutQuantidade}
              setQuantidade={setCheckoutQuantidade}
              selecoesVariantes={checkoutVariantes}
              setSelecoesVariantes={setCheckoutVariantes}
              perfil={perfilCliente}
              setPerfil={setPerfilCliente}
              entrega={entregaCheckout}
              setEntrega={setEntregaCheckout}
              resumoEntrega={resumoEntrega}
              calculandoEntrega={calculandoEntrega}
              finalizando={finalizandoCheckout}
              calcularEntregaCheckout={calcularEntregaCheckout}
              confirmarCheckout={confirmarCheckout}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── Order Confirmation ── */}
      <Sheet open={!!pedidoConfirmado} onOpenChange={(aberto) => { if (!aberto) setPedidoConfirmado(null); }}>
        <SheetContent
          side="bottom"
          className="loja-modal-responsivo h-[96dvh] overflow-hidden border-0 p-0 data-[side=bottom]:!border-0 sm:mx-auto sm:h-[90dvh] sm:max-w-lg"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Pedido confirmado</SheetTitle>
            <SheetDescription>O seu pedido foi enviado com sucesso.</SheetDescription>
          </SheetHeader>
          {pedidoConfirmado && (
            <ConfirmacaoPedido
              produto={pedidoConfirmado.produto}
              quantidade={pedidoConfirmado.quantidade}
              variantes={pedidoConfirmado.variantes}
              total={pedidoConfirmado.total}
              entrega={pedidoConfirmado.entrega}
              onWhatsApp={() => {
                window.open(pedidoConfirmado.whatsappUrl, "_blank", "noopener,noreferrer");
              }}
              onContinuar={() => setPedidoConfirmado(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <LeadCaptureModal
        aberto={leadModalAberto}
        motivo={leadMotivo}
        perfil={perfilCliente}
        setPerfil={setPerfilCliente}
        fechar={() => setLeadModalAberto(false)}
        salvar={() => {
          guardarPerfilCliente(slug, perfilCliente);
          setLeadModalAberto(false);
          registrarEvento("CATALOGO_VISTO", {
            metadata: {
              acao: "lead_capture_salvo",
              temEmail: Boolean(perfilCliente.email),
              marketing: perfilCliente.consentimentoMarketing
            }
          });
        }}
      />

      {erro && dados && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 sm:bottom-6">
          <div className="flex items-center gap-3 bg-neutral-900 px-5 py-3 text-sm text-white">
            <span className="max-w-xs">{erro}</span>
            <button type="button" onClick={() => setErro("")} className="shrink-0 text-neutral-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <AvisoPrivacidade escopo={`loja-${slug}`} texto={experienciaLoja?.politicaPrivacidade} />
    </main>
  );
}

const ABAS_LOJA = [
  { id: "home", rotulo: "Home" },
  { id: "item", rotulo: "Item" },
  { id: "new", rotulo: "New" },
  { id: "promo", rotulo: "Promo" },
  { id: "review", rotulo: "Review" }
] as const satisfies ReadonlyArray<{ id: AbaLojaPublica; rotulo: string }>;

function PerfilLojaSocial({
  colecoes,
  corPrimaria,
  localizacao,
  loja,
  market,
  onContacto,
  onVerItens,
  onSelecionarColecao,
  perfil,
  slug,
  trackingId,
  totalProdutos
}: {
  colecoes: ColecaoPerfilLoja[];
  corPrimaria: string;
  localizacao: string;
  loja: LojaPublicaResposta["loja"];
  market?: LojaPublicaResposta["market"];
  onContacto: () => void;
  onVerItens: () => void;
  onSelecionarColecao: (colecao: ColecaoPerfilLoja) => void;
  perfil?: LojaPublicaResposta["perfil"];
  slug: string;
  trackingId: string;
  totalProdutos: number;
}) {
  const [seguindo, setSeguindo] = useState(false);
  const [totalSeguidores, setTotalSeguidores] = useState(perfil?.contadores?.seguidores ?? 0);
  const [carregandoFollow, setCarregandoFollow] = useState(false);

  useEffect(() => {
    setTotalSeguidores(perfil?.contadores?.seguidores ?? 0);
  }, [perfil?.contadores?.seguidores]);

  useEffect(() => {
    if (!slug || !trackingId) return;
    verificarSeSegueLoja(slug, trackingId)
      .then((r) => setSeguindo(r.seguindo))
      .catch(() => {});
  }, [slug, trackingId]);

  const alternarFollow = useCallback(async () => {
    if (carregandoFollow || !slug || !trackingId) return;
    setCarregandoFollow(true);
    try {
      if (seguindo) {
        await deixarDeSeguirLoja(slug, trackingId);
        setSeguindo(false);
        setTotalSeguidores((n) => Math.max(0, n - 1));
      } else {
        await seguirLoja(slug, trackingId, "perfil");
        setSeguindo(true);
        setTotalSeguidores((n) => n + 1);
      }
    } catch { /* silencioso */ }
    setCarregandoFollow(false);
  }, [carregandoFollow, seguindo, slug, trackingId]);
  const capaUrl = resolverUrlMedia(perfil?.capaUrl ?? loja.capaUrl);
  const avatarUrl = resolverUrlMedia(perfil?.avatarUrl ?? loja.logoUrl);
  const bio = perfil?.bio ?? loja.descricaoPublica;
  const totalColecoes = perfil?.contadores?.colecoes ?? colecoes.length;
  const capaEstilo = capaUrl
    ? {
        backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${corPrimaria} 70%, #000) 0%, color-mix(in srgb, ${corPrimaria} 40%, #000) 100%), url(${capaUrl})`,
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center"
      }
    : {
        backgroundImage: `linear-gradient(145deg, color-mix(in srgb, ${corPrimaria} 60%, #000) 0%, color-mix(in srgb, ${corPrimaria} 30%, #000) 100%)`
      };
  const totalProdutosReal = perfil?.contadores?.produtos ?? totalProdutos;
  const urlMarket = perfil?.acoes?.urlMarket ?? market?.url;
  const estatisticas = [
    totalSeguidores > 0 && { icon: <User size={13} />, label: `${formatarNumeroCurto(totalSeguidores)} Seguidores` },
    totalProdutosReal > 0 && { icon: <ShoppingBag size={13} />, label: `${formatarNumeroCurto(totalProdutosReal)} Produtos` },
    loja.segmento && { icon: <Tag size={13} />, label: loja.segmento }
  ].filter(Boolean) as { icon: ReactNode; label: string }[];

  return (
    <motion.section
      className="loja-profile-shell"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="loja-profile-cover">
        <div className="loja-profile-cover-fallback" style={capaEstilo} />
        <div className="loja-profile-cover-glow" />
      </div>

      <div className="loja-profile-content">
        <div className="loja-profile-head">
          <div className="loja-profile-head-copy">
            <span className="loja-profile-avatar" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{(perfil?.nomeComercial ?? loja.nomeComercial).slice(0, 3).toUpperCase()}</span>}
              <small>trends</small>
            </span>
            <div className="loja-profile-head-text">
              <div className="loja-profile-name-row">
                <h1>{perfil?.nomeComercial ?? loja.nomeComercial}</h1>
                <ChevronRight size={18} />
              </div>
              {totalSeguidores > 0 && (
                <p>
                  <strong>{formatarNumeroCurto(totalSeguidores)} Seguidores</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {bio && <p className="loja-profile-bio">{bio}</p>}
        {localizacao && (
          <p className="loja-profile-location">
            <MapPin size={13} />
            <span>{localizacao}</span>
            {totalColecoes > 0 && <small>{formatarNumeroCurto(totalColecoes)} catálogos</small>}
          </p>
        )}

        {estatisticas.length > 0 && (
          <div className="loja-profile-badges" aria-label="Destaques da loja">
            {estatisticas.map((badge) => (
              <span key={badge.label} className="loja-profile-badge">
                <span className="loja-profile-badge-icon">{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            ))}
          </div>
        )}

        <button type="button" className="loja-profile-trends-banner" onClick={onVerItens}>
          <span className="loja-profile-trends-brand">market</span>
          <span className="loja-profile-trends-copy">Produtos, catálogos e novidades publicados pela loja.</span>
          <ChevronRight size={18} />
        </button>

        <div className="loja-profile-action-row loja-profile-commerce-tools">
          {perfil?.acoes?.seguirDisponivel !== false && (
            <button
              type="button"
              className={`loja-profile-action-pill is-primary${seguindo ? " is-following" : ""}`}
              onClick={alternarFollow}
              disabled={carregandoFollow}
              aria-pressed={seguindo}
            >
              {carregandoFollow ? <Loader2 size={15} className="animate-spin" /> : seguindo ? "A seguir" : "+ Seguir"}
            </button>
          )}
          <button type="button" className="loja-profile-action-pill" onClick={onVerItens}>
            Todos os itens
          </button>
          {urlMarket && (
            <Link to={urlMarket} className="loja-profile-action-pill loja-profile-market-link">
              Bizy Market
            </Link>
          )}
        </div>

        {colecoes.length > 0 && (
          <div className="loja-profile-catalogos loja-profile-filter-chips" aria-label="Catálogos da loja">
            {colecoes.slice(0, 8).map((colecao) => (
              <button
                key={colecao.id}
                type="button"
                className={`loja-profile-catalogo-chip ${colecao.ativa ? "is-active" : ""}`}
                aria-pressed={colecao.ativa}
                onClick={() => onSelecionarColecao(colecao)}
              >
                <span className="loja-profile-catalogo-thumb">
                  {colecao.imagem ? <img src={resolverUrlMedia(colecao.imagem)} alt="" /> : <Package size={16} />}
                </span>
                <span className="loja-profile-catalogo-copy">
                  <strong>{colecao.nome}</strong>
                  <small>{colecao.totalProdutos}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function BarraAbas({
  abaAtiva,
  onChange
}: {
  abaAtiva: AbaLojaPublica;
  onChange: (aba: AbaLojaPublica) => void;
}) {
  return (
    <nav className="loja-store-tabs sticky top-[4.65rem] z-30 border-b border-neutral-100 bg-white/95 py-2 backdrop-blur-xl sm:top-[5.1rem]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-10">
        <div className="loja-store-tabs-bar" role="tablist" aria-label="Secções da loja">
          {ABAS_LOJA.map((aba) => {
            const ativa = aba.id === abaAtiva;
            const isNew = aba.id === "new";
            return (
              <button
                key={aba.id}
                type="button"
                id={`loja-tab-${aba.id}`}
                role="tab"
                aria-selected={ativa}
                aria-controls={`loja-tabpanel-${aba.id}`}
                onClick={() => onChange(aba.id)}
                className={`loja-store-tab ${ativa ? "is-active" : ""} ${isNew ? "is-new" : ""}`}
                data-active={ativa ? "true" : "false"}
              >
                {ativa && (
                  <motion.span
                    layoutId="loja-tab-underline"
                    className="loja-store-tab-underline"
                    style={{ backgroundColor: isNew ? "var(--green)" : "var(--foreground)" }}
                    transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {isNew && <Sparkles size={14} />}
                  {TITULOS_ABAS_LOJA[aba.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function SeloCupomLoja({ corPrimaria, cupom }: { corPrimaria: string; cupom?: string | null }) {
  const cupomLimpo = cupom?.trim();
  if (!cupomLimpo) return null;

  return (
    <section className="mb-6 bg-foreground p-4 text-white sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center bg-white/10" style={{ color: corPrimaria }}>
            <Tag size={19} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Incentivo ativo</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Use este código na conversa com a loja</h2>
            <p className="mt-1 text-sm leading-6 text-white/62">
              O desconto ou condição especial é confirmado pelo atendimento antes da compra.
            </p>
          </div>
        </div>
        <div className="border border-white/10 bg-white px-4 py-3 text-center text-neutral-950">
          <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-neutral-400">Código</span>
          <strong className="mt-1 block text-lg tracking-wide">{cupomLimpo}</strong>
        </div>
      </div>
    </section>
  );
}

function BotaoComprarLoja({
  children = "Comprar agora",
  disabled = false,
  onClick
}: {
  children?: string;
  disabled?: boolean;
  onClick: (evento: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-11 w-full items-center justify-between rounded-none bg-foreground pl-4 text-sm font-semibold text-white transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
    >
      <span className="truncate">{children}</span>
      <span className="grid h-11 w-11 shrink-0 place-items-center border-l border-white/15 bg-white/10 transition-colors group-hover:bg-white/15">
        <ArrowRight size={16} />
      </span>
    </button>
  );
}

function SinaisConfiancaLoja({
  experiencia,
  loja,
  modoNegocio
}: {
  experiencia?: ExperienciaLojaPublica;
  loja: LojaPublicaResposta["loja"];
  modoNegocio: ModoNegocio;
}) {
  const sinais = [
    {
      icon: <ShoppingBag size={16} />,
      titulo: "Compra guiada",
      detalhe: modoNegocio === "moda" ? "Tamanho, cor e quantidade seguem no pedido." : "Produto, quantidade e preferência seguem organizados."
    },
    {
      icon: <Truck size={16} />,
      titulo: "Entrega calculada",
      detalhe: experiencia?.politicaEntrega || "A taxa aparece antes de abrir a conversa no WhatsApp."
    },
    {
      icon: <MessageCircle size={16} />,
      titulo: "WhatsApp com contexto",
      detalhe: loja.whatsapp ? "O atendimento recebe produto, cliente, entrega e observações." : "A loja pode ativar WhatsApp para finalizar mais rápido."
    },
    {
      icon: <ShieldCheck size={16} />,
      titulo: "Dados do pedido",
      detalhe: experiencia?.politicaPrivacidade || "Nome, contacto e morada só entram quando ajudam a finalizar a compra."
    }
  ];

  return (
    <section className="mt-10 bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Sinais de confiança</p>
          <h2 className="mt-1 text-base font-semibold text-neutral-950">Compra clara antes de falar com {loja.nomeComercial}</h2>
        </div>
        <Badge variant="outline">Sem surpresas</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {sinais.map((sinal) => (
          <div key={sinal.titulo} className="border border-neutral-200 bg-neutral-50 p-3">
            <span className="text-neutral-500">{sinal.icon}</span>
            <strong className="mt-3 block text-sm text-neutral-950">{sinal.titulo}</strong>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{sinal.detalhe}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProdutosVistosRecentemente({
  corPrimaria,
  favoritos,
  onComprar,
  onFavorito,
  onVerProduto,
  produtos
}: {
  corPrimaria: string;
  favoritos: Set<string>;
  onComprar: (produto: ProdutoPublico) => void;
  onFavorito: (produto: ProdutoPublico) => void;
  onVerProduto: (produto: ProdutoPublico) => void;
  produtos: ProdutoPublico[];
}) {
  if (!produtos.length) return null;

  return (
    <section className="bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">vistos recentemente</p>
          <h2 className="mt-1 text-base font-semibold text-neutral-950">Continue de onde parou</h2>
        </div>
        <Clock size={17} className="text-neutral-400" />
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
        {produtos.slice(0, 6).map((produto) => (
          <div key={`visto-${produto.codigo}`} className="w-36 shrink-0 sm:w-40">
            <CartaoProduto
              produto={produto}
              corPrimaria={corPrimaria}
              favorito={favoritos.has(produto.codigo)}
              onComprar={() => onComprar(produto)}
              onFavorito={() => onFavorito(produto)}
              onVerDetalhes={() => onVerProduto(produto)}
              compacto
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoricoEncomendasCliente({ historico }: { historico: PedidoHistoricoLoja[] }) {
  return (
    <section className="bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">histórico</p>
          <h2 className="mt-1 text-base font-semibold text-neutral-950">Encomendas neste dispositivo</h2>
        </div>
        <ShoppingBag size={17} className="text-neutral-400" />
      </div>
      {historico.length > 0 ? (
        <div className="space-y-2">
          {historico.slice(0, 3).map((pedido) => (
            <div key={`${pedido.codigo}-${pedido.criadoEm}`} className="border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="line-clamp-1 text-sm text-neutral-950">{pedido.nome}</strong>
                  <p className="mt-1 text-xs text-neutral-500">
                    {new Date(pedido.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                    {pedido.quantidade ? ` · qtd. ${pedido.quantidade}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-neutral-950">{formatarKwanza(pedido.totalEmKwanza)}</span>
              </div>
              {pedido.variantes && Object.keys(pedido.variantes).length > 0 && (
                <p className="mt-2 line-clamp-1 text-xs text-neutral-500">{montarResumoVariantes(pedido.variantes)}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-500">
          As próximas compras ficam guardadas aqui para o cliente voltar ao mesmo produto com menos esforço.
        </div>
      )}
    </section>
  );
}

function CartaoProduto({
  produto,
  corPrimaria,
  favorito,
  onComprar,
  onFavorito,
  onVerDetalhes,
  compacto = false
}: {
  produto: ProdutoPublico;
  corPrimaria: string;
  favorito: boolean;
  onComprar: () => void;
  onFavorito: () => void;
  onVerDetalhes: () => void;
  compacto?: boolean;
}) {
  const temPromocao = Boolean(produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza);
  const desconto = temPromocao ? Math.round(((produto.precoEmKwanza - produto.precoPromocionalEmKwanza!) / produto.precoEmKwanza) * 100) : 0;
  const semStock = produto.quantidade <= 0 || produto.estadoStock === "ESGOTADO" || produto.disponivel === false;
  const ehNovidade = produto.vitrine?.selos?.some((s) => /novo|new|novidade/i.test(s));
  const visuais = obterVisuaisProduto(produto);

  return (
    <article
      className={`loja-produto-card group flex h-full cursor-pointer flex-col overflow-hidden ${compacto ? "is-compact" : ""}`}
      onClick={onVerDetalhes}
      onKeyDown={(e) => { if (e.key === "Enter") onVerDetalhes(); }}
      tabIndex={0}
      role="button"
    >
      <div className="loja-produto-card-media">
        {produto.fotos[0] ? (
          <img
            src={resolverUrlMedia(produto.fotos[0])}
            alt={produto.nome}
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center bg-neutral-50">
            <Package className="text-neutral-200" size={28} />
          </div>
        )}

        <div className="loja-produto-card-tag-row">
          {semStock && <span className="lp-tag esgotado">Esgotado</span>}
          {!semStock && produto.quantidade === 1 && <span className="lp-tag ultima-unidade">Última unidade</span>}
          {!semStock && temPromocao && <span className="lp-tag promo">-{desconto}%</span>}
          {!semStock && !temPromocao && ehNovidade && <span className="lp-tag novo">Novo</span>}
        </div>

        {(visuais.cores.length > 0 || produto.fotos.length > 1) && (
          <div className="loja-produto-card-swatches" aria-hidden="true">
            {visuais.cores.slice(0, 3).map((cor) => (
              <span key={cor} style={{ backgroundColor: cor }} />
            ))}
            <small>{Math.min(9, produto.fotos.length || visuais.cores.length)}</small>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFavorito(); }}
          className={`lp-fav ${favorito ? "active" : ""}`}
          aria-label={favorito ? "Remover favorito" : "Adicionar favorito"}
        >
          <Heart className={favorito ? "fill-current" : ""} />
        </button>

        <button
          type="button"
          className="loja-produto-card-cart"
          disabled={semStock}
          onClick={(e) => { e.stopPropagation(); onComprar(); }}
          aria-label={semStock ? "Esgotado" : "Adicionar ao carrinho"}
        >
          <ShoppingBag size={16} />
        </button>
      </div>

      <div className="loja-produto-card-info">
        <h3>{produto.nome}</h3>

        {produto.categoria && <p className="loja-produto-card-category">{produto.categoria}</p>}

        <div className="loja-produto-card-bottom">
          <div className="loja-produto-card-price">
            <span>{formatarKwanza(precoProduto(produto))}</span>
            {temPromocao && <del>{formatarKwanza(produto.precoEmKwanza)}</del>}
          </div>
        </div>
      </div>
    </article>
  );
}

function DetalheProduto({
  produto,
  corPrimaria,
  favorito,
  quantidade,
  fotoAtiva,
  experiencia,
  loja,
  modoNegocio,
  selecoesVariantes,
  setFotoAtiva,
  setQuantidade,
  onSelecionarVariante,
  onFavorito,
  onComprar,
  onAdicionarCheckout,
  onFechar,
  onAbrirProduto,
  onFavoritoProduto,
  reviews = [],
  recomendacoes = [],
  favoritos
}: {
  produto: ProdutoPublico;
  corPrimaria: string;
  favorito: boolean;
  quantidade: number;
  fotoAtiva: number;
  experiencia?: ExperienciaLojaPublica;
  loja: LojaPublicaResposta["loja"];
  modoNegocio: ModoNegocio;
  selecoesVariantes: Record<string, string>;
  setFotoAtiva: (indice: number) => void;
  setQuantidade: (quantidade: number) => void;
  onSelecionarVariante: (nome: string, valor: string) => void;
  onFavorito: () => void;
  onComprar: () => void;
  onAdicionarCheckout: () => void;
  onFechar: () => void;
  onAbrirProduto?: (produto: ProdutoPublico) => void;
  onFavoritoProduto: (produto: ProdutoPublico) => void;
  reviews?: ReviewLojaPublica[];
  recomendacoes?: ProdutoPublico[];
  favoritos: ReadonlySet<string>;
}) {
  const temPromocao = Boolean(produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza);
  const desconto = temPromocao ? Math.round(((produto.precoEmKwanza - produto.precoPromocionalEmKwanza!) / produto.precoEmKwanza) * 100) : 0;
  const semStock = produto.quantidade <= 0 || produto.estadoStock === "ESGOTADO" || produto.disponivel === false;
  const fotos = produto.fotos.length > 0 ? produto.fotos : [null];
  const ehNovidade = produto.vitrine?.selos?.some((s) => /novo|new|novidade/i.test(s));
  const reduzirMovimento = useReducedMotion();
  const fotosGaleria = fotos.slice(0, Math.max(1, Math.min(fotos.length, 6)));
  const categoria = produto.categoria || produto.colecao || "Produto";
  const seloReal = produto.vitrine?.selos?.find((selo) => selo.trim());
  const tituloSelo = semStock ? "Indisponível" : temPromocao ? "Oferta limitada" : ehNovidade ? "Nova chegada" : seloReal ?? "Fornecedor identificado";
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const voltarRef = useRef<HTMLButtonElement | null>(null);
  const [abaDetalhe, setAbaDetalhe] = useState<AbaDetalheProduto>("produto");
  const reviewsVisiveis = reviews.slice(0, 4);
  const recomendacoesVisiveis = recomendacoes.filter((item) => item.codigo !== produto.codigo).slice(0, 4);
  const localizacaoLoja = [loja.municipio, loja.provincia].filter(Boolean).join(", ");
  const urlProdutoMarket = ROTAS_LOJAS.produtoMarket(produto.codigo);

  useEffect(() => {
    setAbaDetalhe("produto");
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: 0 });
    const temporizador = window.setTimeout(() => {
      node.scrollTo({ top: 0 });
      voltarRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(temporizador);
  }, [produto.codigo]);

  return (
    <section className="loja-product-detail" aria-labelledby="loja-product-title">
      <div className="loja-product-detail-bar">
        <button ref={voltarRef} type="button" onClick={onFechar} className="loja-pdp-icon-button" aria-label="Voltar ao catálogo">
          <ChevronLeft size={20} />
        </button>
        <div className="loja-pdp-topline">
          <span>{categoria}</span>
          <strong>{produto.vitrine?.titulo || "Caso apenas o acessório"}</strong>
        </div>
        <div className="loja-pdp-toolbar-actions">
          <button type="button" onClick={onFavorito} className="loja-pdp-icon-button" aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={favorito}>
            <Heart size={18} className={favorito ? "fill-red-500 text-red-500" : ""} />
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.share?.({ title: produto.nome, url: window.location.href }).catch(() => {
                void navigator.clipboard.writeText(window.location.href);
              });
            }}
            className="loja-pdp-icon-button"
            aria-label="Partilhar produto"
          >
            <Share2 size={18} />
          </button>
          <button type="button" className="loja-pdp-icon-button" aria-label="Mais opções">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="loja-pdp-tabs" role="tablist" aria-label="Detalhes do produto">
        {([
          { id: "produto", label: "Produto" },
          { id: "comentarios", label: "Comentários" },
          { id: "recomendar", label: "Recomendar" }
        ] as Array<{ id: AbaDetalheProduto; label: string }>).map((aba) => {
          const ativa = abaDetalhe === aba.id;
          return (
            <button
              key={aba.id}
              type="button"
              id={`loja-tab-${aba.id}`}
              role="tab"
              aria-selected={ativa}
              aria-controls={`loja-tabpanel-${aba.id}`}
              className={`loja-pdp-tab ${ativa ? "is-active" : ""}`}
              onClick={() => setAbaDetalhe(aba.id)}
            >
              <span>{aba.label}</span>
              {ativa && <span className="loja-pdp-tab-underline" />}
            </button>
          );
        })}
      </div>

      <div className="loja-pdp-scroll" ref={scrollRef}>
        <div className="loja-pdp-shell">
          {abaDetalhe === "produto" && (
            <motion.div
              id="loja-tabpanel-produto"
              role="tabpanel"
              aria-labelledby="loja-tab-produto"
              className="loja-pdp-panel loja-pdp-buy-panel"
              initial={reduzirMovimento ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="loja-pdp-gallery">
                <div className="loja-pdp-hero">
                  {fotos[fotoAtiva] ? (
                    <img src={resolverUrlMedia(fotos[fotoAtiva])} alt={produto.nome} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center bg-neutral-50">
                      <Package className="text-neutral-300" size={56} />
                    </div>
                  )}

                  <div className="loja-pdp-hero-copy">
                    <span>{produto.vitrine?.titulo || produto.categoria || produto.nome}</span>
                  </div>

                  <div className="loja-pdp-badges">
                    {!semStock && produto.quantidade === 1 && <span className="lp-tag ultima-unidade">Última unidade</span>}
                    {temPromocao && <span className="lp-tag promo">-{desconto}%</span>}
                    {!temPromocao && ehNovidade && <span className="lp-tag novo">Novo</span>}
                    <span className="loja-pdp-shot-count">{fotoAtiva + 1}/{fotos.length}</span>
                  </div>

                  {fotos.length > 1 && (
                    <>
                      <button type="button" onClick={() => setFotoAtiva(fotoAtiva > 0 ? fotoAtiva - 1 : fotos.length - 1)} className="loja-pdp-gallery-arrow is-left" aria-label="Ver foto anterior">
                        <ChevronLeft size={19} />
                      </button>
                      <button type="button" onClick={() => setFotoAtiva(fotoAtiva < fotos.length - 1 ? fotoAtiva + 1 : 0)} className="loja-pdp-gallery-arrow is-right" aria-label="Ver próxima foto">
                        <ChevronRight size={19} />
                      </button>
                    </>
                  )}
                </div>

                {fotosGaleria.length > 1 && (
                  <div className="loja-product-thumbs" aria-label="Selecionar imagem do produto">
                    {fotosGaleria.map((foto, indice) => (
                      <button
                        key={indice}
                        type="button"
                        onClick={() => setFotoAtiva(indice)}
                        className={indice === fotoAtiva ? "is-active" : ""}
                        aria-label={`Ver imagem ${indice + 1}`}
                        aria-current={indice === fotoAtiva ? "true" : undefined}
                      >
                        {foto ? <img src={resolverUrlMedia(foto)} alt="" className="size-full object-cover" /> : <Package size={14} className="mx-auto text-neutral-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="loja-pdp-summary">
                <div className="loja-pdp-price-row">
                  <span>A partir de</span>
                  <strong>{formatarKwanza(precoProduto(produto))}</strong>
                </div>

                <h2 id="loja-product-title">{produto.nome}</h2>
                <p className="loja-pdp-subtitle">{produto.vitrine?.descricao || produto.colecao || produto.categoria || "Selecionado pela loja"}</p>

                <div className="loja-pdp-store-pill loja-pdp-store-badge">
                  <span>
                    {loja.logoUrl ? <img src={resolverUrlMedia(loja.logoUrl)} alt="" /> : <Store size={16} />}
                  </span>
                  <span>
                    <small>Vendido por</small>
                    <strong>{loja.nomeComercial}</strong>
                    <em>{localizacaoLoja || "Loja online"}</em>
                  </span>
                  <ArrowRight size={14} />
                </div>

                <div className="loja-pdp-proof-row">
                  <span className="loja-pdp-proof">
                    <ShieldCheck size={15} />
                    {tituloSelo}
                  </span>
                  <Link to={urlProdutoMarket} className="loja-pdp-similar-link">
                    Ver no Bizy Market
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {produto.descricao && (
                  <p className="loja-pdp-description">{produto.descricao}</p>
                )}

                <div className="loja-pdp-section-label">Opções</div>
                <SeletoresVariantes produto={produto} selecoesVariantes={selecoesVariantes} onSelecionar={onSelecionarVariante} corPrimaria={corPrimaria} />

                {!semStock && (
                  <div className="loja-pdp-quantity-row">
                    <span className="loja-pdp-section-label">Quantidade</span>
                    <QuantidadeSelector quantidade={quantidade} maximo={produto.quantidade} onChange={setQuantidade} />
                  </div>
                )}

                <div className="loja-pdp-delivery-card loja-pdp-service-grid loja-pdp-accordions">
                  <ItemAcordeaoPdp
                    titulo="Entrega em Angola"
                    detalhe={experiencia?.politicaEntrega || "A loja confirma modalidade, prazo e taxa antes de finalizar o pedido."}
                    icone={<Truck size={16} />}
                    inicialAberto
                  />
                  <ItemAcordeaoPdp
                    titulo="Trocas e devoluções"
                    detalhe={experiencia?.politicaTroca || "Trocas e devoluções dependem da política definida pela loja."}
                    icone={<Package size={16} />}
                  />
                  <ItemAcordeaoPdp
                    titulo="Pagamento e privacidade"
                    detalhe={experiencia?.politicaPrivacidade || "A loja recebe apenas os dados necessários para confirmar o pedido."}
                    icone={<ShieldCheck size={16} />}
                  />
                </div>

                <button
                  type="button"
                  className="loja-pdp-primary-cta"
                  disabled={semStock}
                  onClick={semStock ? undefined : onComprar}
                >
                  <span>{semStock ? "Indisponível" : "Comprar agora"}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {abaDetalhe === "comentarios" && (
            <motion.div
              id="loja-tabpanel-comentarios"
              role="tabpanel"
              aria-labelledby="loja-tab-comentarios"
              className="loja-pdp-panel"
              initial={reduzirMovimento ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              {reviewsVisiveis.length > 0 && (
                <>
                  <div className="loja-review-filter-row">
                    <button type="button" className="is-active">Tudo</button>
                    <button type="button">Com imagem</button>
                  </div>
                  <div className="loja-review-filter-row is-secondary">
                    {produto.categoria && <button type="button">{produto.categoria}</button>}
                    {produto.colecao && <button type="button">{produto.colecao}</button>}
                  </div>
                </>
              )}

              {reviewsVisiveis.length === 0 && (
                <div className="loja-review-summary-card">
                  <div>
                    <strong>Sem avaliações públicas</strong>
                    <small>Este produto ainda não tem avaliações reais publicadas.</small>
                  </div>
                  <button type="button" className="loja-pdp-rating-link" onClick={() => setAbaDetalhe("produto")}>
                    Ver produto
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {reviewsVisiveis.length > 0 && <div className="space-y-5">
                {reviewsVisiveis.map((review, indice) => {
                  const reviewProduto = recomendacoesVisiveis[indice] ?? produto;
                  const estrelas = Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#f5c518] text-[#f5c518]" />
                  ));
                  return (
                    <article key={review.id} className="loja-review-card">
                      <div className="loja-review-card-head">
                        <div>
                          <strong>{review.autor}</strong>
                          <span className="loja-review-stars">{estrelas}</span>
                        </div>
                        <time dateTime={review.data}>{review.data}</time>
                      </div>
                      <p className="loja-review-meta">Color: Black / Size: {review.variante}</p>
                      <p className="loja-review-text">{review.comentario}</p>
                      <button type="button" className="loja-review-translate">
                        {review.destaque ?? "Traduzir"}
                      </button>
                      {review.produtoImagem && (
                        <div className="loja-review-image">
                          <img src={review.produtoImagem} alt={review.produtoNome} />
                        </div>
                      )}
                      <div className="loja-review-product">
                        <div className="loja-review-product-thumb">
                          {review.produtoImagem ? <img src={review.produtoImagem} alt="" /> : <Package size={18} />}
                        </div>
                        <div className="loja-review-product-copy">
                          <p>{review.produtoNome}</p>
                          <span>{formatarKwanza(precoProduto(reviewProduto))}</span>
                        </div>
                        <button
                          type="button"
                          className="loja-review-product-cart"
                          onClick={() => {
                            if (onAbrirProduto) {
                              onAbrirProduto(reviewProduto);
                              return;
                            }
                            onComprar();
                          }}
                        >
                          <ShoppingBag size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>}
            </motion.div>
          )}

          {abaDetalhe === "recomendar" && (
            <motion.div
              id="loja-tabpanel-recomendar"
              role="tabpanel"
              aria-labelledby="loja-tab-recomendar"
              className="loja-pdp-panel"
              initial={reduzirMovimento ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <section className="loja-review-category-tabs">
                <button type="button" className="is-active">Recommend</button>
                {produto.categoria && <button type="button">{produto.categoria}</button>}
                {produto.colecao && <button type="button">{produto.colecao}</button>}
                <button type="button">{loja.segmento || "Loja"}</button>
              </section>

              <div className="loja-pdp-recommend-hero">
                <div>
                  <p>Você Também Pode Gostar</p>
                  <h3>Peças parecidas com esta seleção</h3>
                </div>
                <button type="button" className="loja-pdp-rating-link loja-pdp-similar-link" onClick={() => setAbaDetalhe("produto")}>
                  Ver produto
                  <ChevronRight size={14} />
                </button>
              </div>

              {recomendacoesVisiveis.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recomendacoesVisiveis.map((recomendado) => (
                    <CartaoProduto
                      key={`recomendado-${recomendado.codigo}`}
                      produto={recomendado}
                      corPrimaria={corPrimaria}
                      favorito={favoritos.has(recomendado.codigo)}
                      onFavorito={() => onFavoritoProduto(recomendado)}
                      onComprar={() => {
                        if (onAbrirProduto) {
                          onAbrirProduto(recomendado);
                          return;
                        }
                        onAdicionarCheckout();
                      }}
                      onVerDetalhes={() => {
                        if (onAbrirProduto) {
                          onAbrirProduto(recomendado);
                          return;
                        }
                        onFechar();
                      }}
                      compacto
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                  Sem recomendações por agora.
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="loja-product-sticky-buy">
        <button type="button" className="loja-product-sticky-icon" onClick={onFechar} aria-label="Loja">
          <Store size={18} />
        </button>
        <button type="button" className="loja-product-sticky-icon" onClick={onFavorito} aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={favorito}>
          <Heart size={18} className={favorito ? "fill-current" : ""} />
        </button>
        <button type="button" className="loja-product-sticky-add" disabled={semStock} onClick={() => onAdicionarCheckout()}>
          {semStock ? "Esgotado" : "ADICIONAR AO CARRINHO"}
        </button>
      </div>
    </section>
  );
}

function ItemAcordeaoPdp({
  detalhe,
  icone,
  inicialAberto = false,
  titulo
}: {
  detalhe: string;
  icone: ReactNode;
  inicialAberto?: boolean;
  titulo: string;
}) {
  const [aberto, setAberto] = useState(inicialAberto);

  return (
    <div className="loja-pdp-accordion-item">
      <button
        type="button"
        className="loja-pdp-accordion-trigger"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {icone}
          <span>{titulo}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {aberto && (
        <div className="loja-pdp-accordion-panel">
          <p>{detalhe}</p>
        </div>
      )}
    </div>
  );
}

function CheckoutAssistido({
  produto,
  corPrimaria,
  passo,
  setPasso,
  quantidade,
  setQuantidade,
  selecoesVariantes,
  setSelecoesVariantes,
  perfil,
  setPerfil,
  entrega,
  setEntrega,
  resumoEntrega,
  calculandoEntrega,
  finalizando,
  calcularEntregaCheckout,
  confirmarCheckout
}: {
  produto: ProdutoPublico;
  corPrimaria: string;
  passo: PassoCheckout;
  setPasso: (passo: PassoCheckout) => void;
  quantidade: number;
  setQuantidade: (quantidade: number) => void;
  selecoesVariantes: Record<string, string>;
  setSelecoesVariantes: (selecoes: Record<string, string>) => void;
  perfil: PerfilClienteLoja;
  setPerfil: (perfil: PerfilClienteLoja) => void;
  entrega: EntregaCheckout;
  setEntrega: (entrega: EntregaCheckout) => void;
  resumoEntrega: ResumoEntregaCheckout | null;
  calculandoEntrega: boolean;
  finalizando: boolean;
  calcularEntregaCheckout: () => Promise<ResumoEntregaCheckout | null>;
  confirmarCheckout: () => Promise<void>;
}) {
  const passos: Array<{ id: PassoCheckout; titulo: string }> = [
    { id: "variante", titulo: "Produto" },
    { id: "dados", titulo: "Dados" },
    { id: "entrega", titulo: "Entrega" },
    { id: "confirmar", titulo: "Confirmar" }
  ];
  const indiceAtual = passos.findIndex((item) => item.id === passo);

  function proximoPasso() {
    const proximo = passos[Math.min(indiceAtual + 1, passos.length - 1)];
    setPasso(proximo.id);
  }

  function passoAnterior() {
    const anterior = passos[Math.max(indiceAtual - 1, 0)];
    setPasso(anterior.id);
  }

  const subtotal = precoProduto(produto) * quantidade;
  const taxaEntrega = resumoEntrega?.taxaEntregaEmKwanza ?? 0;
  const total = resumoEntrega?.totalEmKwanza ?? subtotal;
  const resumoVariantes = montarResumoVariantes(selecoesVariantes);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Step indicator ── */}
      <div className="border-b border-neutral-100 px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          {passos.map((item, indice) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPasso(item.id)}
              className={`px-2 py-2 text-xs font-semibold transition-colors ${
                item.id === passo
                  ? "text-white"
                  : indice < indiceAtual
                    ? "bg-neutral-100 text-neutral-800"
                    : "bg-neutral-50 text-neutral-400"
              }`}
              style={item.id === passo ? { backgroundColor: corPrimaria, color: "#fff" } : undefined}
            >
              {item.titulo}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {/* ── Cart item card ── */}
        <div className="lp-cart-item">
          <span className="lp-cart-ph">
            {produto.fotos[0] ? <img src={resolverUrlMedia(produto.fotos[0])} alt="" /> : <Package size={22} className="mx-auto mt-5 text-neutral-400" />}
          </span>
          <div className="lp-cart-body">
            <div className="lp-cart-nm">{produto.nome}</div>
            {resumoVariantes && <div className="lp-cart-meta">{resumoVariantes}</div>}
            <div className="lp-cart-pr">{formatarKwanza(precoProduto(produto))}</div>
          </div>
          <div className="lp-cart-qty">
            <button type="button" onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>−</button>
            <span>{quantidade}</span>
            <button type="button" onClick={() => setQuantidade(Math.min(produto.quantidade || 99, quantidade + 1))}>+</button>
          </div>
        </div>

        {passo === "variante" && (
          <div className="mt-5 space-y-5">
            <SeletoresVariantes
              produto={produto}
              selecoesVariantes={selecoesVariantes}
              onSelecionar={(nome, valor) => setSelecoesVariantes({ ...selecoesVariantes, [nome]: valor })}
              corPrimaria={corPrimaria}
            />
          </div>
        )}

        {passo === "dados" && (
          <div className="mt-5 grid gap-3">
            <CampoCheckout icon={<User size={16} />} label="Nome" value={perfil.nome} onChange={(valor) => setPerfil({ ...perfil, nome: valor })} placeholder="O seu nome" />
            <CampoCheckout icon={<Phone size={16} />} label="WhatsApp" value={perfil.telefone} onChange={(valor) => setPerfil({ ...perfil, telefone: valor })} placeholder="923 000 000" />
            <CampoCheckout icon={<Mail size={16} />} label="Email opcional" value={perfil.email} onChange={(valor) => setPerfil({ ...perfil, email: valor })} placeholder="email@exemplo.com" />
            <label className="flex items-start gap-3 border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={perfil.consentimentoMarketing}
                onChange={(evento) => setPerfil({ ...perfil, consentimentoMarketing: evento.target.checked })}
                className="mt-1"
              />
              Quero receber novidades, reposições e promoções desta loja.
            </label>
          </div>
        )}

        {passo === "entrega" && (
          <div className="mt-5">
            {/* ── Delivery type zones ── */}
            <div className="lp-co-block">
              <div className="lp-co-block-h">Entrega</div>
              {(["ENTREGA", "RETIRADA", "ORCAMENTO"] as TipoEntregaCheckout[]).map((tipo) => (
                <div
                  key={tipo}
                  className={`lp-zone ${entrega.tipo === tipo ? "on" : ""}`}
                  onClick={() => setEntrega({ ...entrega, tipo })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setEntrega({ ...entrega, tipo }); }}
                >
                  <span className="lp-zone-radio" />
                  <div className="lp-zone-body">
                    <div className="lp-zone-nm">
                      {tipo === "ENTREGA" ? "Entrega ao domicílio" : tipo === "RETIRADA" ? "Retirada na loja" : "Orçamento personalizado"}
                    </div>
                    <div className="lp-zone-meta">
                      {tipo === "ENTREGA" ? "Receba no seu endereço" : tipo === "RETIRADA" ? "Levante na loja sem taxa" : "Condições sob consulta"}
                    </div>
                  </div>
                  {tipo === "ENTREGA" && resumoEntrega && (
                    <span className="lp-zone-pr">{formatarKwanza(resumoEntrega.taxaEntregaEmKwanza)}</span>
                  )}
                  {tipo === "RETIRADA" && <span className="lp-zone-pr">Grátis</span>}
                </div>
              ))}
            </div>

            {entrega.tipo === "ENTREGA" && (
              <div className="mt-4 grid gap-3">
                <CampoCheckout icon={<MapPin size={16} />} label="Província" value={entrega.provincia} onChange={(valor) => setEntrega({ ...entrega, provincia: valor })} placeholder="Luanda" />
                <CampoCheckout icon={<MapPin size={16} />} label="Município" value={entrega.municipio} onChange={(valor) => setEntrega({ ...entrega, municipio: valor })} placeholder="Talatona" />
                <CampoCheckout icon={<MapPin size={16} />} label="Bairro" value={entrega.bairro} onChange={(valor) => setEntrega({ ...entrega, bairro: valor })} placeholder="Bairro ou zona" />
                <CampoCheckout icon={<Truck size={16} />} label="Endereço/referência" value={entrega.endereco} onChange={(valor) => setEntrega({ ...entrega, endereco: valor })} placeholder="Rua, casa, ponto de referência" />
                <Button type="button" variant="outline" onClick={() => void calcularEntregaCheckout()} disabled={calculandoEntrega}>
                  {calculandoEntrega ? <Loader2 className="animate-spin" size={16} /> : <Truck size={16} />}
                  Calcular entrega
                </Button>
              </div>
            )}

            {/* ── Payment method ── */}
            <div className="lp-co-block">
              <div className="lp-co-block-h">Pagamento</div>
              <div className="lp-pay on">
                <span className="lp-pay-icon blue"><ShoppingBag size={18} /></span>
                <div className="lp-pay-body">
                  <div className="lp-pay-nm">Transferência bancária</div>
                  <div className="lp-pay-meta">Envie o comprovativo pelo WhatsApp</div>
                </div>
                <span className="lp-zone-radio" style={{ borderColor: "oklch(0.45 0.12 159)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: "oklch(0.45 0.12 159)", display: "block" }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {passo === "confirmar" && (
          <>
            <ResumoConfirmacao
              produto={produto}
              quantidade={quantidade}
              variantes={selecoesVariantes}
              perfil={perfil}
              entrega={entrega}
              resumoEntrega={resumoEntrega}
              calculandoEntrega={calculandoEntrega}
            />
          </>
        )}

        {/* ── Order summary (visible on entrega + confirmar) ── */}
        {(passo === "entrega" || passo === "confirmar") && (
          <div className="lp-summary">
            <div className="lp-summary-row"><span>Subtotal</span><span>{formatarKwanza(subtotal)}</span></div>
            {entrega.tipo === "ENTREGA" && (
              <div className="lp-summary-row">
                <span>{calculandoEntrega ? "A calcular entrega..." : `Entrega${resumoEntrega?.entrega.regra ? ` · ${resumoEntrega.entrega.regra}` : ""}`}</span>
                <span>{formatarKwanza(taxaEntrega)}</span>
              </div>
            )}
            <div className="lp-summary-row total"><span>Total</span><span>{formatarKwanza(total)}</span></div>
          </div>
        )}
      </div>

      {/* ── Footer buttons ── */}
      <div className="lp-co-foot">
        {passo === "confirmar" ? (
          <button type="button" className="lp-co-btn" onClick={() => void confirmarCheckout()} disabled={finalizando}>
            {finalizando ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
            Confirmar pedido
          </button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={passoAnterior} disabled={indiceAtual === 0 || finalizando}>
              Voltar
            </Button>
            <button type="button" className="lp-co-btn flex-1" onClick={proximoPasso}>
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCaptureModal({
  aberto,
  fechar,
  motivo,
  perfil,
  salvar,
  setPerfil
}: {
  aberto: boolean;
  fechar: () => void;
  motivo: string;
  perfil: PerfilClienteLoja;
  salvar: () => void;
  setPerfil: (perfil: PerfilClienteLoja) => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={(valor) => { if (!valor) fechar(); }}>
      <DialogContent className="loja-modal-responsivo max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6">
        <DialogHeader>
          <Badge variant="outline" className="w-fit">Atendimento rápido</Badge>
          <DialogTitle>Quer ajuda desta loja?</DialogTitle>
          <DialogDescription>{motivo}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <CampoCheckout icon={<User size={16} />} label="Nome" value={perfil.nome} onChange={(valor) => setPerfil({ ...perfil, nome: valor })} placeholder="O seu nome" />
          <CampoCheckout icon={<Phone size={16} />} label="WhatsApp" value={perfil.telefone} onChange={(valor) => setPerfil({ ...perfil, telefone: valor })} placeholder="923 000 000" />
          <CampoCheckout icon={<Mail size={16} />} label="Email opcional" value={perfil.email} onChange={(valor) => setPerfil({ ...perfil, email: valor })} placeholder="email@exemplo.com" />
          <label className="flex items-start gap-3 border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={perfil.consentimentoMarketing}
              onChange={(evento) => setPerfil({ ...perfil, consentimentoMarketing: evento.target.checked })}
              className="mt-1"
            />
            Aceito receber novidades, disponibilidade e promoções desta loja.
          </label>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={fechar}>Agora não</Button>
          <Button className="w-full sm:w-auto" onClick={salvar}>Guardar contacto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmacaoPedido({
  produto,
  quantidade,
  variantes,
  total,
  entrega,
  onWhatsApp,
  onContinuar
}: {
  produto: ProdutoPublico;
  quantidade: number;
  variantes: Record<string, string>;
  total: number;
  entrega: EntregaCheckout;
  onWhatsApp: () => void;
  onContinuar: () => void;
}) {
  const resumoVariante = montarResumoVariantes(variantes);
  const precoUnitario = precoProduto(produto);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="lp-cf">
          {/* ── Check ring animation ── */}
          <div className="lp-cf-ring animate-in zoom-in duration-300">
            <span className="lp-cf-ring-core">
              <Check />
            </span>
          </div>

          <h2 className="animate-in fade-in slide-in-from-bottom-1 duration-300 delay-150">Pedido confirmado!</h2>
          <p>Obrigada pela sua compra. Vamos confirmar o pagamento e preparar o envio.</p>
          <span className="lp-cf-ordno">Pedido #{Date.now().toString(36).toUpperCase().slice(-4)}</span>

          {/* ── Progress steps ── */}
          <div className="lp-cf-steps">
            <div className="lp-cf-step done">
              <span className="lp-cf-step-dot"><Check size={14} /></span>
              <span className="lp-cf-step-label">Recebido</span>
              <span className="lp-cf-step-line" />
            </div>
            <div className="lp-cf-step now">
              <span className="lp-cf-step-dot"><Clock size={14} /></span>
              <span className="lp-cf-step-label">Pagamento</span>
              <span className="lp-cf-step-line" />
            </div>
            <div className="lp-cf-step todo">
              <span className="lp-cf-step-dot"><Truck size={14} /></span>
              <span className="lp-cf-step-label">{entrega.tipo === "RETIRADA" ? "Retirada" : "Entrega"}</span>
            </div>
          </div>

          {/* ── Order details card ── */}
          <div className="lp-cf-card">
            <div className="lp-cf-card-row">
              <span>{produto.nome}{resumoVariante ? ` · ${resumoVariante}` : ""}</span>
              <b>{formatarKwanza(precoUnitario * quantidade)}</b>
            </div>
            {entrega.tipo === "ENTREGA" && entrega.municipio && (
              <div className="lp-cf-card-row">
                <span>Entrega · {entrega.municipio}</span>
                <b>{formatarKwanza(total - precoUnitario * quantidade)}</b>
              </div>
            )}
            <div className="lp-cf-card-row sep">
              <span>Total</span>
              <b>{formatarKwanza(total)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: WhatsApp + Continue ── */}
      <div className="lp-cf-foot">
        <button type="button" className="lp-cf-wa" onClick={onWhatsApp}>
          <MessageCircle />
          Acompanhar pelo WhatsApp
        </button>
        <button type="button" className="lp-cf-ghost" onClick={onContinuar}>
          Continuar a comprar
        </button>
      </div>
    </div>
  );
}

function SeletoresVariantes({
  corPrimaria,
  onSelecionar,
  produto,
  selecoesVariantes
}: {
  corPrimaria: string;
  onSelecionar: (nome: string, valor: string) => void;
  produto: ProdutoPublico;
  selecoesVariantes: Record<string, string>;
}) {
  const variantes = Object.entries(produto.variantes ?? {}).filter(([, opcoes]) => opcoes.length > 0);
  if (!variantes.length) return null;

  return (
    <div className="loja-pdp-variants">
      {variantes.map(([nome, opcoes]) => {
        const tipoTamanho = /tamanho|tam|size|numero|número|calce/i.test(nome);
        const tipoCor = /cor|color|tom/i.test(nome);
        return (
        <fieldset key={nome} className="loja-pdp-variant-group">
          <legend>
            <span>{nome}</span>
            {selecoesVariantes[nome] && <strong>{selecoesVariantes[nome]}</strong>}
          </legend>
          <div className={`loja-pdp-variant-options ${tipoTamanho ? "is-size-grid" : ""} ${tipoCor ? "is-color-rail" : ""}`}>
            {opcoes.map((opcao) => {
              const ativo = selecoesVariantes[nome] === opcao;
              return (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => onSelecionar(nome, opcao)}
                  className={ativo ? "is-active" : ""}
                  style={ativo ? { borderColor: corPrimaria } : undefined}
                  aria-pressed={ativo}
                  aria-label={`Selecionar ${nome}: ${opcao}`}
                >
                  {tipoCor && <span className="loja-pdp-color-dot" aria-hidden="true" style={{ background: resolverCorVisual(opcao, corPrimaria) }} />}
                  {opcao}
                </button>
              );
            })}
          </div>
        </fieldset>
      );
      })}
    </div>
  );
}

function QuantidadeSelector({
  maximo,
  onChange,
  quantidade
}: {
  maximo: number;
  onChange: (quantidade: number) => void;
  quantidade: number;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-neutral-900">Quantidade</h4>
      <div className="inline-flex items-center gap-0 ring-1 ring-neutral-200">
        <button type="button" onClick={() => onChange(Math.max(1, quantidade - 1))} className="grid size-10 place-items-center text-neutral-600 transition-colors hover:bg-neutral-50">
          <Minus size={16} />
        </button>
        <span className="min-w-[3rem] text-center text-sm font-semibold tabular-nums text-neutral-900">{quantidade}</span>
        <button type="button" onClick={() => onChange(Math.min(maximo, quantidade + 1))} className="grid size-10 place-items-center text-neutral-600 transition-colors hover:bg-neutral-50">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function CampoCheckout({
  icon,
  label,
  onChange,
  placeholder,
  value
}: {
  icon: React.ReactNode;
  label: string;
  onChange: (valor: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-neutral-500">{label}</span>
      <span className="relative block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">{icon}</span>
        <Input value={value} onChange={(evento) => onChange(evento.target.value)} placeholder={placeholder} className="h-12 border-neutral-200 bg-white pl-10" />
      </span>
    </label>
  );
}

function ResumoConfirmacao({
  calculandoEntrega,
  entrega,
  perfil,
  produto,
  quantidade,
  resumoEntrega,
  variantes
}: {
  calculandoEntrega: boolean;
  entrega: EntregaCheckout;
  perfil: PerfilClienteLoja;
  produto: ProdutoPublico;
  quantidade: number;
  resumoEntrega: ResumoEntregaCheckout | null;
  variantes: Record<string, string>;
}) {
  return (
    <div className="mt-5 space-y-3">
      <ResumoLinha titulo="Produto" detalhe={`${produto.nome} x ${quantidade}`} />
      {Object.keys(variantes).length > 0 && <ResumoLinha titulo="Variantes" detalhe={montarResumoVariantes(variantes)} />}
      <ResumoLinha titulo="Cliente" detalhe={`${perfil.nome || "Sem nome"} · ${perfil.telefone || "Sem telefone"}`} />
      <ResumoLinha titulo="Entrega" detalhe={entrega.tipo === "ENTREGA" ? entrega.endereco || "Endereço pendente" : entrega.tipo === "RETIRADA" ? "Retirada na loja" : "Entrega sob orçamento"} />
      <div className="bg-foreground p-4 text-white">
        <div className="flex items-center justify-between text-sm text-white/62">
          <span>Subtotal</span>
          <span>{formatarKwanza(resumoEntrega?.subtotalEmKwanza ?? precoProduto(produto) * quantidade)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-white/62">
          <span>{calculandoEntrega ? "A calcular entrega..." : "Entrega"}</span>
          <span>{formatarKwanza(resumoEntrega?.taxaEntregaEmKwanza ?? 0)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatarKwanza(resumoEntrega?.totalEmKwanza ?? precoProduto(produto) * quantidade)}</span>
        </div>
        {resumoEntrega?.entrega.descricao && <p className="mt-3 text-xs leading-5 text-white/55">{resumoEntrega.entrega.descricao}</p>}
      </div>
    </div>
  );
}

function ResumoLinha({ detalhe, titulo }: { detalhe: string; titulo: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-3">
      <span className="text-xs font-semibold text-neutral-500">{titulo}</span>
      <p className="mt-1 text-sm font-medium text-neutral-950">{detalhe}</p>
    </div>
  );
}
