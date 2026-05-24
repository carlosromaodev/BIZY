import type {
  MensagemWhatsApp,
  ProvedorWhatsApp,
  ResultadoEnvioWhatsApp
} from "../../dominio/provedores/ProvedorWhatsApp.js";
import {
  normalizarMensagemWhatsApp,
  normalizarTelefoneWhatsApp,
  validarPoliticaMensagemWhatsApp
} from "./ClienteEvolutionApi.js";

interface OpcoesProvedorWhatsAppCloudApi {
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string | null;
  baseUrl?: string | null;
  linkPreview?: boolean;
  defaultTemplateName?: string | null;
  defaultTemplateLanguage?: string | null;
}

export class ProvedorWhatsAppCloudApi implements ProvedorWhatsApp {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;
  private readonly linkPreview: boolean;
  private readonly defaultTemplateName: string | null;
  private readonly defaultTemplateLanguage: string;

  constructor(opcoes: OpcoesProvedorWhatsAppCloudApi) {
    this.phoneNumberId = opcoes.phoneNumberId.trim();
    this.accessToken = opcoes.accessToken.trim();
    this.apiVersion = normalizarApiVersion(opcoes.apiVersion ?? "v25.0");
    this.baseUrl = (opcoes.baseUrl?.trim() || "https://graph.facebook.com").replace(/\/$/, "");
    this.linkPreview = opcoes.linkPreview ?? false;
    this.defaultTemplateName = opcoes.defaultTemplateName?.trim() || null;
    this.defaultTemplateLanguage = opcoes.defaultTemplateLanguage?.trim() || "pt_PT";
  }

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error("Configure WHATSAPP_CLOUD_PHONE_NUMBER_ID e WHATSAPP_CLOUD_ACCESS_TOKEN para enviar WhatsApp.");
    }

    const conteudo = normalizarMensagemWhatsApp(mensagem.conteudo);
    const erroPolitica = validarPoliticaMensagemWhatsApp(conteudo);
    if (erroPolitica) throw new Error(erroPolitica);

    const destino = normalizarTelefoneWhatsApp(mensagem.telefone);
    if (!destino) {
      throw new Error("Telefone WhatsApp angolano inválido.");
    }

    const resposta = await this.requisitar(this.criarPayloadMensagem(destino.providerTo, conteudo));

    return {
      idExterno: extrairIdMensagemCloudApi(resposta) ?? `whatsapp_cloud_${Date.now()}`,
      provider: "whatsapp-cloud-api",
      enviadoEm: new Date()
    };
  }

  private async requisitar(payload: Record<string, unknown>) {
    const resposta = await fetch(`${this.baseUrl}/${this.apiVersion}/${encodeURIComponent(this.phoneNumberId)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const corpo = await lerPayload(resposta);

    if (!resposta.ok) {
      throw new Error(`WhatsApp Cloud API rejeitou envio: ${resposta.status} ${descreverErroCloudApi(corpo)}`);
    }

    return corpo;
  }

  private criarPayloadMensagem(destino: string, conteudo: string) {
    const base = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: destino
    };

    if (this.defaultTemplateName) {
      return {
        ...base,
        type: "template",
        template: {
          name: this.defaultTemplateName,
          language: { code: this.defaultTemplateLanguage },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: conteudo }]
            }
          ]
        }
      };
    }

    return {
      ...base,
      type: "text",
      text: {
        preview_url: this.linkPreview,
        body: conteudo
      }
    };
  }
}

function normalizarApiVersion(valor: string) {
  const normalizado = valor.trim().replace(/^\/+|\/+$/g, "");
  return normalizado || "v25.0";
}

async function lerPayload(resposta: Response) {
  const texto = await resposta.text();
  if (!texto) return null;

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return texto;
  }
}

function extrairIdMensagemCloudApi(payload: unknown): string | null {
  const registro = pegarRegistro(payload);
  const mensagens = Array.isArray(registro?.messages) ? registro?.messages : [];
  const primeira = pegarRegistro(mensagens[0]);
  return pegarString(primeira?.id) ?? pegarString(registro?.message_id) ?? pegarString(registro?.id);
}

function descreverErroCloudApi(payload: unknown) {
  if (typeof payload === "string") return payload.trim() || "sem detalhe do provider";

  const erro = pegarRegistro(pegarRegistro(payload)?.error);
  const mensagem = pegarString(erro?.message) ?? "sem detalhe do provider";
  const code = pegarNumeroOuString(erro?.code);
  const subcode = pegarNumeroOuString(erro?.error_subcode);
  const trace = pegarString(erro?.fbtrace_id);
  const detalhes = [
    code ? `code ${code}` : null,
    subcode ? `subcode ${subcode}` : null,
    trace ? `trace ${trace}` : null
  ].filter(Boolean);

  return detalhes.length ? `${mensagem} (${detalhes.join(", ")})` : mensagem;
}

function pegarRegistro(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  return valor as Record<string, unknown>;
}

function pegarString(valor: unknown) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function pegarNumeroOuString(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return pegarString(valor);
}
