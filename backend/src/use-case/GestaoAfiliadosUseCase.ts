import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioAfiliados } from "../dominio/repositorios/contratos.js";
import type {
  LinkAfiliado,
  NovoLinkAfiliado,
  NovoParceiroComercial,
  ParceiroComercial,
  Pedido,
  RegraComissaoParceiro
} from "../dominio/tipos.js";

export interface AtribuicaoAfiliadoResolvida {
  parceiro: ParceiroComercial;
  link: LinkAfiliado;
}

export class GestaoAfiliadosUseCase {
  constructor(
    private readonly afiliados: RepositorioAfiliados,
    eventos?: DespachadorEventos
  ) {
    eventos?.aoReceber("ORDER_PAYMENT_CONFIRMED", (evento) => {
      const pedidoId = typeof evento.dados.pedidoId === "string" ? evento.dados.pedidoId : null;
      const negocioId = typeof evento.dados.negocioId === "string" ? evento.dados.negocioId : null;
      if (!pedidoId || !negocioId) return;

      void this.afiliados.confirmarComissaoPorPedido(pedidoId, negocioId).catch(() => undefined);
    });
  }

  async criarParceiro(negocioId: string, dados: Omit<NovoParceiroComercial, "negocioId">) {
    this.validarRegraComissao(dados.regraComissao);
    return this.afiliados.criarParceiro({
      ...dados,
      negocioId,
      codigo: this.normalizarCodigo(dados.codigo)
    });
  }

  async listarParceiros(negocioId: string) {
    return { parceiros: await this.afiliados.listarParceiros(negocioId) };
  }

  async criarLink(negocioId: string, afiliadoId: string, dados: Omit<NovoLinkAfiliado, "negocioId" | "afiliadoId">) {
    const parceiro = await this.afiliados.buscarParceiroPorId(afiliadoId, negocioId);
    if (!parceiro) throw new Error("Parceiro comercial não encontrado.");
    if (parceiro.estado !== "ATIVO") throw new Error("Parceiro comercial não está ativo para gerar links.");

    const link = await this.afiliados.criarLink({
      ...dados,
      negocioId,
      afiliadoId,
      codigo: this.normalizarCodigo(dados.codigo),
      codigoProduto: dados.codigoProduto ? this.normalizarCodigo(dados.codigoProduto) : null
    });
    return this.comUrlPublica(link);
  }

  async listarLinks(negocioId: string) {
    const links = await this.afiliados.listarLinks(negocioId);
    return { links: links.map((link) => this.comUrlPublica(link)) };
  }

  async listarComissoes(negocioId: string) {
    return { comissoes: await this.afiliados.listarComissoes(negocioId) };
  }

  async resumir(negocioId: string) {
    return this.afiliados.resumir(negocioId);
  }

  async resolverAtribuicao(
    negocioId: string,
    referencia?: string | null
  ): Promise<AtribuicaoAfiliadoResolvida | null> {
    if (!referencia?.trim()) return null;

    const link = await this.afiliados.buscarLinkPorCodigo(referencia, negocioId);
    if (!link || !link.ativo) return null;
    if (link.expiraEm && link.expiraEm.getTime() <= Date.now()) return null;

    const parceiro = await this.afiliados.buscarParceiroPorId(link.afiliadoId, negocioId);
    if (!parceiro || parceiro.estado !== "ATIVO") return null;

    return { parceiro, link };
  }

  async registrarComissaoEstimativa(dados: {
    negocioId: string;
    pedido: Pedido;
    atribuicao: AtribuicaoAfiliadoResolvida;
  }) {
    const baseEmKwanza = dados.pedido.subtotalEmKwanza;
    const valorEmKwanza = this.calcularComissao(baseEmKwanza, dados.atribuicao.parceiro.regraComissao);

    return this.afiliados.criarOuAtualizarComissao({
      negocioId: dados.negocioId,
      afiliadoId: dados.atribuicao.parceiro.id,
      linkId: dados.atribuicao.link.id,
      pedidoId: dados.pedido.id,
      status: "ESTIMADA",
      baseEmKwanza,
      valorEmKwanza,
      moeda: "AOA"
    });
  }

  private validarRegraComissao(regra: RegraComissaoParceiro): void {
    if (regra.tipo === "PERCENTUAL") {
      if (typeof regra.percentual !== "number" || regra.percentual < 0 || regra.percentual > 100) {
        throw new Error("Informe um percentual de comissão entre 0 e 100.");
      }
      return;
    }

    if (typeof regra.valorEmKwanza !== "number" || regra.valorEmKwanza < 0) {
      throw new Error("Informe um valor fixo de comissão válido.");
    }
  }

  private calcularComissao(baseEmKwanza: number, regra: RegraComissaoParceiro): number {
    if (regra.tipo === "PERCENTUAL") {
      return Math.round((baseEmKwanza * (regra.percentual ?? 0)) / 100);
    }
    return Math.min(baseEmKwanza, regra.valorEmKwanza ?? 0);
  }

  private comUrlPublica(link: LinkAfiliado): LinkAfiliado & { urlPublica: string } {
    return {
      ...link,
      urlPublica: this.montarUrlPublica(link)
    };
  }

  private montarUrlPublica(link: LinkAfiliado): string {
    const base = (process.env.PUBLIC_STORE_BASE_URL ?? process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
    const slug = link.slugLoja ?? "loja";
    const caminho =
      link.destinoTipo === "PRODUTO" && link.codigoProduto
        ? `/lojas/${slug}/produtos/${link.codigoProduto}`
        : `/lojas/${slug}`;
    const params = new URLSearchParams({ ref: link.codigo });
    if (link.canal) params.set("canal", link.canal);
    if (link.origemConteudo) params.set("conteudo", link.origemConteudo);

    return `${base}${caminho}?${params.toString()}`;
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }
}
