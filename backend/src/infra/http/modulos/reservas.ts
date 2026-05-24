import {
  CancelarReservaSchema,
  ConfirmarPagamentoSchema,
  RegistrarComprovativoPagamentoSchema
} from "../../../dominio/esquemas.js";
import { persistirValorMedia } from "../../media/MediaStorage.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloReservas: ModuloHttp = {
  nome: "reservas",
  descricao: "Operações manuais de reserva, pagamento, cancelamento e expiração.",
  registrar(app, contexto) {
    app.get("/reservas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "reservas",
        mensagemPermissao: "Sem permissão para consultar reservas.",
        mensagemModulo: "Reservas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.consultaPainel.listarReservas(contextoComercial.negocio.id);
    });

    app.get("/reservas/:id/recibo.pdf", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "reservas",
        mensagemPermissao: "Sem permissão para consultar recibos.",
        mensagemModulo: "Reservas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const reserva = await contexto.repositorios.reservas.buscarPorId(id, contextoComercial.negocio.id);
      if (!reserva) {
        return reply.code(404).send({ erro: "RESERVA_NAO_ENCONTRADA", mensagem: "Reserva não encontrada." });
      }
      const recibo = await contexto.gerarReciboReserva.gerar(id);

      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Length", String(recibo.pdf.byteLength));
      reply.header("Content-Disposition", `attachment; filename="${recibo.nomeArquivo}"`);
      return reply.send(recibo.pdf);
    });

    app.post("/reservas/:id/confirmar-pagamento", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "reservas",
        mensagemPermissao: "Sem permissão para confirmar pagamentos.",
        mensagemModulo: "Reservas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      ConfirmarPagamentoSchema.parse(request.body ?? {});
      const { id } = request.params as { id: string };
      const resultado = await contexto.motorReservas.confirmarPagamento(id, { negocioId: contextoComercial.negocio.id });
      await contexto.automacaoWhatsApp.notificarPagamentoConfirmado(resultado.reserva, resultado.peca);
      return reply.send(resultado);
    });

    app.post(
      "/reservas/:id/comprovativo",
      {
        bodyLimit: Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? 12_000_000) + 1024
      },
      async (request, reply) => {
        const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
          permissao: "pedidos:gerir",
          modulo: "reservas",
          mensagemPermissao: "Sem permissão para gerir comprovativos.",
          mensagemModulo: "Reservas desativadas para este negócio."
        });
        if (!contextoComercial) return;

        const dados = RegistrarComprovativoPagamentoSchema.parse(request.body ?? {});
        const { id } = request.params as { id: string };
        const comprovativoPagamentoUrl = await persistirValorMedia(dados.comprovativoPagamentoUrl ?? null, {
          purpose: "comprovativos-pagamento",
          allowDocuments: true
        });
        const resultado = await contexto.motorReservas.registrarComprovativoPagamento(
          id,
          comprovativoPagamentoUrl ?? null,
          { negocioId: contextoComercial.negocio.id }
        );
        return reply.send(resultado);
      }
    );

    app.post("/reservas/:id/cancelar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "reservas",
        mensagemPermissao: "Sem permissão para cancelar reservas.",
        mensagemModulo: "Reservas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CancelarReservaSchema.parse(request.body ?? {});
      const { id } = request.params as { id: string };
      const resultado = await contexto.motorReservas.cancelarReserva(id, {
        permitirCancelarPaga: dados.permitirCancelarPaga,
        negocioId: contextoComercial.negocio.id
      });
      await contexto.automacaoWhatsApp.notificarCancelamento(resultado.cancelada, resultado.peca, dados.motivo);

      if (resultado.promovida) {
        await contexto.automacaoWhatsApp.notificarChamadoFila(resultado.promovida, resultado.peca);
      }

      return reply.send(resultado);
    });

    app.post("/reservas/expirar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "reservas",
        mensagemPermissao: "Sem permissão para expirar reservas.",
        mensagemModulo: "Reservas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.monitorReservas.expirarReservasVencidas();
    });
  }
};
