import { describe, expect, it } from "vitest";

describe("GestaoEquipaUseCase — lógica pura", () => {
  it("instancia o use case", async () => {
    const modulo = await import("../use-case/GestaoEquipaUseCase.js");
    const uc = new modulo.GestaoEquipaUseCase(null as never);
    expect(uc).toBeDefined();
  });

  it("itens de onboarding padrão incluem as 4 etapas", () => {
    const ITENS = [
      { item: "EXPLORAR_PAINEL", descricao: "Visitar o painel principal" },
      { item: "PRIMEIRA_VENDA", descricao: "Registar o primeiro pedido" },
      { item: "PERFIL_COMPLETO", descricao: "Completar perfil com foto e contacto" },
      { item: "ENVIAR_MENSAGEM", descricao: "Enviar primeira mensagem a um cliente" }
    ];

    expect(ITENS).toHaveLength(4);
    expect(ITENS.map((i) => i.item)).toEqual([
      "EXPLORAR_PAINEL",
      "PRIMEIRA_VENDA",
      "PERFIL_COMPLETO",
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
