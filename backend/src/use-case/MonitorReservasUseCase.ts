import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioPecas, RepositorioReservas } from "../dominio/repositorios/contratos.js";
import type { AutomacaoWhatsApp } from "../dominio/servicos/AutomacaoWhatsApp.js";
import type { MotorReservas } from "./MotorReservas.js";

export class MonitorReservasUseCase {
  private readonly reservasComLembreteEnviado = new Set<string>();

  constructor(
    private readonly motorReservas: MotorReservas,
    private readonly automacaoWhatsApp: AutomacaoWhatsApp,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioPecas: RepositorioPecas,
    private readonly eventos: DespachadorEventos,
    private readonly minutosAntesExpirar: number
  ) {}

  async expirarReservasVencidas() {
    const resultado = await this.motorReservas.expirarReservasVencidas();

    for (const reserva of resultado.expiradas) {
      const peca = await this.repositorioPecas.buscarPorCodigo(reserva.codigoPeca);
      if (peca) {
        await this.automacaoWhatsApp.notificarReservaExpirada(reserva, peca);
      }
    }

    for (const promovida of resultado.promovidas) {
      await this.automacaoWhatsApp.notificarChamadoFila(promovida.reserva, promovida.peca);
    }

    return resultado;
  }

  async notificarReservasAExpirar(): Promise<void> {
    const agora = new Date();
    const limite = new Date(agora.getTime() + this.minutosAntesExpirar * 60_000);
    const reservas = await this.repositorioReservas.listar();

    for (const reserva of reservas) {
      const expiraEm = reserva.expiraEm;
      const jaNotificada = this.reservasComLembreteEnviado.has(reserva.id);
      const estaAguardandoPagamento = ["PENDING", "RESERVED", "WAITING_PAYMENT"].includes(reserva.estado);
      const expiraNaJanela =
        expiraEm !== null && expiraEm.getTime() > agora.getTime() && expiraEm.getTime() <= limite.getTime();

      if (jaNotificada || !estaAguardandoPagamento || !expiraNaJanela) {
        continue;
      }

      const peca = await this.repositorioPecas.buscarPorCodigo(reserva.codigoPeca);
      this.reservasComLembreteEnviado.add(reserva.id);
      this.eventos.emitir("RESERVATION_EXPIRING", {
        reserva,
        peca,
        tempoRestanteSegundos: Math.max(0, Math.floor((expiraEm.getTime() - agora.getTime()) / 1000))
      });
    }
  }
}
