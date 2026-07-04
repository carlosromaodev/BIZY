import { createHash } from "node:crypto";
import type {
  RepositorioAutenticacao,
  RepositorioEventosOperacionais,
  RepositorioFunilComercial,
  RepositorioOportunidadesRecuperacao,
  RepositorioPecas,
  RepositorioSeguidoresLoja,
  RepositorioTrackingComercial
} from "../../../dominio/repositorios/contratos.js";
import { normalizarEmail, normalizarTelefone } from "../../../dominio/servicos/normalizarContato.js";
import type {
  DadosPublicacaoLoja,
  EtapaFunilComercial,
  EventoTrackingComercial,
  NegocioBizy,
  NovoEventoTrackingComercial,
  Peca
} from "../../../dominio/tipos.js";
import type { GestaoClientesCrmUseCase } from "../../../use-case/GestaoClientesCrmUseCase.js";
import type {
  AtribuicaoAfiliadoResolvida,
  GestaoAfiliadosUseCase,
  ModeloAtribuicaoComercial,
  ReferenciaAtribuicaoComercial
} from "../../../use-case/GestaoAfiliadosUseCase.js";
import type { GestaoPedidosUseCase } from "../../../use-case/GestaoPedidosUseCase.js";
import type { GestaoGovernancaCrmUseCase } from "../../../use-case/GestaoGovernancaCrmUseCase.js";
import type { GestaoTarefasOperacionaisUseCase } from "../../../use-case/GestaoTarefasOperacionaisUseCase.js";

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
  referencia?: string | null;
  referenciasAssistidas?: Array<string | ReferenciaAtribuicaoComercial>;
  atribuicao?: {
    modelo?: ModeloAtribuicaoComercial;
    janelaDias?: number;
  };
  origem: string;
  entrega?: DadosEntregaCheckoutPublico;
}

interface ItemCheckoutPublico {
  codigoPeca: string;
  quantidade: number;
}

interface DadosEntregaCheckoutPublico {
  tipo: "ENTREGA" | "RETIRADA" | "ORCAMENTO";
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
  idempotencyKey?: string | null;
  referencia?: string | null;
  referenciasAssistidas?: Array<string | ReferenciaAtribuicaoComercial>;
  atribuicao?: {
    modelo?: ModeloAtribuicaoComercial;
    janelaDias?: number;
  };
  origem: string;
  canal: string;
  observacao?: string | null;
  metodoPagamento?: string | null;
  comprovativoPagamentoUrl?: string | null;
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

interface DadosFormularioLeadPublico {
  nome: string;
  telefone: string;
  email?: string | null;
  produtoInteresse?: string | null;
  mensagem?: string | null;
  consentimentoDados: boolean;
  consentimentoMarketing?: boolean;
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
}

interface ResumoCheckoutPublico {
  itens: Array<ItemCheckoutPublico & { peca: Peca; subtotalEmKwanza: number }>;
  subtotalEmKwanza: number;
  entrega: EntregaCalculadaPublica;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
}

interface EntregaCalculadaPublica {
  tipo: "ENTREGA" | "RETIRADA" | "ORCAMENTO";
  regra: "zona" | "padrao" | "gratis" | "retirada" | "orcamento";
  taxaEmKwanza: number;
  prazo: string | null;
  descricao: string;
  endereco: string | null;
}

interface ConsentimentoServerSide {
  dados?: boolean;
  marketing?: boolean;
  telefone?: string | null;
  email?: string | null;
  origem?: string | null;
}

interface ProviderServerSideConfigurado {
  provider: "meta_capi" | string;
  pixelId: string;
  credencialRef: string;
  eventos: string[];
  exigirConsentimentoMarketing: boolean;
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
    private readonly eventosOperacionais?: RepositorioEventosOperacionais,
    private readonly funil?: RepositorioFunilComercial,
    private readonly seguidoresLoja?: RepositorioSeguidoresLoja,
    private readonly gestaoGovernanca?: GestaoGovernancaCrmUseCase,
    private readonly gestaoTarefas?: GestaoTarefasOperacionaisUseCase
  ) {}

  async publicarLoja(negocioId: string, dados: DadosPublicacaoLoja) {
    const slug = this.normalizarSlug(dados.slug);
    if (this.slugReservado(slug)) {
      throw new Error(`Slug público ${slug} já existe como slug reservado do Bizy.`);
    }

    return this.autenticacao.atualizarPublicacaoLoja(negocioId, {
      ...dados,
      slug
    });
  }

  async autorizarDominioPublico(dominio: string, dominioBase: string): Promise<{ autorizado: boolean; slug?: string }> {
    const slug = this.extrairSlugSubdominio(dominio, dominioBase);
    if (!slug) {
      return { autorizado: false };
    }

    const negocio = await this.autenticacao.buscarNegocioPorSlugPublico(slug);
    if (!negocio?.lojaPublicadaEm) {
      return { autorizado: false };
    }

    return { autorizado: true, slug };
  }

  async obterLoja(slug: string, tracking?: OpcoesTrackingPublico, filtros: FiltrosProdutosPublicos = {}) {
    const negocio = await this.exigirLojaPublicada(slug);
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const produtosVendaveis = (await this.pecas.listar(negocio.id)).filter((peca) => this.pecaVendavel(peca));
    const produtos = produtosVendaveis
      .filter((peca) => this.produtoAtendeFiltrosPublicos(peca, filtros))
      .slice(0, limite);
    const colecoes = this.montarColecoesPublicas(negocio, produtosVendaveis);

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

    const totalSeguidores = await this.seguidoresLoja?.contarSeguidores(negocio.id) ?? 0;
    const produtosPublicos = produtos.map((peca) => this.mapearProdutoPublico(peca));

    return {
      loja: this.mapearLojaPublica(negocio),
      perfil: this.mapearPerfilPublico(negocio, produtosVendaveis, colecoes, totalSeguidores),
      colecoes,
      market: this.mapearChamadaMarket(negocio, produtosVendaveis),
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
    const politicaAtribuicao = this.resolverPoliticaAtribuicao(negocio, dados.atribuicao);
    const atribuicao = await this.afiliados?.resolverAtribuicao(negocio.id, {
      referencia: dados.referencia,
      referenciasAssistidas: dados.referenciasAssistidas,
      modelo: politicaAtribuicao.modelo,
      janelaDias: politicaAtribuicao.janelaDias
    }) ?? null;
    const origemEfetiva = atribuicao ? `afiliado:${atribuicao.parceiro.codigo}` : dados.origem;
    const atribuicaoPublica = this.formatarAtribuicaoPublica(atribuicao);
    const mensagem = this.montarMensagemWhatsApp(negocio, peca, dados, resumo, origemEfetiva, atribuicao);
    await this.registrarTrackingSilencioso({
      negocioId: negocio.id,
      tipo: "WHATSAPP_CLICK",
      slugLoja: negocio.slugPublico,
      codigoProduto: peca.codigo,
      entidadeTipo: "PRODUTO",
      entidadeId: peca.codigo,
      trackingId: dados.trackingId ?? null,
      origem: origemEfetiva,
      canal: "whatsapp",
      metadata: {
        quantidade: dados.quantidade,
        variante: dados.variante,
        referencia: dados.referencia ?? null,
        referenciasAssistidas: this.referenciasAssistidasParaTracking(dados.referenciasAssistidas),
        atribuicao: atribuicaoPublica,
        afiliadoId: atribuicao?.parceiro.id ?? null,
        linkAfiliadoId: atribuicao?.link.id ?? null,
        entrega: resumo.entrega,
        totalEmKwanza: resumo.totalEmKwanza
      }
    });

    return {
      telefone,
      mensagem,
      origem: origemEfetiva,
      canal: "whatsapp",
      atribuicao: atribuicaoPublica,
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

    if (dados.idempotencyKey && this.eventosOperacionais) {
      const chave = `checkout:${negocio.id}:${dados.idempotencyKey}`;
      const eventos = await this.eventosOperacionais.listar(negocio.id, {
        topico: "checkout",
        tipo: "CHECKOUT_CONCLUIDO"
      });
      const eventoExistente = eventos.find((e) => e.idempotencyKey === chave);
      if (eventoExistente) {
        const pedidoId = (eventoExistente.payload as Record<string, unknown> | undefined)?.pedidoId as string | undefined;
        if (pedidoId) {
          const pedidoExistente = await this.pedidos.obterPedido(pedidoId, negocio.id);
          if (pedidoExistente) {
            return {
              pedido: {
                id: pedidoExistente.pedido.id,
                numero: pedidoExistente.pedido.numero,
                estado: pedidoExistente.pedido.estado,
                estadoPagamento: pedidoExistente.pedido.estadoPagamento,
                estadoEntrega: pedidoExistente.pedido.estadoEntrega
              },
              origem: pedidoExistente.pedido.origem,
              canal: pedidoExistente.pedido.canal,
              subtotalEmKwanza: pedidoExistente.pedido.subtotalEmKwanza,
              taxaEntregaEmKwanza: pedidoExistente.pedido.taxaEntregaEmKwanza,
              totalEmKwanza: pedidoExistente.pedido.totalEmKwanza,
              entrega: resumo.entrega,
              moeda: negocio.moeda,
              atribuicao: this.formatarAtribuicaoPublica(atribuicao),
              atribuicaoBloqueada,
              duplicado: true
            };
          }
        }
      }
    }

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
      comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null,
      observacao: this.montarObservacaoCheckout(dados, resumo, atribuicao)
    });

    if (dados.idempotencyKey && this.eventosOperacionais) {
      await this.registrarEventoOperacionalSilencioso({
        negocioId: negocio.id,
        topico: "checkout",
        tipo: "CHECKOUT_CONCLUIDO",
        entidadeTipo: "PEDIDO",
        entidadeId: pedido.id,
        idempotencyKey: `checkout:${negocio.id}:${dados.idempotencyKey}`,
        estado: "PROCESSADO",
        payload: { pedidoId: pedido.id, numero: pedido.numero }
      });
    }

    if (atribuicao && this.afiliados) {
      await this.afiliados.registrarComissaoEstimativa({
        negocioId: negocio.id,
        pedido,
        atribuicao
      });
    }

    const eventoPedidoCriado = await this.registrarTrackingSilencioso({
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
        estado: pedido.estado,
        estadoPagamento: pedido.estadoPagamento,
        totalEmKwanza: pedido.totalEmKwanza,
        clienteNegocioId: cliente.id,
        referencia: dados.referencia ?? null,
        referenciasAssistidas: this.referenciasAssistidasParaTracking(dados.referenciasAssistidas),
        atribuicao: this.formatarAtribuicaoPublica(atribuicao),
        afiliadoId: atribuicao?.parceiro.id ?? null,
        linkAfiliadoId: atribuicao?.link.id ?? null
      }
    });
    await this.prepararEventosServerSide(negocio, eventoPedidoCriado, {
      dados: dados.cliente.consentimentoDados,
      marketing: dados.cliente.consentimentoMarketing,
      telefone: dados.cliente.telefone ?? null,
      email: dados.cliente.email ?? null,
      origem: "checkout_site"
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

  async registrarFormularioLead(slug: string, dados: DadosFormularioLeadPublico) {
    const negocio = await this.exigirLojaPublicada(slug);
    const nome = this.texto(dados.nome);
    const telefoneNormalizado = normalizarTelefone(dados.telefone);
    const email = normalizarEmail(dados.email);
    if (!nome) {
      throw new Error("O nome é obrigatório para submeter o formulário.");
    }
    if (!telefoneNormalizado && !email) {
      throw new Error("Forneça telefone ou email para submeter o formulário.");
    }

    const cliente = await this.clientesCrm.criarCliente({
      negocioId: negocio.id,
      nome,
      telefone: telefoneNormalizado?.local ?? null,
      email,
      origem: dados.origem ?? "formulario_publico",
      tags: ["lead-formulario"],
      dadosCaptura: {
        formularioSlug: negocio.slugPublico,
        produtoInteresse: this.texto(dados.produtoInteresse),
        mensagem: this.texto(dados.mensagem),
        trackingId: dados.trackingId ?? null,
        canal: dados.canal ?? "formulario-publico"
      },
      consentimentoMarketing: dados.consentimentoMarketing ?? false,
      consentimentoDados: dados.consentimentoDados,
      ultimaInteracaoEm: new Date()
    });

    await this.registrarEventoOperacionalSilencioso({
      negocioId: negocio.id,
      topico: "crm_apoio",
      tipo: "FORMULARIO_SUBMETIDO",
      entidadeTipo: "cliente",
      entidadeId: cliente.id,
      idempotencyKey: `formulario:${negocio.id}:${this.normalizarTexto(cliente.telefone ?? cliente.email ?? cliente.id)}`,
      estado: "PROCESSADO",
      payload: {
        formularioSlug: negocio.slugPublico,
        tagAutomatica: "lead-formulario",
        clienteId: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        produtoInteresse: this.texto(dados.produtoInteresse),
        mensagem: this.texto(dados.mensagem)
      }
    });

    await this.criarTarefaLeadFormulario(negocio, cliente, dados);

    try {
      await this.registrarMovimentoFunilPublico(negocio.id, {
        entidadeTipo: "lead",
        entidadeId: cliente.id,
        etapaNova: "LEAD",
        motivo: "Lead captado pelo formulário público.",
        origem: "formulario_publico",
        contexto: {
          formularioSlug: negocio.slugPublico,
          clienteId: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
          produtoInteresse: this.texto(dados.produtoInteresse)
        }
      });
    } catch {
      // A experiência pública não deve falhar por indisponibilidade do funil operacional.
    }

    return {
      clienteId: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      tagAutomatica: "lead-formulario"
    };
  }

  private sanitizarMetadataTrackingBackend(metadata?: Record<string, unknown>): Record<string, unknown> {
    if (!metadata) return {};
    const camposSensiveis = [
      "nome", "nomeCompleto", "telefone", "email", "endereco",
      "morada", "cpf", "nif", "bilhete", "documento",
      "password", "senha", "token", "cookie"
    ];
    const resultado: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(metadata)) {
      const chaveNorm = chave.toLowerCase();
      if (camposSensiveis.some((s) => chaveNorm.includes(s))) continue;
      resultado[chave] = valor;
    }
    return resultado;
  }

  async registrarEventoPublico(slug: string, dados: Omit<NovoEventoTrackingComercial, "negocioId">) {
    const negocio = await this.exigirLojaPublicada(slug);
    const dadosSanitizados = {
      ...dados,
      metadata: this.sanitizarMetadataTrackingBackend(dados.metadata)
    };
    const eventoExistente = await this.buscarEventoTrackingIdempotente(negocio.id, dadosSanitizados);
    if (eventoExistente) return eventoExistente;

    const evento = await this.tracking.registrarEvento({
      ...dadosSanitizados,
      negocioId: negocio.id,
      slugLoja: negocio.slugPublico
    });
    await this.registrarMovimentosFunilTrackingSilencioso(evento);
    await this.prepararEventosServerSide(negocio, evento, {
      dados: dados.metadata?.consentimentoDados === true,
      marketing: dados.metadata?.consentimentoMarketing === true,
      origem: "tracking_publico"
    });
    return evento;
  }

  private async buscarEventoTrackingIdempotente(
    negocioId: string,
    dados: Omit<NovoEventoTrackingComercial, "negocioId">
  ): Promise<EventoTrackingComercial | null> {
    const chave = this.chaveIdempotenciaTracking(dados);
    if (!chave) return null;

    const eventos = await this.tracking.listarEventos(negocioId, {
      tipo: dados.tipo,
      limite: 100_000
    });

    return eventos.find((evento) => this.chaveIdempotenciaTracking(evento) === chave) ?? null;
  }

  async resumirTracking(negocioId: string) {
    return this.tracking.resumirEventos(negocioId);
  }

  async obterCatalogoPublico(slug: string, catalogoId: string) {
    const negocio = await this.exigirLojaPublicada(slug);
    const experiencia = this.extrairExperiencia(negocio);
    const catalogos: Array<{ id: string; nome: string; descricao?: string | null; criterio: string; valor?: string | null }> =
      Array.isArray(experiencia.catalogosPersonalizados) ? experiencia.catalogosPersonalizados : [];
    const catalogo = catalogos.find((c) => c.id === catalogoId);
    if (!catalogo) {
      throw new Error(`Catálogo "${catalogoId}" não encontrado na loja ${slug}.`);
    }

    const produtosVendaveis = (await this.pecas.listar(negocio.id)).filter((peca) => this.pecaVendavel(peca));
    const produtosFiltrados = produtosVendaveis
      .filter((peca) => this.produtoAtendeCriterio(peca, catalogo.criterio, catalogo.valor))
      .slice(0, 200);

    return {
      catalogo: {
        id: catalogo.id,
        nome: catalogo.nome,
        descricao: catalogo.descricao ?? null,
        criterio: catalogo.criterio,
        totalProdutos: produtosFiltrados.length
      },
      loja: this.mapearLojaPublica(negocio),
      produtos: produtosFiltrados.map((peca) => this.mapearProdutoPublico(peca)),
      seo: {
        titulo: `${catalogo.nome} — ${negocio.nomeComercial}`,
        descricao: catalogo.descricao ?? `Catálogo ${catalogo.nome} de ${negocio.nomeComercial}`,
        slug: negocio.slugPublico
      }
    };
  }

  async exigirLojaPublicadaExterna(slug: string): Promise<NegocioBizy> {
    return this.exigirLojaPublicada(slug);
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
    return !peca.arquivadaEm && peca.quantidade > 0 && peca.estado !== "ESGOTADA" && peca.estado !== "VENDIDA" && peca.vitrine.visibilidade !== "campanhas";
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

  private produtoAtendeCriterio(peca: Peca, criterio: string, valor?: string | null): boolean {
    if (criterio === "todos" || !criterio) return true;
    if (!valor) return true;

    if (criterio === "categoria") {
      return this.normalizarTexto(peca.categoria).includes(this.normalizarTexto(valor));
    }
    if (criterio === "colecao") {
      return this.normalizarTexto(peca.colecao).includes(this.normalizarTexto(valor));
    }
    if (criterio === "busca") {
      return this.produtoAtendeFiltrosPublicos(peca, { busca: valor });
    }
    return true;
  }

  private extrairExperiencia(negocio: NegocioBizy): Record<string, unknown> {
    const entrega = this.objeto(negocio.entrega);
    const lojaDigital = this.objeto(entrega.lojaDigital);
    return this.objeto(lojaDigital.experiencia);
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
    const entrega = this.objeto(negocio.entrega);
    const lojaDigital = this.objeto(entrega.lojaDigital);
    const tema = this.objeto(entrega.temaLoja);
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
      moeda: negocio.moeda,
      corPrimaria: this.texto(tema.corPrimaria) ?? "#111111",
      logoUrl: this.texto(tema.logoUrl),
      capaUrl: this.texto(tema.capaUrl),
      whatsapp: negocio.whatsapp ?? negocio.telefone,
      metodosPagamento: negocio.metodosPagamento ?? [],
      experiencia: this.normalizarExperienciaLoja(lojaDigital.experiencia)
    };
  }

  private mapearProdutoPublico(peca: Peca) {
    const selosAutomaticos = this.gerarSelosAutomaticos(peca);
    const selosCombinados = [...new Set([...peca.vitrine.selos, ...selosAutomaticos])];

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
      vitrine: { ...peca.vitrine, selos: selosCombinados },
      estadoStock: peca.estadoStock,
      disponivel: this.pecaVendavel(peca)
    };
  }

  private gerarSelosAutomaticos(peca: Peca): Peca["vitrine"]["selos"] {
    const selos: Peca["vitrine"]["selos"] = [];
    if (peca.vitrine.precoPromocionalEmKwanza && peca.vitrine.precoPromocionalEmKwanza < peca.precoEmKwanza) {
      if (!peca.vitrine.selos.includes("PROMOCAO")) selos.push("PROMOCAO");
    }
    return selos;
  }

  private mapearPerfilPublico(
    negocio: NegocioBizy,
    produtos: Peca[],
    colecoes: Array<{ id: string; nome: string; tipo: string; totalProdutos: number; url: string }>,
    totalSeguidores = 0
  ) {
    const entrega = this.objeto(negocio.entrega);
    const tema = this.objeto(entrega.temaLoja);
    const corAcento = this.texto(tema.corPrimaria) ?? "#111111";
    const urlLoja = `/lojas/${negocio.slugPublico}`;

    return {
      slug: negocio.slugPublico,
      nomeComercial: negocio.nomeComercial,
      bio: negocio.descricaoPublica,
      segmento: negocio.segmento,
      tipo: negocio.tipo,
      avatarUrl: this.texto(tema.logoUrl),
      capaUrl: this.texto(tema.capaUrl),
      corAcento,
      localizacao: this.montarLocalizacaoPublica(negocio),
      contadores: {
        seguidores: totalSeguidores,
        seguindo: 0,
        produtos: produtos.length,
        colecoes: colecoes.length
      },
      selos: this.montarSelosPublicos(negocio),
      acoes: {
        seguirDisponivel: true,
        contactoDisponivel: Boolean(negocio.whatsapp ?? negocio.telefone),
        checkoutDisponivel: produtos.length > 0,
        urlLoja,
        urlMarket: `/market?loja=${encodeURIComponent(negocio.slugPublico ?? "")}`
      }
    };
  }

  private montarColecoesPublicas(negocio: NegocioBizy, produtos: Peca[]) {
    const slug = negocio.slugPublico ?? "";
    const entrega = this.objeto(negocio.entrega);
    const lojaDigital = this.objeto(entrega.lojaDigital);
    const experiencia = this.objeto(lojaDigital.experiencia);
    const operacao = this.objeto(experiencia.operacao);
    const catalogo = this.objeto(operacao.catalogo);
    const mensagens = this.normalizarMensagensColecao(catalogo.mensagensColecao);
    return [
      ...this.montarColecoesPorCampo(slug, produtos, "colecao", "colecao", mensagens),
      ...this.montarColecoesPorCampo(slug, produtos, "categoria", "categoria", mensagens)
    ];
  }

  private montarColecoesPorCampo(
    slug: string,
    produtos: Peca[],
    campo: "colecao" | "categoria",
    tipo: "colecao" | "categoria",
    mensagens: Record<string, string> = {}
  ) {
    const grupos = new Map<string, Peca[]>();
    for (const produto of produtos) {
      const nome = this.texto(produto[campo]);
      if (!nome) continue;
      grupos.set(nome, [...(grupos.get(nome) ?? []), produto]);
    }

    return [...grupos.entries()]
      .map(([nome, itens]) => ({
        id: `${tipo}-${this.normalizarIdPublico(nome)}`,
        nome,
        tipo,
        totalProdutos: itens.length,
        imagem: itens.find((item) => item.fotos.length > 0)?.fotos[0] ?? null,
        mensagem: mensagens[nome] ?? null,
        url: `/lojas/${slug}?${tipo}=${encodeURIComponent(nome)}`
      }))
      .sort((a, b) => b.totalProdutos - a.totalProdutos || a.nome.localeCompare(b.nome, "pt-AO", { sensitivity: "base" }))
      .slice(0, 24);
  }

  private mapearChamadaMarket(negocio: NegocioBizy, produtos: Peca[]) {
    const categoriaPrincipal = this.categoriaPrincipal(produtos);
    const slug = negocio.slugPublico ?? "";
    const query = categoriaPrincipal
      ? `categoria=${encodeURIComponent(categoriaPrincipal)}&lojaOrigem=${encodeURIComponent(slug)}`
      : `lojaOrigem=${encodeURIComponent(slug)}`;

    return {
      disponivel: produtos.length > 0,
      label: "Explorar similares no Bizy Market",
      url: `/market?${query}`,
      categoriaPrincipal
    };
  }

  private montarSelosPublicos(negocio: NegocioBizy) {
    const entrega = this.objeto(negocio.entrega);
    const pagamentosAtivos = negocio.metodosPagamento.length > 0;
    const entregaAtiva = this.objeto(entrega.retiradaNaLoja).ativa === true || entrega.entregaAtiva !== false;

    return [
      negocio.lojaPublicadaEm
        ? {
            id: "loja-publicada",
            label: "Loja publicada",
            tipo: "confianca"
          }
        : null,
      entregaAtiva
        ? {
            id: "entrega-ativa",
            label: "Entrega ativa",
            tipo: "operacao"
          }
        : null,
      pagamentosAtivos
        ? {
            id: "pagamento-configurado",
            label: "Pagamento configurado",
            tipo: "operacao"
          }
        : null
    ].filter((selo): selo is { id: string; label: string; tipo: string } => Boolean(selo));
  }

  private categoriaPrincipal(produtos: Peca[]): string | null {
    const totais = new Map<string, number>();
    for (const produto of produtos) {
      const categoria = this.texto(produto.categoria);
      if (!categoria) continue;
      totais.set(categoria, (totais.get(categoria) ?? 0) + 1);
    }

    return [...totais.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-AO", { sensitivity: "base" }))[0]?.[0] ?? null;
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
    if (entregaSolicitada.tipo === "ORCAMENTO") {
      const orcamento = this.objeto(negocio.entrega.orcamentoHumano ?? negocio.entrega.entregaSobOrcamento);
      const descricao =
        this.texto(orcamento.instrucoes) ??
        this.texto(negocio.entrega.instrucoesOrcamento) ??
        "Entrega sob orçamento humano. A loja confirma o valor antes do pagamento.";
      const endereco = this.montarEnderecoEntrega(entregaSolicitada);
      return {
        tipo: "ORCAMENTO",
        regra: "orcamento",
        taxaEmKwanza: 0,
        prazo: this.texto(orcamento.prazo) ?? null,
        descricao,
        endereco: endereco ? `Entrega sob orçamento: ${endereco}` : "Entrega sob orçamento"
      };
    }

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
    resumo: ResumoCheckoutPublico,
    origemEfetiva: string,
    atribuicao: AtribuicaoAfiliadoResolvida | null
  ): string {
    const variantes = Object.entries(dados.variante)
      .map(([nome, valor]) => `${nome}: ${valor}`)
      .join(", ");
    const linhas = [
      `Olá, ${negocio.nomeComercial}. Quero comprar:`,
      `Produto: ${peca.codigo} ${peca.nome}`,
      `Quantidade: ${dados.quantidade}`,
      `Preço unitário: ${this.formatarKwanza(peca.precoEmKwanza)}`,
      resumo.entrega.regra === "orcamento"
        ? `Entrega: ${resumo.entrega.descricao}`
        : `Entrega estimada: ${this.formatarKwanza(resumo.taxaEntregaEmKwanza)}`,
      `Total estimado: ${this.formatarKwanza(resumo.totalEmKwanza)}`,
      variantes ? `Variante: ${variantes}` : null,
      `Origem: ${origemEfetiva}`,
      atribuicao ? `Referência: ${atribuicao.link.codigo}` : null
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
      dados.metodoPagamento ? `Método de pagamento: ${dados.metodoPagamento}.` : null,
      dados.comprovativoPagamentoUrl ? `Comprovativo: ${dados.comprovativoPagamentoUrl}` : null,
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
        destinoTipo: atribuicao.link.destinoTipo,
        destinoId: atribuicao.link.destinoId,
        canal: atribuicao.link.canal,
        metadata: atribuicao.link.metadata,
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

  private montarLocalizacaoPublica(negocio: NegocioBizy): string | null {
    return [negocio.municipio, negocio.provincia].filter((item): item is string => Boolean(this.texto(item))).join(", ") || null;
  }

  private normalizarSlug(slug: string): string {
    return slug.trim().toLowerCase();
  }

  private extrairSlugSubdominio(dominio: string, dominioBase: string): string | null {
    const host = this.normalizarDominio(dominio);
    const base = this.normalizarDominio(dominioBase);
    if (!host || !base || host === base || !host.endsWith(`.${base}`)) return null;

    const subdominio = host.slice(0, -(base.length + 1));
    if (!subdominio || subdominio.includes(".") || this.slugReservado(subdominio)) return null;

    const slug = this.normalizarSlug(subdominio);
    return slug === subdominio ? slug : null;
  }

  private normalizarDominio(valor: string): string {
    return valor
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split(":")[0]
      ?.replace(/\.$/, "") ?? "";
  }

  private slugReservado(slug: string): boolean {
    return new Set([
      "admin",
      "api",
      "app",
      "assets",
      "auth",
      "checkout",
      "dashboard",
      "evolution",
      "evolution-manager",
      "market",
      "n8n",
      "painel",
      "shop",
      "static",
      "suporte",
      "wa",
      "www"
    ]).has(slug);
  }

  private normalizarIdPublico(valor: string): string {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "catalogo";
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

  private chaveIdempotenciaTracking(
    dados: Pick<
      NovoEventoTrackingComercial | EventoTrackingComercial,
      "tipo" | "entidadeTipo" | "entidadeId" | "codigoProduto" | "trackingId" | "metadata"
    >
  ): string | null {
    const metadata = this.objeto(dados.metadata);
    const chaveExplicita =
      this.texto(metadata.idempotencyKey) ??
      this.texto(metadata.idempotenciaKey) ??
      this.texto(metadata.chaveIdempotencia);
    if (chaveExplicita) return this.normalizarTexto(`${dados.tipo}:key:${chaveExplicita}`);

    const entidadeId = this.texto(dados.entidadeId);
    if (!entidadeId) return null;

    return [
      dados.tipo,
      this.texto(dados.entidadeTipo) ?? "sem-entidade",
      entidadeId,
      this.texto(dados.trackingId) ?? "sem-tracking",
      this.texto(dados.codigoProduto) ?? "sem-produto"
    ]
      .map((valor) => this.normalizarTexto(valor))
      .join("|");
  }

  private async registrarTrackingSilencioso(dados: NovoEventoTrackingComercial): Promise<EventoTrackingComercial | null> {
    try {
      const evento = await this.tracking.registrarEvento(dados);
      await this.registrarMovimentosFunilTrackingSilencioso(evento);
      return evento;
    } catch {
      // Tracking não deve derrubar a experiência pública de compra.
      return null;
    }
  }

  private async registrarMovimentosFunilTrackingSilencioso(evento: EventoTrackingComercial): Promise<void> {
    if (!this.funil) return;

    try {
      for (const movimento of this.movimentosFunilPorEventoTracking(evento)) {
        await this.registrarMovimentoFunilPublico(evento.negocioId, movimento);
      }
    } catch {
      // Funil operacional não deve derrubar a experiência pública de navegação ou compra.
    }
  }

  private movimentosFunilPorEventoTracking(evento: EventoTrackingComercial): Array<{
    entidadeTipo: string;
    entidadeId: string;
    etapaNova: EtapaFunilComercial;
    motivo: string;
    origem: string;
    contexto: Record<string, unknown>;
  }> {
    const contexto = {
      trackingEventoId: evento.id,
      tipoEvento: evento.tipo,
      slugLoja: evento.slugLoja,
      codigoProduto: evento.codigoProduto,
      trackingId: evento.trackingId,
      origem: evento.origem,
      canal: evento.canal,
      utm: evento.utm,
      metadata: evento.metadata
    };
    const trackingId = this.texto(evento.trackingId);
    const movimentos: Array<{
      entidadeTipo: string;
      entidadeId: string;
      etapaNova: EtapaFunilComercial;
      motivo: string;
      origem: string;
      contexto: Record<string, unknown>;
    }> = [];

    if (trackingId) {
      const etapaTracking = this.etapaTrackingPublico(evento.tipo);
      if (etapaTracking) {
        movimentos.push({
          entidadeTipo: "tracking",
          entidadeId: trackingId,
          etapaNova: etapaTracking.etapa,
          motivo: etapaTracking.motivo,
          origem: "loja_publica",
          contexto
        });
      }
    }

    if (evento.tipo === "PEDIDO_CRIADO" && evento.entidadeId) {
      movimentos.push({
        entidadeTipo: "pedido",
        entidadeId: evento.entidadeId,
        etapaNova: "PEDIDO",
        motivo: "Pedido criado pelo checkout público.",
        origem: "checkout_site",
        contexto
      });
      if (evento.metadata.estadoPagamento === "PENDENTE" || evento.metadata.estado === "AGUARDANDO_PAGAMENTO") {
        movimentos.push({
          entidadeTipo: "pedido",
          entidadeId: evento.entidadeId,
          etapaNova: "PAGAMENTO_PENDENTE",
          motivo: "Pedido criado pelo checkout público e aguarda pagamento.",
          origem: "checkout_site",
          contexto
        });
      }
    }

    if (evento.tipo === "PAGAMENTO_CONFIRMADO" && evento.entidadeId) {
      movimentos.push({
        entidadeTipo: "pedido",
        entidadeId: evento.entidadeId,
        etapaNova: "PAGO",
        motivo: "Pagamento confirmado.",
        origem: "checkout_site",
        contexto
      });
    }

    if (evento.tipo === "COMPRA_ENTREGUE" && evento.entidadeId) {
      movimentos.push({
        entidadeTipo: "pedido",
        entidadeId: evento.entidadeId,
        etapaNova: "ENTREGUE",
        motivo: "Compra entregue ao cliente.",
        origem: "checkout_site",
        contexto
      });
    }

    return movimentos;
  }

  private etapaTrackingPublico(tipo: EventoTrackingComercial["tipo"]): { etapa: EtapaFunilComercial; motivo: string } | null {
    const mapa: Partial<Record<EventoTrackingComercial["tipo"], { etapa: EtapaFunilComercial; motivo: string }>> = {
      LOJA_VISITADA: { etapa: "VISITA", motivo: "Cliente visitou a loja pública." },
      CATALOGO_VISTO: { etapa: "VISITA", motivo: "Cliente visualizou catálogo público." },
      PRODUTO_VISTO: { etapa: "PRODUTO_VISTO", motivo: "Cliente visualizou produto público." },
      WHATSAPP_CLICK: { etapa: "WHATSAPP_CLICK", motivo: "Cliente clicou para comprar pelo WhatsApp." },
      CHECKOUT_INICIADO: { etapa: "CHECKOUT", motivo: "Cliente iniciou checkout público." },
      PEDIDO_CRIADO: { etapa: "PEDIDO", motivo: "Pedido criado a partir do checkout público." },
      PAGAMENTO_CONFIRMADO: { etapa: "PAGO", motivo: "Pagamento confirmado no checkout público." },
      COMPRA_ENTREGUE: { etapa: "ENTREGUE", motivo: "Compra entregue ao cliente." }
    };

    return mapa[tipo] ?? null;
  }

  private async registrarMovimentoFunilPublico(
    negocioId: string,
    movimento: {
      entidadeTipo: string;
      entidadeId: string;
      etapaNova: EtapaFunilComercial;
      motivo: string;
      origem: string;
      contexto: Record<string, unknown>;
    }
  ): Promise<void> {
    if (!this.funil) return;

    const [ultimoMovimento] = await this.funil.listarMovimentos(negocioId, {
      entidadeTipo: movimento.entidadeTipo,
      entidadeId: movimento.entidadeId,
      limite: 1
    });
    if (!this.deveAvancarFunil(ultimoMovimento?.etapaNova ?? null, movimento.etapaNova)) return;

    await this.funil.registrarMovimento({
      negocioId,
      entidadeTipo: movimento.entidadeTipo,
      entidadeId: movimento.entidadeId,
      etapaAnterior: ultimoMovimento?.etapaNova ?? null,
      etapaNova: movimento.etapaNova,
      motivo: movimento.motivo,
      origem: movimento.origem,
      contexto: movimento.contexto
    });
  }

  private deveAvancarFunil(etapaAnterior: EtapaFunilComercial | null, etapaNova: EtapaFunilComercial): boolean {
    if (!etapaAnterior) return true;
    const ordem: Partial<Record<EtapaFunilComercial, number>> = {
      VISITA: 1,
      PRODUTO_VISTO: 2,
      WHATSAPP_CLICK: 3,
      LEAD: 4,
      CONVERSA: 5,
      CHECKOUT: 6,
      PEDIDO: 7,
      PAGAMENTO_PENDENTE: 8,
      PAGO: 9,
      PREPARACAO: 10,
      ENTREGA: 11,
      ENTREGUE: 12,
      POS_VENDA: 13,
      RECOMPRA: 14,
      PERDIDO: 15
    };

    return (ordem[etapaNova] ?? 0) > (ordem[etapaAnterior] ?? -1);
  }

  private async criarTarefaLeadFormulario(
    negocio: NegocioBizy,
    cliente: { id: string; nome: string | null; telefone: string | null; email: string | null },
    dados: DadosFormularioLeadPublico
  ) {
    if (!this.gestaoTarefas) return;

    const responsavelId = await this.escolherResponsavelLeadFormulario(negocio.id);
    const produtoInteresse = this.texto(dados.produtoInteresse);
    const mensagem = this.texto(dados.mensagem);
    const nomeCliente = this.texto(cliente.nome) ?? "Lead";
    const tituloBase = produtoInteresse ? `Novo lead para ${produtoInteresse}` : "Novo lead via formulário";

    await this.gestaoTarefas.criarTarefa({
      negocioId: negocio.id,
      tipo: "LEAD_FORMULARIO",
      titulo: `${tituloBase}: ${nomeCliente}`,
      descricao: [
        "Lead captado pelo formulário público.",
        cliente.telefone ? `Telefone: ${cliente.telefone}` : null,
        cliente.email ? `Email: ${cliente.email}` : null,
        produtoInteresse ? `Interesse: ${produtoInteresse}` : null,
        mensagem ? `Mensagem: ${mensagem}` : null
      ].filter((item): item is string => Boolean(item)).join("\n"),
      prioridade: "ALTA",
      origem: "FORMULARIO_PUBLICO",
      clienteId: cliente.id,
      clienteTelefone: cliente.telefone,
      entidadeTipo: "cliente",
      entidadeId: cliente.id,
      responsavelId,
      prazoEm: new Date(Date.now() + 3 * 60 * 60_000),
      contexto: {
        formularioSlug: negocio.slugPublico,
        tagAutomatica: "lead-formulario",
        produtoInteresse,
        mensagem,
        consentimentoMarketing: dados.consentimentoMarketing ?? false,
        consentimentoDados: dados.consentimentoDados
      }
    });
  }

  private async escolherResponsavelLeadFormulario(negocioId: string): Promise<string | null> {
    if (!this.gestaoGovernanca) return null;

    const membros = await this.gestaoGovernanca.listarMembros(negocioId, {
      status: "ATIVO",
      limite: 500
    });
    const prioridades = ["DONO", "ADMIN", "VENDEDOR", "ATENDENTE", "FINANCEIRO"] as const;
    const selecionado = prioridades
      .map((papel) => membros.find((membro) => membro.papel === papel))
      .find((membro): membro is (typeof membros)[number] => Boolean(membro));

    return selecionado?.usuarioId ?? membros[0]?.usuarioId ?? null;
  }

  private async registrarEventoOperacionalSilencioso(dados: Parameters<RepositorioEventosOperacionais["registrar"]>[0]) {
    try {
      await this.eventosOperacionais?.registrar(dados);
    } catch {
      // O tracking público não deve falhar checkout por indisponibilidade de auditoria operacional.
    }
  }

  private async prepararEventosServerSide(
    negocio: NegocioBizy,
    evento: EventoTrackingComercial | null,
    consentimento: ConsentimentoServerSide
  ): Promise<void> {
    if (!evento || !this.eventosOperacionais) return;

    const providers = this.resolverProvidersServerSide(negocio);
    for (const provider of providers) {
      if (!provider.eventos.includes(evento.tipo)) continue;
      if (!this.temConsentimentoServerSide(provider, consentimento)) continue;

      await this.registrarEventoOperacionalSilencioso({
        negocioId: negocio.id,
        topico: "server-side-events",
        tipo: this.tipoEventoServerSide(provider.provider),
        entidadeTipo: evento.entidadeTipo,
        entidadeId: evento.entidadeId,
        idempotencyKey: `server-side:${provider.provider}:${negocio.id}:${evento.id}`,
        estado: "PENDENTE",
        payload: {
          provider: provider.provider,
          eventName: this.nomeEventoServerSide(evento.tipo),
          eventTime: Math.floor(evento.criadoEm.getTime() / 1000),
          eventId: evento.id,
          actionSource: "website",
          pixelId: provider.pixelId,
          credencialRef: provider.credencialRef,
          negocioId: negocio.id,
          slugLoja: evento.slugLoja,
          origem: evento.origem,
          canal: evento.canal,
          consentimento: {
            dados: consentimento.dados === true,
            marketing: consentimento.marketing === true,
            origem: consentimento.origem ?? null
          },
          userData: this.montarUserDataServerSide(consentimento),
          customData: this.montarCustomDataServerSide(negocio, evento)
        }
      });
    }
  }

  private resolverProvidersServerSide(negocio: NegocioBizy): ProviderServerSideConfigurado[] {
    const raiz = this.objeto(
      negocio.entrega.serverSideEvents ??
      negocio.entrega.eventosServerSide ??
      negocio.entrega.conversionsApi
    );
    if (!this.booleano(raiz.ativo ?? raiz.enabled)) return [];

    const candidatos = Array.isArray(raiz.providers)
      ? raiz.providers
      : Array.isArray(raiz.provedores)
        ? raiz.provedores
        : [raiz];

    return candidatos
      .map((item) => this.objeto(item))
      .map((provider) => {
        const codigoProvider = this.texto(provider.provider ?? provider.nome ?? provider.tipo)?.toLowerCase() ?? "meta_capi";
        const pixelId = this.texto(provider.pixelId ?? provider.datasetId ?? raiz.pixelId ?? raiz.datasetId);
        const credencialRef = this.texto(
          provider.credencialRef ??
          provider.credentialRef ??
          provider.tokenRef ??
          provider.accessTokenRef ??
          raiz.credencialRef ??
          raiz.tokenRef
        );
        const eventos = this.listaTextos(provider.eventos ?? raiz.eventos);

        return {
          provider: codigoProvider,
          pixelId,
          credencialRef,
          eventos: eventos.length ? eventos.map((evento) => evento.toUpperCase()) : ["CHECKOUT_INICIADO", "PEDIDO_CRIADO"],
          exigirConsentimentoMarketing: this.booleano(
            provider.exigirConsentimentoMarketing ??
            provider.requireMarketingConsent ??
            raiz.exigirConsentimentoMarketing ??
            true
          )
        };
      })
      .filter((provider): provider is ProviderServerSideConfigurado =>
        Boolean(provider.provider && provider.pixelId && provider.credencialRef)
      );
  }

  private temConsentimentoServerSide(
    provider: ProviderServerSideConfigurado,
    consentimento: ConsentimentoServerSide
  ): boolean {
    if (consentimento.dados !== true) return false;
    if (provider.exigirConsentimentoMarketing && consentimento.marketing !== true) return false;
    return true;
  }

  private tipoEventoServerSide(provider: string): string {
    if (provider === "meta_capi") return "META_CAPI_EVENT_READY";
    return `${provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_EVENT_READY`;
  }

  private nomeEventoServerSide(tipo: EventoTrackingComercial["tipo"]): string {
    const mapa: Partial<Record<EventoTrackingComercial["tipo"], string>> = {
      LOJA_VISITADA: "PageView",
      PRODUTO_VISTO: "ViewContent",
      WHATSAPP_CLICK: "Contact",
      CHECKOUT_INICIADO: "InitiateCheckout",
      PEDIDO_CRIADO: "Purchase",
      PAGAMENTO_CONFIRMADO: "Purchase",
      COMPRA_ENTREGUE: "Purchase"
    };
    return mapa[tipo] ?? tipo;
  }

  private montarUserDataServerSide(consentimento: ConsentimentoServerSide): Record<string, string> {
    const telefoneHash = this.hashSha256(normalizarTelefone(consentimento.telefone)?.canonico ?? null);
    const emailHash = this.hashSha256(normalizarEmail(consentimento.email));

    return {
      ...(telefoneHash ? { ph: telefoneHash } : {}),
      ...(emailHash ? { em: emailHash } : {})
    };
  }

  private montarCustomDataServerSide(negocio: NegocioBizy, evento: EventoTrackingComercial): Record<string, unknown> {
    const metadata = evento.metadata;
    const valor = this.numero(metadata.totalEmKwanza ?? metadata.valorEmKwanza ?? metadata.value);
    const pedidoId = this.texto(metadata.pedidoId) ?? (evento.entidadeTipo === "PEDIDO" ? evento.entidadeId : null);
    const contentIds = [
      evento.codigoProduto,
      ...this.codigosProdutoDeMetadata(metadata.itens)
    ].filter((codigo): codigo is string => Boolean(codigo));

    return {
      currency: negocio.moeda || "AOA",
      ...(valor !== null ? { value: valor } : {}),
      ...(pedidoId ? { order_id: pedidoId } : {}),
      ...(evento.entidadeTipo ? { content_type: evento.entidadeTipo.toLowerCase() } : {}),
      ...(contentIds.length ? { content_ids: [...new Set(contentIds)] } : {})
    };
  }

  private codigosProdutoDeMetadata(valor: unknown): string[] {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((item) => this.objeto(item).codigoPeca ?? this.objeto(item).codigoProduto ?? this.objeto(item).codigo)
      .map((codigo) => this.texto(codigo))
      .filter((codigo): codigo is string => Boolean(codigo));
  }

  private normalizarExperienciaLoja(valor: unknown) {
    const dados = this.objeto(valor);
    const ordemPadrao = ["destaques", "promocoes", "novidades", "maisVendidos", "kits", "reposicoes"];
    const secoesPermitidas = new Set(ordemPadrao);
    const ordemInformada = Array.isArray(dados.ordemVitrines)
      ? dados.ordemVitrines.filter((item): item is string => typeof item === "string" && secoesPermitidas.has(item))
      : [];
    const tabelaMedidas = Array.isArray(dados.tabelaMedidas)
      ? dados.tabelaMedidas
          .map((linha) => this.objeto(linha))
          .map((linha) => ({
            tamanho: this.texto(linha.tamanho) ?? "",
            busto: this.texto(linha.busto),
            cintura: this.texto(linha.cintura),
            quadril: this.texto(linha.quadril),
            observacao: this.texto(linha.observacao)
          }))
          .filter((linha) => linha.tamanho)
          .slice(0, 24)
      : [];
    const criteriosCatalogo = new Set(["categoria", "colecao", "busca", "todos"]);
    const catalogosPersonalizados = Array.isArray(dados.catalogosPersonalizados)
      ? dados.catalogosPersonalizados
          .map((item, indice) => this.objeto(item))
          .map((item, indice) => {
            const criterio = this.texto(item.criterio);
            const nome = this.texto(item.nome);
            return {
              id: this.normalizarIdCatalogo(this.texto(item.id) ?? nome ?? `catalogo-${indice + 1}`),
              nome: nome ?? "",
              descricao: this.texto(item.descricao),
              criterio: criteriosCatalogo.has(criterio ?? "") ? criterio : "busca",
              valor: this.texto(item.valor)
            };
          })
          .filter((item) => item.nome)
          .slice(0, 12)
      : [];
    const modo = this.texto(dados.modoNegocio);

    return {
      modoNegocio: ["auto", "moda", "comida", "servicos", "geral"].includes(modo ?? "") ? modo : "auto",
      ordemVitrines: [...new Set(ordemInformada.length ? ordemInformada : ordemPadrao)],
      catalogosEditaveis: typeof dados.catalogosEditaveis === "boolean" ? dados.catalogosEditaveis : true,
      leadCaptureAtivo: typeof dados.leadCaptureAtivo === "boolean" ? dados.leadCaptureAtivo : true,
      leadCaptureTitulo: this.texto(dados.leadCaptureTitulo),
      cupomDestaque: this.texto(dados.cupomDestaque),
      politicaTroca: this.texto(dados.politicaTroca),
      politicaEntrega: this.texto(dados.politicaEntrega),
      politicaPrivacidade: this.texto(dados.politicaPrivacidade),
      catalogosPersonalizados,
      operacao: this.normalizarOperacaoLoja(dados.operacao),
      tabelaMedidas
    };
  }

  private normalizarOperacaoLoja(valor: unknown) {
    const dados = this.objeto(valor);
    const plano = this.objeto(dados.plano);
    const quotas = this.objeto(plano.quotas);
    const checkout = this.objeto(dados.checkout);
    const pagamentosAvancados = this.objeto(dados.pagamentos);
    const entregaAvancada = this.objeto(dados.entrega);
    const fidelizacao = this.objeto(dados.fidelizacao);
    const automacoes = this.objeto(dados.automacoes);
    const canais = this.objeto(dados.canais);
    const catalogo = this.objeto(dados.catalogo);
    const clientes = this.objeto(dados.clientes);
    const encomendas = this.objeto(dados.encomendas);
    const relatorios = this.objeto(dados.relatorios);
    const siteSeo = this.objeto(dados.siteSeo);
    const acessoLoja = this.texto(fidelizacao.acessoLoja);
    const agruparPor = this.texto(relatorios.agruparPor);
    const acessosPermitidos = new Set(["aberto", "telefone", "login", "membros"]);
    const agrupamentosPermitidos = new Set(["hora", "produto", "cliente"]);

    return {
      plano: {
        planoAtual: this.texto(plano.planoAtual) ?? "starter",
        recursosBloqueados: this.listaTextos(plano.recursosBloqueados).slice(0, 40),
        quotas: {
          encomendasMensais: Math.round(Math.max(0, this.numero(quotas.encomendasMensais) ?? 0)),
          imagens: Math.round(Math.max(0, this.numero(quotas.imagens) ?? 0)),
          whatsapp: Math.round(Math.max(0, this.numero(quotas.whatsapp) ?? 0)),
          email: Math.round(Math.max(0, this.numero(quotas.email) ?? 0))
        },
        upgradeContextual: this.booleanoComPadrao(plano.upgradeContextual, true)
      },
      checkout: {
        ignorarPaginaPagamento: this.booleanoComPadrao(checkout.ignorarPaginaPagamento, false),
        manterRascunhoAtePago: this.booleanoComPadrao(checkout.manterRascunhoAtePago, false),
        confirmacaoAutomaticaPagamento: this.booleanoComPadrao(checkout.confirmacaoAutomaticaPagamento, false),
        entradaAtiva: this.booleanoComPadrao(checkout.entradaAtiva, false),
        entradaPercentual: this.limitarNumero(checkout.entradaPercentual, 0, 100, 0),
        taxaServicoPercentual: this.limitarNumero(checkout.taxaServicoPercentual, 0, 100, 0),
        taxaServicoFixaEmKwanza: Math.round(Math.max(0, this.numero(checkout.taxaServicoFixaEmKwanza) ?? 0)),
        prefixoPedido: this.texto(checkout.prefixoPedido),
        sufixoPedido: this.texto(checkout.sufixoPedido),
        exigirTelefoneCheckout: this.booleanoComPadrao(checkout.exigirTelefoneCheckout, true),
        exigirLoginCheckout: this.booleanoComPadrao(checkout.exigirLoginCheckout, false),
        mostrarNumeroEncomendaNaMensagem: this.booleanoComPadrao(checkout.mostrarNumeroEncomendaNaMensagem, true)
      },
      pagamentos: {
        dinheiroEntrega: this.booleanoComPadrao(pagamentosAvancados.dinheiroEntrega, true),
        transferenciaBancaria: this.booleanoComPadrao(pagamentosAvancados.transferenciaBancaria, true),
        cartaoAdyen: this.booleanoComPadrao(pagamentosAvancados.cartaoAdyen, false),
        paypal: this.booleanoComPadrao(pagamentosAvancados.paypal, false),
        pagamentoPersonalizado: this.booleanoComPadrao(pagamentosAvancados.pagamentoPersonalizado, false),
        pagamentoComInstrucoes: this.booleanoComPadrao(pagamentosAvancados.pagamentoComInstrucoes, true),
        creditoLoja: this.booleanoComPadrao(pagamentosAvancados.creditoLoja, false),
        instrucoesPagamento: this.texto(pagamentosAvancados.instrucoesPagamento)
      },
      entrega: {
        gerirDisponibilidade: this.booleanoComPadrao(entregaAvancada.gerirDisponibilidade, false),
        adicionarMetodoEntrega: this.booleanoComPadrao(entregaAvancada.adicionarMetodoEntrega, false),
        disponibilidadeSemanal: this.listaTextos(entregaAvancada.disponibilidadeSemanal).slice(0, 21),
        zonas: this.normalizarZonasEntregaOperacao(entregaAvancada.zonas)
      },
      fidelizacao: {
        acessoLoja: acessosPermitidos.has(acessoLoja ?? "") ? acessoLoja : "aberto",
        ofertaBoasVindasAtiva: this.booleanoComPadrao(fidelizacao.ofertaBoasVindasAtiva, false),
        cupomBoasVindas: this.texto(fidelizacao.cupomBoasVindas),
        recompensasAtivas: this.booleanoComPadrao(fidelizacao.recompensasAtivas, false),
        recompensasIndicacaoAtivas: this.booleanoComPadrao(fidelizacao.recompensasIndicacaoAtivas, false),
        creditoLojaAtivo: this.booleanoComPadrao(fidelizacao.creditoLojaAtivo, false)
      },
      automacoes: {
        perfilCliente: this.booleanoComPadrao(automacoes.perfilCliente, true),
        carrinhoAbandonado: this.booleanoComPadrao(automacoes.carrinhoAbandonado, true),
        pedidoAvaliacao: this.booleanoComPadrao(automacoes.pedidoAvaliacao, true),
        avaliacaoRecebida: this.booleanoComPadrao(automacoes.avaliacaoRecebida, true),
        pedidoNovamente: this.booleanoComPadrao(automacoes.pedidoNovamente, true),
        aniversarioCliente: this.booleanoComPadrao(automacoes.aniversarioCliente, false),
        pagamentoPendente: this.booleanoComPadrao(automacoes.pagamentoPendente, true),
        pagamentoConfirmado: this.booleanoComPadrao(automacoes.pagamentoConfirmado, true),
        creditoAtualizado: this.booleanoComPadrao(automacoes.creditoAtualizado, false),
        creditoReembolsado: this.booleanoComPadrao(automacoes.creditoReembolsado, false),
        pedidoSaiuEntrega: this.booleanoComPadrao(automacoes.pedidoSaiuEntrega, true),
        pedidoCancelado: this.booleanoComPadrao(automacoes.pedidoCancelado, true),
        produtoDigitalConfirmado: this.booleanoComPadrao(automacoes.produtoDigitalConfirmado, false),
        operacaoInternaPedidoCriado: this.booleanoComPadrao(automacoes.operacaoInternaPedidoCriado, true)
      },
      canais: {
        site: this.booleanoComPadrao(canais.site, true),
        whatsapp: this.booleanoComPadrao(canais.whatsapp, true),
        instagram: this.booleanoComPadrao(canais.instagram, false),
        google: this.booleanoComPadrao(canais.google, false),
        pos: this.booleanoComPadrao(canais.pos, false),
        transmissoes: this.booleanoComPadrao(canais.transmissoes, false),
        chatbot: this.booleanoComPadrao(canais.chatbot, true),
        appMovelQr: this.booleanoComPadrao(canais.appMovelQr, false),
        caixaEntradaUnificada: this.booleanoComPadrao(canais.caixaEntradaUnificada, true),
        broadcasts: this.booleanoComPadrao(canais.broadcasts, false)
      },
      catalogo: {
        categoriasVisiveis: this.listaTextos(catalogo.categoriasVisiveis).slice(0, 60),
        categoriasOcultas: this.listaTextos(catalogo.categoriasOcultas).slice(0, 60),
        sequenciaCategorias: this.listaTextos(catalogo.sequenciaCategorias).slice(0, 60),
        mensagensColecao: this.normalizarMensagensColecao(catalogo.mensagensColecao),
        descontosAtivos: this.booleanoComPadrao(catalogo.descontosAtivos, false),
        produtosPorColecao: this.booleanoComPadrao(catalogo.produtosPorColecao, true),
        produtosComEstatisticas: this.booleanoComPadrao(catalogo.produtosComEstatisticas, true)
      },
      clientes: {
        importar: this.booleanoComPadrao(clientes.importar, true),
        exportar: this.booleanoComPadrao(clientes.exportar, true),
        edicaoMassa: this.booleanoComPadrao(clientes.edicaoMassa, false),
        adicionarManual: this.booleanoComPadrao(clientes.adicionarManual, true),
        pesquisaAvancada: this.booleanoComPadrao(clientes.pesquisaAvancada, true),
        filtrosInteligentes: this.listaTextos(clientes.filtrosInteligentes).length
          ? this.listaTextos(clientes.filtrosInteligentes).slice(0, 20)
          : ["todos", "inativos", "primeiro-pedido", "nunca-comprou"],
        transmissaoFiltrada: this.booleanoComPadrao(clientes.transmissaoFiltrada, false)
      },
      encomendas: {
        criarManual: this.booleanoComPadrao(encomendas.criarManual, true),
        exportar: this.booleanoComPadrao(encomendas.exportar, true),
        resumoAtivo: this.booleanoComPadrao(encomendas.resumoAtivo, true),
        rascunhos: this.booleanoComPadrao(encomendas.rascunhos, true),
        pagamentos: this.booleanoComPadrao(encomendas.pagamentos, true),
        calendario: this.booleanoComPadrao(encomendas.calendario, true),
        colunasOperacionais: this.listaTextos(encomendas.colunasOperacionais).length
          ? this.listaTextos(encomendas.colunasOperacionais).slice(0, 30)
          : ["cliente", "total", "estado", "pagamento", "entrega", "criadoEm"]
      },
      relatorios: {
        metricas: this.listaTextos(relatorios.metricas).slice(0, 12),
        agruparPor: agrupamentosPermitidos.has(agruparPor ?? "") ? agruparPor : "produto",
        filtrosPedidos: this.listaTextos(relatorios.filtrosPedidos).slice(0, 12),
        relatoriosProntos: this.listaTextos(relatorios.relatoriosProntos).slice(0, 40)
      },
      siteSeo: {
        dominioPersonalizado: this.texto(siteSeo.dominioPersonalizado),
        instrucoesDns: this.texto(siteSeo.instrucoesDns),
        tituloSite: this.texto(siteSeo.tituloSite),
        uploadLogotipo: this.booleanoComPadrao(siteSeo.uploadLogotipo, true),
        imagemGeradaIa: this.booleanoComPadrao(siteSeo.imagemGeradaIa, false),
        categoriasDiretorio: this.listaTextos(siteSeo.categoriasDiretorio).slice(0, 12)
      }
    };
  }

  private normalizarZonasEntregaOperacao(valor: unknown) {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((item) => this.objeto(item))
      .map((item) => ({
        nome: this.texto(item.nome) ?? "",
        precoEmKwanza: Math.round(Math.max(0, this.numero(item.precoEmKwanza) ?? 0)),
        prazo: this.texto(item.prazo)
      }))
      .filter((zona) => zona.nome)
      .slice(0, 60);
  }

  private normalizarIdCatalogo(valor: string): string {
    return valor
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "catalogo";
  }

  private listaTextos(valor: unknown): string[] {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((item) => this.texto(item))
      .filter((item): item is string => Boolean(item));
  }

  private normalizarMensagensColecao(valor: unknown): Record<string, string> {
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
    const resultado: Record<string, string> = {};
    for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
      const t = this.texto(v);
      if (t) resultado[chave] = t.slice(0, 200);
    }
    return resultado;
  }

  private booleanoComPadrao(valor: unknown, padrao: boolean): boolean {
    if (typeof valor === "boolean") return valor;
    if (valor === undefined || valor === null || valor === "") return padrao;
    return this.booleano(valor);
  }

  private booleano(valor: unknown): boolean {
    if (typeof valor === "boolean") return valor;
    if (typeof valor === "string") return ["true", "1", "sim", "yes", "ativo"].includes(valor.trim().toLowerCase());
    if (typeof valor === "number") return valor > 0;
    return false;
  }

  private limitarNumero(valor: unknown, minimo: number, maximo: number, padrao: number): number {
    const informado = this.numero(valor);
    if (informado === null) return padrao;
    return Math.min(maximo, Math.max(minimo, informado));
  }

  private hashSha256(valor: string | null): string | null {
    if (!valor) return null;
    return createHash("sha256").update(valor.trim().toLowerCase()).digest("hex");
  }
}
