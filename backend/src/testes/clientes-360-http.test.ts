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
      expect(exportacao.body).toContain("telefone,nome,email,estadoRelacionamento");
      expect(exportacao.body).toContain("937624785,Cliente A,cliente.a@example.com,BLOQUEADO");
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
