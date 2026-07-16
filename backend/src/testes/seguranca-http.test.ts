import type { FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextoAplicacao } from "../infra/http/ContextoAplicacao.js";
import { exigirGovernanteAnani, extrairTokenAutenticacao } from "../infra/http/seguranca.js";

const ambienteOriginal = { ...process.env };

function criarReplyFake() {
  const estado = {
    statusCode: 200,
    payload: null as unknown
  };

  return {
    estado,
    reply: {
      code(statusCode: number) {
        estado.statusCode = statusCode;
        return this;
      },
      async send(payload: unknown) {
        estado.payload = payload;
        return this;
      }
    }
  };
}

describe("segurança HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      AUTH_ALLOW_LEGACY_TOKENS: "true"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("não aceita token em query string e mantém bearer/cookie como canais de sessão", () => {
    const requestEventos = {
      headers: {},
      url: "/eventos?token=jwt-sse"
    } as FastifyRequest;
    const requestCookie = {
      headers: { cookie: "bizy_sessao=jwt-cookie" },
      cookies: { bizy_sessao: "jwt-cookie" },
      url: "/eventos"
    } as unknown as FastifyRequest;
    const requestBearer = {
      headers: { authorization: "Bearer jwt-bearer" },
      url: "/eventos"
    } as FastifyRequest;

    expect(extrairTokenAutenticacao(requestEventos)).toBeNull();
    expect(extrairTokenAutenticacao(requestCookie)).toBe("jwt-cookie");
    expect(extrairTokenAutenticacao(requestBearer)).toBe("jwt-bearer");
  });

  it("restringe acesso direto ao Anani a papeis de governanca da plataforma", async () => {
    const usuarioGovernante = {
      id: "u_gov",
      nome: "Governante",
      telefone: null,
      email: null,
      avatarUrl: null,
      papel: "ADMIN_GERAL",
      origemCadastro: "TELEFONE",
      perfilCompletoEm: null,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(usuarioGovernante)
      }
    } as unknown as ContextoAplicacao;
    const { reply } = criarReplyFake();

    await expect(
      exigirGovernanteAnani(
        contexto,
        { headers: { authorization: "Bearer token-dev" }, url: "/governance/anani/health" } as never,
        reply as never
      )
    ).resolves.toEqual(usuarioGovernante);
  });

  it("bloqueia papel de tenant no acesso direto ao Anani", async () => {
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue({
          id: "u_tenant",
          nome: "Dono",
          telefone: null,
          email: null,
          avatarUrl: null,
          papel: "DONO",
          origemCadastro: "TELEFONE",
          perfilCompletoEm: null,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        })
      }
    } as unknown as ContextoAplicacao;
    const { reply, estado } = criarReplyFake();

    const resultado = await exigirGovernanteAnani(
      contexto,
      { headers: { authorization: "Bearer token-dev" }, url: "/governance/anani/health" } as never,
      reply as never
    );

    expect(resultado).toBeNull();
    expect(estado.statusCode).toBe(403);
    expect(estado.payload).toEqual(expect.objectContaining({ erro: "ANANI_RESTRITO_GOVERNANCA" }));
  });
});
