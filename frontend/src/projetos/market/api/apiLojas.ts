import { requisitarApi, resolverUrlMedia } from "../../../api";
import { ROTAS_API_LOJAS, ROTAS_LOJAS } from "./rotasLojas";
import { obterAcessoCompraMarket } from "./checkoutUnificado";
import type {
  CatalogoPersonalizadoLoja,
  EventoTrackingPublicoPayload,
  FiltrosLojaPublica,
  FiltrosMarketLojas,
  FiltrosMarketProdutos,
  FornecedorMarket,
  FornecedorMarketNormalizado,
  MetricasLojaTeam,
  PayloadCalculoEntregaLojaPublica,
  PayloadCatalogoLoja,
  PayloadCheckoutAbandonadoLojaPublica,
  PayloadFormularioLeadLojaPublica,
  PayloadCheckoutLojaPublica,
  PayloadConfiguracaoLojaPublica,
  PayloadCasoPosVendaMarketTeam,
  PayloadDecisaoDisputaMarketTeam,
  PayloadDisputaMarketTeam,
  PayloadReembolsoMarketTeam,
  PayloadSellerOnboardingMarket,
  PayloadWhatsAppLojaPublica,
  ProdutoLojaPublica,
  ProdutoMarket,
  ProdutoMarketNormalizado,
  RegistroJson,
  RespostaCatalogosTeam,
  RespostaCheckoutAbandonadoLojaPublica,
  RespostaCheckoutLojaPublica,
  RespostaFormularioLeadLojaPublica,
  RespostaConfiguracaoLojaPublica,
  RespostaLojaMarket,
  RespostaLojaPublica,
  RespostaMarketCategorias,
  RespostaMarketLojas,
  RespostaMarketProdutos,
  RespostaProdutoLojaPublica,
  RespostaProdutoMarket,
  RespostaPublicacaoProdutoMarket,
  RespostaPublicacaoProdutosMarketEmMassa,
  RespostaSeguidoresTeam,
  RespostaSimilaresMarket,
  RespostaWhatsAppLojaPublica,
  ResumoCheckoutLojaPublica,
  ResumoMarketLoja,
  ResumoTrackingLojaPublica,
  PayloadCheckoutUnificado,
  RespostaCatalogoPublico,
  RespostaCheckoutUnificado,
  RespostaCompraEstados,
  RespostaCasoPosVendaMarketTeam,
  RespostaChecklistCatalogoMarket,
  RespostaEventosMarketTeam,
  RepasseFinanceiroTeam,
  ReembolsoMarketTeam,
  ContaSellerMarket,
  DisputaMarketTeam,
  RespostaSellerOnboardingMarket
} from "./tiposLojas";

type ValorQuery = string | number | boolean | null | undefined;

export function montarQuery(campos: Record<string, ValorQuery>): string {
  const params = new URLSearchParams();

  for (const [chave, valor] of Object.entries(campos)) {
    if (valor === null || valor === undefined) continue;
    if (typeof valor === "string" && valor.trim() === "") continue;
    params.set(chave, String(valor));
  }

  return params.toString();
}

function comQuery(caminho: string, campos: Record<string, ValorQuery>): string {
  const query = montarQuery(campos);
  return query ? `${caminho}?${query}` : caminho;
}

function camposUtm(utm?: Record<string, string | null | undefined>): Record<string, ValorQuery> {
  if (!utm) return {};

  return Object.fromEntries(
    Object.entries(utm)
      .filter(([, valor]) => typeof valor === "string" && valor.trim() !== "")
      .map(([chave, valor]) => [chave.startsWith("utm_") ? chave : `utm_${chave}`, valor])
  );
}

function camposTracking(filtros?: FiltrosLojaPublica | null): Record<string, ValorQuery> {
  return {
    trackingId: filtros?.trackingId,
    origem: filtros?.origem,
    canal: filtros?.canal,
    ...camposUtm(filtros?.utm)
  };
}

function camposFiltrosLoja(filtros?: FiltrosLojaPublica | null): Record<string, ValorQuery> {
  return {
    busca: filtros?.busca,
    categoria: filtros?.categoria,
    colecao: filtros?.colecao,
    estadoStock: filtros?.estadoStock,
    limite: filtros?.limite
  };
}

export function listarCategoriasMarket(): Promise<RespostaMarketCategorias> {
  return requisitarApi<RespostaMarketCategorias>(ROTAS_API_LOJAS.categoriasMarket, {}, false);
}

export function listarProdutosMarket(filtros: FiltrosMarketProdutos = {}): Promise<RespostaMarketProdutos> {
  return requisitarApi<RespostaMarketProdutos>(
    comQuery(ROTAS_API_LOJAS.produtosMarket, {
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
      offset: filtros.offset
    }),
    {},
    false
  );
}

export function obterProdutoMarket(codigo: string): Promise<RespostaProdutoMarket> {
  return requisitarApi<RespostaProdutoMarket>(ROTAS_API_LOJAS.produtoMarket(codigo), {}, false);
}

export function listarProdutosSimilaresMarket(codigo: string, limite?: number | null): Promise<RespostaSimilaresMarket> {
  return requisitarApi<RespostaSimilaresMarket>(
    comQuery(ROTAS_API_LOJAS.produtosSimilaresMarket(codigo), { limite }),
    {},
    false
  );
}

export function obterLojaPublica(slug: string, filtros: FiltrosLojaPublica = {}): Promise<RespostaLojaPublica> {
  return requisitarApi<RespostaLojaPublica>(
    comQuery(ROTAS_API_LOJAS.lojaPublica(slug), {
      ...camposTracking(filtros),
      ...camposFiltrosLoja(filtros)
    }),
    {},
    false
  );
}

export function obterProdutoLojaPublica(
  slug: string,
  codigo: string,
  tracking: Omit<FiltrosLojaPublica, "busca" | "categoria" | "colecao" | "estadoStock" | "limite"> = {}
): Promise<RespostaProdutoLojaPublica> {
  return requisitarApi<RespostaProdutoLojaPublica>(
    comQuery(ROTAS_API_LOJAS.produtoLoja(slug, codigo), camposTracking(tracking)),
    {},
    false
  );
}

export function listarProdutosSimilaresLojaPublica(
  slug: string,
  codigo: string,
  limite?: number | null
): Promise<RespostaSimilaresMarket> {
  return requisitarApi<RespostaSimilaresMarket>(
    comQuery(ROTAS_API_LOJAS.produtosSimilaresLoja(slug, codigo), { limite }),
    {},
    false
  );
}

export function calcularEntregaLojaPublica(
  slug: string,
  payload: PayloadCalculoEntregaLojaPublica
): Promise<ResumoCheckoutLojaPublica> {
  return requisitarApi<ResumoCheckoutLojaPublica>(
    ROTAS_API_LOJAS.entregaLoja(slug),
    { method: "POST", body: payload },
    false
  );
}

export function gerarCheckoutWhatsAppLojaPublica(
  slug: string,
  codigo: string,
  payload: PayloadWhatsAppLojaPublica
): Promise<RespostaWhatsAppLojaPublica> {
  return requisitarApi<RespostaWhatsAppLojaPublica>(
    ROTAS_API_LOJAS.produtoLojaWhatsApp(slug, codigo),
    { method: "POST", body: payload },
    false
  );
}

export function criarCheckoutLojaPublica(
  slug: string,
  payload: PayloadCheckoutLojaPublica
): Promise<RespostaCheckoutLojaPublica> {
  return requisitarApi<RespostaCheckoutLojaPublica>(
    ROTAS_API_LOJAS.checkoutLoja(slug),
    { method: "POST", body: payload },
    false
  );
}

export function registrarCheckoutAbandonadoLojaPublica(
  slug: string,
  payload: PayloadCheckoutAbandonadoLojaPublica
): Promise<RespostaCheckoutAbandonadoLojaPublica> {
  return requisitarApi<RespostaCheckoutAbandonadoLojaPublica>(
    ROTAS_API_LOJAS.checkoutAbandonadoLoja(slug),
    { method: "POST", body: payload },
    false
  );
}

export function submeterFormularioLeadLojaPublica(
  slug: string,
  payload: PayloadFormularioLeadLojaPublica
): Promise<RespostaFormularioLeadLojaPublica> {
  return requisitarApi<RespostaFormularioLeadLojaPublica>(
    ROTAS_API_LOJAS.formularioLeadLoja(slug),
    { method: "POST", body: payload },
    false
  );
}

export function registrarEventoTrackingPublico(payload: EventoTrackingPublicoPayload): Promise<RegistroJson> {
  return requisitarApi<RegistroJson>(ROTAS_API_LOJAS.trackingPublico, { method: "POST", body: payload }, false);
}

export function obterConfiguracaoLojaPublica(): Promise<RespostaConfiguracaoLojaPublica> {
  return requisitarApi<RespostaConfiguracaoLojaPublica>(ROTAS_API_LOJAS.configuracaoLoja);
}

export function salvarConfiguracaoLojaPublica(
  payload: PayloadConfiguracaoLojaPublica
): Promise<RespostaConfiguracaoLojaPublica> {
  return requisitarApi<RespostaConfiguracaoLojaPublica>(ROTAS_API_LOJAS.configuracaoLoja, {
    method: "PUT",
    body: payload
  });
}

export function obterResumoTrackingLojaPublica(): Promise<ResumoTrackingLojaPublica> {
  return requisitarApi<ResumoTrackingLojaPublica>(ROTAS_API_LOJAS.trackingResumoLoja);
}

export function obterResumoMarketLoja(): Promise<ResumoMarketLoja> {
  return requisitarApi<ResumoMarketLoja>(ROTAS_API_LOJAS.resumoMarketLoja);
}

export function atualizarPublicacaoProdutoMarket(
  codigo: string,
  publicado: boolean
): Promise<RespostaPublicacaoProdutoMarket> {
  return requisitarApi<RespostaPublicacaoProdutoMarket>(ROTAS_API_LOJAS.publicacaoMarketProduto(codigo), {
    method: "PUT",
    body: { publicado }
  });
}

export function atualizarPublicacaoProdutosMarketEmMassa(
  codigos: string[],
  publicado: boolean
): Promise<RespostaPublicacaoProdutosMarketEmMassa> {
  return requisitarApi<RespostaPublicacaoProdutosMarketEmMassa>(
    ROTAS_API_LOJAS.publicacaoMarketProdutosEmMassa,
    {
      method: "PUT",
      body: { codigos, publicado }
    }
  );
}

export function montarUrlLojaPublica(slug?: string | null): string {
  return slug?.trim() ? ROTAS_LOJAS.loja(slug) : "";
}

export function montarUrlProdutoLoja(slug?: string | null, codigo?: string | null): string {
  return slug?.trim() && codigo?.trim() ? ROTAS_LOJAS.produtoLoja(slug, codigo) : "";
}

export function montarUrlProdutoMarket(codigo?: string | null): string {
  return codigo?.trim() ? ROTAS_LOJAS.produtoMarket(codigo) : "";
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function numero(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return valor;
}

function resolverFotosProduto(produto: Pick<ProdutoMarket, "fotos">): string[] {
  return (produto.fotos ?? []).map((foto) => resolverUrlMedia(foto)).filter(Boolean);
}

export function obterFotoPrincipalProduto(produto: Pick<ProdutoMarket, "fotos">): string {
  return resolverFotosProduto(produto)[0] ?? "";
}

export function obterPrecoFinalProduto(produto: Pick<ProdutoMarket, "precoEmKwanza" | "precoPromocionalEmKwanza">): number {
  const preco = Math.max(0, numero(produto.precoEmKwanza) ?? 0);
  const promocional = numero(produto.precoPromocionalEmKwanza);
  return promocional !== null && promocional > 0 && promocional < preco ? promocional : preco;
}

function obterPrecoAntigoProduto(
  produto: Pick<ProdutoMarket, "precoEmKwanza" | "precoPromocionalEmKwanza">
): number | null {
  const preco = Math.max(0, numero(produto.precoEmKwanza) ?? 0);
  const final = obterPrecoFinalProduto(produto);
  return final < preco ? preco : null;
}

function calcularDescontoPercentual(precoAntigo: number | null, precoFinal: number): number | null {
  if (!precoAntigo || precoAntigo <= 0 || precoFinal >= precoAntigo) return null;
  return Math.round(((precoAntigo - precoFinal) / precoAntigo) * 100);
}

function normalizarVariantes(variantes?: Record<string, string[]> | null): Record<string, string[]> {
  if (!variantes) return {};

  return Object.fromEntries(
    Object.entries(variantes)
      .map(([nome, opcoes]) => [
        nome,
        Array.isArray(opcoes) ? opcoes.filter((opcao): opcao is string => typeof opcao === "string") : []
      ])
      .filter(([nome, opcoes]) => texto(nome).length > 0 && opcoes.length > 0)
  );
}

function montarLocalizacao(loja?: FornecedorMarket | null): string {
  return [loja?.municipio, loja?.provincia].map(texto).filter(Boolean).join(", ");
}

export function normalizarFornecedorMarket(loja?: FornecedorMarket | null): FornecedorMarketNormalizado {
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
    urlLoja: montarUrlLojaPublica(slug)
  };
}

export function normalizarProdutoMarket(produto: ProdutoMarket): ProdutoMarketNormalizado {
  const fornecedor = normalizarFornecedorMarket(produto.loja);
  const fotos = resolverFotosProduto(produto);
  const precoFinalEmKwanza = obterPrecoFinalProduto(produto);
  const precoAntigoEmKwanza = obterPrecoAntigoProduto(produto);
  const urlLoja = texto(produto.urlLoja) || fornecedor.urlLoja;
  const urlProduto =
    texto(produto.urlProduto) || montarUrlProdutoLoja(fornecedor.slug, produto.codigo) || montarUrlProdutoMarket(produto.codigo);

  return {
    categoria: texto(produto.categoria) || "Sem categoria",
    codigo: produto.codigo,
    colecao: texto(produto.colecao),
    descricao: texto(produto.descricao),
    descontoPercentual: calcularDescontoPercentual(precoAntigoEmKwanza, precoFinalEmKwanza),
    disponivel: produto.disponivel ?? produto.quantidade > 0,
    emPromocao: precoAntigoEmKwanza !== null,
    estadoStock: produto.estadoStock ?? null,
    fornecedor: {
      ...fornecedor,
      urlLoja
    },
    fotoPrincipal: fotos[0] ?? "",
    fotos,
    nome: produto.nome,
    nomeFornecedor: fornecedor.nomeComercial,
    precoAntigoEmKwanza,
    precoFinalEmKwanza,
    quantidade: produto.quantidade,
    slugLoja: fornecedor.slug,
    urlLoja,
    urlMarket: montarUrlProdutoMarket(produto.codigo),
    urlProduto,
    selos: produto.vitrine?.selos ?? [],
    variantes: normalizarVariantes(produto.variantes)
  };
}

export async function seguirLoja(slug: string, identificador: string, origem = "perfil"): Promise<{ ok: boolean }> {
  return requisitarApi(`${ROTAS_API_LOJAS.lojaPublica(slug)}/seguir`, {
    method: "POST",
    body: JSON.stringify({ identificador, tipo: "anonimo", origem })
  });
}

export async function deixarDeSeguirLoja(slug: string, identificador: string): Promise<{ ok: boolean }> {
  return requisitarApi(`${ROTAS_API_LOJAS.lojaPublica(slug)}/seguir`, {
    method: "DELETE",
    body: JSON.stringify({ identificador })
  });
}

export async function verificarSeSegueLoja(slug: string, identificador: string): Promise<{ seguindo: boolean }> {
  return requisitarApi(`${ROTAS_API_LOJAS.lojaPublica(slug)}/seguindo?identificador=${encodeURIComponent(identificador)}`);
}

export function normalizarProdutoLojaPublica(produto: ProdutoLojaPublica, slugLoja?: string | null): ProdutoMarketNormalizado {
  return normalizarProdutoMarket({
    ...produto,
    loja: {
      slug: slugLoja,
      nomeComercial: "Loja Bizy"
    },
    urlLoja: montarUrlLojaPublica(slugLoja),
    urlProduto: montarUrlProdutoLoja(slugLoja, produto.codigo)
  });
}

// --- Catálogo Público Partilhável ---

export function obterCatalogoPublico(slug: string, catalogoId: string): Promise<RespostaCatalogoPublico> {
  return requisitarApi<RespostaCatalogoPublico>(ROTAS_API_LOJAS.catalogoPublicoLoja(slug, catalogoId), {}, false);
}

// --- Fase 2: Lojas no Market ---

export function listarLojasMarket(filtros: FiltrosMarketLojas = {}): Promise<RespostaMarketLojas> {
  return requisitarApi<RespostaMarketLojas>(
    comQuery(ROTAS_API_LOJAS.lojasMarketApi, {
      busca: filtros.busca,
      categoria: filtros.categoria,
      provincia: filtros.provincia,
      limite: filtros.limite,
      offset: filtros.offset
    }),
    {},
    false
  );
}

export function obterLojaMarket(slug: string): Promise<RespostaLojaMarket> {
  return requisitarApi<RespostaLojaMarket>(ROTAS_API_LOJAS.lojaMarketApi(slug), {}, false);
}

export function registrarEventoRecomendacao(payload: EventoTrackingPublicoPayload): Promise<RegistroJson> {
  return requisitarApi<RegistroJson>(ROTAS_API_LOJAS.trackingRecomendacoes, { method: "POST", body: payload }, false);
}

// --- Fase 3: Studio Team ---

export function listarCatalogosTeam(): Promise<RespostaCatalogosTeam> {
  return requisitarApi<RespostaCatalogosTeam>(ROTAS_API_LOJAS.catalogosTeam);
}

export function criarCatalogoTeam(payload: PayloadCatalogoLoja): Promise<CatalogoPersonalizadoLoja> {
  return requisitarApi<CatalogoPersonalizadoLoja>(ROTAS_API_LOJAS.catalogosTeam, {
    method: "POST",
    body: payload
  });
}

export function atualizarCatalogoTeam(id: string, payload: Partial<PayloadCatalogoLoja>): Promise<CatalogoPersonalizadoLoja> {
  return requisitarApi<CatalogoPersonalizadoLoja>(ROTAS_API_LOJAS.catalogoTeam(id), {
    method: "PUT",
    body: payload
  });
}

export function removerCatalogoTeam(id: string): Promise<{ ok: boolean }> {
  return requisitarApi<{ ok: boolean }>(ROTAS_API_LOJAS.catalogoTeam(id), {
    method: "DELETE"
  });
}

export function listarSeguidoresTeam(filtros?: { limite?: number; offset?: number; origem?: string }): Promise<RespostaSeguidoresTeam> {
  return requisitarApi<RespostaSeguidoresTeam>(
    comQuery(ROTAS_API_LOJAS.seguidoresTeam, {
      limite: filtros?.limite,
      offset: filtros?.offset,
      origem: filtros?.origem
    })
  );
}

export function obterMetricasLojaTeam(): Promise<MetricasLojaTeam> {
  return requisitarApi<MetricasLojaTeam>(ROTAS_API_LOJAS.metricasTeam);
}

// Aliases legados: use as funções Team em código novo.
export const listarCatalogosCrm = listarCatalogosTeam;
export const criarCatalogoCrm = criarCatalogoTeam;
export const atualizarCatalogoCrm = atualizarCatalogoTeam;
export const removerCatalogoCrm = removerCatalogoTeam;
export const listarSeguidoresCrm = listarSeguidoresTeam;
export const obterMetricasLojaCrm = obterMetricasLojaTeam;

// ── Checkout Unificado Multi-Loja ──

export function criarCheckoutUnificado(payload: PayloadCheckoutUnificado): Promise<RespostaCheckoutUnificado> {
  return requisitarApi<RespostaCheckoutUnificado>(ROTAS_API_LOJAS.checkoutUnificado, {
    method: "POST",
    body: payload
  }, false);
}

export function obterCompraUnificada(compraId: string): Promise<RespostaCompraEstados> {
  const tokenCompra = obterAcessoCompraMarket(compraId);
  return requisitarApi<RespostaCompraEstados>(ROTAS_API_LOJAS.compraUnificada(compraId), {
    headers: tokenCompra ? { "X-Bizy-Compra-Token": tokenCompra } : {}
  }, false);
}

export function obterPortalCompradorMarket(): Promise<{ compras: RespostaCompraEstados[]; total: number }> {
  return requisitarApi<{ compras: RespostaCompraEstados[]; total: number }>(
    "/conta/comprador/compras", {}, false
  );
}

export function enviarComprovativoPagamentoUnificado(
  compraId: string,
  comprovativoUrl: string
): Promise<RespostaCompraEstados> {
  const tokenCompra = obterAcessoCompraMarket(compraId);
  return requisitarApi<RespostaCompraEstados>(ROTAS_API_LOJAS.pagamentoUnificado(compraId), {
    method: "POST",
    body: { comprovativoUrl },
    headers: tokenCompra ? { "X-Bizy-Compra-Token": tokenCompra } : {}
  }, false);
}

export const confirmarPagamentoUnificado = enviarComprovativoPagamentoUnificado;

// ── Pedidos Market no Team ──

export function listarPedidosMarketTeam(filtros?: {
  estado?: string;
  estadoPagamento?: string;
  busca?: string;
  limite?: number;
}): Promise<{ pedidos: unknown[]; total: number }> {
  return requisitarApi(
    comQuery(ROTAS_API_LOJAS.pedidosMarketTeam, {
      estado: filtros?.estado,
      estadoPagamento: filtros?.estadoPagamento,
      busca: filtros?.busca,
      limite: filtros?.limite
    })
  );
}

// Alias legado: use listarPedidosMarketTeam em código novo.
export const listarPedidosMarketCrm = listarPedidosMarketTeam;

// ── Seller Market no Team ──

export function obterSellerOnboardingMarket(): Promise<RespostaSellerOnboardingMarket> {
  return requisitarApi<RespostaSellerOnboardingMarket>(ROTAS_API_LOJAS.sellerOnboarding);
}

export function atualizarSellerOnboardingMarket(
  dados: PayloadSellerOnboardingMarket
): Promise<RespostaSellerOnboardingMarket> {
  return requisitarApi<RespostaSellerOnboardingMarket>(ROTAS_API_LOJAS.sellerOnboarding, {
    method: "PUT",
    body: dados
  });
}

export function obterContaSellerMarket(): Promise<ContaSellerMarket> {
  return requisitarApi<ContaSellerMarket>(ROTAS_API_LOJAS.sellerConta);
}

export function obterChecklistCatalogoMarket(): Promise<RespostaChecklistCatalogoMarket> {
  return requisitarApi<RespostaChecklistCatalogoMarket>(ROTAS_API_LOJAS.checklistCatalogoMarketTeam);
}

export function listarDisputasMarketTeam(filtros?: {
  estado?: string;
  entidadeTipo?: "PRODUTO" | "LOJA";
  limite?: number;
}): Promise<{ disputas: DisputaMarketTeam[]; total: number }> {
  return requisitarApi(
    comQuery(ROTAS_API_LOJAS.disputasMarketTeam, {
      estado: filtros?.estado,
      entidadeTipo: filtros?.entidadeTipo,
      limite: filtros?.limite
    })
  );
}

export function criarDisputaMarketTeam(
  dados: PayloadDisputaMarketTeam
): Promise<{ disputa: DisputaMarketTeam }> {
  return requisitarApi(ROTAS_API_LOJAS.disputasMarketTeam, {
    method: "POST",
    body: dados
  });
}

export function decidirDisputaMarketTeam(
  id: string,
  dados: PayloadDecisaoDisputaMarketTeam
): Promise<{ disputa: DisputaMarketTeam }> {
  return requisitarApi(ROTAS_API_LOJAS.decisaoDisputaMarketTeam(id), {
    method: "PATCH",
    body: dados
  });
}

export function criarCasoPosVendaMarketTeam(
  dados: PayloadCasoPosVendaMarketTeam
): Promise<RespostaCasoPosVendaMarketTeam> {
  return requisitarApi(ROTAS_API_LOJAS.casosPosVendaMarketTeam, {
    method: "POST",
    body: dados
  });
}

export function listarFilaTrustSafetyMarketTeam(filtros?: {
  estado?: string;
  entidadeTipo?: "PRODUTO" | "LOJA";
  limite?: number;
}): Promise<{ casos: DisputaMarketTeam[]; metricas: { abertos: number; resolvidos: number } }> {
  return requisitarApi(
    comQuery(ROTAS_API_LOJAS.trustSafetyMarketTeam, {
      estado: filtros?.estado,
      entidadeTipo: filtros?.entidadeTipo,
      limite: filtros?.limite
    })
  );
}

export function listarReembolsosMarketTeam(filtros?: {
  pedidoId?: string;
  estado?: ReembolsoMarketTeam["estado"];
  limite?: number;
}): Promise<{ reembolsos: ReembolsoMarketTeam[]; total: number }> {
  return requisitarApi(
    comQuery(ROTAS_API_LOJAS.reembolsosMarketTeam, {
      pedidoId: filtros?.pedidoId,
      estado: filtros?.estado,
      limite: filtros?.limite
    })
  );
}

export function criarReembolsoMarketTeam(
  dados: PayloadReembolsoMarketTeam
): Promise<{ reembolso: ReembolsoMarketTeam }> {
  return requisitarApi(ROTAS_API_LOJAS.reembolsosMarketTeam, {
    method: "POST",
    body: dados
  });
}

export function listarEventosMarketTeam(limite?: number): Promise<RespostaEventosMarketTeam> {
  return requisitarApi<RespostaEventosMarketTeam>(
    comQuery(ROTAS_API_LOJAS.eventosMarketTeam, { limite })
  );
}

// ── Repasses Financeiros no Team ──

export function listarRepassesTeam(filtros?: {
  estado?: string;
  pedidoId?: string;
  limite?: number;
}): Promise<RepasseFinanceiroTeam[]> {
  return requisitarApi<RepasseFinanceiroTeam[]>(
    comQuery(ROTAS_API_LOJAS.repassesTeam, {
      estado: filtros?.estado,
      pedidoId: filtros?.pedidoId,
      limite: filtros?.limite
    })
  );
}

// Alias legado: use listarRepassesTeam em código novo.
export const listarRepassesCrm = listarRepassesTeam;
