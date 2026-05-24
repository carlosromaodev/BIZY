-- CreateTable
CREATE TABLE "Peca" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoEmKwanza" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "fotosJson" TEXT NOT NULL DEFAULT '[]',
    "estado" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "codigoPeca" TEXT NOT NULL,
    "telefoneCliente" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "usernameCliente" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "estadoPagamento" TEXT NOT NULL DEFAULT 'AGUARDANDO_COMPROVATIVO',
    "comentarioOriginal" TEXT NOT NULL,
    "liveId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3),
    "enderecoEntrega" TEXT,
    "comprovativoPagamentoUrl" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioRecebido" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "liveId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "intent" TEXT,
    "phone" TEXT,
    "productCode" TEXT,
    "confidence" DOUBLE PRECISION,
    "requiresManualReview" BOOLEAN,
    "estado" TEXT NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComentarioRecebido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemWhatsapp" (
    "id" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "idExterno" TEXT,
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoSistema" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dadosJson" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioSistema" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoLoginSms" (
    "id" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "codigoFinal" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "statusEnvio" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "providerResponseJson" TEXT,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodigoLoginSms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoUsuario" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUsoEm" TIMESTAMP(3),

    CONSTRAINT "SessaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstanciaWhatsApp" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "etiqueta" TEXT,
    "telefone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CRIADA',
    "qrCode" TEXT,
    "pairingCode" TEXT,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ultimoErro" TEXT,
    "ultimaConexaoEm" TIMESTAMP(3),
    "ultimaConsultaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstanciaWhatsApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Peca_codigo_key" ON "Peca"("codigo");

-- CreateIndex
CREATE INDEX "Reserva_codigoPeca_estado_idx" ON "Reserva"("codigoPeca", "estado");

-- CreateIndex
CREATE INDEX "Reserva_telefoneCliente_codigoPeca_idx" ON "Reserva"("telefoneCliente", "codigoPeca");

-- CreateIndex
CREATE INDEX "ComentarioRecebido_liveId_estado_idx" ON "ComentarioRecebido"("liveId", "estado");

-- CreateIndex
CREATE INDEX "EventoSistema_tipo_criadoEm_idx" ON "EventoSistema"("tipo", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSistema_telefone_key" ON "UsuarioSistema"("telefone");

-- CreateIndex
CREATE INDEX "CodigoLoginSms_telefone_expiraEm_idx" ON "CodigoLoginSms"("telefone", "expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoUsuario_tokenHash_key" ON "SessaoUsuario"("tokenHash");

-- CreateIndex
CREATE INDEX "SessaoUsuario_usuarioId_idx" ON "SessaoUsuario"("usuarioId");

-- CreateIndex
CREATE INDEX "SessaoUsuario_expiraEm_idx" ON "SessaoUsuario"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "InstanciaWhatsApp_nome_key" ON "InstanciaWhatsApp"("nome");

-- CreateIndex
CREATE INDEX "InstanciaWhatsApp_ativa_padrao_idx" ON "InstanciaWhatsApp"("ativa", "padrao");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoLoginSms" ADD CONSTRAINT "CodigoLoginSms_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoUsuario" ADD CONSTRAINT "SessaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
