import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

function blocoModelo(nome: string) {
  const regex = new RegExp(`model ${nome} \\{([\\s\\S]*?)\\n\\}`, "m");
  const resultado = schema.match(regex);
  return resultado?.[1] ?? "";
}

describe("schema Prisma multi-loja CRM+", () => {
  it("permite códigos de produto repetidos entre negócios diferentes", () => {
    const peca = blocoModelo("Peca");

    expect(peca).toContain("negocioId");
    expect(peca).not.toContain("codigo        String    @unique");
    expect(peca).toContain("@@unique([negocioId, codigo])");
  });

  it("modela cliente global, cliente por negócio e compartilhamento auditado", () => {
    expect(blocoModelo("ClienteGlobal")).toContain("clientesNegocio");
    expect(blocoModelo("ClienteNegocio")).toContain("@@unique([negocioId, clienteGlobalId])");
    expect(blocoModelo("RelacaoNegocio")).toContain("@@unique([negocioOrigemId, negocioDestinoId, tipo])");
    expect(blocoModelo("CompartilhamentoCliente")).toContain("escopoJson");
    expect(blocoModelo("AuditoriaCompartilhamentoCliente")).toContain("compartilhamentoId");
  });

  it("impede que atendimento volte a usar telefone como chave global", () => {
    const clienteAtendimento = blocoModelo("ClienteAtendimento");
    const conversaAtendimento = blocoModelo("ConversaAtendimento");

    expect(clienteAtendimento).toContain("telefone             String");
    expect(clienteAtendimento).not.toContain("telefone             String                 @unique");
    expect(clienteAtendimento).toContain("@@unique([negocioId, telefone])");
    expect(conversaAtendimento).not.toContain("@@unique([telefone, canal])");
    expect(conversaAtendimento).toContain("@@unique([negocioId, telefone, canal])");
  });

  it("prepara módulos e integrações por negócio sem depender de configuração global", () => {
    expect(blocoModelo("ModuloNegocio")).toContain("@@unique([negocioId, modulo])");
    expect(blocoModelo("InstanciaWhatsApp")).toContain("negocioId");
    expect(blocoModelo("InstanciaWhatsApp")).toContain("@@unique([negocioId, nome])");
  });
});
