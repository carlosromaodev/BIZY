import type { RepositorioTarefasOperacionais } from "../dominio/repositorios/contratos.js";
import type { FiltrosTarefasOperacionais, NovaTarefaOperacional } from "../dominio/tipos.js";

export class GestaoTarefasOperacionaisUseCase {
  constructor(private readonly repositorioTarefas: RepositorioTarefasOperacionais) {}

  criarTarefa(dados: NovaTarefaOperacional) {
    return this.repositorioTarefas.criar({
      ...dados,
      prioridade: dados.prioridade ?? "NORMAL",
      contexto: dados.contexto ?? {}
    });
  }

  listarTarefas(negocioId: string, filtros: FiltrosTarefasOperacionais = {}) {
    return this.repositorioTarefas.listar(negocioId, filtros);
  }
}
