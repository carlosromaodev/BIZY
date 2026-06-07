import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const DATA_URL_PATTERN = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/i;
const execFileAsync = promisify(execFile);

export interface InformacoesComprovativoPdf {
  tipo: "pdf";
  textoExtraido: string;
  referencia: string | null;
  valorEmKwanza: number | null;
  banco: string | null;
  extraidoCom: "pdftotext" | "fallback";
}

export async function extrairInformacoesComprovativoPdf(dataUrl: string): Promise<InformacoesComprovativoPdf> {
  const buffer = obterBufferPdf(dataUrl);
  const extraido = await extrairTextoPdf(buffer);
  const texto = normalizarTexto(extraido.texto);

  return {
    tipo: "pdf",
    textoExtraido: texto,
    referencia: extrairReferencia(texto),
    valorEmKwanza: extrairValorKwanza(texto),
    banco: extrairBanco(texto),
    extraidoCom: extraido.metodo
  };
}

function obterBufferPdf(dataUrl: string): Buffer {
  const match = dataUrl.trim().match(DATA_URL_PATTERN);
  if (!match) throw new Error("Comprovativo PDF inválido.");
  return Buffer.from(match[1], "base64");
}

async function extrairTextoPdf(buffer: Buffer): Promise<{ texto: string; metodo: InformacoesComprovativoPdf["extraidoCom"] }> {
  if (buffer.includes("xref")) {
    const textoCli = await extrairComPdftotext(buffer);
    if (textoCli.trim()) return { texto: textoCli, metodo: "pdftotext" };
  }

  return { texto: extrairTextoLiteralPdf(buffer), metodo: "fallback" };
}

async function extrairComPdftotext(buffer: Buffer): Promise<string> {
  const dir = path.join(os.tmpdir(), `bizy-pdf-${randomUUID()}`);
  const filePath = path.join(dir, "comprovativo.pdf");

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, buffer);
    const { stdout } = await execFileAsync("pdftotext", ["-layout", filePath, "-"], {
      timeout: 4_000,
      maxBuffer: 256_000
    });
    return stdout;
  } catch {
    return "";
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function extrairTextoLiteralPdf(buffer: Buffer): string {
  const bruto = buffer.toString("latin1");
  const segmentos: string[] = [];
  const padraoTexto = /\(([^()]*)\)\s*Tj/g;
  let match: RegExpExecArray | null;

  while ((match = padraoTexto.exec(bruto))) {
    segmentos.push(decodificarTextoPdf(match[1]));
  }

  return segmentos.length > 0 ? segmentos.join("\n") : bruto;
}

function decodificarTextoPdf(valor: string): string {
  return valor
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function normalizarTexto(texto: string): string {
  return texto.replace(/\s+/g, " ").trim().slice(0, 8_000);
}

function extrairReferencia(texto: string): string | null {
  const padroes = [
    /\b(?:refer[eê]ncia|referencia|ref\.?|transa[cç][aã]o|id)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{3,})\b/i,
    /\b(TX[A-Z0-9._/-]{4,})\b/i
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match?.[1]) return match[1].replace(/[.,;:]+$/, "").toUpperCase();
  }

  return null;
}

function extrairValorKwanza(texto: string): number | null {
  const padroes = [
    /\b(?:valor|montante|total|kwanza|kz|aoa)\s*[:#-]?\s*([0-9][0-9\s.,]*)\s*(?:kz|aoa|kwanza)?\b/i,
    /\b([0-9][0-9\s.,]*)\s*(?:kz|aoa|kwanza)\b/i
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    const valor = match?.[1] ? normalizarNumeroMonetario(match[1]) : null;
    if (valor && valor > 0) return valor;
  }

  return null;
}

function normalizarNumeroMonetario(valor: string): number | null {
  const limpo = valor.replace(/\s+/g, "");
  const semSeparadores =
    limpo.includes(",") && limpo.lastIndexOf(",") > limpo.lastIndexOf(".")
      ? limpo.replace(/\./g, "").replace(",", ".")
      : limpo.replace(/,/g, "");
  const numero = Number(semSeparadores);
  return Number.isFinite(numero) ? Math.round(numero) : null;
}

function extrairBanco(texto: string): string | null {
  const bancos = ["BAI", "BFA", "BIC", "ATLANTICO", "BPC", "KEVE", "SOL", "STANDARD BANK", "UNITEL MONEY"];
  const upper = texto.toUpperCase();
  return bancos.find((banco) => upper.includes(banco)) ?? null;
}
