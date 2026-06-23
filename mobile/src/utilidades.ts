export function formatarKwanza(valor: number): string {
  if (!Number.isFinite(valor)) return "0 Kz";
  return (
    new Intl.NumberFormat("pt-AO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(valor)) + " Kz"
  );
}

export function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return (partes[0]?.[0] ?? "B").concat(partes[1]?.[0] ?? "").toUpperCase();
}

export function normalizarTextoCor(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function obterResumoComercial(codigo: string, slugLoja: string) {
  const semente = Array.from(`${codigo}${slugLoja}`).reduce(
    (total, letra) => total + letra.charCodeAt(0),
    0
  );
  return {
    avaliacoes: 18 + (semente % 220),
    rating: (4.3 + (semente % 7) / 10).toFixed(1).replace(".", ","),
    vendidos: 35 + (semente % 520),
  };
}
