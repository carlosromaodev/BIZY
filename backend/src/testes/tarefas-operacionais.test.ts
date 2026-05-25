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

  it("permite criar e atualizar tarefas manuais da equipa comercial", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const criada = await app.inject({
        method: "POST",
        url: "/tarefas",
        headers,
        payload: {
          tipo: "FOLLOW_UP_CLIENTE",
          titulo: "Confirmar medida da cliente",
          descricao: "Cliente pediu confirmação antes de pagar.",
          prioridade: "ALTA",
          clienteTelefone: "923456700",
          entidadeTipo: "cliente",
          entidadeId: "cliente-temp-923456700",
          observacao: "Responder ainda hoje.",
          contexto: {
            canal: "whatsapp",
            origem: "atendimento"
          }
        }
      });

      expect(criada.statusCode).toBe(201);
      expect(criada.json().tarefa).toEqual(
        expect.objectContaining({
          tipo: "FOLLOW_UP_CLIENTE",
          titulo: "Confirmar medida da cliente",
          prioridade: "ALTA",
          estado: "ABERTA",
          origem: "manual",
          clienteTelefone: "923456700",
          observacao: "Responder ainda hoje."
        })
      );

      const tarefaId = criada.json().tarefa.id;
      const atualizada = await app.inject({
        method: "PATCH",
        url: `/tarefas/${tarefaId}`,
        headers,
        payload: {
          estado: "CONCLUIDA",
          responsavelId: "vendedor-01",
          observacao: "Cliente confirmou e recebeu o link de pagamento.",
          contexto: {
            resultado: "link_pagamento_enviado"
          }
        }
      });

      expect(atualizada.statusCode).toBe(200);
      expect(atualizada.json().tarefa).toEqual(
        expect.objectContaining({
          id: tarefaId,
          estado: "CONCLUIDA",
          responsavelId: "vendedor-01",
          observacao: "Cliente confirmou e recebeu o link de pagamento."
        })
      );
      expect(atualizada.json().tarefa.concluidaEm).toEqual(expect.any(String));
      expect(atualizada.json().tarefa.contexto).toEqual(
        expect.objectContaining({
          canal: "whatsapp",
          origem: "atendimento",
          resultado: "link_pagamento_enviado"
        })
      );

      const filtrada = await app.inject({
        method: "GET",
        url: "/tarefas?estado=CONCLUIDA&responsavelId=vendedor-01",
        headers
      });

      expect(filtrada.statusCode).toBe(200);
      expect(filtrada.json().tarefas).toEqual([
        expect.objectContaining({
          id: tarefaId,
          estado: "CONCLUIDA",
          responsavelId: "vendedor-01"
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
    payload: { telefone: "923000011", nome: "Gestor Tarefas" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000011", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
