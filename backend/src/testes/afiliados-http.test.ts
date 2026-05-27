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

async function criarProduto(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      sku: `SKU-${codigo}`,
      nome: `Produto ${codigo}`,
      descricao: `Produto ${codigo} para afiliado`,
      precoEmKwanza: 12_500,
      custoEmKwanza: 7_500,
      quantidade: 10,
      stockMinimo: 1,
      categoria: "Roupas",
      colecao: "Afiliados",
      variantes: { tamanho: ["M", "G"] },
      fotos: [`https://example.com/${codigo}.png`]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function prepararPedidoAfiliado(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  opcoes: { telefoneLoja: string; slug: string; codigoProduto: string; codigoAfiliado: string; codigoLink: string }
) {
  const loja = await autenticar(app, opcoes.telefoneLoja, `Loja ${opcoes.codigoAfiliado}`);

  await criarProduto(app, loja, opcoes.codigoProduto);

  const publicacao = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers: loja,
    payload: {
      slug: opcoes.slug,
      descricaoPublica: "Produtos para venda com criadores.",
      publicada: true
    }
  });
  expect(publicacao.statusCode).toBe(200);

  const afiliado = await app.inject({
    method: "POST",
    url: "/afiliados",
    headers: loja,
    payload: {
      tipo: "AFILIADO",
      codigo: opcoes.codigoAfiliado,
      nomePublico: `Parceiro ${opcoes.codigoAfiliado}`,
      contacto: "923700001",
      metodoPagamento: { iban: "AO06000000000000000000000" },
      regraComissao: {
        tipo: "PERCENTUAL",
        percentual: 10
      }
    }
  });
  expect(afiliado.statusCode).toBe(201);

  const link = await app.inject({
    method: "POST",
    url: `/afiliados/${afiliado.json().id}/links`,
    headers: loja,
    payload: {
      codigo: opcoes.codigoLink,
      destinoTipo: "PRODUTO",
      slugLoja: opcoes.slug,
      codigoProduto: opcoes.codigoProduto,
      canal: "tiktok",
      origemConteudo: "video-look-01"
    }
  });
  expect(link.statusCode).toBe(201);

  const checkout = await app.inject({
    method: "POST",
    url: `/publico/lojas/${opcoes.slug}/checkout`,
    payload: {
      cliente: {
        nome: `Cliente ${opcoes.codigoAfiliado}`,
        telefone: "923700009",
        consentimentoDados: true,
        consentimentoMarketing: false
      },
      itens: [{ codigoPeca: opcoes.codigoProduto, quantidade: 2 }],
      entrega: {
        tipo: "RETIRADA"
      },
      referencia: opcoes.codigoLink,
      trackingId: `trk-${opcoes.codigoAfiliado}`,
      origem: "bio-tiktok"
    }
  });
  expect(checkout.statusCode).toBe(201);

  return { loja, afiliado: afiliado.json(), link: link.json(), checkout: checkout.json() };
}

async function criarCheckoutAfiliado(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  opcoes: {
    slug: string;
    codigoProduto: string;
    codigoLink: string;
    nomeCliente: string;
    telefoneCliente: string;
    trackingId: string;
  }
) {
  const checkout = await app.inject({
    method: "POST",
    url: `/publico/lojas/${opcoes.slug}/checkout`,
    payload: {
      cliente: {
        nome: opcoes.nomeCliente,
        telefone: opcoes.telefoneCliente,
        consentimentoDados: true,
        consentimentoMarketing: false
      },
      itens: [{ codigoPeca: opcoes.codigoProduto, quantidade: 2 }],
      entrega: {
        tipo: "RETIRADA"
      },
      referencia: opcoes.codigoLink,
      trackingId: opcoes.trackingId,
      origem: "bio-tiktok"
    }
  });
  expect(checkout.statusCode).toBe(201);
  return checkout.json();
}

describe("afiliados, criadores e comissões HTTP", () => {
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

  it("cria afiliado, gera link próprio e confirma comissão apenas após pagamento do pedido atribuído", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923600001", "Loja Afiliados");

      await criarProduto(app, loja, "AF1");

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-afiliados",
          descricaoPublica: "Produtos para venda com criadores.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const afiliado = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "AFILIADO",
          codigo: "ana",
          nomePublico: "Ana Vendas",
          contacto: "923700001",
          metodoPagamento: { iban: "AO06000000000000000000000" },
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 10
          }
        }
      });
      expect(afiliado.statusCode).toBe(201);
      expect(afiliado.json()).toEqual(
        expect.objectContaining({
          codigo: "ANA",
          nomePublico: "Ana Vendas",
          estado: "ATIVO"
        })
      );
      expect(afiliado.json().regraComissao).toEqual({ tipo: "PERCENTUAL", percentual: 10 });

      const link = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliado.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "ANA-AF1",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-afiliados",
          codigoProduto: "AF1",
          canal: "tiktok",
          origemConteudo: "video-look-01"
        }
      });
      expect(link.statusCode).toBe(201);
      expect(link.json()).toEqual(
        expect.objectContaining({
          codigo: "ANA-AF1",
          afiliadoId: afiliado.json().id,
          codigoProduto: "AF1",
          ativo: true,
          urlPublica: expect.stringContaining("ref=ANA-AF1")
        })
      );

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-afiliados/checkout",
        payload: {
          cliente: {
            nome: "Cliente da Ana",
            telefone: "923700009",
            consentimentoDados: true,
            consentimentoMarketing: false
          },
          itens: [{ codigoPeca: "AF1", quantidade: 2 }],
          entrega: {
            tipo: "RETIRADA"
          },
          referencia: "ANA-AF1",
          trackingId: "trk-ana-1",
          origem: "bio-tiktok"
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json()).toEqual(
        expect.objectContaining({
          origem: "afiliado:ANA",
          canal: "tiktok",
          subtotalEmKwanza: 25_000,
          taxaEntregaEmKwanza: 0,
          totalEmKwanza: 25_000
        })
      );

      const comissoesEstimadas = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesEstimadas.statusCode).toBe(200);
      expect(comissoesEstimadas.json().comissoes).toEqual([
        expect.objectContaining({
          afiliadoId: afiliado.json().id,
          pedidoId: checkout.json().pedido.id,
          linkId: link.json().id,
          status: "ESTIMADA",
          baseEmKwanza: 25_000,
          valorEmKwanza: 2_500
        })
      ]);

      const confirmarPagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${checkout.json().pedido.id}/confirmar-pagamento`,
        headers: loja,
        payload: {
          observacao: "Pago por transferência"
        }
      });
      expect(confirmarPagamento.statusCode).toBe(200);

      const comissoesConfirmadas = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesConfirmadas.statusCode).toBe(200);
      expect(comissoesConfirmadas.json().comissoes[0]).toEqual(
        expect.objectContaining({
          status: "CONFIRMADA",
          confirmadoEm: expect.any(String)
        })
      );

      const resumo = await app.inject({
        method: "GET",
        url: "/afiliados/resumo",
        headers: loja
      });
      expect(resumo.statusCode).toBe(200);
      expect(resumo.json()).toEqual(
        expect.objectContaining({
          totalParceiros: 1,
          totalLinks: 1,
          pedidosAtribuidos: 1,
          comissaoEstimadaEmKwanza: 0,
          comissaoConfirmadaEmKwanza: 2_500,
          comissaoPendenteEmKwanza: 2_500,
          receitaAtribuidaEmKwanza: 25_000
        })
      );
      expect(resumo.json().ranking[0]).toEqual(
        expect.objectContaining({
          afiliadoId: afiliado.json().id,
          nomePublico: "Ana Vendas",
          pedidos: 1,
          pedidosPagos: 1,
          receitaAtribuidaEmKwanza: 25_000,
          ticketMedioEmKwanza: 25_000,
          comissaoConfirmadaEmKwanza: 2_500,
          comissaoPendenteEmKwanza: 2_500
        })
      );
    } finally {
      await app.close();
    }
  });

  it("cria link de campanha com contexto comercial para vendedor, post social e live", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923600061", "Loja Campanhas Afiliadas");

      const afiliado = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "maya-camp",
          nomePublico: "Maya Campanhas",
          contacto: "923700061",
          metodoPagamento: { iban: "AO06000000000000000000061" },
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 8
          }
        }
      });
      expect(afiliado.statusCode).toBe(201);

      const link = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliado.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "MAYA-CAMP-01",
          destinoTipo: "CAMPANHA",
          destinoId: "campanha-inverno-2026",
          slugLoja: "loja-maya",
          canal: "instagram",
          origemConteudo: "reel-look-inverno",
          metadata: {
            vendedorId: "vend-ana",
            postSocialId: "ig-post-991",
            liveId: "live-maio-01",
            utmSource: "instagram",
            utmCampaign: "inverno-2026"
          }
        }
      });

      expect(link.statusCode).toBe(201);
      expect(link.json()).toEqual(
        expect.objectContaining({
          codigo: "MAYA-CAMP-01",
          destinoTipo: "CAMPANHA",
          destinoId: "campanha-inverno-2026",
          metadata: expect.objectContaining({
            vendedorId: "vend-ana",
            postSocialId: "ig-post-991",
            liveId: "live-maio-01",
            utmCampaign: "inverno-2026"
          }),
          urlPublica: expect.stringContaining("campanha=campanha-inverno-2026")
        })
      );
      expect(link.json().urlPublica).toContain("vendedor=vend-ana");
      expect(link.json().urlPublica).toContain("post=ig-post-991");
      expect(link.json().urlPublica).toContain("live=live-maio-01");

      const publico = await app.inject({
        method: "GET",
        url: "/publico/links/MAYA-CAMP-01"
      });
      expect(publico.statusCode).toBe(200);
      expect(publico.json().destino).toEqual(
        expect.objectContaining({
          tipo: "CAMPANHA",
          destinoId: "campanha-inverno-2026",
          canal: "instagram",
          origemConteudo: "reel-look-inverno",
          metadata: expect.objectContaining({
            vendedorId: "vend-ana",
            postSocialId: "ig-post-991",
            liveId: "live-maio-01"
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("preserva atribuição de afiliado no checkout por WhatsApp antes de existir pedido", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923600099", "Loja WhatsApp Afiliado");
      await criarProduto(app, loja, "WAF1");

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-whatsapp-afiliado",
          descricaoPublica: "Produtos vendidos também por WhatsApp.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const afiliado = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "ana-wa",
          nomePublico: "Ana WhatsApp",
          contacto: "923700099",
          metodoPagamento: { iban: "AO06000000000000000000000" },
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 12
          }
        }
      });
      expect(afiliado.statusCode).toBe(201);

      const link = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliado.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "ANA-WA-LINK",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-whatsapp-afiliado",
          codigoProduto: "WAF1",
          canal: "instagram",
          origemConteudo: "stories-maio"
        }
      });
      expect(link.statusCode).toBe(201);

      const whatsapp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-whatsapp-afiliado/produtos/WAF1/whatsapp",
        payload: {
          quantidade: 1,
          variante: { tamanho: "M" },
          trackingId: "trk-whatsapp-afiliado",
          origem: "bio-instagram",
          referencia: "ANA-WA-LINK"
        }
      });

      expect(whatsapp.statusCode).toBe(200);
      expect(whatsapp.json()).toEqual(
        expect.objectContaining({
          origem: "afiliado:ANA-WA",
          atribuicao: expect.objectContaining({
            principal: expect.objectContaining({
              codigoParceiro: "ANA-WA",
              codigoLink: "ANA-WA-LINK"
            })
          }),
          whatsappUrl: expect.stringContaining("wa.me")
        })
      );
      expect(whatsapp.json().mensagem).toContain("Origem: afiliado:ANA-WA");
      expect(whatsapp.json().mensagem).toContain("Referência: ANA-WA-LINK");

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: loja
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json().porOrigem).toEqual(
        expect.objectContaining({
          "afiliado:ANA-WA": 1
        })
      );
    } finally {
      await app.close();
    }
  });

  it("aplica regra de comissão específica por produto antes da regra geral do parceiro", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923600199", "Loja Comissão Produto");
      await criarProduto(app, loja, "CP1");

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-comissao-produto",
          descricaoPublica: "Produtos com comissão específica.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const afiliado = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "AFILIADO",
          codigo: "bia-prod",
          nomePublico: "Bia Produto",
          contacto: "923800199",
          metodoPagamento: { iban: "AO06000000000000000000000" },
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 5,
            produtos: [
              {
                codigoProduto: "CP1",
                tipo: "PERCENTUAL",
                percentual: 20
              }
            ]
          }
        }
      });
      expect(afiliado.statusCode).toBe(201);
      expect(afiliado.json().regraComissao).toEqual(
        expect.objectContaining({
          percentual: 5,
          produtos: [
            expect.objectContaining({
              codigoProduto: "CP1",
              percentual: 20
            })
          ]
        })
      );

      const link = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliado.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "BIA-CP1",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-comissao-produto",
          codigoProduto: "CP1",
          canal: "instagram",
          origemConteudo: "reels-produto"
        }
      });
      expect(link.statusCode).toBe(201);

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-comissao-produto/checkout",
        payload: {
          cliente: {
            nome: "Cliente Produto",
            telefone: "923810199",
            consentimentoDados: true,
            consentimentoMarketing: false
          },
          itens: [{ codigoPeca: "CP1", quantidade: 2 }],
          entrega: { tipo: "RETIRADA" },
          referencia: "BIA-CP1",
          trackingId: "trk-bia-produto",
          origem: "reels-instagram"
        }
      });
      expect(checkout.statusCode).toBe(201);

      const comissoes = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoes.statusCode).toBe(200);
      expect(comissoes.json().comissoes).toEqual([
        expect.objectContaining({
          afiliadoId: afiliado.json().id,
          pedidoId: checkout.json().pedido.id,
          baseEmKwanza: 25_000,
          valorEmKwanza: 5_000
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("aplica modelo de atribuição configurável e permite ajuste manual auditado", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923700210", "Loja Atribuição");
      await criarProduto(app, loja, "ATR-1");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja Atribuição",
          segmento: "moda",
          tipo: "LOJA",
          entrega: {
            atribuicao: {
              modeloPadrao: "PRIMEIRO_TOQUE",
              janelaDias: 30
            }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-atribuicao",
          descricaoPublica: "Loja para atribuição avançada.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const afiliadoPrimeiro = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "CRIADORA-A",
          nomePublico: "Criadora A",
          contacto: "923700211",
          regraComissao: { tipo: "PERCENTUAL", percentual: 10 }
        }
      });
      expect(afiliadoPrimeiro.statusCode).toBe(201);

      const afiliadoUltimo = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "AFILIADO",
          codigo: "AFILIADO-B",
          nomePublico: "Afiliado B",
          contacto: "923700212",
          regraComissao: { tipo: "PERCENTUAL", percentual: 12 }
        }
      });
      expect(afiliadoUltimo.statusCode).toBe(201);

      const linkPrimeiro = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliadoPrimeiro.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "LINK-A",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-atribuicao",
          codigoProduto: "ATR-1",
          canal: "instagram",
          origemConteudo: "reels-1"
        }
      });
      expect(linkPrimeiro.statusCode).toBe(201);

      const linkUltimo = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliadoUltimo.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "LINK-B",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-atribuicao",
          codigoProduto: "ATR-1",
          canal: "tiktok",
          origemConteudo: "live-2"
        }
      });
      expect(linkUltimo.statusCode).toBe(201);

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-atribuicao/checkout",
        payload: {
          cliente: {
            nome: "Cliente Atribuição",
            telefone: "923700219",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "ATR-1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" },
          referencia: "LINK-B",
          referenciasAssistidas: [
            { codigo: "LINK-A", capturadoEm: new Date().toISOString() },
            { codigo: "LINK-B", capturadoEm: new Date().toISOString() }
          ],
          trackingId: "trk-atribuicao-1",
          origem: "bio-social"
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json()).toEqual(
        expect.objectContaining({
          origem: "afiliado:CRIADORA-A",
          atribuicao: expect.objectContaining({
            modelo: "PRIMEIRO_TOQUE",
            janelaDias: 30,
            principal: expect.objectContaining({
              codigoParceiro: "CRIADORA-A",
              codigoLink: "LINK-A"
            }),
            assistencias: expect.arrayContaining([
              expect.objectContaining({ codigoParceiro: "AFILIADO-B", codigoLink: "LINK-B" })
            ])
          })
        })
      );

      const comissoesPrimeiroToque = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesPrimeiroToque.statusCode).toBe(200);
      expect(comissoesPrimeiroToque.json().comissoes).toEqual([
        expect.objectContaining({
          afiliadoId: afiliadoPrimeiro.json().id,
          linkId: linkPrimeiro.json().id,
          pedidoId: checkout.json().pedido.id
        })
      ]);

      const ajuste = await app.inject({
        method: "POST",
        url: "/afiliados/atribuicoes/manual",
        headers: loja,
        payload: {
          pedidoId: checkout.json().pedido.id,
          referencia: "LINK-B",
          motivo: "Cliente confirmou que comprou pela live do afiliado B."
        }
      });
      expect(ajuste.statusCode).toBe(200);
      expect(ajuste.json().comissao).toEqual(
        expect.objectContaining({
          afiliadoId: afiliadoUltimo.json().id,
          linkId: linkUltimo.json().id,
          pedidoId: checkout.json().pedido.id,
          motivo: expect.stringContaining("Cliente confirmou")
        })
      );

      const auditoria = await app.inject({
        method: "GET",
        url: `/afiliados/comissoes/${ajuste.json().comissao.id}/auditoria`,
        headers: loja
      });
      expect(auditoria.statusCode).toBe(200);
      expect(auditoria.json().eventos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "ATUALIZADA",
            motivo: expect.stringContaining("Ajuste manual de atribuição")
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("respeita janela de atribuição definida no link de campanha antes da janela geral do negócio", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923700310", "Loja Janela Campanha");
      await criarProduto(app, loja, "ATR-CAMP");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja Janela Campanha",
          segmento: "moda",
          tipo: "LOJA",
          entrega: {
            atribuicao: {
              modeloPadrao: "PRIMEIRO_TOQUE",
              janelaDias: 30
            }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-janela-campanha",
          descricaoPublica: "Loja com campanhas de janela própria.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const criadorCampanhaCurta = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "CAMP-CURTA",
          nomePublico: "Campanha Curta",
          contacto: "923700311",
          regraComissao: { tipo: "PERCENTUAL", percentual: 8 }
        }
      });
      expect(criadorCampanhaCurta.statusCode).toBe(201);

      const criadorCampanhaValida = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "CAMP-VALIDA",
          nomePublico: "Campanha Válida",
          contacto: "923700312",
          regraComissao: { tipo: "PERCENTUAL", percentual: 12 }
        }
      });
      expect(criadorCampanhaValida.statusCode).toBe(201);

      const linkCurto = await app.inject({
        method: "POST",
        url: `/afiliados/${criadorCampanhaCurta.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "LINK-CURTO",
          destinoTipo: "CAMPANHA",
          destinoId: "campanha-24h",
          slugLoja: "loja-janela-campanha",
          codigoProduto: "ATR-CAMP",
          canal: "instagram",
          origemConteudo: "story-24h",
          metadata: {
            janelaAtribuicaoDias: 1
          }
        }
      });
      expect(linkCurto.statusCode).toBe(201);

      const linkValido = await app.inject({
        method: "POST",
        url: `/afiliados/${criadorCampanhaValida.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "LINK-VALIDO",
          destinoTipo: "CAMPANHA",
          destinoId: "campanha-30d",
          slugLoja: "loja-janela-campanha",
          codigoProduto: "ATR-CAMP",
          canal: "tiktok",
          origemConteudo: "live-30d"
        }
      });
      expect(linkValido.statusCode).toBe(201);

      const cincoDiasAtras = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-janela-campanha/checkout",
        payload: {
          cliente: {
            nome: "Cliente Janela",
            telefone: "923700319",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "ATR-CAMP", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" },
          referencia: "LINK-VALIDO",
          referenciasAssistidas: [
            { codigo: "LINK-CURTO", capturadoEm: cincoDiasAtras },
            { codigo: "LINK-VALIDO", capturadoEm: cincoDiasAtras }
          ],
          trackingId: "trk-janela-campanha",
          origem: "campanha-social"
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json().atribuicao.principal).toEqual(
        expect.objectContaining({
          codigoParceiro: "CAMP-VALIDA",
          codigoLink: "LINK-VALIDO"
        })
      );

      const comissoes = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoes.statusCode).toBe(200);
      expect(comissoes.json().comissoes).toEqual([
        expect.objectContaining({
          afiliadoId: criadorCampanhaValida.json().id,
          linkId: linkValido.json().id
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("reverte comissão confirmada quando pedido atribuído é cancelado", async () => {
    const app = await criarAplicacao();

    try {
      const { loja, checkout } = await prepararPedidoAfiliado(app, {
        telefoneLoja: "923600101",
        slug: "loja-afiliados-cancelamento",
        codigoProduto: "AF2",
        codigoAfiliado: "bia",
        codigoLink: "BIA-AF2"
      });

      const confirmarPagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${checkout.pedido.id}/confirmar-pagamento`,
        headers: loja,
        payload: {
          observacao: "Pago antes do cancelamento"
        }
      });
      expect(confirmarPagamento.statusCode).toBe(200);

      const cancelarPedido = await app.inject({
        method: "PATCH",
        url: `/pedidos/${checkout.pedido.id}/estado`,
        headers: loja,
        payload: {
          estado: "CANCELADO",
          observacao: "Cliente desistiu antes da entrega"
        }
      });
      expect(cancelarPedido.statusCode).toBe(200);

      const comissoes = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoes.statusCode).toBe(200);
      expect(comissoes.json().comissoes[0]).toEqual(
        expect.objectContaining({
          pedidoId: checkout.pedido.id,
          status: "REVERTIDA",
          motivo: expect.stringContaining("CANCELADO"),
          revertidoEm: expect.any(String)
        })
      );

      const resumo = await app.inject({
        method: "GET",
        url: "/afiliados/resumo",
        headers: loja
      });
      expect(resumo.statusCode).toBe(200);
      expect(resumo.json()).toEqual(
        expect.objectContaining({
          comissaoConfirmadaEmKwanza: 0,
          comissaoEstimadaEmKwanza: 0,
          comissaoRevertidaEmKwanza: 2_500
        })
      );
    } finally {
      await app.close();
    }
  });

  it("reverte comissão confirmada quando pedido atribuído é reembolsado", async () => {
    const app = await criarAplicacao();

    try {
      const { loja, checkout } = await prepararPedidoAfiliado(app, {
        telefoneLoja: "923600103",
        slug: "loja-afiliados-reembolso",
        codigoProduto: "AF4",
        codigoAfiliado: "dri",
        codigoLink: "DRI-AF4"
      });

      const confirmarPagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${checkout.pedido.id}/confirmar-pagamento`,
        headers: loja,
        payload: {
          observacao: "Pago antes do reembolso"
        }
      });
      expect(confirmarPagamento.statusCode).toBe(200);

      const reembolsarPedido = await app.inject({
        method: "PATCH",
        url: `/pedidos/${checkout.pedido.id}/estado`,
        headers: loja,
        payload: {
          estadoPagamento: "REEMBOLSADO",
          observacao: "Cliente recebeu reembolso integral"
        }
      });
      expect(reembolsarPedido.statusCode).toBe(200);

      const comissoes = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoes.statusCode).toBe(200);
      expect(comissoes.json().comissoes[0]).toEqual(
        expect.objectContaining({
          pedidoId: checkout.pedido.id,
          status: "REVERTIDA",
          motivo: expect.stringContaining("REEMBOLSADO"),
          revertidoEm: expect.any(String)
        })
      );
    } finally {
      await app.close();
    }
  });

  it("marca comissão confirmada como paga com referência operacional", async () => {
    const app = await criarAplicacao();

    try {
      const { loja, checkout } = await prepararPedidoAfiliado(app, {
        telefoneLoja: "923600102",
        slug: "loja-afiliados-pagamento",
        codigoProduto: "AF3",
        codigoAfiliado: "cai",
        codigoLink: "CAI-AF3"
      });

      const confirmarPagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${checkout.pedido.id}/confirmar-pagamento`,
        headers: loja,
        payload: {
          observacao: "Pago por transferência"
        }
      });
      expect(confirmarPagamento.statusCode).toBe(200);

      const comissoesConfirmadas = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesConfirmadas.statusCode).toBe(200);
      const comissaoId = comissoesConfirmadas.json().comissoes[0].id;

      const pagarComissao = await app.inject({
        method: "POST",
        url: `/afiliados/comissoes/${comissaoId}/pagar`,
        headers: loja,
        payload: {
          referenciaPagamento: "LOTE-AFILIADOS-001",
          observacao: "Transferência enviada para o IBAN cadastrado"
        }
      });
      expect(pagarComissao.statusCode).toBe(200);
      expect(pagarComissao.json()).toEqual(
        expect.objectContaining({
          id: comissaoId,
          status: "PAGA",
          referenciaPagamento: "LOTE-AFILIADOS-001",
          observacaoPagamento: "Transferência enviada para o IBAN cadastrado",
          pagoEm: expect.any(String)
        })
      );

      const auditoria = await app.inject({
        method: "GET",
        url: `/afiliados/comissoes/${comissaoId}/auditoria`,
        headers: loja
      });
      expect(auditoria.statusCode).toBe(200);
      expect(auditoria.json().eventos.map((evento: { tipo: string }) => evento.tipo)).toEqual([
        "PAGA",
        "CONFIRMADA",
        "CRIADA"
      ]);
      expect(auditoria.json().eventos[0]).toEqual(
        expect.objectContaining({
          tipo: "PAGA",
          statusAnterior: "CONFIRMADA",
          statusNovo: "PAGA",
          valorEmKwanza: 2_500,
          referencia: "LOTE-AFILIADOS-001",
          autorNome: "Loja cai"
        })
      );

      const resumo = await app.inject({
        method: "GET",
        url: "/afiliados/resumo",
        headers: loja
      });
      expect(resumo.statusCode).toBe(200);
      expect(resumo.json()).toEqual(
        expect.objectContaining({
          comissaoConfirmadaEmKwanza: 0,
          comissaoPagaEmKwanza: 2_500
        })
      );
    } finally {
      await app.close();
    }
  });

  it("paga comissões confirmadas em lote com total, itens e auditoria", async () => {
    const app = await criarAplicacao();

    try {
      const { loja, checkout } = await prepararPedidoAfiliado(app, {
        telefoneLoja: "923600104",
        slug: "loja-afiliados-lote",
        codigoProduto: "AF5",
        codigoAfiliado: "eve",
        codigoLink: "EVE-AF5"
      });
      const checkoutDois = await criarCheckoutAfiliado(app, {
        slug: "loja-afiliados-lote",
        codigoProduto: "AF5",
        codigoLink: "EVE-AF5",
        nomeCliente: "Cliente lote dois",
        telefoneCliente: "923700010",
        trackingId: "trk-eve-2"
      });

      for (const pedidoId of [checkout.pedido.id, checkoutDois.pedido.id]) {
        const confirmarPagamento = await app.inject({
          method: "POST",
          url: `/pedidos/${pedidoId}/confirmar-pagamento`,
          headers: loja,
          payload: {
            observacao: "Pago para lote financeiro"
          }
        });
        expect(confirmarPagamento.statusCode).toBe(200);
      }

      const comissoesConfirmadas = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesConfirmadas.statusCode).toBe(200);
      const comissaoIds = comissoesConfirmadas.json().comissoes.map((comissao: { id: string }) => comissao.id);
      expect(comissaoIds).toHaveLength(2);

      const pagarLote = await app.inject({
        method: "POST",
        url: "/afiliados/comissoes/lotes-pagamento",
        headers: loja,
        payload: {
          comissaoIds,
          referenciaPagamento: "LOTE-MAIO-CRIADORES-001",
          observacao: "Pagamento quinzenal de criadores",
          periodoInicio: "2026-05-01T00:00:00.000Z",
          periodoFim: "2026-05-15T23:59:59.000Z"
        }
      });
      expect(pagarLote.statusCode).toBe(201);
      expect(pagarLote.json()).toEqual(
        expect.objectContaining({
          status: "PAGO",
          referenciaPagamento: "LOTE-MAIO-CRIADORES-001",
          quantidadeComissoes: 2,
          valorTotalEmKwanza: 5_000,
          autorNome: "Loja eve"
        })
      );
      expect(pagarLote.json().itens).toHaveLength(2);

      const comissoesPagas = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesPagas.statusCode).toBe(200);
      expect(comissoesPagas.json().comissoes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: "PAGA", lotePagamentoId: pagarLote.json().id }),
          expect.objectContaining({ status: "PAGA", lotePagamentoId: pagarLote.json().id })
        ])
      );

      const lotes = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes/lotes-pagamento",
        headers: loja
      });
      expect(lotes.statusCode).toBe(200);
      expect(lotes.json().lotes[0]).toEqual(
        expect.objectContaining({
          id: pagarLote.json().id,
          quantidadeComissoes: 2,
          valorTotalEmKwanza: 5_000
        })
      );
    } finally {
      await app.close();
    }
  });

  it("resume saldo financeiro por afiliado e exporta lotes de comissão em CSV", async () => {
    const app = await criarAplicacao();

    try {
      const { loja, checkout } = await prepararPedidoAfiliado(app, {
        telefoneLoja: "923600105",
        slug: "loja-afiliados-financeiro",
        codigoProduto: "AF6",
        codigoAfiliado: "financeiro",
        codigoLink: "FIN-AF6"
      });
      const checkoutDois = await criarCheckoutAfiliado(app, {
        slug: "loja-afiliados-financeiro",
        codigoProduto: "AF6",
        codigoLink: "FIN-AF6",
        nomeCliente: "Cliente saldo dois",
        telefoneCliente: "923700011",
        trackingId: "trk-fin-2"
      });

      for (const pedidoId of [checkout.pedido.id, checkoutDois.pedido.id]) {
        const confirmarPagamento = await app.inject({
          method: "POST",
          url: `/pedidos/${pedidoId}/confirmar-pagamento`,
          headers: loja,
          payload: {
            observacao: "Pago para relatório financeiro"
          }
        });
        expect(confirmarPagamento.statusCode).toBe(200);
      }

      const comissoesConfirmadas = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes",
        headers: loja
      });
      expect(comissoesConfirmadas.statusCode).toBe(200);
      const comissaoIds = comissoesConfirmadas.json().comissoes.map((comissao: { id: string }) => comissao.id);

      const pagarLote = await app.inject({
        method: "POST",
        url: "/afiliados/comissoes/lotes-pagamento",
        headers: loja,
        payload: {
          comissaoIds,
          referenciaPagamento: "LOTE-FINANCEIRO-001",
          observacao: "Fecho financeiro de criadores",
          periodoInicio: "2026-05-16T00:00:00.000Z",
          periodoFim: "2026-05-31T23:59:59.000Z"
        }
      });
      expect(pagarLote.statusCode).toBe(201);

      const saldos = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes/saldos",
        headers: loja
      });
      expect(saldos.statusCode).toBe(200);
      expect(saldos.json().totais).toEqual(
        expect.objectContaining({
          comissaoPagaEmKwanza: 5_000,
          saldoPendenteEmKwanza: 0,
          totalLotesPagos: 1
        })
      );
      expect(saldos.json().saldos[0]).toEqual(
        expect.objectContaining({
          codigo: "FINANCEIRO",
          nomePublico: "Parceiro financeiro",
          quantidadeComissoesPagas: 2,
          comissaoPagaEmKwanza: 5_000,
          saldoPendenteEmKwanza: 0,
          lotesPagos: 1
        })
      );

      const csv = await app.inject({
        method: "GET",
        url: "/afiliados/comissoes/lotes-pagamento/exportar.csv",
        headers: loja
      });
      expect(csv.statusCode).toBe(200);
      expect(csv.headers["content-type"]).toContain("text/csv");
      expect(csv.body.split("\n")[0]).toBe(
        "id,referenciaPagamento,status,periodoInicio,periodoFim,quantidadeComissoes,valorTotalEmKwanza,moeda,autorNome,criadoEm"
      );
      expect(csv.body).toContain(`"${pagarLote.json().id}","LOTE-FINANCEIRO-001","PAGO"`);
      expect(csv.body).toContain(",2,5000,\"AOA\",\"Loja financeiro\",");
    } finally {
      await app.close();
    }
  });

  it("expõe mini-loja pública de criador com apenas produtos autorizados e links rastreáveis", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923600106", "Loja Mini Criador");

      await criarProduto(app, loja, "ML1");
      await criarProduto(app, loja, "ML2");
      await criarProduto(app, loja, "ML3");

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-mini-criador",
          descricaoPublica: "Produtos escolhidos por criadores.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const criador = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "nia",
          nomePublico: "Nia Looks",
          contacto: "923700201",
          metodoPagamento: { iban: "AO06000000000000000000001" },
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 12
          }
        }
      });
      expect(criador.statusCode).toBe(201);

      const linkMiniLoja = await app.inject({
        method: "POST",
        url: `/afiliados/${criador.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "NIA-LOJA",
          destinoTipo: "LOJA",
          slugLoja: "loja-mini-criador",
          canal: "instagram",
          origemConteudo: "bio-criadora"
        }
      });
      expect(linkMiniLoja.statusCode).toBe(201);

      for (const codigoProduto of ["ML1", "ML2"]) {
        const linkProduto = await app.inject({
          method: "POST",
          url: `/afiliados/${criador.json().id}/links`,
          headers: loja,
          payload: {
            codigo: `NIA-${codigoProduto}`,
            destinoTipo: "PRODUTO",
            slugLoja: "loja-mini-criador",
            codigoProduto,
            canal: "instagram",
            origemConteudo: "mini-loja"
          }
        });
        expect(linkProduto.statusCode).toBe(201);
      }

      const miniLoja = await app.inject({
        method: "GET",
        url: "/publico/mini-lojas/NIA-LOJA?trackingId=trk-mini-nia"
      });
      expect(miniLoja.statusCode).toBe(200);
      expect(miniLoja.json()).toEqual(
        expect.objectContaining({
          parceiro: expect.objectContaining({
            codigo: "NIA",
            nomePublico: "Nia Looks",
            tipo: "CRIADOR"
          }),
          miniLoja: expect.objectContaining({
            codigo: "NIA-LOJA",
            canal: "instagram",
            origemConteudo: "bio-criadora"
          }),
          rastreamento: expect.objectContaining({
            referenciaPrincipal: "NIA-LOJA",
            trackingId: "trk-mini-nia",
            origem: "mini-loja:NIA"
          })
        })
      );
      expect(miniLoja.json().produtos.map((produto: { codigo: string }) => produto.codigo)).toEqual(["ML1", "ML2"]);
      expect(JSON.stringify(miniLoja.json().produtos)).not.toContain("ML3");
      expect(miniLoja.json().produtos[0]).toEqual(
        expect.objectContaining({
          codigo: "ML1",
          link: expect.objectContaining({
            codigo: "NIA-ML1",
            urlPublica: expect.stringContaining("ref=NIA-ML1")
          })
        })
      );
      expect(JSON.stringify(miniLoja.json())).not.toContain("923700201");
    } finally {
      await app.close();
    }
  });

  it("aplica regras de revenda na mini-loja pública sem expor configuração financeira privada", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923600107", "Loja Revendedores");

      await criarProduto(app, loja, "RV1");

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-revenda",
          descricaoPublica: "Produtos para revendedores autorizados.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const revendedor = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "REVENDEDOR",
          codigo: "maya",
          nomePublico: "Maya Store",
          contacto: "923700202",
          metodoPagamento: {
            iban: "AO06000000000000000000002",
            revenda: {
              descontoPercentual: 20,
              margemPercentualSugerida: 35,
              reservaStock: {
                quantidadeMaximaPorProduto: 4,
                validadeMinutos: 180
              },
              entrega: {
                modos: ["ENTREGA_LOCAL"],
                bairros: ["Talatona"],
                taxaPadraoEmKwanza: 1500
              },
              retirada: {
                pontos: ["Showroom Talatona"],
                exigeAgendamento: true
              }
            }
          },
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 8
          }
        }
      });
      expect(revendedor.statusCode).toBe(201);

      const linkMiniLoja = await app.inject({
        method: "POST",
        url: `/afiliados/${revendedor.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "MAYA-LOJA",
          destinoTipo: "LOJA",
          slugLoja: "loja-revenda",
          canal: "whatsapp",
          origemConteudo: "catalogo-revenda"
        }
      });
      expect(linkMiniLoja.statusCode).toBe(201);

      const linkProduto = await app.inject({
        method: "POST",
        url: `/afiliados/${revendedor.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "MAYA-RV1",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-revenda",
          codigoProduto: "RV1",
          canal: "whatsapp",
          origemConteudo: "mini-loja-revenda"
        }
      });
      expect(linkProduto.statusCode).toBe(201);

      const miniLoja = await app.inject({
        method: "GET",
        url: "/publico/mini-lojas/MAYA-LOJA?trackingId=trk-revenda-maya"
      });
      expect(miniLoja.statusCode).toBe(200);
      expect(miniLoja.json().parceiro).toEqual(
        expect.objectContaining({
          codigo: "MAYA",
          tipo: "REVENDEDOR"
        })
      );
      expect(miniLoja.json().produtos[0]).toEqual(
        expect.objectContaining({
          codigo: "RV1",
          precoEmKwanza: 12_500,
          revenda: expect.objectContaining({
            precoEspecialEmKwanza: 10_000,
            margemSugeridaEmKwanza: 3_500,
            precoSugeridoEmKwanza: 13_500,
            reservaStock: expect.objectContaining({
              quantidadeMaximaPorProduto: 4,
              validadeMinutos: 180
            }),
            entrega: expect.objectContaining({
              taxaPadraoEmKwanza: 1500
            }),
            retirada: expect.objectContaining({
              exigeAgendamento: true
            })
          })
        })
      );
      expect(JSON.stringify(miniLoja.json())).not.toContain("AO06000000000000000000002");
      expect(JSON.stringify(miniLoja.json())).not.toContain("923700202");
    } finally {
      await app.close();
    }
  });
});
