import { normalizeSmsSender } from "./OmbalaClient.js";

export const finalidadesRemetenteSmsBizy = ["AUTENTICACAO", "SUPORTE", "LIVE", "MARKET"] as const;
export type FinalidadeRemetenteSmsBizy = (typeof finalidadesRemetenteSmsBizy)[number];

const remetentesPadrao: Record<FinalidadeRemetenteSmsBizy, string> = {
  AUTENTICACAO: "BIZYCODE",
  SUPORTE: "BIZYCARE",
  LIVE: "BIZYLIVE",
  MARKET: "BIZYSHOP"
};

const variaveisPorFinalidade: Record<FinalidadeRemetenteSmsBizy, string> = {
  AUTENTICACAO: "OMBALA_SMS_SENDER_AUTH",
  SUPORTE: "OMBALA_SMS_SENDER_CARE",
  LIVE: "OMBALA_SMS_SENDER_LIVE",
  MARKET: "OMBALA_SMS_SENDER_MARKET"
};

type AmbienteSms = Record<string, string | undefined>;

export function listarRemetentesSmsBizy(env: AmbienteSms = process.env): Record<FinalidadeRemetenteSmsBizy, string> {
  return Object.fromEntries(
    finalidadesRemetenteSmsBizy.map((finalidade) => [
      finalidade,
      normalizeSmsSender(env[variaveisPorFinalidade[finalidade]] ?? remetentesPadrao[finalidade])
    ])
  ) as Record<FinalidadeRemetenteSmsBizy, string>;
}

export function resolverRemetenteSmsBizy(
  finalidade: FinalidadeRemetenteSmsBizy,
  env: AmbienteSms = process.env
): string {
  const remetentes = listarRemetentesSmsBizy(env);
  return remetentes[finalidade];
}

export function listarRemetentesSmsPermitidos(env: AmbienteSms = process.env): string[] {
  const configurados = env.OMBALA_SMS_APPROVED_SENDERS
    ?.split(",")
    .map((remetente) => normalizeSmsSender(remetente))
    .filter(Boolean);

  return Array.from(new Set(configurados?.length ? configurados : Object.values(remetentesPadrao)));
}

export function remetenteSmsPermitido(remetente: string, env: AmbienteSms = process.env): boolean {
  return listarRemetentesSmsPermitidos(env).includes(normalizeSmsSender(remetente));
}
