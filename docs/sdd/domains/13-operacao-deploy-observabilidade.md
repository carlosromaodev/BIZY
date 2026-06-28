# SDD Dominio 13 - Operacao, Deploy e Observabilidade

Status: ativo
Owner logico: Plataforma/Operacao
Fontes: `docs/wiki/pages/inventario-operacao-testes.md`, `docs/deploy.md`, `docs/docker.md`, `docs/wiki/pages/memoria-viva-bizy.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Definir como o Bizy e executado, validado, migrado, observado, restaurado e mantido em ambientes locais, staging e producao.

## 2. Escopo

Entra: Docker, scripts, Prisma, migrations, backup/restore, ngrok, VPS, deploy, saude, logs, rate limit, observabilidade, incidentes e runbooks.

Fica fora: regras de produto e UX, cobertas nos dominios especificos.

## 3. Atores e Permissoes

- Desenvolvedor: roda dev, testes, migrations e diagnosticos.
- Operador/admin: faz deploy, backup, restore e observabilidade.
- Dono comercial: nao deve ver detalhes tecnicos.
- Sistema: executa jobs, health checks e outbox.

## 4. Entidades e Dados

- `JobOperacional`
- `EventoOperacional`
- `OutboxEventoN8n`
- `OutboxMensagemWhatsApp`
- arquivos de media/comprovativos
- backups PostgreSQL
- logs estruturados

Segredos ficam fora do versionamento.

## 5. Fluxos Principais

```text
Codigo -> Build -> Migrations -> Bootstrap -> Health check -> Deploy
```

```text
Incidente -> Logs/Saude -> Diagnostico -> Correcao -> Registro na memoria
```

```text
Backup -> Restore controlado -> Validacao -> Registro operacional
```

## 6. Requisitos Funcionais

- Rodar stack local com `npm run dev`.
- Rodar Docker Compose integrado.
- Aplicar Prisma migrations em producao.
- Executar bootstrap de ambiente.
- Fazer backup/restore PostgreSQL.
- Expor `/saude`.
- Observar outbox, jobs e integracoes.

## 7. Regras de Negocio

- Deploy e suporte, nao centro do produto.
- Segredos reais nao sao versionados.
- Banco em producao usa migrations, nao `db push`.
- Falha de provider externo gera retry/tarefa, nao perda silenciosa.

## 8. Requisitos Nao Funcionais

- Backups restauraveis.
- Logs estruturados.
- Rate limit distribuido quando houver escala.
- Postgres/Redis nao expostos publicamente.
- Health checks claros.
- Runbooks de incidentes importantes.

## 9. APIs, Telas e Integracoes

APIs: `/saude`, `/integracoes/status`, `/automacoes/status`, `/automacoes/*/outbox/saude`, `/diagnosticos/*`.

Scripts: `scripts/dev-full.sh`, `scripts/backup-postgres.sh`, `scripts/restore-postgres.sh`, `scripts/setup-ngrok.sh`.

Infra: Docker Compose, Caddy, PostgreSQL, Redis, n8n, Evolution.

## 10. Guardrails

- Nao commitar `.env` real.
- Nao expor banco/Redis publicamente.
- Nao resolver incidente de migration sem backup e auditoria.
- Nao misturar runbook tecnico com UI comercial.

## 11. Estado Atual

Projeto possui Docker Compose, scripts de dev, backup/restore, docs de deploy, ngrok, observabilidade e memoria de incidentes. VPS antiga e deploy ja foram documentados.

## 12. Lacunas

- P0: runbook de deploy e restore sempre atualizado.
- P1: observabilidade operacional de jobs/outbox mais legivel.
- P2: CI/CD e alertas automaticos.

## 13. Testes e Verificacao

- `npm run build`
- `npm run test`
- `npm run typecheck`
- `npm run prisma:migrate:status`
- `npm run docker:config`
- validacao manual de `/saude`.

## 14. Proximos Planos

- Spec de runbook de incidentes.
- Spec de observabilidade operacional.
- Spec de pipeline de deploy.
