const MIME_TYPE_DEFAULT = "application/octet-stream";
const MAX_BYTES_DEFAULT = 10 * 1024 * 1024;
const TIMEOUT_MS_DEFAULT = 6_000;

export interface OpcoesBaixarMediaUrl {
  expectedMimeType?: string | null;
  allowedMimeTypes?: string[];
  allowedHosts?: string[];
  maxBytes?: number;
  timeoutMs?: number;
}

export async function baixarMediaUrlComoDataUrl(url: string, opcoes: OpcoesBaixarMediaUrl = {}): Promise<string> {
  const endereco = validarUrl(url, opcoes.allowedHosts);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opcoes.timeoutMs ?? TIMEOUT_MS_DEFAULT);

  try {
    const resposta = await fetch(endereco, { signal: controller.signal });
    if (!resposta.ok) {
      throw new Error(`Download da media falhou com status ${resposta.status}.`);
    }

    const mimeType = normalizarMimeType(resposta.headers.get("content-type")) ?? opcoes.expectedMimeType ?? MIME_TYPE_DEFAULT;
    validarMimeType(mimeType, opcoes.allowedMimeTypes);

    const maxBytes = opcoes.maxBytes ?? MAX_BYTES_DEFAULT;
    const tamanhoDeclarado = Number(resposta.headers.get("content-length"));
    if (Number.isFinite(tamanhoDeclarado) && tamanhoDeclarado > maxBytes) {
      throw new Error("Media acima do limite permitido.");
    }

    const buffer = Buffer.from(await resposta.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new Error("Media acima do limite permitido.");
    }

    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

function validarUrl(valor: string, allowedHosts?: string[]) {
  let endereco: URL;

  try {
    endereco = new URL(valor);
  } catch {
    throw new Error("URL de media inválida.");
  }

  if (!["http:", "https:"].includes(endereco.protocol)) {
    throw new Error("URL de media deve usar HTTP ou HTTPS.");
  }

  const hostsPermitidos = allowedHosts?.map((host) => host.trim().toLowerCase()).filter(Boolean) ?? [];
  if (hostsPermitidos.length > 0 && !hostsPermitidos.includes(endereco.hostname.toLowerCase())) {
    throw new Error("Host de media não permitido.");
  }

  return endereco;
}

function normalizarMimeType(valor: string | null) {
  const mimeType = valor?.split(";")[0]?.trim().toLowerCase();
  return mimeType || null;
}

function validarMimeType(mimeType: string, allowedMimeTypes?: string[]) {
  const permitidos = allowedMimeTypes?.map((item) => item.toLowerCase()) ?? [];
  if (permitidos.length === 0) return;
  if (!permitidos.includes(mimeType.toLowerCase())) {
    throw new Error(`Tipo de media não permitido: ${mimeType}.`);
  }
}
