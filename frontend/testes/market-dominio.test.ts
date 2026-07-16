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
      montarUrlMarketPublico("/p/listing-1/camisa", "/market/p/listing-1/camisa", {
        hostname: "app.usebizy.space",
        urlPublica: "https://market.usebizy.space"
      })
    ).toBe("https://market.usebizy.space/p/listing-1/camisa");
  });

  it("usa caminhos limpos quando já está no domínio do Market", () => {
    expect(
      montarUrlMarketPublico("/p/listing-1/camisa", "/market/p/listing-1/camisa", {
        hostname: "market.usebizy.space",
        urlPublica: "https://market.usebizy.space"
      })
    ).toBe("/p/listing-1/camisa");
  });

  it("mantém fallback /market quando nenhum domínio foi configurado", () => {
    expect(
      montarUrlMarketPublico("/p/listing-1/camisa", "/market/p/listing-1/camisa", {
        hostname: "localhost",
        urlPublica: null
      })
    ).toBe("/market/p/listing-1/camisa");
  });

  it("expõe helpers para home, diretório, categoria e produto do Market", () => {
    expect(montarUrlMarketPublico("/", "/market", { hostname: "market.usebizy.space", urlPublica: "https://market.usebizy.space" })).toBe("/");
    expect(montarUrlLojasMarketPublico()).toContain("lojas");
    expect(montarUrlCategoriaMarketPublico("Moda")).toContain("categorias/Moda");
    expect(montarUrlProdutoMarketPublico("listing 1", "Camisa verde")).toContain("p/listing%201/camisa-verde");
  });
});
