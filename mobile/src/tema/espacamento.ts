export const espacamento = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const raio = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
  card: 16,
  media: 12,
} as const;

export const sombra = {
  suave: {
    shadowColor: "#17211c",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  media: {
    shadowColor: "#17211c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  forte: {
    shadowColor: "#17211c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
