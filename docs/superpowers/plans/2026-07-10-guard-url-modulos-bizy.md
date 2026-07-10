# Guard de URL por Modulo Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear renderizacao frontend de rota direta quando o modulo da rota estiver desligado.

**Meta global:** Capacidade melhorada: controlo.

**Architecture:** App Router consulta `/negocio/modulos` para rotas privadas com `modulo`; Shell continua a esconder navegacao; backend continua fonte de verdade para permissao.

**Tech Stack:** React, TypeScript, Vitest, Fastify backend existente.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-guard-url-modulos-bizy.md`
- `docs/superpowers/plans/2026-07-10-guard-url-modulos-bizy.md`

Modify:

- `frontend/src/App.tsx`
- `frontend/src/rotasApp.tsx`
- `frontend/testes/modulos-ui.test.ts`
- `docs/sdd/domains/02-identidade-acesso-negocios.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`

---

### Task 1: Guardar rota privada por modulo

- [x] **Step 1: Passar modulo para `RotaPrivada`**

`LayoutApp` e rotas ocultas repassam `rota.modulo`.

- [x] **Step 2: Consultar modulos ativos**

`RotaPrivada` usa `/negocio/modulos`, bloqueia se o modulo nao estiver ativo e refaz a validacao ao trocar workspace.

- [x] **Step 3: Cobrir rota legada**

`/app/loja-publica` exige `loja-publica`.

### Task 2: Verificar frontend e backend

- [x] **Step 1: Atualizar teste frontend**

`modulos-ui.test.ts` cobre guard de URL e rota legada.

- [x] **Step 2: Rodar teste backend**

`modulos-negocio-http.test.ts` confirma 403 `MODULO_DESATIVADO`.

### Task 3: Atualizar SDD e wiki

- [x] **Step 1: Marcar P1 concluido**

Atualizar dominio de identidade e prioridades.

### Task 4: Validar

- [x] **Step 1: Rodar verificacoes**

```bash
cd frontend && npx vitest run testes/modulos-ui.test.ts
cd backend && npx vitest run src/testes/modulos-negocio-http.test.ts
npm run typecheck --workspace frontend
git diff --check
```
