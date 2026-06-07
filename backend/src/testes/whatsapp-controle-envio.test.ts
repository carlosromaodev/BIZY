import { describe, expect, it } from "vitest";
import type { MensagemWhatsApp, ProvedorWhatsApp, ResultadoEnvioWhatsApp } from "../dominio/provedores/ProvedorWhatsApp.js";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { AutomacaoWhatsApp } from "../dominio/servicos/AutomacaoWhatsApp.js";
import { ProvedorWhatsAppComControleEnvio } from "../infra/provedores/ProvedorWhatsAppComControleEnvio.js";

class ProvedorWhatsAppFake implements ProvedorWhatsApp {
  readonly chamadas: Array<{ telefone: string; instante: number }> = [];

  constructor(
    private readonly agora: () => number,
    private readonly erro?: Error
  ) {}

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    this.chamadas.push({ telefone: mensagem.telefone, instante: this.agora() });
    if (this.erro) throw this.erro;

    return {
      idExterno: `fake-${this.chamadas.length}`,
      provider: "fake",
      enviadoEm: new Date(this.agora())
    };
  }
}

describe("Controle de envio WhatsApp", () => {
  it("respeita intervalo mínimo entre mensagens para o mesmo contacto", async () => {
    let agora = 1_000;
    const esperas: number[] = [];
    const base = new ProvedorWhatsAppFake(() => agora);
    const provedor = new ProvedorWhatsAppComControleEnvio(base, {
      intervaloPorContatoMs: 6_500,
      intervaloGlobalMs: 0,
      relogioMs: () => agora,
      aguardarMs: async (ms) => {
        esperas.push(ms);
        agora += ms;
      }
    });

    await provedor.enviarMensagem({ telefone: "923456789", conteudo: "Primeira", tipo: "TESTE" });
    await provedor.enviarMensagem({ telefone: "+244 923 456 789", conteudo: "Segunda", tipo: "TESTE" });

    expect(esperas).toEqual([6_500]);
    expect(base.chamadas).toEqual([
      { telefone: "923456789", instante: 1_000 },
      { telefone: "+244 923 456 789", instante: 7_500 }
    ]);
  });

  it("emite falha recuperável quando envio manual chega ao provider e falha", async () => {
    const eventos = new DespachadorEventos();
    const falhas: string[] = [];
    eventos.aoReceber("WHATSAPP_MESSAGE_FAILED", (evento) => {
      falhas.push(String(evento.dados.erro));
    });
    const automacao = new AutomacaoWhatsApp(
      new ProvedorWhatsAppFake(() => Date.now(), new Error("Provider indisponível")),
      eventos,
      15,
      { ativo: true }
    );

    await expect(
      automacao.enviarMensagemManual({
        negocioId: "negocio-1",
        telefone: "923456789",
        mensagem: "Olá, ainda precisas de ajuda?",
        categoria: "service",
        janelaAtendimentoAtiva: true
      })
    ).rejects.toThrow("Provider indisponível");

    expect(falhas).toEqual(["Provider indisponível"]);
  });
});
