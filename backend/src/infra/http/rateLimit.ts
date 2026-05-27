import type { FastifyReply, FastifyRequest } from "fastify";

export interface ResultadoRateLimit {
  total: number;
  resetEm: number;
}

export interface ArmazenamentoRateLimit {
  incrementar(chave: string, janelaMs: number, agora: number): Promise<ResultadoRateLimit>;
}

interface OpcoesArmazenamentoRateLimit {
  redisRestUrl?: string | null;
  redisRestToken?: string | null;
  fetchImpl?: typeof fetch;
}

interface OpcoesRateLimit {
  ativo: boolean;
  janelaMs: number;
  maximoPorJanela: number;
  maximoPublicoPorJanela?: number;
  armazenamento?: ArmazenamentoRateLimit;
}

interface BaldeRateLimit {
  inicioJanela: number;
  total: number;
}

class ArmazenamentoRateLimitMemoria implements ArmazenamentoRateLimit {
  private readonly baldes = new Map<string, BaldeRateLimit>();

  async incrementar(chave: string, janelaMs: number, agora: number): Promise<ResultadoRateLimit> {
    const balde = this.baldes.get(chave);

    if (!balde || agora - balde.inicioJanela > janelaMs) {
      this.baldes.set(chave, { inicioJanela: agora, total: 1 });
      return { total: 1, resetEm: agora + janelaMs };
    }

    balde.total += 1;
    return { total: balde.total, resetEm: balde.inicioJanela + janelaMs };
  }
}

class ArmazenamentoRateLimitRedisRest implements ArmazenamentoRateLimit {
  private readonly urlBase: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(urlBase: string, token: string, fetchImpl: typeof fetch = fetch) {
    this.urlBase = urlBase.replace(/\/+$/, "");
    this.token = token;
    this.fetchImpl = fetchImpl;
  }

  async incrementar(chave: string, janelaMs: number, agora: number): Promise<ResultadoRateLimit> {
    const indiceJanela = Math.floor(agora / janelaMs);
    const chaveJanela = `${chave}:${indiceJanela}`;
    const expiraEmSegundos = Math.max(1, Math.ceil((janelaMs * 2) / 1000));

    const resposta = await this.fetchImpl(`${this.urlBase}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", chaveJanela],
        ["EXPIRE", chaveJanela, expiraEmSegundos]
      ])
    });

    if (!resposta.ok) {
      throw new Error(`Redis REST respondeu com status ${resposta.status}.`);
    }

    const payload = (await resposta.json()) as Array<{ result?: unknown }>;
    const total = Number(payload[0]?.result ?? 0);

    if (!Number.isFinite(total)) {
      throw new Error("Redis REST retornou contador inválido para rate limit.");
    }

    return { total, resetEm: (indiceJanela + 1) * janelaMs };
  }
}

export function criarArmazenamentoRateLimit(opcoes: OpcoesArmazenamentoRateLimit = {}): ArmazenamentoRateLimit {
  const redisRestUrl = opcoes.redisRestUrl ?? process.env.RATE_LIMIT_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const redisRestToken =
    opcoes.redisRestToken ?? process.env.RATE_LIMIT_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisRestUrl && redisRestToken) {
    return new ArmazenamentoRateLimitRedisRest(redisRestUrl, redisRestToken, opcoes.fetchImpl);
  }

  return new ArmazenamentoRateLimitMemoria();
}

export function criarRateLimit(opcoes: OpcoesRateLimit) {
  const armazenamento = opcoes.armazenamento ?? criarArmazenamentoRateLimit();
  const fallbackLocal = new ArmazenamentoRateLimitMemoria();

  return async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    if (!opcoes.ativo || request.url.startsWith("/eventos")) return;

    const agora = Date.now();
    const caminho = request.url.split("?")[0];
    const limite = caminho.startsWith("/publico") ? opcoes.maximoPublicoPorJanela ?? opcoes.maximoPorJanela : opcoes.maximoPorJanela;
    const chave = `${request.ip}:${request.method}:${caminho}`;
    let resultado: ResultadoRateLimit;

    try {
      resultado = await armazenamento.incrementar(chave, opcoes.janelaMs, agora);
    } catch (erro) {
      request.log.warn({ erro }, "Rate limit distribuído indisponível; usando fallback local.");
      resultado = await fallbackLocal.incrementar(chave, opcoes.janelaMs, agora);
    }

    if (resultado.total > limite) {
      const segundos = Math.ceil((resultado.resetEm - agora) / 1000);
      reply.header("Retry-After", String(Math.max(segundos, 1)));
      return reply.code(429).send({
        erro: "RATE_LIMIT",
        mensagem: "Muitos pedidos em pouco tempo. Tente novamente em instantes."
      });
    }
  };
}
