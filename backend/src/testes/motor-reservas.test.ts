import { describe, expect, it } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { MotorReservas } from "../use-case/MotorReservas.js";
import type { ComentarioLive, ResultadoInterpretacaoComentario } from "../dominio/tipos.js";
import {
  RepositorioPecasMemoria,
  RepositorioReservasMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

function criarComentario(username: string, telefone: string, codigoPeca: string): ComentarioLive {
  return {
    source: "tiktok",
    provider: "teste",
    liveId: "live_teste",
    username,
    displayName: username,
    commentText: `eu quero ${telefone} ${codigoPeca}`,
    timestamp: new Date("2026-05-02T12:00:00Z")
  };
}

function criarInterpretacao(telefone: string, codigoPeca: string): ResultadoInterpretacaoComentario {
  return {
    intent: "BUY",
    phone: telefone,
    productCode: codigoPeca,
    confidence: 0.95,
    requiresManualReview: false,
    reasons: []
  };
}

describe("MotorReservas", () => {
  it("usa 15 minutos como prazo padrão de reserva do MVP", async () => {
    const agora = new Date("2026-05-02T12:00:00Z");
    const repositorioPecas = new RepositorioPecasMemoria();
    const repositorioReservas = new RepositorioReservasMemoria(repositorioPecas);
    const motor = new MotorReservas(repositorioPecas, repositorioReservas, new DespachadorEventos(), {
      agora: () => agora
    });

    await repositorioPecas.criar({
      codigo: "1",
      nome: "Saia",
      descricao: "Peça de teste",
      precoEmKwanza: 8000,
      quantidade: 1,
      fotos: []
    });

    const resultado = await motor.criarReserva(criarComentario("ana", "923456789", "1"), criarInterpretacao("923456789", "1"));

    expect(resultado.reserva?.expiraEm?.toISOString()).toBe("2026-05-02T12:15:00.000Z");
  });

  it("reserva o primeiro cliente válido e coloca o segundo em fila", async () => {
    const repositorioPecas = new RepositorioPecasMemoria();
    const repositorioReservas = new RepositorioReservasMemoria(repositorioPecas);
    const motor = new MotorReservas(repositorioPecas, repositorioReservas, new DespachadorEventos());

    await repositorioPecas.criar({
      codigo: "4",
      nome: "Vestido floral",
      descricao: "Peça de teste",
      precoEmKwanza: 12000,
      quantidade: 1,
      fotos: []
    });

    const primeira = await motor.criarReserva(criarComentario("ana", "923456789", "4"), criarInterpretacao("923456789", "4"));
    const segunda = await motor.criarReserva(criarComentario("maria", "924456789", "4"), criarInterpretacao("924456789", "4"));

    expect(primeira.tipo).toBe("RESERVA_CRIADA");
    expect(primeira.reserva?.estado).toBe("WAITING_PAYMENT");
    expect(segunda.tipo).toBe("FILA_ESPERA");
    expect(segunda.reserva?.estado).toBe("WAITLISTED");
  });

  it("expira a reserva vencida e promove o próximo cliente da fila", async () => {
    let agora = new Date("2026-05-02T12:00:00Z");
    const repositorioPecas = new RepositorioPecasMemoria();
    const repositorioReservas = new RepositorioReservasMemoria(repositorioPecas);
    const motor = new MotorReservas(repositorioPecas, repositorioReservas, new DespachadorEventos(), {
      minutosReserva: 10,
      agora: () => agora
    });

    await repositorioPecas.criar({
      codigo: "7",
      nome: "Calça jeans",
      descricao: "Peça de teste",
      precoEmKwanza: 18000,
      quantidade: 1,
      fotos: []
    });

    const primeira = await motor.criarReserva(criarComentario("ana", "923456789", "7"), criarInterpretacao("923456789", "7"));
    const segunda = await motor.criarReserva(criarComentario("maria", "924456789", "7"), criarInterpretacao("924456789", "7"));

    agora = new Date("2026-05-02T12:11:00Z");
    const resultado = await motor.expirarReservasVencidas();

    expect(resultado.expiradas).toHaveLength(1);
    expect(resultado.expiradas[0].id).toBe(primeira.reserva?.id);
    expect(resultado.promovidas).toHaveLength(1);
    expect(resultado.promovidas[0].reserva.id).toBe(segunda.reserva?.id);
    expect(resultado.promovidas[0].reserva.estado).toBe("WAITING_PAYMENT");
  });

  it("permite várias reservas do mesmo telefone para a mesma peça enquanto houver stock", async () => {
    const repositorioPecas = new RepositorioPecasMemoria();
    const repositorioReservas = new RepositorioReservasMemoria(repositorioPecas);
    const motor = new MotorReservas(repositorioPecas, repositorioReservas, new DespachadorEventos());

    await repositorioPecas.criar({
      codigo: "9",
      nome: "Camisa",
      descricao: "Peça de teste",
      precoEmKwanza: 9000,
      quantidade: 3,
      fotos: []
    });

    const primeira = await motor.criarReserva(criarComentario("ana", "923456789", "9"), criarInterpretacao("923456789", "9"));
    const segunda = await motor.criarReserva(criarComentario("ana", "923456789", "9"), criarInterpretacao("923456789", "9"));
    const terceira = await motor.criarReserva(criarComentario("ana", "923456789", "9"), criarInterpretacao("923456789", "9"));

    expect(primeira.tipo).toBe("RESERVA_CRIADA");
    expect(segunda.tipo).toBe("RESERVA_CRIADA");
    expect(terceira.tipo).toBe("RESERVA_CRIADA");
    expect(new Set([primeira.reserva?.id, segunda.reserva?.id, terceira.reserva?.id]).size).toBe(3);
    expect(await repositorioReservas.contarReservasQueBloqueiamStock("9")).toBe(3);
  });

  it("impede cancelamento automático de reserva paga sem autorização explícita", async () => {
    const repositorioPecas = new RepositorioPecasMemoria();
    const repositorioReservas = new RepositorioReservasMemoria(repositorioPecas);
    const motor = new MotorReservas(repositorioPecas, repositorioReservas, new DespachadorEventos());

    await repositorioPecas.criar({
      codigo: "10",
      nome: "Mala",
      descricao: "Peça de teste",
      precoEmKwanza: 15000,
      quantidade: 1,
      fotos: []
    });

    const resultado = await motor.criarReserva(criarComentario("ana", "923456789", "10"), criarInterpretacao("923456789", "10"));
    await motor.confirmarPagamento(resultado.reserva!.id);

    await expect(motor.cancelarReserva(resultado.reserva!.id)).rejects.toThrow("Reserva paga não pode ser cancelada");
    await expect(motor.cancelarReserva(resultado.reserva!.id, { permitirCancelarPaga: true })).resolves.toEqual(
      expect.objectContaining({
        cancelada: expect.objectContaining({ estado: "CANCELLED" })
      })
    );
  });

  it("mantém apenas uma reserva bloqueando stock em comentários simultâneos", async () => {
    const repositorioPecas = new RepositorioPecasMemoria();
    const repositorioReservas = new RepositorioReservasMemoria(repositorioPecas);
    const motor = new MotorReservas(repositorioPecas, repositorioReservas, new DespachadorEventos());

    await repositorioPecas.criar({
      codigo: "11",
      nome: "Blazer",
      descricao: "Peça concorrida",
      precoEmKwanza: 25000,
      quantidade: 1,
      fotos: []
    });

    const resultados = await Promise.all([
      motor.criarReserva(criarComentario("ana", "923456789", "11"), criarInterpretacao("923456789", "11")),
      motor.criarReserva(criarComentario("maria", "924456789", "11"), criarInterpretacao("924456789", "11"))
    ]);

    expect(resultados.map((resultado) => resultado.tipo).sort()).toEqual(["FILA_ESPERA", "RESERVA_CRIADA"]);
    expect(await repositorioReservas.contarReservasQueBloqueiamStock("11")).toBe(1);
  });
});
