export type EstadoPeca = "DISPONIVEL" | "RESERVADA" | "VENDIDA" | "ESGOTADA";
export type EstadoReserva = "PENDING" | "RESERVED" | "WAITING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED" | "WAITLISTED";
export type EstadoIntegracao = "CONFIGURADA" | "DESATIVADA" | "PENDENTE";

export const estadosReservaAtiva: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT"];

export interface Peca {
  id: string;
  codigo: string;
  sku?: string | null;
  nome: string;
  descricao: string;
  categoria?: string | null;
  colecao?: string | null;
  precoEmKwanza: number;
  custoEmKwanza?: number | null;
  margemEstimadaEmKwanza?: number | null;
  quantidade: number;
  stockMinimo?: number;
  fotos: string[];
  variantes?: Record<string, string[]>;
  estado: EstadoPeca;
  estadoStock?: "DISPONIVEL" | "BAIXO_STOCK" | "ESGOTADO" | "ARQUIVADO";
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

export type EstadoRelacionamentoCliente =
  | "ATIVO"
  | "LEAD"
  | "VIP"
  | "INATIVO"
  | "BLOQUEADO"
  | "SEM_WHATSAPP"
  | "SEM_CONSENTIMENTO"
  | "INADIMPLENTE"
  | "PRIORIDADE_ALTA";

export interface MetricasCliente360 {
  totalReservas: number;
  reservasAtivas: number;
  reservasPagas: number;
  totalCompradoEmKwanza: number;
  totalMensagens: number;
  conversasAbertas: number;
  ultimaInteracaoEm: string | null;
}

export interface Cliente360 {
  id: string;
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
  primeiraInteracaoEm: string;
  ultimaInteracaoEm: string;
  metricas: MetricasCliente360;
}

export interface RespostaClientes360 {
  clientes: Cliente360[];
}

export interface SegmentoCliente360 {
  id: string;
  titulo: string;
  criterio: string;
  total: number;
  clientes: Array<{
    id: string;
    nome: string | null;
    telefone: string | null;
    email: string | null;
    estadoRelacionamento: EstadoRelacionamentoCliente;
    tags: string[];
    totalCompradoEmKwanza: number;
    ultimaInteracaoEm: string | null;
  }>;
}

export interface RespostaSegmentosClientes360 {
  segmentos: SegmentoCliente360[];
}

export type EstadoPedido =
  | "NOVO"
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "EM_PREPARACAO"
  | "PRONTO_ENTREGA"
  | "ENVIADO"
  | "ENTREGUE"
  | "CANCELADO"
  | "TROCADO"
  | "DEVOLVIDO";

export type EstadoPagamentoPedido = "PENDENTE" | "COMPROVATIVO_RECEBIDO" | "CONFIRMADO" | "REJEITADO" | "REEMBOLSADO";
export type EstadoEntregaPedido = "PENDENTE" | "RETIRADA_LOJA" | "EM_PREPARACAO" | "PRONTO" | "ENVIADO" | "ENTREGUE" | "FALHOU" | "DEVOLVIDO";

export interface ItemPedido {
  id: string;
  codigoPeca: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitarioEmKwanza: number;
  subtotalEmKwanza: number;
}

export interface Pedido {
  id: string;
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
  pagoEm: string | null;
  entregueEm: string | null;
  canceladoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemPedido[];
}

export interface RespostaPedidos {
  pedidos: Pedido[];
}

export interface RespostaPreparacaoPedidos {
  pedidos: Pedido[];
  produtos: Array<{
    codigoPeca: string;
    nomeProduto: string;
    quantidade: number;
    fotos: string[];
    pedidos: number[];
  }>;
}

export interface EntregaPedidoResumo {
  id: string;
  numero: number;
  estado: EstadoPedido;
  estadoEntrega: EstadoEntregaPedido;
  enderecoEntrega: string | null;
  responsavelId: string | null;
  totalEmKwanza: number;
  itens: ItemPedido[];
  criadoEm: string;
}

export interface RespostaEntregasPedidos {
  pedidos: EntregaPedidoResumo[];
}

export type PrioridadeTarefaOperacional = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
export type EstadoTarefaOperacional = "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";

export interface TarefaOperacional {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  prioridade: PrioridadeTarefaOperacional;
  estado: EstadoTarefaOperacional;
  origem: string | null;
  clienteId: string | null;
  pedidoId: string | null;
  entidadeTipo: string | null;
  entidadeId: string | null;
  clienteTelefone: string | null;
  responsavelId: string | null;
  prazoEm: string | null;
  observacao: string | null;
  contexto: Record<string, unknown>;
  concluidaEm: string | null;
  criadaEm: string;
  atualizadoEm: string;
}

export interface RespostaTarefasOperacionais {
  tarefas: TarefaOperacional[];
}

export interface SocialInboxItem {
  id: string;
  canal: string;
  provider: string;
  tipo: "COMENTARIO" | "MENSAGEM" | "MENCAO" | "AVALIACAO";
  estado: "NOVO" | "EM_ATENDIMENTO" | "CONVERTIDO" | "IGNORADO" | "ARQUIVADO";
  postId: string | null;
  postUrl: string | null;
  autorId: string | null;
  autorUsername: string | null;
  autorNome: string | null;
  autorAvatarUrl: string | null;
  texto: string;
  intencao: "COMPRA" | "DUVIDA" | "RECLAMACAO" | "ELOGIO" | "SEM_INTENCAO";
  confianca: number;
  clienteTelefone: string | null;
  clienteId: string | null;
  entidades: Record<string, unknown>;
  contexto: Record<string, unknown>;
  criadoEm: string;
  atualizadoEm: string;
}

export interface RespostaSocialInbox {
  itens: SocialInboxItem[];
}

export type EtapaFunilComercial =
  | "VISITA"
  | "PRODUTO_VISTO"
  | "WHATSAPP_CLICK"
  | "LEAD"
  | "CONVERSA"
  | "CHECKOUT"
  | "PEDIDO"
  | "PAGAMENTO_PENDENTE"
  | "PAGO"
  | "PREPARACAO"
  | "ENTREGA"
  | "ENTREGUE"
  | "POS_VENDA"
  | "RECOMPRA"
  | "PERDIDO";

export interface MovimentoFunilComercial {
  id: string;
  entidadeTipo: string;
  entidadeId: string;
  etapaAnterior: EtapaFunilComercial | null;
  etapaNova: EtapaFunilComercial;
  motivo: string;
  origem: string | null;
  autorId: string | null;
  contexto: Record<string, unknown>;
  criadoEm: string;
}

export interface RespostaFunilMovimentos {
  movimentos: MovimentoFunilComercial[];
}

export interface OportunidadeRecuperacao {
  id: string;
  gatilho: string;
  estado: "ABERTA" | "EM_ATENDIMENTO" | "RECUPERADA" | "PERDIDA" | "CANCELADA";
  entidadeTipo: string | null;
  entidadeId: string | null;
  clienteTelefone: string | null;
  tarefaId: string | null;
  valorEstimadoEmKwanza: number | null;
  motivo: string;
  responsavelId: string | null;
  observacao: string | null;
  contexto: Record<string, unknown>;
  criadaEm: string;
  atualizadaEm: string;
}

export interface RespostaOportunidadesRecuperacao {
  oportunidades: OportunidadeRecuperacao[];
}

export interface ResumoTrackingComercial {
  totalEventos: number;
  porTipo: Record<string, number>;
  porOrigem: Record<string, number>;
  porCanal: Record<string, number>;
  funil: {
    visitas: number;
    produtosVistos: number;
    cliquesWhatsApp: number;
    checkoutsIniciados: number;
    pedidosCriados: number;
    pagamentosConfirmados: number;
    comprasEntregues: number;
    leadsIdentificados: number;
    receitaAtribuidaEmKwanza: number;
    taxaCheckoutPorVisita: number;
    taxaPedidoPorCheckout: number;
    taxaWhatsAppPorProduto: number;
  };
}

export interface ResumoAfiliados {
  totalParceiros?: number;
  parceirosAtivos?: number;
  totalLinks?: number;
  totalComissoes?: number;
  comissaoEstimadaEmKwanza?: number;
  comissaoConfirmadaEmKwanza?: number;
  comissaoPagaEmKwanza?: number;
  [chave: string]: unknown;
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
