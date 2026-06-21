import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const GerirCategoriaGlobalSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  descricao: z.string().trim().max(500).optional(),
  ativa: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0)
});

const SuspenderEntidadeSchema = z.object({
  entidadeTipo: z.enum(["PRODUTO", "LOJA"]),
  entidadeId: z.string().trim().min(1),
  negocioId: z.string().trim().min(1),
  motivo: z.string().trim().min(5).max(500),
  suspender: z.boolean()
});

const MarcarDestaqueSchema = z.object({
  entidadeTipo: z.enum(["PRODUTO", "LOJA"]),
  entidadeId: z.string().trim().min(1),
  negocioId: z.string().trim().min(1),
  tipo: z.enum(["DESTAQUE", "VERIFICADO", "PATROCINADO"]),
  ativo: z.boolean()
});

const ResolverDenunciaSchema = z.object({
  resolucao: z.string().trim().min(5).max(500),
  estado: z.enum(["ACEITE", "REJEITADA", "RESOLVIDA"])
});

export const moduloAdminGovernanca: ModuloHttp = {
  nome: "admin-governanca",
  descricao: "Governança do Bizy Market: categorias, políticas, suspensões, destaques e denúncias.",
  registrar(app, contexto) {

    app.get("/admin/market/categorias", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      return contexto.bizyMarket.listarCategorias();
    });

    app.post("/admin/market/categorias", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      const dados = GerirCategoriaGlobalSchema.parse(request.body ?? {});
      await contexto.repositorios.eventosOperacionais.registrar({
        negocioId: "bizy-admin",
        topico: "admin",
        tipo: "CATEGORIA_GLOBAL_CRIADA",
        entidadeTipo: "CategoriaGlobal",
        entidadeId: dados.nome,
        idempotencyKey: `categoria:${dados.nome}:${Date.now()}`,
        payload: dados
      });
      return reply.code(201).send({ nome: dados.nome, ativa: dados.ativa, ordem: dados.ordem });
    });

    app.post("/admin/market/suspender", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      const dados = SuspenderEntidadeSchema.parse(request.body ?? {});

      if (dados.entidadeTipo === "PRODUTO" && dados.suspender) {
        const peca = await contexto.repositorios.pecas.buscarPorCodigo(dados.entidadeId, dados.negocioId);
        if (peca?.vitrine?.publicacaoMarket?.publicado) {
          await contexto.bizyMarket.atualizarPublicacaoProduto(dados.negocioId, dados.entidadeId, false);
        }
      }

      await contexto.repositorios.eventosOperacionais.registrar({
        negocioId: dados.negocioId,
        topico: "admin",
        tipo: dados.suspender ? "ENTIDADE_SUSPENSA_MARKET" : "ENTIDADE_REATIVADA_MARKET",
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        idempotencyKey: `suspensao:${dados.entidadeTipo}:${dados.entidadeId}:${Date.now()}`,
        payload: { motivo: dados.motivo, adminId: admin.id }
      });

      return { sucesso: true, acao: dados.suspender ? "suspensa" : "reativada" };
    });

    app.post("/admin/market/destaque", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      const dados = MarcarDestaqueSchema.parse(request.body ?? {});

      if (dados.entidadeTipo === "PRODUTO") {
        const peca = await contexto.repositorios.pecas.buscarPorCodigo(dados.entidadeId, dados.negocioId);
        if (peca) {
          const selos = peca.vitrine.selos.filter((s) => s !== dados.tipo);
          if (dados.ativo) selos.push(dados.tipo);
          await contexto.repositorios.pecas.atualizar(dados.entidadeId, {
            vitrine: { ...peca.vitrine, selos }
          }, dados.negocioId);
        }
      }

      await contexto.repositorios.eventosOperacionais.registrar({
        negocioId: dados.negocioId,
        topico: "admin",
        tipo: dados.ativo ? "DESTAQUE_MARCADO" : "DESTAQUE_REMOVIDO",
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        idempotencyKey: `destaque:${dados.entidadeTipo}:${dados.entidadeId}:${dados.tipo}:${Date.now()}`,
        payload: { tipo: dados.tipo, adminId: admin.id }
      });

      return { sucesso: true, tipo: dados.tipo, ativo: dados.ativo };
    });

    app.get("/admin/market/denuncias", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      const query = z.object({
        estado: z.string().trim().optional(),
        entidadeTipo: z.string().trim().optional(),
        limite: z.string().trim().optional()
      }).parse(request.query ?? {});
      return contexto.repositorios.denuncias.listar({
        estado: query.estado as undefined,
        entidadeTipo: query.entidadeTipo as undefined,
        limite: query.limite ? Number(query.limite) : 50
      });
    });

    app.put("/admin/market/denuncias/:id/resolver", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = ResolverDenunciaSchema.parse(request.body ?? {});

      const resultado = await contexto.repositorios.denuncias.resolver(id, {
        resolvidoPorId: admin.id,
        resolucao: dados.resolucao,
        estado: dados.estado
      });

      if (!resultado) {
        return reply.code(404).send({ erro: "NAO_ENCONTRADO", mensagem: "Denúncia não encontrada." });
      }

      await contexto.repositorios.eventosOperacionais.registrar({
        negocioId: resultado.negocioAlvoId ?? "bizy-admin",
        topico: "admin",
        tipo: "DENUNCIA_RESOLVIDA",
        entidadeTipo: "DenunciaMarket",
        entidadeId: id,
        idempotencyKey: `denuncia:${id}:resolucao:${Date.now()}`,
        payload: { estado: dados.estado, resolucao: dados.resolucao, adminId: admin.id }
      });

      return resultado;
    });

    app.get("/admin/market/relatorio", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;

      const lojas = await contexto.repositorios.autenticacao.listarNegociosPublicados();
      const denuncias = await contexto.repositorios.denuncias.listar({ limite: 1000 });

      return {
        totalLojas: lojas.length,
        denuncias: {
          total: denuncias.length,
          pendentes: denuncias.filter((d) => d.estado === "PENDENTE").length,
          emRevisao: denuncias.filter((d) => d.estado === "EM_REVISAO").length,
          resolvidas: denuncias.filter((d) => ["ACEITE", "REJEITADA", "RESOLVIDA"].includes(d.estado)).length
        }
      };
    });

    // ── Repasses financeiros (Admin Bizy) ──

    app.get("/admin/market/repasses", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      return contexto.repassesFinanceiros.resumoFinanceiroAdmin();
    });

    app.post("/admin/market/repasses/:id/conciliar", async (request, reply) => {
      aplicarNoStore(reply);
      const admin = await exigirAdmin(request, reply, contexto);
      if (!admin) return;
      const { id } = ParamIdSchema.parse(request.params);
      const { negocioId } = (request.body ?? {}) as { negocioId: string };
      if (!negocioId?.trim()) return reply.code(400).send({ erro: "negocioId obrigatório." });

      const resultado = await contexto.repassesFinanceiros.conciliarRepasse(id, negocioId);
      if (!resultado) return reply.code(404).send({ erro: "NAO_ENCONTRADO", mensagem: "Repasse não encontrado ou pedido inelegível." });

      await contexto.repositorios.eventosOperacionais.registrar({
        negocioId,
        topico: "admin",
        tipo: "REPASSE_CONCILIADO_ADMIN",
        entidadeTipo: "RepasseFinanceiro",
        entidadeId: id,
        idempotencyKey: `repasse:${id}:conciliar:${Date.now()}`,
        payload: { adminId: admin.id }
      });

      return resultado;
    });
  }
};

async function exigirAdmin(
  request: { headers: Record<string, string | string[] | undefined> },
  reply: { code: (n: number) => { send: (body: unknown) => unknown } },
  contexto: Parameters<ModuloHttp["registrar"]>[1]
) {
  const token = String(request.headers["authorization"] ?? "").replace("Bearer ", "").trim();
  if (!token) {
    reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem: "Token obrigatório." });
    return null;
  }

  const { createHash } = await import("node:crypto");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const sessao = await contexto.repositorios.autenticacao.buscarSessaoPorTokenHash(tokenHash, new Date());
  if (!sessao) {
    reply.code(401).send({ erro: "SESSAO_INVALIDA", mensagem: "Sessão inválida ou expirada." });
    return null;
  }

  if (sessao.usuario.papel !== "ADMIN" && sessao.usuario.papel !== "admin") {
    reply.code(403).send({ erro: "SEM_PERMISSAO", mensagem: "Acesso restrito a administradores Bizy." });
    return null;
  }

  return sessao.usuario;
}

function aplicarNoStore(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "no-store");
}
