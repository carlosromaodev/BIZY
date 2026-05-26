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

async function criarPeca(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string,
  quantidade = 5,
  precoEmKwanza = 12_000
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Produto ${codigo}`,
      descricao: `Produto ${codigo} para pedido completo`,
      precoEmKwanza,
      quantidade,
      fotos: []
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function criarCliente(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: { telefone?: string; nome?: string; email?: string } = {}
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/clientes",
    headers,
    payload: {
      telefone: dados.telefone ?? "937624785",
      nome: dados.nome ?? "Cliente Pedido",
      email: dados.email ?? "cliente.pedido@example.com",
      consentimentoDados: true,
      tags: ["comprador"]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("pedidos HTTP", () => {
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

  it("cria pedido com vários itens, pagamento, entrega e exportação isolados por loja", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923222001", "Loja A Pedidos");
      const lojaB = await autenticar(app, "923222002", "Loja B Pedidos");

      await criarPeca(app, lojaA, "P1", 3, 12_000);
      await criarPeca(app, lojaA, "P2", 2, 5_000);
      await criarPeca(app, lojaB, "P1", 10, 99_000);
      const cliente = await criarCliente(app, lojaA);

      const respostaCriacao = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: lojaA,
        payload: {
          clienteId: cliente.id,
          itens: [
            { codigoPeca: "P1", quantidade: 2 },
            { codigoPeca: "P2", quantidade: 1, precoUnitarioEmKwanza: 4_500 }
          ],
          descontoEmKwanza: 1_000,
          motivoDesconto: "Campanha da live",
          taxaEntregaEmKwanza: 1_500,
          enderecoEntrega: "Talatona, Rua 1",
          origem: "manual",
          canal: "whatsapp",
          observacao: "Pedido criado no CRM"
        }
      });

      expect(respostaCriacao.statusCode).toBe(201);
      expect(respostaCriacao.json()).toEqual(
        expect.objectContaining({
          clienteNegocioId: cliente.id,
          estado: "AGUARDANDO_PAGAMENTO",
          estadoPagamento: "PENDENTE",
          estadoEntrega: "PENDENTE",
          subtotalEmKwanza: 28_500,
          descontoEmKwanza: 1_000,
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 29_000,
          canal: "whatsapp",
          origem: "manual"
        })
      );
      expect(respostaCriacao.json().itens).toEqual([
        expect.objectContaining({
          codigoPeca: "P1",
          quantidade: 2,
          precoUnitarioEmKwanza: 12_000,
          subtotalEmKwanza: 24_000
        }),
        expect.objectContaining({
          codigoPeca: "P2",
          quantidade: 1,
          precoUnitarioEmKwanza: 4_500,
          subtotalEmKwanza: 4_500
        })
      ]);

      const listaA = await app.inject({ method: "GET", url: "/pedidos", headers: lojaA });
      expect(listaA.statusCode).toBe(200);
      expect(listaA.json().pedidos).toEqual([expect.objectContaining({ id: respostaCriacao.json().id })]);

      const listaB = await app.inject({ method: "GET", url: "/pedidos", headers: lojaB });
      expect(listaB.statusCode).toBe(200);
      expect(listaB.json().pedidos).toEqual([]);

      const perfil = await app.inject({
        method: "GET",
        url: `/pedidos/${respostaCriacao.json().id}`,
        headers: lojaA
      });
      expect(perfil.statusCode).toBe(200);
      expect(perfil.json().pedido).toEqual(expect.objectContaining({ id: respostaCriacao.json().id }));
      expect(perfil.json().cliente).toEqual(expect.objectContaining({ id: cliente.id }));

      const perfilCruzado = await app.inject({
        method: "GET",
        url: `/pedidos/${respostaCriacao.json().id}`,
        headers: lojaB
      });
      expect(perfilCruzado.statusCode).toBe(404);

      const pagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${respostaCriacao.json().id}/confirmar-pagamento`,
        headers: lojaA,
        payload: {
          comprovativoPagamentoUrl: "https://example.com/comprovativo.png",
          observacao: "Pagamento validado pela equipa financeira"
        }
      });
      expect(pagamento.statusCode).toBe(200);
      expect(pagamento.json()).toEqual(
        expect.objectContaining({
          estado: "PAGO",
          estadoPagamento: "CONFIRMADO",
          comprovativoPagamentoUrl: "https://example.com/comprovativo.png",
          pagoEm: expect.any(String)
        })
      );

      const entrega = await app.inject({
        method: "PATCH",
        url: `/pedidos/${respostaCriacao.json().id}/entrega`,
        headers: lojaA,
        payload: {
          estadoEntrega: "ENTREGUE",
          responsavelId: "entregador_1",
          observacao: "Recebido pelo cliente"
        }
      });
      expect(entrega.statusCode).toBe(200);
      expect(entrega.json()).toEqual(
        expect.objectContaining({
          estado: "ENTREGUE",
          estadoEntrega: "ENTREGUE",
          responsavelId: "entregador_1",
          entregueEm: expect.any(String)
        })
      );

      const exportacao = await app.inject({
        method: "GET",
        url: "/pedidos/exportar.csv",
        headers: lojaA
      });
      expect(exportacao.statusCode).toBe(200);
      expect(exportacao.headers["content-type"]).toContain("text/csv");
      expect(exportacao.body).toContain("numero,cliente,telefone,estado,estadoPagamento,estadoEntrega,totalEmKwanza");
      expect(exportacao.body).toContain("Cliente Pedido");
      expect(exportacao.body).toContain("29000");
      expect(exportacao.body).toContain("2x Produto P1 (#P1) | 1x Produto P2 (#P2)");

      const exportacaoPorProduto = await app.inject({
        method: "GET",
        url: "/pedidos/exportar.csv?produto=P2",
        headers: lojaA
      });
      expect(exportacaoPorProduto.statusCode).toBe(200);
      expect(exportacaoPorProduto.body).toContain("Cliente Pedido");
      expect(exportacaoPorProduto.body).toContain("Produto P2");

      const clienteSemPedido = await criarCliente(app, lojaA, {
        telefone: "937624786",
        nome: "Cliente Sem Pedido",
        email: "cliente.sem.pedido@example.com"
      });
      const exportacaoPorCliente = await app.inject({
        method: "GET",
        url: `/pedidos/exportar.csv?clienteId=${clienteSemPedido.id}`,
        headers: lojaA
      });
      expect(exportacaoPorCliente.statusCode).toBe(200);
      expect(exportacaoPorCliente.body).not.toContain("Cliente Pedido");

      const auditoriaExportacao = await app.inject({
        method: "GET",
        url: "/auditoria/eventos?tipo=ORDERS_EXPORTED",
        headers: lojaA
      });
      expect(auditoriaExportacao.statusCode).toBe(200);
      expect(auditoriaExportacao.json().eventos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "ORDERS_EXPORTED",
            dados: expect.objectContaining({
              recurso: "pedidos",
              formato: "csv",
              quantidade: 1,
              filtros: expect.objectContaining({
                produto: "P2",
                limite: 10000
              })
            })
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("recusa desconto sem motivo e quantidade acima do stock", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923222101", "Loja A Regras Pedido");
      await criarPeca(app, lojaA, "S1", 1, 10_000);
      const cliente = await criarCliente(app, lojaA);

      const descontoSemMotivo = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: lojaA,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "S1", quantidade: 1 }],
          descontoEmKwanza: 500
        }
      });
      expect(descontoSemMotivo.statusCode).toBe(400);

      const semStock = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: lojaA,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "S1", quantidade: 2 }]
        }
      });
      expect(semStock.statusCode).toBe(400);
      expect(semStock.json().mensagem).toContain("Stock insuficiente");
    } finally {
      await app.close();
    }
  });

  it("exige motivo operacional para cancelar pedido", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222140", "Loja Cancelamento Pedido");
      await criarPeca(app, loja, "CAN-1", 2, 11_000);
      const cliente = await criarCliente(app, loja, {
        telefone: "937624790",
        nome: "Cliente Cancelamento",
        email: "cancelamento@example.com"
      });

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "CAN-1", quantidade: 1 }]
        }
      });
      expect(pedido.statusCode).toBe(201);

      const semMotivo = await app.inject({
        method: "PATCH",
        url: `/pedidos/${pedido.json().id}/estado`,
        headers: loja,
        payload: { estado: "CANCELADO" }
      });
      expect(semMotivo.statusCode).toBe(400);
      expect(semMotivo.json().mensagem).toContain("motivo");

      const comMotivo = await app.inject({
        method: "PATCH",
        url: `/pedidos/${pedido.json().id}/estado`,
        headers: loja,
        payload: {
          estado: "CANCELADO",
          observacao: "Cliente desistiu antes do pagamento."
        }
      });
      expect(comMotivo.statusCode).toBe(200);
      expect(comMotivo.json()).toEqual(
        expect.objectContaining({
          estado: "CANCELADO",
          canceladoEm: expect.any(String)
        })
      );
    } finally {
      await app.close();
    }
  });

  it("reutiliza endereço salvo do cliente ao criar pedido", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222230", "Loja Endereços Cliente");
      const cliente = await criarCliente(app, loja, {
        telefone: "937624799",
        nome: "Cliente com Endereço",
        email: "cliente.endereco@example.com"
      });
      await criarPeca(app, loja, "END-1", 3, 15_000);

      const endereco = await app.inject({
        method: "POST",
        url: `/clientes/${cliente.id}/enderecos`,
        headers: loja,
        payload: {
          rotulo: "Casa",
          endereco: "Rua 7, casa 12",
          bairro: "Talatona",
          municipio: "Belas",
          referencia: "Próximo ao mercado",
          principal: true
        }
      });
      expect(endereco.statusCode).toBe(201);
      expect(endereco.json().endereco).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          rotulo: "Casa",
          endereco: "Rua 7, casa 12",
          bairro: "Talatona",
          municipio: "Belas",
          principal: true
        })
      );

      const enderecos = await app.inject({
        method: "GET",
        url: `/clientes/${cliente.id}/enderecos`,
        headers: loja
      });
      expect(enderecos.statusCode).toBe(200);
      expect(enderecos.json().enderecos).toEqual([expect.objectContaining({ id: endereco.json().endereco.id })]);

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          enderecoEntregaId: endereco.json().endereco.id,
          itens: [{ codigoPeca: "END-1", quantidade: 1 }],
          taxaEntregaEmKwanza: 1_000,
          origem: "crm",
          canal: "whatsapp"
        }
      });
      expect(pedido.statusCode).toBe(201);
      expect(pedido.json()).toEqual(
        expect.objectContaining({
          enderecoEntrega: "Rua 7, casa 12, Talatona, Belas - Ref.: Próximo ao mercado",
          totalEmKwanza: 16_000
        })
      );
    } finally {
      await app.close();
    }
  });
});
