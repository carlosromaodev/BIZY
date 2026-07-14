import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const fonteLojaPublica = () =>
  [
    source("src/projetos/market/paginas/LojaDigitalPublica.tsx"),
    source("src/projetos/market/loja-publica/helpers.ts"),
    source("src/projetos/market/loja-publica/tipos.ts")
  ].join("\n");
const fonteStudioLoja = () =>
  [
    source("src/projetos/market/paginas/StudioLoja.tsx"),
    source("src/projetos/market/studio-loja/modelo.ts"),
    source("src/projetos/market/studio-loja/tipos.ts")
  ].join("\n");

describe("loja pública e-commerce fase 1", () => {
  it("usa tracking anónimo, profiling progressivo e checkout assistido antes do WhatsApp", () => {
    const pagina = fonteLojaPublica();

    expect(pagina).toContain("obterTrackingIdLoja");
    expect(pagina).toContain("registrarEventoTrackingPublico");
    expect(pagina).toContain("LOJA_VISITADA");
    expect(pagina).toContain("PRODUTO_VISTO");
    expect(pagina).toContain("CHECKOUT_INICIADO");
    expect(pagina).toContain("LeadCaptureModal");
    expect(pagina).toContain("CheckoutAssistido");
    expect(pagina).toContain("calcularEntregaCheckout");
    expect(pagina).toContain("/entrega/calcular");
    expect(pagina).toContain("selecoesVariantes");
    expect(pagina).toContain("PerfilLojaSocial");
    expect(pagina).toContain("montarVitrinesOrganizadas");
    expect(pagina).toContain("loja-profile-shell");
  });

  it("continua a loja pública com catálogos, confiança e navegação comercial", () => {
    const pagina = fonteLojaPublica();

    expect(pagina).toContain("montarCatalogosPorBlocos");
    expect(pagina).toContain("calcularTopProdutos");
    expect(pagina).toContain("loja-storefront-collections");
    expect(pagina).toContain("loja-storefront-product-grid");
    expect(pagina).toContain("RodapeMarket");
    expect(pagina).toContain("politicaTroca");
    expect(pagina).toContain("LinhaTabelaMedidasLoja");
    expect(pagina).toContain("resolverModoNegocio");
    expect(pagina).toContain("modoNegocio");
    expect(pagina).toContain("calcularTopProdutos");
    expect(pagina).toContain("guardarProdutoVisto");
    expect(pagina).toContain("Catálogo");
  });

  it("oferece editor Team para experiência pública da loja", () => {
    const configuracao = fonteStudioLoja();
    const publica = fonteLojaPublica();

    expect(configuracao).toContain("PassoExperienciaLoja");
    expect(configuracao).toContain("EditorExperienciaLoja");
    expect(configuracao).toContain("ordemVitrines");
    expect(configuracao).toContain("politicaTroca");
    expect(configuracao).toContain("tabelaMedidasTexto");
    expect(configuracao).toContain("leadCaptureAtivo");
    expect(configuracao).toContain("Catalogos editáveis");
    expect(publica).toContain("experiencia");
    expect(publica).toContain("ordemVitrines");
    expect(publica).toContain("politicaTroca");
  });

  it("fecha a experiência pública com cupom, confiança e regras editáveis do Team", () => {
    const pagina = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");

    expect(pagina).toContain("SeloCupomLoja");
    expect(pagina).toContain("SinaisConfiancaLoja");
    expect(pagina).toContain("cupomDestaque");
    expect(pagina).toContain("catalogosEditaveis !== false");
    expect(pagina).toContain("leadCaptureAtivo !== false");
    expect(pagina).toContain("Incentivo ativo");
    expect(pagina).toContain("Sinais de confiança");
  });

  it("permite personalização avançada sem tema genérico", () => {
    const configuracao = fonteStudioLoja();
    const publica = fonteLojaPublica();

    expect(configuracao).toContain("paletasTemaLoja");
    expect(configuracao).toContain("Paletas de marca");
    expect(configuracao).toContain("Perfil e capa");
    expect(configuracao).toContain("EditorCatalogosPersonalizados");
    expect(configuracao).toContain("Adicionar catálogo");
    expect(configuracao).toContain("catalogosPersonalizadosTexto");
    expect(publica).toContain("resolverPaletaLoja");
    expect(publica).toContain("montarCatalogosPersonalizados");
    expect(publica).toContain("capaUrl");
    expect(publica).toContain("PerfilLojaSocial");
  });

  it("organiza a admin da loja em fluxos operacionais ligados ao Team", () => {
    const configuracao = fonteStudioLoja();
    const publica = fonteLojaPublica();

    expect(configuracao).toContain("PassoOperacaoLoja");
    expect(configuracao).toContain("Fluxos operacionais");
    expect(configuracao).toContain("Regras de compra");
    expect(configuracao).toContain("Acesso e fidelização");
    expect(configuracao).toContain("Automações comerciais");
    expect(configuracao).toContain("Canais conectados");
    expect(configuracao).toContain("Relatórios guiados");
    expect(configuracao).toContain("criarPayloadOperacaoLoja");
    expect(configuracao).toContain("operacaoLojaDigital");
    expect(configuracao).toContain("/app/clientes");
    expect(configuracao).toContain("/app/relatorios");
    expect(publica).toContain("operacao");
  });

  it("mantém loja pública polida, legível e sem textos técnicos", () => {
    const pagina = source("src/projetos/market/paginas/LojaDigitalPublica.tsx");

    expect(pagina).toContain("loja-modal-responsivo");
    expect(pagina).toContain("BotaoComprarLoja");
    expect(pagina).toContain("Escolhas da loja");
    expect(pagina).toContain("loja-storefront-actions");
    expect(pagina).toContain("loja-storefront-results-head");
    expect(pagina).not.toContain("loja-profile-trends-banner");
    expect(pagina).not.toContain("Powered by Bizy");
    expect(pagina).not.toContain("tracking num CRM");
    expect(pagina).not.toContain("Dados com finalidade");
  });

  it("mantém uma experiência comercial rica e coerente com o Bizy Market", () => {
    const pagina = fonteLojaPublica();
    const estilos = source("src/estilos.css");

    expect(pagina).toContain("obterLojaPublica");
    expect(pagina).toContain("registrarEventoTrackingPublico");
    expect(pagina).toContain("PerfilLojaSocial");
    expect(pagina).toContain("loja-profile-shell");
    expect(pagina).toContain("loja-storefront-cover");
    expect(pagina).toContain("loja-storefront-avatar");
    expect(pagina).toContain("loja-storefront-collections");
    expect(pagina).toContain("loja-storefront-feature");
    expect(pagina).toContain("--loja-accent");
    expect(pagina).toContain("reviewsReais");
    expect(pagina).toContain("Ainda sem avaliações públicas");
    expect(pagina).toContain("motion.section");
    expect(pagina).not.toContain("bg-neutral-950 py-1.5 pl-1.5 pr-4 text-white");
    expect(estilos).toContain("Storefront v4: commerce-first");
    expect(estilos).toContain(".loja-storefront-product-grid");
    expect(estilos).toContain(".market-ecom-footer.market-footer-v2");
  });

  it("liga os catálogos do perfil à grelha de produtos sem sair da loja", () => {
    const pagina = fonteLojaPublica();

    expect(pagina).toContain("CatalogoFiltroAtivo");
    expect(pagina).toContain("catalogoAtivo");
    expect(pagina).toContain("selecionarCatalogoPublico");
    expect(pagina).toContain("filtrarProdutosPorCatalogo");
    expect(pagina).toContain("colecao.ativa");
    expect(pagina).toContain("aria-pressed={colecao.ativa}");
    expect(pagina).toContain("Catálogo ativo");
    expect(pagina).toContain("Limpar catálogo");
    expect(pagina).toContain("motion.div");
  });
});
