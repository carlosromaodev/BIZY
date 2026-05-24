-- CreateTable
CREATE TABLE "ClienteAtendimento" (
    "id" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "nome" TEXT,
    "username" TEXT,
    "origem" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "consentimento" BOOLEAN NOT NULL DEFAULT true,
    "primeiraInteracaoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaInteracaoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversaAtendimento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "estado" TEXT NOT NULL DEFAULT 'ABERTA',
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "responsavelId" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "ultimaMensagemEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversaAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemAtendimento" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "direcao" TEXT NOT NULL,
    "remetente" TEXT NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "reservaId" TEXT,
    "comentarioId" TEXT,
    "erro" TEXT,
    "contextoJson" TEXT NOT NULL DEFAULT '{}',
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensagemAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClienteAtendimento_telefone_key" ON "ClienteAtendimento"("telefone");

-- CreateIndex
CREATE INDEX "ClienteAtendimento_ultimaInteracaoEm_idx" ON "ClienteAtendimento"("ultimaInteracaoEm");

-- CreateIndex
CREATE UNIQUE INDEX "ConversaAtendimento_telefone_canal_key" ON "ConversaAtendimento"("telefone", "canal");

-- CreateIndex
CREATE INDEX "ConversaAtendimento_estado_ultimaMensagemEm_idx" ON "ConversaAtendimento"("estado", "ultimaMensagemEm");

-- CreateIndex
CREATE INDEX "ConversaAtendimento_clienteId_idx" ON "ConversaAtendimento"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "MensagemAtendimento_providerMessageId_key" ON "MensagemAtendimento"("providerMessageId");

-- CreateIndex
CREATE INDEX "MensagemAtendimento_telefone_enviadaEm_idx" ON "MensagemAtendimento"("telefone", "enviadaEm");

-- CreateIndex
CREATE INDEX "MensagemAtendimento_conversaId_enviadaEm_idx" ON "MensagemAtendimento"("conversaId", "enviadaEm");

-- CreateIndex
CREATE INDEX "MensagemAtendimento_status_atualizadoEm_idx" ON "MensagemAtendimento"("status", "atualizadoEm");

-- CreateIndex
CREATE INDEX "MensagemAtendimento_reservaId_idx" ON "MensagemAtendimento"("reservaId");

-- CreateIndex
CREATE INDEX "MensagemAtendimento_comentarioId_idx" ON "MensagemAtendimento"("comentarioId");

-- AddForeignKey
ALTER TABLE "ConversaAtendimento" ADD CONSTRAINT "ConversaAtendimento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteAtendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemAtendimento" ADD CONSTRAINT "MensagemAtendimento_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaAtendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
