import { z } from "zod";
import { ParamIdSchema } from "../../../../dominio/esquemas.js";
import type { CompraUnificada, PedidoFilho } from "../../../../dominio/tipos.js";
import { exigirAcessoComercial } from "../../../../infra/http/contextoComercial.js";
import { resolverFicheiroMedia, salvarMediaDataUrl } from "../../../../infra/media/MediaStorage.js";
import { criarScannerMedia } from "../../../../infra/media/ScannerMedia.js";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";
import {
  exigirContaAutenticada,
  obterTokenCarrinho,
  obterTokenCompra,
  obterTokenSessaoCommerce,
  resolverContaAutenticada
} from "../../../commerce/infra/http/segurancaContaBizy.js";

const ParamCompraIdSchema = z.object({ compraId: z.string().trim().min(1) });
const TOPICO_MARKET = "bizy.market";

const CriarCompraUnificadaSchema = z.object({
  idempotencyKey: z.string().trim().min(3).max(240).nullable().optional().transform((valor) => valor ?? null),
  compradorTelefone: z.string().min(9),
  compradorNome: z.string().nullish(),
  compradorEmail: z.string().email().nullish(),
  carrinhoId: z.string().uuid().nullable().optional().transform((valor) => valor ?? null),
  itens: z.array(z.object({
    slugLoja: z.string().min(1),
    codigoPeca: z.string(),
    varianteSelecionada: z.record(z.string()).nullish(),
    quantidade: z.number().int().min(1)
  })).default([]),
  entrega: z.object({
    tipo: z.enum(["ENTREGA", "RETIRADA", "ORCAMENTO"]),
    provincia: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null),
    municipio: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null),
    bairro: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null),
    endereco: z.string().trim().max(500).nullable().optional().transform((valor) => valor ?? null)
  }).nullish(),
  metodoPagamento: z.string().nullish(),
  comprovativoPagamentoUrl: z.string().nullish(),
  enderecoEntrega: z.string().nullish(),
  observacao: z.string().nullish(),
  origem: z.string().optional()
}).refine((dados) => Boolean(dados.carrinhoId) || dados.itens.length > 0, "Carrinho ou itens obrigatórios.");

const ItemCarrinhoSchema = z.object({
  slugLoja: z.string().trim().min(1).max(160),
  codigoPeca: z.string().trim().min(1).max(160),
  varianteSelecionada: z.record(z.string()).nullish(),
  quantidade: z.number().int().min(1).max(99),
  origem: z.string().trim().min(1).max(80).optional(),
  atribuicao: z.record(z.unknown()).optional()
});

const SincronizarCarrinhoSchema = z.object({
  modo: z.enum(["MESCLAR", "SUBSTITUIR"]).default("SUBSTITUIR"),
  itens: z.array(ItemCarrinhoSchema).max(100)
});

const CotarCheckoutSchema = z.object({
  itens: z.array(ItemCarrinhoSchema).min(1).max(100),
  entrega: z.object({
    tipo: z.enum(["ENTREGA", "RETIRADA", "ORCAMENTO"]),
    provincia: z.string().trim().max(120).nullable().optional(),
    municipio: z.string().trim().max(120).nullable().optional(),
    bairro: z.string().trim().max(120).nullable().optional(),
    endereco: z.string().trim().max(500).nullable().optional()
  })
});

const SolicitarReembolsoSchema = z.object({
  negocioId: z.string(),
  pedidoId: z.string(),
  compraUnificadaId: z.string().nullish(),
  tipo: z.enum(["TOTAL", "PARCIAL"]),
  valorEmKwanza: z.number().min(0),
  motivo: z.string().min(5),
  itensAfetados: z.array(z.object({
    codigoPeca: z.string(),
    quantidade: z.number().int().min(1),
    valorEmKwanza: z.number().min(0)
  })).optional()
});

const RegistrarComprovativoUnificadoSchema = z.object({
  ficheiroDataUrl: z.string().trim().min(20).max(14_000_000)
});

function formatarCompraPublica({ compra, pedidosFilho }: { compra: CompraUnificada; pedidosFilho: PedidoFilho[] }) {
  return {
    compra: {
      id: compra.id,
      numero: compra.numero,
      estado: compra.estado,
      estadoPagamento: compra.estadoPagamento,
      subtotalEmKwanza: compra.subtotalEmKwanza,
      descontoEmKwanza: compra.descontoEmKwanza,
      taxaEntregaTotalEmKwanza: compra.taxaEntregaTotalEmKwanza,
      totalEmKwanza: compra.totalEmKwanza,
      metodoPagamento: compra.metodoPagamento,
      origem: compra.origem,
      criadoEm: compra.criadoEm,
      atualizadoEm: compra.atualizadoEm
    },
    pedidosFilho: pedidosFilho.map((pedido) => ({
      id: pedido.id,
      compraUnificadaId: pedido.compraUnificadaId,
      estado: pedido.estado,
      estadoPagamento: pedido.estadoPagamento,
      estadoEntrega: pedido.estadoEntrega,
      estadoSeparacao: pedido.estadoSeparacao,
      estadoEmbalagem: pedido.estadoEmbalagem,
      provaEntregaUrl: pedido.provaEntregaUrl,
      tentativasEntrega: pedido.tentativasEntrega,
      motivoAtraso: pedido.motivoAtraso,
      estadoDevolucao: pedido.estadoDevolucao,
      fulfillment: pedido.fulfillment,
      subtotalEmKwanza: pedido.subtotalEmKwanza,
      taxaEntregaEmKwanza: pedido.taxaEntregaEmKwanza,
      totalEmKwanza: pedido.totalEmKwanza,
      criadoEm: pedido.criadoEm,
      atualizadoEm: pedido.atualizadoEm
    }))
  };
}

function formatarCarrinho(carrinho: Awaited<ReturnType<Parameters<ModuloHttp["registrar"]>[1]["carrinhoCommerce"]["obter"]>>) {
  if (!carrinho) return null;
  return {
    id: carrinho.id,
    estado: carrinho.estado,
    expiraEm: carrinho.expiraEm,
    itens: carrinho.itens.map((item) => ({
      id: item.id, slugLoja: item.slugLoja, codigoProduto: item.codigoPeca,
      nomeProduto: item.nomeProduto, nomeFornecedor: item.nomeFornecedor,
      quantidade: item.quantidade, precoUnitarioEmKwanza: item.precoUnitarioEmKwanza,
      fotoUrl: item.fotoUrl, urlProduto: item.urlProduto, urlLoja: item.urlLoja,
      variantes: item.selecaoVariante, origem: item.origem, adicionadoEm: item.criadoEm
    })),
    subtotalEmKwanza: carrinho.itens.reduce((total, item) => total + item.quantidade * item.precoUnitarioEmKwanza, 0),
    quantidadeItens: carrinho.itens.reduce((total, item) => total + item.quantidade, 0)
  };
}

/**
 * RF-053–RF-055, RF-064, RF-067, RF-070–RF-072
 * Checkout multi-loja e repasses financeiros
 */
export const moduloCheckoutUnificado: ModuloHttp = {
  nome: "checkout-unificado",
  descricao: "Checkout multi-loja, compra unificada, repasses financeiros e reembolsos.",
  registrar(app, contexto) {

    // --- Endpoints públicos (comprador Market) ---

    app.get("/publico/market/carrinho", async (request, reply) => {
      const acesso = await resolverContaAutenticada(contexto, request);
      const carrinho = await contexto.carrinhoCommerce.obter(acesso?.conta.id ?? null, obterTokenCarrinho(request));
      if (!carrinho) return reply.code(404).send({ erro: "CARRINHO_NAO_ENCONTRADO" });
      return { carrinho: formatarCarrinho(carrinho) };
    });

    app.post("/publico/market/carrinho/sincronizar", async (request, reply) => {
      const acesso = await resolverContaAutenticada(contexto, request);
      const dados = SincronizarCarrinhoSchema.parse(request.body ?? {});
      const contextoSmartLink = await contexto.smartLinksCommerce.obterContexto(
        obterTokenSessaoCommerce(request),
        acesso?.conta.id ?? null
      );
      const resultado = await contexto.carrinhoCommerce.sincronizar({
        contaBizyId: acesso?.conta.id ?? null,
        sessaoCommerceId: contextoSmartLink?.sessao.id ?? null,
        token: obterTokenCarrinho(request),
        itens: dados.itens.map((item) => {
          const atribuicaoSmartLink = contextoSmartLink?.atribuicao;
          const correspondeAoSmartLink = Boolean(atribuicaoSmartLink && (
            !contextoSmartLink.toque?.codigoProduto || contextoSmartLink.toque.codigoProduto === item.codigoPeca.toUpperCase()
          ));
          return {
            ...item,
            origem: correspondeAoSmartLink ? "smart-link" : item.origem,
            atribuicao: correspondeAoSmartLink ? atribuicaoSmartLink ?? undefined : item.atribuicao
          };
        }),
        modo: dados.modo
      });
      await Promise.all(resultado.carrinho.itens.map((item) =>
        contexto.lojaPublica.registrarEventoPublico(item.slugLoja, {
          tipo: "ADD_TO_CART",
          entidadeTipo: "CARRINHO_COMMERCE",
          entidadeId: resultado.carrinho.id,
          codigoProduto: item.codigoPeca,
          trackingId: contextoSmartLink?.sessao.trackingId ?? null,
          origem: item.origem,
          metadata: {
            idempotencyKey: `cart:${resultado.carrinho.id}:${item.chaveItem}`,
            sessaoCommerceId: contextoSmartLink?.sessao.id ?? null,
            quantidade: item.quantidade
          }
        }).catch(() => undefined)
      ));
      return reply.code(200).send({ carrinho: formatarCarrinho(resultado.carrinho), token: resultado.token });
    });

    app.delete("/publico/market/carrinho", async (request, reply) => {
      const acesso = await resolverContaAutenticada(contexto, request);
      const carrinho = await contexto.carrinhoCommerce.limpar(acesso?.conta.id ?? null, obterTokenCarrinho(request));
      if (!carrinho) return reply.code(404).send({ erro: "CARRINHO_NAO_ENCONTRADO" });
      return { carrinho: formatarCarrinho(carrinho) };
    });

    app.post("/publico/market/checkout/cotacao", async (request, reply) => {
      const dados = CotarCheckoutSchema.parse(request.body ?? {});
      const slugs = [...new Set(dados.itens.map((item) => item.slugLoja))];
      const mapa = new Map<string, string>();
      for (const slug of slugs) {
        const negocio = await contexto.repositorios.autenticacao.buscarNegocioPorSlugPublico(slug);
        if (!negocio) return reply.code(404).send({ erro: "LOJA_NAO_ENCONTRADA" });
        mapa.set(slug, negocio.id);
      }
      try {
        return await contexto.checkoutUnificado.cotarCheckout({
          itens: dados.itens.map((item) => ({ negocioId: mapa.get(item.slugLoja)!, codigoPeca: item.codigoPeca, varianteSelecionada: item.varianteSelecionada, quantidade: item.quantidade })),
          entrega: dados.entrega,
          enderecoEntrega: [dados.entrega.endereco, dados.entrega.bairro, dados.entrega.municipio, dados.entrega.provincia].filter(Boolean).join(", ")
        });
      } catch (erro) {
        return reply.code(409).send({ erro: erro instanceof Error ? erro.message : "COTACAO_INVALIDA" });
      }
    });

    app.post("/publico/market/checkout", async (request, reply) => {
      const chaves = JSON.stringify(request.body ?? {}).toLowerCase();
      if (/"(pan|cvv|cvc|cardnumber|numero_cartao|n[uú]mero_cart[aã]o)"\s*:/.test(chaves)) {
        return reply.code(400).send({ erro: "DADOS_CARTAO_PROIBIDOS", mensagem: "O Bizy aceita apenas referência tokenizada do provedor e nunca recebe PAN ou CVV." });
      }
      const dados = CriarCompraUnificadaSchema.parse(request.body ?? {});
      const acessoConta = await resolverContaAutenticada(contexto, request);
      const contextoSmartLink = await contexto.smartLinksCommerce.obterContexto(
        obterTokenSessaoCommerce(request),
        acessoConta?.conta.id ?? null
      );
      const compradorTelefone = contexto.autenticacaoTelefone.normalizarTelefoneOuFalhar(dados.compradorTelefone);

      let carrinho = dados.carrinhoId
        ? await contexto.carrinhoCommerce.obterPorIdAutorizado(dados.carrinhoId, acessoConta?.conta.id ?? null, obterTokenCarrinho(request))
        : null;
      if (dados.carrinhoId && !carrinho) {
        const existente = dados.idempotencyKey
          ? await contexto.repositorios.comprasUnificadas.buscarPorIdempotencyKey(dados.idempotencyKey, compradorTelefone)
          : null;
        if (existente?.carrinhoId === dados.carrinhoId) {
          const repetida = await contexto.checkoutUnificado.criarCompraUnificada({
            ...dados, compradorTelefone, contaBizyId: acessoConta?.conta.id ?? null, itens: []
          });
          await contexto.atribuicaoCommerce.registrarConversoesCompra({
            compra: repetida.compra,
            pedidosFilho: repetida.pedidosFilho,
            contaBizyId: acessoConta?.conta.id ?? repetida.compra.contaBizyId,
            sessaoCommerceId: contextoSmartLink?.sessao.id ?? repetida.compra.sessaoCommerceId,
            trackingId: contextoSmartLink?.sessao.trackingId ?? null
          });
          return reply.code(201).send({ ...formatarCompraPublica(repetida), acessoCompra: repetida.acessoCompra });
        }
        return reply.code(404).send({ erro: "CARRINHO_NAO_ENCONTRADO" });
      }
      if (carrinho && carrinho.itens.length === 0) return reply.code(400).send({ erro: "CARRINHO_VAZIO" });

      if (carrinho) {
        carrinho = (await contexto.carrinhoCommerce.sincronizar({
          contaBizyId: acessoConta?.conta.id ?? null,
          sessaoCommerceId: contextoSmartLink?.sessao.id ?? carrinho.sessaoCommerceId,
          token: obterTokenCarrinho(request),
          modo: "SUBSTITUIR",
          itens: carrinho.itens.map((item) => ({
            slugLoja: item.slugLoja, codigoPeca: item.codigoPeca,
            varianteSelecionada: item.selecaoVariante, quantidade: item.quantidade,
            origem: item.origem, atribuicao: item.atribuicao
          }))
        })).carrinho;
      }

      const itensCheckout = carrinho
        ? carrinho.itens.map((item) => ({ slugLoja: item.slugLoja, codigoPeca: item.codigoPeca, varianteSelecionada: item.selecaoVariante, quantidade: item.quantidade }))
        : dados.itens;

      // Resolver slugLoja → negocioId para cada item
      const slugsUnicos = [...new Set(itensCheckout.map((i) => i.slugLoja))];
      const mapaSlugs = new Map<string, string>();
      for (const slug of slugsUnicos) {
        const negocio = await contexto.repositorios.autenticacao.buscarNegocioPorSlugPublico(slug);
        if (!negocio) return reply.code(404).send({ erro: `Loja "${slug}" não encontrada.` });
        mapaSlugs.set(slug, negocio.id);
      }

      const itensResolvidos = itensCheckout.map((item) => ({
        negocioId: mapaSlugs.get(item.slugLoja)!,
        codigoPeca: item.codigoPeca,
        varianteSelecionada: item.varianteSelecionada,
        quantidade: item.quantidade
      }));

      const entidadeCheckoutId = carrinho?.id ?? dados.idempotencyKey ?? request.id;
      await Promise.all(slugsUnicos.flatMap((slug) => [
        contexto.lojaPublica.registrarEventoPublico(slug, {
          tipo: "CHECKOUT_STARTED",
          entidadeTipo: "CHECKOUT",
          entidadeId: entidadeCheckoutId,
          trackingId: contextoSmartLink?.sessao.trackingId ?? null,
          origem: contextoSmartLink ? "smart-link" : "market",
          metadata: { idempotencyKey: `checkout:${entidadeCheckoutId}:${slug}` }
        }).catch(() => undefined),
        contexto.lojaPublica.registrarEventoPublico(slug, {
          tipo: "BUYER_IDENTIFIED",
          entidadeTipo: "CHECKOUT",
          entidadeId: entidadeCheckoutId,
          trackingId: contextoSmartLink?.sessao.trackingId ?? null,
          origem: acessoConta ? "conta-bizy" : "guest",
          metadata: {
            idempotencyKey: `buyer:${entidadeCheckoutId}:${slug}`,
            contaAutenticada: Boolean(acessoConta)
          }
        }).catch(() => undefined)
      ]));

      let resultado;
      try {
        resultado = await contexto.checkoutUnificado.criarCompraUnificada({
          ...dados,
          compradorTelefone,
          contaBizyId: acessoConta?.conta.id ?? null,
          sessaoCommerceId: contextoSmartLink?.sessao.id ?? carrinho?.sessaoCommerceId ?? null,
          itens: itensResolvidos
        });
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : "CHECKOUT_INVALIDO";
        const estado = /não encontrad|NAO_ENCONTRAD/i.test(mensagem) ? 404
          : /variante|quantidade|stock/i.test(mensagem) ? 400
          : 409;
        return reply.code(estado).send({ erro: mensagem });
      }
      const codigosProdutoPorNegocio = new Map<string, string[]>();
      for (const item of itensResolvidos) {
        const codigos = codigosProdutoPorNegocio.get(item.negocioId) ?? [];
        codigos.push(item.codigoPeca);
        codigosProdutoPorNegocio.set(item.negocioId, codigos);
      }
      await contexto.atribuicaoCommerce.registrarConversoesCompra({
        compra: resultado.compra,
        pedidosFilho: resultado.pedidosFilho,
        contaBizyId: acessoConta?.conta.id ?? null,
        sessaoCommerceId: contextoSmartLink?.sessao.id ?? carrinho?.sessaoCommerceId ?? null,
        trackingId: contextoSmartLink?.sessao.trackingId ?? null,
        codigosProdutoPorNegocio
      });
      await Promise.all(resultado.pedidosFilho.map(async (filho) => {
        const eventos = [
          registrarEventoMarketCheckout(contexto, filho.negocioId, "CHECKOUT_CRIADO", "COMPRA", resultado.compra.id, {
            compraId: resultado.compra.id,
            numero: resultado.compra.numero,
            pedidoId: filho.pedidoId,
            totalEmKwanza: filho.totalEmKwanza,
            origem: resultado.compra.origem
          }),
          registrarEventoMarketCheckout(contexto, filho.negocioId, "PEDIDO_FILHO_CRIADO", "PEDIDO", filho.pedidoId, {
            compraId: resultado.compra.id,
            pedidoFilhoId: filho.id,
            pedidoId: filho.pedidoId,
            estado: filho.estado,
            estadoPagamento: filho.estadoPagamento,
            estadoEntrega: filho.estadoEntrega,
            totalEmKwanza: filho.totalEmKwanza
          })
        ];
        if (dados.entrega?.tipo === "ENTREGA" || filho.taxaEntregaEmKwanza > 0) {
          eventos.push(registrarEventoMarketCheckout(contexto, filho.negocioId, "ENTREGA_SOLICITADA", "PEDIDO", filho.pedidoId, {
            compraId: resultado.compra.id,
            pedidoFilhoId: filho.id,
            pedidoId: filho.pedidoId,
            taxaEntregaEmKwanza: filho.taxaEntregaEmKwanza,
            entrega: dados.entrega ?? null,
            enderecoEntrega: dados.enderecoEntrega ?? null
          }));
        }
        const repasses = await contexto.repassesFinanceiros.listarRepasses(filho.negocioId, {
          pedidoId: filho.pedidoId,
          limite: 1
        });
        const repasse = repasses[0];
        if (repasse) {
          eventos.push(registrarEventoMarketCheckout(contexto, filho.negocioId, "PAYOUT_PENDENTE_CRIADO", "REPASSE", repasse.id, {
            repasseId: repasse.id,
            compraId: resultado.compra.id,
            pedidoId: filho.pedidoId,
            valorBrutoEmKwanza: repasse.valorBrutoEmKwanza,
            valorProdutosEmKwanza: repasse.valorProdutosEmKwanza,
            valorEntregaEmKwanza: repasse.valorEntregaEmKwanza,
            impostosEmKwanza: repasse.impostosEmKwanza,
            valorLiquidoEmKwanza: repasse.valorLiquidoEmKwanza,
            valorDisponivelEmKwanza: repasse.valorDisponivelEmKwanza,
            taxaBizyEmKwanza: repasse.taxaBizyEmKwanza,
            comissaoEmKwanza: repasse.comissaoEmKwanza,
            retencaoEmKwanza: repasse.retencaoEmKwanza,
            motivoRetencao: repasse.motivoRetencao,
            retidoAte: repasse.retidoAte,
            politicaCalculoVersao: repasse.politicaCalculoVersao,
            estado: repasse.estado
          }));
        }
        await Promise.all(eventos);
      }));
      return reply.code(201).send({
        ...formatarCompraPublica(resultado),
        acessoCompra: resultado.acessoCompra
      });
    });

    app.get("/conta/comprador/compras", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const compras = await contexto.checkoutUnificado.buscarPortalCompradorConta(acesso.conta.id);
      return { compras: compras.map(formatarCompraPublica), total: compras.length };
    });

    app.get("/publico/market/compras/:id", async (request, reply) => {
      const { id } = ParamIdSchema.parse(request.params);
      const acesso = await resolverContaAutenticada(contexto, request);
      const compra = acesso
        ? (await contexto.checkoutUnificado.buscarPortalCompradorConta(acesso.conta.id, id))[0] ?? null
        : await contexto.checkoutUnificado.buscarCompraGuest(id, obterTokenCompra(request));
      if (!compra) return reply.code(404).send({ erro: "Compra não encontrada." });
      return formatarCompraPublica(compra);
    });

    app.post("/publico/market/compras/:id/pagamento", { bodyLimit: 14_100_000 }, async (request, reply) => {
      const { id } = ParamIdSchema.parse(request.params);
      const { ficheiroDataUrl } = RegistrarComprovativoUnificadoSchema.parse(request.body ?? {});
      const acesso = await resolverContaAutenticada(contexto, request);
      const permitida = acesso
        ? (await contexto.checkoutUnificado.buscarPortalCompradorConta(acesso.conta.id, id))[0] ?? null
        : await contexto.checkoutUnificado.buscarCompraGuest(id, obterTokenCompra(request));
      if (!permitida) return reply.code(404).send({ erro: "Compra não encontrada." });
      let comprovativoUrl: string;
      try {
        const media = await salvarMediaDataUrl(ficheiroDataUrl, {
          purpose: "comprovativos-pagamento",
          allowDocuments: true,
          maxBytes: 10 * 1024 * 1024,
          maxImageDimension: 1800,
          scanner: criarScannerMedia()
        });
        comprovativoUrl = media.url;
      } catch (erro) {
        return reply.code(400).send({
          erro: "COMPROVATIVO_INVALIDO",
          mensagem: erro instanceof Error ? erro.message : "Comprovativo inválido."
        });
      }
      const compra = await contexto.checkoutUnificado.registrarComprovativoPagamentoUnificado(id, comprovativoUrl);
      if (!compra) return reply.code(404).send({ erro: "Compra não encontrada." });
      const estadoAtualizado = await contexto.checkoutUnificado.buscarCompraComEstados(id);
      if (!estadoAtualizado) return reply.code(404).send({ erro: "Compra não encontrada." });
      await Promise.all(estadoAtualizado.pedidosFilho.map((filho) => registrarEventoMarketCheckout(
        contexto,
        filho.negocioId,
        "PAGAMENTO_COMPROVATIVO_RECEBIDO",
        "PEDIDO",
        filho.pedidoId,
        {
          compraId: estadoAtualizado.compra.id,
          pedidoFilhoId: filho.id,
          pedidoId: filho.pedidoId,
          estadoPagamento: filho.estadoPagamento,
          comprovativoUrl
        }
      )));
      return formatarCompraPublica(estadoAtualizado);
    });

    app.get("/publico/market/compras/:id/comprovativo", async (request, reply) => {
      const { id } = ParamIdSchema.parse(request.params);
      const acesso = await resolverContaAutenticada(contexto, request);
      const permitida = acesso
        ? (await contexto.checkoutUnificado.buscarPortalCompradorConta(acesso.conta.id, id))[0] ?? null
        : await contexto.checkoutUnificado.buscarCompraGuest(id, obterTokenCompra(request));
      const url = permitida?.compra.comprovativoPagamentoUrl;
      if (!url) return reply.code(404).send({ erro: "COMPROVATIVO_NAO_ENCONTRADO" });
      const media = await resolverFicheiroMedia(url).catch(() => null);
      if (!media) return reply.code(404).send({ erro: "COMPROVATIVO_NAO_ENCONTRADO" });
      reply.header("Content-Type", media.mimeType);
      reply.header("Cache-Control", "private, no-store");
      reply.header("Content-Disposition", "inline");
      return reply.send(media.stream);
    });

    // --- Endpoints fornecedor (loja) ---

    app.get("/market/fornecedor/portal", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler", modulo: "market",
        mensagemPermissao: "Sem permissão para ver o portal seller.", mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      return contexto.checkoutUnificado.buscarPortalSeller(ctx.negocio.id);
    });

    app.get("/market/fornecedor/compras/:compraId/atribuicao", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler", modulo: "market",
        mensagemPermissao: "Sem permissão para consultar atribuição.", mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = ParamCompraIdSchema.parse(request.params);
      const pedido = await contexto.checkoutUnificado.buscarVistaFornecedor(compraId, ctx.negocio.id);
      if (!pedido) return reply.code(404).send({ erro: "COMPRA_NAO_ENCONTRADA" });
      const conversoes = await contexto.atribuicaoCommerce.listarConversoesCompra(compraId);
      const autorizadas = conversoes.filter((conversao) => conversao.negocioId === ctx.negocio.id);
      return { conversoes: autorizadas, total: autorizadas.length };
    });

    app.get("/market/fornecedor/governanca", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler", modulo: "market",
        mensagemPermissao: "Sem permissão para ver a governança Market.", mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      return {
        pagamentos: { escopoPciReduzido: true, aceitaSomenteTokenOuReferenciaProvider: true, dadosProibidos: ["PAN", "CVV", "CVC", "credencial de cartão"] },
        eventos: { schema: "bizy.market.event.v1", reprocessavelPor: ["seller", "pedido", "compraUnificada"], assinaturaExterna: "HMAC-SHA256 quando webhook externo estiver configurado" },
        slos: { checkoutP95Ms: 2500, criacaoPedidoFilhoP95Ms: 1500, uploadComprovativoP95Ms: 3000, notificacaoP95Segundos: 60, payoutConciliacaoHoras: 24, primeiraRespostaDisputaHoras: 24 },
        portal: { dadosMinimos: true, mobileFirst: true, lowData: true },
        atualizadoEm: new Date().toISOString()
      };
    });

    app.patch("/market/fornecedor/compras/:compraId/fulfillment", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir", modulo: "market",
        mensagemPermissao: "Sem permissão para gerir fulfillment.", mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = z.object({ compraId: z.string().uuid() }).parse(request.params);
      const dados = z.object({
        estadoEntrega: z.enum(["PENDENTE", "RETIRADA_LOJA", "EM_PREPARACAO", "PRONTO", "ENVIADO", "ENTREGUE", "FALHOU", "DEVOLVIDO"]).optional(),
        estadoSeparacao: z.enum(["PENDENTE", "EM_SEPARACAO", "SEPARADO"]).optional(),
        estadoEmbalagem: z.enum(["PENDENTE", "EM_EMBALAGEM", "EMBALADO"]).optional(),
        provaEntregaUrl: z.string().url().max(2000).nullable().optional(),
        motivoAtraso: z.string().trim().max(500).nullable().optional(),
        estadoDevolucao: z.enum(["SOLICITADA", "EM_TRANSITO", "RECEBIDA", "REJEITADA"]).nullable().optional(),
        tentativaFalhada: z.boolean().optional(),
        motivo: z.string().trim().min(3).max(500)
      }).parse(request.body ?? {});
      const resultado = await contexto.checkoutUnificado.atualizarFulfillmentSeller(compraId, ctx.negocio.id, ctx.usuario.id, dados);
      if (!resultado) return reply.code(404).send({ erro: "Pedido seller não encontrado." });
      return resultado;
    });

    app.get("/market/fornecedor/compras/:compraId", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:ler",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver compras Market.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = request.params as { compraId: string };
      return contexto.checkoutUnificado.buscarVistaFornecedor(compraId, ctx.negocio.id);
    });

    app.get("/market/fornecedor/compras/:compraId/comprovativo", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir", modulo: "market",
        mensagemPermissao: "Sem permissão para consultar comprovativos.", mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = ParamCompraIdSchema.parse(request.params);
      const pedido = await contexto.checkoutUnificado.buscarVistaFornecedor(compraId, ctx.negocio.id);
      const compra = pedido ? await contexto.checkoutUnificado.buscarCompraComEstados(compraId) : null;
      const url = compra?.compra.comprovativoPagamentoUrl;
      if (!url) return reply.code(404).send({ erro: "COMPROVATIVO_NAO_ENCONTRADO" });
      const media = await resolverFicheiroMedia(url).catch(() => null);
      if (!media) return reply.code(404).send({ erro: "COMPROVATIVO_NAO_ENCONTRADO" });
      reply.header("Content-Type", media.mimeType);
      reply.header("Cache-Control", "private, no-store");
      return reply.send(media.stream);
    });

    app.post("/market/fornecedor/compras/:compraId/cancelar", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para cancelar pedidos Market.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { compraId } = request.params as { compraId: string };
      const { motivo } = (request.body ?? {}) as { motivo: string };
      if (!motivo?.trim()) return reply.code(400).send({ erro: "Motivo obrigatório." });
      const compra = await contexto.checkoutUnificado.cancelarPedidoFilho(compraId, ctx.negocio.id, motivo);
      if (!compra) return reply.code(404).send({ erro: "COMPRA_NAO_ENCONTRADA", mensagem: "Compra Market não encontrada para esta loja." });
      await registrarEventoMarketCheckout(contexto, ctx.negocio.id, "PEDIDO_FILHO_CANCELADO", "COMPRA", compraId, {
        compraId,
        motivo,
        canceladoPorId: ctx.usuario.id
      });
      return compra;
    });

    // --- Repasses financeiros (loja) ---

    app.get("/market/fornecedor/repasses", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver repasses financeiros.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { estado, pedidoId, limite } = request.query as { estado?: string; pedidoId?: string; limite?: string };
      return contexto.repassesFinanceiros.listarRepasses(ctx.negocio.id, {
        estado: estado as any,
        pedidoId,
        limite: limite ? Number(limite) : undefined
      });
    });

    app.get("/market/fornecedor/resumo-financeiro", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver resumo financeiro.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      return contexto.repassesFinanceiros.resumoFinanceiroLoja(ctx.negocio.id);
    });

    // --- Reembolsos ---

    app.post("/market/reembolsos", async (request, reply) => {
      const dados = SolicitarReembolsoSchema.parse(request.body ?? {});
      const reembolso = await contexto.checkoutUnificado.solicitarReembolso(dados);
      await registrarEventoMarketCheckout(contexto, dados.negocioId, "REEMBOLSO_SOLICITADO", "PEDIDO", dados.pedidoId, {
        reembolsoId: reembolso.id,
        pedidoId: reembolso.pedidoId,
        compraUnificadaId: reembolso.compraUnificadaId,
        tipo: reembolso.tipo,
        valorEmKwanza: reembolso.valorEmKwanza
      });
      return reply.code(201).send(reembolso);
    });

    app.get("/market/fornecedor/reembolsos", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "market",
        mensagemPermissao: "Sem permissão para ver reembolsos.",
        mensagemModulo: "Market desativado para este negócio."
      });
      if (!ctx) return;
      const { pedidoId, estado, limite } = request.query as { pedidoId?: string; estado?: string; limite?: string };
      return contexto.repassesFinanceiros.listarReembolsos(ctx.negocio.id, {
        pedidoId,
        estado: estado as any,
        limite: limite ? Number(limite) : undefined
      });
    });
  }
};

async function registrarEventoMarketCheckout(
  contexto: Parameters<ModuloHttp["registrar"]>[1],
  negocioId: string,
  tipo: string,
  entidadeTipo: string,
  entidadeId: string,
  payload: Record<string, unknown>
) {
  return contexto.repositorios.eventosOperacionais.registrar({
    negocioId,
    topico: TOPICO_MARKET,
    tipo,
    entidadeTipo,
    entidadeId,
    idempotencyKey: `market:${tipo}:${entidadeId}`,
    payloadVersion: "market.checkout.v1",
    payload: { schema: "bizy.market.event.v1", ...payload },
    estado: "PROCESSADO"
  });
}
