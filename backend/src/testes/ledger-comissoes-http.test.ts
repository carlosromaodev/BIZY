import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };
async function seller(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) { const otp = await app.inject({ method: "POST", url: "/auth/telefone/solicitar-codigo", payload: { telefone, nome } }); const login = await app.inject({ method: "POST", url: "/auth/telefone/confirmar-codigo", payload: { telefone, codigo: otp.json().codigoDev } }); const headers = { authorization: `Bearer ${login.json().token}` }; await app.inject({ method: "PATCH", url: "/negocio/modulos/afiliados", headers, payload: { ativo: true } }); return headers; }

describe("ledger de comissoes HTTP", () => {
  beforeEach(() => { process.env = { ...ambienteOriginal, MODO_ARMAZENAMENTO: "memoria", N8N_EVENTOS_ATIVOS: "false", N8N_ASSUME_WHATSAPP: "true", WHATSAPP_PROVIDER: "console", INICIAR_AGENDADOR_EXPIRACAO: "false", LOGIN_SMS_DEV_MODE: "true", LOGIN_SMS_EXPOR_CODIGO_DEV: "true", RATE_LIMIT_ATIVO: "false" }; });
  afterEach(() => { vi.restoreAllMocks(); process.env = { ...ambienteOriginal }; });

  it("opera distribuicao colaborativa, retencao e payout com tenant isolation", async () => {
    const app = await criarAplicacao();
    try {
      const a = await seller(app, "923793001", "Ledger A"); const b = await seller(app, "923793002", "Ledger B");
      const criarParceiro = (codigo: string, nome: string) => app.inject({ method: "POST", url: "/afiliados", headers: a, payload: { tipo: "CRIADOR", codigo, nomePublico: nome, regraComissao: { tipo: "PERCENTUAL", percentual: 10 } } });
      const creator = await criarParceiro("LEDGER-CREATOR", "Creator Ledger"); const closer = await criarParceiro("LEDGER-CLOSER", "Closer Ledger");
      const distribuicao = await app.inject({ method: "POST", url: "/creator/team/distribuicoes", headers: a, payload: { origemTipo: "CONVERSAO", origemId: "conv-http-1", politicaCodigo: "collab", politicaVersao: "collab.v1", valorBaseEmKwanza: 50_000, valorComissaoKwanza: 10_001, margemEmKwanza: 20_000, participantes: [{ parceiroId: creator.json().id, papel: "CRIADOR", pesoBasisPoints: 6_000 }, { parceiroId: closer.json().id, papel: "CLOSER", pesoBasisPoints: 4_000 }] } });
      expect(distribuicao.statusCode).toBe(201); expect(distribuicao.json().participantes.map((item: { valorEmKwanza: number }) => item.valorEmKwanza)).toEqual([6_000, 4_001]);
      expect((await app.inject({ method: "POST", url: `/creator/team/distribuicoes/${distribuicao.json().id}/confirmar`, headers: b })).statusCode).toBe(404);
      expect((await app.inject({ method: "POST", url: `/creator/team/distribuicoes/${distribuicao.json().id}/confirmar`, headers: a })).statusCode).toBe(200);
      expect((await app.inject({ method: "POST", url: `/creator/team/ledger/${creator.json().id}/reter`, headers: a, payload: { valorEmKwanza: 1_000, motivo: "Janela de risco", idempotencyKey: "http-hold-creator" } })).statusCode).toBe(200);
      const payout = await app.inject({ method: "POST", url: "/creator/team/payouts", headers: a, payload: { parceiroId: creator.json().id, valorEmKwanza: 3_000, idempotencyKey: "http-payout-creator" } });
      expect(payout.statusCode).toBe(201);
      expect((await app.inject({ method: "POST", url: `/creator/team/payouts/${payout.json().id}/confirmar`, headers: b, payload: { referencia: "BANK-HTTP" } })).statusCode).toBe(404);
      expect((await app.inject({ method: "POST", url: `/creator/team/payouts/${payout.json().id}/confirmar`, headers: a, payload: { referencia: "BANK-HTTP" } })).statusCode).toBe(200);
      const extrato = await app.inject({ method: "GET", url: `/creator/team/ledger?parceiroId=${creator.json().id}`, headers: a });
      expect(extrato.statusCode).toBe(200); expect(extrato.json().saldos).toEqual(expect.objectContaining({ RETIDO: 1_000, DISPONIVEL: 2_000, PAGO: 3_000 }));
      expect(extrato.json().movimentos).toHaveLength(6);
    } finally { await app.close(); }
  });
});
