ALTER TABLE "ComissaoParceiro" ADD COLUMN "lotePagamentoId" TEXT;

CREATE TABLE "LotePagamentoComissao" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "referenciaPagamento" TEXT NOT NULL,
    "observacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAGO',
    "quantidadeComissoes" INTEGER NOT NULL,
    "valorTotalEmKwanza" INTEGER NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "periodoInicio" TIMESTAMP(3),
    "periodoFim" TIMESTAMP(3),
    "autorId" TEXT,
    "autorNome" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotePagamentoComissao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemLotePagamentoComissao" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "valorEmKwanza" INTEGER NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "statusAnterior" TEXT NOT NULL,
    "statusNovo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemLotePagamentoComissao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComissaoParceiro_lotePagamentoId_idx" ON "ComissaoParceiro"("lotePagamentoId");
CREATE INDEX "LotePagamentoComissao_negocioId_criadoEm_idx" ON "LotePagamentoComissao"("negocioId", "criadoEm");
CREATE INDEX "LotePagamentoComissao_negocioId_status_idx" ON "LotePagamentoComissao"("negocioId", "status");
CREATE INDEX "LotePagamentoComissao_referenciaPagamento_idx" ON "LotePagamentoComissao"("referenciaPagamento");
CREATE UNIQUE INDEX "ItemLotePagamentoComissao_loteId_comissaoId_key" ON "ItemLotePagamentoComissao"("loteId", "comissaoId");
CREATE INDEX "ItemLotePagamentoComissao_negocioId_loteId_idx" ON "ItemLotePagamentoComissao"("negocioId", "loteId");
CREATE INDEX "ItemLotePagamentoComissao_comissaoId_idx" ON "ItemLotePagamentoComissao"("comissaoId");
CREATE INDEX "ItemLotePagamentoComissao_afiliadoId_idx" ON "ItemLotePagamentoComissao"("afiliadoId");
CREATE INDEX "ItemLotePagamentoComissao_pedidoId_idx" ON "ItemLotePagamentoComissao"("pedidoId");

ALTER TABLE "ComissaoParceiro" ADD CONSTRAINT "ComissaoParceiro_lotePagamentoId_fkey" FOREIGN KEY ("lotePagamentoId") REFERENCES "LotePagamentoComissao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LotePagamentoComissao" ADD CONSTRAINT "LotePagamentoComissao_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemLotePagamentoComissao" ADD CONSTRAINT "ItemLotePagamentoComissao_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LotePagamentoComissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemLotePagamentoComissao" ADD CONSTRAINT "ItemLotePagamentoComissao_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "ComissaoParceiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
