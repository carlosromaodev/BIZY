import { requisitarApi, comQuery, resolverUrlMedia } from "./cliente";
import type {
  FiltrosMarketProdutos,
  FiltrosMarketLojas,
  FornecedorMarket,
  FornecedorMarketNormalizado,
  ProdutoMarket,
  ProdutoMarketNormalizado,
  RespostaMarketCategorias,
  RespostaMarketLojas,
  RespostaMarketProdutos,
  RespostaProdutoMarket,
  PayloadCheckoutUnificado,
  RespostaCheckoutUnificado,
} from "./tipos";

// ── Rotas API ──

const ROTAS = {
  categoriasMarket: "/publico/market/categorias",
  produtosMarket: "/publico/market/produtos",
  produtoMarket: (codigo: string) => `/publico/market/produtos/${encodeURIComponent(codigo)}`,
  similaresMarket: (codigo: string) => `/publico/market/produtos/${encodeURIComponent(codigo)}/similares`,
  lojasMarket: "/publico/market/lojas",
  lojaMarket: (slug: string) => `/publico/market/lojas/${encodeURIComponent(slug)}`,
  checkoutUnificado: "/publico/market/checkout",
  compraUnificada: (id: string) => `/publico/market/compras/${encodeURIComponent(id)}`,
  pagamentoUnificado: (id: string) => `/publico/market/compras/${encodeURIComponent(id)}/pagamento`,
};

// ── Funções API ──

export function listarCategoriasMarket(): Promise<RespostaMarketCategorias> {
  return requisitarApi<RespostaMarketCategorias>(ROTAS.categoriasMarket);
}

export function listarProdutosMarket(filtros: FiltrosMarketProdutos = {}): Promise<RespostaMarketProdutos> {
  return requisitarApi<RespostaMarketProdutos>(
    comQuery(ROTAS.produtosMarket, {
      busca: filtros.busca,
      categoria: filtros.categoria,
      provincia: filtros.provincia,
      municipio: filtros.municipio,
      loja: filtros.loja,
      precoMinimo: filtros.precoMinimo,
      precoMaximo: filtros.precoMaximo,
      apenasDisponivel: filtros.apenasDisponivel,
      apenasPromocao: filtros.apenasPromocao,
      limite: filtros.limite,
    })
  );
}

export function obterProdutoMarket(codigo: string): Promise<RespostaProdutoMarket> {
  return requisitarApi<RespostaProdutoMarket>(ROTAS.produtoMarket(codigo));
}

export function listarSimilaresMarket(codigo: string, limite = 8) {
  return requisitarApi<{ produtos: ProdutoMarket[]; total: number }>(
    comQuery(ROTAS.similaresMarket(codigo), { limite })
  );
}

export function listarLojasMarket(filtros: FiltrosMarketLojas = {}): Promise<RespostaMarketLojas> {
  return requisitarApi<RespostaMarketLojas>(
    comQuery(ROTAS.lojasMarket, {
      busca: filtros.busca,
      categoria: filtros.categoria,
      provincia: filtros.provincia,
      limite: filtros.limite,
    })
  );
}

export function criarCheckoutUnificado(payload: PayloadCheckoutUnificado): Promise<RespostaCheckoutUnificado> {
  return requisitarApi<RespostaCheckoutUnificado>(ROTAS.checkoutUnificado, {
    method: "POST",
    body: payload,
  });
}

// ── Normalização ──

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function numero(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return valor;
}

function resolverFotos(produto: Pick<ProdutoMarket, "fotos">): string[] {
  return (produto.fotos ?? []).map((f) => resolverUrlMedia(f)).filter(Boolean);
}

export function obterPrecoFinal(produto: Pick<ProdutoMarket, "precoEmKwanza" | "precoPromocionalEmKwanza">): number {
  const preco = Math.max(0, numero(produto.precoEmKwanza) ?? 0);
  const promo = numero(produto.precoPromocionalEmKwanza);
  return promo !== null && promo > 0 && promo < preco ? promo : preco;
}

function obterPrecoAntigo(produto: Pick<ProdutoMarket, "precoEmKwanza" | "precoPromocionalEmKwanza">): number | null {
  const preco = Math.max(0, numero(produto.precoEmKwanza) ?? 0);
  const final = obterPrecoFinal(produto);
  return final < preco ? preco : null;
}

function calcularDesconto(precoAntigo: number | null, precoFinal: number): number | null {
  if (!precoAntigo || precoAntigo <= 0 || precoFinal >= precoAntigo) return null;
  return Math.round(((precoAntigo - precoFinal) / precoAntigo) * 100);
}

function normalizarVariantes(v?: Record<string, string[]> | null): Record<string, string[]> {
  if (!v) return {};
  return Object.fromEntries(
    Object.entries(v)
      .map(([nome, opcoes]) => [nome, Array.isArray(opcoes) ? opcoes.filter((o): o is string => typeof o === "string") : []])
      .filter(([nome, opcoes]) => texto(nome).length > 0 && (opcoes as string[]).length > 0)
  );
}

function montarLocalizacao(loja?: FornecedorMarket | null): string {
  return [loja?.municipio, loja?.provincia].map(texto).filter(Boolean).join(", ");
}

export function normalizarFornecedor(loja?: FornecedorMarket | null): FornecedorMarketNormalizado {
  const slug = texto(loja?.slug);
  return {
    slug,
    nomeComercial: texto(loja?.nomeComercial) || "Fornecedor Bizy",
    descricaoPublica: texto(loja?.descricaoPublica),
    localizacao: montarLocalizacao(loja),
    segmento: texto(loja?.segmento),
    tipo: texto(loja?.tipo),
    corPrimaria: texto(loja?.corPrimaria) || "#16a34a",
    logoUrl: resolverUrlMedia(loja?.logoUrl),
    capaUrl: resolverUrlMedia(loja?.capaUrl),
    urlLoja: slug ? `/lojas/${slug}` : "",
  };
}

export function normalizarProduto(produto: ProdutoMarket): ProdutoMarketNormalizado {
  const fornecedor = normalizarFornecedor(produto.loja);
  const fotos = resolverFotos(produto);
  const precoFinalEmKwanza = obterPrecoFinal(produto);
  const precoAntigoEmKwanza = obterPrecoAntigo(produto);

  return {
    categoria: texto(produto.categoria) || "Sem categoria",
    codigo: produto.codigo,
    colecao: texto(produto.colecao),
    descricao: texto(produto.descricao),
    descontoPercentual: calcularDesconto(precoAntigoEmKwanza, precoFinalEmKwanza),
    disponivel: produto.disponivel ?? produto.quantidade > 0,
    emPromocao: precoAntigoEmKwanza !== null,
    estadoStock: produto.estadoStock ?? null,
    fornecedor,
    fotoPrincipal: fotos[0] ?? "",
    fotos,
    nome: produto.nome,
    nomeFornecedor: fornecedor.nomeComercial,
    precoAntigoEmKwanza,
    precoFinalEmKwanza,
    quantidade: produto.quantidade,
    slugLoja: fornecedor.slug,
    urlLoja: fornecedor.urlLoja,
    urlMarket: `/market/produtos/${produto.codigo}`,
    urlProduto: texto(produto.urlProduto) || `/lojas/${fornecedor.slug}/produtos/${produto.codigo}`,
    selos: produto.vitrine?.selos ?? [],
    variantes: normalizarVariantes(produto.variantes),
  };
}
