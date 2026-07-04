-- AlterTable
ALTER TABLE "MovimentoFinanceiro" ADD COLUMN "metodoPagamento" TEXT;
ALTER TABLE "MovimentoFinanceiro" ADD COLUMN "referenciaPagamento" TEXT;
ALTER TABLE "MovimentoFinanceiro" ADD COLUMN "comprovativoUrl" TEXT;

-- AlterTable
ALTER TABLE "Despesa" ADD COLUMN "metodoPagamento" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "referenciaPagamento" TEXT;

-- AlterTable
ALTER TABLE "ContaReceber" ADD COLUMN "facturaId" TEXT;
ALTER TABLE "ContaReceber" ADD COLUMN "metodoPagamento" TEXT;
ALTER TABLE "ContaReceber" ADD COLUMN "referenciaPagamento" TEXT;
ALTER TABLE "ContaReceber" ADD COLUMN "comprovativoPagamentoUrl" TEXT;

-- AlterTable
ALTER TABLE "ContaPagar" ADD COLUMN "metodoPagamento" TEXT;
ALTER TABLE "ContaPagar" ADD COLUMN "referenciaPagamento" TEXT;
ALTER TABLE "ContaPagar" ADD COLUMN "comprovativoPagamentoUrl" TEXT;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN "tipoDocumento" TEXT NOT NULL DEFAULT 'FACTURA';
ALTER TABLE "Factura" ADD COLUMN "estadoPagamento" TEXT NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE "Factura" ADD COLUMN "valorPago" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Factura" ADD COLUMN "dataVencimento" TIMESTAMP(3);
ALTER TABLE "Factura" ADD COLUMN "pagoEm" TIMESTAMP(3);
ALTER TABLE "Factura" ADD COLUMN "metodoPagamento" TEXT;
ALTER TABLE "Factura" ADD COLUMN "referenciaPagamento" TEXT;
ALTER TABLE "Factura" ADD COLUMN "comprovativoPagamentoUrl" TEXT;
ALTER TABLE "Factura" ADD COLUMN "codigoValidacao" TEXT;
ALTER TABLE "Factura" ADD COLUMN "qrCode" TEXT;
ALTER TABLE "Factura" ADD COLUMN "hashDocumento" TEXT;

-- CreateIndex
CREATE INDEX "ContaReceber_negocioId_facturaId_idx" ON "ContaReceber"("negocioId", "facturaId");

-- CreateIndex
CREATE INDEX "Factura_negocioId_estadoPagamento_dataVencimento_idx" ON "Factura"("negocioId", "estadoPagamento", "dataVencimento");
