import { describe, expect, it } from "vitest";
import { extrairSlugLojaDoHostname } from "../src/lojaSubdominio";
import {
  montarUrlCategoriaMarketPublico,
  montarUrlLojasMarketPublico,
  montarUrlMarketPublico,
  montarUrlProdutoMarketPublico,
  temDominioMarketPublico
} from "../src/marketDominio";

describe("domínio público do Bizy Market", () => {
  it("reconhece market.usebizy.space como host próprio do Market", () => {
    expect(temDominioMarketPublico("market.usebizy.space", "https://market.usebizy.space")).toBe(true);
    expect(temDominioMarketPublico("uorconnect.usebizy.space", "https://market.usebizy.space")).toBe(false);
  });

  it("não trata o subdomínio market como loja", () => {
    expect(extrairSlugLojaDoHostname("market.usebizy.space", "usebizy.space")).toBeNull();
  });

  it("monta URLs canônicas no domínio próprio quando configurado", () => {
    expect(
      montarUrlMarketPublico("/", "/market", {
        hostname: "app.usebizy.space",
        urlPublica: "https://market.usebizy.space"
      })
    ).toBe("https://market.usebizy.space");

    expect(
      montarUrlMarketPublico("/produtos/ABC%201", "/market/produtos/ABC%201", {
        hostname: "app.usebizy.space",
        urlPublica: "https://market.usebizy.space"
      })
    ).toBe("https://market.usebizy.space/produtos/ABC%201");
  });

  it("usa caminhos limpos quando já está no domínio do Market", () => {
    expect(
      montarUrlMarketPublico("/produtos/ABC%201", "/market/produtos/ABC%201", {
        hostname: "market.usebizy.space",
        urlPublica: "https://market.usebizy.space"
      })
    ).toBe("/produtos/ABC%201");
  });

  it("mantém fallback /market quando nenhum domínio foi configurado", () => {
    expect(
      montarUrlMarketPublico("/produtos/ABC%201", "/market/produtos/ABC%201", {
        hostname: "localhost",
        urlPublica: null
      })
    ).toBe("/market/produtos/ABC%201");
  });

  it("expõe helpers para home, diretório, categoria e produto do Market", () => {
    expect(montarUrlMarketPublico("/", "/market", { hostname: "market.usebizy.space", urlPublica: "https://market.usebizy.space" })).toBe("/");
    expect(montarUrlLojasMarketPublico()).toContain("lojas");
    expect(montarUrlCategoriaMarketPublico("Moda")).toContain("categorias/Moda");
    expect(montarUrlProdutoMarketPublico("ABC 1")).toContain("produtos/ABC%201");
  });
});
