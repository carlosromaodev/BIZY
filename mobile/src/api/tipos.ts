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
  vitrine?: {
    precoPromocionalEmKwanza?: number | null;
    prioridade?: number;
    publicadoMarket?: boolean;
    selos?: SeloVitrineProduto[];
  } | null;
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
  seo?: { titulo: string; descricao: string; imagem?: string | null };
}

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

export interface ItemCheckoutUnificado {
  slugLoja: string;
  codigoPeca: string;
  varianteSelecionada?: Record<string, string> | null;
  quantidade: number;
}

export interface PayloadCheckoutUnificado {
  compradorTelefone: string;
  compradorNome?: string | null;
  compradorEmail?: string | null;
  itens: ItemCheckoutUnificado[];
  metodoPagamento?: string | null;
  enderecoEntrega?: string | null;
  observacao?: string | null;
  origem?: string;
}

export interface CompraUnificada {
  id: string;
  numero: number;
  compradorTelefone: string;
  compradorNome: string | null;
  estado: string;
  estadoPagamento: string;
  subtotalEmKwanza: number;
  totalEmKwanza: number;
  criadoEm: string;
}

export interface RespostaCheckoutUnificado {
  compra: CompraUnificada;
  pedidosFilho: Array<{
    id: string;
    pedidoId: string;
    estado: string;
    totalEmKwanza: number;
  }>;
}
