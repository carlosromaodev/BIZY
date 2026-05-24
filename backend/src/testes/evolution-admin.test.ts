import { describe, expect, it } from "vitest";
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
});
