# BIZY Design System

## Direction & Feel

**Who:** Lojistas angolanos — vendedoras de roupa, artesãos, pequenos negócios — que gerem stock e vendas entre atendimentos no WhatsApp. Mobile-first, tempo limitado.

**Feel:** Vitrine organizada — visual, táctil, mercadoria à frente. Quente como papel artesanal, preciso como uma etiqueta de preço. Denso sem ser sufocante.

**Signature:** O produto (foto, preço, estado) é sempre protagonista. Métricas são contexto secundário, nunca decoração.

## Tokens (Studio)

```css
--studio-paper: #f7f5ee       /* canvas — fundo da página */
--studio-surface: #ffffff      /* cards, blocos elevados */
--studio-ink: #17211c          /* texto primário */
--studio-muted: #657168        /* texto secundário, labels */
--studio-line: #dedbd2         /* bordas, separadores */
--studio-line-soft: #ece7dc    /* separadores subtis */
--studio-green: #0e8c68        /* acento, acções, estados activos */
--studio-green-soft: #e9f6ef   /* fundo de elementos activos */
```

Semantic data-tom attributes:
- `data-tom="aviso"` → `#b45309` (amber/warning)
- `data-tom="perigo"` → `#be123c` (rose/danger)

## Depth Strategy

**Borders-only.** 1px `var(--studio-line)`. Sem sombras nos cards — a foto do produto é a cor, o card é moldura silenciosa. Hover = border-color shift com `color-mix(in srgb, var(--studio-green) 36%, var(--studio-line))`.

## Spacing

Base unit: **4px**. Scale: 4, 6, 8, 10, 12, 14, 16, 24, 32, 48.

## Typography

System stack. Sizes:
- Page title: 20px / 800
- Card name: 13px / 700
- Price: 14–18px / 800, `font-variant-numeric: tabular-nums`
- Body/meta: 12.5px / 400–600
- Labels: 11px / 400, `letter-spacing: 0.01em`
- Badges: 10px / 700, uppercase

## Border Radius

- Cards, panels: 8px
- Inputs, tabs, badges: 6–7px
- Pills (counts): full round (9px on 18px height)
- Small badges: 4px

## Component Patterns

### Strip numérica (`.cat-strip` / `.ped-kpis`)
KPIs compactos num bloco único — células separadas por 1px gap com fundo `--studio-line`. Cada célula: valor grande (18px/800) + label pequeno (11px). Condicional `data-tom` para alertas. Mobile: 2x2 wrap.

### Tabs horizontais (`.cat-tab`)
Segmented navigation com scroll horizontal. Inactive: transparent bg, muted text. Active: `--studio-green-soft` bg, `--studio-green` text, border sutil. Cada tab pode ter pill counter (`.cat-tab-count`).

### Grelha densa (`.cat-grid`)
Products: 2col mobile → 3col tablet → 4col desktop → 5col ultrawide. Gap: 12–14px. Cards com `aspect-ratio: 1/1` photo area.

### Cards de produto (`.cat-card`)
Photo square → body (name, meta, price + actions). Badge de stock na foto (top-left), contador de unidades (top-right, dark pill). Actions: 28px icon buttons, visible on card, hover = green-soft bg.

### Filtros segmentados (`.ped-filter`)
Compact buttons with count pills. Active = green text + green-soft bg. Used in Pedidos page.

### Tabela (`.ped-tbl`)
Grid-based table. 11px uppercase header on cream background. 14px body rows. Hover state on rows.

### Coleções (`.bz-colecoes-*`)
Collapsible panel with Studio tokens. Border-radius 8px. Items with inline rename/delete actions.

## Namespaces

- `.st-*` — Studio (LojaPublica)
- `.cat-*` — Catálogo (Produtos)
- `.ped-*` — Pedidos
- `.crm-v3-*` — Dashboard CRM (legacy, migrating)
- `.bz-*` — Bizy shared components

## Avoid

- KpiCard/KpiGrid genérico quando uma strip numérica compacta serve
- Gradientes decorativos em backgrounds de foto
- Hover translateY em cards — cosmético sem utilidade
- Sombras em grelhas densas — bordas bastam
- Animações pesadas, sparkles, meteors
