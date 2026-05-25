CREATE TABLE "ParceiroComercial" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nomePublico" TEXT NOT NULL,
    "contacto" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ATIVO',
    "regraComissaoJson" TEXT NOT NULL DEFAULT '{}',
    "metodoPagamentoJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParceiroComercial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LinkAfiliado" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "destinoTipo" TEXT NOT NULL,
    "slugLoja" TEXT,
    "codigoProduto" TEXT,
    "canal" TEXT,
    "origemConteudo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkAfiliado_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComissaoParceiro" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "linkId" TEXT,
    "pedidoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ESTIMADA',
    "baseEmKwanza" INTEGER NOT NULL,
    "valorEmKwanza" INTEGER NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmadoEm" TIMESTAMP(3),
    "revertidoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComissaoParceiro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParceiroComercial_negocioId_codigo_key" ON "ParceiroComercial"("negocioId", "codigo");
CREATE INDEX "ParceiroComercial_negocioId_estado_idx" ON "ParceiroComercial"("negocioId", "estado");
CREATE INDEX "ParceiroComercial_tipo_estado_idx" ON "ParceiroComercial"("tipo", "estado");

CREATE UNIQUE INDEX "LinkAfiliado_codigo_key" ON "LinkAfiliado"("codigo");
CREATE INDEX "LinkAfiliado_negocioId_afiliadoId_idx" ON "LinkAfiliado"("negocioId", "afiliadoId");
CREATE INDEX "LinkAfiliado_negocioId_ativo_idx" ON "LinkAfiliado"("negocioId", "ativo");
CREATE INDEX "LinkAfiliado_slugLoja_codigoProduto_idx" ON "LinkAfiliado"("slugLoja", "codigoProduto");

CREATE UNIQUE INDEX "ComissaoParceiro_negocioId_pedidoId_key" ON "ComissaoParceiro"("negocioId", "pedidoId");
CREATE INDEX "ComissaoParceiro_negocioId_status_idx" ON "ComissaoParceiro"("negocioId", "status");
CREATE INDEX "ComissaoParceiro_afiliadoId_status_idx" ON "ComissaoParceiro"("afiliadoId", "status");
CREATE INDEX "ComissaoParceiro_linkId_idx" ON "ComissaoParceiro"("linkId");

ALTER TABLE "ParceiroComercial" ADD CONSTRAINT "ParceiroComercial_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LinkAfiliado" ADD CONSTRAINT "LinkAfiliado_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LinkAfiliado" ADD CONSTRAINT "LinkAfiliado_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComissaoParceiro" ADD CONSTRAINT "ComissaoParceiro_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComissaoParceiro" ADD CONSTRAINT "ComissaoParceiro_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComissaoParceiro" ADD CONSTRAINT "ComissaoParceiro_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "LinkAfiliado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComissaoParceiro" ADD CONSTRAINT "ComissaoParceiro_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
