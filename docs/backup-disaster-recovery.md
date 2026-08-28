# Backup & disaster-recovery rehearsal (Task 33)

Owner: Melkamu. Verify step: a restored backup still passes the Task 28 RLS check
(tenant-a must not see tenant-b members, and the reverse, including under concurrent
reads). Connect as `isms_app` — the `postgres` superuser bypasses RLS and would
make the check meaningless.

Live data is never dumped into git. Files go to `backups/` (gitignored).

## Schedule

`docker compose up -d` starts `isms-postgres-backup`. That sidecar dumps
`isms_dev` as soon as Postgres is healthy, then every 24 hours (`BACKUP_INTERVAL_SECONDS`).
It keeps the 7 newest dumps.

Confirm it is running:

```bash
docker compose ps postgres-backup
docker logs isms-postgres-backup --tail 20
```

You should see `Backup written: /backups/isms_dev_....dump`.

## Manual dump

From `backend/`:

```bash
npm run backup:now
```

Uses `docker exec` against `isms-postgres` so it works on Windows without a local
`pg_dump` install.

## Restore rehearsal (does not wipe live `isms_dev`)

```bash
# from backend/
npm run backup:rehearse
```

That:

1. Dumps the live database.
2. Restores into spare database `isms_restore_check`.
3. Re-runs `npm run rls:check -- --database=isms_restore_check`.

Pass = Task 33 verify. The live volume used by the API is left alone.

To restore a specific file:

```bash
npm run backup:restore -- --file=../backups/isms_dev_YYYYMMDDThhmmssZ.dump
npm run rls:check -- --database=isms_restore_check
```

## True disaster restore onto the primary

Only when `isms_dev` is gone or corrupt. This drops live data.

1. Stop the API.
2. `docker exec -it isms-postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='isms_dev' AND pid <> pg_backend_pid();"`
3. Recreate `isms_dev` and `pg_restore` the chosen dump (same flags as the spare restore).
4. Start the API. Run `npm run rls:check` against `isms_dev`.

Do not use this path for the internship rehearsal.

## Task 28 check on its own

```bash
npm run rls:check
```

Needs seed tenants `tenant-a` / `tenant-b` (`npm run seed`). Password must match
Compose (`POSTGRES_PASSWORD` / `DB_PASSWORD`).
