import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("onboarding Bizy", () => {
  it("segue o mesmo sistema visual escuro do login na criacao do negocio", () => {
    const onboarding = source("src/paginas/Onboarding.tsx");

    expect(onboarding).toContain("/bizy-login-team.png");
    expect(onboarding).toContain("bg-[#050706]");
    expect(onboarding).toContain("bg-[#050706]/76");
    expect(onboarding).toContain("border-white/12");
    expect(onboarding).toContain("active:border-[#d8ff72]");
    expect(onboarding).toContain("bg-[#d8ff72] text-[#050706]");
    expect(onboarding).toContain('backgroundColor: "#d8ff72"');
    expect(onboarding).toContain('border: "1px solid transparent"');
    expect(onboarding).toContain("aria-pressed");
    expect(onboarding).not.toContain("bg-[linear-gradient(180deg,#fff,#faf8fa)]");
    expect(onboarding).not.toContain("bg-white/80");
    expect(onboarding).not.toContain("border-primary");
    expect(onboarding).not.toContain("hover:border-primary");
  });
});
