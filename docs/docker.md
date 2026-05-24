# Docker do ÉMeu

Este stack sobe a aplicação completa para desenvolvimento integrado:

- Backend Fastify em `http://localhost:3333`
- Frontend em `http://localhost:5173`
- n8n em `http://localhost:5678`
- Evolution API em `http://localhost:8080`
- Evolution Manager em `http://localhost:3000`
- PostgreSQL compartilhado com bases separadas: `emeu`, `n8n`, `evolution`
- Redis para cache e sessões da Evolution

## Subir

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

Se o Docker Buildx reclamar por causa do caminho com acento (`ÉMeu`), use o builder clássico:

```bash
COMPOSE_BAKE=false DOCKER_BUILDKIT=0 docker compose --env-file .env.docker up -d --build
```

Também há atalhos:

```bash
npm run dev
npm run docker:config
npm run docker:up
npm run docker:logs
npm run docker:down
```

O `npm run dev` usa backend/frontend locais, sobe PostgreSQL/Redis/Evolution via Docker, sincroniza ngrok e para backend/frontend Docker para evitar processos duplicados. O ngrok aponta para o frontend local (`5173`) e o Vite encaminha webhooks/APIs para o backend (`3333`). Os atalhos `docker:*` usam `.env.docker.example`. Para segredos reais, prefira:

```bash
docker compose --env-file .env.docker up -d --build
```

O `.env.docker.example` usa `NODE_ENV=development` e expõe código SMS de desenvolvimento para permitir login local sem token Ombala. Em produção, use `.env.docker` próprio com `NODE_ENV=production`, `LOGIN_SMS_DEV_MODE=false`, `LOGIN_SMS_EXPOR_CODIGO_DEV=false` e credenciais reais.

## Fluxo entre serviços

- Backend publica eventos para `http://n8n:5678/webhook/emeu-eventos`.
- Evolution envia mensagens recebidas para `http://backend:3333/webhooks/evolution?token=...`.
- Backend envia WhatsApp pela Evolution em `http://evolution-api:8080`.
- Frontend chama o backend exposto no host em `http://localhost:3333`.
- Workflows n8n usam `N8N_BACKEND_BASE_URL=http://backend:3333` para consultar contexto e `EVOLUTION_API_URL=http://evolution-api:8080` para enviar WhatsApp.

## Primeiro uso da Evolution

1. Abra `http://localhost:3000`.
2. Use a API key configurada em `EVOLUTION_API_KEY`.
3. Crie/conecte a instância com o nome definido em `EVOLUTION_INSTANCE`, por padrão `emeu`.
4. Leia o QR Code com o WhatsApp.

## Túnel ngrok para testes

Para expor o backend do Bizy com URL pública temporária, configure `NGROK_AUTHTOKEN` no `.env` local e execute:

```bash
npm run ngrok:sistema
```

O script abre o túnel para `NGROK_PORT`, por padrão `5173`, e atualiza `BACKEND_PUBLIC_URL`/`APP_PUBLIC_URL`/`EVOLUTION_WEBHOOK_URL`. Ele não altera `EVOLUTION_API_URL`, porque o backend deve continuar a chamar a Evolution pela URL interna/local. O guia completo está em `docs/ngrok.md`.

## Primeiro uso do n8n

1. Abra `http://localhost:5678`.
2. Crie o utilizador inicial.
3. Importe ou monte um workflow com Webhook `POST /emeu-eventos`.
4. O backend já aponta para `N8N_WEBHOOK_EVENTOS_URL=http://n8n:5678/webhook/emeu-eventos`.

Modelos prontos:

- `n8n/workflows/emeu-eventos-vendas.json`
- `n8n/workflows/emeu-atendimento-whatsapp.json`
- `n8n/workflows/emeu-comprovativo-pagamento.json`

## Notas de produção

- Trocar todos os segredos do `.env.docker`.
- Subir com o override de produção para não expor PostgreSQL/Redis e para publicar HTTP apenas em loopback/reverse proxy:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- O backend Docker executa `prisma migrate deploy` no arranque; mantenha as migrations versionadas em `backend/prisma/migrations`.
- Usar domínio público e HTTPS para `N8N_PUBLIC_URL`, `EVOLUTION_PUBLIC_URL` e frontend.
- As imagens de n8n/Evolution devem ficar fixadas por versão/digest no `.env.docker`; o compose já evita `latest` puro por padrão.
- Se o n8n assumir todos os WhatsApps, defina `N8N_ASSUME_WHATSAPP=true`.
- Se o backend enviar pela Evolution, use `N8N_ASSUME_WHATSAPP=false` e `WHATSAPP_PROVIDER=evolution`.
- Não exponha PostgreSQL/Redis publicamente em produção; o override `docker-compose.prod.yml` remove esses `ports`.
