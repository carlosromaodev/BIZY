import { z } from "zod";
import {
  estadosConversaAtendimento,
  estadosEntregaPedido,
  estadosPagamentoPedido,
  estadosPedido,
  estadosPeca,
  estadosRelacionamentoCliente,
  fontesLive,
  politicasAutomacaoAtendimento,
  prioridadesConversaAtendimento,
  tiposEventoTrackingComercial,
  tiposMovimentoStock
} from "./tipos.js";

const TextoPerfilOpcionalSchema = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
  z.string().trim().min(1).max(240).nullable().optional()
).transform((valor) => valor ?? null);

const AvatarPerfilOpcionalSchema = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
  z.string().trim().url().max(2048).nullable().optional()
).transform((valor) => valor ?? null);

const TextoCatalogoOpcionalSchema = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
  z.string().trim().min(1).max(120).nullable().optional()
).transform((valor) => valor ?? null);

const VariantesPecaSchema = z
  .record(
    z.string().trim().min(1).max(60),
    z.array(z.string().trim().min(1).max(80)).max(60)
  )
  .default({});

export const ComentarioLiveSchema = z.object({
  source: z.enum(fontesLive),
  provider: z.string().min(1),
  liveId: z.string().min(1),
  username: z.string().min(1),
  userId: TextoPerfilOpcionalSchema,
  displayName: z.string().default(""),
  avatarUrl: AvatarPerfilOpcionalSchema,
  commentText: z.string().min(1),
  timestamp: z.coerce.date()
});

export const ResultadoInterpretacaoComentarioSchema = z.object({
  intent: z.enum(["BUY", "NONE"]),
  phone: z.string().nullable(),
  productCode: z.string().nullable(),
  productCodes: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  requiresManualReview: z.boolean(),
  reasons: z.array(z.string())
});

export const CriarPecaSchema = z.object({
  codigo: z.string().trim().min(1).max(32),
  negocioId: z.string().trim().uuid().nullable().optional(),
  sku: TextoCatalogoOpcionalSchema,
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(1000).default(""),
  categoria: TextoCatalogoOpcionalSchema,
  colecao: TextoCatalogoOpcionalSchema,
  precoEmKwanza: z.coerce.number().int().min(0),
  custoEmKwanza: z.coerce.number().int().min(0).nullable().optional().transform((valor) => valor ?? null),
  quantidade: z.coerce.number().int().min(0),
  stockMinimo: z.coerce.number().int().min(0).default(0),
  fotos: z.array(z.string().url()).default([]),
  variantes: VariantesPecaSchema,
  estado: z.enum(estadosPeca).optional()
});

export const AtualizarPecaSchema = CriarPecaSchema.partial().omit({ codigo: true });

export const RegistrarMovimentoStockSchema = z.object({
  tipo: z.enum(tiposMovimentoStock),
  quantidade: z.coerce.number().int().min(1).max(999_999),
  motivo: z.string().trim().min(3).max(500),
  responsavelId: z.string().trim().min(1).max(120).nullable().optional().transform((valor) => valor ?? null),
  origem: z.string().trim().min(1).max(80).nullable().optional().transform((valor) => valor ?? null)
});

export const PublicarLojaSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .transform((valor) => valor.toLowerCase())
    .refine((valor) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor), {
      message: "Use um slug com letras minúsculas, números e hífens, sem espaços."
    }),
  descricaoPublica: TextoCatalogoOpcionalSchema,
  publicada: z.boolean().default(true)
});

export const RegistrarEventoTrackingSchema = z.object({
  tipo: z.enum(tiposEventoTrackingComercial),
  entidadeTipo: z.string().trim().min(1).max(80).nullable().optional().transform((valor) => valor ?? null),
  entidadeId: z.string().trim().min(1).max(120).nullable().optional().transform((valor) => valor ?? null),
  slugLoja: TextoCatalogoOpcionalSchema,
  codigoProduto: TextoCatalogoOpcionalSchema,
  trackingId: z.string().trim().min(1).max(160).nullable().optional().transform((valor) => valor ?? null),
  origem: z.string().trim().min(1).max(80).nullable().optional().transform((valor) => valor ?? null),
  canal: z.string().trim().min(1).max(80).nullable().optional().transform((valor) => valor ?? null),
  utm: z.record(z.string(), z.string()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const GerarCheckoutWhatsAppPublicoSchema = z.object({
  quantidade: z.coerce.number().int().min(1).max(999).default(1),
  variante: z.record(z.string(), z.string()).default({}),
  trackingId: z.string().trim().min(1).max(160).nullable().optional().transform((valor) => valor ?? null),
  origem: z.string().trim().min(1).max(80).default("loja-publica")
});

export const IniciarLiveSchema = z.object({
  liveUsername: z.string().trim().min(1),
  provider: z
    .enum(["manual", "tiktok-live-connector", "tiktok-live-python", "future-instagram"])
    .default("manual")
});

export const ComentarioManualSchema = z.object({
  liveId: z.string().trim().min(1).default("manual_local"),
  username: z.string().trim().min(1).default("cliente_manual"),
  userId: TextoPerfilOpcionalSchema,
  displayName: z.string().trim().default("Cliente"),
  avatarUrl: AvatarPerfilOpcionalSchema,
  commentText: z.string().trim().min(1),
  provider: z.string().trim().default("manual")
});

export const ComentarioManualSessaoSchema = z.object({
  username: z.string().trim().min(1).default("cliente_manual"),
  userId: TextoPerfilOpcionalSchema,
  displayName: z.string().trim().default("Cliente"),
  avatarUrl: AvatarPerfilOpcionalSchema,
  commentText: z.string().trim().min(1)
});

export const AprovarComentarioManualSchema = z.object({
  telefone: z.string().trim().min(8).max(30),
  codigoPeca: z.string().trim().min(1).max(32),
  observacao: z.string().trim().max(500).optional()
});

export const RejeitarComentarioManualSchema = z.object({
  motivo: z.string().trim().min(3).max(500).default("Comentário rejeitado na revisão manual.")
});

export const LimparDadosOperacionaisSchema = z.object({
  confirmacao: z.literal("LIMPAR")
});

export const ConfirmarPagamentoSchema = z.object({
  observacao: z.string().trim().max(500).optional()
});

export const CancelarReservaSchema = z.object({
  motivo: z.string().trim().max(500).default("Cancelada manualmente pelo vendedor."),
  permitirCancelarPaga: z.boolean().default(false)
});

export const RejeitarPagamentoSchema = z.object({
  motivo: z.string().trim().min(3).max(500)
});

const UrlOuDataUrlSchema = z
  .string()
  .trim()
  .min(10)
  .max(12_000_000)
  .refine((valor) => {
    if (valor.startsWith("data:")) return /^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/.test(valor);
    return z.string().url().safeParse(valor).success;
  }, "Informe uma URL válida ou um ficheiro em data URL base64.");

export const RegistrarComprovativoPagamentoSchema = z.object({
  comprovativoPagamentoUrl: UrlOuDataUrlSchema.optional(),
  observacao: z.string().trim().max(500).optional()
});

export const AtualizarEnderecoEntregaSchema = z.object({
  enderecoEntrega: z.string().trim().min(8).max(1000)
});

export const EnviarMensagemWhatsAppManualSchema = z
  .object({
    telefone: z.string().trim().min(8).max(30),
    mensagem: z.string().trim().min(1).max(2000).optional(),
    templateId: z.string().trim().min(1).max(60).optional(),
    variaveis: z.record(z.string(), z.string()).default({})
  })
  .refine((dados) => Boolean(dados.mensagem || dados.templateId), {
    message: "Informe uma mensagem ou um templateId."
  });

export const AtualizarConversaAtendimentoSchema = z
  .object({
    estado: z.enum(estadosConversaAtendimento).optional(),
    prioridade: z.enum(prioridadesConversaAtendimento).optional(),
    responsavelId: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .nullable()
      .optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional()
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar a conversa."
  });

const TagsClienteSchema = z.array(z.string().trim().min(1).max(40)).max(20);

const PreferenciasClienteSchema = z.record(z.string(), z.unknown()).default({});

const ClienteCrmBaseSchema = z.object({
  telefone: z.string().trim().min(8).max(30).nullable().optional(),
  email: z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
    z.string().trim().email().max(160).nullable().optional()
  ).transform((valor) => valor ?? null),
  nome: TextoPerfilOpcionalSchema,
  username: TextoPerfilOpcionalSchema,
  userId: TextoPerfilOpcionalSchema,
  avatarUrl: AvatarPerfilOpcionalSchema,
  origem: z.string().trim().min(1).max(80).default("manual"),
  tags: TagsClienteSchema.default([]),
  preferencias: PreferenciasClienteSchema,
  consentimentoMarketing: z.boolean().default(false),
  consentimentoDados: z.boolean().default(false),
  estadoRelacionamento: z.enum(estadosRelacionamentoCliente).default("ATIVO")
});

export const CriarClienteCrmSchema = ClienteCrmBaseSchema
  .refine((dados) => Boolean(dados.telefone || dados.email), {
    message: "Informe telefone ou email para identificar o cliente."
  });

export const AtualizarClienteCrmSchema = ClienteCrmBaseSchema.partial()
  .omit({ origem: true })
  .extend({
    origem: z.string().trim().min(1).max(80).nullable().optional()
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar o cliente."
  });

export const CriarPedidoSchema = z.object({
  clienteId: z.string().trim().uuid(),
  reservaId: z.string().trim().uuid().nullable().optional(),
  itens: z
    .array(
      z.object({
        codigoPeca: z.string().trim().min(1).max(32),
        quantidade: z.coerce.number().int().min(1).max(999),
        precoUnitarioEmKwanza: z.coerce.number().int().min(0).optional()
      })
    )
    .min(1)
    .max(100),
  origem: z.string().trim().min(1).max(60).default("manual"),
  canal: z.string().trim().min(1).max(60).default("whatsapp"),
  descontoEmKwanza: z.coerce.number().int().min(0).default(0),
  motivoDesconto: TextoPerfilOpcionalSchema,
  taxaEntregaEmKwanza: z.coerce.number().int().min(0).default(0),
  enderecoEntrega: z.string().trim().min(3).max(1000).nullable().optional().transform((valor) => valor ?? null),
  comprovativoPagamentoUrl: z.string().trim().url().max(2048).nullable().optional().transform((valor) => valor ?? null),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
  responsavelId: TextoPerfilOpcionalSchema
});

export const AtualizarEstadoPedidoSchema = z
  .object({
    estado: z.enum(estadosPedido).optional(),
    observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
    responsavelId: TextoPerfilOpcionalSchema
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar o pedido."
  });

export const ConfirmarPagamentoPedidoSchema = z.object({
  comprovativoPagamentoUrl: z.string().trim().url().max(2048).nullable().optional().transform((valor) => valor ?? null),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const AtualizarEntregaPedidoSchema = z.object({
  estadoEntrega: z.enum(estadosEntregaPedido),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
  responsavelId: TextoPerfilOpcionalSchema
});

export const FiltrosPedidosQuerySchema = z.object({
  estado: z.enum(estadosPedido).optional(),
  estadoPagamento: z.enum(estadosPagamentoPedido).optional(),
  estadoEntrega: z.enum(estadosEntregaPedido).optional(),
  clienteId: z.string().trim().uuid().optional(),
  busca: z.string().trim().max(120).optional(),
  limite: z.coerce.number().int().min(1).max(1000).optional()
});

export const RegistrarNotaInternaAtendimentoSchema = z.object({
  texto: z.string().trim().min(2).max(2000)
});

export const DefinirPoliticaAutomacaoAtendimentoSchema = z.object({
  politica: z.enum(politicasAutomacaoAtendimento)
});

export const RegistrarSugestaoIaAtendimentoSchema = z.object({
  texto: z.string().trim().min(2).max(2000),
  regra: z.string().trim().min(1).max(120).default("sugestao_manual"),
  confianca: z.coerce.number().min(0).max(1).default(0),
  dadosConsultados: z.record(z.string(), z.unknown()).default({})
});

export const ClassificarMensagemN8nSchema = z.object({
  texto: z.string().trim().min(1).max(4000)
});

export const SolicitarCodigoLoginSchema = z.object({
  telefone: z.string().trim().min(8).max(30),
  nome: z.string().trim().min(2).max(120).optional()
});

export const ConfirmarCodigoLoginSchema = z.object({
  telefone: z.string().trim().min(8).max(30),
  codigo: z
    .string()
    .trim()
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine((valor) => valor.length === 6, "Código deve ter exatamente 6 dígitos")
});

export const LoginEstudantilSchema = z.object({
  provider: z.enum(["uor", "isptec"]).default("uor"),
  identificador: z.string().trim().min(1).max(40),
  tipoIdentificador: z.enum(["studentNumber", "username"]).default("studentNumber"),
  palavraPasse: z.string().min(1).max(200)
}).superRefine((dados, ctx) => {
  if (dados.provider === "isptec" && dados.tipoIdentificador === "username") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tipoIdentificador"],
      message: "O ISPTEC aceita apenas número de estudante."
    });
    return;
  }

  if (dados.tipoIdentificador === "username") {
    if (!/^[\p{L}\p{N}._@ -]+$/u.test(dados.identificador)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identificador"],
        message: "Nome de utilizador contém caracteres inválidos."
      });
    }
    return;
  }

  const digitos = dados.identificador.replace(/\D/g, "");
  if (digitos.length < 8 || digitos.length > 12) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["identificador"],
      message: "Número de estudante deve ter entre 8 e 12 dígitos."
    });
  }
});

const TextoOnboardingOpcionalSchema = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
  z.string().trim().min(1).max(240).nullable().optional()
).transform((valor) => valor ?? null);

export const SalvarNegocioOnboardingSchema = z.object({
  nomeComercial: z.string().trim().min(2).max(120),
  segmento: z.string().trim().min(2).max(120),
  tipo: z.enum(["LOJA", "CRIADOR", "REVENDEDOR", "SERVICO"]).default("LOJA"),
  nif: TextoOnboardingOpcionalSchema,
  telefone: TextoOnboardingOpcionalSchema,
  whatsapp: TextoOnboardingOpcionalSchema,
  email: z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
    z.string().trim().email().max(160).nullable().optional()
  ).transform((valor) => valor ?? null),
  instagram: TextoOnboardingOpcionalSchema,
  tiktok: TextoOnboardingOpcionalSchema,
  provincia: TextoOnboardingOpcionalSchema,
  municipio: TextoOnboardingOpcionalSchema,
  endereco: TextoOnboardingOpcionalSchema,
  moeda: z.string().trim().min(3).max(3).default("AOA"),
  fusoHorario: z.string().trim().min(3).max(80).default("Africa/Luanda"),
  canaisVenda: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  metodosPagamento: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  entrega: z.record(z.string(), z.unknown()).default({}),
  minutosReservaPadrao: z.coerce.number().int().min(1).max(180).default(10)
});

export const CriarProdutoInicialOnboardingSchema = CriarPecaSchema.extend({
  categoria: z.string().trim().max(80).optional()
});

export const CriarInstanciaWhatsAppSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, _ ou - no nome da instância."),
  etiqueta: z.string().trim().min(2).max(80).optional(),
  telefone: z.string().trim().max(30).optional(),
  baseUrl: z.string().trim().url().optional(),
  apiKey: z.string().trim().min(6).max(240).optional(),
  token: z.string().trim().min(6).max(240).optional(),
  padrao: z.boolean().optional()
});

export const TestarSmsSchema = z.object({
  telefone: z.string().trim().min(8).max(30),
  mensagem: z.string().trim().min(3).max(160).default("Teste EMeu: diagnostico de envio SMS."),
  remetente: z.string().trim().min(3).max(16).default("EMEU"),
  enviarReal: z.boolean().default(false),
  schedule: z.string().trim().max(80).optional()
});

export const EventoN8nSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  occurredAt: z.string().datetime(),
  source: z.literal("emeu-backend"),
  payload: z.record(z.unknown())
});
