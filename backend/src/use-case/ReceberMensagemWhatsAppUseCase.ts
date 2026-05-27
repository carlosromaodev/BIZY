import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";

export interface MensagemWhatsAppRecebida {
  provider: string;
  instancia: string;
  eventoProvider: string | null;
  direcao: "INBOUND" | "OUTBOUND" | "STATUS" | "IGNORADO";
  fromMe: boolean;
  statusProvider: string | null;
  erroProvider: string | null;
  telefone: string | null;
  nomeCliente: string | null;
  texto: string | null;
  idMensagem: string | null;
  recebidaEm: Date;
  payloadOriginal: Record<string, unknown>;
  duplicado: boolean;
}

export class ReceberMensagemWhatsAppUseCase {
  private readonly chavesProcessadas = new Set<string>();
  private readonly ordemChavesProcessadas: string[] = [];
  private readonly limiteChavesProcessadas = 5_000;

  constructor(private readonly eventos: DespachadorEventos) {}

  processarWebhookEvolution(payload: Record<string, unknown>): MensagemWhatsAppRecebida {
    const dados = this.obterObjeto(payload.data);
    const chave = this.obterObjeto(dados.key);
    const eventoProvider = this.obterString(payload.event);
    const mensagem = this.obterObjeto(dados.message);
    const remoteJid = this.obterString(chave.remoteJid) ?? this.obterString(dados.remoteJid);
    const fromMe = this.obterBoolean(chave.fromMe) ?? this.obterBoolean(dados.fromMe) ?? false;
    const statusProvider = this.obterString(dados.status);
    const erroProvider = this.obterErroProvider(payload, dados);
    const telefone = remoteJid ? remoteJid.replace(/\D/g, "").replace(/^244/, "") : null;
    const texto =
      this.obterString(mensagem.conversation) ??
      this.obterString(this.obterObjeto(mensagem.extendedTextMessage).text) ??
      this.obterString(this.obterObjeto(mensagem.imageMessage).caption) ??
      this.obterString(this.obterObjeto(mensagem.documentMessage).caption);
    const idMensagem =
      this.obterString(chave.id) ??
      this.obterString(dados.keyId) ??
      this.obterString(dados.messageId) ??
      this.obterString(dados.id);
    const direcao = this.resolverDirecao({ eventoProvider, fromMe, texto, statusProvider, idMensagem });

    const mensagemRecebida: MensagemWhatsAppRecebida = {
      provider: "evolution",
      instancia: this.obterString(payload.instance) ?? this.obterString(payload.instanceName) ?? "desconhecida",
      eventoProvider,
      direcao,
      fromMe,
      statusProvider,
      erroProvider,
      telefone,
      nomeCliente: this.obterString(dados.pushName),
      texto,
      idMensagem,
      recebidaEm: new Date(),
      payloadOriginal: payload,
      duplicado: false
    };
    const chaveIdempotencia = this.montarChaveIdempotencia(mensagemRecebida);
    mensagemRecebida.duplicado = chaveIdempotencia ? this.chavesProcessadas.has(chaveIdempotencia) : false;

    if (!mensagemRecebida.duplicado && chaveIdempotencia) {
      this.registrarChaveProcessada(chaveIdempotencia);
    }

    if (!mensagemRecebida.duplicado && direcao === "INBOUND" && telefone && texto) {
      this.eventos.emitir("WHATSAPP_MESSAGE_RECEIVED", { mensagem: mensagemRecebida });
    }

    if (!mensagemRecebida.duplicado && (direcao === "OUTBOUND" || direcao === "STATUS")) {
      this.eventos.emitir("WHATSAPP_MESSAGE_STATUS", { status: mensagemRecebida });
    }

    return mensagemRecebida;
  }

  private resolverDirecao(input: {
    eventoProvider: string | null;
    fromMe: boolean;
    texto: string | null;
    statusProvider: string | null;
    idMensagem: string | null;
  }): MensagemWhatsAppRecebida["direcao"] {
    const evento = input.eventoProvider?.toLowerCase() ?? "";

    if (evento.includes("messages.update")) return "STATUS";
    if (input.fromMe) return "OUTBOUND";
    if (input.texto) return "INBOUND";
    if (input.statusProvider && input.idMensagem) return "STATUS";
    return "IGNORADO";
  }

  private montarChaveIdempotencia(mensagem: MensagemWhatsAppRecebida): string | null {
    if (!mensagem.idMensagem) return null;

    const complemento =
      mensagem.direcao === "STATUS"
        ? [mensagem.statusProvider ?? "sem-status", mensagem.erroProvider ?? "sem-erro"].join("|")
        : "mensagem";

    return [
      mensagem.provider,
      mensagem.instancia,
      mensagem.direcao,
      mensagem.idMensagem,
      complemento
    ].join(":");
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

  private obterBoolean(valor: unknown): boolean | null {
    return typeof valor === "boolean" ? valor : null;
  }

  private obterErroProvider(payload: Record<string, unknown>, dados: Record<string, unknown>): string | null {
    const candidatos = [
      dados.error,
      dados.reason,
      dados.statusReason,
      dados.statusMessage,
      dados.errorMessage,
      dados.messageError,
      this.obterObjeto(dados.response).error,
      this.obterObjeto(dados.response).message,
      this.obterObjeto(dados.error).message,
      this.obterObjeto(dados.error).reason,
      payload.error,
      payload.reason,
      payload.message
    ];

    for (const candidato of candidatos) {
      const erro = this.normalizarErroProvider(candidato);
      if (erro) return erro;
    }

    return null;
  }

  private normalizarErroProvider(valor: unknown): string | null {
    if (typeof valor === "string") {
      const texto = valor.trim();
      if (!texto || ["ERROR", "FAILED", "FAILURE"].includes(texto.toUpperCase())) return null;
      return texto.slice(0, 500);
    }

    if (typeof valor === "number" || typeof valor === "boolean") {
      return String(valor);
    }

    if (valor && typeof valor === "object") {
      const objeto = valor as Record<string, unknown>;
      return (
        this.normalizarErroProvider(objeto.message) ??
        this.normalizarErroProvider(objeto.reason) ??
        this.normalizarErroProvider(objeto.error) ??
        this.normalizarErroProvider(objeto.description)
      );
    }

    return null;
  }
}
