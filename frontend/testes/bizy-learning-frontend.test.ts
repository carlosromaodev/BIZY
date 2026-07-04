import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Bizy Learning frontend", () => {
  it("liga Learning publico, backoffice Team e chat interno", () => {
    const pagina = source("src/projetos/learning/paginas/Learning.tsx");
    const api = source("src/projetos/learning/api.ts");
    const rotas = source("src/rotasApp.tsx");

    expect(rotas).toContain('caminho: "/learning"');
    expect(rotas).toContain('caminho: "/app/learning"');
    expect(api).toContain("/publico/learning");
    expect(api).toContain("/learning/team/resumo");
    expect(api).toContain("/learning/team/chat");
    expect(api).toContain("/learning/team/chat/mensagens");
    expect(api).toContain("ChatInternoLearning");
    expect(pagina).toContain("Chat interno do Learning");
    expect(pagina).toContain("Ecossistema Learning");
    expect(pagina).toContain("Famílias de produto digital");
    expect(pagina).toContain("enviarMensagemChatLearning");
    expect(pagina).toContain("listarChatInternoLearning");
    expect(pagina).toContain("sem misturar com WhatsApp ou atendimento externo");
    expect(pagina).toContain("DECISAO");
    expect(pagina).toContain("COHORT");
  });
});
