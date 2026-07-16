import type { PrismaClient } from "@prisma/client";

export interface SinaisRiscoCommerce {
  autoIndicacao?: boolean; contasRelacionadas?: boolean; cliquesArtificiais?: number; multiplasContas?: number;
  comprovativoRepetido?: boolean; abusoCupons?: number; devolucoesAnormais?: number; manipulacaoAtribuicao?: boolean; payoutDuplicado?: boolean;
}

export class ConfiancaCommerceUseCase {
  constructor(private prisma: PrismaClient) {}

  async criarAvaliacao(contaBizyId: string, dados: { pedidoId: string; pecaId?: string | null; notaProduto: number; notaEntrega: number; notaSeller: number; titulo?: string | null; comentario?: string | null }) {
    const filho = await this.prisma.pedidoFilho.findFirst({ where: { pedidoId: dados.pedidoId, compraUnificada: { contaBizyId } } });
    if (!filho) return null;
    const pedido = await this.prisma.pedido.findFirst({ where: { id: dados.pedidoId, negocioId: filho.negocioId }, include: { itens: true } });
    if (!pedido || (!pedido.entregueEm && pedido.estadoEntrega !== "ENTREGUE" && filho.estadoEntrega !== "ENTREGUE")) throw new Error("PEDIDO_NAO_ENTREGUE");
    if (dados.pecaId && !pedido.itens.some((item) => item.pecaId === dados.pecaId)) throw new Error("PRODUTO_NAO_PERTENCE_AO_PEDIDO");
    const avaliacao = await this.prisma.avaliacaoVerificadaCommerce.create({ data: { negocioId: filho.negocioId, contaBizyId, compraId: filho.compraUnificadaId, pedidoId: pedido.id, pecaId: dados.pecaId ?? null, notaProduto: dados.notaProduto, notaEntrega: dados.notaEntrega, notaSeller: dados.notaSeller, titulo: dados.titulo ?? null, comentario: dados.comentario ?? null } });
    await this.recalcularScore("SELLER", filho.negocioId, filho.negocioId);
    return avaliacao;
  }

  listarAvaliacoesPublicas(filtros: { negocioId?: string; pecaId?: string }) {
    return this.prisma.avaliacaoVerificadaCommerce.findMany({ where: { estado: "PUBLICADA", compraVerificada: true, ...(filtros.negocioId ? { negocioId: filtros.negocioId } : {}), ...(filtros.pecaId ? { pecaId: filtros.pecaId } : {}) }, orderBy: { criadoEm: "desc" }, take: 100, select: { id: true, notaProduto: true, notaEntrega: true, notaSeller: true, titulo: true, comentario: true, compraVerificada: true, criadoEm: true } });
  }

  async obterResumoPublicoProduto(pecaId: string) {
    const peca = await this.prisma.peca.findUnique({ where: { id: pecaId }, select: { negocioId: true } });
    if (!peca?.negocioId) return null;
    const [avaliacoesProduto, avaliacoesSeller] = await Promise.all([
      this.listarAvaliacoesPublicas({ pecaId }),
      this.prisma.avaliacaoVerificadaCommerce.findMany({
        where: { negocioId: peca.negocioId, estado: "PUBLICADA", compraVerificada: true },
        select: { notaSeller: true }
      })
    ]);
    const media = (valores: number[]) => valores.length
      ? Math.round((valores.reduce((total, valor) => total + valor, 0) / valores.length) * 10) / 10
      : null;
    return {
      produto: { media: media(avaliacoesProduto.map((item) => item.notaProduto)), total: avaliacoesProduto.length },
      seller: { media: media(avaliacoesSeller.map((item) => item.notaSeller)), total: avaliacoesSeller.length },
      avaliacoes: avaliacoesProduto
    };
  }

  async abrirProtecao(contaBizyId: string, dados: { compraId: string; pedidoId?: string | null; tipo: string; descricao: string; evidencias?: string[] }) {
    const compra = await this.prisma.compraUnificada.findFirst({ where: { id: dados.compraId, contaBizyId }, include: { pedidosFilho: true } });
    if (!compra || (dados.pedidoId && !compra.pedidosFilho.some((item) => item.pedidoId === dados.pedidoId))) return null;
    const filho = dados.pedidoId ? compra.pedidosFilho.find((item) => item.pedidoId === dados.pedidoId) : compra.pedidosFilho[0];
    return this.prisma.casoProtecaoComprador.create({ data: { contaBizyId, compraId: compra.id, pedidoId: dados.pedidoId ?? null, negocioId: filho?.negocioId ?? null, tipo: dados.tipo, descricao: dados.descricao, evidenciasJson: JSON.stringify(dados.evidencias ?? []) } });
  }

  listarProtecao(contaBizyId: string) { return this.prisma.casoProtecaoComprador.findMany({ where: { contaBizyId }, orderBy: { criadoEm: "desc" } }); }

  async analisarRisco(dados: { negocioId?: string | null; contaBizyId?: string | null; parceiroId?: string | null; pedidoId?: string | null; payoutId?: string | null; sinais: SinaisRiscoCommerce; evidencias?: string[] }) {
    const ponderacoes: Array<[keyof SinaisRiscoCommerce, number, string]> = [["autoIndicacao", 35, "AUTOINDICACAO"], ["contasRelacionadas", 30, "CONTAS_RELACIONADAS"], ["comprovativoRepetido", 45, "COMPROVATIVO_REPETIDO"], ["manipulacaoAtribuicao", 40, "MANIPULACAO_ATRIBUICAO"], ["payoutDuplicado", 60, "PAYOUT_DUPLICADO"]];
    let score = 0; const sinaisAtivos: string[] = [];
    for (const [chave, peso, rotulo] of ponderacoes) if (dados.sinais[chave]) { score += peso; sinaisAtivos.push(rotulo); }
    for (const [chave, peso, rotulo] of [["cliquesArtificiais", 3, "CLIQUES_ARTIFICIAIS"], ["multiplasContas", 12, "MULTIPLAS_CONTAS"], ["abusoCupons", 8, "ABUSO_CUPOES"], ["devolucoesAnormais", 10, "DEVOLUCOES_ANORMAIS"]] as const) { const valor = Number(dados.sinais[chave] ?? 0); if (valor > 0) { score += Math.min(30, valor * peso); sinaisAtivos.push(rotulo); } }
    score = Math.min(100, score);
    if (score < 30) return { score, revisaoHumana: false, caso: null };
    const caso = await this.prisma.casoRiscoCommerce.create({ data: { negocioId: dados.negocioId ?? null, contaBizyId: dados.contaBizyId ?? null, parceiroId: dados.parceiroId ?? null, pedidoId: dados.pedidoId ?? null, payoutId: dados.payoutId ?? null, tipo: sinaisAtivos[0] ?? "RISCO_COMMERCE", severidade: score >= 70 ? "CRITICA" : score >= 50 ? "ALTA" : "MEDIA", scoreRisco: score, sinaisJson: JSON.stringify(sinaisAtivos), evidenciasJson: JSON.stringify(dados.evidencias ?? []) } });
    return { score, revisaoHumana: true, caso };
  }

  listarCasos(negocioId: string) { return this.prisma.casoRiscoCommerce.findMany({ where: { negocioId }, orderBy: { criadoEm: "desc" }, take: 200 }); }
  async decidirCaso(id: string, negocioId: string, dados: { decisao: string; responsavelId: string }) { const alterado = await this.prisma.casoRiscoCommerce.updateMany({ where: { id, negocioId, estado: "REVISAO_HUMANA" }, data: { estado: "RESOLVIDO", decisao: dados.decisao, responsavelId: dados.responsavelId } }); return alterado.count ? this.prisma.casoRiscoCommerce.findFirst({ where: { id, negocioId } }) : null; }

  private async recalcularScore(sujeitoTipo: string, sujeitoId: string, negocioId?: string) {
    const avaliacoes = await this.prisma.avaliacaoVerificadaCommerce.findMany({ where: { negocioId: sujeitoId, estado: "PUBLICADA" } });
    const media = avaliacoes.length ? avaliacoes.reduce((total, item) => total + item.notaSeller, 0) / avaliacoes.length : 0;
    const score = Math.round(media * 20);
    return this.prisma.scoreConfiancaCommerce.upsert({ where: { sujeitoTipo_sujeitoId_versao: { sujeitoTipo, sujeitoId, versao: "trust.v1" } }, create: { negocioId, sujeitoTipo, sujeitoId, score, versao: "trust.v1", componentesJson: JSON.stringify({ avaliacoes: avaliacoes.length, media }) }, update: { score, componentesJson: JSON.stringify({ avaliacoes: avaliacoes.length, media }), calculadoEm: new Date() } });
  }
}
