import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import { exigirGovernanteAnani } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const SistemasAnaniSchema = z.enum(["TEAM", "MARKET", "LEARNING", "CORE", "ANANI", "PLATFORM", "SECURITY", "SOCIAL"]);
const SeveridadeSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const EventoOutboxSchema = z.object({
  tipo: z.string().trim().min(3).max(120),
  sistema: SistemasAnaniSchema,
  contexto: z.string().trim().min(2).max(120),
  negocioId: z.string().trim().min(1).optional(),
  actorId: z.string().trim().min(1).optional(),
  aggregateType: z.string().trim().min(1).max(120).optional(),
  aggregateId: z.string().trim().min(1).max(120).optional(),
  payload: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).optional(),
  correlationId: z.string().trim().min(1).max(160).optional(),
  causationId: z.string().trim().min(1).max(160).optional()
});

const AvaliarAcaoSchema = z.object({
  skill: z.string().trim().min(3).max(160),
  nivelSolicitado: z.number().int().min(0).max(4).optional(),
  negocioId: z.string().trim().min(1).nullable().optional(),
  actorId: z.string().trim().min(1).nullable().optional(),
  consentimentoConfirmado: z.boolean().optional(),
  impactoFinanceiro: z.boolean().optional(),
  expoePiiEmPrompt: z.boolean().optional(),
  alteraDadosEntreTenants: z.boolean().optional()
});

const CriarIncidenteSchema = z.object({
  titulo: z.string().trim().min(3).max(180),
  tipo: z.enum(["SECURITY", "FRAUD", "ABUSE", "COMPLIANCE", "OPERATIONAL", "DATA_LEAK"]),
  severidade: SeveridadeSchema,
  sistema: SistemasAnaniSchema,
  negocioId: z.string().trim().min(1).optional(),
  resumo: z.string().trim().min(5).max(2000),
  entidades: z.array(z.unknown()).default([]),
  evidencias: z.array(z.unknown()).default([])
});

const AtualizarIncidenteSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]).optional(),
  decisoes: z.array(z.unknown()).optional(),
  recomendacao: z.string().trim().min(1).max(2000).optional(),
  relatorioUrl: z.string().trim().url().optional()
});

const CriarQuarentenaSchema = z.object({
  tipo: z.string().trim().min(3).max(120),
  sistema: SistemasAnaniSchema,
  negocioId: z.string().trim().min(1).optional(),
  entidadeTipo: z.string().trim().min(1).max(120).optional(),
  entidadeId: z.string().trim().min(1).max(160).optional(),
  severidade: SeveridadeSchema,
  motivo: z.string().trim().min(5).max(1000),
  evidencias: z.array(z.unknown()).default([])
});

const CriarRiskSnapshotSchema = z.object({
  negocioId: z.string().trim().min(1),
  sistema: z.enum(["TEAM", "MARKET", "LEARNING"]),
  riskScore: z.number().min(0).max(1),
  trustScore: z.number().min(0).max(1),
  sinais: z.array(z.unknown()).default([]),
  recomendacoes: z.array(z.unknown()).optional()
});

const ListagemQuerySchema = z.object({
  sistema: SistemasAnaniSchema.optional(),
  tipo: z.string().trim().min(1).max(120).optional(),
  severidade: SeveridadeSchema.optional()
});

const ProcessarOutboxSchema = z.object({
  limite: z.number().int().min(1).max(500).default(50)
});

const RiskParamsSchema = z.object({
  negocioId: z.string().trim().min(1),
  sistema: z.enum(["TEAM", "MARKET", "LEARNING"])
});

export const moduloAnaniGovernance: ModuloHttp = {
  nome: "anani-governance",
  descricao: "Console interno da Anani: politicas, incidentes, quarentena, outbox e read models de risco.",
  registrar(app, contexto) {
    app.get("/governance/anani/health", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const [incidentes, quarentenas] = await Promise.all([
        contexto.anani.incidents.listarAbertos(),
        contexto.anani.quarantine.listarAbertas()
      ]);
      const skills = contexto.anani.policies.listarSkills();

      return {
        sistema: "ANANI",
        status: "OPERACIONAL",
        acesso: {
          usuarioId: governante.id,
          papel: governante.papel
        },
        incidentesAbertos: incidentes.length,
        quarentenasAbertas: quarentenas.length,
        politicasGlobais: contexto.anani.policies.listarPoliticasGlobais().length,
        skills: {
          total: skills.length,
          nivel1e2: skills.filter((skill) => skill.nivel >= 1 && skill.nivel <= 2).length,
          exigemAprovacao: skills.filter((skill) => skill.requerAprovacao || skill.nivel >= 3).length
        }
      };
    });

    app.get("/governance/anani/policies", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      return {
        politicas: contexto.anani.policies.listarPoliticasGlobais(),
        skills: contexto.anani.policies.listarSkills()
      };
    });

    app.get("/governance/anani/read-models", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      return contexto.anani.readModels.obter();
    });

    app.post("/governance/anani/policies/evaluate", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const dados = AvaliarAcaoSchema.parse(request.body ?? {});
      return contexto.anani.policies.avaliarAcao(dados);
    });

    app.post("/governance/anani/events", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const dados = EventoOutboxSchema.parse(request.body ?? {});
      await contexto.anani.eventOutbox.registrar({
        ...dados,
        actorId: dados.actorId ?? governante.id,
        metadata: {
          ...(dados.metadata ?? {}),
          origem: "governance-console"
        }
      });
      return reply.code(202).send({ sucesso: true });
    });

    app.post("/governance/anani/events/processar", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const { limite } = ProcessarOutboxSchema.parse(request.body ?? {});
      const processados = await contexto.anani.eventOutbox.processarPendentes(limite);
      return { processados };
    });

    app.get("/governance/anani/incidents", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const filtros = ListagemQuerySchema.parse(request.query ?? {});
      return {
        incidentes: await contexto.anani.incidents.listarAbertos({
          sistema: filtros.sistema,
          severidade: filtros.severidade
        })
      };
    });

    app.post("/governance/anani/incidents", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const dados = CriarIncidenteSchema.parse(request.body ?? {});
      const id = await contexto.anani.incidents.criar(dados);
      return reply.code(201).send({ id });
    });

    app.patch("/governance/anani/incidents/:id", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = AtualizarIncidenteSchema.parse(request.body ?? {});
      await contexto.anani.incidents.atualizar(id, dados);
      return { sucesso: true };
    });

    app.get("/governance/anani/quarantine", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const filtros = ListagemQuerySchema.parse(request.query ?? {});
      return {
        quarentenas: await contexto.anani.quarantine.listarAbertas({
          sistema: filtros.sistema,
          tipo: filtros.tipo
        })
      };
    });

    app.post("/governance/anani/quarantine", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const dados = CriarQuarentenaSchema.parse(request.body ?? {});
      const id = await contexto.anani.quarantine.criar(dados);
      return reply.code(201).send({ id });
    });

    app.post("/governance/anani/quarantine/:id/resolver", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const { id } = ParamIdSchema.parse(request.params);
      await contexto.anani.quarantine.resolver(id, governante.id);
      return { sucesso: true };
    });

    app.post("/governance/anani/risk-snapshots", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const dados = CriarRiskSnapshotSchema.parse(request.body ?? {});
      await contexto.anani.riskSnapshots.registar(dados);
      return reply.code(201).send({ sucesso: true });
    });

    app.get("/governance/anani/risk-snapshots/:negocioId/:sistema", async (request, reply) => {
      aplicarNoStore(reply);
      const governante = await exigirGovernanteAnani(contexto, request, reply);
      if (!governante) return;

      const { negocioId, sistema } = RiskParamsSchema.parse(request.params);
      const snapshot = await contexto.anani.riskSnapshots.obterMaisRecente(negocioId, sistema);
      if (!snapshot) {
        return reply.code(404).send({ erro: "SNAPSHOT_NAO_ENCONTRADO", mensagem: "Snapshot de risco nao encontrado." });
      }
      return snapshot;
    });
  }
};

function aplicarNoStore(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "no-store");
}
