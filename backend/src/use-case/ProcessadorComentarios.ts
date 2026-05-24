import { ComentarioLiveSchema } from "../dominio/esquemas.js";
import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioComentarios } from "../dominio/repositorios/contratos.js";
import type { AutomacaoWhatsApp } from "../dominio/servicos/AutomacaoWhatsApp.js";
import type { InterpretadorComentario } from "../dominio/servicos/InterpretadorComentario.js";
import type { MotorReservas } from "./MotorReservas.js";
import type { ComentarioLive, RegistroComentario, Reserva, ResultadoInterpretacaoComentario } from "../dominio/tipos.js";

export interface ResultadoProcessamentoComentario {
  registro: RegistroComentario;
  reserva: Reserva | null;
  reservas: Reserva[];
  estado: "PROCESSADO" | "REVISAO_MANUAL" | "IGNORADO";
  motivo: string | null;
}

export class ProcessadorComentarios {
  constructor(
    private readonly interpretadorComentario: InterpretadorComentario,
    private readonly motorReservas: MotorReservas,
    private readonly automacaoWhatsApp: AutomacaoWhatsApp,
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly eventos: DespachadorEventos
  ) {}

  async processar(comentarioEntrada: ComentarioLive): Promise<ResultadoProcessamentoComentario> {
    const comentario = ComentarioLiveSchema.parse(comentarioEntrada);

    this.eventos.emitir("COMMENT_RECEIVED", { comentario });

    const interpretacao = this.interpretadorComentario.interpretar(comentario.commentText);
    this.eventos.emitir("COMMENT_PARSED", { comentario, interpretacao });

    const registroInicial = await this.repositorioComentarios.criar({
      comentario,
      interpretacao,
      estado: "RECEBIDO"
    });

    if (interpretacao.intent === "BUY") {
      this.eventos.emitir("INTENT_DETECTED", { comentario, interpretacao });
    }

    if (interpretacao.intent !== "BUY") {
      const registro = await this.repositorioComentarios.atualizarEstado(
        registroInicial.id,
        "IGNORADO",
        "Comentário sem intenção de compra.",
        interpretacao
      );

      return { registro, reserva: null, reservas: [], estado: "IGNORADO", motivo: "Comentário sem intenção de compra." };
    }

    if (interpretacao.requiresManualReview) {
      const motivo = interpretacao.reasons.join(" ") || "Comentário ambíguo.";
      const registro = await this.repositorioComentarios.atualizarEstado(
        registroInicial.id,
        "REVISAO_MANUAL",
        motivo,
        interpretacao
      );

      if (this.devePedirCodigoPecaNaRevisao(interpretacao)) {
        await this.pedirCodigoPecaAoCliente(comentario, interpretacao, motivo);
      }

      return { registro, reserva: null, reservas: [], estado: "REVISAO_MANUAL", motivo };
    }

    const codigosPeca = this.listarCodigosPecaInterpretados(interpretacao);
    const resultadosReserva = [];

    for (const codigoPeca of codigosPeca) {
      const resultadoReserva = await this.motorReservas.criarReserva(comentario, {
        ...interpretacao,
        productCode: codigoPeca,
        productCodes: [codigoPeca]
      });
      resultadosReserva.push(resultadoReserva);
      await this.notificarResultadoReserva(resultadoReserva, comentario, interpretacao);
    }

    const reservas = resultadosReserva.flatMap((resultado) => (resultado.reserva ? [resultado.reserva] : []));
    const temReservaProcessada = reservas.length > 0;
    const deveRevisar =
      !temReservaProcessada ||
      resultadosReserva.some((resultado) => resultado.tipo === "REVISAO_MANUAL" || resultado.tipo === "PECA_INDISPONIVEL");
    const estado = deveRevisar ? "REVISAO_MANUAL" : "PROCESSADO";
    const motivo = this.juntarMotivos(resultadosReserva.map((resultado) => resultado.motivo));
    const registro = await this.repositorioComentarios.atualizarEstado(
      registroInicial.id,
      estado,
      motivo,
      interpretacao
    );

    return {
      registro,
      reserva: reservas[0] ?? null,
      reservas,
      estado,
      motivo
    };
  }

  private listarCodigosPecaInterpretados(interpretacao: ResultadoInterpretacaoComentario): string[] {
    if (!interpretacao?.productCode) return [];
    const codigos = interpretacao.productCodes?.length ? interpretacao.productCodes : [interpretacao.productCode];
    return [...new Set(codigos.filter((codigo): codigo is string => Boolean(codigo)))];
  }

  private async notificarResultadoReserva(
    resultadoReserva: Awaited<ReturnType<MotorReservas["criarReserva"]>>,
    comentario: ComentarioLive,
    interpretacao: ReturnType<InterpretadorComentario["interpretar"]>
  ): Promise<void> {
    if (resultadoReserva.tipo === "RESERVA_CRIADA" && resultadoReserva.reserva && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarReservaCriada(resultadoReserva.reserva, resultadoReserva.peca);
    }

    if (resultadoReserva.tipo === "FILA_ESPERA" && resultadoReserva.reserva && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarFilaEspera(resultadoReserva.reserva, resultadoReserva.peca);
    }

    if (resultadoReserva.tipo === "PECA_INDISPONIVEL" && resultadoReserva.peca && interpretacao.phone) {
      await this.automacaoWhatsApp.notificarPecaVendida(
        interpretacao.phone,
        comentario.displayName || comentario.username,
        resultadoReserva.peca
      );
    }

    if (resultadoReserva.tipo === "PECA_INDISPONIVEL" && !resultadoReserva.peca && interpretacao.phone) {
      await this.pedirCodigoPecaAoCliente(
        comentario,
        interpretacao,
        resultadoReserva.motivo || "Peça não encontrada no catálogo."
      );
    }

    if (this.devePedirCodigoPecaAposTentativaReserva(resultadoReserva, interpretacao)) {
      await this.pedirCodigoPecaAoCliente(
        comentario,
        interpretacao,
        resultadoReserva.motivo || "Peça não encontrada no catálogo."
      );
    }
  }

  private devePedirCodigoPecaNaRevisao(interpretacao: ResultadoInterpretacaoComentario): boolean {
    return interpretacao.intent === "BUY" && Boolean(interpretacao.phone) && !interpretacao.productCode;
  }

  private devePedirCodigoPecaAposTentativaReserva(
    resultadoReserva: Awaited<ReturnType<MotorReservas["criarReserva"]>>,
    interpretacao: ResultadoInterpretacaoComentario
  ): boolean {
    const motivo = resultadoReserva.motivo?.toLowerCase() ?? "";

    return (
      resultadoReserva.tipo === "REVISAO_MANUAL" &&
      Boolean(interpretacao.phone) &&
      Boolean(interpretacao.productCode) &&
      motivo.includes("não encontrada")
    );
  }

  private async pedirCodigoPecaAoCliente(
    comentario: ComentarioLive,
    interpretacao: ResultadoInterpretacaoComentario,
    motivo: string
  ): Promise<void> {
    if (!interpretacao.phone) return;

    const nomeCliente = comentario.displayName || comentario.username || "Cliente";

    this.eventos.emitir("CUSTOMER_FOLLOWUP_REQUESTED", {
      telefone: interpretacao.phone,
      nomeCliente,
      comentario,
      interpretacao,
      motivo
    });

    await this.automacaoWhatsApp.solicitarCodigoPeca(
      interpretacao.phone,
      nomeCliente,
      comentario.commentText,
      motivo
    );
  }

  private juntarMotivos(motivos: Array<string | undefined>): string | null {
    const unicos = [...new Set(motivos.filter((motivo): motivo is string => Boolean(motivo)))];
    return unicos.length ? unicos.join(" ") : null;
  }
}
