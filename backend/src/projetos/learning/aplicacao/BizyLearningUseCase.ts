import { createHash, randomUUID } from "node:crypto";
import type { RepositorioAutenticacao, RepositorioEventosOperacionais } from "../../../dominio/repositorios/contratos.js";
import type { EventoOperacional, NegocioBizy } from "../../../dominio/tipos.js";
import {
  extrairEventoPublicoLearning,
  montarProdutoPublico,
  normalizarTipoEventoPublicoLearning,
  resumirEventosPublicosLearning,
  type AnalyticsLearningTeam,
  type EventoPublicoLearning,
  type RegistrarEventoPublicoLearningInput
} from "./learningPublico.js";

export type NivelLearning = "INICIAL" | "INTERMEDIO" | "AVANCADO";
export type EstadoProgramaLearning = "RASCUNHO" | "EM_REVISAO" | "PUBLICADO" | "PAUSADO" | "ARQUIVADO" | "SUSPENSO";
export type FormatoProgramaLearning =
  | "CURSO"
  | "MICROLEARNING"
  | "LIVE"
  | "WORKSHOP"
  | "MENTORIA"
  | "CERTIFICACAO"
  | "COMUNIDADE"
  | "MEMBERSHIP"
  | "BUNDLE"
  | "TRILHO"
  | "TRILHA"
  | "ACADEMIA"
  | "DOWNLOAD"
  | "COHORT";
export type TipoAcessoLearning = "GRATUITO" | "PAGO" | "PRIVADO" | "CONVITE" | "OBRIGATORIO";
export type ModeloOfertaLearning = "GRATUITO" | "PAGAMENTO_UNICO" | "ASSINATURA" | "BUNDLE" | "ACESSO_MANUAL";
export type EstadoCompraLearning = "PENDENTE_VALIDACAO" | "CONFIRMADO" | "CANCELADO" | "REEMBOLSADO";
export type EstadoEntitlementLearning = "ATIVO" | "PENDENTE" | "EXPIRADO" | "REVOGADO";
export type EstadoAtribuicaoLearning = "ATIVA" | "CONCLUIDA" | "ATRASADA" | "REVOGADA";
export type EstadoCohortLearning = "AGENDADO" | "ABERTO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
export type EstadoComunidadeLearning = "ABERTA" | "PRIVADA" | "PAUSADA" | "ARQUIVADA";
export type AcessoComunidadeLearning = "ABERTO" | "ENTITLEMENT" | "MEMBERSHIP" | "CONVITE";
export type TipoPostComunidadeLearning = "ANUNCIO" | "PERGUNTA" | "RESPOSTA" | "MATERIAL" | "DESAFIO";
export type TipoAlvoModeracaoLearning = "PROGRAMA" | "COMUNIDADE" | "POST" | "PERFIL" | "MENTOR" | "CERTIFICADO";
export type MotivoModeracaoLearning =
  | "CONTEUDO_SENSIVEL"
  | "SPAM"
  | "DIREITOS_AUTORAIS"
  | "FRAUDE"
  | "ASSEDIO"
  | "INFORMACAO_ERRADA"
  | "OUTRO";
export type SeveridadeModeracaoLearning = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type EstadoCasoModeracaoLearning = "ABERTO" | "EM_REVISAO" | "OCULTO_TEMPORARIAMENTE" | "RESOLVIDO" | "REJEITADO";
export type AcaoModeracaoLearning = "COLOCAR_EM_REVISAO" | "OCULTAR_TEMPORARIAMENTE" | "RESOLVER" | "REJEITAR" | "REABRIR";

export interface PerfilLearning {
  codigo: string;
  nome: string;
  descricao: string;
  podeAdministrar: boolean;
}

export interface LicaoLearning {
  id: string;
  titulo: string;
  tipo: "VIDEO" | "TEXTO" | "CHECKLIST" | "QUIZ" | "LIVE";
  duracaoMinutos: number;
  accaoBizy?: string;
}

export interface ProgramaLearning {
  slug: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  categoria: string;
  familiaProduto: string;
  publico: string[];
  perfisAlvo: string[];
  nivel: NivelLearning;
  formato: FormatoProgramaLearning;
  duracaoMinutos: number;
  estado: EstadoProgramaLearning;
  destaque: boolean;
  visibilidade: "PUBLICO" | "TEAM";
  resultadoEsperado: string;
  ownerPerfil: string;
  mentorNome?: string | null;
  tipoAcesso: TipoAcessoLearning;
  oferta: OfertaLearning;
  previewSeguro: {
    resumo: string;
    licoesLiberadas: number;
    incluiConteudoPremium: boolean;
  };
  conteudoMinimoPublicado: boolean;
  certificadoConfigurado: boolean;
  politicaAcesso: {
    suporte: string;
    reembolso: string;
    certificado: string;
  };
  cohort?: {
    titulo: string;
    inicio?: string | null;
    vagas?: number | null;
  } | null;
  comunidade?: {
    titulo: string;
    membrosEstimados: number;
    topicos: string[];
  } | null;
  modulosRelacionados: string[];
  licoes: LicaoLearning[];
  origem: "BIZY" | "TEAM";
  criadoPorId?: string | null;
  criadoEm?: string | null;
}

export interface PerfilPublicoLearning {
  slug: string;
  negocioId: string;
  nomePublico: string;
  nomeNegocio: string;
  descricaoPublica: string;
  categorias: string[];
  canaisSuporte: string[];
  politicaSuporte: string;
  localizacao: string | null;
  urlPublica: string;
  programas: ProgramaLearning[];
  metricas: {
    programas: number;
    pagos: number;
    gratuitos: number;
    comunidades: number;
    certificados: number;
    minutos: number;
    receitaPotencial: number;
  };
}

export interface OfertaLearning {
  modelo: ModeloOfertaLearning;
  moeda: "AOA" | string;
  valor: number;
  valorPromocional?: number | null;
  cupoes: string[];
  periodoDias?: number | null;
  permiteComprovativo: boolean;
  emiteDocumento: boolean;
}

export interface CompraLearning {
  id: string;
  programaSlug: string;
  usuarioId: string;
  compradorNome: string;
  compradorEmail?: string | null;
  compradorTelefone?: string | null;
  estado: EstadoCompraLearning;
  valor: number;
  moeda: string;
  metodoPagamento?: string | null;
  referenciaPagamento?: string | null;
  comprovativoUrl?: string | null;
  factura?: DocumentoLearning | null;
  movimentoFinanceiro?: MovimentoLearning | null;
  entitlementId?: string | null;
  ajustadoEm?: string | null;
  ajustadoPorId?: string | null;
  motivoAjuste?: string | null;
  criadoEm: string;
}

export interface EntitlementLearning {
  id: string;
  programaSlug: string;
  usuarioId: string;
  negocioId: string;
  origem: "CHECKOUT" | "GRATUITO" | "TEAM" | "MANUAL";
  origemId: string;
  estado: EstadoEntitlementLearning;
  acessoDesde: string;
  acessoAte?: string | null;
  revogadoEm?: string | null;
  motivoRevogacao?: string | null;
}

export interface CertificadoLearning {
  id: string;
  programaSlug: string;
  usuarioId: string;
  negocioId: string;
  codigoVerificacao: string;
  emitidoEm: string;
  validadeAte?: string | null;
  estado: "VALIDO" | "REVOGADO";
}

export interface DocumentoLearning {
  tipo: "FACTURA_RECIBO" | "COMPROVATIVO_DIGITAL" | "INSCRICAO_GRATUITA";
  numero: string;
  origemTipo: "LEARNING";
  origemId: string;
  emitidoEm: string;
}

export interface MovimentoLearning {
  id: string;
  tipo: "ENTRADA";
  origemTipo: "LEARNING";
  origemId: string;
  descricao: string;
  valor: number;
  moeda: string;
  criadoEm: string;
}

export interface ProgressoLearning {
  programaSlug: string;
  inscrito: boolean;
  inscritoEm: string | null;
  licoesConcluidas: string[];
  totalLicoes: number;
  percentual: number;
  concluido: boolean;
}

export interface AtribuicaoLearning {
  id: string;
  programaSlug: string;
  programaTitulo: string;
  usuarioId?: string | null;
  perfilAlvo?: string | null;
  negocioId: string;
  atribuidoPorId: string;
  obrigatoria: boolean;
  prazoAte?: string | null;
  mensagem?: string | null;
  estado: EstadoAtribuicaoLearning;
  entitlementId?: string | null;
  criadoEm: string;
}

export interface CohortLearning {
  id: string;
  programaSlug: string;
  programaTitulo: string;
  titulo: string;
  estado: EstadoCohortLearning;
  inicioEm?: string | null;
  fimEm?: string | null;
  vagas?: number | null;
  inscritos: number;
  presencas: number;
  salaUrl?: string | null;
  replayUrl?: string | null;
  replayDisponivel: boolean;
  regrasEntrada: string;
  mensagem?: string | null;
  criadoPorId: string;
  criadoEm: string;
}

export interface PresencaCohortLearning {
  id: string;
  cohortId: string;
  programaSlug: string;
  usuarioId: string;
  presente: boolean;
  notas?: string | null;
  entitlementId?: string | null;
  registradoPorId: string;
  registradoEm: string;
}

export interface ComunidadeLearning {
  id: string;
  programaSlug: string;
  programaTitulo: string;
  titulo: string;
  estado: EstadoComunidadeLearning;
  acesso: AcessoComunidadeLearning;
  topicos: string[];
  regras: string;
  moderadores: string[];
  membrosEstimados: number;
  membros: number;
  posts: number;
  anuncios: number;
  perguntas: number;
  ultimaAtividade?: string | null;
  postsRecentes: PostComunidadeLearning[];
  criadoPorId: string;
  criadoEm: string;
}

export interface PostComunidadeLearning {
  id: string;
  comunidadeId: string;
  programaSlug: string;
  tipo: TipoPostComunidadeLearning;
  titulo?: string | null;
  conteudo: string;
  autorId: string;
  autorNome: string;
  fixado: boolean;
  criadoEm: string;
}

export interface CasoModeracaoLearning {
  id: string;
  alvoTipo: TipoAlvoModeracaoLearning;
  alvoId: string;
  tituloAlvo: string;
  programaSlug?: string | null;
  comunidadeId?: string | null;
  postId?: string | null;
  motivo: MotivoModeracaoLearning;
  severidade: SeveridadeModeracaoLearning;
  descricao: string;
  estado: EstadoCasoModeracaoLearning;
  ocultoPublicamente: boolean;
  denuncianteId: string;
  denuncianteNome: string;
  revisadoPorId?: string | null;
  decisao?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoMensagemChatLearning = "MENSAGEM" | "DECISAO" | "TAREFA" | "SUPORTE" | "ANUNCIO";
export type ContextoChatLearning = "PROGRAMA" | "COHORT" | "COMUNIDADE" | "SUPORTE";

export interface MensagemChatLearning {
  id: string;
  threadId: string;
  programaSlug: string;
  contexto: ContextoChatLearning;
  tipo: TipoMensagemChatLearning;
  conteudo: string;
  autorId: string;
  autorNome: string;
  autorPapel: string;
  mencoes: string[];
  criadoEm: string;
}

export interface ThreadChatLearning {
  id: string;
  programaSlug: string;
  programaTitulo: string;
  contexto: ContextoChatLearning;
  estado: "ABERTO" | "SEM_MENSAGENS";
  totalMensagens: number;
  ultimaMensagem: MensagemChatLearning | null;
  mensagens: MensagemChatLearning[];
}

export interface ChatInternoLearning {
  metricas: {
    threads: number;
    mensagens: number;
    decisoes: number;
    tarefas: number;
    suporte: number;
    ultimaAtividade: string | null;
  };
  threads: ThreadChatLearning[];
}

export interface CriarProgramaLearningInput {
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  categoria: string;
  familiaProduto?: string;
  publico?: string[];
  perfisAlvo?: string[];
  nivel?: NivelLearning;
  formato?: FormatoProgramaLearning;
  duracaoMinutos?: number;
  estado?: EstadoProgramaLearning;
  destaque?: boolean;
  visibilidade?: "PUBLICO" | "TEAM";
  resultadoEsperado?: string;
  ownerPerfil?: string;
  mentorNome?: string;
  tipoAcesso?: TipoAcessoLearning;
  oferta?: Partial<OfertaLearning>;
  politicaAcesso?: Partial<ProgramaLearning["politicaAcesso"]>;
  modulosRelacionados?: string[];
  licoes?: Array<{
    titulo: string;
    tipo?: LicaoLearning["tipo"];
    duracaoMinutos?: number;
    accaoBizy?: string;
  }>;
}

export interface CheckoutLearningInput {
  programaSlug: string;
  compradorNome?: string;
  compradorEmail?: string;
  compradorTelefone?: string;
  metodoPagamento?: string;
  referenciaPagamento?: string;
  comprovativoUrl?: string;
  cupao?: string;
  confirmarPagamento?: boolean;
}

export interface AjustarCompraLearningInput {
  estado: Extract<EstadoCompraLearning, "CANCELADO" | "REEMBOLSADO">;
  motivo?: string;
  revogarAcesso?: boolean;
}

export interface EnviarMensagemChatLearningInput {
  programaSlug: string;
  conteudo: string;
  tipo?: TipoMensagemChatLearning;
  contexto?: ContextoChatLearning;
  mencoes?: string[];
}

export interface AtribuirProgramaLearningInput {
  usuarioId?: string;
  perfilAlvo?: string;
  obrigatoria?: boolean;
  prazoAte?: string | null;
  mensagem?: string;
}

export interface AbrirCohortLearningInput {
  titulo?: string;
  inicioEm?: string | null;
  fimEm?: string | null;
  vagas?: number | null;
  salaUrl?: string | null;
  replayUrl?: string | null;
  replayDisponivel?: boolean;
  regrasEntrada?: string;
  mensagem?: string;
}

export interface RegistrarPresencaCohortLearningInput {
  usuarioId?: string;
  presente?: boolean;
  notas?: string;
}

export interface CriarComunidadeLearningInput {
  titulo?: string;
  acesso?: AcessoComunidadeLearning;
  topicos?: string[];
  regras?: string;
  moderadores?: string[];
}

export interface PublicarPostComunidadeLearningInput {
  tipo?: TipoPostComunidadeLearning;
  titulo?: string;
  conteudo: string;
  fixado?: boolean;
}

export interface DenunciarConteudoLearningInput {
  alvoTipo: TipoAlvoModeracaoLearning;
  alvoId: string;
  programaSlug?: string;
  comunidadeId?: string;
  postId?: string;
  motivo?: MotivoModeracaoLearning;
  severidade?: SeveridadeModeracaoLearning;
  descricao: string;
}

export interface DecidirModeracaoLearningInput {
  acao?: AcaoModeracaoLearning;
  estado?: EstadoCasoModeracaoLearning;
  decisao?: string;
  ocultoPublicamente?: boolean;
}

const TOPICO_LEARNING = "learning";

const PERFIS_LEARNING: PerfilLearning[] = [
  { codigo: "DONO", nome: "Dono de negocio", descricao: "Administra programas, perfis, publicacao e impacto no negocio.", podeAdministrar: true },
  { codigo: "ADMIN", nome: "Administrador Team", descricao: "Gere trilhos, mentores, cohorts e progresso da equipa.", podeAdministrar: true },
  { codigo: "GESTOR", nome: "Gestor de equipa", descricao: "Atribui aprendizagem por funcao e acompanha conclusao.", podeAdministrar: true },
  { codigo: "VENDEDOR", nome: "Vendedor", descricao: "Aprende playbooks de venda, live, Market e follow-up.", podeAdministrar: false },
  { codigo: "ATENDENTE", nome: "Atendente", descricao: "Aprende atendimento, WhatsApp, respostas e escalonamento.", podeAdministrar: false },
  { codigo: "FINANCEIRO", nome: "Financeiro", descricao: "Aprende comprovativos, facturas, recibos e reconciliacao.", podeAdministrar: false },
  { codigo: "AFILIADO", nome: "Afiliado", descricao: "Aprende campanhas, links, atribuicao e boas praticas.", podeAdministrar: false },
  { codigo: "CRIADOR", nome: "Criador", descricao: "Aprende conteudo, campanhas e conversao social.", podeAdministrar: false }
];

const PROGRAMAS_BASE: ProgramaLearning[] = [
  programaBase({
    slug: "operar-bizy-team",
    titulo: "Operar o Bizy Team no dia a dia",
    subtitulo: "A rotina minima para gerir pedidos, equipa, tarefas e prioridades.",
    descricao: "Trilho inicial para transformar o Team no centro operacional da loja sem depender de conversas soltas.",
    categoria: "Team",
    publico: ["Donos", "Gestores"],
    perfisAlvo: ["DONO", "ADMIN", "GESTOR"],
    nivel: "INICIAL",
    formato: "TRILHO",
    duracaoMinutos: 42,
    estado: "PUBLICADO",
    destaque: true,
    visibilidade: "PUBLICO",
    resultadoEsperado: "Equipa a operar pedidos, tarefas e passagem de contexto dentro do Bizy.",
    ownerPerfil: "DONO",
    mentorNome: "Equipa Bizy",
    cohort: { titulo: "Turma de activacao Team", inicio: null, vagas: 40 },
    comunidade: { titulo: "Comunidade Team Operators", membrosEstimados: 128, topicos: ["rotina diaria", "perfis", "tarefas"] },
    modulosRelacionados: ["team-core", "pedidos", "tarefas"],
    licoes: [
      { id: "operar-bizy-team:mapa", titulo: "Mapa do Team e papeis", tipo: "TEXTO", duracaoMinutos: 6, accaoBizy: "Rever membros e permissoes no Team" },
      { id: "operar-bizy-team:rotina", titulo: "Rotina diaria de operacao", tipo: "CHECKLIST", duracaoMinutos: 12, accaoBizy: "Abrir painel e tarefas do dia" },
      { id: "operar-bizy-team:passagem", titulo: "Passagem de contexto sem perder cliente", tipo: "VIDEO", duracaoMinutos: 10, accaoBizy: "Criar nota/tarefa numa conversa real" }
    ],
    origem: "BIZY"
  }),
  programaBase({
    slug: "vender-no-bizy-market",
    titulo: "Vender no Bizy Market",
    subtitulo: "Publicacao, elegibilidade, oferta e operacao de fornecedor.",
    descricao: "Programa para fornecedores que querem transformar catalogo em descoberta e pedidos reais no Market.",
    categoria: "Market",
    publico: ["Fornecedores", "Lojistas", "Criadores"],
    perfisAlvo: ["DONO", "ADMIN", "VENDEDOR", "CRIADOR"],
    nivel: "INICIAL",
    formato: "CERTIFICACAO",
    duracaoMinutos: 55,
    estado: "PUBLICADO",
    destaque: true,
    visibilidade: "PUBLICO",
    resultadoEsperado: "Loja com produtos elegiveis, publicados e preparados para checkout.",
    ownerPerfil: "GESTOR",
    mentorNome: "Bizy Market",
    tipoAcesso: "PAGO",
    oferta: {
      modelo: "PAGAMENTO_UNICO",
      moeda: "AOA",
      valor: 25000,
      valorPromocional: 18000,
      cupoes: ["FORNECEDOR10"],
      periodoDias: null,
      permiteComprovativo: true,
      emiteDocumento: true
    },
    cohort: { titulo: "Fornecedor Market pronto", inicio: null, vagas: 60 },
    comunidade: { titulo: "Comunidade de Fornecedores", membrosEstimados: 210, topicos: ["stock", "vitrine", "checkout"] },
    modulosRelacionados: ["market", "catalogo", "checkout"],
    licoes: [
      { id: "vender-no-bizy-market:elegibilidade", titulo: "Produto elegivel e visivel", tipo: "CHECKLIST", duracaoMinutos: 8, accaoBizy: "Rever produtos no Studio" },
      { id: "vender-no-bizy-market:oferta", titulo: "Oferta, preco e prova visual", tipo: "VIDEO", duracaoMinutos: 12, accaoBizy: "Actualizar fotos, preco e categoria" },
      { id: "vender-no-bizy-market:pedido", titulo: "Do interesse ao pedido pago", tipo: "TEXTO", duracaoMinutos: 10, accaoBizy: "Simular checkout e repasse" }
    ],
    origem: "BIZY"
  }),
  programaBase({
    slug: "atendimento-whatsapp-com-governanca",
    titulo: "Atendimento WhatsApp com governanca",
    subtitulo: "Responder rapido sem perder opt-in, contexto e handoff humano.",
    descricao: "Playbook para equipas que atendem por WhatsApp, Instagram e conversas internas no Bizy.",
    categoria: "Atendimento",
    publico: ["Atendentes", "Vendedores", "Gestores"],
    perfisAlvo: ["ATENDENTE", "VENDEDOR", "GESTOR", "ADMIN"],
    nivel: "INTERMEDIO",
    formato: "TRILHO",
    duracaoMinutos: 38,
    estado: "PUBLICADO",
    destaque: false,
    visibilidade: "PUBLICO",
    resultadoEsperado: "Conversas com contexto, prioridade e proxima accao sem fuga para canais paralelos.",
    ownerPerfil: "GESTOR",
    mentorNome: "Operacao Bizy",
    cohort: null,
    comunidade: { titulo: "Atendimento social commerce", membrosEstimados: 94, topicos: ["SLA", "templates", "handoff"] },
    modulosRelacionados: ["conversas", "whatsapp", "clientes"],
    licoes: [
      { id: "atendimento-whatsapp-com-governanca:contexto", titulo: "Contexto antes da resposta", tipo: "TEXTO", duracaoMinutos: 7, accaoBizy: "Abrir conversa com Cliente 360" },
      { id: "atendimento-whatsapp-com-governanca:template", titulo: "Quando usar template", tipo: "QUIZ", duracaoMinutos: 9, accaoBizy: "Rever respostas rapidas" },
      { id: "atendimento-whatsapp-com-governanca:handoff", titulo: "Escalar sem perder historico", tipo: "CHECKLIST", duracaoMinutos: 8, accaoBizy: "Criar tarefa de atendimento" }
    ],
    origem: "BIZY"
  }),
  programaBase({
    slug: "financas-comprovativos-facturas",
    titulo: "Comprovativos, facturas e recibos",
    subtitulo: "Como ligar pagamento, pedido, movimento financeiro e documento.",
    descricao: "Trilho operacional para evitar lucro duplicado, factura solta e comprovativo sem rasto.",
    categoria: "Financas",
    publico: ["Financeiros", "Donos", "Gestores"],
    perfisAlvo: ["FINANCEIRO", "DONO", "ADMIN"],
    nivel: "INTERMEDIO",
    formato: "TRILHO",
    duracaoMinutos: 44,
    estado: "PUBLICADO",
    destaque: false,
    visibilidade: "PUBLICO",
    resultadoEsperado: "Pagamento, factura-recibo, recibo e ledger ligados por origem auditavel.",
    ownerPerfil: "FINANCEIRO",
    mentorNome: "Bizy Financas",
    tipoAcesso: "PAGO",
    oferta: {
      modelo: "PAGAMENTO_UNICO",
      moeda: "AOA",
      valor: 15000,
      valorPromocional: null,
      cupoes: [],
      periodoDias: null,
      permiteComprovativo: true,
      emiteDocumento: true
    },
    cohort: null,
    comunidade: { titulo: "Financas operacionais", membrosEstimados: 76, topicos: ["facturas", "recibos", "comprovativos"] },
    modulosRelacionados: ["financas", "pedidos", "checkout"],
    licoes: [
      { id: "financas-comprovativos-facturas:movimento", titulo: "Movimento com origem", tipo: "TEXTO", duracaoMinutos: 8, accaoBizy: "Abrir Financas > Movimentos" },
      { id: "financas-comprovativos-facturas:factura-recibo", titulo: "Factura-recibo sem duplicar entrada", tipo: "CHECKLIST", duracaoMinutos: 12, accaoBizy: "Relacionar factura a movimento existente" },
      { id: "financas-comprovativos-facturas:saldo", titulo: "Validar saldo e documentos", tipo: "QUIZ", duracaoMinutos: 8, accaoBizy: "Comparar facturas e fluxo de caixa" }
    ],
    origem: "BIZY"
  })
];

type ProgramaLearningSeed = Omit<
  ProgramaLearning,
  "familiaProduto" | "tipoAcesso" | "oferta" | "previewSeguro" | "conteudoMinimoPublicado" | "certificadoConfigurado" | "politicaAcesso"
> & Partial<Pick<
  ProgramaLearning,
  "familiaProduto" | "tipoAcesso" | "oferta" | "previewSeguro" | "conteudoMinimoPublicado" | "certificadoConfigurado" | "politicaAcesso"
>>;

function programaBase(dados: ProgramaLearningSeed): ProgramaLearning {
  const tipoAcesso = dados.tipoAcesso ?? "GRATUITO";
  return {
    ...dados,
    familiaProduto: dados.familiaProduto ?? inferirFamiliaProduto(dados.formato),
    tipoAcesso,
    oferta: normalizarOferta(dados.oferta, tipoAcesso),
    previewSeguro: dados.previewSeguro ?? {
      resumo: dados.subtitulo,
      licoesLiberadas: tipoAcesso === "PAGO" ? 1 : Math.min(2, dados.licoes.length),
      incluiConteudoPremium: false
    },
    conteudoMinimoPublicado: dados.conteudoMinimoPublicado ?? dados.licoes.length > 0,
    certificadoConfigurado: dados.certificadoConfigurado ?? ["CERTIFICACAO", "CURSO", "TRILHO", "TRILHA", "ACADEMIA"].includes(dados.formato),
    politicaAcesso: dados.politicaAcesso ?? {
      suporte: "Suporte pelo perfil Learning responsável e pelo Team quando aplicável.",
      reembolso: tipoAcesso === "PAGO" ? "Reembolso sujeito ao estado de consumo e à política publicada na compra." : "Produto gratuito sem cobrança associada.",
      certificado: ["CERTIFICACAO", "CURSO", "TRILHO", "TRILHA", "ACADEMIA"].includes(dados.formato)
        ? "Certificado emitido após conclusão dos critérios configurados."
        : "Sem certificado obrigatório."
    }
  };
}

function inferirFamiliaProduto(formato: FormatoProgramaLearning): string {
  const mapa: Record<FormatoProgramaLearning, string> = {
    CURSO: "Cursos estruturados",
    MICROLEARNING: "Microlearning",
    LIVE: "Lives e workshops",
    WORKSHOP: "Lives e workshops",
    MENTORIA: "Mentorias e coaching",
    CERTIFICACAO: "Certificacoes e recertificacoes",
    COMUNIDADE: "Comunidades e memberships",
    MEMBERSHIP: "Comunidades e memberships",
    BUNDLE: "Bundles, trilhas e academias",
    TRILHO: "Bundles, trilhas e academias",
    TRILHA: "Bundles, trilhas e academias",
    ACADEMIA: "Bundles, trilhas e academias",
    DOWNLOAD: "Downloads digitais",
    COHORT: "Lives e workshops"
  };
  return mapa[formato];
}

function normalizarOferta(oferta: Partial<OfertaLearning> | undefined, tipoAcesso: TipoAcessoLearning): OfertaLearning {
  const valor = Math.max(0, Math.trunc(oferta?.valor ?? 0));
  const modelo = oferta?.modelo ?? (tipoAcesso === "PAGO" ? "PAGAMENTO_UNICO" : tipoAcesso === "GRATUITO" ? "GRATUITO" : "ACESSO_MANUAL");
  return {
    modelo,
    moeda: oferta?.moeda ?? "AOA",
    valor,
    valorPromocional: typeof oferta?.valorPromocional === "number" ? Math.max(0, Math.trunc(oferta.valorPromocional)) : null,
    cupoes: normalizarLista(oferta?.cupoes, []),
    periodoDias: typeof oferta?.periodoDias === "number" ? Math.max(1, Math.trunc(oferta.periodoDias)) : null,
    permiteComprovativo: oferta?.permiteComprovativo ?? tipoAcesso === "PAGO",
    emiteDocumento: oferta?.emiteDocumento ?? tipoAcesso === "PAGO"
  };
}

export class BizyLearningUseCase {
  constructor(
    private readonly eventosOperacionais: RepositorioEventosOperacionais,
    private readonly autenticacao: RepositorioAutenticacao
  ) {}

  async obterHomePublica() {
    const perfisPublicos = await this.listarPerfisPublicos();
    const programasBase = PROGRAMAS_BASE.filter((programa) => programa.estado === "PUBLICADO" && programa.visibilidade === "PUBLICO");
    const programas = deduplicarProgramasPublicos([
      ...programasBase,
      ...perfisPublicos.flatMap((perfil) => perfil.programas)
    ]);
    return {
      produto: "Bizy Learning",
      tese: "Plataforma de produtos digitais, formacao, comunidade e monetizacao de conhecimento do ecossistema Bizy.",
      metricas: {
        programas: programas.length,
        produtosDigitais: programas.length,
        pagos: programas.filter((programa) => programa.tipoAcesso === "PAGO").length,
        gratuitos: programas.filter((programa) => programa.tipoAcesso !== "PAGO").length,
        trilhos: programas.filter((programa) => programa.formato === "TRILHO" || programa.formato === "TRILHA").length,
        comunidades: programas.filter((programa) => programa.comunidade).length,
        perfisPublicos: perfisPublicos.length,
        minutos: programas.reduce((total, programa) => total + programa.duracaoMinutos, 0),
        receitaPotencial: programas.reduce((total, programa) => total + valorOferta(programa), 0)
      },
      perfis: PERFIS_LEARNING,
      perfisPublicos,
      destaques: programas.filter((programa) => programa.destaque),
      programas,
      categorias: [...new Set(programas.map((programa) => programa.categoria))],
      familias: [...new Set(programas.map((programa) => programa.familiaProduto))]
    };
  }

  async obterProgramaPublico(slug: string) {
    const programa = (await this.obterHomePublica()).programas.find((item) => item.slug === slug);
    if (!programa) throw new Error("Programa Learning não encontrado ou não publicado.");
    return { programa };
  }

  async obterProdutoPublico(slug: string) {
    const normalizado = slugify(slug);
    const home = await this.obterHomePublica();
    const programa = home.programas.find((item) => item.slug === normalizado);
    if (!programa) throw new Error("Produto Learning não encontrado ou não publicado.");
    const perfil = home.perfisPublicos.find((item) => item.programas.some((produto) => produto.slug === programa.slug));
    const produto = montarProdutoPublico(programa, perfil ?? null, home.programas);
    return { programa: produto.programa, produto };
  }

  async obterPerfilPublico(slug: string) {
    const normalizado = slugify(slug);
    const perfil = (await this.listarPerfisPublicos()).find((item) => item.slug === normalizado);
    if (!perfil) throw new Error("Perfil Learning não encontrado ou não publicado.");
    return { perfil };
  }

  async registrarEventoPublico(dados: RegistrarEventoPublicoLearningInput) {
    const normalizado = slugify(dados.programaSlug);
    const home = await this.obterHomePublica();
    const programa = home.programas.find((item) => item.slug === normalizado);
    if (!programa) throw new Error("Produto Learning não encontrado para analytics.");
    const perfil = home.perfisPublicos.find((item) =>
      (!dados.perfilSlug || item.slug === slugify(dados.perfilSlug)) &&
      item.programas.some((produto) => produto.slug === programa.slug)
    ) ?? home.perfisPublicos.find((item) => item.programas.some((produto) => produto.slug === programa.slug)) ?? null;
    const negocioId = perfil?.negocioId ?? "bizy-learning";
    const criadoEm = new Date().toISOString();
    const eventoPublico: EventoPublicoLearning = {
      id: randomUUID(),
      tipo: normalizarTipoEventoPublicoLearning(dados.tipo),
      programaSlug: programa.slug,
      perfilSlug: perfil?.slug ?? null,
      negocioId,
      origemPrograma: programa.origem,
      familiaProduto: programa.familiaProduto,
      categoria: programa.categoria,
      fonte: dados.fonte?.trim().slice(0, 120) || null,
      criadoEm
    };

    if (!perfil) {
      // Produtos oficiais ainda nao têm tenant persistido; evitamos violar FK sem bloquear a vitrine pública.
      return {
        evento: eventoPublico,
        duplicado: false
      };
    }

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_EVENTO_PUBLICO",
      entidadeTipo: "learning_public_event",
      entidadeId: programa.slug,
      idempotencyKey: `learning:publico:${eventoPublico.tipo}:${programa.slug}:${eventoPublico.id}`,
      payload: { evento: eventoPublico },
      estado: "PROCESSADO"
    });

    return {
      evento: extrairEventoPublicoLearning(evento) ?? eventoPublico,
      duplicado
    };
  }

  async obterResumoTeam(negocioId: string, usuarioId: string, papel: string, permissoes: string[]) {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const progresso = await this.obterProgresso(negocioId, usuarioId);
    const compras = await this.listarCompras(negocioId);
    const entitlements = await this.listarEntitlements(negocioId);
    const certificados = await this.listarCertificados(negocioId);
    const atribuicoes = await this.listarAtribuicoes(negocioId);
    const cohorts = await this.listarCohorts(negocioId);
    const comunidades = await this.listarComunidades(negocioId);
    const moderacao = await this.listarCasosModeracao(negocioId);
    const analytics = await this.resumirAnalyticsPublico(negocioId, programas);
    const progressoPorSlug = new Map(progresso.programas.map((item) => [item.programaSlug, item]));
    const papelNormalizado = papel.toUpperCase();
    const podeAdministrar = podeAdministrarLearning(papelNormalizado, permissoes);
    const recomendados = programas
      .filter((programa) => programa.estado === "PUBLICADO")
      .filter((programa) => programa.perfisAlvo.includes(papelNormalizado) || programa.perfisAlvo.includes("GESTOR"))
      .slice(0, 4);
    const publicados = programas.filter((programa) => programa.estado === "PUBLICADO").length;
    const inscritos = progresso.programas.filter((item) => item.inscrito).length;
    const atribuicoesVisiveis = podeAdministrar
      ? atribuicoes
      : atribuicoes.filter((atribuicao) => atribuicao.usuarioId === usuarioId || atribuicao.perfilAlvo === papelNormalizado);

    const chat = await this.listarChatInterno(negocioId, usuarioId, papel);

    return {
      podeAdministrar,
      perfis: PERFIS_LEARNING,
      programas: programas.map((programa) => ({
        ...programa,
        progresso: progressoPorSlug.get(programa.slug) ?? progressoVazio(programa)
      })),
      recomendados,
      metricas: {
        programas: programas.length,
        publicados,
        rascunhos: programas.filter((programa) => programa.estado === "RASCUNHO").length,
        produtosPagos: programas.filter((programa) => programa.tipoAcesso === "PAGO").length,
        comprasConfirmadas: compras.filter((compra) => compra.estado === "CONFIRMADO").length,
        receitaLearning: compras
          .filter((compra) => compra.estado === "CONFIRMADO")
          .reduce((total, compra) => total + compra.valor, 0),
        entitlementsAtivos: entitlements.filter((entitlement) => entitlement.estado === "ATIVO").length,
        certificados: certificados.filter((certificado) => certificado.estado === "VALIDO").length,
        inscritos,
        concluidos: progresso.programas.filter((item) => item.concluido).length,
        atribuicoesAtivas: atribuicoes.filter((atribuicao) => atribuicao.estado === "ATIVA").length,
        formacoesObrigatorias: atribuicoes.filter((atribuicao) => atribuicao.obrigatoria).length,
        atribuicoesAtrasadas: atribuicoes.filter((atribuicao) => atribuicao.estado === "ATRASADA").length,
        cohortsAtivos: cohorts.filter((cohort) => cohort.estado === "ABERTO" || cohort.estado === "EM_ANDAMENTO" || cohort.estado === "AGENDADO").length,
        vagasCohorts: cohorts.reduce((total, cohort) => total + (cohort.vagas ?? 0), 0),
        presencasCohorts: cohorts.reduce((total, cohort) => total + cohort.presencas, 0),
        replaysDisponiveis: cohorts.filter((cohort) => cohort.replayDisponivel || cohort.replayUrl).length,
        comunidadesAtivas: comunidades.filter((comunidade) => comunidade.estado === "ABERTA" || comunidade.estado === "PRIVADA").length,
        postsComunidade: comunidades.reduce((total, comunidade) => total + comunidade.posts, 0),
        anunciosComunidade: comunidades.reduce((total, comunidade) => total + comunidade.anuncios, 0),
        perguntasComunidade: comunidades.reduce((total, comunidade) => total + comunidade.perguntas, 0),
        denunciasLearning: moderacao.length,
        casosModeracaoAbertos: moderacao.filter((caso) => ["ABERTO", "EM_REVISAO", "OCULTO_TEMPORARIAMENTE"].includes(caso.estado)).length,
        conteudosOcultosLearning: moderacao.filter((caso) => caso.ocultoPublicamente && caso.estado !== "RESOLVIDO" && caso.estado !== "REJEITADO").length,
        visualizacoesPublicas: analytics.metricas.visualizacoesPublicas,
        previewsPublicos: analytics.metricas.previewsPublicos,
        ctasCheckoutLearning: analytics.metricas.ctasCheckout,
        ctasInscricaoLearning: analytics.metricas.ctasInscricao
      },
      compras: compras.slice(0, 20),
      entitlements: entitlements.filter((entitlement) => entitlement.usuarioId === usuarioId || podeAdministrar).slice(0, 50),
      certificados: certificados.filter((certificado) => certificado.usuarioId === usuarioId || podeAdministrar).slice(0, 50),
      atribuicoes: atribuicoesVisiveis.slice(0, 50),
      cohorts: cohorts.slice(0, 50),
      comunidades: comunidades.slice(0, 50),
      moderacao: moderacao.slice(0, 50),
      analytics,
      chat
    };
  }

  async criarProgramaTeam(negocioId: string, usuarioId: string, dados: CriarProgramaLearningInput) {
    const slug = slugify(dados.titulo);
    const tipoAcesso = dados.tipoAcesso ?? ((dados.oferta?.valor ?? 0) > 0 ? "PAGO" : "GRATUITO");
    const programa: ProgramaLearning = programaBase({
      slug,
      titulo: dados.titulo.trim(),
      subtitulo: dados.subtitulo?.trim() || "Programa criado no Team para uma necessidade real da equipa.",
      descricao: dados.descricao?.trim() || "Programa Learning administrado pelo Team.",
      categoria: dados.categoria.trim(),
      familiaProduto: dados.familiaProduto?.trim() || undefined,
      publico: normalizarLista(dados.publico, ["Equipa"]),
      perfisAlvo: normalizarLista(dados.perfisAlvo, ["DONO", "ADMIN", "GESTOR"]),
      nivel: dados.nivel ?? "INICIAL",
      formato: dados.formato ?? "TRILHO",
      duracaoMinutos: dados.duracaoMinutos ?? somarDuracao(dados.licoes),
      estado: dados.estado ?? "RASCUNHO",
      destaque: dados.destaque ?? false,
      visibilidade: dados.visibilidade ?? "TEAM",
      resultadoEsperado: dados.resultadoEsperado?.trim() || "Equipa com uma pratica operacional aplicada no Bizy.",
      ownerPerfil: dados.ownerPerfil?.trim().toUpperCase() || "DONO",
      mentorNome: dados.mentorNome?.trim() || null,
      tipoAcesso,
      oferta: normalizarOferta(dados.oferta, tipoAcesso),
      politicaAcesso: {
        suporte: dados.politicaAcesso?.suporte?.trim() || "Suporte pelo perfil Learning responsável.",
        reembolso: dados.politicaAcesso?.reembolso?.trim() || (tipoAcesso === "PAGO" ? "Reembolso sujeito ao estado de consumo." : "Sem cobrança associada."),
        certificado: dados.politicaAcesso?.certificado?.trim() || "Certificado conforme critérios do produto."
      },
      cohort: dados.formato === "COHORT" ? { titulo: `Cohort ${dados.titulo.trim()}`, inicio: null, vagas: null } : null,
      comunidade: { titulo: `Comunidade ${dados.titulo.trim()}`, membrosEstimados: 0, topicos: dados.modulosRelacionados ?? [] },
      modulosRelacionados: normalizarLista(dados.modulosRelacionados, ["team-core"]),
      licoes: normalizarLicoes(slug, dados.licoes),
      origem: "TEAM",
      criadoPorId: usuarioId,
      criadoEm: new Date().toISOString()
    });

    validarElegibilidadePublicacao(programa);

    await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_PROGRAMA_CRIADO",
      entidadeTipo: "learning_program",
      entidadeId: slug,
      idempotencyKey: `learning:programa:${slug}`,
      payload: { programa, usuarioId },
      estado: "PROCESSADO"
    });

    return { programa };
  }

  async alterarPublicacao(negocioId: string, usuarioId: string, slug: string, dados: { estado: EstadoProgramaLearning; destaque?: boolean; visibilidade?: "PUBLICO" | "TEAM" }) {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const programa = programas.find((item) => item.slug === slug);
    if (!programa) throw new Error("Programa Learning não encontrado.");
    const programaAtualizado = {
      ...programa,
      estado: dados.estado,
      destaque: dados.destaque ?? programa.destaque,
      visibilidade: dados.visibilidade ?? programa.visibilidade
    } satisfies ProgramaLearning;
    validarElegibilidadePublicacao(programaAtualizado);

    await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_PROGRAMA_PUBLICACAO_ALTERADA",
      entidadeTipo: "learning_program",
      entidadeId: slug,
      idempotencyKey: `learning:programa:${slug}:publicacao:${Date.now()}`,
      payload: { slug, ...dados, usuarioId },
      estado: "PROCESSADO"
    });

    return {
      programa: programaAtualizado
    };
  }

  async atribuirProgramaTeam(negocioId: string, atribuidoPorId: string, slug: string, dados: AtribuirProgramaLearningInput) {
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === slug);
    if (!programa) throw new Error("Programa Learning não encontrado para atribuição.");
    if (programa.estado !== "PUBLICADO") {
      throw new Error("Atribuição Learning exige produto publicado para evitar acesso a conteúdo incompleto.");
    }

    const usuarioAlvo = dados.usuarioId?.trim() || null;
    const perfilAlvo = dados.perfilAlvo?.trim().toUpperCase() || null;
    if (!usuarioAlvo && !perfilAlvo) {
      throw new Error("Atribuição Learning exige membro ou perfil Team alvo.");
    }

    const prazoAte = normalizarPrazoAte(dados.prazoAte);
    const targetKey = usuarioAlvo ?? `perfil:${perfilAlvo}`;
    const atribuicaoId = gerarIdAtribuicao(negocioId, programa.slug, targetKey, prazoAte);
    let entitlement: EntitlementLearning | null = null;

    if (usuarioAlvo) {
      entitlement = await this.registrarEntitlement(negocioId, usuarioAlvo, programa, "TEAM", atribuicaoId);
      await this.registrarInscricao(negocioId, usuarioAlvo, programa.slug, "ATRIBUICAO_TEAM");
    }

    const atribuicao: AtribuicaoLearning = {
      id: atribuicaoId,
      programaSlug: programa.slug,
      programaTitulo: programa.titulo,
      usuarioId: usuarioAlvo,
      perfilAlvo,
      negocioId,
      atribuidoPorId,
      obrigatoria: dados.obrigatoria ?? true,
      prazoAte,
      mensagem: dados.mensagem?.trim() || null,
      estado: "ATIVA",
      entitlementId: entitlement?.id ?? null,
      criadoEm: new Date().toISOString()
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_ATRIBUICAO_TEAM_CRIADA",
      entidadeTipo: "learning_assignment",
      entidadeId: atribuicao.id,
      idempotencyKey: `learning:atribuicao:${atribuicao.id}`,
      payload: { atribuicao, programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return {
      atribuicao: extrairAtribuicao(evento) ?? atribuicao,
      entitlement,
      duplicado
    };
  }

  async abrirCohortTeam(negocioId: string, criadoPorId: string, slug: string, dados: AbrirCohortLearningInput) {
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === slug);
    if (!programa) throw new Error("Programa Learning não encontrado para cohort.");
    if (programa.estado !== "PUBLICADO") {
      throw new Error("Cohort Learning exige produto publicado para evitar turma sem conteúdo liberado.");
    }

    const inicioEm = normalizarDataIsoOpcional(dados.inicioEm, "Início do cohort inválido.");
    const fimEm = normalizarDataIsoOpcional(dados.fimEm, "Fim do cohort inválido.");
    if (inicioEm && fimEm && new Date(fimEm).getTime() < new Date(inicioEm).getTime()) {
      throw new Error("Fim do cohort não pode ser anterior ao início.");
    }

    const criadoEm = new Date().toISOString();
    const cohort: CohortLearning = {
      id: gerarIdCohort(negocioId, programa.slug, dados.titulo || programa.titulo, criadoEm),
      programaSlug: programa.slug,
      programaTitulo: programa.titulo,
      titulo: dados.titulo?.trim() || programa.cohort?.titulo || `Turma ${programa.titulo}`,
      estado: estadoTemporalCohort({
        estado: inicioEm && new Date(inicioEm).getTime() > Date.now() ? "AGENDADO" : "ABERTO",
        inicioEm,
        fimEm
      }).estado,
      inicioEm,
      fimEm,
      vagas: typeof dados.vagas === "number" ? Math.max(1, Math.trunc(dados.vagas)) : programa.cohort?.vagas ?? null,
      inscritos: 0,
      presencas: 0,
      salaUrl: dados.salaUrl?.trim() || null,
      replayUrl: dados.replayUrl?.trim() || null,
      replayDisponivel: dados.replayDisponivel ?? Boolean(dados.replayUrl),
      regrasEntrada: dados.regrasEntrada?.trim() || regraEntradaPadrao(programa),
      mensagem: dados.mensagem?.trim() || null,
      criadoPorId,
      criadoEm
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COHORT_ABERTO",
      entidadeTipo: "learning_cohort",
      entidadeId: cohort.id,
      idempotencyKey: `learning:cohort:${cohort.id}`,
      payload: { cohort, programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return {
      cohort: extrairCohort(evento) ?? cohort,
      duplicado
    };
  }

  async registrarPresencaCohort(
    negocioId: string,
    registradoPorId: string,
    cohortId: string,
    dados: RegistrarPresencaCohortLearningInput
  ) {
    const cohorts = await this.listarCohorts(negocioId);
    const cohort = cohorts.find((item) => item.id === cohortId);
    if (!cohort) throw new Error("Cohort Learning não encontrado.");
    if (cohort.estado === "CANCELADO") throw new Error("Não é possível registar presença em cohort cancelado.");

    const usuarioAlvo = dados.usuarioId?.trim() || registradoPorId;
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === cohort.programaSlug);
    if (!programa) throw new Error("Programa do cohort Learning não encontrado.");

    const presencasExistentes = await this.listarPresencasCohort(negocioId, cohort.id);
    const usuariosInscritos = new Set(presencasExistentes.map((presenca) => presenca.usuarioId));
    if (!usuariosInscritos.has(usuarioAlvo) && cohort.vagas && usuariosInscritos.size >= cohort.vagas) {
      throw new Error("Cohort Learning atingiu o limite de vagas.");
    }

    let entitlement: EntitlementLearning | null = null;
    if (dados.presente !== false && !(await this.temEntitlementAtivo(negocioId, usuarioAlvo, programa.slug))) {
      entitlement = await this.registrarEntitlement(negocioId, usuarioAlvo, programa, "TEAM", `cohort:${cohort.id}`);
      await this.registrarInscricao(negocioId, usuarioAlvo, programa.slug, "COHORT");
    }

    const registradoEm = new Date().toISOString();
    const presenca: PresencaCohortLearning = {
      id: gerarIdPresencaCohort(cohort.id, usuarioAlvo),
      cohortId: cohort.id,
      programaSlug: cohort.programaSlug,
      usuarioId: usuarioAlvo,
      presente: dados.presente !== false,
      notas: dados.notas?.trim() || null,
      entitlementId: entitlement?.id ?? null,
      registradoPorId,
      registradoEm
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COHORT_PRESENCA_REGISTADA",
      entidadeTipo: "learning_cohort_presence",
      entidadeId: presenca.id,
      idempotencyKey: `learning:cohort:${cohort.id}:presenca:${usuarioAlvo}`,
      payload: { presenca, cohortResumo: resumoCohort(cohort), programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return {
      presenca: extrairPresencaCohort(evento) ?? presenca,
      entitlement,
      duplicado
    };
  }

  async criarComunidadeTeam(negocioId: string, criadoPorId: string, slug: string, dados: CriarComunidadeLearningInput) {
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === slug);
    if (!programa) throw new Error("Programa Learning não encontrado para comunidade.");
    if (programa.estado === "ARQUIVADO" || programa.estado === "SUSPENSO") {
      throw new Error("Comunidade Learning não pode ser criada em produto arquivado ou suspenso.");
    }

    const titulo = dados.titulo?.trim() || programa.comunidade?.titulo || `Comunidade ${programa.titulo}`;
    const acesso = normalizarAcessoComunidade(dados.acesso, programa);
    const comunidade: ComunidadeLearning = {
      id: gerarIdComunidade(negocioId, programa.slug, titulo),
      programaSlug: programa.slug,
      programaTitulo: programa.titulo,
      titulo,
      estado: acesso === "ABERTO" ? "ABERTA" : "PRIVADA",
      acesso,
      topicos: normalizarLista(dados.topicos, programa.comunidade?.topicos?.length ? programa.comunidade.topicos : [programa.categoria]),
      regras: dados.regras?.trim() || regraComunidadePadrao(programa, acesso),
      moderadores: normalizarLista(dados.moderadores, [programa.ownerPerfil, "ADMIN"]),
      membrosEstimados: programa.comunidade?.membrosEstimados ?? 0,
      membros: 0,
      posts: 0,
      anuncios: 0,
      perguntas: 0,
      ultimaAtividade: null,
      postsRecentes: [],
      criadoPorId,
      criadoEm: new Date().toISOString()
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COMUNIDADE_CRIADA",
      entidadeTipo: "learning_community",
      entidadeId: comunidade.id,
      idempotencyKey: `learning:comunidade:${comunidade.id}`,
      payload: { comunidade, programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return {
      comunidade: extrairComunidade(evento) ?? comunidade,
      duplicado
    };
  }

  async publicarPostComunidade(
    negocioId: string,
    autorId: string,
    autorNome: string,
    comunidadeId: string,
    dados: PublicarPostComunidadeLearningInput
  ) {
    const comunidades = await this.listarComunidades(negocioId);
    const comunidade = comunidades.find((item) => item.id === comunidadeId);
    if (!comunidade) throw new Error("Comunidade Learning não encontrada.");
    if (comunidade.estado === "PAUSADA" || comunidade.estado === "ARQUIVADA") {
      throw new Error("Comunidade Learning pausada ou arquivada não aceita novas publicações.");
    }

    const post: PostComunidadeLearning = {
      id: randomUUID(),
      comunidadeId: comunidade.id,
      programaSlug: comunidade.programaSlug,
      tipo: normalizarTipoPostComunidade(dados.tipo),
      titulo: dados.titulo?.trim() || null,
      conteudo: dados.conteudo.trim(),
      autorId,
      autorNome: autorNome.trim() || "Membro Team",
      fixado: dados.fixado === true,
      criadoEm: new Date().toISOString()
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COMUNIDADE_POST_PUBLICADO",
      entidadeTipo: "learning_community_post",
      entidadeId: post.id,
      idempotencyKey: `learning:comunidade:${comunidade.id}:post:${post.id}`,
      payload: { post, comunidadeResumo: resumoComunidade(comunidade) },
      estado: "PROCESSADO"
    });

    return {
      post: extrairPostComunidade(evento) ?? post,
      duplicado
    };
  }

  async denunciarConteudoLearning(
    negocioId: string,
    denuncianteId: string,
    denuncianteNome: string,
    dados: DenunciarConteudoLearningInput
  ) {
    const alvo = await this.resolverAlvoModeracao(negocioId, dados);
    const agora = new Date().toISOString();
    const severidade = normalizarSeveridadeModeracao(dados.severidade);
    const caso: CasoModeracaoLearning = {
      id: randomUUID(),
      alvoTipo: normalizarTipoAlvoModeracao(dados.alvoTipo),
      alvoId: dados.alvoId.trim(),
      tituloAlvo: alvo.tituloAlvo,
      programaSlug: dados.programaSlug?.trim() || alvo.programaSlug || null,
      comunidadeId: dados.comunidadeId?.trim() || alvo.comunidadeId || null,
      postId: dados.postId?.trim() || alvo.postId || null,
      motivo: normalizarMotivoModeracao(dados.motivo),
      severidade,
      descricao: dados.descricao.trim(),
      estado: "ABERTO",
      ocultoPublicamente: false,
      denuncianteId,
      denuncianteNome: denuncianteNome.trim() || "Membro Team",
      revisadoPorId: null,
      decisao: null,
      criadoEm: agora,
      atualizadoEm: agora
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_MODERACAO_CASO_ABERTO",
      entidadeTipo: "learning_moderation_case",
      entidadeId: caso.id,
      idempotencyKey: `learning:moderacao:${caso.id}`,
      payload: { caso },
      estado: "PROCESSADO"
    });

    return {
      caso: extrairCasoModeracao(evento) ?? caso,
      duplicado
    };
  }

  async decidirModeracaoLearning(
    negocioId: string,
    revisorId: string,
    casoId: string,
    dados: DecidirModeracaoLearningInput
  ) {
    const casos = await this.listarCasosModeracao(negocioId);
    const caso = casos.find((item) => item.id === casoId);
    if (!caso) throw new Error("Caso de moderação Learning não encontrado.");

    const acao = normalizarAcaoModeracao(dados.acao);
    const estado = normalizarEstadoModeracao(dados.estado) ?? estadoPorAcaoModeracao(acao);
    const ocultoPublicamente = definirOcultacaoModeracao(caso, acao, estado, dados.ocultoPublicamente);
    const atualizado: CasoModeracaoLearning = {
      ...caso,
      estado,
      ocultoPublicamente,
      revisadoPorId: revisorId,
      decisao: dados.decisao?.trim() || decisaoPadraoModeracao(acao, estado),
      atualizadoEm: new Date().toISOString()
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_MODERACAO_DECISAO_REGISTADA",
      entidadeTipo: "learning_moderation_case",
      entidadeId: caso.id,
      idempotencyKey: `learning:moderacao:${caso.id}:decisao:${atualizado.atualizadoEm}`,
      payload: { caso: atualizado, casoAnterior: resumoModeracao(caso), acao },
      estado: "PROCESSADO"
    });

    return {
      caso: extrairCasoModeracao(evento) ?? atualizado,
      duplicado
    };
  }

  async inscrever(negocioId: string, usuarioId: string, programaSlug: string, origem = "TEAM") {
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === programaSlug);
    if (!programa || programa.estado !== "PUBLICADO") throw new Error("Programa Learning não está publicado.");
    const entitlementAtivo = await this.temEntitlementAtivo(negocioId, usuarioId, programaSlug);
    if (programa.tipoAcesso === "PAGO" && !entitlementAtivo) {
      throw new Error("Produto Learning pago exige checkout confirmado antes da inscrição.");
    }
    if (!entitlementAtivo) {
      await this.registrarEntitlement(negocioId, usuarioId, programa, origem === "AUTO" ? "GRATUITO" : "TEAM", `inscricao:${programaSlug}:${usuarioId}`);
    }

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_INSCRICAO",
      entidadeTipo: "learning_program",
      entidadeId: programaSlug,
      idempotencyKey: `learning:inscricao:${usuarioId}:${programaSlug}`,
      payload: { usuarioId, programaSlug, origem, inscritoEm: new Date().toISOString() },
      estado: "PROCESSADO"
    });

    return { inscricao: evento.payload, duplicado };
  }

  async checkoutDigital(negocioId: string, usuarioId: string, dados: CheckoutLearningInput) {
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === dados.programaSlug);
    if (!programa || programa.estado !== "PUBLICADO" || programa.visibilidade !== "PUBLICO") {
      throw new Error("Produto Learning não está publicado para compra.");
    }
    if (programa.tipoAcesso === "PRIVADO" || programa.tipoAcesso === "CONVITE") {
      throw new Error("Este produto Learning exige acesso manual ou convite pelo Team.");
    }

    const valor = aplicarCupao(programa, dados.cupao);
    const confirmado = valor === 0 || dados.confirmarPagamento === true;
    const compraId = randomUUID();
    const criadoEm = new Date().toISOString();
    const movimentoFinanceiro = confirmado && valor > 0 ? criarMovimentoLearning(compraId, programa, valor, criadoEm) : null;
    const factura = confirmado ? criarDocumentoLearning(compraId, programa, valor, criadoEm) : null;
    const compra: CompraLearning = {
      id: compraId,
      programaSlug: programa.slug,
      usuarioId,
      compradorNome: dados.compradorNome?.trim() || "Comprador Learning",
      compradorEmail: dados.compradorEmail?.trim() || null,
      compradorTelefone: dados.compradorTelefone?.trim() || null,
      estado: confirmado ? "CONFIRMADO" : "PENDENTE_VALIDACAO",
      valor,
      moeda: programa.oferta.moeda,
      metodoPagamento: dados.metodoPagamento?.trim() || null,
      referenciaPagamento: dados.referenciaPagamento?.trim() || null,
      comprovativoUrl: dados.comprovativoUrl?.trim() || null,
      factura,
      movimentoFinanceiro,
      entitlementId: null,
      criadoEm
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COMPRA_DIGITAL_CRIADA",
      entidadeTipo: "learning_checkout",
      entidadeId: compraId,
      idempotencyKey: dados.referenciaPagamento
        ? `learning:checkout:${usuarioId}:${programa.slug}:${dados.referenciaPagamento.trim()}`
        : `learning:checkout:${compraId}`,
      payload: { compra, programaResumo: resumoFinanceiroPrograma(programa), cupao: dados.cupao ?? null },
      estado: "PROCESSADO"
    });

    const compraPersistida = extrairCompra(evento) ?? compra;
    if (duplicado) return { compra: compraPersistida, duplicado, entitlement: null };
    if (!confirmado) return { compra: compraPersistida, duplicado, entitlement: null };

    if (movimentoFinanceiro) {
      await this.eventosOperacionais.registrar({
        negocioId,
        topico: TOPICO_LEARNING,
        tipo: "LEARNING_MOVIMENTO_FINANCEIRO_GERADO",
        entidadeTipo: "learning_financial_movement",
        entidadeId: movimentoFinanceiro.id,
        idempotencyKey: `learning:movimento:${movimentoFinanceiro.id}`,
        payload: { movimento: movimentoFinanceiro, compraId, programaSlug: programa.slug },
        estado: "PROCESSADO"
      });
    }

    if (factura) {
      await this.eventosOperacionais.registrar({
        negocioId,
        topico: TOPICO_LEARNING,
        tipo: "LEARNING_DOCUMENTO_DIGITAL_EMITIDO",
        entidadeTipo: "learning_document",
        entidadeId: factura.numero,
        idempotencyKey: `learning:documento:${factura.numero}`,
        payload: { documento: factura, compraId, programaSlug: programa.slug },
        estado: "PROCESSADO"
      });
    }

    const entitlement = await this.registrarEntitlement(negocioId, usuarioId, programa, "CHECKOUT", compraId);
    await this.registrarInscricao(negocioId, usuarioId, programa.slug, "CHECKOUT");
    return {
      compra: { ...compraPersistida, entitlementId: entitlement.id },
      duplicado,
      entitlement
    };
  }

  async ajustarCompraDigital(
    negocioId: string,
    usuarioId: string,
    compraId: string,
    dados: AjustarCompraLearningInput
  ) {
    const compra = (await this.listarCompras(negocioId)).find((item) => item.id === compraId);
    if (!compra) throw new Error("Compra Learning não encontrada.");
    if (compra.estado === "CANCELADO" || compra.estado === "REEMBOLSADO") {
      throw new Error("Compra Learning já está cancelada ou reembolsada.");
    }

    const ajustadoEm = new Date().toISOString();
    const compraAjustada: CompraLearning = {
      ...compra,
      estado: dados.estado,
      ajustadoEm,
      ajustadoPorId: usuarioId,
      motivoAjuste: dados.motivo?.trim() || (dados.estado === "REEMBOLSADO" ? "Reembolso registado pelo Team." : "Cancelamento registado pelo Team.")
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COMPRA_DIGITAL_AJUSTADA",
      entidadeTipo: "learning_checkout",
      entidadeId: compra.id,
      idempotencyKey: `learning:compra:${compra.id}:ajuste:${compraAjustada.estado}:${ajustadoEm}`,
      payload: { compra: compraAjustada, compraAnterior: compra, usuarioId },
      estado: "PROCESSADO"
    });

    const entitlementsRevogados: EntitlementLearning[] = [];
    if (dados.revogarAcesso !== false) {
      const entitlements = await this.listarEntitlements(negocioId);
      const relacionados = entitlements.filter((entitlement) =>
        entitlement.estado === "ATIVO" &&
        entitlement.programaSlug === compra.programaSlug &&
        (entitlement.origemId === compra.id || entitlement.id === compra.entitlementId)
      );
      for (const entitlement of relacionados) {
        const revogado = await this.revogarEntitlement(
          negocioId,
          usuarioId,
          entitlement.id,
          compraAjustada.motivoAjuste ?? "Acesso revogado por ajuste da compra Learning."
        );
        entitlementsRevogados.push(revogado.entitlement);
      }
    }

    return {
      compra: extrairCompra(evento) ?? compraAjustada,
      entitlementsRevogados,
      duplicado
    };
  }

  async concluirLicao(negocioId: string, usuarioId: string, licaoId: string) {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const programa = programas.find((item) => item.licoes.some((licao) => licao.id === licaoId));
    if (!programa) throw new Error("Lição Learning não encontrada.");

    await this.garantirAcessoLearning(negocioId, usuarioId, programa);
    await this.registrarInscricao(negocioId, usuarioId, programa.slug, "AUTO");
    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_LICAO_CONCLUIDA",
      entidadeTipo: "learning_lesson",
      entidadeId: licaoId,
      idempotencyKey: `learning:licao:${usuarioId}:${licaoId}`,
      payload: { usuarioId, programaSlug: programa.slug, licaoId, concluidoEm: new Date().toISOString() },
      estado: "PROCESSADO"
    });

    return { conclusao: evento.payload, duplicado, progresso: await this.obterProgresso(negocioId, usuarioId) };
  }

  async emitirCertificado(negocioId: string, usuarioId: string, programaSlug: string) {
    const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === programaSlug);
    if (!programa) throw new Error("Produto Learning não encontrado.");
    if (!programa.certificadoConfigurado) throw new Error("Este produto Learning não possui certificado configurado.");
    await this.garantirAcessoLearning(negocioId, usuarioId, programa);

    const progresso = (await this.obterProgresso(negocioId, usuarioId)).programas.find((item) => item.programaSlug === programaSlug);
    if (!progresso?.concluido) throw new Error("Certificado só pode ser emitido após conclusão dos critérios do produto.");

    const emitidoEm = new Date().toISOString();
    const certificado: CertificadoLearning = {
      id: randomUUID(),
      programaSlug,
      usuarioId,
      negocioId,
      codigoVerificacao: gerarCodigoCertificado(negocioId, usuarioId, programaSlug, emitidoEm),
      emitidoEm,
      validadeAte: null,
      estado: "VALIDO"
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_CERTIFICADO_EMITIDO",
      entidadeTipo: "learning_certificate",
      entidadeId: certificado.codigoVerificacao,
      idempotencyKey: `learning:certificado:${usuarioId}:${programaSlug}`,
      payload: { certificado, programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return { certificado: extrairCertificado(evento) ?? certificado, duplicado };
  }

  async obterAcessos(negocioId: string, usuarioId: string) {
    const [compras, entitlements, certificados] = await Promise.all([
      this.listarCompras(negocioId),
      this.listarEntitlements(negocioId),
      this.listarCertificados(negocioId)
    ]);
    return {
      compras: compras.filter((compra) => compra.usuarioId === usuarioId),
      entitlements: entitlements.filter((entitlement) => entitlement.usuarioId === usuarioId),
      certificados: certificados.filter((certificado) => certificado.usuarioId === usuarioId)
    };
  }

  async revogarEntitlement(negocioId: string, usuarioId: string, entitlementId: string, motivo: string) {
    const entitlements = await this.listarEntitlements(negocioId);
    const entitlement = entitlements.find((item) => item.id === entitlementId);
    if (!entitlement) throw new Error("Entitlement Learning não encontrado.");

    const revogado = {
      ...entitlement,
      estado: "REVOGADO" as const,
      revogadoEm: new Date().toISOString(),
      motivoRevogacao: motivo || "Revogado pelo Team."
    };

    await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_ENTITLEMENT_REVOGADO",
      entidadeTipo: "learning_entitlement",
      entidadeId: entitlementId,
      idempotencyKey: `learning:entitlement:${entitlementId}:revogado:${Date.now()}`,
      payload: { entitlement: revogado, usuarioId },
      estado: "PROCESSADO"
    });

    return { entitlement: revogado };
  }

  async listarChatInterno(
    negocioId: string,
    _usuarioId: string,
    _papel: string,
    programaSlug?: string
  ): Promise<ChatInternoLearning> {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const programasFiltrados = programaSlug ? programas.filter((programa) => programa.slug === programaSlug) : programas;
    if (programaSlug && programasFiltrados.length === 0) throw new Error("Programa Learning não encontrado para o chat interno.");

    const eventos = await this.eventosOperacionais.listar(negocioId, {
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_CHAT_MENSAGEM_ENVIADA",
      limite: 1000
    });
    const mensagens = eventos
      .map(extrairMensagemChat)
      .filter((mensagem): mensagem is MensagemChatLearning => Boolean(mensagem))
      .filter((mensagem) => !programaSlug || mensagem.programaSlug === programaSlug);
    const mensagensPorThread = new Map<string, MensagemChatLearning[]>();

    for (const mensagem of mensagens) {
      mensagensPorThread.set(mensagem.threadId, [...(mensagensPorThread.get(mensagem.threadId) ?? []), mensagem]);
    }

    const threads = programasFiltrados.map((programa) => {
      const threadIds = [
        threadIdLearning(programa.slug, "PROGRAMA"),
        threadIdLearning(programa.slug, "COHORT"),
        threadIdLearning(programa.slug, "COMUNIDADE"),
        threadIdLearning(programa.slug, "SUPORTE")
      ];
      const mensagensPrograma = threadIds.flatMap((threadId) => mensagensPorThread.get(threadId) ?? []);
      const mensagensOrdenadas = mensagensPrograma.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
      return {
        id: threadIdLearning(programa.slug, "PROGRAMA"),
        programaSlug: programa.slug,
        programaTitulo: programa.titulo,
        contexto: "PROGRAMA" as const,
        estado: mensagensOrdenadas.length ? "ABERTO" as const : "SEM_MENSAGENS" as const,
        totalMensagens: mensagensOrdenadas.length,
        ultimaMensagem: mensagensOrdenadas.at(-1) ?? null,
        mensagens: mensagensOrdenadas.slice(-20)
      };
    });

    const mensagensConsideradas = threads.flatMap((thread) => thread.mensagens);
    return {
      metricas: {
        threads: threads.length,
        mensagens: mensagensConsideradas.length,
        decisoes: mensagensConsideradas.filter((mensagem) => mensagem.tipo === "DECISAO").length,
        tarefas: mensagensConsideradas.filter((mensagem) => mensagem.tipo === "TAREFA").length,
        suporte: mensagensConsideradas.filter((mensagem) => mensagem.tipo === "SUPORTE").length,
        ultimaAtividade: mensagensConsideradas
          .slice()
          .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0]?.criadoEm ?? null
      },
      threads: threads
        .sort((a, b) => (b.ultimaMensagem?.criadoEm ?? "").localeCompare(a.ultimaMensagem?.criadoEm ?? "") || a.programaTitulo.localeCompare(b.programaTitulo))
        .slice(0, 50)
    };
  }

  async enviarMensagemChatInterno(
    negocioId: string,
    usuarioId: string,
    autorNome: string,
    autorPapel: string,
    dados: EnviarMensagemChatLearningInput
  ) {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const programa = programas.find((item) => item.slug === dados.programaSlug);
    if (!programa) throw new Error("Programa Learning não encontrado para mensagem interna.");
    const contexto = normalizarContextoChat(dados.contexto);
    const mensagem: MensagemChatLearning = {
      id: randomUUID(),
      threadId: threadIdLearning(programa.slug, contexto),
      programaSlug: programa.slug,
      contexto,
      tipo: normalizarTipoMensagemChat(dados.tipo),
      conteudo: dados.conteudo.trim(),
      autorId: usuarioId,
      autorNome: autorNome.trim() || "Membro Team",
      autorPapel,
      mencoes: normalizarLista(dados.mencoes, []),
      criadoEm: new Date().toISOString()
    };

    const { evento, duplicado } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_CHAT_MENSAGEM_ENVIADA",
      entidadeTipo: "learning_internal_thread",
      entidadeId: mensagem.threadId,
      idempotencyKey: `learning:chat:${mensagem.id}`,
      payload: { mensagem, programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return {
      mensagem: extrairMensagemChat(evento) ?? mensagem,
      duplicado
    };
  }

  async listarCompras(negocioId: string): Promise<CompraLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    const mapa = new Map<string, CompraLearning>();
    const ordenados = [...eventos].sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());
    for (const evento of ordenados) {
      if (evento.tipo !== "LEARNING_COMPRA_DIGITAL_CRIADA" && evento.tipo !== "LEARNING_COMPRA_DIGITAL_AJUSTADA") continue;
      const compra = extrairCompra(evento);
      if (compra) mapa.set(compra.id, compra);
    }
    return [...mapa.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async listarEntitlements(negocioId: string): Promise<EntitlementLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    const mapa = new Map<string, EntitlementLearning>();
    for (const evento of eventos.reverse()) {
      if (evento.tipo === "LEARNING_ENTITLEMENT_CRIADO") {
        const entitlement = extrairEntitlement(evento);
        if (entitlement) mapa.set(entitlement.id, estadoTemporalEntitlement(entitlement));
      }
      if (evento.tipo === "LEARNING_ENTITLEMENT_REVOGADO") {
        const entitlement = extrairEntitlement(evento);
        if (entitlement) mapa.set(entitlement.id, estadoTemporalEntitlement(entitlement));
      }
    }
    return [...mapa.values()].sort((a, b) => b.acessoDesde.localeCompare(a.acessoDesde));
  }

  async listarCertificados(negocioId: string): Promise<CertificadoLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    return eventos
      .filter((evento) => evento.tipo === "LEARNING_CERTIFICADO_EMITIDO")
      .map(extrairCertificado)
      .filter((certificado): certificado is CertificadoLearning => Boolean(certificado))
      .sort((a, b) => b.emitidoEm.localeCompare(a.emitidoEm));
  }

  async listarAtribuicoes(negocioId: string): Promise<AtribuicaoLearning[]> {
    const [eventos, programas] = await Promise.all([
      this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 }),
      this.listarProgramasDoNegocio(negocioId)
    ]);
    const programasPorSlug = new Map(programas.map((programa) => [programa.slug, programa]));
    const conclusoesPorUsuarioPrograma = new Map<string, Set<string>>();

    for (const evento of eventos) {
      if (evento.tipo !== "LEARNING_LICAO_CONCLUIDA") continue;
      const usuarioId = String(evento.payload.usuarioId ?? "");
      const programaSlug = String(evento.payload.programaSlug ?? "");
      const licaoId = String(evento.payload.licaoId ?? "");
      if (!usuarioId || !programaSlug || !licaoId) continue;
      const chave = `${usuarioId}:${programaSlug}`;
      const concluidas = conclusoesPorUsuarioPrograma.get(chave) ?? new Set<string>();
      concluidas.add(licaoId);
      conclusoesPorUsuarioPrograma.set(chave, concluidas);
    }

    const mapa = new Map<string, AtribuicaoLearning>();
    for (const evento of eventos.reverse()) {
      if (evento.tipo !== "LEARNING_ATRIBUICAO_TEAM_CRIADA") continue;
      const atribuicao = extrairAtribuicao(evento);
      if (!atribuicao) continue;
      mapa.set(atribuicao.id, estadoTemporalAtribuicao(atribuicao, programasPorSlug, conclusoesPorUsuarioPrograma));
    }

    return [...mapa.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async listarCohorts(negocioId: string): Promise<CohortLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    const presencasPorCohort = new Map<string, PresencaCohortLearning[]>();

    for (const evento of eventos) {
      if (evento.tipo !== "LEARNING_COHORT_PRESENCA_REGISTADA") continue;
      const presenca = extrairPresencaCohort(evento);
      if (!presenca) continue;
      presencasPorCohort.set(presenca.cohortId, [...(presencasPorCohort.get(presenca.cohortId) ?? []), presenca]);
    }

    return eventos
      .filter((evento) => evento.tipo === "LEARNING_COHORT_ABERTO")
      .map(extrairCohort)
      .filter((cohort): cohort is CohortLearning => Boolean(cohort))
      .map((cohort) => {
        const presencas = presencasPorCohort.get(cohort.id) ?? [];
        return {
          ...estadoTemporalCohort(cohort),
          inscritos: new Set(presencas.map((presenca) => presenca.usuarioId)).size,
          presencas: presencas.filter((presenca) => presenca.presente).length
        };
      })
      .sort((a, b) => (b.inicioEm ?? b.criadoEm).localeCompare(a.inicioEm ?? a.criadoEm));
  }

  async listarPresencasCohort(negocioId: string, cohortId: string): Promise<PresencaCohortLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, {
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COHORT_PRESENCA_REGISTADA",
      limite: 1000
    });
    return eventos
      .map(extrairPresencaCohort)
      .filter((presenca): presenca is PresencaCohortLearning => Boolean(presenca))
      .filter((presenca) => presenca.cohortId === cohortId)
      .sort((a, b) => b.registradoEm.localeCompare(a.registradoEm));
  }

  async listarComunidades(negocioId: string): Promise<ComunidadeLearning[]> {
    const [eventos, programas] = await Promise.all([
      this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 }),
      this.listarProgramasDoNegocio(negocioId)
    ]);
    const mapa = new Map<string, ComunidadeLearning>();

    for (const programa of programas) {
      if (!programa.comunidade) continue;
      const acesso = normalizarAcessoComunidade(undefined, programa);
      const comunidade: ComunidadeLearning = {
        id: gerarIdComunidade(negocioId, programa.slug, programa.comunidade.titulo),
        programaSlug: programa.slug,
        programaTitulo: programa.titulo,
        titulo: programa.comunidade.titulo,
        estado: acesso === "ABERTO" ? "ABERTA" : "PRIVADA",
        acesso,
        topicos: programa.comunidade.topicos,
        regras: regraComunidadePadrao(programa, acesso),
        moderadores: [programa.ownerPerfil, "ADMIN"],
        membrosEstimados: programa.comunidade.membrosEstimados,
        membros: programa.comunidade.membrosEstimados,
        posts: 0,
        anuncios: 0,
        perguntas: 0,
        ultimaAtividade: null,
        postsRecentes: [],
        criadoPorId: programa.criadoPorId ?? "BIZY",
        criadoEm: programa.criadoEm ?? new Date(0).toISOString()
      };
      mapa.set(comunidade.id, comunidade);
    }

    for (const evento of eventos) {
      if (evento.tipo !== "LEARNING_COMUNIDADE_CRIADA") continue;
      const comunidade = extrairComunidade(evento);
      if (comunidade) mapa.set(comunidade.id, comunidade);
    }

    const postsPorComunidade = new Map<string, PostComunidadeLearning[]>();
    for (const evento of eventos) {
      if (evento.tipo !== "LEARNING_COMUNIDADE_POST_PUBLICADO") continue;
      const post = extrairPostComunidade(evento);
      if (!post) continue;
      postsPorComunidade.set(post.comunidadeId, [...(postsPorComunidade.get(post.comunidadeId) ?? []), post]);
    }

    return [...mapa.values()]
      .map((comunidade) => {
        const posts = (postsPorComunidade.get(comunidade.id) ?? []).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
        const autores = new Set(posts.map((post) => post.autorId));
        return {
          ...comunidade,
          membros: Math.max(comunidade.membrosEstimados, autores.size),
          posts: posts.length,
          anuncios: posts.filter((post) => post.tipo === "ANUNCIO").length,
          perguntas: posts.filter((post) => post.tipo === "PERGUNTA").length,
          ultimaAtividade: posts[0]?.criadoEm ?? comunidade.ultimaAtividade ?? null,
          postsRecentes: posts.slice(0, 5)
        };
      })
      .sort((a, b) => (b.ultimaAtividade ?? b.criadoEm).localeCompare(a.ultimaAtividade ?? a.criadoEm));
  }

  async listarCasosModeracao(negocioId: string): Promise<CasoModeracaoLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    const mapa = new Map<string, CasoModeracaoLearning>();

    for (const evento of eventos.reverse()) {
      if (evento.tipo !== "LEARNING_MODERACAO_CASO_ABERTO" && evento.tipo !== "LEARNING_MODERACAO_DECISAO_REGISTADA") continue;
      const caso = extrairCasoModeracao(evento);
      if (caso) mapa.set(caso.id, caso);
    }

    return [...mapa.values()].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  }

  async resumirAnalyticsPublico(negocioId: string, programas: ProgramaLearning[]): Promise<AnalyticsLearningTeam> {
    const eventos = await this.listarEventosPublicos(negocioId);
    return resumirEventosPublicosLearning(eventos, programas);
  }

  private async listarEventosPublicos(negocioId: string): Promise<EventoPublicoLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, {
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_EVENTO_PUBLICO",
      limite: 1000
    });
    return eventos
      .map(extrairEventoPublicoLearning)
      .filter((evento): evento is EventoPublicoLearning => Boolean(evento))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  private async listarPostsComunidade(negocioId: string): Promise<PostComunidadeLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, {
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_COMUNIDADE_POST_PUBLICADO",
      limite: 1000
    });
    return eventos
      .map(extrairPostComunidade)
      .filter((post): post is PostComunidadeLearning => Boolean(post))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  private async resolverAlvoModeracao(negocioId: string, dados: DenunciarConteudoLearningInput) {
    const alvoTipo = normalizarTipoAlvoModeracao(dados.alvoTipo);
    const alvoId = dados.alvoId.trim();
    if (!alvoId) throw new Error("Denúncia Learning exige alvo válido.");

    if (alvoTipo === "PROGRAMA") {
      const programa = (await this.listarProgramasDoNegocio(negocioId)).find((item) => item.slug === alvoId);
      if (!programa) throw new Error("Programa Learning denunciado não encontrado.");
      return { tituloAlvo: programa.titulo, programaSlug: programa.slug, comunidadeId: null, postId: null };
    }

    if (alvoTipo === "COMUNIDADE") {
      const comunidade = (await this.listarComunidades(negocioId)).find((item) => item.id === alvoId);
      if (!comunidade) throw new Error("Comunidade Learning denunciada não encontrada.");
      return { tituloAlvo: comunidade.titulo, programaSlug: comunidade.programaSlug, comunidadeId: comunidade.id, postId: null };
    }

    if (alvoTipo === "POST") {
      const post = (await this.listarPostsComunidade(negocioId)).find((item) => item.id === alvoId);
      if (!post) throw new Error("Post Learning denunciado não encontrado.");
      const comunidade = (await this.listarComunidades(negocioId)).find((item) => item.id === post.comunidadeId);
      return {
        tituloAlvo: post.titulo || post.conteudo.slice(0, 80),
        programaSlug: post.programaSlug,
        comunidadeId: post.comunidadeId,
        postId: post.id,
        comunidadeTitulo: comunidade?.titulo ?? null
      };
    }

    if (alvoTipo === "CERTIFICADO") {
      const certificado = (await this.listarCertificados(negocioId)).find((item) => item.id === alvoId || item.codigoVerificacao === alvoId);
      if (!certificado) throw new Error("Certificado Learning denunciado não encontrado.");
      return { tituloAlvo: `Certificado ${certificado.codigoVerificacao}`, programaSlug: certificado.programaSlug, comunidadeId: null, postId: null };
    }

    if (alvoTipo === "PERFIL") {
      const perfil = PERFIS_LEARNING.find((item) => item.codigo === alvoId.toUpperCase());
      return { tituloAlvo: perfil?.nome ?? `Perfil ${alvoId}`, programaSlug: dados.programaSlug?.trim() || null, comunidadeId: null, postId: null };
    }

    const programaMentor = (await this.listarProgramasDoNegocio(negocioId)).find(
      (programa) => programa.mentorNome?.toLowerCase() === alvoId.toLowerCase() || programa.ownerPerfil === alvoId.toUpperCase()
    );
    return {
      tituloAlvo: programaMentor?.mentorNome ?? `Mentor ${alvoId}`,
      programaSlug: programaMentor?.slug ?? dados.programaSlug?.trim() ?? null,
      comunidadeId: null,
      postId: null
    };
  }

  private async temEntitlementAtivo(negocioId: string, usuarioId: string, programaSlug: string): Promise<boolean> {
    const entitlements = await this.listarEntitlements(negocioId);
    return entitlements.some((item) => item.usuarioId === usuarioId && item.programaSlug === programaSlug && item.estado === "ATIVO");
  }

  private async garantirAcessoLearning(negocioId: string, usuarioId: string, programa: ProgramaLearning) {
    const ativo = await this.temEntitlementAtivo(negocioId, usuarioId, programa.slug);
    if (ativo) return;
    if (programa.tipoAcesso === "PAGO") {
      throw new Error("Conteúdo premium exige compra Learning confirmada.");
    }
    await this.registrarEntitlement(negocioId, usuarioId, programa, programa.tipoAcesso === "GRATUITO" ? "GRATUITO" : "TEAM", `acesso:${programa.slug}:${usuarioId}`);
  }

  private async registrarEntitlement(
    negocioId: string,
    usuarioId: string,
    programa: ProgramaLearning,
    origem: EntitlementLearning["origem"],
    origemId: string
  ): Promise<EntitlementLearning> {
    const acessoDesde = new Date().toISOString();
    const entitlement: EntitlementLearning = {
      id: randomUUID(),
      programaSlug: programa.slug,
      usuarioId,
      negocioId,
      origem,
      origemId,
      estado: "ATIVO",
      acessoDesde,
      acessoAte: programa.oferta.periodoDias ? adicionarDias(acessoDesde, programa.oferta.periodoDias) : null
    };

    const { evento } = await this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_ENTITLEMENT_CRIADO",
      entidadeTipo: "learning_entitlement",
      entidadeId: entitlement.id,
      idempotencyKey: `learning:entitlement:${usuarioId}:${programa.slug}:${origem}:${origemId}`,
      payload: { entitlement, programaResumo: resumoFinanceiroPrograma(programa) },
      estado: "PROCESSADO"
    });

    return extrairEntitlement(evento) ?? entitlement;
  }

  private async registrarInscricao(negocioId: string, usuarioId: string, programaSlug: string, origem: string) {
    return this.eventosOperacionais.registrar({
      negocioId,
      topico: TOPICO_LEARNING,
      tipo: "LEARNING_INSCRICAO",
      entidadeTipo: "learning_program",
      entidadeId: programaSlug,
      idempotencyKey: `learning:inscricao:${usuarioId}:${programaSlug}`,
      payload: { usuarioId, programaSlug, origem, inscritoEm: new Date().toISOString() },
      estado: "PROCESSADO"
    });
  }

  async obterProgresso(negocioId: string, usuarioId: string) {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    const inscricoes = eventos
      .filter((evento) => evento.tipo === "LEARNING_INSCRICAO" && evento.payload.usuarioId === usuarioId)
      .map((evento) => evento.payload);
    const conclusoes = eventos
      .filter((evento) => evento.tipo === "LEARNING_LICAO_CONCLUIDA" && evento.payload.usuarioId === usuarioId)
      .map((evento) => evento.payload);

    const progresso = programas.map((programa) => {
      const inscricao = inscricoes.find((item) => item.programaSlug === programa.slug);
      const licoesConcluidas = conclusoes
        .filter((item) => item.programaSlug === programa.slug)
        .map((item) => String(item.licaoId));
      const totalLicoes = programa.licoes.length;
      const percentual = totalLicoes ? Math.round((new Set(licoesConcluidas).size / totalLicoes) * 100) : 0;
      return {
        programaSlug: programa.slug,
        inscrito: Boolean(inscricao),
        inscritoEm: typeof inscricao?.inscritoEm === "string" ? inscricao.inscritoEm : null,
        licoesConcluidas: [...new Set(licoesConcluidas)],
        totalLicoes,
        percentual,
        concluido: totalLicoes > 0 && percentual >= 100
      } satisfies ProgressoLearning;
    });

    return { programas: progresso };
  }

  async listarProgramasDoNegocio(negocioId: string): Promise<ProgramaLearning[]> {
    const eventos = await this.eventosOperacionais.listar(negocioId, { topico: TOPICO_LEARNING, limite: 1000 });
    const mapa = new Map<string, ProgramaLearning>();
    for (const programa of PROGRAMAS_BASE) mapa.set(programa.slug, { ...programa });

    for (const evento of eventos.reverse()) {
      if (evento.tipo === "LEARNING_PROGRAMA_CRIADO") {
        const programa = extrairPrograma(evento);
        if (programa) mapa.set(programa.slug, programa);
      }
      if (evento.tipo === "LEARNING_PROGRAMA_PUBLICACAO_ALTERADA") {
        const slug = String(evento.payload.slug ?? "");
        const atual = mapa.get(slug);
        if (!atual) continue;
        mapa.set(slug, {
          ...atual,
          estado: normalizarEstado(evento.payload.estado, atual.estado),
          destaque: typeof evento.payload.destaque === "boolean" ? evento.payload.destaque : atual.destaque,
          visibilidade: evento.payload.visibilidade === "PUBLICO" || evento.payload.visibilidade === "TEAM"
            ? evento.payload.visibilidade
            : atual.visibilidade
        });
      }
    }

    return [...mapa.values()].sort((a, b) => Number(b.destaque) - Number(a.destaque) || a.titulo.localeCompare(b.titulo));
  }

  private async listarPerfisPublicos(): Promise<PerfilPublicoLearning[]> {
    const negocios = await this.autenticacao.listarNegocios();
    const perfis = await Promise.all(
      negocios.map(async (negocio) => {
        const base = montarPerfilLearningBase(negocio);
        if (!base) return null;
        const programas = (await this.listarProgramasDoNegocio(negocio.id)).filter((programa) =>
          programa.origem === "TEAM" &&
          programa.estado === "PUBLICADO" &&
          programa.visibilidade === "PUBLICO"
        );
        return {
          ...base,
          programas,
          metricas: metricasPerfilLearning(programas)
        };
      })
    );
    return perfis
      .filter((perfil): perfil is PerfilPublicoLearning => perfil != null)
      .sort((a, b) => b.metricas.programas - a.metricas.programas || a.nomePublico.localeCompare(b.nomePublico, "pt-AO", { sensitivity: "base" }));
  }
}

function podeAdministrarLearning(papel: string, permissoes: string[]): boolean {
  return ["DONO", "ADMIN"].includes(papel) || permissoes.includes("learning:administrar") || permissoes.includes("equipa:gestao");
}

function montarPerfilLearningBase(negocio: NegocioBizy): Omit<PerfilPublicoLearning, "programas" | "metricas"> | null {
  const entrega = objeto(negocio.entrega);
  const lojaDigital = objeto(entrega.lojaDigital);
  const learning = objeto(lojaDigital.learning);
  const participaNoLearning = booleano(lojaDigital.participaNoLearning, false);
  const ativo = booleano(learning.ativa, participaNoLearning);
  const publicado = booleano(learning.publicada, false);
  const slugFonte = texto(learning.slug) ?? negocio.slugPublico ?? "";
  const slug = slugify(slugFonte);

  if (!participaNoLearning || !ativo || !publicado || !slugFonte.trim() || !slug) return null;

  const descricao =
    texto(learning.descricaoPublica) ??
    negocio.descricaoPublica ??
    "Perfil Learning para produtos digitais, comunidade, mentoria e aprendizagem operacional.";

  return {
    slug,
    negocioId: negocio.id,
    nomePublico: texto(learning.nomePublico) ?? negocio.nomeComercial,
    nomeNegocio: negocio.nomeComercial,
    descricaoPublica: descricao,
    categorias: listaTextos(learning.categorias).length
      ? listaTextos(learning.categorias).slice(0, 20)
      : ["Cursos", "Comunidade", "Mentoria"],
    canaisSuporte: listaTextos(learning.canaisSuporte).slice(0, 12),
    politicaSuporte: texto(learning.politicaSuporte) ?? "Suporte pelo Team, comunidade ou canal configurado pelo perfil Learning.",
    localizacao: [negocio.municipio, negocio.provincia].filter(Boolean).join(", ") || null,
    urlPublica: `/learning/${slug}`
  };
}

function deduplicarProgramasPublicos(programas: ProgramaLearning[]): ProgramaLearning[] {
  const porSlug = new Map<string, ProgramaLearning>();
  for (const programa of programas) {
    if (!porSlug.has(programa.slug)) porSlug.set(programa.slug, programa);
  }
  return [...porSlug.values()];
}

function metricasPerfilLearning(programas: ProgramaLearning[]): PerfilPublicoLearning["metricas"] {
  return {
    programas: programas.length,
    pagos: programas.filter((programa) => programa.tipoAcesso === "PAGO").length,
    gratuitos: programas.filter((programa) => programa.tipoAcesso !== "PAGO").length,
    comunidades: programas.filter((programa) => programa.comunidade || programa.formato === "COMUNIDADE" || programa.formato === "MEMBERSHIP").length,
    certificados: programas.filter((programa) => programa.certificadoConfigurado).length,
    minutos: programas.reduce((total, programa) => total + programa.duracaoMinutos, 0),
    receitaPotencial: programas.reduce((total, programa) => total + valorOferta(programa), 0)
  };
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function booleano(valor: unknown, padrao: boolean): boolean {
  return typeof valor === "boolean" ? valor : padrao;
}

function listaTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function progressoVazio(programa: ProgramaLearning): ProgressoLearning {
  return {
    programaSlug: programa.slug,
    inscrito: false,
    inscritoEm: null,
    licoesConcluidas: [],
    totalLicoes: programa.licoes.length,
    percentual: 0,
    concluido: false
  };
}

function normalizarLista(valor: string[] | undefined, fallback: string[]): string[] {
  const lista = (valor ?? fallback).map((item) => item.trim()).filter(Boolean);
  return [...new Set(lista)].slice(0, 20);
}

function normalizarLicoes(slug: string, licoes?: CriarProgramaLearningInput["licoes"]): LicaoLearning[] {
  const base = licoes?.length ? licoes : [{ titulo: "Primeira accao pratica", tipo: "CHECKLIST" as const, duracaoMinutos: 8 }];
  return base.slice(0, 20).map((licao, indice) => ({
    id: `${slug}:${slugify(licao.titulo || `licao-${indice + 1}`)}`,
    titulo: licao.titulo.trim(),
    tipo: licao.tipo ?? "CHECKLIST",
    duracaoMinutos: licao.duracaoMinutos ?? 8,
    accaoBizy: licao.accaoBizy?.trim()
  }));
}

function somarDuracao(licoes?: CriarProgramaLearningInput["licoes"]): number {
  const total = licoes?.reduce((soma, licao) => soma + (licao.duracaoMinutos ?? 8), 0) ?? 24;
  return Math.max(5, total);
}

function validarElegibilidadePublicacao(programa: ProgramaLearning): void {
  if (programa.estado !== "PUBLICADO" || programa.visibilidade !== "PUBLICO") return;
  if (!programa.ownerPerfil?.trim()) throw new Error("Produto Learning público exige owner válido.");
  if (!programa.conteudoMinimoPublicado || programa.licoes.length === 0) {
    throw new Error("Produto Learning público exige conteúdo mínimo publicado.");
  }
  if (!programa.oferta || !programa.oferta.modelo) throw new Error("Produto Learning público exige preço ou acesso definido.");
  if (programa.tipoAcesso === "PAGO" && valorOferta(programa) <= 0) {
    throw new Error("Produto Learning pago exige valor maior que zero.");
  }
}

function valorOferta(programa: Pick<ProgramaLearning, "oferta">): number {
  return typeof programa.oferta.valorPromocional === "number" && programa.oferta.valorPromocional > 0
    ? programa.oferta.valorPromocional
    : programa.oferta.valor;
}

function aplicarCupao(programa: ProgramaLearning, cupao?: string): number {
  const valor = valorOferta(programa);
  const codigo = cupao?.trim().toUpperCase();
  if (!codigo || !programa.oferta.cupoes.map((item) => item.toUpperCase()).includes(codigo)) return valor;
  return Math.max(0, Math.round(valor * 0.9));
}

function criarMovimentoLearning(compraId: string, programa: ProgramaLearning, valor: number, criadoEm: string): MovimentoLearning {
  return {
    id: randomUUID(),
    tipo: "ENTRADA",
    origemTipo: "LEARNING",
    origemId: compraId,
    descricao: `Compra Learning: ${programa.titulo}`,
    valor,
    moeda: programa.oferta.moeda,
    criadoEm
  };
}

function criarDocumentoLearning(compraId: string, programa: ProgramaLearning, valor: number, emitidoEm: string): DocumentoLearning {
  const sufixo = compraId.slice(0, 8).toUpperCase();
  return {
    tipo: valor > 0 && programa.oferta.emiteDocumento ? "FACTURA_RECIBO" : valor > 0 ? "COMPROVATIVO_DIGITAL" : "INSCRICAO_GRATUITA",
    numero: `BL-${new Date(emitidoEm).getUTCFullYear()}-${sufixo}`,
    origemTipo: "LEARNING",
    origemId: compraId,
    emitidoEm
  };
}

function resumoFinanceiroPrograma(programa: ProgramaLearning) {
  return {
    slug: programa.slug,
    titulo: programa.titulo,
    categoria: programa.categoria,
    familiaProduto: programa.familiaProduto,
    tipoAcesso: programa.tipoAcesso,
    oferta: programa.oferta,
    ownerPerfil: programa.ownerPerfil
  };
}

function resumoCohort(cohort: CohortLearning) {
  return {
    id: cohort.id,
    programaSlug: cohort.programaSlug,
    titulo: cohort.titulo,
    estado: cohort.estado,
    inicioEm: cohort.inicioEm,
    fimEm: cohort.fimEm,
    vagas: cohort.vagas
  };
}

function resumoComunidade(comunidade: ComunidadeLearning) {
  return {
    id: comunidade.id,
    programaSlug: comunidade.programaSlug,
    titulo: comunidade.titulo,
    estado: comunidade.estado,
    acesso: comunidade.acesso
  };
}

function resumoModeracao(caso: CasoModeracaoLearning) {
  return {
    id: caso.id,
    alvoTipo: caso.alvoTipo,
    alvoId: caso.alvoId,
    estado: caso.estado,
    ocultoPublicamente: caso.ocultoPublicamente
  };
}

function extrairCompra(evento: EventoOperacional): CompraLearning | null {
  const compra = evento.payload.compra;
  if (!compra || typeof compra !== "object") return null;
  const candidato = compra as CompraLearning;
  if (!candidato.id || !candidato.programaSlug || !candidato.usuarioId) return null;
  return candidato;
}

function extrairEntitlement(evento: EventoOperacional): EntitlementLearning | null {
  const entitlement = evento.payload.entitlement;
  if (!entitlement || typeof entitlement !== "object") return null;
  const candidato = entitlement as EntitlementLearning;
  if (!candidato.id || !candidato.programaSlug || !candidato.usuarioId) return null;
  return candidato;
}

function extrairCertificado(evento: EventoOperacional): CertificadoLearning | null {
  const certificado = evento.payload.certificado;
  if (!certificado || typeof certificado !== "object") return null;
  const candidato = certificado as CertificadoLearning;
  if (!candidato.id || !candidato.codigoVerificacao || !candidato.programaSlug) return null;
  return candidato;
}

function extrairAtribuicao(evento: EventoOperacional): AtribuicaoLearning | null {
  const atribuicao = evento.payload.atribuicao;
  if (!atribuicao || typeof atribuicao !== "object") return null;
  const candidato = atribuicao as AtribuicaoLearning;
  if (!candidato.id || !candidato.programaSlug || !candidato.negocioId || !candidato.atribuidoPorId) return null;
  return {
    ...candidato,
    usuarioId: candidato.usuarioId || null,
    perfilAlvo: candidato.perfilAlvo ? candidato.perfilAlvo.toUpperCase() : null,
    obrigatoria: candidato.obrigatoria !== false,
    prazoAte: candidato.prazoAte || null,
    mensagem: candidato.mensagem || null,
    estado: normalizarEstadoAtribuicao(candidato.estado),
    entitlementId: candidato.entitlementId || null
  };
}

function extrairCohort(evento: EventoOperacional): CohortLearning | null {
  const cohort = evento.payload.cohort;
  if (!cohort || typeof cohort !== "object") return null;
  const candidato = cohort as CohortLearning;
  if (!candidato.id || !candidato.programaSlug || !candidato.programaTitulo || !candidato.criadoPorId) return null;
  return estadoTemporalCohort({
    ...candidato,
    estado: normalizarEstadoCohort(candidato.estado),
    titulo: candidato.titulo || candidato.programaTitulo,
    inicioEm: candidato.inicioEm || null,
    fimEm: candidato.fimEm || null,
    vagas: typeof candidato.vagas === "number" ? candidato.vagas : null,
    inscritos: typeof candidato.inscritos === "number" ? candidato.inscritos : 0,
    presencas: typeof candidato.presencas === "number" ? candidato.presencas : 0,
    salaUrl: candidato.salaUrl || null,
    replayUrl: candidato.replayUrl || null,
    replayDisponivel: candidato.replayDisponivel === true,
    regrasEntrada: candidato.regrasEntrada || "Entrada conforme entitlement ou atribuição Team.",
    mensagem: candidato.mensagem || null
  });
}

function extrairPresencaCohort(evento: EventoOperacional): PresencaCohortLearning | null {
  const presenca = evento.payload.presenca;
  if (!presenca || typeof presenca !== "object") return null;
  const candidato = presenca as PresencaCohortLearning;
  if (!candidato.id || !candidato.cohortId || !candidato.programaSlug || !candidato.usuarioId) return null;
  return {
    ...candidato,
    presente: candidato.presente !== false,
    notas: candidato.notas || null,
    entitlementId: candidato.entitlementId || null
  };
}

function extrairComunidade(evento: EventoOperacional): ComunidadeLearning | null {
  const comunidade = evento.payload.comunidade;
  if (!comunidade || typeof comunidade !== "object") return null;
  const candidato = comunidade as ComunidadeLearning;
  if (!candidato.id || !candidato.programaSlug || !candidato.programaTitulo || !candidato.titulo) return null;
  return {
    ...candidato,
    estado: normalizarEstadoComunidade(candidato.estado),
    acesso: normalizarAcessoComunidade(candidato.acesso),
    topicos: normalizarLista(candidato.topicos, []),
    regras: candidato.regras || "Participação conforme regras do perfil Learning.",
    moderadores: normalizarLista(candidato.moderadores, ["ADMIN"]),
    membrosEstimados: typeof candidato.membrosEstimados === "number" ? Math.max(0, candidato.membrosEstimados) : 0,
    membros: typeof candidato.membros === "number" ? Math.max(0, candidato.membros) : 0,
    posts: typeof candidato.posts === "number" ? Math.max(0, candidato.posts) : 0,
    anuncios: typeof candidato.anuncios === "number" ? Math.max(0, candidato.anuncios) : 0,
    perguntas: typeof candidato.perguntas === "number" ? Math.max(0, candidato.perguntas) : 0,
    ultimaAtividade: candidato.ultimaAtividade || null,
    postsRecentes: Array.isArray(candidato.postsRecentes) ? candidato.postsRecentes.slice(0, 5) : [],
    criadoPorId: candidato.criadoPorId || "BIZY",
    criadoEm: candidato.criadoEm || new Date(0).toISOString()
  };
}

function extrairPostComunidade(evento: EventoOperacional): PostComunidadeLearning | null {
  const post = evento.payload.post;
  if (!post || typeof post !== "object") return null;
  const candidato = post as PostComunidadeLearning;
  if (!candidato.id || !candidato.comunidadeId || !candidato.programaSlug || !candidato.conteudo) return null;
  return {
    ...candidato,
    tipo: normalizarTipoPostComunidade(candidato.tipo),
    titulo: candidato.titulo || null,
    conteudo: candidato.conteudo,
    autorNome: candidato.autorNome || "Membro Team",
    fixado: candidato.fixado === true
  };
}

function extrairCasoModeracao(evento: EventoOperacional): CasoModeracaoLearning | null {
  const caso = evento.payload.caso;
  if (!caso || typeof caso !== "object") return null;
  const candidato = caso as CasoModeracaoLearning;
  if (!candidato.id || !candidato.alvoTipo || !candidato.alvoId || !candidato.descricao) return null;
  const criadoEm = candidato.criadoEm || evento.criadoEm.toISOString();
  return {
    ...candidato,
    alvoTipo: normalizarTipoAlvoModeracao(candidato.alvoTipo),
    alvoId: candidato.alvoId,
    tituloAlvo: candidato.tituloAlvo || candidato.alvoId,
    programaSlug: candidato.programaSlug || null,
    comunidadeId: candidato.comunidadeId || null,
    postId: candidato.postId || null,
    motivo: normalizarMotivoModeracao(candidato.motivo),
    severidade: normalizarSeveridadeModeracao(candidato.severidade),
    descricao: candidato.descricao,
    estado: normalizarEstadoModeracao(candidato.estado) ?? "ABERTO",
    ocultoPublicamente: candidato.ocultoPublicamente === true,
    denuncianteNome: candidato.denuncianteNome || "Membro Team",
    revisadoPorId: candidato.revisadoPorId || null,
    decisao: candidato.decisao || null,
    criadoEm,
    atualizadoEm: candidato.atualizadoEm || criadoEm
  };
}

function extrairMensagemChat(evento: EventoOperacional): MensagemChatLearning | null {
  const mensagem = evento.payload.mensagem;
  if (!mensagem || typeof mensagem !== "object") return null;
  const candidato = mensagem as MensagemChatLearning;
  if (!candidato.id || !candidato.threadId || !candidato.programaSlug || !candidato.conteudo) return null;
  return {
    ...candidato,
    contexto: normalizarContextoChat(candidato.contexto),
    tipo: normalizarTipoMensagemChat(candidato.tipo),
    mencoes: Array.isArray(candidato.mencoes) ? candidato.mencoes.map(String).slice(0, 20) : []
  };
}

function estadoTemporalEntitlement(entitlement: EntitlementLearning): EntitlementLearning {
  if (entitlement.estado !== "ATIVO" || !entitlement.acessoAte) return entitlement;
  return new Date(entitlement.acessoAte).getTime() < Date.now()
    ? { ...entitlement, estado: "EXPIRADO" }
    : entitlement;
}

function estadoTemporalCohort<T extends Pick<CohortLearning, "estado" | "inicioEm" | "fimEm">>(cohort: T): T & { estado: EstadoCohortLearning } {
  if (cohort.estado === "CANCELADO") return cohort;
  const agora = Date.now();
  const inicio = cohort.inicioEm ? new Date(cohort.inicioEm).getTime() : null;
  const fim = cohort.fimEm ? new Date(cohort.fimEm).getTime() : null;
  if (fim && fim < agora) return { ...cohort, estado: "CONCLUIDO" };
  if (inicio && inicio > agora) return { ...cohort, estado: "AGENDADO" };
  if (inicio && inicio <= agora) return { ...cohort, estado: "EM_ANDAMENTO" };
  return { ...cohort, estado: "ABERTO" };
}

function estadoTemporalAtribuicao(
  atribuicao: AtribuicaoLearning,
  programasPorSlug: Map<string, ProgramaLearning>,
  conclusoesPorUsuarioPrograma: Map<string, Set<string>>
): AtribuicaoLearning {
  if (atribuicao.estado === "REVOGADA") return atribuicao;

  const programa = programasPorSlug.get(atribuicao.programaSlug);
  if (programa && atribuicao.usuarioId) {
    const concluidas = conclusoesPorUsuarioPrograma.get(`${atribuicao.usuarioId}:${atribuicao.programaSlug}`) ?? new Set<string>();
    if (programa.licoes.length > 0 && concluidas.size >= programa.licoes.length) {
      return { ...atribuicao, estado: "CONCLUIDA" };
    }
  }

  if (atribuicao.obrigatoria && atribuicao.prazoAte && new Date(atribuicao.prazoAte).getTime() < Date.now()) {
    return { ...atribuicao, estado: "ATRASADA" };
  }

  return { ...atribuicao, estado: "ATIVA" };
}

function adicionarDias(iso: string, dias: number): string {
  const data = new Date(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString();
}

function normalizarPrazoAte(valor?: string | null): string | null {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) throw new Error("Prazo da atribuição Learning inválido.");
  return data.toISOString();
}

function normalizarDataIsoOpcional(valor: string | null | undefined, mensagemErro: string): string | null {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) throw new Error(mensagemErro);
  return data.toISOString();
}

function gerarCodigoCertificado(negocioId: string, usuarioId: string, programaSlug: string, emitidoEm: string): string {
  return createHash("sha256")
    .update(`${negocioId}:${usuarioId}:${programaSlug}:${emitidoEm}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

function gerarIdAtribuicao(negocioId: string, programaSlug: string, targetKey: string, prazoAte: string | null): string {
  return `la_${createHash("sha256")
    .update(`${negocioId}:${programaSlug}:${targetKey}:${prazoAte ?? "sem-prazo"}`)
    .digest("hex")
    .slice(0, 18)}`;
}

function gerarIdCohort(negocioId: string, programaSlug: string, titulo: string, criadoEm: string): string {
  return `lc_${createHash("sha256")
    .update(`${negocioId}:${programaSlug}:${titulo}:${criadoEm}`)
    .digest("hex")
    .slice(0, 18)}`;
}

function gerarIdPresencaCohort(cohortId: string, usuarioId: string): string {
  return `lp_${createHash("sha256")
    .update(`${cohortId}:${usuarioId}`)
    .digest("hex")
    .slice(0, 18)}`;
}

function gerarIdComunidade(negocioId: string, programaSlug: string, titulo: string): string {
  return `lcm_${createHash("sha256")
    .update(`${negocioId}:${programaSlug}:${titulo}`)
    .digest("hex")
    .slice(0, 18)}`;
}

function regraEntradaPadrao(programa: ProgramaLearning): string {
  if (programa.tipoAcesso === "PAGO") return "Entrada exige compra confirmada, atribuição Team ou liberação manual auditada.";
  if (programa.tipoAcesso === "CONVITE" || programa.tipoAcesso === "PRIVADO") return "Entrada exige convite ou atribuição Team.";
  return "Entrada permitida para inscritos, membros atribuídos ou participantes aprovados pelo Team.";
}

function regraComunidadePadrao(programa: ProgramaLearning, acesso: AcessoComunidadeLearning): string {
  if (acesso === "ENTITLEMENT") return "Participação exige entitlement activo do produto Learning.";
  if (acesso === "MEMBERSHIP") return "Participação exige membership activo ou liberação manual pelo Team.";
  if (acesso === "CONVITE") return "Participação por convite, atribuição Team ou aprovação de moderador.";
  return programa.tipoAcesso === "PAGO"
    ? "Discussões públicas podem existir, mas materiais e suporte premium exigem entitlement activo."
    : "Participação aberta com moderação do perfil Learning.";
}

function normalizarAcessoComunidade(valor: unknown, programa?: ProgramaLearning): AcessoComunidadeLearning {
  if (valor === "ABERTO" || valor === "ENTITLEMENT" || valor === "MEMBERSHIP" || valor === "CONVITE") return valor;
  if (!programa) return "ENTITLEMENT";
  if (programa.formato === "MEMBERSHIP" || programa.formato === "COMUNIDADE") return "MEMBERSHIP";
  if (programa.tipoAcesso === "PAGO" || programa.tipoAcesso === "OBRIGATORIO") return "ENTITLEMENT";
  if (programa.tipoAcesso === "CONVITE" || programa.tipoAcesso === "PRIVADO") return "CONVITE";
  return "ABERTO";
}

function slugify(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "programa-learning";
}

function threadIdLearning(programaSlug: string, contexto: ContextoChatLearning): string {
  return `learning:${programaSlug}:${contexto.toLowerCase()}`;
}

function normalizarTipoMensagemChat(valor: unknown): TipoMensagemChatLearning {
  if (valor === "DECISAO" || valor === "TAREFA" || valor === "SUPORTE" || valor === "ANUNCIO") return valor;
  return "MENSAGEM";
}

function normalizarContextoChat(valor: unknown): ContextoChatLearning {
  if (valor === "COHORT" || valor === "COMUNIDADE" || valor === "SUPORTE") return valor;
  return "PROGRAMA";
}

function extrairPrograma(evento: EventoOperacional): ProgramaLearning | null {
  const programa = evento.payload.programa;
  if (!programa || typeof programa !== "object") return null;
  const candidato = programa as ProgramaLearning;
  if (!candidato.slug || !candidato.titulo) return null;
  return programaBase({
    ...candidato,
    formato: candidato.formato ?? "TRILHO",
    licoes: candidato.licoes ?? []
  });
}

function normalizarEstado(valor: unknown, fallback: EstadoProgramaLearning): EstadoProgramaLearning {
  if (valor === "RASCUNHO" || valor === "EM_REVISAO" || valor === "PUBLICADO" || valor === "PAUSADO" || valor === "ARQUIVADO" || valor === "SUSPENSO") return valor;
  return fallback;
}

function normalizarEstadoAtribuicao(valor: unknown): EstadoAtribuicaoLearning {
  if (valor === "CONCLUIDA" || valor === "ATRASADA" || valor === "REVOGADA") return valor;
  return "ATIVA";
}

function normalizarEstadoCohort(valor: unknown): EstadoCohortLearning {
  if (valor === "AGENDADO" || valor === "EM_ANDAMENTO" || valor === "CONCLUIDO" || valor === "CANCELADO") return valor;
  return "ABERTO";
}

function normalizarEstadoComunidade(valor: unknown): EstadoComunidadeLearning {
  if (valor === "PRIVADA" || valor === "PAUSADA" || valor === "ARQUIVADA") return valor;
  return "ABERTA";
}

function normalizarTipoPostComunidade(valor: unknown): TipoPostComunidadeLearning {
  if (valor === "PERGUNTA" || valor === "RESPOSTA" || valor === "MATERIAL" || valor === "DESAFIO") return valor;
  return "ANUNCIO";
}

function normalizarTipoAlvoModeracao(valor: unknown): TipoAlvoModeracaoLearning {
  if (valor === "COMUNIDADE" || valor === "POST" || valor === "PERFIL" || valor === "MENTOR" || valor === "CERTIFICADO") return valor;
  return "PROGRAMA";
}

function normalizarMotivoModeracao(valor: unknown): MotivoModeracaoLearning {
  if (
    valor === "SPAM" ||
    valor === "DIREITOS_AUTORAIS" ||
    valor === "FRAUDE" ||
    valor === "ASSEDIO" ||
    valor === "INFORMACAO_ERRADA" ||
    valor === "OUTRO"
  ) {
    return valor;
  }
  return "CONTEUDO_SENSIVEL";
}

function normalizarSeveridadeModeracao(valor: unknown): SeveridadeModeracaoLearning {
  if (valor === "BAIXA" || valor === "ALTA" || valor === "CRITICA") return valor;
  return "MEDIA";
}

function normalizarEstadoModeracao(valor: unknown): EstadoCasoModeracaoLearning | null {
  if (valor === "ABERTO" || valor === "EM_REVISAO" || valor === "OCULTO_TEMPORARIAMENTE" || valor === "RESOLVIDO" || valor === "REJEITADO") return valor;
  return null;
}

function normalizarAcaoModeracao(valor: unknown): AcaoModeracaoLearning {
  if (valor === "OCULTAR_TEMPORARIAMENTE" || valor === "RESOLVER" || valor === "REJEITAR" || valor === "REABRIR") return valor;
  return "COLOCAR_EM_REVISAO";
}

function estadoPorAcaoModeracao(acao: AcaoModeracaoLearning): EstadoCasoModeracaoLearning {
  if (acao === "OCULTAR_TEMPORARIAMENTE") return "OCULTO_TEMPORARIAMENTE";
  if (acao === "RESOLVER") return "RESOLVIDO";
  if (acao === "REJEITAR") return "REJEITADO";
  if (acao === "REABRIR") return "ABERTO";
  return "EM_REVISAO";
}

function definirOcultacaoModeracao(
  caso: CasoModeracaoLearning,
  acao: AcaoModeracaoLearning,
  estado: EstadoCasoModeracaoLearning,
  valor?: boolean
): boolean {
  if (typeof valor === "boolean") return valor;
  if (acao === "OCULTAR_TEMPORARIAMENTE" || estado === "OCULTO_TEMPORARIAMENTE") return true;
  if (estado === "RESOLVIDO" || estado === "REJEITADO") return false;
  return caso.ocultoPublicamente;
}

function decisaoPadraoModeracao(acao: AcaoModeracaoLearning, estado: EstadoCasoModeracaoLearning): string {
  if (acao === "OCULTAR_TEMPORARIAMENTE") return "Conteúdo ocultado temporariamente até revisão humana.";
  if (acao === "RESOLVER") return "Caso resolvido pela equipa Team.";
  if (acao === "REJEITAR") return "Denúncia rejeitada após revisão.";
  if (acao === "REABRIR") return "Caso reaberto para nova análise.";
  if (estado === "EM_REVISAO") return "Caso colocado em revisão.";
  return "Decisão de moderação registada.";
}
