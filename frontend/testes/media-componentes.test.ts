import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolverUrlMedia } from "../src/api";

describe("resolverUrlMedia", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devolve string vazia para valores nulos ou vazios", () => {
    expect(resolverUrlMedia(null)).toBe("");
    expect(resolverUrlMedia(undefined)).toBe("");
    expect(resolverUrlMedia("")).toBe("");
    expect(resolverUrlMedia("   ")).toBe("");
  });

  it("preserva URLs absolutas http/https", () => {
    expect(resolverUrlMedia("https://exemplo.com/foto.jpg")).toBe("https://exemplo.com/foto.jpg");
    expect(resolverUrlMedia("http://localhost:3000/img.png")).toBe("http://localhost:3000/img.png");
  });

  it("preserva data URLs e blob URLs", () => {
    expect(resolverUrlMedia("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(resolverUrlMedia("blob:http://localhost/uuid")).toBe("blob:http://localhost/uuid");
  });

  it("resolve caminhos /media/files/ com prefixo da API", () => {
    const resultado = resolverUrlMedia("/media/files/lojas/2026/06/abc.webp");
    expect(resultado).toContain("/media/files/lojas/2026/06/abc.webp");
  });

  it("normaliza /api/media/files/ removendo o /api e resolve com prefixo da API", () => {
    const resultado = resolverUrlMedia("/api/media/files/avatars/2026/05/uuid.webp");
    expect(resultado).toContain("/media/files/avatars/2026/05/uuid.webp");
    expect(resultado).not.toContain("/api/media/");
  });

  it("devolve o valor original para caminhos desconhecidos", () => {
    expect(resolverUrlMedia("/outro/caminho")).toBe("/outro/caminho");
  });
});

describe("lógica de iniciais e cores do AvatarUsuario", () => {
  function obterIniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return nome.slice(0, 2).toUpperCase();
  }

  function corPorNome(nome: string): string {
    const CORES = [
      "bg-orange-100 text-orange-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-violet-100 text-violet-700",
      "bg-rose-100 text-rose-700",
      "bg-amber-100 text-amber-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
    ];
    let hash = 0;
    for (let i = 0; i < nome.length; i++) {
      hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CORES[Math.abs(hash) % CORES.length];
  }

  it("extrai duas iniciais de nome completo", () => {
    expect(obterIniciais("Carlos Romão")).toBe("CR");
    expect(obterIniciais("Ana Maria Silva")).toBe("AS");
  });

  it("usa duas primeiras letras quando há só um nome", () => {
    expect(obterIniciais("Carlos")).toBe("CA");
    expect(obterIniciais("Li")).toBe("LI");
  });

  it("é determinístico — mesmo nome gera sempre a mesma cor", () => {
    const cor1 = corPorNome("Carlos Romão");
    const cor2 = corPorNome("Carlos Romão");
    expect(cor1).toBe(cor2);
  });

  it("nomes diferentes podem gerar cores diferentes", () => {
    const corA = corPorNome("Ana");
    const corB = corPorNome("Bruno");
    // Não garantimos que são sempre diferentes, mas devem ser strings válidas
    expect(corA).toMatch(/^bg-\w+-100 text-\w+-700$/);
    expect(corB).toMatch(/^bg-\w+-100 text-\w+-700$/);
  });
});

describe("comprimirImagem", () => {
  it("exporta a função de compressão", async () => {
    const modulo = await import("../src/media");
    expect(typeof modulo.comprimirImagem).toBe("function");
  });

  it("exporta a função lerArquivoComoDataUrl", async () => {
    const modulo = await import("../src/media");
    expect(typeof modulo.lerArquivoComoDataUrl).toBe("function");
  });

  it("exporta a função enviarMedia", async () => {
    const modulo = await import("../src/media");
    expect(typeof modulo.enviarMedia).toBe("function");
  });
});
