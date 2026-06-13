import type { FastifyReply } from "fastify";
import type { DespachadorEventos } from "../../dominio/eventos/DespachadorEventos.js";
import type { EventoSistema } from "../../dominio/tipos.js";

export class HubTempoReal {
  private readonly clientes = new Set<FastifyReply>();

  constructor(eventos: DespachadorEventos) {
    eventos.aoReceberQualquer((evento) => this.enviarEvento(evento));
  }

  adicionarCliente(reply: FastifyReply, origemPermitida?: string | null): void {
    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    };

    if (origemPermitida) {
      headers["Access-Control-Allow-Origin"] = origemPermitida;
      headers["Access-Control-Allow-Credentials"] = "true";
      headers.Vary = "Origin";
    }

    reply.raw.writeHead(200, headers);

    reply.raw.write("retry: 3000\n");
    reply.raw.write(`event: conectado\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    this.clientes.add(reply);

    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`: keep-alive ${Date.now()}\n\n`);
      } catch {
        limparCliente();
      }
    }, 25_000);

    const limparCliente = () => {
      clearInterval(heartbeat);
      this.clientes.delete(reply);
    };

    reply.raw.on("close", limparCliente);
  }

  private enviarEvento(evento: EventoSistema): void {
    const payload = `event: ${evento.tipo}\ndata: ${JSON.stringify(evento)}\n\n`;

    for (const cliente of this.clientes) {
      try {
        cliente.raw.write(payload);
      } catch {
        this.clientes.delete(cliente);
      }
    }
  }
}
