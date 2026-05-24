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

describe("catálogo e movimentos de stock HTTP", () => {
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

  it("gere produtos comerciais com categoria, coleção, custo, margem e histórico de stock", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923333001", "Loja Catálogo");

      const criacao = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: loja,
        payload: {
          codigo: "sku-01",
          sku: "BIZY-001",
          nome: "Camisa premium",
          descricao: "Camisa preparada para catálogo digital",
          precoEmKwanza: 15_000,
          custoEmKwanza: 9_000,
          quantidade: 2,
          stockMinimo: 3,
          categoria: "Roupas",
          colecao: "Live atual",
          variantes: {
            tamanho: ["M", "G"],
            cor: ["Preto"]
          },
          fotos: ["https://example.com/camisa.png"]
        }
      });
      expect(criacao.statusCode).toBe(201);
      expect(criacao.json()).toEqual(
        expect.objectContaining({
          codigo: "SKU-01",
          sku: "BIZY-001",
          categoria: "Roupas",
          colecao: "Live atual",
          custoEmKwanza: 9_000,
          margemEstimadaEmKwanza: 6_000,
          stockMinimo: 3,
          quantidade: 2,
          estadoStock: "BAIXO_STOCK",
          arquivadaEm: null
        })
      );
      expect(criacao.json().variantes).toEqual({ tamanho: ["M", "G"], cor: ["Preto"] });

      const resumoInicial = await app.inject({
        method: "GET",
        url: "/pecas/resumo",
        headers: loja
      });
      expect(resumoInicial.statusCode).toBe(200);
      expect(resumoInicial.json()).toEqual(
        expect.objectContaining({
          total: 1,
          disponiveis: 1,
          baixoStock: 1,
          esgotadas: 0,
          arquivadas: 0,
          custoTotalEmKwanza: 18_000,
          valorPotencialEmKwanza: 30_000,
          margemPotencialEmKwanza: 12_000
        })
      );
      expect(resumoInicial.json().categorias).toEqual([{ nome: "Roupas", total: 1 }]);
      expect(resumoInicial.json().colecoes).toEqual([{ nome: "Live atual", total: 1 }]);

      const entrada = await app.inject({
        method: "POST",
        url: "/pecas/SKU-01/movimentos",
        headers: loja,
        payload: {
          tipo: "ENTRADA",
          quantidade: 5,
          motivo: "Reposição semanal",
          responsavelId: "operador_1",
          origem: "admin"
        }
      });
      expect(entrada.statusCode).toBe(201);
      expect(entrada.json().peca).toEqual(
        expect.objectContaining({
          quantidade: 7,
          estadoStock: "DISPONIVEL"
        })
      );
      expect(entrada.json().movimento).toEqual(
        expect.objectContaining({
          codigoPeca: "SKU-01",
          tipo: "ENTRADA",
          quantidade: 5,
          quantidadeAnterior: 2,
          quantidadeNova: 7,
          motivo: "Reposição semanal",
          responsavelId: "operador_1",
          origem: "admin"
        })
      );

      const saida = await app.inject({
        method: "POST",
        url: "/pecas/SKU-01/movimentos",
        headers: loja,
        payload: {
          tipo: "SAIDA",
          quantidade: 2,
          motivo: "Venda balcão"
        }
      });
      expect(saida.statusCode).toBe(201);
      expect(saida.json().peca).toEqual(expect.objectContaining({ quantidade: 5 }));

      const movimentos = await app.inject({
        method: "GET",
        url: "/pecas/SKU-01/movimentos",
        headers: loja
      });
      expect(movimentos.statusCode).toBe(200);
      expect(movimentos.json().movimentos).toEqual([
        expect.objectContaining({
          tipo: "SAIDA",
          quantidadeAnterior: 7,
          quantidadeNova: 5
        }),
        expect.objectContaining({
          tipo: "ENTRADA",
          quantidadeAnterior: 2,
          quantidadeNova: 7
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("mantém stock isolado por loja e recusa saída maior que o disponível", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923333101", "Loja Stock A");
      const lojaB = await autenticar(app, "923333102", "Loja Stock B");

      const criarProduto = async (headers: Record<string, string>, nome: string, quantidade: number) => {
        const resposta = await app.inject({
          method: "POST",
          url: "/pecas",
          headers,
          payload: {
            codigo: "01",
            nome,
            descricao: "Produto com código repetido por loja",
            precoEmKwanza: 10_000,
            quantidade,
            stockMinimo: 1,
            categoria: "Partilhado",
            fotos: []
          }
        });
        expect(resposta.statusCode).toBe(201);
        return resposta.json();
      };

      await criarProduto(lojaA, "Produto Loja A", 4);
      await criarProduto(lojaB, "Produto Loja B", 1);

      const saidaA = await app.inject({
        method: "POST",
        url: "/pecas/01/movimentos",
        headers: lojaA,
        payload: {
          tipo: "SAIDA",
          quantidade: 3,
          motivo: "Venda live"
        }
      });
      expect(saidaA.statusCode).toBe(201);
      expect(saidaA.json().peca).toEqual(
        expect.objectContaining({
          nome: "Produto Loja A",
          quantidade: 1,
          estadoStock: "BAIXO_STOCK"
        })
      );

      const saidaMaiorQueStock = await app.inject({
        method: "POST",
        url: "/pecas/01/movimentos",
        headers: lojaB,
        payload: {
          tipo: "SAIDA",
          quantidade: 2,
          motivo: "Tentativa inválida"
        }
      });
      expect(saidaMaiorQueStock.statusCode).toBe(400);
      expect(saidaMaiorQueStock.json().mensagem).toContain("Stock insuficiente");

      const listaB = await app.inject({
        method: "GET",
        url: "/pecas",
        headers: lojaB
      });
      expect(listaB.statusCode).toBe(200);
      expect(listaB.json()).toEqual([
        expect.objectContaining({
          nome: "Produto Loja B",
          quantidade: 1,
          estadoStock: "BAIXO_STOCK"
        })
      ]);

      const resumoB = await app.inject({
        method: "GET",
        url: "/pecas/resumo",
        headers: lojaB
      });
      expect(resumoB.statusCode).toBe(200);
      expect(resumoB.json()).toEqual(
        expect.objectContaining({
          total: 1,
          baixoStock: 1,
          valorPotencialEmKwanza: 10_000
        })
      );
    } finally {
      await app.close();
    }
  });
});
