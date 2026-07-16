# Deploy na VPS Bizy

Este guia descreve como subir o Bizy/EMeu na VPS que serve os dominios publicos do projeto.

## Dados da VPS

- VPS de producao: `185.227.108.135`
- SSH: `root@185.227.108.135`
- Referencia da VPS nova do UOR Connect: `178.105.109.96`
- VPS anterior, fora do DNS publico: `135.181.47.46`
- Pasta do projeto: `/opt/bizy`
- Compose de producao: `/opt/bizy/docker-compose.yml` + `/opt/bizy/docker-compose.prod.yml`
- Ambiente Docker de producao: `/opt/bizy/.env.docker`

Nao colocar segredos neste ficheiro. O `.env.docker` real deve ficar apenas na VPS.

## Contexto

- Este documento pertence ao Bizy/EMeu, nao ao UOR Connect.
- Os dominios `usebizy.space`, `api.usebizy.space`, `app.usebizy.space` e
  `market.usebizy.space` apontam para `185.227.108.135`.
- Antes de cada deploy, confirme o DNS. Nao publique em `135.181.47.46` apenas
  por compatibilidade com instrucoes historicas.
- Antes de apontar DNS real para esta VPS, validar a stack por IP, por hosts temporarios ou pelos endpoints internos.
- Se a VPS antiga ja tiver outro projeto em producao, confirmar portas e dominios antes de subir Caddy/Nginx.

## Preparar a VPS

Entrar e criar a pasta:

```bash
ssh root@185.227.108.135
mkdir -p /opt/bizy
cd /opt/bizy
```

Instalar dependencias basicas, se ainda nao existirem:

```bash
apt update
apt install -y git rsync curl ca-certificates
```

Instalar Docker e Docker Compose plugin se a VPS ainda nao tiver:

```bash
docker --version
docker compose version
```

## Criar `.env.docker`

Na VPS antiga, criar `/opt/bizy/.env.docker` a partir do modelo local `.env.docker.example`.

Variaveis obrigatorias para producao:

```env
NODE_ENV=production
LOGIN_SMS_DEV_MODE=false
LOGIN_SMS_EXPOR_CODIGO_DEV=false

POSTGRES_USER=emeu
POSTGRES_PASSWORD=trocar_por_senha_forte
POSTGRES_DB=emeu

AUTH_SECRET=trocar_por_secret_longo
AUTH_COOKIE_NAME=bizy_sessao
AUTH_COOKIE_SECURE=true

N8N_WEBHOOK_SECRET=trocar_por_secret_longo
N8N_BACKEND_TOKEN=trocar_por_token_longo
EVOLUTION_API_KEY=trocar_por_api_key_forte
EVOLUTION_WEBHOOK_TOKEN=trocar_por_token_longo
N8N_ENCRYPTION_KEY=trocar_por_chave_longa

ORIGEM_FRONTEND=https://app.seu-dominio.com
FRONTEND_URL=https://app.seu-dominio.com
API_PUBLIC_URL=https://api.seu-dominio.com
BACKEND_PUBLIC_URL=https://api.seu-dominio.com
PUBLIC_STORE_BASE_URL=https://app.seu-dominio.com
VITE_API_URL=https://api.seu-dominio.com

FRONTEND_DOMAIN=app.seu-dominio.com
API_DOMAIN=api.seu-dominio.com
N8N_DOMAIN=n8n.seu-dominio.com
EVOLUTION_DOMAIN=evolution.seu-dominio.com
EVOLUTION_MANAGER_DOMAIN=wa.seu-dominio.com
ACME_EMAIL=ops@seu-dominio.com
```

Se for usar somente loopback com proxy externo, o override `docker-compose.prod.yml` publica servicos em `127.0.0.1`. Se for usar HTTPS automatico via Caddy do projeto, incluir tambem `docker-compose.staging.yml` no comando de subida.

## Sincronizar o codigo local

Executar a partir da raiz local do Bizy:

```bash
rsync -az \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'backend/node_modules/' \
  --exclude 'frontend/node_modules/' \
  --exclude 'dist/' \
  --exclude 'coverage/' \
  --exclude 'tmp/' \
  --exclude 'backups/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '.env.docker' \
  ./ root@185.227.108.135:/opt/bizy/
```

Usar `--delete` apenas quando tiver certeza de que a pasta local e a fonte correta e que nada importante existe somente na VPS.

## Subir em producao sem Caddy interno

Usar quando outro proxy HTTPS ja existe na VPS:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build'
```

Verificar containers:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml ps'
```

## Subir com Caddy interno e HTTPS

Usar quando os dominios ja apontam para `185.227.108.135` e a VPS pode abrir portas `80` e `443`:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.staging.yml up -d --build'
```

Verificar:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.staging.yml ps'
```

## Backup antes de deploys sensiveis

Se a stack ja estiver rodando:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && BACKUP_ENV=production BACKUP_DATABASE_URL="$(docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec -T backend printenv DATABASE_URL)" bash scripts/backup-postgres.sh'
```

Alternativa simples, quando o script puder ler `DATABASE_URL` do ambiente:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && BACKUP_ENV=production npm run backup:postgres'
```

## Validacao

Saude interna pelo backend:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec -T backend node -e "fetch(\"http://127.0.0.1:3333/saude\").then(async r=>{console.log(r.status, await r.text()); process.exit(r.ok?0:1)}).catch(e=>{console.error(e); process.exit(1)})"'
```

Saude publica, se DNS estiver apontado:

```bash
curl -fsS https://api.seu-dominio.com/saude
curl -I https://app.seu-dominio.com
```

Logs:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs --tail=160 backend'
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs --tail=120 frontend'
```

## Rollback rapido

1. Ver logs e estado:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml ps && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 backend'
```

2. Voltar para uma versao anterior do codigo, se houver commit/tag:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && git log --oneline -5'
```

3. Recriar a stack:

```bash
ssh root@185.227.108.135 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build'
```

4. Restaurar banco apenas depois de escolher o dump correto e confirmar impacto:

```bash
ssh root@185.227.108.135 'find /opt/bizy -maxdepth 4 -type f -name "*.dump" -o -name "*.tar.gz" | sort | tail'
```

## Checklist final

- [ ] `.env.docker` real existe na VPS e nao foi sobrescrito.
- [ ] `LOGIN_SMS_DEV_MODE=false` e `LOGIN_SMS_EXPOR_CODIGO_DEV=false`.
- [ ] PostgreSQL e Redis nao estao expostos publicamente quando `docker-compose.prod.yml` e usado.
- [ ] Backend respondeu `/saude`.
- [ ] Frontend respondeu HTTP 200/30x.
- [ ] Logs do backend nao mostram erro de Prisma, CORS ou banco.
- [ ] n8n/Evolution estao configurados com URLs publicas corretas quando usados.
