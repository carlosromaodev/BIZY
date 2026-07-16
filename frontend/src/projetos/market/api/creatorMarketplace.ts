import { requisitarApi } from "../../../api";

export interface OfertaCreatorDados {
  id: string; negocioId: string; codigo: string; titulo: string; descricao: string; estado: string;
  comissaoTipo: "PERCENTUAL" | "FIXA"; comissaoValor: number; moeda: string; stockAmostras: number;
  iniciaEm: string | null; terminaEm: string | null; loja: { id: string; nome: string; slug: string | null };
  produtos: Array<{ id: string; codigo: string; nome: string; precoEmKwanza: number; fotoUrl: string | null }>;
  missoes: Array<{ id: string; titulo: string; descricao: string; bonusEmKwanza: number; estado: string; terminaEm: string | null }>;
}
export interface CreatorMarketplaceDados {
  perfilCreator: PerfilCreatorDados | null;
  parceiros: Array<{ id: string; nomePublico: string; tipo: string; estado: string }>;
  ofertas: OfertaCreatorDados[];
  candidaturas: Array<{ id: string; ofertaId: string; parceiroId: string; estado: string; mensagem: string | null }>;
  solicitacoes: Array<{ id: string; ofertaId: string | null; estado: string; mensagem: string | null; motivoDecisao: string | null; criadoEm: string }>;
  relacoes: Array<{ id: string; negocioId: string; estado: string; iniciadaEm: string }>;
  amostras: Array<{ id: string; candidaturaId: string; estado: string; observacao: string | null }>;
  participacoes: Array<{ id: string; missaoId: string; candidaturaId: string; estado: string }>;
}

export interface PerfilCreatorDados {
  id: string; nomePublico: string; bio: string | null; avatarUrl: string | null; localizacao: string | null;
  categorias: string[]; canais: string[]; redesSociais: Record<string, string>; estado: string; nivelVerificacao: string;
}

export interface DadosPerfilCreator {
  nomePublico: string; bio?: string | null; avatarUrl?: string | null; localizacao?: string | null;
  categorias: string[]; canais: Array<"WHATSAPP" | "INSTAGRAM" | "TIKTOK" | "FACEBOOK" | "YOUTUBE" | "SITE" | "COMUNIDADE" | "VENDA_PRESENCIAL">;
  redesSociais?: Record<string, string>; aceitarTermos: boolean;
}

export function obterCreatorMarketplace(): Promise<CreatorMarketplaceDados> { return requisitarApi("/creator/oportunidades/dados", {}, false); }
export function candidatarOfertaCreator(ofertaId: string, mensagem?: string): Promise<unknown> { return requisitarApi(`/creator/oportunidades/${ofertaId}/candidaturas`, { method: "POST", body: { mensagem } }, false); }
export function obterPerfilCreator(): Promise<{ perfil: PerfilCreatorDados }> { return requisitarApi("/creator/perfil", {}, false); }
export function salvarPerfilCreator(dados: DadosPerfilCreator): Promise<{ perfil: PerfilCreatorDados }> { return requisitarApi("/creator/perfil", { method: "POST", body: dados }, false); }
export function solicitarAmostraCreator(candidaturaId: string): Promise<unknown> { return requisitarApi(`/creator/candidaturas/${candidaturaId}/amostras`, { method: "POST", body: {} }, false); }
export function aceitarMissaoCreator(missaoId: string): Promise<unknown> { return requisitarApi(`/creator/missoes/${missaoId}/aceitar`, { method: "POST", body: {} }, false); }
