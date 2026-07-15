import { randomBytes } from "node:crypto";
import type { RepositorioAfiliados, RepositorioAutenticacao, RepositorioPecas, RepositorioTrackingComercial } from "../../../dominio/repositorios/contratos.js";
import type { ContaBizy } from "../../commerce/dominio/tipos.js";
import type { RepositorioContaBizy } from "../../commerce/dominio/contratos.js";
import type { RepositorioConteudosCommerce, TipoConteudoCommerce } from "../dominio/conteudoCommerce.js";

interface DependenciasConteudoCompravel {
  conteudos: RepositorioConteudosCommerce;
  contas: RepositorioContaBizy;
  afiliados: RepositorioAfiliados;
  autenticacao: RepositorioAutenticacao;
  pecas: RepositorioPecas;
  tracking: RepositorioTrackingComercial;
}

export class ConteudoCompravelUseCase {
  constructor(private readonly deps: DependenciasConteudoCompravel) {}

  async criar(conta: ContaBizy, dados: {
    parceiroId: string; slug: string; tipo: TipoConteudoCommerce; titulo: string; legenda?: string | null;
    thumbnailUrl?: string | null; mediaUrl?: string | null; divulgacaoComercial?: boolean;
    produtos: Array<{ slugLoja: string; codigoProduto: string; variantePecaId?: string | null }>;
  }) {
    const parceiros = await this.parceirosDaConta(conta);
    const parceiro = parceiros.find((item) => item.id === dados.parceiroId && item.estado === "ATIVO");
    if (!parceiro) throw new Error("RECURSO_NAO_ENCONTRADO");
    if (await this.deps.conteudos.buscarPorSlug(dados.slug)) throw new Error("SLUG_EM_USO");
    const produtos = [];
    for (const [ordem, referencia] of dados.produtos.entries()) {
      const loja = await this.deps.autenticacao.buscarNegocioPorSlugPublico(referencia.slugLoja);
      if (!loja?.lojaPublicadaEm) throw new Error("PRODUTO_NAO_DISPONIVEL");
      const peca = await this.deps.pecas.buscarPorCodigo(referencia.codigoProduto, loja.id);
      if (!peca || peca.arquivadaEm || peca.estado === "ESGOTADA") throw new Error("PRODUTO_NAO_DISPONIVEL");
      if (referencia.variantePecaId) {
        const variantes = await this.deps.pecas.listarVariantesPeca(peca.id);
        if (!variantes.some((item) => item.id === referencia.variantePecaId && item.estado === "ATIVA")) throw new Error("VARIANTE_INVALIDA");
      }
      produtos.push({ negocioId: loja.id, pecaId: peca.id, variantePecaId: referencia.variantePecaId ?? null, ordem });
    }
    return this.deps.conteudos.criar({
      negocioId: parceiro.negocioId, parceiroId: parceiro.id, smartLinkId: null,
      slug: this.normalizarSlug(dados.slug), tipo: dados.tipo, titulo: dados.titulo.trim(), legenda: dados.legenda?.trim() || null,
      thumbnailUrl: dados.thumbnailUrl?.trim() || null, mediaUrl: dados.mediaUrl?.trim() || null,
      divulgacaoComercial: dados.divulgacaoComercial !== false, estado: "EM_REVISAO", motivoModeracao: null, produtos
    });
  }

  async listarDaConta(conta: ContaBizy) {
    const parceiros = await this.parceirosDaConta(conta);
    return this.deps.conteudos.listarPorParceiros(parceiros.map((item) => item.id));
  }

  async moderar(id: string, negocioId: string, dados: { aprovar: boolean; motivo?: string | null }) {
    const conteudo = await this.deps.conteudos.buscarPorIdContexto(id, { negocioId });
    if (!conteudo) return null;
    if (!dados.aprovar) return this.deps.conteudos.moderar(id, negocioId, { estado: "REJEITADO", motivo: dados.motivo ?? "Conteudo rejeitado na moderacao." });
    let smartLinkId = conteudo.smartLinkId;
    if (!smartLinkId) {
      const link = await this.deps.afiliados.criarLink({
        negocioId, afiliadoId: conteudo.parceiroId, codigo: `CT-${randomBytes(7).toString("base64url").toUpperCase()}`,
        destinoTipo: "CONTEUDO", destinoId: conteudo.slug, origemConteudo: conteudo.slug, canal: "conteudo-commerce",
        metadata: { conteudoId: conteudo.id, divulgacaoComercial: conteudo.divulgacaoComercial }
      });
      smartLinkId = link.id;
    }
    return this.deps.conteudos.moderar(id, negocioId, { estado: "PUBLICADO", motivo: dados.motivo ?? null, smartLinkId });
  }

  async obterPublico(slug: string) {
    const conteudo = await this.deps.conteudos.buscarPorSlug(this.normalizarSlug(slug));
    if (!conteudo || conteudo.estado !== "PUBLICADO") return null;
    const parceiro = await this.deps.afiliados.buscarParceiroPorId(conteudo.parceiroId, conteudo.negocioId);
    if (!parceiro || parceiro.estado !== "ATIVO") return null;
    const links = await this.deps.afiliados.listarLinks(conteudo.negocioId);
    const smartLink = links.find((item) => item.id === conteudo.smartLinkId && item.ativo) ?? null;
    const produtos = [];
    for (const item of conteudo.produtos) {
      const [loja, pecas] = await Promise.all([
        this.deps.autenticacao.buscarNegocioPorId(item.negocioId),
        this.deps.pecas.listar(item.negocioId)
      ]);
      const peca = pecas.find((produto) => produto.id === item.pecaId);
      if (!loja?.slugPublico || !loja.lojaPublicadaEm || !peca || peca.arquivadaEm || peca.estado === "ESGOTADA") continue;
      produtos.push({
        id: peca.id, codigo: peca.codigo, nome: peca.nome, descricao: peca.descricao, precoEmKwanza: peca.precoEmKwanza,
        fotoUrl: peca.fotos[0] ?? null, variantePecaId: item.variantePecaId, loja: { id: loja.id, slug: loja.slugPublico, nome: loja.nomeComercial },
        url: `/lojas/${encodeURIComponent(loja.slugPublico)}/produtos/${encodeURIComponent(peca.codigo)}`
      });
    }
    await this.deps.tracking.registrarEvento({
      negocioId: conteudo.negocioId, tipo: "CONTENT_VIEW", entidadeTipo: "CONTEUDO_COMMERCE", entidadeId: conteudo.id,
      origem: "conteudo-compravel", metadata: { parceiroId: parceiro.id, conteudoId: conteudo.id, smartLinkId: smartLink?.id ?? null }
    });
    return {
      conteudo: { ...conteudo, parceiro: { id: parceiro.id, nomePublico: parceiro.nomePublico, tipo: parceiro.tipo }, smartLink: smartLink ? { codigo: smartLink.codigo, url: `/go/${smartLink.codigo}` } : null },
      produtos,
      divulgacao: conteudo.divulgacaoComercial ? "O criador pode receber comissão nesta compra." : null
    };
  }

  private normalizarSlug(valor: string) { return valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }

  private async parceirosDaConta(conta: ContaBizy) {
    let parceiros = await this.deps.afiliados.listarParceirosPorConta(conta.id);
    if (!parceiros.length && conta.telefoneVerificadoEm && conta.telefoneCanonico) {
      const canonico = conta.telefoneCanonico;
      parceiros = await this.deps.afiliados.associarParceirosPorContactoVerificado(
        conta.id,
        [canonico, canonico.replace(/^\+/, ""), canonico.replace(/^\+?244/, "")]
      );
    }
    for (const parceiro of parceiros) {
      await this.deps.contas.garantirContexto(conta.id, parceiro.tipo === "CRIADOR" ? "CRIADOR" : "AFILIADO", parceiro.negocioId);
    }
    return parceiros;
  }
}
