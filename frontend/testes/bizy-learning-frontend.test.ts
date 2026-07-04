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
    expect(api).toContain("/learning/team/programas/${encodeURIComponent(slug)}/atribuir");
    expect(api).toContain("/learning/team/cohorts");
    expect(api).toContain("/learning/team/programas/${encodeURIComponent(slug)}/cohorts");
    expect(api).toContain("/learning/team/cohorts/${encodeURIComponent(id)}/presencas");
    expect(api).toContain("/learning/team/comunidades");
    expect(api).toContain("/learning/team/programas/${encodeURIComponent(slug)}/comunidades");
    expect(api).toContain("/learning/team/comunidades/${encodeURIComponent(id)}/posts");
    expect(api).toContain("AtribuicaoLearning");
    expect(api).toContain("CohortLearning");
    expect(api).toContain("ComunidadeLearning");
    expect(api).toContain("ChatInternoLearning");
    expect(pagina).toContain("Chat interno do Learning");
    expect(pagina).toContain("Atribuições e formação obrigatória");
    expect(pagina).toContain("Cohorts, lives e presenças");
    expect(pagina).toContain("Comunidades e memberships");
    expect(pagina).toContain("abrirCohortLearningTeam");
    expect(pagina).toContain("registrarPresencaCohortLearning");
    expect(pagina).toContain("criarComunidadeLearningTeam");
    expect(pagina).toContain("publicarPostComunidadeLearning");
    expect(pagina).toContain("atribuirProgramaLearningTeam");
    expect(pagina).toContain("Ecossistema Learning");
    expect(pagina).toContain("Famílias de produto digital");
    expect(pagina).toContain("enviarMensagemChatLearning");
    expect(pagina).toContain("listarChatInternoLearning");
    expect(pagina).toContain("sem misturar com WhatsApp ou atendimento externo");
    expect(pagina).toContain("DECISAO");
    expect(pagina).toContain("COHORT");
  });
});
