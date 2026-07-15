-- Fase 5 - Atribuicao comercial versionada e explicavel (expand only).
-- Impacto: adiciona politicas imutaveis, conversoes e participantes auditaveis.
-- Backfill: nao necessario; atribuicoes legadas continuam legiveis durante dual read.
-- Rollback: desligar o use case novo e remover tabelas na ordem participante, conversao, politica.
-- Compatibilidade: nenhuma coluna ou regra financeira existente e alterada.

CREATE TABLE "PoliticaAtribuicaoCommerce" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "janelaDias" INTEGER NOT NULL,
    "pesoPrincipalBasisPoints" INTEGER NOT NULL DEFAULT 7000,
    "regrasJson" TEXT NOT NULL DEFAULT '{}',
    "ativaDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desativadaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoliticaAtribuicaoCommerce_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversaoAtribuicaoCommerce" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sessaoId" TEXT,
    "contaBizyId" TEXT,
    "compraUnificadaId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ORDER_CREATED',
    "politicaId" TEXT NOT NULL,
    "politicaCodigo" TEXT NOT NULL,
    "politicaVersao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "janelaDias" INTEGER NOT NULL,
    "valorBaseEmKwanza" INTEGER NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "explicacaoJson" TEXT NOT NULL DEFAULT '{}',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversaoAtribuicaoCommerce_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipanteConversaoCommerce" (
    "id" TEXT NOT NULL,
    "conversaoId" TEXT NOT NULL,
    "toqueId" TEXT,
    "parceiroId" TEXT,
    "linkId" TEXT,
    "papel" TEXT NOT NULL,
    "pesoBasisPoints" INTEGER NOT NULL,
    "valorAtribuidoEmKwanza" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipanteConversaoCommerce_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PoliticaAtribuicaoCommerce_negocioId_codigo_versao_key" ON "PoliticaAtribuicaoCommerce"("negocioId", "codigo", "versao");
CREATE INDEX "PoliticaAtribuicaoCommerce_negocioId_codigo_ativaDesde_idx" ON "PoliticaAtribuicaoCommerce"("negocioId", "codigo", "ativaDesde");
CREATE INDEX "PoliticaAtribuicaoCommerce_negocioId_desativadaEm_idx" ON "PoliticaAtribuicaoCommerce"("negocioId", "desativadaEm");

CREATE UNIQUE INDEX "ConversaoAtribuicaoCommerce_negocioId_pedidoId_tipo_key" ON "ConversaoAtribuicaoCommerce"("negocioId", "pedidoId", "tipo");
CREATE INDEX "ConversaoAtribuicaoCommerce_compraUnificadaId_criadaEm_idx" ON "ConversaoAtribuicaoCommerce"("compraUnificadaId", "criadaEm");
CREATE INDEX "ConversaoAtribuicaoCommerce_sessaoId_criadaEm_idx" ON "ConversaoAtribuicaoCommerce"("sessaoId", "criadaEm");
CREATE INDEX "ConversaoAtribuicaoCommerce_contaBizyId_criadaEm_idx" ON "ConversaoAtribuicaoCommerce"("contaBizyId", "criadaEm");
CREATE INDEX "ConversaoAtribuicaoCommerce_politicaId_criadaEm_idx" ON "ConversaoAtribuicaoCommerce"("politicaId", "criadaEm");

CREATE UNIQUE INDEX "ParticipanteConversaoCommerce_conversaoId_papel_toqueId_key" ON "ParticipanteConversaoCommerce"("conversaoId", "papel", "toqueId");
CREATE INDEX "ParticipanteConversaoCommerce_parceiroId_criadoEm_idx" ON "ParticipanteConversaoCommerce"("parceiroId", "criadoEm");
CREATE INDEX "ParticipanteConversaoCommerce_linkId_criadoEm_idx" ON "ParticipanteConversaoCommerce"("linkId", "criadoEm");
CREATE INDEX "ParticipanteConversaoCommerce_toqueId_idx" ON "ParticipanteConversaoCommerce"("toqueId");

ALTER TABLE "PoliticaAtribuicaoCommerce" ADD CONSTRAINT "PoliticaAtribuicaoCommerce_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversaoAtribuicaoCommerce" ADD CONSTRAINT "ConversaoAtribuicaoCommerce_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversaoAtribuicaoCommerce" ADD CONSTRAINT "ConversaoAtribuicaoCommerce_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoCommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversaoAtribuicaoCommerce" ADD CONSTRAINT "ConversaoAtribuicaoCommerce_contaBizyId_fkey" FOREIGN KEY ("contaBizyId") REFERENCES "ContaBizy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversaoAtribuicaoCommerce" ADD CONSTRAINT "ConversaoAtribuicaoCommerce_compraUnificadaId_fkey" FOREIGN KEY ("compraUnificadaId") REFERENCES "CompraUnificada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversaoAtribuicaoCommerce" ADD CONSTRAINT "ConversaoAtribuicaoCommerce_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversaoAtribuicaoCommerce" ADD CONSTRAINT "ConversaoAtribuicaoCommerce_politicaId_fkey" FOREIGN KEY ("politicaId") REFERENCES "PoliticaAtribuicaoCommerce"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ParticipanteConversaoCommerce" ADD CONSTRAINT "ParticipanteConversaoCommerce_conversaoId_fkey" FOREIGN KEY ("conversaoId") REFERENCES "ConversaoAtribuicaoCommerce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipanteConversaoCommerce" ADD CONSTRAINT "ParticipanteConversaoCommerce_toqueId_fkey" FOREIGN KEY ("toqueId") REFERENCES "ToqueAtribuicaoCommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParticipanteConversaoCommerce" ADD CONSTRAINT "ParticipanteConversaoCommerce_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "ParceiroComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParticipanteConversaoCommerce" ADD CONSTRAINT "ParticipanteConversaoCommerce_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "LinkAfiliado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
