import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { ProvedorSms } from "../dominio/provedores/ProvedorSms.js";
import type { RepositorioComprasUnificadas } from "../dominio/repositorios/contratos.js";
import type { EventoSistema, Peca, Reserva, TipoEventoSistema } from "../dominio/tipos.js";
import {
  resolverRemetenteSmsBizy,
  type FinalidadeRemetenteSmsBizy
} from "../infra/provedores/RemetentesSmsBizy.js";
import type { GestaoPedidosUseCase } from "./GestaoPedidosUseCase.js";

interface LoggerSmsBizy {
  info(dados: Record<string, unknown>, mensagem: string): void;
  warn(dados: Record<string, unknown>, mensagem: string): void;
}

interface DependenciasNotificacoesSmsBizy {
  eventos: DespachadorEventos;
  sms: ProvedorSms;
  pedidos: Pick<GestaoPedidosUseCase, "obterPedido">;
  compras: Pick<RepositorioComprasUnificadas, "buscarPorId">;
}

interface OpcoesNotificacoesSmsBizy {
  ativo: boolean;
  logger: LoggerSmsBizy;
  appPublicUrl?: string | null;
}

interface EnvioTransacional {
  telefone: string;
  finalidade: FinalidadeRemetenteSmsBizy;
  mensagem: string;
}

const eventosTransacionais: TipoEventoSistema[] = [
  "RESERVATION_CREATED",
  "RESERVATION_EXPIRING",
  "RESERVATION_WAITLISTED",
  "RESERVATION_EXPIRED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "ORDER_CREATED",
  "ORDER_PAYMENT_CONFIRMED",
  "ORDER_CANCELLED",
  "ORDER_RETURNED",
  "ORDER_REFUNDED",
  "ORDER_READY_TO_SHIP",
  "ORDER_DELIVERED",
  "COMPRA_UNIFICADA_CRIADA",
  "PAYMENT_PROOF_RECEIVED",
  "PEDIDO_FILHO_CANCELADO"
];

export class NotificacoesSmsBizyUseCase {
  private readonly eventosProcessados = new Set<string>();
  private readonly appPublicUrl: string;

  constructor(
    private readonly deps: DependenciasNotificacoesSmsBizy,
    private readonly opcoes: OpcoesNotificacoesSmsBizy
  ) {
    this.appPublicUrl = (opcoes.appPublicUrl ?? "https://usebizy.space").trim().replace(/\/+$/, "");

    if (!opcoes.ativo || !deps.sms.configurado) return;

    for (const tipo of eventosTransacionais) {
      deps.eventos.aoReceber(tipo, (evento) => {
        void this.processar(evento).catch((erro) => {
          opcoes.logger.warn(
            {
              eventoId: evento.id,
              eventoTipo: evento.tipo,
              erro: erro instanceof Error ? erro.message : String(erro)
            },
            "Falha ao processar notificacao SMS Bizy."
          );
        });
      });
    }
  }

  private async processar(evento: EventoSistema): Promise<void> {
    if (this.eventosProcessados.has(evento.id)) return;
    this.registarEventoProcessado(evento.id);

    const envio =
      this.resolverEnvioReserva(evento) ??
      await this.resolverEnvioCompra(evento) ??
      await this.resolverEnvioPedido(evento);
    if (!envio) return;

    const resultado = await this.deps.sms.enviarMensagem({
      telefone: envio.telefone,
      conteudo: cortarMensagemSms(envio.mensagem),
      remetente: resolverRemetenteSmsBizy(envio.finalidade)
    });

    const contextoLog = {
      eventoId: evento.id,
      eventoTipo: evento.tipo,
      finalidade: envio.finalidade,
      provider: resultado.provider,
      providerStatus: resultado.status,
      providerMessageId: resultado.idExterno
    };

    if (!resultado.ok) {
      this.opcoes.logger.warn(
        { ...contextoLog, erro: resultado.erro },
        "Notificacao SMS Bizy rejeitada pelo provider."
      );
      return;
    }

    this.opcoes.logger.info(contextoLog, "Notificacao SMS Bizy enviada.");
  }

  private resolverEnvioReserva(evento: EventoSistema): EnvioTransacional | null {
    const reserva = objeto(evento.dados.reserva) as Partial<Reserva>;
    const telefone = texto(reserva.telefoneCliente);
    if (!telefone) return null;

    const peca = objeto(evento.dados.peca) as Partial<Peca>;
    const produto = texto(peca.nome) ?? texto(reserva.codigoPeca) ?? "produto";
    const codigo = texto(reserva.codigoPeca);
    const finalidade: FinalidadeRemetenteSmsBizy =
      texto(reserva.liveId) || texto(reserva.origem)?.toLowerCase().includes("live") ? "LIVE" : "MARKET";

    switch (evento.tipo) {
      case "RESERVATION_CREATED":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: ${produto} reservado${codigo ? ` (${codigo})` : ""}. Conclui o pagamento dentro do prazo indicado pela loja.`
        };
      case "RESERVATION_WAITLISTED":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: entraste na fila de espera de ${produto}. Avisaremos quando houver stock disponivel.`
        };
      case "RESERVATION_EXPIRING":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: a reserva de ${produto} esta perto de expirar. Conclui o pagamento para manter o produto.`
        };
      case "RESERVATION_EXPIRED":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: a reserva de ${produto} expirou. Podes voltar a reservar se ainda houver stock.`
        };
      case "PAYMENT_CONFIRMED":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: pagamento confirmado para ${produto}. A loja vai preparar a tua encomenda.`
        };
      case "PAYMENT_REJECTED":
        return {
          telefone,
          finalidade: "SUPORTE",
          mensagem: `BizyCare: nao foi possivel validar o pagamento de ${produto}. Contacta a loja para corrigir o comprovativo.`
        };
      case "ORDER_READY_TO_SHIP":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: ${produto} esta em preparacao para entrega.`
        };
      case "ORDER_DELIVERED":
        return {
          telefone,
          finalidade,
          mensagem: `${prefixo(finalidade)}: ${produto} foi marcado como entregue. Obrigado por comprares no Bizy.`
        };
      default:
        return null;
    }
  }

  private async resolverEnvioCompra(evento: EventoSistema): Promise<EnvioTransacional | null> {
    const compraId = texto(evento.dados.compraId);
    const escopoCompra = texto(evento.dados.escopo) === "COMPRA_UNIFICADA";
    const eventoCompra = ["COMPRA_UNIFICADA_CRIADA", "PEDIDO_FILHO_CANCELADO"].includes(evento.tipo) || escopoCompra;
    if (!compraId || !eventoCompra) return null;

    const compra = await this.deps.compras.buscarPorId(compraId);
    if (!compra?.compradorTelefone) return null;

    if (evento.tipo === "COMPRA_UNIFICADA_CRIADA") {
      return {
        telefone: compra.compradorTelefone,
        finalidade: "MARKET",
        mensagem: `BizyShop: compra #${compra.numero} recebida. Total ${formatarKwanza(compra.totalEmKwanza)}. Acompanha em ${this.appPublicUrl}/conta/compras.`
      };
    }

    if (evento.tipo === "PAYMENT_PROOF_RECEIVED") {
      return {
        telefone: compra.compradorTelefone,
        finalidade: "MARKET",
        mensagem: `BizyShop: recebemos o comprovativo da compra #${compra.numero}. As lojas vao validar o pagamento.`
      };
    }

    if (evento.tipo === "PEDIDO_FILHO_CANCELADO") {
      return {
        telefone: compra.compradorTelefone,
        finalidade: "SUPORTE",
        mensagem: `BizyCare: um pedido da compra #${compra.numero} foi cancelado. Consulta os detalhes em ${this.appPublicUrl}/conta/compras.`
      };
    }

    return null;
  }

  private async resolverEnvioPedido(evento: EventoSistema): Promise<EnvioTransacional | null> {
    const negocioId = texto(evento.dados.negocioId);
    const pedidoId = texto(evento.dados.pedidoId);
    if (!negocioId || !pedidoId) return null;

    const detalhe = await this.deps.pedidos.obterPedido(pedidoId, negocioId);
    if (!detalhe || detalhe.pedido.origem.toUpperCase() === "MARKET") return null;

    const telefone = detalhe.cliente?.telefone;
    if (!telefone) return null;

    const numero = detalhe.pedido.numero;
    switch (evento.tipo) {
      case "ORDER_CREATED":
        return {
          telefone,
          finalidade: "MARKET",
          mensagem: `BizyShop: pedido #${numero} criado. Total ${formatarKwanza(detalhe.pedido.totalEmKwanza)}.`
        };
      case "ORDER_PAYMENT_CONFIRMED":
        return {
          telefone,
          finalidade: "MARKET",
          mensagem: `BizyShop: pagamento do pedido #${numero} confirmado. A loja vai iniciar a preparacao.`
        };
      case "ORDER_READY_TO_SHIP":
        return {
          telefone,
          finalidade: "MARKET",
          mensagem: `BizyShop: pedido #${numero} pronto para entrega.`
        };
      case "ORDER_DELIVERED":
        return {
          telefone,
          finalidade: "MARKET",
          mensagem: `BizyShop: pedido #${numero} marcado como entregue. Obrigado por comprares no Bizy.`
        };
      case "PAYMENT_REJECTED":
        return {
          telefone,
          finalidade: "SUPORTE",
          mensagem: `BizyCare: o pagamento do pedido #${numero} precisa de correcao. Contacta a loja para rever o comprovativo.`
        };
      case "ORDER_CANCELLED":
      case "ORDER_RETURNED":
      case "ORDER_REFUNDED":
        return {
          telefone,
          finalidade: "SUPORTE",
          mensagem: `BizyCare: o pedido #${numero} teve uma actualizacao de suporte (${rotuloEvento(evento.tipo)}).`
        };
      default:
        return null;
    }
  }

  private registarEventoProcessado(eventoId: string): void {
    this.eventosProcessados.add(eventoId);
    if (this.eventosProcessados.size <= 2_000) return;
    const primeiro = this.eventosProcessados.values().next().value as string | undefined;
    if (primeiro) this.eventosProcessados.delete(primeiro);
  }
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function formatarKwanza(valor: number): string {
  return `Kz ${Math.round(valor).toLocaleString("pt-PT")}`;
}

function prefixo(finalidade: FinalidadeRemetenteSmsBizy): string {
  return finalidade === "LIVE" ? "BizyLive" : finalidade === "MARKET" ? "BizyShop" : "Bizy";
}

function rotuloEvento(tipo: TipoEventoSistema): string {
  if (tipo === "ORDER_CANCELLED") return "cancelamento";
  if (tipo === "ORDER_RETURNED") return "devolucao";
  return "reembolso";
}

function cortarMensagemSms(mensagem: string): string {
  const normalizada = mensagem.replace(/\s+/g, " ").trim();
  return normalizada.length <= 160 ? normalizada : `${normalizada.slice(0, 157).trimEnd()}...`;
}
