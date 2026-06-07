import type {
  RepositorioComentarios,
  RepositorioPecas,
  RepositorioReservas,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import type { PrioridadeTarefaOperacional, Reserva, TarefaOperacional } from "../dominio/tipos.js";
import type { StatusIntegracao } from "./ConsultaIntegracoesUseCase.js";

export interface SessaoLiveResumo {
  id: string;
  username: string;
  providerNome: string;
  iniciadaEm: Date;
  status: "CONECTANDO" | "CONECTADA" | "ERRO" | "ENCERRADA";
  comentariosRecebidos: number;
  comentariosProcessados: number;
  comentariosComErro: number;
  espectadoresAtuais: number | null;
  picoEspectadores: number | null;
  metricasAtualizadasEm: Date | null;
  ultimoComentarioEm: Date | null;
  ultimoErro: string | null;
}

export class ConsultaPainelUseCase {
  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly repositorioTarefas?: RepositorioTarefasOperacionais
  ) {}

  async resumirPainel(
    lives: SessaoLiveResumo[],
    integracoes: StatusIntegracao[],
    negocioId?: string | null,
    usuarioId?: string | null
  ) {
    const [pecas, reservas, comentarios, tarefas] = await Promise.all([
      this.repositorioPecas.listar(negocioId),
      this.repositorioReservas.listar(negocioId),
      this.repositorioComentarios.listar(200, negocioId),
      negocioId && this.repositorioTarefas ? this.repositorioTarefas.listar(negocioId, { limite: 500 }) : []
    ]);
    const tarefasPainel = this.resumirTarefas(tarefas, usuarioId);

    return {
      liveAtiva: lives.length > 0,
      lives,
      comentariosRecebidos: comentarios.length,
      comentariosValidos: comentarios.filter((comentario) => comentario.estado === "PROCESSADO").length,
      comentariosInvalidos: comentarios.filter((comentario) => comentario.estado !== "PROCESSADO").length,
      reservasCriadas: reservas.length,
      reservasPendentes: reservas.filter((reserva) =>
        ["PENDING", "RESERVED", "WAITING_PAYMENT"].includes(reserva.estado)
      ).length,
      reservasPagas: reservas.filter((reserva) => reserva.estado === "PAID").length,
      filaEspera: this.agruparFilaPorPeca(reservas),
      stock: pecas.map((peca) => ({
        codigo: peca.codigo,
        nome: peca.nome,
        quantidade: peca.quantidade,
        estado: peca.estado
      })),
      integracoes,
      tarefasOperacionais: tarefasPainel.resumo,
      minhasTarefas: tarefasPainel.minhas,
      pecas,
      reservas,
      comentarios
    };
  }

  async listarReservas(negocioId?: string | null) {
    return this.repositorioReservas.listar(negocioId);
  }

  async listarComentarios(opcoes: { incluirIgnorados?: boolean; negocioId?: string | null } = {}) {
    const comentarios = await this.repositorioComentarios.listar(200, opcoes.negocioId);
    if (opcoes.incluirIgnorados) return comentarios;

    return comentarios.filter((comentario) => comentario.estado !== "IGNORADO");
  }

  private agruparFilaPorPeca(reservas: Reserva[]): Record<string, number> {
    return reservas
      .filter((reserva) => reserva.estado === "WAITLISTED")
      .reduce<Record<string, number>>((acumulador, reserva) => {
        acumulador[reserva.codigoPeca] = (acumulador[reserva.codigoPeca] ?? 0) + 1;
        return acumulador;
      }, {});
  }

  private resumirTarefas(tarefas: TarefaOperacional[], usuarioId?: string | null) {
    const agora = new Date();
    const abertas = tarefas.filter((tarefa) => !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado));
    const minhas = abertas
      .filter((tarefa) => !usuarioId || tarefa.responsavelId === usuarioId)
      .map((tarefa) => this.mapearTarefaPainel(tarefa, agora))
      .sort((a, b) => {
        if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
        if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
        const prazoA = a.prazoEm ? new Date(a.prazoEm).getTime() : Number.POSITIVE_INFINITY;
        const prazoB = b.prazoEm ? new Date(b.prazoEm).getTime() : Number.POSITIVE_INFINITY;
        return prazoA - prazoB;
      })
      .slice(0, 8)
      .map(({ pontuacao: _pontuacao, ...tarefa }) => tarefa);

    return {
      resumo: {
        abertas: abertas.length,
        atrasadas: abertas.filter((tarefa) => tarefa.prazoEm && tarefa.prazoEm < agora).length,
        urgentes: abertas.filter((tarefa) => tarefa.prioridade === "URGENTE").length,
        minhasAbertas: usuarioId ? abertas.filter((tarefa) => tarefa.responsavelId === usuarioId).length : minhas.length,
        minhasAtrasadas: minhas.filter((tarefa) => tarefa.atrasada).length
      },
      minhas
    };
  }

  private mapearTarefaPainel(tarefa: TarefaOperacional, agora: Date) {
    const atrasoMinutos = tarefa.prazoEm
      ? Math.max(0, Math.floor((agora.getTime() - tarefa.prazoEm.getTime()) / 60_000))
      : 0;
    const atrasada = atrasoMinutos > 0;
    const pontuacao = this.calcularPontuacaoTarefa(tarefa, atrasoMinutos);

    return {
      id: tarefa.id,
      tipo: tarefa.tipo,
      titulo: tarefa.titulo,
      prioridade: tarefa.prioridade,
      estado: tarefa.estado,
      responsavelId: tarefa.responsavelId,
      clienteId: tarefa.clienteId,
      pedidoId: tarefa.pedidoId,
      entidadeTipo: tarefa.entidadeTipo,
      entidadeId: tarefa.entidadeId,
      prazoEm: tarefa.prazoEm?.toISOString() ?? null,
      atrasada,
      atrasoMinutos,
      impactoComercial: this.classificarImpacto(pontuacao),
      pontuacao
    };
  }

  private calcularPontuacaoTarefa(tarefa: TarefaOperacional, atrasoMinutos: number) {
    const pesoPrioridade: Record<PrioridadeTarefaOperacional, number> = {
      BAIXA: 10,
      NORMAL: 30,
      ALTA: 60,
      URGENTE: 80
    };
    const pesoTipo: Record<string, number> = {
      VIP_SEM_RESPOSTA: 45,
      COBRANCA: 35,
      ENTREGA: 35,
      SLA_CONVERSA: 30,
      WHATSAPP_POLICY_BLOCKED: 30,
      REPOSICAO_STOCK: 25,
      POS_VENDA: 15
    };
    const pesoAtraso = atrasoMinutos > 0 ? 30 + Math.min(25, Math.floor(atrasoMinutos / 60) * 5) : 0;
    return pesoPrioridade[tarefa.prioridade] + (pesoTipo[tarefa.tipo] ?? 10) + pesoAtraso;
  }

  private classificarImpacto(pontuacao: number) {
    if (pontuacao >= 145) return "CRITICO";
    if (pontuacao >= 100) return "ALTO";
    if (pontuacao >= 35) return "MEDIO";
    return "BAIXO";
  }
}
