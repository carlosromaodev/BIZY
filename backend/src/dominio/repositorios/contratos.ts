import type {
  AtualizarPeca,
  AtualizacaoCliente360,
  AtualizacaoConversaAtendimento,
  AtualizacaoEntregaPedido,
  AtualizacaoEstadoPedido,
  Cliente360,
  ConfirmacaoPagamentoPedido,
  ConversaAtendimentoComMensagens,
  DadosPedidoResolvido,
  DadosCliente360,
  ComissaoParceiro,
  HistoricoComissaoParceiro,
  LotePagamentoComissao,
  NovaPeca,
  NovaComissaoParceiro,
  NovoLotePagamentoComissao,
  NovoLinkAfiliado,
  NovoParceiroComercial,
  NovaReserva,
  NovaMensagemAtendimento,
  NovaTarefaOperacional,
  NovoRegistroComentario,
  FiltrosPedidos,
  Peca,
  MensagemAtendimento,
  Pedido,
  RegistroComentario,
  Reserva,
  EstadoComentario,
  EstadoPagamento,
  EstadoPeca,
  EstadoReserva,
  EventoSistema,
  EventoTrackingComercial,
  FiltrosTarefasOperacionais,
  DadosCriacaoReservaComControleStock,
  DadosPublicacaoLoja,
  CodigoLoginSms,
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
  UsuarioSistema,
  DadosIdentidadeAutenticacao,
  DadosPerfilEstudantil,
  PerfilEstudantilUsuario,
  DadosNegocioBizy,
  FiltrosClientes360,
  MovimentoStock,
  NovoEventoTrackingComercial,
  NovoMovimentoStock,
  NegocioBizy,
  LinkAfiliado,
  ParceiroComercial,
  ResumoAfiliadosComerciais,
  ResumoTrackingComercial,
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
}

export interface RepositorioTrackingComercial {
  registrarEvento(dados: NovoEventoTrackingComercial): Promise<EventoTrackingComercial>;
  resumirEventos(negocioId: string): Promise<ResumoTrackingComercial>;
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
}

export interface RepositorioClientes {
  salvar(dados: DadosCliente360): Promise<Cliente360>;
  sincronizar(dados: DadosCliente360): Promise<Cliente360 | null>;
  listar(negocioId: string, filtros?: FiltrosClientes360): Promise<Cliente360[]>;
  buscarPorId(id: string, negocioId: string): Promise<Cliente360 | null>;
  atualizar(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360 | null>;
}

export interface RepositorioPedidos {
  criar(dados: DadosPedidoResolvido): Promise<Pedido>;
  listar(negocioId: string, filtros?: FiltrosPedidos): Promise<Pedido[]>;
  buscarPorId(id: string, negocioId: string): Promise<Pedido | null>;
  atualizarEstado(id: string, negocioId: string, dados: AtualizacaoEstadoPedido): Promise<Pedido | null>;
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
  salvarNegocioUsuario(usuarioId: string, dados: DadosNegocioBizy): Promise<NegocioBizy>;
  atualizarPublicacaoLoja(negocioId: string, dados: DadosPublicacaoLoja): Promise<NegocioBizy>;
  buscarNegocioPorSlugPublico(slug: string): Promise<NegocioBizy | null>;
  listarModulosAtivosPorNegocio(negocioId: string): Promise<string[]>;
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
  criarSessao(dados: { tokenHash: string; usuarioId: string; expiraEm: Date }): Promise<void>;
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

export interface RepositorioSessoesLive {
  salvar(dados: NovoRegistroSessaoLive): Promise<RegistroSessaoLive>;
  listarAtivas(): Promise<RegistroSessaoLive[]>;
  buscarPorId(id: string): Promise<RegistroSessaoLive | null>;
  atualizar(id: string, dados: AtualizacaoRegistroSessaoLive): Promise<RegistroSessaoLive>;
  encerrar(id: string, encerradaEm?: Date): Promise<RegistroSessaoLive>;
}
