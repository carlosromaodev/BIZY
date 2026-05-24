import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DATA_URL_PATTERN = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);
const MEDIA_PREFIX = "/media/files";
const PRIVATE_PURPOSES = new Set(["comprovativos-pagamento"]);

export interface OpcoesSalvarMedia {
  purpose: string;
  allowDocuments?: boolean;
  maxBytes?: number;
  maxImageDimension?: number;
  thumbnailDimension?: number;
}

export interface MediaArmazenada {
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  originalMimeType: string;
  size: number;
  originalSize: number;
  width: number | null;
  height: number | null;
  metadataUrl: string;
}

export function isDataUrl(value?: string | null) {
  return Boolean(value?.trim().startsWith("data:"));
}

export function isStoredMediaUrl(value?: string | null) {
  return Boolean(caminhoRelativoDeUrl(value));
}

export function isPrivateStoredMediaUrl(value?: string | null) {
  const relativo = caminhoRelativoDeUrl(value);
  if (!relativo) return false;
  const [purpose] = relativo.split(/[\\/]/);
  return PRIVATE_PURPOSES.has(purpose);
}

export async function salvarMediaDataUrl(dataUrl: string, opcoes: OpcoesSalvarMedia): Promise<MediaArmazenada> {
  const parsed = parseDataUrl(dataUrl.trim());
  if (!parsed) {
    throw new Error("Ficheiro inválido.");
  }

  const isImage = IMAGE_MIME_TYPES.has(parsed.mimeType);
  const isDocument = DOCUMENT_MIME_TYPES.has(parsed.mimeType);

  if (!isImage && !(opcoes.allowDocuments && isDocument)) {
    throw new Error("Tipo de ficheiro não suportado.");
  }

  const maxBytes = opcoes.maxBytes ?? (isImage ? 6 * 1024 * 1024 : 10 * 1024 * 1024);
  if (parsed.buffer.length > maxBytes) {
    throw new Error("Ficheiro acima do limite permitido.");
  }

  const root = mediaRoot();
  const relativeDir = buildRelativeDir(opcoes.purpose);
  const outputDir = path.join(root, relativeDir);
  assertInsideRoot(root, outputDir);
  await mkdir(outputDir, { recursive: true });

  return isImage
    ? salvarImagem(root, relativeDir, parsed.buffer, parsed.mimeType, opcoes)
    : salvarDocumento(root, relativeDir, parsed.buffer, parsed.mimeType);
}

export async function persistirValorMedia(
  value: string | null | undefined,
  opcoes: OpcoesSalvarMedia
): Promise<string | null | undefined> {
  const trimmed = value?.trim();
  if (!trimmed) return value === null || trimmed === "" ? null : undefined;
  if (!isDataUrl(trimmed)) return trimmed;

  const stored = await salvarMediaDataUrl(trimmed, opcoes);
  return stored.url;
}

export async function resolverFicheiroMedia(url: string) {
  const relativo = caminhoRelativoDeUrl(url);
  if (!relativo) return null;

  const root = mediaRoot();
  const filePath = path.resolve(root, relativo);
  assertInsideRoot(root, filePath);
  await access(filePath);

  const metadataPath = filePath.replace(/\.thumb\.webp$/i, ".json").replace(/\.(webp|pdf|bin)$/i, ".json");
  const metadata = await readFile(metadataPath, "utf8")
    .then((conteudo) => JSON.parse(conteudo) as MediaArmazenada)
    .catch(() => null);

  return {
    filePath,
    stream: createReadStream(filePath),
    mimeType: metadata?.mimeType ?? inferirMimeType(filePath),
    size: metadata?.size ?? null
  };
}

function mediaRoot() {
  return path.resolve(process.cwd(), process.env.MEDIA_STORAGE_DIR ?? "storage/media");
}

function parseDataUrl(value: string) {
  const match = value.match(DATA_URL_PATTERN);
  if (!match) return null;

  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64")
  };
}

function sanitizePurpose(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "geral";
}

function buildRelativeDir(purpose: string) {
  const now = new Date();
  return path.join(sanitizePurpose(purpose), String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
}

function buildMediaUrl(relativePath: string) {
  return `${MEDIA_PREFIX}/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

async function salvarImagem(
  root: string,
  relativeDir: string,
  buffer: Buffer,
  originalMimeType: string,
  opcoes: OpcoesSalvarMedia
): Promise<MediaArmazenada> {
  const id = randomUUID();
  const maxImageDimension = opcoes.maxImageDimension ?? 1600;
  const thumbnailDimension = opcoes.thumbnailDimension ?? 320;
  const outputPath = path.join(root, relativeDir, `${id}.webp`);
  const thumbnailPath = path.join(root, relativeDir, `${id}.thumb.webp`);
  const metadataPath = path.join(root, relativeDir, `${id}.json`);

  const optimized = await sharp(buffer, { failOn: "warning", limitInputPixels: 64_000_000 })
    .rotate()
    .resize({
      width: maxImageDimension,
      height: maxImageDimension,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 78, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const thumbnail = await sharp(buffer, { failOn: "warning", limitInputPixels: 64_000_000 })
    .rotate()
    .resize({
      width: thumbnailDimension,
      height: thumbnailDimension,
      fit: "cover",
      withoutEnlargement: false
    })
    .webp({ quality: 72, effort: 4 })
    .toBuffer();

  await Promise.all([writeFile(outputPath, optimized.data), writeFile(thumbnailPath, thumbnail)]);

  const relativeOutput = path.join(relativeDir, `${id}.webp`);
  const relativeThumbnail = path.join(relativeDir, `${id}.thumb.webp`);
  const relativeMetadata = path.join(relativeDir, `${id}.json`);
  const metadata: MediaArmazenada = {
    url: buildMediaUrl(relativeOutput),
    thumbnailUrl: buildMediaUrl(relativeThumbnail),
    mimeType: "image/webp",
    originalMimeType,
    size: optimized.data.length,
    originalSize: buffer.length,
    width: optimized.info.width,
    height: optimized.info.height,
    metadataUrl: buildMediaUrl(relativeMetadata)
  };

  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  return metadata;
}

async function salvarDocumento(
  root: string,
  relativeDir: string,
  buffer: Buffer,
  mimeType: string
): Promise<MediaArmazenada> {
  const id = randomUUID();
  const extension = mimeType === "application/pdf" ? "pdf" : "bin";
  const outputPath = path.join(root, relativeDir, `${id}.${extension}`);
  const metadataPath = path.join(root, relativeDir, `${id}.json`);
  const relativeOutput = path.join(relativeDir, `${id}.${extension}`);
  const relativeMetadata = path.join(relativeDir, `${id}.json`);

  await writeFile(outputPath, buffer);

  const metadata: MediaArmazenada = {
    url: buildMediaUrl(relativeOutput),
    thumbnailUrl: null,
    mimeType,
    originalMimeType: mimeType,
    size: buffer.length,
    originalSize: buffer.length,
    width: null,
    height: null,
    metadataUrl: buildMediaUrl(relativeMetadata)
  };

  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  return metadata;
}

function caminhoRelativoDeUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/^\/+/, "");
  const expectedPrefix = MEDIA_PREFIX.replace(/^\/+/, "");
  if (!cleaned.startsWith(`${expectedPrefix}/`)) return null;

  return decodeURIComponent(cleaned.slice(expectedPrefix.length + 1));
}

function assertInsideRoot(root: string, target: string) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho de media inválido.");
  }
}

function inferirMimeType(filePath: string) {
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}
