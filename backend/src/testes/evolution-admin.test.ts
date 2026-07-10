import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extrairIdMensagemEvolution,
  extrairMensagemEvolution,
  extrairQrEvolution,
  instanciaWhatsAppEstaConectada,
  normalizarEstadoEvolution,
  normalizarTelefoneWhatsApp,
  selecionarInstanciaWhatsAppPreferida,
  validarPoliticaMensagemWhatsApp
} from "../infra/provedores/ClienteEvolutionApi.js";
import { ProvedorWhatsAppEvolution } from "../infra/provedores/ProvedorWhatsAppEvolution.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ClienteEvolutionApi helpers", () => {
  it("normaliza estado aninhado da Evolution", () => {
    expect(normalizarEstadoEvolution({ instance: { state: "open" } })).toBe("OPEN");
    expect(normalizarEstadoEvolution({ status: "connecting" })).toBe("CONNECTING");
  });

  it("converte token textual de QR em data url", async () => {
    const resultado = await extrairQrEvolution({
      qrcode: {
        code: "2@qr-token-grande-para-gerar-imagem"
      },
      pairingCode: "123-456"
    });

    expect(resultado.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(resultado.pairingCode).toBe("123-456");
  });

  it("extrai mensagem de erro aninhada", () => {
    expect(extrairMensagemEvolution({ response: { message: "connection closed" } })).toBe("connection closed");
  });

  it("prefere instância conectada mesmo quando a padrão está fechada", () => {
    const selecionada = selecionarInstanciaWhatsAppPreferida([
      { nome: "padrao-fechada", padrao: true, status: "CLOSE" },
      { nome: "backup-aberta", padrao: false, status: "open" }
    ]);

    expect(selecionada?.nome).toBe("backup-aberta");
    expect(instanciaWhatsAppEstaConectada("CONNECTED")).toBe(true);
    expect(instanciaWhatsAppEstaConectada("pairing")).toBe(false);
  });

  it("normaliza telefone angolano para uso na Evolution", () => {
    expect(normalizarTelefoneWhatsApp("+244 937 624 786")).toEqual({
      phone: "+244937624786",
      providerTo: "244937624786"
    });
    expect(normalizarTelefoneWhatsApp("937624786")?.providerTo).toBe("244937624786");
    expect(normalizarTelefoneWhatsApp("0937624786")?.providerTo).toBe("244937624786");
    expect(normalizarTelefoneWhatsApp("00244937624786")?.providerTo).toBe("244937624786");
    expect(normalizarTelefoneWhatsApp("123")).toBeNull();
  });

  it("extrai id de mensagem de payloads diferentes da Evolution", () => {
    expect(extrairIdMensagemEvolution({ key: { id: "msg_key" } })).toBe("msg_key");
    expect(extrairIdMensagemEvolution({ data: { message: { id: "msg_nested" } } })).toBe("msg_nested");
  });

  it("bloqueia mensagens WhatsApp com padrão de spam", () => {
    expect(validarPoliticaMensagemWhatsApp("olá https://a.test https://b.test https://c.test https://d.test")).toContain(
      "demasiadas ligações"
    );
    expect(validarPoliticaMensagemWhatsApp("boaaaaaaaaaaaaaaaa venda")).toContain("repetição excessiva");
    expect(validarPoliticaMensagemWhatsApp("Reserva confirmada.")).toBeNull();
  });

  it("envia imagem ou documento pelo endpoint sendMedia da Evolution", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ key: { id: "evo-media-1" } }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: "https://evolution.local",
      apiKey: "token",
      instancia: "loja",
      atrasoMs: 0
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "923456789",
      conteudo: "Segue a imagem.",
      tipo: "MANUAL_IMAGEM",
      media: {
        tipo: "IMAGEM",
        dataUrl: "data:image/png;base64,iVBORw0KGgo=",
        mimeType: "image/png",
        fileName: "foto.png"
      }
    });

    expect(resultado.idExterno).toBe("evo-media-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/message/sendMedia/loja",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          number: "244923456789",
          mediatype: "image",
          mimetype: "image/png",
          caption: "Segue a imagem.",
          media: "data:image/png;base64,iVBORw0KGgo=",
          fileName: "foto.png",
          linkPreview: false
        })
      })
    );
  });
});
