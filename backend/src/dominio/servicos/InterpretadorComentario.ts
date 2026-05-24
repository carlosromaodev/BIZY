import type { ResultadoInterpretacaoComentario } from "../tipos.js";
import { ResultadoInterpretacaoComentarioSchema } from "../esquemas.js";
import { NormalizadorTelefone } from "./NormalizadorTelefone.js";

interface TrechoEncontrado {
  inicio: number;
  fim: number;
  valor: string;
}

export class InterpretadorComentario {
  private readonly normalizadorTelefone = new NormalizadorTelefone();

  private readonly padroesIntencaoCompra = [
    /\beu\s+quero\b/,
    /\beu\s+queri\b/,
    /\beu\s+qro\b/,
    /\bquero\b/,
    /\bqro\b/,
    /\bqr\b/,
    /\bmeu\b/,
    /\be\s+meu\b/,
    /\beh\s+meu\b/,
    /\bpega\b/,
    /\breserva\b/,
    /\bguarda\b/,
    /\bfica\s+pra\s+mim\b/,
    /\bfica\s+para\s+mim\b/
  ];

  interpretar(textoOriginal: string): ResultadoInterpretacaoComentario {
    const texto = this.normalizarTexto(textoOriginal);
    const motivos: string[] = [];
    const temIntencaoCompra = this.padroesIntencaoCompra.some((padrao) => padrao.test(texto));
    const telefoneEncontrado = this.extrairTelefone(texto);
    const telefone = telefoneEncontrado ? this.normalizadorTelefone.normalizar(telefoneEncontrado.valor) : null;
    const pecasComRotulo = this.extrairCodigosPecaRotulados(texto);
    const pecasLivres = pecasComRotulo.length ? [] : this.extrairCodigosPecaLivres(texto, telefoneEncontrado);
    const codigosPeca = this.removerDuplicados([...pecasComRotulo, ...pecasLivres].map((peca) => peca.valor));
    const codigoPeca = codigosPeca[0] ?? null;
    const formatoDiretoTelefoneCodigo = this.temFormatoDiretoTelefoneCodigo(texto, telefoneEncontrado, codigoPeca);
    const temCompraOperacional = temIntencaoCompra || formatoDiretoTelefoneCodigo;

    if (!temCompraOperacional) {
      motivos.push("Intenção de compra não identificada.");
    }

    if (!telefone) {
      motivos.push("Telefone angolano ausente ou inválido.");
    }

    if (!codigoPeca) {
      motivos.push("Código da peça ausente.");
    }

    const intent = temCompraOperacional || telefone !== null ? "BUY" : "NONE";
    const confidence = this.calcularConfianca({
      temIntencaoCompra: temCompraOperacional,
      telefoneValido: telefone !== null,
      codigoPecaEncontrado: codigoPeca !== null,
      codigoComRotulo: pecasComRotulo.length > 0,
      comentarioCurto: texto.split(/\s+/).length <= 3,
      formatoDiretoTelefoneCodigo
    });

    const requiresManualReview =
      intent !== "BUY" || !temCompraOperacional || telefone === null || codigoPeca === null || confidence < 0.75;

    return ResultadoInterpretacaoComentarioSchema.parse({
      intent,
      phone: telefone,
      productCode: codigoPeca,
      productCodes: codigosPeca,
      confidence,
      requiresManualReview,
      reasons: motivos
    });
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s#+.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extrairTelefone(texto: string): TrechoEncontrado | null {
    const padraoTelefone = /(?<![a-z0-9])(?:(?:\+?244|00244)[\s.-]*)?9(?:1|2|3|4|5|9)(?:[\s.-]*\d){7}/g;
    const encontrado = padraoTelefone.exec(texto);

    if (!encontrado) {
      return null;
    }

    return {
      inicio: encontrado.index,
      fim: encontrado.index + encontrado[0].length,
      valor: encontrado[0]
    };
  }

  private extrairCodigosPecaRotulados(texto: string): TrechoEncontrado[] {
    const padraoRotulado = /(?:\b(?:peca|produto|item)\s*#?\s*([a-z0-9][a-z0-9_-]{0,31})\b)|(?:#\s*([a-z0-9][a-z0-9_-]{0,31})\b)/g;
    const resultados: TrechoEncontrado[] = [];
    let encontrado: RegExpExecArray | null;

    while ((encontrado = padraoRotulado.exec(texto)) !== null) {
      const valor = encontrado[1] ?? encontrado[2];
      if (!valor) continue;

      resultados.push({
        inicio: encontrado.index,
        fim: encontrado.index + encontrado[0].length,
        valor: this.normalizarCodigoPeca(valor)
      });
    }

    return resultados;
  }

  private extrairCodigosPecaLivres(texto: string, telefone: TrechoEncontrado | null): TrechoEncontrado[] {
    const padraoNumero = /\b[a-z]?\d{1,6}\b/g;
    const candidatos: TrechoEncontrado[] = [];
    let encontrado: RegExpExecArray | null;

    while ((encontrado = padraoNumero.exec(texto)) !== null) {
      const inicio = encontrado.index;
      const fim = inicio + encontrado[0].length;

      if (telefone && this.trechosSobrepostos({ inicio, fim, valor: encontrado[0] }, telefone)) {
        continue;
      }

      if (encontrado[0] === "244") {
        continue;
      }

      candidatos.push({ inicio, fim, valor: this.normalizarCodigoPeca(encontrado[0]) });
    }

    return candidatos.length > 1 ? candidatos : candidatos.at(-1) ? [candidatos.at(-1)!] : [];
  }

  private trechosSobrepostos(primeiro: TrechoEncontrado, segundo: TrechoEncontrado): boolean {
    return primeiro.inicio < segundo.fim && segundo.inicio < primeiro.fim;
  }

  private normalizarCodigoPeca(codigo: string): string {
    return codigo.trim().toUpperCase();
  }

  private removerDuplicados(codigos: string[]): string[] {
    return [...new Set(codigos.filter((codigo) => codigo.length > 0))];
  }

  private temFormatoDiretoTelefoneCodigo(
    texto: string,
    telefone: TrechoEncontrado | null,
    codigoPeca: string | null
  ): boolean {
    if (!telefone || !codigoPeca) return false;

    const antesTelefone = texto.slice(0, telefone.inicio).trim();
    const depoisTelefone = texto.slice(telefone.fim).trim();

    if (antesTelefone || !depoisTelefone) return false;

    const tokensDepoisTelefone = depoisTelefone.split(/\s+/);
    return tokensDepoisTelefone.length === 1 && this.normalizarCodigoPeca(tokensDepoisTelefone[0]) === codigoPeca;
  }

  private calcularConfianca(criterios: {
    temIntencaoCompra: boolean;
    telefoneValido: boolean;
    codigoPecaEncontrado: boolean;
    codigoComRotulo: boolean;
    comentarioCurto: boolean;
    formatoDiretoTelefoneCodigo?: boolean;
  }): number {
    let confianca = 0;

    if (criterios.temIntencaoCompra) confianca += 0.3;
    if (criterios.telefoneValido) confianca += 0.35;
    if (criterios.codigoPecaEncontrado) confianca += 0.25;
    if (criterios.codigoComRotulo) confianca += 0.05;
    if (criterios.comentarioCurto && criterios.temIntencaoCompra && criterios.codigoPecaEncontrado) confianca += 0.05;

    if (!criterios.temIntencaoCompra && criterios.telefoneValido && criterios.codigoPecaEncontrado) {
      confianca = Math.max(confianca, 0.65);
    }

    if (criterios.formatoDiretoTelefoneCodigo && criterios.telefoneValido && criterios.codigoPecaEncontrado) {
      confianca = Math.max(confianca, 0.9);
    }

    return Number(Math.min(confianca, 0.98).toFixed(2));
  }
}
