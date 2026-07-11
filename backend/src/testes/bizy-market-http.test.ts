import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome }
  });
  expect(respostaCodigo.statusCode).toBe(202);

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });
  expect(respostaSessao.statusCode).toBe(200);

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarProdutoMarket(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: {
    codigo: string;
    nome: string;
    categoria?: string | null;
    colecao?: string | null;
    descricao?: string;
    fotos?: string[];
    precoEmKwanza?: number;
    quantidade?: number;
  }
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo: dados.codigo,
      sku: `SKU-${dados.codigo}`,
      nome: dados.nome,
      descricao: dados.descricao ?? `${dados.nome} no Bizy Market`,
      precoEmKwanza: dados.precoEmKwanza ?? 18_000,
      custoEmKwanza: 9_000,
      quantidade: dados.quantidade ?? 4,
      stockMinimo: 1,
      categoria: dados.categoria ?? "Roupas",
      colecao: dados.colecao ?? "Novidades",
      fotos: dados.fotos ?? [`https://example.com/${dados.codigo}.png`],
      variantes: { tamanho: ["M", "G"] },
      vitrine: { selos: ["DESTAQUE"], prioridade: 1 }
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function publicarLojaMarket(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: {
    slug: string;
    nomeComercial: string;
    provincia: string;
    municipio: string;
  }
) {
  const resposta = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers,
    payload: {
      slug: dados.slug,
      descricaoPublica: `${dados.nomeComercial} no Bizy Market.`,
      publicada: true
    }
  });
  expect(resposta.statusCode).toBe(200);
  return resposta.json();
}

describe("Bizy Market público HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...ambienteOriginal };
  });

  it("lista produtos elegíveis de lojas publicadas com filtros e fornecedor sanitizado", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923610001", "Loja Market A");
      const lojaB = await autenticar(app, "923610002", "Loja Market B");
      const lojaNaoPublicada = await autenticar(app, "923610003", "Loja Fora do Market");

      await criarProdutoMarket(app, lojaA, {
        codigo: "VESTIDO-1",
        nome: "Vestido verde fluido",
        categoria: "Roupas",
        colecao: "Vestidos"
      });
      await criarProdutoMarket(app, lojaA, {
        codigo: "SEM-FOTO",
        nome: "Vestido sem foto",
        categoria: "Roupas",
        fotos: []
      });
      await criarProdutoMarket(app, lojaB, {
        codigo: "SAPATO-1",
        nome: "Sapato social",
        categoria: "Calçado"
      });
      await criarProdutoMarket(app, lojaNaoPublicada, {
        codigo: "VESTIDO-2",
        nome: "Vestido de loja não publicada",
        categoria: "Roupas"
      });

      await publicarLojaMarket(app, lojaA, {
        slug: "loja-market-a",
        nomeComercial: "Loja Market A",
        provincia: "Luanda",
        municipio: "Talatona"
      });
      await publicarLojaMarket(app, lojaB, {
        slug: "loja-market-b",
        nomeComercial: "Loja Market B",
        provincia: "Benguela",
        municipio: "Lobito"
      });

      const resposta = await app.inject({
        method: "GET",
        url: "/publico/market/produtos?categoria=Roupas&busca=vestido&limite=10"
      });

      expect(resposta.statusCode).toBe(200);
      const corpo = resposta.json();
      expect(corpo.filtros).toEqual({ busca: "vestido", categoria: "Roupas", limite: 10 });
      expect(corpo.categorias).toEqual([{ categoria: "Roupas", total: 1 }]);
      expect(corpo.produtos).toHaveLength(1);
      expect(corpo.produtos[0]).toEqual(
        expect.objectContaining({
          codigo: "VESTIDO-1",
          nome: "Vestido verde fluido",
          categoria: "Roupas",
          precoEmKwanza: 18_000,
          urlProduto: "/lojas/loja-market-a/produtos/VESTIDO-1",
          urlLoja: "/lojas/loja-market-a",
          loja: expect.objectContaining({
            slug: "loja-market-a",
            nomeComercial: expect.stringContaining("Loja Market A"),
            descricaoPublica: "Loja Market A no Bizy Market."
          })
        })
      );

      const paginaProdutos = await app.inject({
        method: "GET",
        url: "/publico/market/produtos?limite=1&offset=1"
      });
      expect(paginaProdutos.statusCode).toBe(200);
      expect(paginaProdutos.json().produtos).toHaveLength(1);
      expect(paginaProdutos.json().total).toBe(2);
      expect(paginaProdutos.json().filtros).toEqual({ offset: 1, limite: 1 });
      expect(paginaProdutos.json().paginacao).toEqual({
        total: 2,
        limite: 1,
        offset: 1,
        temProxima: false,
        temAnterior: true,
        proximoOffset: null,
        anteriorOffset: 0
      });

      expect(JSON.stringify(corpo)).not.toContain("negocioId");
      expect(JSON.stringify(corpo)).not.toContain("custoEmKwanza");
      expect(JSON.stringify(corpo)).not.toContain("margemEstimadaEmKwanza");
      expect(JSON.stringify(corpo)).not.toContain("Loja Fora do Market");
      expect(JSON.stringify(corpo)).not.toContain("SEM-FOTO");
    } finally {
      await app.close();
    }
  }, 30_000);

  it("expõe categorias, detalhe, similares e controla publicação no Market pelo Team", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923610011", "Loja Market Studio A");
      const lojaB = await autenticar(app, "923610012", "Loja Market Studio B");

      await criarProdutoMarket(app, lojaA, {
        codigo: "VESTIDO-DETALHE",
        nome: "Vestido verde premium",
        categoria: "Roupas",
        colecao: "Vestidos",
        precoEmKwanza: 22_000
      });
      await criarProdutoMarket(app, lojaB, {
        codigo: "VESTIDO-SIMILAR",
        nome: "Vestido verde de outro fornecedor",
        categoria: "Roupas",
        colecao: "Vestidos",
        precoEmKwanza: 24_000
      });
      await criarProdutoMarket(app, lojaB, {
        codigo: "SAPATO-MARKET",
        nome: "Sapato social market",
        categoria: "Calçado",
        precoEmKwanza: 30_000
      });

      await publicarLojaMarket(app, lojaA, {
        slug: "loja-market-studio-a",
        nomeComercial: "Loja Market Studio A",
        provincia: "Luanda",
        municipio: "Talatona"
      });
      await publicarLojaMarket(app, lojaB, {
        slug: "loja-market-studio-b",
        nomeComercial: "Loja Market Studio B",
        provincia: "Luanda",
        municipio: "Viana"
      });

      const categorias = await app.inject({
        method: "GET",
        url: "/publico/market/categorias"
      });
      expect(categorias.statusCode).toBe(200);
      expect(categorias.json().categorias).toEqual([
        expect.objectContaining({ categoria: "Roupas", total: 2, url: "/market/categorias/Roupas" }),
        expect.objectContaining({ categoria: "Calçado", total: 1, url: "/market/categorias/Cal%C3%A7ado" })
      ]);

      const detalhe = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE"
      });
      expect(detalhe.statusCode).toBe(200);
      expect(detalhe.json()).toEqual(
        expect.objectContaining({
          produto: expect.objectContaining({
            codigo: "VESTIDO-DETALHE",
            nome: "Vestido verde premium",
            loja: expect.objectContaining({ slug: "loja-market-studio-a" })
          }),
          similares: [
            expect.objectContaining({
              codigo: "VESTIDO-SIMILAR",
              loja: expect.objectContaining({ slug: "loja-market-studio-b" })
            })
          ]
        })
      );
      expect(JSON.stringify(detalhe.json())).not.toContain("custoEmKwanza");

      const similares = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE/similares?limite=5"
      });
      expect(similares.statusCode).toBe(200);
      expect(similares.json().produtos).toEqual([
        expect.objectContaining({ codigo: "VESTIDO-SIMILAR" })
      ]);

      const similaresDaLoja = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-market-studio-a/produtos/VESTIDO-DETALHE/similares?limite=5"
      });
      expect(similaresDaLoja.statusCode).toBe(200);
      expect(similaresDaLoja.json()).toEqual(
        expect.objectContaining({
          produtoOrigem: expect.objectContaining({
            codigo: "VESTIDO-DETALHE",
            loja: expect.objectContaining({ slug: "loja-market-studio-a" })
          }),
          produtos: [
            expect.objectContaining({
              codigo: "VESTIDO-SIMILAR",
              loja: expect.objectContaining({ slug: "loja-market-studio-b" })
            })
          ]
        })
      );

      const resumo = await app.inject({
        method: "GET",
        url: "/team/loja/market/resumo",
        headers: lojaA
      });
      expect(resumo.statusCode).toBe(200);
      expect(resumo.json()).toEqual(
        expect.objectContaining({
          loja: expect.objectContaining({ slug: "loja-market-studio-a", publicada: true }),
          produtos: expect.objectContaining({
            total: 1,
            publicados: 1,
            elegiveis: 1,
            comPendencias: 0
          }),
          seller: expect.objectContaining({
            estado: expect.any(String),
            pendencias: expect.arrayContaining([
              "Informar NIF ou identificação fiscal.",
              "Informar IBAN para repasses."
            ])
          })
        })
      );

      const seller = await app.inject({
        method: "PUT",
        url: "/team/loja/seller/onboarding",
        headers: lojaA,
        payload: {
          estado: "EM_REVISAO",
          motivo: "Documentação inicial validada no teste.",
          documentos: {
            nif: "5000000000",
            iban: "AO06000600000000000000000",
            termoAceiteEm: "2026-07-10T10:00:00.000Z"
          },
          verificacao: {
            responsavelNome: "Gestor Market",
            responsavelTelefone: "923000999"
          }
        }
      });
      expect(seller.statusCode).toBe(200);
      expect(seller.json().seller).toEqual(
        expect.objectContaining({
          estado: "APROVADO",
          elegivel: true,
          documentos: expect.objectContaining({ nif: "5000000000" }),
          pendencias: []
        })
      );

      const checklist = await app.inject({
        method: "GET",
        url: "/team/loja/catalogo/checklist",
        headers: lojaA
      });
      expect(checklist.statusCode).toBe(200);
      expect(checklist.json()).toEqual(
        expect.objectContaining({
          checklist: expect.arrayContaining([
            expect.objectContaining({ codigo: "seller", ok: true }),
            expect.objectContaining({ codigo: "catalogo", ok: true })
          ]),
          produtos: expect.arrayContaining([
            expect.objectContaining({
              codigo: "VESTIDO-DETALHE",
              checks: expect.arrayContaining([
                expect.objectContaining({ codigo: "imagem", ok: true }),
                expect.objectContaining({ codigo: "publicacao", ok: true })
              ])
            })
          ]),
          metricas: expect.objectContaining({
            totalProdutos: 1,
            produtosElegiveis: 1,
            produtosPublicados: 1
          })
        })
      );

      const contaSeller = await app.inject({
        method: "GET",
        url: "/team/loja/seller/conta",
        headers: lojaA
      });
      expect(contaSeller.statusCode).toBe(200);
      expect(contaSeller.json()).toEqual(
        expect.objectContaining({
          saldos: expect.objectContaining({
            disponivelEmKwanza: expect.any(Number),
            retidoEmKwanza: expect.any(Number)
          }),
          disputas: expect.objectContaining({ abertas: 0 })
        })
      );

      const disputa = await app.inject({
        method: "POST",
        url: "/team/loja/disputas",
        headers: lojaA,
        payload: {
          entidadeTipo: "PRODUTO",
          entidadeId: "VESTIDO-DETALHE",
          motivo: "Cliente contestou prova de entrega.",
          descricao: "Disputa criada para validar fluxo Trust & Safety do seller."
        }
      });
      expect(disputa.statusCode).toBe(201);
      expect(disputa.json().disputa).toEqual(
        expect.objectContaining({
          entidadeTipo: "PRODUTO",
          entidadeId: "VESTIDO-DETALHE",
          estado: "PENDENTE"
        })
      );

      const trustSafety = await app.inject({
        method: "GET",
        url: "/team/loja/trust-safety/fila",
        headers: lojaA
      });
      expect(trustSafety.statusCode).toBe(200);
      expect(trustSafety.json().metricas.abertos).toBe(1);

      const decisaoDisputa = await app.inject({
        method: "PATCH",
        url: `/team/loja/disputas/${disputa.json().disputa.id}/decisao`,
        headers: lojaA,
        payload: {
          estado: "RESOLVIDA",
          acao: "DEVOLUCAO",
          resolucao: "Devolução aprovada com evidência de entrega validada.",
          evidencias: ["https://example.com/evidencia-entrega.png"],
          valorEmKwanza: 22_000
        }
      });
      expect(decisaoDisputa.statusCode).toBe(200);
      expect(decisaoDisputa.json().disputa).toEqual(
        expect.objectContaining({
          id: disputa.json().disputa.id,
          estado: "RESOLVIDA",
          resolucao: "Devolução aprovada com evidência de entrega validada."
        })
      );

      const casoPosVenda = await app.inject({
        method: "POST",
        url: "/team/loja/pos-venda/casos",
        headers: lojaA,
        payload: {
          tipo: "DEVOLUCAO",
          pedidoId: "PEDIDO-MARKET-DEV-001",
          produtoCodigo: "VESTIDO-DETALHE",
          motivo: "Cliente devolveu dentro da política publicada.",
          descricao: "Caso pós-venda criado para validar devolução formal com SLA e evidência.",
          evidencias: ["https://example.com/devolucao.png"],
          prazoRespostaEm: "2026-07-15T10:00:00.000Z",
          responsavelId: "gestor-market-001",
          valorEmKwanza: 22_000
        }
      });
      expect(casoPosVenda.statusCode).toBe(201);
      expect(casoPosVenda.json()).toEqual(
        expect.objectContaining({
          caso: expect.objectContaining({
            entidadeTipo: "PRODUTO",
            entidadeId: "VESTIDO-DETALHE",
            estado: "PENDENTE"
          }),
          evento: expect.objectContaining({ tipo: "POS_VENDA_DEVOLUCAO_ABERTO" })
        })
      );

      const checkoutMarket = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: {
          compradorTelefone: "923777001",
          compradorNome: "Cliente Market Checkout",
          itens: [
            { slugLoja: "loja-market-studio-a", codigoPeca: "VESTIDO-DETALHE", quantidade: 1 }
          ],
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Maianga",
            endereco: "Rua de teste 123"
          },
          metodoPagamento: "Pagamento manual",
          origem: "teste-market-eventos"
        }
      });
      expect(checkoutMarket.statusCode).toBe(201);
      const pedidoCheckoutId = checkoutMarket.json().pedidosFilho[0].pedidoId as string;

      const portalComprador = await app.inject({
        method: "GET",
        url: "/publico/market/portal-comprador?identificador=923777001"
      });
      expect(portalComprador.statusCode).toBe(200);
      expect(portalComprador.json().compras).toEqual(expect.arrayContaining([
        expect.objectContaining({ compra: expect.objectContaining({ id: checkoutMarket.json().compra.id }) })
      ]));

      const portalSeller = await app.inject({ method: "GET", url: "/market/fornecedor/portal", headers: lojaA });
      expect(portalSeller.statusCode).toBe(200);
      expect(portalSeller.json().pedidos).toEqual(expect.arrayContaining([
        expect.objectContaining({ pedido: expect.objectContaining({ pedidoId: pedidoCheckoutId }) })
      ]));

      const fulfillment = await app.inject({
        method: "PATCH",
        url: `/market/fornecedor/compras/${checkoutMarket.json().compra.id}/fulfillment`,
        headers: lojaA,
        payload: { estadoSeparacao: "SEPARADO", estadoEmbalagem: "EMBALADO", estadoEntrega: "ENVIADO", motivo: "Pedido preparado no teste." }
      });
      expect(fulfillment.statusCode).toBe(200);
      expect(fulfillment.json()).toEqual(expect.objectContaining({ estadoSeparacao: "SEPARADO", estadoEmbalagem: "EMBALADO", estadoEntrega: "ENVIADO" }));

      const repassesCheckout = await app.inject({
        method: "GET",
        url: `/team/loja/repasses?pedidoId=${pedidoCheckoutId}`,
        headers: lojaA
      });
      expect(repassesCheckout.statusCode).toBe(200);
      expect(repassesCheckout.json()).toEqual([
        expect.objectContaining({
          pedidoId: pedidoCheckoutId,
          valorProdutosEmKwanza: 22_000,
          impostosEmKwanza: 3_080,
          taxaBizyEmKwanza: 1_100,
          valorBrutoEmKwanza: 25_080,
          valorLiquidoEmKwanza: 23_980,
          valorDisponivelEmKwanza: 0,
          retencaoEmKwanza: 23_980,
          estado: "RETIDO",
          motivoRetencao: "JANELA_RISCO_PAYOUT",
          politicaCalculoVersao: "market.split.v1"
        })
      ]);

      const comprovativoCheckout = await app.inject({
        method: "POST",
        url: `/publico/market/compras/${checkoutMarket.json().compra.id}/pagamento`,
        payload: { comprovativoUrl: "https://example.com/comprovativo-market.png", identificador: "923777001" }
      });
      expect(comprovativoCheckout.statusCode).toBe(200);

      const checkoutComPan = await app.inject({
        method: "POST",
        url: "/publico/market/checkout",
        payload: { compradorTelefone: "923777001", pan: "4111111111111111", cvv: "123", itens: [{ slugLoja: "loja-market-studio-a", codigoPeca: "VESTIDO-DETALHE", quantidade: 1 }] }
      });
      expect(checkoutComPan.statusCode).toBe(400);
      expect(checkoutComPan.json().erro).toBe("DADOS_CARTAO_PROIBIDOS");

      const reembolso = await app.inject({
        method: "POST",
        url: "/team/loja/reembolsos",
        headers: lojaA,
        payload: {
          pedidoId: pedidoCheckoutId,
          compraUnificadaId: checkoutMarket.json().compra.id,
          tipo: "PARCIAL",
          valorEmKwanza: 5000,
          motivo: "Ajuste comercial validado pelo seller."
        }
      });
      expect(reembolso.statusCode).toBe(201);
      expect(reembolso.json().reembolso).toEqual(
        expect.objectContaining({
          negocioId: expect.any(String),
          pedidoId: pedidoCheckoutId,
          estado: "PENDENTE",
          valorEmKwanza: 5000
        })
      );

      const reembolsos = await app.inject({
        method: "GET",
        url: `/team/loja/reembolsos?pedidoId=${pedidoCheckoutId}`,
        headers: lojaA
      });
      expect(reembolsos.statusCode).toBe(200);
      expect(reembolsos.json().reembolsos).toEqual([
        expect.objectContaining({ pedidoId: pedidoCheckoutId, estado: "PENDENTE" })
      ]);

      const repasseComHoldReembolso = await app.inject({
        method: "GET",
        url: `/team/loja/repasses?pedidoId=${pedidoCheckoutId}`,
        headers: lojaA
      });
      expect(repasseComHoldReembolso.json()[0]).toEqual(expect.objectContaining({
        estado: "RETIDO",
        retencaoEmKwanza: 5_000,
        valorDisponivelEmKwanza: 18_980,
        motivoRetencao: expect.stringContaining("REEMBOLSO_")
      }));

      const eventosMarket = await app.inject({
        method: "GET",
        url: "/team/loja/eventos-market",
        headers: lojaA
      });
      expect(eventosMarket.statusCode).toBe(200);
      expect(eventosMarket.json().metricas).toEqual(
        expect.objectContaining({
          onboarding: 1,
          disputas: 2,
          reembolsos: 1,
          entregas: 1,
          payouts: 1
        })
      );
      expect(eventosMarket.json().eventos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tipo: "POS_VENDA_DEVOLUCAO_ABERTO" }),
          expect.objectContaining({ tipo: "CHECKOUT_CRIADO" }),
          expect.objectContaining({ tipo: "PEDIDO_FILHO_CRIADO" }),
          expect.objectContaining({ tipo: "ENTREGA_SOLICITADA" }),
          expect.objectContaining({ tipo: "PAYOUT_PENDENTE_CRIADO" }),
          expect.objectContaining({ tipo: "PAGAMENTO_COMPROVATIVO_RECEBIDO" })
        ])
      );

      const despublicar = await app.inject({
        method: "PUT",
        url: "/team/loja/produtos/VESTIDO-DETALHE/publicacao",
        headers: lojaA,
        payload: { publicado: false }
      });
      expect(despublicar.statusCode).toBe(200);
      expect(despublicar.json().produto.vitrine.publicacaoMarket).toEqual(
        expect.objectContaining({ publicado: false, origem: "team" })
      );

      const detalheDespublicado = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE"
      });
      expect(detalheDespublicado.statusCode).toBe(404);

      const publicarMassa = await app.inject({
        method: "PUT",
        url: "/crm/loja/produtos/publicacao-em-massa",
        headers: lojaA,
        payload: { codigos: ["VESTIDO-DETALHE"], publicado: true }
      });
      expect(publicarMassa.statusCode).toBe(200);
      expect(publicarMassa.json()).toEqual(
        expect.objectContaining({
          totalSolicitado: 1,
          atualizados: 1
        })
      );

      const detalheRepublicado = await app.inject({
        method: "GET",
        url: "/publico/market/produtos/VESTIDO-DETALHE"
      });
      expect(detalheRepublicado.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  }, 30_000);
});
