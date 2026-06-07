import type { LiveCommentProvider } from "../../dominio/provedores/LiveCommentProvider.js";
import type { ComentarioLive, MetricasLive } from "../../dominio/tipos.js";

type CallbackComentario = (comment: ComentarioLive) => void;
type CallbackMetricas = (metricas: MetricasLive) => void;

export class TikTokLiveConnectorProvider implements LiveCommentProvider {
  private callbacks: CallbackComentario[] = [];
  private callbacksMetricas: CallbackMetricas[] = [];
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

  onMetrics(callback: CallbackMetricas): void {
    this.callbacksMetricas.push(callback);
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

    const opcoes: Record<string, unknown> = {
      disableEulerFallbacks: true,
      processInitialData: false,
      enableExtendedGiftInfo: false,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 1_000,
      requestHeaders: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      }
    };

    const agentProxy = await this.criarAgentProxy();
    if (agentProxy) {
      opcoes.webClientOptions = { httpsAgent: agentProxy, timeout: 15_000 };
      opcoes.websocketOptions = { agent: agentProxy, timeout: 15_000 };
      console.log("[TikTokLiveConnector] Proxy configurado:", process.env.TIKTOK_PROXY_URL?.replace(/\/\/.*@/, "//***@"));
    } else {
      opcoes.webClientOptions = { timeout: 15_000 };
    }

    const sessionId = process.env.TIKTOK_SESSION_ID?.trim();
    if (sessionId) {
      opcoes.sessionId = sessionId;
    }

    this.conexao = new ConexaoTikTok(this.liveUsername, opcoes);

    this.conexao.on(eventosTikTok.CHAT ?? "chat", (dados: any) => {
      const comentario = this.normalizarComentario(dados);
      for (const callback of this.callbacks) {
        callback(comentario);
      }
    });

    this.conexao.on(eventosTikTok.ROOM_USER ?? "roomUser", (dados: any) => {
      const metricas = this.normalizarMetricasRoomUser(dados);
      if (!metricas) return;

      for (const callback of this.callbacksMetricas) {
        callback(metricas);
      }
    });

    this.conexao.on(eventosTikTok.DISCONNECTED ?? "disconnected", () => this.agendarReconexao("desconectado"));
    this.conexao.on(eventosTikTok.STREAM_END ?? "streamEnd", () => this.encerrarReconexaoTerminal("live-encerrada"));
    this.conexao.on("error", (erro: unknown) => {
      console.error("[TikTokLiveConnector] Erro no provider:", erro);
      if (this.erroImpedeReconexao(erro)) {
        this.encerrarReconexaoTerminal("erro-terminal");
        return;
      }

      this.agendarReconexao("erro-provider");
    });

    try {
      const estado = await this.conexao.connect();
      this.emitirMetricasRoomInfo(estado?.roomInfo ?? this.conexao?.roomInfo);
      this.tentativasReconexao = 0;
      console.log(`[TikTokLiveConnector] Conectado com sucesso a @${this.liveUsername}`);
    } catch (erro) {
      const msg = this.textoErro(erro).toLowerCase();

      if (this.erroDeRede(msg)) {
        const dica = agentProxy
          ? "O proxy configurado não consegue alcançar os servidores do TikTok."
          : "A VPS provavelmente tem o IP bloqueado pelo TikTok. Configure TIKTOK_PROXY_URL com um proxy residencial.";
        console.error(`[TikTokLiveConnector] Erro de rede: ${msg.slice(0, 200)}`);
        throw new Error(`Falha de rede ao conectar ao TikTok Live (@${this.liveUsername}). ${dica}`);
      }

      if (msg.includes("user_not_found") || msg.includes("invaliduniqueiderror")) {
        throw new Error(`Utilizador TikTok "@${this.liveUsername}" não encontrado. Verifique se o username está correcto.`);
      }

      if (msg.includes("isn't online") || msg.includes("is not online") || msg.includes("userofflineerror")) {
        throw new Error(`@${this.liveUsername} não está em live neste momento.`);
      }

      if (msg.includes("403") || msg.includes("forbidden") || msg.includes("failed to fetch available gifts")) {
        const dica = agentProxy
          ? "O proxy configurado está a ser bloqueado pelo TikTok. Experimente outro proxy residencial."
          : "O IP deste servidor está bloqueado pelo TikTok (erro 403). Configure TIKTOK_PROXY_URL com um proxy residencial no .env.";
        throw new Error(`TikTok bloqueou o acesso (403) ao conectar a @${this.liveUsername}. ${dica}`);
      }

      throw erro;
    }
  }

  private async criarAgentProxy(): Promise<unknown | null> {
    const proxyUrl = process.env.TIKTOK_PROXY_URL?.trim();
    if (!proxyUrl) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = await (Function('return import("https-proxy-agent")')() as Promise<any>);
      const Agent = mod.HttpsProxyAgent ?? mod.default?.HttpsProxyAgent ?? mod.default;
      return new Agent(proxyUrl);
    } catch (erro) {
      console.error("[TikTokLiveConnector] Falha ao criar agente proxy:", erro);
      return null;
    }
  }

  private erroDeRede(msg: string): boolean {
    return [
      "enotfound", "econnrefused", "etimedout", "enetunreach",
      "econnreset", "epipe", "ehostunreach", "socket hang up",
      "network", "timeout", "getaddrinfo"
    ].some((indicador) => msg.includes(indicador));
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
      timestamp,
      perfilUsuario: this.normalizarPerfilUsuario(dados, usuario, { username, userId, displayName, avatarUrl }),
      eventoBruto: this.clonarObjetoJson(dados)
    };
  }

  private normalizarPerfilUsuario(
    dados: any,
    usuario: any,
    base: { username: string; userId?: string | null; displayName: string; avatarUrl?: string | null }
  ): Record<string, unknown> {
    const followInfo = this.objeto(usuario.followInfo ?? usuario.follow_info ?? dados.followInfo ?? dados.follow_info);
    const relacaoComHost = this.objeto(
      dados.userIdentity ?? dados.userIdentityInfo ?? dados.user_identity ?? usuario.userIdentity ?? usuario.user_identity
    );

    return this.removerVazios({
      provider: "tiktok-live-connector",
      source: "tiktok",
      identidade: this.removerVazios({
        userId: base.userId ?? this.obterString(usuario.userId, usuario.user_id, usuario.id, dados.userId, dados.user_id),
        secUid: this.obterString(usuario.secUid, usuario.sec_uid, dados.secUid, dados.sec_uid),
        uniqueId: this.obterString(usuario.uniqueId, usuario.unique_id, dados.uniqueId, dados.unique_id, base.username),
        nickname: this.obterString(usuario.nickname, usuario.profileName, dados.nickname, base.displayName),
        displayName: base.displayName,
        avatarUrl: base.avatarUrl
      }),
      perfil: this.removerVazios({
        bioDescription: this.obterString(
          usuario.bioDescription,
          usuario.bio_description,
          usuario.signature,
          usuario.bio,
          dados.bioDescription,
          dados.signature
        ),
        verified: this.primeiroDefinido(usuario.verified, dados.verified),
        verifiedReason: this.primeiroDefinido(usuario.verifiedReason, usuario.verified_reason, dados.verifiedReason),
        verifiedContent: this.primeiroDefinido(usuario.verifiedContent, usuario.verified_content, dados.verifiedContent),
        followerCount: this.primeiroDefinido(
          followInfo.followerCount,
          followInfo.follower_count,
          usuario.followerCount,
          usuario.follower_count,
          dados.followerCount
        ),
        followingCount: this.primeiroDefinido(
          followInfo.followingCount,
          followInfo.following_count,
          usuario.followingCount,
          usuario.following_count,
          dados.followingCount
        ),
        followStatus: this.primeiroDefinido(followInfo.followStatus, followInfo.follow_status, usuario.followStatus),
        createTime: this.primeiroDefinido(usuario.createTime, usuario.create_time, dados.createTime, dados.create_time),
        modifyTime: this.primeiroDefinido(usuario.modifyTime, usuario.modify_time, dados.modifyTime),
        status: this.primeiroDefinido(usuario.status, dados.status),
        userRole: this.primeiroDefinido(usuario.userRole, usuario.user_role, dados.userRole)
      }),
      relacaoComHost,
      badges: this.removerVazios({
        userBadges: this.clonarJsonSeguro(usuario.badges ?? dados.badges),
        newUserBadges: this.clonarJsonSeguro(usuario.newUserBadges ?? dados.newUserBadges),
        badgeImageList: this.clonarJsonSeguro(usuario.badgeImageList ?? dados.badgeImageList),
        fansClub: this.clonarJsonSeguro(usuario.fansClub ?? usuario.fansClubInfo ?? dados.fansClub ?? dados.fansClubInfo),
        subscribeInfo: this.clonarJsonSeguro(usuario.subscribeInfo ?? dados.subscribeInfo)
      }),
      comercio: this.removerVazios({
        enableShowCommerceSale: this.primeiroDefinido(usuario.enableShowCommerceSale, dados.enableShowCommerceSale),
        withFusionShopEntry: this.primeiroDefinido(usuario.withFusionShopEntry, dados.withFusionShopEntry),
        ecommerceEntrance: this.clonarJsonSeguro(usuario.ecommerceEntrance ?? dados.ecommerceEntrance),
        commerceWebcastConfigIds: this.clonarJsonSeguro(
          usuario.commerceWebcastConfigIds ?? dados.commerceWebcastConfigIds
        )
      }),
      rawUser: this.clonarObjetoJson(usuario),
      rawMessageUserIdentity: this.clonarObjetoJson(relacaoComHost)
    });
  }

  private normalizarMetricasRoomUser(dados: any): MetricasLive | null {
    const espectadoresAtuais = this.obterNumero(
      dados.viewerCount,
      dados.viewer_count,
      dados.userCount,
      dados.user_count,
      dados.totalUser,
      dados.total_user
    );

    if (espectadoresAtuais === null) return null;

    return {
      espectadoresAtuais,
      atualizadaEm: new Date()
    };
  }

  private emitirMetricasRoomInfo(roomInfo: any): void {
    if (!roomInfo || typeof roomInfo !== "object") return;

    const dados = roomInfo.data ?? {};
    const stats = roomInfo.stats ?? dados.stats ?? dados.statistics ?? dados.liveRoom?.stats ?? dados.liveRoom?.statistics ?? {};
    const espectadoresAtuais = this.obterNumero(
      roomInfo.viewerCount,
      roomInfo.viewer_count,
      roomInfo.userCount,
      roomInfo.user_count,
      dados.viewerCount,
      dados.viewer_count,
      dados.userCount,
      dados.user_count,
      stats.viewerCount,
      stats.viewer_count,
      stats.userCount,
      stats.user_count,
      stats.totalUser,
      stats.total_user
    );

    if (espectadoresAtuais === null) return;

    for (const callback of this.callbacksMetricas) {
      callback({
        espectadoresAtuais,
        atualizadaEm: new Date()
      });
    }
  }

  private obterString(...valores: unknown[]): string | null {
    for (const valor of valores) {
      if (typeof valor === "string" && valor.trim().length > 0) return valor.trim();
      if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
    }

    return null;
  }

  private obterNumero(...valores: unknown[]): number | null {
    for (const valor of valores) {
      if (typeof valor === "number" && Number.isFinite(valor)) return Math.max(0, Math.floor(valor));
      if (typeof valor === "string" && valor.trim().length > 0) {
        const numero = Number(valor.trim());
        if (Number.isFinite(numero)) return Math.max(0, Math.floor(numero));
      }
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

  private primeiroDefinido(...valores: unknown[]): unknown {
    return valores.find((valor) => valor !== undefined && valor !== null && !(typeof valor === "string" && valor.trim() === ""));
  }

  private objeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
  }

  private removerVazios(objeto: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(objeto).filter(([, valor]) => {
        if (valor === undefined || valor === null) return false;
        if (typeof valor === "string" && valor.trim() === "") return false;
        if (Array.isArray(valor)) return valor.length > 0;
        if (typeof valor === "object") return Object.keys(valor as Record<string, unknown>).length > 0;
        return true;
      })
    );
  }

  private clonarObjetoJson(valor: unknown): Record<string, unknown> {
    const clonado = this.clonarJsonSeguro(valor);
    return clonado && typeof clonado === "object" && !Array.isArray(clonado) ? clonado as Record<string, unknown> : {};
  }

  private clonarJsonSeguro(valor: unknown): unknown {
    const vistos = new WeakSet<object>();

    try {
      return JSON.parse(
        JSON.stringify(valor, (_chave, item) => {
          if (typeof item === "bigint") return item.toString();
          if (item instanceof Date) return item.toISOString();
          if (typeof item === "function" || typeof item === "symbol") return undefined;
          if (item && typeof item === "object") {
            if (vistos.has(item)) return "[Circular]";
            vistos.add(item);
          }
          return item;
        })
      );
    } catch {
      return {};
    }
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
          if (this.erroImpedeReconexao(erro)) {
            this.desconexaoManual = true;
            console.error(`[TikTokLiveConnector] Reconexão interrompida (${motivo}):`, erro);
            return;
          }

          console.error(`[TikTokLiveConnector] Falha ao reconectar (${motivo}, tentativa ${this.tentativasReconexao}):`, erro);

          if (this.tentativasReconexao >= 10) {
            this.desconexaoManual = true;
            console.error(`[TikTokLiveConnector] Máximo de tentativas atingido (${motivo}). Desistindo.`);
            return;
          }
        }
      }
    } finally {
      this.reconectando = false;
    }
  }

  private encerrarReconexaoTerminal(motivo: string): void {
    this.desconexaoManual = true;
    this.conexao = null;
    console.error(`[TikTokLiveConnector] Reconexão interrompida (${motivo}).`);
  }

  private erroImpedeReconexao(erro: unknown): boolean {
    const texto = this.textoErro(erro).toLowerCase();

    return [
      "user_not_found",
      "api error 19881007",
      "userofflineerror",
      "isn't online",
      "is not online",
      "invaliduniqueiderror",
      "missingroomiderror",
      "lack of permission",
      "disableeulerfallbacks"
    ].some((indicador) => texto.includes(indicador));
  }

  private textoErro(erro: unknown): string {
    if (!erro) return "";
    if (erro instanceof Error) {
      const extras = [
        erro.name,
        erro.message,
        erro.stack,
        ...this.extrairTextosDeErrosInternos((erro as Error & { errors?: unknown }).errors)
      ];
      return extras.filter(Boolean).join(" ");
    }

    if (typeof erro === "object") {
      const objeto = erro as Record<string, unknown>;
      return [
        this.textoErro(objeto.exception),
        this.textoErro(objeto.error),
        this.textoErro(objeto.cause),
        this.extrairTextosDeErrosInternos(objeto.errors).join(" "),
        this.serializarErro(objeto)
      ]
        .filter(Boolean)
        .join(" ");
    }

    return String(erro);
  }

  private serializarErro(valor: unknown): string {
    try {
      return JSON.stringify(valor);
    } catch {
      return "";
    }
  }

  private extrairTextosDeErrosInternos(erros: unknown): string[] {
    if (!Array.isArray(erros)) return [];
    return erros.map((erro) => this.textoErro(erro)).filter((texto) => texto.length > 0);
  }
}
