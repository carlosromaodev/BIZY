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

  it("expõe acompanhamento público da compra unificada sem exigir login", () => {
    const rotas = source("src/rotasApp.tsx");
    const rotaLojas = source("src/projetos/market/api/rotasLojas.ts");
    const checkout = source("src/projetos/market/paginas/CheckoutBizy.tsx");

    expect(rotas).toContain("PaginaCompraUnificada");
    expect(rotas).toContain('/compras/:id');
    expect(rotaLojas).toContain("compra: (id: string)");
    expect(checkout).toContain("Acompanhar compra");
    expect(checkout).toContain("ROTAS_LOJAS.compra");
  });

  it("renderiza página de acompanhamento com noindex e estados por fornecedor", () => {
    expect(exists("src/projetos/market/paginas/CompraUnificada.tsx")).toBe(true);
    const pagina = source("src/projetos/market/paginas/CompraUnificada.tsx");

    expect(pagina).toContain("obterCompraUnificada");
    expect(pagina).toContain("enviarComprovativoPagamentoUnificado");
    expect(pagina).toContain('meta[name="robots"]');
    expect(pagina).toContain("noindex, nofollow");
    expect(pagina).toContain("Pedidos da compra");
    expect(pagina).toContain("Fornecedor {indice + 1}");
    expect(pagina).toContain('type="file"');
    expect(pagina).toContain("application/pdf,image/jpeg,image/png,image/webp");
    expect(pagina).toContain("lerFicheiroDataUrl");
    expect(pagina).not.toContain("compradorTelefone");
    expect(pagina).not.toContain("compradorEmail");
  });

  it("mantém resposta local imediata e sincroniza o carrinho canónico no servidor", () => {
    expect(exists("src/projetos/market/api/checkoutUnificado.ts")).toBe(true);
    const carrinho = source("src/projetos/market/api/checkoutUnificado.ts");

    expect(carrinho).toContain("CHAVE_CARRINHO_BIZY");
    expect(carrinho).toContain("CHAVE_IDEMPOTENCIA_CHECKOUT_BIZY");
    expect(carrinho).toContain("CHAVE_TOKEN_CARRINHO_BIZY");
    expect(carrinho).toContain("ItemCarrinhoCheckoutBizy");
    expect(carrinho).toContain("adicionarItemCheckoutBizy");
    expect(carrinho).toContain("agruparItensCheckoutPorLoja");
    expect(carrinho).toContain("obterChaveIdempotenciaCheckoutBizy");
    expect(carrinho).toContain("limparChaveIdempotenciaCheckoutBizy");
    expect(carrinho).toContain("sincronizarCarrinhoServidorBizy");
    expect(carrinho).toContain('"X-Bizy-Cart-Token"');
    expect(carrinho).toContain("slugLoja");
    expect(carrinho).toContain("nomeFornecedor");
  });

  it("finaliza compra pelo endpoint real atual e envia chave idempotente", () => {
    expect(exists("src/projetos/market/paginas/CheckoutBizy.tsx")).toBe(true);
    const checkout = source("src/projetos/market/paginas/CheckoutBizy.tsx");

    expect(checkout).toContain("criarCheckoutUnificado");
    expect(checkout).toContain("sincronizarCarrinhoServidorBizy");
    expect(checkout).toContain("carrinhoId: carrinho.id");
    expect(checkout).not.toContain("criarCheckoutLojaPublica");
    expect(checkout).toContain("checkout-bizy-infoband");
    expect(checkout).toContain("checkout-multi-store-guard");
    expect(checkout).toContain("consentimentoDados");
    expect(checkout).toContain("obterChaveIdempotenciaCheckoutBizy");
    expect(checkout).toContain("idempotencyKey");
    expect(checkout).toContain("entrega,");
    expect(checkout).toContain("itens: []");
  });

  it("fecha checkout visual completo com passos, quantidade e revisão operacional", () => {
    const checkout = source("src/projetos/market/paginas/CheckoutBizy.tsx");
    const estilos = source("src/estilos.css");

    expect(checkout).toContain("ETAPAS_CHECKOUT");
    expect(checkout).toContain("checkout-progress-steps");
    expect(checkout).toContain("checkout-visual-panel");
    expect(checkout).toContain("checkout-quantity-control");
    expect(checkout).toContain("atualizarQuantidadeItemCheckoutBizy");
    expect(checkout).toContain("checkout-review-panel");
    expect(checkout).toContain("Revisão antes de finalizar");
    expect(estilos).toContain(".checkout-progress-steps");
    expect(estilos).toContain(".checkout-quantity-control");
    expect(estilos).toContain(".checkout-review-panel");
  });

  it("liga Market e produto da loja ao único checkout unificado", () => {
    const marketProduto = source("src/projetos/market/paginas/ProdutoMarket.tsx");
    const lojaProduto = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");

    expect(marketProduto).toContain("adicionarItemCheckoutBizy");
    expect(marketProduto).toContain("variantesSelecionadas");
    expect(marketProduto).toContain("combinacaoSelecionada");
    expect(marketProduto).toContain("precoSelecionado");
    expect(marketProduto).toContain("aria-pressed={seleccionada}");
    expect(marketProduto).toContain('aria-label={`${nome}: ${opcao}`}');
    expect(marketProduto).toContain("ROTAS_LOJAS.checkout");
    expect(lojaProduto).toContain("adicionarItemCheckoutBizy");
    expect(lojaProduto).toContain("ROTAS_LOJAS.checkout");
    expect(lojaProduto).toContain("Comprar agora");
    expect(lojaProduto).toContain("variantes: selecoes");
    expect(lojaProduto).toContain("selecionarOpcaoProduto");
    expect(lojaProduto).toContain("stockProduto");
    expect(lojaProduto).toContain("combinacoesVariantes");
    expect(lojaProduto).not.toContain("CheckoutAssistido");
    expect(lojaProduto).not.toContain("/publico/lojas/${encodeURIComponent(slug)}/checkout");
  });
});
