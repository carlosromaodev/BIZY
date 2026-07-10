export const papeisGovernancaAnani = ["GOVERNANTE_BIZY", "ADMIN_GERAL", "SUPER_ADMIN_PLATFORM"] as const;

export type PapelGovernancaAnani = (typeof papeisGovernancaAnani)[number];
export type AnaniEnforcement = "ALLOW" | "HARD_BLOCK" | "REQUIRE_APPROVAL" | "THROTTLE";

export interface AnaniGlobalPolicy {
  codigo: string;
  descricao: string;
  enforcement: AnaniEnforcement;
  podeSobrescrever: boolean;
}

export interface AnaniSkillDefinition {
  codigo: string;
  sistema: "TEAM" | "MARKET" | "LEARNING" | "SECURITY" | "SOCIAL" | "INTELLIGENCE" | "GOVERNANCE";
  nivel: 0 | 1 | 2 | 3 | 4;
  reversivel: boolean;
  requerAprovacao?: boolean;
  requerConsentimento?: boolean;
  ttlMinutos?: number;
  cooldownMinutos?: number;
}

export interface AnaniActionCandidate {
  skill: string;
  nivelSolicitado?: number;
  negocioId?: string | null;
  actorId?: string | null;
  consentimentoConfirmado?: boolean;
  impactoFinanceiro?: boolean;
  expoePiiEmPrompt?: boolean;
  alteraDadosEntreTenants?: boolean;
}

export interface AnaniPolicyVerdict {
  permitido: boolean;
  enforcement: AnaniEnforcement;
  requerAprovacaoHumana: boolean;
  razoes: string[];
  skill?: AnaniSkillDefinition;
}

export interface AnaniPolicyEngineService {
  listarPoliticasGlobais(): AnaniGlobalPolicy[];
  listarSkills(): AnaniSkillDefinition[];
  avaliarAcao(acao: AnaniActionCandidate): AnaniPolicyVerdict;
}

const politicasGlobais: AnaniGlobalPolicy[] = [
  {
    codigo: "TENANT_ISOLATION",
    descricao: "Nenhuma acao da Anani pode expor dados de um negocio para outro.",
    enforcement: "HARD_BLOCK",
    podeSobrescrever: false
  },
  {
    codigo: "FINANCIAL_IMMUTABILITY",
    descricao: "Anani nao altera ledger, saldo, pagamento ou reembolso.",
    enforcement: "HARD_BLOCK",
    podeSobrescrever: false
  },
  {
    codigo: "MARKETING_CONSENT",
    descricao: "Mensagens de marketing exigem consentimento explicito registado.",
    enforcement: "HARD_BLOCK",
    podeSobrescrever: false
  },
  {
    codigo: "PII_NEVER_IN_PROMPT",
    descricao: "PII nunca entra em prompts enviados a modelos externos.",
    enforcement: "HARD_BLOCK",
    podeSobrescrever: false
  },
  {
    codigo: "HIGH_IMPACT_HUMAN_GATE",
    descricao: "Acao de alto impacto exige Governante/Admin Geral.",
    enforcement: "REQUIRE_APPROVAL",
    podeSobrescrever: true
  },
  {
    codigo: "RATE_LIMIT_ACTIONS",
    descricao: "Acoes automatizadas da Anani sao limitadas por negocio e severidade.",
    enforcement: "THROTTLE",
    podeSobrescrever: true
  }
];

const skills: AnaniSkillDefinition[] = [
  { codigo: "team.task.create_priority_task", sistema: "TEAM", nivel: 1, reversivel: true },
  { codigo: "team.task.escalate_to_manager", sistema: "TEAM", nivel: 1, reversivel: true },
  { codigo: "team.member.send_alert", sistema: "TEAM", nivel: 1, reversivel: true },
  { codigo: "team.client.flag_churn_risk", sistema: "TEAM", nivel: 1, reversivel: true },
  { codigo: "team.client.trigger_retention_flow", sistema: "TEAM", nivel: 2, reversivel: true, requerConsentimento: true },
  { codigo: "team.session.terminate_suspicious", sistema: "TEAM", nivel: 2, reversivel: false },
  { codigo: "team.account.request_quarantine", sistema: "TEAM", nivel: 2, reversivel: true, cooldownMinutos: 60 },
  { codigo: "team.report.generate_weekly", sistema: "TEAM", nivel: 1, reversivel: true },

  { codigo: "market.product.flag_for_review", sistema: "MARKET", nivel: 1, reversivel: true },
  { codigo: "market.product.suspend_preventive", sistema: "MARKET", nivel: 2, reversivel: true },
  { codigo: "market.checkout.block_suspicious", sistema: "MARKET", nivel: 2, reversivel: true },
  { codigo: "market.affiliate.pause_suspicious", sistema: "MARKET", nivel: 2, reversivel: true },
  { codigo: "market.ranking.adjust_trust_score", sistema: "MARKET", nivel: 2, reversivel: true },
  { codigo: "market.store.request_suspension", sistema: "MARKET", nivel: 3, reversivel: true, requerAprovacao: true },
  { codigo: "market.price.suggest_adjustment", sistema: "MARKET", nivel: 1, reversivel: true },

  { codigo: "learning.content.flag_quality", sistema: "LEARNING", nivel: 1, reversivel: true },
  { codigo: "learning.content.suspend_abusive", sistema: "LEARNING", nivel: 2, reversivel: true },
  { codigo: "learning.student.flag_suspicious", sistema: "LEARNING", nivel: 1, reversivel: true },
  { codigo: "learning.recommendation.personalise", sistema: "LEARNING", nivel: 2, reversivel: true },

  { codigo: "security.ip.rate_limit_dynamic", sistema: "SECURITY", nivel: 2, reversivel: true, ttlMinutos: 30 },
  { codigo: "security.ip.block_temporary", sistema: "SECURITY", nivel: 2, reversivel: true, ttlMinutos: 60 },
  { codigo: "security.session.force_otp", sistema: "SECURITY", nivel: 2, reversivel: true },
  { codigo: "security.session.terminate", sistema: "SECURITY", nivel: 2, reversivel: false },
  { codigo: "security.device.flag_suspicious", sistema: "SECURITY", nivel: 1, reversivel: true },
  { codigo: "security.quarantine.create", sistema: "SECURITY", nivel: 2, reversivel: true },
  { codigo: "security.incident.open", sistema: "SECURITY", nivel: 1, reversivel: false },
  { codigo: "security.ddos.activate_protection", sistema: "SECURITY", nivel: 2, reversivel: true, ttlMinutos: 15 },

  { codigo: "social.whatsapp.send_retention", sistema: "SOCIAL", nivel: 2, reversivel: true, requerConsentimento: true },
  { codigo: "social.whatsapp.alert_owner", sistema: "SOCIAL", nivel: 1, reversivel: true },
  { codigo: "social.instagram.flag_comment", sistema: "SOCIAL", nivel: 1, reversivel: true },
  { codigo: "social.facebook.pause_ad", sistema: "SOCIAL", nivel: 2, reversivel: true },
  { codigo: "social.tiktok.pause_adset", sistema: "SOCIAL", nivel: 2, reversivel: true },
  { codigo: "social.tiktok.fire_conversion", sistema: "SOCIAL", nivel: 2, reversivel: true },

  { codigo: "intelligence.rfm.recalculate", sistema: "INTELLIGENCE", nivel: 1, reversivel: true },
  { codigo: "intelligence.forecast.update", sistema: "INTELLIGENCE", nivel: 1, reversivel: true },
  { codigo: "intelligence.market.fetch_external", sistema: "INTELLIGENCE", nivel: 1, reversivel: true },
  { codigo: "intelligence.report.synthesize", sistema: "INTELLIGENCE", nivel: 1, reversivel: true },
  { codigo: "intelligence.pattern.investigate", sistema: "INTELLIGENCE", nivel: 1, reversivel: true },
  { codigo: "intelligence.churn.intervene", sistema: "INTELLIGENCE", nivel: 2, reversivel: true, requerConsentimento: true },

  { codigo: "governance.policy.update_threshold", sistema: "GOVERNANCE", nivel: 3, reversivel: true, requerAprovacao: true },
  { codigo: "governance.store.suspend", sistema: "GOVERNANCE", nivel: 3, reversivel: true, requerAprovacao: true },
  { codigo: "governance.account.ban_permanent", sistema: "GOVERNANCE", nivel: 3, reversivel: false, requerAprovacao: true },
  { codigo: "governance.platform.emergency_mode", sistema: "GOVERNANCE", nivel: 3, reversivel: true, requerAprovacao: true },
  { codigo: "governance.incident.close", sistema: "GOVERNANCE", nivel: 2, reversivel: true },
  { codigo: "governance.quarantine.release", sistema: "GOVERNANCE", nivel: 2, reversivel: true }
];

export function papelPodeGovernarAnani(papel?: string | null): papel is PapelGovernancaAnani {
  const normalizado = papel?.trim().toUpperCase();
  return papeisGovernancaAnani.some((papelGovernanca) => papelGovernanca === normalizado);
}

export class AnaniPolicyEngine implements AnaniPolicyEngineService {
  private readonly skillsPorCodigo = new Map(skills.map((skill) => [skill.codigo, skill]));

  listarPoliticasGlobais(): AnaniGlobalPolicy[] {
    return politicasGlobais.map((politica) => ({ ...politica }));
  }

  listarSkills(): AnaniSkillDefinition[] {
    return skills.map((skill) => ({ ...skill }));
  }

  avaliarAcao(acao: AnaniActionCandidate): AnaniPolicyVerdict {
    const skill = this.skillsPorCodigo.get(acao.skill);
    const razoes: string[] = [];

    if (!skill) {
      return {
        permitido: false,
        enforcement: "HARD_BLOCK",
        requerAprovacaoHumana: false,
        razoes: [`Skill Anani desconhecida: ${acao.skill}`]
      };
    }

    if (acao.alteraDadosEntreTenants) {
      razoes.push("TENANT_ISOLATION");
    }
    if (acao.impactoFinanceiro) {
      razoes.push("FINANCIAL_IMMUTABILITY");
    }
    if (acao.expoePiiEmPrompt) {
      razoes.push("PII_NEVER_IN_PROMPT");
    }
    if (skill.requerConsentimento && !acao.consentimentoConfirmado) {
      razoes.push("MARKETING_CONSENT");
    }

    if (razoes.length > 0) {
      return {
        permitido: false,
        enforcement: "HARD_BLOCK",
        requerAprovacaoHumana: false,
        razoes,
        skill
      };
    }

    const nivel = acao.nivelSolicitado ?? skill.nivel;
    const requerAprovacaoHumana = skill.requerAprovacao === true || nivel >= 3;

    return {
      permitido: !requerAprovacaoHumana,
      enforcement: requerAprovacaoHumana ? "REQUIRE_APPROVAL" : "ALLOW",
      requerAprovacaoHumana,
      razoes: requerAprovacaoHumana ? ["HIGH_IMPACT_HUMAN_GATE"] : [],
      skill
    };
  }
}
