import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { FiltrosMembrosNegocio, PaginacaoOffset } from "../../../dominio/tipos.js";
import { montarPaginacaoOffset, normalizarLimitePaginacao, normalizarOffsetPaginacao } from "../../../use-case/utils/paginacao.js";

const ITENS_ONBOARDING_PADRAO = [
  { item: "PERFIL_COMPLETO", descricao: "Completar perfil com nome, foto e contacto" },
  { item: "CONFIGURAR_NOTIFICACOES", descricao: "Configurar alertas pessoais de WhatsApp, email ou push" },
  { item: "TOUR_MODULOS_PERMITIDOS", descricao: "Conhecer os módulos disponíveis para o seu papel" },
  { item: "PRIMEIRA_TAREFA", descricao: "Concluir a primeira tarefa atribuída" },
  { item: "ENVIAR_MENSAGEM", descricao: "Enviar primeira mensagem a um cliente" }
];

const HORAS_EXPIRACAO_CONVITE = 72;
const LIMITE_MEMBROS_PADRAO = 500;
const LIMITE_PAGINA_MEMBROS = 500;
const DIAS_INACTIVIDADE_SUSPENSAO = 90;
const PAPEIS_SENSIVEIS = ["ADMIN", "GESTOR_FINANCEIRO", "DONO"];
const MINUTOS_SLA_CONVERSA = 30;

export class GestaoEquipaUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Invitations ────────────────────────────────────────────────────────────

  async criarConvite(
    negocioId: string,
    dados: {
      telefone?: string;
      email?: string;
      nomeConvidado?: string;
      papelSugerido?: string;
      personaId?: string;
      criadoPorId: string;
    }
  ) {
    // RN-T033: verificar limite de membros activos
    const membrosActivos = await this.prisma.membroNegocio.count({
      where: { negocioId, status: "ATIVO" }
    });
    if (membrosActivos >= LIMITE_MEMBROS_PADRAO) {
      throw new Error(
        `RN-T033: Limite de ${LIMITE_MEMBROS_PADRAO} membros activos atingido. Contacte o suporte para aumentar o limite.`
      );
    }

    // RN-T037: papéis sensíveis exigem que o criador seja DONO ou ADMIN
    const papelSugerido = dados.papelSugerido ?? "VENDEDOR";
    if (PAPEIS_SENSIVEIS.includes(papelSugerido)) {
      const totalMembros = await this.prisma.membroNegocio.count({
        where: { negocioId, status: "ATIVO" }
      });
      if (totalMembros > 10) {
        const criador = await this.prisma.membroNegocio.findFirst({
          where: { negocioId, usuarioId: dados.criadoPorId, status: "ATIVO" }
        });
        if (!criador || !["DONO", "ADMIN"].includes(criador.papel)) {
          throw new Error(
            "RN-T037: Convites para papéis sensíveis em negócios com mais de 10 membros exigem aprovação de DONO ou ADMIN."
          );
        }
      }
    }

    const expiraEm = new Date(Date.now() + HORAS_EXPIRACAO_CONVITE * 60 * 60 * 1000);
    const token = randomUUID();

    const convite = await this.prisma.conviteEquipa.create({
      data: {
        negocioId,
        token,
        telefone: dados.telefone,
        email: dados.email,
        nomeConvidado: dados.nomeConvidado,
        papelSugerido: dados.papelSugerido ?? "VENDEDOR",
        personaId: dados.personaId,
        criadoPorId: dados.criadoPorId,
        estado: "PENDENTE",
        expiraEm
      }
    });

    await this.registrarActividade(negocioId, {
      autorId: dados.criadoPorId,
      tipo: "CONVITE_CRIADO",
      entidadeTipo: "ConviteEquipa",
      entidadeId: convite.id,
      resumo: `Convite enviado para ${dados.nomeConvidado ?? dados.email ?? dados.telefone ?? "destinatário"}`,
      detalhes: { papelSugerido: dados.papelSugerido ?? "VENDEDOR" }
    });

    // RF-T063: preparar notificação de convite
    const notificacao = this.enviarNotificacaoConvite(convite);

    return { ...convite, notificacao };
  }

  // ── Notificação de Convite (RF-T063) ─────────────────────────────────────

  enviarNotificacaoConvite(convite: {
    token: string;
    email?: string | null;
    telefone?: string | null;
  }) {
    const link = `${process.env.ORIGEM_FRONTEND ?? "https://usebizy.space"}/convite/${convite.token}`;
    return {
      tipo: convite.email ? "EMAIL" as const : "WHATSAPP" as const,
      destinatario: convite.email ?? convite.telefone ?? null,
      link,
      mensagem: `Foste convidado(a) para a equipa! Aceita aqui: ${link}`
    };
  }

  async listarConvites(negocioId: string) {
    return this.prisma.conviteEquipa.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });
  }

  async aceitarConvite(token: string, usuarioId: string, termosAceites?: boolean) {
    const convite = await this.prisma.conviteEquipa.findUnique({ where: { token } });

    if (!convite) {
      throw new Error("Convite não encontrado.");
    }

    if (convite.estado === "ACEITE") {
      throw new Error("Este convite já foi aceite.");
    }

    if (convite.estado === "EXPIRADO" || convite.expiraEm < new Date()) {
      throw new Error("Este convite expirou.");
    }

    if (termosAceites !== true) {
      throw new Error(
        "RN-T034: É obrigatório aceitar os termos de uso e política de dados para formalizar o convite."
      );
    }

    const [conviteAtualizado, membro] = await this.prisma.$transaction(async (tx) => {
      const conviteAceite = await tx.conviteEquipa.update({
        where: { id: convite.id },
        data: {
          estado: "ACEITE",
          aceitePorId: usuarioId,
          aceiteEm: new Date(),
          termosAceitesEm: new Date()
        }
      });

      const novoMembro = await tx.membroNegocio.create({
        data: {
          negocioId: convite.negocioId,
          usuarioId,
          papel: convite.papelSugerido ?? "VENDEDOR",
          status: "ATIVO",
          permissoesJson: "{}"
        }
      });

      await tx.checklistOnboarding.createMany({
        data: ITENS_ONBOARDING_PADRAO.map(({ item, descricao }) => ({
          negocioId: convite.negocioId,
          membroId: novoMembro.id,
          item,
          descricao,
          concluido: false
        }))
      });

      // RF-T114: criar tarefa de boas-vindas para o dono do negócio
      const dono = await tx.membroNegocio.findFirst({
        where: { negocioId: convite.negocioId, papel: "DONO", status: "ATIVO" }
      });

      await tx.tarefaOperacional.create({
        data: {
          negocioId: convite.negocioId,
          tipo: "EQUIPA",
          titulo: `Dar boas-vindas a ${convite.nomeConvidado ?? "novo membro"}`,
          descricao: `Novo membro juntou-se à equipa com papel ${convite.papelSugerido ?? "VENDEDOR"}. Apresente-se e ofereça mentoria inicial.`,
          prioridade: "MEDIA",
          estado: "ABERTA",
          responsavelId: dono?.usuarioId ?? null,
          prazoEm: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      await tx.tarefaOperacional.create({
        data: {
          negocioId: convite.negocioId,
          tipo: "ONBOARDING",
          titulo: "Completar primeiro passo no BIZY Team",
          descricao: "Rever o painel, confirmar perfil e concluir a primeira acção atribuída no turno.",
          prioridade: "MEDIA",
          estado: "ABERTA",
          origem: "ONBOARDING_MEMBRO",
          responsavelId: usuarioId,
          entidadeTipo: "MembroNegocio",
          entidadeId: novoMembro.id,
          prazoEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
          contextoJson: JSON.stringify({
            requisito: "RF-T064",
            checklistItem: "PRIMEIRA_TAREFA",
            papel: novoMembro.papel
          })
        }
      });

      return [conviteAceite, novoMembro];
    });

    await this.registrarActividade(convite.negocioId, {
      autorId: usuarioId,
      tipo: "CONVITE_ACEITE",
      entidadeTipo: "MembroNegocio",
      entidadeId: membro.id,
      resumo: "Novo membro juntou-se à equipa",
      detalhes: { conviteId: convite.id }
    });

    return { convite: conviteAtualizado, membro };
  }

  async reenviarConvite(id: string, negocioId: string) {
    const expiraEm = new Date(Date.now() + HORAS_EXPIRACAO_CONVITE * 60 * 60 * 1000);
    const token = randomUUID();

    return this.prisma.conviteEquipa.update({
      where: { id, negocioId },
      data: {
        token,
        expiraEm,
        reenviadoEm: new Date(),
        estado: "REENVIO"
      }
    });
  }

  async revogarConvite(id: string, negocioId: string) {
    return this.prisma.conviteEquipa.update({
      where: { id, negocioId },
      data: { estado: "EXPIRADO" }
    });
  }

  // ── Internal Notes ─────────────────────────────────────────────────────────

  async criarNota(
    negocioId: string,
    dados: {
      autorId: string;
      entidadeTipo: string;
      entidadeId: string;
      conteudo: string;
      mencoes?: string[];
    }
  ) {
    const nota = await this.prisma.notaInterna.create({
      data: {
        negocioId,
        autorId: dados.autorId,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        conteudo: dados.conteudo,
        mencoesJson: JSON.stringify(dados.mencoes ?? [])
      }
    });

    await this.registrarActividade(negocioId, {
      autorId: dados.autorId,
      tipo: "NOTA_CRIADA",
      entidadeTipo: dados.entidadeTipo,
      entidadeId: dados.entidadeId,
      resumo: "Nova nota interna adicionada",
      detalhes: { notaId: nota.id }
    });

    // RF-T067: notificar membros mencionados via feed
    if (dados.mencoes && dados.mencoes.length > 0) {
      const autor = await this.prisma.membroNegocio.findFirst({
        where: { negocioId, usuarioId: dados.autorId },
        include: { usuario: { select: { nome: true } } }
      });
      const nomeAutor = autor?.usuario?.nome ?? "Alguém";
      const previewConteudo = dados.conteudo.slice(0, 80) + (dados.conteudo.length > 80 ? "…" : "");

      for (const membroId of dados.mencoes) {
        await this.registrarActividade(negocioId, {
          autorId: dados.autorId,
          tipo: "MENCAO_NOTA",
          entidadeTipo: "MembroNegocio",
          entidadeId: membroId,
          resumo: `${nomeAutor} mencionou-te numa nota: "${previewConteudo}"`,
          detalhes: { notaId: nota.id, entidadeTipo: dados.entidadeTipo, entidadeRef: dados.entidadeId }
        });
      }
    }

    return nota;
  }

  async listarNotas(negocioId: string, entidadeTipo: string, entidadeId: string) {
    return this.prisma.notaInterna.findMany({
      where: { negocioId, entidadeTipo, entidadeId },
      orderBy: { criadoEm: "desc" }
    });
  }

  // ── Activity Feed ──────────────────────────────────────────────────────────

  async listarFeed(
    negocioId: string,
    filtros?: { tipo?: string; limite?: number; autorId?: string }
  ) {
    return this.prisma.feedActividade.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.autorId ? { autorId: filtros.autorId } : {})
      },
      orderBy: { criadoEm: "desc" },
      take: filtros?.limite ?? 50
    });
  }

  // ── Personas ───────────────────────────────────────────────────────────────

  async listarPersonas(negocioId: string) {
    return this.prisma.personaPapel.findMany({
      where: {
        ativo: true,
        OR: [{ negocioId }, { negocioId: null }]
      },
      orderBy: { nome: "asc" }
    });
  }

  async criarPersona(
    negocioId: string,
    dados: {
      nome: string;
      descricao?: string;
      papelBase: string;
      permissoes?: Record<string, unknown>;
    }
  ) {
    return this.prisma.personaPapel.create({
      data: {
        negocioId,
        nome: dados.nome,
        descricao: dados.descricao,
        papelBase: dados.papelBase,
        permissoesJson: JSON.stringify(dados.permissoes ?? {}),
        ativo: true
      }
    });
  }

  // ── Onboarding Checklist ───────────────────────────────────────────────────

  async listarChecklistOnboarding(membroId: string) {
    return this.prisma.checklistOnboarding.findMany({
      where: { membroId },
      orderBy: { criadoEm: "asc" }
    });
  }

  async marcarItemOnboarding(membroId: string, item: string) {
    return this.prisma.checklistOnboarding.updateMany({
      where: { membroId, item, concluido: false },
      data: {
        concluido: true,
        concluidoEm: new Date()
      }
    });
  }

  async resumoOnboardingEquipa(negocioId: string) {
    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId },
      include: {
        usuario: { select: { id: true, nome: true, avatarUrl: true } },
        checklistOnboarding: true
      }
    });

    return membros.map((m) => {
      const total = m.checklistOnboarding.length;
      const concluidos = m.checklistOnboarding.filter((c) => c.concluido).length;
      return {
        membroId: m.id,
        nome: m.usuario.nome,
        avatarUrl: m.usuario.avatarUrl,
        papel: m.papel,
        status: m.status,
        onboarding: {
          total,
          concluidos,
          percentagem: total > 0 ? Math.round((concluidos / total) * 100) : 100,
          itens: m.checklistOnboarding
        }
      };
    });
  }

  async obterOnboardingGuiado(negocioId: string, membroId: string) {
    const membro = await this.prisma.membroNegocio.findFirstOrThrow({
      where: { id: membroId, negocioId },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, telefone: true, avatarUrl: true }
        }
      }
    });
    const [checklist, modulos, primeiraTarefa] = await Promise.all([
      this.listarChecklistOnboarding(membroId),
      this.obterModulosVisiveis(negocioId, membroId),
      this.prisma.tarefaOperacional.findFirst({
        where: {
          negocioId,
          responsavelId: membro.usuarioId,
          origem: "ONBOARDING_MEMBRO",
          entidadeTipo: "MembroNegocio",
          entidadeId: membro.id,
          estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] }
        },
        orderBy: { criadaEm: "asc" }
      })
    ]);
    const checklistPorItem = new Map(checklist.map((item) => [item.item, item]));
    const passos = ITENS_ONBOARDING_PADRAO.map((padrao) => {
      const item = checklistPorItem.get(padrao.item);
      return {
        item: padrao.item,
        descricao: item?.descricao ?? padrao.descricao,
        concluido: item?.concluido ?? false,
        concluidoEm: item?.concluidoEm ?? null,
        tipo: this.classificarPassoOnboarding(padrao.item)
      };
    });
    const concluidos = passos.filter((item) => item.concluido).length;

    return {
      membro: {
        id: membro.id,
        usuarioId: membro.usuarioId,
        nome: membro.usuario.nome,
        email: membro.usuario.email,
        telefone: membro.usuario.telefone,
        avatarUrl: membro.usuario.avatarUrl,
        papel: membro.papel,
        status: membro.status
      },
      progresso: {
        total: passos.length,
        concluidos,
        percentagem: passos.length > 0 ? Math.round((concluidos / passos.length) * 100) : 100
      },
      passos,
      tour: {
        modulosPermitidos: modulos.modulosVisiveis,
        modulosOcultos: modulos.modulosOcultos,
        diasRestantes: modulos.diasRestantes
      },
      primeiraTarefa
    };
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async obterMembroPorUsuario(negocioId: string, usuarioId: string) {
    return this.prisma.membroNegocio.findFirst({
      where: { negocioId, usuarioId, status: "ATIVO" }
    });
  }

  async obterMembroDetalhado(negocioId: string, membroId: string) {
    return this.prisma.membroNegocio.findFirst({
      where: { id: membroId, negocioId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async registarVisualizacaoModoSombra(negocioId: string, alvoMembroId: string, autorId: string) {
    // RF-T115: simulação de visão é auditada porque expõe a perspectiva operacional de outro membro.
    return this.registrarActividade(negocioId, {
      autorId,
      tipo: "MODO_SOMBRA_CONSULTADO",
      entidadeTipo: "MembroNegocio",
      entidadeId: alvoMembroId,
      resumo: "Modo Sombra consultado por gestor",
      detalhes: { alvoMembroId }
    });
  }

  async listarMembros(
    negocioId: string,
    filtros: FiltrosMembrosNegocio = {}
  ): Promise<{ membros: Awaited<ReturnType<PrismaClient["membroNegocio"]["findMany"]>>; paginacao: PaginacaoOffset }> {
    const limite = normalizarLimitePaginacao(filtros.limite, LIMITE_PAGINA_MEMBROS, LIMITE_PAGINA_MEMBROS);
    const offset = normalizarOffsetPaginacao(filtros.offset);
    const where = this.montarWhereMembros(negocioId, filtros);
    const [membros, total] = await Promise.all([
      this.prisma.membroNegocio.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              email: true,
              avatarUrl: true,
              papel: true
            }
          }
        },
        orderBy: { criadoEm: "asc" },
        take: limite,
        skip: offset
      }),
      this.prisma.membroNegocio.count({ where })
    ]);

    return {
      membros,
      paginacao: montarPaginacaoOffset(total, limite, offset)
    };
  }

  async obterPerfilOperacional360(negocioId: string, membroId: string) {
    const membro = await this.prisma.membroNegocio.findFirst({
      where: { id: membroId, negocioId },
      include: {
        departamento: { select: { id: true, nome: true } },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            avatarUrl: true,
            papel: true
          }
        }
      }
    });
    if (!membro) throw new Error("Membro não encontrado neste negócio.");

    const [
      checklist,
      turnos,
      tarefasAbertas,
      conversasAbertas,
      pedidosAbertos,
      projectos,
      projectosSemOwner,
      metas,
      feed,
      presencasRecentes,
      eventosAusencia
    ] =
      await Promise.all([
        this.prisma.checklistOnboarding.findMany({ where: { negocioId, membroId }, orderBy: { criadoEm: "asc" } }),
        this.prisma.turnoMembro.findMany({ where: { negocioId, membroId, activo: true }, orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] }),
        this.prisma.tarefaOperacional.findMany({
          where: { negocioId, responsavelId: membro.usuarioId, estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] } },
          select: { id: true, titulo: true, prioridade: true, estado: true, prazoEm: true },
          orderBy: [{ prioridade: "desc" }, { prazoEm: "asc" }],
          take: 20
        }),
        this.prisma.conversaAtendimento.findMany({
          where: { negocioId, responsavelId: membro.usuarioId, estado: { in: ["ABERTA", "EM_ATENDIMENTO"] } },
          select: { id: true, telefone: true, estado: true, prioridade: true, ultimaMensagemEm: true },
          orderBy: { ultimaMensagemEm: "desc" },
          take: 20
        }),
        this.prisma.pedido.findMany({
          where: { negocioId, responsavelId: membro.usuarioId, estado: { in: ["AGUARDANDO_PAGAMENTO", "PENDENTE", "EM_PROCESSAMENTO"] } },
          select: { id: true, numero: true, estado: true, estadoPagamento: true, estadoEntrega: true, totalEmKwanza: true },
          orderBy: { criadoEm: "desc" },
          take: 20
        }),
        this.prisma.membroProjecto.findMany({
          where: { membroId, activo: true, projecto: { negocioId } },
          include: {
            projecto: {
              select: { id: true, nome: true, estado: true, dataInicio: true, dataFim: true, gestorId: true }
            }
          },
          take: 20
        }),
        this.prisma.projecto.findMany({
          where: {
            negocioId,
            estado: { in: ["PLANEADO", "EM_ANDAMENTO"] },
            OR: [{ gestorId: null }, { gestorId: "" }]
          },
          select: { id: true, nome: true, estado: true, dataFim: true },
          take: 20
        }),
        this.prisma.metaVendas.findMany({
          where: {
            negocioId,
            OR: [{ membroId: membro.id }, { tipo: "EQUIPA" }]
          },
          orderBy: { criadoEm: "desc" },
          take: 20
        }),
        this.prisma.feedActividade.findMany({
          where: { negocioId, OR: [{ autorId: membro.usuarioId }, { entidadeTipo: "MembroNegocio", entidadeId: membroId }] },
          orderBy: { criadoEm: "desc" },
          take: 20
        }),
        this.prisma.registoPresenca.findMany({
          where: { negocioId, membroId },
          orderBy: { registadoEm: "desc" },
          take: 10
        }),
        this.prisma.feedActividade.findMany({
          where: {
            negocioId,
            tipo: "AUSENCIA_OPERACIONAL",
            entidadeTipo: "MembroNegocio",
            entidadeId: membroId
          },
          orderBy: { criadoEm: "desc" },
          take: 20
        })
      ]);

    const checklistConcluido = checklist.filter((item) => item.concluido).length;
    const emTurno = this.estaEmTurnoAgora(turnos);
    const agora = new Date();
    const ausenciaAtiva = this.extrairAusenciasAtivas(eventosAusencia, agora).at(0) ?? null;
    const ultimaPresenca = presencasRecentes.at(0) ?? null;
    const tarefasAtrasadas = tarefasAbertas.filter((tarefa) => tarefa.prazoEm && tarefa.prazoEm < agora);
    const conversasForaSla = conversasAbertas.filter((conversa) => this.conversaForaSla(conversa.ultimaMensagemEm, agora));
    const permissoes = this.parseJsonRecord(membro.permissoesJson);
    const riscosOperacionais = [
      PAPEIS_SENSIVEIS.includes(membro.papel) ? "PAPEL_SENSIVEL" : null,
      ausenciaAtiva ? "AUSENCIA_ATIVA" : null,
      tarefasAtrasadas.length > 0 ? "TAREFAS_ATRASADAS" : null,
      conversasForaSla.length > 0 ? "CONVERSAS_FORA_SLA" : null,
      projectosSemOwner.length > 0 ? "PROJECTOS_SEM_OWNER" : null
    ].filter((item): item is string => Boolean(item));

    return {
      membro: {
        id: membro.id,
        usuarioId: membro.usuarioId,
        nome: membro.usuario.nome,
        email: membro.usuario.email,
        telefone: membro.usuario.telefone,
        avatarUrl: membro.usuario.avatarUrl,
        papel: membro.papel,
        cargo: membro.cargo,
        departamento: membro.departamento,
        status: membro.status,
        criadoEm: membro.criadoEm
      },
      competencias: this.inferirCompetenciasMembro(membro),
      skills: this.parseJsonArray(membro.skillsJson),
      desenvolvimento: this.parseJsonArray(membro.desenvolvimentoJson),
      disponibilidade: {
        emTurno,
        presencaAtiva: ultimaPresenca?.tipo === "CHECK_IN",
        ultimaPresenca: this.serializarPresencaOperacional(ultimaPresenca),
        ausenciaAtiva,
        turnos,
        presencasRecentes
      },
      cargaOperacional: {
        tarefasAbertas: tarefasAbertas.length,
        conversasAbertas: conversasAbertas.length,
        pedidosAbertos: pedidosAbertos.length,
        projectosActivos: projectos.length,
        tarefas: tarefasAbertas,
        conversas: conversasAbertas,
        pedidos: pedidosAbertos,
        projectos: projectos.map((item) => ({
          id: item.projecto.id,
          nome: item.projecto.nome,
          estado: item.projecto.estado,
          papelProjecto: item.papelProjecto,
          dataInicio: item.projecto.dataInicio,
          dataFim: item.projecto.dataFim
        }))
      },
      desempenho: {
        tarefasAtrasadas: tarefasAtrasadas.length,
        conversasForaSla: conversasForaSla.length,
        pedidosPendentesValorEmKwanza: pedidosAbertos.reduce((total, pedido) => total + pedido.totalEmKwanza, 0),
        slaConversaMinutos: MINUTOS_SLA_CONVERSA,
        fonte: "operacional"
      },
      metas: metas.map((meta) => ({
        id: meta.id,
        tipo: meta.tipo,
        kpi: meta.kpi,
        periodo: meta.periodo,
        valorMeta: meta.valorMeta,
        mes: meta.mes,
        ano: meta.ano,
        escopo: meta.membroId === membro.id ? "INDIVIDUAL" : "EQUIPA"
      })),
      acessos: {
        papel: membro.papel,
        permissoes,
        papelSensivel: PAPEIS_SENSIVEIS.includes(membro.papel),
        requerRevisao: membro.status !== "ATIVO" || PAPEIS_SENSIVEIS.includes(membro.papel)
      },
      onboarding: {
        total: checklist.length,
        concluidos: checklistConcluido,
        percentagem: checklist.length > 0 ? Math.round((checklistConcluido / checklist.length) * 100) : 100,
        checklist
      },
      indicadores: {
        sinaisSensíveis: riscosOperacionais,
        requerRevisaoAcesso: membro.status !== "ATIVO" || PAPEIS_SENSIVEIS.includes(membro.papel),
        projectosSemOwner,
        fonte: "dados_operacionais_team"
      },
      actividadeRecente: feed
    };
  }

  async atualizarPerfilOperacional(
    negocioId: string,
    membroId: string,
    dados: { departamentoId?: string | null; cargo?: string | null; autorId?: string | null }
  ) {
    const membro = await this.prisma.membroNegocio.findFirst({ where: { id: membroId, negocioId } });
    if (!membro) throw new Error("Membro não encontrado neste negócio.");

    if (dados.departamentoId) {
      const departamento = await this.prisma.departamento.findFirst({
        where: { id: dados.departamentoId, negocioId },
        select: { id: true }
      });
      if (!departamento) throw new Error("Departamento não encontrado neste negócio.");
    }

    const atualizado = await this.prisma.membroNegocio.update({
      where: { id: membroId },
      data: {
        ...(dados.departamentoId !== undefined ? { departamentoId: dados.departamentoId } : {}),
        ...(dados.cargo !== undefined ? { cargo: dados.cargo?.trim() || null } : {})
      },
      include: { departamento: { select: { id: true, nome: true } } }
    });

    await this.registrarActividade(negocioId, {
      autorId: dados.autorId ?? undefined,
      tipo: "PERFIL_OPERACIONAL_ATUALIZADO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroId,
      resumo: "Departamento e cargo do membro foram atualizados.",
      detalhes: {
        anterior: { departamentoId: membro.departamentoId, cargo: membro.cargo },
        atual: { departamentoId: atualizado.departamentoId, cargo: atualizado.cargo }
      }
    });

    return atualizado;
  }

  async atualizarSkillsMembro(
    negocioId: string,
    membroId: string,
    skills: Array<{
      id?: string;
      nome: string;
      categoria: string;
      nivel: number;
      estado?: "DECLARADA" | "VALIDADA" | "EXPIRADA";
      evidencias?: string[];
    }>,
    autorId?: string | null
  ) {
    const membro = await this.prisma.membroNegocio.findFirst({ where: { id: membroId, negocioId } });
    if (!membro) throw new Error("Membro não encontrado neste negócio.");

    const agora = new Date().toISOString();
    const normalizadas = skills.map((skill) => ({
      id: skill.id ?? randomUUID(),
      nome: skill.nome.trim(),
      categoria: skill.categoria,
      nivel: skill.nivel,
      estado: skill.estado ?? "DECLARADA",
      evidencias: [...new Set((skill.evidencias ?? []).map((item) => item.trim()).filter(Boolean))],
      validadoPorId: skill.estado === "VALIDADA" ? autorId ?? null : null,
      validadoEm: skill.estado === "VALIDADA" ? agora : null,
      atualizadoEm: agora
    }));

    await this.prisma.membroNegocio.update({
      where: { id: membroId },
      data: { skillsJson: JSON.stringify(normalizadas) }
    });
    await this.registrarActividade(negocioId, {
      autorId: autorId ?? undefined,
      tipo: "SKILLS_ATUALIZADAS",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroId,
      resumo: `${normalizadas.length} skill(s) atualizadas no perfil operacional.`,
      detalhes: { skills: normalizadas.map(({ id, nome, categoria, nivel, estado }) => ({ id, nome, categoria, nivel, estado })) }
    });

    return { membroId, skills: normalizadas };
  }

  async criarItemDesenvolvimento(
    negocioId: string,
    membroId: string,
    dados: {
      objetivo: string;
      acao: string;
      prazoEm: Date;
      evidencias?: string[];
      gestorId?: string | null;
      autorId?: string | null;
    }
  ) {
    const membro = await this.prisma.membroNegocio.findFirst({ where: { id: membroId, negocioId } });
    if (!membro) throw new Error("Membro não encontrado neste negócio.");

    const itens = this.parseJsonArray<Record<string, unknown>>(membro.desenvolvimentoJson);
    const agora = new Date().toISOString();
    const item = {
      id: randomUUID(),
      objetivo: dados.objetivo.trim(),
      acao: dados.acao.trim(),
      prazoEm: dados.prazoEm.toISOString(),
      evidencias: [...new Set((dados.evidencias ?? []).map((valor) => valor.trim()).filter(Boolean))],
      estado: "EM_ANDAMENTO",
      gestorId: dados.gestorId ?? dados.autorId ?? null,
      acompanhadoEm: agora,
      criadoEm: agora,
      atualizadoEm: agora
    };
    await this.prisma.membroNegocio.update({
      where: { id: membroId },
      data: { desenvolvimentoJson: JSON.stringify([...itens, item]) }
    });
    await this.registrarActividade(negocioId, {
      autorId: dados.autorId ?? undefined,
      tipo: "PLANO_DESENVOLVIMENTO_CRIADO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroId,
      resumo: `Plano de desenvolvimento criado: ${item.objetivo}`,
      detalhes: item
    });
    return { membroId, item };
  }

  async acompanharItemDesenvolvimento(
    negocioId: string,
    membroId: string,
    itemId: string,
    dados: { estado?: "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO"; evidencias?: string[]; observacao?: string | null; autorId?: string | null }
  ) {
    const membro = await this.prisma.membroNegocio.findFirst({ where: { id: membroId, negocioId } });
    if (!membro) throw new Error("Membro não encontrado neste negócio.");
    const itens = this.parseJsonArray<Record<string, unknown>>(membro.desenvolvimentoJson);
    const indice = itens.findIndex((item) => item.id === itemId);
    if (indice < 0) throw new Error("Item de desenvolvimento não encontrado.");

    const agora = new Date().toISOString();
    const atual = itens[indice];
    const evidenciasAtuais = Array.isArray(atual.evidencias) ? atual.evidencias.filter((item): item is string => typeof item === "string") : [];
    const atualizado = {
      ...atual,
      ...(dados.estado ? { estado: dados.estado } : {}),
      ...(dados.evidencias ? { evidencias: [...new Set([...evidenciasAtuais, ...dados.evidencias.map((item) => item.trim()).filter(Boolean)])] } : {}),
      observacao: dados.observacao?.trim() || atual.observacao || null,
      gestorId: dados.autorId ?? atual.gestorId ?? null,
      acompanhadoEm: agora,
      atualizadoEm: agora
    };
    itens[indice] = atualizado;
    await this.prisma.membroNegocio.update({
      where: { id: membroId },
      data: { desenvolvimentoJson: JSON.stringify(itens) }
    });
    await this.registrarActividade(negocioId, {
      autorId: dados.autorId ?? undefined,
      tipo: "PLANO_DESENVOLVIMENTO_ACOMPANHADO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroId,
      resumo: `Plano de desenvolvimento acompanhado: ${String(atual.objetivo ?? itemId)}`,
      detalhes: atualizado
    });
    return { membroId, item: atualizado };
  }

  async calcularCapacidadeOperacional(negocioId: string) {
    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId, status: "ATIVO" },
      include: { usuario: { select: { id: true, nome: true, telefone: true, email: true } } },
      orderBy: { criadoEm: "asc" }
    });

    const agora = new Date();
    const inicioJanelaPresenca = new Date(agora.getTime() - 48 * 60 * 60 * 1000);
    const [turnos, tarefas, conversas, pedidos, projectos, eventosAusencia, presencasRecentes] = await Promise.all([
      this.prisma.turnoMembro.findMany({ where: { negocioId, activo: true } }),
      this.prisma.tarefaOperacional.findMany({
        where: { negocioId, estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] } },
        select: { responsavelId: true, prazoEm: true, prioridade: true }
      }),
      this.prisma.conversaAtendimento.findMany({
        where: { negocioId, estado: { in: ["ABERTA", "EM_ATENDIMENTO"] } },
        select: { responsavelId: true, ultimaMensagemEm: true, prioridade: true }
      }),
      this.prisma.pedido.findMany({
        where: { negocioId, estado: { in: ["AGUARDANDO_PAGAMENTO", "PENDENTE", "EM_PROCESSAMENTO"] } },
        select: { responsavelId: true }
      }),
      this.prisma.membroProjecto.findMany({
        where: { activo: true, projecto: { negocioId, estado: { in: ["PLANEADO", "EM_ANDAMENTO"] } } },
        select: { membroId: true }
      }),
      this.prisma.feedActividade.findMany({
        where: { negocioId, tipo: "AUSENCIA_OPERACIONAL" },
        orderBy: { criadoEm: "desc" },
        take: 1000
      }),
      this.prisma.registoPresenca.findMany({
        where: { negocioId, registadoEm: { gte: inicioJanelaPresenca } },
        orderBy: { registadoEm: "desc" },
        take: 2000
      })
    ]);

    const tarefasPorUsuario = this.contarPorChave(tarefas.map((item) => item.responsavelId));
    const tarefasAtrasadasPorUsuario = this.contarPorChave(tarefas.filter((item) => item.prazoEm && item.prazoEm < agora).map((item) => item.responsavelId));
    const conversasPorUsuario = this.contarPorChave(conversas.map((item) => item.responsavelId));
    const conversasForaSlaPorUsuario = this.contarPorChave(conversas.filter((item) => this.conversaForaSla(item.ultimaMensagemEm, agora)).map((item) => item.responsavelId));
    const pedidosPorUsuario = this.contarPorChave(pedidos.map((item) => item.responsavelId));
    const projectosPorMembro = this.contarPorChave(projectos.map((item) => item.membroId));
    const ausenciasPorMembro = new Map(this.extrairAusenciasAtivas(eventosAusencia, agora).map((item) => [item.membroId, item]));
    const ultimaPresencaPorMembro = this.mapearUltimaPresencaPorMembro(presencasRecentes);
    const turnosPorMembro = new Map<string, typeof turnos>();
    for (const turno of turnos) {
      turnosPorMembro.set(turno.membroId, [...(turnosPorMembro.get(turno.membroId) ?? []), turno]);
    }

    const capacidade = membros.map((membro) => {
      const totalTarefas = tarefasPorUsuario.get(membro.usuarioId) ?? 0;
      const totalTarefasAtrasadas = tarefasAtrasadasPorUsuario.get(membro.usuarioId) ?? 0;
      const totalConversas = conversasPorUsuario.get(membro.usuarioId) ?? 0;
      const totalConversasForaSla = conversasForaSlaPorUsuario.get(membro.usuarioId) ?? 0;
      const totalPedidos = pedidosPorUsuario.get(membro.usuarioId) ?? 0;
      const totalProjectos = projectosPorMembro.get(membro.id) ?? 0;
      const turnosMembro = turnosPorMembro.get(membro.id) ?? [];
      const emTurno = this.estaEmTurnoAgora(turnosMembro);
      const ausenciaAtiva = ausenciasPorMembro.get(membro.id) ?? null;
      const ultimaPresenca = ultimaPresencaPorMembro.get(membro.id) ?? null;
      const presencaAtiva = ultimaPresenca?.tipo === "CHECK_IN";
      const baseDisponivel = ausenciaAtiva
        ? 0
        : presencaAtiva
          ? emTurno
            ? 100
            : 85
          : emTurno
            ? 70
            : turnosMembro.length > 0
              ? 35
              : 45;
      const cargaPonderada =
        totalTarefas * 2 +
        totalConversas +
        totalPedidos * 2 +
        totalProjectos * 3 +
        totalTarefasAtrasadas * 3 +
        totalConversasForaSla * 2;
      const capacidadePercentual = ausenciaAtiva ? 0 : Math.max(0, Math.min(100, baseDisponivel - cargaPonderada * 5));
      const estado = ausenciaAtiva
        ? "INDISPONIVEL"
        : capacidadePercentual >= 65
          ? "DISPONIVEL"
          : capacidadePercentual >= 30
            ? "OCUPADO"
            : "SOBRECARREGADO";

      return {
        membroId: membro.id,
        usuarioId: membro.usuarioId,
        nome: membro.usuario.nome,
        papel: membro.papel,
        estado,
        capacidadePercentual,
        emTurno,
        presencaAtiva,
        ultimaPresenca: this.serializarPresencaOperacional(ultimaPresenca),
        ausenciaAtiva,
        carga: {
          tarefas: totalTarefas,
          tarefasAtrasadas: totalTarefasAtrasadas,
          conversas: totalConversas,
          conversasForaSla: totalConversasForaSla,
          pedidos: totalPedidos,
          projectos: totalProjectos,
          ponderada: cargaPonderada
        },
        sla: {
          conversaMinutos: MINUTOS_SLA_CONVERSA,
          tarefasAtrasadas: totalTarefasAtrasadas,
          conversasForaSla: totalConversasForaSla
        }
      };
    });

    return {
      atualizadoEm: new Date().toISOString(),
      resumo: {
        membrosAtivos: capacidade.length,
        disponiveis: capacidade.filter((item) => item.estado === "DISPONIVEL").length,
        ocupados: capacidade.filter((item) => item.estado === "OCUPADO").length,
        sobrecarregados: capacidade.filter((item) => item.estado === "SOBRECARREGADO").length,
        indisponiveis: capacidade.filter((item) => item.estado === "INDISPONIVEL").length,
        presentes: capacidade.filter((item) => item.presencaAtiva).length,
        tarefasAtrasadas: capacidade.reduce((total, item) => total + item.sla.tarefasAtrasadas, 0),
        conversasForaSla: capacidade.reduce((total, item) => total + item.sla.conversasForaSla, 0)
      },
      membros: capacidade
    };
  }

  async obterGovernancaPessoas(negocioId: string) {
    const [membros, convites, presencas, capacidade] = await Promise.all([
      this.prisma.membroNegocio.findMany({
        where: { negocioId },
        select: {
          id: true,
          papel: true,
          status: true,
          departamentoId: true,
          skillsJson: true,
          desenvolvimentoJson: true,
          criadoEm: true,
          atualizadoEm: true
        }
      }),
      this.prisma.conviteEquipa.findMany({ where: { negocioId }, select: { estado: true, criadoEm: true } }),
      this.prisma.registoPresenca.count({ where: { negocioId } }),
      this.calcularCapacidadeOperacional(negocioId)
    ]);
    const ativos = membros.filter((membro) => membro.status === "ATIVO");
    const desligados = membros.filter((membro) => membro.status !== "ATIVO");
    const contar = (valores: Array<string | null>) => valores.reduce<Record<string, number>>((acc, valor) => {
      const chave = valor || "NAO_DEFINIDO";
      acc[chave] = (acc[chave] ?? 0) + 1;
      return acc;
    }, {});
    const skills = membros.flatMap((membro) => this.parseJsonArray(membro.skillsJson));
    const desenvolvimento = membros.flatMap((membro) => this.parseJsonArray(membro.desenvolvimentoJson));
    const sobrecarga = capacidade.membros.filter((membro) => membro.estado === "SOBRECARREGADO").length;
    return {
      atualizadoEm: new Date().toISOString(),
      classificacao: "CONFIDENCIAL_PESSOAS_AGREGADO",
      indicadores: {
        composicao: { total: membros.length, ativos: ativos.length, porPapel: contar(ativos.map((membro) => membro.papel)), porDepartamento: contar(ativos.map((membro) => membro.departamentoId)) },
        rotatividade: { desligados: desligados.length, taxaPercentual: membros.length ? Math.round((desligados.length / membros.length) * 100) : 0 },
        produtividadeOperacional: { disponiveis: capacidade.resumo.disponiveis, ocupados: capacidade.resumo.ocupados, sobrecarregados: sobrecarga, tarefasAtrasadas: capacidade.resumo.tarefasAtrasadas },
        bemEstarOperacional: { sinalSobrecarga: sobrecarga, fonte: "carga operacional agregada; não é diagnóstico de saúde" },
        competencias: { skillsRegistadas: skills.length, membrosComSkills: membros.filter((membro) => this.parseJsonArray(membro.skillsJson).length > 0).length },
        recrutamento: { convites: convites.length, porEstado: contar(convites.map((convite) => convite.estado)) },
        mobilidade: { departamentosRepresentados: new Set(ativos.map((membro) => membro.departamentoId).filter(Boolean)).size },
        desenvolvimento: { planos: desenvolvimento.length, membrosComPlano: membros.filter((membro) => this.parseJsonArray(membro.desenvolvimentoJson).length > 0).length },
        presenca: { registos: presencas, presentesAgora: capacidade.resumo.presentes }
      },
      politicaDecisao: {
        finalidade: "operação, capacidade e desenvolvimento",
        proibido: ["punição automática", "despedimento automático", "redução automática de acesso sensível"],
        revisaoHumanaObrigatoria: true,
        acesso: "necessidade de conhecimento e equipa:gestao"
      },
      referenciaGovernanca: "ISO 30414-inspired; não representa certificação formal"
    };
  }

  async registarAusenciaOperacional(
    negocioId: string,
    dados: { membroId: string; substitutoMembroId?: string; motivo: string; inicioEm?: Date; fimEm?: Date; autorId?: string | null }
  ) {
    const membro = await this.prisma.membroNegocio.findFirst({
      where: { id: dados.membroId, negocioId },
      include: { usuario: { select: { id: true, nome: true } } }
    });
    if (!membro) throw new Error("Membro não encontrado neste negócio.");

    const inicioEm = dados.inicioEm ?? new Date();
    const fimEm = dados.fimEm ?? new Date(inicioEm.getFullYear(), inicioEm.getMonth(), inicioEm.getDate(), 23, 59, 59, 999);
    if (fimEm < inicioEm) throw new Error("Fim da ausência deve ser posterior ao início.");

    let substituicao: Record<string, unknown> | null = null;
    if (dados.substitutoMembroId) {
      if (dados.substitutoMembroId === membro.id) throw new Error("O substituto deve ser outro membro.");
      const substituto = await this.prisma.membroNegocio.findFirst({
        where: { id: dados.substitutoMembroId, negocioId, status: "ATIVO" },
        include: { usuario: { select: { id: true, nome: true } } }
      });
      if (!substituto) throw new Error("Substituto activo não encontrado neste negócio.");
      const [tarefas, conversas, pedidos, filas, projectos, projectosComerciais] = await this.prisma.$transaction([
        this.prisma.tarefaOperacional.updateMany({
          where: { negocioId, responsavelId: membro.usuarioId, estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] } },
          data: { responsavelId: substituto.usuarioId }
        }),
        this.prisma.conversaAtendimento.updateMany({
          where: { negocioId, responsavelId: membro.usuarioId, estado: { in: ["ABERTA", "EM_ATENDIMENTO"] } },
          data: { responsavelId: substituto.usuarioId }
        }),
        this.prisma.pedido.updateMany({
          where: { negocioId, responsavelId: membro.usuarioId, estado: { in: ["AGUARDANDO_PAGAMENTO", "PENDENTE", "EM_PROCESSAMENTO"] } },
          data: { responsavelId: substituto.usuarioId }
        }),
        this.prisma.filaProjeto.updateMany({
          where: { atribuidoAId: membro.id, estado: { in: ["PENDENTE", "ATRIBUIDO"] } },
          data: { atribuidoAId: substituto.id }
        }),
        this.prisma.membroProjecto.findMany({ where: { membroId: membro.id, activo: true } }),
        this.prisma.equipaProjeto.findMany({ where: { membroId: membro.id, activo: true } })
      ]);
      for (const alocacao of projectos) {
        await this.prisma.membroProjecto.upsert({
          where: { projectoId_membroId: { projectoId: alocacao.projectoId, membroId: substituto.id } },
          create: {
            projectoId: alocacao.projectoId,
            membroId: substituto.id,
            papelProjecto: "SUBSTITUTO_TEMPORARIO",
            capacidadePercentual: alocacao.capacidadePercentual,
            alocadoAte: fimEm
          },
          update: { activo: true, papelProjecto: "SUBSTITUTO_TEMPORARIO", alocadoAte: fimEm }
        });
      }
      for (const alocacao of projectosComerciais) {
        await this.prisma.equipaProjeto.upsert({
          where: { projetoComercialId_membroId: { projetoComercialId: alocacao.projetoComercialId, membroId: substituto.id } },
          create: {
            projetoComercialId: alocacao.projetoComercialId,
            membroId: substituto.id,
            papelProjeto: "SUBSTITUTO_TEMPORARIO",
            alocadoAte: fimEm
          },
          update: { activo: true, papelProjeto: "SUBSTITUTO_TEMPORARIO", alocadoAte: fimEm }
        });
      }
      substituicao = {
        membroId: substituto.id,
        nome: substituto.usuario.nome,
        tarefas: tarefas.count,
        conversas: conversas.count,
        pedidos: pedidos.count,
        filas: filas.count,
        projectos: projectos.length,
        projectosComerciais: projectosComerciais.length,
        temporariaAte: fimEm.toISOString()
      };
    }

    const feed = await this.registrarActividade(negocioId, {
      autorId: dados.autorId ?? undefined,
      tipo: "AUSENCIA_OPERACIONAL",
      entidadeTipo: "MembroNegocio",
      entidadeId: membro.id,
      resumo: `${membro.usuario.nome} indisponível: ${dados.motivo}`,
      detalhes: {
        membroId: membro.id,
        usuarioId: membro.usuarioId,
        inicioEm: inicioEm.toISOString(),
        fimEm: fimEm.toISOString(),
        motivo: dados.motivo,
        substituicao
      }
    });

    return {
      ausencia: {
        id: feed.id,
        membroId: membro.id,
        usuarioId: membro.usuarioId,
        nome: membro.usuario.nome,
        motivo: dados.motivo,
        inicioEm,
        fimEm,
        substituicao
      }
    };
  }

  async executarOffboardingSeguro(
    membroNegocioId: string,
    negocioId: string,
    dados: { motivo?: string | null; substitutoMembroId?: string | null; autorId?: string | null } = {}
  ) {
    const perfilAntes = await this.obterPerfilOperacional360(negocioId, membroNegocioId);
    const membro = await this.desativarMembro(membroNegocioId, negocioId);
    const checklist = [
      { item: "REVOGAR_ACESSOS", estado: "PENDENTE", descricao: "Validar permissões, sessões e integrações do membro." },
      { item: "TRANSFERIR_RESPONSABILIDADES", estado: "PENDENTE", descricao: "Confirmar conversas, tarefas, pedidos e projectos sem dono." },
      { item: "DOCUMENTAR_MOTIVO", estado: "CONCLUIDO", descricao: dados.motivo || "Offboarding seguro iniciado pelo Team." },
      { item: "COMUNICAR_EQUIPA", estado: "PENDENTE", descricao: "Informar equipa e substituto quando aplicável." }
    ];

    await this.registrarActividade(negocioId, {
      autorId: dados.autorId ?? undefined,
      tipo: "OFFBOARDING_SEGURO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroNegocioId,
      resumo: "Offboarding seguro iniciado com redistribuição operacional.",
      detalhes: {
        motivo: dados.motivo ?? null,
        substitutoMembroId: dados.substitutoMembroId ?? null,
        cargaAntes: perfilAntes.cargaOperacional,
        checklist
      }
    });

    return {
      membro,
      estado: "INICIADO",
      checklist,
      cargaAntes: perfilAntes.cargaOperacional,
      substitutoMembroId: dados.substitutoMembroId ?? null,
      executadoEm: new Date().toISOString()
    };
  }

  private montarWhereMembros(negocioId: string, filtros: FiltrosMembrosNegocio = {}): Prisma.MembroNegocioWhereInput {
    const busca = filtros.busca?.trim();
    return {
      negocioId,
      ...(filtros.status ? { status: filtros.status } : {}),
      ...(busca
        ? {
            OR: [
              { usuario: { nome: { contains: busca, mode: "insensitive" } } },
              { usuario: { telefone: { contains: busca, mode: "insensitive" } } },
              { usuario: { email: { contains: busca, mode: "insensitive" } } }
            ]
          }
        : {})
    };
  }

  async desativarMembro(membroNegocioId: string, negocioId: string) {
    const membro = await this.prisma.membroNegocio.findUnique({
      where: { id: membroNegocioId }
    });

    if (!membro || membro.negocioId !== negocioId) {
      throw new Error("Membro não encontrado neste negócio.");
    }

    if (membro.papel === "DONO") {
      const totalDonos = await this.prisma.membroNegocio.count({
        where: { negocioId, papel: "DONO", status: "ATIVO" }
      });

      if (totalDonos <= 1) {
        throw new Error(
          "RN-T010: Não é possível desativar o último dono do negócio."
        );
      }
    }

    const membroAtualizado = await this.prisma.membroNegocio.update({
      where: { id: membroNegocioId },
      data: { status: "SUSPENSO" }
    });

    // RN-T013: redistribuir conversas e tarefas abertas do membro suspenso
    const conversasRedistribuidas = await this.prisma.conversaAtendimento.updateMany({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        estado: { in: ["ABERTA", "EM_ATENDIMENTO"] }
      },
      data: { responsavelId: null }
    });

    const tarefasRedistribuidas = await this.prisma.tarefaOperacional.updateMany({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] }
      },
      data: { responsavelId: null }
    });

    const totalRedistribuidos = conversasRedistribuidas.count + tarefasRedistribuidas.count;

    await this.registrarActividade(negocioId, {
      tipo: "MEMBRO_DESATIVADO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroNegocioId,
      resumo: `Membro da equipa foi suspenso. ${conversasRedistribuidas.count} conversa(s) e ${tarefasRedistribuidas.count} tarefa(s) foram desatribuídas.`,
      detalhes: {
        papel: membro.papel,
        conversasDesatribuidas: conversasRedistribuidas.count,
        tarefasDesatribuidas: tarefasRedistribuidas.count,
        totalRedistribuidos
      }
    });

    return membroAtualizado;
  }

  // ── Mascaramento de Dados ───────────────────────────────────────────────────

  async listarMascaramento(negocioId: string) {
    return this.prisma.mascaramentoDados.findMany({
      where: { negocioId },
      orderBy: [{ papel: "asc" }, { campo: "asc" }]
    });
  }

  async configurarMascaramento(
    negocioId: string,
    dados: { papel: string; campo: string; tipo?: string }
  ) {
    return this.prisma.mascaramentoDados.upsert({
      where: {
        negocioId_papel_campo: {
          negocioId,
          papel: dados.papel,
          campo: dados.campo
        }
      },
      create: {
        negocioId,
        papel: dados.papel,
        campo: dados.campo,
        tipo: dados.tipo ?? "PARCIAL"
      },
      update: {
        tipo: dados.tipo ?? "PARCIAL"
      }
    });
  }

  async removerMascaramento(id: string, negocioId: string) {
    return this.prisma.mascaramentoDados.deleteMany({
      where: { id, negocioId }
    });
  }

  // ── Desempenho / KPIs ──────────────────────────────────────────────────────

  async obterDesempenhoEquipa(
    negocioId: string,
    periodo?: { de: Date; ate: Date },
    solicitanteId?: string
  ) {
    const de = periodo?.de ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ate = periodo?.ate ?? new Date();

    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId, status: "ATIVO" },
      include: {
        usuario: {
          select: { id: true, nome: true, avatarUrl: true, papel: true }
        }
      }
    });

    const usuarioIds = membros.map((m) => m.usuario.id);

    const [pedidos, conversas, tarefas] = await Promise.all([
      this.prisma.pedido.findMany({
        where: {
          negocioId,
          responsavelId: { in: usuarioIds },
          criadoEm: { gte: de, lte: ate }
        },
        select: { responsavelId: true, totalEmKwanza: true, estadoPagamento: true }
      }),
      this.prisma.conversaAtendimento.findMany({
        where: {
          negocioId,
          responsavelId: { in: usuarioIds },
          criadaEm: { gte: de, lte: ate }
        },
        select: { responsavelId: true, estado: true }
      }),
      this.prisma.tarefaOperacional.findMany({
        where: {
          negocioId,
          responsavelId: { in: usuarioIds },
          criadaEm: { gte: de, lte: ate }
        },
        select: { responsavelId: true, estado: true, concluidaEm: true, prazoEm: true }
      })
    ]);

    const pedidosPorResponsavel = this.agruparPorResponsavel(pedidos);
    const conversasPorResponsavel = this.agruparPorResponsavel(conversas);
    const tarefasPorResponsavel = this.agruparPorResponsavel(tarefas);

    const kpisPorMembro = membros.map((m) => {
      const uid = m.usuario.id;

      const pedidosMembro = pedidosPorResponsavel.get(uid) ?? [];
      const totalVendas = pedidosMembro.length;
      const receitaTotal = pedidosMembro.reduce((s, p) => s + p.totalEmKwanza, 0);
      const pedidosPagos = pedidosMembro.filter((p) => p.estadoPagamento === "CONFIRMADO").length;

      const conversasMembro = conversasPorResponsavel.get(uid) ?? [];
      const totalConversas = conversasMembro.length;
      const conversasResolvidas = conversasMembro.filter((c) => c.estado === "RESOLVIDA").length;

      const tarefasMembro = tarefasPorResponsavel.get(uid) ?? [];
      const totalTarefas = tarefasMembro.length;
      const tarefasConcluidas = tarefasMembro.filter((t) => t.estado === "CONCLUIDA").length;
      const tarefasNoPrazo = tarefasMembro.filter(
        (t) => t.estado === "CONCLUIDA" && t.concluidaEm && t.prazoEm && t.concluidaEm <= t.prazoEm
      ).length;

      const taxaConversao = totalVendas > 0 ? Math.round((pedidosPagos / totalVendas) * 100) : 0;

      return {
        membroId: m.id,
        usuarioId: uid,
        nome: m.usuario.nome,
        avatarUrl: m.usuario.avatarUrl,
        papel: m.papel,
        kpis: {
          totalVendas,
          receitaTotal,
          pedidosPagos,
          taxaConversao,
          totalConversas,
          conversasResolvidas,
          totalTarefas,
          tarefasConcluidas,
          tarefasNoPrazo
        }
      };
    });

    // ranking por receita
    const ranking = [...kpisPorMembro]
      .sort((a, b) => b.kpis.receitaTotal - a.kpis.receitaTotal)
      .map((m, i) => ({ ...m, posicao: i + 1 }));

    // totais da equipa
    const totais = {
      totalVendas: kpisPorMembro.reduce((s, m) => s + m.kpis.totalVendas, 0),
      receitaTotal: kpisPorMembro.reduce((s, m) => s + m.kpis.receitaTotal, 0),
      totalConversas: kpisPorMembro.reduce((s, m) => s + m.kpis.totalConversas, 0),
      totalTarefas: kpisPorMembro.reduce((s, m) => s + m.kpis.totalTarefas, 0),
      tarefasConcluidas: kpisPorMembro.reduce((s, m) => s + m.kpis.tarefasConcluidas, 0)
    };

    // RN-T014: privacidade de desempenho — membros base só vêem os próprios KPIs
    if (solicitanteId) {
      const solicitante = await this.prisma.membroNegocio.findFirst({
        where: { negocioId, usuarioId: solicitanteId, status: "ATIVO" }
      });

      const papelSolicitante = solicitante?.papel ?? "VENDEDOR";
      const permissoes = solicitante?.permissoesJson
        ? (typeof solicitante.permissoesJson === "string"
            ? solicitante.permissoesJson
            : JSON.stringify(solicitante.permissoesJson))
        : "{}";
      const temPermissaoGestao = permissoes.includes("equipa:gestao");

      const papeisComAcesso = ["DONO", "ADMIN", "GESTOR_FINANCEIRO"];
      const acessoCompleto = papeisComAcesso.includes(papelSolicitante) || temPermissaoGestao;

      if (!acessoCompleto) {
        const rankingFiltrado = ranking.map((m) => {
          if (m.usuarioId === solicitanteId) return m;
          return { ...m, nome: "***", avatarUrl: null, kpis: null };
        });
        return { ranking: rankingFiltrado, totais, periodo: { de, ate } };
      }
    }

    return { ranking, totais, periodo: { de, ate } };
  }

  private agruparPorResponsavel<T extends { responsavelId: string | null }>(itens: T[]) {
    return itens.reduce((mapa, item) => {
      if (!item.responsavelId) return mapa;
      const lista = mapa.get(item.responsavelId) ?? [];
      lista.push(item);
      mapa.set(item.responsavelId, lista);
      return mapa;
    }, new Map<string, T[]>());
  }

  // ── Inactividade (RN-T036) ──────────────────────────────────────────────────

  async suspenderMembrosInactivos(negocioId: string) {
    const limiteInactividade = new Date(
      Date.now() - DIAS_INACTIVIDADE_SUSPENSAO * 24 * 60 * 60 * 1000
    );

    const membrosInactivos = await this.prisma.membroNegocio.findMany({
      where: {
        negocioId,
        status: "ATIVO",
        papel: { not: "DONO" },
        atualizadoEm: { lt: limiteInactividade }
      },
      include: { usuario: { select: { id: true, nome: true } } }
    });

    const ids = membrosInactivos.map((m) => m.id);
    if (ids.length === 0) return { suspensos: 0 };

    await this.prisma.membroNegocio.updateMany({
      where: { id: { in: ids } },
      data: { status: "SUSPENSO" }
    });

    for (const m of membrosInactivos) {
      await this.registrarActividade(negocioId, {
        tipo: "MEMBRO_INACTIVO_SUSPENSO",
        entidadeTipo: "MembroNegocio",
        entidadeId: m.id,
        resumo: `${m.usuario.nome} suspenso por inactividade (${DIAS_INACTIVIDADE_SUSPENSAO} dias)`,
        detalhes: { ultimaActualizacao: m.atualizadoEm }
      });
    }

    return { suspensos: ids.length };
  }

  // ── Gamificação (RN-T040 / RF-T120) ──────────────────────────────────────

  async obterConfiguracaoGamificacao(negocioId: string) {
    return this.prisma.configuracaoGamificacao.findUnique({
      where: { negocioId }
    });
  }

  async actualizarConfiguracaoGamificacao(
    negocioId: string,
    dados: { ativo?: boolean; kpiPrincipal?: string; periodo?: string; recompensa?: string }
  ) {
    return this.prisma.configuracaoGamificacao.upsert({
      where: { negocioId },
      create: {
        negocioId,
        ativo: dados.ativo ?? false,
        kpiPrincipal: dados.kpiPrincipal ?? "VENDAS_VALOR",
        periodo: dados.periodo ?? "MENSAL",
        recompensa: dados.recompensa
      },
      update: {
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {}),
        ...(dados.kpiPrincipal ? { kpiPrincipal: dados.kpiPrincipal } : {}),
        ...(dados.periodo ? { periodo: dados.periodo } : {}),
        ...(dados.recompensa !== undefined ? { recompensa: dados.recompensa } : {})
      }
    });
  }

  // ── Evolução Temporal (RF-T053) ───────────────────────────────────────────

  async obterEvolucaoDesempenho(
    negocioId: string,
    usuarioId: string,
    periodos: number = 6
  ) {
    const agora = new Date();
    const resultados: Array<{
      periodo: string;
      vendas: number;
      receita: number;
      conversas: number;
      tarefas: number;
    }> = [];

    for (let i = periodos - 1; i >= 0; i--) {
      const de = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const ate = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 0, 23, 59, 59);
      const rotulo = de.toLocaleDateString("pt", { month: "short", year: "2-digit" });

      const [vendas, conversas, tarefas] = await Promise.all([
        this.prisma.pedido.aggregate({
          where: { negocioId, responsavelId: usuarioId, criadoEm: { gte: de, lte: ate } },
          _count: true,
          _sum: { totalEmKwanza: true }
        }),
        this.prisma.conversaAtendimento.count({
          where: { negocioId, responsavelId: usuarioId, criadaEm: { gte: de, lte: ate } }
        }),
        this.prisma.tarefaOperacional.count({
          where: { negocioId, responsavelId: usuarioId, estado: "CONCLUIDA", criadaEm: { gte: de, lte: ate } }
        })
      ]);

      resultados.push({
        periodo: rotulo,
        vendas: vendas._count,
        receita: vendas._sum.totalEmKwanza ?? 0,
        conversas,
        tarefas
      });
    }

    return { usuarioId, evolucao: resultados };
  }

  // ── Metas de Vendas (RF-T055 a RF-T058) ──────────────────────────────────

  async criarMeta(
    negocioId: string,
    dados: {
      membroId?: string;
      tipo?: string;
      kpi?: string;
      periodo?: string;
      valorMeta: number;
      mes?: number;
      ano?: number;
    }
  ) {
    const meta = await this.prisma.metaVendas.create({
      data: {
        negocioId,
        membroId: dados.membroId,
        tipo: dados.tipo ?? "INDIVIDUAL",
        kpi: dados.kpi ?? "VENDAS_VALOR",
        periodo: dados.periodo ?? "MENSAL",
        valorMeta: dados.valorMeta,
        mes: dados.mes,
        ano: dados.ano
      }
    });

    // RN-T011: auto-distribuir meta de equipa para membros individuais
    if ((dados.tipo ?? "INDIVIDUAL") === "EQUIPA") {
      await this.distribuirMetaEquipa(negocioId, meta.id);
    }

    return meta;
  }

  // ── Distribuição de Meta de Equipa (RN-T011) ─────────────────────────────

  async distribuirMetaEquipa(negocioId: string, metaId: string) {
    const meta = await this.prisma.metaVendas.findFirstOrThrow({
      where: { id: metaId, negocioId }
    });

    if (meta.tipo !== "EQUIPA") {
      throw new Error("RN-T011: Apenas metas do tipo EQUIPA podem ser distribuídas.");
    }

    const membrosActivos = await this.prisma.membroNegocio.findMany({
      where: { negocioId, status: "ATIVO" }
    });

    const totalMembros = membrosActivos.length;
    if (totalMembros === 0) {
      return { distribuidas: 0, valorPorMembro: 0 };
    }

    const valorPorMembro = Math.ceil(meta.valorMeta / totalMembros);
    let distribuidas = 0;

    for (const membro of membrosActivos) {
      // Verificar se já existe meta individual para o mesmo kpi/periodo/mes/ano
      const metaExistente = await this.prisma.metaVendas.findFirst({
        where: {
          negocioId,
          membroId: membro.id,
          tipo: "INDIVIDUAL",
          kpi: meta.kpi,
          periodo: meta.periodo,
          mes: meta.mes,
          ano: meta.ano
        }
      });

      if (!metaExistente) {
        await this.prisma.metaVendas.create({
          data: {
            negocioId,
            membroId: membro.id,
            tipo: "INDIVIDUAL",
            kpi: meta.kpi,
            periodo: meta.periodo,
            valorMeta: valorPorMembro,
            mes: meta.mes,
            ano: meta.ano
          }
        });
        distribuidas++;
      }
    }

    return { distribuidas, valorPorMembro };
  }

  async listarMetas(
    negocioId: string,
    filtros?: { tipo?: string; membroId?: string; periodo?: string; limite?: number }
  ) {
    return this.prisma.metaVendas.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.membroId ? { membroId: filtros.membroId } : {}),
        ...(filtros?.periodo ? { periodo: filtros.periodo } : {})
      },
      include: { membro: { include: { usuario: { select: { id: true, nome: true } } } } },
      orderBy: { criadoEm: "desc" },
      take: filtros?.limite ?? 50
    });
  }

  async obterProgressoMeta(id: string, negocioId: string) {
    const meta = await this.prisma.metaVendas.findFirstOrThrow({
      where: { id, negocioId },
      include: { membro: { select: { usuarioId: true } } }
    });

    const agora = new Date();
    const mes = meta.mes ?? (agora.getMonth() + 1);
    const ano = meta.ano ?? agora.getFullYear();
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    let valorActual = 0;

    if (meta.kpi === "VENDAS_VALOR" || meta.kpi === "VENDAS_QTD") {
      const where: Record<string, unknown> = {
        negocioId,
        criadoEm: { gte: de, lte: ate }
      };
      if (meta.tipo === "INDIVIDUAL" && meta.membro?.usuarioId) {
        where.responsavelId = meta.membro.usuarioId;
      }

      if (meta.kpi === "VENDAS_VALOR") {
        const agg = await this.prisma.pedido.aggregate({ where, _sum: { totalEmKwanza: true } });
        valorActual = agg._sum.totalEmKwanza ?? 0;
      } else {
        valorActual = await this.prisma.pedido.count({ where });
      }
    } else if (meta.kpi === "CONVERSAO") {
      const where: Record<string, unknown> = {
        negocioId,
        criadaEm: { gte: de, lte: ate }
      };
      if (meta.tipo === "INDIVIDUAL" && meta.membro?.usuarioId) {
        where.responsavelId = meta.membro.usuarioId;
      }
      valorActual = await this.prisma.conversaAtendimento.count({ where });
    }

    const percentual = meta.valorMeta > 0 ? Math.round((valorActual / meta.valorMeta) * 100) : 0;

    return {
      id: meta.id,
      kpi: meta.kpi,
      tipo: meta.tipo,
      periodo: `${String(mes).padStart(2, "0")}/${ano}`,
      valorMeta: meta.valorMeta,
      valorActual,
      percentual,
      estado: percentual >= 100 ? "ATINGIDA" : percentual >= 80 ? "PROXIMO" : "EM_PROGRESSO"
    };
  }

  async eliminarMeta(id: string, negocioId: string) {
    return this.prisma.metaVendas.delete({ where: { id, negocioId } });
  }

  // ── Alertas de Metas (RF-T057) ──────────────────────────────────────────

  async obterAlertasMetas(negocioId: string) {
    const metas = await this.prisma.metaVendas.findMany({
      where: { negocioId },
      include: { membro: { include: { usuario: { select: { id: true, nome: true } } } } }
    });

    const agora = new Date();
    const alertas: Array<{
      metaId: string;
      membroNome: string | null;
      tipo: string;
      kpi: string;
      valorMeta: number;
      valorActual: number;
      percentual: number;
      percentualTempoDecorrido: number;
      severidade: "CRITICO" | "ATENCAO";
    }> = [];

    for (const meta of metas) {
      const mes = meta.mes ?? (agora.getMonth() + 1);
      const ano = meta.ano ?? agora.getFullYear();
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);
      const totalDias = fimMes.getDate();
      const diasDecorridos = Math.max(1, Math.min(agora.getDate(), totalDias));
      const percentualTempo = (diasDecorridos / totalDias) * 100;

      // Só alerta para metas do mês actual ou futuro
      if (ano < agora.getFullYear() || (ano === agora.getFullYear() && mes < agora.getMonth() + 1)) {
        continue;
      }

      let valorActual = 0;
      const where: Record<string, unknown> = {
        negocioId,
        criadoEm: { gte: inicioMes, lte: fimMes }
      };
      if (meta.tipo === "INDIVIDUAL" && meta.membro?.usuarioId) {
        where.responsavelId = meta.membro.usuarioId;
      }

      if (meta.kpi === "VENDAS_VALOR") {
        const agg = await this.prisma.pedido.aggregate({ where, _sum: { totalEmKwanza: true } });
        valorActual = agg._sum.totalEmKwanza ?? 0;
      } else if (meta.kpi === "VENDAS_QTD") {
        valorActual = await this.prisma.pedido.count({ where });
      } else if (meta.kpi === "CONVERSAO") {
        const whereConv: Record<string, unknown> = {
          negocioId,
          criadaEm: { gte: inicioMes, lte: fimMes }
        };
        if (meta.tipo === "INDIVIDUAL" && meta.membro?.usuarioId) {
          whereConv.responsavelId = meta.membro.usuarioId;
        }
        valorActual = await this.prisma.conversaAtendimento.count({ where: whereConv });
      }

      const percentual = meta.valorMeta > 0 ? (valorActual / meta.valorMeta) * 100 : 0;

      // RF-T057: alerta quando abaixo de 50% da meta com mais de 50% do tempo decorrido
      if (percentual < 50 && percentualTempo >= 50) {
        alertas.push({
          metaId: meta.id,
          membroNome: meta.membro?.usuario?.nome ?? null,
          tipo: meta.tipo,
          kpi: meta.kpi,
          valorMeta: meta.valorMeta,
          valorActual,
          percentual: Math.round(percentual),
          percentualTempoDecorrido: Math.round(percentualTempo),
          severidade: percentual < 25 ? "CRITICO" : "ATENCAO"
        });
      }
    }

    return { alertas };
  }

  // ── Bónus/Comissão por Meta (RF-T058) ──────────────────────────────────

  async calcularBonusComissao(
    negocioId: string,
    filtros?: { mes?: number; ano?: number; membroId?: string }
  ) {
    const agora = new Date();
    const mes = filtros?.mes ?? (agora.getMonth() + 1);
    const ano = filtros?.ano ?? agora.getFullYear();

    const whereMetas: Record<string, unknown> = {
      negocioId,
      OR: [
        { mes, ano },
        { mes: null, ano: null }
      ]
    };
    if (filtros?.membroId) {
      whereMetas.membroId = filtros.membroId;
    }

    const metas = await this.prisma.metaVendas.findMany({
      where: whereMetas,
      include: { membro: { include: { usuario: { select: { id: true, nome: true } } } } }
    });

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const resultados: Array<{
      metaId: string;
      membroId: string | null;
      membroNome: string | null;
      kpi: string;
      valorMeta: number;
      valorActual: number;
      percentual: number;
      atingida: boolean;
      bonusPercentual: number;
      bonusValor: number;
    }> = [];

    for (const meta of metas) {
      const where: Record<string, unknown> = {
        negocioId,
        criadoEm: { gte: inicioMes, lte: fimMes }
      };
      if (meta.tipo === "INDIVIDUAL" && meta.membro?.usuarioId) {
        where.responsavelId = meta.membro.usuarioId;
      }

      let valorActual = 0;
      let receitaBase = 0;

      if (meta.kpi === "VENDAS_VALOR") {
        const agg = await this.prisma.pedido.aggregate({ where, _sum: { totalEmKwanza: true } });
        valorActual = agg._sum.totalEmKwanza ?? 0;
        receitaBase = valorActual;
      } else if (meta.kpi === "VENDAS_QTD") {
        valorActual = await this.prisma.pedido.count({ where });
        const agg = await this.prisma.pedido.aggregate({ where, _sum: { totalEmKwanza: true } });
        receitaBase = agg._sum.totalEmKwanza ?? 0;
      } else if (meta.kpi === "CONVERSAO") {
        const whereConv: Record<string, unknown> = {
          negocioId,
          criadaEm: { gte: inicioMes, lte: fimMes }
        };
        if (meta.tipo === "INDIVIDUAL" && meta.membro?.usuarioId) {
          whereConv.responsavelId = meta.membro.usuarioId;
        }
        valorActual = await this.prisma.conversaAtendimento.count({ where: whereConv });
      }

      const percentual = meta.valorMeta > 0 ? (valorActual / meta.valorMeta) * 100 : 0;
      const atingida = percentual >= 100;

      // Cálculo de bónus: escalonado por nível de cumprimento
      let bonusPercentual = 0;
      if (percentual >= 150) {
        bonusPercentual = 10; // Superação excepcional
      } else if (percentual >= 120) {
        bonusPercentual = 7; // Superação
      } else if (percentual >= 100) {
        bonusPercentual = 5; // Meta atingida
      }

      const bonusValor = Math.round(receitaBase * (bonusPercentual / 100));

      resultados.push({
        metaId: meta.id,
        membroId: meta.membroId,
        membroNome: meta.membro?.usuario?.nome ?? null,
        kpi: meta.kpi,
        valorMeta: meta.valorMeta,
        valorActual,
        percentual: Math.round(percentual),
        atingida,
        bonusPercentual,
        bonusValor
      });
    }

    const totalBonus = resultados.reduce((s, r) => s + r.bonusValor, 0);
    const metasAtingidas = resultados.filter((r) => r.atingida).length;

    return {
      periodo: `${String(mes).padStart(2, "0")}/${ano}`,
      resultados,
      resumo: { totalMetas: resultados.length, metasAtingidas, totalBonus }
    };
  }

  // ── Gestão de Turnos (RF-T059 a RF-T062) ──────────────────────────────────

  async definirTurno(
    negocioId: string,
    dados: { membroId: string; diaSemana: number; horaInicio: string; horaFim: string }
  ) {
    return this.prisma.turnoMembro.upsert({
      where: { membroId_diaSemana: { membroId: dados.membroId, diaSemana: dados.diaSemana } },
      create: { negocioId, membroId: dados.membroId, diaSemana: dados.diaSemana, horaInicio: dados.horaInicio, horaFim: dados.horaFim },
      update: { horaInicio: dados.horaInicio, horaFim: dados.horaFim, activo: true }
    });
  }

  async listarTurnos(negocioId: string, membroId?: string) {
    return this.prisma.turnoMembro.findMany({
      where: { negocioId, ...(membroId ? { membroId } : {}), activo: true },
      include: { membro: { include: { usuario: { select: { id: true, nome: true } } } } },
      orderBy: [{ membroId: "asc" }, { diaSemana: "asc" }]
    });
  }

  async removerTurno(id: string, negocioId: string) {
    return this.prisma.turnoMembro.update({
      where: { id, negocioId },
      data: { activo: false }
    });
  }

  async registarPresenca(
    negocioId: string,
    dados: { membroId: string; tipo: string; metodo?: string; observacao?: string }
  ) {
    const registo = await this.prisma.registoPresenca.create({
      data: {
        negocioId,
        membroId: dados.membroId,
        tipo: dados.tipo,
        metodo: dados.metodo ?? "MANUAL",
        observacao: dados.observacao
      }
    });

    await this.registrarActividade(negocioId, {
      tipo: dados.tipo === "CHECK_IN" ? "CHECK_IN" : "CHECK_OUT",
      entidadeTipo: "MembroNegocio",
      entidadeId: dados.membroId,
      resumo: `${dados.tipo === "CHECK_IN" ? "Início" : "Fim"} de turno registado (${dados.metodo ?? "MANUAL"})`
    });

    return registo;
  }

  async registarPresencaViaWhatsApp(dados: { negocioId?: string; telefone: string; texto: string }) {
    const tipo = this.interpretarComandoTurnoWhatsApp(dados.texto);
    if (!tipo) {
      return { reconhecido: false as const, aplicado: false as const, motivo: "COMANDO_NAO_SUPORTADO" };
    }

    if (!dados.negocioId) {
      return { reconhecido: true as const, aplicado: false as const, motivo: "NEGOCIO_NAO_IDENTIFICADO" };
    }

    const telefone = this.normalizarTelefoneWhatsApp(dados.telefone);
    if (!telefone) {
      return { reconhecido: true as const, aplicado: false as const, motivo: "TELEFONE_INVALIDO" };
    }

    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId: dados.negocioId, status: "ATIVO" },
      include: { usuario: { select: { id: true, nome: true, telefone: true } } }
    });
    const membro = membros.find((item) => this.normalizarTelefoneWhatsApp(item.usuario.telefone) === telefone);

    if (!membro) {
      return { reconhecido: true as const, aplicado: false as const, motivo: "MEMBRO_NAO_ENCONTRADO" };
    }

    // RF-T117: comandos curtos no bot registam presença no mesmo livro de ponto usado pelo painel.
    const registo = await this.registarPresenca(membro.negocioId, {
      membroId: membro.id,
      tipo,
      metodo: "WHATSAPP",
      observacao: `Comando WhatsApp: ${dados.texto.slice(0, 200)}`
    });

    return {
      reconhecido: true as const,
      aplicado: true as const,
      tipo,
      negocioId: membro.negocioId,
      membroId: membro.id,
      usuarioId: membro.usuarioId,
      registo
    };
  }

  async listarPresencas(
    negocioId: string,
    filtros?: { membroId?: string; de?: Date; ate?: Date; limite?: number }
  ) {
    return this.prisma.registoPresenca.findMany({
      where: {
        negocioId,
        ...(filtros?.membroId ? { membroId: filtros.membroId } : {}),
        ...(filtros?.de || filtros?.ate ? {
          registadoEm: {
            ...(filtros?.de ? { gte: filtros.de } : {}),
            ...(filtros?.ate ? { lte: filtros.ate } : {})
          }
        } : {})
      },
      include: { membro: { include: { usuario: { select: { id: true, nome: true } } } } },
      orderBy: { registadoEm: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  async calcularHorasTrabalhadas(negocioId: string, membroId: string, de: Date, ate: Date) {
    const registos = await this.prisma.registoPresenca.findMany({
      where: { negocioId, membroId, registadoEm: { gte: de, lte: ate } },
      orderBy: { registadoEm: "asc" }
    });

    let totalMinutos = 0;
    let ultimoCheckIn: Date | null = null;

    for (const r of registos) {
      if (r.tipo === "CHECK_IN") {
        ultimoCheckIn = r.registadoEm;
      } else if (r.tipo === "CHECK_OUT" && ultimoCheckIn) {
        totalMinutos += Math.floor((r.registadoEm.getTime() - ultimoCheckIn.getTime()) / (1000 * 60));
        ultimoCheckIn = null;
      }
    }

    return {
      membroId,
      periodo: { de, ate },
      totalMinutos,
      totalHoras: Math.round((totalMinutos / 60) * 10) / 10,
      registos: registos.length
    };
  }

  async obterDisponibilidadeActual(negocioId: string) {
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0=Dom, 6=Sab
    const horaActual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const turnos = await this.prisma.turnoMembro.findMany({
      where: { negocioId, diaSemana, activo: true },
      include: { membro: { include: { usuario: { select: { id: true, nome: true } } } } }
    });

    return turnos.map((t) => ({
      membroId: t.membroId,
      nome: t.membro.usuario.nome,
      horaInicio: t.horaInicio,
      horaFim: t.horaFim,
      emTurno: horaActual >= t.horaInicio && horaActual <= t.horaFim
    }));
  }

  // ── Membros em Turno (RN-T012) ──────────────────────────────────────────────

  async obterMembrosEmTurno(negocioId: string) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const horaActual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const turnos = await this.prisma.turnoMembro.findMany({
      where: { negocioId, diaSemana, activo: true },
      include: { membro: { select: { id: true, usuarioId: true, status: true } } }
    });

    const membrosEmTurno = turnos
      .filter((t) => t.membro.status === "ATIVO" && horaActual >= t.horaInicio && horaActual <= t.horaFim)
      .map((t) => t.membroId);

    return membrosEmTurno;
  }

  async validarAtribuicaoTurno(negocioId: string, membroId: string) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const horaActual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    const turnoHoje = await this.prisma.turnoMembro.findFirst({
      where: { negocioId, membroId, diaSemana, activo: true }
    });

    if (turnoHoje && horaActual >= turnoHoje.horaInicio && horaActual <= turnoHoje.horaFim) {
      return { emTurno: true };
    }

    // Procurar próximo turno para informação
    const turnosFuturos = await this.prisma.turnoMembro.findMany({
      where: { negocioId, membroId, activo: true },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }]
    });

    let proximoTurno: string | undefined;
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    for (const turno of turnosFuturos) {
      if (turno.diaSemana > diaSemana || (turno.diaSemana === diaSemana && turno.horaInicio > horaActual)) {
        proximoTurno = `${diasSemana[turno.diaSemana]} ${turno.horaInicio}`;
        break;
      }
    }

    // Se não encontrou turno futuro na mesma semana, usar o primeiro da semana seguinte
    if (!proximoTurno && turnosFuturos.length > 0) {
      const primeiro = turnosFuturos[0];
      proximoTurno = `${diasSemana[primeiro.diaSemana]} ${primeiro.horaInicio}`;
    }

    return { emTurno: false, proximoTurno };
  }

  // ── Relatório Passagem de Turno (RF-T116) ──────────────────────────────────

  async gerarRelatorioPassagemTurno(negocioId: string, membroId: string) {
    const membro = await this.prisma.membroNegocio.findFirstOrThrow({
      where: { id: membroId, negocioId },
      include: { usuario: { select: { id: true, nome: true } } }
    });

    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    // Conversas abertas atribuídas ao membro
    const conversasAbertas = await this.prisma.conversaAtendimento.findMany({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        estado: { in: ["ABERTA", "EM_ATENDIMENTO"] }
      },
      select: { id: true, telefone: true, estado: true, ultimaMensagemEm: true },
      orderBy: { ultimaMensagemEm: "desc" },
      take: 20
    });

    // Tarefas pendentes do membro
    const tarefasPendentes = await this.prisma.tarefaOperacional.findMany({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] }
      },
      select: { id: true, titulo: true, prioridade: true, prazoEm: true, estado: true },
      orderBy: [{ prioridade: "desc" }, { prazoEm: "asc" }],
      take: 20
    });

    // Pedidos do dia em processamento
    const pedidosDia = await this.prisma.pedido.findMany({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        criadoEm: { gte: inicioDia },
        estado: { in: ["PENDENTE", "EM_PROCESSAMENTO"] }
      },
      select: { id: true, numero: true, totalEmKwanza: true, estado: true },
      take: 20
    });

    // Resumo do turno
    const vendasDia = await this.prisma.pedido.aggregate({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        criadoEm: { gte: inicioDia }
      },
      _count: true,
      _sum: { totalEmKwanza: true }
    });

    const conversasResolvidasDia = await this.prisma.conversaAtendimento.count({
      where: {
        negocioId,
        responsavelId: membro.usuarioId,
        estado: "RESOLVIDA",
        atualizadoEm: { gte: inicioDia }
      }
    });

    // Registar no feed
    await this.registrarActividade(negocioId, {
      autorId: membro.usuarioId,
      tipo: "PASSAGEM_TURNO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroId,
      resumo: `Passagem de turno de ${membro.usuario.nome}: ${conversasAbertas.length} conversas abertas, ${tarefasPendentes.length} tarefas pendentes`,
      detalhes: {
        vendas: vendasDia._count,
        receita: vendasDia._sum.totalEmKwanza ?? 0,
        conversasResolvidas: conversasResolvidasDia
      }
    });

    return {
      membro: { id: membroId, nome: membro.usuario.nome, papel: membro.papel },
      resumoDia: {
        totalVendas: vendasDia._count,
        receitaDia: vendasDia._sum.totalEmKwanza ?? 0,
        conversasResolvidas: conversasResolvidasDia
      },
      conversasAbertas,
      tarefasPendentes,
      pedidosPendentes: pedidosDia,
      geradoEm: new Date()
    };
  }

  // ── Widget Comissão Estimada (RF-T118) ──────────────────────────────────

  async obterComissaoEstimada(negocioId: string, usuarioId: string) {
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [vendasDia, vendasMes] = await Promise.all([
      this.prisma.pedido.aggregate({
        where: { negocioId, responsavelId: usuarioId, criadoEm: { gte: inicioDia } },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.pedido.aggregate({
        where: { negocioId, responsavelId: usuarioId, criadoEm: { gte: inicioMes } },
        _count: true,
        _sum: { totalEmKwanza: true }
      })
    ]);

    const receitaDia = vendasDia._sum.totalEmKwanza ?? 0;
    const receitaMes = vendasMes._sum.totalEmKwanza ?? 0;

    // Verificar metas do membro para calcular bónus
    const membro = await this.prisma.membroNegocio.findFirst({
      where: { negocioId, usuarioId, status: "ATIVO" }
    });

    let metaValor = 0;
    let metaPercentual = 0;
    let bonusPercentual = 0;

    if (membro) {
      const meta = await this.prisma.metaVendas.findFirst({
        where: {
          negocioId,
          membroId: membro.id,
          kpi: "VENDAS_VALOR",
          OR: [
            { mes: agora.getMonth() + 1, ano: agora.getFullYear() },
            { mes: null, ano: null }
          ]
        }
      });

      if (meta) {
        metaValor = meta.valorMeta;
        metaPercentual = metaValor > 0 ? Math.round((receitaMes / metaValor) * 100) : 0;

        if (metaPercentual >= 150) bonusPercentual = 10;
        else if (metaPercentual >= 120) bonusPercentual = 7;
        else if (metaPercentual >= 100) bonusPercentual = 5;
      }
    }

    // Comissão base: 5% das vendas (configurável)
    const comissaoBaseDia = Math.round(receitaDia * 0.05);
    const comissaoBaseMes = Math.round(receitaMes * 0.05);
    const bonusMes = Math.round(receitaMes * (bonusPercentual / 100));

    return {
      hoje: {
        vendas: vendasDia._count,
        receita: receitaDia,
        comissaoEstimada: comissaoBaseDia
      },
      mes: {
        vendas: vendasMes._count,
        receita: receitaMes,
        comissaoBase: comissaoBaseMes,
        bonus: bonusMes,
        comissaoTotal: comissaoBaseMes + bonusMes,
        metaValor,
        metaPercentual,
        bonusPercentual
      }
    };
  }

  // ── Módulos Visíveis para Novos Membros (RF-T113) ──────────────────────────

  async obterModulosVisiveis(negocioId: string, membroId: string) {
    const membro = await this.prisma.membroNegocio.findFirstOrThrow({
      where: { id: membroId, negocioId }
    });

    // Determinar data de adesão: convite aceite ou criação do membro
    const convite = await this.prisma.conviteEquipa.findFirst({
      where: { negocioId, aceitePorId: membro.usuarioId, estado: "ACEITE" },
      orderBy: { aceiteEm: "desc" }
    });

    const dataAdesao = convite?.aceiteEm ?? membro.criadoEm;
    const diasDesdeAdesao = Math.floor(
      (Date.now() - dataAdesao.getTime()) / (1000 * 60 * 60 * 24)
    );

    const modulosComplexos = ["FINANCAS", "PIPELINE", "RELATORIOS", "CAMPANHAS"];
    const todosModulos = [
      "PAINEL", "PEDIDOS", "CATALOGO", "ATENDIMENTO", "EQUIPA",
      "FINANCAS", "PIPELINE", "RELATORIOS", "CAMPANHAS"
    ];

    const papeisBase = ["VENDEDOR", "ATENDENTE"];
    const deveOcultar = diasDesdeAdesao < 7 && papeisBase.includes(membro.papel);

    const modulosOcultos = deveOcultar ? modulosComplexos : [];
    const modulosVisiveis = deveOcultar
      ? todosModulos.filter((m) => !modulosComplexos.includes(m))
      : todosModulos;

    const diasRestantes = deveOcultar ? 7 - diasDesdeAdesao : 0;

    return { modulosVisiveis, modulosOcultos, diasRestantes };
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private classificarPassoOnboarding(item: string) {
    const mapa: Record<string, "PERFIL" | "NOTIFICACOES" | "TOUR" | "TAREFA" | "COMUNICACAO"> = {
      PERFIL_COMPLETO: "PERFIL",
      CONFIGURAR_NOTIFICACOES: "NOTIFICACOES",
      TOUR_MODULOS_PERMITIDOS: "TOUR",
      PRIMEIRA_TAREFA: "TAREFA",
      ENVIAR_MENSAGEM: "COMUNICACAO"
    };
    return mapa[item] ?? "TAREFA";
  }

  private interpretarComandoTurnoWhatsApp(texto: string): "CHECK_IN" | "CHECK_OUT" | null {
    const comando = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
    if (!comando) return null;

    const tokens = comando.split(" ");
    const primeiro = tokens[0];
    const frase = tokens.join(" ");

    if (["iniciar", "inicio", "entrar", "comecar", "checkin"].includes(primeiro) || frase === "check in") {
      return "CHECK_IN";
    }

    if (["terminar", "fim", "sair", "finalizar", "checkout"].includes(primeiro) || frase === "check out") {
      return "CHECK_OUT";
    }

    return null;
  }

  private normalizarTelefoneWhatsApp(telefone?: string | null) {
    let digitos = telefone?.replace(/\D/g, "") ?? "";
    if (digitos.startsWith("00")) digitos = digitos.slice(2);
    if (digitos.startsWith("244") && digitos.length > 9) digitos = digitos.slice(3);
    if (digitos.startsWith("0") && digitos.length > 9) digitos = digitos.slice(1);
    return digitos;
  }

  private estaEmTurnoAgora(turnos: Array<{ diaSemana: number; horaInicio: string; horaFim: string }>) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const horaActual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    return turnos.some((turno) => turno.diaSemana === diaSemana && horaActual >= turno.horaInicio && horaActual <= turno.horaFim);
  }

  private inferirCompetenciasMembro(membro: { papel: string; permissoesJson?: string | null; skillsJson?: string | null }) {
    const permissoes = this.parseJsonRecord(membro.permissoesJson);
    const explicitas = Array.isArray(permissoes.competencias)
      ? permissoes.competencias.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    const porPapel: Record<string, string[]> = {
      DONO: ["governanca", "financeiro", "operacoes", "decisao"],
      ADMIN: ["governanca", "operacoes", "equipa"],
      GESTOR: ["operacoes", "equipa", "atendimento"],
      GESTOR_FINANCEIRO: ["financeiro", "repasses", "auditoria"],
      VENDEDOR: ["vendas", "atendimento", "catalogo"],
      ATENDENTE: ["atendimento", "whatsapp", "pos-venda"]
    };
    const skills = this.parseJsonArray<{ nome?: unknown }>(membro.skillsJson)
      .map((skill) => typeof skill.nome === "string" ? skill.nome.trim() : "")
      .filter(Boolean);
    return [...new Set([...skills, ...explicitas, ...(porPapel[membro.papel] ?? ["operacoes"])])];
  }

  private mapearUltimaPresencaPorMembro(
    registos: Array<{ id: string; membroId: string; tipo: string; registadoEm: Date; metodo: string; observacao: string | null }>
  ) {
    const mapa = new Map<string, { id: string; membroId: string; tipo: string; registadoEm: Date; metodo: string; observacao: string | null }>();
    for (const registo of registos) {
      if (!mapa.has(registo.membroId)) {
        mapa.set(registo.membroId, registo);
      }
    }
    return mapa;
  }

  private serializarPresencaOperacional(
    registo: { id: string; tipo: string; registadoEm: Date; metodo: string; observacao: string | null } | null
  ) {
    if (!registo) return null;
    return {
      id: registo.id,
      tipo: registo.tipo,
      registadoEm: registo.registadoEm,
      metodo: registo.metodo,
      observacao: registo.observacao
    };
  }

  private conversaForaSla(ultimaMensagemEm: Date | null, agora = new Date()) {
    if (!ultimaMensagemEm) return true;
    return agora.getTime() - ultimaMensagemEm.getTime() > MINUTOS_SLA_CONVERSA * 60 * 1000;
  }

  private extrairAusenciasAtivas(
    eventos: Array<{ id: string; entidadeId: string | null; detalhesJson: string; criadoEm: Date }>,
    agora = new Date()
  ) {
    return eventos
      .map((evento) => {
        const detalhes = this.parseJsonRecord(evento.detalhesJson);
        const membroId = typeof detalhes.membroId === "string" ? detalhes.membroId : evento.entidadeId;
        const inicioEm = this.dataValida(detalhes.inicioEm) ?? evento.criadoEm;
        const fimEm = this.dataValida(detalhes.fimEm);
        if (!membroId || !fimEm) return null;
        if (inicioEm > agora || fimEm < agora) return null;
        return {
          id: evento.id,
          membroId,
          motivo: typeof detalhes.motivo === "string" ? detalhes.motivo : "Ausência operacional",
          inicioEm,
          fimEm
        };
      })
      .filter((item): item is { id: string; membroId: string; motivo: string; inicioEm: Date; fimEm: Date } => Boolean(item));
  }

  private dataValida(valor: unknown) {
    if (typeof valor !== "string" && !(valor instanceof Date)) return null;
    const data = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  private parseJsonRecord(valor?: string | null): Record<string, unknown> {
    if (!valor) return {};
    try {
      const parseado = JSON.parse(valor);
      return parseado && typeof parseado === "object" && !Array.isArray(parseado) ? parseado as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private parseJsonArray<T = unknown>(valor?: string | null): T[] {
    if (!valor) return [];
    try {
      const parseado = JSON.parse(valor);
      return Array.isArray(parseado) ? parseado as T[] : [];
    } catch {
      return [];
    }
  }

  private contarPorChave(chaves: Array<string | null | undefined>) {
    const mapa = new Map<string, number>();
    for (const chave of chaves) {
      if (!chave) continue;
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    }
    return mapa;
  }

  private async registrarActividade(
    negocioId: string,
    dados: {
      autorId?: string;
      tipo: string;
      entidadeTipo?: string;
      entidadeId?: string;
      resumo: string;
      detalhes?: Record<string, unknown>;
    }
  ) {
    return this.prisma.feedActividade.create({
      data: {
        negocioId,
        autorId: dados.autorId,
        tipo: dados.tipo,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        resumo: dados.resumo,
        detalhesJson: JSON.stringify(dados.detalhes ?? {})
      }
    });
  }
}
