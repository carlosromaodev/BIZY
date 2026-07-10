---
title: Inventario Frontend e UX
aliases:
  - Frontend UX Bizy
tags:
  - bizy/inventario
  - bizy/frontend
status: ativo
updated: 2026-07-10
---

# Inventario Frontend e UX

Status: ativo
Ultima atualizacao: 2026-07-10
Fontes principais: `frontend/src/rotasApp.tsx`, `frontend/src/paginas/`, `frontend/src/api.ts`, `frontend/src/componentes/BizyDesignSystem.tsx`, `frontend/testes/`

## Stack Frontend

- Vite 6.
- React 18.
- React Router 7.
- Tailwind CSS 4 via `@tailwindcss/vite`.
- Componentes estilo shadcn/Radix.
- Icones `lucide-react`.
- Testes Vitest em `frontend/testes/`.

## Ligacoes de Contexto

- Visao de produto e experiencia pretendida: [Memoria de Projeto do Bizy](memoria-projeto-bizy.md).
- Rotas e dados consumidos: [Inventario Backend e API HTTP](inventario-backend-api.md).
- Persistencia por tras das telas: [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Scripts, build, Docker e testes: [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).
- Norte visual e regra de densidade operacional: [Memoria Viva do Bizy](memoria-viva-bizy.md).

## Rotas Publicas Registradas

- `/` -> `PaginaEntradaPublica` (resolve `PaginaHome` ou `PaginaLojaDigitalPublica` conforme subdominio).
- `/login` -> `PaginaLogin`.
- `/lojas/:slug` -> `PaginaLojaDigitalPublica`.

## Rotas Privadas Comerciais Registradas

Hoje:

- `/app` -> `PaginaPainel` com rotulo `Comando do dia`.
- `/app/live` -> `PaginaLive` com rotulo `Central de live`.

Vendas:

- `/app/reservas` -> `PaginaReservas` com rotulo `Pedidos`.
- `/app/tarefas` -> `PaginaTarefas` com rotulo `Tarefas`.
- `/app/conversas` -> `PaginaConversas` com rotulo `Atendimento`.
- `/app/clientes` -> `PaginaClientes` com rotulo `Clientes`.
- `/app/recuperacao` -> `PaginaRecuperacao` com rotulo `Recuperacao` (modulo: automacoes).
- `/app/campanhas` -> `PaginaCampanhas` com rotulo `Campanhas` (modulo: automacoes).
- `/app/social-inbox` -> `PaginaSocialInbox` com rotulo `Social Inbox`.

CRM (requer modulo `funil` activo):

- `/app/pipeline` -> `PaginaPipeline` com rotulo `Pipeline`.
- `/app/cotacoes` -> `PaginaCotacoes` com rotulo `Cotacoes`.
- `/app/agenda` -> `PaginaAgenda` com rotulo `Agenda`.
- `/app/metas` -> `PaginaMetas` com rotulo `Metas`.
- `/app/respostas-rapidas` -> `PaginaRespostasRapidas` com rotulo `Respostas rapidas`.
- `/app/actividades` -> `PaginaActividades` com rotulo `Notas`.
- `/app/formularios` -> `PaginaFormularios` com rotulo `Formularios`.
- `/app/sequencias` -> `PaginaSequencias` com rotulo `Sequencias` (modulo: automacoes).

Vitrine:

- `/app/catalogo` -> `PaginaCatalogo` com rotulo `Produtos`.
- `/app/loja-publica` -> `PaginaLojaPublica` com rotulo `Loja Digital` (modulo: loja-publica).
- `/app/afiliados` -> `PaginaAfiliados` com rotulo `Afiliados` (modulo: afiliados).

Gestao:

- `/app/relatorios` -> `PaginaRelatorios` com rotulo `Desempenho`.
- `/app/equipa` -> `PaginaEquipa` com rotulo `Equipa`.
- `/app/pagamentos` -> `PaginaPagamentos` com rotulo `Pagamentos`.
- `/app/administracao` -> `PaginaAdministracao` com rotulo `Administracao`.

Admin/Sistema:

- `/app/comentarios` -> `PaginaComentarios` com rotulo `Live monitor`, visivel para admin/dono/owner.
- `/app/diagnosticos` -> `PaginaDiagnosticos` com rotulo `Diagnosticos SMS`, visivel para admin/dono/owner.
- `/app/auditoria` -> `PaginaAuditoria` com rotulo `Auditoria`, visivel para admin/dono/owner.

Rota privada oculta:

- `/onboarding` -> `PaginaOnboarding`.

Seccoes de navegacao: Hoje, Vendas, CRM, Vitrine, Gestao, Admin/Sistema. Rotas com `modulo` so aparecem se o modulo estiver activo no negocio. Funcao `filtrarRotasPorModulos` controla visibilidade.

## Paginas Existentes

Paginas roteadas atualmente (31 ficheiros em `frontend/src/paginas/`):

- `Home.tsx`
- `Login.tsx`
- `Onboarding.tsx`
- `Painel.tsx`
- `Live.tsx`
- `Reservas.tsx`
- `Tarefas.tsx`
- `Conversas.tsx`
- `Clientes.tsx`
- `Recuperacao.tsx`
- `Campanhas.tsx`
- `SocialInbox.tsx`
- `Pipeline.tsx`
- `Cotacoes.tsx`
- `Agenda.tsx`
- `Metas.tsx`
- `RespostasRapidas.tsx`
- `Actividades.tsx`
- `Formularios.tsx`
- `Sequencias.tsx`
- `Catalogo.tsx`
- `LojaPublica.tsx`
- `LojaDigitalPublica.tsx`
- `Afiliados.tsx`
- `Relatorios.tsx`
- `Equipa.tsx`
- `Pagamentos.tsx`
- `Administracao.tsx`
- `Comentarios.tsx`
- `Diagnosticos.tsx`
- `Auditoria.tsx`

## Shell, API e Estado de Sessao

- Shell/navegacao: `frontend/src/componentes/Shell.tsx`.
- Design system v2: `frontend/src/componentes/BizyDesignSystem.tsx`.
- Notificacoes globais: `frontend/src/componentes/Notificacoes.tsx`.
- API: `frontend/src/api.ts`.
- Tipos: `frontend/src/tipos.ts`.
- Utilidades: `frontend/src/utilidades.ts`, `frontend/src/crm.ts`.
- Marca: `frontend/src/marca/bizy.tsx`.
- Subdominio loja: `frontend/src/lojaSubdominio.ts`.

Detalhes importantes da API frontend:

- `VITE_API_URL` define base absoluta quando configurado.
- Em host local sem `VITE_API_URL`, usa caminho relativo e proxy do Vite.
- Se `VITE_API_URL` apontar para host local em ambiente nao local, e ignorado para evitar build quebrado em producao.
- Sessao guarda token/usuario em `localStorage` (`emeu_token`, `emeu_usuario`) para compatibilidade.
- Backend tambem suporta cookie HttpOnly.
- 401 autenticado dispara evento `emeu:sessao-expirada` e notificacao `bizy:notificacao`.

## Design System e Componentes

### Bizy Design System v2

O sistema de design v2 esta centralizado em `frontend/src/componentes/BizyDesignSystem.tsx`. Componentes reutilizaveis:

- `PageHead` — cabecalho de pagina com eyebrow, titulo, botao de accao.
- `KpiGrid` / `KpiCard` — grelha responsiva de metricas com variante hero (gradiente verde).
- `TableCard` — painel card para tabelas e conteudo estruturado.
- `Table` / `TableHead` / `Th` / `Td` — tabela organica com hover, badges, avatares.
- `StatusBadge` — badge semantico com dot (green/amber/blue/rose/violet/mute).
- `AvatarBizy` — avatar colorido com iniciais e cores semanticas.
- `FilterChips` — filtros pill com contagem e estado activo.
- `BotaoBizy` — botao com variantes (primario, secundario, fantasma, destrutivo).
- `Money` — formatacao monetaria com moeda.
- `CrmPageMotion` — wrapper de animacao de entrada para paginas.

### CSS v2

Tokens e classes em `frontend/src/estilos.css`:

- Fonte: Plus Jakarta Sans.
- Cores: oklch color space com semantica (green/amber/blue/rose/violet/mute).
- Border-radius: 10/16/22px.
- Sombras em camadas.
- Prefixo `bz-*` para componentes CRM internos.
- Prefixo `lp-*` para componentes da loja publica mobile.
- Blocos CSS dedicados: live stage, feed de reservas, inbox/atendimento, mini-metrics.

### Componentes internos

- `CrmInterno21st.tsx` — biblioteca CRM legacy (progressivamente substituida por BizyDesignSystem).
- `Shell.tsx` — sidebar e navegacao principal.
- `Notificacoes.tsx` — sistema de notificacoes globais.
- `estilosFormularioEscuro.ts` — estilos de formulario dark mode.

### Primitivos UI (shadcn/Radix)

Em `frontend/src/components/ui/`:

- accordion, alert, alert-dialog, animated-tabs, auth-page, avatar, badge, border-trail, button, card, cards, checkbox, cta-with-text-marquee, dialog, dropdown-menu, faqsection, footer-column, how-it-works, input, item, label, marquee, navigation-menu, scroll-area, select, separator, sheet, single-pricing-card, skeleton, table, tabs, textarea, tooltip.

## Direcao Visual

Fonte principal: `docs/STYLEGUIDE-FRONTEND-EMEU.md`.
Referencia de design v2: `frontend/testes/Bizy — Direção Visual v2.html` (10 ecras CRM + 4 ecras mobile loja publica).

As regras visuais aqui devem ser aplicadas junto das lacunas P0/P1 descritas em [Inventario do Sistema Bizy](inventario-sistema-bizy.md) e na [Memoria Viva do Bizy](memoria-viva-bizy.md).

Regras de memoria:

- Bizy interno deve parecer ferramenta de operacao, CRM e suporte.
- Evitar composicao de landing page em telas operacionais.
- Priorizar densidade organizada, leitura rapida e acoes previsiveis.
- Cartoes devem ser usados para itens repetidos, modais e ferramentas reais, nao para empilhar secoes inteiras.
- Texto deve caber em mobile e desktop; evitar scroll horizontal.
- Usar icones lucide quando houver equivalente.
- Design v2 usa hierarquia de cor semantica, icon chips 38x38px, hero KPI com gradiente e sidebar branco.

## Testes Frontend Existentes

Em `frontend/testes/`:

- `afiliados.test.ts`
- `agenda-crm.test.ts`
- `api.test.ts`
- `catalogo-produto-modal.test.ts`
- `comentarios-filtros.test.ts`
- `comentarios-sse.test.ts`
- `comercio-suave-design.test.ts`
- `conversas-crm.test.ts`
- `crm-design-cal.test.ts`
- `crm-navegacao.test.ts`
- `crm-operacional.test.ts`
- `crm-plus-inteligente.test.ts`
- `deploy-cache.test.ts`
- `design-home.test.ts`
- `design-login.test.ts`
- `design-notificacoes.test.ts`
- `design-onboarding.test.ts`
- `design-system-consistencia.test.ts`
- `layout-vivo.test.ts`
- `loja-digital-operacao-avancada.test.ts`
- `loja-publica-fase1.test.ts`
- `loja-subdominio.test.ts`
- `marca-bizy.test.ts`
- `mobile-ux.test.ts`
- `painel-live.test.ts`
- `shadcn-integracao.test.ts`

## Navegacao e Modulos

A navegacao e organizada por seccoes: Hoje, Vendas, CRM, Vitrine, Gestao, Admin/Sistema.

Rotas com propriedade `modulo` so aparecem se o modulo estiver activo no negocio (ex: `automacoes`, `funil`, `loja-publica`, `afiliados`). A funcao `filtrarRotasPorModulos` em `rotasApp.tsx` controla a visibilidade.

Rotas Admin/Sistema requerem papel admin/dono/owner via `usuarioPodeVerAdminSistema`.

## Lacunas Frontend Conhecidas

Do documento de requisitos:

- checkout visual/carrinho completo no frontend publico fechado com passos, quantidade, resumo e revisao;
- SEO/social preview renderizado no frontend publico fechado para Market, lojas, catalogos e Learning;
- faltam estados vazios orientadores em alguns modulos;
- falta auditoria mobile 360px nas tabelas grandes;
- faltam algumas telas visuais de colecoes e perfil 360 polido.
