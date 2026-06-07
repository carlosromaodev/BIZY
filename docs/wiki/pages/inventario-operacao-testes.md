---
title: Inventario de Operacao, Integracoes e Testes
aliases:
  - Operacao Testes Bizy
tags:
  - bizy/inventario
  - bizy/operacao
status: ativo
updated: 2026-05-27
---

# Inventario de Operacao, Integracoes e Testes

Status: ativo
Ultima atualizacao: 2026-05-27
Fontes principais: `package.json`, `backend/package.json`, `frontend/package.json`, `docker-compose.yml`, `docs/docker.md`, `docs/deploy.md`, `docs/n8n.md`, `backend/src/testes/`, `frontend/testes/`

## Scripts do Monorepo

- `npm run dev` / `npm run dev:full`: executa `scripts/dev-full.sh`.
- `npm run dev:backend`: backend local.
- `npm run dev:frontend`: frontend local.
- `npm run build`: build dos workspaces.
- `npm run test`: testes dos workspaces.
- `npm run typecheck`: typecheck dos workspaces.
- `npm run bootstrap:ambiente`: bootstrap/validacao de ambiente no backend.
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:migrate:status`
- `npm run backup:postgres`
- `npm run restore:postgres`
- `npm run docker:config`
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run ngrok:sistema`
- `npm run ngrok:evolution`
- `npm run ngrok:update`

## Skills e Memoria Obsidian

- `skills-lock.json` registra skills instaladas para agentes no projeto.
- `.agents/` guarda os arquivos instalados pelo `npx skills`, mas fica ignorado no Git pela regra atual do `.gitignore`.
- Skills instaladas de `kepano/obsidian-skills`: `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli` e `obsidian-markdown`.
- O vault oficial fica em `docs/wiki/`.
- A memoria deve ser mantida conforme [[protocolo-atualizacao-memoria-bizy]].
- O Obsidian CLI existe no sistema, mas precisa ser ativado no app em `Settings > General > Advanced` antes de comandos `obsidian ...` funcionarem.

## Ligacoes de Contexto

- Produto e prioridades que a operacao sustenta: [Memoria de Projeto do Bizy](memoria-projeto-bizy.md).
- APIs e rotas que estes comandos validam: [Inventario Backend e API HTTP](inventario-backend-api.md).
- Banco, migrations, backup e restore: [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Build e testes de UI: [Inventario Frontend e UX](inventario-frontend.md).
- Deploy especifico na VPS antiga: [Deploy na VPS Antiga](deploy-vps-antiga.md).

## Scripts Backend

- `dev`: `tsx watch src/main.ts`
- `build`: `tsc -p tsconfig.json`
- `start`: build + `node dist/main.js`
- `test`: `vitest run`
- `typecheck`: `tsc --noEmit`
- Prisma: generate, push, migrate dev/deploy/status.
- Bootstrap: `tsx src/scripts/bootstrapAmbiente.ts`.

## Scripts Frontend

- `dev`: Vite em `0.0.0.0`.
- `build`: TypeScript build + Vite build.
- `test`: Vitest em `frontend/testes`.
- `test:e2e`: `node e2e/piloto.e2e.mjs`.
- `typecheck`: `tsc --noEmit`.

## Docker Compose

Servicos do `docker-compose.yml`:

- `postgres`
- `redis`
- `backend`
- `frontend`
- `n8n`
- `evolution-api`
- `evolution-manager`

Override `docker-compose.prod.yml`:

- remove portas publicas de Postgres e Redis;
- publica backend, frontend, n8n, Evolution API e manager em `127.0.0.1` por padrao;
- pensado para proxy HTTPS externo.

Staging/Caddy:

- `docker-compose.staging.yml` adiciona `caddy`;
- usa `docker/caddy/Caddyfile`;
- exige `FRONTEND_DOMAIN`, `API_DOMAIN`, `N8N_DOMAIN`, `EVOLUTION_DOMAIN`, `EVOLUTION_MANAGER_DOMAIN`, `ACME_EMAIL`.

Observabilidade:

- `docker-compose.observabilidade.yml` adiciona Loki/Promtail.

Para deploy na VPS antiga com estes arquivos, ver [Deploy na VPS Antiga](deploy-vps-antiga.md).

## n8n

Papel: automacao, follow-up, atendimento assistido, comprovativos e integracoes. Nao e fonte de verdade.

Os endpoints protegidos que o n8n chama estao em [Inventario Backend e API HTTP](inventario-backend-api.md). A persistencia de outbox esta em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).

Docs:

- `docs/n8n.md`
- `n8n/README.md`

Workflows:

- `n8n/workflows/emeu-eventos-vendas.json`
- `n8n/workflows/emeu-atendimento-whatsapp.json`
- `n8n/workflows/emeu-comprovativo-pagamento.json`

Prompt:

- `n8n/prompts/atendimento-consciente.md`

Contratos:

- Backend -> n8n usa `N8N_WEBHOOK_EVENTOS_URL` e assinatura por `N8N_WEBHOOK_SECRET`.
- n8n -> backend usa `X-EMEU-N8N-TOKEN`.
- `N8N_BACKEND_BASE_URL` deve apontar para API publica/interna correta.

## Evolution e WhatsApp

Servicos:

- `evolution-api`
- `evolution-manager`

As rotas de administracao e webhook ficam em [Inventario Backend e API HTTP](inventario-backend-api.md). A configuracao de instancias persiste em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).

Backend:

- administra instancias em `/evolution/*`;
- recebe webhook em `/webhooks/evolution`;
- envia mensagens por provider quando `WHATSAPP_PROVIDER=evolution`;
- pode deixar n8n assumir envio quando `N8N_ASSUME_WHATSAPP=true`.

Variaveis importantes:

- `EVOLUTION_API_URL`
- `EVOLUTION_PUBLIC_URL`
- `EVOLUTION_MANAGER_PUBLIC_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_WEBHOOK_TOKEN`

## Deploy

Docs:

- `docs/deploy.md`
- `docs/docker.md`
- `docs/staging.md`
- `docs/DEPLOY_VPS_ANTIGA.md`
- `docs/observabilidade.md`

VPS antiga:

- `135.181.47.46`
- SSH `root@135.181.47.46`
- pasta sugerida `/opt/bizy`

Producao segura:

- `NODE_ENV=production`;
- `LOGIN_SMS_DEV_MODE=false`;
- `LOGIN_SMS_EXPOR_CODIGO_DEV=false`;
- `AUTH_COOKIE_SECURE=true` quando HTTPS estiver ativo;
- Postgres e Redis sem portas publicas;
- segredos apenas no `.env.docker` da VPS.

## Testes Backend Existentes

Autenticacao/seguranca/sessao:

- `autenticacao-telefone.test.ts`
- `auth-cookie-http.test.ts`
- `cors.test.ts`
- `rate-limit.test.ts`
- `tratativa-erros.test.ts`
- `rotas-identidade-http.test.ts`

CRM, clientes e multitenancy:

- `clientes-360-http.test.ts`
- `compartilhamento-clientes-http.test.ts`
- `contexto-comercial-http.test.ts`
- `isolamento-operacional-multitenant.test.ts`
- `schema-multitenancy.test.ts`
- `modulos-negocio-http.test.ts`

Catalogo, reservas, pedidos e pagamentos:

- `catalogo-stock-http.test.ts`
- `motor-reservas.test.ts`
- `reservas-concorrencia-postgres.test.ts`
- `pedidos-http.test.ts`
- `pdf-recibo.test.ts`
- `fluxo-operacional.test.ts`
- `revisao-comentarios.test.ts`

Atendimento, tarefas, automacoes e social:

- `crm-atendimento.test.ts`
- `crm-inbox-automacoes-seguranca-http.test.ts`
- `social-inbox.test.ts`
- `tarefas-operacionais.test.ts`
- `tarefas-automaticas-rotina.test.ts`
- `tarefas-vinculos.test.ts`
- `playbooks-recuperacao.test.ts`
- `funil-comercial.test.ts`

Afiliados, campanhas e relatorios:

- `afiliados-http.test.ts`
- `crm-governanca-campanhas-http.test.ts`
- `relatorios-comerciais-atendimento.test.ts`
- `relatorios-comerciais-campanhas.test.ts`
- `relatorios-comerciais-oportunidades.test.ts`
- `relatorios-comerciais-retencao.test.ts`
- `painel-tarefas.test.ts`

Integracoes:

- `n8n.test.ts`
- `evolution.test.ts`
- `evolution-admin.test.ts`
- `whatsapp-cloud-api.test.ts`
- `whatsapp-politica.test.ts`
- `whatsapp-recuperacao.test.ts`
- `ombala-client.test.ts`
- `sms-diagnostico.test.ts`
- `tiktok-live-connector-provider.test.ts`
- `lives-diagnostico.test.ts`
- `parser-dicionario-http.test.ts`

Infra/dev/media:

- `backup-postgres-scripts.test.ts`
- `bootstrap-ambiente.test.ts`
- `dev-full-script.test.ts`
- `media-storage.test.ts`
- `sessoes-live-repositorio.test.ts`
- `slo-operacional.test.ts`
- `loja-publica-tracking-http.test.ts`
- `crm-backend-lacunas-http.test.ts`
- `crm-backend-requisitos-http.test.ts`
- debug helpers: `debug-events.ts`, `debug-messages.ts`

## Testes Frontend Existentes

- `api.test.ts`
- `comentarios-filtros.test.ts`
- `comentarios-sse.test.ts`
- `comercio-suave-design.test.ts`
- `conversas-crm.test.ts`
- `crm-navegacao.test.ts`
- `crm-operacional.test.ts`
- `design-home.test.ts`
- `design-login.test.ts`
- `design-notificacoes.test.ts`
- `design-onboarding.test.ts`
- `design-system-consistencia.test.ts`
- `layout-vivo.test.ts`
- `marca-bizy.test.ts`
- `mobile-ux.test.ts`
- `painel-live.test.ts`
- `shadcn-integracao.test.ts`

## Docs Operacionais e de Produto Existentes

- `README.md`
- `docs/RF-RNF-RN-EMEUV1.md`
- `docs/deploy.md`
- `docs/docker.md`
- `docs/staging.md`
- `docs/ngrok.md`
- `docs/n8n.md`
- `docs/integracoes.md`
- `docs/observabilidade.md`
- `docs/arquitetura-modular.md`
- `docs/STYLEGUIDE-FRONTEND-EMEU.md`
- `docs/ANALISE-DESIGN-FRONTEND-EMEU.md`
- `ANALISE.md`
- `ANALISE-UX-DESIGN.md`
- `VIABILIDADE.md`
- `RELATORIO-COMPLETO-EMEU.md`
