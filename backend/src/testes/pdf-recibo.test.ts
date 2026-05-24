import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { escapeHtml } from "../infra/pdf/PdfRenderer.js";
import { MotorReservas } from "../use-case/MotorReservas.js";
import { GerarReciboReservaUseCase } from "../use-case/GerarReciboReservaUseCase.js";
import { RepositorioPecasMemoria, RepositorioReservasMemoria } from "../use-case/repositorios/RepositorioMemoria.js";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Recibo PDF de reserva", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      PDF_RENDERER_ENGINE: "fallback"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("escapa HTML antes de montar o recibo", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;"
    );
  });

  it("gera HTML do recibo e delega renderização para PDF", async () => {
    const pecas = new RepositorioPecasMemoria();
    const reservas = new RepositorioReservasMemoria(pecas);
    const eventos = new DespachadorEventos();
    const motor = new MotorReservas(pecas, reservas, eventos);
    let htmlCapturado = "";

    await pecas.criar({
      codigo: "9",
      nome: "Vestido <premium>",
      descricao: "Peça piloto",
      precoEmKwanza: 15000,
      quantidade: 1,
      fotos: []
    });
    const resultadoReserva = await motor.criarReserva(
      {
        source: "manual",
        provider: "manual",
        liveId: "live_pdf",
        username: "cliente_pdf",
        displayName: "Ana <script>",
        commentText: "quero 9 923456789",
        timestamp: new Date("2026-05-21T12:00:00.000Z")
      },
      {
        intent: "BUY",
        phone: "923456789",
        productCode: "9",
        confidence: 0.98,
        requiresManualReview: false,
        reasons: []
      }
    );

    const useCase = new GerarReciboReservaUseCase(reservas, pecas, async (html) => {
      htmlCapturado = html;
      return Buffer.from("%PDF-FAKE");
    });

    const recibo = await useCase.gerar(resultadoReserva.reserva!.id);

    expect(recibo.nomeArquivo).toMatch(/^recibo-emeu-9-/);
    expect(recibo.pdf.toString()).toBe("%PDF-FAKE");
    expect(htmlCapturado).toContain("Vestido &lt;premium&gt;");
    expect(htmlCapturado).toContain("Ana &lt;script&gt;");
    expect(htmlCapturado).toContain("923456789");
  });

  it("expõe endpoint PDF autenticado para uma reserva", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo: "8",
          nome: "Carteira PDF",
          descricao: "Peça piloto",
          precoEmKwanza: 5000,
          quantidade: 1,
          fotos: []
        }
      });
      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_pdf_http",
          username: "cliente_pdf_http",
          displayName: "Cliente PDF",
          commentText: "quero peça 8 923456789"
        }
      });
      const reservaId = comentario.json().reserva.id as string;

      const resposta = await app.inject({
        method: "GET",
        url: `/reservas/${reservaId}/recibo.pdf`,
        headers
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.headers["content-type"]).toContain("application/pdf");
      expect(resposta.rawPayload.toString("utf8", 0, 4)).toBe("%PDF");
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const telefone = "923000030";
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome: "Vendedor PDF" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
