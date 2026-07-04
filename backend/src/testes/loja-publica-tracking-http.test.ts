import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

async function criarProduto(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string,
  quantidade: number,
  dados: Partial<{
    nome: string;
    descricao: string;
    categoria: string;
    colecao: string;
    precoEmKwanza: number;
    vitrine: Record<string, unknown>;
  }> = {}
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      sku: `SKU-${codigo}`,
      nome: dados.nome ?? `Produto ${codigo}`,
      descricao: dados.descricao ?? `Produto ${codigo} para loja pública`,
      precoEmKwanza: dados.precoEmKwanza ?? 12_500,
      custoEmKwanza: 7_500,
      quantidade,
      stockMinimo: 1,
      categoria: dados.categoria ?? "Roupas",
      colecao: dados.colecao ?? "Live atual",
      variantes: { tamanho: ["M", "G"] },
      fotos: [`https://example.com/${codigo}.png`],
      ...(dados.vitrine ? { vitrine: dados.vitrine } : {})
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("loja pública, catálogo digital e tracking HTTP", () => {
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

  it("autoriza subdomínio de loja publicada para TLS sob demanda", async () => {
    process.env.PUBLIC_STORE_DOMAIN = "usebizy.space";
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923444101", "Uorconnect");
      await criarProduto(app, headers, "SUB1", 5);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "uorconnect",
          descricaoPublica: "Loja com domínio próprio da Bizy.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const autorizado = await app.inject({
        method: "GET",
        url: "/publico/lojas/dominios/autorizar?domain=uorconnect.usebizy.space"
      });
      expect(autorizado.statusCode).toBe(200);
      expect(autorizado.json()).toEqual({ autorizado: true, slug: "uorconnect" });

      const reservado = await app.inject({
        method: "GET",
        url: "/publico/lojas/dominios/autorizar?domain=api.usebizy.space"
      });
      expect(reservado.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("submete formulário público de lead e atualiza o contador de respostas do Team", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923444888", "Loja Formulários");

      const publicar = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "loja-formularios",
          descricaoPublica: "Captação de leads por formulário público.",
          publicada: true
        }
      });
      expect(publicar.statusCode).toBe(200);

      const antes = await app.inject({
        method: "GET",
        url: "/formularios?limite=5",
        headers
      });
      expect(antes.statusCode).toBe(200);
      expect(antes.json().formularios[0].totalSubmissoes).toBe(0);

      const tarefasAntes = await app.inject({
        method: "GET",
        url: "/tarefas?tipo=LEAD_FORMULARIO&estado=ABERTA",
        headers
      });
      expect(tarefasAntes.statusCode).toBe(200);
      expect(tarefasAntes.json().tarefas).toHaveLength(0);

      const submissao = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-formularios/formularios/lead",
        payload: {
          nome: "Ana Lead",
          telefone: "923444555",
          email: "ana.lead@example.com",
          produtoInteresse: "Vestido azul",
          mensagem: "Quero saber mais sobre disponibilidade.",
          consentimentoDados: true,
          consentimentoMarketing: false
        }
      });
      expect(submissao.statusCode).toBe(201);
      expect(submissao.json()).toEqual(
        expect.objectContaining({
          clienteId: expect.any(String),
          tagAutomatica: "lead-formulario"
        })
      );

      const depois = await app.inject({
        method: "GET",
        url: "/formularios?limite=5",
        headers
      });
      expect(depois.statusCode).toBe(200);
      expect(depois.json().formularios[0].totalSubmissoes).toBe(1);

      const tarefasDepois = await app.inject({
        method: "GET",
        url: "/tarefas?tipo=LEAD_FORMULARIO&estado=ABERTA",
        headers
      });
      expect(tarefasDepois.statusCode).toBe(200);
      expect(tarefasDepois.json().tarefas).toHaveLength(1);
      expect(tarefasDepois.json().tarefas[0]).toEqual(
        expect.objectContaining({
          tipo: "LEAD_FORMULARIO",
          origem: "FORMULARIO_PUBLICO",
          clienteId: expect.any(String),
          entidadeTipo: "cliente",
          contexto: expect.objectContaining({
            formularioSlug: "loja-formularios",
            tagAutomatica: "lead-formulario"
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("guarda configuração detalhada da loja digital e mantém dados ligados ao checkout", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923444777", "Loja Digital Guiada");
      await criarProduto(app, headers, "GUIA1", 5);
      await criarProduto(app, headers, "GUIA2", 0);

      const configuracaoInicial = await app.inject({
        method: "GET",
        url: "/loja-publica/configuracao",
        headers
      });
      expect(configuracaoInicial.statusCode).toBe(200);
      expect(configuracaoInicial.json()).toEqual(
        expect.objectContaining({
          configuracao: expect.objectContaining({
            identidade: expect.objectContaining({
              nomeComercial: expect.stringContaining("Loja Digital Guiada")
            })
          }),
          catalogo: expect.objectContaining({
            totalProdutos: 2,
            produtosVendaveis: 1,
            produtosSemStock: 1
          }),
          criacao: expect.objectContaining({
            concluida: false
          })
        })
      );

      const salvar = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          identidade: {
            nomeComercial: "Muanacacri",
            telefone: "934586574",
            whatsapp: "934586574",
            email: "loja@example.com",
            provincia: "Luanda",
            municipio: "Talatona",
            endereco: "Rua 7, Talatona",
            descricaoPublica: "Pastelaria com encomendas pelo site e WhatsApp."
          },
          publicacao: {
            slug: "muanacacri",
            publicada: true
          },
          criacao: {
            confirmar: true
          },
          tema: {
            corPrimaria: "#c6003b",
            logoUrl: "https://example.com/logo.png",
            capaUrl: "https://example.com/capa.png"
          },
          entrega: {
            entregaAtiva: true,
            retiradaAtiva: true,
            consumoLocalAtivo: false,
            taxaPadraoEmKwanza: 1500,
            entregaGratisAcimaDeKwanza: 25000,
            prazoPadrao: "24h",
            enderecoRetirada: "Rua 7, Talatona",
            instrucoesEntrega: "Ligar antes de sair para entrega."
          },
          pagamentos: {
            metodosPagamento: ["transferencia", "cash"],
            instrucoesCobranca: "Enviar comprovativo pelo WhatsApp.",
            mensagemComprovativoPendente: "Recebemos o pedido e aguardamos comprovativo.",
            mensagemPagamentoConfirmado: "Pagamento confirmado. Vamos preparar o pedido."
          },
          experiencia: {
            modoNegocio: "moda",
            ordemVitrines: ["destaques", "promocoes", "novidades"],
            catalogosEditaveis: true,
            leadCaptureAtivo: true,
            leadCaptureTitulo: "Receba reposições e medidas pelo WhatsApp.",
            cupomDestaque: "BIZY10",
            politicaTroca: "Trocas em até 48h para peças sem uso.",
            politicaEntrega: "Entregas em Luanda com confirmação no checkout.",
            politicaPrivacidade: "Dados usados apenas para atendimento e entrega.",
            catalogosPersonalizados: [
              {
                id: "looks-evento",
                nome: "Looks para evento",
                descricao: "Vestidos e peças prontas para ocasiões especiais.",
                criterio: "categoria",
                valor: "Roupas"
              }
            ],
            operacao: {
              plano: {
                planoAtual: "growth",
                recursosBloqueados: ["email-broadcast"],
                quotas: {
                  encomendasMensais: 500,
                  imagens: 150,
                  whatsapp: 3000,
                  email: 1200
                },
                upgradeContextual: true
              },
              checkout: {
                ignorarPaginaPagamento: false,
                manterRascunhoAtePago: true,
                confirmacaoAutomaticaPagamento: false,
                entradaAtiva: true,
                entradaPercentual: 40,
                taxaServicoPercentual: 2,
                taxaServicoFixaEmKwanza: 500,
                prefixoPedido: "UOR",
                sufixoPedido: "AO",
                exigirTelefoneCheckout: true,
                exigirLoginCheckout: false,
                mostrarNumeroEncomendaNaMensagem: true
              },
              pagamentos: {
                dinheiroEntrega: true,
                transferenciaBancaria: true,
                cartaoAdyen: true,
                paypal: false,
                pagamentoPersonalizado: true,
                pagamentoComInstrucoes: true,
                creditoLoja: true,
                instrucoesPagamento: "Confirmar comprovativo antes da entrega."
              },
              entrega: {
                gerirDisponibilidade: true,
                adicionarMetodoEntrega: true,
                disponibilidadeSemanal: ["segunda 09:00-18:00", "sabado 10:00-14:00"],
                zonas: [
                  { nome: "Talatona", precoEmKwanza: 1500, prazo: "Hoje" },
                  { nome: "Kilamba", precoEmKwanza: 2500, prazo: "24h" }
                ]
              },
              fidelizacao: {
                acessoLoja: "telefone",
                ofertaBoasVindasAtiva: true,
                cupomBoasVindas: "BEMVINDO10",
                recompensasAtivas: true,
                recompensasIndicacaoAtivas: true,
                creditoLojaAtivo: true
              },
              automacoes: {
                perfilCliente: true,
                carrinhoAbandonado: true,
                pedidoAvaliacao: true,
                avaliacaoRecebida: true,
                pedidoNovamente: true,
                aniversarioCliente: true,
                pagamentoPendente: true,
                pagamentoConfirmado: true,
                creditoAtualizado: true,
                creditoReembolsado: true,
                pedidoSaiuEntrega: true,
                pedidoCancelado: true,
                produtoDigitalConfirmado: true,
                operacaoInternaPedidoCriado: true
              },
              canais: {
                site: true,
                whatsapp: true,
                instagram: true,
                google: true,
                pos: true,
                transmissoes: true,
                chatbot: true,
                appMovelQr: true,
                caixaEntradaUnificada: true,
                broadcasts: true
              },
              catalogo: {
                categoriasVisiveis: ["Roupas", "Kits"],
                categoriasOcultas: ["Arquivo"],
                sequenciaCategorias: ["Roupas", "Kits"],
                descontosAtivos: true,
                produtosPorColecao: true,
                produtosComEstatisticas: true
              },
              clientes: {
                importar: true,
                exportar: true,
                edicaoMassa: true,
                adicionarManual: true,
                pesquisaAvancada: true,
                filtrosInteligentes: ["todos", "inativos", "primeiro-pedido", "nunca-comprou"],
                transmissaoFiltrada: true
              },
              encomendas: {
                criarManual: true,
                exportar: true,
                resumoAtivo: true,
                rascunhos: true,
                pagamentos: true,
                calendario: true,
                colunasOperacionais: ["cliente", "total", "estado", "pagamento", "entrega", "equipa"]
              },
              relatorios: {
                metricas: ["pedidos", "vendas", "lucro"],
                agruparPor: "produto",
                filtrosPedidos: ["PENDENTE", "PAGO", "CONCLUIDA"],
                relatoriosProntos: ["pedidos-tempo", "produtos-lucro", "referenciadores"]
              },
              siteSeo: {
                dominioPersonalizado: "loja.uorconnect.ao",
                instrucoesDns: "CNAME para lojas.usebizy.space",
                tituloSite: "Uorconnect Store",
                uploadLogotipo: true,
                imagemGeradaIa: false,
                categoriasDiretorio: ["Moda", "Luanda"]
              }
            },
            tabelaMedidas: [
              { tamanho: "P", busto: "84-88", cintura: "66-70", quadril: "90-94", observacao: "Forma normal" },
              { tamanho: "M", busto: "89-94", cintura: "71-76", quadril: "95-100", observacao: "Forma normal" }
            ]
          }
        }
      });
      expect(salvar.statusCode).toBe(200);
      expect(salvar.json()).toEqual(
        expect.objectContaining({
          nomeComercial: "Muanacacri",
          whatsapp: "934586574",
          slugPublico: "muanacacri",
          descricaoPublica: "Pastelaria com encomendas pelo site e WhatsApp.",
          lojaPublicadaEm: expect.any(String),
          metodosPagamento: ["transferencia", "cash"],
          entrega: expect.objectContaining({
            temaLoja: expect.objectContaining({ corPrimaria: "#c6003b" }),
            taxaPadraoEmKwanza: 1500,
            entregaGratisAcimaDeKwanza: 25000,
            prazoPadrao: "24h",
            retiradaNaLoja: expect.objectContaining({ ativa: true, endereco: "Rua 7, Talatona" }),
            consumoLocal: expect.objectContaining({ ativo: false }),
            pagamentos: expect.objectContaining({
              instrucoesCobranca: "Enviar comprovativo pelo WhatsApp."
            }),
            lojaDigital: expect.objectContaining({
              experiencia: expect.objectContaining({
                modoNegocio: "moda",
                ordemVitrines: ["destaques", "promocoes", "novidades"],
                catalogosEditaveis: true,
                leadCaptureAtivo: true,
                politicaTroca: "Trocas em até 48h para peças sem uso.",
                catalogosPersonalizados: [
                  expect.objectContaining({ id: "looks-evento", nome: "Looks para evento", criterio: "categoria" })
                ],
                operacao: expect.objectContaining({
                  plano: expect.objectContaining({
                    planoAtual: "growth",
                    quotas: expect.objectContaining({ whatsapp: 3000 })
                  }),
                  checkout: expect.objectContaining({
                    manterRascunhoAtePago: true,
                    entradaPercentual: 40,
                    prefixoPedido: "UOR",
                    mostrarNumeroEncomendaNaMensagem: true
                  }),
                  pagamentos: expect.objectContaining({
                    cartaoAdyen: true,
                    creditoLoja: true
                  }),
                  entrega: expect.objectContaining({
                    gerirDisponibilidade: true,
                    zonas: [
                      expect.objectContaining({ nome: "Talatona", precoEmKwanza: 1500 }),
                      expect.objectContaining({ nome: "Kilamba", precoEmKwanza: 2500 })
                    ]
                  }),
                  fidelizacao: expect.objectContaining({
                    acessoLoja: "telefone",
                    cupomBoasVindas: "BEMVINDO10"
                  }),
                  automacoes: expect.objectContaining({
                    carrinhoAbandonado: true,
                    pedidoAvaliacao: true,
                    creditoAtualizado: true
                  }),
                  canais: expect.objectContaining({
                    instagram: true,
                    pos: true,
                    broadcasts: true
                  }),
                  clientes: expect.objectContaining({
                    transmissaoFiltrada: true
                  }),
                  encomendas: expect.objectContaining({
                    calendario: true
                  }),
                  relatorios: expect.objectContaining({
                    metricas: ["pedidos", "vendas", "lucro"],
                    agruparPor: "produto",
                    relatoriosProntos: ["pedidos-tempo", "produtos-lucro", "referenciadores"]
                  }),
                  siteSeo: expect.objectContaining({
                    dominioPersonalizado: "loja.uorconnect.ao",
                    tituloSite: "Uorconnect Store"
                  })
                }),
                tabelaMedidas: [
                  expect.objectContaining({ tamanho: "P", busto: "84-88" }),
                  expect.objectContaining({ tamanho: "M", cintura: "71-76" })
                ]
              })
            })
          })
        })
      );

      const configuracaoAtualizada = await app.inject({
        method: "GET",
        url: "/loja-publica/configuracao",
        headers
      });
      expect(configuracaoAtualizada.statusCode).toBe(200);
      expect(configuracaoAtualizada.json()).toEqual(
        expect.objectContaining({
          configuracao: expect.objectContaining({
            identidade: expect.objectContaining({
              nomeComercial: "Muanacacri",
              whatsapp: "934586574",
              endereco: "Rua 7, Talatona"
            }),
            publicacao: expect.objectContaining({
              slug: "muanacacri",
              publicada: true,
              urlPublica: expect.stringContaining("/lojas/muanacacri")
            }),
            tema: expect.objectContaining({
              corPrimaria: "#c6003b",
              logoUrl: "https://example.com/logo.png"
            }),
            entrega: expect.objectContaining({
              entregaAtiva: true,
              taxaPadraoEmKwanza: 1500,
              entregaGratisAcimaDeKwanza: 25000
            }),
            pagamentos: expect.objectContaining({
              metodosPagamento: ["transferencia", "cash"],
              mensagemPagamentoConfirmado: "Pagamento confirmado. Vamos preparar o pedido."
            }),
            experiencia: expect.objectContaining({
              modoNegocio: "moda",
              ordemVitrines: ["destaques", "promocoes", "novidades"],
              catalogosEditaveis: true,
              leadCaptureTitulo: "Receba reposições e medidas pelo WhatsApp.",
              cupomDestaque: "BIZY10",
              politicaTroca: "Trocas em até 48h para peças sem uso.",
              catalogosPersonalizados: [
                expect.objectContaining({ id: "looks-evento", nome: "Looks para evento", valor: "Roupas" })
              ],
              operacao: expect.objectContaining({
                checkout: expect.objectContaining({
                  manterRascunhoAtePago: true,
                  taxaServicoFixaEmKwanza: 500,
                  exigirTelefoneCheckout: true,
                  mostrarNumeroEncomendaNaMensagem: true
                }),
                pagamentos: expect.objectContaining({
                  pagamentoPersonalizado: true,
                  instrucoesPagamento: "Confirmar comprovativo antes da entrega."
                }),
                entrega: expect.objectContaining({
                  disponibilidadeSemanal: ["segunda 09:00-18:00", "sabado 10:00-14:00"]
                }),
                fidelizacao: expect.objectContaining({
                  recompensasIndicacaoAtivas: true,
                  creditoLojaAtivo: true
                }),
                canais: expect.objectContaining({
                  transmissoes: true,
                  chatbot: true,
                  caixaEntradaUnificada: true
                }),
                catalogo: expect.objectContaining({
                  categoriasVisiveis: ["Roupas", "Kits"],
                  descontosAtivos: true
                }),
                encomendas: expect.objectContaining({
                  colunasOperacionais: ["cliente", "total", "estado", "pagamento", "entrega", "equipa"]
                }),
                siteSeo: expect.objectContaining({
                  categoriasDiretorio: ["Moda", "Luanda"]
                })
              }),
              tabelaMedidas: [
                expect.objectContaining({ tamanho: "P", busto: "84-88" }),
                expect.objectContaining({ tamanho: "M", cintura: "71-76" })
              ]
            })
          }),
          prontidao: expect.objectContaining({
            prontaParaPublicar: true
          }),
          criacao: expect.objectContaining({
            concluida: true,
            origem: "assistente-loja-digital"
          })
        })
      );

      const entrega = await app.inject({
        method: "POST",
        url: "/publico/lojas/muanacacri/entrega/calcular",
        payload: {
          itens: [{ codigoPeca: "GUIA1", quantidade: 1 }],
          entrega: { tipo: "ENTREGA", municipio: "Talatona", endereco: "Cliente, Talatona" }
        }
      });
      expect(entrega.statusCode).toBe(200);
      expect(entrega.json()).toEqual(
        expect.objectContaining({
          taxaEntregaEmKwanza: 1500,
          entrega: expect.objectContaining({
            descricao: "Entrega calculada pela configuração da loja."
          })
        })
      );

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/muanacacri?trackingId=anon-experiencia"
      });
      expect(lojaPublica.statusCode).toBe(200);
      expect(lojaPublica.json().loja.experiencia).toEqual(
        expect.objectContaining({
          modoNegocio: "moda",
          leadCaptureAtivo: true,
          politicaEntrega: "Entregas em Luanda com confirmação no checkout.",
          catalogosPersonalizados: [
            expect.objectContaining({ id: "looks-evento", nome: "Looks para evento", criterio: "categoria" })
          ],
          operacao: expect.objectContaining({
            checkout: expect.objectContaining({ prefixoPedido: "UOR" }),
            pagamentos: expect.objectContaining({ cartaoAdyen: true }),
            entrega: expect.objectContaining({ gerirDisponibilidade: true }),
            automacoes: expect.objectContaining({ pedidoNovamente: true }),
            canais: expect.objectContaining({ broadcasts: true }),
            relatorios: expect.objectContaining({
              filtrosPedidos: ["PENDENTE", "PAGO", "CONCLUIDA"],
              relatoriosProntos: ["pedidos-tempo", "produtos-lucro", "referenciadores"]
            }),
            siteSeo: expect.objectContaining({ tituloSite: "Uorconnect Store" })
          }),
          tabelaMedidas: [expect.objectContaining({ tamanho: "P" }), expect.objectContaining({ tamanho: "M" })]
        })
      );
      expect(lojaPublica.json().loja).toEqual(
        expect.objectContaining({
          corPrimaria: "#c6003b",
          logoUrl: "https://example.com/logo.png",
          capaUrl: "https://example.com/capa.png"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("publica loja por slug, expõe apenas produtos vendáveis e gera checkout WhatsApp rastreável", async () => {
    const app = await criarAplicacao();

    try {
      const lojaA = await autenticar(app, "923444001", "Loja Pública A");
      const lojaB = await autenticar(app, "923444002", "Loja Pública B");

      await criarProduto(app, lojaA, "P1", 5);
      await criarProduto(app, lojaA, "P2", 0);
      await criarProduto(app, lojaB, "P1", 10);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: lojaA,
        payload: {
          slug: "loja-publica-a",
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);
      expect(publicacao.json()).toEqual(
        expect.objectContaining({
          slugPublico: "loja-publica-a",
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp.",
          lojaPublicadaEm: expect.any(String)
        })
      );

      const slugDuplicado = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: lojaB,
        payload: {
          slug: "loja-publica-a",
          publicada: true
        }
      });
      expect(slugDuplicado.statusCode).toBe(409);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-publica-a?trackingId=anon-1&utm_source=tiktok&utm_campaign=live",
        headers: {}
      });
      expect(lojaPublica.statusCode).toBe(200);
      expect(lojaPublica.json().loja).toEqual(
        expect.objectContaining({
          slug: "loja-publica-a",
          nomeComercial: expect.stringContaining("Loja Pública A"),
          descricaoPublica: "Moda pronta para comprar pelo WhatsApp."
        })
      );
      expect(lojaPublica.json().produtos).toEqual([
        expect.objectContaining({
          codigo: "P1",
          nome: "Produto P1",
          precoEmKwanza: 12_500,
          categoria: "Roupas",
          colecao: "Live atual",
          estadoStock: "DISPONIVEL"
        })
      ]);
      expect(JSON.stringify(lojaPublica.json())).not.toContain("custoEmKwanza");
      expect(JSON.stringify(lojaPublica.json())).not.toContain("margemEstimadaEmKwanza");
      expect(JSON.stringify(lojaPublica.json())).not.toContain("negocioId");
      expect(lojaPublica.json().seo).toEqual(
        expect.objectContaining({
          titulo: expect.stringContaining("Loja Pública A"),
          descricao: "Moda pronta para comprar pelo WhatsApp.",
          canonicalPath: "/lojas/loja-publica-a",
          imagem: "https://example.com/P1.png",
          previewSocial: expect.objectContaining({
            whatsapp: expect.any(Object),
            facebook: expect.any(Object),
            instagram: expect.any(Object),
            tiktok: expect.any(Object),
            navegador: expect.any(Object)
          })
        })
      );

      const produtoPublico = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-publica-a/produtos/P1?trackingId=anon-1"
      });
      expect(produtoPublico.statusCode).toBe(200);
      expect(produtoPublico.json().produto).toEqual(
        expect.objectContaining({
          codigo: "P1",
          variantes: { tamanho: ["M", "G"] },
          disponivel: true
        })
      );
      expect(produtoPublico.json().seo).toEqual(
        expect.objectContaining({
          titulo: "Produto P1 | Loja Pública A",
          descricao: "Produto P1 para loja pública",
          canonicalPath: "/lojas/loja-publica-a/produtos/P1",
          imagem: "https://example.com/P1.png",
          previewSocial: expect.objectContaining({
            whatsapp: expect.any(Object),
            facebook: expect.any(Object),
            instagram: expect.any(Object),
            tiktok: expect.any(Object),
            navegador: expect.any(Object)
          })
        })
      );

      const checkoutWhatsApp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-publica-a/produtos/P1/whatsapp",
        payload: {
          quantidade: 2,
          variante: { tamanho: "M" },
          trackingId: "anon-1",
          origem: "catalogo-digital"
        }
      });
      expect(checkoutWhatsApp.statusCode).toBe(200);
      expect(checkoutWhatsApp.json()).toEqual(
        expect.objectContaining({
          telefone: "923444001",
          mensagem: expect.stringContaining("Produto P1"),
          whatsappUrl: expect.stringContaining("wa.me")
        })
      );
      expect(checkoutWhatsApp.json().mensagem).toContain("Quantidade: 2");
      expect(checkoutWhatsApp.json().mensagem).toContain("Origem: catalogo-digital");

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: lojaA
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json()).toEqual(
        expect.objectContaining({
          totalEventos: 3,
          porTipo: expect.objectContaining({
            LOJA_VISITADA: 1,
            PRODUTO_VISTO: 1,
            WHATSAPP_CLICK: 1
          }),
          funil: expect.objectContaining({
            visitas: 1,
            produtosVistos: 1,
            cliquesWhatsApp: 1,
            checkoutsIniciados: 0,
            pedidosCriados: 0,
            leadsIdentificados: 0,
            receitaAtribuidaEmKwanza: 0,
            taxaWhatsAppPorProduto: 100
          })
        })
      );

      const funilTracking = await app.inject({
        method: "GET",
        url: "/funil/movimentos?entidadeTipo=tracking&entidadeId=anon-1",
        headers: lojaA
      });
      expect(funilTracking.statusCode).toBe(200);
      expect(funilTracking.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "PRODUTO_VISTO",
          etapaNova: "WHATSAPP_CLICK",
          origem: "loja_publica",
          motivo: "Cliente clicou para comprar pelo WhatsApp."
        }),
        expect.objectContaining({
          etapaAnterior: "VISITA",
          etapaNova: "PRODUTO_VISTO",
          origem: "loja_publica",
          motivo: "Cliente visualizou produto público."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "VISITA",
          origem: "loja_publica",
          motivo: "Cliente visitou a loja pública."
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("expõe perfil social com coleções clicáveis, ponte para o Market e bloqueia slug reservado", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923444041", "Loja Perfil Bizy");
      await criarProduto(app, headers, "LOOK-1", 7, {
        nome: "Vestido verde para evento",
        categoria: "Roupas",
        colecao: "Looks para evento",
        vitrine: { selos: ["DESTAQUE"], prioridade: 1 }
      });
      await criarProduto(app, headers, "LOOK-2", 3, {
        nome: "Blazer casual",
        categoria: "Roupas",
        colecao: "Looks para evento"
      });
      await criarProduto(app, headers, "ACESS-1", 5, {
        nome: "Bolsa minimal",
        categoria: "Acessórios",
        colecao: "Acessórios"
      });

      const slugReservado = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "market",
          publicada: true
        }
      });
      expect(slugReservado.statusCode).toBe(409);
      expect(slugReservado.json().mensagem).toContain("reservado");

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          identidade: {
            nomeComercial: "Loja Perfil Bizy",
            provincia: "Luanda",
            municipio: "Talatona",
            descricaoPublica: "Perfil comercial com coleções prontas para explorar."
          },
          tema: {
            corPrimaria: "#0f8a5f",
            logoUrl: "https://example.com/perfil-logo.png",
            capaUrl: "https://example.com/perfil-capa.png"
          },
          publicacao: {
            slug: "loja-perfil-bizy",
            publicada: true
          },
          criacao: { confirmar: true }
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-perfil-bizy?colecao=Looks%20para%20evento&trackingId=perfil-1"
      });
      expect(lojaPublica.statusCode).toBe(200);
      const corpo = lojaPublica.json();

      expect(corpo.perfil).toEqual(
        expect.objectContaining({
          slug: "loja-perfil-bizy",
          nomeComercial: "Loja Perfil Bizy",
          bio: "Perfil comercial com coleções prontas para explorar.",
          avatarUrl: "https://example.com/perfil-logo.png",
          capaUrl: "https://example.com/perfil-capa.png",
          corAcento: "#0f8a5f",
          localizacao: "Talatona, Luanda",
          contadores: {
            seguidores: 0,
            seguindo: 0,
            produtos: 3,
            colecoes: 4
          },
          acoes: expect.objectContaining({
            seguirDisponivel: true,
            urlLoja: "/lojas/loja-perfil-bizy",
            urlMarket: "/market?loja=loja-perfil-bizy"
          })
        })
      );
      expect(corpo.colecoes).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: "colecao-looks-para-evento",
          nome: "Looks para evento",
          tipo: "colecao",
          totalProdutos: 2,
          url: "/lojas/loja-perfil-bizy?colecao=Looks%20para%20evento"
        }),
        expect.objectContaining({
          id: "categoria-roupas",
          nome: "Roupas",
          tipo: "categoria",
          totalProdutos: 2,
          url: "/lojas/loja-perfil-bizy?categoria=Roupas"
        })
      ]));
      expect(corpo.colecoes).toHaveLength(4);
      expect(corpo.market).toEqual(
        expect.objectContaining({
          disponivel: true,
          label: "Explorar similares no Bizy Market",
          url: "/market?categoria=Roupas&lojaOrigem=loja-perfil-bizy",
          categoriaPrincipal: "Roupas"
        })
      );
      expect(corpo.produtos).toHaveLength(2);
      expect(JSON.stringify(corpo)).not.toContain("negocioId");
      expect(JSON.stringify(corpo)).not.toContain("custoEmKwanza");
      expect(JSON.stringify(corpo)).not.toContain("margemEstimadaEmKwanza");
    } finally {
      await app.close();
    }
  });

  it("aplica cache público curto no catálogo e no-store em ações que alteram estado", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923444099", "Loja Cache");
      await criarProduto(app, headers, "CACHE1", 8);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "loja-cache",
          descricaoPublica: "Loja rápida e segura.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const catalogo = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-cache"
      });
      expect(catalogo.statusCode).toBe(200);
      expect(catalogo.headers["cache-control"]).toBe("public, max-age=30, s-maxage=60, stale-while-revalidate=30");

      const produto = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-cache/produtos/CACHE1"
      });
      expect(produto.statusCode).toBe(200);
      expect(produto.headers["cache-control"]).toBe("public, max-age=30, s-maxage=60, stale-while-revalidate=30");

      const entrega = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-cache/entrega/calcular",
        payload: {
          itens: [{ codigoPeca: "CACHE1", quantidade: 1 }],
          entrega: {
            tipo: "RETIRADA"
          }
        }
      });
      expect(entrega.headers["cache-control"]).toBe("no-store");

      const tracking = await app.inject({
        method: "POST",
        url: "/publico/tracking/eventos",
        payload: {
          slugLoja: "loja-cache",
          tipo: "LOJA_VISITADA",
          trackingId: "anon-cache-1",
          origem: "site"
        }
      });
      expect(tracking.headers["cache-control"]).toBe("no-store");
    } finally {
      await app.close();
    }
  });

  it("organiza vitrine pública com destaques, promoções, novidades, reposições, kits e mais vendidos", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444130", "Loja Vitrine");
      await criarProduto(app, loja, "D-1", 5, {
        nome: "Vestido destaque",
        vitrine: {
          selos: ["DESTAQUE"],
          prioridade: 2,
          titulo: "Escolha da semana"
        }
      });
      await criarProduto(app, loja, "P-1", 5, {
        nome: "Blusa em promoção",
        vitrine: {
          selos: ["PROMOCAO"],
          prioridade: 1,
          precoPromocionalEmKwanza: 9_500,
          descricao: "Preço especial até acabar o stock."
        }
      });
      await criarProduto(app, loja, "N-1", 5, {
        nome: "Novidade verde",
        vitrine: { selos: ["NOVIDADE"], prioridade: 1 }
      });
      await criarProduto(app, loja, "R-1", 5, {
        nome: "Reposição esperada",
        vitrine: { selos: ["REPOSICAO"], prioridade: 1 }
      });
      await criarProduto(app, loja, "M-1", 5, {
        nome: "Mais vendido",
        vitrine: { selos: ["MAIS_VENDIDO"], prioridade: 1 }
      });
      await criarProduto(app, loja, "K-1", 5, {
        nome: "Kit completo",
        vitrine: {
          selos: ["KIT", "DESTAQUE"],
          prioridade: 0,
          componentesKit: [
            { codigoPeca: "D-1", quantidade: 1 },
            { codigoPeca: "P-1", quantidade: 1 }
          ]
        }
      });

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-vitrine",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-vitrine"
      });
      expect(lojaPublica.statusCode).toBe(200);
      expect(lojaPublica.json().vitrine).toEqual(
        expect.objectContaining({
          destaques: [
            expect.objectContaining({ codigo: "K-1", nome: "Kit completo" }),
            expect.objectContaining({ codigo: "D-1", nome: "Vestido destaque" })
          ],
          promocoes: [expect.objectContaining({ codigo: "P-1", precoPromocionalEmKwanza: 9_500 })],
          novidades: [expect.objectContaining({ codigo: "N-1" })],
          reposicoes: [expect.objectContaining({ codigo: "R-1" })],
          maisVendidos: [expect.objectContaining({ codigo: "M-1" })],
          kits: [expect.objectContaining({ codigo: "K-1" })]
        })
      );
      expect(lojaPublica.json().produtos.find((produto: { codigo: string }) => produto.codigo === "K-1").vitrine)
        .toEqual(expect.objectContaining({
          selos: ["KIT", "DESTAQUE"],
          prioridade: 0,
          componentesKit: [
            { codigoPeca: "D-1", quantidade: 1 },
            { codigoPeca: "P-1", quantidade: 1 }
          ]
        }));
    } finally {
      await app.close();
    }
  });

  it("não duplica evento público reenviado com a mesma chave técnica", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923444131", "Loja Tracking Idempotente");
      await criarProduto(app, headers, "IDEMP-1", 5);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers,
        payload: {
          slug: "loja-tracking-idempotente",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const payload = {
        slugLoja: "loja-tracking-idempotente",
        tipo: "PEDIDO_CRIADO",
        entidadeTipo: "pedido",
        entidadeId: "pedido-idempotente-1",
        codigoProduto: "IDEMP-1",
        trackingId: "trk-idempotente-1",
        origem: "site",
        canal: "checkout",
        utm: { utm_campaign: "campanha-idempotente" },
        metadata: {
          totalEmKwanza: 15000,
          idempotencyKey: "pedido-idempotente-1"
        }
      };

      const primeiro = await app.inject({
        method: "POST",
        url: "/publico/tracking/eventos",
        payload
      });
      expect(primeiro.statusCode).toBe(201);

      const repetido = await app.inject({
        method: "POST",
        url: "/publico/tracking/eventos",
        payload
      });
      expect(repetido.statusCode).toBe(201);
      expect(repetido.json().id).toBe(primeiro.json().id);

      const resumo = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers
      });
      expect(resumo.statusCode).toBe(200);
      expect(resumo.json()).toEqual(
        expect.objectContaining({
          totalEventos: 1,
          porTipo: expect.objectContaining({
            PEDIDO_CRIADO: 1
          }),
          funil: expect.objectContaining({
            pedidosCriados: 1,
            receitaAtribuidaEmKwanza: 15000
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("filtra produtos públicos por busca, categoria e coleção", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444120", "Loja Filtros Públicos");
      await criarProduto(app, loja, "CAM-1", 5, {
        nome: "Camisa Verde",
        categoria: "Roupas",
        colecao: "Live atual"
      });
      await criarProduto(app, loja, "TEN-1", 3, {
        nome: "Tênis urbano",
        descricao: "Tênis confortável para entrega rápida",
        categoria: "Calçado",
        colecao: "Promoção semanal"
      });

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-filtros-publicos",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const filtrado = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-filtros-publicos?busca=tenis&categoria=Calcado&colecao=promocao"
      });
      expect(filtrado.statusCode).toBe(200);
      expect(filtrado.json().produtos).toEqual([
        expect.objectContaining({
          codigo: "TEN-1",
          nome: "Tênis urbano",
          categoria: "Calçado",
          colecao: "Promoção semanal"
        })
      ]);
      expect(filtrado.json().filtros).toEqual(
        expect.objectContaining({
          busca: "tenis",
          categoria: "Calcado",
          colecao: "promocao"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("não expõe loja despublicada nem produto sem stock", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444101", "Loja Oculta");
      await criarProduto(app, loja, "X1", 0);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-oculta",
          publicada: false
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const lojaPublica = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-oculta"
      });
      expect(lojaPublica.statusCode).toBe(404);

      const publicar = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-oculta",
          publicada: true
        }
      });
      expect(publicar.statusCode).toBe(200);

      const produtoSemStock = await app.inject({
        method: "GET",
        url: "/publico/lojas/loja-oculta/produtos/X1"
      });
      expect(produtoSemStock.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("calcula entrega e cria pedido pelo checkout público preservando origem e tracking", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444201", "Loja Checkout");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja Checkout",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923444201",
          whatsapp: "923444201",
          provincia: "Luanda",
          municipio: "Luanda",
          endereco: "Rua da loja",
          canaisVenda: ["site", "whatsapp"],
          metodosPagamento: ["transferencia"],
          entrega: {
            taxaPadraoEmKwanza: 2500,
            entregaGratisAcimaDeKwanza: 50000,
            zonas: [
              { municipio: "Luanda", bairro: "Talatona", taxaEmKwanza: 1500, prazo: "Hoje" },
              { municipio: "Viana", taxaEmKwanza: 3000, prazo: "24h" }
            ],
            retiradaNaLoja: { ativa: true, instrucoes: "Retirar na Rua da loja." }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      await criarProduto(app, loja, "C1", 8);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-checkout",
          descricaoPublica: "Compra pelo site ou WhatsApp.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const entrega = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/entrega/calcular",
        payload: {
          itens: [{ codigoPeca: "C1", quantidade: 2 }],
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Talatona",
            endereco: "Rua do cliente"
          }
        }
      });
      expect(entrega.statusCode).toBe(200);
      expect(entrega.json()).toEqual(
        expect.objectContaining({
          subtotalEmKwanza: 25_000,
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 26_500,
          moeda: "AOA"
        })
      );
      expect(entrega.json().entrega).toEqual(
        expect.objectContaining({
          tipo: "ENTREGA",
          regra: "zona",
          prazo: "Hoje"
        })
      );

      const whatsapp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/produtos/C1/whatsapp",
        payload: {
          quantidade: 2,
          variante: { tamanho: "M" },
          trackingId: "trk-checkout-1",
          origem: "link-afiliado-ana",
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Talatona",
            endereco: "Rua do cliente"
          }
        }
      });
      expect(whatsapp.statusCode).toBe(200);
      expect(whatsapp.json().mensagem).toContain("Entrega estimada: 1 500 Kz");
      expect(whatsapp.json().mensagem).toContain("Total estimado: 26 500 Kz");

      const checkoutSemConsentimento = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/checkout",
        payload: {
          cliente: {
            nome: "Cliente Sem Aceite",
            telefone: "923555667",
            consentimentoDados: false,
            consentimentoMarketing: false
          },
          itens: [{ codigoPeca: "C1", quantidade: 1 }],
          entrega: {
            tipo: "RETIRADA"
          },
          origem: "loja-publica"
        }
      });
      expect(checkoutSemConsentimento.statusCode).toBe(400);
      expect(JSON.stringify(checkoutSemConsentimento.json())).toContain("Consentimento de dados");

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-checkout/checkout",
        payload: {
          cliente: {
            nome: "Cliente Site",
            telefone: "923555666",
            consentimentoDados: true,
            consentimentoMarketing: false
          },
          itens: [{ codigoPeca: "C1", quantidade: 2 }],
          entrega: {
            tipo: "ENTREGA",
            provincia: "Luanda",
            municipio: "Luanda",
            bairro: "Talatona",
            endereco: "Rua do cliente"
          },
          trackingId: "trk-checkout-1",
          origem: "link-afiliado-ana"
        }
      });
      expect(checkout.statusCode).toBe(201);
      expect(checkout.json()).toEqual(
        expect.objectContaining({
          origem: "link-afiliado-ana",
          canal: "site",
          subtotalEmKwanza: 25_000,
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 30_000
        })
      );
      expect(checkout.json().pedido).toEqual(
        expect.objectContaining({
          numero: expect.any(Number),
          estado: "AGUARDANDO_PAGAMENTO",
          estadoPagamento: "PENDENTE"
        })
      );

      const pedidos = await app.inject({
        method: "GET",
        url: "/pedidos",
        headers: loja
      });
      expect(pedidos.statusCode).toBe(200);
      expect(pedidos.json().pedidos).toEqual([
        expect.objectContaining({
          origem: "link-afiliado-ana",
          canal: "site",
          taxaEntregaEmKwanza: 1_500,
          totalEmKwanza: 30_000,
          enderecoEntrega: expect.stringContaining("Talatona")
        })
      ]);

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: loja
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json().porTipo).toEqual(
        expect.objectContaining({
          WHATSAPP_CLICK: 1,
          CHECKOUT_INICIADO: 1,
          PEDIDO_CRIADO: 1
        })
      );
      expect(resumoTracking.json().porOrigem).toEqual(
        expect.objectContaining({
          "link-afiliado-ana": 3
        })
      );
      expect(resumoTracking.json().funil).toEqual(
        expect.objectContaining({
          visitas: 0,
          produtosVistos: 0,
          cliquesWhatsApp: 1,
          checkoutsIniciados: 1,
          pedidosCriados: 1,
          leadsIdentificados: 1,
          receitaAtribuidaEmKwanza: 30_000,
          taxaPedidoPorCheckout: 100
        })
      );

      const funilTracking = await app.inject({
        method: "GET",
        url: "/funil/movimentos?entidadeTipo=tracking&entidadeId=trk-checkout-1",
        headers: loja
      });
      expect(funilTracking.statusCode).toBe(200);
      expect(funilTracking.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "CHECKOUT",
          etapaNova: "PEDIDO",
          origem: "loja_publica",
          motivo: "Pedido criado a partir do checkout público."
        }),
        expect.objectContaining({
          etapaAnterior: "WHATSAPP_CLICK",
          etapaNova: "CHECKOUT",
          origem: "loja_publica",
          motivo: "Cliente iniciou checkout público."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "WHATSAPP_CLICK",
          origem: "loja_publica",
          motivo: "Cliente clicou para comprar pelo WhatsApp."
        })
      ]);

      const funilPedido = await app.inject({
        method: "GET",
        url: `/funil/movimentos?entidadeTipo=pedido&entidadeId=${checkout.json().pedido.id}`,
        headers: loja
      });
      expect(funilPedido.statusCode).toBe(200);
      expect(funilPedido.json().movimentos).toEqual([
        expect.objectContaining({
          etapaAnterior: "PEDIDO",
          etapaNova: "PAGAMENTO_PENDENTE",
          origem: "checkout_site",
          motivo: "Pedido criado pelo checkout público e aguarda pagamento."
        }),
        expect.objectContaining({
          etapaAnterior: null,
          etapaNova: "PEDIDO",
          origem: "checkout_site",
          motivo: "Pedido criado pelo checkout público."
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("resume conversão por campanha, vendedor e link rastreável de criador", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444031", "Loja Tracking Campanha");
      await criarProduto(app, loja, "CAMP1", 8);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-campanha-tracking",
          descricaoPublica: "Campanhas rastreáveis com criadores.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const criador = await app.inject({
        method: "POST",
        url: "/afiliados",
        headers: loja,
        payload: {
          tipo: "CRIADOR",
          codigo: "criadora-lia",
          nomePublico: "Criadora Lia",
          contacto: "923744031",
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: 12
          }
        }
      });
      expect(criador.statusCode).toBe(201);

      const link = await app.inject({
        method: "POST",
        url: `/afiliados/${criador.json().id}/links`,
        headers: loja,
        payload: {
          codigo: "LIA-CAMP-1",
          destinoTipo: "CAMPANHA",
          destinoId: "campanha-live-maio",
          slugLoja: "loja-campanha-tracking",
          canal: "instagram",
          origemConteudo: "reel-lia-01",
          metadata: {
            vendedorId: "vend-luanda-01",
            postSocialId: "ig-reel-lia-01",
            liveId: "live-maio-01",
            utmCampaign: "campanha-live-maio"
          }
        }
      });
      expect(link.statusCode).toBe(201);

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-campanha-tracking/checkout",
        payload: {
          cliente: {
            nome: "Cliente campanha",
            telefone: "923755031",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "CAMP1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" },
          referencia: "LIA-CAMP-1",
          trackingId: "trk-campanha-lia",
          origem: "instagram-reel",
          canal: "instagram"
        }
      });
      expect(checkout.statusCode).toBe(201);

      const resumoTracking = await app.inject({
        method: "GET",
        url: "/loja-publica/tracking/resumo",
        headers: loja
      });
      expect(resumoTracking.statusCode).toBe(200);
      expect(resumoTracking.json().atribuicoes.porCampanha["campanha-live-maio"]).toEqual(
        expect.objectContaining({
          eventos: 2,
          checkoutsIniciados: 1,
          pedidosCriados: 1,
          receitaAtribuidaEmKwanza: 14_250,
          taxaPedidoPorCheckout: 100
        })
      );
      expect(resumoTracking.json().atribuicoes.porVendedor["vend-luanda-01"]).toEqual(
        expect.objectContaining({
          pedidosCriados: 1,
          receitaAtribuidaEmKwanza: 14_250
        })
      );
      expect(resumoTracking.json().atribuicoes.porLink["LIA-CAMP-1"]).toEqual(
        expect.objectContaining({
          pedidosCriados: 1,
          receitaAtribuidaEmKwanza: 14_250
        })
      );
      expect(resumoTracking.json().atribuicoes.porAfiliado["CRIADORA-LIA"]).toEqual(
        expect.objectContaining({
          pedidosCriados: 1,
          receitaAtribuidaEmKwanza: 14_250
        })
      );
    } finally {
      await app.close();
    }
  });

  it("aceita orçamento humano de entrega sem bloquear checkout público por WhatsApp", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444203", "Loja Entrega Orçamento");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja Entrega Orçamento",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923444203",
          whatsapp: "923444203",
          provincia: "Luanda",
          municipio: "Luanda",
          endereco: "Rua da loja",
          canaisVenda: ["site", "whatsapp"],
          metodosPagamento: ["transferencia"],
          entrega: {
            taxaPadraoEmKwanza: 2500,
            orcamentoHumano: {
              instrucoes: "A equipa confirma o valor da entrega antes do pagamento.",
              prazo: "Até 2h úteis"
            }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      await criarProduto(app, loja, "O1", 5);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-entrega-orcamento",
          descricaoPublica: "Compra com entrega sob orçamento.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const entrega = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-entrega-orcamento/entrega/calcular",
        payload: {
          itens: [{ codigoPeca: "O1", quantidade: 1 }],
          entrega: {
            tipo: "ORCAMENTO",
            provincia: "Luanda",
            municipio: "Cacuaco",
            bairro: "Sequele",
            endereco: "Rua sem taxa cadastrada"
          }
        }
      });
      expect(entrega.statusCode).toBe(200);
      expect(entrega.json()).toEqual(
        expect.objectContaining({
          subtotalEmKwanza: 12_500,
          taxaEntregaEmKwanza: 0,
          totalEmKwanza: 12_500
        })
      );
      expect(entrega.json().entrega).toEqual(
        expect.objectContaining({
          tipo: "ORCAMENTO",
          regra: "orcamento",
          prazo: "Até 2h úteis",
          descricao: "A equipa confirma o valor da entrega antes do pagamento.",
          endereco: expect.stringContaining("Sequele")
        })
      );

      const whatsapp = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-entrega-orcamento/produtos/O1/whatsapp",
        payload: {
          quantidade: 1,
          variante: { tamanho: "M" },
          trackingId: "trk-orcamento-entrega",
          origem: "loja-publica",
          entrega: {
            tipo: "ORCAMENTO",
            municipio: "Cacuaco",
            bairro: "Sequele",
            endereco: "Rua sem taxa cadastrada"
          }
        }
      });
      expect(whatsapp.statusCode).toBe(200);
      expect(whatsapp.json().mensagem).toContain("Entrega: A equipa confirma o valor da entrega antes do pagamento.");
      expect(whatsapp.json().mensagem).toContain("Total estimado: 12 500 Kz");
    } finally {
      await app.close();
    }
  });

  it("prepara evento server-side apenas com credencial configurada e consentimento sem vazar dados pessoais", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444301", "Loja CAPI");

      const negocio = await app.inject({
        method: "POST",
        url: "/onboarding/negocio",
        headers: loja,
        payload: {
          nomeComercial: "Loja CAPI",
          segmento: "Moda",
          tipo: "LOJA",
          telefone: "923444301",
          whatsapp: "923444301",
          provincia: "Luanda",
          municipio: "Luanda",
          canaisVenda: ["site", "whatsapp"],
          metodosPagamento: ["transferencia"],
          entrega: {
            serverSideEvents: {
              ativo: true,
              providers: [
                {
                  provider: "meta_capi",
                  pixelId: "PIXEL-123",
                  credencialRef: "vault:meta:loja-capi",
                  eventos: ["PEDIDO_CRIADO"],
                  exigirConsentimentoMarketing: true
                }
              ]
            }
          }
        }
      });
      expect(negocio.statusCode).toBe(201);

      await criarProduto(app, loja, "SSE1", 4);

      const publicacao = await app.inject({
        method: "PUT",
        url: "/loja-publica/configuracao",
        headers: loja,
        payload: {
          slug: "loja-capi",
          descricaoPublica: "Loja com eventos server-side preparados.",
          publicada: true
        }
      });
      expect(publicacao.statusCode).toBe(200);

      const checkout = await app.inject({
        method: "POST",
        url: "/publico/lojas/loja-capi/checkout",
        payload: {
          cliente: {
            nome: "Cliente CAPI",
            telefone: "923555888",
            email: "cliente.capi@example.com",
            consentimentoDados: true,
            consentimentoMarketing: true
          },
          itens: [{ codigoPeca: "SSE1", quantidade: 1 }],
          entrega: { tipo: "RETIRADA" },
          trackingId: "trk-capi-1",
          origem: "anuncio-instagram",
          canal: "site"
        }
      });
      expect(checkout.statusCode).toBe(201);

      const eventos = await app.inject({
        method: "GET",
        url: "/eventos-operacionais?topico=server-side-events",
        headers: loja
      });
      expect(eventos.statusCode).toBe(200);
      expect(eventos.json().eventos).toEqual([
        expect.objectContaining({
          topico: "server-side-events",
          tipo: "META_CAPI_EVENT_READY",
          entidadeTipo: "PEDIDO",
          entidadeId: checkout.json().pedido.id,
          estado: "PENDENTE",
          payload: expect.objectContaining({
            provider: "meta_capi",
            eventName: "Purchase",
            pixelId: "PIXEL-123",
            credencialRef: "vault:meta:loja-capi",
            consentimento: expect.objectContaining({
              dados: true,
              marketing: true
            }),
            userData: expect.objectContaining({
              ph: expect.stringMatching(/^[a-f0-9]{64}$/),
              em: expect.stringMatching(/^[a-f0-9]{64}$/)
            }),
            customData: expect.objectContaining({
              currency: "AOA",
              value: 14_250,
              order_id: checkout.json().pedido.id
            })
          })
        })
      ]);
      const payloadSerializado = JSON.stringify(eventos.json());
      expect(payloadSerializado).not.toContain("923555888");
      expect(payloadSerializado).not.toContain("cliente.capi@example.com");
    } finally {
      await app.close();
    }
  });
});
