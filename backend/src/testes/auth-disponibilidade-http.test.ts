import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("disponibilidade dos métodos de autenticação", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      NODE_ENV: "test",
      MODO_ARMAZENAMENTO: "memoria",
      AUTH_SECRET: "segredo-de-testes-com-mais-de-32-caracteres",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      RATE_LIMIT_ATIVO: "false",
      LOGIN_SMS_DEV_MODE: "false",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "false",
      LOGIN_ESTUDANTIL_DEV_MODE: "false",
      LOGIN_ESTUDANTIL_DIRECT_ENABLED: "false",
      LOGIN_UI_DEV_MODE: "false",
      OMBALA_API_TOKEN: "",
      UORCONNECT_API_URL: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      LOGIN_ESTUDANTIL_PROVIDERS: "uor,isptec"
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
    vi.unstubAllGlobals();
  });

  it("não anuncia métodos sem provider e responde 503 em vez de erro genérico", async () => {
    const app = await criarAplicacao();

    try {
      const disponibilidade = await app.inject({ method: "GET", url: "/auth/disponibilidade" });
      expect(disponibilidade.statusCode).toBe(200);
      expect(disponibilidade.json()).toEqual({
        versao: 3,
        metodos: {
          telefone: { disponivel: false, canal: "SMS" },
          google: { disponivel: false },
          estudante: {
            disponivel: false,
            configurado: false,
            estado: "NAO_CONFIGURADO",
            modo: "INDISPONIVEL",
            providers: ["uor", "isptec"],
            instituicoes: [
              {
                provider: "uor",
                nome: "Universidade Óscar Ribas",
                identificadores: ["studentNumber", "username"]
              },
              {
                provider: "isptec",
                nome: "ISPTEC",
                identificadores: ["studentNumber"]
              }
            ],
            mensagem: "O acesso académico está registado no Bizy, mas o provider institucional ainda não está configurado."
          }
        },
        modoTeste: false
      });

      const telefone = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000010" }
      });
      expect(telefone.statusCode).toBe(503);
      expect(telefone.json()).toEqual(expect.objectContaining({ erro: "LOGIN_SMS_INDISPONIVEL" }));

      const estudante = await app.inject({
        method: "POST",
        url: "/auth/estudantil/login",
        payload: {
          provider: "uor",
          identificador: "20243454",
          tipoIdentificador: "studentNumber",
          palavraPasse: "teste"
        }
      });
      expect(estudante.statusCode).toBe(503);
      expect(estudante.json()).toEqual(expect.objectContaining({ erro: "LOGIN_ESTUDANTIL_INDISPONIVEL" }));
    } finally {
      await app.close();
    }
  });

  it("anuncia apenas os providers realmente configurados", async () => {
    process.env.OMBALA_API_TOKEN = "token-ombala";
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.UORCONNECT_API_URL = "https://uor.example.com";
    process.env.LOGIN_ESTUDANTIL_PROVIDERS = "uor";

    const app = await criarAplicacao();

    try {
      const disponibilidade = await app.inject({ method: "GET", url: "/auth/disponibilidade" });
      expect(disponibilidade.json()).toEqual(
        expect.objectContaining({
          metodos: {
            telefone: { disponivel: true, canal: "SMS" },
            google: { disponivel: true },
            estudante: {
              disponivel: true,
              configurado: true,
              estado: "DISPONIVEL",
              modo: "UOR_CONNECT",
              providers: ["uor"],
              instituicoes: [
                {
                  provider: "uor",
                  nome: "Universidade Óscar Ribas",
                  identificadores: ["studentNumber", "username"]
                }
              ],
              mensagem: "Login académico disponível através do UOR Connect."
            }
          }
        })
      );

      const google = await app.inject({ method: "GET", url: "/auth/google/status" });
      expect(google.json()).toEqual({
        configurado: true,
        mensagem: "Login com Gmail disponível."
      });
    } finally {
      await app.close();
    }
  });

  it("activa o login institucional directo sem depender da API UOR Connect", async () => {
    process.env.LOGIN_ESTUDANTIL_DIRECT_ENABLED = "true";
    process.env.UORCONNECT_API_URL = "";

    const app = await criarAplicacao();

    try {
      const disponibilidade = await app.inject({ method: "GET", url: "/auth/disponibilidade" });
      expect(disponibilidade.json()).toEqual(
        expect.objectContaining({
          versao: 3,
          metodos: expect.objectContaining({
            estudante: expect.objectContaining({
              disponivel: true,
              configurado: true,
              estado: "DISPONIVEL",
              modo: "DIRETO",
              providers: ["uor", "isptec"],
              mensagem: "Validação directa com os portais institucionais disponível."
            })
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("devolve 401 para credenciais institucionais rejeitadas pelo portal", async () => {
    process.env.LOGIN_ESTUDANTIL_DIRECT_ENABLED = "true";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("<html>login</html>", {
        status: 200,
        headers: { "set-cookie": "JSESSIONID=inicial; Path=/" }
      }))
      .mockResolvedValueOnce(new Response(
        '<form name="login">Credenciais inválidas</form>',
        { status: 200 }
      )));
    const app = await criarAplicacao();

    try {
      const resposta = await app.inject({
        method: "POST",
        url: "/auth/estudantil/login",
        payload: {
          provider: "uor",
          identificador: "20243454",
          tipoIdentificador: "studentNumber",
          palavraPasse: "senha-invalida"
        }
      });

      expect(resposta.statusCode).toBe(401);
      expect(resposta.json()).toEqual({
        erro: "LOGIN_ESTUDANTIL_CREDENCIAIS_INVALIDAS",
        mensagem: "Número de estudante, utilizador ou palavra-passe inválidos."
      });
    } finally {
      await app.close();
    }
  });

  it("responde 503 quando o provider SMS configurado rejeita o envio", async () => {
    process.env.OMBALA_API_TOKEN = "token-ombala";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ message: "provider indisponível" }), { status: 502 })
    ));

    const app = await criarAplicacao();

    try {
      const telefone = await app.inject({
        method: "POST",
        url: "/auth/telefone/solicitar-codigo",
        payload: { telefone: "923000010" }
      });

      expect(telefone.statusCode).toBe(503);
      expect(telefone.json()).toEqual({
        erro: "LOGIN_SMS_INDISPONIVEL",
        mensagem: "Não foi possível enviar o código agora. Tente novamente dentro de instantes."
      });
    } finally {
      await app.close();
    }
  });
});
