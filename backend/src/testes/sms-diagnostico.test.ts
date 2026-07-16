import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Diagnósticos SMS Ombala", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      OMBALA_API_BASE_URL: "https://sms.local",
      OMBALA_API_TOKEN: "token",
      OMBALA_SMS_SENDER_AUTH: "BIZYCODE",
      OMBALA_SMS_APPROVED_SENDERS: "BIZYCODE,BIZYCARE,BIZYLIVE,BIZYSHOP"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
    vi.unstubAllGlobals();
  });

  it("consulta visão geral do provider e envia SMS real com payload normalizado quando autorizado", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const destino = String(url);

      if (destino.endsWith("/v1/senders/approved")) {
        return new Response(JSON.stringify([{ name: "BIZYCODE" }]), { status: 200 });
      }

      if (destino.endsWith("/v1/credits")) {
        return new Response(JSON.stringify({ data: { saldo: "42" } }), { status: 200 });
      }

      if (destino.endsWith("/v1/messages") && init?.method === "POST") {
        return new Response(JSON.stringify({ message_id: "sms_live_1" }), { status: 201 });
      }

      return new Response(JSON.stringify({ message: "não esperado" }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const overview = await app.inject({ method: "GET", url: "/diagnosticos/sms/overview", headers });
      expect(overview.statusCode).toBe(200);
      expect(overview.json()).toEqual(
        expect.objectContaining({
          configurado: true,
          providerStatus: "ok",
          creditos: 42,
          remetentesAprovados: ["BIZYCODE"],
          remetentesPorFinalidade: {
            AUTENTICACAO: "BIZYCODE",
            SUPORTE: "BIZYCARE",
            LIVE: "BIZYLIVE",
            MARKET: "BIZYSHOP"
          }
        })
      );

      const envio = await app.inject({
        method: "POST",
        url: "/diagnosticos/sms/testar",
        headers,
        payload: {
          telefone: "+244 937 624 786",
          remetente: "BIZYCODE",
          mensagem: "Teste Bizy",
          enviarReal: true
        }
      });

      expect(envio.statusCode).toBe(200);
      expect(envio.json()).toEqual(
        expect.objectContaining({
          ok: true,
          status: 201,
          idExterno: "sms_live_1",
          telefone: "937624786"
        })
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "https://sms.local/v1/messages",
        expect.objectContaining({
          body: JSON.stringify({
            message: "Teste Bizy",
            from: "BIZYCODE",
            to: "937624786"
          })
        })
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const telefone = "923000010";
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome: "Vendedor SMS" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
