-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "clienteNome" TEXT NOT NULL,
    "clienteNif" TEXT,
    "clienteEndereco" TEXT,
    "serie" TEXT NOT NULL DEFAULT 'FT',
    "numero" INTEGER NOT NULL,
    "anoFiscal" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "subtotal" INTEGER NOT NULL,
    "ivaPercentual" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "ivaValor" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "observacao" TEXT,
    "anuladaEm" TIMESTAMP(3),
    "motivoAnulacao" TEXT,
    "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemFactura" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "ivaPercentual" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "ivaValor" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCredito" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anoFiscal" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaVendas" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "kpi" TEXT NOT NULL DEFAULT 'VENDAS_VALOR',
    "periodo" TEXT NOT NULL DEFAULT 'MENSAL',
    "valorMeta" INTEGER NOT NULL,
    "mes" INTEGER,
    "ano" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaVendas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Factura_negocioId_estado_emitidaEm_idx" ON "Factura"("negocioId", "estado", "emitidaEm");

-- CreateIndex
CREATE INDEX "Factura_negocioId_pedidoId_idx" ON "Factura"("negocioId", "pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_negocioId_serie_numero_anoFiscal_key" ON "Factura"("negocioId", "serie", "numero", "anoFiscal");

-- CreateIndex
CREATE INDEX "ItemFactura_facturaId_idx" ON "ItemFactura"("facturaId");

-- CreateIndex
CREATE INDEX "NotaCredito_negocioId_facturaId_idx" ON "NotaCredito"("negocioId", "facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaCredito_negocioId_numero_anoFiscal_key" ON "NotaCredito"("negocioId", "numero", "anoFiscal");

-- CreateIndex
CREATE INDEX "MetaVendas_negocioId_tipo_periodo_idx" ON "MetaVendas"("negocioId", "tipo", "periodo");

-- CreateIndex
CREATE INDEX "MetaVendas_membroId_periodo_idx" ON "MetaVendas"("membroId", "periodo");

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFactura" ADD CONSTRAINT "ItemFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaVendas" ADD CONSTRAINT "MetaVendas_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaVendas" ADD CONSTRAINT "MetaVendas_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
