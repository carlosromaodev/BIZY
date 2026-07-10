import { AlertTriangle, ChevronDown, ShoppingBag, MessageCircle, Banknote } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Cliente360 } from "../../tipos";
import { formatarKwanza } from "../../utilidades";

function varianteEstado(estado: Cliente360["estadoRelacionamento"]): "success" | "warning" | "destructive" | "secondary" | "info" | "default" {
  if (estado === "VIP" || estado === "PRIORIDADE_ALTA") return "default";
  if (estado === "ATIVO") return "success";
  if (estado === "LEAD") return "info";
  if (estado === "INADIMPLENTE" || estado === "BLOQUEADO") return "destructive";
  if (estado === "INATIVO") return "warning";
  return "secondary";
}

function traduzirEstado(estado: Cliente360["estadoRelacionamento"]): string {
  const m: Record<Cliente360["estadoRelacionamento"], string> = {
    ATIVO: "Activo",
    LEAD: "Lead",
    VIP: "VIP",
    INATIVO: "Inactivo",
    BLOQUEADO: "Bloqueado",
    SEM_WHATSAPP: "Sem WhatsApp",
    SEM_CONSENTIMENTO: "Sem consent.",
    INADIMPLENTE: "Inadimplente",
    PRIORIDADE_ALTA: "Prioridade alta"
  };
  return m[estado];
}

function formatarTempoRelativo(data: string | null): string {
  if (!data) return "Nunca";
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  return new Date(data).toLocaleDateString("pt-AO", { day: "numeric", month: "short" });
}

function obterSinaisOperacionais(cliente: Cliente360): Array<{ id: string; rotulo: string; variante: "default" | "warning" | "destructive" | "secondary" }> {
  const tags = cliente.tags.map((tag) => tag.toLowerCase());
  const sinais: Array<{ id: string; rotulo: string; variante: "default" | "warning" | "destructive" | "secondary" }> = [];

  if (cliente.estadoRelacionamento === "VIP" || tags.includes("vip")) {
    sinais.push({ id: "vip", rotulo: "VIP", variante: "default" });
  }
  if (tags.some((tag) => tag.includes("reclam") || tag.includes("queixa"))) {
    sinais.push({ id: "reclamacao", rotulo: "Reclamação", variante: "destructive" });
  }
  if (
    cliente.estadoRelacionamento === "INADIMPLENTE" ||
    cliente.metricas.reservasAtivas > 0 ||
    tags.some((tag) => tag.includes("pagamento") || tag.includes("cobranca") || tag.includes("cobrança"))
  ) {
    sinais.push({ id: "pagamento", rotulo: "Pagamento pendente", variante: "warning" });
  }
  if (cliente.estadoRelacionamento === "PRIORIDADE_ALTA") {
    sinais.push({ id: "prioridade", rotulo: "Prioridade alta", variante: "warning" });
  }

  return sinais;
}

export function ResumoClienteCartao({
  cliente,
  className
}: {
  cliente: Cliente360;
  className?: string;
}) {
  const [expandido, setExpandido] = useState(true);
  const emRisco = cliente.estadoRelacionamento === "INADIMPLENTE" || cliente.estadoRelacionamento === "BLOQUEADO";
  const sinais = obterSinaisOperacionais(cliente);

  return (
    <div className={`atendimento-resumo-cliente ${className ?? ""}`}>
      <button
        type="button"
        className="atendimento-props-section-header"
        onClick={() => setExpandido((v) => !v)}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar className="h-8 w-8 shrink-0">
            {cliente.avatarUrl && <AvatarImage src={cliente.avatarUrl} alt="" />}
            <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
              {(cliente.nome ?? "C")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{cliente.nome ?? "Cliente"}</span>
            <span className="block truncate text-[0.7rem] text-muted-foreground">{cliente.telefone ?? cliente.email ?? ""}</span>
          </div>
          <Badge variant={varianteEstado(cliente.estadoRelacionamento)} className="text-[0.6rem] shrink-0">
            {traduzirEstado(cliente.estadoRelacionamento)}
          </Badge>
        </div>
        <ChevronDown
          size={14}
          className="shrink-0 text-muted-foreground transition-transform"
          style={{ transform: expandido ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 pt-3 pb-1">
              <div className="atendimento-resumo-metric">
                <ShoppingBag size={12} className="text-muted-foreground" />
                <strong>{cliente.metricas.totalReservas}</strong>
                <span>pedidos</span>
              </div>
              <div className="atendimento-resumo-metric">
                <Banknote size={12} className="text-muted-foreground" />
                <strong>{formatarKwanza(cliente.metricas.totalCompradoEmKwanza)}</strong>
                <span>gasto</span>
              </div>
              <div className="atendimento-resumo-metric">
                <MessageCircle size={12} className="text-muted-foreground" />
                <strong>{cliente.metricas.conversasAbertas}</strong>
                <span>abertas</span>
              </div>
            </div>

            <p className="text-[0.65rem] text-muted-foreground mt-1">
              Última interação: {formatarTempoRelativo(cliente.metricas.ultimaInteracaoEm)}
            </p>

            {sinais.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sinais.map((sinal) => (
                  <Badge key={sinal.id} variant={sinal.variante} className="text-[0.55rem]">{sinal.rotulo}</Badge>
                ))}
              </div>
            )}

            {emRisco && (
              <div className="flex items-center gap-1.5 mt-2 rounded-lg bg-destructive/10 border border-destructive/20 px-2.5 py-1.5 text-xs text-destructive">
                <AlertTriangle size={12} />
                <span className="font-medium">
                  {cliente.estadoRelacionamento === "INADIMPLENTE" ? "Cliente inadimplente" : "Cliente bloqueado"}
                </span>
              </div>
            )}

            {cliente.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {cliente.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[0.55rem]">{tag}</Badge>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
