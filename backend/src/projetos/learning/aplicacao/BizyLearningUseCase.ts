import { createHash, randomUUID } from "node:crypto";
import type { RepositorioEventosOperacionais } from "../../../dominio/repositorios/contratos.js";
import type { EventoOperacional } from "../../../dominio/tipos.js";

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

export interface EnviarMensagemChatLearningInput {
  programaSlug: string;
  conteudo: string;
  tipo?: TipoMensagemChatLearning;
  contexto?: ContextoChatLearning;
  mencoes?: string[];
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
  constructor(private readonly eventosOperacionais: RepositorioEventosOperacionais) {}

  async obterHomePublica() {
    const programas = PROGRAMAS_BASE.filter((programa) => programa.estado === "PUBLICADO" && programa.visibilidade === "PUBLICO");
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
        minutos: programas.reduce((total, programa) => total + programa.duracaoMinutos, 0),
        receitaPotencial: programas.reduce((total, programa) => total + valorOferta(programa), 0)
      },
      perfis: PERFIS_LEARNING,
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
    return this.obterProgramaPublico(slug);
  }

  async obterResumoTeam(negocioId: string, usuarioId: string, papel: string, permissoes: string[]) {
    const programas = await this.listarProgramasDoNegocio(negocioId);
    const progresso = await this.obterProgresso(negocioId, usuarioId);
    const compras = await this.listarCompras(negocioId);
    const entitlements = await this.listarEntitlements(negocioId);
    const certificados = await this.listarCertificados(negocioId);
    const progressoPorSlug = new Map(progresso.programas.map((item) => [item.programaSlug, item]));
    const papelNormalizado = papel.toUpperCase();
    const podeAdministrar = podeAdministrarLearning(papelNormalizado, permissoes);
    const recomendados = programas
      .filter((programa) => programa.estado === "PUBLICADO")
      .filter((programa) => programa.perfisAlvo.includes(papelNormalizado) || programa.perfisAlvo.includes("GESTOR"))
      .slice(0, 4);
    const publicados = programas.filter((programa) => programa.estado === "PUBLICADO").length;
    const inscritos = progresso.programas.filter((item) => item.inscrito).length;

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
        concluidos: progresso.programas.filter((item) => item.concluido).length
      },
      compras: compras.slice(0, 20),
      entitlements: entitlements.filter((entitlement) => entitlement.usuarioId === usuarioId || podeAdministrar).slice(0, 50),
      certificados: certificados.filter((certificado) => certificado.usuarioId === usuarioId || podeAdministrar).slice(0, 50),
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
    return eventos
      .filter((evento) => evento.tipo === "LEARNING_COMPRA_DIGITAL_CRIADA")
      .map(extrairCompra)
      .filter((compra): compra is CompraLearning => Boolean(compra))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
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
}

function podeAdministrarLearning(papel: string, permissoes: string[]): boolean {
  return ["DONO", "ADMIN"].includes(papel) || permissoes.includes("learning:administrar") || permissoes.includes("equipa:gestao");
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

function adicionarDias(iso: string, dias: number): string {
  const data = new Date(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString();
}

function gerarCodigoCertificado(negocioId: string, usuarioId: string, programaSlug: string, emitidoEm: string): string {
  return createHash("sha256")
    .update(`${negocioId}:${usuarioId}:${programaSlug}:${emitidoEm}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
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
