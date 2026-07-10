export const categoriasMensagemWhatsApp = ["marketing", "utility", "authentication", "service"] as const;
export type CategoriaMensagemWhatsApp = (typeof categoriasMensagemWhatsApp)[number];

export interface PoliticaEnvioWhatsApp {
  categoria: CategoriaMensagemWhatsApp;
  origem: "manual" | "automatica" | "reprocessamento";
  motivo: string;
  requerTemplateOficial: boolean;
  requerConsentimentoMarketing: boolean;
  janelaAtendimentoAtiva: boolean;
}

export interface MensagemWhatsApp {
  telefone: string;
  conteudo: string;
  tipo: string;
  categoria?: CategoriaMensagemWhatsApp;
  politica?: PoliticaEnvioWhatsApp;
  contexto?: Record<string, unknown>;
  media?: {
    tipo: "IMAGEM" | "DOCUMENTO" | "RECIBO" | "CATALOGO";
    url?: string | null;
    dataUrl?: string | null;
    mimeType?: string | null;
    fileName?: string | null;
  };
}

export interface ResultadoEnvioWhatsApp {
  idExterno: string;
  provider: string;
  enviadoEm: Date;
}

export interface ProvedorWhatsApp {
  enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp>;
}
