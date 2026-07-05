import { describe, expect, it } from "vitest";
import { SalvarConfiguracaoLojaPublicaSchema } from "../dominio/esquemas.js";

describe("configuracao avancada da loja digital", () => {
  it("preserva plano, quotas, checkout, entrega, catalogo, clientes, encomendas, canais, relatorios e SEO", () => {
    const configuracao = SalvarConfiguracaoLojaPublicaSchema.parse({
      publicacao: {
        participaNoMarket: true,
        participaNoLearning: true,
        learning: {
          ativa: true,
          publicada: true,
          slug: "academia-uorconnect",
          nomePublico: "Academia Uorconnect",
          descricaoPublica: "Cursos, mentorias e comunidade para comerciantes.",
          categorias: ["Cursos", "Mentoria", "Comunidade"],
          canaisSuporte: ["Team", "Comunidade"],
          politicaSuporte: "Suporte em até 2 dias úteis pelo Team."
        }
      },
      experiencia: {
        operacao: {
          plano: {
            planoAtual: "growth",
            recursosBloqueados: ["adyen", "email-broadcast"],
            quotas: {
              encomendasMensais: 500,
              imagens: 150,
              whatsapp: 3000,
              email: 1200
            },
            upgradeContextual: true
          },
          checkout: {
            mostrarNumeroEncomendaNaMensagem: true
          },
          pagamentos: {
            dinheiroEntrega: true,
            transferenciaBancaria: true,
            cartaoAdyen: true,
            paypal: true,
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
          catalogo: {
            categoriasVisiveis: ["Vestidos", "Kits"],
            categoriasOcultas: ["Arquivo"],
            sequenciaCategorias: ["Vestidos", "Kits", "Acessorios"],
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
          automacoes: {
            perfilCliente: true,
            avaliacaoRecebida: true,
            creditoAtualizado: true,
            creditoReembolsado: true,
            produtoDigitalConfirmado: true,
            operacaoInternaPedidoCriado: true
          },
          canais: {
            appMovelQr: true,
            caixaEntradaUnificada: true,
            broadcasts: true
          },
          relatorios: {
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
        }
      }
    });

    expect(configuracao.experiencia.operacao).toEqual(
      expect.objectContaining({
        plano: expect.objectContaining({
          planoAtual: "growth",
          recursosBloqueados: ["adyen", "email-broadcast"],
          quotas: {
            encomendasMensais: 500,
            imagens: 150,
            whatsapp: 3000,
            email: 1200
          },
          upgradeContextual: true
        }),
        checkout: expect.objectContaining({
          mostrarNumeroEncomendaNaMensagem: true
        }),
        pagamentos: expect.objectContaining({
          cartaoAdyen: true,
          paypal: true,
          creditoLoja: true
        }),
        entrega: expect.objectContaining({
          gerirDisponibilidade: true,
          zonas: [
            { nome: "Talatona", precoEmKwanza: 1500, prazo: "Hoje" },
            { nome: "Kilamba", precoEmKwanza: 2500, prazo: "24h" }
          ]
        }),
        siteSeo: expect.objectContaining({
          dominioPersonalizado: "loja.uorconnect.ao",
          tituloSite: "Uorconnect Store"
        })
      })
    );
    expect(configuracao.publicacao).toEqual(
      expect.objectContaining({
        participaNoMarket: true,
        participaNoLearning: true,
        learning: expect.objectContaining({
          ativa: true,
          publicada: true,
          slug: "academia-uorconnect",
          categorias: ["Cursos", "Mentoria", "Comunidade"],
          canaisSuporte: ["Team", "Comunidade"]
        })
      })
    );
  });
});
