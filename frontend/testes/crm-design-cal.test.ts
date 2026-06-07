import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("CRM interno inspirado no Cal.com", () => {
  it("usa uma base visual viva, minimalista e sem excesso de linhas", () => {
    const css = source("src/estilos.css");
    const primitives = source("src/componentes/CrmInterno21st.tsx");

    expect(css).toContain("Plus+Jakarta+Sans");
    expect(css).toContain("--crm-canvas: #FFFFFF");
    expect(css).toContain("--crm-ink: #111111");
    expect(css).toContain("--crm-panel: #F5F5F5");
    expect(css).toContain("--crm-accent: #111111");
    expect(css).toContain(".crm-cal-shell");
    expect(css).toContain(".crm-page");
    expect(css).toContain("border-left: 0;");
    expect(css).toContain("box-shadow: none;");
    expect(css).toContain(".crm-command-panel");
    expect(css).toContain(".crm21-list");
    expect(css).toContain(".pipeline-board");
    expect(css).toContain(".agenda-day");
    expect(primitives).toContain("crm-cal-shell");
    expect(primitives).not.toContain("fontVariationSettings");
  });
});
