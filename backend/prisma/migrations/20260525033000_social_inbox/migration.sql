-- CreateTable
CREATE TABLE "SocialInboxItem" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NOVO',
    "postId" TEXT,
    "postUrl" TEXT,
    "autorId" TEXT,
    "autorUsername" TEXT,
    "autorNome" TEXT,
    "autorAvatarUrl" TEXT,
    "texto" TEXT NOT NULL,
    "intencao" TEXT NOT NULL DEFAULT 'SEM_INTENCAO',
    "confianca" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clienteTelefone" TEXT,
    "clienteId" TEXT,
    "entidadesJson" TEXT NOT NULL DEFAULT '{}',
    "contextoJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialInboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialInboxItem_negocioId_estado_criadoEm_idx" ON "SocialInboxItem"("negocioId", "estado", "criadoEm");

-- CreateIndex
CREATE INDEX "SocialInboxItem_negocioId_intencao_criadoEm_idx" ON "SocialInboxItem"("negocioId", "intencao", "criadoEm");

-- CreateIndex
CREATE INDEX "SocialInboxItem_negocioId_canal_criadoEm_idx" ON "SocialInboxItem"("negocioId", "canal", "criadoEm");

-- CreateIndex
CREATE INDEX "SocialInboxItem_clienteTelefone_criadoEm_idx" ON "SocialInboxItem"("clienteTelefone", "criadoEm");

-- CreateIndex
CREATE INDEX "SocialInboxItem_autorUsername_criadoEm_idx" ON "SocialInboxItem"("autorUsername", "criadoEm");

-- AddForeignKey
ALTER TABLE "SocialInboxItem" ADD CONSTRAINT "SocialInboxItem_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
