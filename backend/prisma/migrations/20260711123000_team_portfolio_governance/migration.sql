ALTER TABLE "Projecto"
  ADD COLUMN "objetivo" TEXT,
  ADD COLUMN "stakeholdersJson" TEXT,
  ADD COLUMN "criteriosSucessoJson" TEXT,
  ADD COLUMN "dependenciasJson" TEXT,
  ADD COLUMN "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
  ADD COLUMN "capacidadeConsumida" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "roiEsperado" INTEGER,
  ADD COLUMN "nivelRisco" TEXT NOT NULL DEFAULT 'BAIXO',
  ADD COLUMN "mudancasJson" TEXT,
  ADD COLUMN "riscosJson" TEXT,
  ADD COLUMN "licoesJson" TEXT,
  ADD COLUMN "eventosJson" TEXT;

CREATE INDEX "Projecto_negocioId_prioridade_nivelRisco_idx"
  ON "Projecto"("negocioId", "prioridade", "nivelRisco");

ALTER TABLE "MembroProjecto"
  ADD COLUMN "capacidadePercentual" INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN "skillNecessaria" TEXT;

CREATE INDEX "MembroProjecto_membroId_activo_capacidadePercentual_idx"
  ON "MembroProjecto"("membroId", "activo", "capacidadePercentual");
