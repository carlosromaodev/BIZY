#!/bin/bash

# Restaura um backup gerado por scripts/backup-postgres.sh.
# Exige confirmação explícita porque --clean remove objetos existentes antes do restore.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV="$PROJECT_ROOT/.env"
BACKEND_ENV="$PROJECT_ROOT/backend/.env"

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
  fi
}

load_env_file "$ROOT_ENV"
load_env_file "$BACKEND_ENV"

DATABASE_URL="${RESTORE_DATABASE_URL:-${DATABASE_URL:-}}"
BACKUP_FILE="${BACKUP_FILE:-}"
RESTORE_MEDIA_FILE="${RESTORE_MEDIA_FILE:-}"
MEDIA_STORAGE_DIR="${MEDIA_STORAGE_DIR:-storage/media}"
CONFIRM_RESTORE="${CONFIRM_RESTORE:-}"

if [ "$CONFIRM_RESTORE" != "SIM" ]; then
  echo "Restore bloqueado. Execute com CONFIRM_RESTORE=SIM e BACKUP_FILE=/caminho/backup.dump."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL não definido. Configure DATABASE_URL ou RESTORE_DATABASE_URL."
  exit 1
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "BACKUP_FILE inválido ou inexistente."
  exit 1
fi

pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  "$BACKUP_FILE"

if [ -n "$RESTORE_MEDIA_FILE" ]; then
  if [ ! -f "$RESTORE_MEDIA_FILE" ]; then
    echo "RESTORE_MEDIA_FILE inválido ou inexistente."
    exit 1
  fi

  media_dir="$MEDIA_STORAGE_DIR"
  if [[ "$media_dir" != /* ]]; then
    media_dir="$PROJECT_ROOT/backend/$media_dir"
  fi

  mkdir -p "$(dirname "$media_dir")"
  tar -C "$(dirname "$media_dir")" -xzf "$RESTORE_MEDIA_FILE"
  echo "Media restaurada a partir de: $RESTORE_MEDIA_FILE"
fi

echo "Restore concluído a partir de: $BACKUP_FILE"
