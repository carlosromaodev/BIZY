import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function prepararLoja(app: Awaited<ReturnType<typeof criarAplicacao>>, quantidade = 2) {
  const otp = await app.inject({ method: "POST", url: "/auth/telefone/solicitar-codigo", payload: { telefone: "923730001", nome: "Seller Carrinho" } });
  const login = await app.inject({ method: "POST", url: "/auth/telefone/confirmar-codigo", payload: { telefone: "923730001", codigo: otp.json().codigoDev } });
  const headers = { authorization: `Bearer ${login.json().token}` };
  const produto = await app.inject({
    method: "POST", url: "/pecas", headers,
    payload: {
      codigo: "CART-1", nome: "Produto carrinho", descricao: "Reserva server-side",
      precoEmKwanza: 12_500, quantidade, stockMinimo: 0, fotos: ["https://example.com/cart.png"], variantes: {}
    }
  });
  expect(produto.statusCode).toBe(201);
  const loja = await app.inject({
    method: "PUT", url: "/loja-publica/configuracao", headers,
    payload: { slug: "loja-carrinho", descricaoPublica: "Loja carrinho", publicada: true }
  });
  expect(loja.statusCode).toBe(200);
  return headers;
}

function payloadCarrinho(quantidade = 1) {
  return {
    modo: "SUBSTITUIR",
    itens: [{ slugLoja: "loja-carrinho", codigoPeca: "CART-1", quantidade, origem: "teste" }]
  };
}

function cookieDaResposta(resposta: { headers: Record<string, unknown> }) {
  const valor = resposta.headers["set-cookie"];
  return (Array.isArray(valor) ? valor[0] : String(valor ?? "")).split(";")[0];
}

describe("Carrinho Commerce server-side", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      RATE_LIMIT_ATIVO: "false",
      N8N_BACKEND_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("protege o carrinho guest por token opaco e aplica preço do backend", async () => {
    const app = await criarAplicacao();
    try {
      await prepararLoja(app);
      const criado = await app.inject({ method: "POST", url: "/publico/market/carrinho/sincronizar", payload: payloadCarrinho() });
      expect(criado.statusCode).toBe(200);
      expect(criado.json().token).toHaveLength(43);
      expect(criado.json().carrinho.itens[0].precoUnitarioEmKwanza).toBe(12_500);

      const semToken = await app.inject({ method: "GET", url: "/publico/market/carrinho" });
      const tokenErrado = await app.inject({ method: "GET", url: "/publico/market/carrinho", headers: { "x-bizy-cart-token": "token-invalido" } });
      expect(semToken.statusCode).toBe(404);
      expect(tokenErrado.statusCode).toBe(404);
      expect(semToken.json()).toEqual(tokenErrado.json());

      const permitido = await app.inject({
        method: "GET", url: "/publico/market/carrinho",
        headers: { "x-bizy-cart-token": criado.json().token }
      });
      expect(permitido.statusCode).toBe(200);
      expect(permitido.json().carrinho.id).toBe(criado.json().carrinho.id);
    } finally {
      await app.close();
    }
  });

  it("impede dupla reserva e consome stock uma única vez no checkout", async () => {
    const app = await criarAplicacao();
    try {
      const seller = await prepararLoja(app, 1);
      const primeiro = await app.inject({ method: "POST", url: "/publico/market/carrinho/sincronizar", payload: payloadCarrinho() });
      const segundo = await app.inject({ method: "POST", url: "/publico/market/carrinho/sincronizar", payload: payloadCarrinho() });
      expect(primeiro.statusCode).toBe(200);
      expect(segundo.statusCode).toBe(400);
      expect(segundo.json().mensagem).toContain("Stock insuficiente");

      const checkout = await app.inject({
        method: "POST", url: "/publico/market/checkout",
        headers: { "x-bizy-cart-token": primeiro.json().token },
        payload: {
          idempotencyKey: "cart-checkout-1", carrinhoId: primeiro.json().carrinho.id,
          compradorTelefone: "923830001", itens: []
        }
      });
      expect(checkout.statusCode).toBe(201);

      const repetido = await app.inject({
        method: "POST", url: "/publico/market/checkout",
        headers: { "x-bizy-cart-token": primeiro.json().token },
        payload: { idempotencyKey: "cart-checkout-1", carrinhoId: primeiro.json().carrinho.id, compradorTelefone: "923830001", itens: [] }
      });
      expect(repetido.statusCode).toBe(201);
      expect(repetido.json().compra.id).toBe(checkout.json().compra.id);

      const reutilizado = await app.inject({
        method: "POST", url: "/publico/market/checkout",
        headers: { "x-bizy-cart-token": primeiro.json().token },
        payload: { idempotencyKey: "cart-checkout-outro", carrinhoId: primeiro.json().carrinho.id, compradorTelefone: "923830001", itens: [] }
      });
      expect(reutilizado.statusCode).toBe(404);

      const pecas = await app.inject({ method: "GET", url: "/pecas", headers: seller });
      expect(pecas.json().find((item: { codigo: string }) => item.codigo === "CART-1").quantidade).toBe(0);
    } finally {
      await app.close();
    }
  });

  it("associa o carrinho guest à conta e sincroniza entre dispositivos", async () => {
    const app = await criarAplicacao();
    try {
      await prepararLoja(app, 3);
      const guest = await app.inject({ method: "POST", url: "/publico/market/carrinho/sincronizar", payload: payloadCarrinho(2) });
      const otp = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone: "923830002" } });
      const login = await app.inject({
        method: "POST", url: "/conta/otp/confirmar",
        payload: { telefone: "923830002", codigo: otp.json().codigoDev }
      });
      const cookie = cookieDaResposta(login);

      const fundido = await app.inject({
        method: "POST", url: "/publico/market/carrinho/sincronizar",
        headers: { cookie, "x-bizy-cart-token": guest.json().token },
        payload: { ...payloadCarrinho(2), modo: "MESCLAR" }
      });
      expect(fundido.statusCode).toBe(200);
      expect(fundido.json().carrinho.itens[0].quantidade).toBe(2);

      const outroDispositivo = await app.inject({ method: "GET", url: "/publico/market/carrinho", headers: { cookie } });
      expect(outroDispositivo.statusCode).toBe(200);
      expect(outroDispositivo.json().carrinho.id).toBe(fundido.json().carrinho.id);
      expect(outroDispositivo.json().carrinho.itens[0].quantidade).toBe(2);
    } finally {
      await app.close();
    }
  });
});
