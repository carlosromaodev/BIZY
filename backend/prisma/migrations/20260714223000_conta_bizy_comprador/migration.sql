-- Expand: identidade universal e acesso seguro do comprador.
-- Impacto: somente novas tabelas, indices e FK opcional em CompraUnificada.
-- Rollback: reverter a aplicacao; manter tabelas se ja houver dados. Em ambiente vazio,
-- remover a FK/coluna contaBizyId e depois as tabelas na ordem inversa.

CREATE TABLE "ContaBizy" (
  "id" TEXT NOT NULL,
  "nome" TEXT,
  "telefoneCanonico" TEXT,
  "emailCanonico" TEXT,
  "telefoneVerificadoEm" TIMESTAMP(3),
  "emailVerificadoEm" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ATIVA',
  "usuarioSistemaId" TEXT,
  "clienteGlobalId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContaBizy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerfilComprador" (
  "id" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "nomeExibicao" TEXT,
  "preferenciasJson" TEXT NOT NULL DEFAULT '{}',
  "consentimentoDados" BOOLEAN NOT NULL DEFAULT false,
  "consentimentoMarketing" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PerfilComprador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContextoContaBizy" (
  "id" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "negocioId" TEXT,
  "chave" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'ATIVO',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContextoContaBizy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EnderecoComprador" (
  "id" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "rotulo" TEXT NOT NULL,
  "provincia" TEXT,
  "municipio" TEXT,
  "bairro" TEXT,
  "endereco" TEXT NOT NULL,
  "referencia" TEXT,
  "principal" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EnderecoComprador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentimentoContaBizy" (
  "id" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "versao" TEXT NOT NULL,
  "concedido" BOOLEAN NOT NULL,
  "origem" TEXT NOT NULL,
  "ipHash" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentimentoContaBizy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FavoritoComprador" (
  "id" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "slugLoja" TEXT NOT NULL,
  "codigoProduto" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoritoComprador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispositivoContaBizy" (
  "id" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "identificadorHash" TEXT NOT NULL,
  "nome" TEXT,
  "userAgent" TEXT,
  "ultimoIpHash" TEXT,
  "confiavelEm" TIMESTAMP(3),
  "revogadoEm" TIMESTAMP(3),
  "ultimoUsoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DispositivoContaBizy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessaoContaBizy" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "contaId" TEXT NOT NULL,
  "dispositivoId" TEXT,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "ultimoUsoEm" TIMESTAMP(3),
  "revogadaEm" TIMESTAMP(3),
  "motivoRevogacao" TEXT,
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessaoContaBizy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CodigoOtpContaBizy" (
  "id" TEXT NOT NULL,
  "contaId" TEXT,
  "contactoTipo" TEXT NOT NULL,
  "contactoCanonico" TEXT NOT NULL,
  "finalidade" TEXT NOT NULL,
  "compraId" TEXT,
  "codigoHash" TEXT NOT NULL,
  "codigoFinal" TEXT NOT NULL,
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "usadoEm" TIMESTAMP(3),
  "revogadoEm" TIMESTAMP(3),
  "statusEnvio" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CodigoOtpContaBizy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcessoCompraConvidado" (
  "id" TEXT NOT NULL,
  "compraId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "ultimoAcessoEm" TIMESTAMP(3),
  "revogadoEm" TIMESTAMP(3),
  "motivoRevogacao" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcessoCompraConvidado_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CompraUnificada" ADD COLUMN "contaBizyId" TEXT;

CREATE UNIQUE INDEX "ContaBizy_telefoneCanonico_key" ON "ContaBizy"("telefoneCanonico");
CREATE UNIQUE INDEX "ContaBizy_emailCanonico_key" ON "ContaBizy"("emailCanonico");
CREATE UNIQUE INDEX "ContaBizy_usuarioSistemaId_key" ON "ContaBizy"("usuarioSistemaId");
CREATE UNIQUE INDEX "ContaBizy_clienteGlobalId_key" ON "ContaBizy"("clienteGlobalId");
CREATE INDEX "ContaBizy_status_idx" ON "ContaBizy"("status");
CREATE INDEX "ContaBizy_telefoneVerificadoEm_idx" ON "ContaBizy"("telefoneVerificadoEm");
CREATE INDEX "ContaBizy_emailVerificadoEm_idx" ON "ContaBizy"("emailVerificadoEm");
CREATE UNIQUE INDEX "PerfilComprador_contaId_key" ON "PerfilComprador"("contaId");
CREATE UNIQUE INDEX "ContextoContaBizy_contaId_chave_key" ON "ContextoContaBizy"("contaId", "chave");
CREATE INDEX "ContextoContaBizy_tipo_negocioId_idx" ON "ContextoContaBizy"("tipo", "negocioId");
CREATE INDEX "EnderecoComprador_contaId_principal_idx" ON "EnderecoComprador"("contaId", "principal");
CREATE UNIQUE INDEX "FavoritoComprador_contaId_slugLoja_codigoProduto_key" ON "FavoritoComprador"("contaId", "slugLoja", "codigoProduto");
CREATE INDEX "FavoritoComprador_contaId_criadoEm_idx" ON "FavoritoComprador"("contaId", "criadoEm");
CREATE INDEX "ConsentimentoContaBizy_contaId_tipo_criadoEm_idx" ON "ConsentimentoContaBizy"("contaId", "tipo", "criadoEm");
CREATE UNIQUE INDEX "DispositivoContaBizy_contaId_identificadorHash_key" ON "DispositivoContaBizy"("contaId", "identificadorHash");
CREATE INDEX "DispositivoContaBizy_contaId_revogadoEm_idx" ON "DispositivoContaBizy"("contaId", "revogadoEm");
CREATE UNIQUE INDEX "SessaoContaBizy_tokenHash_key" ON "SessaoContaBizy"("tokenHash");
CREATE INDEX "SessaoContaBizy_contaId_revogadaEm_expiraEm_idx" ON "SessaoContaBizy"("contaId", "revogadaEm", "expiraEm");
CREATE INDEX "SessaoContaBizy_expiraEm_idx" ON "SessaoContaBizy"("expiraEm");
CREATE INDEX "CodigoOtpContaBizy_contactoTipo_contactoCanonico_finalidade_expiraEm_idx" ON "CodigoOtpContaBizy"("contactoTipo", "contactoCanonico", "finalidade", "expiraEm");
CREATE INDEX "CodigoOtpContaBizy_compraId_idx" ON "CodigoOtpContaBizy"("compraId");
CREATE UNIQUE INDEX "AcessoCompraConvidado_tokenHash_key" ON "AcessoCompraConvidado"("tokenHash");
CREATE INDEX "AcessoCompraConvidado_compraId_revogadoEm_expiraEm_idx" ON "AcessoCompraConvidado"("compraId", "revogadoEm", "expiraEm");
CREATE INDEX "AcessoCompraConvidado_expiraEm_idx" ON "AcessoCompraConvidado"("expiraEm");
CREATE INDEX "CompraUnificada_contaBizyId_criadoEm_idx" ON "CompraUnificada"("contaBizyId", "criadoEm");

ALTER TABLE "ContaBizy" ADD CONSTRAINT "ContaBizy_usuarioSistemaId_fkey" FOREIGN KEY ("usuarioSistemaId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContaBizy" ADD CONSTRAINT "ContaBizy_clienteGlobalId_fkey" FOREIGN KEY ("clienteGlobalId") REFERENCES "ClienteGlobal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PerfilComprador" ADD CONSTRAINT "PerfilComprador_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContextoContaBizy" ADD CONSTRAINT "ContextoContaBizy_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnderecoComprador" ADD CONSTRAINT "EnderecoComprador_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoritoComprador" ADD CONSTRAINT "FavoritoComprador_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentimentoContaBizy" ADD CONSTRAINT "ConsentimentoContaBizy_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DispositivoContaBizy" ADD CONSTRAINT "DispositivoContaBizy_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessaoContaBizy" ADD CONSTRAINT "SessaoContaBizy_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessaoContaBizy" ADD CONSTRAINT "SessaoContaBizy_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "DispositivoContaBizy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CodigoOtpContaBizy" ADD CONSTRAINT "CodigoOtpContaBizy_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBizy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcessoCompraConvidado" ADD CONSTRAINT "AcessoCompraConvidado_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "CompraUnificada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompraUnificada" ADD CONSTRAINT "CompraUnificada_contaBizyId_fkey" FOREIGN KEY ("contaBizyId") REFERENCES "ContaBizy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill conservador: cria compatibilidade sem afirmar que contactos antigos foram verificados.
INSERT INTO "ContaBizy" ("id", "nome", "telefoneCanonico", "emailCanonico", "status", "usuarioSistemaId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, u."nome", u."telefone", lower(u."email"), 'ATIVA', u."id", u."criadoEm", CURRENT_TIMESTAMP
FROM "UsuarioSistema" u
ON CONFLICT DO NOTHING;

INSERT INTO "ContextoContaBizy" ("id", "contaId", "tipo", "negocioId", "chave", "estado", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, c."id", 'MEMBRO_NEGOCIO', m."negocioId", 'MEMBRO_NEGOCIO:' || m."negocioId", m."status", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ContaBizy" c
JOIN "MembroNegocio" m ON m."usuarioId" = c."usuarioSistemaId"
ON CONFLICT DO NOTHING;
