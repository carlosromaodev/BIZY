import type { PaginacaoOffset } from "../../dominio/tipos.js";

export function normalizarLimitePaginacao(limite?: number, padrao = 100, maximo = 10_000): number {
  if (typeof limite !== "number" || !Number.isFinite(limite)) return padrao;
  return Math.max(1, Math.min(Math.trunc(limite), maximo));
}

export function normalizarOffsetPaginacao(offset?: number): number {
  if (typeof offset !== "number" || !Number.isFinite(offset)) return 0;
  return Math.max(0, Math.trunc(offset));
}

export function montarPaginacaoOffset(total: number, limite: number, offset: number): PaginacaoOffset {
  const proximoOffset = offset + limite;
  const anteriorOffset = Math.max(0, offset - limite);
  return {
    total,
    limite,
    offset,
    temProxima: proximoOffset < total,
    temAnterior: offset > 0,
    proximoOffset: proximoOffset < total ? proximoOffset : null,
    anteriorOffset: offset > 0 ? anteriorOffset : null
  };
}
