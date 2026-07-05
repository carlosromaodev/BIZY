import type { EventoOperacional } from "../../../dominio/tipos.js";
import type {
  LicaoLearning,
  ModeloOfertaLearning,
  PerfilPublicoLearning,
  ProgramaLearning,
  TipoAcessoLearning
} from "./BizyLearningUseCase.js";

export type TipoEventoPublicoLearning = "VISUALIZACAO" | "PREVIEW" | "CTA_CHECKOUT" | "CTA_INSCRICAO";

export interface PerfilResumoProdutoLearning {
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
  origem: "PERFIL" | "BIZY";
}

export interface ProdutoPublicoLearning {
  programa: ProgramaLearning;
  perfil: PerfilResumoProdutoLearning;
  preview: {
    resumo: string;
    licoesLiberadas: number;
    licoesBloqueadas: number;
    licoes: LicaoLearning[];
    conteudoPremiumProtegido: boolean;
  };
  checkout: {
    tipoAcesso: TipoAcessoLearning;
    modelo: ModeloOfertaLearning;
    moeda: string;
    valor: number;
    valorPromocional: number | null;
    requerPagamento: boolean;
    permiteComprovativo: boolean;
    emiteDocumento: boolean;
    textoBotao: string;
    politicaAcesso: ProgramaLearning["politicaAcesso"];
  };
  sinaisConfianca: string[];
  relacionados: ProgramaLearning[];
  seo: {
    titulo: string;
    descricao: string;
    urlCanonica: string;
  };
}

export interface EventoPublicoLearning {
  id: string;
  tipo: TipoEventoPublicoLearning;
  programaSlug: string;
  perfilSlug: string | null;
  negocioId: string;
  origemPrograma: ProgramaLearning["origem"];
  familiaProduto: string;
  categoria: string;
  fonte: string | null;
  criadoEm: string;
}

export interface RegistrarEventoPublicoLearningInput {
  tipo?: TipoEventoPublicoLearning;
  programaSlug: string;
  perfilSlug?: string | null;
  fonte?: string | null;
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
  ultimosEventos: EventoPublicoLearning[];
}

export function montarProdutoPublico(
  programa: ProgramaLearning,
  perfil: PerfilPublicoLearning | null,
  programas: ProgramaLearning[]
): ProdutoPublicoLearning {
  const programaSeguro = sanitizarProgramaPublico(programa);
  const licoesLiberadas = Math.min(programa.previewSeguro.licoesLiberadas, programa.licoes.length);
  const relacionados = programas
    .filter((item) => item.slug !== programa.slug)
    .filter((item) =>
      item.categoria === programa.categoria ||
      item.familiaProduto === programa.familiaProduto ||
      item.perfisAlvo.some((perfilAlvo) => programa.perfisAlvo.includes(perfilAlvo))
    )
    .slice(0, 3)
    .map(sanitizarProgramaPublico);

  return {
    programa: programaSeguro,
    perfil: perfil ? {
      slug: perfil.slug,
      negocioId: perfil.negocioId,
      nomePublico: perfil.nomePublico,
      nomeNegocio: perfil.nomeNegocio,
      descricaoPublica: perfil.descricaoPublica,
      categorias: perfil.categorias,
      canaisSuporte: perfil.canaisSuporte,
      politicaSuporte: perfil.politicaSuporte,
      localizacao: perfil.localizacao,
      urlPublica: perfil.urlPublica,
      origem: "PERFIL"
    } : perfilOficialBizy(),
    preview: {
      resumo: programa.previewSeguro.resumo,
      licoesLiberadas,
      licoesBloqueadas: Math.max(0, programa.licoes.length - licoesLiberadas),
      licoes: programa.licoes.slice(0, licoesLiberadas),
      conteudoPremiumProtegido: ["PAGO", "PRIVADO", "CONVITE"].includes(programa.tipoAcesso)
    },
    checkout: {
      tipoAcesso: programa.tipoAcesso,
      modelo: programa.oferta.modelo,
      moeda: programa.oferta.moeda,
      valor: programa.oferta.valor,
      valorPromocional: programa.oferta.valorPromocional ?? null,
      requerPagamento: programa.tipoAcesso === "PAGO" && valorOfertaPublico(programa) > 0,
      permiteComprovativo: programa.oferta.permiteComprovativo,
      emiteDocumento: programa.oferta.emiteDocumento,
      textoBotao: textoBotaoProdutoPublico(programa),
      politicaAcesso: programa.politicaAcesso
    },
    sinaisConfianca: sinaisConfiancaProduto(programa, perfil),
    relacionados,
    seo: {
      titulo: `${programa.titulo} | Bizy Learning`,
      descricao: programa.previewSeguro.resumo || programa.subtitulo || programa.descricao,
      urlCanonica: `/learning/produtos/${programa.slug}`
    }
  };
}

export function resumirEventosPublicosLearning(
  eventos: EventoPublicoLearning[],
  programas: ProgramaLearning[]
): AnalyticsLearningTeam {
  const programasPorSlug = new Map(programas.map((programa) => [programa.slug, programa]));
  const porProduto = new Map<string, AnalyticsLearningTeam["produtos"][number]>();
  const porPerfil = new Map<string, AnalyticsLearningTeam["perfis"][number]>();

  for (const evento of eventos) {
    const programa = programasPorSlug.get(evento.programaSlug);
    const produto = porProduto.get(evento.programaSlug) ?? {
      programaSlug: evento.programaSlug,
      programaTitulo: programa?.titulo ?? evento.programaSlug,
      visualizacoes: 0,
      previews: 0,
      ctasCheckout: 0,
      ctasInscricao: 0,
      ultimoEventoEm: null
    };
    if (evento.tipo === "VISUALIZACAO") produto.visualizacoes += 1;
    if (evento.tipo === "PREVIEW") produto.previews += 1;
    if (evento.tipo === "CTA_CHECKOUT") produto.ctasCheckout += 1;
    if (evento.tipo === "CTA_INSCRICAO") produto.ctasInscricao += 1;
    produto.ultimoEventoEm = produto.ultimoEventoEm && produto.ultimoEventoEm > evento.criadoEm ? produto.ultimoEventoEm : evento.criadoEm;
    porProduto.set(evento.programaSlug, produto);

    if (evento.perfilSlug) {
      const perfil = porPerfil.get(evento.perfilSlug) ?? { perfilSlug: evento.perfilSlug, visualizacoes: 0, previews: 0, ctas: 0 };
      if (evento.tipo === "VISUALIZACAO") perfil.visualizacoes += 1;
      if (evento.tipo === "PREVIEW") perfil.previews += 1;
      if (evento.tipo === "CTA_CHECKOUT" || evento.tipo === "CTA_INSCRICAO") perfil.ctas += 1;
      porPerfil.set(evento.perfilSlug, perfil);
    }
  }

  return {
    metricas: {
      visualizacoesPublicas: eventos.filter((evento) => evento.tipo === "VISUALIZACAO").length,
      previewsPublicos: eventos.filter((evento) => evento.tipo === "PREVIEW").length,
      ctasCheckout: eventos.filter((evento) => evento.tipo === "CTA_CHECKOUT").length,
      ctasInscricao: eventos.filter((evento) => evento.tipo === "CTA_INSCRICAO").length,
      produtosComEventos: porProduto.size
    },
    produtos: [...porProduto.values()]
      .sort((a, b) => totalEventosProduto(b) - totalEventosProduto(a))
      .slice(0, 20),
    perfis: [...porPerfil.values()]
      .sort((a, b) => (b.visualizacoes + b.previews + b.ctas) - (a.visualizacoes + a.previews + a.ctas))
      .slice(0, 20),
    ultimosEventos: eventos.slice(0, 20)
  };
}

export function extrairEventoPublicoLearning(evento: EventoOperacional): EventoPublicoLearning | null {
  const eventoPublico = evento.payload.evento;
  if (!eventoPublico || typeof eventoPublico !== "object") return null;
  const candidato = eventoPublico as EventoPublicoLearning;
  if (!candidato.id || !candidato.programaSlug) return null;
  return {
    id: candidato.id,
    tipo: normalizarTipoEventoPublicoLearning(candidato.tipo),
    programaSlug: candidato.programaSlug,
    perfilSlug: candidato.perfilSlug || null,
    negocioId: candidato.negocioId || evento.negocioId,
    origemPrograma: candidato.origemPrograma === "TEAM" ? "TEAM" : "BIZY",
    familiaProduto: candidato.familiaProduto || "Learning",
    categoria: candidato.categoria || "Learning",
    fonte: candidato.fonte || null,
    criadoEm: candidato.criadoEm || evento.criadoEm.toISOString()
  };
}

export function normalizarTipoEventoPublicoLearning(valor: unknown): TipoEventoPublicoLearning {
  if (valor === "PREVIEW" || valor === "CTA_CHECKOUT" || valor === "CTA_INSCRICAO") return valor;
  return "VISUALIZACAO";
}

function perfilOficialBizy(): PerfilResumoProdutoLearning {
  return {
    slug: "bizy-learning",
    negocioId: "bizy-learning",
    nomePublico: "Bizy Learning",
    nomeNegocio: "Bizy",
    descricaoPublica: "Produtos oficiais Bizy para operação, vendas, atendimento, Market e finanças.",
    categorias: ["Team", "Market", "Financas", "Atendimento"],
    canaisSuporte: ["Team", "Suporte Bizy"],
    politicaSuporte: "Suporte operacional pelo Team e pelos canais oficiais Bizy.",
    localizacao: null,
    urlPublica: "/learning",
    origem: "BIZY"
  };
}

function sanitizarProgramaPublico(programa: ProgramaLearning): ProgramaLearning {
  const licoesLiberadas = Math.min(programa.previewSeguro.licoesLiberadas, programa.licoes.length);
  return {
    ...programa,
    previewSeguro: {
      ...programa.previewSeguro,
      incluiConteudoPremium: false
    },
    licoes: programa.licoes.map((licao, indice) => indice < licoesLiberadas
      ? licao
      : { ...licao, accaoBizy: undefined })
  };
}

function textoBotaoProdutoPublico(programa: ProgramaLearning): string {
  if (programa.tipoAcesso === "PAGO") return "Comprar acesso digital";
  if (programa.tipoAcesso === "GRATUITO") return "Inscrever grátis";
  if (programa.tipoAcesso === "CONVITE") return "Solicitar convite";
  if (programa.tipoAcesso === "PRIVADO") return "Solicitar acesso";
  return "Acessar pelo Team";
}

function sinaisConfiancaProduto(programa: ProgramaLearning, perfil: PerfilPublicoLearning | null): string[] {
  const sinais = [
    programa.oferta.emiteDocumento ? "Documento digital quando aplicável" : "Inscrição rastreável",
    programa.certificadoConfigurado ? "Certificado verificável" : "Conclusão sem certificado obrigatório",
    programa.comunidade ? "Comunidade ou suporte associado" : "Suporte pelo perfil Learning",
    perfil ? `Vendido por ${perfil.nomePublico}` : "Produto oficial Bizy"
  ];
  if (programa.oferta.permiteComprovativo) sinais.push("Comprovativo digital suportado");
  if (programa.cohort) sinais.push("Pode operar com cohort/turma");
  return [...new Set(sinais)].slice(0, 6);
}

function valorOfertaPublico(programa: Pick<ProgramaLearning, "oferta">): number {
  return typeof programa.oferta.valorPromocional === "number" && programa.oferta.valorPromocional > 0
    ? programa.oferta.valorPromocional
    : programa.oferta.valor;
}

function totalEventosProduto(produto: AnalyticsLearningTeam["produtos"][number]): number {
  return produto.visualizacoes + produto.previews + produto.ctasCheckout + produto.ctasInscricao;
}
