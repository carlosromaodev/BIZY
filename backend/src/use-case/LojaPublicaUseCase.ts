import type {
  RepositorioAutenticacao,
  RepositorioPecas,
  RepositorioTrackingComercial
} from "../dominio/repositorios/contratos.js";
import type {
  DadosPublicacaoLoja,
  NegocioBizy,
  NovoEventoTrackingComercial,
  Peca
} from "../dominio/tipos.js";

interface OpcoesTrackingPublico {
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
  utm?: Record<string, string>;
}

interface DadosCheckoutWhatsAppPublico {
  quantidade: number;
  variante: Record<string, string>;
  trackingId?: string | null;
  origem: string;
}

export class LojaPublicaUseCase {
  constructor(
    private readonly autenticacao: RepositorioAutenticacao,
    private readonly pecas: RepositorioPecas,
    private readonly tracking: RepositorioTrackingComercial
  ) {}

  async publicarLoja(negocioId: string, dados: DadosPublicacaoLoja) {
    return this.autenticacao.atualizarPublicacaoLoja(negocioId, {
      ...dados,
      slug: this.normalizarSlug(dados.slug)
    });
  }

  async obterLoja(slug: string, tracking?: OpcoesTrackingPublico) {
    const negocio = await this.exigirLojaPublicada(slug);
    const produtos = (await this.pecas.listar(negocio.id)).filter((peca) => this.pecaVendavel(peca));

    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "LOJA_VISITADA",
      slugLoja: negocio.slugPublico,
      entidadeTipo: "LOJA",
      entidadeId: negocio.id,
      trackingId: tracking?.trackingId ?? null,
      origem: tracking?.origem ?? null,
      canal: tracking?.canal ?? "site",
      utm: tracking?.utm ?? {}
    });

    return {
      loja: this.mapearLojaPublica(negocio),
      produtos: produtos.map((peca) => this.mapearProdutoPublico(peca))
    };
  }

  async obterProduto(slug: string, codigo: string, tracking?: OpcoesTrackingPublico) {
    const negocio = await this.exigirLojaPublicada(slug);
    const peca = await this.exigirProdutoVendavel(negocio, codigo);

    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "PRODUTO_VISTO",
      slugLoja: negocio.slugPublico,
      codigoProduto: peca.codigo,
      entidadeTipo: "PRODUTO",
      entidadeId: peca.codigo,
      trackingId: tracking?.trackingId ?? null,
      origem: tracking?.origem ?? null,
      canal: tracking?.canal ?? "site",
      utm: tracking?.utm ?? {}
    });

    return {
      loja: this.mapearLojaPublica(negocio),
      produto: this.mapearProdutoPublico(peca)
    };
  }

  async gerarCheckoutWhatsApp(slug: string, codigo: string, dados: DadosCheckoutWhatsAppPublico) {
    const negocio = await this.exigirLojaPublicada(slug);
    const peca = await this.exigirProdutoVendavel(negocio, codigo);
    const telefone = negocio.whatsapp ?? negocio.telefone;
    if (!telefone) {
      throw new Error("Loja sem WhatsApp configurado para checkout.");
    }

    const mensagem = this.montarMensagemWhatsApp(negocio, peca, dados);
    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "WHATSAPP_CLICK",
      slugLoja: negocio.slugPublico,
      codigoProduto: peca.codigo,
      entidadeTipo: "PRODUTO",
      entidadeId: peca.codigo,
      trackingId: dados.trackingId ?? null,
      origem: dados.origem,
      canal: "whatsapp",
      metadata: {
        quantidade: dados.quantidade,
        variante: dados.variante
      }
    });

    return {
      telefone,
      mensagem,
      whatsappUrl: `https://wa.me/${this.normalizarTelefoneWhatsApp(telefone)}?text=${encodeURIComponent(mensagem)}`
    };
  }

  async registrarEventoPublico(slug: string, dados: Omit<NovoEventoTrackingComercial, "negocioId">) {
    const negocio = await this.exigirLojaPublicada(slug);
    return this.tracking.registrarEvento({
      ...dados,
      negocioId: negocio.id,
      slugLoja: negocio.slugPublico
    });
  }

  async resumirTracking(negocioId: string) {
    return this.tracking.resumirEventos(negocioId);
  }

  private async exigirLojaPublicada(slug: string): Promise<NegocioBizy> {
    const negocio = await this.autenticacao.buscarNegocioPorSlugPublico(this.normalizarSlug(slug));
    if (!negocio || !negocio.lojaPublicadaEm) {
      throw new Error(`Loja pública ${slug} não encontrada.`);
    }

    return negocio;
  }

  private async exigirProdutoVendavel(negocio: NegocioBizy, codigo: string): Promise<Peca> {
    const peca = await this.pecas.buscarPorCodigo(codigo.trim().toUpperCase(), negocio.id);
    if (!peca || !this.pecaVendavel(peca)) {
      throw new Error(`Produto #${codigo} não encontrado na loja pública.`);
    }

    return peca;
  }

  private pecaVendavel(peca: Peca): boolean {
    return !peca.arquivadaEm && peca.quantidade > 0 && peca.estado !== "ESGOTADA" && peca.estado !== "VENDIDA";
  }

  private mapearLojaPublica(negocio: NegocioBizy) {
    return {
      slug: negocio.slugPublico,
      nomeComercial: negocio.nomeComercial,
      descricaoPublica: negocio.descricaoPublica,
      segmento: negocio.segmento,
      tipo: negocio.tipo,
      provincia: negocio.provincia,
      municipio: negocio.municipio,
      instagram: negocio.instagram,
      tiktok: negocio.tiktok,
      moeda: negocio.moeda
    };
  }

  private mapearProdutoPublico(peca: Peca) {
    return {
      codigo: peca.codigo,
      sku: peca.sku,
      nome: peca.nome,
      descricao: peca.descricao,
      categoria: peca.categoria,
      colecao: peca.colecao,
      precoEmKwanza: peca.precoEmKwanza,
      quantidade: peca.quantidade,
      fotos: peca.fotos,
      variantes: peca.variantes,
      estadoStock: peca.estadoStock,
      disponivel: this.pecaVendavel(peca)
    };
  }

  private montarMensagemWhatsApp(negocio: NegocioBizy, peca: Peca, dados: DadosCheckoutWhatsAppPublico): string {
    const variantes = Object.entries(dados.variante)
      .map(([nome, valor]) => `${nome}: ${valor}`)
      .join(", ");
    const linhas = [
      `Olá, ${negocio.nomeComercial}. Quero comprar:`,
      `Produto: ${peca.codigo} ${peca.nome}`,
      `Quantidade: ${dados.quantidade}`,
      `Preço unitário: ${this.formatarKwanza(peca.precoEmKwanza)}`,
      `Total estimado: ${this.formatarKwanza(peca.precoEmKwanza * dados.quantidade)}`,
      variantes ? `Variante: ${variantes}` : null,
      `Origem: ${dados.origem}`
    ].filter(Boolean);

    return linhas.join("\n");
  }

  private formatarKwanza(valor: number): string {
    return `${valor.toLocaleString("pt-AO")} Kz`;
  }

  private normalizarSlug(slug: string): string {
    return slug.trim().toLowerCase();
  }

  private normalizarTelefoneWhatsApp(telefone: string): string {
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length === 9) return `244${digitos}`;
    return digitos;
  }

  private async registrarTrackingSilencioso(dados: NovoEventoTrackingComercial): Promise<void> {
    try {
      await this.tracking.registrarEvento(dados);
    } catch {
      // Tracking não deve derrubar a experiência pública de compra.
    }
  }
}
