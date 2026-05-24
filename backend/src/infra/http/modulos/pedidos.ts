import {
  AtualizarEntregaPedidoSchema,
  AtualizarEstadoPedidoSchema,
  ConfirmarPagamentoPedidoSchema,
  CriarPedidoSchema,
  FiltrosPedidosQuerySchema
} from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloPedidos: ModuloHttp = {
  nome: "pedidos",
  descricao: "Pedidos completos com múltiplos itens, pagamento, entrega e exportação.",
  registrar(app, contexto) {
    app.get("/pedidos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para consultar pedidos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosPedidosQuerySchema.parse(request.query ?? {});
      return contexto.gestaoPedidos.listarPedidos(contextoComercial.negocio.id, filtros);
    });

    app.post("/pedidos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para gerir pedidos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarPedidoSchema.parse(request.body ?? {});
      const pedido = await contexto.gestaoPedidos.criarPedido({
        negocioId: contextoComercial.negocio.id,
        clienteNegocioId: dados.clienteId,
        reservaId: dados.reservaId,
        itens: dados.itens,
        origem: dados.origem,
        canal: dados.canal,
        descontoEmKwanza: dados.descontoEmKwanza,
        motivoDesconto: dados.motivoDesconto,
        taxaEntregaEmKwanza: dados.taxaEntregaEmKwanza,
        enderecoEntrega: dados.enderecoEntrega,
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl,
        observacao: dados.observacao,
        responsavelId: dados.responsavelId
      });
      return reply.code(201).send(pedido);
    });

    app.get("/pedidos/exportar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para exportar pedidos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const csv = await contexto.gestaoPedidos.exportarCsv(contextoComercial.negocio.id);
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"pedidos-bizy.csv\"");
      return reply.send(csv);
    });

    app.get("/pedidos/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para consultar pedidos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const perfil = await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id);
      if (!perfil) {
        return reply.code(404).send({ erro: "PEDIDO_NAO_ENCONTRADO", mensagem: "Pedido não encontrado." });
      }

      return perfil;
    });

    app.patch("/pedidos/:id/estado", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para gerir pedidos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarEstadoPedidoSchema.parse(request.body ?? {});
      return contexto.gestaoPedidos.atualizarEstado(id, contextoComercial.negocio.id, dados);
    });

    app.post("/pedidos/:id/confirmar-pagamento", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para confirmar pagamentos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = ConfirmarPagamentoPedidoSchema.parse(request.body ?? {});
      return contexto.gestaoPedidos.confirmarPagamento(id, contextoComercial.negocio.id, dados);
    });

    app.patch("/pedidos/:id/entrega", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para gerir entrega do pedido.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarEntregaPedidoSchema.parse(request.body ?? {});
      return contexto.gestaoPedidos.atualizarEntrega(id, contextoComercial.negocio.id, dados);
    });
  }
};
