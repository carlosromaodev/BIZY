#!/bin/bash

# Inicia um túnel ngrok para a interface do Bizy e atualiza os .env locais.
# Uso: bash scripts/setup-ngrok.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV="$PROJECT_ROOT/.env"

if [ -f "$ROOT_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_ENV"
  set +a
fi

NGROK_PORT="${NGROK_PORT:-${FRONTEND_PORT:-5173}}"
NGROK_LOG="${NGROK_LOG:-/tmp/emeu-ngrok.log}"
NGROK_API_URL="${NGROK_API_URL:-http://localhost:4040/api/tunnels}"
NGROK_PID_FILE="${NGROK_PID_FILE:-/tmp/emeu-ngrok.pid}"
NGROK_TARGET_LABEL="${NGROK_TARGET_LABEL:-Frontend Bizy}"

echo "Iniciando túnel ngrok para o sistema Bizy..."
echo ""

if ! command -v ngrok > /dev/null 2>&1; then
  echo "ngrok não encontrado."
  echo "Instale ngrok e configure o token com:"
  echo "  ngrok config add-authtoken <seu-token>"
  exit 1
fi

if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
  echo "Configurando authtoken ngrok a partir do .env local..."
  ngrok config add-authtoken "$NGROK_AUTHTOKEN" > /dev/null
fi

echo "Verificando $NGROK_TARGET_LABEL em http://localhost:$NGROK_PORT..."
if ! curl -s "http://localhost:$NGROK_PORT" > /dev/null 2>&1; then
  echo "$NGROK_TARGET_LABEL não respondeu em localhost:$NGROK_PORT."
  echo "Inicie primeiro com:"
  echo "  npm run dev:frontend"
  echo ""
  read -r -p "Continuar mesmo assim? [s/N] " resposta
  case "$resposta" in
    s|S|sim|SIM) ;;
    *) exit 1 ;;
  esac
fi

EXISTING_TUNNELS="$(curl -s "$NGROK_API_URL" 2>/dev/null || true)"
if echo "$EXISTING_TUNNELS" | grep -q "\"addr\":\"http://localhost:$NGROK_PORT\""; then
  echo "Já existe um túnel ngrok ativo para http://localhost:$NGROK_PORT."
  NGROK_PID="$(pgrep -nf "ngrok http $NGROK_PORT" || true)"
  if [ -n "$NGROK_PID" ]; then
    echo "$NGROK_PID" > "$NGROK_PID_FILE"
    echo "PID do ngrok: $NGROK_PID"
  fi
  bash "$SCRIPT_DIR/update-ngrok-url.sh"
  exit 0
fi

if echo "$EXISTING_TUNNELS" | grep -q '"public_url"'; then
  echo "Existe um túnel ngrok ativo para outra porta. A reiniciar para http://localhost:$NGROK_PORT..."
  if [ -f "$NGROK_PID_FILE" ]; then
    NGROK_PID_ATUAL="$(cat "$NGROK_PID_FILE" 2>/dev/null || true)"
    if [ -n "$NGROK_PID_ATUAL" ]; then
      kill "$NGROK_PID_ATUAL" 2>/dev/null || true
    fi
  fi
  pkill -f "ngrok http" 2>/dev/null || true
  sleep 1
fi

echo "Abrindo túnel ngrok para http://localhost:$NGROK_PORT..."
rm -f "$NGROK_PID_FILE"
if command -v setsid > /dev/null 2>&1; then
  setsid -f bash -c 'echo $$ > "$1"; exec ngrok http "$2"' _ "$NGROK_PID_FILE" "$NGROK_PORT" > "$NGROK_LOG" 2>&1 < /dev/null
  sleep 1
  NGROK_PID="$(cat "$NGROK_PID_FILE" 2>/dev/null || true)"
else
  nohup ngrok http "$NGROK_PORT" > "$NGROK_LOG" 2>&1 < /dev/null &
  NGROK_PID=$!
  echo "$NGROK_PID" > "$NGROK_PID_FILE"
fi

echo "PID do ngrok: $NGROK_PID"
echo "Dashboard local: http://localhost:4040"
echo "Logs: $NGROK_LOG"
echo ""

sleep 2

bash "$SCRIPT_DIR/update-ngrok-url.sh"

echo ""
echo "Setup concluído."
echo "Para parar o túnel: kill $NGROK_PID"
