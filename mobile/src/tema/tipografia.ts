import { Platform, TextStyle } from "react-native";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const tipografia = {
  display: {
    fontFamily,
    fontSize: 28,
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  titulo: {
    fontFamily,
    fontSize: 22,
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  subtitulo: {
    fontFamily,
    fontSize: 18,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  corpo: {
    fontFamily,
    fontSize: 15,
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: 22,
  },
  corpoForte: {
    fontFamily,
    fontSize: 15,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: 22,
  },
  legenda: {
    fontFamily,
    fontSize: 13,
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: 18,
  },
  legendaForte: {
    fontFamily,
    fontSize: 13,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: 18,
  },
  micro: {
    fontFamily,
    fontSize: 11,
    fontWeight: "500" as TextStyle["fontWeight"],
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  preco: {
    fontFamily,
    fontSize: 20,
    fontWeight: "700" as TextStyle["fontWeight"],
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  precoAntigo: {
    fontFamily,
    fontSize: 14,
    fontWeight: "400" as TextStyle["fontWeight"],
    lineHeight: 18,
    textDecorationLine: "line-through" as TextStyle["textDecorationLine"],
  },
} as const;
