import type { FastifyReply, FastifyRequest } from "fastify";

interface OpcoesRateLimit {
  ativo: boolean;
  janelaMs: number;
  maximoPorJanela: number;
  maximoPublicoPorJanela?: number;
}

interface BaldeRateLimit {
  inicioJanela: number;
  total: number;
}

export function criarRateLimit(opcoes: OpcoesRateLimit) {
  const baldes = new Map<string, BaldeRateLimit>();

  return async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    if (!opcoes.ativo || request.url.startsWith("/eventos")) return;

    const agora = Date.now();
    const caminho = request.url.split("?")[0];
    const limite = caminho.startsWith("/publico") ? opcoes.maximoPublicoPorJanela ?? opcoes.maximoPorJanela : opcoes.maximoPorJanela;
    const chave = `${request.ip}:${request.method}:${caminho}`;
    const balde = baldes.get(chave);

    if (!balde || agora - balde.inicioJanela > opcoes.janelaMs) {
      baldes.set(chave, { inicioJanela: agora, total: 1 });
      return;
    }

    balde.total += 1;

    if (balde.total > limite) {
      const segundos = Math.ceil((opcoes.janelaMs - (agora - balde.inicioJanela)) / 1000);
      reply.header("Retry-After", String(Math.max(segundos, 1)));
      return reply.code(429).send({
        erro: "RATE_LIMIT",
        mensagem: "Muitos pedidos em pouco tempo. Tente novamente em instantes."
      });
    }
  };
}
