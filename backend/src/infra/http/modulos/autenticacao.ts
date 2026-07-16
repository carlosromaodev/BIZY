import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  AtualizarPagamentosNegocioSchema,
  ConfirmarCodigoLoginSchema,
  AtualizarModuloNegocioSchema,
  ConfigurarPerfilOnboardingSchema,
  CriarProdutoInicialOnboardingSchema,
  LoginEstudantilSchema,
  ModuloNegocioParametroSchema,
  SalvarNegocioOnboardingSchema,
  QueryGoogleCallbackSchema,
  QueryRedirectSchema,
  SolicitarCodigoLoginSchema
} from "../../../dominio/esquemas.js";
import { ErroAutenticacaoEstudantil } from "../../../use-case/AutenticacaoEstudantilUseCase.js";
import { ErroEnvioSms } from "../../../use-case/AutenticacaoTelefoneUseCase.js";
import { exigirPermissaoComercial, resolverContextoComercial } from "../contextoComercial.js";
import { ehErroInfraestrutura } from "../errosHttp.js";
import {
  assinarJwtSessao,
  definirCookieSessao,
  exigirUsuarioAutenticado,
  limparCookieSessao,
  resolverSessaoJwt
} from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloAutenticacao: ModuloHttp = {
  nome: "autenticacao",
  descricao: "Login por telefone, confirmação de SMS e gestão de sessão.",
  registrar(app, contexto) {
    app.get("/auth/disponibilidade", async () => obterDisponibilidadeAutenticacao(contexto.provedorSms.configurado));

    app.post("/auth/telefone/solicitar-codigo", async (request, reply) => {
      if (!obterDisponibilidadeAutenticacao(contexto.provedorSms.configurado).metodos.telefone.disponivel) {
        return reply.code(503).send({
          erro: "LOGIN_SMS_INDISPONIVEL",
          mensagem: "O acesso por SMS está temporariamente indisponível."
        });
      }

      const dados = SolicitarCodigoLoginSchema.parse(request.body);

      try {
        const resultado = await contexto.autenticacaoTelefone.solicitarCodigo(dados);
        return reply.code(202).send(resultado);
      } catch (erro) {
        if (erro instanceof ErroEnvioSms) {
          request.log.warn({ providerError: erro.message }, "Falha ao enviar OTP por SMS.");
          return reply.code(503).send({
            erro: "LOGIN_SMS_INDISPONIVEL",
            mensagem: "Não foi possível enviar o código agora. Tente novamente dentro de instantes."
          });
        }
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "LOGIN_SMS", mensagem: (erro as Error).message });
      }
    });

    app.post("/auth/telefone/confirmar-codigo", async (request, reply) => {
      const dados = ConfirmarCodigoLoginSchema.parse(request.body);

      try {
        const resultado = await contexto.autenticacaoTelefone.confirmarCodigo(dados);
        const token = await assinarJwtSessao({
          usuarioId: resultado.usuario.id,
          sessaoId: resultado.sessaoId,
          tokenInterno: resultado.token,
          expiraEm: resultado.expiraEm
        });
        definirCookieSessao(reply, token, resultado.expiraEm);
        return {
          sucesso: resultado.sucesso,
          token,
          expiraEm: resultado.expiraEm,
          usuario: resultado.usuario
        };
      } catch (erro) {
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "LOGIN_CODIGO", mensagem: (erro as Error).message });
      }
    });


    app.post("/auth/estudantil/login", async (request, reply) => {
      if (!obterDisponibilidadeAutenticacao(contexto.provedorSms.configurado).metodos.estudante.disponivel) {
        return reply.code(503).send({
          erro: "LOGIN_ESTUDANTIL_INDISPONIVEL",
          mensagem: "O acesso estudantil está temporariamente indisponível."
        });
      }

      const dados = LoginEstudantilSchema.parse(request.body);

      try {
        const resultado = await contexto.autenticacaoEstudantil.login(dados);
        const token = await assinarJwtSessao({
          usuarioId: resultado.usuario.id,
          sessaoId: resultado.sessaoId,
          tokenInterno: resultado.token,
          expiraEm: resultado.expiraEm
        });
        definirCookieSessao(reply, token, resultado.expiraEm);
        return { token, expiraEm: resultado.expiraEm, usuario: resultado.usuario, perfil: resultado.perfil };
      } catch (erro) {
        if (erro instanceof ErroAutenticacaoEstudantil) {
          const status =
            erro.codigo === "CREDENCIAIS_INVALIDAS"
              ? 401
              : erro.codigo === "PERFIL_INCOMPLETO"
                ? 422
                : 503;
          return reply.code(status).send({
            erro: `LOGIN_ESTUDANTIL_${erro.codigo}`,
            mensagem: erro.message
          });
        }
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "LOGIN_ESTUDANTIL", mensagem: (erro as Error).message });
      }
    });

    app.get("/auth/google/status", async () => {
      const google = obterDisponibilidadeAutenticacao(contexto.provedorSms.configurado).metodos.google;
      return {
        configurado: google.disponivel,
        mensagem: google.disponivel
          ? "Login com Gmail disponível."
          : "Login com Gmail temporariamente indisponível."
      };
    });

    app.get("/auth/google/iniciar", async (request, reply) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return reply.code(503).send({
          erro: "GOOGLE_NAO_CONFIGURADO",
          mensagem: "Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET para ativar o login com Gmail."
        });
      }

      const query = QueryRedirectSchema.parse(request.query ?? {});
      const redirectUri = obterGoogleRedirectUri();
      const estado = assinarEstadoGoogle({
        redirect: sanitizarRedirectFrontend(query.redirect ?? "/onboarding"),
        nonce: randomUUID(),
        exp: Date.now() + 10 * 60_000
      });
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", estado);
      url.searchParams.set("prompt", "select_account");

      return reply.redirect(url.toString());
    });

    app.get("/auth/google/callback", async (request, reply) => {
      const query = QueryGoogleCallbackSchema.parse(request.query ?? {});

      if (query.error) {
        return reply.redirect(criarUrlFrontendComErro("/login", "Login Gmail cancelado."));
      }

      if (!query.code || !query.state) {
        return reply.code(400).send({ erro: "GOOGLE_CALLBACK_INVALIDO", mensagem: "Callback Google inválido." });
      }

      const estado = verificarEstadoGoogle(query.state);
      if (!estado) {
        return reply.code(400).send({ erro: "GOOGLE_STATE_INVALIDO", mensagem: "Sessão de login Gmail expirada." });
      }

      try {
        const perfil = await obterPerfilGoogle(query.code);
        const usuario = await contexto.repositorios.autenticacao.criarOuAtualizarUsuarioPorIdentidade({
          tipo: "GMAIL",
          provider: "google",
          providerUserId: perfil.sub,
          nome: perfil.name || perfil.email,
          email: perfil.email,
          avatarUrl: perfil.picture,
          origemCadastro: "GMAIL",
          dados: perfil
        });
        const sessao = await contexto.autenticacaoTelefone.criarSessaoParaUsuario(usuario.id);
        const token = await assinarJwtSessao({
          usuarioId: usuario.id,
          sessaoId: sessao.sessaoId,
          tokenInterno: sessao.token,
          expiraEm: sessao.expiraEm
        });
        definirCookieSessao(reply, token, sessao.expiraEm);

        return reply.redirect(criarUrlFrontendComSessao(estado.redirect));
      } catch (erro) {
        return reply.redirect(
          criarUrlFrontendComErro("/login", erro instanceof Error ? erro.message : "Não foi possível entrar com Gmail.")
        );
      }
    });

    app.get("/auth/sessao", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Sessão inválida ou expirada.");
      if (!usuario) return;

      return { usuario };
    });

    app.delete("/auth/sessao", async (request, reply) => {
      const sessao = await resolverSessaoJwt(request);
      await contexto.autenticacaoTelefone.encerrarSessao(sessao?.tokenInterno ?? null);
      limparCookieSessao(reply);
      return { sucesso: true };
    });

    app.get("/workspaces", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      const negocios = await contexto.repositorios.autenticacao.listarNegociosPorUsuario(usuario.id);
      const principal = await contexto.repositorios.autenticacao.buscarNegocioPrincipalPorUsuario(usuario.id);

      return {
        isolamentoObrigatorio: true,
        negocios: negocios.map((n) => ({
          id: n.id,
          nomeComercial: n.nomeComercial,
          segmento: n.segmento,
          tipo: n.tipo,
          moeda: n.moeda,
          fusoHorario: n.fusoHorario,
          slugPublico: n.slugPublico,
          papel: n.usuarioPapel ?? null,
          principal: n.id === principal?.id
        }))
      };
    });

    app.post("/workspaces/alternar", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      const { negocioId } = z.object({ negocioId: z.string().uuid() }).parse(request.body ?? {});
      const negocio = await contexto.repositorios.autenticacao.buscarNegocioPorUsuario(usuario.id, negocioId);

      if (!negocio) {
        return reply.code(403).send({
          erro: "ACESSO_NEGADO",
          mensagem: "Não tens acesso a este workspace ou o membro está inactivo."
        });
      }

      reply.header("X-Bizy-Limpar-Estado", "1");
      return { negocioId, sucesso: true, limparEstado: true };
    });

    app.get("/onboarding/estado", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      return contexto.onboardingBizy.obterEstado(usuario.id);
    });

    app.put("/onboarding/perfil", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      const dados = ConfigurarPerfilOnboardingSchema.parse(request.body);
      const perfil = await contexto.onboardingBizy.configurarPerfil(usuario.id, dados.contextos);
      return reply.send(perfil);
    });

    app.post("/onboarding/negocio", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      const dados = SalvarNegocioOnboardingSchema.parse(request.body);
      const negocio = await contexto.onboardingBizy.salvarNegocio(usuario.id, dados);
      return reply.code(201).send({ negocio });
    });

    app.post("/onboarding/produto-inicial", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      const dados = CriarProdutoInicialOnboardingSchema.parse(request.body);
      const produto = await contexto.onboardingBizy.criarProdutoInicial(usuario.id, dados);
      return reply.code(201).send({ produto });
    });

    app.get("/negocio/pagamentos", async (request, reply) => {
      const contextoComercial = await exigirPermissaoComercial(
        contexto,
        request,
        reply,
        "configuracoes:gerir",
        "Sem permissão para consultar pagamentos do negócio."
      );
      if (!contextoComercial) return;

      const pagamentos = extrairPagamentosNegocio(contextoComercial.negocio);
      return { pagamentos };
    });

    app.patch("/negocio/pagamentos", async (request, reply) => {
      const contextoComercial = await exigirPermissaoComercial(
        contexto,
        request,
        reply,
        "configuracoes:gerir",
        "Sem permissão para alterar pagamentos do negócio."
      );
      if (!contextoComercial) return;

      const dados = AtualizarPagamentosNegocioSchema.parse(request.body ?? {});
      const entrega = {
        ...contextoComercial.negocio.entrega,
        pagamentos: {
          instrucoesCobranca: dados.instrucoesCobranca,
          mensagemComprovativoPendente: dados.mensagemComprovativoPendente,
          mensagemPagamentoConfirmado: dados.mensagemPagamentoConfirmado,
          contasBancarias: dados.contasBancarias
        }
      };
      const negocio = await contexto.onboardingBizy.salvarNegocio(contextoComercial.usuario.id, {
        nomeComercial: contextoComercial.negocio.nomeComercial,
        segmento: contextoComercial.negocio.segmento,
        tipo: contextoComercial.negocio.tipo,
        nif: contextoComercial.negocio.nif,
        telefone: contextoComercial.negocio.telefone,
        whatsapp: contextoComercial.negocio.whatsapp,
        email: contextoComercial.negocio.email,
        instagram: contextoComercial.negocio.instagram,
        tiktok: contextoComercial.negocio.tiktok,
        provincia: contextoComercial.negocio.provincia,
        municipio: contextoComercial.negocio.municipio,
        endereco: contextoComercial.negocio.endereco,
        moeda: contextoComercial.negocio.moeda,
        fusoHorario: contextoComercial.negocio.fusoHorario,
        canaisVenda: contextoComercial.negocio.canaisVenda,
        metodosPagamento: dados.metodosPagamento,
        entrega,
        minutosReservaPadrao: contextoComercial.negocio.minutosReservaPadrao,
        slugPublico: contextoComercial.negocio.slugPublico,
        descricaoPublica: contextoComercial.negocio.descricaoPublica,
        lojaPublicadaEm: contextoComercial.negocio.lojaPublicadaEm
      });

      return { negocio, pagamentos: extrairPagamentosNegocio(negocio) };
    });

    app.get("/negocio/modulos", async (request, reply) => {
      const contextoComercial = await resolverContextoComercial(contexto, request, reply);
      if (!contextoComercial) return;

      return contexto.gestaoModulosNegocio.listar(contextoComercial.negocio.id);
    });

    app.patch("/negocio/modulos/:modulo", async (request, reply) => {
      const contextoComercial = await exigirPermissaoComercial(
        contexto,
        request,
        reply,
        "configuracoes:gerir",
        "Sem permissão para alterar módulos do negócio."
      );
      if (!contextoComercial) return;

      const params = ModuloNegocioParametroSchema.parse(request.params);
      const dados = AtualizarModuloNegocioSchema.parse(request.body ?? {});

      try {
        return await contexto.gestaoModulosNegocio.atualizar(contextoComercial.negocio.id, params.modulo, dados);
      } catch (erro) {
        return reply.code(400).send({
          erro: "MODULO_NEGOCIO_INVALIDO",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível alterar o módulo."
        });
      }
    });
  }
};

function obterDisponibilidadeAutenticacao(provedorSmsConfigurado: boolean) {
  const smsDev = process.env.LOGIN_SMS_DEV_MODE === "true";
  const estudantilDev = process.env.LOGIN_ESTUDANTIL_DEV_MODE === "true";
  const estudantilDireto = process.env.LOGIN_ESTUDANTIL_DIRECT_ENABLED !== "false";
  const estudantilRemoto = Boolean(process.env.UORCONNECT_API_URL?.trim());
  const estudantilConfigurado = estudantilDireto || estudantilRemoto || estudantilDev;
  const providersSuportados = (process.env.LOGIN_ESTUDANTIL_PROVIDERS ?? "uor,isptec")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider): provider is "uor" | "isptec" => provider === "uor" || provider === "isptec");
  const providers = Array.from(new Set(providersSuportados));
  const estudanteDisponivel = estudantilConfigurado && providers.length > 0;
  const modoAcademico = estudantilDireto
    ? "DIRETO"
    : estudantilRemoto
      ? "UOR_CONNECT"
      : estudantilDev
        ? "DESENVOLVIMENTO"
        : "INDISPONIVEL";

  return {
    versao: 3,
    metodos: {
      telefone: {
        disponivel: provedorSmsConfigurado || smsDev,
        canal: "SMS" as const
      },
      google: {
        disponivel: Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())
      },
      estudante: {
        disponivel: estudanteDisponivel,
        configurado: estudantilConfigurado,
        estado: estudanteDisponivel ? "DISPONIVEL" as const : "NAO_CONFIGURADO" as const,
        modo: modoAcademico,
        providers,
        instituicoes: providers.map((provider) => ({
          provider,
          nome: provider === "uor" ? "Universidade Óscar Ribas" : "ISPTEC",
          identificadores: provider === "uor"
            ? ["studentNumber", "username"] as const
            : ["studentNumber"] as const
        })),
        mensagem: estudanteDisponivel
          ? estudantilDireto
            ? "Validação directa com os portais institucionais disponível."
            : "Login académico disponível através do UOR Connect."
          : "O acesso académico está registado no Bizy, mas o provider institucional ainda não está configurado."
      }
    },
    modoTeste:
      process.env.NODE_ENV !== "production" &&
      process.env.LOGIN_UI_DEV_MODE === "true"
  };
}

function extrairPagamentosNegocio(negocio: {
  metodosPagamento: string[];
  entrega: Record<string, unknown>;
}) {
  const pagamentos = negocio.entrega.pagamentos && typeof negocio.entrega.pagamentos === "object"
    ? negocio.entrega.pagamentos as Record<string, unknown>
    : {};

  return {
    metodosPagamento: negocio.metodosPagamento,
    instrucoesCobranca: pagamentos.instrucoesCobranca ?? null,
    mensagemComprovativoPendente: pagamentos.mensagemComprovativoPendente ?? null,
    mensagemPagamentoConfirmado: pagamentos.mensagemPagamentoConfirmado ?? null,
    contasBancarias: Array.isArray(pagamentos.contasBancarias) ? pagamentos.contasBancarias : []
  };
}

function obterFrontendUrl() {
  return (
    process.env.APP_PUBLIC_URL?.trim() ||
    process.env.FRONTEND_URL?.split(",")[0]?.trim() ||
    process.env.ORIGEM_FRONTEND?.split(",")[0]?.trim() ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
}

function obterApiPublicaUrl() {
  return (
    process.env.API_PUBLIC_URL?.trim() ||
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    "http://localhost:3333"
  ).replace(/\/+$/, "");
}

function obterGoogleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${obterApiPublicaUrl()}/auth/google/callback`;
}

function sanitizarRedirectFrontend(valor: string) {
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : "/onboarding";
}

function assinarEstadoGoogle(payload: { redirect: string; nonce: string; exp: number }) {
  const corpo = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const assinatura = createHmac("sha256", obterSegredoAuth()).update(corpo).digest("base64url");
  return `${corpo}.${assinatura}`;
}

function verificarEstadoGoogle(valor: string): { redirect: string } | null {
  const [corpo, assinatura] = valor.split(".");
  if (!corpo || !assinatura) return null;

  const assinaturaEsperada = createHmac("sha256", obterSegredoAuth()).update(corpo).digest("base64url");
  if (assinatura !== assinaturaEsperada) return null;

  try {
    const payload = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as { redirect?: string; exp?: number };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { redirect: sanitizarRedirectFrontend(payload.redirect ?? "/onboarding") };
  } catch {
    return null;
  }
}

function obterSegredoAuth() {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) {
    throw new Error("AUTH_SECRET não configurado. Defina a variável de ambiente.");
  }
  return segredo;
}

async function obterPerfilGoogle(code: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Login Gmail não configurado.");

  const respostaToken = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: obterGoogleRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  const token = await respostaToken.json().catch(() => null) as { access_token?: string; error_description?: string } | null;
  if (!respostaToken.ok || !token?.access_token) {
    throw new Error(token?.error_description ?? "Google recusou a troca do código OAuth.");
  }

  const respostaPerfil = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  const perfil = await respostaPerfil.json().catch(() => null) as Record<string, unknown> | null;
  if (!respostaPerfil.ok || typeof perfil?.sub !== "string" || typeof perfil.email !== "string") {
    throw new Error("Google não devolveu os dados mínimos do perfil.");
  }

  return {
    sub: perfil.sub,
    email: perfil.email,
    name: typeof perfil.name === "string" ? perfil.name : perfil.email,
    picture: typeof perfil.picture === "string" ? perfil.picture : null
  };
}

function criarUrlFrontendComSessao(redirect: string) {
  const destino = new URL(sanitizarRedirectFrontend(redirect), obterFrontendUrl());
  destino.hash = new URLSearchParams({ bizy_auth: "cookie" }).toString();
  return destino.toString();
}

function criarUrlFrontendComErro(redirect: string, mensagem: string) {
  const destino = new URL(sanitizarRedirectFrontend(redirect), obterFrontendUrl());
  destino.hash = new URLSearchParams({ bizy_erro: mensagem }).toString();
  return destino.toString();
}
