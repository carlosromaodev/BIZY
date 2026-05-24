export function normalizarTelefone(valor?: string | null): { local: string; canonico: string } | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (!digitos) return null;

  if (digitos.length === 12 && digitos.startsWith("244")) {
    return { local: digitos.slice(3), canonico: digitos };
  }

  if (digitos.length === 10 && digitos.startsWith("0")) {
    const local = digitos.slice(1);
    return { local, canonico: local.length === 9 && local.startsWith("9") ? `244${local}` : local };
  }

  if (digitos.length === 9 && digitos.startsWith("9")) {
    return { local: digitos, canonico: `244${digitos}` };
  }

  return { local: digitos, canonico: digitos };
}

export function normalizarEmail(valor?: string | null): string | null {
  const email = (valor ?? "").trim().toLowerCase();
  return email || null;
}
