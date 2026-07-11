import { z } from "zod";
import type { RouteHandlerMethod } from "fastify";
import type { Peca } from "../../../../dominio/tipos.js";
import {
  ParamCodigoSchema,
  ParamIdSchema,
  ParamSlugSchema,
  QueryLimiteSchema,
  QueryMarketLojasSchema,
  QueryMarketPedidosSchema,
  QueryMarketProdutosSchema,
  QueryMarketSeguidoresSchema,
  QueryRepassesSchema,
  RegistrarEventoTrackingSchema
} from "../../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../../../../infra/http/contextoComercial.js";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";
import { contemDadoSensivelTracking } from "./moduloLojaPublica.js";
import type { SellerOnboardingMarket } from "../../aplicacao/BizyMarketUseCase.js";

const AtualizarPublicacaoMarketSchema = z.object({
  publicado: z.boolean()
});

const AtualizarPublicacaoMarketMassaSchema = AtualizarPublicacaoMarketSchema.extend({
  codigos: z.array(z.string().trim().min(1).max(32)).min(1).max(500)
});

const CatalogoLojaSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  descricao: z.string().trim().max(300).nullish(),
  criterio: z.enum(["categoria", "colecao", "busca", "todos"]).default("busca"),
  valor: z.string().trim().max(200).nullish()
});

const EstadoSellerMarketSchema = z.enum(["RASCUNHO", "PENDENTE", "EM_REVISAO", "APROVADO", "REJEITADO", "SUSPENSO"]);

const AtualizarSellerOnboardingSchema = z.object({
  estado: EstadoSellerMarketSchema.optional(),
  motivo: z.string().trim().min(3).max(500).nullable().optional(),
  documentos: z.object({
    nif: z.string().trim().min(3).max(40).nullable().optional(),
    iban: z.string().trim().min(8).max(80).nullable().optional(),
    identidadeUrl: z.string().trim().url().max(500).nullable().optional(),
    comprovativoBancarioUrl: z.string().trim().url().max(500).nullable().optional(),
    termoAceiteEm: z.string().trim().datetime().nullable().optional()
  }).optional(),
  verificacao: z.object({
    responsavelNome: z.string().trim().min(2).max(120).nullable().optional(),
    responsavelTelefone: z.string().trim().min(5).max(40).nullable().optional(),
    observacao: z.string().trim().min(3).max(500).nullable().optional()
  }).optional()
});

const EstadoDenunciaMarketSchema = z.enum(["PENDENTE", "EM_REVISAO", "ACEITE", "REJEITADA", "RESOLVIDA"]);
const TipoDenunciaMarketSchema = z.enum(["PRODUTO_PROIBIDO", "INFORMACAO_FALSA", "FRAUDE", "CONTEUDO_OFENSIVO", "SPAM", "OUTRO"]);

const QueryDisputasMarketSchema = z.object({
  estado: EstadoDenunciaMarketSchema.optional(),
  entidadeTipo: z.enum(["PRODUTO", "LOJA"]).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional()
});

const CriarDisputaMarketSchema = z.object({
  tipo: TipoDenunciaMarketSchema.optional(),
  entidadeTipo: z.enum(["PRODUTO", "LOJA"]).optional(),
  entidadeId: z.string().trim().min(1).max(120).optional(),
  motivo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().min(5).max(1200).nullable().optional(),
  evidencias: z.array(z.string().trim().min(3).max(500)).max(20).optional(),
  prazoRespostaEm: z.string().trim().datetime().nullable().optional(),
  responsavelId: z.string().trim().min(2).max(120).nullable().optional()
});

const DecidirDisputaMarketSchema = z.object({
  estado: z.enum(["ACEITE", "REJEITADA", "RESOLVIDA"]),
  resolucao: z.string().trim().min(5).max(1200),
  acao: z.enum(["REEMBOLSO", "TROCA", "DEVOLUCAO", "CHARGEBACK", "NENHUMA"]).optional(),
  evidencias: z.array(z.string().trim().min(3).max(500)).max(20).optional(),
  valorEmKwanza: z.coerce.number().int().min(0).nullable().optional()
});

const CriarCasoPosVendaMarketSchema = z.object({
  tipo: z.enum(["TROCA", "DEVOLUCAO", "CHARGEBACK"]),
  pedidoId: z.string().trim().min(1).max(120),
  compraUnificadaId: z.string().trim().min(1).max(120).nullable().optional(),
  produtoCodigo: z.string().trim().min(1).max(64).nullable().optional(),
  motivo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().min(5).max(1200).nullable().optional(),
  evidencias: z.array(z.string().trim().min(3).max(500)).max(20).optional(),
  prazoRespostaEm: z.string().trim().datetime().nullable().optional(),
  responsavelId: z.string().trim().min(2).max(120).nullable().optional(),
  valorEmKwanza: z.coerce.number().int().min(0).nullable().optional()
});

const QueryEventosMarketSchema = z.object({
  limite: z.coerce.number().int().min(1).max(500).optional()
});

const QueryReembolsosMarketSchema = z.object({
  pedidoId: z.string().trim().min(1).max(120).optional(),
  estado: z.enum(["PENDENTE", "APROVADO", "PROCESSADO", "REJEITADO"]).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional()
});

const CriarReembolsoMarketSchema = z.object({
  pedidoId: z.string().trim().min(1).max(120),
  compraUnificadaId: z.string().trim().min(1).max(120).nullable().optional(),
  tipo: z.enum(["TOTAL", "PARCIAL"]).optional(),
  valorEmKwanza: z.coerce.number().int().positive(),
  motivo: z.string().trim().min(3).max(500),
  itensAfetados: z.array(z.object({
    codigoPeca: z.string().trim().min(1).max(64),
    quantidade: z.coerce.number().int().positive(),
    valorEmKwanza: z.coerce.number().int().min(0)
  })).max(100).optional()
});

const PREFIXOS_LOJA_OPERACIONAL = ["/team/loja", "/crm/loja"] as const;
const TOPICO_MARKET = "bizy.market";

export const moduloMarket: ModuloHttp = {
  nome: "bizy-market",
  descricao: "Shopping center público do Bizy para descoberta de produtos entre lojas.",
  registrar(app, contexto) {
    const registrarLojaOperacional = (
      metodo: "get" | "post" | "put" | "patch" | "delete",
      sufixo: string,
      handler: RouteHandlerMethod
    ) => {
      for (const prefixo of PREFIXOS_LOJA_OPERACIONAL) {
        const rota = `${prefixo}${sufixo}`;
        if (metodo === "get") app.get(rota, handler);
        else if (metodo === "post") app.post(rota, handler);
        else if (metodo === "put") app.put(rota, handler);
        else if (metodo === "patch") app.patch(rota, handler);
        else app.delete(rota, handler);
      }
    };

    // --- Endpoints públicos Market ---

    app.get("/publico/market/categorias", async (_request, reply) => {
      aplicarCacheMarketPublico(reply);
      return contexto.bizyMarket.listarCategorias();
    });

    app.get("/publico/market/produtos", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const query = QueryMarketProdutosSchema.parse(request.query);
      return contexto.bizyMarket.listarProdutos({
        busca: query.busca,
        categoria: query.categoria,
        provincia: query.provincia,
        municipio: query.municipio,
        loja: query.loja,
        precoMinimo: query.precoMinimo,
        precoMaximo: query.precoMaximo,
        apenasDisponivel: query.apenasDisponivel || undefined,
        apenasPromocao: query.apenasPromocao || undefined,
        limite: query.limite,
        offset: query.offset
      });
    });

    app.get("/publico/market/produtos/:codigo", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const { codigo } = ParamCodigoSchema.parse(request.params);
      return contexto.bizyMarket.obterProduto(codigo);
    });

    app.get("/publico/market/produtos/:codigo/similares", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const { codigo } = ParamCodigoSchema.parse(request.params);
      const query = QueryLimiteSchema.parse(request.query);
      return contexto.bizyMarket.listarProdutosSimilares(codigo, {
        limite: query.limite
      });
    });

    // Fase 2: Listagem de lojas no Market
    app.get("/publico/market/lojas", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const query = QueryMarketLojasSchema.parse(request.query);
      return contexto.bizyMarket.listarLojasMarket({
        busca: query.busca,
        categoria: query.categoria,
        provincia: query.provincia,
        limite: query.limite,
        offset: query.offset
      });
    });

    // Fase 2: Perfil de loja no contexto Market
    app.get("/publico/market/lojas/:slug", async (request, reply) => {
      aplicarCacheMarketPublico(reply);
      const { slug } = ParamSlugSchema.parse(request.params);
      return contexto.bizyMarket.obterLojaMarket(slug);
    });

    // Fase 2: Tracking de recomendações
    app.post("/publico/recomendacoes/eventos", async (request, reply) => {
      aplicarNoStore(reply);
      const dados = RegistrarEventoTrackingSchema.parse(request.body ?? {});
      if (!dados.slugLoja) {
        return reply.code(400).send({ erro: "VALIDACAO", mensagem: "Informe slugLoja para tracking de recomendações." });
      }
      if (contemDadoSensivelTracking(dados)) {
        return reply.code(400).send({
          erro: "TRACKING_DADO_SENSIVEL",
          mensagem: "Tracking público deve usar apenas identificadores técnicos, origem, campanha e timestamps."
        });
      }
      const evento = await contexto.lojaPublica.registrarEventoPublico(dados.slugLoja, {
        ...dados,
        tipo: dados.tipo ?? "RECOMENDACAO_EXIBIDA"
      });
      return reply.code(201).send(evento);
    });

    // --- Team: Controlo Market e Studio ---
    // O prefixo /team/loja é canónico; /crm/loja fica apenas como alias legado.

    registrarLojaOperacional("get", "/market/resumo", async (request, reply) => {
      aplicarNoStore(reply);
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "loja-publica:gerir",
          modulo: "loja-publica",
          mensagemPermissao: "Sem permissão para consultar publicação no Bizy Market.",
          mensagemModulo: "Loja pública desativada para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.bizyMarket.resumirLoja(contextoComercial.negocio);
    });

    registrarLojaOperacional("get", "/seller/onboarding", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar onboarding seller.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      return contexto.bizyMarket.obterSellerOnboarding(ctx.negocio);
    });

    registrarLojaOperacional("put", "/seller/onboarding", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para atualizar onboarding seller.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const dados = AtualizarSellerOnboardingSchema.parse(request.body ?? {});
      const negocioAtualizado = await salvarSellerOnboardingNegocio(contexto, ctx, montarSellerOnboarding(ctx, dados));
      await registrarEventoMarket(contexto, ctx.negocio.id, "SELLER_ONBOARDING_ATUALIZADO", "SELLER", ctx.negocio.id, {
        estadoSolicitado: dados.estado ?? null,
        atualizadoPorId: ctx.usuario.id
      });
      return contexto.bizyMarket.obterSellerOnboarding(negocioAtualizado);
    });

    registrarLojaOperacional("get", "/seller/conta", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar conta seller.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      return montarContaSeller(contexto, ctx.negocio.id);
    });

    registrarLojaOperacional("get", "/catalogo/checklist", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "catalogo:gerir",
        modulo: "catalogo",
        mensagemPermissao: "Sem permissão para consultar checklist de catálogo Market.",
        mensagemModulo: "Catálogo desativado para este negócio."
      });
      if (!ctx) return;

      const [resumoMarket, produtos] = await Promise.all([
        contexto.bizyMarket.resumirLoja(ctx.negocio),
        contexto.gestaoPecas.listarPecas(ctx.negocio.id)
      ]);
      return montarChecklistCatalogoMarket(ctx.negocio, resumoMarket, produtos);
    });

    registrarLojaOperacional("get", "/disputas", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar disputas Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const query = QueryDisputasMarketSchema.parse(request.query ?? {});
      const disputas = await contexto.repositorios.denuncias.listar({
        estado: query.estado,
        entidadeTipo: query.entidadeTipo,
        negocioAlvoId: ctx.negocio.id,
        limite: query.limite ?? 100
      });
      return { disputas, total: disputas.length };
    });

    registrarLojaOperacional("post", "/disputas", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para abrir disputas Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const dados = CriarDisputaMarketSchema.parse(request.body ?? {});
      const entidadeTipo = dados.entidadeTipo ?? "LOJA";
      const disputa = await contexto.repositorios.denuncias.criar({
        tipo: dados.tipo ?? "OUTRO",
        entidadeTipo,
        entidadeId: dados.entidadeId ?? (entidadeTipo === "LOJA" ? ctx.negocio.id : "produto-market"),
        negocioAlvoId: ctx.negocio.id,
        denuncianteId: ctx.usuario.id,
        motivo: dados.motivo,
        descricao: dados.descricao ?? null
      });
      await registrarEventoMarket(contexto, ctx.negocio.id, "DISPUTA_ABERTA", entidadeTipo, disputa.entidadeId, {
        disputaId: disputa.id,
        tipo: disputa.tipo,
        motivo: disputa.motivo,
        evidencias: dados.evidencias ?? [],
        prazoRespostaEm: dados.prazoRespostaEm ?? null,
        responsavelId: dados.responsavelId ?? null,
        abertoPorId: ctx.usuario.id
      });
      return reply.code(201).send({ disputa });
    });

    registrarLojaOperacional("patch", "/disputas/:id/decisao", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para decidir disputas Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const { id } = ParamIdSchema.parse(request.params);
      const disputaAtual = await contexto.repositorios.denuncias.buscarPorId(id);
      if (!disputaAtual || disputaAtual.negocioAlvoId !== ctx.negocio.id) {
        return reply.code(404).send({ erro: "DISPUTA_NAO_ENCONTRADA", mensagem: "Disputa não encontrada nesta loja." });
      }

      const dados = DecidirDisputaMarketSchema.parse(request.body ?? {});
      const disputa = await contexto.repositorios.denuncias.resolver(id, {
        estado: dados.estado,
        resolucao: dados.resolucao,
        resolvidoPorId: ctx.usuario.id
      });
      if (!disputa) return reply.code(404).send({ erro: "DISPUTA_NAO_ENCONTRADA", mensagem: "Disputa não encontrada." });

      await registrarEventoMarket(contexto, ctx.negocio.id, "DISPUTA_DECIDIDA", disputa.entidadeTipo, disputa.entidadeId, {
        disputaId: disputa.id,
        estado: disputa.estado,
        acao: dados.acao ?? "NENHUMA",
        resolucao: disputa.resolucao,
        evidencias: dados.evidencias ?? [],
        valorEmKwanza: dados.valorEmKwanza ?? null,
        decididoPorId: ctx.usuario.id
      });

      return { disputa };
    });

    registrarLojaOperacional("post", "/pos-venda/casos", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para abrir caso pós-venda Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const dados = CriarCasoPosVendaMarketSchema.parse(request.body ?? {});
      const entidadeTipo = dados.produtoCodigo ? "PRODUTO" : "LOJA";
      const entidadeId = dados.produtoCodigo ?? dados.pedidoId;
      const caso = await contexto.repositorios.denuncias.criar({
        tipo: dados.tipo === "CHARGEBACK" ? "FRAUDE" : "OUTRO",
        entidadeTipo,
        entidadeId,
        negocioAlvoId: ctx.negocio.id,
        denuncianteId: ctx.usuario.id,
        motivo: `[${dados.tipo}] ${dados.motivo}`,
        descricao: dados.descricao ?? null
      });
      const { evento } = await registrarEventoMarket(contexto, ctx.negocio.id, `POS_VENDA_${dados.tipo}_ABERTO`, entidadeTipo, entidadeId, {
        casoId: caso.id,
        tipo: dados.tipo,
        pedidoId: dados.pedidoId,
        compraUnificadaId: dados.compraUnificadaId ?? null,
        produtoCodigo: dados.produtoCodigo ?? null,
        motivo: dados.motivo,
        evidencias: dados.evidencias ?? [],
        prazoRespostaEm: dados.prazoRespostaEm ?? null,
        responsavelId: dados.responsavelId ?? null,
        valorEmKwanza: dados.valorEmKwanza ?? null,
        abertoPorId: ctx.usuario.id
      });

      return reply.code(201).send({ caso, evento });
    });

    registrarLojaOperacional("get", "/trust-safety/fila", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar Trust & Safety.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const query = QueryDisputasMarketSchema.parse(request.query ?? {});
      const casos = await contexto.repositorios.denuncias.listar({
        estado: query.estado,
        entidadeTipo: query.entidadeTipo,
        negocioAlvoId: ctx.negocio.id,
        limite: query.limite ?? 100
      });
      return {
        casos,
        metricas: {
          abertos: casos.filter((caso) => caso.estado === "PENDENTE" || caso.estado === "EM_REVISAO").length,
          resolvidos: casos.filter((caso) => caso.estado === "RESOLVIDA" || caso.estado === "ACEITE" || caso.estado === "REJEITADA").length
        }
      };
    });

    registrarLojaOperacional("put", "/produtos/:codigo/publicacao", async (request, reply) => {
      aplicarNoStore(reply);
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para publicar produtos no Bizy Market.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = ParamCodigoSchema.parse(request.params);
      const dados = AtualizarPublicacaoMarketSchema.parse(request.body ?? {});
      return contexto.bizyMarket.atualizarPublicacaoProduto(contextoComercial.negocio.id, codigo, dados.publicado);
    });

    registrarLojaOperacional("put", "/produtos/publicacao-em-massa", async (request, reply) => {
      aplicarNoStore(reply);
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para publicar produtos no Bizy Market.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = AtualizarPublicacaoMarketMassaSchema.parse(request.body ?? {});
      return contexto.bizyMarket.atualizarPublicacaoProdutosEmMassa(
        contextoComercial.negocio.id,
        dados.codigos,
        dados.publicado
      );
    });

    // Fase 3: CRUD Catálogos da loja no Team
    registrarLojaOperacional("get", "/catalogos", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para gerir catálogos.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;
      return { catalogos: extrairCatalogosNegocio(ctx.negocio) };
    });

    registrarLojaOperacional("post", "/catalogos", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para criar catálogos.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;
      const dados = CatalogoLojaSchema.parse(request.body ?? {});
      const catalogos = extrairCatalogosNegocio(ctx.negocio);
      if (catalogos.length >= 12) {
        return reply.code(400).send({ erro: "LIMITE", mensagem: "Máximo de 12 catálogos por loja." });
      }
      const id = normalizarIdCatalogo(dados.nome);
      if (catalogos.some((c) => c.id === id)) {
        return reply.code(409).send({ erro: "DUPLICADO", mensagem: "Já existe um catálogo com este nome." });
      }
      const novoCatalogo = { id, nome: dados.nome, descricao: dados.descricao ?? null, criterio: dados.criterio, valor: dados.valor ?? null };
      catalogos.push(novoCatalogo);
      await salvarCatalogosNegocio(contexto, ctx, catalogos);
      return reply.code(201).send(novoCatalogo);
    });

    registrarLojaOperacional("put", "/catalogos/:id", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para editar catálogos.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const dados = CatalogoLojaSchema.partial().parse(request.body ?? {});
      const catalogos = extrairCatalogosNegocio(ctx.negocio);
      const indice = catalogos.findIndex((c) => c.id === id);
      if (indice === -1) {
        return reply.code(404).send({ erro: "NAO_ENCONTRADO", mensagem: "Catálogo não encontrado." });
      }
      if (dados.nome !== undefined) catalogos[indice]!.nome = dados.nome;
      if (dados.descricao !== undefined) catalogos[indice]!.descricao = dados.descricao ?? null;
      if (dados.criterio !== undefined) catalogos[indice]!.criterio = dados.criterio;
      if (dados.valor !== undefined) catalogos[indice]!.valor = dados.valor ?? null;
      await salvarCatalogosNegocio(contexto, ctx, catalogos);
      return catalogos[indice];
    });

    registrarLojaOperacional("delete", "/catalogos/:id", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para remover catálogos.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;
      const { id } = ParamIdSchema.parse(request.params);
      const catalogos = extrairCatalogosNegocio(ctx.negocio);
      const novos = catalogos.filter((c) => c.id !== id);
      if (novos.length === catalogos.length) {
        return reply.code(404).send({ erro: "NAO_ENCONTRADO", mensagem: "Catálogo não encontrado." });
      }
      await salvarCatalogosNegocio(contexto, ctx, novos);
      return { ok: true };
    });

    // Fase 3: Seguidores da loja no Team
    registrarLojaOperacional("get", "/seguidores", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar seguidores.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;
      const query = QueryMarketSeguidoresSchema.parse(request.query);
      return contexto.repositorios.seguidoresLoja.listarSeguidores(ctx.negocio.id, {
        limite: query.limite ?? 50,
        offset: query.offset ?? 0,
        origem: query.origem
      });
    });

    // Fase 3: Métricas da loja no Team
    registrarLojaOperacional("get", "/metricas", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar métricas.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const [resumoMarket, tracking, seguidoresTotal, respostaPedidos, produtos] = await Promise.all([
        contexto.bizyMarket.resumirLoja(ctx.negocio),
        contexto.lojaPublica.resumirTracking(ctx.negocio.id),
        contexto.repositorios.seguidoresLoja.contarSeguidores(ctx.negocio.id),
        contexto.gestaoPedidos.listarPedidos(ctx.negocio.id),
        contexto.gestaoPecas.listarPecas(ctx.negocio.id)
      ]);

      const pedidos = respostaPedidos.pedidos;
      const pedidosPagos = pedidos.filter((p) => p.estadoPagamento === "CONFIRMADO" || p.estadoPagamento === "COMPROVATIVO_RECEBIDO");
      const receitaTotal = pedidosPagos.reduce((acc, p) => acc + (p.totalEmKwanza ?? 0), 0);
      const ticketMedio = pedidosPagos.length > 0 ? Math.round(receitaTotal / pedidosPagos.length) : 0;
      const produtosAtivos = produtos.filter((p) => !p.arquivadaEm && p.quantidade > 0 && p.estado !== "ESGOTADA" && p.estado !== "VENDIDA");

      return {
        perfil: {
          slug: ctx.negocio.slugPublico,
          publicada: Boolean(ctx.negocio.lojaPublicadaEm),
          seguidores: seguidoresTotal,
          totalProdutos: produtosAtivos.length
        },
        market: {
          publicados: resumoMarket.produtos.publicados,
          elegiveis: resumoMarket.produtos.elegiveis,
          comPendencias: resumoMarket.produtos.comPendencias
        },
        tracking,
        vendas: {
          totalPedidos: pedidos.length,
          pedidosPagos: pedidosPagos.length,
          receitaTotalEmKwanza: receitaTotal,
          ticketMedioEmKwanza: ticketMedio
        }
      };
    });

    // ── Pedidos com origem Market no Team da loja ──

    registrarLojaOperacional("get", "/pedidos-market", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar pedidos Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const query = QueryMarketPedidosSchema.parse(request.query);
      const { pedidos } = await contexto.gestaoPedidos.listarPedidos(ctx.negocio.id, {
        origem: "MARKET",
        estado: query.estado,
        estadoPagamento: query.estadoPagamento,
        busca: query.busca,
        limite: query.limite ?? 50
      });

      return { pedidos, total: pedidos.length };
    });

    // ── Repasses financeiros no Team da loja ──

    registrarLojaOperacional("get", "/repasses", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar repasses.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const query = QueryRepassesSchema.parse(request.query);
      return contexto.repassesFinanceiros.listarRepasses(ctx.negocio.id, {
        estado: query.estado,
        pedidoId: query.pedidoId,
        limite: query.limite
      });
    });

    registrarLojaOperacional("get", "/reembolsos", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar reembolsos Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const query = QueryReembolsosMarketSchema.parse(request.query ?? {});
      const reembolsos = await contexto.repassesFinanceiros.listarReembolsos(ctx.negocio.id, {
        pedidoId: query.pedidoId,
        estado: query.estado,
        limite: query.limite
      });
      return { reembolsos, total: reembolsos.length };
    });

    registrarLojaOperacional("post", "/reembolsos", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para solicitar reembolso Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const dados = CriarReembolsoMarketSchema.parse(request.body ?? {});
      const reembolso = await contexto.checkoutUnificado.solicitarReembolso({
        ...dados,
        negocioId: ctx.negocio.id,
        compraUnificadaId: dados.compraUnificadaId ?? null,
        tipo: dados.tipo ?? "TOTAL"
      });
      await registrarEventoMarket(contexto, ctx.negocio.id, "REEMBOLSO_SOLICITADO", "PEDIDO", dados.pedidoId, {
        reembolsoId: reembolso.id,
        compraUnificadaId: reembolso.compraUnificadaId,
        valorEmKwanza: reembolso.valorEmKwanza,
        solicitadoPorId: ctx.usuario.id
      });
      return reply.code(201).send({ reembolso });
    });

    registrarLojaOperacional("get", "/eventos-market", async (request, reply) => {
      aplicarNoStore(reply);
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "loja-publica:gerir",
        modulo: "loja-publica",
        mensagemPermissao: "Sem permissão para consultar eventos Market.",
        mensagemModulo: "Loja pública desativada para este negócio."
      });
      if (!ctx) return;

      const query = QueryEventosMarketSchema.parse(request.query ?? {});
      const eventos = await contexto.repositorios.eventosOperacionais.listar(ctx.negocio.id, {
        topico: TOPICO_MARKET,
        limite: query.limite ?? 100
      });
      return {
        eventos,
        total: eventos.length,
        metricas: {
          onboarding: eventos.filter((evento) => evento.tipo.includes("SELLER")).length,
          disputas: eventos.filter((evento) => evento.tipo.includes("DISPUTA")).length,
          reembolsos: eventos.filter((evento) => evento.tipo.includes("REEMBOLSO")).length,
          checkout: eventos.filter((evento) => ["CHECKOUT_CRIADO", "PEDIDO_FILHO_CRIADO", "PAGAMENTO_COMPROVATIVO_RECEBIDO"].includes(evento.tipo)).length,
          entregas: eventos.filter((evento) => evento.tipo.includes("ENTREGA")).length,
          payouts: eventos.filter((evento) => evento.tipo.includes("PAYOUT")).length,
          posVenda: eventos.filter((evento) => evento.tipo.startsWith("POS_VENDA_")).length
        }
      };
    });
  }
};

interface CatalogoLoja {
  id: string;
  nome: string;
  descricao: string | null;
  criterio: string;
  valor: string | null;
}

function extrairCatalogosNegocio(negocio: { entrega?: unknown }): CatalogoLoja[] {
  const entrega = obj(negocio.entrega);
  const lojaDigital = obj(entrega.lojaDigital);
  const experiencia = obj(lojaDigital.experiencia);
  const catalogos = experiencia.catalogosPersonalizados;
  if (!Array.isArray(catalogos)) return [];
  return catalogos.map((c) => {
    const item = obj(c);
    return {
      id: String(item.id ?? ""),
      nome: String(item.nome ?? ""),
      descricao: typeof item.descricao === "string" ? item.descricao : null,
      criterio: String(item.criterio ?? "busca"),
      valor: typeof item.valor === "string" ? item.valor : null
    };
  }).filter((c) => c.id && c.nome);
}

async function salvarCatalogosNegocio(
  contexto: Parameters<ModuloHttp["registrar"]>[1],
  ctx: { usuario: { id: string }; negocio: { id: string; nomeComercial: string; segmento: string; tipo: string; entrega?: unknown } },
  catalogos: CatalogoLoja[]
) {
  const negocio = ctx.negocio;
  const entregaAtual = obj(negocio.entrega);
  const lojaDigitalAtual = obj(entregaAtual.lojaDigital);
  const experienciaAtual = obj(lojaDigitalAtual.experiencia);

  await contexto.onboardingBizy.salvarNegocio(ctx.usuario.id, {
    nomeComercial: negocio.nomeComercial as string,
    segmento: negocio.segmento as string,
    tipo: negocio.tipo as string,
    entrega: {
      ...entregaAtual,
      lojaDigital: {
        ...lojaDigitalAtual,
        experiencia: {
          ...experienciaAtual,
          catalogosPersonalizados: catalogos
        }
      }
    }
  } as any);
}

function montarSellerOnboarding(
  ctx: { usuario: { id: string }; negocio: { entrega?: unknown } },
  dados: z.infer<typeof AtualizarSellerOnboardingSchema>
): SellerOnboardingMarket {
  const actual = extrairSellerOnboardingNegocio(ctx.negocio);
  const agora = new Date().toISOString();
  const estado = dados.estado ?? actual.estado;
  return {
    estado,
    documentos: {
      ...actual.documentos,
      ...(dados.documentos ?? {})
    },
    verificacao: {
      ...actual.verificacao,
      ...(dados.verificacao ?? {})
    },
    historico: [
      ...actual.historico,
      {
        estado,
        motivo: dados.motivo ?? null,
        atualizadoEm: agora,
        atualizadoPorId: ctx.usuario.id
      }
    ].slice(-30),
    atualizadoEm: agora,
    atualizadoPorId: ctx.usuario.id
  };
}

function extrairSellerOnboardingNegocio(negocio: { entrega?: unknown }): SellerOnboardingMarket {
  const entrega = obj(negocio.entrega);
  const lojaDigital = obj(entrega.lojaDigital);
  const marketplace = obj(lojaDigital.marketplace);
  const seller = obj(marketplace.sellerOnboarding);
  const documentos = obj(seller.documentos);
  const verificacao = obj(seller.verificacao);
  const historico = Array.isArray(seller.historico) ? seller.historico : [];
  const estadoRaw = String(seller.estado ?? "PENDENTE").toUpperCase();
  const estado = ["RASCUNHO", "PENDENTE", "EM_REVISAO", "APROVADO", "REJEITADO", "SUSPENSO"].includes(estadoRaw)
    ? estadoRaw as SellerOnboardingMarket["estado"]
    : "PENDENTE";

  return {
    estado,
    documentos: {
      nif: texto(documentos.nif),
      iban: texto(documentos.iban),
      identidadeUrl: texto(documentos.identidadeUrl),
      comprovativoBancarioUrl: texto(documentos.comprovativoBancarioUrl),
      termoAceiteEm: texto(documentos.termoAceiteEm)
    },
    verificacao: {
      responsavelNome: texto(verificacao.responsavelNome),
      responsavelTelefone: texto(verificacao.responsavelTelefone),
      observacao: texto(verificacao.observacao)
    },
    historico: historico
      .map((item) => obj(item))
      .map((item) => ({
        estado: String(item.estado ?? "PENDENTE"),
        motivo: texto(item.motivo),
        atualizadoEm: texto(item.atualizadoEm) ?? new Date().toISOString(),
        atualizadoPorId: texto(item.atualizadoPorId)
      })),
    atualizadoEm: texto(seller.atualizadoEm),
    atualizadoPorId: texto(seller.atualizadoPorId)
  };
}

async function salvarSellerOnboardingNegocio(
  contexto: Parameters<ModuloHttp["registrar"]>[1],
  ctx: {
    usuario: { id: string };
    negocio: {
      id: string;
      nomeComercial: string;
      segmento: string;
      tipo: string;
      entrega?: unknown;
      slugPublico?: string | null;
      lojaPublicadaEm?: Date | null;
      descricaoPublica?: string | null;
      provincia?: string | null;
      municipio?: string | null;
    };
  },
  sellerOnboarding: SellerOnboardingMarket
) {
  const entregaAtual = obj(ctx.negocio.entrega);
  const lojaDigitalAtual = obj(entregaAtual.lojaDigital);
  const marketplaceAtual = obj(lojaDigitalAtual.marketplace);
  const entrega = {
    ...entregaAtual,
    lojaDigital: {
      ...lojaDigitalAtual,
      marketplace: {
        ...marketplaceAtual,
        sellerOnboarding
      }
    }
  };

  await contexto.onboardingBizy.salvarNegocio(ctx.usuario.id, {
    nomeComercial: ctx.negocio.nomeComercial,
    segmento: ctx.negocio.segmento,
    tipo: ctx.negocio.tipo,
    entrega
  } as any);

  return {
    ...ctx.negocio,
    entrega
  } as any;
}

async function montarContaSeller(contexto: Parameters<ModuloHttp["registrar"]>[1], negocioId: string) {
  const [resumo, disputasAbertas] = await Promise.all([
    contexto.repassesFinanceiros.resumoFinanceiroLoja(negocioId),
    contexto.repositorios.denuncias.listar({
      negocioAlvoId: negocioId,
      limite: 100
    })
  ]);
  const repassesEmDisputa = resumo.repasses.filter((repasse) => repasse.estado === "EM_DISPUTA");
  const valorEmDisputa = repassesEmDisputa.reduce((total, repasse) => total + repasse.valorLiquidoEmKwanza, 0);
  const totalTaxas = resumo.repasses.reduce((total, repasse) => total + repasse.taxaBizyEmKwanza + repasse.comissaoEmKwanza, 0);

  return {
    saldos: {
      disponivelEmKwanza: resumo.totalAprovado,
      retidoEmKwanza: resumo.totalPendente + resumo.totalConciliado,
      pagoEmKwanza: resumo.totalPago,
      canceladoEmKwanza: resumo.totalCancelado,
      emDisputaEmKwanza: valorEmDisputa
    },
    taxas: {
      totalTaxasBizyEComissoesEmKwanza: totalTaxas
    },
    disputas: {
      abertas: disputasAbertas.filter((item) => item.estado === "PENDENTE" || item.estado === "EM_REVISAO").length,
      total: disputasAbertas.length
    },
    repasses: resumo.repasses,
    reembolsosPendentes: resumo.reembolsosPendentes,
    atualizadoEm: new Date().toISOString()
  };
}

function montarChecklistCatalogoMarket(
  negocio: { entrega?: unknown },
  resumoMarket: unknown,
  produtos: Peca[]
) {
  const resumo = obj(resumoMarket);
  const produtosResumo = obj(resumo.produtos);
  const seller = obj(resumo.seller);
  const loja = obj(resumo.loja);
  const itensResumo = Array.isArray(resumo.itens) ? resumo.itens.map((item) => obj(item)) : [];
  const entrega = obj(negocio.entrega);
  const lojaDigital = obj(entrega.lojaDigital);
  const experiencia = obj(lojaDigital.experiencia);
  const politicaEntrega = texto(experiencia.politicaEntrega) ?? texto(entrega.politicaEntrega);
  const politicaTroca = texto(experiencia.politicaTroca) ?? texto(experiencia.politicaDevolucao);
  const temZonaEntrega = Array.isArray(entrega.zonas) && entrega.zonas.length > 0;
  const temTaxaEntrega = numero(entrega.taxaPadraoEmKwanza) > 0 || numero(entrega.entregaGratisAcimaDeKwanza) > 0;

  const produtosAtivos = produtos.filter((produto) => !produto.arquivadaEm);
  const itens = produtosAtivos.map((produto) => {
    const resumoProduto = itensResumo.find((item) => String(item.codigo ?? "") === produto.codigo);
    const publicado = Boolean(resumoProduto?.publicado ?? produto.vitrine.publicacaoMarket?.publicado ?? true);
    const elegivel = Boolean(resumoProduto?.elegivel ?? false);
    const variantes = Object.values(produto.variantes ?? {}).reduce((total, opcoes) => {
      return total + (Array.isArray(opcoes) ? opcoes.length : 0);
    }, 0);
    const checks = [
      montarCheck("imagem", produto.fotos.length > 0, "Adicionar pelo menos uma foto."),
      montarCheck("preco", produto.precoEmKwanza > 0, "Definir preço de venda."),
      montarCheck("categoria", Boolean(produto.categoria), "Informar categoria."),
      montarCheck("descricao", produto.descricao.trim().length >= 20, "Melhorar descrição para compra segura."),
      montarCheck("variacoes", variantes > 0 || produto.tipoProduto !== "FISICO", "Informar variações ou confirmar produto simples."),
      montarCheck("stock", produto.quantidade > 0 && produto.estado !== "ESGOTADA" && produto.estado !== "VENDIDA", "Repor stock disponível."),
      montarCheck("publicacao", publicado && elegivel, "Publicar no Market sem pendências.")
    ];

    return {
      codigo: produto.codigo,
      nome: produto.nome,
      publicado,
      elegivel,
      checks,
      pendencias: checks.filter((check) => !check.ok).map((check) => check.mensagem)
    };
  });

  const totalProdutos = numero(produtosResumo.total);
  const produtosElegiveis = numero(produtosResumo.elegiveis);
  const produtosPublicados = numero(produtosResumo.publicados);
  const produtosComPendencias = numero(produtosResumo.comPendencias);
  const catalogoSemPendencias = itens.length > 0 && itens.every((item) => item.pendencias.length === 0);
  const politicasOk = Boolean(politicaEntrega || politicaTroca || temZonaEntrega || temTaxaEntrega);
  const checklist = [
    montarCheck("seller", Boolean(seller.elegivel), "Concluir onboarding seller.", {
      estado: texto(seller.estado),
      pendencias: Array.isArray(seller.pendencias) ? seller.pendencias : []
    }),
    montarCheck("loja-publica", Boolean(loja.publicada), "Publicar loja com slug público.", {
      slug: texto(loja.slug)
    }),
    montarCheck("catalogo", totalProdutos > 0 && produtosElegiveis > 0, "Cadastrar produto elegível para o Market.", {
      total: totalProdutos,
      elegiveis: produtosElegiveis
    }),
    montarCheck("conteudo-produto", catalogoSemPendencias, "Resolver pendências de imagem, preço, categoria, descrição, variações ou stock.", {
      comPendencias: produtosComPendencias
    }),
    montarCheck("entrega-politicas", politicasOk, "Definir entrega, troca ou devolução para reduzir disputas.", {
      temZonaEntrega,
      temTaxaEntrega,
      politicaEntrega: Boolean(politicaEntrega),
      politicaTroca: Boolean(politicaTroca)
    }),
    montarCheck("publicacao", produtosPublicados > 0 && produtosComPendencias === 0, "Publicar ao menos um produto sem pendências.", {
      publicados: produtosPublicados
    })
  ];

  return {
    prontoParaMarket: checklist.every((item) => item.ok),
    checklist,
    produtos: itens,
    metricas: {
      totalProdutos,
      produtosElegiveis,
      produtosPublicados,
      produtosComPendencias,
      produtosComChecklistCompleto: itens.filter((item) => item.pendencias.length === 0).length
    },
    atualizadoEm: new Date().toISOString()
  };
}

function montarCheck(codigo: string, ok: boolean, mensagem: string, detalhes: Record<string, unknown> = {}) {
  return {
    codigo,
    ok,
    mensagem: ok ? null : mensagem,
    detalhes
  };
}

async function registrarEventoMarket(
  contexto: Parameters<ModuloHttp["registrar"]>[1],
  negocioId: string,
  tipo: string,
  entidadeTipo: string,
  entidadeId: string | null,
  payload: Record<string, unknown>
) {
  return contexto.repositorios.eventosOperacionais.registrar({
    negocioId,
    topico: TOPICO_MARKET,
    tipo,
    entidadeTipo,
    entidadeId,
    idempotencyKey: `market:${tipo}:${entidadeId ?? "sem-entidade"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    payloadVersion: "market.v1",
    payload,
    estado: "PROCESSADO"
  });
}

function normalizarIdCatalogo(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "catalogo";
}

function obj(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function numero(valor: unknown): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

function aplicarCacheMarketPublico(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "public, max-age=60, s-maxage=300");
}

function aplicarNoStore(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "no-store");
}
