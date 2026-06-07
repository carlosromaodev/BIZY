import type { CSSProperties, SVGProps } from "react";

export const NOME_PRODUTO = "Bizy";
export const WORDMARK_BIZY = "bizy";

export type CoresBizy = {
  principal: string;
  cinzaClaro: string;
  cinzaMedio: string;
  faviconBase: string;
  faviconCheck: string;
  faviconLinhas: string;
};

export type CoresBizyParciais = Partial<CoresBizy>;

export const CORES_BIZY_PADRAO: CoresBizy = {
  principal: "#0B1014",
  cinzaClaro: "#6B7178",
  cinzaMedio: "#0B1014",
  faviconBase: "#0B1014",
  faviconCheck: "#ffffff",
  faviconLinhas: "#16A07A",
};

export const CORES_LOGO_BIZY_ESCURA: CoresBizy = {
  principal: "#ffffff",
  cinzaClaro: "#E6E8EB",
  cinzaMedio: "#ffffff",
  faviconBase: "#ffffff",
  faviconCheck: "#0B1014",
  faviconLinhas: "#16A07A",
};

const FAMILIA_LOGOTIPO = "Geist, 'Plus Jakarta Sans', system-ui, sans-serif";
const LETTER_SPACING_WORDMARK = "-0.055em";

function escaparAtributo(valor: string) {
  return valor.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function resolverCoresBizy(cores: CoresBizyParciais = {}): CoresBizy {
  return { ...CORES_BIZY_PADRAO, ...cores };
}

export function criarSvgLogoBizy(cores: CoresBizyParciais = {}) {
  const paleta = resolverCoresBizy(cores);
  const principal = escaparAtributo(paleta.principal);
  const ponto = escaparAtributo(paleta.faviconLinhas);
  const fonte = escaparAtributo(FAMILIA_LOGOTIPO);

  return [
    `<svg width="168" height="56" viewBox="0 0 168 56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${NOME_PRODUTO}">`,
    `<text x="2" y="44" font-family="${fonte}" font-size="52" font-weight="700" letter-spacing="${LETTER_SPACING_WORDMARK}" fill="${principal}">${WORDMARK_BIZY}<tspan fill="${ponto}">.</tspan></text>`,
    "</svg>",
  ].join("");
}

export function criarSvgIconeBizy(cores: CoresBizyParciais = {}) {
  const paleta = resolverCoresBizy(cores);
  const base = escaparAtributo(paleta.faviconBase);
  const texto = escaparAtributo(paleta.faviconCheck);
  const ponto = escaparAtributo(paleta.faviconLinhas);
  const fonte = escaparAtributo(FAMILIA_LOGOTIPO);

  return [
    `<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${NOME_PRODUTO}">`,
    `<rect width="96" height="96" rx="22" fill="${base}"/>`,
    `<text x="17" y="67" font-family="${fonte}" font-size="52" font-weight="700" letter-spacing="${LETTER_SPACING_WORDMARK}" fill="${texto}">b<tspan fill="${ponto}">.</tspan></text>`,
    "</svg>",
  ].join("");
}

export function criarFaviconBizyDataUrl(cores: CoresBizyParciais = {}) {
  return `data:image/svg+xml,${encodeURIComponent(criarSvgIconeBizy(cores))}`;
}

export function aplicarFaviconBizy(cores: CoresBizyParciais = {}) {
  if (typeof document === "undefined") return;

  const href = criarFaviconBizyDataUrl(cores);
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.type = "image/svg+xml";
  link.href = href;
}

export function aplicarIdentidadeBizy(cores: CoresBizyParciais = {}) {
  if (typeof document === "undefined") return;

  const paleta = resolverCoresBizy(cores);
  const root = document.documentElement;

  root.style.setProperty("--brand-logo-primary", paleta.principal);
  root.style.setProperty("--brand-logo-muted", paleta.cinzaClaro);
  root.style.setProperty("--brand-logo-secondary", paleta.cinzaMedio);
  root.style.setProperty("--brand-favicon-base", paleta.faviconBase);
  root.style.setProperty("--brand-favicon-check", paleta.faviconCheck);
  root.style.setProperty("--brand-favicon-lines", paleta.faviconLinhas);

  document.title = NOME_PRODUTO;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", paleta.faviconBase);
  aplicarFaviconBizy(paleta);
}

type LogoBizyProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  variante?: "horizontal" | "icone";
  cores?: CoresBizyParciais;
  titulo?: string;
};

export function LogoBizy({
  variante = "horizontal",
  cores,
  titulo = NOME_PRODUTO,
  style,
  ...props
}: LogoBizyProps) {
  const paleta = resolverCoresBizy(cores);
  const eIcone = variante === "icone";
  const larguraPadrao = eIcone ? 32 : 96;
  const alturaPadrao = eIcone ? 32 : 32;
  const svgStyle = {
    "--brand-logo-primary": paleta.principal,
    "--brand-logo-muted": paleta.cinzaClaro,
    "--brand-logo-secondary": paleta.cinzaMedio,
    "--brand-favicon-base": paleta.faviconBase,
    "--brand-favicon-check": paleta.faviconCheck,
    "--brand-favicon-lines": paleta.faviconLinhas,
    ...style,
  } as CSSProperties;

  if (eIcone) {
    return (
      <svg
        width={larguraPadrao}
        height={alturaPadrao}
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={titulo}
        style={svgStyle}
        {...props}
      >
        <title>{titulo}</title>
        <rect width="96" height="96" rx="22" fill={paleta.faviconBase} />
        <text
          x="17"
          y="67"
          fontFamily={FAMILIA_LOGOTIPO}
          fontSize="52"
          fontWeight="700"
          letterSpacing={LETTER_SPACING_WORDMARK}
          fill={paleta.faviconCheck}
        >
          b<tspan fill={paleta.faviconLinhas}>.</tspan>
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={larguraPadrao}
      height={alturaPadrao}
      viewBox="0 0 168 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={titulo}
      style={svgStyle}
      {...props}
    >
      <title>{titulo}</title>
      <text
        x="2"
        y="44"
        fontFamily={FAMILIA_LOGOTIPO}
        fontSize="52"
        fontWeight="700"
        letterSpacing={LETTER_SPACING_WORDMARK}
        fill={paleta.principal}
      >
        {WORDMARK_BIZY}<tspan fill={paleta.faviconLinhas}>.</tspan>
      </text>
    </svg>
  );
}
