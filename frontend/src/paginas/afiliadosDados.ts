export interface ParceiroComercial {
  id: string;
  tipo: string;
  codigo: string;
  nomePublico: string;
  contacto: string | null;
  estado: string;
  regraComissao: {
    tipo: "PERCENTUAL" | "VALOR_FIXO" | string;
    percentual?: number;
    valorEmKwanza?: number;
  };
  criadoEm: string;
}

export interface LinkAfiliado {
  id: string;
  afiliadoId: string;
  codigo: string;
  urlPublica: string;
  destinoTipo: string;
  slugLoja: string | null;
  codigoProduto: string | null;
  canal: string | null;
  origemConteudo: string | null;
  ativo: boolean;
  expiraEm: string | null;
  criadoEm: string;
}

export interface RespostaParceirosAfiliados {
  parceiros: ParceiroComercial[];
}

export interface RespostaLinksAfiliados {
  links: LinkAfiliado[];
}

function extrairColecao<T>(resposta: unknown, chaveEnvelope: string): T[] {
  if (Array.isArray(resposta)) return resposta as T[];
  if (!resposta || typeof resposta !== "object") return [];

  const valor = (resposta as Record<string, unknown>)[chaveEnvelope];
  return Array.isArray(valor) ? (valor as T[]) : [];
}

export function normalizarParceirosAfiliados(resposta: unknown): ParceiroComercial[] {
  return extrairColecao<ParceiroComercial>(resposta, "parceiros");
}

export function normalizarLinksAfiliados(resposta: unknown): LinkAfiliado[] {
  return extrairColecao<LinkAfiliado>(resposta, "links");
}
