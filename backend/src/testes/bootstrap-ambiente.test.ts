import { describe, expect, it, vi } from "vitest";
import { executarBootstrapAmbiente, validarConfiguracaoBootstrap } from "../scripts/bootstrapAmbiente.js";

describe("bootstrap de ambiente", () => {
  it("bloqueia produção sem segredos obrigatórios", () => {
    const validacao = validarConfiguracaoBootstrap({
      NODE_ENV: "production",
      MODO_ARMAZENAMENTO: "prisma",
      DATABASE_URL: "postgresql://bizy:senha@localhost:5432/bizy"
    });

    expect(validacao.ambiente).toBe("production");
    expect(validacao.faltando).toEqual(
      expect.arrayContaining(["AUTH_SECRET", "EVOLUTION_WEBHOOK_TOKEN", "N8N_BACKEND_TOKEN", "N8N_WEBHOOK_SECRET"])
    );
  });

  it("cria módulos padrão para negócios existentes sem depender de ação manual", async () => {
    const prisma = {
      negocio: {
        findMany: vi.fn(async () => [{ id: "negocio_1", nomeComercial: "Loja Teste" }])
      },
      moduloNegocio: {
        findUnique: vi.fn(async ({ where }: { where: { negocioId_modulo: { modulo: string } } }) =>
          where.negocioId_modulo.modulo === "crm" ? { id: "modulo_crm" } : null
        ),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: `modulo_${data.modulo}`, ...data }))
      }
    };

    const resultado = await executarBootstrapAmbiente(prisma, {
      NODE_ENV: "development",
      MODO_ARMAZENAMENTO: "prisma",
      DATABASE_URL: "postgresql://bizy:senha@localhost:5432/bizy"
    });

    expect(resultado.negociosVerificados).toBe(1);
    expect(resultado.modulosExistentes).toBe(1);
    expect(resultado.modulosCriados).toBeGreaterThan(5);
    expect(prisma.moduloNegocio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negocioId: "negocio_1",
          modulo: "catalogo",
          ativo: true,
          configuracaoJson: "{}"
        })
      })
    );
  });
});
