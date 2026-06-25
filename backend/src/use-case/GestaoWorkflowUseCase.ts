import type { PrismaClient } from "@prisma/client";

const LIMITE_FLUXOS_ACTIVOS_PADRAO = 20;
const LIMITE_NOTIFICACOES_WHATSAPP_DIA = 20;
const MAX_FALHAS_CONSECUTIVAS = 3;

export class GestaoWorkflowUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── RF-T069-T073 — Gestão de Fluxos Automáticos ──────────────────────────

  async criarFluxo(
    negocioId: string,
    dados: { nome: string; gatilho: string; descricao?: string }
  ) {
    // RN-T024: verificar limite de fluxos activos
    const activos = await this.prisma.fluxoAutomatico.count({
      where: { negocioId, ativo: true }
    });
    if (activos >= LIMITE_FLUXOS_ACTIVOS_PADRAO) {
      throw new Error(
        `RN-T024: Limite de ${LIMITE_FLUXOS_ACTIVOS_PADRAO} fluxos automáticos activos atingido.`
      );
    }

    return this.prisma.fluxoAutomatico.create({
      data: {
        negocioId,
        nome: dados.nome,
        gatilho: dados.gatilho,
        descricao: dados.descricao
      }
    });
  }

  async listarFluxos(
    negocioId: string,
    filtros?: { ativo?: boolean; gatilho?: string }
  ) {
    return this.prisma.fluxoAutomatico.findMany({
      where: {
        negocioId,
        ...(filtros?.ativo !== undefined ? { ativo: filtros.ativo } : {}),
        ...(filtros?.gatilho ? { gatilho: filtros.gatilho } : {})
      },
      include: { passos: { orderBy: { ordem: "asc" } } },
      orderBy: { criadoEm: "desc" }
    });
  }

  async activarDesactivarFluxo(fluxoId: string, negocioId: string, ativo: boolean) {
    return this.prisma.fluxoAutomatico.update({
      where: { id: fluxoId, negocioId },
      data: { ativo, ...(ativo ? { pausadoPorFalha: false, falhasConsecutivas: 0 } : {}) }
    });
  }

  async adicionarPasso(
    fluxoId: string,
    dados: { tipo: string; configuracaoJson?: string }
  ) {
    const ultimoPasso = await this.prisma.passoFluxo.findFirst({
      where: { fluxoId },
      orderBy: { ordem: "desc" }
    });

    return this.prisma.passoFluxo.create({
      data: {
        fluxoId,
        tipo: dados.tipo,
        configuracaoJson: dados.configuracaoJson ?? "{}",
        ordem: (ultimoPasso?.ordem ?? 0) + 1
      }
    });
  }

  async executarFluxo(fluxoId: string, gatilhoEntidadeId?: string) {
    const fluxo = await this.prisma.fluxoAutomatico.findUniqueOrThrow({
      where: { id: fluxoId },
      include: { passos: { orderBy: { ordem: "asc" } } }
    });

    if (!fluxo.ativo || fluxo.pausadoPorFalha) {
      throw new Error("Fluxo não está activo ou foi pausado por falhas.");
    }

    const execucao = await this.prisma.execucaoFluxo.create({
      data: { fluxoId, gatilhoEntidadeId, estado: "EM_EXECUCAO" }
    });

    try {
      for (let i = 0; i < fluxo.passos.length; i++) {
        await this.prisma.execucaoFluxo.update({
          where: { id: execucao.id },
          data: { passoActual: i + 1 }
        });
      }

      await this.prisma.$transaction([
        this.prisma.execucaoFluxo.update({
          where: { id: execucao.id },
          data: { estado: "CONCLUIDO", concluidoEm: new Date() }
        }),
        this.prisma.fluxoAutomatico.update({
          where: { id: fluxoId },
          data: { falhasConsecutivas: 0 }
        })
      ]);

      return { execucaoId: execucao.id, estado: "CONCLUIDO" };
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : String(erro);
      const falhasConsecutivas = fluxo.falhasConsecutivas + 1;

      await this.prisma.execucaoFluxo.update({
        where: { id: execucao.id },
        data: { estado: "FALHADO", erro: mensagemErro, concluidoEm: new Date() }
      });

      // RN-T025: pausar após 3 falhas consecutivas e criar tarefa humana
      if (falhasConsecutivas >= MAX_FALHAS_CONSECUTIVAS) {
        await this.prisma.fluxoAutomatico.update({
          where: { id: fluxoId },
          data: { falhasConsecutivas, pausadoPorFalha: true, ativo: false }
        });

        await this.prisma.tarefaOperacional.create({
          data: {
            negocioId: fluxo.negocioId,
            tipo: "WORKFLOW",
            titulo: `Fluxo "${fluxo.nome}" pausado por falhas consecutivas`,
            descricao: `O fluxo automático falhou ${falhasConsecutivas} vezes consecutivas. Último erro: ${mensagemErro}`,
            prioridade: "ALTA",
            estado: "ABERTA"
          }
        });
      } else {
        await this.prisma.fluxoAutomatico.update({
          where: { id: fluxoId },
          data: { falhasConsecutivas }
        });
      }

      return { execucaoId: execucao.id, estado: "FALHADO", erro: mensagemErro };
    }
  }

  async listarExecucoes(fluxoId: string, limite?: number) {
    return this.prisma.execucaoFluxo.findMany({
      where: { fluxoId },
      orderBy: { iniciadoEm: "desc" },
      take: limite ?? 50
    });
  }

  // ── RF-T075 — Fluxos Condicionais ─────────────────────────────────────────

  async adicionarPassoCondicional(
    fluxoId: string,
    dados: {
      tipo: string;
      condicao: string; // ex: "pedido.valor > 50000"
      acaoVerdadeira: string; // ex: "notificar_gestor_financeiro"
      acaoFalsa?: string; // ex: "criar_tarefa_boas_vindas"
      ordem?: number;
    }
  ) {
    const ultimoPasso = await this.prisma.passoFluxo.findFirst({
      where: { fluxoId },
      orderBy: { ordem: "desc" }
    });

    const configuracao = {
      condicional: true,
      condicao: dados.condicao,
      acaoVerdadeira: dados.acaoVerdadeira,
      acaoFalsa: dados.acaoFalsa ?? null
    };

    return this.prisma.passoFluxo.create({
      data: {
        fluxoId,
        tipo: dados.tipo,
        configuracaoJson: JSON.stringify(configuracao),
        ordem: dados.ordem ?? (ultimoPasso?.ordem ?? 0) + 1
      }
    });
  }

  // ── RF-T079 — Sugestões de Próxima Acção ────────────────────────────────

  async sugerirProximaAccao(negocioId: string, membroId: string) {
    const agora = new Date();

    // Buscar tarefas mais urgentes do membro
    const tarefaUrgente = await this.prisma.tarefaOperacional.findFirst({
      where: { negocioId, responsavelId: membroId, estado: { in: ["ABERTA", "PENDENTE"] } },
      orderBy: [{ prioridade: "desc" }, { prazoEm: "asc" }],
      select: { id: true, titulo: true, prioridade: true, prazoEm: true }
    });

    // Buscar conversas abertas sem resposta
    const conversaPendente = await this.prisma.conversaAtendimento.findFirst({
      where: { negocioId, responsavelId: membroId, estado: "ABERTA" },
      orderBy: { criadaEm: "asc" },
      select: { id: true, telefone: true, criadaEm: true }
    });

    // Buscar pedido pendente mais antigo
    const pedidoPendente = await this.prisma.pedido.findFirst({
      where: { negocioId, responsavelId: membroId, estado: "PENDENTE" },
      orderBy: { criadoEm: "asc" },
      select: { id: true, numero: true, totalEmKwanza: true, criadoEm: true }
    });

    // Cobranças vencidas
    const cobrancaVencida = await this.prisma.contaReceber.findFirst({
      where: { negocioId, estado: "VENCIDO" },
      orderBy: { dataVencimento: "asc" },
      select: { id: true, descricao: true, valor: true, dataVencimento: true }
    });

    const sugestoes: Array<{ tipo: string; titulo: string; descricao: string; prioridade: number; entidadeId?: string }> = [];

    if (tarefaUrgente) {
      const atrasada = tarefaUrgente.prazoEm && tarefaUrgente.prazoEm < agora;
      sugestoes.push({
        tipo: "TAREFA",
        titulo: atrasada ? `Tarefa atrasada: ${tarefaUrgente.titulo}` : `Tarefa pendente: ${tarefaUrgente.titulo}`,
        descricao: atrasada ? "Esta tarefa já passou do prazo" : `Prioridade: ${tarefaUrgente.prioridade}`,
        prioridade: atrasada ? 100 : 80,
        entidadeId: tarefaUrgente.id
      });
    }

    if (conversaPendente) {
      const minutosAberta = Math.floor((agora.getTime() - conversaPendente.criadaEm.getTime()) / 60000);
      sugestoes.push({
        tipo: "CONVERSA",
        titulo: `Responder ${conversaPendente.telefone}`,
        descricao: `Aberta há ${minutosAberta} minutos`,
        prioridade: minutosAberta > 30 ? 90 : 70,
        entidadeId: conversaPendente.id
      });
    }

    if (pedidoPendente) {
      sugestoes.push({
        tipo: "PEDIDO",
        titulo: `Processar pedido #${pedidoPendente.numero}`,
        descricao: `${pedidoPendente.totalEmKwanza.toLocaleString()} Kz`,
        prioridade: 60,
        entidadeId: pedidoPendente.id
      });
    }

    if (cobrancaVencida) {
      const diasVencido = Math.ceil((agora.getTime() - cobrancaVencida.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
      sugestoes.push({
        tipo: "COBRANCA",
        titulo: `Cobrança vencida: ${cobrancaVencida.descricao}`,
        descricao: `Vencido há ${diasVencido} dias — ${cobrancaVencida.valor.toLocaleString()} Kz`,
        prioridade: 50,
        entidadeId: cobrancaVencida.id
      });
    }

    sugestoes.sort((a, b) => b.prioridade - a.prioridade);

    return { sugestoes, total: sugestoes.length };
  }

  // ── RF-T074-T077 — Widgets Contextuais ────────────────────────────────────

  async obterWidgetsContextuais(negocioId: string, contexto: string) {
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    if (contexto === "PAINEL") {
      const [tarefasPendentes, conversasAbertas, vendasDia, fluxosActivos] = await Promise.all([
        this.prisma.tarefaOperacional.count({
          where: { negocioId, estado: { in: ["ABERTA", "PENDENTE"] } }
        }),
        this.prisma.conversaAtendimento.count({
          where: { negocioId, estado: { in: ["ABERTA", "EM_ATENDIMENTO"] } }
        }),
        this.prisma.pedido.aggregate({
          where: { negocioId, criadoEm: { gte: inicioDia } },
          _count: true,
          _sum: { totalEmKwanza: true }
        }),
        this.prisma.fluxoAutomatico.count({
          where: { negocioId, ativo: true }
        })
      ]);

      return {
        contexto: "PAINEL",
        widgets: { tarefasPendentes, conversasAbertas, vendasDia: vendasDia._count, receitaDia: vendasDia._sum.totalEmKwanza ?? 0, fluxosActivos }
      };
    }

    if (contexto === "PEDIDOS") {
      const [aguardandoPagamento, porEntregar] = await Promise.all([
        this.prisma.pedido.count({ where: { negocioId, estadoPagamento: "PENDENTE" } }),
        this.prisma.pedido.count({ where: { negocioId, estadoEntrega: "PENDENTE" } })
      ]);
      return { contexto: "PEDIDOS", widgets: { aguardandoPagamento, porEntregar } };
    }

    if (contexto === "CONVERSAS") {
      const [naoLidas, tempoMedioSegundos] = await Promise.all([
        this.prisma.conversaAtendimento.count({ where: { negocioId, estado: "ABERTA" } }),
        Promise.resolve(0) // placeholder para cálculo de tempo médio
      ]);
      return { contexto: "CONVERSAS", widgets: { naoLidas, tempoMedioResposta: tempoMedioSegundos } };
    }

    if (contexto === "FINANCAS") {
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const [entradas, saidas, recebeiveisVencidos] = await Promise.all([
        this.prisma.movimentoFinanceiro.aggregate({
          where: { negocioId, tipo: "ENTRADA", dataMovimento: { gte: inicioMes } },
          _sum: { valor: true }
        }),
        this.prisma.movimentoFinanceiro.aggregate({
          where: { negocioId, tipo: "SAIDA", dataMovimento: { gte: inicioMes } },
          _sum: { valor: true }
        }),
        this.prisma.contaReceber.count({
          where: { negocioId, estado: "VENCIDO" }
        })
      ]);
      return {
        contexto: "FINANCAS",
        widgets: {
          entradasMes: entradas._sum.valor ?? 0,
          saidasMes: saidas._sum.valor ?? 0,
          saldoMes: (entradas._sum.valor ?? 0) - (saidas._sum.valor ?? 0),
          recebeiveisVencidos
        }
      };
    }

    return { contexto, widgets: {} };
  }

  // ── RF-T122 — Configuração de Notificações por Membro ─────────────────────

  async configurarNotificacao(
    negocioId: string,
    membroId: string,
    dados: { canal: string; tipo: string; ativo: boolean; horarioInicio?: string; horarioFim?: string }
  ) {
    // RN-T027: regista consentimento
    return this.prisma.configuracaoNotificacao.upsert({
      where: { negocioId_membroId_canal_tipo: { negocioId, membroId, canal: dados.canal, tipo: dados.tipo } },
      create: {
        negocioId,
        membroId,
        canal: dados.canal,
        tipo: dados.tipo,
        ativo: dados.ativo,
        horarioInicio: dados.horarioInicio,
        horarioFim: dados.horarioFim
      },
      update: {
        ativo: dados.ativo,
        ...(dados.horarioInicio !== undefined ? { horarioInicio: dados.horarioInicio } : {}),
        ...(dados.horarioFim !== undefined ? { horarioFim: dados.horarioFim } : {})
      }
    });
  }

  async listarConfiguracoesNotificacao(negocioId: string, membroId: string) {
    return this.prisma.configuracaoNotificacao.findMany({
      where: { negocioId, membroId },
      orderBy: [{ canal: "asc" }, { tipo: "asc" }]
    });
  }

  async verificarLimiteNotificacao(
    negocioId: string,
    membroId: string,
    canal: string
  ): Promise<{ permitido: boolean; restantes: number }> {
    // RN-T027: verificar consentimento
    const config = await this.prisma.configuracaoNotificacao.findFirst({
      where: { negocioId, membroId, canal, ativo: true }
    });
    if (!config) {
      return { permitido: false, restantes: 0 };
    }

    // RN-T026: limite diário para WhatsApp
    if (canal === "WHATSAPP") {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const contador = await this.prisma.contadorNotificacaoDiaria.findUnique({
        where: { negocioId_membroId_canal_data: { negocioId, membroId, canal, data: hoje } }
      });

      const contagem = contador?.contagem ?? 0;
      const restantes = Math.max(0, LIMITE_NOTIFICACOES_WHATSAPP_DIA - contagem);
      return { permitido: restantes > 0, restantes };
    }

    return { permitido: true, restantes: 999 };
  }

  // ── RF-T019 — Configuração do nível de proactividade de alertas ──────────

  async configurarNivelProactividade(
    negocioId: string,
    membroId: string,
    nivel: "MINIMO" | "MODERADO" | "COMPLETO"
  ) {
    // Armazenar nível de proactividade como configuração de notificação especial
    return this.prisma.configuracaoNotificacao.upsert({
      where: {
        negocioId_membroId_canal_tipo: {
          negocioId,
          membroId,
          canal: "SISTEMA",
          tipo: "PROACTIVIDADE"
        }
      },
      create: {
        negocioId,
        membroId,
        canal: "SISTEMA",
        tipo: "PROACTIVIDADE",
        ativo: true,
        horarioInicio: nivel // reutilizar campo para armazenar nível
      },
      update: {
        horarioInicio: nivel,
        ativo: true
      }
    });
  }

  async obterNivelProactividade(
    negocioId: string,
    membroId: string
  ): Promise<"MINIMO" | "MODERADO" | "COMPLETO"> {
    const config = await this.prisma.configuracaoNotificacao.findUnique({
      where: {
        negocioId_membroId_canal_tipo: {
          negocioId,
          membroId,
          canal: "SISTEMA",
          tipo: "PROACTIVIDADE"
        }
      }
    });

    return (config?.horarioInicio as "MINIMO" | "MODERADO" | "COMPLETO") ?? "MODERADO";
  }

  async filtrarInsightsPorProactividade(
    negocioId: string,
    membroId: string
  ) {
    const nivel = await this.obterNivelProactividade(negocioId, membroId);

    // Filtrar insights baseado no nível de proactividade
    let confiancaMinima: number;
    let limite: number;

    switch (nivel) {
      case "MINIMO":
        confiancaMinima = 0.8; // só insights de alta confiança
        limite = 5;
        break;
      case "COMPLETO":
        confiancaMinima = 0.3; // todos os insights relevantes
        limite = 50;
        break;
      default: // MODERADO
        confiancaMinima = 0.5;
        limite = 20;
        break;
    }

    const insights = await this.prisma.insightPreditivo.findMany({
      where: {
        negocioId,
        confianca: { gte: confiancaMinima },
        OR: [
          { expiradoEm: null },
          { expiradoEm: { gt: new Date() } }
        ]
      },
      orderBy: [{ confianca: "desc" }, { criadoEm: "desc" }],
      take: limite
    });

    return {
      nivel,
      confiancaMinima,
      insights,
      total: insights.length
    };
  }

  async incrementarContadorNotificacao(negocioId: string, membroId: string, canal: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return this.prisma.contadorNotificacaoDiaria.upsert({
      where: { negocioId_membroId_canal_data: { negocioId, membroId, canal, data: hoje } },
      create: { negocioId, membroId, canal, data: hoje, contagem: 1 },
      update: { contagem: { increment: 1 } }
    });
  }
}
