import type { MensagemSms, ProvedorSms, ResultadoEnvioSms } from "../../dominio/provedores/ProvedorSms.js";
import {
  extractProviderMessage,
  extractProviderMessageId,
  normalizePhoneForOmbala,
  OmbalaClient
} from "./OmbalaClient.js";

interface OpcoesProvedorSmsOmbala {
  baseUrl: string;
  token?: string | null;
  timeoutMs?: number;
}

export class ProvedorSmsOmbala implements ProvedorSms {
  private readonly client: OmbalaClient;

  constructor(opcoes: OpcoesProvedorSmsOmbala) {
    this.client = new OmbalaClient(opcoes);
  }

  get configurado() {
    return this.client.isConfigured;
  }

  async enviarMensagem(mensagem: MensagemSms): Promise<ResultadoEnvioSms> {
    const destino = normalizePhoneForOmbala(mensagem.telefone);
    const resultado = await this.client.sendMessage({
      from: mensagem.remetente,
      to: destino?.providerTo ?? mensagem.telefone,
      message: mensagem.conteudo
    });

    return {
      ok: resultado.ok,
      provider: "ombala",
      status: resultado.status,
      idExterno: extractProviderMessageId(resultado.payload),
      resposta: resultado.payload,
      erro: resultado.ok ? null : extractProviderMessage(resultado.payload) ?? `Falha no provedor SMS (${resultado.status}).`
    };
  }
}
