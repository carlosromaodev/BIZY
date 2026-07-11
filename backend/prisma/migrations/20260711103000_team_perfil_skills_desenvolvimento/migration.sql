ALTER TABLE "MembroNegocio"
  ADD COLUMN "departamentoId" TEXT,
  ADD COLUMN "cargo" TEXT,
  ADD COLUMN "skillsJson" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "desenvolvimentoJson" TEXT NOT NULL DEFAULT '[]';

CREATE INDEX "MembroNegocio_negocioId_departamentoId_status_idx"
  ON "MembroNegocio"("negocioId", "departamentoId", "status");

ALTER TABLE "MembroNegocio"
  ADD CONSTRAINT "MembroNegocio_departamentoId_fkey"
  FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
