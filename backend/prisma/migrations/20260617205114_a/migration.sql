-- AlterTable
ALTER TABLE "Peca" ADD COLUMN     "tipoProduto" TEXT NOT NULL DEFAULT 'FISICO';

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "ivaEmKwanza" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ivaPercentual" DOUBLE PRECISION NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE "InstanciaInstagram" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT,
    "nome" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CRIADA',
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ultimoErro" TEXT,
    "ultimaConexaoEm" TIMESTAMP(3),
    "ultimaPollEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstanciaInstagram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguidorLoja" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'anonimo',
    "origem" TEXT NOT NULL DEFAULT 'perfil',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguidorLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DenunciaMarket" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "entidadeTipo" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "negocioAlvoId" TEXT,
    "denuncianteId" TEXT,
    "motivo" TEXT NOT NULL,
    "descricao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "resolvidoPorId" TEXT,
    "resolucao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DenunciaMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaStockCheckout" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "codigoPeca" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ATIVA',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "liberadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservaStockCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraUnificada" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "compradorTelefone" TEXT NOT NULL,
    "compradorNome" TEXT,
    "compradorEmail" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ABERTA',
    "estadoPagamento" TEXT NOT NULL DEFAULT 'PENDENTE',
    "subtotalEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "descontoEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "taxaEntregaTotalEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "totalEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "metodoPagamento" TEXT,
    "comprovativoPagamentoUrl" TEXT,
    "enderecoEntrega" TEXT,
    "observacao" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'market',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompraUnificada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoFilho" (
    "id" TEXT NOT NULL,
    "compraUnificadaId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NOVO',
    "estadoPagamento" TEXT NOT NULL DEFAULT 'PENDENTE',
    "estadoEntrega" TEXT NOT NULL DEFAULT 'PENDENTE',
    "subtotalEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "taxaEntregaEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "totalEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoFilho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepasseFinanceiro" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "compraUnificadaId" TEXT,
    "pedidoId" TEXT NOT NULL,
    "valorBrutoEmKwanza" INTEGER NOT NULL,
    "taxaBizyEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "comissaoEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "descontoEmKwanza" INTEGER NOT NULL DEFAULT 0,
    "valorLiquidoEmKwanza" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "conciliadoEm" TIMESTAMP(3),
    "aprovadoEm" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "referenciaPagamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepasseFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReembolsoPedido" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "compraUnificadaId" TEXT,
    "tipo" TEXT NOT NULL,
    "valorEmKwanza" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "itensAfetadosJson" TEXT NOT NULL DEFAULT '[]',
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "aprovadoPorId" TEXT,
    "processadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReembolsoPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstanciaInstagram_ativa_padrao_idx" ON "InstanciaInstagram"("ativa", "padrao");

-- CreateIndex
CREATE INDEX "InstanciaInstagram_negocioId_ativa_padrao_idx" ON "InstanciaInstagram"("negocioId", "ativa", "padrao");

-- CreateIndex
CREATE UNIQUE INDEX "InstanciaInstagram_negocioId_nome_key" ON "InstanciaInstagram"("negocioId", "nome");

-- CreateIndex
CREATE INDEX "SeguidorLoja_negocioId_idx" ON "SeguidorLoja"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "SeguidorLoja_negocioId_identificador_key" ON "SeguidorLoja"("negocioId", "identificador");

-- CreateIndex
CREATE INDEX "DenunciaMarket_estado_idx" ON "DenunciaMarket"("estado");

-- CreateIndex
CREATE INDEX "DenunciaMarket_entidadeTipo_entidadeId_idx" ON "DenunciaMarket"("entidadeTipo", "entidadeId");

-- CreateIndex
CREATE INDEX "DenunciaMarket_negocioAlvoId_idx" ON "DenunciaMarket"("negocioAlvoId");

-- CreateIndex
CREATE INDEX "ReservaStockCheckout_negocioId_pecaId_idx" ON "ReservaStockCheckout"("negocioId", "pecaId");

-- CreateIndex
CREATE INDEX "ReservaStockCheckout_estado_expiraEm_idx" ON "ReservaStockCheckout"("estado", "expiraEm");

-- CreateIndex
CREATE INDEX "ReservaStockCheckout_sessaoId_idx" ON "ReservaStockCheckout"("sessaoId");

-- CreateIndex
CREATE INDEX "CompraUnificada_compradorTelefone_idx" ON "CompraUnificada"("compradorTelefone");

-- CreateIndex
CREATE INDEX "CompraUnificada_estado_idx" ON "CompraUnificada"("estado");

-- CreateIndex
CREATE INDEX "PedidoFilho_compraUnificadaId_idx" ON "PedidoFilho"("compraUnificadaId");

-- CreateIndex
CREATE INDEX "PedidoFilho_negocioId_idx" ON "PedidoFilho"("negocioId");

-- CreateIndex
CREATE INDEX "PedidoFilho_pedidoId_idx" ON "PedidoFilho"("pedidoId");

-- CreateIndex
CREATE INDEX "RepasseFinanceiro_negocioId_idx" ON "RepasseFinanceiro"("negocioId");

-- CreateIndex
CREATE INDEX "RepasseFinanceiro_pedidoId_idx" ON "RepasseFinanceiro"("pedidoId");

-- CreateIndex
CREATE INDEX "RepasseFinanceiro_estado_idx" ON "RepasseFinanceiro"("estado");

-- CreateIndex
CREATE INDEX "RepasseFinanceiro_compraUnificadaId_idx" ON "RepasseFinanceiro"("compraUnificadaId");

-- CreateIndex
CREATE INDEX "ReembolsoPedido_negocioId_idx" ON "ReembolsoPedido"("negocioId");

-- CreateIndex
CREATE INDEX "ReembolsoPedido_pedidoId_idx" ON "ReembolsoPedido"("pedidoId");

-- CreateIndex
CREATE INDEX "ReembolsoPedido_estado_idx" ON "ReembolsoPedido"("estado");

-- CreateIndex
CREATE INDEX "Pedido_negocioId_pagoEm_idx" ON "Pedido"("negocioId", "pagoEm" DESC);

-- AddForeignKey
ALTER TABLE "InstanciaInstagram" ADD CONSTRAINT "InstanciaInstagram_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguidorLoja" ADD CONSTRAINT "SeguidorLoja_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoFilho" ADD CONSTRAINT "PedidoFilho_compraUnificadaId_fkey" FOREIGN KEY ("compraUnificadaId") REFERENCES "CompraUnificada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
