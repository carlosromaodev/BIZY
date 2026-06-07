# Bizy Market Perfil de Loja Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir o contrato backend da loja publica para perfil social/comercial, com colecoes clicaveis, CTA para o Market e slugs reservados bloqueados.

**Architecture:** Reaproveitar `LojaPublicaUseCase` e `moduloLojaPublica`, sem criar um segundo painel ou entidade concorrente. O perfil publico continua saindo da loja atual, mas a resposta ganha blocos derivados e seguros para frontend mobile-first.

**Tech Stack:** Node.js, TypeScript, Fastify, Vitest, repositorios em memoria/Prisma existentes.

---

### Task 1: Contrato HTTP do Perfil Publico

**Files:**
- Modify: `backend/src/testes/loja-publica-tracking-http.test.ts`

- [x] **Step 1: Write the failing test**

Adicionar um teste no contrato existente que:
- tenta publicar slug reservado `market` e espera erro HTTP;
- publica uma loja valida;
- cria produtos em categoria/colecao;
- chama `GET /publico/lojas/:slug`;
- espera `perfil`, `colecoes` e `market`;
- confirma que produtos publicos continuam sem `negocioId`, `custoEmKwanza` e `margemEstimadaEmKwanza`.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/testes/loja-publica-tracking-http.test.ts -t "expõe perfil social"`
Expected: FAIL because `perfil`, `colecoes`, `market` or reserved slug validation are missing.

### Task 2: Perfil Publico no Use Case

**Files:**
- Modify: `backend/src/use-case/LojaPublicaUseCase.ts`

- [x] **Step 1: Implement minimal profile mapping**

Adicionar mapeadores privados para:
- `perfil`: avatar/capa, bio, localizacao, contadores sociais zerados, badges publicos e acoes;
- `colecoes`: colecoes derivadas por colecao/categoria/vitrine, com URLs filtraveis;
- `market`: CTA para explorar similares no Bizy Market usando categoria principal.

- [x] **Step 2: Block reserved public slugs**

Aplicar a lista de subdominios reservados ao slug de publicacao, incluindo `market`, `shop`, `checkout` e `suporte`.

- [x] **Step 3: Run focused test to verify it passes**

Run: `npx vitest run src/testes/loja-publica-tracking-http.test.ts -t "expõe perfil social"`
Expected: PASS.

### Task 3: Atualizar Requisitos e Wiki

**Files:**
- Modify: `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
- Modify: `docs/wiki/pages/bizy-market-lojas-digitais.md`
- Modify: `docs/wiki/log.md`

- [x] **Step 1: Mark delivered backend requirements**

Marcar como `[x]` apenas requisitos realmente cobertos pelo backend desta fatia.

- [x] **Step 2: Record wiki progress**

Adicionar nota de progresso sobre perfil publico enriquecido e slugs reservados.

### Task 4: Verification

**Files:**
- Test: `backend/src/testes/loja-publica-tracking-http.test.ts`
- Test: `backend/src/testes/bizy-market-http.test.ts`

- [x] **Step 1: Run focused tests**

Run:
```bash
npx vitest run src/testes/loja-publica-tracking-http.test.ts -t "expõe perfil social"
npx vitest run src/testes/bizy-market-http.test.ts
```

- [x] **Step 2: Run backend typecheck**

Run:
```bash
npm run typecheck --workspace backend
```
