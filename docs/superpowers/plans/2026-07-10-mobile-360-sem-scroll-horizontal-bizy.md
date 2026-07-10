# Mobile 360 Sem Scroll Horizontal Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar a lacuna P0 de consistencia mobile sem scroll horizontal com auditoria repetivel.

**Meta global:** Capacidade melhorada: conversao.

**Architecture:** O frontend mantem rails internos onde fazem sentido, mas a pagina nao pode criar scroll horizontal em 360px. O teste e2e mede rotas publicas reais servidas pelo Vite.

**Tech Stack:** React, CSS existente, Vitest, Playwright ja presente no workspace.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-mobile-360-sem-scroll-horizontal-bizy.md`
- `docs/superpowers/plans/2026-07-10-mobile-360-sem-scroll-horizontal-bizy.md`
- `frontend/e2e/mobile-overflow.e2e.mjs`

Modify:

- `frontend/src/projetos/learning/learning.css`
- `frontend/testes/mobile-ux.test.ts`
- `frontend/package.json`
- `docs/sdd/03-roadmap-sdd.md`
- `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- `docs/sdd/domains/07-bizy-market-checkout-repasses.md`
- `docs/sdd/domains/12-frontend-ux-design-system.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`

---

### Task 1: Medir e corrigir mobile 360

**Files:**
- Modify: `frontend/src/projetos/learning/learning.css`
- Create: `frontend/e2e/mobile-overflow.e2e.mjs`
- Test: `frontend/testes/mobile-ux.test.ts`

- [x] **Step 1: Medir rotas publicas em 360px**

Verificar `/`, `/login`, `/market`, `/market/lojas`, `/checkout` e `/learning`.

- [x] **Step 2: Corrigir Learning**

Quebrar o cabecalho no mobile, manter busca em linha propria e reduzir acoes a icones em 480px.

- [x] **Step 3: Corrigir grid de formatos**

Usar uma coluna em 480px ou menos e `min-width: 0` nos cards.

- [x] **Step 4: Criar guardrail e2e**

Falhar se `scrollWidth` passar do viewport ou se houver elemento fora de containers rolaveis permitidos.

### Task 2: Atualizar SDD e wiki

**Files:**
- Modify: `docs/sdd/03-roadmap-sdd.md`
- Modify: `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- Modify: `docs/sdd/domains/07-bizy-market-checkout-repasses.md`
- Modify: `docs/sdd/domains/12-frontend-ux-design-system.md`
- Modify: `docs/wiki/pages/prioridades-lancamento-bizy.md`

- [x] **Step 1: Marcar mobile 360 sem scroll como concluido**

Atualizar checkboxes que apontam para a lacuna P0.

- [x] **Step 2: Registrar limite**

A auditoria cobre rotas publicas e guardrails de frontend; staging autenticado com dados reais fica fora deste recorte.

### Task 3: Validar

- [x] **Step 1: Rodar testes**

```bash
npx vitest run testes/mobile-ux.test.ts --root frontend
E2E_BASE_URL=http://127.0.0.1:5174 npm run test:e2e:mobile --workspace frontend
npm run typecheck --workspace frontend
git diff --check
```
