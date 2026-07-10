# SDD Dominio 01 - Arquitetura Plataforma

Status: ativo
Owner logico: Plataforma
Fontes: `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`, `docs/wiki/pages/inventario-backend-api.md`, `backend/src/infra/http/modulos/manifestoModulosHttp.ts`, `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`
Ultima atualizacao: 2026-07-09

## 1. Proposito

Definir a arquitetura de plataforma que permite o Bizy evoluir por dominios sem misturar regras de negocio, HTTP, providers externos e frontend.

## 2. Escopo

Entra: backend Fastify, Prisma, PostgreSQL, use cases, contratos, providers, modulos HTTP, outbox, eventos, frontend React/Vite, integracoes, sistemas visiveis (`projetos/team`, `projetos/market`, `projetos/learning`) e nucleos internos (`core`, `anani`).

Fica fora: detalhes de UI por pagina, regras especificas de cada dominio e runbooks de deploy.

## 3. Atores e Permissoes

- Desenvolvedor: implementa por use case, contrato e modulo.
- IA/dev: deve respeitar fronteiras antes de editar.
- Admin/Sistema: consulta saude, auditoria e integracoes tecnicas.
- Governante Bizy/Admin Geral: acessa Anani e governanca interna.
- Vendedor comum: nao deve ver detalhes tecnicos.

## 4. Entidades e Dados

Entidades transversais: `EventoSistema`, `EventoOperacional`, `OutboxEventoN8n`, `OutboxMensagemWhatsApp`, `JobOperacional`, modelos de sessao/auditoria e tabelas internas Anani (`EventOutbox`, `AnaniTenantRiskSnapshot`, `AnaniQuarantine`, `AnaniIncident`).

Todas as entidades comerciais devem carregar ou resolver `negocioId`.

## 5. Fluxos Principais

```text
Rota HTTP -> Validacao Zod -> Use case -> Repositorio/Provider -> Evento/Auditoria
```

```text
Backend -> Outbox -> n8n/WhatsApp/provider -> Callback -> Backend valida -> Persistencia
```

```text
Sistemas visiveis -> EventOutbox -> Projectors/Read Models -> Anani -> PolicyEngine -> ActionGateway/Governance
```

## 6. Requisitos Funcionais

- [x] Registrar modulos HTTP por manifesto.
- [x] Montar dependencias em `ContextoAplicacao`.
- [x] Manter providers externos atras de contratos.
- [x] Expor endpoints publicos, comerciais e Admin/Sistema com fronteiras claras.
- [x] Expor endpoints Anani apenas em `/governance/anani/*` com papel de plataforma.
- [x] Permitir operacao minima sem todos os modulos ativos.

## 7. Regras de Negocio

- Backend e fonte de verdade.
- n8n, Evolution, Cloud API, IA e conectores sociais nao decidem dados sensiveis.
- Anani decide apenas dentro das politicas; acoes de nivel 3 exigem humano e nivel 4 e proibido.
- Handler HTTP nao deve conter regra pesada.
- Modulo desativado nao executa automacao.

## 8. Requisitos Nao Funcionais

- TypeScript estrito.
- Validacao Zod nas entradas.
- Transacoes para operacoes criticas.
- Idempotencia em webhooks e importacoes.
- Rate limit em endpoints sensiveis.
- Logs e auditoria compreensiveis.

## 9. APIs, Telas e Integracoes

- Manifesto: `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- Composicao: `backend/src/infra/http/ContextoAplicacao.ts`
- Frontend: `frontend/src/rotasApp.tsx`
- Integracoes: n8n, Evolution, Cloud API, Ombala, TikTok/Instagram providers.

## 10. Guardrails

- Nao acessar banco direto em handler quando houver use case.
- Nao acoplar dominio a Fastify, React, TikTok, n8n ou Evolution.
- Nao usar provider externo como fonte de verdade.
- Nao expor tokens ou debug para perfis comerciais.
- Nao importar Anani como dependencia direta de use cases de Team/Market/Learning; os sistemas visiveis devem emitir eventos e consumir efeitos aprovados.

## 11. Estado Atual

O backend possui manifesto modular amplo, use cases por dominio, Prisma/PostgreSQL, repositorio em memoria para testes, outbox para eventos n8n/WhatsApp, pastas por sistema visivel em `backend/src/projetos/` e primeira fronteira interna Anani com policy engine, outbox, incidentes, quarentena e risk snapshots.

## 12. Lacunas

- [x] P0: padronizar paginacao/filtros em APIs grandes.
- [x] P0: manter Anani fora de menus/rotas comerciais de tenant.
- [ ] P1: consolidar bus/outbox unico entre dominios e projectors Anani.
- [ ] P2: versionar contratos de eventos e payloads publicos.

## 13. Testes e Verificacao

- [ ] Testes HTTP por modulo.
- [ ] Testes de isolamento multi-tenant.
- [x] Typecheck backend/frontend.
- [ ] Testes de idempotencia para webhooks e jobs.

## 14. Proximos Planos

- [ ] Spec de event bus/outbox unificado.
- [ ] Spec de paginacao padronizada.
- [ ] Spec de contratos versionados.
