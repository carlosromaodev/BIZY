import { describe, expect, it } from "vitest";
import { GestaoTarefasOperacionaisUseCase } from "../use-case/GestaoTarefasOperacionaisUseCase.js";
import {
  RepositorioClientesMemoria,
  RepositorioPedidosMemoria,
  RepositorioTarefasOperacionaisMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

describe("Tarefas operacionais - vínculos comerciais", () => {
  it("valida cliente e pedido, preenchendo o cliente da tarefa a partir do pedido", async () => {
    const negocioId = "negocio-tarefa-vinculos";
    const clientes = new RepositorioClientesMemoria();
    const pedidos = new RepositorioPedidosMemoria();
    const tarefas = new RepositorioTarefasOperacionaisMemoria();
    const useCase = new GestaoTarefasOperacionaisUseCase(tarefas, { clientes, pedidos });

    const cliente = await clientes.salvar({
      negocioId,
      telefone: "937001777",
      nome: "Cliente com pedido",
      origem: "whatsapp",
      consentimentoDados: true
    });
    const outroCliente = await clientes.salvar({
      negocioId,
      telefone: "937001778",
      nome: "Outro cliente",
      origem: "site",
      consentimentoDados: true
    });
    const pedido = await pedidos.criar({
      negocioId,
      clienteNegocioId: cliente.id,
      subtotalEmKwanza: 15_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 0,
      totalEmKwanza: 15_000,
      itens: [
        {
          pecaId: "peca-vinculo",
          codigoPeca: "VINC-1",
          nomeProduto: "Produto vínculo",
          quantidade: 1,
          precoUnitarioEmKwanza: 15_000,
          subtotalEmKwanza: 15_000
        }
      ]
    });

    const tarefa = await useCase.criarTarefa({
      negocioId,
      tipo: "COBRANCA",
      titulo: "Cobrar pedido",
      descricao: "Cliente ainda não pagou.",
      pedidoId: pedido.id,
      prazoEm: new Date(Date.now() + 60 * 60_000)
    });

    expect(tarefa).toEqual(
      expect.objectContaining({
        pedidoId: pedido.id,
        clienteId: cliente.id,
        prioridade: "NORMAL",
        estado: "ABERTA",
        origem: "manual"
      })
    );

    await expect(
      useCase.criarTarefa({
        negocioId,
        tipo: "ENTREGA",
        titulo: "Entrega inconsistente",
        descricao: "Pedido não pertence ao cliente informado.",
        pedidoId: pedido.id,
        clienteId: outroCliente.id
      })
    ).rejects.toThrow("não pertence ao cliente informado");

    await expect(
      useCase.criarTarefa({
        negocioId,
        tipo: "FOLLOW_UP_CLIENTE",
        titulo: "Cliente inexistente",
        descricao: "Não deve gravar vínculo inválido.",
        clienteId: "11111111-1111-4111-8111-111111111111"
      })
    ).rejects.toThrow("Cliente 11111111-1111-4111-8111-111111111111 não encontrado");
  });
});
