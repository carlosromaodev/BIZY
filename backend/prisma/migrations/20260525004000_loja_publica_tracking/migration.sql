-- Loja pública, catálogo compartilhável e tracking comercial.
ALTER TABLE "Negocio"
ADD COLUMN "slugPublico" TEXT,
ADD COLUMN "descricaoPublica" TEXT,
ADD COLUMN "lojaPublicadaEm" TIMESTAMP(3);

CREATE TABLE "EventoTrackingComercial" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "entidadeTipo" TEXT,
  "entidadeId" TEXT,
  "slugLoja" TEXT,
  "codigoProduto" TEXT,
  "trackingId" TEXT,
  "origem" TEXT,
  "canal" TEXT,
  "utmJson" TEXT NOT NULL DEFAULT '{}',
  "metadataJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventoTrackingComercial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Negocio_slugPublico_key" ON "Negocio"("slugPublico");
CREATE INDEX "Negocio_slugPublico_idx" ON "Negocio"("slugPublico");
CREATE INDEX "EventoTrackingComercial_negocioId_tipo_criadoEm_idx" ON "EventoTrackingComercial"("negocioId", "tipo", "criadoEm");
CREATE INDEX "EventoTrackingComercial_negocioId_origem_criadoEm_idx" ON "EventoTrackingComercial"("negocioId", "origem", "criadoEm");
CREATE INDEX "EventoTrackingComercial_negocioId_canal_criadoEm_idx" ON "EventoTrackingComercial"("negocioId", "canal", "criadoEm");
CREATE INDEX "EventoTrackingComercial_slugLoja_criadoEm_idx" ON "EventoTrackingComercial"("slugLoja", "criadoEm");
CREATE INDEX "EventoTrackingComercial_trackingId_criadoEm_idx" ON "EventoTrackingComercial"("trackingId", "criadoEm");

ALTER TABLE "EventoTrackingComercial"
ADD CONSTRAINT "EventoTrackingComercial_negocioId_fkey"
FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
