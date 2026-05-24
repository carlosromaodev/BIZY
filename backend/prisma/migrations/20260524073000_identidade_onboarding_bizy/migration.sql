ALTER TABLE "Peca" ADD COLUMN "negocioId" TEXT;

ALTER TABLE "UsuarioSistema"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "origemCadastro" TEXT NOT NULL DEFAULT 'TELEFONE',
  ADD COLUMN "perfilCompletoEm" TIMESTAMP(3),
  ALTER COLUMN "telefone" DROP NOT NULL;

CREATE UNIQUE INDEX "UsuarioSistema_email_key" ON "UsuarioSistema"("email");
CREATE INDEX "Peca_negocioId_idx" ON "Peca"("negocioId");

CREATE TABLE "IdentidadeAutenticacao" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerUserId" TEXT NOT NULL,
  "email" TEXT,
  "telefone" TEXT,
  "dadosJson" TEXT NOT NULL DEFAULT '{}',
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IdentidadeAutenticacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerfilEstudantilUsuario" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "institutionCode" TEXT NOT NULL,
  "studentNumber" TEXT NOT NULL,
  "username" TEXT,
  "nome" TEXT NOT NULL,
  "email" TEXT,
  "telefone" TEXT,
  "curso" TEXT,
  "turma" TEXT,
  "anoAcademico" TEXT,
  "avatarUrl" TEXT,
  "dadosJson" TEXT NOT NULL DEFAULT '{}',
  "sincronizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PerfilEstudantilUsuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Negocio" (
  "id" TEXT NOT NULL,
  "nomeComercial" TEXT NOT NULL,
  "segmento" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "nif" TEXT,
  "telefone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "instagram" TEXT,
  "tiktok" TEXT,
  "provincia" TEXT,
  "municipio" TEXT,
  "endereco" TEXT,
  "moeda" TEXT NOT NULL DEFAULT 'AOA',
  "fusoHorario" TEXT NOT NULL DEFAULT 'Africa/Luanda',
  "canaisVendaJson" TEXT NOT NULL DEFAULT '[]',
  "metodosPagamentoJson" TEXT NOT NULL DEFAULT '[]',
  "entregaJson" TEXT NOT NULL DEFAULT '{}',
  "minutosReservaPadrao" INTEGER NOT NULL DEFAULT 10,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MembroNegocio" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "papel" TEXT NOT NULL DEFAULT 'DONO',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MembroNegocio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentidadeAutenticacao_tipo_provider_providerUserId_key"
  ON "IdentidadeAutenticacao"("tipo", "provider", "providerUserId");
CREATE INDEX "IdentidadeAutenticacao_usuarioId_idx" ON "IdentidadeAutenticacao"("usuarioId");
CREATE INDEX "IdentidadeAutenticacao_email_idx" ON "IdentidadeAutenticacao"("email");
CREATE INDEX "IdentidadeAutenticacao_telefone_idx" ON "IdentidadeAutenticacao"("telefone");

CREATE UNIQUE INDEX "PerfilEstudantilUsuario_usuarioId_key" ON "PerfilEstudantilUsuario"("usuarioId");
CREATE UNIQUE INDEX "PerfilEstudantilUsuario_institutionCode_studentNumber_key"
  ON "PerfilEstudantilUsuario"("institutionCode", "studentNumber");
CREATE INDEX "PerfilEstudantilUsuario_usuarioId_idx" ON "PerfilEstudantilUsuario"("usuarioId");

CREATE INDEX "Negocio_nomeComercial_idx" ON "Negocio"("nomeComercial");
CREATE UNIQUE INDEX "MembroNegocio_negocioId_usuarioId_key" ON "MembroNegocio"("negocioId", "usuarioId");
CREATE INDEX "MembroNegocio_usuarioId_idx" ON "MembroNegocio"("usuarioId");

ALTER TABLE "Peca"
  ADD CONSTRAINT "Peca_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IdentidadeAutenticacao"
  ADD CONSTRAINT "IdentidadeAutenticacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PerfilEstudantilUsuario"
  ADD CONSTRAINT "PerfilEstudantilUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MembroNegocio"
  ADD CONSTRAINT "MembroNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MembroNegocio"
  ADD CONSTRAINT "MembroNegocio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
