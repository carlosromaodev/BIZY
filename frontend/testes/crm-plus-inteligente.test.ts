import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fonte = (caminho: string) => readFileSync(resolve(process.cwd(), caminho), "utf8");

const paginas = [
  "Pipeline",
  "Cotacoes",
  "Agenda",
  "Metas",
  "RespostasRapidas",
  "Actividades",
  "Formularios",
  "Sequencias"
];

describe("CRM+ operacional por contexto", () => {
  it("liga o painel operacional e evita linguagem visual generica de IA", () => {
    const componente = fonte("src/componentes/CrmPainelOperacional.tsx");
    const css = fonte("src/estilos.css");

    expect(componente).toContain("CrmPainelOperacional");
    expect(componente).toContain("Comando rápido");
    expect(componente).toContain("Ação prioritária");
    expect(componente).toContain("Indicadores");
    expect(componente).toContain("crm-plus-command");
    expect(componente).toContain("crm-plus-signal");
    expect(componente).not.toContain("Sparkles");
    expect(componente).not.toContain("Radar");
    expect(componente).not.toContain("Lightbulb");
    expect(componente).not.toContain("Proxima melhor acao");
    expect(componente).not.toContain("Sinais do contexto");
    expect(css).toContain(".crm-plus-command");
    expect(css).toContain(".crm-plus-signal");
    expect(css).not.toMatch(/\.crm-plus-command-main\s*\{[^}]*background:\s*#111111/is);

    for (const pagina of paginas) {
      const arquivo = fonte(`src/paginas/${pagina}.tsx`);
      expect(arquivo, pagina).toContain("CrmPainelOperacional");
      expect(arquivo, pagina).toContain("atalhoAtivo");
      expect(arquivo, pagina).toContain("proximaAcao");
      expect(arquivo, pagina).not.toContain("subtitulo=");
      expect(arquivo, pagina).not.toContain("motor compara");
      expect(arquivo, pagina).not.toContain("entendem o momento");
      expect(arquivo, pagina).not.toContain("assistido");
    }
  });
});
