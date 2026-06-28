# SDD Dominio 01 - Arquitetura Plataforma

Status: ativo
Owner logico: Plataforma
Fontes: `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`, `docs/wiki/pages/inventario-backend-api.md`, `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Definir a arquitetura de plataforma que permite o Bizy evoluir por dominios sem misturar regras de negocio, HTTP, providers externos e frontend.

## 2. Escopo

Entra: backend Fastify, Prisma, PostgreSQL, use cases, contratos, providers, modulos HTTP, outbox, eventos, frontend React/Vite e integracoes.

Fica fora: detalhes de UI por pagina, regras especificas de cada dominio e runbooks de deploy.

## 3. Atores e Permissoes

- Desenvolvedor: implementa por use case, contrato e modulo.
- IA/dev: deve respeitar fronteiras antes de editar.
- Admin/Sistema: consulta saude, auditoria e integracoes tecnicas.
- Vendedor comum: nao deve ver detalhes tecnicos.

## 4. Entidades e Dados

Entidades transversais: `EventoSistema`, `EventoOperacional`, `OutboxEventoN8n`, `OutboxMensagemWhatsApp`, `JobOperacional` e modelos de sessao/auditoria.

Todas as entidades comerciais devem carregar ou resolver `negocioId`.

## 5. Fluxos Principais

```text
Rota HTTP -> Validacao Zod -> Use case -> Repositorio/Provider -> Evento/Auditoria
```

```text
Backend -> Outbox -> n8n/WhatsApp/provider -> Callback -> Backend valida -> Persistencia
```

## 6. Requisitos Funcionais

- Registrar modulos HTTP por manifesto.
- Montar dependencias em `ContextoAplicacao`.
- Manter providers externos atras de contratos.
- Expor endpoints publicos, comerciais e Admin/Sistema com fronteiras claras.
- Permitir operacao minima sem todos os modulos ativos.

## 7. Regras de Negocio

- Backend e fonte de verdade.
- n8n, Evolution, Cloud API, IA e conectores sociais nao decidem dados sensiveis.
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

## 11. Estado Atual

O backend possui manifesto modular amplo, use cases por dominio, Prisma/PostgreSQL, repositorio em memoria para testes e outbox para eventos n8n/WhatsApp.

## 12. Lacunas

- P0: padronizar paginacao/filtros em APIs grandes.
- P1: consolidar bus/outbox unico entre dominios.
- P2: versionar contratos de eventos e payloads publicos.

## 13. Testes e Verificacao

- Testes HTTP por modulo.
- Testes de isolamento multi-tenant.
- Typecheck backend/frontend.
- Testes de idempotencia para webhooks e jobs.

## 14. Proximos Planos

- Spec de event bus/outbox unificado.
- Spec de paginacao padronizada.
- Spec de contratos versionados.
