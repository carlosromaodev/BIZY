-- MIG-003: canonicaliza o modulo obrigatorio do BIZY CRM+ para BIZY Team.
-- Mantem compatibilidade no codigo para rotas antigas que ainda pedem "crm".

UPDATE "ModuloNegocio" AS antigo
SET "modulo" = 'team-core'
WHERE antigo."modulo" = 'crm'
  AND NOT EXISTS (
    SELECT 1
    FROM "ModuloNegocio" AS canonical
    WHERE canonical."negocioId" = antigo."negocioId"
      AND canonical."modulo" = 'team-core'
  );

DELETE FROM "ModuloNegocio" AS antigo
USING "ModuloNegocio" AS canonical
WHERE antigo."modulo" = 'crm'
  AND canonical."negocioId" = antigo."negocioId"
  AND canonical."modulo" = 'team-core';
