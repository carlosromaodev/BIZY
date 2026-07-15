import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  RepositorioAfiliados,
  RepositorioAutenticacao,
  RepositorioPecas,
  RepositorioTrackingComercial
} from "../../../dominio/repositorios/contratos.js";
import type { LinkAfiliado, NegocioBizy, ParceiroComercial, Peca } from "../../../dominio/tipos.js";
import type {
  RepositorioSmartLinksCommerce,
  SessaoCommerce,
  ToqueAtribuicaoCommerce
} from "../dominio/smartLinksCommerce.js";

const DESTINOS_SMART_LINK = new Set([
  "PRODUTO",
  "LOJA",
  "COLECAO",
  "CONTEUDO",
  "CAMPANHA",
  "CARRINHO",
  "MINI_LOJA",
  "FORMULARIO",
  "PRODUTO_LEARNING"
]);

interface DependenciasSmartLinks {
  smartLinks: RepositorioSmartLinksCommerce;
  afiliados: RepositorioAfiliados;
  autenticacao: RepositorioAutenticacao;
  pecas: RepositorioPecas;
  tracking: RepositorioTrackingComercial;
}

interface LinkResolvido {
  link: LinkAfiliado;
  parceiro: ParceiroComercial;
  negocio: NegocioBizy;
  produto: Peca | null;
  destinoUrl: string;
  preview: {
    titulo: string;
    descricao: string;
    imagemUrl: string | null;
    urlCanonica: string;
  };
}

export interface ContextoSmartLinkCommerce {
  sessao: SessaoCommerce;
  toque: ToqueAtribuicaoCommerce | null;
  atribuicao: Record<string, unknown> | null;
}

export class SmartLinksCommerceUseCase {
  private readonly ttlSessaoMs = 30 * 24 * 60 * 60_000;

  constructor(
    private readonly deps: DependenciasSmartLinks,
    private readonly segredo: string
  ) {}

  async resolverPreview(codigo: string): Promise<LinkResolvido | null> {
    return this.resolverLink(codigo);
  }

  async resolverClique(codigo: string, token: string | null, metadata: Record<string, unknown> = {}) {
    const resolvido = await this.resolverLink(codigo);
    if (!resolvido) return null;

    const agora = new Date();
    let tokenSessao = token?.trim() || null;
    let sessao = tokenSessao
      ? await this.deps.smartLinks.buscarSessaoPorTokenHash(this.hashToken(tokenSessao), agora)
      : null;
    if (!sessao) {
      tokenSessao = randomBytes(32).toString("base64url");
      sessao = await this.deps.smartLinks.criarSessao({
        tokenHash: this.hashToken(tokenSessao),
        trackingId: `commerce_${randomUUID()}`,
        contaBizyId: null,
        expiraEm: new Date(agora.getTime() + this.ttlSessaoMs),
        metadata: this.sanitizarMetadata(metadata)
      });
    }

    const campanhaId = this.campanhaId(resolvido.link);
    const conteudoId = this.conteudoId(resolvido.link);
    const toque = await this.deps.smartLinks.registrarToque({
      sessaoId: sessao.id,
      negocioId: resolvido.link.negocioId,
      linkId: resolvido.link.id,
      afiliadoId: resolvido.link.afiliadoId,
      tipo: "SMART_LINK_CLICK",
      destinoTipo: this.normalizarDestino(resolvido.link.destinoTipo),
      destinoId: resolvido.link.destinoId,
      campanhaId,
      conteudoId,
      codigoProduto: resolvido.link.codigoProduto,
      canal: resolvido.link.canal,
      origem: resolvido.link.origemConteudo ?? "smart-link",
      metadata: this.sanitizarMetadata(resolvido.link.metadata)
    });

    await this.deps.tracking.registrarEvento({
      negocioId: resolvido.link.negocioId,
      tipo: "SMART_LINK_CLICK",
      entidadeTipo: "LINK_AFILIADO",
      entidadeId: resolvido.link.id,
      slugLoja: resolvido.negocio.slugPublico,
      codigoProduto: resolvido.link.codigoProduto,
      trackingId: sessao.trackingId,
      origem: resolvido.link.origemConteudo ?? "smart-link",
      canal: resolvido.link.canal,
      utm: this.extrairUtm(resolvido.link.metadata),
      metadata: {
        sessaoCommerceId: sessao.id,
        toqueId: toque.id,
        linkId: resolvido.link.id,
        codigoLink: resolvido.link.codigo,
        afiliadoId: resolvido.link.afiliadoId,
        campanhaId,
        conteudoId,
        destinoTipo: toque.destinoTipo,
        destinoId: toque.destinoId
      }
    }).catch(() => undefined);

    return { ...resolvido, sessao, toque, token: tokenSessao as string };
  }

  async obterContexto(token: string | null): Promise<ContextoSmartLinkCommerce | null> {
    if (!token?.trim()) return null;
    const sessao = await this.deps.smartLinks.buscarSessaoPorTokenHash(this.hashToken(token.trim()), new Date());
    if (!sessao) return null;
    const toque = await this.deps.smartLinks.buscarUltimoToque(sessao.id);
    return {
      sessao,
      toque,
      atribuicao: toque ? {
        sessaoCommerceId: sessao.id,
        trackingId: sessao.trackingId,
        toqueId: toque.id,
        linkId: toque.linkId,
        afiliadoId: toque.afiliadoId,
        modelo: "ULTIMO_TOQUE",
        codigoProduto: toque.codigoProduto,
        campanhaId: toque.campanhaId,
        conteudoId: toque.conteudoId,
        canal: toque.canal,
        capturadoEm: toque.criadoEm.toISOString()
      } : null
    };
  }

  montarUrlPublica(codigo: string): string {
    return this.montarUrlBase(process.env.PUBLIC_SMART_LINK_BASE_URL ?? process.env.BACKEND_PUBLIC_URL, `/go/${encodeURIComponent(codigo)}`);
  }

  private async resolverLink(codigo: string): Promise<LinkResolvido | null> {
    const link = await this.deps.afiliados.buscarLinkPorCodigo(codigo.trim().toUpperCase());
    if (!link || !this.linkDisponivel(link)) return null;
    const [parceiro, negocio] = await Promise.all([
      this.deps.afiliados.buscarParceiroPorId(link.afiliadoId, link.negocioId),
      this.deps.autenticacao.buscarNegocioPorId(link.negocioId)
    ]);
    if (!parceiro || parceiro.estado !== "ATIVO" || !negocio) return null;

    const destinoTipo = this.normalizarDestino(link.destinoTipo);
    if (!DESTINOS_SMART_LINK.has(destinoTipo)) return null;
    const exigeLoja = new Set(["PRODUTO", "LOJA", "COLECAO", "CAMPANHA", "MINI_LOJA", "FORMULARIO"]);
    if (exigeLoja.has(destinoTipo) && (!negocio.slugPublico || !negocio.lojaPublicadaEm)) return null;
    if (link.slugLoja && negocio.slugPublico && link.slugLoja !== negocio.slugPublico) return null;

    const produto = destinoTipo === "PRODUTO" && link.codigoProduto
      ? await this.deps.pecas.buscarPorCodigo(link.codigoProduto, negocio.id)
      : null;
    if (destinoTipo === "PRODUTO" && (!produto || produto.arquivadaEm || produto.estado === "ESGOTADA")) return null;

    const caminho = this.montarCaminhoDestino(destinoTipo, link, negocio);
    if (!caminho) return null;
    const destinoUrl = this.montarUrlDestino(caminho, link);
    const urlCanonica = this.montarUrlPublica(link.codigo);
    return {
      link,
      parceiro,
      negocio,
      produto,
      destinoUrl,
      preview: {
        titulo: produto?.nome ?? `${parceiro.nomePublico} recomenda ${negocio.nomeComercial}`,
        descricao: produto?.descricao ?? negocio.descricaoPublica ?? `Descobre a selecao de ${parceiro.nomePublico} no Bizy.`,
        imagemUrl: produto?.fotos[0] ?? null,
        urlCanonica
      }
    };
  }

  private montarCaminhoDestino(tipo: string, link: LinkAfiliado, negocio: NegocioBizy): string | null {
    const slugLoja = negocio.slugPublico ? encodeURIComponent(negocio.slugPublico) : null;
    const destinoId = link.destinoId?.trim() ? encodeURIComponent(link.destinoId.trim()) : null;
    if (tipo === "PRODUTO") return slugLoja && link.codigoProduto ? `/lojas/${slugLoja}/produtos/${encodeURIComponent(link.codigoProduto)}` : null;
    if (tipo === "LOJA" || tipo === "CAMPANHA" || tipo === "MINI_LOJA") return slugLoja ? `/lojas/${slugLoja}` : null;
    if (tipo === "COLECAO") return slugLoja && destinoId ? `/lojas/${slugLoja}/catalogos/${destinoId}` : null;
    if (tipo === "CONTEUDO") return destinoId ? `/c/${destinoId}` : null;
    if (tipo === "CARRINHO") return destinoId ? `/carrinhos/${destinoId}` : null;
    if (tipo === "FORMULARIO") return slugLoja ? `/f/${slugLoja}/lead` : null;
    if (tipo === "PRODUTO_LEARNING") return destinoId ? `/learning/produtos/${destinoId}` : null;
    return null;
  }

  private montarUrlDestino(caminho: string, link: LinkAfiliado): string {
    const params = new URLSearchParams({ ref: link.codigo });
    if (link.canal) params.set("canal", link.canal);
    if (link.origemConteudo) params.set("conteudo", link.origemConteudo);
    const tipo = this.normalizarDestino(link.destinoTipo);
    if (tipo === "CAMPANHA" && link.destinoId) params.set("campanha", link.destinoId);
    if (tipo === "MINI_LOJA") params.set("mini_loja", link.codigo);
    for (const [chave, valor] of Object.entries(this.extrairUtm(link.metadata))) params.set(chave, valor);
    for (const [metadata, query] of [["vendedorId", "vendedor"], ["postSocialId", "post"], ["liveId", "live"]] as const) {
      const valor = this.texto(link.metadata[metadata]);
      if (valor) params.set(query, valor);
    }
    return this.montarUrlBase(process.env.PUBLIC_STORE_BASE_URL ?? process.env.FRONTEND_URL, `${caminho}?${params.toString()}`);
  }

  private montarUrlBase(base: string | undefined, caminho: string): string {
    if (!base?.trim()) return caminho;
    const url = new URL(base);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Base publica Smart Link invalida.");
    return new URL(caminho, `${url.origin}/`).toString();
  }

  private extrairUtm(metadata: Record<string, unknown>): Record<string, string> {
    const campos = {
      utm_source: metadata.utmSource,
      utm_medium: metadata.utmMedium,
      utm_campaign: metadata.utmCampaign,
      utm_content: metadata.utmContent
    };
    return Object.fromEntries(Object.entries(campos).flatMap(([chave, valor]) => {
      const texto = this.texto(valor);
      return texto ? [[chave, texto]] : [];
    }));
  }

  private sanitizarMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const permitidos = ["utmSource", "utmMedium", "utmCampaign", "utmContent", "vendedorId", "postSocialId", "liveId", "requestId", "userAgentHash", "ipHash"];
    return Object.fromEntries(permitidos.flatMap((chave) => {
      const valor = this.texto(metadata[chave]);
      return valor ? [[chave, valor.slice(0, 240)]] : [];
    }));
  }

  private campanhaId(link: LinkAfiliado): string | null {
    if (this.normalizarDestino(link.destinoTipo) === "CAMPANHA") return link.destinoId;
    return this.texto(link.metadata.campanhaId) ?? this.texto(link.metadata.utmCampaign);
  }

  private conteudoId(link: LinkAfiliado): string | null {
    if (this.normalizarDestino(link.destinoTipo) === "CONTEUDO") return link.destinoId;
    return link.origemConteudo ?? this.texto(link.metadata.postSocialId) ?? this.texto(link.metadata.liveId);
  }

  private normalizarDestino(tipo: string): string {
    return tipo.trim().toUpperCase().replace(/-/g, "_");
  }

  private texto(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, 240) : null;
  }

  private linkDisponivel(link: LinkAfiliado): boolean {
    return link.ativo && (!link.expiraEm || link.expiraEm.getTime() > Date.now());
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(`${this.segredo}:sessao-commerce:${token}`).digest("hex");
  }
}
