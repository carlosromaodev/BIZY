-- Fase 11: carrinhos partilhaveis e destaque de produto em live.
-- Expand-only; rollback desativa as rotas e preserva snapshots para auditoria.
CREATE TABLE "CarrinhoPartilhavel" (
  "id" TEXT NOT NULL, "codigo" TEXT NOT NULL, "criadoPorTipo" TEXT NOT NULL, "contaBizyId" TEXT, "parceiroId" TEXT,
  "negocioId" TEXT, "campanhaId" TEXT, "liveId" TEXT, "titulo" TEXT NOT NULL, "descricao" TEXT, "itensJson" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'ATIVO', "expiraEm" TIMESTAMP(3), "visualizacoes" INTEGER NOT NULL DEFAULT 0,
  "importacoes" INTEGER NOT NULL DEFAULT 0, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL, CONSTRAINT "CarrinhoPartilhavel_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DestaqueProdutoLiveCommerce" (
  "id" TEXT NOT NULL, "liveId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "pecaId" TEXT NOT NULL, "variantePecaId" TEXT,
  "hostParceiroId" TEXT, "carrinhoPartilhavelId" TEXT, "estado" TEXT NOT NULL DEFAULT 'ATIVO',
  "destacadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "encerradoEm" TIMESTAMP(3),
  CONSTRAINT "DestaqueProdutoLiveCommerce_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CarrinhoPartilhavel_codigo_key" ON "CarrinhoPartilhavel"("codigo");
CREATE INDEX "CarrinhoPartilhavel_contaBizyId_estado_criadoEm_idx" ON "CarrinhoPartilhavel"("contaBizyId","estado","criadoEm");
CREATE INDEX "CarrinhoPartilhavel_parceiroId_estado_criadoEm_idx" ON "CarrinhoPartilhavel"("parceiroId","estado","criadoEm");
CREATE INDEX "CarrinhoPartilhavel_negocioId_estado_criadoEm_idx" ON "CarrinhoPartilhavel"("negocioId","estado","criadoEm");
CREATE INDEX "CarrinhoPartilhavel_liveId_estado_idx" ON "CarrinhoPartilhavel"("liveId","estado");
CREATE INDEX "DestaqueProdutoLiveCommerce_liveId_estado_destacadoEm_idx" ON "DestaqueProdutoLiveCommerce"("liveId","estado","destacadoEm");
CREATE INDEX "DestaqueProdutoLiveCommerce_negocioId_estado_idx" ON "DestaqueProdutoLiveCommerce"("negocioId","estado");
CREATE INDEX "DestaqueProdutoLiveCommerce_hostParceiroId_destacadoEm_idx" ON "DestaqueProdutoLiveCommerce"("hostParceiroId","destacadoEm");
