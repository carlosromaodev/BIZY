# SDD do Bizy

Status: ativo
Criado em: 2026-06-28
Spec base: `../superpowers/specs/2026-06-28-sdd-completo-bizy-design.md`

## Objetivo

O SDD organiza o Bizy por dominios de produto e arquitetura. Ele nao substitui a wiki nem os planos Superpowers; ele conecta visao, requisitos, dominio, specs de iniciativa, planos, implementacao e memoria.

Use esta pasta quando a pergunta for: onde esta a fronteira deste modulo, que regra nao pode quebrar, que spec deve nascer daqui, que plano continua este trabalho ou que memoria precisa ser atualizada.

## Como Usar

1. Comece pelo processo em `00-processo-sdd-bizy.md`.
2. Navegue pelo indice em `01-indice-mestre-sdd.md`.
3. Consulte o dominio afetado em `domains/`.
4. Crie specs novas com `templates/spec-template.md`.
5. Crie planos executaveis com `templates/plan-template.md`.
6. Registre decisoes estruturais em `decisions/`.

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

- `docs/wiki/pages/memoria-projeto-bizy.md`
- `docs/wiki/pages/visao-produto-bizy.md`
- `docs/wiki/pages/mapa-de-modulos-bizy.md`
- `docs/wiki/pages/bizy-market-lojas-digitais.md`
- `docs/wiki/pages/requisitos-funcionais-bizy.md`
- `docs/wiki/pages/requisitos-nao-funcionais-bizy.md`
- `docs/wiki/pages/regras-de-negocio-bizy.md`
- `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
- `backend/prisma/schema.prisma`
- `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- `frontend/src/rotasApp.tsx`

## Regra Curta

Toda iniciativa relevante deve apontar para um dominio SDD. Toda mudanca que altera fronteira, fluxo, regra, entidade, permissao, seguranca ou roadmap deve atualizar o dominio afetado.
