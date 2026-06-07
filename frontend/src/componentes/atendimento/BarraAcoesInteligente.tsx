import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Send,
  Truck,
  UserCheck
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Conversa, Peca, ProximaAcaoAtendimento, Reserva } from "../../tipos";
import { formatarKwanza, formatarTempoRestante } from "../../utilidades";

export type TipoAcaoInteligente =
  | "confirmar-pagamento"
  | "assumir-atendimento"
  | "produto-esgotado"
  | "enviar-info-produto"
  | "agendar-followup"
  | "reserva-expira"
  | "criar-pedido"
  | "pedir-comprovativo"
  | "enviar-dados-pagamento"
  | "pedir-endereco"
  | "confirmar-entrega";

interface AcaoInteligente {
  tipo: TipoAcaoInteligente;
  rotulo: string;
  icone: ReactNode;
  variante: "default" | "success" | "warning" | "destructive";
  dados?: string;
  entidadeTipo?: string;
  entidadeId?: string;
  motivo?: string;
}

const springChip = { type: "spring" as const, stiffness: 400, damping: 26 };

function calcularAcoes(
  conversa: Conversa,
  pecas: Peca[],
  _reservas: Reserva[],
  acoesServidor: ProximaAcaoAtendimento[] = []
): AcaoInteligente[] {
  const acoes: AcaoInteligente[] = acoesServidor
    .map((acao) => mapearAcaoServidor(acao, conversa))
    .filter((acao): acao is AcaoInteligente => Boolean(acao));
  const reserva = conversa.reservaAtual;
  const pecaRelacionada = conversa.pecaRelacionada
    ? pecas.find((p) => p.codigo.toLowerCase() === conversa.pecaRelacionada!.toLowerCase())
    : null;

  if (reserva && ["WAITING_PAYMENT", "RESERVED", "PENDING"].includes(reserva.estado) && reserva.estado !== "PAID") {
    acoes.push({
      tipo: "confirmar-pagamento",
      rotulo: "Confirmar pagamento",
      icone: <CheckCircle2 size={14} />,
      variante: "success"
    });
  }

  if (reserva?.expiraEm) {
    const restante = new Date(reserva.expiraEm).getTime() - Date.now();
    if (restante > 0 && restante < 30 * 60 * 1000) {
      acoes.push({
        tipo: "reserva-expira",
        rotulo: `Expira em ${formatarTempoRestante(reserva.expiraEm)}`,
        icone: <Clock3 size={14} />,
        variante: "warning"
      });
    }
  }

  if (conversa.estadoCrm === "NOVA") {
    acoes.push({
      tipo: "assumir-atendimento",
      rotulo: "Assumir atendimento",
      icone: <UserCheck size={14} />,
      variante: "default"
    });
  }

  if (pecaRelacionada) {
    if (pecaRelacionada.quantidade === 0) {
      acoes.push({
        tipo: "produto-esgotado",
        rotulo: "Produto esgotado — avisar",
        icone: <AlertTriangle size={14} />,
        variante: "destructive",
        dados: `Olá ${conversa.nomeCliente}, infelizmente a peça #${pecaRelacionada.codigo} (${pecaRelacionada.nome}) está esgotada de momento. Assim que tivermos reposição, entramos em contacto.`
      });
    } else {
      acoes.push({
        tipo: "enviar-info-produto",
        rotulo: `${pecaRelacionada.codigo} · ${formatarKwanza(pecaRelacionada.precoEmKwanza)} · stock ${pecaRelacionada.quantidade}`,
        icone: <Package size={14} />,
        variante: "default",
        dados: `A peça #${pecaRelacionada.codigo} é ${pecaRelacionada.nome}. Preço: ${formatarKwanza(pecaRelacionada.precoEmKwanza)}. Stock actual: ${pecaRelacionada.quantidade} unidade(s). ${pecaRelacionada.estado === "DISPONIVEL" ? "Está disponível para reserva." : "Neste momento não está disponível."}`
      });
    }
  }

  if (conversa.estadoCrm === "AGUARDANDO_CLIENTE" && conversa.mensagens.length > 0) {
    const ultimaMensagemAgente = [...conversa.mensagens].reverse().find((m) => m.remetente !== "cliente");
    if (ultimaMensagemAgente) {
      const horas = (Date.now() - new Date(ultimaMensagemAgente.enviadaEm).getTime()) / 3600000;
      if (horas >= 24) {
        acoes.push({
          tipo: "agendar-followup",
          rotulo: "Agendar follow-up",
          icone: <Bell size={14} />,
          variante: "warning"
        });
      }
    }
  }

  return deduplicarAcoes(acoes).slice(0, 4);
}

function deduplicarAcoes(acoes: AcaoInteligente[]) {
  const vistos = new Set<string>();
  return acoes.filter((acao) => {
    const chave = `${acao.tipo}:${acao.entidadeTipo ?? ""}:${acao.entidadeId ?? ""}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function mapearAcaoServidor(acao: ProximaAcaoAtendimento, conversa: Conversa): AcaoInteligente | null {
  const base = {
    entidadeTipo: acao.entidadeTipo,
    entidadeId: acao.entidadeId,
    motivo: acao.motivo,
    variante: variantePrioridade(acao.prioridade)
  } satisfies Partial<AcaoInteligente>;

  switch (acao.tipo) {
    case "CRIAR_PEDIDO":
      return {
        ...base,
        tipo: "criar-pedido",
        rotulo: acao.titulo,
        icone: <ClipboardList size={14} />,
        variante: "success"
      };
    case "PEDIR_COMPROVATIVO":
      return {
        ...base,
        tipo: "pedir-comprovativo",
        rotulo: acao.titulo,
        icone: <Send size={14} />,
        dados: `Olá ${conversa.nomeCliente}, pode enviar o comprovativo de pagamento por aqui para confirmarmos o pedido?`
      };
    case "ENVIAR_DADOS_PAGAMENTO":
      return {
        ...base,
        tipo: "enviar-dados-pagamento",
        rotulo: acao.titulo,
        icone: <CreditCard size={14} />,
        variante: "default",
        dados: `Olá ${conversa.nomeCliente}, vou enviar os dados de pagamento do seu pedido. Assim que pagar, envie o comprovativo por aqui.`
      };
    case "PEDIR_ENDERECO":
      return {
        ...base,
        tipo: "pedir-endereco",
        rotulo: acao.titulo,
        icone: <MapPin size={14} />,
        dados: `Pode enviar o bairro, referência e horário ideal para fazermos a entrega?`
      };
    case "CONFIRMAR_ENTREGA":
      return {
        ...base,
        tipo: "confirmar-entrega",
        rotulo: acao.titulo,
        icone: <Truck size={14} />,
        dados: `O seu pedido já está em preparação. Pode confirmar o melhor horário para entrega?`
      };
    case "ASSUMIR_ATENDIMENTO":
      return {
        ...base,
        tipo: "assumir-atendimento",
        rotulo: acao.titulo,
        icone: <UserCheck size={14} />,
        variante: "default"
      };
    default:
      return null;
  }
}

function variantePrioridade(prioridade: ProximaAcaoAtendimento["prioridade"]): AcaoInteligente["variante"] {
  if (prioridade === "URGENTE") return "destructive";
  if (prioridade === "ALTA") return "warning";
  return "default";
}

const varianteCor: Record<AcaoInteligente["variante"], string> = {
  default: "atendimento-acao-chip--default",
  success: "atendimento-acao-chip--success",
  warning: "atendimento-acao-chip--warning",
  destructive: "atendimento-acao-chip--destructive"
};

export function BarraAcoesInteligente({
  conversaAtual,
  pecas,
  reservas,
  acoesServidor = [],
  onAccao
}: {
  conversaAtual: Conversa;
  pecas: Peca[];
  reservas: Reserva[];
  acoesServidor?: ProximaAcaoAtendimento[];
  onAccao: (tipo: TipoAcaoInteligente, dados?: string, contexto?: { entidadeTipo?: string; entidadeId?: string }) => void;
}) {
  const acoes = useMemo(
    () => calcularAcoes(conversaAtual, pecas, reservas, acoesServidor),
    [acoesServidor, conversaAtual, pecas, reservas]
  );

  if (acoes.length === 0) return null;

  return (
    <div className="atendimento-acoes-bar">
      <AnimatePresence mode="popLayout">
        {acoes.map((acao, i) => (
          <motion.div
            key={acao.tipo}
            initial={{ opacity: 0, scale: 0.9, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ ...springChip, delay: i * 0.05 }}
          >
            <button
              type="button"
              className={`atendimento-acao-chip ${varianteCor[acao.variante]}`}
              title={acao.motivo}
              onClick={() => onAccao(acao.tipo, acao.dados, { entidadeTipo: acao.entidadeTipo, entidadeId: acao.entidadeId })}
            >
              {acao.icone}
              <span>{acao.rotulo}</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
