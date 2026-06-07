import {
  AprovarComentarioManualSchema,
  ComentarioManualSchema,
  ComentarioManualSessaoSchema,
  IniciarLiveSchema,
  LimparDadosOperacionaisSchema,
  RejeitarComentarioManualSchema
} from "../../../dominio/esquemas.js";
import type { DicionarioParserComentario } from "../../../dominio/servicos/InterpretadorComentario.js";
import type { ComentarioLive, NegocioBizy } from "../../../dominio/tipos.js";
import { criarProviderLive, type ContextoAplicacao, type SessaoLive } from "../ContextoAplicacao.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import { atualizarMetricasSessaoLive } from "../liveMetricas.js";
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
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para iniciar live.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = IniciarLiveSchema.parse(request.body);
      const provider = criarProviderLive(dados.provider);
      const id = `${dados.provider}_${dados.liveUsername}_${Date.now()}`;
      const sessao: SessaoLive = {
        id,
        negocioId: contextoComercial.negocio.id,
        dicionarioParser: extrairDicionarioParserDoNegocio(contextoComercial.negocio),
        username: dados.liveUsername,
        providerNome: dados.provider,
        provider,
        iniciadaEm: new Date(),
        status: "CONECTANDO",
        comentariosRecebidos: 0,
        comentariosProcessados: 0,
        comentariosComErro: 0,
        espectadoresAtuais: null,
        picoEspectadores: null,
        metricasAtualizadasEm: null,
        ultimoComentarioEm: null,
        ultimoErro: null
      };

      provider.onComment((comentario) => {
        void processarComentarioDaSessao(contexto, sessao, comentario).catch((erro) => {
          app.log.error(erro);
        });
      });
      provider.onMetrics?.((metricas) => atualizarMetricasSessaoLive(contexto, sessao, metricas));

      contexto.sessoesLive.set(id, sessao);
      await salvarSessaoLive(contexto, sessao, true);

      try {
        await provider.connect(dados.liveUsername);
        sessao.status = "CONECTADA";
        sessao.ultimoErro = null;
        await salvarSessaoLive(contexto, sessao, true);
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : "Falha ao conectar live.";
        sessao.status = "ERRO";
        sessao.ultimoErro = mensagem;
        contexto.sessoesLive.delete(id);
        await salvarSessaoLive(contexto, sessao, false, new Date());
        return reply.code(502).send({
          erro: "LIVE_CONEXAO_FALHOU",
          mensagem,
          dica: mensagem.includes("rede") || mensagem.includes("proxy")
            ? "Verifique se a VPS tem acesso à internet e se TIKTOK_PROXY_URL está configurado no .env."
            : mensagem.includes("não está em live")
              ? "O utilizador precisa estar a transmitir ao vivo no TikTok."
              : "Verifique o username e tente novamente."
        });
      }

      contexto.eventos.emitir("LIVE_CONNECTED", {
        id,
        username: dados.liveUsername,
        provider: dados.provider
      });

      return reply.code(201).send(mapearSessaoLive(sessao));
    });

    app.get("/lives", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para consultar lives.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      return [...contexto.sessoesLive.values()]
        .filter((sessao) => !sessao.negocioId || sessao.negocioId === contextoComercial.negocio.id)
        .map(mapearSessaoLive);
    });

    app.post("/lives/:id/parar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para parar live.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const sessao = contexto.sessoesLive.get(id);

      if (!sessao || (sessao.negocioId && sessao.negocioId !== contextoComercial.negocio.id)) {
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
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para registrar comentário da live.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const sessao = contexto.sessoesLive.get(id);

      if (!sessao || (sessao.negocioId && sessao.negocioId !== contextoComercial.negocio.id)) {
        return reply.code(404).send({ erro: "LIVE_NAO_ENCONTRADA", mensagem: "Sessão de live não encontrada." });
      }
      sessao.dicionarioParser = extrairDicionarioParserDoNegocio(contextoComercial.negocio);

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
        timestamp: new Date(),
        perfilUsuario: dados.perfilUsuario,
        eventoBruto: dados.eventoBruto
      };

      const resultado = await processarComentarioDaSessao(contexto, sessao, comentario);
      return reply.code(201).send(resultado);
    });

    app.post("/comentarios/manual", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para registrar comentários.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

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
        timestamp: new Date(),
        perfilUsuario: dados.perfilUsuario,
        eventoBruto: dados.eventoBruto
      };

      const resultado = await contexto.processadorComentarios.processar(comentario, {
        negocioId: contextoComercial.negocio.id,
        dicionarioParser: extrairDicionarioParserDoNegocio(contextoComercial.negocio)
      });
      return reply.code(201).send(resultado);
    });

    app.get("/comentarios", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para consultar comentários.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const incluirIgnorados = (request.query as { incluirIgnorados?: string | boolean } | undefined)?.incluirIgnorados;

      return contexto.consultaPainel.listarComentarios({
        incluirIgnorados: incluirIgnorados === true || incluirIgnorados === "true",
        negocioId: contextoComercial.negocio.id
      });
    });

    app.delete("/comentarios/dados-operacionais", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para limpar dados operacionais.");
      if (!usuario) return;

      LimparDadosOperacionaisSchema.parse(request.body ?? {});
      return contexto.limparDadosComunicacao.executar();
    });

    app.post("/comentarios/:id/aprovar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para revisar comentários.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AprovarComentarioManualSchema.parse(request.body ?? {});
      return contexto.revisaoComentarios.aprovarComentario(id, dados, { negocioId: contextoComercial.negocio.id });
    });

    app.post("/comentarios/:id/rejeitar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para revisar comentários.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = RejeitarComentarioManualSchema.parse(request.body ?? {});
      return contexto.revisaoComentarios.rejeitarComentario(id, dados.motivo, { negocioId: contextoComercial.negocio.id });
    });
  }
};

async function processarComentarioDaSessao(contexto: ContextoAplicacao, sessao: SessaoLive, comentario: ComentarioLive) {
  sessao.comentariosRecebidos += 1;
  sessao.ultimoComentarioEm = new Date();

  try {
    const resultado = await contexto.processadorComentarios.processar(comentario, {
      negocioId: sessao.negocioId,
      dicionarioParser: sessao.dicionarioParser
    });
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

function extrairDicionarioParserDoNegocio(negocio: NegocioBizy): DicionarioParserComentario | null {
  const entrega = objeto(negocio.entrega);
  const onboarding = objeto(entrega.onboardingOperacional);
  const parser = objeto(entrega.parserComentarios ?? entrega.dicionarioParser ?? entrega.dicionarioParserComentarios);
  const parserOnboarding = objeto(onboarding.parserComentarios ?? onboarding.dicionarioParser);
  const porSegmento = objeto(parser.porSegmento ?? entrega.parserComentariosPorSegmento);
  const segmento = negocio.segmento.toLowerCase().trim();
  const parserSegmento = objeto(porSegmento[segmento] ?? porSegmento[normalizarChave(segmento)]);
  const fontes = [parserOnboarding, parser, parserSegmento];

  const dicionario = fontes.reduce<DicionarioParserComentario>(
    (acumulado, fonte) => ({
      termosIntencaoCompra: [
        ...(acumulado.termosIntencaoCompra ?? []),
        ...listaTextos(fonte.termosIntencaoCompra ?? fonte.termosCompra)
      ],
      rotulosCodigoPeca: [
        ...(acumulado.rotulosCodigoPeca ?? []),
        ...listaTextos(fonte.rotulosCodigoPeca ?? fonte.rotulosCodigo ?? fonte.rotulosProduto)
      ],
      aliasesCodigoPeca: {
        ...(acumulado.aliasesCodigoPeca ?? {}),
        ...mapaTextos(fonte.aliasesCodigoPeca ?? fonte.aliasesProduto ?? fonte.produtosAlias)
      }
    }),
    {}
  );

  const temDados =
    Boolean(dicionario.termosIntencaoCompra?.length) ||
    Boolean(dicionario.rotulosCodigoPeca?.length) ||
    Boolean(Object.keys(dicionario.aliasesCodigoPeca ?? {}).length);

  return temDados ? dicionario : null;
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
}

function listaTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function mapaTextos(valor: unknown): Record<string, string> {
  const dados = objeto(valor);
  return Object.fromEntries(
    Object.entries(dados).filter(
      (entrada): entrada is [string, string] =>
        typeof entrada[0] === "string" &&
        entrada[0].trim().length > 0 &&
        typeof entrada[1] === "string" &&
        entrada[1].trim().length > 0
    )
  );
}

function normalizarChave(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mapearSessaoLive({
  provider: _provider,
  negocioId: _negocioId,
  dicionarioParser: _dicionarioParser,
  ...sessao
}: SessaoLive) {
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
