-- MIG-004: Bootstrap do ledger financeiro a partir de dados existentes.
-- Insere MovimentoFinanceiro para cada Pedido pago e cada ComissaoParceiro confirmada,
-- evitando duplicados (só insere se não existir movimento com a mesma origemId).

-- 1. Entradas — Pedidos pagos
INSERT INTO "MovimentoFinanceiro" ("id", "negocioId", "tipo", "descricao", "valor", "origemTipo", "origemId", "dataMovimento", "criadoEm", "atualizadoEm")
SELECT
  gen_random_uuid()::text,
  p."negocioId",
  'ENTRADA',
  'Pedido #' || p."numero"::text || ' (bootstrap)',
  p."totalEmKwanza",
  'PEDIDO',
  p."id",
  COALESCE(p."pagoEm", p."criadoEm"),
  NOW(),
  NOW()
FROM "Pedido" p
WHERE p."estadoPagamento" = 'PAGO'
  AND NOT EXISTS (
    SELECT 1 FROM "MovimentoFinanceiro" mf
    WHERE mf."origemId" = p."id" AND mf."origemTipo" = 'PEDIDO'
  );

-- 2. Saídas — Comissões confirmadas pagas a parceiros
INSERT INTO "MovimentoFinanceiro" ("id", "negocioId", "tipo", "descricao", "valor", "origemTipo", "origemId", "dataMovimento", "criadoEm", "atualizadoEm")
SELECT
  gen_random_uuid()::text,
  c."negocioId",
  'SAIDA',
  'Comissão parceiro (bootstrap)',
  c."valorEmKwanza",
  'COMISSAO',
  c."id",
  c."criadoEm",
  NOW(),
  NOW()
FROM "ComissaoParceiro" c
WHERE c."status" = 'PAGA'
  AND NOT EXISTS (
    SELECT 1 FROM "MovimentoFinanceiro" mf
    WHERE mf."origemId" = c."id" AND mf."origemTipo" = 'COMISSAO'
  );
