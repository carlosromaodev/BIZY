import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Funil comercial", () => {
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

  it("registra movimentos de etapa com motivo e histórico por entidade", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const etapas = await app.inject({
        method: "GET",
        url: "/funil/etapas",
        headers
      });

      expect(etapas.statusCode).toBe(200);
      expect(etapas.json().etapas).toContain("PAGAMENTO_PENDENTE");

      const primeira = await app.inject({
        method: "POST",
        url: "/funil/movimentos",
        headers,
        payload: {
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-002",
          etapaNova: "PAGAMENTO_PENDENTE",
          motivo: "Pedido criado pelo checkout e aguarda comprovativo.",
          origem: "checkout_site",
          contexto: {
            totalEmKwanza: 18000
          }
        }
      });

      expect(primeira.statusCode).toBe(201);
      expect(primeira.json().movimento).toEqual(
        expect.objectContaining({
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-002",
          etapaAnterior: null,
          etapaNova: "PAGAMENTO_PENDENTE",
          motivo: "Pedido criado pelo checkout e aguarda comprovativo.",
          origem: "checkout_site"
        })
      );

      const segunda = await app.inject({
        method: "POST",
        url: "/funil/movimentos",
        headers,
        payload: {
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-002",
          etapaNova: "PAGO",
          motivo: "Comprovativo validado pela equipa financeira.",
          origem: "atendimento",
          autorId: "financeiro-01"
        }
      });

      expect(segunda.statusCode).toBe(201);
      expect(segunda.json().movimento).toEqual(
        expect.objectContaining({
          etapaAnterior: "PAGAMENTO_PENDENTE",
          etapaNova: "PAGO",
          autorId: "financeiro-01"
        })
      );

      const historico = await app.inject({
        method: "GET",
        url: "/funil/movimentos?entidadeTipo=pedido&entidadeId=pedido-temp-002",
        headers
      });

      expect(historico.statusCode).toBe(200);
      expect(historico.json().movimentos).toEqual([
        expect.objectContaining({
          etapaNova: "PAGO",
          etapaAnterior: "PAGAMENTO_PENDENTE"
        }),
        expect.objectContaining({
          etapaNova: "PAGAMENTO_PENDENTE",
          etapaAnterior: null
        })
      ]);
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000013", nome: "Gestor Funil" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000013", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
