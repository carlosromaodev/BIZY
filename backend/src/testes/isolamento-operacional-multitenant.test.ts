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

describe("isolamento operacional multi-negócio", () => {
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

  it("não mostra reservas, comentários ou conversas de outra loja autenticada", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923111001", "Loja A");
      const lojaB = await autenticar(app, "923111002", "Loja B");

      for (const headers of [lojaA, lojaB]) {
        const respostaPeca = await app.inject({
          method: "POST",
          url: "/pecas",
          headers,
          payload: {
            codigo: "01",
            nome: "Produto 01",
            descricao: "Mesmo código em negócios diferentes",
            precoEmKwanza: 12000,
            quantidade: 1,
            fotos: []
          }
        });
        expect(respostaPeca.statusCode).toBe(201);
      }

      const respostaComentarioA = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: lojaA,
        payload: {
          liveId: "live_loja_a",
          username: "cliente_a",
          displayName: "Cliente A",
          commentText: "quero 937624785 artigo 01"
        }
      });
      expect(respostaComentarioA.statusCode).toBe(201);
      expect(respostaComentarioA.json().reserva).toEqual(
        expect.objectContaining({ codigoPeca: "01", telefoneCliente: "937624785" })
      );

      const reservasLojaB = await app.inject({ method: "GET", url: "/reservas", headers: lojaB });
      expect(reservasLojaB.statusCode).toBe(200);
      expect(reservasLojaB.json()).toEqual([]);

      const comentariosLojaB = await app.inject({ method: "GET", url: "/comentarios", headers: lojaB });
      expect(comentariosLojaB.statusCode).toBe(200);
      expect(comentariosLojaB.json()).toEqual([]);

      const conversasLojaB = await app.inject({
        method: "GET",
        url: "/atendimento/conversas",
        headers: lojaB
      });
      expect(conversasLojaB.statusCode).toBe(200);
      expect(conversasLojaB.json().conversas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("isola instâncias WhatsApp/Evolution por loja e permite nomes iguais", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ instance: { state: "connecting" } }), { status: 201 }))
    );
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923111011", "Loja A WhatsApp");
      const lojaB = await autenticar(app, "923111012", "Loja B WhatsApp");

      const instanciaA = await app.inject({
        method: "POST",
        url: "/evolution/instancias",
        headers: lojaA,
        payload: {
          nome: "principal",
          etiqueta: "WhatsApp principal A",
          telefone: "923111011",
          padrao: true
        }
      });
      expect(instanciaA.statusCode).toBe(201);

      const instanciaB = await app.inject({
        method: "POST",
        url: "/evolution/instancias",
        headers: lojaB,
        payload: {
          nome: "principal",
          etiqueta: "WhatsApp principal B",
          telefone: "923111012",
          padrao: true
        }
      });
      expect(instanciaB.statusCode).toBe(201);

      const resumoB = await app.inject({
        method: "GET",
        url: "/evolution/resumo",
        headers: lojaB
      });
      expect(resumoB.statusCode).toBe(200);
      expect(resumoB.json().instancias).toHaveLength(1);
      expect(resumoB.json().instancias[0]).toEqual(
        expect.objectContaining({
          etiqueta: "WhatsApp principal B",
          telefone: "244923111012"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("não mostra outbox WhatsApp de outra loja", async () => {
    process.env = {
      ...process.env,
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "evolution",
      EVOLUTION_API_URL: "http://127.0.0.1:1",
      EVOLUTION_API_KEY: "teste",
      EVOLUTION_INSTANCE: "fallback",
      EVOLUTION_RETRY_ATTEMPTS: "1",
      WHATSAPP_OUTBOX_INTERVALO_MS: "0",
      WHATSAPP_OUTBOX_ATRASO_INICIAL_MS: "0"
    };
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923111021", "Loja A Outbox");
      const lojaB = await autenticar(app, "923111022", "Loja B Outbox");

      const respostaPeca = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: lojaA,
        payload: {
          codigo: "W1",
          nome: "Produto WhatsApp",
          descricao: "Gera falha de envio para outbox",
          precoEmKwanza: 12000,
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
          liveId: "live_outbox",
          username: "cliente_outbox",
          displayName: "Cliente Outbox",
          commentText: "quero 937624785 artigo W1"
        }
      });
      expect(respostaComentario.statusCode).toBe(201);

      await new Promise((resolve) => setTimeout(resolve, 25));

      const outboxLojaA = await app.inject({
        method: "GET",
        url: "/automacoes/whatsapp/outbox",
        headers: lojaA
      });
      expect(outboxLojaA.statusCode).toBe(200);
      expect(outboxLojaA.json()).toEqual([
        expect.objectContaining({
          telefone: "937624785",
          tipo: "RESERVA_CRIADA"
        })
      ]);

      const outboxLojaB = await app.inject({
        method: "GET",
        url: "/automacoes/whatsapp/outbox",
        headers: lojaB
      });
      expect(outboxLojaB.statusCode).toBe(200);
      expect(outboxLojaB.json()).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
