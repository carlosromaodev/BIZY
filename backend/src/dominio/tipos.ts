import type { CategoriaMensagemWhatsApp } from "./provedores/ProvedorWhatsApp.js";

export const estadosPeca = ["DISPONIVEL", "RESERVADA", "VENDIDA", "ESGOTADA"] as const;
export type EstadoPeca = (typeof estadosPeca)[number];
export const selosProdutoPublico = ["DESTAQUE", "PROMOCAO", "NOVIDADE", "MAIS_VENDIDO", "REPOSICAO", "KIT", "PATROCINADO", "VERIFICADO"] as const;
export type SeloProdutoPublico = (typeof selosProdutoPublico)[number];

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

export const modosCapturaComentario = [
  "TELEFONE_CODIGO",
  "APENAS_CODIGO",
  "PECA_ATIVA",
  "LINK_QR"
] as const;
export type ModoCapturaComentario = (typeof modosCapturaComentario)[number];

export const tiposEventoSistema = [
  "LIVE_CONNECTED",
  "LIVE_DISCONNECTED",
  "LIVE_METRICS_UPDATED",
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
  "ORDER_ITEMS_UPDATED",
  "ORDER_PAYMENT_CONFIRMED",
  "ORDER_CANCELLED",
  "ORDER_RETURNED",
  "ORDER_REFUNDED",
  "ORDER_READY_TO_SHIP",
  "ORDER_DELIVERED",
  "CLIENTS_EXPORTED",
  "PRODUCTS_EXPORTED",
  "ORDERS_EXPORTED",
  "REPORTS_EXPORTED",
  "WHATSAPP_MESSAGE_RECEIVED",
  "WHATSAPP_MESSAGE_SENT",
  "WHATSAPP_MESSAGE_FAILED",
  "WHATSAPP_MESSAGE_STATUS",
  "INSTAGRAM_DM_RECEIVED",
  "INSTAGRAM_DM_SENT",
  "INSTAGRAM_DM_FAILED",
  "STOCK_UPDATED",
  "COMPRA_UNIFICADA_CRIADA",
  "COMPRA_UNIFICADA_PAGA",
  "PEDIDO_FILHO_CANCELADO",
  "REEMBOLSO_SOLICITADO",
  "REEMBOLSO_PROCESSADO",
  "REPASSE_CONCILIADO",
  "REPASSE_APROVADO",
  "REPASSE_PAGO",
  "REPASSE_CANCELADO",
  "REPASSES_RETIDOS",
  "MARKET_FULFILLMENT_CHANGED",
  "CONTA_BIZY_OTP_SOLICITADO",
  "CONTA_BIZY_AUTENTICADA",
  "FINANCAS_MOVIMENTO_CRIADO",
  "FINANCAS_FACTURA_EMITIDA",
  "FINANCAS_FACTURA_ANULADA",
  "FINANCAS_DESPESA_CRIADA",
  "FINANCAS_DESPESA_PAGA",
  "FINANCAS_CONTA_RECEBIDA",
  "FINANCAS_CONTA_PAGA",
  "FINANCAS_NOTA_CREDITO_EMITIDA",
  "FINANCAS_REEMBOLSO_REGISTADO",
  "FINANCAS_PERIODO_FECHADO"
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

export type DadosLivres = Record<string, unknown>;

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
  perfilUsuario?: DadosLivres;
  eventoBruto?: DadosLivres;
}

export interface MetricasLive {
  espectadoresAtuais?: number | null;
  picoEspectadores?: number | null;
  atualizadaEm?: Date | null;
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
  variant?: Record<string, string> | null;
  confidence: number;
  requiresManualReview: boolean;
  reasons: string[];
}

export const tiposProduto = ["FISICO", "SERVICO", "DIGITAL"] as const;
export type TipoProduto = (typeof tiposProduto)[number];

export interface Peca {
  id: string;
  codigo: string;
  negocioId: string | null;
  sku: string | null;
  nome: string;
  descricao: string;
  categoria: string | null;
  colecao: string | null;
  tipoProduto: TipoProduto;
  precoEmKwanza: number;
  custoEmKwanza: number | null;
  margemEstimadaEmKwanza: number | null;
  quantidade: number;
  stockMinimo: number;
  fotos: string[];
  variantes: Record<string, string[]>;
  vitrine: ConfiguracaoVitrineProduto;
  estado: EstadoPeca;
  estadoStock: EstadoStockProduto;
  arquivadaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ComponenteKitProduto {
  codigoPeca: string;
  quantidade: number;
}

export interface PublicacaoMarketProduto {
  publicado: boolean;
  atualizadoEm: string | null;
  origem: string | null;
}

export type VisibilidadeProduto = "market" | "loja" | "campanhas";

export interface ConfiguracaoVitrineProduto {
  selos: SeloProdutoPublico[];
  prioridade: number;
  titulo: string | null;
  descricao: string | null;
  precoPromocionalEmKwanza: number | null;
  ativaAte: Date | null;
  componentesKit: ComponenteKitProduto[];
  publicacaoMarket?: PublicacaoMarketProduto;
  visibilidade?: VisibilidadeProduto;
}

export interface NovaPeca {
  codigo: string;
  negocioId?: string | null;
  sku?: string | null;
  nome: string;
  descricao: string;
  categoria?: string | null;
  colecao?: string | null;
  tipoProduto?: TipoProduto;
  precoEmKwanza: number;
  custoEmKwanza?: number | null;
  quantidade: number;
  stockMinimo?: number;
  fotos: string[];
  variantes?: Record<string, string[]>;
  vitrine?: ConfiguracaoVitrineProduto;
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
  tipoProduto?: TipoProduto;
  precoEmKwanza?: number;
  custoEmKwanza?: number | null;
  quantidade?: number;
  stockMinimo?: number;
  fotos?: string[];
  variantes?: Record<string, string[]>;
  vitrine?: ConfiguracaoVitrineProduto;
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
  alertas: {
    baixoStockProdutos: Array<{
      codigo: string;
      nome: string;
      quantidade: number;
      stockMinimo: number;
      valorEmKwanza: number;
    }>;
    stockParado: Array<{
      codigo: string;
      nome: string;
      quantidade: number;
      valorEmKwanza: number;
      ultimaAtualizacaoEm: Date;
    }>;
    maisVendidos: Array<{
      codigo: string;
      nome: string;
      totalVendido: number;
      receitaEmKwanza: number;
    }>;
    reservadosSemPagamento: Array<{
      codigo: string;
      nome: string;
      totalReservado: number;
      valorEmKwanza: number;
    }>;
  };
}

export interface Reserva {
  id: string;
  negocioId: string | null;
  clienteNegocioId: string | null;
  codigoPeca: string;
  varianteSelecionada?: Record<string, string> | null;
  telefoneCliente: string;
  nomeCliente: string;
  usernameCliente: string;
  userIdCliente: string | null;
  avatarUrlCliente: string | null;
  estado: EstadoReserva;
  estadoPagamento: EstadoPagamento;
  comentarioOriginal: string;
  liveId: string;
  origem: string | null;
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
  varianteSelecionada?: Record<string, string> | null;
  telefoneCliente: string;
  nomeCliente: string;
  usernameCliente: string;
  userIdCliente?: string | null;
  avatarUrlCliente?: string | null;
  estado: EstadoReserva;
  estadoPagamento?: EstadoPagamento;
  comentarioOriginal: string;
  liveId: string;
  origem?: string | null;
  expiraEm: Date | null;
  enderecoEntrega?: string | null;
  comprovativoPagamentoUrl?: string | null;
}

export interface DadosCriacaoReservaComControleStock {
  negocioId?: string | null;
  clienteNegocioId?: string | null;
  codigoPeca: string;
  varianteSelecionada?: Record<string, string> | null;
  telefoneCliente: string;
  nomeCliente: string;
  usernameCliente: string;
  userIdCliente?: string | null;
  avatarUrlCliente?: string | null;
  comentarioOriginal: string;
  liveId: string;
  origem?: string | null;
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
export type EstadoSaudeOutboxWhatsApp = "OK" | "DEGRADADO" | "INDISPONIVEL";

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
  estado: EstadoSaudeOutboxWhatsApp;
  sloEntregaMs: number;
  idadePendenteMaisAntigaMs: number | null;
  maiorLatenciaEnvioMs: number | null;
  mediaLatenciaEnvioMs: number | null;
  enviosRecentesAmostrados: number;
  enviosRecentesForaSlo: number;
  pendentesForaSlo: number;
  proximaTentativaEm: Date | null;
  ultimaFalha: string | null;
  atualizadoEm: Date | null;
}

export const estadosAprovacaoTemplateWhatsApp = [
  "rascunho",
  "enviado_aprovacao",
  "aprovado",
  "rejeitado",
  "pausado",
  "substituido",
  "descontinuado"
] as const;
export type EstadoAprovacaoTemplateWhatsApp = (typeof estadosAprovacaoTemplateWhatsApp)[number];

export const providersTemplateWhatsApp = ["whatsapp_cloud_api", "evolution", "console"] as const;
export type ProviderTemplateWhatsApp = (typeof providersTemplateWhatsApp)[number];

export interface TemplateWhatsAppNegocio {
  id: string;
  negocioId: string;
  nome: string;
  categoria: CategoriaMensagemWhatsApp;
  idioma: string;
  provider: ProviderTemplateWhatsApp;
  estadoAprovacao: EstadoAprovacaoTemplateWhatsApp;
  eventosCompativeis: string[];
  variaveis: string[];
  corpo: string;
  ativo: boolean;
  versao: number;
  motivoUltimaAlteracao: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoTemplateWhatsAppNegocio {
  negocioId: string;
  nome: string;
  categoria: CategoriaMensagemWhatsApp;
  idioma?: string;
  provider?: ProviderTemplateWhatsApp;
  estadoAprovacao?: EstadoAprovacaoTemplateWhatsApp;
  eventosCompativeis?: string[];
  variaveis?: string[];
  corpo: string;
  ativo?: boolean;
  motivoUltimaAlteracao?: string | null;
}

export interface AtualizacaoTemplateWhatsAppNegocio {
  nome?: string;
  categoria?: CategoriaMensagemWhatsApp;
  idioma?: string;
  provider?: ProviderTemplateWhatsApp;
  estadoAprovacao?: EstadoAprovacaoTemplateWhatsApp;
  eventosCompativeis?: string[];
  variaveis?: string[];
  corpo?: string;
  ativo?: boolean;
  motivoUltimaAlteracao?: string | null;
}

export const estadosCampanhaCrm = ["RASCUNHO", "AGENDADA", "EM_ENVIO", "PAUSADA", "CONCLUIDA", "CANCELADA"] as const;
export type EstadoCampanhaCrm = (typeof estadosCampanhaCrm)[number];

export const statusItemCampanhaCrm = [
  "PENDENTE",
  "BLOQUEADO",
  "ENFILEIRADO",
  "ENVIADO",
  "ENTREGUE",
  "LIDO",
  "RESPONDIDO",
  "FALHOU",
  "CONVERTIDO"
] as const;
export type StatusItemCampanhaCrm = (typeof statusItemCampanhaCrm)[number];

export interface MetricasCampanhaCrm {
  selecionados: number;
  bloqueados: number;
  enfileirados: number;
  enviados: number;
  entregues: number;
  lidos: number;
  respondidos: number;
  falhados: number;
  pedidosGerados: number;
  receitaAtribuidaEmKwanza: number;
}

export interface CampanhaCrm {
  id: string;
  negocioId: string;
  nome: string;
  objetivo: string;
  canal: string;
  templateId: string;
  categoria: CategoriaMensagemWhatsApp;
  estado: EstadoCampanhaCrm;
  segmento: Record<string, unknown>;
  limiteDiario: number;
  janelaInicio: Date | null;
  janelaFim: Date | null;
  metricas: MetricasCampanhaCrm;
  criadaPorUsuarioId: string | null;
  pausadaEm: Date | null;
  motivoPausa: string | null;
  confirmadaEm: Date | null;
  criadaEm: Date;
  atualizadaEm: Date;
}

export interface ItemCampanhaCrm {
  id: string;
  negocioId: string;
  campanhaId: string;
  clienteId: string | null;
  telefone: string | null;
  nomeCliente: string | null;
  status: StatusItemCampanhaCrm;
  motivoBloqueio: string | null;
  outboxMensagemId: string | null;
  contexto: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaCampanhaCrm {
  negocioId: string;
  nome: string;
  objetivo: string;
  canal: string;
  templateId: string;
  categoria: CategoriaMensagemWhatsApp;
  segmento?: Record<string, unknown>;
  limiteDiario?: number;
  janelaInicio?: Date | null;
  janelaFim?: Date | null;
  criadaPorUsuarioId?: string | null;
}

export interface AtualizacaoCampanhaCrm {
  estado?: EstadoCampanhaCrm;
  metricas?: MetricasCampanhaCrm;
  pausadaEm?: Date | null;
  motivoPausa?: string | null;
  confirmadaEm?: Date | null;
}

export interface NovoItemCampanhaCrm {
  negocioId: string;
  campanhaId: string;
  clienteId?: string | null;
  telefone?: string | null;
  nomeCliente?: string | null;
  status: StatusItemCampanhaCrm;
  motivoBloqueio?: string | null;
  outboxMensagemId?: string | null;
  contexto?: Record<string, unknown>;
}

export interface FiltrosCampanhasCrm {
  estado?: EstadoCampanhaCrm;
  canal?: string;
  limite?: number;
}

export const estadosJobOperacional = ["PENDENTE", "PROCESSANDO", "CONCLUIDO", "FALHOU"] as const;
export type EstadoJobOperacional = (typeof estadosJobOperacional)[number];

export interface JobOperacional {
  id: string;
  negocioId: string;
  tipo: string;
  estado: EstadoJobOperacional;
  idempotencyKey: string | null;
  total: number;
  processados: number;
  erros: number;
  resultado: Record<string, unknown>;
  erro: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  concluidoEm: Date | null;
}

export interface NovoJobOperacional {
  negocioId: string;
  tipo: string;
  estado?: EstadoJobOperacional;
  idempotencyKey?: string | null;
  total?: number;
  processados?: number;
  erros?: number;
  resultado?: Record<string, unknown>;
  erro?: string | null;
  concluidoEm?: Date | null;
}

export interface AtualizacaoJobOperacional {
  estado?: EstadoJobOperacional;
  total?: number;
  processados?: number;
  erros?: number;
  resultado?: Record<string, unknown>;
  erro?: string | null;
  concluidoEm?: Date | null;
}

export const estadosEventoOperacional = ["PENDENTE", "PROCESSADO", "IGNORADO", "FALHOU"] as const;
export type EstadoEventoOperacional = (typeof estadosEventoOperacional)[number];

export interface EventoOperacional {
  id: string;
  negocioId: string;
  topico: string;
  tipo: string;
  entidadeTipo: string | null;
  entidadeId: string | null;
  idempotencyKey: string | null;
  payloadVersion: string;
  payload: Record<string, unknown>;
  estado: EstadoEventoOperacional;
  tentativas: number;
  proximaTentativaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoEventoOperacional {
  negocioId: string;
  topico: string;
  tipo: string;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  idempotencyKey?: string | null;
  payloadVersion?: string;
  payload?: Record<string, unknown>;
  estado?: EstadoEventoOperacional;
  proximaTentativaEm?: Date | null;
}

export interface FiltrosEventosOperacionais {
  topico?: string;
  tipo?: string;
  entidadeTipo?: string;
  entidadeId?: string;
  estado?: EstadoEventoOperacional;
  limite?: number;
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

export const estadosTarefaOperacional = ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] as const;
export type EstadoTarefaOperacional = (typeof estadosTarefaOperacional)[number];

export const prioridadesTarefaOperacional = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;
export type PrioridadeTarefaOperacional = (typeof prioridadesTarefaOperacional)[number];

export interface TarefaOperacional {
  id: string;
  negocioId: string | null;
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
  prazoEm: Date | null;
  observacao: string | null;
  contexto: Record<string, unknown>;
  concluidaEm: Date | null;
  criadaEm: Date;
  atualizadoEm: Date;
}

export interface NovaTarefaOperacional {
  negocioId?: string | null;
  tipo: string;
  titulo: string;
  descricao: string;
  prioridade?: PrioridadeTarefaOperacional;
  estado?: EstadoTarefaOperacional;
  origem?: string | null;
  clienteId?: string | null;
  pedidoId?: string | null;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  clienteTelefone?: string | null;
  responsavelId?: string | null;
  prazoEm?: Date | null;
  observacao?: string | null;
  contexto?: Record<string, unknown>;
}

export interface AtualizacaoTarefaOperacional {
  tipo?: string;
  titulo?: string;
  descricao?: string;
  prioridade?: PrioridadeTarefaOperacional;
  estado?: EstadoTarefaOperacional;
  origem?: string | null;
  clienteId?: string | null;
  pedidoId?: string | null;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  clienteTelefone?: string | null;
  responsavelId?: string | null;
  prazoEm?: Date | null;
  observacao?: string | null;
  contexto?: Record<string, unknown>;
}

export interface FiltrosTarefasOperacionais {
  tipo?: string;
  estado?: EstadoTarefaOperacional;
  responsavelId?: string | null;
  limite?: number;
}

export const tiposSocialInbox = ["COMENTARIO", "MENSAGEM", "MENCAO", "AVALIACAO"] as const;
export type TipoSocialInbox = (typeof tiposSocialInbox)[number];

export const estadosSocialInbox = ["NOVO", "EM_ATENDIMENTO", "CONVERTIDO", "IGNORADO", "ARQUIVADO"] as const;
export type EstadoSocialInbox = (typeof estadosSocialInbox)[number];

export const intencoesSocialInbox = [
  "COMPRA",
  "PRECO",
  "DISPONIBILIDADE",
  "TAMANHO_COR",
  "ENTREGA",
  "LEAD_QUENTE",
  "LEAD_FRIO",
  "SPAM",
  "DUVIDA",
  "RECLAMACAO",
  "ELOGIO",
  "SEM_INTENCAO"
] as const;
export type IntencaoSocialInbox = (typeof intencoesSocialInbox)[number];

export interface SocialInboxItem {
  id: string;
  negocioId: string;
  canal: string;
  provider: string;
  tipo: TipoSocialInbox;
  estado: EstadoSocialInbox;
  postId: string | null;
  postUrl: string | null;
  autorId: string | null;
  autorUsername: string | null;
  autorNome: string | null;
  autorAvatarUrl: string | null;
  texto: string;
  intencao: IntencaoSocialInbox;
  confianca: number;
  clienteTelefone: string | null;
  clienteId: string | null;
  entidades: Record<string, unknown>;
  contexto: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoSocialInboxItem {
  negocioId: string;
  canal: string;
  provider: string;
  tipo: TipoSocialInbox;
  estado?: EstadoSocialInbox;
  postId?: string | null;
  postUrl?: string | null;
  autorId?: string | null;
  autorUsername?: string | null;
  autorNome?: string | null;
  autorAvatarUrl?: string | null;
  texto: string;
  intencao?: IntencaoSocialInbox;
  confianca?: number;
  clienteTelefone?: string | null;
  clienteId?: string | null;
  entidades?: Record<string, unknown>;
  contexto?: Record<string, unknown>;
}

export interface FiltrosSocialInbox {
  canal?: string;
  provider?: string;
  postId?: string;
  estado?: EstadoSocialInbox;
  intencao?: IntencaoSocialInbox;
  autorUsername?: string;
  clienteTelefone?: string;
  campanhaId?: string;
  produtoCodigo?: string;
  responsavelId?: string;
  urgencia?: PrioridadeTarefaOperacional;
  respondido?: boolean;
  limite?: number;
}

export const gatilhosPlaybookRecuperacao = [
  "CARRINHO_ABANDONADO",
  "PAGAMENTO_PENDENTE",
  "RESERVA_EXPIRADA",
  "CLIENTE_INATIVO",
  "POS_VENDA",
  "REPOSICAO_PRODUTO",
  "SOCIAL_LEAD"
] as const;
export type GatilhoPlaybookRecuperacao = (typeof gatilhosPlaybookRecuperacao)[number];

export const acoesPlaybookRecuperacao = ["CRIAR_TAREFA"] as const;
export type AcaoPlaybookRecuperacao = (typeof acoesPlaybookRecuperacao)[number];

export const estadosExecucaoPlaybookRecuperacao = ["EXECUTADA", "IGNORADA", "FALHOU"] as const;
export type EstadoExecucaoPlaybookRecuperacao = (typeof estadosExecucaoPlaybookRecuperacao)[number];

export interface PlaybookRecuperacao {
  id: string;
  negocioId: string;
  nome: string;
  gatilho: GatilhoPlaybookRecuperacao;
  ativo: boolean;
  atrasoMinutos: number;
  condicoes: Record<string, unknown>;
  acao: AcaoPlaybookRecuperacao;
  tituloTarefa: string | null;
  descricaoTarefa: string | null;
  prioridadeTarefa: PrioridadeTarefaOperacional;
  responsavelId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoPlaybookRecuperacao {
  negocioId: string;
  nome: string;
  gatilho: GatilhoPlaybookRecuperacao;
  ativo?: boolean;
  atrasoMinutos?: number;
  condicoes?: Record<string, unknown>;
  acao?: AcaoPlaybookRecuperacao;
  tituloTarefa?: string | null;
  descricaoTarefa?: string | null;
  prioridadeTarefa?: PrioridadeTarefaOperacional;
  responsavelId?: string | null;
}

export interface FiltrosPlaybookRecuperacao {
  gatilho?: GatilhoPlaybookRecuperacao;
  ativo?: boolean;
  limite?: number;
}

export interface ExecucaoPlaybookRecuperacao {
  id: string;
  negocioId: string;
  playbookId: string;
  gatilho: GatilhoPlaybookRecuperacao;
  entidadeTipo: string | null;
  entidadeId: string | null;
  clienteTelefone: string | null;
  estado: EstadoExecucaoPlaybookRecuperacao;
  tarefaId: string | null;
  motivo: string | null;
  contexto: Record<string, unknown>;
  criadaEm: Date;
}

export interface NovaExecucaoPlaybookRecuperacao {
  negocioId: string;
  playbookId: string;
  gatilho: GatilhoPlaybookRecuperacao;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  clienteTelefone?: string | null;
  estado: EstadoExecucaoPlaybookRecuperacao;
  tarefaId?: string | null;
  motivo?: string | null;
  contexto?: Record<string, unknown>;
}

export interface FiltrosExecucoesPlaybookRecuperacao {
  gatilho?: GatilhoPlaybookRecuperacao;
  estado?: EstadoExecucaoPlaybookRecuperacao;
  entidadeTipo?: string;
  entidadeId?: string;
  limite?: number;
}

export const etapasFunilComercial = [
  "VISITA",
  "PRODUTO_VISTO",
  "WHATSAPP_CLICK",
  "LEAD",
  "CONVERSA",
  "CHECKOUT",
  "PEDIDO",
  "PAGAMENTO_PENDENTE",
  "PAGO",
  "PREPARACAO",
  "ENTREGA",
  "ENTREGUE",
  "POS_VENDA",
  "RECOMPRA",
  "PERDIDO"
] as const;
export type EtapaFunilComercial = (typeof etapasFunilComercial)[number];

export interface MovimentoFunilComercial {
  id: string;
  negocioId: string;
  entidadeTipo: string;
  entidadeId: string;
  etapaAnterior: EtapaFunilComercial | null;
  etapaNova: EtapaFunilComercial;
  motivo: string;
  origem: string | null;
  autorId: string | null;
  contexto: Record<string, unknown>;
  criadoEm: Date;
}

export interface NovoMovimentoFunilComercial {
  negocioId: string;
  entidadeTipo: string;
  entidadeId: string;
  etapaAnterior?: EtapaFunilComercial | null;
  etapaNova: EtapaFunilComercial;
  motivo: string;
  origem?: string | null;
  autorId?: string | null;
  contexto?: Record<string, unknown>;
}

export interface FiltrosMovimentosFunilComercial {
  entidadeTipo?: string;
  entidadeId?: string;
  etapaNova?: EtapaFunilComercial;
  origem?: string;
  limite?: number;
}

export const estadosOportunidadeRecuperacao = [
  "ABERTA",
  "EM_ATENDIMENTO",
  "RECUPERADA",
  "PERDIDA",
  "CANCELADA"
] as const;
export type EstadoOportunidadeRecuperacao = (typeof estadosOportunidadeRecuperacao)[number];

export interface OportunidadeRecuperacao {
  id: string;
  negocioId: string;
  gatilho: GatilhoPlaybookRecuperacao;
  estado: EstadoOportunidadeRecuperacao;
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
  contexto: Record<string, unknown>;
  criadaEm: Date;
  atualizadaEm: Date;
  encerradaEm: Date | null;
}

export interface NovaOportunidadeRecuperacao {
  negocioId: string;
  gatilho: GatilhoPlaybookRecuperacao;
  estado?: EstadoOportunidadeRecuperacao;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  clienteTelefone?: string | null;
  playbookId?: string | null;
  execucaoPlaybookId?: string | null;
  tarefaId?: string | null;
  movimentoFunilId?: string | null;
  valorEstimadoEmKwanza?: number | null;
  motivo: string;
  responsavelId?: string | null;
  observacao?: string | null;
  contexto?: Record<string, unknown>;
}

export interface AtualizacaoOportunidadeRecuperacao {
  estado?: EstadoOportunidadeRecuperacao;
  responsavelId?: string | null;
  observacao?: string | null;
  contexto?: Record<string, unknown>;
}

export interface FiltrosOportunidadesRecuperacao {
  gatilho?: GatilhoPlaybookRecuperacao;
  estado?: EstadoOportunidadeRecuperacao;
  entidadeTipo?: string;
  entidadeId?: string;
  responsavelId?: string | null;
  limite?: number;
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
  perfil360: Record<string, unknown>;
  identidadesDigitais: Record<string, unknown>;
  fontesDados: Record<string, unknown>;
  perfilComercial: Record<string, unknown>;
  sinaisRelacionamento: Record<string, unknown>;
  dadosCaptura: Record<string, unknown>;
  ultimoEnriquecimentoEm: Date | null;
  consentimentoMarketing: boolean;
  consentimentoDados: boolean;
  estadoRelacionamento: EstadoRelacionamentoCliente;
  primeiraInteracaoEm: Date;
  ultimaInteracaoEm: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface EnderecoCliente {
  id: string;
  rotulo: string | null;
  endereco: string;
  bairro: string | null;
  municipio: string | null;
  referencia: string | null;
  principal: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoEnderecoCliente {
  rotulo?: string | null;
  endereco: string;
  bairro?: string | null;
  municipio?: string | null;
  referencia?: string | null;
  principal?: boolean;
}

export const tiposRelacaoNegocio = ["PARCERIA_DADOS", "OPERACAO_CONJUNTA", "AFILIACAO", "ENTREGA"] as const;
export type TipoRelacaoNegocio = (typeof tiposRelacaoNegocio)[number];

export const estadosRelacaoNegocio = ["PENDENTE", "APROVADA", "REJEITADA", "REVOGADA"] as const;
export type EstadoRelacaoNegocio = (typeof estadosRelacaoNegocio)[number];

export const statusCompartilhamentoCliente = ["PENDENTE", "ATIVO", "REVOGADO", "EXPIRADO"] as const;
export type StatusCompartilhamentoCliente = (typeof statusCompartilhamentoCliente)[number];

export interface RelacaoNegocioCompartilhamento {
  id: string;
  negocioOrigemId: string;
  negocioDestinoId: string;
  tipo: TipoRelacaoNegocio;
  estado: EstadoRelacaoNegocio;
  escopo: Record<string, unknown>;
  criadoPorUsuarioId: string | null;
  aprovadoEm: Date | null;
  expiraEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaRelacaoNegocio {
  negocioOrigemId: string;
  negocioDestinoId: string;
  tipo: TipoRelacaoNegocio;
  escopo?: Record<string, unknown>;
  criadoPorUsuarioId?: string | null;
  expiraEm?: Date | null;
}

export interface AtualizacaoRelacaoNegocio {
  estado: EstadoRelacaoNegocio;
  atorUsuarioId?: string | null;
}

export interface CompartilhamentoClienteSeguro {
  id: string;
  relacaoId: string | null;
  clienteGlobalId: string;
  clienteNegocioOrigemId: string | null;
  negocioOrigemId: string;
  negocioDestinoId: string;
  escopo: Record<string, unknown>;
  motivo: string;
  baseLegal: string;
  consentimentoCliente: boolean;
  status: StatusCompartilhamentoCliente;
  aprovadoPorUsuarioId: string | null;
  expiraEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoCompartilhamentoCliente {
  relacaoId?: string | null;
  cliente: Cliente360;
  negocioOrigemId: string;
  negocioDestinoId: string;
  escopo?: Record<string, unknown>;
  motivo: string;
  baseLegal: string;
  consentimentoCliente: boolean;
  atorUsuarioId?: string | null;
  expiraEm?: Date | null;
}

export interface AuditoriaCompartilhamentoCliente {
  id: string;
  compartilhamentoId: string;
  atorUsuarioId: string | null;
  acao: string;
  dados: Record<string, unknown>;
  criadoEm: Date;
}

export interface CompartilhamentoClienteRecebido extends CompartilhamentoClienteSeguro {
  cliente: Record<string, unknown>;
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
  perfil360?: Record<string, unknown>;
  identidadesDigitais?: Record<string, unknown>;
  fontesDados?: Record<string, unknown>;
  perfilComercial?: Record<string, unknown>;
  sinaisRelacionamento?: Record<string, unknown>;
  dadosCaptura?: Record<string, unknown>;
  ultimoEnriquecimentoEm?: Date | null;
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
    | "perfil360"
    | "identidadesDigitais"
    | "fontesDados"
    | "perfilComercial"
    | "sinaisRelacionamento"
    | "dadosCaptura"
    | "ultimoEnriquecimentoEm"
    | "consentimentoMarketing"
    | "consentimentoDados"
    | "estadoRelacionamento"
  >
>;

export interface FiltrosClientes360 {
  busca?: string;
  estadoRelacionamento?: EstadoRelacionamentoCliente;
  tag?: string;
  consentimentoMarketing?: boolean;
  limite?: number;
  offset?: number;
}

export interface PaginacaoOffset {
  total: number;
  limite: number;
  offset: number;
  temProxima: boolean;
  temAnterior: boolean;
  proximoOffset: number | null;
  anteriorOffset: number | null;
}

export interface MetricasCliente360 {
  totalReservas: number;
  reservasAtivas: number;
  reservasPagas: number;
  reservasExpiradas: number;
  pedidosPagos: number;
  pedidosCancelados: number;
  pedidosPagamentoPendente: number;
  totalComprasPagas: number;
  totalCompradoEmKwanza: number;
  tempoMedioPagamentoEmMinutos: number | null;
  ultimaCompraEm: Date | null;
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
  varianteSelecionada?: Record<string, string> | null;
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
  ivaPercentual: number;
  ivaEmKwanza: number;
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
  varianteSelecionada?: Record<string, string> | null;
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
  enderecoEntregaId?: string | null;
  comprovativoPagamentoUrl?: string | null;
  observacao?: string | null;
  responsavelId?: string | null;
  podeAprovarDesconto?: boolean;
  limiteDescontoSemAprovacaoPercentual?: number;
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
  ivaPercentual?: number;
  ivaEmKwanza?: number;
  itens: Array<{
    pecaId: string;
    codigoPeca: string;
    nomeProduto: string;
    varianteSelecionada?: Record<string, string> | null;
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
  produto?: string;
  canal?: string;
  origem?: string;
  dataInicio?: Date;
  dataFim?: Date;
  limite?: number;
  offset?: number;
}

export interface AtualizacaoEstadoPedido {
  estado?: EstadoPedido;
  estadoPagamento?: EstadoPagamentoPedido;
  observacao?: string | null;
  responsavelId?: string | null;
}

export interface AtualizacaoFinanceiraPedido {
  descontoEmKwanza?: number;
  motivoDesconto?: string | null;
  totalEmKwanza?: number;
  observacao?: string | null;
}

export interface AtualizacaoItensPedido {
  itens: ItemNovoPedido[];
  observacao?: string | null;
}

export interface AtualizacaoItensPedidoResolvida {
  itens: DadosPedidoResolvido["itens"];
  subtotalEmKwanza: number;
  totalEmKwanza: number;
  observacao?: string | null;
}

export interface ConfirmacaoPagamentoPedido {
  comprovativoPagamentoUrl?: string | null;
  metodoPagamento?: string | null;
  referenciaPagamento?: string | null;
  observacao?: string | null;
}

export interface RegistroComprovativoPagamentoPedido {
  comprovativoPagamentoUrl?: string | null;
  observacao?: string | null;
}

export interface RejeicaoPagamentoPedido {
  motivo: string;
}

export interface ReciboPedido {
  id: string;
  pedidoId: string;
  numero: number;
  negocioId: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string | null;
    email: string | null;
  } | null;
  itens: ItemPedido[];
  subtotalEmKwanza: number;
  descontoEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  estado: EstadoPedido;
  estadoPagamento: EstadoPagamentoPedido;
  estadoEntrega: EstadoEntregaPedido;
  comprovativoPagamentoUrl: string | null;
  observacao: string | null;
  pagoEm: Date | null;
  emitidoEm: Date;
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

export const papeisNegocio = ["DONO", "ADMIN", "VENDEDOR", "ATENDENTE", "FINANCEIRO", "ENTREGADOR", "AFILIADO", "CRIADOR"] as const;
export type PapelNegocio = (typeof papeisNegocio)[number];

export const statusMembroNegocio = ["ATIVO", "SUSPENSO", "REMOVIDO"] as const;
export type StatusMembroNegocio = (typeof statusMembroNegocio)[number];

export interface MembroNegocioOperacional {
  id: string;
  negocioId: string;
  usuarioId: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  avatarUrl: string | null;
  papel: PapelNegocio;
  status: StatusMembroNegocio;
  permissoes: string[];
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface FiltrosMembrosNegocio {
  limite?: number;
  offset?: number;
  status?: StatusMembroNegocio;
  busca?: string;
}

export interface NovoMembroNegocioOperacional {
  negocioId: string;
  telefone: string;
  nome: string;
  email?: string | null;
  papel: PapelNegocio;
  permissoes?: string[];
}

export interface AtualizacaoMembroNegocioOperacional {
  papel?: PapelNegocio;
  status?: StatusMembroNegocio;
  permissoes?: string[];
  motivo?: string | null;
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

export const modulosNegocioDisponiveis = [
  "team-core",
  "catalogo",
  "conversas",
  "reservas",
  "pedidos",
  "whatsapp",
  "instagram",
  "loja-publica",
  "afiliados",
  "tracking",
  "social-inbox",
  "automacoes",
  "funil",
  "campanhas",
  "relatorios",
  "entregas",
  "stock",
  "checkout",
  "catalogo-digital",
  "market",
  "learning"
] as const;
export type ModuloNegocioCodigo = (typeof modulosNegocioDisponiveis)[number];

export const modulosNegocioPadrao: ModuloNegocioCodigo[] = [
  "team-core",
  "catalogo",
  "conversas",
  "reservas",
  "pedidos",
  "whatsapp",
  "instagram",
  "relatorios",
  "entregas",
  "stock",
  "loja-publica",
  "tracking"
];

export const modulosNegocioObrigatorios: ModuloNegocioCodigo[] = ["team-core"];
export const modulosNegocioLegados = ["crm"] as const;
export type CategoriaModuloNegocio = "NUCLEO" | "VENDA" | "OPERACAO" | "CRESCIMENTO" | "AUTOMACAO" | "DADOS";

export function normalizarModuloNegocio(modulo: string): ModuloNegocioCodigo {
  const normalizado = modulo.trim().toLowerCase();
  if (normalizado === "crm") return "team-core";
  if ((modulosNegocioDisponiveis as readonly string[]).includes(normalizado)) {
    return normalizado as ModuloNegocioCodigo;
  }
  return normalizado as ModuloNegocioCodigo;
}

export function modulosNegocioSaoEquivalentes(a: string, b: string): boolean {
  return normalizarModuloNegocio(a) === normalizarModuloNegocio(b);
}

export interface DefinicaoModuloNegocio {
  modulo: ModuloNegocioCodigo;
  nome: string;
  descricao: string;
  categoria: CategoriaModuloNegocio;
  obrigatorio: boolean;
}

export const catalogoModulosNegocio: DefinicaoModuloNegocio[] = [
  {
    modulo: "team-core",
    nome: "BIZY Team Core",
    descricao: "Clientes, tarefas e operação comercial mínima do negócio.",
    categoria: "NUCLEO",
    obrigatorio: true
  },
  {
    modulo: "catalogo",
    nome: "Produtos e stock",
    descricao: "Cadastro, disponibilidade e gestão operacional de produtos.",
    categoria: "VENDA",
    obrigatorio: false
  },
  {
    modulo: "conversas",
    nome: "Conversas",
    descricao: "Atendimento por WhatsApp, comentários e eventos comerciais.",
    categoria: "OPERACAO",
    obrigatorio: false
  },
  {
    modulo: "reservas",
    nome: "Reservas",
    descricao: "Bloqueio temporário de produtos em live, conversa ou checkout.",
    categoria: "VENDA",
    obrigatorio: false
  },
  {
    modulo: "pedidos",
    nome: "Pedidos",
    descricao: "Pedidos completos, pagamento, entrega e histórico comercial.",
    categoria: "VENDA",
    obrigatorio: false
  },
  {
    modulo: "whatsapp",
    nome: "WhatsApp",
    descricao: "Envio, templates, outbox e política oficial de mensagens.",
    categoria: "OPERACAO",
    obrigatorio: false
  },
  {
    modulo: "loja-publica",
    nome: "Loja virtual",
    descricao: "Página pública por slug, produto público e checkout.",
    categoria: "VENDA",
    obrigatorio: false
  },
  {
    modulo: "afiliados",
    nome: "Afiliados e criadores",
    descricao: "Parceiros, links rastreáveis, comissões e saldos.",
    categoria: "CRESCIMENTO",
    obrigatorio: false
  },
  {
    modulo: "tracking",
    nome: "Tracking comercial",
    descricao: "Eventos de visita, produto visto, clique WhatsApp e atribuição.",
    categoria: "DADOS",
    obrigatorio: false
  },
  {
    modulo: "social-inbox",
    nome: "Social Inbox",
    descricao: "Comentários sociais, intenção de compra e tarefas humanas.",
    categoria: "CRESCIMENTO",
    obrigatorio: false
  },
  {
    modulo: "automacoes",
    nome: "Automações",
    descricao: "Playbooks, recuperação comercial e tarefas automáticas seguras.",
    categoria: "AUTOMACAO",
    obrigatorio: false
  },
  {
    modulo: "funil",
    nome: "Funil comercial",
    descricao: "Histórico de etapa por cliente, pedido, conversa ou lead.",
    categoria: "DADOS",
    obrigatorio: false
  },
  {
    modulo: "campanhas",
    nome: "Campanhas",
    descricao: "Segmentos, templates aprovados, limites e resultados.",
    categoria: "CRESCIMENTO",
    obrigatorio: false
  },
  {
    modulo: "relatorios",
    nome: "Relatórios",
    descricao: "Indicadores de venda, atendimento, produto e campanha.",
    categoria: "DADOS",
    obrigatorio: false
  },
  {
    modulo: "entregas",
    nome: "Entregas",
    descricao: "Separação, rota, estado de entrega e responsáveis.",
    categoria: "OPERACAO",
    obrigatorio: false
  },
  {
    modulo: "learning",
    nome: "Bizy Learning",
    descricao: "Academia, comunidade, cohorts e certificações administradas pelo Team.",
    categoria: "CRESCIMENTO",
    obrigatorio: false
  },
  {
    modulo: "stock",
    nome: "Stock avançado",
    descricao: "Movimentos, alertas, reposição e produtos em risco.",
    categoria: "OPERACAO",
    obrigatorio: false
  },
  {
    modulo: "checkout",
    nome: "Checkout",
    descricao: "Cálculo de entrega, total e origem antes da compra.",
    categoria: "VENDA",
    obrigatorio: false
  },
  {
    modulo: "catalogo-digital",
    nome: "Catálogo digital",
    descricao: "Catálogos partilháveis com seleção de produtos e disponibilidade.",
    categoria: "VENDA",
    obrigatorio: false
  },
  {
    modulo: "market",
    nome: "Bizy Market",
    descricao: "Participação no shopping center Bizy com descoberta cruzada de produtos.",
    categoria: "CRESCIMENTO",
    obrigatorio: false
  }
];

export interface ModuloNegocioConfigurado {
  id: string;
  negocioId: string;
  modulo: ModuloNegocioCodigo;
  ativo: boolean;
  configuracao: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface AtualizacaoModuloNegocio {
  ativo: boolean;
  configuracao?: Record<string, unknown>;
}

export interface DadosNegocioBizy {
  nomeComercial: string;
  segmento: string;
  tipo: TipoNegocioBizy;
  modeloVenda?: string | null;
  tipoProdutoVendido?: string | null;
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
  areasEntrega?: string[];
  regrasComissao?: Record<string, unknown>;
  politicaTrocaDevolucao?: Record<string, unknown>;
  contasSociais?: Record<string, unknown>;
  entrega?: Record<string, unknown>;
  perfil360?: Record<string, unknown>;
  dadosOperacionais?: Record<string, unknown>;
  fontesDados?: Record<string, unknown>;
  ultimoEnriquecimentoEm?: Date | null;
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
  contasSociais: Record<string, unknown>;
  entrega: Record<string, unknown>;
  perfil360: Record<string, unknown>;
  dadosOperacionais: Record<string, unknown>;
  fontesDados: Record<string, unknown>;
  ultimoEnriquecimentoEm: Date | null;
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
  atribuicoes: {
    porCampanha: Record<string, ResumoConversaoTrackingComercial>;
    porVendedor: Record<string, ResumoConversaoTrackingComercial>;
    porLink: Record<string, ResumoConversaoTrackingComercial>;
    porAfiliado: Record<string, ResumoConversaoTrackingComercial>;
  };
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

export interface ResumoConversaoTrackingComercial {
  eventos: number;
  checkoutsIniciados: number;
  pedidosCriados: number;
  receitaAtribuidaEmKwanza: number;
  taxaPedidoPorCheckout: number;
}

export interface RegraComissaoProdutoParceiro {
  codigoProduto: string;
  tipo: TipoComissaoParceiro;
  percentual?: number;
  valorEmKwanza?: number;
}

export interface RegraComissaoColecaoParceiro {
  colecao: string;
  tipo: TipoComissaoParceiro;
  percentual?: number;
  valorEmKwanza?: number;
}

export interface RegraComissaoCampanhaParceiro {
  campanhaId: string;
  tipo: TipoComissaoParceiro;
  percentual?: number;
  valorEmKwanza?: number;
}

export interface RegraComissaoParceiro {
  tipo: TipoComissaoParceiro;
  percentual?: number;
  valorEmKwanza?: number;
  produtos?: RegraComissaoProdutoParceiro[];
  colecoes?: RegraComissaoColecaoParceiro[];
  campanhas?: RegraComissaoCampanhaParceiro[];
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
  destinoId: string | null;
  slugLoja: string | null;
  codigoProduto: string | null;
  canal: string | null;
  origemConteudo: string | null;
  metadata: Record<string, unknown>;
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
  destinoId?: string | null;
  slugLoja?: string | null;
  codigoProduto?: string | null;
  canal?: string | null;
  origemConteudo?: string | null;
  metadata?: Record<string, unknown>;
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
  referencia?: string | null;
  autorId?: string | null;
  autorNome?: string | null;
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
  comissaoPendenteEmKwanza: number;
  comissaoPagaEmKwanza: number;
  comissaoRevertidaEmKwanza: number;
  receitaAtribuidaEmKwanza: number;
  totalCliques: number;
  totalLeads: number;
  ranking: Array<{
    afiliadoId: string;
    codigo: string;
    nomePublico: string;
    pedidos: number;
    pedidosPagos: number;
    cliques: number;
    leads: number;
    taxaPedidoPorClique: number;
    receitaAtribuidaEmKwanza: number;
    ticketMedioEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPendenteEmKwanza: number;
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

export interface InstanciaInstagram {
  id: string;
  negocioId: string | null;
  nome: string;
  username: string;
  status: string;
  padrao: boolean;
  ativa: boolean;
  ultimoErro: string | null;
  ultimaConexaoEm: Date | null;
  ultimaPollEm: Date | null;
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

export const estadosDenuncia = ["PENDENTE", "EM_REVISAO", "ACEITE", "REJEITADA", "RESOLVIDA"] as const;
export type EstadoDenuncia = (typeof estadosDenuncia)[number];

export const tiposDenuncia = [
  "PRODUTO_PROIBIDO",
  "INFORMACAO_FALSA",
  "FRAUDE",
  "CONTEUDO_OFENSIVO",
  "SPAM",
  "OUTRO"
] as const;
export type TipoDenuncia = (typeof tiposDenuncia)[number];

export interface DenunciaMarket {
  id: string;
  tipo: TipoDenuncia;
  entidadeTipo: "PRODUTO" | "LOJA";
  entidadeId: string;
  negocioAlvoId: string | null;
  denuncianteId: string | null;
  motivo: string;
  descricao: string | null;
  origem: "PUBLICO" | "SELLER" | "TEAM" | "SISTEMA";
  evidencias: string[];
  responsavelId: string | null;
  prazoEm: Date | null;
  estado: EstadoDenuncia;
  resolvidoPorId: string | null;
  resolucao: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaDenunciaMarket {
  tipo: TipoDenuncia;
  entidadeTipo: "PRODUTO" | "LOJA";
  entidadeId: string;
  negocioAlvoId?: string | null;
  denuncianteId?: string | null;
  motivo: string;
  descricao?: string | null;
  origem?: DenunciaMarket["origem"];
  evidencias?: string[];
  responsavelId?: string | null;
  prazoEm?: Date | null;
}

export interface ResolucaoDenuncia {
  resolvidoPorId: string;
  resolucao: string;
  estado: "ACEITE" | "REJEITADA" | "RESOLVIDA";
}

export const estadosReservaStockCheckout = ["ATIVA", "CONFIRMADA", "EXPIRADA", "LIBERADA"] as const;
export type EstadoReservaStockCheckout = (typeof estadosReservaStockCheckout)[number];

export interface ReservaStockCheckout {
  id: string;
  negocioId: string;
  pecaId: string;
  codigoPeca: string;
  quantidade: number;
  sessaoId: string;
  estado: EstadoReservaStockCheckout;
  expiraEm: Date;
  liberadaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaReservaStockCheckout {
  negocioId: string;
  pecaId: string;
  codigoPeca: string;
  quantidade: number;
  sessaoId: string;
  expiraEm: Date;
}

export const estadosCompraUnificada = [
  "ABERTA",
  "AGUARDANDO_PAGAMENTO",
  "PAGA",
  "EM_PROCESSAMENTO",
  "PARCIALMENTE_ENTREGUE",
  "ENTREGUE",
  "CANCELADA",
  "PARCIALMENTE_CANCELADA"
] as const;
export type EstadoCompraUnificada = (typeof estadosCompraUnificada)[number];

export interface CompraUnificada {
  id: string;
  numero: number;
  idempotencyKey: string | null;
  contaBizyId: string | null;
  compradorTelefone: string;
  compradorNome: string | null;
  compradorEmail: string | null;
  estado: EstadoCompraUnificada;
  estadoPagamento: EstadoPagamentoPedido;
  subtotalEmKwanza: number;
  descontoEmKwanza: number;
  taxaEntregaTotalEmKwanza: number;
  totalEmKwanza: number;
  metodoPagamento: string | null;
  comprovativoPagamentoUrl: string | null;
  enderecoEntrega: string | null;
  observacao: string | null;
  origem: string;
  pedidosFilhoIds: string[];
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovaCompraUnificada {
  idempotencyKey?: string | null;
  contaBizyId?: string | null;
  compradorTelefone: string;
  compradorNome?: string | null;
  compradorEmail?: string | null;
  itens: Array<{
    negocioId: string;
    codigoPeca: string;
    varianteSelecionada?: Record<string, string> | null;
    quantidade: number;
  }>;
  entrega?: {
    tipo: "ENTREGA" | "RETIRADA" | "ORCAMENTO";
    provincia?: string | null;
    municipio?: string | null;
    bairro?: string | null;
    endereco?: string | null;
  } | null;
  metodoPagamento?: string | null;
  comprovativoPagamentoUrl?: string | null;
  enderecoEntrega?: string | null;
  observacao?: string | null;
  origem?: string;
}

export interface PedidoFilho {
  id: string;
  compraUnificadaId: string;
  negocioId: string;
  pedidoId: string;
  estado: EstadoPedido;
  estadoPagamento: EstadoPagamentoPedido;
  estadoEntrega: EstadoEntregaPedido;
  estadoSeparacao: "PENDENTE" | "EM_SEPARACAO" | "SEPARADO";
  estadoEmbalagem: "PENDENTE" | "EM_EMBALAGEM" | "EMBALADO";
  provaEntregaUrl: string | null;
  tentativasEntrega: number;
  motivoAtraso: string | null;
  estadoDevolucao: "SOLICITADA" | "EM_TRANSITO" | "RECEBIDA" | "REJEITADA" | null;
  fulfillment: Array<{ tipo: string; ocorridoEm: string; actorId?: string | null; dados?: Record<string, unknown> }>;
  subtotalEmKwanza: number;
  taxaEntregaEmKwanza: number;
  totalEmKwanza: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export const estadosRepasse = [
  "PENDENTE",
  "RETIDO",
  "CONCILIADO",
  "APROVADO",
  "PAGO",
  "CANCELADO",
  "EM_DISPUTA"
] as const;
export type EstadoRepasse = (typeof estadosRepasse)[number];

export interface RepasseFinanceiro {
  id: string;
  negocioId: string;
  compraUnificadaId: string | null;
  pedidoId: string;
  valorBrutoEmKwanza: number;
  valorProdutosEmKwanza: number;
  valorEntregaEmKwanza: number;
  impostosEmKwanza: number;
  taxaBizyEmKwanza: number;
  comissaoEmKwanza: number;
  descontoEmKwanza: number;
  retencaoEmKwanza: number;
  reembolsoEmKwanza: number;
  valorLiquidoEmKwanza: number;
  valorDisponivelEmKwanza: number;
  estado: EstadoRepasse;
  motivo: string | null;
  motivoRetencao: string | null;
  retidoAte: Date | null;
  politicaCalculoVersao: "market.split.v1" | string;
  conciliadoEm: Date | null;
  aprovadoEm: Date | null;
  pagoEm: Date | null;
  referenciaPagamento: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoRepasseFinanceiro {
  negocioId: string;
  compraUnificadaId?: string | null;
  pedidoId: string;
  valorBrutoEmKwanza: number;
  valorProdutosEmKwanza?: number;
  valorEntregaEmKwanza?: number;
  impostosEmKwanza?: number;
  taxaBizyEmKwanza?: number;
  comissaoEmKwanza?: number;
  descontoEmKwanza?: number;
  retencaoEmKwanza?: number;
  reembolsoEmKwanza?: number;
  motivoRetencao?: string | null;
  retidoAte?: Date | null;
  politicaCalculoVersao?: string;
  motivo?: string | null;
}

export interface ReembolsoPedido {
  id: string;
  negocioId: string;
  pedidoId: string;
  compraUnificadaId: string | null;
  tipo: "TOTAL" | "PARCIAL";
  valorEmKwanza: number;
  motivo: string;
  itensAfetados: Array<{ codigoPeca: string; quantidade: number; valorEmKwanza: number }>;
  estado: "PENDENTE" | "APROVADO" | "PROCESSADO" | "REJEITADO";
  aprovadoPorId: string | null;
  processadoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface NovoReembolsoPedido {
  negocioId: string;
  pedidoId: string;
  compraUnificadaId?: string | null;
  tipo: "TOTAL" | "PARCIAL";
  valorEmKwanza: number;
  motivo: string;
  itensAfetados?: Array<{ codigoPeca: string; quantidade: number; valorEmKwanza: number }>;
}
