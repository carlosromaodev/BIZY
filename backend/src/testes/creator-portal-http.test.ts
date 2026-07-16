import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

function cookieDaResposta(resposta: { headers: Record<string, unknown> }) {
  const valor = resposta.headers["set-cookie"];
  const cookies = Array.isArray(valor) ? valor : [String(valor ?? "")];
  const cookie = cookies
    .flatMap((item) => item.split(/,(?=[^;,]+=)/))
    .map((item) => item.split(";")[0])
    .find((item) => item.startsWith("bizy_conta_sessao="));
  expect(cookie).toBeTruthy();
  return cookie as string;
}

async function entrarConta(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string) {
  const otp = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone } });
  const login = await app.inject({
    method: "POST", url: "/conta/otp/confirmar",
    payload: { telefone, codigo: otp.json().codigoDev }
  });
  expect(login.statusCode).toBe(200);
  return cookieDaResposta(login);
}

async function entrarSeller(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const otp = await app.inject({ method: "POST", url: "/auth/telefone/solicitar-codigo", payload: { telefone: "923777001", nome: "Seller Creator" } });
  const login = await app.inject({ method: "POST", url: "/auth/telefone/confirmar-codigo", payload: { telefone: "923777001", codigo: otp.json().codigoDev } });
  return { authorization: `Bearer ${login.json().token}` };
}

describe("Portal Creator autenticado", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      RATE_LIMIT_ATIVO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("associa apenas contacto verificado, isola contas e permite criar link do proprio perfil", async () => {
    const app = await criarAplicacao();
    try {
      const seller = await entrarSeller(app);
      const parceiro = await app.inject({
        method: "POST", url: "/afiliados", headers: seller,
        payload: {
          tipo: "CRIADOR", codigo: "CREATOR-VERIFICADO", nomePublico: "Creator Verificado",
          contacto: "923777099", regraComissao: { tipo: "PERCENTUAL", percentual: 12 }
        }
      });
      expect(parceiro.statusCode).toBe(201);

      const anonimo = await app.inject({ method: "GET", url: "/creator/portal" });
      expect(anonimo.statusCode).toBe(401);

      const cookie = await entrarConta(app, "923777099");
      const portal = await app.inject({ method: "GET", url: "/creator/portal", headers: { cookie } });
      expect(portal.statusCode).toBe(200);
      expect(portal.json().parceiros).toEqual([expect.objectContaining({ id: parceiro.json().id, codigo: "CREATOR-VERIFICADO" })]);
      expect(portal.json().metricas.receitaAtribuidaEmKwanza).toBe(0);
      expect(JSON.stringify(portal.json())).not.toContain("923777099");

      const produtoNaoAutorizado = await app.inject({
        method: "POST", url: "/creator/links/criar", headers: { cookie },
        payload: { parceiroId: parceiro.json().id, destinoTipo: "PRODUTO", slugLoja: "loja-creator", codigoProduto: "PROD-1" }
      });
      expect(produtoNaoAutorizado.statusCode).toBe(403);

      const link = await app.inject({
        method: "POST", url: "/creator/links/criar", headers: { cookie },
        payload: { parceiroId: parceiro.json().id, destinoTipo: "LOJA", slugLoja: "loja-creator" }
      });
      expect(link.statusCode).toBe(201);
      expect(link.json()).toEqual(expect.objectContaining({ afiliadoId: parceiro.json().id, destinoTipo: "LOJA" }));

      const cookieAlheio = await entrarConta(app, "923777098");
      const portalAlheio = await app.inject({ method: "GET", url: "/creator/portal", headers: { cookie: cookieAlheio } });
      expect(portalAlheio.statusCode).toBe(200);
      expect(portalAlheio.json().parceiros).toEqual([]);
      const idor = await app.inject({
        method: "POST", url: "/creator/links/criar", headers: { cookie: cookieAlheio },
        payload: { parceiroId: parceiro.json().id, destinoTipo: "LOJA", slugLoja: "loja-creator" }
      });
      expect(idor.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
