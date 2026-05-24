import type { RepositorioPecas, RepositorioReservas } from "../dominio/repositorios/contratos.js";
import type { Peca, Reserva } from "../dominio/tipos.js";
import { escapeHtml, formatDateLabel, renderPdfFromHtml, type OpcoesRenderPdf } from "../infra/pdf/PdfRenderer.js";

export type RenderizadorPdf = (html: string, options?: OpcoesRenderPdf) => Promise<Buffer>;

export class GerarReciboReservaUseCase {
  constructor(
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioPecas: RepositorioPecas,
    private readonly renderizadorPdf: RenderizadorPdf = renderPdfFromHtml
  ) {}

  async gerar(idReserva: string) {
    const reserva = await this.repositorioReservas.buscarPorId(idReserva);
    if (!reserva) {
      throw new Error(`Reserva ${idReserva} não encontrada.`);
    }

    const peca = await this.repositorioPecas.buscarPorCodigo(reserva.codigoPeca);
    if (!peca) {
      throw new Error(`Peça #${reserva.codigoPeca} não encontrada.`);
    }

    const html = renderizarHtmlReciboReserva(reserva, peca);
    const pdf = await this.renderizadorPdf(html, {
      footerLabel: "ÉMeu - Recibo de reserva",
      displayHeaderFooter: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "16mm",
        left: "10mm"
      }
    });

    return {
      pdf,
      nomeArquivo: `recibo-emeu-${normalizarParteArquivo(peca.codigo)}-${reserva.id.slice(0, 8)}.pdf`,
      reserva,
      peca
    };
  }
}

export function renderizarHtmlReciboReserva(reserva: Reserva, peca: Peca) {
  const estado = labelEstadoReserva(reserva.estado);
  const estadoPagamento = labelEstadoPagamento(reserva.estadoPagamento);
  const expiraEm = reserva.expiraEm ? formatDateLabel(reserva.expiraEm) : "Sem expiração definida";

  return `<!doctype html>
<html lang="pt-AO">
  <head>
    <meta charset="utf-8" />
    <title>Recibo ÉMeu ${escapeHtml(reserva.id)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #172026;
        background: #f6f7f8;
        font-family: Arial, sans-serif;
      }
      .page {
        min-height: 100vh;
        padding: 28px;
        background: #ffffff;
      }
      .topbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        border-bottom: 2px solid #172026;
        padding-bottom: 18px;
        margin-bottom: 22px;
      }
      .brand {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: 0;
      }
      .subtitle {
        margin-top: 6px;
        color: #5f6672;
        font-size: 12px;
        text-transform: uppercase;
      }
      .status {
        border: 1px solid #172026;
        padding: 8px 10px;
        font-size: 12px;
        font-weight: 700;
      }
      h1 {
        margin: 0 0 18px;
        font-size: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .box {
        border: 1px solid #d7dde2;
        padding: 14px;
        min-height: 76px;
      }
      .label {
        display: block;
        color: #5f6672;
        font-size: 11px;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .value {
        font-size: 15px;
        font-weight: 700;
      }
      .wide { grid-column: 1 / -1; }
      .muted {
        color: #5f6672;
        font-size: 12px;
        line-height: 1.5;
      }
      .footer {
        margin-top: 24px;
        padding-top: 14px;
        border-top: 1px solid #d7dde2;
        color: #5f6672;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar">
        <div>
          <div class="brand">ÉMeu</div>
          <div class="subtitle">Automação de vendas em lives</div>
        </div>
        <div class="status">${escapeHtml(estado)}</div>
      </header>

      <h1>Recibo de reserva</h1>

      <section class="grid">
        ${box("Reserva", reserva.id)}
        ${box("Criada em", formatDateLabel(reserva.criadaEm))}
        ${box("Cliente", reserva.nomeCliente)}
        ${box("Telefone", reserva.telefoneCliente)}
        ${box("Peça", `#${peca.codigo} - ${peca.nome}`)}
        ${box("Valor", formatarKwanza(peca.precoEmKwanza))}
        ${box("Estado do pagamento", estadoPagamento)}
        ${box("Expira em", expiraEm)}
        ${box("Live", reserva.liveId)}
        ${box("Username", reserva.usernameCliente)}
        ${box("Comentário original", reserva.comentarioOriginal, "wide")}
      </section>

      <p class="footer">
        Este recibo confirma o estado registado no ÉMeu no momento da emissão. A confirmação final de pagamento depende da validação humana do vendedor.
      </p>
    </main>
  </body>
</html>`;
}

function box(label: string, value: string, className = "") {
  return `<div class="box ${className}">
    <span class="label">${escapeHtml(label)}</span>
    <span class="value">${escapeHtml(value)}</span>
  </div>`;
}

function formatarKwanza(valor: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0
  }).format(valor);
}

function labelEstadoReserva(estado: Reserva["estado"]) {
  const labels: Record<Reserva["estado"], string> = {
    PENDING: "Pendente",
    RESERVED: "Reservada",
    WAITING_PAYMENT: "Aguardando pagamento",
    PAID: "Paga",
    EXPIRED: "Expirada",
    CANCELLED: "Cancelada",
    WAITLISTED: "Fila de espera"
  };

  return labels[estado] ?? estado;
}

function labelEstadoPagamento(estado: Reserva["estadoPagamento"]) {
  const labels: Record<Reserva["estadoPagamento"], string> = {
    AGUARDANDO_COMPROVATIVO: "Aguardando comprovativo",
    COMPROVATIVO_RECEBIDO: "Comprovativo recebido",
    CONFIRMADO: "Confirmado",
    REJEITADO: "Rejeitado"
  };

  return labels[estado] ?? estado;
}

function normalizarParteArquivo(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "reserva";
}
