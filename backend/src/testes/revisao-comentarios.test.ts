import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Revisão manual de comentários", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("aprova comentário corrigido criando reserva e rejeita comentário sem compra", async () => {
    const app = await criarAplicacao();

    try {
      const headersAutenticados = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "A02",
          nome: "Calça piloto",
          descricao: "Peça para revisão manual",
          precoEmKwanza: 15000,
          quantidade: 1,
          fotos: []
        }
      });

      const comentarioSemTelefone = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_revisao",
          username: "maria_ao",
          displayName: "Maria",
          commentText: "meu A02"
        }
      });

      expect(comentarioSemTelefone.statusCode).toBe(201);
      expect(comentarioSemTelefone.json()).toEqual(
        expect.objectContaining({
          estado: "REVISAO_MANUAL",
          reserva: null
        })
      );

      const comentarioId = comentarioSemTelefone.json().registro.id as string;
      const aprovacao = await app.inject({
        method: "POST",
        url: `/comentarios/${comentarioId}/aprovar`,
        headers: headersAutenticados,
        payload: {
          telefone: "+244 923 111 222",
          codigoPeca: "A02",
          observacao: "Telefone confirmado no WhatsApp"
        }
      });

      expect(aprovacao.statusCode).toBe(200);
      expect(aprovacao.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          reserva: expect.objectContaining({
            codigoPeca: "A02",
            telefoneCliente: "923111222",
            estado: "WAITING_PAYMENT"
          })
        })
      );
      expect(aprovacao.json().registro).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          motivo: "Aprovado manualmente. Telefone confirmado no WhatsApp"
        })
      );
      expect(aprovacao.json().registro.interpretacao).toEqual(
        expect.objectContaining({
          phone: "923111222",
          productCode: "A02",
          requiresManualReview: false
        })
      );

      const comentarioParaRejeitar = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_revisao",
          username: "ana_ao",
          displayName: "Ana",
          commentText: "quero ver melhor"
        }
      });
      const comentarioRejeitadoId = comentarioParaRejeitar.json().registro.id as string;

      const rejeicao = await app.inject({
        method: "POST",
        url: `/comentarios/${comentarioRejeitadoId}/rejeitar`,
        headers: headersAutenticados,
        payload: { motivo: "Cliente não confirmou peça nem telefone." }
      });

      expect(rejeicao.statusCode).toBe(200);
      expect(rejeicao.json()).toEqual(
        expect.objectContaining({
          estado: "IGNORADO",
          reserva: null,
          motivo: "Cliente não confirmou peça nem telefone."
        })
      );

      const reservas = await app.inject({ method: "GET", url: "/reservas", headers: headersAutenticados });
      expect(reservas.json()).toHaveLength(1);

      const comentariosOperacionais = await app.inject({
        method: "GET",
        url: "/comentarios",
        headers: headersAutenticados
      });

      expect(comentariosOperacionais.statusCode).toBe(200);
      expect(comentariosOperacionais.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: comentarioId,
            estado: "PROCESSADO"
          })
        ])
      );
      expect(comentariosOperacionais.json()).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: comentarioRejeitadoId,
            estado: "IGNORADO"
          })
        ])
      );

      const comentariosComIgnorados = await app.inject({
        method: "GET",
        url: "/comentarios?incluirIgnorados=true",
        headers: headersAutenticados
      });
      expect(comentariosComIgnorados.statusCode).toBe(200);
      expect(comentariosComIgnorados.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: comentarioRejeitadoId,
            estado: "IGNORADO"
          })
        ])
      );

      const comentarioComTelefone = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_revisao",
          username: "cliente_com_telefone",
          displayName: "Cliente com Telefone",
          commentText: "937624786"
        }
      });

      expect(comentarioComTelefone.statusCode).toBe(201);
      expect(comentarioComTelefone.json()).toEqual(
        expect.objectContaining({
          estado: "REVISAO_MANUAL",
          reserva: null,
          registro: expect.objectContaining({
            interpretacao: expect.objectContaining({
              intent: "BUY",
              phone: "937624786",
              productCode: null
            })
          })
        })
      );

      const comentariosDepoisDoTelefone = await app.inject({
        method: "GET",
        url: "/comentarios",
        headers: headersAutenticados
      });
      expect(comentariosDepoisDoTelefone.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: comentarioComTelefone.json().registro.id,
            estado: "REVISAO_MANUAL"
          })
        ])
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000003", nome: "Vendedor" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000003", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
