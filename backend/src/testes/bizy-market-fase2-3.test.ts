import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome }
  });
  expect(respostaCodigo.statusCode).toBe(202);

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });
  expect(respostaSessao.statusCode).toBe(200);

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarProdutoMarket(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: {
    codigo: string;
    nome: string;
    categoria?: string | null;
    colecao?: string | null;
    precoEmKwanza?: number;
    quantidade?: number;
  }
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo: dados.codigo,
      sku: `SKU-${dados.codigo}`,
      nome: dados.nome,
      descricao: `${dados.nome} no Bizy Market`,
      precoEmKwanza: dados.precoEmKwanza ?? 18_000,
      custoEmKwanza: 9_000,
      quantidade: dados.quantidade ?? 4,
      stockMinimo: 1,
      categoria: dados.categoria ?? "Roupas",
      colecao: dados.colecao ?? "Novidades",
      fotos: [`https://example.com/${dados.codigo}.png`],
      variantes: { tamanho: ["M", "G"] },
      vitrine: { selos: ["DESTAQUE"], prioridade: 1 }
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function criarNegocioOnboarding(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: { nomeComercial: string; segmento?: string; provincia?: string; municipio?: string }
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/onboarding/negocio",
    headers,
    payload: {
      nomeComercial: dados.nomeComercial,
      segmento: dados.segmento ?? "Moda",
      tipo: "LOJA",
      provincia: dados.provincia ?? null,
      municipio: dados.municipio ?? null
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function publicarLojaMarket(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: { slug: string; nomeComercial: string; provincia: string; municipio: string }
) {
  await criarNegocioOnboarding(app, headers, {
    nomeComercial: dados.nomeComercial,
    provincia: dados.provincia,
    municipio: dados.municipio
  });
  const resposta = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers,
    payload: {
      slug: dados.slug,
      descricaoPublica: `${dados.nomeComercial} no Bizy Market.`,
      publicada: true
    }
  });
  expect(resposta.statusCode).toBe(200);
  return resposta.json();
}

describe("Bizy Market Fase 2+3 HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...ambienteOriginal };
  });

  it("lista lojas publicadas no Market com filtros e perfil individual por slug", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923620001", "Boutique Luanda");
      const lojaB = await autenticar(app, "923620002", "Sapatos Benguela");
      const lojaSemPublicar = await autenticar(app, "923620003", "Loja Fantasma");

      await criarProdutoMarket(app, lojaA, { codigo: "BL-01", nome: "Vestido floral", categoria: "Roupas" });
      await criarProdutoMarket(app, lojaA, { codigo: "BL-02", nome: "Saia plissada", categoria: "Roupas" });
      await criarProdutoMarket(app, lojaB, { codigo: "SB-01", nome: "Sapato social", categoria: "Calçado" });
      await criarProdutoMarket(app, lojaSemPublicar, { codigo: "LF-01", nome: "Produto invisível", categoria: "Roupas" });

      await publicarLojaMarket(app, lojaA, { slug: "boutique-luanda", nomeComercial: "Boutique Luanda", provincia: "Luanda", municipio: "Talatona" });
      await publicarLojaMarket(app, lojaB, { slug: "sapatos-benguela", nomeComercial: "Sapatos Benguela", provincia: "Benguela", municipio: "Lobito" });

      // --- GET /publico/market/lojas ---
      const todasLojas = await app.inject({ method: "GET", url: "/publico/market/lojas" });
      expect(todasLojas.statusCode).toBe(200);
      const corpoLojas = todasLojas.json();
      expect(corpoLojas.lojas).toHaveLength(2);
      expect(corpoLojas.total).toBe(2);
      expect(corpoLojas.lojas[0]).toEqual(
        expect.objectContaining({
          slug: "boutique-luanda",
          nomeComercial: expect.stringContaining("Boutique Luanda"),
          totalProdutos: 2,
          categorias: ["Roupas"]
        })
      );
      expect(JSON.stringify(corpoLojas)).not.toContain("Loja Fantasma");

      const lojasPaginadas = await app.inject({ method: "GET", url: "/publico/market/lojas?limite=1&offset=1" });
      expect(lojasPaginadas.statusCode).toBe(200);
      expect(lojasPaginadas.json().lojas).toHaveLength(1);
      expect(lojasPaginadas.json().lojas[0].slug).toBe("sapatos-benguela");
      expect(lojasPaginadas.json().filtros).toEqual({ offset: 1, limite: 1 });
      expect(lojasPaginadas.json().paginacao).toEqual({
        total: 2,
        limite: 1,
        offset: 1,
        temProxima: false,
        temAnterior: true,
        proximoOffset: null,
        anteriorOffset: 0
      });

      // --- Filtro por provincia ---
      const filtroProvi = await app.inject({ method: "GET", url: "/publico/market/lojas?provincia=Benguela" });
      expect(filtroProvi.statusCode).toBe(200);
      const corpoFiltro = filtroProvi.json();
      expect(corpoFiltro.lojas).toHaveLength(1);
      expect(corpoFiltro.lojas[0].slug).toBe("sapatos-benguela");

      // --- Filtro por categoria ---
      const filtroCategoria = await app.inject({ method: "GET", url: "/publico/market/lojas?categoria=Calçado" });
      expect(filtroCategoria.statusCode).toBe(200);
      expect(filtroCategoria.json().lojas).toHaveLength(1);
      expect(filtroCategoria.json().lojas[0].slug).toBe("sapatos-benguela");

      // --- Filtro por busca ---
      const filtroBusca = await app.inject({ method: "GET", url: "/publico/market/lojas?busca=boutique" });
      expect(filtroBusca.statusCode).toBe(200);
      expect(filtroBusca.json().lojas).toHaveLength(1);
      expect(filtroBusca.json().lojas[0].slug).toBe("boutique-luanda");

      // --- GET /publico/market/lojas/:slug ---
      const perfilLoja = await app.inject({ method: "GET", url: "/publico/market/lojas/boutique-luanda" });
      expect(perfilLoja.statusCode).toBe(200);
      const corpoPerfil = perfilLoja.json();
      expect(corpoPerfil.loja).toEqual(
        expect.objectContaining({
          slug: "boutique-luanda",
          totalProdutos: 2,
          categorias: expect.arrayContaining(["Roupas"])
        })
      );
      expect(corpoPerfil.produtos).toHaveLength(2);
      expect(corpoPerfil.seo).toEqual(
        expect.objectContaining({
          titulo: expect.stringContaining("Boutique Luanda"),
          canonicalPath: "/market/lojas/boutique-luanda"
        })
      );
      expect(JSON.stringify(corpoPerfil)).not.toContain("custoEmKwanza");
      expect(JSON.stringify(corpoPerfil)).not.toContain("negocioId");

      // --- Loja inexistente no Market ---
      const lojaInexistente = await app.inject({ method: "GET", url: "/publico/market/lojas/loja-fantasma" });
      expect(lojaInexistente.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  }, 30_000);

  it("regista eventos de recomendação via POST /publico/recomendacoes/eventos", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923620011", "Loja Tracking A");
      await criarProdutoMarket(app, lojaA, { codigo: "TRK-01", nome: "Produto tracking", categoria: "Roupas" });
      await publicarLojaMarket(app, lojaA, { slug: "loja-tracking-a", nomeComercial: "Loja Tracking A", provincia: "Luanda", municipio: "Viana" });

      // --- Evento válido ---
      const evento = await app.inject({
        method: "POST",
        url: "/publico/recomendacoes/eventos",
        payload: {
          slugLoja: "loja-tracking-a",
          tipo: "PRODUTO_VISTO",
          codigoProduto: "TRK-01"
        }
      });
      expect(evento.statusCode).toBe(201);

      const eventoComDadosPessoais = await app.inject({
        method: "POST",
        url: "/publico/recomendacoes/eventos",
        payload: {
          slugLoja: "loja-tracking-a",
          tipo: "PRODUTO_VISTO",
          codigoProduto: "TRK-01",
          trackingId: "anonimo-trk-01",
          utm: { utm_source: "instagram", email: "cliente@example.com" }
        }
      });
      expect(eventoComDadosPessoais.statusCode).toBe(400);
      expect(eventoComDadosPessoais.json().erro).toBe("TRACKING_DADO_SENSIVEL");

      // --- Evento sem slugLoja ---
      const eventoSemSlug = await app.inject({
        method: "POST",
        url: "/publico/recomendacoes/eventos",
        payload: { tipo: "PRODUTO_VISTO" }
      });
      expect(eventoSemSlug.statusCode).toBe(400);
      expect(eventoSemSlug.json().erro).toBe("VALIDACAO");
    } finally {
      await app.close();
    }
  }, 30_000);

  it("CRUD de catálogos da loja no Team com alias CRM legado", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923620021", "Loja Studio Catálogos");
      await publicarLojaMarket(app, loja, { slug: "loja-studio-catalogos", nomeComercial: "Loja Studio Catálogos", provincia: "Luanda", municipio: "Talatona" });

      // --- Criar catálogo ---
      const criar = await app.inject({
        method: "POST",
        url: "/team/loja/catalogos",
        headers: loja,
        payload: { nome: "Novidades", descricao: "Últimos lançamentos", criterio: "colecao", valor: "Novidades" }
      });
      expect(criar.statusCode).toBe(201);
      expect(criar.json()).toEqual(
        expect.objectContaining({
          id: "novidades",
          nome: "Novidades",
          descricao: "Últimos lançamentos",
          criterio: "colecao",
          valor: "Novidades"
        })
      );

      // --- Listar catálogos ---
      const listar = await app.inject({ method: "GET", url: "/team/loja/catalogos", headers: loja });
      expect(listar.statusCode).toBe(200);
      expect(listar.json().catalogos).toHaveLength(1);
      expect(listar.json().catalogos[0].id).toBe("novidades");

      // --- Catálogo duplicado ---
      const duplicado = await app.inject({
        method: "POST",
        url: "/crm/loja/catalogos",
        headers: loja,
        payload: { nome: "Novidades", criterio: "busca" }
      });
      expect(duplicado.statusCode).toBe(409);
      expect(duplicado.json().erro).toBe("DUPLICADO");

      // --- Atualizar catálogo ---
      const atualizar = await app.inject({
        method: "PUT",
        url: "/team/loja/catalogos/novidades",
        headers: loja,
        payload: { nome: "Lançamentos", descricao: "Atualizado" }
      });
      expect(atualizar.statusCode).toBe(200);
      expect(atualizar.json().nome).toBe("Lançamentos");
      expect(atualizar.json().descricao).toBe("Atualizado");

      // --- Atualizar catálogo inexistente ---
      const atualizarInexistente = await app.inject({
        method: "PUT",
        url: "/team/loja/catalogos/inexistente",
        headers: loja,
        payload: { nome: "X" }
      });
      expect(atualizarInexistente.statusCode).toBe(404);

      // --- Remover catálogo ---
      const remover = await app.inject({ method: "DELETE", url: "/team/loja/catalogos/novidades", headers: loja });
      expect(remover.statusCode).toBe(200);
      expect(remover.json().ok).toBe(true);

      // --- Remover catálogo inexistente ---
      const removerInexistente = await app.inject({ method: "DELETE", url: "/crm/loja/catalogos/inexistente", headers: loja });
      expect(removerInexistente.statusCode).toBe(404);

      // --- Lista vazia após remoção ---
      const listarVazio = await app.inject({ method: "GET", url: "/team/loja/catalogos", headers: loja });
      expect(listarVazio.json().catalogos).toHaveLength(0);
    } finally {
      await app.close();
    }
  }, 30_000);

  it("seguidores da loja no Team com follow público e listagem autenticada", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923620031", "Loja Seguidores");
      await criarProdutoMarket(app, loja, { codigo: "SEG-01", nome: "Produto seguidor", categoria: "Roupas" });
      await publicarLojaMarket(app, loja, { slug: "loja-seguidores", nomeComercial: "Loja Seguidores", provincia: "Luanda", municipio: "Talatona" });

      // --- Seguir a loja pelo endpoint público ---
      const seguir1 = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-seguidores/seguir",
        payload: { identificador: "comprador-001", tipo: "telefone", origem: "perfil" }
      });
      expect(seguir1.statusCode).toBe(201);

      const seguir2 = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-seguidores/seguir",
        payload: { identificador: "comprador-002", tipo: "anonimo", origem: "market" }
      });
      expect(seguir2.statusCode).toBe(201);

      // --- Listar seguidores via Team ---
      const listar = await app.inject({ method: "GET", url: "/team/loja/seguidores", headers: loja });
      expect(listar.statusCode).toBe(200);
      expect(listar.json().total).toBe(2);
      expect(listar.json().seguidores).toHaveLength(2);
      expect(listar.json().seguidores[0]).toEqual(
        expect.objectContaining({
          identificador: expect.any(String),
          tipo: expect.any(String),
          origem: expect.any(String),
          criadoEm: expect.any(String)
        })
      );

      // --- Filtro por origem ---
      const filtroOrigem = await app.inject({ method: "GET", url: "/team/loja/seguidores?origem=market", headers: loja });
      expect(filtroOrigem.statusCode).toBe(200);
      expect(filtroOrigem.json().total).toBe(1);
      expect(filtroOrigem.json().seguidores[0].identificador).toBe("comprador-002");

      // --- Limite e offset ---
      const paginado = await app.inject({ method: "GET", url: "/team/loja/seguidores?limite=1&offset=1", headers: loja });
      expect(paginado.statusCode).toBe(200);
      expect(paginado.json().seguidores).toHaveLength(1);
      expect(paginado.json().total).toBe(2);
    } finally {
      await app.close();
    }
  }, 30_000);

  it("métricas da loja no Team com dados reais de produtos, seguidores e pedidos", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923620041", "Loja Métricas");
      await criarProdutoMarket(app, loja, { codigo: "MET-01", nome: "Produto métrica A", categoria: "Roupas", precoEmKwanza: 20_000 });
      await criarProdutoMarket(app, loja, { codigo: "MET-02", nome: "Produto métrica B", categoria: "Calçado", precoEmKwanza: 35_000 });
      await publicarLojaMarket(app, loja, { slug: "loja-metricas", nomeComercial: "Loja Métricas", provincia: "Luanda", municipio: "Viana" });

      // Seguidor
      await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-metricas/seguir",
        payload: { identificador: "cliente-metricas-001", tipo: "telefone", origem: "perfil" }
      });

      // --- GET /team/loja/metricas ---
      const metricas = await app.inject({ method: "GET", url: "/team/loja/metricas", headers: loja });
      expect(metricas.statusCode).toBe(200);
      const corpo = metricas.json();

      expect(corpo.perfil).toEqual(
        expect.objectContaining({
          slug: "loja-metricas",
          publicada: true,
          seguidores: 1,
          totalProdutos: 2
        })
      );

      expect(corpo.market).toEqual(
        expect.objectContaining({
          publicados: expect.any(Number),
          elegiveis: expect.any(Number),
          comPendencias: expect.any(Number)
        })
      );

      expect(corpo.vendas).toEqual(
        expect.objectContaining({
          totalPedidos: expect.any(Number),
          pedidosPagos: expect.any(Number),
          receitaTotalEmKwanza: expect.any(Number),
          ticketMedioEmKwanza: expect.any(Number)
        })
      );

      expect(corpo.tracking).toBeDefined();
    } finally {
      await app.close();
    }
  }, 30_000);
});
