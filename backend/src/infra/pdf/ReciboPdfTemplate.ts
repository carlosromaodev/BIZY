import { escapeHtml } from "./PdfRenderer.js";

export interface DadosReciboPdf {
  numero: number;
  anoFiscal: number;
  emitidoEm: Date;

  // Emitente
  nomeComercial: string;
  nif?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  moeda: string;

  // Cliente
  clienteNome: string;
  clienteNif?: string | null;

  // Pagamento
  valorPago: number;
  metodoPagamento?: string | null;
  referencia?: string | null;
  comprovativoUrl?: string | null;
  facturaRef?: string | null;
  observacao?: string | null;
}

const INK      = "#17211c";
const INK_2    = "#46514b";
const INK_3    = "#6e7873";
const INK_4    = "#9aa39e";
const LINE     = "#e7e4dc";
const LINE_2   = "#f0ede6";
const BG       = "#faf8f4";
const GREEN    = "#16A07A";
const BRAND_BG = "#0B1014";

function fmtValor(valorInteiro: number, moeda: string) {
  const valor = valorInteiro.toLocaleString("pt-AO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${valor} ${moeda}`;
}

function fmtData(data: Date) {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Luanda",
  }).format(data);
}

export function buildReciboHtml(dados: DadosReciboPdf): string {
  const ref = `RC ${String(dados.numero).padStart(4, "0")}/${dados.anoFiscal}`;
  const dataEmissao = fmtData(dados.emitidoEm);
  const moeda = dados.moeda || "AOA";

  return `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<title>Recibo ${escapeHtml(ref)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #fff;
    color: ${INK};
    font-family: Geist, "Plus Jakarta Sans", Inter, system-ui, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 18mm 14mm;
    position: relative;
  }
  .top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${GREEN} 0%, ${INK} 100%);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: 8mm;
    padding-bottom: 7mm;
    border-bottom: 1px solid ${LINE};
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 3.5mm;
  }
  .brand-icon {
    width: 11mm;
    height: 11mm;
    background: ${BRAND_BG};
    display: grid;
    place-items: center;
  }
  .brand-icon-b {
    font-family: Geist, "Plus Jakarta Sans", system-ui, sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.055em;
    color: #ffffff;
  }
  .brand-icon-dot { color: ${GREEN}; }
  .brand-wordmark {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.055em;
    color: ${INK};
  }
  .brand-wordmark-dot { color: ${GREEN}; }
  .brand-negocio {
    margin-top: 1mm;
    font-size: 10px;
    font-weight: 600;
    color: ${INK_2};
  }
  .brand-sub {
    margin-top: 0.8mm;
    font-size: 8.5px;
    color: ${INK_3};
    font-weight: 500;
  }
  .doc-ref {
    text-align: right;
  }
  .doc-ref .label {
    font-size: 9px;
    color: ${INK_3};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .doc-ref .value {
    display: block;
    margin-top: 1.5mm;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: ${INK};
  }
  .doc-ref .estado {
    display: inline-block;
    margin-top: 2mm;
    padding: 1mm 3mm;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #15803d;
    background: #f0fdf4;
    border: 1px solid #15803d22;
  }

  .partes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10mm;
    margin-top: 8mm;
    padding-bottom: 7mm;
    border-bottom: 1px solid ${LINE};
  }
  .parte-label {
    font-size: 8px;
    font-weight: 700;
    color: ${INK_3};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2.5mm;
  }
  .parte-nome {
    font-size: 13px;
    font-weight: 720;
    line-height: 1.3;
    color: ${INK};
  }
  .parte-detalhe {
    margin-top: 1.5mm;
    font-size: 10px;
    color: ${INK_2};
    line-height: 1.5;
  }

  .recibo-corpo {
    margin-top: 12mm;
    padding: 8mm;
    border: 1px solid ${LINE};
    background: ${BG};
  }
  .recibo-titulo {
    font-size: 11px;
    font-weight: 700;
    color: ${INK_3};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6mm;
  }
  .recibo-linha {
    display: flex;
    justify-content: space-between;
    padding: 2.5mm 0;
    font-size: 11px;
    color: ${INK_2};
    border-bottom: 1px solid ${LINE_2};
  }
  .recibo-linha:last-child { border-bottom: none; }
  .recibo-linha .rl-label { font-weight: 500; }
  .recibo-linha .rl-valor { font-weight: 600; font-variant-numeric: tabular-nums; color: ${INK}; }

  .recibo-total {
    margin-top: 6mm;
    padding-top: 5mm;
    border-top: 2px solid ${INK};
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 800;
    color: ${INK};
  }
  .recibo-total .rl-valor { font-variant-numeric: tabular-nums; }

  .extenso {
    margin-top: 8mm;
    padding: 4mm 5mm;
    background: ${BG};
    border-left: 2px solid ${GREEN};
    font-size: 10px;
    color: ${INK_2};
    line-height: 1.5;
  }
  .extenso strong {
    display: block;
    margin-bottom: 1.5mm;
    font-size: 8px;
    font-weight: 700;
    color: ${INK_3};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .observacao {
    margin-top: 8mm;
    padding: 4mm 5mm;
    background: ${BG};
    border-left: 2px solid ${LINE};
    font-size: 9.5px;
    color: ${INK_2};
    line-height: 1.55;
  }
  .observacao strong {
    display: block;
    margin-bottom: 1.5mm;
    font-size: 8px;
    font-weight: 700;
    color: ${INK_3};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .footer {
    position: absolute;
    bottom: 12mm;
    left: 18mm;
    right: 18mm;
    border-top: 1px solid ${LINE};
    padding-top: 4mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: ${INK_4};
  }
  .footer strong {
    color: ${INK_3};
    font-weight: 650;
  }
  .footer-bizy {
    font-weight: 700;
    letter-spacing: -0.04em;
    color: ${INK_3};
  }
  .footer-bizy-dot { color: ${GREEN}; }
</style>
</head>
<body>
  <div class="page">
    <div class="top-bar"></div>

    <div class="header">
      <div class="brand">
        <div class="brand-icon">
          <span class="brand-icon-b">b<span class="brand-icon-dot">.</span></span>
        </div>
        <div>
          <div class="brand-wordmark">bizy<span class="brand-wordmark-dot">.</span></div>
          <div class="brand-negocio">${escapeHtml(dados.nomeComercial)}</div>
          <div class="brand-sub">${dados.nif ? `NIF ${escapeHtml(dados.nif)}` : "Documento comercial"}</div>
        </div>
      </div>
      <div class="doc-ref">
        <span class="label">Recibo</span>
        <span class="value">${escapeHtml(ref)}</span>
        <span class="estado">Pago</span>
      </div>
    </div>

    <div class="partes">
      <div>
        <div class="parte-label">Recebido de</div>
        <div class="parte-nome">${escapeHtml(dados.clienteNome)}</div>
        ${dados.clienteNif ? `<div class="parte-detalhe">NIF: ${escapeHtml(dados.clienteNif)}</div>` : ""}
      </div>
      <div>
        <div class="parte-label">Emitente</div>
        <div class="parte-nome">${escapeHtml(dados.nomeComercial)}</div>
        ${dados.nif ? `<div class="parte-detalhe">NIF: ${escapeHtml(dados.nif)}</div>` : ""}
        ${dados.endereco ? `<div class="parte-detalhe">${escapeHtml(dados.endereco)}</div>` : ""}
        ${dados.telefone ? `<div class="parte-detalhe">Tel: ${escapeHtml(dados.telefone)}</div>` : ""}
      </div>
    </div>

    <div class="recibo-corpo">
      <div class="recibo-titulo">Detalhes do pagamento</div>
      <div class="recibo-linha">
        <span class="rl-label">Data de emissão</span>
        <span class="rl-valor">${escapeHtml(dataEmissao)}</span>
      </div>
      ${dados.facturaRef ? `<div class="recibo-linha">
        <span class="rl-label">Factura de referência</span>
        <span class="rl-valor">${escapeHtml(dados.facturaRef)}</span>
      </div>` : ""}
      ${dados.metodoPagamento ? `<div class="recibo-linha">
        <span class="rl-label">Método de pagamento</span>
        <span class="rl-valor">${escapeHtml(dados.metodoPagamento)}</span>
      </div>` : ""}
      ${dados.referencia ? `<div class="recibo-linha">
        <span class="rl-label">Referência</span>
        <span class="rl-valor">${escapeHtml(dados.referencia)}</span>
      </div>` : ""}
      ${dados.comprovativoUrl ? `<div class="recibo-linha">
        <span class="rl-label">Comprovativo digital</span>
        <span class="rl-valor">${escapeHtml(dados.comprovativoUrl)}</span>
      </div>` : ""}
      <div class="recibo-total">
        <span class="rl-label">Valor recebido</span>
        <span class="rl-valor">${fmtValor(dados.valorPago, moeda)}</span>
      </div>
    </div>

    ${dados.observacao ? `<div class="observacao">
      <strong>Observação</strong>
      ${escapeHtml(dados.observacao)}
    </div>` : ""}

    <div class="footer">
      <span><strong>${escapeHtml(dados.nomeComercial)}</strong> · Recibo ${escapeHtml(ref)}</span>
      <span>
        Emitido por <span class="footer-bizy">bizy<span class="footer-bizy-dot">.</span></span>
        · ${escapeHtml(dataEmissao)}
      </span>
    </div>
  </div>
</body>
</html>`;
}
