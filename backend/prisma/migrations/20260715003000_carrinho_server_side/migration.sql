-- Expand: adiciona carrinho commerce persistente, itens canonicos e reserva ligada ao item.
-- Impacto: somente novas tabelas, FKs opcionais e indices; checkout legado continua compativel.
-- Backfill: nao necessario; o frontend importa o carrinho local no primeiro acesso.
-- Rollback: desligar as rotas novas; manter dados para auditoria e remover apenas numa contract migration futura.

CREATE TABLE "CarrinhoCommerce" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT,
  "contaBizyId" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'ABERTO',
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "convertidoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CarrinhoCommerce_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemCarrinhoCommerce" (
  "id" TEXT NOT NULL,
  "carrinhoId" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "slugLoja" TEXT NOT NULL,
  "pecaId" TEXT NOT NULL,
  "variantePecaId" TEXT,
  "codigoPeca" TEXT NOT NULL,
  "nomeProduto" TEXT NOT NULL,
  "nomeFornecedor" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "precoUnitarioEmKwanza" INTEGER NOT NULL,
  "fotoUrl" TEXT,
  "urlProduto" TEXT,
  "urlLoja" TEXT,
  "selecaoVarianteJson" TEXT NOT NULL DEFAULT '{}',
  "origem" TEXT NOT NULL DEFAULT 'market',
  "atribuicaoJson" TEXT NOT NULL DEFAULT '{}',
  "chaveItem" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemCarrinhoCommerce_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReservaStockCheckout" ADD COLUMN "carrinhoItemId" TEXT;
ALTER TABLE "CompraUnificada" ADD COLUMN "carrinhoId" TEXT;

CREATE UNIQUE INDEX "CarrinhoCommerce_tokenHash_key" ON "CarrinhoCommerce"("tokenHash");
CREATE INDEX "CarrinhoCommerce_contaBizyId_estado_atualizadoEm_idx" ON "CarrinhoCommerce"("contaBizyId", "estado", "atualizadoEm");
CREATE INDEX "CarrinhoCommerce_estado_expiraEm_idx" ON "CarrinhoCommerce"("estado", "expiraEm");
CREATE UNIQUE INDEX "ItemCarrinhoCommerce_carrinhoId_chaveItem_key" ON "ItemCarrinhoCommerce"("carrinhoId", "chaveItem");
CREATE INDEX "ItemCarrinhoCommerce_carrinhoId_criadoEm_idx" ON "ItemCarrinhoCommerce"("carrinhoId", "criadoEm");
CREATE INDEX "ItemCarrinhoCommerce_negocioId_pecaId_idx" ON "ItemCarrinhoCommerce"("negocioId", "pecaId");
CREATE INDEX "ItemCarrinhoCommerce_variantePecaId_idx" ON "ItemCarrinhoCommerce"("variantePecaId");
CREATE UNIQUE INDEX "ReservaStockCheckout_carrinhoItemId_key" ON "ReservaStockCheckout"("carrinhoItemId");
CREATE UNIQUE INDEX "CompraUnificada_carrinhoId_key" ON "CompraUnificada"("carrinhoId");

ALTER TABLE "CarrinhoCommerce" ADD CONSTRAINT "CarrinhoCommerce_contaBizyId_fkey" FOREIGN KEY ("contaBizyId") REFERENCES "ContaBizy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ItemCarrinhoCommerce" ADD CONSTRAINT "ItemCarrinhoCommerce_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "CarrinhoCommerce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemCarrinhoCommerce" ADD CONSTRAINT "ItemCarrinhoCommerce_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemCarrinhoCommerce" ADD CONSTRAINT "ItemCarrinhoCommerce_variantePecaId_fkey" FOREIGN KEY ("variantePecaId") REFERENCES "VariantePeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReservaStockCheckout" ADD CONSTRAINT "ReservaStockCheckout_carrinhoItemId_fkey" FOREIGN KEY ("carrinhoItemId") REFERENCES "ItemCarrinhoCommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompraUnificada" ADD CONSTRAINT "CompraUnificada_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "CarrinhoCommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;
