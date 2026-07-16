-- Expand-only migration for the unified Market account, Creator affiliation and catalog.
-- Rollback: stop dual writes/read paths, then drop these tables in reverse dependency order.
-- Existing Peca, ParceiroComercial and CandidaturaCreator records remain untouched.

CREATE TABLE "PerfilCreator" (
  "id" TEXT NOT NULL, "contaBizyId" TEXT NOT NULL, "nomePublico" TEXT NOT NULL,
  "bio" TEXT, "avatarUrl" TEXT, "localizacao" TEXT, "categoriasJson" TEXT NOT NULL DEFAULT '[]',
  "canaisJson" TEXT NOT NULL DEFAULT '[]', "redesSociaisJson" TEXT NOT NULL DEFAULT '{}',
  "estado" TEXT NOT NULL DEFAULT 'RASCUNHO', "nivelVerificacao" TEXT NOT NULL DEFAULT 'BASICO',
  "termosVersao" TEXT, "termosAceitesEm" TIMESTAMP(3), "verificadoEm" TIMESTAMP(3),
  "suspensoEm" TIMESTAMP(3), "motivoSuspensao" TEXT, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerfilCreator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgramaAfiliacao" (
  "id" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "nome" TEXT NOT NULL,
  "modalidadeAcesso" TEXT NOT NULL DEFAULT 'APPROVAL_REQUIRED', "estado" TEXT NOT NULL DEFAULT 'ATIVO',
  "termosVersao" TEXT NOT NULL DEFAULT 'creator.v1', "criteriosJson" TEXT NOT NULL DEFAULT '{}',
  "politicaComissaoJson" TEXT NOT NULL DEFAULT '{}', "politicaConteudoJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramaAfiliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SolicitacaoAfiliacao" (
  "id" TEXT NOT NULL, "perfilCreatorId" TEXT NOT NULL, "programaId" TEXT NOT NULL,
  "ofertaId" TEXT, "produtoOfertaId" TEXT, "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
  "mensagem" TEXT, "motivoDecisao" TEXT, "submetidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decididaEm" TIMESTAMP(3), "decididaPorId" TEXT, "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SolicitacaoAfiliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RelacaoAfiliacao" (
  "id" TEXT NOT NULL, "perfilCreatorId" TEXT NOT NULL, "negocioId" TEXT NOT NULL,
  "programaId" TEXT NOT NULL, "parceiroComercialId" TEXT, "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
  "comissaoJson" TEXT NOT NULL DEFAULT '{}', "termosVersao" TEXT NOT NULL,
  "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "pausadaEm" TIMESTAMP(3), "encerradaEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RelacaoAfiliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutorizacaoProdutoAfiliado" (
  "id" TEXT NOT NULL, "relacaoAfiliacaoId" TEXT NOT NULL, "produtoOfertaCreatorId" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'AUTORIZADA', "comissaoSnapshotJson" TEXT NOT NULL DEFAULT '{}',
  "iniciaEm" TIMESTAMP(3), "terminaEm" TIMESTAMP(3), "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutorizacaoProdutoAfiliado_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProdutoCatalogo" (
  "id" TEXT NOT NULL, "tituloCanonico" TEXT NOT NULL, "marca" TEXT, "modelo" TEXT, "categoriaSlug" TEXT,
  "atributosJson" TEXT NOT NULL DEFAULT '{}', "mediaJson" TEXT NOT NULL DEFAULT '[]', "gtin" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'ACTIVO', "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProdutoCatalogo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfertaSeller" (
  "id" TEXT NOT NULL, "produtoCatalogoId" TEXT NOT NULL, "negocioId" TEXT NOT NULL, "pecaLegadaId" TEXT NOT NULL,
  "sku" TEXT, "precoEmKwanza" INTEGER NOT NULL, "stock" INTEGER NOT NULL, "condicao" TEXT NOT NULL DEFAULT 'NOVO',
  "entregaJson" TEXT NOT NULL DEFAULT '{}', "garantiaJson" TEXT NOT NULL DEFAULT '{}', "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfertaSeller_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerfilCreator_contaBizyId_key" ON "PerfilCreator"("contaBizyId");
CREATE INDEX "PerfilCreator_estado_criadoEm_idx" ON "PerfilCreator"("estado", "criadoEm");
CREATE UNIQUE INDEX "ProgramaAfiliacao_negocioId_nome_key" ON "ProgramaAfiliacao"("negocioId", "nome");
CREATE INDEX "ProgramaAfiliacao_negocioId_estado_idx" ON "ProgramaAfiliacao"("negocioId", "estado");
CREATE UNIQUE INDEX "SolicitacaoAfiliacao_perfil_programa_oferta_produto_key" ON "SolicitacaoAfiliacao"("perfilCreatorId", "programaId", "ofertaId", "produtoOfertaId");
CREATE INDEX "SolicitacaoAfiliacao_programaId_estado_criadoEm_idx" ON "SolicitacaoAfiliacao"("programaId", "estado", "criadoEm");
CREATE INDEX "SolicitacaoAfiliacao_perfilCreatorId_estado_criadoEm_idx" ON "SolicitacaoAfiliacao"("perfilCreatorId", "estado", "criadoEm");
CREATE UNIQUE INDEX "RelacaoAfiliacao_perfil_negocio_programa_key" ON "RelacaoAfiliacao"("perfilCreatorId", "negocioId", "programaId");
CREATE INDEX "RelacaoAfiliacao_negocioId_estado_idx" ON "RelacaoAfiliacao"("negocioId", "estado");
CREATE INDEX "RelacaoAfiliacao_parceiroComercialId_idx" ON "RelacaoAfiliacao"("parceiroComercialId");
CREATE UNIQUE INDEX "AutorizacaoProdutoAfiliado_relacao_produto_key" ON "AutorizacaoProdutoAfiliado"("relacaoAfiliacaoId", "produtoOfertaCreatorId");
CREATE INDEX "AutorizacaoProdutoAfiliado_produto_estado_idx" ON "AutorizacaoProdutoAfiliado"("produtoOfertaCreatorId", "estado");
CREATE UNIQUE INDEX "ProdutoCatalogo_gtin_key" ON "ProdutoCatalogo"("gtin");
CREATE INDEX "ProdutoCatalogo_categoriaSlug_estado_idx" ON "ProdutoCatalogo"("categoriaSlug", "estado");
CREATE INDEX "ProdutoCatalogo_tituloCanonico_idx" ON "ProdutoCatalogo"("tituloCanonico");
CREATE UNIQUE INDEX "OfertaSeller_pecaLegadaId_key" ON "OfertaSeller"("pecaLegadaId");
CREATE INDEX "OfertaSeller_produtoCatalogoId_estado_preco_idx" ON "OfertaSeller"("produtoCatalogoId", "estado", "precoEmKwanza");
CREATE INDEX "OfertaSeller_negocioId_estado_idx" ON "OfertaSeller"("negocioId", "estado");

ALTER TABLE "PerfilCreator" ADD CONSTRAINT "PerfilCreator_contaBizyId_fkey" FOREIGN KEY ("contaBizyId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramaAfiliacao" ADD CONSTRAINT "ProgramaAfiliacao_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SolicitacaoAfiliacao" ADD CONSTRAINT "SolicitacaoAfiliacao_perfilCreatorId_fkey" FOREIGN KEY ("perfilCreatorId") REFERENCES "PerfilCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SolicitacaoAfiliacao" ADD CONSTRAINT "SolicitacaoAfiliacao_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "ProgramaAfiliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SolicitacaoAfiliacao" ADD CONSTRAINT "SolicitacaoAfiliacao_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaCreator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelacaoAfiliacao" ADD CONSTRAINT "RelacaoAfiliacao_perfilCreatorId_fkey" FOREIGN KEY ("perfilCreatorId") REFERENCES "PerfilCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelacaoAfiliacao" ADD CONSTRAINT "RelacaoAfiliacao_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelacaoAfiliacao" ADD CONSTRAINT "RelacaoAfiliacao_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "ProgramaAfiliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutorizacaoProdutoAfiliado" ADD CONSTRAINT "AutorizacaoProdutoAfiliado_relacaoAfiliacaoId_fkey" FOREIGN KEY ("relacaoAfiliacaoId") REFERENCES "RelacaoAfiliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutorizacaoProdutoAfiliado" ADD CONSTRAINT "AutorizacaoProdutoAfiliado_produtoOfertaCreatorId_fkey" FOREIGN KEY ("produtoOfertaCreatorId") REFERENCES "ProdutoOfertaCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfertaSeller" ADD CONSTRAINT "OfertaSeller_produtoCatalogoId_fkey" FOREIGN KEY ("produtoCatalogoId") REFERENCES "ProdutoCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfertaSeller" ADD CONSTRAINT "OfertaSeller_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfertaSeller" ADD CONSTRAINT "OfertaSeller_pecaLegadaId_fkey" FOREIGN KEY ("pecaLegadaId") REFERENCES "Peca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one canonical product per current legacy item. Future deduplication can merge by GTIN/brand/model.
INSERT INTO "ProdutoCatalogo" ("id", "tituloCanonico", "categoriaSlug", "atributosJson", "mediaJson", "estado", "criadoEm", "atualizadoEm")
SELECT 'catalogo-' || p."id", p."nome", nullif(lower(regexp_replace(coalesce(p."categoria", ''), '[^a-zA-Z0-9]+', '-', 'g')), ''), '{}', p."fotosJson", CASE WHEN p."arquivadaEm" IS NULL THEN 'ACTIVO' ELSE 'ARQUIVADO' END, p."criadoEm", p."atualizadoEm"
FROM "Peca" p WHERE p."negocioId" IS NOT NULL;

INSERT INTO "OfertaSeller" ("id", "produtoCatalogoId", "negocioId", "pecaLegadaId", "sku", "precoEmKwanza", "stock", "estado", "criadoEm", "atualizadoEm")
SELECT p."id", 'catalogo-' || p."id", p."negocioId", p."id", p."sku", p."precoEmKwanza", p."quantidade", CASE WHEN p."arquivadaEm" IS NULL AND p."estado" NOT IN ('ESGOTADA', 'VENDIDA') THEN 'ACTIVA' ELSE 'INACTIVA' END, p."criadoEm", p."atualizadoEm"
FROM "Peca" p
WHERE p."negocioId" IS NOT NULL;

INSERT INTO "PerfilCreator" ("id", "contaBizyId", "nomePublico", "estado", "termosVersao", "termosAceitesEm", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, x."contaBizyId", x."nomePublico", 'ACTIVO', 'legacy.v1', CURRENT_TIMESTAMP, x."criadoEm", CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON ("contaBizyId") "contaBizyId", "nomePublico", "criadoEm"
  FROM "ParceiroComercial" WHERE "contaBizyId" IS NOT NULL ORDER BY "contaBizyId", "criadoEm"
) x;

INSERT INTO "ProgramaAfiliacao" ("id", "negocioId", "nome", "modalidadeAcesso", "estado", "termosVersao", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, n."id", 'Programa principal', 'APPROVAL_REQUIRED', 'ATIVO', 'creator.v1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Negocio" n WHERE EXISTS (SELECT 1 FROM "OfertaCreator" o WHERE o."negocioId" = n."id");

INSERT INTO "RelacaoAfiliacao" ("id", "perfilCreatorId", "negocioId", "programaId", "parceiroComercialId", "estado", "comissaoJson", "termosVersao", "iniciadaEm", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, pc."id", p."negocioId", pa."id", p."id", CASE WHEN p."estado" = 'ATIVO' THEN 'ACTIVA' ELSE 'PAUSADA' END, p."regraComissaoJson", pa."termosVersao", p."criadoEm", p."criadoEm", CURRENT_TIMESTAMP
FROM "ParceiroComercial" p
JOIN "PerfilCreator" pc ON pc."contaBizyId" = p."contaBizyId"
JOIN "ProgramaAfiliacao" pa ON pa."negocioId" = p."negocioId"
ON CONFLICT DO NOTHING;
