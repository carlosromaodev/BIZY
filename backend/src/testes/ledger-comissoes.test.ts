import { describe, expect, it } from "vitest";
import { LedgerComissoesUseCase } from "../projetos/market/aplicacao/LedgerComissoesUseCase.js";
import { RepositorioLedgerComissoesMemoria } from "../projetos/market/infra/repositorios/RepositorioLedgerComissoesMemoria.js";

describe("ledger imutavel de comissoes", () => {
  it("distribui exactamente 100%, transita saldos e impede payout duplicado", async () => {
    const ledger = new LedgerComissoesUseCase(new RepositorioLedgerComissoesMemoria());
    const distribuicao = await ledger.criarDistribuicao("negocio-1", {
      origemTipo: "CONVERSAO", origemId: "conversao-1", politicaCodigo: "collab", politicaVersao: "collab.v1",
      valorBaseEmKwanza: 50_000, valorComissaoKwanza: 10_001, margemEmKwanza: 20_000, comissaoMaximaKwanza: 12_000,
      participantes: [
        { parceiroId: "creator-1", papel: "CRIADOR", pesoBasisPoints: 6_000 },
        { parceiroId: "closer-1", papel: "CLOSER", pesoBasisPoints: 4_000 }
      ]
    });
    expect(distribuicao.participantes.map((item) => item.valorEmKwanza)).toEqual([6_000, 4_001]);
    expect(distribuicao.participantes.reduce((total, item) => total + item.valorEmKwanza, 0)).toBe(10_001);
    await ledger.confirmarDistribuicao("negocio-1", distribuicao);
    expect((await ledger.obterSaldos("negocio-1", "creator-1")).DISPONIVEL).toBe(6_000);
    await ledger.reter("negocio-1", "creator-1", 1_000, "Janela de risco", "hold-creator-1");
    await ledger.libertar("negocio-1", "creator-1", 500, "Revisao concluida", "release-creator-1");
    const payout = await ledger.criarPayout("negocio-1", { parceiroId: "creator-1", valorEmKwanza: 3_000, idempotencyKey: "payout-creator-1" });
    const repetido = await ledger.criarPayout("negocio-1", { parceiroId: "creator-1", valorEmKwanza: 3_000, idempotencyKey: "payout-creator-1" });
    expect(repetido.id).toBe(payout.id);
    await ledger.concluirPayout("negocio-1", payout.id, "BANK-001");
    await ledger.concluirPayout("negocio-1", payout.id, "BANK-001");
    expect(await ledger.obterSaldos("negocio-1", "creator-1")).toEqual(expect.objectContaining({ DISPONIVEL: 2_500, RETIDO: 500, PAGO: 3_000, EM_PAGAMENTO: 0 }));
    expect((await ledger.obterExtrato("negocio-1", "creator-1")).movimentos).toHaveLength(7);
  });

  it("rejeita pesos, margem, limite e saldo invalidos", async () => {
    const ledger = new LedgerComissoesUseCase(new RepositorioLedgerComissoesMemoria());
    const base = { origemTipo: "PEDIDO", origemId: "pedido-1", politicaCodigo: "p", politicaVersao: "1", valorBaseEmKwanza: 10_000, valorComissaoKwanza: 2_000, participantes: [{ parceiroId: "a", papel: "AFILIADO", pesoBasisPoints: 9_999 }] };
    await expect(ledger.criarDistribuicao("n", base)).rejects.toThrow("PESOS_DEVEM_SOMAR_10000");
    await expect(ledger.criarDistribuicao("n", { ...base, origemId: "pedido-2", margemEmKwanza: 1_000, participantes: [{ ...base.participantes[0], pesoBasisPoints: 10_000 }] })).rejects.toThrow("COMISSAO_EXCEDE_MARGEM");
    await expect(ledger.criarPayout("n", { parceiroId: "a", valorEmKwanza: 1, idempotencyKey: "sem-saldo" })).rejects.toThrow("SALDO_INSUFICIENTE");
  });
});
