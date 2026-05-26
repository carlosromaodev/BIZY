import type {
  RepositorioAtendimento,
  RepositorioClientes,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoTarefaOperacional,
  Cliente360,
  ConversaAtendimentoComMensagens,
  FiltrosTarefasOperacionais,
  NovaTarefaOperacional,
  Pedido,
  PrioridadeTarefaOperacional,
  TarefaOperacional
} from "../dominio/tipos.js";

export interface DependenciasTarefasAutomaticas {
  atendimento?: RepositorioAtendimento;
  clientes?: RepositorioClientes;
  pecas?: RepositorioPecas;
  pedidos?: RepositorioPedidos;
}

export interface OpcoesTarefasAutomaticas {
  idadeMinutos?: number;
  responsavelId?: string | null;
  prioridadePadrao?: PrioridadeTarefaOperacional;
  limite?: number;
  agora?: Date;
}

export interface ResultadoTarefasAutomaticas {
  criadas: number;
  ignoradasPorDuplicidade: number;
  tarefas: TarefaOperacional[];
}

export class GestaoTarefasOperacionaisUseCase {
  constructor(
    private readonly repositorioTarefas: RepositorioTarefasOperacionais,
    private readonly dependencias: DependenciasTarefasAutomaticas = {}
  ) {}

  criarTarefa(dados: NovaTarefaOperacional) {
    return this.repositorioTarefas.criar({
      ...dados,
      estado: dados.estado ?? "ABERTA",
      prioridade: dados.prioridade ?? "NORMAL",
      origem: dados.origem ?? "manual",
      contexto: dados.contexto ?? {}
    });
  }

  listarTarefas(negocioId: string, filtros: FiltrosTarefasOperacionais = {}) {
    return this.repositorioTarefas.listar(negocioId, filtros);
  }

  async obterTarefa(id: string, negocioId: string) {
    const tarefa = await this.repositorioTarefas.buscarPorId(id, negocioId);
    if (!tarefa) throw new Error(`Tarefa ${id} não encontrada.`);
    return tarefa;
  }

  async atualizarTarefa(id: string, negocioId: string, dados: AtualizacaoTarefaOperacional) {
    const tarefa = await this.repositorioTarefas.atualizar(id, negocioId, dados);
    if (!tarefa) throw new Error(`Tarefa ${id} não encontrada.`);
    return tarefa;
  }

  async gerarTarefasAutomaticasRotina(
    negocioId: string,
    opcoes: OpcoesTarefasAutomaticas = {}
  ): Promise<ResultadoTarefasAutomaticas> {
    const agora = opcoes.agora ?? new Date();
    const idadeMinutos = Math.max(0, Math.min(opcoes.idadeMinutos ?? 60, 43_200));
    const limite = Math.max(1, Math.min(opcoes.limite ?? 500, 500));
    const dataLimite = new Date(agora.getTime() - idadeMinutos * 60_000);
    const existentes = await this.repositorioTarefas.listar(negocioId, { limite: 500 });
    const chavesAbertas = new Set(
      existentes
        .filter((tarefa) => !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado))
        .map((tarefa) => this.chaveTarefa(tarefa))
        .filter(Boolean)
    );
    const tarefas: TarefaOperacional[] = [];
    let ignoradasPorDuplicidade = 0;

    const criarSeNova = async (dados: NovaTarefaOperacional) => {
      const chave = this.chaveTarefa(dados);
      if (chave && chavesAbertas.has(chave)) {
        ignoradasPorDuplicidade += 1;
        return;
      }

      const tarefa = await this.criarTarefa({
        ...dados,
        negocioId,
        origem: dados.origem ?? "rotina_automatica",
        responsavelId: dados.responsavelId ?? opcoes.responsavelId ?? null
      });
      tarefas.push(tarefa);
      if (chave) chavesAbertas.add(chave);
    };

    await this.gerarTarefasDeAtendimentoVip(negocioId, dataLimite, criarSeNova, opcoes);
    await this.gerarTarefasDeStock(negocioId, criarSeNova);
    await this.gerarTarefasDePedidos(negocioId, dataLimite, criarSeNova, opcoes, limite);

    return {
      criadas: tarefas.length,
      ignoradasPorDuplicidade,
      tarefas
    };
  }

  private async gerarTarefasDeAtendimentoVip(
    negocioId: string,
    dataLimite: Date,
    criarSeNova: (dados: NovaTarefaOperacional) => Promise<void>,
    opcoes: OpcoesTarefasAutomaticas
  ) {
    if (!this.dependencias.atendimento || !this.dependencias.clientes) return;

    const [conversas, clientes] = await Promise.all([
      this.dependencias.atendimento.listarConversasComMensagens(opcoes.limite ?? 500, negocioId),
      this.dependencias.clientes.listar(negocioId, { limite: 500 })
    ]);
    const clientesPorId = new Map(clientes.map((cliente) => [cliente.id, cliente]));

    for (const conversa of conversas) {
      if (["RESOLVIDA", "ENCERRADA"].includes(conversa.conversa.estado)) continue;
      const cliente = conversa.conversa.clienteNegocioId
        ? clientesPorId.get(conversa.conversa.clienteNegocioId)
        : undefined;
      if (!this.ehClientePrioritario(cliente, conversa)) continue;

      const ultimaMensagem = [...conversa.mensagens].sort(
        (a, b) => b.enviadaEm.getTime() - a.enviadaEm.getTime()
      )[0];
      if (!ultimaMensagem || ultimaMensagem.remetente !== "cliente") continue;
      if (ultimaMensagem.enviadaEm > dataLimite) continue;

      await criarSeNova({
        tipo: "VIP_SEM_RESPOSTA",
        titulo: `Responder cliente prioritário ${cliente?.nome ?? conversa.cliente.nome ?? conversa.conversa.telefone}`,
        descricao: "Cliente VIP ou de alta prioridade tem mensagem sem resposta dentro do SLA operacional.",
        prioridade: "URGENTE",
        clienteId: conversa.conversa.clienteNegocioId,
        entidadeTipo: "conversa",
        entidadeId: conversa.conversa.id,
        clienteTelefone: conversa.conversa.telefone,
        prazoEm: new Date(Date.now() + 15 * 60_000),
        contexto: {
          canal: conversa.conversa.canal,
          prioridadeConversa: conversa.conversa.prioridade,
          estadoRelacionamento: cliente?.estadoRelacionamento ?? null,
          ultimaMensagemId: ultimaMensagem.id,
          ultimaMensagemEm: ultimaMensagem.enviadaEm.toISOString()
        }
      });
    }
  }

  private async gerarTarefasDeStock(
    negocioId: string,
    criarSeNova: (dados: NovaTarefaOperacional) => Promise<void>
  ) {
    if (!this.dependencias.pecas) return;

    const pecas = await this.dependencias.pecas.listar(negocioId);
    for (const peca of pecas) {
      if (peca.arquivadaEm) continue;
      if (!["BAIXO_STOCK", "ESGOTADO"].includes(peca.estadoStock)) continue;

      await criarSeNova({
        tipo: "REPOSICAO_STOCK",
        titulo: `Repor stock de #${peca.codigo}`,
        descricao: `${peca.nome} está com ${peca.quantidade} unidade(s) e mínimo definido em ${peca.stockMinimo}.`,
        prioridade: peca.estadoStock === "ESGOTADO" ? "URGENTE" : "ALTA",
        entidadeTipo: "produto",
        entidadeId: peca.codigo,
        contexto: {
          produtoId: peca.id,
          codigo: peca.codigo,
          nome: peca.nome,
          quantidade: peca.quantidade,
          stockMinimo: peca.stockMinimo,
          estadoStock: peca.estadoStock
        }
      });
    }
  }

  private async gerarTarefasDePedidos(
    negocioId: string,
    dataLimite: Date,
    criarSeNova: (dados: NovaTarefaOperacional) => Promise<void>,
    opcoes: OpcoesTarefasAutomaticas,
    limite: number
  ) {
    if (!this.dependencias.pedidos) return;

    const pedidos = await this.dependencias.pedidos.listar(negocioId, { limite });
    for (const pedido of pedidos) {
      if (["CANCELADO", "TROCADO", "DEVOLVIDO"].includes(pedido.estado)) continue;

      if (this.pagamentoVencido(pedido, dataLimite)) {
        await criarSeNova({
          tipo: "COBRANCA",
          titulo: `Cobrar pedido #${pedido.numero}`,
          descricao: "Pedido com pagamento pendente ultrapassou o tempo operacional de cobrança.",
          prioridade: opcoes.prioridadePadrao ?? "ALTA",
          pedidoId: pedido.id,
          clienteId: pedido.clienteNegocioId,
          entidadeTipo: "pedido",
          entidadeId: pedido.id,
          prazoEm: new Date(Date.now() + 60 * 60_000),
          contexto: this.contextoPedido(pedido)
        });
      }

      if (this.pedidoPagoSemEntrega(pedido, dataLimite)) {
        await criarSeNova({
          tipo: "ENTREGA",
          titulo: `Dar seguimento à entrega do pedido #${pedido.numero}`,
          descricao: "Pedido já pago ainda não foi marcado como entregue.",
          prioridade: "ALTA",
          pedidoId: pedido.id,
          clienteId: pedido.clienteNegocioId,
          entidadeTipo: "pedido",
          entidadeId: pedido.id,
          prazoEm: new Date(Date.now() + 2 * 60 * 60_000),
          contexto: this.contextoPedido(pedido)
        });
      }

      if (this.posVendaPendente(pedido, dataLimite)) {
        await criarSeNova({
          tipo: "POS_VENDA",
          titulo: `Fazer pós-venda do pedido #${pedido.numero}`,
          descricao: "Pedido entregue há tempo suficiente para contacto de satisfação, troca ou recompra.",
          prioridade: "NORMAL",
          pedidoId: pedido.id,
          clienteId: pedido.clienteNegocioId,
          entidadeTipo: "pedido",
          entidadeId: pedido.id,
          prazoEm: new Date(Date.now() + 24 * 60 * 60_000),
          contexto: this.contextoPedido(pedido)
        });
      }
    }
  }

  private ehClientePrioritario(cliente: Cliente360 | undefined, conversa: ConversaAtendimentoComMensagens) {
    const tags = new Set([...(cliente?.tags ?? []), ...conversa.conversa.tags].map((tag) => tag.toLowerCase()));
    return (
      cliente?.estadoRelacionamento === "VIP" ||
      cliente?.estadoRelacionamento === "PRIORIDADE_ALTA" ||
      conversa.conversa.prioridade === "URGENTE" ||
      tags.has("vip") ||
      tags.has("prioridade-alta")
    );
  }

  private pagamentoVencido(pedido: Pedido, dataLimite: Date) {
    if (pedido.estadoPagamento !== "PENDENTE") return false;
    if (!["NOVO", "AGUARDANDO_PAGAMENTO"].includes(pedido.estado)) return false;
    return pedido.criadoEm <= dataLimite;
  }

  private pedidoPagoSemEntrega(pedido: Pedido, dataLimite: Date) {
    if (pedido.estadoEntrega === "ENTREGUE") return false;
    if (!["CONFIRMADO", "COMPROVATIVO_RECEBIDO"].includes(pedido.estadoPagamento) && pedido.estado !== "PAGO") {
      return false;
    }
    const referencia = pedido.pagoEm ?? pedido.criadoEm;
    return referencia <= dataLimite;
  }

  private posVendaPendente(pedido: Pedido, dataLimite: Date) {
    if (pedido.estadoEntrega !== "ENTREGUE" && pedido.estado !== "ENTREGUE") return false;
    const referencia = pedido.entregueEm ?? pedido.criadoEm;
    return referencia <= dataLimite;
  }

  private contextoPedido(pedido: Pedido): Record<string, unknown> {
    return {
      numero: pedido.numero,
      estado: pedido.estado,
      estadoPagamento: pedido.estadoPagamento,
      estadoEntrega: pedido.estadoEntrega,
      origem: pedido.origem,
      canal: pedido.canal,
      totalEmKwanza: pedido.totalEmKwanza,
      criadoEm: pedido.criadoEm.toISOString(),
      pagoEm: pedido.pagoEm?.toISOString() ?? null,
      entregueEm: pedido.entregueEm?.toISOString() ?? null
    };
  }

  private chaveTarefa(tarefa: Pick<NovaTarefaOperacional, "tipo" | "entidadeTipo" | "entidadeId" | "pedidoId" | "clienteId">) {
    if (tarefa.entidadeTipo && tarefa.entidadeId) return `${tarefa.tipo}:${tarefa.entidadeTipo}:${tarefa.entidadeId}`;
    if (tarefa.pedidoId) return `${tarefa.tipo}:pedido:${tarefa.pedidoId}`;
    if (tarefa.clienteId) return `${tarefa.tipo}:cliente:${tarefa.clienteId}`;
    return null;
  }
}
