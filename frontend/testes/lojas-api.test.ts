import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarPublicacaoProdutoMarket,
  listarProdutosSimilaresLojaPublica,
  listarProdutosMarket,
  normalizarProdutoMarket,
  obterLojaPublica,
  obterProdutoLojaPublica,
  obterResumoMarketLoja,
  ROTAS_LOJAS
} from "../src/lojas";
import type { ProdutoMarket } from "../src/lojas";

function jsonResponse(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("API frontend das lojas e Bizy Market", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta a loja publica e produto da loja sem exigir sessao", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ loja: { slug: "minha-loja" }, produtos: [] }))
      .mockResolvedValueOnce(jsonResponse({ produto: { codigo: "ABC 1" } }))
      .mockResolvedValueOnce(jsonResponse({ produtoOrigem: { codigo: "ABC 1" }, produtos: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await obterLojaPublica("minha-loja", {
      canal: "instagram",
      colecao: "Novidades",
      origem: "bio",
      trackingId: "trk-1",
      utm: { campaign: "lancamento" }
    });
    await obterProdutoLojaPublica("minha-loja", "ABC 1", { origem: "market" });
    await listarProdutosSimilaresLojaPublica("minha-loja", "ABC 1", 6);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/publico/lojas/minha-loja?trackingId=trk-1&origem=bio&canal=instagram&utm_campaign=lancamento&colecao=Novidades",
      expect.objectContaining({
        credentials: "include",
        headers: {}
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/publico/lojas/minha-loja/produtos/ABC%201?origem=market",
      expect.objectContaining({
        credentials: "include",
        headers: {}
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/publico/lojas/minha-loja/produtos/ABC%201/similares?limite=6",
      expect.objectContaining({
        credentials: "include",
        headers: {}
      })
    );
  });

  it("consulta o Market publico com filtros reais", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ produtos: [], total: 0 }));
    vi.stubGlobal("fetch", fetchMock);

    await listarProdutosMarket({
      busca: "camisa verde",
      categoria: "moda",
      limite: 24,
      loja: "uor",
      municipio: "Talatona",
      provincia: "Luanda"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/publico/market/produtos?busca=camisa+verde&categoria=moda&provincia=Luanda&municipio=Talatona&loja=uor&limite=24",
      expect.objectContaining({
        credentials: "include",
        headers: {}
      })
    );
  });

  it("usa rotas autenticadas de Studio com cookie para resumo e publicacao", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ loja: { slug: "minha-loja" }, itens: [] }))
      .mockResolvedValueOnce(jsonResponse({ publicacao: { publicado: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await obterResumoMarketLoja();
    await atualizarPublicacaoProdutoMarket("SKU 1", true);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/crm/loja/market/resumo",
      expect.objectContaining({
        credentials: "include",
        headers: {}
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/crm/loja/produtos/SKU%201/publicacao",
      expect.objectContaining({
        body: JSON.stringify({ publicado: true }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PUT"
      })
    );
  });

  it("normaliza produto do Market para cards e navegacao", () => {
    const produto: ProdutoMarket = {
      codigo: "ABC 1",
      nome: "Camisa verde",
      descricao: "Algodao",
      categoria: "Moda",
      colecao: "Novidades",
      precoEmKwanza: 12500,
      precoPromocionalEmKwanza: 9900,
      quantidade: 4,
      fotos: ["/media/files/camisa.webp"],
      variantes: { tamanho: ["M"] },
      estadoStock: "DISPONIVEL",
      urlProduto: "/lojas/minha-loja/produtos/ABC 1",
      urlLoja: "/lojas/minha-loja",
      loja: {
        slug: "minha-loja",
        nomeComercial: "Minha Loja",
        descricaoPublica: "Moda urbana",
        segmento: "moda",
        tipo: "retalho",
        provincia: "Luanda",
        municipio: "Talatona",
        corPrimaria: "#16a34a",
        logoUrl: "/media/files/logo.webp",
        capaUrl: null
      }
    };

    expect(normalizarProdutoMarket(produto)).toEqual(
      expect.objectContaining({
        categoria: "Moda",
        codigo: "ABC 1",
        fotoPrincipal: "/media/files/camisa.webp",
        nomeFornecedor: "Minha Loja",
        precoAntigoEmKwanza: 12500,
        precoFinalEmKwanza: 9900,
        slugLoja: "minha-loja",
        urlLoja: "/lojas/minha-loja",
        urlMarket: "/market/produtos/ABC%201",
        urlProduto: "/lojas/minha-loja/produtos/ABC 1"
      })
    );
    expect(ROTAS_LOJAS.produtoMarket("ABC 1")).toBe("/market/produtos/ABC%201");
    expect(ROTAS_LOJAS.produtoLoja("minha-loja", "ABC 1")).toBe("/lojas/minha-loja/produtos/ABC%201");
  });
});
