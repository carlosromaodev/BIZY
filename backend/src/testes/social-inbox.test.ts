import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Social Inbox CRM+", () => {
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

  it("regista comentário social com intenção de compra e cria tarefa comercial", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const criado = await app.inject({
        method: "POST",
        url: "/social/inbox/itens",
        headers,
        payload: {
          canal: "instagram",
          provider: "instagram_graph",
          tipo: "COMENTARIO",
          postId: "post_look_001",
          postUrl: "https://instagram.com/p/post_look_001",
          autor: {
            id: "ig_923456701",
            username: "clientevip",
            nome: "Cliente VIP",
            avatarUrl: "https://example.com/avatar.jpg"
          },
          texto: "Quero comprar o vestido 01, meu WhatsApp é 923456701",
          intencao: "COMPRA",
          confianca: 0.94,
          clienteTelefone: "923456701",
          entidades: {
            produtoCodigo: "01"
          },
          contexto: {
            formato: "reel",
            campanha: "lancamento_maio"
          }
        }
      });

      expect(criado.statusCode).toBe(201);
      expect(criado.json().item).toEqual(
        expect.objectContaining({
          canal: "instagram",
          provider: "instagram_graph",
          tipo: "COMENTARIO",
          estado: "NOVO",
          intencao: "COMPRA",
          confianca: 0.94,
          clienteTelefone: "923456701",
          autorUsername: "clientevip",
          autorNome: "Cliente VIP"
        })
      );

      const listagem = await app.inject({
        method: "GET",
        url: "/social/inbox/itens?estado=NOVO&intencao=COMPRA",
        headers
      });

      expect(listagem.statusCode).toBe(200);
      expect(listagem.json().itens).toEqual([
        expect.objectContaining({
          id: criado.json().item.id,
          texto: expect.stringContaining("Quero comprar")
        })
      ]);

      const tarefas = await app.inject({
        method: "GET",
        url: "/tarefas?tipo=SOCIAL_LEAD_REVIEW&estado=ABERTA",
        headers
      });

      expect(tarefas.statusCode).toBe(200);
      expect(tarefas.json().tarefas).toEqual([
        expect.objectContaining({
          tipo: "SOCIAL_LEAD_REVIEW",
          estado: "ABERTA",
          prioridade: "ALTA",
          clienteTelefone: "923456701",
          entidadeTipo: "social_inbox_item",
          entidadeId: criado.json().item.id,
          titulo: "Responder lead do Instagram"
        })
      ]);
      expect(tarefas.json().tarefas[0].contexto.social).toEqual(
        expect.objectContaining({
          canal: "instagram",
          postId: "post_look_001",
          autorUsername: "clientevip",
          intencao: "COMPRA"
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
    payload: { telefone: "923000012", nome: "Gestor Social" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000012", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
