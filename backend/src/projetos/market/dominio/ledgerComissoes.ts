export const saldosLedger = ["ESTIMADO", "CONFIRMADO", "RETIDO", "DISPONIVEL", "EM_PAGAMENTO", "PAGO", "REVERTIDO", "EM_DISPUTA"] as const;
export type SaldoLedger = (typeof saldosLedger)[number];

export const tiposMovimentoLedger = [
  "CREDITO_ESTIMADO", "CREDITO_CONFIRMADO", "RETENCAO", "LIBERTACAO", "AJUSTE_POSITIVO",
  "AJUSTE_NEGATIVO", "REVERSAO", "PAGAMENTO", "ESTORNO_PAGAMENTO", "DISPUTA", "RESOLUCAO_DISPUTA"
] as const;
export type TipoMovimentoLedger = (typeof tiposMovimentoLedger)[number];

export interface ParticipanteDistribuicao {
  id: string; distribuicaoId: string; negocioId: string; parceiroId: string; papel: string;
  pesoBasisPoints: number; valorEmKwanza: number; moeda: string; criadoEm: Date;
}

export interface DistribuicaoComissao {
  id: string; negocioId: string; origemTipo: string; origemId: string; pedidoId: string | null;
  conversaoId: string | null; comissaoLegadaId: string | null; politicaCodigo: string; politicaVersao: string;
  valorBaseEmKwanza: number; valorComissaoKwanza: number; moeda: string; margemEmKwanza: number | null;
  comissaoMaximaKwanza: number | null; explicacao: Record<string, unknown>; criadaEm: Date;
  participantes: ParticipanteDistribuicao[];
}

export interface MovimentoLedgerComissao {
  id: string; negocioId: string; parceiroId: string; distribuicaoId: string | null; payoutId: string | null;
  tipo: TipoMovimentoLedger; saldoOrigem: SaldoLedger | null; saldoDestino: SaldoLedger | null;
  valorEmKwanza: number; moeda: string; idempotencyKey: string; motivo: string; referencia: string | null;
  politicaVersao: string; autorId: string | null; metadata: Record<string, unknown>; criadoEm: Date;
}

export interface PayoutComissao {
  id: string; negocioId: string; parceiroId: string; estado: "EM_PROCESSAMENTO" | "PAGO" | "FALHOU" | "CANCELADO";
  valorEmKwanza: number; moeda: string; idempotencyKey: string; referenciaProvider: string | null;
  motivoFalha: string | null; solicitadoPorId: string | null; criadoEm: Date; processadoEm: Date | null; atualizadoEm: Date;
}

export type SaldosComissao = Record<SaldoLedger, number>;

export interface RepositorioLedgerComissoes {
  criarDistribuicao(dados: Omit<DistribuicaoComissao, "id" | "criadaEm" | "participantes"> & {
    participantes: Array<Pick<ParticipanteDistribuicao, "parceiroId" | "papel" | "pesoBasisPoints" | "valorEmKwanza">>;
  }): Promise<DistribuicaoComissao>;
  buscarDistribuicao(negocioId: string, origemTipo: string, origemId: string): Promise<DistribuicaoComissao | null>;
  listarDistribuicoes(negocioId: string, parceiroId?: string): Promise<DistribuicaoComissao[]>;
  registrarMovimento(dados: Omit<MovimentoLedgerComissao, "id" | "criadoEm">): Promise<MovimentoLedgerComissao>;
  listarMovimentos(negocioId: string, parceiroId?: string): Promise<MovimentoLedgerComissao[]>;
  criarPayout(dados: Omit<PayoutComissao, "id" | "estado" | "referenciaProvider" | "motivoFalha" | "criadoEm" | "processadoEm" | "atualizadoEm">): Promise<PayoutComissao>;
  buscarPayout(id: string, negocioId: string): Promise<PayoutComissao | null>;
  listarPayouts(negocioId: string, parceiroId?: string): Promise<PayoutComissao[]>;
  concluirPayout(id: string, negocioId: string, referencia: string): Promise<PayoutComissao | null>;
  falharPayout(id: string, negocioId: string, motivo: string): Promise<PayoutComissao | null>;
}
