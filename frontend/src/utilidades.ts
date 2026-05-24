import type { EstadoIntegracao, EstadoPeca, EstadoReserva, Peca, Reserva } from "./tipos";

export function formatarKwanza(valor: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0
  }).format(valor);
}

export function formatarTempoRestante(data: string | null): string {
  if (!data) return "Sem prazo";
  const milissegundos = new Date(data).getTime() - Date.now();
  if (Number.isNaN(milissegundos)) return "Prazo inválido";
  if (milissegundos <= 0) return "Expirada";
  const minutos = Math.ceil(milissegundos / 60_000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
}

export function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-AO", { day: "2-digit", month: "short" }).format(data);
}

export function formatarDataHoraCurta(data: string): string {
  const dataFormatada = new Date(data);
  if (Number.isNaN(dataFormatada.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(dataFormatada);
}

export function formatarConfianca(valor?: number): string {
  if (typeof valor !== "number") return "Sem leitura";
  return `${Math.round(valor * 100)}% confiança`;
}

export function obterIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function obterPrecoDaPeca(pecas: Peca[], codigoPeca: string): number {
  return pecas.find((peca) => peca.codigo === codigoPeca)?.precoEmKwanza ?? 0;
}

export function traduzirEstadoPeca(estado: EstadoPeca): string {
  const traducoes: Record<EstadoPeca, string> = {
    DISPONIVEL: "Disponível",
    RESERVADA: "Reservada",
    VENDIDA: "Vendida",
    ESGOTADA: "Esgotada"
  };
  return traducoes[estado];
}

export function traduzirEstadoReserva(estado: EstadoReserva): string {
  const traducoes: Record<EstadoReserva, string> = {
    PENDING: "Pendente",
    RESERVED: "Reservada",
    WAITING_PAYMENT: "Aguardando",
    PAID: "Paga",
    EXPIRED: "Expirada",
    CANCELLED: "Cancelada",
    WAITLISTED: "Fila"
  };
  return traducoes[estado];
}

export function traduzirEstadoPagamentoCurto(estado: Reserva["estadoPagamento"]): string {
  const traducoes: Record<Reserva["estadoPagamento"], string> = {
    AGUARDANDO_COMPROVATIVO: "Aguardando",
    COMPROVATIVO_RECEBIDO: "Recebido",
    CONFIRMADO: "Confirmado",
    REJEITADO: "Rejeitado"
  };
  return traducoes[estado];
}

export function traduzirEstadoIntegracao(estado: EstadoIntegracao): string {
  const traducoes: Record<EstadoIntegracao, string> = {
    CONFIGURADA: "Configurada",
    DESATIVADA: "Desativada",
    PENDENTE: "Pendente"
  };
  return traducoes[estado];
}

export function traduzirEstadoComentario(estado: string): string {
  const traducoes: Record<string, string> = {
    RECEBIDO: "Recebido",
    PROCESSADO: "Processado",
    REVISAO_MANUAL: "Revisão",
    IGNORADO: "Ignorado"
  };
  return traducoes[estado] ?? estado;
}
