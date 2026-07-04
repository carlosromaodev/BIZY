import { z } from "zod";
import { ParamIdSchema, ParamSlugSchema } from "../../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../../../../infra/http/contextoComercial.js";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";

const NivelLearningSchema = z.enum(["INICIAL", "INTERMEDIO", "AVANCADO"]);
const EstadoProgramaLearningSchema = z.enum(["RASCUNHO", "EM_REVISAO", "PUBLICADO", "PAUSADO", "ARQUIVADO", "SUSPENSO"]);
const FormatoProgramaLearningSchema = z.enum([
  "CURSO",
  "MICROLEARNING",
  "LIVE",
  "WORKSHOP",
  "MENTORIA",
  "CERTIFICACAO",
  "COMUNIDADE",
  "MEMBERSHIP",
  "BUNDLE",
  "TRILHO",
  "TRILHA",
  "ACADEMIA",
  "DOWNLOAD",
  "COHORT"
]);
const VisibilidadeLearningSchema = z.enum(["PUBLICO", "TEAM"]);
const TipoLicaoLearningSchema = z.enum(["VIDEO", "TEXTO", "CHECKLIST", "QUIZ", "LIVE"]);
const TipoAcessoLearningSchema = z.enum(["GRATUITO", "PAGO", "PRIVADO", "CONVITE", "OBRIGATORIO"]);
const ModeloOfertaLearningSchema = z.enum(["GRATUITO", "PAGAMENTO_UNICO", "ASSINATURA", "BUNDLE", "ACESSO_MANUAL"]);

const CriarProgramaLearningSchema = z.object({
  titulo: z.string().trim().min(3).max(140),
  subtitulo: z.string().trim().min(3).max(220).optional(),
  descricao: z.string().trim().min(3).max(1200).optional(),
  categoria: z.string().trim().min(2).max(80),
  familiaProduto: z.string().trim().min(2).max(120).optional(),
  publico: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  perfisAlvo: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  nivel: NivelLearningSchema.optional(),
  formato: FormatoProgramaLearningSchema.optional(),
  duracaoMinutos: z.coerce.number().int().min(5).max(2400).optional(),
  estado: EstadoProgramaLearningSchema.optional(),
  destaque: z.boolean().optional(),
  visibilidade: VisibilidadeLearningSchema.optional(),
  resultadoEsperado: z.string().trim().min(3).max(300).optional(),
  ownerPerfil: z.string().trim().min(2).max(40).optional(),
  mentorNome: z.string().trim().min(2).max(120).optional(),
  tipoAcesso: TipoAcessoLearningSchema.optional(),
  oferta: z.object({
    modelo: ModeloOfertaLearningSchema.optional(),
    moeda: z.string().trim().min(3).max(8).optional(),
    valor: z.coerce.number().int().min(0).max(100_000_000).optional(),
    valorPromocional: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
    cupoes: z.array(z.string().trim().min(2).max(40)).max(20).optional(),
    periodoDias: z.coerce.number().int().min(1).max(3650).nullable().optional(),
    permiteComprovativo: z.boolean().optional(),
    emiteDocumento: z.boolean().optional()
  }).optional(),
  politicaAcesso: z.object({
    suporte: z.string().trim().min(3).max(300).optional(),
    reembolso: z.string().trim().min(3).max(300).optional(),
    certificado: z.string().trim().min(3).max(300).optional()
  }).optional(),
  modulosRelacionados: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  licoes: z.array(z.object({
    titulo: z.string().trim().min(3).max(140),
    tipo: TipoLicaoLearningSchema.optional(),
    duracaoMinutos: z.coerce.number().int().min(1).max(240).optional(),
    accaoBizy: z.string().trim().min(3).max(180).optional()
  })).max(20).optional()
});

const AlterarPublicacaoLearningSchema = z.object({
  estado: EstadoProgramaLearningSchema,
  destaque: z.boolean().optional(),
  visibilidade: VisibilidadeLearningSchema.optional()
});

const CheckoutLearningSchema = z.object({
  programaSlug: z.string().trim().min(2).max(120),
  compradorNome: z.string().trim().min(2).max(160).optional(),
  compradorEmail: z.string().trim().email().max(200).optional(),
  compradorTelefone: z.string().trim().min(6).max(40).optional(),
  metodoPagamento: z.string().trim().min(2).max(80).optional(),
  referenciaPagamento: z.string().trim().min(2).max(120).optional(),
  comprovativoUrl: z.string().trim().url().max(500).optional(),
  cupao: z.string().trim().min(2).max(40).optional(),
  confirmarPagamento: z.boolean().optional()
});

const RevogarEntitlementSchema = z.object({
  motivo: z.string().trim().min(3).max(300).optional()
});

const QueryChatLearningSchema = z.object({
  programaSlug: z.string().trim().min(2).max(120).optional()
});

const EnviarMensagemChatLearningSchema = z.object({
  programaSlug: z.string().trim().min(2).max(120).optional(),
  contexto: z.enum(["PROGRAMA", "COHORT", "COMUNIDADE", "SUPORTE"]).optional(),
  tipo: z.enum(["MENSAGEM", "DECISAO", "TAREFA", "SUPORTE", "ANUNCIO"]).optional(),
  conteudo: z.string().trim().min(1).max(2000),
  mencoes: z.array(z.string().trim().min(1).max(80)).max(20).optional()
});

export const moduloLearning: ModuloHttp = {
  nome: "bizy-learning",
  descricao: "Sistema público de aprendizagem com administração operacional pelo Team.",
  registrar(app, contexto) {
    app.get("/publico/learning", async (request, reply) => {
      aplicarCachePublico(reply);
      return contexto.bizyLearning.obterHomePublica();
    });

    app.get("/publico/learning/programas/:slug", async (request, reply) => {
      aplicarCachePublico(reply);
      const { slug } = ParamSlugSchema.parse(request.params);
      return contexto.bizyLearning.obterProgramaPublico(slug);
    });

    app.get("/publico/learning/produtos/:slug", async (request, reply) => {
      aplicarCachePublico(reply);
      const { slug } = ParamSlugSchema.parse(request.params);
      return contexto.bizyLearning.obterProdutoPublico(slug);
    });

    app.get("/learning/team/resumo", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para consultar o Bizy Learning."
      });
      if (!ctx) return;

      return contexto.bizyLearning.obterResumoTeam(ctx.negocio.id, ctx.usuario.id, ctx.papel, ctx.permissoes);
    });

    app.post("/learning/team/programas", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:administrar",
        mensagemPermissao: "Sem permissão para administrar programas do Bizy Learning."
      });
      if (!ctx) return;

      const dados = CriarProgramaLearningSchema.parse(request.body ?? {});
      const resultado = await contexto.bizyLearning.criarProgramaTeam(ctx.negocio.id, ctx.usuario.id, dados);
      return reply.code(201).send(resultado);
    });

    app.post("/learning/team/produtos", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:administrar",
        mensagemPermissao: "Sem permissão para administrar produtos digitais do Bizy Learning."
      });
      if (!ctx) return;

      const dados = CriarProgramaLearningSchema.parse(request.body ?? {});
      const resultado = await contexto.bizyLearning.criarProgramaTeam(ctx.negocio.id, ctx.usuario.id, dados);
      return reply.code(201).send(resultado);
    });

    app.patch("/learning/team/programas/:slug/publicacao", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:administrar",
        mensagemPermissao: "Sem permissão para publicar programas do Bizy Learning."
      });
      if (!ctx) return;

      const { slug } = ParamSlugSchema.parse(request.params);
      const dados = AlterarPublicacaoLearningSchema.parse(request.body ?? {});
      return contexto.bizyLearning.alterarPublicacao(ctx.negocio.id, ctx.usuario.id, slug, dados);
    });

    app.post("/learning/checkout", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para comprar produtos do Bizy Learning."
      });
      if (!ctx) return;

      const dados = CheckoutLearningSchema.parse(request.body ?? {});
      const resultado = await contexto.bizyLearning.checkoutDigital(ctx.negocio.id, ctx.usuario.id, dados);
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/learning/programas/:slug/inscrever", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para se inscrever no Bizy Learning."
      });
      if (!ctx) return;

      const { slug } = ParamSlugSchema.parse(request.params);
      const resultado = await contexto.bizyLearning.inscrever(ctx.negocio.id, ctx.usuario.id, slug, "TEAM");
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/learning/licoes/:id/concluir", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para concluir lições do Bizy Learning."
      });
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const resultado = await contexto.bizyLearning.concluirLicao(ctx.negocio.id, ctx.usuario.id, id);
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.get("/learning/progresso", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para consultar progresso do Bizy Learning."
      });
      if (!ctx) return;

      return contexto.bizyLearning.obterProgresso(ctx.negocio.id, ctx.usuario.id);
    });

    app.get("/learning/entitlements", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para consultar acessos do Bizy Learning."
      });
      if (!ctx) return;

      return contexto.bizyLearning.obterAcessos(ctx.negocio.id, ctx.usuario.id);
    });

    app.get("/learning/team/chat", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para consultar o chat interno do Bizy Learning."
      });
      if (!ctx) return;

      const { programaSlug } = QueryChatLearningSchema.parse(request.query ?? {});
      return contexto.bizyLearning.listarChatInterno(ctx.negocio.id, ctx.usuario.id, ctx.papel, programaSlug);
    });

    app.get("/learning/team/programas/:slug/chat", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para consultar o chat interno do programa."
      });
      if (!ctx) return;

      const { slug } = ParamSlugSchema.parse(request.params);
      return contexto.bizyLearning.listarChatInterno(ctx.negocio.id, ctx.usuario.id, ctx.papel, slug);
    });

    app.post("/learning/team/chat/mensagens", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para enviar mensagens internas do Bizy Learning."
      });
      if (!ctx) return;

      const dados = EnviarMensagemChatLearningSchema.required({ programaSlug: true }).parse(request.body ?? {});
      const resultado = await contexto.bizyLearning.enviarMensagemChatInterno(
        ctx.negocio.id,
        ctx.usuario.id,
        ctx.usuario.nome,
        ctx.papel,
        dados
      );
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/learning/team/programas/:slug/chat/mensagens", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para enviar mensagens internas do programa."
      });
      if (!ctx) return;

      const { slug } = ParamSlugSchema.parse(request.params);
      const dados = EnviarMensagemChatLearningSchema.omit({ programaSlug: true }).parse(request.body ?? {});
      const resultado = await contexto.bizyLearning.enviarMensagemChatInterno(
        ctx.negocio.id,
        ctx.usuario.id,
        ctx.usuario.nome,
        ctx.papel,
        { ...dados, programaSlug: slug }
      );
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/learning/entitlements/:id/revogar", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:administrar",
        mensagemPermissao: "Sem permissão para revogar acessos do Bizy Learning."
      });
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const { motivo } = RevogarEntitlementSchema.parse(request.body ?? {});
      return contexto.bizyLearning.revogarEntitlement(ctx.negocio.id, ctx.usuario.id, id, motivo ?? "Revogado pelo Team.");
    });

    app.post("/learning/programas/:slug/certificado", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para emitir certificado do Bizy Learning."
      });
      if (!ctx) return;

      const { slug } = ParamSlugSchema.parse(request.params);
      const resultado = await contexto.bizyLearning.emitirCertificado(ctx.negocio.id, ctx.usuario.id, slug);
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/learning/certificados/:slug/emitir", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "learning:ler",
        mensagemPermissao: "Sem permissão para emitir certificado do Bizy Learning."
      });
      if (!ctx) return;

      const { slug } = ParamSlugSchema.parse(request.params);
      const resultado = await contexto.bizyLearning.emitirCertificado(ctx.negocio.id, ctx.usuario.id, slug);
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });
  }
};

function aplicarCachePublico(reply: import("fastify").FastifyReply) {
  reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
}

function aplicarNoStore(reply: import("fastify").FastifyReply) {
  reply.header("Cache-Control", "no-store");
}
