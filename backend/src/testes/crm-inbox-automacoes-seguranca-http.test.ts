import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
  const sessao = await autenticarComUsuario(app, telefone, nome);
  return sessao.headers;
}

async function autenticarComUsuario(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
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

  return {
    headers: { authorization: `Bearer ${respostaSessao.json().token}` },
    usuarioId: respostaSessao.json().usuario.id as string
  };
}

async function criarPeca(app: Awaited<ReturnType<typeof criarAplicacao>>, headers: Record<string, string>, codigo: string) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Produto ${codigo}`,
      descricao: "Produto para atendimento comercial",
      precoEmKwanza: 15_000,
      custoEmKwanza: 9_000,
      quantidade: 6,
      fotos: [`https://example.com/${codigo}.png`]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function drenarEventosAssincronos() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("CRM+ inbox, automações seguras e tracking privado", () => {
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
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...ambienteOriginal };
  });

  it("permite atender no inbox, criar pedido contextual, sugerir ação e gerar tarefa por SLA", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923810001", "Loja Inbox");
      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers,
        payload: {
          nomeComercial: "Loja Inbox",
          segmento: "Moda",
          tipo: "LOJA",
          whatsapp: "923810001"
        }
      });
      expect(negocio.statusCode).toBe(201);
      const negocioId = negocio.json().negocio.id as string;
      await criarPeca(app, headers, "INBOX-1");

      const payloadWebhook = {
        event: "messages.upsert",
        instance: "bizy-inbox",
        negocioId,
        data: {
          key: {
            remoteJid: "244937800111@s.whatsapp.net",
            fromMe: false,
            id: "msg-inbox-1"
          },
          pushName: "Cliente Inbox",
          message: {
            conversation: "Olá, quero comprar o produto INBOX-1"
          }
        }
      };
      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: payloadWebhook
      });
      expect(webhook.statusCode).toBe(202);
      expect(webhook.json()).toEqual(
        expect.objectContaining({
          duplicado: false,
          idempotencyKey: expect.stringContaining("evolution:bizy-inbox:INBOUND:msg-inbox-1")
        })
      );

      const repetido = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: payloadWebhook
      });
      expect(repetido.statusCode).toBe(202);
      expect(repetido.json()).toEqual(
        expect.objectContaining({
          duplicado: true,
          mensagem: null,
          idempotencyKey: expect.stringContaining("evolution:bizy-inbox:INBOUND:msg-inbox-1")
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);
      expect(conversas.json().conversas).toEqual([
        expect.objectContaining({
          telefone: "937800111",
          nomeCliente: "Cliente Inbox",
          estadoCrm: "ABERTA",
          conversaCrmId: expect.any(String)
        })
      ]);
      const conversaId = conversas.json().conversas[0].conversaCrmId as string;

      const sugestoesAntesPedido = await app.inject({
        method: "GET",
        url: `/atendimento/conversas/${conversaId}/proximas-acoes`,
        headers
      });
      expect(sugestoesAntesPedido.statusCode).toBe(200);
      expect(sugestoesAntesPedido.json().acoes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "CRIAR_PEDIDO",
            prioridade: "ALTA"
          })
        ])
      );

      const sla = await app.inject({
        method: "POST",
        url: "/atendimento/conversas/verificar-sla",
        headers,
        payload: {
          idadeMinutos: 0,
          responsavelId: "atendente-1",
          prioridade: "URGENTE"
        }
      });
      expect(sla.statusCode).toBe(201);
      expect(sla.json().tarefas).toEqual([
        expect.objectContaining({
          tipo: "SLA_CONVERSA",
          entidadeTipo: "conversa",
          entidadeId: conversaId,
          clienteTelefone: "937800111",
          prioridade: "URGENTE",
          responsavelId: "atendente-1"
        })
      ]);

      const pedido = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaId}/pedidos`,
        headers,
        payload: {
          itens: [{ codigoPeca: "INBOX-1", quantidade: 1 }],
          taxaEntregaEmKwanza: 1500,
          enderecoEntrega: "Talatona, Rua do cliente",
          origem: "conversa_whatsapp",
          canal: "whatsapp"
        }
      });
      expect(pedido.statusCode).toBe(201);
      expect(pedido.json().pedido).toEqual(
        expect.objectContaining({
          estado: "AGUARDANDO_PAGAMENTO",
          canal: "whatsapp",
          totalEmKwanza: 16_500
        })
      );

      const cobranca = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaId}/mensagens`,
        headers,
        payload: {
          tipo: "TEMPLATE",
          templateId: "iban",
          variaveis: {
            nomeCliente: "Cliente Inbox",
            codigoPeca: "INBOX-1",
            nomePeca: "Produto INBOX-1",
            preco: "16 500 Kz",
            iban: "AO06004000000000000000000",
            titular: "Bizy Loja",
            referencia: `PED-${pedido.json().pedido.numero}`
          },
          categoria: "utility",
          entidadeTipo: "pedido",
          entidadeId: pedido.json().pedido.id
        }
      });
      expect(cobranca.statusCode).toBe(202);
      expect(cobranca.json().mensagem).toEqual(
        expect.objectContaining({
          conversaId,
          remetente: "agente",
          tipo: "MANUAL_IBAN",
          status: "SENT"
        })
      );

      const sugestoesDepoisPedido = await app.inject({
        method: "GET",
        url: `/atendimento/conversas/${conversaId}/proximas-acoes`,
        headers
      });
      expect(sugestoesDepoisPedido.statusCode).toBe(200);
      expect(sugestoesDepoisPedido.json().acoes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "PEDIR_COMPROVATIVO",
            entidadeId: pedido.json().pedido.id
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("agrega filtros comerciais do inbox para sem resposta, pendências, VIP e meu atendimento", async () => {
    const app = await criarAplicacao();

    try {
      const sessao = await autenticarComUsuario(app, "923810201", "Loja Filtros Inbox");
      const { headers, usuarioId } = sessao;
      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers,
        payload: {
          nomeComercial: "Loja Filtros Inbox",
          segmento: "Moda",
          tipo: "LOJA",
          whatsapp: "923810201"
        }
      });
      expect(negocio.statusCode).toBe(201);
      const negocioId = negocio.json().negocio.id as string;
      await criarPeca(app, headers, "FILTRO-1");

      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "bizy-filtros",
          negocioId,
          data: {
            key: {
              remoteJid: "244937801222@s.whatsapp.net",
              fromMe: false,
              id: "msg-filtro-1"
            },
            pushName: "Cliente VIP",
            message: {
              conversation: "Tenho uma reclamação e quero comprar o produto FILTRO-1"
            }
          }
        }
      });
      expect(webhook.statusCode).toBe(202);

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);
      const conversaId = conversas.json().conversas[0].conversaCrmId as string;

      const atualizada = await app.inject({
        method: "PATCH",
        url: `/atendimento/conversas/${conversaId}`,
        headers,
        payload: {
          estado: "AGUARDANDO_HUMANO",
          prioridade: "URGENTE",
          responsavelId: usuarioId,
          tags: ["vip", "reclamacao", "campanha_respondida", "entrega_pendente"]
        }
      });
      expect(atualizada.statusCode).toBe(200);

      const pedido = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaId}/pedidos`,
        headers,
        payload: {
          itens: [{ codigoPeca: "FILTRO-1", quantidade: 1 }],
          taxaEntregaEmKwanza: 1000,
          enderecoEntrega: "Talatona, Condomínio do cliente",
          origem: "conversa_whatsapp",
          canal: "whatsapp",
          responsavelId: usuarioId
        }
      });
      expect(pedido.statusCode).toBe(201);

      const atendimentoHumano = await app.inject({
        method: "PATCH",
        url: `/atendimento/conversas/${conversaId}`,
        headers,
        payload: {
          estado: "AGUARDANDO_HUMANO",
          prioridade: "URGENTE",
          responsavelId: usuarioId,
          tags: ["vip", "reclamacao", "campanha_respondida", "entrega_pendente", "pagamento_pendente"]
        }
      });
      expect(atendimentoHumano.statusCode).toBe(200);

      const filtros = await app.inject({
        method: "GET",
        url: "/atendimento/conversas/filtros",
        headers
      });

      expect(filtros.statusCode).toBe(200);
      const porId = Object.fromEntries(
        filtros.json().filtros.map((filtro: { id: string }) => [filtro.id, filtro])
      ) as Record<string, { total: number; conversas: Array<Record<string, unknown>> }>;

      for (const id of [
        "sem_resposta",
        "pagamento_pendente",
        "entrega_pendente",
        "vip",
        "reclamacao",
        "campanha_respondida",
        "meu_atendimento"
      ]) {
        expect(porId[id].total).toBe(1);
        expect(porId[id].conversas[0]).toEqual(
          expect.objectContaining({
            conversaCrmId: conversaId,
            responsavelId: usuarioId,
            telefone: "937801222"
          })
        );
      }
    } finally {
      await app.close();
    }
  });

  it("cria tarefas humanas para social inbox sensível e rejeita tracking com dados privados", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923810101", "Loja Social Seguro");

      const reclamacao = await app.inject({
        method: "POST",
        url: "/social/inbox/itens",
        headers,
        payload: {
          canal: "instagram",
          provider: "instagram_graph",
          tipo: "COMENTARIO",
          postId: "post_reclamacao_1",
          postUrl: "https://instagram.com/p/post_reclamacao_1",
          autor: {
            id: "ig_937900222",
            username: "cliente_reclama",
            nome: "Cliente Reclama"
          },
          texto: "O meu pagamento deu problema, preciso de ajuda",
          intencao: "RECLAMACAO",
          confianca: 0.88,
          clienteTelefone: "937900222",
          contexto: {
            providerPermissoes: ["comments.read"],
            capturedAt: "2026-05-25T10:00:00.000Z"
          }
        }
      });
      expect(reclamacao.statusCode).toBe(201);

      const tarefas = await app.inject({
        method: "GET",
        url: "/tarefas?estado=ABERTA",
        headers
      });
      expect(tarefas.statusCode).toBe(200);
      expect(tarefas.json().tarefas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "SOCIAL_HUMAN_REVIEW",
            prioridade: "ALTA",
            clienteTelefone: "937900222",
            entidadeId: reclamacao.json().item.id
          })
        ])
      );

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers,
        payload: {
          nomeComercial: "Loja Social Seguro",
          segmento: "Moda",
          tipo: "LOJA",
          whatsapp: "923810101"
        }
      });
      expect(negocio.statusCode).toBe(201);

      const publicar = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "social-seguro",
          publicada: true
        }
      });
      expect(publicar.statusCode).toBe(200);

      const trackingInvalido = await app.inject({
        method: "POST",
        url: "/publico/tracking/eventos",
        payload: {
          slugLoja: "social-seguro",
          tipo: "WHATSAPP_CLICK",
          trackingId: "937900222",
          origem: "instagram",
          canal: "whatsapp",
          utm: { utm_source: "instagram", telefone: "937900222" },
          metadata: {
            email: "cliente@example.com"
          }
        }
      });
      expect(trackingInvalido.statusCode).toBe(400);
      expect(trackingInvalido.json().erro).toBe("TRACKING_DADO_SENSIVEL");

      const trackingValido = await app.inject({
        method: "POST",
        url: "/publico/tracking/eventos",
        payload: {
          slugLoja: "social-seguro",
          tipo: "WHATSAPP_CLICK",
          trackingId: "anonimo-abc",
          origem: "instagram",
          canal: "whatsapp",
          utm: { utm_source: "instagram", utm_campaign: "maio" },
          metadata: {
            consentimentoCookies: false,
            contexto: "clique sem identificação"
          }
        }
      });
      expect(trackingValido.statusCode).toBe(201);
      expect(trackingValido.json()).toEqual(
        expect.objectContaining({
          trackingId: "anonimo-abc",
          origem: "instagram",
          canal: "whatsapp"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("deduplica social inbox, filtra contexto comercial e transfere responsáveis com motivo", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923810202", "Loja Operação");
      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers,
        payload: {
          nomeComercial: "Loja Operação",
          segmento: "Moda",
          tipo: "LOJA",
          whatsapp: "923810202"
        }
      });
      expect(negocio.statusCode).toBe(201);
      const negocioId = negocio.json().negocio.id as string;
      await criarPeca(app, headers, "OPS-1");

      const socialPayload = {
        canal: "tiktok",
        provider: "tiktok_business",
        tipo: "COMENTARIO",
        postId: "video_ops_1",
        postUrl: "https://www.tiktok.com/@loja/video/ops1",
        autor: {
          id: "tt_cliente_ops",
          username: "cliente_ops",
          nome: "Cliente Ops"
        },
        texto: "Quero a peça OPS-1, tens entrega?",
        intencao: "COMPRA",
        confianca: 0.91,
        entidades: {
          produtoCodigo: "OPS-1",
          urgencia: "ALTA"
        },
        contexto: {
          providerItemId: "comment_ops_1",
          campanhaId: "campanha-maio",
          responsavelId: "atendente-antigo",
          respondido: false,
          providerPermissoes: ["comments.read"]
        }
      };

      const social1 = await app.inject({
        method: "POST",
        url: "/social/inbox/itens",
        headers,
        payload: socialPayload
      });
      expect(social1.statusCode).toBe(201);

      const socialDuplicado = await app.inject({
        method: "POST",
        url: "/social/inbox/itens",
        headers,
        payload: {
          ...socialPayload,
          texto: "Quero a peça OPS-1, tens entrega?"
        }
      });
      expect(socialDuplicado.statusCode).toBe(201);
      expect(socialDuplicado.json().item.id).toBe(social1.json().item.id);

      const filtrados = await app.inject({
        method: "GET",
        url: "/social/inbox/itens?canal=tiktok&provider=tiktok_business&postId=video_ops_1&campanhaId=campanha-maio&produtoCodigo=OPS-1&responsavelId=atendente-antigo&urgencia=ALTA&respondido=false",
        headers
      });
      expect(filtrados.statusCode).toBe(200);
      expect(filtrados.json().itens).toEqual([
        expect.objectContaining({
          id: social1.json().item.id,
          canal: "tiktok",
          postId: "video_ops_1",
          intencao: "COMPRA"
        })
      ]);

      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "bizy-operacao",
          negocioId,
          data: {
            key: {
              remoteJid: "244937810202@s.whatsapp.net",
              fromMe: false,
              id: "msg-transfer-1"
            },
            pushName: "Cliente Transfer",
            message: {
              conversation: "Quero comprar OPS-1"
            }
          }
        }
      });
      expect(webhook.statusCode).toBe(202);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      const conversaId = conversas.json().conversas[0].conversaCrmId as string;

      const tarefa = await app.inject({
        method: "POST",
        url: "/tarefas",
        headers,
        payload: {
          tipo: "FOLLOW_UP",
          titulo: "Ligar para cliente",
          descricao: "Validar entrega",
          entidadeTipo: "conversa",
          entidadeId: conversaId,
          responsavelId: "atendente-antigo"
        }
      });
      expect(tarefa.statusCode).toBe(201);

      const pedido = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaId}/pedidos`,
        headers,
        payload: {
          itens: [{ codigoPeca: "OPS-1", quantidade: 1 }],
          origem: "conversa_whatsapp",
          canal: "whatsapp"
        }
      });
      expect(pedido.statusCode).toBe(201);

      const transferencia = await app.inject({
        method: "POST",
        url: "/operacional/transferencias",
        headers,
        payload: {
          responsavelId: "atendente-novo",
          motivo: "Escalar para equipa de fecho",
          itens: [
            { tipo: "conversa", id: conversaId },
            { tipo: "pedido", id: pedido.json().pedido.id },
            { tipo: "tarefa", id: tarefa.json().tarefa.id }
          ]
        }
      });
      expect(transferencia.statusCode).toBe(200);
      expect(transferencia.json().resultados).toEqual([
        expect.objectContaining({ tipo: "conversa", id: conversaId, responsavelId: "atendente-novo" }),
        expect.objectContaining({ tipo: "pedido", id: pedido.json().pedido.id, responsavelId: "atendente-novo" }),
        expect.objectContaining({ tipo: "tarefa", id: tarefa.json().tarefa.id, responsavelId: "atendente-novo" })
      ]);
    } finally {
      await app.close();
    }
  });

  it("bloqueia texto livre de serviço quando a última mensagem inbound saiu da janela WhatsApp", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-25T10:00:00.000Z"));
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923810303", "Loja Janela WhatsApp");
      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers,
        payload: {
          nomeComercial: "Loja Janela WhatsApp",
          segmento: "Moda",
          tipo: "LOJA",
          whatsapp: "923810303"
        }
      });
      expect(negocio.statusCode).toBe(201);
      const negocioId = negocio.json().negocio.id as string;

      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "bizy-janela",
          negocioId,
          data: {
            key: {
              remoteJid: "244937830303@s.whatsapp.net",
              fromMe: false,
              id: "msg-janela-antiga"
            },
            pushName: "Cliente Janela",
            message: {
              conversation: "Olá, quero saber o preço"
            }
          }
        }
      });
      expect(webhook.statusCode).toBe(202);
      await drenarEventosAssincronos();

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);
      const conversaId = conversas.json().conversas[0].conversaCrmId as string;

      vi.setSystemTime(new Date("2026-05-26T10:30:00.000Z"));
      const resposta = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaId}/mensagens`,
        headers,
        payload: {
          tipo: "TEXTO",
          mensagem: "Olá, ainda estás disponível para continuar?"
        }
      });

      expect(resposta.statusCode).toBe(400);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          erro: "REGRA_NEGOCIO",
          mensagem: expect.stringContaining("janela de atendimento")
        })
      );
    } finally {
      await app.close();
    }
  });
});
