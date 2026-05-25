import type { RepositorioTarefasOperacionais } from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoTarefaOperacional,
  FiltrosTarefasOperacionais,
  NovaTarefaOperacional
} from "../dominio/tipos.js";

export class GestaoTarefasOperacionaisUseCase {
  constructor(private readonly repositorioTarefas: RepositorioTarefasOperacionais) {}

  criarTarefa(dados: NovaTarefaOperacional) {
    return this.repositorioTarefas.criar({
      ...dados,
      estado: dados.estado ?? "ABERTA",
      prioridade: dados.prioridade ?? "NORMAL",
      origem: dados.origem ?? "manual",
      contexto: dados.contexto ?? {}
    });
  }

  listarTarefas(negocioId: string, filtros: FiltrosTarefasOperacionais = {}) {
    return this.repositorioTarefas.listar(negocioId, filtros);
  }

  async obterTarefa(id: string, negocioId: string) {
    const tarefa = await this.repositorioTarefas.buscarPorId(id, negocioId);
    if (!tarefa) throw new Error(`Tarefa ${id} não encontrada.`);
    return tarefa;
  }

  async atualizarTarefa(id: string, negocioId: string, dados: AtualizacaoTarefaOperacional) {
    const tarefa = await this.repositorioTarefas.atualizar(id, negocioId, dados);
    if (!tarefa) throw new Error(`Tarefa ${id} não encontrada.`);
    return tarefa;
  }
}
