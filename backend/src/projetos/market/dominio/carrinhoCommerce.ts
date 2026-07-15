export type EstadoCarrinhoCommerce = "ABERTO" | "CONVERTIDO" | "ABANDONADO" | "EXPIRADO";

export interface ItemCarrinhoCommerce {
  id: string;
  carrinhoId: string;
  negocioId: string;
  slugLoja: string;
  pecaId: string;
  variantePecaId: string | null;
  codigoPeca: string;
  nomeProduto: string;
  nomeFornecedor: string;
  quantidade: number;
  precoUnitarioEmKwanza: number;
  fotoUrl: string | null;
  urlProduto: string | null;
  urlLoja: string | null;
  selecaoVariante: Record<string, string>;
  origem: string;
  atribuicao: Record<string, unknown>;
  chaveItem: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CarrinhoCommerce {
  id: string;
  contaBizyId: string | null;
  estado: EstadoCarrinhoCommerce;
  expiraEm: Date;
  convertidoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
  itens: ItemCarrinhoCommerce[];
}

export interface ItemCarrinhoResolvido extends Omit<ItemCarrinhoCommerce, "id" | "carrinhoId" | "criadoEm" | "atualizadoEm"> {
  stockDisponivel: number;
}

export interface RepositorioCarrinhosCommerce {
  criar(dados: { tokenHash: string | null; contaBizyId: string | null; expiraEm: Date }): Promise<CarrinhoCommerce>;
  buscarPorTokenHash(tokenHash: string, agora: Date): Promise<CarrinhoCommerce | null>;
  buscarAbertoPorConta(contaBizyId: string, agora: Date): Promise<CarrinhoCommerce | null>;
  buscarPorIdEConta(id: string, contaBizyId: string, agora: Date): Promise<CarrinhoCommerce | null>;
  substituirItens(id: string, itens: ItemCarrinhoResolvido[], carrinhoExpiraEm: Date, reservaExpiraEm: Date): Promise<CarrinhoCommerce>;
  associarConta(id: string, contaBizyId: string): Promise<CarrinhoCommerce | null>;
  abandonar(id: string): Promise<void>;
  converter(id: string): Promise<CarrinhoCommerce>;
}

export interface ItemEntradaCarrinhoCommerce {
  slugLoja: string;
  codigoPeca: string;
  varianteSelecionada?: Record<string, string> | null;
  quantidade: number;
  origem?: string;
  atribuicao?: Record<string, unknown>;
}
