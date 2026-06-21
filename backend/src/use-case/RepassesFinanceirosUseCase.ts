import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type {
  RepositorioRepassesFinanceiros,
  RepositorioReembolsos,
  RepositorioComprasUnificadas,
  RepositorioPedidos
} from "../dominio/repositorios/contratos.js";
import type {
  RepasseFinanceiro,
  ReembolsoPedido
} from "../dominio/tipos.js";

interface DependenciasRepasses {
  repassesFinanceiros: RepositorioRepassesFinanceiros;
  reembolsos: RepositorioReembolsos;
  comprasUnificadas: RepositorioComprasUnificadas;
  pedidos: RepositorioPedidos;
  eventos: DespachadorEventos;
}

/**
 * RF-068: Repasse financeiro para fornecedores quando Bizy centralizar pagamento
 * RF-069: Registrar taxas, comissões, descontos, entrega e repasses de forma auditável
 * RF-072: Exibir pendências financeiras no painel da loja e no painel administrativo
 * RN-030: Valor recebido deve ser conciliado antes do repasse
 * RN-031: Repasse considera taxas, comissões, descontos, cancelamentos, reembolsos
 * RN-032: Repasse não acontece para pedido cancelado, fraudulento, não pago ou em disputa
 * RN-034: Toda taxa ou comissão visível em relatório financeiro
 * RN-035: Trilha auditável de pagamento, comprovativo, repasse e reembolso
 */
export class RepassesFinanceirosUseCase {
  constructor(private readonly deps: DependenciasRepasses) {}

  /** RF-068/RF-069: Listar repasses de um fornecedor com filtros */
  async listarRepasses(negocioId: string, filtros?: {
    estado?: RepasseFinanceiro["estado"];
    pedidoId?: string;
    limite?: number;
  }): Promise<RepasseFinanceiro[]> {
    return this.deps.repassesFinanceiros.listar(negocioId, filtros);
  }

  /** RF-072: Resumo financeiro para painel da loja */
  async resumoFinanceiroLoja(negocioId: string): Promise<{
    totalPendente: number;
    totalConciliado: number;
    totalAprovado: number;
    totalPago: number;
    totalCancelado: number;
    repasses: RepasseFinanceiro[];
    reembolsosPendentes: ReembolsoPedido[];
  }> {
    const repasses = await this.deps.repassesFinanceiros.listar(negocioId);
    const reembolsosPendentes = await this.deps.reembolsos.listar(negocioId, { estado: "PENDENTE" });

    const totalPendente = repasses.filter((r) => r.estado === "PENDENTE").reduce((s, r) => s + r.valorLiquidoEmKwanza, 0);
    const totalConciliado = repasses.filter((r) => r.estado === "CONCILIADO").reduce((s, r) => s + r.valorLiquidoEmKwanza, 0);
    const totalAprovado = repasses.filter((r) => r.estado === "APROVADO").reduce((s, r) => s + r.valorLiquidoEmKwanza, 0);
    const totalPago = repasses.filter((r) => r.estado === "PAGO").reduce((s, r) => s + r.valorLiquidoEmKwanza, 0);
    const totalCancelado = repasses.filter((r) => r.estado === "CANCELADO").reduce((s, r) => s + r.valorLiquidoEmKwanza, 0);

    return { totalPendente, totalConciliado, totalAprovado, totalPago, totalCancelado, repasses, reembolsosPendentes };
  }

  /**
   * RN-030: Conciliar repasse — verifica que pagamento foi recebido antes de aprovar repasse.
   * RN-032: Bloqueia repasse para pedidos cancelados ou não pagos.
   */
  async conciliarRepasse(repasseId: string, negocioId: string): Promise<RepasseFinanceiro | null> {
    const repasse = await this.deps.repassesFinanceiros.buscarPorId(repasseId, negocioId);
    if (!repasse) return null;

    // RN-032: Verificar que pedido não está cancelado/não pago
    const pedido = await this.deps.pedidos.buscarPorId(repasse.pedidoId, negocioId);
    if (!pedido) return null;
    if (pedido.estado === "CANCELADO" || pedido.estadoPagamento === "PENDENTE" || pedido.estadoPagamento === "REJEITADO") {
      return null;
    }

    const conciliado = await this.deps.repassesFinanceiros.conciliar(repasseId, negocioId);

    if (conciliado) {
      this.deps.eventos.emitir("REPASSE_CONCILIADO", {
        repasseId, negocioId, valor: conciliado.valorLiquidoEmKwanza
      });
    }

    return conciliado;
  }

  /** RF-068: Aprovar repasse após conciliação */
  async aprovarRepasse(repasseId: string, negocioId: string): Promise<RepasseFinanceiro | null> {
    const aprovado = await this.deps.repassesFinanceiros.aprovar(repasseId, negocioId);

    if (aprovado) {
      this.deps.eventos.emitir("REPASSE_APROVADO", {
        repasseId, negocioId, valor: aprovado.valorLiquidoEmKwanza
      });
    }

    return aprovado;
  }

  /** RF-068: Registrar pagamento do repasse ao fornecedor */
  async pagarRepasse(repasseId: string, negocioId: string, referencia: string): Promise<RepasseFinanceiro | null> {
    const pago = await this.deps.repassesFinanceiros.pagar(repasseId, negocioId, referencia);

    if (pago) {
      this.deps.eventos.emitir("REPASSE_PAGO", {
        repasseId, negocioId, valor: pago.valorLiquidoEmKwanza, referencia
      });
    }

    return pago;
  }

  /** RN-031: Cancelar repasse com motivo auditável */
  async cancelarRepasse(repasseId: string, negocioId: string, motivo: string): Promise<RepasseFinanceiro | null> {
    const cancelado = await this.deps.repassesFinanceiros.cancelar(repasseId, negocioId, motivo);

    if (cancelado) {
      this.deps.eventos.emitir("REPASSE_CANCELADO", {
        repasseId, negocioId, motivo
      });
    }

    return cancelado;
  }

  /** RN-033: Listar reembolsos de um fornecedor, filtrando por pedido */
  async listarReembolsos(negocioId: string, filtros?: {
    pedidoId?: string;
    estado?: ReembolsoPedido["estado"];
    limite?: number;
  }): Promise<ReembolsoPedido[]> {
    return this.deps.reembolsos.listar(negocioId, filtros);
  }

  /** RF-072: Resumo financeiro administrativo (painel Bizy) */
  async resumoFinanceiroAdmin(): Promise<{
    fornecedores: Array<{
      negocioId: string;
      pendente: number;
      conciliado: number;
      aprovado: number;
      pago: number;
    }>;
  }> {
    // Na implementação real, isto seria uma query agregada.
    // Por enquanto retorna estrutura vazia — preenchido quando houver
    // endpoint administrativo com listagem de todos os negócios.
    return { fornecedores: [] };
  }
}
