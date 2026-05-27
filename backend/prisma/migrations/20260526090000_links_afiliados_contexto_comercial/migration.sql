ALTER TABLE "LinkAfiliado" ADD COLUMN "destinoId" TEXT;
ALTER TABLE "LinkAfiliado" ADD COLUMN "metadataJson" TEXT NOT NULL DEFAULT '{}';
CREATE INDEX "LinkAfiliado_negocioId_destinoTipo_destinoId_idx" ON "LinkAfiliado"("negocioId", "destinoTipo", "destinoId");
