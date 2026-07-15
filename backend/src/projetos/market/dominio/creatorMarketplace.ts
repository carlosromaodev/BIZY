export type EstadoOfertaCreator = "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
export type EstadoCandidaturaCreator = "PENDENTE" | "APROVADA" | "REJEITADA" | "CANCELADA";
export type EstadoAmostraCreator = "SOLICITADA" | "APROVADA" | "RECUSADA" | "ENVIADA" | "RECEBIDA";

export interface ProdutoOfertaCreator { id: string; ofertaId: string; negocioId: string; pecaId: string; variantePecaId: string | null; ordem: number }
export interface MissaoCreator { id: string; ofertaId: string; negocioId: string; titulo: string; descricao: string; criterios: Record<string, unknown>; bonusEmKwanza: number; iniciaEm: Date | null; terminaEm: Date | null; estado: string; criadaEm: Date; atualizadaEm: Date }
export interface OfertaCreator {
  id: string; negocioId: string; codigo: string; titulo: string; descricao: string; estado: EstadoOfertaCreator;
  comissaoTipo: "PERCENTUAL" | "FIXA"; comissaoValor: number; moeda: string; criterios: Record<string, unknown>;
  regras: Record<string, unknown>; bonus: Record<string, unknown>; stockAmostras: number; iniciaEm: Date | null;
  terminaEm: Date | null; publicadaEm: Date | null; criadoEm: Date; atualizadoEm: Date;
  produtos: ProdutoOfertaCreator[]; missoes: MissaoCreator[];
}
export interface CandidaturaCreator {
  id: string; ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; estado: EstadoCandidaturaCreator;
  mensagem: string | null; motivoDecisao: string | null; decididaEm: Date | null; criadoEm: Date; atualizadoEm: Date;
}
export interface AmostraCreator { id: string; candidaturaId: string; negocioId: string; parceiroId: string; estado: EstadoAmostraCreator; observacao: string | null; trackingEnvio: string | null; criadaEm: Date; atualizadaEm: Date }
export interface ParticipacaoMissaoCreator { id: string; missaoId: string; candidaturaId: string; parceiroId: string; estado: string; progresso: Record<string, unknown>; aceiteEm: Date; concluidaEm: Date | null }

export interface RepositorioCreatorMarketplace {
  criarOferta(dados: Omit<OfertaCreator, "id" | "publicadaEm" | "criadoEm" | "atualizadoEm" | "produtos" | "missoes"> & { produtos: Array<Omit<ProdutoOfertaCreator, "id" | "ofertaId">>; missoes: Array<Omit<MissaoCreator, "id" | "ofertaId" | "negocioId" | "criadaEm" | "atualizadaEm">> }): Promise<OfertaCreator>;
  buscarOferta(id: string, negocioId?: string): Promise<OfertaCreator | null>;
  listarOfertasNegocio(negocioId: string): Promise<OfertaCreator[]>;
  listarOfertasPublicadas(agora: Date): Promise<OfertaCreator[]>;
  publicarOferta(id: string, negocioId: string, publicar: boolean, agora: Date): Promise<OfertaCreator | null>;
  criarCandidatura(dados: { ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; mensagem?: string | null }): Promise<CandidaturaCreator>;
  buscarCandidatura(id: string, contexto: { negocioId?: string; parceiroIds?: string[] }): Promise<CandidaturaCreator | null>;
  listarCandidaturas(filtros: { negocioId?: string; parceiroIds?: string[] }): Promise<CandidaturaCreator[]>;
  decidirCandidatura(id: string, negocioId: string, dados: { estado: "APROVADA" | "REJEITADA"; motivo?: string | null; agora: Date }): Promise<CandidaturaCreator | null>;
  solicitarAmostra(candidatura: CandidaturaCreator, observacao?: string | null): Promise<AmostraCreator>;
  listarAmostras(filtros: { negocioId?: string; parceiroIds?: string[] }): Promise<AmostraCreator[]>;
  aceitarMissao(dados: { missaoId: string; candidaturaId: string; parceiroId: string }): Promise<ParticipacaoMissaoCreator>;
  listarParticipacoes(parceiroIds: string[]): Promise<ParticipacaoMissaoCreator[]>;
}
