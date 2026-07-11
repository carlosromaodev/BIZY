import type { PrismaClient } from "@prisma/client";

type PrioridadeProjecto = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
type NivelRiscoProjecto = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";

function lerListaJson<T>(valor: string | null | undefined): T[] {
  if (!valor) return [];
  try {
    const resultado = JSON.parse(valor);
    return Array.isArray(resultado) ? resultado as T[] : [];
  } catch {
    return [];
  }
}

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

  async projectoPertenceAoNegocio(id: string, negocioId: string) {
    return Boolean(await this.prisma.projecto.findFirst({
      where: { id, negocioId },
      select: { id: true }
    }));
  }

  async projetoComercialPertenceAoNegocio(id: string, negocioId: string) {
    return Boolean(await this.prisma.projetoComercial.findFirst({
      where: { id, negocioId },
      select: { id: true }
    }));
  }

  async itemFilaPertenceAoNegocio(id: string, negocioId: string) {
    return Boolean(await this.prisma.filaProjeto.findFirst({
      where: { id, projetoComercial: { negocioId } },
      select: { id: true }
    }));
  }

  async actualizarDepartamento(
    id: string,
    negocioId: string,
    dados: Partial<{ nome: string; descricao: string; liderId: string; paisId: string }>
  ) {
    const departamento = await this.prisma.departamento.findFirst({ where: { id, negocioId }, select: { id: true } });
    if (!departamento) throw new Error("Departamento não encontrado.");
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
      objetivo?: string;
      stakeholders?: string[];
      criteriosSucesso?: string[];
      dependencias?: string[];
      prioridade?: PrioridadeProjecto;
      capacidadeConsumida?: number;
      roiEsperado?: number;
      nivelRisco?: NivelRiscoProjecto;
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
        objetivo: dados.objetivo,
        stakeholdersJson: JSON.stringify(dados.stakeholders ?? []),
        criteriosSucessoJson: JSON.stringify(dados.criteriosSucesso ?? []),
        dependenciasJson: JSON.stringify(dados.dependencias ?? []),
        orcamento: dados.orcamento,
        prioridade: dados.prioridade ?? "MEDIA",
        capacidadeConsumida: dados.capacidadeConsumida ?? 0,
        roiEsperado: dados.roiEsperado,
        nivelRisco: dados.nivelRisco ?? "BAIXO",
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        departamentoId: dados.departamentoId,
        gestorId,
        eventosJson: JSON.stringify([{
          id: crypto.randomUUID(),
          tipo: "TEAM_PROJECT_CREATED",
          versao: 1,
          actorId: gestorId,
          ocorridoEm: new Date().toISOString(),
          dados: { prioridade: dados.prioridade ?? "MEDIA", nivelRisco: dados.nivelRisco ?? "BAIXO" }
        }])
      }
    });

    // alocar o gestor como membro do projecto
    await this.prisma.membroProjecto.create({
      data: {
        projectoId: projecto.id,
        membroId: gestorId,
        papelProjecto: "GESTOR",
        capacidadePercentual: Math.max(1, Math.min(100, dados.capacidadeConsumida ?? 20))
      }
    });

    return projecto;
  }

  async listarProjectos(
    negocioId: string,
    filtros?: {
      estado?: string;
      departamentoId?: string;
      gestorId?: string;
      prioridade?: PrioridadeProjecto;
      nivelRisco?: NivelRiscoProjecto;
      de?: Date;
      ate?: Date;
      limite?: number;
    }
  ) {
    return this.prisma.projecto.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {}),
        ...(filtros?.departamentoId ? { departamentoId: filtros.departamentoId } : {}),
        ...(filtros?.gestorId ? { gestorId: filtros.gestorId } : {}),
        ...(filtros?.prioridade ? { prioridade: filtros.prioridade } : {}),
        ...(filtros?.nivelRisco ? { nivelRisco: filtros.nivelRisco } : {}),
        ...((filtros?.de || filtros?.ate) ? {
          dataFim: {
            ...(filtros.de ? { gte: filtros.de } : {}),
            ...(filtros.ate ? { lte: filtros.ate } : {})
          }
        } : {})
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
    negocioId: string,
    dados: { membroId: string; papelProjecto?: string; capacidadePercentual?: number; skillNecessaria?: string }
  ) {
    if (!await this.projectoPertenceAoNegocio(projectoId, negocioId)) {
      throw new Error("Projecto não encontrado.");
    }
    const membro = await this.prisma.membroNegocio.findFirst({
      where: { id: dados.membroId, negocioId },
      select: { status: true, skillsJson: true }
    });
    if (!membro || membro.status !== "ATIVO") {
      throw new Error("Membro indisponível para atribuição.");
    }
    const capacidadeSolicitada = Math.max(1, Math.min(100, dados.capacidadePercentual ?? 20));
    const alocacoes = await this.prisma.membroProjecto.aggregate({
      where: { membroId: dados.membroId, activo: true },
      _sum: { capacidadePercentual: true }
    });
    if ((alocacoes._sum.capacidadePercentual ?? 0) + capacidadeSolicitada > 100) {
      throw new Error("RN-T048: A atribuição excede a capacidade disponível do membro.");
    }
    if (dados.skillNecessaria) {
      const skills = lerListaJson<{ nome?: string }>(membro.skillsJson)
        .map((skill) => skill.nome?.trim().toLowerCase());
      if (!skills.includes(dados.skillNecessaria.trim().toLowerCase())) {
        throw new Error("RN-T048: O membro não possui a skill necessária para esta atribuição.");
      }
    }
    return this.prisma.membroProjecto.create({
      data: {
        projectoId,
        membroId: dados.membroId,
        papelProjecto: dados.papelProjecto ?? "MEMBRO",
        capacidadePercentual: capacidadeSolicitada,
        skillNecessaria: dados.skillNecessaria
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
    if (!await this.projectoPertenceAoNegocio(id, negocioId)) {
      throw new Error("Projecto não encontrado.");
    }
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
    const despesasPorProjecto = await this.calcularDespesasPorProjecto(
      negocioId,
      projectos.map((projecto) => projecto.id)
    );

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

      const despesaProjecto = despesasPorProjecto.get(p.id) ?? 0;
      if (p.orcamento && p.orcamento > 0 && despesaProjecto > p.orcamento) {
        const excessoPercentual = Math.round(((despesaProjecto - p.orcamento) / p.orcamento) * 100);
        motivos.push(`Orçamento excedido em ${excessoPercentual}% (${despesaProjecto}/${p.orcamento} Kz)`);
      }

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

  private async calcularDespesasPorProjecto(negocioId: string, projectoIds: string[]) {
    if (!projectoIds.length) return new Map<string, number>();

    const despesas = await this.prisma.movimentoFinanceiro.groupBy({
      by: ["origemId"],
      where: {
        negocioId,
        tipo: "SAIDA",
        origemTipo: { in: ["PROJECTO", "PROJETO"] },
        origemId: { in: projectoIds }
      },
      _sum: { valor: true }
    });

    return new Map(
      despesas.flatMap((despesa) => (despesa.origemId ? [[despesa.origemId, despesa._sum.valor ?? 0]] : []))
    );
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
    negocioId: string,
    dados: { pecaId: string; quantidadeReservada: number }
  ) {
    if (!await this.projetoComercialPertenceAoNegocio(projetoComercialId, negocioId)) {
      throw new Error("Projecto comercial não encontrado.");
    }
    // RN-T045: verificar stock global do produto
    const peca = await this.prisma.peca.findFirst({
      where: { id: dados.pecaId, negocioId },
      select: { id: true, quantidade: true }
    });

    if (!peca) throw new Error("Produto não encontrado.");
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
    negocioId: string,
    dados: { membroId: string; papelProjeto: string }
  ) {
    if (!await this.projetoComercialPertenceAoNegocio(projetoComercialId, negocioId)) {
      throw new Error("Projecto comercial não encontrado.");
    }
    const membro = await this.prisma.membroNegocio.findFirst({ where: { id: dados.membroId, negocioId }, select: { id: true } });
    if (!membro) throw new Error("Membro não encontrado.");
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
        NOT: { origem: { contains: "PROJETO_" } }
      },
      data: { origem: tag }
    });

    // Etiquetar reservas criadas durante o intervalo
    const reservasActualizadas = await this.prisma.reserva.updateMany({
      where: {
        negocioId: projeto.negocioId,
        criadaEm: { gte: de, lte: ate },
        estado: { not: "CANCELADA" },
        NOT: { origem: { contains: "PROJETO_" } }
      },
      data: { origem: tag }
    });

    const movimentosParaEtiquetar = await this.prisma.movimentoFinanceiro.findMany({
      where: {
        negocioId: projeto.negocioId,
        dataMovimento: { gte: de, lte: ate },
        NOT: { observacao: { contains: "PROJETO_" } }
      },
      select: { id: true, observacao: true }
    });
    await this.prisma.$transaction(
      movimentosParaEtiquetar.map((movimento) =>
        this.prisma.movimentoFinanceiro.update({
          where: { id: movimento.id },
          data: { observacao: this.adicionarTagOrigem(movimento.observacao, tag) }
        })
      )
    );

    return {
      tag,
      projetoComercialId,
      projetoNome: projeto.nome,
      pedidosEtiquetados: pedidosActualizados.count,
      reservasEtiquetadas: reservasActualizadas.count,
      movimentosEtiquetados: movimentosParaEtiquetar.length
    };
  }

  private adicionarTagOrigem(valor: string | null, tag: string) {
    if (!valor?.trim()) return tag;
    if (valor.includes(tag)) return valor;
    return `${valor} | ${tag}`;
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

  async obterWarRoom(projetoComercialId: string) {
    const projeto = await this.prisma.projetoComercial.findUniqueOrThrow({
      where: { id: projetoComercialId },
      select: { id: true, negocioId: true, nome: true, tipo: true, estado: true, dataInicio: true, dataFim: true }
    });

    const agora = new Date();
    const de = projeto.dataInicio ?? new Date(0);
    const ate = projeto.dataFim ?? agora;

    const [
      pedidosTotais,
      pedidosPagos,
      reservasConfirmadas,
      poolStock,
      fila,
      equipa
    ] = await Promise.all([
      this.prisma.pedido.aggregate({
        where: { negocioId: projeto.negocioId, criadoEm: { gte: de, lte: ate } },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.pedido.aggregate({
        where: { negocioId: projeto.negocioId, criadoEm: { gte: de, lte: ate }, estadoPagamento: "CONFIRMADO" },
        _count: true,
        _sum: { totalEmKwanza: true }
      }),
      this.prisma.reserva.count({
        where: {
          negocioId: projeto.negocioId,
          criadaEm: { gte: de, lte: ate },
          estado: { in: ["WAITING_PAYMENT", "RESERVADA", "CONFIRMADA"] }
        }
      }),
      this.prisma.poolStockProjeto.findMany({
        where: { projetoComercialId },
        select: { quantidadeReservada: true, quantidadeVendida: true, pausado: true }
      }),
      this.prisma.filaProjeto.findMany({
        where: { projetoComercialId },
        select: { estado: true, atribuidoAId: true }
      }),
      this.prisma.equipaProjeto.findMany({
        where: { projetoComercialId, activo: true },
        select: { membroId: true, papelProjeto: true }
      })
    ]);

    const stockReservado = poolStock.reduce((total, item) => total + item.quantidadeReservada, 0);
    const stockVendido = poolStock.reduce((total, item) => total + item.quantidadeVendida, 0);
    const filaPorEstado = this.contarPor(fila, (item) => item.estado);
    const equipaPorPapel = this.contarPor(equipa, (item) => item.papelProjeto);

    return {
      projetoComercialId,
      nome: projeto.nome,
      tipo: projeto.tipo,
      estado: projeto.estado,
      ativoAgora: projeto.estado !== "FECHADO" && agora >= de && agora <= ate,
      periodo: { de: de.toISOString(), ate: ate.toISOString() },
      placar: {
        vendasFechadas: pedidosPagos._count,
        receitaFechada: pedidosPagos._sum.totalEmKwanza ?? 0,
        reservasConfirmadas,
        stockConsumido: stockVendido
      },
      vendas: {
        pedidosTotais: pedidosTotais._count,
        receitaTotal: pedidosTotais._sum.totalEmKwanza ?? 0,
        pedidosPagos: pedidosPagos._count,
        receitaPaga: pedidosPagos._sum.totalEmKwanza ?? 0
      },
      stock: {
        reservado: stockReservado,
        vendido: stockVendido,
        disponivel: stockReservado - stockVendido,
        pausados: poolStock.filter((item) => item.pausado).length,
        taxaConsumo: stockReservado > 0 ? Math.round((stockVendido / stockReservado) * 100) : 0
      },
      fila: {
        total: fila.length,
        pendentes: filaPorEstado.PENDENTE ?? 0,
        atribuidos: filaPorEstado.ATRIBUIDO ?? 0,
        concluidos: filaPorEstado.CONCLUIDO ?? 0
      },
      equipa: {
        total: equipa.length,
        porPapel: equipaPorPapel
      },
      atualizadoEm: agora.toISOString()
    };
  }

  private contarPor<T>(itens: T[], chave: (item: T) => string | null | undefined) {
    return itens.reduce<Record<string, number>>((acc, item) => {
      const valor = chave(item) ?? "SEM_VALOR";
      acc[valor] = (acc[valor] ?? 0) + 1;
      return acc;
    }, {});
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

  // ── RF-T140-T145 — Portfolio e governança de projectos ──────────────────

  async obterPortfolio(
    negocioId: string,
    filtros?: {
      estado?: string;
      gestorId?: string;
      prioridade?: PrioridadeProjecto;
      nivelRisco?: NivelRiscoProjecto;
      de?: Date;
      ate?: Date;
      limite?: number;
    }
  ) {
    const projectos = await this.listarProjectos(negocioId, filtros);
    const itens = await Promise.all(projectos.map(async (projecto) => {
      const total = projecto.entregas.length;
      const concluidas = projecto.entregas.filter((entrega) => entrega.estado === "CONCLUIDA").length;
      const bloqueios = lerListaJson<{ estado?: string }>(projecto.riscosJson)
        .filter((risco) => risco.estado !== "ENCERRADO").length;
      return {
        ...projecto,
        stakeholders: lerListaJson<string>(projecto.stakeholdersJson),
        criteriosSucesso: lerListaJson<string>(projecto.criteriosSucessoJson),
        dependencias: lerListaJson<string>(projecto.dependenciasJson),
        progressoPercentual: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        bloqueios
      };
    }));
    return {
      itens,
      metricas: {
        total: itens.length,
        activos: itens.filter((item) => item.estado !== "FECHADO").length,
        emRisco: itens.filter((item) => ["ALTO", "CRITICO"].includes(item.nivelRisco)).length,
        capacidadeConsumida: itens.reduce((total, item) => total + item.capacidadeConsumida, 0),
        roiEsperado: itens.reduce((total, item) => total + (item.roiEsperado ?? 0), 0)
      },
      referenciaGovernanca: "ISO 21500/21502-inspired; não representa certificação formal"
    };
  }

  async registarMudancaProjecto(
    id: string,
    negocioId: string,
    actorId: string,
    dados: {
      motivo: string;
      impacto: string;
      aprovadoPorId: string;
      alteracoes: Partial<{
        nome: string;
        descricao: string;
        objetivo: string;
        orcamento: number;
        dataFim: Date;
        gestorId: string;
        estado: string;
        prioridade: PrioridadeProjecto;
        nivelRisco: NivelRiscoProjecto;
        roiEsperado: number;
      }>;
    }
  ) {
    const projecto = await this.prisma.projecto.findFirst({ where: { id, negocioId } });
    if (!projecto) throw new Error("Projecto não encontrado.");
    const agora = new Date().toISOString();
    const mudancas = lerListaJson<Record<string, unknown>>(projecto.mudancasJson);
    const mudanca = {
      id: crypto.randomUUID(),
      motivo: dados.motivo,
      impacto: dados.impacto,
      actorId,
      aprovadoPorId: dados.aprovadoPorId,
      ocorridoEm: agora,
      antes: Object.fromEntries(Object.keys(dados.alteracoes).map((chave) => [chave, projecto[chave as keyof typeof projecto]])),
      depois: dados.alteracoes
    };
    mudancas.push(mudanca);
    const actualizado = await this.prisma.projecto.update({
      where: { id },
      data: { ...dados.alteracoes, mudancasJson: JSON.stringify(mudancas) }
    });
    await this.anexarEventoProjecto(actualizado, "TEAM_PROJECT_CHANGED", actorId, mudanca);
    return { projecto: actualizado, mudanca };
  }

  async registarRiscoOuIssue(
    id: string,
    negocioId: string,
    actorId: string,
    dados: {
      tipo: "RISCO" | "ISSUE";
      titulo: string;
      severidade: NivelRiscoProjecto;
      ownerId: string;
      planoMitigacao: string;
      dataAlvo?: Date;
      escalonamento?: string;
    }
  ) {
    const projecto = await this.prisma.projecto.findFirst({ where: { id, negocioId } });
    if (!projecto) throw new Error("Projecto não encontrado.");
    const riscos = lerListaJson<Record<string, unknown>>(projecto.riscosJson);
    const item = {
      id: crypto.randomUUID(),
      ...dados,
      dataAlvo: dados.dataAlvo?.toISOString() ?? null,
      estado: "ABERTO",
      criadoPorId: actorId,
      criadoEm: new Date().toISOString()
    };
    riscos.push(item);
    const nivelRisco = riscos.some((risco) => risco.estado !== "ENCERRADO" && risco.severidade === "CRITICO")
      ? "CRITICO"
      : riscos.some((risco) => risco.estado !== "ENCERRADO" && risco.severidade === "ALTO") ? "ALTO" : projecto.nivelRisco;
    const actualizado = await this.prisma.projecto.update({
      where: { id },
      data: { riscosJson: JSON.stringify(riscos), nivelRisco }
    });
    await this.anexarEventoProjecto(actualizado, `TEAM_PROJECT_${dados.tipo}_CREATED`, actorId, item);
    return { projecto: actualizado, item };
  }

  async actualizarRiscoOuIssue(
    id: string,
    negocioId: string,
    itemId: string,
    actorId: string,
    dados: { estado: "ABERTO" | "EM_MITIGACAO" | "ESCALADO" | "ENCERRADO"; motivo: string }
  ) {
    const projecto = await this.prisma.projecto.findFirst({ where: { id, negocioId } });
    if (!projecto) throw new Error("Projecto não encontrado.");
    const riscos = lerListaJson<Record<string, unknown>>(projecto.riscosJson);
    const indice = riscos.findIndex((item) => item.id === itemId);
    if (indice < 0) throw new Error("Risco ou issue não encontrado.");
    riscos[indice] = {
      ...riscos[indice],
      estado: dados.estado,
      motivoEstado: dados.motivo,
      actualizadoPorId: actorId,
      actualizadoEm: new Date().toISOString()
    };
    const actualizado = await this.prisma.projecto.update({
      where: { id },
      data: { riscosJson: JSON.stringify(riscos) }
    });
    await this.anexarEventoProjecto(actualizado, "TEAM_PROJECT_RISK_CHANGED", actorId, riscos[indice]);
    return riscos[indice];
  }

  async registarLicaoAprendida(
    id: string,
    negocioId: string,
    actorId: string,
    dados: { contexto: "PROJECTO" | "CAMPANHA" | "LIVE" | "INCIDENTE"; resultado: string; causa: string; melhoria: string; ownerId: string; dataAlvo?: Date }
  ) {
    const projecto = await this.prisma.projecto.findFirst({ where: { id, negocioId } });
    if (!projecto) throw new Error("Projecto não encontrado.");
    const licoes = lerListaJson<Record<string, unknown>>(projecto.licoesJson);
    const licao = {
      id: crypto.randomUUID(),
      ...dados,
      dataAlvo: dados.dataAlvo?.toISOString() ?? null,
      actorId,
      criadaEm: new Date().toISOString()
    };
    licoes.push(licao);
    const actualizado = await this.prisma.projecto.update({ where: { id }, data: { licoesJson: JSON.stringify(licoes) } });
    await this.anexarEventoProjecto(actualizado, "TEAM_PROJECT_LESSON_RECORDED", actorId, licao);
    return licao;
  }

  async listarEventosProjecto(id: string, negocioId: string, desde?: string) {
    const projecto = await this.prisma.projecto.findFirst({ where: { id, negocioId } });
    if (!projecto) throw new Error("Projecto não encontrado.");
    const eventos = lerListaJson<Record<string, unknown>>(projecto.eventosJson);
    return {
      schema: "bizy.team.events.v1",
      projectoId: id,
      reprocessavelDesde: desde ?? null,
      eventos: desde ? eventos.filter((evento) => String(evento.ocorridoEm ?? "") >= desde) : eventos
    };
  }

  private async anexarEventoProjecto(
    projecto: { id: string; eventosJson: string | null },
    tipo: string,
    actorId: string,
    dados: unknown
  ) {
    const eventos = lerListaJson<Record<string, unknown>>(projecto.eventosJson);
    eventos.push({
      id: crypto.randomUUID(),
      tipo,
      versao: 1,
      actorId,
      ocorridoEm: new Date().toISOString(),
      dados
    });
    await this.prisma.projecto.update({ where: { id: projecto.id }, data: { eventosJson: JSON.stringify(eventos) } });
  }
}
