import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProdutoMarketNormalizado } from "../api/tipos";

const CHAVE_CARRINHO = "bizy_checkout_unificado_v1";

export interface ItemCarrinho {
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

export interface GrupoCheckout {
  slugLoja: string;
  nomeFornecedor: string;
  itens: ItemCarrinho[];
  subtotalEmKwanza: number;
}

export interface TotaisCheckout {
  quantidadeItens: number;
  subtotalEmKwanza: number;
  totalLojas: number;
}

function chaveItem(item: Pick<ItemCarrinho, "codigoProduto" | "slugLoja" | "variantes">): string {
  const variantes = Object.entries(item.variantes ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nome, valor]) => `${nome}:${valor}`)
    .join("|");
  return `${item.slugLoja}:${item.codigoProduto}:${variantes}`;
}

function normalizarQuantidade(qtd: number): number {
  if (!Number.isFinite(qtd)) return 1;
  return Math.max(1, Math.min(99, Math.round(qtd)));
}

export async function carregarCarrinho(): Promise<ItemCarrinho[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_CARRINHO);
    if (!bruto) return [];
    const itens = JSON.parse(bruto);
    if (!Array.isArray(itens)) return [];
    return itens.filter((i: ItemCarrinho) => i.slugLoja && i.codigoProduto);
  } catch {
    return [];
  }
}

export async function guardarCarrinho(itens: ItemCarrinho[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
}

export async function adicionarItem(
  item: Omit<ItemCarrinho, "adicionadoEm" | "id"> & { id?: string }
): Promise<ItemCarrinho[]> {
  const novoItem: ItemCarrinho = {
    ...item,
    id: item.id || chaveItem(item),
    quantidade: normalizarQuantidade(item.quantidade),
    precoUnitarioEmKwanza: Math.max(0, Math.round(item.precoUnitarioEmKwanza || 0)),
    variantes: item.variantes ?? {},
    adicionadoEm: new Date().toISOString(),
  };

  const atuais = await carregarCarrinho();
  const indice = atuais.findIndex((a) => a.id === novoItem.id);

  const proximos =
    indice >= 0
      ? atuais.map((a, i) =>
          i === indice
            ? { ...a, quantidade: normalizarQuantidade(a.quantidade + novoItem.quantidade), adicionadoEm: novoItem.adicionadoEm }
            : a
        )
      : [...atuais, novoItem];

  await guardarCarrinho(proximos);
  return proximos;
}

export async function removerItem(id: string): Promise<ItemCarrinho[]> {
  const proximos = (await carregarCarrinho()).filter((i) => i.id !== id);
  await guardarCarrinho(proximos);
  return proximos;
}

export async function atualizarQuantidade(id: string, quantidade: number): Promise<ItemCarrinho[]> {
  const proximos = (await carregarCarrinho()).map((i) =>
    i.id === id ? { ...i, quantidade: normalizarQuantidade(quantidade) } : i
  );
  await guardarCarrinho(proximos);
  return proximos;
}

export async function limparCarrinho(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_CARRINHO);
}

export function agruparPorLoja(itens: ItemCarrinho[]): GrupoCheckout[] {
  const grupos = new Map<string, GrupoCheckout>();

  for (const item of itens) {
    const grupo = grupos.get(item.slugLoja) ?? {
      slugLoja: item.slugLoja,
      nomeFornecedor: item.nomeFornecedor,
      itens: [],
      subtotalEmKwanza: 0,
    };
    grupo.itens.push(item);
    grupo.subtotalEmKwanza += item.precoUnitarioEmKwanza * item.quantidade;
    grupos.set(item.slugLoja, grupo);
  }

  return Array.from(grupos.values());
}

export function calcularTotais(itens: ItemCarrinho[]): TotaisCheckout {
  const grupos = agruparPorLoja(itens);
  return {
    quantidadeItens: itens.reduce((t, i) => t + i.quantidade, 0),
    subtotalEmKwanza: itens.reduce((t, i) => t + i.precoUnitarioEmKwanza * i.quantidade, 0),
    totalLojas: grupos.length,
  };
}

export function criarItemDeProduto(
  produto: ProdutoMarketNormalizado,
  quantidade = 1,
  origem = "market"
): Omit<ItemCarrinho, "adicionadoEm" | "id"> {
  return {
    slugLoja: produto.slugLoja,
    codigoProduto: produto.codigo,
    nomeProduto: produto.nome,
    nomeFornecedor: produto.nomeFornecedor,
    quantidade,
    precoUnitarioEmKwanza: produto.precoFinalEmKwanza,
    fotoUrl: produto.fotoPrincipal,
    urlProduto: produto.urlProduto,
    urlLoja: produto.urlLoja,
    variantes: {},
    origem,
  };
}
