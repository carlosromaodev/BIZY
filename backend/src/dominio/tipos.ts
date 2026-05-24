export const estadosPeca = ["DISPONIVEL", "RESERVADA", "VENDIDA", "ESGOTADA"] as const;
export type EstadoPeca = (typeof estadosPeca)[number];

export const estadosReserva = [
  "PENDING",
  "RESERVED",
  "WAITING_PAYMENT",
  "PAID",
  "EXPIRED",
  "CANCELLED",
  "WAITLISTED"
] as const;
export type EstadoReserva = (typeof estadosReserva)[number];

export const estadosComentario = ["RECEBIDO", "PROCESSADO", "REVISAO_MANUAL", "IGNORADO"] as const;
export type EstadoComentario = (typeof estadosComentario)[number];

export const fontesLive = ["tiktok", "instagram", "facebook", "youtube", "manual"] as const;
export type FonteLive = (typeof fontesLive)[number];

export const tiposEventoSistema = [
  "LIVE_CONNECTED",
  "LIVE_DISCONNECTED",
  "COMMENT_RECEIVED",
  "COMMENT_PARSED",
  "COMMENT_REVIEWED",
  "INTENT_DETECTED",
  "CUSTOMER_FOLLOWUP_REQUESTED",
  "RESERVATION_CREATED",
  "RESERVATION_EXPIRING",
  "RESERVATION_WAITLISTED",
  "RESERVATION_EXPIRED",
  "PAYMENT_PROOF_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "ORDER_READY_TO_SHIP",
  "ORDER_DELIVERED",
  "WHATSAPP_MESSAGE_RECEIVED",
  "WHATSAPP_MESSAGE_SENT",
  "WHATSAPP_MESSAGE_FAILED",
  "WHATSAPP_MESSAGE_STATUS",
  "STOCK_UPDATED"
] as const;
export type TipoEventoSistema = (typeof tiposEventoSistema)[number];

export const eventosEnviadosAoN8n = [
  "CUSTOMER_FOLLOWUP_REQUESTED",
  "RESERVATION_CREATED",
  "RESERVATION_EXPIRING",
  "RESERVATION_EXPIRED",
  "RESERVATION_WAITLISTED",
  "PAYMENT_PROOF_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "ORDER_READY_TO_SHIP",
  "ORDER_DELIVERED"
] as const satisfies readonly TipoEventoSistema[];
export type TipoEventoN8n = (typeof eventosEnviadosAoN8n)[number];

export const estadosPagamento = [
  "AGUARDANDO_COMPROVATIVO",
  "COMPROVATIVO_RECEBIDO",
  "CONFIRMADO",
  "REJEITADO"
] as const;
export type EstadoPagamento = (typeof estadosPagamento)[number];

export interface ComentarioLive {
  source: FonteLive;
  provider: string;
  liveId: string;
  username: string;
  userId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  commentText: string;
  timestamp: Date;
}

export type EstadoSessaoLive = "CONECTANDO" | "CONECTADA" | "ERRO" | "ENCERRADA";

export interface RegistroSessaoLive {
  id: string;
  username: string;
  providerNome: string;
  status: EstadoSessaoLive;
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
}

export interface NovoRegistroSessaoLive {
  id: string;
  username: string;
  providerNome: string;
  status: EstadoSessaoLive;
  ativa?: boolean;
  iniciadaEm: Date;
  encerradaEm?: Date | null;
  comentariosRecebidos?: number;
  comentariosProcessados?: number;
  comentariosComErro?: number;
  ultimoComentarioEm?: Date | null;
  ultimoErro?: string | null;
}

export type AtualizacaoRegistroSessaoLive = Partial<
  Pick<
    RegistroSessaoLive,
    | "username"
    | "providerNome"
    | "status"
    | "ativa"
    | "iniciadaEm"
    | "encerradaEm"
    | "comentariosRecebidos"
    | "comentariosProcessados"
    | "comentariosComErro"
    | "ultimoComentarioEm"
    | "ultimoErro"
  >
>;

export interface ResultadoInterpretacaoComentario {
  intent: "BUY" | "NONE";
  phone: string | null;
  productCode: string | null;
  productCodes?: string[];
  confidence: number;
  requiresManualReview: boolean;
  reasons: string[];
}

export interface Peca {
  id: string;
  codigo: string;
  negocioId: string | null;
  nome: string;
  descricao: string;
  precoEmKwanza: number;
  quantidade: number;
  fotos: string[];
  estado: EstadoPeca;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaPeca {
  codigo: string;
  negocioId?: string | null;
  nome: string;
  descricao: string;
  precoEmKwanza: number;
  quantidade: number;
  fotos: string[];
  estado?: EstadoPeca;
}

export interface AtualizarPeca {
  negocioId?: string | null;
  nome?: string;
  descricao?: string;
  precoEmKwanza?: number;
  quantidade?: number;
  fotos?: string[];
  estado?: EstadoPeca;
}

export interface Reserva {
  id: string;
  codigoPeca: string;
  telefoneCliente: string;
  nomeCliente: string;
  usernameCliente: string;
  userIdCliente: string | null;
  avatarUrlCliente: string | null;
  estado: EstadoReserva;
  estadoPagamento: EstadoPagamento;
  comentarioOriginal: string;
  liveId: string;
  expiraEm: Date | null;
  enderecoEntrega: string | null;
  comprovativoPagamentoUrl: string | null;
  criadaEm: Date;
  atualizadaEm: Date;
}

export interface NovaReserva {
  codigoPeca: string;
  telefoneCliente: string;
  nomeCliente: string;
  usernameCliente: string;
  userIdCliente?: string | null;
  avatarUrlCliente?: string | null;
  estado: EstadoReserva;
  estadoPagamento?: EstadoPagamento;
  comentarioOriginal: string;
  liveId: string;
  expiraEm: Date | null;
  enderecoEntrega?: string | null;
  comprovativoPagamentoUrl?: string | null;
}

export interface DadosCriacaoReservaComControleStock {
  codigoPeca: string;
  telefoneCliente: string;
  nomeCliente: string;
  usernameCliente: string;
  userIdCliente?: string | null;
  avatarUrlCliente?: string | null;
  comentarioOriginal: string;
  liveId: string;
  expiraEmReserva: Date;
}

export interface RegistroComentario {
  id: string;
  comentario: ComentarioLive;
  interpretacao: ResultadoInterpretacaoComentario | null;
  estado: EstadoComentario;
  motivo: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoRegistroComentario {
  comentario: ComentarioLive;
  interpretacao: ResultadoInterpretacaoComentario | null;
  estado: EstadoComentario;
  motivo?: string | null;
}

export interface EventoSistema {
  id: string;
  tipo: TipoEventoSistema;
  dados: Record<string, unknown>;
  criadoEm: Date;
}

export type StatusOutboxEventoN8n = "PENDENTE" | "PUBLICADO" | "FALHOU";

export interface RegistroOutboxEventoN8n {
  id: string;
  eventoId: string;
  tipo: TipoEventoSistema;
  payload: Record<string, unknown>;
  status: StatusOutboxEventoN8n;
  tentativas: number;
  proximaTentativaEm: Date;
  ultimoErro: string | null;
  publicadoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ResumoOutboxEventoN8n {
  total: number;
  pendentes: number;
  publicados: number;
  falhados: number;
  proximaTentativaEm: Date | null;
  ultimaFalha: string | null;
  atualizadoEm: Date | null;
}

export type StatusOutboxMensagemWhatsApp = "PENDENTE" | "ENVIADA" | "FALHOU";

export interface RegistroOutboxMensagemWhatsApp {
  id: string;
  telefone: string;
  tipo: string;
  conteudo: string;
  contexto: Record<string, unknown>;
  status: StatusOutboxMensagemWhatsApp;
  tentativas: number;
  maxTentativas: number;
  proximaTentativaEm: Date;
  ultimoErro: string | null;
  provider: string | null;
  idExterno: string | null;
  enviadaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoOutboxMensagemWhatsApp {
  telefone: string;
  tipo: string;
  conteudo: string;
  contexto?: Record<string, unknown>;
  ultimoErro?: string | null;
  maxTentativas?: number;
  proximaTentativaEm?: Date;
}

export interface ResumoOutboxMensagemWhatsApp {
  total: number;
  pendentes: number;
  enviadas: number;
  falhadas: number;
  proximaTentativaEm: Date | null;
  ultimaFalha: string | null;
  atualizadoEm: Date | null;
}

export interface ResultadoLimpezaDadosComunicacao {
  comentarios: number;
  mensagensAtendimento: number;
  conversasAtendimento: number;
  clientesAtendimento: number;
  mensagensWhatsapp: number;
  outboxWhatsapp: number;
  codigosSms: number;
}

export type DirecaoMensagemAtendimento = "INBOUND" | "OUTBOUND";
export type RemetenteMensagemAtendimento = "cliente" | "sistema" | "agente";
export type StatusMensagemAtendimento = "RECEIVED" | "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
export const estadosConversaAtendimento = [
  "NOVA",
  "ABERTA",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_PAGAMENTO",
  "AGUARDANDO_HUMANO",
  "RESOLVIDA",
  "ENCERRADA"
] as const;
export type EstadoConversaAtendimento = (typeof estadosConversaAtendimento)[number];

export const prioridadesConversaAtendimento = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;
export type PrioridadeConversaAtendimento = (typeof prioridadesConversaAtendimento)[number];

export const politicasAutomacaoAtendimento = ["AUTOMATICO", "SUGERIR_RESPOSTA", "EXIGIR_HUMANO", "BLOQUEAR_IA"] as const;
export type PoliticaAutomacaoAtendimento = (typeof politicasAutomacaoAtendimento)[number];

export interface ClienteAtendimento {
  id: string;
  telefone: string;
  nome: string | null;
  username: string | null;
  userId: string | null;
  avatarUrl: string | null;
  origem: string | null;
  tags: string[];
  consentimento: boolean;
  primeiraInteracaoEm: Date;
  ultimaInteracaoEm: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ConversaAtendimento {
  id: string;
  clienteId: string;
  telefone: string;
  canal: string;
  estado: EstadoConversaAtendimento;
  prioridade: PrioridadeConversaAtendimento;
  responsavelId: string | null;
  tags: string[];
  ultimaMensagemEm: Date | null;
  criadaEm: Date;
  atualizadoEm: Date;
}

export type AtualizacaoConversaAtendimento = Partial<
  Pick<ConversaAtendimento, "estado" | "prioridade" | "responsavelId" | "tags">
>;

export interface MensagemAtendimento {
  id: string;
  conversaId: string;
  telefone: string;
  direcao: DirecaoMensagemAtendimento;
  remetente: RemetenteMensagemAtendimento;
  canal: string;
  tipo: string;
  conteudo: string;
  provider: string | null;
  providerMessageId: string | null;
  status: StatusMensagemAtendimento;
  origem: string;
  reservaId: string | null;
  comentarioId: string | null;
  erro: string | null;
  contexto: Record<string, unknown>;
  enviadaEm: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaMensagemAtendimento {
  conversaId?: string | null;
  telefone: string;
  nomeCliente?: string | null;
  usernameCliente?: string | null;
  userIdCliente?: string | null;
  avatarUrlCliente?: string | null;
  direcao: DirecaoMensagemAtendimento;
  remetente: RemetenteMensagemAtendimento;
  canal?: string;
  tipo: string;
  conteudo: string;
  provider?: string | null;
  providerMessageId?: string | null;
  status?: StatusMensagemAtendimento;
  origem: string;
  reservaId?: string | null;
  comentarioId?: string | null;
  erro?: string | null;
  contexto?: Record<string, unknown>;
  enviadaEm?: Date;
}

export interface ConversaAtendimentoComMensagens {
  cliente: ClienteAtendimento;
  conversa: ConversaAtendimento;
  mensagens: MensagemAtendimento[];
}

export interface UsuarioSistema {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  avatarUrl: string | null;
  papel: string;
  origemCadastro: "TELEFONE" | "GMAIL" | "ESTUDANTIL" | string;
  perfilCompletoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export type TipoIdentidadeAutenticacao = "TELEFONE" | "GMAIL" | "ESTUDANTIL";

export interface DadosIdentidadeAutenticacao {
  tipo: TipoIdentidadeAutenticacao;
  provider: string;
  providerUserId: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  origemCadastro: UsuarioSistema["origemCadastro"];
  dados?: Record<string, unknown>;
}

export interface PerfilEstudantilUsuario {
  id: string;
  usuarioId: string;
  institutionCode: string;
  studentNumber: string;
  username: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  curso: string | null;
  turma: string | null;
  anoAcademico: string | null;
  avatarUrl: string | null;
  dados: Record<string, unknown>;
  sincronizadoEm: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DadosPerfilEstudantil {
  usuarioId: string;
  institutionCode: string;
  studentNumber: string;
  username?: string | null;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  curso?: string | null;
  turma?: string | null;
  anoAcademico?: string | null;
  avatarUrl?: string | null;
  dados?: Record<string, unknown>;
}

export type TipoNegocioBizy = "LOJA" | "CRIADOR" | "REVENDEDOR" | "SERVICO" | string;

export interface DadosNegocioBizy {
  nomeComercial: string;
  segmento: string;
  tipo: TipoNegocioBizy;
  nif?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  endereco?: string | null;
  moeda?: string;
  fusoHorario?: string;
  canaisVenda?: string[];
  metodosPagamento?: string[];
  entrega?: Record<string, unknown>;
  minutosReservaPadrao?: number;
}

export interface NegocioBizy extends Required<Pick<DadosNegocioBizy, "nomeComercial" | "segmento" | "tipo">> {
  id: string;
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
  canaisVenda: string[];
  metodosPagamento: string[];
  entrega: Record<string, unknown>;
  minutosReservaPadrao: number;
  usuarioPapel?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CodigoLoginSms {
  id: string;
  telefone: string;
  codigoHash: string;
  codigoFinal: string;
  expiraEm: Date;
  usadoEm: Date | null;
  tentativas: number;
  statusEnvio: string;
  provider: string;
  providerMessageId: string | null;
  providerResponseJson: string | null;
  usuarioId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface SessaoUsuario {
  id: string;
  tokenHash: string;
  usuarioId: string;
  expiraEm: Date;
  criadaEm: Date;
  ultimoUsoEm: Date | null;
}

export interface InstanciaWhatsApp {
  id: string;
  nome: string;
  etiqueta: string | null;
  telefone: string | null;
  status: string;
  qrCode: string | null;
  pairingCode: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  padrao: boolean;
  ativa: boolean;
  ultimoErro: string | null;
  ultimaConexaoEm: Date | null;
  ultimaConsultaEm: Date | null;
  criadaEm: Date;
  atualizadaEm: Date;
}

export type TipoResultadoReserva =
  | "RESERVA_CRIADA"
  | "FILA_ESPERA"
  | "DUPLICADA"
  | "PECA_INDISPONIVEL"
  | "REVISAO_MANUAL";

export interface ResultadoReserva {
  tipo: TipoResultadoReserva;
  reserva: Reserva | null;
  reservaExistente?: Reserva | null;
  peca?: Peca | null;
  motivo?: string;
}

export interface ResultadoExpiracaoReservas {
  expiradas: Reserva[];
  promovidas: Array<{ reserva: Reserva; peca: Peca }>;
}
