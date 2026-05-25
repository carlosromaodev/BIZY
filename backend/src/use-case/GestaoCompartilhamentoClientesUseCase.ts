import type {
  RepositorioClientes,
  RepositorioCompartilhamentoClientes
} from "../dominio/repositorios/contratos.js";
import type {
  EstadoRelacaoNegocio,
  NovaRelacaoNegocio,
  NovoCompartilhamentoCliente,
  TipoRelacaoNegocio
} from "../dominio/tipos.js";

export class GestaoCompartilhamentoClientesUseCase {
  constructor(
    private readonly clientes: RepositorioClientes,
    private readonly compartilhamentos: RepositorioCompartilhamentoClientes
  ) {}

  criarRelacao(dados: {
    negocioOrigemId: string;
    negocioDestinoId: string;
    tipo: TipoRelacaoNegocio;
    escopo?: Record<string, unknown>;
    criadoPorUsuarioId?: string | null;
    expiraEm?: Date | null;
  }) {
    if (dados.negocioOrigemId === dados.negocioDestinoId) {
      throw new Error("Um negócio não pode criar relação consigo mesmo.");
    }

    const novaRelacao: NovaRelacaoNegocio = {
      negocioOrigemId: dados.negocioOrigemId,
      negocioDestinoId: dados.negocioDestinoId,
      tipo: dados.tipo,
      escopo: dados.escopo ?? {},
      criadoPorUsuarioId: dados.criadoPorUsuarioId ?? null,
      expiraEm: dados.expiraEm ?? null
    };

    return this.compartilhamentos.criarRelacao(novaRelacao);
  }

  async atualizarRelacao(
    id: string,
    negocioAtualId: string,
    dados: {
      estado: EstadoRelacaoNegocio;
      atorUsuarioId?: string | null;
    }
  ) {
    const relacao = await this.exigirRelacao(id);

    if (dados.estado === "APROVADA" || dados.estado === "REJEITADA") {
      if (relacao.negocioDestinoId !== negocioAtualId) {
        throw new Error("Apenas o negócio destino pode aprovar ou rejeitar a relação.");
      }
    }

    if (dados.estado === "REVOGADA" && ![relacao.negocioOrigemId, relacao.negocioDestinoId].includes(negocioAtualId)) {
      throw new Error("Apenas negócios envolvidos podem revogar a relação.");
    }

    const atualizada = await this.compartilhamentos.atualizarRelacao(id, {
      estado: dados.estado,
      atorUsuarioId: dados.atorUsuarioId ?? null
    });
    if (!atualizada) throw new Error("Relação entre negócios não encontrada.");
    return atualizada;
  }

  async compartilharCliente(dados: {
    clienteId: string;
    negocioOrigemId: string;
    negocioDestinoId: string;
    relacaoId?: string | null;
    escopo?: Record<string, unknown>;
    motivo: string;
    baseLegal: string;
    consentimentoCliente: boolean;
    atorUsuarioId?: string | null;
    expiraEm?: Date | null;
  }) {
    const cliente = await this.clientes.buscarPorId(dados.clienteId, dados.negocioOrigemId);
    if (!cliente) throw new Error("Cliente não encontrado no negócio origem.");

    if (!cliente.consentimentoDados || !dados.consentimentoCliente) {
      throw new Error("Compartilhamento exige consentimento de dados do cliente.");
    }

    const relacao = dados.relacaoId ? await this.exigirRelacao(dados.relacaoId) : null;
    if (!relacao || relacao.estado !== "APROVADA") {
      throw new Error("Compartilhamento exige relação aprovada entre os negócios.");
    }

    if (relacao.negocioOrigemId !== dados.negocioOrigemId || relacao.negocioDestinoId !== dados.negocioDestinoId) {
      throw new Error("Relação aprovada não corresponde aos negócios informados.");
    }

    const novoCompartilhamento: NovoCompartilhamentoCliente = {
      relacaoId: relacao.id,
      cliente,
      negocioOrigemId: dados.negocioOrigemId,
      negocioDestinoId: dados.negocioDestinoId,
      escopo: dados.escopo ?? {},
      motivo: dados.motivo,
      baseLegal: dados.baseLegal,
      consentimentoCliente: dados.consentimentoCliente,
      atorUsuarioId: dados.atorUsuarioId ?? null,
      expiraEm: dados.expiraEm ?? null
    };

    return this.compartilhamentos.criarCompartilhamento(novoCompartilhamento);
  }

  async revogarCompartilhamento(dados: {
    compartilhamentoId: string;
    negocioAtualId: string;
    atorUsuarioId?: string | null;
    motivo: string;
  }) {
    const compartilhamento = await this.compartilhamentos.buscarCompartilhamentoPorId(dados.compartilhamentoId);
    if (!compartilhamento) throw new Error("Compartilhamento de cliente não encontrado.");

    if (![compartilhamento.negocioOrigemId, compartilhamento.negocioDestinoId].includes(dados.negocioAtualId)) {
      throw new Error("Apenas negócios envolvidos podem revogar o compartilhamento.");
    }

    if (compartilhamento.status !== "ATIVO") {
      throw new Error("Apenas compartilhamentos ativos podem ser revogados.");
    }

    const resultado = await this.compartilhamentos.revogarCompartilhamento(dados.compartilhamentoId, {
      atorUsuarioId: dados.atorUsuarioId ?? null,
      motivo: dados.motivo
    });
    if (!resultado) throw new Error("Compartilhamento de cliente não encontrado.");
    return resultado;
  }

  listarRecebidos(negocioDestinoId: string, agora = new Date()) {
    return this.compartilhamentos.listarRecebidos(negocioDestinoId, agora);
  }

  private async exigirRelacao(id: string) {
    const relacao = await this.compartilhamentos.buscarRelacaoPorId(id);
    if (!relacao) throw new Error("Relação entre negócios não encontrada.");
    return relacao;
  }
}
