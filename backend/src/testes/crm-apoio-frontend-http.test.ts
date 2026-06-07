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

async function criarProduto(app: Awaited<ReturnType<typeof criarAplicacao>>, headers: Record<string, string>) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo: "CRM-APOIO-1",
      nome: "Vestido atendimento",
      descricao: "Produto usado nos módulos de apoio do frontend.",
      precoEmKwanza: 15_000,
      custoEmKwanza: 8_000,
      quantidade: 6,
      fotos: ["https://example.com/produto.png"]
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

async function criarCliente(app: Awaited<ReturnType<typeof criarAplicacao>>, headers: Record<string, string>) {
  const resposta = await app.inject({
    method: "POST",
    url: "/clientes",
    headers,
    payload: {
      telefone: "937800001",
      nome: "Cliente Apoio",
      consentimentoDados: true,
      consentimentoMarketing: true
    }
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json();
}

describe("CRM apoio para módulos do frontend", () => {
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
      EVOLUTION_WEBHOOK_TOKEN: "",
      PUBLIC_STORE_BASE_URL: "https://usebizy.com"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...ambienteOriginal };
  });

  it("expõe contratos de pipeline, agenda, metas, cotações, respostas, actividades, formulários e sequências", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app, "923480001", "Loja Apoio Frontend");
      await criarProduto(app, headers);
      const cliente = await criarCliente(app, headers);

      const pedido = await app.inject({
        method: "POST",
        url: "/pedidos",
        headers,
        payload: {
          clienteId: cliente.id,
          itens: [{ codigoPeca: "CRM-APOIO-1", quantidade: 1 }],
          origem: "orcamento",
          canal: "whatsapp",
          observacao: "Cotação criada no atendimento."
        }
      });
      expect(pedido.statusCode).toBe(201);

      const tarefa = await app.inject({
        method: "POST",
        url: "/tarefas",
        headers,
        payload: {
          tipo: "COBRANCA",
          titulo: "Cobrar comprovativo",
          descricao: "Cliente pediu para pagar ainda hoje.",
          prioridade: "ALTA",
          clienteId: cliente.id,
          pedidoId: pedido.json().id,
          prazoEm: new Date(Date.now() + 60 * 60_000).toISOString()
        }
      });
      expect(tarefa.statusCode).toBe(201);

      const pipeline = await app.inject({ method: "GET", url: "/pipeline?limite=200", headers });
      expect(pipeline.statusCode).toBe(200);
      expect(pipeline.json().negocios).toEqual([
        expect.objectContaining({
          id: pedido.json().id,
          clienteNome: "Cliente Apoio",
          etapa: "CONTACTO_FEITO",
          valorEstimadoEmKwanza: 15_000
        })
      ]);

      const etapa = await app.inject({
        method: "PATCH",
        url: `/pipeline/${pedido.json().id}/etapa`,
        headers,
        payload: { etapa: "PROPOSTA_ENVIADA" }
      });
      expect(etapa.statusCode).toBe(200);
      expect(etapa.json().negocio).toEqual(expect.objectContaining({ id: pedido.json().id, etapa: "PROPOSTA_ENVIADA" }));

      const lembretes = await app.inject({ method: "GET", url: "/lembretes?limite=100", headers });
      expect(lembretes.statusCode).toBe(200);
      expect(lembretes.json().lembretes).toEqual([
        expect.objectContaining({
          id: tarefa.json().tarefa.id,
          tipo: "COBRANCA",
          estado: "PENDENTE",
          clienteNome: "Cliente Apoio"
        })
      ]);

      const concluir = await app.inject({
        method: "PATCH",
        url: `/lembretes/${tarefa.json().tarefa.id}`,
        headers,
        payload: { estado: "CONCLUIDO" }
      });
      expect(concluir.statusCode).toBe(200);
      expect(concluir.json().lembrete).toEqual(expect.objectContaining({ estado: "CONCLUIDO" }));

      const lembreteAtendimento = await app.inject({
        method: "POST",
        url: "/lembretes",
        headers,
        payload: {
          titulo: "Ligar para confirmar entrega",
          tipo: "FOLLOW_UP",
          dataHora: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
          clienteNome: "Cliente Apoio",
          conversaId: "conversa-atendimento-1",
          pedidoId: "reserva-legada-1",
          observacao: "Criado pelo painel de atendimento."
        }
      });
      expect(lembreteAtendimento.statusCode).toBe(201);
      expect(lembreteAtendimento.json().lembrete).toEqual(expect.objectContaining({
        clienteNome: "Cliente Apoio",
        conversaId: "conversa-atendimento-1",
        pedidoId: "reserva-legada-1",
        tipo: "FOLLOW_UP"
      }));

      const novaDataLembrete = new Date(Date.now() + 3 * 60 * 60_000).toISOString();
      const reagendamento = await app.inject({
        method: "PATCH",
        url: `/lembretes/${lembreteAtendimento.json().lembrete.id}`,
        headers,
        payload: {
          titulo: "Reunião para fechar entrega",
          tipo: "REUNIAO",
          dataHora: novaDataLembrete,
          clienteNome: "Cliente Apoio Atualizado",
          conversaId: "conversa-atendimento-2",
          pedidoId: "pedido-legado-2",
          observacao: "Reagendado no calendário CRM."
        }
      });
      expect(reagendamento.statusCode).toBe(200);
      expect(reagendamento.json().lembrete).toEqual(expect.objectContaining({
        titulo: "Reunião para fechar entrega",
        tipo: "REUNIAO",
        clienteNome: "Cliente Apoio Atualizado",
        conversaId: "conversa-atendimento-2",
        pedidoId: "pedido-legado-2",
        observacao: "Reagendado no calendário CRM."
      }));
      expect(new Date(reagendamento.json().lembrete.dataHora).toISOString()).toBe(novaDataLembrete);

      const metas = await app.inject({ method: "GET", url: "/metas?limite=50", headers });
      expect(metas.statusCode).toBe(200);
      expect(metas.json().metas.map((meta: { tipo: string }) => meta.tipo)).toEqual([
        "RECEITA",
        "PEDIDOS",
        "CLIENTES_NOVOS"
      ]);

      const cotacoes = await app.inject({ method: "GET", url: "/cotacoes?limite=200", headers });
      expect(cotacoes.statusCode).toBe(200);
      expect(cotacoes.json().cotacoes).toEqual([
        expect.objectContaining({
          id: pedido.json().id,
          clienteNome: "Cliente Apoio",
          estado: "ABERTA",
          totalEmKwanza: 15_000
        })
      ]);

      const envioCotacao = await app.inject({ method: "POST", url: `/cotacoes/${pedido.json().id}/enviar`, headers });
      expect(envioCotacao.statusCode).toBe(202);
      expect(envioCotacao.json().envio).toEqual(expect.objectContaining({ status: "REGISTADO" }));

      const conversaoCotacao = await app.inject({ method: "POST", url: `/cotacoes/${pedido.json().id}/converter`, headers });
      expect(conversaoCotacao.statusCode).toBe(200);
      expect(conversaoCotacao.json().cotacao).toEqual(expect.objectContaining({ pedidoConvertidoId: pedido.json().id }));

      const respostas = await app.inject({ method: "GET", url: "/respostas-rapidas?limite=100", headers });
      expect(respostas.statusCode).toBe(200);
      expect(respostas.json().respostas.length).toBeGreaterThanOrEqual(6);
      const respostaRapidaId = respostas.json().respostas[0].id;

      const favorita = await app.inject({
        method: "PATCH",
        url: `/respostas-rapidas/${respostaRapidaId}`,
        headers,
        payload: { favorita: true }
      });
      expect(favorita.statusCode).toBe(200);
      expect(favorita.json().resposta).toEqual(expect.objectContaining({ id: respostaRapidaId, favorita: true }));

      const actividades = await app.inject({ method: "GET", url: "/actividades?limite=100", headers });
      expect(actividades.statusCode).toBe(200);
      expect(actividades.json().actividades).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ titulo: "Cobrar comprovativo", clienteNome: "Cliente Apoio" })
        ])
      );

      const formularios = await app.inject({ method: "GET", url: "/formularios?limite=50", headers });
      expect(formularios.statusCode).toBe(200);
      expect(formularios.json().formularios).toEqual([
        expect.objectContaining({
          titulo: "Captação rápida de lead",
          ativo: true,
          campos: ["nome", "telefone", "produto_interesse"]
        })
      ]);

      const sequencias = await app.inject({ method: "GET", url: "/sequencias?limite=50", headers });
      expect(sequencias.statusCode).toBe(200);
      expect(sequencias.json().sequencias.map((sequencia: { tipo: string }) => sequencia.tipo)).toEqual([
        "BOAS_VINDAS",
        "COBRANCA",
        "POS_VENDA",
        "REACTIVACAO"
      ]);

      const sequenciaId = sequencias.json().sequencias[0].id;
      const pausa = await app.inject({
        method: "PATCH",
        url: `/sequencias/${sequenciaId}`,
        headers,
        payload: { estado: "PAUSADA" }
      });
      expect(pausa.statusCode).toBe(200);
      expect(pausa.json().sequencia).toEqual(expect.objectContaining({ id: sequenciaId, estado: "PAUSADA" }));
    } finally {
      await app.close();
    }
  });
});
