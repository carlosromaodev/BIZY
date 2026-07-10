import type {
  MensagemWhatsApp,
  ProvedorWhatsApp,
  ResultadoEnvioWhatsApp
} from "../../dominio/provedores/ProvedorWhatsApp.js";
import type { RepositorioInstanciasWhatsApp } from "../../dominio/repositorios/contratos.js";
import {
  ClienteEvolutionApi,
  type TipoMediaEvolution,
  extrairIdMensagemEvolution,
  extrairMensagemEvolution,
  normalizarMensagemWhatsApp,
  normalizarTelefoneWhatsApp,
  selecionarInstanciaWhatsAppPreferida,
  validarPoliticaMensagemWhatsApp
} from "./ClienteEvolutionApi.js";

interface OpcoesProvedorWhatsAppEvolution {
  baseUrl: string;
  apiKey: string;
  instancia: string;
  atrasoMs?: number;
  linkPreview?: boolean;
  tentativas?: number;
  intervaloRetryMs?: number;
}

interface OpcoesProvedorWhatsAppEvolutionDinamico {
  repositorioInstancias: RepositorioInstanciasWhatsApp;
  baseUrl: string;
  apiKey: string;
  instanciaFallback?: string | null;
  atrasoMs?: number;
  linkPreview?: boolean;
  tentativas?: number;
  intervaloRetryMs?: number;
}

export class ProvedorWhatsAppEvolution implements ProvedorWhatsApp {
  private readonly instancia: string;
  private readonly atrasoMs: number;
  private readonly linkPreview: boolean;
  private readonly tentativas: number;
  private readonly intervaloRetryMs: number;
  private readonly cliente: ClienteEvolutionApi;

  constructor(opcoes: OpcoesProvedorWhatsAppEvolution) {
    this.instancia = opcoes.instancia;
    this.atrasoMs = opcoes.atrasoMs ?? 800;
    this.linkPreview = opcoes.linkPreview ?? false;
    this.tentativas = Math.max(1, Math.min(opcoes.tentativas ?? 3, 5));
    this.intervaloRetryMs = Math.max(0, opcoes.intervaloRetryMs ?? 600);
    this.cliente = new ClienteEvolutionApi({
      baseUrl: opcoes.baseUrl,
      apiKey: opcoes.apiKey
    });
  }

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    const conteudo = normalizarMensagemWhatsApp(mensagem.conteudo);
    const erroPolitica = validarPoliticaMensagemWhatsApp(conteudo);

    if (erroPolitica) {
      throw new Error(erroPolitica);
    }

    const destino = normalizarTelefoneWhatsApp(mensagem.telefone);
    if (!destino) {
      throw new Error("Telefone WhatsApp angolano inválido.");
    }

    const resposta = await this.enviarComRetry(() => {
      if (mensagem.media) {
        const media = prepararMediaEvolution(mensagem.media, conteudo);
        return this.cliente.enviarMedia(this.instancia, {
          number: destino.providerTo,
          mediatype: media.mediatype,
          mimetype: media.mimetype,
          caption: media.caption,
          media: media.media,
          fileName: media.fileName,
          delay: this.atrasoMs,
          linkPreview: this.linkPreview
        });
      }

      return this.cliente.enviarTexto(this.instancia, {
        number: destino.providerTo,
        text: conteudo,
        delay: this.atrasoMs,
        linkPreview: this.linkPreview
      });
    });

    if (!resposta.ok) {
      const detalhe = extrairMensagemEvolution(resposta.payload) ?? JSON.stringify(resposta.payload);
      throw new Error(`Evolution rejeitou envio WhatsApp: ${resposta.status} ${detalhe}`.trim());
    }

    return {
      idExterno: extrairIdMensagemEvolution(resposta.payload) ?? `evolution_${Date.now()}`,
      provider: "evolution",
      enviadoEm: new Date()
    };
  }

  private async enviarComRetry<T extends { ok: boolean }>(operacao: () => Promise<T>): Promise<T> {
    let ultimoResultado: T | null = null;

    for (let tentativa = 0; tentativa < this.tentativas; tentativa += 1) {
      ultimoResultado = await operacao();
      if (ultimoResultado.ok || tentativa === this.tentativas - 1) return ultimoResultado;
      await aguardar(this.intervaloRetryMs * 2 ** tentativa);
    }

    return ultimoResultado as T;
  }
}

export class ProvedorWhatsAppEvolutionDinamico implements ProvedorWhatsApp {
  private readonly atrasoMs: number;
  private readonly linkPreview: boolean;
  private readonly tentativas: number;
  private readonly intervaloRetryMs: number;

  constructor(private readonly opcoes: OpcoesProvedorWhatsAppEvolutionDinamico) {
    this.atrasoMs = opcoes.atrasoMs ?? 800;
    this.linkPreview = opcoes.linkPreview ?? false;
    this.tentativas = Math.max(1, Math.min(opcoes.tentativas ?? 3, 5));
    this.intervaloRetryMs = Math.max(0, opcoes.intervaloRetryMs ?? 600);
  }

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    const destino = await this.resolverDestino(this.extrairNegocioId(mensagem.contexto));
    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: destino.baseUrl,
      apiKey: destino.apiKey,
      instancia: destino.instancia,
      atrasoMs: this.atrasoMs,
      linkPreview: this.linkPreview,
      tentativas: this.tentativas,
      intervaloRetryMs: this.intervaloRetryMs
    });

    return provedor.enviarMensagem(mensagem);
  }

  private async resolverDestino(negocioId?: string | null) {
    const instancias = await this.opcoes.repositorioInstancias.listarAtivas(negocioId);
    const selecionada = selecionarInstanciaWhatsAppPreferida(instancias);
    const instancia = selecionada?.nome?.trim() || this.opcoes.instanciaFallback?.trim();
    const baseUrl = selecionada?.baseUrl?.trim() || this.opcoes.baseUrl.trim();
    const apiKey = selecionada?.apiKey?.trim() || this.opcoes.apiKey.trim();

    if (!instancia) {
      throw new Error("Nenhuma instância WhatsApp configurada para envio.");
    }

    if (!baseUrl || !apiKey) {
      throw new Error("Configure EVOLUTION_API_URL e EVOLUTION_API_KEY para enviar WhatsApp.");
    }

    return { instancia, baseUrl, apiKey };
  }

  private extrairNegocioId(contexto: unknown): string | null {
    if (!contexto || typeof contexto !== "object" || Array.isArray(contexto)) return null;
    const dados = contexto as Record<string, unknown>;
    if (typeof dados.negocioId === "string" && dados.negocioId.trim()) return dados.negocioId;

    const reserva = dados.reserva;
    if (reserva && typeof reserva === "object" && !Array.isArray(reserva)) {
      const negocioId = (reserva as Record<string, unknown>).negocioId;
      if (typeof negocioId === "string" && negocioId.trim()) return negocioId;
    }

    const peca = dados.peca;
    if (peca && typeof peca === "object" && !Array.isArray(peca)) {
      const negocioId = (peca as Record<string, unknown>).negocioId;
      if (typeof negocioId === "string" && negocioId.trim()) return negocioId;
    }

    return null;
  }
}

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prepararMediaEvolution(
  media: NonNullable<MensagemWhatsApp["media"]>,
  caption: string
): {
  mediatype: TipoMediaEvolution;
  mimetype: string;
  caption: string;
  media: string;
  fileName: string;
} {
  const payloadMedia = media.dataUrl?.trim() || media.url?.trim();
  if (!payloadMedia) {
    throw new Error("Media WhatsApp sem ficheiro para envio.");
  }

  const mimetype = media.mimeType?.trim() || inferirMimeTypeMedia(payloadMedia, media.tipo);
  const mediatype = resolverTipoMediaEvolution(media.tipo, mimetype);
  return {
    mediatype,
    mimetype,
    caption,
    media: payloadMedia,
    fileName: media.fileName?.trim() || nomePadraoMedia(mediatype, mimetype)
  };
}

function resolverTipoMediaEvolution(tipo: NonNullable<MensagemWhatsApp["media"]>["tipo"], mimetype: string): TipoMediaEvolution {
  if (tipo === "IMAGEM" || tipo === "CATALOGO" || mimetype.startsWith("image/")) return "image";
  return "document";
}

function inferirMimeTypeMedia(media: string, tipo: NonNullable<MensagemWhatsApp["media"]>["tipo"]) {
  const dataUrl = media.match(/^data:([^;,]+);base64,/i)?.[1]?.toLowerCase();
  if (dataUrl) return dataUrl;
  if (/\.pdf($|\?)/i.test(media)) return "application/pdf";
  if (/\.webp($|\?)/i.test(media)) return "image/webp";
  if (/\.png($|\?)/i.test(media)) return "image/png";
  if (/\.jpe?g($|\?)/i.test(media)) return "image/jpeg";
  return tipo === "IMAGEM" || tipo === "CATALOGO" ? "image/jpeg" : "application/pdf";
}

function nomePadraoMedia(mediatype: TipoMediaEvolution, mimetype: string) {
  if (mediatype === "image") return `imagem-bizy.${extensaoPorMime(mimetype)}`;
  return `documento-bizy.${extensaoPorMime(mimetype)}`;
}

function extensaoPorMime(mimetype: string) {
  if (mimetype === "image/webp") return "webp";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/jpeg") return "jpg";
  if (mimetype === "application/pdf") return "pdf";
  return "bin";
}
