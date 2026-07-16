import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OMBALA_API_BASE_URL_PADRAO,
  OmbalaClient,
  extractCredits,
  extractProviderMessage,
  extractSenderNames,
  normalizePhoneForOmbala,
  validateSmsMessagePolicy
} from "../infra/provedores/OmbalaClient.js";

describe("OmbalaClient", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("usa o endpoint público actual da Ombala como referência de configuração", () => {
    expect(OMBALA_API_BASE_URL_PADRAO).toBe("https://api.useombala.ao");
  });

  it("normaliza formatos comuns de telefone angolano para o formato exigido pela Ombala", () => {
    expect(normalizePhoneForOmbala("+244 937 624 786")).toEqual({ phone: "+244937624786", providerTo: "937624786" });
    expect(normalizePhoneForOmbala("00244 937 624 786")).toEqual({ phone: "+244937624786", providerTo: "937624786" });
    expect(normalizePhoneForOmbala("0937624786")).toEqual({ phone: "+244937624786", providerTo: "937624786" });
    expect(normalizePhoneForOmbala("37624786")).toEqual({ phone: "+244937624786", providerTo: "937624786" });
    expect(normalizePhoneForOmbala("123")).toBeNull();
  });

  it("extrai créditos, remetentes e mensagens de payloads variados do provider", () => {
    expect(extractCredits({ data: { saldo: "1.234,5" } })).toBe(1234.5);
    expect(extractCredits({ response: [{ credits: "27" }] })).toBe(27);
    expect(extractSenderNames([{ name: "EMEU" }, " LOJA "])).toEqual(["EMEU", "LOJA"]);
    expect(extractProviderMessage({ data: { detail: "Token inválido" } })).toBe("Token inválido");
    expect(extractProviderMessage({ errors: [{ message: "remetente inválido" }] })).toBe("remetente inválido");
  });

  it("valida mensagens para reduzir risco de bloqueio ou abuso", () => {
    expect(validateSmsMessagePolicy("Texto normal https://emeu.ao")).toBeNull();
    expect(validateSmsMessagePolicy("A https://a.test B https://b.test C https://c.test")).toContain("demasiadas ligações");
    expect(validateSmsMessagePolicy("Ola!!!!!!!!!!!!")).toContain("repetição excessiva");
  });

  it("envia SMS com o nome exacto aprovado pelo provider, destino normalizado e agendamento opcional", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ message: "remetente inválido" }] }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: "BIZYCODE " }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message_id: "sms_1" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmbalaClient({ baseUrl: "https://sms.local/", token: "token" });
    const resultado = await client.sendMessage({
      from: "BIZYCODE",
      to: "+244937624786",
      message: "Reserva criada",
      schedule: "20260521193000"
    });

    expect(resultado).toEqual(
      expect.objectContaining({
        ok: true,
        status: 201,
        payload: { message_id: "sms_1" }
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://sms.local/v1/senders/approved",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Token token" })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://sms.local/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Token token" }),
        body: JSON.stringify({
          message: "Reserva criada",
          from: "BIZYCODE ",
          to: "937624786",
          schedule: "20260521193000"
        })
      })
    );
  });

  it("não chama rede quando o token não está configurado", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmbalaClient({ baseUrl: "https://sms.local", token: "" });
    const resultado = await client.getCredits();

    expect(resultado.ok).toBe(false);
    expect(resultado.payload).toEqual({ message: "OMBALA_API_TOKEN não configurado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborta chamada ao provider quando excede o timeout configurado", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmbalaClient({ baseUrl: "https://sms.local", token: "token", timeoutMs: 250 });
    const envio = client.sendMessage({
      from: "EMEU",
      to: "+244937624786",
      message: "Código 123456"
    });

    await vi.advanceTimersByTimeAsync(250);
    const resultado = await envio;

    expect(resultado.ok).toBe(false);
    expect(resultado.status).toBe(0);
    expect(resultado.payload).toEqual({
      message: "Tempo limite de 250ms excedido ao comunicar com o Ombala."
    });
  });
});
