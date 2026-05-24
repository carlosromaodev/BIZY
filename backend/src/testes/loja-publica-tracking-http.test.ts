import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome }
  });
  expect(respostaCodigo.statusCode).toBe(202);

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });
  expect(respostaSessao.statusCode).toBe(200);

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarProduto(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string,
  quantidade: number
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      sku: `SKU-${codigo}`,
      nome: `Produto ${codigo}`,
      descricao: `Produto ${codigo} para loja pública`,
      precoEmKwanza: 12_500,
      custoEmKwanza: 7_500,
      quantidade,
      stockMinimo: 1,
      categoria: "Roupas",
      colecao: "Live atual",
      variantes: { tamanho: ["M", "G"] },
      fotos: [`https://example.com/${codigo}.png`]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("loja pública, catálogo digital e tracking HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...ambienteOriginal };
  });

  it("publica loja por slug, expõe apenas produtos vendáveis e gera checkout WhatsApp rastreável", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923444001", "Loja Pública A");
      const lojaB = await autenticar(app, "923444002", "Loja Pública B");

      await criarProduto(app, lojaA, "P1", 5);
      await criarProduto(app, lojaA, "P2", 0);
      await criarProduto(app, lojaB, "P1", 10);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: lojaA,
        payload: {
          slug: "loja-publica-a",
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);
      expect(publicacao.json()).toEqual(
        expect.objectContaining({
          slugPublico: "loja-publica-a",
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp.",
          lojaPublicadaEm: expect.any(String)
        })
      );

      const slugDuplicado = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: lojaB,
        payload: {
          slug: "loja-publica-a",
          publicada: true
        }
      });
      expect(slugDuplicado.statusCode).toBe(409);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-publica-a?trackingId=anon-1&utm_source=tiktok&utm_campaign=live",
        headers: {}
      });
      expect(lojaPublica.statusCode).toBe(200);
      expect(lojaPublica.json().loja).toEqual(
        expect.objectContaining({
          slug: "loja-publica-a",
          nomeComercial: expect.stringContaining("Loja Pública A"),
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp."
        })
      );
      expect(lojaPublica.json().produtos).toEqual([
        expect.objectContaining({
          codigo: "P1",
          nome: "Produto P1",
          precoEmKwanza: 12_500,
          categoria: "Roupas",
          colecao: "Live atual",
          estadoStock: "DISPONIVEL"
        })
      ]);
      expect(JSON.stringify(lojaPublica.json())).not.toContain("custoEmKwanza");
      expect(JSON.stringify(lojaPublica.json())).not.toContain("margemEstimadaEmKwanza");
      expect(JSON.stringify(lojaPublica.json())).not.toContain("negocioId");

      const produtoPublico = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-publica-a/produtos/P1?trackingId=anon-1"
      });
      expect(produtoPublico.statusCode).toBe(200);
      expect(produtoPublico.json().produto).toEqual(
        expect.objectContaining({
          codigo: "P1",
          variantes: { tamanho: ["M", "G"] },
          disponivel: true
        })
      );

      const checkoutWhatsApp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-publica-a/produtos/P1/whatsapp",
        payload: {
          quantidade: 2,
          variante: { tamanho: "M" },
          trackingId: "anon-1",
          origem: "catalogo-digital"
        }
      });
      expect(checkoutWhatsApp.statusCode).toBe(200);
      expect(checkoutWhatsApp.json()).toEqual(
        expect.objectContaining({
          telefone: "923444001",
          mensagem: expect.stringContaining("Produto P1"),
          whatsappUrl: expect.stringContaining("wa.me")
        })
      );
      expect(checkoutWhatsApp.json().mensagem).toContain("Quantidade: 2");
      expect(checkoutWhatsApp.json().mensagem).toContain("Origem: catalogo-digital");

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: lojaA
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json()).toEqual(
        expect.objectContaining({
          totalEventos: 3,
          porTipo: expect.objectContaining({
            LOJA_VISITADA: 1,
            PRODUTO_VISTO: 1,
            WHATSAPP_CLICK: 1
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("não expõe loja despublicada nem produto sem stock", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444101", "Loja Oculta");
      await criarProduto(app, loja, "X1", 0);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-oculta",
          publicada: false
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-oculta"
      });
      expect(lojaPublica.statusCode).toBe(404);

      const publicar = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-oculta",
          publicada: true
        }
      });
      expect(publicar.statusCode).toBe(200);

      const produtoSemStock = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-oculta/produtos/X1"
      });
      expect(produtoSemStock.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
