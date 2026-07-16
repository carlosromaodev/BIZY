import { describe, expect, it, vi } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { MensagemSms, ProvedorSms, ResultadoEnvioSms } from "../dominio/provedores/ProvedorSms.js";
import { NotificacoesSmsBizyUseCase } from "../use-case/NotificacoesSmsBizyUseCase.js";

class ProvedorSmsCaptura implements ProvedorSms {
  configurado = true;
  readonly mensagens: MensagemSms[] = [];

  async enviarMensagem(mensagem: MensagemSms): Promise<ResultadoEnvioSms> {
    this.mensagens.push(mensagem);
    return {
      ok: true,
      provider: "fake",
      status: 201,
      idExterno: `sms-${this.mensagens.length}`,
      resposta: {},
      erro: null
    };
  }
}

describe("notificações SMS Bizy", () => {
  it("usa BizyLive, BizyShop e BizyCare conforme o evento transaccional", async () => {
    const eventos = new DespachadorEventos();
    const sms = new ProvedorSmsCaptura();

    new NotificacoesSmsBizyUseCase({
      eventos,
      sms,
      compras: {
        buscarPorId: async () => ({
          id: "compra-1",
          numero: 81,
          compradorTelefone: "923000002",
          totalEmKwanza: 45_000
        }) as never
      },
      pedidos: {
        obterPedido: async () => ({
          pedido: {
            id: "pedido-1",
            numero: 17,
            origem: "WHATSAPP",
            totalEmKwanza: 12_500
          },
          cliente: { telefone: "923000003" }
        }) as never
      }
    }, {
      ativo: true,
      appPublicUrl: "https://usebizy.space",
      logger: { info: vi.fn(), warn: vi.fn() }
    });

    eventos.emitir("RESERVATION_CREATED", {
      reserva: {
        telefoneCliente: "923000001",
        codigoPeca: "LIVE-1",
        liveId: "live-1"
      },
      peca: { nome: "Vestido verde" }
    });
    eventos.emitir("COMPRA_UNIFICADA_CRIADA", { compraId: "compra-1" });
    eventos.emitir("PAYMENT_REJECTED", { negocioId: "negocio-1", pedidoId: "pedido-1" });

    await vi.waitFor(() => expect(sms.mensagens).toHaveLength(3));

    expect(sms.mensagens.map((mensagem) => mensagem.remetente)).toEqual([
      "BIZYLIVE",
      "BIZYSHOP",
      "BIZYCARE"
    ]);
    expect(sms.mensagens.every((mensagem) => mensagem.conteudo.length <= 160)).toBe(true);
    expect(sms.mensagens[1].conteudo).toContain("/conta/compras");
  });

  it("não regista listeners quando o envio transaccional está desligado", async () => {
    const eventos = new DespachadorEventos();
    const sms = new ProvedorSmsCaptura();

    new NotificacoesSmsBizyUseCase({
      eventos,
      sms,
      compras: { buscarPorId: async () => null },
      pedidos: { obterPedido: async () => null }
    }, {
      ativo: false,
      logger: { info: vi.fn(), warn: vi.fn() }
    });

    eventos.emitir("COMPRA_UNIFICADA_CRIADA", { compraId: "compra-1" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sms.mensagens).toHaveLength(0);
  });
});
