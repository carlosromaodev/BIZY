import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  RepositorioComentarios,
  RepositorioAutenticacao,
  RepositorioAfiliados,
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioCampanhas,
  RepositorioClientes,
  RepositorioCompartilhamentoClientes,
  RepositorioInstanciasWhatsApp,
  RepositorioEventosOperacionais,
  RepositorioPecas,
  RepositorioFunilComercial,
  RepositorioJobsOperacionais,
  RepositorioMembrosNegocio,
  RepositorioOportunidadesRecuperacao,
  RepositorioPedidos,
  RepositorioPlaybooksRecuperacao,
  RepositorioReservas,
  RepositorioSessoesLive,
  RepositorioSocialInbox,
  RepositorioTarefasOperacionais,
  RepositorioTemplatesWhatsApp,
  RepositorioTrackingComercial
} from "../../dominio/repositorios/contratos.js";
import type {
  AtualizacaoRegistroSessaoLive,
  AtualizacaoCampanhaCrm,
  AtualizacaoCliente360,
  AtualizacaoConversaAtendimento,
  AtualizacaoEntregaPedido,
  AtualizacaoEstadoPedido,
  AtualizacaoFinanceiraPedido,
  AtualizacaoItensPedidoResolvida,
  AtualizacaoJobOperacional,
  AtualizacaoMembroNegocioOperacional,
  AtualizacaoModuloNegocio,
  AtualizacaoOportunidadeRecuperacao,
  AtualizacaoRelacaoNegocio,
  AtualizacaoTemplateWhatsAppNegocio,
  AtualizacaoTarefaOperacional,
  AtualizarPeca,
  AuditoriaCompartilhamentoCliente,
  CampanhaCrm,
  CodigoLoginSms,
  ClienteAtendimento,
  Cliente360,
  CompartilhamentoClienteRecebido,
  CompartilhamentoClienteSeguro,
  ComentarioLive,
  ConfirmacaoPagamentoPedido,
  ConversaAtendimento,
  ConversaAtendimentoComMensagens,
  ComissaoParceiro,
  DadosCriacaoReservaComControleStock,
  DadosCliente360,
  DadosPedidoResolvido,
  EstadoComentario,
  EstadoEntregaPedido,
  EstadoPagamento,
  EstadoPagamentoPedido,
  EstadoPeca,
  EstadoPedido,
  EstadoReserva,
  EventoOperacional,
  ExecucaoPlaybookRecuperacao,
  EventoSistema,
  EventoTrackingComercial,
  FiltrosPedidos,
  FiltrosCampanhasCrm,
  FiltrosClientes360,
  FiltrosExecucoesPlaybookRecuperacao,
  FiltrosEventosOperacionais,
  FiltrosMovimentosFunilComercial,
  FiltrosOportunidadesRecuperacao,
  FiltrosPlaybookRecuperacao,
  FiltrosSocialInbox,
  HistoricoComissaoParceiro,
  InstanciaWhatsApp,
  ItemCampanhaCrm,
  JobOperacional,
  ItemLotePagamentoComissao,
  LinkAfiliado,
  LotePagamentoComissao,
  MembroNegocioOperacional,
  MensagemAtendimento,
  MovimentoFunilComercial,
  ModuloNegocioCodigo,
  ModuloNegocioConfigurado,
  MovimentoStock,
  NovaCampanhaCrm,
  NovaComissaoParceiro,
  NovaExecucaoPlaybookRecuperacao,
  NovaMensagemAtendimento,
  NovaOportunidadeRecuperacao,
  NovaRelacaoNegocio,
  NovoMembroNegocioOperacional,
  NovoCompartilhamentoCliente,
  NovoEventoOperacional,
  NovoItemCampanhaCrm,
  NovoJobOperacional,
  NovoEventoTrackingComercial,
  NovoLinkAfiliado,
  NovoMovimentoFunilComercial,
  NovoPlaybookRecuperacao,
  NovoMovimentoStock,
  NovoParceiroComercial,
  NovoTemplateWhatsAppNegocio,
  NovaPeca,
  NovaReserva,
  NovoLotePagamentoComissao,
  NovoRegistroComentario,
  NovoOutboxMensagemWhatsApp,
  NovoRegistroSessaoLive,
  NovaTarefaOperacional,
  NovoSocialInboxItem,
  Peca,
  OportunidadeRecuperacao,
  ParceiroComercial,
  PlaybookRecuperacao,
  Pedido,
  RegistroComprovativoPagamentoPedido,
  RegistroOutboxEventoN8n,
  RegistroOutboxMensagemWhatsApp,
  RegistroComentario,
  RejeicaoPagamentoPedido,
  RegistroSessaoLive,
  Reserva,
  ResumoOutboxEventoN8n,
  ResumoOutboxMensagemWhatsApp,
  ResultadoInterpretacaoComentario,
  DadosIdentidadeAutenticacao,
  DadosNegocioBizy,
  DadosPublicacaoLoja,
  DadosPerfilEstudantil,
  NegocioBizy,
  PerfilEstudantilUsuario,
  ResumoAfiliadosComerciais,
  FiltrosTarefasOperacionais,
  TarefaOperacional,
  SocialInboxItem,
  TemplateWhatsAppNegocio,
  ResumoTrackingComercial,
  RelacaoNegocioCompartilhamento,
  TipoHistoricoComissaoParceiro,
  UsuarioSistema
} from "../../dominio/tipos.js";
import { modulosNegocioPadrao } from "../../dominio/tipos.js";
import { normalizarEmail, normalizarTelefone } from "../../dominio/servicos/normalizarContato.js";

const estadosQueBloqueiamStock: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "PAID"];
const estadosAtivosParaDuplicidade: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"];

function metricasCampanhaZeradas() {
  return {
    selecionados: 0,
    bloqueados: 0,
    enfileirados: 0,
    enviados: 0,
    entregues: 0,
    lidos: 0,
    respondidos: 0,
    falhados: 0,
    pedidosGerados: 0,
    receitaAtribuidaEmKwanza: 0
  };
}

export class RepositorioPecasPrisma implements RepositorioPecas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaPeca): Promise<Peca> {
    const peca = await this.prisma.peca.create({
      data: {
        codigo: dados.codigo,
        negocioId: dados.negocioId ?? null,
        sku: dados.sku ?? null,
        nome: dados.nome,
        descricao: dados.descricao,
        categoria: dados.categoria ?? null,
        colecao: dados.colecao ?? null,
        precoEmKwanza: dados.precoEmKwanza,
        custoEmKwanza: dados.custoEmKwanza ?? null,
        quantidade: dados.quantidade,
        stockMinimo: dados.stockMinimo ?? 0,
        fotosJson: JSON.stringify(dados.fotos),
        variantesJson: JSON.stringify(dados.variantes ?? {}),
        estado: dados.estado ?? (dados.quantidade > 0 ? "DISPONIVEL" : "ESGOTADA")
      }
    });

    return this.mapearPeca(peca);
  }

  async listar(negocioId?: string | null): Promise<Peca[]> {
    const pecas = await this.prisma.peca.findMany({
      where: negocioId ? { negocioId } : undefined,
      orderBy: { codigo: "asc" }
    });
    return pecas.map((peca) => this.mapearPeca(peca));
  }

  async buscarPorCodigo(codigo: string, negocioId?: string | null): Promise<Peca | null> {
    const peca = await this.prisma.peca.findFirst({
      where: {
        codigo,
        ...(negocioId ? { negocioId } : {})
      },
      orderBy: { criadoEm: "asc" }
    });
    return peca ? this.mapearPeca(peca) : null;
  }

  async atualizar(codigo: string, dados: AtualizarPeca, negocioId?: string | null): Promise<Peca> {
    const atual = await this.buscarPorCodigo(codigo, negocioId);
    if (!atual) {
      throw new Error(`Peça #${codigo} não encontrada.`);
    }

    const peca = await this.prisma.peca.update({
      where: { id: atual.id },
      data: {
        sku: dados.sku,
        nome: dados.nome,
        descricao: dados.descricao,
        categoria: dados.categoria,
        colecao: dados.colecao,
        precoEmKwanza: dados.precoEmKwanza,
        custoEmKwanza: dados.custoEmKwanza,
        quantidade: dados.quantidade,
        stockMinimo: dados.stockMinimo,
        negocioId: dados.negocioId,
        estado: dados.estado,
        arquivadaEm: dados.arquivadaEm,
        fotosJson: dados.fotos ? JSON.stringify(dados.fotos) : undefined,
        variantesJson: dados.variantes ? JSON.stringify(dados.variantes) : undefined
      }
    });

    return this.mapearPeca(peca);
  }

  async atualizarEstado(codigo: string, estado: EstadoPeca, negocioId?: string | null): Promise<Peca> {
    return this.atualizar(codigo, { estado }, negocioId);
  }

  async registrarMovimentoStock(dados: NovoMovimentoStock): Promise<MovimentoStock> {
    const movimento = await this.prisma.movimentoStock.create({
      data: {
        negocioId: dados.negocioId ?? null,
        pecaId: dados.pecaId,
        codigoPeca: dados.codigoPeca,
        tipo: dados.tipo,
        quantidade: dados.quantidade,
        quantidadeAnterior: dados.quantidadeAnterior,
        quantidadeNova: dados.quantidadeNova,
        motivo: dados.motivo ?? null,
        responsavelId: dados.responsavelId ?? null,
        origem: dados.origem ?? null
      }
    });

    return this.mapearMovimentoStock(movimento);
  }

  async listarMovimentosStock(codigoPeca: string, negocioId?: string | null): Promise<MovimentoStock[]> {
    const movimentos = await this.prisma.movimentoStock.findMany({
      where: {
        codigoPeca,
        ...(negocioId ? { negocioId } : {})
      },
      orderBy: { criadoEm: "desc" }
    });

    return movimentos.map((movimento) => this.mapearMovimentoStock(movimento));
  }

  private mapearPeca(peca: {
    id: string;
    codigo: string;
    negocioId: string | null;
    sku: string | null;
    nome: string;
    descricao: string;
    categoria: string | null;
    colecao: string | null;
    precoEmKwanza: number;
    custoEmKwanza: number | null;
    quantidade: number;
    stockMinimo: number;
    fotosJson: string;
    variantesJson: string;
    estado: string;
    arquivadaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Peca {
    const margemEstimadaEmKwanza = this.calcularMargem(peca.precoEmKwanza, peca.custoEmKwanza);
    return {
      ...peca,
      fotos: this.lerFotos(peca.fotosJson),
      variantes: this.lerVariantes(peca.variantesJson),
      estado: peca.estado as EstadoPeca,
      margemEstimadaEmKwanza,
      estadoStock: this.calcularEstadoStock({
        arquivadaEm: peca.arquivadaEm,
        estado: peca.estado as EstadoPeca,
        quantidade: peca.quantidade,
        stockMinimo: peca.stockMinimo
      })
    };
  }

  private mapearMovimentoStock(movimento: {
    id: string;
    negocioId: string | null;
    pecaId: string;
    codigoPeca: string;
    tipo: string;
    quantidade: number;
    quantidadeAnterior: number;
    quantidadeNova: number;
    motivo: string | null;
    responsavelId: string | null;
    origem: string | null;
    criadoEm: Date;
  }): MovimentoStock {
    return {
      ...movimento,
      tipo: movimento.tipo as MovimentoStock["tipo"]
    };
  }

  private lerFotos(valor: string): string[] {
    try {
      const fotos = JSON.parse(valor);
      return Array.isArray(fotos) ? fotos.filter((foto) => typeof foto === "string") : [];
    } catch {
      return [];
    }
  }

  private lerVariantes(valor: string): Record<string, string[]> {
    try {
      const variantes = JSON.parse(valor);
      if (!variantes || typeof variantes !== "object" || Array.isArray(variantes)) return {};

      return Object.fromEntries(
        Object.entries(variantes)
          .filter(([, valores]) => Array.isArray(valores))
          .map(([nome, valores]) => [nome, (valores as unknown[]).filter((valor) => typeof valor === "string")])
      );
    } catch {
      return {};
    }
  }

  private calcularMargem(precoEmKwanza: number, custoEmKwanza: number | null): number | null {
    return custoEmKwanza === null ? null : precoEmKwanza - custoEmKwanza;
  }

  private calcularEstadoStock(peca: {
    arquivadaEm: Date | null;
    estado: EstadoPeca;
    quantidade: number;
    stockMinimo: number;
  }): Peca["estadoStock"] {
    if (peca.arquivadaEm) return "ARQUIVADO";
    if (peca.estado === "ESGOTADA" || peca.quantidade === 0) return "ESGOTADO";
    if (peca.stockMinimo > 0 && peca.quantidade <= peca.stockMinimo) return "BAIXO_STOCK";
    return "DISPONIVEL";
  }
}

export class RepositorioTrackingComercialPrisma implements RepositorioTrackingComercial {
  constructor(private readonly prisma: PrismaClient) {}

  async registrarEvento(dados: NovoEventoTrackingComercial): Promise<EventoTrackingComercial> {
    const evento = await this.prisma.eventoTrackingComercial.create({
      data: {
        negocioId: dados.negocioId,
        tipo: dados.tipo,
        entidadeTipo: dados.entidadeTipo ?? null,
        entidadeId: dados.entidadeId ?? null,
        slugLoja: dados.slugLoja ?? null,
        codigoProduto: dados.codigoProduto ?? null,
        trackingId: dados.trackingId ?? null,
        origem: dados.origem ?? null,
        canal: dados.canal ?? null,
        utmJson: JSON.stringify(dados.utm ?? {}),
        metadataJson: JSON.stringify(dados.metadata ?? {})
      }
    });

    return this.mapearEvento(evento);
  }

  async resumirEventos(negocioId: string): Promise<ResumoTrackingComercial> {
    const eventos = await this.prisma.eventoTrackingComercial.findMany({
      where: { negocioId }
    });
    const mapeados = eventos.map((evento) => this.mapearEvento(evento));
    return {
      totalEventos: mapeados.length,
      porTipo: this.contarPor(mapeados, (evento) => evento.tipo),
      porOrigem: this.contarPor(mapeados, (evento) => evento.origem ?? "sem_origem"),
      porCanal: this.contarPor(mapeados, (evento) => evento.canal ?? "sem_canal"),
      funil: this.montarFunil(mapeados)
    };
  }

  async listarEventos(
    negocioId: string,
    filtros: {
      tipo?: EventoTrackingComercial["tipo"];
      origem?: string;
      canal?: string;
      codigoProduto?: string;
      limite?: number;
    } = {}
  ): Promise<EventoTrackingComercial[]> {
    const eventos = await this.prisma.eventoTrackingComercial.findMany({
      where: {
        negocioId,
        ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros.origem ? { origem: filtros.origem } : {}),
        ...(filtros.canal ? { canal: filtros.canal } : {}),
        ...(filtros.codigoProduto ? { codigoProduto: filtros.codigoProduto } : {})
      },
      orderBy: { criadoEm: "desc" },
      take: filtros.limite ?? 1000
    });
    return eventos.map((evento) => this.mapearEvento(evento));
  }

  private mapearEvento(evento: {
    id: string;
    negocioId: string;
    tipo: string;
    entidadeTipo: string | null;
    entidadeId: string | null;
    slugLoja: string | null;
    codigoProduto: string | null;
    trackingId: string | null;
    origem: string | null;
    canal: string | null;
    utmJson: string;
    metadataJson: string;
    criadoEm: Date;
  }): EventoTrackingComercial {
    return {
      ...evento,
      tipo: evento.tipo as EventoTrackingComercial["tipo"],
      utm: this.lerMapaStrings(evento.utmJson),
      metadata: this.lerObjeto(evento.metadataJson)
    };
  }

  private contarPor<T extends string>(eventos: EventoTrackingComercial[], seletor: (evento: EventoTrackingComercial) => T) {
    return eventos.reduce<Record<T, number>>((acumulador, evento) => {
      const chave = seletor(evento);
      acumulador[chave] = (acumulador[chave] ?? 0) + 1;
      return acumulador;
    }, {} as Record<T, number>);
  }

  private montarFunil(eventos: EventoTrackingComercial[]): ResumoTrackingComercial["funil"] {
    const contar = (tipo: EventoTrackingComercial["tipo"]) => eventos.filter((evento) => evento.tipo === tipo).length;
    const pedidosCriados = eventos.filter((evento) => evento.tipo === "PEDIDO_CRIADO");
    const leads = new Set(
      eventos
        .map((evento) => evento.metadata.clienteNegocioId)
        .filter((clienteId): clienteId is string => typeof clienteId === "string" && Boolean(clienteId.trim()))
    );
    const receitaAtribuidaEmKwanza = pedidosCriados.reduce((total, evento) => {
      const valor = evento.metadata.totalEmKwanza;
      return total + (typeof valor === "number" && Number.isFinite(valor) ? valor : 0);
    }, 0);
    const visitas = contar("LOJA_VISITADA");
    const produtosVistos = contar("PRODUTO_VISTO");
    const cliquesWhatsApp = contar("WHATSAPP_CLICK");
    const checkoutsIniciados = contar("CHECKOUT_INICIADO");

    return {
      visitas,
      produtosVistos,
      cliquesWhatsApp,
      checkoutsIniciados,
      pedidosCriados: pedidosCriados.length,
      pagamentosConfirmados: contar("PAGAMENTO_CONFIRMADO"),
      comprasEntregues: contar("COMPRA_ENTREGUE"),
      leadsIdentificados: leads.size,
      receitaAtribuidaEmKwanza,
      taxaCheckoutPorVisita: this.percentual(checkoutsIniciados, visitas),
      taxaPedidoPorCheckout: this.percentual(pedidosCriados.length, checkoutsIniciados),
      taxaWhatsAppPorProduto: this.percentual(cliquesWhatsApp, produtosVistos)
    };
  }

  private percentual(parte: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((parte / total) * 10_000) / 100;
  }

  private lerMapaStrings(valor: string): Record<string, string> {
    const objeto = this.lerObjeto(valor);
    return Object.fromEntries(
      Object.entries(objeto).filter((entrada): entrada is [string, string] => typeof entrada[1] === "string")
    );
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

export class RepositorioTemplatesWhatsAppPrisma implements RepositorioTemplatesWhatsApp {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoTemplateWhatsAppNegocio): Promise<TemplateWhatsAppNegocio> {
    const template = await this.prisma.templateWhatsAppNegocio.create({
      data: {
        negocioId: dados.negocioId,
        nome: dados.nome,
        categoria: dados.categoria,
        idioma: dados.idioma ?? "pt_AO",
        provider: dados.provider ?? "whatsapp_cloud_api",
        estadoAprovacao: dados.estadoAprovacao ?? "rascunho",
        eventosCompativeisJson: this.serializar(dados.eventosCompativeis ?? []),
        variaveisJson: this.serializar(dados.variaveis ?? []),
        corpo: dados.corpo,
        ativo: dados.ativo ?? true,
        motivoUltimaAlteracao: dados.motivoUltimaAlteracao ?? null
      }
    });

    return this.mapear(template);
  }

  async listar(negocioId: string): Promise<TemplateWhatsAppNegocio[]> {
    const templates = await this.prisma.templateWhatsAppNegocio.findMany({
      where: { negocioId },
      orderBy: { atualizadoEm: "desc" }
    });
    return templates.map((template) => this.mapear(template));
  }

  async buscarPorId(id: string, negocioId: string): Promise<TemplateWhatsAppNegocio | null> {
    const template = await this.prisma.templateWhatsAppNegocio.findFirst({ where: { id, negocioId } });
    return template ? this.mapear(template) : null;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoTemplateWhatsAppNegocio
  ): Promise<TemplateWhatsAppNegocio | null> {
    const atual = await this.prisma.templateWhatsAppNegocio.findFirst({ where: { id, negocioId } });
    if (!atual) return null;
    const template = await this.prisma.templateWhatsAppNegocio.update({
      where: { id },
      data: {
        nome: dados.nome,
        categoria: dados.categoria,
        idioma: dados.idioma,
        provider: dados.provider,
        estadoAprovacao: dados.estadoAprovacao,
        eventosCompativeisJson: dados.eventosCompativeis ? this.serializar(dados.eventosCompativeis) : undefined,
        variaveisJson: dados.variaveis ? this.serializar(dados.variaveis) : undefined,
        corpo: dados.corpo,
        ativo: dados.ativo,
        versao: dados.corpo && dados.corpo !== atual.corpo ? { increment: 1 } : undefined,
        motivoUltimaAlteracao: dados.motivoUltimaAlteracao
      }
    });
    return this.mapear(template);
  }

  private mapear(template: {
    id: string;
    negocioId: string;
    nome: string;
    categoria: string;
    idioma: string;
    provider: string;
    estadoAprovacao: string;
    eventosCompativeisJson: string;
    variaveisJson: string;
    corpo: string;
    ativo: boolean;
    versao: number;
    motivoUltimaAlteracao: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): TemplateWhatsAppNegocio {
    return {
      id: template.id,
      negocioId: template.negocioId,
      nome: template.nome,
      categoria: template.categoria as TemplateWhatsAppNegocio["categoria"],
      idioma: template.idioma,
      provider: template.provider as TemplateWhatsAppNegocio["provider"],
      estadoAprovacao: template.estadoAprovacao as TemplateWhatsAppNegocio["estadoAprovacao"],
      eventosCompativeis: this.lerLista(template.eventosCompativeisJson),
      variaveis: this.lerLista(template.variaveisJson),
      corpo: template.corpo,
      ativo: template.ativo,
      versao: template.versao,
      motivoUltimaAlteracao: template.motivoUltimaAlteracao,
      criadoEm: template.criadoEm,
      atualizadoEm: template.atualizadoEm
    };
  }

  private lerLista(valor: string): string[] {
    try {
      const dados = JSON.parse(valor);
      return Array.isArray(dados) ? dados.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor);
  }
}

export class RepositorioCampanhasPrisma implements RepositorioCampanhas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaCampanhaCrm): Promise<CampanhaCrm> {
    const campanha = await this.prisma.campanhaCrm.create({
      data: {
        negocioId: dados.negocioId,
        nome: dados.nome,
        objetivo: dados.objetivo,
        canal: dados.canal,
        templateId: dados.templateId,
        categoria: dados.categoria,
        segmentoJson: this.serializar(dados.segmento ?? {}),
        limiteDiario: dados.limiteDiario ?? 500,
        janelaInicio: dados.janelaInicio ?? null,
        janelaFim: dados.janelaFim ?? null,
        metricasJson: this.serializar(metricasCampanhaZeradas()),
        criadaPorUsuarioId: dados.criadaPorUsuarioId ?? null
      }
    });
    return this.mapearCampanha(campanha);
  }

  async listar(negocioId: string, filtros: FiltrosCampanhasCrm = {}): Promise<CampanhaCrm[]> {
    const where: Prisma.CampanhaCrmWhereInput = { negocioId };
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.canal) where.canal = filtros.canal;
    const campanhas = await this.prisma.campanhaCrm.findMany({
      where,
      orderBy: { criadaEm: "desc" },
      take: Math.max(1, Math.min(filtros.limite ?? 100, 500))
    });
    return campanhas.map((campanha) => this.mapearCampanha(campanha));
  }

  async buscarPorId(id: string, negocioId: string): Promise<CampanhaCrm | null> {
    const campanha = await this.prisma.campanhaCrm.findFirst({ where: { id, negocioId } });
    return campanha ? this.mapearCampanha(campanha) : null;
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoCampanhaCrm): Promise<CampanhaCrm | null> {
    const atual = await this.prisma.campanhaCrm.findFirst({ where: { id, negocioId } });
    if (!atual) return null;
    const campanha = await this.prisma.campanhaCrm.update({
      where: { id },
      data: {
        estado: dados.estado,
        metricasJson: dados.metricas ? this.serializar(dados.metricas) : undefined,
        pausadaEm: dados.pausadaEm,
        motivoPausa: dados.motivoPausa,
        confirmadaEm: dados.confirmadaEm
      }
    });
    return this.mapearCampanha(campanha);
  }

  async registrarItens(campanhaId: string, itens: NovoItemCampanhaCrm[]): Promise<ItemCampanhaCrm[]> {
    await this.prisma.itemCampanhaCrm.deleteMany({ where: { campanhaId } });
    if (itens.length === 0) return [];
    await this.prisma.itemCampanhaCrm.createMany({
      data: itens.map((item) => ({
        negocioId: item.negocioId,
        campanhaId,
        clienteId: item.clienteId ?? null,
        telefone: item.telefone ?? null,
        nomeCliente: item.nomeCliente ?? null,
        status: item.status,
        motivoBloqueio: item.motivoBloqueio ?? null,
        outboxMensagemId: item.outboxMensagemId ?? null,
        contextoJson: this.serializar(item.contexto ?? {})
      }))
    });
    return this.listarItens(campanhaId, itens[0]?.negocioId ?? "");
  }

  async listarItens(campanhaId: string, negocioId: string): Promise<ItemCampanhaCrm[]> {
    const itens = await this.prisma.itemCampanhaCrm.findMany({
      where: { campanhaId, negocioId },
      orderBy: { criadoEm: "asc" }
    });
    return itens.map((item) => this.mapearItem(item));
  }

  private mapearCampanha(campanha: {
    id: string;
    negocioId: string;
    nome: string;
    objetivo: string;
    canal: string;
    templateId: string;
    categoria: string;
    estado: string;
    segmentoJson: string;
    limiteDiario: number;
    janelaInicio: Date | null;
    janelaFim: Date | null;
    metricasJson: string;
    criadaPorUsuarioId: string | null;
    pausadaEm: Date | null;
    motivoPausa: string | null;
    confirmadaEm: Date | null;
    criadaEm: Date;
    atualizadaEm: Date;
  }): CampanhaCrm {
    return {
      ...campanha,
      categoria: campanha.categoria as CampanhaCrm["categoria"],
      estado: campanha.estado as CampanhaCrm["estado"],
      segmento: this.lerObjeto(campanha.segmentoJson),
      metricas: {
        ...metricasCampanhaZeradas(),
        ...this.lerObjeto(campanha.metricasJson)
      }
    };
  }

  private mapearItem(item: {
    id: string;
    negocioId: string;
    campanhaId: string;
    clienteId: string | null;
    telefone: string | null;
    nomeCliente: string | null;
    status: string;
    motivoBloqueio: string | null;
    outboxMensagemId: string | null;
    contextoJson: string;
    criadoEm: Date;
    atualizadoEm: Date;
  }): ItemCampanhaCrm {
    return {
      ...item,
      status: item.status as ItemCampanhaCrm["status"],
      contexto: this.lerObjeto(item.contextoJson)
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor);
  }
}

export class RepositorioEventosOperacionaisPrisma implements RepositorioEventosOperacionais {
  constructor(private readonly prisma: PrismaClient) {}

  async registrar(dados: NovoEventoOperacional): Promise<{ evento: EventoOperacional; duplicado: boolean }> {
    if (dados.idempotencyKey) {
      const existente = await this.prisma.eventoOperacional.findUnique({
        where: { negocioId_idempotencyKey: { negocioId: dados.negocioId, idempotencyKey: dados.idempotencyKey } }
      });
      if (existente) return { evento: this.mapear(existente), duplicado: true };
    }

    const evento = await this.prisma.eventoOperacional.create({
      data: {
        negocioId: dados.negocioId,
        topico: dados.topico,
        tipo: dados.tipo,
        entidadeTipo: dados.entidadeTipo ?? null,
        entidadeId: dados.entidadeId ?? null,
        idempotencyKey: dados.idempotencyKey ?? null,
        payloadJson: JSON.stringify(dados.payload ?? {}),
        estado: dados.estado ?? "PENDENTE",
        proximaTentativaEm: dados.proximaTentativaEm ?? null
      }
    });
    return { evento: this.mapear(evento), duplicado: false };
  }

  async listar(negocioId: string, filtros: FiltrosEventosOperacionais = {}): Promise<EventoOperacional[]> {
    const where: Prisma.EventoOperacionalWhereInput = { negocioId };
    if (filtros.topico) where.topico = filtros.topico;
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.entidadeTipo) where.entidadeTipo = filtros.entidadeTipo;
    if (filtros.entidadeId) where.entidadeId = filtros.entidadeId;
    if (filtros.estado) where.estado = filtros.estado;
    const eventos = await this.prisma.eventoOperacional.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: Math.max(1, Math.min(filtros.limite ?? 100, 500))
    });
    return eventos.map((evento) => this.mapear(evento));
  }

  private mapear(evento: {
    id: string;
    negocioId: string;
    topico: string;
    tipo: string;
    entidadeTipo: string | null;
    entidadeId: string | null;
    idempotencyKey: string | null;
    payloadJson: string;
    estado: string;
    tentativas: number;
    proximaTentativaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): EventoOperacional {
    return {
      ...evento,
      estado: evento.estado as EventoOperacional["estado"],
      payload: this.lerObjeto(evento.payloadJson)
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

export class RepositorioJobsOperacionaisPrisma implements RepositorioJobsOperacionais {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoJobOperacional): Promise<{ job: JobOperacional; duplicado: boolean }> {
    if (dados.idempotencyKey) {
      const existente = await this.buscarPorIdempotencyKey(dados.negocioId, dados.idempotencyKey);
      if (existente) return { job: existente, duplicado: true };
    }

    const job = await this.prisma.jobOperacional.create({
      data: {
        negocioId: dados.negocioId,
        tipo: dados.tipo,
        estado: dados.estado ?? "PENDENTE",
        idempotencyKey: dados.idempotencyKey ?? null,
        total: dados.total ?? 0,
        processados: dados.processados ?? 0,
        erros: dados.erros ?? 0,
        resultadoJson: JSON.stringify(dados.resultado ?? {}),
        erro: dados.erro ?? null,
        concluidoEm: dados.concluidoEm ?? null
      }
    });
    return { job: this.mapear(job), duplicado: false };
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoJobOperacional): Promise<JobOperacional | null> {
    const atual = await this.prisma.jobOperacional.findFirst({ where: { id, negocioId } });
    if (!atual) return null;
    const job = await this.prisma.jobOperacional.update({
      where: { id },
      data: {
        estado: dados.estado,
        total: dados.total,
        processados: dados.processados,
        erros: dados.erros,
        resultadoJson: dados.resultado ? JSON.stringify(dados.resultado) : undefined,
        erro: dados.erro,
        concluidoEm: dados.concluidoEm
      }
    });
    return this.mapear(job);
  }

  async buscarPorId(id: string, negocioId: string): Promise<JobOperacional | null> {
    const job = await this.prisma.jobOperacional.findFirst({ where: { id, negocioId } });
    return job ? this.mapear(job) : null;
  }

  async buscarPorIdempotencyKey(negocioId: string, idempotencyKey: string): Promise<JobOperacional | null> {
    const job = await this.prisma.jobOperacional.findUnique({
      where: { negocioId_idempotencyKey: { negocioId, idempotencyKey } }
    });
    return job ? this.mapear(job) : null;
  }

  private mapear(job: {
    id: string;
    negocioId: string;
    tipo: string;
    estado: string;
    idempotencyKey: string | null;
    total: number;
    processados: number;
    erros: number;
    resultadoJson: string;
    erro: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
    concluidoEm: Date | null;
  }): JobOperacional {
    return {
      ...job,
      estado: job.estado as JobOperacional["estado"],
      resultado: this.lerObjeto(job.resultadoJson)
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

export class RepositorioMembrosNegocioPrisma implements RepositorioMembrosNegocio {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(negocioId: string): Promise<MembroNegocioOperacional[]> {
    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId },
      include: { usuario: true },
      orderBy: { criadoEm: "asc" }
    });
    return membros.map((membro) => this.mapear(membro));
  }

  async criar(dados: NovoMembroNegocioOperacional): Promise<MembroNegocioOperacional> {
    const usuario = await this.prisma.usuarioSistema.upsert({
      where: { telefone: dados.telefone },
      create: {
        telefone: dados.telefone,
        nome: dados.nome,
        email: dados.email ?? null,
        origemCadastro: "TELEFONE"
      },
      update: {
        nome: dados.nome,
        email: dados.email ?? undefined
      }
    });
    const membro = await this.prisma.membroNegocio.upsert({
      where: { negocioId_usuarioId: { negocioId: dados.negocioId, usuarioId: usuario.id } },
      create: {
        negocioId: dados.negocioId,
        usuarioId: usuario.id,
        papel: dados.papel,
        status: "ATIVO",
        permissoesJson: JSON.stringify(dados.permissoes ?? [])
      },
      update: {
        papel: dados.papel,
        status: "ATIVO",
        permissoesJson: JSON.stringify(dados.permissoes ?? [])
      },
      include: { usuario: true }
    });
    return this.mapear(membro);
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoMembroNegocioOperacional
  ): Promise<MembroNegocioOperacional | null> {
    const atual = await this.prisma.membroNegocio.findFirst({ where: { id, negocioId } });
    if (!atual) return null;
    const membro = await this.prisma.membroNegocio.update({
      where: { id },
      data: {
        papel: dados.papel,
        status: dados.status,
        permissoesJson: dados.permissoes ? JSON.stringify(dados.permissoes) : undefined
      },
      include: { usuario: true }
    });
    return this.mapear(membro);
  }

  private mapear(membro: {
    id: string;
    negocioId: string;
    usuarioId: string;
    papel: string;
    status: string;
    permissoesJson: string;
    criadoEm: Date;
    atualizadoEm: Date;
    usuario: {
      nome: string;
      telefone: string | null;
      email: string | null;
      avatarUrl: string | null;
    };
  }): MembroNegocioOperacional {
    return {
      id: membro.id,
      negocioId: membro.negocioId,
      usuarioId: membro.usuarioId,
      nome: membro.usuario.nome,
      telefone: membro.usuario.telefone,
      email: membro.usuario.email,
      avatarUrl: membro.usuario.avatarUrl,
      papel: membro.papel as MembroNegocioOperacional["papel"],
      status: membro.status as MembroNegocioOperacional["status"],
      permissoes: this.lerLista(membro.permissoesJson),
      criadoEm: membro.criadoEm,
      atualizadoEm: membro.atualizadoEm
    };
  }

  private lerLista(valor: string): string[] {
    try {
      const dados = JSON.parse(valor);
      return Array.isArray(dados) ? dados.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
}

export class RepositorioAfiliadosPrisma implements RepositorioAfiliados {
  constructor(private readonly prisma: PrismaClient) {}

  async criarParceiro(dados: NovoParceiroComercial): Promise<ParceiroComercial> {
    const parceiro = await this.prisma.parceiroComercial.create({
      data: {
        negocioId: dados.negocioId,
        tipo: dados.tipo,
        codigo: this.normalizarCodigo(dados.codigo),
        nomePublico: dados.nomePublico,
        contacto: dados.contacto ?? null,
        estado: dados.estado ?? "ATIVO",
        regraComissaoJson: this.serializar(dados.regraComissao),
        metodoPagamentoJson: this.serializar(dados.metodoPagamento ?? {})
      }
    });
    return this.mapearParceiro(parceiro);
  }

  async listarParceiros(negocioId: string): Promise<ParceiroComercial[]> {
    const parceiros = await this.prisma.parceiroComercial.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });
    return parceiros.map((parceiro) => this.mapearParceiro(parceiro));
  }

  async buscarParceiroPorId(id: string, negocioId: string): Promise<ParceiroComercial | null> {
    const parceiro = await this.prisma.parceiroComercial.findFirst({ where: { id, negocioId } });
    return parceiro ? this.mapearParceiro(parceiro) : null;
  }

  async criarLink(dados: NovoLinkAfiliado): Promise<LinkAfiliado> {
    const link = await this.prisma.linkAfiliado.create({
      data: {
        negocioId: dados.negocioId,
        afiliadoId: dados.afiliadoId,
        codigo: this.normalizarCodigo(dados.codigo),
        destinoTipo: dados.destinoTipo,
        slugLoja: dados.slugLoja ?? null,
        codigoProduto: dados.codigoProduto ? this.normalizarCodigo(dados.codigoProduto) : null,
        canal: dados.canal ?? null,
        origemConteudo: dados.origemConteudo ?? null,
        ativo: dados.ativo ?? true,
        expiraEm: dados.expiraEm ?? null
      }
    });
    return this.mapearLink(link);
  }

  async listarLinks(negocioId: string): Promise<LinkAfiliado[]> {
    const links = await this.prisma.linkAfiliado.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });
    return links.map((link) => this.mapearLink(link));
  }

  async buscarLinkPorCodigo(codigo: string, negocioId?: string): Promise<LinkAfiliado | null> {
    const normalizado = this.normalizarCodigo(codigo);
    const link = await this.prisma.linkAfiliado.findFirst({
      where: {
        codigo: normalizado,
        ...(negocioId ? { negocioId } : {})
      }
    });
    return link ? this.mapearLink(link) : null;
  }

  async criarOuAtualizarComissao(dados: NovaComissaoParceiro): Promise<ComissaoParceiro> {
    const existente = await this.prisma.comissaoParceiro.findUnique({
      where: { negocioId_pedidoId: { negocioId: dados.negocioId, pedidoId: dados.pedidoId } }
    });

    const comissao = await this.prisma.$transaction(async (transacao) => {
      const registro = await transacao.comissaoParceiro.upsert({
        where: {
          negocioId_pedidoId: {
            negocioId: dados.negocioId,
            pedidoId: dados.pedidoId
          }
        },
        create: {
          negocioId: dados.negocioId,
          afiliadoId: dados.afiliadoId,
          linkId: dados.linkId ?? null,
          pedidoId: dados.pedidoId,
          status: dados.status ?? "ESTIMADA",
          baseEmKwanza: dados.baseEmKwanza,
          valorEmKwanza: dados.valorEmKwanza,
          moeda: dados.moeda ?? "AOA",
          motivo: dados.motivo ?? null
        },
        update: {
          afiliadoId: dados.afiliadoId,
          linkId: dados.linkId ?? null,
          status: dados.status ?? undefined,
          baseEmKwanza: dados.baseEmKwanza,
          valorEmKwanza: dados.valorEmKwanza,
          moeda: dados.moeda ?? undefined,
          motivo: dados.motivo ?? undefined
        }
      });
      await transacao.historicoComissaoParceiro.create({
        data: this.dadosHistoricoComissao(registro, existente ? "ATUALIZADA" : "CRIADA", {
          statusAnterior: existente?.status ?? null,
          motivo: registro.motivo,
          metadata: {
            baseEmKwanza: registro.baseEmKwanza,
            linkId: registro.linkId
          }
        })
      });
      return registro;
    });
    return this.mapearComissao(comissao);
  }

  async listarComissoes(negocioId: string): Promise<ComissaoParceiro[]> {
    const comissoes = await this.prisma.comissaoParceiro.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });
    return comissoes.map((comissao) => this.mapearComissao(comissao));
  }

  async confirmarComissaoPorPedido(
    pedidoId: string,
    negocioId: string,
    confirmadoEm = new Date()
  ): Promise<ComissaoParceiro | null> {
    const existente = await this.prisma.comissaoParceiro.findUnique({
      where: { negocioId_pedidoId: { negocioId, pedidoId } }
    });
    if (!existente) return null;
    if (existente.status === "REVERTIDA" || existente.status === "CANCELADA" || existente.status === "PAGA") {
      return this.mapearComissao(existente);
    }
    if (existente.status === "CONFIRMADA") return this.mapearComissao(existente);

    const comissao = await this.prisma.$transaction(async (transacao) => {
      const registro = await transacao.comissaoParceiro.update({
        where: { id: existente.id },
        data: {
          status: "CONFIRMADA",
          confirmadoEm,
          revertidoEm: null
        }
      });
      await transacao.historicoComissaoParceiro.create({
        data: this.dadosHistoricoComissao(registro, "CONFIRMADA", {
          statusAnterior: existente.status,
          motivo: "Pagamento do pedido confirmado.",
          criadoEm: confirmadoEm
        })
      });
      return registro;
    });
    return this.mapearComissao(comissao);
  }

  async marcarComissaoPaga(
    id: string,
    negocioId: string,
    dados: { referenciaPagamento: string; observacao?: string | null; pagoEm?: Date; autorId?: string | null; autorNome?: string | null }
  ): Promise<ComissaoParceiro | null> {
    const existente = await this.prisma.comissaoParceiro.findFirst({ where: { id, negocioId } });
    if (!existente) return null;
    if (existente.status !== "CONFIRMADA") {
      throw new Error("Apenas comissão confirmada pode ser marcada como paga.");
    }

    const pagoEm = dados.pagoEm ?? new Date();
    const comissao = await this.prisma.$transaction(async (transacao) => {
      const registro = await transacao.comissaoParceiro.update({
        where: { id: existente.id },
        data: {
          status: "PAGA",
          pagoEm,
          referenciaPagamento: dados.referenciaPagamento,
          observacaoPagamento: dados.observacao ?? null,
          lotePagamentoId: null
        }
      });
      await transacao.historicoComissaoParceiro.create({
        data: this.dadosHistoricoComissao(registro, "PAGA", {
          statusAnterior: existente.status,
          motivo: dados.observacao ?? null,
          referencia: dados.referenciaPagamento,
          autorId: dados.autorId ?? null,
          autorNome: dados.autorNome ?? null,
          criadoEm: pagoEm
        })
      });
      return registro;
    });
    return this.mapearComissao(comissao);
  }

  async reverterComissaoPorPedido(
    pedidoId: string,
    negocioId: string,
    motivo: string,
    revertidoEm = new Date()
  ): Promise<ComissaoParceiro | null> {
    const existente = await this.prisma.comissaoParceiro.findUnique({
      where: { negocioId_pedidoId: { negocioId, pedidoId } }
    });
    if (!existente) return null;

    const comissao = await this.prisma.$transaction(async (transacao) => {
      const registro = await transacao.comissaoParceiro.update({
        where: { id: existente.id },
        data: {
          status: "REVERTIDA",
          motivo,
          revertidoEm
        }
      });
      await transacao.historicoComissaoParceiro.create({
        data: this.dadosHistoricoComissao(registro, "REVERTIDA", {
          statusAnterior: existente.status,
          motivo,
          criadoEm: revertidoEm
        })
      });
      return registro;
    });
    return this.mapearComissao(comissao);
  }

  async listarHistoricoComissao(comissaoId: string, negocioId: string): Promise<HistoricoComissaoParceiro[] | null> {
    const comissao = await this.prisma.comissaoParceiro.findFirst({
      where: { id: comissaoId, negocioId },
      select: { id: true }
    });
    if (!comissao) return null;

    const eventos = await this.prisma.historicoComissaoParceiro.findMany({
      where: { comissaoId, negocioId },
      orderBy: { criadoEm: "desc" }
    });
    return eventos.map((evento) => this.mapearHistoricoComissao(evento));
  }

  async criarLotePagamentoComissoes(dados: NovoLotePagamentoComissao): Promise<LotePagamentoComissao> {
    const comissaoIds = [...new Set(dados.comissaoIds)];
    const loteId = await this.prisma.$transaction(async (transacao) => {
      const comissoes = await transacao.comissaoParceiro.findMany({
        where: {
          negocioId: dados.negocioId,
          id: { in: comissaoIds }
        }
      });

      if (comissoes.length !== comissaoIds.length) {
        throw new Error("Todas as comissões do lote precisam existir no negócio.");
      }

      const comissaoInvalida = comissoes.find((comissao) => comissao.status !== "CONFIRMADA");
      if (comissaoInvalida) {
        throw new Error("Apenas comissões confirmadas podem entrar num lote de pagamento.");
      }

      const agora = new Date();
      const valorTotalEmKwanza = comissoes.reduce((total, comissao) => total + comissao.valorEmKwanza, 0);
      const lote = await transacao.lotePagamentoComissao.create({
        data: {
          negocioId: dados.negocioId,
          referenciaPagamento: dados.referenciaPagamento,
          observacao: dados.observacao ?? null,
          status: "PAGO",
          quantidadeComissoes: comissoes.length,
          valorTotalEmKwanza,
          moeda: comissoes[0]?.moeda ?? "AOA",
          periodoInicio: dados.periodoInicio ?? null,
          periodoFim: dados.periodoFim ?? null,
          autorId: dados.autorId ?? null,
          autorNome: dados.autorNome ?? null,
          criadoEm: agora
        }
      });

      for (const comissao of comissoes) {
        const registro = await transacao.comissaoParceiro.update({
          where: { id: comissao.id },
          data: {
            status: "PAGA",
            pagoEm: agora,
            referenciaPagamento: dados.referenciaPagamento,
            observacaoPagamento: dados.observacao ?? null,
            lotePagamentoId: lote.id
          }
        });
        await transacao.itemLotePagamentoComissao.create({
          data: {
            negocioId: dados.negocioId,
            loteId: lote.id,
            comissaoId: registro.id,
            afiliadoId: registro.afiliadoId,
            pedidoId: registro.pedidoId,
            valorEmKwanza: registro.valorEmKwanza,
            moeda: registro.moeda,
            statusAnterior: comissao.status,
            statusNovo: registro.status,
            criadoEm: agora
          }
        });
        await transacao.historicoComissaoParceiro.create({
          data: this.dadosHistoricoComissao(registro, "PAGA", {
            statusAnterior: comissao.status,
            motivo: dados.observacao ?? null,
            referencia: dados.referenciaPagamento,
            autorId: dados.autorId ?? null,
            autorNome: dados.autorNome ?? null,
            metadata: { lotePagamentoId: lote.id },
            criadoEm: agora
          })
        });
      }

      return lote.id;
    });

    const lote = await this.prisma.lotePagamentoComissao.findFirst({
      where: { id: loteId, negocioId: dados.negocioId },
      include: { itens: { orderBy: { criadoEm: "asc" } } }
    });
    if (!lote) throw new Error("Lote de pagamento não encontrado após criação.");
    return this.mapearLotePagamentoComissao(lote);
  }

  async listarLotesPagamentoComissoes(negocioId: string): Promise<LotePagamentoComissao[]> {
    const lotes = await this.prisma.lotePagamentoComissao.findMany({
      where: { negocioId },
      include: { itens: { orderBy: { criadoEm: "asc" } } },
      orderBy: { criadoEm: "desc" }
    });
    return lotes.map((lote) => this.mapearLotePagamentoComissao(lote));
  }

  async resumir(negocioId: string): Promise<ResumoAfiliadosComerciais> {
    const [parceiros, links, comissoes] = await Promise.all([
      this.listarParceiros(negocioId),
      this.listarLinks(negocioId),
      this.listarComissoes(negocioId)
    ]);
    const parceiroPorId = new Map(parceiros.map((parceiro) => [parceiro.id, parceiro]));
    const rankingPorAfiliado = new Map<
      string,
      {
        afiliadoId: string;
        codigo: string;
        nomePublico: string;
        pedidos: Set<string>;
        comissaoConfirmadaEmKwanza: number;
        comissaoPagaEmKwanza: number;
      }
    >();

    for (const comissao of comissoes) {
      const parceiro = parceiroPorId.get(comissao.afiliadoId);
      const item = rankingPorAfiliado.get(comissao.afiliadoId) ?? {
        afiliadoId: comissao.afiliadoId,
        codigo: parceiro?.codigo ?? "",
        nomePublico: parceiro?.nomePublico ?? "Parceiro removido",
        pedidos: new Set<string>(),
        comissaoConfirmadaEmKwanza: 0,
        comissaoPagaEmKwanza: 0
      };
      item.pedidos.add(comissao.pedidoId);
      if (comissao.status === "CONFIRMADA") item.comissaoConfirmadaEmKwanza += comissao.valorEmKwanza;
      if (comissao.status === "PAGA") item.comissaoPagaEmKwanza += comissao.valorEmKwanza;
      rankingPorAfiliado.set(comissao.afiliadoId, item);
    }

    return {
      totalParceiros: parceiros.length,
      totalLinks: links.length,
      pedidosAtribuidos: new Set(comissoes.map((comissao) => comissao.pedidoId)).size,
      comissaoEstimadaEmKwanza: this.somarComissoesPorStatus(comissoes, "ESTIMADA"),
      comissaoConfirmadaEmKwanza: this.somarComissoesPorStatus(comissoes, "CONFIRMADA"),
      comissaoPagaEmKwanza: this.somarComissoesPorStatus(comissoes, "PAGA"),
      comissaoRevertidaEmKwanza: this.somarComissoesPorStatus(comissoes, "REVERTIDA"),
      ranking: [...rankingPorAfiliado.values()]
        .map((item) => ({
          ...item,
          pedidos: item.pedidos.size
        }))
        .sort((a, b) => b.comissaoConfirmadaEmKwanza - a.comissaoConfirmadaEmKwanza)
    };
  }

  private mapearParceiro(parceiro: {
    id: string;
    negocioId: string;
    tipo: string;
    codigo: string;
    nomePublico: string;
    contacto: string | null;
    estado: string;
    regraComissaoJson: string;
    metodoPagamentoJson: string;
    criadoEm: Date;
    atualizadoEm: Date;
  }): ParceiroComercial {
    return {
      ...parceiro,
      tipo: parceiro.tipo as ParceiroComercial["tipo"],
      estado: parceiro.estado as ParceiroComercial["estado"],
      regraComissao: this.lerRegraComissao(parceiro.regraComissaoJson),
      metodoPagamento: this.lerObjeto(parceiro.metodoPagamentoJson)
    };
  }

  private mapearLink(link: {
    id: string;
    negocioId: string;
    afiliadoId: string;
    codigo: string;
    destinoTipo: string;
    slugLoja: string | null;
    codigoProduto: string | null;
    canal: string | null;
    origemConteudo: string | null;
    ativo: boolean;
    expiraEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): LinkAfiliado {
    return { ...link };
  }

  private mapearComissao(comissao: {
    id: string;
    negocioId: string;
    afiliadoId: string;
    linkId: string | null;
    pedidoId: string;
    lotePagamentoId: string | null;
    status: string;
    baseEmKwanza: number;
    valorEmKwanza: number;
    moeda: string;
    motivo: string | null;
    criadoEm: Date;
    confirmadoEm: Date | null;
    pagoEm: Date | null;
    referenciaPagamento: string | null;
    observacaoPagamento: string | null;
    revertidoEm: Date | null;
    atualizadoEm: Date;
  }): ComissaoParceiro {
    return {
      ...comissao,
      status: comissao.status as ComissaoParceiro["status"]
    };
  }

  private mapearLotePagamentoComissao(lote: {
    id: string;
    negocioId: string;
    referenciaPagamento: string;
    observacao: string | null;
    status: string;
    quantidadeComissoes: number;
    valorTotalEmKwanza: number;
    moeda: string;
    periodoInicio: Date | null;
    periodoFim: Date | null;
    autorId: string | null;
    autorNome: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
    itens: Array<{
      id: string;
      negocioId: string;
      loteId: string;
      comissaoId: string;
      afiliadoId: string;
      pedidoId: string;
      valorEmKwanza: number;
      moeda: string;
      statusAnterior: string;
      statusNovo: string;
      criadoEm: Date;
    }>;
  }): LotePagamentoComissao {
    return {
      ...lote,
      status: lote.status as LotePagamentoComissao["status"],
      itens: lote.itens.map((item) => this.mapearItemLotePagamentoComissao(item))
    };
  }

  private mapearItemLotePagamentoComissao(item: {
    id: string;
    negocioId: string;
    loteId: string;
    comissaoId: string;
    afiliadoId: string;
    pedidoId: string;
    valorEmKwanza: number;
    moeda: string;
    statusAnterior: string;
    statusNovo: string;
    criadoEm: Date;
  }): ItemLotePagamentoComissao {
    return {
      ...item,
      statusAnterior: item.statusAnterior as ItemLotePagamentoComissao["statusAnterior"],
      statusNovo: item.statusNovo as ItemLotePagamentoComissao["statusNovo"]
    };
  }

  private mapearHistoricoComissao(evento: {
    id: string;
    negocioId: string;
    comissaoId: string;
    afiliadoId: string;
    pedidoId: string;
    tipo: string;
    statusAnterior: string | null;
    statusNovo: string;
    valorEmKwanza: number;
    moeda: string;
    motivo: string | null;
    referencia: string | null;
    autorId: string | null;
    autorNome: string | null;
    metadataJson: string;
    criadoEm: Date;
  }): HistoricoComissaoParceiro {
    const { metadataJson, ...dados } = evento;
    return {
      ...dados,
      tipo: evento.tipo as HistoricoComissaoParceiro["tipo"],
      statusAnterior: evento.statusAnterior as HistoricoComissaoParceiro["statusAnterior"],
      statusNovo: evento.statusNovo as HistoricoComissaoParceiro["statusNovo"],
      metadata: this.lerObjeto(metadataJson)
    };
  }

  private dadosHistoricoComissao(
    comissao: {
      id: string;
      negocioId: string;
      afiliadoId: string;
      pedidoId: string;
      status: string;
      valorEmKwanza: number;
      moeda: string;
    },
    tipo: TipoHistoricoComissaoParceiro,
    dados: {
      statusAnterior?: string | null;
      motivo?: string | null;
      referencia?: string | null;
      autorId?: string | null;
      autorNome?: string | null;
      metadata?: Record<string, unknown>;
      criadoEm?: Date;
    } = {}
  ) {
    return {
      negocioId: comissao.negocioId,
      comissaoId: comissao.id,
      afiliadoId: comissao.afiliadoId,
      pedidoId: comissao.pedidoId,
      tipo,
      statusAnterior: dados.statusAnterior ?? null,
      statusNovo: comissao.status,
      valorEmKwanza: comissao.valorEmKwanza,
      moeda: comissao.moeda,
      motivo: dados.motivo ?? null,
      referencia: dados.referencia ?? null,
      autorId: dados.autorId ?? null,
      autorNome: dados.autorNome ?? null,
      metadataJson: this.serializar(dados.metadata ?? {}),
      criadoEm: dados.criadoEm
    };
  }

  private somarComissoesPorStatus(comissoes: ComissaoParceiro[], status: ComissaoParceiro["status"]): number {
    return comissoes
      .filter((comissao) => comissao.status === status)
      .reduce((total, comissao) => total + comissao.valorEmKwanza, 0);
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private lerRegraComissao(valor: string): ParceiroComercial["regraComissao"] {
    const regra = this.lerObjeto(valor);
    if (regra.tipo === "VALOR_FIXO") {
      return {
        tipo: "VALOR_FIXO",
        valorEmKwanza: typeof regra.valorEmKwanza === "number" ? regra.valorEmKwanza : 0
      };
    }

    return {
      tipo: "PERCENTUAL",
      percentual: typeof regra.percentual === "number" ? regra.percentual : 0
    };
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }
}

export class RepositorioReservasPrisma implements RepositorioReservas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaReserva): Promise<Reserva> {
    const peca = await this.prisma.peca.findFirst({
      where: {
        codigo: dados.codigoPeca,
        ...(dados.negocioId ? { negocioId: dados.negocioId } : {})
      },
      orderBy: { criadoEm: "asc" }
    });

    if (!peca) {
      throw new Error(`Peça #${dados.codigoPeca} não encontrada.`);
    }

    const reserva = await this.prisma.reserva.create({
      data: {
        pecaId: peca.id,
        negocioId: dados.negocioId ?? peca.negocioId ?? null,
        clienteNegocioId: dados.clienteNegocioId ?? null,
        codigoPeca: dados.codigoPeca,
        telefoneCliente: dados.telefoneCliente,
        nomeCliente: dados.nomeCliente,
        usernameCliente: dados.usernameCliente,
        userIdCliente: dados.userIdCliente ?? null,
        avatarUrlCliente: dados.avatarUrlCliente ?? null,
        estado: dados.estado,
        estadoPagamento: dados.estadoPagamento ?? "AGUARDANDO_COMPROVATIVO",
        comentarioOriginal: dados.comentarioOriginal,
        liveId: dados.liveId,
        expiraEm: dados.expiraEm,
        enderecoEntrega: dados.enderecoEntrega ?? null,
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null
      }
    });

    return this.mapearReserva(reserva);
  }

  async criarComControleDeStock(dados: DadosCriacaoReservaComControleStock) {
    return this.executarTransacaoComRetentativas(async () =>
      this.prisma.$transaction(
        async (tx) => {
          const peca = await tx.peca.findFirst({
            where: {
              codigo: dados.codigoPeca,
              ...(dados.negocioId ? { negocioId: dados.negocioId } : {})
            },
            orderBy: { criadoEm: "asc" }
          });

          if (!peca) {
            return {
              tipo: "REVISAO_MANUAL" as const,
              reserva: null,
              motivo: `Peça #${dados.codigoPeca} não encontrada.`
            };
          }

          if (peca.estado === "VENDIDA" || peca.estado === "ESGOTADA") {
            return {
              tipo: "PECA_INDISPONIVEL" as const,
              reserva: null,
              peca: this.mapearPeca(peca),
              motivo: `Peça #${peca.codigo} indisponível.`
            };
          }

          const reservasQueBloqueiamStock = await tx.reserva.count({
            where: {
              negocioId: peca.negocioId,
              codigoPeca: peca.codigo,
              estado: { in: estadosQueBloqueiamStock }
            }
          });
          const temStockLivre = peca.quantidade - reservasQueBloqueiamStock > 0;

          const reserva = await tx.reserva.create({
            data: {
              pecaId: peca.id,
              negocioId: dados.negocioId ?? peca.negocioId ?? null,
              clienteNegocioId: dados.clienteNegocioId ?? null,
              codigoPeca: peca.codigo,
              telefoneCliente: dados.telefoneCliente,
              nomeCliente: dados.nomeCliente,
              usernameCliente: dados.usernameCliente,
              userIdCliente: dados.userIdCliente ?? null,
              avatarUrlCliente: dados.avatarUrlCliente ?? null,
              estado: temStockLivre ? "WAITING_PAYMENT" : "WAITLISTED",
              estadoPagamento: "AGUARDANDO_COMPROVATIVO",
              comentarioOriginal: dados.comentarioOriginal,
              liveId: dados.liveId,
              expiraEm: temStockLivre ? dados.expiraEmReserva : null
            }
          });

          const pecaAtualizada =
            temStockLivre && reservasQueBloqueiamStock + 1 >= peca.quantidade
              ? await tx.peca.update({ where: { id: peca.id }, data: { estado: "RESERVADA" } })
              : peca;

          return {
            tipo: temStockLivre ? "RESERVA_CRIADA" as const : "FILA_ESPERA" as const,
            reserva: this.mapearReserva(reserva),
            peca: this.mapearPeca(pecaAtualizada)
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    ).catch(async (erro) => {
      if (this.ehViolacaoDeUnicidade(erro)) {
        const reservaExistente = await this.buscarReservaAtivaPorTelefoneEPeca(
          dados.telefoneCliente,
          dados.codigoPeca,
          dados.negocioId
        );
        const peca = await this.prisma.peca.findFirst({
          where: {
            codigo: dados.codigoPeca,
            ...(dados.negocioId ? { negocioId: dados.negocioId } : {})
          },
          orderBy: { criadoEm: "asc" }
        });
        return {
          tipo: "DUPLICADA" as const,
          reserva: reservaExistente,
          reservaExistente,
          peca: peca ? this.mapearPeca(peca) : null,
          motivo: "Cliente já possui reserva ativa para esta peça."
        };
      }

      throw erro;
    });
  }

  async listar(negocioId?: string | null): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: negocioId ? { negocioId } : undefined,
      orderBy: { criadaEm: "asc" }
    });
    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      }
    });
    return reserva ? this.mapearReserva(reserva) : null;
  }

  async buscarReservaAtivaPorTelefoneEPeca(
    telefone: string,
    codigoPeca: string,
    negocioId?: string | null
  ): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findFirst({
      where: {
        telefoneCliente: telefone,
        codigoPeca,
        ...(negocioId ? { negocioId } : {}),
        estado: { in: estadosAtivosParaDuplicidade }
      },
      orderBy: { criadaEm: "asc" }
    });

    return reserva ? this.mapearReserva(reserva) : null;
  }

  async contarReservasQueBloqueiamStock(codigoPeca: string, negocioId?: string | null): Promise<number> {
    return this.prisma.reserva.count({
      where: {
        codigoPeca,
        ...(negocioId ? { negocioId } : {}),
        estado: { in: estadosQueBloqueiamStock }
      }
    });
  }

  async listarFilaDaPeca(codigoPeca: string, negocioId?: string | null): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: { codigoPeca, ...(negocioId ? { negocioId } : {}), estado: "WAITLISTED" },
      orderBy: { criadaEm: "asc" }
    });

    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async listarReservasExpiradas(agora: Date): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: {
        estado: { in: ["PENDING", "RESERVED", "WAITING_PAYMENT"] },
        expiraEm: { lte: agora }
      },
      orderBy: { criadaEm: "asc" }
    });

    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async atualizarEstado(id: string, estado: EstadoReserva, expiraEm: Date | null = null): Promise<Reserva> {
    const reserva = await this.prisma.reserva.update({
      where: { id },
      data: { estado, expiraEm }
    });

    return this.mapearReserva(reserva);
  }

  async atualizarEstadoPagamento(
    id: string,
    estadoPagamento: EstadoPagamento,
    comprovativoPagamentoUrl: string | null = null
  ): Promise<Reserva> {
    const reserva = await this.prisma.reserva.update({
      where: { id },
      data: {
        estadoPagamento,
        comprovativoPagamentoUrl: comprovativoPagamentoUrl ?? undefined
      }
    });

    return this.mapearReserva(reserva);
  }

  async atualizarEnderecoEntrega(id: string, enderecoEntrega: string): Promise<Reserva> {
    const reserva = await this.prisma.reserva.update({
      where: { id },
      data: { enderecoEntrega }
    });

    return this.mapearReserva(reserva);
  }

  private mapearReserva(reserva: {
    id: string;
    negocioId: string | null;
    clienteNegocioId: string | null;
    codigoPeca: string;
    telefoneCliente: string;
    nomeCliente: string;
    usernameCliente: string;
    userIdCliente: string | null;
    avatarUrlCliente: string | null;
    estado: string;
    estadoPagamento: string;
    comentarioOriginal: string;
    liveId: string;
    expiraEm: Date | null;
    enderecoEntrega: string | null;
    comprovativoPagamentoUrl: string | null;
    criadaEm: Date;
    atualizadaEm: Date;
  }): Reserva {
    return {
      ...reserva,
      estado: reserva.estado as EstadoReserva,
      estadoPagamento: reserva.estadoPagamento as EstadoPagamento
    };
  }

  private mapearPeca(peca: {
    id: string;
    codigo: string;
    negocioId: string | null;
    sku: string | null;
    nome: string;
    descricao: string;
    categoria: string | null;
    colecao: string | null;
    precoEmKwanza: number;
    custoEmKwanza: number | null;
    quantidade: number;
    stockMinimo: number;
    fotosJson: string;
    variantesJson: string;
    estado: string;
    arquivadaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Peca {
    const margemEstimadaEmKwanza = this.calcularMargem(peca.precoEmKwanza, peca.custoEmKwanza);
    return {
      ...peca,
      fotos: this.lerFotos(peca.fotosJson),
      variantes: this.lerVariantes(peca.variantesJson),
      estado: peca.estado as EstadoPeca,
      margemEstimadaEmKwanza,
      estadoStock: this.calcularEstadoStock({
        arquivadaEm: peca.arquivadaEm,
        estado: peca.estado as EstadoPeca,
        quantidade: peca.quantidade,
        stockMinimo: peca.stockMinimo
      })
    };
  }

  private lerFotos(valor: string): string[] {
    try {
      const fotos = JSON.parse(valor);
      return Array.isArray(fotos) ? fotos.filter((foto) => typeof foto === "string") : [];
    } catch {
      return [];
    }
  }

  private lerVariantes(valor: string): Record<string, string[]> {
    try {
      const variantes = JSON.parse(valor);
      if (!variantes || typeof variantes !== "object" || Array.isArray(variantes)) return {};

      return Object.fromEntries(
        Object.entries(variantes)
          .filter(([, valores]) => Array.isArray(valores))
          .map(([nome, valores]) => [nome, (valores as unknown[]).filter((valor) => typeof valor === "string")])
      );
    } catch {
      return {};
    }
  }

  private calcularMargem(precoEmKwanza: number, custoEmKwanza: number | null): number | null {
    return custoEmKwanza === null ? null : precoEmKwanza - custoEmKwanza;
  }

  private calcularEstadoStock(peca: {
    arquivadaEm: Date | null;
    estado: EstadoPeca;
    quantidade: number;
    stockMinimo: number;
  }): Peca["estadoStock"] {
    if (peca.arquivadaEm) return "ARQUIVADO";
    if (peca.estado === "ESGOTADA" || peca.quantidade === 0) return "ESGOTADO";
    if (peca.stockMinimo > 0 && peca.quantidade <= peca.stockMinimo) return "BAIXO_STOCK";
    return "DISPONIVEL";
  }

  private async executarTransacaoComRetentativas<T>(operacao: () => Promise<T>, tentativa = 1): Promise<T> {
    try {
      return await operacao();
    } catch (erro) {
      const maxTentativas = Number(process.env.PRISMA_TRANSACAO_MAX_TENTATIVAS ?? 8);
      if (this.ehConflitoDeTransacao(erro) && tentativa < maxTentativas) {
        await new Promise((resolver) => setTimeout(resolver, tentativa * 50));
        return this.executarTransacaoComRetentativas(operacao, tentativa + 1);
      }

      throw erro;
    }
  }

  private ehConflitoDeTransacao(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034";
  }

  private ehViolacaoDeUnicidade(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
  }
}

type PedidoPrismaComItens = Prisma.PedidoGetPayload<{ include: { itens: true } }>;

export class RepositorioPedidosPrisma implements RepositorioPedidos {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: DadosPedidoResolvido): Promise<Pedido> {
    const pedido = await this.criarComRetentativa(dados);
    return this.mapearPedido(pedido);
  }

  async listar(negocioId: string, filtros: FiltrosPedidos = {}): Promise<Pedido[]> {
    const busca = filtros.busca?.trim();
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        negocioId,
        ...(filtros.estado ? { estado: filtros.estado } : {}),
        ...(filtros.estadoPagamento ? { estadoPagamento: filtros.estadoPagamento } : {}),
        ...(filtros.estadoEntrega ? { estadoEntrega: filtros.estadoEntrega } : {}),
        ...(filtros.clienteId ? { clienteNegocioId: filtros.clienteId } : {}),
        ...(filtros.canal ? { canal: { equals: filtros.canal, mode: "insensitive" } } : {}),
        ...(filtros.dataInicio || filtros.dataFim
          ? {
              criadoEm: {
                ...(filtros.dataInicio ? { gte: filtros.dataInicio } : {}),
                ...(filtros.dataFim ? { lte: filtros.dataFim } : {})
              }
            }
          : {}),
        ...(filtros.produto
          ? {
              itens: {
                some: {
                  OR: [
                    { codigoPeca: { contains: filtros.produto, mode: "insensitive" } },
                    { nomeProduto: { contains: filtros.produto, mode: "insensitive" } }
                  ]
                }
              }
            }
          : {}),
        ...(busca
          ? {
              OR: [
                Number.isNaN(Number(busca)) ? undefined : { numero: Number(busca) },
                { canal: { contains: busca, mode: "insensitive" } },
                { origem: { contains: busca, mode: "insensitive" } },
                { observacao: { contains: busca, mode: "insensitive" } },
                {
                  itens: {
                    some: {
                      OR: [
                        { codigoPeca: { contains: busca, mode: "insensitive" } },
                        { nomeProduto: { contains: busca, mode: "insensitive" } }
                      ]
                    }
                  }
                }
              ].filter(Boolean) as Prisma.PedidoWhereInput[]
            }
          : {})
      },
      include: { itens: true },
      orderBy: { criadoEm: "desc" },
      take: filtros.limite ?? 100
    });

    return pedidos.map((pedido) => this.mapearPedido(pedido));
  }

  async buscarPorId(id: string, negocioId: string): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findFirst({
      where: { id, negocioId },
      include: { itens: true }
    });
    return pedido ? this.mapearPedido(pedido) : null;
  }

  async buscarPorReservaId(reservaId: string, negocioId: string): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findFirst({
      where: { reservaId, negocioId },
      include: { itens: true },
      orderBy: { criadoEm: "asc" }
    });
    return pedido ? this.mapearPedido(pedido) : null;
  }

  async atualizarEstado(id: string, negocioId: string, dados: AtualizacaoEstadoPedido): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: dados.estado,
        estadoPagamento: dados.estadoPagamento,
        observacao: dados.observacao ?? undefined,
        responsavelId: dados.responsavelId ?? undefined,
        canceladoEm: dados.estado === "CANCELADO" ? new Date() : undefined
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async atualizarFinanceiro(
    id: string,
    negocioId: string,
    dados: AtualizacaoFinanceiraPedido
  ): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        descontoEmKwanza: dados.descontoEmKwanza,
        motivoDesconto: dados.motivoDesconto ?? undefined,
        totalEmKwanza: dados.totalEmKwanza,
        observacao: dados.observacao ?? undefined
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async atualizarItens(id: string, negocioId: string, dados: AtualizacaoItensPedidoResolvida): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.$transaction(async (tx) => {
      await tx.itemPedido.deleteMany({ where: { pedidoId: id } });
      return tx.pedido.update({
        where: { id },
        data: {
          subtotalEmKwanza: dados.subtotalEmKwanza,
          totalEmKwanza: dados.totalEmKwanza,
          observacao: dados.observacao ?? undefined,
          itens: {
            create: dados.itens.map((item) => ({
              pecaId: item.pecaId,
              codigoPeca: item.codigoPeca,
              nomeProduto: item.nomeProduto,
              quantidade: item.quantidade,
              precoUnitarioEmKwanza: item.precoUnitarioEmKwanza,
              subtotalEmKwanza: item.subtotalEmKwanza
            }))
          }
        },
        include: { itens: true }
      });
    });

    return this.mapearPedido(pedido);
  }

  async confirmarPagamento(
    id: string,
    negocioId: string,
    dados: ConfirmacaoPagamentoPedido
  ): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: "PAGO",
        estadoPagamento: "CONFIRMADO",
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? undefined,
        observacao: dados.observacao ?? undefined,
        pagoEm: new Date()
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async registrarComprovativo(
    id: string,
    negocioId: string,
    dados: RegistroComprovativoPagamentoPedido
  ): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estadoPagamento: "COMPROVATIVO_RECEBIDO",
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? undefined,
        observacao: dados.observacao ?? undefined
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async rejeitarPagamento(
    id: string,
    negocioId: string,
    dados: RejeicaoPagamentoPedido
  ): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: "AGUARDANDO_PAGAMENTO",
        estadoPagamento: "REJEITADO",
        observacao: dados.motivo,
        pagoEm: null
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async atualizarEntrega(id: string, negocioId: string, dados: AtualizacaoEntregaPedido): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: dados.estadoEntrega === "ENTREGUE" ? "ENTREGUE" : undefined,
        estadoEntrega: dados.estadoEntrega,
        observacao: dados.observacao ?? undefined,
        responsavelId: dados.responsavelId ?? undefined,
        entregueEm: dados.estadoEntrega === "ENTREGUE" ? new Date() : undefined
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  private async criarComRetentativa(dados: DadosPedidoResolvido, tentativa = 1): Promise<PedidoPrismaComItens> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const ultimo = await tx.pedido.findFirst({
          where: { negocioId: dados.negocioId },
          orderBy: { numero: "desc" },
          select: { numero: true }
        });
        const numero = dados.numero ?? (ultimo?.numero ?? 0) + 1;

        return tx.pedido.create({
          data: {
            negocioId: dados.negocioId,
            clienteNegocioId: dados.clienteNegocioId,
            reservaId: dados.reservaId ?? null,
            numero,
            estado: dados.estado ?? "AGUARDANDO_PAGAMENTO",
            estadoPagamento: dados.estadoPagamento ?? "PENDENTE",
            estadoEntrega: dados.estadoEntrega ?? "PENDENTE",
            origem: dados.origem ?? "manual",
            canal: dados.canal ?? "whatsapp",
            subtotalEmKwanza: dados.subtotalEmKwanza,
            descontoEmKwanza: dados.descontoEmKwanza,
            taxaEntregaEmKwanza: dados.taxaEntregaEmKwanza,
            totalEmKwanza: dados.totalEmKwanza,
            motivoDesconto: dados.motivoDesconto ?? null,
            enderecoEntrega: dados.enderecoEntrega ?? null,
            comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null,
            observacao: dados.observacao ?? null,
            responsavelId: dados.responsavelId ?? null,
            itens: {
              create: dados.itens.map((item) => ({
                pecaId: item.pecaId,
                codigoPeca: item.codigoPeca,
                nomeProduto: item.nomeProduto,
                quantidade: item.quantidade,
                precoUnitarioEmKwanza: item.precoUnitarioEmKwanza,
                subtotalEmKwanza: item.subtotalEmKwanza
              }))
            }
          },
          include: { itens: true }
        });
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002" &&
        tentativa < Number(process.env.PRISMA_TRANSACAO_MAX_TENTATIVAS ?? 8)
      ) {
        await new Promise((resolver) => setTimeout(resolver, tentativa * 40));
        return this.criarComRetentativa(dados, tentativa + 1);
      }
      throw erro;
    }
  }

  private mapearPedido(pedido: PedidoPrismaComItens): Pedido {
    return {
      ...pedido,
      estado: pedido.estado as EstadoPedido,
      estadoPagamento: pedido.estadoPagamento as EstadoPagamentoPedido,
      estadoEntrega: pedido.estadoEntrega as EstadoEntregaPedido,
      itens: pedido.itens.map((item) => ({ ...item }))
    };
  }
}

export class RepositorioComentariosPrisma implements RepositorioComentarios {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoRegistroComentario): Promise<RegistroComentario> {
    const comentario = await this.prisma.comentarioRecebido.create({
      data: {
        negocioId: dados.negocioId ?? null,
        ...this.mapearComentarioParaBanco(dados.comentario),
        ...this.mapearInterpretacaoParaBanco(dados.interpretacao),
        estado: dados.estado,
        motivo: dados.motivo ?? null
      }
    });

    return this.mapearRegistroComentario(comentario);
  }

  async listar(limite = 100, negocioId?: string | null): Promise<RegistroComentario[]> {
    const comentarios = await this.prisma.comentarioRecebido.findMany({
      where: negocioId ? { negocioId } : undefined,
      take: limite,
      orderBy: { criadoEm: "desc" }
    });

    return comentarios.map((comentario) => this.mapearRegistroComentario(comentario));
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<RegistroComentario | null> {
    const comentario = await this.prisma.comentarioRecebido.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      }
    });
    return comentario ? this.mapearRegistroComentario(comentario) : null;
  }

  async atualizarEstado(
    id: string,
    estado: EstadoComentario,
    motivo: string | null = null,
    interpretacao?: ResultadoInterpretacaoComentario | null
  ): Promise<RegistroComentario> {
    const comentario = await this.prisma.comentarioRecebido.update({
      where: { id },
      data: {
        estado,
        motivo,
        ...(interpretacao === undefined ? {} : this.mapearInterpretacaoParaBanco(interpretacao))
      }
    });

    return this.mapearRegistroComentario(comentario);
  }

  async limparTodos(): Promise<number> {
    const resultado = await this.prisma.comentarioRecebido.deleteMany({});
    return resultado.count;
  }

  private mapearComentarioParaBanco(comentario: ComentarioLive) {
    return {
      source: comentario.source,
      provider: comentario.provider,
      liveId: comentario.liveId,
      username: comentario.username,
      userId: comentario.userId ?? null,
      displayName: comentario.displayName,
      avatarUrl: comentario.avatarUrl ?? null,
      commentText: comentario.commentText,
      timestamp: comentario.timestamp
    };
  }

  private mapearInterpretacaoParaBanco(interpretacao: ResultadoInterpretacaoComentario | null) {
    return {
      intent: interpretacao?.intent ?? null,
      phone: interpretacao?.phone ?? null,
      productCode: interpretacao?.productCode ?? null,
      confidence: interpretacao?.confidence ?? null,
      requiresManualReview: interpretacao?.requiresManualReview ?? null
    };
  }

  private mapearRegistroComentario(comentario: {
    id: string;
    negocioId: string | null;
    source: string;
    provider: string;
    liveId: string;
    username: string;
    userId: string | null;
    displayName: string;
    avatarUrl: string | null;
    commentText: string;
    timestamp: Date;
    intent: string | null;
    phone: string | null;
    productCode: string | null;
    confidence: number | null;
    requiresManualReview: boolean | null;
    estado: string;
    motivo: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RegistroComentario {
    const interpretacao =
      comentario.intent && comentario.confidence !== null && comentario.requiresManualReview !== null
        ? {
            intent: comentario.intent as "BUY" | "NONE",
            phone: comentario.phone,
            productCode: comentario.productCode,
            productCodes: comentario.productCode ? [comentario.productCode] : [],
            confidence: comentario.confidence,
            requiresManualReview: comentario.requiresManualReview,
            reasons: comentario.motivo ? [comentario.motivo] : []
          }
        : null;

    return {
      id: comentario.id,
      negocioId: comentario.negocioId,
      comentario: {
        source: comentario.source as ComentarioLive["source"],
        provider: comentario.provider,
        liveId: comentario.liveId,
        username: comentario.username,
        userId: comentario.userId,
        displayName: comentario.displayName,
        avatarUrl: comentario.avatarUrl,
        commentText: comentario.commentText,
        timestamp: comentario.timestamp
      },
      interpretacao,
      estado: comentario.estado as EstadoComentario,
      motivo: comentario.motivo,
      criadoEm: comentario.criadoEm,
      atualizadoEm: comentario.atualizadoEm
    };
  }
}

export class RepositorioAutenticacaoPrisma implements RepositorioAutenticacao {
  constructor(private readonly prisma: PrismaClient) {}

  async criarOuAtualizarUsuario(dados: {
    telefone: string;
    nome: string;
    email?: string | null;
    avatarUrl?: string | null;
    origemCadastro?: string;
  }) {
    return this.prisma.usuarioSistema.upsert({
      where: { telefone: dados.telefone },
      create: {
        telefone: dados.telefone,
        nome: dados.nome,
        email: dados.email ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        papel: "VENDEDOR",
        origemCadastro: dados.origemCadastro ?? "TELEFONE"
      },
      update: {
        nome: dados.nome,
        email: dados.email ?? undefined,
        avatarUrl: dados.avatarUrl ?? undefined,
        origemCadastro: dados.origemCadastro ?? undefined
      }
    });
  }

  async buscarUsuarioPorTelefone(telefone: string) {
    return this.prisma.usuarioSistema.findUnique({ where: { telefone } });
  }

  async buscarUsuarioPorId(id: string): Promise<UsuarioSistema | null> {
    return this.prisma.usuarioSistema.findUnique({ where: { id } });
  }

  async criarOuAtualizarUsuarioPorIdentidade(dados: DadosIdentidadeAutenticacao): Promise<UsuarioSistema> {
    return this.prisma.$transaction(async (tx) => {
      const identidade = await tx.identidadeAutenticacao.findUnique({
        where: {
          tipo_provider_providerUserId: {
            tipo: dados.tipo,
            provider: dados.provider,
            providerUserId: dados.providerUserId
          }
        }
      });

      if (identidade) {
        const usuario = await tx.usuarioSistema.update({
          where: { id: identidade.usuarioId },
          data: {
            nome: dados.nome,
            telefone: dados.telefone ?? undefined,
            email: dados.email ?? undefined,
            avatarUrl: dados.avatarUrl ?? undefined,
            origemCadastro: dados.origemCadastro
          }
        });

        await tx.identidadeAutenticacao.update({
          where: { id: identidade.id },
          data: {
            email: dados.email ?? null,
            telefone: dados.telefone ?? null,
            dadosJson: JSON.stringify(dados.dados ?? {})
          }
        });

        return usuario;
      }

      const usuarioExistente =
        (dados.telefone ? await tx.usuarioSistema.findUnique({ where: { telefone: dados.telefone } }) : null) ??
        (dados.email ? await tx.usuarioSistema.findUnique({ where: { email: dados.email } }) : null);

      const usuario = usuarioExistente
        ? await tx.usuarioSistema.update({
            where: { id: usuarioExistente.id },
            data: {
              nome: dados.nome,
              telefone: dados.telefone ?? usuarioExistente.telefone,
              email: dados.email ?? usuarioExistente.email,
              avatarUrl: dados.avatarUrl ?? usuarioExistente.avatarUrl,
              origemCadastro: dados.origemCadastro
            }
          })
        : await tx.usuarioSistema.create({
            data: {
              nome: dados.nome,
              telefone: dados.telefone ?? null,
              email: dados.email ?? null,
              avatarUrl: dados.avatarUrl ?? null,
              papel: "VENDEDOR",
              origemCadastro: dados.origemCadastro
            }
          });

      await tx.identidadeAutenticacao.create({
        data: {
          usuarioId: usuario.id,
          tipo: dados.tipo,
          provider: dados.provider,
          providerUserId: dados.providerUserId,
          email: dados.email ?? null,
          telefone: dados.telefone ?? null,
          dadosJson: JSON.stringify(dados.dados ?? {})
        }
      });

      return usuario;
    });
  }

  async salvarPerfilEstudantil(dados: DadosPerfilEstudantil): Promise<PerfilEstudantilUsuario> {
    const perfil = await this.prisma.perfilEstudantilUsuario.upsert({
      where: {
        institutionCode_studentNumber: {
          institutionCode: dados.institutionCode,
          studentNumber: dados.studentNumber
        }
      },
      create: {
        usuarioId: dados.usuarioId,
        institutionCode: dados.institutionCode,
        studentNumber: dados.studentNumber,
        username: dados.username ?? null,
        nome: dados.nome,
        email: dados.email ?? null,
        telefone: dados.telefone ?? null,
        curso: dados.curso ?? null,
        turma: dados.turma ?? null,
        anoAcademico: dados.anoAcademico ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        dadosJson: JSON.stringify(dados.dados ?? {})
      },
      update: {
        usuarioId: dados.usuarioId,
        username: dados.username ?? null,
        nome: dados.nome,
        email: dados.email ?? null,
        telefone: dados.telefone ?? null,
        curso: dados.curso ?? null,
        turma: dados.turma ?? null,
        anoAcademico: dados.anoAcademico ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        dadosJson: JSON.stringify(dados.dados ?? {}),
        sincronizadoEm: new Date()
      }
    });

    return {
      ...perfil,
      dados: this.lerObjeto(perfil.dadosJson)
    };
  }

  async buscarNegocioPrincipalPorUsuario(usuarioId: string): Promise<NegocioBizy | null> {
    const membro = await this.prisma.membroNegocio.findFirst({
      where: { usuarioId },
      include: { negocio: true },
      orderBy: { criadoEm: "asc" }
    });

    return membro ? this.mapearNegocio(membro.negocio, membro.papel) : null;
  }

  async salvarNegocioUsuario(usuarioId: string, dados: DadosNegocioBizy): Promise<NegocioBizy> {
    const atual = await this.prisma.membroNegocio.findFirst({
      where: { usuarioId },
      include: { negocio: true },
      orderBy: { criadoEm: "asc" }
    });
    const data = {
      nomeComercial: dados.nomeComercial,
      segmento: dados.segmento,
      tipo: dados.tipo,
      nif: dados.nif ?? null,
      telefone: dados.telefone ?? null,
      whatsapp: dados.whatsapp ?? null,
      email: dados.email ?? null,
      instagram: dados.instagram ?? null,
      tiktok: dados.tiktok ?? null,
      provincia: dados.provincia ?? null,
      municipio: dados.municipio ?? null,
      endereco: dados.endereco ?? null,
      moeda: dados.moeda ?? "AOA",
      fusoHorario: dados.fusoHorario ?? "Africa/Luanda",
      canaisVendaJson: JSON.stringify(dados.canaisVenda ?? []),
      metodosPagamentoJson: JSON.stringify(dados.metodosPagamento ?? []),
      entregaJson: JSON.stringify(dados.entrega ?? {}),
      minutosReservaPadrao: dados.minutosReservaPadrao ?? 10,
      slugPublico: dados.slugPublico ?? undefined,
      descricaoPublica: dados.descricaoPublica ?? undefined,
      lojaPublicadaEm: dados.lojaPublicadaEm ?? undefined
    };

    if (atual) {
      const negocio = await this.prisma.negocio.update({
        where: { id: atual.negocioId },
        data
      });
      return this.mapearNegocio(negocio, atual.papel);
    }

    const negocio = await this.prisma.negocio.create({
      data: {
        ...data,
        membros: {
          create: {
            usuarioId,
            papel: "DONO"
          }
        }
      }
    });

    return this.mapearNegocio(negocio, "DONO");
  }

  async atualizarPublicacaoLoja(negocioId: string, dados: DadosPublicacaoLoja): Promise<NegocioBizy> {
    const existente = await this.prisma.negocio.findFirst({
      where: {
        slugPublico: dados.slug,
        NOT: { id: negocioId }
      }
    });
    if (existente) {
      throw new Error(`Slug público ${dados.slug} já existe.`);
    }

    const negocio = await this.prisma.negocio.update({
      where: { id: negocioId },
      data: {
        slugPublico: dados.slug,
        descricaoPublica: dados.descricaoPublica,
        lojaPublicadaEm: dados.publicada ? new Date() : null
      }
    });

    return this.mapearNegocio(negocio);
  }

  async buscarNegocioPorSlugPublico(slug: string): Promise<NegocioBizy | null> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { slugPublico: slug }
    });

    return negocio ? this.mapearNegocio(negocio) : null;
  }

  async listarModulosAtivosPorNegocio(negocioId: string): Promise<string[]> {
    const totalConfigurado = await this.prisma.moduloNegocio.count({ where: { negocioId } });
    if (totalConfigurado === 0) return [];

    const modulos = await this.prisma.moduloNegocio.findMany({
      where: { negocioId },
      orderBy: {
        modulo: "asc"
      },
      select: {
        modulo: true,
        ativo: true
      }
    });

    const ativos = new Set<string>(modulosNegocioPadrao);
    for (const modulo of modulos) {
      if (modulo.ativo) {
        ativos.add(modulo.modulo);
      } else {
        ativos.delete(modulo.modulo);
      }
    }

    return [...ativos];
  }

  async listarModulosPorNegocio(negocioId: string): Promise<ModuloNegocioConfigurado[]> {
    const modulos = await this.prisma.moduloNegocio.findMany({
      where: { negocioId },
      orderBy: { modulo: "asc" }
    });

    return modulos.map((modulo) => this.mapearModuloNegocio(modulo));
  }

  async salvarModuloNegocio(
    negocioId: string,
    modulo: ModuloNegocioCodigo,
    dados: AtualizacaoModuloNegocio
  ): Promise<ModuloNegocioConfigurado> {
    const salvo = await this.prisma.moduloNegocio.upsert({
      where: {
        negocioId_modulo: {
          negocioId,
          modulo
        }
      },
      create: {
        negocioId,
        modulo,
        ativo: dados.ativo,
        configuracaoJson: JSON.stringify(dados.configuracao ?? {})
      },
      update: {
        ativo: dados.ativo,
        configuracaoJson: JSON.stringify(dados.configuracao ?? {})
      }
    });

    return this.mapearModuloNegocio(salvo);
  }

  async marcarUsuarioOnboardingCompleto(usuarioId: string, data: Date): Promise<UsuarioSistema> {
    return this.prisma.usuarioSistema.update({
      where: { id: usuarioId },
      data: { perfilCompletoEm: data }
    });
  }

  async criarCodigoSms(dados: {
    telefone: string;
    codigoHash: string;
    codigoFinal: string;
    expiraEm: Date;
    statusEnvio: string;
    provider: string;
    providerMessageId?: string | null;
    providerResponseJson?: string | null;
    usuarioId?: string | null;
  }): Promise<CodigoLoginSms> {
    return this.prisma.codigoLoginSms.create({
      data: {
        telefone: dados.telefone,
        codigoHash: dados.codigoHash,
        codigoFinal: dados.codigoFinal,
        expiraEm: dados.expiraEm,
        statusEnvio: dados.statusEnvio,
        provider: dados.provider,
        providerMessageId: dados.providerMessageId ?? null,
        providerResponseJson: dados.providerResponseJson ?? null,
        usuarioId: dados.usuarioId ?? null
      }
    });
  }

  async buscarCodigoSmsValido(telefone: string, agora: Date): Promise<CodigoLoginSms | null> {
    return this.prisma.codigoLoginSms.findFirst({
      where: {
        telefone,
        usadoEm: null,
        expiraEm: { gt: agora },
        statusEnvio: { in: ["SENT", "DEV"] }
      },
      orderBy: { criadoEm: "desc" }
    });
  }

  async marcarCodigoUsado(id: string, usadoEm: Date): Promise<CodigoLoginSms> {
    return this.prisma.codigoLoginSms.update({ where: { id }, data: { usadoEm } });
  }

  async incrementarTentativasCodigo(id: string): Promise<CodigoLoginSms> {
    return this.prisma.codigoLoginSms.update({ where: { id }, data: { tentativas: { increment: 1 } } });
  }

  async revogarCodigosAbertos(telefone: string, agora: Date): Promise<void> {
    await this.prisma.codigoLoginSms.updateMany({
      where: {
        telefone,
        usadoEm: null,
        expiraEm: { gt: agora }
      },
      data: {
        usadoEm: agora,
        statusEnvio: "REVOKED"
      }
    });
  }

  async limparCodigosSms(): Promise<number> {
    const resultado = await this.prisma.codigoLoginSms.deleteMany({});
    return resultado.count;
  }

  async criarSessao(dados: { tokenHash: string; usuarioId: string; expiraEm: Date }): Promise<void> {
    await this.prisma.sessaoUsuario.create({
      data: {
        tokenHash: dados.tokenHash,
        usuarioId: dados.usuarioId,
        expiraEm: dados.expiraEm
      }
    });
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    return this.prisma.sessaoUsuario.findFirst({
      where: {
        tokenHash,
        expiraEm: { gt: agora }
      },
      select: {
        id: true,
        usuario: true
      }
    });
  }

  async tocarSessao(id: string, agora: Date): Promise<void> {
    await this.prisma.sessaoUsuario.update({ where: { id }, data: { ultimoUsoEm: agora } });
  }

  async encerrarSessao(tokenHash: string): Promise<void> {
    await this.prisma.sessaoUsuario.deleteMany({ where: { tokenHash } });
  }

  private mapearNegocio(
    negocio: {
      id: string;
      nomeComercial: string;
      segmento: string;
      tipo: string;
      nif: string | null;
      telefone: string | null;
      whatsapp: string | null;
      email: string | null;
      instagram: string | null;
      tiktok: string | null;
      provincia: string | null;
      municipio: string | null;
      endereco: string | null;
      moeda: string;
      fusoHorario: string;
      canaisVendaJson: string;
      metodosPagamentoJson: string;
      entregaJson: string;
      minutosReservaPadrao: number;
      slugPublico: string | null;
      descricaoPublica: string | null;
      lojaPublicadaEm: Date | null;
      criadoEm: Date;
      atualizadoEm: Date;
    },
    usuarioPapel?: string
  ): NegocioBizy {
    return {
      id: negocio.id,
      nomeComercial: negocio.nomeComercial,
      segmento: negocio.segmento,
      tipo: negocio.tipo,
      nif: negocio.nif,
      telefone: negocio.telefone,
      whatsapp: negocio.whatsapp,
      email: negocio.email,
      instagram: negocio.instagram,
      tiktok: negocio.tiktok,
      provincia: negocio.provincia,
      municipio: negocio.municipio,
      endereco: negocio.endereco,
      moeda: negocio.moeda,
      fusoHorario: negocio.fusoHorario,
      canaisVenda: this.lerArray(negocio.canaisVendaJson),
      metodosPagamento: this.lerArray(negocio.metodosPagamentoJson),
      entrega: this.lerObjeto(negocio.entregaJson),
      minutosReservaPadrao: negocio.minutosReservaPadrao,
      slugPublico: negocio.slugPublico,
      descricaoPublica: negocio.descricaoPublica,
      lojaPublicadaEm: negocio.lojaPublicadaEm,
      usuarioPapel,
      criadoEm: negocio.criadoEm,
      atualizadoEm: negocio.atualizadoEm
    };
  }

  private mapearModuloNegocio(modulo: {
    id: string;
    negocioId: string;
    modulo: string;
    ativo: boolean;
    configuracaoJson: string;
    criadoEm: Date;
    atualizadoEm: Date;
  }): ModuloNegocioConfigurado {
    return {
      id: modulo.id,
      negocioId: modulo.negocioId,
      modulo: modulo.modulo as ModuloNegocioCodigo,
      ativo: modulo.ativo,
      configuracao: this.lerObjeto(modulo.configuracaoJson),
      criadoEm: modulo.criadoEm,
      atualizadoEm: modulo.atualizadoEm
    };
  }

  private lerArray(valor: string): string[] {
    try {
      const dados = JSON.parse(valor);
      return Array.isArray(dados) ? dados.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

export class RepositorioInstanciasWhatsAppPrisma implements RepositorioInstanciasWhatsApp {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: {
    negocioId?: string | null;
    nome: string;
    etiqueta?: string | null;
    telefone?: string | null;
    baseUrl?: string | null;
    apiKey?: string | null;
    padrao?: boolean;
  }): Promise<InstanciaWhatsApp> {
    const negocioId = dados.negocioId ?? null;

    if (dados.padrao) {
      await this.prisma.instanciaWhatsApp.updateMany({
        where: { negocioId, padrao: true },
        data: { padrao: false }
      });
    }

    return this.prisma.instanciaWhatsApp.create({
      data: {
        negocioId,
        nome: dados.nome,
        etiqueta: dados.etiqueta ?? null,
        telefone: dados.telefone ?? null,
        baseUrl: dados.baseUrl ?? null,
        apiKey: dados.apiKey ?? null,
        padrao: dados.padrao ?? false,
        status: "CRIADA"
      }
    });
  }

  async listarAtivas(negocioId?: string | null): Promise<InstanciaWhatsApp[]> {
    return this.prisma.instanciaWhatsApp.findMany({
      where: { ativa: true, ...this.filtroNegocio(negocioId) },
      orderBy: [{ padrao: "desc" }, { atualizadaEm: "desc" }]
    });
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp | null> {
    return this.prisma.instanciaWhatsApp.findFirst({
      where: { id, ...this.filtroNegocio(negocioId) }
    });
  }

  async buscarPadrao(negocioId?: string | null): Promise<InstanciaWhatsApp | null> {
    return this.prisma.instanciaWhatsApp.findFirst({
      where: { ativa: true, padrao: true, ...this.filtroNegocio(negocioId) },
      orderBy: { atualizadaEm: "desc" }
    });
  }

  async atualizar(
    id: string,
    dados: Partial<Pick<
      InstanciaWhatsApp,
      "etiqueta" | "telefone" | "status" | "qrCode" | "pairingCode" | "baseUrl" | "apiKey" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaConsultaEm"
    >>,
    negocioId?: string | null
  ): Promise<InstanciaWhatsApp> {
    const instancia = await this.exigirInstancia(id, negocioId);

    if (dados.padrao) {
      await this.prisma.instanciaWhatsApp.updateMany({
        where: { negocioId: instancia.negocioId, padrao: true, id: { not: id } },
        data: { padrao: false }
      });
    }

    return this.prisma.instanciaWhatsApp.update({
      where: { id },
      data: dados
    });
  }

  async definirPadrao(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    const instancia = await this.exigirInstancia(id, negocioId);
    await this.prisma.instanciaWhatsApp.updateMany({
      where: { negocioId: instancia.negocioId, padrao: true, id: { not: id } },
      data: { padrao: false }
    });
    return this.prisma.instanciaWhatsApp.update({ where: { id }, data: { padrao: true, ativa: true } });
  }

  async desativar(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    await this.exigirInstancia(id, negocioId);
    return this.prisma.instanciaWhatsApp.update({
      where: { id },
      data: { ativa: false, padrao: false }
    });
  }

  private filtroNegocio(negocioId?: string | null): Prisma.InstanciaWhatsAppWhereInput {
    return negocioId === undefined ? {} : { negocioId: negocioId ?? null };
  }

  private async exigirInstancia(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    const instancia = await this.buscarPorId(id, negocioId);
    if (!instancia) throw new Error(`Instância ${id} não encontrada.`);
    return instancia;
  }
}

export class RepositorioSessoesLivePrisma implements RepositorioSessoesLive {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(dados: NovoRegistroSessaoLive): Promise<RegistroSessaoLive> {
    const sessao = await this.prisma.sessaoLive.upsert({
      where: { id: dados.id },
      create: {
        id: dados.id,
        username: dados.username,
        providerNome: dados.providerNome,
        status: dados.status,
        ativa: dados.ativa ?? true,
        iniciadaEm: dados.iniciadaEm,
        encerradaEm: dados.encerradaEm ?? null,
        comentariosRecebidos: dados.comentariosRecebidos ?? 0,
        comentariosProcessados: dados.comentariosProcessados ?? 0,
        comentariosComErro: dados.comentariosComErro ?? 0,
        ultimoComentarioEm: dados.ultimoComentarioEm ?? null,
        ultimoErro: dados.ultimoErro ?? null
      },
      update: {
        username: dados.username,
        providerNome: dados.providerNome,
        status: dados.status,
        ativa: dados.ativa ?? true,
        iniciadaEm: dados.iniciadaEm,
        encerradaEm: dados.encerradaEm ?? null,
        comentariosRecebidos: dados.comentariosRecebidos ?? 0,
        comentariosProcessados: dados.comentariosProcessados ?? 0,
        comentariosComErro: dados.comentariosComErro ?? 0,
        ultimoComentarioEm: dados.ultimoComentarioEm ?? null,
        ultimoErro: dados.ultimoErro ?? null
      }
    });

    return this.mapearSessaoLive(sessao);
  }

  async listarAtivas(): Promise<RegistroSessaoLive[]> {
    const sessoes = await this.prisma.sessaoLive.findMany({
      where: { ativa: true },
      orderBy: { atualizadaEm: "desc" }
    });

    return sessoes.map((sessao) => this.mapearSessaoLive(sessao));
  }

  async buscarPorId(id: string): Promise<RegistroSessaoLive | null> {
    const sessao = await this.prisma.sessaoLive.findUnique({ where: { id } });
    return sessao ? this.mapearSessaoLive(sessao) : null;
  }

  async atualizar(id: string, dados: AtualizacaoRegistroSessaoLive): Promise<RegistroSessaoLive> {
    const sessao = await this.prisma.sessaoLive.update({
      where: { id },
      data: dados
    });

    return this.mapearSessaoLive(sessao);
  }

  async encerrar(id: string, encerradaEm = new Date()): Promise<RegistroSessaoLive> {
    return this.atualizar(id, { ativa: false, status: "ENCERRADA", encerradaEm });
  }

  private mapearSessaoLive(sessao: {
    id: string;
    username: string;
    providerNome: string;
    status: string;
    ativa: boolean;
    iniciadaEm: Date;
    encerradaEm: Date | null;
    comentariosRecebidos: number;
    comentariosProcessados: number;
    comentariosComErro: number;
    ultimoComentarioEm: Date | null;
    ultimoErro: string | null;
    criadaEm: Date;
    atualizadaEm: Date;
  }): RegistroSessaoLive {
    return {
      ...sessao,
      status: sessao.status as RegistroSessaoLive["status"]
    };
  }
}

export class RepositorioClientesPrisma implements RepositorioClientes {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(dados: DadosCliente360): Promise<Cliente360> {
    const contato = this.normalizarContatoObrigatorio(dados.telefone, dados.email);
    const agora = new Date();
    const clienteGlobal = await this.obterOuCriarClienteGlobal(dados, contato);
    const existente = await this.buscarExistentePorContato(dados.negocioId, clienteGlobal.id, contato.telefoneLocal);

    if (existente) {
      const atualizado = await this.prisma.clienteNegocio.update({
        where: { id: existente.id },
        data: {
          telefone: contato.telefoneLocal ?? existente.telefone,
          email: contato.email ?? existente.email,
          nome: dados.nome ?? existente.nome,
          username: dados.username ?? existente.username,
          userId: dados.userId ?? existente.userId,
          avatarUrl: dados.avatarUrl ?? existente.avatarUrl,
          origem: existente.origem ?? dados.origem ?? null,
          tagsJson: dados.tags ? this.serializar(this.unirTags(this.lerLista(existente.tagsJson), dados.tags)) : undefined,
          preferenciasJson: dados.preferencias
            ? this.serializar({ ...this.parseJson(existente.preferenciasJson), ...dados.preferencias })
            : undefined,
          consentimentoMarketing: dados.consentimentoMarketing ?? existente.consentimentoMarketing,
          consentimentoDados: dados.consentimentoDados ?? existente.consentimentoDados,
          estadoRelacionamento: dados.estadoRelacionamento ?? existente.estadoRelacionamento,
          ultimaInteracaoEm: dados.ultimaInteracaoEm ?? existente.ultimaInteracaoEm
        }
      });
      return this.mapearCliente(atualizado);
    }

    const cliente = await this.prisma.clienteNegocio.create({
      data: {
        negocioId: dados.negocioId,
        clienteGlobalId: clienteGlobal.id,
        telefone: contato.telefoneLocal,
        email: contato.email,
        nome: dados.nome ?? null,
        username: dados.username ?? null,
        userId: dados.userId ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        origem: dados.origem ?? null,
        tagsJson: this.serializar(this.normalizarTags(dados.tags ?? [])),
        preferenciasJson: this.serializar(dados.preferencias ?? {}),
        consentimentoMarketing: dados.consentimentoMarketing ?? false,
        consentimentoDados: dados.consentimentoDados ?? false,
        estadoRelacionamento: dados.estadoRelacionamento ?? "ATIVO",
        primeiraInteracaoEm: dados.ultimaInteracaoEm ?? agora,
        ultimaInteracaoEm: dados.ultimaInteracaoEm ?? agora
      }
    });

    return this.mapearCliente(cliente);
  }

  async sincronizar(dados: DadosCliente360): Promise<Cliente360 | null> {
    if (!normalizarTelefone(dados.telefone) && !normalizarEmail(dados.email)) return null;
    return this.salvar(dados);
  }

  async listar(negocioId: string, filtros: FiltrosClientes360 = {}): Promise<Cliente360[]> {
    const busca = filtros.busca?.trim();
    const where: Prisma.ClienteNegocioWhereInput = {
      negocioId,
      ...(filtros.estadoRelacionamento ? { estadoRelacionamento: filtros.estadoRelacionamento } : {}),
      ...(filtros.consentimentoMarketing === undefined
        ? {}
        : { consentimentoMarketing: filtros.consentimentoMarketing }),
      ...(busca
        ? {
            OR: [
              { telefone: { contains: busca, mode: "insensitive" } },
              { email: { contains: busca, mode: "insensitive" } },
              { nome: { contains: busca, mode: "insensitive" } },
              { username: { contains: busca, mode: "insensitive" } },
              { userId: { contains: busca, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const clientes = await this.prisma.clienteNegocio.findMany({
      where,
      orderBy: { ultimaInteracaoEm: "desc" },
      take: filtros.limite ?? 100
    });
    const tag = filtros.tag?.trim().toLowerCase();

    return clientes
      .map((cliente) => this.mapearCliente(cliente))
      .filter((cliente) => !tag || cliente.tags.some((item) => item.toLowerCase() === tag));
  }

  async buscarPorId(id: string, negocioId: string): Promise<Cliente360 | null> {
    const cliente = await this.prisma.clienteNegocio.findFirst({ where: { id, negocioId } });
    return cliente ? this.mapearCliente(cliente) : null;
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360 | null> {
    const existente = await this.prisma.clienteNegocio.findFirst({ where: { id, negocioId } });
    if (!existente) return null;

    const telefone = dados.telefone === undefined ? existente.telefone : normalizarTelefone(dados.telefone)?.local ?? null;
    const email = dados.email === undefined ? existente.email : normalizarEmail(dados.email);
    if (!telefone && !email) {
      throw new Error("Cliente precisa manter telefone ou email.");
    }

    const atualizado = await this.prisma.clienteNegocio.update({
      where: { id: existente.id },
      data: {
        telefone,
        email,
        nome: dados.nome === undefined ? existente.nome : dados.nome,
        username: dados.username === undefined ? existente.username : dados.username,
        userId: dados.userId === undefined ? existente.userId : dados.userId,
        avatarUrl: dados.avatarUrl === undefined ? existente.avatarUrl : dados.avatarUrl,
        origem: dados.origem === undefined ? existente.origem : dados.origem,
        tagsJson: dados.tags === undefined ? existente.tagsJson : this.serializar(this.normalizarTags(dados.tags)),
        preferenciasJson:
          dados.preferencias === undefined ? existente.preferenciasJson : this.serializar(dados.preferencias),
        consentimentoMarketing: dados.consentimentoMarketing ?? existente.consentimentoMarketing,
        consentimentoDados: dados.consentimentoDados ?? existente.consentimentoDados,
        estadoRelacionamento: dados.estadoRelacionamento ?? existente.estadoRelacionamento
      }
    });

    return this.mapearCliente(atualizado);
  }

  async anonimizar(
    id: string,
    negocioId: string,
    dados: { motivo: string; anonimizadoEm?: Date }
  ): Promise<Cliente360 | null> {
    const existente = await this.prisma.clienteNegocio.findFirst({ where: { id, negocioId } });
    if (!existente) return null;

    const preferencias = this.parseJson(existente.preferenciasJson);
    const tags = this.normalizarTags([...this.lerLista(existente.tagsJson), "anonimizado"]);
    const anonimizadoEm = dados.anonimizadoEm ?? new Date();
    const atualizado = await this.prisma.clienteNegocio.update({
      where: { id: existente.id },
      data: {
        telefone: null,
        email: null,
        nome: null,
        username: null,
        userId: null,
        avatarUrl: null,
        tagsJson: this.serializar(tags),
        preferenciasJson: this.serializar({
          ...preferencias,
          anonimizado: true,
          anonimizadoEm: anonimizadoEm.toISOString(),
          motivoAnonimizacao: dados.motivo
        }),
        consentimentoMarketing: false,
        consentimentoDados: false,
        estadoRelacionamento: "BLOQUEADO"
      }
    });

    return this.mapearCliente(atualizado);
  }

  private async obterOuCriarClienteGlobal(
    dados: DadosCliente360,
    contato: { telefoneCanonico: string | null; email: string | null }
  ) {
    const whereOr = [
      contato.telefoneCanonico ? { telefoneCanonico: contato.telefoneCanonico } : null,
      contato.email ? { emailCanonico: contato.email } : null
    ].filter(Boolean) as Prisma.ClienteGlobalWhereInput[];

    const existente = whereOr.length
      ? await this.prisma.clienteGlobal.findFirst({ where: { OR: whereOr } })
      : null;

    if (existente) {
      return this.prisma.clienteGlobal.update({
        where: { id: existente.id },
        data: {
          nomePreferido: dados.nome ?? existente.nomePreferido,
          avatarUrl: dados.avatarUrl ?? existente.avatarUrl
        }
      });
    }

    return this.prisma.clienteGlobal.create({
      data: {
        telefoneCanonico: contato.telefoneCanonico,
        emailCanonico: contato.email,
        nomePreferido: dados.nome ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        origemPrimeira: dados.origem ?? null,
        dadosJson: "{}"
      }
    });
  }

  private async buscarExistentePorContato(
    negocioId: string,
    clienteGlobalId: string,
    telefone: string | null
  ) {
    return this.prisma.clienteNegocio.findFirst({
      where: {
        negocioId,
        OR: [
          { clienteGlobalId },
          ...(telefone ? [{ telefone }] : [])
        ]
      }
    });
  }

  private mapearCliente(cliente: {
    id: string;
    negocioId: string;
    clienteGlobalId: string;
    telefone: string | null;
    email: string | null;
    nome: string | null;
    username: string | null;
    userId: string | null;
    avatarUrl: string | null;
    origem: string | null;
    tagsJson: string;
    preferenciasJson: string;
    consentimentoMarketing: boolean;
    consentimentoDados: boolean;
    estadoRelacionamento: string;
    primeiraInteracaoEm: Date;
    ultimaInteracaoEm: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Cliente360 {
    return {
      ...cliente,
      tags: this.lerLista(cliente.tagsJson),
      preferencias: this.parseJson(cliente.preferenciasJson),
      estadoRelacionamento: cliente.estadoRelacionamento as Cliente360["estadoRelacionamento"]
    };
  }

  private normalizarContatoObrigatorio(telefone?: string | null, email?: string | null) {
    const telefoneNormalizado = normalizarTelefone(telefone);
    const emailNormalizado = normalizarEmail(email);
    if (!telefoneNormalizado && !emailNormalizado) {
      throw new Error("Informe telefone ou email para identificar o cliente.");
    }

    return {
      telefoneLocal: telefoneNormalizado?.local ?? null,
      telefoneCanonico: telefoneNormalizado?.canonico ?? null,
      email: emailNormalizado
    };
  }

  private unirTags(tagsAtuais: string[], novasTags: string[]): string[] {
    return this.normalizarTags([...tagsAtuais, ...novasTags]);
  }

  private normalizarTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  private lerLista(valor: string): string[] {
    try {
      const lista = JSON.parse(valor);
      return Array.isArray(lista) ? lista.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private parseJson(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }
}

export class RepositorioCompartilhamentoClientesPrisma implements RepositorioCompartilhamentoClientes {
  constructor(private readonly prisma: PrismaClient) {}

  async criarRelacao(dados: NovaRelacaoNegocio): Promise<RelacaoNegocioCompartilhamento> {
    const relacao = await this.prisma.relacaoNegocio.upsert({
      where: {
        negocioOrigemId_negocioDestinoId_tipo: {
          negocioOrigemId: dados.negocioOrigemId,
          negocioDestinoId: dados.negocioDestinoId,
          tipo: dados.tipo
        }
      },
      create: {
        negocioOrigemId: dados.negocioOrigemId,
        negocioDestinoId: dados.negocioDestinoId,
        tipo: dados.tipo,
        estado: "PENDENTE",
        escopoJson: this.serializar(dados.escopo ?? {}),
        criadoPorUsuarioId: dados.criadoPorUsuarioId ?? null,
        expiraEm: dados.expiraEm ?? null
      },
      update: {}
    });

    return this.mapearRelacao(relacao);
  }

  async buscarRelacaoPorId(id: string): Promise<RelacaoNegocioCompartilhamento | null> {
    const relacao = await this.prisma.relacaoNegocio.findUnique({ where: { id } });
    return relacao ? this.mapearRelacao(relacao) : null;
  }

  async atualizarRelacao(
    id: string,
    dados: AtualizacaoRelacaoNegocio
  ): Promise<RelacaoNegocioCompartilhamento | null> {
    const existente = await this.prisma.relacaoNegocio.findUnique({ where: { id } });
    if (!existente) return null;

    const relacao = await this.prisma.relacaoNegocio.update({
      where: { id },
      data: {
        estado: dados.estado,
        aprovadoEm: dados.estado === "APROVADA" ? new Date() : existente.aprovadoEm
      }
    });

    return this.mapearRelacao(relacao);
  }

  async criarCompartilhamento(dados: NovoCompartilhamentoCliente): Promise<{
    compartilhamento: CompartilhamentoClienteSeguro;
    auditoria: AuditoriaCompartilhamentoCliente[];
  }> {
    return this.prisma.$transaction(async (tx) => {
      const compartilhamento = await tx.compartilhamentoCliente.create({
        data: {
          relacaoId: dados.relacaoId ?? null,
          clienteGlobalId: dados.cliente.clienteGlobalId,
          clienteNegocioOrigemId: dados.cliente.id,
          negocioOrigemId: dados.negocioOrigemId,
          negocioDestinoId: dados.negocioDestinoId,
          escopoJson: this.serializar(dados.escopo ?? {}),
          motivo: dados.motivo,
          baseLegal: dados.baseLegal,
          consentimentoCliente: dados.consentimentoCliente,
          status: "ATIVO",
          aprovadoPorUsuarioId: dados.atorUsuarioId ?? null,
          expiraEm: dados.expiraEm ?? null
        }
      });
      const auditoria = await tx.auditoriaCompartilhamentoCliente.create({
        data: {
          compartilhamentoId: compartilhamento.id,
          atorUsuarioId: dados.atorUsuarioId ?? null,
          acao: "CRIADO",
          dadosJson: this.serializar({
            status: compartilhamento.status,
            escopo: dados.escopo ?? {},
            motivo: dados.motivo,
            baseLegal: dados.baseLegal
          })
        }
      });

      return {
        compartilhamento: this.mapearCompartilhamento(compartilhamento),
        auditoria: [this.mapearAuditoria(auditoria)]
      };
    });
  }

  async buscarCompartilhamentoPorId(id: string): Promise<CompartilhamentoClienteSeguro | null> {
    const compartilhamento = await this.prisma.compartilhamentoCliente.findUnique({ where: { id } });
    return compartilhamento ? this.mapearCompartilhamento(compartilhamento) : null;
  }

  async revogarCompartilhamento(
    id: string,
    dados: { atorUsuarioId?: string | null; motivo: string }
  ): Promise<{ compartilhamento: CompartilhamentoClienteSeguro; auditoria: AuditoriaCompartilhamentoCliente[] } | null> {
    const existente = await this.prisma.compartilhamentoCliente.findUnique({ where: { id } });
    if (!existente) return null;

    return this.prisma.$transaction(async (tx) => {
      const compartilhamento = await tx.compartilhamentoCliente.update({
        where: { id },
        data: {
          status: "REVOGADO"
        }
      });
      const auditoria = await tx.auditoriaCompartilhamentoCliente.create({
        data: {
          compartilhamentoId: id,
          atorUsuarioId: dados.atorUsuarioId ?? null,
          acao: "REVOGADO",
          dadosJson: this.serializar({
            statusAnterior: existente.status,
            statusNovo: compartilhamento.status,
            motivo: dados.motivo
          })
        }
      });

      return {
        compartilhamento: this.mapearCompartilhamento(compartilhamento),
        auditoria: [this.mapearAuditoria(auditoria)]
      };
    });
  }

  async listarRecebidos(negocioDestinoId: string, agora = new Date()): Promise<CompartilhamentoClienteRecebido[]> {
    const compartilhamentos = await this.prisma.compartilhamentoCliente.findMany({
      where: {
        negocioDestinoId,
        status: "ATIVO",
        OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }]
      },
      include: {
        clienteNegocioOrigem: true
      },
      orderBy: { criadoEm: "desc" }
    });

    return compartilhamentos.map((compartilhamento) => ({
      ...this.mapearCompartilhamento(compartilhamento),
      cliente: this.filtrarClientePorEscopo(compartilhamento.clienteNegocioOrigem, compartilhamento.escopoJson)
    }));
  }

  private mapearRelacao(relacao: {
    id: string;
    negocioOrigemId: string;
    negocioDestinoId: string;
    tipo: string;
    estado: string;
    escopoJson: string;
    criadoPorUsuarioId: string | null;
    aprovadoEm: Date | null;
    expiraEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RelacaoNegocioCompartilhamento {
    return {
      id: relacao.id,
      negocioOrigemId: relacao.negocioOrigemId,
      negocioDestinoId: relacao.negocioDestinoId,
      tipo: relacao.tipo as RelacaoNegocioCompartilhamento["tipo"],
      estado: relacao.estado as RelacaoNegocioCompartilhamento["estado"],
      escopo: this.lerObjeto(relacao.escopoJson),
      criadoPorUsuarioId: relacao.criadoPorUsuarioId,
      aprovadoEm: relacao.aprovadoEm,
      expiraEm: relacao.expiraEm,
      criadoEm: relacao.criadoEm,
      atualizadoEm: relacao.atualizadoEm
    };
  }

  private mapearCompartilhamento(compartilhamento: {
    id: string;
    relacaoId: string | null;
    clienteGlobalId: string;
    clienteNegocioOrigemId: string | null;
    negocioOrigemId: string;
    negocioDestinoId: string;
    escopoJson: string;
    motivo: string;
    baseLegal: string;
    consentimentoCliente: boolean;
    status: string;
    aprovadoPorUsuarioId: string | null;
    expiraEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): CompartilhamentoClienteSeguro {
    return {
      id: compartilhamento.id,
      relacaoId: compartilhamento.relacaoId,
      clienteGlobalId: compartilhamento.clienteGlobalId,
      clienteNegocioOrigemId: compartilhamento.clienteNegocioOrigemId,
      negocioOrigemId: compartilhamento.negocioOrigemId,
      negocioDestinoId: compartilhamento.negocioDestinoId,
      escopo: this.lerObjeto(compartilhamento.escopoJson),
      motivo: compartilhamento.motivo,
      baseLegal: compartilhamento.baseLegal,
      consentimentoCliente: compartilhamento.consentimentoCliente,
      status: compartilhamento.status as CompartilhamentoClienteSeguro["status"],
      aprovadoPorUsuarioId: compartilhamento.aprovadoPorUsuarioId,
      expiraEm: compartilhamento.expiraEm,
      criadoEm: compartilhamento.criadoEm,
      atualizadoEm: compartilhamento.atualizadoEm
    };
  }

  private mapearAuditoria(auditoria: {
    id: string;
    compartilhamentoId: string;
    atorUsuarioId: string | null;
    acao: string;
    dadosJson: string;
    criadoEm: Date;
  }): AuditoriaCompartilhamentoCliente {
    return {
      id: auditoria.id,
      compartilhamentoId: auditoria.compartilhamentoId,
      atorUsuarioId: auditoria.atorUsuarioId,
      acao: auditoria.acao,
      dados: this.lerObjeto(auditoria.dadosJson),
      criadoEm: auditoria.criadoEm
    };
  }

  private filtrarClientePorEscopo(
    cliente: {
      nome: string | null;
      telefone: string | null;
      email: string | null;
      username: string | null;
      avatarUrl: string | null;
      preferenciasJson: string;
    } | null,
    escopoJson: string
  ) {
    if (!cliente) return {};
    const escopo = this.lerObjeto(escopoJson);
    const campos = Array.isArray(escopo.campos) ? escopo.campos.filter((campo) => typeof campo === "string") : [];
    const permitido = new Set(campos.length > 0 ? campos : ["nome", "telefone"]);
    const resultado: Record<string, unknown> = {};

    if (permitido.has("nome")) resultado.nome = cliente.nome;
    if (permitido.has("telefone") || permitido.has("whatsapp")) resultado.telefone = cliente.telefone;
    if (permitido.has("email")) resultado.email = cliente.email;
    if (permitido.has("username")) resultado.username = cliente.username;
    if (permitido.has("avatarUrl")) resultado.avatarUrl = cliente.avatarUrl;
    if (permitido.has("preferencias")) resultado.preferencias = this.lerObjeto(cliente.preferenciasJson);

    return resultado;
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }
}

export class RepositorioAtendimentoPrisma implements RepositorioAtendimento {
  constructor(private readonly prisma: PrismaClient) {}

  async registrarMensagem(dados: NovaMensagemAtendimento): Promise<MensagemAtendimento> {
    if (dados.providerMessageId) {
      const existente = await this.buscarMensagemPorProviderMessageId(dados.providerMessageId);
      if (existente) return existente;
    }

    const agora = new Date();
    const enviadaEm = dados.enviadaEm ?? agora;
    const canal = dados.canal ?? "whatsapp";
    const conversa = await this.obterConversaParaMensagem(dados, canal, enviadaEm);

    try {
      const mensagem = await this.prisma.mensagemAtendimento.create({
        data: {
          negocioId: conversa.negocioId,
          conversaId: conversa.id,
          telefone: dados.telefone,
          direcao: dados.direcao,
          remetente: dados.remetente,
          canal,
          tipo: dados.tipo,
          conteudo: dados.conteudo,
          provider: dados.provider ?? null,
          providerMessageId: dados.providerMessageId ?? null,
          status: dados.status ?? (dados.direcao === "INBOUND" ? "RECEIVED" : "SENT"),
          origem: dados.origem,
          reservaId: dados.reservaId ?? null,
          comentarioId: dados.comentarioId ?? null,
          erro: dados.erro ?? null,
          contextoJson: this.serializar(dados.contexto ?? {}),
          enviadaEm
        }
      });

      return this.mapearMensagem(mensagem);
    } catch (erro) {
      if (this.ehViolacaoDeUnicidade(erro) && dados.providerMessageId) {
        const existente = await this.buscarMensagemPorProviderMessageId(dados.providerMessageId);
        if (existente) return existente;
      }

      throw erro;
    }
  }

  private async obterConversaParaMensagem(dados: NovaMensagemAtendimento, canal: string, enviadaEm: Date) {
    const negocioId = dados.negocioId ?? (await this.inferirNegocioIdPorTelefone(dados.telefone));

    if (dados.conversaId) {
      const existente = await this.prisma.conversaAtendimento.findFirst({
        where: {
          id: dados.conversaId,
          ...(negocioId ? { negocioId } : {})
        },
        include: { cliente: true }
      });

      if (existente) {
        await this.prisma.clienteAtendimento.update({
          where: { id: existente.clienteId },
          data: {
            nome: dados.nomeCliente ?? undefined,
            username: dados.usernameCliente ?? undefined,
            userId: dados.userIdCliente ?? undefined,
            avatarUrl: dados.avatarUrlCliente ?? undefined,
            ultimaInteracaoEm: enviadaEm
          }
        });

        return this.prisma.conversaAtendimento.update({
          where: { id: existente.id },
          data: { ultimaMensagemEm: enviadaEm }
        });
      }
    }

    const clienteExistente = await this.prisma.clienteAtendimento.findFirst({
      where: {
        telefone: dados.telefone,
        negocioId
      }
    });
    const cliente = clienteExistente
      ? await this.prisma.clienteAtendimento.update({
          where: { id: clienteExistente.id },
          data: {
            nome: dados.nomeCliente ?? undefined,
            username: dados.usernameCliente ?? undefined,
            userId: dados.userIdCliente ?? undefined,
            avatarUrl: dados.avatarUrlCliente ?? undefined,
            ultimaInteracaoEm: enviadaEm
          }
        })
      : await this.prisma.clienteAtendimento.create({
          data: {
            negocioId,
            telefone: dados.telefone,
            nome: dados.nomeCliente ?? null,
            username: dados.usernameCliente ?? null,
            userId: dados.userIdCliente ?? null,
            avatarUrl: dados.avatarUrlCliente ?? null,
            origem: dados.origem,
            primeiraInteracaoEm: enviadaEm,
            ultimaInteracaoEm: enviadaEm
          }
        });

    const conversaExistente = await this.prisma.conversaAtendimento.findFirst({
      where: {
        telefone: dados.telefone,
        canal,
        negocioId
      }
    });

    if (conversaExistente) {
      return this.prisma.conversaAtendimento.update({
        where: { id: conversaExistente.id },
        data: {
          clienteId: cliente.id,
          clienteNegocioId: dados.clienteNegocioId ?? conversaExistente.clienteNegocioId,
          ultimaMensagemEm: enviadaEm
        }
      });
    }

    return this.prisma.conversaAtendimento.create({
      data: {
        negocioId,
        clienteNegocioId: dados.clienteNegocioId ?? null,
        clienteId: cliente.id,
        telefone: dados.telefone,
        canal,
        estado: "ABERTA",
        prioridade: "NORMAL",
        ultimaMensagemEm: enviadaEm
      }
    });
  }

  private async inferirNegocioIdPorTelefone(telefone: string): Promise<string | null> {
    const conversas = await this.prisma.conversaAtendimento.findMany({
      where: {
        telefone,
        negocioId: { not: null }
      },
      distinct: ["negocioId"],
      take: 2,
      select: {
        negocioId: true
      }
    });

    return conversas.length === 1 ? conversas[0].negocioId : null;
  }

  async listarConversasComMensagens(limite = 100, negocioId?: string | null): Promise<ConversaAtendimentoComMensagens[]> {
    const conversas = await this.prisma.conversaAtendimento.findMany({
      where: negocioId ? { negocioId } : undefined,
      orderBy: [{ ultimaMensagemEm: "desc" }, { atualizadoEm: "desc" }],
      take: limite,
      include: {
        cliente: true,
        mensagens: { orderBy: { enviadaEm: "asc" } }
      }
    });

    return conversas.map((conversa) => ({
      cliente: this.mapearCliente(conversa.cliente),
      conversa: this.mapearConversa(conversa),
      mensagens: conversa.mensagens.map((mensagem) => this.mapearMensagem(mensagem))
    }));
  }

  async buscarConversaComMensagensPorId(
    id: string,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const conversa = await this.prisma.conversaAtendimento.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      },
      include: {
        cliente: true,
        mensagens: { orderBy: { enviadaEm: "asc" } }
      }
    });

    if (!conversa) return null;

    return {
      cliente: this.mapearCliente(conversa.cliente),
      conversa: this.mapearConversa(conversa),
      mensagens: conversa.mensagens.map((mensagem) => this.mapearMensagem(mensagem))
    };
  }

  async atualizarConversa(
    id: string,
    dados: AtualizacaoConversaAtendimento,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const existente = await this.prisma.conversaAtendimento.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      }
    });
    if (!existente) return null;

    const conversa = await this.prisma.conversaAtendimento.update({
      where: { id },
      data: {
        estado: dados.estado,
        prioridade: dados.prioridade,
        responsavelId: dados.responsavelId,
        tagsJson: dados.tags ? this.serializar(dados.tags) : undefined
      },
      include: {
        cliente: true,
        mensagens: { orderBy: { enviadaEm: "asc" } }
      }
    });

    return {
      cliente: this.mapearCliente(conversa.cliente),
      conversa: this.mapearConversa(conversa),
      mensagens: conversa.mensagens.map((mensagem) => this.mapearMensagem(mensagem))
    };
  }

  async buscarMensagemPorProviderMessageId(providerMessageId: string): Promise<MensagemAtendimento | null> {
    const mensagem = await this.prisma.mensagemAtendimento.findUnique({ where: { providerMessageId } });
    return mensagem ? this.mapearMensagem(mensagem) : null;
  }

  async atualizarStatusMensagemPorProviderMessageId(
    providerMessageId: string,
    dados: { status: MensagemAtendimento["status"]; erro?: string | null; atualizadoEm?: Date }
  ): Promise<MensagemAtendimento | null> {
    const existente = await this.prisma.mensagemAtendimento.findUnique({ where: { providerMessageId } });
    if (!existente) return null;

    const mensagem = await this.prisma.mensagemAtendimento.update({
      where: { providerMessageId },
      data: {
        status: dados.status,
        erro: dados.erro === undefined ? existente.erro : dados.erro
      }
    });
    return this.mapearMensagem(mensagem);
  }

  async limparHistorico() {
    const [mensagensAtendimento, conversasAtendimento, clientesAtendimento] = await this.prisma.$transaction([
      this.prisma.mensagemAtendimento.deleteMany({}),
      this.prisma.conversaAtendimento.deleteMany({}),
      this.prisma.clienteAtendimento.deleteMany({})
    ]);

    return {
      mensagensAtendimento: mensagensAtendimento.count,
      conversasAtendimento: conversasAtendimento.count,
      clientesAtendimento: clientesAtendimento.count
    };
  }

  private mapearCliente(cliente: {
    id: string;
    negocioId: string | null;
    clienteGlobalId: string | null;
    telefone: string;
    nome: string | null;
    username: string | null;
    userId: string | null;
    avatarUrl: string | null;
    origem: string | null;
    tagsJson: string;
    consentimento: boolean;
    primeiraInteracaoEm: Date;
    ultimaInteracaoEm: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  }): ClienteAtendimento {
    return {
      ...cliente,
      tags: this.lerLista(cliente.tagsJson)
    };
  }

  private mapearConversa(conversa: {
    id: string;
    negocioId: string | null;
    clienteNegocioId: string | null;
    clienteId: string;
    telefone: string;
    canal: string;
    estado: string;
    prioridade: string;
    responsavelId: string | null;
    tagsJson: string;
    ultimaMensagemEm: Date | null;
    criadaEm: Date;
    atualizadoEm: Date;
  }): ConversaAtendimento {
    return {
      ...conversa,
      estado: conversa.estado as ConversaAtendimento["estado"],
      prioridade: conversa.prioridade as ConversaAtendimento["prioridade"],
      tags: this.lerLista(conversa.tagsJson)
    };
  }

  private mapearMensagem(mensagem: {
    id: string;
    negocioId: string | null;
    conversaId: string;
    telefone: string;
    direcao: string;
    remetente: string;
    canal: string;
    tipo: string;
    conteudo: string;
    provider: string | null;
    providerMessageId: string | null;
    status: string;
    origem: string;
    reservaId: string | null;
    comentarioId: string | null;
    erro: string | null;
    contextoJson: string;
    enviadaEm: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  }): MensagemAtendimento {
    return {
      ...mensagem,
      direcao: mensagem.direcao as MensagemAtendimento["direcao"],
      remetente: mensagem.remetente as MensagemAtendimento["remetente"],
      status: mensagem.status as MensagemAtendimento["status"],
      contexto: this.parseJson(mensagem.contextoJson)
    };
  }

  private lerLista(valor: string): string[] {
    try {
      const lista = JSON.parse(valor);
      return Array.isArray(lista) ? lista.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private parseJson(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }

  private ehViolacaoDeUnicidade(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
  }
}

interface LinhaSocialInboxItem {
  id: string;
  negocioId: string;
  canal: string;
  provider: string;
  tipo: string;
  estado: string;
  postId: string | null;
  postUrl: string | null;
  autorId: string | null;
  autorUsername: string | null;
  autorNome: string | null;
  autorAvatarUrl: string | null;
  texto: string;
  intencao: string;
  confianca: number;
  clienteTelefone: string | null;
  clienteId: string | null;
  entidadesJson: string;
  contextoJson: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class RepositorioSocialInboxPrisma implements RepositorioSocialInbox {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoSocialInboxItem): Promise<SocialInboxItem> {
    const linhas = await this.prisma.$queryRaw<LinhaSocialInboxItem[]>`
      INSERT INTO "SocialInboxItem" (
        "negocioId",
        "canal",
        "provider",
        "tipo",
        "estado",
        "postId",
        "postUrl",
        "autorId",
        "autorUsername",
        "autorNome",
        "autorAvatarUrl",
        "texto",
        "intencao",
        "confianca",
        "clienteTelefone",
        "clienteId",
        "entidadesJson",
        "contextoJson"
      ) VALUES (
        ${dados.negocioId},
        ${dados.canal},
        ${dados.provider},
        ${dados.tipo},
        ${dados.estado ?? "NOVO"},
        ${dados.postId ?? null},
        ${dados.postUrl ?? null},
        ${dados.autorId ?? null},
        ${dados.autorUsername ?? null},
        ${dados.autorNome ?? null},
        ${dados.autorAvatarUrl ?? null},
        ${dados.texto},
        ${dados.intencao ?? "SEM_INTENCAO"},
        ${dados.confianca ?? 0},
        ${dados.clienteTelefone ?? null},
        ${dados.clienteId ?? null},
        ${JSON.stringify(dados.entidades ?? {})},
        ${JSON.stringify(dados.contexto ?? {})}
      )
      RETURNING *
    `;

    return this.mapearItem(linhas[0]);
  }

  async listar(negocioId: string, filtros: FiltrosSocialInbox = {}): Promise<SocialInboxItem[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const condicoes: Prisma.Sql[] = [Prisma.sql`"negocioId" = ${negocioId}`];
    if (filtros.canal) condicoes.push(Prisma.sql`"canal" = ${filtros.canal}`);
    if (filtros.estado) condicoes.push(Prisma.sql`"estado" = ${filtros.estado}`);
    if (filtros.intencao) condicoes.push(Prisma.sql`"intencao" = ${filtros.intencao}`);
    if (filtros.autorUsername) condicoes.push(Prisma.sql`"autorUsername" = ${filtros.autorUsername}`);
    if (filtros.clienteTelefone) condicoes.push(Prisma.sql`"clienteTelefone" = ${filtros.clienteTelefone}`);

    const linhas = await this.prisma.$queryRaw<LinhaSocialInboxItem[]>(
      Prisma.sql`
        SELECT *
        FROM "SocialInboxItem"
        WHERE ${Prisma.join(condicoes, " AND ")}
        ORDER BY "criadoEm" DESC
        LIMIT ${limite}
      `
    );

    return linhas.map((linha) => this.mapearItem(linha));
  }

  async buscarPorId(id: string, negocioId: string): Promise<SocialInboxItem | null> {
    const linhas = await this.prisma.$queryRaw<LinhaSocialInboxItem[]>`
      SELECT *
      FROM "SocialInboxItem"
      WHERE "id" = ${id} AND "negocioId" = ${negocioId}
      LIMIT 1
    `;

    return linhas[0] ? this.mapearItem(linhas[0]) : null;
  }

  private mapearItem(linha: LinhaSocialInboxItem): SocialInboxItem {
    return {
      id: linha.id,
      negocioId: linha.negocioId,
      canal: linha.canal,
      provider: linha.provider,
      tipo: linha.tipo as SocialInboxItem["tipo"],
      estado: linha.estado as SocialInboxItem["estado"],
      postId: linha.postId,
      postUrl: linha.postUrl,
      autorId: linha.autorId,
      autorUsername: linha.autorUsername,
      autorNome: linha.autorNome,
      autorAvatarUrl: linha.autorAvatarUrl,
      texto: linha.texto,
      intencao: linha.intencao as SocialInboxItem["intencao"],
      confianca: linha.confianca,
      clienteTelefone: linha.clienteTelefone,
      clienteId: linha.clienteId,
      entidades: this.lerObjeto(linha.entidadesJson),
      contexto: this.lerObjeto(linha.contextoJson),
      criadoEm: linha.criadoEm,
      atualizadoEm: linha.atualizadoEm
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

interface LinhaPlaybookRecuperacao {
  id: string;
  negocioId: string;
  nome: string;
  gatilho: string;
  ativo: boolean;
  atrasoMinutos: number;
  condicoesJson: string;
  acao: string;
  tituloTarefa: string | null;
  descricaoTarefa: string | null;
  prioridadeTarefa: string;
  responsavelId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface LinhaExecucaoPlaybookRecuperacao {
  id: string;
  negocioId: string;
  playbookId: string;
  gatilho: string;
  entidadeTipo: string | null;
  entidadeId: string | null;
  clienteTelefone: string | null;
  estado: string;
  tarefaId: string | null;
  motivo: string | null;
  contextoJson: string;
  criadaEm: Date;
}

export class RepositorioPlaybooksRecuperacaoPrisma implements RepositorioPlaybooksRecuperacao {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoPlaybookRecuperacao): Promise<PlaybookRecuperacao> {
    const linhas = await this.prisma.$queryRaw<LinhaPlaybookRecuperacao[]>`
      INSERT INTO "PlaybookRecuperacao" (
        "negocioId",
        "nome",
        "gatilho",
        "ativo",
        "atrasoMinutos",
        "condicoesJson",
        "acao",
        "tituloTarefa",
        "descricaoTarefa",
        "prioridadeTarefa",
        "responsavelId"
      ) VALUES (
        ${dados.negocioId},
        ${dados.nome},
        ${dados.gatilho},
        ${dados.ativo ?? true},
        ${dados.atrasoMinutos ?? 0},
        ${JSON.stringify(dados.condicoes ?? {})},
        ${dados.acao ?? "CRIAR_TAREFA"},
        ${dados.tituloTarefa ?? null},
        ${dados.descricaoTarefa ?? null},
        ${dados.prioridadeTarefa ?? "NORMAL"},
        ${dados.responsavelId ?? null}
      )
      RETURNING *
    `;

    return this.mapearPlaybook(linhas[0]);
  }

  async listar(negocioId: string, filtros: FiltrosPlaybookRecuperacao = {}): Promise<PlaybookRecuperacao[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const condicoes: Prisma.Sql[] = [Prisma.sql`"negocioId" = ${negocioId}`];
    if (filtros.gatilho) condicoes.push(Prisma.sql`"gatilho" = ${filtros.gatilho}`);
    if (filtros.ativo !== undefined) condicoes.push(Prisma.sql`"ativo" = ${filtros.ativo}`);

    const linhas = await this.prisma.$queryRaw<LinhaPlaybookRecuperacao[]>(
      Prisma.sql`
        SELECT *
        FROM "PlaybookRecuperacao"
        WHERE ${Prisma.join(condicoes, " AND ")}
        ORDER BY "criadoEm" DESC
        LIMIT ${limite}
      `
    );

    return linhas.map((linha) => this.mapearPlaybook(linha));
  }

  async buscarPorId(id: string, negocioId: string): Promise<PlaybookRecuperacao | null> {
    const linhas = await this.prisma.$queryRaw<LinhaPlaybookRecuperacao[]>`
      SELECT *
      FROM "PlaybookRecuperacao"
      WHERE "id" = ${id} AND "negocioId" = ${negocioId}
      LIMIT 1
    `;

    return linhas[0] ? this.mapearPlaybook(linhas[0]) : null;
  }

  async registrarExecucao(dados: NovaExecucaoPlaybookRecuperacao): Promise<ExecucaoPlaybookRecuperacao> {
    const linhas = await this.prisma.$queryRaw<LinhaExecucaoPlaybookRecuperacao[]>`
      INSERT INTO "ExecucaoPlaybookRecuperacao" (
        "negocioId",
        "playbookId",
        "gatilho",
        "entidadeTipo",
        "entidadeId",
        "clienteTelefone",
        "estado",
        "tarefaId",
        "motivo",
        "contextoJson"
      ) VALUES (
        ${dados.negocioId},
        ${dados.playbookId},
        ${dados.gatilho},
        ${dados.entidadeTipo ?? null},
        ${dados.entidadeId ?? null},
        ${dados.clienteTelefone ?? null},
        ${dados.estado},
        ${dados.tarefaId ?? null},
        ${dados.motivo ?? null},
        ${JSON.stringify(dados.contexto ?? {})}
      )
      RETURNING *
    `;

    return this.mapearExecucao(linhas[0]);
  }

  async listarExecucoes(
    negocioId: string,
    filtros: FiltrosExecucoesPlaybookRecuperacao = {}
  ): Promise<ExecucaoPlaybookRecuperacao[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const condicoes: Prisma.Sql[] = [Prisma.sql`"negocioId" = ${negocioId}`];
    if (filtros.gatilho) condicoes.push(Prisma.sql`"gatilho" = ${filtros.gatilho}`);
    if (filtros.estado) condicoes.push(Prisma.sql`"estado" = ${filtros.estado}`);
    if (filtros.entidadeTipo) condicoes.push(Prisma.sql`"entidadeTipo" = ${filtros.entidadeTipo}`);
    if (filtros.entidadeId) condicoes.push(Prisma.sql`"entidadeId" = ${filtros.entidadeId}`);

    const linhas = await this.prisma.$queryRaw<LinhaExecucaoPlaybookRecuperacao[]>(
      Prisma.sql`
        SELECT *
        FROM "ExecucaoPlaybookRecuperacao"
        WHERE ${Prisma.join(condicoes, " AND ")}
        ORDER BY "criadaEm" DESC
        LIMIT ${limite}
      `
    );

    return linhas.map((linha) => this.mapearExecucao(linha));
  }

  private mapearPlaybook(linha: LinhaPlaybookRecuperacao): PlaybookRecuperacao {
    return {
      id: linha.id,
      negocioId: linha.negocioId,
      nome: linha.nome,
      gatilho: linha.gatilho as PlaybookRecuperacao["gatilho"],
      ativo: linha.ativo,
      atrasoMinutos: linha.atrasoMinutos,
      condicoes: this.lerObjeto(linha.condicoesJson),
      acao: linha.acao as PlaybookRecuperacao["acao"],
      tituloTarefa: linha.tituloTarefa,
      descricaoTarefa: linha.descricaoTarefa,
      prioridadeTarefa: linha.prioridadeTarefa as PlaybookRecuperacao["prioridadeTarefa"],
      responsavelId: linha.responsavelId,
      criadoEm: linha.criadoEm,
      atualizadoEm: linha.atualizadoEm
    };
  }

  private mapearExecucao(linha: LinhaExecucaoPlaybookRecuperacao): ExecucaoPlaybookRecuperacao {
    return {
      id: linha.id,
      negocioId: linha.negocioId,
      playbookId: linha.playbookId,
      gatilho: linha.gatilho as ExecucaoPlaybookRecuperacao["gatilho"],
      entidadeTipo: linha.entidadeTipo,
      entidadeId: linha.entidadeId,
      clienteTelefone: linha.clienteTelefone,
      estado: linha.estado as ExecucaoPlaybookRecuperacao["estado"],
      tarefaId: linha.tarefaId,
      motivo: linha.motivo,
      contexto: this.lerObjeto(linha.contextoJson),
      criadaEm: linha.criadaEm
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

interface LinhaMovimentoFunilComercial {
  id: string;
  negocioId: string;
  entidadeTipo: string;
  entidadeId: string;
  etapaAnterior: string | null;
  etapaNova: string;
  motivo: string;
  origem: string | null;
  autorId: string | null;
  contextoJson: string;
  criadoEm: Date;
}

export class RepositorioFunilComercialPrisma implements RepositorioFunilComercial {
  constructor(private readonly prisma: PrismaClient) {}

  async registrarMovimento(dados: NovoMovimentoFunilComercial): Promise<MovimentoFunilComercial> {
    const linhas = await this.prisma.$queryRaw<LinhaMovimentoFunilComercial[]>`
      INSERT INTO "MovimentoFunilComercial" (
        "negocioId",
        "entidadeTipo",
        "entidadeId",
        "etapaAnterior",
        "etapaNova",
        "motivo",
        "origem",
        "autorId",
        "contextoJson"
      ) VALUES (
        ${dados.negocioId},
        ${dados.entidadeTipo},
        ${dados.entidadeId},
        ${dados.etapaAnterior ?? null},
        ${dados.etapaNova},
        ${dados.motivo},
        ${dados.origem ?? null},
        ${dados.autorId ?? null},
        ${JSON.stringify(dados.contexto ?? {})}
      )
      RETURNING *
    `;

    return this.mapearMovimento(linhas[0]);
  }

  async listarMovimentos(
    negocioId: string,
    filtros: FiltrosMovimentosFunilComercial = {}
  ): Promise<MovimentoFunilComercial[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const condicoes: Prisma.Sql[] = [Prisma.sql`"negocioId" = ${negocioId}`];
    if (filtros.entidadeTipo) condicoes.push(Prisma.sql`"entidadeTipo" = ${filtros.entidadeTipo}`);
    if (filtros.entidadeId) condicoes.push(Prisma.sql`"entidadeId" = ${filtros.entidadeId}`);
    if (filtros.etapaNova) condicoes.push(Prisma.sql`"etapaNova" = ${filtros.etapaNova}`);
    if (filtros.origem) condicoes.push(Prisma.sql`"origem" = ${filtros.origem}`);

    const linhas = await this.prisma.$queryRaw<LinhaMovimentoFunilComercial[]>(
      Prisma.sql`
        SELECT *
        FROM "MovimentoFunilComercial"
        WHERE ${Prisma.join(condicoes, " AND ")}
        ORDER BY "criadoEm" DESC, "id" DESC
        LIMIT ${limite}
      `
    );

    return linhas.map((linha) => this.mapearMovimento(linha));
  }

  private mapearMovimento(linha: LinhaMovimentoFunilComercial): MovimentoFunilComercial {
    return {
      id: linha.id,
      negocioId: linha.negocioId,
      entidadeTipo: linha.entidadeTipo,
      entidadeId: linha.entidadeId,
      etapaAnterior: linha.etapaAnterior as MovimentoFunilComercial["etapaAnterior"],
      etapaNova: linha.etapaNova as MovimentoFunilComercial["etapaNova"],
      motivo: linha.motivo,
      origem: linha.origem,
      autorId: linha.autorId,
      contexto: this.lerObjeto(linha.contextoJson),
      criadoEm: linha.criadoEm
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

interface LinhaOportunidadeRecuperacao {
  id: string;
  negocioId: string;
  gatilho: string;
  estado: string;
  entidadeTipo: string | null;
  entidadeId: string | null;
  clienteTelefone: string | null;
  playbookId: string | null;
  execucaoPlaybookId: string | null;
  tarefaId: string | null;
  movimentoFunilId: string | null;
  valorEstimadoEmKwanza: number | null;
  motivo: string;
  responsavelId: string | null;
  observacao: string | null;
  contextoJson: string;
  criadaEm: Date;
  atualizadaEm: Date;
  encerradaEm: Date | null;
}

export class RepositorioOportunidadesRecuperacaoPrisma implements RepositorioOportunidadesRecuperacao {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaOportunidadeRecuperacao): Promise<OportunidadeRecuperacao> {
    const estado = dados.estado ?? "ABERTA";
    const linhas = await this.prisma.$queryRaw<LinhaOportunidadeRecuperacao[]>`
      INSERT INTO "OportunidadeRecuperacao" (
        "negocioId",
        "gatilho",
        "estado",
        "entidadeTipo",
        "entidadeId",
        "clienteTelefone",
        "playbookId",
        "execucaoPlaybookId",
        "tarefaId",
        "movimentoFunilId",
        "valorEstimadoEmKwanza",
        "motivo",
        "responsavelId",
        "observacao",
        "contextoJson",
        "encerradaEm"
      ) VALUES (
        ${dados.negocioId},
        ${dados.gatilho},
        ${estado},
        ${dados.entidadeTipo ?? null},
        ${dados.entidadeId ?? null},
        ${dados.clienteTelefone ?? null},
        ${dados.playbookId ?? null},
        ${dados.execucaoPlaybookId ?? null},
        ${dados.tarefaId ?? null},
        ${dados.movimentoFunilId ?? null},
        ${dados.valorEstimadoEmKwanza ?? null},
        ${dados.motivo},
        ${dados.responsavelId ?? null},
        ${dados.observacao ?? null},
        ${JSON.stringify(dados.contexto ?? {})},
        ${this.ehEstadoFinal(estado) ? new Date() : null}
      )
      RETURNING *
    `;

    return this.mapearOportunidade(linhas[0]);
  }

  async listar(
    negocioId: string,
    filtros: FiltrosOportunidadesRecuperacao = {}
  ): Promise<OportunidadeRecuperacao[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const condicoes: Prisma.Sql[] = [Prisma.sql`"negocioId" = ${negocioId}`];
    if (filtros.gatilho) condicoes.push(Prisma.sql`"gatilho" = ${filtros.gatilho}`);
    if (filtros.estado) condicoes.push(Prisma.sql`"estado" = ${filtros.estado}`);
    if (filtros.entidadeTipo) condicoes.push(Prisma.sql`"entidadeTipo" = ${filtros.entidadeTipo}`);
    if (filtros.entidadeId) condicoes.push(Prisma.sql`"entidadeId" = ${filtros.entidadeId}`);
    if (filtros.responsavelId !== undefined) {
      condicoes.push(
        filtros.responsavelId === null
          ? Prisma.sql`"responsavelId" IS NULL`
          : Prisma.sql`"responsavelId" = ${filtros.responsavelId}`
      );
    }

    const linhas = await this.prisma.$queryRaw<LinhaOportunidadeRecuperacao[]>(
      Prisma.sql`
        SELECT *
        FROM "OportunidadeRecuperacao"
        WHERE ${Prisma.join(condicoes, " AND ")}
        ORDER BY "criadaEm" DESC
        LIMIT ${limite}
      `
    );

    return linhas.map((linha) => this.mapearOportunidade(linha));
  }

  async buscarPorId(id: string, negocioId: string): Promise<OportunidadeRecuperacao | null> {
    const linhas = await this.prisma.$queryRaw<LinhaOportunidadeRecuperacao[]>`
      SELECT *
      FROM "OportunidadeRecuperacao"
      WHERE "id" = ${id} AND "negocioId" = ${negocioId}
      LIMIT 1
    `;

    return linhas[0] ? this.mapearOportunidade(linhas[0]) : null;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoOportunidadeRecuperacao
  ): Promise<OportunidadeRecuperacao | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;

    const estado = dados.estado ?? atual.estado;
    const encerradaEm = this.ehEstadoFinal(estado) ? atual.encerradaEm ?? new Date() : null;
    const contexto = dados.contexto ? { ...atual.contexto, ...dados.contexto } : atual.contexto;
    const linhas = await this.prisma.$queryRaw<LinhaOportunidadeRecuperacao[]>`
      UPDATE "OportunidadeRecuperacao"
      SET
        "estado" = ${estado},
        "responsavelId" = ${dados.responsavelId !== undefined ? dados.responsavelId : atual.responsavelId},
        "observacao" = ${dados.observacao !== undefined ? dados.observacao : atual.observacao},
        "contextoJson" = ${JSON.stringify(contexto)},
        "encerradaEm" = ${encerradaEm},
        "atualizadaEm" = ${new Date()}
      WHERE "id" = ${id} AND "negocioId" = ${negocioId}
      RETURNING *
    `;

    return linhas[0] ? this.mapearOportunidade(linhas[0]) : null;
  }

  private mapearOportunidade(linha: LinhaOportunidadeRecuperacao): OportunidadeRecuperacao {
    return {
      id: linha.id,
      negocioId: linha.negocioId,
      gatilho: linha.gatilho as OportunidadeRecuperacao["gatilho"],
      estado: linha.estado as OportunidadeRecuperacao["estado"],
      entidadeTipo: linha.entidadeTipo,
      entidadeId: linha.entidadeId,
      clienteTelefone: linha.clienteTelefone,
      playbookId: linha.playbookId,
      execucaoPlaybookId: linha.execucaoPlaybookId,
      tarefaId: linha.tarefaId,
      movimentoFunilId: linha.movimentoFunilId,
      valorEstimadoEmKwanza: linha.valorEstimadoEmKwanza,
      motivo: linha.motivo,
      responsavelId: linha.responsavelId,
      observacao: linha.observacao,
      contexto: this.lerObjeto(linha.contextoJson),
      criadaEm: linha.criadaEm,
      atualizadaEm: linha.atualizadaEm,
      encerradaEm: linha.encerradaEm
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private ehEstadoFinal(estado: string): boolean {
    return estado === "RECUPERADA" || estado === "PERDIDA" || estado === "CANCELADA";
  }
}

interface LinhaTarefaOperacional {
  id: string;
  negocioId: string | null;
  tipo: string;
  titulo: string;
  descricao: string;
  prioridade: string;
  estado: string;
  origem: string | null;
  clienteId: string | null;
  pedidoId: string | null;
  entidadeTipo: string | null;
  entidadeId: string | null;
  clienteTelefone: string | null;
  responsavelId: string | null;
  prazoEm: Date | null;
  observacao: string | null;
  contextoJson: string;
  concluidaEm: Date | null;
  criadaEm: Date;
  atualizadoEm: Date;
}

export class RepositorioTarefasOperacionaisPrisma implements RepositorioTarefasOperacionais {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaTarefaOperacional): Promise<TarefaOperacional> {
    const linhas = await this.prisma.$queryRaw<LinhaTarefaOperacional[]>`
      INSERT INTO "TarefaOperacional" (
        "negocioId",
        "tipo",
        "titulo",
        "descricao",
        "prioridade",
        "estado",
        "origem",
        "clienteId",
        "pedidoId",
        "entidadeTipo",
        "entidadeId",
        "clienteTelefone",
        "responsavelId",
        "prazoEm",
        "observacao",
        "contextoJson",
        "concluidaEm"
      ) VALUES (
        ${dados.negocioId ?? null},
        ${dados.tipo},
        ${dados.titulo},
        ${dados.descricao},
        ${dados.prioridade ?? "NORMAL"},
        ${dados.estado ?? "ABERTA"},
        ${dados.origem ?? null},
        ${dados.clienteId ?? null},
        ${dados.pedidoId ?? null},
        ${dados.entidadeTipo ?? null},
        ${dados.entidadeId ?? null},
        ${dados.clienteTelefone ?? null},
        ${dados.responsavelId ?? null},
        ${dados.prazoEm ?? null},
        ${dados.observacao ?? null},
        ${JSON.stringify(dados.contexto ?? {})},
        ${(dados.estado ?? "ABERTA") === "CONCLUIDA" ? new Date() : null}
      )
      RETURNING *
    `;

    return this.mapearTarefa(linhas[0]);
  }

  async listar(negocioId: string, filtros: FiltrosTarefasOperacionais = {}): Promise<TarefaOperacional[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const condicoes: Prisma.Sql[] = [Prisma.sql`"negocioId" = ${negocioId}`];
    if (filtros.tipo) condicoes.push(Prisma.sql`"tipo" = ${filtros.tipo}`);
    if (filtros.estado) condicoes.push(Prisma.sql`"estado" = ${filtros.estado}`);
    if (filtros.responsavelId !== undefined) {
      condicoes.push(
        filtros.responsavelId === null
          ? Prisma.sql`"responsavelId" IS NULL`
          : Prisma.sql`"responsavelId" = ${filtros.responsavelId}`
      );
    }

    const linhas = await this.prisma.$queryRaw<LinhaTarefaOperacional[]>(
      Prisma.sql`
        SELECT *
        FROM "TarefaOperacional"
        WHERE ${Prisma.join(condicoes, " AND ")}
        ORDER BY "criadaEm" DESC
        LIMIT ${limite}
      `
    );

    return linhas.map((linha) => this.mapearTarefa(linha));
  }

  async buscarPorId(id: string, negocioId: string): Promise<TarefaOperacional | null> {
    const linhas = await this.prisma.$queryRaw<LinhaTarefaOperacional[]>`
      SELECT *
      FROM "TarefaOperacional"
      WHERE "id" = ${id} AND "negocioId" = ${negocioId}
      LIMIT 1
    `;

    return linhas[0] ? this.mapearTarefa(linhas[0]) : null;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoTarefaOperacional
  ): Promise<TarefaOperacional | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;

    const estado = dados.estado ?? atual.estado;
    const agora = new Date();
    const concluidaEm = estado === "CONCLUIDA" ? atual.concluidaEm ?? agora : null;
    const contexto = dados.contexto ? { ...atual.contexto, ...dados.contexto } : atual.contexto;
    const linhas = await this.prisma.$queryRaw<LinhaTarefaOperacional[]>`
      UPDATE "TarefaOperacional"
      SET
        "tipo" = ${dados.tipo ?? atual.tipo},
        "titulo" = ${dados.titulo ?? atual.titulo},
        "descricao" = ${dados.descricao ?? atual.descricao},
        "prioridade" = ${dados.prioridade ?? atual.prioridade},
        "estado" = ${estado},
        "origem" = ${dados.origem !== undefined ? dados.origem : atual.origem},
        "clienteId" = ${dados.clienteId !== undefined ? dados.clienteId : atual.clienteId},
        "pedidoId" = ${dados.pedidoId !== undefined ? dados.pedidoId : atual.pedidoId},
        "entidadeTipo" = ${dados.entidadeTipo !== undefined ? dados.entidadeTipo : atual.entidadeTipo},
        "entidadeId" = ${dados.entidadeId !== undefined ? dados.entidadeId : atual.entidadeId},
        "clienteTelefone" = ${dados.clienteTelefone !== undefined ? dados.clienteTelefone : atual.clienteTelefone},
        "responsavelId" = ${dados.responsavelId !== undefined ? dados.responsavelId : atual.responsavelId},
        "prazoEm" = ${dados.prazoEm !== undefined ? dados.prazoEm : atual.prazoEm},
        "observacao" = ${dados.observacao !== undefined ? dados.observacao : atual.observacao},
        "contextoJson" = ${JSON.stringify(contexto)},
        "concluidaEm" = ${concluidaEm},
        "atualizadoEm" = ${agora}
      WHERE "id" = ${id} AND "negocioId" = ${negocioId}
      RETURNING *
    `;

    return linhas[0] ? this.mapearTarefa(linhas[0]) : null;
  }

  private mapearTarefa(linha: LinhaTarefaOperacional): TarefaOperacional {
    return {
      id: linha.id,
      negocioId: linha.negocioId,
      tipo: linha.tipo,
      titulo: linha.titulo,
      descricao: linha.descricao,
      prioridade: linha.prioridade as TarefaOperacional["prioridade"],
      estado: linha.estado as TarefaOperacional["estado"],
      origem: linha.origem,
      clienteId: linha.clienteId,
      pedidoId: linha.pedidoId,
      entidadeTipo: linha.entidadeTipo,
      entidadeId: linha.entidadeId,
      clienteTelefone: linha.clienteTelefone,
      responsavelId: linha.responsavelId,
      prazoEm: linha.prazoEm,
      observacao: linha.observacao,
      contexto: this.lerObjeto(linha.contextoJson),
      concluidaEm: linha.concluidaEm,
      criadaEm: linha.criadaEm,
      atualizadoEm: linha.atualizadoEm
    };
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

export class RepositorioAuditoriaPrisma implements RepositorioAuditoria {
  constructor(private readonly prisma: PrismaClient) {}

  async registrarEventoSistema(evento: EventoSistema): Promise<void> {
    await this.prisma.eventoSistema.upsert({
      where: { id: evento.id },
      create: {
        id: evento.id,
        negocioId: this.obterNegocioId(evento.dados),
        tipo: evento.tipo,
        dadosJson: this.serializar(evento.dados),
        criadoEm: evento.criadoEm
      },
      update: {
        negocioId: this.obterNegocioId(evento.dados),
        tipo: evento.tipo,
        dadosJson: this.serializar(evento.dados)
      }
    });
  }

  async listarEventosSistema(filtros: {
    negocioId?: string | null;
    tipo?: EventoSistema["tipo"];
    limite?: number;
  } = {}): Promise<EventoSistema[]> {
    const where: Prisma.EventoSistemaWhereInput = {};
    if (filtros.negocioId !== undefined) where.negocioId = filtros.negocioId ?? null;
    if (filtros.tipo) where.tipo = filtros.tipo;

    const eventos = await this.prisma.eventoSistema.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: Math.max(1, Math.min(filtros.limite ?? 100, 500))
    });

    return eventos.map((evento) => this.mapearEventoSistema(evento));
  }

  async registrarMensagemWhatsApp(dados: {
    negocioId?: string | null;
    telefone: string;
    tipo: string;
    conteudo: string;
    provider: string;
    idExterno?: string | null;
    enviadaEm?: Date;
  }): Promise<void> {
    await this.prisma.mensagemWhatsapp.create({
      data: {
        negocioId: dados.negocioId ?? null,
        telefone: dados.telefone,
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        provider: dados.provider,
        idExterno: dados.idExterno ?? null,
        enviadaEm: dados.enviadaEm ?? new Date()
      }
    });
  }

  async criarEventoN8n(evento: EventoSistema): Promise<RegistroOutboxEventoN8n> {
    const registro = await this.prisma.outboxEventoN8n.create({
      data: {
        negocioId: this.obterNegocioId(evento.dados),
        eventoId: evento.id,
        tipo: evento.tipo,
        payloadJson: this.serializar(evento.dados),
        status: "PENDENTE",
        proximaTentativaEm: new Date()
      }
    });

    return this.mapearOutbox(registro);
  }

  async listarEventosN8n(limite = 100): Promise<RegistroOutboxEventoN8n[]> {
    const registros = await this.prisma.outboxEventoN8n.findMany({
      orderBy: { criadoEm: "desc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutbox(registro));
  }

  async listarEventosN8nPendentes(limite: number, agora: Date): Promise<RegistroOutboxEventoN8n[]> {
    const registros = await this.prisma.outboxEventoN8n.findMany({
      where: {
        status: { in: ["PENDENTE", "FALHOU"] },
        proximaTentativaEm: { lte: agora }
      },
      orderBy: { criadoEm: "asc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutbox(registro));
  }

  async marcarEventoN8nPublicado(id: string, publicadoEm: Date): Promise<void> {
    await this.prisma.outboxEventoN8n.update({
      where: { id },
      data: {
        status: "PUBLICADO",
        publicadoEm,
        ultimoErro: null
      }
    });
  }

  async marcarEventoN8nFalha(id: string, erro: string, proximaTentativaEm: Date): Promise<void> {
    await this.prisma.outboxEventoN8n.update({
      where: { id },
      data: {
        status: "FALHOU",
        tentativas: { increment: 1 },
        ultimoErro: erro.slice(0, 1000),
        proximaTentativaEm
      }
    });
  }

  async resumirEventosN8n(): Promise<ResumoOutboxEventoN8n> {
    const [total, pendentes, publicados, falhados, proximo, ultimaFalha, ultimoAtualizado] = await Promise.all([
      this.prisma.outboxEventoN8n.count(),
      this.prisma.outboxEventoN8n.count({ where: { status: "PENDENTE" } }),
      this.prisma.outboxEventoN8n.count({ where: { status: "PUBLICADO" } }),
      this.prisma.outboxEventoN8n.count({ where: { status: "FALHOU" } }),
      this.prisma.outboxEventoN8n.findFirst({
        where: { status: { in: ["PENDENTE", "FALHOU"] } },
        orderBy: { proximaTentativaEm: "asc" },
        select: { proximaTentativaEm: true }
      }),
      this.prisma.outboxEventoN8n.findFirst({
        where: { status: "FALHOU" },
        orderBy: { atualizadoEm: "desc" },
        select: { ultimoErro: true }
      }),
      this.prisma.outboxEventoN8n.findFirst({
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true }
      })
    ]);

    return {
      total,
      pendentes,
      publicados,
      falhados,
      proximaTentativaEm: proximo?.proximaTentativaEm ?? null,
      ultimaFalha: ultimaFalha?.ultimoErro ?? null,
      atualizadoEm: ultimoAtualizado?.atualizadoEm ?? null
    };
  }

  async criarMensagemWhatsAppPendente(dados: NovoOutboxMensagemWhatsApp): Promise<RegistroOutboxMensagemWhatsApp> {
    const registro = await this.prisma.outboxMensagemWhatsApp.create({
      data: {
        negocioId: dados.negocioId ?? this.obterNegocioId(dados.contexto ?? {}),
        telefone: dados.telefone,
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        contextoJson: this.serializar(dados.contexto ?? {}),
        status: "PENDENTE",
        maxTentativas: Math.max(1, dados.maxTentativas ?? 5),
        proximaTentativaEm: dados.proximaTentativaEm ?? new Date(),
        ultimoErro: dados.ultimoErro ?? null
      }
    });

    return this.mapearOutboxWhatsApp(registro);
  }

  async listarMensagensWhatsApp(limite = 100, negocioId?: string | null): Promise<RegistroOutboxMensagemWhatsApp[]> {
    const registros = await this.prisma.outboxMensagemWhatsApp.findMany({
      where: this.filtroNegocioOutboxWhatsApp(negocioId),
      orderBy: { criadoEm: "desc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutboxWhatsApp(registro));
  }

  async listarMensagensWhatsAppPendentes(
    limite: number,
    agora: Date,
    opcoes: { incluirFalhadas?: boolean; negocioId?: string | null } = {}
  ): Promise<RegistroOutboxMensagemWhatsApp[]> {
    const registros = await this.prisma.outboxMensagemWhatsApp.findMany({
      where: {
        ...this.filtroNegocioOutboxWhatsApp(opcoes.negocioId),
        status: { in: opcoes.incluirFalhadas ? ["PENDENTE", "FALHOU"] : ["PENDENTE"] },
        proximaTentativaEm: { lte: agora }
      },
      orderBy: { criadoEm: "asc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutboxWhatsApp(registro));
  }

  async marcarMensagemWhatsAppEnviada(
    id: string,
    dados: { provider: string; idExterno?: string | null; enviadaEm: Date }
  ): Promise<void> {
    await this.prisma.outboxMensagemWhatsApp.update({
      where: { id },
      data: {
        status: "ENVIADA",
        provider: dados.provider,
        idExterno: dados.idExterno ?? null,
        enviadaEm: dados.enviadaEm,
        ultimoErro: null
      }
    });
  }

  async marcarMensagemWhatsAppFalha(
    id: string,
    erro: string,
    proximaTentativaEm: Date,
    opcoes: { falhaFinal?: boolean } = {}
  ): Promise<void> {
    await this.prisma.outboxMensagemWhatsApp.update({
      where: { id },
      data: {
        status: opcoes.falhaFinal ? "FALHOU" : "PENDENTE",
        tentativas: { increment: 1 },
        ultimoErro: erro.slice(0, 1000),
        proximaTentativaEm
      }
    });
  }

  async resumirMensagensWhatsAppOutbox(negocioId?: string | null): Promise<ResumoOutboxMensagemWhatsApp> {
    const filtroNegocio = this.filtroNegocioOutboxWhatsApp(negocioId);
    const [total, pendentes, enviadas, falhadas, proximo, ultimaFalha, ultimoAtualizado] = await Promise.all([
      this.prisma.outboxMensagemWhatsApp.count({ where: filtroNegocio }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { ...filtroNegocio, status: "PENDENTE" } }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { ...filtroNegocio, status: "ENVIADA" } }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { ...filtroNegocio, status: "FALHOU" } }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: { ...filtroNegocio, status: { in: ["PENDENTE", "FALHOU"] } },
        orderBy: { proximaTentativaEm: "asc" },
        select: { proximaTentativaEm: true }
      }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: { ...filtroNegocio, ultimoErro: { not: null } },
        orderBy: { atualizadoEm: "desc" },
        select: { ultimoErro: true }
      }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: filtroNegocio,
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true }
      })
    ]);

    return {
      total,
      pendentes,
      enviadas,
      falhadas,
      proximaTentativaEm: proximo?.proximaTentativaEm ?? null,
      ultimaFalha: ultimaFalha?.ultimoErro ?? null,
      atualizadoEm: ultimoAtualizado?.atualizadoEm ?? null
    };
  }

  async limparMensagensComunicacao() {
    const [mensagensWhatsapp, outboxWhatsapp] = await this.prisma.$transaction([
      this.prisma.mensagemWhatsapp.deleteMany({}),
      this.prisma.outboxMensagemWhatsApp.deleteMany({})
    ]);

    return {
      mensagensWhatsapp: mensagensWhatsapp.count,
      outboxWhatsapp: outboxWhatsapp.count
    };
  }

  private mapearEventoSistema(registro: {
    id: string;
    tipo: string;
    dadosJson: string;
    criadoEm: Date;
  }): EventoSistema {
    return {
      id: registro.id,
      tipo: registro.tipo as EventoSistema["tipo"],
      dados: this.parseJson(registro.dadosJson),
      criadoEm: registro.criadoEm
    };
  }

  private mapearOutbox(registro: {
    id: string;
    eventoId: string;
    tipo: string;
    payloadJson: string;
    status: string;
    tentativas: number;
    proximaTentativaEm: Date;
    ultimoErro: string | null;
    publicadoEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RegistroOutboxEventoN8n {
    return {
      id: registro.id,
      eventoId: registro.eventoId,
      tipo: registro.tipo as RegistroOutboxEventoN8n["tipo"],
      payload: this.parseJson(registro.payloadJson),
      status: registro.status as RegistroOutboxEventoN8n["status"],
      tentativas: registro.tentativas,
      proximaTentativaEm: registro.proximaTentativaEm,
      ultimoErro: registro.ultimoErro,
      publicadoEm: registro.publicadoEm,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm
    };
  }

  private mapearOutboxWhatsApp(registro: {
    id: string;
    negocioId: string | null;
    telefone: string;
    tipo: string;
    conteudo: string;
    contextoJson: string;
    status: string;
    tentativas: number;
    maxTentativas: number;
    proximaTentativaEm: Date;
    ultimoErro: string | null;
    provider: string | null;
    idExterno: string | null;
    enviadaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RegistroOutboxMensagemWhatsApp {
    return {
      id: registro.id,
      negocioId: registro.negocioId,
      telefone: registro.telefone,
      tipo: registro.tipo,
      conteudo: registro.conteudo,
      contexto: this.parseJson(registro.contextoJson),
      status: registro.status as RegistroOutboxMensagemWhatsApp["status"],
      tentativas: registro.tentativas,
      maxTentativas: registro.maxTentativas,
      proximaTentativaEm: registro.proximaTentativaEm,
      ultimoErro: registro.ultimoErro,
      provider: registro.provider,
      idExterno: registro.idExterno,
      enviadaEm: registro.enviadaEm,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm
    };
  }

  private parseJson(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }

  private filtroNegocioOutboxWhatsApp(negocioId?: string | null): Prisma.OutboxMensagemWhatsAppWhereInput {
    return negocioId === undefined ? {} : { negocioId: negocioId ?? null };
  }

  private obterNegocioId(dados: Record<string, unknown>): string | null {
    const direto = typeof dados.negocioId === "string" && dados.negocioId.trim() ? dados.negocioId : null;
    if (direto) return direto;

    const contexto = this.obterObjeto(dados.contexto);
    const negocioContexto =
      typeof contexto.negocioId === "string" && contexto.negocioId.trim() ? contexto.negocioId : null;
    if (negocioContexto) return negocioContexto;

    const reserva = this.obterObjeto(dados.reserva ?? contexto.reserva);
    return typeof reserva.negocioId === "string" && reserva.negocioId.trim() ? reserva.negocioId : null;
  }

  private obterObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }
}
