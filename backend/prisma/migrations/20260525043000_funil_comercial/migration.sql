CREATE TABLE "MovimentoFunilComercial" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "entidadeTipo" TEXT NOT NULL,
  "entidadeId" TEXT NOT NULL,
  "etapaAnterior" TEXT,
  "etapaNova" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "origem" TEXT,
  "autorId" TEXT,
  "contextoJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MovimentoFunilComercial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MovimentoFunilComercial_negocioId_entidadeTipo_entidadeId_criadoEm_idx"
  ON "MovimentoFunilComercial"("negocioId", "entidadeTipo", "entidadeId", "criadoEm");

CREATE INDEX "MovimentoFunilComercial_negocioId_etapaNova_criadoEm_idx"
  ON "MovimentoFunilComercial"("negocioId", "etapaNova", "criadoEm");

CREATE INDEX "MovimentoFunilComercial_negocioId_origem_criadoEm_idx"
  ON "MovimentoFunilComercial"("negocioId", "origem", "criadoEm");

ALTER TABLE "MovimentoFunilComercial"
  ADD CONSTRAINT "MovimentoFunilComercial_negocioId_fkey"
  FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
