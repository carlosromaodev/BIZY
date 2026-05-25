CREATE TABLE "OportunidadeRecuperacao" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "gatilho" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'ABERTA',
  "entidadeTipo" TEXT,
  "entidadeId" TEXT,
  "clienteTelefone" TEXT,
  "playbookId" TEXT,
  "execucaoPlaybookId" TEXT,
  "tarefaId" TEXT,
  "movimentoFunilId" TEXT,
  "valorEstimadoEmKwanza" INTEGER,
  "motivo" TEXT NOT NULL,
  "responsavelId" TEXT,
  "observacao" TEXT,
  "contextoJson" TEXT NOT NULL DEFAULT '{}',
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "encerradaEm" TIMESTAMP(3),

  CONSTRAINT "OportunidadeRecuperacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OportunidadeRecuperacao_negocioId_estado_criadaEm_idx"
  ON "OportunidadeRecuperacao"("negocioId", "estado", "criadaEm");

CREATE INDEX "OportunidadeRecuperacao_negocioId_gatilho_criadaEm_idx"
  ON "OportunidadeRecuperacao"("negocioId", "gatilho", "criadaEm");

CREATE INDEX "OportunidadeRecuperacao_negocioId_entidadeTipo_entidadeId_idx"
  ON "OportunidadeRecuperacao"("negocioId", "entidadeTipo", "entidadeId");

CREATE INDEX "OportunidadeRecuperacao_clienteTelefone_criadaEm_idx"
  ON "OportunidadeRecuperacao"("clienteTelefone", "criadaEm");

CREATE INDEX "OportunidadeRecuperacao_tarefaId_idx"
  ON "OportunidadeRecuperacao"("tarefaId");

CREATE INDEX "OportunidadeRecuperacao_movimentoFunilId_idx"
  ON "OportunidadeRecuperacao"("movimentoFunilId");

ALTER TABLE "OportunidadeRecuperacao"
  ADD CONSTRAINT "OportunidadeRecuperacao_negocioId_fkey"
  FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
