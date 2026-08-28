#!/bin/bash
# Nightly (or interval) pg_dump from the compose Postgres service.
set -euo pipefail

: "${PGHOST:=postgres}"
: "${PGUSER:=postgres}"
: "${PGDATABASE:=isms_dev}"
: "${BACKUP_DIR:=/backups}"
: "${KEEP:=7}"

mkdir -p "${BACKUP_DIR}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="${BACKUP_DIR}/${PGDATABASE}_${stamp}.dump"

pg_dump -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -Fc -f "${file}"
echo "Backup written: ${file}"

# Keep the newest $KEEP dumps; drop the rest.
mapfile -t dumps < <(ls -1t "${BACKUP_DIR}/${PGDATABASE}_"*.dump 2>/dev/null || true)
if (( ${#dumps[@]} > KEEP )); then
  for extra in "${dumps[@]:KEEP}"; do
    rm -f "${extra}"
  done
fi
