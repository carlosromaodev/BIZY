-- Anani internal control plane foundation.
-- The Anani tables are platform/internal state, not tenant-facing product tables.

CREATE TABLE IF NOT EXISTS "EventOutbox" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "sistema" TEXT NOT NULL,
    "contexto" TEXT NOT NULL,
    "negocioId" TEXT,
    "actorId" TEXT,
    "aggregateType" TEXT,
    "aggregateId" TEXT,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "correlationId" TEXT,
    "causationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),

    CONSTRAINT "EventOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventOutbox_status_criadoEm_idx" ON "EventOutbox"("status", "criadoEm");
CREATE INDEX IF NOT EXISTS "EventOutbox_negocioId_idx" ON "EventOutbox"("negocioId");
CREATE INDEX IF NOT EXISTS "EventOutbox_sistema_tipo_idx" ON "EventOutbox"("sistema", "tipo");
CREATE INDEX IF NOT EXISTS "EventOutbox_correlationId_idx" ON "EventOutbox"("correlationId");

CREATE TABLE IF NOT EXISTS "AnaniTenantRiskSnapshot" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sistema" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sinais" JSONB NOT NULL DEFAULT '[]',
    "recomendacoes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnaniTenantRiskSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnaniTenantRiskSnapshot_negocioId_sistema_idx"
  ON "AnaniTenantRiskSnapshot"("negocioId", "sistema");
CREATE INDEX IF NOT EXISTS "AnaniTenantRiskSnapshot_negocioId_criadoEm_idx"
  ON "AnaniTenantRiskSnapshot"("negocioId", "criadoEm");

CREATE TABLE IF NOT EXISTS "AnaniQuarantine" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "sistema" TEXT NOT NULL,
    "negocioId" TEXT,
    "entidadeTipo" TEXT,
    "entidadeId" TEXT,
    "severidade" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "evidencias" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "acaoTomada" JSONB,
    "criadoPor" TEXT NOT NULL DEFAULT 'ANANI',
    "revistoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revistoEm" TIMESTAMP(3),

    CONSTRAINT "AnaniQuarantine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnaniQuarantine_negocioId_idx" ON "AnaniQuarantine"("negocioId");
CREATE INDEX IF NOT EXISTS "AnaniQuarantine_status_severidade_idx" ON "AnaniQuarantine"("status", "severidade");
CREATE INDEX IF NOT EXISTS "AnaniQuarantine_tipo_status_idx" ON "AnaniQuarantine"("tipo", "status");
CREATE INDEX IF NOT EXISTS "AnaniQuarantine_criadoEm_idx" ON "AnaniQuarantine"("criadoEm");

CREATE TABLE IF NOT EXISTS "AnaniIncident" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidade" TEXT NOT NULL,
    "sistema" TEXT NOT NULL,
    "negocioId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resumo" TEXT NOT NULL,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "entidades" JSONB NOT NULL DEFAULT '[]',
    "evidencias" JSONB NOT NULL DEFAULT '[]',
    "decisoes" JSONB NOT NULL DEFAULT '[]',
    "recomendacao" TEXT,
    "relatorioUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" TIMESTAMP(3),

    CONSTRAINT "AnaniIncident_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnaniIncident_negocioId_idx" ON "AnaniIncident"("negocioId");
CREATE INDEX IF NOT EXISTS "AnaniIncident_status_severidade_idx" ON "AnaniIncident"("status", "severidade");
CREATE INDEX IF NOT EXISTS "AnaniIncident_tipo_status_idx" ON "AnaniIncident"("tipo", "status");
CREATE INDEX IF NOT EXISTS "AnaniIncident_criadoEm_idx" ON "AnaniIncident"("criadoEm");
