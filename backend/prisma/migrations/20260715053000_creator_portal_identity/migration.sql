-- Fase 6 (expand): liga parceiros comerciais a uma ContaBizy verificada.
-- Rollback: manter a coluna enquanto existirem associacoes; o portal pode ser desligado sem perda de dados.
ALTER TABLE "ParceiroComercial" ADD COLUMN "contaBizyId" TEXT;

CREATE UNIQUE INDEX "ParceiroComercial_negocioId_contaBizyId_key"
ON "ParceiroComercial"("negocioId", "contaBizyId");
CREATE INDEX "ParceiroComercial_contaBizyId_estado_idx"
ON "ParceiroComercial"("contaBizyId", "estado");

ALTER TABLE "ParceiroComercial"
ADD CONSTRAINT "ParceiroComercial_contaBizyId_fkey"
FOREIGN KEY ("contaBizyId") REFERENCES "ContaBizy"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
