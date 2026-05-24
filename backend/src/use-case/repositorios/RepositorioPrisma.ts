import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  RepositorioComentarios,
  RepositorioAutenticacao,
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioInstanciasWhatsApp,
  RepositorioPecas,
  RepositorioReservas,
  RepositorioSessoesLive
} from "../../dominio/repositorios/contratos.js";
import type {
  AtualizacaoRegistroSessaoLive,
  AtualizacaoConversaAtendimento,
  AtualizarPeca,
  CodigoLoginSms,
  ClienteAtendimento,
  ComentarioLive,
  ConversaAtendimento,
  ConversaAtendimentoComMensagens,
  DadosCriacaoReservaComControleStock,
  EstadoComentario,
  EstadoPagamento,
  EstadoPeca,
  EstadoReserva,
  EventoSistema,
  InstanciaWhatsApp,
  MensagemAtendimento,
  NovaMensagemAtendimento,
  NovaPeca,
  NovaReserva,
  NovoRegistroComentario,
  NovoOutboxMensagemWhatsApp,
  NovoRegistroSessaoLive,
  Peca,
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

const estadosQueBloqueiamStock: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "PAID"];
const estadosAtivosParaDuplicidade: EstadoReserva[] = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"];

export class RepositorioPecasPrisma implements RepositorioPecas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaPeca): Promise<Peca> {
    const peca = await this.prisma.peca.create({
      data: {
        codigo: dados.codigo,
        negocioId: dados.negocioId ?? null,
        nome: dados.nome,
        descricao: dados.descricao,
        precoEmKwanza: dados.precoEmKwanza,
        quantidade: dados.quantidade,
        fotosJson: JSON.stringify(dados.fotos),
        estado: dados.estado ?? (dados.quantidade > 0 ? "DISPONIVEL" : "ESGOTADA")
      }
    });

    return this.mapearPeca(peca);
  }

  async listar(): Promise<Peca[]> {
    const pecas = await this.prisma.peca.findMany({ orderBy: { codigo: "asc" } });
    return pecas.map((peca) => this.mapearPeca(peca));
  }

  async buscarPorCodigo(codigo: string): Promise<Peca | null> {
    const peca = await this.prisma.peca.findUnique({ where: { codigo } });
    return peca ? this.mapearPeca(peca) : null;
  }

  async atualizar(codigo: string, dados: AtualizarPeca): Promise<Peca> {
    const peca = await this.prisma.peca.update({
      where: { codigo },
      data: {
        nome: dados.nome,
        descricao: dados.descricao,
        precoEmKwanza: dados.precoEmKwanza,
        quantidade: dados.quantidade,
        negocioId: dados.negocioId,
        estado: dados.estado,
        fotosJson: dados.fotos ? JSON.stringify(dados.fotos) : undefined
      }
    });

    return this.mapearPeca(peca);
  }

  async atualizarEstado(codigo: string, estado: EstadoPeca): Promise<Peca> {
    return this.atualizar(codigo, { estado });
  }

  private mapearPeca(peca: {
    id: string;
    codigo: string;
    negocioId: string | null;
    nome: string;
    descricao: string;
    precoEmKwanza: number;
    quantidade: number;
    fotosJson: string;
    estado: string;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Peca {
    return {
      ...peca,
      fotos: this.lerFotos(peca.fotosJson),
      estado: peca.estado as EstadoPeca
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
}

export class RepositorioReservasPrisma implements RepositorioReservas {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovaReserva): Promise<Reserva> {
    const peca = await this.prisma.peca.findUnique({ where: { codigo: dados.codigoPeca } });

    if (!peca) {
      throw new Error(`Peça #${dados.codigoPeca} não encontrada.`);
    }

    const reserva = await this.prisma.reserva.create({
      data: {
        pecaId: peca.id,
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
          const peca = await tx.peca.findUnique({ where: { codigo: dados.codigoPeca } });

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
              codigoPeca: peca.codigo,
              estado: { in: estadosQueBloqueiamStock }
            }
          });
          const temStockLivre = peca.quantidade - reservasQueBloqueiamStock > 0;

          const reserva = await tx.reserva.create({
            data: {
              pecaId: peca.id,
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
              ? await tx.peca.update({ where: { codigo: peca.codigo }, data: { estado: "RESERVADA" } })
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
        const reservaExistente = await this.buscarReservaAtivaPorTelefoneEPeca(dados.telefoneCliente, dados.codigoPeca);
        const peca = await this.prisma.peca.findUnique({ where: { codigo: dados.codigoPeca } });
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

  async listar(): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({ orderBy: { criadaEm: "asc" } });
    return reservas.map((reserva) => this.mapearReserva(reserva));
  }

  async buscarPorId(id: string): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    return reserva ? this.mapearReserva(reserva) : null;
  }

  async buscarReservaAtivaPorTelefoneEPeca(telefone: string, codigoPeca: string): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findFirst({
      where: {
        telefoneCliente: telefone,
        codigoPeca,
        estado: { in: estadosAtivosParaDuplicidade }
      },
      orderBy: { criadaEm: "asc" }
    });

    return reserva ? this.mapearReserva(reserva) : null;
  }

  async contarReservasQueBloqueiamStock(codigoPeca: string): Promise<number> {
    return this.prisma.reserva.count({
      where: {
        codigoPeca,
        estado: { in: estadosQueBloqueiamStock }
      }
    });
  }

  async listarFilaDaPeca(codigoPeca: string): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({
      where: { codigoPeca, estado: "WAITLISTED" },
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
    nome: string;
    descricao: string;
    precoEmKwanza: number;
    quantidade: number;
    fotosJson: string;
    estado: string;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Peca {
    return {
      ...peca,
      fotos: this.lerFotos(peca.fotosJson),
      estado: peca.estado as EstadoPeca
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

export class RepositorioComentariosPrisma implements RepositorioComentarios {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoRegistroComentario): Promise<RegistroComentario> {
    const comentario = await this.prisma.comentarioRecebido.create({
      data: {
        ...this.mapearComentarioParaBanco(dados.comentario),
        ...this.mapearInterpretacaoParaBanco(dados.interpretacao),
        estado: dados.estado,
        motivo: dados.motivo ?? null
      }
    });

    return this.mapearRegistroComentario(comentario);
  }

  async listar(limite = 100): Promise<RegistroComentario[]> {
    const comentarios = await this.prisma.comentarioRecebido.findMany({
      take: limite,
      orderBy: { criadoEm: "desc" }
    });

    return comentarios.map((comentario) => this.mapearRegistroComentario(comentario));
  }

  async buscarPorId(id: string): Promise<RegistroComentario | null> {
    const comentario = await this.prisma.comentarioRecebido.findUnique({ where: { id } });
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
    nome: string;
    etiqueta?: string | null;
    telefone?: string | null;
    baseUrl?: string | null;
    apiKey?: string | null;
    padrao?: boolean;
  }): Promise<InstanciaWhatsApp> {
    if (dados.padrao) {
      await this.prisma.instanciaWhatsApp.updateMany({ where: { padrao: true }, data: { padrao: false } });
    }

    return this.prisma.instanciaWhatsApp.create({
      data: {
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

  async listarAtivas(): Promise<InstanciaWhatsApp[]> {
    return this.prisma.instanciaWhatsApp.findMany({
      where: { ativa: true },
      orderBy: [{ padrao: "desc" }, { atualizadaEm: "desc" }]
    });
  }

  async buscarPorId(id: string): Promise<InstanciaWhatsApp | null> {
    return this.prisma.instanciaWhatsApp.findUnique({ where: { id } });
  }

  async buscarPadrao(): Promise<InstanciaWhatsApp | null> {
    return this.prisma.instanciaWhatsApp.findFirst({
      where: { ativa: true, padrao: true },
      orderBy: { atualizadaEm: "desc" }
    });
  }

  async atualizar(
    id: string,
    dados: Partial<Pick<
      InstanciaWhatsApp,
      "etiqueta" | "telefone" | "status" | "qrCode" | "pairingCode" | "baseUrl" | "apiKey" | "padrao" | "ativa" | "ultimoErro" | "ultimaConexaoEm" | "ultimaConsultaEm"
    >>
  ): Promise<InstanciaWhatsApp> {
    if (dados.padrao) {
      await this.prisma.instanciaWhatsApp.updateMany({ where: { padrao: true, id: { not: id } }, data: { padrao: false } });
    }

    return this.prisma.instanciaWhatsApp.update({
      where: { id },
      data: dados
    });
  }

  async definirPadrao(id: string): Promise<InstanciaWhatsApp> {
    await this.prisma.instanciaWhatsApp.updateMany({ where: { padrao: true, id: { not: id } }, data: { padrao: false } });
    return this.prisma.instanciaWhatsApp.update({ where: { id }, data: { padrao: true, ativa: true } });
  }

  async desativar(id: string): Promise<InstanciaWhatsApp> {
    return this.prisma.instanciaWhatsApp.update({
      where: { id },
      data: { ativa: false, padrao: false }
    });
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
    if (dados.conversaId) {
      const existente = await this.prisma.conversaAtendimento.findUnique({
        where: { id: dados.conversaId },
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

    const cliente = await this.prisma.clienteAtendimento.upsert({
      where: { telefone: dados.telefone },
      create: {
        telefone: dados.telefone,
        nome: dados.nomeCliente ?? null,
        username: dados.usernameCliente ?? null,
        userId: dados.userIdCliente ?? null,
        avatarUrl: dados.avatarUrlCliente ?? null,
        origem: dados.origem,
        primeiraInteracaoEm: enviadaEm,
        ultimaInteracaoEm: enviadaEm
      },
      update: {
        nome: dados.nomeCliente ?? undefined,
        username: dados.usernameCliente ?? undefined,
        userId: dados.userIdCliente ?? undefined,
        avatarUrl: dados.avatarUrlCliente ?? undefined,
        ultimaInteracaoEm: enviadaEm
      }
    });

    return this.prisma.conversaAtendimento.upsert({
      where: { telefone_canal: { telefone: dados.telefone, canal } },
      create: {
        clienteId: cliente.id,
        telefone: dados.telefone,
        canal,
        estado: "ABERTA",
        prioridade: "NORMAL",
        ultimaMensagemEm: enviadaEm
      },
      update: {
        clienteId: cliente.id,
        ultimaMensagemEm: enviadaEm
      }
    });
  }

  async listarConversasComMensagens(limite = 100): Promise<ConversaAtendimentoComMensagens[]> {
    const conversas = await this.prisma.conversaAtendimento.findMany({
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

  async buscarConversaComMensagensPorId(id: string): Promise<ConversaAtendimentoComMensagens | null> {
    const conversa = await this.prisma.conversaAtendimento.findUnique({
      where: { id },
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
    dados: AtualizacaoConversaAtendimento
  ): Promise<ConversaAtendimentoComMensagens | null> {
    const existente = await this.prisma.conversaAtendimento.findUnique({ where: { id } });
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
        tipo: evento.tipo,
        dadosJson: this.serializar(evento.dados),
        criadoEm: evento.criadoEm
      },
      update: {
        tipo: evento.tipo,
        dadosJson: this.serializar(evento.dados)
      }
    });
  }

  async registrarMensagemWhatsApp(dados: {
    telefone: string;
    tipo: string;
    conteudo: string;
    provider: string;
    idExterno?: string | null;
    enviadaEm?: Date;
  }): Promise<void> {
    await this.prisma.mensagemWhatsapp.create({
      data: {
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

  async listarMensagensWhatsApp(limite = 100): Promise<RegistroOutboxMensagemWhatsApp[]> {
    const registros = await this.prisma.outboxMensagemWhatsApp.findMany({
      orderBy: { criadoEm: "desc" },
      take: limite
    });

    return registros.map((registro) => this.mapearOutboxWhatsApp(registro));
  }

  async listarMensagensWhatsAppPendentes(
    limite: number,
    agora: Date,
    opcoes: { incluirFalhadas?: boolean } = {}
  ): Promise<RegistroOutboxMensagemWhatsApp[]> {
    const registros = await this.prisma.outboxMensagemWhatsApp.findMany({
      where: {
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

  async resumirMensagensWhatsAppOutbox(): Promise<ResumoOutboxMensagemWhatsApp> {
    const [total, pendentes, enviadas, falhadas, proximo, ultimaFalha, ultimoAtualizado] = await Promise.all([
      this.prisma.outboxMensagemWhatsApp.count(),
      this.prisma.outboxMensagemWhatsApp.count({ where: { status: "PENDENTE" } }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { status: "ENVIADA" } }),
      this.prisma.outboxMensagemWhatsApp.count({ where: { status: "FALHOU" } }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: { status: { in: ["PENDENTE", "FALHOU"] } },
        orderBy: { proximaTentativaEm: "asc" },
        select: { proximaTentativaEm: true }
      }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
        where: { ultimoErro: { not: null } },
        orderBy: { atualizadoEm: "desc" },
        select: { ultimoErro: true }
      }),
      this.prisma.outboxMensagemWhatsApp.findFirst({
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
}
