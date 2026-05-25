-- CreateTable
CREATE TABLE "TarefaOperacional" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "estado" TEXT NOT NULL DEFAULT 'ABERTA',
    "origem" TEXT,
    "entidadeTipo" TEXT,
    "entidadeId" TEXT,
    "clienteTelefone" TEXT,
    "responsavelId" TEXT,
    "prazoEm" TIMESTAMP(3),
    "contextoJson" TEXT NOT NULL DEFAULT '{}',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarefaOperacional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TarefaOperacional_negocioId_estado_criadaEm_idx" ON "TarefaOperacional"("negocioId", "estado", "criadaEm");

-- CreateIndex
CREATE INDEX "TarefaOperacional_negocioId_tipo_criadaEm_idx" ON "TarefaOperacional"("negocioId", "tipo", "criadaEm");

-- CreateIndex
CREATE INDEX "TarefaOperacional_negocioId_prioridade_prazoEm_idx" ON "TarefaOperacional"("negocioId", "prioridade", "prazoEm");

-- CreateIndex
CREATE INDEX "TarefaOperacional_clienteTelefone_criadaEm_idx" ON "TarefaOperacional"("clienteTelefone", "criadaEm");

-- AddForeignKey
ALTER TABLE "TarefaOperacional" ADD CONSTRAINT "TarefaOperacional_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
