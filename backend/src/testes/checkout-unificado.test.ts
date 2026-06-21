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
            { negocioId: pecaA.negocioId, codigoPeca: "PROD-A1", quantidade: 2 },
            { negocioId: pecaB.negocioId, codigoPeca: "PROD-B1", quantidade: 1 }
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
      expect(resultado.compra.compradorTelefone).toBe("923800001");
      expect(resultado.pedidosFilho).toHaveLength(2);

      // Cada fornecedor tem o seu pedido filho
      const filhoA = resultado.pedidosFilho.find((f: any) => f.negocioId === pecaA.negocioId);
      const filhoB = resultado.pedidosFilho.find((f: any) => f.negocioId === pecaB.negocioId);
      expect(filhoA).toBeDefined();
      expect(filhoB).toBeDefined();
      expect(filhoA.subtotalEmKwanza).toBe(16_000); // 8000 x 2
      expect(filhoB.subtotalEmKwanza).toBe(15_000); // 15000 x 1
    } finally {
      await app.close();
    }
  });

  it("RF-054/RF-067: confirma pagamento unificado e propaga para filhos", async () => {
    const app = await criarAplicacao();
    try {
      const lojaA = await autenticar(app, "923700003", "Fornecedor C");
      const lojaB = await autenticar(app, "923700004", "Fornecedor D");

      await criarProduto(app, lojaA, "PROD-C1", "Produto C", 5_000);
      await criarProduto(app, lojaB, "PROD-D1", "Produto D", 7_000);

      await publicarLoja(app, lojaA, "fornecedor-c");
      await publicarLoja(app, lojaB, "fornecedor-d");

      // Obter negocioIds
      const pecaC = (await app.inject({ method: "GET", url: "/pecas", headers: lojaA })).json();
      const pecaD = (await app.inject({ method: "GET", url: "/pecas", headers: lojaB })).json();

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800002",
          itens: [
            { negocioId: pecaC[0].negocioId, codigoPeca: "PROD-C1", quantidade: 1 },
            { negocioId: pecaD[0].negocioId, codigoPeca: "PROD-D1", quantidade: 1 }
          ]
        }
      });
      expect(checkout.statusCode).toBe(201);
      const compraId = checkout.json().compra.id;

      // Confirmar pagamento
      const pagamento = await app.inject({
        method: "POST",
        url: `/publico/market/compras/${compraId}/pagamento`,
        payload: { comprovativoUrl: "https://example.com/comprovativo.jpg" }
      });
      expect(pagamento.statusCode).toBe(200);
      const compraPaga = pagamento.json();
      expect(compraPaga.estado).toBe("PAGA");
      expect(compraPaga.estadoPagamento).toBe("CONFIRMADO");

      // Verificar estado separado (RF-067)
      const detalhe = await app.inject({
        method: "GET",
        url: `/publico/market/compras/${compraId}`
      });
      expect(detalhe.statusCode).toBe(200);
      const detalhes = detalhe.json();
      expect(detalhes.compra.estado).toBe("PAGA");
      expect(detalhes.pedidosFilho).toHaveLength(2);
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

      const pecaE = (await app.inject({ method: "GET", url: "/pecas", headers: lojaA })).json();
      const pecaF = (await app.inject({ method: "GET", url: "/pecas", headers: lojaB })).json();

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800003",
          itens: [
            { negocioId: pecaE[0].negocioId, codigoPeca: "PROD-E1", quantidade: 1 },
            { negocioId: pecaF[0].negocioId, codigoPeca: "PROD-F1", quantidade: 1 }
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
        url: `/publico/market/compras/${compraId}`
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
            { negocioId: pecaG[0].negocioId, codigoPeca: "PROD-G1", quantidade: 3 }
          ]
        }
      });
      const compra = checkout.json().compra;
      const pedidoFilho = checkout.json().pedidosFilho[0];

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

      const pecas = (await app.inject({ method: "GET", url: "/pecas", headers: loja })).json();
      const negocioId = pecas.length > 0 ? pecas[0].negocioId : "negocio-inexistente";

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923800005",
          itens: [
            { negocioId, codigoPeca: "PROD-INEXISTENTE", quantidade: 1 }
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

      const pecaA = (await app.inject({ method: "GET", url: "/pecas", headers: lojaA })).json();
      const pecaB = (await app.inject({ method: "GET", url: "/pecas", headers: lojaB })).json();

      await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923810001",
          itens: [
            { negocioId: pecaA[0].negocioId, codigoPeca: "REP-A1", quantidade: 1 },
            { negocioId: pecaB[0].negocioId, codigoPeca: "REP-B1", quantidade: 1 }
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
      expect(dadosResumoA.totalPendente).toBeGreaterThan(0);
      expect(dadosResumoA.repasses).toHaveLength(1);
      expect(dadosResumoA.repasses[0].estado).toBe("PENDENTE");
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
            { negocioId: pecas[0].negocioId, codigoPeca: "REM-1", quantidade: 2 }
          ]
        }
      });
      const pedidoFilho = checkout.json().pedidosFilho[0];

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
