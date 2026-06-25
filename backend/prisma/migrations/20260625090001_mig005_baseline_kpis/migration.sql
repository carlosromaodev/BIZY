-- MIG-005: Registar baselines de KPIs existentes para cada negócio.
-- Estes valores servem de referência para cálculo de ROI antes/depois.

-- Baseline: pedidos mensais (média dos últimos 3 meses)
INSERT INTO "BaselineKPI" ("id", "negocioId", "modulo", "kpi", "valorBaseline", "registadoEm")
SELECT
  gen_random_uuid()::text,
  n."id",
  'vendas',
  'pedidos_mensais',
  COALESCE(
    (SELECT COUNT(*)::float / GREATEST(1,
      EXTRACT(MONTH FROM AGE(NOW(), MIN(p."criadoEm")))::int)
     FROM "Pedido" p WHERE p."negocioId" = n."id"),
    0
  ),
  NOW()
FROM "Negocio" n
WHERE NOT EXISTS (
  SELECT 1 FROM "BaselineKPI" b
  WHERE b."negocioId" = n."id" AND b."modulo" = 'vendas' AND b."kpi" = 'pedidos_mensais'
);

-- Baseline: receita mensal (média)
INSERT INTO "BaselineKPI" ("id", "negocioId", "modulo", "kpi", "valorBaseline", "registadoEm")
SELECT
  gen_random_uuid()::text,
  n."id",
  'vendas',
  'receita_mensal',
  COALESCE(
    (SELECT SUM(p."totalEmKwanza")::float / GREATEST(1,
      EXTRACT(MONTH FROM AGE(NOW(), MIN(p."criadoEm")))::int)
     FROM "Pedido" p WHERE p."negocioId" = n."id" AND p."estadoPagamento" = 'PAGO'),
    0
  ),
  NOW()
FROM "Negocio" n
WHERE NOT EXISTS (
  SELECT 1 FROM "BaselineKPI" b
  WHERE b."negocioId" = n."id" AND b."modulo" = 'vendas' AND b."kpi" = 'receita_mensal'
);

-- Baseline: clientes activos (com pedido nos últimos 90 dias)
INSERT INTO "BaselineKPI" ("id", "negocioId", "modulo", "kpi", "valorBaseline", "registadoEm")
SELECT
  gen_random_uuid()::text,
  n."id",
  'clientes',
  'clientes_activos',
  COALESCE(
    (SELECT COUNT(DISTINCT p."clienteNegocioId")::float
     FROM "Pedido" p
     WHERE p."negocioId" = n."id"
       AND p."criadoEm" >= NOW() - INTERVAL '90 days'),
    0
  ),
  NOW()
FROM "Negocio" n
WHERE NOT EXISTS (
  SELECT 1 FROM "BaselineKPI" b
  WHERE b."negocioId" = n."id" AND b."modulo" = 'clientes' AND b."kpi" = 'clientes_activos'
);

-- Baseline: tarefas concluídas por mês
INSERT INTO "BaselineKPI" ("id", "negocioId", "modulo", "kpi", "valorBaseline", "registadoEm")
SELECT
  gen_random_uuid()::text,
  n."id",
  'operacoes',
  'tarefas_concluidas',
  COALESCE(
    (SELECT COUNT(*)::float / GREATEST(1,
      EXTRACT(MONTH FROM AGE(NOW(), MIN(t."criadaEm")))::int)
     FROM "TarefaOperacional" t
     WHERE t."negocioId" = n."id" AND t."estado" = 'CONCLUIDA'),
    0
  ),
  NOW()
FROM "Negocio" n
WHERE NOT EXISTS (
  SELECT 1 FROM "BaselineKPI" b
  WHERE b."negocioId" = n."id" AND b."modulo" = 'operacoes' AND b."kpi" = 'tarefas_concluidas'
);
