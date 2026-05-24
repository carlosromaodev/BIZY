export interface MensagemWhatsApp {
  telefone: string;
  conteudo: string;
  tipo: string;
  contexto?: Record<string, unknown>;
}

export interface ResultadoEnvioWhatsApp {
  idExterno: string;
  provider: string;
  enviadoEm: Date;
}

export interface ProvedorWhatsApp {
  enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp>;
}
