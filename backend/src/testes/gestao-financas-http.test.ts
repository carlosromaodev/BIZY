import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Gestão Financeira — rotas HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      MODULOS_TODOS_ATIVOS: "true"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
    const telefone = "923000030";
    const r1 = await app.inject({
      method: "POST",
      url: "/auth/telefone/solicitar-codigo",
      payload: { telefone, nome: "Gestor Finanças" }
    });
    const r2 = await app.inject({
      method: "POST",
      url: "/auth/telefone/confirmar-codigo",
      payload: { telefone, codigo: r1.json().codigoDev }
    });
    return { authorization: `Bearer ${r2.json().token}` };
  }

  it("inicializa categorias padrão e lista-as", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const init = await app.inject({
        method: "POST",
        url: "/financas/categorias/inicializar",
        headers
      });
      expect(init.statusCode).toBe(200);
      expect(init.json().criadas).toBeGreaterThan(0);

      // Segunda inicialização não deve criar duplicados
      const init2 = await app.inject({
        method: "POST",
        url: "/financas/categorias/inicializar",
        headers
      });
      expect(init2.json().criadas).toBe(0);

      const lista = await app.inject({
        method: "GET",
        url: "/financas/categorias",
        headers
      });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().length).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });

  it("cria categoria personalizada", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const resp = await app.inject({
        method: "POST",
        url: "/financas/categorias",
        headers,
        payload: { nome: "Material de escritório", tipo: "DESPESA" }
      });
      expect(resp.statusCode).toBe(200);
      expect(resp.json().nome).toBe("Material de escritório");
      expect(resp.json().tipo).toBe("DESPESA");
    } finally {
      await app.close();
    }
  });

  it("regista movimento financeiro e lista-o", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const mov = await app.inject({
        method: "POST",
        url: "/financas/movimentos",
        headers,
        payload: {
          tipo: "ENTRADA",
          descricao: "Venda de produto XYZ",
          valor: 15000
        }
      });
      expect(mov.statusCode).toBe(200);
      expect(mov.json().valor).toBe(15000);

      const lista = await app.inject({
        method: "GET",
        url: "/financas/movimentos",
        headers
      });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().length).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });

  it("cria despesa e marca como paga", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const despesa = await app.inject({
        method: "POST",
        url: "/financas/despesas",
        headers,
        payload: {
          descricao: "Aluguer de loja",
          valor: 120000,
          tipoRecorrencia: "MENSAL",
          fornecedor: "Proprietário"
        }
      });
      expect(despesa.statusCode).toBe(200);
      const id = despesa.json().id;

      const pagar = await app.inject({
        method: "POST",
        url: `/financas/despesas/${id}/pagar`,
        headers
      });
      expect(pagar.statusCode).toBe(200);
      expect(pagar.json().pago).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("cria conta a receber e regista pagamento", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const conta = await app.inject({
        method: "POST",
        url: "/financas/contas-receber",
        headers,
        payload: {
          descricao: "Encomenda cliente Luísa",
          valor: 45000,
          dataVencimento: new Date(Date.now() + 7 * 86400000).toISOString()
        }
      });
      expect(conta.statusCode).toBe(200);
      const id = conta.json().id;

      const receber = await app.inject({
        method: "POST",
        url: `/financas/contas-receber/${id}/receber`,
        headers,
        payload: { valorPago: 45000 }
      });
      expect(receber.statusCode).toBe(200);
      expect(receber.json().estado).toBe("PAGO");
    } finally {
      await app.close();
    }
  });

  it("cria conta a pagar e regista pagamento", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const conta = await app.inject({
        method: "POST",
        url: "/financas/contas-pagar",
        headers,
        payload: {
          fornecedor: "Fornecedor ABC",
          descricao: "Material de embalagem",
          valor: 30000,
          dataVencimento: new Date(Date.now() + 5 * 86400000).toISOString()
        }
      });
      expect(conta.statusCode).toBe(200);
      const id = conta.json().id;

      const pagar = await app.inject({
        method: "POST",
        url: `/financas/contas-pagar/${id}/pagar`,
        headers
      });
      expect(pagar.statusCode).toBe(200);
      expect(pagar.json().estado).toBe("PAGO");
    } finally {
      await app.close();
    }
  });

  it("obtém fluxo de caixa do período", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      // Criar alguns movimentos
      await app.inject({
        method: "POST",
        url: "/financas/movimentos",
        headers,
        payload: { tipo: "ENTRADA", descricao: "Venda A", valor: 50000 }
      });
      await app.inject({
        method: "POST",
        url: "/financas/movimentos",
        headers,
        payload: { tipo: "SAIDA", descricao: "Custo B", valor: 20000 }
      });

      const de = new Date(Date.now() - 86400000).toISOString();
      const ate = new Date(Date.now() + 86400000).toISOString();

      const fluxo = await app.inject({
        method: "GET",
        url: `/financas/fluxo-caixa?de=${de}&ate=${ate}`,
        headers
      });
      expect(fluxo.statusCode).toBe(200);
      const body = fluxo.json();
      expect(body.totalEntradas).toBeGreaterThanOrEqual(50000);
      expect(body.totalSaidas).toBeGreaterThanOrEqual(20000);
      expect(body.saldo).toBe(body.totalEntradas - body.totalSaidas);
    } finally {
      await app.close();
    }
  });

  it("emite factura com itens e calcula IVA", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const factura = await app.inject({
        method: "POST",
        url: "/financas/facturas",
        headers,
        payload: {
          clienteNome: "Cliente Teste",
          clienteNif: "123456789LA",
          itens: [
            { descricao: "Produto A", quantidade: 2, precoUnitario: 5000 },
            { descricao: "Produto B", quantidade: 1, precoUnitario: 8000 }
          ]
        }
      });
      expect(factura.statusCode).toBe(200);
      const body = factura.json();
      expect(body.serie).toBe("FT");
      expect(body.numero).toBe(1);
      expect(body.subtotal).toBe(18000); // 2*5000 + 1*8000
      expect(body.ivaPercentual).toBe(14);
      expect(body.ivaValor).toBe(2520); // 18000 * 14%
      expect(body.total).toBe(20520);
      expect(body.itens).toHaveLength(2);
    } finally {
      await app.close();
    }
  });

  it("emite segunda factura com número sequencial", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/financas/facturas",
        headers,
        payload: {
          clienteNome: "Primeiro",
          itens: [{ descricao: "Item", quantidade: 1, precoUnitario: 1000 }]
        }
      });

      const segunda = await app.inject({
        method: "POST",
        url: "/financas/facturas",
        headers,
        payload: {
          clienteNome: "Segundo",
          itens: [{ descricao: "Item", quantidade: 1, precoUnitario: 2000 }]
        }
      });
      expect(segunda.json().numero).toBe(2);
    } finally {
      await app.close();
    }
  });

  it("define orçamento e obtém orçado vs realizado", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      // Criar categoria primeiro
      await app.inject({
        method: "POST",
        url: "/financas/categorias/inicializar",
        headers
      });

      const cats = await app.inject({
        method: "GET",
        url: "/financas/categorias",
        headers
      });
      const catDespesa = cats.json().find((c: { tipo: string }) => c.tipo === "DESPESA");

      const agora = new Date();
      const orc = await app.inject({
        method: "POST",
        url: "/financas/orcamento",
        headers,
        payload: {
          categoriaId: catDespesa.id,
          mes: agora.getMonth() + 1,
          ano: agora.getFullYear(),
          valorOrcado: 500000
        }
      });
      expect(orc.statusCode).toBe(200);

      const orcVsReal = await app.inject({
        method: "GET",
        url: `/financas/orcamento-vs-realizado?mes=${agora.getMonth() + 1}&ano=${agora.getFullYear()}`,
        headers
      });
      expect(orcVsReal.statusCode).toBe(200);
      expect(orcVsReal.json().length).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });

  it("rejeita rotas financeiras sem autenticação", async () => {
    const app = await criarAplicacao();
    try {
      const resp = await app.inject({
        method: "GET",
        url: "/financas/categorias"
      });
      expect(resp.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});
