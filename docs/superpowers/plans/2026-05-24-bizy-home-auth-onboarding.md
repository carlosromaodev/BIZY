# Bizy Home, Auth And Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a home, substituir o login simples por uma experiência com telefone, Gmail e login estudantil, e criar a base de onboarding de usuário, negócio e primeiro produto.

**Architecture:** O backend passa a tratar identidade como camada separada do telefone, preservando o login SMS existente. O login estudantil usa o UOR Connect como autoridade externa quando configurado, e o onboarding grava dados do negócio antes da operação real. O frontend ganha home mais comercial, login por modos e fluxo de criação de negócio.

**Tech Stack:** React, Vite, shadcn/ui, Fastify, Prisma, PostgreSQL, Vitest.

---

### Task 1: Backend Auth Identity And Onboarding Foundation

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/dominio/tipos.ts`
- Modify: `backend/src/dominio/esquemas.ts`
- Modify: `backend/src/dominio/repositorios/contratos.ts`
- Modify: `backend/src/use-case/repositorios/RepositorioMemoria.ts`
- Modify: `backend/src/use-case/repositorios/RepositorioPrisma.ts`
- Create: `backend/src/use-case/AutenticacaoEstudantilUseCase.ts`
- Create: `backend/src/use-case/OnboardingBizyUseCase.ts`
- Modify: `backend/src/infra/http/ContextoAplicacao.ts`
- Modify: `backend/src/infra/http/modulos/autenticacao.ts`

- [ ] **Step 1: Write failing tests**

Add tests proving student login creates a Bizy session and onboarding stores a business with the authenticated user.

- [ ] **Step 2: Implement backend models and repository methods**

Add auth identities, academic profile, business, business member and onboarding repository operations.

- [ ] **Step 3: Add routes**

Expose `POST /auth/estudantil/login`, `GET /onboarding/estado`, `POST /onboarding/negocio` and `POST /onboarding/produto-inicial`.

- [ ] **Step 4: Verify backend**

Run focused Vitest tests and backend typecheck.

### Task 2: Frontend Home, Login And Onboarding

**Files:**
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/rotasApp.tsx`
- Modify: `frontend/src/paginas/Home.tsx`
- Modify: `frontend/src/paginas/Login.tsx`
- Create: `frontend/src/paginas/Onboarding.tsx`
- Modify: `frontend/src/estilos.css`

- [ ] **Step 1: Redesign Home**

Make the hero product-led, with Bizy as CRM for live commerce and WhatsApp operations.

- [ ] **Step 2: Redesign Login**

Provide phone, Gmail and student login modes using shadcn components and clear error states.

- [ ] **Step 3: Add Onboarding**

Create a multi-step flow for user context, business registration, channels and initial product.

- [ ] **Step 4: Verify frontend**

Run frontend build/typecheck and inspect the local UI with browser screenshots if the dev server is available.
