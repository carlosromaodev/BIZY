import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  criarFonteEventosAutenticada,
  guardarToken,
  guardarSessao,
  guardarUsuario,
  obterUrlEventos,
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
    const win = new EventTarget();
    vi.stubGlobal("window", win);
    vi.stubGlobal("CustomEvent", class CustomEvent extends Event {
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        super(type);
        this.detail = init?.detail;
      }
    });
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

  it("usa o proxy do Vite em desenvolvimento quando VITE_API_URL não está configurado", () => {
    const source = readFileSync(resolve(process.cwd(), "src/api.ts"), "utf8");

    expect(source).not.toContain('return "http://localhost:3333"');
    expect(source).toContain("return \"\"");
  });

  it("mantém no proxy do Vite as rotas consumidas pelo CRM operacional", () => {
    const source = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");

    expect(source).toContain('"/actividades"');
    expect(source).toContain('"/cotacoes"');
    expect(source).toContain('"/formularios"');
    expect(source).toContain('"/tarefas"');
    expect(source).toContain('"/social"');
    expect(source).toContain('"/funil"');
    expect(source).toContain('"/lembretes"');
    expect(source).toContain('"/metas"');
    expect(source).toContain('"/pipeline"');
    expect(source).toContain('"/recuperacao"');
    expect(source).toContain('"/respostas-rapidas"');
    expect(source).toContain('"/sequencias"');
  });

  it("explica quando o Vite devolve HTML no lugar de JSON da API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("<!doctype html><html><body>app</body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requisitarApi("/pipeline")).rejects.toThrow("devolveu HTML em vez de JSON");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("usa cookies no stream em tempo real sem expor token na URL", () => {
    guardarToken("jwt-local-legado");
    const eventSourceMock = vi.fn();
    vi.stubGlobal("EventSource", eventSourceMock);

    expect(obterUrlEventos()).toBe("/eventos");

    criarFonteEventosAutenticada();

    expect(eventSourceMock).toHaveBeenCalledWith("/eventos", { withCredentials: true });
  });

  it("guarda sessão por cookie sem persistir token local", () => {
    const eventos: string[] = [];
    window.addEventListener("emeu:sessao-atualizada", () => eventos.push("atualizada"));

    guardarToken("jwt-antigo");
    guardarSessao(null, { id: "u1", nome: "Luisa", telefone: "923456789", papel: "VENDEDOR" });

    expect(obterToken()).toBeNull();
    expect(obterUsuario()?.nome).toBe("Luisa");
    expect(eventos).toEqual(["atualizada"]);
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
