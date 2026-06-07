-- AlterTable
ALTER TABLE "ItemPedido" ADD COLUMN     "varianteSelecionada" TEXT;

-- AlterTable
ALTER TABLE "OportunidadeRecuperacao" ALTER COLUMN "atualizadaEm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OutboxMensagemWhatsApp" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PlaybookRecuperacao" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "varianteSelecionada" TEXT;

-- AlterTable
ALTER TABLE "SessaoLive" ALTER COLUMN "atualizadaEm" DROP DEFAULT;

-- CreateTable
CREATE TABLE "VariantePeca" (
    "id" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "combinacao" TEXT NOT NULL,
    "sku" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantePeca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VariantePeca_pecaId_idx" ON "VariantePeca"("pecaId");

-- CreateIndex
CREATE INDEX "VariantePeca_pecaId_quantidade_idx" ON "VariantePeca"("pecaId", "quantidade");

-- CreateIndex
CREATE UNIQUE INDEX "VariantePeca_pecaId_combinacao_key" ON "VariantePeca"("pecaId", "combinacao");

-- AddForeignKey
ALTER TABLE "VariantePeca" ADD CONSTRAINT "VariantePeca_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "AuditoriaCompartilhamentoCliente_compartilhamentoId_criadoEm_id" RENAME TO "AuditoriaCompartilhamentoCliente_compartilhamentoId_criadoE_idx";

-- RenameIndex
ALTER INDEX "CompartilhamentoCliente_negocioOrigemId_negocioDestinoId_status" RENAME TO "CompartilhamentoCliente_negocioOrigemId_negocioDestinoId_st_idx";

-- RenameIndex
ALTER INDEX "MovimentoFunilComercial_negocioId_entidadeTipo_entidadeId_criad" RENAME TO "MovimentoFunilComercial_negocioId_entidadeTipo_entidadeId_c_idx";
