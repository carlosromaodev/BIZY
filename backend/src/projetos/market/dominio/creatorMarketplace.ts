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
export interface PerfilCreator {
  id: string; contaBizyId: string; nomePublico: string; bio: string | null; avatarUrl: string | null; localizacao: string | null;
  categorias: string[]; canais: string[]; redesSociais: Record<string, string>; estado: string; nivelVerificacao: string;
  termosVersao: string | null; termosAceitesEm: Date | null; criadoEm: Date; atualizadoEm: Date;
}
export interface ProgramaAfiliacao { id: string; negocioId: string; nome: string; modalidadeAcesso: string; estado: string; termosVersao: string; criterios: Record<string, unknown>; politicaComissao: Record<string, unknown>; politicaConteudo: Record<string, unknown> }
export interface SolicitacaoAfiliacao { id: string; perfilCreatorId: string; programaId: string; ofertaId: string | null; produtoOfertaId: string | null; estado: string; mensagem: string | null; motivoDecisao: string | null; submetidaEm: Date; decididaEm: Date | null; criadoEm: Date; atualizadoEm: Date }
export interface RelacaoAfiliacao { id: string; perfilCreatorId: string; negocioId: string; programaId: string; parceiroComercialId: string | null; estado: string; comissao: Record<string, unknown>; termosVersao: string; iniciadaEm: Date }

export interface RepositorioCreatorMarketplace {
  obterPerfilPorConta(contaBizyId: string): Promise<PerfilCreator | null>;
  obterPerfilPorId(id: string): Promise<PerfilCreator | null>;
  salvarPerfil(contaBizyId: string, dados: { nomePublico: string; bio?: string | null; avatarUrl?: string | null; localizacao?: string | null; categorias: string[]; canais: string[]; redesSociais?: Record<string, string>; estado: string; termosVersao: string; termosAceitesEm: Date }): Promise<PerfilCreator>;
  garantirPrograma(dados: { negocioId: string; nome: string; modalidadeAcesso: string; termosVersao: string; criterios: Record<string, unknown>; politicaComissao: Record<string, unknown>; politicaConteudo: Record<string, unknown> }): Promise<ProgramaAfiliacao>;
  criarSolicitacao(dados: { perfilCreatorId: string; programaId: string; ofertaId?: string | null; produtoOfertaId?: string | null; estado: string; mensagem?: string | null; agora: Date }): Promise<SolicitacaoAfiliacao>;
  buscarSolicitacao(id: string, contexto: { perfilCreatorId?: string; negocioId?: string }): Promise<SolicitacaoAfiliacao | null>;
  listarSolicitacoes(filtros: { perfilCreatorId?: string; negocioId?: string }): Promise<SolicitacaoAfiliacao[]>;
  decidirSolicitacao(id: string, negocioId: string, dados: { estado: "APROVADA" | "REJEITADA"; motivo?: string | null; decididaPorId?: string | null; agora: Date }): Promise<SolicitacaoAfiliacao | null>;
  ativarRelacao(dados: { perfilCreatorId: string; negocioId: string; programaId: string; parceiroComercialId: string; comissao: Record<string, unknown>; termosVersao: string; produtoOfertaIds: string[]; agora: Date }): Promise<RelacaoAfiliacao>;
  listarRelacoes(perfilCreatorId: string): Promise<RelacaoAfiliacao[]>;
  produtoAutorizado(parceiroComercialId: string, pecaId: string): Promise<boolean>;
  criarOferta(dados: Omit<OfertaCreator, "id" | "publicadaEm" | "criadoEm" | "atualizadoEm" | "produtos" | "missoes"> & { produtos: Array<Omit<ProdutoOfertaCreator, "id" | "ofertaId">>; missoes: Array<Omit<MissaoCreator, "id" | "ofertaId" | "negocioId" | "criadaEm" | "atualizadaEm">> }): Promise<OfertaCreator>;
  buscarOferta(id: string, negocioId?: string): Promise<OfertaCreator | null>;
  listarOfertasNegocio(negocioId: string): Promise<OfertaCreator[]>;
  listarOfertasPublicadas(agora: Date): Promise<OfertaCreator[]>;
  publicarOferta(id: string, negocioId: string, publicar: boolean, agora: Date): Promise<OfertaCreator | null>;
  criarCandidatura(dados: { id?: string; ofertaId: string; negocioId: string; parceiroId: string; parceiroNegocioOrigemId: string; mensagem?: string | null; estado?: EstadoCandidaturaCreator }): Promise<CandidaturaCreator>;
  buscarCandidatura(id: string, contexto: { negocioId?: string; parceiroIds?: string[] }): Promise<CandidaturaCreator | null>;
  listarCandidaturas(filtros: { negocioId?: string; parceiroIds?: string[] }): Promise<CandidaturaCreator[]>;
  decidirCandidatura(id: string, negocioId: string, dados: { estado: "APROVADA" | "REJEITADA"; motivo?: string | null; agora: Date }): Promise<CandidaturaCreator | null>;
  solicitarAmostra(candidatura: CandidaturaCreator, observacao?: string | null): Promise<AmostraCreator>;
  listarAmostras(filtros: { negocioId?: string; parceiroIds?: string[] }): Promise<AmostraCreator[]>;
  aceitarMissao(dados: { missaoId: string; candidaturaId: string; parceiroId: string }): Promise<ParticipacaoMissaoCreator>;
  listarParticipacoes(parceiroIds: string[]): Promise<ParticipacaoMissaoCreator[]>;
}
