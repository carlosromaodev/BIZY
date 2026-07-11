import { z } from "zod";
import { ParamIdSchema } from "../../../../dominio/esquemas.js";
import type { ContextoAplicacao } from "../../../../infra/http/ContextoAplicacao.js";
import { exigirAcessoComercial, resolverContextoComercial } from "../../../../infra/http/contextoComercial.js";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";

const CriarDepartamentoSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  descricao: z.string().trim().max(300).optional(),
  liderId: z.string().uuid().optional(),
  paisId: z.string().uuid().optional()
});

const CriarProjectoSchema = z.object({
  nome: z.string().trim().min(2).max(200),
  descricao: z.string().trim().max(500).optional(),
  orcamento: z.number().int().positive().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  departamentoId: z.string().uuid().optional(),
  gestorId: z.string().uuid().optional(),
  objetivo: z.string().trim().min(2).max(1000).optional(),
  stakeholders: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  criteriosSucesso: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  dependencias: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  capacidadeConsumida: z.number().int().min(0).max(100).optional(),
  roiEsperado: z.number().int().optional(),
  nivelRisco: z.enum(["BAIXO", "MEDIO", "ALTO", "CRITICO"]).optional()
});

const FiltrosPortfolioSchema = z.object({
  estado: z.string().trim().max(20).optional(),
  departamentoId: z.string().uuid().optional(),
  gestorId: z.string().uuid().optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  nivelRisco: z.enum(["BAIXO", "MEDIO", "ALTO", "CRITICO"]).optional(),
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
  limite: z.coerce.number().int().min(1).max(200).optional()
});

const MudancaProjectoSchema = z.object({
  motivo: z.string().trim().min(3).max(500),
  impacto: z.string().trim().min(3).max(1000),
  aprovadoPorId: z.string().uuid(),
  alteracoes: z.object({
    nome: z.string().trim().min(2).max(200).optional(),
    descricao: z.string().trim().max(500).optional(),
    objetivo: z.string().trim().max(1000).optional(),
    orcamento: z.number().int().nonnegative().optional(),
    dataFim: z.coerce.date().optional(),
    gestorId: z.string().uuid().optional(),
    estado: z.enum(["PLANEADO", "EM_ANDAMENTO", "PAUSADO", "FECHADO"]).optional(),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).optional(),
    nivelRisco: z.enum(["BAIXO", "MEDIO", "ALTO", "CRITICO"]).optional(),
    roiEsperado: z.number().int().optional()
  }).refine((alteracoes) => Object.keys(alteracoes).length > 0, "Informe ao menos uma alteração.")
});

const RiscoProjectoSchema = z.object({
  tipo: z.enum(["RISCO", "ISSUE"]),
  titulo: z.string().trim().min(3).max(200),
  severidade: z.enum(["BAIXO", "MEDIO", "ALTO", "CRITICO"]),
  ownerId: z.string().uuid(),
  planoMitigacao: z.string().trim().min(3).max(1000),
  dataAlvo: z.coerce.date().optional(),
  escalonamento: z.string().trim().max(500).optional()
});

const LicaoProjectoSchema = z.object({
  contexto: z.enum(["PROJECTO", "CAMPANHA", "LIVE", "INCIDENTE"]),
  resultado: z.string().trim().min(3).max(1000),
  causa: z.string().trim().min(3).max(1000),
  melhoria: z.string().trim().min(3).max(1000),
  ownerId: z.string().uuid(),
  dataAlvo: z.coerce.date().optional()
});

const CriarEntregaSchema = z.object({
  titulo: z.string().trim().min(2).max(200),
  descricao: z.string().trim().max(500).optional(),
  dataLimite: z.coerce.date().optional(),
  dependeDeId: z.string().uuid().optional()
});

const CriarProjetoComercialSchema = z.object({
  nome: z.string().trim().min(2).max(200),
  tipo: z.enum(["LIVE", "CAMPANHA", "LANCAMENTO"]).default("CAMPANHA"),
  descricao: z.string().trim().max(500).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional()
});

const PoolStockSchema = z.object({
  pecaId: z.string().uuid(),
  quantidadeReservada: z.number().int().positive()
});

async function exigirProjectos(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    mensagemPermissao: "Sem permissão para gerir projectos."
  });
}

async function exigirProjectoDoNegocio(
  contexto: ContextoAplicacao,
  reply: import("fastify").FastifyReply,
  id: string,
  negocioId: string
) {
  if (await contexto.gestaoProjectos.projectoPertenceAoNegocio(id, negocioId)) return true;
  reply.status(404).send({ erro: "Projecto não encontrado." });
  return false;
}

async function exigirProjetoComercialDoNegocio(
  contexto: ContextoAplicacao,
  reply: import("fastify").FastifyReply,
  id: string,
  negocioId: string
) {
  if (await contexto.gestaoProjectos.projetoComercialPertenceAoNegocio(id, negocioId)) return true;
  reply.status(404).send({ erro: "Projecto comercial não encontrado." });
  return false;
}

export const moduloProjectos: ModuloHttp = {
  nome: "projectos",
  descricao: "Departamentos, projectos, entregas, projectos comerciais e integração operacional (Fase 5)",

  registrar(app, contexto) {

    // ── Departamentos ──────────────────────────────────────────────

    app.post("/projectos/departamentos", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = CriarDepartamentoSchema.parse(request.body);
      return contexto.gestaoProjectos.criarDepartamento(ctx.negocio.id, dados);
    });

    app.get("/projectos/departamentos", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      return contexto.gestaoProjectos.listarDepartamentos(ctx.negocio.id);
    });

    // ── Projectos ──────────────────────────────────────────────────

    app.post("/projectos", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = CriarProjectoSchema.parse(request.body);
      return contexto.gestaoProjectos.criarProjecto(ctx.negocio.id, dados);
    });

    app.get("/projectos", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const filtros = FiltrosPortfolioSchema.parse(request.query ?? {});
      return contexto.gestaoProjectos.listarProjectos(ctx.negocio.id, filtros);
    });

    app.get("/projectos/portfolio", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      return contexto.gestaoProjectos.obterPortfolio(ctx.negocio.id, FiltrosPortfolioSchema.parse(request.query ?? {}));
    });

    app.post("/projectos/:id/mudancas", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.gestaoProjectos.registarMudancaProjecto(
        id, ctx.negocio.id, ctx.usuario.id, MudancaProjectoSchema.parse(request.body)
      );
      return reply.status(201).send(resultado);
    });

    app.post("/projectos/:id/riscos", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.gestaoProjectos.registarRiscoOuIssue(
        id, ctx.negocio.id, ctx.usuario.id, RiscoProjectoSchema.parse(request.body)
      );
      return reply.status(201).send(resultado);
    });

    app.patch("/projectos/:id/riscos/:itemId", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const params = z.object({ id: z.string().uuid(), itemId: z.string().uuid() }).parse(request.params);
      return contexto.gestaoProjectos.actualizarRiscoOuIssue(params.id, ctx.negocio.id, params.itemId, ctx.usuario.id,
        z.object({ estado: z.enum(["ABERTO", "EM_MITIGACAO", "ESCALADO", "ENCERRADO"]), motivo: z.string().trim().min(3).max(500) }).parse(request.body));
    });

    app.post("/projectos/:id/licoes", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.gestaoProjectos.registarLicaoAprendida(
        id, ctx.negocio.id, ctx.usuario.id, LicaoProjectoSchema.parse(request.body)
      );
      return reply.status(201).send(resultado);
    });

    app.get("/projectos/:id/eventos", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const { desde } = z.object({ desde: z.string().datetime().optional() }).parse(request.query ?? {});
      return contexto.gestaoProjectos.listarEventosProjecto(id, ctx.negocio.id, desde);
    });

    app.get("/projectos/:id", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      return contexto.gestaoProjectos.obterProjecto(id, ctx.negocio.id);
    });

    // ── Visibilidade Contextual (RF-T089-T091) ─────────────────

    app.get("/projectos/visiveis", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });
      return contexto.gestaoProjectos.obterProjectosVisiveis(ctx.negocio.id, membro.id);
    });

    // ── Progresso e Alertas ──────────────────────────────────────

    app.get("/projectos/:id/progresso", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      return contexto.gestaoProjectos.calcularProgressoProjecto(id, ctx.negocio.id);
    });

    app.get("/projectos/em-risco", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      return contexto.gestaoProjectos.alertarProjectosEmRisco(ctx.negocio.id);
    });

    app.post("/projectos/:id/fechar", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      return contexto.gestaoProjectos.fecharProjecto(id, ctx.negocio.id);
    });

    // ── Entregas ───────────────────────────────────────────────────

    app.post("/projectos/:id/entregas", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjectoDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      const dados = CriarEntregaSchema.parse(request.body);
      return contexto.gestaoProjectos.criarEntrega(id, dados);
    });

    app.get("/projectos/:id/entregas", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjectoDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.listarEntregas(id);
    });

    app.patch("/projectos/:id/entregas/:entregaId", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id, entregaId } = z.object({
        id: z.string().uuid(),
        entregaId: z.string().uuid()
      }).parse(request.params);
      if (!await exigirProjectoDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      const dados = z.object({
        estado: z.string().trim().max(20).optional(),
        concluidaEm: z.coerce.date().optional(),
        motivoCancelamento: z.string().trim().max(500).optional()
      }).parse(request.body);
      return contexto.gestaoProjectos.actualizarEntrega(entregaId, id, dados);
    });

    // ── Membros do Projecto ────────────────────────────────────────

    app.post("/projectos/:id/membros", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = z.object({
        membroId: z.string().uuid(),
        papelProjecto: z.string().trim().max(30).optional(),
        capacidadePercentual: z.number().int().min(1).max(100).optional(),
        skillNecessaria: z.string().trim().min(1).max(120).optional()
      }).parse(request.body);
      if (!await exigirProjectoDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      if (!await contexto.gestaoEquipa.obterMembroDetalhado(ctx.negocio.id, dados.membroId)) {
        return reply.status(404).send({ erro: "Membro não encontrado." });
      }
      return contexto.gestaoProjectos.adicionarMembroProjecto(id, ctx.negocio.id, dados);
    });

    app.get("/projectos/:id/membros", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjectoDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.listarMembrosProjecto(id);
    });

    // ── Projectos Comerciais ───────────────────────────────────────

    app.post("/projectos/comerciais", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = CriarProjetoComercialSchema.parse(request.body);
      return contexto.gestaoProjectos.criarProjetoComercial(ctx.negocio.id, dados);
    });

    app.get("/projectos/comerciais", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const filtros = z.object({
        tipo: z.string().trim().max(20).optional(),
        estado: z.string().trim().max(20).optional()
      }).parse(request.query ?? {});
      return contexto.gestaoProjectos.listarProjetosComerciais(ctx.negocio.id, filtros);
    });

    app.post("/projectos/comerciais/:id/fechar", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.fecharProjetoComercial(id);
    });

    // ── Pool de Stock ──────────────────────────────────────────────

    app.post("/projectos/comerciais/:id/stock", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      const dados = PoolStockSchema.parse(request.body);
      return contexto.gestaoProjectos.adicionarPoolStock(id, ctx.negocio.id, dados);
    });

    app.get("/projectos/comerciais/:id/stock", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.listarPoolStock(id);
    });

    // ── Equipa do Projecto Comercial ───────────────────────────────

    app.post("/projectos/comerciais/:id/equipa", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = z.object({
        membroId: z.string().uuid(),
        papelProjeto: z.string().trim().max(30).default("MEMBRO")
      }).parse(request.body);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      if (!await contexto.gestaoEquipa.obterMembroDetalhado(ctx.negocio.id, dados.membroId)) {
        return reply.status(404).send({ erro: "Membro não encontrado." });
      }
      return contexto.gestaoProjectos.adicionarEquipaProjeto(id, ctx.negocio.id, dados);
    });

    app.get("/projectos/comerciais/:id/equipa", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.listarEquipaProjeto(id);
    });

    // ── Fila do Projecto Comercial ────────────────────────────────

    app.post("/projectos/comerciais/:id/fila", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = z.object({
        entidadeTipo: z.string().trim().min(1).max(40),
        entidadeId: z.string().uuid(),
        prioridade: z.number().int().min(0).max(100).optional()
      }).parse(request.body);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.adicionarFilaProjeto(id, dados);
    });

    app.get("/projectos/comerciais/:id/fila", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const filtros = z.object({
        entidadeTipo: z.string().trim().max(40).optional(),
        estado: z.string().trim().max(20).optional()
      }).parse(request.query ?? {});
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.listarFilaProjeto(id, filtros);
    });

    app.post("/projectos/comerciais/fila/:id/atribuir", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const { membroId } = z.object({ membroId: z.string().uuid() }).parse(request.body);
      if (!await contexto.gestaoProjectos.itemFilaPertenceAoNegocio(id, ctx.negocio.id)) {
        return reply.status(404).send({ erro: "Item de fila não encontrado." });
      }
      if (!await contexto.gestaoEquipa.obterMembroDetalhado(ctx.negocio.id, membroId)) {
        return reply.status(404).send({ erro: "Membro não encontrado." });
      }
      return contexto.gestaoProjectos.atribuirItemFila(id, membroId);
    });

    // ── RN-T041 — Prioridade de fila omnichannel ────────────────────

    app.post("/projectos/comerciais/fila/prioridade", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const dados = z.object({
        entidadeTipo: z.string().trim().min(1).max(40),
        entidadeId: z.string().uuid()
      }).parse(request.body);
      return contexto.gestaoProjectos.atribuirComPrioridadeProjeto(ctx.negocio.id, dados.entidadeTipo, dados.entidadeId);
    });

    // ── RN-T042 / RF-T127 — Etiquetagem e receita por projecto ───

    app.post("/projectos/comerciais/:id/etiquetar", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.etiquetarTransacoesProjeto(id);
    });

    app.get("/projectos/comerciais/:id/receita", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.calcularReceitaPorProjeto(id);
    });

    // ── RN-T043 — Verificar acesso War Room ──────────────────────

    app.get("/projectos/comerciais/:id/war-room/acesso", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });

      const permissoes = Object.keys(
        typeof membro.permissoesJson === "string"
          ? JSON.parse(membro.permissoesJson || "{}")
          : (membro.permissoesJson ?? {})
      );
      return contexto.gestaoProjectos.verificarAcessoWarRoom(id, membro.id, permissoes);
    });

    app.get("/projectos/comerciais/:id/war-room", async (request, reply) => {
      const ctx = await resolverContextoComercial(contexto, request, reply);
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      const membro = await contexto.gestaoEquipa.obterMembroPorUsuario(ctx.negocio.id, ctx.usuario.id);
      if (!membro) return reply.status(404).send({ erro: "Membro não encontrado." });

      const permissoes = Object.keys(
        typeof membro.permissoesJson === "string"
          ? JSON.parse(membro.permissoesJson || "{}")
          : (membro.permissoesJson ?? {})
      );
      const acesso = await contexto.gestaoProjectos.verificarAcessoWarRoom(id, membro.id, permissoes);
      if (!acesso.permitido) return reply.status(403).send({ erro: acesso.motivo ?? "Sem acesso ao War Room." });

      return contexto.gestaoProjectos.obterWarRoom(id);
    });

    // ── RN-T044 — Handoff pós-projecto ───────────────────────────

    app.post("/projectos/comerciais/:id/handoff", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "negocio:gerir");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.executarHandoffPosProjeto(id);
    });

    // ── RN-T045 — Verificar integridade pool de stock ────────────

    app.get("/projectos/comerciais/:id/stock/integridade", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      if (!await exigirProjetoComercialDoNegocio(contexto, reply, id, ctx.negocio.id)) return;
      return contexto.gestaoProjectos.verificarIntegridadePoolStock(id);
    });

    // ── Passagem de Turno (RF-T116) ───────────────────────────────

    app.post("/projectos/passagem-turno", async (request, reply) => {
      const ctx = await exigirProjectos(contexto, request, reply, "equipa:ler");
      if (!ctx) return;
      const dados = z.object({
        membroSaindoId: z.string().uuid(),
        membroEntrandoId: z.string().uuid().optional()
      }).parse(request.body);
      return contexto.gestaoProjectos.criarPassagemTurno(ctx.negocio.id, dados);
    });
  }
};
