import { describe, expect, it } from "vitest";
import { RelatoriosComerciaisUseCase } from "../use-case/RelatoriosComerciaisUseCase.js";
import {
  RepositorioAtendimentoMemoria,
  RepositorioClientesMemoria,
  RepositorioPecasMemoria,
  RepositorioPedidosMemoria,
  RepositorioReservasMemoria,
  RepositorioTarefasOperacionaisMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

const diasAtras = (dias: number) => new Date(Date.now() - dias * 86_400_000);

describe("Relatórios comerciais - retenção", () => {
  it("mede recompra, tempo entre compras, risco por recência e coortes mensais", async () => {
    const negocioId = "negocio-retencao";
    const pedidos = new RepositorioPedidosMemoria();
    const clientes = new RepositorioClientesMemoria();

    const clienteRecorrente = await clientes.salvar({
      negocioId,
      telefone: "937880001",
      nome: "Cliente recorrente",
      origem: "whatsapp",
      consentimentoDados: true,
      consentimentoMarketing: true
    });
    const clienteAtencao = await clientes.salvar({
      negocioId,
      telefone: "937880002",
      nome: "Cliente atenção",
      origem: "site",
      consentimentoDados: true,
      consentimentoMarketing: true
    });
    const clientePerdido = await clientes.salvar({
      negocioId,
      telefone: "937880003",
      nome: "Cliente perdido",
      origem: "instagram",
      consentimentoDados: true,
      consentimentoMarketing: true
    });

    const pedidoAntigo = await pedidos.criar({
      negocioId,
      clienteNegocioId: clienteRecorrente.id,
      subtotalEmKwanza: 10_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 10_000,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "ENTREGUE",
      origem: "site",
      canal: "site",
      itens: [
        {
          pecaId: "peca-retencao-1",
          codigoPeca: "RET-1",
          nomeProduto: "Primeira compra",
          quantidade: 1,
          precoUnitarioEmKwanza: 10_000,
          subtotalEmKwanza: 10_000
        }
      ]
    });
    pedidoAntigo.criadoEm = diasAtras(40);
    pedidoAntigo.pagoEm = diasAtras(40);

    const pedidoRecente = await pedidos.criar({
      negocioId,
      clienteNegocioId: clienteRecorrente.id,
      subtotalEmKwanza: 12_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 12_000,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "ENTREGUE",
      origem: "whatsapp",
      canal: "whatsapp",
      itens: [
        {
          pecaId: "peca-retencao-2",
          codigoPeca: "RET-2",
          nomeProduto: "Recompra",
          quantidade: 1,
          precoUnitarioEmKwanza: 12_000,
          subtotalEmKwanza: 12_000
        }
      ]
    });
    pedidoRecente.criadoEm = diasAtras(10);
    pedidoRecente.pagoEm = diasAtras(10);

    const pedidoAtencao = await pedidos.criar({
      negocioId,
      clienteNegocioId: clienteAtencao.id,
      subtotalEmKwanza: 8_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 8_000,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "ENTREGUE",
      origem: "site",
      canal: "site",
      itens: [
        {
          pecaId: "peca-retencao-3",
          codigoPeca: "RET-3",
          nomeProduto: "Compra atenção",
          quantidade: 1,
          precoUnitarioEmKwanza: 8_000,
          subtotalEmKwanza: 8_000
        }
      ]
    });
    pedidoAtencao.criadoEm = diasAtras(45);
    pedidoAtencao.pagoEm = diasAtras(45);

    const pedidoPerdido = await pedidos.criar({
      negocioId,
      clienteNegocioId: clientePerdido.id,
      subtotalEmKwanza: 6_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 6_000,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "ENTREGUE",
      origem: "instagram",
      canal: "social",
      itens: [
        {
          pecaId: "peca-retencao-4",
          codigoPeca: "RET-4",
          nomeProduto: "Compra perdida",
          quantidade: 1,
          precoUnitarioEmKwanza: 6_000,
          subtotalEmKwanza: 6_000
        }
      ]
    });
    pedidoPerdido.criadoEm = diasAtras(95);
    pedidoPerdido.pagoEm = diasAtras(95);

    const relatorios = new RelatoriosComerciaisUseCase(
      pedidos,
      clientes,
      new RepositorioPecasMemoria(),
      new RepositorioReservasMemoria(),
      new RepositorioAtendimentoMemoria(),
      new RepositorioTarefasOperacionaisMemoria()
    );

    const relatorio = await relatorios.gerarRelatorio(negocioId);

    expect(relatorio.retencao).toEqual(
      expect.objectContaining({
        clientesRecorrentes: 1,
        tempoMedioEntreComprasDias: 30,
        diasMediosDesdeUltimaCompra: 50,
        clientesPorRisco: {
          ativo: 1,
          atencao: 1,
          risco: 0,
          perdido: 1
        }
      })
    );
    expect(relatorio.retencao.cohortesRecompra).toEqual(expect.arrayContaining([
      expect.objectContaining({
        mesPrimeiraCompra: pedidoAntigo.criadoEm.toISOString().slice(0, 7),
        clientes: 2,
        recorrentes: 1,
        taxaRetencaoPercentual: 50
      })
    ]));
  });
});
