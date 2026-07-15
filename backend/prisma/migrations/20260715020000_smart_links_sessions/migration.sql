-- Fase 4 - Smart Links e tracking commerce (expand only).
-- Impacto: adiciona sessoes anonimas, toques auditaveis e ligacoes opcionais ao carrinho/compra.
-- Backfill: nao necessario; jornadas existentes continuam no tracking legado durante dual read.
-- Rollback: remover primeiro as FKs/colunas opcionais e depois as tabelas novas; nenhum dado legado e alterado.

CREATE TABLE "SessaoCommerce" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "contaBizyId" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "ultimoToqueEm" TIMESTAMP(3),
    "encerradaEm" TIMESTAMP(3),
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessaoCommerce_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ToqueAtribuicaoCommerce" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'SMART_LINK_CLICK',
    "destinoTipo" TEXT NOT NULL,
    "destinoId" TEXT,
    "campanhaId" TEXT,
    "conteudoId" TEXT,
    "codigoProduto" TEXT,
    "canal" TEXT,
    "origem" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToqueAtribuicaoCommerce_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CarrinhoCommerce" ADD COLUMN "sessaoCommerceId" TEXT;
ALTER TABLE "CompraUnificada" ADD COLUMN "sessaoCommerceId" TEXT;

CREATE UNIQUE INDEX "SessaoCommerce_tokenHash_key" ON "SessaoCommerce"("tokenHash");
CREATE UNIQUE INDEX "SessaoCommerce_trackingId_key" ON "SessaoCommerce"("trackingId");
CREATE INDEX "SessaoCommerce_contaBizyId_expiraEm_idx" ON "SessaoCommerce"("contaBizyId", "expiraEm");
CREATE INDEX "SessaoCommerce_expiraEm_encerradaEm_idx" ON "SessaoCommerce"("expiraEm", "encerradaEm");
CREATE INDEX "ToqueAtribuicaoCommerce_sessaoId_criadoEm_idx" ON "ToqueAtribuicaoCommerce"("sessaoId", "criadoEm");
CREATE INDEX "ToqueAtribuicaoCommerce_negocioId_tipo_criadoEm_idx" ON "ToqueAtribuicaoCommerce"("negocioId", "tipo", "criadoEm");
CREATE INDEX "ToqueAtribuicaoCommerce_linkId_criadoEm_idx" ON "ToqueAtribuicaoCommerce"("linkId", "criadoEm");
CREATE INDEX "ToqueAtribuicaoCommerce_afiliadoId_criadoEm_idx" ON "ToqueAtribuicaoCommerce"("afiliadoId", "criadoEm");
CREATE INDEX "ToqueAtribuicaoCommerce_campanhaId_criadoEm_idx" ON "ToqueAtribuicaoCommerce"("campanhaId", "criadoEm");
CREATE INDEX "ToqueAtribuicaoCommerce_conteudoId_criadoEm_idx" ON "ToqueAtribuicaoCommerce"("conteudoId", "criadoEm");
CREATE INDEX "CarrinhoCommerce_sessaoCommerceId_estado_idx" ON "CarrinhoCommerce"("sessaoCommerceId", "estado");
CREATE INDEX "CompraUnificada_sessaoCommerceId_criadoEm_idx" ON "CompraUnificada"("sessaoCommerceId", "criadoEm");

ALTER TABLE "SessaoCommerce" ADD CONSTRAINT "SessaoCommerce_contaBizyId_fkey" FOREIGN KEY ("contaBizyId") REFERENCES "ContaBizy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ToqueAtribuicaoCommerce" ADD CONSTRAINT "ToqueAtribuicaoCommerce_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoCommerce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToqueAtribuicaoCommerce" ADD CONSTRAINT "ToqueAtribuicaoCommerce_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ToqueAtribuicaoCommerce" ADD CONSTRAINT "ToqueAtribuicaoCommerce_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "LinkAfiliado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ToqueAtribuicaoCommerce" ADD CONSTRAINT "ToqueAtribuicaoCommerce_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "ParceiroComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarrinhoCommerce" ADD CONSTRAINT "CarrinhoCommerce_sessaoCommerceId_fkey" FOREIGN KEY ("sessaoCommerceId") REFERENCES "SessaoCommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompraUnificada" ADD CONSTRAINT "CompraUnificada_sessaoCommerceId_fkey" FOREIGN KEY ("sessaoCommerceId") REFERENCES "SessaoCommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;
