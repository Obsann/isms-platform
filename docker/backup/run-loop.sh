#!/bin/bash
# Run one dump immediately, then sleep until the next scheduled run (default 24h).
set -euo pipefail
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"
echo "ISMS backup sidecar starting; interval ${INTERVAL}s"
while true; do
  bash /backup.sh
  sleep "${INTERVAL}"
done
