export const canaisNotificacao = ["WHATSAPP", "SMS", "EMAIL", "PUSH", "CRM_TAREFA"] as const;
export type CanalNotificacao = (typeof canaisNotificacao)[number];

export interface DadosNotificacao {
  negocioId: string;
  destinatarioTelefone?: string | null;
  destinatarioEmail?: string | null;
  canal: CanalNotificacao;
  tipo: string;
  titulo: string;
  conteudo: string;
  metadata?: Record<string, unknown>;
}

export interface ResultadoNotificacao {
  sucesso: boolean;
  provider: string;
  canal: CanalNotificacao;
  idExterno: string | null;
  motivo?: string | null;
  enviadoEm: Date;
}

export interface ProvedorNotificacao {
  readonly nome: string;
  readonly canaisSuportados: CanalNotificacao[];
  enviar(dados: DadosNotificacao): Promise<ResultadoNotificacao>;
  verificarDisponibilidade(canal: CanalNotificacao): Promise<boolean>;
}
