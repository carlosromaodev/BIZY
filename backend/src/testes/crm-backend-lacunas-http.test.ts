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
  precoEmKwanza = 12_000
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Produto ${codigo}`,
      descricao: `Produto ${codigo} para CRM+`,
      precoEmKwanza,
      custoEmKwanza: Math.round(precoEmKwanza * 0.6),
      quantidade: 10,
      categoria: "Moda",
      fotos: [`https://example.com/${codigo}.png`]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function criarCliente(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  telefone = "937700001"
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/clientes",
    headers,
    payload: {
      telefone,
      nome: "Cliente Lacunas",
      email: "cliente.lacunas@example.com",
      consentimentoDados: true,
      consentimentoMarketing: true
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function publicarLoja(app: Awaited<ReturnType<typeof criarAplicacao>>, headers: Record<string, string>) {
  const resposta = await app.inject({
    method: "PUT",
    url: "/loja-publica/configuracao",
    headers,
    payload: {
      slug: "loja-lacunas",
      descricaoPublica: "Loja preparada para vender por site e WhatsApp.",
      publicada: true
    }
  });
  expect(resposta.statusCode).toBe(200);
  return resposta.json();
}

describe("CRM+ lacunas backend dos RF/RNF/RN", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      PUBLIC_STORE_BASE_URL: "https://usebozy.com",
      PUBLIC_SMART_LINK_BASE_URL: "https://links.usebozy.com"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...ambienteOriginal };
  });

  it("solicita, audita e aprova desconto sem perder o vínculo ao pedido", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923450001", "Loja Descontos");
      await criarProduto(app, headers, "DESC-1", 20_000);
      const cliente = await criarCliente(app, headers);

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "DESC-1", quantidade: 1 }],
          origem: "whatsapp",
          canal: "whatsapp"
        }
      });
      expect(pedido.statusCode).toBe(201);

      const solicitacao = await app.inject({
        method: "POST",
        url: `/pedidos/${pedido.json().id}/descontos/solicitar`,
        headers,
        payload: {
          descontoEmKwanza: 2_500,
          motivo: "Retenção de cliente recorrente",
          responsavelId: "financeiro-1"
        }
      });
      expect(solicitacao.statusCode).toBe(201);
      expect(solicitacao.json().tarefa).toEqual(
        expect.objectContaining({
          tipo: "APROVAR_DESCONTO",
          pedidoId: pedido.json().id,
          responsavelId: "financeiro-1"
        })
      );

      const aprovacao = await app.inject({
        method: "POST",
        url: `/pedidos/${pedido.json().id}/descontos/aprovar`,
        headers,
        payload: {
          descontoEmKwanza: 2_500,
          motivo: "Aprovado por margem suficiente",
          aprovadoPor: "Gerência"
        }
      });
      expect(aprovacao.statusCode).toBe(200);
      expect(aprovacao.json().pedido).toEqual(
        expect.objectContaining({
          id: pedido.json().id,
          descontoEmKwanza: 2_500,
          totalEmKwanza: 17_500,
          motivoDesconto: "Aprovado por margem suficiente"
        })
      );

      const logs = await app.inject({ method: "GET", url: "/operacional/auditoria?tipo=DESCONTO_APROVADO", headers });
      expect(logs.statusCode).toBe(200);
      expect(logs.json().logs).toEqual([
        expect.objectContaining({
          tipo: "DESCONTO_APROVADO",
          mensagem: expect.stringContaining("desconto")
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("cria oportunidade de carrinho abandonado com consentimento e evita duplicidade", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923450101", "Loja Abandono");
      await criarProduto(app, headers, "AB-1", 18_000);
      await publicarLoja(app, headers);

      const abandono = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-lacunas/checkout/abandonado",
        payload: {
          trackingId: "track-ab-1",
          origem: "instagram",
          canal: "site",
          cliente: {
            nome: "Cliente Abandono",
            telefone: "937700222",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "AB-1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" }
        }
      });
      expect(abandono.statusCode).toBe(201);
      expect(abandono.json()).toEqual(
        expect.objectContaining({
          duplicado: false,
          oportunidade: expect.objectContaining({
            gatilho: "CARRINHO_ABANDONADO",
            clienteTelefone: "937700222",
            valorEstimadoEmKwanza: 18_000
          })
        })
      );

      const repetido = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-lacunas/checkout/abandonado",
        payload: {
          trackingId: "track-ab-1",
          origem: "instagram",
          canal: "site",
          cliente: {
            telefone: "937700222",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "AB-1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" }
        }
      });
      expect(repetido.statusCode).toBe(200);
      expect(repetido.json()).toEqual(
        expect.objectContaining({
          duplicado: true,
          oportunidade: expect.objectContaining({ id: abandono.json().oportunidade.id })
        })
      );

      const oportunidades = await app.inject({
        method: "GET",
        url: "/recuperacao/oportunidades?gatilho=CARRINHO_ABANDONADO",
        headers
      });
      expect(oportunidades.statusCode).toBe(200);
      expect(oportunidades.json().oportunidades).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("gera pacote de divulgação, resolve link curto estável e bloqueia autoindicação de afiliado", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923450201", "Loja Afiliados");
      await criarProduto(app, headers, "AFF-1", 22_000);
      await publicarLoja(app, headers);

      const afiliado = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers,
        payload: {
          tipo: "CRIADOR",
          codigo: "criadora-ana",
          nomePublico: "Criadora Ana",
          contacto: "937700333",
          regraComissao: { tipo: "PERCENTUAL", percentual: 10 },
          metodoPagamento: { iban: "AO06004000000000000000000" }
        }
      });
      expect(afiliado.statusCode).toBe(201);

      const link = await app.inject({
        method: "POST",
        url: `/afiliados/${afiliado.json().id}/links`,
        headers,
        payload: {
          codigo: "ana-aff-1",
          destinoTipo: "PRODUTO",
          slugLoja: "loja-lacunas",
          codigoProduto: "AFF-1",
          canal: "instagram",
          origemConteudo: "reels"
        }
      });
      expect(link.statusCode).toBe(201);
      expect(link.json().urlPublica).toBe("https://links.usebozy.com/go/ANA-AFF-1");

      const resolvido = await app.inject({ method: "GET", url: "/publico/links/ANA-AFF-1" });
      expect(resolvido.statusCode).toBe(200);
      expect(resolvido.json()).toEqual(
        expect.objectContaining({
          codigo: "ANA-AFF-1",
          destino: expect.objectContaining({
            tipo: "PRODUTO",
            slugLoja: "loja-lacunas",
            codigoProduto: "AFF-1"
          })
        })
      );

      const pacote = await app.inject({
        method: "GET",
        url: `/afiliados/${afiliado.json().id}/pacote-divulgacao?codigoProduto=AFF-1`,
        headers
      });
      expect(pacote.statusCode).toBe(200);
      expect(pacote.json()).toEqual(
        expect.objectContaining({
          parceiro: expect.objectContaining({ codigo: "CRIADORA-ANA" }),
          regras: expect.objectContaining({ tipo: "PERCENTUAL", percentual: 10 }),
          links: expect.arrayContaining([expect.objectContaining({ codigo: "ANA-AFF-1" })]),
          materiais: expect.arrayContaining([
            expect.objectContaining({ tipo: "TEXTO_WHATSAPP", conteudo: expect.stringContaining("AFF-1") })
          ])
        })
      );

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-lacunas/checkout",
        payload: {
          referencia: "ANA-AFF-1",
          origem: "site",
          canal: "site",
          trackingId: "self-aff-1",
          cliente: {
            nome: "Criadora Ana",
            telefone: "937700333",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "AFF-1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" }
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json().atribuicaoBloqueada).toEqual(
        expect.objectContaining({
          motivo: "AUTOINDICACAO"
        })
      );

      const comissoes = await app.inject({ method: "GET", url: "/afiliados/comissoes", headers });
      expect(comissoes.statusCode).toBe(200);
      expect(comissoes.json().comissoes).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("anonimiza cliente a pedido sem apagar histórico financeiro", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923450301", "Loja Privacidade");
      await criarProduto(app, headers, "PRIV-1", 11_000);
      const cliente = await criarCliente(app, headers, "937700444");

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "PRIV-1", quantidade: 1 }]
        }
      });
      expect(pedido.statusCode).toBe(201);

      const anonimo = await app.inject({
        method: "POST",
        url: `/clientes/${cliente.id}/privacidade/anonimizar`,
        headers,
        payload: {
          motivo: "Pedido formal do titular dos dados"
        }
      });
      expect(anonimo.statusCode).toBe(200);
      expect(anonimo.json().cliente).toEqual(
        expect.objectContaining({
          id: cliente.id,
          telefone: null,
          email: null,
          nome: null,
          consentimentoDados: false,
          consentimentoMarketing: false,
          estadoRelacionamento: "BLOQUEADO"
        })
      );
      expect(anonimo.json().cliente.tags).toContain("anonimizado");

      const pedidoPreservado = await app.inject({ method: "GET", url: `/pedidos/${pedido.json().id}`, headers });
      expect(pedidoPreservado.statusCode).toBe(200);
      expect(pedidoPreservado.json().pedido).toEqual(
        expect.objectContaining({
          id: pedido.json().id,
          clienteNegocioId: cliente.id,
          totalEmKwanza: 12_540
        })
      );
    } finally {
      await app.close();
    }
  });
});
