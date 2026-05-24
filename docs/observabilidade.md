# Observabilidade

O backend usa logs JSON estruturados do Fastify/Pino. Headers sensíveis como `Authorization`, `Cookie` e `Set-Cookie` são redigidos nos logs.

## Nível de log

Configure no ambiente do backend:

```env
LOG_LEVEL=info
```

Valores comuns: `debug`, `info`, `warn`, `error`.

## Centralização com Loki/Promtail

Para centralizar logs dos containers em Loki:

```bash
docker compose \
  --env-file .env.docker \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.observabilidade.yml \
  up -d --build
```

Por padrão, Loki fica em `127.0.0.1:3100`. Exponha esse serviço apenas para a rede interna de observabilidade ou por VPN/reverse proxy autenticado.

Consultas úteis em Loki:

```logql
{project="emeu", service="backend"}
{project="emeu", service="backend"} |= "BANCO_INDISPONIVEL"
{project="emeu", service="backend"} |= "WHATSAPP_MESSAGE_FAILED"
```

## Cuidados

- Não envie tokens, chaves de API ou dados bancários para logs manuais.
- Em produção, mantenha retenção compatível com a política da loja e a lei aplicável.
- Se usar um serviço externo de logs, aponte o agente para esse destino e mantenha o mesmo padrão JSON do backend.
