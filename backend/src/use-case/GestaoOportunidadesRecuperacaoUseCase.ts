import type { RepositorioOportunidadesRecuperacao } from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoOportunidadeRecuperacao,
  FiltrosOportunidadesRecuperacao
} from "../dominio/tipos.js";

export class GestaoOportunidadesRecuperacaoUseCase {
  constructor(private readonly oportunidades: RepositorioOportunidadesRecuperacao) {}

  listarOportunidades(negocioId: string, filtros: FiltrosOportunidadesRecuperacao = {}) {
    return this.oportunidades.listar(negocioId, filtros);
  }

  async atualizarOportunidade(id: string, negocioId: string, dados: AtualizacaoOportunidadeRecuperacao) {
    const oportunidade = await this.oportunidades.atualizar(id, negocioId, dados);
    if (!oportunidade) throw new Error(`Oportunidade ${id} não encontrada.`);
    return oportunidade;
  }
}
