# Task 29 — Offline outbox edge-case verification

**Owners:** Obsan + Jerry  
**Prerequisite:** Task 15 merged; API running on `localhost:4000`.

Automated check: `backend/scripts/verify-offline-outbox.ps1`  
Manual teller flow: queue a deposit in the browser while offline, reconnect, confirm
one ledger row and `queued` → `synced` in the teller feed.

## Scenarios covered by the script

| Scenario | Expected |
|---|---|
| First POST with `reference` | 201 — transaction created |
| Replay same `reference`, same amount/account | 201 — same transaction id returned (idempotent) |
| Same `reference`, different amount | 409 — `error: SyncConflict` |

## Client behaviour (Task 15)

- `TellerDeskView` queues when `navigator.onLine` is false or the POST fails at the network layer.
- `teller-outbox.ts` replays on `online` with the same `reference` the teller entered.
- Conflicts surface as `needs_review` in the feed — staff must reconcile manually.

## Run

```powershell
# API must be up; seed data present (MEM-10001)
cd backend
powershell -ExecutionPolicy Bypass -File scripts/verify-offline-outbox.ps1
```
