import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TikTokLiveConnectorProvider } from "../infra/provedores/TikTokLiveConnectorProvider.js";

const mockTikTok = vi.hoisted(() => ({
  instancias: [] as any[],
  chamadasConnect: 0,
  opcoes: [] as any[],
  erroConnect: null as Error | null
}));

vi.mock("tiktok-live-connector", async () => {
  const { EventEmitter } = await import("node:events");

  class FakeTikTokLiveConnection extends EventEmitter {
    username: string;

    constructor(username: string, options?: Record<string, unknown>) {
      super();
      this.username = username;
      mockTikTok.instancias.push(this);
      mockTikTok.opcoes.push(options ?? {});
    }

    async connect() {
      mockTikTok.chamadasConnect += 1;

      if (mockTikTok.erroConnect) {
        throw mockTikTok.erroConnect;
      }

      if (mockTikTok.chamadasConnect > 1) {
        throw new Error("Websocket connection failed, Error: Unexpected server response: 200");
      }
    }

    async disconnect() {
      this.removeAllListeners();
    }
  }

  return {
    TikTokLiveConnection: FakeTikTokLiveConnection,
    WebcastEvent: {
      CHAT: "chat",
      ROOM_USER: "roomUser",
      DISCONNECTED: "disconnected",
      STREAM_END: "streamEnd"
    }
  };
});

describe("TikTokLiveConnectorProvider", () => {
  let erroConsole: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTikTok.instancias.length = 0;
    mockTikTok.chamadasConnect = 0;
    mockTikTok.opcoes.length = 0;
    mockTikTok.erroConnect = null;
    erroConsole = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("trata falha assíncrona de reconexão sem rejeição não capturada", async () => {
    const provider = new TikTokLiveConnectorProvider();

    await provider.connect("@loja_teste");
    mockTikTok.instancias[0].emit("error", new Error("queda websocket"));

    await vi.advanceTimersByTimeAsync(2_001);

    await vi.waitFor(() => {
      expect(mockTikTok.chamadasConnect).toBe(2);
    });
    expect(erroConsole).toHaveBeenCalledWith(
      expect.stringContaining("[TikTokLiveConnector] Falha ao reconectar"),
      expect.any(Error)
    );

    await provider.disconnect();
    await vi.advanceTimersByTimeAsync(4_001);
  });

  it("desativa fallback Euler para evitar erro de permissão no monitoramento da live", async () => {
    const provider = new TikTokLiveConnectorProvider();

    await provider.connect("@loja_teste");

    expect(mockTikTok.opcoes[0]).toEqual(
      expect.objectContaining({
        disableEulerFallbacks: true,
        processInitialData: false
      })
    );

    await provider.disconnect();
  });

  it("não fica reconectando quando o TikTok indica conta inexistente ou live offline", async () => {
    const provider = new TikTokLiveConnectorProvider();

    await provider.connect("@loja_teste");
    mockTikTok.instancias[0].emit("error", new Error("API Error 19881007 (user_not_found)"));

    await vi.advanceTimersByTimeAsync(35_000);

    expect(mockTikTok.chamadasConnect).toBe(1);
    expect(erroConsole).toHaveBeenCalledWith(
      expect.stringContaining("[TikTokLiveConnector] Reconexão interrompida")
    );

    await provider.disconnect();
  });

  it("não agenda reconexão quando a transmissão é encerrada", async () => {
    const provider = new TikTokLiveConnectorProvider();

    await provider.connect("@loja_teste");
    mockTikTok.instancias[0].emit("streamEnd");

    await vi.advanceTimersByTimeAsync(35_000);

    expect(mockTikTok.chamadasConnect).toBe(1);

    await provider.disconnect();
  });

  it("extrai dados de perfil disponíveis no evento de comentário", async () => {
    const provider = new TikTokLiveConnectorProvider();
    const comentarios: unknown[] = [];

    provider.onComment((comentario) => comentarios.push(comentario));

    await provider.connect("@loja_teste");
    mockTikTok.instancias[0].emit("chat", {
      uniqueId: "cliente_profile",
      nickname: "Cliente Perfil",
      userId: "tiktok-user-7788",
      avatarThumb: { urlList: ["https://cdn.exemplo.ao/avatar/perfil.jpg"] },
      comment: "quero 923456789 peca 88",
      createTime: 1_764_262_800
    });

    expect(comentarios).toEqual([
      expect.objectContaining({
        username: "cliente_profile",
        displayName: "Cliente Perfil",
        userId: "tiktok-user-7788",
        avatarUrl: "https://cdn.exemplo.ao/avatar/perfil.jpg"
      })
    ]);

    await provider.disconnect();
  });

  it("preserva perfil TikTok completo e evento bruto no comentário normalizado", async () => {
    const provider = new TikTokLiveConnectorProvider();
    const comentarios: any[] = [];

    provider.onComment((comentario) => comentarios.push(comentario));

    await provider.connect("@loja_teste");
    mockTikTok.instancias[0].emit("chat", {
      uniqueId: "cliente_rico",
      nickname: "Cliente Rico",
      userId: "tiktok-user-rico",
      avatarThumb: { urlList: ["https://cdn.exemplo.ao/avatar/rico.jpg"] },
      comment: "quero 923456789 peca 88",
      userIdentity: {
        isFollowerOfAnchor: true,
        isGiftGiverOfAnchor: true,
        isSubscriberOfAnchor: false
      },
      user: {
        userId: "tiktok-user-rico",
        secUid: "sec-rico",
        uniqueId: "cliente_rico",
        nickname: "Cliente Rico",
        bioDescription: "Bio pública do TikTok",
        verified: true,
        followInfo: {
          followerCount: "4815",
          followingCount: "120",
          followStatus: "following"
        },
        badges: [{ id: "badge-top" }],
        ecommerceEntrance: { shopEntranceInfo: { storeLabel: "buyer" } }
      }
    });

    expect(comentarios[0]).toEqual(
      expect.objectContaining({
        perfilUsuario: expect.objectContaining({
          identidade: expect.objectContaining({
            secUid: "sec-rico",
            uniqueId: "cliente_rico"
          }),
          perfil: expect.objectContaining({
            bioDescription: "Bio pública do TikTok",
            followerCount: "4815"
          }),
          relacaoComHost: expect.objectContaining({
            isFollowerOfAnchor: true,
            isGiftGiverOfAnchor: true
          }),
          rawUser: expect.objectContaining({
            secUid: "sec-rico"
          })
        }),
        eventoBruto: expect.objectContaining({
          comment: "quero 923456789 peca 88"
        })
      })
    );

    await provider.disconnect();
  });

  it("emite espectadores atuais a partir do evento roomUser", async () => {
    const provider = new TikTokLiveConnectorProvider();
    const metricas: unknown[] = [];

    provider.onMetrics((evento) => metricas.push(evento));

    await provider.connect("@loja_teste");
    mockTikTok.instancias[0].emit("roomUser", {
      viewerCount: 312,
      ranksList: []
    });

    expect(metricas).toEqual([
      expect.objectContaining({
        espectadoresAtuais: 312
      })
    ]);

    await provider.disconnect();
  });
});
