#!/bin/bash

# Inicia ngrok do sistema com domínio reservado e atualiza os .env locais.
# Uso: bash scripts/setup-ngrok-domain.sh seu-dominio.ngrok-free.app

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV="$PROJECT_ROOT/.env"
DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo "Domínio do ngrok não fornecido."
  echo "Uso: bash scripts/setup-ngrok-domain.sh seu-dominio.ngrok-free.app"
  exit 1
fi

if [ -f "$ROOT_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_ENV"
  set +a
fi

NGROK_PORT="${NGROK_PORT:-${FRONTEND_PORT:-5173}}"
NGROK_LOG="${NGROK_LOG:-/tmp/emeu-ngrok.log}"
NGROK_PID_FILE="${NGROK_PID_FILE:-/tmp/emeu-ngrok.pid}"

if ! command -v ngrok > /dev/null 2>&1; then
  echo "ngrok não encontrado."
  exit 1
fi

if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
  echo "Configurando authtoken ngrok a partir do .env local..."
  ngrok config add-authtoken "$NGROK_AUTHTOKEN" > /dev/null
fi

if ! curl -s "http://localhost:$NGROK_PORT" > /dev/null 2>&1; then
  echo "Frontend Bizy não respondeu em localhost:$NGROK_PORT."
  echo "Inicie primeiro com: npm run dev:frontend"
fi

echo "Conectando ngrok ao domínio $DOMAIN..."
rm -f "$NGROK_PID_FILE"
if command -v setsid > /dev/null 2>&1; then
  setsid -f bash -c 'echo $$ > "$1"; exec ngrok http "$2" --domain="$3"' _ "$NGROK_PID_FILE" "$NGROK_PORT" "$DOMAIN" > "$NGROK_LOG" 2>&1 < /dev/null
  sleep 1
  NGROK_PID="$(cat "$NGROK_PID_FILE" 2>/dev/null || true)"
else
  nohup ngrok http "$NGROK_PORT" --domain="$DOMAIN" > "$NGROK_LOG" 2>&1 < /dev/null &
  NGROK_PID=$!
  echo "$NGROK_PID" > "$NGROK_PID_FILE"
fi

sleep 2
bash "$SCRIPT_DIR/update-ngrok-url.sh"

echo ""
echo "Domínio configurado: https://$DOMAIN"
echo "PID do ngrok: $NGROK_PID"
echo "Logs: $NGROK_LOG"
echo "Para parar: kill $NGROK_PID"
