import { randomUUID } from "node:crypto";
import type { DistribuicaoComissao, MovimentoLedgerComissao, PayoutComissao, RepositorioLedgerComissoes } from "../../dominio/ledgerComissoes.js";

export class RepositorioLedgerComissoesMemoria implements RepositorioLedgerComissoes {
  private distribuicoes = new Map<string, DistribuicaoComissao>();
  private movimentos = new Map<string, MovimentoLedgerComissao>();
  private payouts = new Map<string, PayoutComissao>();

  async criarDistribuicao(dados: Parameters<RepositorioLedgerComissoes["criarDistribuicao"]>[0]) {
    const existente = await this.buscarDistribuicao(dados.negocioId, dados.origemTipo, dados.origemId);
    if (existente) return existente;
    const id = randomUUID(); const criadaEm = new Date();
    const item: DistribuicaoComissao = { ...dados, id, criadaEm, participantes: dados.participantes.map((parte) => ({ ...parte, id: randomUUID(), distribuicaoId: id, negocioId: dados.negocioId, moeda: dados.moeda, criadoEm: criadaEm })) };
    this.distribuicoes.set(id, item); return structuredClone(item);
  }
  async buscarDistribuicao(negocioId: string, origemTipo: string, origemId: string) { return structuredClone([...this.distribuicoes.values()].find((item) => item.negocioId === negocioId && item.origemTipo === origemTipo && item.origemId === origemId) ?? null); }
  async listarDistribuicoes(negocioId: string, parceiroId?: string) { return structuredClone([...this.distribuicoes.values()].filter((item) => item.negocioId === negocioId && (!parceiroId || item.participantes.some((parte) => parte.parceiroId === parceiroId))).sort((a, b) => b.criadaEm.getTime() - a.criadaEm.getTime())); }
  async registrarMovimento(dados: Parameters<RepositorioLedgerComissoes["registrarMovimento"]>[0]) { const existente = [...this.movimentos.values()].find((item) => item.idempotencyKey === dados.idempotencyKey); if (existente) return structuredClone(existente); const item = { ...dados, id: randomUUID(), criadoEm: new Date() }; this.movimentos.set(item.id, item); return structuredClone(item); }
  async listarMovimentos(negocioId: string, parceiroId?: string) { return structuredClone([...this.movimentos.values()].filter((item) => item.negocioId === negocioId && (!parceiroId || item.parceiroId === parceiroId)).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())); }
  async criarPayout(dados: Parameters<RepositorioLedgerComissoes["criarPayout"]>[0]) { const existente = [...this.payouts.values()].find((item) => item.idempotencyKey === dados.idempotencyKey); if (existente) return structuredClone(existente); const agora = new Date(); const item: PayoutComissao = { ...dados, id: randomUUID(), estado: "EM_PROCESSAMENTO", referenciaProvider: null, motivoFalha: null, criadoEm: agora, processadoEm: null, atualizadoEm: agora }; this.payouts.set(item.id, item); return structuredClone(item); }
  async buscarPayout(id: string, negocioId: string) { const item = this.payouts.get(id); return structuredClone(item?.negocioId === negocioId ? item : null); }
  async listarPayouts(negocioId: string, parceiroId?: string) { return structuredClone([...this.payouts.values()].filter((item) => item.negocioId === negocioId && (!parceiroId || item.parceiroId === parceiroId)).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())); }
  async concluirPayout(id: string, negocioId: string, referencia: string) { const item = this.payouts.get(id); if (!item || item.negocioId !== negocioId) return null; Object.assign(item, { estado: "PAGO", referenciaProvider: referencia, processadoEm: new Date(), atualizadoEm: new Date() }); return structuredClone(item); }
  async falharPayout(id: string, negocioId: string, motivo: string) { const item = this.payouts.get(id); if (!item || item.negocioId !== negocioId) return null; Object.assign(item, { estado: "FALHOU", motivoFalha: motivo, processadoEm: new Date(), atualizadoEm: new Date() }); return structuredClone(item); }
}
