import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

function cookieDaResposta(resposta: { headers: Record<string, unknown> }, nome: string) {
  const valor = resposta.headers["set-cookie"];
  const cookies = Array.isArray(valor) ? valor : [String(valor ?? "")];
  const cookie = cookies.flatMap((item) => item.split(/,(?=[^;,]+=)/)).map((item) => item.split(";")[0]).find((item) => item.startsWith(`${nome}=`));
  expect(cookie).toBeTruthy();
  return cookie as string;
}

async function autenticarSeller(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const otp = await app.inject({
    method: "POST", url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923830001", nome: "Loja Atribuicao Commerce" }
  });
  const login = await app.inject({
    method: "POST", url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923830001", codigo: otp.json().codigoDev }
  });
  return { authorization: `Bearer ${login.json().token}` };
}

async function autenticarComprador(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  telefone = "923830099",
  dispositivo = "buyer-device-account"
) {
  const otp = await app.inject({
    method: "POST", url: "/conta/otp/solicitar",
    payload: { telefone }
  });
  const login = await app.inject({
    method: "POST", url: "/conta/otp/confirmar",
    headers: { "x-bizy-device-id": dispositivo },
    payload: { telefone, codigo: otp.json().codigoDev }
  });
  expect(login.statusCode).toBe(200);
  return cookieDaResposta(login, "bizy_conta_sessao");
}

async function prepararLoja(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  politica: { modeloPadrao: string; janelaDias: number; pesoPrincipalBasisPoints?: number }
) {
  const seller = await autenticarSeller(app);
  const onboarding = await app.inject({
    method: "POST", url: "/onboarding/negocio", headers: seller,
    payload: {
      nomeComercial: "Loja Atribuicao Commerce",
      segmento: "moda",
      tipo: "LOJA",
      entrega: { atribuicao: politica }
    }
  });
  expect(onboarding.statusCode).toBe(201);
  const produto = await app.inject({
    method: "POST", url: "/pecas", headers: seller,
    payload: {
      codigo: "ATTR-CROSS-1",
      sku: "SKU-ATTR-CROSS-1",
      nome: "Produto cross device",
      descricao: "Produto para atribuicao versionada.",
      precoEmKwanza: 20_000,
      custoEmKwanza: 10_000,
      quantidade: 10,
      stockMinimo: 1,
      categoria: "Teste"
    }
  });
  expect(produto.statusCode).toBe(201);
  const loja = await app.inject({
    method: "PUT", url: "/loja-publica/configuracao", headers: seller,
    payload: { slug: "loja-attr-cross", descricaoPublica: "Loja cross device", publicada: true }
  });
  expect(loja.statusCode).toBe(200);

  const links: Record<string, string> = {};
  for (const [indice, codigo] of ["CRIADOR-A", "CRIADOR-B"].entries()) {
    const parceiro = await app.inject({
      method: "POST", url: "/afiliados", headers: seller,
      payload: {
        tipo: "CRIADOR",
        codigo,
        nomePublico: `Criador ${indice + 1}`,
        contacto: `92383001${indice + 1}`,
        regraComissao: { tipo: "PERCENTUAL", percentual: 10 }
      }
    });
    expect(parceiro.statusCode).toBe(201);
    const link = await app.inject({
      method: "POST", url: `/afiliados/${parceiro.json().id}/links`, headers: seller,
      payload: {
        codigo: `LINK-${codigo}`,
        destinoTipo: "PRODUTO",
        slugLoja: "loja-attr-cross",
        codigoProduto: "ATTR-CROSS-1",
        canal: indice === 0 ? "instagram" : "tiktok"
      }
    });
    expect(link.statusCode).toBe(201);
    links[codigo] = link.json().codigo;
  }
  return { seller, links };
}

async function abrirLink(app: Awaited<ReturnType<typeof criarAplicacao>>, codigo: string) {
  const resposta = await app.inject({ method: "GET", url: `/go/${codigo}` });
  expect(resposta.statusCode).toBe(302);
  return cookieDaResposta(resposta, "bizy_commerce_session");
}

async function sincronizarCarrinho(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  cookies: string
) {
  const resposta = await app.inject({
    method: "POST", url: "/publico/market/carrinho/sincronizar",
    headers: { cookie: cookies },
    payload: {
      modo: "SUBSTITUIR",
      itens: [{ slugLoja: "loja-attr-cross", codigoPeca: "ATTR-CROSS-1", quantidade: 1, origem: "catalogo" }]
    }
  });
  expect(resposta.statusCode, resposta.body).toBe(200);
  return resposta.json().carrinho as { id: string };
}

async function checkout(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  cookies: string,
  carrinhoId: string,
  idempotencyKey: string
) {
  const resposta = await app.inject({
    method: "POST", url: "/publico/market/checkout", headers: { cookie: cookies },
    payload: {
      idempotencyKey,
      carrinhoId,
      compradorTelefone: "923830099",
      compradorNome: "Comprador Cross Device",
      itens: [],
      entrega: { tipo: "RETIRADA" },
      metodoPagamento: "TRANSFERENCIA"
    }
  });
  expect(resposta.statusCode, resposta.body).toBe(201);
  return resposta.json().compra as { id: string };
}

async function consultarAtribuicao(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  seller: Record<string, string>,
  compraId: string
) {
  const resposta = await app.inject({
    method: "GET", url: `/market/fornecedor/compras/${compraId}/atribuicao`, headers: seller
  });
  expect(resposta.statusCode, resposta.body).toBe(200);
  return resposta.json().conversoes[0];
}

describe("Atribuicao commerce versionada", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      AUTH_SECRET: "attribution-commerce-test-secret-with-32-chars",
      BACKEND_PUBLIC_URL: "https://links.example.com",
      PUBLIC_STORE_BASE_URL: "https://market.example.com",
      N8N_EVENTOS_ATIVOS: "false",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RATE_LIMIT_ATIVO: "false",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true"
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("une toques cross-device, distribui 100% e preserva a versao historica", async () => {
    const app = await criarAplicacao();
    try {
      const { seller, links } = await prepararLoja(app, {
        modeloPadrao: "CONVERSAO_ASSISTIDA",
        janelaDias: 30,
        pesoPrincipalBasisPoints: 7000
      });
      const conta = await autenticarComprador(app);

      const sessaoA = await abrirLink(app, links["CRIADOR-A"]);
      await sincronizarCarrinho(app, `${sessaoA}; ${conta}`);
      const outraConta = await autenticarComprador(app, "923830098", "buyer-device-other-account");
      const tentativaOutraConta = await app.inject({
        method: "POST", url: "/publico/market/carrinho/sincronizar",
        headers: { cookie: `${sessaoA}; ${outraConta}` },
        payload: {
          modo: "SUBSTITUIR",
          itens: [{ slugLoja: "loja-attr-cross", codigoPeca: "ATTR-CROSS-1", quantidade: 1, origem: "catalogo" }]
        }
      });
      expect(tentativaOutraConta.statusCode).toBe(200);
      expect(tentativaOutraConta.json().carrinho.itens[0].origem).toBe("catalogo");
      const sessaoB = await abrirLink(app, links["CRIADOR-B"]);
      const cookiesB = `${sessaoB}; ${conta}`;
      const carrinho = await sincronizarCarrinho(app, cookiesB);
      const compra = await checkout(app, cookiesB, carrinho.id, "attr-cross-device-1");
      const primeira = await consultarAtribuicao(app, seller, compra.id);

      expect(primeira.modelo).toBe("CONVERSAO_ASSISTIDA");
      expect(primeira.explicacao.crossDevice).toBe(true);
      expect(primeira.participantes).toHaveLength(2);
      expect(primeira.participantes.reduce((total: number, item: { pesoBasisPoints: number }) => total + item.pesoBasisPoints, 0)).toBe(10_000);
      expect(primeira.participantes.reduce((total: number, item: { valorAtribuidoEmKwanza: number }) => total + item.valorAtribuidoEmKwanza, 0)).toBe(20_000);
      expect(primeira.participantes.find((item: { papel: string }) => item.papel === "PRINCIPAL")).toEqual(
        expect.objectContaining({ pesoBasisPoints: 7000, valorAtribuidoEmKwanza: 14_000 })
      );
      expect(primeira.participantes.find((item: { papel: string }) => item.papel.startsWith("ASSISTENCIA"))).toEqual(
        expect.objectContaining({ pesoBasisPoints: 3000, valorAtribuidoEmKwanza: 6_000 })
      );

      const novaPolitica = await app.inject({
        method: "POST", url: "/onboarding/negocio", headers: seller,
        payload: {
          nomeComercial: "Loja Atribuicao Commerce",
          segmento: "moda",
          tipo: "LOJA",
          entrega: { atribuicao: { modeloPadrao: "PRIMEIRO_TOQUE", janelaDias: 7 } }
        }
      });
      expect(novaPolitica.statusCode).toBe(201);

      const novoCarrinho = await sincronizarCarrinho(app, cookiesB);
      const segundaCompra = await checkout(app, cookiesB, novoCarrinho.id, "attr-cross-device-2");
      const segunda = await consultarAtribuicao(app, seller, segundaCompra.id);
      const primeiraReconsultada = await consultarAtribuicao(app, seller, compra.id);

      expect(segunda.modelo).toBe("PRIMEIRO_TOQUE");
      expect(segunda.politicaVersao).not.toBe(primeira.politicaVersao);
      expect(primeiraReconsultada.politicaVersao).toBe(primeira.politicaVersao);
      expect(primeiraReconsultada.modelo).toBe("CONVERSAO_ASSISTIDA");
    } finally {
      await app.close();
    }
  });

  it("exclui toque fora da janela sem o reinterpretar", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-15T08:00:00.000Z"));
    const app = await criarAplicacao();
    try {
      const { seller, links } = await prepararLoja(app, {
        modeloPadrao: "CONVERSAO_ASSISTIDA",
        janelaDias: 1,
        pesoPrincipalBasisPoints: 7000
      });
      const conta = await autenticarComprador(app);
      const sessaoA = await abrirLink(app, links["CRIADOR-A"]);
      await sincronizarCarrinho(app, `${sessaoA}; ${conta}`);

      vi.setSystemTime(new Date("2026-07-17T08:00:00.000Z"));
      const sessaoB = await abrirLink(app, links["CRIADOR-B"]);
      const cookiesB = `${sessaoB}; ${conta}`;
      const carrinho = await sincronizarCarrinho(app, cookiesB);
      const compra = await checkout(app, cookiesB, carrinho.id, "attr-window-1");
      const atribuicao = await consultarAtribuicao(app, seller, compra.id);

      expect(atribuicao.participantes).toHaveLength(1);
      expect(atribuicao.participantes[0]).toEqual(expect.objectContaining({ pesoBasisPoints: 10_000 }));
      expect(atribuicao.explicacao.toquesConsiderados).toHaveLength(1);
      expect(atribuicao.explicacao.crossDevice).toBe(false);
    } finally {
      await app.close();
    }
  });
});
