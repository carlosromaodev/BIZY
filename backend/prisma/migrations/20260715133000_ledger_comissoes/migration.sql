-- Fase 9: ledger imutavel, distribuicao colaborativa e payouts.
-- Impacto: expand-only; comissoes e lotes existentes continuam operacionais em dual write.
-- Rollback: desligar o modulo e o dual write. Nao apagar movimentos financeiros; contract migration exige conciliacao formal.

CREATE TABLE "DistribuicaoComissao" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "origemTipo" TEXT NOT NULL,
  "origemId" TEXT NOT NULL,
  "pedidoId" TEXT,
  "conversaoId" TEXT,
  "comissaoLegadaId" TEXT,
  "politicaCodigo" TEXT NOT NULL,
  "politicaVersao" TEXT NOT NULL,
  "valorBaseEmKwanza" INTEGER NOT NULL,
  "valorComissaoKwanza" INTEGER NOT NULL,
  "moeda" TEXT NOT NULL DEFAULT 'AOA',
  "margemEmKwanza" INTEGER,
  "comissaoMaximaKwanza" INTEGER,
  "explicacaoJson" TEXT NOT NULL DEFAULT '{}',
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DistribuicaoComissao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipanteDistribuicaoComissao" (
  "id" TEXT NOT NULL,
  "distribuicaoId" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "parceiroId" TEXT NOT NULL,
  "papel" TEXT NOT NULL,
  "pesoBasisPoints" INTEGER NOT NULL,
  "valorEmKwanza" INTEGER NOT NULL,
  "moeda" TEXT NOT NULL DEFAULT 'AOA',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParticipanteDistribuicaoComissao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ParticipanteDistribuicaoComissao_distribuicaoId_fkey" FOREIGN KEY ("distribuicaoId") REFERENCES "DistribuicaoComissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ParticipanteDistribuicaoComissao_peso_check" CHECK ("pesoBasisPoints" > 0 AND "pesoBasisPoints" <= 10000),
  CONSTRAINT "ParticipanteDistribuicaoComissao_valor_check" CHECK ("valorEmKwanza" >= 0)
);

CREATE TABLE "MovimentoLedgerComissao" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "parceiroId" TEXT NOT NULL,
  "distribuicaoId" TEXT,
  "payoutId" TEXT,
  "tipo" TEXT NOT NULL,
  "saldoOrigem" TEXT,
  "saldoDestino" TEXT,
  "valorEmKwanza" INTEGER NOT NULL,
  "moeda" TEXT NOT NULL DEFAULT 'AOA',
  "idempotencyKey" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "referencia" TEXT,
  "politicaVersao" TEXT NOT NULL,
  "autorId" TEXT,
  "metadataJson" TEXT NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MovimentoLedgerComissao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MovimentoLedgerComissao_valor_check" CHECK ("valorEmKwanza" > 0)
);

CREATE TABLE "PayoutComissao" (
  "id" TEXT NOT NULL,
  "negocioId" TEXT NOT NULL,
  "parceiroId" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'EM_PROCESSAMENTO',
  "valorEmKwanza" INTEGER NOT NULL,
  "moeda" TEXT NOT NULL DEFAULT 'AOA',
  "idempotencyKey" TEXT NOT NULL,
  "referenciaProvider" TEXT,
  "motivoFalha" TEXT,
  "solicitadoPorId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processadoEm" TIMESTAMP(3),
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayoutComissao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayoutComissao_valor_check" CHECK ("valorEmKwanza" > 0)
);

CREATE UNIQUE INDEX "DistribuicaoComissao_negocioId_origemTipo_origemId_key" ON "DistribuicaoComissao"("negocioId", "origemTipo", "origemId");
CREATE INDEX "DistribuicaoComissao_negocioId_pedidoId_idx" ON "DistribuicaoComissao"("negocioId", "pedidoId");
CREATE INDEX "DistribuicaoComissao_conversaoId_idx" ON "DistribuicaoComissao"("conversaoId");
CREATE INDEX "DistribuicaoComissao_comissaoLegadaId_idx" ON "DistribuicaoComissao"("comissaoLegadaId");
CREATE UNIQUE INDEX "ParticipanteDistribuicaoComissao_distribuicaoId_parceiroId_papel_key" ON "ParticipanteDistribuicaoComissao"("distribuicaoId", "parceiroId", "papel");
CREATE INDEX "ParticipanteDistribuicaoComissao_negocioId_parceiroId_criadoEm_idx" ON "ParticipanteDistribuicaoComissao"("negocioId", "parceiroId", "criadoEm");
CREATE UNIQUE INDEX "MovimentoLedgerComissao_idempotencyKey_key" ON "MovimentoLedgerComissao"("idempotencyKey");
CREATE INDEX "MovimentoLedgerComissao_negocioId_parceiroId_criadoEm_idx" ON "MovimentoLedgerComissao"("negocioId", "parceiroId", "criadoEm");
CREATE INDEX "MovimentoLedgerComissao_distribuicaoId_criadoEm_idx" ON "MovimentoLedgerComissao"("distribuicaoId", "criadoEm");
CREATE INDEX "MovimentoLedgerComissao_payoutId_criadoEm_idx" ON "MovimentoLedgerComissao"("payoutId", "criadoEm");
CREATE INDEX "MovimentoLedgerComissao_tipo_criadoEm_idx" ON "MovimentoLedgerComissao"("tipo", "criadoEm");
CREATE UNIQUE INDEX "PayoutComissao_idempotencyKey_key" ON "PayoutComissao"("idempotencyKey");
CREATE INDEX "PayoutComissao_negocioId_parceiroId_criadoEm_idx" ON "PayoutComissao"("negocioId", "parceiroId", "criadoEm");
CREATE INDEX "PayoutComissao_negocioId_estado_criadoEm_idx" ON "PayoutComissao"("negocioId", "estado", "criadoEm");

-- Backfill conservador: cada comissao historica torna-se uma distribuicao de participante unico.
INSERT INTO "DistribuicaoComissao" (
  "id", "negocioId", "origemTipo", "origemId", "pedidoId", "comissaoLegadaId",
  "politicaCodigo", "politicaVersao", "valorBaseEmKwanza", "valorComissaoKwanza", "moeda", "explicacaoJson"
)
SELECT 'legacy-dist-' || c."id", c."negocioId", 'LEGACY_COMMISSION', c."id", c."pedidoId", c."id",
  'legacy.commission', 'legacy.commission.v1', c."baseEmKwanza", c."valorEmKwanza", c."moeda",
  json_build_object('migradoDe', 'ComissaoParceiro', 'statusOriginal', c."status")::text
FROM "ComissaoParceiro" c
ON CONFLICT DO NOTHING;

INSERT INTO "ParticipanteDistribuicaoComissao" (
  "id", "distribuicaoId", "negocioId", "parceiroId", "papel", "pesoBasisPoints", "valorEmKwanza", "moeda"
)
SELECT 'legacy-part-' || c."id", 'legacy-dist-' || c."id", c."negocioId", c."afiliadoId", 'AFILIADO', 10000, c."valorEmKwanza", c."moeda"
FROM "ComissaoParceiro" c
ON CONFLICT DO NOTHING;

INSERT INTO "MovimentoLedgerComissao" (
  "id", "negocioId", "parceiroId", "distribuicaoId", "tipo", "saldoDestino", "valorEmKwanza", "moeda",
  "idempotencyKey", "motivo", "politicaVersao", "metadataJson"
)
SELECT 'legacy-est-' || c."id", c."negocioId", c."afiliadoId", 'legacy-dist-' || c."id", 'CREDITO_ESTIMADO', 'ESTIMADO',
  c."valorEmKwanza", c."moeda", 'dist:legacy-dist-' || c."id" || ':legacy-part-' || c."id" || ':estimado', 'Backfill de comissao historica', 'legacy.commission.v1', '{}'
FROM "ComissaoParceiro" c WHERE c."valorEmKwanza" > 0
ON CONFLICT DO NOTHING;

-- Confirmacao e libertacao usam as mesmas chaves do dual write da aplicacao.
INSERT INTO "MovimentoLedgerComissao" (
  "id", "negocioId", "parceiroId", "distribuicaoId", "tipo", "saldoOrigem", "saldoDestino", "valorEmKwanza", "moeda",
  "idempotencyKey", "motivo", "politicaVersao", "metadataJson"
)
SELECT 'legacy-confirm-' || c."id", c."negocioId", c."afiliadoId", 'legacy-dist-' || c."id",
  'CREDITO_CONFIRMADO', 'ESTIMADO', 'CONFIRMADO', c."valorEmKwanza", c."moeda",
  'dist:legacy-dist-' || c."id" || ':legacy-part-' || c."id" || ':confirmado', 'Confirmacao historica', 'legacy.commission.v1', '{}'
FROM "ComissaoParceiro" c
WHERE c."valorEmKwanza" > 0 AND c."status" IN ('CONFIRMADA', 'PAGA')
ON CONFLICT DO NOTHING;

INSERT INTO "MovimentoLedgerComissao" (
  "id", "negocioId", "parceiroId", "distribuicaoId", "tipo", "saldoOrigem", "saldoDestino", "valorEmKwanza", "moeda",
  "idempotencyKey", "motivo", "politicaVersao", "metadataJson"
)
SELECT 'legacy-release-' || c."id", c."negocioId", c."afiliadoId", 'legacy-dist-' || c."id",
  'LIBERTACAO', 'CONFIRMADO', 'DISPONIVEL', c."valorEmKwanza", c."moeda",
  'dist:legacy-dist-' || c."id" || ':legacy-part-' || c."id" || ':disponivel', 'Libertacao historica', 'legacy.commission.v1', '{}'
FROM "ComissaoParceiro" c
WHERE c."valorEmKwanza" > 0 AND c."status" IN ('CONFIRMADA', 'PAGA')
ON CONFLICT DO NOTHING;

INSERT INTO "MovimentoLedgerComissao" (
  "id", "negocioId", "parceiroId", "distribuicaoId", "tipo", "saldoOrigem", "saldoDestino", "valorEmKwanza", "moeda",
  "idempotencyKey", "motivo", "politicaVersao", "metadataJson"
)
SELECT 'legacy-reversal-' || c."id", c."negocioId", c."afiliadoId", 'legacy-dist-' || c."id",
  'REVERSAO', 'ESTIMADO', 'REVERTIDO', c."valorEmKwanza", c."moeda", 'legacy:' || c."id" || ':revertido',
  COALESCE(c."motivo", 'Reversao historica'), 'legacy.commission.v1', '{}'
FROM "ComissaoParceiro" c
WHERE c."valorEmKwanza" > 0 AND c."status" IN ('REVERTIDA', 'CANCELADA')
ON CONFLICT DO NOTHING;

INSERT INTO "PayoutComissao" (
  "id", "negocioId", "parceiroId", "estado", "valorEmKwanza", "moeda", "idempotencyKey",
  "referenciaProvider", "criadoEm", "processadoEm", "atualizadoEm"
)
SELECT 'legacy-payout-' || c."id", c."negocioId", c."afiliadoId", 'PAGO', c."valorEmKwanza", c."moeda",
  'legacy:' || c."id" || ':payout', COALESCE(c."referenciaPagamento", 'legacy-' || c."id"),
  c."criadoEm", COALESCE(c."pagoEm", c."atualizadoEm"), c."atualizadoEm"
FROM "ComissaoParceiro" c WHERE c."valorEmKwanza" > 0 AND c."status" = 'PAGA'
ON CONFLICT DO NOTHING;

INSERT INTO "MovimentoLedgerComissao" (
  "id", "negocioId", "parceiroId", "distribuicaoId", "payoutId", "tipo", "saldoOrigem", "saldoDestino", "valorEmKwanza", "moeda",
  "idempotencyKey", "motivo", "politicaVersao", "metadataJson"
)
SELECT 'legacy-pay-reserve-' || c."id", c."negocioId", c."afiliadoId", 'legacy-dist-' || c."id", 'legacy-payout-' || c."id",
  'PAGAMENTO', 'DISPONIVEL', 'EM_PAGAMENTO', c."valorEmKwanza", c."moeda", 'payout:legacy-payout-' || c."id" || ':reservado',
  'Reserva historica de payout', 'legacy.commission.v1', '{}'
FROM "ComissaoParceiro" c WHERE c."valorEmKwanza" > 0 AND c."status" = 'PAGA'
ON CONFLICT DO NOTHING;

INSERT INTO "MovimentoLedgerComissao" (
  "id", "negocioId", "parceiroId", "distribuicaoId", "payoutId", "tipo", "saldoOrigem", "saldoDestino", "valorEmKwanza", "moeda",
  "idempotencyKey", "motivo", "referencia", "politicaVersao", "metadataJson"
)
SELECT 'legacy-pay-final-' || c."id", c."negocioId", c."afiliadoId", 'legacy-dist-' || c."id", 'legacy-payout-' || c."id",
  'PAGAMENTO', 'EM_PAGAMENTO', 'PAGO', c."valorEmKwanza", c."moeda", 'payout:legacy-payout-' || c."id" || ':pago',
  'Payout historico confirmado', COALESCE(c."referenciaPagamento", 'legacy-' || c."id"), 'legacy.commission.v1', '{}'
FROM "ComissaoParceiro" c WHERE c."valorEmKwanza" > 0 AND c."status" = 'PAGA'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION impedir_mutacao_ledger_comissao() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'MovimentoLedgerComissao e imutavel';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "MovimentoLedgerComissao_immutable_update"
BEFORE UPDATE OR DELETE ON "MovimentoLedgerComissao"
FOR EACH ROW EXECUTE FUNCTION impedir_mutacao_ledger_comissao();
