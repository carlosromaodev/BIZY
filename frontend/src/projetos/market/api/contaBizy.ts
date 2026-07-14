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
