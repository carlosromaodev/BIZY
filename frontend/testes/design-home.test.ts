import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = () => readFileSync(resolve(process.cwd(), "src/paginas/Home.tsx"), "utf8");
const ctaSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/cta-with-text-marquee.tsx"), "utf8");
const footerSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/footer-column.tsx"), "utf8");
const howItWorksSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/how-it-works.tsx"), "utf8");
const pricingSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/single-pricing-card-1.tsx"), "utf8");
const borderTrailSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/border-trail.tsx"), "utf8");
const promptFontSource = () => readFileSync(resolve(process.cwd(), "src/lib/prompt-font.ts"), "utf8");
const faqSectionSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/faqsection.tsx"), "utf8");
const authPageSource = () => readFileSync(resolve(process.cwd(), "src/components/ui/auth-page.tsx"), "utf8");
const loginSource = () => readFileSync(resolve(process.cwd(), "src/paginas/Login.tsx"), "utf8");

describe("landing page Bizy", () => {
  it("comunica o ecossistema Bizy com imagem local e capacidades verificáveis", () => {
    const source = homeSource();
    const footer = footerSource();
    const pricing = pricingSource();
    const authPage = authPageSource();
    const login = loginSource();

    expect(source).toContain("motion/react");
    expect(source).toContain("useReducedMotion");
    expect(source).toContain("Pricing");
    expect(source).toContain("@/components/ui/single-pricing-card-1");
    expect(source).toContain('/bizy-login-team.png');
    expect(source).toContain("Bizy. Um sistema para");
    expect(source).toContain("Bizy Team");
    expect(source).toContain("Bizy Market");
    expect(source).toContain("Bizy Learning");
    expect(source).toContain("Anani");
    expect(source).toContain("ContaBizy");
    expect(source).toContain("Smart Links");
    expect(source).toContain("Creator Marketplace");
    expect(source).toContain("ledger imutável");
    expect(source).not.toContain("+2 400");
    expect(source).not.toContain("milhares de compradores");
    expect(source).not.toContain("Começar grátis");
    expect(source).not.toContain("const testemunhos");
    expect(source).not.toContain("CRM+");
    expect(pricing).toContain("Preços em Kwanza");
    expect(pricing).toContain("Mensal");
    expect(pricing).toContain("Anual");
    expect(pricing).toContain("24 900");
    expect(pricing).toContain("19 900");
    expect(footer).toContain("Team para lojas, criadores e afiliados");
    expect(footer).toContain("Atendimento WhatsApp");
    expect(footer).toContain("Luanda, Angola");
    expect(source).not.toContain('src="/hero-mockup.png"');
    expect(existsSync(resolve(process.cwd(), "src/components/ui/cta-with-text-marquee.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/components/ui/footer-column.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/components/ui/how-it-works.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/components/ui/single-pricing-card-1.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/components/ui/border-trail.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/lib/prompt-font.ts"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/components/ui/faqsection.tsx"))).toBe(true);

    [source, footer, pricing, authPage, login].forEach((conteudo) => {
      expect(conteudo).not.toContain("#971A58");
      expect(conteudo).not.toContain("151,26,88");
      expect(conteudo).not.toContain("#21141d");
      expect(conteudo).not.toContain("#fbfafb");
    });
  });
});
