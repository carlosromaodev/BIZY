-- Expand: activa VariantePeca como fonte de preco e stock por combinacao.
-- Impacto: somente colunas opcionais/default, indices e FKs; pedidos antigos permanecem validos.
-- Backfill: opcoesJson recebe combinacao quando esta ja for JSON valido, sem alterar stock historico.
-- Rollback: desligar dual read; remover FKs/indices e depois as novas colunas apenas sem dados dependentes.

ALTER TABLE "VariantePeca"
  ADD COLUMN "opcoesJson" TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN "precoEmKwanza" INTEGER,
  ADD COLUMN "custoEmKwanza" INTEGER,
  ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'ATIVA';

ALTER TABLE "ItemPedido" ADD COLUMN "variantePecaId" TEXT;
ALTER TABLE "ReservaStockCheckout"
  ADD COLUMN "variantePecaId" TEXT,
  ADD COLUMN "combinacaoVariante" TEXT;

UPDATE "VariantePeca"
SET "opcoesJson" = "combinacao"
WHERE "combinacao" ~ '^\s*\{.*\}\s*$';

CREATE INDEX "VariantePeca_pecaId_estado_quantidade_idx" ON "VariantePeca"("pecaId", "estado", "quantidade");
CREATE INDEX "ItemPedido_variantePecaId_idx" ON "ItemPedido"("variantePecaId");
CREATE INDEX "ReservaStockCheckout_variantePecaId_estado_expiraEm_idx" ON "ReservaStockCheckout"("variantePecaId", "estado", "expiraEm");

ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_variantePecaId_fkey" FOREIGN KEY ("variantePecaId") REFERENCES "VariantePeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReservaStockCheckout" ADD CONSTRAINT "ReservaStockCheckout_variantePecaId_fkey" FOREIGN KEY ("variantePecaId") REFERENCES "VariantePeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
