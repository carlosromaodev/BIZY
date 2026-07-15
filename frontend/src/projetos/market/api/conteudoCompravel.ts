import { requisitarApi } from "../../../api";

export interface ConteudoCommerceDados {
  id: string; parceiroId: string; slug: string; tipo: string; titulo: string; legenda: string | null;
  thumbnailUrl: string | null; mediaUrl: string | null; divulgacaoComercial: boolean; estado: string;
  motivoModeracao: string | null; criadoEm: string; produtos: Array<{ id: string; negocioId: string; pecaId: string }>;
}
export interface ConteudoCompravelPublico {
  conteudo: ConteudoCommerceDados & { parceiro: { nomePublico: string; tipo: string }; smartLink: { codigo: string; url: string } | null };
  produtos: Array<{ id: string; codigo: string; nome: string; descricao: string; precoEmKwanza: number; fotoUrl: string | null; loja: { slug: string; nome: string }; url: string }>;
  divulgacao: string | null;
}
export function listarConteudosCreator(): Promise<{ conteudos: ConteudoCommerceDados[] }> { return requisitarApi("/creator/conteudos/dados", {}, false); }
export function criarConteudoCreator(dados: Record<string, unknown>): Promise<ConteudoCommerceDados> { return requisitarApi("/creator/conteudos/criar", { method: "POST", body: dados }, false); }
export function obterConteudoCompravel(slug: string): Promise<ConteudoCompravelPublico> { return requisitarApi(`/publico/conteudos/${encodeURIComponent(slug)}`, {}, false); }
