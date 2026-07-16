import type { RepositorioAfiliados, RepositorioAutenticacao, RepositorioPecas } from "../../../dominio/repositorios/contratos.js";
import type { ContaBizy } from "../../commerce/dominio/tipos.js";
import type { RepositorioContaBizy } from "../../commerce/dominio/contratos.js";
import type { RepositorioCreatorMarketplace } from "../dominio/creatorMarketplace.js";

interface DependenciasCreatorMarketplace {
  marketplace: RepositorioCreatorMarketplace;
  contas: RepositorioContaBizy;
  afiliados: RepositorioAfiliados;
  autenticacao: RepositorioAutenticacao;
  pecas: RepositorioPecas;
}

export class CreatorMarketplaceUseCase {
  constructor(private readonly deps: DependenciasCreatorMarketplace) {}

  async criarOferta(negocioId: string, dados: {
    codigo: string; titulo: string; descricao: string; comissaoTipo: "PERCENTUAL" | "FIXA"; comissaoValor: number;
    criterios?: Record<string, unknown>; regras?: Record<string, unknown>; bonus?: Record<string, unknown>;
    stockAmostras?: number; iniciaEm?: Date | null; terminaEm?: Date | null;
    produtos: Array<{ codigoProduto: string; variantePecaId?: string | null }>;
    missoes?: Array<{ titulo: string; descricao: string; criterios?: Record<string, unknown>; bonusEmKwanza?: number; iniciaEm?: Date | null; terminaEm?: Date | null }>;
  }) {
    if (dados.comissaoValor <= 0 || (dados.comissaoTipo === "PERCENTUAL" && dados.comissaoValor > 10_000)) throw new Error("COMISSAO_INVALIDA");
    if (dados.iniciaEm && dados.terminaEm && dados.terminaEm <= dados.iniciaEm) throw new Error("PERIODO_INVALIDO");
    const produtos = [];
    for (const [ordem, referencia] of dados.produtos.entries()) {
      const peca = await this.deps.pecas.buscarPorCodigo(referencia.codigoProduto, negocioId);
      if (!peca || peca.arquivadaEm || peca.estado === "ESGOTADA") throw new Error("PRODUTO_NAO_DISPONIVEL");
      if (referencia.variantePecaId) {
        const variantes = await this.deps.pecas.listarVariantesPeca(peca.id);
        if (!variantes.some((item) => item.id === referencia.variantePecaId && item.estado === "ATIVA")) throw new Error("VARIANTE_INVALIDA");
      }
      produtos.push({ negocioId, pecaId: peca.id, variantePecaId: referencia.variantePecaId ?? null, ordem });
    }
    return this.deps.marketplace.criarOferta({
      negocioId, codigo: dados.codigo.trim().toUpperCase(), titulo: dados.titulo.trim(), descricao: dados.descricao.trim(), estado: "RASCUNHO",
      comissaoTipo: dados.comissaoTipo, comissaoValor: dados.comissaoValor, moeda: "AOA", criterios: dados.criterios ?? {}, regras: dados.regras ?? {}, bonus: dados.bonus ?? {},
      stockAmostras: Math.max(0, dados.stockAmostras ?? 0), iniciaEm: dados.iniciaEm ?? null, terminaEm: dados.terminaEm ?? null, produtos,
      missoes: (dados.missoes ?? []).map((item) => ({ titulo: item.titulo.trim(), descricao: item.descricao.trim(), criterios: item.criterios ?? {}, bonusEmKwanza: Math.max(0, item.bonusEmKwanza ?? 0), iniciaEm: item.iniciaEm ?? null, terminaEm: item.terminaEm ?? null, estado: "ATIVA" }))
    });
  }

  async listarSeller(negocioId: string) {
    const [ofertas, candidaturas, solicitacoes, amostras] = await Promise.all([
      this.deps.marketplace.listarOfertasNegocio(negocioId),
      this.deps.marketplace.listarCandidaturas({ negocioId }),
      this.deps.marketplace.listarSolicitacoes({ negocioId }),
      this.deps.marketplace.listarAmostras({ negocioId })
    ]);
    const candidaturasPublicas = await Promise.all(candidaturas.map(async (item) => ({
      ...item,
      parceiro: this.publicarParceiro(await this.deps.afiliados.buscarParceiroPorId(item.parceiroId, item.parceiroNegocioOrigemId))
    })));
    const solicitacoesPublicas = await Promise.all(solicitacoes.map(async (item) => ({ ...item, perfilCreator: await this.deps.marketplace.obterPerfilPorId(item.perfilCreatorId) })));
    return { ofertas, candidaturas: candidaturasPublicas, solicitacoes: solicitacoesPublicas, amostras };
  }

  publicarOferta(id: string, negocioId: string, publicar: boolean) { return this.deps.marketplace.publicarOferta(id, negocioId, publicar, new Date()); }

  async listarCreator(conta: ContaBizy) {
    const perfilCreator = await this.deps.marketplace.obterPerfilPorConta(conta.id);
    const parceiros = await this.parceirosDaConta(conta);
    const ids = parceiros.map((item) => item.id);
    const [ofertas, candidaturas, solicitacoes, relacoes, amostras, participacoes] = await Promise.all([
      this.deps.marketplace.listarOfertasPublicadas(new Date()),
      this.deps.marketplace.listarCandidaturas({ parceiroIds: ids }),
      perfilCreator ? this.deps.marketplace.listarSolicitacoes({ perfilCreatorId: perfilCreator.id }) : Promise.resolve([]),
      perfilCreator ? this.deps.marketplace.listarRelacoes(perfilCreator.id) : Promise.resolve([]),
      this.deps.marketplace.listarAmostras({ parceiroIds: ids }),
      this.deps.marketplace.listarParticipacoes(ids)
    ]);
    const enriquecidas = await Promise.all(ofertas.map((oferta) => this.enriquecerOferta(oferta)));
    return { perfilCreator, parceiros: parceiros.map((item) => this.publicarParceiro(item)), ofertas: enriquecidas, candidaturas, solicitacoes, relacoes, amostras, participacoes };
  }

  async salvarPerfil(conta: ContaBizy, dados: { nomePublico: string; bio?: string | null; avatarUrl?: string | null; localizacao?: string | null; categorias: string[]; canais: string[]; redesSociais?: Record<string, string>; aceitarTermos: boolean }) {
    if (!dados.aceitarTermos) throw new Error("TERMOS_CREATOR_OBRIGATORIOS");
    if (!dados.canais.length) throw new Error("CANAL_DIVULGACAO_OBRIGATORIO");
    const estado = dados.canais.some((canal) => ["VENDA_PRESENCIAL", "WHATSAPP"].includes(canal)) ? "ACTIVO" : "EM_VERIFICACAO";
    const perfil = await this.deps.marketplace.salvarPerfil(conta.id, { ...dados, estado, termosVersao: "creator.v1", termosAceitesEm: new Date() });
    await this.deps.contas.garantirContexto(conta.id, "CRIADOR");
    return perfil;
  }

  obterPerfil(conta: ContaBizy) { return this.deps.marketplace.obterPerfilPorConta(conta.id); }

  async candidatar(conta: ContaBizy, ofertaId: string, dados: { mensagem?: string | null }) {
    const oferta = (await this.deps.marketplace.listarOfertasPublicadas(new Date())).find((item) => item.id === ofertaId);
    if (!oferta) throw new Error("RECURSO_NAO_ENCONTRADO");
    const perfil = await this.deps.marketplace.obterPerfilPorConta(conta.id);
    if (!perfil || !["ACTIVO", "EM_VERIFICACAO"].includes(perfil.estado)) throw new Error("PERFIL_CREATOR_NAO_EXISTE");
    const modalidade = this.modalidadeOferta(oferta.regras);
    const programa = await this.deps.marketplace.garantirPrograma({
      negocioId: oferta.negocioId, nome: "Programa principal", modalidadeAcesso: modalidade,
      termosVersao: "creator.v1", criterios: oferta.criterios,
      politicaComissao: { tipo: oferta.comissaoTipo, valor: oferta.comissaoValor, moeda: oferta.moeda },
      politicaConteudo: oferta.regras
    });
    const agora = new Date();
    const estado = modalidade === "OPEN_ACCESS" && perfil.estado === "ACTIVO" ? "APROVADA" : "PENDENTE";
    const solicitacao = await this.deps.marketplace.criarSolicitacao({ perfilCreatorId: perfil.id, programaId: programa.id, ofertaId, estado, mensagem: dados.mensagem?.trim() || null, agora });
    if (estado === "APROVADA") await this.ativarAfiliacao(conta, perfil.id, programa, oferta, agora, solicitacao.id);
    return solicitacao;
  }

  async decidirCandidatura(id: string, negocioId: string, dados: { aprovar: boolean; motivo?: string | null }) {
    const solicitacao = await this.deps.marketplace.buscarSolicitacao(id, { negocioId });
    if (solicitacao) {
      const decidida = await this.deps.marketplace.decidirSolicitacao(id, negocioId, { estado: dados.aprovar ? "APROVADA" : "REJEITADA", motivo: dados.motivo, agora: new Date() });
      if (!dados.aprovar || !decidida) return decidida;
      const [perfil, oferta] = await Promise.all([
        this.deps.marketplace.obterPerfilPorId(solicitacao.perfilCreatorId),
        solicitacao.ofertaId ? this.deps.marketplace.buscarOferta(solicitacao.ofertaId, negocioId) : Promise.resolve(null)
      ]);
      if (!perfil || !oferta) throw new Error("RECURSO_NAO_ENCONTRADO");
      const conta = await this.deps.contas.buscarContaPorId(perfil.contaBizyId);
      if (!conta) throw new Error("RECURSO_NAO_ENCONTRADO");
      const programa = await this.deps.marketplace.garantirPrograma({ negocioId, nome: "Programa principal", modalidadeAcesso: this.modalidadeOferta(oferta.regras), termosVersao: "creator.v1", criterios: oferta.criterios, politicaComissao: { tipo: oferta.comissaoTipo, valor: oferta.comissaoValor, moeda: oferta.moeda }, politicaConteudo: oferta.regras });
      await this.ativarAfiliacao(conta, perfil.id, programa, oferta, new Date(), solicitacao.id);
      return decidida;
    }
    const candidatura = await this.deps.marketplace.buscarCandidatura(id, { negocioId });
    if (!candidatura) return null;
    const decidida = await this.deps.marketplace.decidirCandidatura(id, negocioId, { estado: dados.aprovar ? "APROVADA" : "REJEITADA", motivo: dados.motivo, agora: new Date() });
    if (!dados.aprovar) return decidida;
    const origem = await this.deps.afiliados.buscarParceiroPorId(candidatura.parceiroId, candidatura.parceiroNegocioOrigemId);
    if (origem?.contaBizyId) {
      const existentes = await this.deps.afiliados.listarParceiros(negocioId);
      if (!existentes.some((item) => item.contaBizyId === origem.contaBizyId)) {
        const oferta = await this.deps.marketplace.buscarOferta(candidatura.ofertaId, negocioId);
        await this.deps.afiliados.criarParceiro({
          negocioId, contaBizyId: origem.contaBizyId, tipo: origem.tipo, codigo: `CM-${origem.codigo}-${String(Date.now()).slice(-5)}`,
          nomePublico: origem.nomePublico, contacto: origem.contacto, estado: "ATIVO",
          regraComissao: oferta?.comissaoTipo === "PERCENTUAL" ? { tipo: "PERCENTUAL", percentual: (oferta.comissaoValor / 100) } : { tipo: "VALOR_FIXO", valorEmKwanza: oferta?.comissaoValor ?? 0 }, metodoPagamento: origem.metodoPagamento
        });
      }
    }
    return decidida;
  }

  async solicitarAmostra(conta: ContaBizy, candidaturaId: string, observacao?: string | null) {
    const parceiros = await this.parceirosDaConta(conta);
    const candidatura = await this.deps.marketplace.buscarCandidatura(candidaturaId, { parceiroIds: parceiros.map((item) => item.id) });
    if (!candidatura || candidatura.estado !== "APROVADA") throw new Error("RECURSO_NAO_ENCONTRADO");
    const oferta = await this.deps.marketplace.buscarOferta(candidatura.ofertaId, candidatura.negocioId);
    if (!oferta || oferta.stockAmostras <= 0) throw new Error("AMOSTRA_INDISPONIVEL");
    return this.deps.marketplace.solicitarAmostra(candidatura, observacao?.trim() || null);
  }

  async aceitarMissao(conta: ContaBizy, missaoId: string) {
    const parceiros = await this.parceirosDaConta(conta); const ids = parceiros.map((item) => item.id);
    const candidaturas = await this.deps.marketplace.listarCandidaturas({ parceiroIds: ids });
    for (const candidatura of candidaturas.filter((item) => item.estado === "APROVADA")) {
      const oferta = await this.deps.marketplace.buscarOferta(candidatura.ofertaId, candidatura.negocioId);
      if (oferta?.missoes.some((missao) => missao.id === missaoId && missao.estado === "ATIVA")) return this.deps.marketplace.aceitarMissao({ missaoId, candidaturaId: candidatura.id, parceiroId: candidatura.parceiroId });
    }
    throw new Error("RECURSO_NAO_ENCONTRADO");
  }

  private async enriquecerOferta(oferta: Awaited<ReturnType<RepositorioCreatorMarketplace["buscarOferta"]>> extends infer T ? Exclude<T, null> : never) {
    const loja = await this.deps.autenticacao.buscarNegocioPorId(oferta.negocioId);
    const catalogo = await this.deps.pecas.listar(oferta.negocioId);
    return { ...oferta, loja: { id: oferta.negocioId, nome: loja?.nomeComercial ?? "Loja Bizy", slug: loja?.slugPublico ?? null }, produtos: oferta.produtos.map((item) => { const produto = catalogo.find((peca) => peca.id === item.pecaId); return produto ? { ...item, codigo: produto.codigo, nome: produto.nome, precoEmKwanza: produto.precoEmKwanza, fotoUrl: produto.fotos[0] ?? null } : null; }).filter(Boolean) };
  }

  private async parceirosDaConta(conta: ContaBizy) {
    let parceiros = await this.deps.afiliados.listarParceirosPorConta(conta.id);
    if (!parceiros.length && conta.telefoneVerificadoEm && conta.telefoneCanonico) parceiros = await this.deps.afiliados.associarParceirosPorContactoVerificado(conta.id, [conta.telefoneCanonico, conta.telefoneCanonico.replace(/^\+/, ""), conta.telefoneCanonico.replace(/^\+?244/, "")]);
    for (const parceiro of parceiros) await this.deps.contas.garantirContexto(conta.id, parceiro.tipo === "CRIADOR" ? "CRIADOR" : "AFILIADO", parceiro.negocioId);
    return parceiros;
  }
  private modalidadeOferta(regras: Record<string, unknown>) {
    const valor = String(regras.modalidadeAcesso ?? "APPROVAL_REQUIRED").toUpperCase();
    return ["OPEN_ACCESS", "APPROVAL_REQUIRED", "INVITE_ONLY", "CAMPAIGN_CURATED"].includes(valor) ? valor : "APPROVAL_REQUIRED";
  }
  private async ativarAfiliacao(conta: ContaBizy, perfilCreatorId: string, programa: { id: string; negocioId: string; termosVersao: string }, oferta: Awaited<ReturnType<RepositorioCreatorMarketplace["buscarOferta"]>> extends infer T ? Exclude<T, null> : never, agora: Date, solicitacaoId: string) {
    const existentes = await this.deps.afiliados.listarParceiros(programa.negocioId);
    let parceiro = existentes.find((item) => item.contaBizyId === conta.id);
    const perfil = await this.deps.marketplace.obterPerfilPorId(perfilCreatorId);
    const comissao = oferta.comissaoTipo === "PERCENTUAL"
      ? { tipo: "PERCENTUAL" as const, percentual: oferta.comissaoValor / 100 }
      : { tipo: "VALOR_FIXO" as const, valorEmKwanza: oferta.comissaoValor };
    if (!parceiro) parceiro = await this.deps.afiliados.criarParceiro({ negocioId: programa.negocioId, contaBizyId: conta.id, tipo: "AFILIADO", codigo: `CR-${perfilCreatorId.slice(0, 8).toUpperCase()}-${String(Date.now()).slice(-5)}`, nomePublico: perfil?.nomePublico || conta.nome || "Creator Bizy", contacto: conta.telefoneCanonico, estado: "ATIVO", regraComissao: comissao, metodoPagamento: {} });
    await this.deps.marketplace.ativarRelacao({ perfilCreatorId, negocioId: programa.negocioId, programaId: programa.id, parceiroComercialId: parceiro.id, comissao, termosVersao: programa.termosVersao, produtoOfertaIds: oferta.produtos.map((item) => item.id), agora });
    await this.deps.marketplace.criarCandidatura({ id: solicitacaoId, ofertaId: oferta.id, negocioId: programa.negocioId, parceiroId: parceiro.id, parceiroNegocioOrigemId: programa.negocioId, estado: "APROVADA" });
    await this.deps.contas.garantirContexto(conta.id, "AFILIADO", programa.negocioId);
    return parceiro;
  }
  private publicarParceiro(parceiro: Awaited<ReturnType<RepositorioAfiliados["buscarParceiroPorId"]>> | undefined) { return parceiro ? { id: parceiro.id, nomePublico: parceiro.nomePublico, tipo: parceiro.tipo, estado: parceiro.estado } : null; }
}
