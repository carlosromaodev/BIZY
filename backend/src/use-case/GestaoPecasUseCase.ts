import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioPecas } from "../dominio/repositorios/contratos.js";
import type { AtualizarPeca, NovaPeca, Peca } from "../dominio/tipos.js";

export class GestaoPecasUseCase {
  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly eventos: DespachadorEventos
  ) {}

  async cadastrarPeca(dados: NovaPeca) {
    const peca = await this.repositorioPecas.criar(this.normalizarCriacao(dados));
    this.eventos.emitir("STOCK_UPDATED", { peca });
    return peca;
  }

  async listarPecas(negocioId?: string | null) {
    return this.repositorioPecas.listar(negocioId);
  }

  async atualizarPeca(codigo: string, dados: AtualizarPeca, negocioId?: string | null) {
    const codigoNormalizado = this.normalizarCodigo(codigo);
    const pecaAtual = await this.exigirPeca(codigoNormalizado, negocioId);
    const peca = await this.repositorioPecas.atualizar(
      codigoNormalizado,
      this.normalizarAtualizacao(pecaAtual, dados),
      negocioId
    );
    this.eventos.emitir("STOCK_UPDATED", { peca });
    return peca;
  }

  async desativarPeca(codigo: string, negocioId?: string | null) {
    return this.atualizarPeca(codigo, { estado: "ESGOTADA" }, negocioId);
  }

  private normalizarCriacao(dados: NovaPeca): NovaPeca {
    const normalizada = { ...dados, codigo: this.normalizarCodigo(dados.codigo) };

    if (dados.quantidade === 0) {
      return { ...normalizada, estado: "ESGOTADA" };
    }

    return normalizada;
  }

  private normalizarAtualizacao(pecaAtual: Peca, dados: AtualizarPeca): AtualizarPeca {
    const quantidade = dados.quantidade ?? pecaAtual.quantidade;

    if (quantidade === 0) {
      return { ...dados, estado: "ESGOTADA" };
    }

    return dados;
  }

  private async exigirPeca(codigo: string, negocioId?: string | null): Promise<Peca> {
    const peca = await this.repositorioPecas.buscarPorCodigo(this.normalizarCodigo(codigo), negocioId);

    if (!peca) {
      throw new Error(`Peça #${codigo} não encontrada.`);
    }

    return peca;
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }
}
