import { PrismaClient } from "@prisma/client";

export function criarPrismaCliente(): PrismaClient {
  return new PrismaClient({
    log: ["warn"]
  });
}
