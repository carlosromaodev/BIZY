import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  RepositorioComentarios,
  RepositorioAutenticacao,
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioClientes,
  RepositorioInstanciasWhatsApp,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioReservas,
  RepositorioSessoesLive
} from "../../dominio/repositorios/contratos.js";
import type {
  AtualizacaoRegistroSessaoLive,
  AtualizacaoCliente360,
  AtualizacaoConversaAtendimento,
  AtualizacaoEntregaPedido,
  AtualizacaoEstadoPedido,
  AtualizarPeca,
  CodigoLoginSms,
  ClienteAtendimento,
  Cliente360,
  ComentarioLive,
  ConfirmacaoPagamentoPedido,
  ConversaAtendimento,
  ConversaAtendimentoComMensagens,
  DadosCriacaoReservaComControleStock,
  DadosCliente360,
  DadosPedidoResolvido,
  EstadoComentario,
  EstadoEntregaPedido,
  EstadoPagamento,
  EstadoPagamentoPedido,
  EstadoPeca,
  EstadoPedido,
  EstadoReserva,
  EventoSistema,
  FiltrosPedidos,
  FiltrosClientes360,
  InstanciaWhatsApp,
  MensagemAtendimento,
  MovimentoStock,
  NovaMensagemAtendimento,
  NovoMovimentoStock,
  NovaPeca,
  NovaReserva,
  NovoRegistroComentario,
  NovoOutboxMensagemWhatsApp,
  NovoRegistroSessaoLive,
  Peca,
  Pedido,
  RegistroOutboxEventoN8n,
  RegistroOutboxMensagemWhatsApp,
  RegistroComentario,
  RegistroSessaoLive,
  Reserva,
  ResumoOutboxEventoN8n,
  ResumoOutboxMensagemWhatsApp,
  ResultadoInterpretacaoComentario,
  DadosIdentidadeAutenticacao,
  DadosNegocioBizy,
  DadosPerfilEstudantil,
  NegocioBizy,
  PerfilEstudantilUsuario,
  UsuarioSistema
} from "../../dominio/tipos.js";
import { normalizarEmail, normalizarTelefone } from "../../dominio/servicos/normalizarContato.js";

const estadosQueBloqueiamStock: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "PAID"];
const estadosAtivosParaDuplicidade: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"];

export class RepositorioPecasPrisma implements RepositorioPecas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaPeca): Promise<Peca> {
    const peca = await this.prisma.peca.create({
      data: {
        codigo: dados.codigo,
        negocioId: dados.negocioId ?? null,
        sku: dados.sku ?? null,
        nome: dados.nome,
        descricao: dados.descricao,
        categoria: dados.categoria ?? null,
        colecao: dados.colecao ?? null,
        precoEmKwanza: dados.precoEmKwanza,
        custoEmKwanza: dados.custoEmKwanza ?? null,
        quantidade: dados.quantidade,
        stockMinimo: dados.stockMinimo ?? 0,
        fotosJson: JSON.stringify(dados.fotos),
        variantesJson: JSON.stringify(dados.variantes ?? {}),
        estado: dados.estado ?? (dados.quantidade > 0 ? "DISPONIVEL" : "ESGOTADA")
      }
    });

    return this.mapearPeca(peca);
  }

  async listar(negocioId?: string | null): Promise<Peca[]> {
    const pecas = await this.prisma.peca.findMany({
      where: negocioId ? { negocioId } : undefined,
      orderBy: { codigo: "asc" }
    });
    return pecas.map((peca) => this.mapearPeca(peca));
  }

  async buscarPorCodigo(codigo: string, negocioId?: string | null): Promise<Peca | null> {
    const peca = await this.prisma.peca.findFirst({
      where: {
        codigo,
        ...(negocioId ? { negocioId } : {})
      },
      orderBy: { criadoEm: "asc" }
    });
    return peca ? this.mapearPeca(peca) : null;
  }

  async atualizar(codigo: string, dados: AtualizarPeca, negocioId?: string | null): Promise<Peca> {
    const atual = await this.buscarPorCodigo(codigo, negocioId);
    if (!atual) {
      throw new Error(`Peça #${codigo} não encontrada.`);
    }

    const peca = await this.prisma.peca.update({
      where: { id: atual.id },
      data: {
        sku: dados.sku,
        nome: dados.nome,
        descricao: dados.descricao,
        categoria: dados.categoria,
        colecao: dados.colecao,
        precoEmKwanza: dados.precoEmKwanza,
        custoEmKwanza: dados.custoEmKwanza,
        quantidade: dados.quantidade,
        stockMinimo: dados.stockMinimo,
        negocioId: dados.negocioId,
        estado: dados.estado,
        arquivadaEm: dados.arquivadaEm,
        fotosJson: dados.fotos ? JSON.stringify(dados.fotos) : undefined,
        variantesJson: dados.variantes ? JSON.stringify(dados.variantes) : undefined
      }
    });

    return this.mapearPeca(peca);
  }

  async atualizarEstado(codigo: string, estado: EstadoPeca, negocioId?: string | null): Promise<Peca> {
    return this.atualizar(codigo, { estado }, negocioId);
  }

  async registrarMovimentoStock(dados: NovoMovimentoStock): Promise<MovimentoStock> {
    const movimento = await this.prisma.movimentoStock.create({
      data: {
        negocioId: dados.negocioId ?? null,
        pecaId: dados.pecaId,
        codigoPeca: dados.codigoPeca,
        tipo: dados.tipo,
        quantidade: dados.quantidade,
        quantidadeAnterior: dados.quantidadeAnterior,
        quantidadeNova: dados.quantidadeNova,
        motivo: dados.motivo ?? null,
        responsavelId: dados.responsavelId ?? null,
        origem: dados.origem ?? null
      }
    });

    return this.mapearMovimentoStock(movimento);
  }

  async listarMovimentosStock(codigoPeca: string, negocioId?: string | null): Promise<MovimentoStock[]> {
    const movimentos = await this.prisma.movimentoStock.findMany({
      where: {
        codigoPeca,
        ...(negocioId ? { negocioId } : {})
      },
      orderBy: { criadoEm: "desc" }
    });

    return movimentos.map((movimento) => this.mapearMovimentoStock(movimento));
  }

  private mapearPeca(peca: {
    id: string;
    codigo: string;
    negocioId: string | null;
    sku: string | null;
    nome: string;
    descricao: string;
    categoria: string | null;
    colecao: string | null;
    precoEmKwanza: number;
    custoEmKwanza: number | null;
    quantidade: number;
    stockMinimo: number;
    fotosJson: string;
    variantesJson: string;
    estado: string;
    arquivadaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Peca {
    const margemEstimadaEmKwanza = this.calcularMargem(peca.precoEmKwanza, peca.custoEmKwanza);
    return {
      ...peca,
      fotos: this.lerFotos(peca.fotosJson),
      variantes: this.lerVariantes(peca.variantesJson),
      estado: peca.estado as EstadoPeca,
      margemEstimadaEmKwanza,
      estadoStock: this.calcularEstadoStock({
        arquivadaEm: peca.arquivadaEm,
        estado: peca.estado as EstadoPeca,
        quantidade: peca.quantidade,
        stockMinimo: peca.stockMinimo
      })
    };
  }

  private mapearMovimentoStock(movimento: {
    id: string;
    negocioId: string | null;
    pecaId: string;
    codigoPeca: string;
    tipo: string;
    quantidade: number;
    quantidadeAnterior: number;
    quantidadeNova: number;
    motivo: string | null;
    responsavelId: string | null;
    origem: string | null;
    criadoEm: Date;
  }): MovimentoStock {
    return {
      ...movimento,
      tipo: movimento.tipo as MovimentoStock["tipo"]
    };
  }

  private lerFotos(valor: string): string[] {
    try {
      const fotos = JSON.parse(valor);
      return Array.isArray(fotos) ? fotos.filter((foto) => typeof foto === "string") : [];
    } catch {
      return [];
    }
  }

  private lerVariantes(valor: string): Record<string, string[]> {
    try {
      const variantes = JSON.parse(valor);
      if (!variantes || typeof variantes !== "object" || Array.isArray(variantes)) return {};

      return Object.fromEntries(
        Object.entries(variantes)
          .filter(([, valores]) => Array.isArray(valores))
          .map(([nome, valores]) => [nome, (valores as unknown[]).filter((valor) => typeof valor === "string")])
      );
    } catch {
      return {};
    }
  }

  private calcularMargem(precoEmKwanza: number, custoEmKwanza: number | null): number | null {
    return custoEmKwanza === null ? null : precoEmKwanza - custoEmKwanza;
  }

  private calcularEstadoStock(peca: {
    arquivadaEm: Date | null;
    estado: EstadoPeca;
    quantidade: number;
    stockMinimo: number;
  }): Peca["estadoStock"] {
    if (peca.arquivadaEm) return "ARQUIVADO";
    if (peca.estado === "ESGOTADA" || peca.quantidade === 0) return "ESGOTADO";
    if (peca.stockMinimo > 0 && peca.quantidade <= peca.stockMinimo) return "BAIXO_STOCK";
    return "DISPONIVEL";
  }
}

export class RepositorioReservasPrisma implements RepositorioReservas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaReserva): Promise<Reserva> {
    const peca = await this.prisma.peca.findFirst({
      where: {
        codigo: dados.codigoPeca,
        ...(dados.negocioId ? { negocioId: dados.negocioId } : {})
      },
      orderBy: { criadoEm: "asc" }
    });

    if (!peca) {
      throw new Error(`Peça #${dados.codigoPeca} não encontrada.`);
    }

    const reserva = await this.prisma.reserva.create({
      data: {
        pecaId: peca.id,
        negocioId: dados.negocioId ?? peca.negocioId ?? null,
        clienteNegocioId: dados.clienteNegocioId ?? null,
        codigoPeca: dados.codigoPeca,
        telefoneCliente: dados.telefoneCliente,
        nomeCliente: dados.nomeCliente,
        usernameCliente: dados.usernameCliente,
        userIdCliente: dados.userIdCliente ?? null,
        avatarUrlCliente: dados.avatarUrlCliente ?? null,
        estado: dados.estado,
        estadoPagamento: dados.estadoPagamento ?? "AGUARDANDO_COMPROVATIVO",
        comentarioOriginal: dados.comentarioOriginal,
        liveId: dados.liveId,
        expiraEm: dados.expiraEm,
        enderecoEntrega: dados.enderecoEntrega ?? null,
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null
      }
    });

    return this.mapearReserva(reserva);
  }

  async criarComControleDeStock(dados: DadosCriacaoReservaComControleStock) {
    return this.executarTransacaoComRetentativas(async () =>
      this.prisma.$transaction(
        async (tx) => {
          const peca = await tx.peca.findFirst({
            where: {
              codigo: dados.codigoPeca,
              ...(dados.negocioId ? { negocioId: dados.negocioId } : {})
            },
            orderBy: { criadoEm: "asc" }
          });

          if (!peca) {
            return {
              tipo: "REVISAO_MANUAL" as const,
              reserva: null,
              motivo: `Peça #${dados.codigoPeca} não encontrada.`
            };
          }

          if (peca.estado === "VENDIDA" || peca.estado === "ESGOTADA") {
            return {
              tipo: "PECA_INDISPONIVEL" as const,
              reserva: null,
              peca: this.mapearPeca(peca),
              motivo: `Peça #${peca.codigo} indisponível.`
            };
          }

          const reservasQueBloqueiamStock = await tx.reserva.count({
            where: {
              negocioId: peca.negocioId,
              codigoPeca: peca.codigo,
              estado: { in: estadosQueBloqueiamStock }
            }
          });
          const temStockLivre = peca.quantidade - reservasQueBloqueiamStock > 0;

          const reserva = await tx.reserva.create({
            data: {
              pecaId: peca.id,
              negocioId: dados.negocioId ?? peca.negocioId ?? null,
              clienteNegocioId: dados.clienteNegocioId ?? null,
              codigoPeca: peca.codigo,
              telefoneCliente: dados.telefoneCliente,
              nomeCliente: dados.nomeCliente,
              usernameCliente: dados.usernameCliente,
              userIdCliente: dados.userIdCliente ?? null,
              avatarUrlCliente: dados.avatarUrlCliente ?? null,
              estado: temStockLivre ? "WAITING_PAYMENT" : "WAITLISTED",
              estadoPagamento: "AGUARDANDO_COMPROVATIVO",
              comentarioOriginal: dados.comentarioOriginal,
              liveId: dados.liveId,
              expiraEm: temStockLivre ? dados.expiraEmReserva : null
            }
          });

          const pecaAtualizada =
            temStockLivre && reservasQueBloqueiamStock + 1 >= peca.quantidade
              ? await tx.peca.update({ where: { id: peca.id }, data: { estado: "RESERVADA" } })
              : peca;

          return {
            tipo: temStockLivre ? "RESERVA_CRIADA" as const : "FILA_ESPERA" as const,
            reserva: this.mapearReserva(reserva),
            peca: this.mapearPeca(pecaAtualizada)
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    ).catch(async (erro) => {
      if (this.ehViolacaoDeUnicidade(erro)) {
        const reservaExistente = await this.buscarReservaAtivaPorTelefoneEPeca(
          dados.telefoneCliente,
          dados.codigoPeca,
          dados.negocioId
        );
        const peca = await this.prisma.peca.findFirst({
          where: {
            codigo: dados.codigoPeca,
            ...(dados.negocioId ? { negocioId: dados.negocioId } : {})
          },
          orderBy: { criadoEm: "asc" }
        });
        return {
          tipo: "DUPLICADA" as const,
          reserva: reservaExistente,
          reservaExistente,
          peca: peca ? this.mapearPeca(peca) : null,
          motivo: "Cliente já possui reserva ativa para esta peça."
        };
      }

      throw erro;
    });
  }

  async listar(negocioId?: string | null): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: negocioId ? { negocioId } : undefined,
      orderBy: { criadaEm: "asc" }
    });
    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      }
    });
    return reserva ? this.mapearReserva(reserva) : null;
  }

  async buscarReservaAtivaPorTelefoneEPeca(
    telefone: string,
    codigoPeca: string,
    negocioId?: string | null
  ): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findFirst({
      where: {
        telefoneCliente: telefone,
        codigoPeca,
        ...(negocioId ? { negocioId } : {}),
        estado: { in: estadosAtivosParaDuplicidade }
      },
      orderBy: { criadaEm: "asc" }
    });

    return reserva ? this.mapearReserva(reserva) : null;
  }

  async contarReservasQueBloqueiamStock(codigoPeca: string, negocioId?: string | null): Promise<number> {
    return this.prisma.reserva.count({
      where: {
        codigoPeca,
        ...(negocioId ? { negocioId } : {}),
        estado: { in: estadosQueBloqueiamStock }
      }
    });
  }

  async listarFilaDaPeca(codigoPeca: string, negocioId?: string | null): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: { codigoPeca, ...(negocioId ? { negocioId } : {}), estado: "WAITLISTED" },
      orderBy: { criadaEm: "asc" }
    });

    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async listarReservasExpiradas(agora: Date): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: {
        estado: { in: ["PENDING", "RESERVED", "WAITING_PAYMENT"] },
        expiraEm: { lte: agora }
      },
      orderBy: { criadaEm: "asc" }
    });

    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async atualizarEstado(id: string, estado: EstadoReserva, expiraEm: Date | null = null): Promise<Reserva> {
    const reserva = await this.prisma.reserva.update({
      where: { id },
      data: { estado, expiraEm }
    });

    return this.mapearReserva(reserva);
  }

  async atualizarEstadoPagamento(
    id: string,
    estadoPagamento: EstadoPagamento,
    comprovativoPagamentoUrl: string | null = null
  ): Promise<Reserva> {
    const reserva = await this.prisma.reserva.update({
      where: { id },
      data: {
        estadoPagamento,
        comprovativoPagamentoUrl: comprovativoPagamentoUrl ?? undefined
      }
    });

    return this.mapearReserva(reserva);
  }

  async atualizarEnderecoEntrega(id: string, enderecoEntrega: string): Promise<Reserva> {
    const reserva = await this.prisma.reserva.update({
      where: { id },
      data: { enderecoEntrega }
    });

    return this.mapearReserva(reserva);
  }

  private mapearReserva(reserva: {
    id: string;
    negocioId: string | null;
    clienteNegocioId: string | null;
    codigoPeca: string;
    telefoneCliente: string;
    nomeCliente: string;
    usernameCliente: string;
    userIdCliente: string | null;
    avatarUrlCliente: string | null;
    estado: string;
    estadoPagamento: string;
    comentarioOriginal: string;
    liveId: string;
    expiraEm: Date | null;
    enderecoEntrega: string | null;
    comprovativoPagamentoUrl: string | null;
    criadaEm: Date;
    atualizadaEm: Date;
  }): Reserva {
    return {
      ...reserva,
      estado: reserva.estado as EstadoReserva,
      estadoPagamento: reserva.estadoPagamento as EstadoPagamento
    };
  }

  private mapearPeca(peca: {
    id: string;
    codigo: string;
    negocioId: string | null;
    sku: string | null;
    nome: string;
    descricao: string;
    categoria: string | null;
    colecao: string | null;
    precoEmKwanza: number;
    custoEmKwanza: number | null;
    quantidade: number;
    stockMinimo: number;
    fotosJson: string;
    variantesJson: string;
    estado: string;
    arquivadaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Peca {
    const margemEstimadaEmKwanza = this.calcularMargem(peca.precoEmKwanza, peca.custoEmKwanza);
    return {
      ...peca,
      fotos: this.lerFotos(peca.fotosJson),
      variantes: this.lerVariantes(peca.variantesJson),
      estado: peca.estado as EstadoPeca,
      margemEstimadaEmKwanza,
      estadoStock: this.calcularEstadoStock({
        arquivadaEm: peca.arquivadaEm,
        estado: peca.estado as EstadoPeca,
        quantidade: peca.quantidade,
        stockMinimo: peca.stockMinimo
      })
    };
  }

  private lerFotos(valor: string): string[] {
    try {
      const fotos = JSON.parse(valor);
      return Array.isArray(fotos) ? fotos.filter((foto) => typeof foto === "string") : [];
    } catch {
      return [];
    }
  }

  private lerVariantes(valor: string): Record<string, string[]> {
    try {
      const variantes = JSON.parse(valor);
      if (!variantes || typeof variantes !== "object" || Array.isArray(variantes)) return {};

      return Object.fromEntries(
        Object.entries(variantes)
          .filter(([, valores]) => Array.isArray(valores))
          .map(([nome, valores]) => [nome, (valores as unknown[]).filter((valor) => typeof valor === "string")])
      );
    } catch {
      return {};
    }
  }

  private calcularMargem(precoEmKwanza: number, custoEmKwanza: number | null): number | null {
    return custoEmKwanza === null ? null : precoEmKwanza - custoEmKwanza;
  }

  private calcularEstadoStock(peca: {
    arquivadaEm: Date | null;
    estado: EstadoPeca;
    quantidade: number;
    stockMinimo: number;
  }): Peca["estadoStock"] {
    if (peca.arquivadaEm) return "ARQUIVADO";
    if (peca.estado === "ESGOTADA" || peca.quantidade === 0) return "ESGOTADO";
    if (peca.stockMinimo > 0 && peca.quantidade <= peca.stockMinimo) return "BAIXO_STOCK";
    return "DISPONIVEL";
  }

  private async executarTransacaoComRetentativas<T>(operacao: () => Promise<T>, tentativa = 1): Promise<T> {
    try {
      return await operacao();
    } catch (erro) {
      const maxTentativas = Number(process.env.PRISMA_TRANSACAO_MAX_TENTATIVAS ?? 8);
      if (this.ehConflitoDeTransacao(erro) && tentativa < maxTentativas) {
        await new Promise((resolver) => setTimeout(resolver, tentativa * 50));
        return this.executarTransacaoComRetentativas(operacao, tentativa + 1);
      }

      throw erro;
    }
  }

  private ehConflitoDeTransacao(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034";
  }

  private ehViolacaoDeUnicidade(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
  }
}

type PedidoPrismaComItens = Prisma.PedidoGetPayload<{ include: { itens: true } }>;

export class RepositorioPedidosPrisma implements RepositorioPedidos {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: DadosPedidoResolvido): Promise<Pedido> {
    const pedido = await this.criarComRetentativa(dados);
    return this.mapearPedido(pedido);
  }

  async listar(negocioId: string, filtros: FiltrosPedidos = {}): Promise<Pedido[]> {
    const busca = filtros.busca?.trim();
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        negocioId,
        ...(filtros.estado ? { estado: filtros.estado } : {}),
        ...(filtros.estadoPagamento ? { estadoPagamento: filtros.estadoPagamento } : {}),
        ...(filtros.estadoEntrega ? { estadoEntrega: filtros.estadoEntrega } : {}),
        ...(filtros.clienteId ? { clienteNegocioId: filtros.clienteId } : {}),
        ...(busca
          ? {
              OR: [
                Number.isNaN(Number(busca)) ? undefined : { numero: Number(busca) },
                { canal: { contains: busca, mode: "insensitive" } },
                { origem: { contains: busca, mode: "insensitive" } },
                { observacao: { contains: busca, mode: "insensitive" } },
                {
                  itens: {
                    some: {
                      OR: [
                        { codigoPeca: { contains: busca, mode: "insensitive" } },
                        { nomeProduto: { contains: busca, mode: "insensitive" } }
                      ]
                    }
                  }
                }
              ].filter(Boolean) as Prisma.PedidoWhereInput[]
            }
          : {})
      },
      include: { itens: true },
      orderBy: { criadoEm: "desc" },
      take: filtros.limite ?? 100
    });

    return pedidos.map((pedido) => this.mapearPedido(pedido));
  }

  async buscarPorId(id: string, negocioId: string): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findFirst({
      where: { id, negocioId },
      include: { itens: true }
    });
    return pedido ? this.mapearPedido(pedido) : null;
  }

  async atualizarEstado(id: string, negocioId: string, dados: AtualizacaoEstadoPedido): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: dados.estado,
        observacao: dados.observacao ?? undefined,
        responsavelId: dados.responsavelId ?? undefined,
        canceladoEm: dados.estado === "CANCELADO" ? new Date() : undefined
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async confirmarPagamento(
    id: string,
    negocioId: string,
    dados: ConfirmacaoPagamentoPedido
  ): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: "PAGO",
        estadoPagamento: "CONFIRMADO",
        comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? undefined,
        observacao: dados.observacao ?? undefined,
        pagoEm: new Date()
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  async atualizarEntrega(id: string, negocioId: string, dados: AtualizacaoEntregaPedido): Promise<Pedido | null> {
    const existente = await this.buscarPorId(id, negocioId);
    if (!existente) return null;

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        estado: dados.estadoEntrega === "ENTREGUE" ? "ENTREGUE" : undefined,
        estadoEntrega: dados.estadoEntrega,
        observacao: dados.observacao ?? undefined,
        responsavelId: dados.responsavelId ?? undefined,
        entregueEm: dados.estadoEntrega === "ENTREGUE" ? new Date() : undefined
      },
      include: { itens: true }
    });

    return this.mapearPedido(pedido);
  }

  private async criarComRetentativa(dados: DadosPedidoResolvido, tentativa = 1): Promise<PedidoPrismaComItens> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const ultimo = await tx.pedido.findFirst({
          where: { negocioId: dados.negocioId },
          orderBy: { numero: "desc" },
          select: { numero: true }
        });
        const numero = dados.numero ?? (ultimo?.numero ?? 0) + 1;

        return tx.pedido.create({
          data: {
            negocioId: dados.negocioId,
            clienteNegocioId: dados.clienteNegocioId,
            reservaId: dados.reservaId ?? null,
            numero,
            estado: dados.estado ?? "AGUARDANDO_PAGAMENTO",
            estadoPagamento: dados.estadoPagamento ?? "PENDENTE",
            estadoEntrega: dados.estadoEntrega ?? "PENDENTE",
            origem: dados.origem ?? "manual",
            canal: dados.canal ?? "whatsapp",
            subtotalEmKwanza: dados.subtotalEmKwanza,
            descontoEmKwanza: dados.descontoEmKwanza,
            taxaEntregaEmKwanza: dados.taxaEntregaEmKwanza,
            totalEmKwanza: dados.totalEmKwanza,
            motivoDesconto: dados.motivoDesconto ?? null,
            enderecoEntrega: dados.enderecoEntrega ?? null,
            comprovativoPagamentoUrl: dados.comprovativoPagamentoUrl ?? null,
            observacao: dados.observacao ?? null,
            responsavelId: dados.responsavelId ?? null,
            itens: {
              create: dados.itens.map((item) => ({
                pecaId: item.pecaId,
                codigoPeca: item.codigoPeca,
                nomeProduto: item.nomeProduto,
                quantidade: item.quantidade,
                precoUnitarioEmKwanza: item.precoUnitarioEmKwanza,
                subtotalEmKwanza: item.subtotalEmKwanza
              }))
            }
          },
          include: { itens: true }
        });
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002" &&
        tentativa < Number(process.env.PRISMA_TRANSACAO_MAX_TENTATIVAS ?? 8)
      ) {
        await new Promise((resolver) => setTimeout(resolver, tentativa * 40));
        return this.criarComRetentativa(dados, tentativa + 1);
      }
      throw erro;
    }
  }

  private mapearPedido(pedido: PedidoPrismaComItens): Pedido {
    return {
      ...pedido,
      estado: pedido.estado as EstadoPedido,
      estadoPagamento: pedido.estadoPagamento as EstadoPagamentoPedido,
      estadoEntrega: pedido.estadoEntrega as EstadoEntregaPedido,
      itens: pedido.itens.map((item) => ({ ...item }))
    };
  }
}

export class RepositorioComentariosPrisma implements RepositorioComentarios {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoRegistroComentario): Promise<RegistroComentario> {
    const comentario = await this.prisma.comentarioRecebido.create({
      data: {
        negocioId: dados.negocioId ?? null,
        ...this.mapearComentarioParaBanco(dados.comentario),
        ...this.mapearInterpretacaoParaBanco(dados.interpretacao),
        estado: dados.estado,
        motivo: dados.motivo ?? null
      }
    });

    return this.mapearRegistroComentario(comentario);
  }

  async listar(limite = 100, negocioId?: string | null): Promise<RegistroComentario[]> {
    const comentarios = await this.prisma.comentarioRecebido.findMany({
      where: negocioId ? { negocioId } : undefined,
      take: limite,
      orderBy: { criadoEm: "desc" }
    });

    return comentarios.map((comentario) => this.mapearRegistroComentario(comentario));
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<RegistroComentario | null> {
    const comentario = await this.prisma.comentarioRecebido.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      }
    });
    return comentario ? this.mapearRegistroComentario(comentario) : null;
  }

  async atualizarEstado(
    id: string,
    estado: EstadoComentario,
    motivo: string | null = null,
    interpretacao?: ResultadoInterpretacaoComentario | null
  ): Promise<RegistroComentario> {
    const comentario = await this.prisma.comentarioRecebido.update({
      where: { id },
      data: {
        estado,
        motivo,
        ...(interpretacao === undefined ? {} : this.mapearInterpretacaoParaBanco(interpretacao))
      }
    });

    return this.mapearRegistroComentario(comentario);
  }

  async limparTodos(): Promise<number> {
    const resultado = await this.prisma.comentarioRecebido.deleteMany({});
    return resultado.count;
  }

  private mapearComentarioParaBanco(comentario: ComentarioLive) {
    return {
      source: comentario.source,
      provider: comentario.provider,
      liveId: comentario.liveId,
      username: comentario.username,
      userId: comentario.userId ?? null,
      displayName: comentario.displayName,
      avatarUrl: comentario.avatarUrl ?? null,
      commentText: comentario.commentText,
      timestamp: comentario.timestamp
    };
  }

  private mapearInterpretacaoParaBanco(interpretacao: ResultadoInterpretacaoComentario | null) {
    return {
      intent: interpretacao?.intent ?? null,
      phone: interpretacao?.phone ?? null,
      productCode: interpretacao?.productCode ?? null,
      confidence: interpretacao?.confidence ?? null,
      requiresManualReview: interpretacao?.requiresManualReview ?? null
    };
  }

  private mapearRegistroComentario(comentario: {
    id: string;
    negocioId: string | null;
    source: string;
    provider: string;
    liveId: string;
    username: string;
    userId: string | null;
    displayName: string;
    avatarUrl: string | null;
    commentText: string;
    timestamp: Date;
    intent: string | null;
    phone: string | null;
    productCode: string | null;
    confidence: number | null;
    requiresManualReview: boolean | null;
    estado: string;
    motivo: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RegistroComentario {
    const interpretacao =
      comentario.intent && comentario.confidence !== null && comentario.requiresManualReview !== null
        ? {
            intent: comentario.intent as "BUY" | "NONE",
            phone: comentario.phone,
            productCode: comentario.productCode,
            productCodes: comentario.productCode ? [comentario.productCode] : [],
            confidence: comentario.confidence,
            requiresManualReview: comentario.requiresManualReview,
            reasons: comentario.motivo ? [comentario.motivo] : []
          }
        : null;

    return {
      id: comentario.id,
      negocioId: comentario.negocioId,
      comentario: {
        source: comentario.source as ComentarioLive["source"],
        provider: comentario.provider,
        liveId: comentario.liveId,
        username: comentario.username,
        userId: comentario.userId,
        displayName: comentario.displayName,
        avatarUrl: comentario.avatarUrl,
        commentText: comentario.commentText,
        timestamp: comentario.timestamp
      },
      interpretacao,
      estado: comentario.estado as EstadoComentario,
      motivo: comentario.motivo,
      criadoEm: comentario.criadoEm,
      atualizadoEm: comentario.atualizadoEm
    };
  }
}

export class RepositorioAutenticacaoPrisma implements RepositorioAutenticacao {
  constructor(private readonly prisma: PrismaClient) {}

  async criarOuAtualizarUsuario(dados: {
    telefone: string;
    nome: string;
    email?: string | null;
    avatarUrl?: string | null;
    origemCadastro?: string;
  }) {
    return this.prisma.usuarioSistema.upsert({
      where: { telefone: dados.telefone },
      create: {
        telefone: dados.telefone,
        nome: dados.nome,
        email: dados.email ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        papel: "VENDEDOR",
        origemCadastro: dados.origemCadastro ?? "TELEFONE"
      },
      update: {
        nome: dados.nome,
        email: dados.email ?? undefined,
        avatarUrl: dados.avatarUrl ?? undefined,
        origemCadastro: dados.origemCadastro ?? undefined
      }
    });
  }

  async buscarUsuarioPorTelefone(telefone: string) {
    return this.prisma.usuarioSistema.findUnique({ where: { telefone } });
  }

  async buscarUsuarioPorId(id: string): Promise<UsuarioSistema | null> {
    return this.prisma.usuarioSistema.findUnique({ where: { id } });
  }

  async criarOuAtualizarUsuarioPorIdentidade(dados: DadosIdentidadeAutenticacao): Promise<UsuarioSistema> {
    return this.prisma.$transaction(async (tx) => {
      const identidade = await tx.identidadeAutenticacao.findUnique({
        where: {
          tipo_provider_providerUserId: {
            tipo: dados.tipo,
            provider: dados.provider,
            providerUserId: dados.providerUserId
          }
        }
      });

      if (identidade) {
        const usuario = await tx.usuarioSistema.update({
          where: { id: identidade.usuarioId },
          data: {
            nome: dados.nome,
            telefone: dados.telefone ?? undefined,
            email: dados.email ?? undefined,
            avatarUrl: dados.avatarUrl ?? undefined,
            origemCadastro: dados.origemCadastro
          }
        });

        await tx.identidadeAutenticacao.update({
          where: { id: identidade.id },
          data: {
            email: dados.email ?? null,
            telefone: dados.telefone ?? null,
            dadosJson: JSON.stringify(dados.dados ?? {})
          }
        });

        return usuario;
      }

      const usuarioExistente =
        (dados.telefone ? await tx.usuarioSistema.findUnique({ where: { telefone: dados.telefone } }) : null) ??
        (dados.email ? await tx.usuarioSistema.findUnique({ where: { email: dados.email } }) : null);

      const usuario = usuarioExistente
        ? await tx.usuarioSistema.update({
            where: { id: usuarioExistente.id },
            data: {
              nome: dados.nome,
              telefone: dados.telefone ?? usuarioExistente.telefone,
              email: dados.email ?? usuarioExistente.email,
              avatarUrl: dados.avatarUrl ?? usuarioExistente.avatarUrl,
              origemCadastro: dados.origemCadastro
            }
          })
        : await tx.usuarioSistema.create({
            data: {
              nome: dados.nome,
              telefone: dados.telefone ?? null,
              email: dados.email ?? null,
              avatarUrl: dados.avatarUrl ?? null,
              papel: "VENDEDOR",
              origemCadastro: dados.origemCadastro
            }
          });

      await tx.identidadeAutenticacao.create({
        data: {
          usuarioId: usuario.id,
          tipo: dados.tipo,
          provider: dados.provider,
          providerUserId: dados.providerUserId,
          email: dados.email ?? null,
          telefone: dados.telefone ?? null,
          dadosJson: JSON.stringify(dados.dados ?? {})
        }
      });

      return usuario;
    });
  }

  async salvarPerfilEstudantil(dados: DadosPerfilEstudantil): Promise<PerfilEstudantilUsuario> {
    const perfil = await this.prisma.perfilEstudantilUsuario.upsert({
      where: {
        institutionCode_studentNumber: {
          institutionCode: dados.institutionCode,
          studentNumber: dados.studentNumber
        }
      },
      create: {
        usuarioId: dados.usuarioId,
        institutionCode: dados.institutionCode,
        studentNumber: dados.studentNumber,
        username: dados.username ?? null,
        nome: dados.nome,
        email: dados.email ?? null,
        telefone: dados.telefone ?? null,
        curso: dados.curso ?? null,
        turma: dados.turma ?? null,
        anoAcademico: dados.anoAcademico ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        dadosJson: JSON.stringify(dados.dados ?? {})
      },
      update: {
        usuarioId: dados.usuarioId,
        username: dados.username ?? null,
        nome: dados.nome,
        email: dados.email ?? null,
        telefone: dados.telefone ?? null,
        curso: dados.curso ?? null,
        turma: dados.turma ?? null,
        anoAcademico: dados.anoAcademico ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        dadosJson: JSON.stringify(dados.dados ?? {}),
        sincronizadoEm: new Date()
      }
    });

    return {
      ...perfil,
      dados: this.lerObjeto(perfil.dadosJson)
    };
  }

  async buscarNegocioPrincipalPorUsuario(usuarioId: string): Promise<NegocioBizy | null> {
    const membro = await this.prisma.membroNegocio.findFirst({
      where: { usuarioId },
      include: { negocio: true },
      orderBy: { criadoEm: "asc" }
    });

    return membro ? this.mapearNegocio(membro.negocio, membro.papel) : null;
  }

  async salvarNegocioUsuario(usuarioId: string, dados: DadosNegocioBizy): Promise<NegocioBizy> {
    const atual = await this.prisma.membroNegocio.findFirst({
      where: { usuarioId },
      include: { negocio: true },
      orderBy: { criadoEm: "asc" }
    });
    const data = {
      nomeComercial: dados.nomeComercial,
      segmento: dados.segmento,
      tipo: dados.tipo,
      nif: dados.nif ?? null,
      telefone: dados.telefone ?? null,
      whatsapp: dados.whatsapp ?? null,
      email: dados.email ?? null,
      instagram: dados.instagram ?? null,
      tiktok: dados.tiktok ?? null,
      provincia: dados.provincia ?? null,
      municipio: dados.municipio ?? null,
      endereco: dados.endereco ?? null,
      moeda: dados.moeda ?? "AOA",
      fusoHorario: dados.fusoHorario ?? "Africa/Luanda",
      canaisVendaJson: JSON.stringify(dados.canaisVenda ?? []),
      metodosPagamentoJson: JSON.stringify(dados.metodosPagamento ?? []),
      entregaJson: JSON.stringify(dados.entrega ?? {}),
      minutosReservaPadrao: dados.minutosReservaPadrao ?? 10
    };

    if (atual) {
      const negocio = await this.prisma.negocio.update({
        where: { id: atual.negocioId },
        data
      });
      return this.mapearNegocio(negocio, atual.papel);
    }

    const negocio = await this.prisma.negocio.create({
      data: {
        ...data,
        membros: {
          create: {
            usuarioId,
            papel: "DONO"
          }
        }
      }
    });

    return this.mapearNegocio(negocio, "DONO");
  }

  async listarModulosAtivosPorNegocio(negocioId: string): Promise<string[]> {
    const modulos = await this.prisma.moduloNegocio.findMany({
      where: {
        negocioId,
        ativo: true
      },
      orderBy: {
        modulo: "asc"
      },
      select: {
        modulo: true
      }
    });

    return modulos.map((modulo) => modulo.modulo);
  }

  async marcarUsuarioOnboardingCompleto(usuarioId: string, data: Date): Promise<UsuarioSistema> {
    return this.prisma.usuarioSistema.update({
      where: { id: usuarioId },
      data: { perfilCompletoEm: data }
    });
  }

  async criarCodigoSms(dados: {
    telefone: string;
    codigoHash: string;
    codigoFinal: string;
    expiraEm: Date;
    statusEnvio: string;
    provider: string;
    providerMessageId?: string | null;
    providerResponseJson?: string | null;
    usuarioId?: string | null;
  }): Promise<CodigoLoginSms> {
    return this.prisma.codigoLoginSms.create({
      data: {
        telefone: dados.telefone,
        codigoHash: dados.codigoHash,
        codigoFinal: dados.codigoFinal,
        expiraEm: dados.expiraEm,
        statusEnvio: dados.statusEnvio,
        provider: dados.provider,
        providerMessageId: dados.providerMessageId ?? null,
        providerResponseJson: dados.providerResponseJson ?? null,
        usuarioId: dados.usuarioId ?? null
      }
    });
  }

  async buscarCodigoSmsValido(telefone: string, agora: Date): Promise<CodigoLoginSms | null> {
    return this.prisma.codigoLoginSms.findFirst({
      where: {
        telefone,
        usadoEm: null,
        expiraEm: { gt: agora },
        statusEnvio: { in: ["SENT", "DEV"] }
      },
      orderBy: { criadoEm: "desc" }
    });
  }

  async marcarCodigoUsado(id: string, usadoEm: Date): Promise<CodigoLoginSms> {
    return this.prisma.codigoLoginSms.update({ where: { id }, data: { usadoEm } });
  }

  async incrementarTentativasCodigo(id: string): Promise<CodigoLoginSms> {
    return this.prisma.codigoLoginSms.update({ where: { id }, data: { tentativas: { increment: 1 } } });
  }

  async revogarCodigosAbertos(telefone: string, agora: Date): Promise<void> {
    await this.prisma.codigoLoginSms.updateMany({
      where: {
        telefone,
        usadoEm: null,
        expiraEm: { gt: agora }
      },
      data: {
        usadoEm: agora,
        statusEnvio: "REVOKED"
      }
    });
  }

  async limparCodigosSms(): Promise<number> {
    const resultado = await this.prisma.codigoLoginSms.deleteMany({});
    return resultado.count;
  }

  async criarSessao(dados: { tokenHash: string; usuarioId: string; expiraEm: Date }): Promise<void> {
    await this.prisma.sessaoUsuario.create({
      data: {
        tokenHash: dados.tokenHash,
        usuarioId: dados.usuarioId,
        expiraEm: dados.expiraEm
      }
    });
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    return this.prisma.sessaoUsuario.findFirst({
      where: {
        tokenHash,
        expiraEm: { gt: agora }
      },
      select: {
        id: true,
        usuario: true
      }
    });
  }

  async tocarSessao(id: string, agora: Date): Promise<void> {
    await this.prisma.sessaoUsuario.update({ where: { id }, data: { ultimoUsoEm: agora } });
  }

  async encerrarSessao(tokenHash: string): Promise<void> {
    await this.prisma.sessaoUsuario.deleteMany({ where: { tokenHash } });
  }

  private mapearNegocio(
    negocio: {
      id: string;
      nomeComercial: string;
      segmento: string;
      tipo: string;
      nif: string | null;
      telefone: string | null;
      whatsapp: string | null;
      email: string | null;
      instagram: string | null;
      tiktok: string | null;
      provincia: string | null;
      municipio: string | null;
      endereco: string | null;
      moeda: string;
      fusoHorario: string;
      canaisVendaJson: string;
      metodosPagamentoJson: string;
      entregaJson: string;
      minutosReservaPadrao: number;
      criadoEm: Date;
      atualizadoEm: Date;
    },
    usuarioPapel?: string
  ): NegocioBizy {
    return {
      id: negocio.id,
      nomeComercial: negocio.nomeComercial,
      segmento: negocio.segmento,
      tipo: negocio.tipo,
      nif: negocio.nif,
      telefone: negocio.telefone,
      whatsapp: negocio.whatsapp,
      email: negocio.email,
      instagram: negocio.instagram,
      tiktok: negocio.tiktok,
      provincia: negocio.provincia,
      municipio: negocio.municipio,
      endereco: negocio.endereco,
      moeda: negocio.moeda,
      fusoHorario: negocio.fusoHorario,
      canaisVenda: this.lerArray(negocio.canaisVendaJson),
      metodosPagamento: this.lerArray(negocio.metodosPagamentoJson),
      entrega: this.lerObjeto(negocio.entregaJson),
      minutosReservaPadrao: negocio.minutosReservaPadrao,
      usuarioPapel,
      criadoEm: negocio.criadoEm,
      atualizadoEm: negocio.atualizadoEm
    };
  }

  private lerArray(valor: string): string[] {
    try {
      const dados = JSON.parse(valor);
      return Array.isArray(dados) ? dados.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}

export class RepositorioInstanciasWhatsAppPrisma implements RepositorioInstanciasWhatsApp {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: {
    negocioId?: string | null;
    nome: string;
    etiqueta?: string | null;
    telefone?: string | null;
    baseUrl?: string | null;
    apiKey?: string | null;
    padrao?: boolean;
  }): Promise<InstanciaWhatsApp> {
    const negocioId = dados.negocioId ?? null;

    if (dados.padrao) {
      await this.prisma.instanciaWhatsApp.updateMany({
        where: { negocioId, padrao: true },
        data: { padrao: false }
      });
    }

    return this.prisma.instanciaWhatsApp.create({
      data: {
        negocioId,
        nome: dados.nome,
        etiqueta: dados.etiqueta ?? null,
        telefone: dados.telefone ?? null,
        baseUrl: dados.baseUrl ?? null,
        apiKey: dados.apiKey ?? null,
        padrao: dados.padrao ?? false,
        status: "CRIADA"
      }
    });
  }

  async listarAtivas(negocioId?: string | null): Promise<InstanciaWhatsApp[]> {
    return this.prisma.instanciaWhatsApp.findMany({
      where: { ativa: true, ...this.filtroNegocio(negocioId) },
      orderBy: [{ padrao: "desc" }, { atualizadaEm: "desc" }]
    });
  }

  async buscarPorId(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp | null> {
    return this.prisma.instanciaWhatsApp.findFirst({
      where: { id, ...this.filtroNegocio(negocioId) }
    });
  }

  async buscarPadrao(negocioId?: string | null): Promise<InstanciaWhatsApp | null> {
    return this.prisma.instanciaWhatsApp.findFirst({
      where: { ativa: true, padrao: true, ...this.filtroNegocio(negocioId) },
      orderBy: { atualizadaEm: "desc" }
    });
  }

  async atualizar(
    id: string,
    dados: Partial<Pick<
      InstanciaWhatsApp,
      "etiqueta" | "telefone" | "status" | "qrCode" | "pairingCode" | "baseUrl" | "apiKey" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaConsultaEm"
    >>,
    negocioId?: string | null
  ): Promise<InstanciaWhatsApp> {
    const instancia = await this.exigirInstancia(id, negocioId);

    if (dados.padrao) {
      await this.prisma.instanciaWhatsApp.updateMany({
        where: { negocioId: instancia.negocioId, padrao: true, id: { not: id } },
        data: { padrao: false }
      });
    }

    return this.prisma.instanciaWhatsApp.update({
      where: { id },
      data: dados
    });
  }

  async definirPadrao(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    const instancia = await this.exigirInstancia(id, negocioId);
    await this.prisma.instanciaWhatsApp.updateMany({
      where: { negocioId: instancia.negocioId, padrao: true, id: { not: id } },
      data: { padrao: false }
    });
    return this.prisma.instanciaWhatsApp.update({ where: { id }, data: { padrao: true, ativa: true } });
  }

  async desativar(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    await this.exigirInstancia(id, negocioId);
    return this.prisma.instanciaWhatsApp.update({
      where: { id },
      data: { ativa: false, padrao: false }
    });
  }

  private filtroNegocio(negocioId?: string | null): Prisma.InstanciaWhatsAppWhereInput {
    return negocioId === undefined ? {} : { negocioId: negocioId ?? null };
  }

  private async exigirInstancia(id: string, negocioId?: string | null): Promise<InstanciaWhatsApp> {
    const instancia = await this.buscarPorId(id, negocioId);
    if (!instancia) throw new Error(`Instância ${id} não encontrada.`);
    return instancia;
  }
}

export class RepositorioSessoesLivePrisma implements RepositorioSessoesLive {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(dados: NovoRegistroSessaoLive): Promise<RegistroSessaoLive> {
    const sessao = await this.prisma.sessaoLive.upsert({
      where: { id: dados.id },
      create: {
        id: dados.id,
        username: dados.username,
        providerNome: dados.providerNome,
        status: dados.status,
        ativa: dados.ativa ?? true,
        iniciadaEm: dados.iniciadaEm,
        encerradaEm: dados.encerradaEm ?? null,
        comentariosRecebidos: dados.comentariosRecebidos ?? 0,
        comentariosProcessados: dados.comentariosProcessados ?? 0,
        comentariosComErro: dados.comentariosComErro ?? 0,
        ultimoComentarioEm: dados.ultimoComentarioEm ?? null,
        ultimoErro: dados.ultimoErro ?? null
      },
      update: {
        username: dados.username,
        providerNome: dados.providerNome,
        status: dados.status,
        ativa: dados.ativa ?? true,
        iniciadaEm: dados.iniciadaEm,
        encerradaEm: dados.encerradaEm ?? null,
        comentariosRecebidos: dados.comentariosRecebidos ?? 0,
        comentariosProcessados: dados.comentariosProcessados ?? 0,
        comentariosComErro: dados.comentariosComErro ?? 0,
        ultimoComentarioEm: dados.ultimoComentarioEm ?? null,
        ultimoErro: dados.ultimoErro ?? null
      }
    });

    return this.mapearSessaoLive(sessao);
  }

  async listarAtivas(): Promise<RegistroSessaoLive[]> {
    const sessoes = await this.prisma.sessaoLive.findMany({
      where: { ativa: true },
      orderBy: { atualizadaEm: "desc" }
    });

    return sessoes.map((sessao) => this.mapearSessaoLive(sessao));
  }

  async buscarPorId(id: string): Promise<RegistroSessaoLive | null> {
    const sessao = await this.prisma.sessaoLive.findUnique({ where: { id } });
    return sessao ? this.mapearSessaoLive(sessao) : null;
  }

  async atualizar(id: string, dados: AtualizacaoRegistroSessaoLive): Promise<RegistroSessaoLive> {
    const sessao = await this.prisma.sessaoLive.update({
      where: { id },
      data: dados
    });

    return this.mapearSessaoLive(sessao);
  }

  async encerrar(id: string, encerradaEm = new Date()): Promise<RegistroSessaoLive> {
    return this.atualizar(id, { ativa: false, status: "ENCERRADA", encerradaEm });
  }

  private mapearSessaoLive(sessao: {
    id: string;
    username: string;
    providerNome: string;
    status: string;
    ativa: boolean;
    iniciadaEm: Date;
    encerradaEm: Date | null;
    comentariosRecebidos: number;
    comentariosProcessados: number;
    comentariosComErro: number;
    ultimoComentarioEm: Date | null;
    ultimoErro: string | null;
    criadaEm: Date;
    atualizadaEm: Date;
  }): RegistroSessaoLive {
    return {
      ...sessao,
      status: sessao.status as RegistroSessaoLive["status"]
    };
  }
}

export class RepositorioClientesPrisma implements RepositorioClientes {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(dados: DadosCliente360): Promise<Cliente360> {
    const contato = this.normalizarContatoObrigatorio(dados.telefone, dados.email);
    const agora = new Date();
    const clienteGlobal = await this.obterOuCriarClienteGlobal(dados, contato);
    const existente = await this.buscarExistentePorContato(dados.negocioId, clienteGlobal.id, contato.telefoneLocal);

    if (existente) {
      const atualizado = await this.prisma.clienteNegocio.update({
        where: { id: existente.id },
        data: {
          telefone: contato.telefoneLocal ?? existente.telefone,
          email: contato.email ?? existente.email,
          nome: dados.nome ?? existente.nome,
          username: dados.username ?? existente.username,
          userId: dados.userId ?? existente.userId,
          avatarUrl: dados.avatarUrl ?? existente.avatarUrl,
          origem: existente.origem ?? dados.origem ?? null,
          tagsJson: dados.tags ? this.serializar(this.unirTags(this.lerLista(existente.tagsJson), dados.tags)) : undefined,
          preferenciasJson: dados.preferencias
            ? this.serializar({ ...this.parseJson(existente.preferenciasJson), ...dados.preferencias })
            : undefined,
          consentimentoMarketing: dados.consentimentoMarketing ?? existente.consentimentoMarketing,
          consentimentoDados: dados.consentimentoDados ?? existente.consentimentoDados,
          estadoRelacionamento: dados.estadoRelacionamento ?? existente.estadoRelacionamento,
          ultimaInteracaoEm: dados.ultimaInteracaoEm ?? existente.ultimaInteracaoEm
        }
      });
      return this.mapearCliente(atualizado);
    }

    const cliente = await this.prisma.clienteNegocio.create({
      data: {
        negocioId: dados.negocioId,
        clienteGlobalId: clienteGlobal.id,
        telefone: contato.telefoneLocal,
        email: contato.email,
        nome: dados.nome ?? null,
        username: dados.username ?? null,
        userId: dados.userId ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        origem: dados.origem ?? null,
        tagsJson: this.serializar(this.normalizarTags(dados.tags ?? [])),
        preferenciasJson: this.serializar(dados.preferencias ?? {}),
        consentimentoMarketing: dados.consentimentoMarketing ?? false,
        consentimentoDados: dados.consentimentoDados ?? false,
        estadoRelacionamento: dados.estadoRelacionamento ?? "ATIVO",
        primeiraInteracaoEm: dados.ultimaInteracaoEm ?? agora,
        ultimaInteracaoEm: dados.ultimaInteracaoEm ?? agora
      }
    });

    return this.mapearCliente(cliente);
  }

  async sincronizar(dados: DadosCliente360): Promise<Cliente360 | null> {
    if (!normalizarTelefone(dados.telefone) && !normalizarEmail(dados.email)) return null;
    return this.salvar(dados);
  }

  async listar(negocioId: string, filtros: FiltrosClientes360 = {}): Promise<Cliente360[]> {
    const busca = filtros.busca?.trim();
    const where: Prisma.ClienteNegocioWhereInput = {
      negocioId,
      ...(filtros.estadoRelacionamento ? { estadoRelacionamento: filtros.estadoRelacionamento } : {}),
      ...(busca
        ? {
            OR: [
              { telefone: { contains: busca, mode: "insensitive" } },
              { email: { contains: busca, mode: "insensitive" } },
              { nome: { contains: busca, mode: "insensitive" } },
              { username: { contains: busca, mode: "insensitive" } },
              { userId: { contains: busca, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const clientes = await this.prisma.clienteNegocio.findMany({
      where,
      orderBy: { ultimaInteracaoEm: "desc" },
      take: filtros.limite ?? 100
    });
    const tag = filtros.tag?.trim().toLowerCase();

    return clientes
      .map((cliente) => this.mapearCliente(cliente))
      .filter((cliente) => !tag || cliente.tags.some((item) => item.toLowerCase() === tag));
  }

  async buscarPorId(id: string, negocioId: string): Promise<Cliente360 | null> {
    const cliente = await this.prisma.clienteNegocio.findFirst({ where: { id, negocioId } });
    return cliente ? this.mapearCliente(cliente) : null;
  }

  async atualizar(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360 | null> {
    const existente = await this.prisma.clienteNegocio.findFirst({ where: { id, negocioId } });
    if (!existente) return null;

    const telefone = dados.telefone === undefined ? existente.telefone : normalizarTelefone(dados.telefone)?.local ?? null;
    const email = dados.email === undefined ? existente.email : normalizarEmail(dados.email);
    if (!telefone && !email) {
      throw new Error("Cliente precisa manter telefone ou email.");
    }

    const atualizado = await this.prisma.clienteNegocio.update({
      where: { id: existente.id },
      data: {
        telefone,
        email,
        nome: dados.nome === undefined ? existente.nome : dados.nome,
        username: dados.username === undefined ? existente.username : dados.username,
        userId: dados.userId === undefined ? existente.userId : dados.userId,
        avatarUrl: dados.avatarUrl === undefined ? existente.avatarUrl : dados.avatarUrl,
        origem: dados.origem === undefined ? existente.origem : dados.origem,
        tagsJson: dados.tags === undefined ? existente.tagsJson : this.serializar(this.normalizarTags(dados.tags)),
        preferenciasJson:
          dados.preferencias === undefined ? existente.preferenciasJson : this.serializar(dados.preferencias),
        consentimentoMarketing: dados.consentimentoMarketing ?? existente.consentimentoMarketing,
        consentimentoDados: dados.consentimentoDados ?? existente.consentimentoDados,
        estadoRelacionamento: dados.estadoRelacionamento ?? existente.estadoRelacionamento
      }
    });

    return this.mapearCliente(atualizado);
  }

  private async obterOuCriarClienteGlobal(
    dados: DadosCliente360,
    contato: { telefoneCanonico: string | null; email: string | null }
  ) {
    const whereOr = [
      contato.telefoneCanonico ? { telefoneCanonico: contato.telefoneCanonico } : null,
      contato.email ? { emailCanonico: contato.email } : null
    ].filter(Boolean) as Prisma.ClienteGlobalWhereInput[];

    const existente = whereOr.length
      ? await this.prisma.clienteGlobal.findFirst({ where: { OR: whereOr } })
      : null;

    if (existente) {
      return this.prisma.clienteGlobal.update({
        where: { id: existente.id },
        data: {
          nomePreferido: dados.nome ?? existente.nomePreferido,
          avatarUrl: dados.avatarUrl ?? existente.avatarUrl
        }
      });
    }

    return this.prisma.clienteGlobal.create({
      data: {
        telefoneCanonico: contato.telefoneCanonico,
        emailCanonico: contato.email,
        nomePreferido: dados.nome ?? null,
        avatarUrl: dados.avatarUrl ?? null,
        origemPrimeira: dados.origem ?? null,
        dadosJson: "{}"
      }
    });
  }

  private async buscarExistentePorContato(
    negocioId: string,
    clienteGlobalId: string,
    telefone: string | null
  ) {
    return this.prisma.clienteNegocio.findFirst({
      where: {
        negocioId,
        OR: [
          { clienteGlobalId },
          ...(telefone ? [{ telefone }] : [])
        ]
      }
    });
  }

  private mapearCliente(cliente: {
    id: string;
    negocioId: string;
    clienteGlobalId: string;
    telefone: string | null;
    email: string | null;
    nome: string | null;
    username: string | null;
    userId: string | null;
    avatarUrl: string | null;
    origem: string | null;
    tagsJson: string;
    preferenciasJson: string;
    consentimentoMarketing: boolean;
    consentimentoDados: boolean;
    estadoRelacionamento: string;
    primeiraInteracaoEm: Date;
    ultimaInteracaoEm: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Cliente360 {
    return {
      ...cliente,
      tags: this.lerLista(cliente.tagsJson),
      preferencias: this.parseJson(cliente.preferenciasJson),
      estadoRelacionamento: cliente.estadoRelacionamento as Cliente360["estadoRelacionamento"]
    };
  }

  private normalizarContatoObrigatorio(telefone?: string | null, email?: string | null) {
    const telefoneNormalizado = normalizarTelefone(telefone);
    const emailNormalizado = normalizarEmail(email);
    if (!telefoneNormalizado && !emailNormalizado) {
      throw new Error("Informe telefone ou email para identificar o cliente.");
    }

    return {
      telefoneLocal: telefoneNormalizado?.local ?? null,
      telefoneCanonico: telefoneNormalizado?.canonico ?? null,
      email: emailNormalizado
    };
  }

  private unirTags(tagsAtuais: string[], novasTags: string[]): string[] {
    return this.normalizarTags([...tagsAtuais, ...novasTags]);
  }

  private normalizarTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  private lerLista(valor: string): string[] {
    try {
      const lista = JSON.parse(valor);
      return Array.isArray(lista) ? lista.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private parseJson(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }
}

export class RepositorioAtendimentoPrisma implements RepositorioAtendimento {
  constructor(private readonly prisma: PrismaClient) {}

  async registrarMensagem(dados: NovaMensagemAtendimento): Promise<MensagemAtendimento> {
    if (dados.providerMessageId) {
      const existente = await this.buscarMensagemPorProviderMessageId(dados.providerMessageId);
      if (existente) return existente;
    }

    const agora = new Date();
    const enviadaEm = dados.enviadaEm ?? agora;
    const canal = dados.canal ?? "whatsapp";
    const conversa = await this.obterConversaParaMensagem(dados, canal, enviadaEm);

    try {
      const mensagem = await this.prisma.mensagemAtendimento.create({
        data: {
          negocioId: conversa.negocioId,
          conversaId: conversa.id,
          telefone: dados.telefone,
          direcao: dados.direcao,
          remetente: dados.remetente,
          canal,
          tipo: dados.tipo,
          conteudo: dados.conteudo,
          provider: dados.provider ?? null,
          providerMessageId: dados.providerMessageId ?? null,
          status: dados.status ?? (dados.direcao === "INBOUND" ? "RECEIVED" : "SENT"),
          origem: dados.origem,
          reservaId: dados.reservaId ?? null,
          comentarioId: dados.comentarioId ?? null,
          erro: dados.erro ?? null,
          contextoJson: this.serializar(dados.contexto ?? {}),
          enviadaEm
        }
      });

      return this.mapearMensagem(mensagem);
    } catch (erro) {
      if (this.ehViolacaoDeUnicidade(erro) && dados.providerMessageId) {
        const existente = await this.buscarMensagemPorProviderMessageId(dados.providerMessageId);
        if (existente) return existente;
      }

      throw erro;
    }
  }

  private async obterConversaParaMensagem(dados: NovaMensagemAtendimento, canal: string, enviadaEm: Date) {
    const negocioId = dados.negocioId ?? (await this.inferirNegocioIdPorTelefone(dados.telefone));

    if (dados.conversaId) {
      const existente = await this.prisma.conversaAtendimento.findFirst({
        where: {
          id: dados.conversaId,
          ...(negocioId ? { negocioId } : {})
        },
        include: { cliente: true }
      });

      if (existente) {
        await this.prisma.clienteAtendimento.update({
          where: { id: existente.clienteId },
          data: {
            nome: dados.nomeCliente ?? undefined,
            username: dados.usernameCliente ?? undefined,
            userId: dados.userIdCliente ?? undefined,
            avatarUrl: dados.avatarUrlCliente ?? undefined,
            ultimaInteracaoEm: enviadaEm
          }
        });

        return this.prisma.conversaAtendimento.update({
          where: { id: existente.id },
          data: { ultimaMensagemEm: enviadaEm }
        });
      }
    }

    const clienteExistente = await this.prisma.clienteAtendimento.findFirst({
      where: {
        telefone: dados.telefone,
        negocioId
      }
    });
    const cliente = clienteExistente
      ? await this.prisma.clienteAtendimento.update({
          where: { id: clienteExistente.id },
          data: {
            nome: dados.nomeCliente ?? undefined,
            username: dados.usernameCliente ?? undefined,
            userId: dados.userIdCliente ?? undefined,
            avatarUrl: dados.avatarUrlCliente ?? undefined,
            ultimaInteracaoEm: enviadaEm
          }
        })
      : await this.prisma.clienteAtendimento.create({
          data: {
            negocioId,
            telefone: dados.telefone,
            nome: dados.nomeCliente ?? null,
            username: dados.usernameCliente ?? null,
            userId: dados.userIdCliente ?? null,
            avatarUrl: dados.avatarUrlCliente ?? null,
            origem: dados.origem,
            primeiraInteracaoEm: enviadaEm,
            ultimaInteracaoEm: enviadaEm
          }
        });

    const conversaExistente = await this.prisma.conversaAtendimento.findFirst({
      where: {
        telefone: dados.telefone,
        canal,
        negocioId
      }
    });

    if (conversaExistente) {
      return this.prisma.conversaAtendimento.update({
        where: { id: conversaExistente.id },
        data: {
          clienteId: cliente.id,
          clienteNegocioId: dados.clienteNegocioId ?? conversaExistente.clienteNegocioId,
          ultimaMensagemEm: enviadaEm
        }
      });
    }

    return this.prisma.conversaAtendimento.create({
      data: {
        negocioId,
        clienteNegocioId: dados.clienteNegocioId ?? null,
        clienteId: cliente.id,
        telefone: dados.telefone,
        canal,
        estado: "ABERTA",
        prioridade: "NORMAL",
        ultimaMensagemEm: enviadaEm
      }
    });
  }

  private async inferirNegocioIdPorTelefone(telefone: string): Promise<string | null> {
    const conversas = await this.prisma.conversaAtendimento.findMany({
      where: {
        telefone,
        negocioId: { not: null }
      },
      distinct: ["negocioId"],
      take: 2,
      select: {
        negocioId: true
      }
    });

    return conversas.length === 1 ? conversas[0].negocioId : null;
  }

  async listarConversasComMensagens(limite = 100, negocioId?: string | null): Promise<ConversaAtendimentoComMensagens[]> {
    const conversas = await this.prisma.conversaAtendimento.findMany({
      where: negocioId ? { negocioId } : undefined,
      orderBy: [{ ultimaMensagemEm: "desc" }, { atualizadoEm: "desc" }],
      take: limite,
      include: {
        cliente: true,
        mensagens: { orderBy: { enviadaEm: "asc" } }
      }
    });

    return conversas.map((conversa) => ({
      cliente: this.mapearCliente(conversa.cliente),
      conversa: this.mapearConversa(conversa),
      mensagens: conversa.mensagens.map((mensagem) => this.mapearMensagem(mensagem))
    }));
  }

  async buscarConversaComMensagensPorId(
    id: string,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const conversa = await this.prisma.conversaAtendimento.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      },
      include: {
        cliente: true,
        mensagens: { orderBy: { enviadaEm: "asc" } }
      }
    });

    if (!conversa) return null;

    return {
      cliente: this.mapearCliente(conversa.cliente),
      conversa: this.mapearConversa(conversa),
      mensagens: conversa.mensagens.map((mensagem) => this.mapearMensagem(mensagem))
    };
  }

  async atualizarConversa(
    id: string,
    dados: AtualizacaoConversaAtendimento,
    negocioId?: string | null
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const existente = await this.prisma.conversaAtendimento.findFirst({
      where: {
        id,
        ...(negocioId ? { negocioId } : {})
      }
    });
    if (!existente) return null;

    const conversa = await this.prisma.conversaAtendimento.update({
      where: { id },
      data: {
        estado: dados.estado,
        prioridade: dados.prioridade,
        responsavelId: dados.responsavelId,
        tagsJson: dados.tags ? this.serializar(dados.tags) : undefined
      },
      include: {
        cliente: true,
        mensagens: { orderBy: { enviadaEm: "asc" } }
      }
    });

    return {
      cliente: this.mapearCliente(conversa.cliente),
      conversa: this.mapearConversa(conversa),
      mensagens: conversa.mensagens.map((mensagem) => this.mapearMensagem(mensagem))
    };
  }

  async buscarMensagemPorProviderMessageId(providerMessageId: string): Promise<MensagemAtendimento | null> {
    const mensagem = await this.prisma.mensagemAtendimento.findUnique({ where: { providerMessageId } });
    return mensagem ? this.mapearMensagem(mensagem) : null;
  }

  async atualizarStatusMensagemPorProviderMessageId(
    providerMessageId: string,
    dados: { status: MensagemAtendimento["status"]; erro?: string | null; atualizadoEm?: Date }
  ): Promise<MensagemAtendimento | null> {
    const existente = await this.prisma.mensagemAtendimento.findUnique({ where: { providerMessageId } });
    if (!existente) return null;

    const mensagem = await this.prisma.mensagemAtendimento.update({
      where: { providerMessageId },
      data: {
        status: dados.status,
        erro: dados.erro === undefined ? existente.erro : dados.erro
      }
    });
    return this.mapearMensagem(mensagem);
  }

  async limparHistorico() {
    const [mensagensAtendimento, conversasAtendimento, clientesAtendimento] = await this.prisma.$transaction([
      this.prisma.mensagemAtendimento.deleteMany({}),
      this.prisma.conversaAtendimento.deleteMany({}),
      this.prisma.clienteAtendimento.deleteMany({})
    ]);

    return {
      mensagensAtendimento: mensagensAtendimento.count,
      conversasAtendimento: conversasAtendimento.count,
      clientesAtendimento: clientesAtendimento.count
    };
  }

  private mapearCliente(cliente: {
    id: string;
    negocioId: string | null;
    clienteGlobalId: string | null;
    telefone: string;
    nome: string | null;
    username: string | null;
    userId: string | null;
    avatarUrl: string | null;
    origem: string | null;
    tagsJson: string;
    consentimento: boolean;
    primeiraInteracaoEm: Date;
    ultimaInteracaoEm: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  }): ClienteAtendimento {
    return {
      ...cliente,
      tags: this.lerLista(cliente.tagsJson)
    };
  }

  private mapearConversa(conversa: {
    id: string;
    negocioId: string | null;
    clienteNegocioId: string | null;
    clienteId: string;
    telefone: string;
    canal: string;
    estado: string;
    prioridade: string;
    responsavelId: string | null;
    tagsJson: string;
    ultimaMensagemEm: Date | null;
    criadaEm: Date;
    atualizadoEm: Date;
  }): ConversaAtendimento {
    return {
      ...conversa,
      estado: conversa.estado as ConversaAtendimento["estado"],
      prioridade: conversa.prioridade as ConversaAtendimento["prioridade"],
      tags: this.lerLista(conversa.tagsJson)
    };
  }

  private mapearMensagem(mensagem: {
    id: string;
    negocioId: string | null;
    conversaId: string;
    telefone: string;
    direcao: string;
    remetente: string;
    canal: string;
    tipo: string;
    conteudo: string;
    provider: string | null;
    providerMessageId: string | null;
    status: string;
    origem: string;
    reservaId: string | null;
    comentarioId: string | null;
    erro: string | null;
    contextoJson: string;
    enviadaEm: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  }): MensagemAtendimento {
    return {
      ...mensagem,
      direcao: mensagem.direcao as MensagemAtendimento["direcao"],
      remetente: mensagem.remetente as MensagemAtendimento["remetente"],
      status: mensagem.status as MensagemAtendimento["status"],
      contexto: this.parseJson(mensagem.contextoJson)
    };
  }

  private lerLista(valor: string): string[] {
    try {
      const lista = JSON.parse(valor);
      return Array.isArray(lista) ? lista.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  private parseJson(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }

  private ehViolacaoDeUnicidade(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
  }
}

export class RepositorioAuditoriaPrisma implements RepositorioAuditoria {
  constructor(private readonly prisma: PrismaClient) {}

  async registrarEventoSistema(evento: EventoSistema): Promise<void> {
    await this.prisma.eventoSistema.upsert({
      where: { id: evento.id },
      create: {
        id: evento.id,
        negocioId: this.obterNegocioId(evento.dados),
        tipo: evento.tipo,
        dadosJson: this.serializar(evento.dados),
        criadoEm: evento.criadoEm
      },
      update: {
        negocioId: this.obterNegocioId(evento.dados),
        tipo: evento.tipo,
        dadosJson: this.serializar(evento.dados)
      }
    });
  }

  async registrarMensagemWhatsApp(dados: {
    negocioId?: string | null;
    telefone: string;
    tipo: string;
    conteudo: string;
    provider: string;
    idExterno?: string | null;
    enviadaEm?: Date;
  }): Promise<void> {
    await this.prisma.mensagemWhatsapp.create({
      data: {
        negocioId: dados.negocioId ?? null,
        telefone: dados.telefone,
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        provider: dados.provider,
        idExterno: dados.idExterno ?? null,
        enviadaEm: dados.enviadaEm ?? new Date()
      }
    });
  }

  async criarEventoN8n(evento: EventoSistema): Promise<RegistroOutboxEventoN8n> {
    const registro = await this.prisma.outboxEventoN8n.create({
      data: {
        negocioId: this.obterNegocioId(evento.dados),
        eventoId: evento.id,
        tipo: evento.tipo,
        payloadJson: this.serializar(evento.dados),
        status: "PENDENTE",
        proximaTentativaEm: new Date()
      }
    });

    return this.mapearOutbox(registro);
  }

  async listarEventosN8n(limite = 100): Promise<RegistroOutboxEventoN8n[]> {
    const registros = await this.prisma.outboxEventoN8n.findMany({
      orderBy: { criadoEm: "desc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutbox(registro));
  }

  async listarEventosN8nPendentes(limite: number, agora: Date): Promise<RegistroOutboxEventoN8n[]> {
    const registros = await this.prisma.outboxEventoN8n.findMany({
      where: {
        status: { in: ["PENDENTE", "FALHOU"] },
        proximaTentativaEm: { lte: agora }
      },
      orderBy: { criadoEm: "asc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutbox(registro));
  }

  async marcarEventoN8nPublicado(id: string, publicadoEm: Date): Promise<void> {
    await this.prisma.outboxEventoN8n.update({
      where: { id },
      data: {
        status: "PUBLICADO",
        publicadoEm,
        ultimoErro: null
      }
    });
  }

  async marcarEventoN8nFalha(id: string, erro: string, proximaTentativaEm: Date): Promise<void> {
    await this.prisma.outboxEventoN8n.update({
      where: { id },
      data: {
        status: "FALHOU",
        tentativas: { increment: 1 },
        ultimoErro: erro.slice(0, 1000),
        proximaTentativaEm
      }
    });
  }

  async resumirEventosN8n(): Promise<ResumoOutboxEventoN8n> {
    const [total, pendentes, publicados, falhados, proximo, ultimaFalha, ultimoAtualizado] = await Promise.all([
      this.prisma.outboxEventoN8n.count(),
      this.prisma.outboxEventoN8n.count({ where: { status: "PENDENTE" } }),
      this.prisma.outboxEventoN8n.count({ where: { status: "PUBLICADO" } }),
      this.prisma.outboxEventoN8n.count({ where: { status: "FALHOU" } }),
      this.prisma.outboxEventoN8n.findFirst({
        where: { status: { in: ["PENDENTE", "FALHOU"] } },
        orderBy: { proximaTentativaEm: "asc" },
        select: { proximaTentativaEm: true }
      }),
      this.prisma.outboxEventoN8n.findFirst({
        where: { status: "FALHOU" },
        orderBy: { atualizadoEm: "desc" },
        select: { ultimoErro: true }
      }),
      this.prisma.outboxEventoN8n.findFirst({
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true }
      })
    ]);

    return {
      total,
      pendentes,
      publicados,
      falhados,
      proximaTentativaEm: proximo?.proximaTentativaEm ?? null,
      ultimaFalha: ultimaFalha?.ultimoErro ?? null,
      atualizadoEm: ultimoAtualizado?.atualizadoEm ?? null
    };
  }

  async criarMensagemWhatsAppPendente(dados: NovoOutboxMensagemWhatsApp): Promise<RegistroOutboxMensagemWhatsApp> {
    const registro = await this.prisma.outboxMensagemWhatsApp.create({
      data: {
        negocioId: dados.negocioId ?? this.obterNegocioId(dados.contexto ?? {}),
        telefone: dados.telefone,
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        contextoJson: this.serializar(dados.contexto ?? {}),
        status: "PENDENTE",
        maxTentativas: Math.max(1, dados.maxTentativas ?? 5),
        proximaTentativaEm: dados.proximaTentativaEm ?? new Date(),
        ultimoErro: dados.ultimoErro ?? null
      }
    });

    return this.mapearOutboxWhatsApp(registro);
  }

  async listarMensagensWhatsApp(limite = 100, negocioId?: string | null): Promise<RegistroOutboxMensagemWhatsApp[]> {
    const registros = await this.prisma.outboxMensagemWhatsApp.findMany({
      where: this.filtroNegocioOutboxWhatsApp(negocioId),
      orderBy: { criadoEm: "desc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutboxWhatsApp(registro));
  }

  async listarMensagensWhatsAppPendentes(
    limite: number,
    agora: Date,
    opcoes: { incluirFalhadas?: boolean; negocioId?: string | null } = {}
  ): Promise<RegistroOutboxMensagemWhatsApp[]> {
    const registros = await this.prisma.outboxMensagemWhatsApp.findMany({
      where: {
        ...this.filtroNegocioOutboxWhatsApp(opcoes.negocioId),
        status: { in: opcoes.incluirFalhadas ? ["PENDENTE", "FALHOU"] : ["PENDENTE"] },
        proximaTentativaEm: { lte: agora }
      },
      orderBy: { criadoEm: "asc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutboxWhatsApp(registro));
  }

  async marcarMensagemWhatsAppEnviada(
    id: string,
    dados: { provider: string; idExterno?: string | null; enviadaEm: Date }
  ): Promise<void> {
    await this.prisma.outboxMensagemWhatsApp.update({
      where: { id },
      data: {
        status: "ENVIADA",
        provider: dados.provider,
        idExterno: dados.idExterno ?? null,
        enviadaEm: dados.enviadaEm,
        ultimoErro: null
      }
    });
  }

  async marcarMensagemWhatsAppFalha(
    id: string,
    erro: string,
    proximaTentativaEm: Date,
    opcoes: { falhaFinal?: boolean } = {}
  ): Promise<void> {
    await this.prisma.outboxMensagemWhatsApp.update({
      where: { id },
      data: {
        status: opcoes.falhaFinal ? "FALHOU" : "PENDENTE",
        tentativas: { increment: 1 },
        ultimoErro: erro.slice(0, 1000),
        proximaTentativaEm
      }
    });
  }

  async resumirMensagensWhatsAppOutbox(negocioId?: string | null): Promise<ResumoOutboxMensagemWhatsApp> {
    const filtroNegocio = this.filtroNegocioOutboxWhatsApp(negocioId);
    const [total, pendentes, enviadas, falhadas, proximo, ultimaFalha, ultimoAtualizado] = await Promise.all([
      this.prisma.outboxMensagemWhatsApp.count({ where: filtroNegocio }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { ...filtroNegocio, status: "PENDENTE" } }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { ...filtroNegocio, status: "ENVIADA" } }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { ...filtroNegocio, status: "FALHOU" } }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: { ...filtroNegocio, status: { in: ["PENDENTE", "FALHOU"] } },
        orderBy: { proximaTentativaEm: "asc" },
        select: { proximaTentativaEm: true }
      }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: { ...filtroNegocio, ultimoErro: { not: null } },
        orderBy: { atualizadoEm: "desc" },
        select: { ultimoErro: true }
      }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: filtroNegocio,
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true }
      })
    ]);

    return {
      total,
      pendentes,
      enviadas,
      falhadas,
      proximaTentativaEm: proximo?.proximaTentativaEm ?? null,
      ultimaFalha: ultimaFalha?.ultimoErro ?? null,
      atualizadoEm: ultimoAtualizado?.atualizadoEm ?? null
    };
  }

  async limparMensagensComunicacao() {
    const [mensagensWhatsapp, outboxWhatsapp] = await this.prisma.$transaction([
      this.prisma.mensagemWhatsapp.deleteMany({}),
      this.prisma.outboxMensagemWhatsApp.deleteMany({})
    ]);

    return {
      mensagensWhatsapp: mensagensWhatsapp.count,
      outboxWhatsapp: outboxWhatsapp.count
    };
  }

  private mapearOutbox(registro: {
    id: string;
    eventoId: string;
    tipo: string;
    payloadJson: string;
    status: string;
    tentativas: number;
    proximaTentativaEm: Date;
    ultimoErro: string | null;
    publicadoEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RegistroOutboxEventoN8n {
    return {
      id: registro.id,
      eventoId: registro.eventoId,
      tipo: registro.tipo as RegistroOutboxEventoN8n["tipo"],
      payload: this.parseJson(registro.payloadJson),
      status: registro.status as RegistroOutboxEventoN8n["status"],
      tentativas: registro.tentativas,
      proximaTentativaEm: registro.proximaTentativaEm,
      ultimoErro: registro.ultimoErro,
      publicadoEm: registro.publicadoEm,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm
    };
  }

  private mapearOutboxWhatsApp(registro: {
    id: string;
    negocioId: string | null;
    telefone: string;
    tipo: string;
    conteudo: string;
    contextoJson: string;
    status: string;
    tentativas: number;
    maxTentativas: number;
    proximaTentativaEm: Date;
    ultimoErro: string | null;
    provider: string | null;
    idExterno: string | null;
    enviadaEm: Date | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): RegistroOutboxMensagemWhatsApp {
    return {
      id: registro.id,
      negocioId: registro.negocioId,
      telefone: registro.telefone,
      tipo: registro.tipo,
      conteudo: registro.conteudo,
      contexto: this.parseJson(registro.contextoJson),
      status: registro.status as RegistroOutboxMensagemWhatsApp["status"],
      tentativas: registro.tentativas,
      maxTentativas: registro.maxTentativas,
      proximaTentativaEm: registro.proximaTentativaEm,
      ultimoErro: registro.ultimoErro,
      provider: registro.provider,
      idExterno: registro.idExterno,
      enviadaEm: registro.enviadaEm,
      criadoEm: registro.criadoEm,
      atualizadoEm: registro.atualizadoEm
    };
  }

  private parseJson(valor: string): Record<string, unknown> {
    try {
      const json = JSON.parse(valor);
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch {
      return {};
    }
  }

  private serializar(valor: unknown): string {
    return JSON.stringify(valor, (_chave, item) => {
      if (item instanceof Date) return item.toISOString();
      if (typeof item === "bigint") return item.toString();
      return item;
    });
  }

  private filtroNegocioOutboxWhatsApp(negocioId?: string | null): Prisma.OutboxMensagemWhatsAppWhereInput {
    return negocioId === undefined ? {} : { negocioId: negocioId ?? null };
  }

  private obterNegocioId(dados: Record<string, unknown>): string | null {
    const direto = typeof dados.negocioId === "string" && dados.negocioId.trim() ? dados.negocioId : null;
    if (direto) return direto;

    const contexto = this.obterObjeto(dados.contexto);
    const negocioContexto =
      typeof contexto.negocioId === "string" && contexto.negocioId.trim() ? contexto.negocioId : null;
    if (negocioContexto) return negocioContexto;

    const reserva = this.obterObjeto(dados.reserva ?? contexto.reserva);
    return typeof reserva.negocioId === "string" && reserva.negocioId.trim() ? reserva.negocioId : null;
  }

  private obterObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }
}
