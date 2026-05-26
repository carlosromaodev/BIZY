import {
  AtualizarEntregaPedidoSchema,
  AtualizarEstadoPedidoSchema,
  AprovarDescontoPedidoSchema,
  ConfirmarPagamentoPedidoSchema,
  CriarOrcamentoPedidoSchema,
  CriarPedidoSchema,
  FiltrosEntregaPedidoQuerySchema,
  FiltrosPedidosQuerySchema,
  RecuperarPedidosParadosSchema,
  SolicitarDescontoPedidoSchema
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
        enderecoEntregaId: dados.enderecoEntregaId,
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl,
        observacao: dados.observacao,
        responsavelId: dados.responsavelId
      });
      return reply.code(201).send(pedido);
    });

    app.post("/pedidos/orcamentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para gerar orçamento.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarOrcamentoPedidoSchema.parse(request.body ?? {});
      const orcamento = await contexto.gestaoPedidos.criarOrcamento({
        negocioId: contextoComercial.negocio.id,
        clienteNegocioId: dados.clienteId,
        itens: dados.itens,
        origem: dados.origem,
        canal: dados.canal,
        descontoEmKwanza: dados.descontoEmKwanza,
        motivoDesconto: dados.motivoDesconto,
        taxaEntregaEmKwanza: dados.taxaEntregaEmKwanza,
        enderecoEntrega: dados.enderecoEntrega,
        enderecoEntregaId: dados.enderecoEntregaId,
        observacao: dados.observacao,
        responsavelId: dados.responsavelId,
        validadeMinutos: dados.validadeMinutos
      });
      return reply.code(201).send(orcamento);
    });

    app.get("/pedidos/exportar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para exportar pedidos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosPedidosQuerySchema.parse(request.query ?? {});
      const exportacao = await contexto.gestaoPedidos.exportarCsv(contextoComercial.negocio.id, filtros);
      contexto.eventos.emitir("ORDERS_EXPORTED", {
        negocioId: contextoComercial.negocio.id,
        usuarioId: contextoComercial.usuario.id,
        recurso: "pedidos",
        formato: "csv",
        quantidade: exportacao.quantidade,
        filtros: exportacao.filtros
      });
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"pedidos-bizy.csv\"");
      return reply.send(exportacao.csv);
    });

    app.get("/pedidos/preparacao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para consultar lista de preparação.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoPedidos.gerarListaPreparacao(contextoComercial.negocio.id);
    });

    app.get("/pedidos/entregas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para consultar lista de entregas.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosEntregaPedidoQuerySchema.parse(request.query ?? {});
      return contexto.gestaoPedidos.gerarListaEntregas(contextoComercial.negocio.id, filtros);
    });

    app.post("/pedidos/recuperar-parados", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para recuperar pedidos parados.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const dados = RecuperarPedidosParadosSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPedidos.recuperarPedidosParados(contextoComercial.negocio.id, dados);
      return reply.code(201).send(resultado);
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

    app.post("/pedidos/:id/descontos/solicitar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para solicitar desconto.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = SolicitarDescontoPedidoSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPedidos.solicitarDesconto(id, contextoComercial.negocio.id, {
        ...dados,
        solicitadoPor: contextoComercial.usuario.id
      });
      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "pedidos",
        tipo: "DESCONTO_SOLICITADO",
        entidadeTipo: "pedido",
        entidadeId: id,
        idempotencyKey: `desconto-solicitado:${contextoComercial.negocio.id}:${id}:${dados.descontoEmKwanza}`,
        payload: {
          descontoEmKwanza: dados.descontoEmKwanza,
          motivo: dados.motivo,
          responsavelId: dados.responsavelId,
          tarefaId: resultado.tarefa.id
        },
        estado: "PENDENTE"
      });

      return reply.code(201).send(resultado);
    });

    app.post("/pedidos/:id/descontos/aprovar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para aprovar desconto.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AprovarDescontoPedidoSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPedidos.aprovarDesconto(id, contextoComercial.negocio.id, dados);
      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "pedidos",
        tipo: "DESCONTO_APROVADO",
        entidadeTipo: "pedido",
        entidadeId: id,
        idempotencyKey: `desconto-aprovado:${contextoComercial.negocio.id}:${id}:${dados.descontoEmKwanza}`,
        payload: {
          descontoEmKwanza: dados.descontoEmKwanza,
          motivo: dados.motivo,
          aprovadoPor: dados.aprovadoPor,
          totalEmKwanza: resultado.pedido.totalEmKwanza
        },
        estado: "PROCESSADO"
      });

      return resultado;
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
