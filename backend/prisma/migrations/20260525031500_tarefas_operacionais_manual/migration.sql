-- AlterTable
ALTER TABLE "TarefaOperacional" ADD COLUMN "clienteId" TEXT;
ALTER TABLE "TarefaOperacional" ADD COLUMN "pedidoId" TEXT;
ALTER TABLE "TarefaOperacional" ADD COLUMN "observacao" TEXT;
ALTER TABLE "TarefaOperacional" ADD COLUMN "concluidaEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TarefaOperacional_clienteId_criadaEm_idx" ON "TarefaOperacional"("clienteId", "criadaEm");

-- CreateIndex
CREATE INDEX "TarefaOperacional_pedidoId_criadaEm_idx" ON "TarefaOperacional"("pedidoId", "criadaEm");
