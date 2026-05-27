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

  it("importa comentários sociais por CSV com relatório de criados, duplicados e erros", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      const csv = [
        "canal,provider,tipo,postId,postUrl,autorId,autorUsername,autorNome,texto,intencao,confianca,clienteTelefone,produtoCodigo,campanhaId,providerItemId,providerPermissoes,capturadoEm,respondido",
        "tiktok,tiktok_business,COMENTARIO,video_csv_1,https://www.tiktok.com/@loja/video/1,tt_001,cliente_csv,Cliente CSV,\"Quero o produto BZ-1, tem entrega?\",COMPRA,0.92,923456701,BZ-1,campanha-live,comment_csv_1,comments.read|profile.read,2026-05-25T10:00:00.000Z,false",
        "tiktok,tiktok_business,COMENTARIO,video_csv_1,https://www.tiktok.com/@loja/video/1,tt_001,cliente_csv,Cliente CSV,\"Mesmo comentário duplicado\",COMPRA,0.91,923456701,BZ-1,campanha-live,comment_csv_1,comments.read,2026-05-25T10:00:00.000Z,false",
        "instagram,instagram_graph,COMENTARIO,post_erro,https://instagram.com/p/post_erro,ig_erro,cliente_erro,Cliente Erro,,COMPRA,0.7,923456702,BZ-2,campanha-live,comment_erro,comments.read,2026-05-25T10:05:00.000Z,false"
      ].join("\n");

      const importacao = await app.inject({
        method: "POST",
        url: "/social/inbox/importar.csv",
        headers,
        payload: { csv }
      });

      expect(importacao.statusCode).toBe(201);
      expect(importacao.json()).toEqual(
        expect.objectContaining({
          total: 3,
          criados: 1,
          duplicados: 1,
          erros: 1
        })
      );
      expect(importacao.json().linhas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ linha: 2, status: "CRIADO", providerItemId: "comment_csv_1" }),
          expect.objectContaining({ linha: 3, status: "DUPLICADO", providerItemId: "comment_csv_1" }),
          expect.objectContaining({ linha: 4, status: "ERRO" })
        ])
      );

      const filtrados = await app.inject({
        method: "GET",
        url: "/social/inbox/itens?provider=tiktok_business&postId=video_csv_1&campanhaId=campanha-live&produtoCodigo=BZ-1&respondido=false",
        headers
      });

      expect(filtrados.statusCode).toBe(200);
      expect(filtrados.json().itens).toEqual([
        expect.objectContaining({
          canal: "tiktok",
          provider: "tiktok_business",
          autorUsername: "cliente_csv",
          texto: expect.stringContaining("Quero o produto BZ-1")
        })
      ]);
      expect(filtrados.json().itens[0].entidades).toEqual(expect.objectContaining({ produtoCodigo: "BZ-1" }));
      expect(filtrados.json().itens[0].contexto).toEqual(
        expect.objectContaining({
          campanhaId: "campanha-live",
          providerItemId: "comment_csv_1",
          origemImportacao: "csv",
          providerPermissoes: ["comments.read", "profile.read"],
          respondido: false
        })
      );

      const tarefas = await app.inject({
        method: "GET",
        url: "/tarefas?tipo=SOCIAL_LEAD_REVIEW&estado=ABERTA",
        headers
      });
      expect(tarefas.statusCode).toBe(200);
      expect(tarefas.json().tarefas).toHaveLength(1);
      expect(tarefas.json().tarefas[0]).toEqual(
        expect.objectContaining({
          tipo: "SOCIAL_LEAD_REVIEW",
          clienteTelefone: "923456701"
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
