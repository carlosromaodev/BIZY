# Loja Digital Híbrida Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional hybrid Loja Digital page with a guided setup assistant and backend-persisted store configuration.

**Architecture:** Keep the public store use case intact and extend the commercial HTTP module with a detailed configuration contract. The frontend replaces the current single publication form with a CRM command center plus a responsive sheet assistant that saves into the existing business and delivery JSON fields.

**Tech Stack:** Fastify, Zod, TypeScript, React, Vite, shadcn/radix UI, lucide-react, Vitest.

---

## File Structure

- Modify `backend/src/dominio/esquemas.ts`: add detailed loja digital schemas while preserving the legacy publication schema behavior.
- Modify `backend/src/infra/http/modulos/lojaPublica.ts`: add GET config, extend PUT config, map business data into a stable frontend payload.
- Modify `backend/src/use-case/OnboardingBizyUseCase.ts`: preserve category/collection fields when creating initial products only if needed by tests.
- Add or modify backend tests in `backend/src/testes/loja-publica-tracking-http.test.ts`: cover detailed config.
- Replace `frontend/src/paginas/LojaPublica.tsx`: central page, assistant sheet, preview, CRM shortcuts.
- Modify `frontend/src/tipos.ts`: add frontend configuration types if shared typing is useful.
- Add `frontend/testes/loja-digital.test.tsx`: verify page behavior and save flow.

## Tasks

### Task 1: Backend Contract

**Files:**
- Modify: `backend/src/dominio/esquemas.ts`
- Modify: `backend/src/infra/http/modulos/lojaPublica.ts`
- Test: `backend/src/testes/loja-publica-tracking-http.test.ts`

- [ ] Add a failing backend test that authenticates, creates a product, calls `GET /loja-publica/configuracao`, then calls `PUT /loja-publica/configuracao` with detailed identity, theme, delivery and payment fields.
- [ ] Run `npm run test --workspace backend -- loja-publica-tracking-http.test.ts` and confirm the new test fails because the GET route and detailed fields do not exist.
- [ ] Add Zod schemas for `identidade`, `tema`, `entrega`, `pagamentos` and `publicacao`, allowing the legacy `slug`, `descricaoPublica`, `publicada` fields at the root.
- [ ] Implement `GET /loja-publica/configuracao` returning `configuracao`, `prontidao`, `catalogo` and `publicacao`.
- [ ] Extend `PUT /loja-publica/configuracao` to merge detailed fields into the current business via `onboardingBizy.salvarNegocio`, then call `lojaPublica.publicarLoja` with normalized slug/publication fields.
- [ ] Run the backend test and keep existing loja-publica tests passing.

### Task 2: Frontend Page And Assistant

**Files:**
- Replace: `frontend/src/paginas/LojaPublica.tsx`
- Test: `frontend/testes/loja-digital.test.tsx`

- [ ] Add a frontend test that mocks `/loja-publica/configuracao`, `/loja-publica/tracking/resumo` and `/pecas`, then renders the page and expects “Loja Digital”, “Configurar loja”, publication state and checkout metrics.
- [ ] Run `npm run test --workspace frontend -- loja-digital.test.tsx` and confirm it fails because the new UI does not exist.
- [ ] Replace the page with a command center: header actions, operational metrics, readiness checklist, public link, funil, origin list and CRM shortcuts.
- [ ] Add `LojaConfigSheet` with five steps: identity, products, delivery, payment, publish.
- [ ] Add `PreviewLojaMobile` for desktop and compact summary for mobile.
- [ ] Implement save/publish/copy/open actions using `requisitarApi`.
- [ ] Run the frontend test and relevant existing tests.

### Task 3: Responsive Verification

**Files:**
- Use existing frontend files from Task 2.

- [ ] Run `npm run typecheck --workspace frontend`.
- [ ] Run `npm run build --workspace frontend`.
- [ ] Start the frontend dev server if needed and inspect `/app/loja-publica` on desktop and mobile with Playwright or equivalent browser screenshots.
- [ ] Fix overflow, unreadable text, weak contrast or modal layout issues.

## Self-Review

- Spec coverage: backend persistence, central page, assistant, preview, desktop/mobile and tests are covered.
- Placeholder scan: no deferred behavior is required for V1.
- Type consistency: route and frontend names use `configuracao`, `identidade`, `tema`, `entrega`, `pagamentos`, `publicacao`, `prontidao`, `catalogo`.
