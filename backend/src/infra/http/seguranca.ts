import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify, SignJWT } from "jose";
import { papelPodeGovernarAnani } from "../../anani/policies/AnaniPolicyEngine.js";
import type { ContextoAplicacao } from "./ContextoAplicacao.js";

const NOME_COOKIE_SESSAO_PADRAO = "bizy_sessao";
const ISSUER_JWT_PADRAO = "bizy-api";
const AUDIENCE_JWT_PADRAO = "bizy-web";
const TIPO_TOKEN_SESSAO = "bizy-session";

export interface PayloadJwtSessao {
  sub: string;
  sid: string;
  jti: string;
  typ: typeof TIPO_TOKEN_SESSAO;
  iss: string;
  aud: string;
  iat?: number;
  exp?: number;
}

export interface IdentificadorSessaoAutenticada {
  tokenInterno: string;
  usuarioId?: string;
  sessaoId?: string;
}

type SameSiteCookie = "lax" | "none" | "strict" | boolean;

interface OpcoesCookieSessao {
  path: string;
  httpOnly: boolean;
  sameSite: SameSiteCookie;
  secure: boolean;
  priority: "high";
  maxAge?: number;
  expires?: Date;
}

export function extrairTokenBearer(authorization?: string | string[]): string | null {
  const valor = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!valor) return null;

  const [tipo, token] = valor.split(/\s+/);
  return tipo?.toLowerCase() === "bearer" && token ? token : null;
}

export function obterNomeCookieSessao(): string {
  return process.env.AUTH_COOKIE_NAME?.trim() || NOME_COOKIE_SESSAO_PADRAO;
}

export function obterJwtIssuer(): string {
  return process.env.AUTH_JWT_ISSUER?.trim() || ISSUER_JWT_PADRAO;
}

export function obterJwtAudience(): string {
  return process.env.AUTH_JWT_AUDIENCE?.trim() || AUDIENCE_JWT_PADRAO;
}

export function obterSegredoJwt(): string {
  const segredo = process.env.AUTH_JWT_SECRET ?? process.env.AUTH_SECRET;
  if (!segredo) {
    throw new Error("AUTH_JWT_SECRET ou AUTH_SECRET não configurado. Defina a variável de ambiente.");
  }
  return segredo;
}

export async function assinarJwtSessao(dados: {
  usuarioId: string;
  sessaoId: string;
  tokenInterno: string;
  expiraEm: Date;
}): Promise<string> {
  return new SignJWT({
    sid: dados.sessaoId,
    typ: TIPO_TOKEN_SESSAO
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(dados.usuarioId)
    .setJti(dados.tokenInterno)
    .setIssuer(obterJwtIssuer())
    .setAudience(obterJwtAudience())
    .setIssuedAt()
    .setExpirationTime(Math.max(1, Math.floor(dados.expiraEm.getTime() / 1000)))
    .sign(obterChaveJwt());
}

export function calcularTtlSessao(expiraEm: Date): number {
  return Math.max(1, Math.floor((expiraEm.getTime() - Date.now()) / 1000));
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
  return extrairTokenBearer(request.headers.authorization)
    ?? obterCookieSessaoRequest(request);
}

export async function resolverSessaoJwt(request: FastifyRequest): Promise<IdentificadorSessaoAutenticada | null> {
  const token = extrairTokenAutenticacao(request);
  if (!token) return null;

  if (!temFormatoJwt(token)) {
    return tokenLegadoPermitido() ? { tokenInterno: token } : null;
  }

  try {
    const { payload } = await jwtVerify(token, obterChaveJwt(), {
      issuer: obterJwtIssuer(),
      audience: obterJwtAudience()
    });
    if (!payloadJwtSessaoValido(payload)) return null;

    return {
      tokenInterno: payload.jti,
      usuarioId: payload.sub,
      sessaoId: payload.sid
    };
  } catch {
    return null;
  }
}

export function definirCookieSessao(reply: FastifyReply, token: string, expiraEm: Date): void {
  reply.setCookie(obterNomeCookieSessao(), token, criarOpcoesCookieSessao(expiraEm));
}

export function limparCookieSessao(reply: FastifyReply): void {
  reply.setCookie(obterNomeCookieSessao(), "", {
    ...criarOpcoesCookieBase(),
    maxAge: 0,
    expires: new Date(0)
  });
}

export function criarCookieSessao(token: string, expiraEm: Date): string {
  return serializarCookie(obterNomeCookieSessao(), token, criarOpcoesCookieSessao(expiraEm));
}

export function criarCookieSessaoExpirado(): string {
  return serializarCookie(obterNomeCookieSessao(), "", {
    ...criarOpcoesCookieBase(),
    maxAge: 0,
    expires: new Date(0)
  });
}

export async function exigirUsuarioAutenticado(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  mensagem = "Faça login para continuar."
) {
  const sessao = await resolverSessaoJwt(request);
  const usuario = sessao
    ? await contexto.autenticacaoTelefone.obterSessao(
        sessao.tokenInterno,
        sessao.usuarioId && sessao.sessaoId
          ? {
              usuarioId: sessao.usuarioId,
              sessaoId: sessao.sessaoId
            }
          : {}
      )
    : null;

  if (!usuario) {
    await reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem });
    return null;
  }

  return usuario;
}

export async function exigirGovernanteAnani(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const usuario = await exigirUsuarioAutenticado(
    contexto,
    request,
    reply,
    "Faça login com uma conta de governança Bizy para acessar a Anani."
  );
  if (!usuario) return null;

  if (!papelPodeGovernarAnani(usuario.papel)) {
    await reply.code(403).send({
      erro: "ANANI_RESTRITO_GOVERNANCA",
      mensagem: "Acesso direto à Anani é restrito a GOVERNANTE_BIZY, ADMIN_GERAL ou SUPER_ADMIN_PLATFORM."
    });
    return null;
  }

  return usuario;
}

function temFormatoJwt(token: string): boolean {
  return token.split(".").length === 3;
}

function tokenLegadoPermitido(): boolean {
  return process.env.AUTH_ALLOW_LEGACY_TOKENS === "true";
}

function obterChaveJwt() {
  return new TextEncoder().encode(obterSegredoJwt());
}

function obterCookieSessaoRequest(request: FastifyRequest): string | null {
  const cookieDecorado = request.cookies?.[obterNomeCookieSessao()];
  return cookieDecorado ?? extrairTokenCookie(request.headers.cookie);
}

function payloadJwtSessaoValido(payload: unknown): payload is PayloadJwtSessao {
  if (!payload || typeof payload !== "object") return false;
  const candidato = payload as Record<string, unknown>;

  return Boolean(
    typeof candidato.sub === "string" &&
      typeof candidato.sid === "string" &&
      typeof candidato.jti === "string" &&
      candidato.typ === TIPO_TOKEN_SESSAO &&
      candidato.iss === obterJwtIssuer() &&
      candidato.aud === obterJwtAudience()
  );
}

function criarOpcoesCookieSessao(expiraEm: Date): OpcoesCookieSessao {
  return {
    ...criarOpcoesCookieBase(),
    maxAge: calcularTtlSessao(expiraEm),
    expires: expiraEm
  };
}

function criarOpcoesCookieBase(): OpcoesCookieSessao {
  return {
    path: "/",
    httpOnly: true,
    sameSite: obterSameSiteCookie(),
    secure: cookieSeguro(),
    priority: "high"
  };
}

function obterSameSiteCookie(): "lax" | "none" | "strict" {
  const valor = process.env.AUTH_COOKIE_SAMESITE?.trim().toLowerCase();
  return valor === "none" || valor === "strict" ? valor : "lax";
}

function cookieSeguro(): boolean {
  return process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
}

function serializarCookie(nome: string, valor: string, opcoes: OpcoesCookieSessao): string {
  const partes = [
    `${nome}=${encodeURIComponent(valor)}`,
    `Path=${opcoes.path ?? "/"}`,
    `Max-Age=${opcoes.maxAge ?? 0}`,
    `Expires=${(opcoes.expires ?? new Date(0)).toUTCString()}`,
    "HttpOnly",
    `SameSite=${normalizarSameSiteCabecalho(opcoes.sameSite)}`,
    "Priority=High"
  ];

  if (opcoes.secure) {
    partes.push("Secure");
  }

  return partes.join("; ");
}

function normalizarSameSiteCabecalho(valor: SameSiteCookie): string {
  if (valor === "none") return "None";
  if (valor === "strict" || valor === true) return "Strict";
  return "Lax";
}
