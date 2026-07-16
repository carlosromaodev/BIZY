import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ConfiancaCommerceUseCase } from "../projetos/market/aplicacao/ConfiancaCommerceUseCase.js";

describe("confianca, risco e proteccao commerce", () => {
  it("detecta sinais sensiveis e cria revisao humana explicavel", async () => {
    const criarCaso = vi.fn(async ({ data }) => ({ id: "caso-1", ...data }));
    const prisma = { casoRiscoCommerce: { create: criarCaso } } as unknown as PrismaClient;
    const useCase = new ConfiancaCommerceUseCase(prisma);
    const baixo = await useCase.analisarRisco({ negocioId: "n", sinais: { cliquesArtificiais: 2 } });
    expect(baixo).toEqual({ score: 6, revisaoHumana: false, caso: null });
    const critico = await useCase.analisarRisco({ negocioId: "n", payoutId: "p", sinais: { payoutDuplicado: true, contasRelacionadas: true, abusoCupons: 3 } });
    expect(critico).toEqual(expect.objectContaining({ score: 100, revisaoHumana: true }));
    expect(criarCaso).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ severidade: "CRITICA", scoreRisco: 100 }) }));
  });

  it("aceita avaliacao apenas de compra entregue e produto do pedido", async () => {
    const create = vi.fn(async ({ data }) => ({ id: "avaliacao-1", ...data }));
    const prisma = {
      pedidoFilho: { findFirst: vi.fn(async () => ({ negocioId: "n", compraUnificadaId: "c", estadoEntrega: "ENTREGUE" })) },
      pedido: { findFirst: vi.fn(async () => ({ id: "p", negocioId: "n", entregueEm: new Date(), estadoEntrega: "ENTREGUE", itens: [{ pecaId: "produto-1" }] })) },
      avaliacaoVerificadaCommerce: { create, findMany: vi.fn(async () => [{ notaSeller: 5 }]) },
      scoreConfiancaCommerce: { upsert: vi.fn(async ({ create: dados }) => dados) }
    } as unknown as PrismaClient;
    const useCase = new ConfiancaCommerceUseCase(prisma);
    await expect(useCase.criarAvaliacao("conta", { pedidoId: "p", pecaId: "produto-2", notaProduto: 5, notaEntrega: 5, notaSeller: 5 })).rejects.toThrow("PRODUTO_NAO_PERTENCE_AO_PEDIDO");
    const avaliacao = await useCase.criarAvaliacao("conta", { pedidoId: "p", pecaId: "produto-1", notaProduto: 5, notaEntrega: 4, notaSeller: 5 });
    expect(avaliacao).toEqual(expect.objectContaining({ pedidoId: "p", pecaId: "produto-1" }));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("publica apenas medias baseadas em avaliacoes verificadas", async () => {
    const findMany = vi.fn()
      .mockResolvedValueOnce([
        { id: "a-1", notaProduto: 5, notaEntrega: 4, notaSeller: 4, titulo: null, comentario: "Bom", compraVerificada: true, criadoEm: new Date() },
        { id: "a-2", notaProduto: 4, notaEntrega: 5, notaSeller: 5, titulo: null, comentario: null, compraVerificada: true, criadoEm: new Date() }
      ])
      .mockResolvedValueOnce([{ notaSeller: 4 }, { notaSeller: 5 }]);
    const prisma = {
      peca: { findUnique: vi.fn(async () => ({ negocioId: "seller-1" })) },
      avaliacaoVerificadaCommerce: { findMany }
    } as unknown as PrismaClient;

    const resumo = await new ConfiancaCommerceUseCase(prisma).obterResumoPublicoProduto("produto-1");

    expect(resumo).toEqual(expect.objectContaining({
      produto: { media: 4.5, total: 2 },
      seller: { media: 4.5, total: 2 }
    }));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ compraVerificada: true, estado: "PUBLICADA" })
    }));
  });
});
