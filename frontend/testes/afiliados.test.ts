import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizarLinksAfiliados,
  normalizarParceirosAfiliados,
  type LinkAfiliado,
  type ParceiroComercial
} from "../src/paginas/afiliadosDados";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const parceiro: ParceiroComercial = {
  id: "parceiro-1",
  tipo: "AFILIADO",
  codigo: "CRIADOR01",
  nomePublico: "Criador 01",
  contacto: null,
  estado: "ATIVO",
  regraComissao: { tipo: "PERCENTUAL", percentual: 10 },
  criadoEm: "2026-05-31T08:00:00.000Z"
};

const link: LinkAfiliado = {
  id: "link-1",
  afiliadoId: "parceiro-1",
  codigo: "CRIADOR01-LOJA",
  urlPublica: "https://links.example.com/go/CRIADOR01-LOJA",
  destinoTipo: "LOJA",
  slugLoja: null,
  codigoProduto: null,
  canal: "whatsapp",
  origemConteudo: "team-afiliados",
  ativo: true,
  expiraEm: null,
  criadoEm: "2026-05-31T08:00:00.000Z"
};

describe("página de Afiliados", () => {
  it("normaliza respostas envelopadas do backend sem quebrar a renderização", () => {
    expect(normalizarParceirosAfiliados({ parceiros: [parceiro] })).toEqual([parceiro]);
    expect(normalizarLinksAfiliados({ links: [link] })).toEqual([link]);
  });

  it("mantém compatibilidade com arrays legados e respostas vazias", () => {
    expect(normalizarParceirosAfiliados([parceiro])).toEqual([parceiro]);
    expect(normalizarLinksAfiliados([link])).toEqual([link]);
    expect(normalizarParceirosAfiliados({ dados: [parceiro] })).toEqual([]);
    expect(normalizarLinksAfiliados(null)).toEqual([]);
  });

  it("tem estrutura mobile para ações e grids da página", () => {
    const afiliados = source("src/paginas/Afiliados.tsx");
    const css = source("src/estilos.css");

    expect(afiliados).toContain("normalizarLinksAfiliados");
    expect(afiliados).toContain("PageHead");
    expect(afiliados).toContain("KpiGrid");
    expect(afiliados).toContain("TableCard");
    expect(afiliados).toContain("bz-aff-link");
    expect(afiliados).toContain('origemConteudo: "team-afiliados"');
    expect(css).toContain(".bz-aff-link");
    expect(css).toContain(".bz-minibar-cell");
  });
});
