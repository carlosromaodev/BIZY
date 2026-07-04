import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Bizy Learning HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      OMBALA_API_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("expõe home própria e administra programas/progresso pelo Team", async () => {
    const app = await criarAplicacao();

    try {
      const home = await app.inject({ method: "GET", url: "/publico/learning" });
      expect(home.statusCode).toBe(200);
      expect(home.json()).toEqual(
        expect.objectContaining({
          produto: "Bizy Learning",
          programas: expect.arrayContaining([
            expect.objectContaining({
              slug: "operar-bizy-team",
              visibilidade: "PUBLICO"
            })
          ]),
          perfis: expect.arrayContaining([
            expect.objectContaining({ codigo: "DONO", podeAdministrar: true })
          ])
        })
      );

      const detalhePublico = await app.inject({ method: "GET", url: "/publico/learning/programas/operar-bizy-team" });
      expect(detalhePublico.statusCode).toBe(200);
      expect(detalhePublico.json().programa.titulo).toContain("Bizy Team");

      const produtoPago = await app.inject({ method: "GET", url: "/publico/learning/produtos/vender-no-bizy-market" });
      expect(produtoPago.statusCode).toBe(200);
      expect(produtoPago.json().programa).toEqual(
        expect.objectContaining({
          tipoAcesso: "PAGO",
          oferta: expect.objectContaining({ emiteDocumento: true, permiteComprovativo: true })
        })
      );

      const headers = await autenticar(app);

      const checkout = await app.inject({
        method: "POST",
        url: "/learning/checkout",
        headers,
        payload: {
          programaSlug: "vender-no-bizy-market",
          compradorNome: "Gestor Learning",
          metodoPagamento: "Pagamento manual",
          referenciaPagamento: "PAY-LEARNING-001",
          confirmarPagamento: true
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json().compra).toEqual(
        expect.objectContaining({
          programaSlug: "vender-no-bizy-market",
          estado: "CONFIRMADO",
          factura: expect.objectContaining({ origemTipo: "LEARNING" })
        })
      );
      expect(checkout.json().entitlement).toEqual(expect.objectContaining({ estado: "ATIVO", origem: "CHECKOUT" }));

      const resumoInicial = await app.inject({
        method: "GET",
        url: "/learning/team/resumo",
        headers
      });
      expect(resumoInicial.statusCode).toBe(200);
      expect(resumoInicial.json()).toEqual(expect.objectContaining({ podeAdministrar: true }));
      expect(resumoInicial.json().metricas.programas).toBeGreaterThanOrEqual(4);
      expect(resumoInicial.json().chat).toEqual(
        expect.objectContaining({
          metricas: expect.objectContaining({ threads: expect.any(Number) }),
          threads: expect.arrayContaining([
            expect.objectContaining({ programaSlug: "vender-no-bizy-market" })
          ])
        })
      );

      const mensagemInterna = await app.inject({
        method: "POST",
        url: "/learning/team/programas/vender-no-bizy-market/chat/mensagens",
        headers,
        payload: {
          tipo: "DECISAO",
          contexto: "PROGRAMA",
          conteudo: "Validar cohort piloto com mentoria e checklist financeiro antes da publicação.",
          mencoes: ["FINANCEIRO", "GESTOR"]
        }
      });
      expect(mensagemInterna.statusCode).toBe(201);
      expect(mensagemInterna.json().mensagem).toEqual(
        expect.objectContaining({
          programaSlug: "vender-no-bizy-market",
          tipo: "DECISAO",
          autorPapel: "DONO"
        })
      );

      const chatPrograma = await app.inject({
        method: "GET",
        url: "/learning/team/programas/vender-no-bizy-market/chat",
        headers
      });
      expect(chatPrograma.statusCode).toBe(200);
      expect(chatPrograma.json().metricas.decisoes).toBe(1);
      expect(chatPrograma.json().threads[0].mensagens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            conteudo: expect.stringContaining("cohort piloto"),
            mencoes: expect.arrayContaining(["FINANCEIRO", "GESTOR"])
          })
        ])
      );

      const criacao = await app.inject({
        method: "POST",
        url: "/learning/team/programas",
        headers,
        payload: {
          titulo: "Piloto Learning de vendas por live",
          categoria: "Live",
          perfisAlvo: ["DONO", "VENDEDOR"],
          ownerPerfil: "GESTOR",
          resultadoEsperado: "Equipa consegue preparar uma live com checklist, oferta e atendimento.",
          licoes: [
            { titulo: "Preparar roteiro da live", tipo: "CHECKLIST", duracaoMinutos: 8 },
            { titulo: "Validar pedido gerado", tipo: "QUIZ", duracaoMinutos: 6 }
          ]
        }
      });
      expect(criacao.statusCode).toBe(201);
      const programa = criacao.json().programa;
      expect(programa).toEqual(
        expect.objectContaining({
          slug: "piloto-learning-de-vendas-por-live",
          origem: "TEAM",
          estado: "RASCUNHO",
          visibilidade: "TEAM"
        })
      );

      const publicacao = await app.inject({
        method: "PATCH",
        url: `/learning/team/programas/${programa.slug}/publicacao`,
        headers,
        payload: {
          estado: "PUBLICADO",
          visibilidade: "PUBLICO",
          destaque: true
        }
      });
      expect(publicacao.statusCode).toBe(200);
      expect(publicacao.json().programa).toEqual(expect.objectContaining({ estado: "PUBLICADO", visibilidade: "PUBLICO", destaque: true }));

      const atribuicao = await app.inject({
        method: "POST",
        url: `/learning/team/programas/${programa.slug}/atribuir`,
        headers,
        payload: {
          usuarioId: "membro-learning-001",
          obrigatoria: true,
          prazoAte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          mensagem: "Concluir antes de assumir a operação de lives no Team."
        }
      });
      expect(atribuicao.statusCode).toBe(201);
      expect(atribuicao.json().atribuicao).toEqual(
        expect.objectContaining({
          programaSlug: programa.slug,
          usuarioId: "membro-learning-001",
          obrigatoria: true,
          estado: "ATIVA",
          entitlementId: expect.any(String)
        })
      );
      expect(atribuicao.json().entitlement).toEqual(expect.objectContaining({ origem: "TEAM", usuarioId: "membro-learning-001" }));

      const resumoComAtribuicao = await app.inject({
        method: "GET",
        url: "/learning/team/resumo",
        headers
      });
      expect(resumoComAtribuicao.statusCode).toBe(200);
      expect(resumoComAtribuicao.json().metricas).toEqual(
        expect.objectContaining({
          atribuicoesAtivas: expect.any(Number),
          formacoesObrigatorias: expect.any(Number)
        })
      );
      expect(resumoComAtribuicao.json().atribuicoes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            programaTitulo: programa.titulo,
            estado: "ATIVA"
          })
        ])
      );

      const cohort = await app.inject({
        method: "POST",
        url: `/learning/team/programas/${programa.slug}/cohorts`,
        headers,
        payload: {
          titulo: "Turma piloto de live commerce",
          inicioEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          fimEm: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          vagas: 12,
          salaUrl: "https://meet.example.com/bizy-learning-live",
          replayDisponivel: true,
          regrasEntrada: "Entrada por atribuição Team ou compra Learning confirmada."
        }
      });
      expect(cohort.statusCode).toBe(201);
      expect(cohort.json().cohort).toEqual(
        expect.objectContaining({
          programaSlug: programa.slug,
          titulo: "Turma piloto de live commerce",
          estado: "AGENDADO",
          vagas: 12,
          replayDisponivel: true
        })
      );

      const presenca = await app.inject({
        method: "POST",
        url: `/learning/team/cohorts/${cohort.json().cohort.id}/presencas`,
        headers,
        payload: {
          usuarioId: "membro-learning-002",
          presente: true,
          notas: "Participou e precisa de follow-up financeiro."
        }
      });
      expect(presenca.statusCode).toBe(201);
      expect(presenca.json().presenca).toEqual(
        expect.objectContaining({
          cohortId: cohort.json().cohort.id,
          usuarioId: "membro-learning-002",
          presente: true,
          entitlementId: expect.any(String)
        })
      );
      expect(presenca.json().entitlement).toEqual(expect.objectContaining({ origem: "TEAM", usuarioId: "membro-learning-002" }));

      const cohorts = await app.inject({
        method: "GET",
        url: "/learning/team/cohorts",
        headers
      });
      expect(cohorts.statusCode).toBe(200);
      expect(cohorts.json().cohorts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: cohort.json().cohort.id,
            inscritos: 1,
            presencas: 1
          })
        ])
      );

      const resumoComCohort = await app.inject({
        method: "GET",
        url: "/learning/team/resumo",
        headers
      });
      expect(resumoComCohort.statusCode).toBe(200);
      expect(resumoComCohort.json().metricas).toEqual(
        expect.objectContaining({
          cohortsAtivos: expect.any(Number),
          vagasCohorts: expect.any(Number),
          presencasCohorts: expect.any(Number),
          replaysDisponiveis: expect.any(Number)
        })
      );
      expect(resumoComCohort.json().cohorts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            presencas: 1
          })
        ])
      );

      const comunidade = await app.inject({
        method: "POST",
        url: `/learning/team/programas/${programa.slug}/comunidades`,
        headers,
        payload: {
          titulo: "Comunidade piloto live commerce",
          acesso: "ENTITLEMENT",
          topicos: ["perguntas", "materiais", "desafios"],
          regras: "Participação exige acesso activo e moderação do Team.",
          moderadores: ["ADMIN", "GESTOR"]
        }
      });
      expect(comunidade.statusCode).toBe(201);
      expect(comunidade.json().comunidade).toEqual(
        expect.objectContaining({
          programaSlug: programa.slug,
          titulo: "Comunidade piloto live commerce",
          acesso: "ENTITLEMENT",
          estado: "PRIVADA"
        })
      );

      const postComunidade = await app.inject({
        method: "POST",
        url: `/learning/team/comunidades/${comunidade.json().comunidade.id}/posts`,
        headers,
        payload: {
          tipo: "ANUNCIO",
          titulo: "Materiais da live",
          conteudo: "Replay, checklist e desafio de venda ficam ligados a esta comunidade.",
          fixado: true
        }
      });
      expect(postComunidade.statusCode).toBe(201);
      expect(postComunidade.json().post).toEqual(
        expect.objectContaining({
          comunidadeId: comunidade.json().comunidade.id,
          tipo: "ANUNCIO",
          fixado: true
        })
      );

      const comunidades = await app.inject({
        method: "GET",
        url: "/learning/team/comunidades",
        headers
      });
      expect(comunidades.statusCode).toBe(200);
      expect(comunidades.json().comunidades).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: comunidade.json().comunidade.id,
            posts: 1,
            anuncios: 1,
            postsRecentes: expect.arrayContaining([
              expect.objectContaining({ titulo: "Materiais da live" })
            ])
          })
        ])
      );

      const resumoComComunidade = await app.inject({
        method: "GET",
        url: "/learning/team/resumo",
        headers
      });
      expect(resumoComComunidade.statusCode).toBe(200);
      expect(resumoComComunidade.json().metricas).toEqual(
        expect.objectContaining({
          comunidadesAtivas: expect.any(Number),
          postsComunidade: expect.any(Number),
          anunciosComunidade: expect.any(Number),
          perguntasComunidade: expect.any(Number)
        })
      );
      expect(resumoComComunidade.json().comunidades).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            posts: 1
          })
        ])
      );

      const inscricao = await app.inject({
        method: "POST",
        url: `/learning/programas/${programa.slug}/inscrever`,
        headers
      });
      expect(inscricao.statusCode).toBe(201);
      expect(inscricao.json().inscricao).toEqual(expect.objectContaining({ programaSlug: programa.slug }));

      const licaoId = programa.licoes[0].id;
      const conclusao = await app.inject({
        method: "POST",
        url: `/learning/licoes/${encodeURIComponent(licaoId)}/concluir`,
        headers
      });
      expect(conclusao.statusCode).toBe(201);
      expect(conclusao.json().progresso.programas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            inscrito: true,
            percentual: 50
          })
        ])
      );

      const segundaConclusao = await app.inject({
        method: "POST",
        url: `/learning/licoes/${encodeURIComponent(programa.licoes[1].id)}/concluir`,
        headers
      });
      expect(segundaConclusao.statusCode).toBe(201);
      expect(segundaConclusao.json().progresso.programas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            concluido: true,
            percentual: 100
          })
        ])
      );

      const certificado = await app.inject({
        method: "POST",
        url: `/learning/programas/${programa.slug}/certificado`,
        headers
      });
      expect(certificado.statusCode).toBe(201);
      expect(certificado.json().certificado).toEqual(
        expect.objectContaining({
          programaSlug: programa.slug,
          estado: "VALIDO",
          codigoVerificacao: expect.any(String)
        })
      );

      const progresso = await app.inject({
        method: "GET",
        url: "/learning/progresso",
        headers
      });
      expect(progresso.statusCode).toBe(200);
      expect(progresso.json().programas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            concluido: true,
            licoesConcluidas: expect.arrayContaining([licaoId, programa.licoes[1].id])
          })
        ])
      );

      const acessos = await app.inject({
        method: "GET",
        url: "/learning/entitlements",
        headers
      });
      expect(acessos.statusCode).toBe(200);
      expect(acessos.json().compras).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ programaSlug: "vender-no-bizy-market", estado: "CONFIRMADO" })
        ])
      );
      expect(acessos.json().certificados).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ programaSlug: programa.slug, estado: "VALIDO" })
        ])
      );
    } finally {
      await app.close();
    }
  }, 30_000);
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923660777", nome: "Gestor Learning" }
  });
  expect(respostaCodigo.statusCode).toBe(202);

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923660777", codigo: respostaCodigo.json().codigoDev }
  });
  expect(respostaSessao.statusCode).toBe(200);

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
