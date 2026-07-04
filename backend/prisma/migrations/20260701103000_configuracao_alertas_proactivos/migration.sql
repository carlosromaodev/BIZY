CREATE TABLE "ConfiguracaoAlertaProactivo" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "canal" TEXT NOT NULL DEFAULT 'WHATSAPP',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "valorMinimo" INTEGER,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConfiguracaoAlertaProactivo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConfiguracaoAlertaProactivo_negocioId_tipo_canal_key"
  ON "ConfiguracaoAlertaProactivo"("negocioId", "tipo", "canal");

CREATE INDEX "ConfiguracaoAlertaProactivo_negocioId_ativo_tipo_idx"
  ON "ConfiguracaoAlertaProactivo"("negocioId", "ativo", "tipo");

ALTER TABLE "ConfiguracaoAlertaProactivo"
  ADD CONSTRAINT "ConfiguracaoAlertaProactivo_negocioId_fkey"
  FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
