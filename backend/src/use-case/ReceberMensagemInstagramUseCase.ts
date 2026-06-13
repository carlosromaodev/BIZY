import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";

export interface MensagemInstagramRecebida {
  provider: "instagrapi";
  instancia: string;
  negocioId: string | null;
  direcao: "INBOUND" | "OUTBOUND" | "IGNORADO";
  tipoMensagem: "text" | "image" | "video" | "audio" | "media_share" | "unknown";
  userId: string | null;
  username: string | null;
  nomeCompleto: string | null;
  avatarUrl: string | null;
  texto: string | null;
  mediaUrl: string | null;
  idMensagem: string | null;
  threadId: string | null;
  recebidaEm: Date;
  payloadOriginal: Record<string, unknown>;
  duplicado: boolean;
}

export class ReceberMensagemInstagramUseCase {
  private readonly chavesProcessadas = new Set<string>();
  private readonly ordemChavesProcessadas: string[] = [];
  private readonly limiteChavesProcessadas = 5_000;

  constructor(private readonly eventos: DespachadorEventos) {}

  gerarChaveIdempotencia(payload: Record<string, unknown>): string | null {
    const dados = this.obterObjeto(payload.data);
    const idMensagem = this.obterString(dados.messageId);
    if (!idMensagem) return null;

    const instancia = this.obterString(payload.instance) ?? this.obterString(dados.instancia) ?? "desconhecida";
    const evento = this.obterString(payload.event) ?? "dm";
    return `instagrapi:${instancia}:${evento}:${idMensagem}`;
  }

  processarWebhook(payload: Record<string, unknown>): MensagemInstagramRecebida {
    const mensagem = this.normalizar(payload);
    const chave = this.montarChaveIdempotencia(mensagem);
    mensagem.duplicado = chave ? this.chavesProcessadas.has(chave) : false;

    if (!mensagem.duplicado && chave) {
      this.registrarChaveProcessada(chave);
    }

    const evento = this.obterString(payload.event) ?? "";

    if (!mensagem.duplicado && evento === "INSTAGRAM_DM_RECEIVED" && mensagem.userId && mensagem.texto) {
      this.eventos.emitir("INSTAGRAM_DM_RECEIVED", { mensagem });
    }

    if (!mensagem.duplicado && evento === "INSTAGRAM_DM_SENT") {
      this.eventos.emitir("INSTAGRAM_DM_SENT", { mensagem });
    }

    return mensagem;
  }

  private normalizar(payload: Record<string, unknown>): MensagemInstagramRecebida {
    const dados = this.obterObjeto(payload.data);
    const evento = this.obterString(payload.event) ?? "";
    const direcao = evento === "INSTAGRAM_DM_SENT" ? "OUTBOUND" : evento === "INSTAGRAM_DM_RECEIVED" ? "INBOUND" : "IGNORADO";
    const tipoMensagem = this.resolverTipoMensagem(this.obterString(dados.mediaType));
    const timestampStr = this.obterString(dados.timestamp) ?? this.obterString(payload.timestamp);
    const recebidaEm = timestampStr ? new Date(timestampStr) : new Date();

    return {
      provider: "instagrapi",
      instancia: this.obterString(dados.instancia) ?? "desconhecida",
      negocioId: this.obterString(dados.negocioId),
      direcao,
      tipoMensagem,
      userId: this.obterString(dados.userId),
      username: this.obterString(dados.username),
      nomeCompleto: this.obterString(dados.fullName),
      avatarUrl: this.obterString(dados.profilePicUrl),
      texto: this.obterString(dados.text),
      mediaUrl: this.obterString(dados.mediaUrl),
      idMensagem: this.obterString(dados.messageId),
      threadId: this.obterString(dados.threadId),
      recebidaEm,
      payloadOriginal: payload,
      duplicado: false
    };
  }

  private resolverTipoMensagem(tipo: string | null): MensagemInstagramRecebida["tipoMensagem"] {
    if (!tipo) return "text";
    if (tipo === "text") return "text";
    if (tipo === "image") return "image";
    if (tipo === "video") return "video";
    if (tipo === "audio") return "audio";
    if (tipo === "media_share") return "media_share";
    return "unknown";
  }

  private montarChaveIdempotencia(mensagem: MensagemInstagramRecebida): string | null {
    if (!mensagem.idMensagem) return null;
    return `instagrapi:${mensagem.instancia}:${mensagem.direcao}:${mensagem.idMensagem}`;
  }

  private registrarChaveProcessada(chave: string) {
    if (this.chavesProcessadas.has(chave)) return;
    this.chavesProcessadas.add(chave);
    this.ordemChavesProcessadas.push(chave);

    while (this.ordemChavesProcessadas.length > this.limiteChavesProcessadas) {
      const antiga = this.ordemChavesProcessadas.shift();
      if (antiga) this.chavesProcessadas.delete(antiga);
    }
  }

  private obterObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }

  private obterString(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim().length > 0 ? valor : null;
  }
}
