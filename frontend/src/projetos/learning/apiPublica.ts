import { requisitarApi } from "../../api";
import type { LicaoLearning, ModeloOfertaLearning, ProgramaLearning, TipoAcessoLearning } from "./api";

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

export interface ProdutoLearningPublico {
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

export function obterProdutoLearning(slug: string): Promise<{ programa: ProgramaLearning; produto: ProdutoLearningPublico }> {
  return requisitarApi<{ programa: ProgramaLearning; produto: ProdutoLearningPublico }>(
    `/publico/learning/produtos/${encodeURIComponent(slug)}`,
    {},
    false
  );
}

export function registrarEventoPublicoLearning(
  dados: RegistrarEventoPublicoLearningInput
): Promise<{ evento: EventoPublicoLearning; duplicado: boolean }> {
  return requisitarApi<{ evento: EventoPublicoLearning; duplicado: boolean }>(
    "/publico/learning/eventos",
    {
      method: "POST",
      body: dados
    },
    false
  );
}
