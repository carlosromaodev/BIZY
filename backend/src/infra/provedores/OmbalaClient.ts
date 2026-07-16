export interface ResultadoOmbala {
  ok: boolean;
  status: number;
  payload: unknown;
}

export interface ConfiguracaoOmbala {
  baseUrl: string;
  token?: string | null;
  timeoutMs?: number;
}

export const OMBALA_API_BASE_URL_PADRAO = "https://api.useombala.ao";

export class OmbalaClient {
  private readonly baseUrl: string;
  private readonly token: string | null;
  private readonly timeoutMs: number;
  private remetentesAprovados: Map<string, string> | null = null;
  private carregamentoRemetentesAprovados: Promise<Map<string, string> | null> | null = null;

  constructor(configuracao: ConfiguracaoOmbala) {
    this.baseUrl = configuracao.baseUrl.replace(/\/$/, "");
    this.token = configuracao.token?.trim() || null;
    this.timeoutMs = configuracao.timeoutMs && configuracao.timeoutMs > 0 ? configuracao.timeoutMs : 9_000;
  }

  get isConfigured() {
    return Boolean(this.token);
  }

  async sendMessage(payload: { message: string; from: string; to: string; schedule?: string | null }) {
    const destino = normalizePhoneForOmbala(payload.to);
    const remetente = normalizeSmsSender(payload.from);
    const enviar = (from: string) => this.request("/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        from,
        to: destino?.providerTo ?? payload.to.replace(/\D/g, ""),
        ...(payload.schedule ? { schedule: payload.schedule } : {})
      })
    });

    const resultado = await enviar(remetente);
    if (resultado.ok || !isInvalidSenderResponse(resultado.payload) || !this.token) {
      return resultado;
    }

    const aprovados = await this.getApprovedSenderMap();
    const remetenteExacto = aprovados?.get(remetente);
    if (!remetenteExacto || remetenteExacto === remetente) {
      return resultado;
    }

    return enviar(remetenteExacto);
  }

  async getCredits() {
    return this.request("/v1/credits");
  }

  async getApprovedSenders() {
    return this.request("/v1/senders/approved");
  }

  async getSenders() {
    return this.request("/v1/senders");
  }

  async getPendingSenders() {
    return this.request("/v1/senders/pending");
  }

  async createSender(name: string) {
    return this.request("/v1/senders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: normalizeSmsSender(name) })
    });
  }

  async deleteSender(senderId: string) {
    return this.request(`/v1/senders/${encodeURIComponent(senderId)}`, { method: "DELETE" });
  }

  async listMessages(page?: number) {
    return this.request(this.withQuery("/v1/messages", { page }));
  }

  async listRecipients(page?: number) {
    return this.request(this.withQuery("/v1/messages/recipients", { page }));
  }

  async listMessagesByRecipient(phoneNumber: string, page?: number) {
    const normalized = normalizePhoneForOmbala(phoneNumber);
    return this.request(this.withQuery("/v1/messages/recipient", {
      phone_number: normalized?.providerTo ?? phoneNumber.replace(/\D/g, ""),
      page
    }));
  }

  async getMessageOne(input: { messageId?: string; id?: string }) {
    return this.request(this.withQuery("/v1/messages/one", {
      message_id: input.messageId,
      id: input.id
    }));
  }

  private async getApprovedSenderMap() {
    if (this.remetentesAprovados) return this.remetentesAprovados;

    if (!this.carregamentoRemetentesAprovados) {
      this.carregamentoRemetentesAprovados = this.loadApprovedSenderMap();
    }

    const remetentes = await this.carregamentoRemetentesAprovados;
    this.carregamentoRemetentesAprovados = null;

    if (remetentes) {
      this.remetentesAprovados = remetentes;
    }

    return remetentes;
  }

  private async loadApprovedSenderMap() {
    const resultado = await this.getApprovedSenders();
    if (!resultado.ok) return null;

    return new Map(
      extractRawSenderNames(resultado.payload).map((remetente) => [normalizeSmsSender(remetente), remetente])
    );
  }

  private withQuery(path: string, query: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") continue;
      params.set(key, String(value));
    }

    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  private async request(path: string, init?: RequestInit): Promise<ResultadoOmbala> {
    if (!this.token) {
      return {
        ok: false,
        status: 0,
        payload: { message: "OMBALA_API_TOKEN não configurado." }
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const resposta = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers: {
          Authorization: `Token ${this.token}`,
          ...(init?.headers ?? {})
        }
      });
      const payload = await readProviderPayload(resposta);

      return {
        ok: resposta.ok,
        status: resposta.status,
        payload
      };
    } catch (erro) {
      const timeoutMessage =
        erro instanceof Error && erro.name === "AbortError"
          ? `Tempo limite de ${this.timeoutMs}ms excedido ao comunicar com o Ombala.`
          : null;
      return {
        ok: false,
        status: 0,
        payload: {
          message: timeoutMessage ?? (erro instanceof Error ? erro.message : "Falha de rede ao comunicar com o Ombala.")
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function normalizePhoneForOmbala(value?: string | null): { phone: string; providerTo: string } | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00244") && digits.length >= 14) {
    const local = digits.slice(5, 14);
    return local.length === 9 && local.startsWith("9") ? { phone: `+244${local}`, providerTo: local } : null;
  }

  if (digits.startsWith("244") && digits.length >= 12) {
    const local = digits.slice(3, 12);
    return local.length === 9 && local.startsWith("9") ? { phone: `+244${local}`, providerTo: local } : null;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    const local = digits.slice(1);
    return local.startsWith("9") ? { phone: `+244${local}`, providerTo: local } : null;
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    return { phone: `+244${digits}`, providerTo: digits };
  }

  if (digits.length === 8) {
    const local = `9${digits}`;
    return { phone: `+244${local}`, providerTo: local };
  }

  return null;
}

export function normalizeSmsSender(value: string) {
  const remetente = value.trim().toUpperCase().replace(/\s+/g, " ");
  return /^[A-Z0-9 _-]{3,16}$/.test(remetente) ? remetente : "EMEU";
}

export function normalizeSmsMessage(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function validateSmsMessagePolicy(message: string) {
  const normalized = normalizeSmsMessage(message);

  if (countUrls(normalized) > 2) {
    return "A mensagem SMS tem demasiadas ligações. Mantém no máximo 2 links por envio.";
  }

  if (/(.)\1{10,}/.test(normalized)) {
    return "A mensagem contém repetição excessiva de caracteres, o que pode ser tratado como spam.";
  }

  return null;
}

export function extractProviderMessageId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const direct = pickString(record.message_id) ?? pickString(record.messageId) ?? pickString(record.id) ?? pickString(record.uuid);
  if (direct) return direct;

  return extractProviderMessageId(record.data);
}

export function extractProviderMessage(payload: unknown): string | null {
  if (typeof payload === "string") return payload.trim() || null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = extractProviderMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const direct =
    pickString(record.message) ??
    pickString(record.error) ??
    pickString(record.detail) ??
    pickString(record.description);

  if (direct) return direct;

  return extractProviderMessage(record.data) ??
    extractProviderMessage(record.result) ??
    extractProviderMessage(record.payload) ??
    extractProviderMessage(record.response) ??
    extractProviderMessage(record.errors);
}

export function extractSenderNames(payload: unknown): string[] {
  return Array.from(new Set(extractRawSenderNames(payload).map((name) => name.trim()).filter(Boolean)));
}

export function extractCredits(payload: unknown): number | null {
  const direct = parseCreditValue(payload);
  if (direct !== null) return direct;

  return visitForCredits(payload);
}

async function readProviderPayload(response: Response) {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function countUrls(value: string) {
  return value.match(/https?:\/\/|wa\.me\/|chat\.whatsapp\.com/gi)?.length ?? 0;
}

function isInvalidSenderResponse(payload: unknown) {
  const message = extractProviderMessage(payload)?.toLowerCase() ?? "";
  return message.includes("remetente inválido") ||
    message.includes("remetente invalido") ||
    message.includes("invalid sender");
}

function extractRawSenderNames(value: unknown, depth = 0): string[] {
  if (!value || depth > 5) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return item.trim() ? [item] : [];
      return extractRawSenderNames(item, depth + 1);
    });
  }

  if (typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" && record.name.trim() ? [record.name] : [];
  const nested = ["data", "result", "payload", "response", "senders"]
    .flatMap((key) => extractRawSenderNames(record[key], depth + 1));

  return [...name, ...nested];
}

function parseCreditValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const normalized = value
      .trim()
      .replace(/\s+/g, "")
      .replace(/(?<=\d)[.,](?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function visitForCredits(value: unknown, depth = 0): number | null {
  const parsed = parseCreditValue(value);
  if (parsed !== null) return parsed;

  if (!value || typeof value !== "object" || depth > 5) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = visitForCredits(item, depth + 1);
      if (nested !== null) return nested;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const creditKeys = new Set([
    "available",
    "available_sms",
    "balance",
    "credit",
    "credits",
    "remaining",
    "saldo",
    "sms",
    "total",
    "value"
  ]);

  for (const [key, item] of Object.entries(record)) {
    if (!creditKeys.has(key.toLowerCase())) continue;
    const nested = visitForCredits(item, depth + 1);
    if (nested !== null) return nested;
  }

  for (const key of ["data", "result", "payload", "response"]) {
    const nested = visitForCredits(record[key], depth + 1);
    if (nested !== null) return nested;
  }

  return null;
}

function pickString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
