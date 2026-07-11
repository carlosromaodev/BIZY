import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("integração shadcn/ui", () => {
  it("mantém shadcn configurado para Vite, Tailwind v4 e aliases locais", () => {
    const config = JSON.parse(source("components.json")) as {
      style: string;
      tailwind: { css: string; config: string };
      aliases: { ui: string; utils: string };
    };
    const css = source("src/estilos.css");
    const vite = source("vite.config.ts");
    const tsconfig = source("tsconfig.json");

    expect(config.style).toBe("radix-nova");
    expect(config.tailwind.css).toBe("src/estilos.css");
    expect(config.tailwind.config).toBe("");
    expect(config.aliases.ui).toBe("@/components/ui");
    expect(config.aliases.utils).toBe("@/lib/utils");
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain('@import "shadcn/tailwind.css";');
    expect(vite).toContain("@tailwindcss/vite");
    expect(vite).toContain("allowedHosts: true");
    expect(vite).toContain("proxy: Object.fromEntries");
    expect(vite).toContain('"/webhooks"');
    expect(vite).toContain('"/saude"');
    expect(tsconfig).toContain('"@/*": ["./src/*"]');
  });

  it("instala os primitivos shadcn necessários para o CRM", () => {
    [
      "button.tsx",
      "card.tsx",
      "badge.tsx",
      "input.tsx",
      "select.tsx",
      "table.tsx",
      "sheet.tsx",
      "dialog.tsx",
      "alert-dialog.tsx",
      "tooltip.tsx",
      "checkbox.tsx",
      "accordion.tsx"
    ].forEach((arquivo) => {
      expect(existsSync(resolve(process.cwd(), "src/components/ui", arquivo)), arquivo).toBe(true);
    });
  });

  it("expõe variantes semânticas nos primitivos visuais", () => {
    const button = source("src/components/ui/button.tsx");
    const badge = source("src/components/ui/badge.tsx");
    const alert = source("src/components/ui/alert.tsx");

    ["success", "warning", "info"].forEach((variant) => {
      expect(button).toContain(`${variant}:`);
      expect(badge).toContain(`${variant}:`);
      expect(alert).toContain(`${variant}:`);
    });
    expect(button).toContain("leading-none");
    expect(badge).toContain("leading-none");
  });

  it("mantém Button compatível com refs de Radix Slot e dialogs", () => {
    const button = source("src/components/ui/button.tsx");

    expect(button).toContain("React.forwardRef");
    expect(button).toContain('displayName = "Button"');
    expect(button).toContain("React.ElementRef");
  });

});
