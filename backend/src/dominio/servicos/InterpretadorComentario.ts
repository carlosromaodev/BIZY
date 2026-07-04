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

/**
 * Cria regex de intenção com fronteira baseada apenas em letras.
 * Usa (?<![a-z])...(?![a-z]) em vez de \b para permitir que
 * "quero4" detecte "quero" mesmo colado a dígitos.
 */
function criarPadraoIntencao(texto: string): RegExp {
  const normalizado = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s#+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalizado) return /(?!)/;
  const corpo = normalizado
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "[\\s.\\-]+");
  return new RegExp(`(?<![a-z])${corpo}(?![a-z])`);
}

export class InterpretadorComentario {
  private readonly normalizadorTelefone = new NormalizadorTelefone();

  // ═══════════════════════════════════════════════════════════════════
  // DICIONÁRIO DE INTENÇÕES DE COMPRA
  // Cobre português angolano, brasileiro e europeu, erros ortográficos
  // comuns em teclado mobile, gírias de live commerce e abreviações.
  // ═══════════════════════════════════════════════════════════════════
  private readonly padroesIntencaoCompra: RegExp[] = [
    // ── QUERO e todas as variações / erros de digitação ──
    criarPadraoIntencao("eu quero"), criarPadraoIntencao("eu kero"), criarPadraoIntencao("eu qero"),
    criarPadraoIntencao("eu qro"), criarPadraoIntencao("eu queri"), criarPadraoIntencao("eu queiro"),
    criarPadraoIntencao("quero"), criarPadraoIntencao("qero"), criarPadraoIntencao("kero"),
    criarPadraoIntencao("queiro"), criarPadraoIntencao("queor"), criarPadraoIntencao("quro"),
    criarPadraoIntencao("qro"), criarPadraoIntencao("qr"), criarPadraoIntencao("qiero"),
    criarPadraoIntencao("queroo"), criarPadraoIntencao("querp"), criarPadraoIntencao("quer0"),
    criarPadraoIntencao("qeru"), criarPadraoIntencao("keroo"), criarPadraoIntencao("wuero"),
    criarPadraoIntencao("qureo"), criarPadraoIntencao("qeuro"), criarPadraoIntencao("quuero"),
    criarPadraoIntencao("qqero"), criarPadraoIntencao("qwero"), criarPadraoIntencao("kerop"),
    criarPadraoIntencao("querop"), criarPadraoIntencao("qerop"),
    criarPadraoIntencao("quero esse"), criarPadraoIntencao("quero essa"),
    criarPadraoIntencao("quero este"), criarPadraoIntencao("quero esta"),
    criarPadraoIntencao("quero isso"), criarPadraoIntencao("quero aquele"),
    criarPadraoIntencao("quero aquela"),
    criarPadraoIntencao("kero esse"), criarPadraoIntencao("kero essa"),
    criarPadraoIntencao("kero este"), criarPadraoIntencao("kero esta"),
    criarPadraoIntencao("qro esse"), criarPadraoIntencao("qro essa"),
    criarPadraoIntencao("quero um"), criarPadraoIntencao("quero uma"),
    criarPadraoIntencao("kero um"), criarPadraoIntencao("kero uma"),
    criarPadraoIntencao("quero muito"), criarPadraoIntencao("kero muito"),
    criarPadraoIntencao("quero demais"), criarPadraoIntencao("amei quero"),
    criarPadraoIntencao("gostei quero"),
    criarPadraoIntencao("quero dois"), criarPadraoIntencao("quero tres"),
    criarPadraoIntencao("quero duas"), criarPadraoIntencao("kero dois"),

    // ── MEU / É MEU ──
    criarPadraoIntencao("e meu"), criarPadraoIntencao("eh meu"),
    criarPadraoIntencao("e mew"), criarPadraoIntencao("eh mew"),
    criarPadraoIntencao("meu"), criarPadraoIntencao("mew"), criarPadraoIntencao("meo"), criarPadraoIntencao("meuu"),

    // ── PEGA / PEGAR ──
    criarPadraoIntencao("pega"), criarPadraoIntencao("pga"), criarPadraoIntencao("pegaa"),
    criarPadraoIntencao("pegar"), criarPadraoIntencao("pega la"), criarPadraoIntencao("pega ai"),
    criarPadraoIntencao("pega esse"), criarPadraoIntencao("pega essa"),
    criarPadraoIntencao("pega dois"), criarPadraoIntencao("pega tres"),

    // ── RESERVA / RESERVAR ──
    criarPadraoIntencao("reserva"), criarPadraoIntencao("reserba"), criarPadraoIntencao("rezeva"),
    criarPadraoIntencao("rezerva"), criarPadraoIntencao("rserva"), criarPadraoIntencao("reservaa"),
    criarPadraoIntencao("reservo"), criarPadraoIntencao("rezzerva"), criarPadraoIntencao("reseeva"),
    criarPadraoIntencao("rseerva"), criarPadraoIntencao("resreva"), criarPadraoIntencao("reseva"),
    criarPadraoIntencao("me reserva"), criarPadraoIntencao("me reserba"),
    criarPadraoIntencao("pode reservar"), criarPadraoIntencao("pode reserba"),
    criarPadraoIntencao("reserva pra mim"), criarPadraoIntencao("reserva para mim"),

    // ── GUARDA / GUARDAR ──
    criarPadraoIntencao("guarda"), criarPadraoIntencao("gwarda"), criarPadraoIntencao("guardaa"),
    criarPadraoIntencao("garda"), criarPadraoIntencao("guardo"), criarPadraoIntencao("gaurdaa"),
    criarPadraoIntencao("guaarda"), criarPadraoIntencao("grauad"), criarPadraoIntencao("gaurad"),
    criarPadraoIntencao("me guarda"), criarPadraoIntencao("me gwarda"),
    criarPadraoIntencao("pode guardar"), criarPadraoIntencao("pode gwarda"),
    criarPadraoIntencao("guarda pra mim"), criarPadraoIntencao("guarda para mim"),

    // ── LEVA / LEVAR ──
    criarPadraoIntencao("leva"), criarPadraoIntencao("levaa"), criarPadraoIntencao("lvea"),
    criarPadraoIntencao("levo"), criarPadraoIntencao("levar"), criarPadraoIntencao("leva la"),
    criarPadraoIntencao("leav"), criarPadraoIntencao("elva"),
    criarPadraoIntencao("vou levar"), criarPadraoIntencao("vou leva"),
    criarPadraoIntencao("vo levar"), criarPadraoIntencao("vo leva"),
    criarPadraoIntencao("vou lvar"), criarPadraoIntencao("vo lvar"),
    criarPadraoIntencao("leva esse"), criarPadraoIntencao("leva essa"),
    criarPadraoIntencao("leva dois"), criarPadraoIntencao("leva tres"),

    // ── SEPARA / SEPARAR ──
    criarPadraoIntencao("separa"), criarPadraoIntencao("separaa"), criarPadraoIntencao("sepra"),
    criarPadraoIntencao("separo"), criarPadraoIntencao("separar"),
    criarPadraoIntencao("sapera"), criarPadraoIntencao("saepra"), criarPadraoIntencao("seppara"),
    criarPadraoIntencao("me separa"), criarPadraoIntencao("me sepra"),
    criarPadraoIntencao("pode separar"), criarPadraoIntencao("pode sepra"),
    criarPadraoIntencao("separa pra mim"), criarPadraoIntencao("separa para mim"),

    // ── COMPRA / COMPRAR / COMPRO ──
    criarPadraoIntencao("compro"), criarPadraoIntencao("compru"), criarPadraoIntencao("kompro"),
    criarPadraoIntencao("comproo"), criarPadraoIntencao("comprar"), criarPadraoIntencao("komprar"),
    criarPadraoIntencao("compra"), criarPadraoIntencao("kompra"),
    criarPadraoIntencao("copro"), criarPadraoIntencao("comrpo"), criarPadraoIntencao("compor"),
    criarPadraoIntencao("compr"), criarPadraoIntencao("ocmpro"),
    criarPadraoIntencao("vou comprar"), criarPadraoIntencao("vo comprar"),
    criarPadraoIntencao("como compro"), criarPadraoIntencao("como comprar"),

    // ── FICO COM ──
    criarPadraoIntencao("fico com"), criarPadraoIntencao("fiko com"), criarPadraoIntencao("fico kon"),
    criarPadraoIntencao("fiku com"), criarPadraoIntencao("fico cm"),
    criarPadraoIntencao("fica pra mim"), criarPadraoIntencao("fica para mim"),
    criarPadraoIntencao("fica pra mi"), criarPadraoIntencao("fica comigo"),
    criarPadraoIntencao("fica cmg"),

    // ── ME + verbo ──
    criarPadraoIntencao("me da"), criarPadraoIntencao("me daa"),
    criarPadraoIntencao("me manda"), criarPadraoIntencao("me envia"),
    criarPadraoIntencao("me mete"), criarPadraoIntencao("me poe"),
    criarPadraoIntencao("me arranja"), criarPadraoIntencao("me traz"),

    // ── VOU + verbo ──
    criarPadraoIntencao("vou querer"), criarPadraoIntencao("vou kerer"),
    criarPadraoIntencao("vo querer"), criarPadraoIntencao("vo kerer"),
    criarPadraoIntencao("vou pegar"), criarPadraoIntencao("vou pega"),
    criarPadraoIntencao("vo pegar"), criarPadraoIntencao("vo pega"),

    // ── MANDA / ENVIA ──
    criarPadraoIntencao("manda"), criarPadraoIntencao("envia"), criarPadraoIntencao("envie"),
    criarPadraoIntencao("manda ai"), criarPadraoIntencao("manda la"),
    criarPadraoIntencao("envia ai"), criarPadraoIntencao("envia la"),
    criarPadraoIntencao("mandaa"), criarPadraoIntencao("enviaa"),
    criarPadraoIntencao("manda pra mim"), criarPadraoIntencao("manda para mim"),
    criarPadraoIntencao("envia pra mim"), criarPadraoIntencao("envia para mim"),
    criarPadraoIntencao("manda vir"), criarPadraoIntencao("mete ai"),

    // ── PRECISO / NECESSITO ──
    criarPadraoIntencao("preciso"), criarPadraoIntencao("precizo"), criarPadraoIntencao("prsciso"),
    criarPadraoIntencao("presiso"), criarPadraoIntencao("necessito"), criarPadraoIntencao("necesito"),
    criarPadraoIntencao("preciso desse"), criarPadraoIntencao("preciso dessa"),

    // ── CONFIRMO / CONFIRMA ──
    criarPadraoIntencao("confirmo"), criarPadraoIntencao("confirmado"), criarPadraoIntencao("confirmaa"),
    criarPadraoIntencao("konfirmo"), criarPadraoIntencao("confirma"), criarPadraoIntencao("confimo"),
    criarPadraoIntencao("confirmei"),

    // ── ACEITO / ACEITA ──
    criarPadraoIntencao("aceito"), criarPadraoIntencao("aceitu"), criarPadraoIntencao("asseito"),
    criarPadraoIntencao("aceita"),

    // ── INTERESSE ──
    criarPadraoIntencao("interessado"), criarPadraoIntencao("interessada"),
    criarPadraoIntencao("interesso"), criarPadraoIntencao("interesse"),
    criarPadraoIntencao("interesado"), criarPadraoIntencao("interesada"),
    criarPadraoIntencao("tenho interesse"), criarPadraoIntencao("tenho interese"),
    criarPadraoIntencao("tou interessado"), criarPadraoIntencao("to interessado"),
    criarPadraoIntencao("tou interessada"), criarPadraoIntencao("to interessada"),

    // ── CONTACTO / NÚMERO (intenção implícita — quem dá o contacto quer comprar) ──
    criarPadraoIntencao("meu contacto"), criarPadraoIntencao("meu contato"),
    criarPadraoIntencao("meu numero"), criarPadraoIntencao("meu nro"),
    criarPadraoIntencao("meu nr"), criarPadraoIntencao("meu cel"),
    criarPadraoIntencao("meu celular"), criarPadraoIntencao("meu fone"),
    criarPadraoIntencao("meu telefone"), criarPadraoIntencao("meu tel"),
    criarPadraoIntencao("o meu contacto"), criarPadraoIntencao("o meu contato"),
    criarPadraoIntencao("o meu numero"), criarPadraoIntencao("o meu telefone"),
    criarPadraoIntencao("contacto"), criarPadraoIntencao("contato"),
    criarPadraoIntencao("fala comigo"), criarPadraoIntencao("fala cmg"),
    criarPadraoIntencao("liga pra mim"), criarPadraoIntencao("liga para mim"),
    criarPadraoIntencao("chama no whatsapp"), criarPadraoIntencao("chama no zap"),
    criarPadraoIntencao("chama no wpp"),
    criarPadraoIntencao("meu zap"), criarPadraoIntencao("meu wpp"),
    criarPadraoIntencao("meu whatsapp"),

    // ── GÍRIA ANGOLANA ──
    criarPadraoIntencao("bue quero"), criarPadraoIntencao("bue kero"), criarPadraoIntencao("bue qro"),
    criarPadraoIntencao("man pega"), criarPadraoIntencao("mano pega"), criarPadraoIntencao("mana pega"),
    criarPadraoIntencao("man quero"), criarPadraoIntencao("mano quero"),
    criarPadraoIntencao("man kero"), criarPadraoIntencao("mano kero"),
    criarPadraoIntencao("man reserva"), criarPadraoIntencao("mano reserva"),
    criarPadraoIntencao("man guarda"), criarPadraoIntencao("mano guarda"),
    criarPadraoIntencao("man leva"), criarPadraoIntencao("mano leva"),
    criarPadraoIntencao("man separa"), criarPadraoIntencao("mano separa"),
    criarPadraoIntencao("man compra"), criarPadraoIntencao("mano compra"),
    criarPadraoIntencao("tou a querer"), criarPadraoIntencao("to a querer"),
    criarPadraoIntencao("tou a kerer"), criarPadraoIntencao("to a kerer"),
    criarPadraoIntencao("quero bue"), criarPadraoIntencao("kero bue"),

    // ── QUERI / QUERIA / GOSTARIA ──
    criarPadraoIntencao("queri"), criarPadraoIntencao("queria"), criarPadraoIntencao("keria"),
    criarPadraoIntencao("queria esse"), criarPadraoIntencao("queria essa"),
    criarPadraoIntencao("gostaria"), criarPadraoIntencao("gostava"),

    // ── PODE + verbo (pedido educado) ──
    criarPadraoIntencao("pode me dar"), criarPadraoIntencao("pode me mandar"),
    criarPadraoIntencao("pode me enviar"), criarPadraoIntencao("pode me ajudar"),
    criarPadraoIntencao("por favor"),

    // ── COLOCA / ADICIONA ──
    criarPadraoIntencao("coloca"), criarPadraoIntencao("adiciona"), criarPadraoIntencao("poe"),
    criarPadraoIntencao("coloca ai"), criarPadraoIntencao("adiciona ai"),

    // ── PREÇO / VALOR (interesse implícito) ──
    criarPadraoIntencao("quanto custa"), criarPadraoIntencao("quanto e"),
    criarPadraoIntencao("qual o preco"), criarPadraoIntencao("qual preco"),
    criarPadraoIntencao("onde compro"), criarPadraoIntencao("onde comprar"),

    // ── TIRA / TIRO (coloquial para "levo") ──
    criarPadraoIntencao("tira"), criarPadraoIntencao("tiro"),

    // ── DA-ME ──
    criarPadraoIntencao("dai"), criarPadraoIntencao("da ai"), criarPadraoIntencao("da me"),
  ];

  interpretar(textoOriginal: string, contexto: ContextoInterpretadorComentario = {}): ResultadoInterpretacaoComentario {
    const textoNormalizado = this.normalizarTexto(textoOriginal);
    const texto = this.separarTokensConcatenados(textoNormalizado);
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

  /**
   * Separa tokens concatenados inserindo espaço entre letras e sequências
   * longas de dígitos (≥9). Corrige o bug onde "quero923456789" não era
   * detectado porque o telefone ficava colado ao texto.
   */
  private separarTokensConcatenados(texto: string): string {
    return texto
      .replace(/([a-z])(\d{9,})/g, "$1 $2")
      .replace(/(\d{9,})([a-z])/g, "$1 $2");
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
        .filter((valor) => valor.length >= 2 && valor.length <= 40)
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

  /**
   * Extrai telefone angolano do texto. O lookbehind (?<![a-z0-9]) impede
   * falsos positivos em códigos de peça como "X99". O pré-processamento
   * separarTokensConcatenados() garante que telefones colados a palavras
   * (ex: "quero923456789") já estão separados quando chegam aqui.
   */
  private extrairTelefone(texto: string): TrechoEncontrado | null {
    const padraoTelefone = /(?<![a-z0-9])(?:(?:\+?244|00244)[\s.-]*)?9[1-59](?:[\s.-]*\d){7}/g;
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
      "peca", "pc",
      "produto",
      "item",
      "artigo",
      "ref", "referencia",
      "codigo", "cod",
      "id",
      "num", "numero", "nr", "nro",
      "modelo", "mod",
      "lote",
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
    const candidatos: TrechoEncontrado[] = [];

    // Padrão principal: números soltos ou com prefixo de 1 letra (ex: "01", "A5")
    const padraoNumero = /\b[a-z]?\d{1,6}\b/g;
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

    // Padrão complementar: dígitos colados ao final de palavras (ex: "quero4" → "4")
    const padraoEmbedido = /[a-z]{3,}(\d{1,6})(?!\d)/g;

    while ((encontrado = padraoEmbedido.exec(texto)) !== null) {
      const valor = encontrado[1];
      const inicio = encontrado.index + encontrado[0].length - valor.length;
      const fim = encontrado.index + encontrado[0].length;

      if (telefone && this.trechosSobrepostos({ inicio, fim, valor }, telefone)) {
        continue;
      }

      if (valor === "244") {
        continue;
      }

      const trecho = { inicio, fim, valor: this.normalizarCodigoPeca(valor) };
      if (!candidatos.some((c) => this.trechosSobrepostos(c, trecho))) {
        candidatos.push(trecho);
      }
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
