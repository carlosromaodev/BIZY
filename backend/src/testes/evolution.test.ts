import { afterEach, describe, expect, it, vi } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { ClienteEvolutionApi } from "../infra/provedores/ClienteEvolutionApi.js";
import { ProvedorWhatsAppEvolution, ProvedorWhatsAppEvolutionDinamico } from "../infra/provedores/ProvedorWhatsAppEvolution.js";
import { ReceberMensagemWhatsAppUseCase } from "../use-case/ReceberMensagemWhatsAppUseCase.js";
import { RepositorioInstanciasWhatsAppMemoria } from "../use-case/repositorios/RepositorioMemoria.js";

describe("Integração Evolution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia texto usando o endpoint sendText da Evolution", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ key: { id: "msg_123" }, status: "PENDING" }), { status: 201 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: "https://evolution.local/",
      apiKey: "api_key",
      instancia: "emeu",
      atrasoMs: 500
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "923456789",
      conteudo: "Olá",
      tipo: "TESTE"
    });

    expect(resultado.idExterno).toBe("msg_123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/message/sendText/emeu",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ apikey: "api_key" }),
        body: JSON.stringify({
          number: "244923456789",
          text: "Olá",
          delay: 500,
          linkPreview: false
        })
      })
    );
  });

  it("envia para 937624785 com número formatado correctamente para a Evolution", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ key: { id: "msg_937" }, status: "PENDING" }), { status: 201 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: "https://evolution.local/",
      apiKey: "api_key",
      instancia: "PC00",
      atrasoMs: 800
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "937624785",
      conteudo: "Teste de envio para número externo",
      tipo: "TESTE"
    });

    expect(resultado.idExterno).toBe("msg_937");
    expect(resultado.provider).toBe("evolution");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/message/sendText/PC00",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          number: "244937624785",
          text: "Teste de envio para número externo",
          delay: 800,
          linkPreview: false
        })
      })
    );
  });

  it("reenvia texto quando a Evolution falha temporariamente", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: { message: "Connection Closed" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ key: { id: "msg_retry" } }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: "https://evolution.local/",
      apiKey: "api_key",
      instancia: "emeu",
      atrasoMs: 500,
      tentativas: 2,
      intervaloRetryMs: 1
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "+244 923 456 789",
      conteudo: "Reserva confirmada",
      tipo: "RESERVA_CRIADA"
    });

    expect(resultado.idExterno).toBe("msg_retry");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("usa a instância WhatsApp persistida como destino do envio automático", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ key: { id: "msg_persistida" } }), { status: 201 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const repositorioInstancias = new RepositorioInstanciasWhatsAppMemoria();
    const instancia = await repositorioInstancias.criar({
      nome: "loja-mattbtw",
      baseUrl: "https://evolution.persistida",
      apiKey: "api_persistida",
      padrao: true
    });
    await repositorioInstancias.atualizar(instancia.id, { status: "OPEN" });

    const provedor = new ProvedorWhatsAppEvolutionDinamico({
      repositorioInstancias,
      baseUrl: "https://evolution.fallback",
      apiKey: "api_fallback",
      instanciaFallback: "emeu",
      atrasoMs: 500
    });

    const resultado = await provedor.enviarMensagem({
      telefone: "923456789",
      conteudo: "Reserva confirmada",
      tipo: "RESERVA_CRIADA"
    });

    expect(resultado.idExterno).toBe("msg_persistida");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.persistida/message/sendText/loja-mattbtw",
      expect.objectContaining({
        headers: expect.objectContaining({ apikey: "api_persistida" })
      })
    );
  });

  it("expõe envio de media pela ClienteEvolutionApi", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: { key: { id: "media_123" } } }), { status: 201 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const cliente = new ClienteEvolutionApi({
      baseUrl: "https://evolution.local/",
      apiKey: "api_key"
    });

    const resultado = await cliente.enviarMedia("emeu", {
      number: "244923456789",
      mediatype: "document",
      mimetype: "application/pdf",
      caption: "Recibo ÉMeu",
      media: "data:application/pdf;base64,JVBERi0x",
      fileName: "recibo-emeu.pdf",
      delay: 500
    });

    expect(resultado.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/message/sendMedia/emeu",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          number: "244923456789",
          mediatype: "document",
          mimetype: "application/pdf",
          caption: "Recibo ÉMeu",
          media: "data:application/pdf;base64,JVBERi0x",
          fileName: "recibo-emeu.pdf",
          delay: 500,
          linkPreview: false
        })
      })
    );
  });

  it("recusa mensagens WhatsApp com padrão de spam antes de chamar a Evolution", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: "https://evolution.local/",
      apiKey: "api_key",
      instancia: "emeu"
    });

    await expect(
      provedor.enviarMensagem({
        telefone: "923456789",
        conteudo: "promo https://a.test https://b.test https://c.test https://d.test",
        tipo: "TESTE"
      })
    ).rejects.toThrow("demasiadas ligações");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normaliza webhook de mensagem recebida pela Evolution", () => {
    const eventos = new DespachadorEventos();
    const eventosRecebidos: string[] = [];
    eventos.aoReceberQualquer((evento) => eventosRecebidos.push(evento.tipo));
    const useCase = new ReceberMensagemWhatsAppUseCase(eventos);

    const mensagem = useCase.processarWebhookEvolution({
      instance: "emeu",
      data: {
        pushName: "João",
        key: {
          remoteJid: "244923456789@s.whatsapp.net",
          id: "ABC"
        },
        message: {
          conversation: "Ainda está disponível?"
        }
      }
    });

    expect(mensagem.telefone).toBe("923456789");
    expect(mensagem.nomeCliente).toBe("João");
    expect(mensagem.texto).toBe("Ainda está disponível?");
    expect(eventosRecebidos).toContain("WHATSAPP_MESSAGE_RECEIVED");
  });
});
