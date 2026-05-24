import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  guardarToken,
  guardarUsuario,
  obterToken,
  obterUsuario,
  requisitarApi
} from "../src/api";

function criarLocalStorageMock() {
  const dados = new Map<string, string>();

  return {
    getItem: vi.fn((chave: string) => dados.get(chave) ?? null),
    setItem: vi.fn((chave: string, valor: string) => {
      dados.set(chave, valor);
    }),
    removeItem: vi.fn((chave: string) => {
      dados.delete(chave);
    }),
    clear: vi.fn(() => {
      dados.clear();
    })
  };
}

describe("cliente HTTP do frontend", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", criarLocalStorageMock());
    vi.stubGlobal("window", new EventTarget());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa mesma origem no ngrok quando VITE_API_URL aponta para localhost", () => {
    const source = readFileSync(resolve(process.cwd(), "src/api.ts"), "utf8");

    expect(source).toContain("ehHostLocal(window.location.hostname)");
    expect(source).toContain("ehHostLocal(destino.hostname)");
    expect(source).toContain('return ""');
  });

  it("limpa a sessão local e emite evento quando uma rota autenticada devolve 401", async () => {
    const eventos: string[] = [];
    window.addEventListener("emeu:sessao-expirada", () => eventos.push("expirada"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ mensagem: "Faça login para continuar." }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    guardarToken("token-invalido");
    guardarUsuario({ id: "u1", nome: "Luisa", telefone: "923456789", papel: "VENDEDOR" });

    await expect(requisitarApi("/painel/resumo")).rejects.toThrow("Faça login para continuar.");

    expect(obterToken()).toBeNull();
    expect(obterUsuario()).toBeNull();
    expect(eventos).toEqual(["expirada"]);
  });
});
