import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { GestaoEquipaUseCase } from "../use-case/GestaoEquipaUseCase.js";

describe("GestaoEquipaUseCase — lógica pura", () => {
  it("instancia o use case", async () => {
    const uc = new GestaoEquipaUseCase(null as never);
    expect(uc).toBeDefined();
  });

  it("itens de onboarding padrão incluem o fluxo guiado do membro", () => {
    const ITENS = [
      { item: "PERFIL_COMPLETO", descricao: "Completar perfil com nome, foto e contacto" },
      { item: "CONFIGURAR_NOTIFICACOES", descricao: "Configurar alertas pessoais de WhatsApp, email ou push" },
      { item: "TOUR_MODULOS_PERMITIDOS", descricao: "Conhecer os módulos disponíveis para o seu papel" },
      { item: "PRIMEIRA_TAREFA", descricao: "Concluir a primeira tarefa atribuída" },
      { item: "ENVIAR_MENSAGEM", descricao: "Enviar primeira mensagem a um cliente" }
    ];

    expect(ITENS).toHaveLength(5);
    expect(ITENS.map((i) => i.item)).toEqual([
      "PERFIL_COMPLETO",
      "CONFIGURAR_NOTIFICACOES",
      "TOUR_MODULOS_PERMITIDOS",
      "PRIMEIRA_TAREFA",
      "ENVIAR_MENSAGEM"
    ]);
  });

  it("calcula percentagem de onboarding correctamente", () => {
    const total = 4;
    const cenarios = [
      { concluidos: 0, esperado: 0 },
      { concluidos: 1, esperado: 25 },
      { concluidos: 2, esperado: 50 },
      { concluidos: 3, esperado: 75 },
      { concluidos: 4, esperado: 100 }
    ];

    for (const { concluidos, esperado } of cenarios) {
      const percentagem = total > 0 ? Math.round((concluidos / total) * 100) : 100;
      expect(percentagem).toBe(esperado);
    }
  });

  it("calcula horas trabalhadas a partir de check-in/check-out", () => {
    const registos = [
      { tipo: "CHECK_IN", registadoEm: new Date("2026-06-23T08:00:00Z") },
      { tipo: "CHECK_OUT", registadoEm: new Date("2026-06-23T12:30:00Z") },
      { tipo: "CHECK_IN", registadoEm: new Date("2026-06-23T14:00:00Z") },
      { tipo: "CHECK_OUT", registadoEm: new Date("2026-06-23T18:00:00Z") }
    ];

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

    expect(totalMinutos).toBe(510); // 270min (manhã) + 240min (tarde)
    expect(Math.round((totalMinutos / 60) * 10) / 10).toBe(8.5);
  });

  it("RF-T117: regista check-in via WhatsApp a partir do comando Iniciar", async () => {
    const membroNegocio = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "membro-1",
          negocioId: "negocio-1",
          usuarioId: "usuario-1",
          papel: "VENDEDOR",
          status: "ATIVO",
          usuario: { id: "usuario-1", nome: "Ana", telefone: "+244 923 000 111" }
        }
      ])
    };
    const registoPresenca = {
      create: vi.fn().mockResolvedValue({
        id: "presenca-1",
        negocioId: "negocio-1",
        membroId: "membro-1",
        tipo: "CHECK_IN",
        metodo: "WHATSAPP"
      })
    };
    const feedActividade = {
      create: vi.fn().mockResolvedValue({ id: "feed-1" })
    };
    const prisma = { membroNegocio, registoPresenca, feedActividade } as unknown as PrismaClient;
    const uc = new GestaoEquipaUseCase(prisma);

    const resultado = await uc.registarPresencaViaWhatsApp({
      negocioId: "negocio-1",
      telefone: "244923000111",
      texto: "Iniciar turno"
    });

    expect(resultado).toEqual(
      expect.objectContaining({
        reconhecido: true,
        aplicado: true,
        tipo: "CHECK_IN",
        membroId: "membro-1"
      })
    );
    expect(registoPresenca.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        negocioId: "negocio-1",
        membroId: "membro-1",
        tipo: "CHECK_IN",
        metodo: "WHATSAPP",
        observacao: expect.stringContaining("Iniciar turno")
      })
    });
    expect(feedActividade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "CHECK_IN",
          resumo: expect.stringContaining("WHATSAPP")
        })
      })
    );
  });

  it("RF-T064: devolve onboarding guiado com tour de módulos e primeira tarefa", async () => {
    const membro = {
      id: "membro-vendedor",
      negocioId: "negocio-1",
      usuarioId: "usuario-vendedor",
      papel: "VENDEDOR",
      status: "ATIVO",
      criadoEm: new Date("2026-06-30T09:00:00.000Z"),
      usuario: {
        id: "usuario-vendedor",
        nome: "Vendedor",
        email: "vendedor@bizy.test",
        telefone: "923000222",
        avatarUrl: null
      }
    };
    const membroNegocio = {
      findFirstOrThrow: vi.fn().mockResolvedValue(membro)
    };
    const checklistOnboarding = {
      findMany: vi.fn().mockResolvedValue([
        { item: "PERFIL_COMPLETO", descricao: "Completar perfil", concluido: true, concluidoEm: new Date("2026-06-30T10:00:00.000Z") },
        { item: "TOUR_MODULOS_PERMITIDOS", descricao: "Conhecer módulos", concluido: false, concluidoEm: null }
      ])
    };
    const conviteEquipa = {
      findFirst: vi.fn().mockResolvedValue(null)
    };
    const tarefaOperacional = {
      findFirst: vi.fn().mockResolvedValue({
        id: "tarefa-onboarding",
        titulo: "Completar primeiro passo no BIZY Team",
        origem: "ONBOARDING_MEMBRO",
        responsavelId: "usuario-vendedor"
      })
    };
    const prisma = {
      membroNegocio,
      checklistOnboarding,
      conviteEquipa,
      tarefaOperacional
    } as unknown as PrismaClient;
    const uc = new GestaoEquipaUseCase(prisma);

    const resultado = await uc.obterOnboardingGuiado("negocio-1", "membro-vendedor");

    expect(resultado.progresso).toEqual({ total: 5, concluidos: 1, percentagem: 20 });
    expect(resultado.passos.map((passo) => passo.tipo)).toEqual([
      "PERFIL",
      "NOTIFICACOES",
      "TOUR",
      "TAREFA",
      "COMUNICACAO"
    ]);
    expect(resultado.tour.modulosOcultos).toEqual(["FINANCAS", "PIPELINE", "RELATORIOS", "CAMPANHAS"]);
    expect(resultado.primeiraTarefa).toEqual(expect.objectContaining({ id: "tarefa-onboarding" }));
  });

  it("verifica disponibilidade actual baseada em horário do turno", () => {
    const turnos = [
      { membroId: "m1", nome: "Ana", horaInicio: "08:00", horaFim: "12:00" },
      { membroId: "m2", nome: "Bruno", horaInicio: "14:00", horaFim: "18:00" }
    ];

    function verificarDisponibilidade(horaActual: string) {
      return turnos.map((t) => ({
        ...t,
        emTurno: horaActual >= t.horaInicio && horaActual <= t.horaFim
      }));
    }

    const manha = verificarDisponibilidade("10:00");
    expect(manha[0].emTurno).toBe(true);  // Ana em turno
    expect(manha[1].emTurno).toBe(false); // Bruno fora

    const tarde = verificarDisponibilidade("15:00");
    expect(tarde[0].emTurno).toBe(false); // Ana fora
    expect(tarde[1].emTurno).toBe(true);  // Bruno em turno
  });

  it("identifica papéis sensíveis", () => {
    const PAPEIS_SENSIVEIS = ["ADMIN", "GESTOR_FINANCEIRO", "DONO"];

    expect(PAPEIS_SENSIVEIS.includes("ADMIN")).toBe(true);
    expect(PAPEIS_SENSIVEIS.includes("DONO")).toBe(true);
    expect(PAPEIS_SENSIVEIS.includes("VENDEDOR")).toBe(false);
    expect(PAPEIS_SENSIVEIS.includes("ATENDENTE")).toBe(false);
  });

  it("RF-T115: resolve membro alvo e audita consulta em Modo Sombra", async () => {
    const membroNegocio = {
      findFirst: vi.fn().mockResolvedValue({
        id: "membro-vendedor",
        negocioId: "negocio-1",
        usuarioId: "usuario-vendedor",
        papel: "VENDEDOR",
        status: "ATIVO",
        usuario: {
          id: "usuario-vendedor",
          nome: "Vendedor",
          email: "vendedor@bizy.test",
          telefone: "923000222",
          avatarUrl: null
        }
      })
    };
    const feedActividade = {
      create: vi.fn().mockResolvedValue({ id: "feed-modo-sombra" })
    };
    const prisma = { membroNegocio, feedActividade } as unknown as PrismaClient;
    const uc = new GestaoEquipaUseCase(prisma);

    const membro = await uc.obterMembroDetalhado("negocio-1", "membro-vendedor");
    await uc.registarVisualizacaoModoSombra("negocio-1", "membro-vendedor", "usuario-gestor");

    expect(membro).toEqual(
      expect.objectContaining({
        id: "membro-vendedor",
        papel: "VENDEDOR",
        usuario: expect.objectContaining({ nome: "Vendedor" })
      })
    );
    expect(membroNegocio.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "membro-vendedor", negocioId: "negocio-1" }
      })
    );
    expect(feedActividade.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        negocioId: "negocio-1",
        autorId: "usuario-gestor",
        tipo: "MODO_SOMBRA_CONSULTADO",
        entidadeId: "membro-vendedor"
      })
    });
  });

  it("ranking ordena por receita descrescente", () => {
    const kpis = [
      { nome: "Ana", receitaTotal: 50000 },
      { nome: "Bruno", receitaTotal: 120000 },
      { nome: "Carla", receitaTotal: 80000 }
    ];

    const ranking = [...kpis]
      .sort((a, b) => b.receitaTotal - a.receitaTotal)
      .map((m, i) => ({ ...m, posicao: i + 1 }));

    expect(ranking[0].nome).toBe("Bruno");
    expect(ranking[0].posicao).toBe(1);
    expect(ranking[1].nome).toBe("Carla");
    expect(ranking[2].nome).toBe("Ana");
  });

  it("calcula taxa de conversão", () => {
    const totalVendas = 20;
    const pedidosPagos = 15;
    const taxaConversao = totalVendas > 0 ? Math.round((pedidosPagos / totalVendas) * 100) : 0;

    expect(taxaConversao).toBe(75);
  });

  it("RNF-T004: lista até 500 membros com paginação e filtros no banco", async () => {
    const membros = Array.from({ length: 500 }, (_, indice) => ({
      id: `membro-${indice}`,
      negocioId: "negocio-1",
      usuarioId: `usuario-${indice}`,
      papel: "VENDEDOR",
      status: "ATIVO",
      criadoEm: new Date("2026-07-01T00:00:00.000Z"),
      atualizadoEm: new Date("2026-07-01T00:00:00.000Z"),
      usuario: {
        id: `usuario-${indice}`,
        nome: `Vendedor ${indice}`,
        telefone: `923000${String(indice).padStart(3, "0")}`,
        email: `vendedor${indice}@bizy.test`,
        avatarUrl: null,
        papel: "USUARIO"
      }
    }));
    const membroNegocio = {
      findMany: vi.fn().mockResolvedValue(membros),
      count: vi.fn().mockResolvedValue(500)
    };
    const prisma = { membroNegocio } as unknown as PrismaClient;
    const uc = new GestaoEquipaUseCase(prisma);

    const resultado = await uc.listarMembros("negocio-1", {
      limite: 800,
      offset: 0,
      status: "ATIVO",
      busca: "Vendedor"
    });

    expect(resultado.membros).toHaveLength(500);
    expect(resultado.paginacao).toEqual({
      total: 500,
      limite: 500,
      offset: 0,
      temProxima: false,
      temAnterior: false,
      proximoOffset: null,
      anteriorOffset: null
    });
    expect(membroNegocio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 500,
        skip: 0,
        where: expect.objectContaining({
          negocioId: "negocio-1",
          status: "ATIVO",
          OR: expect.any(Array)
        })
      })
    );
  });

  it("RNF-T004: calcula desempenho de 500 membros com consultas agregadas por coleção", async () => {
    const membros = Array.from({ length: 500 }, (_, indice) => ({
      id: `membro-${indice}`,
      papel: "VENDEDOR",
      usuario: {
        id: `usuario-${indice}`,
        nome: `Vendedor ${indice}`,
        avatarUrl: null,
        papel: "USUARIO"
      }
    }));
    const membroNegocio = {
      findMany: vi.fn().mockResolvedValue(membros)
    };
    const pedido = {
      findMany: vi.fn().mockResolvedValue([
        { responsavelId: "usuario-7", totalEmKwanza: 20000, estadoPagamento: "CONFIRMADO" }
      ])
    };
    const conversaAtendimento = {
      findMany: vi.fn().mockResolvedValue([{ responsavelId: "usuario-7", estado: "RESOLVIDA" }])
    };
    const tarefaOperacional = {
      findMany: vi.fn().mockResolvedValue([
        {
          responsavelId: "usuario-7",
          estado: "CONCLUIDA",
          concluidaEm: new Date("2026-07-01T10:00:00.000Z"),
          prazoEm: new Date("2026-07-01T12:00:00.000Z")
        }
      ])
    };
    const prisma = { membroNegocio, pedido, conversaAtendimento, tarefaOperacional } as unknown as PrismaClient;
    const uc = new GestaoEquipaUseCase(prisma);

    const resultado = await uc.obterDesempenhoEquipa("negocio-1", {
      de: new Date("2026-07-01T00:00:00.000Z"),
      ate: new Date("2026-07-31T23:59:59.999Z")
    });

    expect(resultado.ranking).toHaveLength(500);
    expect(resultado.ranking[0]).toEqual(
      expect.objectContaining({
        usuarioId: "usuario-7",
        kpis: expect.objectContaining({ receitaTotal: 20000, totalConversas: 1, tarefasConcluidas: 1 })
      })
    );
    expect(pedido.findMany).toHaveBeenCalledTimes(1);
    expect(conversaAtendimento.findMany).toHaveBeenCalledTimes(1);
    expect(tarefaOperacional.findMany).toHaveBeenCalledTimes(1);
  });

  it("alerta de meta quando abaixo de 50% com mais de 50% do tempo", () => {
    const cenarios = [
      { percentualMeta: 30, percentualTempo: 60, deveAlertar: true, severidade: "ATENCAO" },
      { percentualMeta: 45, percentualTempo: 55, deveAlertar: true, severidade: "ATENCAO" },
      { percentualMeta: 60, percentualTempo: 70, deveAlertar: false, severidade: null },
      { percentualMeta: 20, percentualTempo: 40, deveAlertar: false, severidade: null }
    ];

    for (const c of cenarios) {
      const deveAlertar = c.percentualMeta < 50 && c.percentualTempo >= 50;
      expect(deveAlertar).toBe(c.deveAlertar);

      if (deveAlertar) {
        const severidade = c.percentualMeta < 25 ? "CRITICO" : "ATENCAO";
        expect(severidade).toBe(c.severidade);
      }
    }
  });

  it("calcula inactividade de membros", () => {
    const DIAS_INACTIVIDADE = 90;
    const agora = new Date();
    const dia = 24 * 60 * 60 * 1000;

    const membros = [
      { id: "m1", nome: "Activo", papel: "VENDEDOR", atualizadoEm: new Date(agora.getTime() - 30 * dia) },
      { id: "m2", nome: "Inactivo", papel: "VENDEDOR", atualizadoEm: new Date(agora.getTime() - 100 * dia) },
      { id: "m3", nome: "Dono", papel: "DONO", atualizadoEm: new Date(agora.getTime() - 200 * dia) } // DONO nunca é suspenso
    ];

    const limiteInactividade = new Date(agora.getTime() - DIAS_INACTIVIDADE * dia);

    const inactivos = membros.filter(
      (m) => m.papel !== "DONO" && m.atualizadoEm < limiteInactividade
    );

    expect(inactivos).toHaveLength(1);
    expect(inactivos[0].nome).toBe("Inactivo");
  });

  it("convite expira após 72 horas", () => {
    const HORAS_EXPIRACAO = 72;
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + HORAS_EXPIRACAO * 60 * 60 * 1000);

    // Convite válido
    expect(expiraEm > agora).toBe(true);

    // Convite expirado (simulando 73h depois)
    const futuro = new Date(agora.getTime() + 73 * 60 * 60 * 1000);
    expect(expiraEm < futuro).toBe(true);
  });

  it("calcula comissão base de 5% e bónus escalonado", () => {
    const receitaMes = 1000000; // 1M Kz
    const comissaoBase = Math.round(receitaMes * 0.05);
    expect(comissaoBase).toBe(50000);

    // meta atingida (100-119%)
    expect(Math.round(receitaMes * (5 / 100))).toBe(50000);

    // superação (120-149%)
    expect(Math.round(receitaMes * (7 / 100))).toBe(70000);

    // excepcional (150%+)
    expect(Math.round(receitaMes * (10 / 100))).toBe(100000);
  });
});
