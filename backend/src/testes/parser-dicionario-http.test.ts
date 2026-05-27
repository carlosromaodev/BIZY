import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923990027", nome: "Loja Parser" }
  });
  expect(respostaCodigo.statusCode).toBe(202);

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923990027", codigo: respostaCodigo.json().codigoDev }
  });
  expect(respostaSessao.statusCode).toBe(200);

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

describe("parser de comentários configurável por negócio", () => {
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

  it("processa comentário manual usando termos, rótulos e aliases definidos no negócio", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const respostaNegocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers,
        payload: {
          nomeComercial: "Loja Parser",
          segmento: "moda feminina",
          tipo: "LOJA",
          entrega: {
            parserComentarios: {
              termosIntencaoCompra: ["leva"],
              rotulosCodigoPeca: ["ref", "artigo"],
              aliasesCodigoPeca: {
                "look verde": "LV-01"
              },
              porSegmento: {
                moda_feminina: {
                  termosIntencaoCompra: ["separa"]
                }
              }
            }
          }
        }
      });
      expect(respostaNegocio.statusCode).toBe(201);

      const respostaPeca = await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo: "LV-01",
          nome: "Look verde",
          descricao: "Produto com alias usado nas lives",
          precoEmKwanza: 15_000,
          quantidade: 3,
          fotos: []
        }
      });
      expect(respostaPeca.statusCode).toBe(201);

      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_parser",
          username: "cliente_parser",
          displayName: "Cliente Parser",
          commentText: "923456789 leva look verde"
        }
      });
      expect(respostaComentario.statusCode).toBe(201);
      expect(respostaComentario.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          reserva: expect.objectContaining({
            codigoPeca: "LV-01",
            telefoneCliente: "923456789"
          })
        })
      );
    } finally {
      await app.close();
    }
  });
});
