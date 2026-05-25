import { describe, expect, it } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { MensagemWhatsApp, ProvedorWhatsApp, ResultadoEnvioWhatsApp } from "../dominio/provedores/ProvedorWhatsApp.js";
import { AutomacaoWhatsApp } from "../dominio/servicos/AutomacaoWhatsApp.js";

class ProvedorWhatsAppCaptura implements ProvedorWhatsApp {
  mensagens: MensagemWhatsApp[] = [];

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    this.mensagens.push(mensagem);
    return {
      idExterno: `msg_${this.mensagens.length}`,
      provider: "captura",
      enviadoEm: new Date("2026-05-25T12:00:00.000Z")
    };
  }
}

describe("política WhatsApp por categoria oficial", () => {
  it("expõe catálogo de templates por categoria, evento, provider e aprovação", () => {
    const automacao = new AutomacaoWhatsApp(new ProvedorWhatsAppCaptura(), new DespachadorEventos(), 10);

    const templates = automacao.listarTemplates({
      categoria: "utility",
      evento: "PAYMENT_PENDING",
      provider: "whatsapp_cloud_api",
      apenasAprovados: true
    });

    expect(templates).toEqual([
      expect.objectContaining({
        id: "iban",
        categoria: "utility",
        idioma: "pt_AO",
        provider: "whatsapp_cloud_api",
        versao: 1,
        estadoAprovacao: "aprovado",
        eventosCompativeis: expect.arrayContaining(["PAYMENT_PENDING"])
      })
    ]);
  });

  it("classifica templates operacionais como utilidade antes de chamar o provider", async () => {
    const provedor = new ProvedorWhatsAppCaptura();
    const automacao = new AutomacaoWhatsApp(provedor, new DespachadorEventos(), 10);

    const templates = automacao.listarTemplates();
    expect(templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "iban",
          categoria: "utility"
        })
      ])
    );

    const envio = await automacao.enviarMensagemManual({
      telefone: "923456789",
      templateId: "iban",
      variaveis: {
        nomeCliente: "Cliente",
        codigoPeca: "01",
        nomePeca: "Vestido",
        preco: "12 000 Kz",
        iban: "AO06",
        titular: "Bizy",
        referencia: "PAG-01"
      }
    });

    expect(envio.politica).toEqual(
      expect.objectContaining({
        categoria: "utility",
        requerTemplateOficial: true,
        origem: "manual"
      })
    );
    expect(provedor.mensagens[0]).toEqual(
      expect.objectContaining({
        categoria: "utility",
        politica: expect.objectContaining({ categoria: "utility" }),
        contexto: expect.objectContaining({
          politicaWhatsApp: expect.objectContaining({ categoria: "utility" })
        })
      })
    );
  });

  it("classifica texto livre manual como serviço quando a janela de atendimento está ativa", async () => {
    const provedor = new ProvedorWhatsAppCaptura();
    const automacao = new AutomacaoWhatsApp(provedor, new DespachadorEventos(), 10);

    const envio = await automacao.enviarMensagemManual({
      telefone: "923456789",
      mensagem: "Olá, seguimos o teu atendimento por aqui.",
      janelaAtendimentoAtiva: true
    });

    expect(envio.politica).toEqual(
      expect.objectContaining({
        categoria: "service",
        requerTemplateOficial: false,
        janelaAtendimentoAtiva: true
      })
    );
    expect(provedor.mensagens[0].categoria).toBe("service");
  });

  it("bloqueia envio manual com template ainda não aprovado", async () => {
    const provedor = new ProvedorWhatsAppCaptura();
    const automacao = new AutomacaoWhatsApp(provedor, new DespachadorEventos(), 10);

    await expect(
      automacao.enviarMensagemManual({
        telefone: "923456789",
        templateId: "marketing_reengajamento",
        consentimentoMarketing: true,
        variaveis: {
          nomeCliente: "Cliente",
          cupom: "BIZY10"
        }
      })
    ).rejects.toThrow("Template WhatsApp marketing_reengajamento ainda não está aprovado para envio.");
    expect(provedor.mensagens).toHaveLength(0);
  });

  it("bloqueia marketing sem consentimento explícito antes de chamar o provider", async () => {
    const provedor = new ProvedorWhatsAppCaptura();
    const automacao = new AutomacaoWhatsApp(provedor, new DespachadorEventos(), 10);

    await expect(
      automacao.enviarMensagemManual({
        telefone: "923456789",
        mensagem: "Temos uma promoção nova para ti.",
        categoria: "marketing",
        consentimentoMarketing: false
      })
    ).rejects.toThrow("Mensagem WhatsApp de marketing exige consentimento explícito do cliente.");
    expect(provedor.mensagens).toHaveLength(0);
  });
});
