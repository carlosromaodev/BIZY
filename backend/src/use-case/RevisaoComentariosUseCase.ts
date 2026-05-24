import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioComentarios } from "../dominio/repositorios/contratos.js";
import type { AutomacaoWhatsApp } from "../dominio/servicos/AutomacaoWhatsApp.js";
import { NormalizadorTelefone } from "../dominio/servicos/NormalizadorTelefone.js";
import type { RegistroComentario, Reserva, ResultadoInterpretacaoComentario } from "../dominio/tipos.js";
import type { MotorReservas } from "./MotorReservas.js";

export interface DadosAprovacaoComentario {
  telefone: string;
  codigoPeca: string;
  observacao?: string;
}

export interface ResultadoRevisaoComentario {
  registro: RegistroComentario;
  reserva: Reserva | null;
  estado: "PROCESSADO" | "REVISAO_MANUAL" | "IGNORADO";
  motivo: string | null;
}

export class RevisaoComentariosUseCase {
  private readonly normalizadorTelefone = new NormalizadorTelefone();

  constructor(
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly motorReservas: MotorReservas,
    private readonly automacaoWhatsApp: AutomacaoWhatsApp,
    private readonly eventos: DespachadorEventos
  ) {}

  async aprovarComentario(idComentario: string, dados: DadosAprovacaoComentario): Promise<ResultadoRevisaoComentario> {
    const registroAtual = await this.exigirComentarioEmRevisao(idComentario);
    const telefone = this.exigirTelefoneValido(dados.telefone);
    const codigoPeca = dados.codigoPeca.trim();
    const interpretacao = this.montarInterpretacaoManual(telefone, codigoPeca);
    const resultadoReserva = await this.motorReservas.criarReserva(registroAtual.comentario, interpretacao);

    await this.notificarResultado(resultadoReserva, registroAtual, telefone);

    const deveRevisar = resultadoReserva.tipo === "REVISAO_MANUAL" || resultadoReserva.tipo === "PECA_INDISPONIVEL";
    const estado = deveRevisar ? "REVISAO_MANUAL" : "PROCESSADO";
    const motivo = deveRevisar ? resultadoReserva.motivo ?? "Aprovação manual precisa de nova revisão." : this.motivoAprovacao(dados.observacao);
    const registro = await this.repositorioComentarios.atualizarEstado(idComentario, estado, motivo, interpretacao);

    this.eventos.emitir("COMMENT_REVIEWED", {
      comentarioId: idComentario,
      acao: estado === "PROCESSADO" ? "APROVADO" : "MANTIDO_EM_REVISAO",
      telefoneOriginal: registroAtual.interpretacao?.phone,
      codigoPecaOriginal: registroAtual.interpretacao?.productCode,
      telefoneCorrigido: telefone,
      codigoPecaCorrigido: codigoPeca,
      observacao: dados.observacao,
      resultadoReserva: resultadoReserva.tipo
    });

    return {
      registro,
      reserva: resultadoReserva.reserva,
      estado,
      motivo
    };
  }

  async rejeitarComentario(idComentario: string, motivo: string): Promise<ResultadoRevisaoComentario> {
    const registroAtual = await this.exigirComentarioEmRevisao(idComentario);
    const registro = await this.repositorioComentarios.atualizarEstado(idComentario, "IGNORADO", motivo);

    this.eventos.emitir("COMMENT_REVIEWED", {
      comentarioId: idComentario,
      acao: "REJEITADO",
      telefoneOriginal: registroAtual.interpretacao?.phone,
      codigoPecaOriginal: registroAtual.interpretacao?.productCode,
      motivo
    });

    return {
      registro,
      reserva: null,
      estado: "IGNORADO",
      motivo
    };
  }

  private async exigirComentarioEmRevisao(idComentario: string): Promise<RegistroComentario> {
    const registro = await this.repositorioComentarios.buscarPorId(idComentario);

    if (!registro) {
      throw new Error(`Comentário ${idComentario} não encontrado.`);
    }

    if (registro.estado !== "REVISAO_MANUAL") {
      throw new Error(`Comentário ${idComentario} não está em revisão manual.`);
    }

    return registro;
  }

  private exigirTelefoneValido(valor: string): string {
    const telefone = this.normalizadorTelefone.normalizar(valor);

    if (!telefone) {
      throw new Error("Número de telefone angolano inválido.");
    }

    return telefone;
  }

  private montarInterpretacaoManual(telefone: string, codigoPeca: string): ResultadoInterpretacaoComentario {
    return {
      intent: "BUY",
      phone: telefone,
      productCode: codigoPeca,
      productCodes: [codigoPeca],
      confidence: 1,
      requiresManualReview: false,
      reasons: ["Corrigido manualmente pelo vendedor."]
    };
  }

  private motivoAprovacao(observacao?: string): string {
    const detalhe = observacao?.trim();
    return detalhe ? `Aprovado manualmente. ${detalhe}` : "Aprovado manualmente.";
  }

  private async notificarResultado(
    resultadoReserva: Awaited<ReturnType<MotorReservas["criarReserva"]>>,
    registro: RegistroComentario,
    telefone: string
  ): Promise<void> {
    if (resultadoReserva.tipo === "RESERVA_CRIADA" && resultadoReserva.reserva && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarReservaCriada(resultadoReserva.reserva, resultadoReserva.peca);
    }

    if (resultadoReserva.tipo === "FILA_ESPERA" && resultadoReserva.reserva && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarFilaEspera(resultadoReserva.reserva, resultadoReserva.peca);
    }

    if (resultadoReserva.tipo === "PECA_INDISPONIVEL" && resultadoReserva.peca) {
      await this.automacaoWhatsApp.notificarPecaVendida(
        telefone,
        registro.comentario.displayName || registro.comentario.username,
        resultadoReserva.peca
      );
    }
  }
}
