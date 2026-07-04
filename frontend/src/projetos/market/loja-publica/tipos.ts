export type TipoEventoTracking = "LOJA_VISITADA" | "PRODUTO_VISTO" | "CATALOGO_VISTO" | "CHECKOUT_INICIADO";
export type PassoCheckout = "variante" | "dados" | "entrega" | "confirmar";
export type TipoEntregaCheckout = "ENTREGA" | "RETIRADA" | "ORCAMENTO";
export type ModoNegocio = "moda" | "comida" | "servicos" | "geral";
export type CriterioCatalogoPersonalizado = "categoria" | "colecao" | "busca" | "todos";

export interface ProdutoPublico {
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

export interface LojaPublicaResposta {
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
    mensagem?: string | null;
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

export interface PerfilClienteLoja {
  nome: string;
  telefone: string;
  email: string;
  consentimentoMarketing: boolean;
  consentimentoDados: boolean;
}

export interface EntregaCheckout {
  tipo: TipoEntregaCheckout;
  provincia: string;
  municipio: string;
  bairro: string;
  endereco: string;
}

export interface ResumoEntregaCheckout {
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

export interface SecaoVitrine {
  id: string;
  titulo: string;
  detalhe: string;
  produtos: ProdutoPublico[];
  icone: "star" | "tag" | "package";
}

export interface LinhaTabelaMedidasLoja {
  tamanho: string;
  busto?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  observacao?: string | null;
}

export interface OperacaoLojaDigital {
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

export interface ExperienciaLojaPublica {
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

export interface CatalogoPersonalizadoLoja {
  id: string;
  nome: string;
  descricao?: string | null;
  criterio: CriterioCatalogoPersonalizado;
  valor?: string | null;
}

export interface CatalogoBloco {
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

export interface CatalogoFiltroAtivo {
  id: string;
  nome: string;
  criterio: CriterioCatalogoPersonalizado;
  valor?: string | null;
  totalProdutos?: number;
  origem: "perfil" | "categoria" | "bloco";
}

export type ColecaoPerfilLoja = NonNullable<LojaPublicaResposta["colecoes"]>[number] & {
  ativa: boolean;
};

export interface PaletaLojaPublica {
  primaria: string;
  fundo: string;
  superficie: string;
  texto: string;
  acento: string;
}

export interface PedidoHistoricoLoja {
  codigo: string;
  nome: string;
  totalEmKwanza: number;
  criadoEm: string;
  quantidade?: number;
  variantes?: Record<string, string>;
}

export type AbaLojaPublica = "home" | "item" | "new" | "promo" | "review";
export type AbaDetalheProduto = "produto" | "comentarios" | "recomendar";

export interface ReviewLojaPublica {
  id: string;
  autor: string;
  data: string;
  comentario: string;
  produtoNome: string;
  produtoImagem?: string | null;
  variante?: string | null;
  destaque?: string | null;
}

export interface VisualProdutoLoja {
  corPrincipal: string;
  cores: string[];
  tamanho?: string | null;
  subtitulo: string;
}
