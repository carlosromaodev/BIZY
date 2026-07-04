import { describe, expect, it } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { RepassesFinanceirosUseCase } from "../use-case/RepassesFinanceirosUseCase.js";
import {
  RepositorioComprasUnificadasMemoria,
  RepositorioPedidosMemoria,
  RepositorioReembolsosMemoria,
  RepositorioRepassesFinanceirosMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

describe("RepassesFinanceirosUseCase", () => {
  it("RF-072/RN-034: agrega resumo financeiro administrativo por fornecedor e estado", async () => {
    const repassesFinanceiros = new RepositorioRepassesFinanceirosMemoria();
    const useCase = new RepassesFinanceirosUseCase({
      repassesFinanceiros,
      reembolsos: new RepositorioReembolsosMemoria(),
      comprasUnificadas: new RepositorioComprasUnificadasMemoria(),
      pedidos: new RepositorioPedidosMemoria(),
      eventos: new DespachadorEventos()
    });

    await repassesFinanceiros.criar({
      negocioId: "loja-a",
      pedidoId: "pedido-a-1",
      valorBrutoEmKwanza: 10_000,
      taxaBizyEmKwanza: 1_000
    });

    const conciliado = await repassesFinanceiros.criar({
      negocioId: "loja-a",
      pedidoId: "pedido-a-2",
      valorBrutoEmKwanza: 20_000,
      taxaBizyEmKwanza: 2_000,
      comissaoEmKwanza: 1_000
    });
    await repassesFinanceiros.conciliar(conciliado.id, "loja-a");

    const pago = await repassesFinanceiros.criar({
      negocioId: "loja-b",
      pedidoId: "pedido-b-1",
      valorBrutoEmKwanza: 5_000,
      taxaBizyEmKwanza: 500
    });
    await repassesFinanceiros.conciliar(pago.id, "loja-b");
    await repassesFinanceiros.aprovar(pago.id, "loja-b");
    await repassesFinanceiros.pagar(pago.id, "loja-b", "TRX-1");

    const cancelado = await repassesFinanceiros.criar({
      negocioId: "loja-b",
      pedidoId: "pedido-b-2",
      valorBrutoEmKwanza: 8_000,
      descontoEmKwanza: 1_000
    });
    await repassesFinanceiros.cancelar(cancelado.id, "loja-b", "Pedido cancelado");

    const resumo = await useCase.resumoFinanceiroAdmin();

    expect(resumo.fornecedores).toEqual([
      expect.objectContaining({
        negocioId: "loja-a",
        pendente: 9_000,
        conciliado: 17_000,
        aprovado: 0,
        pago: 0,
        cancelado: 0,
        totalLiquido: 26_000,
        quantidade: 2
      }),
      expect.objectContaining({
        negocioId: "loja-b",
        pendente: 0,
        conciliado: 0,
        aprovado: 0,
        pago: 4_500,
        cancelado: 7_000,
        totalLiquido: 11_500,
        quantidade: 2
      })
    ]);
    expect(resumo.totais).toEqual({
      pendente: 9_000,
      conciliado: 17_000,
      aprovado: 0,
      pago: 4_500,
      cancelado: 7_000,
      totalLiquido: 37_500,
      quantidade: 4
    });
    expect(new Date(resumo.atualizadoEm).toString()).not.toBe("Invalid Date");
  });
});
