type OrigemCorsPermitida = boolean | string | RegExp | Array<boolean | string | RegExp>;
export type ResolverOrigemCors = OrigemCorsPermitida | ((
  origin: string | undefined,
  callback: (erro: Error | null, origin: OrigemCorsPermitida) => void
) => void);

const SUBDOMINIOS_RESERVADOS_LOJA = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "dashboard",
  "evolution",
  "evolution-manager",
  "market",
  "n8n",
  "painel",
  "static",
  "wa",
  "www"
]);

export function resolverOrigemCors(): ResolverOrigemCors {
  return (origin, callback) => {
    callback(null, resolverOrigemPermitida(origin));
  };
}

export function resolverOrigemPermitida(origin: string | undefined): boolean | string {
  const origensFrontend = obterOrigensFrontendConfiguradas();
  const dominioPublicoLoja = normalizarDominioPublicoLoja(process.env.PUBLIC_STORE_DOMAIN);
  const dominioPublicoMarket = obterDominioPublicoMarket(dominioPublicoLoja);

  if (!origin) return true;

  if (origensFrontend.length > 0) {
    const permitido =
      origensFrontend.includes(normalizarOrigemConfigurada(origin)) ||
      (process.env.NODE_ENV !== "production" && origemLocalDevPermitida(origin)) ||
      origemAplicacaoPermitida(origin, dominioPublicoLoja) ||
      origemMarketPermitida(origin, dominioPublicoMarket) ||
      origemSubdominioLojaPermitida(origin, dominioPublicoLoja);

    return permitido ? origin : false;
  }

  return process.env.NODE_ENV === "production" ? false : true;
}

function obterOrigensFrontendConfiguradas(): string[] {
  const origens = new Set<string>();

  for (const valor of [
    process.env.ORIGEM_FRONTEND,
    process.env.FRONTEND_URL,
    process.env.APP_PUBLIC_URL
  ]) {
    for (const origem of dividirOrigensConfiguradas(valor)) {
      const normalizada = normalizarOrigemConfigurada(origem);
      if (normalizada) origens.add(normalizada);
    }
  }

  return [...origens];
}

function dividirOrigensConfiguradas(valor?: string | null): string[] {
  if (!valor) return [];
  return valor
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizarOrigemConfigurada(valor: string): string {
  try {
    return new URL(valor).origin;
  } catch {
    return valor.trim().replace(/\/+$/, "");
  }
}

function obterDominioPublicoMarket(dominioPublicoLoja: string | null): string | null {
  const configurado =
    normalizarDominioPublicoLoja(process.env.PUBLIC_MARKET_DOMAIN) ??
    normalizarDominioPublicoLoja(process.env.MARKET_DOMAIN) ??
    normalizarDominioPublicoLoja(process.env.PUBLIC_MARKET_URL);

  return configurado ?? (dominioPublicoLoja ? `market.${dominioPublicoLoja}` : null);
}

function origemAplicacaoPermitida(origin: string, dominioPublicoLoja: string | null): boolean {
  if (!dominioPublicoLoja) return false;

  try {
    const url = new URL(origin);
    const protocoloPermitido = process.env.NODE_ENV === "production"
      ? url.protocol === "https:"
      : ["http:", "https:"].includes(url.protocol);

    return protocoloPermitido && normalizarDominioPublicoLoja(url.hostname) === `app.${dominioPublicoLoja}`;
  } catch {
    return false;
  }
}

function origemMarketPermitida(origin: string, dominioPublicoMarket: string | null): boolean {
  if (!dominioPublicoMarket) return false;

  try {
    const url = new URL(origin);
    const protocoloPermitido = process.env.NODE_ENV === "production" ? url.protocol === "https:" : ["http:", "https:"].includes(url.protocol);
    if (!protocoloPermitido) return false;

    return normalizarDominioPublicoLoja(url.hostname) === dominioPublicoMarket;
  } catch {
    return false;
  }
}

function origemSubdominioLojaPermitida(origin: string, dominioPublicoLoja: string | null): boolean {
  if (!dominioPublicoLoja) return false;

  try {
    const url = new URL(origin);
    const protocoloPermitido = process.env.NODE_ENV === "production" ? url.protocol === "https:" : ["http:", "https:"].includes(url.protocol);
    if (!protocoloPermitido) return false;

    const host = normalizarDominioPublicoLoja(url.hostname);
    if (!host) return false;

    if (host === dominioPublicoLoja) return true;
    if (!host.endsWith(`.${dominioPublicoLoja}`)) return false;

    const subdominio = host.slice(0, -(dominioPublicoLoja.length + 1));
    return Boolean(subdominio && !subdominio.includes(".") && !SUBDOMINIOS_RESERVADOS_LOJA.has(subdominio));
  } catch {
    return false;
  }
}

function normalizarDominioPublicoLoja(valor?: string | null): string | null {
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

function origemLocalDevPermitida(origin: string): boolean {
  try {
    const url = new URL(origin);
    const porta = Number(url.port || "80");
    const hostLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
    const portaVite = porta === 4173 || (porta >= 5173 && porta <= 5199);

    return ["http:", "https:"].includes(url.protocol) && hostLocal && portaVite;
  } catch {
    return false;
  }
}
