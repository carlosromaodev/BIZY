const SUBDOMINIOS_RESERVADOS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "dashboard",
  "evolution",
  "evolution-manager",
  "n8n",
  "painel",
  "static",
  "wa",
  "www"
]);

export function obterDominioPublicoLojaConfigurado(): string | null {
  return normalizarDominioPublicoLoja(import.meta.env.VITE_PUBLIC_STORE_DOMAIN);
}

export function extrairSlugLojaDoHostname(
  hostname: string,
  dominioBase: string | null = obterDominioPublicoLojaConfigurado()
): string | null {
  const host = normalizarHostname(hostname);
  const dominio = normalizarDominioPublicoLoja(dominioBase);

  if (!host || !dominio || host === dominio || !host.endsWith(`.${dominio}`)) {
    return null;
  }

  const subdominio = host.slice(0, -(dominio.length + 1));
  if (!subdominio || subdominio.includes(".") || SUBDOMINIOS_RESERVADOS.has(subdominio)) {
    return null;
  }

  const slug = normalizarSlugLoja(subdominio);
  return slug && slug === subdominio ? slug : null;
}

export function resolverSlugLojaPublica(
  slugRota?: string | null,
  hostname = obterHostnameAtual(),
  dominioBase: string | null = obterDominioPublicoLojaConfigurado()
): string {
  return extrairSlugLojaDoHostname(hostname, dominioBase) ?? normalizarSlugLoja(slugRota ?? "");
}

export function temSubdominioLojaPublica(
  hostname = obterHostnameAtual(),
  dominioBase: string | null = obterDominioPublicoLojaConfigurado()
): boolean {
  return Boolean(extrairSlugLojaDoHostname(hostname, dominioBase));
}

export function montarUrlPublicaLoja(
  slug: string,
  opcoes: {
    dominioBase?: string | null;
    origem?: string;
    protocolo?: string;
  } = {}
): string {
  const slugNormalizado = normalizarSlugLoja(slug);
  if (!slugNormalizado) return "";

  const dominio = opcoes.dominioBase === undefined
    ? obterDominioPublicoLojaConfigurado()
    : normalizarDominioPublicoLoja(opcoes.dominioBase);

  if (dominio) {
    const protocolo = normalizarProtocolo(opcoes.protocolo ?? "https:");
    return `${protocolo}//${slugNormalizado}.${dominio}`;
  }

  const origem = (opcoes.origem ?? obterOrigemAtual()).replace(/\/$/, "");
  return origem ? `${origem}/lojas/${slugNormalizado}` : `/lojas/${slugNormalizado}`;
}

export function normalizarSlugLoja(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizarDominioPublicoLoja(valor?: string | null): string | null {
  if (!valor) return null;
  const semProtocolo = valor.trim().toLowerCase().replace(/^https?:\/\//, "");
  const dominio = semProtocolo.split("/")[0]?.split(":")[0]?.replace(/\.$/, "") ?? "";
  return dominio || null;
}

function normalizarHostname(valor: string): string {
  return valor.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0]?.replace(/\.$/, "") ?? "";
}

function normalizarProtocolo(valor: string): string {
  return valor.endsWith(":") ? valor : `${valor}:`;
}

function obterHostnameAtual(): string {
  return typeof window === "undefined" ? "" : window.location.hostname;
}

function obterOrigemAtual(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}
