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
    minutos: number;
    receitaPotencial: number;
  };
  perfis: PerfilLearning[];
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
  };
  compras: CompraLearning[];
  entitlements: EntitlementLearning[];
  certificados: CertificadoLearning[];
  chat: ChatInternoLearning;
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

export interface EnviarMensagemChatLearningInput {
  programaSlug: string;
  conteudo: string;
  tipo?: TipoMensagemChatLearning;
  contexto?: ContextoChatLearning;
  mencoes?: string[];
}

export function obterHomeLearning(): Promise<HomeLearningResposta> {
  return requisitarApi<HomeLearningResposta>("/publico/learning", {}, false);
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

export function obterAcessosLearning(): Promise<{ compras: CompraLearning[]; entitlements: EntitlementLearning[]; certificados: CertificadoLearning[] }> {
  return requisitarApi("/learning/entitlements");
}

export function emitirCertificadoLearning(slug: string): Promise<{ certificado: CertificadoLearning; duplicado: boolean }> {
  return requisitarApi(`/learning/programas/${encodeURIComponent(slug)}/certificado`, { method: "POST" });
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
