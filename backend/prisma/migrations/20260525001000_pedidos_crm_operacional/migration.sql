-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "clienteNegocioId" TEXT NOT NULL,
    "reservaId" TEXT,
    "numero" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "estadoPagamento" TEXT NOT NULL DEFAULT 'PENDENTE',
    "estadoEntrega" TEXT NOT NULL DEFAULT 'PENDENTE',
    "origem" TEXT NOT NULL DEFAULT 'manual',
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "subtotalEmKwanza" INTEGER NOT NULL,
    "descontoEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "taxaEntregaEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "totalEmKwanza" INTEGER NOT NULL,
    "motivoDesconto" TEXT,
    "enderecoEntrega" TEXT,
    "comprovativoPagamentoUrl" TEXT,
    "observacao" TEXT,
    "responsavelId" TEXT,
    "pagoEm" TIMESTAMP(3),
    "entregueEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "codigoPeca" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitarioEmKwanza" INTEGER NOT NULL,
    "subtotalEmKwanza" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_negocioId_numero_key" ON "Pedido"("negocioId", "numero");

-- CreateIndex
CREATE INDEX "Pedido_negocioId_estado_criadoEm_idx" ON "Pedido"("negocioId", "estado", "criadoEm");

-- CreateIndex
CREATE INDEX "Pedido_negocioId_estadoPagamento_criadoEm_idx" ON "Pedido"("negocioId", "estadoPagamento", "criadoEm");

-- CreateIndex
CREATE INDEX "Pedido_negocioId_estadoEntrega_criadoEm_idx" ON "Pedido"("negocioId", "estadoEntrega", "criadoEm");

-- CreateIndex
CREATE INDEX "Pedido_clienteNegocioId_criadoEm_idx" ON "Pedido"("clienteNegocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "Pedido_reservaId_idx" ON "Pedido"("reservaId");

-- CreateIndex
CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");

-- CreateIndex
CREATE INDEX "ItemPedido_pecaId_idx" ON "ItemPedido"("pecaId");

-- CreateIndex
CREATE INDEX "ItemPedido_codigoPeca_idx" ON "ItemPedido"("codigoPeca");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteNegocioId_fkey" FOREIGN KEY ("clienteNegocioId") REFERENCES "ClienteNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
