import QRCode from "qrcode";

export interface ResultadoEvolution {
  ok: boolean;
  status: number;
  payload: unknown;
  mensagemErro: string | null;
}

export interface ConfiguracaoEvolution {
  baseUrl: string;
  apiKey: string;
}

export type TipoMediaEvolution = "image" | "video" | "document";

export class ClienteEvolutionApi {
  constructor(private readonly configuracao: ConfiguracaoEvolution) {}

  get configurado() {
    return Boolean(this.configuracao.baseUrl && this.configuracao.apiKey);
  }

  async criarInstancia(dados: { nome: string; token?: string | null; numero?: string | null }) {
    return this.requisitar("/instance/create", {
      method: "POST",
      body: JSON.stringify({
        instanceName: dados.nome,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
        rejectCall: true,
        msgCall: "Olá! Este número é usado pelo ÉMeu para automação de vendas.",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        ...(dados.token ? { token: dados.token } : {}),
        ...(dados.numero ? { number: dados.numero } : {})
      })
    });
  }

  async conectar(nome: string, numero?: string | null) {
    const query = numero ? `?number=${encodeURIComponent(numero)}` : "";
    return this.requisitar(`/instance/connect/${encodeURIComponent(nome)}${query}`);
  }

  async consultarEstado(nome: string) {
    return this.requisitar(`/instance/connectionState/${encodeURIComponent(nome)}`);
  }

  async apagarInstancia(nome: string) {
    return this.requisitar(`/instance/delete/${encodeURIComponent(nome)}`, { method: "DELETE" });
  }

  async enviarTexto(
    nome: string,
    dados: { number: string; text: string; delay?: number; linkPreview?: boolean }
  ) {
    return this.requisitar(`/message/sendText/${encodeURIComponent(nome)}`, {
      method: "POST",
      body: JSON.stringify({
        number: dados.number,
        text: dados.text,
        ...(dados.delay ? { delay: dados.delay } : {}),
        linkPreview: dados.linkPreview ?? false
      })
    });
  }

  async enviarMedia(
    nome: string,
    dados: {
      number: string;
      mediatype: TipoMediaEvolution;
      mimetype: string;
      caption: string;
      media: string;
      fileName: string;
      delay?: number;
      linkPreview?: boolean;
    }
  ) {
    return this.requisitar(`/message/sendMedia/${encodeURIComponent(nome)}`, {
      method: "POST",
      body: JSON.stringify({
        number: dados.number,
        mediatype: dados.mediatype,
        mimetype: dados.mimetype,
        caption: dados.caption,
        media: dados.media,
        fileName: dados.fileName,
        ...(dados.delay ? { delay: dados.delay } : {}),
        linkPreview: dados.linkPreview ?? false
      })
    });
  }

  private async requisitar(caminho: string, init?: RequestInit): Promise<ResultadoEvolution> {
    if (!this.configurado) {
      return {
        ok: false,
        status: 0,
        payload: null,
        mensagemErro: "EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurado."
      };
    }

    try {
      const resposta = await fetch(`${this.configuracao.baseUrl.replace(/\/$/, "")}${caminho}`, {
        ...init,
        headers: {
          apikey: this.configuracao.apiKey,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(init?.headers ?? {})
        }
      });
      const payload = await this.lerPayload(resposta);

      return {
        ok: resposta.ok,
        status: resposta.status,
        payload,
        mensagemErro: resposta.ok ? null : extrairMensagemEvolution(payload) ?? `Evolution respondeu ${resposta.status}.`
      };
    } catch (erro) {
      return {
        ok: false,
        status: 0,
        payload: null,
        mensagemErro: erro instanceof Error ? erro.message : "Falha de rede ao comunicar com a Evolution."
      };
    }
  }

  private async lerPayload(resposta: Response) {
    const texto = await resposta.text();
    if (!texto) return null;

    try {
      return JSON.parse(texto);
    } catch {
      return texto;
    }
  }
}

export function normalizarEstadoEvolution(payload: unknown) {
  const registro = pegarRegistro(payload);
  if (!registro) return "UNKNOWN";

  const instancia = pegarRegistro(registro.instance);
  return (
    pegarString(registro.state) ??
    pegarString(registro.status) ??
    pegarString(instancia?.state) ??
    pegarString(instancia?.status) ??
    "UNKNOWN"
  ).toUpperCase();
}

const ESTADOS_EVOLUTION_CONECTADOS = new Set(["OPEN", "CONNECTED", "ONLINE"]);

export function instanciaWhatsAppEstaConectada(valor?: string | null) {
  return ESTADOS_EVOLUTION_CONECTADOS.has((valor?.trim() || "UNKNOWN").toUpperCase());
}

export function selecionarInstanciaWhatsAppPreferida<
  T extends { status: string; padrao?: boolean; isDefault?: boolean }
>(instancias: T[]) {
  const ehPadrao = (instancia: T) => Boolean(instancia.padrao ?? instancia.isDefault);
  const padraoConectada = instancias.find(
    (instancia) => ehPadrao(instancia) && instanciaWhatsAppEstaConectada(instancia.status)
  );
  if (padraoConectada) return padraoConectada;

  const conectada = instancias.find((instancia) => instanciaWhatsAppEstaConectada(instancia.status));
  if (conectada) return conectada;

  return instancias.find(ehPadrao) ?? instancias[0] ?? null;
}

export async function extrairQrEvolution(payload: unknown) {
  const codigo = pegarCandidatoQr(payload);
  return {
    qrCode: await converterParaQrDataUrl(codigo),
    pairingCode: pegarPrimeiraStringPorChave(payload, new Set(["pairingcode", "pairing_code"])) ?? null
  };
}

export function extrairMensagemEvolution(payload: unknown): string | null {
  if (typeof payload === "string") return payload.trim() || null;
  const registro = pegarRegistro(payload);
  if (!registro) return null;

  const aninhada =
    extrairMensagemEvolution(registro.response) ??
    extrairMensagemEvolution(registro.data) ??
    extrairMensagemEvolution(registro.payload);

  if (aninhada) return aninhada;

  return (
    pegarString(registro.message) ??
    pegarString(registro.error) ??
    pegarString(registro.response) ??
    pegarString(registro.status)
  );
}

export function extrairIdMensagemEvolution(payload: unknown): string | null {
  const registro = pegarRegistro(payload);
  if (!registro) return null;

  const direto =
    pegarString(registro.id) ??
    pegarString(registro.messageId) ??
    pegarString(registro.message_id) ??
    pegarString(registro.uuid);
  if (direto) return direto;

  const chave = pegarRegistro(registro.key);
  const idChave = pegarString(chave?.id);
  if (idChave) return idChave;

  return (
    extrairIdMensagemEvolution(registro.data) ??
    extrairIdMensagemEvolution(registro.message) ??
    extrairIdMensagemEvolution(registro.payload) ??
    extrairIdMensagemEvolution(registro.response)
  );
}

export function normalizarTelefoneWhatsApp(value?: string | null): { phone: string; providerTo: string } | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00244") && digits.length >= 14) {
    const local = digits.slice(5, 14);
    return local.length === 9 && local.startsWith("9") ? { phone: `+244${local}`, providerTo: `244${local}` } : null;
  }

  if (digits.startsWith("244") && digits.length >= 12) {
    const local = digits.slice(3, 12);
    return local.length === 9 && local.startsWith("9") ? { phone: `+244${local}`, providerTo: `244${local}` } : null;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    const local = digits.slice(1);
    return local.startsWith("9") ? { phone: `+244${local}`, providerTo: `244${local}` } : null;
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    return { phone: `+244${digits}`, providerTo: `244${digits}` };
  }

  if (digits.length === 8) {
    const local = `9${digits}`;
    return { phone: `+244${local}`, providerTo: `244${local}` };
  }

  return null;
}

export function normalizarMensagemWhatsApp(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function validarPoliticaMensagemWhatsApp(message: string) {
  const normalizada = normalizarMensagemWhatsApp(message);
  const links = contarLinks(normalizada);

  if (links > 3) {
    return "A mensagem WhatsApp tem demasiadas ligações. Mantém no máximo 3 links por envio.";
  }

  if (/(.)\1{12,}/.test(normalizada)) {
    return "A mensagem contém repetição excessiva de caracteres, o que pode ser tratado como spam.";
  }

  if (normalizada.length > 900 && links > 0) {
    return "Mensagens WhatsApp com links devem ser curtas e contextuais. Reduz o texto antes do envio.";
  }

  return null;
}

function pegarCandidatoQr(payload: unknown) {
  const candidatosImagem = coletarStringsPorChave(payload, new Set(["base64", "qrcode", "qrcodebase64"]));
  const candidatosTexto = coletarStringsPorChave(payload, new Set(["code", "qr", "qrcode", "qrcodecode"]));
  return [...candidatosImagem, ...candidatosTexto].find(
    (valor) => valor.length > 20 || /^data:image\//i.test(valor) || /^iVBORw0KGgo/i.test(valor)
  ) ?? null;
}

async function converterParaQrDataUrl(valor: string | null) {
  if (!valor) return null;
  const normalizado = valor.trim();
  if (!normalizado) return null;
  if (/^data:image\//i.test(normalizado)) return normalizado;
  if (/^iVBORw0KGgo/i.test(normalizado)) return `data:image/png;base64,${normalizado}`;
  if (/^\/9j\//i.test(normalizado)) return `data:image/jpeg;base64,${normalizado}`;
  return QRCode.toDataURL(normalizado, {
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M"
  });
}

function coletarStringsPorChave(payload: unknown, chaves: Set<string>, profundidade = 0): string[] {
  const registro = pegarRegistro(payload);
  if (!registro || profundidade > 6) return [];

  const diretos = Object.entries(registro)
    .filter(([chave, valor]) => chaves.has(chave.toLowerCase()) && typeof valor === "string")
    .map(([, valor]) => (valor as string).trim())
    .filter(Boolean);

  const aninhados = Object.values(registro).flatMap((valor) => coletarStringsPorChave(valor, chaves, profundidade + 1));
  return [...diretos, ...aninhados];
}

function contarLinks(value: string) {
  return value.match(/https?:\/\/|wa\.me\/|chat\.whatsapp\.com/gi)?.length ?? 0;
}

function pegarPrimeiraStringPorChave(payload: unknown, chaves: Set<string>) {
  return coletarStringsPorChave(payload, chaves)[0] ?? null;
}

function pegarRegistro(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  return valor as Record<string, unknown>;
}

function pegarString(valor: unknown) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}
