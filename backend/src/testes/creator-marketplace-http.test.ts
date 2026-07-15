import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };
async function seller(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) { const otp = await app.inject({ method: "POST", url: "/auth/telefone/solicitar-codigo", payload: { telefone, nome } }); const login = await app.inject({ method: "POST", url: "/auth/telefone/confirmar-codigo", payload: { telefone, codigo: otp.json().codigoDev } }); const headers = { authorization: `Bearer ${login.json().token}` }; await app.inject({ method: "PATCH", url: "/negocio/modulos/afiliados", headers, payload: { ativo: true } }); return headers; }
async function creator(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string) { const otp = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone } }); const login = await app.inject({ method: "POST", url: "/conta/otp/confirmar", payload: { telefone, codigo: otp.json().codigoDev } }); return { cookie: String(login.headers["set-cookie"]).split(";")[0] }; }

describe("Creator Marketplace", () => {
  beforeEach(() => { process.env = { ...ambienteOriginal, MODO_ARMAZENAMENTO: "memoria", N8N_EVENTOS_ATIVOS: "false", N8N_ASSUME_WHATSAPP: "true", WHATSAPP_PROVIDER: "console", INICIAR_AGENDADOR_EXPIRACAO: "false", LOGIN_SMS_DEV_MODE: "true", LOGIN_SMS_EXPOR_CODIGO_DEV: "true", RATE_LIMIT_ATIVO: "false", N8N_BACKEND_TOKEN: "", EVOLUTION_WEBHOOK_TOKEN: "" }; });
  afterEach(() => { vi.restoreAllMocks(); process.env = { ...ambienteOriginal }; });

  it("fecha oferta, candidatura cross-tenant, amostra e missão com ownership", async () => {
    const app = await criarAplicacao();
    try {
      const sellerA = await seller(app, "923792001", "Seller Marketplace A");
      const sellerB = await seller(app, "923792002", "Seller Marketplace B");
      const produto = await app.inject({ method: "POST", url: "/pecas", headers: sellerA, payload: { codigo: "CREATOR-OFFER-1", sku: "SKU-CREATOR-OFFER-1", nome: "Produto Creator Offer", descricao: "Produto real para oferta Creator", precoEmKwanza: 30000, custoEmKwanza: 15000, quantidade: 20, stockMinimo: 2, categoria: "Creator" } });
      expect(produto.statusCode).toBe(201);
      const parceiro = await app.inject({ method: "POST", url: "/afiliados", headers: sellerB, payload: { tipo: "CRIADOR", codigo: "CREATOR-MARKET-1", nomePublico: "Creator Marketplace", contacto: "923792099", regraComissao: { tipo: "PERCENTUAL", percentual: 8 } } });
      expect(parceiro.statusCode).toBe(201);

      const oferta = await app.inject({ method: "POST", url: "/creator/team/ofertas", headers: sellerA, payload: { codigo: "OFERTA-1", titulo: "Campanha Creator Julho", descricao: "Produzir conteúdo de demonstração do produto em contexto real.", comissaoTipo: "PERCENTUAL", comissaoValor: 1250, stockAmostras: 1, produtos: [{ codigoProduto: "CREATOR-OFFER-1" }], missoes: [{ titulo: "Publicar review", descricao: "Publicar uma review com divulgação comercial.", bonusEmKwanza: 5000 }] } });
      expect(oferta.statusCode).toBe(201);
      const publicar = await app.inject({ method: "PATCH", url: `/creator/team/ofertas/${oferta.json().id}/publicacao`, headers: sellerA, payload: { publicar: true } });
      expect(publicar.statusCode).toBe(200);

      const conta = await creator(app, "923792099");
      const descobrir = await app.inject({ method: "GET", url: "/creator/oportunidades/dados", headers: conta });
      expect(descobrir.statusCode).toBe(200);
      expect(descobrir.json().ofertas[0]).toEqual(expect.objectContaining({ id: oferta.json().id, comissaoValor: 1250, stockAmostras: 1 }));
      expect(descobrir.json().ofertas[0].produtos[0]).toEqual(expect.objectContaining({ codigo: "CREATOR-OFFER-1", precoEmKwanza: 30000 }));

      const candidatura = await app.inject({ method: "POST", url: `/creator/oportunidades/${oferta.json().id}/candidaturas`, headers: conta, payload: { parceiroId: parceiro.json().id, mensagem: "Tenho audiência adequada." } });
      expect(candidatura.statusCode).toBe(201);
      const repetida = await app.inject({ method: "POST", url: `/creator/oportunidades/${oferta.json().id}/candidaturas`, headers: conta, payload: { parceiroId: parceiro.json().id } });
      expect(repetida.statusCode).toBe(409);

      const idor = await app.inject({ method: "PATCH", url: `/creator/team/candidaturas/${candidatura.json().id}/decisao`, headers: sellerB, payload: { aprovar: true } });
      expect(idor.statusCode).toBe(404);
      const aprovada = await app.inject({ method: "PATCH", url: `/creator/team/candidaturas/${candidatura.json().id}/decisao`, headers: sellerA, payload: { aprovar: true } });
      expect(aprovada.statusCode).toBe(200);
      expect(aprovada.json().estado).toBe("APROVADA");
      const redeSeller = await app.inject({ method: "GET", url: "/afiliados", headers: sellerA });
      expect(redeSeller.json().parceiros).toEqual(expect.arrayContaining([expect.objectContaining({ nomePublico: "Creator Marketplace", contaBizyId: expect.any(String) })]));

      const amostra = await app.inject({ method: "POST", url: `/creator/candidaturas/${candidatura.json().id}/amostras`, headers: conta, payload: {} });
      expect(amostra.statusCode).toBe(201);
      expect(amostra.json().estado).toBe("SOLICITADA");
      const dadosAposAmostra = await app.inject({ method: "GET", url: "/creator/oportunidades/dados", headers: conta });
      expect(dadosAposAmostra.json().ofertas[0].stockAmostras).toBe(0);

      const missaoId = dadosAposAmostra.json().ofertas[0].missoes[0].id;
      const missao = await app.inject({ method: "POST", url: `/creator/missoes/${missaoId}/aceitar`, headers: conta, payload: {} });
      expect(missao.statusCode).toBe(201);
      expect(missao.json()).toEqual(expect.objectContaining({ missaoId, estado: "ACEITE" }));
    } finally { await app.close(); }
  });
});
