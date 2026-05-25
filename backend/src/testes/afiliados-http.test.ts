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
          comissaoConfirmadaEmKwanza: 2_500
        })
      );
      expect(resumo.json().ranking[0]).toEqual(
        expect.objectContaining({
          afiliadoId: afiliado.json().id,
          nomePublico: "Ana Vendas",
          pedidos: 1,
          comissaoConfirmadaEmKwanza: 2_500
        })
      );
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
});
