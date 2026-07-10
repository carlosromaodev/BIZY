import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";
import { AtendimentoCrmUseCase } from "../use-case/AtendimentoCrmUseCase.js";
import { RepositorioAtendimentoMemoria, RepositorioAuditoriaMemoria } from "../use-case/repositorios/RepositorioMemoria.js";

const ambienteOriginal = { ...process.env };

describe("CRM de atendimento", () => {
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
    vi.unstubAllGlobals();
    process.env = { ...ambienteOriginal };
  });

  it("monta a timeline da conversa com comentário, evento de reserva e WhatsApp enviado", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      await criarPeca(app, headers, "91");

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_crm",
          username: "cliente_crm",
          displayName: "Cliente CRM",
          commentText: "eu quero 923456789 peça 91"
        }
      });

      expect(comentario.statusCode).toBe(201);
      const reservaId = comentario.json().reserva.id as string;

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);

      const conversa = conversas.json().conversas.find((item: { telefone: string }) => item.telefone === "923456789");
      expect(conversa).toEqual(expect.objectContaining({ telefone: "923456789" }));
      expect(conversa.mensagens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            remetente: "cliente",
            origem: "comentario_live",
            conteudo: "eu quero 923456789 peça 91"
          }),
          expect.objectContaining({
            remetente: "sistema",
            origem: "evento_reserva",
            reservaId
          }),
          expect.objectContaining({
            remetente: "sistema",
            origem: "whatsapp",
            tipo: "RESERVA_CRIADA",
            status: "SENT",
            conteudo: expect.stringContaining("Recebemos o teu pedido")
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("regista inbound real e transforma status ERROR da Evolution em mensagem falhada recuperável", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      await criarPeca(app, headers, "92");
      await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_crm_status",
          username: "cliente_crm",
          displayName: "Cliente CRM",
          commentText: "923456789 92"
        }
      });

      const antes = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      const conversaAntes = antes.json().conversas.find((item: { telefone: string }) => item.telefone === "923456789");
      const enviada = conversaAntes.mensagens.find(
        (mensagem: { origem?: string; tipo?: string }) =>
          mensagem.origem === "whatsapp" && mensagem.tipo === "RESERVA_CRIADA"
      );

      expect(enviada.providerMessageId).toBeTruthy();

      const outboundWebhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "send.message",
          instance: "emeu",
          data: {
            key: {
              remoteJid: "244923456789@s.whatsapp.net",
              fromMe: true,
              id: enviada.providerMessageId
            },
            pushName: "Você",
            status: "PENDING",
            message: {
              conversation: enviada.conteudo
            }
          }
        }
      });

      expect(outboundWebhook.statusCode).toBe(202);
      expect(outboundWebhook.json().mensagem.direcao).toBe("OUTBOUND");

      const inboundWebhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "emeu",
          data: {
            pushName: "Cliente CRM",
            key: {
              remoteJid: "244923456789@s.whatsapp.net",
              fromMe: false,
              id: "INBOUND1"
            },
            message: {
              conversation: "Já enviei o comprovativo"
            }
          }
        }
      });

      expect(inboundWebhook.statusCode).toBe(202);
      expect(inboundWebhook.json().mensagem.direcao).toBe("INBOUND");

      const statusWebhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.update",
          instance: "emeu",
          data: {
            keyId: enviada.providerMessageId,
            remoteJid: "244923456789@s.whatsapp.net",
            fromMe: true,
            status: "ERROR",
            error: "Recipient not on WhatsApp"
          }
        }
      });

      expect(statusWebhook.statusCode).toBe(202);
      expect(statusWebhook.json().mensagem.direcao).toBe("STATUS");

      const depois = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      const conversaDepois = depois.json().conversas.find((item: { telefone: string }) => item.telefone === "923456789");

      expect(conversaDepois.mensagens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            remetente: "cliente",
            origem: "whatsapp",
            providerMessageId: "INBOUND1",
            conteudo: "Já enviei o comprovativo"
          }),
          expect.objectContaining({
            remetente: "sistema",
            origem: "whatsapp",
            providerMessageId: enviada.providerMessageId,
            status: "FAILED",
            erro: expect.stringContaining("Recipient not on WhatsApp")
          })
        ])
      );

      const inboundWhatsappCliente = conversaDepois.mensagens.filter(
        (mensagem: { origem?: string; remetente?: string }) =>
          mensagem.origem === "whatsapp" && mensagem.remetente === "cliente"
      );
      expect(inboundWhatsappCliente).toHaveLength(1);

      const outbox = await app.inject({
        method: "GET",
        url: "/automacoes/whatsapp/outbox/saude",
        headers
      });
      expect(outbox.statusCode).toBe(200);
      expect(outbox.json()).toEqual(expect.objectContaining({ total: 1, pendentes: 1 }));
    } finally {
      await app.close();
    }
  });

  it("simula chat recebido via webhook Evolution e associa a conversa ao negócio da instância", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const instancia = await criarInstanciaEvolutionTeste(app, headers, {
        nome: "loja_webhook",
        etiqueta: "Loja Webhook"
      });
      expect(instancia.statusCode).toBe(201);

      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "loja_webhook",
          data: {
            pushName: "Cliente Webhook",
            key: {
              remoteJid: "244923333222@s.whatsapp.net",
              fromMe: false,
              id: "INBOUND_WEBHOOK_NEGOCIO"
            },
            message: {
              conversation: "Olá, quero simular o chat pelo sistema"
            }
          }
        }
      });
      expect(webhook.statusCode).toBe(202);
      expect(webhook.json().mensagem.direcao).toBe("INBOUND");

      await aguardarProcessamentoEventos();

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);
      expect(conversas.json().conversas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telefone: "923333222",
            mensagens: expect.arrayContaining([
              expect.objectContaining({
                remetente: "cliente",
                origem: "whatsapp",
                providerMessageId: "INBOUND_WEBHOOK_NEGOCIO",
                conteudo: "Olá, quero simular o chat pelo sistema"
              })
            ])
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("recebe comprovativo PDF pelo webhook Evolution, extrai dados e associa ao cliente da conversa", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const instancia = await criarInstanciaEvolutionTeste(app, headers, {
        nome: "loja_pdf",
        etiqueta: "Loja PDF"
      });
      expect(instancia.statusCode).toBe(201);

      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "loja_pdf",
          data: {
            pushName: "Cliente PDF",
            key: {
              remoteJid: "244923444555@s.whatsapp.net",
              fromMe: false,
              id: "PDF_COMPROVATIVO_1"
            },
            message: {
              documentMessage: {
                mimetype: "application/pdf",
                fileName: "comprovativo-bai.pdf",
                caption: "",
                media: `data:application/pdf;base64,${pdfComprovativoBase64()}`
              }
            }
          }
        }
      });

      expect(webhook.statusCode).toBe(202);
      expect(webhook.json().mensagem).toEqual(
        expect.objectContaining({
          direcao: "INBOUND",
          telefone: "923444555",
          tipoMensagem: "document",
          media: expect.objectContaining({
            mimeType: "application/pdf",
            fileName: "comprovativo-bai.pdf"
          })
        })
      );

      await aguardarProcessamentoEventos();

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);
      const conversa = conversas.json().conversas.find((item: { telefone: string }) => item.telefone === "923444555");
      expect(conversa).toEqual(expect.objectContaining({ telefone: "923444555" }));
      expect(conversa.mensagens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            remetente: "cliente",
            origem: "whatsapp",
            tipo: "COMPROVATIVO_PAGAMENTO",
            providerMessageId: "PDF_COMPROVATIVO_1",
            conteudo: expect.stringContaining("comprovativo-bai.pdf"),
            contexto: expect.objectContaining({
              media: expect.objectContaining({
                mimeType: "application/pdf",
                fileName: "comprovativo-bai.pdf"
              }),
              comprovativo: expect.objectContaining({
                tipo: "pdf",
                textoExtraido: expect.stringContaining("TX123456"),
                referencia: "TX123456",
                valorEmKwanza: 15000
              })
            })
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("baixa comprovativo PDF recebido apenas por URL, extrai dados e associa ao cliente", async () => {
    const servidorPdf = await criarServidorPdf(Buffer.from(pdfComprovativoBase64(), "base64"));
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const instancia = await criarInstanciaEvolutionTeste(app, headers, {
        nome: "loja_pdf_url",
        etiqueta: "Loja PDF URL"
      });
      expect(instancia.statusCode).toBe(201);

      const webhook = await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.upsert",
          instance: "loja_pdf_url",
          data: {
            pushName: "Cliente PDF URL",
            key: {
              remoteJid: "244923555666@s.whatsapp.net",
              fromMe: false,
              id: "PDF_COMPROVATIVO_URL_1"
            },
            message: {
              documentMessage: {
                mimetype: "application/pdf",
                fileName: "comprovativo-url-bai.pdf",
                mediaUrl: servidorPdf.url
              }
            }
          }
        }
      });

      expect(webhook.statusCode).toBe(202);
      expect(webhook.json().mensagem).toEqual(
        expect.objectContaining({
          direcao: "INBOUND",
          telefone: "923555666",
          tipoMensagem: "document",
          media: expect.objectContaining({
            url: servidorPdf.url,
            mimeType: "application/pdf"
          })
        })
      );

      await aguardarProcessamentoEventos(150);

      const conversas = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      expect(conversas.statusCode).toBe(200);
      const conversa = conversas.json().conversas.find((item: { telefone: string }) => item.telefone === "923555666");
      expect(conversa).toEqual(expect.objectContaining({ telefone: "923555666" }));
      expect(conversa.mensagens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            remetente: "cliente",
            origem: "whatsapp",
            tipo: "COMPROVATIVO_PAGAMENTO",
            providerMessageId: "PDF_COMPROVATIVO_URL_1",
            conteudo: expect.stringContaining("comprovativo-url-bai.pdf"),
            contexto: expect.objectContaining({
              media: expect.objectContaining({
                mimeType: "application/pdf",
                fileName: "comprovativo-url-bai.pdf",
                originalUrl: servidorPdf.url
              }),
              comprovativo: expect.objectContaining({
                referencia: "TX123456",
                valorEmKwanza: 15000
              })
            })
          })
        ])
      );
    } finally {
      await app.close();
      await servidorPdf.close();
    }
  });

  it("permite gerir a conversa como CRM: responsável, estado, nota interna, política e sugestão IA", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      await criarPeca(app, headers, "93");
      await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_crm_gestao",
          username: "cliente_gestao",
          displayName: "Cliente Gestão",
          commentText: "923456789 artigo 93"
        }
      });

      const antes = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      const conversaAntes = antes.json().conversas.find((item: { telefone: string }) => item.telefone === "923456789");
      expect(conversaAntes.conversaCrmId).toBeTruthy();

      const atualizacao = await app.inject({
        method: "PATCH",
        url: `/atendimento/conversas/${conversaAntes.conversaCrmId}`,
        headers,
        payload: {
          estado: "AGUARDANDO_HUMANO",
          prioridade: "ALTA",
          responsavelId: "agente-carlos",
          tags: ["pagamento", "vip"]
        }
      });
      expect(atualizacao.statusCode).toBe(200);
      expect(atualizacao.json().conversa).toEqual(
        expect.objectContaining({
          estado: "AGUARDANDO_HUMANO",
          prioridade: "ALTA",
          responsavelId: "agente-carlos",
          tags: ["pagamento", "vip"]
        })
      );

      const politica = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaAntes.conversaCrmId}/politica`,
        headers,
        payload: { politica: "EXIGIR_HUMANO" }
      });
      expect(politica.statusCode).toBe(200);
      expect(politica.json().politicaAutomacao).toBe("EXIGIR_HUMANO");

      const nota = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaAntes.conversaCrmId}/notas`,
        headers,
        payload: { texto: "Cliente pediu confirmação manual antes do pagamento." }
      });
      expect(nota.statusCode).toBe(201);
      expect(nota.json().mensagem).toEqual(
        expect.objectContaining({
          remetente: "agente",
          canal: "interno",
          tipo: "NOTA_INTERNA",
          origem: "nota_interna"
        })
      );

      const sugestao = await app.inject({
        method: "POST",
        url: `/atendimento/conversas/${conversaAntes.conversaCrmId}/sugestoes`,
        headers,
        payload: {
          texto: "Olá, confirmamos a tua reserva. Podes enviar o comprovativo por aqui.",
          regra: "reserva_aguarda_pagamento",
          confianca: 0.91,
          dadosConsultados: { reserva: "WAITING_PAYMENT" }
        }
      });
      expect(sugestao.statusCode).toBe(201);
      expect(sugestao.json().mensagem).toEqual(
        expect.objectContaining({
          remetente: "sistema",
          canal: "interno",
          tipo: "SUGESTAO_IA",
          status: "QUEUED",
          origem: "ia_sugestao",
          contexto: expect.objectContaining({
            exigeAprovacaoHumana: true,
            decisaoAutomatica: expect.objectContaining({
              regra: "reserva_aguarda_pagamento",
              confianca: 0.91,
              acao: "SUGERIR_RESPOSTA"
            })
          })
        })
      );

      const depois = await app.inject({ method: "GET", url: "/atendimento/conversas", headers });
      const conversaDepois = depois.json().conversas.find((item: { telefone: string }) => item.telefone === "923456789");

      expect(conversaDepois).toEqual(
        expect.objectContaining({
          conversaCrmId: conversaAntes.conversaCrmId,
          estadoCrm: "AGUARDANDO_HUMANO",
          prioridade: "ALTA",
          responsavelId: "agente-carlos",
          politicaAutomacao: "EXIGIR_HUMANO"
        })
      );
      expect(conversaDepois.tags).toEqual(expect.arrayContaining(["pagamento", "vip", "politica:EXIGIR_HUMANO"]));
      expect(conversaDepois.mensagens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            remetente: "agente",
            origem: "nota_interna",
            conteudo: "Cliente pediu confirmação manual antes do pagamento."
          }),
          expect.objectContaining({
            remetente: "sistema",
            origem: "ia_sugestao",
            status: "QUEUED",
            contexto: expect.objectContaining({ exigeAprovacaoHumana: true })
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("deduplica comentários repetidos da live na timeline do atendimento", async () => {
    const eventos = new DespachadorEventos();
    const atendimento = new RepositorioAtendimentoMemoria();
    const auditoria = new RepositorioAuditoriaMemoria();
    new AtendimentoCrmUseCase(eventos, atendimento, auditoria, {
      error: () => undefined,
      warn: () => undefined
    });

    const comentario = {
      source: "tiktok",
      provider: "manual",
      liveId: "live_dup",
      username: "cliente_dup",
      displayName: "Cliente Dup",
      commentText: "923456789 artigo 94",
      timestamp: new Date("2026-05-23T20:00:00.000Z")
    };
    const interpretacao = {
      intent: "BUY",
      phone: "923456789",
      productCode: "94",
      productCodes: ["94"],
      confidence: 0.95,
      requiresManualReview: false,
      reasons: []
    };

    eventos.emitir("COMMENT_PARSED", { comentario, interpretacao });
    eventos.emitir("COMMENT_PARSED", { comentario, interpretacao });
    await aguardarProcessamentoEventos();

    const conversas = await atendimento.listarConversasComMensagens();
    const mensagensComentario = conversas
      .flatMap((conversa) => conversa.mensagens)
      .filter((mensagem) => mensagem.origem === "comentario_live");

    expect(mensagensComentario).toHaveLength(1);
    expect(mensagensComentario[0].providerMessageId).toMatch(/^comentario-live:/);
  });

  it("não reenfileira indefinidamente quando o reprocessamento assíncrono da Evolution volta a falhar", async () => {
    const eventos = new DespachadorEventos();
    const atendimento = new RepositorioAtendimentoMemoria();
    const auditoria = new RepositorioAuditoriaMemoria();
    const avisos: string[] = [];
    new AtendimentoCrmUseCase(eventos, atendimento, auditoria, {
      error: () => undefined,
      warn: (mensagem) => avisos.push(String(mensagem))
    });

    eventos.emitir("WHATSAPP_MESSAGE_SENT", {
      telefone: "923456789",
      tipo: "RESERVA_CRIADA",
      conteudo: "Reserva criada",
      contexto: { reserva: { id: "reserva_1", nomeCliente: "Cliente" } },
      provider: "evolution",
      idExterno: "msg_original",
      enviadoEm: new Date()
    });
    await aguardarProcessamentoEventos();

    eventos.emitir("WHATSAPP_MESSAGE_STATUS", {
      status: {
        idMensagem: "msg_original",
        statusProvider: "ERROR"
      }
    });
    await aguardarProcessamentoEventos();

    eventos.emitir("WHATSAPP_MESSAGE_SENT", {
      telefone: "923456789",
      tipo: "RESERVA_CRIADA",
      conteudo: "Reserva criada",
      contexto: { reprocessamento: "status_evolution", providerMessageId: "msg_original" },
      provider: "evolution",
      idExterno: "msg_reprocessada",
      enviadoEm: new Date()
    });
    await aguardarProcessamentoEventos();

    eventos.emitir("WHATSAPP_MESSAGE_STATUS", {
      status: {
        idMensagem: "msg_reprocessada",
        statusProvider: "ERROR"
      }
    });
    await aguardarProcessamentoEventos();

    const resumo = await auditoria.resumirMensagensWhatsAppOutbox();
    const conversas = await atendimento.listarConversasComMensagens();
    const falhas = conversas.flatMap((conversa) => conversa.mensagens).filter((mensagem) => mensagem.status === "FAILED");

    expect(resumo).toEqual(expect.objectContaining({ total: 1, pendentes: 1 }));
    expect(falhas).toHaveLength(2);
    expect(falhas.at(-1)?.erro).toContain("faça logout/conecte novamente por QR");
    expect(falhas.at(-1)?.erro).toContain("provider Baileys");
    expect(avisos).toHaveLength(1);
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000010", nome: "Vendedor CRM" }
  });

  const codigo = respostaCodigo.json().codigoDev;
  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000010", codigo }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarPeca(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string
) {
  await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Artigo ${codigo}`,
      descricao: "Peça CRM",
      precoEmKwanza: 12000,
      quantidade: 1,
      fotos: []
    }
  });
}

async function criarInstanciaEvolutionTeste(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: { nome: string; etiqueta: string }
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ instance: { state: "open" } }), { status: 200 }))
  );
  try {
    return await app.inject({
      method: "POST",
      url: "/evolution/instancias",
      headers,
      payload: {
        ...dados,
        baseUrl: "https://evolution.local",
        apiKey: "api_key",
        padrao: true
      }
    });
  } finally {
    vi.unstubAllGlobals();
  }
}

function aguardarProcessamentoEventos(ms = 25) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function criarServidorPdf(buffer: Buffer) {
  const server = createServer((_, response) => {
    response.writeHead(200, {
      "content-type": "application/pdf",
      "content-length": String(buffer.length)
    });
    response.end(buffer);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/comprovativo.pdf`,
    close: () => new Promise<void>((resolve, reject) => server.close((erro) => (erro ? reject(erro) : resolve())))
  };
}

function pdfComprovativoBase64() {
  const textoPdf = [
    "%PDF-1.1",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    "4 0 obj << /Length 116 >> stream",
    "BT /F1 12 Tf 72 720 Td (Comprovativo BAI Valor 15000 Kz Referencia TX123456 Cliente Carlos) Tj ET",
    "endstream endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "trailer << /Root 1 0 R >>",
    "%%EOF"
  ].join("\n");
  return Buffer.from(textoPdf).toString("base64");
}
