import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvedorWhatsAppCloudApi } from "../infra/provedores/ProvedorWhatsAppCloudApi.js";

describe("Provedor WhatsApp Cloud API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia texto pelo endpoint oficial da Cloud API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ messages: [{ id: "wamid.cloud_123" }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppCloudApi({
      phoneNumberId: "106540352242922",
      accessToken: "token_cloud",
      apiVersion: "v25.0",
      baseUrl: "https://graph.facebook.com"
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "937624785",
      conteudo: "Olá, a tua reserva foi criada.",
      tipo: "RESERVA_CRIADA"
    });

    expect(resultado).toEqual(
      expect.objectContaining({
        idExterno: "wamid.cloud_123",
        provider: "whatsapp-cloud-api"
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.facebook.com/v25.0/106540352242922/messages",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer token_cloud",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "244937624785",
          type: "text",
          text: {
            preview_url: false,
            body: "Olá, a tua reserva foi criada."
          }
        })
      })
    );
  });

  it("reporta erro detalhado devolvido pela Graph API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "Unsupported post request",
            code: 100,
            error_subcode: 33,
            fbtrace_id: "trace_123"
          }
        }),
        { status: 400 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppCloudApi({
      phoneNumberId: "106540352242922",
      accessToken: "token_cloud",
      apiVersion: "v25.0",
      baseUrl: "https://graph.facebook.com"
    });

    await expect(
      provedor.enviarMensagem({
        telefone: "+244 937 624 785",
        conteudo: "Olá",
        tipo: "TESTE"
      })
    ).rejects.toThrow(
      "WhatsApp Cloud API rejeitou envio: 400 Unsupported post request (code 100, subcode 33, trace trace_123)"
    );
  });

  it("envia template aprovado quando template padrão está configurado", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ messages: [{ id: "wamid.template_123" }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppCloudApi({
      phoneNumberId: "106540352242922",
      accessToken: "token_cloud",
      apiVersion: "v25.0",
      baseUrl: "https://graph.facebook.com",
      defaultTemplateName: "emeu_reserva_texto",
      defaultTemplateLanguage: "pt_PT"
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "937624785",
      conteudo: "Olá, a tua reserva da peça #09 foi criada.",
      tipo: "RESERVA_CRIADA"
    });

    expect(resultado.idExterno).toBe("wamid.template_123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.facebook.com/v25.0/106540352242922/messages",
      expect.objectContaining({
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "244937624785",
          type: "template",
          template: {
            name: "emeu_reserva_texto",
            language: { code: "pt_PT" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: "Olá, a tua reserva da peça #09 foi criada." }]
              }
            ]
          }
        })
      })
    );
  });

  it("recusa envio quando credenciais obrigatórias não estão configuradas", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppCloudApi({
      phoneNumberId: "",
      accessToken: "",
      apiVersion: "v25.0",
      baseUrl: "https://graph.facebook.com"
    });

    await expect(
      provedor.enviarMensagem({
        telefone: "937624785",
        conteudo: "Olá",
        tipo: "TESTE"
      })
    ).rejects.toThrow("Configure WHATSAPP_CLOUD_PHONE_NUMBER_ID e WHATSAPP_CLOUD_ACCESS_TOKEN");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
