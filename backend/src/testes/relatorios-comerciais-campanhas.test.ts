import { describe, expect, it } from "vitest";
import { RelatoriosComerciaisUseCase } from "../use-case/RelatoriosComerciaisUseCase.js";
import {
  RepositorioAtendimentoMemoria,
  RepositorioCampanhasMemoria,
  RepositorioClientesMemoria,
  RepositorioPecasMemoria,
  RepositorioPedidosMemoria,
  RepositorioReservasMemoria,
  RepositorioTarefasOperacionaisMemoria,
  RepositorioTrackingComercialMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

describe("Relatórios comerciais - campanhas", () => {
  it("agrega receita, respostas, opt-out, falhas e segmentos convertidos por campanha", async () => {
    const negocioId = "negocio-campanhas";
    const pedidos = new RepositorioPedidosMemoria();
    const clientes = new RepositorioClientesMemoria();
    const pecas = new RepositorioPecasMemoria();
    const reservas = new RepositorioReservasMemoria();
    const atendimento = new RepositorioAtendimentoMemoria();
    const tarefas = new RepositorioTarefasOperacionaisMemoria();
    const tracking = new RepositorioTrackingComercialMemoria();
    const campanhas = new RepositorioCampanhasMemoria();

    const clienteVip = await clientes.salvar({
      negocioId,
      telefone: "937771010",
      nome: "Cliente VIP",
      origem: "instagram",
      tags: ["vip", "moda"],
      consentimentoMarketing: true,
      consentimentoDados: true,
      estadoRelacionamento: "VIP"
    });
    const clienteOptOut = await clientes.salvar({
      negocioId,
      telefone: "937771011",
      nome: "Cliente sem marketing",
      origem: "instagram",
      tags: ["vip"],
      consentimentoMarketing: false,
      consentimentoDados: true,
      estadoRelacionamento: "SEM_CONSENTIMENTO"
    });

    const campanha = await campanhas.criar({
      negocioId,
      nome: "Novidades VIP",
      objetivo: "Gerar recompra com nova coleção",
      canal: "whatsapp",
      templateId: "tpl-vip",
      categoria: "marketing",
      segmento: { tags: ["vip"], origem: "instagram" }
    });

    const pedido = await pedidos.criar({
      negocioId,
      clienteNegocioId: clienteVip.id,
      subtotalEmKwanza: 30_000,
      descontoEmKwanza: 5_000,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 25_000,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "PENDENTE",
      origem: "campanha",
      canal: "whatsapp",
      itens: [
        {
          pecaId: "peca-vip",
          codigoPeca: "VIP-01",
          nomeProduto: "Vestido VIP",
          quantidade: 1,
          precoUnitarioEmKwanza: 30_000,
          subtotalEmKwanza: 30_000
        }
      ]
    });

    await campanhas.registrarItens(campanha.id, [
      {
        negocioId,
        campanhaId: campanha.id,
        clienteId: clienteVip.id,
        telefone: clienteVip.telefone,
        nomeCliente: clienteVip.nome,
        status: "RESPONDIDO",
        contexto: { segmentos: ["vip"] }
      },
      {
        negocioId,
        campanhaId: campanha.id,
        clienteId: clienteOptOut.id,
        telefone: clienteOptOut.telefone,
        nomeCliente: clienteOptOut.nome,
        status: "BLOQUEADO",
        motivoBloqueio: "Cliente sem consentimento de marketing."
      },
      {
        negocioId,
        campanhaId: campanha.id,
        clienteId: clienteVip.id,
        telefone: clienteVip.telefone,
        nomeCliente: clienteVip.nome,
        status: "FALHOU",
        contexto: { erroProvider: "Número sem WhatsApp ativo" }
      },
      {
        negocioId,
        campanhaId: campanha.id,
        clienteId: clienteVip.id,
        telefone: clienteVip.telefone,
        nomeCliente: clienteVip.nome,
        status: "CONVERTIDO",
        contexto: { pedidoId: pedido.id, segmentos: ["vip", "instagram"] }
      }
    ]);

    await tracking.registrarEvento({
      negocioId,
      tipo: "PAGAMENTO_CONFIRMADO",
      entidadeTipo: "pedido",
      entidadeId: pedido.id,
      origem: "campanha",
      canal: "whatsapp",
      metadata: {
        campanhaId: campanha.id,
        pedidoId: pedido.id,
        totalEmKwanza: pedido.totalEmKwanza
      }
    });

    const relatorios = new RelatoriosComerciaisUseCase(
      pedidos,
      clientes,
      pecas,
      reservas,
      atendimento,
      tarefas,
      tracking,
      undefined,
      campanhas
    );

    const relatorio = await relatorios.gerarRelatorio(negocioId);

    expect(relatorio.campanhas).toEqual(
      expect.objectContaining({
        total: 1,
        respostas: 1,
        optOut: 1,
        falhas: 1,
        pedidosGerados: 1,
        receitaGeradaEmKwanza: 25_000
      })
    );
    expect(relatorio.campanhas.itens[0]).toEqual(
      expect.objectContaining({
        campanhaId: campanha.id,
        nome: "Novidades VIP",
        respostas: 1,
        optOut: 1,
        falhas: 1,
        pedidosGerados: 1,
        receitaGeradaEmKwanza: 25_000
      })
    );
    expect(relatorio.campanhas.segmentosConvertidos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ segmento: "tag:vip", conversoes: 1, receitaEmKwanza: 25_000 }),
        expect.objectContaining({ segmento: "origem:instagram", conversoes: 1, receitaEmKwanza: 25_000 }),
        expect.objectContaining({ segmento: "estado:VIP", conversoes: 1, receitaEmKwanza: 25_000 })
      ])
    );
  });
});
