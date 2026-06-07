import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
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
  X
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeBottomNav } from "@/components/ui/native-bottom-nav";
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
import { obterBaseApiUrl, resolverUrlMedia } from "../api";
import { resolverSlugLojaPublica } from "../lojaSubdominio";
import { obterLojaPublica, registrarEventoTrackingPublico, ROTAS_LOJAS } from "../lojas";
import { LogoBizy } from "../marca/bizy";
import { formatarKwanza } from "../utilidades";

type TipoEventoTracking = "LOJA_VISITADA" | "PRODUTO_VISTO" | "CATALOGO_VISTO" | "CHECKOUT_INICIADO";
type PassoCheckout = "variante" | "dados" | "entrega" | "confirmar";
type TipoEntregaCheckout = "ENTREGA" | "RETIRADA" | "ORCAMENTO";
type ModoNegocio = "moda" | "comida" | "servicos" | "geral";
type CriterioCatalogoPersonalizado = "categoria" | "colecao" | "busca" | "todos";

interface ProdutoPublico {
  codigo: string;
  sku?: string | null;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  colecao?: string | null;
  precoEmKwanza: number;
  precoPromocionalEmKwanza?: number | null;
  quantidade: number;
  fotos: string[];
  variantes?: Record<string, string[]>;
  vitrine?: {
    selos?: string[];
    prioridade?: number;
    titulo?: string | null;
    descricao?: string | null;
  };
  estadoStock: string;
  disponivel?: boolean;
}

interface LojaPublicaResposta {
  loja: {
    slug: string;
    nomeComercial: string;
    descricaoPublica?: string | null;
    segmento?: string | null;
    tipo?: string | null;
    provincia?: string | null;
    municipio?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    moeda?: string | null;
    logoUrl?: string | null;
    capaUrl?: string | null;
    corPrimaria?: string | null;
    whatsapp?: string | null;
    experiencia?: ExperienciaLojaPublica;
  };
  perfil?: {
    slug?: string | null;
    nomeComercial: string;
    bio?: string | null;
    segmento?: string | null;
    tipo?: string | null;
    avatarUrl?: string | null;
    capaUrl?: string | null;
    corAcento?: string | null;
    localizacao?: string | null;
    contadores?: {
      seguidores?: number;
      seguindo?: number;
      produtos?: number;
      colecoes?: number;
    };
    selos?: Array<{ id: string; label: string; tipo: string }>;
    acoes?: {
      contactoDisponivel?: boolean;
      checkoutDisponivel?: boolean;
      seguirDisponivel?: boolean;
      urlLoja?: string;
      urlMarket?: string;
    };
  };
  colecoes?: Array<{
    id: string;
    nome: string;
    tipo: "colecao" | "categoria" | string;
    totalProdutos: number;
    imagem?: string | null;
    url: string;
  }>;
  market?: {
    disponivel: boolean;
    label: string;
    url: string;
    categoriaPrincipal?: string | null;
  };
  produtos: ProdutoPublico[];
  vitrine?: Partial<Record<"destaques" | "promocoes" | "novidades" | "reposicoes" | "maisVendidos" | "kits", ProdutoPublico[]>>;
  seo?: {
    titulo?: string;
    descricao?: string;
  };
}

interface PerfilClienteLoja {
  nome: string;
  telefone: string;
  email: string;
  consentimentoMarketing: boolean;
  consentimentoDados: boolean;
}

interface EntregaCheckout {
  tipo: TipoEntregaCheckout;
  provincia: string;
  municipio: string;
  bairro: string;
  endereco: string;
}

interface ResumoEntregaCheckout {
  subtotalEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  moeda?: string;
  entrega: {
    tipo: TipoEntregaCheckout;
    regra: string;
    taxaEmKwanza: number;
    prazo: string | null;
    descricao: string;
    endereco: string | null;
  };
}

interface SecaoVitrine {
  id: string;
  titulo: string;
  detalhe: string;
  produtos: ProdutoPublico[];
  icone: "star" | "tag" | "package";
}

interface LinhaTabelaMedidasLoja {
  tamanho: string;
  busto?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  observacao?: string | null;
}

interface OperacaoLojaDigital {
  checkout?: {
    ignorarPaginaPagamento?: boolean;
    manterRascunhoAtePago?: boolean;
    confirmacaoAutomaticaPagamento?: boolean;
    entradaAtiva?: boolean;
    entradaPercentual?: number;
    taxaServicoPercentual?: number;
    taxaServicoFixaEmKwanza?: number;
    prefixoPedido?: string | null;
    sufixoPedido?: string | null;
    exigirTelefoneCheckout?: boolean;
    exigirLoginCheckout?: boolean;
  };
  fidelizacao?: {
    acessoLoja?: "aberto" | "telefone" | "login" | "membros";
    ofertaBoasVindasAtiva?: boolean;
    cupomBoasVindas?: string | null;
    recompensasAtivas?: boolean;
    recompensasIndicacaoAtivas?: boolean;
    creditoLojaAtivo?: boolean;
  };
  automacoes?: Record<string, boolean>;
  canais?: Record<string, boolean>;
  relatorios?: {
    metricas?: string[];
    agruparPor?: "hora" | "produto" | "cliente";
    filtrosPedidos?: string[];
  };
}

interface ExperienciaLojaPublica {
  modoNegocio?: "auto" | ModoNegocio;
  ordemVitrines?: string[];
  catalogosEditaveis?: boolean;
  leadCaptureAtivo?: boolean;
  leadCaptureTitulo?: string | null;
  cupomDestaque?: string | null;
  politicaTroca?: string | null;
  politicaEntrega?: string | null;
  politicaPrivacidade?: string | null;
  catalogosPersonalizados?: CatalogoPersonalizadoLoja[];
  operacao?: OperacaoLojaDigital;
  tabelaMedidas?: LinhaTabelaMedidasLoja[];
}

interface CatalogoPersonalizadoLoja {
  id: string;
  nome: string;
  descricao?: string | null;
  criterio: CriterioCatalogoPersonalizado;
  valor?: string | null;
}

interface CatalogoBloco {
  id: string;
  nome: string;
  tipo: "categoria" | "colecao" | "personalizado";
  detalhe: string;
  produtos: ProdutoPublico[];
  filtro?: {
    criterio: CriterioCatalogoPersonalizado;
    valor?: string | null;
  };
}

interface CatalogoFiltroAtivo {
  id: string;
  nome: string;
  criterio: CriterioCatalogoPersonalizado;
  valor?: string | null;
  totalProdutos?: number;
  origem: "perfil" | "categoria" | "bloco";
}

type ColecaoPerfilLoja = NonNullable<LojaPublicaResposta["colecoes"]>[number] & {
  ativa: boolean;
};

interface PaletaLojaPublica {
  primaria: string;
  fundo: string;
  superficie: string;
  texto: string;
  acento: string;
}

interface PedidoHistoricoLoja {
  codigo: string;
  nome: string;
  totalEmKwanza: number;
  criadoEm: string;
  quantidade?: number;
  variantes?: Record<string, string>;
}

const perfilVazio: PerfilClienteLoja = {
  nome: "",
  telefone: "",
  email: "",
  consentimentoMarketing: false,
  consentimentoDados: true
};

const entregaInicial: EntregaCheckout = {
  tipo: "ENTREGA",
  provincia: "",
  municipio: "",
  bairro: "",
  endereco: ""
};

export function PaginaLojaDigitalPublica() {
  const { slug: slugRota = "" } = useParams();
  const slug = resolverSlugLojaPublica(slugRota);
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
  const [buscaAberta, setBuscaAberta] = useState(false);
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
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [direcaoAba, setDirecaoAba] = useState<"esquerda" | "direita">("direita");
  const touchAbaRef = useRef<{ x: number; t: number } | null>(null);

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
        document.title = corpo.seo?.titulo ?? `${corpo.loja.nomeComercial} | Loja`;
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
  const corPrimaria = dados?.perfil?.corAcento || dados?.loja.corPrimaria || "#16A07A";
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

  function rolarParaGrelhaProdutos() {
    window.requestAnimationFrame(() => {
      document.getElementById("loja-produtos")?.scrollIntoView({
        behavior: reduzirMovimento ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  function limparCatalogoAtivo() {
    setCatalogoAtivo(null);
    rolarParaGrelhaProdutos();
    registrarEvento("CATALOGO_VISTO", {
      metadata: { acao: "limpar_catalogo" }
    });
  }

  function selecionarCatalogoAtivo(filtro: CatalogoFiltroAtivo) {
    setBusca("");
    setCatalogoAtivo((atual) => atual?.id === filtro.id ? null : filtro);
    setAbaAtiva(0);
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
      <main className="loja-publica-v2 grid min-h-[100dvh] place-items-center bg-[#fafaf8]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-16 animate-pulse">
            <div className="absolute inset-0 rounded-2xl opacity-10" style={{ backgroundColor: corPrimaria }} />
            <div className="grid size-full place-items-center rounded-2xl">
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
      <main className="loja-publica-v2 grid min-h-[100dvh] place-items-center bg-[#fafaf8] px-4">
        <section className="w-full max-w-sm text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-neutral-100">
            <Store size={32} className="text-neutral-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-900">Loja indisponível</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">{erro || "Esta loja ainda não está publicada."}</p>
          <Button asChild className="mt-8 h-12 w-full rounded-2xl text-sm font-medium">
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

  function mudarAba(indice: number) {
    if (indice === abaAtiva || indice < 0 || indice >= ABAS_LOJA.length) return;
    setDirecaoAba(indice > abaAtiva ? "direita" : "esquerda");
    setAbaAtiva(indice);
    registrarEvento("CATALOGO_VISTO", { metadata: { acao: "mudar_aba", aba: ABAS_LOJA[indice].id } });
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
    if (dx < 0 && abaAtiva < ABAS_LOJA.length - 1) mudarAba(abaAtiva + 1);
    if (dx > 0 && abaAtiva > 0) mudarAba(abaAtiva - 1);
  }

  return (
    <main
      className="loja-publica-v2 loja-stitch lp-body-pad min-h-[100dvh] bg-white text-neutral-900"
      style={{ "--loja-accent": corPrimaria } as React.CSSProperties}
    >
      {/* ── Header — presença de loja, sem perder leveza ── */}
      <header className="loja-market-topbar sticky top-0 z-40 border-b border-neutral-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:h-16 sm:px-10">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
            }}
            className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:border-neutral-300"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="loja-topbar-title min-w-0 text-center">
            <p className="text-base font-extrabold tracking-tight text-neutral-950 sm:text-lg">Loja</p>
            <p className="mx-auto mt-0.5 max-w-[11rem] truncate text-[0.68rem] font-medium text-neutral-400 sm:max-w-xs">
              {dados.loja.nomeComercial}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBuscaAberta(!buscaAberta)}
              className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-950"
              aria-label="Pesquisar"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                registrarEvento("CATALOGO_VISTO", { metadata: { acao: "partilhar_loja" } });
                void navigator.share?.({ title: dados.loja.nomeComercial, url: window.location.href })
                  .catch(() => { void navigator.clipboard.writeText(window.location.href); });
              }}
              className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-950"
              aria-label="Partilhar"
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              className="relative grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-950"
              aria-label="Sacola"
              onClick={() => {
                if (historicoEncomendas.length > 0) mudarAba(1);
              }}
            >
              <ShoppingBag size={18} />
              {historicoEncomendas.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">{Math.min(historicoEncomendas.length, 9)}</span>
              )}
            </button>
          </div>
        </div>

        {buscaAberta && (
          <div className="border-t border-neutral-100 bg-white px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-[1280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                <Input
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); registrarEvento("CATALOGO_VISTO", { metadata: { acao: "pesquisa" } }); }}
                  placeholder="Pesquisar produtos..."
                  className="h-11 rounded-full border border-neutral-200 bg-neutral-50 pl-9 pr-9 text-sm placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-300"
                  autoFocus
                />
                {busca && (
                  <button type="button" onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-label="Limpar">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <PerfilLojaSocial
        colecoes={colecoesPerfil}
        corPrimaria={corPrimaria}
        localizacao={localizacao}
        loja={dados.loja}
        market={dados.market}
        perfil={dados.perfil}
        totalProdutos={totalProdutos}
        onContacto={() => {
          registrarEvento("CATALOGO_VISTO", { metadata: { acao: "contactar_loja" }, canal: "whatsapp" });
          const telefone = dados.loja.whatsapp?.replace(/\D/g, "");
          if (telefone) window.open(`https://wa.me/${telefone}`, "_blank", "noopener,noreferrer");
        }}
        onSelecionarColecao={selecionarCatalogoPublico}
      />

      {/* ── Barra de abas ── */}
      <BarraAbas abaAtiva={abaAtiva} corPrimaria={corPrimaria} onChange={mudarAba} />

      {/* ── Conteúdo das abas ── */}
      <div
        className="min-h-[60dvh]"
        onTouchStart={onTouchStartAba}
        onTouchEnd={onTouchEndAba}
      >
        <div key={abaAtiva} className="animate-in fade-in duration-200">

          {/* ── ABA 0: Loja ── */}
          {abaAtiva === 0 && (
            <div id="loja-produtos" className="scroll-mt-32 mx-auto max-w-[1280px] px-4 pb-20 pt-5 sm:px-10 sm:pt-7">
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
                  </span>
                  <button type="button" className="loja-catalogo-limpar border" onClick={limparCatalogoAtivo}>
                    Limpar catálogo
                  </button>
                </motion.div>
              )}

              {categorias.length > 0 && (
                <nav className="loja-category-filters mb-6" aria-label="Categorias da loja">
                  <div className="hide-scrollbar loja-category-filters-list -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:-mx-0 sm:gap-2 sm:px-0">
                    {[null, ...categorias].map((cat) => {
                      const ativa = cat ? catalogoAtivo?.criterio === "categoria" && catalogoAtivo.valor === cat : !catalogoAtivo;
                      return (
                        <button
                          key={cat ?? "__todos"}
                          type="button"
                          onClick={() => {
                            if (!cat) {
                              limparCatalogoAtivo();
                              return;
                            }
                            selecionarCatalogoAtivo({
                              id: `categoria-${cat}`,
                              nome: cat,
                              criterio: "categoria",
                              valor: cat,
                              totalProdutos: dados.produtos.filter((produto) => produto.categoria === cat).length,
                              origem: "categoria"
                            });
                          }}
                          className={`loja-category-filter shrink-0 border px-4 py-1.5 text-xs font-medium uppercase transition-colors ${ativa ? "is-active" : ""}`}
                        >
                          {cat ?? "Todos"}
                        </button>
                      );
                    })}
                  </div>
                </nav>
              )}

              {produtosFiltrados.length > 0 ? (
                <div className="loja-product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {produtosFiltrados.map((produto) => (
                    <CartaoProduto
                      key={produto.codigo}
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

          {/* ── ABA 1: Destaques ── */}
          {abaAtiva === 1 && (
            <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-5 sm:px-10 sm:pt-7">
              {produtosPromocao.length > 0 && (
                <section className="mb-8">
                  <BannerPromocional produtos={produtosPromocao} corPrimaria={corPrimaria} onVerProduto={abrirProduto} />
                </section>
              )}

              <SeloCupomLoja cupom={experienciaLoja?.cupomDestaque} corPrimaria={corPrimaria} />

              <div className="mb-8 space-y-6">
                {catalogosEditaveis && <CatalogosPorBlocos catalogos={catalogos} corPrimaria={corPrimaria} onSelecionar={selecionarCatalogo} />}
                <TopProdutosLoja produtos={topProdutos} corPrimaria={corPrimaria} favoritos={favoritos} onComprar={(p) => abrirCheckout(p, 1, criarSelecoesIniciaisProduto(p))} onFavorito={alternarFavorito} onVerProduto={abrirProduto} />
              </div>

              {secoesVitrine.length > 0 && (
                <VitrineOrganizada secoes={secoesVitrine} corPrimaria={corPrimaria} favoritos={favoritos} onVerProduto={abrirProduto} onComprar={(p) => abrirCheckout(p, 1, criarSelecoesIniciaisProduto(p))} onFavorito={alternarFavorito} />
              )}

              <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_.9fr]">
                <ProdutosVistosRecentemente produtos={produtosVistosRecentemente} corPrimaria={corPrimaria} favoritos={favoritos} onComprar={(p) => abrirCheckout(p, 1, criarSelecoesIniciaisProduto(p))} onFavorito={alternarFavorito} onVerProduto={abrirProduto} />
                <HistoricoEncomendasCliente historico={historicoEncomendas} />
              </div>

              {produtosPromocao.length === 0 && topProdutos.length === 0 && secoesVitrine.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-sm text-neutral-400">Sem destaques por agora.</p>
                </div>
              )}
            </div>
          )}

          {/* ── ABA 2: Sobre ── */}
          {abaAtiva === 2 && (
            <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-5 sm:px-10 sm:pt-7">
              <SecaoSobreLoja loja={dados.loja} localizacao={localizacao} corPrimaria={corPrimaria} paleta={paletaLoja} />
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-neutral-100 bg-neutral-50/70">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm">
            <span className="grid size-7 place-items-center rounded-full bg-neutral-950 text-white">
              <LogoBizy variante="icone" style={{ width: 15, height: 15 }} />
            </span>
            <span>Loja criada com Bizy</span>
          </div>
          <Link
            to="/"
            className="text-xs font-semibold text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-600"
          >
            Ver planos
          </Link>
        </div>
      </footer>

      <Sheet open={!!produtoAberto} onOpenChange={(aberto) => { if (!aberto) setProdutoAberto(null); }}>
        <SheetContent
          side="bottom"
          className="loja-modal-responsivo h-[96dvh] overflow-hidden rounded-t-[1.75rem] border-0 p-0 data-[side=bottom]:!border-0 sm:mx-auto sm:h-[90dvh] sm:max-w-5xl sm:rounded-t-[2rem] lg:h-[88dvh]"
          showCloseButton={false}
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
              modoNegocio={modoNegocio}
              selecoesVariantes={selecoesVariantes}
              setFotoAtiva={setFotoAtiva}
              setQuantidade={setQuantidade}
              onSelecionarVariante={(nome, valor) => setSelecoesVariantes((atual) => ({ ...atual, [nome]: valor }))}
              onFavorito={() => alternarFavorito(produtoAberto)}
              onComprar={() => abrirCheckout(produtoAberto, quantidade, selecoesVariantes)}
              onFechar={() => setProdutoAberto(null)}
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
                <SheetTitle>Checkout assistido</SheetTitle>
                <SheetDescription>Produto, dados e entrega preparados antes de abrir o WhatsApp.</SheetDescription>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutAberto(false)}
                className="grid size-10 place-items-center rounded-xl text-neutral-500 hover:bg-neutral-100"
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
          className="loja-modal-responsivo h-[96dvh] overflow-hidden rounded-t-[1.75rem] border-0 p-0 data-[side=bottom]:!border-0 sm:mx-auto sm:h-[90dvh] sm:max-w-lg sm:rounded-t-[2rem]"
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
              whatsappUrl={pedidoConfirmado.whatsappUrl}
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

      {/* ── Bottom Navigation (mobile only) ── */}
      <NativeBottomNav
        activeIndex={abaAtiva === 1 ? 2 : abaAtiva === 2 ? 4 : 0}
        activePillId="loja-mobile-nav"
        className="lp-nav"
        label="Navegação da loja"
        items={[
          { id: "loja", label: "Loja", icon: Home, onClick: () => mudarAba(0) },
          {
            id: "explorar",
            label: "Explorar",
            icon: Compass,
            onClick: () => {
              setCatalogoAtivo(null);
              mudarAba(0);
              setBuscaAberta(false);
            },
          },
          {
            id: "comprar",
            label: "Comprar",
            icon: ShoppingBag,
            ariaLabel: "Ver destaques da loja",
            onClick: () => mudarAba(1),
            variant: "primary",
          },
          {
            id: "favoritos",
            label: "Favoritos",
            icon: Heart,
            badgeCount: favoritos.size,
            iconClassName: favoritos.size > 0 ? "fill-current" : undefined,
            onClick: () => {
              const favList = dados.produtos.filter((p) => favoritos.has(p.codigo));
              if (favList.length > 0) {
                setBusca("");
                setCatalogoAtivo(null);
                mudarAba(0);
              }
            },
          },
          { id: "perfil", label: "Perfil", icon: User, onClick: () => mudarAba(2) },
        ]}
      />

      {erro && dados && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 sm:bottom-6">
          <div className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-5 py-3 text-sm text-white shadow-lg">
            <span className="max-w-xs">{erro}</span>
            <button type="button" onClick={() => setErro("")} className="shrink-0 text-neutral-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const ABAS_LOJA = [
  { id: "loja", rotulo: "Loja" },
  { id: "vitrines", rotulo: "Destaques" },
  { id: "sobre", rotulo: "Sobre" }
] as const;

function PerfilLojaSocial({
  colecoes,
  corPrimaria,
  localizacao,
  loja,
  market,
  onContacto,
  onSelecionarColecao,
  perfil,
  totalProdutos
}: {
  colecoes: ColecaoPerfilLoja[];
  corPrimaria: string;
  localizacao: string;
  loja: LojaPublicaResposta["loja"];
  market?: LojaPublicaResposta["market"];
  onContacto: () => void;
  onSelecionarColecao: (colecao: ColecaoPerfilLoja) => void;
  perfil?: LojaPublicaResposta["perfil"];
  totalProdutos: number;
}) {
  const [seguindo, setSeguindo] = useState(false);
  const capaUrl = resolverUrlMedia(perfil?.capaUrl ?? loja.capaUrl);
  const avatarUrl = resolverUrlMedia(perfil?.avatarUrl ?? loja.logoUrl);
  const bio = perfil?.bio ?? loja.descricaoPublica;
  const totalColecoes = perfil?.contadores?.colecoes ?? colecoes.length;
  const marketUrl = market?.url || ROTAS_LOJAS.market;
  const mostrarContacto = perfil?.acoes?.contactoDisponivel !== false && Boolean(loja.whatsapp);
  const selos = perfil?.selos ?? [];

  return (
    <motion.section
      className="loja-profile-shell"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="loja-profile-cover">
        {capaUrl ? (
          <img src={capaUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="loja-profile-cover-fallback" style={{ background: `linear-gradient(135deg, ${corPrimaria}, color-mix(in srgb, ${corPrimaria} 14%, white))` }} />
        )}
      </div>

      <div className="loja-profile-content">
        <div className="loja-profile-row">
          <span className="loja-profile-avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <Store size={28} />}
          </span>

          <div className="loja-profile-actions">
            {perfil?.acoes?.seguirDisponivel !== false && (
              <button
                type="button"
                className={`loja-profile-action follow ${seguindo ? "is-following" : ""}`}
                onClick={() => setSeguindo((atual) => !atual)}
                aria-pressed={seguindo}
              >
                {seguindo ? "A seguir" : "Seguir"}
              </button>
            )}
            {mostrarContacto && (
              <button type="button" className="loja-profile-action chat" onClick={onContacto} aria-label="Contactar loja">
                <MessageCircle size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="loja-profile-main">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1>{perfil?.nomeComercial ?? loja.nomeComercial}</h1>
              {selos.slice(0, 2).map((selo) => (
                <span key={selo.id} className="loja-profile-seal">
                  <ShieldCheck size={13} />
                  {selo.label}
                </span>
              ))}
            </div>
            {localizacao && (
              <p className="loja-profile-location">
                <MapPin size={14} />
                {localizacao}
              </p>
            )}
          </div>
        </div>

        {bio && <p className="loja-profile-bio">{bio}</p>}

        <div className="loja-profile-stats" aria-label="Resumo da loja">
          <span>
            <strong>{formatarNumeroCurto(totalProdutos)}</strong>
            <small>Produtos</small>
          </span>
          {totalColecoes > 0 && (
            <span>
              <strong>{formatarNumeroCurto(totalColecoes)}</strong>
              <small>Catálogos</small>
            </span>
          )}
          {loja.segmento && (
            <span>
              <strong>{loja.segmento}</strong>
              <small>Segmento</small>
            </span>
          )}
        </div>

        {colecoes.length > 0 && (
          <div className="loja-profile-catalogos" aria-label="Catálogos da loja">
            {colecoes.slice(0, 8).map((colecao) => (
              <button
                key={colecao.id}
                type="button"
                className={`loja-profile-catalogo-chip border ${colecao.ativa ? "is-active" : ""}`}
                aria-pressed={colecao.ativa}
                onClick={() => onSelecionarColecao(colecao)}
              >
                {colecao.imagem && <img src={resolverUrlMedia(colecao.imagem)} alt="" />}
                <span>{colecao.nome}</span>
                <small>{colecao.totalProdutos}</small>
              </button>
            ))}
          </div>
        )}

        {market?.disponivel !== false && (
          <Link to={marketUrl} className="loja-profile-market-link">
            <Store size={15} />
            <span>{market?.label || "Ver similares no Bizy Market"}</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </motion.section>
  );
}

function BarraAbas({
  abaAtiva,
  corPrimaria,
  onChange
}: {
  abaAtiva: number;
  corPrimaria: string;
  onChange: (indice: number) => void;
}) {
  return (
    <nav className="loja-stitch-tabs sticky top-14 z-30 bg-white/95 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:top-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-10">
        <div className="inline-flex w-full rounded-full border border-neutral-200 bg-neutral-100 p-1 shadow-sm sm:w-auto">
          {ABAS_LOJA.map((aba, i) => {
            const ativa = i === abaAtiva;
            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => onChange(i)}
                className={`min-h-10 flex-1 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.08em] transition-all sm:min-w-28 sm:flex-none sm:text-[0.8rem] ${
                  ativa ? "bg-neutral-950 text-white shadow-sm" : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                }`}
                style={ativa ? { boxShadow: `0 10px 24px ${corPrimaria}20` } : undefined}
              >
                {aba.rotulo}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function VitrineOrganizada({
  corPrimaria,
  favoritos,
  onComprar,
  onFavorito,
  onVerProduto,
  secoes
}: {
  corPrimaria: string;
  favoritos: Set<string>;
  onComprar: (produto: ProdutoPublico) => void;
  onFavorito: (produto: ProdutoPublico) => void;
  onVerProduto: (produto: ProdutoPublico) => void;
  secoes: SecaoVitrine[];
}) {
  return (
    <div className="space-y-10">
      {secoes.map((secao) => (
        <section key={secao.id}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-neutral-400">{secao.titulo}</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-neutral-950">{secao.detalhe}</h2>
            </div>
          </div>
          <div className="hide-scrollbar -mx-5 flex gap-px overflow-x-auto bg-neutral-100 px-5 pb-1 sm:-mx-0 sm:px-0">
            {secao.produtos.slice(0, 10).map((produto) => (
              <div key={`${secao.id}-${produto.codigo}`} className="w-40 shrink-0 sm:w-48">
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
      ))}
    </div>
  );
}

function BannerPromocional({
  produtos,
  corPrimaria,
  onVerProduto
}: {
  produtos: ProdutoPublico[];
  corPrimaria: string;
  onVerProduto: (produto: ProdutoPublico) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollar(direcao: "esquerda" | "direita") {
    if (!scrollRef.current) return;
    const largura = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: direcao === "esquerda" ? -largura : largura, behavior: "smooth" });
  }

  return (
    <div className="bg-neutral-950 text-white">
      <div className="flex items-center justify-between px-5 pb-1 pt-5 sm:px-6">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white/40">Promoções</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">Escolhas com preço especial</h3>
        </div>
        <div className="flex gap-px">
          <button type="button" onClick={() => scrollar("esquerda")} className="grid size-8 place-items-center bg-white/8 text-white transition-colors hover:bg-white/15">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => scrollar("direita")} className="grid size-8 place-items-center bg-white/8 text-white transition-colors hover:bg-white/15">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="hide-scrollbar flex gap-px overflow-x-auto px-5 py-4 sm:px-6">
        {produtos.map((produto) => {
          const desconto = produto.precoPromocionalEmKwanza
            ? Math.round(((produto.precoEmKwanza - produto.precoPromocionalEmKwanza) / produto.precoEmKwanza) * 100)
            : 0;

          return (
            <button key={produto.codigo} type="button" onClick={() => onVerProduto(produto)} className="group shrink-0 text-left">
              <div className="relative w-40 overflow-hidden bg-white/5 sm:w-52">
                <div className="aspect-[3/4] overflow-hidden">
                  {produto.fotos[0] ? (
                    <img src={resolverUrlMedia(produto.fotos[0])} alt={produto.nome} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <Package className="text-white/20" size={32} />
                    </div>
                  )}
                </div>
                {desconto > 0 && (
                  <span className="absolute left-0 top-3 bg-neutral-900 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-white">
                    -{desconto}%
                  </span>
                )}
              </div>
              <div className="mt-2.5 w-40 sm:w-52">
                <p className="truncate text-xs font-normal text-white/80">{produto.nome}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-semibold">{formatarKwanza(precoProduto(produto))}</span>
                  {produto.precoPromocionalEmKwanza && (
                    <span className="text-[0.65rem] text-white/30 line-through">{formatarKwanza(produto.precoEmKwanza)}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CatalogosPorBlocos({
  catalogos,
  onSelecionar
}: {
  catalogos: CatalogoBloco[];
  corPrimaria: string;
  onSelecionar: (catalogo: CatalogoBloco) => void;
}) {
  if (!catalogos.length) return null;

  return (
    <nav>
      <p className="mb-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-neutral-400">Explorar por catálogos</p>
      <div className="hide-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:-mx-0 sm:flex-wrap sm:gap-2 sm:px-0">
        {catalogos.slice(0, 10).map((catalogo) => (
          <button
            key={catalogo.id}
            type="button"
            onClick={() => onSelecionar(catalogo)}
            className="shrink-0 border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium tracking-wide uppercase text-neutral-500 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            {catalogo.nome}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SeloCupomLoja({ corPrimaria, cupom }: { corPrimaria: string; cupom?: string | null }) {
  const cupomLimpo = cupom?.trim();
  if (!cupomLimpo) return null;

  return (
    <section className="mb-6 rounded-3xl bg-neutral-950 p-4 text-white sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10" style={{ color: corPrimaria }}>
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
        <div className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-center text-neutral-950 shadow-sm">
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
      className="group flex h-11 w-full items-center justify-between rounded-none bg-neutral-950 pl-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
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
      titulo: "Checkout guiado",
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
    <section className="mt-10 rounded-3xl bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Sinais de confiança</p>
          <h2 className="mt-1 text-base font-semibold text-neutral-950">Compra clara antes de falar com {loja.nomeComercial}</h2>
        </div>
        <Badge variant="outline" className="rounded-lg">Sem surpresas</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {sinais.map((sinal) => (
          <div key={sinal.titulo} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <span className="text-neutral-500">{sinal.icon}</span>
            <strong className="mt-3 block text-sm text-neutral-950">{sinal.titulo}</strong>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{sinal.detalhe}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopProdutosLoja({
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
    <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">top produtos</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">Destaques da loja</h2>
          <p className="mt-1 text-sm text-neutral-500">Escolhas com boa procura para comprar agora.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-neutral-950 text-white">
          <Star size={17} />
        </span>
      </div>

      <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-1 sm:px-1">
        {produtos.slice(0, 6).map((produto, indice) => (
          <article key={`top-${produto.codigo}`} className="w-52 shrink-0 overflow-hidden rounded-[1.35rem] border border-neutral-200 bg-white text-neutral-950 shadow-sm transition-transform hover:-translate-y-0.5 sm:w-60">
            <button type="button" onClick={() => onVerProduto(produto)} className="relative block aspect-[4/5] w-full overflow-hidden bg-neutral-100 text-left">
              {produto.fotos[0] ? (
                <img src={resolverUrlMedia(produto.fotos[0])} alt={produto.nome} className="size-full object-cover transition-transform duration-500 hover:scale-105" />
              ) : (
                <span className="grid size-full place-items-center"><Package className="text-neutral-300" size={30} /></span>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-white shadow-sm">
                #{indice + 1}
              </span>
            </button>
            <div className="space-y-3 p-3">
              <button type="button" onClick={() => onVerProduto(produto)} className="block text-left">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{produto.nome}</h3>
              </button>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm">{formatarKwanza(precoProduto(produto))}</strong>
                <button
                  type="button"
                  onClick={() => onFavorito(produto)}
                  className="grid size-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:text-red-500"
                  aria-label={favoritos.has(produto.codigo) ? "Remover favorito" : "Adicionar favorito"}
                >
                  <Heart size={15} className={favoritos.has(produto.codigo) ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>
              <BotaoComprarLoja onClick={(evento) => { evento.stopPropagation(); onComprar(produto); }}>
                Comprar agora
              </BotaoComprarLoja>
            </div>
          </article>
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
    <section className="rounded-3xl bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
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
    <section className="rounded-3xl bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
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
            <div key={`${pedido.codigo}-${pedido.criadoEm}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
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
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-500">
          As próximas compras ficam guardadas aqui para o cliente voltar ao mesmo produto com menos esforço.
        </div>
      )}
    </section>
  );
}

function PoliticasLoja({
  experiencia,
  loja,
  modoNegocio
}: {
  experiencia?: ExperienciaLojaPublica;
  loja: LojaPublicaResposta["loja"];
  modoNegocio: ModoNegocio;
}) {
  const politicas = {
    moda: [
      { icon: <Ruler size={16} />, titulo: "Tamanhos", detalhe: "Escolha tamanho/cor antes de enviar o pedido." },
      { icon: <ShieldCheck size={16} />, titulo: "Trocas", detalhe: experiencia?.politicaTroca || "Troca combinada com a loja conforme disponibilidade." },
      { icon: <Truck size={16} />, titulo: "Entrega", detalhe: experiencia?.politicaEntrega || "Taxa calculada no checkout antes do WhatsApp." }
    ],
    comida: [
      { icon: <Clock size={16} />, titulo: "Tempo", detalhe: "Pedido enviado com entrega ou retirada escolhida." },
      { icon: <Check size={16} />, titulo: "Disponibilidade", detalhe: "Itens dependem da preparação e stock do dia." },
      { icon: <Truck size={16} />, titulo: "Entrega", detalhe: experiencia?.politicaEntrega || "Morada e referência entram no pedido." }
    ],
    servicos: [
      { icon: <Clock size={16} />, titulo: "Agenda", detalhe: "Pedido vira conversa para combinar horário." },
      { icon: <ShieldCheck size={16} />, titulo: "Orçamento", detalhe: experiencia?.politicaTroca || "Detalhes são enviados para atendimento confirmar." },
      { icon: <MessageCircle size={16} />, titulo: "Contacto", detalhe: "WhatsApp recebe contexto completo do cliente." }
    ],
    geral: [
      { icon: <Truck size={16} />, titulo: "Entrega", detalhe: experiencia?.politicaEntrega || "Entrega, retirada ou orçamento no checkout." },
      { icon: <ShieldCheck size={16} />, titulo: "Confiança", detalhe: experiencia?.politicaPrivacidade || "Dados do pedido seguem organizados para a loja." },
      { icon: <MessageCircle size={16} />, titulo: "WhatsApp", detalhe: "Compra finalizada com atendimento humano." }
    ]
  } satisfies Record<ModoNegocio, Array<{ icon: React.ReactNode; titulo: string; detalhe: string }>>;

  return (
    <section className="mt-10 rounded-3xl bg-white p-4 ring-1 ring-neutral-100 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">políticas da loja</p>
          <h2 className="mt-1 text-base font-semibold text-neutral-950">Antes de comprar em {loja.nomeComercial}</h2>
        </div>
        <Badge variant="outline" className="rounded-lg capitalize">{modoNegocio}</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {politicas[modoNegocio].map((politica) => (
          <div key={politica.titulo} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <span className="text-neutral-500">{politica.icon}</span>
            <strong className="mt-3 block text-sm text-neutral-950">{politica.titulo}</strong>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{politica.detalhe}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TabelaMedidas({ experiencia, modoNegocio, produto }: { experiencia?: ExperienciaLojaPublica; modoNegocio: ModoNegocio; produto: ProdutoPublico }) {
  const entradaTamanho = Object.entries(produto.variantes ?? {}).find(([nome]) =>
    ["tamanho", "tam", "size", "numero", "número"].some((termo) => nome.toLowerCase().includes(termo))
  );
  const opcoes = entradaTamanho?.[1] ?? [];
  const tabelaConfigurada = experiencia?.tabelaMedidas?.filter((linha) => linha.tamanho) ?? [];
  if (modoNegocio !== "moda" && !opcoes.length && !tabelaConfigurada.length) return null;

  const tamanhos = opcoes.length ? opcoes : ["P", "M", "G", "GG"];
  const linhas = tabelaConfigurada.length
    ? tabelaConfigurada
    : tamanhos.slice(0, 6).map((tamanho) => ({
        tamanho,
        busto: null,
        cintura: null,
        quadril: null,
        observacao: "Enviar para confirmação"
      }));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <Ruler className="mt-0.5 text-neutral-500" size={17} />
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Tabela de medidas</h4>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Confirme o tamanho antes de enviar o pedido; a seleção segue no WhatsApp.</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Opção</th>
              <th className="px-3 py-2 font-semibold">Busto</th>
              <th className="px-3 py-2 font-semibold">Cintura</th>
              <th className="px-3 py-2 font-semibold">Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {linhas.slice(0, 8).map((linha) => (
              <tr key={linha.tamanho}>
                <td className="px-3 py-2 font-semibold text-neutral-950">{linha.tamanho}</td>
                <td className="px-3 py-2 text-neutral-600">{linha.busto || "-"}</td>
                <td className="px-3 py-2 text-neutral-600">{linha.cintura || linha.quadril || "-"}</td>
                <td className="px-3 py-2 text-neutral-500">{linha.observacao || "Enviar para confirmação"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

  return (
    <article
      className={`loja-produto-card group flex h-full cursor-pointer flex-col bg-white ${compacto ? "is-compact" : ""}`}
      onClick={onVerDetalhes}
      onKeyDown={(e) => { if (e.key === "Enter") onVerDetalhes(); }}
      tabIndex={0}
      role="button"
    >
      <div className="loja-produto-card-media relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-50">
        {produto.fotos[0] ? (
          <img src={resolverUrlMedia(produto.fotos[0])} alt={produto.nome} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="grid size-full place-items-center bg-neutral-50">
            <Package className="text-neutral-200" size={32} />
          </div>
        )}

        {semStock && <span className="lp-tag esgotado">Esgotado</span>}
        {!semStock && temPromocao && <span className="lp-tag promo">-{desconto}%</span>}
        {!semStock && !temPromocao && ehNovidade && <span className="lp-tag novo">Novo</span>}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFavorito(); }}
          className={`lp-fav ${favorito ? "active" : ""}`}
          aria-label={favorito ? "Remover favorito" : "Adicionar favorito"}
        >
          <Heart className={favorito ? "fill-current" : ""} />
        </button>
      </div>

      <div className={`loja-produto-card-info flex flex-1 flex-col ${compacto ? "py-2" : "py-3 sm:py-4"}`}>
        <h3 className="line-clamp-2 text-xs font-normal text-neutral-800 sm:text-sm">{produto.nome}</h3>
        {produto.categoria && <p className="loja-produto-card-category">{produto.categoria}</p>}

        <div className="loja-produto-card-bottom mt-1.5 flex items-center justify-between gap-2">
          <div className="loja-produto-card-price flex items-baseline gap-2">
            <span className="text-xs font-semibold text-neutral-900 tabular-nums sm:text-sm">{formatarKwanza(precoProduto(produto))}</span>
            {temPromocao && <span className="text-[0.65rem] text-neutral-400 line-through">{formatarKwanza(produto.precoEmKwanza)}</span>}
          </div>
          <button
            type="button"
            className="lp-add"
            disabled={semStock}
            onClick={(e) => { e.stopPropagation(); onComprar(); }}
            aria-label={semStock ? "Esgotado" : "Adicionar à sacola"}
          >
            <Plus />
          </button>
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
  modoNegocio,
  selecoesVariantes,
  setFotoAtiva,
  setQuantidade,
  onSelecionarVariante,
  onFavorito,
  onComprar,
  onFechar
}: {
  produto: ProdutoPublico;
  corPrimaria: string;
  favorito: boolean;
  quantidade: number;
  fotoAtiva: number;
  experiencia?: ExperienciaLojaPublica;
  modoNegocio: ModoNegocio;
  selecoesVariantes: Record<string, string>;
  setFotoAtiva: (indice: number) => void;
  setQuantidade: (quantidade: number) => void;
  onSelecionarVariante: (nome: string, valor: string) => void;
  onFavorito: () => void;
  onComprar: () => void;
  onFechar: () => void;
}) {
  const temPromocao = Boolean(produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza);
  const desconto = temPromocao ? Math.round(((produto.precoEmKwanza - produto.precoPromocionalEmKwanza!) / produto.precoEmKwanza) * 100) : 0;
  const semStock = produto.quantidade <= 0 || produto.estadoStock === "ESGOTADO" || produto.disponivel === false;
  const fotos = produto.fotos.length > 0 ? produto.fotos : [null];
  const ehNovidade = produto.vitrine?.selos?.some((s) => /novo|new|novidade/i.test(s));

  return (
    <div className="loja-product-detail flex h-full flex-col">
      {/* ── Top bar: back + heart + share ── */}
      <div className="loja-product-detail-bar flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onFechar} className="grid size-10 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onFavorito} className="grid size-10 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100">
            <Heart size={18} className={favorito ? "fill-red-500 text-red-500" : ""} />
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.share?.({ title: produto.nome, url: window.location.href }).catch(() => {
                void navigator.clipboard.writeText(window.location.href);
              });
            }}
            className="grid size-10 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Photo gallery ── */}
        <div className="loja-product-hero relative h-72 w-full overflow-hidden bg-neutral-50 sm:h-80 lg:h-96">
          {fotos[fotoAtiva] ? (
            <img src={resolverUrlMedia(fotos[fotoAtiva])} alt={produto.nome} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center">
              <Package className="text-neutral-300" size={56} />
            </div>
          )}

          {fotos.length > 1 && (
            <>
              <button type="button" onClick={() => setFotoAtiva(fotoAtiva > 0 ? fotoAtiva - 1 : fotos.length - 1)} className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => setFotoAtiva(fotoAtiva < fotos.length - 1 ? fotoAtiva + 1 : 0)} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white">
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {temPromocao && <span className="lp-tag promo" style={{ left: 12, top: 12 }}>-{desconto}%</span>}
          {!temPromocao && ehNovidade && <span className="lp-tag novo" style={{ left: 12, top: 12 }}>Novo</span>}
        </div>

        {/* ── Photo thumbnails ── */}
        {fotos.length > 1 && (
          <div className="loja-product-thumbs flex justify-center gap-2 px-5 py-3">
            {fotos.map((foto, indice) => (
              <button
                key={indice}
                type="button"
                onClick={() => setFotoAtiva(indice)}
                className={`size-12 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  indice === fotoAtiva ? "border-neutral-900 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                {foto ? <img src={resolverUrlMedia(foto)} alt="" className="size-full object-cover" /> : <Package size={14} className="mx-auto text-neutral-400" />}
              </button>
            ))}
          </div>
        )}

        <div className="loja-product-info space-y-5 px-5 pb-6 pt-4">
          {/* ── Product info ── */}
          <h2 className="text-xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-2xl">{produto.nome}</h2>

          <div className="flex items-center gap-2">
            <span className="lp-stars">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} />)}
            </span>
            <span className="lp-stars-text">Produto verificado</span>
          </div>

          <div className="loja-product-price-row flex items-baseline gap-3">
            <span className="text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">{formatarKwanza(precoProduto(produto))}</span>
            {temPromocao && <span className="text-base text-neutral-400 line-through">{formatarKwanza(produto.precoEmKwanza)}</span>}
          </div>

          <StatusStock produto={produto} />

          {produto.descricao && (
            <p className="text-sm leading-relaxed text-neutral-600">{produto.descricao}</p>
          )}

          {/* ── Variant selectors ── */}
          <SeletoresVariantes produto={produto} selecoesVariantes={selecoesVariantes} onSelecionar={onSelecionarVariante} corPrimaria={corPrimaria} />

          <TabelaMedidas produto={produto} modoNegocio={modoNegocio} experiencia={experiencia} />

          {!semStock && (
            <QuantidadeSelector quantidade={quantidade} maximo={produto.quantidade} onChange={setQuantidade} />
          )}

          {/* ── Delivery info bar ── */}
          <div className="lp-deliv">
            <Truck />
            <span className="lp-deliv-text">
              {experiencia?.politicaEntrega || "Entrega em 24–48h na sua zona · taxa calculada no checkout"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Sticky footer: total + add + whatsapp ── */}
      <div className="loja-product-sticky-buy border-t border-neutral-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Total</span>
          <span className="text-lg font-bold tabular-nums text-neutral-900">{formatarKwanza(precoProduto(produto) * quantidade)}</span>
        </div>
        <div className="lp-foot-actions">
          <button type="button" className="lp-foot-add" disabled={semStock} onClick={() => onComprar()}>
            <ShoppingBag size={18} />
            {semStock ? "Esgotado" : "Adicionar"}
          </button>
          <button
            type="button"
            className="lp-foot-wa"
            onClick={() => onComprar()}
            aria-label="Comprar por WhatsApp"
          >
            <MessageCircle />
          </button>
        </div>
      </div>
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
              className={`rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${
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
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
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
                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void calcularEntregaCheckout()} disabled={calculandoEntrega}>
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
            <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={passoAnterior} disabled={indiceAtual === 0 || finalizando}>
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
      <DialogContent className="loja-modal-responsivo max-h-[92dvh] overflow-y-auto rounded-3xl p-5 sm:max-w-md sm:p-6">
        <DialogHeader>
          <Badge variant="outline" className="w-fit">Atendimento rápido</Badge>
          <DialogTitle>Quer ajuda desta loja?</DialogTitle>
          <DialogDescription>{motivo}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <CampoCheckout icon={<User size={16} />} label="Nome" value={perfil.nome} onChange={(valor) => setPerfil({ ...perfil, nome: valor })} placeholder="O seu nome" />
          <CampoCheckout icon={<Phone size={16} />} label="WhatsApp" value={perfil.telefone} onChange={(valor) => setPerfil({ ...perfil, telefone: valor })} placeholder="923 000 000" />
          <CampoCheckout icon={<Mail size={16} />} label="Email opcional" value={perfil.email} onChange={(valor) => setPerfil({ ...perfil, email: valor })} placeholder="email@exemplo.com" />
          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
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
          <Button variant="outline" className="w-full rounded-2xl sm:w-auto" onClick={fechar}>Agora não</Button>
          <Button className="w-full rounded-2xl sm:w-auto" onClick={salvar}>Guardar contacto</Button>
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
  whatsappUrl,
  onWhatsApp,
  onContinuar
}: {
  produto: ProdutoPublico;
  quantidade: number;
  variantes: Record<string, string>;
  total: number;
  entrega: EntregaCheckout;
  whatsappUrl: string;
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
          <div className="lp-cf-ring">
            <span className="lp-cf-ring-core">
              <Check />
            </span>
          </div>

          <h2>Pedido confirmado!</h2>
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

function SecaoSobreLoja({
  corPrimaria,
  localizacao,
  loja,
  paleta
}: {
  corPrimaria: string;
  localizacao: string;
  loja: LojaPublicaResposta["loja"];
  paleta: PaletaLojaPublica;
}) {
  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="relative h-48 bg-neutral-950 sm:h-64" style={{ background: `linear-gradient(135deg, ${paleta.primaria}, ${paleta.acento})` }}>
          {loja.capaUrl && <img src={loja.capaUrl} alt="" className="size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-end gap-3">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[1.35rem] border border-white/30 bg-white text-neutral-950 shadow-xl">
              {loja.logoUrl ? <img src={loja.logoUrl} alt="" className="size-full object-cover" /> : <Store size={28} />}
            </div>
            <div className="min-w-0 text-white">
              <Badge className="mb-2 w-fit rounded-full border-white/20 bg-white/15 text-white hover:bg-white/20">Perfil da loja</Badge>
              <h2 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{loja.nomeComercial}</h2>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <p className="max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            {loja.descricaoPublica ?? "Loja pronta para receber pedidos, tirar dúvidas e finalizar compras com atendimento personalizado."}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {localizacao && <InfoSobre icon={<MapPin size={16} />} titulo="Localização" detalhe={localizacao} />}
            {loja.whatsapp && <InfoSobre icon={<Phone size={16} />} titulo="WhatsApp" detalhe={loja.whatsapp} />}
            <InfoSobre icon={<Truck size={16} />} titulo="Entrega" detalhe="Entrega, retirada ou orçamento combinados no checkout." />
          </div>
        </div>
      </div>

      <aside className="rounded-[2rem] border border-neutral-200 bg-neutral-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/70">
          <LogoBizy variante="icone" style={{ width: 16, height: 16 }} />
          Loja criada com Bizy
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">Quer uma loja como esta?</h2>
        <p className="mt-3 text-sm leading-7 text-white/65">
          Organize produtos, pedidos e atendimento num painel simples, com loja pública pronta para vender.
        </p>

        <Link
          to="/"
          className="mt-6 flex h-12 w-full items-center justify-between bg-white pl-5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white/90"
        >
          <span>Ver planos</span>
          <span className="grid h-12 w-12 place-items-center border-l border-neutral-950/10 bg-neutral-100">
            <ArrowRight size={16} />
          </span>
        </Link>

        <div className="mt-6 grid gap-2 text-xs text-white/55">
          <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full w-2/3 rounded-full" style={{ backgroundColor: corPrimaria }} />
          </span>
          <span>Catálogo, checkout e WhatsApp no mesmo fluxo.</span>
        </div>
      </aside>
    </section>
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
    <div className="space-y-4">
      {variantes.map(([nome, opcoes]) => (
        <div key={nome} className="space-y-2">
          <h4 className="text-sm font-semibold capitalize text-neutral-900">{nome}</h4>
          <div className="flex flex-wrap gap-2">
            {opcoes.map((opcao) => {
              const ativo = selecoesVariantes[nome] === opcao;
              return (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => onSelecionar(nome, opcao)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${ativo ? "text-white" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}
                  style={ativo ? { backgroundColor: corPrimaria, borderColor: corPrimaria, color: "#fff" } : undefined}
                >
                  {opcao}
                </button>
              );
            })}
          </div>
        </div>
      ))}
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
      <div className="inline-flex items-center gap-0 rounded-xl ring-1 ring-neutral-200">
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
        <Input value={value} onChange={(evento) => onChange(evento.target.value)} placeholder={placeholder} className="h-12 rounded-2xl border-neutral-200 bg-white pl-10" />
      </span>
    </label>
  );
}

function ResumoProdutoCheckout({ produto, quantidade }: { produto: ProdutoPublico; quantidade: number }) {
  return (
    <article className="flex items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-3">
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-100">
        {produto.fotos[0] ? <img src={resolverUrlMedia(produto.fotos[0])} alt="" className="size-full object-cover" /> : <Package size={22} className="text-neutral-400" />}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="line-clamp-1 text-sm text-neutral-950">{produto.nome}</strong>
        <small className="mt-1 block text-xs text-neutral-500">Qtd. {quantidade} x {formatarKwanza(precoProduto(produto))}</small>
      </span>
      <strong className="text-sm text-neutral-950">{formatarKwanza(precoProduto(produto) * quantidade)}</strong>
    </article>
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
      <div className="rounded-3xl bg-neutral-950 p-4 text-white">
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <span className="text-xs font-semibold text-neutral-500">{titulo}</span>
      <p className="mt-1 text-sm font-medium text-neutral-950">{detalhe}</p>
    </div>
  );
}

function InfoSobre({ detalhe, icon, titulo }: { detalhe: string; icon: React.ReactNode; titulo: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <span className="mt-0.5 text-neutral-500">{icon}</span>
      <span>
        <strong className="block text-sm text-neutral-950">{titulo}</strong>
        <small className="mt-1 block text-xs leading-5 text-neutral-500">{detalhe}</small>
      </span>
    </div>
  );
}

function StatusStock({ produto }: { produto: ProdutoPublico }) {
  const semStock = produto.quantidade <= 0 || produto.estadoStock === "ESGOTADO" || produto.disponivel === false;
  return (
    <div className="loja-stock-status flex items-center gap-2">
      <span className={`size-2 rounded-full ${semStock ? "bg-red-400" : produto.quantidade <= 3 ? "bg-amber-400" : "bg-emerald-400"}`} />
      <span className="text-sm text-neutral-600">
        {semStock ? "Esgotado" : produto.quantidade <= 3 ? `Apenas ${produto.quantidade} em stock` : `${produto.quantidade} disponíveis`}
      </span>
    </div>
  );
}

function criarFiltroDeColecaoPerfil(colecao: ColecaoPerfilLoja): CatalogoFiltroAtivo {
  const tipoNormalizado = colecao.tipo === "categoria" || colecao.tipo === "colecao" ? colecao.tipo : "busca";
  return {
    id: colecao.id,
    nome: colecao.nome,
    criterio: tipoNormalizado,
    valor: colecao.nome,
    totalProdutos: colecao.totalProdutos,
    origem: "perfil"
  };
}

function criarFiltroDeCatalogoBloco(catalogo: CatalogoBloco): CatalogoFiltroAtivo {
  const criterio = catalogo.filtro?.criterio ?? (catalogo.tipo === "personalizado" ? "busca" : catalogo.tipo);
  return {
    id: catalogo.id,
    nome: catalogo.nome,
    criterio,
    valor: catalogo.filtro?.valor || catalogo.nome,
    totalProdutos: catalogo.produtos.length,
    origem: "bloco"
  };
}

function filtrarProdutosPorCatalogo(produtos: ProdutoPublico[], catalogo: CatalogoFiltroAtivo | null): ProdutoPublico[] {
  if (!catalogo || catalogo.criterio === "todos") return produtos;
  const valor = normalizarTextoCatalogo(catalogo.valor || catalogo.nome);
  if (!valor) return produtos;

  return produtos.filter((produto) => {
    if (catalogo.criterio === "categoria") return normalizarTextoCatalogo(produto.categoria) === valor;
    if (catalogo.criterio === "colecao") return normalizarTextoCatalogo(produto.colecao) === valor;
    return [produto.nome, produto.descricao, produto.categoria, produto.colecao, produto.codigo]
      .filter(Boolean)
      .some((campo) => normalizarTextoCatalogo(campo).includes(valor));
  });
}

function normalizarTextoCatalogo(valor?: string | null): string {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function montarVitrinesOrganizadas(dados: LojaPublicaResposta | null): SecaoVitrine[] {
  if (!dados) return [];
  const secoesBase: SecaoVitrine[] = [
    { id: "destaques", titulo: "Destaques", detalhe: "Produtos escolhidos pela loja", produtos: dados.vitrine?.destaques ?? [], icone: "star" },
    { id: "promocoes", titulo: "Promoções", detalhe: "Preços especiais e oportunidades", produtos: dados.vitrine?.promocoes ?? [], icone: "tag" },
    { id: "novidades", titulo: "Novidades", detalhe: "Chegaram agora ao catálogo", produtos: dados.vitrine?.novidades ?? [], icone: "package" },
    { id: "maisVendidos", titulo: "Mais vendidos", detalhe: "Itens que merecem atenção", produtos: dados.vitrine?.maisVendidos ?? [], icone: "star" },
    { id: "kits", titulo: "Kits e conjuntos", detalhe: "Compre combinações prontas", produtos: dados.vitrine?.kits ?? [], icone: "package" },
    { id: "reposicoes", titulo: "Reposições", detalhe: "Produtos que voltaram ao stock", produtos: dados.vitrine?.reposicoes ?? [], icone: "package" }
  ];

  const promocoesDerivadas = dados.produtos.filter((produto) => produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza);
  const secoesProntas = secoesBase
    .map((secao) => ({
      ...secao,
      produtos: secao.produtos.length ? secao.produtos : secao.id === "promocoes" ? promocoesDerivadas : []
    }))
    .filter((secao) => secao.produtos.length > 0);
  const ordemVitrines = dados.loja.experiencia?.ordemVitrines ?? secoesBase.map((secao) => secao.id);
  const indice = new Map(ordemVitrines.map((id, posicao) => [id, posicao]));
  return secoesProntas.sort((a, b) => (indice.get(a.id) ?? 99) - (indice.get(b.id) ?? 99));
}

function montarCatalogosPorBlocos(produtos: ProdutoPublico[], experiencia?: ExperienciaLojaPublica): CatalogoBloco[] {
  const personalizados = montarCatalogosPersonalizados(produtos, experiencia?.catalogosPersonalizados ?? []);
  const colecoes = agruparProdutosPorCampo(produtos, "colecao").map(([nome, itens]) => ({
    id: `colecao-${nome}`,
    nome,
    tipo: "colecao" as const,
    detalhe: montarDetalheCatalogo(itens, "Coleção com"),
    produtos: itens,
    filtro: { criterio: "colecao" as const, valor: nome }
  }));
  const categorias = agruparProdutosPorCampo(produtos, "categoria").map(([nome, itens]) => ({
    id: `categoria-${nome}`,
    nome,
    tipo: "categoria" as const,
    detalhe: montarDetalheCatalogo(itens, "Categoria com"),
    produtos: itens,
    filtro: { criterio: "categoria" as const, valor: nome }
  }));

  const automaticos = [...colecoes, ...categorias]
    .sort((a, b) => b.produtos.length - a.produtos.length || a.nome.localeCompare(b.nome, "pt-AO"))
    .slice(0, 10);

  return [...personalizados, ...automaticos].slice(0, 10);
}

function montarCatalogosPersonalizados(produtos: ProdutoPublico[], catalogos: CatalogoPersonalizadoLoja[]): CatalogoBloco[] {
  return catalogos
    .map((catalogo) => {
      const valor = catalogo.valor?.trim() ?? "";
      const termo = valor.toLowerCase();
      const itens = produtos.filter((produto) => {
        if (catalogo.criterio === "todos") return true;
        if (!termo) return false;
        if (catalogo.criterio === "categoria") return produto.categoria?.toLowerCase() === termo;
        if (catalogo.criterio === "colecao") return produto.colecao?.toLowerCase() === termo;
        return [produto.nome, produto.descricao, produto.categoria, produto.colecao]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termo));
      });
      return {
        id: `personalizado-${catalogo.id}`,
        nome: catalogo.nome,
        tipo: "personalizado" as const,
        detalhe: catalogo.descricao || montarDetalheCatalogo(itens, "Seleção com"),
        produtos: itens,
        filtro: { criterio: catalogo.criterio, valor: catalogo.valor }
      };
    })
    .filter((catalogo) => catalogo.produtos.length > 0);
}

function agruparProdutosPorCampo(produtos: ProdutoPublico[], campo: "categoria" | "colecao"): Array<[string, ProdutoPublico[]]> {
  const grupos = new Map<string, ProdutoPublico[]>();
  for (const produto of produtos) {
    const nome = produto[campo]?.trim();
    if (!nome) continue;
    grupos.set(nome, [...(grupos.get(nome) ?? []), produto]);
  }
  return Array.from(grupos.entries()).filter(([, itens]) => itens.length > 0);
}

function montarDetalheCatalogo(produtos: ProdutoPublico[], prefixo: string): string {
  const amostras = produtos.slice(0, 2).map((produto) => produto.nome).join(", ");
  return `${prefixo} ${produtos.length} ${produtos.length === 1 ? "item" : "itens"}${amostras ? `: ${amostras}` : ""}`;
}

function calcularTopProdutos(produtos: ProdutoPublico[]): ProdutoPublico[] {
  return [...produtos]
    .filter((produto) => produto.disponivel !== false && produto.quantidade > 0)
    .sort((a, b) => pontuarProdutoTop(b) - pontuarProdutoTop(a) || precoProduto(b) - precoProduto(a))
    .slice(0, 8);
}

function pontuarProdutoTop(produto: ProdutoPublico): number {
  const selos = (produto.vitrine?.selos ?? []).join(" ").toLowerCase();
  const temPromocao = produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza;
  return [
    produto.vitrine?.prioridade ?? 0,
    temPromocao ? 24 : 0,
    produto.fotos.length ? 10 : 0,
    produto.colecao ? 7 : 0,
    produto.categoria ? 5 : 0,
    selos.includes("destaque") || selos.includes("mais") ? 18 : 0,
    Math.min(produto.quantidade, 12)
  ].reduce((total, valor) => total + valor, 0);
}

function resolverModoNegocio(loja?: LojaPublicaResposta["loja"], produtos: ProdutoPublico[] = []): ModoNegocio {
  if (loja?.experiencia?.modoNegocio && loja.experiencia.modoNegocio !== "auto") {
    return loja.experiencia.modoNegocio;
  }
  const texto = [
    loja?.segmento,
    loja?.tipo,
    loja?.descricaoPublica,
    ...produtos.slice(0, 12).flatMap((produto) => [produto.categoria, produto.colecao, produto.nome])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(moda|roupa|vestido|calcado|calçado|tenis|ténis|camisa|blusa|saia|look|tamanho)/.test(texto)) return "moda";
  if (/(comida|restaurante|food|bolo|doce|pizza|hamburg|bebida|prato|pastel|catering)/.test(texto)) return "comida";
  if (/(servico|serviço|consulta|agenda|marcacao|marcação|barbearia|salao|salão|aula|sessao|sessão)/.test(texto)) return "servicos";
  return "geral";
}

function resolverPaletaLoja(corPrimaria: string): PaletaLojaPublica {
  const paletas: PaletaLojaPublica[] = [
    { primaria: "#111111", fundo: "#fafaf8", superficie: "#ffffff", texto: "#111111", acento: "#d6b56d" },
    { primaria: "#0f766e", fundo: "#f5fbf8", superficie: "#ffffff", texto: "#10201d", acento: "#f59e0b" },
    { primaria: "#1d4ed8", fundo: "#f6f8ff", superficie: "#ffffff", texto: "#111827", acento: "#06b6d4" },
    { primaria: "#be123c", fundo: "#fff7f8", superficie: "#ffffff", texto: "#1f1115", acento: "#fb7185" },
    { primaria: "#c2410c", fundo: "#fffaf4", superficie: "#ffffff", texto: "#1c130d", acento: "#84cc16" },
    { primaria: "#6d28d9", fundo: "#fbf9ff", superficie: "#ffffff", texto: "#171321", acento: "#14b8a6" }
  ];
  return paletas.find((paleta) => paleta.primaria.toLowerCase() === corPrimaria.toLowerCase()) ?? {
    primaria: corPrimaria,
    fundo: "#fafaf8",
    superficie: "#ffffff",
    texto: "#111111",
    acento: corPrimaria
  };
}

function precoProduto(produto: ProdutoPublico): number {
  return produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza
    ? produto.precoPromocionalEmKwanza
    : produto.precoEmKwanza;
}

function temVariantesProduto(produto: ProdutoPublico): boolean {
  return Object.values(produto.variantes ?? {}).some((opcoes) => opcoes.length > 0);
}

function criarSelecoesIniciaisProduto(produto: ProdutoPublico): Record<string, string> {
  return Object.fromEntries(
    Object.entries(produto.variantes ?? {})
      .filter(([, opcoes]) => opcoes.length > 0)
      .map(([nome, opcoes]) => [nome, opcoes[0]])
  );
}

function montarResumoVariantes(variantes: Record<string, string>): string {
  return Object.entries(variantes).map(([nome, valor]) => `${nome}: ${valor}`).join(", ");
}

function formatarNumeroCurto(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(valor >= 10_000_000 ? 0 : 1)}M`;
  if (valor >= 1_000) return `${(valor / 1_000).toFixed(valor >= 10_000 ? 0 : 1)}k`;
  return String(valor);
}

function montarEntregaPayload(entrega: EntregaCheckout) {
  return {
    tipo: entrega.tipo,
    provincia: entrega.provincia || null,
    municipio: entrega.municipio || null,
    bairro: entrega.bairro || null,
    endereco: entrega.endereco || null
  };
}

function obterTrackingIdLoja(slug: string): string {
  if (typeof window === "undefined") return "trk_server";
  const chave = `bizy_loja_tracking_${slug || "sem_slug"}`;
  const chaveCookie = chave.replace(/[^a-zA-Z0-9_]/g, "_");
  const cookie = document.cookie
    .split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${chaveCookie}=`))
    ?.split("=")[1];
  const existente = window.localStorage.getItem(chave) || cookie;
  if (existente) {
    window.localStorage.setItem(chave, existente);
    return existente;
  }

  const novo = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(chave, novo);
  document.cookie = `${chaveCookie}=${encodeURIComponent(novo)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
  return novo;
}

function carregarPerfilCliente(slug: string): PerfilClienteLoja {
  if (typeof window === "undefined") return perfilVazio;
  try {
    return { ...perfilVazio, ...JSON.parse(window.localStorage.getItem(`bizy_loja_perfil_${slug}`) ?? "{}") };
  } catch {
    return perfilVazio;
  }
}

function guardarPerfilCliente(slug: string, perfil: PerfilClienteLoja): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`bizy_loja_perfil_${slug}`, JSON.stringify(perfil));
}

function carregarFavoritos(slug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(`bizy_loja_favoritos_${slug}`) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function guardarFavoritos(slug: string, favoritos: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`bizy_loja_favoritos_${slug}`, JSON.stringify(Array.from(favoritos)));
}

function guardarProdutoVisto(slug: string, codigo: string): void {
  if (typeof window === "undefined") return;
  const chave = `bizy_loja_produtos_vistos_${slug}`;
  try {
    const atual = JSON.parse(window.localStorage.getItem(chave) ?? "[]") as string[];
    const proximo = [codigo, ...atual.filter((item) => item !== codigo)].slice(0, 12);
    window.localStorage.setItem(chave, JSON.stringify(proximo));
  } catch {
    window.localStorage.setItem(chave, JSON.stringify([codigo]));
  }
}

function carregarProdutosVistos(slug: string, produtos: ProdutoPublico[]): ProdutoPublico[] {
  if (typeof window === "undefined" || !produtos.length) return [];
  try {
    const codigos = JSON.parse(window.localStorage.getItem(`bizy_loja_produtos_vistos_${slug}`) ?? "[]") as string[];
    return codigos
      .map((codigo) => produtos.find((produto) => produto.codigo === codigo))
      .filter((produto): produto is ProdutoPublico => Boolean(produto));
  } catch {
    return [];
  }
}

function carregarHistoricoPedidos(slug: string): PedidoHistoricoLoja[] {
  if (typeof window === "undefined") return [];
  try {
    const historico = JSON.parse(window.localStorage.getItem(`bizy_loja_historico_${slug}`) ?? "[]") as PedidoHistoricoLoja[];
    return historico.filter((pedido) => pedido.codigo && pedido.nome && pedido.criadoEm).slice(0, 20);
  } catch {
    return [];
  }
}

function guardarHistoricoPedido(slug: string, pedido: PedidoHistoricoLoja): void {
  if (typeof window === "undefined") return;
  const chave = `bizy_loja_historico_${slug}`;
  try {
    const atual = JSON.parse(window.localStorage.getItem(chave) ?? "[]") as PedidoHistoricoLoja[];
    window.localStorage.setItem(chave, JSON.stringify([pedido, ...atual].slice(0, 20)));
  } catch {
    window.localStorage.setItem(chave, JSON.stringify([pedido]));
  }
}

function extrairUtmAtual(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  params.forEach((valor, chave) => {
    if (chave.startsWith("utm_") && valor.trim()) utm[chave] = valor;
  });
  return utm;
}

function registrarEventoLoja({
  canal = "site",
  entidadeId,
  entidadeTipo,
  metadata = {},
  produto,
  slug,
  tipo,
  trackingId
}: {
  canal?: string;
  entidadeId?: string;
  entidadeTipo?: string;
  metadata?: Record<string, unknown>;
  produto?: ProdutoPublico | null;
  slug: string;
  tipo: TipoEventoTracking;
  trackingId: string;
}) {
  if (!slug) return;
  registrarEventoTrackingPublico({
    tipo,
    slugLoja: slug,
    codigoProduto: produto?.codigo ?? null,
    entidadeTipo: entidadeTipo ?? (produto ? "PRODUTO" : "LOJA"),
    entidadeId: entidadeId ?? produto?.codigo ?? slug,
    trackingId,
    origem: "loja-web",
    canal,
    utm: extrairUtmAtual(),
    metadata: sanitizarMetadataTracking(metadata)
  }).catch(() => undefined);
}

function sanitizarMetadataTracking(metadata: Record<string, unknown>): Record<string, unknown> {
  const bloqueadas = new Set(["nome", "name", "telefone", "phone", "email", "whatsapp", "endereco", "address"]);
  return Object.fromEntries(Object.entries(metadata).filter(([chave]) => !bloqueadas.has(chave.toLowerCase())));
}
