import { PrismaClient } from "@prisma/client";

export function resolverDatabaseUrlPrisma(
  databaseUrl = process.env.DATABASE_URL,
  ambiente: Partial<Pick<NodeJS.ProcessEnv, "DATABASE_REQUIRE_SSL" | "DATABASE_SSL_MODE" | "NODE_ENV">> = process.env
): string | undefined {
  if (!databaseUrl || !databaseUrl.startsWith("postgres")) return databaseUrl;

  const sslMode =
    ambiente.DATABASE_SSL_MODE ??
    (ambiente.DATABASE_REQUIRE_SSL === "true" || ambiente.NODE_ENV === "production" ? "require" : "");

  if (!sslMode || ambiente.DATABASE_REQUIRE_SSL === "false") return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", sslMode);
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export function criarPrismaCliente(): PrismaClient {
  const databaseUrl = resolverDatabaseUrlPrisma();
  return new PrismaClient({
    log: ["warn"],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {})
  });
}
