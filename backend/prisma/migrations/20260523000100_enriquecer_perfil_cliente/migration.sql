ALTER TABLE "Reserva" ADD COLUMN "userIdCliente" TEXT;
ALTER TABLE "Reserva" ADD COLUMN "avatarUrlCliente" TEXT;

ALTER TABLE "ComentarioRecebido" ADD COLUMN "userId" TEXT;
ALTER TABLE "ComentarioRecebido" ADD COLUMN "avatarUrl" TEXT;

ALTER TABLE "ClienteAtendimento" ADD COLUMN "userId" TEXT;
ALTER TABLE "ClienteAtendimento" ADD COLUMN "avatarUrl" TEXT;

CREATE INDEX "ClienteAtendimento_userId_idx" ON "ClienteAtendimento"("userId");
