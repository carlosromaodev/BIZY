import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ContextoAplicacao } from "../../../../infra/http/ContextoAplicacao.js";
import { resolverSessaoJwt } from "../../../../infra/http/seguranca.js";

const COOKIE_CONTA = "bizy_conta_sessao";
const COOKIE_COMMERCE = "bizy_commerce_session";

export function obterTokenSessaoConta(request: FastifyRequest): string | null {
  return request.cookies?.[COOKIE_CONTA] ?? null;
}

export function obterTokenSessaoCommerce(request: FastifyRequest): string | null {
  return request.cookies?.[COOKIE_COMMERCE] ?? null;
}

export function definirCookieSessaoCommerce(reply: FastifyReply, token: string, expiraEm: Date): void {
  reply.setCookie(COOKIE_COMMERCE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    priority: "high",
    maxAge: Math.max(1, Math.floor((expiraEm.getTime() - Date.now()) / 1000)),
    expires: expiraEm
  });
}

export function definirCookieConta(reply: FastifyReply, token: string, expiraEm: Date): void {
  reply.setCookie(COOKIE_CONTA, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    priority: "high",
    maxAge: Math.max(1, Math.floor((expiraEm.getTime() - Date.now()) / 1000)),
    expires: expiraEm
  });
}

export function limparCookieConta(reply: FastifyReply): void {
  reply.setCookie(COOKIE_CONTA, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    priority: "high",
    maxAge: 0,
    expires: new Date(0)
  });
}

export function obterTokenCompra(request: FastifyRequest): string | null {
  const valor = request.headers["x-bizy-compra-token"];
  return Array.isArray(valor) ? valor[0] ?? null : valor ?? null;
}

export function obterTokenCarrinho(request: FastifyRequest): string | null {
  const valor = request.headers["x-bizy-cart-token"];
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

export function metadadosAcesso(request: FastifyRequest) {
  const segredo = process.env.AUTH_SECRET ?? "";
  const dispositivo = request.headers["x-bizy-device-id"];
  const dispositivoId = Array.isArray(dispositivo) ? dispositivo[0] : dispositivo;
  return {
    dispositivoHash: dispositivoId ? hash(`${segredo}:device:${dispositivoId}`) : null,
    ipHash: request.ip ? hash(`${segredo}:ip:${request.ip}`) : null,
    userAgent: request.headers["user-agent"]?.slice(0, 500) ?? null
  };
}

export async function resolverContaAutenticada(contexto: ContextoAplicacao, request: FastifyRequest) {
  const sessaoConta = await contexto.contaBizy.obterSessao(obterTokenSessaoConta(request));
  if (sessaoConta) return sessaoConta;

  const sessaoInterna = await resolverSessaoJwt(request);
  const usuario = sessaoInterna
    ? await contexto.autenticacaoTelefone.obterSessao(sessaoInterna.tokenInterno, {
        usuarioId: sessaoInterna.usuarioId,
        sessaoId: sessaoInterna.sessaoId
      })
    : null;
  if (!usuario) return null;
  const conta = await contexto.contaBizy.garantirContaUsuario(usuario);
  return { conta, sessao: null };
}

export async function exigirContaAutenticada(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const resultado = await resolverContaAutenticada(contexto, request);
  if (!resultado) {
    await reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem: "Inicie sessao para aceder as suas compras." });
    return null;
  }
  return resultado;
}

function hash(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}
