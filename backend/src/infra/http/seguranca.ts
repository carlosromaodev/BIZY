import type { FastifyReply, FastifyRequest } from "fastify";
import type { ContextoAplicacao } from "./ContextoAplicacao.js";

const NOME_COOKIE_SESSAO_PADRAO = "bizy_sessao";

export function extrairTokenBearer(authorization?: string | string[]): string | null {
  const valor = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!valor) return null;

  const [tipo, token] = valor.split(/\s+/);
  return tipo?.toLowerCase() === "bearer" && token ? token : null;
}

export function obterNomeCookieSessao(): string {
  return process.env.AUTH_COOKIE_NAME?.trim() || NOME_COOKIE_SESSAO_PADRAO;
}

export function extrairTokenCookie(cookie?: string | string[] | null, nome = obterNomeCookieSessao()): string | null {
  const valor = Array.isArray(cookie) ? cookie.join("; ") : cookie;
  if (!valor) return null;

  for (const parte of valor.split(";")) {
    const [chave, ...restante] = parte.trim().split("=");
    if (chave !== nome || restante.length === 0) continue;

    const token = restante.join("=");
    try {
      return decodeURIComponent(token);
    } catch {
      return token;
    }
  }

  return null;
}

export function extrairTokenAutenticacao(request: FastifyRequest): string | null {
  return extrairTokenBearer(request.headers.authorization) ?? extrairTokenCookie(request.headers.cookie);
}

export function criarCookieSessao(token: string, expiraEm: Date): string {
  const nome = obterNomeCookieSessao();
  const maxAge = Math.max(1, Math.floor((expiraEm.getTime() - Date.now()) / 1000));
  const partes = [
    `${nome}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    `Expires=${expiraEm.toUTCString()}`,
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production") {
    partes.push("Secure");
  }

  return partes.join("; ");
}

export function criarCookieSessaoExpirado(): string {
  const nome = obterNomeCookieSessao();
  const partes = [
    `${nome}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production") {
    partes.push("Secure");
  }

  return partes.join("; ");
}

export async function exigirUsuarioAutenticado(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  mensagem = "Faça login para continuar."
) {
  const usuario = await contexto.autenticacaoTelefone.obterSessao(extrairTokenAutenticacao(request));

  if (!usuario) {
    await reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem });
    return null;
  }

  return usuario;
}
