import type { PrismaClient } from "@prisma/client";

export class GestaoProjectosUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── RF-T081-T084 — Departamentos (multi-hierarquia) ───────────────────────

  async criarDepartamento(
    negocioId: string,
    dados: { nome: string; descricao?: string; liderId?: string; paisId?: string }
  ) {
    return this.prisma.departamento.create({
      data: { negocioId, nome: dados.nome, descricao: dados.descricao, liderId: dados.liderId, paisId: dados.paisId }
    });
  }

  async listarDepartamentos(negocioId: string) {
    return this.prisma.departamento.findMany({
      where: { negocioId },
      orderBy: { nome: "asc" }
    });
  }

  async actualizarDepartamento(
    id: string,
    negocioId: string,
    dados: Partial<{ nome: string; descricao: string; liderId: string; paisId: string }>
  ) {
    return this.prisma.departamento.update({
      where: { id },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.descricao !== undefined ? { descricao: dados.descricao } : {}),
        ...(dados.liderId !== undefined ? { liderId: dados.liderId } : {}),
        ...(dados.paisId !== undefined ? { paisId: dados.paisId } : {})
      }
    });
  }

  // ── RF-T085-T088 — Projectos e entregas ───────────────────────────────────

  async criarProjecto(
    negocioId: string,
    dados: {
      nome: string;
      descricao?: string;
      orcamento?: number;
      dataInicio?: Date;
      dataFim?: Date;
      departamentoId?: string;
      gestorId?: string;
    }
  ) {
    let gestorId = dados.gestorId;

    // RN-T020: todo projecto deve ter pelo menos um gestor
    if (!gestorId) {
      const dono = await this.prisma.membroNegocio.findFirst({
        where: { negocioId, papel: "DONO", status: "ATIVO" }
      });
      gestorId = dono?.id;
    }

    if (!gestorId) {
      throw new Error("RN-T020: Todo projecto deve ter pelo menos um gestor.");
    }

    const projecto = await this.prisma.projecto.create({
      data: {
        negocioId,
        nome: dados.nome,
        descricao: dados.descricao,
        orcamento: dados.orcamento,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        departamentoId: dados.departamentoId,
        gestorId
      }
    });

    // alocar o gestor como membro do projecto
    await this.prisma.membroProjecto.create({
      data: {
        projectoId: projecto.id,
        membroId: gestorId,
        papelProjecto: "GESTOR"
      }
    });

    return projecto;
  }

  async listarProjectos(
    negocioId: string,
    filtros?: { estado?: string; departamentoId?: string; limite?: number }
  ) {
    return this.prisma.projecto.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {}),
        ...(filtros?.departamentoId ? { departamentoId: filtros.departamentoId } : {})
      },
      include: {
        entregas: { select: { id: true, estado: true } },
        membrosProjecto: { select: { id: true, membroId: true, papelProjecto: true } }
      },
      orderBy: { criadoEm: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  async obterProjecto(id: string, negocioId: string) {
    return this.prisma.projecto.findFirst({
      where: { id, negocioId },
      include: {
        entregas: true,
        membrosProjecto: true
      }
    });
  }

  // ── Entregas ──────────────────────────────────────────────────────────────

  async criarEntrega(
    projectoId: string,
    dados: { titulo: string; descricao?: string; dataLimite?: Date; dependeDeId?: string }
  ) {
    return this.prisma.entregaProjecto.create({
      data: {
        projectoId,
        titulo: dados.titulo,
        descricao: dados.descricao,
        dataLimite: dados.dataLimite,
        dependeDeId: dados.dependeDeId
      }
    });
  }

  async actualizarEntrega(
    id: string,
    projectoId: string,
    dados: { estado?: string; concluidaEm?: Date; motivoCancelamento?: string }
  ) {
    return this.prisma.entregaProjecto.update({
      where: { id },
      data: {
        ...(dados.estado ? { estado: dados.estado } : {}),
        ...(dados.concluidaEm ? { concluidaEm: dados.concluidaEm } : {}),
        ...(dados.motivoCancelamento !== undefined ? { motivoCancelamento: dados.motivoCancelamento } : {})
      }
    });
  }

  async listarEntregas(projectoId: string) {
    return this.prisma.entregaProjecto.findMany({
      where: { projectoId },
      orderBy: { criadoEm: "asc" }
    });
  }

  // ── Membros do Projecto ───────────────────────────────────────────────────

  async adicionarMembroProjecto(
    projectoId: string,
    dados: { membroId: string; papelProjecto?: string }
  ) {
    return this.prisma.membroProjecto.create({
      data: {
        projectoId,
        membroId: dados.membroId,
        papelProjecto: dados.papelProjecto ?? "MEMBRO"
      }
    });
  }

  async removerMembroProjecto(projectoId: string, membroId: string) {
    return this.prisma.membroProjecto.delete({
      where: { projectoId_membroId: { projectoId, membroId } }
    });
  }

  async listarMembrosProjecto(projectoId: string) {
    return this.prisma.membroProjecto.findMany({
      where: { projectoId, activo: true },
      orderBy: { alocadoDesde: "asc" }
    });
  }

  // ── RF-T089-T091 — Visibilidade contextual ────────────────────────────────

  async obterProjectosVisiveis(negocioId: string, membroId: string) {
    // RN-T022: membro só vê projectos onde está alocado
    const alocacoes = await this.prisma.membroProjecto.findMany({
      where: { membroId, activo: true },
      select: { projectoId: true }
    });

    const projectoIds = alocacoes.map((a) => a.projectoId);

    return this.prisma.projecto.findMany({
      where: {
        negocioId,
        id: { in: projectoIds }
      },
      include: {
        entregas: { select: { id: true, estado: true } },
        membrosProjecto: { select: { id: true, membroId: true, papelProjecto: true } }
      },
      orderBy: { criadoEm: "desc" }
    });
  }

  // ── RF-T081 — Fechar projecto ─────────────────────────────────────────────

  async fecharProjecto(id: string, negocioId: string) {
    // RN-T023: só pode fechar quando todas as entregas são CONCLUIDA ou CANCELADA
    const entregas = await this.prisma.entregaProjecto.findMany({
      where: { projectoId: id }
    });

    const entregasPendentes = entregas.filter(
      (e) => e.estado !== "CONCLUIDA" && e.estado !== "CANCELADA"
    );

    if (entregasPendentes.length > 0) {
      throw new Error("RN-T023: Existem entregas pendentes. Conclua ou cancele antes de fechar.");
    }

    // gerar relatório final
    const totalEntregas = entregas.length;
    const concluidas = entregas.filter((e) => e.estado === "CONCLUIDA").length;
    const canceladas = entregas.filter((e) => e.estado === "CANCELADA").length;

    const membros = await this.prisma.membroProjecto.findMany({
      where: { projectoId: id }
    });

    const relatorioFinal = {
      fechadoEm: new Date().toISOString(),
      totalEntregas,
      concluidas,
      canceladas,
      totalMembros: membros.length,
      taxaConclusao: totalEntregas > 0 ? Math.round((concluidas / totalEntregas) * 100) : 0
    };

    return this.prisma.projecto.update({
      where: { id },
      data: {
        estado: "FECHADO",
        relatorioFinalJson: JSON.stringify(relatorioFinal)
      }
    });
  }

  // ── RF-T087 — Calcular Progresso do Projecto ──────────────────────────────

  async calcularProgressoProjecto(id: string, negocioId: string) {
    const projecto = await this.prisma.projecto.findFirst({
      where: { id, negocioId },
      include: {
        entregas: { select: { id: true, titulo: true, estado: true, dataLimite: true, concluidaEm: true } },
        membrosProjecto: { select: { id: true, membroId: true, papelProjecto: true } }
      }
    });

    if (!projecto) throw new Error("Projecto não encontrado.");

    const total = projecto.entregas.length;
    const concluidas = projecto.entregas.filter((e) => e.estado === "CONCLUIDA").length;
    const canceladas = projecto.entregas.filter((e) => e.estado === "CANCELADA").length;
    const pendentes = total - concluidas - canceladas;
    const percentagem = total > 0 ? Math.round((concluidas / (total - canceladas || 1)) * 100) : 0;

    const agora = new Date();
    const entregasAtrasadas = projecto.entregas.filter(
      (e) => e.dataLimite && e.estado !== "CONCLUIDA" && e.estado !== "CANCELADA" && e.dataLimite < agora
    );

    // Tempo decorrido vs tempo total
    let tempoDecorrido: number | null = null;
    let tempoTotal: number | null = null;
    if (projecto.dataInicio && projecto.dataFim) {
      tempoTotal = projecto.dataFim.getTime() - projecto.dataInicio.getTime();
      tempoDecorrido = Math.min(agora.getTime() - projecto.dataInicio.getTime(), tempoTotal);
    }

    const percentagemTempo = tempoTotal && tempoTotal > 0
      ? Math.round((tempoDecorrido! / tempoTotal) * 100) : null;

    return {
      projectoId: projecto.id,
      nome: projecto.nome,
      estado: projecto.estado,
      progresso: {
        percentagem,
        total,
        concluidas,
        canceladas,
        pendentes,
        atrasadas: entregasAtrasadas.length
      },
      tempo: percentagemTempo !== null ? {
        percentagemDecorrida: percentagemTempo,
        desvio: percentagem - percentagemTempo // positivo = adiantado, negativo = atrasado
      } : null,
      entregasAtrasadas: entregasAtrasadas.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        dataLimite: e.dataLimite!.toISOString().slice(0, 10),
        diasAtraso: Math.ceil((agora.getTime() - e.dataLimite!.getTime()) / (1000 * 60 * 60 * 24))
      })),
      membros: projecto.membrosProjecto.length
    };
  }

  // ── RF-T088 — Alertar Projectos em Risco ──────────────────────────────────

  async alertarProjectosEmRisco(negocioId: string) {
    const agora = new Date();

    const projectos = await this.prisma.projecto.findMany({
      where: { negocioId, estado: { not: "FECHADO" } },
      include: {
        entregas: { select: { id: true, estado: true, dataLimite: true } }
      }
    });

    const alertas: Array<{
      projectoId: string;
      nome: string;
      motivos: string[];
      severidade: "CRITICO" | "ATENCAO";
      progresso: number;
    }> = [];

    for (const p of projectos) {
      const motivos: string[] = [];
      const total = p.entregas.length;
      const concluidas = p.entregas.filter((e) => e.estado === "CONCLUIDA").length;
      const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      // 1. Prazo ultrapassado
      if (p.dataFim && p.dataFim < agora) {
        const diasAtraso = Math.ceil((agora.getTime() - p.dataFim.getTime()) / (1000 * 60 * 60 * 24));
        motivos.push(`Prazo ultrapassado há ${diasAtraso} dias`);
      }

      // 2. Entregas atrasadas
      const entregasAtrasadas = p.entregas.filter(
        (e) => e.dataLimite && e.estado !== "CONCLUIDA" && e.estado !== "CANCELADA" && e.dataLimite < agora
      ).length;
      if (entregasAtrasadas > 0) {
        motivos.push(`${entregasAtrasadas} entrega(s) atrasada(s)`);
      }

      // 3. Progresso lento vs tempo decorrido
      if (p.dataInicio && p.dataFim) {
        const tempoTotal = p.dataFim.getTime() - p.dataInicio.getTime();
        const tempoDecorrido = agora.getTime() - p.dataInicio.getTime();
        const percentagemTempo = Math.round((tempoDecorrido / tempoTotal) * 100);
        if (percentagemTempo > 50 && progresso < percentagemTempo - 20) {
          motivos.push(`Progresso (${progresso}%) abaixo do tempo decorrido (${percentagemTempo}%)`);
        }
      }

      // 4. Orçamento excedido (placeholder — depende de dados de despesas por projecto)

      // 5. Sem entregas definidas
      if (total === 0) {
        motivos.push("Nenhuma entrega definida");
      }

      if (motivos.length > 0) {
        const critico = motivos.some((m) => m.includes("Prazo ultrapassado") || entregasAtrasadas >= 3);
        alertas.push({
          projectoId: p.id,
          nome: p.nome,
          motivos,
          severidade: critico ? "CRITICO" : "ATENCAO",
          progresso
        });
      }
    }

    alertas.sort((a, b) => {
      if (a.severidade === "CRITICO" && b.severidade !== "CRITICO") return -1;
      if (a.severidade !== "CRITICO" && b.severidade === "CRITICO") return 1;
      return b.motivos.length - a.motivos.length;
    });

    return {
      alertas,
      total: alertas.length,
      criticos: alertas.filter((a) => a.severidade === "CRITICO").length,
      atencao: alertas.filter((a) => a.severidade === "ATENCAO").length
    };
  }

  // ── RF-T123-T125 — Projectos comerciais (Live, Campanha, Lançamento) ─────

  async criarProjetoComercial(
    negocioId: string,
    dados: { nome: string; tipo: string; descricao?: string; dataInicio?: Date; dataFim?: Date }
  ) {
    return this.prisma.projetoComercial.create({
      data: {
        negocioId,
        nome: dados.nome,
        tipo: dados.tipo,
        descricao: dados.descricao,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim
      }
    });
  }

  async listarProjetosComerciais(
    negocioId: string,
    filtros?: { tipo?: string; estado?: string }
  ) {
    return this.prisma.projetoComercial.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.estado ? { estado: filtros.estado } : {})
      },
      include: {
        _count: { select: { poolStock: true, equipaProjeto: true, filas: true } }
      },
      orderBy: { criadoEm: "desc" }
    });
  }

  // ── Pool de Stock do Projecto Comercial ───────────────────────────────────

  async adicionarPoolStock(
    projetoComercialId: string,
    dados: { pecaId: string; quantidadeReservada: number }
  ) {
    // RN-T045: verificar stock global do produto
    const peca = await this.prisma.peca.findUniqueOrThrow({
      where: { id: dados.pecaId },
      select: { id: true, quantidade: true }
    });

    if (peca.quantidade <= 0) {
      throw new Error("RN-T045: Stock global do produto esgotado. Não é possível reservar para o projecto.");
    }

    return this.prisma.poolStockProjeto.create({
      data: {
        projetoComercialId,
        pecaId: dados.pecaId,
        quantidadeReservada: dados.quantidadeReservada
      }
    });
  }

  async listarPoolStock(projetoComercialId: string) {
    return this.prisma.poolStockProjeto.findMany({
      where: { projetoComercialId },
      orderBy: { criadoEm: "asc" }
    });
  }

  async actualizarPoolStock(
    id: string,
    dados: { quantidadeVendida?: number; pausado?: boolean }
  ) {
    return this.prisma.poolStockProjeto.update({
      where: { id },
      data: {
        ...(dados.quantidadeVendida !== undefined ? { quantidadeVendida: dados.quantidadeVendida } : {}),
        ...(dados.pausado !== undefined ? { pausado: dados.pausado } : {})
      }
    });
  }

  // ── RF-T126-T128 — Fila de orquestração ──────────────────────────────────

  async adicionarFilaProjeto(
    projetoComercialId: string,
    dados: { entidadeTipo: string; entidadeId: string; prioridade?: number }
  ) {
    return this.prisma.filaProjeto.create({
      data: {
        projetoComercialId,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        prioridade: dados.prioridade ?? 0
      }
    });
  }

  async listarFilaProjeto(
    projetoComercialId: string,
    filtros?: { entidadeTipo?: string; estado?: string }
  ) {
    return this.prisma.filaProjeto.findMany({
      where: {
        projetoComercialId,
        ...(filtros?.entidadeTipo ? { entidadeTipo: filtros.entidadeTipo } : {}),
        ...(filtros?.estado ? { estado: filtros.estado } : {})
      },
      orderBy: [{ prioridade: "desc" }, { criadoEm: "asc" }]
    });
  }

  async atribuirItemFila(id: string, membroId: string) {
    // RN-T041: durante projecto activo, priorizar membros alocados
    const item = await this.prisma.filaProjeto.findUniqueOrThrow({
      where: { id },
      select: { projetoComercialId: true }
    });

    const alocacao = await this.prisma.equipaProjeto.findUnique({
      where: {
        projetoComercialId_membroId: {
          projetoComercialId: item.projetoComercialId,
          membroId
        }
      }
    });

    const itemAtualizado = await this.prisma.filaProjeto.update({
      where: { id },
      data: { atribuidoAId: membroId, estado: "ATRIBUIDO" }
    });

    return {
      ...itemAtualizado,
      membroAlocadoAoProjeto: !!alocacao,
      papelProjeto: alocacao?.papelProjeto ?? null
    };
  }

  // ── RF-T126-T128 — Equipa do projecto comercial ──────────────────────────

  async adicionarEquipaProjeto(
    projetoComercialId: string,
    dados: { membroId: string; papelProjeto: string }
  ) {
    return this.prisma.equipaProjeto.create({
      data: {
        projetoComercialId,
        membroId: dados.membroId,
        papelProjeto: dados.papelProjeto
      }
    });
  }

  async listarEquipaProjeto(projetoComercialId: string) {
    return this.prisma.equipaProjeto.findMany({
      where: { projetoComercialId, activo: true },
      orderBy: { alocadoDesde: "asc" }
    });
  }

  async removerEquipaProjeto(projetoComercialId: string, membroId: string) {
    return this.prisma.equipaProjeto.update({
      where: {
        projetoComercialId_membroId: { projetoComercialId, membroId }
      },
      data: { activo: false, alocadoAte: new Date() }
    });
  }

  // ── RF-T128/T130 — Debriefing de projecto comercial ──────────────────────

  async fecharProjetoComercial(projetoComercialId: string) {
    const projeto = await this.prisma.projetoComercial.findUniqueOrThrow({
      where: { id: projetoComercialId },
      select: { id: true, negocioId: true, dataInicio: true, dataFim: true }
    });

    const de = projeto.dataInicio ?? new Date(0);
    const ate = projeto.dataFim ?? new Date();

    // calcular debriefing: pedidos, receita, tempo médio de resposta, stock consumido
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        negocioId: projeto.negocioId,
        criadoEm: { gte: de, lte: ate }
      },
      select: { totalEmKwanza: true }
    });

    const totalVendas = pedidos.length;
    const receitaTotal = pedidos.reduce((s, p) => s + p.totalEmKwanza, 0);

    // stock consumido do pool
    const poolStock = await this.prisma.poolStockProjeto.findMany({
      where: { projetoComercialId }
    });
    const stockLiquidado = poolStock.reduce((s, p) => s + p.quantidadeVendida, 0);

    // RN-T044: verificar conversas/reservas abertas
    const conversasAbertas = await this.prisma.conversaAtendimento.count({
      where: {
        negocioId: projeto.negocioId,
        estado: { in: ["ABERTA", "EM_ATENDIMENTO"] },
        criadaEm: { gte: de, lte: ate }
      }
    });

    const reservasAbertas = await this.prisma.reserva.count({
      where: {
        negocioId: projeto.negocioId,
        estado: "RESERVADA",
        criadaEm: { gte: de, lte: ate }
      }
    });

    const resumoJson: Record<string, unknown> = {};
    if (conversasAbertas > 0 || reservasAbertas > 0) {
      // SLA de 15 minutos para fecho
      resumoJson.slaFechoEm = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      resumoJson.conversasAbertas = conversasAbertas;
      resumoJson.reservasAbertas = reservasAbertas;
    }

    // criar registo de debriefing
    const debriefing = await this.prisma.debriefingProjeto.create({
      data: {
        projetoComercialId,
        totalVendas,
        receitaTotal,
        stockLiquidado,
        notasJson: JSON.stringify(resumoJson)
      }
    });

    // fechar projecto
    await this.prisma.projetoComercial.update({
      where: { id: projetoComercialId },
      data: { estado: "FECHADO" }
    });

    return debriefing;
  }

  // ── RN-T041 — Prioridade de fila omnichannel por projecto ─────────────────

  async atribuirComPrioridadeProjeto(
    negocioId: string,
    entidadeTipo: string,
    entidadeId: string
  ) {
    // Verificar se há projecto comercial activo
    const projectoActivo = await this.prisma.projetoComercial.findFirst({
      where: {
        negocioId,
        estado: "EM_ANDAMENTO",
        dataInicio: { lte: new Date() },
        OR: [
          { dataFim: null },
          { dataFim: { gte: new Date() } }
        ]
      },
      select: { id: true, nome: true }
    });

    if (!projectoActivo) {
      return { projectoActivo: false, atribuido: false, mensagem: "Sem projecto activo. Encaminhar para fila geral." };
    }

    // Buscar membros alocados ao projecto
    const equipaProjeto = await this.prisma.equipaProjeto.findMany({
      where: { projetoComercialId: projectoActivo.id, activo: true },
      select: { membroId: true, papelProjeto: true }
    });

    if (equipaProjeto.length === 0) {
      return { projectoActivo: true, atribuido: false, mensagem: "Projecto activo sem equipa alocada." };
    }

    // Verificar carga de cada membro para encontrar o com menos tarefas
    const cargas = await Promise.all(
      equipaProjeto.map(async (m) => {
        const tarefas = await this.prisma.filaProjeto.count({
          where: { projetoComercialId: projectoActivo.id, atribuidoAId: m.membroId, estado: "ATRIBUIDO" }
        });
        return { membroId: m.membroId, papelProjeto: m.papelProjeto, carga: tarefas };
      })
    );

    // Ordenar por carga (menos ocupado primeiro)
    cargas.sort((a, b) => a.carga - b.carga);
    const membroEscolhido = cargas[0];

    // Adicionar à fila do projecto
    const item = await this.prisma.filaProjeto.create({
      data: {
        projetoComercialId: projectoActivo.id,
        entidadeTipo,
        entidadeId,
        prioridade: 10, // prioridade elevada para itens do projecto
        estado: "ATRIBUIDO",
        atribuidoAId: membroEscolhido.membroId
      }
    });

    return {
      projectoActivo: true,
      atribuido: true,
      itemFilaId: item.id,
      membroAtribuido: membroEscolhido.membroId,
      papelProjeto: membroEscolhido.papelProjeto,
      projetoComercialId: projectoActivo.id,
      projetoNome: projectoActivo.nome
    };
  }

  // ── RN-T042 — Rastreabilidade de receita por projecto ────────────────────

  async etiquetarTransacoesProjeto(projetoComercialId: string) {
    const projeto = await this.prisma.projetoComercial.findUniqueOrThrow({
      where: { id: projetoComercialId },
      select: { id: true, negocioId: true, nome: true, dataInicio: true, dataFim: true }
    });

    const de = projeto.dataInicio ?? new Date(0);
    const ate = projeto.dataFim ?? new Date();
    const tag = `PROJETO_${projeto.id.slice(0, 8).toUpperCase()}`;

    // Etiquetar pedidos criados durante o intervalo do projecto
    const pedidosActualizados = await this.prisma.pedido.updateMany({
      where: {
        negocioId: projeto.negocioId,
        criadoEm: { gte: de, lte: ate },
        NOT: { origem: { contains: tag } }
      },
      data: { origem: tag }
    });

    // Etiquetar reservas criadas durante o intervalo
    const reservasActualizadas = await this.prisma.reserva.updateMany({
      where: {
        negocioId: projeto.negocioId,
        criadaEm: { gte: de, lte: ate },
        NOT: { estado: "CANCELADA" }
      },
      data: { estado: "RESERVADA" } // manter estado — usar tag nos movimentos financeiros
    });

    // Etiquetar movimentos financeiros
    const movimentosActualizados = await this.prisma.movimentoFinanceiro.updateMany({
      where: {
        negocioId: projeto.negocioId,
        dataMovimento: { gte: de, lte: ate },
        NOT: { descricao: { contains: tag } }
      },
      data: { descricao: tag }
    });

    return {
      tag,
      projetoComercialId,
      projetoNome: projeto.nome,
      pedidosEtiquetados: pedidosActualizados.count,
      movimentosEtiquetados: movimentosActualizados.count
    };
  }

  // ── RF-T127 — Calcular receita etiquetada por projecto ──────────────────

  async calcularReceitaPorProjeto(projetoComercialId: string) {
    const projeto = await this.prisma.projetoComercial.findUniqueOrThrow({
      where: { id: projetoComercialId },
      select: { id: true, negocioId: true, nome: true, dataInicio: true, dataFim: true }
    });

    const de = projeto.dataInicio ?? new Date(0);
    const ate = projeto.dataFim ?? new Date();

    // Pedidos no período do projecto
    const pedidos = await this.prisma.pedido.aggregate({
      where: {
        negocioId: projeto.negocioId,
        criadoEm: { gte: de, lte: ate }
      },
      _count: true,
      _sum: { totalEmKwanza: true }
    });

    // Reservas confirmadas
    const reservas = await this.prisma.reserva.count({
      where: {
        negocioId: projeto.negocioId,
        criadaEm: { gte: de, lte: ate },
        estado: { in: ["RESERVADA", "CONFIRMADA"] }
      }
    });

    // Stock consumido do pool
    const poolStock = await this.prisma.poolStockProjeto.findMany({
      where: { projetoComercialId },
      select: { quantidadeReservada: true, quantidadeVendida: true, pausado: true }
    });

    const stockReservado = poolStock.reduce((s, p) => s + p.quantidadeReservada, 0);
    const stockVendido = poolStock.reduce((s, p) => s + p.quantidadeVendida, 0);

    // Performance da equipa
    const equipa = await this.prisma.equipaProjeto.findMany({
      where: { projetoComercialId, activo: true },
      select: { membroId: true, papelProjeto: true }
    });

    return {
      projetoComercialId,
      projetoNome: projeto.nome,
      periodo: { de: de.toISOString(), ate: ate.toISOString() },
      vendas: {
        totalPedidos: pedidos._count,
        receitaTotal: pedidos._sum.totalEmKwanza ?? 0,
        reservas
      },
      stock: {
        reservado: stockReservado,
        vendido: stockVendido,
        disponivel: stockReservado - stockVendido,
        taxaConversao: stockReservado > 0 ? Math.round((stockVendido / stockReservado) * 100) : 0
      },
      equipa: equipa.length
    };
  }

  // ── RN-T043 — Protecção de contexto (War Room) ──────────────────────────

  async verificarAcessoWarRoom(
    projetoComercialId: string,
    membroId: string,
    permissoes: string[]
  ): Promise<{ permitido: boolean; motivo?: string }> {
    // Verificar se membro está alocado ao projecto
    const alocacao = await this.prisma.equipaProjeto.findUnique({
      where: {
        projetoComercialId_membroId: { projetoComercialId, membroId }
      }
    });

    if (alocacao && alocacao.activo) {
      return { permitido: true };
    }

    // Permitir se tiver permissão equipa:gestao
    if (permissoes.includes("equipa:gestao") || permissoes.includes("negocio:gerir")) {
      return { permitido: true };
    }

    return { permitido: false, motivo: "Membro não alocado ao projecto e sem permissão de gestão." };
  }

  // ── RN-T044 — Handoff automático pós-projecto ──────────────────────────

  async executarHandoffPosProjeto(projetoComercialId: string) {
    const projeto = await this.prisma.projetoComercial.findUniqueOrThrow({
      where: { id: projetoComercialId },
      select: { id: true, negocioId: true, nome: true, estado: true, dataFim: true }
    });

    const agora = new Date();
    const slaMinutos = 15;
    const slaDeadline = new Date(agora.getTime() + slaMinutos * 60 * 1000);

    // Buscar itens da fila ainda abertos/atribuidos
    const itensAbertos = await this.prisma.filaProjeto.findMany({
      where: {
        projetoComercialId,
        estado: { in: ["PENDENTE", "ATRIBUIDO"] }
      }
    });

    // Conversas abertas vinculadas ao período do projecto
    const de = projeto.dataFim ? new Date(projeto.dataFim.getTime() - 24 * 60 * 60 * 1000) : new Date(0);
    const conversasAbertas = await this.prisma.conversaAtendimento.findMany({
      where: {
        negocioId: projeto.negocioId,
        estado: { in: ["ABERTA", "EM_ATENDIMENTO"] },
        criadaEm: { gte: de }
      },
      select: { id: true, telefone: true, responsavelId: true, criadaEm: true }
    });

    // Reservas pendentes
    const reservasPendentes = await this.prisma.reserva.count({
      where: {
        negocioId: projeto.negocioId,
        estado: "RESERVADA",
        criadaEm: { gte: de }
      }
    });

    // Criar tarefa de SLA para cada conversa aberta
    const tarefasSla: string[] = [];
    for (const conversa of conversasAbertas) {
      const tarefa = await this.prisma.tarefaOperacional.create({
        data: {
          negocioId: projeto.negocioId,
          tipo: "HANDOFF",
          titulo: `SLA pós-projecto: resolver conversa ${conversa.telefone}`,
          descricao: `Conversa aberta durante ${projeto.nome}. SLA de ${slaMinutos} min para resolução. Após expiração, escalonar para fila geral.`,
          prioridade: "ALTA",
          estado: "ABERTA",
          responsavelId: conversa.responsavelId,
          prazoEm: slaDeadline,
          entidadeTipo: "CONVERSA",
          entidadeId: conversa.id
        }
      });
      tarefasSla.push(tarefa.id);
    }

    return {
      projetoComercialId,
      projetoNome: projeto.nome,
      slaDeadline: slaDeadline.toISOString(),
      conversasAbertas: conversasAbertas.length,
      reservasPendentes,
      itensFilaAbertos: itensAbertos.length,
      tarefasSlaGeradas: tarefasSla.length
    };
  }

  // ── RN-T045 — Integridade do pool de stock (verificação) ────────────────

  async verificarIntegridadePoolStock(projetoComercialId: string) {
    const pool = await this.prisma.poolStockProjeto.findMany({
      where: { projetoComercialId, pausado: false }
    });

    const alertas: Array<{
      poolId: string;
      pecaId: string;
      problema: string;
      accao: string;
    }> = [];

    for (const item of pool) {
      const peca = await this.prisma.peca.findUnique({
        where: { id: item.pecaId },
        select: { id: true, nome: true, quantidade: true }
      });

      if (!peca) continue;

      // Verificar se stock global chegou a zero
      if (peca.quantidade <= 0) {
        // Pausar automaticamente o pool item
        await this.prisma.poolStockProjeto.update({
          where: { id: item.id },
          data: { pausado: true }
        });

        alertas.push({
          poolId: item.id,
          pecaId: item.pecaId,
          problema: `Stock global de "${peca.nome}" esgotado (${peca.quantidade} unidades).`,
          accao: "Pool pausado automaticamente. Novas vendas bloqueadas no contexto do projecto."
        });
      }

      // Verificar se quantidadeVendida excede quantidadeReservada
      if (item.quantidadeVendida > item.quantidadeReservada) {
        alertas.push({
          poolId: item.id,
          pecaId: item.pecaId,
          problema: `Vendido (${item.quantidadeVendida}) excede reservado (${item.quantidadeReservada}).`,
          accao: "Overselling detectado. Verificar e ajustar reserva."
        });
      }

      // Verificar se stock global é inferior ao restante do pool
      const disponivelPool = item.quantidadeReservada - item.quantidadeVendida;
      if (disponivelPool > 0 && peca.quantidade < disponivelPool) {
        alertas.push({
          poolId: item.id,
          pecaId: item.pecaId,
          problema: `Stock global (${peca.quantidade}) inferior ao disponível no pool (${disponivelPool}).`,
          accao: "Risco de overselling. Considerar reduzir reserva do pool."
        });
      }
    }

    return {
      projetoComercialId,
      itensVerificados: pool.length,
      alertas,
      totalAlertas: alertas.length,
      integridadeOk: alertas.length === 0
    };
  }

  // ── RF-T116 — Passagem de turno ──────────────────────────────────────────

  async criarPassagemTurno(
    negocioId: string,
    dados: { membroSaindoId: string; membroEntrandoId?: string }
  ) {
    // contar conversas abertas do membro que sai
    const conversasAbertas = await this.prisma.conversaAtendimento.count({
      where: {
        negocioId,
        responsavelId: dados.membroSaindoId,
        estado: { in: ["ABERTA", "EM_ATENDIMENTO"] }
      }
    });

    // contar tarefas pendentes
    const tarefasPendentes = await this.prisma.tarefaOperacional.count({
      where: {
        negocioId,
        responsavelId: dados.membroSaindoId,
        estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] }
      }
    });

    // contar clientes quentes (pedidos recentes pendentes)
    const hoje = new Date();
    const inicio24h = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
    const clientesQuentes = await this.prisma.pedido.count({
      where: {
        negocioId,
        responsavelId: dados.membroSaindoId,
        estado: { in: ["PENDENTE", "EM_PROCESSAMENTO"] },
        criadoEm: { gte: inicio24h }
      }
    });

    const resumoJson = {
      geradoEm: new Date().toISOString(),
      conversasAbertas,
      tarefasPendentes,
      clientesQuentes
    };

    return this.prisma.passagemTurno.create({
      data: {
        negocioId,
        membroSaindoId: dados.membroSaindoId,
        membroEntrandoId: dados.membroEntrandoId,
        conversasAbertas,
        tarefasPendentes,
        clientesQuentes,
        resumoJson: JSON.stringify(resumoJson)
      }
    });
  }
}
