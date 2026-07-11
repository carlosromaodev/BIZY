ALTER TABLE "RepasseFinanceiro"
  ADD COLUMN "valorProdutosEmKwanza" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "valorEntregaEmKwanza" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "impostosEmKwanza" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "retencaoEmKwanza" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reembolsoEmKwanza" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "valorDisponivelEmKwanza" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "motivoRetencao" TEXT,
  ADD COLUMN "retidoAte" TIMESTAMP(3),
  ADD COLUMN "politicaCalculoVersao" TEXT NOT NULL DEFAULT 'market.split.v1';

UPDATE "RepasseFinanceiro"
SET "valorProdutosEmKwanza" = "valorBrutoEmKwanza",
    "valorDisponivelEmKwanza" = "valorLiquidoEmKwanza";

CREATE INDEX "RepasseFinanceiro_negocioId_estado_retidoAte_idx"
  ON "RepasseFinanceiro"("negocioId", "estado", "retidoAte");
