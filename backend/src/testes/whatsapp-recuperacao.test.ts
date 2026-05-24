import { describe, expect, it } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { MensagemWhatsApp, ProvedorWhatsApp, ResultadoEnvioWhatsApp } from "../dominio/provedores/ProvedorWhatsApp.js";
import { RecuperacaoMensagensWhatsAppUseCase } from "../use-case/RecuperacaoMensagensWhatsAppUseCase.js";
import { RepositorioAuditoriaMemoria } from "../use-case/repositorios/RepositorioMemoria.js";

class ProvedorWhatsAppControlado implements ProvedorWhatsApp {
  mensagens: MensagemWhatsApp[] = [];
  falhasAntesDoSucesso = 0;

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    this.mensagens.push(mensagem);

    if (this.falhasAntesDoSucesso > 0) {
      this.falhasAntesDoSucesso -= 1;
      throw new Error("Evolution offline");
    }

    return {
      idExterno: `msg_${this.mensagens.length}`,
      provider: "evolution",
      enviadoEm: new Date("2026-05-22T10:05:00.000Z")
    };
  }
}

describe("RecuperacaoMensagensWhatsAppUseCase", () => {
  it("guarda falha de envio numa outbox e reenvia depois com sucesso", async () => {
    const eventos = new DespachadorEventos();
    const repositorio = new RepositorioAuditoriaMemoria();
    const provedor = new ProvedorWhatsAppControlado();
    const recuperacao = new RecuperacaoMensagensWhatsAppUseCase(eventos, repositorio, provedor, {
      ativo: false
    });

    await recuperacao.registrarFalha({
      telefone: "923456789",
      tipo: "RESERVA_CRIADA",
      conteudo: "Reserva confirmada",
      contexto: { reservaId: "reserva_1" },
      erro: "Evolution offline",
      ocorridoEm: new Date("2026-05-22T10:00:00.000Z")
    });

    expect(await repositorio.resumirMensagensWhatsAppOutbox()).toEqual(
      expect.objectContaining({
        total: 1,
        pendentes: 1,
        enviadas: 0,
        falhadas: 0,
        ultimaFalha: "Evolution offline"
      })
    );

    const resultado = await recuperacao.reprocessarPendentes({
      agora: new Date("2026-05-22T10:01:00.000Z"),
      incluirFalhadas: true
    });

    expect(resultado).toEqual({ processadas: 1, enviadas: 1, falhadas: 0 });
    expect(provedor.mensagens).toEqual([
      expect.objectContaining({
        telefone: "923456789",
        tipo: "RESERVA_CRIADA",
        conteudo: "Reserva confirmada",
        contexto: { reservaId: "reserva_1" }
      })
    ]);
    expect(await repositorio.resumirMensagensWhatsAppOutbox()).toEqual(
      expect.objectContaining({
        total: 1,
        pendentes: 0,
        enviadas: 1,
        falhadas: 0
      })
    );

    await recuperacao.fechar();
  });
});
