import { randomUUID } from "node:crypto";
import type {
  CarrinhoPartilhavelPersistido,
  DadosCriacaoCarrinhoPartilhavel,
  DadosDestaqueProdutoLive,
  DestaqueProdutoLivePersistido,
  RepositorioCarrinhosPartilhaveis,
  ValidacaoDestaqueProdutoLive
} from "../../dominio/carrinhosPartilhaveis.js";

export class RepositorioCarrinhosPartilhaveisMemoria implements RepositorioCarrinhosPartilhaveis {
  private readonly carrinhos = new Map<string, CarrinhoPartilhavelPersistido>();
  private readonly destaques = new Map<string, DestaqueProdutoLivePersistido>();

  async parceiroAtivoDaConta(): Promise<boolean> {
    return false;
  }

  async criar(dados: DadosCriacaoCarrinhoPartilhavel): Promise<CarrinhoPartilhavelPersistido> {
    const agora = new Date();
    const carrinho: CarrinhoPartilhavelPersistido = {
      id: randomUUID(),
      ...dados,
      estado: "ATIVO",
      visualizacoes: 0,
      importacoes: 0,
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.carrinhos.set(carrinho.id, carrinho);
    return this.copiarCarrinho(carrinho);
  }

  async listarPorConta(contaBizyId: string): Promise<CarrinhoPartilhavelPersistido[]> {
    return [...this.carrinhos.values()]
      .filter((item) => item.contaBizyId === contaBizyId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .map((item) => this.copiarCarrinho(item));
  }

  async buscarPublicoPorCodigo(codigo: string, agora: Date): Promise<CarrinhoPartilhavelPersistido | null> {
    const normalizado = codigo.toUpperCase();
    const item = [...this.carrinhos.values()].find(
      (carrinho) =>
        carrinho.codigo === normalizado &&
        carrinho.estado === "ATIVO" &&
        (!carrinho.expiraEm || carrinho.expiraEm > agora)
    );
    return item ? this.copiarCarrinho(item) : null;
  }

  async incrementarVisualizacoes(id: string): Promise<void> {
    const item = this.carrinhos.get(id);
    if (item) {
      item.visualizacoes += 1;
      item.atualizadoEm = new Date();
    }
  }

  async incrementarImportacoes(id: string): Promise<void> {
    const item = this.carrinhos.get(id);
    if (item) {
      item.importacoes += 1;
      item.atualizadoEm = new Date();
    }
  }

  async validarDestaque(): Promise<ValidacaoDestaqueProdutoLive> {
    return "LIVE_OU_PRODUTO_NAO_ENCONTRADO";
  }

  async encerrarDestaquesAtivos(liveId: string, negocioId: string, encerradoEm: Date): Promise<void> {
    for (const item of this.destaques.values()) {
      if (item.liveId !== liveId || item.negocioId !== negocioId || item.estado !== "ATIVO") continue;
      item.estado = "ENCERRADO";
      item.encerradoEm = encerradoEm;
    }
  }

  async criarDestaque(dados: DadosDestaqueProdutoLive): Promise<DestaqueProdutoLivePersistido> {
    const item: DestaqueProdutoLivePersistido = {
      id: randomUUID(),
      ...dados,
      estado: "ATIVO",
      destacadoEm: new Date(),
      encerradoEm: null
    };
    this.destaques.set(item.id, item);
    return { ...item };
  }

  async buscarDestaqueAtivo(liveId: string): Promise<DestaqueProdutoLivePersistido | null> {
    const item = [...this.destaques.values()]
      .filter((destaque) => destaque.liveId === liveId && destaque.estado === "ATIVO")
      .sort((a, b) => b.destacadoEm.getTime() - a.destacadoEm.getTime())[0];
    return item ? { ...item } : null;
  }

  private copiarCarrinho(item: CarrinhoPartilhavelPersistido): CarrinhoPartilhavelPersistido {
    return { ...item };
  }
}
