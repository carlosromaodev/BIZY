import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioClientes,
  RepositorioFunilComercial,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoEntregaPedido,
  AtualizacaoEstadoPedido,
  AtualizacaoItensPedido,
  Cliente360,
  ConfirmacaoPagamentoPedido,
  DadosPedidoResolvido,
  EnderecoCliente,
  EtapaFunilComercial,
  FiltrosPedidos,
  NovoPedido,
  NovaTarefaOperacional,
  Pedido,
  ReciboPedido,
  RegistroComprovativoPagamentoPedido,
  RejeicaoPagamentoPedido,
  Reserva
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
const IVA_ANGOLA_PERCENTUAL = 14;

export class GestaoPedidosUseCase {
  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly clientes: RepositorioClientes,
    private readonly pecas: RepositorioPecas,
    private readonly tarefas: RepositorioTarefasOperacionais,
    private readonly eventos: DespachadorEventos,
    private readonly funil?: RepositorioFunilComercial
  ) {}

  async criarPedido(dados: NovoPedido): Promise<Pedido> {
    const cliente = await this.exigirCliente(dados.clienteNegocioId, dados.negocioId);

    if (dados.descontoEmKwanza && dados.descontoEmKwanza > 0 && !dados.motivoDesconto?.trim()) {
      throw new Error("Desconto não pode ser aplicado sem motivo para auditoria do pedido.");
    }

    const itens = await this.resolverItens(dados);
    const subtotalEmKwanza = itens.reduce((total, item) => total + item.subtotalEmKwanza, 0);
    const descontoEmKwanza = dados.descontoEmKwanza ?? 0;
    this.validarPoliticaDesconto(
      subtotalEmKwanza,
      descontoEmKwanza,
      dados.podeAprovarDesconto,
      dados.limiteDescontoSemAprovacaoPercentual
    );
    const taxaEntregaEmKwanza = dados.taxaEntregaEmKwanza ?? 0;
    const baseParaIva = subtotalEmKwanza - descontoEmKwanza;
    const ivaEmKwanza = Math.round(baseParaIva * IVA_ANGOLA_PERCENTUAL / 100);
    const totalEmKwanza = baseParaIva + taxaEntregaEmKwanza + ivaEmKwanza;

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
      ivaPercentual: IVA_ANGOLA_PERCENTUAL,
      ivaEmKwanza,
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
    await this.registrarMovimentosFunilPedido(pedido, this.movimentosFunilPedidoCriado(pedido));

    return pedido;
  }

  async converterReservaEmPedido(
    reserva: Reserva,
    dados: Omit<NovoPedido, "negocioId" | "clienteNegocioId" | "reservaId" | "itens"> = {}
  ): Promise<{ reserva: Reserva; pedido: Pedido; convertido: boolean }> {
    if (!reserva.negocioId) throw new Error("Reserva sem negócio não pode ser convertida em pedido.");
    if (!reserva.clienteNegocioId) throw new Error("Reserva sem cliente vinculado não pode ser convertida em pedido.");

    const existente = await this.pedidos.buscarPorReservaId(reserva.id, reserva.negocioId);
    if (existente) return { reserva, pedido: existente, convertido: false };

    const pedido = await this.criarPedido({
      ...dados,
      negocioId: reserva.negocioId,
      clienteNegocioId: reserva.clienteNegocioId,
      reservaId: reserva.id,
      itens: [{ codigoPeca: reserva.codigoPeca, quantidade: 1, varianteSelecionada: reserva.varianteSelecionada ?? null }],
      origem: dados.origem ?? "live",
      canal: dados.canal ?? "manual",
      enderecoEntrega: dados.enderecoEntrega ?? reserva.enderecoEntrega,
      comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? reserva.comprovativoPagamentoUrl,
      observacao: dados.observacao ?? `Pedido criado a partir da reserva da live ${reserva.liveId}.`
    });

    return { reserva, pedido, convertido: true };
  }

  async listarPedidos(negocioId: string, filtros: FiltrosPedidos = {}) {
    return { pedidos: await this.pedidos.listar(negocioId, filtros) };
  }

  async obterPedidoPublico(numero: number, negocioId: string): Promise<{
    numero: number;
    estado: string;
    estadoPagamento: string;
    estadoEntrega: string;
    totalEmKwanza: number;
    itens: Array<{ nomeProduto: string; quantidade: number; subtotalEmKwanza: number }>;
    criadoEm: Date;
    atualizadoEm: Date;
  } | null> {
    const pedido = await this.pedidos.buscarPorNumeroPublico(numero, negocioId);
    if (!pedido) return null;

    return {
      numero: pedido.numero,
      estado: pedido.estado,
      estadoPagamento: pedido.estadoPagamento,
      estadoEntrega: pedido.estadoEntrega,
      totalEmKwanza: pedido.totalEmKwanza,
      itens: pedido.itens.map((item) => ({
        nomeProduto: item.nomeProduto,
        quantidade: item.quantidade,
        subtotalEmKwanza: item.subtotalEmKwanza
      })),
      criadoEm: pedido.criadoEm,
      atualizadoEm: pedido.atualizadoEm
    };
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
    if (dados.estado === "CANCELADO" && !dados.observacao?.trim()) {
      throw new Error("Cancelamento de pedido exige motivo operacional para auditoria.");
    }

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
    await this.registrarMovimentosFunilPedido(pedido, this.movimentosFunilPorEstadoPedido(pedido));

    return pedido;
  }

  async atualizarItens(id: string, negocioId: string, dados: AtualizacaoItensPedido): Promise<Pedido> {
    const pedidoAtual = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedidoAtual) throw new Error(`Pedido ${id} não encontrado.`);
    if (pedidoAtual.estadoPagamento !== "PENDENTE" || ["PAGO", "ENTREGUE", "CANCELADO", "DEVOLVIDO"].includes(pedidoAtual.estado)) {
      throw new Error("Itens do pedido só podem ser alterados antes da confirmação do pagamento.");
    }

    const itens = await this.resolverItens(
      {
        negocioId,
        clienteNegocioId: pedidoAtual.clienteNegocioId,
        itens: dados.itens
      },
      pedidoAtual.id
    );
    const subtotalEmKwanza = itens.reduce((total, item) => total + item.subtotalEmKwanza, 0);
    const baseParaIva = subtotalEmKwanza - pedidoAtual.descontoEmKwanza;
    const ivaEmKwanza = Math.round(baseParaIva * IVA_ANGOLA_PERCENTUAL / 100);
    const totalEmKwanza = baseParaIva + pedidoAtual.taxaEntregaEmKwanza + ivaEmKwanza;
    if (totalEmKwanza < 0) {
      throw new Error("A alteração de itens deixa o total do pedido negativo por causa do desconto aplicado.");
    }

    const pedido = await this.pedidos.atualizarItens(id, negocioId, {
      itens,
      subtotalEmKwanza,
      totalEmKwanza,
      observacao: dados.observacao
    });
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    this.eventos.emitir("ORDER_ITEMS_UPDATED", {
      negocioId,
      pedidoId: pedido.id,
      clienteNegocioId: pedido.clienteNegocioId,
      subtotalEmKwanza: pedido.subtotalEmKwanza,
      totalEmKwanza: pedido.totalEmKwanza
    });

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
    await this.registrarMovimentosFunilPedido(pedido, [
      { etapa: "PAGO", motivo: "Pagamento confirmado." }
    ]);

    return pedido;
  }

  async registrarComprovativo(
    id: string,
    negocioId: string,
    dados: RegistroComprovativoPagamentoPedido
  ): Promise<Pedido> {
    const pedidoAtual = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedidoAtual) throw new Error(`Pedido ${id} não encontrado.`);
    if (pedidoAtual.estadoPagamento === "CONFIRMADO" || pedidoAtual.estado === "PAGO") {
      throw new Error("Comprovativo só pode ser anexado antes da confirmação do pagamento.");
    }
    if (!dados.comprovativoPagamentoUrl && !pedidoAtual.comprovativoPagamentoUrl) {
      throw new Error("Informe o comprovativo de pagamento para anexar ao pedido.");
    }

    const pedido = await this.pedidos.registrarComprovativo(id, negocioId, dados);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    this.eventos.emitir("PAYMENT_PROOF_RECEIVED", {
      negocioId,
      pedidoId: pedido.id,
      clienteNegocioId: pedido.clienteNegocioId,
      comprovativoPagamentoUrl: pedido.comprovativoPagamentoUrl
    });

    return pedido;
  }

  async rejeitarPagamento(id: string, negocioId: string, dados: RejeicaoPagamentoPedido): Promise<Pedido> {
    const pedidoAtual = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedidoAtual) throw new Error(`Pedido ${id} não encontrado.`);
    if (pedidoAtual.estadoPagamento === "CONFIRMADO" || pedidoAtual.estado === "PAGO") {
      throw new Error("Pagamento confirmado não pode ser rejeitado; use estorno, devolução ou reembolso.");
    }

    const pedido = await this.pedidos.rejeitarPagamento(id, negocioId, dados);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    this.eventos.emitir("PAYMENT_REJECTED", {
      negocioId,
      pedidoId: pedido.id,
      clienteNegocioId: pedido.clienteNegocioId,
      motivo: dados.motivo
    });

    return pedido;
  }

  async reembolsar(id: string, negocioId: string, motivo: string): Promise<Pedido> {
    const pedidoAtual = await this.pedidos.buscarPorId(id, negocioId);
    if (!pedidoAtual) throw new Error(`Pedido ${id} não encontrado.`);
    if (pedidoAtual.estadoPagamento !== "CONFIRMADO" && pedidoAtual.estado !== "PAGO" && pedidoAtual.estado !== "ENTREGUE") {
      throw new Error("Reembolso só pode ser aplicado a pedidos com pagamento confirmado.");
    }
    if (pedidoAtual.estadoPagamento === "REEMBOLSADO") {
      throw new Error("Pedido já foi reembolsado.");
    }

    const pedido = await this.pedidos.atualizarEstado(id, negocioId, {
      estado: "DEVOLVIDO",
      estadoPagamento: "REEMBOLSADO",
      observacao: motivo
    });
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    this.eventos.emitir("ORDER_REFUNDED", {
      negocioId,
      pedidoId: pedido.id,
      clienteNegocioId: pedido.clienteNegocioId,
      totalEmKwanza: pedido.totalEmKwanza,
      motivo
    });

    return pedido;
  }

  async gerarRecibo(id: string, negocioId: string): Promise<ReciboPedido> {
    const perfil = await this.obterPedido(id, negocioId);
    if (!perfil) throw new Error(`Pedido ${id} não encontrado.`);

    const { pedido, cliente } = perfil;
    return {
      id: `recibo-${pedido.id}`,
      pedidoId: pedido.id,
      numero: pedido.numero,
      negocioId: pedido.negocioId,
      cliente: cliente
        ? {
            id: cliente.id,
            nome: cliente.nome ?? "Cliente",
            telefone: cliente.telefone,
            email: cliente.email
          }
        : null,
      itens: pedido.itens,
      subtotalEmKwanza: pedido.subtotalEmKwanza,
      descontoEmKwanza: pedido.descontoEmKwanza,
      taxaEntregaEmKwanza: pedido.taxaEntregaEmKwanza,
      totalEmKwanza: pedido.totalEmKwanza,
      estado: pedido.estado,
      estadoPagamento: pedido.estadoPagamento,
      estadoEntrega: pedido.estadoEntrega,
      comprovativoPagamentoUrl: pedido.comprovativoPagamentoUrl,
      observacao: pedido.observacao,
      pagoEm: pedido.pagoEm,
      emitidoEm: new Date()
    };
  }

  async atualizarEntrega(id: string, negocioId: string, dados: AtualizacaoEntregaPedido): Promise<Pedido> {
    const pedido = await this.pedidos.atualizarEntrega(id, negocioId, dados);
    if (!pedido) throw new Error(`Pedido ${id} não encontrado.`);

    if (pedido.estadoEntrega === "ENTREGUE") {
      this.eventos.emitir("ORDER_DELIVERED", { negocioId, pedidoId: pedido.id });
    }
    await this.registrarMovimentosFunilPedido(pedido, this.movimentosFunilPorEntregaPedido(pedido));

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
    this.validarPoliticaDesconto(
      subtotalEmKwanza,
      descontoEmKwanza,
      dados.podeAprovarDesconto,
      dados.limiteDescontoSemAprovacaoPercentual
    );
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

  private async resolverItens(dados: NovoPedido, pedidoIgnoradoId?: string): Promise<DadosPedidoResolvido["itens"]> {
    const pedidosAtuais = await this.pedidos.listar(dados.negocioId, { limite: 10_000 });
    const quantidadeConsumida = new Map<string, number>();
    for (const pedido of pedidosAtuais) {
      if (pedido.id === pedidoIgnoradoId) continue;
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
        varianteSelecionada: item.varianteSelecionada ?? null,
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

  private movimentosFunilPedidoCriado(pedido: Pedido): Array<{ etapa: EtapaFunilComercial; motivo: string }> {
    const checkoutPublico = this.ehPedidoCheckoutPublico(pedido);
    const movimentos: Array<{ etapa: EtapaFunilComercial; motivo: string }> = [
      { etapa: "PEDIDO", motivo: checkoutPublico ? "Pedido criado pelo checkout público." : "Pedido criado." }
    ];

    if (pedido.estadoPagamento === "PENDENTE" || pedido.estado === "AGUARDANDO_PAGAMENTO") {
      movimentos.push({
        etapa: "PAGAMENTO_PENDENTE",
        motivo: checkoutPublico
          ? "Pedido criado pelo checkout público e aguarda pagamento."
          : "Pedido aguardando pagamento."
      });
    }
    return movimentos;
  }

  private movimentosFunilPorEstadoPedido(pedido: Pedido): Array<{ etapa: EtapaFunilComercial; motivo: string }> {
    if (["CANCELADO", "TROCADO", "DEVOLVIDO"].includes(pedido.estado) || pedido.estadoPagamento === "REEMBOLSADO") {
      return [{ etapa: "PERDIDO", motivo: this.motivoPerdaPedido(pedido) }];
    }

    const movimentos: Array<{ etapa: EtapaFunilComercial; motivo: string }> = [];
    if (pedido.estadoPagamento === "CONFIRMADO" || pedido.estado === "PAGO") {
      movimentos.push({ etapa: "PAGO", motivo: "Pagamento confirmado." });
    }
    if (pedido.estado === "EM_PREPARACAO") {
      movimentos.push({ etapa: "PREPARACAO", motivo: "Pedido entrou em preparação." });
    }
    if (pedido.estado === "PRONTO_ENTREGA" || pedido.estado === "ENVIADO") {
      movimentos.push({ etapa: "ENTREGA", motivo: "Pedido entrou no fluxo de entrega." });
    }
    if (pedido.estado === "ENTREGUE") {
      movimentos.push(
        { etapa: "ENTREGA", motivo: "Pedido entrou no fluxo de entrega." },
        { etapa: "ENTREGUE", motivo: "Pedido entregue ao cliente." }
      );
    }
    return movimentos;
  }

  private movimentosFunilPorEntregaPedido(pedido: Pedido): Array<{ etapa: EtapaFunilComercial; motivo: string }> {
    if (pedido.estadoEntrega === "FALHOU") {
      return [{ etapa: "PERDIDO", motivo: "Entrega falhou e precisa recuperação." }];
    }
    if (pedido.estadoEntrega === "DEVOLVIDO") {
      return [{ etapa: "PERDIDO", motivo: "Pedido devolvido pelo cliente." }];
    }
    if (pedido.estadoEntrega === "EM_PREPARACAO") {
      return [{ etapa: "PREPARACAO", motivo: "Pedido entrou em preparação." }];
    }
    if (["RETIRADA_LOJA", "PRONTO", "ENVIADO"].includes(pedido.estadoEntrega)) {
      return [{ etapa: "ENTREGA", motivo: "Pedido entrou no fluxo de entrega." }];
    }
    if (pedido.estadoEntrega === "ENTREGUE") {
      return [
        { etapa: "ENTREGA", motivo: "Pedido entrou no fluxo de entrega." },
        { etapa: "ENTREGUE", motivo: "Pedido entregue ao cliente." }
      ];
    }
    return [];
  }

  private async registrarMovimentosFunilPedido(
    pedido: Pedido,
    movimentos: Array<{ etapa: EtapaFunilComercial; motivo: string }>
  ): Promise<void> {
    if (!this.funil || movimentos.length === 0) return;

    for (const movimento of movimentos) {
      await this.registrarMovimentoFunilPedido(pedido, movimento.etapa, movimento.motivo);
    }
  }

  private async registrarMovimentoFunilPedido(
    pedido: Pedido,
    etapaNova: EtapaFunilComercial,
    motivo: string
  ): Promise<void> {
    if (!this.funil) return;

    const [ultimoMovimento] = await this.funil.listarMovimentos(pedido.negocioId, {
      entidadeTipo: "pedido",
      entidadeId: pedido.id,
      limite: 1
    });
    if (!this.deveAvancarFunil(ultimoMovimento?.etapaNova ?? null, etapaNova)) return;

    await this.funil.registrarMovimento({
      negocioId: pedido.negocioId,
      entidadeTipo: "pedido",
      entidadeId: pedido.id,
      etapaAnterior: ultimoMovimento?.etapaNova ?? null,
      etapaNova,
      motivo,
      origem: this.origemFunilPedido(pedido),
      autorId: pedido.responsavelId,
      contexto: {
        pedidoId: pedido.id,
        numero: pedido.numero,
        clienteNegocioId: pedido.clienteNegocioId,
        reservaId: pedido.reservaId,
        estado: pedido.estado,
        estadoPagamento: pedido.estadoPagamento,
        estadoEntrega: pedido.estadoEntrega,
        origem: pedido.origem,
        canal: pedido.canal,
        totalEmKwanza: pedido.totalEmKwanza
      }
    });
  }

  private deveAvancarFunil(etapaAnterior: EtapaFunilComercial | null, etapaNova: EtapaFunilComercial): boolean {
    if (!etapaAnterior) return true;
    const ordem: Partial<Record<EtapaFunilComercial, number>> = {
      VISITA: 1,
      PRODUTO_VISTO: 2,
      WHATSAPP_CLICK: 3,
      LEAD: 4,
      CONVERSA: 5,
      CHECKOUT: 6,
      PEDIDO: 7,
      PAGAMENTO_PENDENTE: 8,
      PAGO: 9,
      PREPARACAO: 10,
      ENTREGA: 11,
      ENTREGUE: 12,
      POS_VENDA: 13,
      RECOMPRA: 14,
      PERDIDO: 15
    };

    return (ordem[etapaNova] ?? 0) > (ordem[etapaAnterior] ?? -1);
  }

  private motivoPerdaPedido(pedido: Pedido): string {
    if (pedido.estadoPagamento === "REEMBOLSADO") return "Pedido reembolsado.";
    if (pedido.estado === "DEVOLVIDO") return "Pedido devolvido pelo cliente.";
    if (pedido.estado === "TROCADO") return "Pedido marcado como trocado.";
    return "Pedido cancelado.";
  }

  private origemFunilPedido(pedido: Pedido): string {
    return this.ehPedidoCheckoutPublico(pedido) ? "checkout_site" : "pedido";
  }

  private ehPedidoCheckoutPublico(pedido: Pedido): boolean {
    return pedido.canal === "site" || ["checkout_site", "loja_publica"].includes(pedido.origem) || pedido.origem.startsWith("link-");
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

  private validarPoliticaDesconto(
    subtotalEmKwanza: number,
    descontoEmKwanza: number,
    podeAprovarDesconto = false,
    limiteSemAprovacaoPercentual = 10
  ): void {
    if (descontoEmKwanza <= 0 || podeAprovarDesconto) return;

    const limitePercentual = Math.min(Math.max(limiteSemAprovacaoPercentual, 0), 100);
    const limiteEmKwanza = Math.floor((subtotalEmKwanza * limitePercentual) / 100);
    if (descontoEmKwanza > limiteEmKwanza) {
      throw new Error(
        `Desconto acima de ${limitePercentual}% exige aprovação de perfil autorizado antes de aplicar no pedido.`
      );
    }
  }
}
