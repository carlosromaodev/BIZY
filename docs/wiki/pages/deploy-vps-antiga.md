---
title: Deploy na VPS Antiga
aliases:
  - VPS antiga Bizy
tags:
  - bizy/deploy
  - bizy/operacao
status: ativo
updated: 2026-05-27
---

# Deploy na VPS Antiga

Status: ativo
Ultima atualizacao: 2026-05-27
Fontes principais: `docs/DEPLOY_VPS_ANTIGA.md`, `docs/deploy.md`, `docker-compose.yml`, `docker-compose.prod.yml`

## Dados Principais

- VPS antiga: `135.181.47.46`
- SSH: `root@135.181.47.46`
- Pasta sugerida: `/opt/bizy`
- Ambiente: `/opt/bizy/.env.docker`
- Compose base: `/opt/bizy/docker-compose.yml`
- Override producao: `/opt/bizy/docker-compose.prod.yml`

## Ligacoes de Contexto

- Scripts, Docker e variaveis operacionais: [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).
- Migrations, backup e restore: [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Endpoints de validacao como `/saude`: [Inventario Backend e API HTTP](inventario-backend-api.md).
- Memoria geral do projeto: [Memoria Viva do Bizy](memoria-viva-bizy.md).

## Fluxo Resumido

1. Criar `/opt/bizy` na VPS.
2. Criar `.env.docker` real no servidor, sem versionar segredos.
3. Sincronizar o codigo local com `rsync`, excluindo `.env*`, `node_modules`, `tmp` e backups.
4. Subir com Docker Compose.
5. Validar `/saude`, frontend e logs.

## Comando Principal

```bash
ssh root@135.181.47.46 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build'
```

## Com Caddy Interno

```bash
ssh root@135.181.47.46 'cd /opt/bizy && docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.staging.yml up -d --build'
```

## Guia Completo

Ver [`docs/DEPLOY_VPS_ANTIGA.md`](../../DEPLOY_VPS_ANTIGA.md).
