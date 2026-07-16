import type { EntregaCheckoutPublico, ProdutoMarketNormalizado } from "./tiposLojas";
import { requisitarApi } from "../../../api";

export const CHAVE_CARRINHO_BIZY = "bizy_checkout_unificado_v1";
export const CHAVE_IDEMPOTENCIA_CHECKOUT_BIZY = "bizy_checkout_idempotencia_v1";
export const EVENTO_CARRINHO_BIZY = "bizy:carrinho-alterado";
const CHAVE_ACESSOS_COMPRA_BIZY = "bizy_market_acessos_compra_v1";
const CHAVE_DISPOSITIVO_BIZY = "bizy_device_id_v1";
const CHAVE_TOKEN_CARRINHO_BIZY = "bizy_market_carrinho_token_v1";

export function guardarAcessoCompraMarket(compraId: string, token: string): void {
  const storage = ambienteComStorage();
  if (!storage || !compraId || !token) return;
  const acessos = lerAcessosCompra(storage);
  acessos[compraId] = token;
  storage.setItem(CHAVE_ACESSOS_COMPRA_BIZY, JSON.stringify(acessos));
}

export function obterAcessoCompraMarket(compraId: string): string {
  const storage = ambienteComStorage();
  return storage ? lerAcessosCompra(storage)[compraId] ?? "" : "";
}

export function obterIdentificadorDispositivoBizy(): string {
  const storage = ambienteComStorage();
  if (!storage) return "browser";
  const existente = storage.getItem(CHAVE_DISPOSITIVO_BIZY);
  if (existente) return existente;
  const identificador = globalThis.crypto?.randomUUID?.() ?? `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(CHAVE_DISPOSITIVO_BIZY, identificador);
  return identificador;
}

export interface ItemCarrinhoCheckoutBizy {
  id: string;
  slugLoja: string;
  codigoProduto: string;
  nomeProduto: string;
  nomeFornecedor: string;
  quantidade: number;
  precoUnitarioEmKwanza: number;
  fotoUrl?: string | null;
  urlProduto?: string | null;
  urlLoja?: string | null;
  variantes?: Record<string, string>;
  origem?: string;
  adicionadoEm: string;
}

export interface GrupoCheckoutBizy {
  slugLoja: string;
  nomeFornecedor: string;
  itens: ItemCarrinhoCheckoutBizy[];
  subtotalEmKwanza: number;
  urlLoja?: string | null;
}

export interface TotaisCheckoutBizy {
  quantidadeItens: number;
  subtotalEmKwanza: number;
  totalLojas: number;
}

export interface CotacaoCheckoutBizy {
  lojas: Array<{ negocioId: string; nomeLoja: string; subtotalEmKwanza: number; taxaEntregaEmKwanza: number; ivaEmKwanza: number; totalEmKwanza: number; prazoMinimoDias: number | null; prazoMaximoDias: number | null; metodosPagamento: string[] }>;
  metodosPagamento: string[];
  subtotalEmKwanza: number;
  taxaEntregaTotalEmKwanza: number;
  ivaTotalEmKwanza: number;
  totalEmKwanza: number;
}

type ItemEntradaCheckoutBizy = Omit<ItemCarrinhoCheckoutBizy, "adicionadoEm" | "id"> & { id?: string };

export interface CarrinhoServidorBizy {
  id: string;
  estado: string;
  expiraEm: string;
  itens: ItemCarrinhoCheckoutBizy[];
  subtotalEmKwanza: number;
  quantidadeItens: number;
}

interface ChaveIdempotenciaCheckoutBizy {
  assinatura: string;
  chave: string;
  criadoEm: string;
}

function ambienteComStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function notificarCarrinhoBizy(itens: ItemCarrinhoCheckoutBizy[]): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_CARRINHO_BIZY, {
    detail: {
      itens: itens.length,
      quantidade: itens.reduce((total, item) => total + item.quantidade, 0)
    }
  }));
}

function lerAcessosCompra(storage: Storage): Record<string, string> {
  try {
    const valor = JSON.parse(storage.getItem(CHAVE_ACESSOS_COMPRA_BIZY) ?? "{}");
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, string> : {};
  } catch {
    return {};
  }
}

function chaveItemCheckout(item: Pick<ItemCarrinhoCheckoutBizy, "codigoProduto" | "slugLoja" | "variantes">): string {
  const variantes = Object.entries(item.variantes ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nome, valor]) => `${nome}:${valor}`)
    .join("|");
  return `${item.slugLoja}:${item.codigoProduto}:${variantes}`;
}

function normalizarQuantidade(quantidade: number): number {
  if (!Number.isFinite(quantidade)) return 1;
  return Math.max(1, Math.min(99, Math.round(quantidade)));
}

function serializarVariantes(variantes?: Record<string, string>): string {
  return Object.entries(variantes ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nome, valor]) => `${nome}:${valor}`)
    .join("|");
}

function assinarCheckoutBizy(itens: ItemCarrinhoCheckoutBizy[], compradorTelefone: string, escopo = ""): string {
  const itensAssinados = itens
    .map((item) => [
      item.slugLoja.trim(),
      item.codigoProduto.trim(),
      normalizarQuantidade(item.quantidade),
      serializarVariantes(item.variantes)
    ].join(":"))
    .sort()
    .join(";");
  return [compradorTelefone.trim(), itensAssinados, escopo.trim()].join("::");
}

function gerarChaveIdempotenciaCheckoutBizy(): string {
  return `checkout-bizy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizarItemCheckoutBizy(item: ItemEntradaCheckoutBizy): ItemCarrinhoCheckoutBizy {
  const normalizado = {
    ...item,
    quantidade: normalizarQuantidade(item.quantidade),
    precoUnitarioEmKwanza: Math.max(0, Math.round(item.precoUnitarioEmKwanza || 0)),
    slugLoja: item.slugLoja.trim(),
    codigoProduto: item.codigoProduto.trim(),
    nomeProduto: item.nomeProduto.trim() || item.codigoProduto.trim(),
    nomeFornecedor: item.nomeFornecedor.trim() || "Loja Bizy",
    variantes: item.variantes ?? {},
    adicionadoEm: new Date().toISOString()
  };

  return {
    ...normalizado,
    id: item.id || chaveItemCheckout(normalizado)
  };
}

export function carregarCarrinhoCheckoutBizy(): ItemCarrinhoCheckoutBizy[] {
  const storage = ambienteComStorage();
  if (!storage) return [];

  try {
    const bruto = storage.getItem(CHAVE_CARRINHO_BIZY);
    if (!bruto) return [];
    const itens = JSON.parse(bruto);
    if (!Array.isArray(itens)) return [];

    return itens
      .map((item) => normalizarItemCheckoutBizy(item as ItemEntradaCheckoutBizy))
      .filter((item) => item.slugLoja && item.codigoProduto);
  } catch {
    return [];
  }
}

export function guardarCarrinhoCheckoutBizy(itens: ItemCarrinhoCheckoutBizy[]): void {
  const storage = ambienteComStorage();
  if (!storage) return;
  storage.setItem(CHAVE_CARRINHO_BIZY, JSON.stringify(itens));
  notificarCarrinhoBizy(itens);
}

export function adicionarItemCheckoutBizy(item: ItemEntradaCheckoutBizy): ItemCarrinhoCheckoutBizy[] {
  const novoItem = normalizarItemCheckoutBizy(item);
  const atuais = carregarCarrinhoCheckoutBizy();
  const indiceExistente = atuais.findIndex((atual) => atual.id === novoItem.id);

  const proximos =
    indiceExistente >= 0
      ? atuais.map((atual, indice) =>
          indice === indiceExistente
            ? {
                ...atual,
                quantidade: normalizarQuantidade(atual.quantidade + novoItem.quantidade),
                adicionadoEm: novoItem.adicionadoEm
              }
            : atual
        )
      : [...atuais, novoItem];

  guardarCarrinhoCheckoutBizy(proximos);
  void sincronizarCarrinhoServidorBizy(proximos, "SUBSTITUIR").catch(() => undefined);
  return proximos;
}

export function removerItemCheckoutBizy(id: string): ItemCarrinhoCheckoutBizy[] {
  const proximos = carregarCarrinhoCheckoutBizy().filter((item) => item.id !== id);
  guardarCarrinhoCheckoutBizy(proximos);
  void sincronizarCarrinhoServidorBizy(proximos, "SUBSTITUIR").catch(() => undefined);
  return proximos;
}

export function atualizarQuantidadeItemCheckoutBizy(id: string, quantidade: number): ItemCarrinhoCheckoutBizy[] {
  const proximos = carregarCarrinhoCheckoutBizy().map((item) =>
    item.id === id ? { ...item, quantidade: normalizarQuantidade(quantidade) } : item
  );
  guardarCarrinhoCheckoutBizy(proximos);
  void sincronizarCarrinhoServidorBizy(proximos, "SUBSTITUIR").catch(() => undefined);
  return proximos;
}

export function limparCarrinhoCheckoutBizy(): void {
  const storage = ambienteComStorage();
  storage?.removeItem(CHAVE_CARRINHO_BIZY);
  notificarCarrinhoBizy([]);
}

export function obterTokenCarrinhoCheckoutBizy(): string {
  return ambienteComStorage()?.getItem(CHAVE_TOKEN_CARRINHO_BIZY) ?? "";
}

export function guardarTokenCarrinhoCheckoutBizy(token: string): void {
  if (token) ambienteComStorage()?.setItem(CHAVE_TOKEN_CARRINHO_BIZY, token);
}

export async function sincronizarCarrinhoServidorBizy(
  itens: ItemCarrinhoCheckoutBizy[],
  modo: "MESCLAR" | "SUBSTITUIR" = "SUBSTITUIR"
): Promise<CarrinhoServidorBizy> {
  const token = obterTokenCarrinhoCheckoutBizy();
  const resposta = await requisitarApi<{ carrinho: CarrinhoServidorBizy; token: string | null }>(
    "/publico/market/carrinho/sincronizar",
    {
      method: "POST",
      headers: token ? { "X-Bizy-Cart-Token": token } : {},
      body: {
        modo,
        itens: itens.map((item) => ({
          slugLoja: item.slugLoja,
          codigoPeca: item.codigoProduto,
          varianteSelecionada: item.variantes ?? {},
          quantidade: item.quantidade,
          origem: item.origem ?? "market"
        }))
      }
    },
    false
  );
  if (resposta.token) ambienteComStorage()?.setItem(CHAVE_TOKEN_CARRINHO_BIZY, resposta.token);
  guardarCarrinhoCheckoutBizy(resposta.carrinho.itens);
  return resposta.carrinho;
}

export async function importarCarrinhoServidorBizy(): Promise<CarrinhoServidorBizy> {
  return sincronizarCarrinhoServidorBizy(carregarCarrinhoCheckoutBizy(), "MESCLAR");
}

export async function limparCarrinhoServidorBizy(): Promise<void> {
  const token = obterTokenCarrinhoCheckoutBizy();
  await requisitarApi("/publico/market/carrinho", {
    method: "DELETE",
    headers: token ? { "X-Bizy-Cart-Token": token } : {}
  }, false);
  limparCarrinhoCheckoutBizy();
}

export function obterChaveIdempotenciaCheckoutBizy(
  itens: ItemCarrinhoCheckoutBizy[],
  compradorTelefone: string,
  escopo = ""
): string {
  const assinatura = assinarCheckoutBizy(itens, compradorTelefone, escopo);
  const storage = ambienteComStorage();
  if (!storage) return gerarChaveIdempotenciaCheckoutBizy();

  try {
    const bruto = storage.getItem(CHAVE_IDEMPOTENCIA_CHECKOUT_BIZY);
    if (bruto) {
      const existente = JSON.parse(bruto) as ChaveIdempotenciaCheckoutBizy;
      if (existente.assinatura === assinatura && existente.chave) return existente.chave;
    }
  } catch {
    // Se a chave antiga estiver corrompida, gera-se uma nova abaixo.
  }

  const proxima: ChaveIdempotenciaCheckoutBizy = {
    assinatura,
    chave: gerarChaveIdempotenciaCheckoutBizy(),
    criadoEm: new Date().toISOString()
  };
  storage.setItem(CHAVE_IDEMPOTENCIA_CHECKOUT_BIZY, JSON.stringify(proxima));
  return proxima.chave;
}

export function limparChaveIdempotenciaCheckoutBizy(): void {
  const storage = ambienteComStorage();
  storage?.removeItem(CHAVE_IDEMPOTENCIA_CHECKOUT_BIZY);
}

export function agruparItensCheckoutPorLoja(itens: ItemCarrinhoCheckoutBizy[]): GrupoCheckoutBizy[] {
  const grupos = new Map<string, GrupoCheckoutBizy>();

  for (const item of itens) {
    const grupo = grupos.get(item.slugLoja) ?? {
      slugLoja: item.slugLoja,
      nomeFornecedor: item.nomeFornecedor,
      itens: [],
      subtotalEmKwanza: 0,
      urlLoja: item.urlLoja
    };

    grupo.itens.push(item);
    grupo.subtotalEmKwanza += item.precoUnitarioEmKwanza * item.quantidade;
    grupos.set(item.slugLoja, grupo);
  }

  return Array.from(grupos.values());
}

export function calcularTotaisCheckoutBizy(itens: ItemCarrinhoCheckoutBizy[]): TotaisCheckoutBizy {
  const grupos = agruparItensCheckoutPorLoja(itens);
  return {
    quantidadeItens: itens.reduce((total, item) => total + item.quantidade, 0),
    subtotalEmKwanza: itens.reduce((total, item) => total + item.precoUnitarioEmKwanza * item.quantidade, 0),
    totalLojas: grupos.length
  };
}

export function cotarCheckoutBizy(itens: ItemCarrinhoCheckoutBizy[], entrega: EntregaCheckoutPublico): Promise<CotacaoCheckoutBizy> {
  return requisitarApi("/publico/market/checkout/cotacao", {
    method: "POST",
    body: {
      itens: itens.map((item) => ({ slugLoja: item.slugLoja, codigoPeca: item.codigoProduto, varianteSelecionada: item.variantes ?? {}, quantidade: item.quantidade })),
      entrega
    }
  }, false);
}

export function criarItemCheckoutDeProdutoMarket(
  produto: ProdutoMarketNormalizado,
  quantidade = 1,
  origem = "market",
  variantes: Record<string, string> = {},
  precoUnitarioEmKwanza = produto.precoFinalEmKwanza
): ItemEntradaCheckoutBizy {
  return {
    slugLoja: produto.slugLoja,
    codigoProduto: produto.codigo,
    nomeProduto: produto.nome,
    nomeFornecedor: produto.nomeFornecedor,
    quantidade,
    precoUnitarioEmKwanza,
    fotoUrl: produto.fotoPrincipal,
    urlProduto: produto.urlProduto,
    urlLoja: produto.urlLoja,
    variantes,
    origem
  };
}
