import {
  AprovarComentarioManualSchema,
  ComentarioManualSchema,
  ComentarioManualSessaoSchema,
  IniciarLiveSchema,
  LimparDadosOperacionaisSchema,
  RejeitarComentarioManualSchema
} from "../../../dominio/esquemas.js";
import type { ComentarioLive } from "../../../dominio/tipos.js";
import { criarProviderLive, type ContextoAplicacao, type SessaoLive } from "../ContextoAplicacao.js";
import { exigirUsuarioAutenticado } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloLives: ModuloHttp = {
  nome: "lives",
  descricao: "Captura de comentários, sessões de live e entrada manual de contingência.",
  registrar(app, contexto) {
    app.get("/eventos", async (_request, reply) => {
      contexto.hubTempoReal.adicionarCliente(reply);
    });

    app.post("/lives/iniciar", async (request, reply) => {
      const dados = IniciarLiveSchema.parse(request.body);
      const provider = criarProviderLive(dados.provider);
      const id = `${dados.provider}_${dados.liveUsername}_${Date.now()}`;
      const sessao: SessaoLive = {
        id,
        username: dados.liveUsername,
        providerNome: dados.provider,
        provider,
        iniciadaEm: new Date(),
        status: "CONECTANDO",
        comentariosRecebidos: 0,
        comentariosProcessados: 0,
        comentariosComErro: 0,
        ultimoComentarioEm: null,
        ultimoErro: null
      };

      provider.onComment((comentario) => {
        void processarComentarioDaSessao(contexto, sessao, comentario).catch((erro) => {
          app.log.error(erro);
        });
      });

      contexto.sessoesLive.set(id, sessao);
      await salvarSessaoLive(contexto, sessao, true);

      try {
        await provider.connect(dados.liveUsername);
        sessao.status = "CONECTADA";
        sessao.ultimoErro = null;
        await salvarSessaoLive(contexto, sessao, true);
      } catch (erro) {
        sessao.status = "ERRO";
        sessao.ultimoErro = erro instanceof Error ? erro.message : "Falha ao conectar live.";
        contexto.sessoesLive.delete(id);
        await salvarSessaoLive(contexto, sessao, false, new Date());
        throw erro;
      }

      contexto.eventos.emitir("LIVE_CONNECTED", {
        id,
        username: dados.liveUsername,
        provider: dados.provider
      });

      return reply.code(201).send(mapearSessaoLive(sessao));
    });

    app.get("/lives", async () => [...contexto.sessoesLive.values()].map(mapearSessaoLive));

    app.post("/lives/:id/parar", async (request, reply) => {
      const { id } = request.params as { id: string };
      const sessao = contexto.sessoesLive.get(id);

      if (!sessao) {
        return reply.code(404).send({ erro: "LIVE_NAO_ENCONTRADA", mensagem: "Sessão de live não encontrada." });
      }

      await sessao.provider.disconnect();
      sessao.status = "ENCERRADA";
      contexto.sessoesLive.delete(id);
      await contexto.repositorios.sessoesLive.encerrar(id);
      contexto.eventos.emitir("LIVE_DISCONNECTED", { id, username: sessao.username, provider: sessao.providerNome });

      return { sucesso: true, id };
    });

    app.post("/lives/:id/comentarios/manual", async (request, reply) => {
      const { id } = request.params as { id: string };
      const sessao = contexto.sessoesLive.get(id);

      if (!sessao) {
        return reply.code(404).send({ erro: "LIVE_NAO_ENCONTRADA", mensagem: "Sessão de live não encontrada." });
      }

      const dados = ComentarioManualSessaoSchema.parse(request.body ?? {});
      const comentario: ComentarioLive = {
        source: "manual",
        provider: `${sessao.providerNome}:manual`,
        liveId: sessao.id,
        username: dados.username,
        userId: dados.userId,
        displayName: dados.displayName,
        avatarUrl: dados.avatarUrl,
        commentText: dados.commentText,
        timestamp: new Date()
      };

      const resultado = await processarComentarioDaSessao(contexto, sessao, comentario);
      return reply.code(201).send(resultado);
    });

    app.post("/comentarios/manual", async (request, reply) => {
      const dados = ComentarioManualSchema.parse(request.body);
      const comentario: ComentarioLive = {
        source: "manual",
        provider: dados.provider,
        liveId: dados.liveId,
        username: dados.username,
        userId: dados.userId,
        displayName: dados.displayName,
        avatarUrl: dados.avatarUrl,
        commentText: dados.commentText,
        timestamp: new Date()
      };

      const resultado = await contexto.processadorComentarios.processar(comentario);
      return reply.code(201).send(resultado);
    });

    app.get("/comentarios", async (request) => {
      const incluirIgnorados = (request.query as { incluirIgnorados?: string | boolean } | undefined)?.incluirIgnorados;

      return contexto.consultaPainel.listarComentarios({
        incluirIgnorados: incluirIgnorados === true || incluirIgnorados === "true"
      });
    });

    app.delete("/comentarios/dados-operacionais", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para limpar dados operacionais.");
      if (!usuario) return;

      LimparDadosOperacionaisSchema.parse(request.body ?? {});
      return contexto.limparDadosComunicacao.executar();
    });

    app.post("/comentarios/:id/aprovar", async (request) => {
      const { id } = request.params as { id: string };
      const dados = AprovarComentarioManualSchema.parse(request.body ?? {});
      return contexto.revisaoComentarios.aprovarComentario(id, dados);
    });

    app.post("/comentarios/:id/rejeitar", async (request) => {
      const { id } = request.params as { id: string };
      const dados = RejeitarComentarioManualSchema.parse(request.body ?? {});
      return contexto.revisaoComentarios.rejeitarComentario(id, dados.motivo);
    });
  }
};

async function processarComentarioDaSessao(contexto: ContextoAplicacao, sessao: SessaoLive, comentario: ComentarioLive) {
  sessao.comentariosRecebidos += 1;
  sessao.ultimoComentarioEm = new Date();

  try {
    const resultado = await contexto.processadorComentarios.processar(comentario);
    sessao.comentariosProcessados += 1;
    sessao.ultimoErro = null;
    await salvarSessaoLive(contexto, sessao, true);
    return resultado;
  } catch (erro) {
    sessao.comentariosComErro += 1;
    sessao.ultimoErro = erro instanceof Error ? erro.message : "Erro ao processar comentário da live.";
    await salvarSessaoLive(contexto, sessao, true);
    throw erro;
  }
}

function mapearSessaoLive({ provider: _provider, ...sessao }: SessaoLive) {
  return sessao;
}

export async function salvarSessaoLive(
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
