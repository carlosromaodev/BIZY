import { describe, expect, it } from "vitest";
import {
  extrairSlugLojaDoHostname,
  montarUrlPublicaLoja,
  resolverSlugLojaPublica
} from "../src/lojaSubdominio";

describe("subdomínio público da loja", () => {
  it("extrai o slug da loja a partir do subdomínio", () => {
    expect(extrairSlugLojaDoHostname("uorconnect.usebizy.space", "usebizy.space")).toBe("uorconnect");
    expect(extrairSlugLojaDoHostname("uorconnect.usebizy.space:443", "usebizy.space")).toBe("uorconnect");
  });

  it("não trata domínios principais ou reservados como lojas", () => {
    expect(extrairSlugLojaDoHostname("usebizy.space", "usebizy.space")).toBeNull();
    expect(extrairSlugLojaDoHostname("www.usebizy.space", "usebizy.space")).toBeNull();
    expect(extrairSlugLojaDoHostname("api.usebizy.space", "usebizy.space")).toBeNull();
  });

  it("prioriza o subdomínio e mantém o fallback /lojas/:slug", () => {
    expect(resolverSlugLojaPublica("fallback", "uorconnect.usebizy.space", "usebizy.space")).toBe("uorconnect");
    expect(resolverSlugLojaPublica("fallback", "usebizy.space", "usebizy.space")).toBe("fallback");
  });

  it("monta o link público por subdomínio quando há domínio configurado", () => {
    expect(
      montarUrlPublicaLoja("uorconnect", {
        dominioBase: "usebizy.space",
        protocolo: "https:"
      })
    ).toBe("https://uorconnect.usebizy.space");
  });

  it("mantém link local por caminho quando não há domínio público de lojas", () => {
    expect(
      montarUrlPublicaLoja("uorconnect", {
        origem: "http://localhost:5173",
        dominioBase: null
      })
    ).toBe("http://localhost:5173/lojas/uorconnect");
  });
});
