import type {
  RepositorioComentarios,
  RepositorioPecas,
  RepositorioReservas
} from "../dominio/repositorios/contratos.js";
import type { Reserva } from "../dominio/tipos.js";
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
  ultimoComentarioEm: Date | null;
  ultimoErro: string | null;
}

export class ConsultaPainelUseCase {
  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioComentarios: RepositorioComentarios
  ) {}

  async resumirPainel(lives: SessaoLiveResumo[], integracoes: StatusIntegracao[]) {
    const [pecas, reservas, comentarios] = await Promise.all([
      this.repositorioPecas.listar(),
      this.repositorioReservas.listar(),
      this.repositorioComentarios.listar(200)
    ]);

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
      pecas,
      reservas,
      comentarios
    };
  }

  async listarReservas() {
    return this.repositorioReservas.listar();
  }

  async listarComentarios(opcoes: { incluirIgnorados?: boolean } = {}) {
    const comentarios = await this.repositorioComentarios.listar(200);
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
}
