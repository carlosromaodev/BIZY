import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import type { DespachadorEventos } from "../../dominio/eventos/DespachadorEventos.js";
import { AnaniPolicyEngine, type AnaniPolicyEngineService } from "../../anani/policies/AnaniPolicyEngine.js";

export interface AnaniContext {
  eventOutbox: EventOutboxService;
  quarantine: QuarantineService;
  incidents: IncidentService;
  riskSnapshots: RiskSnapshotService;
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
        select: { id: true, negocioId: true, riskScore: true, trustScore: true, criadoEm: true },
      });
    },
  };

  return { eventOutbox, quarantine, incidents, riskSnapshots, policies };
}
