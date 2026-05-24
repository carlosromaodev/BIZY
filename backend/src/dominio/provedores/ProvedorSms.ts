export interface MensagemSms {
  telefone: string;
  conteudo: string;
  remetente: string;
}

export interface ResultadoEnvioSms {
  ok: boolean;
  provider: string;
  status: number;
  idExterno: string | null;
  resposta: unknown;
  erro: string | null;
}

export interface ProvedorSms {
  configurado: boolean;
  enviarMensagem(mensagem: MensagemSms): Promise<ResultadoEnvioSms>;
}
