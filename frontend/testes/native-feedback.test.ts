import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("feedback nativo do site", () => {
  it("ativa sons, haptics e press feedback globais sem ignorar acessibilidade", () => {
    const app = source("src/App.tsx");
    const provider = source("src/componentes/NativeFeedbackProvider.tsx");
    const css = source("src/estilos.css");

    expect(app).toContain("NativeFeedbackProvider");
    expect(provider).toContain("AudioContext");
    expect(provider).toContain("navigator.vibrate");
    expect(provider).toContain("prefers-reduced-motion");
    expect(provider).toContain("bizy_native_sounds");
    expect(provider).toContain("pointerdown");
    expect(provider).toContain("data-native-feedback");
    expect(css).toContain(".native-is-pressing");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
