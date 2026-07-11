import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rotasApp = readFileSync(resolve(__dirname, "../src/rotasApp.tsx"), "utf8");

describe("shell CRM v3", () => {
  it("mantem as abas primarias na ordem do design aprovado", () => {
    expect(rotasApp).toContain("export const caminhosCrmV3Principais");
    expect(rotasApp).toContain("export const rotulosCrmV3Principais");
    expect(rotasApp).toContain("[\"/app\", \"/app/reservas\", \"/app/conversas\", \"/app/tarefas\", \"/app/clientes\", \"/app/metas\", \"/app/equipa\", \"/app/learning\", \"/app/projectos\", \"/app/financas\", \"/app/live\", \"/app/loja\", \"/app/relatorios\"]");
    expect(rotasApp).toContain("[\"Início\", \"Pedidos\", \"Atendimento\", \"Tarefas\", \"Clientes\", \"Metas\", \"Equipa\", \"Learning\", \"Projectos\", \"Finanças\", \"Live\", \"Studio\", \"Relatórios\"]");
  });
});
