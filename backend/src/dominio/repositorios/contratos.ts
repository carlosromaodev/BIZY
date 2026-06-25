import type {
  AtualizarPeca,
  CompraUnificada,
  NovaCompraUnificada,
  PedidoFilho,
  RepasseFinanceiro,
  NovoRepasseFinanceiro,
  ReembolsoPedido,
  NovoReembolsoPedido,
  DenunciaMarket,
  NovaDenunciaMarket,
  ResolucaoDenuncia,
  ReservaStockCheckout,
  NovaReservaStockCheckout,
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
  AuditoriaCompartilhamentoCliente,
  CampanhaCrm,
  Cliente360,
  CompartilhamentoClienteRecebido,
  CompartilhamentoClienteSeguro,
  ConfirmacaoPagamentoPedido,
  ConversaAtendimentoComMensagens,
  DadosPedidoResolvido,
  DadosCliente360,
  ComissaoParceiro,
  ExecucaoPlaybookRecuperacao,
  FiltrosExecucoesPlaybookRecuperacao,
  FiltrosMovimentosFunilComercial,
  FiltrosOportunidadesRecuperacao,
  HistoricoComissaoParceiro,
  ItemCampanhaCrm,
  LotePagamentoComissao,
  MembroNegocioOperacional,
  NovaCampanhaCrm,
  NovaPeca,
  NovaComissaoParceiro,
  NovaExecucaoPlaybookRecuperacao,
  NovaOportunidadeRecuperacao,
  NovaRelacaoNegocio,
  NovoMembroNegocioOperacional,
  NovoCompartilhamentoCliente,
  NovoEventoOperacional,
  NovoItemCampanhaCrm,
  NovoJobOperacional,
  NovoMovimentoFunilComercial,
  NovoLotePagamentoComissao,
  NovoLinkAfiliado,
  NovoPlaybookRecuperacao,
  NovoParceiroComercial,
  NovoTemplateWhatsAppNegocio,
  NovaReserva,
  NovaMensagemAtendimento,
  NovaTarefaOperacional,
  NovoSocialInboxItem,
  NovoRegistroComentario,
  FiltrosPedidos,
  Peca,
  MensagemAtendimento,
  Pedido,
  RegistroComprovativoPagamentoPedido,
  RegistroComentario,
  RejeicaoPagamentoPedido,
  Reserva,
  EstadoComentario,
  EstadoPagamento,
  EstadoPeca,
  EstadoReserva,
  EventoOperacional,
  EventoSistema,
  EventoTrackingComercial,
  FiltrosCampanhasCrm,
  FiltrosEventosOperacionais,
  FiltrosPlaybookRecuperacao,
  FiltrosTarefasOperacionais,
  FiltrosSocialInbox,
  DadosCriacaoReservaComControleStock,
  DadosPublicacaoLoja,
  JobOperacional,
  CodigoLoginSms,
  InstanciaInstagram,
  InstanciaWhatsApp,
  NovoOutboxMensagemWhatsApp,
  NovoRegistroSessaoLive,
  RegistroOutboxEventoN8n,
  RegistroOutboxMensagemWhatsApp,
  ResultadoInterpretacaoComentario,
  RegistroSessaoLive,
  AtualizacaoRegistroSessaoLive,
  ResultadoLimpezaDadosComunicacao,
  ResumoOutboxEventoN8n,
  ResumoOutboxMensagemWhatsApp,
  TipoEventoSistema,
  UsuarioSistema,
  DadosIdentidadeAutenticacao,
  DadosPerfilEstudantil,
  PerfilEstudantilUsuario,
  DadosNegocioBizy,
  EstadoParceiroComercial,
  FiltrosClientes360,
  MovimentoStock,
  NovoEventoTrackingComercial,
  NovoMovimentoStock,
  NegocioBizy,
  LinkAfiliado,
  MovimentoFunilComercial,
  ModuloNegocioConfigurado,
  OportunidadeRecuperacao,
  ParceiroComercial,
  PlaybookRecuperacao,
  RelacaoNegocioCompartilhamento,
  ResumoAfiliadosComerciais,
  ResumoTrackingComercial,
  SocialInboxItem,
  TemplateWhatsAppNegocio,
  TarefaOperacional
} from "../tipos.js";

export interface RepositorioPecas {
  criar(dados: NovaPeca): Promise<Peca>;
  listar(negocioId?: string | null): Promise<Peca[]>;
  buscarPorCodigo(codigo: string, negocioId?: string | null): Promise<Peca | null>;
  atualizar(codigo: string, dados: AtualizarPeca, negocioId?: string | null): Promise<Peca>;
  atualizarEstado(codigo: string, estado: EstadoPeca, negocioId?: string | null): Promise<Peca>;
  registrarMovimentoStock(dados: NovoMovimentoStock): Promise<MovimentoStock>;
  listarMovimentosStock(codigoPeca: string, negocioId?: string | null): Promise<MovimentoStock[]>;
  decrementarStockVariante?(pecaId: string, combinacao: string, quantidade: number): Promise<{ quantidade: number }>;
  renomearColecao(negocioId: string, de: string, para: string): Promise<number>;
  limparColecao(negocioId: string, colecao: string): Promise<number>;
}

export interface RepositorioTrackingComercial {
  registrarEvento(dados: NovoEventoTrackingComercial): Promise<EventoTrackingComercial>;
  listarEventos(negocioId: string, filtros?: {
    tipo?: EventoTrackingComercial["tipo"];
    origem?: string;
    canal?: string;
    codigoProduto?: string;
    limite?: number;
  }): Promise<EventoTrackingComercial[]>;
  resumirEventos(negocioId: string): Promise<ResumoTrackingComercial>;
}

export interface RepositorioTemplatesWhatsApp {
  criar(dados: NovoTemplateWhatsAppNegocio): Promise<TemplateWhatsAppNegocio>;
  listar(negocioId: string): Promise<TemplateWhatsAppNegocio[]>;
  buscarPorId(id: string, negocioId: string): Promise<TemplateWhatsAppNegocio | null>;
  atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoTemplateWhatsAppNegocio
  ): Promise<TemplateWhatsAppNegocio | null>;
}

export interface RepositorioCampanhas {
  criar(dados: NovaCampanhaCrm): Promise<CampanhaCrm>;
  listar(negocioId: string, filtros?: FiltrosCampanhasCrm): Promise<CampanhaCrm[]>;
  buscarPorId(id: string, negocioId: string): Promise<CampanhaCrm | null>;
  atualizar(id: string, negocioId: string, dados: AtualizacaoCampanhaCrm): Promise<CampanhaCrm | null>;
  registrarItens(campanhaId: string, itens: NovoItemCampanhaCrm[]): Promise<ItemCampanhaCrm[]>;
  listarItens(campanhaId: string, negocioId: string): Promise<ItemCampanhaCrm[]>;
}

export interface RepositorioEventosOperacionais {
  registrar(dados: NovoEventoOperacional): Promise<{ evento: EventoOperacional; duplicado: boolean }>;
  listar(negocioId: string, filtros?: FiltrosEventosOperacionais): Promise<EventoOperacional[]>;
}

export interface RepositorioJobsOperacionais {
  criar(dados: NovoJobOperacional): Promise<{ job: JobOperacional; duplicado: boolean }>;
  atualizar(id: string, negocioId: string, dados: AtualizacaoJobOperacional): Promise<JobOperacional | null>;
  buscarPorId(id: string, negocioId: string): Promise<JobOperacional | null>;
  buscarPorIdempotencyKey(negocioId: string, idempotencyKey: string): Promise<JobOperacional | null>;
}

export interface RepositorioMembrosNegocio {
  listar(negocioId: string): Promise<MembroNegocioOperacional[]>;
  criar(dados: NovoMembroNegocioOperacional): Promise<MembroNegocioOperacional>;
  atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoMembroNegocioOperacional
  ): Promise<MembroNegocioOperacional | null>;
}

export interface RepositorioAfiliados {
  criarParceiro(dados: NovoParceiroComercial): Promise<ParceiroComercial>;
  listarParceiros(negocioId: string): Promise<ParceiroComercial[]>;
  buscarParceiroPorId(id: string, negocioId: string): Promise<ParceiroComercial | null>;
  criarLink(dados: NovoLinkAfiliado): Promise<LinkAfiliado>;
  listarLinks(negocioId: string): Promise<LinkAfiliado[]>;
  buscarLinkPorCodigo(codigo: string, negocioId?: string): Promise<LinkAfiliado | null>;
  criarOuAtualizarComissao(dados: NovaComissaoParceiro): Promise<ComissaoParceiro>;
  listarComissoes(negocioId: string): Promise<ComissaoParceiro[]>;
  confirmarComissaoPorPedido(
    pedidoId: string,
    negocioId: string,
    confirmadoEm?: Date
  ): Promise<ComissaoParceiro | null>;
  marcarComissaoPaga(
    id: string,
    negocioId: string,
    dados: { referenciaPagamento: string; observacao?: string | null; pagoEm?: Date; autorId?: string | null; autorNome?: string | null }
  ): Promise<ComissaoParceiro | null>;
  reverterComissaoPorPedido(
    pedidoId: string,
    negocioId: string,
    motivo: string,
    revertidoEm?: Date
  ): Promise<ComissaoParceiro | null>;
  listarHistoricoComissao(comissaoId: string, negocioId: string): Promise<HistoricoComissaoParceiro[] | null>;
  criarLotePagamentoComissoes(dados: NovoLotePagamentoComissao): Promise<LotePagamentoComissao>;
  listarLotesPagamentoComissoes(negocioId: string): Promise<LotePagamentoComissao[]>;
  atualizarEstadoParceiro(id: string, negocioId: string, estado: EstadoParceiroComercial): Promise<ParceiroComercial | null>;
  resumir(negocioId: string): Promise<ResumoAfiliadosComerciais>;
}

export interface RepositorioReservas {
  criar(dados: NovaReserva): Promise<Reserva>;
  criarComControleDeStock(dados: DadosCriacaoReservaComControleStock): Promise<{
    tipo: "RESERVA_CRIADA" | "FILA_ESPERA" | "DUPLICADA" | "PECA_INDISPONIVEL" | "REVISAO_MANUAL";
    reserva: Reserva | null;
    reservaExistente?: Reserva | null;
    peca?: Peca | null;
    motivo?: string;
  }>;
  listar(negocioId?: string | null): Promise<Reserva[]>;
  buscarPorId(id: string, negocioId?: string | null): Promise<Reserva | null>;
  buscarReservaAtivaPorTelefoneEPeca(
    telefone: string,
    codigoPeca: string,
    negocioId?: string | null
  ): Promise<Reserva | null>;
  contarReservasQueBloqueiamStock(codigoPeca: string, negocioId?: string | null): Promise<number>;
  listarFilaDaPeca(codigoPeca: string, negocioId?: string | null): Promise<Reserva[]>;
  listarReservasExpiradas(agora: Date): Promise<Reserva[]>;
  atualizarEstado(id: string, estado: EstadoReserva, expiraEm?: Date | null): Promise<Reserva>;
  atualizarEstadoPagamento(
    id: string,
    estadoPagamento: EstadoPagamento,
    comprovativoPagamentoUrl?: string | null
  ): Promise<Reserva>;
  atualizarEnderecoEntrega(id: string, enderecoEntrega: string): Promise<Reserva>;
}

export interface RepositorioAuditoria {
  registrarEventoSistema(evento: EventoSistema): Promise<void>;
  listarEventosSistema(filtros?: {
    negocioId?: string | null;
    tipo?: TipoEventoSistema;
    limite?: number;
  }): Promise<EventoSistema[]>;
  registrarMensagemWhatsApp(dados: {
    negocioId?: string | null;
    telefone: string;
    tipo: string;
    conteudo: string;
    provider: string;
    idExterno?: string | null;
    enviadaEm?: Date;
  }): Promise<void>;
  criarEventoN8n(evento: EventoSistema): Promise<RegistroOutboxEventoN8n>;
  listarEventosN8n(limite?: number): Promise<RegistroOutboxEventoN8n[]>;
  listarEventosN8nPendentes(limite: number, agora: Date): Promise<RegistroOutboxEventoN8n[]>;
  resumirEventosN8n(): Promise<ResumoOutboxEventoN8n>;
  marcarEventoN8nPublicado(id: string, publicadoEm: Date): Promise<void>;
  marcarEventoN8nFalha(id: string, erro: string, proximaTentativaEm: Date): Promise<void>;
  criarMensagemWhatsAppPendente(dados: NovoOutboxMensagemWhatsApp): Promise<RegistroOutboxMensagemWhatsApp>;
  listarMensagensWhatsApp(limite?: number, negocioId?: string | null): Promise<RegistroOutboxMensagemWhatsApp[]>;
  listarMensagensWhatsAppPendentes(
    limite: number,
    agora: Date,
    opcoes?: { incluirFalhadas?: boolean; negocioId?: string | null }
  ): Promise<RegistroOutboxMensagemWhatsApp[]>;
  marcarMensagemWhatsAppEnviada(
    id: string,
    dados: { provider: string; idExterno?: string | null; enviadaEm: Date }
  ): Promise<void>;
  marcarMensagemWhatsAppFalha(
    id: string,
    erro: string,
    proximaTentativaEm: Date,
    opcoes?: { falhaFinal?: boolean }
  ): Promise<void>;
  resumirMensagensWhatsAppOutbox(negocioId?: string | null): Promise<ResumoOutboxMensagemWhatsApp>;
  limparMensagensComunicacao(): Promise<Pick<
    ResultadoLimpezaDadosComunicacao,
    "mensagensWhatsapp" | "outboxWhatsapp"
  >>;
}

export interface RepositorioAtendimento {
  registrarMensagem(dados: NovaMensagemAtendimento): Promise<MensagemAtendimento>;
  listarConversasComMensagens(limite?: number, negocioId?: string | null): Promise<ConversaAtendimentoComMensagens[]>;
  buscarConversaComMensagensPorId(id: string, negocioId?: string | null): Promise<ConversaAtendimentoComMensagens | null>;
  atualizarConversa(
    id: string,
    dados: AtualizacaoConversaAtendimento,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null>;
  buscarMensagemPorProviderMessageId(providerMessageId: string): Promise<MensagemAtendimento | null>;
  atualizarStatusMensagemPorProviderMessageId(
    providerMessageId: string,
    dados: { status: MensagemAtendimento["status"]; erro?: string | null; atualizadoEm?: Date }
  ): Promise<MensagemAtendimento | null>;
  limparHistorico(): Promise<Pick<
    ResultadoLimpezaDadosComunicacao,
    "mensagensAtendimento" | "conversasAtendimento" | "clientesAtendimento"
  >>;
}

export interface RepositorioTarefasOperacionais {
  criar(dados: NovaTarefaOperacional): Promise<TarefaOperacional>;
  listar(negocioId: string, filtros?: FiltrosTarefasOperacionais): Promise<TarefaOperacional[]>;
  buscarPorId(id: string, negocioId: string): Promise<TarefaOperacional | null>;
  atualizar(id: string, negocioId: string, dados: AtualizacaoTarefaOperacional): Promise<TarefaOperacional | null>;
}

export interface RepositorioSocialInbox {
  criar(dados: NovoSocialInboxItem): Promise<SocialInboxItem>;
  listar(negocioId: string, filtros?: FiltrosSocialInbox): Promise<SocialInboxItem[]>;
  buscarPorId(id: string, negocioId: string): Promise<SocialInboxItem | null>;
}

export interface RepositorioPlaybooksRecuperacao {
  criar(dados: NovoPlaybookRecuperacao): Promise<PlaybookRecuperacao>;
  listar(negocioId: string, filtros?: FiltrosPlaybookRecuperacao): Promise<PlaybookRecuperacao[]>;
  buscarPorId(id: string, negocioId: string): Promise<PlaybookRecuperacao | null>;
  registrarExecucao(dados: NovaExecucaoPlaybookRecuperacao): Promise<ExecucaoPlaybookRecuperacao>;
  listarExecucoes(
    negocioId: string,
    filtros?: FiltrosExecucoesPlaybookRecuperacao
  ): Promise<ExecucaoPlaybookRecuperacao[]>;
}

export interface RepositorioFunilComercial {
  registrarMovimento(dados: NovoMovimentoFunilComercial): Promise<MovimentoFunilComercial>;
  listarMovimentos(
    negocioId: string,
    filtros?: FiltrosMovimentosFunilComercial
  ): Promise<MovimentoFunilComercial[]>;
}

export interface RepositorioOportunidadesRecuperacao {
  criar(dados: NovaOportunidadeRecuperacao): Promise<OportunidadeRecuperacao>;
  listar(negocioId: string, filtros?: FiltrosOportunidadesRecuperacao): Promise<OportunidadeRecuperacao[]>;
  buscarPorId(id: string, negocioId: string): Promise<OportunidadeRecuperacao | null>;
  atualizar(
    id: string,
    negocioId: string,
    dados: AtualizacaoOportunidadeRecuperacao
  ): Promise<OportunidadeRecuperacao | null>;
}

export interface RepositorioClientes {
  salvar(dados: DadosCliente360): Promise<Cliente360>;
  sincronizar(dados: DadosCliente360): Promise<Cliente360 | null>;
  listar(negocioId: string, filtros?: FiltrosClientes360): Promise<Cliente360[]>;
  buscarPorId(id: string, negocioId: string): Promise<Cliente360 | null>;
  buscarPorUsername(username: string, negocioId: string): Promise<Cliente360 | null>;
  atualizar(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360 | null>;
  anonimizar(id: string, negocioId: string, dados: { motivo: string; anonimizadoEm?: Date }): Promise<Cliente360 | null>;
}

export interface RepositorioCompartilhamentoClientes {
  criarRelacao(dados: NovaRelacaoNegocio): Promise<RelacaoNegocioCompartilhamento>;
  buscarRelacaoPorId(id: string): Promise<RelacaoNegocioCompartilhamento | null>;
  atualizarRelacao(id: string, dados: AtualizacaoRelacaoNegocio): Promise<RelacaoNegocioCompartilhamento | null>;
  criarCompartilhamento(dados: NovoCompartilhamentoCliente): Promise<{
    compartilhamento: CompartilhamentoClienteSeguro;
    auditoria: AuditoriaCompartilhamentoCliente[];
  }>;
  buscarCompartilhamentoPorId(id: string): Promise<CompartilhamentoClienteSeguro | null>;
  revogarCompartilhamento(
    id: string,
    dados: { atorUsuarioId?: string | null; motivo: string }
  ): Promise<{
    compartilhamento: CompartilhamentoClienteSeguro;
    auditoria: AuditoriaCompartilhamentoCliente[];
  } | null>;
  listarRecebidos(negocioDestinoId: string, agora?: Date): Promise<CompartilhamentoClienteRecebido[]>;
}

export interface RepositorioPedidos {
  criar(dados: DadosPedidoResolvido): Promise<Pedido>;
  listar(negocioId: string, filtros?: FiltrosPedidos): Promise<Pedido[]>;
  buscarPorId(id: string, negocioId: string): Promise<Pedido | null>;
  buscarPorNumeroPublico(numero: number, negocioId: string): Promise<Pedido | null>;
  buscarPorReservaId(reservaId: string, negocioId: string): Promise<Pedido | null>;
  atualizarEstado(id: string, negocioId: string, dados: AtualizacaoEstadoPedido): Promise<Pedido | null>;
  atualizarFinanceiro(id: string, negocioId: string, dados: AtualizacaoFinanceiraPedido): Promise<Pedido | null>;
  atualizarItens(id: string, negocioId: string, dados: AtualizacaoItensPedidoResolvida): Promise<Pedido | null>;
  registrarComprovativo(id: string, negocioId: string, dados: RegistroComprovativoPagamentoPedido): Promise<Pedido | null>;
  rejeitarPagamento(id: string, negocioId: string, dados: RejeicaoPagamentoPedido): Promise<Pedido | null>;
  confirmarPagamento(id: string, negocioId: string, dados: ConfirmacaoPagamentoPedido): Promise<Pedido | null>;
  atualizarEntrega(id: string, negocioId: string, dados: AtualizacaoEntregaPedido): Promise<Pedido | null>;
}

export interface RepositorioComentarios {
  criar(dados: NovoRegistroComentario): Promise<RegistroComentario>;
  listar(limite?: number, negocioId?: string | null): Promise<RegistroComentario[]>;
  buscarPorId(id: string, negocioId?: string | null): Promise<RegistroComentario | null>;
  atualizarEstado(
    id: string,
    estado: EstadoComentario,
    motivo?: string | null,
    interpretacao?: ResultadoInterpretacaoComentario | null
  ): Promise<RegistroComentario>;
  limparTodos(): Promise<number>;
}

export interface RepositorioAutenticacao {
  criarOuAtualizarUsuario(dados: {
    telefone: string;
    nome: string;
    email?: string | null;
    avatarUrl?: string | null;
    origemCadastro?: string;
  }): Promise<UsuarioSistema>;
  buscarUsuarioPorTelefone(telefone: string): Promise<UsuarioSistema | null>;
  buscarUsuarioPorId(id: string): Promise<UsuarioSistema | null>;
  criarOuAtualizarUsuarioPorIdentidade(dados: DadosIdentidadeAutenticacao): Promise<UsuarioSistema>;
  salvarPerfilEstudantil(dados: DadosPerfilEstudantil): Promise<PerfilEstudantilUsuario>;
  buscarNegocioPrincipalPorUsuario(usuarioId: string): Promise<NegocioBizy | null>;
  buscarNegocioPorUsuario(usuarioId: string, negocioId: string): Promise<NegocioBizy | null>;
  listarNegociosPorUsuario(usuarioId: string): Promise<NegocioBizy[]>;
  salvarNegocioUsuario(usuarioId: string, dados: DadosNegocioBizy): Promise<NegocioBizy>;
  atualizarContasSociaisNegocio(negocioId: string, contasSociais: Record<string, unknown>): Promise<NegocioBizy>;
  atualizarPublicacaoLoja(negocioId: string, dados: DadosPublicacaoLoja): Promise<NegocioBizy>;
  buscarNegocioPorSlugPublico(slug: string): Promise<NegocioBizy | null>;
  listarNegociosPublicados(): Promise<NegocioBizy[]>;
  listarModulosAtivosPorNegocio(negocioId: string): Promise<string[]>;
  listarModulosPorNegocio(negocioId: string): Promise<ModuloNegocioConfigurado[]>;
  salvarModuloNegocio(
    negocioId: string,
    modulo: ModuloNegocioConfigurado["modulo"],
    dados: AtualizacaoModuloNegocio
  ): Promise<ModuloNegocioConfigurado>;
  marcarUsuarioOnboardingCompleto(usuarioId: string, data: Date): Promise<UsuarioSistema>;
  criarCodigoSms(dados: {
    telefone: string;
    codigoHash: string;
    codigoFinal: string;
    expiraEm: Date;
    statusEnvio: string;
    provider: string;
    providerMessageId?: string | null;
    providerResponseJson?: string | null;
    usuarioId?: string | null;
  }): Promise<CodigoLoginSms>;
  buscarCodigoSmsValido(telefone: string, agora: Date): Promise<CodigoLoginSms | null>;
  marcarCodigoUsado(id: string, usadoEm: Date): Promise<CodigoLoginSms>;
  incrementarTentativasCodigo(id: string): Promise<CodigoLoginSms>;
  revogarCodigosAbertos(telefone: string, agora: Date): Promise<void>;
  criarSessao(dados: { tokenHash: string; usuarioId: string; expiraEm: Date }): Promise<{ id: string }>;
  buscarSessaoPorTokenHash(tokenHash: string, agora: Date): Promise<{
    id: string;
    usuario: UsuarioSistema;
  } | null>;
  tocarSessao(id: string, agora: Date): Promise<void>;
  encerrarSessao(tokenHash: string): Promise<void>;
  limparCodigosSms(): Promise<number>;
}

export interface RepositorioInstanciasWhatsApp {
  criar(dados: {
    negocioId?: string | null;
    nome: string;
    etiqueta?: string | null;
    telefone?: string | null;
    baseUrl?: string | null;
    apiKey?: string | null;
    padrao?: boolean;
  }): Promise<InstanciaWhatsApp>;
  listarAtivas(negocioId?: string | null): Promise<InstanciaWhatsApp[]>;
  buscarPorId(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp | null>;
  buscarPadrao(negocioId?: string | null): Promise<InstanciaWhatsApp | null>;
  atualizar(id: string, dados: Partial<Pick<
    InstanciaWhatsApp,
    "etiqueta" | "telefone" | "status" | "qrCode" | "pairingCode" | "baseUrl" | "apiKey" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaConsultaEm"
  >>, negocioId?: string | null): Promise<InstanciaWhatsApp>;
  definirPadrao(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp>;
  desativar(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp>;
}

export interface RepositorioInstanciasInstagram {
  criar(dados: {
    negocioId?: string | null;
    nome: string;
    username: string;
    status?: string;
    padrao?: boolean;
    ativa?: boolean;
  }): Promise<InstanciaInstagram>;
  listarAtivas(negocioId?: string | null): Promise<InstanciaInstagram[]>;
  buscarPorId(id: string, negocioId?: string | null): Promise<InstanciaInstagram | null>;
  buscarPorNome(negocioId: string, nome: string): Promise<InstanciaInstagram | null>;
  atualizar(id: string, dados: Partial<Pick<
    InstanciaInstagram,
    "username" | "status" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaPollEm"
  >>): Promise<InstanciaInstagram>;
  desativar(id: string): Promise<InstanciaInstagram>;
}

export interface RepositorioSessoesLive {
  salvar(dados: NovoRegistroSessaoLive): Promise<RegistroSessaoLive>;
  listarAtivas(): Promise<RegistroSessaoLive[]>;
  buscarPorId(id: string): Promise<RegistroSessaoLive | null>;
  atualizar(id: string, dados: AtualizacaoRegistroSessaoLive): Promise<RegistroSessaoLive>;
  encerrar(id: string, encerradaEm?: Date): Promise<RegistroSessaoLive>;
}

export interface SeguidorLoja {
  id: string;
  negocioId: string;
  identificador: string;
  tipo: string;
  origem: string;
  criadoEm: Date;
}

export interface RepositorioSeguidoresLoja {
  seguir(negocioId: string, identificador: string, tipo: string, origem: string): Promise<SeguidorLoja>;
  deixarDeSeguir(negocioId: string, identificador: string): Promise<boolean>;
  estaSeguindo(negocioId: string, identificador: string): Promise<boolean>;
  contarSeguidores(negocioId: string): Promise<number>;
  listarSeguidores(negocioId: string, filtros?: {
    limite?: number;
    offset?: number;
    origem?: string;
  }): Promise<{ seguidores: SeguidorLoja[]; total: number }>;
}

export interface RepositorioDenuncias {
  criar(dados: NovaDenunciaMarket): Promise<DenunciaMarket>;
  listar(filtros?: {
    estado?: DenunciaMarket["estado"];
    entidadeTipo?: DenunciaMarket["entidadeTipo"];
    negocioAlvoId?: string;
    limite?: number;
  }): Promise<DenunciaMarket[]>;
  buscarPorId(id: string): Promise<DenunciaMarket | null>;
  resolver(id: string, dados: ResolucaoDenuncia): Promise<DenunciaMarket | null>;
}

export interface RepositorioReservasStockCheckout {
  reservar(dados: NovaReservaStockCheckout): Promise<ReservaStockCheckout>;
  listarAtivasPorPeca(pecaId: string, negocioId: string): Promise<ReservaStockCheckout[]>;
  confirmar(id: string): Promise<ReservaStockCheckout | null>;
  liberar(id: string): Promise<ReservaStockCheckout | null>;
  liberarPorSessao(sessaoId: string): Promise<number>;
  listarExpiradas(agora: Date): Promise<ReservaStockCheckout[]>;
  liberarExpiradas(agora: Date): Promise<number>;
}

export interface RepositorioComprasUnificadas {
  criar(dados: NovaCompraUnificada, pedidosFilho: PedidoFilho[]): Promise<CompraUnificada>;
  buscarPorId(id: string): Promise<CompraUnificada | null>;
  buscarPorNumero(numero: number): Promise<CompraUnificada | null>;
  listarPedidosFilho(compraUnificadaId: string): Promise<PedidoFilho[]>;
  atualizarEstado(id: string, estado: CompraUnificada["estado"]): Promise<CompraUnificada | null>;
  atualizarEstadoPagamento(id: string, estadoPagamento: CompraUnificada["estadoPagamento"]): Promise<CompraUnificada | null>;
}

export interface RepositorioRepassesFinanceiros {
  criar(dados: NovoRepasseFinanceiro): Promise<RepasseFinanceiro>;
  listar(negocioId: string, filtros?: {
    estado?: RepasseFinanceiro["estado"];
    pedidoId?: string;
    limite?: number;
  }): Promise<RepasseFinanceiro[]>;
  buscarPorId(id: string, negocioId: string): Promise<RepasseFinanceiro | null>;
  conciliar(id: string, negocioId: string): Promise<RepasseFinanceiro | null>;
  aprovar(id: string, negocioId: string): Promise<RepasseFinanceiro | null>;
  pagar(id: string, negocioId: string, referencia: string): Promise<RepasseFinanceiro | null>;
  cancelar(id: string, negocioId: string, motivo: string): Promise<RepasseFinanceiro | null>;
}

export interface RepositorioReembolsos {
  criar(dados: NovoReembolsoPedido): Promise<ReembolsoPedido>;
  listar(negocioId: string, filtros?: {
    pedidoId?: string;
    estado?: ReembolsoPedido["estado"];
    limite?: number;
  }): Promise<ReembolsoPedido[]>;
  buscarPorId(id: string, negocioId: string): Promise<ReembolsoPedido | null>;
  aprovar(id: string, negocioId: string, aprovadoPorId: string): Promise<ReembolsoPedido | null>;
  processar(id: string, negocioId: string): Promise<ReembolsoPedido | null>;
  rejeitar(id: string, negocioId: string): Promise<ReembolsoPedido | null>;
}
