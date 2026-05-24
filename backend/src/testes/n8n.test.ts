import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsultaAtendimentoN8n } from "../use-case/ConsultaAtendimentoN8n.js";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { PublicadorEventosN8n } from "../infra/n8n/PublicadorEventosN8n.js";
import {
  RepositorioComentariosMemoria,
  RepositorioPecasMemoria,
  RepositorioReservasMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

describe("Integração n8n", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("publica apenas eventos destinados ao n8n com assinatura HMAC", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const eventos = new DespachadorEventos();
    new PublicadorEventosN8n(eventos, {
      webhookUrl: "http://n8n.local/webhook/emeu-eventos",
      segredo: "segredo",
      logger: console
    });

    eventos.emitir("COMMENT_RECEIVED", { ignorado: true });
    const eventoPublicado = eventos.emitir("RESERVATION_CREATED", { reservaId: "reserva_1" });

    await new Promise((resolver) => setTimeout(resolver, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = opcoes.headers as Record<string, string>;
    const assinaturaEsperada = createHmac("sha256", "segredo")
      .update(`${headers["X-EMEU-TIMESTAMP"]}.${opcoes.body}`)
      .digest("hex");

    expect(url).toBe("http://n8n.local/webhook/emeu-eventos");
    expect(headers["X-EMEU-EVENTO"]).toBe("RESERVATION_CREATED");
    expect(headers["X-EMEU-ASSINATURA"]).toBe(assinaturaEsperada);
    expect(JSON.parse(String(opcoes.body)).eventId).toBe(eventoPublicado.id);
  });

  it("monta contexto consciente para atendimento WhatsApp com IA", async () => {
    const pecas = new RepositorioPecasMemoria();
    const reservas = new RepositorioReservasMemoria(pecas);
    const comentarios = new RepositorioComentariosMemoria();
    const consulta = new ConsultaAtendimentoN8n(pecas, reservas, comentarios);

    await pecas.criar({
      codigo: "4",
      nome: "Vestido floral",
      descricao: "Peça de live",
      precoEmKwanza: 12000,
      quantidade: 1,
      fotos: []
    });
    await reservas.criar({
      codigoPeca: "4",
      telefoneCliente: "923456789",
      nomeCliente: "João",
      usernameCliente: "joao_ao",
      estado: "WAITING_PAYMENT",
      comentarioOriginal: "eu quero 923456789 peça 4",
      liveId: "live_1",
      expiraEm: new Date(Date.now() + 5 * 60_000)
    });

    const contexto = await consulta.buscarClientePorTelefone("+244 923 456 789");

    expect(contexto.cliente.nome).toBe("João");
    expect(contexto.reservaAtiva?.codigoPeca).toBe("4");
    expect(contexto.reservaAtiva?.peca?.precoEmKwanza).toBe(12000);
    expect(contexto.guardrails.proibicoesDaIa).toContain("inventar preço, stock ou prazo");
  });
});
