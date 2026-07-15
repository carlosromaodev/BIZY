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

async function criarProduto(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string,
  nome: string,
  precoEmKwanza = 10_000,
  quantidade = 5
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      sku: `SKU-${codigo}`,
      nome,
      descricao: `${nome} para teste checkout`,
      precoEmKwanza,
      custoEmKwanza: Math.round(precoEmKwanza / 2),
      quantidade,
      stockMinimo: 1,
      categoria: "Geral",
      fotos: [`https://example.com/${codigo}.png`],
      variantes: {},
      vitrine: { selos: ["DESTAQUE"], prioridade: 1 }
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function publicarLoja(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  slug: string
) {
  const resposta = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers,
    payload: { slug, descricaoPublica: "Loja teste checkout.", publicada: true }
  });
  expect(resposta.statusCode).toBe(200);
}

async function configurarEntregaLoja(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  telefone: string,
  entrega: Record<string, unknown>
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/onboarding/negocio",
    headers,
    payload: {
      nomeComercial: `Loja Entrega ${telefone}`,
      segmento: "Moda",
      tipo: "LOJA",
      telefone,
      whatsapp: telefone,
      provincia: "Luanda",
      municipio: "Luanda",
      endereco: "Rua da loja",
      canaisVenda: ["site", "market"],
      metodosPagamento: ["transferencia"],
      entrega
    }
  });
  expect(resposta.statusCode).toBe(201);
}

describe("Checkout Unificado multi-loja", () => {
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

  it("RF-053: cria compra unificada com pedidos filhos por fornecedor", async () => {
    const app = await criarAplicacao();
    try {
      const lojaA = await autenticar(app, "923700001", "Fornecedor A");
      const lojaB = await autenticar(app, "923700002", "Fornecedor B");

      const pecaA = await criarProduto(app, lojaA, "PROD-A1", "Camisa Azul", 8_000);
      const pecaB = await criarProduto(app, lojaB, "PROD-B1", "Calça Preta", 15_000);

      await publicarLoja(app, lojaA, "fornecedor-a");
      await publicarLoja(app, lojaB, "fornecedor-b");

      const respostaCheckout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800001",
          compradorNome: "Comprador Teste",
          itens: [
            { slugLoja: "fornecedor-a", codigoPeca: "PROD-A1", quantidade: 2 },
            { slugLoja: "fornecedor-b", codigoPeca: "PROD-B1", quantidade: 1 }
          ],
          enderecoEntrega: "Rua do Teste, Luanda",
          origem: "MARKET"
        }
      });

      expect(respostaCheckout.statusCode).toBe(201);
      const resultado = respostaCheckout.json();
      expect(resultado.compra).toBeDefined();
      expect(resultado.compra.numero).toBeGreaterThan(0);
      expect(resultado.compra.estado).toBe("ABERTA");
      expect(resultado.compra).not.toHaveProperty("compradorTelefone");
      expect(resultado.pedidosFilho).toHaveLength(2);

      // O comprador recebe os totais sem identificadores internos dos fornecedores.
      expect(resultado.pedidosFilho.map((filho: { subtotalEmKwanza: number }) => filho.subtotalEmKwanza).sort((a: number, b: number) => a - b)).toEqual([15_000, 16_000]);
      expect(resultado.pedidosFilho.every((filho: Record<string, unknown>) => !filho.negocioId && !filho.pedidoId)).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("Fase 2: valida combinação, preço e stock de variante no backend", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923700099", "Fornecedor Variantes");
      const produto = await app.inject({
        method: "POST", url: "/pecas", headers: loja,
        payload: {
          codigo: "PROD-VAR-1", sku: "SKU-PROD-VAR-1", nome: "Ténis configurável",
          descricao: "Produto com preço e stock por combinação", precoEmKwanza: 10_000,
          custoEmKwanza: 5_000, quantidade: 10, stockMinimo: 1, categoria: "Calçado",
          fotos: ["https://example.com/prod-var-1.png"],
          variantes: { tamanho: ["40", "41"], cor: ["Preto", "Branco"] },
          vitrine: { selos: ["DESTAQUE"], prioridade: 1 }
        }
      });
      expect(produto.statusCode).toBe(201);

      const configuracao = await app.inject({
        method: "PUT", url: "/pecas/PROD-VAR-1/variantes", headers: loja,
        payload: {
          combinacoes: [
            { opcoes: { tamanho: "40", cor: "Preto" }, sku: "TEN-40-P", precoEmKwanza: 12_000, quantidade: 1 },
            { opcoes: { tamanho: "41", cor: "Branco" }, sku: "TEN-41-B", precoEmKwanza: 15_000, quantidade: 2 }
          ]
        }
      });
      expect(configuracao.statusCode).toBe(200);
      expect(configuracao.json().produto.quantidade).toBe(3);
      await publicarLoja(app, loja, "fornecedor-variantes");

      const publico = await app.inject({ method: "GET", url: "/publico/market/produtos/PROD-VAR-1" });
      expect(publico.statusCode).toBe(200);
      expect(publico.json().produto.combinacoesVariantes).toEqual(expect.arrayContaining([
        expect.objectContaining({ opcoes: { cor: "Preto", tamanho: "40" }, precoEmKwanza: 12_000, quantidade: 1, estado: "ATIVA" }),
        expect.objectContaining({ opcoes: { cor: "Branco", tamanho: "41" }, precoEmKwanza: 15_000, quantidade: 2, estado: "ATIVA" })
      ]));

      const checkout = (itens: Array<Record<string, unknown>>) => app.inject({
        method: "POST", url: "/publico/market/checkout",
        payload: { compradorTelefone: "923800099", itens }
      });
      const base = { slugLoja: "fornecedor-variantes", codigoPeca: "PROD-VAR-1" };

      expect((await checkout([{ ...base, quantidade: 1 }])).statusCode).toBe(400);
      expect((await checkout([{ ...base, quantidade: 1, varianteSelecionada: { tamanho: "99", cor: "Preto" } }])).statusCode).toBe(400);
      expect((await checkout([{ ...base, quantidade: 1, varianteSelecionada: { tamanho: "40", cor: "Branco" } }])).statusCode).toBe(400);
      expect((await checkout([{ ...base, quantidade: 2, varianteSelecionada: { tamanho: "40", cor: "Preto" } }])).statusCode).toBe(400);
      expect((await checkout([
        { ...base, quantidade: 1, varianteSelecionada: { tamanho: "40", cor: "Preto" } },
        { ...base, quantidade: 1, varianteSelecionada: { tamanho: "40", cor: "Preto" } }
      ])).statusCode).toBe(400);

      const valida = await checkout([{
        ...base,
        quantidade: 2,
        varianteSelecionada: { tamanho: "41", cor: "Branco" },
        precoUnitarioEmKwanza: 1
      }]);
      expect(valida.statusCode).toBe(201);
      expect(valida.json().compra.subtotalEmKwanza).toBe(30_000);

      const portalSeller = await app.inject({ method: "GET", url: "/market/fornecedor/portal", headers: loja });
      const pedidoId = portalSeller.json().pedidos.find(
        (item: { compra: { id: string } }) => item.compra.id === valida.json().compra.id
      ).pedido.pedidoId;
      const pedido = await app.inject({ method: "GET", url: `/pedidos/${pedidoId}`, headers: loja });
      expect(pedido.statusCode).toBe(200);
      expect(pedido.json().pedido.itens[0]).toEqual(expect.objectContaining({
        varianteSelecionada: { cor: "Branco", tamanho: "41" },
        precoUnitarioEmKwanza: 15_000,
        quantidade: 2
      }));
      expect(pedido.json().pedido.itens[0].variantePecaId).toBeTruthy();
    } finally {
      await app.close();
    }
  });

  it("RF-055: calcula entrega por loja usando zona, taxa padrão e regra de gratuidade", async () => {
    const app = await criarAplicacao();
    try {
      const lojaA = await autenticar(app, "923700011", "Fornecedor Entrega A");
      const lojaB = await autenticar(app, "923700012", "Fornecedor Entrega B");

      await configurarEntregaLoja(app, lojaA, "923700011", {
        taxaPadraoEmKwanza: 2500,
        entregaGratisAcimaDeKwanza: 50_000,
        zonas: [
          { municipio: "Talatona", bairro: "Centro", taxaEmKwanza: 1500, prazo: "Hoje" },
          { municipio: "Viana", taxaEmKwanza: 3500, prazo: "24h" }
        ]
      });
      await configurarEntregaLoja(app, lojaB, "923700012", {
        taxaPadraoEmKwanza: 3000,
        entregaGratisAcimaDeKwanza: 20_000
      });

      await criarProduto(app, lojaA, "PROD-ENT-A", "Produto Entrega A", 10_000);
      await criarProduto(app, lojaB, "PROD-ENT-B", "Produto Entrega B", 25_000);
      await publicarLoja(app, lojaA, "fornecedor-entrega-a");
      await publicarLoja(app, lojaB, "fornecedor-entrega-b");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800011",
          compradorNome: "Comprador Entrega",
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Talatona",
            bairro: "Centro",
            endereco: "Condomínio teste"
          },
          itens: [
            { slugLoja: "fornecedor-entrega-a", codigoPeca: "PROD-ENT-A", quantidade: 1 },
            { slugLoja: "fornecedor-entrega-b", codigoPeca: "PROD-ENT-B", quantidade: 1 }
          ],
          origem: "MARKET"
        }
      });

      expect(checkout.statusCode).toBe(201);
      const pedidos = checkout.json().pedidosFilho;
      const pedidoA = pedidos.find((pedido: any) => pedido.subtotalEmKwanza === 10_000);
      const pedidoB = pedidos.find((pedido: any) => pedido.subtotalEmKwanza === 25_000);

      expect(pedidoA).toEqual(expect.objectContaining({
        taxaEntregaEmKwanza: 1500,
        totalEmKwanza: 12_900
      }));
      expect(pedidoB).toEqual(expect.objectContaining({
        taxaEntregaEmKwanza: 0,
        totalEmKwanza: 28_500
      }));
      expect(checkout.json().compra.taxaEntregaTotalEmKwanza).toBe(1500);
      expect(checkout.json().compra.totalEmKwanza).toBe(41_400);
    } finally {
      await app.close();
    }
  });

  it("RNF-007: reaproveita a mesma compra quando checkout unificado recebe idempotencyKey repetida", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923700009", "Fornecedor Idempotente");

      await criarProduto(app, loja, "PROD-IDEMP-1", "Produto Idempotente", 11_000);
      await publicarLoja(app, loja, "fornecedor-idempotente");

      const payload = {
        idempotencyKey: "checkout-unificado-retry-1",
        compradorTelefone: "923800009",
        compradorNome: "Comprador Retry",
        itens: [
          { slugLoja: "fornecedor-idempotente", codigoPeca: "PROD-IDEMP-1", quantidade: 2 }
        ],
        enderecoEntrega: "Rua do Retry, Luanda",
        origem: "MARKET"
      };

      const primeiro = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload
      });
      const segundo = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload
      });

      expect(primeiro.statusCode).toBe(201);
      expect(segundo.statusCode).toBe(201);
      expect(segundo.json().compra.id).toBe(primeiro.json().compra.id);
      expect(segundo.json().compra.numero).toBe(primeiro.json().compra.numero);
      expect(segundo.json().pedidosFilho[0].pedidoId).toBe(primeiro.json().pedidosFilho[0].pedidoId);

      const repasses = await app.inject({
        method: "GET",
        url: "/market/fornecedor/repasses",
        headers: loja
      });
      expect(repasses.statusCode).toBe(200);
      expect(repasses.json()).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("RF-062: comprador acompanha estado da compra e recebe 404 para link inexistente", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923700010", "Fornecedor Status");

      await criarProduto(app, loja, "PROD-STATUS-1", "Produto Status", 13_000);
      await publicarLoja(app, loja, "fornecedor-status");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          idempotencyKey: "checkout-status-1",
          compradorTelefone: "923800010",
          compradorNome: "Comprador Status",
          itens: [
            { slugLoja: "fornecedor-status", codigoPeca: "PROD-STATUS-1", quantidade: 1 }
          ],
          origem: "MARKET"
        }
      });
      expect(checkout.statusCode).toBe(201);

      const detalhe = await app.inject({
        method: "GET",
        url: `/publico/market/compras/${checkout.json().compra.id}`,
        headers: { "x-bizy-compra-token": checkout.json().acessoCompra.token }
      });

      expect(detalhe.statusCode).toBe(200);
      expect(detalhe.json().compra).toEqual(expect.objectContaining({
        id: checkout.json().compra.id,
        numero: checkout.json().compra.numero,
        estado: "ABERTA",
        estadoPagamento: "PENDENTE"
      }));
      expect(detalhe.json().compra).not.toHaveProperty("compradorTelefone");
      expect(detalhe.json().compra).not.toHaveProperty("compradorEmail");
      expect(detalhe.json().compra).not.toHaveProperty("idempotencyKey");
      expect(detalhe.json().pedidosFilho).toHaveLength(1);
      expect(detalhe.json().pedidosFilho[0]).toEqual(expect.objectContaining({
        estado: "AGUARDANDO_PAGAMENTO",
        estadoPagamento: "PENDENTE",
        totalEmKwanza: 14_820
      }));
      expect(detalhe.json().pedidosFilho[0]).not.toHaveProperty("negocioId");
      expect(detalhe.json().pedidosFilho[0]).not.toHaveProperty("pedidoId");

      const inexistente = await app.inject({
        method: "GET",
        url: "/publico/market/compras/compra-inexistente",
        headers: { "x-bizy-compra-token": checkout.json().acessoCompra.token }
      });
      expect(inexistente.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("RF-058/RF-059/RF-067: recebe comprovativo sem confirmar pagamento automaticamente", async () => {
    const app = await criarAplicacao();
    try {
      const lojaA = await autenticar(app, "923700003", "Fornecedor C");
      const lojaB = await autenticar(app, "923700004", "Fornecedor D");

      await criarProduto(app, lojaA, "PROD-C1", "Produto C", 5_000);
      await criarProduto(app, lojaB, "PROD-D1", "Produto D", 7_000);

      await publicarLoja(app, lojaA, "fornecedor-c");
      await publicarLoja(app, lojaB, "fornecedor-d");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800002",
          itens: [
            { slugLoja: "fornecedor-c", codigoPeca: "PROD-C1", quantidade: 1 },
            { slugLoja: "fornecedor-d", codigoPeca: "PROD-D1", quantidade: 1 }
          ]
        }
      });
      expect(checkout.statusCode).toBe(201);
      const compraId = checkout.json().compra.id;
      const tokenCompra = checkout.json().acessoCompra.token;

      // Comprador envia comprovativo; validação/confirmação final continua com a loja.
      const pagamento = await app.inject({
        method: "POST",
        url: `/publico/market/compras/${compraId}/pagamento`,
        headers: { "x-bizy-compra-token": tokenCompra },
        payload: { ficheiroDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJUVPRgo=" }
      });
      expect(pagamento.statusCode).toBe(200);
      const estadoPagamento = pagamento.json();
      expect(estadoPagamento.compra.estado).toBe("AGUARDANDO_PAGAMENTO");
      expect(estadoPagamento.compra.estadoPagamento).toBe("COMPROVATIVO_RECEBIDO");
      expect(estadoPagamento.compra).not.toHaveProperty("comprovativoPagamentoUrl");
      expect(estadoPagamento.compra).not.toHaveProperty("compradorTelefone");
      expect(estadoPagamento.compra).not.toHaveProperty("compradorEmail");
      expect(estadoPagamento.pedidosFilho).toHaveLength(2);
      expect(estadoPagamento.pedidosFilho.every((pedido: { estadoPagamento: string }) =>
        pedido.estadoPagamento === "COMPROVATIVO_RECEBIDO"
      )).toBe(true);
      expect(estadoPagamento.pedidosFilho[0]).not.toHaveProperty("negocioId");
      expect(estadoPagamento.pedidosFilho[0]).not.toHaveProperty("pedidoId");

      const comprovativo = await app.inject({
        method: "GET",
        url: `/publico/market/compras/${compraId}/comprovativo`,
        headers: { "x-bizy-compra-token": tokenCompra }
      });
      expect(comprovativo.statusCode).toBe(200);
      expect(comprovativo.headers["content-type"]).toContain("application/pdf");

      const semAcesso = await app.inject({ method: "GET", url: `/publico/market/compras/${compraId}/comprovativo` });
      expect(semAcesso.statusCode).toBe(404);

      // Verificar estado separado (RF-067)
      const detalhe = await app.inject({
        method: "GET",
        url: `/publico/market/compras/${compraId}`,
        headers: { "x-bizy-compra-token": tokenCompra }
      });
      expect(detalhe.statusCode).toBe(200);
      const detalhes = detalhe.json();
      expect(detalhes.compra.estado).toBe("AGUARDANDO_PAGAMENTO");
      expect(detalhes.compra.estadoPagamento).toBe("COMPROVATIVO_RECEBIDO");
      expect(detalhes.pedidosFilho).toHaveLength(2);
      expect(detalhes.pedidosFilho.every((pedido: { estadoPagamento: string }) =>
        pedido.estadoPagamento === "COMPROVATIVO_RECEBIDO"
      )).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("RF-058: rejeita URL externa e ficheiro activo como comprovativo", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923700013", "Fornecedor HTTPS");

      await criarProduto(app, loja, "PROD-HTTPS", "Produto HTTPS", 4_000);
      await publicarLoja(app, loja, "fornecedor-https");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800013",
          itens: [{ slugLoja: "fornecedor-https", codigoPeca: "PROD-HTTPS", quantidade: 1 }]
        }
      });
      expect(checkout.statusCode).toBe(201);
      const compraId = checkout.json().compra.id;

      const pagamento = await app.inject({
        method: "POST",
        url: `/publico/market/compras/${compraId}/pagamento`,
        headers: { "x-bizy-compra-token": checkout.json().acessoCompra.token },
        payload: { comprovativoUrl: "http://example.com/comprovativo.jpg" }
      });

      expect(pagamento.statusCode).toBe(400);

      const pdfActivo = Buffer.from("%PDF-1.4\n/OpenAction /JavaScript\n%%EOF").toString("base64");
      const perigoso = await app.inject({
        method: "POST",
        url: `/publico/market/compras/${compraId}/pagamento`,
        headers: { "x-bizy-compra-token": checkout.json().acessoCompra.token },
        payload: { ficheiroDataUrl: `data:application/pdf;base64,${pdfActivo}` }
      });
      expect(perigoso.statusCode).toBe(400);
      expect(perigoso.json().erro).toBe("COMPROVATIVO_INVALIDO");
    } finally {
      await app.close();
    }
  });

  it("RF-070: cancelamento parcial cancela apenas um fornecedor", async () => {
    const app = await criarAplicacao();
    try {
      const lojaA = await autenticar(app, "923700005", "Fornecedor E");
      const lojaB = await autenticar(app, "923700006", "Fornecedor F");

      await criarProduto(app, lojaA, "PROD-E1", "Produto E", 6_000);
      await criarProduto(app, lojaB, "PROD-F1", "Produto F", 9_000);

      await publicarLoja(app, lojaA, "fornecedor-e");
      await publicarLoja(app, lojaB, "fornecedor-f");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800003",
          itens: [
            { slugLoja: "fornecedor-e", codigoPeca: "PROD-E1", quantidade: 1 },
            { slugLoja: "fornecedor-f", codigoPeca: "PROD-F1", quantidade: 1 }
          ]
        }
      });
      const compraId = checkout.json().compra.id;

      // Fornecedor E cancela o seu pedido
      const cancelamento = await app.inject({
        method: "POST",
        url: `/market/fornecedor/compras/${compraId}/cancelar`,
        headers: lojaA,
        payload: { motivo: "Sem stock para este item" }
      });
      expect(cancelamento.statusCode).toBe(200);

      // Compra deve ficar parcialmente cancelada
      const detalhe = await app.inject({
        method: "GET",
        url: `/publico/market/compras/${compraId}`,
        headers: { "x-bizy-compra-token": checkout.json().acessoCompra.token }
      });
      expect(detalhe.json().compra.estado).toBe("PARCIALMENTE_CANCELADA");
    } finally {
      await app.close();
    }
  });

  it("RF-071: solicitar reembolso parcial", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923700007", "Fornecedor G");
      await criarProduto(app, loja, "PROD-G1", "Produto G", 12_000);
      await publicarLoja(app, loja, "fornecedor-g");

      const pecaG = (await app.inject({ method: "GET", url: "/pecas", headers: loja })).json();

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800004",
          itens: [
            { slugLoja: "fornecedor-g", codigoPeca: "PROD-G1", quantidade: 3 }
          ]
        }
      });
      const compra = checkout.json().compra;
      const portalSeller = await app.inject({ method: "GET", url: "/market/fornecedor/portal", headers: loja });
      const pedidoFilho = portalSeller.json().pedidos.find(
        (item: { compra: { id: string } }) => item.compra.id === compra.id
      ).pedido;

      // Solicitar reembolso parcial (autenticado como fornecedor)
      const reembolso = await app.inject({
        method: "POST",
        url: "/market/reembolsos",
        headers: loja,
        payload: {
          negocioId: pecaG[0].negocioId,
          pedidoId: pedidoFilho.pedidoId,
          compraUnificadaId: compra.id,
          tipo: "PARCIAL",
          valorEmKwanza: 12_000,
          motivo: "Um dos itens chegou danificado",
          itensAfetados: [
            { codigoPeca: "PROD-G1", quantidade: 1, valorEmKwanza: 12_000 }
          ]
        }
      });
      expect(reembolso.statusCode).toBe(201);
      const dadosReembolso = reembolso.json();
      expect(dadosReembolso.tipo).toBe("PARCIAL");
      expect(dadosReembolso.estado).toBe("PENDENTE");
      expect(dadosReembolso.valorEmKwanza).toBe(12_000);
      expect(dadosReembolso.itensAfetados).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("rejeita checkout com produto inexistente", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923700008", "Fornecedor H");
      await publicarLoja(app, loja, "fornecedor-h");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800005",
          itens: [
            { slugLoja: "fornecedor-h", codigoPeca: "PROD-INEXISTENTE", quantidade: 1 }
          ]
        }
      });
      expect([400, 404, 500]).toContain(checkout.statusCode);
    } finally {
      await app.close();
    }
  });
});

describe("Repasses Financeiros", () => {
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

  it("RF-068/RF-069: cria repasses automaticamente ao criar compra unificada", async () => {
    const app = await criarAplicacao();
    try {
      const lojaA = await autenticar(app, "923710001", "Loja Repasse A");
      const lojaB = await autenticar(app, "923710002", "Loja Repasse B");

      await criarProduto(app, lojaA, "REP-A1", "Produto Repasse A", 20_000);
      await criarProduto(app, lojaB, "REP-B1", "Produto Repasse B", 30_000);

      await publicarLoja(app, lojaA, "loja-repasse-a");
      await publicarLoja(app, lojaB, "loja-repasse-b");

      await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923810001",
          itens: [
            { slugLoja: "loja-repasse-a", codigoPeca: "REP-A1", quantidade: 1 },
            { slugLoja: "loja-repasse-b", codigoPeca: "REP-B1", quantidade: 1 }
          ]
        }
      });

      // RF-072: Verificar resumo financeiro do fornecedor A
      const resumoA = await app.inject({
        method: "GET",
        url: "/market/fornecedor/resumo-financeiro",
        headers: lojaA
      });
      expect(resumoA.statusCode).toBe(200);
      const dadosResumoA = resumoA.json();
      expect(dadosResumoA.totalRetido).toBeGreaterThan(0);
      expect(dadosResumoA.repasses).toHaveLength(1);
      expect(dadosResumoA.repasses[0].estado).toBe("RETIDO");
      expect(dadosResumoA.repasses[0].taxaBizyEmKwanza).toBeGreaterThan(0);

      // RF-072: Verificar resumo financeiro do fornecedor B
      const resumoB = await app.inject({
        method: "GET",
        url: "/market/fornecedor/resumo-financeiro",
        headers: lojaB
      });
      expect(resumoB.statusCode).toBe(200);
      expect(resumoB.json().repasses).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("RF-072: fornecedor vê os seus reembolsos pendentes", async () => {
    const app = await criarAplicacao();
    try {
      const loja = await autenticar(app, "923710003", "Loja Reembolso");
      await criarProduto(app, loja, "REM-1", "Produto Reembolso", 10_000);
      await publicarLoja(app, loja, "loja-reembolso");

      const pecas = (await app.inject({ method: "GET", url: "/pecas", headers: loja })).json();

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923810002",
          itens: [
            { slugLoja: "loja-reembolso", codigoPeca: "REM-1", quantidade: 2 }
          ]
        }
      });
      const portalSeller = await app.inject({ method: "GET", url: "/market/fornecedor/portal", headers: loja });
      const pedidoFilho = portalSeller.json().pedidos.find(
        (item: { compra: { id: string } }) => item.compra.id === checkout.json().compra.id
      ).pedido;

      // Solicitar reembolso (autenticado)
      const reembolsoResp = await app.inject({
        method: "POST",
        url: "/market/reembolsos",
        headers: loja,
        payload: {
          negocioId: pecas[0].negocioId,
          pedidoId: pedidoFilho.pedidoId,
          tipo: "TOTAL",
          valorEmKwanza: 20_000,
          motivo: "Comprador desistiu da compra"
        }
      });
      expect(reembolsoResp.statusCode).toBe(201);

      // Fornecedor vê reembolsos
      const reembolsos = await app.inject({
        method: "GET",
        url: "/market/fornecedor/reembolsos",
        headers: loja
      });
      expect(reembolsos.statusCode).toBe(200);
      expect(reembolsos.json()).toHaveLength(1);
      expect(reembolsos.json()[0].tipo).toBe("TOTAL");

      // Resumo financeiro mostra reembolso pendente
      const resumo = await app.inject({
        method: "GET",
        url: "/market/fornecedor/resumo-financeiro",
        headers: loja
      });
      expect(resumo.json().reembolsosPendentes).toHaveLength(1);
    } finally {
      await app.close();
    }
  });
});
