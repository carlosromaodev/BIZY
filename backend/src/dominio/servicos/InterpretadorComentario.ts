import type { ModoCapturaComentario, ResultadoInterpretacaoComentario } from "../tipos.js";
import { ResultadoInterpretacaoComentarioSchema } from "../esquemas.js";
import { NormalizadorTelefone } from "./NormalizadorTelefone.js";

interface TrechoEncontrado {
  inicio: number;
  fim: number;
  valor: string;
}

export interface DicionarioParserComentario {
  termosIntencaoCompra?: string[];
  rotulosCodigoPeca?: string[];
  aliasesCodigoPeca?: Record<string, string>;
  modosCaptura?: ModoCapturaComentario[];
}

interface ContextoInterpretadorComentario {
  dicionario?: DicionarioParserComentario | null;
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
    /\bfica\s+para\s+mim\b/,
    /\bleva\b/,
    /\bsepara\b/,
    /\bme\s+da\b/,
    /\bme\s+guarda\b/,
    /\bme\s+reserva\b/,
    /\bme\s+separa\b/,
    /\bquero\s+esse\b/,
    /\bquero\s+essa\b/,
    /\bquero\s+este\b/,
    /\bquero\s+esta\b/,
    /\bvou\s+levar\b/,
    /\bvou\s+querer\b/,
    /\beh\s+meu\b/,
    /\be\s+meu\b/,
    /\bpode\s+guardar\b/,
    /\bpode\s+separar\b/,
    /\bpode\s+reservar\b/,
    /\bcompro\b/,
    /\bcomprar\b/,
    /\bfico\s+com\b/
  ];

  interpretar(textoOriginal: string, contexto: ContextoInterpretadorComentario = {}): ResultadoInterpretacaoComentario {
    const texto = this.normalizarTexto(textoOriginal);
    const motivos: string[] = [];
    const dicionario = this.normalizarDicionario(contexto.dicionario);
    const temIntencaoCompra =
      this.padroesIntencaoCompra.some((padrao) => padrao.test(texto)) ||
      this.temTermoDoDicionario(texto, dicionario.termosIntencaoCompra);
    const telefoneEncontrado = this.extrairTelefone(texto);
    const telefone = telefoneEncontrado ? this.normalizadorTelefone.normalizar(telefoneEncontrado.valor) : null;
    const pecasPorAlias = this.extrairCodigosPecaPorAlias(texto, dicionario.aliasesCodigoPeca);
    const pecasComRotulo = this.extrairCodigosPecaRotulados(texto, dicionario.rotulosCodigoPeca);
    const pecasLivres =
      pecasPorAlias.length || pecasComRotulo.length ? [] : this.extrairCodigosPecaLivres(texto, telefoneEncontrado);
    const codigosPeca = this.removerDuplicados(
      [...pecasPorAlias, ...pecasComRotulo, ...pecasLivres].map((peca) => peca.valor)
    );
    const codigoPeca = codigosPeca[0] ?? null;
    const formatoDiretoTelefoneCodigo = this.temFormatoDiretoTelefoneCodigo(texto, telefoneEncontrado, codigoPeca);
    const temTelefoneECodigo = telefone !== null && codigoPeca !== null;
    const temCompraOperacional = temIntencaoCompra || formatoDiretoTelefoneCodigo || temTelefoneECodigo;

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
      codigoComRotulo: pecasComRotulo.length > 0 || pecasPorAlias.length > 0,
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

  private normalizarDicionario(dicionario?: DicionarioParserComentario | null): Required<DicionarioParserComentario> {
    return {
      termosIntencaoCompra: this.listaNormalizada(dicionario?.termosIntencaoCompra),
      rotulosCodigoPeca: this.listaNormalizada(dicionario?.rotulosCodigoPeca),
      aliasesCodigoPeca: this.aliasesNormalizados(dicionario?.aliasesCodigoPeca),
      modosCaptura: dicionario?.modosCaptura?.length ? dicionario.modosCaptura : ["TELEFONE_CODIGO"]
    };
  }

  private listaNormalizada(valores?: string[]): string[] {
    if (!Array.isArray(valores)) return [];

    return this.removerDuplicados(
      valores
        .map((valor) => (typeof valor === "string" ? this.normalizarTexto(valor) : ""))
        .filter((valor) => valor.length >= 2)
        .slice(0, 80)
    );
  }

  private aliasesNormalizados(aliases?: Record<string, string>): Record<string, string> {
    if (!aliases || typeof aliases !== "object" || Array.isArray(aliases)) return {};

    return Object.fromEntries(
      Object.entries(aliases)
        .map(([alias, codigo]) => [
          this.normalizarTexto(alias),
          typeof codigo === "string" ? this.normalizarCodigoPeca(codigo) : ""
        ])
        .filter(([alias, codigo]) => alias.length >= 2 && codigo.length > 0)
        .slice(0, 120)
    );
  }

  private temTermoDoDicionario(texto: string, termos: string[]): boolean {
    return termos.some((termo) => this.criarPadraoTexto(termo)?.test(texto));
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

  private extrairCodigosPecaPorAlias(texto: string, aliases: Record<string, string>): TrechoEncontrado[] {
    const resultados: TrechoEncontrado[] = [];
    const aliasesOrdenados = Object.entries(aliases).sort(([primeiro], [segundo]) => segundo.length - primeiro.length);

    for (const [alias, codigo] of aliasesOrdenados) {
      const padrao = this.criarPadraoTexto(alias, "g");
      if (!padrao) continue;

      let encontrado: RegExpExecArray | null;
      while ((encontrado = padrao.exec(texto)) !== null) {
        const trecho = {
          inicio: encontrado.index,
          fim: encontrado.index + encontrado[0].length,
          valor: codigo
        };

        if (!resultados.some((resultado) => this.trechosSobrepostos(resultado, trecho))) {
          resultados.push(trecho);
        }
      }
    }

    return resultados.sort((primeiro, segundo) => primeiro.inicio - segundo.inicio);
  }

  private extrairCodigosPecaRotulados(texto: string, rotulosExtras: string[] = []): TrechoEncontrado[] {
    const rotulos = this.removerDuplicados([
      "peca",
      "produto",
      "item",
      "artigo",
      "ref",
      "referencia",
      "codigo",
      "cod",
      "id",
      ...rotulosExtras
    ]);
    const rotulosRegex = rotulos.map((rotulo) => this.escaparRegex(rotulo).replace(/\s+/g, "\\s+")).join("|");
    const padraoRotulado = new RegExp(
      `(?:\\b(?:${rotulosRegex})\\s*(?:e\\s+|eh\\s+)?#?\\s*([a-z0-9][a-z0-9_-]{0,31})\\b)|(?:#\\s*([a-z0-9][a-z0-9_-]{0,31})\\b)`,
      "g"
    );
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

    return candidatos;
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

  private criarPadraoTexto(texto: string, flags = ""): RegExp | null {
    const normalizado = this.normalizarTexto(texto);
    if (!normalizado) return null;

    const corpo = this.escaparRegex(normalizado).replace(/\s+/g, "\\s+");
    return new RegExp(`(?<![a-z0-9])${corpo}(?![a-z0-9])`, flags);
  }

  private escaparRegex(texto: string): string {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private temFormatoDiretoTelefoneCodigo(
    texto: string,
    telefone: TrechoEncontrado | null,
    codigoPeca: string | null
  ): boolean {
    if (!telefone || !codigoPeca) return false;

    const antesTelefone = texto.slice(0, telefone.inicio).trim();
    const depoisTelefone = texto.slice(telefone.fim).trim();

    // Formato "923456789 01" — telefone primeiro, código depois
    if (!antesTelefone && depoisTelefone) {
      const tokensDepois = depoisTelefone.split(/\s+/);
      if (tokensDepois.length === 1 && this.normalizarCodigoPeca(tokensDepois[0]) === codigoPeca) {
        return true;
      }
    }

    // Formato "01 923456789" — código primeiro, telefone depois
    if (antesTelefone && !depoisTelefone) {
      const tokensAntes = antesTelefone.split(/\s+/);
      if (tokensAntes.length === 1 && this.normalizarCodigoPeca(tokensAntes[0]) === codigoPeca) {
        return true;
      }
    }

    return false;
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
