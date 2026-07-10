import { describe, expect, it } from "vitest";
import { AnaniPolicyEngine, papelPodeGovernarAnani } from "../anani/policies/AnaniPolicyEngine.js";

describe("AnaniPolicyEngine", () => {
  it("bloqueia acoes que violam isolamento, financeiro, PII ou consentimento", () => {
    const engine = new AnaniPolicyEngine();

    expect(engine.avaliarAcao({ skill: "security.session.terminate", alteraDadosEntreTenants: true })).toEqual(
      expect.objectContaining({
        permitido: false,
        enforcement: "HARD_BLOCK",
        razoes: expect.arrayContaining(["TENANT_ISOLATION"])
      })
    );
    expect(engine.avaliarAcao({ skill: "market.checkout.block_suspicious", impactoFinanceiro: true })).toEqual(
      expect.objectContaining({
        permitido: false,
        enforcement: "HARD_BLOCK",
        razoes: expect.arrayContaining(["FINANCIAL_IMMUTABILITY"])
      })
    );
    expect(engine.avaliarAcao({ skill: "intelligence.pattern.investigate", expoePiiEmPrompt: true })).toEqual(
      expect.objectContaining({
        permitido: false,
        enforcement: "HARD_BLOCK",
        razoes: expect.arrayContaining(["PII_NEVER_IN_PROMPT"])
      })
    );
    expect(engine.avaliarAcao({ skill: "social.whatsapp.send_retention" })).toEqual(
      expect.objectContaining({
        permitido: false,
        enforcement: "HARD_BLOCK",
        razoes: expect.arrayContaining(["MARKETING_CONSENT"])
      })
    );
  });

  it("permite nivel 1-2 seguro e exige aprovacao humana em nivel 3", () => {
    const engine = new AnaniPolicyEngine();

    expect(engine.avaliarAcao({ skill: "team.task.create_priority_task" })).toEqual(
      expect.objectContaining({
        permitido: true,
        enforcement: "ALLOW",
        requerAprovacaoHumana: false
      })
    );
    expect(engine.avaliarAcao({ skill: "governance.store.suspend" })).toEqual(
      expect.objectContaining({
        permitido: false,
        enforcement: "REQUIRE_APPROVAL",
        requerAprovacaoHumana: true,
        razoes: expect.arrayContaining(["HIGH_IMPACT_HUMAN_GATE"])
      })
    );
  });

  it("reconhece apenas papeis de governanca da plataforma", () => {
    expect(papelPodeGovernarAnani("GOVERNANTE_BIZY")).toBe(true);
    expect(papelPodeGovernarAnani("admin_geral")).toBe(true);
    expect(papelPodeGovernarAnani("DONO")).toBe(false);
    expect(papelPodeGovernarAnani("ADMIN")).toBe(false);
  });
});
