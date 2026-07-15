-- Fase 8 (expand): Creator Marketplace ligado a produtos e parceiros reais.
-- Impacto: novas tabelas e indices; nenhuma leitura ou coluna legada e removida.
-- Rollback: desativar as rotas e preservar os registos; remover apenas numa contract migration sem candidaturas activas.
CREATE TABLE "OfertaCreator" (
  "id" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "codigo" TEXT NOT NULL, "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL, "estado" TEXT NOT NULL DEFAULT 'RASCUNHO', "comissaoTipo" TEXT NOT NULL,
  "comissaoValor" INTEGER NOT NULL, "moeda" TEXT NOT NULL DEFAULT 'AOA', "criteriosJson" TEXT NOT NULL DEFAULT '{}',
  "regrasJson" TEXT NOT NULL DEFAULT '{}', "bonusJson" TEXT NOT NULL DEFAULT '{}', "stockAmostras" INTEGER NOT NULL DEFAULT 0,
  "iniciaEm" TIMESTAMP(3), "terminaEm" TIMESTAMP(3), "publicadaEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OfertaCreator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProdutoOfertaCreator" (
  "id" TEXT NOT NULL, "ofertaId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "pecaId" TEXT NOT NULL,
  "variantePecaId" TEXT, "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProdutoOfertaCreator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CandidaturaCreator" (
  "id" TEXT NOT NULL, "ofertaId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "parceiroId" TEXT NOT NULL, "parceiroNegocioOrigemId" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'PENDENTE', "mensagem" TEXT, "motivoDecisao" TEXT, "decididaEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidaturaCreator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AmostraCreator" (
  "id" TEXT NOT NULL, "candidaturaId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "parceiroId" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'SOLICITADA', "observacao" TEXT, "trackingEnvio" TEXT,
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadaEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmostraCreator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MissaoCreator" (
  "id" TEXT NOT NULL, "ofertaId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL, "criteriosJson" TEXT NOT NULL DEFAULT '{}', "bonusEmKwanza" INTEGER NOT NULL DEFAULT 0,
  "iniciaEm" TIMESTAMP(3), "terminaEm" TIMESTAMP(3), "estado" TEXT NOT NULL DEFAULT 'ATIVA',
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadaEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MissaoCreator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ParticipacaoMissaoCreator" (
  "id" TEXT NOT NULL, "missaoId" TEXT NOT NULL, "candidaturaId" TEXT NOT NULL, "parceiroId" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'ACEITE', "progressoJson" TEXT NOT NULL DEFAULT '{}',
  "aceiteEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "concluidaEm" TIMESTAMP(3),
  CONSTRAINT "ParticipacaoMissaoCreator_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OfertaCreator_negocioId_codigo_key" ON "OfertaCreator"("negocioId", "codigo");
CREATE INDEX "OfertaCreator_estado_iniciaEm_terminaEm_idx" ON "OfertaCreator"("estado", "iniciaEm", "terminaEm");
CREATE INDEX "OfertaCreator_negocioId_estado_criadoEm_idx" ON "OfertaCreator"("negocioId", "estado", "criadoEm");
CREATE UNIQUE INDEX "ProdutoOfertaCreator_ofertaId_pecaId_variantePecaId_key" ON "ProdutoOfertaCreator"("ofertaId", "pecaId", "variantePecaId");
CREATE INDEX "ProdutoOfertaCreator_negocioId_pecaId_idx" ON "ProdutoOfertaCreator"("negocioId", "pecaId");
CREATE UNIQUE INDEX "CandidaturaCreator_ofertaId_parceiroId_key" ON "CandidaturaCreator"("ofertaId", "parceiroId");
CREATE INDEX "CandidaturaCreator_negocioId_estado_criadoEm_idx" ON "CandidaturaCreator"("negocioId", "estado", "criadoEm");
CREATE INDEX "CandidaturaCreator_parceiroId_estado_criadoEm_idx" ON "CandidaturaCreator"("parceiroId", "estado", "criadoEm");
CREATE INDEX "CandidaturaCreator_parceiroNegocioOrigemId_idx" ON "CandidaturaCreator"("parceiroNegocioOrigemId");
CREATE UNIQUE INDEX "AmostraCreator_candidaturaId_key" ON "AmostraCreator"("candidaturaId");
CREATE INDEX "AmostraCreator_negocioId_estado_criadaEm_idx" ON "AmostraCreator"("negocioId", "estado", "criadaEm");
CREATE INDEX "AmostraCreator_parceiroId_estado_idx" ON "AmostraCreator"("parceiroId", "estado");
CREATE INDEX "MissaoCreator_negocioId_estado_terminaEm_idx" ON "MissaoCreator"("negocioId", "estado", "terminaEm");
CREATE INDEX "MissaoCreator_ofertaId_estado_idx" ON "MissaoCreator"("ofertaId", "estado");
CREATE UNIQUE INDEX "ParticipacaoMissaoCreator_missaoId_parceiroId_key" ON "ParticipacaoMissaoCreator"("missaoId", "parceiroId");
CREATE INDEX "ParticipacaoMissaoCreator_parceiroId_estado_idx" ON "ParticipacaoMissaoCreator"("parceiroId", "estado");
CREATE INDEX "ParticipacaoMissaoCreator_candidaturaId_idx" ON "ParticipacaoMissaoCreator"("candidaturaId");
ALTER TABLE "OfertaCreator" ADD CONSTRAINT "OfertaCreator_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProdutoOfertaCreator" ADD CONSTRAINT "ProdutoOfertaCreator_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProdutoOfertaCreator" ADD CONSTRAINT "ProdutoOfertaCreator_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProdutoOfertaCreator" ADD CONSTRAINT "ProdutoOfertaCreator_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProdutoOfertaCreator" ADD CONSTRAINT "ProdutoOfertaCreator_variantePecaId_fkey" FOREIGN KEY ("variantePecaId") REFERENCES "VariantePeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidaturaCreator" ADD CONSTRAINT "CandidaturaCreator_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidaturaCreator" ADD CONSTRAINT "CandidaturaCreator_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CandidaturaCreator" ADD CONSTRAINT "CandidaturaCreator_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmostraCreator" ADD CONSTRAINT "AmostraCreator_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "CandidaturaCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AmostraCreator" ADD CONSTRAINT "AmostraCreator_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmostraCreator" ADD CONSTRAINT "AmostraCreator_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MissaoCreator" ADD CONSTRAINT "MissaoCreator_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissaoCreator" ADD CONSTRAINT "MissaoCreator_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ParticipacaoMissaoCreator" ADD CONSTRAINT "ParticipacaoMissaoCreator_missaoId_fkey" FOREIGN KEY ("missaoId") REFERENCES "MissaoCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipacaoMissaoCreator" ADD CONSTRAINT "ParticipacaoMissaoCreator_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "CandidaturaCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipacaoMissaoCreator" ADD CONSTRAINT "ParticipacaoMissaoCreator_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
