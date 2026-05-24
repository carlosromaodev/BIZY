import type { LiveCommentProvider } from "../../dominio/provedores/LiveCommentProvider.js";
import type { ComentarioLive } from "../../dominio/tipos.js";

export class ManualProvider implements LiveCommentProvider {
  private callbacks: Array<(comment: ComentarioLive) => void> = [];
  private conectado = false;
  private liveId = "manual_local";

  async connect(liveUsername: string): Promise<void> {
    this.conectado = true;
    this.liveId = `manual_${liveUsername}_${Date.now()}`;
  }

  onComment(callback: (comment: ComentarioLive) => void): void {
    this.callbacks.push(callback);
  }

  async disconnect(): Promise<void> {
    this.conectado = false;
    this.callbacks = [];
  }

  emitirComentario(dados: Omit<ComentarioLive, "source" | "provider" | "liveId" | "timestamp">): void {
    if (!this.conectado) {
      throw new Error("Provider manual não está conectado.");
    }

    const comentario: ComentarioLive = {
      source: "manual",
      provider: "manual",
      liveId: this.liveId,
      timestamp: new Date(),
      ...dados
    };

    for (const callback of this.callbacks) {
      callback(comentario);
    }
  }
}
