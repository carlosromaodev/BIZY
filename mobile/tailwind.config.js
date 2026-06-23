/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Bizy Market Design Tokens ──
        bizy: {
          bg: "#FAF8F4",
          "bg-alt": "#F5F3ED",
          surface: "#FFFFFF",
          paper: "#F4F1EA",
          muted: "#F0EDE6",
          media: "#ECE9DF",

          ink: "#17211C",
          "ink-2": "#46514B",
          "ink-3": "#6E7873",
          "ink-4": "#9AA39E",
          "ink-market": "#151714",
          "ink-muted": "#5F6459",

          line: "#E7E4DC",
          "line-2": "#F0EDE6",
          "line-soft": "rgba(21,23,20,0.08)",
          "line-market": "rgba(21,23,20,0.1)",

          green: "#0E8C68",
          "green-600": "#0B7A5A",
          "green-deep": "#0A5740",
          "green-ink": "#085440",
          "green-tint": "#E7F4EE",
          "green-tint2": "rgba(14,140,104,0.08)",
          "green-avatar": "#EEF8F1",

          amber: "#B8860B",
          "amber-ink": "#8A6508",
          "amber-tint": "#FDF6E3",
          "amber-warn": "#FFF8E8",
          "amber-warn-border": "rgba(180,127,38,0.2)",
          "amber-warn-text": "#744B12",

          blue: "#3D7BC0",
          "blue-ink": "#2A5788",
          "blue-tint": "#E8F0FA",

          rose: "#C9564A",
          "rose-ink": "#973E34",
          "rose-tint": "#FBEAE8",

          violet: "#7A63C9",
          "violet-ink": "#5A48A0",
          "violet-tint": "#EEEBFA",
        },
        // Variantes de cor de produto
        variante: {
          amarelo: "#D9A441",
          azul: "#3D7BC0",
          bege: "#D8BD91",
          branco: "#F8F6EF",
          castanho: "#8A5A32",
          cinza: "#7F8782",
          dourado: "#D9A441",
          esmeralda: "#2F8763",
          laranja: "#D98E2B",
          preto: "#23232B",
          rosa: "#C97A8A",
          roxo: "#7A63C9",
          verde: "#2F8763",
          vermelho: "#C9564A",
          violeta: "#7A63C9",
        },
      },
      fontWeight: {
        "bizy-bold": "850",
        "bizy-black": "900",
      },
      borderRadius: {
        "bizy-sm": "0.75rem",
        "bizy": "1rem",
        "bizy-lg": "1.25rem",
        "bizy-xl": "1.35rem",
      },
      fontSize: {
        "bizy-xs": ["0.6875rem", { lineHeight: "0.875rem" }],    // 11px
        "bizy-sm": ["0.8125rem", { lineHeight: "1.125rem" }],    // 13px
        "bizy-base": ["0.9375rem", { lineHeight: "1.375rem" }],  // 15px
        "bizy-lg": ["1.125rem", { lineHeight: "1.5rem" }],       // 18px
        "bizy-xl": ["1.375rem", { lineHeight: "1.75rem" }],      // 22px
        "bizy-2xl": ["1.75rem", { lineHeight: "2.125rem" }],     // 28px
        "bizy-price": ["1.25rem", { lineHeight: "1.625rem" }],   // 20px
      },
    },
  },
  plugins: [],
};
