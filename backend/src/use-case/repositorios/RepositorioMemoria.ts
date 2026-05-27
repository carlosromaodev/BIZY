import { randomUUID } from "node:crypto";
import type {
  RepositorioAutenticacao,
  RepositorioAfiliados,
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioCampanhas,
  RepositorioClientes,
  RepositorioCompartilhamentoClientes,
  RepositorioComentarios,
  RepositorioEventosOperacionais,
  RepositorioFunilComercial,
  RepositorioInstanciasWhatsApp,
  RepositorioJobsOperacionais,
  RepositorioMembrosNegocio,
  RepositorioOportunidadesRecuperacao,
  RepositorioPecas,
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
  AtualizarPeca,
  AuditoriaCompartilhamentoCliente,
  CodigoLoginSms,
  CampanhaCrm,
  ClienteAtendimento,
  Cliente360,
  CompartilhamentoClienteRecebido,
  CompartilhamentoClienteSeguro,
  ConfirmacaoPagamentoPedido,
  ConversaAtendimento,
  ConversaAtendimentoComMensagens,
  ComissaoParceiro,
  DadosCriacaoReservaComControleStock,
  DadosCliente360,
  DadosPedidoResolvido,
  EstadoComentario,
  EstadoPagamento,
  EstadoPeca,
  EstadoReserva,
  EventoOperacional,
  EventoTrackingComercial,
  ExecucaoPlaybookRecuperacao,
  FiltrosCampanhasCrm,
  FiltrosEventosOperacionais,
  FiltrosPedidos,
  FiltrosClientes360,
  FiltrosExecucoesPlaybookRecuperacao,
  FiltrosMovimentosFunilComercial,
  FiltrosOportunidadesRecuperacao,
  FiltrosPlaybookRecuperacao,
  AtualizacaoTarefaOperacional,
  EventoSistema,
  HistoricoComissaoParceiro,
  InstanciaWhatsApp,
  ItemCampanhaCrm,
  JobOperacional,
  ItemLotePagamentoComissao,
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
  NovoLotePagamentoComissao,
  NovoLinkAfiliado,
  NovoMovimentoFunilComercial,
  NovoPlaybookRecuperacao,
  NovoMovimentoStock,
  NovoParceiroComercial,
  NovoTemplateWhatsAppNegocio,
  NovaPeca,
  NovaReserva,
  NovoOutboxMensagemWhatsApp,
  NovoRegistroSessaoLive,
  NovaTarefaOperacional,
  NovoRegistroComentario,
  Peca,
  Pedido,
  RegistroComprovativoPagamentoPedido,
  OportunidadeRecuperacao,
  ParceiroComercial,
  PlaybookRecuperacao,
  RejeicaoPagamentoPedido,
  RelacaoNegocioCompartilhamento,
  LinkAfiliado,
  RegistroOutboxEventoN8n,
  RegistroOutboxMensagemWhatsApp,
  RegistroComentario,
  RegistroSessaoLive,
  Reserva,
  ResumoOutboxEventoN8n,
  ResumoOutboxMensagemWhatsApp,
  ResultadoInterpretacaoComentario,
  ResumoAfiliadosComerciais,
  FiltrosTarefasOperacionais,
  FiltrosSocialInbox,
  NovoSocialInboxItem,
  TarefaOperacional,
  SocialInboxItem,
  TemplateWhatsAppNegocio,
  TipoHistoricoComissaoParceiro
} from "../../dominio/tipos.js";
import { normalizarEmail, normalizarTelefone } from "../../dominio/servicos/normalizarContato.js";
import type {
  DadosIdentidadeAutenticacao,
  DadosNegocioBizy,
  DadosPublicacaoLoja,
  DadosPerfilEstudantil,
  NegocioBizy,
  PerfilEstudantilUsuario,
  ResumoTrackingComercial,
  UsuarioSistema
} from "../../dominio/tipos.js";

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
import { modulosNegocioPadrao } from "../../dominio/tipos.js";

const estadosQueBloqueiamStock: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "PAID"];
const estadosAtivosParaDuplicidade: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"];

export class RepositorioPecasMemoria implements RepositorioPecas {
  private readonly pecas = new Map<string, Peca>();
  private readonly movimentosStock = new Map<string, MovimentoStock>();

  async criar(dados: NovaPeca): Promise<Peca> {
    const chave = this.chavePeca(dados.codigo, dados.negocioId ?? null);
    if (this.pecas.has(chave)) {
      throw new Error(`Peça #${dados.codigo} já existe.`);
    }

    const agora = new Date();
    const peca: Peca = {
      id: randomUUID(),
      codigo: dados.codigo,
      negocioId: dados.negocioId ?? null,
      sku: dados.sku ?? null,
      nome: dados.nome,
      descricao: dados.descricao,
      categoria: dados.categoria ?? null,
      colecao: dados.colecao ?? null,
      precoEmKwanza: dados.precoEmKwanza,
      custoEmKwanza: dados.custoEmKwanza ?? null,
      margemEstimadaEmKwanza: this.calcularMargem(dados.precoEmKwanza, dados.custoEmKwanza ?? null),
      quantidade: dados.quantidade,
      stockMinimo: dados.stockMinimo ?? 0,
      fotos: dados.fotos,
      variantes: dados.variantes ?? {},
      vitrine: dados.vitrine ?? this.vitrinePadrao(),
      estado: dados.estado ?? (dados.quantidade > 0 ? "DISPONIVEL" : "ESGOTADA"),
      estadoStock: "DISPONIVEL",
      arquivadaEm: dados.arquivadaEm ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };
    const enriquecida = this.enriquecerPeca(peca);

    this.pecas.set(chave, enriquecida);
    return enriquecida;
  }

  async listar(negocioId?: string | null): Promise<Peca[]> {
    return [...this.pecas.values()]
      .filter((peca) => !negocioId || peca.negocioId === negocioId)
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-AO", { numeric: true }));
  }

  async buscarPorCodigo(codigo: string, negocioId?: string | null): Promise<Peca | null> {
    if (negocioId) {
      return this.pecas.get(this.chavePeca(codigo, negocioId)) ?? null;
    }

    return [...this.pecas.values()].find((peca) => peca.codigo === codigo) ?? null;
  }

  async atualizar(codigo: string, dados: AtualizarPeca, negocioId?: string | null): Promise<Peca> {
    const peca = await this.exigirPeca(codigo, negocioId);
    const atualizada: Peca = {
      ...peca,
      ...dados,
      margemEstimadaEmKwanza: this.calcularMargem(
        dados.precoEmKwanza ?? peca.precoEmKwanza,
        dados.custoEmKwanza !== undefined ? dados.custoEmKwanza : peca.custoEmKwanza
      ),
      atualizadoEm: new Date()
    };
    const enriquecida = this.enriquecerPeca(atualizada);

    this.pecas.delete(this.chavePeca(peca.codigo, peca.negocioId));
    this.pecas.set(this.chavePeca(enriquecida.codigo, enriquecida.negocioId), enriquecida);
    return enriquecida;
  }

  async atualizarEstado(codigo: string, estado: EstadoPeca, negocioId?: string | null): Promise<Peca> {
    return this.atualizar(codigo, { estado }, negocioId);
  }

  async registrarMovimentoStock(dados: NovoMovimentoStock): Promise<MovimentoStock> {
    const movimento: MovimentoStock = {
      id: randomUUID(),
      negocioId: dados.negocioId ?? null,
      pecaId: dados.pecaId,
      codigoPeca: dados.codigoPeca,
      tipo: dados.tipo,
      quantidade: dados.quantidade,
      quantidadeAnterior: dados.quantidadeAnterior,
      quantidadeNova: dados.quantidadeNova,
      motivo: dados.motivo ?? null,
      responsavelId: dados.responsavelId ?? null,
      origem: dados.origem ?? null,
      criadoEm: new Date()
    };

    this.movimentosStock.set(movimento.id, movimento);
    return movimento;
  }

  async listarMovimentosStock(codigoPeca: string, negocioId?: string | null): Promise<MovimentoStock[]> {
    return [...this.movimentosStock.values()]
      .filter((movimento) => {
        const mesmoCodigo = movimento.codigoPeca === codigoPeca;
        const mesmoNegocio = negocioId ? movimento.negocioId === negocioId : true;
        return mesmoCodigo && mesmoNegocio;
      })
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  private async exigirPeca(codigo: string, negocioId?: string | null): Promise<Peca> {
    const peca = await this.buscarPorCodigo(codigo, negocioId);

    if (!peca) {
      throw new Error(`Peça #${codigo} não encontrada.`);
    }

    return peca;
  }

  private chavePeca(codigo: string, negocioId: string | null | undefined): string {
    return `${negocioId ?? "global"}:${codigo}`;
  }

  private enriquecerPeca(peca: Peca): Peca {
    const margemEstimadaEmKwanza = this.calcularMargem(peca.precoEmKwanza, peca.custoEmKwanza);
    return {
      ...peca,
      vitrine: peca.vitrine ?? this.vitrinePadrao(),
      margemEstimadaEmKwanza,
      estadoStock: this.calcularEstadoStock(peca)
    };
  }

  private vitrinePadrao(): Peca["vitrine"] {
    return {
      selos: [],
      prioridade: 100,
      titulo: null,
      descricao: null,
      precoPromocionalEmKwanza: null,
      ativaAte: null,
      componentesKit: []
    };
  }

  private calcularMargem(precoEmKwanza: number, custoEmKwanza: number | null): number | null {
    return custoEmKwanza === null ? null : precoEmKwanza - custoEmKwanza;
  }

  private calcularEstadoStock(peca: Pick<Peca, "arquivadaEm" | "estado" | "quantidade" | "stockMinimo">): Peca["estadoStock"] {
    if (peca.arquivadaEm) return "ARQUIVADO";
    if (peca.estado === "ESGOTADA" || peca.quantidade === 0) return "ESGOTADO";
    if (peca.stockMinimo > 0 && peca.quantidade <= peca.stockMinimo) return "BAIXO_STOCK";
    return "DISPONIVEL";
  }
}

export class RepositorioTrackingComercialMemoria implements RepositorioTrackingComercial {
  private readonly eventos = new Map<string, EventoTrackingComercial>();

  async registrarEvento(dados: NovoEventoTrackingComercial): Promise<EventoTrackingComercial> {
    const evento: EventoTrackingComercial = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      tipo: dados.tipo,
      entidadeTipo: dados.entidadeTipo ?? null,
      entidadeId: dados.entidadeId ?? null,
      slugLoja: dados.slugLoja ?? null,
      codigoProduto: dados.codigoProduto ?? null,
      trackingId: dados.trackingId ?? null,
      origem: dados.origem ?? null,
      canal: dados.canal ?? null,
      utm: dados.utm ?? {},
      metadata: dados.metadata ?? {},
      criadoEm: new Date()
    };

    this.eventos.set(evento.id, evento);
    return evento;
  }

  async resumirEventos(negocioId: string): Promise<ResumoTrackingComercial> {
    const eventos = [...this.eventos.values()].filter((evento) => evento.negocioId === negocioId);
    return {
      totalEventos: eventos.length,
      porTipo: this.contarPor(eventos, (evento) => evento.tipo),
      porOrigem: this.contarPor(eventos, (evento) => evento.origem ?? "sem_origem"),
      porCanal: this.contarPor(eventos, (evento) => evento.canal ?? "sem_canal"),
      funil: this.montarFunil(eventos)
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
    return [...this.eventos.values()]
      .filter((evento) => evento.negocioId === negocioId)
      .filter((evento) => !filtros.tipo || evento.tipo === filtros.tipo)
      .filter((evento) => !filtros.origem || evento.origem === filtros.origem)
      .filter((evento) => !filtros.canal || evento.canal === filtros.canal)
      .filter((evento) => !filtros.codigoProduto || evento.codigoProduto === filtros.codigoProduto)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, filtros.limite ?? 1000);
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
}

export class RepositorioTemplatesWhatsAppMemoria implements RepositorioTemplatesWhatsApp {
  private readonly templates = new Map<string, TemplateWhatsAppNegocio>();

  async criar(dados: NovoTemplateWhatsAppNegocio): Promise<TemplateWhatsAppNegocio> {
    const agora = new Date();
    const template: TemplateWhatsAppNegocio = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      nome: dados.nome,
      categoria: dados.categoria,
      idioma: dados.idioma ?? "pt_AO",
      provider: dados.provider ?? "whatsapp_cloud_api",
      estadoAprovacao: dados.estadoAprovacao ?? "rascunho",
      eventosCompativeis: dados.eventosCompativeis ?? [],
      variaveis: dados.variaveis ?? [],
      corpo: dados.corpo,
      ativo: dados.ativo ?? true,
      versao: 1,
      motivoUltimaAlteracao: dados.motivoUltimaAlteracao ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.templates.set(template.id, template);
    return template;
  }

  async listar(negocioId: string): Promise<TemplateWhatsAppNegocio[]> {
    return [...this.templates.values()]
      .filter((template) => template.negocioId === negocioId)
      .sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime());
  }

  async buscarPorId(id: string, negocioId: string): Promise<TemplateWhatsAppNegocio | null> {
    const template = this.templates.get(id);
    return template?.negocioId === negocioId ? template : null;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoTemplateWhatsAppNegocio
  ): Promise<TemplateWhatsAppNegocio | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;
    const atualizado: TemplateWhatsAppNegocio = {
      ...atual,
      ...dados,
      eventosCompativeis: dados.eventosCompativeis ?? atual.eventosCompativeis,
      variaveis: dados.variaveis ?? atual.variaveis,
      versao: dados.corpo && dados.corpo !== atual.corpo ? atual.versao + 1 : atual.versao,
      atualizadoEm: new Date()
    };
    this.templates.set(id, atualizado);
    return atualizado;
  }
}

export class RepositorioCampanhasMemoria implements RepositorioCampanhas {
  private readonly campanhas = new Map<string, CampanhaCrm>();
  private readonly itens = new Map<string, ItemCampanhaCrm>();

  async criar(dados: NovaCampanhaCrm): Promise<CampanhaCrm> {
    const agora = new Date();
    const campanha: CampanhaCrm = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      nome: dados.nome,
      objetivo: dados.objetivo,
      canal: dados.canal,
      templateId: dados.templateId,
      categoria: dados.categoria,
      estado: "RASCUNHO",
      segmento: dados.segmento ?? {},
      limiteDiario: dados.limiteDiario ?? 500,
      janelaInicio: dados.janelaInicio ?? null,
      janelaFim: dados.janelaFim ?? null,
      metricas: metricasCampanhaZeradas(),
      criadaPorUsuarioId: dados.criadaPorUsuarioId ?? null,
      pausadaEm: null,
      motivoPausa: null,
      confirmadaEm: null,
      criadaEm: agora,
      atualizadaEm: agora
    };
    this.campanhas.set(campanha.id, campanha);
    return campanha;
  }

  async listar(negocioId: string, filtros: FiltrosCampanhasCrm = {}): Promise<CampanhaCrm[]> {
    return [...this.campanhas.values()]
      .filter((campanha) => campanha.negocioId === negocioId)
      .filter((campanha) => !filtros.estado || campanha.estado === filtros.estado)
      .filter((campanha) => !filtros.canal || campanha.canal === filtros.canal)
      .sort((a, b) => b.criadaEm.getTime() - a.criadaEm.getTime())
      .slice(0, filtros.limite ?? 100);
  }

  async buscarPorId(id: string, negocioId: string): Promise<CampanhaCrm | null> {
    const campanha = this.campanhas.get(id);
    return campanha?.negocioId === negocioId ? campanha : null;
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoCampanhaCrm): Promise<CampanhaCrm | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;
    const atualizado: CampanhaCrm = {
      ...atual,
      ...dados,
      metricas: dados.metricas ?? atual.metricas,
      atualizadaEm: new Date()
    };
    this.campanhas.set(id, atualizado);
    return atualizado;
  }

  async registrarItens(campanhaId: string, itens: NovoItemCampanhaCrm[]): Promise<ItemCampanhaCrm[]> {
    const agora = new Date();
    const removidos = [...this.itens.values()].filter((item) => item.campanhaId === campanhaId);
    for (const item of removidos) this.itens.delete(item.id);

    const registros = itens.map<ItemCampanhaCrm>((dados) => ({
      id: randomUUID(),
      negocioId: dados.negocioId,
      campanhaId,
      clienteId: dados.clienteId ?? null,
      telefone: dados.telefone ?? null,
      nomeCliente: dados.nomeCliente ?? null,
      status: dados.status,
      motivoBloqueio: dados.motivoBloqueio ?? null,
      outboxMensagemId: dados.outboxMensagemId ?? null,
      contexto: dados.contexto ?? {},
      criadoEm: agora,
      atualizadoEm: agora
    }));
    for (const item of registros) this.itens.set(item.id, item);
    return registros;
  }

  async listarItens(campanhaId: string, negocioId: string): Promise<ItemCampanhaCrm[]> {
    return [...this.itens.values()]
      .filter((item) => item.campanhaId === campanhaId && item.negocioId === negocioId)
      .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());
  }
}

export class RepositorioEventosOperacionaisMemoria implements RepositorioEventosOperacionais {
  private readonly eventos = new Map<string, EventoOperacional>();

  async registrar(dados: NovoEventoOperacional): Promise<{ evento: EventoOperacional; duplicado: boolean }> {
    if (dados.idempotencyKey) {
      const existente = [...this.eventos.values()].find(
        (evento) => evento.negocioId === dados.negocioId && evento.idempotencyKey === dados.idempotencyKey
      );
      if (existente) return { evento: existente, duplicado: true };
    }

    const agora = new Date();
    const evento: EventoOperacional = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      topico: dados.topico,
      tipo: dados.tipo,
      entidadeTipo: dados.entidadeTipo ?? null,
      entidadeId: dados.entidadeId ?? null,
      idempotencyKey: dados.idempotencyKey ?? null,
      payload: dados.payload ?? {},
      estado: dados.estado ?? "PENDENTE",
      tentativas: 0,
      proximaTentativaEm: dados.proximaTentativaEm ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.eventos.set(evento.id, evento);
    return { evento, duplicado: false };
  }

  async listar(negocioId: string, filtros: FiltrosEventosOperacionais = {}): Promise<EventoOperacional[]> {
    return [...this.eventos.values()]
      .filter((evento) => evento.negocioId === negocioId)
      .filter((evento) => !filtros.topico || evento.topico === filtros.topico)
      .filter((evento) => !filtros.tipo || evento.tipo === filtros.tipo)
      .filter((evento) => !filtros.entidadeTipo || evento.entidadeTipo === filtros.entidadeTipo)
      .filter((evento) => !filtros.entidadeId || evento.entidadeId === filtros.entidadeId)
      .filter((evento) => !filtros.estado || evento.estado === filtros.estado)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, filtros.limite ?? 100);
  }
}

export class RepositorioJobsOperacionaisMemoria implements RepositorioJobsOperacionais {
  private readonly jobs = new Map<string, JobOperacional>();

  async criar(dados: NovoJobOperacional): Promise<{ job: JobOperacional; duplicado: boolean }> {
    if (dados.idempotencyKey) {
      const existente = await this.buscarPorIdempotencyKey(dados.negocioId, dados.idempotencyKey);
      if (existente) return { job: existente, duplicado: true };
    }

    const agora = new Date();
    const job: JobOperacional = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      tipo: dados.tipo,
      estado: dados.estado ?? "PENDENTE",
      idempotencyKey: dados.idempotencyKey ?? null,
      total: dados.total ?? 0,
      processados: dados.processados ?? 0,
      erros: dados.erros ?? 0,
      resultado: dados.resultado ?? {},
      erro: dados.erro ?? null,
      criadoEm: agora,
      atualizadoEm: agora,
      concluidoEm: dados.concluidoEm ?? null
    };
    this.jobs.set(job.id, job);
    return { job, duplicado: false };
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoJobOperacional): Promise<JobOperacional | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;
    const atualizado: JobOperacional = { ...atual, ...dados, atualizadoEm: new Date() };
    this.jobs.set(id, atualizado);
    return atualizado;
  }

  async buscarPorId(id: string, negocioId: string): Promise<JobOperacional | null> {
    const job = this.jobs.get(id);
    return job?.negocioId === negocioId ? job : null;
  }

  async buscarPorIdempotencyKey(negocioId: string, idempotencyKey: string): Promise<JobOperacional | null> {
    return [...this.jobs.values()].find((job) => job.negocioId === negocioId && job.idempotencyKey === idempotencyKey) ?? null;
  }
}

export class RepositorioMembrosNegocioMemoria implements RepositorioMembrosNegocio {
  private readonly membros = new Map<string, MembroNegocioOperacional>();

  async listar(negocioId: string): Promise<MembroNegocioOperacional[]> {
    return [...this.membros.values()]
      .filter((membro) => membro.negocioId === negocioId)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async criar(dados: NovoMembroNegocioOperacional): Promise<MembroNegocioOperacional> {
    const existente = [...this.membros.values()].find(
      (membro) => membro.negocioId === dados.negocioId && membro.telefone === dados.telefone
    );
    if (existente) return existente;

    const agora = new Date();
    const membro: MembroNegocioOperacional = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      usuarioId: randomUUID(),
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email ?? null,
      avatarUrl: null,
      papel: dados.papel,
      status: "ATIVO",
      permissoes: dados.permissoes ?? [],
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.membros.set(membro.id, membro);
    return membro;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoMembroNegocioOperacional
  ): Promise<MembroNegocioOperacional | null> {
    const atual = this.membros.get(id);
    if (!atual || atual.negocioId !== negocioId) return null;
    const atualizado: MembroNegocioOperacional = {
      ...atual,
      papel: dados.papel ?? atual.papel,
      status: dados.status ?? atual.status,
      permissoes: dados.permissoes ?? atual.permissoes,
      atualizadoEm: new Date()
    };
    this.membros.set(id, atualizado);
    return atualizado;
  }
}

export class RepositorioAfiliadosMemoria implements RepositorioAfiliados {
  private readonly parceiros = new Map<string, ParceiroComercial>();
  private readonly links = new Map<string, LinkAfiliado>();
  private readonly comissoes = new Map<string, ComissaoParceiro>();
  private readonly historicoComissoes = new Map<string, HistoricoComissaoParceiro>();
  private readonly lotesPagamentoComissoes = new Map<string, LotePagamentoComissao>();
  private readonly itensLotePagamentoComissoes = new Map<string, ItemLotePagamentoComissao>();
  private sequenciaHistorico = 0;

  async criarParceiro(dados: NovoParceiroComercial): Promise<ParceiroComercial> {
    const codigo = this.normalizarCodigo(dados.codigo);
    const duplicado = [...this.parceiros.values()].find(
      (parceiro) => parceiro.negocioId === dados.negocioId && parceiro.codigo === codigo
    );
    if (duplicado) throw new Error(`Parceiro ${codigo} já existe neste negócio.`);

    const agora = new Date();
    const parceiro: ParceiroComercial = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      tipo: dados.tipo,
      codigo,
      nomePublico: dados.nomePublico,
      contacto: dados.contacto ?? null,
      estado: dados.estado ?? "ATIVO",
      regraComissao: { ...dados.regraComissao },
      metodoPagamento: dados.metodoPagamento ?? {},
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.parceiros.set(parceiro.id, parceiro);
    return parceiro;
  }

  async listarParceiros(negocioId: string): Promise<ParceiroComercial[]> {
    return [...this.parceiros.values()]
      .filter((parceiro) => parceiro.negocioId === negocioId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  async buscarParceiroPorId(id: string, negocioId: string): Promise<ParceiroComercial | null> {
    const parceiro = this.parceiros.get(id) ?? null;
    return parceiro?.negocioId === negocioId ? parceiro : null;
  }

  async criarLink(dados: NovoLinkAfiliado): Promise<LinkAfiliado> {
    const codigo = this.normalizarCodigo(dados.codigo);
    if ([...this.links.values()].some((link) => link.codigo === codigo)) {
      throw new Error(`Link ${codigo} já existe.`);
    }

    const agora = new Date();
    const link: LinkAfiliado = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      afiliadoId: dados.afiliadoId,
      codigo,
      destinoTipo: dados.destinoTipo,
      slugLoja: dados.slugLoja ?? null,
      codigoProduto: dados.codigoProduto ? this.normalizarCodigo(dados.codigoProduto) : null,
      canal: dados.canal ?? null,
      origemConteudo: dados.origemConteudo ?? null,
      ativo: dados.ativo ?? true,
      expiraEm: dados.expiraEm ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.links.set(link.id, link);
    return link;
  }

  async listarLinks(negocioId: string): Promise<LinkAfiliado[]> {
    return [...this.links.values()]
      .filter((link) => link.negocioId === negocioId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  async buscarLinkPorCodigo(codigo: string, negocioId?: string): Promise<LinkAfiliado | null> {
    const normalizado = this.normalizarCodigo(codigo);
    return (
      [...this.links.values()].find(
        (link) => link.codigo === normalizado && (!negocioId || link.negocioId === negocioId)
      ) ?? null
    );
  }

  async criarOuAtualizarComissao(dados: NovaComissaoParceiro): Promise<ComissaoParceiro> {
    const existente = [...this.comissoes.values()].find(
      (comissao) => comissao.negocioId === dados.negocioId && comissao.pedidoId === dados.pedidoId
    );
    const agora = new Date();
    const comissao: ComissaoParceiro = existente
      ? {
          ...existente,
          afiliadoId: dados.afiliadoId,
          linkId: dados.linkId ?? null,
          status: dados.status ?? existente.status,
          baseEmKwanza: dados.baseEmKwanza,
          valorEmKwanza: dados.valorEmKwanza,
          moeda: dados.moeda ?? existente.moeda,
          motivo: dados.motivo ?? existente.motivo,
          atualizadoEm: agora
        }
      : {
          id: randomUUID(),
          negocioId: dados.negocioId,
          afiliadoId: dados.afiliadoId,
          linkId: dados.linkId ?? null,
          pedidoId: dados.pedidoId,
          lotePagamentoId: null,
          status: dados.status ?? "ESTIMADA",
          baseEmKwanza: dados.baseEmKwanza,
          valorEmKwanza: dados.valorEmKwanza,
          moeda: dados.moeda ?? "AOA",
          motivo: dados.motivo ?? null,
          criadoEm: agora,
          confirmadoEm: null,
          pagoEm: null,
          referenciaPagamento: null,
          observacaoPagamento: null,
          revertidoEm: null,
          atualizadoEm: agora
        };
    this.comissoes.set(comissao.id, comissao);
    this.registrarHistoricoComissao(comissao, existente ? "ATUALIZADA" : "CRIADA", {
      statusAnterior: existente?.status ?? null,
      motivo: comissao.motivo,
      referencia: dados.referencia ?? null,
      autorId: dados.autorId ?? null,
      autorNome: dados.autorNome ?? null,
      metadata: {
        baseEmKwanza: comissao.baseEmKwanza,
        linkId: comissao.linkId
      }
    });
    return comissao;
  }

  async listarComissoes(negocioId: string): Promise<ComissaoParceiro[]> {
    return [...this.comissoes.values()]
      .filter((comissao) => comissao.negocioId === negocioId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  async confirmarComissaoPorPedido(
    pedidoId: string,
    negocioId: string,
    confirmadoEm = new Date()
  ): Promise<ComissaoParceiro | null> {
    const comissao = [...this.comissoes.values()].find(
      (item) => item.negocioId === negocioId && item.pedidoId === pedidoId
    );
    if (!comissao || comissao.status === "CONFIRMADA") return comissao ?? null;
    if (comissao.status === "REVERTIDA" || comissao.status === "CANCELADA" || comissao.status === "PAGA") {
      return comissao;
    }

    const atualizada: ComissaoParceiro = {
      ...comissao,
      status: "CONFIRMADA",
      confirmadoEm,
      revertidoEm: null,
      atualizadoEm: confirmadoEm
    };
    this.comissoes.set(atualizada.id, atualizada);
    this.registrarHistoricoComissao(atualizada, "CONFIRMADA", {
      statusAnterior: comissao.status,
      criadoEm: confirmadoEm,
      motivo: "Pagamento do pedido confirmado."
    });
    return atualizada;
  }

  async marcarComissaoPaga(
    id: string,
    negocioId: string,
    dados: { referenciaPagamento: string; observacao?: string | null; pagoEm?: Date; autorId?: string | null; autorNome?: string | null }
  ): Promise<ComissaoParceiro | null> {
    const comissao = this.comissoes.get(id) ?? null;
    if (!comissao || comissao.negocioId !== negocioId) return null;
    if (comissao.status !== "CONFIRMADA") {
      throw new Error("Apenas comissão confirmada pode ser marcada como paga.");
    }

    const pagoEm = dados.pagoEm ?? new Date();
    const atualizada: ComissaoParceiro = {
      ...comissao,
      status: "PAGA",
      pagoEm,
      referenciaPagamento: dados.referenciaPagamento,
      observacaoPagamento: dados.observacao ?? null,
      lotePagamentoId: null,
      atualizadoEm: pagoEm
    };
    this.comissoes.set(atualizada.id, atualizada);
    this.registrarHistoricoComissao(atualizada, "PAGA", {
      statusAnterior: comissao.status,
      criadoEm: pagoEm,
      motivo: dados.observacao ?? null,
      referencia: dados.referenciaPagamento,
      autorId: dados.autorId ?? null,
      autorNome: dados.autorNome ?? null
    });
    return atualizada;
  }

  async reverterComissaoPorPedido(
    pedidoId: string,
    negocioId: string,
    motivo: string,
    revertidoEm = new Date()
  ): Promise<ComissaoParceiro | null> {
    const comissao = [...this.comissoes.values()].find(
      (item) => item.negocioId === negocioId && item.pedidoId === pedidoId
    );
    if (!comissao) return null;

    const atualizada: ComissaoParceiro = {
      ...comissao,
      status: "REVERTIDA",
      motivo,
      revertidoEm,
      atualizadoEm: revertidoEm
    };
    this.comissoes.set(atualizada.id, atualizada);
    this.registrarHistoricoComissao(atualizada, "REVERTIDA", {
      statusAnterior: comissao.status,
      criadoEm: revertidoEm,
      motivo
    });
    return atualizada;
  }

  async listarHistoricoComissao(comissaoId: string, negocioId: string): Promise<HistoricoComissaoParceiro[] | null> {
    const comissao = this.comissoes.get(comissaoId) ?? null;
    if (!comissao || comissao.negocioId !== negocioId) return null;

    return [...this.historicoComissoes.values()]
      .filter((evento) => evento.negocioId === negocioId && evento.comissaoId === comissaoId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  async criarLotePagamentoComissoes(dados: NovoLotePagamentoComissao): Promise<LotePagamentoComissao> {
    const comissaoIds = [...new Set(dados.comissaoIds)];
    const comissoes = comissaoIds
      .map((id) => this.comissoes.get(id) ?? null)
      .filter((comissao): comissao is ComissaoParceiro => !!comissao && comissao.negocioId === dados.negocioId);

    if (comissoes.length !== comissaoIds.length) {
      throw new Error("Todas as comissões do lote precisam existir no negócio.");
    }

    const comissaoInvalida = comissoes.find((comissao) => comissao.status !== "CONFIRMADA");
    if (comissaoInvalida) {
      throw new Error("Apenas comissões confirmadas podem entrar num lote de pagamento.");
    }

    const agora = new Date();
    const loteId = randomUUID();
    const itens: ItemLotePagamentoComissao[] = [];
    const valorTotalEmKwanza = comissoes.reduce((total, comissao) => total + comissao.valorEmKwanza, 0);

    for (const comissao of comissoes) {
      const atualizada: ComissaoParceiro = {
        ...comissao,
        status: "PAGA",
        pagoEm: agora,
        referenciaPagamento: dados.referenciaPagamento,
        observacaoPagamento: dados.observacao ?? null,
        lotePagamentoId: loteId,
        atualizadoEm: agora
      };
      this.comissoes.set(atualizada.id, atualizada);

      const item: ItemLotePagamentoComissao = {
        id: randomUUID(),
        negocioId: dados.negocioId,
        loteId,
        comissaoId: atualizada.id,
        afiliadoId: atualizada.afiliadoId,
        pedidoId: atualizada.pedidoId,
        valorEmKwanza: atualizada.valorEmKwanza,
        moeda: atualizada.moeda,
        statusAnterior: comissao.status,
        statusNovo: atualizada.status,
        criadoEm: agora
      };
      this.itensLotePagamentoComissoes.set(item.id, item);
      itens.push(item);

      this.registrarHistoricoComissao(atualizada, "PAGA", {
        statusAnterior: comissao.status,
        criadoEm: agora,
        motivo: dados.observacao ?? null,
        referencia: dados.referenciaPagamento,
        autorId: dados.autorId ?? null,
        autorNome: dados.autorNome ?? null,
        metadata: { lotePagamentoId: loteId }
      });
    }

    const lote: LotePagamentoComissao = {
      id: loteId,
      negocioId: dados.negocioId,
      referenciaPagamento: dados.referenciaPagamento,
      observacao: dados.observacao ?? null,
      status: "PAGO",
      quantidadeComissoes: itens.length,
      valorTotalEmKwanza,
      moeda: comissoes[0]?.moeda ?? "AOA",
      periodoInicio: dados.periodoInicio ?? null,
      periodoFim: dados.periodoFim ?? null,
      autorId: dados.autorId ?? null,
      autorNome: dados.autorNome ?? null,
      criadoEm: agora,
      atualizadoEm: agora,
      itens
    };
    this.lotesPagamentoComissoes.set(lote.id, lote);
    return lote;
  }

  async listarLotesPagamentoComissoes(negocioId: string): Promise<LotePagamentoComissao[]> {
    return [...this.lotesPagamentoComissoes.values()]
      .filter((lote) => lote.negocioId === negocioId)
      .map((lote) => ({
        ...lote,
        itens: [...this.itensLotePagamentoComissoes.values()]
          .filter((item) => item.loteId === lote.id)
          .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      }))
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  async resumir(negocioId: string): Promise<ResumoAfiliadosComerciais> {
    const parceiros = await this.listarParceiros(negocioId);
    const links = await this.listarLinks(negocioId);
    const comissoes = await this.listarComissoes(negocioId);
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
      const parceiro = this.parceiros.get(comissao.afiliadoId);
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

  private somarComissoesPorStatus(comissoes: ComissaoParceiro[], status: ComissaoParceiro["status"]): number {
    return comissoes
      .filter((comissao) => comissao.status === status)
      .reduce((total, comissao) => total + comissao.valorEmKwanza, 0);
  }

  private registrarHistoricoComissao(
    comissao: ComissaoParceiro,
    tipo: TipoHistoricoComissaoParceiro,
    dados: {
      statusAnterior?: ComissaoParceiro["status"] | null;
      motivo?: string | null;
      referencia?: string | null;
      autorId?: string | null;
      autorNome?: string | null;
      metadata?: Record<string, unknown>;
      criadoEm?: Date;
    } = {}
  ): HistoricoComissaoParceiro {
    const base = dados.criadoEm ?? new Date();
    const criadoEm = new Date(base.getTime() + this.sequenciaHistorico++);
    const evento: HistoricoComissaoParceiro = {
      id: randomUUID(),
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
      metadata: dados.metadata ?? {},
      criadoEm
    };
    this.historicoComissoes.set(evento.id, evento);
    return evento;
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }
}

export class RepositorioReservasMemoria implements RepositorioReservas {
  private readonly reservas = new Map<string, Reserva>();
  private readonly bloqueiosPorPeca = new Map<string, Promise<void>>();

  constructor(private readonly repositorioPecas?: RepositorioPecasMemoria) {}

  async criar(dados: NovaReserva): Promise<Reserva> {
    const agora = new Date();
    const reserva: Reserva = {
      id: randomUUID(),
      ...dados,
      negocioId: dados.negocioId ?? null,
      clienteNegocioId: dados.clienteNegocioId ?? null,
      userIdCliente: dados.userIdCliente ?? null,
      avatarUrlCliente: dados.avatarUrlCliente ?? null,
      estadoPagamento: dados.estadoPagamento ?? "AGUARDANDO_COMPROVATIVO",
      enderecoEntrega: dados.enderecoEntrega ?? null,
      comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null,
      criadaEm: agora,
      atualizadaEm: agora
    };

    this.reservas.set(reserva.id, reserva);
    return reserva;
  }

  async criarComControleDeStock(dados: DadosCriacaoReservaComControleStock) {
    return this.comBloqueioPeca(dados.codigoPeca, async () => {
      const repositorioPecas = this.repositorioPecas;
      if (!repositorioPecas) {
        return {
          tipo: "REVISAO_MANUAL" as const,
          reserva: null,
          motivo: "Repositório de peças não configurado para controle de stock."
        };
      }

      const peca = await repositorioPecas.buscarPorCodigo(dados.codigoPeca, dados.negocioId);

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
          peca,
          motivo: `Peça #${peca.codigo} indisponível.`
        };
      }

      const reservasQueBloqueiamStock = await this.contarReservasQueBloqueiamStock(peca.codigo, peca.negocioId);
      const temStockLivre = peca.quantidade - reservasQueBloqueiamStock > 0;
      const reserva = await this.criar({
        codigoPeca: peca.codigo,
        negocioId: dados.negocioId ?? peca.negocioId,
        clienteNegocioId: dados.clienteNegocioId ?? null,
        telefoneCliente: dados.telefoneCliente,
        nomeCliente: dados.nomeCliente,
        usernameCliente: dados.usernameCliente,
        userIdCliente: dados.userIdCliente ?? null,
        avatarUrlCliente: dados.avatarUrlCliente ?? null,
        estado: temStockLivre ? "WAITING_PAYMENT" : "WAITLISTED",
        comentarioOriginal: dados.comentarioOriginal,
        liveId: dados.liveId,
        expiraEm: temStockLivre ? dados.expiraEmReserva : null
      });

      if (temStockLivre && reservasQueBloqueiamStock + 1 >= peca.quantidade) {
        const atualizada = await repositorioPecas.atualizarEstado(peca.codigo, "RESERVADA", peca.negocioId);
        return { tipo: "RESERVA_CRIADA" as const, reserva, peca: atualizada };
      }

      return { tipo: temStockLivre ? "RESERVA_CRIADA" as const : "FILA_ESPERA" as const, reserva, peca };
    });
  }

  async listar(negocioId?: string | null): Promise<Reserva[]> {
    return [...this.reservas.values()]
      .filter((reserva) => !negocioId || reserva.negocioId === negocioId)
      .sort((a, b) => a.criadaEm.getTime() - b.criadaEm.getTime());
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<Reserva | null> {
    const reserva = this.reservas.get(id) ?? null;
    if (!reserva || !negocioId) return reserva;
    return reserva.negocioId === negocioId ? reserva : null;
  }

  async buscarReservaAtivaPorTelefoneEPeca(
    telefone: string,
    codigoPeca: string,
    negocioId?: string | null
  ): Promise<Reserva | null> {
    const reservas = await this.listar();
    return (
      reservas.find(
        (reserva) =>
          reserva.telefoneCliente === telefone &&
          reserva.codigoPeca === codigoPeca &&
          (!negocioId || reserva.negocioId === negocioId) &&
          estadosAtivosParaDuplicidade.includes(reserva.estado)
      ) ?? null
    );
  }

  async contarReservasQueBloqueiamStock(codigoPeca: string, negocioId?: string | null): Promise<number> {
    const reservas = await this.listar();
    return reservas.filter(
      (reserva) =>
        reserva.codigoPeca === codigoPeca &&
        (!negocioId || reserva.negocioId === negocioId) &&
        estadosQueBloqueiamStock.includes(reserva.estado)
    ).length;
  }

  async listarFilaDaPeca(codigoPeca: string, negocioId?: string | null): Promise<Reserva[]> {
    const reservas = await this.listar();
    return reservas.filter(
      (reserva) =>
        reserva.codigoPeca === codigoPeca &&
        (!negocioId || reserva.negocioId === negocioId) &&
        reserva.estado === "WAITLISTED"
    );
  }

  async listarReservasExpiradas(agora: Date): Promise<Reserva[]> {
    const reservas = await this.listar();
    return reservas.filter(
      (reserva) =>
        ["PENDING", "RESERVED", "WAITING_PAYMENT"].includes(reserva.estado) &&
        reserva.expiraEm !== null &&
        reserva.expiraEm.getTime() <= agora.getTime()
    );
  }

  async atualizarEstado(id: string, estado: EstadoReserva, expiraEm: Date | null = null): Promise<Reserva> {
    const reserva = await this.exigirReserva(id);
    const atualizada: Reserva = {
      ...reserva,
      estado,
      expiraEm,
      atualizadaEm: new Date()
    };

    this.reservas.set(id, atualizada);
    return atualizada;
  }

  async atualizarEstadoPagamento(
    id: string,
    estadoPagamento: EstadoPagamento,
    comprovativoPagamentoUrl: string | null = null
  ): Promise<Reserva> {
    const reserva = await this.exigirReserva(id);
    const atualizada: Reserva = {
      ...reserva,
      estadoPagamento,
      comprovativoPagamentoUrl: comprovativoPagamentoUrl ?? reserva.comprovativoPagamentoUrl,
      atualizadaEm: new Date()
    };

    this.reservas.set(id, atualizada);
    return atualizada;
  }

  async atualizarEnderecoEntrega(id: string, enderecoEntrega: string): Promise<Reserva> {
    const reserva = await this.exigirReserva(id);
    const atualizada: Reserva = {
      ...reserva,
      enderecoEntrega,
      atualizadaEm: new Date()
    };

    this.reservas.set(id, atualizada);
    return atualizada;
  }

  private async exigirReserva(id: string): Promise<Reserva> {
    const reserva = await this.buscarPorId(id);

    if (!reserva) {
      throw new Error(`Reserva ${id} não encontrada.`);
    }

    return reserva;
  }

  private async comBloqueioPeca<T>(codigoPeca: string, operacao: () => Promise<T>): Promise<T> {
    const bloqueioAnterior = this.bloqueiosPorPeca.get(codigoPeca) ?? Promise.resolve();
    let liberarBloqueio!: () => void;
    const bloqueioAtual = new Promise<void>((resolve) => {
      liberarBloqueio = resolve;
    });
    const cadeiaAtual = bloqueioAnterior.then(() => bloqueioAtual);

    this.bloqueiosPorPeca.set(codigoPeca, cadeiaAtual);

    await bloqueioAnterior;

    try {
      return await operacao();
    } finally {
      liberarBloqueio();
      if (this.bloqueiosPorPeca.get(codigoPeca) === cadeiaAtual) {
        this.bloqueiosPorPeca.delete(codigoPeca);
      }
    }
  }
}

export class RepositorioComentariosMemoria implements RepositorioComentarios {
  private readonly comentarios = new Map<string, RegistroComentario>();

  async criar(dados: NovoRegistroComentario): Promise<RegistroComentario> {
    const agora = new Date();
    const registro: RegistroComentario = {
      id: randomUUID(),
      negocioId: dados.negocioId ?? null,
      comentario: dados.comentario,
      interpretacao: dados.interpretacao,
      estado: dados.estado,
      motivo: dados.motivo ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.comentarios.set(registro.id, registro);
    return registro;
  }

  async listar(limite = 100, negocioId?: string | null): Promise<RegistroComentario[]> {
    return [...this.comentarios.values()]
      .filter((comentario) => !negocioId || comentario.negocioId === negocioId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<RegistroComentario | null> {
    const comentario = this.comentarios.get(id) ?? null;
    if (!comentario || !negocioId) return comentario;
    return comentario.negocioId === negocioId ? comentario : null;
  }

  async atualizarEstado(
    id: string,
    estado: EstadoComentario,
    motivo: string | null = null,
    interpretacao?: ResultadoInterpretacaoComentario | null
  ): Promise<RegistroComentario> {
    const registro = this.comentarios.get(id);

    if (!registro) {
      throw new Error(`Comentário ${id} não encontrado.`);
    }

    const atualizado: RegistroComentario = {
      ...registro,
      estado,
      motivo,
      interpretacao: interpretacao ?? registro.interpretacao,
      atualizadoEm: new Date()
    };

    this.comentarios.set(id, atualizado);
    return atualizado;
  }

  async limparTodos(): Promise<number> {
    const total = this.comentarios.size;
    this.comentarios.clear();
    return total;
  }
}

export class RepositorioAutenticacaoMemoria implements RepositorioAutenticacao {
  private readonly usuarios = new Map<string, UsuarioSistema>();
  private readonly usuariosPorTelefone = new Map<string, string>();
  private readonly identidades = new Map<string, { usuarioId: string; dados: DadosIdentidadeAutenticacao }>();
  private readonly perfisEstudantis = new Map<string, PerfilEstudantilUsuario>();
  private readonly negocios = new Map<string, NegocioBizy>();
  private readonly negocioPrincipalPorUsuario = new Map<string, string>();
  private readonly modulosPorNegocio = new Map<string, Map<string, ModuloNegocioConfigurado>>();
  private readonly codigos = new Map<string, CodigoLoginSms>();
  private readonly sessoes = new Map<string, {
    id: string;
    tokenHash: string;
    usuarioId: string;
    expiraEm: Date;
    criadaEm: Date;
    ultimoUsoEm: Date | null;
  }>();

  async criarOuAtualizarUsuario(dados: {
    telefone: string;
    nome: string;
    email?: string | null;
    avatarUrl?: string | null;
    origemCadastro?: string;
  }) {
    const idExistente = this.usuariosPorTelefone.get(dados.telefone);
    const existente = idExistente ? this.usuarios.get(idExistente) : null;
    const agora = new Date();
    const usuario = existente
      ? {
          ...existente,
          nome: dados.nome,
          email: dados.email ?? existente.email,
          avatarUrl: dados.avatarUrl ?? existente.avatarUrl,
          origemCadastro: dados.origemCadastro ?? existente.origemCadastro,
          atualizadoEm: agora
        }
      : {
          id: randomUUID(),
          nome: dados.nome,
          telefone: dados.telefone,
          email: dados.email ?? null,
          avatarUrl: dados.avatarUrl ?? null,
          papel: "VENDEDOR",
          origemCadastro: dados.origemCadastro ?? "TELEFONE",
          perfilCompletoEm: null,
          criadoEm: agora,
          atualizadoEm: agora
        };

    this.usuarios.set(usuario.id, usuario);
    if (usuario.telefone) this.usuariosPorTelefone.set(usuario.telefone, usuario.id);
    return usuario;
  }

  async buscarUsuarioPorTelefone(telefone: string) {
    const id = this.usuariosPorTelefone.get(telefone);
    return id ? this.usuarios.get(id) ?? null : null;
  }

  async buscarUsuarioPorId(id: string) {
    return this.usuarios.get(id) ?? null;
  }

  async criarOuAtualizarUsuarioPorIdentidade(dados: DadosIdentidadeAutenticacao): Promise<UsuarioSistema> {
    const chave = this.chaveIdentidade(dados.tipo, dados.provider, dados.providerUserId);
    const identidade = this.identidades.get(chave);
    const agora = new Date();

    if (identidade) {
      const atual = this.exigirUsuario(identidade.usuarioId);
      const usuario = {
        ...atual,
        nome: dados.nome || atual.nome,
        telefone: dados.telefone ?? atual.telefone,
        email: dados.email ?? atual.email,
        avatarUrl: dados.avatarUrl ?? atual.avatarUrl,
        origemCadastro: dados.origemCadastro,
        atualizadoEm: agora
      };
      this.usuarios.set(usuario.id, usuario);
      if (usuario.telefone) this.usuariosPorTelefone.set(usuario.telefone, usuario.id);
      this.identidades.set(chave, { usuarioId: usuario.id, dados });
      return usuario;
    }

    const usuarioPorTelefone = dados.telefone ? await this.buscarUsuarioPorTelefone(dados.telefone) : null;
    const usuarioPorEmail = dados.email
      ? [...this.usuarios.values()].find((usuario) => usuario.email?.toLowerCase() === dados.email?.toLowerCase()) ?? null
      : null;
    const usuarioBase = usuarioPorTelefone ?? usuarioPorEmail;
    const usuario: UsuarioSistema = usuarioBase
      ? {
          ...usuarioBase,
          nome: dados.nome || usuarioBase.nome,
          telefone: dados.telefone ?? usuarioBase.telefone,
          email: dados.email ?? usuarioBase.email,
          avatarUrl: dados.avatarUrl ?? usuarioBase.avatarUrl,
          origemCadastro: dados.origemCadastro,
          atualizadoEm: agora
        }
      : {
          id: randomUUID(),
          nome: dados.nome,
          telefone: dados.telefone ?? null,
          email: dados.email ?? null,
          avatarUrl: dados.avatarUrl ?? null,
          papel: "VENDEDOR",
          origemCadastro: dados.origemCadastro,
          perfilCompletoEm: null,
          criadoEm: agora,
          atualizadoEm: agora
        };

    this.usuarios.set(usuario.id, usuario);
    if (usuario.telefone) this.usuariosPorTelefone.set(usuario.telefone, usuario.id);
    this.identidades.set(chave, { usuarioId: usuario.id, dados });
    return usuario;
  }

  async salvarPerfilEstudantil(dados: DadosPerfilEstudantil): Promise<PerfilEstudantilUsuario> {
    const agora = new Date();
    const chave = `${dados.institutionCode}:${dados.studentNumber}`;
    const existente = this.perfisEstudantis.get(chave);
    const perfil: PerfilEstudantilUsuario = {
      id: existente?.id ?? randomUUID(),
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
      dados: dados.dados ?? {},
      sincronizadoEm: agora,
      criadoEm: existente?.criadoEm ?? agora,
      atualizadoEm: agora
    };

    this.perfisEstudantis.set(chave, perfil);
    return perfil;
  }

  async buscarNegocioPrincipalPorUsuario(usuarioId: string): Promise<NegocioBizy | null> {
    const negocioId = this.negocioPrincipalPorUsuario.get(usuarioId);
    return negocioId ? this.negocios.get(negocioId) ?? null : null;
  }

  async salvarNegocioUsuario(usuarioId: string, dados: DadosNegocioBizy): Promise<NegocioBizy> {
    this.exigirUsuario(usuarioId);
    const existente = await this.buscarNegocioPrincipalPorUsuario(usuarioId);
    const agora = new Date();
    const negocio: NegocioBizy = {
      id: existente?.id ?? randomUUID(),
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
      canaisVenda: dados.canaisVenda ?? [],
      metodosPagamento: dados.metodosPagamento ?? [],
      entrega: dados.entrega ?? {},
      minutosReservaPadrao: dados.minutosReservaPadrao ?? 10,
      slugPublico: existente?.slugPublico ?? dados.slugPublico ?? null,
      descricaoPublica: dados.descricaoPublica ?? existente?.descricaoPublica ?? null,
      lojaPublicadaEm: dados.lojaPublicadaEm ?? existente?.lojaPublicadaEm ?? null,
      usuarioPapel: "DONO",
      criadoEm: existente?.criadoEm ?? agora,
      atualizadoEm: agora
    };

    this.negocios.set(negocio.id, negocio);
    this.negocioPrincipalPorUsuario.set(usuarioId, negocio.id);
    return negocio;
  }

  async atualizarPublicacaoLoja(negocioId: string, dados: DadosPublicacaoLoja): Promise<NegocioBizy> {
    const atual = this.negocios.get(negocioId);
    if (!atual) throw new Error("Negócio não encontrado.");

    const slug = dados.slug.trim().toLowerCase();
    const donoSlug = [...this.negocios.values()].find((negocio) => negocio.slugPublico === slug && negocio.id !== negocioId);
    if (donoSlug) {
      throw new Error(`Slug público ${slug} já existe.`);
    }

    const atualizado: NegocioBizy = {
      ...atual,
      slugPublico: slug,
      descricaoPublica: dados.descricaoPublica ?? atual.descricaoPublica,
      lojaPublicadaEm: dados.publicada ? atual.lojaPublicadaEm ?? new Date() : null,
      atualizadoEm: new Date()
    };

    this.negocios.set(negocioId, atualizado);
    return atualizado;
  }

  async buscarNegocioPorSlugPublico(slug: string): Promise<NegocioBizy | null> {
    return [...this.negocios.values()].find((negocio) => negocio.slugPublico === slug.trim().toLowerCase()) ?? null;
  }

  async listarModulosAtivosPorNegocio(negocioId: string): Promise<string[]> {
    const configurados = await this.listarModulosPorNegocio(negocioId);
    if (configurados.length === 0) return [];

    const ativos = new Set<string>(modulosNegocioPadrao);
    for (const modulo of configurados) {
      if (modulo.ativo) {
        ativos.add(modulo.modulo);
      } else {
        ativos.delete(modulo.modulo);
      }
    }

    return [...ativos];
  }

  async listarModulosPorNegocio(negocioId: string): Promise<ModuloNegocioConfigurado[]> {
    return [...(this.modulosPorNegocio.get(negocioId)?.values() ?? [])].sort((a, b) =>
      a.modulo.localeCompare(b.modulo)
    );
  }

  async salvarModuloNegocio(
    negocioId: string,
    modulo: ModuloNegocioCodigo,
    dados: AtualizacaoModuloNegocio
  ): Promise<ModuloNegocioConfigurado> {
    if (!this.negocios.has(negocioId)) throw new Error("Negócio não encontrado.");

    const agora = new Date();
    const modulos = this.modulosPorNegocio.get(negocioId) ?? new Map<string, ModuloNegocioConfigurado>();
    const existente = modulos.get(modulo);
    const atualizado: ModuloNegocioConfigurado = {
      id: existente?.id ?? randomUUID(),
      negocioId,
      modulo,
      ativo: dados.ativo,
      configuracao: dados.configuracao ?? existente?.configuracao ?? {},
      criadoEm: existente?.criadoEm ?? agora,
      atualizadoEm: agora
    };

    modulos.set(modulo, atualizado);
    this.modulosPorNegocio.set(negocioId, modulos);
    return atualizado;
  }

  async marcarUsuarioOnboardingCompleto(usuarioId: string, data: Date): Promise<UsuarioSistema> {
    const usuario = this.exigirUsuario(usuarioId);
    const atualizado = { ...usuario, perfilCompletoEm: data, atualizadoEm: data };
    this.usuarios.set(usuarioId, atualizado);
    return atualizado;
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
    const agora = new Date();
    const codigo: CodigoLoginSms = {
      id: randomUUID(),
      telefone: dados.telefone,
      codigoHash: dados.codigoHash,
      codigoFinal: dados.codigoFinal,
      expiraEm: dados.expiraEm,
      usadoEm: null,
      tentativas: 0,
      statusEnvio: dados.statusEnvio,
      provider: dados.provider,
      providerMessageId: dados.providerMessageId ?? null,
      providerResponseJson: dados.providerResponseJson ?? null,
      usuarioId: dados.usuarioId ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.codigos.set(codigo.id, codigo);
    return codigo;
  }

  async buscarCodigoSmsValido(telefone: string, agora: Date): Promise<CodigoLoginSms | null> {
    return (
      [...this.codigos.values()]
        .filter((codigo) => codigo.telefone === telefone && !codigo.usadoEm && codigo.expiraEm > agora)
        .filter((codigo) => ["SENT", "DEV"].includes(codigo.statusEnvio))
        .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())[0] ?? null
    );
  }

  async marcarCodigoUsado(id: string, usadoEm: Date): Promise<CodigoLoginSms> {
    const codigo = this.exigirCodigo(id);
    const atualizado = { ...codigo, usadoEm, atualizadoEm: usadoEm };
    this.codigos.set(id, atualizado);
    return atualizado;
  }

  async incrementarTentativasCodigo(id: string): Promise<CodigoLoginSms> {
    const codigo = this.exigirCodigo(id);
    const atualizado = { ...codigo, tentativas: codigo.tentativas + 1, atualizadoEm: new Date() };
    this.codigos.set(id, atualizado);
    return atualizado;
  }

  async revogarCodigosAbertos(telefone: string, agora: Date): Promise<void> {
    for (const codigo of this.codigos.values()) {
      if (codigo.telefone === telefone && !codigo.usadoEm && codigo.expiraEm > agora) {
        this.codigos.set(codigo.id, { ...codigo, usadoEm: agora, statusEnvio: "REVOKED", atualizadoEm: agora });
      }
    }
  }

  async criarSessao(dados: { tokenHash: string; usuarioId: string; expiraEm: Date }): Promise<void> {
    const sessao = {
      id: randomUUID(),
      tokenHash: dados.tokenHash,
      usuarioId: dados.usuarioId,
      expiraEm: dados.expiraEm,
      criadaEm: new Date(),
      ultimoUsoEm: null
    };
    this.sessoes.set(sessao.tokenHash, sessao);
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    const sessao = this.sessoes.get(tokenHash);
    if (!sessao || sessao.expiraEm <= agora) return null;
    const usuario = this.usuarios.get(sessao.usuarioId);
    return usuario ? { id: sessao.id, usuario } : null;
  }

  async tocarSessao(id: string, agora: Date): Promise<void> {
    for (const [tokenHash, sessao] of this.sessoes.entries()) {
      if (sessao.id === id) {
        this.sessoes.set(tokenHash, { ...sessao, ultimoUsoEm: agora });
        return;
      }
    }
  }

  async encerrarSessao(tokenHash: string): Promise<void> {
    this.sessoes.delete(tokenHash);
  }

  async limparCodigosSms(): Promise<number> {
    const total = this.codigos.size;
    this.codigos.clear();
    return total;
  }

  private exigirCodigo(id: string) {
    const codigo = this.codigos.get(id);
    if (!codigo) throw new Error(`Código ${id} não encontrado.`);
    return codigo;
  }

  private exigirUsuario(id: string): UsuarioSistema {
    const usuario = this.usuarios.get(id);
    if (!usuario) throw new Error(`Usuário ${id} não encontrado.`);
    return usuario;
  }

  private chaveIdentidade(tipo: string, provider: string, providerUserId: string) {
    return `${tipo}:${provider}:${providerUserId}`;
  }
}

export class RepositorioInstanciasWhatsAppMemoria implements RepositorioInstanciasWhatsApp {
  private readonly instancias = new Map<string, InstanciaWhatsApp>();

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

    if (
      [...this.instancias.values()].some(
        (instancia) => instancia.negocioId === negocioId && instancia.nome === dados.nome && instancia.ativa
      )
    ) {
      throw new Error(`Instância ${dados.nome} já existe.`);
    }

    if (dados.padrao) {
      for (const instancia of this.instancias.values()) {
        if (instancia.negocioId === negocioId) {
          this.instancias.set(instancia.id, { ...instancia, padrao: false, atualizadaEm: new Date() });
        }
      }
    }

    const agora = new Date();
    const instancia: InstanciaWhatsApp = {
      id: randomUUID(),
      negocioId,
      nome: dados.nome,
      etiqueta: dados.etiqueta ?? null,
      telefone: dados.telefone ?? null,
      status: "CRIADA",
      qrCode: null,
      pairingCode: null,
      baseUrl: dados.baseUrl ?? null,
      apiKey: dados.apiKey ?? null,
      padrao: dados.padrao ?? false,
      ativa: true,
      ultimoErro: null,
      ultimaConexaoEm: null,
      ultimaConsultaEm: null,
      criadaEm: agora,
      atualizadaEm: agora
    };

    this.instancias.set(instancia.id, instancia);
    return instancia;
  }

  async listarAtivas(negocioId?: string | null): Promise<InstanciaWhatsApp[]> {
    return [...this.instancias.values()]
      .filter((instancia) => instancia.ativa && this.pertenceAoNegocio(instancia, negocioId))
      .sort((a, b) => Number(b.padrao) - Number(a.padrao) || b.atualizadaEm.getTime() - a.atualizadaEm.getTime());
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp | null> {
    const instancia = this.instancias.get(id) ?? null;
    return instancia && this.pertenceAoNegocio(instancia, negocioId) ? instancia : null;
  }

  async buscarPadrao(negocioId?: string | null): Promise<InstanciaWhatsApp | null> {
    return (await this.listarAtivas(negocioId)).find((instancia) => instancia.padrao) ?? null;
  }

  async atualizar(id: string, dados: Partial<Pick<
    InstanciaWhatsApp,
    "etiqueta" | "telefone" | "status" | "qrCode" | "pairingCode" | "baseUrl" | "apiKey" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaConsultaEm"
  >>, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    const instancia = await this.exigirInstancia(id, negocioId);

    if (dados.padrao) {
      for (const item of this.instancias.values()) {
        if (item.id !== id && item.negocioId === instancia.negocioId) {
          this.instancias.set(item.id, { ...item, padrao: false, atualizadaEm: new Date() });
        }
      }
    }

    const atualizada = { ...instancia, ...dados, atualizadaEm: new Date() };
    this.instancias.set(id, atualizada);
    return atualizada;
  }

  async definirPadrao(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    return this.atualizar(id, { padrao: true, ativa: true }, negocioId);
  }

  async desativar(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    return this.atualizar(id, { ativa: false, padrao: false }, negocioId);
  }

  private async exigirInstancia(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    const instancia = await this.buscarPorId(id, negocioId);
    if (!instancia) throw new Error(`Instância ${id} não encontrada.`);
    return instancia;
  }

  private pertenceAoNegocio(instancia: InstanciaWhatsApp, negocioId?: string | null) {
    return negocioId === undefined ? true : instancia.negocioId === (negocioId ?? null);
  }
}

export class RepositorioSessoesLiveMemoria implements RepositorioSessoesLive {
  private readonly sessoes = new Map<string, RegistroSessaoLive>();

  async salvar(dados: NovoRegistroSessaoLive): Promise<RegistroSessaoLive> {
    const agora = new Date();
    const existente = this.sessoes.get(dados.id);
    const sessao: RegistroSessaoLive = {
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
      ultimoErro: dados.ultimoErro ?? null,
      criadaEm: existente?.criadaEm ?? agora,
      atualizadaEm: agora
    };

    this.sessoes.set(dados.id, sessao);
    return sessao;
  }

  async listarAtivas(): Promise<RegistroSessaoLive[]> {
    return [...this.sessoes.values()]
      .filter((sessao) => sessao.ativa)
      .sort((a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime());
  }

  async buscarPorId(id: string): Promise<RegistroSessaoLive | null> {
    return this.sessoes.get(id) ?? null;
  }

  async atualizar(id: string, dados: AtualizacaoRegistroSessaoLive): Promise<RegistroSessaoLive> {
    const existente = await this.buscarPorId(id);
    if (!existente) throw new Error(`Sessão de live ${id} não encontrada.`);

    const atualizada: RegistroSessaoLive = {
      ...existente,
      ...dados,
      atualizadaEm: new Date()
    };

    this.sessoes.set(id, atualizada);
    return atualizada;
  }

  async encerrar(id: string, encerradaEm = new Date()): Promise<RegistroSessaoLive> {
    return this.atualizar(id, { ativa: false, status: "ENCERRADA", encerradaEm });
  }
}

interface ClienteGlobalMemoria {
  id: string;
  telefoneCanonico: string | null;
  emailCanonico: string | null;
  nomePreferido: string | null;
  avatarUrl: string | null;
  origemPrimeira: string | null;
  dados: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class RepositorioClientesMemoria implements RepositorioClientes {
  private readonly clientesGlobais = new Map<string, ClienteGlobalMemoria>();
  private readonly clientesNegocio = new Map<string, Cliente360>();

  async salvar(dados: DadosCliente360): Promise<Cliente360> {
    const contato = this.normalizarContatoObrigatorio(dados.telefone, dados.email);
    const agora = new Date();
    const global = this.obterOuCriarClienteGlobal(dados, contato, agora);
    const existente = this.buscarExistentePorContato(dados.negocioId, global.id, contato.telefoneLocal);
    const cliente: Cliente360 = existente
      ? {
          ...existente,
          telefone: contato.telefoneLocal ?? existente.telefone,
          email: contato.email ?? existente.email,
          nome: dados.nome ?? existente.nome,
          username: dados.username ?? existente.username,
          userId: dados.userId ?? existente.userId,
          avatarUrl: dados.avatarUrl ?? existente.avatarUrl,
          origem: existente.origem ?? dados.origem ?? null,
          tags: dados.tags ? this.unirTags(existente.tags, dados.tags) : existente.tags,
          preferencias: dados.preferencias ? { ...existente.preferencias, ...dados.preferencias } : existente.preferencias,
          consentimentoMarketing: dados.consentimentoMarketing ?? existente.consentimentoMarketing,
          consentimentoDados: dados.consentimentoDados ?? existente.consentimentoDados,
          estadoRelacionamento: dados.estadoRelacionamento ?? existente.estadoRelacionamento,
          ultimaInteracaoEm: dados.ultimaInteracaoEm ?? existente.ultimaInteracaoEm,
          atualizadoEm: agora
        }
      : {
          id: randomUUID(),
          negocioId: dados.negocioId,
          clienteGlobalId: global.id,
          telefone: contato.telefoneLocal,
          email: contato.email,
          nome: dados.nome ?? null,
          username: dados.username ?? null,
          userId: dados.userId ?? null,
          avatarUrl: dados.avatarUrl ?? null,
          origem: dados.origem ?? null,
          tags: this.normalizarTags(dados.tags ?? []),
          preferencias: dados.preferencias ?? {},
          consentimentoMarketing: dados.consentimentoMarketing ?? false,
          consentimentoDados: dados.consentimentoDados ?? false,
          estadoRelacionamento: dados.estadoRelacionamento ?? "ATIVO",
          primeiraInteracaoEm: dados.ultimaInteracaoEm ?? agora,
          ultimaInteracaoEm: dados.ultimaInteracaoEm ?? agora,
          criadoEm: agora,
          atualizadoEm: agora
        };

    this.clientesNegocio.set(cliente.id, cliente);
    return cliente;
  }

  async sincronizar(dados: DadosCliente360): Promise<Cliente360 | null> {
    if (!normalizarTelefone(dados.telefone) && !normalizarEmail(dados.email)) return null;
    return this.salvar(dados);
  }

  async listar(negocioId: string, filtros: FiltrosClientes360 = {}): Promise<Cliente360[]> {
    const busca = (filtros.busca ?? "").trim().toLowerCase();
    const tag = filtros.tag?.trim().toLowerCase();
    const limite = filtros.limite ?? 100;

    return [...this.clientesNegocio.values()]
      .filter((cliente) => cliente.negocioId === negocioId)
      .filter((cliente) => !filtros.estadoRelacionamento || cliente.estadoRelacionamento === filtros.estadoRelacionamento)
      .filter(
        (cliente) =>
          filtros.consentimentoMarketing === undefined ||
          cliente.consentimentoMarketing === filtros.consentimentoMarketing
      )
      .filter((cliente) => !tag || cliente.tags.some((item) => item.toLowerCase() === tag))
      .filter((cliente) => {
        if (!busca) return true;
        return [
          cliente.telefone,
          cliente.email,
          cliente.nome,
          cliente.username,
          cliente.userId,
          ...cliente.tags
        ].some((valor) => valor?.toLowerCase().includes(busca));
      })
      .sort((a, b) => b.ultimaInteracaoEm.getTime() - a.ultimaInteracaoEm.getTime())
      .slice(0, limite);
  }

  async buscarPorId(id: string, negocioId: string): Promise<Cliente360 | null> {
    const cliente = this.clientesNegocio.get(id) ?? null;
    return cliente?.negocioId === negocioId ? cliente : null;
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360 | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const telefone = dados.telefone === undefined ? existente.telefone : normalizarTelefone(dados.telefone)?.local ?? null;
    const email = dados.email === undefined ? existente.email : normalizarEmail(dados.email);
    if (!telefone && !email) {
      throw new Error("Cliente precisa manter telefone ou email.");
    }

    const atualizado: Cliente360 = {
      ...existente,
      telefone,
      email,
      nome: dados.nome === undefined ? existente.nome : dados.nome,
      username: dados.username === undefined ? existente.username : dados.username,
      userId: dados.userId === undefined ? existente.userId : dados.userId,
      avatarUrl: dados.avatarUrl === undefined ? existente.avatarUrl : dados.avatarUrl,
      origem: dados.origem === undefined ? existente.origem : dados.origem,
      tags: dados.tags === undefined ? existente.tags : this.normalizarTags(dados.tags),
      preferencias: dados.preferencias === undefined ? existente.preferencias : dados.preferencias,
      consentimentoMarketing: dados.consentimentoMarketing ?? existente.consentimentoMarketing,
      consentimentoDados: dados.consentimentoDados ?? existente.consentimentoDados,
      estadoRelacionamento: dados.estadoRelacionamento ?? existente.estadoRelacionamento,
      atualizadoEm: new Date()
    };

    this.clientesNegocio.set(id, atualizado);
    return atualizado;
  }

  async anonimizar(
    id: string,
    negocioId: string,
    dados: { motivo: string; anonimizadoEm?: Date }
  ): Promise<Cliente360 | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const anonimizadoEm = dados.anonimizadoEm ?? new Date();
    const atualizado: Cliente360 = {
      ...existente,
      telefone: null,
      email: null,
      nome: null,
      username: null,
      userId: null,
      avatarUrl: null,
      tags: this.normalizarTags([...existente.tags, "anonimizado"]),
      preferencias: {
        ...existente.preferencias,
        anonimizado: true,
        anonimizadoEm: anonimizadoEm.toISOString(),
        motivoAnonimizacao: dados.motivo
      },
      consentimentoMarketing: false,
      consentimentoDados: false,
      estadoRelacionamento: "BLOQUEADO",
      atualizadoEm: anonimizadoEm
    };
    this.clientesNegocio.set(id, atualizado);
    return atualizado;
  }

  private obterOuCriarClienteGlobal(
    dados: DadosCliente360,
    contato: { telefoneCanonico: string | null; telefoneLocal: string | null; email: string | null },
    agora: Date
  ): ClienteGlobalMemoria {
    const existente = [...this.clientesGlobais.values()].find(
      (cliente) =>
        Boolean(contato.telefoneCanonico && cliente.telefoneCanonico === contato.telefoneCanonico) ||
        Boolean(contato.email && cliente.emailCanonico === contato.email)
    );

    if (existente) {
      const atualizado = {
        ...existente,
        nomePreferido: dados.nome ?? existente.nomePreferido,
        avatarUrl: dados.avatarUrl ?? existente.avatarUrl,
        atualizadoEm: agora
      };
      this.clientesGlobais.set(atualizado.id, atualizado);
      return atualizado;
    }

    const novo: ClienteGlobalMemoria = {
      id: randomUUID(),
      telefoneCanonico: contato.telefoneCanonico,
      emailCanonico: contato.email,
      nomePreferido: dados.nome ?? null,
      avatarUrl: dados.avatarUrl ?? null,
      origemPrimeira: dados.origem ?? null,
      dados: {},
      criadoEm: agora,
      atualizadoEm: agora
    };
    this.clientesGlobais.set(novo.id, novo);
    return novo;
  }

  private buscarExistentePorContato(
    negocioId: string,
    clienteGlobalId: string,
    telefone: string | null
  ): Cliente360 | null {
    return (
      [...this.clientesNegocio.values()].find(
        (cliente) =>
          cliente.negocioId === negocioId &&
          (cliente.clienteGlobalId === clienteGlobalId || Boolean(telefone && cliente.telefone === telefone))
      ) ?? null
    );
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
}

export class RepositorioCompartilhamentoClientesMemoria implements RepositorioCompartilhamentoClientes {
  private readonly relacoes = new Map<string, RelacaoNegocioCompartilhamento>();
  private readonly compartilhamentos = new Map<string, CompartilhamentoClienteSeguro>();
  private readonly auditorias = new Map<string, AuditoriaCompartilhamentoCliente[]>();
  private readonly snapshotsClientes = new Map<string, Cliente360>();

  async criarRelacao(dados: NovaRelacaoNegocio): Promise<RelacaoNegocioCompartilhamento> {
    const existente = [...this.relacoes.values()].find(
      (relacao) =>
        relacao.negocioOrigemId === dados.negocioOrigemId &&
        relacao.negocioDestinoId === dados.negocioDestinoId &&
        relacao.tipo === dados.tipo
    );
    if (existente) return existente;

    const agora = new Date();
    const relacao: RelacaoNegocioCompartilhamento = {
      id: randomUUID(),
      negocioOrigemId: dados.negocioOrigemId,
      negocioDestinoId: dados.negocioDestinoId,
      tipo: dados.tipo,
      estado: "PENDENTE",
      escopo: dados.escopo ?? {},
      criadoPorUsuarioId: dados.criadoPorUsuarioId ?? null,
      aprovadoEm: null,
      expiraEm: dados.expiraEm ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.relacoes.set(relacao.id, relacao);
    return relacao;
  }

  async buscarRelacaoPorId(id: string): Promise<RelacaoNegocioCompartilhamento | null> {
    return this.relacoes.get(id) ?? null;
  }

  async atualizarRelacao(
    id: string,
    dados: AtualizacaoRelacaoNegocio
  ): Promise<RelacaoNegocioCompartilhamento | null> {
    const atual = this.relacoes.get(id);
    if (!atual) return null;

    const atualizada: RelacaoNegocioCompartilhamento = {
      ...atual,
      estado: dados.estado,
      aprovadoEm: dados.estado === "APROVADA" ? new Date() : atual.aprovadoEm,
      atualizadoEm: new Date()
    };
    this.relacoes.set(id, atualizada);
    return atualizada;
  }

  async criarCompartilhamento(dados: NovoCompartilhamentoCliente): Promise<{
    compartilhamento: CompartilhamentoClienteSeguro;
    auditoria: AuditoriaCompartilhamentoCliente[];
  }> {
    const agora = new Date();
    const compartilhamento: CompartilhamentoClienteSeguro = {
      id: randomUUID(),
      relacaoId: dados.relacaoId ?? null,
      clienteGlobalId: dados.cliente.clienteGlobalId,
      clienteNegocioOrigemId: dados.cliente.id,
      negocioOrigemId: dados.negocioOrigemId,
      negocioDestinoId: dados.negocioDestinoId,
      escopo: dados.escopo ?? {},
      motivo: dados.motivo,
      baseLegal: dados.baseLegal,
      consentimentoCliente: dados.consentimentoCliente,
      status: "ATIVO",
      aprovadoPorUsuarioId: dados.atorUsuarioId ?? null,
      expiraEm: dados.expiraEm ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };
    const auditoria: AuditoriaCompartilhamentoCliente = {
      id: randomUUID(),
      compartilhamentoId: compartilhamento.id,
      atorUsuarioId: dados.atorUsuarioId ?? null,
      acao: "CRIADO",
      dados: {
        status: compartilhamento.status,
        escopo: compartilhamento.escopo,
        motivo: compartilhamento.motivo,
        baseLegal: compartilhamento.baseLegal
      },
      criadoEm: agora
    };

    this.compartilhamentos.set(compartilhamento.id, compartilhamento);
    this.auditorias.set(compartilhamento.id, [auditoria]);
    this.snapshotsClientes.set(compartilhamento.id, dados.cliente);
    return { compartilhamento, auditoria: [auditoria] };
  }

  async buscarCompartilhamentoPorId(id: string): Promise<CompartilhamentoClienteSeguro | null> {
    return this.compartilhamentos.get(id) ?? null;
  }

  async revogarCompartilhamento(
    id: string,
    dados: { atorUsuarioId?: string | null; motivo: string }
  ): Promise<{ compartilhamento: CompartilhamentoClienteSeguro; auditoria: AuditoriaCompartilhamentoCliente[] } | null> {
    const atual = this.compartilhamentos.get(id);
    if (!atual) return null;

    const agora = new Date();
    const revogado: CompartilhamentoClienteSeguro = {
      ...atual,
      status: "REVOGADO",
      atualizadoEm: agora
    };
    const auditoria: AuditoriaCompartilhamentoCliente = {
      id: randomUUID(),
      compartilhamentoId: id,
      atorUsuarioId: dados.atorUsuarioId ?? null,
      acao: "REVOGADO",
      dados: {
        statusAnterior: atual.status,
        statusNovo: revogado.status,
        motivo: dados.motivo
      },
      criadoEm: agora
    };

    this.compartilhamentos.set(id, revogado);
    this.auditorias.set(id, [...(this.auditorias.get(id) ?? []), auditoria]);
    return { compartilhamento: revogado, auditoria: [auditoria] };
  }

  async listarRecebidos(negocioDestinoId: string, agora = new Date()): Promise<CompartilhamentoClienteRecebido[]> {
    return [...this.compartilhamentos.values()]
      .filter((compartilhamento) => compartilhamento.negocioDestinoId === negocioDestinoId)
      .filter((compartilhamento) => compartilhamento.status === "ATIVO")
      .filter((compartilhamento) => !compartilhamento.expiraEm || compartilhamento.expiraEm > agora)
      .map((compartilhamento) => ({
        ...compartilhamento,
        cliente: this.filtrarClientePorEscopo(this.snapshotsClientes.get(compartilhamento.id), compartilhamento.escopo)
      }))
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  private filtrarClientePorEscopo(cliente: Cliente360 | undefined, escopo: Record<string, unknown>) {
    if (!cliente) return {};
    const campos = Array.isArray(escopo.campos) ? escopo.campos.filter((campo) => typeof campo === "string") : [];
    const permitido = new Set(campos.length > 0 ? campos : ["nome", "telefone"]);
    const resultado: Record<string, unknown> = {};

    if (permitido.has("nome")) resultado.nome = cliente.nome;
    if (permitido.has("telefone") || permitido.has("whatsapp")) resultado.telefone = cliente.telefone;
    if (permitido.has("email")) resultado.email = cliente.email;
    if (permitido.has("username")) resultado.username = cliente.username;
    if (permitido.has("avatarUrl")) resultado.avatarUrl = cliente.avatarUrl;
    if (permitido.has("preferencias")) resultado.preferencias = cliente.preferencias;

    return resultado;
  }
}

export class RepositorioPedidosMemoria implements RepositorioPedidos {
  private readonly pedidos = new Map<string, Pedido>();

  async criar(dados: DadosPedidoResolvido): Promise<Pedido> {
    const agora = new Date();
    const id = randomUUID();
    const numero = dados.numero ?? this.proximoNumero(dados.negocioId);
    const pedido: Pedido = {
      id,
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
      pagoEm: null,
      entregueEm: null,
      canceladoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
      itens: dados.itens.map((item) => ({
        id: randomUUID(),
        pedidoId: id,
        ...item,
        criadoEm: agora,
        atualizadoEm: agora
      }))
    };

    this.pedidos.set(pedido.id, pedido);
    return pedido;
  }

  async listar(negocioId: string, filtros: FiltrosPedidos = {}): Promise<Pedido[]> {
    const busca = filtros.busca?.trim().toLowerCase();
    return [...this.pedidos.values()]
      .filter((pedido) => pedido.negocioId === negocioId)
      .filter((pedido) => !filtros.estado || pedido.estado === filtros.estado)
      .filter((pedido) => !filtros.estadoPagamento || pedido.estadoPagamento === filtros.estadoPagamento)
      .filter((pedido) => !filtros.estadoEntrega || pedido.estadoEntrega === filtros.estadoEntrega)
      .filter((pedido) => !filtros.clienteId || pedido.clienteNegocioId === filtros.clienteId)
      .filter((pedido) => !filtros.canal || pedido.canal.toLowerCase() === filtros.canal.toLowerCase())
      .filter((pedido) => !filtros.dataInicio || pedido.criadoEm >= filtros.dataInicio)
      .filter((pedido) => !filtros.dataFim || pedido.criadoEm <= filtros.dataFim)
      .filter((pedido) => {
        const produto = filtros.produto?.trim().toLowerCase();
        if (!produto) return true;
        return pedido.itens.some((item) =>
          [item.codigoPeca, item.nomeProduto].some((valor) => valor.toLowerCase().includes(produto))
        );
      })
      .filter((pedido) => {
        if (!busca) return true;
        return [
          String(pedido.numero),
          pedido.canal,
          pedido.origem,
          pedido.observacao,
          ...pedido.itens.flatMap((item) => [item.codigoPeca, item.nomeProduto])
        ].some((valor) => valor?.toLowerCase().includes(busca));
      })
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, filtros.limite ?? 100);
  }

  async buscarPorId(id: string, negocioId: string): Promise<Pedido | null> {
    const pedido = this.pedidos.get(id) ?? null;
    return pedido?.negocioId === negocioId ? pedido : null;
  }

  async buscarPorReservaId(reservaId: string, negocioId: string): Promise<Pedido | null> {
    return (
      [...this.pedidos.values()].find((pedido) => pedido.negocioId === negocioId && pedido.reservaId === reservaId) ??
      null
    );
  }

  async atualizarEstado(id: string, negocioId: string, dados: AtualizacaoEstadoPedido): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const atualizado: Pedido = {
      ...pedido,
      estado: dados.estado ?? pedido.estado,
      estadoPagamento: dados.estadoPagamento ?? pedido.estadoPagamento,
      observacao: dados.observacao ?? pedido.observacao,
      responsavelId: dados.responsavelId ?? pedido.responsavelId,
      canceladoEm: dados.estado === "CANCELADO" ? new Date() : pedido.canceladoEm,
      atualizadoEm: new Date()
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  async atualizarFinanceiro(
    id: string,
    negocioId: string,
    dados: AtualizacaoFinanceiraPedido
  ): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const atualizado: Pedido = {
      ...pedido,
      descontoEmKwanza: dados.descontoEmKwanza ?? pedido.descontoEmKwanza,
      motivoDesconto: dados.motivoDesconto === undefined ? pedido.motivoDesconto : dados.motivoDesconto,
      totalEmKwanza: dados.totalEmKwanza ?? pedido.totalEmKwanza,
      observacao: dados.observacao === undefined ? pedido.observacao : dados.observacao,
      atualizadoEm: new Date()
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  async atualizarItens(id: string, negocioId: string, dados: AtualizacaoItensPedidoResolvida): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const agora = new Date();
    const atualizado: Pedido = {
      ...pedido,
      itens: dados.itens.map((item) => ({
        id: randomUUID(),
        pedidoId: id,
        ...item,
        criadoEm: agora,
        atualizadoEm: agora
      })),
      subtotalEmKwanza: dados.subtotalEmKwanza,
      totalEmKwanza: dados.totalEmKwanza,
      observacao: dados.observacao === undefined ? pedido.observacao : dados.observacao,
      atualizadoEm: agora
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  async confirmarPagamento(
    id: string,
    negocioId: string,
    dados: ConfirmacaoPagamentoPedido
  ): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const atualizado: Pedido = {
      ...pedido,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? pedido.comprovativoPagamentoUrl,
      observacao: dados.observacao ?? pedido.observacao,
      pagoEm: new Date(),
      atualizadoEm: new Date()
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  async registrarComprovativo(
    id: string,
    negocioId: string,
    dados: RegistroComprovativoPagamentoPedido
  ): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const atualizado: Pedido = {
      ...pedido,
      estadoPagamento: "COMPROVATIVO_RECEBIDO",
      comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? pedido.comprovativoPagamentoUrl,
      observacao: dados.observacao ?? pedido.observacao,
      atualizadoEm: new Date()
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  async rejeitarPagamento(
    id: string,
    negocioId: string,
    dados: RejeicaoPagamentoPedido
  ): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const atualizado: Pedido = {
      ...pedido,
      estado: "AGUARDANDO_PAGAMENTO",
      estadoPagamento: "REJEITADO",
      observacao: dados.motivo,
      pagoEm: null,
      atualizadoEm: new Date()
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  async atualizarEntrega(id: string, negocioId: string, dados: AtualizacaoEntregaPedido): Promise<Pedido | null> {
    const pedido = await this.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const atualizado: Pedido = {
      ...pedido,
      estado: dados.estadoEntrega === "ENTREGUE" ? "ENTREGUE" : pedido.estado,
      estadoEntrega: dados.estadoEntrega,
      observacao: dados.observacao ?? pedido.observacao,
      responsavelId: dados.responsavelId ?? pedido.responsavelId,
      entregueEm: dados.estadoEntrega === "ENTREGUE" ? new Date() : pedido.entregueEm,
      atualizadoEm: new Date()
    };
    this.pedidos.set(id, atualizado);
    return atualizado;
  }

  private proximoNumero(negocioId: string): number {
    const numeros = [...this.pedidos.values()]
      .filter((pedido) => pedido.negocioId === negocioId)
      .map((pedido) => pedido.numero);
    return Math.max(0, ...numeros) + 1;
  }
}

export class RepositorioAtendimentoMemoria implements RepositorioAtendimento {
  private readonly clientes = new Map<string, ClienteAtendimento>();
  private readonly conversas = new Map<string, ConversaAtendimento>();
  private readonly mensagens = new Map<string, MensagemAtendimento>();

  async registrarMensagem(dados: NovaMensagemAtendimento): Promise<MensagemAtendimento> {
    if (dados.providerMessageId) {
      const existente = await this.buscarMensagemPorProviderMessageId(dados.providerMessageId);
      if (existente) return existente;
    }

    const agora = new Date();
    const enviadaEm = dados.enviadaEm ?? agora;
    const dadosComNegocio = {
      ...dados,
      negocioId: dados.negocioId ?? this.inferirNegocioIdPorTelefone(dados.telefone)
    };
    const { cliente, conversa } =
      this.obterConversaExistente(dadosComNegocio, enviadaEm) ??
      this.obterOuCriarConversa(dadosComNegocio, enviadaEm);
    if (dados.providerMessageId) {
      const existenteConcorrente =
        [...this.mensagens.values()].find((mensagem) => mensagem.providerMessageId === dados.providerMessageId) ?? null;
      if (existenteConcorrente) return existenteConcorrente;
    }
    const mensagem: MensagemAtendimento = {
      id: randomUUID(),
      negocioId: conversa.negocioId,
      conversaId: conversa.id,
      telefone: dados.telefone,
      direcao: dados.direcao,
      remetente: dados.remetente,
      canal: dados.canal ?? "whatsapp",
      tipo: dados.tipo,
      conteudo: dados.conteudo,
      provider: dados.provider ?? null,
      providerMessageId: dados.providerMessageId ?? null,
      status: dados.status ?? (dados.direcao === "INBOUND" ? "RECEIVED" : "SENT"),
      origem: dados.origem,
      reservaId: dados.reservaId ?? null,
      comentarioId: dados.comentarioId ?? null,
      erro: dados.erro ?? null,
      contexto: dados.contexto ?? {},
      enviadaEm,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.mensagens.set(mensagem.id, mensagem);
    this.clientes.set(this.chaveCliente(cliente.telefone, cliente.negocioId), {
      ...cliente,
      ultimaInteracaoEm: enviadaEm,
      atualizadoEm: agora
    });
    this.conversas.set(conversa.id, { ...conversa, ultimaMensagemEm: enviadaEm, atualizadoEm: agora });
    return mensagem;
  }

  async listarConversasComMensagens(limite = 100, negocioId?: string | null): Promise<ConversaAtendimentoComMensagens[]> {
    return [...this.conversas.values()]
      .filter((conversa) => !negocioId || conversa.negocioId === negocioId)
      .map((conversa) => this.montarConversaComMensagens(conversa))
      .sort(
        (a, b) =>
          (b.conversa.ultimaMensagemEm?.getTime() ?? b.conversa.atualizadoEm.getTime()) -
          (a.conversa.ultimaMensagemEm?.getTime() ?? a.conversa.atualizadoEm.getTime())
      )
      .slice(0, limite);
  }

  async buscarConversaComMensagensPorId(
    id: string,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const conversa = this.conversas.get(id);
    if (conversa && negocioId && conversa.negocioId !== negocioId) return null;
    return conversa ? this.montarConversaComMensagens(conversa) : null;
  }

  async atualizarConversa(
    id: string,
    dados: AtualizacaoConversaAtendimento,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const conversa = this.conversas.get(id);
    if (!conversa) return null;
    if (negocioId && conversa.negocioId !== negocioId) return null;

    const atualizada: ConversaAtendimento = {
      ...conversa,
      estado: dados.estado ?? conversa.estado,
      prioridade: dados.prioridade ?? conversa.prioridade,
      responsavelId: dados.responsavelId === undefined ? conversa.responsavelId : dados.responsavelId,
      tags: dados.tags ?? conversa.tags,
      atualizadoEm: new Date()
    };

    this.conversas.set(id, atualizada);
    return this.montarConversaComMensagens(atualizada);
  }

  async buscarMensagemPorProviderMessageId(providerMessageId: string): Promise<MensagemAtendimento | null> {
    return [...this.mensagens.values()].find((mensagem) => mensagem.providerMessageId === providerMessageId) ?? null;
  }

  async atualizarStatusMensagemPorProviderMessageId(
    providerMessageId: string,
    dados: { status: MensagemAtendimento["status"]; erro?: string | null; atualizadoEm?: Date }
  ): Promise<MensagemAtendimento | null> {
    const mensagem = await this.buscarMensagemPorProviderMessageId(providerMessageId);
    if (!mensagem) return null;

    const atualizada = {
      ...mensagem,
      status: dados.status,
      erro: dados.erro === undefined ? mensagem.erro : dados.erro,
      atualizadoEm: dados.atualizadoEm ?? new Date()
    };
    this.mensagens.set(mensagem.id, atualizada);
    return atualizada;
  }

  async limparHistorico() {
    const resultado = {
      mensagensAtendimento: this.mensagens.size,
      conversasAtendimento: this.conversas.size,
      clientesAtendimento: this.clientes.size
    };

    this.mensagens.clear();
    this.conversas.clear();
    this.clientes.clear();
    return resultado;
  }

  private obterOuCriarConversa(dados: NovaMensagemAtendimento, agora: Date) {
    const negocioId = dados.negocioId ?? null;
    const clienteExistente = this.clientes.get(this.chaveCliente(dados.telefone, negocioId));
    const cliente: ClienteAtendimento = clienteExistente
      ? {
          ...clienteExistente,
          nome: dados.nomeCliente ?? clienteExistente.nome,
          username: dados.usernameCliente ?? clienteExistente.username,
          userId: dados.userIdCliente ?? clienteExistente.userId,
          avatarUrl: dados.avatarUrlCliente ?? clienteExistente.avatarUrl,
          ultimaInteracaoEm: agora,
          atualizadoEm: new Date()
        }
      : {
          id: randomUUID(),
          negocioId,
          clienteGlobalId: null,
          telefone: dados.telefone,
          nome: dados.nomeCliente ?? null,
          username: dados.usernameCliente ?? null,
          userId: dados.userIdCliente ?? null,
          avatarUrl: dados.avatarUrlCliente ?? null,
          origem: dados.origem,
          tags: [],
          consentimento: true,
          primeiraInteracaoEm: agora,
          ultimaInteracaoEm: agora,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        };

    this.clientes.set(this.chaveCliente(cliente.telefone, cliente.negocioId), cliente);

    const canal = dados.canal ?? "whatsapp";
    const conversaExistente = [...this.conversas.values()].find(
      (conversa) =>
        conversa.telefone === dados.telefone &&
        conversa.canal === canal &&
        conversa.negocioId === negocioId
    );
    const conversa: ConversaAtendimento =
      conversaExistente ??
      {
        id: randomUUID(),
        negocioId,
        clienteNegocioId: dados.clienteNegocioId ?? null,
        clienteId: cliente.id,
        telefone: dados.telefone,
        canal,
        estado: "ABERTA",
        prioridade: "NORMAL",
        responsavelId: null,
        tags: [],
        ultimaMensagemEm: null,
        criadaEm: new Date(),
        atualizadoEm: new Date()
      };

    this.conversas.set(conversa.id, conversa);
    return { cliente, conversa };
  }

  private obterConversaExistente(dados: NovaMensagemAtendimento, agora: Date) {
    if (!dados.conversaId) return null;

    const conversa = this.conversas.get(dados.conversaId);
    if (!conversa) return null;
    if (dados.negocioId && conversa.negocioId !== dados.negocioId) return null;

    const clienteExistente = this.clientes.get(this.chaveCliente(conversa.telefone, conversa.negocioId));
    if (!clienteExistente) return null;

    const cliente: ClienteAtendimento = {
      ...clienteExistente,
      nome: dados.nomeCliente ?? clienteExistente.nome,
      username: dados.usernameCliente ?? clienteExistente.username,
      userId: dados.userIdCliente ?? clienteExistente.userId,
      avatarUrl: dados.avatarUrlCliente ?? clienteExistente.avatarUrl,
      ultimaInteracaoEm: agora,
      atualizadoEm: new Date()
    };

    this.clientes.set(this.chaveCliente(cliente.telefone, cliente.negocioId), cliente);
    return { cliente, conversa };
  }

  private montarConversaComMensagens(conversa: ConversaAtendimento): ConversaAtendimentoComMensagens {
    return {
      conversa,
      cliente: this.clientes.get(this.chaveCliente(conversa.telefone, conversa.negocioId))!,
      mensagens: [...this.mensagens.values()]
        .filter((mensagem) => mensagem.conversaId === conversa.id)
        .sort((a, b) => a.enviadaEm.getTime() - b.enviadaEm.getTime())
    };
  }

  private chaveCliente(telefone: string, negocioId: string | null | undefined): string {
    return `${negocioId ?? "global"}:${telefone}`;
  }

  private inferirNegocioIdPorTelefone(telefone: string): string | null {
    const negocioIds = [
      ...new Set(
        [...this.conversas.values()]
          .filter((conversa) => conversa.telefone === telefone && conversa.negocioId)
          .map((conversa) => conversa.negocioId as string)
      )
    ];

    return negocioIds.length === 1 ? negocioIds[0] : null;
  }
}

export class RepositorioTarefasOperacionaisMemoria implements RepositorioTarefasOperacionais {
  private readonly tarefas = new Map<string, TarefaOperacional>();

  async criar(dados: NovaTarefaOperacional): Promise<TarefaOperacional> {
    const agora = new Date();
    const estado = dados.estado ?? "ABERTA";
    const tarefa: TarefaOperacional = {
      id: randomUUID(),
      negocioId: dados.negocioId ?? null,
      tipo: dados.tipo,
      titulo: dados.titulo,
      descricao: dados.descricao,
      prioridade: dados.prioridade ?? "NORMAL",
      estado,
      origem: dados.origem ?? null,
      clienteId: dados.clienteId ?? null,
      pedidoId: dados.pedidoId ?? null,
      entidadeTipo: dados.entidadeTipo ?? null,
      entidadeId: dados.entidadeId ?? null,
      clienteTelefone: dados.clienteTelefone ?? null,
      responsavelId: dados.responsavelId ?? null,
      prazoEm: dados.prazoEm ?? null,
      observacao: dados.observacao ?? null,
      contexto: dados.contexto ?? {},
      concluidaEm: estado === "CONCLUIDA" ? agora : null,
      criadaEm: agora,
      atualizadoEm: agora
    };

    this.tarefas.set(tarefa.id, tarefa);
    return tarefa;
  }

  async listar(negocioId: string, filtros: FiltrosTarefasOperacionais = {}): Promise<TarefaOperacional[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.tarefas.values()]
      .filter((tarefa) => tarefa.negocioId === negocioId)
      .filter((tarefa) => !filtros.tipo || tarefa.tipo === filtros.tipo)
      .filter((tarefa) => !filtros.estado || tarefa.estado === filtros.estado)
      .filter((tarefa) => filtros.responsavelId === undefined || tarefa.responsavelId === filtros.responsavelId)
      .sort((a, b) => b.criadaEm.getTime() - a.criadaEm.getTime())
      .slice(0, limite);
  }

  async buscarPorId(id: string, negocioId: string): Promise<TarefaOperacional | null> {
    const tarefa = this.tarefas.get(id);
    return tarefa?.negocioId === negocioId ? tarefa : null;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoTarefaOperacional
  ): Promise<TarefaOperacional | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;

    const agora = new Date();
    const estado = dados.estado ?? atual.estado;
    const atualizada: TarefaOperacional = {
      ...atual,
      ...removerIndefinidos({
        tipo: dados.tipo,
        titulo: dados.titulo,
        descricao: dados.descricao,
        prioridade: dados.prioridade,
        estado,
        origem: dados.origem,
        clienteId: dados.clienteId,
        pedidoId: dados.pedidoId,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        clienteTelefone: dados.clienteTelefone,
        responsavelId: dados.responsavelId,
        prazoEm: dados.prazoEm,
        observacao: dados.observacao
      }),
      contexto: dados.contexto ? { ...atual.contexto, ...dados.contexto } : atual.contexto,
      concluidaEm: estado === "CONCLUIDA" ? atual.concluidaEm ?? agora : null,
      atualizadoEm: agora
    };

    this.tarefas.set(id, atualizada);
    return atualizada;
  }
}

function removerIndefinidos<T extends Record<string, unknown>>(dados: T): Partial<T> {
  return Object.fromEntries(Object.entries(dados).filter(([, valor]) => valor !== undefined)) as Partial<T>;
}

export class RepositorioSocialInboxMemoria implements RepositorioSocialInbox {
  private readonly itens = new Map<string, SocialInboxItem>();

  async criar(dados: NovoSocialInboxItem): Promise<SocialInboxItem> {
    const agora = new Date();
    const item: SocialInboxItem = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      canal: dados.canal,
      provider: dados.provider,
      tipo: dados.tipo,
      estado: dados.estado ?? "NOVO",
      postId: dados.postId ?? null,
      postUrl: dados.postUrl ?? null,
      autorId: dados.autorId ?? null,
      autorUsername: dados.autorUsername ?? null,
      autorNome: dados.autorNome ?? null,
      autorAvatarUrl: dados.autorAvatarUrl ?? null,
      texto: dados.texto,
      intencao: dados.intencao ?? "SEM_INTENCAO",
      confianca: dados.confianca ?? 0,
      clienteTelefone: dados.clienteTelefone ?? null,
      clienteId: dados.clienteId ?? null,
      entidades: dados.entidades ?? {},
      contexto: dados.contexto ?? {},
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.itens.set(item.id, item);
    return item;
  }

  async listar(negocioId: string, filtros: FiltrosSocialInbox = {}): Promise<SocialInboxItem[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.itens.values()]
      .filter((item) => item.negocioId === negocioId)
      .filter((item) => !filtros.canal || item.canal === filtros.canal)
      .filter((item) => !filtros.estado || item.estado === filtros.estado)
      .filter((item) => !filtros.intencao || item.intencao === filtros.intencao)
      .filter((item) => !filtros.autorUsername || item.autorUsername === filtros.autorUsername)
      .filter((item) => !filtros.clienteTelefone || item.clienteTelefone === filtros.clienteTelefone)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }

  async buscarPorId(id: string, negocioId: string): Promise<SocialInboxItem | null> {
    const item = this.itens.get(id);
    return item?.negocioId === negocioId ? item : null;
  }
}

export class RepositorioPlaybooksRecuperacaoMemoria implements RepositorioPlaybooksRecuperacao {
  private readonly playbooks = new Map<string, PlaybookRecuperacao>();
  private readonly execucoes = new Map<string, ExecucaoPlaybookRecuperacao>();

  async criar(dados: NovoPlaybookRecuperacao): Promise<PlaybookRecuperacao> {
    const agora = new Date();
    const playbook: PlaybookRecuperacao = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      nome: dados.nome,
      gatilho: dados.gatilho,
      ativo: dados.ativo ?? true,
      atrasoMinutos: dados.atrasoMinutos ?? 0,
      condicoes: dados.condicoes ?? {},
      acao: dados.acao ?? "CRIAR_TAREFA",
      tituloTarefa: dados.tituloTarefa ?? null,
      descricaoTarefa: dados.descricaoTarefa ?? null,
      prioridadeTarefa: dados.prioridadeTarefa ?? "NORMAL",
      responsavelId: dados.responsavelId ?? null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.playbooks.set(playbook.id, playbook);
    return playbook;
  }

  async listar(negocioId: string, filtros: FiltrosPlaybookRecuperacao = {}): Promise<PlaybookRecuperacao[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.playbooks.values()]
      .filter((playbook) => playbook.negocioId === negocioId)
      .filter((playbook) => !filtros.gatilho || playbook.gatilho === filtros.gatilho)
      .filter((playbook) => filtros.ativo === undefined || playbook.ativo === filtros.ativo)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }

  async buscarPorId(id: string, negocioId: string): Promise<PlaybookRecuperacao | null> {
    const playbook = this.playbooks.get(id);
    return playbook?.negocioId === negocioId ? playbook : null;
  }

  async registrarExecucao(dados: NovaExecucaoPlaybookRecuperacao): Promise<ExecucaoPlaybookRecuperacao> {
    const execucao: ExecucaoPlaybookRecuperacao = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      playbookId: dados.playbookId,
      gatilho: dados.gatilho,
      entidadeTipo: dados.entidadeTipo ?? null,
      entidadeId: dados.entidadeId ?? null,
      clienteTelefone: dados.clienteTelefone ?? null,
      estado: dados.estado,
      tarefaId: dados.tarefaId ?? null,
      motivo: dados.motivo ?? null,
      contexto: dados.contexto ?? {},
      criadaEm: new Date()
    };

    this.execucoes.set(execucao.id, execucao);
    return execucao;
  }

  async listarExecucoes(
    negocioId: string,
    filtros: FiltrosExecucoesPlaybookRecuperacao = {}
  ): Promise<ExecucaoPlaybookRecuperacao[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.execucoes.values()]
      .filter((execucao) => execucao.negocioId === negocioId)
      .filter((execucao) => !filtros.gatilho || execucao.gatilho === filtros.gatilho)
      .filter((execucao) => !filtros.estado || execucao.estado === filtros.estado)
      .filter((execucao) => !filtros.entidadeTipo || execucao.entidadeTipo === filtros.entidadeTipo)
      .filter((execucao) => !filtros.entidadeId || execucao.entidadeId === filtros.entidadeId)
      .sort((a, b) => b.criadaEm.getTime() - a.criadaEm.getTime())
      .slice(0, limite);
  }
}

export class RepositorioFunilComercialMemoria implements RepositorioFunilComercial {
  private readonly movimentos = new Map<string, MovimentoFunilComercial>();

  async registrarMovimento(dados: NovoMovimentoFunilComercial): Promise<MovimentoFunilComercial> {
    const criadoEm = new Date(Date.now() + this.movimentos.size);
    const movimento: MovimentoFunilComercial = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      entidadeTipo: dados.entidadeTipo,
      entidadeId: dados.entidadeId,
      etapaAnterior: dados.etapaAnterior ?? null,
      etapaNova: dados.etapaNova,
      motivo: dados.motivo,
      origem: dados.origem ?? null,
      autorId: dados.autorId ?? null,
      contexto: dados.contexto ?? {},
      criadoEm
    };

    this.movimentos.set(movimento.id, movimento);
    return movimento;
  }

  async listarMovimentos(
    negocioId: string,
    filtros: FiltrosMovimentosFunilComercial = {}
  ): Promise<MovimentoFunilComercial[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.movimentos.values()]
      .filter((movimento) => movimento.negocioId === negocioId)
      .filter((movimento) => !filtros.entidadeTipo || movimento.entidadeTipo === filtros.entidadeTipo)
      .filter((movimento) => !filtros.entidadeId || movimento.entidadeId === filtros.entidadeId)
      .filter((movimento) => !filtros.etapaNova || movimento.etapaNova === filtros.etapaNova)
      .filter((movimento) => !filtros.origem || movimento.origem === filtros.origem)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }
}

export class RepositorioOportunidadesRecuperacaoMemoria implements RepositorioOportunidadesRecuperacao {
  private readonly oportunidades = new Map<string, OportunidadeRecuperacao>();

  async criar(dados: NovaOportunidadeRecuperacao): Promise<OportunidadeRecuperacao> {
    const agora = new Date();
    const estado = dados.estado ?? "ABERTA";
    const oportunidade: OportunidadeRecuperacao = {
      id: randomUUID(),
      negocioId: dados.negocioId,
      gatilho: dados.gatilho,
      estado,
      entidadeTipo: dados.entidadeTipo ?? null,
      entidadeId: dados.entidadeId ?? null,
      clienteTelefone: dados.clienteTelefone ?? null,
      playbookId: dados.playbookId ?? null,
      execucaoPlaybookId: dados.execucaoPlaybookId ?? null,
      tarefaId: dados.tarefaId ?? null,
      movimentoFunilId: dados.movimentoFunilId ?? null,
      valorEstimadoEmKwanza: dados.valorEstimadoEmKwanza ?? null,
      motivo: dados.motivo,
      responsavelId: dados.responsavelId ?? null,
      observacao: dados.observacao ?? null,
      contexto: dados.contexto ?? {},
      criadaEm: agora,
      atualizadaEm: agora,
      encerradaEm: this.ehEstadoFinal(estado) ? agora : null
    };

    this.oportunidades.set(oportunidade.id, oportunidade);
    return oportunidade;
  }

  async listar(
    negocioId: string,
    filtros: FiltrosOportunidadesRecuperacao = {}
  ): Promise<OportunidadeRecuperacao[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.oportunidades.values()]
      .filter((oportunidade) => oportunidade.negocioId === negocioId)
      .filter((oportunidade) => !filtros.gatilho || oportunidade.gatilho === filtros.gatilho)
      .filter((oportunidade) => !filtros.estado || oportunidade.estado === filtros.estado)
      .filter((oportunidade) => !filtros.entidadeTipo || oportunidade.entidadeTipo === filtros.entidadeTipo)
      .filter((oportunidade) => !filtros.entidadeId || oportunidade.entidadeId === filtros.entidadeId)
      .filter((oportunidade) =>
        filtros.responsavelId === undefined ? true : oportunidade.responsavelId === filtros.responsavelId
      )
      .sort((a, b) => b.criadaEm.getTime() - a.criadaEm.getTime())
      .slice(0, limite);
  }

  async buscarPorId(id: string, negocioId: string): Promise<OportunidadeRecuperacao | null> {
    const oportunidade = this.oportunidades.get(id);
    return oportunidade?.negocioId === negocioId ? oportunidade : null;
  }

  async atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoOportunidadeRecuperacao
  ): Promise<OportunidadeRecuperacao | null> {
    const atual = await this.buscarPorId(id, negocioId);
    if (!atual) return null;

    const agora = new Date();
    const estado = dados.estado ?? atual.estado;
    const oportunidade: OportunidadeRecuperacao = {
      ...atual,
      estado,
      responsavelId: dados.responsavelId !== undefined ? dados.responsavelId : atual.responsavelId,
      observacao: dados.observacao !== undefined ? dados.observacao : atual.observacao,
      contexto: dados.contexto ? { ...atual.contexto, ...dados.contexto } : atual.contexto,
      encerradaEm: this.ehEstadoFinal(estado) ? atual.encerradaEm ?? agora : null,
      atualizadaEm: agora
    };

    this.oportunidades.set(id, oportunidade);
    return oportunidade;
  }

  private ehEstadoFinal(estado: OportunidadeRecuperacao["estado"]): boolean {
    return estado === "RECUPERADA" || estado === "PERDIDA" || estado === "CANCELADA";
  }
}

export class RepositorioAuditoriaMemoria implements RepositorioAuditoria {
  private readonly eventos = new Map<string, EventoSistema>();
  private readonly mensagens = new Map<string, {
    id: string;
    negocioId: string | null;
    telefone: string;
    tipo: string;
    conteudo: string;
    provider: string;
    idExterno: string | null;
    enviadaEm: Date;
  }>();
  private readonly outbox = new Map<string, RegistroOutboxEventoN8n>();
  private readonly outboxWhatsApp = new Map<string, RegistroOutboxMensagemWhatsApp>();

  async registrarEventoSistema(evento: EventoSistema): Promise<void> {
    this.eventos.set(evento.id, evento);
  }

  async listarEventosSistema(filtros: {
    negocioId?: string | null;
    tipo?: EventoSistema["tipo"];
    limite?: number;
  } = {}): Promise<EventoSistema[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    return [...this.eventos.values()]
      .filter((evento) => !filtros.tipo || evento.tipo === filtros.tipo)
      .filter((evento) => filtros.negocioId === undefined || this.obterNegocioIdEvento(evento) === (filtros.negocioId ?? null))
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
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
    const id = randomUUID();
    this.mensagens.set(id, {
      id,
      negocioId: dados.negocioId ?? null,
      telefone: dados.telefone,
      tipo: dados.tipo,
      conteudo: dados.conteudo,
      provider: dados.provider,
      idExterno: dados.idExterno ?? null,
      enviadaEm: dados.enviadaEm ?? new Date()
    });
  }

  private obterNegocioIdEvento(evento: EventoSistema): string | null {
    const direto = evento.dados.negocioId;
    if (typeof direto === "string" && direto.trim()) return direto;

    const contexto = this.obterObjeto(evento.dados.contexto);
    const negocioContexto = contexto.negocioId;
    return typeof negocioContexto === "string" && negocioContexto.trim() ? negocioContexto : null;
  }

  private obterObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }

  async criarEventoN8n(evento: EventoSistema): Promise<RegistroOutboxEventoN8n> {
    const agora = new Date();
    const registro: RegistroOutboxEventoN8n = {
      id: randomUUID(),
      eventoId: evento.id,
      tipo: evento.tipo,
      payload: evento.dados,
      status: "PENDENTE",
      tentativas: 0,
      proximaTentativaEm: agora,
      ultimoErro: null,
      publicadoEm: null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.outbox.set(registro.id, registro);
    return registro;
  }

  async listarEventosN8n(limite = 100): Promise<RegistroOutboxEventoN8n[]> {
    return [...this.outbox.values()]
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }

  async listarEventosN8nPendentes(limite: number, agora: Date): Promise<RegistroOutboxEventoN8n[]> {
    return [...this.outbox.values()]
      .filter((evento) => evento.status !== "PUBLICADO" && evento.proximaTentativaEm <= agora)
      .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      .slice(0, limite);
  }

  async marcarEventoN8nPublicado(id: string, publicadoEm: Date): Promise<void> {
    const registro = this.outbox.get(id);
    if (!registro) return;
    this.outbox.set(id, { ...registro, status: "PUBLICADO", publicadoEm, atualizadoEm: publicadoEm });
  }

  async marcarEventoN8nFalha(id: string, erro: string, proximaTentativaEm: Date): Promise<void> {
    const registro = this.outbox.get(id);
    if (!registro) return;
    this.outbox.set(id, {
      ...registro,
      status: "FALHOU",
      tentativas: registro.tentativas + 1,
      ultimoErro: erro,
      proximaTentativaEm,
      atualizadoEm: new Date()
    });
  }

  async resumirEventosN8n(): Promise<ResumoOutboxEventoN8n> {
    const eventos = [...this.outbox.values()];
    const pendentes = eventos.filter((evento) => evento.status === "PENDENTE");
    const falhados = eventos.filter((evento) => evento.status === "FALHOU");
    const proximaTentativaEm =
      [...pendentes, ...falhados]
        .map((evento) => evento.proximaTentativaEm)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
    const atualizadoEm = eventos.map((evento) => evento.atualizadoEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const ultimaFalha =
      falhados.sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime())[0]?.ultimoErro ?? null;

    return {
      total: eventos.length,
      pendentes: pendentes.length,
      publicados: eventos.filter((evento) => evento.status === "PUBLICADO").length,
      falhados: falhados.length,
      proximaTentativaEm,
      ultimaFalha,
      atualizadoEm
    };
  }

  async criarMensagemWhatsAppPendente(dados: NovoOutboxMensagemWhatsApp): Promise<RegistroOutboxMensagemWhatsApp> {
    const agora = new Date();
    const registro: RegistroOutboxMensagemWhatsApp = {
      id: randomUUID(),
      negocioId: dados.negocioId ?? null,
      telefone: dados.telefone,
      tipo: dados.tipo,
      conteudo: dados.conteudo,
      contexto: dados.contexto ?? {},
      status: "PENDENTE",
      tentativas: 0,
      maxTentativas: Math.max(1, dados.maxTentativas ?? 5),
      proximaTentativaEm: dados.proximaTentativaEm ?? agora,
      ultimoErro: dados.ultimoErro ?? null,
      provider: null,
      idExterno: null,
      enviadaEm: null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    this.outboxWhatsApp.set(registro.id, registro);
    return registro;
  }

  async listarMensagensWhatsApp(limite = 100, negocioId?: string | null): Promise<RegistroOutboxMensagemWhatsApp[]> {
    return [...this.outboxWhatsApp.values()]
      .filter((mensagem) => this.pertenceAoNegocio(mensagem.negocioId, negocioId))
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, limite);
  }

  async listarMensagensWhatsAppPendentes(
    limite: number,
    agora: Date,
    opcoes: { incluirFalhadas?: boolean; negocioId?: string | null } = {}
  ): Promise<RegistroOutboxMensagemWhatsApp[]> {
    return [...this.outboxWhatsApp.values()]
      .filter((mensagem) => {
        const statusPermitido = mensagem.status === "PENDENTE" || (opcoes.incluirFalhadas && mensagem.status === "FALHOU");
        return (
          statusPermitido &&
          mensagem.proximaTentativaEm <= agora &&
          this.pertenceAoNegocio(mensagem.negocioId, opcoes.negocioId)
        );
      })
      .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      .slice(0, limite);
  }

  async marcarMensagemWhatsAppEnviada(
    id: string,
    dados: { provider: string; idExterno?: string | null; enviadaEm: Date }
  ): Promise<void> {
    const registro = this.outboxWhatsApp.get(id);
    if (!registro) return;

    this.outboxWhatsApp.set(id, {
      ...registro,
      status: "ENVIADA",
      provider: dados.provider,
      idExterno: dados.idExterno ?? null,
      enviadaEm: dados.enviadaEm,
      ultimoErro: null,
      atualizadoEm: dados.enviadaEm
    });
  }

  async marcarMensagemWhatsAppFalha(
    id: string,
    erro: string,
    proximaTentativaEm: Date,
    opcoes: { falhaFinal?: boolean } = {}
  ): Promise<void> {
    const registro = this.outboxWhatsApp.get(id);
    if (!registro) return;

    this.outboxWhatsApp.set(id, {
      ...registro,
      status: opcoes.falhaFinal ? "FALHOU" : "PENDENTE",
      tentativas: registro.tentativas + 1,
      ultimoErro: erro,
      proximaTentativaEm,
      atualizadoEm: new Date()
    });
  }

  async resumirMensagensWhatsAppOutbox(negocioId?: string | null): Promise<ResumoOutboxMensagemWhatsApp> {
    const mensagens = [...this.outboxWhatsApp.values()].filter((mensagem) =>
      this.pertenceAoNegocio(mensagem.negocioId, negocioId)
    );
    const pendentes = mensagens.filter((mensagem) => mensagem.status === "PENDENTE");
    const falhadas = mensagens.filter((mensagem) => mensagem.status === "FALHOU");
    const reprocessaveis = [...pendentes, ...falhadas];
    const proximaTentativaEm =
      reprocessaveis.map((mensagem) => mensagem.proximaTentativaEm).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
    const atualizadoEm = mensagens.map((mensagem) => mensagem.atualizadoEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const ultimaFalha =
      mensagens
        .filter((mensagem) => mensagem.ultimoErro)
        .sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime())[0]?.ultimoErro ?? null;

    return {
      total: mensagens.length,
      pendentes: pendentes.length,
      enviadas: mensagens.filter((mensagem) => mensagem.status === "ENVIADA").length,
      falhadas: falhadas.length,
      proximaTentativaEm,
      ultimaFalha,
      atualizadoEm
    };
  }

  async limparMensagensComunicacao() {
    const resultado = {
      mensagensWhatsapp: this.mensagens.size,
      outboxWhatsapp: this.outboxWhatsApp.size
    };

    this.mensagens.clear();
    this.outboxWhatsApp.clear();
    return resultado;
  }

  private pertenceAoNegocio(registroNegocioId: string | null, negocioId?: string | null) {
    return negocioId === undefined ? true : registroNegocioId === (negocioId ?? null);
  }
}
