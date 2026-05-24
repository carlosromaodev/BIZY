import type { FastifyReply, FastifyRequest } from "fastify";
import type { ContextoAplicacao } from "./ContextoAplicacao.js";

export function extrairTokenBearer(authorization?: string | string[]): string | null {
  const valor = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!valor) return null;

  const [tipo, token] = valor.split(/\s+/);
  return tipo?.toLowerCase() === "bearer" && token ? token : null;
}

export async function exigirUsuarioAutenticado(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  mensagem = "Faça login para continuar."
) {
  const usuario = await contexto.autenticacaoTelefone.obterSessao(extrairTokenBearer(request.headers.authorization));

  if (!usuario) {
    await reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem });
    return null;
  }

  return usuario;
}
