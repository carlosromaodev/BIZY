import type {
  MensagemWhatsApp,
  ProvedorWhatsApp,
  ResultadoEnvioWhatsApp
} from "../../dominio/provedores/ProvedorWhatsApp.js";

export class WhatsAppConsoleProvider implements ProvedorWhatsApp {
  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    const enviadoEm = new Date();
    const idExterno = `console_${enviadoEm.getTime()}`;

    console.info("[WhatsAppConsole]", {
      idExterno,
      telefone: mensagem.telefone,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo
    });

    return {
      idExterno,
      provider: "whatsapp-console",
      enviadoEm
    };
  }
}
