import type { PrismaClient } from "@prisma/client";
import type { AmostraCreator, CandidaturaCreator, MissaoCreator, OfertaCreator, ParticipacaoMissaoCreator, RepositorioCreatorMarketplace } from "../../dominio/creatorMarketplace.js";

const inclusaoOferta = { produtos: { orderBy: { ordem: "asc" as const } }, missoes: { orderBy: { criadaEm: "asc" as const } } };

export class RepositorioCreatorMarketplacePrisma implements RepositorioCreatorMarketplace {
  constructor(private readonly prisma: PrismaClient) {}

  async criarOferta(dados: Parameters<RepositorioCreatorMarketplace["criarOferta"]>[0]) {
    const item = await this.prisma.ofertaCreator.create({ data: {
      negocioId: dados.negocioId, codigo: dados.codigo, titulo: dados.titulo, descricao: dados.descricao, estado: dados.estado,
      comissaoTipo: dados.comissaoTipo, comissaoValor: dados.comissaoValor, moeda: dados.moeda,
      criteriosJson: JSON.stringify(dados.criterios), regrasJson: JSON.stringify(dados.regras), bonusJson: JSON.stringify(dados.bonus),
      stockAmostras: dados.stockAmostras, iniciaEm: dados.iniciaEm, terminaEm: dados.terminaEm,
      produtos: { create: dados.produtos.map((produto) => ({ negocioId: produto.negocioId, pecaId: produto.pecaId, variantePecaId: produto.variantePecaId, ordem: produto.ordem })) },
      missoes: { create: dados.missoes.map((missao) => ({ titulo: missao.titulo, descricao: missao.descricao, criteriosJson: JSON.stringify(missao.criterios), bonusEmKwanza: missao.bonusEmKwanza, iniciaEm: missao.iniciaEm, terminaEm: missao.terminaEm, estado: missao.estado, negocioId: dados.negocioId })) }
    }, include: inclusaoOferta });
    return this.mapOferta(item);
  }
  async buscarOferta(id: string, negocioId?: string) { const item = await this.prisma.ofertaCreator.findFirst({ where: { id, ...(negocioId ? { negocioId } : {}) }, include: inclusaoOferta }); return item ? this.mapOferta(item) : null; }
  async listarOfertasNegocio(negocioId: string) { const itens = await this.prisma.ofertaCreator.findMany({ where: { negocioId }, include: inclusaoOferta, orderBy: { criadoEm: "desc" } }); return itens.map((item) => this.mapOferta(item)); }
  async listarOfertasPublicadas(agora: Date) { const itens = await this.prisma.ofertaCreator.findMany({ where: { estado: "PUBLICADA", AND: [{ OR: [{ iniciaEm: null }, { iniciaEm: { lte: agora } }] }, { OR: [{ terminaEm: null }, { terminaEm: { gte: agora } }] }] }, include: inclusaoOferta, orderBy: { publicadaEm: "desc" } }); return itens.map((item) => this.mapOferta(item)); }
  async publicarOferta(id: string, negocioId: string, publicar: boolean, agora: Date) { const existe = await this.prisma.ofertaCreator.findFirst({ where: { id, negocioId }, select: { id: true } }); if (!existe) return null; const item = await this.prisma.ofertaCreator.update({ where: { id }, data: { estado: publicar ? "PUBLICADA" : "ENCERRADA", publicadaEm: publicar ? agora : undefined }, include: inclusaoOferta }); return this.mapOferta(item); }
  async criarCandidatura(dados: { ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; mensagem?: string | null }) { const item = await this.prisma.candidaturaCreator.create({ data: { ...dados, mensagem: dados.mensagem ?? null } }); return this.mapCandidatura(item); }
  async buscarCandidatura(id: string, contexto: { negocioId?: string; parceiroIds?: string[] }) { const item = await this.prisma.candidaturaCreator.findFirst({ where: { id, ...(contexto.negocioId ? { negocioId: contexto.negocioId } : {}), ...(contexto.parceiroIds ? { parceiroId: { in: contexto.parceiroIds } } : {}) } }); return item ? this.mapCandidatura(item) : null; }
  async listarCandidaturas(filtros: { negocioId?: string; parceiroIds?: string[] }) { const itens = await this.prisma.candidaturaCreator.findMany({ where: { ...(filtros.negocioId ? { negocioId: filtros.negocioId } : {}), ...(filtros.parceiroIds ? { parceiroId: { in: filtros.parceiroIds } } : {}) }, orderBy: { criadoEm: "desc" } }); return itens.map((item) => this.mapCandidatura(item)); }
  async decidirCandidatura(id: string, negocioId: string, dados: { estado: "APROVADA" | "REJEITADA"; motivo?: string | null; agora: Date }) { const existe = await this.prisma.candidaturaCreator.findFirst({ where: { id, negocioId }, select: { id: true } }); if (!existe) return null; const item = await this.prisma.candidaturaCreator.update({ where: { id }, data: { estado: dados.estado, motivoDecisao: dados.motivo ?? null, decididaEm: dados.agora } }); return this.mapCandidatura(item); }
  async solicitarAmostra(candidatura: CandidaturaCreator, observacao?: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.ofertaCreator.updateMany({ where: { id: candidatura.ofertaId, negocioId: candidatura.negocioId, stockAmostras: { gt: 0 } }, data: { stockAmostras: { decrement: 1 } } });
      if (reserva.count !== 1) throw new Error("AMOSTRA_INDISPONIVEL");
      const item = await tx.amostraCreator.create({ data: { candidaturaId: candidatura.id, negocioId: candidatura.negocioId, parceiroId: candidatura.parceiroId, observacao: observacao ?? null } });
      return this.mapAmostra(item);
    });
  }
  async listarAmostras(filtros: { negocioId?: string; parceiroIds?: string[] }) { const itens = await this.prisma.amostraCreator.findMany({ where: { ...(filtros.negocioId ? { negocioId: filtros.negocioId } : {}), ...(filtros.parceiroIds ? { parceiroId: { in: filtros.parceiroIds } } : {}) }, orderBy: { criadaEm: "desc" } }); return itens.map((item) => this.mapAmostra(item)); }
  async aceitarMissao(dados: { missaoId: string; candidaturaId: string; parceiroId: string }) { const item = await this.prisma.participacaoMissaoCreator.upsert({ where: { missaoId_parceiroId: { missaoId: dados.missaoId, parceiroId: dados.parceiroId } }, create: dados, update: {} }); return this.mapParticipacao(item); }
  async listarParticipacoes(parceiroIds: string[]) { if (!parceiroIds.length) return []; const itens = await this.prisma.participacaoMissaoCreator.findMany({ where: { parceiroId: { in: parceiroIds } }, orderBy: { aceiteEm: "desc" } }); return itens.map((item) => this.mapParticipacao(item)); }

  private json(valor: string) { try { return JSON.parse(valor) as Record<string, unknown>; } catch { return {}; } }
  private mapOferta(item: { id: string; negocioId: string; codigo: string; titulo: string; descricao: string; estado: string; comissaoTipo: string; comissaoValor: number; moeda: string; criteriosJson: string; regrasJson: string; bonusJson: string; stockAmostras: number; iniciaEm: Date | null; terminaEm: Date | null; publicadaEm: Date | null; criadoEm: Date; atualizadoEm: Date; produtos: Array<{ id: string; ofertaId: string; negocioId: string; pecaId: string; variantePecaId: string | null; ordem: number }>; missoes: Array<{ id: string; ofertaId: string; negocioId: string; titulo: string; descricao: string; criteriosJson: string; bonusEmKwanza: number; iniciaEm: Date | null; terminaEm: Date | null; estado: string; criadaEm: Date; atualizadaEm: Date }> }): OfertaCreator { return { ...item, estado: item.estado as OfertaCreator["estado"], comissaoTipo: item.comissaoTipo as OfertaCreator["comissaoTipo"], criterios: this.json(item.criteriosJson), regras: this.json(item.regrasJson), bonus: this.json(item.bonusJson), missoes: item.missoes.map((missao) => ({ ...missao, criterios: this.json(missao.criteriosJson) })) }; }
  private mapCandidatura(item: { id: string; ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; estado: string; mensagem: string | null; motivoDecisao: string | null; decididaEm: Date | null; criadoEm: Date; atualizadoEm: Date }): CandidaturaCreator { return { ...item, estado: item.estado as CandidaturaCreator["estado"] }; }
  private mapAmostra(item: { id: string; candidaturaId: string; negocioId: string; parceiroId: string; estado: string; observacao: string | null; trackingEnvio: string | null; criadaEm: Date; atualizadaEm: Date }): AmostraCreator { return { ...item, estado: item.estado as AmostraCreator["estado"] }; }
  private mapParticipacao(item: { id: string; missaoId: string; candidaturaId: string; parceiroId: string; estado: string; progressoJson: string; aceiteEm: Date; concluidaEm: Date | null }): ParticipacaoMissaoCreator { return { ...item, progresso: this.json(item.progressoJson) }; }
}
