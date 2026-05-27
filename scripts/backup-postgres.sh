#!/bin/bash

# Cria backup PostgreSQL em formato custom do pg_dump, adequado para restore seletivo
# e para ambientes dev/staging/prod. Use BACKUP_DATABASE_URL para sobrescrever DATABASE_URL.

set -euo pipefail
umask 077

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

DATABASE_URL="${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/postgres}"
BACKUP_ENV="${BACKUP_ENV:-${BIZY_BOOTSTRAP_ENV:-${NODE_ENV:-local}}}"
MEDIA_STORAGE_DIR="${MEDIA_STORAGE_DIR:-storage/media}"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL não definido. Configure DATABASE_URL ou BACKUP_DATABASE_URL."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
arquivo="$BACKUP_DIR/bizy-${BACKUP_ENV}-${timestamp}.dump"

pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$arquivo"

if command -v sha256sum > /dev/null 2>&1; then
  sha256sum "$arquivo" > "$arquivo.sha256"
fi

media_dir="$MEDIA_STORAGE_DIR"
if [[ "$media_dir" != /* ]]; then
  media_dir="$PROJECT_ROOT/backend/$media_dir"
fi

if [ -d "$media_dir" ]; then
  media_arquivo="$BACKUP_DIR/bizy-media-${BACKUP_ENV}-${timestamp}.tar.gz"
  tar -C "$(dirname "$media_dir")" -czf "$media_arquivo" "$(basename "$media_dir")"
  if command -v sha256sum > /dev/null 2>&1; then
    sha256sum "$media_arquivo" > "$media_arquivo.sha256"
  fi
  echo "Backup de media criado: $media_arquivo"
fi

echo "Backup criado: $arquivo"
