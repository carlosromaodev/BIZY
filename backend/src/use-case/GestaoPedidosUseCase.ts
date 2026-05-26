import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioClientes,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoEntregaPedido,
  AtualizacaoEstadoPedido,
  Cliente360,
  ConfirmacaoPagamentoPedido,
  DadosPedidoResolvido,
  EnderecoCliente,
  FiltrosPedidos,
  NovoPedido,
  NovaTarefaOperacional,
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
const chaveEnderecosEntrega = "enderecosEntrega";

export class GestaoPedidosUseCase {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly clientes: RepositorioClientes,
    private readonly pecas: RepositorioPecas,
    private readonly tarefas: RepositorioTarefasOperacionais,
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
    const enderecoEntrega = this.resolverEnderecoEntrega(cliente, dados);

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
      enderecoEntrega,
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

  async obterPedido(id: string, negocioId: string): Promise<{
    pedido: Pedido;
    cliente: Cliente360 | null;
    resumoFinanceiro: {
      custoEstimadoEmKwanza: number;
      margemEstimadaEmKwanza: number | null;
      margemPercentual: number | null;
    };
  } | null> {
    const pedido = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedido) return null;

    const cliente = await this.clientes.buscarPorId(pedido.clienteNegocioId, negocioId);
    return { pedido, cliente, resumoFinanceiro: await this.calcularResumoFinanceiro(pedido, negocioId) };
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

  async exportarCsv(
    negocioId: string,
    filtros: FiltrosPedidos = {}
  ): Promise<{ csv: string; quantidade: number; filtros: FiltrosPedidos }> {
    const filtrosExportacao: FiltrosPedidos = { limite: 10_000, ...filtros };
    const pedidos = await this.pedidos.listar(negocioId, filtrosExportacao);
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
        "itens",
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
          this.resumirItens(pedido),
          pedido.criadoEm.toISOString()
        ];
      })
    ];

    return {
      csv: `${linhas.map((linha) => linha.map((valor) => this.csv(valor)).join(",")).join("\n")}\n`,
      quantidade: pedidos.length,
      filtros: filtrosExportacao
    };
  }

  async criarOrcamento(dados: NovoPedido & { validadeMinutos: number }) {
    const cliente = await this.exigirCliente(dados.clienteNegocioId, dados.negocioId);
    const itens = await this.resolverItens(dados);
    const subtotalEmKwanza = itens.reduce((total, item) => total + item.subtotalEmKwanza, 0);
    const descontoEmKwanza = dados.descontoEmKwanza ?? 0;
    const taxaEntregaEmKwanza = dados.taxaEntregaEmKwanza ?? 0;
    const totalEmKwanza = subtotalEmKwanza - descontoEmKwanza + taxaEntregaEmKwanza;
    if (totalEmKwanza < 0) throw new Error("Desconto não pode deixar o total do orçamento negativo.");

    const validadeEm = new Date(Date.now() + dados.validadeMinutos * 60_000);
    const resumoItens = itens.map((item) => `${item.quantidade}x ${item.nomeProduto} (#${item.codigoPeca})`).join(", ");
    return {
      orcamento: {
        id: `orc_${Date.now().toString(36)}`,
        negocioId: dados.negocioId,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone,
        itens,
        subtotalEmKwanza,
        descontoEmKwanza,
        taxaEntregaEmKwanza,
        totalEmKwanza,
        canal: dados.canal ?? "whatsapp",
        origem: dados.origem ?? "orcamento",
        validadeEm,
        mensagemWhatsApp:
          `Olá${cliente.nome ? `, ${cliente.nome}` : ""}. O teu orçamento Bizy: ${resumoItens}. ` +
          `Total: ${this.formatarKwanza(totalEmKwanza)}. Válido até ${validadeEm.toLocaleString("pt-AO")}.`
      }
    };
  }

  async gerarListaPreparacao(negocioId: string) {
    const pedidos = await this.pedidos.listar(negocioId, { limite: 10_000 });
    const pecas = await this.pecas.listar(negocioId);
    const pecaPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca]));
    const elegiveis = pedidos.filter((pedido) =>
      ["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA"].includes(pedido.estado)
    );
    const produtos = new Map<string, {
      codigoPeca: string;
      nomeProduto: string;
      quantidade: number;
      fotos: string[];
      pedidos: number[];
    }>();

    for (const pedido of elegiveis) {
      for (const item of pedido.itens) {
        const atual = produtos.get(item.codigoPeca) ?? {
          codigoPeca: item.codigoPeca,
          nomeProduto: item.nomeProduto,
          quantidade: 0,
          fotos: pecaPorCodigo.get(item.codigoPeca)?.fotos ?? [],
          pedidos: []
        };
        atual.quantidade += item.quantidade;
        atual.pedidos.push(pedido.numero);
        produtos.set(item.codigoPeca, atual);
      }
    }

    return {
      pedidos: elegiveis,
      produtos: [...produtos.values()].sort((a, b) => a.codigoPeca.localeCompare(b.codigoPeca, "pt-AO", { numeric: true }))
    };
  }

  async gerarListaEntregas(
    negocioId: string,
    filtros: {
      bairro?: string;
      estadoEntrega?: Pedido["estadoEntrega"];
      responsavelId?: string;
      dataInicio?: Date;
      dataFim?: Date;
      limite?: number;
    } = {}
  ) {
    const pedidos = await this.pedidos.listar(negocioId, {
      estadoEntrega: filtros.estadoEntrega,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      limite: filtros.limite ?? 1000
    });
    const bairro = filtros.bairro?.trim().toLowerCase();
    return {
      pedidos: pedidos
        .filter((pedido) => pedido.estado !== "CANCELADO" && pedido.estadoEntrega !== "ENTREGUE")
        .filter((pedido) => !filtros.responsavelId || pedido.responsavelId === filtros.responsavelId)
        .filter((pedido) => !bairro || pedido.enderecoEntrega?.toLowerCase().includes(bairro))
        .map((pedido) => ({
          id: pedido.id,
          numero: pedido.numero,
          estado: pedido.estado,
          estadoEntrega: pedido.estadoEntrega,
          enderecoEntrega: pedido.enderecoEntrega,
          responsavelId: pedido.responsavelId,
          totalEmKwanza: pedido.totalEmKwanza,
          itens: pedido.itens,
          criadoEm: pedido.criadoEm
        }))
    };
  }

  async recuperarPedidosParados(
    negocioId: string,
    filtros: FiltrosPedidos & {
      idadeMinutos: number;
      prioridade: NovaTarefaOperacional["prioridade"];
      responsavelId?: string | null;
    }
  ) {
    const pedidos = await this.pedidos.listar(negocioId, { ...filtros, limite: filtros.limite ?? 100 });
    const existentes = await this.tarefas.listar(negocioId, { limite: 10_000 });
    const limiteData = new Date(Date.now() - filtros.idadeMinutos * 60_000);
    const tarefas = [];

    for (const pedido of pedidos) {
      if (pedido.criadoEm > limiteData) continue;
      const tipo = this.tipoTarefaRecuperacao(pedido);
      const jaExiste = existentes.some(
        (tarefa) =>
          tarefa.pedidoId === pedido.id &&
          tarefa.tipo === tipo &&
          !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)
      );
      if (jaExiste) continue;

      const cliente = await this.clientes.buscarPorId(pedido.clienteNegocioId, negocioId);
      tarefas.push(
        await this.tarefas.criar({
          negocioId,
          tipo,
          titulo: this.tituloTarefaRecuperacao(tipo, pedido),
          descricao: this.descricaoTarefaRecuperacao(tipo, pedido, cliente),
          prioridade: filtros.prioridade ?? "ALTA",
          estado: "ABERTA",
          origem: "recuperacao_pedidos",
          clienteId: pedido.clienteNegocioId,
          pedidoId: pedido.id,
          entidadeTipo: "pedido",
          entidadeId: pedido.id,
          clienteTelefone: cliente?.telefone ?? null,
          responsavelId: filtros.responsavelId ?? pedido.responsavelId,
          prazoEm: new Date(Date.now() + 60 * 60_000),
          contexto: {
            estado: pedido.estado,
            estadoPagamento: pedido.estadoPagamento,
            estadoEntrega: pedido.estadoEntrega,
            totalEmKwanza: pedido.totalEmKwanza
          }
        })
      );
    }

    return { tarefas };
  }

  async solicitarDesconto(
    id: string,
    negocioId: string,
    dados: {
      descontoEmKwanza: number;
      motivo: string;
      responsavelId?: string | null;
      observacao?: string | null;
      solicitadoPor?: string | null;
    }
  ) {
    const pedido = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);
    this.validarDesconto(pedido, dados.descontoEmKwanza);

    const tarefa = await this.tarefas.criar({
      negocioId,
      tipo: "APROVAR_DESCONTO",
      titulo: `Aprovar desconto do pedido #${pedido.numero}`,
      descricao:
        `Pedido #${pedido.numero} recebeu pedido de desconto de ${this.formatarKwanza(dados.descontoEmKwanza)}. ` +
        `Motivo: ${dados.motivo}.`,
      prioridade: dados.descontoEmKwanza >= Math.max(1, pedido.subtotalEmKwanza * 0.15) ? "ALTA" : "NORMAL",
      estado: "ABERTA",
      origem: "aprovacao_desconto",
      clienteId: pedido.clienteNegocioId,
      pedidoId: pedido.id,
      entidadeTipo: "pedido",
      entidadeId: pedido.id,
      responsavelId: dados.responsavelId ?? pedido.responsavelId ?? null,
      observacao: dados.observacao ?? null,
      contexto: {
        descontoEmKwanza: dados.descontoEmKwanza,
        motivo: dados.motivo,
        solicitadoPor: dados.solicitadoPor ?? null,
        subtotalEmKwanza: pedido.subtotalEmKwanza,
        totalAtualEmKwanza: pedido.totalEmKwanza
      }
    });

    return {
      solicitacao: {
        pedidoId: pedido.id,
        descontoEmKwanza: dados.descontoEmKwanza,
        motivo: dados.motivo,
        estado: "PENDENTE_APROVACAO"
      },
      pedido,
      tarefa
    };
  }

  async aprovarDesconto(
    id: string,
    negocioId: string,
    dados: {
      descontoEmKwanza: number;
      motivo: string;
      aprovadoPor: string;
      observacao?: string | null;
    }
  ) {
    const pedido = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);
    this.validarDesconto(pedido, dados.descontoEmKwanza);

    const totalEmKwanza = pedido.subtotalEmKwanza - dados.descontoEmKwanza + pedido.taxaEntregaEmKwanza;
    const observacao = [
      pedido.observacao,
      `Desconto aprovado por ${dados.aprovadoPor}: ${dados.motivo}.`,
      dados.observacao
    ].filter(Boolean).join("\n");
    const atualizado = await this.pedidos.atualizarFinanceiro(id, negocioId, {
      descontoEmKwanza: dados.descontoEmKwanza,
      motivoDesconto: dados.motivo,
      totalEmKwanza,
      observacao
    });
    if (!atualizado) throw new Error(`Pedido ${id} não encontrado.`);

    return {
      pedido: atualizado,
      aprovacao: {
        aprovadoPor: dados.aprovadoPor,
        descontoEmKwanza: dados.descontoEmKwanza,
        totalEmKwanza,
        motivo: dados.motivo
      }
    };
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

  private resolverEnderecoEntrega(cliente: Cliente360, dados: NovoPedido): string | null {
    const enderecoManual = dados.enderecoEntrega?.trim();
    if (enderecoManual) return enderecoManual;
    if (!dados.enderecoEntregaId) return null;

    const enderecoSalvo = this.obterEnderecosEntrega(cliente).find((endereco) => endereco.id === dados.enderecoEntregaId);
    if (!enderecoSalvo) {
      throw new Error("Endereço salvo do cliente não encontrado.");
    }
    return this.formatarEnderecoEntrega(enderecoSalvo);
  }

  private obterEnderecosEntrega(cliente: Cliente360): EnderecoCliente[] {
    const valor = cliente.preferencias[chaveEnderecosEntrega];
    if (!Array.isArray(valor)) return [];

    return valor.flatMap((item): EnderecoCliente[] => {
      if (!this.ehRegistro(item)) return [];
      const id = this.textoOuNull(item.id);
      const endereco = this.textoOuNull(item.endereco);
      if (!id || !endereco) return [];
      const criadoEm = this.textoOuNull(item.criadoEm) ?? new Date(0).toISOString();
      return [
        {
          id,
          rotulo: this.textoOuNull(item.rotulo),
          endereco,
          bairro: this.textoOuNull(item.bairro),
          municipio: this.textoOuNull(item.municipio),
          referencia: this.textoOuNull(item.referencia),
          principal: item.principal === true,
          criadoEm,
          atualizadoEm: this.textoOuNull(item.atualizadoEm) ?? criadoEm
        }
      ];
    });
  }

  private formatarEnderecoEntrega(endereco: EnderecoCliente): string {
    const partes = [endereco.endereco, endereco.bairro, endereco.municipio].filter(Boolean);
    const base = partes.join(", ");
    return endereco.referencia ? `${base} - Ref.: ${endereco.referencia}` : base;
  }

  private textoOuNull(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }

  private ehRegistro(valor: unknown): valor is Record<string, unknown> {
    return Boolean(valor && typeof valor === "object" && !Array.isArray(valor));
  }

  private csv(valor: string): string {
    if (!/[",\n]/.test(valor)) return valor;
    return `"${valor.replace(/"/g, "\"\"")}"`;
  }

  private resumirItens(pedido: Pedido): string {
    return pedido.itens
      .map((item) => `${item.quantidade}x ${item.nomeProduto} (#${item.codigoPeca})`)
      .join(" | ");
  }

  private async calcularResumoFinanceiro(pedido: Pedido, negocioId: string) {
    const pecas = await this.pecas.listar(negocioId);
    const pecaPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca]));
    const custoEstimadoEmKwanza = pedido.itens.reduce((total, item) => {
      const custo = pecaPorCodigo.get(item.codigoPeca)?.custoEmKwanza;
      return total + (custo ?? 0) * item.quantidade;
    }, 0);
    const margemEstimadaEmKwanza = custoEstimadoEmKwanza > 0 ? pedido.subtotalEmKwanza - custoEstimadoEmKwanza - pedido.descontoEmKwanza : null;
    const margemPercentual =
      margemEstimadaEmKwanza !== null && pedido.subtotalEmKwanza > 0
        ? Number(((margemEstimadaEmKwanza / pedido.subtotalEmKwanza) * 100).toFixed(2))
        : null;
    return { custoEstimadoEmKwanza, margemEstimadaEmKwanza, margemPercentual };
  }

  private tipoTarefaRecuperacao(pedido: Pedido): string {
    if (pedido.estado === "AGUARDANDO_PAGAMENTO" || pedido.estadoPagamento === "PENDENTE") return "COBRANCA";
    if (pedido.estado === "PAGO" && pedido.estadoEntrega !== "ENTREGUE") return "ENTREGA";
    return "FOLLOW_UP_PEDIDO";
  }

  private tituloTarefaRecuperacao(tipo: string, pedido: Pedido): string {
    if (tipo === "COBRANCA") return `Cobrar pagamento do pedido #${pedido.numero}`;
    if (tipo === "ENTREGA") return `Resolver entrega do pedido #${pedido.numero}`;
    return `Recuperar pedido #${pedido.numero}`;
  }

  private descricaoTarefaRecuperacao(tipo: string, pedido: Pedido, cliente: Cliente360 | null): string {
    const nomeCliente = cliente?.nome ?? cliente?.telefone ?? "cliente";
    if (tipo === "COBRANCA") {
      return `Pedido de ${nomeCliente} está parado em pagamento pendente. Confirmar comprovativo ou reenviar cobrança permitida.`;
    }
    if (tipo === "ENTREGA") {
      return `Pedido pago de ${nomeCliente} ainda não foi entregue. Confirmar preparação, endereço e responsável.`;
    }
    return `Pedido de ${nomeCliente} precisa de acompanhamento humano para não perder a venda.`;
  }

  private formatarKwanza(valor: number): string {
    return `${valor.toLocaleString("pt-AO")} Kz`;
  }

  private validarDesconto(pedido: Pedido, descontoEmKwanza: number): void {
    if (pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO" || pedido.estado === "ENTREGUE") {
      throw new Error("Desconto não pode ser alterado depois de pagamento confirmado.");
    }
    if (descontoEmKwanza <= 0) {
      throw new Error("Desconto deve ser maior que zero.");
    }
    if (descontoEmKwanza > pedido.subtotalEmKwanza) {
      throw new Error("Desconto não pode ser maior que o subtotal do pedido.");
    }
  }
}
