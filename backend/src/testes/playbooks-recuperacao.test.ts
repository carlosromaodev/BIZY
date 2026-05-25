import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Playbooks de recuperação", () => {
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

  it("executa playbook seguro criando tarefa humana e trilha operacional", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const criada = await app.inject({
        method: "POST",
        url: "/playbooks/recuperacao",
        headers,
        payload: {
          nome: "Recuperar pagamento pendente",
          gatilho: "PAGAMENTO_PENDENTE",
          prioridadeTarefa: "ALTA",
          atrasoMinutos: 30,
          tituloTarefa: "Cobrar pagamento pendente",
          descricaoTarefa: "Cliente iniciou pedido e ainda não pagou.",
          responsavelId: "financeiro-01",
          condicoes: {
            estadoPagamento: "PENDENTE"
          }
        }
      });

      expect(criada.statusCode).toBe(201);
      expect(criada.json().playbook).toEqual(
        expect.objectContaining({
          nome: "Recuperar pagamento pendente",
          gatilho: "PAGAMENTO_PENDENTE",
          ativo: true,
          acao: "CRIAR_TAREFA",
          prioridadeTarefa: "ALTA",
          atrasoMinutos: 30
        })
      );

      const playbookId = criada.json().playbook.id;
      const executada = await app.inject({
        method: "POST",
        url: `/playbooks/recuperacao/${playbookId}/executar`,
        headers,
        payload: {
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-001",
          clienteTelefone: "923456710",
          contexto: {
            numeroPedido: 41,
            totalEmKwanza: 12000
          }
        }
      });

      expect(executada.statusCode).toBe(202);
      expect(executada.json().execucao).toEqual(
        expect.objectContaining({
          playbookId,
          gatilho: "PAGAMENTO_PENDENTE",
          estado: "EXECUTADA",
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-001",
          clienteTelefone: "923456710"
        })
      );
      expect(executada.json().tarefa).toEqual(
        expect.objectContaining({
          tipo: "PLAYBOOK_RECUPERACAO",
          titulo: "Cobrar pagamento pendente",
          descricao: "Cliente iniciou pedido e ainda não pagou.",
          prioridade: "ALTA",
          origem: "playbook_recuperacao",
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-001",
          clienteTelefone: "923456710",
          responsavelId: "financeiro-01"
        })
      );
      expect(executada.json().tarefa.contexto).toEqual(
        expect.objectContaining({
          playbook: expect.objectContaining({
            id: playbookId,
            gatilho: "PAGAMENTO_PENDENTE"
          }),
          evento: expect.objectContaining({
            numeroPedido: 41,
            totalEmKwanza: 12000
          })
        })
      );
      expect(executada.json().movimentoFunil).toEqual(
        expect.objectContaining({
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-001",
          etapaNova: "PAGAMENTO_PENDENTE",
          motivo: "Playbook Recuperar pagamento pendente executado.",
          origem: "playbook_recuperacao"
        })
      );
      expect(executada.json().oportunidade).toEqual(
        expect.objectContaining({
          gatilho: "PAGAMENTO_PENDENTE",
          estado: "ABERTA",
          entidadeTipo: "pedido",
          entidadeId: "pedido-temp-001",
          clienteTelefone: "923456710",
          valorEstimadoEmKwanza: 12000,
          tarefaId: executada.json().tarefa.id,
          movimentoFunilId: executada.json().movimentoFunil.id
        })
      );

      const tarefas = await app.inject({
        method: "GET",
        url: "/tarefas?estado=ABERTA&tipo=PLAYBOOK_RECUPERACAO",
        headers
      });

      expect(tarefas.statusCode).toBe(200);
      expect(tarefas.json().tarefas).toEqual([
        expect.objectContaining({
          id: executada.json().tarefa.id,
          estado: "ABERTA"
        })
      ]);

      const execucoes = await app.inject({
        method: "GET",
        url: "/playbooks/recuperacao/execucoes?gatilho=PAGAMENTO_PENDENTE",
        headers
      });

      expect(execucoes.statusCode).toBe(200);
      expect(execucoes.json().execucoes).toEqual([
        expect.objectContaining({
          id: executada.json().execucao.id,
          tarefaId: executada.json().tarefa.id,
          estado: "EXECUTADA"
        })
      ]);

      const oportunidades = await app.inject({
        method: "GET",
        url: "/recuperacao/oportunidades?estado=ABERTA&gatilho=PAGAMENTO_PENDENTE",
        headers
      });

      expect(oportunidades.statusCode).toBe(200);
      expect(oportunidades.json().oportunidades).toEqual([
        expect.objectContaining({
          id: executada.json().oportunidade.id,
          estado: "ABERTA",
          tarefaId: executada.json().tarefa.id
        })
      ]);

      const assumida = await app.inject({
        method: "PATCH",
        url: `/recuperacao/oportunidades/${executada.json().oportunidade.id}`,
        headers,
        payload: {
          estado: "EM_ATENDIMENTO",
          responsavelId: "financeiro-01",
          observacao: "Cliente será contactado antes do fim do dia."
        }
      });

      expect(assumida.statusCode).toBe(200);
      expect(assumida.json().oportunidade).toEqual(
        expect.objectContaining({
          id: executada.json().oportunidade.id,
          estado: "EM_ATENDIMENTO",
          responsavelId: "financeiro-01",
          observacao: "Cliente será contactado antes do fim do dia."
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
    payload: { telefone: "923000012", nome: "Gestor Playbooks" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000012", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
