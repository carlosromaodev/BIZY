import { escapeHtml } from "./PdfRenderer.js";

export interface DadosFacturaPdf {
  serie: string;
  numero: number;
  anoFiscal: number;
  estado: string;
  emitidaEm: Date;

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
  clienteEndereco?: string | null;

  // Valores
  subtotal: number;
  ivaPercentual: number;
  ivaValor: number;
  total: number;
  observacao?: string | null;

  // Itens
  itens: {
    descricao: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    ivaPercentual: number;
    ivaValor: number;
  }[];
}

/*
 * BIZY Design Tokens (espelhados de frontend/src/estilos.css)
 *
 * --ink:     #17211c     texto principal (verde-escuro)
 * --ink-2:   #46514b     texto secundário
 * --ink-3:   #6e7873     texto muted
 * --ink-4:   #9aa39e     texto subtle
 * --line:    #e7e4dc     borda principal (creme quente)
 * --line-2:  #f0ede6     borda suave
 * --bg:      #faf8f4     fundo creme
 * --surface: #ffffff     painéis
 * --green:   #16A07A     accent emerald (brand)
 * --rose:    (oklch)     erro/anulado
 * --amber:   (oklch)     aviso
 * --radius:  0           flat (sem border-radius)
 *
 * Brand logo: "bizy." — wordmark em Geist 700, ponto em verde #16A07A
 * Favicon:    rect escuro #0B1014, "b." branco + verde
 */

const INK      = "#17211c";
const INK_2    = "#46514b";
const INK_3    = "#6e7873";
const INK_4    = "#9aa39e";
const LINE     = "#e7e4dc";
const LINE_2   = "#f0ede6";
const BG       = "#faf8f4";
const GREEN    = "#16A07A";
const BRAND_BG = "#0B1014";

function fmtValor(centavos: number, moeda: string) {
  const valor = (centavos / 100).toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

function corEstado(estado: string): { bg: string; cor: string } {
  if (estado === "ANULADA") return { bg: "#fef2f2", cor: "#b91c1c" };
  if (estado === "CORRIGIDA") return { bg: "#fffbeb", cor: "#92400e" };
  return { bg: "#f0fdf4", cor: "#15803d" };
}

export function buildFacturaHtml(dados: DadosFacturaPdf): string {
  const ref = `${dados.serie} ${String(dados.numero).padStart(4, "0")}/${dados.anoFiscal}`;
  const dataEmissao = fmtData(dados.emitidaEm);
  const moeda = dados.moeda || "AOA";
  const est = corEstado(dados.estado);

  const linhasItens = dados.itens
    .map(
      (item, i) => `
    <tr>
      <td class="col-num">${i + 1}</td>
      <td class="col-desc">${escapeHtml(item.descricao)}</td>
      <td class="col-qty">${item.quantidade}</td>
      <td class="col-price">${fmtValor(item.precoUnitario, moeda)}</td>
      <td class="col-iva">${item.ivaPercentual}%</td>
      <td class="col-total">${fmtValor(item.subtotal + item.ivaValor, moeda)}</td>
    </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<title>Factura ${escapeHtml(ref)}</title>
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

  /* ── Top accent bar (brand green → ink) ── */
  .top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${GREEN} 0%, ${INK} 100%);
  }

  /* ── Header ── */
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
  .brand-icon-dot {
    color: ${GREEN};
  }
  .brand-info {}
  .brand-wordmark {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.055em;
    color: ${INK};
  }
  .brand-wordmark-dot {
    color: ${GREEN};
  }
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
    color: ${est.cor};
    background: ${est.bg};
    border: 1px solid ${est.cor}22;
  }

  /* ── Partes (emitente / cliente) ── */
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
  .parte-data {
    margin-top: 4mm;
    font-size: 9px;
    color: ${INK_3};
  }
  .parte-data strong {
    color: ${INK};
    font-weight: 650;
  }

  /* ── Tabela de itens ── */
  .tabela {
    width: 100%;
    margin-top: 8mm;
    border-collapse: collapse;
    font-size: 10px;
  }
  .tabela thead th {
    background: ${BG};
    border-top: 1px solid ${LINE};
    border-bottom: 1px solid ${LINE};
    padding: 3mm 2.5mm;
    font-size: 8px;
    font-weight: 700;
    color: ${INK_3};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: left;
  }
  .tabela tbody td {
    padding: 3mm 2.5mm;
    border-bottom: 1px solid ${LINE_2};
    font-size: 10px;
    line-height: 1.4;
    vertical-align: top;
    color: ${INK};
  }
  .col-num { width: 8mm; text-align: center; color: ${INK_4}; font-variant-numeric: tabular-nums; }
  .col-desc { }
  .col-qty { width: 16mm; text-align: center; font-variant-numeric: tabular-nums; }
  .col-price { width: 30mm; text-align: right; font-variant-numeric: tabular-nums; }
  .col-iva { width: 14mm; text-align: center; font-variant-numeric: tabular-nums; }
  .col-total { width: 32mm; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }

  /* ── Totais ── */
  .totais {
    display: flex;
    justify-content: flex-end;
    margin-top: 6mm;
  }
  .totais-box {
    width: 80mm;
  }
  .totais-row {
    display: flex;
    justify-content: space-between;
    padding: 2mm 0;
    font-size: 10px;
    color: ${INK_2};
  }
  .totais-row.sep {
    border-top: 1px solid ${LINE};
    margin-top: 1mm;
    padding-top: 3mm;
  }
  .totais-row.total-final {
    border-top: 2px solid ${INK};
    margin-top: 2mm;
    padding-top: 3.5mm;
    font-size: 14px;
    font-weight: 800;
    color: ${INK};
  }
  .totais-row .label { font-weight: 500; }
  .totais-row .valor { font-variant-numeric: tabular-nums; font-weight: 600; }

  /* ── Observação ── */
  .observacao {
    margin-top: 10mm;
    padding: 4mm 5mm;
    background: ${BG};
    border-left: 2px solid ${GREEN};
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

  /* ── Footer ── */
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
  .footer-bizy-dot {
    color: ${GREEN};
  }
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
        <div class="brand-info">
          <div class="brand-wordmark">bizy<span class="brand-wordmark-dot">.</span></div>
          <div class="brand-negocio">${escapeHtml(dados.nomeComercial)}</div>
          <div class="brand-sub">${dados.nif ? `NIF ${escapeHtml(dados.nif)}` : "Documento comercial"}</div>
        </div>
      </div>
      <div class="doc-ref">
        <span class="label">Factura</span>
        <span class="value">${escapeHtml(ref)}</span>
        <span class="estado">${escapeHtml(dados.estado)}</span>
      </div>
    </div>

    <div class="partes">
      <div>
        <div class="parte-label">Emitente</div>
        <div class="parte-nome">${escapeHtml(dados.nomeComercial)}</div>
        ${dados.nif ? `<div class="parte-detalhe">NIF: ${escapeHtml(dados.nif)}</div>` : ""}
        ${dados.endereco ? `<div class="parte-detalhe">${escapeHtml(dados.endereco)}</div>` : ""}
        ${dados.telefone ? `<div class="parte-detalhe">Tel: ${escapeHtml(dados.telefone)}</div>` : ""}
        ${dados.email ? `<div class="parte-detalhe">${escapeHtml(dados.email)}</div>` : ""}
      </div>
      <div>
        <div class="parte-label">Cliente</div>
        <div class="parte-nome">${escapeHtml(dados.clienteNome)}</div>
        ${dados.clienteNif ? `<div class="parte-detalhe">NIF: ${escapeHtml(dados.clienteNif)}</div>` : ""}
        ${dados.clienteEndereco ? `<div class="parte-detalhe">${escapeHtml(dados.clienteEndereco)}</div>` : ""}
        <div class="parte-data">Emissão: <strong>${escapeHtml(dataEmissao)}</strong></div>
      </div>
    </div>

    <table class="tabela">
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-desc">Descrição</th>
          <th class="col-qty">Qtd</th>
          <th class="col-price">P. Unit.</th>
          <th class="col-iva">IVA</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>
        ${linhasItens}
      </tbody>
    </table>

    <div class="totais">
      <div class="totais-box">
        <div class="totais-row">
          <span class="label">Subtotal</span>
          <span class="valor">${fmtValor(dados.subtotal, moeda)}</span>
        </div>
        <div class="totais-row sep">
          <span class="label">IVA (${dados.ivaPercentual}%)</span>
          <span class="valor">${fmtValor(dados.ivaValor, moeda)}</span>
        </div>
        <div class="totais-row total-final">
          <span class="label">Total</span>
          <span class="valor">${fmtValor(dados.total, moeda)}</span>
        </div>
      </div>
    </div>

    ${
      dados.observacao
        ? `<div class="observacao">
        <strong>Observação</strong>
        ${escapeHtml(dados.observacao)}
      </div>`
        : ""
    }

    <div class="footer">
      <span><strong>${escapeHtml(dados.nomeComercial)}</strong> · Factura ${escapeHtml(ref)}</span>
      <span>
        Emitido por <span class="footer-bizy">bizy<span class="footer-bizy-dot">.</span></span>
        · ${escapeHtml(dataEmissao)}
      </span>
    </div>
  </div>
</body>
</html>`;
}
