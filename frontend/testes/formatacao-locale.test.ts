import { afterEach, describe, expect, it } from "vitest";
import {
  configurarLocaleNegocio,
  formatarDataHoraCurta,
  formatarKwanza,
  obterConfiguracaoLocaleNegocio
} from "../src/utilidades";

describe("formatação por locale do negócio", () => {
  afterEach(() => {
    configurarLocaleNegocio(null);
  });

  it("RNF-T029: usa moeda, locale e fuso horário configurados pelo negócio", () => {
    configurarLocaleNegocio({ moeda: "BRL", locale: "pt-BR", fusoHorario: "America/Sao_Paulo" });

    expect(obterConfiguracaoLocaleNegocio()).toEqual({
      moeda: "BRL",
      locale: "pt-BR",
      fusoHorario: "America/Sao_Paulo"
    });
    expect(formatarKwanza(123456)).toContain("R$");
    expect(formatarDataHoraCurta("2026-07-02T12:30:00.000Z")).toContain("09:30");
  });

  it("mantém fallback seguro para negócios sem locale explícita", () => {
    configurarLocaleNegocio({ moeda: "USD", fusoHorario: "America/New_York" });

    expect(obterConfiguracaoLocaleNegocio()).toEqual({
      moeda: "USD",
      locale: "en-US",
      fusoHorario: "America/New_York"
    });
    expect(formatarKwanza(123456)).toMatch(/\$123,456/);
  });
});
