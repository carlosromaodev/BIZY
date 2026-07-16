import type { PrismaClient } from "@prisma/client";
import type { AmostraCreator, CandidaturaCreator, MissaoCreator, OfertaCreator, ParticipacaoMissaoCreator, PerfilCreator, ProgramaAfiliacao, RelacaoAfiliacao, RepositorioCreatorMarketplace, SolicitacaoAfiliacao } from "../../dominio/creatorMarketplace.js";

const inclusaoOferta = { produtos: { orderBy: { ordem: "asc" as const } }, missoes: { orderBy: { criadaEm: "asc" as const } } };

export class RepositorioCreatorMarketplacePrisma implements RepositorioCreatorMarketplace {
  constructor(private readonly prisma: PrismaClient) {}

  async obterPerfilPorConta(contaBizyId: string) {
    const item = await this.prisma.perfilCreator.findUnique({ where: { contaBizyId } });
    return item ? this.mapPerfil(item) : null;
  }

  async obterPerfilPorId(id: string) { const item = await this.prisma.perfilCreator.findUnique({ where: { id } }); return item ? this.mapPerfil(item) : null; }

  async salvarPerfil(contaBizyId: string, dados: Parameters<RepositorioCreatorMarketplace["salvarPerfil"]>[1]) {
    const item = await this.prisma.perfilCreator.upsert({
      where: { contaBizyId },
      create: { contaBizyId, nomePublico: dados.nomePublico, bio: dados.bio ?? null, avatarUrl: dados.avatarUrl ?? null, localizacao: dados.localizacao ?? null, categoriasJson: JSON.stringify(dados.categorias), canaisJson: JSON.stringify(dados.canais), redesSociaisJson: JSON.stringify(dados.redesSociais ?? {}), estado: dados.estado, termosVersao: dados.termosVersao, termosAceitesEm: dados.termosAceitesEm },
      update: { nomePublico: dados.nomePublico, bio: dados.bio ?? null, avatarUrl: dados.avatarUrl ?? null, localizacao: dados.localizacao ?? null, categoriasJson: JSON.stringify(dados.categorias), canaisJson: JSON.stringify(dados.canais), redesSociaisJson: JSON.stringify(dados.redesSociais ?? {}), estado: dados.estado, termosVersao: dados.termosVersao, termosAceitesEm: dados.termosAceitesEm }
    });
    return this.mapPerfil(item);
  }

  async garantirPrograma(dados: Parameters<RepositorioCreatorMarketplace["garantirPrograma"]>[0]) {
    const item = await this.prisma.programaAfiliacao.upsert({
      where: { negocioId_nome: { negocioId: dados.negocioId, nome: dados.nome } },
      create: { negocioId: dados.negocioId, nome: dados.nome, modalidadeAcesso: dados.modalidadeAcesso, termosVersao: dados.termosVersao, criteriosJson: JSON.stringify(dados.criterios), politicaComissaoJson: JSON.stringify(dados.politicaComissao), politicaConteudoJson: JSON.stringify(dados.politicaConteudo) },
      update: { modalidadeAcesso: dados.modalidadeAcesso, termosVersao: dados.termosVersao, criteriosJson: JSON.stringify(dados.criterios), politicaComissaoJson: JSON.stringify(dados.politicaComissao), politicaConteudoJson: JSON.stringify(dados.politicaConteudo), estado: "ATIVO" }
    });
    return this.mapPrograma(item);
  }

  async criarSolicitacao(dados: Parameters<RepositorioCreatorMarketplace["criarSolicitacao"]>[0]) {
    const existente = await this.prisma.solicitacaoAfiliacao.findFirst({ where: { perfilCreatorId: dados.perfilCreatorId, programaId: dados.programaId, ofertaId: dados.ofertaId ?? null, produtoOfertaId: dados.produtoOfertaId ?? null, estado: { in: ["PENDENTE", "EM_REVISAO", "APROVADA"] } } });
    if (existente) throw new Error("CANDIDATURA_EXISTENTE");
    const item = await this.prisma.solicitacaoAfiliacao.create({ data: { perfilCreatorId: dados.perfilCreatorId, programaId: dados.programaId, ofertaId: dados.ofertaId ?? null, produtoOfertaId: dados.produtoOfertaId ?? null, estado: dados.estado, mensagem: dados.mensagem ?? null, submetidaEm: dados.agora, ...(dados.estado === "APROVADA" ? { decididaEm: dados.agora } : {}) } });
    return this.mapSolicitacao(item);
  }

  async buscarSolicitacao(id: string, contexto: { perfilCreatorId?: string; negocioId?: string }) {
    const item = await this.prisma.solicitacaoAfiliacao.findFirst({ where: { id, ...(contexto.perfilCreatorId ? { perfilCreatorId: contexto.perfilCreatorId } : {}), ...(contexto.negocioId ? { programa: { negocioId: contexto.negocioId } } : {}) } });
    return item ? this.mapSolicitacao(item) : null;
  }

  async listarSolicitacoes(filtros: { perfilCreatorId?: string; negocioId?: string }) {
    const itens = await this.prisma.solicitacaoAfiliacao.findMany({ where: { ...(filtros.perfilCreatorId ? { perfilCreatorId: filtros.perfilCreatorId } : {}), ...(filtros.negocioId ? { programa: { negocioId: filtros.negocioId } } : {}) }, orderBy: { criadoEm: "desc" } });
    return itens.map((item) => this.mapSolicitacao(item));
  }

  async decidirSolicitacao(id: string, negocioId: string, dados: Parameters<RepositorioCreatorMarketplace["decidirSolicitacao"]>[2]) {
    const existe = await this.prisma.solicitacaoAfiliacao.findFirst({ where: { id, programa: { negocioId } }, select: { id: true } });
    if (!existe) return null;
    const item = await this.prisma.solicitacaoAfiliacao.update({ where: { id }, data: { estado: dados.estado, motivoDecisao: dados.motivo ?? null, decididaPorId: dados.decididaPorId ?? null, decididaEm: dados.agora } });
    return this.mapSolicitacao(item);
  }

  async ativarRelacao(dados: Parameters<RepositorioCreatorMarketplace["ativarRelacao"]>[0]) {
    return this.prisma.$transaction(async (tx) => {
      const relacao = await tx.relacaoAfiliacao.upsert({
        where: { perfilCreatorId_negocioId_programaId: { perfilCreatorId: dados.perfilCreatorId, negocioId: dados.negocioId, programaId: dados.programaId } },
        create: { perfilCreatorId: dados.perfilCreatorId, negocioId: dados.negocioId, programaId: dados.programaId, parceiroComercialId: dados.parceiroComercialId, estado: "ACTIVA", comissaoJson: JSON.stringify(dados.comissao), termosVersao: dados.termosVersao, iniciadaEm: dados.agora },
        update: { parceiroComercialId: dados.parceiroComercialId, estado: "ACTIVA", comissaoJson: JSON.stringify(dados.comissao), termosVersao: dados.termosVersao, pausadaEm: null, encerradaEm: null }
      });
      for (const produtoOfertaCreatorId of dados.produtoOfertaIds) {
        await tx.autorizacaoProdutoAfiliado.upsert({
          where: { relacaoAfiliacaoId_produtoOfertaCreatorId: { relacaoAfiliacaoId: relacao.id, produtoOfertaCreatorId } },
          create: { relacaoAfiliacaoId: relacao.id, produtoOfertaCreatorId, estado: "AUTORIZADA", comissaoSnapshotJson: JSON.stringify(dados.comissao), iniciaEm: dados.agora },
          update: { estado: "AUTORIZADA", comissaoSnapshotJson: JSON.stringify(dados.comissao), iniciaEm: dados.agora, terminaEm: null }
        });
      }
      return this.mapRelacao(relacao);
    });
  }

  async listarRelacoes(perfilCreatorId: string) {
    const itens = await this.prisma.relacaoAfiliacao.findMany({ where: { perfilCreatorId }, orderBy: { iniciadaEm: "desc" } });
    return itens.map((item) => this.mapRelacao(item));
  }

  async produtoAutorizado(parceiroComercialId: string, pecaId: string) {
    return Boolean(await this.prisma.autorizacaoProdutoAfiliado.findFirst({ where: { estado: "AUTORIZADA", relacaoAfiliacao: { parceiroComercialId, estado: "ACTIVA" }, produtoOfertaCreator: { pecaId } }, select: { id: true } }));
  }

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
  async criarCandidatura(dados: Parameters<RepositorioCreatorMarketplace["criarCandidatura"]>[0]) { const existente = await this.prisma.candidaturaCreator.findUnique({ where: { ofertaId_parceiroId: { ofertaId: dados.ofertaId, parceiroId: dados.parceiroId } } }); if (existente) return this.mapCandidatura(existente); const item = await this.prisma.candidaturaCreator.create({ data: { id: dados.id, ofertaId: dados.ofertaId, negocioId: dados.negocioId, parceiroId: dados.parceiroId, parceiroNegocioOrigemId: dados.parceiroNegocioOrigemId, mensagem: dados.mensagem ?? null, estado: dados.estado ?? "PENDENTE", ...(dados.estado === "APROVADA" ? { decididaEm: new Date() } : {}) } }); return this.mapCandidatura(item); }
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
  private lista(valor: string) { try { const parsed = JSON.parse(valor); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; } }
  private mapPerfil(item: { id: string; contaBizyId: string; nomePublico: string; bio: string | null; avatarUrl: string | null; localizacao: string | null; categoriasJson: string; canaisJson: string; redesSociaisJson: string; estado: string; nivelVerificacao: string; termosVersao: string | null; termosAceitesEm: Date | null; criadoEm: Date; atualizadoEm: Date }): PerfilCreator { return { ...item, categorias: this.lista(item.categoriasJson), canais: this.lista(item.canaisJson), redesSociais: this.json(item.redesSociaisJson) as Record<string, string> }; }
  private mapPrograma(item: { id: string; negocioId: string; nome: string; modalidadeAcesso: string; estado: string; termosVersao: string; criteriosJson: string; politicaComissaoJson: string; politicaConteudoJson: string }): ProgramaAfiliacao { return { ...item, criterios: this.json(item.criteriosJson), politicaComissao: this.json(item.politicaComissaoJson), politicaConteudo: this.json(item.politicaConteudoJson) }; }
  private mapSolicitacao(item: { id: string; perfilCreatorId: string; programaId: string; ofertaId: string | null; produtoOfertaId: string | null; estado: string; mensagem: string | null; motivoDecisao: string | null; submetidaEm: Date; decididaEm: Date | null; criadoEm: Date; atualizadoEm: Date }): SolicitacaoAfiliacao { return item; }
  private mapRelacao(item: { id: string; perfilCreatorId: string; negocioId: string; programaId: string; parceiroComercialId: string | null; estado: string; comissaoJson: string; termosVersao: string; iniciadaEm: Date }): RelacaoAfiliacao { return { ...item, comissao: this.json(item.comissaoJson) }; }
  private mapOferta(item: { id: string; negocioId: string; codigo: string; titulo: string; descricao: string; estado: string; comissaoTipo: string; comissaoValor: number; moeda: string; criteriosJson: string; regrasJson: string; bonusJson: string; stockAmostras: number; iniciaEm: Date | null; terminaEm: Date | null; publicadaEm: Date | null; criadoEm: Date; atualizadoEm: Date; produtos: Array<{ id: string; ofertaId: string; negocioId: string; pecaId: string; variantePecaId: string | null; ordem: number }>; missoes: Array<{ id: string; ofertaId: string; negocioId: string; titulo: string; descricao: string; criteriosJson: string; bonusEmKwanza: number; iniciaEm: Date | null; terminaEm: Date | null; estado: string; criadaEm: Date; atualizadaEm: Date }> }): OfertaCreator { return { ...item, estado: item.estado as OfertaCreator["estado"], comissaoTipo: item.comissaoTipo as OfertaCreator["comissaoTipo"], criterios: this.json(item.criteriosJson), regras: this.json(item.regrasJson), bonus: this.json(item.bonusJson), missoes: item.missoes.map((missao) => ({ ...missao, criterios: this.json(missao.criteriosJson) })) }; }
  private mapCandidatura(item: { id: string; ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; estado: string; mensagem: string | null; motivoDecisao: string | null; decididaEm: Date | null; criadoEm: Date; atualizadoEm: Date }): CandidaturaCreator { return { ...item, estado: item.estado as CandidaturaCreator["estado"] }; }
  private mapAmostra(item: { id: string; candidaturaId: string; negocioId: string; parceiroId: string; estado: string; observacao: string | null; trackingEnvio: string | null; criadaEm: Date; atualizadaEm: Date }): AmostraCreator { return { ...item, estado: item.estado as AmostraCreator["estado"] }; }
  private mapParticipacao(item: { id: string; missaoId: string; candidaturaId: string; parceiroId: string; estado: string; progressoJson: string; aceiteEm: Date; concluidaEm: Date | null }): ParticipacaoMissaoCreator { return { ...item, progresso: this.json(item.progressoJson) }; }
}
