# Anani Read Models e Governance Console Inicial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar read models internos iniciais da Anani e uma console protegida para governanca.

**Meta global:** Capacidade melhorada: controlo.

**Architecture:** `bootstrapAnani` calcula read models sob demanda com Prisma; `ananiGovernance` expoe rota interna; frontend usa rota oculta com guarda por papel de governanca Anani.

**Tech Stack:** Fastify, Prisma, TypeScript, React, Vitest.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-anani-read-models-governance-console.md`
- `docs/superpowers/plans/2026-07-10-anani-read-models-governance-console.md`
- `backend/src/testes/anani-read-models.test.ts`
- `frontend/src/paginas/AnaniGovernance.tsx`
- `frontend/testes/anani-governance-ui.test.ts`

Modify:

- `backend/src/app/bootstrap/bootstrapAnani.ts`
- `backend/src/infra/http/modulos/ananiGovernance.ts`
- `backend/src/testes/anani-governance-http.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/rotasApp.tsx`
- `docs/sdd/domains/11-inteligencia-workflow-automacoes.md`
- `docs/sdd/03-roadmap-sdd.md`
- `docs/wiki/pages/anani-intelligence-control-plane.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/wiki/pages/memoria-viva-bizy.md`
- `docs/wiki/pages/memoria-projeto-bizy.md`

---

### Task 1: Backend read models

- [x] **Step 1: Criar contrato de read models**

Adicionar `AnaniReadModelsService` ao contexto Anani.

- [x] **Step 2: Calcular `TeamHealth`**

Consolidar tarefas, conversas, pedidos pendentes e snapshots de risco Team.

- [x] **Step 3: Calcular `MarketSnapshot`**

Consolidar lojas publicadas, produtos, stock, pedidos/receita 30d e snapshots Market.

- [x] **Step 4: Calcular `SecuritySnapshot`**

Consolidar incidentes, quarentenas e backlog da `EventOutbox`.

### Task 2: API interna

- [x] **Step 1: Expor endpoint**

Criar `GET /governance/anani/read-models`.

- [x] **Step 2: Preservar guarda**

Usar `exigirGovernanteAnani` e `Cache-Control: no-store`.

### Task 3: Frontend console

- [x] **Step 1: Criar pagina**

Criar `PaginaAnaniGovernance` consumindo `/governance/anani/read-models`.

- [x] **Step 2: Criar rota oculta**

Registrar `/app/governance/anani` fora de `rotasComerciais` e `rotasAdminSistema`.

- [x] **Step 3: Guardar por papel**

Adicionar `usuarioPodeGovernarAnani` e `requerGovernancaAnani`.

### Task 4: Testar

- [x] **Step 1: Teste unitario backend**

`anani-read-models.test.ts` cobre calculo dos tres read models.

- [x] **Step 2: Teste HTTP backend**

`anani-governance-http.test.ts` cobre endpoint interno e no-store.

- [x] **Step 3: Teste frontend**

`anani-governance-ui.test.ts` cobre rota oculta, guarda e endpoint.

### Task 5: Validar

- [x] **Step 1: Rodar verificacoes**

```bash
cd backend && npx vitest run src/testes/anani-read-models.test.ts src/testes/anani-governance-http.test.ts
cd frontend && npx vitest run testes/anani-governance-ui.test.ts
npm run typecheck --workspace backend
npm run typecheck --workspace frontend
```
