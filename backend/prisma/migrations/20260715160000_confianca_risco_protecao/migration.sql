-- Fase 10: confianca, risco e proteccao do comprador.
-- Expand-only. Rollback: desativar o modulo; preservar avaliacoes e casos para auditoria.
CREATE TABLE "AvaliacaoVerificadaCommerce" (
  "id" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "contaBizyId" TEXT NOT NULL, "compraId" TEXT NOT NULL,
  "pedidoId" TEXT NOT NULL, "pecaId" TEXT, "notaProduto" INTEGER NOT NULL, "notaEntrega" INTEGER NOT NULL,
  "notaSeller" INTEGER NOT NULL, "titulo" TEXT, "comentario" TEXT, "compraVerificada" BOOLEAN NOT NULL DEFAULT true,
  "estado" TEXT NOT NULL DEFAULT 'PUBLICADA', "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL, CONSTRAINT "AvaliacaoVerificadaCommerce_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvaliacaoVerificadaCommerce_notas_check" CHECK ("notaProduto" BETWEEN 1 AND 5 AND "notaEntrega" BETWEEN 1 AND 5 AND "notaSeller" BETWEEN 1 AND 5)
);
CREATE TABLE "ScoreConfiancaCommerce" (
  "id" TEXT NOT NULL, "negocioId" TEXT, "sujeitoTipo" TEXT NOT NULL, "sujeitoId" TEXT NOT NULL, "score" INTEGER NOT NULL,
  "versao" TEXT NOT NULL, "componentesJson" TEXT NOT NULL DEFAULT '{}', "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreConfiancaCommerce_pkey" PRIMARY KEY ("id"), CONSTRAINT "ScoreConfiancaCommerce_score_check" CHECK ("score" BETWEEN 0 AND 100)
);
CREATE TABLE "CasoRiscoCommerce" (
  "id" TEXT NOT NULL, "negocioId" TEXT, "contaBizyId" TEXT, "parceiroId" TEXT, "pedidoId" TEXT, "payoutId" TEXT,
  "tipo" TEXT NOT NULL, "severidade" TEXT NOT NULL, "scoreRisco" INTEGER NOT NULL, "sinaisJson" TEXT NOT NULL DEFAULT '[]',
  "evidenciasJson" TEXT NOT NULL DEFAULT '[]', "estado" TEXT NOT NULL DEFAULT 'REVISAO_HUMANA', "decisao" TEXT,
  "responsavelId" TEXT, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasoRiscoCommerce_pkey" PRIMARY KEY ("id"), CONSTRAINT "CasoRiscoCommerce_score_check" CHECK ("scoreRisco" BETWEEN 0 AND 100)
);
CREATE TABLE "CasoProtecaoComprador" (
  "id" TEXT NOT NULL, "contaBizyId" TEXT NOT NULL, "compraId" TEXT NOT NULL, "pedidoId" TEXT, "negocioId" TEXT,
  "tipo" TEXT NOT NULL, "descricao" TEXT NOT NULL, "evidenciasJson" TEXT NOT NULL DEFAULT '[]', "estado" TEXT NOT NULL DEFAULT 'ABERTO',
  "resolucao" TEXT, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CasoProtecaoComprador_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AvaliacaoVerificadaCommerce_contaBizyId_pedidoId_pecaId_key" ON "AvaliacaoVerificadaCommerce"("contaBizyId","pedidoId","pecaId");
CREATE INDEX "AvaliacaoVerificadaCommerce_negocioId_estado_criadoEm_idx" ON "AvaliacaoVerificadaCommerce"("negocioId","estado","criadoEm");
CREATE INDEX "AvaliacaoVerificadaCommerce_pecaId_estado_criadoEm_idx" ON "AvaliacaoVerificadaCommerce"("pecaId","estado","criadoEm");
CREATE UNIQUE INDEX "ScoreConfiancaCommerce_sujeitoTipo_sujeitoId_versao_key" ON "ScoreConfiancaCommerce"("sujeitoTipo","sujeitoId","versao");
CREATE INDEX "ScoreConfiancaCommerce_negocioId_sujeitoTipo_score_idx" ON "ScoreConfiancaCommerce"("negocioId","sujeitoTipo","score");
CREATE INDEX "CasoRiscoCommerce_negocioId_estado_severidade_idx" ON "CasoRiscoCommerce"("negocioId","estado","severidade");
CREATE INDEX "CasoRiscoCommerce_contaBizyId_criadoEm_idx" ON "CasoRiscoCommerce"("contaBizyId","criadoEm");
CREATE INDEX "CasoRiscoCommerce_parceiroId_criadoEm_idx" ON "CasoRiscoCommerce"("parceiroId","criadoEm");
CREATE INDEX "CasoRiscoCommerce_pedidoId_idx" ON "CasoRiscoCommerce"("pedidoId");
CREATE INDEX "CasoRiscoCommerce_payoutId_idx" ON "CasoRiscoCommerce"("payoutId");
CREATE INDEX "CasoProtecaoComprador_contaBizyId_estado_criadoEm_idx" ON "CasoProtecaoComprador"("contaBizyId","estado","criadoEm");
CREATE INDEX "CasoProtecaoComprador_negocioId_estado_criadoEm_idx" ON "CasoProtecaoComprador"("negocioId","estado","criadoEm");
CREATE INDEX "CasoProtecaoComprador_compraId_idx" ON "CasoProtecaoComprador"("compraId");
