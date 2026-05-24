# Staging HTTPS

O ambiente de staging deve usar domínio próprio e HTTPS. O projeto inclui `docker-compose.staging.yml` com Caddy para terminar TLS automaticamente.

## DNS obrigatório

Aponte os registos DNS para o servidor de staging:

```text
app-stg.seu-dominio.com        A  <IP_DO_SERVIDOR>
api-stg.seu-dominio.com        A  <IP_DO_SERVIDOR>
n8n-stg.seu-dominio.com        A  <IP_DO_SERVIDOR>
evolution-stg.seu-dominio.com  A  <IP_DO_SERVIDOR>
wa-stg.seu-dominio.com         A  <IP_DO_SERVIDOR>
```

## Variáveis

No `.env.docker` de staging:

```env
NODE_ENV=production
LOGIN_SMS_DEV_MODE=false
LOGIN_SMS_EXPOR_CODIGO_DEV=false

FRONTEND_DOMAIN=app-stg.seu-dominio.com
API_DOMAIN=api-stg.seu-dominio.com
N8N_DOMAIN=n8n-stg.seu-dominio.com
EVOLUTION_DOMAIN=evolution-stg.seu-dominio.com
EVOLUTION_MANAGER_DOMAIN=wa-stg.seu-dominio.com
ACME_EMAIL=ops@seu-dominio.com

ORIGEM_FRONTEND=https://app-stg.seu-dominio.com
VITE_API_URL=https://api-stg.seu-dominio.com
N8N_PUBLIC_URL=https://n8n-stg.seu-dominio.com/
EVOLUTION_PUBLIC_URL=https://evolution-stg.seu-dominio.com
EVOLUTION_MANAGER_PUBLIC_URL=https://wa-stg.seu-dominio.com
N8N_BACKEND_BASE_URL=https://api-stg.seu-dominio.com
N8N_WEBHOOK_EVENTOS_URL=https://n8n-stg.seu-dominio.com/webhook/emeu-eventos
```

## Subir staging

```bash
docker compose \
  --env-file .env.docker \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.staging.yml \
  up -d --build
```

## Verificações

```bash
curl -fsS https://api-stg.seu-dominio.com/saude
curl -I https://app-stg.seu-dominio.com
```

O PostgreSQL e o Redis continuam sem portas públicas quando `docker-compose.prod.yml` é usado junto com staging.

## E2E do fluxo piloto

Com o staging no ar e login dev habilitado apenas em ambiente controlado de teste, execute:

```bash
E2E_BASE_URL=https://app-stg.seu-dominio.com npm --prefix frontend run test:e2e
```

O teste cobre login, cadastro de peça, comentário manual, criação de reserva e confirmação de pagamento.
