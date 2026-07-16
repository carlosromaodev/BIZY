import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";
import { RepositorioContaBizyMemoria } from "../projetos/commerce/infra/repositorios/RepositorioContaBizyMemoria.js";

const ambienteOriginal = { ...process.env };

async function autenticarSeller(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const otp = await app.inject({ method: "POST", url: "/auth/telefone/solicitar-codigo", payload: { telefone: "923910001", nome: "Seller Conta" } });
  const login = await app.inject({ method: "POST", url: "/auth/telefone/confirmar-codigo", payload: { telefone: "923910001", codigo: otp.json().codigoDev } });
  return { authorization: `Bearer ${login.json().token}` };
}

async function prepararCompra(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone = "923920001") {
  const seller = await autenticarSeller(app);
  const produto = await app.inject({
    method: "POST", url: "/pecas", headers: seller,
    payload: {
      codigo: "CONTA-SEC-1", sku: "SKU-CONTA-SEC-1", nome: "Produto seguro", descricao: "Produto de teste",
      precoEmKwanza: 10_000, custoEmKwanza: 5_000, quantidade: 5, stockMinimo: 1,
      categoria: "Teste", fotos: ["https://example.com/conta.png"], variantes: {}, vitrine: { selos: ["DESTAQUE"] }
    }
  });
  expect(produto.statusCode).toBe(201);
  const loja = await app.inject({
    method: "PUT", url: "/loja-publica/configuracao", headers: seller,
    payload: { slug: "loja-conta-segura", descricaoPublica: "Loja segura", publicada: true }
  });
  expect(loja.statusCode).toBe(200);
  const checkout = await app.inject({
    method: "POST", url: "/publico/market/checkout",
    payload: {
      compradorTelefone: telefone,
      compradorNome: "Comprador Seguro",
      compradorEmail: "comprador@example.com",
      itens: [{ slugLoja: "loja-conta-segura", codigoPeca: "CONTA-SEC-1", quantidade: 1 }]
    }
  });
  expect(checkout.statusCode).toBe(201);
  return checkout.json() as { compra: { id: string }; acessoCompra: { token: string; expiraEm: string } };
}

function cookieDaResposta(resposta: { headers: Record<string, unknown> }) {
  const valor = resposta.headers["set-cookie"];
  const primeiro = Array.isArray(valor) ? valor[0] : String(valor ?? "");
  return primeiro.split(";")[0];
}

describe("Conta Bizy e seguranca do comprador", () => {
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
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("bloqueia enumeracao e IDOR e permite somente o token da compra", async () => {
    const app = await criarAplicacao();
    try {
      const checkout = await prepararCompra(app);
      expect(JSON.stringify(checkout)).not.toContain("923920001");
      expect(JSON.stringify(checkout)).not.toContain("comprador@example.com");

      const portalLegado = await app.inject({ method: "GET", url: "/publico/market/portal-comprador?identificador=923920001" });
      expect(portalLegado.statusCode).toBe(404);

      const semToken = await app.inject({ method: "GET", url: `/publico/market/compras/${checkout.compra.id}` });
      const tokenErrado = await app.inject({
        method: "GET", url: `/publico/market/compras/${checkout.compra.id}`,
        headers: { "x-bizy-compra-token": "token-invalido-com-alta-entropia-simulada" }
      });
      expect(semToken.statusCode).toBe(404);
      expect(tokenErrado.statusCode).toBe(404);
      expect(semToken.json()).toEqual(tokenErrado.json());

      const permitido = await app.inject({
        method: "GET", url: `/publico/market/compras/${checkout.compra.id}`,
        headers: { "x-bizy-compra-token": checkout.acessoCompra.token }
      });
      expect(permitido.statusCode).toBe(200);
      expect(permitido.json().compra.id).toBe(checkout.compra.id);
    } finally {
      await app.close();
    }
  });

  it("associa compra guest depois do OTP e protege o portal por sessao revogavel", async () => {
    const app = await criarAplicacao();
    try {
      const estadoAnonimo = await app.inject({ method: "GET", url: "/conta/estado" });
      expect(estadoAnonimo.statusCode).toBe(200);
      expect(estadoAnonimo.json()).toEqual({ autenticada: false, conta: null });

      const checkout = await prepararCompra(app, "923920002");
      const headersGuest = { "x-bizy-compra-token": checkout.acessoCompra.token, "x-bizy-device-id": "browser-comprador-1" };
      const solicitar = await app.inject({
        method: "POST", url: "/conta/otp/solicitar", headers: headersGuest,
        payload: { finalidade: "ASSOCIAR_COMPRA", compraId: checkout.compra.id }
      });
      expect(solicitar.statusCode).toBe(202);

      const confirmar = await app.inject({
        method: "POST", url: "/conta/otp/confirmar", headers: headersGuest,
        payload: {
          finalidade: "ASSOCIAR_COMPRA", compraId: checkout.compra.id, codigo: solicitar.json().codigoDev,
          consentimentoDados: true, consentimentoMarketing: false
        }
      });
      expect(confirmar.statusCode).toBe(200);
      const cookie = cookieDaResposta(confirmar);
      expect(cookie).toMatch(/^bizy_conta_sessao=/);
      const estadoAutenticado = await app.inject({ method: "GET", url: "/conta/estado", headers: { cookie } });
      expect(estadoAutenticado.json()).toEqual(expect.objectContaining({ autenticada: true }));

      const portal = await app.inject({ method: "GET", url: "/conta/comprador/compras", headers: { cookie } });
      expect(portal.statusCode).toBe(200);
      expect(portal.json().compras).toHaveLength(1);
      expect(portal.json().compras[0].compra.id).toBe(checkout.compra.id);

      const tokenGuestRevogado = await app.inject({
        method: "GET", url: `/publico/market/compras/${checkout.compra.id}`,
        headers: { "x-bizy-compra-token": checkout.acessoCompra.token }
      });
      expect(tokenGuestRevogado.statusCode).toBe(404);

      const perfil = await app.inject({
        method: "PATCH", url: "/conta/comprador/perfil", headers: { cookie },
        payload: { preferencias: { idioma: "pt-AO", canal: "sms" }, consentimentoMarketing: true }
      });
      expect(perfil.statusCode).toBe(200);
      expect(perfil.json().preferencias).toEqual({ idioma: "pt-AO", canal: "sms" });

      const endereco = await app.inject({
        method: "POST", url: "/conta/comprador/enderecos", headers: { cookie },
        payload: { rotulo: "Casa", provincia: "Luanda", municipio: "Talatona", endereco: "Rua principal 10", principal: true }
      });
      expect(endereco.statusCode).toBe(201);

      const favorito = await app.inject({
        method: "POST", url: "/conta/comprador/favoritos", headers: { cookie },
        payload: { slugLoja: "loja-conta-segura", codigoProduto: "CONTA-SEC-1" }
      });
      expect(favorito.statusCode).toBe(201);
      const favoritos = await app.inject({ method: "GET", url: "/conta/comprador/favoritos", headers: { cookie } });
      expect(favoritos.json().favoritos).toHaveLength(1);

      const otpOutraConta = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone: "923920099" } });
      const outraConta = await app.inject({
        method: "POST", url: "/conta/otp/confirmar",
        payload: { telefone: "923920099", codigo: otpOutraConta.json().codigoDev }
      });
      const cookieOutraConta = cookieDaResposta(outraConta);
      const idorEndereco = await app.inject({
        method: "DELETE", url: `/conta/comprador/enderecos/${endereco.json().id}`, headers: { cookie: cookieOutraConta }
      });
      expect(idorEndereco.statusCode).toBe(404);
      const idorCompra = await app.inject({
        method: "GET", url: `/publico/market/compras/${checkout.compra.id}`, headers: { cookie: cookieOutraConta }
      });
      expect(idorCompra.statusCode).toBe(404);

      const sessoes = await app.inject({ method: "GET", url: "/conta/sessoes", headers: { cookie } });
      expect(sessoes.statusCode).toBe(200);
      expect(sessoes.json().sessoes).toHaveLength(1);
      const revogar = await app.inject({
        method: "DELETE", url: `/conta/sessoes/${sessoes.json().sessoes[0].id}`, headers: { cookie }
      });
      expect(revogar.statusCode).toBe(200);
      const depois = await app.inject({ method: "GET", url: "/conta/comprador/compras", headers: { cookie } });
      expect(depois.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("nao aceita token guest expirado nem token de outra compra", async () => {
    const repositorio = new RepositorioContaBizyMemoria();
    const agora = new Date("2026-07-14T12:00:00.000Z");
    await repositorio.criarAcessoCompra("compra-a", "hash-a", new Date(agora.getTime() - 1));
    await repositorio.criarAcessoCompra("compra-b", "hash-b", new Date(agora.getTime() + 60_000));
    expect(await repositorio.validarAcessoCompra("compra-a", "hash-a", agora)).toBe(false);
    expect(await repositorio.validarAcessoCompra("compra-a", "hash-b", agora)).toBe(false);
    expect(await repositorio.validarAcessoCompra("compra-b", "hash-b", agora)).toBe(true);
  });

  it("limita solicitacoes OTP por contacto no dominio", async () => {
    const app = await criarAplicacao();
    try {
      for (let indice = 0; indice < 3; indice += 1) {
        const resposta = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone: "923920003" } });
        expect(resposta.statusCode).toBe(202);
      }
      const bloqueada = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone: "923920003" } });
      expect(bloqueada.statusCode).toBe(429);
    } finally {
      await app.close();
    }
  });
});
