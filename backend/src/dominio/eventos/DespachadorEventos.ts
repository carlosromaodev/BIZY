import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { EventoSistema, TipoEventoSistema } from "../tipos.js";

type OuvinteEvento = (evento: EventoSistema) => void;

export class DespachadorEventos {
  private readonly emissor = new EventEmitter();

  emitir(tipo: TipoEventoSistema, dados: Record<string, unknown> = {}): EventoSistema {
    const evento: EventoSistema = {
      id: randomUUID(),
      tipo,
      dados,
      criadoEm: new Date()
    };

    this.emissor.emit(tipo, evento);
    this.emissor.emit("*", evento);

    return evento;
  }

  aoReceber(tipo: TipoEventoSistema, ouvinte: OuvinteEvento): () => void {
    this.emissor.on(tipo, ouvinte);
    return () => this.emissor.off(tipo, ouvinte);
  }

  aoReceberQualquer(ouvinte: OuvinteEvento): () => void {
    this.emissor.on("*", ouvinte);
    return () => this.emissor.off("*", ouvinte);
  }
}
