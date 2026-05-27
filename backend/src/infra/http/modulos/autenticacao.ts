import { createHmac, randomUUID } from "node:crypto";
import {
  AtualizarPagamentosNegocioSchema,
  ConfirmarCodigoLoginSchema,
  AtualizarModuloNegocioSchema,
  CriarProdutoInicialOnboardingSchema,
  LoginEstudantilSchema,
  ModuloNegocioParametroSchema,
  SalvarNegocioOnboardingSchema,
  SolicitarCodigoLoginSchema
} from "../../../dominio/esquemas.js";
import { exigirPermissaoComercial } from "../contextoComercial.js";
import { ehErroInfraestrutura } from "../errosHttp.js";
import {
  criarCookieSessao,
  criarCookieSessaoExpirado,
  exigirUsuarioAutenticado,
  extrairTokenAutenticacao
} from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloAutenticacao: ModuloHttp = {
  nome: "autenticacao",
  descricao: "Login por telefone, confirmação de SMS e gestão de sessão.",
  registrar(app, contexto) {
    app.post("/auth/telefone/solicitar-codigo", async (request, reply) => {
      const dados = SolicitarCodigoLoginSchema.parse(request.body);

      try {
        const resultado = await contexto.autenticacaoTelefone.solicitarCodigo(dados);
        return reply.code(202).send(resultado);
      } catch (erro) {
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "LOGIN_SMS", mensagem: (erro as Error).message });
      }
    });

    app.post("/auth/telefone/confirmar-codigo", async (request, reply) => {
      const dados = ConfirmarCodigoLoginSchema.parse(request.body);

      try {
        const resultado = await contexto.autenticacaoTelefone.confirmarCodigo(dados);
        definirCookieSessao(reply, resultado.token, resultado.expiraEm);
        return resultado;
      } catch (erro) {
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(400).send({ erro: "LOGIN_CODIGO", mensagem: (erro as Error).message });
      }
    });

    app.post("/auth/estudantil/login", async (request, reply) => {
      const dados = LoginEstudantilSchema.parse(request.body);

      try {
        const resultado = await contexto.autenticacaoEstudantil.login(dados);
        definirCookieSessao(reply, resultado.token, resultado.expiraEm);
        return resultado;
      } catch (erro) {
        if (ehErroInfraestrutura(erro)) throw erro;
        return reply.code(401).send({ erro: "LOGIN_ESTUDANTIL", mensagem: (erro as Error).message });
      }
    });

    app.get("/auth/google/status", async () => ({
      configurado: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      mensagem:
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ? "Login com Gmail configurado."
          : "Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET para ativar o login com Gmail."
    }));

    app.get("/auth/google/iniciar", async (request, reply) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return reply.code(503).send({
          erro: "GOOGLE_NAO_CONFIGURADO",
          mensagem: "Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET para ativar o login com Gmail."
        });
      }

      const query = request.query as { redirect?: string } | undefined;
      const redirectUri = obterGoogleRedirectUri();
      const estado = assinarEstadoGoogle({
        redirect: sanitizarRedirectFrontend(query?.redirect ?? "/onboarding"),
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
      const query = request.query as { code?: string; state?: string; error?: string } | undefined;

      if (query?.error) {
        return reply.redirect(criarUrlFrontendComErro("/login", "Login Gmail cancelado."));
      }

      if (!query?.code || !query.state) {
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
        definirCookieSessao(reply, sessao.token, sessao.expiraEm);

        return reply.redirect(criarUrlFrontendComSessao(estado.redirect, sessao.token, usuario));
      } catch (erro) {
        return reply.redirect(
          criarUrlFrontendComErro("/login", erro instanceof Error ? erro.message : "Não foi possível entrar com Gmail.")
        );
      }
    });

    app.get("/auth/sessao", async (request, reply) => {
      const usuario = await contexto.autenticacaoTelefone.obterSessao(extrairTokenAutenticacao(request));

      if (!usuario) {
        return reply.code(401).send({ erro: "NAO_AUTENTICADO", mensagem: "Sessão inválida ou expirada." });
      }

      return { usuario };
    });

    app.delete("/auth/sessao", async (request, reply) => {
      await contexto.autenticacaoTelefone.encerrarSessao(extrairTokenAutenticacao(request));
      reply.header("Set-Cookie", criarCookieSessaoExpirado());
      return { sucesso: true };
    });

    app.get("/onboarding/estado", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      return contexto.onboardingBizy.obterEstado(usuario.id);
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
      const contextoComercial = await exigirPermissaoComercial(
        contexto,
        request,
        reply,
        "configuracoes:gerir",
        "Sem permissão para consultar módulos do negócio."
      );
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

function definirCookieSessao(reply: { header(nome: string, valor: string): unknown }, token: string, expiraEm: Date) {
  reply.header("Set-Cookie", criarCookieSessao(token, expiraEm));
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
  return process.env.AUTH_SECRET ?? process.env.N8N_WEBHOOK_SECRET ?? "emeu-dev-secret";
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

function criarUrlFrontendComSessao(redirect: string, token: string, usuario: unknown) {
  const destino = new URL(sanitizarRedirectFrontend(redirect), obterFrontendUrl());
  destino.hash = new URLSearchParams({
    bizy_token: token,
    bizy_usuario: JSON.stringify(usuario)
  }).toString();
  return destino.toString();
}

function criarUrlFrontendComErro(redirect: string, mensagem: string) {
  const destino = new URL(sanitizarRedirectFrontend(redirect), obterFrontendUrl());
  destino.hash = new URLSearchParams({ bizy_erro: mensagem }).toString();
  return destino.toString();
}
