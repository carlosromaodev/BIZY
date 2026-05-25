import type {
  RepositorioAtendimento,
  RepositorioClientes,
  RepositorioPecas,
  RepositorioReservas
} from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoCliente360,
  Cliente360,
  Cliente360ComMetricas,
  DadosCliente360,
  FiltrosClientes360,
  MetricasCliente360,
  Reserva
} from "../dominio/tipos.js";

const estadosReservaAtiva = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"];

export class GestaoClientesCrmUseCase {
  constructor(
    private readonly clientes: RepositorioClientes,
    private readonly atendimento: RepositorioAtendimento,
    private readonly reservas: RepositorioReservas,
    private readonly pecas: RepositorioPecas
  ) {}

  async criarCliente(dados: DadosCliente360): Promise<Cliente360> {
    return this.clientes.salvar({
      ...dados,
      tags: this.normalizarTags(dados.tags ?? [])
    });
  }

  async atualizarCliente(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360> {
    const cliente = await this.clientes.atualizar(id, negocioId, {
      ...dados,
      tags: dados.tags ? this.normalizarTags(dados.tags) : undefined
    });
    if (!cliente) throw new Error(`Cliente ${id} não encontrado.`);
    return cliente;
  }

  async listarClientes(
    negocioId: string,
    filtros: FiltrosClientes360 = {}
  ): Promise<{ clientes: Cliente360ComMetricas[] }> {
    const clientes = await this.clientes.listar(negocioId, filtros);
    const [reservas, conversas, pecas] = await Promise.all([
      this.reservas.listar(negocioId),
      this.atendimento.listarConversasComMensagens(1000, negocioId),
      this.pecas.listar(negocioId)
    ]);
    const precoPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca.precoEmKwanza]));

    return {
      clientes: clientes.map((cliente) => ({
        ...cliente,
        metricas: this.calcularMetricas(cliente, reservas, conversas, precoPorCodigo)
      }))
    };
  }

  async obterPerfil(id: string, negocioId: string) {
    const cliente = await this.clientes.buscarPorId(id, negocioId);
    if (!cliente) return null;

    const [reservas, conversas, pecas] = await Promise.all([
      this.reservas.listar(negocioId),
      this.atendimento.listarConversasComMensagens(1000, negocioId),
      this.pecas.listar(negocioId)
    ]);
    const precoPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca.precoEmKwanza]));
    const reservasCliente = reservas.filter((reserva) => this.mesmoCliente(cliente, reserva.telefoneCliente));
    const conversasCliente = conversas.filter((conversa) => this.mesmoCliente(cliente, conversa.conversa.telefone));

    return {
      cliente,
      metricas: this.calcularMetricas(cliente, reservas, conversas, precoPorCodigo),
      reservas: reservasCliente,
      conversas: conversasCliente
    };
  }

  async exportarCsv(negocioId: string): Promise<{ csv: string; quantidade: number; filtros: FiltrosClientes360 }> {
    const filtros: FiltrosClientes360 = { limite: 10_000 };
    const { clientes } = await this.listarClientes(negocioId, filtros);
    const linhas = [
      [
        "telefone",
        "nome",
        "email",
        "estadoRelacionamento",
        "tags",
        "totalReservas",
        "totalCompradoEmKwanza",
        "ultimaInteracaoEm"
      ],
      ...clientes.map((cliente) => [
        cliente.telefone ?? "",
        cliente.nome ?? "",
        cliente.email ?? "",
        cliente.estadoRelacionamento,
        cliente.tags.join("|"),
        String(cliente.metricas.totalReservas),
        String(cliente.metricas.totalCompradoEmKwanza),
        cliente.metricas.ultimaInteracaoEm?.toISOString() ?? ""
      ])
    ];

    return {
      csv: `${linhas.map((linha) => linha.map((valor) => this.csv(valor)).join(",")).join("\n")}\n`,
      quantidade: clientes.length,
      filtros
    };
  }

  private calcularMetricas(
    cliente: Cliente360,
    reservas: Reserva[],
    conversas: Awaited<ReturnType<RepositorioAtendimento["listarConversasComMensagens"]>>,
    precoPorCodigo: Map<string, number>
  ): MetricasCliente360 {
    const reservasCliente = reservas.filter((reserva) => this.mesmoCliente(cliente, reserva.telefoneCliente));
    const conversasCliente = conversas.filter((conversa) => this.mesmoCliente(cliente, conversa.conversa.telefone));
    const mensagens = conversasCliente.flatMap((conversa) => conversa.mensagens);
    const ultimaMensagemEm =
      mensagens.map((mensagem) => mensagem.enviadaEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const ultimaReservaEm =
      reservasCliente.map((reserva) => reserva.atualizadaEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const ultimaInteracaoEm = [cliente.ultimaInteracaoEm, ultimaMensagemEm, ultimaReservaEm]
      .filter((data): data is Date => Boolean(data))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      totalReservas: reservasCliente.length,
      reservasAtivas: reservasCliente.filter((reserva) => estadosReservaAtiva.includes(reserva.estado)).length,
      reservasPagas: reservasCliente.filter((reserva) => reserva.estado === "PAID").length,
      totalCompradoEmKwanza: reservasCliente
        .filter((reserva) => reserva.estado === "PAID")
        .reduce((total, reserva) => total + (precoPorCodigo.get(reserva.codigoPeca) ?? 0), 0),
      totalMensagens: mensagens.length,
      conversasAbertas: conversasCliente.filter((conversa) => conversa.conversa.estado !== "ENCERRADA").length,
      ultimaInteracaoEm
    };
  }

  private mesmoCliente(cliente: Cliente360, telefone: string): boolean {
    return Boolean(cliente.telefone && cliente.telefone === telefone);
  }

  private normalizarTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  private csv(valor: string): string {
    if (!/[",\n]/.test(valor)) return valor;
    return `"${valor.replace(/"/g, "\"\"")}"`;
  }
}
