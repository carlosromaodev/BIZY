import type {
  RepositorioAutenticacao,
  RepositorioEventosOperacionais,
  RepositorioOportunidadesRecuperacao,
  RepositorioPecas,
  RepositorioTrackingComercial
} from "../dominio/repositorios/contratos.js";
import { normalizarTelefone } from "../dominio/servicos/normalizarContato.js";
import type {
  DadosPublicacaoLoja,
  NegocioBizy,
  NovoEventoTrackingComercial,
  Peca
} from "../dominio/tipos.js";
import type { GestaoClientesCrmUseCase } from "./GestaoClientesCrmUseCase.js";
import type {
  AtribuicaoAfiliadoResolvida,
  GestaoAfiliadosUseCase,
  ModeloAtribuicaoComercial,
  ReferenciaAtribuicaoComercial
} from "./GestaoAfiliadosUseCase.js";
import type { GestaoPedidosUseCase } from "./GestaoPedidosUseCase.js";

interface OpcoesTrackingPublico {
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
  utm?: Record<string, string>;
}

interface FiltrosProdutosPublicos {
  busca?: string | null;
  categoria?: string | null;
  colecao?: string | null;
  estadoStock?: string | null;
  limite?: number | null;
}

interface DadosCheckoutWhatsAppPublico {
  quantidade: number;
  variante: Record<string, string>;
  trackingId?: string | null;
  origem: string;
  entrega?: DadosEntregaCheckoutPublico;
}

interface ItemCheckoutPublico {
  codigoPeca: string;
  quantidade: number;
}

interface DadosEntregaCheckoutPublico {
  tipo: "ENTREGA" | "RETIRADA";
  provincia?: string | null;
  municipio?: string | null;
  bairro?: string | null;
  endereco?: string | null;
}

interface DadosCalculoEntregaPublica {
  itens: ItemCheckoutPublico[];
  entrega: DadosEntregaCheckoutPublico;
}

interface DadosCheckoutSitePublico extends DadosCalculoEntregaPublica {
  cliente: {
    nome?: string | null;
    telefone?: string | null;
    email?: string | null;
    consentimentoMarketing: boolean;
    consentimentoDados: boolean;
  };
  trackingId?: string | null;
  referencia?: string | null;
  referenciasAssistidas?: Array<string | ReferenciaAtribuicaoComercial>;
  atribuicao?: {
    modelo?: ModeloAtribuicaoComercial;
    janelaDias?: number;
  };
  origem: string;
  canal: string;
  observacao?: string | null;
}

interface DadosCheckoutAbandonadoPublico extends DadosCalculoEntregaPublica {
  cliente: {
    nome?: string | null;
    telefone?: string | null;
    email?: string | null;
    consentimentoMarketing: boolean;
    consentimentoDados: boolean;
  };
  trackingId?: string | null;
  referencia?: string | null;
  origem: string;
  canal: string;
  observacao?: string | null;
}

interface ResumoCheckoutPublico {
  itens: Array<ItemCheckoutPublico & { peca: Peca; subtotalEmKwanza: number }>;
  subtotalEmKwanza: number;
  entrega: EntregaCalculadaPublica;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
}

interface EntregaCalculadaPublica {
  tipo: "ENTREGA" | "RETIRADA";
  regra: "zona" | "padrao" | "gratis" | "retirada";
  taxaEmKwanza: number;
  prazo: string | null;
  descricao: string;
  endereco: string | null;
}

export class LojaPublicaUseCase {
  constructor(
    private readonly autenticacao: RepositorioAutenticacao,
    private readonly pecas: RepositorioPecas,
    private readonly tracking: RepositorioTrackingComercial,
    private readonly clientesCrm: GestaoClientesCrmUseCase,
    private readonly pedidos: GestaoPedidosUseCase,
    private readonly afiliados?: GestaoAfiliadosUseCase,
    private readonly oportunidades?: RepositorioOportunidadesRecuperacao,
    private readonly eventosOperacionais?: RepositorioEventosOperacionais
  ) {}

  async publicarLoja(negocioId: string, dados: DadosPublicacaoLoja) {
    return this.autenticacao.atualizarPublicacaoLoja(negocioId, {
      ...dados,
      slug: this.normalizarSlug(dados.slug)
    });
  }

  async obterLoja(slug: string, tracking?: OpcoesTrackingPublico, filtros: FiltrosProdutosPublicos = {}) {
    const negocio = await this.exigirLojaPublicada(slug);
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const produtos = (await this.pecas.listar(negocio.id))
      .filter((peca) => this.pecaVendavel(peca))
      .filter((peca) => this.produtoAtendeFiltrosPublicos(peca, filtros))
      .slice(0, limite);

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

    const produtosPublicos = produtos.map((peca) => this.mapearProdutoPublico(peca));

    return {
      loja: this.mapearLojaPublica(negocio),
      produtos: produtosPublicos,
      filtros: this.filtrosPublicosAplicados(filtros),
      vitrine: this.montarVitrinePublica(produtosPublicos),
      seo: this.mapearSeoLoja(negocio, produtos[0])
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
      produto: this.mapearProdutoPublico(peca),
      seo: this.mapearSeoProduto(negocio, peca)
    };
  }

  async calcularEntrega(slug: string, dados: DadosCalculoEntregaPublica) {
    const negocio = await this.exigirLojaPublicada(slug);
    const resumo = await this.resolverResumoCheckout(negocio, dados.itens, dados.entrega);

    return this.mapearResumoCheckout(negocio, resumo);
  }

  async gerarCheckoutWhatsApp(slug: string, codigo: string, dados: DadosCheckoutWhatsAppPublico) {
    const negocio = await this.exigirLojaPublicada(slug);
    const peca = await this.exigirProdutoVendavel(negocio, codigo);
    const telefone = negocio.whatsapp ?? negocio.telefone;
    if (!telefone) {
      throw new Error("Loja sem WhatsApp configurado para checkout.");
    }

    const resumo = await this.resolverResumoCheckout(
      negocio,
      [{ codigoPeca: codigo, quantidade: dados.quantidade }],
      dados.entrega ?? { tipo: "RETIRADA" }
    );
    const mensagem = this.montarMensagemWhatsApp(negocio, peca, dados, resumo);
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
        variante: dados.variante,
        entrega: resumo.entrega,
        totalEmKwanza: resumo.totalEmKwanza
      }
    });

    return {
      telefone,
      mensagem,
      whatsappUrl: `https://wa.me/${this.normalizarTelefoneWhatsApp(telefone)}?text=${encodeURIComponent(mensagem)}`
    };
  }

  async criarCheckoutSite(slug: string, dados: DadosCheckoutSitePublico) {
    const negocio = await this.exigirLojaPublicada(slug);
    const resumo = await this.resolverResumoCheckout(negocio, dados.itens, dados.entrega);
    const politicaAtribuicao = this.resolverPoliticaAtribuicao(negocio, dados.atribuicao);
    const atribuicaoOriginal = await this.afiliados?.resolverAtribuicao(negocio.id, {
      referencia: dados.referencia,
      referenciasAssistidas: dados.referenciasAssistidas,
      modelo: politicaAtribuicao.modelo,
      janelaDias: politicaAtribuicao.janelaDias
    }) ?? null;
    const autoIndicacao = this.afiliados?.ehAutoIndicacao(atribuicaoOriginal, dados.cliente.telefone) ?? false;
    if (autoIndicacao && atribuicaoOriginal) {
      await this.registrarEventoOperacionalSilencioso({
        negocioId: negocio.id,
        topico: "afiliados",
        tipo: "AFILIACAO_SUSPEITA",
        entidadeTipo: "link_afiliado",
        entidadeId: atribuicaoOriginal.link.id,
        idempotencyKey: `afiliacao-suspeita:${negocio.id}:${atribuicaoOriginal.link.id}:${dados.trackingId ?? dados.cliente.telefone ?? Date.now()}`,
        payload: {
          motivo: "AUTOINDICACAO",
          parceiroId: atribuicaoOriginal.parceiro.id,
          telefoneCliente: dados.cliente.telefone ?? null,
          trackingId: dados.trackingId ?? null,
          atribuicao: this.formatarAtribuicaoPublica(atribuicaoOriginal)
        },
        estado: "PROCESSADO"
      });
    }
    const atribuicao = autoIndicacao ? null : atribuicaoOriginal;
    const atribuicaoBloqueada = autoIndicacao && atribuicaoOriginal
      ? {
          motivo: "AUTOINDICACAO",
          parceiroId: atribuicaoOriginal.parceiro.id,
          linkAfiliadoId: atribuicaoOriginal.link.id
        }
      : null;
    const origemEfetiva = atribuicao ? `afiliado:${atribuicao.parceiro.codigo}` : dados.origem;
    const canalEfetivo = atribuicao?.link.canal ?? dados.canal;

    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "CHECKOUT_INICIADO",
      slugLoja: negocio.slugPublico,
      entidadeTipo: "CHECKOUT",
      entidadeId: dados.trackingId ?? null,
      trackingId: dados.trackingId ?? null,
      origem: origemEfetiva,
      canal: canalEfetivo,
      metadata: {
        referencia: dados.referencia ?? null,
        referenciasAssistidas: this.referenciasAssistidasParaTracking(dados.referenciasAssistidas),
        atribuicao: this.formatarAtribuicaoPublica(atribuicao),
        afiliadoId: atribuicao?.parceiro.id ?? null,
        linkAfiliadoId: atribuicao?.link.id ?? null,
        subtotalEmKwanza: resumo.subtotalEmKwanza,
        taxaEntregaEmKwanza: resumo.taxaEntregaEmKwanza,
        totalEmKwanza: resumo.totalEmKwanza,
        entrega: resumo.entrega
      }
    });

    const cliente = await this.clientesCrm.criarCliente({
      negocioId: negocio.id,
      nome: dados.cliente.nome ?? null,
      telefone: dados.cliente.telefone ?? null,
      email: dados.cliente.email ?? null,
      origem: origemEfetiva,
      tags: ["checkout_site"],
      preferencias: {
        ultimoCheckout: {
          slugLoja: negocio.slugPublico,
          trackingId: dados.trackingId ?? null,
          canal: canalEfetivo,
          referencia: dados.referencia ?? null,
          referenciasAssistidas: this.referenciasAssistidasParaTracking(dados.referenciasAssistidas),
          atribuicao: this.formatarAtribuicaoPublica(atribuicao),
          afiliadoId: atribuicao?.parceiro.id ?? null,
          linkAfiliadoId: atribuicao?.link.id ?? null
        }
      },
      consentimentoMarketing: dados.cliente.consentimentoMarketing,
      consentimentoDados: dados.cliente.consentimentoDados
    });

    const pedido = await this.pedidos.criarPedido({
      negocioId: negocio.id,
      clienteNegocioId: cliente.id,
      itens: resumo.itens.map((item) => ({
        codigoPeca: item.peca.codigo,
        quantidade: item.quantidade,
        precoUnitarioEmKwanza: item.peca.precoEmKwanza
      })),
      origem: origemEfetiva,
      canal: canalEfetivo,
      taxaEntregaEmKwanza: resumo.taxaEntregaEmKwanza,
      enderecoEntrega: resumo.entrega.endereco,
      observacao: this.montarObservacaoCheckout(dados, resumo, atribuicao)
    });

    if (atribuicao && this.afiliados) {
      await this.afiliados.registrarComissaoEstimativa({
        negocioId: negocio.id,
        pedido,
        atribuicao
      });
    }

    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "PEDIDO_CRIADO",
      slugLoja: negocio.slugPublico,
      entidadeTipo: "PEDIDO",
      entidadeId: pedido.id,
      trackingId: dados.trackingId ?? null,
      origem: origemEfetiva,
      canal: canalEfetivo,
      metadata: {
        pedidoId: pedido.id,
        numero: pedido.numero,
        totalEmKwanza: pedido.totalEmKwanza,
        clienteNegocioId: cliente.id,
        referencia: dados.referencia ?? null,
        referenciasAssistidas: this.referenciasAssistidasParaTracking(dados.referenciasAssistidas),
        atribuicao: this.formatarAtribuicaoPublica(atribuicao),
        afiliadoId: atribuicao?.parceiro.id ?? null,
        linkAfiliadoId: atribuicao?.link.id ?? null
      }
    });

    return {
      pedido: {
        id: pedido.id,
        numero: pedido.numero,
        estado: pedido.estado,
        estadoPagamento: pedido.estadoPagamento,
        estadoEntrega: pedido.estadoEntrega
      },
      origem: pedido.origem,
      canal: pedido.canal,
      subtotalEmKwanza: pedido.subtotalEmKwanza,
      taxaEntregaEmKwanza: pedido.taxaEntregaEmKwanza,
      totalEmKwanza: pedido.totalEmKwanza,
      entrega: resumo.entrega,
      moeda: negocio.moeda,
      atribuicao: this.formatarAtribuicaoPublica(atribuicao),
      atribuicaoBloqueada
    };
  }

  async registrarCheckoutAbandonado(slug: string, dados: DadosCheckoutAbandonadoPublico) {
    if (!this.oportunidades) {
      throw new Error("Oportunidades de recuperação não configuradas.");
    }
    const negocio = await this.exigirLojaPublicada(slug);
    const resumo = await this.resolverResumoCheckout(negocio, dados.itens, dados.entrega);
    const telefone = normalizarTelefone(dados.cliente.telefone)?.local ?? dados.cliente.telefone ?? null;
    const email = dados.cliente.email ?? null;
    const cliente = await this.clientesCrm.criarCliente({
      negocioId: negocio.id,
      nome: dados.cliente.nome ?? null,
      telefone,
      email,
      origem: dados.origem,
      tags: ["checkout_abandonado"],
      preferencias: {
        ultimoCarrinhoAbandonado: {
          trackingId: dados.trackingId ?? null,
          slugLoja: negocio.slugPublico,
          itens: dados.itens,
          entrega: resumo.entrega,
          totalEmKwanza: resumo.totalEmKwanza,
          referencia: dados.referencia ?? null
        }
      },
      consentimentoMarketing: dados.cliente.consentimentoMarketing,
      consentimentoDados: dados.cliente.consentimentoDados
    });

    const existentes = await this.oportunidades.listar(negocio.id, {
      gatilho: "CARRINHO_ABANDONADO",
      estado: "ABERTA",
      limite: 10_000
    });
    const existente = existentes.find((oportunidade) => {
      const contexto = oportunidade.contexto;
      return (
        Boolean(dados.trackingId && contexto.trackingId === dados.trackingId) ||
        Boolean(telefone && oportunidade.clienteTelefone === telefone && contexto.slugLoja === negocio.slugPublico)
      );
    });
    if (existente) {
      return { oportunidade: existente, cliente, duplicado: true };
    }

    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "CHECKOUT_INICIADO",
      slugLoja: negocio.slugPublico,
      entidadeTipo: "CHECKOUT",
      entidadeId: dados.trackingId ?? null,
      trackingId: dados.trackingId ?? null,
      origem: dados.origem,
      canal: dados.canal,
      metadata: {
        abandonado: true,
        clienteNegocioId: cliente.id,
        totalEmKwanza: resumo.totalEmKwanza,
        itens: dados.itens,
        referencia: dados.referencia ?? null
      }
    });

    const oportunidade = await this.oportunidades.criar({
      negocioId: negocio.id,
      gatilho: "CARRINHO_ABANDONADO",
      estado: "ABERTA",
      entidadeTipo: "checkout",
      entidadeId: dados.trackingId ?? cliente.id,
      clienteTelefone: cliente.telefone,
      valorEstimadoEmKwanza: resumo.totalEmKwanza,
      motivo: "Cliente iniciou checkout público, deixou contacto com consentimento e não concluiu compra.",
      observacao: dados.observacao ?? null,
      contexto: {
        trackingId: dados.trackingId ?? null,
        slugLoja: negocio.slugPublico,
        origem: dados.origem,
        canal: dados.canal,
        referencia: dados.referencia ?? null,
        clienteNegocioId: cliente.id,
        itens: dados.itens,
        entrega: resumo.entrega
      }
    });

    return { oportunidade, cliente, duplicado: false };
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

  private produtoAtendeFiltrosPublicos(peca: Peca, filtros: FiltrosProdutosPublicos): boolean {
    const busca = this.normalizarTexto(filtros.busca);
    if (busca) {
      const camposBusca = [
        peca.codigo,
        peca.sku,
        peca.nome,
        peca.descricao,
        peca.categoria,
        peca.colecao
      ].map((valor) => this.normalizarTexto(valor));

      if (!camposBusca.some((campo) => campo.includes(busca))) return false;
    }

    const categoria = this.normalizarTexto(filtros.categoria);
    if (categoria && !this.normalizarTexto(peca.categoria).includes(categoria)) return false;

    const colecao = this.normalizarTexto(filtros.colecao);
    if (colecao && !this.normalizarTexto(peca.colecao).includes(colecao)) return false;

    const estadoStock = this.normalizarTexto(filtros.estadoStock);
    if (estadoStock && this.normalizarTexto(peca.estadoStock) !== estadoStock) return false;

    return true;
  }

  private filtrosPublicosAplicados(filtros: FiltrosProdutosPublicos) {
    const limite = filtros.limite ? Math.max(1, Math.min(filtros.limite, 500)) : undefined;
    return {
      ...(filtros.busca ? { busca: filtros.busca } : {}),
      ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
      ...(filtros.colecao ? { colecao: filtros.colecao } : {}),
      ...(filtros.estadoStock ? { estadoStock: filtros.estadoStock } : {}),
      ...(limite ? { limite } : {})
    };
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
      precoPromocionalEmKwanza: peca.vitrine.precoPromocionalEmKwanza,
      quantidade: peca.quantidade,
      fotos: peca.fotos,
      variantes: peca.variantes,
      vitrine: peca.vitrine,
      estadoStock: peca.estadoStock,
      disponivel: this.pecaVendavel(peca)
    };
  }

  private montarVitrinePublica<T extends { codigo: string; vitrine: Peca["vitrine"] }>(produtos: T[]) {
    const porSelo = (selo: Peca["vitrine"]["selos"][number]) =>
      produtos
        .filter((produto) => produto.vitrine.selos.includes(selo))
        .sort((a, b) => a.vitrine.prioridade - b.vitrine.prioridade || a.codigo.localeCompare(b.codigo, "pt-AO", { numeric: true }))
        .slice(0, 20);

    return {
      destaques: porSelo("DESTAQUE"),
      promocoes: porSelo("PROMOCAO"),
      novidades: porSelo("NOVIDADE"),
      reposicoes: porSelo("REPOSICAO"),
      maisVendidos: porSelo("MAIS_VENDIDO"),
      kits: porSelo("KIT")
    };
  }

  private mapearSeoLoja(negocio: NegocioBizy, produtoDestaque?: Peca) {
    const nomeLoja = this.nomeLojaParaSeo(negocio);
    const titulo = `${nomeLoja} | Loja Bizy`;
    const descricao =
      this.texto(negocio.descricaoPublica) ??
      `Compra produtos de ${nomeLoja} com atendimento pelo WhatsApp.`;

    return this.montarSeoPublico({
      titulo,
      descricao,
      canonicalPath: `/lojas/${negocio.slugPublico}`,
      imagem: produtoDestaque?.fotos[0] ?? null
    });
  }

  private mapearSeoProduto(negocio: NegocioBizy, peca: Peca) {
    const nomeLoja = this.nomeLojaParaSeo(negocio);
    const titulo = `${peca.nome} | ${nomeLoja}`;
    const descricao = this.texto(peca.descricao) ?? `Compra ${peca.nome} na loja ${nomeLoja}.`;

    return this.montarSeoPublico({
      titulo,
      descricao,
      canonicalPath: `/lojas/${negocio.slugPublico}/produtos/${peca.codigo}`,
      imagem: peca.fotos[0] ?? null
    });
  }

  private montarSeoPublico(dados: {
    titulo: string;
    descricao: string;
    canonicalPath: string;
    imagem: string | null;
  }) {
    return {
      titulo: dados.titulo,
      descricao: dados.descricao,
      canonicalPath: dados.canonicalPath,
      imagem: dados.imagem,
      previewSocial: {
        whatsapp: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          imagem: dados.imagem,
          url: dados.canonicalPath
        },
        facebook: {
          openGraph: {
            title: dados.titulo,
            description: dados.descricao,
            image: dados.imagem,
            url: dados.canonicalPath,
            type: "website"
          }
        },
        instagram: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          imagem: dados.imagem,
          url: dados.canonicalPath
        },
        tiktok: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          imagem: dados.imagem,
          url: dados.canonicalPath
        },
        navegador: {
          title: dados.titulo,
          metaDescription: dados.descricao,
          canonicalPath: dados.canonicalPath,
          image: dados.imagem
        }
      }
    };
  }

  private nomeLojaParaSeo(negocio: NegocioBizy): string {
    return negocio.nomeComercial.replace(/^Loja de Loja\b/i, "Loja");
  }

  private async resolverResumoCheckout(
    negocio: NegocioBizy,
    itens: ItemCheckoutPublico[],
    entregaSolicitada: DadosEntregaCheckoutPublico
  ): Promise<ResumoCheckoutPublico> {
    const resolvidos: ResumoCheckoutPublico["itens"] = [];

    for (const item of itens) {
      const peca = await this.exigirProdutoVendavel(negocio, item.codigoPeca);
      if (item.quantidade > peca.quantidade) {
        throw new Error(
          `Stock insuficiente para produto #${peca.codigo}. Disponível para checkout público: ${peca.quantidade}.`
        );
      }

      resolvidos.push({
        ...item,
        peca,
        subtotalEmKwanza: peca.precoEmKwanza * item.quantidade
      });
    }

    const subtotalEmKwanza = resolvidos.reduce((total, item) => total + item.subtotalEmKwanza, 0);
    const entrega = this.calcularEntregaInterna(negocio, subtotalEmKwanza, entregaSolicitada);
    const taxaEntregaEmKwanza = entrega.taxaEmKwanza;

    return {
      itens: resolvidos,
      subtotalEmKwanza,
      entrega,
      taxaEntregaEmKwanza,
      totalEmKwanza: subtotalEmKwanza + taxaEntregaEmKwanza
    };
  }

  private calcularEntregaInterna(
    negocio: NegocioBizy,
    subtotalEmKwanza: number,
    entregaSolicitada: DadosEntregaCheckoutPublico
  ): EntregaCalculadaPublica {
    if (entregaSolicitada.tipo === "RETIRADA") {
      const retirada = this.objeto(negocio.entrega.retiradaNaLoja);
      const instrucoes = this.texto(retirada.instrucoes) ?? negocio.endereco ?? "Retirada combinada com a loja.";
      return {
        tipo: "RETIRADA",
        regra: "retirada",
        taxaEmKwanza: 0,
        prazo: this.texto(retirada.prazo) ?? null,
        descricao: instrucoes,
        endereco: `Retirada na loja: ${instrucoes}`
      };
    }

    const zona = this.encontrarZonaEntrega(negocio.entrega, entregaSolicitada);
    const taxaPadrao = this.numero(negocio.entrega.taxaPadraoEmKwanza) ?? 0;
    const entregaGratisAcimaDeKwanza = this.numero(negocio.entrega.entregaGratisAcimaDeKwanza);
    const taxaBase = zona?.taxaEmKwanza ?? taxaPadrao;
    const prazo = zona?.prazo ?? this.texto(negocio.entrega.prazoPadrao) ?? null;
    const entregaGratis = Boolean(entregaGratisAcimaDeKwanza && subtotalEmKwanza >= entregaGratisAcimaDeKwanza);
    const taxaEmKwanza = entregaGratis ? 0 : taxaBase;

    return {
      tipo: "ENTREGA",
      regra: entregaGratis ? "gratis" : zona ? "zona" : "padrao",
      taxaEmKwanza,
      prazo,
      descricao: entregaGratis
        ? "Entrega grátis aplicada pela regra da loja."
        : zona?.nome ?? "Entrega calculada pela configuração da loja.",
      endereco: this.montarEnderecoEntrega(entregaSolicitada)
    };
  }

  private encontrarZonaEntrega(
    configuracao: Record<string, unknown>,
    entrega: DadosEntregaCheckoutPublico
  ): { nome: string; taxaEmKwanza: number; prazo: string | null } | null {
    const zonas = Array.isArray(configuracao.zonas) ? configuracao.zonas : [];
    const candidatas = zonas
      .map((zona) => this.objeto(zona))
      .map((zona) => {
        const campos = ["provincia", "municipio", "bairro"] as const;
        const matches = campos.every((campo) => {
          const esperado = this.texto(zona[campo]);
          if (!esperado) return true;
          return this.normalizarTexto(esperado) === this.normalizarTexto(entrega[campo]);
        });
        const especificidade = campos.filter((campo) => this.texto(zona[campo])).length;
        const taxaEmKwanza = this.numero(zona.taxaEmKwanza);

        return matches && taxaEmKwanza !== null
          ? {
              nome: this.texto(zona.nome) ?? "Zona de entrega",
              taxaEmKwanza,
              prazo: this.texto(zona.prazo) ?? null,
              especificidade
            }
          : null;
      })
      .filter((zona): zona is NonNullable<typeof zona> => Boolean(zona))
      .sort((a, b) => b.especificidade - a.especificidade);

    const escolhida = candidatas[0];
    return escolhida
      ? {
          nome: escolhida.nome,
          taxaEmKwanza: escolhida.taxaEmKwanza,
          prazo: escolhida.prazo
        }
      : null;
  }

  private mapearResumoCheckout(negocio: NegocioBizy, resumo: ResumoCheckoutPublico) {
    return {
      subtotalEmKwanza: resumo.subtotalEmKwanza,
      taxaEntregaEmKwanza: resumo.taxaEntregaEmKwanza,
      totalEmKwanza: resumo.totalEmKwanza,
      moeda: negocio.moeda,
      entrega: resumo.entrega,
      itens: resumo.itens.map((item) => ({
        codigoPeca: item.peca.codigo,
        nomeProduto: item.peca.nome,
        quantidade: item.quantidade,
        precoUnitarioEmKwanza: item.peca.precoEmKwanza,
        subtotalEmKwanza: item.subtotalEmKwanza
      }))
    };
  }

  private montarMensagemWhatsApp(
    negocio: NegocioBizy,
    peca: Peca,
    dados: DadosCheckoutWhatsAppPublico,
    resumo: ResumoCheckoutPublico
  ): string {
    const variantes = Object.entries(dados.variante)
      .map(([nome, valor]) => `${nome}: ${valor}`)
      .join(", ");
    const linhas = [
      `Olá, ${negocio.nomeComercial}. Quero comprar:`,
      `Produto: ${peca.codigo} ${peca.nome}`,
      `Quantidade: ${dados.quantidade}`,
      `Preço unitário: ${this.formatarKwanza(peca.precoEmKwanza)}`,
      `Entrega estimada: ${this.formatarKwanza(resumo.taxaEntregaEmKwanza)}`,
      `Total estimado: ${this.formatarKwanza(resumo.totalEmKwanza)}`,
      variantes ? `Variante: ${variantes}` : null,
      `Origem: ${dados.origem}`
    ].filter(Boolean);

    return linhas.join("\n");
  }

  private montarObservacaoCheckout(
    dados: DadosCheckoutSitePublico,
    resumo: ResumoCheckoutPublico,
    atribuicao: AtribuicaoAfiliadoResolvida | null
  ): string | null {
    const contexto = [
      dados.observacao,
      `Checkout público. Origem: ${dados.origem}. Tracking: ${dados.trackingId ?? "sem_tracking"}.`,
      atribuicao ? `Atribuição: ${atribuicao.parceiro.codigo} via link ${atribuicao.link.codigo}.` : null,
      `Entrega: ${resumo.entrega.descricao}`
    ].filter(Boolean);

    return contexto.length ? contexto.join("\n") : null;
  }

  private resolverPoliticaAtribuicao(
    negocio: NegocioBizy,
    solicitada?: { modelo?: ModeloAtribuicaoComercial; janelaDias?: number }
  ): { modelo: ModeloAtribuicaoComercial; janelaDias: number | null } {
    const configuracao = this.objeto(negocio.entrega.atribuicao);
    const modeloConfigurado = this.modeloAtribuicao(this.texto(configuracao.modeloPadrao ?? configuracao.modelo));
    const janelaConfigurada = this.numero(configuracao.janelaDias ?? configuracao.janelaAtribuicaoDias);

    return {
      modelo: solicitada?.modelo ?? modeloConfigurado ?? "ULTIMO_TOQUE",
      janelaDias: solicitada?.janelaDias ?? janelaConfigurada
    };
  }

  private modeloAtribuicao(valor: string | null): ModeloAtribuicaoComercial | null {
    if (!valor) return null;
    const modelo = valor.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (
      modelo === "PRIMEIRO_TOQUE" ||
      modelo === "ULTIMO_TOQUE" ||
      modelo === "CONVERSAO_ASSISTIDA" ||
      modelo === "AJUSTE_MANUAL"
    ) {
      return modelo;
    }
    return null;
  }

  private formatarAtribuicaoPublica(atribuicao: AtribuicaoAfiliadoResolvida | null) {
    if (!atribuicao) return null;

    return {
      modelo: atribuicao.modelo,
      janelaDias: atribuicao.janelaDias,
      principal: {
        parceiroId: atribuicao.parceiro.id,
        codigoParceiro: atribuicao.parceiro.codigo,
        linkId: atribuicao.link.id,
        codigoLink: atribuicao.link.codigo,
        canal: atribuicao.link.canal,
        capturadoEm: atribuicao.capturadoEm
      },
      assistencias: atribuicao.assistencias
    };
  }

  private referenciasAssistidasParaTracking(referencias?: Array<string | ReferenciaAtribuicaoComercial>) {
    return (referencias ?? []).map((referencia) => {
      if (typeof referencia === "string") return { codigo: referencia };
      return {
        codigo: referencia.codigo,
        capturadoEm: referencia.capturadoEm ?? null
      };
    });
  }

  private montarEnderecoEntrega(entrega: DadosEntregaCheckoutPublico): string | null {
    return (
      [
        entrega.endereco,
        entrega.bairro ? `Bairro ${entrega.bairro}` : null,
        entrega.municipio,
        entrega.provincia
      ]
        .filter(Boolean)
        .join(", ") || null
    );
  }

  private formatarKwanza(valor: number): string {
    return `${valor.toLocaleString("pt-AO").replace(/\u00a0/g, " ")} Kz`;
  }

  private normalizarSlug(slug: string): string {
    return slug.trim().toLowerCase();
  }

  private normalizarTelefoneWhatsApp(telefone: string): string {
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length === 9) return `244${digitos}`;
    return digitos;
  }

  private objeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }

  private texto(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }

  private numero(valor: unknown): number | null {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? Math.trunc(numero) : null;
  }

  private normalizarTexto(valor: unknown): string {
    return this.texto(valor)?.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") ?? "";
  }

  private async registrarTrackingSilencioso(dados: NovoEventoTrackingComercial): Promise<void> {
    try {
      await this.tracking.registrarEvento(dados);
    } catch {
      // Tracking não deve derrubar a experiência pública de compra.
    }
  }

  private async registrarEventoOperacionalSilencioso(dados: Parameters<RepositorioEventosOperacionais["registrar"]>[0]) {
    try {
      await this.eventosOperacionais?.registrar(dados);
    } catch {
      // O tracking público não deve falhar checkout por indisponibilidade de auditoria operacional.
    }
  }
}
