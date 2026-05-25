CREATE TABLE "PlaybookRecuperacao" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "gatilho" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "atrasoMinutos" INTEGER NOT NULL DEFAULT 0,
  "condicoesJson" TEXT NOT NULL DEFAULT '{}',
  "acao" TEXT NOT NULL DEFAULT 'CRIAR_TAREFA',
  "tituloTarefa" TEXT,
  "descricaoTarefa" TEXT,
  "prioridadeTarefa" TEXT NOT NULL DEFAULT 'NORMAL',
  "responsavelId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlaybookRecuperacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecucaoPlaybookRecuperacao" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "playbookId" TEXT NOT NULL,
  "gatilho" TEXT NOT NULL,
  "entidadeTipo" TEXT,
  "entidadeId" TEXT,
  "clienteTelefone" TEXT,
  "estado" TEXT NOT NULL,
  "tarefaId" TEXT,
  "motivo" TEXT,
  "contextoJson" TEXT NOT NULL DEFAULT '{}',
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExecucaoPlaybookRecuperacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlaybookRecuperacao_negocioId_gatilho_ativo_idx"
  ON "PlaybookRecuperacao"("negocioId", "gatilho", "ativo");

CREATE INDEX "PlaybookRecuperacao_negocioId_criadoEm_idx"
  ON "PlaybookRecuperacao"("negocioId", "criadoEm");

CREATE INDEX "ExecucaoPlaybookRecuperacao_negocioId_gatilho_criadaEm_idx"
  ON "ExecucaoPlaybookRecuperacao"("negocioId", "gatilho", "criadaEm");

CREATE INDEX "ExecucaoPlaybookRecuperacao_negocioId_estado_criadaEm_idx"
  ON "ExecucaoPlaybookRecuperacao"("negocioId", "estado", "criadaEm");

CREATE INDEX "ExecucaoPlaybookRecuperacao_playbookId_criadaEm_idx"
  ON "ExecucaoPlaybookRecuperacao"("playbookId", "criadaEm");

CREATE INDEX "ExecucaoPlaybookRecuperacao_entidadeTipo_entidadeId_idx"
  ON "ExecucaoPlaybookRecuperacao"("entidadeTipo", "entidadeId");

CREATE INDEX "ExecucaoPlaybookRecuperacao_clienteTelefone_criadaEm_idx"
  ON "ExecucaoPlaybookRecuperacao"("clienteTelefone", "criadaEm");

ALTER TABLE "PlaybookRecuperacao"
  ADD CONSTRAINT "PlaybookRecuperacao_negocioId_fkey"
  FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExecucaoPlaybookRecuperacao"
  ADD CONSTRAINT "ExecucaoPlaybookRecuperacao_negocioId_fkey"
  FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExecucaoPlaybookRecuperacao"
  ADD CONSTRAINT "ExecucaoPlaybookRecuperacao_playbookId_fkey"
  FOREIGN KEY ("playbookId") REFERENCES "PlaybookRecuperacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
