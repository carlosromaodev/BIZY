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
});
