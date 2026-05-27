# Deploy em servidor

Este guia cobre o mínimo operacional para colocar o ÉMeu em produção com PostgreSQL, Prisma migrations, Evolution API, n8n, SMS Ombala e captação TikTok.

## 1. Variáveis de ambiente

No servidor do backend, crie o ficheiro de ambiente a partir do modelo:

```bash
cp backend/.env.production.example backend/.env
```

Preencha obrigatoriamente:

```env
DATABASE_URL="postgresql://emeu:senha_forte@host:5432/emeu?schema=public"
N8N_WEBHOOK_EVENTOS_URL=https://n8n.seu-dominio.com/webhook/emeu-eventos
N8N_WEBHOOK_SECRET=segredo_hmac_longo
N8N_BACKEND_TOKEN=token_longo_para_o_n8n_chamar_o_backend
EVOLUTION_API_URL=https://evolution.seu-dominio.com
EVOLUTION_API_KEY=api_key_da_evolution
EVOLUTION_INSTANCE=emeu
EVOLUTION_WEBHOOK_TOKEN=token_do_webhook_evolution
OMBALA_API_TOKEN=token_da_ombala
AUTH_SECRET=secret_longo_para_sessoes
TIKTOK_LIVE_USERNAME=@sua_loja_tiktok
```

Notas:

- `DATABASE_URL` é a fonte de verdade do Prisma.
- `N8N_WEBHOOK_SECRET` assina eventos enviados do backend para o n8n.
- `N8N_BACKEND_TOKEN` deve ser configurado no n8n e enviado no header `X-EMEU-N8N-TOKEN`.
- `EVOLUTION_WEBHOOK_TOKEN` protege `POST /webhooks/evolution`.
- `LOGIN_SMS_DEV_MODE=false` e `LOGIN_SMS_EXPOR_CODIGO_DEV=false` são obrigatórios em produção.
- `RATE_LIMIT_ATIVO=true` deve ficar ligado para proteger login, catálogo, reservas e automações.

## 2. PostgreSQL e Prisma migrate deploy

Depois de criar a base PostgreSQL vazia:

```bash
npm install
npm run prisma:generate
DATABASE_URL="postgresql://emeu:senha_forte@host:5432/emeu?schema=public" npm run prisma:migrate:deploy
BIZY_BOOTSTRAP_ENV=production DATABASE_URL="postgresql://emeu:senha_forte@host:5432/emeu?schema=public" npm run bootstrap:ambiente
```

Para verificar estado das migrations:

```bash
DATABASE_URL="postgresql://emeu:senha_forte@host:5432/emeu?schema=public" npm run prisma:migrate:status
```

Em Docker, o backend já executa no arranque:

```bash
npx prisma generate && npx prisma migrate deploy && node dist/main.js
```

Não use `prisma db push` em produção; ele é útil apenas para prototipagem local.

O bootstrap valida variáveis obrigatórias de produção e cria configurações padrão dos módulos CRM+ para negócios já existentes. Ele é seguro para reexecução: módulos já existentes são preservados.

## 3. Backup e recuperação PostgreSQL

Configure uma rotina externa, como cron do servidor, para executar backups frequentes:

```bash
BACKUP_ENV=production npm run backup:postgres
```

Os backups são gravados por padrão em `backups/postgres` usando `pg_dump --format=custom`, com `--no-owner`, `--no-privileges`, permissões restritas e checksum quando disponível. Quando `MEDIA_STORAGE_DIR` existir, o script também cria um `.tar.gz` da pasta de media/comprovativos. Para enviar para armazenamento externo, sincronize essa pasta com o provider escolhido pela operação.

Teste restore apenas em ambiente controlado:

```bash
CONFIRM_RESTORE=SIM \
  BACKUP_FILE=/caminho/bizy-production-YYYYMMDDTHHMMSSZ.dump \
  RESTORE_MEDIA_FILE=/caminho/bizy-media-production-YYYYMMDDTHHMMSSZ.tar.gz \
  npm run restore:postgres
```

O restore usa `pg_restore --clean --if-exists --exit-on-error`, por isso exige `CONFIRM_RESTORE=SIM`.

Se estiver a migrar uma base antiga que já foi criada com `prisma db push`, faça backup e marque a primeira migration como baseline apenas se a estrutura atual já corresponder ao schema Prisma:

```bash
DATABASE_URL="postgresql://emeu:senha_forte@host:5432/emeu?schema=public" \
  npx prisma migrate resolve --schema backend/prisma/schema.prisma --applied 20260503070000_inicial
```

Se usar Docker Compose no servidor, suba com o override de produção para impedir exposição pública de PostgreSQL e Redis:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Com esse override, PostgreSQL e Redis ficam apenas na rede interna Docker. Backend, frontend, n8n e Evolution ficam publicados em `127.0.0.1` por padrão, para serem expostos por um proxy HTTPS como Nginx, Caddy ou Traefik.

## 4. n8n

No n8n, defina variáveis equivalentes:

```env
N8N_BACKEND_BASE_URL=https://api.seu-dominio.com
N8N_BACKEND_TOKEN=token_longo_para_o_n8n_chamar_o_backend
EVOLUTION_API_URL=https://evolution.seu-dominio.com
EVOLUTION_API_KEY=api_key_da_evolution
EVOLUTION_INSTANCE=emeu
```

Importe os workflows:

- `n8n/workflows/emeu-eventos-vendas.json`
- `n8n/workflows/emeu-atendimento-whatsapp.json`
- `n8n/workflows/emeu-comprovativo-pagamento.json`

O webhook principal deve corresponder a `N8N_WEBHOOK_EVENTOS_URL`.

## 5. Evolution API

No painel do ÉMeu:

1. Entre em `/login`.
2. Acesse `/app/whatsapp`.
3. Crie uma instância com o nome de `EVOLUTION_INSTANCE`.
4. Clique em `Conectar`.
5. Escaneie o QR Code com WhatsApp > Dispositivos conectados.
6. Marque a instância como padrão.

Se o n8n for o responsável por enviar todas as mensagens, mantenha:

```env
N8N_ASSUME_WHATSAPP=true
```

Se o backend enviar diretamente pela Evolution:

```env
N8N_ASSUME_WHATSAPP=false
WHATSAPP_PROVIDER=evolution
```

## 5. SMS Ombala

O login do vendedor usa SMS. Configure:

```env
OMBALA_API_BASE_URL=https://api.ombala.ao
OMBALA_API_TOKEN=token_da_ombala
OMBALA_SMS_DEFAULT_SENDER=EMEU
```

Teste o fluxo em `/login` com um telefone angolano válido.

## 6. TikTok username

O username configurado deve ser o `uniqueId` público da conta que faz a live:

```env
TIKTOK_LIVE_USERNAME=@sua_loja_tiktok
```

No painel, use `/app` > `Conectar live` e selecione:

- `TikTok Live Connector` como provider principal.
- `TikTokLive Python` como fallback.
- `Manual` apenas para contingência/testes.

O sistema não precisa da senha do TikTok. Ele só precisa que a conta esteja em live e que o provider consiga abrir a transmissão pública.

## 7. Observabilidade

O backend emite logs JSON estruturados e redige headers sensíveis. Para centralizar logs dos containers com Loki/Promtail:

```bash
docker compose \
  --env-file .env.docker \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.observabilidade.yml \
  up -d --build
```

Detalhes e consultas sugeridas: `docs/observabilidade.md`.

## 8. Staging com HTTPS

Para staging com domínio próprio e TLS automático, use Caddy:

```bash
docker compose \
  --env-file .env.docker \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.staging.yml \
  up -d --build
```

Configure `FRONTEND_DOMAIN`, `API_DOMAIN`, `N8N_DOMAIN`, `EVOLUTION_DOMAIN`, `EVOLUTION_MANAGER_DOMAIN` e `ACME_EMAIL`. Guia completo: `docs/staging.md`.
