import { describe, expect, it } from "vitest";
import {
  listarRemetentesSmsBizy,
  listarRemetentesSmsPermitidos,
  remetenteSmsPermitido,
  resolverRemetenteSmsBizy
} from "../infra/provedores/RemetentesSmsBizy.js";

describe("Remetentes SMS Bizy", () => {
  it("separa os remetentes aprovados por finalidade", () => {
    expect(listarRemetentesSmsBizy({})).toEqual({
      AUTENTICACAO: "BIZYCODE",
      SUPORTE: "BIZYCARE",
      LIVE: "BIZYLIVE",
      MARKET: "BIZYSHOP"
    });
    expect(resolverRemetenteSmsBizy("AUTENTICACAO", {})).toBe("BIZYCODE");
  });

  it("permite sobrescrever remetentes sem aceitar nomes fora da allowlist", () => {
    const env = {
      OMBALA_SMS_SENDER_AUTH: "BIZYCODE",
      OMBALA_SMS_APPROVED_SENDERS: "BIZYCODE,BIZYCARE"
    };

    expect(listarRemetentesSmsPermitidos(env)).toEqual(["BIZYCODE", "BIZYCARE"]);
    expect(remetenteSmsPermitido("bizycode", env)).toBe(true);
    expect(remetenteSmsPermitido("EMEU", env)).toBe(false);
    expect(remetenteSmsPermitido("BIZYPAY", env)).toBe(false);
  });
});
