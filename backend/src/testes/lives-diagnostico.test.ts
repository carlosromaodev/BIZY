import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Lives reais e diagnóstico SMS", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      OMBALA_API_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("inicia sessão de live, processa comentário pelo backend, encerra sessão e testa SMS em dry-run", async () => {
    const app = await criarAplicacao();

    try {
      const headersAutenticados = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "4",
          nome: "Vestido live",
          descricao: "Peça para captura real",
          precoEmKwanza: 12000,
          quantidade: 1,
          fotos: []
        }
      });

      const live = await app.inject({
        method: "POST",
        url: "/lives/iniciar",
        headers: headersAutenticados,
        payload: { liveUsername: "loja_teste", provider: "manual" }
      });

      expect(live.statusCode).toBe(201);
      const liveId = live.json().id as string;

      const painelComLive = await app.inject({ method: "GET", url: "/painel/resumo", headers: headersAutenticados });
      expect(painelComLive.statusCode).toBe(200);
      expect(painelComLive.json()).toEqual(
        expect.objectContaining({
          liveAtiva: true,
          lives: expect.arrayContaining([
            expect.objectContaining({
              id: liveId,
              status: "CONECTADA",
              comentariosRecebidos: 0
            })
          ])
        })
      );

      const comentario = await app.inject({
        method: "POST",
        url: `/lives/${liveId}/comentarios/manual`,
        headers: headersAutenticados,
        payload: {
          username: "cliente_live",
          displayName: "Cliente Live",
          commentText: "eu quero 923456789 peça 4"
        }
      });

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          reserva: expect.objectContaining({
            codigoPeca: "4",
            telefoneCliente: "923456789"
          })
        })
      );

      const painelComComentario = await app.inject({
        method: "GET",
        url: "/painel/resumo",
        headers: headersAutenticados
      });
      expect(painelComComentario.statusCode).toBe(200);
      expect(painelComComentario.json()).toEqual(
        expect.objectContaining({
          liveAtiva: true,
          comentariosRecebidos: 1,
          comentariosValidos: 1,
          lives: expect.arrayContaining([
            expect.objectContaining({
              id: liveId,
              comentariosRecebidos: 1,
              comentariosProcessados: 1
            })
          ]),
          comentarios: expect.arrayContaining([
            expect.objectContaining({
              comentario: expect.objectContaining({
                liveId,
                commentText: "eu quero 923456789 peça 4"
              })
            })
          ])
        })
      );

      const lives = await app.inject({ method: "GET", url: "/lives", headers: headersAutenticados });
      expect(lives.statusCode).toBe(200);
      expect(lives.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: liveId,
            providerNome: "manual",
            comentariosRecebidos: 1,
            comentariosProcessados: 1
          })
        ])
      );

      const sms = await app.inject({
        method: "POST",
        url: "/diagnosticos/sms/testar",
        headers: headersAutenticados,
        payload: {
          telefone: "+244 923 000 999",
          mensagem: "Teste ÉMeu",
          enviarReal: false
        }
      });

      expect(sms.statusCode).toBe(200);
      expect(sms.json()).toEqual(
        expect.objectContaining({
          ok: true,
          provider: "ombala",
          configurado: false,
          envioReal: false,
          telefone: "923000999"
        })
      );

      const parada = await app.inject({
        method: "POST",
        url: `/lives/${liveId}/parar`,
        headers: headersAutenticados
      });

      expect(parada.statusCode).toBe(200);
      expect(parada.json()).toEqual(expect.objectContaining({ sucesso: true, id: liveId }));

      const livesDepois = await app.inject({ method: "GET", url: "/lives", headers: headersAutenticados });
      expect(livesDepois.json()).toEqual([]);

      const painelDepois = await app.inject({ method: "GET", url: "/painel/resumo", headers: headersAutenticados });
      expect(painelDepois.json()).toEqual(expect.objectContaining({ liveAtiva: false, lives: [] }));
    } finally {
      await app.close();
    }
  });

  it("processa na live mattbtw comentário no formato telefone e código da peça 01", async () => {
    const app = await criarAplicacao();

    try {
      const headersAutenticados = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "01",
          nome: "Artigo 01",
          descricao: "Artigo piloto da live mattbtw",
          precoEmKwanza: 10000,
          quantidade: 2,
          fotos: []
        }
      });

      const live = await app.inject({
        method: "POST",
        url: "/lives/iniciar",
        headers: headersAutenticados,
        payload: { liveUsername: "mattbtw", provider: "manual" }
      });

      expect(live.statusCode).toBe(201);
      const liveId = live.json().id as string;

      const comentario = await app.inject({
        method: "POST",
        url: `/lives/${liveId}/comentarios/manual`,
        headers: headersAutenticados,
        payload: {
          username: "cliente_mattbtw",
          displayName: "Cliente MattBTW",
          commentText: "923456789 01"
        }
      });

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          registro: expect.objectContaining({
            interpretacao: expect.objectContaining({
              phone: "923456789",
              productCode: "01",
              requiresManualReview: false
            })
          }),
          reserva: expect.objectContaining({
            codigoPeca: "01",
            telefoneCliente: "923456789",
            estado: "WAITING_PAYMENT"
          })
        })
      );

      const painel = await app.inject({ method: "GET", url: "/painel/resumo", headers: headersAutenticados });
      expect(painel.statusCode).toBe(200);
      expect(painel.json()).toEqual(
        expect.objectContaining({
          liveAtiva: true,
          comentariosValidos: 1,
          reservasCriadas: 1,
          lives: expect.arrayContaining([
            expect.objectContaining({
              id: liveId,
              username: "mattbtw",
              comentariosProcessados: 1
            })
          ])
        })
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
    payload: { telefone: "923000004", nome: "Vendedor" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000004", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
