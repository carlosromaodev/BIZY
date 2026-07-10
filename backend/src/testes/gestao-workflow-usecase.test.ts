import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { GestaoWorkflowUseCase } from "../use-case/GestaoWorkflowUseCase.js";

describe("GestaoWorkflowUseCase", () => {
  it("RF-T069/RN-T026/RN-T027: enfileira resumo diário WhatsApp só para gestor com consentimento e limite", async () => {
    const pedido = {
      aggregate: vi.fn()
        .mockResolvedValueOnce({ _count: 3, _sum: { totalEmKwanza: 90000 } })
        .mockResolvedValueOnce({ _count: 2, _sum: { totalEmKwanza: 40000 } })
    };
    const tarefaOperacional = {
      count: vi.fn().mockResolvedValue(4)
    };
    const peca = {
      findMany: vi.fn().mockResolvedValue([
        { id: "peca-1", quantidade: 1, stockMinimo: 2 },
        { id: "peca-2", quantidade: 5, stockMinimo: 2 }
      ])
    };
    const movimentoFinanceiro = {
      aggregate: vi.fn()
        .mockResolvedValueOnce({ _sum: { valor: 150000 } })
        .mockResolvedValueOnce({ _sum: { valor: 30000 } })
    };
    const membroNegocio = {
      findMany: vi.fn().mockResolvedValue([
        { id: "membro-dono", papel: "DONO", status: "ATIVO", usuario: { nome: "Dono", telefone: "+244900000001" } },
        { id: "membro-vendedor", papel: "VENDEDOR", status: "ATIVO", usuario: { nome: "Vendedor", telefone: "+244900000002" } }
      ])
    };
    const configuracaoNotificacao = {
      findFirst: vi.fn().mockResolvedValue({ id: "config-1", ativo: true })
    };
    const contadorNotificacaoDiaria = {
      findUnique: vi.fn().mockResolvedValue({ contagem: 2 }),
      upsert: vi.fn().mockResolvedValue({ contagem: 3 })
    };
    const outboxMensagemWhatsApp = {
      create: vi.fn().mockResolvedValue({
        id: "outbox-1",
        telefone: "+244900000001",
        status: "PENDENTE"
      })
    };
    const prisma = {
      pedido,
      tarefaOperacional,
      peca,
      movimentoFinanceiro,
      membroNegocio,
      configuracaoNotificacao,
      contadorNotificacaoDiaria,
      outboxMensagemWhatsApp
    } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.enviarResumoDiarioWhatsApp("negocio-1");

    expect(resultado).toEqual(
      expect.objectContaining({
        tipo: "RESUMO_DIARIO",
        destinatarios: 1,
        enfileiradas: 1
      })
    );
    expect(outboxMensagemWhatsApp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negocioId: "negocio-1",
          telefone: "+244900000001",
          tipo: "RESUMO_DIARIO",
          conteudo: expect.stringContaining("Saldo de caixa:")
        })
      })
    );
    expect(contadorNotificacaoDiaria.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ membroId: "membro-dono", canal: "WHATSAPP" }),
        update: { contagem: { increment: 1 } }
      })
    );
  });

  it("RF-T078: calcula o tempo médio de primeira resposta nos widgets de conversas", async () => {
    const conversaAtendimento = {
      count: vi.fn().mockResolvedValue(2),
      findMany: vi.fn().mockResolvedValue([
        {
          mensagens: [
            {
              direcao: "INBOUND",
              remetente: "cliente",
              canal: "whatsapp",
              status: "RECEIVED",
              enviadaEm: new Date("2026-06-01T09:00:00.000Z")
            },
            {
              direcao: "OUTBOUND",
              remetente: "agente",
              canal: "whatsapp",
              status: "SENT",
              enviadaEm: new Date("2026-06-01T09:05:00.000Z")
            }
          ]
        },
        {
          mensagens: [
            {
              direcao: "INBOUND",
              remetente: "cliente",
              canal: "whatsapp",
              status: "RECEIVED",
              enviadaEm: new Date("2026-06-01T10:00:00.000Z")
            },
            {
              direcao: "OUTBOUND",
              remetente: "sistema",
              canal: "whatsapp",
              status: "FAILED",
              enviadaEm: new Date("2026-06-01T10:02:00.000Z")
            },
            {
              direcao: "OUTBOUND",
              remetente: "agente",
              canal: "whatsapp",
              status: "SENT",
              enviadaEm: new Date("2026-06-01T10:10:00.000Z")
            }
          ]
        },
        {
          mensagens: [
            {
              direcao: "INBOUND",
              remetente: "cliente",
              canal: "whatsapp",
              status: "RECEIVED",
              enviadaEm: new Date("2026-06-01T11:00:00.000Z")
            }
          ]
        }
      ])
    };
    const prisma = { conversaAtendimento } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.obterWidgetsContextuais("negocio-1", "CONVERSAS");

    expect(resultado).toEqual({
      contexto: "CONVERSAS",
      widgets: { naoLidas: 2, tempoMedioResposta: 450 }
    });
    expect(conversaAtendimento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { negocioId: "negocio-1" },
        take: 500
      })
    );
  });

  it("RF-T080/RF-T121: aplica layout personalizado e oculta widgets sensíveis por papel", async () => {
    const tarefaOperacional = {
      count: vi.fn().mockResolvedValue(2)
    };
    const conversaAtendimento = {
      count: vi.fn().mockResolvedValue(3)
    };
    const pedido = {
      aggregate: vi.fn().mockResolvedValue({ _count: 4, _sum: { totalEmKwanza: 120_000 } })
    };
    const fluxoAutomatico = {
      count: vi.fn().mockResolvedValue(1)
    };
    const membroNegocio = {
      findFirst: vi.fn().mockResolvedValue({ id: "membro-vendedor", papel: "VENDEDOR" })
    };
    const preferenciaWidgetPainel = {
      findUnique: vi.fn().mockResolvedValue({
        layoutJson: JSON.stringify({
          ordem: ["fluxosActivos", "receitaDia", "tarefasPendentes"],
          ocultos: ["fluxosActivos"]
        })
      })
    };
    const prisma = {
      tarefaOperacional,
      conversaAtendimento,
      pedido,
      fluxoAutomatico,
      membroNegocio,
      preferenciaWidgetPainel
    } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.obterWidgetsContextuais("negocio-1", "PAINEL", "membro-vendedor");

    expect(resultado.widgets).toEqual({
      tarefasPendentes: 2,
      conversasAbertas: 3,
      vendasDia: 4
    });
    expect(resultado.layout).toEqual({
      ordem: ["fluxosActivos", "tarefasPendentes", "conversasAbertas", "vendasDia"],
      ocultos: ["fluxosActivos"],
      visiveis: ["tarefasPendentes", "conversasAbertas", "vendasDia"]
    });
    expect(resultado.progressiveDisclosure).toEqual({
      papel: "VENDEDOR",
      widgetsOcultadosPorPapel: ["receitaDia"]
    });
  });

  it("RF-T080: persiste a disposição de widgets por membro e contexto", async () => {
    const preferenciaWidgetPainel = {
      upsert: vi.fn().mockResolvedValue({ id: "preferencia-1" })
    };
    const prisma = { preferenciaWidgetPainel } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.configurarLayoutWidgets("negocio-1", "membro-1", {
      contexto: "painel",
      ordem: ["vendasDia", "vendasDia", "receitaDia"],
      ocultos: ["fluxosActivos", "fluxosActivos"]
    });

    expect(resultado).toEqual({ id: "preferencia-1" });
    expect(preferenciaWidgetPainel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          negocioId_membroId_contexto: {
            negocioId: "negocio-1",
            membroId: "membro-1",
            contexto: "PAINEL"
          }
        }
      })
    );
    const payload = preferenciaWidgetPainel.upsert.mock.calls[0][0];
    expect(JSON.parse(payload.create.layoutJson)).toEqual({
      ordem: ["vendasDia", "receitaDia"],
      ocultos: ["fluxosActivos"]
    });
    expect(JSON.parse(payload.update.layoutJson)).toEqual({
      ordem: ["vendasDia", "receitaDia"],
      ocultos: ["fluxosActivos"]
    });
  });

  it("RNF-T021: regista execução de fluxo em outbox n8n antes de processar passos", async () => {
    const fluxoAutomatico = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "fluxo-1",
        negocioId: "negocio-1",
        nome: "Aviso pagamento",
        ativo: true,
        pausadoPorFalha: false,
        falhasConsecutivas: 0,
        passos: [
          { id: "passo-1", ordem: 1, tipo: "ACAO" },
          { id: "passo-2", ordem: 2, tipo: "NOTIFICACAO" }
        ]
      }),
      update: vi.fn().mockResolvedValue({ id: "fluxo-1" })
    };
    const execucaoFluxo = {
      create: vi.fn().mockResolvedValue({ id: "execucao-1", fluxoId: "fluxo-1" }),
      update: vi.fn().mockResolvedValue({ id: "execucao-1" })
    };
    const outboxEventoN8n = {
      create: vi.fn().mockResolvedValue({ id: "outbox-n8n-1", eventoId: "evento-1", status: "PENDENTE" }),
      update: vi.fn().mockResolvedValue({ id: "outbox-n8n-1", status: "PUBLICADO" })
    };
    const prisma = {
      fluxoAutomatico,
      execucaoFluxo,
      outboxEventoN8n,
      $transaction: vi.fn(async (operacao) => {
        if (typeof operacao === "function") return operacao({ execucaoFluxo, outboxEventoN8n });
        return Promise.all(operacao);
      })
    } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.executarFluxo("fluxo-1", "pedido-1");

    expect(resultado).toEqual(
      expect.objectContaining({
        execucaoId: "execucao-1",
        estado: "CONCLUIDO",
        eventoN8n: { id: "outbox-n8n-1", eventoId: "evento-1", status: "PENDENTE" }
      })
    );
    expect(outboxEventoN8n.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negocioId: "negocio-1",
          tipo: "WORKFLOW_FLUXO_EXECUTAR",
          status: "PENDENTE"
        })
      })
    );
    const payloadInicial = JSON.parse(outboxEventoN8n.create.mock.calls[0][0].data.payloadJson);
    expect(payloadInicial).toEqual(
      expect.objectContaining({
        fluxoId: "fluxo-1",
        execucaoId: "execucao-1",
        gatilhoEntidadeId: "pedido-1",
        totalPassos: 2,
        estado: "EM_EXECUCAO"
      })
    );
    expect(execucaoFluxo.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "execucao-1" }, data: { passoActual: 1 } })
    );
    expect(execucaoFluxo.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "execucao-1" }, data: { passoActual: 2 } })
    );
    expect(outboxEventoN8n.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outbox-n8n-1" },
        data: expect.objectContaining({
          status: "PUBLICADO",
          ultimoErro: null
        })
      })
    );
    const payloadFinal = JSON.parse(outboxEventoN8n.update.mock.calls[0][0].data.payloadJson);
    expect(payloadFinal).toEqual(expect.objectContaining({ execucaoId: "execucao-1", estado: "CONCLUIDO" }));
  });

  it("RN-T025: pausa fluxo e cria tarefa humana apos falhas criticas consecutivas", async () => {
    const fluxoAutomatico = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "fluxo-critico",
        negocioId: "negocio-1",
        nome: "Cobranca automatica",
        ativo: true,
        pausadoPorFalha: false,
        falhasConsecutivas: 2,
        passos: [{ id: "passo-1", ordem: 1, tipo: "WEBHOOK" }]
      }),
      update: vi.fn().mockResolvedValue({ id: "fluxo-critico" })
    };
    const execucaoFluxo = {
      create: vi.fn().mockResolvedValue({ id: "execucao-critica", fluxoId: "fluxo-critico" }),
      update: vi
        .fn()
        .mockRejectedValueOnce(new Error("Provider n8n indisponivel"))
        .mockResolvedValue({ id: "execucao-critica" })
    };
    const outboxEventoN8n = {
      create: vi.fn().mockResolvedValue({ id: "outbox-critico", eventoId: "evento-critico", status: "PENDENTE" }),
      update: vi.fn().mockResolvedValue({ id: "outbox-critico", status: "FALHOU" })
    };
    const tarefaOperacional = {
      create: vi.fn().mockResolvedValue({ id: "tarefa-workflow-1" })
    };
    const prisma = {
      fluxoAutomatico,
      execucaoFluxo,
      outboxEventoN8n,
      tarefaOperacional,
      $transaction: vi.fn(async (operacao) => {
        if (typeof operacao === "function") return operacao({ execucaoFluxo, outboxEventoN8n });
        return Promise.all(operacao);
      })
    } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.executarFluxo("fluxo-critico", "pedido-1");

    expect(resultado).toEqual(
      expect.objectContaining({
        execucaoId: "execucao-critica",
        estado: "FALHADO",
        erro: "Provider n8n indisponivel"
      })
    );
    expect(fluxoAutomatico.update).toHaveBeenCalledWith({
      where: { id: "fluxo-critico" },
      data: { falhasConsecutivas: 3, pausadoPorFalha: true, ativo: false }
    });
    expect(tarefaOperacional.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        negocioId: "negocio-1",
        tipo: "WORKFLOW",
        prioridade: "ALTA",
        estado: "ABERTA",
        titulo: expect.stringContaining("pausado por falhas consecutivas"),
        descricao: expect.stringContaining("Provider n8n indisponivel")
      })
    });
    expect(outboxEventoN8n.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "outbox-critico" },
        data: expect.objectContaining({
          status: "FALHOU",
          ultimoErro: "Provider n8n indisponivel"
        })
      })
    );
  });

  it("RF-T070/RF-T072: usa threshold configurável e etapa crítica concluída nos alertas WhatsApp", async () => {
    const configuracaoAlertaProactivo = {
      findMany: vi.fn().mockResolvedValue([
        { tipo: "PAGAMENTO_ALTO", valorMinimo: 50_000 }
      ])
    };
    const pedido = {
      aggregate: vi.fn()
        .mockResolvedValueOnce({ _count: 0, _sum: { totalEmKwanza: null } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalEmKwanza: null } }),
      findMany: vi.fn().mockResolvedValue([
        { id: "pedido-1", numero: 12, totalEmKwanza: 80_000, pagoEm: new Date(), criadoEm: new Date() }
      ])
    };
    const contaPagar = {
      aggregate: vi.fn().mockResolvedValue({ _count: 0, _sum: { valor: null } })
    };
    const tarefaOperacional = {
      count: vi.fn().mockResolvedValue(0)
    };
    const previsaoFluxoCaixa = {
      findFirst: vi.fn().mockResolvedValue(null)
    };
    const projecto = {
      count: vi.fn().mockResolvedValue(0)
    };
    const projetoComercial = {
      count: vi.fn().mockResolvedValue(0)
    };
    const movimentoFunilComercial = {
      count: vi.fn().mockResolvedValue(0)
    };
    const scoreCliente = {
      count: vi.fn().mockResolvedValue(0)
    };
    const metaVendas = {
      findMany: vi.fn().mockResolvedValue([])
    };
    const orcamentoPeriodo = {
      findMany: vi.fn().mockResolvedValue([])
    };
    const movimentoFinanceiro = {
      groupBy: vi.fn().mockResolvedValue([])
    };
    const insightPreditivo = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "insight-1",
          tipo: "CHURN",
          titulo: "Cliente VIP em risco",
          acaoSugerida: "Enviar proposta de retenção",
          confianca: 0.91,
          entidadeTipo: "CLIENTE",
          entidadeId: "cliente-1"
        }
      ])
    };
    const entregaProjecto = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "entrega-1",
          titulo: "Marco crítico de homologação",
          descricao: null,
          concluidaEm: new Date(),
          projecto: { id: "projecto-1", nome: "Lançamento Julho" }
        },
        {
          id: "entrega-2",
          titulo: "Reunião de rotina",
          descricao: null,
          concluidaEm: new Date(),
          projecto: { id: "projecto-1", nome: "Lançamento Julho" }
        }
      ])
    };
    const membroNegocio = {
      findMany: vi.fn().mockResolvedValue([
        { id: "membro-dono", papel: "DONO", status: "ATIVO", usuario: { nome: "Dono", telefone: "+244900000001" } }
      ])
    };
    const configuracaoNotificacao = {
      findFirst: vi.fn().mockResolvedValue({ id: "config-whatsapp", ativo: true })
    };
    const contadorNotificacaoDiaria = {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ contagem: 1 })
    };
    const outboxMensagemWhatsApp = {
      create: vi.fn().mockResolvedValue({ id: "msg-1", telefone: "+244900000001", status: "PENDENTE" })
    };
    const prisma = {
      configuracaoAlertaProactivo,
      pedido,
      contaPagar,
      tarefaOperacional,
      previsaoFluxoCaixa,
      projecto,
      projetoComercial,
      movimentoFunilComercial,
      scoreCliente,
      metaVendas,
      orcamentoPeriodo,
      movimentoFinanceiro,
      insightPreditivo,
      entregaProjecto,
      membroNegocio,
      configuracaoNotificacao,
      contadorNotificacaoDiaria,
      outboxMensagemWhatsApp
    } as unknown as PrismaClient;
    const useCase = new GestaoWorkflowUseCase(prisma);

    const resultado = await useCase.enviarAlertasProactivosWhatsApp("negocio-1");

    expect(resultado).toEqual(expect.objectContaining({ tipo: "ALERTA_PROACTIVO", enfileiradas: 1 }));
    expect(pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          totalEmKwanza: { gte: 50_000 }
        })
      })
    );
    expect(outboxMensagemWhatsApp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conteudo: expect.stringContaining("pagamento(s) confirmado(s) acima de")
        })
      })
    );
    expect(outboxMensagemWhatsApp.create.mock.calls[0][0].data.conteudo).toContain("etapa(s) crítica(s)");
    const contextoJson = JSON.parse(outboxMensagemWhatsApp.create.mock.calls[0][0].data.contextoJson);
    expect(contextoJson.insightsProactivos).toHaveLength(1);
    expect(contextoJson.pagamentosAltos).toHaveLength(1);
    expect(contextoJson.etapasCriticasConcluidas).toHaveLength(1);
  });
});
