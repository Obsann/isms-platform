# Task 27 — End-to-end integration pass

**Coordinator:** Obsan  
**Verify:** each portal walkthrough — login → primary action → logout — hits only real
backend endpoints (check the browser network tab). Mocked mobile money UI is allowed
where documented (Task 24 / D1).

## Prerequisites

```bash
# repo root
docker compose up -d

# backend/
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev

# frontend/
npm install
npm run dev
```

API: `http://localhost:4000/api` · Web: `http://localhost:3000`  
Seed password for all staff: `DevPassword!123`

## Portal walkthroughs

Record pass/fail and note any request that is not `localhost:4000/api` (except static assets).

| Portal | Login | Primary action | Logout / session end | Pass? |
|---|---|---|---|---|
| Super Admin | `platform` / `superadmin@platform.dev` | List tenants (`GET /api/platform/tenants` → 2) | Close session / navigate away | **PASS** 2026-09-01 |
| Tenant Admin | `tenant-a` / `admin@tenant-a.dev` | Savings summary + trial balance + statement for `MEM-10001` | | **PASS** — statement HTML contains Abebe, not fake TXN-INIT-001 |
| Teller | `tenant-a` / `teller@tenant-a.dev` | Search `MEM-10001`; deposit via audit-log + outbox scripts | | **PASS** |
| Member | `tenant-a` / `abebe.bikila@tenant-a.dev` | Own balance (1 savings account); other member → 403 | | **PASS** |

## Automated smoke (optional)

From `backend/` with API running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-rbac.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-audit-log.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-offline-outbox.ps1
```

From repo root with Docker Postgres up:

```bash
cd backend && npm run rls:check
```

## Known MVP exceptions (not defects)

- Member portal **mobile money** tab uses `frontend/src/lib/momo-mock.ts` — mocked C2B/B2C only (D1).
- Login no longer issues a mock JWT when the API is down.

## 2026-09-01 closeout note

Docker Compose Postgres healthy on host port 5532. Seed + migrations applied.

| Check | Result |
|---|---|
| `npm run rls:check` | **PASS** — tenant-a `MEM-10001..003`, tenant-b `MEM-20001` |
| `scripts/verify-rbac.ps1` | **PASS** 20/20 including report routes |
| `scripts/verify-audit-log.ps1` | **PASS** — deposit audited; GET and rejected write add no row |
| `scripts/verify-offline-outbox.ps1` | **PASS** 5/5 idempotency + `SyncConflict` |
| Trial balance | **PASS** — balanced `762.50` / `762.50` |
| Frontend `/login` | **200** |

Member self-service ownership now matches staff email to the member record (JWT `sub` is `staff_accounts.id`, not `members.id`).

## Sign-off

| Role | Name | Date | Integration pass OK? |
|---|---|---|---|
| Obsan (coordinator) | Obsan | 2026-09-01 | **PASS** (API + scripts + login page; browser click-through still for the team) |
| Melkamu | | | |
| Jerry | | | |
| Abenezer | | | |
| Biruk | | | |
| Liya | | | |
