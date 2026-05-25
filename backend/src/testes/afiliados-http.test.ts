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
});
