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
| Super Admin | `platform` / `superadmin@platform.dev` | List tenants, open provisioning form | Close session / navigate away | |
| Tenant Admin | `tenant-a` / `admin@tenant-a.dev` | Members list or reports tab | | |
| Teller | `tenant-a` / `teller@tenant-a.dev` | Teller Desk: lookup `MEM-10001`, post a small deposit | | |
| Member | `tenant-a` / `abebe.bikila@tenant-a.dev` | Balance + statement views | | |

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
- `AppContext.tsx` still imports `mockData` for legacy dashboard shells — confirm teller/member flows you test do not read from it.

## Sign-off

| Role | Name | Date | Integration pass OK? |
|---|---|---|---|
| Obsan (coordinator) | | | |
| Melkamu | | | |
| Jerry | | | |
| Abenezer | | | |
| Biruk | | | |
| Liya | | | |
