import { z } from "zod";
import type { RouteHandlerMethod } from "fastify";
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

const PREFIXOS_LOJA_OPERACIONAL = ["/team/loja", "/crm/loja"] as const;

export const moduloMarket: ModuloHttp = {
  nome: "bizy-market",
  descricao: "Shopping center público do Bizy para descoberta de produtos entre lojas.",
  registrar(app, contexto) {
    const registrarLojaOperacional = (
      metodo: "get" | "post" | "put" | "delete",
      sufixo: string,
      handler: RouteHandlerMethod
    ) => {
      for (const prefixo of PREFIXOS_LOJA_OPERACIONAL) {
        const rota = `${prefixo}${sufixo}`;
        if (metodo === "get") app.get(rota, handler);
        else if (metodo === "post") app.post(rota, handler);
        else if (metodo === "put") app.put(rota, handler);
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
        limite: query.limite
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
        limite: query.limite
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

function aplicarCacheMarketPublico(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "public, max-age=60, s-maxage=300");
}

function aplicarNoStore(reply: { header: (nome: string, valor: string) => unknown }) {
  reply.header("Cache-Control", "no-store");
}
