import type { LiveCommentProvider } from "../../dominio/provedores/LiveCommentProvider.js";
import type { ComentarioLive } from "../../dominio/tipos.js";

export class FutureInstagramProvider implements LiveCommentProvider {
  async connect(): Promise<void> {
    throw new Error("Provider de Instagram ainda não foi implementado.");
  }

  onComment(_callback: (comment: ComentarioLive) => void): void {
    // Contrato reservado para integração futura.
  }

  async disconnect(): Promise<void> {
    // Não há conexão ativa nesta implementação futura.
  }
}
