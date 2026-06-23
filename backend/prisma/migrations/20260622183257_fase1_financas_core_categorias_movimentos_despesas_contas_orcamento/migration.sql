-- CreateTable
CREATE TABLE "CategoriaFinanceira" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'DESPESA',
    "icone" TEXT,
    "cor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoFinanceiro" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoriaId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "origemTipo" TEXT,
    "origemId" TEXT,
    "responsavelId" TEXT,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciliado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "tipoRecorrencia" TEXT NOT NULL DEFAULT 'UNICA',
    "fornecedor" TEXT,
    "comprovativoUrl" TEXT,
    "dataVencimento" TIMESTAMP(3),
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "pagoEm" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaReceber" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "clienteId" TEXT,
    "pedidoId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'A_VENCER',
    "pagoEm" TIMESTAMP(3),
    "valorPago" INTEGER,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaReceber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaPagar" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'A_VENCER',
    "pagoEm" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaPagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrcamentoPeriodo" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "valorOrcado" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrcamentoPeriodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoriaFinanceira_negocioId_tipo_idx" ON "CategoriaFinanceira"("negocioId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaFinanceira_negocioId_nome_key" ON "CategoriaFinanceira"("negocioId", "nome");

-- CreateIndex
CREATE INDEX "MovimentoFinanceiro_negocioId_tipo_dataMovimento_idx" ON "MovimentoFinanceiro"("negocioId", "tipo", "dataMovimento");

-- CreateIndex
CREATE INDEX "MovimentoFinanceiro_negocioId_categoriaId_dataMovimento_idx" ON "MovimentoFinanceiro"("negocioId", "categoriaId", "dataMovimento");

-- CreateIndex
CREATE INDEX "MovimentoFinanceiro_negocioId_reconciliado_idx" ON "MovimentoFinanceiro"("negocioId", "reconciliado");

-- CreateIndex
CREATE INDEX "MovimentoFinanceiro_origemTipo_origemId_idx" ON "MovimentoFinanceiro"("origemTipo", "origemId");

-- CreateIndex
CREATE INDEX "Despesa_negocioId_pago_dataVencimento_idx" ON "Despesa"("negocioId", "pago", "dataVencimento");

-- CreateIndex
CREATE INDEX "Despesa_negocioId_categoriaId_idx" ON "Despesa"("negocioId", "categoriaId");

-- CreateIndex
CREATE INDEX "Despesa_negocioId_tipoRecorrencia_idx" ON "Despesa"("negocioId", "tipoRecorrencia");

-- CreateIndex
CREATE INDEX "ContaReceber_negocioId_estado_dataVencimento_idx" ON "ContaReceber"("negocioId", "estado", "dataVencimento");

-- CreateIndex
CREATE INDEX "ContaReceber_negocioId_clienteId_idx" ON "ContaReceber"("negocioId", "clienteId");

-- CreateIndex
CREATE INDEX "ContaPagar_negocioId_estado_dataVencimento_idx" ON "ContaPagar"("negocioId", "estado", "dataVencimento");

-- CreateIndex
CREATE INDEX "OrcamentoPeriodo_negocioId_ano_mes_idx" ON "OrcamentoPeriodo"("negocioId", "ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "OrcamentoPeriodo_negocioId_categoriaId_mes_ano_key" ON "OrcamentoPeriodo"("negocioId", "categoriaId", "mes", "ano");

-- AddForeignKey
ALTER TABLE "CategoriaFinanceira" ADD CONSTRAINT "CategoriaFinanceira_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoFinanceiro" ADD CONSTRAINT "MovimentoFinanceiro_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoFinanceiro" ADD CONSTRAINT "MovimentoFinanceiro_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoPeriodo" ADD CONSTRAINT "OrcamentoPeriodo_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrcamentoPeriodo" ADD CONSTRAINT "OrcamentoPeriodo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanceira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
