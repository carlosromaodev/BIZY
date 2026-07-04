-- CreateTable
CREATE TABLE "ImportacaoExtratoBancario" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "formato" TEXT NOT NULL DEFAULT 'CSV',
    "totalLinhas" INTEGER NOT NULL DEFAULT 0,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportacaoExtratoBancario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoBancario" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "importacaoId" TEXT NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "referencia" TEXT,
    "estadoConciliacao" TEXT NOT NULL DEFAULT 'PENDENTE',
    "movimentoFinanceiroId" TEXT,
    "sugestoesJson" TEXT NOT NULL DEFAULT '[]',
    "conciliadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentoBancario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportacaoExtratoBancario_negocioId_criadoEm_idx" ON "ImportacaoExtratoBancario"("negocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "ImportacaoExtratoBancario_negocioId_formato_idx" ON "ImportacaoExtratoBancario"("negocioId", "formato");

-- CreateIndex
CREATE INDEX "MovimentoBancario_negocioId_estadoConciliacao_dataMovimento_idx" ON "MovimentoBancario"("negocioId", "estadoConciliacao", "dataMovimento");

-- CreateIndex
CREATE INDEX "MovimentoBancario_negocioId_valor_dataMovimento_idx" ON "MovimentoBancario"("negocioId", "valor", "dataMovimento");

-- CreateIndex
CREATE INDEX "MovimentoBancario_movimentoFinanceiroId_idx" ON "MovimentoBancario"("movimentoFinanceiroId");

-- CreateIndex
CREATE INDEX "MovimentoBancario_importacaoId_idx" ON "MovimentoBancario"("importacaoId");

-- AddForeignKey
ALTER TABLE "ImportacaoExtratoBancario" ADD CONSTRAINT "ImportacaoExtratoBancario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoBancario" ADD CONSTRAINT "MovimentoBancario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoBancario" ADD CONSTRAINT "MovimentoBancario_importacaoId_fkey" FOREIGN KEY ("importacaoId") REFERENCES "ImportacaoExtratoBancario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoBancario" ADD CONSTRAINT "MovimentoBancario_movimentoFinanceiroId_fkey" FOREIGN KEY ("movimentoFinanceiroId") REFERENCES "MovimentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
