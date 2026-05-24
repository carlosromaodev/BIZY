2# Bizy Design Interno Comércio Suave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a direção visual Comércio suave ao frontend interno do Bizy com cores melhores, layout mais organizado, animações consistentes, modais/sheets premium e experiência mobile/desktop verificável.

**Architecture:** A mudança deve partir do design system global em `frontend/src/estilos.css` e dos componentes centrais em `frontend/src/componentes/Shell.tsx`, evitando refatorar regra de negócio. As páginas devem receber classes/composições pequenas apenas quando o CSS global não for suficiente. shadcn/ui continua a ser a base de componentes.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Radix UI, lucide-react, Vitest, Playwright via Node/Chrome.

---

## File Structure

- Modify: `frontend/src/estilos.css`
  - Responsável por tokens Comércio suave, estados semânticos, surfaces, sombras, motion, shadcn global polish, Dialog/AlertDialog/Sheet e padrões de listas.
- Modify: `frontend/src/componentes/Shell.tsx`
  - Responsável por shell desktop/mobile, navegação, cabeçalho e componentes reutilizáveis `CabecalhoPagina`, `ResumoIndicadores`, `EstadoVazio`.
- Modify: `frontend/src/paginas/Conversas.tsx`
  - Responsável pelo layout de atendimento, lista/detalhe, chat mobile imersivo e composer.
- Modify: `frontend/src/paginas/Clientes.tsx`
  - Responsável por lista comercial de clientes, filtros e ações.
- Modify: `frontend/src/paginas/Reservas.tsx`
  - Responsável por lista comercial de pedidos e estados de pagamento.
- Modify: `frontend/src/paginas/Painel.tsx`
  - Responsável por dashboard operacional e blocos principais.
- Modify: `frontend/src/paginas/Catalogo.tsx`
  - Responsável por produto/lista/ações.
- Modify: `frontend/src/paginas/Comentarios.tsx`
  - Responsável por filtros, comentários e AlertDialog de limpeza.
- Create: `frontend/testes/comercio-suave-design.test.ts`
  - Contrato estático do design system, modais, motion e páginas críticas.

---

### Task 1: Contrato Visual Comércio Suave

**Files:**
- Create: `frontend/testes/comercio-suave-design.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/testes/comercio-suave-design.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("design interno Comercio suave", () => {
  it("define tokens globais de Comercio suave e motion acessivel", () => {
    const css = source("src/estilos.css");

    [
      "Bizy Commerce Soft System",
      "--commerce-bg:",
      "--commerce-surface:",
      "--commerce-surface-raised:",
      "--commerce-border:",
      "--commerce-shadow-card:",
      "--commerce-shadow-modal:",
      "--commerce-green:",
      "--commerce-green-soft:",
      "--commerce-wine:",
      "--commerce-warning-soft:",
      "--commerce-danger-soft:",
      "--motion-ui-fast:",
      "--motion-ui-medium:",
      "--motion-ui-spring:",
      "@media (prefers-reduced-motion: reduce)"
    ].forEach((token) => expect(css).toContain(token));
  });

  it("aplica shadcn premium em cards, botoes, campos, badges, dialogs e sheets", () => {
    const css = source("src/estilos.css");

    [
      "Bizy Shadcn Commerce Polish",
      '[data-slot="card"]',
      '[data-slot="button"]',
      '[data-slot="input"]',
      '[data-slot="textarea"]',
      '[data-slot="badge"]',
      '[data-slot="dialog-content"]',
      '[data-slot="alert-dialog-content"]',
      '[data-slot="sheet-content"]',
      "backdrop-filter: blur",
      "animation: bizy-modal-pop"
    ].forEach((trecho) => expect(css).toContain(trecho));
  });

  it("usa padroes internos de organizacao em shell e paginas criticas", () => {
    const shell = source("src/componentes/Shell.tsx");
    const conversas = source("src/paginas/Conversas.tsx");
    const clientes = source("src/paginas/Clientes.tsx");
    const reservas = source("src/paginas/Reservas.tsx");
    const painel = source("src/paginas/Painel.tsx");
    const catalogo = source("src/paginas/Catalogo.tsx");
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(shell).toContain("app-commerce-shell");
    expect(shell).toContain("app-commerce-nav");
    expect(shell).toContain("app-commerce-summary");
    expect(conversas).toContain("conversas-commerce-layout");
    expect(conversas).toContain("chat-commerce-composer");
    expect(clientes).toContain("crm-commerce-list");
    expect(reservas).toContain("reservas-commerce-list");
    expect(painel).toContain("painel-commerce-grid");
    expect(catalogo).toContain("catalogo-commerce-list");
    expect(comentarios).toContain("comentarios-commerce-list");
  });

  it("mantem modais destrutivos com copy clara e acao perigosa isolada", () => {
    const comentarios = source("src/paginas/Comentarios.tsx");

    expect(comentarios).toContain("AlertDialogContent");
    expect(comentarios).toContain("Esta ação remove");
    expect(comentarios).toContain('variant="destructive"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm test -- comercio-suave-design.test.ts
```

Expected: FAIL because `Bizy Commerce Soft System`, `app-commerce-shell`, page classes and modal copy are not implemented yet.

- [ ] **Step 3: Preserve the RED state for the next task**

Leave the failing test in place for Task 2 and Task 3 to satisfy.

---

### Task 2: Global Tokens, shadcn Polish and Motion

**Files:**
- Modify: `frontend/src/estilos.css`
- Test: `frontend/testes/comercio-suave-design.test.ts`

- [ ] **Step 1: Add Comércio suave tokens**

In `frontend/src/estilos.css`, add this block after the current root token block or before `Reset / Base`:

```css
/* ============================================
   Bizy Commerce Soft System
   ============================================ */

:root {
  --commerce-bg: #fbfaf8;
  --commerce-surface: #fffdf9;
  --commerce-surface-muted: #f7f1eb;
  --commerce-surface-raised: #ffffff;
  --commerce-border: #e8e0da;
  --commerce-border-strong: #d7c8be;
  --commerce-text: #15151b;
  --commerce-text-muted: #4b5563;
  --commerce-wine: #971A58;
  --commerce-wine-hover: #7a1246;
  --commerce-wine-soft: #f4d8e7;
  --commerce-green: #166534;
  --commerce-green-hover: #14532d;
  --commerce-green-soft: #e8f5ee;
  --commerce-warning: #92400e;
  --commerce-warning-soft: #fff4dc;
  --commerce-danger: #991b1b;
  --commerce-danger-soft: #fff1f1;
  --commerce-info: #1e3a8a;
  --commerce-info-soft: #edf4ff;
  --commerce-shadow-card: 0 14px 34px rgb(64 45 32 / 0.08);
  --commerce-shadow-lift: 0 20px 46px rgb(64 45 32 / 0.14);
  --commerce-shadow-modal: 0 28px 80px rgb(17 24 39 / 0.24), 0 0 0 1px rgb(151 26 88 / 0.08);
  --commerce-radius-card: 18px;
  --commerce-radius-panel: 22px;
  --commerce-radius-modal: 24px;
  --motion-ui-fast: 160ms;
  --motion-ui-medium: 260ms;
  --motion-ui-spring: cubic-bezier(0.2, 0.9, 0.24, 1);

  --background: var(--commerce-bg);
  --foreground: var(--commerce-text);
  --card: var(--commerce-surface-raised);
  --card-foreground: var(--commerce-text);
  --popover: var(--commerce-surface-raised);
  --popover-foreground: var(--commerce-text);
  --primary: var(--commerce-wine);
  --primary-foreground: #ffffff;
  --secondary: var(--commerce-surface-muted);
  --secondary-foreground: var(--commerce-text);
  --muted: var(--commerce-surface-muted);
  --muted-foreground: var(--commerce-text-muted);
  --accent: var(--commerce-wine-soft);
  --accent-foreground: #6d0f3d;
  --border: var(--commerce-border);
  --input: var(--commerce-border-strong);
  --ring: var(--commerce-wine);
  --success: var(--commerce-green);
  --success-muted: var(--commerce-green-soft);
  --warning: var(--commerce-warning);
  --warning-muted: var(--commerce-warning-soft);
  --destructive: var(--commerce-danger);
  --info: var(--commerce-info);
  --info-muted: var(--commerce-info-soft);
}
```

- [ ] **Step 2: Add global keyframes and shadcn polish**

Add this block after the existing shadcn semantic polish:

```css
@keyframes bizy-modal-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes bizy-soft-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============================================
   Bizy Shadcn Commerce Polish
   ============================================ */

body {
  background:
    radial-gradient(circle at top left, rgb(151 26 88 / 0.045), transparent 320px),
    var(--commerce-bg);
}

body [data-slot="card"] {
  border-color: var(--commerce-border);
  border-radius: var(--commerce-radius-card);
  background: linear-gradient(180deg, var(--commerce-surface-raised), var(--commerce-surface));
  box-shadow: var(--commerce-shadow-card);
}

body [data-slot="button"] {
  border-radius: 12px;
  transition: transform var(--motion-ui-fast) var(--motion-ui-spring), box-shadow var(--motion-ui-fast) ease, background-color var(--motion-ui-fast) ease;
}

body [data-slot="button"]:active {
  transform: scale(0.97);
}

body [data-slot="input"],
body [data-slot="textarea"],
body [data-slot="select-trigger"] {
  border-color: var(--commerce-border);
  background: var(--commerce-surface-raised);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.65);
}

body [data-slot="badge"] {
  border-radius: 999px;
  font-weight: 800;
}

body [data-slot="dialog-content"],
body [data-slot="alert-dialog-content"] {
  border-color: rgb(151 26 88 / 0.12);
  border-radius: var(--commerce-radius-modal);
  background: linear-gradient(180deg, #ffffff, var(--commerce-surface));
  box-shadow: var(--commerce-shadow-modal);
  animation: bizy-modal-pop var(--motion-ui-medium) var(--motion-ui-spring) both;
}

body [data-slot="dialog-overlay"],
body [data-slot="alert-dialog-overlay"],
body [data-slot="sheet-overlay"] {
  background: rgb(21 21 27 / 0.36);
  backdrop-filter: blur(8px);
}

body [data-slot="sheet-content"] {
  border-color: var(--commerce-border);
  background: linear-gradient(180deg, #ffffff, var(--commerce-surface));
  box-shadow: var(--commerce-shadow-modal);
}
```

- [ ] **Step 3: Add reduced motion protection**

Ensure this exists once in `frontend/src/estilos.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd frontend && npm test -- comercio-suave-design.test.ts
```

Expected: FAIL only on the organization and modal assertions that depend on Tasks 3-5. Token and shadcn assertions pass.

---

### Task 3: Shell and Shared Components

**Files:**
- Modify: `frontend/src/componentes/Shell.tsx`
- Modify: `frontend/src/estilos.css`
- Test: `frontend/testes/comercio-suave-design.test.ts`

- [ ] **Step 1: Add shell classes**

In `frontend/src/componentes/Shell.tsx`, update:

```tsx
<div className="min-h-dvh bg-background text-foreground">
```

to:

```tsx
<div className="app-commerce-shell min-h-dvh bg-background text-foreground">
```

Update the mobile dock `nav` class to include `app-commerce-nav`:

```tsx
<nav className="app-commerce-nav app-mobile-dock app-mobile-nav-island fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border bg-background/95 p-1 shadow-lg backdrop-blur lg:hidden" aria-label="Atalhos principais">
```

Update `ResumoIndicadores` section:

```tsx
<section aria-label={rotulo} className={cn("app-commerce-summary", className)}>
```

- [ ] **Step 2: Add shell CSS**

In `frontend/src/estilos.css`, add after `Bizy Live Layout`:

```css
body .app-commerce-shell {
  background: var(--commerce-bg);
}

body .app-commerce-nav.app-mobile-nav-island {
  background: #15151b;
  box-shadow: 0 24px 48px rgb(21 21 27 / 0.26);
}

body .app-mobile-brand-pill,
body .app-mobile-menu-button,
body .app-desktop-sidebar,
body .app-desktop-usuario {
  border-color: var(--commerce-border);
  background: rgb(255 253 249 / 0.86);
}

body .app-nav-link[aria-current="page"],
body .app-mobile-nav-island .app-mobile-nav-item.bg-primary {
  background: var(--commerce-wine);
  color: #ffffff;
}

body .app-commerce-summary [data-slot="card"] {
  overflow: hidden;
  border-radius: var(--commerce-radius-panel);
  background: var(--commerce-surface-raised);
  box-shadow: var(--commerce-shadow-card);
}

body .app-commerce-summary strong {
  color: var(--commerce-text);
}

body .app-commerce-summary [class*="text-success"],
body .app-commerce-summary .text-success {
  color: var(--commerce-green);
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
cd frontend && npm test -- comercio-suave-design.test.ts mobile-ux.test.ts
```

Expected: Shell assertions pass. Existing mobile UX tests still pass.

---

### Task 4: Critical Page Organization Classes

**Files:**
- Modify: `frontend/src/paginas/Conversas.tsx`
- Modify: `frontend/src/paginas/Clientes.tsx`
- Modify: `frontend/src/paginas/Reservas.tsx`
- Modify: `frontend/src/paginas/Painel.tsx`
- Modify: `frontend/src/paginas/Catalogo.tsx`
- Modify: `frontend/src/paginas/Comentarios.tsx`
- Modify: `frontend/src/estilos.css`
- Test: `frontend/testes/comercio-suave-design.test.ts`

- [ ] **Step 1: Add page classes**

Add these class names to the main containers:

```tsx
// Conversas.tsx
<section className="conversas-commerce-layout grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
<form className="chat-commerce-composer fixed inset-x-3 bottom-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 grid gap-3 rounded-lg border bg-background p-3 shadow-lg lg:sticky lg:inset-x-auto lg:bottom-4 lg:z-auto lg:shadow-sm" onSubmit={(e) => void enviarMensagem(e)}>

// Clientes.tsx
<div className="crm-commerce-list grid gap-3">

// Reservas.tsx
<div className="reservas-commerce-list grid gap-3">

// Painel.tsx
<section className="painel-commerce-grid grid gap-4">

// Catalogo.tsx
<div className="catalogo-commerce-list grid gap-3">

// Comentarios.tsx
<div className="comentarios-commerce-list grid gap-3">
```

If the exact container already has other classes, append the new class without removing existing layout utilities.

- [ ] **Step 2: Add page organization CSS**

Add this block to `frontend/src/estilos.css`:

```css
body :is(.crm-commerce-list, .reservas-commerce-list, .catalogo-commerce-list, .comentarios-commerce-list) [data-slot="card"] {
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, var(--commerce-surface));
  box-shadow: 0 10px 24px rgb(64 45 32 / 0.06);
}

body :is(.crm-commerce-list, .reservas-commerce-list, .catalogo-commerce-list, .comentarios-commerce-list) [data-slot="card"]:hover {
  border-color: var(--commerce-border-strong);
  box-shadow: var(--commerce-shadow-lift);
}

body .painel-commerce-grid > [data-slot="card"],
body .conversas-commerce-layout > [data-slot="card"] {
  border-radius: var(--commerce-radius-panel);
}

body .chat-commerce-composer {
  border-color: var(--commerce-border);
  border-radius: 22px;
  background: rgb(255 253 249 / 0.94);
  box-shadow: 0 18px 46px rgb(64 45 32 / 0.16);
  backdrop-filter: blur(14px);
}

body .chat-commerce-composer [data-slot="textarea"] {
  min-height: 52px;
  border-radius: 16px;
}
```

- [ ] **Step 3: Run page contract tests**

Run:

```bash
cd frontend && npm test -- comercio-suave-design.test.ts mobile-ux.test.ts
```

Expected: All Comércio suave static assertions pass.

---

### Task 5: Modals, AlertDialog and Copy

**Files:**
- Modify: `frontend/src/paginas/Comentarios.tsx`
- Modify: `frontend/src/estilos.css`
- Test: `frontend/testes/comercio-suave-design.test.ts`

- [ ] **Step 1: Improve destructive dialog copy and action variant**

In `frontend/src/paginas/Comentarios.tsx`, update the clear dialog description to include:

```tsx
<AlertDialogDescription>
  Esta ação remove comentários capturados, mensagens de atendimento associadas e estados de envio usados nos testes. Usa apenas quando precisares reiniciar a operação de teste.
</AlertDialogDescription>
```

Update `AlertDialogAction` to:

```tsx
<AlertDialogAction
  variant="destructive"
  onClick={() => void limparDados()}
>
  Limpar dados
</AlertDialogAction>
```

Keep `AlertDialogCancel` before the destructive action.

- [ ] **Step 2: Add destructive modal CSS**

In `frontend/src/estilos.css`, add:

```css
body [data-slot="alert-dialog-content"] [data-slot="alert-dialog-title"] {
  color: var(--commerce-text);
}

body [data-slot="alert-dialog-content"] [data-slot="alert-dialog-description"] {
  color: var(--commerce-text-muted);
  line-height: 1.6;
}

body [data-slot="alert-dialog-content"] :is([data-slot="button"][data-variant="destructive"], [data-slot="alert-dialog-action"][data-variant="destructive"]) {
  background: var(--commerce-danger);
  color: #ffffff;
  box-shadow: 0 12px 28px rgb(153 27 27 / 0.22);
}
```

- [ ] **Step 3: Run modal tests**

Run:

```bash
cd frontend && npm test -- comercio-suave-design.test.ts
```

Expected: Modal copy and destructive action assertions pass.

---

### Task 6: Visual Verification and Regression

**Files:**
- No production files.
- Use existing dev server or run Vite.

- [ ] **Step 1: Run full test suite**

Run:

```bash
cd frontend && npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
cd frontend && npm run build
```

Expected: build exits 0. A Vite chunk-size warning is acceptable unless it becomes an error.

- [ ] **Step 3: Start frontend dev server**

Run:

```bash
cd frontend && npm run dev -- --port 5173
```

Expected: Vite prints a local URL. If 5173 is busy, use the next printed port.

- [ ] **Step 4: Verify mobile and desktop with browser**

Use Node Playwright with system Chrome, adapting the port from Step 3:

```bash
cd frontend && node --input-type=module - <<'JS'
import { chromium } from 'playwright';

const base = process.env.BIZY_VISUAL_URL ?? 'http://localhost:5173';
const payloads = new Map([
  ['/atendimento/conversas', { conversas: [] }],
  ['/reservas', []],
  ['/pecas', []],
]);

async function api(route) {
  const { pathname } = new URL(route.request().url());
  await route.fulfill({
    status: pathname === '/eventos' ? 204 : 200,
    headers: { 'content-type': 'application/json' },
    body: pathname === '/eventos' ? '' : JSON.stringify(payloads.get(pathname) ?? {})
  });
}

async function openPage(browser, viewport, path, isMobile = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: isMobile ? 2 : 1, isMobile });
  const page = await context.newPage();
  await page.route('http://localhost:3333/**', api);
  await page.addInitScript(() => {
    localStorage.setItem('emeu_token', 'token-visual');
    localStorage.setItem('emeu_usuario', JSON.stringify({ id: 'visual', nome: 'Carlos Bizy', telefone: '923456789', papel: 'ADMIN' }));
  });
  await page.goto(`${base}${path}`);
  await page.waitForLoadState('networkidle');
  return { context, page };
}

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome' });

const mobile = await openPage(browser, { width: 390, height: 844 }, '/app/clientes', true);
await mobile.page.screenshot({ path: '/tmp/bizy-commerce-clientes-mobile.png', fullPage: true });
console.log('mobile', await mobile.page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > innerWidth,
  title: document.querySelector('h1')?.textContent,
  dock: getComputedStyle(document.querySelector('.app-mobile-dock')).opacity
})));
await mobile.context.close();

const desktop = await openPage(browser, { width: 1440, height: 900 }, '/app/clientes');
await desktop.page.screenshot({ path: '/tmp/bizy-commerce-clientes-desktop.png', fullPage: true });
console.log('desktop', await desktop.page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > innerWidth,
  title: document.querySelector('h1')?.textContent,
  sidebarWidth: Math.round(document.querySelector('.app-desktop-sidebar')?.getBoundingClientRect().width ?? 0)
})));
await desktop.context.close();

await browser.close();
JS
```

Expected:
- `overflow` is `false` on mobile and desktop.
- Mobile screenshot shows Comércio suave surfaces and readable hierarchy.
- Desktop screenshot shows sidebar, content and metric blocks aligned.

---

## Self-Review

- Spec coverage: tokens, layout, motion, modals, shadcn, shell, pages critical, verification are covered.
- Placeholder scan: no placeholder markers or vague implementation-only steps are present.
- Type consistency: all referenced files and classes are defined in earlier tasks before use.
- Known repository issue: `/home/carlos/Documentos/project/ÉMeu/.git` exists as an empty directory, so commit steps are intentionally omitted until the repository metadata is repaired.
