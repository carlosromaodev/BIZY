import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("superficie final do commerce", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RATE_LIMIT_ATIVO: "false"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("nega as superficies privadas sem sessao ou contexto Team", async () => {
    const app = await criarAplicacao();
    try {
      const rotasConta = [
        "/creator/portal",
        "/creator/carrinhos/dados"
      ];
      for (const url of rotasConta) {
        const resposta = await app.inject({ method: "GET", url });
        expect(resposta.statusCode, url).toBe(401);
      }

      const rotasTeam = [
        "/creator/team/ledger",
        "/market/risco/casos"
      ];
      for (const url of rotasTeam) {
        const resposta = await app.inject({ method: "GET", url });
        expect([401, 403], url).toContain(resposta.statusCode);
      }

      const avaliacao = await app.inject({
        method: "POST",
        url: "/conta/avaliacoes",
        payload: {
          pedidoId: "00000000-0000-4000-8000-000000000000",
          notaProduto: 5,
          notaEntrega: 5,
          notaSeller: 5
        }
      });
      expect(avaliacao.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("nao revela recursos por codigos publicos inexistentes", async () => {
    const app = await criarAplicacao();
    try {
      const carrinho = await app.inject({ method: "GET", url: "/publico/carrinhos/CODIGO-INEXISTENTE" });
      const smartLink = await app.inject({ method: "GET", url: "/go/CODIGO-INEXISTENTE" });
      const aliasRemovido = await app.inject({ method: "GET", url: "/crm/loja/market/resumo" });

      expect(carrinho.statusCode).toBe(404);
      expect(smartLink.statusCode).toBe(404);
      expect([401, 404]).toContain(aliasRemovido.statusCode);
    } finally {
      await app.close();
    }
  });
});
