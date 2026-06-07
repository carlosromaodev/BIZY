import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("identidade do cliente entre live, clientes e pedidos", () => {
  it("usa foto real do cliente no avatar Bizy quando a API fornece avatarUrl", () => {
    const designSystem = source("src/componentes/BizyDesignSystem.tsx");

    expect(designSystem).toContain("src?: string | null");
    expect(designSystem).toContain("alt?: string");
    expect(designSystem).toContain("<img");
    expect(designSystem).toContain("bz-avatar-img");
  });

  it("mostra nome, username e foto capturados no feed da live", () => {
    const live = source("src/paginas/Live.tsx");

    expect(live).toContain("avatarUrl?: string | null");
    expect(live).toContain("displayName?: string");
    expect(live).toContain("reserva.avatarUrlCliente");
    expect(live).toContain("evento.avatarUrl");
    expect(live).toContain("bz-feed-person");
  });

  it("declara e apresenta os dados 360 capturados na aba Clientes", () => {
    const tipos = source("src/tipos.ts");
    const clientes = source("src/paginas/Clientes.tsx");

    expect(tipos).toContain("perfil360: Record<string, unknown>");
    expect(tipos).toContain("identidadesDigitais: Record<string, unknown>");
    expect(tipos).toContain("sinaisRelacionamento: Record<string, unknown>");
    expect(tipos).toContain("dadosCaptura: Record<string, unknown>");
    expect(tipos).toContain("ultimoEnriquecimentoEm: string | null");

    expect(clientes).toContain("cliente.avatarUrl");
    expect(clientes).toContain("Dados 360");
    expect(clientes).toContain("Identidades digitais");
    expect(clientes).toContain("Sinais sociais");
    expect(clientes).toContain("Dados de captura");
    expect(clientes).toContain("renderizarObjetoResumo");
  });

  it("faz o ícone de SMS em Pedidos abrir Conversas no contexto do cliente", () => {
    const pedidos = source("src/paginas/Reservas.tsx");
    const conversas = source("src/paginas/Conversas.tsx");

    expect(pedidos).toContain("criarUrlConversaCliente");
    expect(pedidos).toContain("to={criarUrlConversaCliente");
    expect(pedidos).toContain("cliente?.telefone");
    expect(conversas).toContain("useSearchParams");
    expect(conversas).toContain("clienteIdUrl");
    expect(conversas).toContain("telefoneUrl");
    expect(conversas).toContain("abrirConversa(conversaEncontrada.id)");
  });

  it("usa o avatar capturado do cliente também no Atendimento desktop", () => {
    const conversas = source("src/paginas/Conversas.tsx");

    expect(conversas).toMatch(
      /<AvatarBizy\s+iniciais=\{obterIniciais\(conversa\.nomeCliente\)\}[\s\S]*?src=\{conversa\.avatarUrlCliente\}[\s\S]*?alt=\{conversa\.nomeCliente\}/
    );
    expect(conversas).toMatch(
      /<AvatarBizy\s+iniciais=\{obterIniciais\(conversaAtual\.nomeCliente\)\}[\s\S]*?src=\{conversaAtual\.avatarUrlCliente\}[\s\S]*?alt=\{conversaAtual\.nomeCliente\}/
    );
  });
});
