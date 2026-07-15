import { randomUUID } from "node:crypto";
import type { ConteudoCommerce, RepositorioConteudosCommerce } from "../../dominio/conteudoCommerce.js";

export class RepositorioConteudosCommerceMemoria implements RepositorioConteudosCommerce {
  private readonly conteudos = new Map<string, ConteudoCommerce>();
  async criar(dados: Parameters<RepositorioConteudosCommerce["criar"]>[0]) {
    if ([...this.conteudos.values()].some((item) => item.slug === dados.slug)) throw new Error("SLUG_EM_USO");
    const agora = new Date(); const id = randomUUID();
    const conteudo: ConteudoCommerce = { ...dados, id, metricas: {}, publicadoEm: null, aprovadoEm: null, criadoEm: agora, atualizadoEm: agora, produtos: dados.produtos.map((item) => ({ ...item, id: randomUUID(), conteudoId: id })) };
    this.conteudos.set(id, conteudo); return conteudo;
  }
  async buscarPorSlug(slug: string) { return [...this.conteudos.values()].find((item) => item.slug === slug) ?? null; }
  async buscarPorIdContexto(id: string, contexto: { parceiroIds?: string[]; negocioId?: string }) {
    const item = this.conteudos.get(id) ?? null;
    if (!item || (contexto.negocioId && item.negocioId !== contexto.negocioId) || (contexto.parceiroIds && !contexto.parceiroIds.includes(item.parceiroId))) return null;
    return item;
  }
  async listarPorParceiros(parceiroIds: string[]) { return [...this.conteudos.values()].filter((item) => parceiroIds.includes(item.parceiroId)).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()); }
  async moderar(id: string, negocioId: string, dados: { estado: "PUBLICADO" | "REJEITADO"; motivo?: string | null; smartLinkId?: string | null }) {
    const item = await this.buscarPorIdContexto(id, { negocioId }); if (!item) return null; const agora = new Date();
    item.estado = dados.estado; item.motivoModeracao = dados.motivo ?? null; item.smartLinkId = dados.smartLinkId ?? item.smartLinkId;
    item.aprovadoEm = dados.estado === "PUBLICADO" ? agora : null; item.publicadoEm = dados.estado === "PUBLICADO" ? agora : null; item.atualizadoEm = agora; return item;
  }
}
