import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LiveCommentProvider } from "../../dominio/provedores/LiveCommentProvider.js";
import type { ComentarioLive } from "../../dominio/tipos.js";

type CallbackComentario = (comment: ComentarioLive) => void;

export class TikTokLivePythonProvider implements LiveCommentProvider {
  private callbacks: CallbackComentario[] = [];
  private processo: ChildProcessWithoutNullStreams | null = null;

  async connect(liveUsername: string): Promise<void> {
    const arquivoAtual = fileURLToPath(import.meta.url);
    const raizBackend = path.resolve(path.dirname(arquivoAtual), "../../../");
    const script = path.join(raizBackend, "scripts/tiktok_live_provider.py");

    await new Promise<void>((resolver, rejeitar) => {
      try {
        this.processo = spawn("python3", [script, liveUsername.replace(/^@/, "")]);
      } catch (erro) {
        rejeitar(new Error("Python3 não está instalado neste servidor. Use o provider 'tiktok-live-connector' em vez do 'tiktok-live-python'."));
        return;
      }

      let resolvido = false;

      this.processo.on("error", (erro) => {
        if (!resolvido) {
          resolvido = true;
          const msg = (erro as NodeJS.ErrnoException).code === "ENOENT"
            ? "Python3 não está instalado neste servidor. Use o provider 'tiktok-live-connector' em vez do 'tiktok-live-python'."
            : `Falha ao iniciar o script Python: ${erro.message}`;
          rejeitar(new Error(msg));
        }
      });

      this.processo.stderr.on("data", (saida) => console.error(`[TikTokLivePython] ${saida.toString()}`));
      this.processo.stdout.on("data", (saida) => {
        this.processarSaida(saida.toString());
        if (!resolvido) {
          resolvido = true;
          resolver();
        }
      });

      this.processo.on("close", (codigo) => {
        if (!resolvido) {
          resolvido = true;
          rejeitar(new Error(`Script Python encerrou inesperadamente (código ${codigo}). Verifique se o TikTokLive está instalado (pip install TikTokLive).`));
        }
      });

      setTimeout(() => {
        if (!resolvido) {
          resolvido = true;
          resolver();
        }
      }, 5_000);
    });
  }

  onComment(callback: CallbackComentario): void {
    this.callbacks.push(callback);
  }

  async disconnect(): Promise<void> {
    this.processo?.kill("SIGTERM");
    this.processo = null;
  }

  private processarSaida(saida: string): void {
    for (const linha of saida.split("\n")) {
      if (!linha.trim()) continue;

      try {
        const evento = JSON.parse(linha);
        if (evento.tipo !== "comentario") continue;

        const comentario = {
          ...evento.dados,
          timestamp: new Date(evento.dados.timestamp)
        } satisfies ComentarioLive;

        for (const callback of this.callbacks) {
          callback(comentario);
        }
      } catch (erro) {
        console.error("[TikTokLivePython] Não foi possível interpretar saída:", erro);
      }
    }
  }
}
