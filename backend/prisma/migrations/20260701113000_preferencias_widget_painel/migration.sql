CREATE TABLE "PreferenciaWidgetPainel" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "membroId" TEXT NOT NULL,
  "contexto" TEXT NOT NULL,
  "layoutJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PreferenciaWidgetPainel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreferenciaWidgetPainel_negocioId_membroId_contexto_key"
  ON "PreferenciaWidgetPainel"("negocioId", "membroId", "contexto");

CREATE INDEX "PreferenciaWidgetPainel_negocioId_contexto_idx"
  ON "PreferenciaWidgetPainel"("negocioId", "contexto");

CREATE INDEX "PreferenciaWidgetPainel_membroId_idx"
  ON "PreferenciaWidgetPainel"("membroId");

ALTER TABLE "PreferenciaWidgetPainel"
  ADD CONSTRAINT "PreferenciaWidgetPainel_negocioId_fkey"
  FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PreferenciaWidgetPainel"
  ADD CONSTRAINT "PreferenciaWidgetPainel_membroId_fkey"
  FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
