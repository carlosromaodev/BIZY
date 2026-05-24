import type { ComentarioLive } from "../tipos.js";

export interface LiveCommentProvider {
  connect(liveUsername: string): Promise<void>;
  onComment(callback: (comment: ComentarioLive) => void): void;
  disconnect(): Promise<void>;
}
