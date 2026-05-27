import { describe, expect, it, vi } from "vitest";
import { criarArmazenamentoRateLimit, criarRateLimit, type ArmazenamentoRateLimit } from "../infra/http/rateLimit.js";

function criarReplyFake() {
  const estado = {
    statusCode: 200,
    headers: new Map<string, string>(),
    body: undefined as unknown
  };

  return {
    estado,
    reply: {
      header(nome: string, valor: string) {
        estado.headers.set(nome, valor);
        return this;
      },
      code(codigo: number) {
        estado.statusCode = codigo;
        return this;
      },
      send(payload: unknown) {
        estado.body = payload;
        return payload;
      }
    }
  };
}

describe("rate limit HTTP", () => {
  it("bloqueia usando armazenamento compartilhado quando configurado", async () => {
    const totais = new Map<string, number>();
    const armazenamento: ArmazenamentoRateLimit = {
      async incrementar(chave, janelaMs, agora) {
        const total = (totais.get(chave) ?? 0) + 1;
        totais.set(chave, total);
        return { total, resetEm: agora + janelaMs };
      }
    };
    const rateLimit = criarRateLimit({
      ativo: true,
      janelaMs: 60_000,
      maximoPorJanela: 1,
      armazenamento
    });
    const request = { ip: "10.0.0.1", method: "GET", url: "/clientes" };

    await rateLimit(request as never, criarReplyFake().reply as never);
    const bloqueado = criarReplyFake();
    await rateLimit(request as never, bloqueado.reply as never);

    expect(bloqueado.estado.statusCode).toBe(429);
    expect(bloqueado.estado.headers.get("Retry-After")).toBe("60");
    expect(bloqueado.estado.body).toMatchObject({ erro: "RATE_LIMIT" });
  });

  it("cria armazenamento Redis REST com token e comandos atómicos por janela", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: 3 }, { result: 1 }]
    }));
    const armazenamento = criarArmazenamentoRateLimit({
      redisRestUrl: "https://redis.example.com",
      redisRestToken: "token-secreto",
      fetchImpl: fetchImpl as never
    });

    const resultado = await armazenamento.incrementar("rate:cliente", 60_000, 120_000);

    expect(resultado).toEqual({ total: 3, resetEm: 180_000 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://redis.example.com/pipeline",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-secreto",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify([
          ["INCR", "rate:cliente:2"],
          ["EXPIRE", "rate:cliente:2", 120]
        ])
      })
    );
  });
});
