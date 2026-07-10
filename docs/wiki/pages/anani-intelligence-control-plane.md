---
title: Anani Intelligence Control Plane
aliases:
  - Anani
  - Control Plane Anani
  - Inteligencia Interna Bizy
tags:
  - bizy/anani
  - bizy/governanca
  - bizy/arquitetura
status: ativo
updated: 2026-07-10
---

# Anani Intelligence Control Plane

> [!warning] Regra de acesso
> Anani nao e produto de tenant, chatbot publico ou modulo comercial. O acesso direto pertence apenas a `GOVERNANTE_BIZY`, `ADMIN_GERAL` e `SUPER_ADMIN_PLATFORM`.

## Posicao no Bizy

```text
Bizy visivel:
  - Bizy Team
  - Bizy Market
  - Bizy Learning

Nucleo interno:
  - Anani
```

Team, Market e Learning continuam a ser os sistemas usados pelos clientes. Anani observa, cruza, protege, recomenda, bloqueia preventivamente, cria incidentes e prepara decisoes de governanca.

## Planos Internos

- [x] Data Plane inicial: event outbox e snapshots.
- [x] Read models iniciais: `TeamHealth`, `MarketSnapshot` e `SecuritySnapshot`.
- [x] Data Plane completo: projectors duraveis e read models consolidados sem recalculo por consulta.
- [ ] Cognition Plane: Claude/GPT com contexto sanitizado.
- [x] Control Plane inicial: `PolicyEngine` e skill registry.
- [ ] Control Plane completo: `ActionGateway`, quotas e circuit breaker.
- [x] Governance Plane inicial: incidentes e quarentena.
- [x] Governance Console inicial: rota oculta `/app/governance/anani`.
- [ ] Governance Plane completo: audit trail, aprovacoes e console operacional completa.

## Regras Duraveis

- Backend continua fonte de verdade.
- n8n e executor periferico, nao cerebro.
- IA externa nao recebe PII, tokens, segredos ou contexto cru.
- Anani nao altera saldo, ledger, pagamento ou reembolso.
- Acoes de alto impacto exigem aprovacao humana.
- Tenants veem efeitos dentro de [[mapa-de-modulos-bizy|Team, Market e Learning]], nao a console Anani.
- Organizacao fisica nova so deve existir quando mover codigo real; nao criar `systems/*` vazio enquanto `projetos/team`, `projetos/market`, `projetos/learning` e `anani` forem os caminhos vivos.

## Estado Implementado em 2026-07-09

- [x] `backend/src/anani/policies/AnaniPolicyEngine.ts`
- [x] `backend/src/app/bootstrap/bootstrapAnani.ts`
- [x] `backend/src/infra/http/modulos/ananiGovernance.ts`
- [x] `backend/prisma/migrations/20260709090000_anani_internal_control_plane/migration.sql`
- [x] Rotas internas sob `/governance/anani/*`

## Estado Implementado em 2026-07-10

- [x] `GET /governance/anani/read-models`
- [x] `TeamHealth`
- [x] `MarketSnapshot`
- [x] `SecuritySnapshot`
- [x] `frontend/src/paginas/AnaniGovernance.tsx`
- [x] Rota oculta `/app/governance/anani` com `requerGovernancaAnani`.

## Dados Iniciais

- [x] `EventOutbox`
- [x] `AnaniTenantRiskSnapshot`
- [x] `AnaniQuarantine`
- [x] `AnaniIncident`

## Relacionados

- [[arquitetura-e-guardrails-bizy]]
- [[mapa-de-modulos-bizy]]
- [[memoria-viva-bizy]]
- [[obsidian-vault]]
- [ADR-0002 Anani como nucleo interno invisivel](../../sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md)
- [Spec Anani Control Plane Backend](../../sdd/specs/2026-07-09-anani-control-plane-backend.md)
- [Spec Anani Read Models e Governance Console Inicial](../../superpowers/specs/2026-07-10-anani-read-models-governance-console.md)
