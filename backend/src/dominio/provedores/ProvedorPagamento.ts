export const metodosPagamento = ["TRANSFERENCIA", "DINHEIRO_ENTREGA", "COMPROVATIVO", "PERSONALIZADO"] as const;
export type MetodoPagamento = (typeof metodosPagamento)[number];

export interface DadosPagamento {
  pedidoId: string;
  negocioId: string;
  valorEmKwanza: number;
  moeda: string;
  metodo: MetodoPagamento;
  referencia?: string | null;
  comprovativoUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ResultadoPagamento {
  sucesso: boolean;
  transacaoId: string | null;
  provider: string;
  estado: "PENDENTE" | "CONFIRMADO" | "REJEITADO" | "FALHOU";
  motivo?: string | null;
  processadoEm: Date;
}

export interface ResultadoReembolso {
  sucesso: boolean;
  transacaoId: string | null;
  provider: string;
  valorReembolsadoEmKwanza: number;
  processadoEm: Date;
}

export interface ProvedorPagamento {
  readonly nome: string;
  processarPagamento(dados: DadosPagamento): Promise<ResultadoPagamento>;
  confirmarPagamento(transacaoId: string): Promise<ResultadoPagamento>;
  reembolsar(transacaoId: string, valorEmKwanza: number): Promise<ResultadoReembolso>;
  verificarEstado(transacaoId: string): Promise<ResultadoPagamento>;
}
