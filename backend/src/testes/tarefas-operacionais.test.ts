import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Tarefas operacionais", () => {
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

  it("cria tarefa humana quando template WhatsApp está pendente de aprovação", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const envio = await app.inject({
        method: "POST",
        url: "/whatsapp/mensagens",
        headers,
        payload: {
          telefone: "923456789",
          templateId: "marketing_reengajamento",
          consentimentoMarketing: true,
          variaveis: {
            nomeCliente: "Cliente",
            cupom: "BIZY10"
          }
        }
      });

      expect(envio.statusCode).toBe(400);
      expect(envio.json().mensagem).toContain("ainda não está aprovado");

      const tarefas = await app.inject({
        method: "GET",
        url: "/tarefas?estado=ABERTA&tipo=WHATSAPP_POLICY_BLOCKED",
        headers
      });

      expect(tarefas.statusCode).toBe(200);
      expect(tarefas.json().tarefas).toEqual([
        expect.objectContaining({
          tipo: "WHATSAPP_POLICY_BLOCKED",
          estado: "ABERTA",
          prioridade: "ALTA",
          origem: "whatsapp_policy",
          clienteTelefone: "923456789",
          entidadeTipo: "whatsapp_template",
          entidadeId: "marketing_reengajamento",
          titulo: "Rever envio WhatsApp bloqueado",
          descricao: expect.stringContaining("Template WhatsApp marketing_reengajamento ainda não está aprovado")
        })
      ]);
      expect(tarefas.json().tarefas[0].contexto).toEqual(
        expect.objectContaining({
          whatsapp: expect.objectContaining({
            telefone: "923456789",
            templateId: "marketing_reengajamento"
          })
        })
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000011", nome: "Gestor Tarefas" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000011", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
