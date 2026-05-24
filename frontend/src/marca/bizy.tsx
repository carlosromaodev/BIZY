import type { CSSProperties, SVGProps } from "react";

export const NOME_PRODUTO = "Bizy";

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
  principal: "#166534",
  cinzaClaro: "#86EFAC",
  cinzaMedio: "#052E16",
  faviconBase: "#166534",
  faviconCheck: "#ffffff",
  faviconLinhas: "#D8FF72",
};

const CAMINHOS_LOGO = [
  {
    d: "M51.3912 74.919C51.3672 67.2768 50.5479 59.0143 56.4426 53.0829C61.6846 47.8083 69.2003 48.1889 75.9888 48.1998L86.787 48.2256L111.894 48.234C117.583 48.2207 123.485 47.9608 129.141 48.3568C163.396 50.7548 179.987 85.2684 160.589 113.544C159.573 115.026 158.63 116.447 157.458 117.842C155.155 121.359 147.549 128.176 143.898 131.163C126.369 145.503 103.593 155.326 81.3019 159.067C73.1985 160.428 59.564 160.505 51.3644 159.696C51.1118 153.328 51.2296 146.521 51.2208 140.111L51.2163 108.714L51.2525 88.1906C51.2478 84.1798 51.1261 78.8481 51.3912 74.919Z",
    cor: "principal",
  },
  {
    d: "M53.5428 145.268C51.8266 148.464 50.3138 155.867 49 159.398C57.1995 160.207 70.8965 160.86 79 159.5C101.291 155.758 124.97 146.84 142.5 132.5C146.404 129.306 154.197 122.517 156.5 119C155.246 117.697 149.69 114.777 147.866 114.056C115.238 101.158 70.6378 113.428 53.5428 145.268Z",
    cor: "cinzaClaro",
  },
  {
    d: "M163.133 121.599C163.642 121.676 166.174 124.35 166.688 124.826C172.954 130.63 178.461 139.619 180.547 147.883C183.55 159.977 181.656 172.767 175.279 183.472C168.659 194.521 156.525 202.842 144.077 205.752C134.434 208.005 125.803 207.638 116.007 207.671L91.4211 207.752L76.4526 207.742C65.395 207.716 55.2724 207.77 51.7369 194.844C50.4813 190.254 51.3066 185.843 50.8134 181.22C50.7504 180.629 50.4462 180.497 50.0112 180.259C33.1864 173.699 28.0808 168.309 17.2209 154.631C19.9043 156.227 22.6644 158.668 25.4982 160.261C35.232 165.723 45.4944 168.383 56.576 169.58C82.1239 172.351 107.761 163.912 129.667 151.251C135.507 147.876 141.831 142.275 147.069 137.998C150.311 135.351 153.626 131.628 156.609 128.617C158.892 126.313 160.527 123.758 163.133 121.599Z",
    cor: "cinzaMedio",
  },
  {
    d: "M409.77 111.425C412.817 111.109 423.284 111.161 426.137 111.792C424.152 118.396 422.109 122.233 419.766 128.332L407.921 159.784C406.677 163.205 405.184 166.646 403.836 170.038C400.166 179.263 396.392 190.806 386.488 195.03C382.272 196.829 378.013 197.03 373.527 196.335C371.726 196.051 366.945 195.276 365.81 193.809C365.604 192.382 369.039 183.743 369.741 181.521L370.074 181.453C372.659 182.764 376.767 183.044 379.476 182.028C383.013 180.702 384.9 176.413 386.303 173.21C384.329 169.589 382.684 165.506 381.164 161.671C374.553 144.976 367.609 128.251 361.075 111.544L364.394 111.34C368.561 111.217 374.188 111.159 378.314 111.379C382.732 121.609 385.997 132.245 390.068 142.609C391.641 146.615 393.451 150.611 394.436 154.804C395.988 150.716 396.981 146.789 398.412 142.759L409.77 111.425Z",
    cor: "principal",
  },
  {
    d: "M321.791 111.352C329.268 111.255 336.747 111.216 344.225 111.236C347.282 111.247 352.755 111.125 355.569 111.536C357.479 113.384 358.254 118.216 357.017 120.419C354.704 124.53 351.199 128.437 348.265 132.173C343.609 138.148 338.987 144.149 334.399 150.175C332.224 153.053 329.376 156.598 327.46 159.542C333.042 159.391 338.729 159.507 344.321 159.507C349.072 159.508 353.918 159.398 358.655 159.528C358.648 162.48 358.889 170.796 358.358 173.194C355.626 173.768 347.748 173.507 344.579 173.475C336.552 173.502 328.522 173.487 320.495 173.429C318.923 173.412 307.939 173.603 307.056 172.553C306.068 171.379 306.562 165.179 306.632 163.151C308.274 160.448 309.962 158.512 311.811 156.01C314.858 151.88 317.931 147.911 321.132 143.901C326.071 137.714 330.752 131.298 335.734 125.145C333.183 125.332 327.917 125.084 325.113 125.059L306.985 125.006C306.89 120.648 306.933 116.023 306.972 111.671C309.369 111.202 318.936 111.361 321.791 111.352Z",
    cor: "principal",
  },
  {
    d: "M282.997 111.293C285.358 111.293 295.098 110.901 296.421 111.877C296.697 112.815 296.831 114.177 296.833 115.169C296.856 125.424 296.815 135.712 296.819 145.964C296.883 152.474 296.869 158.984 296.774 165.493C296.754 167.729 297.225 170.64 296.559 172.638C295.934 173.294 296.081 173.101 295.041 173.309C290.831 173.386 284.977 173.455 280.826 173.182C280.437 167.673 280.432 113.578 281.196 112.195C281.508 111.629 282.428 111.447 282.997 111.293Z",
    cor: "principal",
  },
  {
    d: "M286.167 85.1125C291.312 83.7323 296.609 86.7462 298.052 91.874C299.493 97.0016 296.543 102.336 291.434 103.84C288.074 104.83 284.44 103.935 281.923 101.499C279.404 99.0629 278.391 95.4607 279.27 92.0691C280.149 88.6777 282.782 86.0203 286.167 85.1125Z",
    cor: "principal",
  },
  {
    d: "M238.068 105.5C241.925 105.5 245.513 105.822 248.831 106.468C252.162 107.052 255.049 108.061 257.482 109.505C259.987 110.955 261.938 112.873 263.322 115.258C264.715 117.657 265.397 120.599 265.397 124.057C265.397 127.274 264.648 130.062 263.126 132.397L263.125 132.396C261.854 134.43 260.126 136.101 257.952 137.412C261.354 138.769 263.941 140.681 265.673 143.172C267.57 145.9 268.5 149.337 268.5 153.446C268.5 160.427 266.074 165.745 261.177 169.313L261.173 169.316C256.302 172.799 248.907 174.5 239.072 174.5C235.717 174.5 232.331 174.371 228.915 174.114V174.115C225.482 173.922 222.465 173.469 219.867 172.753L219.5 172.652V107.22L219.906 107.142C221.253 106.884 222.688 106.659 224.214 106.466C225.747 106.208 227.31 106.015 228.902 105.886C230.49 105.757 232.049 105.661 233.576 105.597H233.577C235.165 105.532 236.662 105.5 238.068 105.5ZM231.815 163.074C232.953 163.18 234.163 163.263 235.444 163.319C236.898 163.383 238.229 163.415 239.438 163.415C241.788 163.415 243.951 163.257 245.929 162.941L245.931 162.94C247.958 162.627 249.667 162.096 251.067 161.359C252.517 160.565 253.635 159.534 254.437 158.27L254.441 158.263L254.445 158.256C255.287 157.016 255.728 155.393 255.729 153.351C255.729 149.699 254.475 147.27 252.059 145.91C249.547 144.497 246.025 143.766 241.445 143.766H231.815V163.074ZM239.528 116.393C237.77 116.393 236.196 116.424 234.807 116.487C233.673 116.542 232.677 116.621 231.815 116.721V133.257H239.438C243.778 133.257 247.126 132.621 249.521 131.392C251.812 130.152 252.99 127.978 252.99 124.729C252.99 123.196 252.678 121.918 252.076 120.872C251.476 119.829 250.571 118.988 249.338 118.354L248.863 118.117C246.464 116.978 243.361 116.393 239.528 116.393Z",
    cor: "principal",
    stroke: true,
  },
] as const;

const CAMINHOS_FAVICON = [
  {
    d: "M34.1702 26.781C34.1462 19.1388 33.327 10.8763 39.2217 4.9449C44.4636 -0.329704 51.9794 0.0509224 58.7679 0.0617974L69.5661 0.0876252L94.6726 0.0960086C100.362 0.0826414 106.264 -0.177228 111.92 0.218804C146.175 2.61674 162.766 37.1304 143.368 65.4063C142.352 66.8875 141.409 68.309 140.237 69.7039C137.934 73.2209 130.328 80.0384 126.677 83.0249C109.148 97.3647 86.3723 107.188 64.081 110.929C55.9775 112.29 42.343 112.367 34.1435 111.558C33.8909 105.19 34.0087 98.3829 33.9998 91.9732L33.9953 60.5762L34.0316 40.0526C34.0268 36.0417 33.9051 30.71 34.1702 26.781Z",
    cor: "faviconBase",
  },
  {
    d: "M36.3219 97.1295C34.6056 100.326 33.0929 107.729 31.7791 111.26C39.9786 112.069 53.6756 112.722 61.7791 111.362C84.0703 107.62 107.749 98.7018 125.279 84.362C129.183 81.1683 136.977 74.3789 139.279 70.862C138.025 69.5592 132.469 66.6394 130.645 65.9183C98.0175 53.0196 53.4169 65.2896 36.3219 97.1295Z",
    cor: "faviconCheck",
  },
  {
    d: "M145.912 73.4615C146.421 73.538 148.953 76.2119 149.467 76.6879C155.733 82.4925 161.24 91.4811 163.326 99.7448C166.329 111.839 164.435 124.629 158.058 135.334C151.438 146.383 139.304 154.704 126.856 157.614C117.213 159.867 108.582 159.5 98.7858 159.533L74.2002 159.614L59.2316 159.604C48.174 159.578 38.0514 159.632 34.5159 146.706C33.2603 142.116 34.0857 137.705 33.5925 133.082C33.5295 132.491 33.2252 132.359 32.7902 132.121C15.9654 125.561 10.8599 120.171 0 106.493C2.68334 108.089 5.44343 110.53 8.27728 112.123C18.0111 117.585 28.2735 120.245 39.3551 121.442C64.9029 124.213 90.5396 115.774 112.446 103.113C118.286 99.7377 124.61 94.1366 129.848 89.8601C133.091 87.2129 136.405 83.49 139.389 80.4786C141.671 78.1749 143.306 75.6204 145.912 73.4615Z",
    cor: "faviconLinhas",
  },
] as const;

function escaparAtributo(valor: string) {
  return valor.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function resolverCoresBizy(cores: CoresBizyParciais = {}): CoresBizy {
  return { ...CORES_BIZY_PADRAO, ...cores };
}

export function criarSvgLogoBizy(cores: CoresBizyParciais = {}) {
  const paleta = resolverCoresBizy(cores);
  const paths = CAMINHOS_LOGO.map((path) => {
    const fill = escaparAtributo(paleta[path.cor]);
    const stroke = "stroke" in path && path.stroke ? ` stroke="${fill}"` : "";
    return `<path d="${path.d}" fill="${fill}"${stroke}/>`;
  }).join("");

  return `<svg width="438" height="232" viewBox="0 0 438 232" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${NOME_PRODUTO}">${paths}</svg>`;
}

export function criarSvgIconeBizy(cores: CoresBizyParciais = {}) {
  const paleta = resolverCoresBizy(cores);
  const paths = CAMINHOS_FAVICON.map((path) => {
    const fill = escaparAtributo(paleta[path.cor]);
    return `<path d="${path.d}" fill="${fill}"/>`;
  }).join("");

  return `<svg width="165" height="160" viewBox="0 0 165 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${NOME_PRODUTO}">${paths}</svg>`;
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
  const larguraPadrao = eIcone ? 32 : 104;
  const alturaPadrao = eIcone ? 31 : 55;
  const paths = eIcone ? CAMINHOS_FAVICON : CAMINHOS_LOGO;
  const svgStyle = {
    "--brand-logo-primary": paleta.principal,
    "--brand-logo-muted": paleta.cinzaClaro,
    "--brand-logo-secondary": paleta.cinzaMedio,
    "--brand-favicon-base": paleta.faviconBase,
    "--brand-favicon-check": paleta.faviconCheck,
    "--brand-favicon-lines": paleta.faviconLinhas,
    ...style,
  } as CSSProperties;

  return (
    <svg
      width={larguraPadrao}
      height={alturaPadrao}
      viewBox={eIcone ? "0 0 165 160" : "0 0 438 232"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={titulo}
      style={svgStyle}
      {...props}
    >
      <title>{titulo}</title>
      {paths.map((path) => {
        const fill = eIcone
          ? paleta[path.cor as keyof CoresBizy]
          : paleta[path.cor as keyof CoresBizy];

        return (
          <path
            key={path.d}
            d={path.d}
            fill={fill}
            stroke={"stroke" in path && path.stroke ? fill : undefined}
          />
        );
      })}
    </svg>
  );
}
