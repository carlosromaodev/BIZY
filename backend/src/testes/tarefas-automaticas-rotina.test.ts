import { describe, expect, it } from "vitest";
import { GestaoTarefasOperacionaisUseCase } from "../use-case/GestaoTarefasOperacionaisUseCase.js";
import {
  RepositorioAtendimentoMemoria,
  RepositorioClientesMemoria,
  RepositorioPecasMemoria,
  RepositorioPedidosMemoria,
  RepositorioTarefasOperacionaisMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

const minutosAtras = (minutos: number) => new Date(Date.now() - minutos * 60_000);

describe("Rotina automática de tarefas operacionais", () => {
  it("gera tarefas de VIP sem resposta, reposição, entrega e pós-venda sem duplicar abertas", async () => {
    const negocioId = "negocio-tarefas-auto";
    const clientes = new RepositorioClientesMemoria();
    const atendimento = new RepositorioAtendimentoMemoria();
    const pedidos = new RepositorioPedidosMemoria();
    const pecas = new RepositorioPecasMemoria();
    const tarefas = new RepositorioTarefasOperacionaisMemoria();

    const clienteVip = await clientes.salvar({
      negocioId,
      telefone: "937001001",
      nome: "Cliente VIP",
      origem: "whatsapp",
      estadoRelacionamento: "VIP",
      consentimentoDados: true,
      consentimentoMarketing: true
    });

    await atendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: clienteVip.id,
      telefone: "937001001",
      nomeCliente: "Cliente VIP",
      direcao: "INBOUND",
      remetente: "cliente",
      tipo: "TEXTO",
      conteudo: "Ainda estou à espera de resposta.",
      origem: "whatsapp",
      enviadaEm: minutosAtras(180)
    });

    const produtoBaixoStock = await pecas.criar({
      negocioId,
      codigo: "VIP-STOCK-1",
      nome: "Camisa verde",
      descricao: "Produto com procura e stock em risco.",
      precoEmKwanza: 12_000,
      custoEmKwanza: 7_000,
      quantidade: 1,
      stockMinimo: 3,
      fotos: []
    });

    const pedidoPagoSemEntrega = await pedidos.criar({
      negocioId,
      clienteNegocioId: clienteVip.id,
      estado: "PAGO",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "PENDENTE",
      origem: "site",
      canal: "site",
      subtotalEmKwanza: 12_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 1_000,
      totalEmKwanza: 13_000,
      itens: [
        {
          pecaId: produtoBaixoStock.id,
          codigoPeca: produtoBaixoStock.codigo,
          nomeProduto: produtoBaixoStock.nome,
          quantidade: 1,
          precoUnitarioEmKwanza: 12_000,
          subtotalEmKwanza: 12_000
        }
      ]
    });
    pedidoPagoSemEntrega.criadoEm = minutosAtras(240);
    pedidoPagoSemEntrega.pagoEm = minutosAtras(240);

    const pedidoEntregue = await pedidos.criar({
      negocioId,
      clienteNegocioId: clienteVip.id,
      estado: "ENTREGUE",
      estadoPagamento: "CONFIRMADO",
      estadoEntrega: "ENTREGUE",
      origem: "whatsapp",
      canal: "whatsapp",
      subtotalEmKwanza: 8_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 8_000,
      itens: [
        {
          pecaId: "produto-pos-venda",
          codigoPeca: "POS-1",
          nomeProduto: "Vestido floral",
          quantidade: 1,
          precoUnitarioEmKwanza: 8_000,
          subtotalEmKwanza: 8_000
        }
      ]
    });
    pedidoEntregue.criadoEm = minutosAtras(300);
    pedidoEntregue.entregueEm = minutosAtras(180);

    const useCase = new GestaoTarefasOperacionaisUseCase(tarefas, {
      atendimento,
      clientes,
      pecas,
      pedidos
    });

    const resultado = await useCase.gerarTarefasAutomaticasRotina(negocioId, {
      idadeMinutos: 60,
      responsavelId: "lider-operacao"
    });

    expect(resultado).toEqual(
      expect.objectContaining({
        criadas: 4,
        ignoradasPorDuplicidade: 0
      })
    );
    expect(resultado.tarefas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tipo: "VIP_SEM_RESPOSTA",
          prioridade: "URGENTE",
          clienteId: clienteVip.id,
          clienteTelefone: "937001001",
          responsavelId: "lider-operacao"
        }),
        expect.objectContaining({
          tipo: "REPOSICAO_STOCK",
          prioridade: "ALTA",
          entidadeTipo: "produto",
          entidadeId: "VIP-STOCK-1"
        }),
        expect.objectContaining({
          tipo: "ENTREGA",
          prioridade: "ALTA",
          pedidoId: pedidoPagoSemEntrega.id
        }),
        expect.objectContaining({
          tipo: "POS_VENDA",
          prioridade: "NORMAL",
          pedidoId: pedidoEntregue.id
        })
      ])
    );

    const repeticao = await useCase.gerarTarefasAutomaticasRotina(negocioId, {
      idadeMinutos: 60,
      responsavelId: "lider-operacao"
    });

    expect(repeticao).toEqual(
      expect.objectContaining({
        criadas: 0,
        ignoradasPorDuplicidade: 4
      })
    );
    await expect(tarefas.listar(negocioId, { limite: 100 })).resolves.toHaveLength(4);
  });
});
