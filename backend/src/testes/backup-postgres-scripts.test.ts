import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("scripts de backup e recuperação PostgreSQL", () => {
  it("backup exige DATABASE_URL e gera dump em formato custom seguro para restore", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/backup-postgres.sh"), "utf8");

    expect(script).toContain("set -euo pipefail");
    expect(script).toContain("DATABASE_URL");
    expect(script).toContain("pg_dump");
    expect(script).toContain("--format=custom");
    expect(script).toContain("--no-owner");
    expect(script).toContain("--no-privileges");
    expect(script).toContain("umask 077");
    expect(script).toContain("MEDIA_STORAGE_DIR");
    expect(script).toContain("tar -C");
    expect(script).toContain("BACKUP_RETENTION_DAYS");
    expect(script).toContain('BACKUP_RETENTION_DAYS:-365');
    expect(script).toContain('find "$BACKUP_DIR" -type f');
    expect(script).toContain('-mtime +"$BACKUP_RETENTION_DAYS"');
    expect(script).toContain("-print -delete");
  });

  it("RNF-T022: arquivo WAL incremental é idempotente, retém 365 dias e gera checksum", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/archive-postgres-wal.sh"), "utf8");

    expect(script).toContain("archive_command");
    expect(script).toContain("WAL_SEGMENT_PATH");
    expect(script).toContain("WAL_SEGMENT_NAME");
    expect(script).toContain("WAL_ARCHIVE_DIR");
    expect(script).toContain("WAL_ARCHIVE_RETENTION_DAYS");
    expect(script).toContain("WAL_ARCHIVE_RETENTION_DAYS:-365");
    expect(script).toContain("cmp -s");
    expect(script).toContain("mktemp");
    expect(script).toContain("chmod 600");
    expect(script).toContain("sha256sum");
    expect(script).toContain('find "$WAL_ARCHIVE_DIR" -type f');
    expect(script).toContain('-mtime +"$WAL_ARCHIVE_RETENTION_DAYS"');
    expect(script).toContain("-print -delete");
  });

  it("restore exige confirmação explícita antes de limpar objetos existentes", () => {
    const script = readFileSync(resolve(process.cwd(), "../scripts/restore-postgres.sh"), "utf8");

    expect(script).toContain("CONFIRM_RESTORE");
    expect(script).toContain("BACKUP_FILE");
    expect(script).toContain("pg_restore");
    expect(script).toContain("--clean");
    expect(script).toContain("--if-exists");
    expect(script).toContain("--exit-on-error");
    expect(script).toContain("RESTORE_MEDIA_FILE");
  });
});
