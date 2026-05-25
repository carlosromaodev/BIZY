import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Compartilhamento seguro de clientes", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      OMBALA_API_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("compartilha cliente entre lojas apenas com relação aprovada, consentimento e escopo auditado", async () => {
    const app = await criarAplicacao();

    try {
      const origem = await autenticarComNegocio(app, {
        telefone: "923000015",
        nome: "Loja Origem",
        nomeComercial: "Boutique Origem"
      });
      const destino = await autenticarComNegocio(app, {
        telefone: "923000016",
        nome: "Loja Parceira",
        nomeComercial: "Parceira Entregas"
      });

      const cliente = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: origem.headers,
        payload: {
          telefone: "923456789",
          nome: "Cliente Compartilhável",
          origem: "live_tiktok",
          tags: ["vip", "vestidos"],
          preferencias: {
            tamanho: "M",
            bairro: "Talatona"
          },
          consentimentoDados: true,
          consentimentoMarketing: false
        }
      });

      expect(cliente.statusCode).toBe(201);

      const bloqueadoSemRelacao = await app.inject({
        method: "POST",
        url: `/clientes/${cliente.json().id}/compartilhamentos`,
        headers: origem.headers,
        payload: {
          negocioDestinoId: destino.negocio.id,
          escopo: {
            campos: ["nome", "telefone", "preferencias"]
          },
          baseLegal: "CONSENTIMENTO",
          consentimentoCliente: true
        }
      });

      expect(bloqueadoSemRelacao.statusCode).toBe(400);
      expect(bloqueadoSemRelacao.json().erro).toBe("COMPARTILHAMENTO_CLIENTE_INVALIDO");

      const relacao = await app.inject({
        method: "POST",
        url: "/negocio/relacoes",
        headers: origem.headers,
        payload: {
          negocioDestinoId: destino.negocio.id,
          tipo: "PARCERIA_DADOS",
          escopo: {
            finalidade: "atendimento compartilhado e entrega"
          }
        }
      });

      expect(relacao.statusCode).toBe(201);
      expect(relacao.json().relacao).toEqual(
        expect.objectContaining({
          negocioOrigemId: origem.negocio.id,
          negocioDestinoId: destino.negocio.id,
          estado: "PENDENTE"
        })
      );

      const aprovada = await app.inject({
        method: "PATCH",
        url: `/negocio/relacoes/${relacao.json().relacao.id}`,
        headers: destino.headers,
        payload: {
          estado: "APROVADA"
        }
      });

      expect(aprovada.statusCode).toBe(200);
      expect(aprovada.json().relacao.estado).toBe("APROVADA");

      const compartilhado = await app.inject({
        method: "POST",
        url: `/clientes/${cliente.json().id}/compartilhamentos`,
        headers: origem.headers,
        payload: {
          negocioDestinoId: destino.negocio.id,
          relacaoId: relacao.json().relacao.id,
          escopo: {
            campos: ["nome", "telefone", "preferencias"]
          },
          baseLegal: "CONSENTIMENTO",
          consentimentoCliente: true
        }
      });

      expect(compartilhado.statusCode).toBe(201);
      expect(compartilhado.json().compartilhamento).toEqual(
        expect.objectContaining({
          negocioOrigemId: origem.negocio.id,
          negocioDestinoId: destino.negocio.id,
          status: "ATIVO",
          baseLegal: "CONSENTIMENTO",
          consentimentoCliente: true
        })
      );
      expect(compartilhado.json().auditoria).toEqual([
        expect.objectContaining({
          acao: "CRIADO"
        })
      ]);

      const recebidos = await app.inject({
        method: "GET",
        url: "/clientes/compartilhamentos/recebidos",
        headers: destino.headers
      });

      expect(recebidos.statusCode).toBe(200);
      expect(recebidos.json().compartilhamentos).toEqual([
        expect.objectContaining({
          id: compartilhado.json().compartilhamento.id,
          cliente: {
            nome: "Cliente Compartilhável",
            telefone: "923456789",
            preferencias: {
              tamanho: "M",
              bairro: "Talatona"
            }
          }
        })
      ]);
      expect(JSON.stringify(recebidos.json())).not.toContain("pedidos");
      expect(JSON.stringify(recebidos.json())).not.toContain("vip");
    } finally {
      await app.close();
    }
  });
});

async function autenticarComNegocio(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  dados: { telefone: string; nome: string; nomeComercial: string }
) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: dados.telefone, nome: dados.nome }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: dados.telefone, codigo: respostaCodigo.json().codigoDev }
  });
  const headers = { authorization: `Bearer ${respostaSessao.json().token}` };

  const negocio = await app.inject({
    method: "POST",
    url: "/onboarding/negocio",
    headers,
    payload: {
      nomeComercial: dados.nomeComercial,
      segmento: "Moda",
      tipo: "LOJA",
      telefone: dados.telefone,
      whatsapp: dados.telefone,
      moeda: "AOA",
      fusoHorario: "Africa/Luanda",
      canaisVenda: ["whatsapp", "loja"],
      metodosPagamento: ["transferencia"],
      minutosReservaPadrao: 10
    }
  });

  expect(negocio.statusCode).toBe(201);

  return {
    headers,
    negocio: negocio.json().negocio
  };
}
