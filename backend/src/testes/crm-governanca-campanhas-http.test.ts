import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
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

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarCliente(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  dados: Record<string, unknown>
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/clientes",
    headers,
    payload: dados
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("CRM+ governança, campanhas, eventos e jobs", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("gere templates, cria campanha WhatsApp segura, bloqueia opt-out e permite pausa imediata", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923771001", "Loja Campanhas");

      await criarCliente(app, headers, {
        telefone: "937771001",
        nome: "Cliente VIP Consentida",
        tags: ["vip"],
        consentimentoDados: true,
        consentimentoMarketing: true
      });
      await criarCliente(app, headers, {
        telefone: "937771002",
        nome: "Cliente VIP Optout",
        tags: ["vip"],
        consentimentoDados: true,
        consentimentoMarketing: false
      });

      const templateRascunho = await app.inject({
        method: "POST",
        url: "/whatsapp/templates",
        headers,
        payload: {
          nome: "Novidades VIP Maio",
          categoria: "marketing",
          idioma: "pt_AO",
          provider: "whatsapp_cloud_api",
          corpo: "Olá, {nomeCliente}. Chegaram novidades para clientes VIP.",
          variaveis: ["nomeCliente"],
          eventosCompativeis: ["CAMPAIGN_BROADCAST"],
          estadoAprovacao: "rascunho"
        }
      });
      expect(templateRascunho.statusCode).toBe(201);

      const campanhaSemTemplateAprovado = await app.inject({
        method: "POST",
        url: "/campanhas",
        headers,
        payload: {
          nome: "Campanha VIP bloqueada",
          objetivo: "Reativar clientes VIP",
          canal: "whatsapp",
          templateId: templateRascunho.json().template.id,
          categoria: "marketing",
          segmento: { tags: ["vip"] },
          limiteDiario: 100
        }
      });
      expect(campanhaSemTemplateAprovado.statusCode).toBe(400);
      expect(campanhaSemTemplateAprovado.json().mensagem).toContain("aprovado");

      const templateAprovado = await app.inject({
        method: "PATCH",
        url: `/whatsapp/templates/${templateRascunho.json().template.id}`,
        headers,
        payload: {
          estadoAprovacao: "aprovado",
          motivo: "Aprovado para teste operacional"
        }
      });
      expect(templateAprovado.statusCode).toBe(200);

      const templatesListados = await app.inject({
        method: "GET",
        url: "/whatsapp/templates?categoria=marketing&evento=CAMPAIGN_BROADCAST",
        headers
      });
      expect(templatesListados.statusCode).toBe(200);
      expect(templatesListados.json().templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: templateRascunho.json().template.id,
            origem: "negocio",
            estadoAprovacao: "aprovado"
          })
        ])
      );

      const campanhaSemSegmentoClaro = await app.inject({
        method: "POST",
        url: "/campanhas",
        headers,
        payload: {
          nome: "Campanha sem segmento",
          objetivo: "Evitar disparo amplo por acidente",
          canal: "whatsapp",
          templateId: templateRascunho.json().template.id,
          categoria: "marketing",
          limiteDiario: 100
        }
      });
      expect(campanhaSemSegmentoClaro.statusCode).toBe(400);
      expect(campanhaSemSegmentoClaro.json().mensagem).toContain("segmento");

      const campanha = await app.inject({
        method: "POST",
        url: "/campanhas",
        headers,
        payload: {
          nome: "Campanha VIP Maio",
          objetivo: "Reativar clientes VIP com novidades",
          canal: "whatsapp",
          templateId: templateRascunho.json().template.id,
          categoria: "marketing",
          segmento: { tags: ["vip"] },
          limiteDiario: 100,
          janelaEnvio: {
            inicio: "2026-05-25T09:00:00.000Z",
            fim: "2026-05-25T19:00:00.000Z"
          }
        }
      });
      expect(campanha.statusCode).toBe(201);
      expect(campanha.json().campanha).toEqual(
        expect.objectContaining({
          nome: "Campanha VIP Maio",
          estado: "RASCUNHO",
          categoria: "marketing"
        })
      );
      expect(campanha.json().preview).toEqual(
        expect.objectContaining({
          selecionados: 1,
          bloqueados: 1
        })
      );
      expect(campanha.json().preview.bloqueios[0]).toEqual(
        expect.objectContaining({
          motivo: expect.stringContaining("consentimento")
        })
      );

      const confirmacao = await app.inject({
        method: "POST",
        url: `/campanhas/${campanha.json().campanha.id}/confirmar`,
        headers,
        payload: { confirmar: true }
      });
      expect(confirmacao.statusCode).toBe(202);
      expect(confirmacao.json().campanha).toEqual(
        expect.objectContaining({
          estado: "AGENDADA"
        })
      );
      expect(confirmacao.json().resultado).toEqual(
        expect.objectContaining({
          enfileirados: 1,
          bloqueados: 1
        })
      );

      const outbox = await app.inject({
        method: "GET",
        url: "/automacoes/whatsapp/outbox",
        headers
      });
      expect(outbox.statusCode).toBe(200);
      expect(outbox.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telefone: "937771001",
            tipo: "CAMPANHA_WHATSAPP",
            contexto: expect.objectContaining({
              campanhaId: campanha.json().campanha.id,
              politicaWhatsApp: expect.objectContaining({ categoria: "marketing" })
            })
          })
        ])
      );

      const lojaPublica = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "loja-campanhas",
          descricaoPublica: "Loja usada para atribuir campanhas ao funil comercial.",
          publicada: true
        }
      });
      expect(lojaPublica.statusCode).toBe(200);

      const pedidoAtribuido = await app.inject({
        method: "POST",
        url: "/publico/tracking/eventos",
        payload: {
          slugLoja: "loja-campanhas",
          tipo: "PEDIDO_CRIADO",
          entidadeTipo: "pedido",
          entidadeId: "pedido-campanha-vip-1",
          trackingId: "trk-campanha-vip",
          origem: "campanha",
          canal: "whatsapp",
          utm: { utm_campaign: campanha.json().campanha.id },
          metadata: {
            totalEmKwanza: 37000,
            campanhaId: campanha.json().campanha.id
          }
        }
      });
      expect(pedidoAtribuido.statusCode).toBe(201);

      const resultados = await app.inject({
        method: "GET",
        url: `/campanhas/${campanha.json().campanha.id}/resultados`,
        headers
      });
      expect(resultados.statusCode).toBe(200);
      expect(resultados.json().metricas).toEqual(
        expect.objectContaining({
          selecionados: 1,
          bloqueados: 1,
          enfileirados: 1,
          pedidosGerados: 1,
          receitaAtribuidaEmKwanza: 37000
        })
      );

      const pausa = await app.inject({
        method: "POST",
        url: `/campanhas/${campanha.json().campanha.id}/pausar`,
        headers,
        payload: { motivo: "Correção no texto da campanha" }
      });
      expect(pausa.statusCode).toBe(200);
      expect(pausa.json().campanha).toEqual(
        expect.objectContaining({
          estado: "PAUSADA"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("desativa template substituído ou descontinuado e exige motivo operacional", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923771006", "Loja Ciclo Template");

      const template = await app.inject({
        method: "POST",
        url: "/whatsapp/templates",
        headers,
        payload: {
          nome: "Campanha Antiga",
          categoria: "marketing",
          idioma: "pt_AO",
          provider: "whatsapp_cloud_api",
          corpo: "Olá, {nomeCliente}. Temos novidades.",
          variaveis: ["nomeCliente"],
          eventosCompativeis: ["CAMPAIGN_BROADCAST"],
          estadoAprovacao: "aprovado"
        }
      });
      expect(template.statusCode).toBe(201);

      const semMotivo = await app.inject({
        method: "PATCH",
        url: `/whatsapp/templates/${template.json().template.id}`,
        headers,
        payload: {
          estadoAprovacao: "substituido"
        }
      });
      expect(semMotivo.statusCode).toBe(400);
      expect(semMotivo.json().mensagem).toContain("motivo");

      const substituido = await app.inject({
        method: "PATCH",
        url: `/whatsapp/templates/${template.json().template.id}`,
        headers,
        payload: {
          estadoAprovacao: "substituido",
          motivo: "Texto substituído por versão aprovada com nova oferta."
        }
      });
      expect(substituido.statusCode).toBe(200);
      expect(substituido.json().template).toEqual(
        expect.objectContaining({
          estadoAprovacao: "substituido",
          ativo: false,
          motivoUltimaAlteracao: "Texto substituído por versão aprovada com nova oferta."
        })
      );

      const aprovados = await app.inject({
        method: "GET",
        url: "/whatsapp/templates?apenasAprovados=true",
        headers
      });
      expect(aprovados.statusCode).toBe(200);
      expect(aprovados.json().templates).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: template.json().template.id
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("gere membros, papéis, eventos idempotentes e jobs de importação com relatório", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923771010", "Loja Governança");

      const papeis = await app.inject({
        method: "GET",
        url: "/negocio/papeis",
        headers
      });
      expect(papeis.statusCode).toBe(200);
      expect(papeis.json().papeis).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            papel: "DONO",
            permissoes: expect.arrayContaining(["configuracoes:gerir"])
          }),
          expect.objectContaining({
            papel: "FINANCEIRO",
            permissoes: expect.arrayContaining(["pagamentos:gerir"])
          })
        ])
      );

      const membro = await app.inject({
        method: "POST",
        url: "/negocio/membros",
        headers,
        payload: {
          telefone: "923771011",
          nome: "Ana Financeiro",
          papel: "FINANCEIRO"
        }
      });
      expect(membro.statusCode).toBe(201);
      expect(membro.json().membro).toEqual(
        expect.objectContaining({
          papel: "FINANCEIRO",
          status: "ATIVO"
        })
      );

      const membros = await app.inject({
        method: "GET",
        url: "/negocio/membros",
        headers
      });
      expect(membros.statusCode).toBe(200);
      expect(membros.json().membros).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ telefone: "923771011", papel: "FINANCEIRO" })
        ])
      );

      const atualizacaoMembro = await app.inject({
        method: "PATCH",
        url: `/negocio/membros/${membro.json().membro.id}`,
        headers,
        payload: {
          papel: "ATENDENTE",
          permissoes: ["clientes:ler", "conversas:gerir"],
          motivo: "Operadora saiu do financeiro e passou para atendimento."
        }
      });
      expect(atualizacaoMembro.statusCode).toBe(200);

      const auditoriaPermissoes = await app.inject({
        method: "GET",
        url: "/operacional/auditoria?topico=permissoes&tipo=MEMBRO_ATUALIZADO",
        headers
      });
      expect(auditoriaPermissoes.statusCode).toBe(200);
      expect(auditoriaPermissoes.json().logs).toEqual([
        expect.objectContaining({
          tipo: "MEMBRO_ATUALIZADO",
          entidadeTipo: "membro_negocio",
          entidadeId: membro.json().membro.id,
          payload: expect.objectContaining({
            atorUsuarioId: expect.any(String),
            motivo: "Operadora saiu do financeiro e passou para atendimento.",
            alteracoes: expect.objectContaining({
              papel: { antes: "FINANCEIRO", depois: "ATENDENTE" },
              permissoes: { antes: [], depois: ["clientes:ler", "conversas:gerir"] }
            })
          })
        })
      ]);

      const evento = await app.inject({
        method: "POST",
        url: "/eventos-operacionais",
        headers,
        payload: {
          topico: "social-inbox",
          tipo: "COMENTARIO_IMPORTADO",
          entidadeTipo: "social_comment",
          entidadeId: "comment_1",
          idempotencyKey: "social:comment:1",
          payload: { texto: "quero o vestido 01" }
        }
      });
      expect(evento.statusCode).toBe(201);

      const eventoRepetido = await app.inject({
        method: "POST",
        url: "/eventos-operacionais",
        headers,
        payload: {
          topico: "social-inbox",
          tipo: "COMENTARIO_IMPORTADO",
          entidadeTipo: "social_comment",
          entidadeId: "comment_1",
          idempotencyKey: "social:comment:1",
          payload: { texto: "duplicado" }
        }
      });
      expect(eventoRepetido.statusCode).toBe(200);
      expect(eventoRepetido.json()).toEqual(
        expect.objectContaining({
          duplicado: true,
          evento: expect.objectContaining({ id: evento.json().evento.id })
        })
      );

      const job = await app.inject({
        method: "POST",
        url: "/jobs/importacao/clientes",
        headers,
        payload: {
          idempotencyKey: "import-clientes-maio",
          csv: [
            "telefone,nome,consentimentoMarketing",
            "937771099,Cliente Job,true",
            "telefone_errado,Cliente Erro,true"
          ].join("\n")
        }
      });
      expect(job.statusCode).toBe(202);
      expect(job.json().job).toEqual(
        expect.objectContaining({
          tipo: "IMPORTACAO_CLIENTES",
          estado: "CONCLUIDO",
          total: 2,
          erros: 1
        })
      );
      expect(job.json().resultado).toEqual(
        expect.objectContaining({
          criados: 1,
          erros: 1
        })
      );

      const jobRepetido = await app.inject({
        method: "POST",
        url: "/jobs/importacao/clientes",
        headers,
        payload: {
          idempotencyKey: "import-clientes-maio",
          csv: "telefone,nome\n937771099,Cliente Duplicado"
        }
      });
      expect(jobRepetido.statusCode).toBe(200);
      expect(jobRepetido.json()).toEqual(
        expect.objectContaining({
          duplicado: true,
          job: expect.objectContaining({ id: job.json().job.id })
        })
      );

      const jobProdutos = await app.inject({
        method: "POST",
        url: "/jobs/importacao/produtos",
        headers,
        payload: {
          idempotencyKey: "import-produtos-maio",
          csv: [
            "codigo,nome,preco,quantidade,categoria,colecao",
            "JOB-1,Produto Job,12000,3,Roupas,Campanha Maio",
            "SEM-PRECO,Produto com erro,,2,Roupas,Campanha Maio"
          ].join("\n")
        }
      });
      expect(jobProdutos.statusCode).toBe(202);
      expect(jobProdutos.json().job).toEqual(
        expect.objectContaining({
          tipo: "IMPORTACAO_PRODUTOS",
          estado: "CONCLUIDO",
          total: 2,
          erros: 1
        })
      );
      expect(jobProdutos.json().resultado).toEqual(
        expect.objectContaining({
          criados: 1,
          erros: 1
        })
      );

      const jobProdutosRepetido = await app.inject({
        method: "POST",
        url: "/jobs/importacao/produtos",
        headers,
        payload: {
          idempotencyKey: "import-produtos-maio",
          csv: "codigo,nome,preco,quantidade\nJOB-1,Produto Duplicado,13000,4"
        }
      });
      expect(jobProdutosRepetido.statusCode).toBe(200);
      expect(jobProdutosRepetido.json()).toEqual(
        expect.objectContaining({
          duplicado: true,
          job: expect.objectContaining({ id: jobProdutos.json().job.id })
        })
      );
    } finally {
      await app.close();
    }
  });
});
