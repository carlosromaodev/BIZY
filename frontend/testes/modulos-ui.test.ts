import { describe, expect, it } from "vitest";
import { filtrarRotasPorModulos, rotasComerciais, rotasCrmV3Principais } from "../src/rotasApp";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const caminhos = (rotas: Array<{ caminho: string }>) => rotas.map((rota) => rota.caminho);
const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("módulos desativados na UI", () => {
  it("mantém apenas rotas núcleo quando nenhum módulo opcional está ativo", () => {
    const rotas = filtrarRotasPorModulos(rotasComerciais, []);
    const visiveis = caminhos(rotas);

    expect(visiveis).toContain("/app");
    expect(visiveis).toContain("/app/reservas");
    expect(visiveis).toContain("/app/conversas");
    expect(visiveis).toContain("/app/catalogo");
    expect(visiveis).not.toContain("/app/loja");
    expect(visiveis).not.toContain("/app/afiliados");
    expect(visiveis).not.toContain("/app/pipeline");
    expect(visiveis).not.toContain("/app/campanhas");
    expect(visiveis).not.toContain("/app/social-inbox");
  });

  it("mostra apenas os módulos opcionais explicitamente ativos", () => {
    const rotas = filtrarRotasPorModulos(rotasComerciais, ["loja-publica", "funil"]);
    const visiveis = caminhos(rotas);

    expect(visiveis).toContain("/app/loja");
    expect(visiveis).toContain("/app/pipeline");
    expect(visiveis).toContain("/app/cotacoes");
    expect(visiveis).not.toContain("/app/afiliados");
    expect(visiveis).not.toContain("/app/campanhas");
    expect(visiveis).not.toContain("/app/social-inbox");
  });

  it("deriva tabs primárias, drawer desktop e sheet mobile das rotas filtradas", () => {
    const app = source("src/App.tsx");
    const shell = source("src/componentes/Shell.tsx");
    const rotas = source("src/rotasApp.tsx");
    const caminhosPrimarios = caminhos(rotasCrmV3Principais);

    expect(caminhosPrimarios).toContain("/app/loja");
    expect(shell).toContain("filtrarRotasPorModulos(rotasComerciais, modulosAtivos)");
    expect(shell).toContain("const caminhosVisiveis = new Set(rotasDesktopVisiveis.map((rota) => rota.caminho));");
    expect(shell).toContain("return rotasCrmV3Principais.filter((rota) => caminhosVisiveis.has(rota.caminho));");
    expect(shell).toContain("rotasComerciaisFiltradas.filter((r) => r.secao === secao)");
    expect(shell).toContain("for (const rota of rotasDesktopVisiveis)");
    expect(app).toContain('requisitarApi<{ modulosAtivos?: string[] }>("/negocio/modulos")');
    expect(app).toContain('if (estadoModulo === "bloqueado") return <Navigate to="/app" replace />;');
    expect(app).toContain("element={<LayoutApp modulo={rota.modulo}");
    expect(app).toContain("element={<RotaPrivada modulo={rota.modulo} requerGovernancaAnani={rota.requerGovernancaAnani}>");
    expect(rotas).toContain('{ caminho: "/app/loja-publica", elemento: <PaginaLojaPublica />, modulo: "loja-publica" }');
    expect(rotas).not.toContain("if (modulosAtivos.length === 0) return rotas");
  });
});
