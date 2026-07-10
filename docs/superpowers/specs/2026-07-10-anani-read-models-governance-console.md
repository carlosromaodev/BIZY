# Spec - Anani Read Models e Governance Console Inicial

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/11-inteligencia-workflow-automacoes.md`
Visao canonica: `docs/wiki/pages/anani-intelligence-control-plane.md`
Capacidade da meta global: controlo
Owner logico: Inteligencia/Governanca

## 1. Objetivo

Fechar o primeiro P1 de read models internos da Anani com `TeamHealth`, `MarketSnapshot` e `SecuritySnapshot`, consumidos por uma console interna protegida por papel de governanca.

## 2. Contexto

Anani ja tinha event outbox, snapshots crus, PolicyEngine, incidentes e quarentena. A lacuna era consolidar isso numa leitura operacional unica para governanca, sem expor Anani como produto de tenant.

## 3. Escopo

- Read model calculado no backend a partir de Prisma existente.
- Endpoint interno `GET /governance/anani/read-models`.
- Guarda por `GOVERNANTE_BIZY`, `ADMIN_GERAL` ou `SUPER_ADMIN_PLATFORM`.
- Console oculta em `/app/governance/anani`, fora da navegacao comercial.
- Teste unitario do calculo dos read models.
- Teste HTTP da rota de governanca.
- Teste frontend da rota oculta e do endpoint consumido.

## 4. Fora de Escopo

- Projectors event-driven persistentes.
- ActionGateway real.
- Aprovacoes completas e audit trail da Governance Console.
- IA externa/Claude/GPT com contexto sanitizado.

## 5. Regras

- Anani continua invisivel para tenants.
- A console nao entra em `rotasComerciais` nem `rotasAdminSistema`.
- Read models podem ser recalculados sob demanda neste recorte inicial.
- Backend segue como fonte de verdade; frontend apenas consome.
- Falha de acesso ou papel incorreto bloqueia antes de expor payload.

## 6. Implementacao

- `backend/src/app/bootstrap/bootstrapAnani.ts`
- `backend/src/infra/http/modulos/ananiGovernance.ts`
- `backend/src/testes/anani-read-models.test.ts`
- `backend/src/testes/anani-governance-http.test.ts`
- `frontend/src/paginas/AnaniGovernance.tsx`
- `frontend/src/App.tsx`
- `frontend/src/rotasApp.tsx`
- `frontend/testes/anani-governance-ui.test.ts`

## 7. Testes e Verificacao

- `cd backend && npx vitest run src/testes/anani-read-models.test.ts src/testes/anani-governance-http.test.ts`
- `cd frontend && npx vitest run testes/anani-governance-ui.test.ts`
- `npm run typecheck --workspace backend`
- `npm run typecheck --workspace frontend`

## 8. Criterios de Aceite

- [x] Backend consolida `TeamHealth`.
- [x] Backend consolida `MarketSnapshot`.
- [x] Backend consolida `SecuritySnapshot`.
- [x] Endpoint interno usa `Cache-Control: no-store`.
- [x] Endpoint interno exige papel de governanca Anani.
- [x] Frontend tem console oculta protegida por `requerGovernancaAnani`.
- [x] Console nao aparece na navegacao comercial de tenant.
- [x] Testes focados cobrem backend e frontend.

## 9. Links

- `docs/sdd/domains/11-inteligencia-workflow-automacoes.md`
- `docs/wiki/pages/anani-intelligence-control-plane.md`
- `docs/superpowers/plans/2026-07-10-anani-read-models-governance-console.md`
