import type { DespachadorEventos } from "../../../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioAutenticacao,
  RepositorioComprasUnificadas,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioReservasStockCheckout,
  RepositorioRepassesFinanceiros,
  RepositorioReembolsos
} from "../../../dominio/repositorios/contratos.js";
import type {
  CompraUnificada,
  NovaCompraUnificada,
  PedidoFilho,
  ReembolsoPedido,
  NovoReembolsoPedido
} from "../../../dominio/tipos.js";

const IVA_ANGOLA_PERCENTUAL = 14;
const TAXA_BIZY_PERCENTUAL = 5;

interface DependenciasCheckout {
  autenticacao: RepositorioAutenticacao;
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
    const idempotencyKey = dados.idempotencyKey?.trim() || null;
    if (idempotencyKey) {
      const compraExistente = await this.deps.comprasUnificadas.buscarPorIdempotencyKey(
        idempotencyKey,
        dados.compradorTelefone
      );
      if (compraExistente) {
        return {
          compra: compraExistente,
          pedidosFilho: await this.deps.comprasUnificadas.listarPedidosFilho(compraExistente.id)
        };
      }
    }

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
      const taxaEntrega = await this.calcularEntregaPorLoja(negocioId, subtotal, dados.entrega, dados.enderecoEntrega);
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

  /** RF-059: Receber comprovativo público sem confirmar pagamento pela loja */
  async registrarComprovativoPagamentoUnificado(compraId: string, comprovativoUrl: string): Promise<CompraUnificada | null> {
    const compra = await this.deps.comprasUnificadas.buscarPorId(compraId);
    if (!compra) return null;
    if (compra.estadoPagamento === "CONFIRMADO" || compra.estado === "PAGA") {
      throw new Error("Pagamento já confirmado para esta compra.");
    }

    await this.deps.comprasUnificadas.atualizarEstadoPagamento(compraId, "COMPROVATIVO_RECEBIDO", comprovativoUrl);
    await this.deps.comprasUnificadas.atualizarEstado(compraId, "AGUARDANDO_PAGAMENTO");

    const filhos = await this.deps.comprasUnificadas.listarPedidosFilho(compraId);
    for (const filho of filhos) {
      const pedido = await this.deps.pedidos.registrarComprovativo(filho.pedidoId, filho.negocioId, {
        comprovativoPagamentoUrl: comprovativoUrl,
        observacao: `Comprovativo recebido via compra unificada #${compra.numero}`
      });
      if (pedido) {
        await this.deps.comprasUnificadas.atualizarPedidoFilhoEstado(compraId, filho.pedidoId, {
          estado: pedido.estado,
          estadoPagamento: pedido.estadoPagamento,
          estadoEntrega: pedido.estadoEntrega
        });
      }
    }

    this.deps.eventos.emitir("PAYMENT_PROOF_RECEIVED", {
      escopo: "COMPRA_UNIFICADA",
      compraId,
      numero: compra.numero
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
  private async calcularEntregaPorLoja(
    negocioId: string,
    subtotalEmKwanza: number,
    entrega?: NovaCompraUnificada["entrega"],
    enderecoEntrega?: string | null
  ): Promise<number> {
    const entregaSolicitada = entrega ?? (enderecoEntrega ? { tipo: "ENTREGA" as const, endereco: enderecoEntrega } : null);
    if (!entregaSolicitada || entregaSolicitada.tipo !== "ENTREGA") return 0;

    const negocio = await this.deps.autenticacao.buscarNegocioPorId(negocioId);
    if (!negocio) throw new Error(`Loja ${negocioId} não encontrada para cálculo de entrega.`);

    const configuracao = negocio.entrega ?? {};
    const zona = this.encontrarZonaEntrega(configuracao, entregaSolicitada);
    const taxaPadrao = this.numero(configuracao.taxaPadraoEmKwanza) ?? 0;
    const entregaGratisAcimaDeKwanza = this.numero(configuracao.entregaGratisAcimaDeKwanza);
    const entregaGratis = Boolean(entregaGratisAcimaDeKwanza && subtotalEmKwanza >= entregaGratisAcimaDeKwanza);

    if (entregaGratis) return 0;
    return zona?.taxaEmKwanza ?? taxaPadrao;
  }

  private encontrarZonaEntrega(
    configuracao: Record<string, unknown>,
    entrega: NonNullable<NovaCompraUnificada["entrega"]>
  ): { taxaEmKwanza: number } | null {
    const zonas = Array.isArray(configuracao.zonas) ? configuracao.zonas : [];
    const candidatas = zonas
      .map((zona) => this.objeto(zona))
      .map((zona) => {
        const campos = ["provincia", "municipio", "bairro"] as const;
        const matches = campos.every((campo) => {
          const esperado = this.texto(zona[campo]);
          if (!esperado) return true;
          return this.normalizarTexto(esperado) === this.normalizarTexto(entrega[campo]);
        });
        const especificidade = campos.filter((campo) => this.texto(zona[campo])).length;
        const taxaEmKwanza = this.numero(zona.taxaEmKwanza);
        return matches && taxaEmKwanza !== null ? { taxaEmKwanza, especificidade } : null;
      })
      .filter((zona): zona is { taxaEmKwanza: number; especificidade: number } => Boolean(zona))
      .sort((a, b) => b.especificidade - a.especificidade);

    return candidatas[0] ?? null;
  }

  private objeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
  }

  private texto(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }

  private numero(valor: unknown): number | null {
    if (typeof valor === "number" && Number.isFinite(valor)) return Math.max(0, Math.round(valor));
    if (typeof valor === "string" && valor.trim()) {
      const numero = Number(valor);
      return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : null;
    }
    return null;
  }

  private normalizarTexto(valor: unknown): string {
    return this.texto(valor)?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ?? "";
  }
}
