import { requisitarApi } from "../../api";

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
export type VerboExperienciaLearning = "EXPERIENCED" | "COMPLETED" | "PASSED" | "FAILED" | "VIEWED" | "DOWNLOADED";
export type ObjetoExperienciaLearning = "PROGRAMA" | "LICAO" | "QUIZ" | "CERTIFICADO" | "COHORT" | "COMUNIDADE";
export type OrigemExperienciaLearning = "PLAYER" | "TEAM" | "API";

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

export interface ProgressoLearning {
  programaSlug: string;
  inscrito: boolean;
  inscritoEm: string | null;
  licoesConcluidas: string[];
  totalLicoes: number;
  percentual: number;
  concluido: boolean;
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
  progresso?: ProgressoLearning;
}

export interface PerfilLearningPublico {
  slug: string;
  negocioId: string;
  nomePublico: string;
  nomeNegocio: string;
  descricaoPublica: string;
  categorias: string[];
  canaisSuporte: string[];
  politicaSuporte: string;
  localizacao?: string | null;
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
  moeda: string;
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
  estado: "PENDENTE_VALIDACAO" | "CONFIRMADO" | "CANCELADO" | "REEMBOLSADO";
  valor: number;
  moeda: string;
  metodoPagamento?: string | null;
  referenciaPagamento?: string | null;
  comprovativoUrl?: string | null;
  factura?: {
    tipo: "FACTURA_RECIBO" | "COMPROVATIVO_DIGITAL" | "INSCRICAO_GRATUITA";
    numero: string;
    origemTipo: "LEARNING";
    origemId: string;
    emitidoEm: string;
  } | null;
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
  estado: "ATIVO" | "PENDENTE" | "EXPIRADO" | "REVOGADO";
  acessoDesde: string;
  acessoAte?: string | null;
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
  revogadoEm?: string | null;
  motivoRevogacao?: string | null;
  badge?: {
    issuer: string;
    criteria: string;
    evidence: string;
    achievementType: "CERTIFICATE" | "BADGE";
    version: string;
  } | null;
  verificacao?: {
    metodo: "CODIGO";
    codigo: string;
    url: string;
  } | null;
}

export interface CertificadoPublicoLearning {
  codigoVerificacao: string;
  programaSlug: string;
  negocioId: string;
  emitidoEm: string;
  validadeAte: string | null;
  estado: "VALIDO" | "REVOGADO";
  revogadoEm: string | null;
  titularHash: string;
  badge: {
    issuer: string;
    criteria: string;
    achievementType: "CERTIFICATE" | "BADGE";
    version: string;
  } | null;
}

export interface ExportacaoCertificadoLearning {
  formato: "bizy.learning.certificate.export.v1";
  exportadoEm: string;
  certificado: CertificadoLearning;
  badge: {
    formato: "open-badges-lite.v1";
    id: string;
    type: string[];
    issuer: string;
    issuanceDate: string;
    expirationDate: string | null;
    credentialSubject: {
      id: string;
      achievement: {
        id: string;
        type: string;
        criteria: string;
      };
    };
    evidence: string | null;
    credentialStatus: {
      type: string;
      status: string;
      revokedAt: string | null;
    };
    verification: {
      type: string;
      code: string;
      publicUrl: string;
    };
  };
  verificacao: {
    valido: boolean;
    verificadoEm: string;
  };
  reprocessamento: {
    negocioId: string;
    usuarioId: string;
    programaSlug: string;
    codigoVerificacao: string;
    estado: string;
    eventoFonte: string;
  };
  auditoria: {
    hash: string;
    algoritmo: "sha256";
    preservaEventoOriginal: boolean;
  };
}

export interface EventoExperienciaLearning {
  id: string;
  negocioId: string;
  usuarioId: string;
  programaSlug: string;
  verbo: VerboExperienciaLearning;
  objetoTipo: ObjetoExperienciaLearning;
  objetoId: string;
  origem: OrigemExperienciaLearning;
  resultado: Record<string, unknown>;
  contexto: Record<string, unknown>;
  criadoEm: string;
}

export interface PlayerProgramaLearning {
  programa: ProgramaLearning;
  entitlement: EntitlementLearning | null;
  progresso: ProgressoLearning;
  seguranca: {
    cache: "no-store";
    conteudoPremiumProtegido: boolean;
    acessoValidadoEm: string;
  };
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

export interface HomeLearningResposta {
  produto: string;
  tese: string;
  metricas: {
    programas: number;
    produtosDigitais: number;
    pagos: number;
    gratuitos: number;
    trilhos: number;
    comunidades: number;
    perfisPublicos: number;
    minutos: number;
    receitaPotencial: number;
  };
  perfis: PerfilLearning[];
  perfisPublicos: PerfilLearningPublico[];
  destaques: ProgramaLearning[];
  programas: ProgramaLearning[];
  categorias: string[];
  familias: string[];
}

export interface ResumoLearningTeamResposta {
  podeAdministrar: boolean;
  perfis: PerfilLearning[];
  programas: ProgramaLearning[];
  recomendados: ProgramaLearning[];
  metricas: {
    programas: number;
    publicados: number;
    rascunhos: number;
    produtosPagos: number;
    comprasConfirmadas: number;
    receitaLearning: number;
    entitlementsAtivos: number;
    certificados: number;
    inscritos: number;
    concluidos: number;
    atribuicoesAtivas: number;
    formacoesObrigatorias: number;
    atribuicoesAtrasadas: number;
    cohortsAtivos: number;
    vagasCohorts: number;
    presencasCohorts: number;
    replaysDisponiveis: number;
    comunidadesAtivas: number;
    postsComunidade: number;
    anunciosComunidade: number;
    perguntasComunidade: number;
    denunciasLearning: number;
    casosModeracaoAbertos: number;
    conteudosOcultosLearning: number;
    visualizacoesPublicas: number;
    previewsPublicos: number;
    ctasCheckoutLearning: number;
    ctasInscricaoLearning: number;
  };
  compras: CompraLearning[];
  entitlements: EntitlementLearning[];
  certificados: CertificadoLearning[];
  atribuicoes: AtribuicaoLearning[];
  cohorts: CohortLearning[];
  comunidades: ComunidadeLearning[];
  moderacao: CasoModeracaoLearning[];
  analytics: AnalyticsLearningTeam;
  chat: ChatInternoLearning;
}

export interface AnalyticsLearningTeam {
  metricas: {
    visualizacoesPublicas: number;
    previewsPublicos: number;
    ctasCheckout: number;
    ctasInscricao: number;
    produtosComEventos: number;
  };
  produtos: Array<{
    programaSlug: string;
    programaTitulo: string;
    visualizacoes: number;
    previews: number;
    ctasCheckout: number;
    ctasInscricao: number;
    ultimoEventoEm: string | null;
  }>;
  perfis: Array<{
    perfilSlug: string;
    visualizacoes: number;
    previews: number;
    ctas: number;
  }>;
  ultimosEventos: Array<{
    id: string;
    tipo: "VISUALIZACAO" | "PREVIEW" | "CTA_CHECKOUT" | "CTA_INSCRICAO";
    programaSlug: string;
    perfilSlug: string | null;
    negocioId: string;
    origemPrograma: "BIZY" | "TEAM";
    familiaProduto: string;
    categoria: string;
    fonte: string | null;
    criadoEm: string;
  }>;
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
  estado: "CANCELADO" | "REEMBOLSADO";
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

export function obterHomeLearning(): Promise<HomeLearningResposta> {
  return requisitarApi<HomeLearningResposta>("/publico/learning", {}, false);
}

export function obterPerfilLearning(slug: string): Promise<{ perfil: PerfilLearningPublico }> {
  return requisitarApi<{ perfil: PerfilLearningPublico }>(`/publico/learning/perfis/${encodeURIComponent(slug)}`, {}, false);
}

export function obterResumoLearningTeam(): Promise<ResumoLearningTeamResposta> {
  return requisitarApi<ResumoLearningTeamResposta>("/learning/team/resumo");
}

export function criarProgramaLearningTeam(dados: CriarProgramaLearningInput): Promise<{ programa: ProgramaLearning }> {
  return requisitarApi<{ programa: ProgramaLearning }>("/learning/team/programas", {
    method: "POST",
    body: dados
  });
}

export function criarProdutoLearningTeam(dados: CriarProgramaLearningInput): Promise<{ programa: ProgramaLearning }> {
  return requisitarApi<{ programa: ProgramaLearning }>("/learning/team/produtos", {
    method: "POST",
    body: dados
  });
}

export function alterarPublicacaoLearning(
  slug: string,
  dados: { estado: EstadoProgramaLearning; destaque?: boolean; visibilidade?: "PUBLICO" | "TEAM" }
): Promise<{ programa: ProgramaLearning }> {
  return requisitarApi<{ programa: ProgramaLearning }>(`/learning/team/programas/${encodeURIComponent(slug)}/publicacao`, {
    method: "PATCH",
    body: dados
  });
}

export function atribuirProgramaLearningTeam(
  slug: string,
  dados: AtribuirProgramaLearningInput
): Promise<{ atribuicao: AtribuicaoLearning; entitlement: EntitlementLearning | null; duplicado: boolean }> {
  return requisitarApi(`/learning/team/programas/${encodeURIComponent(slug)}/atribuir`, {
    method: "POST",
    body: dados
  });
}

export function listarCohortsLearningTeam(): Promise<{ cohorts: CohortLearning[] }> {
  return requisitarApi("/learning/team/cohorts");
}

export function abrirCohortLearningTeam(
  slug: string,
  dados: AbrirCohortLearningInput
): Promise<{ cohort: CohortLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/team/programas/${encodeURIComponent(slug)}/cohorts`, {
    method: "POST",
    body: dados
  });
}

export function registrarPresencaCohortLearning(
  id: string,
  dados: RegistrarPresencaCohortLearningInput
): Promise<{ presenca: PresencaCohortLearning; entitlement: EntitlementLearning | null; duplicado: boolean }> {
  return requisitarApi(`/learning/team/cohorts/${encodeURIComponent(id)}/presencas`, {
    method: "POST",
    body: dados
  });
}

export function listarComunidadesLearningTeam(): Promise<{ comunidades: ComunidadeLearning[] }> {
  return requisitarApi("/learning/team/comunidades");
}

export function criarComunidadeLearningTeam(
  slug: string,
  dados: CriarComunidadeLearningInput
): Promise<{ comunidade: ComunidadeLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/team/programas/${encodeURIComponent(slug)}/comunidades`, {
    method: "POST",
    body: dados
  });
}

export function publicarPostComunidadeLearning(
  id: string,
  dados: PublicarPostComunidadeLearningInput
): Promise<{ post: PostComunidadeLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/team/comunidades/${encodeURIComponent(id)}/posts`, {
    method: "POST",
    body: dados
  });
}

export function listarModeracaoLearningTeam(): Promise<{ casos: CasoModeracaoLearning[] }> {
  return requisitarApi("/learning/team/moderacao");
}

export function denunciarConteudoLearning(dados: DenunciarConteudoLearningInput): Promise<{ caso: CasoModeracaoLearning; duplicado: boolean }> {
  return requisitarApi("/learning/team/moderacao/denuncias", {
    method: "POST",
    body: dados
  });
}

export function decidirModeracaoLearning(
  id: string,
  dados: DecidirModeracaoLearningInput
): Promise<{ caso: CasoModeracaoLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/team/moderacao/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: dados
  });
}

export function inscreverProgramaLearning(slug: string): Promise<unknown> {
  return requisitarApi(`/learning/programas/${encodeURIComponent(slug)}/inscrever`, { method: "POST" });
}

export function concluirLicaoLearning(licaoId: string): Promise<unknown> {
  return requisitarApi(`/learning/licoes/${encodeURIComponent(licaoId)}/concluir`, { method: "POST" });
}

export function checkoutLearning(dados: CheckoutLearningInput): Promise<{ compra: CompraLearning; entitlement: EntitlementLearning | null; duplicado: boolean }> {
  return requisitarApi("/learning/checkout", {
    method: "POST",
    body: dados
  });
}

export function ajustarCompraLearningTeam(
  id: string,
  dados: AjustarCompraLearningInput
): Promise<{ compra: CompraLearning; entitlementsRevogados: EntitlementLearning[]; duplicado: boolean }> {
  return requisitarApi(`/learning/team/compras/${encodeURIComponent(id)}/ajustar`, {
    method: "POST",
    body: dados
  });
}

export function obterAcessosLearning(): Promise<{ compras: CompraLearning[]; entitlements: EntitlementLearning[]; certificados: CertificadoLearning[] }> {
  return requisitarApi("/learning/entitlements");
}

export function emitirCertificadoLearning(slug: string): Promise<{ certificado: CertificadoLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/programas/${encodeURIComponent(slug)}/certificado`, { method: "POST" });
}

export function verificarCertificadoPublicoLearning(
  negocioId: string,
  codigo: string
): Promise<{ certificado: CertificadoPublicoLearning; verificacao: { valido: boolean; verificadoEm: string } }> {
  return requisitarApi(
    `/publico/learning/certificados/${encodeURIComponent(negocioId)}/${encodeURIComponent(codigo)}`,
    {},
    false
  );
}

export function obterPlayerProgramaLearning(slug: string): Promise<PlayerProgramaLearning> {
  return requisitarApi(`/learning/player/programas/${encodeURIComponent(slug)}`);
}

export function registrarExperienciaLearning(dados: {
  programaSlug: string;
  verbo?: VerboExperienciaLearning;
  objetoTipo?: ObjetoExperienciaLearning;
  objetoId?: string | null;
  origem?: OrigemExperienciaLearning;
  resultado?: Record<string, unknown>;
  contexto?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<{ experiencia: EventoExperienciaLearning; duplicado: boolean }> {
  return requisitarApi("/learning/team/experiencias", {
    method: "POST",
    body: dados
  });
}

export function registrarEventoPlayerLearning(dados: {
  programaSlug: string;
  verbo?: VerboExperienciaLearning;
  objetoTipo?: ObjetoExperienciaLearning;
  objetoId?: string | null;
  resultado?: Record<string, unknown>;
  contexto?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<{ experiencia: EventoExperienciaLearning; duplicado: boolean }> {
  return requisitarApi("/learning/player/eventos", {
    method: "POST",
    body: dados
  });
}

export function listarExperienciasLearning(filtros?: {
  programaSlug?: string;
  usuarioId?: string;
  limite?: number;
}): Promise<{ experiencias: EventoExperienciaLearning[] }> {
  const params = new URLSearchParams();
  if (filtros?.programaSlug) params.set("programaSlug", filtros.programaSlug);
  if (filtros?.usuarioId) params.set("usuarioId", filtros.usuarioId);
  if (filtros?.limite) params.set("limite", String(filtros.limite));
  const query = params.toString();
  return requisitarApi(`/learning/team/experiencias${query ? `?${query}` : ""}`);
}

export function obterCertificadoLearning(codigo: string): Promise<{ certificado: CertificadoLearning }> {
  return requisitarApi(`/learning/team/certificados/${encodeURIComponent(codigo)}`);
}

export function exportarCertificadoLearning(codigo: string): Promise<ExportacaoCertificadoLearning> {
  return requisitarApi(`/learning/team/certificados/${encodeURIComponent(codigo)}/exportar`);
}

export function revogarCertificadoLearning(
  codigo: string,
  motivo: string
): Promise<{ certificado: CertificadoLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/team/certificados/${encodeURIComponent(codigo)}/revogar`, {
    method: "POST",
    body: { motivo }
  });
}

export function revogarEntitlementLearning(id: string, motivo: string): Promise<{ entitlement: EntitlementLearning }> {
  return requisitarApi(`/learning/entitlements/${encodeURIComponent(id)}/revogar`, {
    method: "POST",
    body: { motivo }
  });
}

export function listarChatInternoLearning(programaSlug?: string): Promise<ChatInternoLearning> {
  const query = programaSlug ? `?programaSlug=${encodeURIComponent(programaSlug)}` : "";
  return requisitarApi<ChatInternoLearning>(`/learning/team/chat${query}`);
}

export function enviarMensagemChatLearning(dados: EnviarMensagemChatLearningInput): Promise<{ mensagem: MensagemChatLearning; duplicado: boolean }> {
  return requisitarApi("/learning/team/chat/mensagens", {
    method: "POST",
    body: dados
  });
}
