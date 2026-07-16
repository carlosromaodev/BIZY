import { requisitarApi } from "../../../api";
import { obterAcessoCompraMarket, obterIdentificadorDispositivoBizy } from "./checkoutUnificado";
import type { RespostaCompraEstados } from "./tiposLojas";

export interface ContaBizyPublica {
  id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  status: string;
}

export type TipoContextoContaBizy = "COMPRADOR" | "CRIADOR" | "AFILIADO" | "SELLER" | "MEMBRO_NEGOCIO" | "PRODUTOR_LEARNING";

export interface ContextoContaBizyPublico {
  id: string;
  tipo: TipoContextoContaBizy;
  negocioId: string | null;
  estado: string;
}

export interface PerfilCompradorBizy {
  id: string;
  nomeExibicao: string | null;
  preferencias: Record<string, unknown>;
  consentimentoDados: boolean;
  consentimentoMarketing: boolean;
}

export interface EnderecoCompradorBizy {
  id: string;
  rotulo: string;
  provincia: string | null;
  municipio: string | null;
  bairro: string | null;
  endereco: string;
  referencia: string | null;
  principal: boolean;
}

export interface SessaoContaBizyPublica {
  id: string;
  userAgent: string | null;
  expiraEm: string;
  ultimoUsoEm: string | null;
  criadaEm: string;
}

export interface ResumoContaBizy {
  conta: ContaBizyPublica;
  perfil: PerfilCompradorBizy | null;
  contextos: ContextoContaBizyPublico[];
  indicadores: { compras: number; comprasEmCurso: number; favoritos: number; enderecos: number; sessoesAtivas: number };
  navegacao: { conta: boolean; creator: boolean; team: boolean; learning: boolean };
}

export interface CasoProtecaoCompradorBizy {
  id: string;
  compraId: string;
  pedidoId: string | null;
  tipo: string;
  descricao: string;
  estado: string;
  resolucao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export function solicitarOtpContaBizy(dados: {
  telefone?: string;
  finalidade?: "LOGIN" | "ASSOCIAR_COMPRA";
  compraId?: string;
}): Promise<{ sucesso: boolean; expiraEm: string; minutosExpiracao: number; codigoDev?: string }> {
  const tokenCompra = dados.compraId ? obterAcessoCompraMarket(dados.compraId) : "";
  return requisitarApi("/conta/otp/solicitar", {
    method: "POST",
    body: dados,
    headers: {
      "X-Bizy-Device-Id": obterIdentificadorDispositivoBizy(),
      ...(tokenCompra ? { "X-Bizy-Compra-Token": tokenCompra } : {})
    }
  }, false);
}

export function confirmarOtpContaBizy(dados: {
  telefone?: string;
  codigo: string;
  nome?: string;
  email?: string;
  finalidade?: "LOGIN" | "ASSOCIAR_COMPRA";
  compraId?: string;
  consentimentoDados?: boolean;
  consentimentoMarketing?: boolean;
}): Promise<{ conta: ContaBizyPublica; sessaoId: string; expiraEm: string }> {
  const tokenCompra = dados.compraId ? obterAcessoCompraMarket(dados.compraId) : "";
  return requisitarApi("/conta/otp/confirmar", {
    method: "POST",
    body: dados,
    headers: {
      "X-Bizy-Device-Id": obterIdentificadorDispositivoBizy(),
      ...(tokenCompra ? { "X-Bizy-Compra-Token": tokenCompra } : {})
    }
  }, false);
}

export function obterSessaoContaBizy(): Promise<{ conta: ContaBizyPublica }> {
  return requisitarApi("/conta/sessao", {}, false);
}

export function obterEstadoContaBizy(): Promise<{ autenticada: boolean; conta: { id: string; nome: string | null } | null }> {
  return requisitarApi("/conta/estado", {}, false);
}

export function obterResumoContaBizy(): Promise<ResumoContaBizy> {
  return requisitarApi("/conta/resumo", {}, false);
}

export function obterPerfilCompradorBizy(): Promise<{ perfil: PerfilCompradorBizy; enderecos: EnderecoCompradorBizy[]; favoritos: FavoritoContaBizy[] }> {
  return requisitarApi("/conta/comprador/perfil", {}, false);
}

export function atualizarPerfilCompradorBizy(dados: Partial<Pick<PerfilCompradorBizy, "nomeExibicao" | "preferencias" | "consentimentoDados" | "consentimentoMarketing">>): Promise<PerfilCompradorBizy> {
  return requisitarApi("/conta/comprador/perfil", { method: "PATCH", body: dados }, false);
}

export function listarEnderecosCompradorBizy(): Promise<{ enderecos: EnderecoCompradorBizy[] }> {
  return requisitarApi("/conta/comprador/enderecos", {}, false);
}

export function salvarEnderecoCompradorBizy(dados: Omit<EnderecoCompradorBizy, "id"> & { id?: string }): Promise<EnderecoCompradorBizy> {
  const { id, ...corpo } = dados;
  return requisitarApi(id ? `/conta/comprador/enderecos/${id}` : "/conta/comprador/enderecos", { method: id ? "PATCH" : "POST", body: corpo }, false);
}

export function removerEnderecoCompradorBizy(id: string): Promise<{ sucesso: boolean }> {
  return requisitarApi(`/conta/comprador/enderecos/${id}`, { method: "DELETE" }, false);
}

export function listarSessoesContaBizy(): Promise<{ sessoes: SessaoContaBizyPublica[] }> {
  return requisitarApi("/conta/sessoes", {}, false);
}

export function revogarSessaoContaBizy(id: string): Promise<{ sucesso: boolean }> {
  return requisitarApi(`/conta/sessoes/${id}`, { method: "DELETE" }, false);
}

export function listarCasosProtecaoComprador(): Promise<{ casos: CasoProtecaoCompradorBizy[] }> {
  return requisitarApi("/conta/protecao", {}, false);
}

export function encerrarSessaoContaBizy(): Promise<{ sucesso: boolean }> {
  return requisitarApi("/conta/sessao", { method: "DELETE" }, false);
}

export function obterComprasContaBizy(): Promise<{ compras: RespostaCompraEstados[]; total: number }> {
  return requisitarApi("/conta/comprador/compras", {}, false);
}

export interface FavoritoContaBizy {
  id: string;
  slugLoja: string;
  codigoProduto: string;
  criadoEm: string;
}

export function listarFavoritosContaBizy(): Promise<{ favoritos: FavoritoContaBizy[] }> {
  return requisitarApi("/conta/comprador/favoritos", {}, false);
}

export function adicionarFavoritoContaBizy(slugLoja: string, codigoProduto: string): Promise<FavoritoContaBizy> {
  return requisitarApi("/conta/comprador/favoritos", { method: "POST", body: { slugLoja, codigoProduto } }, false);
}

export function removerFavoritoContaBizy(slugLoja: string, codigoProduto: string): Promise<{ sucesso: boolean }> {
  return requisitarApi(`/conta/comprador/favoritos/${encodeURIComponent(slugLoja)}/${encodeURIComponent(codigoProduto)}`, { method: "DELETE" }, false);
}
