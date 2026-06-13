import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("lançamento da loja no cadastro", () => {
  it("mantém um login de teste local para criar conta sem consumir recursos reais de auth", () => {
    const login = source("src/paginas/Login.tsx");

    expect(login).toContain("entrarEmModoTeste");
    expect(login).toContain("bizy_modo_teste");
    expect(login).toContain("Entrar em modo teste");
    expect(login).toContain("guardarSessao(null");
    expect(login).toContain('navigate("/onboarding"');
  });

  it("renomeia o onboarding para Lançamento da Loja e pergunta o objetivo inicial", () => {
    const onboarding = source("src/paginas/Onboarding.tsx");

    expect(onboarding).toContain('type PassoLancamento = "objetivo" | "negocio" | "produto" | "pronto"');
    expect(onboarding).toContain("Lançamento da Loja");
    expect(onboarding).toContain("Escolhe por onde queres começar");
    expect(onboarding).toContain("Criar loja digital");
    expect(onboarding).toContain("Gerir clientes e vendas");
    expect(onboarding).toContain("Vender por WhatsApp/Live");
    expect(onboarding).toContain("Só explorar a plataforma");
  });

  it("suporta completar a criação em modo teste sem chamar onboarding real", () => {
    const onboarding = source("src/paginas/Onboarding.tsx");

    expect(onboarding).toContain("modoTesteAtivo");
    expect(onboarding).toContain("salvarNegocioLocalTeste");
    expect(onboarding).toContain("criarProdutoLocalTeste");
    expect(onboarding).toContain("bizy_lancamento_teste");
    expect(onboarding).toContain("Loja rascunho criada");
  });
});
