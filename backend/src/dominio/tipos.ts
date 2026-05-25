export const estadosPeca = ["DISPONIVEL", "RESERVADA", "VENDIDA", "ESGOTADA"] as const;
export type EstadoPeca = (typeof estadosPeca)[number];

export const estadosStockProduto = ["DISPONIVEL", "BAIXO_STOCK", "ESGOTADO", "ARQUIVADO"] as const;
export type EstadoStockProduto = (typeof estadosStockProduto)[number];

export const tiposMovimentoStock = [
  "ENTRADA",
  "SAIDA",
  "RESERVA",
  "CANCELAMENTO",
  "DEVOLUCAO",
  "AJUSTE",
  "CORRECAO"
] as const;
export type TipoMovimentoStock = (typeof tiposMovimentoStock)[number];

export const tiposEventoTrackingComercial = [
  "LOJA_VISITADA",
  "PRODUTO_VISTO",
  "CATALOGO_VISTO",
  "WHATSAPP_CLICK",
  "CHECKOUT_INICIADO",
  "PEDIDO_CRIADO",
  "PAGAMENTO_CONFIRMADO",
  "COMPRA_ENTREGUE"
] as const;
export type TipoEventoTrackingComercial = (typeof tiposEventoTrackingComercial)[number];

export const tiposParceiroComercial = ["AFILIADO", "CRIADOR", "REVENDEDOR"] as const;
export type TipoParceiroComercial = (typeof tiposParceiroComercial)[number];

export const estadosParceiroComercial = ["ATIVO", "PAUSADO", "BLOQUEADO"] as const;
export type EstadoParceiroComercial = (typeof estadosParceiroComercial)[number];

export const tiposComissaoParceiro = ["PERCENTUAL", "VALOR_FIXO"] as const;
export type TipoComissaoParceiro = (typeof tiposComissaoParceiro)[number];

export const statusComissaoParceiro = ["ESTIMADA", "CONFIRMADA", "PAGA", "REVERTIDA", "CANCELADA"] as const;
export type StatusComissaoParceiro = (typeof statusComissaoParceiro)[number];

export const tiposHistoricoComissaoParceiro = ["CRIADA", "ATUALIZADA", "CONFIRMADA", "PAGA", "REVERTIDA", "CANCELADA"] as const;
export type TipoHistoricoComissaoParceiro = (typeof tiposHistoricoComissaoParceiro)[number];

export const statusLotePagamentoComissao = ["PAGO", "CANCELADO"] as const;
export type StatusLotePagamentoComissao = (typeof statusLotePagamentoComissao)[number];

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
  "ORDER_CREATED",
  "ORDER_PAYMENT_CONFIRMED",
  "ORDER_CANCELLED",
  "ORDER_RETURNED",
  "ORDER_REFUNDED",
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
  "ORDER_CREATED",
  "ORDER_PAYMENT_CONFIRMED",
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
  sku: string | null;
  nome: string;
  descricao: string;
  categoria: string | null;
  colecao: string | null;
  precoEmKwanza: number;
  custoEmKwanza: number | null;
  margemEstimadaEmKwanza: number | null;
  quantidade: number;
  stockMinimo: number;
  fotos: string[];
  variantes: Record<string, string[]>;
  estado: EstadoPeca;
  estadoStock: EstadoStockProduto;
  arquivadaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaPeca {
  codigo: string;
  negocioId?: string | null;
  sku?: string | null;
  nome: string;
  descricao: string;
  categoria?: string | null;
  colecao?: string | null;
  precoEmKwanza: number;
  custoEmKwanza?: number | null;
  quantidade: number;
  stockMinimo?: number;
  fotos: string[];
  variantes?: Record<string, string[]>;
  estado?: EstadoPeca;
  arquivadaEm?: Date | null;
}

export interface AtualizarPeca {
  negocioId?: string | null;
  sku?: string | null;
  nome?: string;
  descricao?: string;
  categoria?: string | null;
  colecao?: string | null;
  precoEmKwanza?: number;
  custoEmKwanza?: number | null;
  quantidade?: number;
  stockMinimo?: number;
  fotos?: string[];
  variantes?: Record<string, string[]>;
  estado?: EstadoPeca;
  arquivadaEm?: Date | null;
}

export interface MovimentoStock {
  id: string;
  negocioId: string | null;
  pecaId: string;
  codigoPeca: string;
  tipo: TipoMovimentoStock;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo: string | null;
  responsavelId: string | null;
  origem: string | null;
  criadoEm: Date;
}

export interface NovoMovimentoStock {
  negocioId?: string | null;
  pecaId: string;
  codigoPeca: string;
  tipo: TipoMovimentoStock;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo?: string | null;
  responsavelId?: string | null;
  origem?: string | null;
}

export interface ResumoCatalogoComercial {
  total: number;
  disponiveis: number;
  baixoStock: number;
  esgotadas: number;
  arquivadas: number;
  custoTotalEmKwanza: number;
  valorPotencialEmKwanza: number;
  margemPotencialEmKwanza: number;
  categorias: Array<{ nome: string; total: number }>;
  colecoes: Array<{ nome: string; total: number }>;
}

export interface Reserva {
  id: string;
  negocioId: string | null;
  clienteNegocioId: string | null;
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
  negocioId?: string | null;
  clienteNegocioId?: string | null;
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
  negocioId?: string | null;
  clienteNegocioId?: string | null;
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
  negocioId: string | null;
  comentario: ComentarioLive;
  interpretacao: ResultadoInterpretacaoComentario | null;
  estado: EstadoComentario;
  motivo: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoRegistroComentario {
  negocioId?: string | null;
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
  negocioId: string | null;
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
  negocioId?: string | null;
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
  negocioId: string | null;
  clienteGlobalId: string | null;
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
  negocioId: string | null;
  clienteNegocioId: string | null;
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
  negocioId: string | null;
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
  negocioId?: string | null;
  clienteNegocioId?: string | null;
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

export const estadosRelacionamentoCliente = [
  "ATIVO",
  "LEAD",
  "VIP",
  "INATIVO",
  "BLOQUEADO",
  "SEM_WHATSAPP",
  "SEM_CONSENTIMENTO",
  "INADIMPLENTE",
  "PRIORIDADE_ALTA"
] as const;
export type EstadoRelacionamentoCliente = (typeof estadosRelacionamentoCliente)[number];

export interface Cliente360 {
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
  tags: string[];
  preferencias: Record<string, unknown>;
  consentimentoMarketing: boolean;
  consentimentoDados: boolean;
  estadoRelacionamento: EstadoRelacionamentoCliente;
  primeiraInteracaoEm: Date;
  ultimaInteracaoEm: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DadosCliente360 {
  negocioId: string;
  telefone?: string | null;
  email?: string | null;
  nome?: string | null;
  username?: string | null;
  userId?: string | null;
  avatarUrl?: string | null;
  origem?: string | null;
  tags?: string[];
  preferencias?: Record<string, unknown>;
  consentimentoMarketing?: boolean;
  consentimentoDados?: boolean;
  estadoRelacionamento?: EstadoRelacionamentoCliente;
  ultimaInteracaoEm?: Date;
}

export type AtualizacaoCliente360 = Partial<
  Pick<
    DadosCliente360,
    | "telefone"
    | "email"
    | "nome"
    | "username"
    | "userId"
    | "avatarUrl"
    | "origem"
    | "tags"
    | "preferencias"
    | "consentimentoMarketing"
    | "consentimentoDados"
    | "estadoRelacionamento"
  >
>;

export interface FiltrosClientes360 {
  busca?: string;
  estadoRelacionamento?: EstadoRelacionamentoCliente;
  tag?: string;
  limite?: number;
}

export interface MetricasCliente360 {
  totalReservas: number;
  reservasAtivas: number;
  reservasPagas: number;
  totalCompradoEmKwanza: number;
  totalMensagens: number;
  conversasAbertas: number;
  ultimaInteracaoEm: Date | null;
}

export interface Cliente360ComMetricas extends Cliente360 {
  metricas: MetricasCliente360;
}

export const estadosPedido = [
  "NOVO",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_PREPARACAO",
  "PRONTO_ENTREGA",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
  "TROCADO",
  "DEVOLVIDO"
] as const;
export type EstadoPedido = (typeof estadosPedido)[number];

export const estadosPagamentoPedido = [
  "PENDENTE",
  "COMPROVATIVO_RECEBIDO",
  "CONFIRMADO",
  "REJEITADO",
  "REEMBOLSADO"
] as const;
export type EstadoPagamentoPedido = (typeof estadosPagamentoPedido)[number];

export const estadosEntregaPedido = [
  "PENDENTE",
  "RETIRADA_LOJA",
  "EM_PREPARACAO",
  "PRONTO",
  "ENVIADO",
  "ENTREGUE",
  "FALHOU",
  "DEVOLVIDO"
] as const;
export type EstadoEntregaPedido = (typeof estadosEntregaPedido)[number];

export interface ItemPedido {
  id: string;
  pedidoId: string;
  pecaId: string;
  codigoPeca: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitarioEmKwanza: number;
  subtotalEmKwanza: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Pedido {
  id: string;
  negocioId: string;
  clienteNegocioId: string;
  reservaId: string | null;
  numero: number;
  estado: EstadoPedido;
  estadoPagamento: EstadoPagamentoPedido;
  estadoEntrega: EstadoEntregaPedido;
  origem: string;
  canal: string;
  subtotalEmKwanza: number;
  descontoEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  motivoDesconto: string | null;
  enderecoEntrega: string | null;
  comprovativoPagamentoUrl: string | null;
  observacao: string | null;
  responsavelId: string | null;
  pagoEm: Date | null;
  entregueEm: Date | null;
  canceladoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
  itens: ItemPedido[];
}

export interface ItemNovoPedido {
  codigoPeca: string;
  quantidade: number;
  precoUnitarioEmKwanza?: number;
}

export interface NovoPedido {
  negocioId: string;
  clienteNegocioId: string;
  reservaId?: string | null;
  itens: ItemNovoPedido[];
  origem?: string;
  canal?: string;
  descontoEmKwanza?: number;
  motivoDesconto?: string | null;
  taxaEntregaEmKwanza?: number;
  enderecoEntrega?: string | null;
  comprovativoPagamentoUrl?: string | null;
  observacao?: string | null;
  responsavelId?: string | null;
}

export interface DadosPedidoResolvido extends Omit<NovoPedido, "itens"> {
  numero?: number;
  estado?: EstadoPedido;
  estadoPagamento?: EstadoPagamentoPedido;
  estadoEntrega?: EstadoEntregaPedido;
  subtotalEmKwanza: number;
  descontoEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  itens: Array<{
    pecaId: string;
    codigoPeca: string;
    nomeProduto: string;
    quantidade: number;
    precoUnitarioEmKwanza: number;
    subtotalEmKwanza: number;
  }>;
}

export interface FiltrosPedidos {
  estado?: EstadoPedido;
  estadoPagamento?: EstadoPagamentoPedido;
  estadoEntrega?: EstadoEntregaPedido;
  clienteId?: string;
  busca?: string;
  limite?: number;
}

export interface AtualizacaoEstadoPedido {
  estado?: EstadoPedido;
  estadoPagamento?: EstadoPagamentoPedido;
  observacao?: string | null;
  responsavelId?: string | null;
}

export interface ConfirmacaoPagamentoPedido {
  comprovativoPagamentoUrl?: string | null;
  observacao?: string | null;
}

export interface AtualizacaoEntregaPedido {
  estadoEntrega: EstadoEntregaPedido;
  observacao?: string | null;
  responsavelId?: string | null;
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
  slugPublico?: string | null;
  descricaoPublica?: string | null;
  lojaPublicadaEm?: Date | null;
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
  slugPublico: string | null;
  descricaoPublica: string | null;
  lojaPublicadaEm: Date | null;
  usuarioPapel?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DadosPublicacaoLoja {
  slug: string;
  descricaoPublica?: string | null;
  publicada: boolean;
}

export interface EventoTrackingComercial {
  id: string;
  negocioId: string;
  tipo: TipoEventoTrackingComercial;
  entidadeTipo: string | null;
  entidadeId: string | null;
  slugLoja: string | null;
  codigoProduto: string | null;
  trackingId: string | null;
  origem: string | null;
  canal: string | null;
  utm: Record<string, string>;
  metadata: Record<string, unknown>;
  criadoEm: Date;
}

export interface NovoEventoTrackingComercial {
  negocioId: string;
  tipo: TipoEventoTrackingComercial;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  slugLoja?: string | null;
  codigoProduto?: string | null;
  trackingId?: string | null;
  origem?: string | null;
  canal?: string | null;
  utm?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface ResumoTrackingComercial {
  totalEventos: number;
  porTipo: Partial<Record<TipoEventoTrackingComercial, number>>;
  porOrigem: Record<string, number>;
  porCanal: Record<string, number>;
}

export interface RegraComissaoParceiro {
  tipo: TipoComissaoParceiro;
  percentual?: number;
  valorEmKwanza?: number;
}

export interface ParceiroComercial {
  id: string;
  negocioId: string;
  tipo: TipoParceiroComercial;
  codigo: string;
  nomePublico: string;
  contacto: string | null;
  estado: EstadoParceiroComercial;
  regraComissao: RegraComissaoParceiro;
  metodoPagamento: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoParceiroComercial {
  negocioId: string;
  tipo: TipoParceiroComercial;
  codigo: string;
  nomePublico: string;
  contacto?: string | null;
  estado?: EstadoParceiroComercial;
  regraComissao: RegraComissaoParceiro;
  metodoPagamento?: Record<string, unknown>;
}

export interface LinkAfiliado {
  id: string;
  negocioId: string;
  afiliadoId: string;
  codigo: string;
  destinoTipo: "LOJA" | "PRODUTO" | "CAMPANHA" | string;
  slugLoja: string | null;
  codigoProduto: string | null;
  canal: string | null;
  origemConteudo: string | null;
  ativo: boolean;
  expiraEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoLinkAfiliado {
  negocioId: string;
  afiliadoId: string;
  codigo: string;
  destinoTipo: "LOJA" | "PRODUTO" | "CAMPANHA" | string;
  slugLoja?: string | null;
  codigoProduto?: string | null;
  canal?: string | null;
  origemConteudo?: string | null;
  ativo?: boolean;
  expiraEm?: Date | null;
}

export interface ComissaoParceiro {
  id: string;
  negocioId: string;
  afiliadoId: string;
  linkId: string | null;
  pedidoId: string;
  lotePagamentoId: string | null;
  status: StatusComissaoParceiro;
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
}

export interface ItemLotePagamentoComissao {
  id: string;
  negocioId: string;
  loteId: string;
  comissaoId: string;
  afiliadoId: string;
  pedidoId: string;
  valorEmKwanza: number;
  moeda: string;
  statusAnterior: StatusComissaoParceiro;
  statusNovo: StatusComissaoParceiro;
  criadoEm: Date;
}

export interface LotePagamentoComissao {
  id: string;
  negocioId: string;
  referenciaPagamento: string;
  observacao: string | null;
  status: StatusLotePagamentoComissao;
  quantidadeComissoes: number;
  valorTotalEmKwanza: number;
  moeda: string;
  periodoInicio: Date | null;
  periodoFim: Date | null;
  autorId: string | null;
  autorNome: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  itens: ItemLotePagamentoComissao[];
}

export interface SaldoComissaoParceiro {
  afiliadoId: string;
  codigo: string;
  nomePublico: string;
  tipo: TipoParceiroComercial;
  estado: EstadoParceiroComercial;
  contacto: string | null;
  quantidadeComissoesEstimadas: number;
  quantidadeComissoesConfirmadas: number;
  quantidadeComissoesPagas: number;
  quantidadeComissoesRevertidas: number;
  comissaoEstimadaEmKwanza: number;
  comissaoConfirmadaEmKwanza: number;
  comissaoPagaEmKwanza: number;
  comissaoRevertidaEmKwanza: number;
  saldoPendenteEmKwanza: number;
  lotesPagos: number;
}

export interface ResumoSaldosComissoes {
  totais: {
    totalParceiros: number;
    comissaoEstimadaEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPagaEmKwanza: number;
    comissaoRevertidaEmKwanza: number;
    saldoPendenteEmKwanza: number;
    totalLotesPagos: number;
  };
  saldos: SaldoComissaoParceiro[];
}

export interface NovoLotePagamentoComissao {
  negocioId: string;
  comissaoIds: string[];
  referenciaPagamento: string;
  observacao?: string | null;
  periodoInicio?: Date | null;
  periodoFim?: Date | null;
  autorId?: string | null;
  autorNome?: string | null;
}

export interface NovaComissaoParceiro {
  negocioId: string;
  afiliadoId: string;
  linkId?: string | null;
  pedidoId: string;
  status?: StatusComissaoParceiro;
  baseEmKwanza: number;
  valorEmKwanza: number;
  moeda?: string;
  motivo?: string | null;
}

export interface HistoricoComissaoParceiro {
  id: string;
  negocioId: string;
  comissaoId: string;
  afiliadoId: string;
  pedidoId: string;
  tipo: TipoHistoricoComissaoParceiro;
  statusAnterior: StatusComissaoParceiro | null;
  statusNovo: StatusComissaoParceiro;
  valorEmKwanza: number;
  moeda: string;
  motivo: string | null;
  referencia: string | null;
  autorId: string | null;
  autorNome: string | null;
  metadata: Record<string, unknown>;
  criadoEm: Date;
}

export interface ResumoAfiliadosComerciais {
  totalParceiros: number;
  totalLinks: number;
  pedidosAtribuidos: number;
  comissaoEstimadaEmKwanza: number;
  comissaoConfirmadaEmKwanza: number;
  comissaoPagaEmKwanza: number;
  comissaoRevertidaEmKwanza: number;
  ranking: Array<{
    afiliadoId: string;
    codigo: string;
    nomePublico: string;
    pedidos: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPagaEmKwanza: number;
  }>;
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
  negocioId: string | null;
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
