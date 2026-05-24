-- CreateTable
CREATE TABLE "OutboxEventoN8n" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "proximaTentativaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoErro" TEXT,
    "publicadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEventoN8n_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxEventoN8n_status_proximaTentativaEm_idx" ON "OutboxEventoN8n"("status", "proximaTentativaEm");

-- CreateIndex
CREATE INDEX "OutboxEventoN8n_tipo_criadoEm_idx" ON "OutboxEventoN8n"("tipo", "criadoEm");

-- Índice parcial usado como proteção final contra duplicidade ativa por cliente e peça.
CREATE UNIQUE INDEX "Reserva_cliente_peca_ativa_unica_idx"
ON "Reserva"("telefoneCliente", "codigoPeca")
WHERE "estado" IN ('PENDING', 'RESERVED', 'WAITING_PAYMENT', 'WAITLISTED');
