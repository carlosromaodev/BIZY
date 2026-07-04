import { describe, expect, it } from "vitest";
import { resolverDatabaseUrlPrisma } from "../infra/banco/prismaCliente.js";

describe("criarPrismaCliente", () => {
  it("RNF-T009: exige sslmode=require em PostgreSQL de produção quando a URL não define SSL", () => {
    const url = resolverDatabaseUrlPrisma("postgresql://bizy:senha@db:5432/bizy?schema=public", {
      NODE_ENV: "production"
    });

    expect(url).toBe("postgresql://bizy:senha@db:5432/bizy?schema=public&sslmode=require");
  });

  it("preserva sslmode explícito e permite verify-full por ambiente", () => {
    expect(
      resolverDatabaseUrlPrisma("postgresql://bizy:senha@db:5432/bizy?schema=public&sslmode=verify-full", {
        NODE_ENV: "production"
      })
    ).toBe("postgresql://bizy:senha@db:5432/bizy?schema=public&sslmode=verify-full");

    expect(
      resolverDatabaseUrlPrisma("postgresql://bizy:senha@db:5432/bizy?schema=public", {
        DATABASE_SSL_MODE: "verify-full",
        NODE_ENV: "staging"
      })
    ).toBe("postgresql://bizy:senha@db:5432/bizy?schema=public&sslmode=verify-full");
  });

  it("não força SSL em desenvolvimento quando a política não foi activada", () => {
    expect(
      resolverDatabaseUrlPrisma("postgresql://bizy:senha@localhost:5432/bizy?schema=public", {
        NODE_ENV: "development"
      })
    ).toBe("postgresql://bizy:senha@localhost:5432/bizy?schema=public");
  });
});
