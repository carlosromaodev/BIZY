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

async function criarCliente(app: Awaited<ReturnType<typeof criarAplicacao>>, headers: Record<string, string>) {
  const resposta = await app.inject({
    method: "POST",
    url: "/clientes",
    headers,
    payload: {
      telefone: "937624785",
      nome: "Cliente Operacional",
      consentimentoDados: true,
      consentimentoMarketing: true,
      tags: ["vip"]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function criarPeca(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string,
  quantidade = 5,
  precoEmKwanza = 12_000,
  custoEmKwanza = 8_000
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Produto ${codigo}`,
      descricao: `Produto ${codigo} para CRM operacional`,
      precoEmKwanza,
      custoEmKwanza,
      quantidade,
      fotos: [`https://example.com/${codigo}.png`]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("backend CRM+ requisitos operacionais", () => {
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

  it("importa clientes, segmenta, funde duplicados com preview e cria ação rápida", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444001", "Loja CRM Clientes");

      const importacao = await app.inject({
        method: "POST",
        url: "/clientes/importar.csv",
        headers: loja,
        payload: {
          csv: [
            "telefone,nome,email,tags,tamanho,cor,consentimentoMarketing",
            "937624785,Ana Cliente,ana@example.com,\"vip|moda\",M,Verde,true",
            "937624785,Ana Cliente Atualizada,ana@example.com,\"retorno\",G,Preto,true",
            "telefone_invalido,Sem Contacto,,lead,,,"
          ].join("\n")
        }
      });
      expect(importacao.statusCode).toBe(201);
      expect(importacao.json()).toEqual(
        expect.objectContaining({
          total: 3,
          criados: 1,
          atualizados: 1,
          erros: 1
        })
      );
      expect(importacao.json().linhas[2]).toEqual(
        expect.objectContaining({
          status: "ERRO",
          erro: expect.stringContaining("telefone")
        })
      );

      const lista = await app.inject({ method: "GET", url: "/clientes", headers: loja });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().clientes).toHaveLength(1);
      const clienteImportado = lista.json().clientes[0];
      expect(clienteImportado).toEqual(
        expect.objectContaining({
          nome: "Ana Cliente Atualizada",
          telefone: "937624785",
          consentimentoMarketing: true
        })
      );
      expect(clienteImportado.tags).toEqual(expect.arrayContaining(["vip", "moda", "retorno"]));
      expect(clienteImportado.preferencias).toEqual(
        expect.objectContaining({
          tamanho: "G",
          cor: "Preto"
        })
      );

      const duplicado = await app.inject({
        method: "POST",
        url: "/clientes",
        headers: loja,
        payload: {
          email: "ana.duplicada@example.com",
          nome: "Ana Duplicada",
          username: "ana_live",
          tags: ["instagram"],
          preferencias: { bairroEntrega: "Talatona" },
          consentimentoDados: true
        }
      });
      expect(duplicado.statusCode).toBe(201);

      const preview = await app.inject({
        method: "POST",
        url: "/clientes/mesclar/preview",
        headers: loja,
        payload: {
          clienteDestinoId: clienteImportado.id,
          clienteOrigemId: duplicado.json().id
        }
      });
      expect(preview.statusCode).toBe(200);
      expect(preview.json().resultado).toEqual(
        expect.objectContaining({
          nome: "Ana Cliente Atualizada",
          username: "ana_live"
        })
      );
      expect(preview.json().resultado.tags).toEqual(expect.arrayContaining(["vip", "instagram"]));

      const fusao = await app.inject({
        method: "POST",
        url: "/clientes/mesclar",
        headers: loja,
        payload: {
          clienteDestinoId: clienteImportado.id,
          clienteOrigemId: duplicado.json().id,
          motivo: "Duplicado importado de rede social"
        }
      });
      expect(fusao.statusCode).toBe(200);
      expect(fusao.json().cliente).toEqual(
        expect.objectContaining({
          id: clienteImportado.id,
          username: "ana_live"
        })
      );
      expect(fusao.json().cliente.preferencias).toEqual(
        expect.objectContaining({
          bairroEntrega: "Talatona"
        })
      );

      const origemDepois = await app.inject({
        method: "GET",
        url: `/clientes/${duplicado.json().id}`,
        headers: loja
      });
      expect(origemDepois.statusCode).toBe(200);
      expect(origemDepois.json().cliente).toEqual(
        expect.objectContaining({
          estadoRelacionamento: "BLOQUEADO"
        })
      );
      expect(origemDepois.json().cliente.preferencias.mescladoPara).toBe(clienteImportado.id);

      const segmentos = await app.inject({ method: "GET", url: "/clientes/segmentos", headers: loja });
      expect(segmentos.statusCode).toBe(200);
      expect(segmentos.json().segmentos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "vip", total: 1 }),
          expect.objectContaining({ id: "nunca-comprou", total: 2 })
        ])
      );

      const acao = await app.inject({
        method: "POST",
        url: `/clientes/${clienteImportado.id}/acoes`,
        headers: loja,
        payload: {
          tipo: "FOLLOW_UP",
          titulo: "Falar com cliente VIP",
          observacao: "Confirmar preferência de tamanho",
          prioridade: "ALTA"
        }
      });
      expect(acao.statusCode).toBe(201);
      expect(acao.json().tarefa).toEqual(
        expect.objectContaining({
          clienteId: clienteImportado.id,
          clienteTelefone: "937624785",
          tipo: "FOLLOW_UP",
          prioridade: "ALTA"
        })
      );
    } finally {
      await app.close();
    }
  });

  it("importa produtos por CSV e arquiva sem apagar histórico comercial", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444101", "Loja CRM Catálogo");

      const importacao = await app.inject({
        method: "POST",
        url: "/pecas/importar.csv",
        headers: loja,
        payload: {
          csv: [
            "codigo,nome,descricao,precoEmKwanza,custoEmKwanza,quantidade,stockMinimo,categoria,colecao,fotos",
            "SKU-IMPORT-1,Camisa live,Camisa pronta para venda,15000,9000,3,1,Roupas,Live atual,https://example.com/camisa.png",
            "SKU-IMPORT-1,Camisa live atualizada,Camisa com novo nome,16000,9500,4,1,Roupas,Reposição,https://example.com/camisa2.png",
            ",Sem código,Inválido,1000,,1,,Roupas,,"
          ].join("\n")
        }
      });
      expect(importacao.statusCode).toBe(201);
      expect(importacao.json()).toEqual(
        expect.objectContaining({
          total: 3,
          criados: 1,
          atualizados: 1,
          erros: 1
        })
      );

      const lista = await app.inject({ method: "GET", url: "/pecas", headers: loja });
      expect(lista.statusCode).toBe(200);
      expect(lista.json()).toEqual([
        expect.objectContaining({
          codigo: "SKU-IMPORT-1",
          nome: "Camisa live atualizada",
          precoEmKwanza: 16_000,
          quantidade: 4,
          colecao: "Reposição"
        })
      ]);

      const arquivo = await app.inject({
        method: "POST",
        url: "/pecas/SKU-IMPORT-1/arquivar",
        headers: loja,
        payload: { motivo: "Produto fora da coleção ativa" }
      });
      expect(arquivo.statusCode).toBe(200);
      expect(arquivo.json()).toEqual(
        expect.objectContaining({
          codigo: "SKU-IMPORT-1",
          estadoStock: "ARQUIVADO",
          arquivadaEm: expect.any(String)
        })
      );
    } finally {
      await app.close();
    }
  });

  it("gera operação de pedidos: orçamento, listas, exportação filtrada e tarefas de recuperação", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444201", "Loja CRM Pedidos");
      await criarPeca(app, loja, "OP-1", 10, 12_000, 7_000);
      await criarPeca(app, loja, "OP-2", 10, 8_000, 5_000);
      const cliente = await criarCliente(app, loja);

      const orcamento = await app.inject({
        method: "POST",
        url: "/pedidos/orcamentos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [
            { codigoPeca: "OP-1", quantidade: 2 },
            { codigoPeca: "OP-2", quantidade: 1 }
          ],
          taxaEntregaEmKwanza: 2_000,
          validadeMinutos: 45,
          canal: "whatsapp"
        }
      });
      expect(orcamento.statusCode).toBe(201);
      expect(orcamento.json().orcamento).toEqual(
        expect.objectContaining({
          clienteId: cliente.id,
          subtotalEmKwanza: 32_000,
          taxaEntregaEmKwanza: 2_000,
          totalEmKwanza: 34_000
        })
      );

      const pedidoPendente = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "OP-1", quantidade: 1 }],
          enderecoEntrega: "Talatona, Rua 2",
          taxaEntregaEmKwanza: 1_500,
          origem: "whatsapp",
          canal: "whatsapp"
        }
      });
      expect(pedidoPendente.statusCode).toBe(201);

      const pedidoPago = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "OP-2", quantidade: 2 }],
          enderecoEntrega: "Kilamba, Quarteirão A",
          taxaEntregaEmKwanza: 2_000,
          origem: "site",
          canal: "site"
        }
      });
      expect(pedidoPago.statusCode).toBe(201);

      const pagamento = await app.inject({
        method: "POST",
        url: `/pedidos/${pedidoPago.json().id}/confirmar-pagamento`,
        headers: loja,
        payload: { observacao: "Pagamento confirmado" }
      });
      expect(pagamento.statusCode).toBe(200);

      const preparacao = await app.inject({ method: "GET", url: "/pedidos/preparacao", headers: loja });
      expect(preparacao.statusCode).toBe(200);
      expect(preparacao.json().produtos).toEqual([
        expect.objectContaining({
          codigoPeca: "OP-2",
          quantidade: 2,
          fotos: ["https://example.com/OP-2.png"]
        })
      ]);

      const entregas = await app.inject({ method: "GET", url: "/pedidos/entregas?bairro=kilamba", headers: loja });
      expect(entregas.statusCode).toBe(200);
      expect(entregas.json().pedidos).toEqual([
        expect.objectContaining({
          id: pedidoPago.json().id,
          enderecoEntrega: "Kilamba, Quarteirão A"
        })
      ]);

      const perfil = await app.inject({ method: "GET", url: `/pedidos/${pedidoPago.json().id}`, headers: loja });
      expect(perfil.statusCode).toBe(200);
      expect(perfil.json().resumoFinanceiro).toEqual(
        expect.objectContaining({
          margemEstimadaEmKwanza: 6_000,
          margemPercentual: expect.any(Number)
        })
      );

      const exportacaoFiltrada = await app.inject({
        method: "GET",
        url: "/pedidos/exportar.csv?estado=PAGO",
        headers: loja
      });
      expect(exportacaoFiltrada.statusCode).toBe(200);
      expect(exportacaoFiltrada.body).toContain(String(pedidoPago.json().numero));
      expect(exportacaoFiltrada.body).not.toContain(`\n${pedidoPendente.json().numero},`);

      const recuperacao = await app.inject({
        method: "POST",
        url: "/pedidos/recuperar-parados",
        headers: loja,
        payload: {
          estado: "AGUARDANDO_PAGAMENTO",
          idadeMinutos: 0,
          prioridade: "ALTA"
        }
      });
      expect(recuperacao.statusCode).toBe(201);
      expect(recuperacao.json().tarefas).toEqual([
        expect.objectContaining({
          pedidoId: pedidoPendente.json().id,
          tipo: "COBRANCA",
          prioridade: "ALTA"
        })
      ]);
    } finally {
      await app.close();
    }
  });

  it("gera relatórios comerciais práticos e configura métodos de pagamento do negócio", async () => {
    const app = await criarAplicacao();

    try {
      const loja = await autenticar(app, "923444301", "Loja CRM Relatórios");
      await criarPeca(app, loja, "RL-1", 10, 20_000, 12_000);
      await criarPeca(app, loja, "RL-2", 10, 5_000, 4_000);
      const cliente = await criarCliente(app, loja);

      const pedidoPago = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "RL-1", quantidade: 2 }],
          descontoEmKwanza: 2_000,
          motivoDesconto: "Campanha aprovada",
          taxaEntregaEmKwanza: 1_500,
          origem: "site",
          canal: "site"
        }
      });
      expect(pedidoPago.statusCode).toBe(201);
      await app.inject({
        method: "POST",
        url: `/pedidos/${pedidoPago.json().id}/confirmar-pagamento`,
        headers: loja,
        payload: { observacao: "Pago" }
      });

      const pedidoPendente = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers: loja,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "RL-2", quantidade: 1 }],
          origem: "whatsapp",
          canal: "whatsapp"
        }
      });
      expect(pedidoPendente.statusCode).toBe(201);

      const relatorio = await app.inject({ method: "GET", url: "/relatorios/comercial", headers: loja });
      expect(relatorio.statusCode).toBe(200);
      expect(relatorio.json().metricas).toEqual(
        expect.objectContaining({
          pedidosPagos: 1,
          pagamentosPendentes: 1,
          receitaBrutaEmKwanza: 45_000,
          descontosEmKwanza: 2_000,
          entregaEmKwanza: 1_500,
          receitaLiquidaEstimadaEmKwanza: 44_500
        })
      );
      expect(relatorio.json().rankings.produtosMaisVendidos[0]).toEqual(
        expect.objectContaining({
          codigoPeca: "RL-1",
          quantidadeVendida: 2,
          margemEstimadaEmKwanza: 16_000
        })
      );
      expect(relatorio.json().oportunidadesPerdidas).toEqual(
        expect.objectContaining({
          pedidosAguardandoPagamento: 1
        })
      );

      const resumoDiario = await app.inject({ method: "GET", url: "/relatorios/resumo-diario", headers: loja });
      expect(resumoDiario.statusCode).toBe(200);
      expect(resumoDiario.json().tarefasSugeridas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: "COBRANCA",
            quantidade: 1
          })
        ])
      );

      const csv = await app.inject({ method: "GET", url: "/relatorios/comercial.csv", headers: loja });
      expect(csv.statusCode).toBe(200);
      expect(csv.body).toContain("pedidosPagos,pagamentosPendentes,receitaBrutaEmKwanza");
      expect(csv.body).toContain("1,1,45000");

      const configuracaoPagamento = await app.inject({
        method: "PATCH",
        url: "/negocio/pagamentos",
        headers: loja,
        payload: {
          metodosPagamento: ["transferencia", "multicaixa"],
          instrucoesCobranca: "Enviar comprovativo pelo WhatsApp.",
          contasBancarias: [{ banco: "BAI", iban: "AO06004000000000000000000", titular: "Bizy Loja" }]
        }
      });
      expect(configuracaoPagamento.statusCode).toBe(200);
      expect(configuracaoPagamento.json().pagamentos).toEqual(
        expect.objectContaining({
          metodosPagamento: ["transferencia", "multicaixa"],
          instrucoesCobranca: "Enviar comprovativo pelo WhatsApp."
        })
      );

      const leituraPagamento = await app.inject({ method: "GET", url: "/negocio/pagamentos", headers: loja });
      expect(leituraPagamento.statusCode).toBe(200);
      expect(leituraPagamento.json().pagamentos.contasBancarias).toEqual([
        expect.objectContaining({ banco: "BAI", titular: "Bizy Loja" })
      ]);
    } finally {
      await app.close();
    }
  });
});
