import { chromium, type Browser } from "playwright";

let browserPromise: Promise<Browser> | null = null;

export interface OpcoesRenderPdf {
  landscape?: boolean;
  footerLabel?: string;
  preferCssPageSize?: boolean;
  displayHeaderFooter?: boolean;
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Luanda"
  }).format(value);
}

export async function renderPdfFromHtml(html: string, options: OpcoesRenderPdf = {}) {
  if (process.env.PDF_RENDERER_ENGINE === "fallback") {
    return renderFallbackPdf(html);
  }

  try {
    const browser = await getPdfBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: options.landscape ?? false,
        preferCSSPageSize: options.preferCssPageSize ?? false,
        printBackground: true,
        displayHeaderFooter: options.displayHeaderFooter ?? true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="width: 100%; font-size: 9px; color: #5f6672; padding: 0 12mm; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: space-between;">
            <span>${escapeHtml(options.footerLabel ?? "ÉMeu")}</span>
            <span><span class="pageNumber"></span>/<span class="totalPages"></span></span>
          </div>
        `,
        margin: options.margin ?? {
          top: "12mm",
          right: "10mm",
          bottom: "16mm",
          left: "10mm"
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  } catch (erro) {
    if (process.env.PDF_RENDERER_ALLOW_FALLBACK === "false") {
      throw erro;
    }

    return renderFallbackPdf(html);
  }
}

async function getPdfBrowser() {
  const launchOpts: Parameters<typeof chromium.launch>[0] = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  };

  // Em Alpine/containers sem o browser do Playwright, usar chromium do sistema
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  }

  if (!browserPromise) {
    browserPromise = chromium.launch(launchOpts);
  }

  try {
    const browser = await browserPromise;
    if (browser.isConnected()) return browser;
  } catch {
    // A promessa anterior pode ter falhado por falta de browser ou encerramento externo.
  }

  browserPromise = chromium.launch(launchOpts);
  return browserPromise;
}

function renderFallbackPdf(html: string) {
  const texto = htmlToText(html);
  return criarPdfTextoSimples(texto);
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|h1|h2|h3|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim()
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function criarPdfTextoSimples(texto: string) {
  const linhas = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .split(/\n+/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 58);

  const conteudo = [
    "BT",
    "/F1 11 Tf",
    "50 790 Td",
    "14 TL",
    ...linhas.map((linha) => `(${escapePdfText(linha.slice(0, 92))}) Tj T*`),
    "ET"
  ].join("\n");

  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(conteudo)} >>\nstream\n${conteudo}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objetos.forEach((objeto, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf);
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
