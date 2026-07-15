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
    const [ofertas, candidaturas, amostras] = await Promise.all([
      this.deps.marketplace.listarOfertasNegocio(negocioId),
      this.deps.marketplace.listarCandidaturas({ negocioId }),
      this.deps.marketplace.listarAmostras({ negocioId })
    ]);
    const candidaturasPublicas = await Promise.all(candidaturas.map(async (item) => ({
      ...item,
      parceiro: this.publicarParceiro(await this.deps.afiliados.buscarParceiroPorId(item.parceiroId, item.parceiroNegocioOrigemId))
    })));
    return { ofertas, candidaturas: candidaturasPublicas, amostras };
  }

  publicarOferta(id: string, negocioId: string, publicar: boolean) { return this.deps.marketplace.publicarOferta(id, negocioId, publicar, new Date()); }

  async listarCreator(conta: ContaBizy) {
    const parceiros = await this.parceirosDaConta(conta);
    const ids = parceiros.map((item) => item.id);
    const [ofertas, candidaturas, amostras, participacoes] = await Promise.all([
      this.deps.marketplace.listarOfertasPublicadas(new Date()),
      this.deps.marketplace.listarCandidaturas({ parceiroIds: ids }),
      this.deps.marketplace.listarAmostras({ parceiroIds: ids }),
      this.deps.marketplace.listarParticipacoes(ids)
    ]);
    const enriquecidas = await Promise.all(ofertas.map((oferta) => this.enriquecerOferta(oferta)));
    return { parceiros: parceiros.map((item) => this.publicarParceiro(item)), ofertas: enriquecidas, candidaturas, amostras, participacoes };
  }

  async candidatar(conta: ContaBizy, ofertaId: string, dados: { parceiroId: string; mensagem?: string | null }) {
    const oferta = (await this.deps.marketplace.listarOfertasPublicadas(new Date())).find((item) => item.id === ofertaId);
    if (!oferta) throw new Error("RECURSO_NAO_ENCONTRADO");
    const parceiros = await this.parceirosDaConta(conta);
    const parceiro = parceiros.find((item) => item.id === dados.parceiroId && item.estado === "ATIVO");
    if (!parceiro) throw new Error("RECURSO_NAO_ENCONTRADO");
    return this.deps.marketplace.criarCandidatura({ ofertaId, negocioId: oferta.negocioId, parceiroId: parceiro.id, parceiroNegocioOrigemId: parceiro.negocioId, mensagem: dados.mensagem?.trim() || null });
  }

  async decidirCandidatura(id: string, negocioId: string, dados: { aprovar: boolean; motivo?: string | null }) {
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
          regraComissao: oferta?.comissaoTipo === "PERCENTUAL" ? { tipo: "PERCENTUAL", percentual: (oferta.comissaoValor / 100) } : { tipo: "FIXA", valorEmKwanza: oferta?.comissaoValor ?? 0 }, metodoPagamento: origem.metodoPagamento
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
  private publicarParceiro(parceiro: Awaited<ReturnType<RepositorioAfiliados["buscarParceiroPorId"]>> | undefined) { return parceiro ? { id: parceiro.id, nomePublico: parceiro.nomePublico, tipo: parceiro.tipo, estado: parceiro.estado } : null; }
}
