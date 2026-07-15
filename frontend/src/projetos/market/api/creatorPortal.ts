import { requisitarApi } from "../../../api";

export interface CreatorPortalDados {
  conta: { id: string; nome: string | null };
  parceiros: Array<{ id: string; negocioId: string; tipo: string; codigo: string; nomePublico: string; estado: string }>;
  metricas: {
    cliquesValidos: number;
    visualizacoes: number;
    checkouts: number;
    pedidos: number;
    receitaAtribuidaEmKwanza: number;
    comissaoEstimadaEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoRetidaEmKwanza: number;
    saldoDisponivelEmKwanza: number;
    comissaoPagaEmKwanza: number;
    comissaoRevertidaEmKwanza: number;
    disputas: number;
  };
  links: Array<{
    id: string; afiliadoId: string; codigo: string; destinoTipo: string; destinoId: string | null;
    slugLoja: string | null; codigoProduto: string | null; ativo: boolean; criadoEm: string;
  }>;
  comissoes: Array<{
    id: string; pedidoId: string; status: string; baseEmKwanza: number; valorEmKwanza: number;
    moeda: string; criadoEm: string;
  }>;
  pagamentos: Array<{ id: string; referencia: string; status: string; valorEmKwanza: number; moeda: string; criadoEm: string }>;
}

export function obterCreatorPortal(): Promise<CreatorPortalDados> {
  return requisitarApi("/creator/portal", {}, false);
}

export function criarSmartLinkCreator(dados: {
  parceiroId: string;
  destinoTipo: "LOJA" | "PRODUTO" | "CAMPANHA" | "CONTEUDO" | "CARRINHO" | "MINI_LOJA" | "LEARNING";
  destinoId?: string | null;
  slugLoja?: string | null;
  codigoProduto?: string | null;
}): Promise<CreatorPortalDados["links"][number]> {
  return requisitarApi("/creator/links", { method: "POST", body: dados }, false);
}
