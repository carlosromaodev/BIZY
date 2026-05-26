import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { ComentarioLive } from "../../dominio/tipos.js";
import { criarContextoAplicacao, criarProviderLive, type ContextoAplicacao, type SessaoLive } from "./ContextoAplicacao.js";
import { classificarErroHttp, ehErroInfraestrutura } from "./errosHttp.js";
import { modulosHttp } from "./modulos/manifestoModulosHttp.js";
import { criarRateLimit } from "./rateLimit.js";
import { extrairTokenBearer } from "./seguranca.js";

type OrigemCorsPermitida = boolean | string | RegExp | Array<boolean | string | RegExp>;
type ResolverOrigemCors = OrigemCorsPermitida | ((
  origin: string | undefined,
  callback: (erro: Error | null, origin: OrigemCorsPermitida) => void
) => void);

export async function criarAplicacao(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
        censor: "[redigido]"
      }
    }
  });
  const contexto = criarContextoAplicacao(app.log);

  await app.register(cors, {
    origin: resolverOrigemCors()
  });

  validarConfiguracaoSegura();

  app.addHook(
    "preHandler",
    criarRateLimit({
      ativo: process.env.RATE_LIMIT_ATIVO !== "false",
      janelaMs: Number(process.env.RATE_LIMIT_JANELA_MS ?? 60_000),
      maximoPorJanela: Number(process.env.RATE_LIMIT_MAXIMO ?? 120),
      maximoPublicoPorJanela: Number(process.env.RATE_LIMIT_PUBLICO_MAXIMO ?? process.env.RATE_LIMIT_MAXIMO ?? 120)
    })
  );

  app.addHook("preHandler", async (request, reply) => {
    if (!deveExigirSessaoOperacional(request.url)) {
      return;
    }

    const tokenQuery = (request.query as { token?: string } | undefined)?.token;
    const token = extrairTokenBearer(request.headers.authorization) ?? tokenQuery ?? null;
    const usuario = await contexto.autenticacaoTelefone.obterSessao(token);

    if (!usuario) {
      return reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem: "Faça login para continuar." });
    }
  });

  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/n8n")) {
      return;
    }

    const tokenConfigurado = process.env.N8N_BACKEND_TOKEN;
    const tokenRecebido = request.headers["x-emeu-n8n-token"];

    if (tokenConfigurado && tokenRecebido !== tokenConfigurado) {
      return reply.code(401).send({ erro: "NAO_AUTORIZADO", mensagem: "Token do n8n inválido." });
    }
  });

  app.setErrorHandler((erro, _request, reply) => {
    const erroHttp = classificarErroHttp(erro);
    if (erroHttp.resposta.erro === "BANCO_INDISPONIVEL") {
      app.log.error(
        {
          erro: erroHttp.resposta.erro,
          statusCode: erroHttp.statusCode,
          causa: erro instanceof Error ? erro.name : typeof erro
        },
        erroHttp.resposta.mensagem
      );
    } else {
      app.log.error(erro);
    }
    return reply.code(erroHttp.statusCode).send(erroHttp.resposta);
  });

  for (const modulo of modulosHttp) {
    app.log.info({ modulo: modulo.nome }, "Registrando módulo HTTP");
    await modulo.registrar(app, contexto);
  }

  try {
    await restaurarSessoesLiveAtivas(contexto);
  } catch (erro) {
    if (!ehErroInfraestrutura(erro)) throw erro;
    app.log.error(erro, "Não foi possível restaurar sessões de live ativas durante o arranque.");
  }

  if (process.env.INICIAR_AGENDADOR_EXPIRACAO !== "false") {
    const intervalo = setInterval(() => {
      void contexto.monitorReservas.notificarReservasAExpirar().catch((erro) => app.log.error(erro));
      void contexto.monitorReservas.expirarReservasVencidas().catch((erro) => app.log.error(erro));
    }, 30_000);

    app.addHook("onClose", async () => clearInterval(intervalo));
  }

  app.addHook("onClose", async () => {
    for (const sessao of contexto.sessoesLive.values()) {
      await sessao.provider.disconnect();
    }

    await contexto.publicadorEventosN8n.fechar();
    await contexto.recuperacaoMensagensWhatsApp.fechar();
    await contexto.repositorios.encerrar?.();
  });

  return app;
}

async function restaurarSessoesLiveAtivas(contexto: ContextoAplicacao): Promise<void> {
  if (process.env.RESTAURAR_LIVES_ATIVAS === "false") return;

  const registros = await contexto.repositorios.sessoesLive.listarAtivas();

  for (const registro of registros) {
    if (contexto.sessoesLive.has(registro.id)) continue;

    const provider = criarProviderLive(registro.providerNome);
    const sessao: SessaoLive = {
      id: registro.id,
      username: registro.username,
      providerNome: registro.providerNome,
      provider,
      iniciadaEm: registro.iniciadaEm,
      status: "CONECTANDO",
      comentariosRecebidos: registro.comentariosRecebidos,
      comentariosProcessados: registro.comentariosProcessados,
      comentariosComErro: registro.comentariosComErro,
      ultimoComentarioEm: registro.ultimoComentarioEm,
      ultimoErro: null
    };

    provider.onComment((comentario) => {
      void processarComentarioRestaurado(contexto, sessao, comentario).catch(async (erro) => {
        sessao.ultimoErro = erro instanceof Error ? erro.message : "Erro ao processar comentário da live restaurada.";
        await persistirSessaoRestaurada(contexto, sessao, true).catch(() => undefined);
      });
    });

    contexto.sessoesLive.set(sessao.id, sessao);

    try {
      await provider.connect(registro.username);
      sessao.status = "CONECTADA";
      await persistirSessaoRestaurada(contexto, sessao, true);
      contexto.eventos.emitir("LIVE_CONNECTED", {
        id: sessao.id,
        username: sessao.username,
        provider: sessao.providerNome,
        restaurada: true
      });
    } catch (erro) {
      sessao.status = "ERRO";
      sessao.ultimoErro = erro instanceof Error ? erro.message : "Falha ao restaurar live.";
      contexto.sessoesLive.delete(sessao.id);
      await persistirSessaoRestaurada(contexto, sessao, false, new Date());
    }
  }
}

async function processarComentarioRestaurado(
  contexto: ContextoAplicacao,
  sessao: SessaoLive,
  comentario: ComentarioLive
) {
  sessao.comentariosRecebidos += 1;
  sessao.ultimoComentarioEm = new Date();

  try {
    const resultado = await contexto.processadorComentarios.processar(comentario);
    sessao.comentariosProcessados += 1;
    sessao.ultimoErro = null;
    await persistirSessaoRestaurada(contexto, sessao, true);
    return resultado;
  } catch (erro) {
    sessao.comentariosComErro += 1;
    sessao.ultimoErro = erro instanceof Error ? erro.message : "Erro ao processar comentário da live restaurada.";
    await persistirSessaoRestaurada(contexto, sessao, true);
    throw erro;
  }
}

async function persistirSessaoRestaurada(
  contexto: ContextoAplicacao,
  sessao: SessaoLive,
  ativa: boolean,
  encerradaEm: Date | null = null
) {
  await contexto.repositorios.sessoesLive.salvar({
    id: sessao.id,
    username: sessao.username,
    providerNome: sessao.providerNome,
    status: sessao.status,
    ativa,
    iniciadaEm: sessao.iniciadaEm,
    encerradaEm,
    comentariosRecebidos: sessao.comentariosRecebidos,
    comentariosProcessados: sessao.comentariosProcessados,
    comentariosComErro: sessao.comentariosComErro,
    ultimoComentarioEm: sessao.ultimoComentarioEm,
    ultimoErro: sessao.ultimoErro
  });
}

function deveExigirSessaoOperacional(url: string): boolean {
  const caminho = url.split("?")[0];
  const rotasPublicas = ["/", "/saude"];

  if (rotasPublicas.includes(caminho)) return false;
  if (caminho.startsWith("/auth/")) return false;
  if (caminho.startsWith("/n8n/")) return false;
  if (caminho.startsWith("/publico/")) return false;
  if (caminho.startsWith("/webhooks/")) return false;

  return true;
}

function validarConfiguracaoSegura() {
  if (process.env.NODE_ENV !== "production") return;

  const erros: string[] = [];
  const n8nAtivo = process.env.N8N_EVENTOS_ATIVOS !== "false";

  if (!process.env.AUTH_SECRET) erros.push("AUTH_SECRET");
  if (!process.env.ORIGEM_FRONTEND) erros.push("ORIGEM_FRONTEND");
  if (n8nAtivo && !process.env.N8N_BACKEND_TOKEN) erros.push("N8N_BACKEND_TOKEN");
  if (n8nAtivo && process.env.N8N_WEBHOOK_EVENTOS_URL && !process.env.N8N_WEBHOOK_SECRET) {
    erros.push("N8N_WEBHOOK_SECRET");
  }
  if (!process.env.EVOLUTION_WEBHOOK_TOKEN) erros.push("EVOLUTION_WEBHOOK_TOKEN");
  if (process.env.LOGIN_SMS_DEV_MODE === "true") erros.push("LOGIN_SMS_DEV_MODE deve ser false");
  if (process.env.LOGIN_SMS_EXPOR_CODIGO_DEV === "true") erros.push("LOGIN_SMS_EXPOR_CODIGO_DEV deve ser false");

  if (erros.length) {
    throw new Error(`Configuração insegura para produção: ${erros.join(", ")}.`);
  }
}

function resolverOrigemCors(): ResolverOrigemCors {
  const origem = process.env.ORIGEM_FRONTEND?.trim();

  if (origem) {
    const origens = origem
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (process.env.NODE_ENV !== "production") {
      return (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        callback(null, origens.includes(origin) || origemLocalDevPermitida(origin) ? origin : false);
      };
    }

    return origens.length === 1 ? origens[0] : origens;
  }

  return process.env.NODE_ENV === "production" ? false : true;
}

function origemLocalDevPermitida(origin: string): boolean {
  try {
    const url = new URL(origin);
    const porta = Number(url.port || "80");
    const hostLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
    const portaVite = porta === 4173 || (porta >= 5173 && porta <= 5199);

    return ["http:", "https:"].includes(url.protocol) && hostLocal && portaVite;
  } catch {
    return false;
  }
}
