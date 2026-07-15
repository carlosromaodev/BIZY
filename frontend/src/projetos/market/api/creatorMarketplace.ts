import { requisitarApi } from "../../../api";

export interface OfertaCreatorDados {
  id: string; negocioId: string; codigo: string; titulo: string; descricao: string; estado: string;
  comissaoTipo: "PERCENTUAL" | "FIXA"; comissaoValor: number; moeda: string; stockAmostras: number;
  iniciaEm: string | null; terminaEm: string | null; loja: { id: string; nome: string; slug: string | null };
  produtos: Array<{ id: string; codigo: string; nome: string; precoEmKwanza: number; fotoUrl: string | null }>;
  missoes: Array<{ id: string; titulo: string; descricao: string; bonusEmKwanza: number; estado: string; terminaEm: string | null }>;
}
export interface CreatorMarketplaceDados {
  parceiros: Array<{ id: string; nomePublico: string; tipo: string; estado: string }>;
  ofertas: OfertaCreatorDados[];
  candidaturas: Array<{ id: string; ofertaId: string; parceiroId: string; estado: string; mensagem: string | null }>;
  amostras: Array<{ id: string; candidaturaId: string; estado: string; observacao: string | null }>;
  participacoes: Array<{ id: string; missaoId: string; candidaturaId: string; estado: string }>;
}

export function obterCreatorMarketplace(): Promise<CreatorMarketplaceDados> { return requisitarApi("/creator/oportunidades/dados", {}, false); }
export function candidatarOfertaCreator(ofertaId: string, parceiroId: string): Promise<unknown> { return requisitarApi(`/creator/oportunidades/${ofertaId}/candidaturas`, { method: "POST", body: { parceiroId } }, false); }
export function solicitarAmostraCreator(candidaturaId: string): Promise<unknown> { return requisitarApi(`/creator/candidaturas/${candidaturaId}/amostras`, { method: "POST", body: {} }, false); }
export function aceitarMissaoCreator(missaoId: string): Promise<unknown> { return requisitarApi(`/creator/missoes/${missaoId}/aceitar`, { method: "POST", body: {} }, false); }
