import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("sistema de notificacoes Bizy", () => {
  it("integra alert-1 e provider global com estilo padrao do site", () => {
    expect(existsSync(resolve(process.cwd(), "src/components/ui/alert-1.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/componentes/Notificacoes.tsx"))).toBe(true);

    const alert = source("src/components/ui/alert-1.tsx");
    const notificacoes = source("src/componentes/Notificacoes.tsx");
    const app = source("src/App.tsx");
    const api = source("src/api.ts");

    expect(alert).toContain("alertVariants");
    expect(alert).toContain("appearance");
    expect(alert).toContain("variant");
    expect(alert).toContain("close");
    expect(alert).toContain("AlertIcon");
    expect(alert).toContain("AlertContent");
    expect(alert).toContain("AlertToolbar");
    expect(alert).toContain("#d8ff72");
    expect(alert).toContain("#050706");

    expect(notificacoes).toContain("ProvedorNotificacoes");
    expect(notificacoes).toContain("useNotificacoes");
    expect(notificacoes).toContain("notificarSite");
    expect(notificacoes).toContain("bizy:notificacao");
    expect(notificacoes).toContain("aria-live=\"polite\"");
    expect(notificacoes).toContain("toaster fixed");
    expect(notificacoes).toContain("appearance=\"light\"");
    expect(notificacoes).toContain("close");

    expect(app).toContain("ProvedorNotificacoes");
    expect(app).toContain("<ProvedorNotificacoes>");

    expect(api).toContain("bizy:notificacao");
    expect(api).toContain("emitirNotificacaoSite");
    expect(api).toContain("Backend indisponível");
    expect(api).toContain("Sessão expirada");
  });
});
