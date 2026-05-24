export type EstadoPeca = "DISPONIVEL" | "RESERVADA" | "VENDIDA" | "ESGOTADA";
export type EstadoReserva = "PENDING" | "RESERVED" | "WAITING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED" | "WAITLISTED";
export type EstadoIntegracao = "CONFIGURADA" | "DESATIVADA" | "PENDENTE";

export const estadosReservaAtiva: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT"];

export interface Peca {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  precoEmKwanza: number;
  quantidade: number;
  fotos: string[];
  estado: EstadoPeca;
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
  estadoPagamento: "AGUARDANDO_COMPROVATIVO" | "COMPROVATIVO_RECEBIDO" | "CONFIRMADO" | "REJEITADO";
  comentarioOriginal: string;
  liveId: string;
  expiraEm: string | null;
  criadaEm: string;
}

export interface ComentarioRecebido {
  id: string;
  estado: string;
  motivo: string | null;
  comentario: {
    username: string;
    userId: string | null;
    displayName: string;
    avatarUrl: string | null;
    commentText: string;
    timestamp: string;
  };
  interpretacao: {
    phone: string | null;
    productCode: string | null;
    confidence: number;
    requiresManualReview: boolean;
    reasons?: string[];
  } | null;
}

export interface Integracao {
  nome: string;
  estado: EstadoIntegracao;
  detalhe: string;
}

export type StatusLive = "CONECTANDO" | "CONECTADA" | "ERRO" | "ENCERRADA";

export interface LiveResumo {
  id: string;
  username: string;
  providerNome: string;
  iniciadaEm: string;
  status: StatusLive;
  comentariosRecebidos: number;
  comentariosProcessados: number;
  comentariosComErro: number;
  ultimoComentarioEm: string | null;
  ultimoErro: string | null;
}

export interface ResumoPainel {
  liveAtiva: boolean;
  lives: LiveResumo[];
  comentariosRecebidos: number;
  comentariosValidos: number;
  comentariosInvalidos: number;
  reservasCriadas: number;
  reservasPendentes: number;
  reservasPagas: number;
  filaEspera: Record<string, number>;
  pecas: Peca[];
  reservas: Reserva[];
  comentarios: ComentarioRecebido[];
  integracoes: Integracao[];
}

export interface InstanciaEvolution {
  id: string;
  nome: string;
  etiqueta: string | null;
  telefone: string | null;
  status: string;
  qrCode: string | null;
  pairingCode: string | null;
  baseUrl: string | null;
  temApiKeyPropria: boolean;
  padrao: boolean;
  ativa: boolean;
  ultimoErro: string | null;
  ultimaConexaoEm: string | null;
  ultimaConsultaEm: string | null;
  criadaEm: string;
  atualizadaEm: string;
}

export interface ResumoEvolution {
  integracao: {
    configurada: boolean;
    baseUrl: string | null;
    managerUrl: string | null;
  };
  instanciaPadraoId: string | null;
  instancias: InstanciaEvolution[];
}

export type EstadoConversa = "ativo" | "automacao" | "encerrado" | "fila" | "historico";
export type EstadoConversaCrm =
  | "NOVA"
  | "ABERTA"
  | "AGUARDANDO_CLIENTE"
  | "AGUARDANDO_PAGAMENTO"
  | "AGUARDANDO_HUMANO"
  | "RESOLVIDA"
  | "ENCERRADA";
export type PrioridadeConversa = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
export type PoliticaAutomacaoAtendimento = "AUTOMATICO" | "SUGERIR_RESPOSTA" | "EXIGIR_HUMANO" | "BLOQUEAR_IA";

export interface Conversa {
  id: string;
  conversaCrmId: string | null;
  telefone: string;
  nomeCliente: string;
  userIdCliente: string | null;
  avatarUrlCliente: string | null;
  ultimaMensagem: string;
  ultimaAtualizacao: string;
  mensagensNaoLidas: number;
  estado: EstadoConversa;
  estadoCrm: EstadoConversaCrm;
  prioridade: PrioridadeConversa;
  responsavelId: string | null;
  tags: string[];
  politicaAutomacao: PoliticaAutomacaoAtendimento;
  pecaRelacionada: string | null;
  reservaAtual: Reserva | null;
  mensagens: Mensagem[];
}

export interface Mensagem {
  id: string;
  remetente: "sistema" | "cliente" | "agente";
  conteudo: string;
  enviadaEm: string;
  origem?: string;
  reservaId?: string | null;
  tipo?: string;
  status?: "RECEIVED" | "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  provider?: string | null;
  providerMessageId?: string | null;
  erro?: string | null;
  contexto?: Record<string, unknown>;
}

export interface AgenteAutomacao {
  id: string;
  nome: string;
  descricao: string;
  estado: "ATIVA" | "PENDENTE" | "DESATIVADA";
  origem: "backend" | "n8n";
  gatilho: string;
  acaoPrincipal: string;
  canal: string;
  evidencia: string;
}

export interface WorkflowN8n {
  id: string;
  nome: string;
  estado: "PRONTO_PARA_IMPORTAR" | "PENDENTE_CONFIGURACAO";
  arquivo: string;
  webhookPath: string;
  eventos: string[];
  endpointsBackend: string[];
  guardrails: string[];
}

export interface ConfiguracaoOperacional {
  grupo: string;
  nome: string;
  valor: string;
  estado: "ATIVA" | "PENDENTE" | "DESATIVADA";
  detalhe: string;
}

export interface ResumoAutomacoes {
  geradoEm: string;
  agentes: AgenteAutomacao[];
  workflows: WorkflowN8n[];
  configuracoes: ConfiguracaoOperacional[];
  integracoes: Integracao[];
  metricas: {
    pecas: number;
    comentarios: number;
    reservas: number;
    aguardandoPagamento: number;
    revisaoManual: number;
  };
}

export interface RespostaConversas {
  conversas: Conversa[];
}

export const resumoInicial: ResumoPainel = {
  liveAtiva: false,
  lives: [],
  comentariosRecebidos: 0,
  comentariosValidos: 0,
  comentariosInvalidos: 0,
  reservasCriadas: 0,
  reservasPendentes: 0,
  reservasPagas: 0,
  filaEspera: {},
  pecas: [],
  reservas: [],
  comentarios: [],
  integracoes: []
};
