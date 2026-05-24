#!/bin/bash

# Detecta a URL pública do ngrok do sistema e sincroniza as variáveis locais do Bizy.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV="$PROJECT_ROOT/.env"
BACKEND_ENV="$PROJECT_ROOT/backend/.env"

if [ -f "$ROOT_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_ENV"
  set +a
fi

if [ -f "$BACKEND_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$BACKEND_ENV"
  set +a
fi

NGROK_PORT="${NGROK_PORT:-${FRONTEND_PORT:-5173}}"
NGROK_API_URL="${NGROK_API_URL:-http://localhost:4040/api/tunnels}"
TIMEOUT="${NGROK_DETECT_TIMEOUT:-10}"
EVOLUTION_WEBHOOK_TOKEN="${EVOLUTION_WEBHOOK_TOKEN:-trocar_token_webhook_evolution}"

upsert_env() {
  local arquivo="$1"
  local chave="$2"
  local valor="$3"

  if [ ! -f "$arquivo" ]; then
    touch "$arquivo"
  fi

  if grep -q "^${chave}=" "$arquivo"; then
    sed -i "s|^${chave}=.*|${chave}=${valor}|" "$arquivo"
  else
    printf "\n%s=%s\n" "$chave" "$valor" >> "$arquivo"
  fi
}

echo "Detectando URL pública do ngrok..."

if ! command -v curl > /dev/null 2>&1; then
  echo "curl não encontrado."
  exit 1
fi

NGROK_URL=""
ELAPSED=0

while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if RESPONSE="$(curl -s "$NGROK_API_URL" 2>/dev/null)"; then
    NGROK_URL="$(echo "$RESPONSE" | grep -o 'https://[^"]*ngrok[^"]*' | head -1 || true)"
    if [ -z "$NGROK_URL" ]; then
      NGROK_URL="$(echo "$RESPONSE" | grep -o 'http://[^"]*ngrok[^"]*' | head -1 || true)"
    fi
    if [ -n "$NGROK_URL" ]; then
      break
    fi
  fi

  echo "Aguardando ngrok (${ELAPSED}s/${TIMEOUT}s)..."
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ -z "$NGROK_URL" ]; then
  echo "Não foi possível detectar ngrok em $NGROK_API_URL."
  echo "Confirme se o túnel está ativo com: ngrok http $NGROK_PORT"
  exit 1
fi

NGROK_URL="${NGROK_URL%/}"
EVOLUTION_WEBHOOK_URL="${NGROK_URL}/webhooks/evolution?token=${EVOLUTION_WEBHOOK_TOKEN}"

upsert_env "$BACKEND_ENV" "BACKEND_PUBLIC_URL" "$NGROK_URL"
upsert_env "$BACKEND_ENV" "APP_PUBLIC_URL" "$NGROK_URL"

upsert_env "$ROOT_ENV" "BACKEND_PUBLIC_URL" "$NGROK_URL"
upsert_env "$ROOT_ENV" "APP_PUBLIC_URL" "$NGROK_URL"
upsert_env "$ROOT_ENV" "EVOLUTION_WEBHOOK_URL" "$EVOLUTION_WEBHOOK_URL"

echo "BACKEND_PUBLIC_URL atualizado em backend/.env e .env"
echo "EVOLUTION_WEBHOOK_URL atualizado em .env"
echo "URL pública do sistema: $NGROK_URL"
echo "Destino local do túnel: http://localhost:$NGROK_PORT"
