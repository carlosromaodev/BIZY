import { describe, expect, it } from "vitest";
import { InterpretadorComentario } from "../dominio/servicos/InterpretadorComentario.js";

describe("InterpretadorComentario", () => {
  const interpretador = new InterpretadorComentario();

  it("interpreta compra com telefone antes da peça", () => {
    const resultado = interpretador.interpretar("eu quero 923456789 4");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("4");
    expect(resultado.requiresManualReview).toBe(false);
    expect(resultado.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("interpreta telefone angolano seguido do código da peça como compra de alta confiança", () => {
    const resultado = interpretador.interpretar("923456789 01");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("01");
    expect(resultado.requiresManualReview).toBe(false);
    expect(resultado.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("trata telefone e id do artigo separados em texto natural como compra automática", () => {
    const resultado = interpretador.interpretar("o meu contacto é 923456789 e o id é RAW360");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("RAW360");
    expect(resultado.requiresManualReview).toBe(false);
    expect(resultado.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("aceita telefone e artigo sem verbo explícito de compra", () => {
    const resultado = interpretador.interpretar("fala comigo no 923 456 789 artigo ABC-22");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("ABC-22");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("interpreta compra com erro de escrita e peça rotulada", () => {
    const resultado = interpretador.interpretar("eu queri peça 4 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("4");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("manda comentário sem telefone para revisão manual", () => {
    const resultado = interpretador.interpretar("meu 4");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBeNull();
    expect(resultado.productCode).toBe("4");
    expect(resultado.requiresManualReview).toBe(true);
    expect(resultado.confidence).toBe(0.6);
  });

  it("trata telefone sozinho como lead de compra para revisão", () => {
    const resultado = interpretador.interpretar("937624786");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("937624786");
    expect(resultado.productCode).toBeNull();
    expect(resultado.requiresManualReview).toBe(true);
    expect(resultado.reasons).toEqual(expect.arrayContaining(["Código da peça ausente."]));
  });

  it("valida telefone angolano e rejeita prefixo inválido", () => {
    const resultado = interpretador.interpretar("quero 823456789 peça 4");

    expect(resultado.phone).toBeNull();
    expect(resultado.productCode).toBe("4");
    expect(resultado.requiresManualReview).toBe(true);
  });

  it("aceita telefone com indicativo de Angola", () => {
    const resultado = interpretador.interpretar("reserva +244 923 456 789 produto 12");

    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("12");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("extrai múltiplos códigos quando o cliente pede mais de uma peça", () => {
    const resultado = interpretador.interpretar("eu quero peça 4 e peça 5 923456789");

    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("4");
    expect(resultado.productCodes).toEqual(["4", "5"]);
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("usa dicionário do negócio para termos de compra, rótulos e aliases de produto", () => {
    const resultado = interpretador.interpretar("923456789 leva look verde", {
      dicionario: {
        termosIntencaoCompra: ["leva"],
        rotulosCodigoPeca: ["ref"],
        aliasesCodigoPeca: {
          "look verde": "LV-01"
        }
      }
    });

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("LV-01");
    expect(resultado.productCodes).toEqual(["LV-01"]);
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("usa rótulos de artigo configurados por loja ou segmento", () => {
    const resultado = interpretador.interpretar("separa ref abc-22 923456789", {
      dicionario: {
        termosIntencaoCompra: ["separa"],
        rotulosCodigoPeca: ["ref", "artigo"]
      }
    });

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("ABC-22");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("prioriza alias mais específico quando houver termos sobrepostos", () => {
    const resultado = interpretador.interpretar("923456789 leva look verde", {
      dicionario: {
        termosIntencaoCompra: ["leva"],
        aliasesCodigoPeca: {
          look: "LOOK",
          "look verde": "LV-01"
        }
      }
    });

    expect(resultado.productCodes).toEqual(["LV-01"]);
  });

  /* ── Formato invertido (código antes do telefone) ── */
  it("aceita código antes do telefone como formato direto", () => {
    const resultado = interpretador.interpretar("01 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("01");
    expect(resultado.requiresManualReview).toBe(false);
    expect(resultado.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("aceita código alfanumérico antes do telefone", () => {
    const resultado = interpretador.interpretar("A5 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("A5");
    expect(resultado.requiresManualReview).toBe(false);
  });

  /* ── Novos padrões de intenção de compra ── */
  it("reconhece 'leva' como intenção de compra", () => {
    const resultado = interpretador.interpretar("leva 923456789 peça 3");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("3");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'separa' como intenção de compra", () => {
    const resultado = interpretador.interpretar("separa peça 7 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.productCode).toBe("7");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'fico com' como intenção de compra", () => {
    const resultado = interpretador.interpretar("fico com 923456789 peça 2");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.productCode).toBe("2");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'compro' como intenção de compra", () => {
    const resultado = interpretador.interpretar("compro 923456789 01");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.productCode).toBe("01");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'me guarda' como intenção de compra", () => {
    const resultado = interpretador.interpretar("me guarda peça 4 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.productCode).toBe("4");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'vou levar' como intenção de compra", () => {
    const resultado = interpretador.interpretar("vou levar 923456789 peça 10");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.productCode).toBe("10");
    expect(resultado.requiresManualReview).toBe(false);
  });

  /* ── Formatos flexíveis do dia-a-dia ── */
  it("aceita formato natural com código rotulado e telefone no meio", () => {
    const resultado = interpretador.interpretar("quero a peça 3 meu número 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("3");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("aceita múltiplos códigos livres no mesmo comentário", () => {
    const resultado = interpretador.interpretar("923456789 01 02 03");

    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCodes).toEqual(["01", "02", "03"]);
  });

  /* ── Correcções: telefone concatenado com texto ── */
  it("extrai telefone colado a texto sem espaço (bug fix)", () => {
    const resultado = interpretador.interpretar("quero923456789 4");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("4");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("extrai telefone com indicativo colado a texto", () => {
    const resultado = interpretador.interpretar("quero+244923456789 peca 01");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("01");
  });

  it("extrai telefone quando dígitos aparecem depois do texto sem espaço", () => {
    const resultado = interpretador.interpretar("923456789peca 3");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("3");
  });

  /* ── Erros ortográficos comuns em mobile ── */
  it("reconhece 'kero' como variação de 'quero'", () => {
    const resultado = interpretador.interpretar("kero 923456789 peca 3");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("3");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'reserba' como variação de 'reserva'", () => {
    const resultado = interpretador.interpretar("reserba peca 2 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("2");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'kompro' como variação de 'compro'", () => {
    const resultado = interpretador.interpretar("kompro 923456789 01");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("01");
  });

  /* ── Gíria angolana ── */
  it("reconhece 'bué quero' como gíria angolana de intenção", () => {
    const resultado = interpretador.interpretar("bué quero 923456789 peca 1");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("1");
    expect(resultado.requiresManualReview).toBe(false);
  });

  it("reconhece 'mano pega' como gíria angolana de intenção", () => {
    const resultado = interpretador.interpretar("mano pega 923456789 artigo 5");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("5");
  });

  /* ── Contacto como intenção implícita ── */
  it("detecta 'meu contacto' como intenção implícita de compra", () => {
    const resultado = interpretador.interpretar("meu contacto 923456789 artigo 5");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("5");
    expect(resultado.requiresManualReview).toBe(false);
  });

  /* ── Rótulos expandidos ── */
  it("reconhece 'modelo' como rótulo de código de peça", () => {
    const resultado = interpretador.interpretar("quero modelo XR7 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("XR7");
  });

  it("reconhece 'num' como rótulo de código de peça", () => {
    const resultado = interpretador.interpretar("quero num 42 923456789");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("42");
  });

  /* ── Código embebido (sem espaço entre palavra e número) ── */
  it("extrai código de peça colado a palavra de intenção", () => {
    const resultado = interpretador.interpretar("923456789 quero4");

    expect(resultado.intent).toBe("BUY");
    expect(resultado.phone).toBe("923456789");
    expect(resultado.productCode).toBe("4");
  });
});
