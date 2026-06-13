import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("conversas em tempo real", () => {
  it("mantém o chat a ouvir WhatsApp sem exigir refresh manual", () => {
    const conversas = source("src/paginas/Conversas.tsx");

    expect(conversas).toContain("WHATSAPP_MESSAGE_RECEIVED");
    expect(conversas).toContain("eventos.onopen");
    expect(conversas).toContain("eventos.onerror");
    expect(conversas).toContain("window.setTimeout");
    expect(conversas).toContain("window.clearTimeout");
    expect(conversas).toContain("window.setInterval");
    expect(conversas).toContain("window.clearInterval");
    expect(conversas).toContain('role="status"');
    expect(conversas).toContain('aria-live="polite"');
  });
});
