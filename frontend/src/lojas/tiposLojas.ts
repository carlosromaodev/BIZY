export type RegistroJson = Record<string, unknown>;

export type EstadoStockPublico = "DISPONIVEL" | "BAIXO_STOCK" | "ESGOTADO" | "ARQUIVADO" | string;

export type SeloVitrineProduto =
  | "DESTAQUE"
  | "PROMOCAO"
  | "NOVIDADE"
  | "REPOSICAO"
  | "MAIS_VENDIDO"
  | "KIT"
  | string;

export interface SeoPublico {
  titulo: string;
  descricao: string;
  canonicalPath: string;
  imagem?: string | null;
  previewSocial?: RegistroJson;
}

export interface VitrineProdutoPublico extends RegistroJson {
  precoPromocionalEmKwanza?: number | null;
  prioridade?: number;
  publicadoMarket?: boolean;
  selos?: SeloVitrineProduto[];
}

export interface FornecedorMarket {
  slug?: string | null;
  nomeComercial: string;
  descricaoPublica?: string | null;
  segmento?: string | null;
  tipo?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  corPrimaria?: string | null;
  logoUrl?: string | null;
  capaUrl?: string | null;
  whatsapp?: string | null;
  telefone?: string | null;
  email?: string | null;
  entregaAtiva?: boolean | null;
  url?: string | null;
}

export interface ProdutoMarket {
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
  variantes?: Record<string, string[]> | null;
  vitrine?: VitrineProdutoPublico | null;
  estadoStock?: EstadoStockPublico | null;
  disponivel?: boolean;
  urlProduto?: string | null;
  urlLoja?: string | null;
  loja?: FornecedorMarket | null;
}

export interface FornecedorMarketNormalizado {
  slug: string;
  nomeComercial: string;
  descricaoPublica: string;
  localizacao: string;
  segmento: string;
  tipo: string;
  corPrimaria: string;
  logoUrl: string;
  capaUrl: string;
  urlLoja: string;
}

export interface ProdutoMarketNormalizado {
  categoria: string;
  codigo: string;
  colecao: string;
  descricao: string;
  descontoPercentual: number | null;
  disponivel: boolean;
  emPromocao: boolean;
  estadoStock: EstadoStockPublico | null;
  fornecedor: FornecedorMarketNormalizado;
  fotoPrincipal: string;
  fotos: string[];
  nome: string;
  nomeFornecedor: string;
  precoAntigoEmKwanza: number | null;
  precoFinalEmKwanza: number;
  quantidade: number;
  slugLoja: string;
  urlLoja: string;
  urlMarket: string;
  urlProduto: string;
  variantes: Record<string, string[]>;
}

export interface CategoriaMarket {
  categoria: string;
  total: number;
  url?: string;
}

export interface FiltrosMarketProdutos {
  busca?: string | null;
  categoria?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  loja?: string | null;
  precoMinimo?: number | null;
  precoMaximo?: number | null;
  apenasDisponivel?: boolean | null;
  apenasPromocao?: boolean | null;
  limite?: number | null;
}

export interface RespostaMarketCategorias {
  categorias: CategoriaMarket[];
  total: number;
}

export interface RespostaMarketProdutos {
  produtos: ProdutoMarket[];
  total: number;
  filtros?: RegistroJson;
  categorias?: CategoriaMarket[];
}

export interface RespostaProdutoMarket {
  produto: ProdutoMarket;
  similares: ProdutoMarket[];
  seo?: SeoPublico;
}

export interface RespostaSimilaresMarket {
  produtoOrigem: ProdutoMarket;
  produtos: ProdutoMarket[];
  total: number;
  filtros?: RegistroJson;
}

export interface ExperienciaLojaPublica extends RegistroJson {
  modoNegocio?: "auto" | "moda" | "comida" | "servicos" | "geral" | string;
  ordemVitrines?: string[];
  catalogosEditaveis?: boolean;
  leadCaptureAtivo?: boolean;
  cupomDestaque?: string | null;
  politicaTroca?: string | null;
  politicaEntrega?: string | null;
  politicaPrivacidade?: string | null;
  catalogosPersonalizados?: CatalogoPersonalizadoLoja[];
  tabelaMedidas?: RegistroJson[];
}

export interface LojaPublica {
  slug?: string | null;
  nomeComercial: string;
  descricaoPublica?: string | null;
  segmento?: string | null;
  tipo?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  moeda?: string | null;
  corPrimaria?: string | null;
  logoUrl?: string | null;
  capaUrl?: string | null;
  whatsapp?: string | null;
  experiencia?: ExperienciaLojaPublica;
}

export interface ContadoresPerfilLoja {
  seguidores: number;
  seguindo: number;
  produtos: number;
  colecoes: number;
}

export interface AcaoPerfilLoja {
  seguirDisponivel: boolean;
  contactoDisponivel: boolean;
  checkoutDisponivel: boolean;
  urlLoja: string;
  urlMarket: string;
}

export interface SeloPerfilLoja {
  id: string;
  label: string;
  tipo: string;
}

export interface PerfilLojaPublica {
  slug?: string | null;
  nomeComercial: string;
  bio?: string | null;
  segmento?: string | null;
  tipo?: string | null;
  avatarUrl?: string | null;
  capaUrl?: string | null;
  corAcento?: string | null;
  localizacao?: string | null;
  contadores: ContadoresPerfilLoja;
  selos: SeloPerfilLoja[];
  acoes: AcaoPerfilLoja;
}

export interface ColecaoLojaPublica {
  id: string;
  nome: string;
  tipo: "colecao" | "categoria" | string;
  totalProdutos: number;
  imagem?: string | null;
  mensagem?: string | null;
  url: string;
}

export interface ChamadaMarketLoja {
  disponivel: boolean;
  label: string;
  url: string;
  categoriaPrincipal?: string | null;
}

export interface ProdutoLojaPublica extends Omit<ProdutoMarket, "loja" | "urlLoja" | "urlProduto"> {
  disponivel: boolean;
}

export interface VitrineLojaPublica {
  destaques: ProdutoLojaPublica[];
  promocoes: ProdutoLojaPublica[];
  novidades: ProdutoLojaPublica[];
  reposicoes: ProdutoLojaPublica[];
  maisVendidos: ProdutoLojaPublica[];
  kits: ProdutoLojaPublica[];
}

export interface FiltrosLojaPublica {
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
  utm?: Record<string, string | null | undefined>;
  busca?: string | null;
  categoria?: string | null;
  colecao?: string | null;
  estadoStock?: string | null;
  limite?: number | null;
}

export interface TrackingProdutoPublico {
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
  utm?: Record<string, string | null | undefined>;
}

export interface RespostaLojaPublica {
  loja: LojaPublica;
  perfil: PerfilLojaPublica;
  colecoes: ColecaoLojaPublica[];
  market: ChamadaMarketLoja;
  produtos: ProdutoLojaPublica[];
  filtros?: RegistroJson;
  vitrine: VitrineLojaPublica;
  seo?: SeoPublico;
}

export interface RespostaProdutoLojaPublica {
  loja: LojaPublica;
  produto: ProdutoLojaPublica;
  seo?: SeoPublico;
}

export interface CatalogoPersonalizadoLoja {
  id: string;
  nome: string;
  descricao?: string | null;
  criterio: "categoria" | "colecao" | "busca" | "todos" | string;
  valor?: string | null;
}

export interface ConfiguracaoLojaPublica {
  identidade: {
    nomeComercial?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    provincia?: string | null;
    municipio?: string | null;
    endereco?: string | null;
    descricaoPublica?: string | null;
  };
  publicacao: {
    slug?: string | null;
    descricaoPublica?: string | null;
    publicada: boolean;
    publicadaEm?: string | null;
    urlPublica?: string | null;
  };
  tema: {
    corPrimaria?: string | null;
    logoUrl?: string | null;
    capaUrl?: string | null;
  };
  entrega: RegistroJson;
  pagamentos: RegistroJson;
  experiencia: ExperienciaLojaPublica;
}

export interface RespostaConfiguracaoLojaPublica {
  configuracao: ConfiguracaoLojaPublica;
  publicacao: {
    slug?: string | null;
    publicada: boolean;
    urlPublica?: string | null;
  };
  criacao: {
    concluida: boolean;
    criadaEm?: string | null;
    origem?: string | null;
  };
  catalogo: RegistroJson;
  prontidao: {
    prontaParaPublicar: boolean;
    pendencias: string[];
    progresso: number;
  };
}

export type PayloadConfiguracaoLojaPublica = Partial<{
  slug: string;
  descricaoPublica: string | null;
  publicada: boolean;
  criacao: { confirmar?: boolean };
  identidade: Partial<ConfiguracaoLojaPublica["identidade"]>;
  publicacao: Partial<ConfiguracaoLojaPublica["publicacao"]>;
  tema: Partial<ConfiguracaoLojaPublica["tema"]>;
  entrega: RegistroJson;
  pagamentos: RegistroJson;
  experiencia: ExperienciaLojaPublica;
}>;

export interface ResumoTrackingLojaPublica {
  totais?: RegistroJson;
  eventos?: RegistroJson[];
  funil?: RegistroJson;
  [chave: string]: unknown;
}

export type TipoEventoTrackingPublico =
  | "LOJA_VISITADA"
  | "PRODUTO_VISTO"
  | "WHATSAPP_CLICK"
  | "CHECKOUT_INICIADO"
  | "PEDIDO_CRIADO"
  | string;

export interface EventoTrackingPublicoPayload {
  tipo: TipoEventoTrackingPublico;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  slugLoja?: string | null;
  codigoProduto?: string | null;
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
  utm?: Record<string, string>;
  metadata?: RegistroJson;
}

export interface EntregaCheckoutPublico {
  tipo: "ENTREGA" | "RETIRADA" | "ORCAMENTO";
  provincia?: string | null;
  municipio?: string | null;
  bairro?: string | null;
  endereco?: string | null;
}

export interface ItemCheckoutPublico {
  codigoPeca: string;
  quantidade: number;
}

export interface ClienteCheckoutPublico {
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  consentimentoMarketing?: boolean;
  consentimentoDados: boolean;
}

export interface AtribuicaoCheckoutPublico {
  modelo?: "PRIMEIRO_TOQUE" | "ULTIMO_TOQUE" | "CONVERSAO_ASSISTIDA" | "AJUSTE_MANUAL";
  janelaDias?: number;
}

export type ReferenciaAssistidaCheckout =
  | string
  | {
      codigo: string;
      capturadoEm?: string | Date | null;
    };

export interface PayloadCalculoEntregaLojaPublica {
  itens: ItemCheckoutPublico[];
  entrega: EntregaCheckoutPublico;
}

export interface PayloadWhatsAppLojaPublica {
  quantidade?: number;
  variante?: Record<string, string>;
  trackingId?: string | null;
  referencia?: string | null;
  referenciasAssistidas?: ReferenciaAssistidaCheckout[];
  atribuicao?: AtribuicaoCheckoutPublico;
  origem?: string;
  entrega?: EntregaCheckoutPublico;
}

export interface PayloadCheckoutLojaPublica extends PayloadCalculoEntregaLojaPublica {
  cliente: ClienteCheckoutPublico;
  trackingId?: string | null;
  referencia?: string | null;
  referenciasAssistidas?: ReferenciaAssistidaCheckout[];
  atribuicao?: AtribuicaoCheckoutPublico;
  origem?: string;
  canal?: string;
  observacao?: string | null;
  metodoPagamento?: string | null;
  comprovativoPagamentoUrl?: string | null;
}

export type PayloadCheckoutAbandonadoLojaPublica = Omit<PayloadCheckoutLojaPublica, "atribuicao" | "referenciasAssistidas">;

export interface EntregaCalculadaPublica {
  tipo: "ENTREGA" | "RETIRADA" | "ORCAMENTO";
  regra: string;
  taxaEmKwanza: number;
  prazo?: string | null;
  descricao: string;
  endereco?: string | null;
}

export interface ResumoCheckoutLojaPublica {
  itens?: RegistroJson[];
  subtotalEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  entrega: EntregaCalculadaPublica;
  moeda?: string | null;
}

export interface RespostaWhatsAppLojaPublica {
  telefone: string;
  mensagem: string;
  origem: string;
  canal: "whatsapp" | string;
  atribuicao?: RegistroJson | null;
  whatsappUrl: string;
}

export interface RespostaCheckoutLojaPublica extends ResumoCheckoutLojaPublica {
  pedido: {
    id: string;
    numero: string;
    estado: string;
    estadoPagamento: string;
    estadoEntrega: string;
  };
  origem: string;
  canal: string;
  atribuicao?: RegistroJson | null;
  atribuicaoBloqueada?: RegistroJson | null;
}

export interface RespostaCheckoutAbandonadoLojaPublica {
  oportunidade?: RegistroJson;
  cliente?: RegistroJson;
  duplicado: boolean;
}

export interface ItemPublicacaoMarketLoja {
  codigo: string;
  nome: string;
  categoria?: string | null;
  colecao?: string | null;
  publicado: boolean;
  elegivel: boolean;
  pendencias: string[];
  urlProduto?: string | null;
}

export interface ResumoMarketLoja {
  loja: {
    slug?: string | null;
    nomeComercial?: string | null;
    publicada: boolean;
    urlLoja?: string | null;
  };
  produtos: {
    total: number;
    publicados: number;
    elegiveis: number;
    comPendencias: number;
  };
  categorias: CategoriaMarket[];
  itens: ItemPublicacaoMarketLoja[];
}

export interface RespostaPublicacaoProdutoMarket {
  produto: RegistroJson;
  publicacao: {
    publicado: boolean;
    elegivel: boolean;
    pendencias: string[];
  };
}

export interface RespostaPublicacaoProdutosMarketEmMassa {
  totalSolicitado: number;
  atualizados: number;
  falhas: Array<{ codigo: string; erro: string }>;
  resultados: Array<RespostaPublicacaoProdutoMarket | { codigo: string; erro: string }>;
}
