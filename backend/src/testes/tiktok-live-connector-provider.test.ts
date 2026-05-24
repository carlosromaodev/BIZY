import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TikTokLiveConnectorProvider } from "../infra/provedores/TikTokLiveConnectorProvider.js";

const mockTikTok = vi.hoisted(() => ({
  instancias: [] as any[],
  chamadasConnect: 0
}));

vi.mock("tiktok-live-connector", async () => {
  const { EventEmitter } = await import("node:events");

  class FakeTikTokLiveConnection extends EventEmitter {
    username: string;

    constructor(username: string) {
      super();
      this.username = username;
      mockTikTok.instancias.push(this);
    }

    async connect() {
      mockTikTok.chamadasConnect += 1;

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
});
