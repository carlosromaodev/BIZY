ALTER TABLE "CompraUnificada"
  ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "CompraUnificada_compradorTelefone_idempotencyKey_key"
  ON "CompraUnificada"("compradorTelefone", "idempotencyKey");

ALTER TABLE "PedidoFilho"
  ADD COLUMN "estadoSeparacao" TEXT NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "estadoEmbalagem" TEXT NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "provaEntregaUrl" TEXT,
  ADD COLUMN "tentativasEntrega" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "motivoAtraso" TEXT,
  ADD COLUMN "estadoDevolucao" TEXT,
  ADD COLUMN "fulfillmentJson" TEXT NOT NULL DEFAULT '[]';

CREATE INDEX "PedidoFilho_negocioId_estadoEntrega_estadoSeparacao_idx"
  ON "PedidoFilho"("negocioId", "estadoEntrega", "estadoSeparacao");

ALTER TABLE "DenunciaMarket"
  ADD COLUMN "origem" TEXT NOT NULL DEFAULT 'PUBLICO',
  ADD COLUMN "evidenciasJson" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "responsavelId" TEXT,
  ADD COLUMN "prazoEm" TIMESTAMP(3);

CREATE INDEX "DenunciaMarket_estado_prazoEm_idx" ON "DenunciaMarket"("estado", "prazoEm");
