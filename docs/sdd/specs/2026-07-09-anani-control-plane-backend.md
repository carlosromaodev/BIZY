# Spec - Anani Control Plane Backend

Status: ativo
Data: 2026-07-09
Dominio SDD: `domains/11-inteligencia-workflow-automacoes.md`, `domains/14-seguranca-privacidade-auditoria.md`, `domains/01-arquitetura-plataforma.md`
Capacidade da meta global: controlo
Owner logico: Plataforma/Governanca

## 1. Objetivo

Criar a primeira fronteira executavel do Anani no backend: policies, skill registry, outbox interno, incidentes, quarentena e snapshots de risco acessiveis apenas por governanca.

## 2. Contexto

O plano mestre da Anani define quatro planos: dados, cognicao, controlo e governanca. O repositorio ja tinha Fastify, Prisma, outbox n8n, auditoria e modelos iniciais de Anani no schema, mas ainda faltava uma fronteira de backend ligada ao contexto real.

## 3. Escopo

- [x] `backend/src/anani/policies/AnaniPolicyEngine.ts`
- [x] `bootstrapAnani` ligado ao `ContextoAplicacao`
- [x] Rotas `/governance/anani/*`
- [x] Migration Prisma das tabelas Anani
- [x] Atualizacao SDD/wiki/Obsidian

## 4. Fora de Escopo

- [ ] UI completa da Governance Console.
- [ ] Integracao Claude/GPT.
- [ ] ActionGateway real com providers externos.
- [ ] Projectors completos de Team/Market/Learning.
- [ ] Conectores oficiais Instagram/Facebook/TikTok Ads.

## 5. Atores e Permissoes

- `GOVERNANTE_BIZY`, `ADMIN_GERAL`, `SUPER_ADMIN_PLATFORM`: acesso direto.
- `DONO`, `ADMIN`, `VENDEDOR`, `ATENDENTE`, `FINANCEIRO`: sem acesso direto; recebem efeitos dentro do Team/Market/Learning.
- n8n: executor periferico autorizado, nao decisor.

## 6. Requisitos Funcionais

- [x] Listar politicas globais do Anani.
- [x] Listar skills permitidas e respetivo nivel de autonomia.
- [x] Avaliar uma acao candidata antes de execucao.
- [x] Registrar evento no outbox interno.
- [x] Processar eventos pendentes para listeners/projectors.
- [x] Criar/listar/atualizar incidentes.
- [x] Criar/listar/resolver quarentenas.
- [x] Registrar e consultar snapshot de risco por negocio/sistema.

## 7. Regras de Negocio

- Nivel 0-1 observa/alerta.
- Nivel 2 pode intervir se a politica permitir.
- Nivel 3 exige aprovacao humana.
- Nivel 4 e proibido.
- Impacto financeiro, PII em prompt e quebra de tenant sao hard block.
- Marketing/retencao exige consentimento confirmado.
- Toda acao executada futuramente deve gerar auditoria.

## 8. Requisitos Nao Funcionais

- [x] Rotas diretas sempre `no-store`.
- [x] Sem dados PII em prompts/modelos externos.
- [x] Sem exposicao em menus comuns de tenant.
- [x] Validacao Zod nas entradas.
- [x] Migration versionada antes de deploy.

## 9. Dados e Entidades

- [x] `EventOutbox`
- [x] `AnaniTenantRiskSnapshot`
- [x] `AnaniQuarantine`
- [x] `AnaniIncident`

Todos os dados que pertencem a tenant carregam `negocioId`. Eventos de plataforma podem ter `negocioId` nulo.

## 10. APIs, Telas e Integracoes

APIs:

- [x] `GET /governance/anani/health`
- [x] `GET /governance/anani/policies`
- [x] `POST /governance/anani/policies/evaluate`
- [x] `POST /governance/anani/events`
- [x] `POST /governance/anani/events/processar`
- [x] `GET|POST|PATCH /governance/anani/incidents`
- [x] `GET|POST /governance/anani/quarantine`
- [x] `POST /governance/anani/quarantine/:id/resolver`
- [x] `POST /governance/anani/risk-snapshots`
- [x] `GET /governance/anani/risk-snapshots/:negocioId/:sistema`

Telas:

- [ ] Governance Console completa.
- [x] Nao criar menu comercial.

## 11. UX e Estados

- [x] Nesta fase nao ha UX final exposta a tenant.
- [ ] Governance Console com health score.
- [ ] Governance Console com incidentes.
- [ ] Governance Console com quarentena.
- [ ] Governance Console com aprovacoes pendentes.
- [ ] Governance Console com decisoes recentes.
- [ ] Governance Console com kill switches.

## 12. Riscos e Guardrails

- Risco: expor Anani a tenant. Mitigacao: guarda por papel de plataforma.
- Risco: IA virar fonte de verdade. Mitigacao: PolicyEngine e backend como decisor final.
- Risco: migration manual esquecida. Mitigacao: migration versionada.
- Risco: automatismo perigoso. Mitigacao: nivel 3 exige humano e nivel 4 e bloqueado.

## 13. Testes e Verificacao

- [x] `npm run prisma:generate --workspace backend`
- [x] `DATABASE_URL='postgresql://user:pass@localhost:5432/bizy' npx prisma validate --schema backend/prisma/schema.prisma`
- [x] `npm run typecheck --workspace backend`
- [x] Teste focado do policy engine.
- [x] Teste da guarda `exigirGovernanteAnani`.
- [x] Teste HTTP completo das rotas `/governance/anani/*` com usuario `GOVERNANTE_BIZY`.

## 14. Criterios de Aceite

- [x] Backend compila.
- [x] Prisma schema valida.
- [x] Policy engine bloqueia PII/financeiro/tenant crossing.
- [x] Governance endpoints estao registrados no manifesto.
- [x] SDD e wiki apontam a Anani como nucleo interno invisivel.

## 15. Links

- ADR: `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`
- Plano fonte: `/home/carlos/Documentos/ANANI-INTELLIGENCE-MASTER-PLAN.md`
- Wiki: `docs/wiki/pages/anani-intelligence-control-plane.md`
