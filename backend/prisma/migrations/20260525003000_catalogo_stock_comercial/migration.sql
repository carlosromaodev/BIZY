-- Catálogo comercial: metadados de venda, alertas de stock e histórico de movimentos.
ALTER TABLE "Peca"
ADD COLUMN "sku" TEXT,
ADD COLUMN "categoria" TEXT,
ADD COLUMN "colecao" TEXT,
ADD COLUMN "custoEmKwanza" INTEGER,
ADD COLUMN "stockMinimo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "variantesJson" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN "arquivadaEm" TIMESTAMP(3);

CREATE TABLE "MovimentoStock" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT,
  "pecaId" TEXT NOT NULL,
  "codigoPeca" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "quantidadeAnterior" INTEGER NOT NULL,
  "quantidadeNova" INTEGER NOT NULL,
  "motivo" TEXT,
  "responsavelId" TEXT,
  "origem" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MovimentoStock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Peca_negocioId_categoria_idx" ON "Peca"("negocioId", "categoria");
CREATE INDEX "Peca_negocioId_colecao_idx" ON "Peca"("negocioId", "colecao");
CREATE INDEX "Peca_negocioId_sku_idx" ON "Peca"("negocioId", "sku");
CREATE INDEX "MovimentoStock_negocioId_codigoPeca_criadoEm_idx" ON "MovimentoStock"("negocioId", "codigoPeca", "criadoEm");
CREATE INDEX "MovimentoStock_pecaId_criadoEm_idx" ON "MovimentoStock"("pecaId", "criadoEm");
CREATE INDEX "MovimentoStock_tipo_criadoEm_idx" ON "MovimentoStock"("tipo", "criadoEm");

ALTER TABLE "MovimentoStock"
ADD CONSTRAINT "MovimentoStock_negocioId_fkey"
FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MovimentoStock"
ADD CONSTRAINT "MovimentoStock_pecaId_fkey"
FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
