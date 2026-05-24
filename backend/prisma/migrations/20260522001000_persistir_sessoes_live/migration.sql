CREATE TABLE IF NOT EXISTS "SessaoLive" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "providerNome" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "iniciadaEm" TIMESTAMP(3) NOT NULL,
  "encerradaEm" TIMESTAMP(3),
  "comentariosRecebidos" INTEGER NOT NULL DEFAULT 0,
  "comentariosProcessados" INTEGER NOT NULL DEFAULT 0,
  "comentariosComErro" INTEGER NOT NULL DEFAULT 0,
  "ultimoComentarioEm" TIMESTAMP(3),
  "ultimoErro" TEXT,
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SessaoLive_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SessaoLive_ativa_status_idx" ON "SessaoLive"("ativa", "status");
CREATE INDEX IF NOT EXISTS "SessaoLive_username_idx" ON "SessaoLive"("username");
