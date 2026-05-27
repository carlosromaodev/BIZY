import {
  AtualizarEntregaPedidoSchema,
  AtualizarEstadoPedidoSchema,
  AtualizarItensPedidoSchema,
  AprovarDescontoPedidoSchema,
  ConfirmarPagamentoPedidoSchema,
  CriarOrcamentoPedidoSchema,
  CriarPedidoSchema,
  FiltrosEntregaPedidoQuerySchema,
  FiltrosPedidosQuerySchema,
  RegistrarComprovativoPagamentoSchema,
  RecuperarPedidosParadosSchema,
  RejeitarPagamentoSchema,
  SolicitarDescontoPedidoSchema
} from "../../../dominio/esquemas.js";
import { persistirValorMedia } from "../../media/MediaStorage.js";
import {
  exigirAcessoComercial,
  obterLimiteDescontoSemAprovacaoPercentual,
  temPermissao,
  type ContextoComercialHttp
} from "../contextoComercial.js";
import { montarAlteracoes, registrarAuditoriaCritica } from "../auditoriaOperacional.js";
import type { Pedido } from "../../../dominio/tipos.js";
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
        responsavelId: dados.responsavelId,
        ...politicaDescontoDoContexto(contextoComercial)
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
        validadeMinutos: dados.validadeMinutos,
        ...politicaDescontoDoContexto(contextoComercial)
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

    app.get("/pedidos/:id/recibo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para consultar recibos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const perfil = await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id);
      if (!perfil) {
        return reply.code(404).send({ erro: "PEDIDO_NAO_ENCONTRADO", mensagem: "Pedido não encontrado." });
      }

      return { recibo: await contexto.gestaoPedidos.gerarRecibo(id, contextoComercial.negocio.id) };
    });

    app.get("/pedidos/:id/historico-pagamento", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para consultar histórico de pagamento.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const perfil = await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id);
      if (!perfil) {
        return reply.code(404).send({ erro: "PEDIDO_NAO_ENCONTRADO", mensagem: "Pedido não encontrado." });
      }

      const tiposPagamento = new Set(["COMPROVATIVO_RECEBIDO", "PAGAMENTO_REJEITADO", "PAGAMENTO_CONFIRMADO"]);
      const eventos = await contexto.gestaoGovernancaCrm.listarEventos(contextoComercial.negocio.id, {
        topico: "pedidos",
        entidadeTipo: "pedido",
        entidadeId: id,
        limite: 100
      });

      return {
        eventos: eventos
          .filter((evento) => tiposPagamento.has(evento.tipo))
          .map((evento) => ({
            id: evento.id,
            tipo: evento.tipo,
            estado: evento.estado,
            payload: evento.payload,
            criadoEm: evento.criadoEm
          }))
      };
    });

    app.patch("/pedidos/:id/itens", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para gerir itens do pedido.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarItensPedidoSchema.parse(request.body ?? {});
      const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
      const pedido = await contexto.gestaoPedidos.atualizarItens(id, contextoComercial.negocio.id, dados);
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "pedidos",
        tipo: "ITENS_PEDIDO_ATUALIZADOS",
        entidadeTipo: "pedido",
        entidadeId: id,
        motivo: dados.observacao ?? "Itens do pedido atualizados.",
        alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(pedido), [
          "itens",
          "subtotalEmKwanza",
          "totalEmKwanza",
          "observacao"
        ])
      });
      return pedido;
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
      const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
      if (dados.estado === "CANCELADO") {
        if (!temPermissao(contextoComercial.permissoes, "pedidos:cancelar")) {
          return reply.code(403).send({
            erro: "PERMISSAO_NEGADA",
            mensagem: "Sem permissão para cancelar pedidos."
          });
        }
        if (!dados.observacao?.trim()) {
          return reply.code(400).send({
            erro: "MOTIVO_CANCELAMENTO_OBRIGATORIO",
            mensagem: "Cancelamento de pedido exige motivo operacional para auditoria."
          });
        }
      }
      const pedido = await contexto.gestaoPedidos.atualizarEstado(id, contextoComercial.negocio.id, dados);
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "pedidos",
        tipo: pedido.estado === "CANCELADO" ? "PEDIDO_CANCELADO" : "PEDIDO_ATUALIZADO",
        entidadeTipo: "pedido",
        entidadeId: id,
        motivo: dados.observacao ?? null,
        alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(pedido), [
          "estado",
          "estadoPagamento",
          "responsavelId",
          "observacao",
          "canceladoEm"
        ])
      });
      return pedido;
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
        permissao: "descontos:aprovar",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para aprovar desconto.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AprovarDescontoPedidoSchema.parse(request.body ?? {});
      const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
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
          atorUsuarioId: contextoComercial.usuario.id,
          totalEmKwanza: resultado.pedido.totalEmKwanza,
          alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(resultado.pedido), [
            "descontoEmKwanza",
            "motivoDesconto",
            "totalEmKwanza",
            "observacao"
          ])
        },
        estado: "PROCESSADO"
      });

      return resultado;
    });

    app.post(
      "/pedidos/:id/comprovativo",
      {
        bodyLimit: Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? 12_000_000) + 1024
      },
      async (request, reply) => {
        const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
          permissao: "pagamentos:gerir",
          modulo: "pedidos",
          mensagemPermissao: "Sem permissão para gerir comprovativos de pagamento.",
          mensagemModulo: "Pedidos desativados para este negócio."
        });
        if (!contextoComercial) return;

        const { id } = request.params as { id: string };
        const dados = RegistrarComprovativoPagamentoSchema.parse(request.body ?? {});
        const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
        const comprovativoPagamentoUrl = await persistirValorMedia(dados.comprovativoPagamentoUrl ?? null, {
          purpose: "comprovativos-pagamento",
          allowDocuments: true
        });
        const pedido = await contexto.gestaoPedidos.registrarComprovativo(id, contextoComercial.negocio.id, {
          comprovativoPagamentoUrl,
          observacao: dados.observacao ?? null
        });
        await registrarAuditoriaCritica(contexto, contextoComercial, {
          topico: "pedidos",
          tipo: "COMPROVATIVO_RECEBIDO",
          entidadeTipo: "pedido",
          entidadeId: id,
          motivo: dados.observacao ?? "Comprovativo de pagamento anexado.",
          alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(pedido), [
            "estadoPagamento",
            "comprovativoPagamentoUrl",
            "observacao"
          ])
        });
        return pedido;
      }
    );

    app.post("/pedidos/:id/rejeitar-pagamento", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "pedidos",
        mensagemPermissao: "Sem permissão para rejeitar pagamentos.",
        mensagemModulo: "Pedidos desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = RejeitarPagamentoSchema.parse(request.body ?? {});
      const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
      const pedido = await contexto.gestaoPedidos.rejeitarPagamento(id, contextoComercial.negocio.id, {
        motivo: dados.motivo
      });
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "pedidos",
        tipo: "PAGAMENTO_REJEITADO",
        entidadeTipo: "pedido",
        entidadeId: id,
        motivo: dados.motivo,
        alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(pedido), [
          "estado",
          "estadoPagamento",
          "observacao",
          "pagoEm"
        ])
      });
      return pedido;
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
      const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
      const pedido = await contexto.gestaoPedidos.confirmarPagamento(id, contextoComercial.negocio.id, dados);
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "pedidos",
        tipo: "PAGAMENTO_CONFIRMADO",
        entidadeTipo: "pedido",
        entidadeId: id,
        motivo: dados.observacao ?? "Pagamento confirmado.",
        alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(pedido), [
          "estado",
          "estadoPagamento",
          "comprovativoPagamentoUrl",
          "pagoEm",
          "observacao"
        ])
      });
      return pedido;
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
      const pedidoAntes = (await contexto.gestaoPedidos.obterPedido(id, contextoComercial.negocio.id))?.pedido ?? null;
      const pedido = await contexto.gestaoPedidos.atualizarEntrega(id, contextoComercial.negocio.id, dados);
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "pedidos",
        tipo: "ENTREGA_ATUALIZADA",
        entidadeTipo: "pedido",
        entidadeId: id,
        motivo: dados.observacao ?? `Entrega atualizada para ${dados.estadoEntrega}.`,
        alteracoes: montarAlteracoes(dadosPedidoAuditoria(pedidoAntes), dadosPedidoAuditoria(pedido), [
          "estado",
          "estadoEntrega",
          "responsavelId",
          "entregueEm",
          "observacao"
        ])
      });
      return pedido;
    });
  }
};

function politicaDescontoDoContexto(contextoComercial: ContextoComercialHttp) {
  return {
    podeAprovarDesconto: temPermissao(contextoComercial.permissoes, "descontos:aprovar"),
    limiteDescontoSemAprovacaoPercentual: obterLimiteDescontoSemAprovacaoPercentual(contextoComercial.negocio)
  };
}

function dadosPedidoAuditoria(pedido: Pedido | null): Record<string, unknown> | null {
  if (!pedido) return null;
  return {
    estado: pedido.estado,
    estadoPagamento: pedido.estadoPagamento,
    estadoEntrega: pedido.estadoEntrega,
    itens: pedido.itens.map((item) => ({
      codigoPeca: item.codigoPeca,
      quantidade: item.quantidade,
      precoUnitarioEmKwanza: item.precoUnitarioEmKwanza,
      subtotalEmKwanza: item.subtotalEmKwanza
    })),
    subtotalEmKwanza: pedido.subtotalEmKwanza,
    descontoEmKwanza: pedido.descontoEmKwanza,
    motivoDesconto: pedido.motivoDesconto,
    totalEmKwanza: pedido.totalEmKwanza,
    comprovativoPagamentoUrl: pedido.comprovativoPagamentoUrl,
    responsavelId: pedido.responsavelId,
    observacao: pedido.observacao,
    pagoEm: pedido.pagoEm?.toISOString() ?? null,
    entregueEm: pedido.entregueEm?.toISOString() ?? null,
    canceladoEm: pedido.canceladoEm?.toISOString() ?? null
  };
}
