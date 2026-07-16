import { describe, expect, it, vi } from "vitest";
import type { CarrinhoCommerceUseCase } from "../projetos/market/aplicacao/CarrinhoCommerceUseCase.js";
import { CarrinhosPartilhaveisUseCase } from "../projetos/market/aplicacao/CarrinhosPartilhaveisUseCase.js";
import type { RepositorioCarrinhosPartilhaveis } from "../projetos/market/dominio/carrinhosPartilhaveis.js";

describe("carrinhos partilhaveis e live afiliada", () => {
  it("importa snapshot multi-loja preservando parceiro, campanha, live e papel do host", async () => {
    const sincronizar = vi.fn(async (dados) => ({ carrinho: { id: "cart", itens: dados.itens }, token: "guest-token" }));
    const repositorio = {
      buscarPublicoPorCodigo: vi.fn(async () => ({ id: "share", codigo: "LIVE123", estado: "ATIVO", expiraEm: null, parceiroId: "host", campanhaId: "camp", liveId: "live", criadoPorTipo: "CRIADOR", itensJson: JSON.stringify([{ slugLoja: "loja-a", codigoPeca: "A1", varianteSelecionada: { Cor: "Preto" }, quantidade: 1 }, { slugLoja: "loja-b", codigoPeca: "B1", quantidade: 2 }]) })),
      incrementarImportacoes: vi.fn(async () => undefined)
    } as unknown as RepositorioCarrinhosPartilhaveis;
    const useCase = new CarrinhosPartilhaveisUseCase(repositorio, { sincronizar } as unknown as CarrinhoCommerceUseCase);
    const resultado = await useCase.importar("live123", null, null);
    expect(resultado?.token).toBe("guest-token");
    expect(sincronizar).toHaveBeenCalledWith(expect.objectContaining({ modo: "MESCLAR", itens: expect.arrayContaining([expect.objectContaining({ origem: "live-afiliada", atribuicao: expect.objectContaining({ parceiroId: "host", campanhaId: "camp", liveId: "live", papel: "HOST" }) })]) }));
  });

  it("rejeita destaque de live ou produto fora do tenant", async () => {
    const repositorio = {
      validarDestaque: vi.fn(async () => "LIVE_OU_PRODUTO_NAO_ENCONTRADO")
    } as unknown as RepositorioCarrinhosPartilhaveis;
    const useCase = new CarrinhosPartilhaveisUseCase(repositorio, {} as CarrinhoCommerceUseCase);
    expect(await useCase.destacarLive("negocio", { liveId: "outra-live", pecaId: "p" })).toBeNull();
  });
});
