# SEO e Preview Social Publico Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o P0 de SEO e preview social publico nas superficies Market, Loja Publica e Learning.

**Meta global:** Capacidade melhorada: descoberta.

**Architecture:** Reaproveitar o helper existente de SEO runtime da SPA, endurecendo canonical, Open Graph, Twitter Card, fallback e cleanup. A API continua sendo fonte preferencial quando envia SEO; o frontend monta fallback apenas quando a resposta nao traz metadados.

**Tech Stack:** React, Vite, TypeScript, Vitest por teste de contrato textual.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-seo-preview-publico-bizy.md` - especificacao SDD do recorte.
- `docs/superpowers/plans/2026-07-10-seo-preview-publico-bizy.md` - plano de execucao.

Modify:

- `frontend/src/utilidades.ts` - helper central de SEO publico.
- `frontend/index.html` - meta padrao da SPA.
- `frontend/src/projetos/market/paginas/Market.tsx` - SEO Market home, categorias, lojas e loja Market.
- `frontend/src/projetos/market/paginas/ProdutoMarket.tsx` - SEO do PDP Market.
- `frontend/src/projetos/market/paginas/CatalogoPublico.tsx` - SEO de catalogo publico.
- `frontend/src/projetos/market/paginas/LojaDigitalPublica.tsx` - SEO da loja e produto publico.
- `frontend/src/projetos/learning/paginas/Learning.tsx` - SEO home e perfil Learning.
- `frontend/src/projetos/learning/paginas/ProdutoLearning.tsx` - SEO produto Learning.
- `frontend/testes/seo-publico-canonical.test.ts` - teste de contrato.
- `docs/sdd/03-roadmap-sdd.md` - checklist P0.
- `docs/sdd/domains/06-catalogo-stock-loja-publica.md` - checklist do dominio.
- `docs/wiki/pages/prioridades-lancamento-bizy.md` - nota de prioridades.

Reference only:

- `docs/wiki/pages/visao-produto-bizy.md` - visao unificada.
- `docs/superpowers/specs/2026-06-30-meta-global-bizy.md` - meta global.

---

### Task 1: Implementar SEO runtime publico

**Files:**
- Modify: `frontend/src/utilidades.ts`
- Modify: `frontend/index.html`
- Modify: paginas publicas Market/Loja/Learning
- Test: `frontend/testes/seo-publico-canonical.test.ts`

- [x] **Step 1: Consolidar helper**

Criar `montarSeoPublico`, normalizar canonical/imagem para URL absoluta em runtime e restaurar metadados anteriores no cleanup.

- [x] **Step 2: Aplicar nas paginas publicas**

Aplicar helper em Market, lojas, catalogos, produtos e Learning sem biblioteca nova.

- [x] **Step 3: Atualizar contrato de teste**

Proteger helper, meta padrao, canonical e uso nas superficies publicas.

- [x] **Step 4: Rodar verificacao**

Run:

```bash
cd frontend && npx vitest run testes/seo-publico-canonical.test.ts
cd ..
npm run typecheck --workspace frontend
git diff --check
```

Expected: teste focado e typecheck passam sem whitespace error.

### Task 2: Atualizar SDD e wiki

**Files:**
- Modify: `docs/sdd/03-roadmap-sdd.md`
- Modify: `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- Modify: `docs/wiki/pages/prioridades-lancamento-bizy.md`

- [x] **Step 1: Marcar P0 como concluido**

Atualizar checkboxes de SEO/preview social publico.

- [x] **Step 2: Registrar limite tecnico**

Explicitar que esta entrega fecha SEO runtime da SPA; prerender/SSR fica fora do recorte.
