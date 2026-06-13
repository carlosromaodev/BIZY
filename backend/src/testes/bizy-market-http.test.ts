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

async function criarProdutoMarket(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: {
    codigo: string;
    nome: string;
    categoria?: string | null;
    colecao?: string | null;
    descricao?: string;
    fotos?: string[];
    precoEmKwanza?: number;
    quantidade?: number;
  }
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo: dados.codigo,
      sku: `SKU-${dados.codigo}`,
      nome: dados.nome,
      descricao: dados.descricao ?? `${dados.nome} no Bizy Market`,
      precoEmKwanza: dados.precoEmKwanza ?? 18_000,
      custoEmKwanza: 9_000,
      quantidade: dados.quantidade ?? 4,
      stockMinimo: 1,
      categoria: dados.categoria ?? "Roupas",
      colecao: dados.colecao ?? "Novidades",
      fotos: dados.fotos ?? [`https://example.com/${dados.codigo}.png`],
      variantes: { tamanho: ["M", "G"] },
      vitrine: { selos: ["DESTAQUE"], prioridade: 1 }
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function publicarLojaMarket(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: {
    slug: string;
    nomeComercial: string;
    provincia: string;
    municipio: string;
  }
) {
  const resposta = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers,
    payload: {
      slug: dados.slug,
      descricaoPublica: `${dados.nomeComercial} no Bizy Market.`,
      publicada: true
    }
  });
  expect(resposta.statusCode).toBe(200);
  return resposta.json();
}

describe("Bizy Market público HTTP", () => {
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

  it("lista produtos elegíveis de lojas publicadas com filtros e fornecedor sanitizado", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923610001", "Loja Market A");
      const lojaB = await autenticar(app, "923610002", "Loja Market B");
      const lojaNaoPublicada = await autenticar(app, "923610003", "Loja Fora do Market");

      await criarProdutoMarket(app, lojaA, {
        codigo: "VESTIDO-1",
        nome: "Vestido verde fluido",
        categoria: "Roupas",
        colecao: "Vestidos"
      });
      await criarProdutoMarket(app, lojaA, {
        codigo: "SEM-FOTO",
        nome: "Vestido sem foto",
        categoria: "Roupas",
        fotos: []
      });
      await criarProdutoMarket(app, lojaB, {
        codigo: "SAPATO-1",
        nome: "Sapato social",
        categoria: "Calçado"
      });
      await criarProdutoMarket(app, lojaNaoPublicada, {
        codigo: "VESTIDO-2",
        nome: "Vestido de loja não publicada",
        categoria: "Roupas"
      });

      await publicarLojaMarket(app, lojaA, {
        slug: "loja-market-a",
        nomeComercial: "Loja Market A",
        provincia: "Luanda",
        municipio: "Talatona"
      });
      await publicarLojaMarket(app, lojaB, {
        slug: "loja-market-b",
        nomeComercial: "Loja Market B",
        provincia: "Benguela",
        municipio: "Lobito"
      });

      const resposta = await app.inject({
        method: "GET",
        url: "/publico/market/produtos?categoria=Roupas&busca=vestido&limite=10"
      });

      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json();
      expect(corpo.filtros).toEqual({ busca: "vestido", categoria: "Roupas", limite: 10 });
      expect(corpo.categorias).toEqual([{ categoria: "Roupas", total: 1 }]);
      expect(corpo.produtos).toHaveLength(1);
      expect(corpo.produtos[0]).toEqual(
        expect.objectContaining({
          codigo: "VESTIDO-1",
          nome: "Vestido verde fluido",
          categoria: "Roupas",
          precoEmKwanza: 18_000,
          urlProduto: "/lojas/loja-market-a/produtos/VESTIDO-1",
          urlLoja: "/lojas/loja-market-a",
          loja: expect.objectContaining({
            slug: "loja-market-a",
            nomeComercial: expect.stringContaining("Loja Market A"),
            descricaoPublica: "Loja Market A no Bizy Market."
          })
        })
      );
      expect(JSON.stringify(corpo)).not.toContain("negocioId");
      expect(JSON.stringify(corpo)).not.toContain("custoEmKwanza");
      expect(JSON.stringify(corpo)).not.toContain("margemEstimadaEmKwanza");
      expect(JSON.stringify(corpo)).not.toContain("Loja Fora do Market");
      expect(JSON.stringify(corpo)).not.toContain("SEM-FOTO");
    } finally {
      await app.close();
    }
  }, 30_000);

  it("expõe categorias, detalhe, similares e controla publicação no Market pelo CRM", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923610011", "Loja Market Studio A");
      const lojaB = await autenticar(app, "923610012", "Loja Market Studio B");

      await criarProdutoMarket(app, lojaA, {
        codigo: "VESTIDO-DETALHE",
        nome: "Vestido verde premium",
        categoria: "Roupas",
        colecao: "Vestidos",
        precoEmKwanza: 22_000
      });
      await criarProdutoMarket(app, lojaB, {
        codigo: "VESTIDO-SIMILAR",
        nome: "Vestido verde de outro fornecedor",
        categoria: "Roupas",
        colecao: "Vestidos",
        precoEmKwanza: 24_000
      });
      await criarProdutoMarket(app, lojaB, {
        codigo: "SAPATO-MARKET",
        nome: "Sapato social market",
        categoria: "Calçado",
        precoEmKwanza: 30_000
      });

      await publicarLojaMarket(app, lojaA, {
        slug: "loja-market-studio-a",
        nomeComercial: "Loja Market Studio A",
        provincia: "Luanda",
        municipio: "Talatona"
      });
      await publicarLojaMarket(app, lojaB, {
        slug: "loja-market-studio-b",
        nomeComercial: "Loja Market Studio B",
        provincia: "Luanda",
        municipio: "Viana"
      });

      const categorias = await app.inject({
        method: "GET",
        url: "/publico/market/categorias"
      });
      expect(categorias.statusCode).toBe(200);
      expect(categorias.json().categorias).toEqual([
        expect.objectContaining({ categoria: "Roupas", total: 2, url: "/market/categorias/Roupas" }),
        expect.objectContaining({ categoria: "Calçado", total: 1, url: "/market/categorias/Cal%C3%A7ado" })
      ]);

      const detalhe = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE"
      });
      expect(detalhe.statusCode).toBe(200);
      expect(detalhe.json()).toEqual(
        expect.objectContaining({
          produto: expect.objectContaining({
            codigo: "VESTIDO-DETALHE",
            nome: "Vestido verde premium",
            loja: expect.objectContaining({ slug: "loja-market-studio-a" })
          }),
          similares: [
            expect.objectContaining({
              codigo: "VESTIDO-SIMILAR",
              loja: expect.objectContaining({ slug: "loja-market-studio-b" })
            })
          ]
        })
      );
      expect(JSON.stringify(detalhe.json())).not.toContain("custoEmKwanza");

      const similares = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE/similares?limite=5"
      });
      expect(similares.statusCode).toBe(200);
      expect(similares.json().produtos).toEqual([
        expect.objectContaining({ codigo: "VESTIDO-SIMILAR" })
      ]);

      const similaresDaLoja = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-market-studio-a/produtos/VESTIDO-DETALHE/similares?limite=5"
      });
      expect(similaresDaLoja.statusCode).toBe(200);
      expect(similaresDaLoja.json()).toEqual(
        expect.objectContaining({
          produtoOrigem: expect.objectContaining({
            codigo: "VESTIDO-DETALHE",
            loja: expect.objectContaining({ slug: "loja-market-studio-a" })
          }),
          produtos: [
            expect.objectContaining({
              codigo: "VESTIDO-SIMILAR",
              loja: expect.objectContaining({ slug: "loja-market-studio-b" })
            })
          ]
        })
      );

      const resumo = await app.inject({
        method: "GET",
        url: "/crm/loja/market/resumo",
        headers: lojaA
      });
      expect(resumo.statusCode).toBe(200);
      expect(resumo.json()).toEqual(
        expect.objectContaining({
          loja: expect.objectContaining({ slug: "loja-market-studio-a", publicada: true }),
          produtos: expect.objectContaining({
            total: 1,
            publicados: 1,
            elegiveis: 1,
            comPendencias: 0
          })
        })
      );

      const despublicar = await app.inject({
        method: "PUT",
        url: "/crm/loja/produtos/VESTIDO-DETALHE/publicacao",
        headers: lojaA,
        payload: { publicado: false }
      });
      expect(despublicar.statusCode).toBe(200);
      expect(despublicar.json().produto.vitrine.publicacaoMarket).toEqual(
        expect.objectContaining({ publicado: false, origem: "crm" })
      );

      const detalheDespublicado = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE"
      });
      expect(detalheDespublicado.statusCode).toBe(404);

      const publicarMassa = await app.inject({
        method: "PUT",
        url: "/crm/loja/produtos/publicacao-em-massa",
        headers: lojaA,
        payload: { codigos: ["VESTIDO-DETALHE"], publicado: true }
      });
      expect(publicarMassa.statusCode).toBe(200);
      expect(publicarMassa.json()).toEqual(
        expect.objectContaining({
          totalSolicitado: 1,
          atualizados: 1
        })
      );

      const detalheRepublicado = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE"
      });
      expect(detalheRepublicado.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  }, 30_000);
});
