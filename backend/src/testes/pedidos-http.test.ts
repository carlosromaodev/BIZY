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
          observacao: "Pedido criado no Team"
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
          totalEmKwanza: 32_850,
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

      const funilPedido = await app.inject({
        method: "GET",
        url: `/funil/movimentos?entidadeTipo=pedido&entidadeId=${respostaCriacao.json().id}`,
        headers: lojaA
      });
      expect(funilPedido.statusCode).toBe(200);
      expect(funilPedido.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "ENTREGA",
          etapaNova: "ENTREGUE",
          origem: "pedido",
          motivo: "Pedido entregue ao cliente."
        }),
        expect.objectContaining({
          etapaAnterior: "PAGO",
          etapaNova: "ENTREGA",
          origem: "pedido",
          motivo: "Pedido entrou no fluxo de entrega."
        }),
        expect.objectContaining({
          etapaAnterior: "PAGAMENTO_PENDENTE",
          etapaNova: "PAGO",
          origem: "pedido",
          motivo: "Pagamento confirmado."
        }),
        expect.objectContaining({
          etapaAnterior: "PEDIDO",
          etapaNova: "PAGAMENTO_PENDENTE",
          origem: "pedido",
          motivo: "Pedido aguardando pagamento."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "PEDIDO",
          origem: "pedido",
          motivo: "Pedido criado."
        })
      ]);

      const auditoriaPedido = await app.inject({
        method: "GET",
        url: "/operacional/auditoria?topico=pedidos",
        headers: lojaA
      });
      expect(auditoriaPedido.statusCode).toBe(200);
      expect(auditoriaPedido.json().logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "PAGAMENTO_CONFIRMADO",
            entidadeTipo: "pedido",
            entidadeId: respostaCriacao.json().id,
            payload: expect.objectContaining({
              atorUsuarioId: expect.any(String),
              motivo: "Pagamento validado pela equipa financeira",
              alteracoes: expect.objectContaining({
                estadoPagamento: { antes: "PENDENTE", depois: "CONFIRMADO" },
                estado: { antes: "AGUARDANDO_PAGAMENTO", depois: "PAGO" }
              })
            })
          }),
          expect.objectContaining({
            tipo: "ENTREGA_ATUALIZADA",
            entidadeTipo: "pedido",
            entidadeId: respostaCriacao.json().id,
            payload: expect.objectContaining({
              atorUsuarioId: expect.any(String),
              motivo: "Recebido pelo cliente",
              alteracoes: expect.objectContaining({
                estadoEntrega: { antes: "PENDENTE", depois: "ENTREGUE" }
              })
            })
          })
        ])
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
      expect(exportacao.body).toContain("32850");
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

  it("pagina pedidos com metadados padronizados para operacao com volume", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222030", "Loja Pedidos Paginados");
      await criarPeca(app, loja, "PAG-1", 100, 7_500);
      const cliente = await criarCliente(app, loja, {
        telefone: "937626030",
        nome: "Cliente Pedidos Paginados",
        email: "cliente.paginado@example.com"
      });

      for (let indice = 0; indice < 23; indice += 1) {
        const pedido = await app.inject({
          method: "POST",
          url: "/pedidos",
          headers: loja,
          payload: {
            clienteId: cliente.id,
            itens: [{ codigoPeca: "PAG-1", quantidade: 1 }],
            origem: "team",
            canal: indice % 2 === 0 ? "whatsapp" : "loja",
            observacao: `Pedido paginado ${indice + 1}`
          }
        });
        expect(pedido.statusCode).toBe(201);
      }

      const paginaIntermedia = await app.inject({
        method: "GET",
        url: "/pedidos?limite=7&offset=14",
        headers: loja
      });

      expect(paginaIntermedia.statusCode).toBe(200);
      expect(paginaIntermedia.json().pedidos).toHaveLength(7);
      expect(paginaIntermedia.json().paginacao).toEqual({
        total: 23,
        limite: 7,
        offset: 14,
        temProxima: true,
        temAnterior: true,
        proximoOffset: 21,
        anteriorOffset: 7
      });

      const ultimaPagina = await app.inject({
        method: "GET",
        url: "/pedidos?limite=7&offset=21",
        headers: loja
      });

      expect(ultimaPagina.statusCode).toBe(200);
      expect(ultimaPagina.json().pedidos).toHaveLength(2);
      expect(ultimaPagina.json().paginacao).toEqual(
        expect.objectContaining({
          total: 23,
          limite: 7,
          offset: 21,
          temProxima: false,
          temAnterior: true,
          proximoOffset: null,
          anteriorOffset: 14
        })
      );
    } finally {
      await app.close();
    }
  });

  it("mostra pedido e artigo na aba pedidos quando comentário da live cria reserva", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222181", "Loja Pedidos Live");
      await criarPeca(app, loja, "LIVE-77", 2, 21_000);

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: loja,
        payload: {
          liveId: "live_pedidos_visiveis",
          provider: "tiktok-live-connector",
          username: "cliente_pedido_live",
          displayName: "Cliente Pedido Live",
          commentText: "quero produto LIVE-77 937624792"
        }
      });
      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().reserva).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          codigoPeca: "LIVE-77",
          clienteNegocioId: expect.any(String)
        })
      );

      const pedidos = await app.inject({ method: "GET", url: "/pedidos", headers: loja });
      expect(pedidos.statusCode).toBe(200);
      expect(pedidos.json().pedidos).toEqual([
        expect.objectContaining({
          reservaId: comentario.json().reserva.id,
          clienteNegocioId: comentario.json().reserva.clienteNegocioId,
          origem: "live",
          canal: "tiktok",
          totalEmKwanza: 23_940,
          itens: [
            expect.objectContaining({
              codigoPeca: "LIVE-77",
              nomeProduto: "Produto LIVE-77",
              quantidade: 1,
              precoUnitarioEmKwanza: 21_000
            })
          ]
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("cria pedido automaticamente quando comentário tem telefone e id do artigo sem verbo de compra", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222182", "Loja Pedidos Sem Verbo");
      await criarPeca(app, loja, "AUTO-ID", 2, 17_000);

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: loja,
        payload: {
          liveId: "live_pedidos_sem_verbo",
          provider: "tiktok-live-connector",
          username: "cliente_pedido_sem_verbo",
          displayName: "Cliente Pedido Sem Verbo",
          commentText: "o meu contacto é 937624793 e o id é AUTO-ID"
        }
      });

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          reserva: expect.objectContaining({
            codigoPeca: "AUTO-ID",
            telefoneCliente: "937624793"
          }),
          pedido: expect.objectContaining({
            origem: "live",
            canal: "tiktok",
            totalEmKwanza: 19_380
          })
        })
      );

      const pedidos = await app.inject({ method: "GET", url: "/pedidos", headers: loja });
      expect(pedidos.statusCode).toBe(200);
      expect(pedidos.json().pedidos).toEqual([
        expect.objectContaining({
          reservaId: comentario.json().reserva.id,
          itens: [
            expect.objectContaining({
              codigoPeca: "AUTO-ID",
              quantidade: 1
            })
          ]
        })
      ]);
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

      const auditoriaCancelamento = await app.inject({
        method: "GET",
        url: "/operacional/auditoria?topico=pedidos&tipo=PEDIDO_CANCELADO",
        headers: loja
      });
      expect(auditoriaCancelamento.statusCode).toBe(200);
      expect(auditoriaCancelamento.json().logs).toEqual([
        expect.objectContaining({
          tipo: "PEDIDO_CANCELADO",
          entidadeTipo: "pedido",
          entidadeId: pedido.json().id,
          payload: expect.objectContaining({
            atorUsuarioId: expect.any(String),
            motivo: "Cliente desistiu antes do pagamento.",
            alteracoes: expect.objectContaining({
              estado: { antes: "AGUARDANDO_PAGAMENTO", depois: "CANCELADO" }
            })
          })
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("mantém conversão de reserva idempotente quando a live já criou o pedido", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222180", "Loja Conversão Reserva");
      await criarPeca(app, loja, "901", 3, 18_000);

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: loja,
        payload: {
          liveId: "live_converte_reserva",
          username: "cliente_reserva_pedido",
          displayName: "Cliente Reserva Pedido",
          commentText: "quero 901 937624791"
        }
      });
      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().reserva).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          codigoPeca: "901",
          clienteNegocioId: expect.any(String)
        })
      );

      const conversao = await app.inject({
        method: "POST",
        url: `/reservas/${comentario.json().reserva.id}/converter-pedido`,
        headers: loja,
        payload: {
          taxaEntregaEmKwanza: 1_500,
          enderecoEntrega: "Benfica, Rua da Live",
          observacao: "Reserva da live convertida no Team."
        }
      });
      expect(conversao.statusCode).toBe(200);
      expect(conversao.json()).toEqual(
        expect.objectContaining({
          convertido: false,
          pedido: expect.objectContaining({
            reservaId: comentario.json().reserva.id,
            clienteNegocioId: comentario.json().reserva.clienteNegocioId,
            origem: "live",
            canal: "manual",
            totalEmKwanza: 20_520,
            enderecoEntrega: null
          })
        })
      );
      expect(conversao.json().pedido.itens).toEqual([
        expect.objectContaining({
          codigoPeca: "901",
          quantidade: 1,
          precoUnitarioEmKwanza: 18_000
        })
      ]);

      const repetida = await app.inject({
        method: "POST",
        url: `/reservas/${comentario.json().reserva.id}/converter-pedido`,
        headers: loja,
        payload: {
          taxaEntregaEmKwanza: 1_500,
          enderecoEntrega: "Benfica, Rua da Live"
        }
      });
      expect(repetida.statusCode).toBe(200);
      expect(repetida.json()).toEqual(
        expect.objectContaining({
          convertido: false,
          pedido: expect.objectContaining({ id: conversao.json().pedido.id })
        })
      );

      const pedidos = await app.inject({ method: "GET", url: "/pedidos", headers: loja });
      expect(pedidos.statusCode).toBe(200);
      expect(pedidos.json().pedidos).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("ajusta e remove itens do pedido antes do pagamento validando stock livre", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222181", "Loja Ajuste Itens");
      await criarPeca(app, loja, "A1", 5, 10_000);
      await criarPeca(app, loja, "B1", 2, 4_000);
      await criarPeca(app, loja, "C1", 1, 7_000);
      const cliente = await criarCliente(app, loja, {
        telefone: "937624781",
        nome: "Cliente Ajuste Itens",
        email: "cliente.ajuste@example.com"
      });

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [
            { codigoPeca: "A1", quantidade: 1 },
            { codigoPeca: "B1", quantidade: 1 }
          ],
          taxaEntregaEmKwanza: 1_000,
          observacao: "Pedido inicial"
        }
      });
      expect(pedido.statusCode).toBe(201);

      const bloqueadorStock = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "C1", quantidade: 1 }],
          observacao: "Consome todo o stock de C1"
        }
      });
      expect(bloqueadorStock.statusCode).toBe(201);

      const ajuste = await app.inject({
        method: "PATCH",
        url: `/pedidos/${pedido.json().id}/itens`,
        headers: loja,
        payload: {
          itens: [{ codigoPeca: "A1", quantidade: 3 }],
          observacao: "Cliente removeu B1 e aumentou A1"
        }
      });
      expect(ajuste.statusCode).toBe(200);
      expect(ajuste.json()).toEqual(
        expect.objectContaining({
          id: pedido.json().id,
          subtotalEmKwanza: 30_000,
          taxaEntregaEmKwanza: 1_000,
          totalEmKwanza: 35_200,
          observacao: "Cliente removeu B1 e aumentou A1"
        })
      );
      expect(ajuste.json().itens).toEqual([
        expect.objectContaining({
          codigoPeca: "A1",
          quantidade: 3,
          subtotalEmKwanza: 30_000
        })
      ]);

      const semStock = await app.inject({
        method: "PATCH",
        url: `/pedidos/${pedido.json().id}/itens`,
        headers: loja,
        payload: {
          itens: [{ codigoPeca: "C1", quantidade: 1 }],
          observacao: "Tentativa sem stock"
        }
      });
      expect(semStock.statusCode).toBe(400);
      expect(semStock.json().mensagem).toContain("Stock insuficiente");
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
          origem: "team",
          canal: "whatsapp"
        }
      });
      expect(pedido.statusCode).toBe(201);
      expect(pedido.json()).toEqual(
        expect.objectContaining({
          enderecoEntrega: "Rua 7, casa 12, Talatona, Belas - Ref.: Próximo ao mercado",
          totalEmKwanza: 18_100
        })
      );
    } finally {
      await app.close();
    }
  });

  it("registra comprovativo, rejeita, confirma pagamento e expõe recibo com histórico", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923222240", "Loja Histórico Pagamento");
      await criarPeca(app, loja, "PAY-1", 4, 18_000);
      const cliente = await criarCliente(app, loja, {
        telefone: "937624780",
        nome: "Cliente Pagamento",
        email: "cliente.pagamento@example.com"
      });

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "PAY-1", quantidade: 1 }],
          taxaEntregaEmKwanza: 2_000,
          origem: "team",
          canal: "whatsapp"
        }
      });
      expect(pedido.statusCode).toBe(201);
      const pedidoId = pedido.json().id;

      const comprovativo = await app.inject({
        method: "POST",
        url: `/pedidos/${pedidoId}/comprovativo`,
        headers: loja,
        payload: {
          comprovativoPagamentoUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
          observacao: "Cliente enviou comprovativo pelo WhatsApp"
        }
      });
      expect(comprovativo.statusCode).toBe(200);
      expect(comprovativo.json()).toEqual(
        expect.objectContaining({
          estadoPagamento: "COMPROVATIVO_RECEBIDO",
          comprovativoPagamentoUrl: expect.stringMatching(/^\/media\/files\/comprovativos-pagamento\//),
          observacao: "Cliente enviou comprovativo pelo WhatsApp"
        })
      );

      const rejeicao = await app.inject({
        method: "POST",
        url: `/pedidos/${pedidoId}/rejeitar-pagamento`,
        headers: loja,
        payload: {
          motivo: "Comprovativo ilegível, solicitar novo ficheiro."
        }
      });
      expect(rejeicao.statusCode).toBe(200);
      expect(rejeicao.json()).toEqual(
        expect.objectContaining({
          estado: "AGUARDANDO_PAGAMENTO",
          estadoPagamento: "REJEITADO",
          observacao: "Comprovativo ilegível, solicitar novo ficheiro."
        })
      );

      const confirmacao = await app.inject({
        method: "POST",
        url: `/pedidos/${pedidoId}/confirmar-pagamento`,
        headers: loja,
        payload: {
          comprovativoPagamentoUrl: "https://example.com/comprovativo-validado.png",
          observacao: "Segundo comprovativo validado pelo financeiro"
        }
      });
      expect(confirmacao.statusCode).toBe(200);
      expect(confirmacao.json()).toEqual(
        expect.objectContaining({
          estado: "PAGO",
          estadoPagamento: "CONFIRMADO",
          comprovativoPagamentoUrl: "https://example.com/comprovativo-validado.png"
        })
      );

      const recibo = await app.inject({
        method: "GET",
        url: `/pedidos/${pedidoId}/recibo`,
        headers: loja
      });
      expect(recibo.statusCode).toBe(200);
      expect(recibo.json().recibo).toEqual(
        expect.objectContaining({
          pedidoId,
          numero: pedido.json().numero,
          cliente: expect.objectContaining({ nome: "Cliente Pagamento", telefone: "937624780" }),
          totalEmKwanza: 22_520,
          estadoPagamento: "CONFIRMADO",
          comprovativoPagamentoUrl: "https://example.com/comprovativo-validado.png",
          itens: [expect.objectContaining({ codigoPeca: "PAY-1", quantidade: 1 })]
        })
      );

      const historico = await app.inject({
        method: "GET",
        url: `/pedidos/${pedidoId}/historico-pagamento`,
        headers: loja
      });
      expect(historico.statusCode).toBe(200);
      expect(historico.json().eventos.map((evento: { tipo: string }) => evento.tipo)).toEqual(
        expect.arrayContaining(["COMPROVATIVO_RECEBIDO", "PAGAMENTO_REJEITADO", "PAGAMENTO_CONFIRMADO"])
      );
      expect(historico.json().eventos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "PAGAMENTO_REJEITADO",
            payload: expect.objectContaining({ motivo: "Comprovativo ilegível, solicitar novo ficheiro." })
          })
        ])
      );
    } finally {
      await app.close();
    }
  });
});
