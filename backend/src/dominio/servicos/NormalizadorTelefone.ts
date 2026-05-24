export class NormalizadorTelefone {
  private readonly prefixosMoveisAngola = new Set(["91", "92", "93", "94", "95", "99"]);

  normalizar(valor: string): string | null {
    const apenasDigitos = valor.replace(/\D/g, "");
    const semIndicativo = this.removerIndicativoAngola(apenasDigitos);

    if (!this.ehTelefoneAngolano(semIndicativo)) {
      return null;
    }

    return semIndicativo;
  }

  ehTelefoneAngolano(valor: string | null): valor is string {
    if (!valor || !/^\d{9}$/.test(valor)) {
      return false;
    }

    const prefixo = valor.slice(0, 2);
    return this.prefixosMoveisAngola.has(prefixo);
  }

  private removerIndicativoAngola(valor: string): string {
    if (valor.startsWith("00244")) {
      return valor.slice(5);
    }

    if (valor.startsWith("244")) {
      return valor.slice(3);
    }

    return valor;
  }
}
