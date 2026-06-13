import { describe, expect, it, vi } from "vitest";
import type { FastifyReply } from "fastify";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { HubTempoReal } from "../infra/http/HubTempoReal.js";

function criarReplyFake() {
  const listeners = new Map<string, () => void>();
  const writes: string[] = [];
  const raw = {
    writeHead: vi.fn(),
    write: vi.fn((payload: string) => {
      writes.push(payload);
      return true;
    }),
    on: vi.fn((evento: string, callback: () => void) => {
      listeners.set(evento, callback);
      return raw;
    })
  };

  return {
    listeners,
    raw,
    reply: { raw } as unknown as FastifyReply,
    writes
  };
}

describe("HubTempoReal", () => {
  it("mantém SSE compatível com cookie, heartbeat e eventos WhatsApp", () => {
    vi.useFakeTimers();
    const eventos = new DespachadorEventos();
    const hub = new HubTempoReal(eventos);
    const cliente = criarReplyFake();

    hub.adicionarCliente(cliente.reply, "https://usebizy.space");

    expect(cliente.raw.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": "https://usebizy.space",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no"
    }));
    expect(cliente.writes.join("")).toContain("retry: 3000");
    expect(cliente.writes.join("")).toContain("event: conectado");

    eventos.emitir("WHATSAPP_MESSAGE_RECEIVED", { telefone: "923000111", texto: "Olá" });
    expect(cliente.writes.join("")).toContain("event: WHATSAPP_MESSAGE_RECEIVED");

    vi.advanceTimersByTime(25_000);
    expect(cliente.writes.join("")).toContain(": keep-alive");

    cliente.listeners.get("close")?.();
    const totalWrites = cliente.writes.length;
    vi.advanceTimersByTime(25_000);
    expect(cliente.writes).toHaveLength(totalWrites);

    vi.useRealTimers();
  });
});
