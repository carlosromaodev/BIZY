#!/bin/bash

# Arquiva segmentos WAL do PostgreSQL para permitir recuperação incremental/PITR.
# Use como archive_command, por exemplo:
# archive_command = 'WAL_ARCHIVE_DIR=/opt/bizy/backups/postgres/wal /opt/bizy/scripts/archive-postgres-wal.sh %p %f'

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

wal_path="${1:-${WAL_SEGMENT_PATH:-}}"
wal_name="${2:-${WAL_SEGMENT_NAME:-}}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/postgres}"
BACKUP_ENV="${BACKUP_ENV:-${BIZY_BOOTSTRAP_ENV:-${NODE_ENV:-local}}}"
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-$BACKUP_DIR/wal/$BACKUP_ENV}"
WAL_ARCHIVE_RETENTION_DAYS="${WAL_ARCHIVE_RETENTION_DAYS:-365}"

if [ -z "$wal_path" ] || [ ! -f "$wal_path" ]; then
  echo "WAL_SEGMENT_PATH inválido. Use archive-postgres-wal.sh %p %f."
  exit 1
fi

if [ -z "$wal_name" ] || [[ "$wal_name" == *"/"* ]] || [[ "$wal_name" == "."* ]]; then
  echo "WAL_SEGMENT_NAME inválido."
  exit 1
fi

mkdir -p "$WAL_ARCHIVE_DIR"

destino="$WAL_ARCHIVE_DIR/$wal_name"
if [ -f "$destino" ]; then
  if cmp -s "$wal_path" "$destino"; then
    echo "WAL já arquivado: $destino"
    exit 0
  fi

  echo "Conflito: WAL $wal_name já existe com conteúdo diferente."
  exit 1
fi

temporario="$(mktemp "$WAL_ARCHIVE_DIR/.${wal_name}.XXXXXX")"
cp "$wal_path" "$temporario"
chmod 600 "$temporario"
mv "$temporario" "$destino"

if command -v sha256sum > /dev/null 2>&1; then
  sha256sum "$destino" > "$destino.sha256"
fi

if [[ "$WAL_ARCHIVE_RETENTION_DAYS" =~ ^[0-9]+$ ]] && [ "$WAL_ARCHIVE_RETENTION_DAYS" -gt 0 ]; then
  find "$WAL_ARCHIVE_DIR" -type f \
    \( -name "????????????????????????" \
    -o -name "????????????????????????.sha256" \
    -o -name "*.history" \
    -o -name "*.history.sha256" \) \
    -mtime +"$WAL_ARCHIVE_RETENTION_DAYS" \
    -print -delete
fi

echo "WAL arquivado: $destino"
