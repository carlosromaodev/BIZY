-- Fundação multi-loja/CRM+.
-- A migração mantém compatibilidade com dados atuais criando um negócio legado
-- quando ainda não existir nenhum negócio cadastrado.

INSERT INTO "Negocio" (
  "id",
  "nomeComercial",
  "segmento",
  "tipo",
  "moeda",
  "fusoHorario",
  "canaisVendaJson",
  "metodosPagamentoJson",
  "entregaJson",
  "minutosReservaPadrao",
  "criadoEm",
  "atualizadoEm"
)
SELECT
  '00000000-0000-4000-8000-000000000001',
  'Bizy Legacy',
  'geral',
  'LOJA',
  'AOA',
  'Africa/Luanda',
  '[]',
  '[]',
  '{}',
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Negocio");

UPDATE "Peca"
SET "negocioId" = COALESCE(
  "negocioId",
  (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
)
WHERE "negocioId" IS NULL;

ALTER TABLE "Reserva"
  ADD COLUMN "negocioId" TEXT,
  ADD COLUMN "clienteNegocioId" TEXT;

ALTER TABLE "ComentarioRecebido"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "SessaoLive"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "MensagemWhatsapp"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "ClienteAtendimento"
  ADD COLUMN "negocioId" TEXT,
  ADD COLUMN "clienteGlobalId" TEXT;

ALTER TABLE "ConversaAtendimento"
  ADD COLUMN "negocioId" TEXT,
  ADD COLUMN "clienteNegocioId" TEXT;

ALTER TABLE "MensagemAtendimento"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "EventoSistema"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "OutboxEventoN8n"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "OutboxMensagemWhatsApp"
  ADD COLUMN "negocioId" TEXT;

ALTER TABLE "MembroNegocio"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ATIVO',
  ADD COLUMN "permissoesJson" TEXT NOT NULL DEFAULT '{}';

ALTER TABLE "InstanciaWhatsApp"
  ADD COLUMN "negocioId" TEXT;

CREATE TABLE "ClienteGlobal" (
  "id" TEXT NOT NULL,
  "telefoneCanonico" TEXT,
  "emailCanonico" TEXT,
  "nomePreferido" TEXT,
  "avatarUrl" TEXT,
  "origemPrimeira" TEXT,
  "dadosJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClienteGlobal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClienteNegocio" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "clienteGlobalId" TEXT NOT NULL,
  "telefone" TEXT,
  "email" TEXT,
  "nome" TEXT,
  "username" TEXT,
  "userId" TEXT,
  "avatarUrl" TEXT,
  "origem" TEXT,
  "tagsJson" TEXT NOT NULL DEFAULT '[]',
  "preferenciasJson" TEXT NOT NULL DEFAULT '{}',
  "consentimentoMarketing" BOOLEAN NOT NULL DEFAULT false,
  "consentimentoDados" BOOLEAN NOT NULL DEFAULT false,
  "estadoRelacionamento" TEXT NOT NULL DEFAULT 'ATIVO',
  "primeiraInteracaoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ultimaInteracaoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClienteNegocio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RelacaoNegocio" (
  "id" TEXT NOT NULL,
  "negocioOrigemId" TEXT NOT NULL,
  "negocioDestinoId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
  "escopoJson" TEXT NOT NULL DEFAULT '{}',
  "criadoPorUsuarioId" TEXT,
  "aprovadoEm" TIMESTAMP(3),
  "expiraEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RelacaoNegocio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompartilhamentoCliente" (
  "id" TEXT NOT NULL,
  "relacaoId" TEXT,
  "clienteGlobalId" TEXT NOT NULL,
  "clienteNegocioOrigemId" TEXT,
  "negocioOrigemId" TEXT NOT NULL,
  "negocioDestinoId" TEXT NOT NULL,
  "escopoJson" TEXT NOT NULL DEFAULT '{}',
  "baseLegal" TEXT NOT NULL DEFAULT 'CONSENTIMENTO',
  "consentimentoCliente" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "aprovadoPorUsuarioId" TEXT,
  "expiraEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompartilhamentoCliente_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditoriaCompartilhamentoCliente" (
  "id" TEXT NOT NULL,
  "compartilhamentoId" TEXT NOT NULL,
  "atorUsuarioId" TEXT,
  "acao" TEXT NOT NULL,
  "dadosJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditoriaCompartilhamentoCliente_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModuloNegocio" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "modulo" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "configuracaoJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModuloNegocio_pkey" PRIMARY KEY ("id")
);

UPDATE "Reserva" r
SET "negocioId" = p."negocioId"
FROM "Peca" p
WHERE r."pecaId" = p."id"
  AND r."negocioId" IS NULL;

UPDATE "ComentarioRecebido"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

UPDATE "SessaoLive"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

UPDATE "MensagemWhatsapp"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

UPDATE "ClienteAtendimento"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

INSERT INTO "ClienteGlobal" (
  "id",
  "telefoneCanonico",
  "nomePreferido",
  "avatarUrl",
  "origemPrimeira",
  "dadosJson",
  "criadoEm",
  "atualizadoEm"
)
SELECT
  'cliente-global-' || md5("telefone"),
  "telefone",
  MAX("nome"),
  MAX("avatarUrl"),
  MAX("origem"),
  '{}',
  MIN("criadoEm"),
  MAX("atualizadoEm")
FROM "ClienteAtendimento"
GROUP BY "telefone"
ON CONFLICT DO NOTHING;

UPDATE "ClienteAtendimento" c
SET "clienteGlobalId" = g."id"
FROM "ClienteGlobal" g
WHERE c."telefone" = g."telefoneCanonico"
  AND c."clienteGlobalId" IS NULL;

INSERT INTO "ClienteNegocio" (
  "id",
  "negocioId",
  "clienteGlobalId",
  "telefone",
  "nome",
  "username",
  "userId",
  "avatarUrl",
  "origem",
  "tagsJson",
  "consentimentoMarketing",
  "consentimentoDados",
  "primeiraInteracaoEm",
  "ultimaInteracaoEm",
  "criadoEm",
  "atualizadoEm"
)
SELECT
  'cliente-negocio-' || md5(c."negocioId" || ':' || c."telefone"),
  c."negocioId",
  c."clienteGlobalId",
  c."telefone",
  c."nome",
  c."username",
  c."userId",
  c."avatarUrl",
  c."origem",
  c."tagsJson",
  c."consentimento",
  c."consentimento",
  c."primeiraInteracaoEm",
  c."ultimaInteracaoEm",
  c."criadoEm",
  c."atualizadoEm"
FROM "ClienteAtendimento" c
WHERE c."negocioId" IS NOT NULL
  AND c."clienteGlobalId" IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE "ConversaAtendimento" cv
SET
  "negocioId" = c."negocioId",
  "clienteNegocioId" = cn."id"
FROM "ClienteAtendimento" c
LEFT JOIN "ClienteNegocio" cn
  ON cn."negocioId" = c."negocioId"
 AND cn."clienteGlobalId" = c."clienteGlobalId"
WHERE cv."clienteId" = c."id";

UPDATE "MensagemAtendimento" m
SET "negocioId" = cv."negocioId"
FROM "ConversaAtendimento" cv
WHERE m."conversaId" = cv."id"
  AND m."negocioId" IS NULL;

UPDATE "Reserva" r
SET "clienteNegocioId" = cn."id"
FROM "ClienteNegocio" cn
WHERE r."negocioId" = cn."negocioId"
  AND r."telefoneCliente" = cn."telefone"
  AND r."clienteNegocioId" IS NULL;

UPDATE "EventoSistema"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

UPDATE "OutboxEventoN8n"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

UPDATE "OutboxMensagemWhatsApp"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

UPDATE "InstanciaWhatsApp"
SET "negocioId" = (SELECT "id" FROM "Negocio" ORDER BY "criadoEm" ASC, "id" ASC LIMIT 1)
WHERE "negocioId" IS NULL;

DROP INDEX IF EXISTS "Peca_codigo_key";
DROP INDEX IF EXISTS "InstanciaWhatsApp_nome_key";
DROP INDEX IF EXISTS "ClienteAtendimento_telefone_key";
DROP INDEX IF EXISTS "ConversaAtendimento_telefone_canal_key";

CREATE UNIQUE INDEX "Peca_negocioId_codigo_key" ON "Peca"("negocioId", "codigo");
CREATE INDEX "Peca_negocioId_estado_idx" ON "Peca"("negocioId", "estado");

CREATE INDEX "Reserva_negocioId_codigoPeca_estado_idx" ON "Reserva"("negocioId", "codigoPeca", "estado");
CREATE INDEX "Reserva_negocioId_telefoneCliente_codigoPeca_idx" ON "Reserva"("negocioId", "telefoneCliente", "codigoPeca");
CREATE INDEX "Reserva_clienteNegocioId_idx" ON "Reserva"("clienteNegocioId");

CREATE INDEX "ComentarioRecebido_negocioId_liveId_estado_idx" ON "ComentarioRecebido"("negocioId", "liveId", "estado");
CREATE INDEX "SessaoLive_negocioId_ativa_status_idx" ON "SessaoLive"("negocioId", "ativa", "status");
CREATE INDEX "MensagemWhatsapp_negocioId_telefone_idx" ON "MensagemWhatsapp"("negocioId", "telefone");
CREATE INDEX "ClienteAtendimento_negocioId_ultimaInteracaoEm_idx" ON "ClienteAtendimento"("negocioId", "ultimaInteracaoEm");
CREATE UNIQUE INDEX "ClienteAtendimento_negocioId_telefone_key" ON "ClienteAtendimento"("negocioId", "telefone");
CREATE INDEX "ClienteAtendimento_clienteGlobalId_idx" ON "ClienteAtendimento"("clienteGlobalId");
CREATE INDEX "ConversaAtendimento_negocioId_estado_ultimaMensagemEm_idx" ON "ConversaAtendimento"("negocioId", "estado", "ultimaMensagemEm");
CREATE UNIQUE INDEX "ConversaAtendimento_negocioId_telefone_canal_key" ON "ConversaAtendimento"("negocioId", "telefone", "canal");
CREATE INDEX "ConversaAtendimento_clienteNegocioId_idx" ON "ConversaAtendimento"("clienteNegocioId");
CREATE INDEX "MensagemAtendimento_negocioId_telefone_enviadaEm_idx" ON "MensagemAtendimento"("negocioId", "telefone", "enviadaEm");
CREATE INDEX "EventoSistema_negocioId_tipo_criadoEm_idx" ON "EventoSistema"("negocioId", "tipo", "criadoEm");
CREATE INDEX "OutboxEventoN8n_negocioId_status_proximaTentativaEm_idx" ON "OutboxEventoN8n"("negocioId", "status", "proximaTentativaEm");
CREATE INDEX "OutboxMensagemWhatsApp_negocioId_status_proximaTentativaEm_idx" ON "OutboxMensagemWhatsApp"("negocioId", "status", "proximaTentativaEm");
CREATE INDEX "OutboxMensagemWhatsApp_negocioId_telefone_tipo_idx" ON "OutboxMensagemWhatsApp"("negocioId", "telefone", "tipo");
CREATE INDEX "MembroNegocio_negocioId_papel_status_idx" ON "MembroNegocio"("negocioId", "papel", "status");
CREATE UNIQUE INDEX "InstanciaWhatsApp_negocioId_nome_key" ON "InstanciaWhatsApp"("negocioId", "nome");
CREATE INDEX "InstanciaWhatsApp_negocioId_ativa_padrao_idx" ON "InstanciaWhatsApp"("negocioId", "ativa", "padrao");

CREATE UNIQUE INDEX "ClienteGlobal_telefoneCanonico_key" ON "ClienteGlobal"("telefoneCanonico");
CREATE UNIQUE INDEX "ClienteGlobal_emailCanonico_key" ON "ClienteGlobal"("emailCanonico");
CREATE INDEX "ClienteGlobal_telefoneCanonico_idx" ON "ClienteGlobal"("telefoneCanonico");
CREATE INDEX "ClienteGlobal_emailCanonico_idx" ON "ClienteGlobal"("emailCanonico");

CREATE UNIQUE INDEX "ClienteNegocio_negocioId_clienteGlobalId_key" ON "ClienteNegocio"("negocioId", "clienteGlobalId");
CREATE UNIQUE INDEX "ClienteNegocio_negocioId_telefone_key" ON "ClienteNegocio"("negocioId", "telefone");
CREATE INDEX "ClienteNegocio_clienteGlobalId_idx" ON "ClienteNegocio"("clienteGlobalId");
CREATE INDEX "ClienteNegocio_negocioId_ultimaInteracaoEm_idx" ON "ClienteNegocio"("negocioId", "ultimaInteracaoEm");
CREATE INDEX "ClienteNegocio_negocioId_estadoRelacionamento_idx" ON "ClienteNegocio"("negocioId", "estadoRelacionamento");

CREATE UNIQUE INDEX "RelacaoNegocio_negocioOrigemId_negocioDestinoId_tipo_key" ON "RelacaoNegocio"("negocioOrigemId", "negocioDestinoId", "tipo");
CREATE INDEX "RelacaoNegocio_negocioDestinoId_estado_idx" ON "RelacaoNegocio"("negocioDestinoId", "estado");
CREATE INDEX "RelacaoNegocio_tipo_estado_idx" ON "RelacaoNegocio"("tipo", "estado");

CREATE INDEX "CompartilhamentoCliente_clienteGlobalId_idx" ON "CompartilhamentoCliente"("clienteGlobalId");
CREATE INDEX "CompartilhamentoCliente_negocioOrigemId_negocioDestinoId_status_idx" ON "CompartilhamentoCliente"("negocioOrigemId", "negocioDestinoId", "status");
CREATE INDEX "CompartilhamentoCliente_relacaoId_idx" ON "CompartilhamentoCliente"("relacaoId");
CREATE INDEX "CompartilhamentoCliente_clienteNegocioOrigemId_idx" ON "CompartilhamentoCliente"("clienteNegocioOrigemId");

CREATE INDEX "AuditoriaCompartilhamentoCliente_compartilhamentoId_criadoEm_idx" ON "AuditoriaCompartilhamentoCliente"("compartilhamentoId", "criadoEm");
CREATE INDEX "AuditoriaCompartilhamentoCliente_atorUsuarioId_idx" ON "AuditoriaCompartilhamentoCliente"("atorUsuarioId");

CREATE UNIQUE INDEX "ModuloNegocio_negocioId_modulo_key" ON "ModuloNegocio"("negocioId", "modulo");
CREATE INDEX "ModuloNegocio_negocioId_ativo_idx" ON "ModuloNegocio"("negocioId", "ativo");

ALTER TABLE "Reserva"
  ADD CONSTRAINT "Reserva_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reserva"
  ADD CONSTRAINT "Reserva_clienteNegocioId_fkey" FOREIGN KEY ("clienteNegocioId") REFERENCES "ClienteNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ComentarioRecebido"
  ADD CONSTRAINT "ComentarioRecebido_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SessaoLive"
  ADD CONSTRAINT "SessaoLive_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MensagemWhatsapp"
  ADD CONSTRAINT "MensagemWhatsapp_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClienteAtendimento"
  ADD CONSTRAINT "ClienteAtendimento_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClienteAtendimento"
  ADD CONSTRAINT "ClienteAtendimento_clienteGlobalId_fkey" FOREIGN KEY ("clienteGlobalId") REFERENCES "ClienteGlobal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConversaAtendimento"
  ADD CONSTRAINT "ConversaAtendimento_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConversaAtendimento"
  ADD CONSTRAINT "ConversaAtendimento_clienteNegocioId_fkey" FOREIGN KEY ("clienteNegocioId") REFERENCES "ClienteNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MensagemAtendimento"
  ADD CONSTRAINT "MensagemAtendimento_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventoSistema"
  ADD CONSTRAINT "EventoSistema_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OutboxEventoN8n"
  ADD CONSTRAINT "OutboxEventoN8n_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OutboxMensagemWhatsApp"
  ADD CONSTRAINT "OutboxMensagemWhatsApp_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InstanciaWhatsApp"
  ADD CONSTRAINT "InstanciaWhatsApp_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClienteNegocio"
  ADD CONSTRAINT "ClienteNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClienteNegocio"
  ADD CONSTRAINT "ClienteNegocio_clienteGlobalId_fkey" FOREIGN KEY ("clienteGlobalId") REFERENCES "ClienteGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RelacaoNegocio"
  ADD CONSTRAINT "RelacaoNegocio_negocioOrigemId_fkey" FOREIGN KEY ("negocioOrigemId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RelacaoNegocio"
  ADD CONSTRAINT "RelacaoNegocio_negocioDestinoId_fkey" FOREIGN KEY ("negocioDestinoId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RelacaoNegocio"
  ADD CONSTRAINT "RelacaoNegocio_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompartilhamentoCliente"
  ADD CONSTRAINT "CompartilhamentoCliente_relacaoId_fkey" FOREIGN KEY ("relacaoId") REFERENCES "RelacaoNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompartilhamentoCliente"
  ADD CONSTRAINT "CompartilhamentoCliente_clienteGlobalId_fkey" FOREIGN KEY ("clienteGlobalId") REFERENCES "ClienteGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompartilhamentoCliente"
  ADD CONSTRAINT "CompartilhamentoCliente_clienteNegocioOrigemId_fkey" FOREIGN KEY ("clienteNegocioOrigemId") REFERENCES "ClienteNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompartilhamentoCliente"
  ADD CONSTRAINT "CompartilhamentoCliente_negocioOrigemId_fkey" FOREIGN KEY ("negocioOrigemId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompartilhamentoCliente"
  ADD CONSTRAINT "CompartilhamentoCliente_negocioDestinoId_fkey" FOREIGN KEY ("negocioDestinoId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompartilhamentoCliente"
  ADD CONSTRAINT "CompartilhamentoCliente_aprovadoPorUsuarioId_fkey" FOREIGN KEY ("aprovadoPorUsuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditoriaCompartilhamentoCliente"
  ADD CONSTRAINT "AuditoriaCompartilhamentoCliente_compartilhamentoId_fkey" FOREIGN KEY ("compartilhamentoId") REFERENCES "CompartilhamentoCliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditoriaCompartilhamentoCliente"
  ADD CONSTRAINT "AuditoriaCompartilhamentoCliente_atorUsuarioId_fkey" FOREIGN KEY ("atorUsuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ModuloNegocio"
  ADD CONSTRAINT "ModuloNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
