import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("limpeza de comentários e mensagens", () => {
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
    process.env = { ...ambienteOriginal };
  });

  it("exige autenticação para limpar dados operacionais de comunicação", async () => {
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "DELETE",
        url: "/comentarios/dados-operacionais",
        payload: { confirmacao: "LIMPAR" }
      });

      expect(resposta.statusCode).toBe(401);
      expect(resposta.json()).toEqual(expect.objectContaining({ erro: "NAO_AUTENTICADO" }));
    } finally {
      await app.close();
    }
  });

  it("limpa comentários, histórico CRM, outbox WhatsApp e códigos SMS sem apagar reservas", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      await criarPeca(app, headers, "71");

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_limpeza",
          username: "cliente_limpeza",
          displayName: "Cliente Limpeza",
          commentText: "eu quero 923456789 peca 71"
        }
      });
      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().reserva).toEqual(expect.objectContaining({ codigoPeca: "71" }));
      await aguardarProcessamentoEventos();

      const envioManual = await app.inject({
        method: "POST",
        url: "/whatsapp/mensagens",
        headers,
        payload: {
          telefone: "923456789",
          mensagem: "Mensagem de teste para limpeza"
        }
      });
      expect(envioManual.statusCode).toBe(202);
      const providerMessageId = envioManual.json().resultado.idExterno as string;
      expect(providerMessageId).toBeTruthy();
      await aguardarProcessamentoEventos();

      await app.inject({
        method: "POST",
        url: "/webhooks/evolution",
        payload: {
          event: "messages.update",
          instance: "bizy",
          data: {
            keyId: providerMessageId,
            remoteJid: "244923456789@s.whatsapp.net",
            fromMe: true,
            status: "ERROR",
            error: "Recipient not on WhatsApp"
          }
        }
      });
      await aguardarProcessamentoEventos();

      const outboxAntes = await app.inject({ method: "GET", url: "/automacoes/whatsapp/outbox/saude", headers });
      expect(outboxAntes.json().total).toBe(1);

      const limpeza = await app.inject({
        method: "DELETE",
        url: "/comentarios/dados-operacionais",
        headers,
        payload: { confirmacao: "LIMPAR" }
      });

      expect(limpeza.statusCode).toBe(200);
      expect(limpeza.json().apagados).toEqual(
        expect.objectContaining({
          comentarios: 1,
          mensagensAtendimento: expect.any(Number),
          conversasAtendimento: expect.any(Number),
          clientesAtendimento: expect.any(Number),
          mensagensWhatsapp: expect.any(Number),
          outboxWhatsapp: 1,
          codigosSms: expect.any(Number)
        })
      );
      expect(limpeza.json().apagados.mensagensAtendimento).toBeGreaterThan(0);
      expect(limpeza.json().apagados.mensagensWhatsapp).toBeGreaterThan(0);
      expect(limpeza.json().apagados.codigosSms).toBeGreaterThan(0);

      const comentariosDepois = await app.inject({
        method: "GET",
        url: "/comentarios?incluirIgnorados=true",
        headers
      });
      expect(comentariosDepois.json()).toEqual([]);

      const outboxDepois = await app.inject({ method: "GET", url: "/automacoes/whatsapp/outbox/saude", headers });
      expect(outboxDepois.json()).toEqual(expect.objectContaining({ total: 0, pendentes: 0, falhadas: 0 }));

      const reservasDepois = await app.inject({ method: "GET", url: "/reservas", headers });
      expect(reservasDepois.json()).toEqual([
        expect.objectContaining({ codigoPeca: "71", telefoneCliente: "923456789" })
      ]);
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000777", nome: "Vendedor Limpeza" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000777", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}

async function criarPeca(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  codigo: string
) {
  const resposta = await app.inject({
    method: "POST",
    url: "/pecas",
    headers,
    payload: {
      codigo,
      nome: `Artigo ${codigo}`,
      descricao: "Peça para teste de limpeza",
      precoEmKwanza: 12000,
      quantidade: 1,
      fotos: []
    }
  });

  expect(resposta.statusCode).toBe(201);
}

function aguardarProcessamentoEventos() {
  return new Promise((resolve) => setImmediate(resolve));
}
