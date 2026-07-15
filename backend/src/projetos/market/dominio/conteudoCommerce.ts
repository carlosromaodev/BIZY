export const tiposConteudoCommerce = ["VIDEO", "REEL", "STORY", "PUBLICACAO", "LIVE", "REVIEW", "TUTORIAL", "COLECAO", "CARRINHO", "UNBOXING"] as const;
export type TipoConteudoCommerce = typeof tiposConteudoCommerce[number];
export type EstadoConteudoCommerce = "RASCUNHO" | "EM_REVISAO" | "PUBLICADO" | "REJEITADO" | "ARQUIVADO";

export interface ProdutoConteudoCommerce {
  id: string; conteudoId: string; negocioId: string; pecaId: string; variantePecaId: string | null; ordem: number;
}

export interface ConteudoCommerce {
  id: string; negocioId: string; parceiroId: string; smartLinkId: string | null; slug: string;
  tipo: TipoConteudoCommerce; titulo: string; legenda: string | null; thumbnailUrl: string | null; mediaUrl: string | null;
  divulgacaoComercial: boolean; estado: EstadoConteudoCommerce; motivoModeracao: string | null;
  metricas: Record<string, number>; publicadoEm: Date | null; aprovadoEm: Date | null; criadoEm: Date; atualizadoEm: Date;
  produtos: ProdutoConteudoCommerce[];
}

export interface RepositorioConteudosCommerce {
  criar(dados: Omit<ConteudoCommerce, "id" | "metricas" | "publicadoEm" | "aprovadoEm" | "criadoEm" | "atualizadoEm" | "produtos"> & { produtos: Array<Omit<ProdutoConteudoCommerce, "id" | "conteudoId">> }): Promise<ConteudoCommerce>;
  buscarPorSlug(slug: string): Promise<ConteudoCommerce | null>;
  buscarPorIdContexto(id: string, contexto: { parceiroIds?: string[]; negocioId?: string }): Promise<ConteudoCommerce | null>;
  listarPorParceiros(parceiroIds: string[]): Promise<ConteudoCommerce[]>;
  moderar(id: string, negocioId: string, dados: { estado: "PUBLICADO" | "REJEITADO"; motivo?: string | null; smartLinkId?: string | null }): Promise<ConteudoCommerce | null>;
}
