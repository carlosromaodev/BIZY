import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioPecas } from "../dominio/repositorios/contratos.js";
import type {
  AtualizarPeca,
  MovimentoStock,
  NovaPeca,
  Peca,
  ResumoCatalogoComercial,
  TipoMovimentoStock
} from "../dominio/tipos.js";

interface DadosRegistroMovimentoStock {
  tipo: TipoMovimentoStock;
  quantidade: number;
  motivo?: string | null;
  responsavelId?: string | null;
  origem?: string | null;
}

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

  async resumirCatalogo(negocioId?: string | null): Promise<ResumoCatalogoComercial> {
    const pecas = await this.repositorioPecas.listar(negocioId);
    const categorias = new Map<string, number>();
    const colecoes = new Map<string, number>();

    const resumo = pecas.reduce<ResumoCatalogoComercial>(
      (acumulador, peca) => {
        acumulador.total += 1;
        if (!peca.arquivadaEm && peca.quantidade > 0 && peca.estado !== "VENDIDA") acumulador.disponiveis += 1;
        if (peca.estadoStock === "BAIXO_STOCK") acumulador.baixoStock += 1;
        if (peca.estadoStock === "ESGOTADO") acumulador.esgotadas += 1;
        if (peca.estadoStock === "ARQUIVADO") acumulador.arquivadas += 1;

        acumulador.custoTotalEmKwanza += (peca.custoEmKwanza ?? 0) * peca.quantidade;
        acumulador.valorPotencialEmKwanza += peca.precoEmKwanza * peca.quantidade;
        acumulador.margemPotencialEmKwanza += (peca.margemEstimadaEmKwanza ?? 0) * peca.quantidade;

        if (peca.categoria) categorias.set(peca.categoria, (categorias.get(peca.categoria) ?? 0) + 1);
        if (peca.colecao) colecoes.set(peca.colecao, (colecoes.get(peca.colecao) ?? 0) + 1);

        return acumulador;
      },
      {
        total: 0,
        disponiveis: 0,
        baixoStock: 0,
        esgotadas: 0,
        arquivadas: 0,
        custoTotalEmKwanza: 0,
        valorPotencialEmKwanza: 0,
        margemPotencialEmKwanza: 0,
        categorias: [],
        colecoes: []
      }
    );

    return {
      ...resumo,
      categorias: this.mapearAgrupamento(categorias),
      colecoes: this.mapearAgrupamento(colecoes)
    };
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

  async registrarMovimentoStock(codigo: string, dados: DadosRegistroMovimentoStock, negocioId?: string | null) {
    const codigoNormalizado = this.normalizarCodigo(codigo);
    const pecaAtual = await this.exigirPeca(codigoNormalizado, negocioId);
    const quantidadeNova = this.calcularQuantidadeNova(pecaAtual, dados);
    const peca = await this.repositorioPecas.atualizar(
      codigoNormalizado,
      this.normalizarAtualizacao(pecaAtual, { quantidade: quantidadeNova }),
      negocioId
    );
    const movimento = await this.repositorioPecas.registrarMovimentoStock({
      negocioId: peca.negocioId,
      pecaId: peca.id,
      codigoPeca: peca.codigo,
      tipo: dados.tipo,
      quantidade: dados.quantidade,
      quantidadeAnterior: pecaAtual.quantidade,
      quantidadeNova,
      motivo: dados.motivo ?? null,
      responsavelId: dados.responsavelId ?? null,
      origem: dados.origem ?? null
    });

    this.eventos.emitir("STOCK_UPDATED", { peca, movimento });
    return { peca, movimento };
  }

  async listarMovimentosStock(codigo: string, negocioId?: string | null): Promise<MovimentoStock[]> {
    const codigoNormalizado = this.normalizarCodigo(codigo);
    await this.exigirPeca(codigoNormalizado, negocioId);
    return this.repositorioPecas.listarMovimentosStock(codigoNormalizado, negocioId);
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

    if (dados.estado) {
      return dados;
    }

    if (quantidade === 0) {
      return { ...dados, estado: "ESGOTADA" };
    }

    if (pecaAtual.estado === "ESGOTADA" && quantidade > 0) {
      return { ...dados, estado: "DISPONIVEL" };
    }

    return dados;
  }

  private calcularQuantidadeNova(peca: Peca, dados: DadosRegistroMovimentoStock): number {
    const quantidadeNova = (() => {
      if (dados.tipo === "AJUSTE" || dados.tipo === "CORRECAO") {
        return dados.quantidade;
      }

      if (["ENTRADA", "CANCELAMENTO", "DEVOLUCAO"].includes(dados.tipo)) {
        return peca.quantidade + dados.quantidade;
      }

      return peca.quantidade - dados.quantidade;
    })();

    if (quantidadeNova < 0) {
      throw new Error(
        `Stock insuficiente: movimento não pode deixar a peça #${peca.codigo} com quantidade negativa. Disponível: ${peca.quantidade}.`
      );
    }

    return quantidadeNova;
  }

  private mapearAgrupamento(agrupamento: Map<string, number>): Array<{ nome: string; total: number }> {
    return [...agrupamento.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-AO", { numeric: true }));
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
