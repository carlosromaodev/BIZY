import type { ComissaoParceiro } from "../../../dominio/tipos.js";
import type {
  DistribuicaoComissao, MovimentoLedgerComissao, PayoutComissao, RepositorioLedgerComissoes,
  SaldoLedger, SaldosComissao, TipoMovimentoLedger
} from "../dominio/ledgerComissoes.js";

const papeisPermitidos = new Set(["CRIADOR", "AFILIADO", "HOST", "CLOSER", "VENDEDOR", "RECUPERACAO", "CAMPANHA"]);

export class LedgerComissoesUseCase {
  constructor(private readonly repositorio: RepositorioLedgerComissoes) {}

  async criarDistribuicao(negocioId: string, dados: {
    origemTipo: string; origemId: string; pedidoId?: string | null; conversaoId?: string | null; comissaoLegadaId?: string | null;
    politicaCodigo: string; politicaVersao: string; valorBaseEmKwanza: number; valorComissaoKwanza: number; moeda?: string;
    margemEmKwanza?: number | null; comissaoMaximaKwanza?: number | null; explicacao?: Record<string, unknown>;
    participantes: Array<{ parceiroId: string; papel: string; pesoBasisPoints: number }>;
  }): Promise<DistribuicaoComissao> {
    const existente = await this.repositorio.buscarDistribuicao(negocioId, dados.origemTipo, dados.origemId);
    if (existente) return existente;
    if (!Number.isInteger(dados.valorComissaoKwanza) || dados.valorComissaoKwanza <= 0) throw new Error("COMISSAO_INVALIDA");
    if (dados.margemEmKwanza != null && dados.valorComissaoKwanza > dados.margemEmKwanza) throw new Error("COMISSAO_EXCEDE_MARGEM");
    if (dados.comissaoMaximaKwanza != null && dados.valorComissaoKwanza > dados.comissaoMaximaKwanza) throw new Error("COMISSAO_EXCEDE_MAXIMO");
    if (!dados.participantes.length || new Set(dados.participantes.map((item) => `${item.parceiroId}:${item.papel}`)).size !== dados.participantes.length) throw new Error("PARTICIPANTES_INVALIDOS");
    if (dados.participantes.some((item) => !papeisPermitidos.has(item.papel) || !Number.isInteger(item.pesoBasisPoints) || item.pesoBasisPoints <= 0)) throw new Error("PARTICIPANTES_INVALIDOS");
    if (dados.participantes.reduce((total, item) => total + item.pesoBasisPoints, 0) !== 10_000) throw new Error("PESOS_DEVEM_SOMAR_10000");

    let distribuido = 0;
    const participantes = dados.participantes.map((item, indice) => {
      const valor = indice === dados.participantes.length - 1
        ? dados.valorComissaoKwanza - distribuido
        : Math.floor(dados.valorComissaoKwanza * item.pesoBasisPoints / 10_000);
      distribuido += valor;
      return { ...item, valorEmKwanza: valor };
    });
    const distribuicao = await this.repositorio.criarDistribuicao({
      negocioId, origemTipo: dados.origemTipo, origemId: dados.origemId, pedidoId: dados.pedidoId ?? null,
      conversaoId: dados.conversaoId ?? null, comissaoLegadaId: dados.comissaoLegadaId ?? null,
      politicaCodigo: dados.politicaCodigo, politicaVersao: dados.politicaVersao,
      valorBaseEmKwanza: dados.valorBaseEmKwanza, valorComissaoKwanza: dados.valorComissaoKwanza,
      moeda: dados.moeda ?? "AOA", margemEmKwanza: dados.margemEmKwanza ?? null,
      comissaoMaximaKwanza: dados.comissaoMaximaKwanza ?? null, explicacao: dados.explicacao ?? {}, participantes
    });
    await Promise.all(distribuicao.participantes.filter((item) => item.valorEmKwanza > 0).map((item) => this.movimentar({
      negocioId, parceiroId: item.parceiroId, distribuicaoId: distribuicao.id, tipo: "CREDITO_ESTIMADO",
      saldoOrigem: null, saldoDestino: "ESTIMADO", valorEmKwanza: item.valorEmKwanza, moeda: distribuicao.moeda,
      idempotencyKey: `dist:${distribuicao.id}:${item.id}:estimado`, motivo: "Comissao estimada pela politica de distribuicao.",
      politicaVersao: distribuicao.politicaVersao
    })));
    return distribuicao;
  }

  async confirmarDistribuicao(negocioId: string, distribuicao: DistribuicaoComissao) {
    for (const item of distribuicao.participantes.filter((parte) => parte.valorEmKwanza > 0)) {
      await this.movimentar({ negocioId, parceiroId: item.parceiroId, distribuicaoId: distribuicao.id, tipo: "CREDITO_CONFIRMADO", saldoOrigem: "ESTIMADO", saldoDestino: "CONFIRMADO", valorEmKwanza: item.valorEmKwanza, moeda: item.moeda, idempotencyKey: `dist:${distribuicao.id}:${item.id}:confirmado`, motivo: "Comissao confirmada.", politicaVersao: distribuicao.politicaVersao });
      await this.movimentar({ negocioId, parceiroId: item.parceiroId, distribuicaoId: distribuicao.id, tipo: "LIBERTACAO", saldoOrigem: "CONFIRMADO", saldoDestino: "DISPONIVEL", valorEmKwanza: item.valorEmKwanza, moeda: item.moeda, idempotencyKey: `dist:${distribuicao.id}:${item.id}:disponivel`, motivo: "Comissao liberada para payout.", politicaVersao: distribuicao.politicaVersao });
    }
  }

  async confirmarDistribuicaoPorId(negocioId: string, id: string) {
    const distribuicao = (await this.repositorio.listarDistribuicoes(negocioId)).find((item) => item.id === id);
    if (!distribuicao) return null;
    await this.confirmarDistribuicao(negocioId, distribuicao);
    return distribuicao;
  }

  async reter(negocioId: string, parceiroId: string, valorEmKwanza: number, motivo: string, chave: string) {
    const saldo = await this.obterSaldos(negocioId, parceiroId);
    if (valorEmKwanza <= 0 || saldo.DISPONIVEL < valorEmKwanza) throw new Error("SALDO_INSUFICIENTE");
    return this.movimentar({ negocioId, parceiroId, distribuicaoId: null, tipo: "RETENCAO", saldoOrigem: "DISPONIVEL", saldoDestino: "RETIDO", valorEmKwanza, moeda: "AOA", idempotencyKey: chave, motivo, politicaVersao: "ledger.v1" });
  }

  async libertar(negocioId: string, parceiroId: string, valorEmKwanza: number, motivo: string, chave: string) {
    const saldo = await this.obterSaldos(negocioId, parceiroId);
    if (valorEmKwanza <= 0 || saldo.RETIDO < valorEmKwanza) throw new Error("SALDO_INSUFICIENTE");
    return this.movimentar({ negocioId, parceiroId, distribuicaoId: null, tipo: "LIBERTACAO", saldoOrigem: "RETIDO", saldoDestino: "DISPONIVEL", valorEmKwanza, moeda: "AOA", idempotencyKey: chave, motivo, politicaVersao: "ledger.v1" });
  }

  async criarPayout(negocioId: string, dados: { parceiroId: string; valorEmKwanza: number; idempotencyKey: string; solicitadoPorId?: string | null }) {
    const existente = (await this.repositorio.listarPayouts(negocioId, dados.parceiroId)).find((item) => item.idempotencyKey === dados.idempotencyKey);
    if (existente) return existente;
    const saldo = await this.obterSaldos(negocioId, dados.parceiroId);
    if (dados.valorEmKwanza <= 0 || saldo.DISPONIVEL < dados.valorEmKwanza) throw new Error("SALDO_INSUFICIENTE");
    const payout = await this.repositorio.criarPayout({ negocioId, parceiroId: dados.parceiroId, valorEmKwanza: dados.valorEmKwanza, moeda: "AOA", idempotencyKey: dados.idempotencyKey, solicitadoPorId: dados.solicitadoPorId ?? null });
    await this.movimentar({ negocioId, parceiroId: dados.parceiroId, distribuicaoId: null, payoutId: payout.id, tipo: "PAGAMENTO", saldoOrigem: "DISPONIVEL", saldoDestino: "EM_PAGAMENTO", valorEmKwanza: dados.valorEmKwanza, moeda: "AOA", idempotencyKey: `payout:${payout.id}:reservado`, motivo: "Saldo reservado para payout.", politicaVersao: "ledger.v1" });
    return payout;
  }

  async concluirPayout(negocioId: string, id: string, referencia: string) {
    const payout = await this.repositorio.buscarPayout(id, negocioId);
    if (!payout) return null;
    if (payout.estado === "PAGO") return payout;
    if (payout.estado !== "EM_PROCESSAMENTO") throw new Error("PAYOUT_ESTADO_INVALIDO");
    await this.movimentar({ negocioId, parceiroId: payout.parceiroId, distribuicaoId: null, payoutId: payout.id, tipo: "PAGAMENTO", saldoOrigem: "EM_PAGAMENTO", saldoDestino: "PAGO", valorEmKwanza: payout.valorEmKwanza, moeda: payout.moeda, idempotencyKey: `payout:${payout.id}:pago`, motivo: "Payout confirmado pelo operador.", referencia, politicaVersao: "ledger.v1" });
    return this.repositorio.concluirPayout(id, negocioId, referencia);
  }

  async falharPayout(negocioId: string, id: string, motivo: string) {
    const payout = await this.repositorio.buscarPayout(id, negocioId);
    if (!payout) return null;
    if (payout.estado === "FALHOU") return payout;
    if (payout.estado !== "EM_PROCESSAMENTO") throw new Error("PAYOUT_ESTADO_INVALIDO");
    await this.movimentar({ negocioId, parceiroId: payout.parceiroId, distribuicaoId: null, payoutId: payout.id, tipo: "ESTORNO_PAGAMENTO", saldoOrigem: "EM_PAGAMENTO", saldoDestino: "DISPONIVEL", valorEmKwanza: payout.valorEmKwanza, moeda: payout.moeda, idempotencyKey: `payout:${payout.id}:falhou`, motivo, politicaVersao: "ledger.v1" });
    return this.repositorio.falharPayout(id, negocioId, motivo);
  }

  async sincronizarComissaoLegada(comissao: ComissaoParceiro) {
    if (comissao.valorEmKwanza <= 0) return null;
    const distribuicao = await this.criarDistribuicao(comissao.negocioId, {
      origemTipo: "LEGACY_COMMISSION", origemId: comissao.id, pedidoId: comissao.pedidoId, comissaoLegadaId: comissao.id,
      politicaCodigo: "legacy.commission", politicaVersao: "legacy.commission.v1", valorBaseEmKwanza: comissao.baseEmKwanza,
      valorComissaoKwanza: comissao.valorEmKwanza, participantes: [{ parceiroId: comissao.afiliadoId, papel: "AFILIADO", pesoBasisPoints: 10_000 }],
      explicacao: { compatibilidade: "ComissaoParceiro", status: comissao.status }
    });
    if (["CONFIRMADA", "PAGA"].includes(comissao.status)) await this.confirmarDistribuicao(comissao.negocioId, distribuicao);
    if (comissao.status === "PAGA") {
      const payout = await this.criarPayout(comissao.negocioId, { parceiroId: comissao.afiliadoId, valorEmKwanza: comissao.valorEmKwanza, idempotencyKey: `legacy:${comissao.id}:payout` });
      await this.concluirPayout(comissao.negocioId, payout.id, comissao.referenciaPagamento ?? `legacy-${comissao.id}`);
    }
    if (["REVERTIDA", "CANCELADA"].includes(comissao.status)) await this.reverterDisponivel(comissao.negocioId, comissao.afiliadoId, comissao.valorEmKwanza, comissao.motivo ?? "Reversao legada", `legacy:${comissao.id}:revertido`);
    return distribuicao;
  }

  async obterSaldos(negocioId: string, parceiroId?: string): Promise<SaldosComissao> {
    const saldos: SaldosComissao = { ESTIMADO: 0, CONFIRMADO: 0, RETIDO: 0, DISPONIVEL: 0, EM_PAGAMENTO: 0, PAGO: 0, REVERTIDO: 0, EM_DISPUTA: 0 };
    for (const movimento of await this.repositorio.listarMovimentos(negocioId, parceiroId)) {
      if (movimento.saldoOrigem) saldos[movimento.saldoOrigem] -= movimento.valorEmKwanza;
      if (movimento.saldoDestino) saldos[movimento.saldoDestino] += movimento.valorEmKwanza;
    }
    return saldos;
  }

  async obterExtrato(negocioId: string, parceiroId?: string) {
    return { saldos: await this.obterSaldos(negocioId, parceiroId), movimentos: await this.repositorio.listarMovimentos(negocioId, parceiroId), distribuicoes: await this.repositorio.listarDistribuicoes(negocioId, parceiroId), payouts: await this.repositorio.listarPayouts(negocioId, parceiroId) };
  }

  private async reverterDisponivel(negocioId: string, parceiroId: string, valor: number, motivo: string, chave: string) {
    const saldos = await this.obterSaldos(negocioId, parceiroId);
    const origem: SaldoLedger = saldos.DISPONIVEL >= valor ? "DISPONIVEL" : saldos.ESTIMADO >= valor ? "ESTIMADO" : "CONFIRMADO";
    if (saldos[origem] < valor) return null;
    return this.movimentar({ negocioId, parceiroId, distribuicaoId: null, tipo: "REVERSAO", saldoOrigem: origem, saldoDestino: "REVERTIDO", valorEmKwanza: valor, moeda: "AOA", idempotencyKey: chave, motivo, politicaVersao: "ledger.v1" });
  }

  private movimentar(dados: {
    negocioId: string; parceiroId: string; distribuicaoId: string | null; payoutId?: string | null; tipo: TipoMovimentoLedger;
    saldoOrigem: SaldoLedger | null; saldoDestino: SaldoLedger | null; valorEmKwanza: number; moeda: string;
    idempotencyKey: string; motivo: string; referencia?: string | null; politicaVersao: string; autorId?: string | null;
  }): Promise<MovimentoLedgerComissao> {
    return this.repositorio.registrarMovimento({ ...dados, payoutId: dados.payoutId ?? null, referencia: dados.referencia ?? null, autorId: dados.autorId ?? null, metadata: {} });
  }
}
