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

describe("clientes 360 HTTP", () => {
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

  it("cria, lista, atualiza e exporta clientes isolados por loja", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923111101", "Loja A Clientes");
      const lojaB = await autenticar(app, "923111102", "Loja B Clientes");

      const clienteA = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: lojaA,
        payload: {
          telefone: "937624785",
          nome: "Cliente A",
          email: "cliente.a@example.com",
          tags: ["vip"],
          consentimentoMarketing: true,
          consentimentoDados: true
        }
      });
      expect(clienteA.statusCode).toBe(201);
      expect(clienteA.json()).toEqual(
        expect.objectContaining({
          telefone: "937624785",
          nome: "Cliente A",
          tags: ["vip"],
          estadoRelacionamento: "ATIVO",
          consentimentoMarketing: true,
          consentimentoDados: true
        })
      );
      expect(clienteA.json().negocioId).toBeTruthy();

      const clienteB = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: lojaB,
        payload: {
          telefone: "937624785",
          nome: "Cliente B",
          tags: ["retorno"]
        }
      });
      expect(clienteB.statusCode).toBe(201);

      const listaA = await app.inject({ method: "GET", url: "/clientes", headers: lojaA });
      expect(listaA.statusCode).toBe(200);
      expect(listaA.json().clientes).toEqual([
        expect.objectContaining({
          id: clienteA.json().id,
          nome: "Cliente A",
          telefone: "937624785"
        })
      ]);

      const listaB = await app.inject({ method: "GET", url: "/clientes", headers: lojaB });
      expect(listaB.statusCode).toBe(200);
      expect(listaB.json().clientes).toEqual([
        expect.objectContaining({
          id: clienteB.json().id,
          nome: "Cliente B",
          telefone: "937624785"
        })
      ]);

      const atualizacao = await app.inject({
        method: "PATCH",
        url: `/clientes/${clienteA.json().id}`,
        headers: lojaA,
        payload: {
          estadoRelacionamento: "BLOQUEADO",
          tags: ["vip", "sem_whatsapp"],
          consentimentoMarketing: false
        }
      });
      expect(atualizacao.statusCode).toBe(200);
      expect(atualizacao.json()).toEqual(
        expect.objectContaining({
          id: clienteA.json().id,
          estadoRelacionamento: "BLOQUEADO",
          tags: ["vip", "sem_whatsapp"],
          consentimentoMarketing: false,
          consentimentoDados: true
        })
      );

      const perfilA = await app.inject({
        method: "GET",
        url: `/clientes/${clienteA.json().id}`,
        headers: lojaA
      });
      expect(perfilA.statusCode).toBe(200);
      expect(perfilA.json().cliente).toEqual(expect.objectContaining({ nome: "Cliente A" }));
      expect(perfilA.json().metricas).toEqual(
        expect.objectContaining({
          totalReservas: 0,
          totalMensagens: 0
        })
      );

      const perfilCruzado = await app.inject({
        method: "GET",
        url: `/clientes/${clienteA.json().id}`,
        headers: lojaB
      });
      expect(perfilCruzado.statusCode).toBe(404);

      const exportacao = await app.inject({
        method: "GET",
        url: "/clientes/exportar.csv",
        headers: lojaA
      });
      expect(exportacao.statusCode).toBe(200);
      expect(exportacao.headers["content-type"]).toContain("text/csv");
      expect(exportacao.body).toContain(
        "telefone,nome,email,username,origem,estadoRelacionamento,consentimentoMarketing,consentimentoDados,tags"
      );
      expect(exportacao.body).toContain("937624785,Cliente A,cliente.a@example.com,,manual,BLOQUEADO,false,true");
      expect(exportacao.body).not.toContain("Cliente B");

      const auditoriaExportacao = await app.inject({
        method: "GET",
        url: "/auditoria/eventos?tipo=CLIENTS_EXPORTED",
        headers: lojaA
      });
      expect(auditoriaExportacao.statusCode).toBe(200);
      expect(auditoriaExportacao.json().eventos).toEqual([
        expect.objectContaining({
          tipo: "CLIENTS_EXPORTED",
          dados: expect.objectContaining({
            recurso: "clientes",
            formato: "csv",
            quantidade: 1,
            filtros: expect.objectContaining({
              limite: 10000
            })
          })
        })
      ]);
      expect(auditoriaExportacao.json().eventos[0].dados.negocioId).toBe(clienteA.json().negocioId);
      expect(auditoriaExportacao.json().eventos[0].dados.usuarioId).toBeTruthy();
    } finally {
      await app.close();
    }
  });

  it("cadastra cliente manual com WhatsApp, notas e endereço inicial", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923111109", "Loja Cliente Manual Completo");

      const resposta = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: loja,
        payload: {
          whatsapp: "937624733",
          nome: "Cliente completo",
          origem: "balcao",
          notas: "Prefere entrega no fim da tarde e atendimento por WhatsApp.",
          enderecoEntrega: "Rua da Samba, casa 42",
          bairroEntrega: "Samba",
          municipioEntrega: "Luanda",
          referenciaEntrega: "Portão verde",
          consentimentoDados: true,
          consentimentoMarketing: true
        }
      });

      expect(resposta.statusCode).toBe(201);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          telefone: "937624733",
          nome: "Cliente completo",
          origem: "balcao",
          consentimentoDados: true,
          consentimentoMarketing: true
        })
      );
      expect(resposta.json().preferencias).toEqual(
        expect.objectContaining({
          whatsapp: "937624733",
          notasInternas: "Prefere entrega no fim da tarde e atendimento por WhatsApp."
        })
      );
      expect(resposta.json().enderecos).toEqual([
        expect.objectContaining({
          endereco: "Rua da Samba, casa 42",
          bairro: "Samba",
          municipio: "Luanda",
          referencia: "Portão verde",
          principal: true
        })
      ]);

      const enderecos = await app.inject({
        method: "GET",
        url: `/clientes/${resposta.json().id}/enderecos`,
        headers: loja
      });
      expect(enderecos.statusCode).toBe(200);
      expect(enderecos.json().enderecos[0]).toEqual(
        expect.objectContaining({
          endereco: "Rua da Samba, casa 42",
          principal: true
        })
      );
    } finally {
      await app.close();
    }
  });

  it("pagina clientes com metadados padronizados para bases com volume", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923111130", "Loja Clientes Paginados");

      for (let indice = 0; indice < 25; indice += 1) {
        const cliente = await app.inject({
          method: "POST",
          url: "/clientes",
          headers: loja,
          payload: {
            telefone: `937625${String(indice).padStart(3, "0")}`,
            nome: `Cliente Volume ${String(indice + 1).padStart(2, "0")}`,
            origem: indice % 2 === 0 ? "instagram" : "whatsapp",
            tags: indice % 3 === 0 ? ["volume", "vip"] : ["volume"],
            consentimentoDados: true,
            consentimentoMarketing: indice % 2 === 0
          }
        });
        expect(cliente.statusCode).toBe(201);
      }

      const paginaIntermedia = await app.inject({
        method: "GET",
        url: "/clientes?limite=10&offset=10&tag=volume",
        headers: loja
      });

      expect(paginaIntermedia.statusCode).toBe(200);
      expect(paginaIntermedia.json().clientes).toHaveLength(10);
      expect(paginaIntermedia.json().paginacao).toEqual({
        total: 25,
        limite: 10,
        offset: 10,
        temProxima: true,
        temAnterior: true,
        proximoOffset: 20,
        anteriorOffset: 0
      });

      const ultimaPagina = await app.inject({
        method: "GET",
        url: "/clientes?limite=10&offset=20&tag=volume",
        headers: loja
      });

      expect(ultimaPagina.statusCode).toBe(200);
      expect(ultimaPagina.json().clientes).toHaveLength(5);
      expect(ultimaPagina.json().paginacao).toEqual(
        expect.objectContaining({
          total: 25,
          limite: 10,
          offset: 20,
          temProxima: false,
          temAnterior: true,
          proximoOffset: null,
          anteriorOffset: 10
        })
      );
    } finally {
      await app.close();
    }
  });

  it("exporta clientes filtrados para operação e marketing autorizado", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923111150", "Loja Segmentos Export");

      const clienteAutorizado = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: loja,
        payload: {
          telefone: "937624781",
          nome: "Cliente Marketing Autorizado",
          email: "marketing.autorizado@example.com",
          username: "autorizado_live",
          origem: "instagram",
          tags: ["newsletter", "vip"],
          consentimentoMarketing: true,
          consentimentoDados: true
        }
      });
      expect(clienteAutorizado.statusCode).toBe(201);

      const clienteSemConsentimento = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: loja,
        payload: {
          telefone: "937624782",
          nome: "Cliente Marketing Bloqueado",
          tags: ["newsletter"],
          consentimentoMarketing: false,
          consentimentoDados: true
        }
      });
      expect(clienteSemConsentimento.statusCode).toBe(201);

      const clienteInativo = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: loja,
        payload: {
          telefone: "937624783",
          nome: "Cliente Marketing Inativo",
          tags: ["newsletter"],
          consentimentoMarketing: true,
          consentimentoDados: true,
          estadoRelacionamento: "INATIVO"
        }
      });
      expect(clienteInativo.statusCode).toBe(201);

      const exportacao = await app.inject({
        method: "GET",
        url:
          "/clientes/exportar.csv?consentimentoMarketing=true&tag=newsletter&estadoRelacionamento=ATIVO&busca=Marketing%20Autorizado",
        headers: loja
      });
      expect(exportacao.statusCode).toBe(200);
      expect(exportacao.body).toContain(
        "telefone,nome,email,username,origem,estadoRelacionamento,consentimentoMarketing,consentimentoDados,tags"
      );
      expect(exportacao.body).toContain(
        "937624781,Cliente Marketing Autorizado,marketing.autorizado@example.com,autorizado_live,instagram,ATIVO,true,true,newsletter|vip"
      );
      expect(exportacao.body).not.toContain("Cliente Marketing Bloqueado");
      expect(exportacao.body).not.toContain("Cliente Marketing Inativo");

      const auditoriaExportacao = await app.inject({
        method: "GET",
        url: "/auditoria/eventos?tipo=CLIENTS_EXPORTED",
        headers: loja
      });
      expect(auditoriaExportacao.statusCode).toBe(200);
      expect(auditoriaExportacao.json().eventos).toEqual([
        expect.objectContaining({
          tipo: "CLIENTS_EXPORTED",
          dados: expect.objectContaining({
            quantidade: 1,
            filtros: {
              limite: 10000,
              busca: "Marketing Autorizado",
              tag: "newsletter",
              estadoRelacionamento: "ATIVO",
              consentimentoMarketing: true
            }
          })
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("calcula indicadores comerciais completos por cliente", async () => {
    process.env = {
      ...process.env,
      MINUTOS_RESERVA: "0"
    };
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923111170", "Loja Métricas Cliente");

      const cliente = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: loja,
        payload: {
          telefone: "937624790",
          nome: "Cliente Métricas",
          consentimentoMarketing: true,
          consentimentoDados: true
        }
      });
      expect(cliente.statusCode).toBe(201);

      const pecaPedido = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: loja,
        payload: {
          codigo: "CLI-MET-1",
          nome: "Produto métrica",
          descricao: "Produto para métricas do cliente",
          precoEmKwanza: 20_000,
          custoEmKwanza: 12_000,
          quantidade: 5,
          fotos: []
        }
      });
      expect(pecaPedido.statusCode).toBe(201);

      const pecaReserva = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: loja,
        payload: {
          codigo: "77",
          nome: "Produto reserva",
          descricao: "Produto para reserva expirada",
          precoEmKwanza: 10_000,
          custoEmKwanza: 6_000,
          quantidade: 3,
          fotos: []
        }
      });
      expect(pecaReserva.statusCode).toBe(201);

      const pedidoPago = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.json().id,
          itens: [{ codigoPeca: "CLI-MET-1", quantidade: 2 }],
          taxaEntregaEmKwanza: 1_500,
          origem: "site",
          canal: "site"
        }
      });
      expect(pedidoPago.statusCode).toBe(201);

      const pagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${pedidoPago.json().id}/confirmar-pagamento`,
        headers: loja,
        payload: { observacao: "Pagamento validado" }
      });
      expect(pagamento.statusCode).toBe(200);

      const pedidoCancelado = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.json().id,
          itens: [{ codigoPeca: "CLI-MET-1", quantidade: 1 }],
          origem: "whatsapp",
          canal: "whatsapp"
        }
      });
      expect(pedidoCancelado.statusCode).toBe(201);

      const cancelamento = await app.inject({
        method: "PATCH",
        url: `/pedidos/${pedidoCancelado.json().id}/estado`,
        headers: loja,
        payload: {
          estado: "CANCELADO",
          observacao: "Cliente desistiu antes do pagamento"
        }
      });
      expect(cancelamento.statusCode).toBe(200);

      const comentarioReserva = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: loja,
        payload: {
          liveId: "live_metricas_cliente",
          username: "cliente_metricas",
          displayName: "Cliente Métricas",
          commentText: "quero 77 937624790"
        }
      });
      expect(comentarioReserva.statusCode).toBe(201);

      await new Promise((resolve) => setTimeout(resolve, 1));
      const expiracao = await app.inject({
        method: "POST",
        url: "/reservas/expirar",
        headers: loja
      });
      expect(expiracao.statusCode).toBe(200);
      expect(expiracao.json().expiradas).toEqual([
        expect.objectContaining({
          telefoneCliente: "937624790",
          estado: "EXPIRED"
        })
      ]);

      const perfil = await app.inject({
        method: "GET",
        url: `/clientes/${cliente.json().id}`,
        headers: loja
      });
      expect(perfil.statusCode).toBe(200);
      expect(perfil.json().metricas).toEqual(
        expect.objectContaining({
          totalCompradoEmKwanza: 47_100,
          pedidosPagos: 1,
          pedidosCancelados: 1,
          reservasExpiradas: 1,
          ultimaCompraEm: expect.any(String)
        })
      );
      expect(perfil.json().metricas.tempoMedioPagamentoEmMinutos).toEqual(expect.any(Number));

      const lista = await app.inject({
        method: "GET",
        url: "/clientes?busca=937624790",
        headers: loja
      });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().clientes[0].metricas).toEqual(
        expect.objectContaining({
          pedidosPagos: 1,
          pedidosCancelados: 1,
          reservasExpiradas: 1,
          ultimaCompraEm: expect.any(String)
        })
      );
    } finally {
      await app.close();
    }
  });

  it("sincroniza dados do cliente a partir de comentário processado e reserva criada", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923111201", "Loja A Funil");
      const lojaB = await autenticar(app, "923111202", "Loja B Funil");

      const respostaPeca = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: lojaA,
        payload: {
          codigo: "C1",
          nome: "Produto C1",
          descricao: "Produto usado para sincronizar Cliente 360",
          precoEmKwanza: 12500,
          quantidade: 1,
          fotos: []
        }
      });
      expect(respostaPeca.statusCode).toBe(201);

      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: lojaA,
        payload: {
          liveId: "live_cliente_360",
          username: "cliente_live",
          userId: "user_live_123",
          displayName: "Cliente Live",
          avatarUrl: "https://example.com/avatar.png",
          commentText: "quero 937624785 artigo C1"
        }
      });
      expect(respostaComentario.statusCode).toBe(201);
      expect(respostaComentario.json().reserva).toEqual(
        expect.objectContaining({
          codigoPeca: "C1",
          telefoneCliente: "937624785",
          clienteNegocioId: expect.any(String)
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 25));

      const listaA = await app.inject({
        method: "GET",
        url: "/clientes?busca=937624785",
        headers: lojaA
      });
      expect(listaA.statusCode).toBe(200);
      expect(listaA.json().clientes).toEqual([
        expect.objectContaining({
          telefone: "937624785",
          nome: "Cliente Live",
          username: "cliente_live",
          userId: "user_live_123",
          avatarUrl: "https://example.com/avatar.png",
          origem: "comentario_live",
          metricas: expect.objectContaining({
            totalReservas: 1,
            reservasAtivas: 1,
            totalMensagens: expect.any(Number)
          })
        })
      ]);
      expect(listaA.json().clientes[0].metricas.totalMensagens).toBeGreaterThanOrEqual(2);

      const listaB = await app.inject({
        method: "GET",
        url: "/clientes?busca=937624785",
        headers: lojaB
      });
      expect(listaB.statusCode).toBe(200);
      expect(listaB.json().clientes).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
