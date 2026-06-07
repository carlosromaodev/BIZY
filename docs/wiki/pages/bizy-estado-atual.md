---
title: Estado Atual do Bizy
aliases:
  - Snapshot Bizy
tags:
  - bizy/memoria
  - bizy/estado
status: ativo
updated: 2026-06-05
---

# Estado Atual do Bizy

Status: ativo
Ultima atualizacao: 2026-05-27
Fontes principais: `docs/RF-RNF-RN-EMEUV1.md`, `docs/deploy.md`, `docs/arquitetura-modular.md`, `README.md`

## Visao Geral

Bizy/EMeu e uma plataforma de comercio operacional para vendas em live, CRM, catalogo, reservas, pedidos, WhatsApp, n8n, loja publica, afiliados, campanhas, tracking e recuperacao comercial.

## Ligacoes de Contexto

- Visao, dores, objetivos e qualidades do projeto: [Memoria de Projeto do Bizy](memoria-projeto-bizy.md).
- Memoria operacional completa: [Memoria Viva do Bizy](memoria-viva-bizy.md).
- Inventario detalhado do que ja existe: [Inventario do Sistema Bizy](inventario-sistema-bizy.md).
- Backend/API: [Inventario Backend e API HTTP](inventario-backend-api.md).
- Dados/Prisma: [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Frontend/UX: [Inventario Frontend e UX](inventario-frontend.md).
- Operacao/Testes: [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).

## Stack Atual

- Backend: Fastify, Prisma, PostgreSQL, modularizado por dominios HTTP e use cases.
- Frontend: Vite, React, paginas internas e componentes de design.
- Banco: PostgreSQL com migrations Prisma.
- Automacao: n8n e Evolution API via Docker Compose.
- Tempo real: eventos/SSE para fluxos operacionais.
- Deploy: Docker Compose com override de producao e opcional Caddy para HTTPS.

## Operacao Local

- Backend local padrao: `http://localhost:3333`
- Frontend local padrao: `http://localhost:5173`
- Health check: `/saude`
- Comando completo de desenvolvimento: `npm run dev`

## Infraestrutura

- Guia principal: `docs/deploy.md`; sintese operacional em [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).
- VPS antiga descoberta via UOR Connect: `135.181.47.46`
- Guia especifico para subir o Bizy na VPS antiga: [Deploy na VPS Antiga](deploy-vps-antiga.md).
- Memoria operacional consolidada: [Memoria Viva do Bizy](memoria-viva-bizy.md).

## Pontos de Atencao

- Producoes devem manter `LOGIN_SMS_DEV_MODE=false` e `LOGIN_SMS_EXPOR_CODIGO_DEV=false`.
- `deploy/.env`, `.env.docker` e segredos reais nunca devem ser versionados.
- Migrations Prisma devem estar atualizadas antes de validar endpoints do CRM.
- O frontend depende da API por proxy local no Vite e por `VITE_API_URL` em build Docker.

## Estado do Frontend (2026-06-05)

O frontend passou por refatoracao completa de design v2. 31 paginas roteadas cobrindo: painel, live, pedidos, tarefas, atendimento, clientes, recuperacao, campanhas, social inbox, pipeline, cotacoes, agenda, metas, respostas rapidas, notas, formularios, sequencias, catalogo, loja digital, afiliados, relatorios, equipa, pagamentos, administracao, diagnosticos SMS e auditoria.

Design system v2 centralizado em `BizyDesignSystem.tsx` com tokens oklch, Plus Jakarta Sans, componentes reutilizaveis (KpiCard, TableCard, FilterChips, StatusBadge, AvatarBizy, BotaoBizy). Paginas Live e Atendimento alinhadas ao prototipo HTML v2.

Navegacao organizada por seccoes (Hoje, Vendas, CRM, Vitrine, Gestao, Admin/Sistema) com visibilidade controlada por modulos activos e papel do utilizador.

## Proximas Sinteses Uteis

- Estado de lancamento P0/P1/P2 a partir de `docs/RF-RNF-RN-EMEUV1.md`.
- Maturacao visual das paginas CRM (pipeline, cotacoes, etc.) para design v2.
