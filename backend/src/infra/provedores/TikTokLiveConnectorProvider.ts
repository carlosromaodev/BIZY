import type { LiveCommentProvider } from "../../dominio/provedores/LiveCommentProvider.js";
import type { ComentarioLive } from "../../dominio/tipos.js";

type CallbackComentario = (comment: ComentarioLive) => void;

export class TikTokLiveConnectorProvider implements LiveCommentProvider {
  private callbacks: CallbackComentario[] = [];
  private conexao: any = null;
  private liveUsername = "";
  private desconexaoManual = false;
  private tentativasReconexao = 0;
  private reconectando = false;

  async connect(liveUsername: string): Promise<void> {
    this.liveUsername = liveUsername.replace(/^@/, "");
    this.desconexaoManual = false;
    await this.conectarComBiblioteca();
  }

  onComment(callback: CallbackComentario): void {
    this.callbacks.push(callback);
  }

  async disconnect(): Promise<void> {
    this.desconexaoManual = true;

    if (this.conexao?.disconnect) {
      await this.conexao.disconnect();
    }

    this.conexao = null;
  }

  private async conectarComBiblioteca(): Promise<void> {
    const modulo = await import("tiktok-live-connector");
    const ConexaoTikTok = (modulo as any).TikTokLiveConnection ?? (modulo as any).WebcastPushConnection;
    const eventosTikTok = (modulo as any).WebcastEvent ?? {};

    if (!ConexaoTikTok) {
      throw new Error("TikTok-Live-Connector não expôs uma classe de conexão compatível.");
    }

    this.conexao = new ConexaoTikTok(this.liveUsername, {
      processInitialData: true,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 1_000
    });

    this.conexao.on(eventosTikTok.CHAT ?? "chat", (dados: any) => {
      const comentario = this.normalizarComentario(dados);
      for (const callback of this.callbacks) {
        callback(comentario);
      }
    });

    this.conexao.on(eventosTikTok.DISCONNECTED ?? "disconnected", () => this.agendarReconexao("desconectado"));
    this.conexao.on(eventosTikTok.STREAM_END ?? "streamEnd", () => this.agendarReconexao("live-encerrada"));
    this.conexao.on("error", (erro: unknown) => {
      console.error("[TikTokLiveConnector] Erro no provider:", erro);
      this.agendarReconexao("erro-provider");
    });

    await this.conexao.connect();
    this.tentativasReconexao = 0;
  }

  private normalizarComentario(dados: any): ComentarioLive {
    const usuario = dados.user ?? dados.author ?? {};
    const username = this.obterString(dados.uniqueId, usuario.uniqueId, usuario.unique_id) ?? "desconhecido";
    const displayName = this.obterString(dados.nickname, usuario.nickname, usuario.profileName) ?? username;
    const userId = this.obterString(
      dados.userId,
      dados.user_id,
      dados.user_id_str,
      usuario.userId,
      usuario.user_id,
      usuario.user_id_str,
      usuario.id,
      usuario.secUid,
      usuario.sec_uid
    );
    const avatarUrl = this.obterUrlAvatar(
      dados.profilePictureUrl,
      dados.avatarUrl,
      dados.avatarThumb,
      dados.avatarMedium,
      dados.avatarLarger,
      usuario.profilePictureUrl,
      usuario.avatarUrl,
      usuario.avatarThumb,
      usuario.avatarMedium,
      usuario.avatarLarger,
      usuario.profilePicture
    );
    const timestampBase = dados.createTime ?? dados.create_time ?? dados.timestamp;
    const timestamp = timestampBase ? new Date(Number(timestampBase) * 1000) : new Date();

    return {
      source: "tiktok",
      provider: "tiktok-live-connector",
      liveId: `tiktok_${this.liveUsername}`,
      username,
      userId,
      displayName,
      avatarUrl,
      commentText: String(dados.comment ?? dados.content ?? dados.text ?? ""),
      timestamp
    };
  }

  private obterString(...valores: unknown[]): string | null {
    for (const valor of valores) {
      if (typeof valor === "string" && valor.trim().length > 0) return valor.trim();
      if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
    }

    return null;
  }

  private obterUrlAvatar(...valores: unknown[]): string | null {
    for (const valor of valores) {
      const direto = this.obterString(valor);
      if (direto) return direto;

      if (valor && typeof valor === "object") {
        const objeto = valor as Record<string, unknown>;
        const deCampos = this.obterString(objeto.url, objeto.uri, objeto.urlKey);
        if (deCampos) return deCampos;

        const lista = objeto.urlList ?? objeto.urls;
        if (Array.isArray(lista)) {
          const primeiro = this.obterString(...lista);
          if (primeiro) return primeiro;
        }
      }
    }

    return null;
  }

  private agendarReconexao(motivo: string): void {
    if (this.desconexaoManual || this.reconectando) {
      return;
    }

    void this.reconectarSeNecessario(motivo);
  }

  private async reconectarSeNecessario(motivo: string): Promise<void> {
    if (this.desconexaoManual || this.reconectando) {
      return;
    }

    this.reconectando = true;

    try {
      while (!this.desconexaoManual) {
        this.tentativasReconexao += 1;
        const atraso = Math.min(30_000, 2_000 * this.tentativasReconexao);

        await new Promise((resolver) => setTimeout(resolver, atraso));

        if (this.desconexaoManual) {
          return;
        }

        try {
          await this.conectarComBiblioteca();
          return;
        } catch (erro) {
          console.error(`[TikTokLiveConnector] Falha ao reconectar (${motivo}):`, erro);
        }
      }
    } finally {
      this.reconectando = false;
    }
  }
}
