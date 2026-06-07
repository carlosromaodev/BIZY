# Bizy Market Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first backend slice of Bizy Market: a public discovery API that lists eligible products from published stores with sanitized supplier data and basic filters.

**Architecture:** Add a small `BizyMarketUseCase` that composes existing `RepositorioAutenticacao` and `RepositorioPecas`. Add a public HTTP module under `/publico/market/produtos`, register it in the module manifest, and extend repositories with `listarNegociosPublicados()` so the use case can join products to stores without new database tables.

**Tech Stack:** TypeScript, Fastify, Vitest, Prisma/in-memory repositories.

---

### Task 1: Checklist And First HTTP Contract

**Files:**
- Modify: `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
- Test: `backend/src/testes/bizy-market-http.test.ts`

- [x] **Step 1: Convert formal requirements to checkboxes**

Run:

```bash
perl -0pi -e 's/^- \*\*((?:RF|RNF|RN)-\d+)\*\*/- [ ] **$1**/mg' docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md
```

Expected: RF/RNF/RN bullets become checklist items.

- [x] **Step 2: Write the failing HTTP test**

Create `backend/src/testes/bizy-market-http.test.ts` with a memory-backed app test that:

- creates two authenticated stores;
- creates products in both stores;
- publishes both stores;
- calls `GET /publico/market/produtos?categoria=Roupas&busca=vestido`;
- expects only eligible products from published stores;
- expects sanitized supplier data and no `negocioId`, `custoEmKwanza` or `margemEstimadaEmKwanza`;
- expects filters and category summary in the response.

- [x] **Step 3: Run test to verify RED**

Run:

```bash
npx vitest run src/testes/bizy-market-http.test.ts
```

Expected: FAIL because `/publico/market/produtos` is not registered.

### Task 2: Market Use Case And Repositories

**Files:**
- Modify: `backend/src/dominio/repositorios/contratos.ts`
- Modify: `backend/src/use-case/repositorios/RepositorioMemoria.ts`
- Modify: `backend/src/use-case/repositorios/RepositorioPrisma.ts`
- Create: `backend/src/use-case/BizyMarketUseCase.ts`

- [x] **Step 1: Extend authentication repository**

Add `listarNegociosPublicados(): Promise<NegocioBizy[]>` to `RepositorioAutenticacao`.

- [x] **Step 2: Implement memory repository**

Return businesses with `lojaPublicadaEm` and `slugPublico`, sorted by `nomeComercial`.

- [x] **Step 3: Implement Prisma repository**

Use `prisma.negocio.findMany({ where: { lojaPublicadaEm: { not: null }, slugPublico: { not: null } }, orderBy: { nomeComercial: "asc" } })`.

- [x] **Step 4: Create `BizyMarketUseCase`**

Implement:

```ts
listarProdutos(filtros: FiltrosBizyMarket): Promise<RespostaBizyMarket>
```

Rules:

- only stores with public slug and publication date enter;
- only products with stock, not archived, not sold/esgotada, with image, price and category enter;
- search matches product code, sku, name, description, category, collection and store name;
- filters support `busca`, `categoria`, `provincia`, `municipio`, `loja` and `limite`;
- response includes sanitized product, sanitized store, `urlProduto`, `urlLoja`, `filtros` and category counts.

### Task 3: Public HTTP Module

**Files:**
- Create: `backend/src/infra/http/modulos/market.ts`
- Modify: `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- Modify: `backend/src/infra/http/ContextoAplicacao.ts`

- [x] **Step 1: Add use case to context**

Instantiate `BizyMarketUseCase` with `repositorios.autenticacao` and `repositorios.pecas`.

- [x] **Step 2: Register market module**

Add `moduloMarket` to `modulosHttp`.

- [x] **Step 3: Add public route**

`GET /publico/market/produtos` should parse query params and call `contexto.bizyMarket.listarProdutos`.

- [x] **Step 4: Run GREEN tests**

Run:

```bash
npx vitest run src/testes/bizy-market-http.test.ts
```

Expected: PASS.

### Task 4: Verification And Documentation

**Files:**
- Modify: `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
- Modify: `docs/wiki/pages/bizy-market-lojas-digitais.md`
- Modify: `docs/wiki/log.md`

- [x] **Step 1: Mark delivered requirements**

Mark `[x]` only for backend foundation requirements covered by the test, such as public Market service, listing products across stores, category navigation/filtering, search, supplier visibility, profile URL, and basic eligibility rules.

- [x] **Step 2: Run verification**

Run:

```bash
npx vitest run src/testes/bizy-market-http.test.ts
npm run typecheck --workspace backend
```

Expected: both commands exit 0.

- [x] **Step 3: Update wiki**

Append a log entry explaining the first backend slice and link the test/use case.
