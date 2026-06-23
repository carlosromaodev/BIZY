export const cores = {
  // ── Fundo & Superfície ──
  fundo: "#faf8f4",
  fundoSecundario: "#f5f3ed",
  superficie: "#ffffff",
  superficieMutada: "#f0ede6",
  borda: "#e7e4dc",
  bordaSutil: "rgba(21,23,20,0.08)",

  // ── Texto ──
  texto: "#17211c",
  textoSecundario: "#6b7066",
  textoTerciario: "#9a9d96",
  textoInvertido: "#ffffff",

  // ── Verde (Primária / Marca) ──
  verde: "#0e8c68",
  verdeFundo: "#e8f5ef",
  verdeTinta: "#f0f9f4",
  verdeTinta2: "rgba(14,140,104,0.08)",
  verdeEscuro: "#0a5740",
  verdeInk: "#1a5c42",

  // ── Amber (Alerta / Pendente) ──
  amber: "#b8860b",
  amberFundo: "#fef8e7",
  amberTinta: "#fdf6e3",
  amberInk: "#8a6508",

  // ── Azul (Info / Progresso) ──
  azul: "#3d7bc0",
  azulFundo: "#edf4fc",
  azulTinta: "#e8f0fa",
  azulInk: "#2a5788",

  // ── Rosa (Urgente / Destrutivo) ──
  rosa: "#c9564a",
  rosaFundo: "#fdf0ef",
  rosaTinta: "#fbeae8",
  rosaInk: "#973e34",

  // ── Violeta (VIP / Especial) ──
  violeta: "#7a63c9",
  violetaFundo: "#f3f0fc",
  violetaTinta: "#eeebfa",
  violetaInk: "#5a48a0",

  // ── Produto / Media ──
  fundoMedia: "#ece9df",
  fundoMediaClaro: "#f2f0e8",

  // ── Cores de variantes de produto ──
  varianteAmarelo: "#d9a441",
  varianteAzul: "#3d7bc0",
  varianteBege: "#d8bd91",
  varianteBranco: "#f8f6ef",
  varianteCastanho: "#8a5a32",
  varianteCinza: "#7f8782",
  varianteDourado: "#d9a441",
  varianteEsmeralda: "#2f8763",
  varianteLaranja: "#d98e2b",
  variantePreto: "#23232b",
  varianteRosa: "#c97a8a",
  varianteRoxo: "#7a63c9",
  varianteVerde: "#2f8763",
  varianteVermelho: "#c9564a",
  varianteVioleta: "#7a63c9",
} as const;

export const CORES_VARIANTES: Record<string, string> = {
  amarelo: cores.varianteAmarelo,
  azul: cores.varianteAzul,
  bege: cores.varianteBege,
  branco: cores.varianteBranco,
  castanho: cores.varianteCastanho,
  cinza: cores.varianteCinza,
  dourado: cores.varianteDourado,
  esmeralda: cores.varianteEsmeralda,
  laranja: cores.varianteLaranja,
  preto: cores.variantePreto,
  rosa: cores.varianteRosa,
  roxo: cores.varianteRoxo,
  verde: cores.varianteVerde,
  vermelho: cores.varianteVermelho,
  violeta: cores.varianteVioleta,
};

export type CorSemantica = "green" | "amber" | "blue" | "rose" | "violet" | "mute";

export function obterCorSemantica(cor: CorSemantica) {
  const mapa = {
    green: { fundo: cores.verdeTinta, texto: cores.verde, ink: cores.verdeInk },
    amber: { fundo: cores.amberTinta, texto: cores.amber, ink: cores.amberInk },
    blue: { fundo: cores.azulTinta, texto: cores.azul, ink: cores.azulInk },
    rose: { fundo: cores.rosaTinta, texto: cores.rosa, ink: cores.rosaInk },
    violet: { fundo: cores.violetaTinta, texto: cores.violeta, ink: cores.violetaInk },
    mute: { fundo: cores.superficieMutada, texto: cores.textoSecundario, ink: cores.textoTerciario },
  };
  return mapa[cor];
}
