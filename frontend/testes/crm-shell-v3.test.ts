import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rotasApp = readFileSync(resolve(__dirname, "../src/rotasApp.tsx"), "utf8");

describe("shell CRM v3", () => {
  it("mantem as abas primarias na ordem do design aprovado", () => {
    expect(rotasApp).toContain("export const caminhosCrmV3Principais");
    expect(rotasApp).toContain("export const rotulosCrmV3Principais");
    expect(rotasApp).toContain("[\"/app\", \"/app/reservas\", \"/app/conversas\", \"/app/clientes\", \"/app/live\", \"/app/loja\", \"/app/relatorios\"]");
    expect(rotasApp).toContain("[\"Comando\", \"Pedidos\", \"Atendimento\", \"Clientes\", \"Live\", \"Studio\", \"Relatórios\"]");
  });
});
