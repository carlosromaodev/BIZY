# Checkout Visual Publico Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar a experiencia visual do checkout publico sem mudar o contrato backend.

**Meta global:** Capacidade melhorada: conversao.

**Architecture:** A tela `/checkout` continua usando carrinho local, idempotencia e endpoints existentes. A mudanca e de frontend: passos, resumo, quantidade, revisao e estilos responsivos.

**Tech Stack:** React, TypeScript, CSS existente, Vitest por contrato textual.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-checkout-visual-publico-bizy.md` - especificacao do recorte.
- `docs/superpowers/plans/2026-07-10-checkout-visual-publico-bizy.md` - plano de execucao.

Modify:

- `frontend/src/projetos/market/paginas/CheckoutBizy.tsx` - experiencia visual do checkout.
- `frontend/src/estilos.css` - estilos responsivos do checkout.
- `frontend/testes/checkout-unificado.test.ts` - contrato de checkout visual.
- `docs/sdd/03-roadmap-sdd.md` - checklist P0.
- `docs/sdd/domains/06-catalogo-stock-loja-publica.md` - checklist do dominio.
- `docs/wiki/pages/prioridades-lancamento-bizy.md` - nota de prioridade.

Reference only:

- `docs/wiki/pages/visao-produto-bizy.md` - visao unificada.
- `docs/wiki/pages/bizy-market-frontend-lojas.md` - contexto de frontend Market/checkout.

---

### Task 1: Completar UI do checkout publico

**Files:**
- Modify: `frontend/src/projetos/market/paginas/CheckoutBizy.tsx`
- Modify: `frontend/src/estilos.css`
- Test: `frontend/testes/checkout-unificado.test.ts`

- [x] **Step 1: Adicionar passos visuais**

Exibir carrinho, dados, entrega, pagamento e revisao com estado ativo.

- [x] **Step 2: Completar carrinho visual**

Mostrar fornecedor, subtotal, variantes, ajuste de quantidade e total por item.

- [x] **Step 3: Completar resumo e revisao**

Mostrar total, fornecedores, pagamento, entrega e pendencias antes de finalizar.

- [x] **Step 4: Validar**

Run:

```bash
cd frontend && npx vitest run testes/checkout-unificado.test.ts
cd ..
npm run typecheck --workspace frontend
git diff --check
```

Expected: teste focado, typecheck e diff-check passam.

### Task 2: Atualizar SDD e wiki

**Files:**
- Modify: `docs/sdd/03-roadmap-sdd.md`
- Modify: `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- Modify: `docs/wiki/pages/prioridades-lancamento-bizy.md`

- [x] **Step 1: Marcar P0 como concluido**

Atualizar checkboxes de checkout visual publico.

- [x] **Step 2: Registrar limite tecnico**

Declarar que provider online, perfil autenticado e repasses avancados ficam fora deste recorte.
