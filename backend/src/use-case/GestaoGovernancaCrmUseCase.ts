import type {
  RepositorioEventosOperacionais,
  RepositorioJobsOperacionais,
  RepositorioMembrosNegocio
} from "../dominio/repositorios/contratos.js";
import { normalizarTelefone } from "../dominio/servicos/normalizarContato.js";
import type {
  AtualizacaoMembroNegocioOperacional,
  FiltrosEventosOperacionais,
  NovoMembroNegocioOperacional,
  NovoEventoOperacional,
  NovoJobOperacional
} from "../dominio/tipos.js";

export class GestaoGovernancaCrmUseCase {
  constructor(
    private readonly membros: RepositorioMembrosNegocio,
    private readonly eventos: RepositorioEventosOperacionais,
    private readonly jobs: RepositorioJobsOperacionais
  ) {}

  listarMembros(negocioId: string) {
    return this.membros.listar(negocioId);
  }

  criarMembro(dados: NovoMembroNegocioOperacional) {
    const telefone = normalizarTelefone(dados.telefone);
    if (!telefone || telefone.local.length < 9 || !telefone.local.startsWith("9")) {
      throw new Error("Telefone angolano inválido para membro do negócio.");
    }

    return this.membros.criar({
      ...dados,
      telefone: telefone.local,
      permissoes: dados.permissoes ?? []
    });
  }

  async atualizarMembro(id: string, negocioId: string, dados: AtualizacaoMembroNegocioOperacional) {
    const membro = await this.membros.atualizar(id, negocioId, dados);
    if (!membro) throw new Error(`Membro ${id} não encontrado.`);
    return membro;
  }

  registrarEvento(dados: NovoEventoOperacional) {
    return this.eventos.registrar(dados);
  }

  listarEventos(negocioId: string, filtros: FiltrosEventosOperacionais = {}) {
    return this.eventos.listar(negocioId, filtros);
  }

  criarJob(dados: NovoJobOperacional) {
    return this.jobs.criar(dados);
  }

  atualizarJob(id: string, negocioId: string, dados: Parameters<RepositorioJobsOperacionais["atualizar"]>[2]) {
    return this.jobs.atualizar(id, negocioId, dados);
  }

  buscarJobPorIdempotencia(negocioId: string, idempotencyKey: string) {
    return this.jobs.buscarPorIdempotencyKey(negocioId, idempotencyKey);
  }
}
