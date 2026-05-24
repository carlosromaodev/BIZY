import {
  CancelarReservaSchema,
  ConfirmarPagamentoSchema,
  RegistrarComprovativoPagamentoSchema
} from "../../../dominio/esquemas.js";
import { persistirValorMedia } from "../../media/MediaStorage.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloReservas: ModuloHttp = {
  nome: "reservas",
  descricao: "Operações manuais de reserva, pagamento, cancelamento e expiração.",
  registrar(app, contexto) {
    app.get("/reservas", async () => contexto.consultaPainel.listarReservas());

    app.get("/reservas/:id/recibo.pdf", async (request, reply) => {
      const { id } = request.params as { id: string };
      const recibo = await contexto.gerarReciboReserva.gerar(id);

      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Length", String(recibo.pdf.byteLength));
      reply.header("Content-Disposition", `attachment; filename="${recibo.nomeArquivo}"`);
      return reply.send(recibo.pdf);
    });

    app.post("/reservas/:id/confirmar-pagamento", async (request, reply) => {
      ConfirmarPagamentoSchema.parse(request.body ?? {});
      const { id } = request.params as { id: string };
      const resultado = await contexto.motorReservas.confirmarPagamento(id);
      await contexto.automacaoWhatsApp.notificarPagamentoConfirmado(resultado.reserva, resultado.peca);
      return reply.send(resultado);
    });

    app.post(
      "/reservas/:id/comprovativo",
      {
        bodyLimit: Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? 12_000_000) + 1024
      },
      async (request, reply) => {
        const dados = RegistrarComprovativoPagamentoSchema.parse(request.body ?? {});
        const { id } = request.params as { id: string };
        const comprovativoPagamentoUrl = await persistirValorMedia(dados.comprovativoPagamentoUrl ?? null, {
          purpose: "comprovativos-pagamento",
          allowDocuments: true
        });
        const resultado = await contexto.motorReservas.registrarComprovativoPagamento(
          id,
          comprovativoPagamentoUrl ?? null
        );
        return reply.send(resultado);
      }
    );

    app.post("/reservas/:id/cancelar", async (request, reply) => {
      const dados = CancelarReservaSchema.parse(request.body ?? {});
      const { id } = request.params as { id: string };
      const resultado = await contexto.motorReservas.cancelarReserva(id, {
        permitirCancelarPaga: dados.permitirCancelarPaga
      });
      await contexto.automacaoWhatsApp.notificarCancelamento(resultado.cancelada, resultado.peca, dados.motivo);

      if (resultado.promovida) {
        await contexto.automacaoWhatsApp.notificarChamadoFila(resultado.promovida, resultado.peca);
      }

      return reply.send(resultado);
    });

    app.post("/reservas/expirar", async () => contexto.monitorReservas.expirarReservasVencidas());
  }
};
