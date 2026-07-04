const SUBDOMINIO_MARKET = "market";
const CAMINHO_MARKET_INTERNO = "/market";

export function obterUrlPublicaMarketConfigurada(): string | null {
  const urlExplicita = normalizarUrlPublicaMarket(import.meta.env.VITE_PUBLIC_MARKET_URL);
  if (urlExplicita) return urlExplicita;

  const dominioLojas = normalizarDominio(import.meta.env.VITE_PUBLIC_STORE_DOMAIN);
  return dominioLojas ? `https://${SUBDOMINIO_MARKET}.${dominioLojas}` : null;
}

export function temDominioMarketPublico(
  hostname = obterHostnameAtual(),
  urlPublica: string | null = obterUrlPublicaMarketConfigurada()
): boolean {
  const host = normalizarDominio(hostname);
  const hostMarket = extrairHostnameUrl(urlPublica);

  return Boolean(host && hostMarket && host === hostMarket);
}

export function montarUrlMarketPublico(
  caminhoDominio = "/",
  caminhoFallback = CAMINHO_MARKET_INTERNO,
  opcoes: {
    hostname?: string;
    origem?: string;
    urlPublica?: string | null;
  } = {}
): string {
  const caminho = normalizarCaminho(caminhoDominio);
  const urlPublica = opcoes.urlPublica === undefined
    ? obterUrlPublicaMarketConfigurada()
    : normalizarUrlPublicaMarket(opcoes.urlPublica);

  if (temDominioMarketPublico(opcoes.hostname ?? obterHostnameAtual(), urlPublica)) {
    return caminho;
  }

  if (urlPublica) {
    return `${urlPublica}${caminho === "/" ? "" : caminho}`;
  }

  if (opcoes.origem) {
    const origem = opcoes.origem.replace(/\/$/, "");
    return `${origem}${normalizarCaminho(caminhoFallback)}`;
  }

  return normalizarCaminho(caminhoFallback);
}

export function montarUrlProdutoMarketPublico(codigo: string): string {
  const segmento = encodeURIComponent(codigo.trim());
  return montarUrlMarketPublico(`/produtos/${segmento}`, `${CAMINHO_MARKET_INTERNO}/produtos/${segmento}`);
}

export function montarUrlCategoriaMarketPublico(categoria: string): string {
  const segmento = encodeURIComponent(categoria.trim());
  return montarUrlMarketPublico(`/categorias/${segmento}`, `${CAMINHO_MARKET_INTERNO}/categorias/${segmento}`);
}

export function montarUrlLojasMarketPublico(): string {
  return montarUrlMarketPublico("/lojas", `${CAMINHO_MARKET_INTERNO}/lojas`);
}

function normalizarUrlPublicaMarket(valor?: string | null): string | null {
  if (!valor) return null;
  const texto = valor.trim();
  if (!texto) return null;

  const comProtocolo = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
  try {
    const url = new URL(comProtocolo);
    return `${url.protocol}//${url.hostname.toLowerCase()}${url.port ? `:${url.port}` : ""}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function extrairHostnameUrl(valor?: string | null): string | null {
  const url = normalizarUrlPublicaMarket(valor);
  if (!url) return null;

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizarDominio(valor?: string | null): string | null {
  if (!valor) return null;
  const dominio = valor
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.split(":")[0]
    ?.replace(/\.$/, "") ?? "";

  return dominio || null;
}

function normalizarCaminho(valor: string): string {
  const caminho = valor.trim();
  if (!caminho || caminho === "/") return "/";
  return caminho.startsWith("/") ? caminho : `/${caminho}`;
}

function obterHostnameAtual(): string {
  return typeof window === "undefined" ? "" : window.location.hostname;
}
