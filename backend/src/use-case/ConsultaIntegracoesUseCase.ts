export interface StatusIntegracao {
  nome: string;
  estado: "CONFIGURADA" | "DESATIVADA" | "PENDENTE";
  detalhe: string;
}

export class ConsultaIntegracoesUseCase {
  listarStatus(): StatusIntegracao[] {
    return [
      {
        nome: "TikTok Live Connector",
        estado: "CONFIGURADA",
        detalhe: "Provider principal disponível via tiktok-live-connector."
      },
      {
        nome: "TikTokLive Python",
        estado: "CONFIGURADA",
        detalhe: "Fallback disponível via script Python separado."
      },
      {
        nome: "n8n",
        estado: this.statusBooleano(process.env.N8N_EVENTOS_ATIVOS !== "false" && Boolean(process.env.N8N_WEBHOOK_EVENTOS_URL)),
        detalhe: process.env.N8N_WEBHOOK_EVENTOS_URL
          ? "Webhook de eventos configurado."
          : "Defina N8N_WEBHOOK_EVENTOS_URL para publicar automações."
      },
      {
        nome: "Evolution API",
        estado: this.statusEvolution(),
        detalhe:
          process.env.WHATSAPP_PROVIDER === "evolution"
            ? "Provider de WhatsApp direto selecionado."
            : "Usada quando WHATSAPP_PROVIDER=evolution."
      },
      {
        nome: "WhatsApp Cloud API",
        estado: this.statusCloudApi(),
        detalhe:
          this.providerCloudApiSelecionado()
            ? "Provider oficial de WhatsApp direto selecionado."
            : "Usada quando WHATSAPP_PROVIDER=cloud-api."
      },
      {
        nome: "WhatsApp pelo backend",
        estado: process.env.N8N_ASSUME_WHATSAPP === "true" ? "DESATIVADA" : "CONFIGURADA",
        detalhe:
          process.env.N8N_ASSUME_WHATSAPP === "true"
            ? "n8n assume os envios automáticos."
            : "Backend envia mensagens pelo provider selecionado."
      }
    ];
  }

  private statusBooleano(valor: boolean): StatusIntegracao["estado"] {
    return valor ? "CONFIGURADA" : "DESATIVADA";
  }

  private statusEvolution(): StatusIntegracao["estado"] {
    if (process.env.WHATSAPP_PROVIDER !== "evolution") {
      return "DESATIVADA";
    }

    return process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE
      ? "CONFIGURADA"
      : "PENDENTE";
  }

  private statusCloudApi(): StatusIntegracao["estado"] {
    if (!this.providerCloudApiSelecionado()) {
      return "DESATIVADA";
    }

    return process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID && process.env.WHATSAPP_CLOUD_ACCESS_TOKEN
      ? "CONFIGURADA"
      : "PENDENTE";
  }

  private providerCloudApiSelecionado() {
    const provider = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
    return provider === "cloud-api" || provider === "whatsapp-cloud-api";
  }
}
