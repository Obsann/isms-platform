# Task 33 rehearsal log

| Field | Value |
|---|---|
| Date (UTC) | 2026-08-28 |
| Operator | Melkamu |
| Host | local Docker `isms-postgres` (Postgres 16) |
| Dump | `backups/isms_dev_20260828T202228Z.dump` |
| Restored into | `isms_restore_check` (spare DB — live `isms_dev` not wiped) |
| Schedule | `isms-postgres-backup` sidecar wrote `isms_dev_20260828T202047Z.dump` on start, then every 24h |
| Task 28 RLS check on restored copy | **PASS** |

Live check on `isms_dev` also **PASS** before the restore (same isolation, concurrent sessions as `isms_app`).

Command used:

```bash
docker compose up -d
# from backend/
npm run backup:rehearse
```

Evidence: tenant-a session saw only tenant-a members; tenant-b session saw only tenant-b members; unscoped `isms_app` saw none.
