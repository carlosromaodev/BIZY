-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN "origem" TEXT;

-- CreateIndex
CREATE INDEX "Reserva_negocioId_origem_idx" ON "Reserva"("negocioId", "origem");
