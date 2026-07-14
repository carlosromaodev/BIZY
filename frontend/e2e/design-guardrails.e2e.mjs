import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const outputDir = process.env.E2E_SCREENSHOT_DIR ?? "/tmp/bizy-design-qa";
const defaultViewports = [
  [320, 568], [360, 800], [375, 812], [390, 844], [412, 915],
  [768, 1024], [820, 1180], [1024, 768],
  [1280, 720], [1366, 768], [1440, 900], [1920, 1080]
];
const defaultRoutes = [
  "/market",
  "/market/categorias/Moda",
  "/market/lojas",
  "/market/lojas/atelier-luanda",
  "/market/produtos/ATL-001",
  "/lojas/atelier-luanda",
  "/lojas/atelier-luanda/produtos/ATL-001",
  "/lojas/atelier-luanda/catalogos/essenciais",
  "/checkout",
  "/compras",
  "/compras/QA-001",
  "/f/atelier-luanda/lead",
  "/learning",
  "/learning/produtos/comercio-digital-pratico",
  "/learning/ana-mateus",
  "/app/learning",
  "/app/learning/produtor",
  "/app/learning/programas",
  "/app/learning/conteudos",
  "/app/learning/pessoas",
  "/app/learning/avaliacoes",
  "/app/learning/certificados",
  "/app/learning/turmas",
  "/app/learning/comunidade",
  "/app/learning/biblioteca",
  "/app/learning/relatorios",
  "/app/learning/chat",
  "/app/learning/compras",
  "/app/learning/configuracoes"
];
const viewports = process.env.E2E_VIEWPORTS
  ? process.env.E2E_VIEWPORTS.split(",").map((viewport) => viewport.split("x").map(Number))
  : process.env.E2E_VIEWPORT
    ? [process.env.E2E_VIEWPORT.split("x").map(Number)]
    : defaultViewports;
const routes = process.env.E2E_ROUTES ? process.env.E2E_ROUTES.split(",") : defaultRoutes;
const screenshotWidths = new Set([375, 768, 1440]);
const failures = [];
const consoleErrors = [];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chrome" });

try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    await context.addInitScript(() => {
      localStorage.setItem("emeu_usuario", JSON.stringify({
        id: "qa-user",
        nome: "QA Bizy",
        telefone: "923000000",
        papel: "ADMIN"
      }));
    });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error" && !/favicon|ERR_ABORTED/i.test(message.text())) {
        consoleErrors.push({ viewport: `${width}x${height}`, message: message.text() });
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push({ viewport: `${width}x${height}`, message: `pageerror: ${error.message}` });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        consoleErrors.push({ viewport: `${width}x${height}`, message: `${response.status()} ${response.url()}` });
      }
    });
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (!["xhr", "fetch"].includes(request.resourceType())) return route.continue();
      const path = new URL(request.url()).pathname;
      const payload = mockPayload(path);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });

    for (const route of routes) {
      console.log(`QA ${width}x${height} ${route}`);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      await page.locator("main").first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
      await page.waitForTimeout(100);

      if (await page.locator("main").count() === 0) {
        failures.push({ viewport: `${width}x${height}`, route, path: new URL(page.url()).pathname, reason: "landmark main ausente" });
        continue;
      }

      const audit = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const overflow = Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth;
        const visibleFixedFooters = Array.from(document.querySelectorAll("footer"))
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && ["fixed", "sticky"].includes(style.position);
          }).length;
        const localWordmarks = document.querySelectorAll(".market-wordmark-text, .learn-brand-text").length;
        const learningNav = location.pathname.startsWith("/app/learning") && location.pathname !== "/app/learning/produtor"
          ? document.querySelectorAll(".learning-team-nav-item").length
          : null;
        const footer = document.querySelector("footer");
        const footerRect = footer?.getBoundingClientRect();
        const footerWidthGap = footerRect ? Math.abs(footerRect.width - root.clientWidth) : 0;
        const marketPath = location.pathname === "/market"
          || location.pathname.startsWith("/market/")
          || location.pathname.startsWith("/lojas/")
          || location.pathname === "/checkout"
          || location.pathname === "/compras"
          || location.pathname.startsWith("/compras/")
          || location.pathname.startsWith("/f/");
        const marketBottomNavs = marketPath ? document.querySelectorAll(".market-bottom-nav").length : 0;
        const marketFooterBottomGap = marketPath && footerRect && root.scrollHeight <= root.clientHeight + 1
          ? Math.abs(root.clientHeight - footerRect.bottom)
          : 0;
        return { overflow, visibleFixedFooters, footerWidthGap, localWordmarks, learningNav, marketBottomNavs, marketFooterBottomGap, path: location.pathname };
      });

      if (audit.overflow > 1 || audit.visibleFixedFooters > 0 || audit.footerWidthGap > 1 || audit.localWordmarks > 0 || audit.marketBottomNavs > 0 || audit.marketFooterBottomGap > 1 || (audit.learningNav !== null && audit.learningNav < 10)) {
        failures.push({ viewport: `${width}x${height}`, route, ...audit });
      }

      if (screenshotWidths.has(width) && (ehRotaMarket(route) || ["/learning", "/learning/produtos/comercio-digital-pratico", "/app/learning", "/app/learning/programas"].includes(route))) {
        const slug = route.replace(/^\//, "").replaceAll("/", "-") || "home";
        await page.screenshot({ path: `${outputDir}/${width}x${height}-${slug}.png`, fullPage: true });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`Design QA: ${routes.length * viewports.length} combinações, ${consoleErrors.length} erros de consola, ${failures.length} falhas visuais.`);
if (consoleErrors.length) console.error(JSON.stringify(consoleErrors.slice(0, 20), null, 2));
if (failures.length) console.error(JSON.stringify(failures, null, 2));
if (consoleErrors.length || failures.length) process.exitCode = 1;

function ehRotaMarket(route) {
  return route === "/market"
    || route.startsWith("/market/")
    || route.startsWith("/lojas/")
    || route === "/checkout"
    || route === "/compras"
    || route.startsWith("/compras/")
    || route.startsWith("/f/");
}

function mockPayload(path) {
  if (path === "/negocio/modulos") return { modulosAtivos: ["market", "learning"] };
  if (path === "/workspaces") return { negocios: [] };
  if (path === "/painel/resumo") return {};
  if (path === "/publico/market/categorias") return mockMarketCategorias();
  if (path === "/publico/market/lojas") return { lojas: [mockFornecedorMarket()], total: 1 };
  if (path === "/publico/market/lojas/atelier-luanda") return { loja: mockFornecedorMarket(), produtos: mockProdutosMarket() };
  if (path === "/publico/market/produtos") return { produtos: mockProdutosMarket(), categorias: mockMarketCategorias().categorias, total: mockProdutosMarket().length };
  if (path === "/publico/market/produtos/ATL-001/similares") return { produtoOrigem: mockProdutosMarket()[0], produtos: mockProdutosMarket().slice(1), total: 5 };
  if (path === "/publico/market/produtos/ATL-001") return { produto: mockProdutosMarket()[0], similares: mockProdutosMarket().slice(1) };
  if (path === "/publico/lojas/atelier-luanda") return mockLojaPublica();
  if (path === "/publico/lojas/atelier-luanda/catalogos/essenciais") return {
    loja: mockLojaPublica().loja,
    catalogo: { id: "essenciais", nome: "Essenciais", descricao: "Seleção permanente do atelier.", criterio: "colecao", totalProdutos: 2 },
    produtos: mockLojaPublica().produtos.slice(0, 2)
  };
  if (path === "/publico/learning") return mockLearningHome();
  if (path === "/publico/learning/perfis/ana-mateus") return { perfil: mockLearningPerfil() };
  if (path === "/publico/learning/produtos/comercio-digital-pratico") return mockLearningProduto();
  if (path === "/publico/learning/eventos") return { evento: {}, duplicado: false };
  if (path === "/learning/team/avaliacoes") return { avaliacoes: [] };
  if (path === "/learning/team/portal-produtor") return {
    produtos: [mockProgramaLearning()],
    cohorts: [],
    receita: { confirmada: 196000, payouts: [] },
    moderacao: [],
    documentos: [],
    assignments: { tarefas: [], submissoes: [] },
    riscos: { riscos: [], metricas: { total: 0, vencidas: 0, abandono: 0, certificadosPendentes: 0 } },
    privacidade: "Dados mínimos para venda, suporte e aprendizagem."
  };
  if (path === "/learning/team/resumo") {
    return {
      podeAdministrar: true,
      perfis: [{ codigo: "GESTOR", nome: "Gestor", descricao: "Administra a aprendizagem.", podeAdministrar: true }],
      metricas: { programas: 1, publicados: 1, rascunhos: 0, produtosPagos: 1, comprasConfirmadas: 8, receitaLearning: 196000, entitlementsAtivos: 18, certificados: 6, inscritos: 24, concluidos: 9, atribuicoesAtivas: 12, formacoesObrigatorias: 1, atribuicoesAtrasadas: 2, cohortsAtivos: 1, vagasCohorts: 20, presencasCohorts: 14, replaysDisponiveis: 2, comunidadesAtivas: 1, postsComunidade: 18, anunciosComunidade: 2, perguntasComunidade: 6, denunciasLearning: 0, casosModeracaoAbertos: 0, conteudosOcultosLearning: 0, visualizacoesPublicas: 146, previewsPublicos: 52, ctasCheckoutLearning: 18, ctasInscricaoLearning: 4 },
      programas: [mockProgramaLearning()],
      recomendados: [mockProgramaLearning()],
      compras: [],
      entitlements: [],
      certificados: [],
      atribuicoes: [],
      cohorts: [],
      comunidades: [],
      moderacao: [],
      analytics: { metricas: { visualizacoesPublicas: 146, previewsPublicos: 52, ctasCheckout: 18, ctasInscricao: 4, produtosComEventos: 1 }, produtos: [], perfis: [], ultimosEventos: [] },
      chat: { metricas: { threads: 0, mensagens: 0, decisoes: 0, tarefas: 0, suporte: 0, ultimaAtividade: null }, threads: [] }
    };
  }
  return {};
}

function mockFornecedorMarket() {
  return {
    slug: "atelier-luanda",
    nomeComercial: "Atelier Luanda",
    descricaoPublica: "Moda autoral em pequenas séries, produzida em Luanda.",
    segmento: "Moda autoral",
    tipo: "LOJA",
    provincia: "Luanda",
    municipio: "Talatona",
    corPrimaria: "#176b52",
    logoUrl: null,
    capaUrl: "/bizy-live-commerce-hero.png",
    urlLoja: "/lojas/atelier-luanda",
    totalProdutos: 6,
    categorias: ["Moda", "Acessórios"]
  };
}

function mockProdutosMarket() {
  const fornecedor = mockFornecedorMarket();
  return mockLojaPublica().produtos.map((produto) => ({
    ...produto,
    descricao: "Peça contemporânea produzida localmente, com acabamento cuidado.",
    urlProduto: `/lojas/atelier-luanda/produtos/${produto.codigo}`,
    urlLoja: "/lojas/atelier-luanda",
    loja: fornecedor
  }));
}

function mockMarketCategorias() {
  return { categorias: [{ categoria: "Moda", total: 4 }, { categoria: "Acessórios", total: 2 }], total: 2 };
}

function mockProgramaLearning() {
  return {
    slug: "comercio-digital-pratico",
    titulo: "Comércio digital prático",
    subtitulo: "Da vitrine à primeira venda com processos simples e mensuráveis.",
    descricao: "Um programa aplicado para organizar catálogo, atendimento, oferta e acompanhamento comercial sem criar operações paralelas.",
    categoria: "Negócios",
    familiaProduto: "Cursos estruturados",
    publico: ["empreendedores", "equipas comerciais"],
    perfisAlvo: ["GESTOR", "VENDEDOR"],
    nivel: "INICIAL",
    formato: "CURSO",
    duracaoMinutos: 180,
    estado: "PUBLICADO",
    destaque: true,
    visibilidade: "PUBLICO",
    resultadoEsperado: "Publicar uma operação comercial clara e pronta para receber pedidos.",
    ownerPerfil: "GESTOR",
    mentorNome: "Ana Mateus",
    tipoAcesso: "PAGO",
    oferta: { modelo: "PAGAMENTO_UNICO", moeda: "AOA", valor: 29000, valorPromocional: 24500, cupoes: [], periodoDias: null, permiteComprovativo: true, emiteDocumento: true },
    previewSeguro: { resumo: "Veja a estrutura e as primeiras lições antes da compra.", licoesLiberadas: 2, incluiConteudoPremium: true },
    conteudoMinimoPublicado: true,
    certificadoConfigurado: true,
    politicaAcesso: { suporte: "Suporte durante 30 dias.", reembolso: "Pedidos analisados em até 7 dias.", certificado: "Emitido após conclusão." },
    cohort: null,
    comunidade: { titulo: "Comunidade de prática", membrosEstimados: 24, topicos: ["catálogo", "atendimento"] },
    modulosRelacionados: ["market", "team-core"],
    licoes: [
      { id: "l1", titulo: "Oferta e cliente", tipo: "VIDEO", duracaoMinutos: 18, accaoBizy: "Definir oferta" },
      { id: "l2", titulo: "Catálogo que vende", tipo: "CHECKLIST", duracaoMinutos: 22, accaoBizy: "Publicar catálogo" },
      { id: "l3", titulo: "Atendimento e seguimento", tipo: "VIDEO", duracaoMinutos: 25, accaoBizy: "Criar rotina" }
    ],
    origem: "BIZY"
  };
}

function mockLearningPerfil() {
  const programa = mockProgramaLearning();
  return {
    slug: "ana-mateus",
    negocioId: "qa-learning",
    nomePublico: "Ana Mateus",
    nomeNegocio: "Prática Comercial",
    descricaoPublica: "Especialista em operações comerciais digitais para pequenos negócios.",
    categorias: ["Negócios", "Vendas"],
    canaisSuporte: ["WhatsApp", "Email"],
    politicaSuporte: "Respostas em dias úteis, em até 24 horas.",
    localizacao: "Luanda, Angola",
    urlPublica: "/learning/ana-mateus",
    programas: [programa],
    metricas: { programas: 1, pagos: 1, gratuitos: 0, comunidades: 1, certificados: 1, minutos: 180, receitaPotencial: 24500 }
  };
}

function mockLearningHome() {
  const programa = mockProgramaLearning();
  return {
    produto: "Bizy Learning",
    tese: "Aprendizagem aplicada ao trabalho real.",
    metricas: { programas: 1, produtosDigitais: 1, pagos: 1, gratuitos: 0, trilhos: 0, comunidades: 1, perfisPublicos: 1, minutos: 180, receitaPotencial: 24500 },
    perfis: [],
    perfisPublicos: [mockLearningPerfil()],
    destaques: [programa],
    programas: [programa],
    categorias: ["Negócios", "Vendas", "Tecnologia"],
    familias: ["Cursos estruturados", "Mentorias e coaching", "Comunidades e memberships"]
  };
}

function mockLearningProduto() {
  const programa = mockProgramaLearning();
  const perfil = mockLearningPerfil();
  return {
    programa,
    produto: {
      programa,
      perfil: { slug: perfil.slug, negocioId: perfil.negocioId, nomePublico: perfil.nomePublico, nomeNegocio: perfil.nomeNegocio, descricaoPublica: perfil.descricaoPublica, categorias: perfil.categorias, canaisSuporte: perfil.canaisSuporte, politicaSuporte: perfil.politicaSuporte, localizacao: perfil.localizacao, urlPublica: perfil.urlPublica, origem: "PERFIL" },
      preview: { resumo: programa.previewSeguro.resumo, licoesLiberadas: 2, licoesBloqueadas: 1, licoes: programa.licoes.slice(0, 2), conteudoPremiumProtegido: true },
      checkout: { tipoAcesso: "PAGO", modelo: "PAGAMENTO_UNICO", moeda: "AOA", valor: 29000, valorPromocional: 24500, requerPagamento: true, permiteComprovativo: true, emiteDocumento: true, textoBotao: "Comprar programa", politicaAcesso: programa.politicaAcesso },
      sinaisConfianca: ["Conteúdo verificado", "Acesso protegido", "Certificado"],
      relacionados: [],
      seo: { titulo: `${programa.titulo} | Bizy Learning`, descricao: programa.subtitulo, urlCanonica: `/learning/produtos/${programa.slug}` }
    }
  };
}

function mockLojaPublica() {
  const produtos = [
    ["ATL-001", "Conjunto Aurora", "Moda", "Essenciais", 28500, 5],
    ["ATL-002", "Camisa Linho", "Moda", "Linho", 19500, 8],
    ["ATL-003", "Bolsa Terra", "Acessórios", "Atelier", 34000, 3],
    ["ATL-004", "Vestido Maré", "Moda", "Novidades", 42000, 6],
    ["ATL-005", "Lenço Cazenga", "Acessórios", "Essenciais", 8500, 12],
    ["ATL-006", "Calça Orla", "Moda", "Linho", 26500, 4]
  ].map(([codigo, nome, categoria, colecao, precoEmKwanza, quantidade], index) => ({
    codigo,
    nome,
    categoria,
    colecao,
    precoEmKwanza,
    precoPromocionalEmKwanza: index === 0 ? 24900 : null,
    quantidade,
    fotos: ["/bizy-live-commerce-hero.png"],
    disponivel: true,
    estadoStock: "DISPONIVEL",
    variantes: { Tamanho: ["S", "M", "L"] },
    vitrine: { selos: index < 2 ? ["DESTAQUE"] : index === 3 ? ["NOVIDADE"] : [] }
  }));
  const loja = {
    slug: "atelier-luanda",
    nomeComercial: "Atelier Luanda",
    descricaoPublica: "Peças contemporâneas produzidas em pequenas séries, com tecidos leves e acabamento local.",
    segmento: "Moda autoral",
    tipo: "LOJA",
    provincia: "Luanda",
    municipio: "Talatona",
    instagram: "atelierluanda",
    corPrimaria: "#176b52",
    logoUrl: null,
    capaUrl: "/bizy-live-commerce-hero.png",
    whatsapp: "244923000000",
    experiencia: {
      leadCaptureAtivo: true,
      catalogosEditaveis: true,
      politicaEntrega: "Entregas em Luanda em 24 a 48 horas. Outras províncias sob consulta.",
      politicaTroca: "Trocas aceites em até 7 dias para peças sem sinais de uso."
    }
  };
  return {
    loja,
    perfil: {
      slug: loja.slug,
      nomeComercial: loja.nomeComercial,
      bio: loja.descricaoPublica,
      segmento: loja.segmento,
      tipo: loja.tipo,
      avatarUrl: null,
      capaUrl: loja.capaUrl,
      corAcento: loja.corPrimaria,
      localizacao: "Talatona, Luanda",
      contadores: { seguidores: 248, seguindo: 18, produtos: produtos.length, colecoes: 3 },
      selos: [{ id: "local", label: "Produção local", tipo: "DESTAQUE" }],
      acoes: { seguirDisponivel: true, contactoDisponivel: true, checkoutDisponivel: true, urlLoja: "/lojas/atelier-luanda", urlMarket: "/market/lojas/atelier-luanda" }
    },
    colecoes: [
      { id: "essenciais", nome: "Essenciais", tipo: "colecao", totalProdutos: 2, imagem: "/bizy-live-commerce-hero.png", url: "#" },
      { id: "linho", nome: "Linho", tipo: "colecao", totalProdutos: 2, imagem: "/bizy-live-commerce-hero.png", url: "#" },
      { id: "novidades", nome: "Novidades", tipo: "colecao", totalProdutos: 2, imagem: "/bizy-live-commerce-hero.png", url: "#" }
    ],
    market: { disponivel: true, label: "Ver no Bizy Market", url: "/market/lojas/atelier-luanda", categoriaPrincipal: "Moda" },
    produtos,
    vitrine: { destaques: produtos.slice(0, 2), promocoes: produtos.slice(0, 1), novidades: produtos.slice(3, 5), reposicoes: [], maisVendidos: produtos.slice(0, 3), kits: [] }
  };
}
