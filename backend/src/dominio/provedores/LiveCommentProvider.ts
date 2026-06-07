import type { ComentarioLive, MetricasLive } from "../tipos.js";

export interface LiveCommentProvider {
  connect(liveUsername: string): Promise<void>;
  onComment(callback: (comment: ComentarioLive) => void): void;
  onMetrics?(callback: (metricas: MetricasLive) => void): void;
  disconnect(): Promise<void>;
}
