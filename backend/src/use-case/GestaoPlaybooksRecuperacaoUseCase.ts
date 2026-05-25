import type {
  RepositorioPlaybooksRecuperacao,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import type {
  FiltrosExecucoesPlaybookRecuperacao,
  FiltrosPlaybookRecuperacao,
  NovaExecucaoPlaybookRecuperacao,
  NovoPlaybookRecuperacao,
  PlaybookRecuperacao
} from "../dominio/tipos.js";

export interface EventoExecucaoPlaybookRecuperacao {
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  clienteTelefone?: string | null;
  clienteId?: string | null;
  pedidoId?: string | null;
  contexto?: Record<string, unknown>;
}

export class GestaoPlaybooksRecuperacaoUseCase {
  constructor(
    private readonly playbooks: RepositorioPlaybooksRecuperacao,
    private readonly tarefas: RepositorioTarefasOperacionais
  ) {}

  criarPlaybook(dados: NovoPlaybookRecuperacao) {
    return this.playbooks.criar({
      ...dados,
      ativo: dados.ativo ?? true,
      atrasoMinutos: dados.atrasoMinutos ?? 0,
      condicoes: dados.condicoes ?? {},
      acao: dados.acao ?? "CRIAR_TAREFA",
      prioridadeTarefa: dados.prioridadeTarefa ?? "NORMAL"
    });
  }

  listarPlaybooks(negocioId: string, filtros: FiltrosPlaybookRecuperacao = {}) {
    return this.playbooks.listar(negocioId, filtros);
  }

  listarExecucoes(negocioId: string, filtros: FiltrosExecucoesPlaybookRecuperacao = {}) {
    return this.playbooks.listarExecucoes(negocioId, filtros);
  }

  async executarPlaybook(id: string, negocioId: string, evento: EventoExecucaoPlaybookRecuperacao) {
    const playbook = await this.obterPlaybook(id, negocioId);
    const contextoEvento = evento.contexto ?? {};

    if (!playbook.ativo) {
      const execucao = await this.registrarExecucao(playbook, evento, {
        estado: "IGNORADA",
        motivo: "Playbook inativo.",
        contexto: contextoEvento
      });
      return { execucao, tarefa: null };
    }

    const tarefa = await this.tarefas.criar({
      negocioId,
      tipo: "PLAYBOOK_RECUPERACAO",
      titulo: playbook.tituloTarefa ?? this.tituloPadrao(playbook),
      descricao: playbook.descricaoTarefa ?? this.descricaoPadrao(playbook),
      prioridade: playbook.prioridadeTarefa,
      estado: "ABERTA",
      origem: "playbook_recuperacao",
      clienteId: evento.clienteId ?? null,
      pedidoId: evento.pedidoId ?? null,
      entidadeTipo: evento.entidadeTipo ?? null,
      entidadeId: evento.entidadeId ?? null,
      clienteTelefone: evento.clienteTelefone ?? null,
      responsavelId: playbook.responsavelId,
      prazoEm: this.calcularPrazo(playbook.atrasoMinutos),
      contexto: {
        playbook: {
          id: playbook.id,
          nome: playbook.nome,
          gatilho: playbook.gatilho,
          condicoes: playbook.condicoes
        },
        evento: contextoEvento
      }
    });

    const execucao = await this.registrarExecucao(playbook, evento, {
      estado: "EXECUTADA",
      tarefaId: tarefa.id,
      contexto: {
        ...contextoEvento,
        tarefaId: tarefa.id
      }
    });

    return { execucao, tarefa };
  }

  private async obterPlaybook(id: string, negocioId: string) {
    const playbook = await this.playbooks.buscarPorId(id, negocioId);
    if (!playbook) throw new Error(`Playbook ${id} não encontrado.`);
    return playbook;
  }

  private registrarExecucao(
    playbook: PlaybookRecuperacao,
    evento: EventoExecucaoPlaybookRecuperacao,
    dados: Pick<NovaExecucaoPlaybookRecuperacao, "estado"> &
      Partial<Pick<NovaExecucaoPlaybookRecuperacao, "tarefaId" | "motivo" | "contexto">>
  ) {
    return this.playbooks.registrarExecucao({
      negocioId: playbook.negocioId,
      playbookId: playbook.id,
      gatilho: playbook.gatilho,
      entidadeTipo: evento.entidadeTipo ?? null,
      entidadeId: evento.entidadeId ?? null,
      clienteTelefone: evento.clienteTelefone ?? null,
      estado: dados.estado,
      tarefaId: dados.tarefaId ?? null,
      motivo: dados.motivo ?? null,
      contexto: dados.contexto ?? {}
    });
  }

  private tituloPadrao(playbook: Pick<PlaybookRecuperacao, "gatilho" | "nome">): string {
    return `Executar recuperação: ${playbook.nome || playbook.gatilho}`;
  }

  private descricaoPadrao(playbook: Pick<PlaybookRecuperacao, "gatilho">): string {
    const descricoes: Record<PlaybookRecuperacao["gatilho"], string> = {
      CARRINHO_ABANDONADO: "Cliente iniciou compra e não concluiu. Validar contexto antes do contacto.",
      PAGAMENTO_PENDENTE: "Cliente tem pagamento pendente. Confirmar interesse e orientar próximos passos.",
      RESERVA_EXPIRADA: "Reserva expirou. Verificar se ainda existe intenção de compra e disponibilidade.",
      CLIENTE_INATIVO: "Cliente ficou inativo. Reavaliar relacionamento antes de nova abordagem.",
      POS_VENDA: "Cliente concluiu compra. Fazer acompanhamento pós-venda.",
      REPOSICAO_PRODUTO: "Produto voltou ao stock. Validar interesse antes de enviar oferta.",
      SOCIAL_LEAD: "Lead veio de canal social. Avaliar intenção e responder com contexto."
    };

    return descricoes[playbook.gatilho];
  }

  private calcularPrazo(atrasoMinutos: number): Date | null {
    if (atrasoMinutos <= 0) return null;
    return new Date(Date.now() + atrasoMinutos * 60_000);
  }
}
