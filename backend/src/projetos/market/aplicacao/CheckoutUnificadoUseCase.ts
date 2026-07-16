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
import type { ContaBizyUseCase } from "../../commerce/aplicacao/ContaBizyUseCase.js";
import type { RepositorioCarrinhosCommerce } from "../dominio/carrinhoCommerce.js";
import {
  criarChaveCombinacaoVariante,
  encontrarCombinacaoVariante,
  validarSelecaoVariante
} from "../../../dominio/servicos/VariantesProduto.js";

const IVA_ANGOLA_PERCENTUAL = 14;
const TAXA_BIZY_PERCENTUAL = 5;
const DIAS_JANELA_RISCO_PAYOUT = 7;

interface DependenciasCheckout {
  contaBizy: ContaBizyUseCase;
  autenticacao: RepositorioAutenticacao;
  comprasUnificadas: RepositorioComprasUnificadas;
  pecas: RepositorioPecas;
  pedidos: RepositorioPedidos;
  reservasStockCheckout: RepositorioReservasStockCheckout;
  carrinhosCommerce: RepositorioCarrinhosCommerce;
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

  async cotarCheckout(dados: { itens: Array<{ negocioId: string; codigoPeca: string; varianteSelecionada?: Record<string, string> | null; quantidade: number }>; entrega?: NovaCompraUnificada["entrega"]; enderecoEntrega?: string | null }) {
    const porNegocio = new Map<string, typeof dados.itens>();
    for (const item of dados.itens) porNegocio.set(item.negocioId, [...(porNegocio.get(item.negocioId) ?? []), item]);
    const lojas = [];
    for (const [negocioId, itens] of porNegocio) {
      const negocio = await this.deps.autenticacao.buscarNegocioPorId(negocioId);
      if (!negocio) throw new Error("LOJA_NAO_ENCONTRADA");
      let subtotalEmKwanza = 0;
      for (const item of itens) {
        const peca = await this.deps.pecas.buscarPorCodigo(item.codigoPeca, negocioId);
        if (!peca || item.quantidade < 1 || peca.quantidade < item.quantidade) throw new Error("PRODUTO_OU_STOCK_INVALIDO");
        const selecao = validarSelecaoVariante(peca.variantes, item.varianteSelecionada);
        const variantes = await this.deps.pecas.listarVariantesPeca(peca.id);
        const variante = Object.keys(peca.variantes).length ? encontrarCombinacaoVariante(variantes, selecao) : null;
        if (Object.keys(peca.variantes).length && (!variante || variante.quantidade < item.quantidade)) throw new Error("VARIANTE_OU_STOCK_INVALIDO");
        subtotalEmKwanza += (variante?.precoEmKwanza ?? peca.vitrine.precoPromocionalEmKwanza ?? peca.precoEmKwanza) * item.quantidade;
      }
      const taxaEntregaEmKwanza = await this.calcularEntregaPorLoja(negocioId, subtotalEmKwanza, dados.entrega, dados.enderecoEntrega ?? undefined);
      const ivaEmKwanza = Math.round(subtotalEmKwanza * IVA_ANGOLA_PERCENTUAL / 100);
      const entregaConfig = negocio.entrega ?? {};
      lojas.push({
        negocioId, nomeLoja: negocio.nomeComercial, subtotalEmKwanza, taxaEntregaEmKwanza, ivaEmKwanza,
        totalEmKwanza: subtotalEmKwanza + taxaEntregaEmKwanza + ivaEmKwanza,
        prazoMinimoDias: this.numero(entregaConfig.prazoMinimoDias),
        prazoMaximoDias: this.numero(entregaConfig.prazoMaximoDias),
        metodosPagamento: negocio.metodosPagamento
      });
    }
    return {
      lojas,
      metodosPagamento: this.intersecaoMetodosPagamento(lojas.map((loja) => loja.metodosPagamento)),
      subtotalEmKwanza: lojas.reduce((total, loja) => total + loja.subtotalEmKwanza, 0),
      taxaEntregaTotalEmKwanza: lojas.reduce((total, loja) => total + loja.taxaEntregaEmKwanza, 0),
      ivaTotalEmKwanza: lojas.reduce((total, loja) => total + loja.ivaEmKwanza, 0),
      totalEmKwanza: lojas.reduce((total, loja) => total + loja.totalEmKwanza, 0)
    };
  }

  /**
   * RF-053: Cria compra unificada agrupando itens por fornecedor em pedidos filhos.
   * RF-054: Uma única transação de pagamento para o comprador.
   */
  async criarCompraUnificada(dados: NovaCompraUnificada): Promise<{
    compra: CompraUnificada;
    pedidosFilho: PedidoFilho[];
    acessoCompra: { token: string; expiraEm: Date };
  }> {
    const idempotencyKey = dados.idempotencyKey?.trim() || null;
    if (idempotencyKey) {
      const compraExistente = await this.deps.comprasUnificadas.buscarPorIdempotencyKey(
        idempotencyKey,
        dados.compradorTelefone
      );
      if (compraExistente) {
        return {
          compra: compraExistente,
          pedidosFilho: await this.deps.comprasUnificadas.listarPedidosFilho(compraExistente.id),
          acessoCompra: await this.deps.contaBizy.emitirAcessoCompra(compraExistente.id)
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
      const negocio = await this.deps.autenticacao.buscarNegocioPorId(negocioId);
      if (!negocio) throw new Error("LOJA_NAO_ENCONTRADA");
      const permitidos = this.normalizarMetodosLoja(negocio.metodosPagamento);
      const metodoPagamento = this.normalizarMetodoPagamento(dados.metodoPagamento) ?? (permitidos.length === 1 ? permitidos[0] : null);
      if (!metodoPagamento || !permitidos.includes(metodoPagamento)) {
        throw new Error(`Método de pagamento indisponível para ${negocio.nomeComercial}.`);
      }
      let subtotal = 0;
      const quantidadesProduto = new Map<string, number>();
      const quantidadesVariante = new Map<string, number>();
      const itensResolvidos: Array<{
        pecaId: string;
        codigoPeca: string;
        nomeProduto: string;
        varianteSelecionada?: Record<string, string> | null;
        variantePecaId?: string | null;
        quantidade: number;
        precoUnitarioEmKwanza: number;
        subtotalEmKwanza: number;
      }> = [];

      for (const item of itens) {
        const peca = await this.deps.pecas.buscarPorCodigo(item.codigoPeca, negocioId);
        if (!peca) throw new Error(`Produto ${item.codigoPeca} não encontrado na loja ${negocioId}`);
        const selecao = validarSelecaoVariante(peca.variantes, item.varianteSelecionada);
        const quantidadeProduto = (quantidadesProduto.get(peca.id) ?? 0) + item.quantidade;
        quantidadesProduto.set(peca.id, quantidadeProduto);
        if (peca.quantidade < quantidadeProduto) {
          throw new Error(`Quantidade inválida para ${item.codigoPeca}: stock disponível ${peca.quantidade}.`);
        }

        const combinacoes = await this.deps.pecas.listarVariantesPeca(peca.id);
        const variante = Object.keys(peca.variantes).length > 0
          ? encontrarCombinacaoVariante(combinacoes, selecao)
          : null;
        if (Object.keys(peca.variantes).length > 0 && !variante) {
          throw new Error("Variante inválida ou indisponível para este produto.");
        }
        if (variante) {
          const chave = `${peca.id}:${criarChaveCombinacaoVariante(selecao)}`;
          const quantidadeVariante = (quantidadesVariante.get(chave) ?? 0) + item.quantidade;
          quantidadesVariante.set(chave, quantidadeVariante);
          if (variante.quantidade < quantidadeVariante) {
            throw new Error(`Quantidade inválida para a variante de ${item.codigoPeca}: stock disponível ${variante.quantidade}.`);
          }
        }

        const preco = variante?.precoEmKwanza
          ?? peca.vitrine?.precoPromocionalEmKwanza
          ?? peca.precoEmKwanza
          ?? 0;
        const itemSubtotal = preco * item.quantidade;
        subtotal += itemSubtotal;
        itensResolvidos.push({
          pecaId: peca.id,
          codigoPeca: item.codigoPeca,
          nomeProduto: peca.nome,
          varianteSelecionada: Object.keys(selecao).length ? selecao : null,
          variantePecaId: variante?.id ?? null,
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
        estadoSeparacao: "PENDENTE",
        estadoEmbalagem: "PENDENTE",
        provaEntregaUrl: null,
        tentativasEntrega: 0,
        motivoAtraso: null,
        estadoDevolucao: null,
        fulfillment: [],
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
      const impostosEmKwanza = Math.max(0, filho.totalEmKwanza - filho.subtotalEmKwanza - filho.taxaEntregaEmKwanza);
      const taxaBizyEmKwanza = Math.round(filho.subtotalEmKwanza * TAXA_BIZY_PERCENTUAL / 100);
      await this.deps.repassesFinanceiros.criar({
        negocioId: filho.negocioId,
        compraUnificadaId: compra.id,
        pedidoId: filho.pedidoId,
        valorBrutoEmKwanza: filho.totalEmKwanza,
        valorProdutosEmKwanza: filho.subtotalEmKwanza,
        valorEntregaEmKwanza: filho.taxaEntregaEmKwanza,
        impostosEmKwanza,
        taxaBizyEmKwanza,
        comissaoEmKwanza: 0,
        descontoEmKwanza: 0,
        motivoRetencao: "JANELA_RISCO_PAYOUT",
        retidoAte: new Date(Date.now() + DIAS_JANELA_RISCO_PAYOUT * 24 * 60 * 60 * 1000),
        politicaCalculoVersao: "market.split.v1",
        motivo: `Repasse compra unificada #${compra.numero}`
      });
    }

    if (dados.carrinhoId) await this.deps.carrinhosCommerce.converter(dados.carrinhoId);

    this.deps.eventos.emitir("COMPRA_UNIFICADA_CRIADA", {
      compraId: compra.id, numero: compra.numero, totalFornecedores: pedidosFilho.length
    });

    return {
      compra,
      pedidosFilho: await this.deps.comprasUnificadas.listarPedidosFilho(compra.id),
      acessoCompra: await this.deps.contaBizy.emitirAcessoCompra(compra.id)
    };
  }

  private normalizarMetodoPagamento(metodo?: string | null): string | null {
    const valor = metodo?.trim().toLowerCase().replace(/_/g, "-") ?? "";
    if (["transferencia", "transferência", "bank-transfer", "comprovativo"].includes(valor)) return "transferencia";
    if (["cash", "dinheiro", "dinheiro-entrega", "numerario", "numerário"].includes(valor)) return "cash";
    if (["multicaixa", "multicaixa-express", "express"].includes(valor)) return "multicaixa";
    if (["personalizado", "combinar", "a-combinar", "pagamento-manual", "manual"].includes(valor)) return "personalizado";
    return valor || null;
  }

  private normalizarMetodosLoja(metodos: string[]): string[] {
    const normalizados = [...new Set(metodos.map((metodo) => this.normalizarMetodoPagamento(metodo)).filter((metodo): metodo is string => Boolean(metodo)))];
    return normalizados.length ? normalizados : ["personalizado"];
  }

  private intersecaoMetodosPagamento(listas: string[][]): string[] {
    const normalizadas = listas.map((lista) => this.normalizarMetodosLoja(lista));
    return normalizadas[0]?.filter((metodo) => normalizadas.every((lista) => lista.includes(metodo))) ?? [];
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

  async buscarPortalCompradorConta(contaId: string, compraId?: string) {
    const compras = compraId
      ? [await this.deps.comprasUnificadas.buscarPorIdEConta(compraId, contaId)].filter((compra): compra is CompraUnificada => Boolean(compra))
      : await this.deps.comprasUnificadas.listarComprasPorConta(contaId, 50);
    return Promise.all(compras.map(async (compra) => ({
      compra,
      pedidosFilho: await this.deps.comprasUnificadas.listarPedidosFilho(compra.id)
    })));
  }

  async buscarCompraGuest(compraId: string, token: string | null) {
    if (!await this.deps.contaBizy.validarAcessoCompra(compraId, token)) return null;
    return this.buscarCompraComEstados(compraId);
  }

  async buscarPortalSeller(negocioId: string) {
    const pedidos = await this.deps.comprasUnificadas.listarPedidosFilhoPorNegocio(negocioId, 200);
    const seguros = pedidos.map(({ compra, pedido }) => ({
      compra: { id: compra.id, numero: compra.numero, estado: compra.estado, estadoPagamento: compra.estadoPagamento, criadoEm: compra.criadoEm },
      comprador: {
        nome: compra.compradorNome,
        telefoneFinal: compra.compradorTelefone.slice(-4),
        emailMascarado: compra.compradorEmail ? compra.compradorEmail.replace(/^(.).+(@.+)$/, "$1***$2") : null
      },
      pedido
    }));
    const [repasses, reembolsos] = await Promise.all([
      this.deps.repassesFinanceiros.listar(negocioId, { limite: 200 }),
      this.deps.reembolsos.listar(negocioId, { limite: 200 })
    ]);
    return {
      pedidos: seguros,
      repasses,
      reembolsos,
      metricas: {
        pedidos: seguros.length,
        porPreparar: seguros.filter((item) => item.pedido.estadoSeparacao !== "SEPARADO").length,
        entregasPendentes: seguros.filter((item) => !["ENTREGUE", "CANCELADA"].includes(item.pedido.estadoEntrega)).length,
        disputas: repasses.filter((item) => item.estado === "EM_DISPUTA").length + reembolsos.filter((item) => item.estado === "PENDENTE").length
      }
    };
  }

  async atualizarFulfillmentSeller(
    compraId: string,
    negocioId: string,
    actorId: string,
    dados: Parameters<RepositorioComprasUnificadas["atualizarFulfillment"]>[2]
  ) {
    const filhos = await this.deps.comprasUnificadas.listarPedidosFilho(compraId);
    const filho = filhos.find((item) => item.negocioId === negocioId);
    if (!filho) return null;
    const actualizado = await this.deps.comprasUnificadas.atualizarFulfillment(compraId, filho.pedidoId, { ...dados, actorId });
    if (actualizado) {
      this.deps.eventos.emitir("MARKET_FULFILLMENT_CHANGED", {
        schema: "bizy.market.event.v1",
        negocioId,
        compraId,
        pedidoId: filho.pedidoId,
        actorId,
        estado: actualizado
      });
    }
    return actualizado;
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
    const repasses = await this.deps.repassesFinanceiros.listar(dados.negocioId, { pedidoId: dados.pedidoId });
    for (const repasse of repasses) {
      await this.deps.repassesFinanceiros.reter(repasse.id, dados.negocioId, {
        motivo: `REEMBOLSO_${reembolso.id}`,
        valorEmKwanza: Math.min(repasse.valorLiquidoEmKwanza, dados.valorEmKwanza)
      });
    }

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

    if (processado) {
      const repasses = await this.deps.repassesFinanceiros.listar(negocioId, { pedidoId: processado.pedidoId });
      for (const repasse of repasses) {
        await this.deps.repassesFinanceiros.aplicarReembolso(
          repasse.id,
          negocioId,
          processado.valorEmKwanza,
          `Reembolso ${processado.id} processado`
        );
      }
    }

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
