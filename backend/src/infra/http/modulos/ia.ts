/**
 * Módulo HTTP para rotas de Inteligência Artificial.
 *
 * Expõe endpoints para:
 * - POST /ia/chat — chat completo (request → response)
 * - POST /ia/chat/stream — chat com streaming SSE
 * - POST /ia/produto/descricao — gerar descrição de produto com IA
 * - POST /ia/atendimento/resumo — resumir conversa de atendimento
 * - POST /ia/atendimento/sugestao — sugerir resposta de atendimento
 */

import type { FastifyInstance } from "fastify";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import type { ModuloHttp } from "./ModuloHttp.js";
import type { MensagemIA } from "../../../dominio/provedores/ProvedorIA.js";

export const moduloIA: ModuloHttp = {
  nome: "ia",
  descricao: "Endpoints de Inteligência Artificial (OpenRouter)",

  registrar(app: FastifyInstance, contexto: ContextoAplicacao) {

    app.addHook("preHandler", async (_request, reply) => {
      if (!contexto.assistenteIA) {
        return reply.code(503).send({ erro: "IA_INDISPONIVEL", mensagem: "Módulo de IA não configurado. Defina OPENROUTER_API_KEY." });
      }
    });

    // ───────────────────── POST /ia/chat ─────────────────────

    app.post("/ia/chat", async (request, reply) => {
      const body = request.body as {
        mensagens?: MensagemIA[];
        modelo?: string;
        temperatura?: number;
        maxTokens?: number;
      };

      if (!body.mensagens || !Array.isArray(body.mensagens) || body.mensagens.length === 0) {
        return reply.code(400).send({
          erro: "VALIDACAO",
          mensagem: "O campo 'mensagens' é obrigatório e deve ser um array não vazio.",
        });
      }

      const resposta = await contexto.assistenteIA!.chat(body.mensagens, {
        modelo: body.modelo,
        temperatura: body.temperatura,
        maxTokens: body.maxTokens,
      });

      return reply.send(resposta);
    });

    // ───────────────── POST /ia/chat/stream ──────────────────

    app.post("/ia/chat/stream", async (request, reply) => {
      const body = request.body as {
        mensagens?: MensagemIA[];
        modelo?: string;
        temperatura?: number;
        maxTokens?: number;
      };

      if (!body.mensagens || !Array.isArray(body.mensagens) || body.mensagens.length === 0) {
        return reply.code(400).send({
          erro: "VALIDACAO",
          mensagem: "O campo 'mensagens' é obrigatório e deve ser um array não vazio.",
        });
      }

      const stream = await contexto.assistenteIA!.chatStream(body.mensagens, {
        modelo: body.modelo,
        temperatura: body.temperatura,
        maxTokens: body.maxTokens,
      });

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply.raw.write(`data: ${JSON.stringify({ conteudo: value })}\n\n`);
        }
        reply.raw.write("data: [DONE]\n\n");
      } finally {
        reader.releaseLock();
        reply.raw.end();
      }
    });

    // ─────────────── POST /ia/produto/descricao ──────────────

    app.post("/ia/produto/descricao", async (request, reply) => {
      const body = request.body as {
        nome?: string;
        categoria?: string;
        preco?: number;
        detalhes?: string;
      };

      if (!body.nome) {
        return reply.code(400).send({
          erro: "VALIDACAO",
          mensagem: "O campo 'nome' do produto é obrigatório.",
        });
      }

      const descricao = await contexto.assistenteIA!.gerarDescricaoProduto({
        nome: body.nome,
        categoria: body.categoria,
        preco: body.preco,
        detalhes: body.detalhes,
      });

      return reply.send({ descricao });
    });

    // ────────────── POST /ia/atendimento/resumo ──────────────

    app.post("/ia/atendimento/resumo", async (request, reply) => {
      const body = request.body as {
        mensagens?: Array<{ remetente: string; texto: string }>;
      };

      if (!body.mensagens || !Array.isArray(body.mensagens) || body.mensagens.length === 0) {
        return reply.code(400).send({
          erro: "VALIDACAO",
          mensagem: "O campo 'mensagens' é obrigatório e deve ser um array não vazio.",
        });
      }

      const resumo = await contexto.assistenteIA!.resumirConversa(body.mensagens);
      return reply.send({ resumo });
    });

    // ─────────── POST /ia/atendimento/sugestao ───────────────

    app.post("/ia/atendimento/sugestao", async (request, reply) => {
      const body = request.body as {
        nomeCliente?: string;
        mensagemCliente?: string;
        historicoResumo?: string;
        nomeNegocio?: string;
      };

      if (!body.nomeCliente || !body.mensagemCliente) {
        return reply.code(400).send({
          erro: "VALIDACAO",
          mensagem: "Os campos 'nomeCliente' e 'mensagemCliente' são obrigatórios.",
        });
      }

      const sugestao = await contexto.assistenteIA!.sugerirRespostaAtendimento({
        nomeCliente: body.nomeCliente,
        mensagemCliente: body.mensagemCliente,
        historicoResumo: body.historicoResumo,
        nomeNegocio: body.nomeNegocio,
      });

      return reply.send({ sugestao });
    });
  },
};
