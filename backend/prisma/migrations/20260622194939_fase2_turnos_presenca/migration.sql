-- CreateTable
CREATE TABLE "TurnoMembro" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurnoMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistoPresenca" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'CHECK_IN',
    "registadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL DEFAULT 'MANUAL',
    "observacao" TEXT,

    CONSTRAINT "RegistoPresenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TurnoMembro_negocioId_diaSemana_idx" ON "TurnoMembro"("negocioId", "diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "TurnoMembro_membroId_diaSemana_key" ON "TurnoMembro"("membroId", "diaSemana");

-- CreateIndex
CREATE INDEX "RegistoPresenca_negocioId_membroId_registadoEm_idx" ON "RegistoPresenca"("negocioId", "membroId", "registadoEm");

-- CreateIndex
CREATE INDEX "RegistoPresenca_negocioId_registadoEm_idx" ON "RegistoPresenca"("negocioId", "registadoEm");

-- AddForeignKey
ALTER TABLE "TurnoMembro" ADD CONSTRAINT "TurnoMembro_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoMembro" ADD CONSTRAINT "TurnoMembro_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistoPresenca" ADD CONSTRAINT "RegistoPresenca_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistoPresenca" ADD CONSTRAINT "RegistoPresenca_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
