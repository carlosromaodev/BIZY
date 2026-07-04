export type RegistroJson = Record<string, unknown>;

export type EstadoStockPublico = "DISPONIVEL" | "BAIXO_STOCK" | "ESGOTADO" | "ARQUIVADO" | string;

export type SeloVitrineProduto =
  | "DESTAQUE"
  | "PROMOCAO"
  | "NOVIDADE"
  | "REPOSICAO"
  | "MAIS_VENDIDO"
  | "KIT"
  | "PATROCINADO"
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
  selos: SeloVitrineProduto[];
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
  idempotencyKey?: string | null;
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

export interface PayloadFormularioLeadLojaPublica {
  nome: string;
  telefone: string;
  email?: string | null;
  produtoInteresse?: string | null;
  mensagem?: string | null;
  consentimentoDados: boolean;
  consentimentoMarketing?: boolean;
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
}

export interface RespostaFormularioLeadLojaPublica {
  clienteId: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  tagAutomatica: string;
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

// Fase 2: Lojas no Market

export interface LojaMarket extends FornecedorMarket {
  totalProdutos: number;
  categorias: string[];
}

export interface FiltrosMarketLojas {
  busca?: string | null;
  categoria?: string | null;
  provincia?: string | null;
  limite?: number | null;
}

export interface RespostaMarketLojas {
  lojas: LojaMarket[];
  total: number;
  filtros?: RegistroJson;
}

export interface RespostaLojaMarket {
  loja: LojaMarket;
  produtos: ProdutoMarket[];
  seo?: SeoPublico;
}

// Fase 3: Studio Team

export interface SeguidorLoja {
  id: string;
  identificador: string;
  tipo: string;
  origem: string;
  criadoEm: string;
}

export interface RespostaSeguidoresTeam {
  seguidores: SeguidorLoja[];
  total: number;
}

export type RespostaSeguidoresCrm = RespostaSeguidoresTeam;

export interface MetricasLojaTeam {
  perfil: {
    slug?: string | null;
    publicada: boolean;
    seguidores: number;
    totalProdutos: number;
  };
  market: {
    publicados: number;
    elegiveis: number;
    comPendencias: number;
  };
  tracking: ResumoTrackingLojaPublica;
  vendas: {
    totalPedidos: number;
    pedidosPagos: number;
    receitaTotalEmKwanza: number;
    ticketMedioEmKwanza: number;
  };
}

export type MetricasLojaCrm = MetricasLojaTeam;

export interface PayloadCatalogoLoja {
  nome: string;
  descricao?: string | null;
  criterio?: "categoria" | "colecao" | "busca" | "todos";
  valor?: string | null;
}

export interface RespostaCatalogosTeam {
  catalogos: CatalogoPersonalizadoLoja[];
}

export type RespostaCatalogosCrm = RespostaCatalogosTeam;

// ── Catálogo Público Partilhável ──

export interface CatalogoPublicoResumo {
  id: string;
  nome: string;
  descricao: string | null;
  criterio: string;
  totalProdutos: number;
}

export interface RespostaCatalogoPublico {
  catalogo: CatalogoPublicoResumo;
  loja: LojaPublica;
  produtos: ProdutoLojaPublica[];
  seo: { titulo: string; descricao: string; slug?: string | null };
}

// ── Checkout Unificado Multi-Loja ──

export interface ItemCheckoutUnificado {
  slugLoja: string;
  codigoPeca: string;
  varianteSelecionada?: Record<string, string> | null;
  quantidade: number;
}

export interface PayloadCheckoutUnificado {
  idempotencyKey?: string | null;
  compradorTelefone: string;
  compradorNome?: string | null;
  compradorEmail?: string | null;
  itens: ItemCheckoutUnificado[];
  entrega?: EntregaCheckoutPublico | null;
  metodoPagamento?: string | null;
  comprovativoPagamentoUrl?: string | null;
  enderecoEntrega?: string | null;
  observacao?: string | null;
  origem?: string;
}

export interface PedidoFilhoUnificado {
  id: string;
  compraUnificadaId: string;
  negocioId: string;
  pedidoId: string;
  estado: string;
  estadoPagamento: string;
  estadoEntrega: string;
  subtotalEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PedidoFilhoAcompanhamento {
  id: string;
  compraUnificadaId: string;
  estado: string;
  estadoPagamento: string;
  estadoEntrega: string;
  subtotalEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CompraUnificada {
  id: string;
  numero: number;
  idempotencyKey?: string | null;
  compradorTelefone: string;
  compradorNome: string | null;
  compradorEmail: string | null;
  estado: string;
  estadoPagamento: string;
  subtotalEmKwanza: number;
  descontoEmKwanza: number;
  taxaEntregaTotalEmKwanza: number;
  totalEmKwanza: number;
  metodoPagamento: string | null;
  enderecoEntrega: string | null;
  observacao: string | null;
  origem: string;
  pedidosFilhoIds: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CompraUnificadaAcompanhamento {
  id: string;
  numero: number;
  estado: string;
  estadoPagamento: string;
  subtotalEmKwanza: number;
  descontoEmKwanza: number;
  taxaEntregaTotalEmKwanza: number;
  totalEmKwanza: number;
  metodoPagamento: string | null;
  origem: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface RespostaCheckoutUnificado {
  compra: CompraUnificada;
  pedidosFilho: PedidoFilhoUnificado[];
}

export interface RespostaCompraEstados {
  compra: CompraUnificadaAcompanhamento;
  pedidosFilho: PedidoFilhoAcompanhamento[];
}

// ── Repasses Financeiros ──

export interface RepasseFinanceiroTeam {
  id: string;
  negocioId: string;
  compraUnificadaId: string | null;
  pedidoId: string;
  valorBrutoEmKwanza: number;
  taxaBizyEmKwanza: number;
  comissaoEmKwanza: number;
  descontoEmKwanza: number;
  valorLiquidoEmKwanza: number;
  estado: "PENDENTE" | "CONCILIADO" | "APROVADO" | "PAGO" | "CANCELADO" | "EM_DISPUTA";
  motivo: string | null;
  conciliadoEm: string | null;
  aprovadoEm: string | null;
  pagoEm: string | null;
  referenciaPagamento: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type RepasseFinanceiroCrm = RepasseFinanceiroTeam;
