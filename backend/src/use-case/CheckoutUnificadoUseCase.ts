import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioComprasUnificadas,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioReservasStockCheckout,
  RepositorioRepassesFinanceiros,
  RepositorioReembolsos
} from "../dominio/repositorios/contratos.js";
import type {
  CompraUnificada,
  NovaCompraUnificada,
  PedidoFilho,
  ReembolsoPedido,
  NovoReembolsoPedido
} from "../dominio/tipos.js";

const IVA_ANGOLA_PERCENTUAL = 14;
const TAXA_BIZY_PERCENTUAL = 5;

interface DependenciasCheckout {
  comprasUnificadas: RepositorioComprasUnificadas;
  pecas: RepositorioPecas;
  pedidos: RepositorioPedidos;
  reservasStockCheckout: RepositorioReservasStockCheckout;
  repassesFinanceiros: RepositorioRepassesFinanceiros;
  reembolsos: RepositorioReembolsos;
  eventos: DespachadorEventos;
}

/**
 * RF-053: Compra unificada multi-loja com pedidos filhos por fornecedor
 * RF-054: Experiência única de pagamento para comprador
 * RF-055: Cálculo de entrega por loja/zona
 * RF-064: Cada fornecedor vê apenas os seus itens
 * RF-067: Estado da compra separado do estado operacional do fornecedor
 * RF-070: Cancelamento parcial em compras multi-loja
 * RF-071: Reembolso parcial ou total
 */
export class CheckoutUnificadoUseCase {
  constructor(private readonly deps: DependenciasCheckout) {}

  /**
   * RF-053: Cria compra unificada agrupando itens por fornecedor em pedidos filhos.
   * RF-054: Uma única transação de pagamento para o comprador.
   */
  async criarCompraUnificada(dados: NovaCompraUnificada): Promise<{ compra: CompraUnificada; pedidosFilho: PedidoFilho[] }> {
    const itensPorNegocio = new Map<string, typeof dados.itens>();
    for (const item of dados.itens) {
      const lista = itensPorNegocio.get(item.negocioId) ?? [];
      lista.push(item);
      itensPorNegocio.set(item.negocioId, lista);
    }

    const pedidosFilho: PedidoFilho[] = [];

    for (const [negocioId, itens] of itensPorNegocio) {
      let subtotal = 0;
      const itensResolvidos: Array<{
        pecaId: string;
        codigoPeca: string;
        nomeProduto: string;
        varianteSelecionada?: Record<string, string> | null;
        quantidade: number;
        precoUnitarioEmKwanza: number;
        subtotalEmKwanza: number;
      }> = [];

      for (const item of itens) {
        const peca = await this.deps.pecas.buscarPorCodigo(item.codigoPeca, negocioId);
        if (!peca) throw new Error(`Produto ${item.codigoPeca} não encontrado na loja ${negocioId}`);
        if (peca.quantidade < item.quantidade) {
          throw new Error(`Stock insuficiente para ${item.codigoPeca}: disponível=${peca.quantidade}, pedido=${item.quantidade}`);
        }
        const preco = peca.vitrine?.precoPromocionalEmKwanza ?? peca.precoEmKwanza ?? 0;
        const itemSubtotal = preco * item.quantidade;
        subtotal += itemSubtotal;
        itensResolvidos.push({
          pecaId: peca.id,
          codigoPeca: item.codigoPeca,
          nomeProduto: peca.nome,
          varianteSelecionada: item.varianteSelecionada,
          quantidade: item.quantidade,
          precoUnitarioEmKwanza: preco,
          subtotalEmKwanza: itemSubtotal
        });
      }

      // RF-055: Cálculo de entrega por loja
      const taxaEntrega = await this.calcularEntregaPorLoja(negocioId, dados.enderecoEntrega);
      const ivaEmKwanza = Math.round(subtotal * IVA_ANGOLA_PERCENTUAL / 100);
      const total = subtotal + taxaEntrega + ivaEmKwanza;

      // Criar pedido no repositório para o fornecedor
      const pedido = await this.deps.pedidos.criar({
        negocioId,
        clienteNegocioId: `market-${dados.compradorTelefone}`,
        itens: itensResolvidos,
        origem: "MARKET",
        canal: "market",
        estado: "AGUARDANDO_PAGAMENTO",
        estadoPagamento: "PENDENTE",
        estadoEntrega: "PENDENTE",
        subtotalEmKwanza: subtotal,
        descontoEmKwanza: 0,
        taxaEntregaEmKwanza: taxaEntrega,
        totalEmKwanza: total,
        ivaPercentual: IVA_ANGOLA_PERCENTUAL,
        ivaEmKwanza,
        enderecoEntrega: dados.enderecoEntrega ?? null,
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null,
        observacao: dados.observacao ?? null
      });

      const agora = new Date();
      pedidosFilho.push({
        id: pedido.id,
        compraUnificadaId: "",
        negocioId,
        pedidoId: pedido.id,
        estado: pedido.estado,
        estadoPagamento: pedido.estadoPagamento ?? "PENDENTE",
        estadoEntrega: pedido.estadoEntrega ?? "PENDENTE",
        subtotalEmKwanza: subtotal,
        taxaEntregaEmKwanza: taxaEntrega,
        totalEmKwanza: total,
        criadoEm: agora,
        atualizadoEm: agora
      });
    }

    const compra = await this.deps.comprasUnificadas.criar(dados, pedidosFilho);

    // RF-068: Criar repasses financeiros pendentes para cada fornecedor
    for (const filho of pedidosFilho) {
      await this.deps.repassesFinanceiros.criar({
        negocioId: filho.negocioId,
        compraUnificadaId: compra.id,
        pedidoId: filho.pedidoId,
        valorBrutoEmKwanza: filho.totalEmKwanza,
        taxaBizyEmKwanza: Math.round(filho.totalEmKwanza * TAXA_BIZY_PERCENTUAL / 100),
        motivo: `Repasse compra unificada #${compra.numero}`
      });
    }

    this.deps.eventos.emitir("COMPRA_UNIFICADA_CRIADA", {
      compraId: compra.id, numero: compra.numero, totalFornecedores: pedidosFilho.length
    });

    return { compra, pedidosFilho: await this.deps.comprasUnificadas.listarPedidosFilho(compra.id) };
  }

  /** RF-064: Fornecedor vê apenas os seus itens e valores */
  async buscarVistaFornecedor(compraUnificadaId: string, negocioId: string): Promise<PedidoFilho | null> {
    const filhos = await this.deps.comprasUnificadas.listarPedidosFilho(compraUnificadaId);
    return filhos.find((f) => f.negocioId === negocioId) ?? null;
  }

  /** RF-067: Estado da compra separado do estado de cada fornecedor */
  async buscarCompraComEstados(compraId: string): Promise<{
    compra: CompraUnificada;
    pedidosFilho: PedidoFilho[];
  } | null> {
    const compra = await this.deps.comprasUnificadas.buscarPorId(compraId);
    if (!compra) return null;
    const pedidosFilho = await this.deps.comprasUnificadas.listarPedidosFilho(compraId);
    return { compra, pedidosFilho };
  }

  /** RF-054: Confirmar pagamento unificado e propagar para pedidos filhos */
  async confirmarPagamentoUnificado(compraId: string, _comprovativoUrl?: string): Promise<CompraUnificada | null> {
    const compra = await this.deps.comprasUnificadas.buscarPorId(compraId);
    if (!compra) return null;

    await this.deps.comprasUnificadas.atualizarEstadoPagamento(compraId, "CONFIRMADO");
    await this.deps.comprasUnificadas.atualizarEstado(compraId, "PAGA");

    const filhos = await this.deps.comprasUnificadas.listarPedidosFilho(compraId);
    for (const filho of filhos) {
      await this.deps.pedidos.atualizarEstado(filho.pedidoId, filho.negocioId, {
        estado: "PAGO",
        observacao: `Pagamento confirmado via compra unificada #${compra.numero}`
      });
    }

    this.deps.eventos.emitir("COMPRA_UNIFICADA_PAGA", {
      compraId, numero: compra.numero
    });

    return this.deps.comprasUnificadas.buscarPorId(compraId);
  }

  /** RF-070: Cancelamento parcial — cancela pedido de um fornecedor sem afetar outros */
  async cancelarPedidoFilho(compraId: string, negocioId: string, motivo: string): Promise<CompraUnificada | null> {
    const compra = await this.deps.comprasUnificadas.buscarPorId(compraId);
    if (!compra) return null;

    const filhos = await this.deps.comprasUnificadas.listarPedidosFilho(compraId);
    const filho = filhos.find((f) => f.negocioId === negocioId);
    if (!filho) return null;

    await this.deps.pedidos.atualizarEstado(filho.pedidoId, negocioId, {
      estado: "CANCELADO",
      observacao: motivo
    });

    // Cancelar repasse associado
    const repasses = await this.deps.repassesFinanceiros.listar(negocioId, { pedidoId: filho.pedidoId });
    for (const repasse of repasses) {
      await this.deps.repassesFinanceiros.cancelar(repasse.id, negocioId, motivo);
    }

    // Verificar se todos foram cancelados
    const filhosAtualizados = await this.deps.comprasUnificadas.listarPedidosFilho(compraId);
    const todosCancelados = filhosAtualizados.every((f) => f.estado === "CANCELADO");

    if (todosCancelados) {
      await this.deps.comprasUnificadas.atualizarEstado(compraId, "CANCELADA");
    } else {
      await this.deps.comprasUnificadas.atualizarEstado(compraId, "PARCIALMENTE_CANCELADA");
    }

    this.deps.eventos.emitir("PEDIDO_FILHO_CANCELADO", {
      compraId, negocioId, motivo
    });

    return this.deps.comprasUnificadas.buscarPorId(compraId);
  }

  /** RF-071: Reembolso parcial ou total */
  async solicitarReembolso(dados: NovoReembolsoPedido): Promise<ReembolsoPedido> {
    const reembolso = await this.deps.reembolsos.criar(dados);

    this.deps.eventos.emitir("REEMBOLSO_SOLICITADO", {
      reembolsoId: reembolso.id, pedidoId: dados.pedidoId, tipo: dados.tipo, valor: dados.valorEmKwanza
    });

    return reembolso;
  }

  /** RF-071: Aprovar e processar reembolso */
  async aprovarEProcessarReembolso(reembolsoId: string, negocioId: string, aprovadoPorId: string): Promise<ReembolsoPedido | null> {
    const aprovado = await this.deps.reembolsos.aprovar(reembolsoId, negocioId, aprovadoPorId);
    if (!aprovado) return null;

    const processado = await this.deps.reembolsos.processar(reembolsoId, negocioId);

    this.deps.eventos.emitir("REEMBOLSO_PROCESSADO", {
      reembolsoId, negocioId
    });

    return processado;
  }

  /** RF-055: Cálculo de entrega por loja/zona/política */
  private async calcularEntregaPorLoja(_negocioId: string, _enderecoEntrega?: string | null): Promise<number> {
    // Por enquanto retorna 0. Quando ProvedorEntrega for integrado,
    // será delegado ao provedor configurado pela loja.
    return 0;
  }
}
