import type { PrismaClient } from "@prisma/client";
import type { ConteudoCommerce, RepositorioConteudosCommerce } from "../../dominio/conteudoCommerce.js";

export class RepositorioConteudosCommercePrisma implements RepositorioConteudosCommerce {
  constructor(private readonly prisma: PrismaClient) {}
  async criar(dados: Parameters<RepositorioConteudosCommerce["criar"]>[0]) {
    const item = await this.prisma.conteudoCommerce.create({ data: {
      negocioId: dados.negocioId, parceiroId: dados.parceiroId, smartLinkId: dados.smartLinkId, slug: dados.slug, tipo: dados.tipo,
      titulo: dados.titulo, legenda: dados.legenda, thumbnailUrl: dados.thumbnailUrl, mediaUrl: dados.mediaUrl,
      divulgacaoComercial: dados.divulgacaoComercial, estado: dados.estado, motivoModeracao: dados.motivoModeracao,
      produtos: { create: dados.produtos.map((produto) => ({ negocioId: produto.negocioId, pecaId: produto.pecaId, variantePecaId: produto.variantePecaId, ordem: produto.ordem })) }
    }, include: { produtos: { orderBy: { ordem: "asc" } } } });
    return this.mapear(item);
  }
  async buscarPorSlug(slug: string) { const item = await this.prisma.conteudoCommerce.findUnique({ where: { slug }, include: { produtos: { orderBy: { ordem: "asc" } } } }); return item ? this.mapear(item) : null; }
  async buscarPorIdContexto(id: string, contexto: { parceiroIds?: string[]; negocioId?: string }) {
    const item = await this.prisma.conteudoCommerce.findFirst({ where: { id, ...(contexto.negocioId ? { negocioId: contexto.negocioId } : {}), ...(contexto.parceiroIds ? { parceiroId: { in: contexto.parceiroIds } } : {}) }, include: { produtos: { orderBy: { ordem: "asc" } } } }); return item ? this.mapear(item) : null;
  }
  async listarPorParceiros(parceiroIds: string[]) { if (!parceiroIds.length) return []; const itens = await this.prisma.conteudoCommerce.findMany({ where: { parceiroId: { in: parceiroIds } }, include: { produtos: { orderBy: { ordem: "asc" } } }, orderBy: { criadoEm: "desc" } }); return itens.map((item) => this.mapear(item)); }
  async moderar(id: string, negocioId: string, dados: { estado: "PUBLICADO" | "REJEITADO"; motivo?: string | null; smartLinkId?: string | null }) {
    const existe = await this.prisma.conteudoCommerce.findFirst({ where: { id, negocioId }, select: { id: true } }); if (!existe) return null; const agora = new Date();
    const item = await this.prisma.conteudoCommerce.update({ where: { id }, data: { estado: dados.estado, motivoModeracao: dados.motivo ?? null, smartLinkId: dados.smartLinkId ?? undefined, aprovadoEm: dados.estado === "PUBLICADO" ? agora : null, publicadoEm: dados.estado === "PUBLICADO" ? agora : null }, include: { produtos: { orderBy: { ordem: "asc" } } } }); return this.mapear(item);
  }
  private mapear(item: { id: string; negocioId: string; parceiroId: string; smartLinkId: string | null; slug: string; tipo: string; titulo: string; legenda: string | null; thumbnailUrl: string | null; mediaUrl: string | null; divulgacaoComercial: boolean; estado: string; motivoModeracao: string | null; metricasJson: string; publicadoEm: Date | null; aprovadoEm: Date | null; criadoEm: Date; atualizadoEm: Date; produtos: Array<{ id: string; conteudoId: string; negocioId: string; pecaId: string; variantePecaId: string | null; ordem: number }> }): ConteudoCommerce {
    let metricas: Record<string, number> = {}; try { metricas = JSON.parse(item.metricasJson) as Record<string, number>; } catch { metricas = {}; }
    return { ...item, tipo: item.tipo as ConteudoCommerce["tipo"], estado: item.estado as ConteudoCommerce["estado"], metricas };
  }
}
