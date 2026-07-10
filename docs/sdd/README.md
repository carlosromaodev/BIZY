# SDD do Bizy

Status: ativo
Criado em: 2026-06-28
Spec base: `../superpowers/specs/2026-06-28-sdd-completo-bizy-design.md`
Visao canonica: `../wiki/pages/visao-produto-bizy.md`
Meta global derivada: `../superpowers/specs/2026-06-30-meta-global-bizy.md`

## Objetivo

O SDD organiza o Bizy por dominios de produto e arquitetura. Ele nao substitui a wiki nem os planos Superpowers; ele conecta visao, requisitos, dominio, specs de iniciativa, planos, implementacao e memoria.

Use esta pasta quando a pergunta for: onde esta a fronteira deste modulo, que regra nao pode quebrar, que spec deve nascer daqui, que plano continua este trabalho ou que memoria precisa ser atualizada.

## Como Usar

1. Comece pela visao unificada em `../wiki/pages/visao-produto-bizy.md`.
2. Use a meta global em `../superpowers/specs/2026-06-30-meta-global-bizy.md` como filtro de capacidade.
3. Use o processo em `00-processo-sdd-bizy.md`.
4. Navegue pelo indice em `01-indice-mestre-sdd.md`.
5. Consulte o dominio afetado em `domains/`.
6. Crie specs novas com `templates/spec-template.md`.
7. Crie planos executaveis com `templates/plan-template.md`.
8. Registre decisoes estruturais em `decisions/`.

## Fluxo

```text
Visao/Wiki -> SDD por dominio -> Spec de iniciativa -> Plano -> Implementacao -> Testes -> Atualizacao Wiki/SDD
```

## Relacao com a Wiki e Superpowers

- `docs/wiki/` continua como memoria viva, inventario e historico operacional.
- `docs/sdd/` define fronteiras, regras, guardrails e roadmap por dominio.
- `docs/superpowers/specs/` guarda specs de iniciativas especificas.
- `docs/superpowers/plans/` guarda planos executaveis por checklist.

## Fontes Principais

- `/home/carlos/Documentos/ANANI-INTELLIGENCE-MASTER-PLAN.md`
- `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`
- `docs/wiki/pages/memoria-projeto-bizy.md`
- `docs/wiki/pages/visao-produto-bizy.md`
- `docs/wiki/pages/mapa-de-modulos-bizy.md`
- `docs/wiki/pages/bizy-market-lojas-digitais.md`
- `docs/superpowers/specs/2026-06-30-meta-global-bizy.md`
- `docs/wiki/pages/requisitos-funcionais-bizy.md`
- `docs/wiki/pages/requisitos-nao-funcionais-bizy.md`
- `docs/wiki/pages/regras-de-negocio-bizy.md`
- `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
- `backend/prisma/schema.prisma`
- `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- `frontend/src/rotasApp.tsx`

## Decisao Anani 2026-07-09

O Bizy passa a ser organizado como tres sistemas visiveis, `Bizy Team`, `Bizy Market` e `Bizy Learning`, mais o nucleo interno invisivel `Anani`.

Anani nao e modulo de tenant. Qualquer acesso direto deve ficar em `/governance/anani/*` e exigir papel de plataforma: `GOVERNANTE_BIZY`, `ADMIN_GERAL` ou `SUPER_ADMIN_PLATFORM`.

## Regra Curta

Toda iniciativa relevante deve apontar para um dominio SDD, respeitar a visao unificada e passar pelo filtro da meta global. Toda mudanca que altera fronteira, fluxo, regra, entidade, permissao, seguranca ou roadmap deve atualizar o dominio afetado.
