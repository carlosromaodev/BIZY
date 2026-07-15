import type { ToqueAtribuicaoCommerce } from "./smartLinksCommerce.js";

export type ModeloAtribuicaoCommerce =
  | "PRIMEIRO_TOQUE"
  | "ULTIMO_TOQUE"
  | "CONVERSAO_ASSISTIDA"
  | "AJUSTE_MANUAL";

export interface PoliticaAtribuicaoCommerce {
  id: string;
  negocioId: string;
  codigo: string;
  versao: string;
  modelo: ModeloAtribuicaoCommerce;
  janelaDias: number;
  pesoPrincipalBasisPoints: number;
  regras: Record<string, unknown>;
  ativaDesde: Date;
  desativadaEm: Date | null;
  criadaEm: Date;
}

export interface ParticipanteConversaoCommerce {
  id: string;
  conversaoId: string;
  toqueId: string | null;
  parceiroId: string | null;
  linkId: string | null;
  papel: "PRINCIPAL" | `ASSISTENCIA_${number}`;
  pesoBasisPoints: number;
  valorAtribuidoEmKwanza: number;
  motivo: string;
  criadoEm: Date;
}

export interface ConversaoAtribuicaoCommerce {
  id: string;
  negocioId: string;
  sessaoId: string | null;
  contaBizyId: string | null;
  compraUnificadaId: string;
  pedidoId: string;
  tipo: "ORDER_CREATED";
  politicaId: string;
  politicaCodigo: string;
  politicaVersao: string;
  modelo: ModeloAtribuicaoCommerce;
  janelaDias: number;
  valorBaseEmKwanza: number;
  moeda: string;
  explicacao: Record<string, unknown>;
  criadaEm: Date;
  participantes: ParticipanteConversaoCommerce[];
}

export interface NovaPoliticaAtribuicaoCommerce {
  negocioId: string;
  codigo: string;
  versao: string;
  modelo: ModeloAtribuicaoCommerce;
  janelaDias: number;
  pesoPrincipalBasisPoints: number;
  regras: Record<string, unknown>;
}

export interface NovoParticipanteConversaoCommerce {
  toqueId: string;
  parceiroId: string;
  linkId: string;
  papel: ParticipanteConversaoCommerce["papel"];
  pesoBasisPoints: number;
  valorAtribuidoEmKwanza: number;
  motivo: string;
}

export interface NovaConversaoAtribuicaoCommerce {
  negocioId: string;
  sessaoId: string | null;
  contaBizyId: string | null;
  compraUnificadaId: string;
  pedidoId: string;
  tipo: "ORDER_CREATED";
  politica: PoliticaAtribuicaoCommerce;
  valorBaseEmKwanza: number;
  moeda: string;
  explicacao: Record<string, unknown>;
  participantes: NovoParticipanteConversaoCommerce[];
}

export interface RepositorioAtribuicaoCommerce {
  obterOuCriarPolitica(dados: NovaPoliticaAtribuicaoCommerce): Promise<PoliticaAtribuicaoCommerce>;
  buscarConversao(negocioId: string, pedidoId: string, tipo: "ORDER_CREATED"): Promise<ConversaoAtribuicaoCommerce | null>;
  criarConversao(dados: NovaConversaoAtribuicaoCommerce): Promise<ConversaoAtribuicaoCommerce>;
  listarConversoesCompra(compraUnificadaId: string): Promise<ConversaoAtribuicaoCommerce[]>;
}

export interface ToqueAtribuivel extends ToqueAtribuicaoCommerce {
  sessaoContaBizyId: string | null;
}
