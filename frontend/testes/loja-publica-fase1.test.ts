import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("loja pública e-commerce fase 1", () => {
  it("usa tracking anónimo, profiling progressivo e checkout assistido antes do WhatsApp", () => {
    const pagina = source("src/paginas/LojaDigitalPublica.tsx");

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
    expect(pagina).toContain("SecaoSobreLoja");
    expect(pagina).toContain("VitrineOrganizada");
    expect(pagina).toContain("Quer uma loja como esta?");
  });

  it("continua a loja pública com catálogos, confiança e navegação personalizada", () => {
    const pagina = source("src/paginas/LojaDigitalPublica.tsx");

    expect(pagina).toContain("CatalogosPorBlocos");
    expect(pagina).toContain("TopProdutosLoja");
    expect(pagina).toContain("ProdutosVistosRecentemente");
    expect(pagina).toContain("HistoricoEncomendasCliente");
    expect(pagina).toContain("PoliticasLoja");
    expect(pagina).toContain("TabelaMedidas");
    expect(pagina).toContain("resolverModoNegocio");
    expect(pagina).toContain("modoNegocio");
    expect(pagina).toContain("calcularTopProdutos");
    expect(pagina).toContain("guardarProdutoVisto");
    expect(pagina).toContain("catálogos");
  });

  it("oferece editor CRM para experiência pública da loja", () => {
    const configuracao = source("src/paginas/LojaPublica.tsx");
    const publica = source("src/paginas/LojaDigitalPublica.tsx");

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

  it("fecha a experiência pública com cupom, confiança e regras editáveis do CRM", () => {
    const pagina = source("src/paginas/LojaDigitalPublica.tsx");

    expect(pagina).toContain("SeloCupomLoja");
    expect(pagina).toContain("SinaisConfiancaLoja");
    expect(pagina).toContain("cupomDestaque");
    expect(pagina).toContain("catalogosEditaveis !== false");
    expect(pagina).toContain("leadCaptureAtivo !== false");
    expect(pagina).toContain("Incentivo ativo");
    expect(pagina).toContain("Sinais de confiança");
  });

  it("permite personalização avançada sem tema genérico", () => {
    const configuracao = source("src/paginas/LojaPublica.tsx");
    const publica = source("src/paginas/LojaDigitalPublica.tsx");

    expect(configuracao).toContain("paletasTemaLoja");
    expect(configuracao).toContain("Paletas de marca");
    expect(configuracao).toContain("Perfil e capa");
    expect(configuracao).toContain("EditorCatalogosPersonalizados");
    expect(configuracao).toContain("Adicionar catálogo");
    expect(configuracao).toContain("catalogosPersonalizadosTexto");
    expect(publica).toContain("resolverPaletaLoja");
    expect(publica).toContain("montarCatalogosPersonalizados");
    expect(publica).toContain("capaUrl");
    expect(publica).toContain("Perfil da loja");
  });

  it("organiza a admin da loja em fluxos operacionais ligados ao CRM", () => {
    const configuracao = source("src/paginas/LojaPublica.tsx");
    const publica = source("src/paginas/LojaDigitalPublica.tsx");

    expect(configuracao).toContain("PassoOperacaoLoja");
    expect(configuracao).toContain("Fluxos operacionais");
    expect(configuracao).toContain("Checkout inteligente");
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
    const pagina = source("src/paginas/LojaDigitalPublica.tsx");

    expect(pagina).toContain("loja-modal-responsivo");
    expect(pagina).toContain("BotaoComprarLoja");
    expect(pagina).toContain("Destaques da loja");
    expect(pagina).toContain("Loja criada com Bizy");
    expect(pagina).toContain("Ver planos");
    expect(pagina).not.toContain("Powered by Bizy");
    expect(pagina).not.toContain("tracking num CRM");
    expect(pagina).not.toContain("Dados com finalidade");
  });

  it("inicia a nova experiência social-comercial inspirada no Bizy Market", () => {
    const pagina = source("src/paginas/LojaDigitalPublica.tsx");
    const estilos = source("src/estilos.css");

    expect(pagina).toContain("obterLojaPublica");
    expect(pagina).toContain("registrarEventoTrackingPublico");
    expect(pagina).toContain("PerfilLojaSocial");
    expect(pagina).toContain("loja-profile-shell");
    expect(pagina).toContain("loja-profile-cover");
    expect(pagina).toContain("loja-profile-avatar");
    expect(pagina).toContain("loja-profile-stats");
    expect(pagina).toContain("--loja-accent");
    expect(pagina).toContain("Ver similares no Bizy Market");
    expect(pagina).toContain("motion.section");
    expect(pagina).not.toContain("bg-neutral-950 py-1.5 pl-1.5 pr-4 text-white");
    expect(estilos).toContain("--loja-action: var(--green)");
    expect(estilos).toContain("background: var(--loja-action) !important");
    expect(estilos).not.toContain("background: var(--loja-accent) !important");
  });

  it("liga os catálogos do perfil à grelha de produtos sem sair da loja", () => {
    const pagina = source("src/paginas/LojaDigitalPublica.tsx");

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
