import { randomUUID } from "node:crypto";
import type { AmostraCreator, CandidaturaCreator, MissaoCreator, OfertaCreator, ParticipacaoMissaoCreator, RepositorioCreatorMarketplace } from "../../dominio/creatorMarketplace.js";

export class RepositorioCreatorMarketplaceMemoria implements RepositorioCreatorMarketplace {
  private readonly ofertas = new Map<string, OfertaCreator>();
  private readonly candidaturas = new Map<string, CandidaturaCreator>();
  private readonly amostras = new Map<string, AmostraCreator>();
  private readonly participacoes = new Map<string, ParticipacaoMissaoCreator>();

  async criarOferta(dados: Parameters<RepositorioCreatorMarketplace["criarOferta"]>[0]) {
    if ([...this.ofertas.values()].some((item) => item.negocioId === dados.negocioId && item.codigo === dados.codigo)) throw new Error("CODIGO_EM_USO");
    const agora = new Date(); const id = randomUUID();
    const missoes: MissaoCreator[] = dados.missoes.map((item) => ({ ...item, id: randomUUID(), ofertaId: id, negocioId: dados.negocioId, criadaEm: agora, atualizadaEm: agora }));
    const oferta: OfertaCreator = { ...dados, id, publicadaEm: null, criadoEm: agora, atualizadoEm: agora, produtos: dados.produtos.map((item) => ({ ...item, id: randomUUID(), ofertaId: id })), missoes };
    this.ofertas.set(id, oferta); return oferta;
  }
  async buscarOferta(id: string, negocioId?: string) { const item = this.ofertas.get(id) ?? null; return item && (!negocioId || item.negocioId === negocioId) ? item : null; }
  async listarOfertasNegocio(negocioId: string) { return [...this.ofertas.values()].filter((item) => item.negocioId === negocioId).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()); }
  async listarOfertasPublicadas(agora: Date) { return [...this.ofertas.values()].filter((item) => item.estado === "PUBLICADA" && (!item.iniciaEm || item.iniciaEm <= agora) && (!item.terminaEm || item.terminaEm >= agora)); }
  async publicarOferta(id: string, negocioId: string, publicar: boolean, agora: Date) { const item = await this.buscarOferta(id, negocioId); if (!item) return null; item.estado = publicar ? "PUBLICADA" : "ENCERRADA"; item.publicadaEm = publicar ? agora : item.publicadaEm; item.atualizadoEm = agora; return item; }
  async criarCandidatura(dados: { ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; mensagem?: string | null }) { if ([...this.candidaturas.values()].some((item) => item.ofertaId === dados.ofertaId && item.parceiroId === dados.parceiroId)) throw new Error("CANDIDATURA_EXISTENTE"); const agora = new Date(); const item: CandidaturaCreator = { ...dados, id: randomUUID(), estado: "PENDENTE", mensagem: dados.mensagem ?? null, motivoDecisao: null, decididaEm: null, criadoEm: agora, atualizadoEm: agora }; this.candidaturas.set(item.id, item); return item; }
  async buscarCandidatura(id: string, contexto: { negocioId?: string; parceiroIds?: string[] }) { const item = this.candidaturas.get(id) ?? null; if (!item || (contexto.negocioId && item.negocioId !== contexto.negocioId) || (contexto.parceiroIds && !contexto.parceiroIds.includes(item.parceiroId))) return null; return item; }
  async listarCandidaturas(filtros: { negocioId?: string; parceiroIds?: string[] }) { return [...this.candidaturas.values()].filter((item) => !filtros.negocioId || item.negocioId === filtros.negocioId).filter((item) => !filtros.parceiroIds || filtros.parceiroIds.includes(item.parceiroId)); }
  async decidirCandidatura(id: string, negocioId: string, dados: { estado: "APROVADA" | "REJEITADA"; motivo?: string | null; agora: Date }) { const item = await this.buscarCandidatura(id, { negocioId }); if (!item) return null; item.estado = dados.estado; item.motivoDecisao = dados.motivo ?? null; item.decididaEm = dados.agora; item.atualizadoEm = dados.agora; return item; }
  async solicitarAmostra(candidatura: CandidaturaCreator, observacao?: string | null) { if ([...this.amostras.values()].some((item) => item.candidaturaId === candidatura.id)) throw new Error("AMOSTRA_EXISTENTE"); const agora = new Date(); const item: AmostraCreator = { id: randomUUID(), candidaturaId: candidatura.id, negocioId: candidatura.negocioId, parceiroId: candidatura.parceiroId, estado: "SOLICITADA", observacao: observacao ?? null, trackingEnvio: null, criadaEm: agora, atualizadaEm: agora }; this.amostras.set(item.id, item); const oferta = this.ofertas.get(candidatura.ofertaId); if (oferta) oferta.stockAmostras -= 1; return item; }
  async listarAmostras(filtros: { negocioId?: string; parceiroIds?: string[] }) { return [...this.amostras.values()].filter((item) => !filtros.negocioId || item.negocioId === filtros.negocioId).filter((item) => !filtros.parceiroIds || filtros.parceiroIds.includes(item.parceiroId)); }
  async aceitarMissao(dados: { missaoId: string; candidaturaId: string; parceiroId: string }) { const existente = [...this.participacoes.values()].find((item) => item.missaoId === dados.missaoId && item.parceiroId === dados.parceiroId); if (existente) return existente; const item: ParticipacaoMissaoCreator = { ...dados, id: randomUUID(), estado: "ACEITE", progresso: {}, aceiteEm: new Date(), concluidaEm: null }; this.participacoes.set(item.id, item); return item; }
  async listarParticipacoes(parceiroIds: string[]) { return [...this.participacoes.values()].filter((item) => parceiroIds.includes(item.parceiroId)); }
}
