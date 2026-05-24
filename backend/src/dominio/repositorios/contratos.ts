import type {
  AtualizarPeca,
  AtualizacaoConversaAtendimento,
  ConversaAtendimentoComMensagens,
  NovaPeca,
  NovaReserva,
  NovaMensagemAtendimento,
  NovoRegistroComentario,
  Peca,
  MensagemAtendimento,
  RegistroComentario,
  Reserva,
  EstadoComentario,
  EstadoPagamento,
  EstadoPeca,
  EstadoReserva,
  EventoSistema,
  DadosCriacaoReservaComControleStock,
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
  NegocioBizy
} from "../tipos.js";

export interface RepositorioPecas {
  criar(dados: NovaPeca): Promise<Peca>;
  listar(): Promise<Peca[]>;
  buscarPorCodigo(codigo: string): Promise<Peca | null>;
  atualizar(codigo: string, dados: AtualizarPeca): Promise<Peca>;
  atualizarEstado(codigo: string, estado: EstadoPeca): Promise<Peca>;
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
  listar(): Promise<Reserva[]>;
  buscarPorId(id: string): Promise<Reserva | null>;
  buscarReservaAtivaPorTelefoneEPeca(telefone: string, codigoPeca: string): Promise<Reserva | null>;
  contarReservasQueBloqueiamStock(codigoPeca: string): Promise<number>;
  listarFilaDaPeca(codigoPeca: string): Promise<Reserva[]>;
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
  listarMensagensWhatsApp(limite?: number): Promise<RegistroOutboxMensagemWhatsApp[]>;
  listarMensagensWhatsAppPendentes(
    limite: number,
    agora: Date,
    opcoes?: { incluirFalhadas?: boolean }
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
  resumirMensagensWhatsAppOutbox(): Promise<ResumoOutboxMensagemWhatsApp>;
  limparMensagensComunicacao(): Promise<Pick<
    ResultadoLimpezaDadosComunicacao,
    "mensagensWhatsapp" | "outboxWhatsapp"
  >>;
}

export interface RepositorioAtendimento {
  registrarMensagem(dados: NovaMensagemAtendimento): Promise<MensagemAtendimento>;
  listarConversasComMensagens(limite?: number): Promise<ConversaAtendimentoComMensagens[]>;
  buscarConversaComMensagensPorId(id: string): Promise<ConversaAtendimentoComMensagens | null>;
  atualizarConversa(id: string, dados: AtualizacaoConversaAtendimento): Promise<ConversaAtendimentoComMensagens | null>;
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

export interface RepositorioComentarios {
  criar(dados: NovoRegistroComentario): Promise<RegistroComentario>;
  listar(limite?: number): Promise<RegistroComentario[]>;
  buscarPorId(id: string): Promise<RegistroComentario | null>;
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
    nome: string;
    etiqueta?: string | null;
    telefone?: string | null;
    baseUrl?: string | null;
    apiKey?: string | null;
    padrao?: boolean;
  }): Promise<InstanciaWhatsApp>;
  listarAtivas(): Promise<InstanciaWhatsApp[]>;
  buscarPorId(id: string): Promise<InstanciaWhatsApp | null>;
  buscarPadrao(): Promise<InstanciaWhatsApp | null>;
  atualizar(id: string, dados: Partial<Pick<
    InstanciaWhatsApp,
    "etiqueta" | "telefone" | "status" | "qrCode" | "pairingCode" | "baseUrl" | "apiKey" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaConsultaEm"
  >>): Promise<InstanciaWhatsApp>;
  definirPadrao(id: string): Promise<InstanciaWhatsApp>;
  desativar(id: string): Promise<InstanciaWhatsApp>;
}

export interface RepositorioSessoesLive {
  salvar(dados: NovoRegistroSessaoLive): Promise<RegistroSessaoLive>;
  listarAtivas(): Promise<RegistroSessaoLive[]>;
  buscarPorId(id: string): Promise<RegistroSessaoLive | null>;
  atualizar(id: string, dados: AtualizacaoRegistroSessaoLive): Promise<RegistroSessaoLive>;
  encerrar(id: string, encerradaEm?: Date): Promise<RegistroSessaoLive>;
}
