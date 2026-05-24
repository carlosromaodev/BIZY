import type { Conversa, EstadoReserva, Peca, Reserva } from "./tipos";
import { obterPrecoDaPeca } from "./utilidades";

export type EstadoClienteCrm = "VIP" | "Recorrente" | "Pendente" | "Novo";

export interface ClienteCrm {
  telefone: string;
  telefoneFormatado: string;
  nome: string;
  ultimaInteracao: string | null;
  conversas: number;
  mensagens: number;
  mensagensFalhadas: number;
  pedidos: number;
  pedidosPagos: number;
  pedidosPendentes: number;
  pedidosPerdidos: number;
  valorPago: number;
  valorPendente: number;
  tags: string[];
  estado: EstadoClienteCrm;
}

export interface SegmentoCampanha {
  id: string;
  titulo: string;
  foco: string;
  clientes: ClienteCrm[];
  valorEstimado: number;
  tom: "neutro" | "atencao" | "sucesso" | "perigo";
}

const estadosPedidoPendente: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT"];
const estadosPedidoPerdido: EstadoReserva[] = ["EXPIRED", "CANCELLED", "WAITLISTED"];

export function normalizarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 9 && digitos.startsWith("9")) return `244${digitos}`;
  if (digitos.length === 12 && digitos.startsWith("244")) return digitos;
  return digitos || telefone.trim();
}

export function formatarTelefoneAngola(telefone: string): string {
  const digitos = normalizarTelefone(telefone);
  if (digitos.length === 12 && digitos.startsWith("244")) {
    return `+244 ${digitos.slice(3, 6)} ${digitos.slice(6, 9)} ${digitos.slice(9)}`;
  }
  return telefone || "Sem telefone";
}

function dataMaisRecente(atual: string | null, candidata: string | null): string | null {
  if (!candidata) return atual;
  if (!atual) return candidata;
  return new Date(candidata).getTime() > new Date(atual).getTime() ? candidata : atual;
}

function classificarCliente(cliente: Omit<ClienteCrm, "estado">): EstadoClienteCrm {
  if (cliente.pedidosPendentes > 0 || cliente.mensagensFalhadas > 0) return "Pendente";
  if (cliente.pedidosPagos >= 2 || cliente.valorPago >= 50_000) return "VIP";
  if (cliente.pedidos >= 2 || cliente.conversas >= 2) return "Recorrente";
  return "Novo";
}

export function montarClientesCrm({
  conversas,
  reservas,
  pecas
}: {
  conversas: Conversa[];
  reservas: Reserva[];
  pecas: Peca[];
}): ClienteCrm[] {
  const clientes = new Map<string, Omit<ClienteCrm, "estado"> & { tagsSet: Set<string> }>();

  function garantirCliente(telefoneOriginal: string, nomeOriginal?: string) {
    const telefone = normalizarTelefone(telefoneOriginal);
    const existente = clientes.get(telefone);
    if (existente) {
      if (nomeOriginal && (!existente.nome || existente.nome === "Cliente")) existente.nome = nomeOriginal;
      return existente;
    }

    const novo = {
      telefone,
      telefoneFormatado: formatarTelefoneAngola(telefone),
      nome: nomeOriginal?.trim() || "Cliente",
      ultimaInteracao: null,
      conversas: 0,
      mensagens: 0,
      mensagensFalhadas: 0,
      pedidos: 0,
      pedidosPagos: 0,
      pedidosPendentes: 0,
      pedidosPerdidos: 0,
      valorPago: 0,
      valorPendente: 0,
      tags: [],
      tagsSet: new Set<string>()
    };
    clientes.set(telefone, novo);
    return novo;
  }

  conversas.forEach((conversa) => {
    const cliente = garantirCliente(conversa.telefone, conversa.nomeCliente);
    cliente.conversas += 1;
    cliente.mensagens += conversa.mensagens.length;
    cliente.mensagensFalhadas += conversa.mensagens.filter((mensagem) => mensagem.status === "FAILED").length;
    cliente.ultimaInteracao = dataMaisRecente(cliente.ultimaInteracao, conversa.ultimaAtualizacao);
    conversa.tags.forEach((tag) => cliente.tagsSet.add(tag));
  });

  reservas.forEach((reserva) => {
    const cliente = garantirCliente(reserva.telefoneCliente, reserva.nomeCliente || reserva.usernameCliente);
    const preco = obterPrecoDaPeca(pecas, reserva.codigoPeca);
    cliente.pedidos += 1;
    cliente.ultimaInteracao = dataMaisRecente(cliente.ultimaInteracao, reserva.criadaEm);

    if (reserva.estado === "PAID") {
      cliente.pedidosPagos += 1;
      cliente.valorPago += preco;
    }

    if (estadosPedidoPendente.includes(reserva.estado)) {
      cliente.pedidosPendentes += 1;
      cliente.valorPendente += preco;
    }

    if (estadosPedidoPerdido.includes(reserva.estado)) {
      cliente.pedidosPerdidos += 1;
    }
  });

  return [...clientes.values()]
    .map(({ tagsSet, ...cliente }) => ({
      ...cliente,
      tags: [...tagsSet].slice(0, 4),
      estado: classificarCliente(cliente)
    }))
    .sort((a, b) => {
      const dataA = a.ultimaInteracao ? new Date(a.ultimaInteracao).getTime() : 0;
      const dataB = b.ultimaInteracao ? new Date(b.ultimaInteracao).getTime() : 0;
      return dataB - dataA;
    });
}

export function montarSegmentosCampanha(clientes: ClienteCrm[]): SegmentoCampanha[] {
  return [
    {
      id: "pagamento-pendente",
      titulo: "Pagamento pendente",
      foco: "Fechar pedidos já reservados",
      clientes: clientes.filter((cliente) => cliente.pedidosPendentes > 0),
      valorEstimado: clientes.reduce((total, cliente) => total + cliente.valorPendente, 0),
      tom: "atencao"
    },
    {
      id: "compradores",
      titulo: "Compradores",
      foco: "Recompra e novidades",
      clientes: clientes.filter((cliente) => cliente.pedidosPagos > 0),
      valorEstimado: clientes.reduce((total, cliente) => total + cliente.valorPago, 0),
      tom: "sucesso"
    },
    {
      id: "recorrentes",
      titulo: "Recorrentes",
      foco: "Clientes com histórico quente",
      clientes: clientes.filter((cliente) => cliente.estado === "VIP" || cliente.estado === "Recorrente"),
      valorEstimado: clientes
        .filter((cliente) => cliente.estado === "VIP" || cliente.estado === "Recorrente")
        .reduce((total, cliente) => total + cliente.valorPago + cliente.valorPendente, 0),
      tom: "neutro"
    },
    {
      id: "oportunidades",
      titulo: "Oportunidades perdidas",
      foco: "Recuperar reservas expiradas ou falhadas",
      clientes: clientes.filter((cliente) => cliente.pedidosPerdidos > 0 || cliente.mensagensFalhadas > 0),
      valorEstimado: 0,
      tom: "perigo"
    }
  ];
}

export function clientesParaCsv(clientes: ClienteCrm[]): string {
  const linhas = [
    ["telefone", "nome", "estado", "pedidos", "pagos", "pendentes", "valorPago", "valorPendente"].join(",")
  ];

  clientes.forEach((cliente) => {
    linhas.push([
      cliente.telefone,
      cliente.nome,
      cliente.estado,
      String(cliente.pedidos),
      String(cliente.pedidosPagos),
      String(cliente.pedidosPendentes),
      String(cliente.valorPago),
      String(cliente.valorPendente)
    ].map((valor) => `"${valor.replace(/"/g, '""')}"`).join(","));
  });

  return linhas.join("\n");
}
