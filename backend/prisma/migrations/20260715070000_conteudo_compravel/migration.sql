-- Fase 7 (expand): conteudo compravel e produtos reais, sem remover campos legados.
-- Rollback: desativar rotas; preservar tabelas enquanto existirem publicacoes ou tracking associado.
CREATE TABLE "ConteudoCommerce" (
  "id" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "parceiroId" TEXT NOT NULL,
  "smartLinkId" TEXT, "slug" TEXT NOT NULL, "tipo" TEXT NOT NULL, "titulo" TEXT NOT NULL,
  "legenda" TEXT, "thumbnailUrl" TEXT, "mediaUrl" TEXT, "divulgacaoComercial" BOOLEAN NOT NULL DEFAULT true,
  "estado" TEXT NOT NULL DEFAULT 'RASCUNHO', "motivoModeracao" TEXT, "metricasJson" TEXT NOT NULL DEFAULT '{}',
  "publicadoEm" TIMESTAMP(3), "aprovadoEm" TIMESTAMP(3), "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL, CONSTRAINT "ConteudoCommerce_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProdutoConteudoCommerce" (
  "id" TEXT NOT NULL, "conteudoId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "pecaId" TEXT NOT NULL,
  "variantePecaId" TEXT, "ordem" INTEGER NOT NULL DEFAULT 0, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProdutoConteudoCommerce_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConteudoCommerce_smartLinkId_key" ON "ConteudoCommerce"("smartLinkId");
CREATE UNIQUE INDEX "ConteudoCommerce_slug_key" ON "ConteudoCommerce"("slug");
CREATE INDEX "ConteudoCommerce_negocioId_estado_criadoEm_idx" ON "ConteudoCommerce"("negocioId", "estado", "criadoEm");
CREATE INDEX "ConteudoCommerce_parceiroId_estado_criadoEm_idx" ON "ConteudoCommerce"("parceiroId", "estado", "criadoEm");
CREATE INDEX "ConteudoCommerce_tipo_publicadoEm_idx" ON "ConteudoCommerce"("tipo", "publicadoEm");
CREATE UNIQUE INDEX "ProdutoConteudoCommerce_conteudoId_pecaId_variantePecaId_key" ON "ProdutoConteudoCommerce"("conteudoId", "pecaId", "variantePecaId");
CREATE INDEX "ProdutoConteudoCommerce_conteudoId_ordem_idx" ON "ProdutoConteudoCommerce"("conteudoId", "ordem");
CREATE INDEX "ProdutoConteudoCommerce_negocioId_pecaId_idx" ON "ProdutoConteudoCommerce"("negocioId", "pecaId");
CREATE INDEX "ProdutoConteudoCommerce_variantePecaId_idx" ON "ProdutoConteudoCommerce"("variantePecaId");
ALTER TABLE "ConteudoCommerce" ADD CONSTRAINT "ConteudoCommerce_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConteudoCommerce" ADD CONSTRAINT "ConteudoCommerce_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConteudoCommerce" ADD CONSTRAINT "ConteudoCommerce_smartLinkId_fkey" FOREIGN KEY ("smartLinkId") REFERENCES "LinkAfiliado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProdutoConteudoCommerce" ADD CONSTRAINT "ProdutoConteudoCommerce_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "ConteudoCommerce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProdutoConteudoCommerce" ADD CONSTRAINT "ProdutoConteudoCommerce_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProdutoConteudoCommerce" ADD CONSTRAINT "ProdutoConteudoCommerce_variantePecaId_fkey" FOREIGN KEY ("variantePecaId") REFERENCES "VariantePeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
