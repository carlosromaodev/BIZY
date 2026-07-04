import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const LIMITE_FLUXOS_ACTIVOS_PADRAO = 20;
const LIMITE_NOTIFICACOES_WHATSAPP_DIA = 20;
const MAX_FALHAS_CONSECUTIVAS = 3;
const CANAL_ALERTA_PROACTIVO_PADRAO = "WHATSAPP";

type TipoAlertaProactivo = "PAGAMENTO_ALTO";
type TipoRotinaNotificacaoProactiva = "RESUMO_DIARIO" | "ALERTAS" | "TODOS";
type OrigemRotinaNotificacaoProactiva = "MANUAL" | "N8N" | "CRON" | "SISTEMA";
type WidgetsContextuais = Record<string, number>;
type LayoutWidgets = { ordem: string[]; ocultos: string[] };

type MensagemTempoResposta = {
  direcao: string;
  remetente: string | null;
  canal: string | null;
  status: string | null;
  enviadaEm: Date;
};

type ConversaTempoResposta = {
  mensagens: MensagemTempoResposta[];
};

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

    const { execucao, eventoN8n } = await this.criarExecucaoFluxoComOutbox(
      fluxo.negocioId,
      fluxoId,
      gatilhoEntidadeId,
      fluxo.passos.length
    );

    try {
      for (let i = 0; i < fluxo.passos.length; i++) {
        await this.prisma.execucaoFluxo.update({
          where: { id: execucao.id },
          data: { passoActual: i + 1 }
        });
      }

      const concluidoEm = new Date();
      await this.prisma.$transaction([
        this.prisma.execucaoFluxo.update({
          where: { id: execucao.id },
          data: { estado: "CONCLUIDO", concluidoEm }
        }),
        this.prisma.fluxoAutomatico.update({
          where: { id: fluxoId },
          data: { falhasConsecutivas: 0 }
        }),
        this.prisma.outboxEventoN8n.update({
          where: { id: eventoN8n.id },
          data: {
            status: "PUBLICADO",
            publicadoEm: concluidoEm,
            ultimoErro: null,
            payloadJson: JSON.stringify({
              negocioId: fluxo.negocioId,
              fluxoId,
              execucaoId: execucao.id,
              gatilhoEntidadeId,
              totalPassos: fluxo.passos.length,
              estado: "CONCLUIDO",
              concluidoEm: concluidoEm.toISOString()
            })
          }
        })
      ]);

      return { execucaoId: execucao.id, estado: "CONCLUIDO", eventoN8n };
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : String(erro);
      const falhasConsecutivas = fluxo.falhasConsecutivas + 1;
      const concluidoEm = new Date();

      await this.prisma.execucaoFluxo.update({
        where: { id: execucao.id },
        data: { estado: "FALHADO", erro: mensagemErro, concluidoEm }
      });

      await this.prisma.outboxEventoN8n.update({
        where: { id: eventoN8n.id },
        data: {
          status: "FALHOU",
          tentativas: { increment: 1 },
          ultimoErro: mensagemErro.slice(0, 1000),
          proximaTentativaEm: new Date(Date.now() + 60_000),
          payloadJson: JSON.stringify({
            negocioId: fluxo.negocioId,
            fluxoId,
            execucaoId: execucao.id,
            gatilhoEntidadeId,
            totalPassos: fluxo.passos.length,
            estado: "FALHADO",
            erro: mensagemErro,
            concluidoEm: concluidoEm.toISOString()
          })
        }
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

      return { execucaoId: execucao.id, estado: "FALHADO", erro: mensagemErro, eventoN8n };
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

  async obterWidgetsContextuais(negocioId: string, contexto: string, membroId?: string) {
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const contextoNormalizado = contexto.toUpperCase();
    const montarResposta = (widgets: WidgetsContextuais) =>
      this.aplicarPreferenciasWidgets(negocioId, contextoNormalizado, widgets, membroId);

    if (contextoNormalizado === "PAINEL") {
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

      return montarResposta({
        tarefasPendentes,
        conversasAbertas,
        vendasDia: vendasDia._count,
        receitaDia: vendasDia._sum.totalEmKwanza ?? 0,
        fluxosActivos
      });
    }

    if (contextoNormalizado === "PEDIDOS") {
      const [aguardandoPagamento, porEntregar] = await Promise.all([
        this.prisma.pedido.count({ where: { negocioId, estadoPagamento: "PENDENTE" } }),
        this.prisma.pedido.count({ where: { negocioId, estadoEntrega: "PENDENTE" } })
      ]);
      return montarResposta({ aguardandoPagamento, porEntregar });
    }

    if (contextoNormalizado === "CONVERSAS") {
      const [naoLidas, tempoMedioSegundos] = await Promise.all([
        this.prisma.conversaAtendimento.count({ where: { negocioId, estado: "ABERTA" } }),
        this.calcularTempoMedioRespostaConversas(negocioId)
      ]);
      return montarResposta({ naoLidas, tempoMedioResposta: tempoMedioSegundos });
    }

    if (contextoNormalizado === "FINANCAS") {
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
      return montarResposta({
        entradasMes: entradas._sum.valor ?? 0,
        saidasMes: saidas._sum.valor ?? 0,
        saldoMes: (entradas._sum.valor ?? 0) - (saidas._sum.valor ?? 0),
        recebeiveisVencidos
      });
    }

    return montarResposta({});
  }

  async configurarLayoutWidgets(
    negocioId: string,
    membroId: string,
    dados: { contexto: string; ordem: string[]; ocultos?: string[] }
  ) {
    const contexto = dados.contexto.toUpperCase();
    const layout = this.normalizarLayoutWidgets(dados.ordem, dados.ocultos ?? []);
    return this.prisma.preferenciaWidgetPainel.upsert({
      where: {
        negocioId_membroId_contexto: {
          negocioId,
          membroId,
          contexto
        }
      },
      create: {
        negocioId,
        membroId,
        contexto,
        layoutJson: JSON.stringify(layout)
      },
      update: {
        layoutJson: JSON.stringify(layout)
      }
    });
  }

  private async aplicarPreferenciasWidgets(
    negocioId: string,
    contexto: string,
    widgetsOriginais: WidgetsContextuais,
    membroId?: string
  ) {
    if (!membroId) {
      return { contexto, widgets: widgetsOriginais };
    }

    const [membro, preferencia] = await Promise.all([
      this.prisma.membroNegocio.findFirst({
        where: { id: membroId, negocioId, status: "ATIVO" },
        select: { id: true, papel: true }
      }),
      this.prisma.preferenciaWidgetPainel.findUnique({
        where: { negocioId_membroId_contexto: { negocioId, membroId, contexto } },
        select: { layoutJson: true }
      })
    ]);

    // RF-T121: a API já devolve o painel reduzido ao papel do membro.
    const widgetsPorPapel = this.filtrarWidgetsPorPapel(widgetsOriginais, contexto, membro?.papel);
    const ocultadosPorPapel = Object.keys(widgetsOriginais).filter((chave) => !(chave in widgetsPorPapel));
    const layoutLido = this.lerLayoutWidgets(preferencia?.layoutJson);
    const layout = this.normalizarLayoutWidgets(layoutLido.ordem, layoutLido.ocultos);
    const chavesDisponiveis = Object.keys(widgetsPorPapel);
    const ordem = [
      ...layout.ordem.filter((chave) => chavesDisponiveis.includes(chave)),
      ...chavesDisponiveis.filter((chave) => !layout.ordem.includes(chave))
    ];
    const ocultos = layout.ocultos.filter((chave) => chavesDisponiveis.includes(chave));
    const visiveis = ordem.filter((chave) => !ocultos.includes(chave));
    const widgets = Object.fromEntries(visiveis.map((chave) => [chave, widgetsPorPapel[chave]]));

    return {
      contexto,
      widgets,
      layout: { ordem, ocultos, visiveis },
      progressiveDisclosure: {
        papel: membro?.papel ?? "DESCONHECIDO",
        widgetsOcultadosPorPapel: ocultadosPorPapel
      }
    };
  }

  private filtrarWidgetsPorPapel(widgets: WidgetsContextuais, contexto: string, papel?: string | null): WidgetsContextuais {
    const papelNormalizado = (papel ?? "").toUpperCase();
    const restritosPorPapel: Record<string, string[]> = {
      VENDEDOR: ["receitaDia", "entradasMes", "saidasMes", "saldoMes"],
      ATENDENTE: ["vendasDia", "receitaDia", "entradasMes", "saidasMes", "saldoMes", "recebeiveisVencidos"],
      ENTREGADOR: ["vendasDia", "receitaDia", "fluxosActivos", "entradasMes", "saidasMes", "saldoMes", "recebeiveisVencidos"]
    };
    const ocultos = contexto === "FINANCAS" && ["VENDEDOR", "ATENDENTE", "ENTREGADOR"].includes(papelNormalizado)
      ? Object.keys(widgets)
      : restritosPorPapel[papelNormalizado] ?? [];

    return Object.fromEntries(Object.entries(widgets).filter(([chave]) => !ocultos.includes(chave)));
  }

  private normalizarLayoutWidgets(ordem: string[], ocultos: string[]): LayoutWidgets {
    const limpar = (valor: string) => valor.trim();
    const ordemUnica = Array.from(new Set(ordem.map(limpar).filter(Boolean))).slice(0, 30);
    const ocultosUnicos = Array.from(new Set(ocultos.map(limpar).filter(Boolean))).slice(0, 30);
    return { ordem: ordemUnica, ocultos: ocultosUnicos };
  }

  private lerLayoutWidgets(layoutJson?: string | null): LayoutWidgets {
    if (!layoutJson) return { ordem: [], ocultos: [] };
    try {
      const bruto = JSON.parse(layoutJson) as Partial<LayoutWidgets>;
      return this.normalizarLayoutWidgets(
        Array.isArray(bruto.ordem) ? bruto.ordem.filter((item): item is string => typeof item === "string") : [],
        Array.isArray(bruto.ocultos) ? bruto.ocultos.filter((item): item is string => typeof item === "string") : []
      );
    } catch {
      return { ordem: [], ocultos: [] };
    }
  }

  private async calcularTempoMedioRespostaConversas(negocioId: string) {
    const conversas = await this.prisma.conversaAtendimento.findMany({
      where: { negocioId },
      orderBy: [{ ultimaMensagemEm: "desc" }, { criadaEm: "desc" }],
      take: 500,
      select: {
        mensagens: {
          orderBy: { enviadaEm: "asc" },
          select: { direcao: true, remetente: true, canal: true, status: true, enviadaEm: true }
        }
      }
    });

    return this.calcularTempoMedioPrimeiraRespostaSegundos(conversas);
  }

  private calcularTempoMedioPrimeiraRespostaSegundos(conversas: ConversaTempoResposta[]) {
    const tempos = conversas.flatMap((conversa) => {
      const primeiraEntrada = conversa.mensagens.find(
        (mensagem) => mensagem.direcao === "INBOUND" || mensagem.remetente === "cliente"
      );
      if (!primeiraEntrada) return [];

      // RF-T078: considera apenas a primeira resposta real após a entrada do cliente.
      const primeiraResposta = conversa.mensagens.find(
        (mensagem) =>
          mensagem.enviadaEm.getTime() > primeiraEntrada.enviadaEm.getTime() &&
          mensagem.direcao === "OUTBOUND" &&
          mensagem.status !== "FAILED" &&
          mensagem.canal !== "interno" &&
          ["agente", "sistema"].includes(mensagem.remetente ?? "")
      );
      if (!primeiraResposta) return [];

      return [Math.round((primeiraResposta.enviadaEm.getTime() - primeiraEntrada.enviadaEm.getTime()) / 1000)];
    });

    if (!tempos.length) return 0;
    return Math.round(tempos.reduce((total, tempo) => total + tempo, 0) / tempos.length);
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

  async enviarResumoDiarioWhatsApp(negocioId: string) {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioOntem = new Date(inicioHoje.getTime() - 24 * 60 * 60 * 1000);
    const fimOntem = new Date(inicioHoje.getTime() - 1);

    const [vendasOntem, pagamentosPendentes, tarefasAtrasadas, pecasActivas, entradasCaixa, saidasCaixa] = await Promise.all([
      this.prisma.pedido.aggregate({
        where: {
          negocioId,
          criadoEm: { gte: inicioOntem, lte: fimOntem },
          estadoPagamento: "CONFIRMADO"
        },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.pedido.aggregate({
        where: { negocioId, estadoPagamento: "PENDENTE" },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.tarefaOperacional.count({
        where: {
          negocioId,
          estado: { in: ["ABERTA", "PENDENTE"] },
          prazoEm: { lt: agora }
        }
      }),
      this.prisma.peca.findMany({
        where: { negocioId, estado: "DISPONIVEL" },
        select: { id: true, quantidade: true, stockMinimo: true }
      }),
      this.prisma.movimentoFinanceiro.aggregate({
        where: { negocioId, tipo: "ENTRADA" },
        _sum: { valor: true }
      }),
      this.prisma.movimentoFinanceiro.aggregate({
        where: { negocioId, tipo: "SAIDA" },
        _sum: { valor: true }
      })
    ]);

    const stockBaixo = pecasActivas.filter((peca) => peca.quantidade <= peca.stockMinimo).length;
    const saldoCaixa = (entradasCaixa._sum.valor ?? 0) - (saidasCaixa._sum.valor ?? 0);
    const conteudo = [
      `Resumo Bizy - ${inicioOntem.toISOString().slice(0, 10)}`,
      `Vendas confirmadas: ${vendasOntem._count} (${this.formatarKwanza(vendasOntem._sum.totalEmKwanza ?? 0)})`,
      `Pagamentos pendentes: ${pagamentosPendentes._count} (${this.formatarKwanza(pagamentosPendentes._sum.totalEmKwanza ?? 0)})`,
      `Tarefas atrasadas: ${tarefasAtrasadas}`,
      `Produtos em stock baixo: ${stockBaixo}`,
      `Saldo de caixa: ${this.formatarKwanza(saldoCaixa)}`
    ].join("\n");

    return this.enfileirarWhatsAppParaGestores(negocioId, "RESUMO_DIARIO", conteudo, {
      periodo: { de: inicioOntem.toISOString(), ate: fimOntem.toISOString() },
      vendasOntem: vendasOntem._count,
      receitaOntem: vendasOntem._sum.totalEmKwanza ?? 0,
      pagamentosPendentes: pagamentosPendentes._count,
      valorPendente: pagamentosPendentes._sum.totalEmKwanza ?? 0,
      tarefasAtrasadas,
      stockBaixo,
      saldoCaixa
    });
  }

  async enviarAlertasProactivosWhatsApp(negocioId: string) {
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();
    const configuracoesAlertas = await this.prisma.configuracaoAlertaProactivo.findMany({
      where: { negocioId, canal: CANAL_ALERTA_PROACTIVO_PADRAO, ativo: true },
      select: { tipo: true, valorMinimo: true }
    });
    const limitePagamentoAlto = configuracoesAlertas.find((config) => config.tipo === "PAGAMENTO_ALTO")?.valorMinimo ?? null;

    const [
      pagamentosPendentes,
      contasPagarVencidas,
      tarefasAtrasadas,
      fluxoNegativo,
      projectosAtrasados,
      projectosComerciaisAtrasados,
      leadsQualificados,
      clientesVipRisco,
      metas,
      vendasMes,
      orcamentos,
      gastosPorCategoria,
      insightsProactivos,
      pagamentosAltos,
      entregasConcluidasHoje
    ] = await Promise.all([
      this.prisma.pedido.aggregate({
        where: { negocioId, estadoPagamento: "PENDENTE" },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.contaPagar.aggregate({
        where: { negocioId, estado: { not: "PAGO" }, dataVencimento: { lt: agora } },
        _count: true,
        _sum: { valor: true }
      }),
      this.prisma.tarefaOperacional.count({
        where: { negocioId, estado: { in: ["ABERTA", "PENDENTE"] }, prazoEm: { lt: agora } }
      }),
      this.prisma.previsaoFluxoCaixa.findFirst({
        where: { negocioId, semanaFim: { gte: agora }, saldoPrevisto: { lt: 0 } },
        orderBy: { semanaInicio: "asc" },
        select: { semanaInicio: true, semanaFim: true, saldoPrevisto: true, confianca: true }
      }),
      this.prisma.projecto.count({
        where: { negocioId, estado: { not: "FECHADO" }, dataFim: { lt: agora } }
      }),
      this.prisma.projetoComercial.count({
        where: { negocioId, estado: { not: "FECHADO" }, dataFim: { lt: agora } }
      }),
      this.prisma.movimentoFunilComercial.count({
        where: {
          negocioId,
          etapaNova: { in: ["QUALIFICADO", "LEAD_QUALIFICADO", "OPORTUNIDADE"] },
          criadoEm: { gte: inicioDia }
        }
      }),
      this.prisma.scoreCliente.count({
        where: {
          negocioId,
          tipoScore: "CHURN",
          OR: [{ segmento: "AT_RISK" }, { probabilidadeChurn: { gte: 0.7 } }]
        }
      }),
      this.prisma.metaVendas.findMany({
        where: {
          negocioId,
          periodo: "MENSAL",
          OR: [
            { mes, ano },
            { mes: null, ano: null }
          ]
        },
        select: { id: true, kpi: true, valorMeta: true }
      }),
      this.prisma.pedido.aggregate({
        where: { negocioId, estadoPagamento: "CONFIRMADO", criadoEm: { gte: inicioMes } },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.orcamentoPeriodo.findMany({
        where: { negocioId, mes, ano },
        select: { categoriaId: true, valorOrcado: true, categoria: { select: { nome: true } } }
      }),
      this.prisma.movimentoFinanceiro.groupBy({
        by: ["categoriaId"],
        where: { negocioId, tipo: "SAIDA", categoriaId: { not: null }, dataMovimento: { gte: inicioMes } },
        _sum: { valor: true }
      }),
      this.prisma.insightPreditivo.findMany({
        where: {
          negocioId,
          confianca: { gte: 0.75 },
          OR: [
            { expiradoEm: null },
            { expiradoEm: { gt: agora } }
          ]
        },
        select: {
          id: true,
          tipo: true,
          titulo: true,
          acaoSugerida: true,
          confianca: true,
          entidadeTipo: true,
          entidadeId: true
        },
        orderBy: [{ confianca: "desc" }, { criadoEm: "desc" }],
        take: 3
      }),
      limitePagamentoAlto && limitePagamentoAlto > 0
        ? this.prisma.pedido.findMany({
          where: {
            negocioId,
            estadoPagamento: "CONFIRMADO",
            totalEmKwanza: { gte: limitePagamentoAlto },
            OR: [
              { pagoEm: { gte: inicioDia } },
              { pagoEm: null, criadoEm: { gte: inicioDia } }
            ]
          },
          select: { id: true, numero: true, totalEmKwanza: true, pagoEm: true, criadoEm: true },
          orderBy: { totalEmKwanza: "desc" },
          take: 5
        })
        : Promise.resolve([]),
      this.prisma.entregaProjecto.findMany({
        where: {
          estado: "CONCLUIDA",
          concluidaEm: { gte: inicioDia },
          projecto: { negocioId }
        },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          concluidaEm: true,
          projecto: { select: { id: true, nome: true } }
        },
        orderBy: { concluidaEm: "desc" },
        take: 50
      })
    ]);

    const alertas: string[] = [];
    if (pagamentosPendentes._count > 0) {
      alertas.push(`${pagamentosPendentes._count} pagamento(s) pendente(s): ${this.formatarKwanza(pagamentosPendentes._sum.totalEmKwanza ?? 0)}`);
    }
    if (contasPagarVencidas._count > 0) {
      alertas.push(`${contasPagarVencidas._count} conta(s) a pagar vencida(s): ${this.formatarKwanza(contasPagarVencidas._sum.valor ?? 0)}`);
    }
    if (tarefasAtrasadas > 0) {
      alertas.push(`${tarefasAtrasadas} tarefa(s) atrasada(s)`);
    }
    if (fluxoNegativo) {
      alertas.push(`Fluxo de caixa previsto negativo: ${this.formatarKwanza(fluxoNegativo.saldoPrevisto)}`);
    }
    if (projectosAtrasados + projectosComerciaisAtrasados > 0) {
      alertas.push(`${projectosAtrasados + projectosComerciaisAtrasados} projecto(s) fora do prazo`);
    }
    if (leadsQualificados > 0) {
      alertas.push(`${leadsQualificados} lead(s) qualificado(s) hoje`);
    }
    if (clientesVipRisco > 0) {
      alertas.push(`${clientesVipRisco} cliente(s) VIP/em risco de churn`);
    }
    if (insightsProactivos.length > 0) {
      alertas.push(`${insightsProactivos.length} insight(s) preditivo(s) de alta confiança para rever`);
    }
    if (pagamentosAltos.length > 0 && limitePagamentoAlto) {
      alertas.push(`${pagamentosAltos.length} pagamento(s) confirmado(s) acima de ${this.formatarKwanza(limitePagamentoAlto)}`);
    }

    const etapasCriticasConcluidas = this.filtrarEntregasCriticas(entregasConcluidasHoje);
    if (etapasCriticasConcluidas.length > 0) {
      alertas.push(`${etapasCriticasConcluidas.length} etapa(s) crítica(s) de projecto concluída(s) hoje`);
    }

    const metasProximas = metas.filter((meta) => {
      const realizado = meta.kpi === "VENDAS_QTD"
        ? vendasMes._count
        : vendasMes._sum.totalEmKwanza ?? 0;
      return meta.valorMeta > 0 && realizado >= meta.valorMeta * 0.8 && realizado < meta.valorMeta;
    });
    if (metasProximas.length > 0) {
      alertas.push(`${metasProximas.length} meta(s) acima de 80% e ainda não concluída(s)`);
    }

    const gastoPorCategoria = new Map(
      gastosPorCategoria.flatMap((gasto) => (gasto.categoriaId ? [[gasto.categoriaId, gasto._sum.valor ?? 0]] : []))
    );
    const categoriasExcedidas = orcamentos.filter((orcamento) => (gastoPorCategoria.get(orcamento.categoriaId) ?? 0) >= orcamento.valorOrcado);
    if (categoriasExcedidas.length > 0) {
      alertas.push(`${categoriasExcedidas.length} categoria(s) acima do orçamento mensal`);
    }

    if (alertas.length === 0) {
      return { tipo: "ALERTA_PROACTIVO", destinatarios: 0, enfileiradas: 0, alertas: [] };
    }

    const conteudo = ["Alertas Bizy", ...alertas.map((alerta) => `- ${alerta}`)].join("\n");
    return this.enfileirarWhatsAppParaGestores(negocioId, "ALERTA_PROACTIVO", conteudo, {
      alertas,
      fluxoNegativo,
      leadsQualificados,
      clientesVipRisco,
      insightsProactivos,
      pagamentosAltos: pagamentosAltos.map((pedido) => ({
        pedidoId: pedido.id,
        numero: pedido.numero,
        totalEmKwanza: pedido.totalEmKwanza,
        limiteConfigurado: limitePagamentoAlto
      })),
      etapasCriticasConcluidas,
      metasProximas: metasProximas.length,
      categoriasExcedidas: categoriasExcedidas.map((orcamento) => ({
        categoriaId: orcamento.categoriaId,
        categoria: orcamento.categoria.nome,
        valorOrcado: orcamento.valorOrcado,
        realizado: gastoPorCategoria.get(orcamento.categoriaId) ?? 0
      })),
      geradoEm: agora.toISOString()
    });
  }

  async configurarAlertaProactivo(
    negocioId: string,
    dados: {
      tipo: TipoAlertaProactivo;
      canal?: "WHATSAPP";
      ativo?: boolean;
      valorMinimo?: number;
    }
  ) {
    const canal = dados.canal ?? CANAL_ALERTA_PROACTIVO_PADRAO;
    if (dados.tipo === "PAGAMENTO_ALTO" && dados.ativo !== false && (!dados.valorMinimo || dados.valorMinimo <= 0)) {
      throw new Error("RF-T070: configure um valor mínimo positivo para alertas de pagamento alto.");
    }

    return this.prisma.configuracaoAlertaProactivo.upsert({
      where: {
        negocioId_tipo_canal: {
          negocioId,
          tipo: dados.tipo,
          canal
        }
      },
      create: {
        negocioId,
        tipo: dados.tipo,
        canal,
        ativo: dados.ativo ?? true,
        valorMinimo: dados.valorMinimo
      },
      update: {
        ativo: dados.ativo ?? true,
        valorMinimo: dados.valorMinimo
      }
    });
  }

  async listarConfiguracoesAlertasProactivos(negocioId: string) {
    return this.prisma.configuracaoAlertaProactivo.findMany({
      where: { negocioId },
      orderBy: [{ canal: "asc" }, { tipo: "asc" }]
    });
  }

  async executarRotinaNotificacoesProactivas(
    negocioId: string,
    dados?: { tipo?: TipoRotinaNotificacaoProactiva; origem?: OrigemRotinaNotificacaoProactiva }
  ) {
    const tipo = dados?.tipo ?? "TODOS";
    const origem = dados?.origem ?? "MANUAL";
    const resultados = [];

    if (tipo === "RESUMO_DIARIO" || tipo === "TODOS") {
      resultados.push(await this.enviarResumoDiarioWhatsApp(negocioId));
    }
    if (tipo === "ALERTAS" || tipo === "TODOS") {
      resultados.push(await this.enviarAlertasProactivosWhatsApp(negocioId));
    }

    const eventoN8n = await this.registarEventoN8nWorkflow(
      negocioId,
      "WORKFLOW_NOTIFICACOES_PROACTIVAS_EXECUTADO",
      { tipo, origem, resultados }
    );

    return { tipo, origem, resultados, eventoN8n };
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

  private async enfileirarWhatsAppParaGestores(
    negocioId: string,
    tipo: "RESUMO_DIARIO" | "ALERTA_PROACTIVO",
    conteudo: string,
    contexto: Record<string, unknown>
  ) {
    const destinatarios = await this.obterDestinatariosGestaoWhatsApp(negocioId);
    const mensagens: Array<{ id: string; telefone: string; status: string }> = [];

    for (const membro of destinatarios) {
      const limite = await this.verificarLimiteNotificacao(negocioId, membro.id, "WHATSAPP");
      if (!limite.permitido) continue;

      // RN-T026/RN-T027: só enfileira se houver consentimento WhatsApp activo e quota diária disponível.
      const mensagem = await this.prisma.outboxMensagemWhatsApp.create({
        data: {
          negocioId,
          telefone: membro.usuario.telefone,
          tipo,
          conteudo,
          contextoJson: JSON.stringify({
            ...contexto,
            membroId: membro.id,
            limiteRestanteAntesEnvio: limite.restantes
          })
        }
      });
      await this.incrementarContadorNotificacao(negocioId, membro.id, "WHATSAPP");
      mensagens.push({ id: mensagem.id, telefone: mensagem.telefone, status: mensagem.status });
    }

    return {
      tipo,
      destinatarios: destinatarios.length,
      enfileiradas: mensagens.length,
      mensagens
    };
  }

  private async obterDestinatariosGestaoWhatsApp(negocioId: string) {
    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId, status: "ATIVO" },
      include: { usuario: { select: { nome: true, telefone: true } } }
    });

    return membros.filter((membro) => {
      const papel = membro.papel.toUpperCase();
      const papelGestao = ["DONO", "OWNER", "ADMIN", "GESTOR", "MANAGER"].some((item) => papel.includes(item));
      return papelGestao && Boolean(membro.usuario.telefone);
    }) as Array<(typeof membros)[number] & { usuario: { nome: string; telefone: string } }>;
  }

  private filtrarEntregasCriticas(
    entregas: Array<{
      id: string;
      titulo: string;
      descricao: string | null;
      concluidaEm: Date | null;
      projecto: { id: string; nome: string };
    }>
  ) {
    return entregas.filter((entrega) => {
      const texto = this.normalizarTexto(`${entrega.titulo} ${entrega.descricao ?? ""}`);
      return /\b(critica|critico|go live|go-live|lancamento|marco|milestone|fecho|entrega final|homologacao|aprovacao)\b/.test(texto);
    });
  }

  private normalizarTexto(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  private async registarEventoN8nWorkflow(
    negocioId: string,
    tipo: string,
    payload: Record<string, unknown>
  ) {
    return this.prisma.outboxEventoN8n.create({
      data: {
        negocioId,
        eventoId: randomUUID(),
        tipo,
        payloadJson: JSON.stringify({
          negocioId,
          ...payload,
          emitidoEm: new Date().toISOString()
        }),
        status: "PENDENTE",
        proximaTentativaEm: new Date()
      },
      select: { id: true, eventoId: true, status: true }
    });
  }

  private async criarExecucaoFluxoComOutbox(
    negocioId: string,
    fluxoId: string,
    gatilhoEntidadeId: string | undefined,
    totalPassos: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      const execucao = await tx.execucaoFluxo.create({
        data: { fluxoId, gatilhoEntidadeId, estado: "EM_EXECUCAO" }
      });

      const eventoN8n = await tx.outboxEventoN8n.create({
        data: {
          negocioId,
          eventoId: randomUUID(),
          tipo: "WORKFLOW_FLUXO_EXECUTAR",
          payloadJson: JSON.stringify({
            negocioId,
            fluxoId,
            execucaoId: execucao.id,
            gatilhoEntidadeId,
            totalPassos,
            estado: "EM_EXECUCAO",
            emitidoEm: new Date().toISOString()
          }),
          status: "PENDENTE",
          proximaTentativaEm: new Date()
        },
        select: { id: true, eventoId: true, status: true }
      });

      return { execucao, eventoN8n };
    });
  }

  private formatarKwanza(valor: number) {
    return `${valor.toLocaleString("pt-AO")} Kz`;
  }
}
