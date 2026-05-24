import type { FastifyReply } from "fastify";
import type { DespachadorEventos } from "../../dominio/eventos/DespachadorEventos.js";
import type { EventoSistema } from "../../dominio/tipos.js";

export class HubTempoReal {
  private readonly clientes = new Set<FastifyReply>();

  constructor(eventos: DespachadorEventos) {
    eventos.aoReceberQualquer((evento) => this.enviarEvento(evento));
  }

  adicionarCliente(reply: FastifyReply): void {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });

    reply.raw.write(`event: conectado\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    this.clientes.add(reply);

    reply.raw.on("close", () => {
      this.clientes.delete(reply);
    });
  }

  private enviarEvento(evento: EventoSistema): void {
    const payload = `event: ${evento.tipo}\ndata: ${JSON.stringify(evento)}\n\n`;

    for (const cliente of this.clientes) {
      cliente.raw.write(payload);
    }
  }
}
