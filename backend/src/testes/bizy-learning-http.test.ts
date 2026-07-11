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
      expect(produtoPago.json().produto).toEqual(
        expect.objectContaining({
          preview: expect.objectContaining({
            conteudoPremiumProtegido: true,
            licoes: expect.any(Array)
          }),
          checkout: expect.objectContaining({
            requerPagamento: true,
            emiteDocumento: true,
            permiteComprovativo: true
          }),
          seo: expect.objectContaining({
            urlCanonica: "/learning/produtos/vender-no-bizy-market"
          })
        })
      );

      const headers = await autenticar(app);
      const perfilStudio = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "academia-qa-learning",
          descricaoPublica: "Academia digital para equipas que vendem e operam no Bizy.",
          publicada: false,
          criacao: { confirmar: true },
          identidade: {
            nomeComercial: "Academia QA Learning",
            descricaoPublica: "Cursos, mentorias e comunidade para equipas de venda.",
            provincia: "Luanda",
            municipio: "Talatona"
          },
          publicacao: {
            slug: "academia-qa-learning",
            publicada: false,
            participaNoMarket: false,
            participaNoLearning: true,
            learning: {
              ativa: true,
              publicada: true,
              slug: "academia-qa-learning",
              nomePublico: "Academia QA Learning",
              descricaoPublica: "Cursos, mentorias e comunidade para equipas de venda.",
              categorias: ["Vendas", "Team", "Mentoria"],
              canaisSuporte: ["Team", "Comunidade"],
              politicaSuporte: "Suporte pelo Team em até 2 dias úteis."
            }
          }
        }
      });
      expect(perfilStudio.statusCode).toBe(200);

      const homeComPerfil = await app.inject({ method: "GET", url: "/publico/learning" });
      expect(homeComPerfil.statusCode).toBe(200);
      expect(homeComPerfil.json().metricas.perfisPublicos).toBeGreaterThanOrEqual(1);
      expect(homeComPerfil.json().perfisPublicos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            slug: "academia-qa-learning",
            nomePublico: "Academia QA Learning",
            categorias: expect.arrayContaining(["Vendas", "Team"]),
            metricas: expect.objectContaining({ programas: 0 })
          })
        ])
      );

      const perfilPublicoInicial = await app.inject({ method: "GET", url: "/publico/learning/perfis/academia-qa-learning" });
      expect(perfilPublicoInicial.statusCode).toBe(200);
      expect(perfilPublicoInicial.json().perfil).toEqual(
        expect.objectContaining({
          slug: "academia-qa-learning",
          programas: []
        })
      );

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

      const perfilPublicoComPrograma = await app.inject({ method: "GET", url: "/publico/learning/perfis/academia-qa-learning" });
      expect(perfilPublicoComPrograma.statusCode).toBe(200);
      expect(perfilPublicoComPrograma.json().perfil.metricas.programas).toBeGreaterThanOrEqual(1);
      expect(perfilPublicoComPrograma.json().perfil.programas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            slug: programa.slug,
            origem: "TEAM",
            estado: "PUBLICADO",
            visibilidade: "PUBLICO"
          })
        ])
      );

      const produtoPerfil = await app.inject({ method: "GET", url: `/publico/learning/produtos/${programa.slug}` });
      expect(produtoPerfil.statusCode).toBe(200);
      expect(produtoPerfil.json().produto).toEqual(
        expect.objectContaining({
          perfil: expect.objectContaining({
            slug: "academia-qa-learning",
            origem: "PERFIL"
          }),
          preview: expect.objectContaining({
            licoesLiberadas: expect.any(Number),
            licoesBloqueadas: expect.any(Number),
            conteudoPremiumProtegido: false
          }),
          checkout: expect.objectContaining({
            textoBotao: "Inscrever grátis",
            politicaAcesso: expect.any(Object)
          }),
          relacionados: expect.any(Array),
          sinaisConfianca: expect.arrayContaining(["Vendido por Academia QA Learning"])
        })
      );

      const eventoVisualizacao = await app.inject({
        method: "POST",
        url: "/publico/learning/eventos",
        payload: {
          tipo: "VISUALIZACAO",
          programaSlug: programa.slug,
          perfilSlug: "academia-qa-learning",
          fonte: "teste-http"
        }
      });
      expect(eventoVisualizacao.statusCode).toBe(201);

      const eventoPreview = await app.inject({
        method: "POST",
        url: "/publico/learning/eventos",
        payload: {
          tipo: "PREVIEW",
          programaSlug: programa.slug,
          perfilSlug: "academia-qa-learning",
          fonte: "teste-http"
        }
      });
      expect(eventoPreview.statusCode).toBe(201);

      const analyticsPublico = await app.inject({
        method: "GET",
        url: "/learning/team/analytics",
        headers
      });
      expect(analyticsPublico.statusCode).toBe(200);
      expect(analyticsPublico.json().metricas).toEqual(
        expect.objectContaining({
          visualizacoesPublicas: 1,
          previewsPublicos: 1,
          produtosComEventos: 1
        })
      );
      expect(analyticsPublico.json().produtos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            programaSlug: programa.slug,
            visualizacoes: 1,
            previews: 1
          })
        ])
      );

      const homeComProgramaTeam = await app.inject({ method: "GET", url: "/publico/learning" });
      expect(homeComProgramaTeam.statusCode).toBe(200);
      expect(homeComProgramaTeam.json().programas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            slug: programa.slug,
            origem: "TEAM",
            estado: "PUBLICADO"
          })
        ])
      );

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
          formacoesObrigatorias: expect.any(Number),
          visualizacoesPublicas: 1,
          previewsPublicos: 1
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

      const denuncia = await app.inject({
        method: "POST",
        url: "/learning/team/moderacao/denuncias",
        headers,
        payload: {
          alvoTipo: "POST",
          alvoId: postComunidade.json().post.id,
          comunidadeId: comunidade.json().comunidade.id,
          motivo: "CONTEUDO_SENSIVEL",
          severidade: "ALTA",
          descricao: "Material precisa de revisão antes de ficar disponível para membros da comunidade."
        }
      });
      expect(denuncia.statusCode).toBe(201);
      expect(denuncia.json().caso).toEqual(
        expect.objectContaining({
          alvoTipo: "POST",
          alvoId: postComunidade.json().post.id,
          estado: "ABERTO",
          ocultoPublicamente: false
        })
      );

      const filaModeracao = await app.inject({
        method: "GET",
        url: "/learning/team/moderacao",
        headers
      });
      expect(filaModeracao.statusCode).toBe(200);
      expect(filaModeracao.json().casos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: denuncia.json().caso.id,
            severidade: "ALTA"
          })
        ])
      );

      const decisaoModeracao = await app.inject({
        method: "PATCH",
        url: `/learning/team/moderacao/${denuncia.json().caso.id}`,
        headers,
        payload: {
          acao: "OCULTAR_TEMPORARIAMENTE",
          decisao: "Ocultar material até validação do mentor responsável."
        }
      });
      expect(decisaoModeracao.statusCode).toBe(200);
      expect(decisaoModeracao.json().caso).toEqual(
        expect.objectContaining({
          id: denuncia.json().caso.id,
          estado: "OCULTO_TEMPORARIAMENTE",
          ocultoPublicamente: true,
          decisao: expect.stringContaining("Ocultar material")
        })
      );

      const resumoComModeracao = await app.inject({
        method: "GET",
        url: "/learning/team/resumo",
        headers
      });
      expect(resumoComModeracao.statusCode).toBe(200);
      expect(resumoComModeracao.json().metricas).toEqual(
        expect.objectContaining({
          denunciasLearning: expect.any(Number),
          casosModeracaoAbertos: expect.any(Number),
          conteudosOcultosLearning: expect.any(Number)
        })
      );
      expect(resumoComModeracao.json().moderacao).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: denuncia.json().caso.id,
            estado: "OCULTO_TEMPORARIAMENTE"
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

      const playerInicial = await app.inject({
        method: "GET",
        url: `/learning/player/programas/${programa.slug}`,
        headers
      });
      expect(playerInicial.statusCode).toBe(200);
      expect(playerInicial.json()).toEqual(
        expect.objectContaining({
          programa: expect.objectContaining({ slug: programa.slug }),
          progresso: expect.objectContaining({ programaSlug: programa.slug, inscrito: true }),
          seguranca: expect.objectContaining({
            cache: "no-store",
            acessoValidadoEm: expect.any(String)
          })
        })
      );

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
          codigoVerificacao: expect.any(String),
          badge: expect.objectContaining({
            issuer: "BIZY_LEARNING",
            achievementType: "CERTIFICATE"
          }),
          verificacao: expect.objectContaining({
            metodo: "CODIGO"
          })
        })
      );

      const eventoPlayer = await app.inject({
        method: "POST",
        url: "/learning/player/eventos",
        headers,
        payload: {
          programaSlug: programa.slug,
          verbo: "VIEWED",
          objetoTipo: "LICAO",
          objetoId: licaoId,
          resultado: { segundos: 120 },
          contexto: { player: "web" },
          idempotencyKey: `teste-player-${programa.slug}-${licaoId}`
        }
      });
      expect(eventoPlayer.statusCode).toBe(201);
      expect(eventoPlayer.json().experiencia).toEqual(
        expect.objectContaining({
          programaSlug: programa.slug,
          verbo: "VIEWED",
          origem: "PLAYER"
        })
      );

      const experiencia = await app.inject({
        method: "POST",
        url: "/learning/team/experiencias",
        headers,
        payload: {
          programaSlug: programa.slug,
          verbo: "COMPLETED",
          objetoTipo: "PROGRAMA",
          objetoId: programa.slug,
          origem: "PLAYER",
          resultado: { percentual: 100 },
          contexto: { player: "bizy-learning" },
          idempotencyKey: `teste-experiencia-${programa.slug}`
        }
      });
      expect(experiencia.statusCode).toBe(201);
      expect(experiencia.json().experiencia).toEqual(
        expect.objectContaining({
          programaSlug: programa.slug,
          verbo: "COMPLETED",
          objetoTipo: "PROGRAMA"
        })
      );

      const experiencias = await app.inject({
        method: "GET",
        url: `/learning/team/experiencias?programaSlug=${programa.slug}`,
        headers
      });
      expect(experiencias.statusCode).toBe(200);
      expect(experiencias.json().experiencias).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: experiencia.json().experiencia.id })
        ])
      );

      const certificadoVerificado = await app.inject({
        method: "GET",
        url: `/learning/team/certificados/${encodeURIComponent(certificado.json().certificado.codigoVerificacao)}`,
        headers
      });
      expect(certificadoVerificado.statusCode).toBe(200);
      expect(certificadoVerificado.json().certificado).toEqual(
        expect.objectContaining({
          codigoVerificacao: certificado.json().certificado.codigoVerificacao,
          estado: "VALIDO"
        })
      );

      const certificadoPublico = await app.inject({
        method: "GET",
        url: `/publico/learning/certificados/${encodeURIComponent(certificado.json().certificado.negocioId)}/${encodeURIComponent(certificado.json().certificado.codigoVerificacao)}`
      });
      expect(certificadoPublico.statusCode).toBe(200);
      expect(certificadoPublico.json()).toEqual(
        expect.objectContaining({
          certificado: expect.objectContaining({
            codigoVerificacao: certificado.json().certificado.codigoVerificacao,
            estado: "VALIDO",
            titularHash: expect.any(String),
            badge: expect.objectContaining({ achievementType: "CERTIFICATE" })
          }),
          verificacao: expect.objectContaining({ valido: true })
        })
      );
      expect(JSON.stringify(certificadoPublico.json())).not.toContain(certificado.json().certificado.usuarioId);

      const certificadoExportado = await app.inject({
        method: "GET",
        url: `/learning/team/certificados/${encodeURIComponent(certificado.json().certificado.codigoVerificacao)}/exportar`,
        headers
      });
      expect(certificadoExportado.statusCode).toBe(200);
      expect(certificadoExportado.json()).toEqual(
        expect.objectContaining({
          formato: "bizy.learning.certificate.export.v1",
          certificado: expect.objectContaining({
            codigoVerificacao: certificado.json().certificado.codigoVerificacao
          }),
          badge: expect.objectContaining({
            formato: "open-badges-lite.v1",
            credentialSubject: expect.objectContaining({
              id: expect.stringMatching(/^sha256:/)
            })
          }),
          auditoria: expect.objectContaining({
            algoritmo: "sha256",
            hash: expect.any(String),
            preservaEventoOriginal: true
          })
        })
      );

      const certificadoRevogado = await app.inject({
        method: "POST",
        url: `/learning/team/certificados/${encodeURIComponent(certificado.json().certificado.codigoVerificacao)}/revogar`,
        headers,
        payload: { motivo: "Critério de conclusão revisto no teste." }
      });
      expect(certificadoRevogado.statusCode).toBe(200);
      expect(certificadoRevogado.json().certificado).toEqual(
        expect.objectContaining({
          codigoVerificacao: certificado.json().certificado.codigoVerificacao,
          estado: "REVOGADO",
          motivoRevogacao: "Critério de conclusão revisto no teste."
        })
      );

      const certificadoPublicoRevogado = await app.inject({
        method: "GET",
        url: `/publico/learning/certificados/${encodeURIComponent(certificado.json().certificado.negocioId)}/${encodeURIComponent(certificado.json().certificado.codigoVerificacao)}`
      });
      expect(certificadoPublicoRevogado.statusCode).toBe(200);
      expect(certificadoPublicoRevogado.json().verificacao.valido).toBe(false);
      expect(certificadoPublicoRevogado.json().certificado.estado).toBe("REVOGADO");

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

      const checkoutAjustavel = await app.inject({
        method: "POST",
        url: "/learning/checkout",
        headers,
        payload: {
          programaSlug: "vender-no-bizy-market",
          compradorNome: "Comprador Reembolso Learning",
          metodoPagamento: "Pagamento manual",
          referenciaPagamento: "PAY-LEARNING-REFUND-001",
          confirmarPagamento: true
        }
      });
      expect(checkoutAjustavel.statusCode).toBe(201);
      expect(checkoutAjustavel.json().entitlement).toEqual(expect.objectContaining({ estado: "ATIVO", origem: "CHECKOUT" }));

      const ajusteCompra = await app.inject({
        method: "POST",
        url: `/learning/team/compras/${checkoutAjustavel.json().compra.id}/ajustar`,
        headers,
        payload: {
          estado: "REEMBOLSADO",
          motivo: "Reembolso solicitado no teste.",
          revogarAcesso: true
        }
      });
      expect(ajusteCompra.statusCode).toBe(200);
      expect(ajusteCompra.json().compra).toEqual(
        expect.objectContaining({
          id: checkoutAjustavel.json().compra.id,
          estado: "REEMBOLSADO",
          motivoAjuste: "Reembolso solicitado no teste."
        })
      );
      expect(ajusteCompra.json().entitlementsRevogados).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: checkoutAjustavel.json().entitlement.id,
            estado: "REVOGADO"
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
      expect(acessos.json().entitlements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: checkoutAjustavel.json().entitlement.id,
            estado: "REVOGADO"
          })
        ])
      );
      expect(acessos.json().certificados).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ programaSlug: programa.slug, estado: "REVOGADO" })
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
