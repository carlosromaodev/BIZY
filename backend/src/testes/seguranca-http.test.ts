import type { FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";
import { extrairTokenAutenticacao } from "../infra/http/seguranca.js";

describe("segurança HTTP", () => {
  it("aceita token na query apenas para SSE /eventos", () => {
    const requestEventos = {
      headers: {},
      url: "/eventos?token=jwt-sse"
    } as FastifyRequest;
    const requestRotaNormal = {
      headers: {},
      url: "/clientes?token=jwt-sse"
    } as FastifyRequest;

    expect(extrairTokenAutenticacao(requestEventos)).toBe("jwt-sse");
    expect(extrairTokenAutenticacao(requestRotaNormal)).toBeNull();
  });
});
