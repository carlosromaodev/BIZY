# Modulos Desativados na UI Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que modulos desativados nao aparecem na navegacao visivel do Team.

**Meta global:** Capacidade melhorada: controlo.

**Architecture:** A fonte de rotas continua em `rotasApp.tsx`. O Shell usa a lista filtrada para tabs primarias, drawer desktop e sheet mobile. Backend continua como autoridade para permissoes reais.

**Tech Stack:** React, TypeScript, Vitest.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-modulos-desativados-ui-bizy.md`
- `docs/superpowers/plans/2026-07-10-modulos-desativados-ui-bizy.md`
- `frontend/testes/modulos-ui.test.ts`

Modify:

- `frontend/src/rotasApp.tsx`
- `docs/sdd/03-roadmap-sdd.md`
- `docs/sdd/domains/02-identidade-acesso-negocios.md`
- `docs/sdd/domains/12-frontend-ux-design-system.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`

---

### Task 1: Corrigir regra de filtragem

**Files:**
- Modify: `frontend/src/rotasApp.tsx`
- Test: `frontend/testes/modulos-ui.test.ts`

- [x] **Step 1: Remover fallback permissivo**

Lista vazia de `modulosAtivos` deixa de devolver todas as rotas.

- [x] **Step 2: Cobrir operacao minima**

Rotas nucleo sem `modulo` permanecem visiveis.

- [x] **Step 3: Cobrir modulos opcionais**

Rotas `loja-publica`, `funil`, `automacoes`, `afiliados` e `social-inbox` obedecem a `modulosAtivos`.

### Task 2: Verificar superficies da UI

- [x] **Step 1: Verificar tabs primarias**

Tabs usam `rotasPrimariasCrmV3` filtradas por caminhos visiveis.

- [x] **Step 2: Verificar drawer desktop**

Drawer usa `rotasDesktopVisiveis`.

- [x] **Step 3: Verificar sheet mobile**

Sheet usa `rotasComerciaisFiltradas`.

### Task 3: Atualizar SDD e wiki

- [x] **Step 1: Marcar P0 como concluido**

Atualizar roadmap, dominio de identidade, dominio frontend e prioridade de lancamento.

- [x] **Step 2: Registrar limite**

Declarar que RBAC/ABAC completo fica em P1/P2 ou backend. O guard frontend de URL foi fechado depois em `2026-07-10-guard-url-modulos-bizy`.

### Task 4: Validar

- [x] **Step 1: Rodar testes**

```bash
cd frontend && npx vitest run testes/modulos-ui.test.ts
npm run typecheck --workspace frontend
git diff --check
```
