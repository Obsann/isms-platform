# Task 33 rehearsal log

| Field | Value |
|---|---|
| Date (UTC) | 2026-08-31 |
| Operator | Melkamu |
| Host | local Docker `isms-postgres` (Postgres 16) |
| Dump | `backups/isms_dev_20260831T201720Z.dump` |
| Restored into | `isms_restore_check` (spare DB — live `isms_dev` not wiped) |
| Schedule | `isms-postgres-backup` wrote `isms_dev_20260831T201359Z.dump` on start, then every 24h |
| Task 28 RLS check on restored copy | **PASS** |

tenant-a members visible after restore: `MEM-10001`, `MEM-10002`, `MEM-10003`, `MEM-24112`, `MEM-90001`, `MEM-90002`, `MEM-90003`  
tenant-b members visible after restore: `MEM-20001`, `MEM-93001`, `MEM-93002`, `MEM-93004`

Command used:

```bash
docker compose up -d
# from backend/
npm run backup:rehearse
```

Evidence: tenant-a session saw only tenant-a members; tenant-b session saw only tenant-b members; unscoped `isms_app` saw none. Live `isms_dev` was not wiped.

Prior pass: 2026-08-28 (`isms_dev_20260828T202228Z.dump`).
