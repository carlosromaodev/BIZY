import { z } from "zod";
import {
  AtualizarEnderecoEntregaSchema,
  CancelarReservaSchema,
  ClassificarMensagemN8nSchema,
  ConfirmarPagamentoSchema,
  ParamIdSchema,
  RegistrarComprovativoPagamentoSchema,
  RejeitarPagamentoSchema
} from "../../../dominio/esquemas.js";
import { persistirValorMedia } from "../../media/MediaStorage.js";
import { ehErroInfraestrutura } from "../errosHttp.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const ParamPhoneSchema = z.object({ phone: z.string().trim().min(1) });
const ParamCodeSchema = z.object({ code: z.string().trim().min(1) });

export const moduloN8n: ModuloHttp = {
  nome: "n8n",
  descricao: "Endpoints controlados para automações, IA e aprovação humana.",
  registrar(app, contexto) {
    app.get("/n8n/customers/by-phone/:phone", async (request, reply) => {
      const { phone } = ParamPhoneSchema.parse(request.params);

      try {
        return await contexto.consultaAtendimentoN8n.buscarClientePorTelefone(phone);
      } catch (erro) {
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "TELEFONE_INVALIDO", mensagem: (erro as Error).message });
      }
    });

    app.get("/n8n/reservations/active/:phone", async (request, reply) => {
      const { phone } = ParamPhoneSchema.parse(request.params);

      try {
        return await contexto.consultaAtendimentoN8n.listarReservasAtivasPorTelefone(phone);
      } catch (erro) {
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "TELEFONE_INVALIDO", mensagem: (erro as Error).message });
      }
    });

    app.get("/n8n/products/:code", async (request, reply) => {
      const { code } = ParamCodeSchema.parse(request.params);
      const produto = await contexto.consultaAtendimentoN8n.buscarProduto(code);

      if (!produto) {
        return reply.code(404).send({ erro: "PECA_NAO_ENCONTRADA", mensagem: `Peça #${code} não encontrada.` });
      }

      return produto;
    });

    app.post("/n8n/messages/classify", async (request) => {
      const dados = ClassificarMensagemN8nSchema.parse(request.body ?? {});
      return contexto.consultaAtendimentoN8n.classificarMensagemParaHumano(dados.texto);
    });

    app.post("/n8n/reservations/:id/cancel", async (request, reply) => {
      const dados = CancelarReservaSchema.parse(request.body ?? {});
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.motorReservas.cancelarReserva(id, {
        permitirCancelarPaga: dados.permitirCancelarPaga
      });
      await contexto.automacaoWhatsApp.notificarCancelamento(resultado.cancelada, resultado.peca, dados.motivo);

      if (resultado.promovida) {
        await contexto.automacaoWhatsApp.notificarChamadoFila(resultado.promovida, resultado.peca);
      }

      return reply.send(resultado);
    });

    app.post(
      "/n8n/payments/:id/proof-received",
      {
        bodyLimit: Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? 12_000_000) + 1024
      },
      async (request, reply) => {
        const dados = RegistrarComprovativoPagamentoSchema.parse(request.body ?? {});
        const { id } = ParamIdSchema.parse(request.params);
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

    app.post("/n8n/payments/:id/confirm", async (request, reply) => {
      ConfirmarPagamentoSchema.parse(request.body ?? {});
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.motorReservas.confirmarPagamento(id);
      await contexto.automacaoWhatsApp.notificarPagamentoConfirmado(resultado.reserva, resultado.peca);
      return reply.send(resultado);
    });

    app.post("/n8n/payments/:id/reject", async (request, reply) => {
      const dados = RejeitarPagamentoSchema.parse(request.body ?? {});
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.motorReservas.rejeitarPagamento(id, dados.motivo);
      return reply.send(resultado);
    });

    app.post("/n8n/orders/:id/delivery-address", async (request, reply) => {
      const dados = AtualizarEnderecoEntregaSchema.parse(request.body ?? {});
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.motorReservas.atualizarEnderecoEntrega(id, dados.enderecoEntrega);
      return reply.send(resultado);
    });

    app.post("/n8n/orders/:id/delivered", async (request, reply) => {
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.motorReservas.marcarPedidoEntregue(id);
      return reply.send(resultado);
    });
  }
};
