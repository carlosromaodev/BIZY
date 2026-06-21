export interface MensagemInstagram {
  instancia: string;
  userId?: string | null;
  username?: string | null;
  texto?: string | null;
  mediaUrl?: string | null;
  contexto?: unknown;
}

export interface ResultadoEnvioInstagram {
  idExterno: string;
  provider: "instagrapi";
  enviadoEm: Date;
}

export interface LoginInstagramRequest {
  instancia: string;
  username: string;
  password: string;
  negocioId?: string | null;
  verificationCode?: string | null;
}

export interface LoginInstagramResult {
  ok: boolean;
  instancia: string;
  username: string;
  userId?: string;
  status: string;
}

export interface StatusInstanciaInstagram {
  instancia: string;
  username: string;
  status: string;
  ultimoErro: string | null;
  ultimaPollEm: string | null;
}

interface OpcoesProvedorInstagram {
  bridgeUrl: string;
  bridgeToken: string;
  tentativas?: number;
  intervaloRetryMs?: number;
}

export class ProvedorInstagramInstagrapi {
  private readonly bridgeUrl: string;
  private readonly bridgeToken: string;
  private readonly tentativas: number;
  private readonly intervaloRetryMs: number;

  constructor(opcoes: OpcoesProvedorInstagram) {
    this.bridgeUrl = opcoes.bridgeUrl.replace(/\/+$/, "");
    this.bridgeToken = opcoes.bridgeToken;
    this.tentativas = Math.max(1, Math.min(opcoes.tentativas ?? 3, 5));
    this.intervaloRetryMs = Math.max(0, opcoes.intervaloRetryMs ?? 1_000);
  }

  async enviarMensagem(mensagem: MensagemInstagram): Promise<ResultadoEnvioInstagram> {
    if (!mensagem.userId && !mensagem.username) {
      throw new Error("Forneça userId ou username do destinatário Instagram.");
    }
    if (!mensagem.texto && !mensagem.mediaUrl) {
      throw new Error("Forneça texto ou mediaUrl para enviar via Instagram.");
    }

    const body = {
      instancia: mensagem.instancia,
      user_id: mensagem.userId ?? null,
      username: mensagem.username ?? null,
      text: mensagem.texto ?? null,
      media_url: mensagem.mediaUrl ?? null
    };

    const resposta = await this.enviarComRetry(async () => {
      const response = await fetch(`${this.bridgeUrl}/send-dm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.bridgeToken ? { "X-Bridge-Token": this.bridgeToken } : {})
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000)
      });

      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      return { ok: response.ok, status: response.status, payload };
    });

    if (!resposta.ok) {
      const detalhe = typeof resposta.payload.detail === "string" ? resposta.payload.detail : JSON.stringify(resposta.payload);
      throw new Error(`Instagram Bridge rejeitou envio: ${resposta.status} ${detalhe}`.trim());
    }

    return {
      idExterno: typeof resposta.payload.messageId === "string" ? resposta.payload.messageId : `ig_${Date.now()}`,
      provider: "instagrapi",
      enviadoEm: new Date()
    };
  }

  async consultarPerfil(instancia: string, username: string): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(`${this.bridgeUrl}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.bridgeToken ? { "X-Bridge-Token": this.bridgeToken } : {})
        },
        body: JSON.stringify({ instancia, username }),
        signal: AbortSignal.timeout(15_000)
      });
    } catch (erro) {
      throw new Error(
        `Instagram Bridge inacessível (${erro instanceof Error ? erro.message : "fetch failed"}). Verifique se o serviço está em execução.`
      );
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(typeof payload.detail === "string" ? payload.detail : `Erro ao consultar perfil (${response.status}).`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  async consultarStatus(): Promise<{ instancias: StatusInstanciaInstagram[] }> {
    let response: Response;
    try {
      response = await fetch(`${this.bridgeUrl}/status`, {
        headers: this.bridgeToken ? { "X-Bridge-Token": this.bridgeToken } : {},
        signal: AbortSignal.timeout(10_000)
      });
    } catch (erro) {
      throw new Error(
        `Instagram Bridge inacessível (${erro instanceof Error ? erro.message : "fetch failed"}). Verifique se o serviço está em execução.`
      );
    }

    if (!response.ok) {
      throw new Error(`Instagram Bridge respondeu com erro ${response.status}.`);
    }

    return response.json() as Promise<{ instancias: StatusInstanciaInstagram[] }>;
  }

  async login(dados: LoginInstagramRequest): Promise<LoginInstagramResult> {
    const body = {
      instancia: dados.instancia,
      username: dados.username,
      password: dados.password,
      negocio_id: dados.negocioId ?? null,
      verification_code: dados.verificationCode ?? null
    };

    let response: Response;
    try {
      response = await fetch(`${this.bridgeUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.bridgeToken ? { "X-Bridge-Token": this.bridgeToken } : {})
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000)
      });
    } catch (erro) {
      throw new Error(
        `Instagram Bridge inacessível (${erro instanceof Error ? erro.message : "fetch failed"}). Verifique se o serviço instagrapi-bridge está em execução.`
      );
    }

    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;

    if (!response.ok) {
      const detalhe = typeof payload.detail === "string" ? payload.detail : "Erro de login no Instagram.";
      const erro = new Error(detalhe) as Error & { statusCode: number };
      erro.statusCode = response.status;
      throw erro;
    }

    return {
      ok: true,
      instancia: dados.instancia,
      username: dados.username,
      userId: typeof payload.user_id === "string" ? payload.user_id : undefined,
      status: typeof payload.status === "string" ? payload.status : "CONECTADA"
    };
  }

  async logout(instancia: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${this.bridgeUrl}/logout?instancia=${encodeURIComponent(instancia)}`, {
        method: "POST",
        headers: this.bridgeToken ? { "X-Bridge-Token": this.bridgeToken } : {},
        signal: AbortSignal.timeout(15_000)
      });
    } catch (erro) {
      throw new Error(
        `Instagram Bridge inacessível ao desconectar (${erro instanceof Error ? erro.message : "fetch failed"}).`
      );
    }

    if (!response.ok && response.status !== 404) {
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(typeof payload.detail === "string" ? payload.detail : "Erro ao desconectar Instagram.");
    }
  }

  private async enviarComRetry<T extends { ok: boolean; status: number }>(operacao: () => Promise<T>): Promise<T> {
    let ultimoResultado: T | null = null;

    for (let tentativa = 0; tentativa < this.tentativas; tentativa += 1) {
      ultimoResultado = await operacao();
      // Sucesso ou erro de cliente (4xx) — não vale a pena repetir
      if (ultimoResultado.ok || ultimoResultado.status < 500 || tentativa === this.tentativas - 1) {
        return ultimoResultado;
      }
      await aguardar(this.intervaloRetryMs * 2 ** tentativa);
    }

    return ultimoResultado as T;
  }
}

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
