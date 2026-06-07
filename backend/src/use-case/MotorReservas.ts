import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioPecas, RepositorioReservas } from "../dominio/repositorios/contratos.js";
import type {
  ComentarioLive,
  Peca,
  Reserva,
  ResultadoExpiracaoReservas,
  ResultadoInterpretacaoComentario,
  ResultadoReserva
} from "../dominio/tipos.js";

interface OpcoesMotorReservas {
  minutosReserva?: number;
  agora?: () => Date;
}

interface OpcoesCancelamentoReserva {
  permitirCancelarPaga?: boolean;
  negocioId?: string | null;
}

interface OpcoesOperacaoReserva {
  negocioId?: string | null;
  clienteNegocioId?: string | null;
}

export class MotorReservas {
  private readonly minutosReserva: number;
  private readonly agora: () => Date;

  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly eventos: DespachadorEventos,
    opcoes: OpcoesMotorReservas = {}
  ) {
    this.minutosReserva = opcoes.minutosReserva ?? 15;
    this.agora = opcoes.agora ?? (() => new Date());
  }

  async criarReserva(
    comentario: ComentarioLive,
    interpretacao: ResultadoInterpretacaoComentario,
    opcoes: OpcoesOperacaoReserva = {}
  ): Promise<ResultadoReserva> {
    if (!interpretacao.phone || !interpretacao.productCode) {
      return {
        tipo: "REVISAO_MANUAL",
        reserva: null,
        motivo: "Comentário sem telefone ou código da peça."
      };
    }

    const resultado = await this.repositorioReservas.criarComControleDeStock({
      negocioId: opcoes.negocioId ?? null,
      clienteNegocioId: opcoes.clienteNegocioId ?? null,
      codigoPeca: interpretacao.productCode,
      varianteSelecionada: interpretacao.variant ?? null,
      telefoneCliente: interpretacao.phone,
      nomeCliente: comentario.displayName || comentario.username,
      usernameCliente: comentario.username,
      userIdCliente: comentario.userId ?? null,
      avatarUrlCliente: comentario.avatarUrl ?? null,
      comentarioOriginal: comentario.commentText,
      liveId: comentario.liveId,
      expiraEmReserva: this.calcularExpiracao()
    });

    if (resultado.tipo === "RESERVA_CRIADA" && resultado.reserva && resultado.peca) {
      this.eventos.emitir("RESERVATION_CREATED", { reserva: resultado.reserva, peca: resultado.peca });
      this.eventos.emitir("STOCK_UPDATED", { codigoPeca: resultado.peca.codigo });
    }

    if (resultado.tipo === "FILA_ESPERA" && resultado.reserva && resultado.peca) {
      this.eventos.emitir("RESERVATION_WAITLISTED", { reserva: resultado.reserva, peca: resultado.peca });
    }

    return resultado;
  }

  async confirmarPagamento(
    idReserva: string,
    opcoes: OpcoesOperacaoReserva = {}
  ): Promise<{ reserva: Reserva; peca: Peca }> {
    const reservaAtual = await this.exigirReserva(idReserva, opcoes.negocioId);
    await this.repositorioReservas.atualizarEstadoPagamento(reservaAtual.id, "CONFIRMADO");
    const reserva = await this.repositorioReservas.atualizarEstado(reservaAtual.id, "PAID", null);
    const peca = await this.exigirPeca(reserva.codigoPeca, reserva.negocioId);
    const reservasPagas = (await this.repositorioReservas.listar(reserva.negocioId)).filter(
      (item) => item.codigoPeca === peca.codigo && item.estado === "PAID"
    ).length;

    if (reservasPagas >= peca.quantidade) {
      await this.repositorioPecas.atualizarEstado(peca.codigo, "VENDIDA", peca.negocioId);
    }

    this.eventos.emitir("PAYMENT_CONFIRMED", { reserva, peca });
    this.eventos.emitir("STOCK_UPDATED", { codigoPeca: peca.codigo });

    return { reserva, peca };
  }

  async registrarComprovativoPagamento(
    idReserva: string,
    comprovativoPagamentoUrl: string | null = null,
    opcoes: OpcoesOperacaoReserva = {}
  ): Promise<{ reserva: Reserva; peca: Peca }> {
    const reservaAtual = await this.exigirReserva(idReserva, opcoes.negocioId);
    const reserva = await this.repositorioReservas.atualizarEstadoPagamento(
      reservaAtual.id,
      "COMPROVATIVO_RECEBIDO",
      comprovativoPagamentoUrl
    );
    const peca = await this.exigirPeca(reserva.codigoPeca, reserva.negocioId);

    this.eventos.emitir("PAYMENT_PROOF_RECEIVED", { reserva, peca });

    return { reserva, peca };
  }

  async rejeitarPagamento(idReserva: string, motivo: string): Promise<{ reserva: Reserva; peca: Peca; motivo: string }> {
    const reservaAtual = await this.exigirReserva(idReserva);
    const reserva = await this.repositorioReservas.atualizarEstadoPagamento(reservaAtual.id, "REJEITADO");
    const peca = await this.exigirPeca(reserva.codigoPeca, reserva.negocioId);

    this.eventos.emitir("PAYMENT_REJECTED", { reserva, peca, motivo });

    return { reserva, peca, motivo };
  }

  async atualizarEnderecoEntrega(
    idReserva: string,
    enderecoEntrega: string
  ): Promise<{ reserva: Reserva; peca: Peca }> {
    const reservaAtual = await this.exigirReserva(idReserva);
    const reserva = await this.repositorioReservas.atualizarEnderecoEntrega(reservaAtual.id, enderecoEntrega);
    const peca = await this.exigirPeca(reserva.codigoPeca, reserva.negocioId);

    this.eventos.emitir("ORDER_READY_TO_SHIP", { reserva, peca });

    return { reserva, peca };
  }

  async marcarPedidoEntregue(idReserva: string): Promise<{ reserva: Reserva; peca: Peca }> {
    const reserva = await this.exigirReserva(idReserva);
    const peca = await this.exigirPeca(reserva.codigoPeca, reserva.negocioId);

    this.eventos.emitir("ORDER_DELIVERED", { reserva, peca });

    return { reserva, peca };
  }

  async cancelarReserva(
    idReserva: string,
    opcoes: OpcoesCancelamentoReserva = {}
  ): Promise<{ cancelada: Reserva; promovida: Reserva | null; peca: Peca }> {
    const reservaAtual = await this.exigirReserva(idReserva, opcoes.negocioId);

    if (reservaAtual.estado === "PAID" && !opcoes.permitirCancelarPaga) {
      throw new Error("Reserva paga não pode ser cancelada sem autorização explícita.");
    }

    const cancelada = await this.repositorioReservas.atualizarEstado(reservaAtual.id, "CANCELLED", null);
    const peca = await this.exigirPeca(cancelada.codigoPeca, cancelada.negocioId);
    const promovida = await this.promoverProximoDaFila(peca);

    this.eventos.emitir("STOCK_UPDATED", { codigoPeca: peca.codigo });

    return { cancelada, promovida, peca };
  }

  async expirarReservasVencidas(): Promise<ResultadoExpiracaoReservas> {
    const vencidas = await this.repositorioReservas.listarReservasExpiradas(this.agora());
    const expiradas: Reserva[] = [];
    const promovidas: Array<{ reserva: Reserva; peca: Peca }> = [];

    for (const reserva of vencidas) {
      const expirada = await this.repositorioReservas.atualizarEstado(reserva.id, "EXPIRED", null);
      const peca = await this.exigirPeca(expirada.codigoPeca, expirada.negocioId);
      const promovida = await this.promoverProximoDaFila(peca);

      expiradas.push(expirada);
      if (promovida) {
        promovidas.push({ reserva: promovida, peca });
      }

      this.eventos.emitir("RESERVATION_EXPIRED", { reserva: expirada, peca, promovida });
      this.eventos.emitir("STOCK_UPDATED", { codigoPeca: peca.codigo });
    }

    return { expiradas, promovidas };
  }

  private async promoverProximoDaFila(peca: Peca): Promise<Reserva | null> {
    const reservasQueBloqueiamStock = await this.repositorioReservas.contarReservasQueBloqueiamStock(
      peca.codigo,
      peca.negocioId
    );
    const temStockLivre = peca.quantidade - reservasQueBloqueiamStock > 0;

    if (!temStockLivre || peca.estado === "VENDIDA" || peca.estado === "ESGOTADA") {
      return null;
    }

    const [proximaReserva] = await this.repositorioReservas.listarFilaDaPeca(peca.codigo, peca.negocioId);

    if (!proximaReserva) {
      await this.repositorioPecas.atualizarEstado(peca.codigo, "DISPONIVEL", peca.negocioId);
      return null;
    }

    const promovida = await this.repositorioReservas.atualizarEstado(
      proximaReserva.id,
      "WAITING_PAYMENT",
      this.calcularExpiracao()
    );

    await this.repositorioPecas.atualizarEstado(peca.codigo, "RESERVADA", peca.negocioId);
    this.eventos.emitir("RESERVATION_CREATED", { reserva: promovida, peca, origem: "fila_de_espera" });

    return promovida;
  }

  private calcularExpiracao(): Date {
    return new Date(this.agora().getTime() + this.minutosReserva * 60_000);
  }

  private async exigirReserva(idReserva: string, negocioId?: string | null): Promise<Reserva> {
    const reserva = await this.repositorioReservas.buscarPorId(idReserva, negocioId);

    if (!reserva) {
      throw new Error(`Reserva ${idReserva} não encontrada.`);
    }

    return reserva;
  }

  private async exigirPeca(codigoPeca: string, negocioId?: string | null): Promise<Peca> {
    const peca = await this.repositorioPecas.buscarPorCodigo(codigoPeca, negocioId);

    if (!peca) {
      throw new Error(`Peça #${codigoPeca} não encontrada.`);
    }

    return peca;
  }
}
