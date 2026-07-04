import type { EstadoIntegracao, EstadoPeca, EstadoReserva, Peca, Reserva } from "./tipos";

export interface ConfiguracaoLocaleNegocio {
  fusoHorario?: string | null;
  locale?: string | null;
  moeda?: string | null;
}

export interface DadosSeo {
  titulo?: string;
  descricao?: string;
  imagem?: string | null;
  canonicalPath?: string;
  previewSocial?: {
    facebook?: { openGraph?: { title?: string; description?: string; image?: string | null; url?: string; type?: string } };
    navegador?: { title?: string; metaDescription?: string; canonicalPath?: string; image?: string | null };
    whatsapp?: { titulo?: string; descricao?: string; imagem?: string | null; url?: string };
  };
}

const CONFIGURACAO_LOCALE_PADRAO = {
  fusoHorario: "Africa/Luanda",
  locale: "pt-AO",
  moeda: "AOA"
};

let configuracaoLocaleNegocio = { ...CONFIGURACAO_LOCALE_PADRAO };

const LOCALE_POR_MOEDA: Record<string, string> = {
  AOA: "pt-AO",
  BRL: "pt-BR",
  CVE: "pt-CV",
  EUR: "pt-PT",
  MZN: "pt-MZ",
  USD: "en-US",
  ZAR: "en-ZA"
};

export function configurarLocaleNegocio(configuracao?: ConfiguracaoLocaleNegocio | null): void {
  const moeda = normalizarMoeda(configuracao?.moeda) ?? CONFIGURACAO_LOCALE_PADRAO.moeda;
  configuracaoLocaleNegocio = {
    moeda,
    fusoHorario: normalizarFusoHorario(configuracao?.fusoHorario) ?? CONFIGURACAO_LOCALE_PADRAO.fusoHorario,
    locale: normalizarLocale(configuracao?.locale) ?? LOCALE_POR_MOEDA[moeda] ?? CONFIGURACAO_LOCALE_PADRAO.locale
  };
}

export function obterConfiguracaoLocaleNegocio() {
  return { ...configuracaoLocaleNegocio };
}

function normalizarLocale(locale?: string | null): string | null {
  const valor = locale?.trim();
  if (!valor) return null;
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([valor]).length ? valor : null;
  } catch {
    return null;
  }
}

function normalizarMoeda(moeda?: string | null): string | null {
  const valor = moeda?.trim().toUpperCase();
  if (!valor || !/^[A-Z]{3}$/.test(valor)) return null;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: valor }).format(1);
    return valor;
  } catch {
    return null;
  }
}

function normalizarFusoHorario(fusoHorario?: string | null): string | null {
  const valor = fusoHorario?.trim();
  if (!valor) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: valor }).format(new Date());
    return valor;
  } catch {
    return null;
  }
}

export function aplicarSeoMetaTags(seo: DadosSeo | null | undefined): () => void {
  if (!seo) return () => undefined;

  const criadas: HTMLElement[] = [];

  function upsertMeta(attr: string, valor: string, conteudo: string) {
    let el = document.querySelector(`meta[${attr}="${valor}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, valor);
      document.head.appendChild(el);
      criadas.push(el);
    }
    el.setAttribute("content", conteudo);
  }

  function upsertCanonical(href: string) {
    let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
      criadas.push(el);
    }
    el.setAttribute("href", href);
  }

  function resolverUrlPublica(valor?: string | null): string | undefined {
    if (!valor) return undefined;
    if (typeof window === "undefined") return valor;

    try {
      return new URL(valor, window.location.origin).toString();
    } catch {
      return valor;
    }
  }

  const canonicalPath = seo.previewSocial?.navegador?.canonicalPath ?? seo.canonicalPath;
  const canonicalUrl = resolverUrlPublica(canonicalPath);
  if (canonicalUrl) {
    upsertCanonical(canonicalUrl);
    upsertMeta("name", "twitter:url", canonicalUrl);
  }

  if (seo.titulo) document.title = seo.titulo;
  if (seo.descricao) upsertMeta("name", "description", seo.descricao);

  const og = seo.previewSocial?.facebook?.openGraph;
  if (og?.title) upsertMeta("property", "og:title", og.title);
  if (og?.description) upsertMeta("property", "og:description", og.description);
  if (og?.image) upsertMeta("property", "og:image", og.image);
  const ogUrl = resolverUrlPublica(og?.url ?? canonicalPath);
  if (ogUrl) upsertMeta("property", "og:url", ogUrl);
  if (og?.type) upsertMeta("property", "og:type", og.type);

  if (!og) {
    if (seo.titulo) upsertMeta("property", "og:title", seo.titulo);
    if (seo.descricao) upsertMeta("property", "og:description", seo.descricao);
    if (seo.imagem) upsertMeta("property", "og:image", seo.imagem);
  }

  if (seo.titulo) upsertMeta("name", "twitter:title", seo.titulo);
  if (seo.descricao) upsertMeta("name", "twitter:description", seo.descricao);
  if (seo.imagem) upsertMeta("name", "twitter:image", seo.imagem);
  upsertMeta("name", "twitter:card", seo.imagem ? "summary_large_image" : "summary");

  return () => {
    for (const el of criadas) el.remove();
    document.title = "Bizy";
  };
}

export function formatarKwanza(valor: number): string {
  return new Intl.NumberFormat(configuracaoLocaleNegocio.locale, {
    style: "currency",
    currency: configuracaoLocaleNegocio.moeda,
    maximumFractionDigits: 0
  }).format(valor);
}

export function pluralizar(quantidade: number, singular: string, plural = `${singular}s`): string {
  return quantidade === 1 ? singular : plural;
}

export function formatarTempoRestante(data: string | null): string {
  if (!data) return "Sem prazo";
  const milissegundos = new Date(data).getTime() - Date.now();
  if (Number.isNaN(milissegundos)) return "Prazo inválido";
  if (milissegundos <= 0) return "Expirada";
  const minutos = Math.ceil(milissegundos / 60_000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
}

export function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat(configuracaoLocaleNegocio.locale, {
    day: "2-digit",
    month: "short",
    timeZone: configuracaoLocaleNegocio.fusoHorario
  }).format(data);
}

export function formatarDataHoraCurta(data: string): string {
  const dataFormatada = new Date(data);
  if (Number.isNaN(dataFormatada.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat(configuracaoLocaleNegocio.locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: configuracaoLocaleNegocio.fusoHorario
  }).format(dataFormatada);
}

export function formatarConfianca(valor?: number): string {
  if (typeof valor !== "number") return "Sem leitura";
  return `${Math.round(valor * 100)}% confiança`;
}

export function obterIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function obterPrecoDaPeca(pecas: Peca[], codigoPeca: string): number {
  return pecas.find((peca) => peca.codigo === codigoPeca)?.precoEmKwanza ?? 0;
}

export function traduzirEstadoPeca(estado: EstadoPeca): string {
  const traducoes: Record<EstadoPeca, string> = {
    DISPONIVEL: "Disponível",
    RESERVADA: "Reservada",
    VENDIDA: "Vendida",
    ESGOTADA: "Esgotada"
  };
  return traducoes[estado];
}

export function traduzirEstadoReserva(estado: EstadoReserva): string {
  const traducoes: Record<EstadoReserva, string> = {
    PENDING: "Pendente",
    RESERVED: "Reservada",
    WAITING_PAYMENT: "Aguardando",
    PAID: "Paga",
    EXPIRED: "Expirada",
    CANCELLED: "Cancelada",
    WAITLISTED: "Fila"
  };
  return traducoes[estado];
}

export function traduzirEstadoPagamentoCurto(estado: Reserva["estadoPagamento"]): string {
  const traducoes: Record<Reserva["estadoPagamento"], string> = {
    AGUARDANDO_COMPROVATIVO: "Aguardando",
    COMPROVATIVO_RECEBIDO: "Recebido",
    CONFIRMADO: "Confirmado",
    REJEITADO: "Rejeitado"
  };
  return traducoes[estado];
}

export function traduzirEstadoIntegracao(estado: EstadoIntegracao): string {
  const traducoes: Record<EstadoIntegracao, string> = {
    CONFIGURADA: "Configurada",
    DESATIVADA: "Desativada",
    PENDENTE: "Pendente"
  };
  return traducoes[estado];
}

export function traduzirEstadoComentario(estado: string): string {
  const traducoes: Record<string, string> = {
    RECEBIDO: "Recebido",
    PROCESSADO: "Processado",
    REVISAO_MANUAL: "Revisão",
    IGNORADO: "Ignorado"
  };
  return traducoes[estado] ?? estado;
}
