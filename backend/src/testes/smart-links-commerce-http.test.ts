import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  telefone = "923811001",
  nome = "Loja Smart Links"
) {
  const codigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome }
  });
  const sessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: codigo.json().codigoDev }
  });
  return { authorization: `Bearer ${sessao.json().token}` };
}

async function preparar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const headers = await autenticar(app);
  const produto = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo: "SMART-001",
      sku: "SKU-SMART-001",
      nome: "Produto Smart Link",
      descricao: "Produto real para validar a jornada Smart Link.",
      precoEmKwanza: 18_000,
      custoEmKwanza: 9_000,
      quantidade: 8,
      stockMinimo: 1,
      categoria: "Teste",
      colecao: "Smart Links",
      fotos: ["https://cdn.example.com/smart-001.jpg"]
    }
  });
  expect(produto.statusCode).toBe(201);

  const outroProduto = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo: "SMART-002",
      sku: "SKU-SMART-002",
      nome: "Produto fora do Smart Link",
      precoEmKwanza: 12_000,
      custoEmKwanza: 6_000,
      quantidade: 4,
      stockMinimo: 1,
      categoria: "Teste",
      colecao: "Smart Links"
    }
  });
  expect(outroProduto.statusCode).toBe(201);

  const loja = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers,
    payload: { slug: "loja-smart-links", descricaoPublica: "Loja publica Smart Links", publicada: true }
  });
  expect(loja.statusCode).toBe(200);

  const parceiro = await app.inject({
    method: "POST",
    url: "/afiliados",
    headers,
    payload: {
      tipo: "CRIADOR",
      codigo: "CRIADOR-SMART",
      nomePublico: "Criador Smart",
      contacto: "923811002",
      regraComissao: { tipo: "PERCENTUAL", percentual: 8 },
      metodoPagamento: {}
    }
  });
  expect(parceiro.statusCode).toBe(201);

  const link = await app.inject({
    method: "POST",
    url: `/afiliados/${parceiro.json().id}/links`,
    headers,
    payload: {
      codigo: "LINK-SMART-001",
      destinoTipo: "PRODUTO",
      slugLoja: "loja-smart-links",
      codigoProduto: "SMART-001",
      canal: "instagram",
      origemConteudo: "reel-smart-01",
      metadata: {
        destinoUrl: "https://evil.example/phishing",
        utmSource: "creator",
        utmCampaign: "lancamento-smart"
      }
    }
  });
  expect(link.statusCode).toBe(201);
  return { headers, parceiro: parceiro.json(), link: link.json() };
}

function cookieCommerce(resposta: { headers: Record<string, unknown> }) {
  const cabecalho = String(resposta.headers["set-cookie"] ?? "");
  const cookie = cabecalho.split(";")[0];
  expect(cookie).toMatch(/^bizy_commerce_session=/);
  expect(cabecalho).toContain("HttpOnly");
  expect(cabecalho).toContain("SameSite=Lax");
  return cookie;
}

describe("Smart Links commerce HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      AUTH_SECRET: "smart-links-test-secret-with-more-than-32-characters",
      BACKEND_PUBLIC_URL: "https://links.example.com",
      PUBLIC_STORE_BASE_URL: "https://market.example.com",
      N8N_EVENTOS_ATIVOS: "false",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("fecha a jornada publica com preview, sessao, clique e redirect seguro", async () => {
    const app = await criarAplicacao();
    try {
      const { headers, link } = await preparar(app);
      expect(link.urlPublica).toBe("https://links.example.com/go/LINK-SMART-001");

      const preview = await app.inject({
        method: "GET",
        url: "/go/LINK-SMART-001",
        headers: { "user-agent": "facebookexternalhit/1.1" }
      });
      expect(preview.statusCode).toBe(200);
      expect(preview.headers["content-type"]).toContain("text/html");
      expect(preview.body).toContain('property="og:title"');
      expect(preview.body).toContain("Produto Smart Link");
      expect(preview.headers["set-cookie"]).toBeUndefined();

      const resumoAntes = await app.inject({ method: "GET", url: "/loja-publica/tracking/resumo", headers });
      expect(resumoAntes.json().porTipo.SMART_LINK_CLICK ?? 0).toBe(0);

      const clique = await app.inject({ method: "GET", url: "/go/LINK-SMART-001" });
      expect(clique.statusCode).toBe(302);
      expect(clique.headers.location).toContain("https://market.example.com/lojas/loja-smart-links/produtos/SMART-001?");
      expect(clique.headers.location).toContain("ref=LINK-SMART-001");
      expect(clique.headers.location).toContain("utm_source=creator");
      expect(clique.headers.location).not.toContain("evil.example");
      const cookie = cookieCommerce(clique);

      const segundoClique = await app.inject({
        method: "GET",
        url: "/go/LINK-SMART-001",
        headers: { cookie }
      });
      expect(segundoClique.statusCode).toBe(302);
      expect(cookieCommerce(segundoClique)).toBe(cookie);

      const carrinho = await app.inject({
        method: "POST",
        url: "/publico/market/carrinho/sincronizar",
        headers: { cookie },
        payload: {
          modo: "SUBSTITUIR",
          itens: [{
            slugLoja: "loja-smart-links",
            codigoPeca: "SMART-001",
            quantidade: 1,
            origem: "valor-cliente-ignorado",
            atribuicao: { linkId: "manipulado-pelo-cliente" }
          }, {
            slugLoja: "loja-smart-links",
            codigoPeca: "SMART-002",
            quantidade: 1,
            origem: "catalogo"
          }]
        }
      });
      expect(carrinho.statusCode, carrinho.body).toBe(200);
      expect(carrinho.json().carrinho.itens[0].origem).toBe("smart-link");
      expect(carrinho.json().carrinho.itens[1].origem).toBe("catalogo");
      expect(carrinho.json().carrinho.itens[1].atribuicao).toBeUndefined();
      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        headers: { cookie, "x-bizy-cart-token": carrinho.json().token },
        payload: {
          idempotencyKey: "checkout-smart-link-001",
          carrinhoId: carrinho.json().carrinho.id,
          compradorTelefone: "923811009",
          compradorNome: "Comprador Smart",
          itens: [],
          entrega: { tipo: "RETIRADA" },
          metodoPagamento: "TRANSFERENCIA"
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json().compra.id).toBeTruthy();

      const repetido = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        headers: { cookie, "x-bizy-cart-token": carrinho.json().token },
        payload: {
          idempotencyKey: "checkout-smart-link-001",
          carrinhoId: carrinho.json().carrinho.id,
          compradorTelefone: "923811009",
          compradorNome: "Comprador Smart",
          itens: [],
          entrega: { tipo: "RETIRADA" },
          metodoPagamento: "TRANSFERENCIA"
        }
      });
      expect(repetido.statusCode).toBe(201);
      expect(repetido.json().compra.id).toBe(checkout.json().compra.id);

      const atribuicao = await app.inject({
        method: "GET",
        url: `/market/fornecedor/compras/${checkout.json().compra.id}/atribuicao`,
        headers
      });
      expect(atribuicao.statusCode).toBe(200);
      expect(atribuicao.json().total).toBe(1);
      expect(atribuicao.json().conversoes[0]).toEqual(expect.objectContaining({
        modelo: "ULTIMO_TOQUE",
        politicaCodigo: "market-default",
        valorBaseEmKwanza: 30_000
      }));
      expect(atribuicao.json().conversoes[0].politicaVersao).toMatch(/^v-[a-f0-9]{12}$/);
      expect(atribuicao.json().conversoes[0].participantes).toHaveLength(1);
      expect(atribuicao.json().conversoes[0].participantes[0]).toEqual(expect.objectContaining({
        papel: "PRINCIPAL",
        pesoBasisPoints: 10_000,
        valorAtribuidoEmKwanza: 18_000
      }));
      expect(atribuicao.json().conversoes[0].explicacao).toEqual(expect.objectContaining({
        schema: "bizy.commerce.attribution.v1",
        valorBaseEmKwanza: 30_000,
        valorAtribuivelEmKwanza: 18_000
      }));

      const headersOutroNegocio = await autenticar(app, "923811099", "Outro Negocio");
      const isolado = await app.inject({
        method: "GET",
        url: `/market/fornecedor/compras/${checkout.json().compra.id}/atribuicao`,
        headers: headersOutroNegocio
      });
      expect(isolado.statusCode).toBe(404);

      const resumoDepois = await app.inject({ method: "GET", url: "/loja-publica/tracking/resumo", headers });
      expect(resumoDepois.json().porTipo.SMART_LINK_CLICK).toBe(2);
      expect(resumoDepois.json().porTipo.ADD_TO_CART).toBe(2);
      expect(resumoDepois.json().porTipo.CHECKOUT_STARTED).toBe(1);
      expect(resumoDepois.json().porTipo.BUYER_IDENTIFIED).toBe(1);
      expect(resumoDepois.json().porTipo.ORDER_CREATED).toBe(1);

      const legado = await app.inject({ method: "GET", url: "/publico/links/LINK-SMART-001" });
      expect(legado.statusCode).toBe(200);
      expect(legado.json().link.urlPublica).toBe("https://links.example.com/go/LINK-SMART-001");
    } finally {
      await app.close();
    }
  });

  it("nao permite enumeracao, destino arbitrario, link expirado ou parceiro pausado", async () => {
    const app = await criarAplicacao();
    try {
      const { headers, parceiro } = await preparar(app);
      const inexistente = await app.inject({ method: "GET", url: "/go/NAO-EXISTE" });

      const destinoInvalido = await app.inject({
        method: "POST",
        url: `/afiliados/${parceiro.id}/links`,
        headers,
        payload: { codigo: "LINK-EXTERNO", destinoTipo: "URL_EXTERNA", metadata: { url: "https://evil.example" } }
      });
      expect(destinoInvalido.statusCode).toBe(201);
      const externo = await app.inject({ method: "GET", url: "/go/LINK-EXTERNO" });

      const expiradoCriado = await app.inject({
        method: "POST",
        url: `/afiliados/${parceiro.id}/links`,
        headers,
        payload: { codigo: "LINK-EXPIRADO", destinoTipo: "LOJA", expiraEm: "2020-01-01T00:00:00.000Z" }
      });
      expect(expiradoCriado.statusCode).toBe(201);
      const expirado = await app.inject({ method: "GET", url: "/go/LINK-EXPIRADO" });

      const pausa = await app.inject({
        method: "PUT",
        url: `/afiliados/${parceiro.id}/estado`,
        headers,
        payload: { ativo: false }
      });
      expect(pausa.statusCode).toBe(200);
      const pausado = await app.inject({ method: "GET", url: "/go/LINK-SMART-001" });

      for (const resposta of [inexistente, externo, expirado, pausado]) {
        expect(resposta.statusCode).toBe(404);
        expect(resposta.json()).toEqual(inexistente.json());
        expect(resposta.headers.location).toBeUndefined();
        expect(resposta.headers["set-cookie"]).toBeUndefined();
      }
    } finally {
      await app.close();
    }
  });

  it("resolve apenas os tipos de destino publicos previstos no contrato", async () => {
    const app = await criarAplicacao();
    try {
      const { headers, parceiro } = await preparar(app);
      const casos = [
        { codigo: "SL-LOJA", destinoTipo: "LOJA", destinoId: null, caminho: "/lojas/loja-smart-links?" },
        { codigo: "SL-COLECAO", destinoTipo: "COLECAO", destinoId: "catalogo-verao", caminho: "/lojas/loja-smart-links/catalogos/catalogo-verao?" },
        { codigo: "SL-CONTEUDO", destinoTipo: "CONTEUDO", destinoId: "review-look", caminho: "/c/review-look?" },
        { codigo: "SL-CAMPANHA", destinoTipo: "CAMPANHA", destinoId: "campanha-01", caminho: "/lojas/loja-smart-links?" },
        { codigo: "SL-CARRINHO", destinoTipo: "CARRINHO", destinoId: "carrinho-partilhado", caminho: "/carrinhos/carrinho-partilhado?" },
        { codigo: "SL-MINI", destinoTipo: "MINI_LOJA", destinoId: null, caminho: "/lojas/loja-smart-links?" },
        { codigo: "SL-FORM", destinoTipo: "FORMULARIO", destinoId: null, caminho: "/f/loja-smart-links/lead?" },
        { codigo: "SL-LEARNING", destinoTipo: "PRODUTO_LEARNING", destinoId: "curso-vendas", caminho: "/learning/produtos/curso-vendas?" }
      ];

      for (const caso of casos) {
        const criado = await app.inject({
          method: "POST",
          url: `/afiliados/${parceiro.id}/links`,
          headers,
          payload: {
            codigo: caso.codigo,
            destinoTipo: caso.destinoTipo,
            destinoId: caso.destinoId,
            slugLoja: "loja-smart-links"
          }
        });
        expect(criado.statusCode).toBe(201);
        const aberto = await app.inject({ method: "GET", url: `/go/${caso.codigo}` });
        expect(aberto.statusCode).toBe(302);
        expect(aberto.headers.location).toContain(`https://market.example.com${caso.caminho}`);
        expect(aberto.headers.location).not.toContain("destinoUrl");
      }
    } finally {
      await app.close();
    }
  });
});
