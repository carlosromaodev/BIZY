CREATE TABLE IF NOT EXISTS "OutboxMensagemWhatsApp" (
  "id" TEXT NOT NULL,
  "telefone" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "contextoJson" TEXT NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "maxTentativas" INTEGER NOT NULL DEFAULT 5,
  "proximaTentativaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ultimoErro" TEXT,
  "provider" TEXT,
  "idExterno" TEXT,
  "enviadaEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OutboxMensagemWhatsApp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OutboxMensagemWhatsApp_status_proximaTentativaEm_idx"
  ON "OutboxMensagemWhatsApp"("status", "proximaTentativaEm");
CREATE INDEX IF NOT EXISTS "OutboxMensagemWhatsApp_telefone_tipo_idx"
  ON "OutboxMensagemWhatsApp"("telefone", "tipo");
CREATE INDEX IF NOT EXISTS "OutboxMensagemWhatsApp_criadoEm_idx"
  ON "OutboxMensagemWhatsApp"("criadoEm");
