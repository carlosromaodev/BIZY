import { z } from "zod";
import {
  estadosConversaAtendimento,
  estadosAprovacaoTemplateWhatsApp,
  estadosCampanhaCrm,
  estadosEventoOperacional,
  estadosJobOperacional,
  estadosEntregaPedido,
  estadosOportunidadeRecuperacao,
  estadosPagamentoPedido,
  estadosPedido,
  estadosParceiroComercial,
  estadosPeca,
  estadosTarefaOperacional,
  estadosSocialInbox,
  estadosExecucaoPlaybookRecuperacao,
  estadosRelacionamentoCliente,
  estadosRelacaoNegocio,
  papeisNegocio,
  providersTemplateWhatsApp,
  statusMembroNegocio,
  etapasFunilComercial,
  fontesLive,
  gatilhosPlaybookRecuperacao,
  intencoesSocialInbox,
  modulosNegocioDisponiveis,
  politicasAutomacaoAtendimento,
  prioridadesTarefaOperacional,
  prioridadesConversaAtendimento,
  acoesPlaybookRecuperacao,
  tiposSocialInbox,
  tiposComissaoParceiro,
  tiposEventoTrackingComercial,
  tiposMovimentoStock,
  tiposRelacaoNegocio,
  tiposParceiroComercial
} from "./tipos.js";
import { categoriasMensagemWhatsApp } from "./provedores/ProvedorWhatsApp.js";

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

const BooleanQueryOpcionalSchema = z.preprocess((valor) => {
  if (valor === undefined || valor === null || valor === "") return undefined;
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") {
    const normalizado = valor.trim().toLowerCase();
    if (normalizado === "true" || normalizado === "1" || normalizado === "sim") return true;
    if (normalizado === "false" || normalizado === "0" || normalizado === "nao" || normalizado === "não") {
      return false;
    }
  }
  return valor;
}, z.boolean().optional());

const VariantesPecaSchema = z
  .record(
    z.string().trim().min(1).max(60),
    z.array(z.string().trim().min(1).max(80)).max(60)
  )
  .default({});

export const ModuloNegocioParametroSchema = z.object({
  modulo: z.enum(modulosNegocioDisponiveis)
});

export const AtualizarModuloNegocioSchema = z.object({
  ativo: z.boolean(),
  configuracao: z.record(z.string(), z.unknown()).default({})
});

export const CriarMembroNegocioSchema = z.object({
  telefone: z.string().trim().min(9).max(20),
  nome: z.string().trim().min(2).max(160),
  email: z.string().trim().email().nullable().optional().transform((valor) => valor ?? null),
  papel: z.enum(papeisNegocio),
  permissoes: z.array(z.string().trim().min(3).max(80)).default([])
});

export const AtualizarMembroNegocioSchema = z.object({
  papel: z.enum(papeisNegocio).optional(),
  status: z.enum(statusMembroNegocio).optional(),
  permissoes: z.array(z.string().trim().min(3).max(80)).optional(),
  motivo: z.string().trim().min(3).max(500).nullable().optional().transform((valor) => valor ?? null)
});

export const CriarTemplateWhatsAppSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  categoria: z.enum(categoriasMensagemWhatsApp),
  idioma: z.string().trim().min(2).max(16).default("pt_AO"),
  provider: z.enum(providersTemplateWhatsApp).default("whatsapp_cloud_api"),
  estadoAprovacao: z.enum(estadosAprovacaoTemplateWhatsApp).default("rascunho"),
  eventosCompativeis: z.array(z.string().trim().min(2).max(80)).default([]),
  variaveis: z.array(z.string().trim().min(1).max(80)).default([]),
  corpo: z.string().trim().min(3).max(4096),
  ativo: z.boolean().default(true)
});

export const AtualizarTemplateWhatsAppSchema = CriarTemplateWhatsAppSchema.partial().extend({
  motivo: z.string().trim().min(3).max(500).nullable().optional().transform((valor) => valor ?? null)
});

export const CriarCampanhaSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  objetivo: z.string().trim().min(3).max(500),
  canal: z.string().trim().min(2).max(40).default("whatsapp"),
  templateId: z.string().trim().min(1).max(120),
  categoria: z.enum(categoriasMensagemWhatsApp),
  segmento: z.record(z.string(), z.unknown()).default({}),
  limiteDiario: z.coerce.number().int().min(1).max(50_000).default(500),
  janelaEnvio: z
    .object({
      inicio: z.coerce.date().nullable().optional(),
      fim: z.coerce.date().nullable().optional()
    })
    .optional()
});

export const FiltrosCampanhasQuerySchema = z.object({
  estado: z.enum(estadosCampanhaCrm).optional(),
  canal: z.string().trim().min(1).max(40).optional(),
  limite: z.coerce.number().int().min(1).max(500).default(100)
});

export const ConfirmarCampanhaSchema = z.object({
  confirmar: z.boolean()
});

export const PausarCampanhaSchema = z.object({
  motivo: z.string().trim().min(3).max(500)
});

export const RegistrarEventoOperacionalSchema = z.object({
  topico: z.string().trim().min(2).max(80),
  tipo: z.string().trim().min(2).max(120),
  entidadeTipo: z.string().trim().min(1).max(80).nullable().optional().transform((valor) => valor ?? null),
  entidadeId: z.string().trim().min(1).max(120).nullable().optional().transform((valor) => valor ?? null),
  idempotencyKey: z.string().trim().min(3).max(240).nullable().optional().transform((valor) => valor ?? null),
  payload: z.record(z.string(), z.unknown()).default({}),
  estado: z.enum(estadosEventoOperacional).default("PENDENTE")
});

export const FiltrosEventosOperacionaisQuerySchema = z.object({
  topico: z.string().trim().min(1).max(80).optional(),
  tipo: z.string().trim().min(1).max(120).optional(),
  estado: z.enum(estadosEventoOperacional).optional(),
  limite: z.coerce.number().int().min(1).max(500).default(100)
});

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

export const ImportarCsvSchema = z.object({
  csv: z.string().trim().min(1).max(5_000_000)
});

export const CriarJobImportacaoClientesSchema = ImportarCsvSchema.extend({
  idempotencyKey: z.string().trim().min(3).max(240).nullable().optional().transform((valor) => valor ?? null)
});

export const ArquivarPecaSchema = z.object({
  motivo: z.string().trim().min(3).max(500).optional()
});

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

const ItemCheckoutPublicoSchema = z.object({
  codigoPeca: z.string().trim().min(1).max(32),
  quantidade: z.coerce.number().int().min(1).max(999)
});

const EntregaCheckoutPublicoSchema = z
  .object({
    tipo: z.enum(["ENTREGA", "RETIRADA"]).default("ENTREGA"),
    provincia: TextoCatalogoOpcionalSchema,
    municipio: TextoCatalogoOpcionalSchema,
    bairro: TextoCatalogoOpcionalSchema,
    endereco: z.string().trim().min(3).max(1000).nullable().optional().transform((valor) => valor ?? null)
  })
  .default({ tipo: "ENTREGA" });

export const GerarCheckoutWhatsAppPublicoSchema = z.object({
  quantidade: z.coerce.number().int().min(1).max(999).default(1),
  variante: z.record(z.string(), z.string()).default({}),
  trackingId: z.string().trim().min(1).max(160).nullable().optional().transform((valor) => valor ?? null),
  origem: z.string().trim().min(1).max(80).default("loja-publica"),
  entrega: EntregaCheckoutPublicoSchema.optional()
});

export const CalcularEntregaPublicaSchema = z.object({
  itens: z.array(ItemCheckoutPublicoSchema).min(1).max(100),
  entrega: EntregaCheckoutPublicoSchema
});

export const CriarCheckoutSitePublicoSchema = CalcularEntregaPublicaSchema.extend({
  cliente: z
    .object({
      nome: TextoCatalogoOpcionalSchema,
      telefone: TextoCatalogoOpcionalSchema,
      email: z.preprocess(
        (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
        z.string().trim().email().max(160).nullable().optional()
      ).transform((valor) => valor ?? null),
      consentimentoMarketing: z.boolean().default(false),
      consentimentoDados: z.boolean().default(false)
    })
    .refine((dados) => Boolean(dados.telefone || dados.email), {
      message: "Informe telefone ou email para confirmar o pedido."
    }),
  trackingId: z.string().trim().min(1).max(160).nullable().optional().transform((valor) => valor ?? null),
  referencia: z.string().trim().min(1).max(120).nullable().optional().transform((valor) => valor ?? null),
  origem: z.string().trim().min(1).max(80).default("loja-publica"),
  canal: z.string().trim().min(1).max(80).default("site"),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const CriarCheckoutAbandonadoPublicoSchema = CalcularEntregaPublicaSchema.extend({
  cliente: z
    .object({
      nome: TextoCatalogoOpcionalSchema,
      telefone: TextoCatalogoOpcionalSchema,
      email: z.preprocess(
        (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
        z.string().trim().email().max(160).nullable().optional()
      ).transform((valor) => valor ?? null),
      consentimentoMarketing: z.boolean().default(false),
      consentimentoDados: z.boolean().default(false)
    })
    .refine((dados) => Boolean(dados.telefone || dados.email), {
      message: "Informe telefone ou email para recuperar o checkout."
    })
    .refine((dados) => dados.consentimentoDados, {
      message: "Consentimento de dados é obrigatório para criar oportunidade de recuperação."
    }),
  trackingId: z.string().trim().min(1).max(160).nullable().optional().transform((valor) => valor ?? null),
  referencia: z.string().trim().min(1).max(120).nullable().optional().transform((valor) => valor ?? null),
  origem: z.string().trim().min(1).max(80).default("loja-publica"),
  canal: z.string().trim().min(1).max(80).default("site"),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const CriarAfiliadoSchema = z.object({
  tipo: z.enum(tiposParceiroComercial).default("AFILIADO"),
  codigo: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .transform((valor) => valor.toUpperCase())
    .refine((valor) => /^[A-Z0-9][A-Z0-9_-]*$/.test(valor), {
      message: "Use um código com letras, números, hífen ou underscore."
    }),
  nomePublico: z.string().trim().min(2).max(120),
  contacto: TextoCatalogoOpcionalSchema,
  estado: z.enum(estadosParceiroComercial).default("ATIVO"),
  regraComissao: z
    .object({
      tipo: z.enum(tiposComissaoParceiro),
      percentual: z.coerce.number().min(0).max(100).optional(),
      valorEmKwanza: z.coerce.number().int().min(0).optional()
    })
    .refine(
      (regra) =>
        regra.tipo === "PERCENTUAL"
          ? typeof regra.percentual === "number"
          : typeof regra.valorEmKwanza === "number",
      { message: "Informe percentual ou valor fixo conforme o tipo de comissão." }
    ),
  metodoPagamento: z.record(z.string(), z.unknown()).default({})
});

export const CriarLinkAfiliadoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((valor) => valor.toUpperCase())
    .refine((valor) => /^[A-Z0-9][A-Z0-9_-]*$/.test(valor), {
      message: "Use um código com letras, números, hífen ou underscore."
    }),
  destinoTipo: z.string().trim().min(2).max(40).transform((valor) => valor.toUpperCase()),
  slugLoja: TextoCatalogoOpcionalSchema,
  codigoProduto: TextoCatalogoOpcionalSchema.transform((valor) => valor?.toUpperCase() ?? null),
  canal: TextoCatalogoOpcionalSchema,
  origemConteudo: TextoCatalogoOpcionalSchema,
  ativo: z.boolean().default(true),
  expiraEm: z.coerce.date().nullable().optional().transform((valor) => valor ?? null)
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
    variaveis: z.record(z.string(), z.string()).default({}),
    categoria: z.enum(categoriasMensagemWhatsApp).optional(),
    consentimentoMarketing: z.boolean().optional(),
    janelaAtendimentoAtiva: z.boolean().optional()
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

const CampoTarefaOpcionalSchema = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
  z.string().trim().min(1).max(120).nullable().optional()
).transform((valor) => valor ?? null);

export const CriarTarefaOperacionalSchema = z.object({
  tipo: z.string().trim().min(2).max(80).transform((valor) => valor.toUpperCase()),
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().max(2000).default(""),
  prioridade: z.enum(prioridadesTarefaOperacional).default("NORMAL"),
  estado: z.enum(estadosTarefaOperacional).default("ABERTA"),
  origem: CampoTarefaOpcionalSchema.default("manual"),
  clienteId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  pedidoId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  entidadeTipo: CampoTarefaOpcionalSchema,
  entidadeId: CampoTarefaOpcionalSchema,
  clienteTelefone: CampoTarefaOpcionalSchema,
  responsavelId: CampoTarefaOpcionalSchema,
  prazoEm: z.coerce.date().nullable().optional().transform((valor) => valor ?? null),
  observacao: z.string().trim().max(2000).nullable().optional().transform((valor) => valor ?? null),
  contexto: z.record(z.string(), z.unknown()).default({})
});

export const AtualizarTarefaOperacionalSchema = CriarTarefaOperacionalSchema.partial()
  .omit({ tipo: true })
  .extend({
    tipo: z.string().trim().min(2).max(80).transform((valor) => valor.toUpperCase()).optional()
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar a tarefa."
  });

const AutorSocialInboxSchema = z.object({
  id: TextoPerfilOpcionalSchema,
  username: TextoPerfilOpcionalSchema,
  nome: TextoPerfilOpcionalSchema,
  avatarUrl: AvatarPerfilOpcionalSchema
}).default({});

export const CriarSocialInboxItemSchema = z.object({
  canal: z.string().trim().min(2).max(40).transform((valor) => valor.toLowerCase()),
  provider: z.string().trim().min(2).max(80).transform((valor) => valor.toLowerCase()),
  tipo: z.enum(tiposSocialInbox).default("COMENTARIO"),
  estado: z.enum(estadosSocialInbox).default("NOVO"),
  postId: TextoPerfilOpcionalSchema,
  postUrl: z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
    z.string().trim().url().max(2048).nullable().optional()
  ).transform((valor) => valor ?? null),
  autor: AutorSocialInboxSchema,
  texto: z.string().trim().min(1).max(4000),
  intencao: z.enum(intencoesSocialInbox).default("SEM_INTENCAO"),
  confianca: z.coerce.number().min(0).max(1).default(0),
  clienteTelefone: TextoPerfilOpcionalSchema,
  clienteId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  entidades: z.record(z.string(), z.unknown()).default({}),
  contexto: z.record(z.string(), z.unknown()).default({})
});

const BooleanQuerySchema = z.preprocess((valor) => {
  if (typeof valor === "string") {
    if (valor.toLowerCase() === "true") return true;
    if (valor.toLowerCase() === "false") return false;
  }
  return valor;
}, z.boolean().optional());

export const FiltrosSocialInboxQuerySchema = z.object({
  canal: z.string().trim().min(2).max(40).optional(),
  provider: z.string().trim().min(2).max(80).optional(),
  postId: z.string().trim().min(1).max(160).optional(),
  estado: z.enum(estadosSocialInbox).optional(),
  intencao: z.enum(intencoesSocialInbox).optional(),
  autorUsername: z.string().trim().min(1).max(120).optional(),
  clienteTelefone: z.string().trim().min(1).max(30).optional(),
  campanhaId: z.string().trim().min(1).max(160).optional(),
  produtoCodigo: z.string().trim().min(1).max(80).optional(),
  responsavelId: z.string().trim().min(1).max(120).optional(),
  urgencia: z.enum(prioridadesTarefaOperacional).optional(),
  respondido: BooleanQuerySchema,
  limite: z.coerce.number().int().min(1).max(500).optional()
});

export const CriarPlaybookRecuperacaoSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  gatilho: z.enum(gatilhosPlaybookRecuperacao),
  ativo: z.boolean().default(true),
  atrasoMinutos: z.coerce.number().int().min(0).max(43_200).default(0),
  condicoes: z.record(z.string(), z.unknown()).default({}),
  acao: z.enum(acoesPlaybookRecuperacao).default("CRIAR_TAREFA"),
  tituloTarefa: z.string().trim().min(3).max(160).nullable().optional().transform((valor) => valor ?? null),
  descricaoTarefa: z.string().trim().max(2000).nullable().optional().transform((valor) => valor ?? null),
  prioridadeTarefa: z.enum(prioridadesTarefaOperacional).default("NORMAL"),
  responsavelId: CampoTarefaOpcionalSchema
});

export const ExecutarPlaybookRecuperacaoSchema = z.object({
  entidadeTipo: CampoTarefaOpcionalSchema,
  entidadeId: CampoTarefaOpcionalSchema,
  clienteTelefone: CampoTarefaOpcionalSchema,
  clienteId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  pedidoId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  contexto: z.record(z.string(), z.unknown()).default({})
});

export const FiltrosPlaybookRecuperacaoQuerySchema = z.object({
  gatilho: z.enum(gatilhosPlaybookRecuperacao).optional(),
  ativo: BooleanQuerySchema,
  limite: z.coerce.number().int().min(1).max(500).optional()
});

export const FiltrosExecucoesPlaybookRecuperacaoQuerySchema = z.object({
  gatilho: z.enum(gatilhosPlaybookRecuperacao).optional(),
  estado: z.enum(estadosExecucaoPlaybookRecuperacao).optional(),
  entidadeTipo: z.string().trim().min(1).max(80).optional(),
  entidadeId: z.string().trim().min(1).max(120).optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

export const RegistrarMovimentoFunilComercialSchema = z.object({
  entidadeTipo: z.string().trim().min(2).max(80).transform((valor) => valor.toLowerCase()),
  entidadeId: z.string().trim().min(1).max(120),
  etapaAnterior: z.enum(etapasFunilComercial).nullable().optional(),
  etapaNova: z.enum(etapasFunilComercial),
  motivo: z.string().trim().min(3).max(1000),
  origem: CampoTarefaOpcionalSchema.default("manual"),
  autorId: CampoTarefaOpcionalSchema,
  contexto: z.record(z.string(), z.unknown()).default({})
});

export const FiltrosMovimentosFunilComercialQuerySchema = z.object({
  entidadeTipo: z.string().trim().min(2).max(80).transform((valor) => valor.toLowerCase()).optional(),
  entidadeId: z.string().trim().min(1).max(120).optional(),
  etapaNova: z.enum(etapasFunilComercial).optional(),
  origem: z.string().trim().min(1).max(80).optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

export const FiltrosOportunidadesRecuperacaoQuerySchema = z.object({
  gatilho: z.enum(gatilhosPlaybookRecuperacao).optional(),
  estado: z.enum(estadosOportunidadeRecuperacao).optional(),
  entidadeTipo: z.string().trim().min(1).max(80).optional(),
  entidadeId: z.string().trim().min(1).max(120).optional(),
  responsavelId: z.string().trim().min(1).max(120).nullable().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional()
});

export const AtualizarOportunidadeRecuperacaoSchema = z
  .object({
    estado: z.enum(estadosOportunidadeRecuperacao).optional(),
    responsavelId: CampoTarefaOpcionalSchema,
    observacao: z.string().trim().max(2000).nullable().optional().transform((valor) => valor ?? null),
    contexto: z.record(z.string(), z.unknown()).optional()
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar a oportunidade."
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

export const FiltrosClientes360QuerySchema = z.object({
  busca: z.string().trim().min(1).max(160).optional(),
  estadoRelacionamento: z.enum(estadosRelacionamentoCliente).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  consentimentoMarketing: BooleanQueryOpcionalSchema,
  limite: z.coerce.number().int().min(1).max(10_000).optional()
});

export const AtualizarClienteCrmSchema = ClienteCrmBaseSchema.partial()
  .omit({ origem: true })
  .extend({
    origem: z.string().trim().min(1).max(80).nullable().optional()
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar o cliente."
  });

export const MesclarClientesSchema = z.object({
  clienteDestinoId: z.string().trim().uuid(),
  clienteOrigemId: z.string().trim().uuid(),
  motivo: z.string().trim().min(3).max(500).optional()
});

export const AcaoRapidaClienteSchema = z.object({
  tipo: z.string().trim().min(2).max(80).transform((valor) => valor.toUpperCase()),
  titulo: z.string().trim().min(3).max(160).optional(),
  observacao: z.string().trim().max(2000).nullable().optional().transform((valor) => valor ?? null),
  prioridade: z.enum(prioridadesTarefaOperacional).default("NORMAL"),
  responsavelId: CampoTarefaOpcionalSchema,
  prazoEm: z.coerce.date().nullable().optional().transform((valor) => valor ?? null),
  contexto: z.record(z.string(), z.unknown()).default({})
});

export const CriarRelacaoNegocioSchema = z.object({
  negocioDestinoId: z.string().trim().uuid(),
  tipo: z.enum(tiposRelacaoNegocio).default("PARCERIA_DADOS"),
  escopo: z.record(z.string(), z.unknown()).default({}),
  expiraEm: z.coerce.date().nullable().optional().transform((valor) => valor ?? null)
});

export const AtualizarRelacaoNegocioSchema = z.object({
  estado: z.enum(estadosRelacaoNegocio)
});

export const CriarCompartilhamentoClienteSchema = z.object({
  negocioDestinoId: z.string().trim().uuid(),
  relacaoId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  escopo: z.record(z.string(), z.unknown()).default({}),
  motivo: z.string().trim().min(3).max(500),
  baseLegal: z.string().trim().min(3).max(80).default("CONSENTIMENTO"),
  consentimentoCliente: z.boolean(),
  expiraEm: z.coerce.date().nullable().optional().transform((valor) => valor ?? null)
});

export const RevogarCompartilhamentoClienteSchema = z.object({
  motivo: z.string().trim().min(3).max(500)
});

export const AnonimizarClienteSchema = z.object({
  motivo: z.string().trim().min(3).max(500)
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

export const CriarOrcamentoPedidoSchema = CriarPedidoSchema.omit({
  reservaId: true,
  comprovativoPagamentoUrl: true
}).extend({
  validadeMinutos: z.coerce.number().int().min(5).max(10_080).default(60)
});

export const AtualizarEstadoPedidoSchema = z
  .object({
    estado: z.enum(estadosPedido).optional(),
    estadoPagamento: z.enum(estadosPagamentoPedido).optional(),
    observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
    responsavelId: TextoPerfilOpcionalSchema
  })
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Informe pelo menos um campo para atualizar o pedido."
  });

export const SolicitarDescontoPedidoSchema = z.object({
  descontoEmKwanza: z.coerce.number().int().min(1),
  motivo: z.string().trim().min(3).max(1000),
  responsavelId: TextoPerfilOpcionalSchema,
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const AprovarDescontoPedidoSchema = z.object({
  descontoEmKwanza: z.coerce.number().int().min(1),
  motivo: z.string().trim().min(3).max(1000),
  aprovadoPor: z.string().trim().min(2).max(160),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const ConfirmarPagamentoPedidoSchema = z.object({
  comprovativoPagamentoUrl: z.string().trim().url().max(2048).nullable().optional().transform((valor) => valor ?? null),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const PagarComissaoParceiroSchema = z.object({
  referenciaPagamento: z.string().trim().min(3).max(120),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null)
});

export const CriarLotePagamentoComissaoSchema = z
  .object({
    comissaoIds: z
      .array(z.string().trim().uuid())
      .min(1, "Informe pelo menos uma comissão para pagar.")
      .max(200, "Um lote pode pagar no máximo 200 comissões por vez.")
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Não repita a mesma comissão no lote."
      }),
    referenciaPagamento: z.string().trim().min(3).max(120),
    observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
    periodoInicio: z.coerce.date().nullable().optional().transform((valor) => valor ?? null),
    periodoFim: z.coerce.date().nullable().optional().transform((valor) => valor ?? null)
  })
  .refine((dados) => !dados.periodoInicio || !dados.periodoFim || dados.periodoFim >= dados.periodoInicio, {
    message: "O fim do período deve ser posterior ao início.",
    path: ["periodoFim"]
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
  produto: z.string().trim().min(1).max(120).optional(),
  canal: z.string().trim().min(1).max(80).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  limite: z.coerce.number().int().min(1).max(1000).optional()
});

export const FiltrosEntregaPedidoQuerySchema = z.object({
  bairro: z.string().trim().min(1).max(120).optional(),
  estadoEntrega: z.enum(estadosEntregaPedido).optional(),
  responsavelId: z.string().trim().min(1).max(120).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  limite: z.coerce.number().int().min(1).max(1000).optional()
});

export const RecuperarPedidosParadosSchema = z.object({
  estado: z.enum(estadosPedido).optional(),
  estadoPagamento: z.enum(estadosPagamentoPedido).optional(),
  estadoEntrega: z.enum(estadosEntregaPedido).optional(),
  idadeMinutos: z.coerce.number().int().min(0).max(43_200).default(60),
  prioridade: z.enum(prioridadesTarefaOperacional).default("ALTA"),
  responsavelId: CampoTarefaOpcionalSchema,
  limite: z.coerce.number().int().min(1).max(500).default(100)
});

export const FiltrosRelatorioComercialQuerySchema = z.object({
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  canal: z.string().trim().min(1).max(80).optional(),
  produto: z.string().trim().min(1).max(120).optional(),
  colecao: z.string().trim().min(1).max(120).optional(),
  estado: z.enum(estadosPedido).optional(),
  responsavelId: z.string().trim().min(1).max(120).optional()
});

export const AtualizarPagamentosNegocioSchema = z.object({
  metodosPagamento: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  instrucoesCobranca: z.string().trim().max(2000).nullable().optional().transform((valor) => valor ?? null),
  mensagemComprovativoPendente: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
  mensagemPagamentoConfirmado: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
  contasBancarias: z
    .array(
      z.object({
        banco: z.string().trim().min(1).max(80),
        iban: z.string().trim().min(8).max(80),
        titular: z.string().trim().min(2).max(160),
        observacao: z.string().trim().max(500).nullable().optional().transform((valor) => valor ?? null)
      })
    )
    .max(20)
    .default([])
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

export const EnviarMensagemConversaAtendimentoSchema = z
  .object({
    tipo: z.enum(["TEXTO", "TEMPLATE", "IMAGEM", "DOCUMENTO", "RECIBO", "CATALOGO"]).default("TEXTO"),
    mensagem: z.string().trim().min(1).max(4000).optional(),
    templateId: z.string().trim().min(1).max(120).optional(),
    variaveis: z.record(z.string(), z.string()).default({}),
    categoria: z.enum(categoriasMensagemWhatsApp).default("service"),
    janelaAtendimentoAtiva: z.boolean().default(true),
    consentimentoMarketing: z.boolean().optional(),
    mediaUrl: z.string().trim().url().max(2048).optional(),
    entidadeTipo: CampoTarefaOpcionalSchema,
    entidadeId: CampoTarefaOpcionalSchema,
    contexto: z.record(z.string(), z.unknown()).default({})
  })
  .refine((dados) => Boolean(dados.mensagem || dados.templateId || dados.mediaUrl), {
    message: "Informe mensagem, templateId ou mediaUrl."
  });

export const CriarPedidoConversaAtendimentoSchema = CriarPedidoSchema.omit({ clienteId: true });

export const VerificarSlaConversasSchema = z.object({
  idadeMinutos: z.coerce.number().int().min(0).max(43_200).default(30),
  prioridade: z.enum(prioridadesTarefaOperacional).default("ALTA"),
  responsavelId: CampoTarefaOpcionalSchema,
  limite: z.coerce.number().int().min(1).max(500).default(100)
});

export const TransferirResponsavelOperacionalSchema = z.object({
  responsavelId: z.string().trim().min(1).max(120),
  motivo: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
  itens: z
    .array(
      z.object({
        tipo: z.enum(["conversa", "pedido", "tarefa"]),
        id: z.string().trim().min(1).max(120)
      })
    )
    .min(1)
    .max(50)
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
  modeloVenda: TextoOnboardingOpcionalSchema,
  tipoProdutoVendido: TextoOnboardingOpcionalSchema,
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
  areasEntrega: z.array(z.string().trim().min(1).max(120)).max(60).default([]),
  regrasComissao: z.record(z.string(), z.unknown()).default({}),
  politicaTrocaDevolucao: z.record(z.string(), z.unknown()).default({}),
  contasSociais: z.record(z.string(), z.unknown()).default({}),
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
