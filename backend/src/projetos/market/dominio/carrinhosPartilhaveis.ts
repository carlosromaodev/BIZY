export interface CarrinhoPartilhavelPersistido {
  id: string;
  codigo: string;
  criadoPorTipo: string;
  contaBizyId: string | null;
  parceiroId: string | null;
  negocioId: string | null;
  campanhaId: string | null;
  liveId: string | null;
  titulo: string;
  descricao: string | null;
  itensJson: string;
  estado: string;
  expiraEm: Date | null;
  visualizacoes: number;
  importacoes: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DestaqueProdutoLivePersistido {
  id: string;
  liveId: string;
  negocioId: string;
  pecaId: string;
  variantePecaId: string | null;
  hostParceiroId: string | null;
  carrinhoPartilhavelId: string | null;
  estado: string;
  destacadoEm: Date;
  encerradoEm: Date | null;
}

export interface DadosCriacaoCarrinhoPartilhavel {
  codigo: string;
  criadoPorTipo: string;
  contaBizyId: string;
  parceiroId: string | null;
  negocioId: string | null;
  campanhaId: string | null;
  liveId: string | null;
  titulo: string;
  descricao: string | null;
  expiraEm: Date | null;
  itensJson: string;
}

export interface DadosDestaqueProdutoLive {
  liveId: string;
  negocioId: string;
  pecaId: string;
  variantePecaId: string | null;
  hostParceiroId: string | null;
  carrinhoPartilhavelId: string | null;
}

export type ValidacaoDestaqueProdutoLive =
  | "OK"
  | "LIVE_OU_PRODUTO_NAO_ENCONTRADO"
  | "VARIANTE_INVALIDA"
  | "HOST_INVALIDO";

export interface RepositorioCarrinhosPartilhaveis {
  parceiroAtivoDaConta(parceiroId: string, contaBizyId: string): Promise<boolean>;
  criar(dados: DadosCriacaoCarrinhoPartilhavel): Promise<CarrinhoPartilhavelPersistido>;
  listarPorConta(contaBizyId: string): Promise<CarrinhoPartilhavelPersistido[]>;
  buscarPublicoPorCodigo(codigo: string, agora: Date): Promise<CarrinhoPartilhavelPersistido | null>;
  incrementarVisualizacoes(id: string): Promise<void>;
  incrementarImportacoes(id: string): Promise<void>;
  validarDestaque(negocioId: string, dados: Omit<DadosDestaqueProdutoLive, "negocioId">): Promise<ValidacaoDestaqueProdutoLive>;
  encerrarDestaquesAtivos(liveId: string, negocioId: string, encerradoEm: Date): Promise<void>;
  criarDestaque(dados: DadosDestaqueProdutoLive): Promise<DestaqueProdutoLivePersistido>;
  buscarDestaqueAtivo(liveId: string): Promise<DestaqueProdutoLivePersistido | null>;
}
