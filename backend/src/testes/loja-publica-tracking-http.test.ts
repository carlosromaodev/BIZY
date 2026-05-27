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
  codigo: string,
  quantidade: number,
  dados: Partial<{
    nome: string;
    descricao: string;
    categoria: string;
    colecao: string;
    precoEmKwanza: number;
    vitrine: Record<string, unknown>;
  }> = {}
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      sku: `SKU-${codigo}`,
      nome: dados.nome ?? `Produto ${codigo}`,
      descricao: dados.descricao ?? `Produto ${codigo} para loja pública`,
      precoEmKwanza: dados.precoEmKwanza ?? 12_500,
      custoEmKwanza: 7_500,
      quantidade,
      stockMinimo: 1,
      categoria: dados.categoria ?? "Roupas",
      colecao: dados.colecao ?? "Live atual",
      variantes: { tamanho: ["M", "G"] },
      fotos: [`https://example.com/${codigo}.png`],
      ...(dados.vitrine ? { vitrine: dados.vitrine } : {})
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("loja pública, catálogo digital e tracking HTTP", () => {
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

  it("publica loja por slug, expõe apenas produtos vendáveis e gera checkout WhatsApp rastreável", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923444001", "Loja Pública A");
      const lojaB = await autenticar(app, "923444002", "Loja Pública B");

      await criarProduto(app, lojaA, "P1", 5);
      await criarProduto(app, lojaA, "P2", 0);
      await criarProduto(app, lojaB, "P1", 10);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: lojaA,
        payload: {
          slug: "loja-publica-a",
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);
      expect(publicacao.json()).toEqual(
        expect.objectContaining({
          slugPublico: "loja-publica-a",
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp.",
          lojaPublicadaEm: expect.any(String)
        })
      );

      const slugDuplicado = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: lojaB,
        payload: {
          slug: "loja-publica-a",
          publicada: true
        }
      });
      expect(slugDuplicado.statusCode).toBe(409);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-publica-a?trackingId=anon-1&utm_source=tiktok&utm_campaign=live",
        headers: {}
      });
      expect(lojaPublica.statusCode).toBe(200);
      expect(lojaPublica.json().loja).toEqual(
        expect.objectContaining({
          slug: "loja-publica-a",
          nomeComercial: expect.stringContaining("Loja Pública A"),
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp."
        })
      );
      expect(lojaPublica.json().produtos).toEqual([
        expect.objectContaining({
          codigo: "P1",
          nome: "Produto P1",
          precoEmKwanza: 12_500,
          categoria: "Roupas",
          colecao: "Live atual",
          estadoStock: "DISPONIVEL"
        })
      ]);
      expect(JSON.stringify(lojaPublica.json())).not.toContain("custoEmKwanza");
      expect(JSON.stringify(lojaPublica.json())).not.toContain("margemEstimadaEmKwanza");
      expect(JSON.stringify(lojaPublica.json())).not.toContain("negocioId");
      expect(lojaPublica.json().seo).toEqual(
        expect.objectContaining({
          titulo: expect.stringContaining("Loja Pública A"),
          descricao: "Moda pronta para comprar pelo WhatsApp.",
          canonicalPath: "/lojas/loja-publica-a",
          imagem: "https://example.com/P1.png",
          previewSocial: expect.objectContaining({
            whatsapp: expect.any(Object),
            facebook: expect.any(Object),
            instagram: expect.any(Object),
            tiktok: expect.any(Object),
            navegador: expect.any(Object)
          })
        })
      );

      const produtoPublico = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-publica-a/produtos/P1?trackingId=anon-1"
      });
      expect(produtoPublico.statusCode).toBe(200);
      expect(produtoPublico.json().produto).toEqual(
        expect.objectContaining({
          codigo: "P1",
          variantes: { tamanho: ["M", "G"] },
          disponivel: true
        })
      );
      expect(produtoPublico.json().seo).toEqual(
        expect.objectContaining({
          titulo: "Produto P1 | Loja Pública A",
          descricao: "Produto P1 para loja pública",
          canonicalPath: "/lojas/loja-publica-a/produtos/P1",
          imagem: "https://example.com/P1.png",
          previewSocial: expect.objectContaining({
            whatsapp: expect.any(Object),
            facebook: expect.any(Object),
            instagram: expect.any(Object),
            tiktok: expect.any(Object),
            navegador: expect.any(Object)
          })
        })
      );

      const checkoutWhatsApp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-publica-a/produtos/P1/whatsapp",
        payload: {
          quantidade: 2,
          variante: { tamanho: "M" },
          trackingId: "anon-1",
          origem: "catalogo-digital"
        }
      });
      expect(checkoutWhatsApp.statusCode).toBe(200);
      expect(checkoutWhatsApp.json()).toEqual(
        expect.objectContaining({
          telefone: "923444001",
          mensagem: expect.stringContaining("Produto P1"),
          whatsappUrl: expect.stringContaining("wa.me")
        })
      );
      expect(checkoutWhatsApp.json().mensagem).toContain("Quantidade: 2");
      expect(checkoutWhatsApp.json().mensagem).toContain("Origem: catalogo-digital");

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: lojaA
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json()).toEqual(
        expect.objectContaining({
          totalEventos: 3,
          porTipo: expect.objectContaining({
            LOJA_VISITADA: 1,
            PRODUTO_VISTO: 1,
            WHATSAPP_CLICK: 1
          }),
          funil: expect.objectContaining({
            visitas: 1,
            produtosVistos: 1,
            cliquesWhatsApp: 1,
            checkoutsIniciados: 0,
            pedidosCriados: 0,
            leadsIdentificados: 0,
            receitaAtribuidaEmKwanza: 0,
            taxaWhatsAppPorProduto: 100
          })
        })
      );

      const funilTracking = await app.inject({
        method: "GET",
        url: "/funil/movimentos?entidadeTipo=tracking&entidadeId=anon-1",
        headers: lojaA
      });
      expect(funilTracking.statusCode).toBe(200);
      expect(funilTracking.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "PRODUTO_VISTO",
          etapaNova: "WHATSAPP_CLICK",
          origem: "loja_publica",
          motivo: "Cliente clicou para comprar pelo WhatsApp."
        }),
        expect.objectContaining({
          etapaAnterior: "VISITA",
          etapaNova: "PRODUTO_VISTO",
          origem: "loja_publica",
          motivo: "Cliente visualizou produto público."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "VISITA",
          origem: "loja_publica",
          motivo: "Cliente visitou a loja pública."
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("organiza vitrine pública com destaques, promoções, novidades, reposições, kits e mais vendidos", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444130", "Loja Vitrine");
      await criarProduto(app, loja, "D-1", 5, {
        nome: "Vestido destaque",
        vitrine: {
          selos: ["DESTAQUE"],
          prioridade: 2,
          titulo: "Escolha da semana"
        }
      });
      await criarProduto(app, loja, "P-1", 5, {
        nome: "Blusa em promoção",
        vitrine: {
          selos: ["PROMOCAO"],
          prioridade: 1,
          precoPromocionalEmKwanza: 9_500,
          descricao: "Preço especial até acabar o stock."
        }
      });
      await criarProduto(app, loja, "N-1", 5, {
        nome: "Novidade verde",
        vitrine: { selos: ["NOVIDADE"], prioridade: 1 }
      });
      await criarProduto(app, loja, "R-1", 5, {
        nome: "Reposição esperada",
        vitrine: { selos: ["REPOSICAO"], prioridade: 1 }
      });
      await criarProduto(app, loja, "M-1", 5, {
        nome: "Mais vendido",
        vitrine: { selos: ["MAIS_VENDIDO"], prioridade: 1 }
      });
      await criarProduto(app, loja, "K-1", 5, {
        nome: "Kit completo",
        vitrine: {
          selos: ["KIT", "DESTAQUE"],
          prioridade: 0,
          componentesKit: [
            { codigoPeca: "D-1", quantidade: 1 },
            { codigoPeca: "P-1", quantidade: 1 }
          ]
        }
      });

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-vitrine",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-vitrine"
      });
      expect(lojaPublica.statusCode).toBe(200);
      expect(lojaPublica.json().vitrine).toEqual(
        expect.objectContaining({
          destaques: [
            expect.objectContaining({ codigo: "K-1", nome: "Kit completo" }),
            expect.objectContaining({ codigo: "D-1", nome: "Vestido destaque" })
          ],
          promocoes: [expect.objectContaining({ codigo: "P-1", precoPromocionalEmKwanza: 9_500 })],
          novidades: [expect.objectContaining({ codigo: "N-1" })],
          reposicoes: [expect.objectContaining({ codigo: "R-1" })],
          maisVendidos: [expect.objectContaining({ codigo: "M-1" })],
          kits: [expect.objectContaining({ codigo: "K-1" })]
        })
      );
      expect(lojaPublica.json().produtos.find((produto: { codigo: string }) => produto.codigo === "K-1").vitrine)
        .toEqual(expect.objectContaining({
          selos: ["KIT", "DESTAQUE"],
          prioridade: 0,
          componentesKit: [
            { codigoPeca: "D-1", quantidade: 1 },
            { codigoPeca: "P-1", quantidade: 1 }
          ]
        }));
    } finally {
      await app.close();
    }
  });

  it("filtra produtos públicos por busca, categoria e coleção", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444120", "Loja Filtros Públicos");
      await criarProduto(app, loja, "CAM-1", 5, {
        nome: "Camisa Verde",
        categoria: "Roupas",
        colecao: "Live atual"
      });
      await criarProduto(app, loja, "TEN-1", 3, {
        nome: "Tênis urbano",
        descricao: "Tênis confortável para entrega rápida",
        categoria: "Calçado",
        colecao: "Promoção semanal"
      });

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-filtros-publicos",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const filtrado = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-filtros-publicos?busca=tenis&categoria=Calcado&colecao=promocao"
      });
      expect(filtrado.statusCode).toBe(200);
      expect(filtrado.json().produtos).toEqual([
        expect.objectContaining({
          codigo: "TEN-1",
          nome: "Tênis urbano",
          categoria: "Calçado",
          colecao: "Promoção semanal"
        })
      ]);
      expect(filtrado.json().filtros).toEqual(
        expect.objectContaining({
          busca: "tenis",
          categoria: "Calcado",
          colecao: "promocao"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("não expõe loja despublicada nem produto sem stock", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444101", "Loja Oculta");
      await criarProduto(app, loja, "X1", 0);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-oculta",
          publicada: false
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-oculta"
      });
      expect(lojaPublica.statusCode).toBe(404);

      const publicar = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-oculta",
          publicada: true
        }
      });
      expect(publicar.statusCode).toBe(200);

      const produtoSemStock = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-oculta/produtos/X1"
      });
      expect(produtoSemStock.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("calcula entrega e cria pedido pelo checkout público preservando origem e tracking", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444201", "Loja Checkout");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja Checkout",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923444201",
          whatsapp: "923444201",
          provincia: "Luanda",
          municipio: "Luanda",
          endereco: "Rua da loja",
          canaisVenda: ["site", "whatsapp"],
          metodosPagamento: ["transferencia"],
          entrega: {
            taxaPadraoEmKwanza: 2500,
            entregaGratisAcimaDeKwanza: 50000,
            zonas: [
              { municipio: "Luanda", bairro: "Talatona", taxaEmKwanza: 1500, prazo: "Hoje" },
              { municipio: "Viana", taxaEmKwanza: 3000, prazo: "24h" }
            ],
            retiradaNaLoja: { ativa: true, instrucoes: "Retirar na Rua da loja." }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      await criarProduto(app, loja, "C1", 8);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-checkout",
          descricaoPublica: "Compra pelo site ou WhatsApp.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const entrega = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/entrega/calcular",
        payload: {
          itens: [{ codigoPeca: "C1", quantidade: 2 }],
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Talatona",
            endereco: "Rua do cliente"
          }
        }
      });
      expect(entrega.statusCode).toBe(200);
      expect(entrega.json()).toEqual(
        expect.objectContaining({
          subtotalEmKwanza: 25_000,
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 26_500,
          moeda: "AOA"
        })
      );
      expect(entrega.json().entrega).toEqual(
        expect.objectContaining({
          tipo: "ENTREGA",
          regra: "zona",
          prazo: "Hoje"
        })
      );

      const whatsapp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/produtos/C1/whatsapp",
        payload: {
          quantidade: 2,
          variante: { tamanho: "M" },
          trackingId: "trk-checkout-1",
          origem: "link-afiliado-ana",
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Talatona",
            endereco: "Rua do cliente"
          }
        }
      });
      expect(whatsapp.statusCode).toBe(200);
      expect(whatsapp.json().mensagem).toContain("Entrega estimada: 1 500 Kz");
      expect(whatsapp.json().mensagem).toContain("Total estimado: 26 500 Kz");

      const checkoutSemConsentimento = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/checkout",
        payload: {
          cliente: {
            nome: "Cliente Sem Aceite",
            telefone: "923555667",
            consentimentoDados: false,
            consentimentoMarketing: false
          },
          itens: [{ codigoPeca: "C1", quantidade: 1 }],
          entrega: {
            tipo: "RETIRADA"
          },
          origem: "loja-publica"
        }
      });
      expect(checkoutSemConsentimento.statusCode).toBe(400);
      expect(JSON.stringify(checkoutSemConsentimento.json())).toContain("Consentimento de dados");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/checkout",
        payload: {
          cliente: {
            nome: "Cliente Site",
            telefone: "923555666",
            consentimentoDados: true,
            consentimentoMarketing: false
          },
          itens: [{ codigoPeca: "C1", quantidade: 2 }],
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Talatona",
            endereco: "Rua do cliente"
          },
          trackingId: "trk-checkout-1",
          origem: "link-afiliado-ana"
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json()).toEqual(
        expect.objectContaining({
          origem: "link-afiliado-ana",
          canal: "site",
          subtotalEmKwanza: 25_000,
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 26_500
        })
      );
      expect(checkout.json().pedido).toEqual(
        expect.objectContaining({
          numero: expect.any(Number),
          estado: "AGUARDANDO_PAGAMENTO",
          estadoPagamento: "PENDENTE"
        })
      );

      const pedidos = await app.inject({
        method: "GET",
        url: "/pedidos",
        headers: loja
      });
      expect(pedidos.statusCode).toBe(200);
      expect(pedidos.json().pedidos).toEqual([
        expect.objectContaining({
          origem: "link-afiliado-ana",
          canal: "site",
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 26_500,
          enderecoEntrega: expect.stringContaining("Talatona")
        })
      ]);

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: loja
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json().porTipo).toEqual(
        expect.objectContaining({
          WHATSAPP_CLICK: 1,
          CHECKOUT_INICIADO: 1,
          PEDIDO_CRIADO: 1
        })
      );
      expect(resumoTracking.json().porOrigem).toEqual(
        expect.objectContaining({
          "link-afiliado-ana": 3
        })
      );
      expect(resumoTracking.json().funil).toEqual(
        expect.objectContaining({
          visitas: 0,
          produtosVistos: 0,
          cliquesWhatsApp: 1,
          checkoutsIniciados: 1,
          pedidosCriados: 1,
          leadsIdentificados: 1,
          receitaAtribuidaEmKwanza: 26_500,
          taxaPedidoPorCheckout: 100
        })
      );

      const funilTracking = await app.inject({
        method: "GET",
        url: "/funil/movimentos?entidadeTipo=tracking&entidadeId=trk-checkout-1",
        headers: loja
      });
      expect(funilTracking.statusCode).toBe(200);
      expect(funilTracking.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "CHECKOUT",
          etapaNova: "PEDIDO",
          origem: "loja_publica",
          motivo: "Pedido criado a partir do checkout público."
        }),
        expect.objectContaining({
          etapaAnterior: "WHATSAPP_CLICK",
          etapaNova: "CHECKOUT",
          origem: "loja_publica",
          motivo: "Cliente iniciou checkout público."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "WHATSAPP_CLICK",
          origem: "loja_publica",
          motivo: "Cliente clicou para comprar pelo WhatsApp."
        })
      ]);

      const funilPedido = await app.inject({
        method: "GET",
        url: `/funil/movimentos?entidadeTipo=pedido&entidadeId=${checkout.json().pedido.id}`,
        headers: loja
      });
      expect(funilPedido.statusCode).toBe(200);
      expect(funilPedido.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "PEDIDO",
          etapaNova: "PAGAMENTO_PENDENTE",
          origem: "checkout_site",
          motivo: "Pedido criado pelo checkout público e aguarda pagamento."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "PEDIDO",
          origem: "checkout_site",
          motivo: "Pedido criado pelo checkout público."
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("aceita orçamento humano de entrega sem bloquear checkout público por WhatsApp", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444203", "Loja Entrega Orçamento");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja Entrega Orçamento",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923444203",
          whatsapp: "923444203",
          provincia: "Luanda",
          municipio: "Luanda",
          endereco: "Rua da loja",
          canaisVenda: ["site", "whatsapp"],
          metodosPagamento: ["transferencia"],
          entrega: {
            taxaPadraoEmKwanza: 2500,
            orcamentoHumano: {
              instrucoes: "A equipa confirma o valor da entrega antes do pagamento.",
              prazo: "Até 2h úteis"
            }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      await criarProduto(app, loja, "O1", 5);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-entrega-orcamento",
          descricaoPublica: "Compra com entrega sob orçamento.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const entrega = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-entrega-orcamento/entrega/calcular",
        payload: {
          itens: [{ codigoPeca: "O1", quantidade: 1 }],
          entrega: {
            tipo: "ORCAMENTO",
            provincia: "Luanda",
            municipio: "Cacuaco",
            bairro: "Sequele",
            endereco: "Rua sem taxa cadastrada"
          }
        }
      });
      expect(entrega.statusCode).toBe(200);
      expect(entrega.json()).toEqual(
        expect.objectContaining({
          subtotalEmKwanza: 12_500,
          taxaEntregaEmKwanza: 0,
          totalEmKwanza: 12_500
        })
      );
      expect(entrega.json().entrega).toEqual(
        expect.objectContaining({
          tipo: "ORCAMENTO",
          regra: "orcamento",
          prazo: "Até 2h úteis",
          descricao: "A equipa confirma o valor da entrega antes do pagamento.",
          endereco: expect.stringContaining("Sequele")
        })
      );

      const whatsapp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-entrega-orcamento/produtos/O1/whatsapp",
        payload: {
          quantidade: 1,
          variante: { tamanho: "M" },
          trackingId: "trk-orcamento-entrega",
          origem: "loja-publica",
          entrega: {
            tipo: "ORCAMENTO",
            municipio: "Cacuaco",
            bairro: "Sequele",
            endereco: "Rua sem taxa cadastrada"
          }
        }
      });
      expect(whatsapp.statusCode).toBe(200);
      expect(whatsapp.json().mensagem).toContain("Entrega: A equipa confirma o valor da entrega antes do pagamento.");
      expect(whatsapp.json().mensagem).toContain("Total estimado: 12 500 Kz");
    } finally {
      await app.close();
    }
  });

  it("prepara evento server-side apenas com credencial configurada e consentimento sem vazar dados pessoais", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444301", "Loja CAPI");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja CAPI",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923444301",
          whatsapp: "923444301",
          provincia: "Luanda",
          municipio: "Luanda",
          canaisVenda: ["site", "whatsapp"],
          metodosPagamento: ["transferencia"],
          entrega: {
            serverSideEvents: {
              ativo: true,
              providers: [
                {
                  provider: "meta_capi",
                  pixelId: "PIXEL-123",
                  credencialRef: "vault:meta:loja-capi",
                  eventos: ["PEDIDO_CRIADO"],
                  exigirConsentimentoMarketing: true
                }
              ]
            }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      await criarProduto(app, loja, "SSE1", 4);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-capi",
          descricaoPublica: "Loja com eventos server-side preparados.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-capi/checkout",
        payload: {
          cliente: {
            nome: "Cliente CAPI",
            telefone: "923555888",
            email: "cliente.capi@example.com",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "SSE1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" },
          trackingId: "trk-capi-1",
          origem: "anuncio-instagram",
          canal: "site"
        }
      });
      expect(checkout.statusCode).toBe(201);

      const eventos = await app.inject({
        method: "GET",
        url: "/eventos-operacionais?topico=server-side-events",
        headers: loja
      });
      expect(eventos.statusCode).toBe(200);
      expect(eventos.json().eventos).toEqual([
        expect.objectContaining({
          topico: "server-side-events",
          tipo: "META_CAPI_EVENT_READY",
          entidadeTipo: "PEDIDO",
          entidadeId: checkout.json().pedido.id,
          estado: "PENDENTE",
          payload: expect.objectContaining({
            provider: "meta_capi",
            eventName: "Purchase",
            pixelId: "PIXEL-123",
            credencialRef: "vault:meta:loja-capi",
            consentimento: expect.objectContaining({
              dados: true,
              marketing: true
            }),
            userData: expect.objectContaining({
              ph: expect.stringMatching(/^[a-f0-9]{64}$/),
              em: expect.stringMatching(/^[a-f0-9]{64}$/)
            }),
            customData: expect.objectContaining({
              currency: "AOA",
              value: 12_500,
              order_id: checkout.json().pedido.id
            })
          })
        })
      ]);
      const payloadSerializado = JSON.stringify(eventos.json());
      expect(payloadSerializado).not.toContain("923555888");
      expect(payloadSerializado).not.toContain("cliente.capi@example.com");
    } finally {
      await app.close();
    }
  });
});
