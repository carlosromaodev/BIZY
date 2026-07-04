import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const fonteStudioLoja = () =>
  [
    source("src/projetos/market/paginas/StudioLoja.tsx"),
    source("src/projetos/market/studio-loja/modelo.ts"),
    source("src/projetos/market/studio-loja/tipos.ts")
  ].join("\n");

describe("loja digital operacao avancada", () => {
  it("centraliza no admin as opcoes avancadas do CRM e da loja", () => {
    const pagina = source("src/projetos/market/paginas/StudioLoja.tsx");

    expect(pagina).toContain("Gestão de plano");
    expect(pagina).toContain("Quotas de uso");
    expect(pagina).toContain("Upgrade contextual");
    expect(pagina).toContain("Pagamentos avançados");
    expect(pagina).toContain("Cartão/Adyen");
    expect(pagina).toContain("PayPal");
    expect(pagina).toContain("Mostrar número da encomenda");
    expect(pagina).toContain("Disponibilidade e zonas");
    expect(pagina).toContain("Preço por zona");
    expect(pagina).toContain("Categorias e descontos");
    expect(pagina).toContain("Clientes e segmentação");
    expect(pagina).toContain("Importar clientes");
    expect(pagina).toContain("Enviar transmissão filtrada");
    expect(pagina).toContain("Encomendas operacionais");
    expect(pagina).toContain("Calendário de encomendas");
    expect(pagina).toContain("App móvel com QR code");
    expect(pagina).toContain("Caixa de entrada unificada");
    expect(pagina).toContain("Transmissões/broadcasts");
    expect(pagina).toContain("Relatórios prontos");
    expect(pagina).toContain("Site, domínio e SEO");
    expect(pagina).toContain("Instruções DNS");
  });

  it("envia a configuracao avancada no payload persistido", () => {
    const pagina = fonteStudioLoja();

    [
      "plano",
      "quotas",
      "pagamentos",
      "mostrarNumeroEncomendaNaMensagem",
      "gerirDisponibilidade",
      "zonas",
      "categoriasVisiveis",
      "filtrosInteligentes",
      "colunasOperacionais",
      "relatoriosProntos",
      "siteSeo"
    ].forEach((token) => expect(pagina).toContain(token));
  });
});
