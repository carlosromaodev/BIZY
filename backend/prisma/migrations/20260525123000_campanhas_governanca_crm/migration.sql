CREATE TABLE "TemplateWhatsAppNegocio" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "idioma" TEXT NOT NULL DEFAULT 'pt_AO',
  "provider" TEXT NOT NULL DEFAULT 'whatsapp_cloud_api',
  "estadoAprovacao" TEXT NOT NULL DEFAULT 'rascunho',
  "eventosCompativeisJson" TEXT NOT NULL DEFAULT '[]',
  "variaveisJson" TEXT NOT NULL DEFAULT '[]',
  "corpo" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "versao" INTEGER NOT NULL DEFAULT 1,
  "motivoUltimaAlteracao" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TemplateWhatsAppNegocio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampanhaCrm" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "objetivo" TEXT NOT NULL,
  "canal" TEXT NOT NULL DEFAULT 'whatsapp',
  "templateId" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "segmentoJson" TEXT NOT NULL DEFAULT '{}',
  "limiteDiario" INTEGER NOT NULL DEFAULT 500,
  "janelaInicio" TIMESTAMP(3),
  "janelaFim" TIMESTAMP(3),
  "metricasJson" TEXT NOT NULL DEFAULT '{}',
  "criadaPorUsuarioId" TEXT,
  "pausadaEm" TIMESTAMP(3),
  "motivoPausa" TEXT,
  "confirmadaEm" TIMESTAMP(3),
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampanhaCrm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemCampanhaCrm" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "campanhaId" TEXT NOT NULL,
  "clienteId" TEXT,
  "telefone" TEXT,
  "nomeCliente" TEXT,
  "status" TEXT NOT NULL,
  "motivoBloqueio" TEXT,
  "outboxMensagemId" TEXT,
  "contextoJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemCampanhaCrm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventoOperacional" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "topico" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "entidadeTipo" TEXT,
  "entidadeId" TEXT,
  "idempotencyKey" TEXT,
  "payloadJson" TEXT NOT NULL DEFAULT '{}',
  "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "proximaTentativaEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventoOperacional_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobOperacional" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
  "idempotencyKey" TEXT,
  "total" INTEGER NOT NULL DEFAULT 0,
  "processados" INTEGER NOT NULL DEFAULT 0,
  "erros" INTEGER NOT NULL DEFAULT 0,
  "resultadoJson" TEXT NOT NULL DEFAULT '{}',
  "erro" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  "concluidoEm" TIMESTAMP(3),
  CONSTRAINT "JobOperacional_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TemplateWhatsAppNegocio_negocioId_categoria_estadoAprovacao_idx" ON "TemplateWhatsAppNegocio"("negocioId", "categoria", "estadoAprovacao");
CREATE INDEX "TemplateWhatsAppNegocio_negocioId_ativo_idx" ON "TemplateWhatsAppNegocio"("negocioId", "ativo");
CREATE INDEX "CampanhaCrm_negocioId_estado_criadaEm_idx" ON "CampanhaCrm"("negocioId", "estado", "criadaEm");
CREATE INDEX "CampanhaCrm_negocioId_canal_criadaEm_idx" ON "CampanhaCrm"("negocioId", "canal", "criadaEm");
CREATE INDEX "CampanhaCrm_templateId_idx" ON "CampanhaCrm"("templateId");
CREATE INDEX "ItemCampanhaCrm_negocioId_campanhaId_status_idx" ON "ItemCampanhaCrm"("negocioId", "campanhaId", "status");
CREATE INDEX "ItemCampanhaCrm_clienteId_idx" ON "ItemCampanhaCrm"("clienteId");
CREATE INDEX "ItemCampanhaCrm_telefone_idx" ON "ItemCampanhaCrm"("telefone");
CREATE UNIQUE INDEX "EventoOperacional_negocioId_idempotencyKey_key" ON "EventoOperacional"("negocioId", "idempotencyKey");
CREATE INDEX "EventoOperacional_negocioId_topico_criadoEm_idx" ON "EventoOperacional"("negocioId", "topico", "criadoEm");
CREATE INDEX "EventoOperacional_negocioId_estado_criadoEm_idx" ON "EventoOperacional"("negocioId", "estado", "criadoEm");
CREATE INDEX "EventoOperacional_entidadeTipo_entidadeId_idx" ON "EventoOperacional"("entidadeTipo", "entidadeId");
CREATE UNIQUE INDEX "JobOperacional_negocioId_idempotencyKey_key" ON "JobOperacional"("negocioId", "idempotencyKey");
CREATE INDEX "JobOperacional_negocioId_tipo_criadoEm_idx" ON "JobOperacional"("negocioId", "tipo", "criadoEm");
CREATE INDEX "JobOperacional_negocioId_estado_criadoEm_idx" ON "JobOperacional"("negocioId", "estado", "criadoEm");

ALTER TABLE "TemplateWhatsAppNegocio" ADD CONSTRAINT "TemplateWhatsAppNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampanhaCrm" ADD CONSTRAINT "CampanhaCrm_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampanhaCrm" ADD CONSTRAINT "CampanhaCrm_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplateWhatsAppNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemCampanhaCrm" ADD CONSTRAINT "ItemCampanhaCrm_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemCampanhaCrm" ADD CONSTRAINT "ItemCampanhaCrm_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "CampanhaCrm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventoOperacional" ADD CONSTRAINT "EventoOperacional_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobOperacional" ADD CONSTRAINT "JobOperacional_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
