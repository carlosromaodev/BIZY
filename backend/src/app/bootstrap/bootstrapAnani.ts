import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import type { DespachadorEventos } from "../../dominio/eventos/DespachadorEventos.js";
import { AnaniPolicyEngine, type AnaniPolicyEngineService } from "../../anani/policies/AnaniPolicyEngine.js";

export interface AnaniContext {
  eventOutbox: EventOutboxService;
  quarantine: QuarantineService;
  incidents: IncidentService;
  riskSnapshots: RiskSnapshotService;
  readModels: AnaniReadModelsService;
  policies: AnaniPolicyEngineService;
}

export interface EventOutboxService {
  registrar(evento: EventoOutbox): Promise<void>;
  processarPendentes(limite?: number): Promise<number>;
}

export interface QuarantineService {
  criar(quarentena: CriarQuarentena): Promise<string>;
  listarAbertas(filtros?: { sistema?: string; tipo?: string }): Promise<QuarentenaResumo[]>;
  resolver(id: string, revistoPor: string): Promise<void>;
}

export interface IncidentService {
  criar(incidente: CriarIncidente): Promise<string>;
  listarAbertos(filtros?: { sistema?: string; severidade?: string }): Promise<IncidenteResumo[]>;
  atualizar(id: string, dados: AtualizarIncidente): Promise<void>;
}

export interface RiskSnapshotService {
  registar(snapshot: CriarRiskSnapshot): Promise<void>;
  obterMaisRecente(negocioId: string, sistema: string): Promise<RiskSnapshotResumo | null>;
}

export interface AnaniReadModelsService {
  obter(): Promise<AnaniReadModelsResumo>;
}

export interface EventoOutbox {
  tipo: string;
  sistema: string;
  contexto: string;
  negocioId?: string;
  actorId?: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}

export interface CriarQuarentena {
  tipo: string;
  sistema: string;
  negocioId?: string;
  entidadeTipo?: string;
  entidadeId?: string;
  severidade: string;
  motivo: string;
  evidencias: unknown[];
}

export interface QuarentenaResumo {
  id: string;
  tipo: string;
  sistema: string;
  severidade: string;
  motivo: string;
  status: string;
  criadoEm: Date;
}

export interface CriarIncidente {
  titulo: string;
  tipo: string;
  severidade: string;
  sistema: string;
  negocioId?: string;
  resumo: string;
  entidades?: unknown[];
  evidencias?: unknown[];
}

export interface AtualizarIncidente {
  status?: string;
  decisoes?: unknown[];
  recomendacao?: string;
  relatorioUrl?: string;
}

export interface IncidenteResumo {
  id: string;
  titulo: string;
  tipo: string;
  severidade: string;
  sistema: string;
  status: string;
  criadoEm: Date;
}

export interface CriarRiskSnapshot {
  negocioId: string;
  sistema: string;
  riskScore: number;
  trustScore: number;
  sinais: unknown[];
  recomendacoes?: unknown[];
}

export interface RiskSnapshotResumo {
  id: string;
  negocioId: string;
  sistema?: string;
  riskScore: number;
  trustScore: number;
  sinais?: unknown[];
  recomendacoes?: unknown[] | null;
  criadoEm: Date;
}

export interface AnaniReadModelsResumo {
  atualizadoEm: Date;
  teamHealth: TeamHealthReadModel;
  marketSnapshot: MarketSnapshotReadModel;
  securitySnapshot: SecuritySnapshotReadModel;
}

export interface TeamHealthReadModel {
  negociosMonitorados: number;
  tarefasAbertas: number;
  tarefasCriticas: number;
  conversasAbertas: number;
  pedidosPendentes: number;
  riscoMedio: number;
  trustMedio: number;
  negociosEmAtencao: NegocioRiscoResumo[];
  sinais: string[];
}

export interface MarketSnapshotReadModel {
  lojasPublicadas: number;
  produtosAtivos: number;
  produtosSemStock: number;
  pedidos30d: number;
  receita30dEmKwanza: number;
  negociosMonitorados: number;
  riscoMedio: number;
  trustMedio: number;
  negociosEmAtencao: NegocioRiscoResumo[];
  sinais: string[];
}

export interface SecuritySnapshotReadModel {
  incidentesAbertos: number;
  incidentesCriticos: number;
  quarentenasAbertas: number;
  quarentenasCriticas: number;
  eventosPendentes: number;
  eventosFalhados: number;
  ultimoIncidenteEm: Date | null;
  sinais: string[];
}

export interface NegocioRiscoResumo {
  negocioId: string;
  nomeComercial: string | null;
  riskScore: number;
  trustScore: number;
  criadoEm: Date;
}

export function bootstrapAnani(
  prisma: PrismaClient,
  eventos: DespachadorEventos,
  logger: FastifyBaseLogger
): AnaniContext {
  const policies = new AnaniPolicyEngine();

  // EventOutbox duravel para projectors e listeners internos.
  const eventOutbox: EventOutboxService = {
    async registrar(evento) {
      await (prisma as any).eventOutbox.create({
        data: {
          tipo: evento.tipo,
          sistema: evento.sistema,
          contexto: evento.contexto,
          negocioId: evento.negocioId ?? null,
          actorId: evento.actorId ?? null,
          aggregateType: evento.aggregateType ?? null,
          aggregateId: evento.aggregateId ?? null,
          payload: evento.payload,
          metadata: evento.metadata ?? null,
          correlationId: evento.correlationId ?? null,
          causationId: evento.causationId ?? null,
        },
      });
    },

    async processarPendentes(limite = 50) {
      const pendentes = await (prisma as any).eventOutbox.findMany({
        where: { status: "PENDING" },
        orderBy: { criadoEm: "asc" },
        take: limite,
      });

      let processados = 0;
      for (const evento of pendentes) {
        try {
          eventos.emitir(evento.tipo, {
            ...evento.payload,
            _outbox: {
              id: evento.id,
              sistema: evento.sistema,
              contexto: evento.contexto,
              correlationId: evento.correlationId,
            },
          });

          await (prisma as any).eventOutbox.update({
            where: { id: evento.id },
            data: { status: "PROCESSED", processadoEm: new Date() },
          });
          processados++;
        } catch (erro) {
          const mensagemErro = erro instanceof Error ? erro.message : String(erro);
          await (prisma as any).eventOutbox.update({
            where: { id: evento.id },
            data: {
              status: evento.tentativas + 1 >= 5 ? "FAILED" : "PENDING",
              tentativas: { increment: 1 },
              erro: mensagemErro,
            },
          });
          logger.warn({ eventoId: evento.id, erro: mensagemErro }, "Falha ao processar evento outbox.");
        }
      }
      return processados;
    },
  };

  const quarantine: QuarantineService = {
    async criar(dados) {
      const resultado = await (prisma as any).ananiQuarantine.create({
        data: {
          tipo: dados.tipo,
          sistema: dados.sistema,
          negocioId: dados.negocioId ?? null,
          entidadeTipo: dados.entidadeTipo ?? null,
          entidadeId: dados.entidadeId ?? null,
          severidade: dados.severidade,
          motivo: dados.motivo,
          evidencias: dados.evidencias,
        },
      });
      logger.info({ quarantineId: resultado.id, tipo: dados.tipo, severidade: dados.severidade }, "Quarentena Anani criada.");
      return resultado.id;
    },

    async listarAbertas(filtros) {
      return (prisma as any).ananiQuarantine.findMany({
        where: {
          status: "OPEN",
          ...(filtros?.sistema ? { sistema: filtros.sistema } : {}),
          ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        },
        orderBy: { criadoEm: "desc" },
        select: { id: true, tipo: true, sistema: true, severidade: true, motivo: true, status: true, criadoEm: true },
      });
    },

    async resolver(id, revistoPor) {
      await (prisma as any).ananiQuarantine.update({
        where: { id },
        data: { status: "RESOLVED", revistoPor, revistoEm: new Date() },
      });
      logger.info({ quarantineId: id, revistoPor }, "Quarentena Anani resolvida.");
    },
  };

  const incidents: IncidentService = {
    async criar(dados) {
      const resultado = await (prisma as any).ananiIncident.create({
        data: {
          titulo: dados.titulo,
          tipo: dados.tipo,
          severidade: dados.severidade,
          sistema: dados.sistema,
          negocioId: dados.negocioId ?? null,
          resumo: dados.resumo,
          entidades: dados.entidades ?? [],
          evidencias: dados.evidencias ?? [],
          timeline: [{ acao: "CRIADO", timestamp: new Date().toISOString() }],
          decisoes: [],
        },
      });
      logger.info({ incidentId: resultado.id, tipo: dados.tipo, severidade: dados.severidade }, "Incidente Anani criado.");
      return resultado.id;
    },

    async listarAbertos(filtros) {
      return (prisma as any).ananiIncident.findMany({
        where: {
          status: { in: ["OPEN", "INVESTIGATING"] },
          ...(filtros?.sistema ? { sistema: filtros.sistema } : {}),
          ...(filtros?.severidade ? { severidade: filtros.severidade } : {}),
        },
        orderBy: { criadoEm: "desc" },
        select: { id: true, titulo: true, tipo: true, severidade: true, sistema: true, status: true, criadoEm: true },
      });
    },

    async atualizar(id, dados) {
      const atualizacao: Record<string, unknown> = {};
      if (dados.status) atualizacao.status = dados.status;
      if (dados.decisoes) atualizacao.decisoes = dados.decisoes;
      if (dados.recomendacao) atualizacao.recomendacao = dados.recomendacao;
      if (dados.relatorioUrl) atualizacao.relatorioUrl = dados.relatorioUrl;
      if (dados.status === "CLOSED" || dados.status === "RESOLVED") {
        atualizacao.fechadoEm = new Date();
      }
      await (prisma as any).ananiIncident.update({ where: { id }, data: atualizacao });
    },
  };

  const riskSnapshots: RiskSnapshotService = {
    async registar(dados) {
      await (prisma as any).ananiTenantRiskSnapshot.create({
        data: {
          negocioId: dados.negocioId,
          sistema: dados.sistema,
          riskScore: dados.riskScore,
          trustScore: dados.trustScore,
          sinais: dados.sinais,
          recomendacoes: dados.recomendacoes ?? null,
        },
      });
    },

    async obterMaisRecente(negocioId, sistema) {
      return (prisma as any).ananiTenantRiskSnapshot.findFirst({
        where: { negocioId, sistema },
        orderBy: { criadoEm: "desc" },
        select: { id: true, negocioId: true, sistema: true, riskScore: true, trustScore: true, sinais: true, recomendacoes: true, criadoEm: true },
      });
    },
  };

  const readModels: AnaniReadModelsService = {
    async obter() {
      const desde30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [teamHealth, marketSnapshot, securitySnapshot] = await Promise.all([
        calcularTeamHealth(prisma, desde30d),
        calcularMarketSnapshot(prisma, desde30d),
        calcularSecuritySnapshot(prisma),
      ]);

      return {
        atualizadoEm: new Date(),
        teamHealth,
        marketSnapshot,
        securitySnapshot,
      };
    },
  };

  return { eventOutbox, quarantine, incidents, riskSnapshots, readModels, policies };
}

async function calcularTeamHealth(prisma: PrismaClient, desde30d: Date): Promise<TeamHealthReadModel> {
  const [tarefasAbertas, tarefasCriticas, conversasAbertas, pedidosPendentes, snapshots] = await Promise.all([
    prisma.tarefaOperacional.count({ where: { estado: { in: ["ABERTA", "EM_ANDAMENTO"] } } }),
    prisma.tarefaOperacional.count({ where: { estado: { in: ["ABERTA", "EM_ANDAMENTO"] }, prioridade: { in: ["ALTA", "URGENTE"] } } }),
    prisma.conversaAtendimento.count({ where: { estado: { in: ["ABERTA", "AGUARDANDO_HUMANO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.pedido.count({ where: { estadoPagamento: { in: ["PENDENTE", "AGUARDANDO_COMPROVATIVO", "COMPROVATIVO_RECEBIDO"] } } }),
    carregarUltimosSnapshots(prisma, "TEAM", desde30d),
  ]);

  const medias = calcularMediasRisco(snapshots);
  const sinais = montarSinais([
    [tarefasCriticas > 0, "tarefas_criticas_abertas"],
    [conversasAbertas > 25, "fila_atendimento_elevada"],
    [pedidosPendentes > 0, "pagamentos_pendentes"],
    [medias.riscoMedio >= 0.6, "risco_operacional_elevado"],
  ], "operacao_team_estavel");

  return {
    negociosMonitorados: snapshots.length,
    tarefasAbertas,
    tarefasCriticas,
    conversasAbertas,
    pedidosPendentes,
    ...medias,
    negociosEmAtencao: ordenarNegociosEmAtencao(snapshots),
    sinais,
  };
}

async function calcularMarketSnapshot(prisma: PrismaClient, desde30d: Date): Promise<MarketSnapshotReadModel> {
  const [lojasPublicadas, produtosAtivos, produtosSemStock, pedidos30d, receita30d, snapshots] = await Promise.all([
    prisma.negocio.count({ where: { lojaPublicadaEm: { not: null } } }),
    prisma.peca.count({ where: { arquivadaEm: null, estado: { not: "ARQUIVADA" } } }),
    prisma.peca.count({ where: { arquivadaEm: null, quantidade: { lte: 0 } } }),
    prisma.pedido.count({ where: { criadoEm: { gte: desde30d } } }),
    prisma.pedido.aggregate({
      where: { criadoEm: { gte: desde30d }, estadoPagamento: { in: ["CONFIRMADO", "PAGO"] } },
      _sum: { totalEmKwanza: true },
    }),
    carregarUltimosSnapshots(prisma, "MARKET", desde30d),
  ]);

  const medias = calcularMediasRisco(snapshots);
  const sinais = montarSinais([
    [lojasPublicadas === 0, "market_sem_lojas_publicadas"],
    [produtosSemStock > 0, "produtos_sem_stock"],
    [pedidos30d === 0 && lojasPublicadas > 0, "lojas_sem_pedidos_30d"],
    [medias.riscoMedio >= 0.6, "risco_market_elevado"],
  ], "market_estavel");

  return {
    lojasPublicadas,
    produtosAtivos,
    produtosSemStock,
    pedidos30d,
    receita30dEmKwanza: receita30d._sum.totalEmKwanza ?? 0,
    negociosMonitorados: snapshots.length,
    ...medias,
    negociosEmAtencao: ordenarNegociosEmAtencao(snapshots),
    sinais,
  };
}

async function calcularSecuritySnapshot(prisma: PrismaClient): Promise<SecuritySnapshotReadModel> {
  const [incidentesAbertos, incidentesCriticos, quarentenasAbertas, quarentenasCriticas, eventosPendentes, eventosFalhados, ultimoIncidente] = await Promise.all([
    (prisma as any).ananiIncident.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    (prisma as any).ananiIncident.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] }, severidade: { in: ["HIGH", "CRITICAL"] } } }),
    (prisma as any).ananiQuarantine.count({ where: { status: "OPEN" } }),
    (prisma as any).ananiQuarantine.count({ where: { status: "OPEN", severidade: { in: ["HIGH", "CRITICAL"] } } }),
    (prisma as any).eventOutbox.count({ where: { status: "PENDING" } }),
    (prisma as any).eventOutbox.count({ where: { status: "FAILED" } }),
    (prisma as any).ananiIncident.findFirst({
      where: { status: { in: ["OPEN", "INVESTIGATING"] } },
      orderBy: { criadoEm: "desc" },
      select: { criadoEm: true },
    }),
  ]);

  const sinais = montarSinais([
    [incidentesCriticos > 0, "incidentes_criticos_abertos"],
    [quarentenasCriticas > 0, "quarentenas_criticas_abertas"],
    [eventosFalhados > 0, "eventos_outbox_falhados"],
    [eventosPendentes > 100, "backlog_eventos_elevado"],
  ], "seguranca_estavel");

  return {
    incidentesAbertos,
    incidentesCriticos,
    quarentenasAbertas,
    quarentenasCriticas,
    eventosPendentes,
    eventosFalhados,
    ultimoIncidenteEm: ultimoIncidente?.criadoEm ?? null,
    sinais,
  };
}

async function carregarUltimosSnapshots(prisma: PrismaClient, sistema: "TEAM" | "MARKET", desde: Date): Promise<NegocioRiscoResumo[]> {
  const registros = await (prisma as any).ananiTenantRiskSnapshot.findMany({
    where: { sistema, criadoEm: { gte: desde } },
    orderBy: { criadoEm: "desc" },
    take: 500,
    select: { negocioId: true, riskScore: true, trustScore: true, criadoEm: true },
  });

  const porNegocio = new Map<string, NegocioRiscoResumo>();
  for (const registro of registros as Array<{ negocioId: string; riskScore: number; trustScore: number; criadoEm: Date }>) {
    if (!porNegocio.has(registro.negocioId)) {
      porNegocio.set(registro.negocioId, { ...registro, nomeComercial: null });
    }
  }

  const snapshots = [...porNegocio.values()];
  if (snapshots.length === 0) return snapshots;

  const negocios = await prisma.negocio.findMany({
    where: { id: { in: snapshots.map((snapshot) => snapshot.negocioId) } },
    select: { id: true, nomeComercial: true },
  });
  const nomes = new Map(negocios.map((negocio) => [negocio.id, negocio.nomeComercial]));

  return snapshots.map((snapshot) => ({
    ...snapshot,
    nomeComercial: nomes.get(snapshot.negocioId) ?? null,
  }));
}

function calcularMediasRisco(snapshots: NegocioRiscoResumo[]) {
  if (snapshots.length === 0) return { riscoMedio: 0, trustMedio: 1 };
  const total = snapshots.reduce((acc, snapshot) => ({
    risco: acc.risco + snapshot.riskScore,
    trust: acc.trust + snapshot.trustScore,
  }), { risco: 0, trust: 0 });

  return {
    riscoMedio: arredondarScore(total.risco / snapshots.length),
    trustMedio: arredondarScore(total.trust / snapshots.length),
  };
}

function ordenarNegociosEmAtencao(snapshots: NegocioRiscoResumo[]): NegocioRiscoResumo[] {
  return [...snapshots]
    .filter((snapshot) => snapshot.riskScore >= 0.5 || snapshot.trustScore <= 0.7)
    .sort((a, b) => b.riskScore - a.riskScore || a.trustScore - b.trustScore)
    .slice(0, 8);
}

function arredondarScore(valor: number) {
  return Number(valor.toFixed(3));
}

function montarSinais(condicoes: Array<[boolean, string]>, fallback: string): string[] {
  const sinais = condicoes.filter(([ativo]) => ativo).map(([, sinal]) => sinal);
  return sinais.length > 0 ? sinais : [fallback];
}
