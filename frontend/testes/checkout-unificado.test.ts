import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const exists = (path: string) => existsSync(resolve(process.cwd(), path));

describe("checkout unificado progressivo", () => {
  it("expõe rota pública /checkout e página dedicada", () => {
    const rotas = source("src/rotasApp.tsx");

    expect(rotas).toContain("PaginaCheckoutBizy");
    expect(rotas).toContain('/checkout');
    expect(rotas).toContain("<PaginaCheckoutBizy />");
  });

  it("mantém carrinho unificado local com fornecedor por item e agrupamento por loja", () => {
    expect(exists("src/lojas/checkoutUnificado.ts")).toBe(true);
    const carrinho = source("src/lojas/checkoutUnificado.ts");

    expect(carrinho).toContain("CHAVE_CARRINHO_BIZY");
    expect(carrinho).toContain("ItemCarrinhoCheckoutBizy");
    expect(carrinho).toContain("adicionarItemCheckoutBizy");
    expect(carrinho).toContain("agruparItensCheckoutPorLoja");
    expect(carrinho).toContain("slugLoja");
    expect(carrinho).toContain("nomeFornecedor");
  });

  it("finaliza compra de uma loja pelo endpoint real atual e bloqueia multi-loja", () => {
    expect(exists("src/paginas/CheckoutBizy.tsx")).toBe(true);
    const checkout = source("src/paginas/CheckoutBizy.tsx");

    expect(checkout).toContain("criarCheckoutLojaPublica");
    expect(checkout).toContain("calcularEntregaLojaPublica");
    expect(checkout).toContain("checkout-bizy-infoband");
    expect(checkout).toContain("checkout-multi-store-guard");
    expect(checkout).toContain("consentimentoDados");
    expect(checkout).toContain("Não cria pedidos multi-loja sem backend de pedidos filhos");
  });

  it("liga Market e produto da loja à entrada unificada sem remover checkout atual", () => {
    const marketProduto = source("src/paginas/ProdutoMarket.tsx");
    const lojaProduto = source("src/paginas/LojaDigitalPublica.tsx");

    expect(marketProduto).toContain("adicionarItemCheckoutBizy");
    expect(marketProduto).toContain("ROTAS_LOJAS.checkout");
    expect(lojaProduto).toContain("adicionarItemCheckoutBizy");
    expect(lojaProduto).toContain("ROTAS_LOJAS.checkout");
    expect(lojaProduto).toContain("Comprar agora");
  });
});
