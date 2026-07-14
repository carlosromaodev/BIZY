import { describe, expect, it } from "vitest";
import {
  criarChaveCombinacaoVariante,
  gerarCombinacoesVariantes,
  validarSelecaoVariante
} from "../dominio/servicos/VariantesProduto.js";

describe("variantes reais de produto", () => {
  it("produz chave canónica independente da ordem informada", () => {
    expect(criarChaveCombinacaoVariante({ tamanho: "M", cor: "Preto" }))
      .toBe('{"cor":"Preto","tamanho":"M"}');
  });

  it("gera o produto cartesiano sem repetir opções", () => {
    expect(gerarCombinacoesVariantes({ tamanho: ["M", "G", "M"], cor: ["Preto", "Branco"] }))
      .toEqual([
        { cor: "Preto", tamanho: "M" },
        { cor: "Preto", tamanho: "G" },
        { cor: "Branco", tamanho: "M" },
        { cor: "Branco", tamanho: "G" }
      ]);
  });

  it("recusa seleção incompleta, opção inexistente e variante num produto simples", () => {
    const definicoes = { tamanho: ["M"], cor: ["Preto"] };
    expect(() => validarSelecaoVariante(definicoes, { tamanho: "M" })).toThrow("todas as opções");
    expect(() => validarSelecaoVariante(definicoes, { tamanho: "G", cor: "Preto" })).toThrow("não possui");
    expect(() => validarSelecaoVariante({}, { tamanho: "M" })).toThrow("produto simples");
  });

  it("limita combinações excessivas antes da persistência", () => {
    const opcoes = Array.from({ length: 23 }, (_, indice) => String(indice));
    expect(() => gerarCombinacoesVariantes({ cor: opcoes, tamanho: opcoes })).toThrow("excede 500");
  });
});
