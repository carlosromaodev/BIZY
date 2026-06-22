-- CreateTable
CREATE TABLE "PersonaPapel" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "papelBase" TEXT NOT NULL,
    "permissoesJson" TEXT NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonaPapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteEquipa" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "nomeConvidado" TEXT,
    "papelSugerido" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "personaId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoPorId" TEXT NOT NULL,
    "aceitePorId" TEXT,
    "aceiteEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "reenviadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConviteEquipa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaInterna" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "entidadeTipo" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "mencoesJson" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaInterna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedActividade" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "autorId" TEXT,
    "tipo" TEXT NOT NULL,
    "entidadeTipo" TEXT,
    "entidadeId" TEXT,
    "resumo" TEXT NOT NULL,
    "detalhesJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedActividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistOnboarding" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "descricao" TEXT,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MascaramentoDados" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PARCIAL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MascaramentoDados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoGamificacao" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "kpiPrincipal" TEXT NOT NULL DEFAULT 'VENDAS_VALOR',
    "periodo" TEXT NOT NULL DEFAULT 'MENSAL',
    "recompensa" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoGamificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingEquipa" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingEquipa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonaPapel_negocioId_ativo_idx" ON "PersonaPapel"("negocioId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "PersonaPapel_negocioId_nome_key" ON "PersonaPapel"("negocioId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteEquipa_token_key" ON "ConviteEquipa"("token");

-- CreateIndex
CREATE INDEX "ConviteEquipa_negocioId_estado_idx" ON "ConviteEquipa"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "ConviteEquipa_telefone_idx" ON "ConviteEquipa"("telefone");

-- CreateIndex
CREATE INDEX "ConviteEquipa_email_idx" ON "ConviteEquipa"("email");

-- CreateIndex
CREATE INDEX "ConviteEquipa_token_idx" ON "ConviteEquipa"("token");

-- CreateIndex
CREATE INDEX "NotaInterna_negocioId_entidadeTipo_entidadeId_criadoEm_idx" ON "NotaInterna"("negocioId", "entidadeTipo", "entidadeId", "criadoEm");

-- CreateIndex
CREATE INDEX "NotaInterna_autorId_idx" ON "NotaInterna"("autorId");

-- CreateIndex
CREATE INDEX "FeedActividade_negocioId_criadoEm_idx" ON "FeedActividade"("negocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "FeedActividade_negocioId_tipo_criadoEm_idx" ON "FeedActividade"("negocioId", "tipo", "criadoEm");

-- CreateIndex
CREATE INDEX "FeedActividade_negocioId_entidadeTipo_entidadeId_criadoEm_idx" ON "FeedActividade"("negocioId", "entidadeTipo", "entidadeId", "criadoEm");

-- CreateIndex
CREATE INDEX "FeedActividade_autorId_idx" ON "FeedActividade"("autorId");

-- CreateIndex
CREATE INDEX "ChecklistOnboarding_negocioId_membroId_idx" ON "ChecklistOnboarding"("negocioId", "membroId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistOnboarding_membroId_item_key" ON "ChecklistOnboarding"("membroId", "item");

-- CreateIndex
CREATE INDEX "MascaramentoDados_negocioId_idx" ON "MascaramentoDados"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "MascaramentoDados_negocioId_papel_campo_key" ON "MascaramentoDados"("negocioId", "papel", "campo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoGamificacao_negocioId_key" ON "ConfiguracaoGamificacao"("negocioId");

-- CreateIndex
CREATE INDEX "RankingEquipa_negocioId_periodo_kpi_criadoEm_idx" ON "RankingEquipa"("negocioId", "periodo", "kpi", "criadoEm");

-- CreateIndex
CREATE INDEX "RankingEquipa_membroId_criadoEm_idx" ON "RankingEquipa"("membroId", "criadoEm");

-- AddForeignKey
ALTER TABLE "PersonaPapel" ADD CONSTRAINT "PersonaPapel_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteEquipa" ADD CONSTRAINT "ConviteEquipa_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteEquipa" ADD CONSTRAINT "ConviteEquipa_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaInterna" ADD CONSTRAINT "NotaInterna_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaInterna" ADD CONSTRAINT "NotaInterna_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActividade" ADD CONSTRAINT "FeedActividade_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActividade" ADD CONSTRAINT "FeedActividade_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistOnboarding" ADD CONSTRAINT "ChecklistOnboarding_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistOnboarding" ADD CONSTRAINT "ChecklistOnboarding_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MascaramentoDados" ADD CONSTRAINT "MascaramentoDados_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoGamificacao" ADD CONSTRAINT "ConfiguracaoGamificacao_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEquipa" ADD CONSTRAINT "RankingEquipa_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEquipa" ADD CONSTRAINT "RankingEquipa_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
