#!/bin/bash

# Sobe o ambiente de desenvolvimento local:
# PostgreSQL/Redis/Evolution via Docker, túnel ngrok, backend local e frontend local.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV="$PROJECT_ROOT/.env"
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
NGROK_PID_FILE="${NGROK_PID_FILE:-/tmp/emeu-ngrok.pid}"

cd "$PROJECT_ROOT"

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
  fi
}

wait_container_health() {
  local container="$1"
  local label="$2"
  local status=""

  echo "Aguardando $label ficar saudável..."
  for _ in $(seq 1 90); do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      echo "$label pronto."
      return 0
    fi
    sleep 1
  done

  echo "$label não ficou pronto a tempo. Status: ${status:-desconhecido}"
  docker logs --tail=80 "$container" 2>/dev/null || true
  exit 1
}

wait_http() {
  local url="$1"
  local label="$2"

  echo "Aguardando $label em $url..."
  for _ in $(seq 1 90); do
    if curl -fsS "$url" > /dev/null 2>&1; then
      echo "$label pronto."
      return 0
    fi
    sleep 1
  done

  echo "$label não respondeu a tempo em $url."
  exit 1
}

backend_local_pronto() {
  curl -fsS "http://localhost:$LOCAL_BACKEND_PORT/saude" > /dev/null 2>&1 &&
    curl -fsS "http://localhost:$LOCAL_BACKEND_PORT/auth/google/status" > /dev/null 2>&1
}

parar_backend_local_desatualizado() {
  local pids
  pids="$(lsof -tiTCP:"$LOCAL_BACKEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"

  if [ -z "$pids" ]; then
    return 0
  fi

  for pid in $pids; do
    local cwd=""
    local cmd=""
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    cmd="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)"

    if [ "$cwd" = "$PROJECT_ROOT/backend" ] || echo "$cmd" | grep -Eq "(dist/main\\.js|tsx watch src/main\\.ts)"; then
      echo "A parar backend local desatualizado na porta $LOCAL_BACKEND_PORT (PID $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
    else
      echo "A porta $LOCAL_BACKEND_PORT está ocupada por outro processo: PID $pid ($cmd)"
      echo "Para evitar encerrar algo indevido, liberte a porta manualmente e volte a executar."
      exit 1
    fi
  done
}

cleanup() {
  local code="${1:-$?}"

  trap - EXIT INT TERM

  echo ""
  echo "A encerrar servidores locais..."
  if [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [ "${STOP_NGROK_ON_EXIT:-false}" = "true" ] && [ -f "$NGROK_PID_FILE" ]; then
    local ngrok_pid
    ngrok_pid="$(cat "$NGROK_PID_FILE" 2>/dev/null || true)"
    if [ -n "$ngrok_pid" ]; then
      echo "A encerrar ngrok PID $ngrok_pid..."
      kill "$ngrok_pid" 2>/dev/null || true
    fi
  fi

  exit "$code"
}

trap 'cleanup $?' EXIT
trap 'cleanup 130' INT
trap 'cleanup 143' TERM

load_env_file "$ROOT_ENV"
load_env_file "$BACKEND_ENV"

LOCAL_BACKEND_PORT="${PORTA:-3333}"
LOCAL_FRONTEND_PORT="${FRONTEND_PORT:-5173}"
LOCAL_EVOLUTION_PORT="${EVOLUTION_PORT:-8080}"
NGROK_PORT="${NGROK_PORT:-$LOCAL_FRONTEND_PORT}"
EVOLUTION_WEBHOOK_TOKEN="${EVOLUTION_WEBHOOK_TOKEN:-trocar_token_webhook_evolution}"
EVOLUTION_WEBHOOK_URL_LOCAL="${EVOLUTION_WEBHOOK_URL_LOCAL:-http://host.docker.internal:${LOCAL_BACKEND_PORT}/webhooks/evolution?token=${EVOLUTION_WEBHOOK_TOKEN}}"

echo "A subir infraestrutura Docker: PostgreSQL e Redis..."
docker compose up -d postgres redis
wait_container_health emeu_postgres "PostgreSQL"
wait_container_health emeu_redis "Redis"

echo "A aplicar migrations e atualizar Prisma Client..."
npm run prisma:migrate:deploy
npm run prisma:generate
npm run bootstrap:ambiente --workspace backend

echo "A parar backend/frontend Docker para evitar servidores duplicados..."
docker compose stop backend frontend > /dev/null 2>&1 || true

if backend_local_pronto; then
  echo "Backend já está ativo e atualizado em http://localhost:$LOCAL_BACKEND_PORT."
else
  parar_backend_local_desatualizado

  if curl -fsS "http://localhost:$LOCAL_BACKEND_PORT/saude" > /dev/null 2>&1; then
    echo "Backend respondeu em /saude, mas não expôs as rotas novas de autenticação."
  fi

  echo "A iniciar backend local em http://localhost:$LOCAL_BACKEND_PORT..."
  npm run dev:api --workspace backend &
  BACKEND_PID=$!
  wait_http "http://localhost:$LOCAL_BACKEND_PORT/saude" "Backend"
  wait_http "http://localhost:$LOCAL_BACKEND_PORT/auth/google/status" "Rotas de autenticação do backend"
fi

if curl -fsS "http://localhost:$LOCAL_FRONTEND_PORT" > /dev/null 2>&1; then
  echo "Frontend já está ativo em http://localhost:$LOCAL_FRONTEND_PORT."
else
  echo "A iniciar frontend local em http://localhost:$LOCAL_FRONTEND_PORT..."
  VITE_API_URL="" VITE_BACKEND_URL="http://localhost:$LOCAL_BACKEND_PORT" FRONTEND_PORT="$LOCAL_FRONTEND_PORT" npm run dev --workspace frontend &
  FRONTEND_PID=$!
  wait_http "http://localhost:$LOCAL_FRONTEND_PORT" "Frontend"
fi

echo "A iniciar/sincronizar túnel ngrok..."
bash "$SCRIPT_DIR/setup-ngrok.sh"

load_env_file "$ROOT_ENV"
load_env_file "$BACKEND_ENV"

if [ -n "${EVOLUTION_WEBHOOK_URL:-}" ]; then
  echo "A subir Evolution API com webhook público do sistema."
else
  EVOLUTION_WEBHOOK_URL="$EVOLUTION_WEBHOOK_URL_LOCAL"
  export EVOLUTION_WEBHOOK_URL
  echo "A subir Evolution API com webhook local."
fi
docker compose up -d --no-deps --force-recreate evolution-api
wait_http "http://localhost:$LOCAL_EVOLUTION_PORT" "Evolution API"

echo ""
echo "Ambiente pronto."
echo "Backend: http://localhost:$LOCAL_BACKEND_PORT"
echo "Frontend: http://localhost:$LOCAL_FRONTEND_PORT"
echo "Evolution API: http://localhost:$LOCAL_EVOLUTION_PORT"
echo "Ngrok dashboard: http://localhost:4040"
echo ""
echo "Pressiona Ctrl+C para parar backend/frontend locais."
echo "Para parar também o ngrok ao sair: STOP_NGROK_ON_EXIT=true npm run dev:full"

if [ -n "${BACKEND_PID:-}" ] || [ -n "${FRONTEND_PID:-}" ]; then
  wait
else
  while true; do
    sleep 3600
  done
fi
