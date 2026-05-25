CREATE TABLE "HistoricoComissaoParceiro" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT NOT NULL,
    "valorEmKwanza" INTEGER NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "motivo" TEXT,
    "referencia" TEXT,
    "autorId" TEXT,
    "autorNome" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoComissaoParceiro_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HistoricoComissaoParceiro_negocioId_tipo_criadoEm_idx" ON "HistoricoComissaoParceiro"("negocioId", "tipo", "criadoEm");
CREATE INDEX "HistoricoComissaoParceiro_comissaoId_criadoEm_idx" ON "HistoricoComissaoParceiro"("comissaoId", "criadoEm");
CREATE INDEX "HistoricoComissaoParceiro_pedidoId_idx" ON "HistoricoComissaoParceiro"("pedidoId");
CREATE INDEX "HistoricoComissaoParceiro_afiliadoId_idx" ON "HistoricoComissaoParceiro"("afiliadoId");

ALTER TABLE "HistoricoComissaoParceiro" ADD CONSTRAINT "HistoricoComissaoParceiro_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistoricoComissaoParceiro" ADD CONSTRAINT "HistoricoComissaoParceiro_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "ComissaoParceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
