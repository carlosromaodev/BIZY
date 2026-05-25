import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Fluxo operacional dos módulos", () => {
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

  it("integra catálogo, parser, reserva, painel, n8n e webhook Evolution", async () => {
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000001", nome: "Vendedor" }
      });
      expect(respostaCodigo.statusCode).toBe(202);

      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000001", codigo: respostaCodigo.json().codigoDev }
      });
      expect(respostaSessao.statusCode).toBe(200);
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      const statusIntegracoes = await app.inject({
        method: "GET",
        url: "/integracoes/status",
        headers: headersAutenticados
      });
      expect(statusIntegracoes.statusCode).toBe(200);
      expect(statusIntegracoes.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ nome: "TikTok Live Connector" }),
          expect.objectContaining({ nome: "Evolution API" })
        ])
      );

      const respostaPeca = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "4",
          nome: "Vestido floral",
          descricao: "Peça para live",
          precoEmKwanza: 12000,
          quantidade: 1,
          fotos: []
        }
      });
      expect(respostaPeca.statusCode).toBe(201);

      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_teste",
          username: "joao_ao",
          displayName: "João",
          commentText: "eu quero 923456789 peça 4"
        }
      });
      expect(respostaComentario.statusCode).toBe(201);
      expect(respostaComentario.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          reserva: expect.objectContaining({
            codigoPeca: "4",
            telefoneCliente: "923456789",
            estado: "WAITING_PAYMENT"
          })
        })
      );

      const reservaId = respostaComentario.json().reserva.id as string;

      const respostaPainel = await app.inject({ method: "GET", url: "/painel/resumo", headers: headersAutenticados });
      expect(respostaPainel.statusCode).toBe(200);
      expect(respostaPainel.json()).toEqual(
        expect.objectContaining({
          comentariosRecebidos: 1,
          comentariosValidos: 1,
          reservasCriadas: 1,
          reservasPendentes: 1,
          integracoes: expect.any(Array)
        })
      );

      const respostaN8n = await app.inject({ method: "GET", url: "/n8n/customers/by-phone/923456789" });
      expect(respostaN8n.statusCode).toBe(200);
      expect(respostaN8n.json()).toEqual(
        expect.objectContaining({
          cliente: expect.objectContaining({ telefone: "923456789", nome: "João" }),
          reservaAtiva: expect.objectContaining({ id: reservaId, codigoPeca: "4" })
        })
      );

      const respostaAutomacoes = await app.inject({
        method: "GET",
        url: "/automacoes/status",
        headers: headersAutenticados
      });
      expect(respostaAutomacoes.statusCode).toBe(200);
      expect(respostaAutomacoes.json()).toEqual(
        expect.objectContaining({
          agentes: expect.arrayContaining([expect.objectContaining({ id: "parser-reservas", estado: "ATIVA" })]),
          workflows: expect.arrayContaining([expect.objectContaining({ id: "eventos-vendas" })])
        })
      );

      const respostaConversas = await app.inject({
        method: "GET",
        url: "/atendimento/conversas",
        headers: headersAutenticados
      });
      expect(respostaConversas.statusCode).toBe(200);
      expect(respostaConversas.json().conversas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telefone: "923456789",
            reservaAtual: expect.objectContaining({ id: reservaId })
          })
        ])
      );

      const respostaWebhookEvolution = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          instance: "emeu",
          data: {
            pushName: "João",
            key: {
              remoteJid: "244923456789@s.whatsapp.net",
              id: "MSG1"
            },
            message: {
              conversation: "Já enviei o comprovativo"
            }
          }
        }
      });
      expect(respostaWebhookEvolution.statusCode).toBe(202);
      expect(respostaWebhookEvolution.json()).toEqual(
        expect.objectContaining({
          ok: true,
          mensagem: expect.objectContaining({
            telefone: "923456789",
            texto: "Já enviei o comprovativo"
          })
        })
      );

      const respostaComprovativo = await app.inject({
        method: "POST",
        url: `/n8n/payments/${reservaId}/proof-received`,
        payload: {
          comprovativoPagamentoUrl: "https://exemplo.com/comprovativo.jpg"
        }
      });
      expect(respostaComprovativo.statusCode).toBe(200);
      expect(respostaComprovativo.json().reserva.estadoPagamento).toBe("COMPROVATIVO_RECEBIDO");

      const respostaPagamento = await app.inject({
        method: "POST",
        url: `/n8n/payments/${reservaId}/confirm`,
        payload: {}
      });
      expect(respostaPagamento.statusCode).toBe(200);
      expect(respostaPagamento.json().reserva.estado).toBe("PAID");

      const respostaEndereco = await app.inject({
        method: "POST",
        url: `/n8n/orders/${reservaId}/delivery-address`,
        payload: {
          enderecoEntrega: "Rua da Mutamba, Luanda"
        }
      });
      expect(respostaEndereco.statusCode).toBe(200);
      expect(respostaEndereco.json().reserva.enderecoEntrega).toBe("Rua da Mutamba, Luanda");
    } finally {
      await app.close();
    }
  });

  it("cria múltiplas reservas para um comentário com mais de uma peça", async () => {
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000003", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000003", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      for (const codigo of ["4", "5"]) {
        await app.inject({
          method: "POST",
          url: "/pecas",
          headers: headersAutenticados,
          payload: {
            codigo,
            nome: `Peça ${codigo}`,
            descricao: "Peça para live",
            precoEmKwanza: 10000,
            quantidade: 1,
            fotos: []
          }
        });
      }

      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_multi",
          username: "cliente_multi",
          displayName: "Cliente Multi",
          commentText: "eu quero peça 4 e peça 5 923456789"
        }
      });

      expect(respostaComentario.statusCode).toBe(201);
      expect(respostaComentario.json().estado).toBe("PROCESSADO");
      expect(respostaComentario.json().reservas).toEqual([
        expect.objectContaining({ codigoPeca: "4", telefoneCliente: "923456789" }),
        expect.objectContaining({ codigoPeca: "5", telefoneCliente: "923456789" })
      ]);
    } finally {
      await app.close();
    }
  });

  it("preserva dados de perfil da live no comentário, reserva e CRM", async () => {
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000017", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000017", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "88",
          nome: "Blazer perfil",
          descricao: "Peça com cliente enriquecido",
          precoEmKwanza: 15000,
          quantidade: 1,
          fotos: []
        }
      });

      const avatarUrl = "https://cdn.exemplo.ao/avatar/perfil.jpg";
      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_perfil",
          username: "cliente_profile",
          displayName: "Cliente Perfil",
          userId: "tiktok-user-7788",
          avatarUrl,
          commentText: "quero 923456789 peca 88"
        }
      });

      expect(respostaComentario.statusCode).toBe(201);
      expect(respostaComentario.json().registro.comentario).toEqual(
        expect.objectContaining({
          username: "cliente_profile",
          displayName: "Cliente Perfil",
          userId: "tiktok-user-7788",
          avatarUrl
        })
      );
      expect(respostaComentario.json().reserva).toEqual(
        expect.objectContaining({
          userIdCliente: "tiktok-user-7788",
          avatarUrlCliente: avatarUrl
        })
      );

      const respostaConversas = await app.inject({
        method: "GET",
        url: "/atendimento/conversas",
        headers: headersAutenticados
      });

      expect(respostaConversas.statusCode).toBe(200);
      expect(respostaConversas.json().conversas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telefone: "923456789",
            nomeCliente: "Cliente Perfil",
            userIdCliente: "tiktok-user-7788",
            avatarUrlCliente: avatarUrl
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("cria reservas repetidas do mesmo contacto e dispara WhatsApp para cada reserva de alta confiança", async () => {
    process.env = {
      ...process.env,
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "console"
    };
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000006", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000006", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "R2",
          nome: "Camisa repetida",
          descricao: "Peça com várias unidades",
          precoEmKwanza: 9000,
          quantidade: 2,
          fotos: []
        }
      });

      const primeiroComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_repetida",
          username: "cliente_repetido",
          displayName: "Cliente Repetido",
          commentText: "eu quero peça R2 923456789"
        }
      });
      const segundoComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_repetida",
          username: "cliente_repetido",
          displayName: "Cliente Repetido",
          commentText: "eu quero peça R2 923456789"
        }
      });

      expect(primeiroComentario.statusCode).toBe(201);
      expect(segundoComentario.statusCode).toBe(201);
      expect(primeiroComentario.json().estado).toBe("PROCESSADO");
      expect(segundoComentario.json().estado).toBe("PROCESSADO");
      expect(segundoComentario.json().reserva.id).not.toBe(primeiroComentario.json().reserva.id);

      const reservas = await app.inject({ method: "GET", url: "/reservas", headers: headersAutenticados });
      expect(reservas.json()).toEqual([
        expect.objectContaining({ codigoPeca: "R2", telefoneCliente: "923456789", estado: "WAITING_PAYMENT" }),
        expect.objectContaining({ codigoPeca: "R2", telefoneCliente: "923456789", estado: "WAITING_PAYMENT" })
      ]);

      const enviosReserva = consoleSpy.mock.calls.filter(([tag, dados]) => {
        const registro = dados && typeof dados === "object" ? (dados as { tipo?: string; telefone?: string }) : null;
        return tag === "[WhatsAppConsole]" && registro?.tipo === "RESERVA_CRIADA" && registro.telefone === "923456789";
      });
      expect(enviosReserva).toHaveLength(2);
    } finally {
      await app.close();
    }
  });

  it("mantém a reserva processada quando o WhatsApp automático falha", async () => {
    process.env = {
      ...process.env,
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "evolution",
      EVOLUTION_API_URL: "https://evolution.local",
      EVOLUTION_API_KEY: "api_key",
      EVOLUTION_INSTANCE: "emeu"
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "offline" }), { status: 503 })));
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000007", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000007", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "F1",
          nome: "Blusa com falha de envio",
          descricao: "Reserva não deve cair por falha do WhatsApp",
          precoEmKwanza: 12500,
          quantidade: 1,
          fotos: []
        }
      });

      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_falha_whatsapp",
          username: "cliente_falha",
          displayName: "Cliente Falha",
          commentText: "eu quero peça F1 923456788"
        }
      });

      expect(respostaComentario.statusCode).toBe(201);
      expect(respostaComentario.json()).toEqual(
        expect.objectContaining({
          estado: "PROCESSADO",
          reserva: expect.objectContaining({
            codigoPeca: "F1",
            telefoneCliente: "923456788",
            estado: "WAITING_PAYMENT"
          })
        })
      );

      await new Promise((resolver) => setTimeout(resolver, 0));

      const outboxWhatsApp = await app.inject({
        method: "GET",
        url: "/automacoes/whatsapp/outbox/saude",
        headers: headersAutenticados
      });
      expect(outboxWhatsApp.statusCode).toBe(200);
      expect(outboxWhatsApp.json()).toEqual(
        expect.objectContaining({
          total: 1,
          pendentes: 1,
          enviadas: 0,
          falhadas: 0,
          ultimaFalha: expect.stringContaining("Evolution rejeitou envio WhatsApp")
        })
      );
    } finally {
      await app.close();
    }
  });

  it("envia mensagem manual pelo provider oficial WhatsApp Cloud API", async () => {
    process.env = {
      ...process.env,
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "cloud-api",
      WHATSAPP_CLOUD_PHONE_NUMBER_ID: "106540352242922",
      WHATSAPP_CLOUD_ACCESS_TOKEN: "token_cloud",
      WHATSAPP_CLOUD_API_VERSION: "v25.0",
      WHATSAPP_CLOUD_API_BASE_URL: "https://graph.facebook.com"
    };
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ messages: [{ id: "wamid.manual_cloud" }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000009", nome: "Vendedor Cloud" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000009", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      const automacoes = await app.inject({
        method: "GET",
        url: "/automacoes/status",
        headers: headersAutenticados
      });
      expect(automacoes.statusCode).toBe(200);
      expect(automacoes.json().agentes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "whatsapp-reservas",
            estado: "ATIVA",
            acaoPrincipal: "ProvedorWhatsAppCloudApi",
            canal: "WhatsApp Cloud API oficial"
          })
        ])
      );

      const resposta = await app.inject({
        method: "POST",
        url: "/whatsapp/mensagens",
        headers: headersAutenticados,
        payload: {
          telefone: "937624785",
          mensagem: "Olá, seguimos o teu atendimento pelo ÉMeu."
        }
      });

      expect(resposta.statusCode).toBe(202);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          resultado: expect.objectContaining({
            idExterno: "wamid.manual_cloud",
            provider: "whatsapp-cloud-api"
          })
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "https://graph.facebook.com/v25.0/106540352242922/messages",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token_cloud" }),
          body: expect.stringContaining('"to":"244937624785"')
        })
      );
    } finally {
      await app.close();
    }
  });

  it("puxa o cliente por WhatsApp quando o comentário tem telefone mas a peça não é encontrada", async () => {
    process.env = {
      ...process.env,
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "console"
    };
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000005", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000005", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      const comentarioPecaInexistente = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_atendimento",
          username: "cliente_sem_peca",
          displayName: "Cliente Sem Peça",
          commentText: "eu quero peça X99 923456780"
        }
      });

      expect(comentarioPecaInexistente.statusCode).toBe(201);
      expect(comentarioPecaInexistente.json()).toEqual(
        expect.objectContaining({
          estado: "REVISAO_MANUAL",
          reserva: null
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[WhatsAppConsole]",
        expect.objectContaining({
          telefone: "923456780",
          tipo: "PEDIR_CODIGO_PECA",
          conteudo: expect.stringContaining("código da peça")
        })
      );

      const comentarioSemCodigo = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_atendimento",
          username: "cliente_sem_codigo",
          displayName: "Cliente Sem Código",
          commentText: "quero ficar com ela 923456781"
        }
      });

      expect(comentarioSemCodigo.statusCode).toBe(201);
      expect(comentarioSemCodigo.json()).toEqual(
        expect.objectContaining({
          estado: "REVISAO_MANUAL",
          reserva: null
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[WhatsAppConsole]",
        expect.objectContaining({
          telefone: "923456781",
          tipo: "PEDIR_CODIGO_PECA",
          conteudo: expect.stringContaining("código da peça")
        })
      );
    } finally {
      await app.close();
    }
  });

  it("expõe templates, envio manual de WhatsApp, relatórios de piloto e saúde da outbox n8n", async () => {
    const fetchMock = vi.fn(async () => new Response("falhou", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    process.env = {
      ...process.env,
      N8N_EVENTOS_ATIVOS: "true",
      N8N_WEBHOOK_EVENTOS_URL: "https://n8n.local/webhook/emeu-eventos",
      N8N_WEBHOOK_SECRET: "segredo"
    };
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000004", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000004", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "R1",
          nome: "Vestido relatório",
          descricao: "Peça para relatório",
          precoEmKwanza: 11000,
          quantidade: 1,
          fotos: []
        }
      });

      const respostaComentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers: headersAutenticados,
        payload: {
          liveId: "live_relatorio",
          username: "cliente_relatorio",
          displayName: "Cliente Relatório",
          commentText: "eu quero peça R1 923456789"
        }
      });
      const reservaId = respostaComentario.json().reserva.id as string;

      await new Promise((resolver) => setTimeout(resolver, 0));

      const templates = await app.inject({ method: "GET", url: "/whatsapp/templates", headers: headersAutenticados });
      expect(templates.statusCode).toBe(200);
      expect(templates.json().templates).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "iban" }), expect.objectContaining({ id: "atendimento" })])
      );

      const templatesPagamento = await app.inject({
        method: "GET",
        url: "/whatsapp/templates?categoria=utility&evento=PAYMENT_PENDING&provider=whatsapp_cloud_api&apenasAprovados=true",
        headers: headersAutenticados
      });
      expect(templatesPagamento.statusCode).toBe(200);
      expect(templatesPagamento.json().templates).toEqual([
        expect.objectContaining({
          id: "iban",
          categoria: "utility",
          idioma: "pt_AO",
          provider: "whatsapp_cloud_api",
          versao: 1,
          estadoAprovacao: "aprovado",
          eventosCompativeis: expect.arrayContaining(["PAYMENT_PENDING"])
        })
      ]);

      const envioManual = await app.inject({
        method: "POST",
        url: "/whatsapp/mensagens",
        headers: headersAutenticados,
        payload: {
          telefone: "923456789",
          templateId: "iban",
          variaveis: {
            nomeCliente: "Cliente Relatório",
            iban: "AO06 0000 0000 0000 0000 0000 0",
            titular: "ÉMeu Piloto"
          }
        }
      });
      expect(envioManual.statusCode).toBe(202);
      expect(envioManual.json()).toEqual(expect.objectContaining({ tipo: "MANUAL_IBAN" }));

      const pagamento = await app.inject({
        method: "POST",
        url: `/reservas/${reservaId}/confirmar-pagamento`,
        headers: headersAutenticados,
        payload: {}
      });
      expect(pagamento.statusCode).toBe(200);

      const entregas = await app.inject({ method: "GET", url: "/relatorios/entregas", headers: headersAutenticados });
      expect(entregas.statusCode).toBe(200);
      expect(entregas.json().entregas).toEqual([
        expect.objectContaining({
          reservaId,
          codigoPeca: "R1",
          telefoneCliente: "923456789"
        })
      ]);

      const entregasCsv = await app.inject({ method: "GET", url: "/relatorios/entregas.csv", headers: headersAutenticados });
      expect(entregasCsv.statusCode).toBe(200);
      expect(entregasCsv.body).toContain("reservaId,codigoPeca,nomePeca,telefoneCliente");
      expect(entregasCsv.body).toContain(reservaId);

      const relatorioLive = await app.inject({
        method: "GET",
        url: "/relatorios/live-piloto?liveId=live_relatorio",
        headers: headersAutenticados
      });
      expect(relatorioLive.statusCode).toBe(200);
      expect(relatorioLive.json()).toEqual(
        expect.objectContaining({
          liveId: "live_relatorio",
          metricas: expect.objectContaining({
            comentariosCapturados: 1,
            reservasCriadas: 1,
            reservasPagas: 1
          })
        })
      );

      const relatorioCrm = await app.inject({
        method: "GET",
        url: "/relatorios/crm-pos-live?liveId=live_relatorio",
        headers: headersAutenticados
      });
      expect(relatorioCrm.statusCode).toBe(200);
      expect(relatorioCrm.json()).toEqual(
        expect.objectContaining({
          liveId: "live_relatorio",
          metricas: expect.objectContaining({
            clientesAtendidos: 1,
            conversoes: 1,
            mensagensFalhadas: 0,
            taxaConversaoClientes: 100,
            tempoMedioPrimeiraRespostaSegundos: expect.any(Number)
          }),
          oportunidadesPerdidas: expect.objectContaining({
            comentariosComIntencaoSemReserva: 0,
            reservasExpiradas: 0,
            reservasCanceladas: 0,
            mensagensFalhadas: 0
          }),
          clientes: [
            expect.objectContaining({
              telefone: "923456789",
              nomeCliente: "Cliente Relatório",
              reservasPagas: 1,
              mensagensFalhadas: 0
            })
          ]
        })
      );

      const relatorioCrmCsv = await app.inject({
        method: "GET",
        url: "/relatorios/crm-pos-live.csv?liveId=live_relatorio",
        headers: headersAutenticados
      });
      expect(relatorioCrmCsv.statusCode).toBe(200);
      expect(relatorioCrmCsv.body).toContain("telefone,nomeCliente,reservas,reservasPagas,mensagens");
      expect(relatorioCrmCsv.body).toContain("923456789");

      const outbox = await app.inject({
        method: "GET",
        url: "/automacoes/n8n/outbox/saude",
        headers: headersAutenticados
      });
      expect(outbox.statusCode).toBe(200);
      expect(outbox.json()).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          falhados: expect.any(Number),
          pendentes: expect.any(Number)
        })
      );
      expect(outbox.json().total).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });

  it("classifica mensagens sensíveis para aprovação humana antes da IA responder", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "POST",
        url: "/n8n/messages/classify",
        payload: {
          texto: "quero cancelar mas estou chateada porque o comprovativo está ilegível"
        }
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          exigeHumano: true,
          categorias: expect.arrayContaining(["cancelamento_ambiguo", "comprovativo_ilegivel", "cliente_irritado"])
        })
      );
    } finally {
      await app.close();
    }
  });

  it("permite editar e desativar peças do catálogo", async () => {
    const app = await criarAplicacao();

    try {
      const respostaCodigo = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000002", nome: "Vendedor" }
      });
      const respostaSessao = await app.inject({
        method: "POST",
        url: "/auth/telefone/confirmar-codigo",
        payload: { telefone: "923000002", codigo: respostaCodigo.json().codigoDev }
      });
      const headersAutenticados = { authorization: `Bearer ${respostaSessao.json().token}` };

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "A01",
          nome: "Blusa inicial",
          descricao: "Descrição inicial",
          precoEmKwanza: 9000,
          quantidade: 3,
          fotos: []
        }
      });

      const respostaPecaSemStock = await app.inject({
        method: "POST",
        url: "/pecas",
        headers: headersAutenticados,
        payload: {
          codigo: "A00",
          nome: "Peça sem stock",
          descricao: "Não deve ficar disponível",
          precoEmKwanza: 7000,
          quantidade: 0,
          fotos: [],
          estado: "DISPONIVEL"
        }
      });
      expect(respostaPecaSemStock.statusCode).toBe(201);
      expect(respostaPecaSemStock.json().estado).toBe("ESGOTADA");

      const respostaEdicao = await app.inject({
        method: "PATCH",
        url: "/pecas/A01",
        headers: headersAutenticados,
        payload: {
          nome: "Blusa floral",
          descricao: "Peça atualizada para live",
          precoEmKwanza: 12500,
          quantidade: 2,
          fotos: ["https://exemplo.com/blusa-a01.jpg"],
          estado: "DISPONIVEL"
        }
      });

      expect(respostaEdicao.statusCode).toBe(200);
      expect(respostaEdicao.json()).toEqual(
        expect.objectContaining({
          codigo: "A01",
          nome: "Blusa floral",
          descricao: "Peça atualizada para live",
          precoEmKwanza: 12500,
          quantidade: 2,
          fotos: ["https://exemplo.com/blusa-a01.jpg"],
          estado: "DISPONIVEL"
        })
      );

      const respostaZerarStock = await app.inject({
        method: "PATCH",
        url: "/pecas/A01",
        headers: headersAutenticados,
        payload: { quantidade: 0, estado: "DISPONIVEL" }
      });

      expect(respostaZerarStock.statusCode).toBe(200);
      expect(respostaZerarStock.json().estado).toBe("ESGOTADA");

      const respostaDesativacao = await app.inject({
        method: "DELETE",
        url: "/pecas/A01",
        headers: headersAutenticados
      });

      expect(respostaDesativacao.statusCode).toBe(200);
      expect(respostaDesativacao.json()).toEqual(expect.objectContaining({ codigo: "A01", estado: "ESGOTADA" }));
    } finally {
      await app.close();
    }
  });
});
