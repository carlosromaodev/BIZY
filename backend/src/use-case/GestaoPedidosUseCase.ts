import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioClientes,
  RepositorioPecas,
  RepositorioPedidos
} from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoEntregaPedido,
  AtualizacaoEstadoPedido,
  Cliente360,
  ConfirmacaoPagamentoPedido,
  DadosPedidoResolvido,
  FiltrosPedidos,
  NovoPedido,
  Pedido
} from "../dominio/tipos.js";

const estadosQueConsomemStock = new Set<Pedido["estado"]>([
  "NOVO",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_PREPARACAO",
  "PRONTO_ENTREGA",
  "ENVIADO",
  "ENTREGUE"
]);

export class GestaoPedidosUseCase {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly clientes: RepositorioClientes,
    private readonly pecas: RepositorioPecas,
    private readonly eventos: DespachadorEventos
  ) {}

  async criarPedido(dados: NovoPedido): Promise<Pedido> {
    const cliente = await this.exigirCliente(dados.clienteNegocioId, dados.negocioId);

    if (dados.descontoEmKwanza && dados.descontoEmKwanza > 0 && !dados.motivoDesconto?.trim()) {
      throw new Error("Desconto não pode ser aplicado sem motivo para auditoria do pedido.");
    }

    const itens = await this.resolverItens(dados);
    const subtotalEmKwanza = itens.reduce((total, item) => total + item.subtotalEmKwanza, 0);
    const descontoEmKwanza = dados.descontoEmKwanza ?? 0;
    const taxaEntregaEmKwanza = dados.taxaEntregaEmKwanza ?? 0;
    const totalEmKwanza = subtotalEmKwanza - descontoEmKwanza + taxaEntregaEmKwanza;

    if (totalEmKwanza < 0) {
      throw new Error("Desconto não pode deixar o total do pedido negativo.");
    }

    const pedido = await this.pedidos.criar({
      negocioId: dados.negocioId,
      clienteNegocioId: cliente.id,
      reservaId: dados.reservaId ?? null,
      itens,
      origem: dados.origem ?? "manual",
      canal: dados.canal ?? "whatsapp",
      estado: "AGUARDANDO_PAGAMENTO",
      estadoPagamento: "PENDENTE",
      estadoEntrega: "PENDENTE",
      subtotalEmKwanza,
      descontoEmKwanza,
      taxaEntregaEmKwanza,
      totalEmKwanza,
      motivoDesconto: dados.motivoDesconto ?? null,
      enderecoEntrega: dados.enderecoEntrega ?? null,
      comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null,
      observacao: dados.observacao ?? null,
      responsavelId: dados.responsavelId ?? null
    });

    this.eventos.emitir("ORDER_CREATED", {
      negocioId: pedido.negocioId,
      pedidoId: pedido.id,
      clienteNegocioId: pedido.clienteNegocioId,
      totalEmKwanza: pedido.totalEmKwanza
    });

    return pedido;
  }

  async listarPedidos(negocioId: string, filtros: FiltrosPedidos = {}) {
    return { pedidos: await this.pedidos.listar(negocioId, filtros) };
  }

  async obterPedido(id: string, negocioId: string): Promise<{ pedido: Pedido; cliente: Cliente360 | null } | null> {
    const pedido = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const cliente = await this.clientes.buscarPorId(pedido.clienteNegocioId, negocioId);
    return { pedido, cliente };
  }

  async atualizarEstado(id: string, negocioId: string, dados: AtualizacaoEstadoPedido): Promise<Pedido> {
    const pedido = await this.pedidos.atualizarEstado(id, negocioId, dados);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    if (pedido.estado === "PRONTO_ENTREGA") {
      this.eventos.emitir("ORDER_READY_TO_SHIP", { negocioId, pedidoId: pedido.id });
    }
    if (pedido.estado === "CANCELADO") {
      this.eventos.emitir("ORDER_CANCELLED", {
        negocioId,
        pedidoId: pedido.id,
        motivo: dados.observacao ?? "Pedido cancelado."
      });
    }
    if (pedido.estado === "DEVOLVIDO") {
      this.eventos.emitir("ORDER_RETURNED", {
        negocioId,
        pedidoId: pedido.id,
        motivo: dados.observacao ?? "Pedido devolvido."
      });
    }
    if (pedido.estadoPagamento === "REEMBOLSADO") {
      this.eventos.emitir("ORDER_REFUNDED", {
        negocioId,
        pedidoId: pedido.id,
        motivo: dados.observacao ?? "Pedido reembolsado."
      });
    }

    return pedido;
  }

  async confirmarPagamento(id: string, negocioId: string, dados: ConfirmacaoPagamentoPedido): Promise<Pedido> {
    const pedido = await this.pedidos.confirmarPagamento(id, negocioId, dados);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    this.eventos.emitir("ORDER_PAYMENT_CONFIRMED", {
      negocioId,
      pedidoId: pedido.id,
      clienteNegocioId: pedido.clienteNegocioId,
      totalEmKwanza: pedido.totalEmKwanza
    });

    return pedido;
  }

  async atualizarEntrega(id: string, negocioId: string, dados: AtualizacaoEntregaPedido): Promise<Pedido> {
    const pedido = await this.pedidos.atualizarEntrega(id, negocioId, dados);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    if (pedido.estadoEntrega === "ENTREGUE") {
      this.eventos.emitir("ORDER_DELIVERED", { negocioId, pedidoId: pedido.id });
    }

    return pedido;
  }

  async exportarCsv(negocioId: string): Promise<string> {
    const pedidos = await this.pedidos.listar(negocioId, { limite: 10_000 });
    const clientes = await this.clientes.listar(negocioId, { limite: 10_000 });
    const clientePorId = new Map(clientes.map((cliente) => [cliente.id, cliente]));
    const linhas = [
      [
        "numero",
        "cliente",
        "telefone",
        "estado",
        "estadoPagamento",
        "estadoEntrega",
        "totalEmKwanza",
        "canal",
        "criadoEm"
      ],
      ...pedidos.map((pedido) => {
        const cliente = clientePorId.get(pedido.clienteNegocioId);
        return [
          String(pedido.numero),
          cliente?.nome ?? "",
          cliente?.telefone ?? "",
          pedido.estado,
          pedido.estadoPagamento,
          pedido.estadoEntrega,
          String(pedido.totalEmKwanza),
          pedido.canal,
          pedido.criadoEm.toISOString()
        ];
      })
    ];

    return `${linhas.map((linha) => linha.map((valor) => this.csv(valor)).join(",")).join("\n")}\n`;
  }

  private async resolverItens(dados: NovoPedido): Promise<DadosPedidoResolvido["itens"]> {
    const pedidosAtuais = await this.pedidos.listar(dados.negocioId, { limite: 10_000 });
    const quantidadeConsumida = new Map<string, number>();
    for (const pedido of pedidosAtuais) {
      if (!estadosQueConsomemStock.has(pedido.estado)) continue;
      for (const item of pedido.itens) {
        quantidadeConsumida.set(item.codigoPeca, (quantidadeConsumida.get(item.codigoPeca) ?? 0) + item.quantidade);
      }
    }

    const itens: DadosPedidoResolvido["itens"] = [];
    for (const item of dados.itens) {
      const codigoPeca = item.codigoPeca.trim().toUpperCase();
      const peca = await this.pecas.buscarPorCodigo(codigoPeca, dados.negocioId);
      if (!peca) throw new Error(`Peça #${codigoPeca} não encontrada.`);
      if (peca.estado === "VENDIDA" || peca.estado === "ESGOTADA") {
        throw new Error(`Peça #${codigoPeca} não está disponível.`);
      }

      const jaConsumida = quantidadeConsumida.get(codigoPeca) ?? 0;
      const disponivel = peca.quantidade - jaConsumida;
      if (item.quantidade > disponivel) {
        throw new Error(
          `Stock insuficiente para peça #${codigoPeca}. Pedido não pode ser criado. Disponível: ${Math.max(disponivel, 0)}.`
        );
      }

      const precoUnitarioEmKwanza = item.precoUnitarioEmKwanza ?? peca.precoEmKwanza;
      itens.push({
        pecaId: peca.id,
        codigoPeca,
        nomeProduto: peca.nome,
        quantidade: item.quantidade,
        precoUnitarioEmKwanza,
        subtotalEmKwanza: precoUnitarioEmKwanza * item.quantidade
      });

      quantidadeConsumida.set(codigoPeca, jaConsumida + item.quantidade);
    }

    return itens;
  }

  private async exigirCliente(id: string, negocioId: string): Promise<Cliente360> {
    const cliente = await this.clientes.buscarPorId(id, negocioId);
    if (!cliente) throw new Error(`Cliente ${id} não encontrado.`);
    return cliente;
  }

  private csv(valor: string): string {
    if (!/[",\n]/.test(valor)) return valor;
    return `"${valor.replace(/"/g, "\"\"")}"`;
  }
}
