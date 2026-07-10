import type { EstadoIntegracao, EstadoPeca, EstadoReserva, Peca, Reserva } from "./tipos";

export interface ConfiguracaoLocaleNegocio {
  fusoHorario?: string | null;
  locale?: string | null;
  moeda?: string | null;
}

export interface DadosSeoPreviewSocial {
  facebook?: { openGraph?: { title?: string; description?: string; image?: string | null; url?: string; type?: string } };
  navegador?: { title?: string; metaDescription?: string; canonicalPath?: string; image?: string | null };
  twitter?: { title?: string; description?: string; image?: string | null; url?: string; card?: string };
  whatsapp?: { titulo?: string; descricao?: string; imagem?: string | null; url?: string };
}

export interface DadosSeo {
  titulo?: string;
  descricao?: string;
  imagem?: string | null;
  canonicalPath?: string;
  previewSocial?: DadosSeoPreviewSocial | null;
}

export interface SeoPublicoInput {
  titulo: string;
  descricao: string;
  canonicalPath?: string;
  imagem?: string | null;
  tipo?: string;
}

export function montarSeoPublico({
  titulo,
  descricao,
  canonicalPath,
  imagem,
  tipo = "website"
}: SeoPublicoInput): DadosSeo {
  const seo: DadosSeo = { titulo, descricao, canonicalPath, imagem };
  seo.previewSocial = {
    facebook: {
      openGraph: {
        title: titulo,
        description: descricao,
        image: imagem,
        url: canonicalPath,
        type: tipo
      }
    },
    navegador: {
      title: titulo,
      metaDescription: descricao,
      canonicalPath,
      image: imagem
    },
    twitter: {
      title: titulo,
      description: descricao,
      image: imagem,
      url: canonicalPath,
      card: imagem ? "summary_large_image" : "summary"
    },
    whatsapp: {
      titulo,
      descricao,
      imagem,
      url: canonicalPath
    }
  };
  return seo;
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
  if (typeof document === "undefined") return () => undefined;

  const criadas: HTMLElement[] = [];
  const restauradores: Array<() => void> = [];
  const tituloAnterior = document.title || "Bizy";

  function guardarAtributo(el: Element, atributo: string) {
    const existia = el.hasAttribute(atributo);
    const valorAnterior = el.getAttribute(atributo);
    restauradores.push(() => {
      if (existia && valorAnterior !== null) {
        el.setAttribute(atributo, valorAnterior);
      } else {
        el.removeAttribute(atributo);
      }
    });
  }

  function upsertMeta(attr: string, valor: string, conteudo: string) {
    let el = document.querySelector(`meta[${attr}="${valor}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, valor);
      document.head.appendChild(el);
      criadas.push(el);
    } else {
      guardarAtributo(el, "content");
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
    } else {
      guardarAtributo(el, "href");
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

  const preview = seo.previewSocial;
  const og = preview?.facebook?.openGraph;
  const titulo = preview?.navegador?.title ?? seo.titulo;
  const descricao = preview?.navegador?.metaDescription ?? seo.descricao;
  const canonicalPath = preview?.navegador?.canonicalPath ?? seo.canonicalPath;
  const canonicalUrl = resolverUrlPublica(canonicalPath);
  if (canonicalUrl) {
    upsertCanonical(canonicalUrl);
    upsertMeta("name", "twitter:url", canonicalUrl);
  }

  if (titulo) document.title = titulo;
  if (descricao) upsertMeta("name", "description", descricao);

  const imagem = preview?.navegador?.image ?? preview?.twitter?.image ?? preview?.whatsapp?.imagem ?? seo.imagem ?? og?.image ?? null;
  const imagemUrl = resolverUrlPublica(imagem);

  upsertMeta("property", "og:site_name", "Bizy");
  upsertMeta("property", "og:type", og?.type ?? "website");
  if (og?.title ?? preview?.whatsapp?.titulo ?? titulo) upsertMeta("property", "og:title", og?.title ?? preview?.whatsapp?.titulo ?? titulo ?? "");
  if (og?.description ?? preview?.whatsapp?.descricao ?? descricao) upsertMeta("property", "og:description", og?.description ?? preview?.whatsapp?.descricao ?? descricao ?? "");
  const ogImage = resolverUrlPublica(og?.image ?? imagemUrl);
  if (ogImage) upsertMeta("property", "og:image", ogImage);
  const ogUrl = resolverUrlPublica(og?.url ?? preview?.whatsapp?.url ?? canonicalPath);
  if (ogUrl) upsertMeta("property", "og:url", ogUrl);

  if (preview?.twitter?.title ?? titulo) upsertMeta("name", "twitter:title", preview?.twitter?.title ?? titulo ?? "");
  if (preview?.twitter?.description ?? descricao) upsertMeta("name", "twitter:description", preview?.twitter?.description ?? descricao ?? "");
  if (imagemUrl) upsertMeta("name", "twitter:image", imagemUrl);
  const twitterUrl = resolverUrlPublica(preview?.twitter?.url ?? canonicalPath);
  if (twitterUrl) upsertMeta("name", "twitter:url", twitterUrl);
  upsertMeta("name", "twitter:card", preview?.twitter?.card ?? (imagemUrl ? "summary_large_image" : "summary"));

  return () => {
    for (const el of criadas) el.remove();
    for (const restaurar of restauradores.reverse()) restaurar();
    document.title = tituloAnterior;
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
