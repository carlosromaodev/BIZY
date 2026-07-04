#!/bin/bash

# RNF-T009: verifica TLS 1.3 no proxy publico e, quando psql estiver disponivel,
# confirma se a sessao PostgreSQL esta cifrada via pg_stat_ssl.

set -euo pipefail

TLS_TARGET_URL="${TLS_TARGET_URL:-${BIZY_BASE_URL:-}}"
TLS_TARGET_HOST="${TLS_TARGET_HOST:-}"
TLS_TARGET_PORT="${TLS_TARGET_PORT:-443}"
DATABASE_URL="${DATABASE_URL:-}"

if [ -z "$TLS_TARGET_HOST" ] && [ -n "$TLS_TARGET_URL" ]; then
  TLS_TARGET_HOST="$(node -e 'const alvo = process.argv[1]; const url = new URL(alvo); console.log(url.hostname);' "$TLS_TARGET_URL")"
  TLS_TARGET_PORT="$(node -e 'const alvo = process.argv[1]; const url = new URL(alvo); console.log(url.port || (url.protocol === "https:" ? "443" : "80"));' "$TLS_TARGET_URL")"
fi

if [ -z "$TLS_TARGET_HOST" ]; then
  echo "Defina TLS_TARGET_HOST ou TLS_TARGET_URL/BIZY_BASE_URL para validar TLS."
  exit 2
fi

if ! command -v openssl > /dev/null 2>&1; then
  echo "openssl nao encontrado; nao foi possivel validar TLS 1.3."
  exit 2
fi

tls_saida="$(mktemp)"
trap 'rm -f "$tls_saida"' EXIT

if ! openssl s_client -connect "$TLS_TARGET_HOST:$TLS_TARGET_PORT" -servername "$TLS_TARGET_HOST" -tls1_3 -brief < /dev/null > "$tls_saida" 2>&1; then
  cat "$tls_saida"
  echo "Falha ao estabelecer TLS 1.3 com $TLS_TARGET_HOST:$TLS_TARGET_PORT."
  exit 1
fi

if ! grep -Eq "Protocol version: TLSv1.3|Protocol *: TLSv1.3" "$tls_saida"; then
  cat "$tls_saida"
  echo "A conexao nao confirmou TLS 1.3."
  exit 1
fi

echo "TLS 1.3 confirmado em $TLS_TARGET_HOST:$TLS_TARGET_PORT."

if [ -n "$DATABASE_URL" ]; then
  if command -v psql > /dev/null 2>&1; then
    ssl_ativo="$(psql "$DATABASE_URL" -tAc "select ssl from pg_stat_ssl where pid = pg_backend_pid();" | tr -d '[:space:]')"
    if [ "$ssl_ativo" != "t" ]; then
      echo "A sessao PostgreSQL nao esta cifrada segundo pg_stat_ssl."
      exit 1
    fi
    echo "SSL PostgreSQL confirmado por pg_stat_ssl."
  else
    echo "psql nao encontrado; TLS publico validado, mas SSL PostgreSQL nao foi confirmado localmente."
  fi
else
  echo "DATABASE_URL nao definido; TLS publico validado, mas SSL PostgreSQL nao foi confirmado."
fi
